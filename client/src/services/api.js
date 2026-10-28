const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000/api';

// Helper to safely extract latitude/longitude from different complaint schema formats
export function getLatLng(issue) {
  if (!issue) return null;
  if (issue.location?.coordinates?.lat != null && issue.location?.coordinates?.lng != null) {
    return [issue.location.coordinates.lat, issue.location.coordinates.lng];
  }
  if (issue.location?.geo?.coordinates && Array.isArray(issue.location.geo.coordinates)) {
    const [lng, lat] = issue.location.geo.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return [lat, lng];
    }
  }
  if (issue.location?.lat != null && issue.location?.lng != null) {
    return [issue.location.lat, issue.location.lng];
  }
  if (issue.latitude != null && issue.longitude != null) {
    return [issue.latitude, issue.longitude];
  }
  return null;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function loginUser(credentials) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function registerUser(userData) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
}

export async function createComplaint(payload) {
  const res = await fetch(`${API_URL}/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit report');
  return data;
}

export async function getComplaints(filter = {}) {
  const query = new URLSearchParams(filter).toString();
  const url = `${API_URL}/complaints${query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function getMyComplaints() {
  const res = await fetch(`${API_URL}/complaints/my-reports`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch user reports');
  return res.json();
}

export async function updateComplaintStatus(id, updateData) {
  const res = await fetch(`${API_URL}/complaints/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update status');
  return data;
}

export async function assignComplaint(id, assignData) {
  const res = await fetch(`${API_URL}/complaints/${id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(assignData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to assign complaint');
  return data;
}

export async function getOfficers(department) {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  const res = await fetch(`${API_URL}/auth/officers${query}`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch department officers');
  return Array.isArray(data) ? data : data.data || [];
}

// Phase 5: Escalation API functions
export async function previewEscalation() {
  const res = await fetch(`${API_URL}/admin/escalate/preview`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to preview escalation');
  return data;
}

export async function triggerEscalation() {
  const res = await fetch(`${API_URL}/admin/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to trigger escalation');
  return data;
}
