import React, { useState } from 'react';
import {
  X,
  Send,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Loader2,
} from 'lucide-react';
import { createComplaint } from '../api.ts';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplaintCreated: (complaintId: string) => void;
}

const PAKISTAN_LOCATION_PRESETS = [
  { name: 'Gulshan-e-Iqbal Block 13-D (Near Govt Girls School, Karachi)', lat: 24.9204, lng: 67.0988, city: 'Karachi' },
  { name: 'Gulberg III Main Market (Near Hafeez Centre, Lahore)', lat: 31.5164, lng: 74.3444, city: 'Lahore' },
  { name: 'Satellite Town Block C (Commercial Market, Rawalpindi)', lat: 33.6339, lng: 73.0685, city: 'Rawalpindi' },
  { name: 'Shahrah-e-Faisal Westbound (Baloch Colony Flyover, Karachi)', lat: 24.8607, lng: 67.0711, city: 'Karachi' },
  { name: 'Johar Town Block G (Near Shaukat Khanum Chowk, Lahore)', lat: 31.4697, lng: 74.2728, city: 'Lahore' },
  { name: 'Blue Area, Jinnah Avenue (Sector G-7/2, Islamabad)', lat: 33.7121, lng: 73.0562, city: 'Islamabad' },
  { name: 'Hayatabad Phase 3 (Near Tatara Park, Peshawar)', lat: 33.9877, lng: 71.4322, city: 'Peshawar' },
];

const SAMPLE_PHOTO_PRESETS = [
  { label: 'Open Gutter / Manhole', url: '/src/assets/images/open_manhole_cover_1791951250448.jpg' },
  { label: 'Sparking PMT Transformer', url: '/src/assets/images/sparking_transformer_1791951250856.jpg' },
  { label: 'Monsoon Pothole Crater', url: '/src/assets/images/pothole_road_crater_1791951252402.jpg' },
  { label: 'Overflowing Waste Dump', url: '/src/assets/images/overflowing_waste_dump_1791951252930.jpg' },
  { label: 'Repaired Road Patch', url: '/src/assets/images/repaired_road_patch_1791951253187.jpg' },
];

