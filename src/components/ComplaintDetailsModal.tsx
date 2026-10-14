import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Shield,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  History,
  AlertCircle,
  ExternalLink,
  Star,
  Send,
  Loader2,
} from 'lucide-react';
import { ComplaintDetailsResponse, User as UserType } from '../types.ts';
import { TriageScoreBadge } from './TriageScoreBadge.tsx';
import { DuplicateAlertCard } from './DuplicateAlertCard.tsx';
import {
  updateComplaintStatus,
  updateComplaintTriage,
  resolveComplaint,
  verifyAndCloseComplaint,
} from '../api.ts';

interface ComplaintDetailsModalProps {
  data: ComplaintDetailsResponse | null;
  currentUser: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  data,
  currentUser,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'ai' | 'audit'>('timeline');

  // Authority actions state
  const [isEditingTriage, setIsEditingTriage] = useState(false);
  const [overrideDept, setOverrideDept] = useState<number>(1);
  const [overridePriority, setOverridePriority] = useState<number>(75);
  const [overrideNotes, setOverrideNotes] = useState('');

  // Officer resolution state
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionEvidenceUrl, setResolutionEvidenceUrl] = useState(
    '/src/assets/images/repaired_road_patch_1791951253187.jpg'
  );

  // Citizen verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [citizenRating, setCitizenRating] = useState('5');
  const [citizenFeedback, setCitizenFeedback] = useState('Repairs inspected. Resolved to satisfaction.');

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const { complaint, analysis, history, logs, duplicateParent } = data;

  const evidenceList: string[] = complaint.evidenceUrls
    ? JSON.parse(complaint.evidenceUrls)
    : [];

  const handleStatusChange = async (newStatus: string, note?: string) => {
    setIsSubmittingAction(true);
    try {
      await updateComplaintStatus(complaint.complaintId, newStatus, note);
      setActionMessage(`Status updated to: ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Failed to update status'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSaveTriage = async () => {
    setIsSubmittingAction(true);
    try {
      await updateComplaintTriage(complaint.complaintId, {
        departmentId: overrideDept,
        priorityScore: overridePriority,
        notes: overrideNotes,
      });
      setIsEditingTriage(false);
      setActionMessage('Authority triage adjustments saved successfully.');
      onRefresh();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Failed to update triage'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSubmitResolution = async () => {
    if (!resolutionNotes || resolutionNotes.length < 5) {
      setActionMessage('Error: Please enter at least 5 characters of field repair notes.');
      return;
    }
    setIsSubmittingAction(true);
    try {
      await resolveComplaint(complaint.complaintId, resolutionNotes, resolutionEvidenceUrl);
      setIsResolving(false);
      setActionMessage('Resolution evidence submitted! Awaiting citizen verification.');
      onRefresh();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Failed to submit resolution'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleVerifyResolution = async () => {
    setIsSubmittingAction(true);
    try {
      await verifyAndCloseComplaint(
        complaint.complaintId,
        `${citizenRating} Stars`,
        citizenFeedback
      );
      setIsVerifying(false);
      setActionMessage('Complaint verified and officially closed!');
      onRefresh();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Failed to verify complaint'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {complaint.complaintId}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {complaint.category}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-bold text-slate-800">
                {complaint.departmentName || 'Unassigned'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {complaint.title}
            </h2>
            <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{complaint.location}</span>
              </span>
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Reported by: {complaint.citizenName}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback banner */}
        {actionMessage && (
          <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>✓ {actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Headers */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex space-x-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'timeline'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Resolution Workflow</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-3 border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'ai'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Triage & Priority</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Logs ({logs.length})</span>
            </button>
          </div>

          <TriageScoreBadge
            score={complaint.priorityScore}
            tier={complaint.priorityTier}
            compact
          />
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Description & Evidence */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
            <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
              Citizen Description
            </span>
            <p className="leading-relaxed">{complaint.description}</p>

            {evidenceList.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Attached Photo Evidence:
                </span>
                <div className="flex space-x-2">
                  {evidenceList.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative"
                    >
                      <img
                        src={url}
                        alt="Evidence"
                        referrerPolicy="no-referrer"
                        className="w-24 h-16 object-cover rounded-lg border border-slate-300 group-hover:opacity-90 shadow-2xs"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Duplicate Card Warning if applicable */}
          {complaint.isDuplicate && (
            <DuplicateAlertCard
              suspectId={complaint.duplicateOfId}
              similarity={complaint.duplicateConfidence}
              reason={analysis?.duplicateReason}
              parentComplaint={duplicateParent}
            />
          )}

          {/* Tab 1: Resolution Timeline & Role Action Hub */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Lifecycle Progress Stepper */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Current Lifecycle State: <span className="text-blue-700">{complaint.status}</span>
                </span>
                <div className="grid grid-cols-6 gap-1 text-[11px] font-semibold text-center">
                  {[
                    'Submitted',
                    'Under Review',
                    'Assigned',
                    'In Progress',
                    'Resolved Awaiting Verification',
                    'Closed',
                  ].map((s, idx) => {
                    const steps = [
                      'Submitted',
                      'Under Review',
                      'Assigned',
                      'In Progress',
                      'Resolved Awaiting Verification',
                      'Closed',
                    ];
                    const currentIndex = steps.indexOf(complaint.status);
                    const isPassed = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div key={s} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            isCurrent
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : isPassed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {isPassed && !isCurrent ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`mt-1.5 text-[10px] leading-tight ${
                            isCurrent
                              ? 'font-extrabold text-blue-700'
                              : isPassed
                              ? 'font-medium text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {s === 'Resolved Awaiting Verification' ? 'Resolved' : s}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution Inspection Section (If resolved) */}
              {complaint.resolutionNotes && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Officer Field Resolution Report</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    {complaint.resolutionNotes}
                  </p>
                  {complaint.resolutionEvidenceUrl && (
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
                        Completion Proof Photo:
                      </span>
                      <img
                        src={complaint.resolutionEvidenceUrl}
                        alt="Resolution Proof"
                        referrerPolicy="no-referrer"
                        className="w-40 h-28 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ROLE-BASED ACTION PANELS */}

              {/* 1. Citizen Satisfaction Verification Prompt */}
              {complaint.status === 'Resolved Awaiting Verification' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Citizen Verification Required</span>
                  </div>
                  <p className="text-xs text-blue-800">
                    Department officers completed resolution work. Please inspect the evidence above and verify if this complaint can be closed.
                  </p>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-700 font-medium">Rating:</span>
                    <select
                      value={citizenRating}
                      onChange={(e) => setCitizenRating(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars (Completely Satisfied)</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars (Good Work)</option>
                      <option value="3">⭐⭐⭐ 3 Stars (Acceptable)</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={citizenFeedback}
                    onChange={(e) => setCitizenFeedback(e.target.value)}
                    placeholder="Provide feedback on the resolution quality..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />

                  <button
                    onClick={handleVerifyResolution}
                    disabled={isSubmittingAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Resolution & Close Case</span>
                  </button>
                </div>
              )}

              {/* 2. Authority Operations Controls */}
              {currentUser?.role === 'authority' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Authority Triage & Dispatch Override</span>
                    </span>
                    <button
                      onClick={() => setIsEditingTriage(!isEditingTriage)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {isEditingTriage ? 'Cancel' : 'Edit Routing / Priority'}
                    </button>
                  </div>

                  {isEditingTriage ? (
                    <div className="space-y-3 pt-2 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 mb-1 font-semibold">
                            Assign Department
                          </label>
                          <select
                            value={overrideDept}
                            onChange={(e) => setOverrideDept(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value={1}>Roads & Infrastructure (C&W / KMC)</option>
                            <option value={2}>Solid Waste Management (LWMC / SSWMB)</option>
                            <option value={3}>Water & Sanitation Agency (WASA / KWSB)</option>
                            <option value={4}>Electric & Public Power (K-Electric / LESCO / WAPDA)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-semibold">
                            Override Priority (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={overridePriority}
                            onChange={(e) => setOverridePriority(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-semibold">
                          Authority Rationale Note
                        </label>
                        <input
                          type="text"
                          value={overrideNotes}
                          onChange={(e) => setOverrideNotes(e.target.value)}
                          placeholder="Reason for reassignment or priority adjustment..."
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <button
                        onClick={handleSaveTriage}
                        disabled={isSubmittingAction}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        Apply Authority Changes
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {complaint.status === 'Submitted' && (
                        <button
                          onClick={() => handleStatusChange('Assigned', 'Authority verified and dispatched to department.')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Approve & Assign to {complaint.departmentName || 'Department'}
                        </button>
                      )}
                      {complaint.status !== 'Closed' && (
                        <button
                          onClick={() => handleStatusChange('In Progress', 'Authority elevated to active field crew.')}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Mark In Progress
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Department Officer Field Controls */}
              {(currentUser?.role === 'officer' || currentUser?.role === 'authority') && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-700" />
                      <span>Department Officer Execution</span>
                    </span>
                    {complaint.status !== 'Closed' && complaint.status !== 'Resolved Awaiting Verification' && (
                      <button
                        onClick={() => setIsResolving(!isResolving)}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        {isResolving ? 'Cancel Resolution' : 'Submit Resolution Evidence'}
                      </button>
                    )}
                  </div>

                  {isResolving ? (
                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <label className="block text-teal-950 mb-1 font-semibold">
                          Field Completion Notes *
                        </label>
                        <textarea
                          rows={2}
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Detail materials used, crew dispatch, and verification tests conducted..."
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-teal-950 mb-1 font-semibold">
                          Proof of Repair Photo URL
                        </label>
                        <input
                          type="url"
                          value={resolutionEvidenceUrl}
                          onChange={(e) => setResolutionEvidenceUrl(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>
                      <button
                        onClick={handleSubmitResolution}
                        disabled={isSubmittingAction}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        Submit Field Resolution & Notify Citizen
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {complaint.status === 'Assigned' && (
                        <button
                          onClick={() => handleStatusChange('In Progress', 'Officer crew deployed to site.')}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Dispatch Crew (Start Work)
                        </button>
                      )}
                      <button
                        onClick={() => setIsResolving(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Complete Work & Upload Proof
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status History Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Status History Log
                </span>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {history.map((h) => (
                    <div key={h.id} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-2xs" />
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{h.newStatus}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{h.note}</p>
                      <span className="text-[10px] text-slate-400">
                        Updated by: {h.changedBy} ({h.changedByRole})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Triage & Priority Details */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <TriageScoreBadge
                score={complaint.priorityScore}
                tier={complaint.priorityTier}
                analysis={analysis}
              />
            </div>
          )}

          {/* Tab 3: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Immutable Municipal Audit Trail
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-blue-700 text-[11px]">
                        [{log.action}]
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">{log.details}</p>
                    <div className="text-[10px] text-slate-500">
                      Actor: <span className="font-semibold">{log.actorName}</span> ({log.actorRole}) • ID: {log.actorId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
