import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { PlatformStats } from '../types.ts';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AnalyticsViewProps {
  stats: PlatformStats | null;
}

const COLORS = ['#2563eb', '#0d9488', '#eab308', '#ef4444', '#8b5cf6', '#64748b'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Intake</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">100% permanently stored in PostgreSQL</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-red-600 uppercase tracking-wider">
            <span>Urgent Cases</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-2">{stats.urgent}</div>
          <div className="text-[11px] text-red-700 mt-1">Priority score ≥ 80 / Critical hazard</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.resolved}</div>
          <div className="text-[11px] text-emerald-700 mt-1">Completed with evidence verification</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
            <span>Duplicate Alerts</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-extrabold text-amber-800 mt-2">{stats.duplicates}</div>
          <div className="text-[11px] text-amber-700 mt-1">Geospatial & NLP cluster flagged</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Complaints by Category</h3>
              <p className="text-xs text-slate-500">Distribution across municipal incident categories</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Complaint Status Progression</h3>
              <p className="text-xs text-slate-500">Real-time status breakdown across the municipal workflow</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  label={({ name, percent }: any) => `${name ? String(name).slice(0, 10) : ''} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Tier Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Priority Tier Distribution (0-100 Score)</h3>
            <p className="text-xs text-slate-500">Calculated by CivicFlow Explainable Multi-Factor Engine</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.priorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
