# MedMemory Frontend - Doctor Dashboard Guide

## Current Status
✅ **Backend**: Running on `http://localhost:8000`
✅ **Frontend**: Run with `npm run dev` and open the Vite URL shown in the terminal
✅ **Database**: SQLite with all tables created
✅ **API Integration**: Fixed and working

## Quick Access

### Step 1: Open the Application
Navigate to the frontend URL shown by Vite, usually **http://localhost:3000**

### Step 2: Login as Doctor
1. Click "Get Started"
2. Select "Doctor" role
3. Click "Login"
4. Pre-filled email: `dr.smith@hospital.com`
5. Password: `password123`
6. Click "Secure Login"

### Step 3: Doctor Dashboard
Once logged in, you'll see the **Doctor Dashboard** at `/doctor` with:

**Statistics Cards:**
- 📊 Total Patients: Count of unique patients you've interacted with
- 📤 Records Uploaded: Medical records you've uploaded
- ⏳ Pending Approval: Waiting for patient consent
- ✅ Approved Requests: Patient-approved records

**Main Features:**

1. **Recent Patients Section**
   - Search patients by HP-ID (e.g., `HP-PAT-DB0C`)
   - View recent patient records
   - Filter and manage interactions

2. **New Patient File Button**
   - Upload medical records
   - Attach documents
   - Request modifications/deletions

3. **Consent Requests**
   - View pending upload approvals
   - Track status of requests
   - Monitor patient responses

4. **Quick Actions**
   - Search Patient
   - Upload Record
   - Request Modify
   - Request Delete
   - View Consent Status

## Test Data

### Test Accounts Created:
- **Patient**: john.doe@email.com / password123 (HP-ID: HP-PAT-DEMO)
- **Doctor**: dr.smith@hospital.com / password123
- **Admin**: admin@memora.ai / password123

### Test Workflow:
1. Doctor uploads a medical record → Creates consent request
2. Patient receives notification → Pending consent
3. Patient approves consent → Record becomes active
4. Doctor can view approved records

## Available Doctor Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/org/dashboard` | GET | Get dashboard statistics |
| `/api/org/search` | GET | Search patient by HP-ID |
| `/api/org/upload` | POST | Upload medical record |
| `/api/org/upload-file` | POST | Upload document file |
| `/api/org/modify-request` | POST | Request modification |
| `/api/org/delete-request` | POST | Request deletion |
| `/api/org/consent-status` | GET | View consent requests |
| `/api/org/audit` | GET | View access logs |

## Frontend API Integration

All API calls now use the **Vite proxy**:
- Requests to `/api/*` are automatically proxied to backend
- No CORS issues in development
- JWT tokens automatically sent with each request
- Error handling with descriptive messages

## Troubleshooting

### Issue: "Failed to fetch dashboard"
**Solution**: 
- Verify backend is running on port 8000
- Check browser console (F12) for network errors
- Ensure JWT token is valid

### Issue: Patient not found
**Solution**:
- Use correct HP-ID format: `HP-PAT-XXXX`
- Make sure patient exists in database
- Check if logged in as doctor

### Issue: CORS errors
**Solution**:
- These should not appear with the Vite proxy
- Clear browser cache (Ctrl+Shift+Delete)
- Restart frontend dev server

## Browser DevTools

To debug:
1. Open DevTools: F12
2. Go to Network tab
3. Perform action
4. Check `/api/org/*` requests
5. View response in Response tab

## Next Steps

Try these actions:
1. ✅ View dashboard statistics
2. ✅ Search for a patient
3. ✅ Upload a medical record
4. ✅ Check consent requests
5. ✅ View audit logs
