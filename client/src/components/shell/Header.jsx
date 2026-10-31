import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import DynamicSyncIsland from './DynamicSyncIsland.jsx';
import {
  Search,
  Moon,
  Sun,
  Bell,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

export function Header({ onOpenCommandPalette, currentView, onSelectView, onOpenAiAssistant, onOpenNotifications }) {
  const { user, activeRole, scope } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#090A0F]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      
      {/* Left: Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button
          onClick={() => onSelectView && onSelectView('dashboard')}
          className="flex items-center gap-1.5 font-medium text-slate-300 hover:text-white transition-colors"
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Apex Institute of Technology</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        {currentView === 'sync_health' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              System Integrity
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Sync Health & Conflict Resolver
            </span>
          </>
        ) : currentView === 'curriculum' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Department CSE
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Curriculum Coverage Tracker
            </span>
          </>
        ) : currentView === 'timetable' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Academic Operations
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Smart Timetable Matrix
            </span>
          </>
        ) : currentView === 'attendance_register' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Offline Roster
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Attendance Register & Live QR
            </span>
          </>
        ) : currentView === 'attendance_anomalies' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Academic Auditing
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Attendance Anomaly & Correction Console
            </span>
          </>
        ) : currentView === 'students' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Student Lifecycle
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Cohort Registry & Proctoring
            </span>
          </>
        ) : currentView === 'assignments' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              LMS Operations
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Assignment Workflow & Rubric Evaluation
            </span>
          </>
        ) : currentView === 'study_packs' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Offline Learning Hub
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Offline Study Pack Bundler & Forum
            </span>
          </>
        ) : currentView === 'exams' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Controller of Examinations
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Examinations, Marks Approval & Results
            </span>
          </>
        ) : currentView === 'services' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Unified Service Desk
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Multi-Stage Approvals & Grievances
            </span>
          </>
        ) : currentView === 'operations' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Campus Operations
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Finance, Library, Transport & Locks
            </span>
          </>
        ) : currentView === 'placement' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Placement & Skill Registry
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Company Drives & Verifiable Skill Passport
            </span>
          </>
        ) : currentView === 'verify' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Institutional Registry
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Public Cryptographic Certificate Verifier
            </span>
          </>
        ) : currentView === 'early_warning' ? (
          <>
            <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
              System Intelligence
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-100">
              Academic Early-Warning Dashboard
            </span>
          </>
        ) : (
          <>
            {scope?.departmentId && (
              <>
                <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  {scope.departmentId}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </>
            )}
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              {activeRole.charAt(0) + activeRole.slice(1).toLowerCase()} Portal
            </span>
          </>
        )}
      </div>

      {/* Center / Right: Dynamic Sync Island & Controls */}
      <div className="flex items-center gap-3">
        
        {/* Quick Search trigger (Cmd+K) */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-slate-400 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search or jump to...</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* AI Assistant Co-Pilot Trigger (Cmd+J) */}
        <button
          onClick={onOpenAiAssistant}
          title="Open CampusBridge AI Co-Pilot (⌘J)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/20 via-indigo-500/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 text-xs text-indigo-300 hover:text-white transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="hidden md:inline font-medium">Academic AI</span>
          <kbd className="hidden md:inline font-mono text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
            ⌘J
          </kbd>
        </button>

        {/* Notifications Center Bell */}
        <button
          onClick={onOpenNotifications}
          title="Notifications & Emergency Broadcasts"
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-100 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
        </button>

        {/* Dynamic Sync Island (Persistent Top Pill) */}
        <DynamicSyncIsland />

        {/* Theme Toggle (Obsidian Dark / Alabaster Light) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Alabaster Light' : 'Obsidian Dark'}`}
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-100 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Audit / Compliance indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RBAC Scoped</span>
        </div>

      </div>

    </header>
  );
}

export default Header;
