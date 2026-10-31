import React, { useState, useEffect } from 'react';
import BentoCard from '../common/BentoCard.jsx';
import Badge from '../common/Badge.jsx';
import { Skeleton, BentoSkeleton } from '../common/Skeleton.jsx';
import api from '../../services/api.js';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  HardDrive,
  Building,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function PrincipalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getDashboard('PRINCIPAL');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load Principal dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <BentoSkeleton />;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12141C] border border-white/10 rounded-xl p-3 shadow-xl text-xs">
          <p className="font-semibold text-slate-200 mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }} className="font-mono">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Office of the Principal</Badge>
            <span className="text-xs text-slate-400 font-mono">Academic Session 2025-2026</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Campus Executive Intelligence & Accreditation
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-department oversight, NAAC A++ metrics, and offline tablet node sync telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">NAAC CGPA Rating</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">3.84 / 4.00</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{kpi.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
              {kpi.value}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Card 1: 5-Month Campus Attendance & Curriculum Velocity */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-8"
          title="Campus-Wide Attendance vs Syllabus Progression"
          subtitle="Real-time multi-department telemetry aggregated from lecture registers"
          badge={<Badge variant="emerald" size="xs">Live Stream</Badge>}
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="syllabusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="attendance" name="Attendance Rate" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#attendanceGrad)" />
                <Area type="monotone" dataKey="syllabus" name="Syllabus Covered" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#syllabusGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Card 2: Live Executive Alerts & Institutional Status */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-4"
          title="Executive Alerts & Compliance"
          subtitle="Automated alerts from statutory councils & offline sync hubs"
          badge={<Badge variant="amber" size="xs">High Priority</Badge>}
        >
          <div className="space-y-3 pt-2">
            {data.liveAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className={alert.type === 'CRITICAL' ? 'text-rose-400 font-semibold' : 'text-indigo-400 font-semibold'}>
                    {alert.type}
                  </span>
                  <span className="text-slate-500 font-mono">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">{alert.text}</p>
              </div>
            ))}

            {/* Offline Tablet Nodes summary */}
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs">
              <div className="flex items-center justify-between font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  Campus Offline Nodes
                </span>
                <span className="font-mono">{data.offlineStatusSummary.activeSyncNodes} / 42 Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero sync conflicts detected across departmental classroom biometric tablets.
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Department Performance Comparison Matrix */}
        <BentoCard
          colSpan="col-span-12"
          title="Departmental Academic Performance & Faculty Load"
          subtitle="Comparative analytics across Engineering & Management departments"
        >
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[70, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="attendance" name="Avg Attendance %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passRate" name="Pass Rate %" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="facultyLoad" name="Faculty Utilization %" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

      </div>
    </div>
  );
}

export default PrincipalDashboard;
