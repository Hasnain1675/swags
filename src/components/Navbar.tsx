import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  HardHat,
  Droplets,
  PlusCircle,
  BarChart3,
  RefreshCw,
  Sparkles,
  LogIn,
  CheckCircle,
} from 'lucide-react';
import { User } from '../types.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut } from 'firebase/auth';

interface NavbarProps {
  currentUser: User | null;
  onSwitchUser: (tokenKey: string) => void;
  activeTab: 'citizen' | 'authority' | 'officer' | 'analytics';
  onSelectTab: (tab: 'citizen' | 'authority' | 'officer' | 'analytics') => void;
  onOpenSubmitModal: () => void;
  onResetSeed: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  activeTab,
  onSelectTab,
  onOpenSubmitModal,
  onResetSeed,
  isResetting,
}) => {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      onSwitchUser(token);
      setIsRoleMenuOpen(false);
    } catch (err: any) {
      console.warn('Google sign-in canceled:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => onSelectTab('citizen')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-900/30">
              🇵🇰
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  CivicFlow <span className="text-emerald-700">Pakistan</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 rounded">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Municipal Complaint Triage (WASA • C&W Roads • K-Electric / LESCO • Solid Waste)
              </p>
            </div>
          </div>

          {/* Simple Navigation Views */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectTab('citizen')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'citizen'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Citizen Portal
            </button>
            <button
              onClick={() => onSelectTab('authority')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'authority'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              DC Authority Console
            </button>
            <button
              onClick={() => onSelectTab('officer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'officer'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Department Operations
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>City Metrics</span>
            </button>
          </nav>

          {/* Actions & Role Switcher */}
          <div className="flex items-center space-x-2">
            {/* Quick Submit Button */}
            <button
              onClick={onOpenSubmitModal}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm shadow-emerald-800/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Civic Issue</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                title="Switch Persona"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                  {currentUser?.role === 'authority' ? '🏛️' : currentUser?.role === 'officer' ? '🚧' : '👤'}
                </div>
                <div className="text-left hidden lg:block leading-tight">
                  <div className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]">
                    {currentUser?.name || 'Muhammad Ali'}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {currentUser?.role === 'authority' ? 'DC / Commissioner' : currentUser?.role === 'officer' ? 'Field SDO' : 'Citizen'}
                  </div>
                </div>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Switch Role (Multi-Persona RBAC)
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Select persona to test permissions and workflow:
                    </p>
                  </div>

                  <div className="p-1.5 space-y-1">
                    <button
                      onClick={() => {
                        onSwitchUser('demo:citizen');
                        onSelectTab('citizen');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentUser?.role === 'citizen' ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">👤</span>
                        <div>
                          <div className="font-bold text-slate-900">Muhammad Ali (Citizen)</div>
                          <div className="text-[10px] text-slate-500">Submit complaint, track timeline, verify fix</div>
                        </div>
                      </div>
                      {currentUser?.role === 'citizen' && <span className="text-emerald-700 font-bold">✓</span>}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('demo:authority');
                        onSelectTab('authority');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentUser?.role === 'authority' ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">🏛️</span>
                        <div>
                          <div className="font-bold text-slate-900">DC Tariq Mehmood</div>
                          <div className="text-[10px] text-slate-500">DC Office: Triage, priority score, dispatch</div>
                        </div>
                      </div>
                      {currentUser?.role === 'authority' && <span className="text-emerald-700 font-bold">✓</span>}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('demo:officer:water');
                        onSelectTab('officer');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentUser?.role === 'officer' && currentUser?.departmentId === 3
                          ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">💧</span>
                        <div>
                          <div className="font-bold text-slate-900">Engr. Hamza Farooq (WASA SDO)</div>
                          <div className="text-[10px] text-slate-500">Water & Sanitation Agency field repairs & photo evidence</div>
                        </div>
                      </div>
                      {currentUser?.role === 'officer' && currentUser?.departmentId === 3 && (
                        <span className="text-emerald-700 font-bold">✓</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('demo:officer');
                        onSelectTab('officer');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentUser?.role === 'officer' && currentUser?.departmentId === 1
                          ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">🚧</span>
                        <div>
                          <div className="font-bold text-slate-900">SDO Rashid Malik (C&W Roads)</div>
                          <div className="text-[10px] text-slate-500">Road patching, asphalt machinery & verification</div>
                        </div>
                      </div>
                      {currentUser?.role === 'officer' && currentUser?.departmentId === 1 && (
                        <span className="text-emerald-700 font-bold">✓</span>
                      )}
                    </button>
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-100 px-2 space-y-1">
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sign in with Google OAuth</span>
                    </button>

                    <button
                      onClick={() => {
                        onResetSeed();
                        setIsRoleMenuOpen(false);
                      }}
                      disabled={isResetting}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-amber-800 hover:bg-amber-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isResetting ? 'animate-spin' : ''}`} />
                      <span>{isResetting ? 'Resetting DB...' : 'Reset to 12 Realistic Scenarios'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => onSelectTab('citizen')}
            className={`px-2 py-1 rounded ${activeTab === 'citizen' ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}
          >
            Citizen
          </button>
          <button
            onClick={() => onSelectTab('authority')}
            className={`px-2 py-1 rounded ${activeTab === 'authority' ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}
          >
            DC Authority
          </button>
          <button
            onClick={() => onSelectTab('officer')}
            className={`px-2 py-1 rounded ${activeTab === 'officer' ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}
          >
            Field SDO
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-2 py-1 rounded ${activeTab === 'analytics' ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}
          >
            Metrics
          </button>
        </div>
      </div>
    </header>
  );
};
