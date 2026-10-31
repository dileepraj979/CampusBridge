import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  BookOpen,
  Award,
  Layers,
  HardDrive,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  Activity,
  FileText,
  RefreshCw,
  LifeBuoy,
  Briefcase,
  UserCheck
} from 'lucide-react';
import Badge from '../common/Badge.jsx';
import clsx from 'clsx';

export function Sidebar({ collapsed, setCollapsed, currentView, onSelectView }) {
  const { user, activeRole, logout } = useAuth();

  // Dynamic role-filtered navigation items
  const getNavSections = () => {
    const sections = [];

    // 1. Core Section
    sections.push({
      title: 'Platform',
      items: [
        { id: 'dashboard', label: `${activeRole.charAt(0) + activeRole.slice(1).toLowerCase()} Dashboard`, icon: LayoutDashboard },
        { id: 'attendance_register', label: 'Attendance Register', icon: CalendarCheck, badge: 'Offline' },
        { id: 'attendance_anomalies', label: 'Attendance Anomalies', icon: ShieldAlert, badge: 'Heuristic' },
        { id: 'curriculum', label: 'Curriculum Coverage', icon: BookOpen, badge: '82%' },
        { id: 'timetable', label: 'Smart Timetable', icon: CalendarCheck, badge: 'Matrix' },
        { id: 'students', label: 'Student Lifecycle', icon: Users, badge: 'Cohort' }
      ]
    });

    // 2. LMS & Examination Engine (Phase 5)
    sections.push({
      title: 'LMS & Examinations',
      items: [
        { id: 'assignments', label: 'Assignments & Rubrics', icon: FileText, badge: 'Workflow' },
        { id: 'study_packs', label: 'Offline Study Packs', icon: HardDrive, badge: 'Bundler' },
        { id: 'exams', label: 'Examinations & Results', icon: GraduationCap, badge: 'R22' }
      ]
    });

    // 3. Operations & Campus Services (Phase 6)
    sections.push({
      title: 'Operations & Services',
      items: [
        { id: 'services', label: 'Service Desk & Grievance', icon: LifeBuoy, badge: 'SLA' },
        { id: 'operations', label: 'Campus Operations Hub', icon: Building, badge: 'Finance' },
        { id: 'placement', label: 'Placements & Skill Passport', icon: Briefcase, badge: 'Verified' }
      ]
    });

    // 4. Intelligence & Care (Phase 7)
    sections.push({
      title: 'Intelligence & Guidance',
      items: [
        { id: 'early_warning', label: 'Academic Early-Warning', icon: UserCheck, badge: 'Care AI' }
      ]
    });

    // 4. Role-tailored sections
    if (activeRole === 'PRINCIPAL') {
      sections.push({
        title: 'Institutional Governance',
        items: [
          { id: 'accreditation', label: 'NAAC / NBA Accreditation', icon: Award, badge: 'A++ Ready' },
          { id: 'departments', label: 'Department Analytics', icon: Building },
          { id: 'faculty_directory', label: 'Faculty Directory & Ranks', icon: Users },
          { id: 'audit_feed', label: 'Campus Audit Trail', icon: ShieldAlert }
        ]
      });
    } else if (activeRole === 'HOD') {
      sections.push({
        title: 'Department CSE',
        items: [
          { id: 'faculty_load', label: 'Faculty Workload Matrix', icon: Users },
          { id: 'class_monitoring', label: 'Class Attendance Feeds', icon: CalendarCheck },
          { id: 'sync_nodes', label: 'Departmental Sync Nodes', icon: HardDrive }
        ]
      });
    } else if (activeRole === 'FACULTY' || activeRole === 'CLASS_ADVISOR') {
      sections.push({
        title: 'Academic Delivery',
        items: [
          { id: 'exams', label: 'Continuous Internal Eval', icon: Award },
          { id: 'study_packs', label: 'Study Packs Cacher', icon: Layers }
        ]
      });
    } else if (activeRole === 'STUDENT') {
      sections.push({
        title: 'Student Portal',
        items: [
          { id: 'study_packs', label: 'Cached Study Packs', icon: HardDrive, badge: 'Dexie' },
          { id: 'exams', label: 'Examinations & Hall Ticket', icon: FileText },
          { id: 'exams', label: 'Academic Transcript & GPA', icon: GraduationCap }
        ]
      });
    }

    // 4. System Management
    sections.push({
      title: 'System & RBAC',
      items: [
        { id: 'sync_health', label: 'Sync Health & Conflicts', icon: RefreshCw, badge: 'Phase 2' },
        { id: 'devices', label: 'Offline Registered Devices', icon: HardDrive },
        { id: 'audit', label: 'Immutable Audit Logs', icon: ShieldAlert }
      ]
    });

    return sections;
  };

  const navSections = getNavSections();

  return (
    <aside
      className={clsx(
        'relative bg-[#090A0F]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 z-30 select-none',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Top Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center">
              <span className="font-extrabold text-white text-base tracking-tighter">CB</span>
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  CampusBridge
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    AIT
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">Offline-First Engine</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors hidden md:flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = (currentView === item.id) || (currentView === 'dashboard' && item.id === 'dashboard');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onSelectView) {
                        onSelectView(item.id);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon className={clsx('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className={clsx(
                        'text-[10px] font-mono px-1.5 py-0.5 rounded-full border',
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-white/5 text-slate-300 border-white/10'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-white/[0.08] bg-black/20">
        <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
            {user?.name ? user.name[0] : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 truncate">
              <div className="font-semibold text-xs text-slate-200 truncate">{user?.name || 'Academic User'}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="primary" size="xs">
                  {activeRole}
                </Badge>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
