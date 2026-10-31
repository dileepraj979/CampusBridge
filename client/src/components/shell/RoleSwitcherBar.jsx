import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Shield, UserCheck, ArrowRightLeft, Sparkles, Building2 } from 'lucide-react';
import clsx from 'clsx';

export function RoleSwitcherBar() {
  const { user, activeRole, switchRole, quickSwitchUser, demoAccounts } = useAuth();

  const roleConfigs = [
    { role: 'PRINCIPAL', email: 'principal@ait.edu', label: 'Principal', short: 'PRN', color: 'indigo' },
    { role: 'HOD', email: 'hod.cse@ait.edu', label: 'HOD (CSE)', short: 'HOD', color: 'blue' },
    { role: 'FACULTY', email: 'faculty.cse@ait.edu', label: 'Faculty', short: 'FAC', color: 'emerald' },
    { role: 'STUDENT', email: 'student.cse@ait.edu', label: 'Student', short: 'STD', color: 'purple' },
    { role: 'COLLEGE_ADMIN', email: 'admin@ait.edu', label: 'College Admin', short: 'ADM', color: 'amber' },
    { role: 'SUPER_ADMIN', email: 'superadmin@campusbridge.edu', label: 'Super Admin', short: 'SUP', color: 'rose' }
  ];

  return (
    <div className="bg-[#0D0E15] border-b border-white/[0.08] px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
      {/* Left indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] tracking-wide">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>PHASE 1 DEMO DOCK</span>
        </div>
        <span className="text-slate-400 hidden sm:inline text-[11px]">
          1-Click Role Switcher:
        </span>
      </div>

      {/* Demo Account Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {roleConfigs.map((cfg) => {
          const isActive = user?.email === cfg.email;
          return (
            <button
              key={cfg.role}
              onClick={() => quickSwitchUser(cfg.email)}
              title={`Switch to demo ${cfg.label} (${cfg.email})`}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 border',
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25 font-semibold'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border-white/5 hover:border-white/10'
              )}
            >
              <span className={clsx(
                'w-1.5 h-1.5 rounded-full',
                isActive ? 'bg-white' : 'bg-slate-500'
              )} />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-role Switcher for current user (if user has >1 roles assigned) */}
      {user?.roles && user.roles.length > 1 && (
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
            Active Role:
          </span>
          <div className="flex items-center gap-1">
            {user.roles.map((r) => (
              <button
                key={r.role}
                onClick={() => switchRole(r.role)}
                className={clsx(
                  'px-2 py-0.5 rounded text-[11px] font-mono transition-colors border',
                  activeRole === r.role
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                )}
              >
                {r.role}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSwitcherBar;
