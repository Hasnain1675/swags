import {
  Complaint,
  ComplaintDetailsResponse,
  Department,
  PlatformStats,
  User,
} from './types.ts';

// Current active auth token: either a demo key or a Firebase JWT
let currentAuthToken = localStorage.getItem('civicflow_auth_token') || 'demo:citizen';

export function getAuthToken(): string {
  return currentAuthToken;
}

export function setAuthToken(token: string) {
  currentAuthToken = token;
  localStorage.setItem('civicflow_auth_token', token);
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${currentAuthToken}`,
});

export async function fetchCurrentUser(): Promise<{ user: User }> {
  const res = await fetch('/api/me', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function fetchStats(): Promise<PlatformStats> {
  const res = await fetch('/api/stats', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch platform metrics');
  return res.json();
}

export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch('/api/departments', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch departments');
  return res.json();
}

export async function fetchComplaints(params?: {
  category?: string;
  status?: string;
  departmentId?: number;
  viewMine?: boolean;
  all?: boolean;
}): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);
  if (params?.departmentId) query.append('departmentId', String(params.departmentId));
  if (params?.viewMine) query.append('viewMine', 'true');
  if (params?.all) query.append('all', 'true');

  const res = await fetch(`/api/complaints?${query.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function fetchComplaintDetails(id: string): Promise<ComplaintDetailsResponse> {
  const res = await fetch(`/api/complaints/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch complaint ${id}`);
  return res.json();
}

export async function createComplaint(data: {
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  evidenceUrls?: string[];
}) {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit' }));
    throw new Error(err.error || 'Failed to submit complaint');
  }
  return res.json();
}

export async function updateComplaintTriage(
  id: string,
  data: {
    departmentId?: number;
    priorityScore?: number;
    status?: string;
    notes?: string;
  }
) {
  const res = await fetch(`/api/complaints/${id}/triage`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update triage' }));
    throw new Error(err.error || 'Failed to update triage');
  }
  return res.json();
}

export async function updateComplaintStatus(id: string, newStatus: string, note?: string) {
  const res = await fetch(`/api/complaints/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ newStatus, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update status' }));
    throw new Error(err.error || 'Failed to update status');
  }
  return res.json();
}

export async function resolveComplaint(
  id: string,
  resolutionNotes: string,
  resolutionEvidenceUrl?: string
) {
  const res = await fetch(`/api/complaints/${id}/resolve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ resolutionNotes, resolutionEvidenceUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit resolution' }));
    throw new Error(err.error || 'Failed to submit resolution');
  }
  return res.json();
}

export async function verifyAndCloseComplaint(id: string, rating: string, feedback: string) {
  const res = await fetch(`/api/complaints/${id}/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rating, feedback }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to verify and close' }));
    throw new Error(err.error || 'Failed to verify and close');
  }
  return res.json();
}

export async function resetDatabaseSeed() {
  const res = await fetch('/api/seed/reset', {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to seed database');
  return res.json();
}
