from __future__ import annotations

import json
import re
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from datetime import datetime as dt_util
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.crypto import decrypt_text
from app.models.user import AuditLog, AuditStatus, MedicalRecord, RecordStatus, User
from app.services.document_ai_service import (
    RISK_MODEL,
    RISK_ENGINE_NAME,
    extract_structured_data_from_text,
    fallback_extract_from_text,
    predict_risk_from_extracted,
)
from app.services.fhir_xgboost_service import CLINICAL_FEATURE_KEYS, get_fhir_model_status, get_fhir_risk_model, predict_fhir_xgboost_risk

try:
    from google import genai
except ImportError:  # pragma: no cover
    genai = None


RISK_ANALYSIS_DISCLAIMER = "AI-generated risk estimates only. Not a clinical diagnosis. Consult a licensed physician."
CACHE_TTL_MINUTES = 30
_risk_cache: dict[int, tuple[datetime, dict[str, Any]]] = {}


def _clean_json(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"```json|```", "", text).strip()
    return json.loads(cleaned)


def _risk_engine_label() -> str:
    if get_fhir_risk_model() is not None:
        return "FHIR XGBoost"
    if genai is not None and settings.effective_gemini_api_key:
        return "Gemini risk synthesis + clinical heuristic"
    return RISK_ENGINE_NAME


def invalidate_risk_cache(patient_id: int):
    """Invalidate risk analysis cache when new records are uploaded."""
    _risk_cache.pop(patient_id, None)


