# MedMemory

MedMemory is a full-stack medical record and consent management platform with AI-assisted clinical summarization and predictive risk analysis. It is built as a prototype for a healthcare interoperability problem: patients often have records spread across hospitals, labs, clinics, and pharmacies, while providers need timely access to trustworthy history without bypassing patient consent.

The system gives patients a single health record hub, lets verified healthcare organizations request access or upload new records, and keeps every sensitive action visible through audit logs. On top of the record layer, MedMemory extracts clinical signals from uploaded documents and generates patient-facing summaries, timelines, and risk analysis.

## Problem Statement

Healthcare data is usually fragmented across multiple providers. This creates several issues:

- Patients do not have a clear view of their complete medical history.
- Doctors, labs, pharmacies, and clinics may need records, but access must be controlled by the patient.
- Uploaded reports are often unstructured documents, making it hard to quickly extract values like glucose, HbA1c, blood pressure, BMI, and cholesterol.
- Patients need understandable summaries and risk signals, not raw clinical text alone.
- Any AI use in healthcare must be transparent, auditable, and clearly presented as informational rather than diagnostic.

## Our Approach

MedMemory tackles the problem with a consent-first architecture:

1. Patients own the central record view.
2. Organizations can search by patient HP-ID and request consent for uploads, modifications, or deletions.
3. Every access, upload, consent action, and AI analysis is recorded in audit logs.
4. Uploaded clinical documents are processed into structured medical features.
5. AI summaries and risk analysis are generated from extracted evidence, not free-form guesses.
6. Risk analysis uses the strongest available engine:
   - FHIR XGBoost model trained from the local 1.1k-row dataset when XGBoost is available.
   - Gemini risk synthesis when XGBoost cannot run but clinical features are present.
   - Clinical threshold heuristics as a deterministic fallback.

## Key Features

- Role-based login for patients, doctors, labs, pharmacies, clinics, and admins.
- Patient dashboard for records, notifications, consent requests, audit logs, timeline, AI summary, and risk analysis.
- Organization dashboard for patient search, record upload, access logs, and consent status.
- Admin dashboard for user management, organization monitoring, audit monitoring, security logs, and analytics.
- Consent workflow for uploads, modifications, and deletion requests.
- Document upload with AI extraction and optional MongoDB GridFS storage.
- Predictive risk analysis with medical disclaimer, explainability blocks, and generated action plans.
- JWT authentication with automatic expired-token handling.
- SQLite development database with FastAPI backend and React frontend.

## AI Agents Used

MedMemory uses a set of task-focused AI agents/intelligent services. They are not exposed as chatbots; they run inside the backend workflow and each agent has a specific responsibility.

| Agent / Service | Technology | Purpose |
|-----------------|------------|---------|
| Document Extraction Agent | Gemini + PyMuPDF + RapidOCR + regex fallback | Reads uploaded clinical files, extracts text, detects clinical values, and converts unstructured reports into structured fields. |
| Clinical Feature Agent | Python feature extraction | Normalizes values such as glucose, HbA1c, systolic/diastolic BP, BMI, cholesterol, diagnoses, medications, and summaries. |
| Patient Summary Agent | Gemini 2.5 Flash with guarded prompts | Generates patient-facing medical summaries from already extracted record evidence. |
| Risk Scoring Agent | FHIR XGBoost + clinical heuristic fallback | Predicts overall risk from the local FHIR CSV dataset when XGBoost is available, otherwise uses deterministic clinical thresholds. |
| Gemini Risk Synthesis Agent | Gemini 2.5 Flash | Produces risk scores when XGBoost cannot run but enough clinical features exist. It is instructed not to invent medical facts. |
| Explainability Agent | Gemini 2.5 Flash | Converts computed risk signals into explanation blocks and generated health-path actions. |
| Audit & Safety Agent | Backend audit service | Logs AI risk generation, consent actions, uploads, and access events so the AI workflow remains traceable. |

The AI flow is designed with fallback layers. If Gemini is unavailable, the system still uses deterministic extraction and heuristic risk scoring. If XGBoost is unavailable because the local native library cannot load, the risk page can still use Gemini risk synthesis or the clinical heuristic.

## AI and Risk Analysis Pipeline

The risk analysis page is intentionally evidence-driven.

```text
Provider uploads record
    -> backend extracts structured clinical data
    -> patient approves consent
    -> active records are analyzed
    -> risk engine computes scores
    -> Gemini generates explanations/action plan when configured
    -> audit log records AI_RISK_ANALYSIS_GENERATED
    -> result is cached for 30 minutes
```

The project includes a FHIR XGBoost service that reads:

- `patients.csv`
- `observations.csv`
- `conditions.csv`

By default, the dataset path is configured as:

```env
FHIR_DATASET_DIR=/Users/apple/Downloads/csv
```

If the local XGBoost native library cannot load, MedMemory does not break the risk page. It falls back to Gemini risk synthesis if `GEMINI_API_KEY` is available, then to clinical heuristics if not.

On macOS, XGBoost may require OpenMP:

```bash
brew install libomp
```

