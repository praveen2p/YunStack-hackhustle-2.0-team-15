from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import numpy as np

from app.core.config import settings

try:
    from xgboost import XGBClassifier
    XGBOOST_IMPORT_ERROR = None
except Exception as exc:  # pragma: no cover
    XGBClassifier = None
    XGBOOST_IMPORT_ERROR = str(exc)


FEATURE_KEYS = [
    "age",
    "is_male",
    "healthcare_expenses",
    "healthcare_coverage",
    "glucose",
    "bp_sys",
    "bp_dia",
    "hba1c",
    "bmi",
    "cholesterol",
]
CLASSES = ["Low", "Medium", "High"]
OBSERVATION_FEATURES = {
    "glucose": "glucose",
    "systolic blood pressure": "bp_sys",
    "diastolic blood pressure": "bp_dia",
    "hemoglobin a1c/hemoglobin.total in blood": "hba1c",
    "body mass index": "bmi",
    "total cholesterol": "cholesterol",
}
HIGH_RISK_TERMS = (
    "diabetes",
    "coronary heart disease",
    "congestive heart failure",
    "stroke",
    "myocardial infarction",
    "chronic kidney",
)
MEDIUM_RISK_TERMS = (
    "prediabetes",
    "hypertension",
    "hyperlipidemia",
    "obesity",
    "metabolic syndrome",
    "hypertriglyceridemia",
)
CLINICAL_FEATURE_KEYS = ("glucose", "bp_sys", "bp_dia", "hba1c", "bmi", "cholesterol")


@dataclass
class FhirRiskModel:
    model: Any
    medians: dict[str, float]
    rows_trained: int
    high_count: int
    medium_count: int
    low_count: int


@dataclass
class FhirRiskPrediction:
    label: str
    score: int
    confidence: str
    probabilities: dict[str, float]
    features_used: list[str]
    model_metadata: dict[str, Any]


_MODEL: FhirRiskModel | None = None
_MODEL_ERROR: str | None = None


def _safe_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _age_from_birthdate(value: str) -> float | None:
    if not value:
        return None
    try:
        born = datetime.strptime(value[:10], "%Y-%m-%d").date()
    except ValueError:
        return None
    today = date.today()
    return float(today.year - born.year - ((today.month, today.day) < (born.month, born.day)))


def _dataset_dir() -> Path:
    return Path(settings.FHIR_DATASET_DIR).expanduser()


def _latest_observation_features(path: Path) -> dict[str, dict[str, float]]:
    features: dict[str, dict[str, float]] = {}
    latest_dates: dict[tuple[str, str], str] = {}
    if not path.exists():
        return features

    with path.open(newline="", errors="ignore") as file:
        for row in csv.DictReader(file):
            patient_id = row.get("PATIENT", "")
            desc = (row.get("DESCRIPTION") or "").strip().lower()
            feature_key = OBSERVATION_FEATURES.get(desc)
            if not patient_id or not feature_key:
                continue
            value = _safe_float(row.get("VALUE"))
            if value is None:
                continue
            obs_date = row.get("DATE", "")
            latest_key = (patient_id, feature_key)
            if latest_key in latest_dates and obs_date <= latest_dates[latest_key]:
                continue
            latest_dates[latest_key] = obs_date
            features.setdefault(patient_id, {})[feature_key] = value
    return features


def _condition_labels(path: Path) -> dict[str, int]:
    labels: dict[str, int] = {}
    if not path.exists():
        return labels

    with path.open(newline="", errors="ignore") as file:
        for row in csv.DictReader(file):
            patient_id = row.get("PATIENT", "")
            desc = (row.get("DESCRIPTION") or "").lower()
            if not patient_id:
                continue
            current = labels.get(patient_id, 0)
            if any(term in desc for term in HIGH_RISK_TERMS):
                labels[patient_id] = 2
            elif current < 1 and any(term in desc for term in MEDIUM_RISK_TERMS):
                labels[patient_id] = 1
    return labels