export const SubmitComplaintModal: React.FC<SubmitComplaintModalProps> = ({
  isOpen,
  onClose,
  onComplaintCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Water & Sanitation Agency (WASA / KWSB)');
  const [location, setLocation] = useState(PAKISTAN_LOCATION_PRESETS[0].name);
  const [latitude, setLatitude] = useState(PAKISTAN_LOCATION_PRESETS[0].lat);
  const [longitude, setLongitude] = useState(PAKISTAN_LOCATION_PRESETS[0].lng);
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSelectPresetLocation = (preset: typeof PAKISTAN_LOCATION_PRESETS[0]) => {
    setLocation(preset.name);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category,
        location,
        latitude,
        longitude,
        evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
      };

      const result = await createComplaint(payload);
      setSubmissionResult(result);
      onComplaintCreated(result.complaintId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Water & Sanitation Agency (WASA / KWSB)');
    setLocation(PAKISTAN_LOCATION_PRESETS[0].name);
    setLatitude(PAKISTAN_LOCATION_PRESETS[0].lat);
    setLongitude(PAKISTAN_LOCATION_PRESETS[0].lng);
    setEvidenceUrl('');
    setSubmissionResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Submit Civic Complaint with AI Triage
              </h2>
              <p className="text-xs text-slate-600">
                AI categorizes issue, routes to WASA / C&W / Electric, & checks duplicate reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submissionResult ? (
          // Success Screen
          <div className="p-6 space-y-5">
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950">
              <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" />
              <div>
                <p className="text-sm font-bold">
                  Complaint Successfully Registered!
                </p>
                <p className="text-xs text-emerald-900 mt-0.5">
                  Tracking ID:{' '}
                  <span className="font-mono font-extrabold text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded ml-1">
                    {submissionResult.complaintId}
                  </span>
                </p>
              </div>
            </div>

            {/* Duplicate Notice */}
            {submissionResult.duplicateCheck?.isDuplicateSuspect && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-amber-900">
                  <Copy className="w-4 h-4 text-amber-800" />
                  <span>Duplicate Report Detected</span>
                  <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[10px]">
                    {submissionResult.duplicateCheck.similarityPercentage}% Match
                  </span>
                </div>
                <p className="text-xs text-amber-900">
                  Possible duplicate of{' '}
                  <span className="font-mono font-bold text-amber-950">
                    {submissionResult.duplicateCheck.suspectComplaintId}
                  </span>
                  . {submissionResult.duplicateCheck.reason}
                </p>
                <p className="text-[11px] text-amber-800 italic">
                  Note: Case kept separate per municipal policy and flagged for DC consolidation.
                </p>
              </div>
            )}

            {/* AI Analysis Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  AI Triage & Urgency Evaluation
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                  {submissionResult.triage.confidence}% AI Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Routed Authority</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {submissionResult.triage.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Calculated Priority Score</span>
                  <span className="font-extrabold text-emerald-800 text-sm">
                    {submissionResult.triage.calculatedPriority}/100 ({submissionResult.triage.urgency})
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">AI Rationale:</span>
                {submissionResult.triage.reasoning}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={handleResetForm}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Done & View in Dashboard
              </button>
            </div>
          </div>
        ) : (
          // Form View
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick 1-Click Pakistani Test Scenarios */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>1-Click Test Scenarios (Fast Auto-fill)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Open Gutter (Missing Manhole Cover) near Govt Girls School');
                    setDescription('A deep open sewer manhole has no lid for 3 days outside the school gate. Children and motorcycles are at severe risk of falling inside.');
                    setCategory('Water & Sanitation Agency (WASA / KWSB)');
                    handleSelectPresetLocation(PAKISTAN_LOCATION_PRESETS[0]);
                    setEvidenceUrl(SAMPLE_PHOTO_PRESETS[0].url);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  🕳️ Open Gutter (Karachi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Overloaded PMT transformer sparking in Main Market');
                    setDescription('LESCO transformer on pole #12 is smoking and throwing hot sparks over pedestrians and market stalls. Explosion noise heard.');
                    setCategory('Electric & Public Power (K-Electric / LESCO / WAPDA)');
                    handleSelectPresetLocation(PAKISTAN_LOCATION_PRESETS[1]);
                    setEvidenceUrl(SAMPLE_PHOTO_PRESETS[1].url);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  ⚡ Sparking PMT (Lahore)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Contaminated black sewage mixing in drinking tap water');
                    setDescription('WASA clean water line has burst and contaminated with sewer line. Tap water is black and smelling like sewage. Families falling ill.');
                    setCategory('Water & Sanitation Agency (WASA / KWSB)');
                    handleSelectPresetLocation(PAKISTAN_LOCATION_PRESETS[2]);
                    setEvidenceUrl(SAMPLE_PHOTO_PRESETS[0].url);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  💧 Sewage in Water (Rawalpindi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Uncovered sewer manhole on street corner in Gulshan Block 13-D');
                    setDescription('Missing dhakkan on sewage drain at corner of street 4, just 40 meters from the girls school.');
                    setCategory('Water & Sanitation Agency (WASA / KWSB)');
                    handleSelectPresetLocation({
                      name: 'Street 4, Block 13-D, Gulshan-e-Iqbal, Karachi',
                      lat: 24.9207,
                      lng: 67.0991,
                      city: 'Karachi',
                    });
                    setEvidenceUrl(SAMPLE_PHOTO_PRESETS[0].url);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  🔄 Duplicate Detection Test
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Complaint Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Open gutter without cover near school / Sparking PMT transformer"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, exact street landmarks, danger to citizens, and how long it has been unresolved..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            {/* Category & Location Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Responsible Municipal Agency
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="Water & Sanitation Agency (WASA / KWSB)">
                    Water & Sanitation Agency (WASA / KWSB)
                  </option>
                  <option value="Electric & Public Power (K-Electric / LESCO / WAPDA)">
                    Electric & Power (K-Electric / LESCO / WAPDA)
                  </option>
                  <option value="Roads & Infrastructure (C&W / KMC)">
                    Roads & Infrastructure (C&W / KMC)
                  </option>
                  <option value="Solid Waste Management (LWMC / SSWMB)">
                    Solid Waste Management (LWMC / SSWMB)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  City & Sector Preset
                </label>
                <select
                  onChange={(e) => {
                    const found = PAKISTAN_LOCATION_PRESETS.find((p) => p.name === e.target.value);
                    if (found) handleSelectPresetLocation(found);
                  }}
                  value={location}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                >
                  {PAKISTAN_LOCATION_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                      [{p.city}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Address & Lat/Lng */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Location Address
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Evidence Photo */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Photo Evidence URL (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setEvidenceUrl(SAMPLE_PHOTO_PRESETS[0].url)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Attach Sample Photo
                </button>
              </div>
              {evidenceUrl && (
                <div className="mt-2 flex items-center space-x-2">
                  <img
                    src={evidenceUrl}
                    alt="Evidence Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-cover rounded-md border border-slate-200"
                  />
                  <span className="text-[11px] text-slate-500">Image attached for verification</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm shadow-emerald-800/30 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Run AI Triage</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
