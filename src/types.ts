export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority' | 'officer';
  departmentId?: number | null;
  avatarUrl?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  contactEmail: string;
  headOfficerName?: string;
  activeIncidentsCount: number;
  slaHours: number;
}

export interface Complaint {
  id: number;
  complaintId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  departmentId?: number | null;
  departmentName?: string | null;
  status: 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved Awaiting Verification' | 'Closed';
  priorityScore: number;
  priorityTier: 'Low' | 'Medium' | 'High' | 'Critical';
  isDuplicate: boolean;
  duplicateOfId?: string | null;
  duplicateConfidence?: number | null;
  evidenceUrls?: string | null;
  resolutionNotes?: string | null;
  resolutionEvidenceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysis {
  id: number;
  complaintId: string;
  category: string;
  summary: string;
  department: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  reasoning: string;
  safetyImpactScore: number; // 35%
  severityScore: number;     // 25%
  reportCountScore: number;  // 20%
  waitingTimeScore: number;  // 10%
  evidenceScore: number;     // 10%
  calculatedPriority: number;
  duplicateSuspectId?: string | null;
  duplicateScore?: number | null;
  duplicateReason?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  complaintId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface StatusHistory {
  id: number;
  complaintId: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string;
  changedByRole: string;
  note: string | null;
  createdAt: string;
}

export interface ComplaintDetailsResponse {
  complaint: Complaint;
  analysis: AIAnalysis | null;
  history: StatusHistory[];
  logs: AuditLog[];
  duplicateParent?: Complaint | null;
}

export interface PlatformStats {
  total: number;
  urgent: number;
  resolved: number;
  inProgress: number;
  duplicates: number;
  categoryBreakdown: { name: string; count: number }[];
  statusBreakdown: { name: string; count: number }[];
  priorityDistribution: { tier: string; count: number }[];
}