def _patient_rows(path: Path, observations: dict[str, dict[str, float]], labels: dict[str, int]) -> tuple[np.ndarray, np.ndarray, dict[str, float]]:
    rows: list[list[float | None]] = []
    targets: list[int] = []
    if not path.exists():
        return np.empty((0, len(FEATURE_KEYS))), np.empty((0,)), {}

    with path.open(newline="", errors="ignore") as file:
        for row in csv.DictReader(file):
            patient_id = row.get("Id", "")
            patient_features = {
                "age": _age_from_birthdate(row.get("BIRTHDATE", "")),
                "is_male": 1.0 if row.get("GENDER") == "M" else 0.0,
                "healthcare_expenses": _safe_float(row.get("HEALTHCARE_EXPENSES")),
                "healthcare_coverage": _safe_float(row.get("HEALTHCARE_COVERAGE")),
                **observations.get(patient_id, {}),
            }
            rows.append([patient_features.get(key) for key in FEATURE_KEYS])
            targets.append(labels.get(patient_id, 0))

    raw = np.array(rows, dtype=float)
    medians: dict[str, float] = {}
    for index, key in enumerate(FEATURE_KEYS):
        column = raw[:, index]
        valid = column[~np.isnan(column)]
        medians[key] = float(np.median(valid)) if valid.size else 0.0
        column[np.isnan(column)] = medians[key]
        raw[:, index] = column
    return raw, np.array(targets, dtype=int), medians


def get_fhir_risk_model() -> FhirRiskModel | None:
    global _MODEL, _MODEL_ERROR
    if _MODEL is not None:
        return _MODEL
    if XGBClassifier is None:
        _MODEL_ERROR = XGBOOST_IMPORT_ERROR or "xgboost is not installed"
        return None

    data_dir = _dataset_dir()
    observations = _latest_observation_features(data_dir / "observations.csv")
    labels = _condition_labels(data_dir / "conditions.csv")
    x_train, y_train, medians = _patient_rows(data_dir / "patients.csv", observations, labels)
    if x_train.shape[0] < 50:
        _MODEL_ERROR = f"FHIR training dataset has only {x_train.shape[0]} rows"
        return None
    if len(set(y_train.tolist())) < 2:
        _MODEL_ERROR = "FHIR training dataset needs at least two risk classes"
        return None

    try:
        model = XGBClassifier(
            n_estimators=120,
            max_depth=3,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=42,
        )
        model.fit(x_train, y_train)
    except Exception as exc:  # pragma: no cover
        _MODEL_ERROR = str(exc)
        return None

    _MODEL = FhirRiskModel(
        model=model,
        medians=medians,
        rows_trained=int(x_train.shape[0]),
        high_count=int(np.sum(y_train == 2)),
        medium_count=int(np.sum(y_train == 1)),
        low_count=int(np.sum(y_train == 0)),
    )
    _MODEL_ERROR = None
    return _MODEL


def get_fhir_model_status() -> dict[str, Any]:
    data_dir = _dataset_dir()
    files = {name: data_dir / name for name in ("patients.csv", "observations.csv", "conditions.csv")}
    return {
        "engine": "XGBoost trained on local FHIR CSV dataset",
        "dataset_dir": str(data_dir),
        "xgboost_available": XGBClassifier is not None,
        "model_loaded": _MODEL is not None,
        "unavailable_reason": _MODEL_ERROR or XGBOOST_IMPORT_ERROR,
        "dataset_files": {
            name: {
                "exists": path.exists(),
                "size": path.stat().st_size if path.exists() else 0,
            }
            for name, path in files.items()
        },
    }


def predict_fhir_xgboost_risk(extracted: dict[str, Any]) -> FhirRiskPrediction | None:
    model_bundle = get_fhir_risk_model()
    if model_bundle is None:
        return None

    clinical_features_used = [key for key in CLINICAL_FEATURE_KEYS if _safe_float(extracted.get(key)) is not None]
    if len(clinical_features_used) < 2:
        return None

    feature_values: list[float] = []
    features_used: list[str] = []
    for key in FEATURE_KEYS:
        value = _safe_float(extracted.get(key))
        if value is None:
            value = model_bundle.medians[key]
        else:
            features_used.append(key)
        feature_values.append(value)

    probabilities_raw = model_bundle.model.predict_proba(np.array([feature_values], dtype=float))[0]
    best_index = int(np.argmax(probabilities_raw))
    probabilities = {CLASSES[index]: round(float(probability), 4) for index, probability in enumerate(probabilities_raw)}
    label = CLASSES[best_index]
    score = {"Low": 22, "Medium": 52, "High": 82}[label]
    return FhirRiskPrediction(
        label=label,
        score=score,
        confidence=f"{round(float(probabilities_raw[best_index]) * 100, 1)}%",
        probabilities=probabilities,
        features_used=features_used,
        model_metadata={
            "engine": "XGBoost trained on local FHIR CSV dataset",
            "dataset_dir": str(_dataset_dir()),
            "rows_trained": model_bundle.rows_trained,
            "label_distribution": {
                "Low": model_bundle.low_count,
                "Medium": model_bundle.medium_count,
                "High": model_bundle.high_count,
            },
        },
    )