Restart the backend after fixing the XGBoost/OpenMP environment.

## Tech Stack

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide icons
- Motion

Backend:

- FastAPI
- SQLAlchemy
- SQLite
- JWT auth
- Gemini API
- XGBoost
- Optional MongoDB GridFS for original document storage

## Project Structure

```text
src/
  components/          Shared layout and UI components
  context/             Auth context
  lib/                 API client and helpers
  pages/
    patient/           Patient dashboard, records, AI summary, risk analysis
    third-party/       Doctor/lab/clinic/pharmacy workflows
    admin/             Admin monitoring and management
    auth/              Login, registration, role selection

medmemory-backend/
  app/
    api/routes/        FastAPI route handlers
    core/              Config, database, auth dependencies, crypto
    models/            SQLAlchemy models
    schemas/           Pydantic schemas
    services/          Auth, record, consent, AI, XGBoost, admin services
  medmemory.db         Local SQLite database
  requirements.txt     Python dependencies
```

## Run Locally

### Prerequisites

- Node.js 18+
- Python 3.10+
- pip and venv
- Optional: MongoDB if you want original uploaded files stored in GridFS
- Optional: Gemini API key for LLM summaries and explanations

### 1. Install Frontend Dependencies

```bash
cd /Users/apple/Downloads/Medmemory
npm install
```

### 2. Configure Frontend Environment

Create or update `.env` in the project root:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_gemini_key_if_needed
```

### 3. Install Backend Dependencies

```bash
cd /Users/apple/Downloads/Medmemory/medmemory-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure Backend Environment

Create or update `medmemory-backend/.env`:

```env
DATABASE_URL=sqlite:///./medmemory.db
SECRET_KEY=change-this-to-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256
GEMINI_API_KEY=your_gemini_key_if_available
FHIR_DATASET_DIR=/Users/apple/Downloads/csv

MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=medmemory
MONGODB_GRIDFS_BUCKET=medical_documents
MONGODB_REQUIRED=false
```

### 5. Start Backend

```bash
cd /Users/apple/Downloads/Medmemory/medmemory-backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### 6. Start Frontend

In a second terminal:

```bash
cd /Users/apple/Downloads/Medmemory
npm run dev
```

Frontend:

- App: `http://localhost:3000`

## Main Workflows

Patient:

- Register or log in as a patient.
- View records, timeline, consent requests, notifications, and audit logs.
- Open AI Summary to see a patient-facing synthesis of uploaded records.
- Open Risk Analysis to see risk scores, evidence, explanations, and generated health path.

Doctor/Lab/Clinic/Pharmacy:

- Log in with an organization role.
- Search a patient by HP-ID.
- Upload medical records or clinical documents.
- Track consent approval status.
- Request record modifications or deletions.

Admin:

- Manage users and organizations.
- Monitor audit events and security logs.
- Review platform analytics.

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`

Patient:

- `GET /api/patient/dashboard`
- `GET /api/patient/records`
- `GET /api/patient/records/{id}/file`
- `GET /api/patient/summary-insights`
- `GET /api/patient/risk-analysis`
- `GET /api/patient/timeline`
- `GET /api/patient/consent`
- `PATCH /api/patient/consent/{id}`
- `GET /api/patient/audit`

Organization:

- `GET /api/org/dashboard`
- `GET /api/org/search?patient_id=HP-PAT-XXXX`
- `POST /api/org/upload`
- `POST /api/org/upload-file`
- `POST /api/org/modify-request`
- `POST /api/org/delete-request`
- `GET /api/org/consent-status`
- `GET /api/org/audit`

Admin:

- `GET /api/admin/users`
- `GET /api/admin/orgs`
- `GET /api/admin/audit`
- `GET /api/admin/security-logs`

Health:

- `GET /api/health`

## Verification

Frontend checks:

```bash
npm run lint
npm run build
```

Backend syntax check:

```bash
cd medmemory-backend
python3 -m compileall app
```

Check the risk engine status from Python:

```bash
cd medmemory-backend
source venv/bin/activate
python - <<'PY'
from app.services.fhir_xgboost_service import get_fhir_risk_model, get_fhir_model_status
print("model_loaded=", get_fhir_risk_model() is not None)
print(get_fhir_model_status())
PY
```

## Troubleshooting

Invalid or expired token:

- Log in again.
- The frontend clears expired JWTs automatically and redirects protected routes back to login.

Backend not reachable:

- Make sure FastAPI is running on port `8000`.
- Confirm Vite proxy/API calls target `/api/*`.

XGBoost not loading:

- Confirm `FHIR_DATASET_DIR` points to the CSV folder.
- On macOS, install OpenMP with `brew install libomp`.
- Restart the backend after changing native libraries or Python packages.

Reset local database:

```bash
rm medmemory-backend/medmemory.db
```

Use this only when you intentionally want to delete local data.

## Medical Safety Note

MedMemory's AI outputs are for informational and demonstration purposes only. Risk analysis is not a medical diagnosis and should not replace clinical judgment. The UI displays a disclaimer and the backend keeps AI generation auditable.