def _safe_float(value: Any) -> float | None:
    if value in (None, "", "Not reported"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _extract_from_readable_content(content: str, filename: str) -> dict[str, Any]:
    patterns = {
        "age": r"Age:\s*([0-9]+(?:\.[0-9]+)?)",
        "glucose": r"Glucose:\s*([0-9]+(?:\.[0-9]+)?)",
        "bp_sys": r"Blood pressure \(systolic\):\s*([0-9]+(?:\.[0-9]+)?)",
        "bp_dia": r"Blood pressure \(diastolic\):\s*([0-9]+(?:\.[0-9]+)?)",
        "hba1c": r"HbA1c:\s*([0-9]+(?:\.[0-9]+)?)",
        "cholesterol": r"Cholesterol:\s*([0-9]+(?:\.[0-9]+)?)",
        "bmi": r"BMI:\s*([0-9]+(?:\.[0-9]+)?)",
    }
    extracted: dict[str, Any] = {
        "diagnosis": [],
        "medications": [],
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, content, flags=re.IGNORECASE)
        extracted[key] = float(match.group(1)) if match else None

    diagnosis_match = re.search(r"Diagnoses:\s*(.+)", content, flags=re.IGNORECASE)
    medications_match = re.search(r"Medications:\s*(.+)", content, flags=re.IGNORECASE)
    summary_match = re.search(r"Summary:\s*(.+)", content, flags=re.IGNORECASE)

    extracted["diagnosis"] = _safe_string_list(diagnosis_match.group(1) if diagnosis_match else [])
    extracted["medications"] = _safe_string_list(medications_match.group(1) if medications_match else [])
    extracted["summary"] = summary_match.group(1).strip() if summary_match else fallback_extract_from_text(content, filename).get("summary")
    return extracted


def _extract_record_features(record: MedicalRecord) -> dict[str, Any]:
    raw_content = decrypt_text(record.content).strip()
    if not raw_content:
        return fallback_extract_from_text("", record.file_name or record.title)

    try:
        parsed = json.loads(raw_content)
        structured = parsed.get("structured_data")
        if isinstance(structured, dict):
            structured.setdefault("summary", parsed.get("summary"))
            return structured
    except json.JSONDecodeError:
        pass

    if "Clinical details" in raw_content or raw_content.lower().startswith("summary:"):
        return _extract_from_readable_content(raw_content, record.file_name or record.title)

    return extract_structured_data_from_text(raw_content, record.file_name or record.title)


def _latest_metric(records: list[dict[str, Any]], key: str) -> float | None:
    for item in records:
        value = _safe_float(item["features"].get(key))
        if value is not None:
            return value
    return None


def _feature_count(features: dict[str, Any]) -> int:
    return sum(1 for key in CLINICAL_FEATURE_KEYS if _safe_float(features.get(key)) is not None)


def _best_snapshot(enriched_records: list[dict[str, Any]], fallback_name: str) -> tuple[dict[str, Any], Any | None, int]:
    if not enriched_records:
        snapshot = fallback_extract_from_text("", fallback_name)
        return snapshot, None, _feature_count(snapshot)

    best = max(enriched_records, key=lambda item: (_feature_count(item["features"]), item["record"].date))
    snapshot = best["features"]
    return snapshot, best["record"], _feature_count(snapshot)


def _metric_trend(records: list[dict[str, Any]], key: str) -> dict[str, Any]:
    points = [
        {"date": item["record"].date.isoformat(), "value": _safe_float(item["features"].get(key))}
        for item in reversed(records)
        if _safe_float(item["features"].get(key)) is not None
    ]
    values = [point["value"] for point in points if point["value"] is not None]
    if len(values) < 2:
        return {"direction": "stable", "delta": 0, "points": points[-3:]}

    delta = values[-1] - values[0]
    if delta > 0.2:
        direction = "rising"
    elif delta < -0.2:
        direction = "falling"
    else:
        direction = "stable"
    return {"direction": direction, "delta": round(delta, 2), "points": points[-3:]}


def _risk_score_for_category(name: str, snapshot: dict[str, Any], trends: dict[str, Any]) -> tuple[int, str, str, str]:
    glucose = _safe_float(snapshot.get("glucose")) or 120
    hba1c = _safe_float(snapshot.get("hba1c")) or 5.5
    cholesterol = _safe_float(snapshot.get("cholesterol")) or 180
    bp_sys = _safe_float(snapshot.get("bp_sys")) or 120
    bmi = _safe_float(snapshot.get("bmi")) or 25

    if name == "diabetes":
        score = min(95, int((glucose - 80) * 0.35 + (hba1c - 5) * 18 + max(trends["hba1c"]["delta"], 0) * 8))
        desc = f"Glucose {glucose:.0f} and HbA1c {hba1c:.1f} are the strongest drivers in the current record set."
    elif name == "cvd":
        score = min(95, int((bp_sys - 105) * 0.45 + (cholesterol - 150) * 0.12 + max(bmi - 24, 0) * 3))
        desc = f"Systolic BP {bp_sys:.0f}, cholesterol {cholesterol:.0f}, and BMI {bmi:.1f} are shaping cardiovascular exposure."
    else:
        score = min(95, int((bp_sys - 100) * 0.15 + max(glucose - 110, 0) * 0.18 + max(bmi - 25, 0) * 2))
        desc = f"Metabolic load and blood pressure are the main signals being used for this kidney risk estimate."

    score = max(4, score)
    if score >= 60:
        level = "High"
    elif score >= 30:
        level = "Moderate"
    else:
        level = "Low"

    trend = "stable"
    if name == "diabetes":
        trend = trends["hba1c"]["direction"]
    elif name == "cvd":
        trend = trends["bp_sys"]["direction"]
    else:
        trend = "rising" if trends["glucose"]["direction"] == "rising" and bmi >= 28 else "stable"
    return score, level, trend, desc


def _level_color(level: str) -> tuple[str, str, str]:
    if level == "Insufficient":
        return "bg-slate-400", "text-slate-600", "bg-slate-50"
    if level == "High":
        return "bg-rose-500", "text-rose-600", "bg-rose-50"
    if level == "Moderate":
        return "bg-amber-500", "text-amber-600", "bg-amber-50"
    return "bg-emerald-500", "text-emerald-600", "bg-emerald-50"


def _build_record_context(enriched_records: list[dict[str, Any]]) -> str:
    lines = []
    for item in enriched_records[:8]:
        record = item["record"]
        features = item["features"]
        lines.append(
            f"- {record.date.date().isoformat()} | {record.type} | {record.title} | "
            f"summary={features.get('summary')} | glucose={features.get('glucose')} | "
            f"hba1c={features.get('hba1c')} | bp_sys={features.get('bp_sys')} | "
            f"cholesterol={features.get('cholesterol')} | diagnosis={features.get('diagnosis')} | "
            f"medications={features.get('medications')}"
        )
    return "\n".join(lines)


def _generate_summary_with_gemini(payload: dict[str, Any]) -> dict[str, Any] | None:
    if genai is None or not settings.effective_gemini_api_key:
        return None

    client = genai.Client(api_key=settings.effective_gemini_api_key)
    prompt = f"""
You are generating a patient-facing medical AI summary from already-computed ML signals.
Do not invent data. Use the supplied structured context.
This is a hybrid ML + LLM pipeline: OCR/document extraction and risk features are already computed upstream.

Return ONLY JSON:
{{
  "headline": "short title",
  "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "stable_metrics": [
    {{"label": "metric", "value": "value", "status": "status"}}
  ],
  "medications": [
    {{"name": "name", "dose": "dose or Unknown", "purpose": "purpose"}}
  ]
}}

Computed context:
{json.dumps(payload, default=str)[:14000]}
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return _clean_json(response.text)


def _generate_risk_explanations_with_gemini(payload: dict[str, Any]) -> dict[str, Any] | None:
    if genai is None or not settings.effective_gemini_api_key:
        return None

    client = genai.Client(api_key=settings.effective_gemini_api_key)
    prompt = f"""
You are generating patient-facing risk explanations from precomputed ML signals.

STRICT RULES:
- Do NOT invent symptoms, diagnoses, or medications not present in the context below
- Do NOT change numeric scores or risk levels
- If context is insufficient, say so explicitly in the description
- Only reference values explicitly present in the computed context

Return ONLY JSON:
{{
  "explainability": [
    {{"title": "title", "description": "text", "tone": "warning|positive"}}
  ],
  "action_plan": [
    {{"title": "title", "desc": "text", "status": "Priority|Recommended|Maintain", "icon": "activity|stethoscope|pill"}}
  ]
}}

Computed context:
{json.dumps(payload, default=str)[:14000]}
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return _clean_json(response.text)


def _generate_risk_scores_with_gemini(payload: dict[str, Any]) -> dict[str, Any] | None:
    if genai is None or not settings.effective_gemini_api_key:
        return None

    client = genai.Client(api_key=settings.effective_gemini_api_key)
    prompt = f"""
You are generating patient-facing predictive risk scores from extracted clinical record features.

STRICT RULES:
- This is not a diagnosis. Use cautious risk estimates only.
- Do NOT invent values, symptoms, diagnoses, or medications.
- Base scores only on extracted values, trends, diagnoses, medications, and the provided heuristic baseline.
- Return score integers from 0 to 100.
- Risk level must be one of: Low, Moderate, High, Insufficient.
- Keep the same risk ids: cvd, diabetes, kidney.
- If extracted evidence is weak, prefer Insufficient or Low/Moderate with clear evidence limits.

Return ONLY JSON:
{{
  "overall": {{"score": 0, "level": "Low|Moderate|High|Insufficient", "confidence": "short confidence label"}},
  "risks": [
    {{
      "id": "cvd|diabetes|kidney",
      "score": 0,
      "level": "Low|Moderate|High|Insufficient",
      "trend": "rising|falling|stable",
      "desc": "short patient-facing explanation",
      "evidence": ["short evidence item", "short evidence item"]
    }}
  ]
}}

Computed context:
{json.dumps(payload, default=str)[:14000]}
"""
    response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    return _clean_json(response.text)


def _fallback_summary(user: User, snapshot: dict[str, Any], trends: dict[str, Any], diagnoses: list[str], medications: list[str]) -> dict[str, Any]:
    glucose = _safe_float(snapshot.get("glucose"))
    hba1c = _safe_float(snapshot.get("hba1c"))
    bp_sys = _safe_float(snapshot.get("bp_sys"))
    bp_dia = _safe_float(snapshot.get("bp_dia"))
    cholesterol = _safe_float(snapshot.get("cholesterol"))
    bmi = _safe_float(snapshot.get("bmi"))

    diagnosis_line = ", ".join(diagnoses) if diagnoses else "no clearly extracted chronic diagnoses"
    med_items = [{"name": med.title(), "dose": "From records", "purpose": "Ongoing therapy"} for med in medications[:3]]
    if not med_items:
        med_items = [{"name": "No medication extracted", "dose": "Unknown", "purpose": "Review required"}]

    paragraphs = [
        f"{user.name} has {diagnosis_line} reflected across the available medical record timeline, with the latest synthesis built from uploaded clinical documents and structured feature extraction.",
        f"The strongest recent signal is HbA1c trend {trends['hba1c']['direction']}. Latest extracted values include glucose {glucose if glucose is not None else 'not reported'} and HbA1c {hba1c if hba1c is not None else 'not reported'}.",
        f"Cardiometabolic monitoring remains centered on blood pressure {bp_sys if bp_sys is not None else 'not reported'}/{bp_dia if bp_dia is not None else 'not reported'}, cholesterol {cholesterol if cholesterol is not None else 'not reported'}, and BMI {bmi if bmi is not None else 'not reported'}.",
    ]

    stable_metrics = [
        {"label": "Systolic BP", "value": f"{bp_sys:.0f} mmHg" if bp_sys is not None else "Not reported", "status": "Stable" if trends["bp_sys"]["direction"] == "stable" else trends["bp_sys"]["direction"].title()},
        {"label": "Body Mass Index", "value": f"{bmi:.1f}" if bmi is not None else "Not reported", "status": "Stable"},
        {"label": "Total Cholesterol", "value": f"{cholesterol:.0f} mg/dL" if cholesterol is not None else "Not reported", "status": "Observed"},
    ]

    return {
        "headline": "Patient Health Status & Trend",
        "paragraphs": paragraphs,
        "stable_metrics": stable_metrics,
        "medications": med_items,
    }


def _fallback_risk_details(risks: list[dict[str, Any]]) -> dict[str, Any]:
    explainability = []
    for risk in risks[:2]:
        tone = "warning" if risk["level"] != "Low" else "positive"
        explainability.append({
            "title": f"{risk['name']} ({risk['level']} Risk)",
            "description": risk["desc"],
            "tone": tone,
        })

    action_plan = [
        {"title": "Refresh diet and glucose tracking", "desc": "Use the extracted glucose and HbA1c trend as the primary follow-up signal over the next review window.", "status": "Priority", "icon": "activity"},
        {"title": "Clinical review", "desc": "Bring this AI summary and the supporting medical record timeline to the next physician consultation.", "status": "Recommended", "icon": "stethoscope"},
        {"title": "Medication continuity", "desc": "Keep current therapies consistent unless a clinician updates the plan after reviewing the trend signals.", "status": "Maintain", "icon": "pill"},
    ]
    return {"explainability": explainability, "action_plan": action_plan}


def _normalize_llm_level(level: Any) -> str:
    normalized = str(level or "").strip().title()
    if normalized == "Medium":
        return "Moderate"
    if normalized in {"Low", "Moderate", "High", "Insufficient"}:
        return normalized
    return "Low"


def _apply_llm_risk_scores(
    generated: dict[str, Any] | None,
    risks: list[dict[str, Any]],
    overall_level: str,
    overall_confidence: str,
    overall_score: int,
) -> tuple[str, str, int, list[dict[str, Any]], bool]:
    if not generated:
        return overall_level, overall_confidence, overall_score, risks, False

    generated_risks = generated.get("risks")
    generated_overall = generated.get("overall")
    if not isinstance(generated_risks, list) or not isinstance(generated_overall, dict):
        return overall_level, overall_confidence, overall_score, risks, False

    risk_by_id = {risk["id"]: risk for risk in risks}
    for generated_risk in generated_risks:
        if not isinstance(generated_risk, dict):
            continue
        risk_id = generated_risk.get("id")
        existing = risk_by_id.get(risk_id)
        if existing is None:
            continue

        level = _normalize_llm_level(generated_risk.get("level"))
        score = clamp_score(generated_risk.get("score"))
        color, text, bg = _level_color(level)
        existing.update({
            "score": score,
            "level": level,
            "color": color,
            "text": text,
            "bg": bg,
            "desc": str(generated_risk.get("desc") or existing["desc"]),
            "trend": str(generated_risk.get("trend") or existing["trend"]).lower(),
            "evidence": _safe_string_list(generated_risk.get("evidence")) or existing["evidence"],
        })

    overall_level = _normalize_llm_level(generated_overall.get("level"))
    overall_score = clamp_score(generated_overall.get("score"))
    overall_confidence = f"Gemini synthesis: {generated_overall.get('confidence') or 'clinical-context confidence'}"
    return overall_level, overall_confidence, overall_score, risks, True


def clamp_score(value: Any) -> int:
    score = _safe_float(value)
    if score is None:
        return 0
    return min(100, max(0, round(score)))


def build_patient_ai_summary(patient: User, db: Session) -> dict[str, Any]:
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient.id, MedicalRecord.status == RecordStatus.active)
        .order_by(MedicalRecord.date.desc(), MedicalRecord.created_at.desc())
        .all()
    )

    enriched_records = [{"record": record, "features": _extract_record_features(record)} for record in records]
    snapshot, _, _ = _best_snapshot(enriched_records, patient.hp_id or patient.name)
    trends = {
        "glucose": _metric_trend(enriched_records, "glucose"),
        "hba1c": _metric_trend(enriched_records, "hba1c"),
        "bp_sys": _metric_trend(enriched_records, "bp_sys"),
    }
    diagnoses = sorted({diagnosis.title() for item in enriched_records for diagnosis in _safe_string_list(item["features"].get("diagnosis"))})
    medications = sorted({med.title() for item in enriched_records for med in _safe_string_list(item["features"].get("medications"))})

    payload = {
        "patient_name": patient.name,
        "record_count": len(enriched_records),
        "latest_snapshot": snapshot,
        "trends": trends,
        "diagnoses": diagnoses,
        "medications": medications,
        "record_context": _build_record_context(enriched_records),
        "risk_model": _risk_engine_label(),
    }

    summary = _generate_summary_with_gemini(payload) or _fallback_summary(patient, snapshot, trends, diagnoses, medications)
    summary["model_metadata"] = {
        "llm": "Gemini 2.5 Flash" if settings.effective_gemini_api_key else "Unavailable",
        "risk_engine": _risk_engine_label(),
        "document_pipeline": ["RapidOCR", "PyMuPDF", "regex feature extraction"],
        "records_analyzed": len(enriched_records),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    return summary


def _build_patient_risk_analysis_payload(patient: User, db: Session) -> dict[str, Any]:
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient.id, MedicalRecord.status == RecordStatus.active)
        .order_by(MedicalRecord.date.desc(), MedicalRecord.created_at.desc())
        .all()
    )
    enriched_records = [{"record": record, "features": _extract_record_features(record)} for record in records]
    snapshot, snapshot_record, snapshot_feature_count = _best_snapshot(enriched_records, patient.hp_id or patient.name)
    trends = {
        "glucose": _metric_trend(enriched_records, "glucose"),
        "hba1c": _metric_trend(enriched_records, "hba1c"),
        "bp_sys": _metric_trend(enriched_records, "bp_sys"),
    }
    diagnoses = sorted({diagnosis.title() for item in enriched_records for diagnosis in _safe_string_list(item["features"].get("diagnosis"))})
    medications = sorted({med.title() for item in enriched_records for med in _safe_string_list(item["features"].get("medications"))})

    xgb_prediction = predict_fhir_xgboost_risk(snapshot)
    xgboost_status = get_fhir_model_status()
    if xgb_prediction is not None:
        overall_level = xgb_prediction.label
        overall_confidence = f"XGBoost {xgb_prediction.confidence}"
        overall_score = xgb_prediction.score
    elif snapshot_feature_count < 2:
        overall_level = "Insufficient"
        overall_confidence = "Need at least two extracted clinical metrics"
        overall_score = 0
    else:
        overall_level, overall_confidence = predict_risk_from_extracted(snapshot)
        overall_score = {"Low": 18, "Medium": 48, "High": 78}.get(overall_level, 18)

    risks = []
    for risk_id, label in [("cvd", "Cardiovascular Risk"), ("diabetes", "Diabetes Progression"), ("kidney", "Kidney Disease Risk")]:
        if snapshot_feature_count < 2:
            score, level, trend = 0, "Insufficient", "stable"
            desc = "There are not enough extracted clinical measurements to generate a patient-specific estimate."
            color, text, bg = "bg-slate-400", "text-slate-600", "bg-slate-50"
            evidence = ["Upload or approve records with values such as glucose, HbA1c, blood pressure, BMI, or cholesterol."]
        else:
            score, level, trend, desc = _risk_score_for_category(risk_id, snapshot, trends)
            color, text, bg = _level_color(level)
            evidence = []
            if risk_id == "diabetes":
                evidence = [f"HbA1c trend is {trends['hba1c']['direction']}", f"Latest glucose: {_latest_metric(enriched_records, 'glucose') or 'Not reported'}"]
            elif risk_id == "cvd":
                evidence = [f"Latest systolic BP: {_latest_metric(enriched_records, 'bp_sys') or 'Not reported'}", f"Latest cholesterol: {_latest_metric(enriched_records, 'cholesterol') or 'Not reported'}"]
            else:
                evidence = [f"BMI: {_latest_metric(enriched_records, 'bmi') or 'Not reported'}", f"Glucose trend: {trends['glucose']['direction']}"]
        risks.append({
            "id": risk_id,
            "name": label,
            "score": score,
            "level": level,
            "color": color,
            "text": text,
            "bg": bg,
            "desc": desc,
            "trend": trend,
            "evidence": evidence,
        })

    payload = {
        "patient_name": patient.name,
        "overall_level": overall_level,
        "overall_confidence": overall_confidence,
        "overall_score": overall_score,
        "latest_snapshot": snapshot,
        "snapshot_record": {
            "id": snapshot_record.id,
            "title": snapshot_record.title,
            "date": snapshot_record.date.isoformat(),
        } if snapshot_record is not None else None,
        "snapshot_feature_count": snapshot_feature_count,
        "xgboost_prediction": xgb_prediction.probabilities if xgb_prediction is not None else None,
        "xgboost_status": xgboost_status,
        "trends": trends,
        "diagnoses": diagnoses,
        "medications": medications,
        "risks": risks,
        "record_context": _build_record_context(enriched_records),
        "risk_engine": _risk_engine_label(),
    }
    llm_scores_used = False
    if xgb_prediction is None and snapshot_feature_count >= 2:
        llm_scores = _generate_risk_scores_with_gemini({
            **payload,
            "heuristic_overall": {
                "score": overall_score,
                "level": overall_level,
                "confidence": overall_confidence,
            },
            "heuristic_risks": risks,
        })
        overall_level, overall_confidence, overall_score, risks, llm_scores_used = _apply_llm_risk_scores(
            llm_scores,
            risks,
            overall_level,
            overall_confidence,
            overall_score,
        )
        payload.update({
            "overall_level": overall_level,
            "overall_confidence": overall_confidence,
            "overall_score": overall_score,
            "risks": risks,
            "llm_scores_used": llm_scores_used,
        })

    generated = _generate_risk_explanations_with_gemini(payload) or _fallback_risk_details(risks)

    result = {
        "headline": "Predictive Risk Analysis",
        "subheadline": "Hybrid ML + Gemini pipeline based on longitudinal patient records.",
        "analysis_node": "HP-XG-77",
        "disclaimer": RISK_ANALYSIS_DISCLAIMER,
        "overall": {
            "score": overall_score,
            "level": overall_level,
            "confidence": overall_confidence,
        },
        "risks": risks,
        "explainability": generated["explainability"],
        "action_plan": generated["action_plan"],
        "model_metadata": {
            "llm": "Gemini 2.5 Flash" if settings.effective_gemini_api_key else "Unavailable",
            "risk_engine": _risk_engine_label(),
            "records_analyzed": len(enriched_records),
            "snapshot_record_id": snapshot_record.id if snapshot_record is not None else None,
            "snapshot_feature_count": snapshot_feature_count,
            "xgboost_probabilities": xgb_prediction.probabilities if xgb_prediction is not None else None,
            "xgboost_dataset": xgb_prediction.model_metadata if xgb_prediction is not None else None,
            "xgboost_status": xgboost_status,
            "llm_risk_scores_used": llm_scores_used,
            "features_used": [key for key in ["age", "glucose", "bp_sys", "bp_dia", "hba1c", "cholesterol", "bmi"] if snapshot.get(key) is not None],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    db.add(AuditLog(
        user_id=patient.id,
        user_name=patient.name,
        action="AI_RISK_ANALYSIS_GENERATED",
        resource_id=str(patient.id),
        details=(
            f"Overall: {overall_level} ({overall_score}) | "
            f"Engine: {_risk_engine_label()} | "
            f"Records: {len(enriched_records)} | "
            f"Gemini: {'yes' if settings.effective_gemini_api_key else 'no'}"
        ),
        status=AuditStatus.success,
        timestamp=datetime.now(timezone.utc),
    ))
    db.commit()
    return result


def build_patient_risk_analysis(patient: User, db: Session) -> dict[str, Any]:
    """Build risk analysis with 30-min TTL caching."""
    cached = _risk_cache.get(patient.id)
    now = datetime.now(timezone.utc)
    if cached:
        cached_at, data = cached
        if now - cached_at < timedelta(minutes=CACHE_TTL_MINUTES):
            return deepcopy(data)
    
    result = _build_patient_risk_analysis_payload(patient, db)
    _risk_cache[patient.id] = (now, deepcopy(result))
    return result
