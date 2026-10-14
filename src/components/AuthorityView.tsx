import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
} from 'lucide-react';
import { Complaint, Department } from '../types.ts';
import { TriageScoreBadge } from './TriageScoreBadge.tsx';

interface AuthorityViewProps {
  complaints: Complaint[];
  departments: Department[];
  onSelectComplaint: (id: string) => void;
  onUpdateTriage: (id: string, deptId: number, priority: number, status?: string) => void;
}

export const AuthorityView: React.FC<AuthorityViewProps> = ({
  complaints,
  departments,
  onSelectComplaint,
  onUpdateTriage,
}) => {
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);
  const [onlyDuplicates, setOnlyDuplicates] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick edit modal state
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editDeptId, setEditDeptId] = useState<number>(1);
  const [editPriority, setEditPriority] = useState<number>(75);
  const [editStatus, setEditStatus] = useState<string>('Assigned');

  // Metrics
  const total = complaints.length;
  const urgentCount = complaints.filter((c) => c.priorityScore >= 80 || c.priorityTier === 'Critical').length;
  const duplicateCount = complaints.filter((c) => c.isDuplicate).length;
  const underReviewCount = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length;

  const filteredComplaints = complaints
    .filter((c) => {
      if (filterDept !== 'all' && c.departmentId !== Number(filterDept)) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (onlyUrgent && c.priorityScore < 80) return false;
      if (onlyDuplicates && !c.isDuplicate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.complaintId.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore); // default: highest priority on top

  const handleOpenEdit = (e: React.MouseEvent, c: Complaint) => {
    e.stopPropagation();
    setEditingComplaint(c);
    setEditDeptId(c.departmentId || 1);
    setEditPriority(c.priorityScore);
    setEditStatus(c.status === 'Submitted' ? 'Assigned' : c.status);
  };

  const handleSaveEdit = () => {
    if (editingComplaint) {
      onUpdateTriage(editingComplaint.complaintId, editDeptId, editPriority, editStatus);
      setEditingComplaint(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Complaints
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">📋</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 4 municipal departments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Urgent / Critical
            </span>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">🚨</span>
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-2">{urgentCount}</div>
          <div className="text-[11px] text-red-700/80 mt-1">Score ≥ 80/100 (Immediate dispatch)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Duplicate Suspects
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Copy className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-2">{duplicateCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">NLP & geospatial similarity flagged</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Awaiting Authority Review
            </span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">⏳</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-900 mt-2">{underReviewCount}</div>
          <div className="text-[11px] text-blue-700 mt-1">Submitted or in triage intake</div>
        </div>
      </div>

      {/* Authority Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved Awaiting Verification">Resolved Awaiting Verification</option>
              <option value="Closed">Closed</option>
            </select>

            <button
              onClick={() => setOnlyUrgent(!onlyUrgent)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold border transition-colors ${
                onlyUrgent
                  ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🚨 Urgent Only ({urgentCount})
            </button>

            <button
              onClick={() => setOnlyDuplicates(!onlyDuplicates)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold border transition-colors ${
                onlyDuplicates
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🔄 Duplicates ({duplicateCount})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID, title, road..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Master Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <span>🏛️</span>
              <span>DC Office & Municipal Administration Triage Queue</span>
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredComplaints.length} of {complaints.length} complaints sorted by AI Priority Score across Pakistan
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Complaint ID</th>
                <th className="px-4 py-3">Title & Location</th>
                <th className="px-4 py-3">Priority Score</th>
                <th className="px-4 py-3">Assigned Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duplicate</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((c) => (
                <tr
                  key={c.complaintId}
                  onClick={() => onSelectComplaint(c.complaintId)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {c.complaintId}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{c.location}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TriageScoreBadge score={c.priorityScore} tier={c.priorityTier} compact />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                    {c.departmentName || 'Unassigned'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.status === 'Closed'
                          ? 'bg-slate-100 text-slate-700'
                          : c.status === 'Resolved Awaiting Verification'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : c.status === 'Assigned'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.isDuplicate ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                        <Copy className="w-3 h-3" />
                        <span>{c.duplicateConfidence || 78}% Match</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unique</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => handleOpenEdit(e, c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Triage</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authority Quick Triage Adjustment Modal */}
      {editingComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Authority Triage: {editingComplaint.complaintId}
              </h3>
              <button
                onClick={() => setEditingComplaint(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">
              "{editingComplaint.title}"
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reassign Department
              </label>
              <select
                value={editDeptId}
                onChange={(e) => setEditDeptId(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (SLA: {d.slaHours}h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editPriority}
                onChange={(e) => setEditPriority(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                ≥85 Critical, 70-84 High, 45-69 Medium, &lt;45 Low
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Update Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved Awaiting Verification">Resolved Awaiting Verification</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingComplaint(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply Authority Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
