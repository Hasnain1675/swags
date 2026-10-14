import React, { useState } from 'react';
import {
  HardHat,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Send,
  AlertTriangle,
  Play,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { Complaint, User, Department } from '../types.ts';
import { TriageScoreBadge } from './TriageScoreBadge.tsx';

interface OfficerViewProps {
  complaints: Complaint[];
  currentUser: User | null;
  departments: Department[];
  onSelectComplaint: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: string, note?: string) => void;
  onResolve: (id: string, notes: string, evidenceUrl?: string) => void;
}

export const OfficerView: React.FC<OfficerViewProps> = ({
  complaints,
  currentUser,
  departments,
  onSelectComplaint,
  onUpdateStatus,
  onResolve,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'resolved'>('pending');

  // Resolution modal state
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resNotes, setResNotes] = useState('');
  const [resProofUrl, setResProofUrl] = useState(
    '/src/assets/images/repaired_road_patch_1791951253187.jpg'
  );

  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>(
    currentUser?.departmentId || 1
  );

  const officerDept = departments.find((d) => d.id === (selectedDeptId === 'all' ? currentUser?.departmentId || 1 : selectedDeptId)) || departments[0];

  const deptComplaints = complaints.filter((c) => {
    if (selectedDeptId === 'all') return true;
    return c.departmentId === selectedDeptId;
  });

  const pendingComplaints = deptComplaints.filter(
    (c) => c.status === 'Assigned' || c.status === 'Submitted' || c.status === 'Under Review'
  );

  const inProgressComplaints = deptComplaints.filter((c) => c.status === 'In Progress');

  const resolvedComplaints = deptComplaints.filter(
    (c) => c.status === 'Resolved Awaiting Verification' || c.status === 'Closed'
  );

  const displayedList =
    activeTab === 'pending'
      ? pendingComplaints
      : activeTab === 'in_progress'
      ? inProgressComplaints
      : resolvedComplaints;

  const handleStartWork = (e: React.MouseEvent, c: Complaint) => {
    e.stopPropagation();
    onUpdateStatus(
      c.complaintId,
      'In Progress',
      `Officer ${currentUser?.name} dispatched field crew to location.`
    );
  };

  const handleOpenResolveModal = (e: React.MouseEvent, c: Complaint) => {
    e.stopPropagation();
    setResolvingComplaint(c);
    setResNotes(
      `Repairs executed at ${c.location}. Issue resolved per municipal engineering standards.`
    );
  };

  const handleSubmitResolution = () => {
    if (resolvingComplaint) {
      onResolve(resolvingComplaint.complaintId, resNotes, resProofUrl);
      setResolvingComplaint(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Department Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-xl shadow-xs">
            🚧
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base text-slate-900">
                {officerDept?.name || 'Department Operations'}
              </span>
              <span className="text-xs font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                {officerDept?.code || 'DEPT-OP'}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800"
              >
                <option value="all">🌐 All Municipal Departments ({complaints.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (SLA: {d.slaHours}h)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Dispatch</span>
            <span className="font-extrabold text-sm text-amber-700">{pendingComplaints.length}</span>
          </div>
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">In Field Action</span>
            <span className="font-extrabold text-sm text-blue-700">{inProgressComplaints.length}</span>
          </div>
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Resolved</span>
            <span className="font-extrabold text-sm text-emerald-700">{resolvedComplaints.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold bg-white px-4 rounded-xl shadow-2xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 ${
            activeTab === 'pending'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Assigned / Ready for Dispatch ({pendingComplaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 ${
            activeTab === 'in_progress'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Active In Progress ({inProgressComplaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resolved')}
          className={`py-3.5 border-b-2 flex items-center space-x-2 ${
            activeTab === 'resolved'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed & Awaiting Citizen Sign-off ({resolvedComplaints.length})</span>
        </button>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedList.map((c) => (
          <div
            key={c.complaintId}
            onClick={() => onSelectComplaint(c.complaintId)}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {c.complaintId}
                </span>
                <TriageScoreBadge score={c.priorityScore} tier={c.priorityTier} compact />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors text-sm">
                  {c.title}
                </h3>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{c.location}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {c.description}
              </p>

              {c.resolutionNotes && (
                <div className="p-2.5 bg-emerald-50 rounded-lg text-xs text-emerald-900">
                  <span className="font-bold block mb-0.5">Field Note:</span>
                  {c.resolutionNotes}
                </div>
              )}
            </div>

            {/* Officer Workflow Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Status: <span className="text-teal-700">{c.status}</span>
              </span>

              <div className="flex items-center space-x-2">
                {c.status !== 'In Progress' && c.status !== 'Resolved Awaiting Verification' && c.status !== 'Closed' && (
                  <button
                    onClick={(e) => handleStartWork(e, c)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span>Start Work</span>
                  </button>
                )}

                {c.status !== 'Closed' && (
                  <button
                    onClick={(e) => handleOpenResolveModal(e, c)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Upload Proof & Resolve</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayedList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-600">No tasks currently in this queue.</p>
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Submit Resolution Proof: {resolvingComplaint.complaintId}</span>
              </h3>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Case: <strong className="text-slate-900">"{resolvingComplaint.title}"</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Field Completion Notes *
              </label>
              <textarea
                rows={3}
                required
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                placeholder="Describe the repair work conducted, materials applied, and safety confirmation..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Completion Photo URL (Proof of Work)
              </label>
              <input
                type="url"
                value={resProofUrl}
                onChange={(e) => setResProofUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
              {resProofUrl && (
                <div className="mt-2">
                  <img
                    src={resProofUrl}
                    alt="Proof Preview"
                    referrerPolicy="no-referrer"
                    className="w-32 h-20 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setResolvingComplaint(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResolution}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved (Awaiting Citizen Verification)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
