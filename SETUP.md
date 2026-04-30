# MedMemory Prototype - Setup & Run Guide

## Quick Start

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- pip / venv

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd /Users/apple/Downloads/Medmemory
npm install
```

### 2. Environment Variables
The `.env` file is already configured:
```
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
VITE_API_URL=http://localhost:8000
VITE_APP_URL=http://localhost:3000
```

Update `VITE_GEMINI_API_KEY` if needed.

### 3. Start Frontend Dev Server
```bash
npm run dev
```
The app will be available at: **http://localhost:3000**

---

## Backend Setup

### 1. Create Python Virtual Environment
```bash
cd /Users/apple/Downloads/Medmemory/medmemory-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
The `.env` file is already configured:
```
DATABASE_URL=sqlite:///./medmemory.db
SECRET_KEY=your-super-secret-key-change-in-production-at-least-32-chars-long
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Optional: stores original uploaded documents in MongoDB GridFS.
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=medmemory
MONGODB_GRIDFS_BUCKET=medical_documents
MONGODB_REQUIRED=false
```

For production, change `SECRET_KEY` to a long random string.
For MongoDB Atlas, replace `MONGODB_URI` with your `mongodb+srv://...` connection string.

### 4. Start Backend Server
```bash
cd /Users/apple/Downloads/Medmemory/medmemory-backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: **http://localhost:8000**
API docs: **http://localhost:8000/docs**

---

## Usage

### 1. Access the Application
- Open browser: **http://localhost:3000**

### 2. Create Test Account
Click "Get Started" → "Sign Up" and create an account with a role (patient, doctor, lab, etc.)

### 3. Test Features
- **Patient**: View medical records, manage consent requests, check audit logs
- **Doctor/Lab/Clinic**: Search patients, upload records, request modifications
- **Admin**: Manage users, view organizations, monitor security logs

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Patient
- `GET /api/patient/records` - Get patient's medical records
- `GET /api/patient/records/{id}/file` - Download original uploaded document from MongoDB storage
- `GET /api/patient/consent` - Get pending consent requests
- `PATCH /api/patient/consent/{id}` - Approve/reject consent
- `GET /api/patient/audit` - Get audit logs

### Organization (Doctor/Lab/Clinic)
- `GET /api/org/search?patient_id=HP-PAT-XXXX` - Search patient records
- `POST /api/org/upload` - Upload new medical record
- `POST /api/org/upload-file` - Upload a clinical document with AI extraction and optional MongoDB storage
- `POST /api/org/modify-request` - Request record modification
- `POST /api/org/delete-request` - Request record deletion
- `GET /api/org/consent-status` - Check consent request status

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/orgs` - List all organizations
- `GET /api/admin/audit` - List audit logs
- `GET /api/admin/security-logs` - List security warnings/errors

### Health
- `GET /api/health` - Server health check

---

## Troubleshooting

### Port Already in Use
- Frontend: Change port in `vite.config.ts` server.port
- Backend: Use `--port 8001` with uvicorn

### CORS Issues
Backend CORS is configured for:
- `http://localhost:5173` (Vite dev default)
- `http://localhost:3000` (Current config)

### Database Issues
Delete `medmemory-backend/medmemory.db` to reset database

### Authentication Errors
- Check token is saved: `localStorage.getItem('healpath_token')`
- Verify backend is running on port 8000

---

## What's Been Fixed

✅ Environment files (.env) created
✅ Type mismatches resolved between frontend/backend
✅ API client layer (`lib/api.ts`) created
✅ AuthContext now uses real backend authentication
✅ Backend services wired up
✅ Vite configured with API proxy
✅ CORS enabled for development
✅ Database models and migrations ready

---

## Development Notes

- Frontend: React + TypeScript + Tailwind + Vite
- Backend: FastAPI + SQLAlchemy + SQLite, with optional MongoDB GridFS for document files
- Authentication: JWT tokens stored in localStorage
- Database: Auto-created on backend startup
