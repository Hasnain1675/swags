import React from 'react';
import { Copy, AlertCircle, MapPin, ArrowRight } from 'lucide-react';
import { Complaint } from '../types.ts';

interface DuplicateAlertCardProps {
  suspectId?: string | null;
  similarity?: number | null;
  reason?: string | null;
  parentComplaint?: Complaint | null;
  onViewParent?: (id: string) => void;
}

export const DuplicateAlertCard: React.FC<DuplicateAlertCardProps> = ({
  suspectId,
  similarity,
  reason,
  parentComplaint,
  onViewParent,
}) => {
  if (!suspectId) return null;

  return (
    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 text-amber-950 shadow-2xs">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2.5">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 mt-0.5">
            <Copy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Possible Duplicate Detected
              </span>
              <span className="bg-amber-200/80 text-amber-900 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                {similarity || 78}% Similarity
              </span>
            </div>
            <p className="text-sm font-semibold text-amber-950 mt-1">
              Matching Reference Case: <span className="font-mono underline">{suspectId}</span>
            </p>
            {reason && (
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                {reason}
              </p>
            )}
            <div className="flex items-center space-x-1.5 mt-2 text-[11px] text-amber-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Policy Rule: Never automatically merged. Flagged for Authority review.</span>
            </div>
          </div>
        </div>

        {onViewParent && (
          <button
            onClick={() => onViewParent(suspectId)}
            className="flex items-center space-x-1 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ml-2 shadow-2xs"
          >
            <span>View Case</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {parentComplaint && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 bg-amber-100/40 p-2.5 rounded-lg text-xs">
          <div className="font-semibold text-amber-950">
            {parentComplaint.title}
          </div>
          <div className="flex items-center space-x-2 text-amber-800 text-[11px] mt-0.5">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>{parentComplaint.location}</span>
            </span>
            <span>•</span>
            <span className="font-medium">Status: {parentComplaint.status}</span>
          </div>
        </div>
      )}
    </div>
  );
};
