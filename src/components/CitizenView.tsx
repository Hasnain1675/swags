import React, { useState } from 'react';
import {
  PlusCircle,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Search,
  Sparkles,
  Copy,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Complaint, User } from '../types.ts';
import { TriageScoreBadge } from './TriageScoreBadge.tsx';

interface CitizenViewProps {
  complaints: Complaint[];
  currentUser: User | null;
  onOpenSubmitModal: () => void;
  onSelectComplaint: (id: string) => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  complaints,
  currentUser,
  onOpenSubmitModal,
  onSelectComplaint,
}) => {
  const [filter, setFilter] = useState<'all' | 'mine' | 'karachi' | 'lahore' | 'pindi_isb'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const myComplaints = complaints.filter((c) => c.citizenId === currentUser?.uid);

  const displayedComplaints = complaints.filter((c) => {
    if (filter === 'mine' && c.citizenId !== currentUser?.uid) return false;
    if (filter === 'karachi' && !c.location.toLowerCase().includes('karachi')) return false;
    if (filter === 'lahore' && !c.location.toLowerCase().includes('lahore')) return false;
    if (
      filter === 'pindi_isb' &&
      !c.location.toLowerCase().includes('rawalpindi') &&
      !c.location.toLowerCase().includes('islamabad')
    )
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.complaintId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Civic Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 shadow-md border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CivicFlow Pakistan — AI Municipal Triage Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Report Civic Issues. Transparent Resolution & Tracking.
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Report open manholes, transformer sparking, contaminated water, road craters, and waste backlogs.
            Our AI triage engine calculates an explainable priority score, routes to WASA, K-Electric, or C&W,
            and detects duplicate reports.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSubmitModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-900/40 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Civic Issue</span>
            </button>
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs text-xs text-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Active Persona: <strong>{currentUser?.name}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Simple 4-Step How It Works Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            1
          </span>
          <div>
            <div className="font-bold text-slate-900">Submit Report</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Detail location, issue & optional photo</div>
          </div>
        </div>

        <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
          <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            2
          </span>
          <div>
            <div className="font-bold text-slate-900">AI Safety Triage</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Urgency (0-100) & duplicate scan</div>
          </div>
        </div>

        <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
          <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            3
          </span>
          <div>
            <div className="font-bold text-slate-900">Agency Dispatch</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Assigned to WASA, C&W, or Power</div>
          </div>
        </div>

        <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-teal-50/60 border border-teal-100">
          <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            4
          </span>
          <div>
            <div className="font-bold text-slate-900">Proof & Sign-off</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Officer uploads photo; citizen closes</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Reports ({complaints.length})
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'mine'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Reports ({myComplaints.length})
          </button>
          <button
            onClick={() => setFilter('karachi')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'karachi'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Karachi
          </button>
          <button
            onClick={() => setFilter('lahore')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'lahore'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Lahore
          </button>
          <button
            onClick={() => setFilter('pindi_isb')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'pindi_isb'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rawalpindi / Islamabad
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaint ID, street, city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Complaints Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedComplaints.map((c) => {
          const evidenceUrls = c.evidenceUrls ? JSON.parse(c.evidenceUrls) : [];

          return (
            <div
              key={c.complaintId}
              onClick={() => onSelectComplaint(c.complaintId)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {c.complaintId}
                  </span>
                  <TriageScoreBadge score={c.priorityScore} tier={c.priorityTier} compact />
                </div>

                {/* Title & Location */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                    {c.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.location}</span>
                  </div>
                </div>

                {/* Evidence Photo Preview */}
                {evidenceUrls.length > 0 && (
                  <div className="relative h-28 rounded-lg overflow-hidden border border-slate-100">
                    <img
                      src={evidenceUrls[0]}
                      alt="Complaint"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {c.isDuplicate && (
                      <span className="absolute top-2 right-2 bg-amber-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow-xs flex items-center space-x-1">
                        <Copy className="w-3 h-3" />
                        <span>Duplicate Suspect</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Footer: Assigned Authority & Status */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Assigned Agency
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[170px] block">
                    {c.departmentName || 'WASA / Municipal Agency'}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-emerald-800 font-bold text-xs group-hover:translate-x-1 transition-transform">
                  <span>{c.status}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedComplaints.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-600">No complaints matching filter criteria.</p>
          <button
            onClick={onOpenSubmitModal}
            className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
          >
            Report First Complaint
          </button>
        </div>
      )}
    </div>
  );
};
