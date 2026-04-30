import { User, MedicalRecord, ConsentRequest, AuditLog, PatientAISummary, PatientRiskAnalysis } from '../types';

// Get API URL from environment or use localhost
// In dev mode with Vite proxy, requests go to /api which proxies to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = '/api'; // Use proxy in dev, full URL in production
export const AUTH_EXPIRED_EVENT = 'healpath:auth-expired';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

async function throwAPIError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const data = await response.json();
    message = data.detail || data.message || fallback;
  } catch {
    // Keep the fallback for non-JSON errors.
  }

  if (response.status === 401) {
    localStorage.removeItem('healpath_user');
    localStorage.removeItem('healpath_token');
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { message } }));
  }

  throw new Error(message);
}

// Helper to add auth token to requests
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('healpath_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

function getBearerHeaders(): HeadersInit {
  const token = localStorage.getItem('healpath_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  register: async (email: string, name: string, password: string, role: string, organization?: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, role, organization }),
    });
    if (!response.ok) await throwAPIError(response, 'Registration failed');
    return response.json();
  },
};

export const patientAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE}/patient/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch dashboard');
    return response.json();
  },

  getRecords: async (): Promise<MedicalRecord[]> => {
    const response = await fetch(`${API_BASE}/patient/records`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch records');
    return response.json();
  },

  downloadRecordFile: async (recordId: number): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/patient/records/${recordId}/file`, {
      headers: getBearerHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to download record file');
    return response.blob();
  },

  getConsentRequests: async (): Promise<ConsentRequest[]> => {
    const response = await fetch(`${API_BASE}/patient/consent`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch consent requests');
    return response.json();
  },

  actionConsentRequest: async (consentId: number, status: 'approved' | 'rejected'): Promise<ConsentRequest> => {
    const response = await fetch(`${API_BASE}/patient/consent/${consentId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to action consent request');
    return response.json();
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await fetch(`${API_BASE}/patient/audit`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch audit logs');
    return response.json();
  },

  getNotifications: async () => {
    const response = await fetch(`${API_BASE}/patient/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch notifications');
    return response.json();
  },

  getTimeline: async (): Promise<MedicalRecord[]> => {
    const response = await fetch(`${API_BASE}/patient/timeline`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch timeline');
    return response.json();
  },

  getAISummary: async (): Promise<PatientAISummary> => {
    const response = await fetch(`${API_BASE}/patient/summary-insights`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch AI summary');
    return response.json();
  },

  getRiskAnalysis: async (): Promise<PatientRiskAnalysis> => {
    const response = await fetch(`${API_BASE}/patient/risk-analysis`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch risk analysis');
    return response.json();
  },

  updateProfile: async (data: Partial<Pick<User, 'name' | 'email'>>): Promise<User> => {
    const response = await fetch(`${API_BASE}/patient/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to update profile');
    return response.json();
  },
};

export const orgAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE}/org/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch dashboard');
    return response.json();
  },

  searchPatient: async (patientHpId: string): Promise<MedicalRecord[]> => {
    const response = await fetch(`${API_BASE}/org/search?patient_id=${patientHpId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Patient not found');
    return response.json();
  },

  uploadRecord: async (patientHpId: string, type: string, title: string, content: string, date: string) => {
    const response = await fetch(`${API_BASE}/org/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ patient_hp_id: patientHpId, type, title, content, date }),
    });
    if (!response.ok) await throwAPIError(response, 'Upload failed');
    return response.json();
  },

  uploadDocument: async (patientHpId: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append('patient_hp_id', patientHpId);
    formData.append('type', type);
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/org/upload-file`, {
      method: 'POST',
      headers: getBearerHeaders(),
      body: formData,
    });
    if (!response.ok) await throwAPIError(response, 'Upload failed');
    return response.json();
  },

  requestModify: async (patientHpId: string, recordId: number, reason: string) => {
    const response = await fetch(`${API_BASE}/org/modify-request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ patient_hp_id: patientHpId, record_id: recordId, reason }),
    });
    if (!response.ok) await throwAPIError(response, 'Modify request failed');
    return response.json();
  },

  requestDelete: async (patientHpId: string, recordId: number, reason: string) => {
    const response = await fetch(`${API_BASE}/org/delete-request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ patient_hp_id: patientHpId, record_id: recordId, reason }),
    });
    if (!response.ok) await throwAPIError(response, 'Delete request failed');
    return response.json();
  },

  getConsentStatus: async (): Promise<ConsentRequest[]> => {
    const response = await fetch(`${API_BASE}/org/consent-status`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch consent status');
    return response.json();
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await fetch(`${API_BASE}/org/audit`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch access logs');
    return response.json();
  },

  updateProfile: async (data: Partial<Pick<User, 'name' | 'email' | 'organization'>>): Promise<User> => {
    const response = await fetch(`${API_BASE}/org/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to update profile');
    return response.json();
  },
};

export const adminAPI = {
  listUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch users');
    return response.json();
  },

  listOrgs: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/admin/orgs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch organizations');
    return response.json();
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await fetch(`${API_BASE}/admin/audit`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch audit logs');
    return response.json();
  },

  getSecurityLogs: async (): Promise<AuditLog[]> => {
    const response = await fetch(`${API_BASE}/admin/security-logs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) await throwAPIError(response, 'Failed to fetch security logs');
    return response.json();
  },
};
