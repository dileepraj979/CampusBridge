import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSync } from '../../context/SyncContext.jsx';
import {
  Search,
  Users,
  BookOpen,
  Calendar,
  CalendarCheck,
  QrCode,
  ShieldAlert,
  Shield,
  Layers,
  RefreshCw,
  Moon,
  Sun,
  X,
  ArrowRight,
  Sparkles,
  FileText,
  HardDrive,
  GraduationCap,
  LifeBuoy,
  Building,
  Briefcase
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export function CommandPalette({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { activeRole, switchRole, quickSwitchUser, demoAccounts } = useAuth();
  const { openDrawer, triggerSync, toggleOfflineSimulation } = useSync();
  const { theme, toggleTheme } = useTheme();

  // Listen to Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter demo accounts & actions based on query
  const filteredAccounts = demoAccounts.filter(acc =>
    acc.name.toLowerCase().includes(query.toLowerCase()) ||
    acc.email.toLowerCase().includes(query.toLowerCase()) ||
    acc.activeRole.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    {
      id: 'nav-attendance-register',
      title: 'Open Fast Attendance Register & Live QR',
      category: 'Attendance Operations',
      icon: CalendarCheck,
      action: () => {
        if (onNavigate) onNavigate('attendance_register');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-attendance-anomalies',
      title: 'Open Attendance Anomaly & Correction Console',
      category: 'Attendance Operations',
      icon: ShieldAlert,
      action: () => {
        if (onNavigate) onNavigate('attendance_anomalies');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-curriculum',
      title: 'Open Curriculum Coverage Tracker',
      category: 'Academic Planning',
      icon: BookOpen,
      action: () => {
        if (onNavigate) onNavigate('curriculum');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-timetable',
      title: 'Open Smart Timetable Matrix',
      category: 'Academic Planning',
      icon: Calendar,
      action: () => {
        if (onNavigate) onNavigate('timetable');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-students',
      title: 'Open Student Cohorts & Dossier Directory',
      category: 'Student Lifecycle',
      icon: Users,
      action: () => {
        if (onNavigate) onNavigate('students');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-assignments',
      title: 'Open Assignments & Rubric Inline Grading Drawer',
      category: 'LMS Operations',
      icon: FileText,
      action: () => {
        if (onNavigate) onNavigate('assignments');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-study-packs',
      title: 'Open 1-Click Offline Study Pack Bundler & Hub',
      category: 'LMS Operations',
      icon: HardDrive,
      action: () => {
        if (onNavigate) onNavigate('study_packs');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-exams',
      title: 'Open Examination Results & Hall Ticket Engine',
      category: 'Examination Engine',
      icon: GraduationCap,
      action: () => {
        if (onNavigate) onNavigate('exams');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-services',
      title: 'Open Unified Service Desk & Grievance Portal',
      category: 'Campus Operations',
      icon: LifeBuoy,
      action: () => {
        if (onNavigate) onNavigate('services');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-operations',
      title: 'Open Campus Operations (Finance, Library, Transport, Locks)',
      category: 'Campus Operations',
      icon: Building,
      action: () => {
        if (onNavigate) onNavigate('operations');
        setIsOpen(false);
      }
    },
    {
      id: 'nav-placement',
      title: 'Open Placement Portal & Verifiable Skill Passport',
      category: 'Placements & Careers',
      icon: Briefcase,
      action: () => {
        if (onNavigate) onNavigate('placement');
        setIsOpen(false);
      }
    },
    {
      id: 'sync-health',
      title: 'Open Sync Health & Conflict Resolution Center',
      category: 'System Integrity',
      icon: Sparkles,
      action: () => {
        if (onNavigate) onNavigate('sync_health');
        setIsOpen(false);
      }
    },
    {
      id: 'sync-now',
      title: 'Force Bidirectional Sync',
      category: 'Offline & Sync',
      icon: RefreshCw,
      action: () => { triggerSync(); setIsOpen(false); }
    },
    {
      id: 'open-drawer',
      title: 'Open Offline Storage & IndexedDB Matrix',
      category: 'Offline & Sync',
      icon: Layers,
      action: () => { openDrawer(); setIsOpen(false); }
    },
    {
      id: 'toggle-offline',
      title: 'Toggle Offline Simulation',
      category: 'Offline & Sync',
      icon: Shield,
      action: () => { toggleOfflineSimulation(); setIsOpen(false); }
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'dark' ? 'Alabaster Light' : 'Obsidian Dark'} Theme`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { toggleTheme(); setIsOpen(false); }
    }
  ].filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[#12141C] border border-white/10 shadow-2xl overflow-hidden z-10 text-slate-100 divide-y divide-white/10">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search role, or jump to offline packs... (Esc to close)"
            className="w-full bg-transparent text-sm placeholder:text-slate-500 focus:outline-none text-slate-100"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-white/5 border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          
          {/* Quick Role Switch Section */}
          {filteredAccounts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Switch Demo Role & User</span>
                <span className="text-indigo-400 font-mono text-[10px]">Instant Switch</span>
              </div>
              <div className="space-y-1 mt-1">
                {filteredAccounts.map((acc) => (
                  <button
                    key={acc._id}
                    onClick={() => {
                      quickSwitchUser(acc.email);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {acc.activeRole[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{acc.email}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {acc.activeRole}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                System Commands
              </div>
              <div className="space-y-1 mt-1">
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={act.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-200 group-hover:text-white transition-colors">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-500">{act.category}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredAccounts.length === 0 && actions.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-indigo-400/60" />
              <p className="font-medium">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-500 mt-1">Try searching for "Student", "Faculty", or "Sync"</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-black/20 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigate <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px]">↑↓</kbd></span>
            <span>Select <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px]">↵</kbd></span>
          </div>
          <span>CampusBridge Universal Search</span>
        </div>

      </div>
    </div>
  );
}

export default CommandPalette;
