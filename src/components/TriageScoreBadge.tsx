import React from 'react';
import { AlertTriangle, ShieldCheck, Flame, Info } from 'lucide-react';
import { AIAnalysis } from '../types.ts';

interface TriageScoreBadgeProps {
  score: number;
  tier: 'Low' | 'Medium' | 'High' | 'Critical';
  analysis?: AIAnalysis | null;
  compact?: boolean;
}

export const TriageScoreBadge: React.FC<TriageScoreBadgeProps> = ({
  score,
  tier,
  analysis,
  compact = false,
}) => {
  let badgeColors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let progressColor = 'bg-emerald-500';

  if (tier === 'Critical' || score >= 85) {
    badgeColors = 'bg-red-50 text-red-700 border-red-200';
    progressColor = 'bg-red-500';
  } else if (tier === 'High' || score >= 70) {
    badgeColors = 'bg-amber-50 text-amber-700 border-amber-200';
    progressColor = 'bg-amber-500';
  } else if (tier === 'Medium' || score >= 45) {
    badgeColors = 'bg-blue-50 text-blue-700 border-blue-200';
    progressColor = 'bg-blue-500';
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${badgeColors}`}>
        <span>{score}/100</span>
        <span className="uppercase text-[10px] tracking-wide font-extrabold">{tier}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Explainable Priority Score
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">{score}</span>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
            <span className={`ml-2 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${badgeColors}`}>
              {tier}
            </span>
          </div>
        </div>

        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          {score >= 85 ? (
            <Flame className="w-7 h-7 text-red-600 animate-pulse" />
          ) : score >= 70 ? (
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          ) : (
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          )}
        </div>
      </div>

      {/* Main Score Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {/* Factor Breakdown */}
      {analysis && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center space-x-1">
              <span>Safety Impact</span>
              <span className="text-[10px] text-slate-400 font-mono">(35%)</span>
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${analysis.safetyImpactScore}%` }}
                />
              </div>
              <span className="font-semibold text-slate-700 w-8 text-right font-mono text-[11px]">
                {analysis.safetyImpactScore}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center space-x-1">
              <span>Severity Level</span>
              <span className="text-[10px] text-slate-400 font-mono">(25%)</span>
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${analysis.severityScore}%` }}
                />
              </div>
              <span className="font-semibold text-slate-700 w-8 text-right font-mono text-[11px]">
                {analysis.severityScore}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center space-x-1">
              <span>Citizen Reports</span>
              <span className="text-[10px] text-slate-400 font-mono">(20%)</span>
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${analysis.reportCountScore}%` }}
                />
              </div>
              <span className="font-semibold text-slate-700 w-8 text-right font-mono text-[11px]">
                {analysis.reportCountScore}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center space-x-1">
              <span>SLA Urgency</span>
              <span className="text-[10px] text-slate-400 font-mono">(10%)</span>
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-1.5 rounded-full"
                  style={{ width: `${analysis.waitingTimeScore}%` }}
                />
              </div>
              <span className="font-semibold text-slate-700 w-8 text-right font-mono text-[11px]">
                {analysis.waitingTimeScore}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center space-x-1">
              <span>Evidence Quality</span>
              <span className="text-[10px] text-slate-400 font-mono">(10%)</span>
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full"
                  style={{ width: `${analysis.evidenceScore}%` }}
                />
              </div>
              <span className="font-semibold text-slate-700 w-8 text-right font-mono text-[11px]">
                {analysis.evidenceScore}
              </span>
            </div>
          </div>

          {analysis.reasoning && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center space-x-1 font-bold text-slate-900 mb-0.5">
                <Info className="w-3.5 h-3.5 text-blue-600 inline" />
                <span>AI Triage Rationale:</span>
              </div>
              {analysis.reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
