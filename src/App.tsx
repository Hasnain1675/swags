import React, { useEffect, useState } from 'react';
import {
  Complaint,
  ComplaintDetailsResponse,
  Department,
  PlatformStats,
  User,
} from './types.ts';
import {
  fetchComplaints,
  fetchComplaintDetails,
  fetchCurrentUser,
  fetchDepartments,
  fetchStats,
  resetDatabaseSeed,
  setAuthToken,
  updateComplaintStatus,
  updateComplaintTriage,
  resolveComplaint,
} from './api.ts';
import { Navbar } from './components/Navbar.tsx';
import { CitizenView } from './components/CitizenView.tsx';
import { AuthorityView } from './components/AuthorityView.tsx';
import { OfficerView } from './components/OfficerView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { SubmitComplaintModal } from './components/SubmitComplaintModal.tsx';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal.tsx';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'citizen' | 'authority' | 'officer' | 'analytics'>('citizen');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [complaintDetails, setComplaintDetails] = useState<ComplaintDetailsResponse | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Load app data
  const loadData = async () => {
    try {
      const [userRes, deptList, complaintList, statsRes] = await Promise.all([
        fetchCurrentUser().catch(() => ({ user: null })),
        fetchDepartments().catch(() => []),
        fetchComplaints().catch(() => []),
        fetchStats().catch(() => null),
      ]);

      if (userRes.user) {
        setCurrentUser(userRes.user);
      }
      setDepartments(deptList);
      setComplaints(complaintList);
      setStats(statsRes);
    } catch (err) {
      console.error('Error loading app data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedComplaintId changes, load details
  useEffect(() => {
    if (selectedComplaintId) {
      fetchComplaintDetails(selectedComplaintId)
        .then((data) => setComplaintDetails(data))
        .catch((err) => console.error('Error fetching details:', err));
    } else {
      setComplaintDetails(null);
    }
  }, [selectedComplaintId]);

  const handleSwitchUser = async (tokenKey: string) => {
    setAuthToken(tokenKey);
    setIsLoading(true);
    await loadData();
    setIsLoading(false);
    showNotification(`Switched persona to: ${tokenKey.replace('demo:', '').toUpperCase()}`);
  };

  const handleSelectTab = async (tab: 'citizen' | 'authority' | 'officer' | 'analytics') => {
    setActiveTab(tab);
    // Align persona with tab for seamless testing
    if (tab === 'authority' && currentUser?.role !== 'authority') {
      setAuthToken('demo:authority');
      await loadData();
    } else if (tab === 'officer' && currentUser?.role !== 'officer') {
      setAuthToken('demo:officer:water');
      await loadData();
    } else if (tab === 'citizen' && currentUser?.role !== 'citizen') {
      setAuthToken('demo:citizen');
      await loadData();
    }
  };

  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      await resetDatabaseSeed();
      await loadData();
      showNotification('Database successfully reset to 12 realistic civic scenarios.');
    } catch (err: any) {
      showNotification('Failed to reset database: ' + err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleComplaintCreated = async (id: string) => {
    await loadData();
    showNotification(`Complaint ${id} registered and AI-analyzed.`);
  };

  const handleUpdateTriage = async (
    id: string,
    deptId: number,
    priority: number,
    status?: string
  ) => {
    try {
      await updateComplaintTriage(id, {
        departmentId: deptId,
        priorityScore: priority,
        status,
      });
      await loadData();
      if (selectedComplaintId === id) {
        const updated = await fetchComplaintDetails(id);
        setComplaintDetails(updated);
      }
      showNotification(`Triage updated for ${id}. Priority set to ${priority}/100.`);
    } catch (err: any) {
      showNotification(err.message || 'Error updating triage', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, note?: string) => {
    try {
      await updateComplaintStatus(id, newStatus, note);
      await loadData();
      if (selectedComplaintId === id) {
        const updated = await fetchComplaintDetails(id);
        setComplaintDetails(updated);
      }
      showNotification(`Status updated to "${newStatus}" for ${id}.`);
    } catch (err: any) {
      showNotification(err.message || 'Error updating status', 'error');
    }
  };

  const handleResolve = async (id: string, notes: string, evidenceUrl?: string) => {
    try {
      await resolveComplaint(id, notes, evidenceUrl);
      await loadData();
      if (selectedComplaintId === id) {
        const updated = await fetchComplaintDetails(id);
        setComplaintDetails(updated);
      }
      showNotification(`Resolution proof uploaded. Awaiting citizen verification.`);
    } catch (err: any) {
      showNotification(err.message || 'Error submitting resolution', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-800/30 text-xl font-bold mb-4">
          🇵🇰
        </div>
        <div className="flex items-center space-x-2 text-slate-700 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          <span>Connecting to CivicFlow PostgreSQL Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-3 ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-emerald-50 text-emerald-950 border-emerald-300'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'citizen' && (
          <CitizenView
            complaints={complaints}
            currentUser={currentUser}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            onSelectComplaint={(id) => setSelectedComplaintId(id)}
          />
        )}

        {activeTab === 'authority' && (
          <AuthorityView
            complaints={complaints}
            departments={departments}
            onSelectComplaint={(id) => setSelectedComplaintId(id)}
            onUpdateTriage={handleUpdateTriage}
          />
        )}

        {activeTab === 'officer' && (
          <OfficerView
            complaints={complaints}
            currentUser={currentUser}
            departments={departments}
            onSelectComplaint={(id) => setSelectedComplaintId(id)}
            onUpdateStatus={handleUpdateStatus}
            onResolve={handleResolve}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView stats={stats} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">CivicFlow Pakistan</span>
            <span>•</span>
            <span>WASA • C&W Roads • K-Electric / LESCO • Solid Waste</span>
            <span>•</span>
            <span>Cloud SQL PostgreSQL</span>
          </div>
          <div>
            Role-Based Access: Citizen • DC Office / Authority • Field Engineering SDO
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SubmitComplaintModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onComplaintCreated={handleComplaintCreated}
      />

      <ComplaintDetailsModal
        isOpen={Boolean(selectedComplaintId && complaintDetails)}
        data={complaintDetails}
        currentUser={currentUser}
        onClose={() => setSelectedComplaintId(null)}
        onRefresh={async () => {
          if (selectedComplaintId) {
            const updated = await fetchComplaintDetails(selectedComplaintId);
            setComplaintDetails(updated);
          }
          await loadData();
        }}
      />
    </div>
  );
}
