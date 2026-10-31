import React, { useState, useEffect } from 'react';
import BentoCard from '../common/BentoCard.jsx';
import Badge from '../common/Badge.jsx';
import { BentoSkeleton } from '../common/Skeleton.jsx';
import api from '../../services/api.js';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function HodDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getDashboard('HOD');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load HOD dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <BentoSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-blue-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Head of Department</Badge>
            <span className="text-xs text-slate-400 font-mono">Department of Computer Science & Engineering</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Curriculum Velocity & Faculty Workload Console
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Monitoring cohort attendance, syllabus pace, lab uptime, and departmental sync nodes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="emerald" dot>
            {data.offlineSyncHealth.departmentSyncNodes} Offline Nodes Active
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{kpi.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
              {kpi.value}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Card 1: Class-by-Class Attendance Breakdown */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-7"
          title="Cohort Attendance Breakdown by Semester"
          subtitle="Real-time biometric attendance feeds across CS-1A to CS-4A"
          badge={<Badge variant="primary" size="xs">CSE Cohorts</Badge>}
        >
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.classAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="classId" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[70, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#12141C] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
                          <p className="font-semibold text-white">{item.classId} ({item.semester})</p>
                          <p className="text-emerald-400 font-mono mt-1">Attendance: {item.attendance}%</p>
                          <p className="text-slate-400 font-mono text-[11px]">Present: {item.present} / {item.total} students</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="attendance" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Card 2: Faculty Workload Allocation Table */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-5"
          title="Faculty Workload & Sync Status"
          subtitle="Weekly credit hours & offline register compliance"
        >
          <div className="space-y-3 pt-2">
            {data.facultyWorkload.map((faculty, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{faculty.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {faculty.courses} Courses • {faculty.weeklyHours} hrs/week
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="emerald" size="xs">
                    {faculty.attendanceSync} Synced
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Card 3: Department Offline Node Sync Health */}
        <BentoCard
          colSpan="col-span-12"
          title="Departmental Offline Node Mesh"
          subtitle="Status of dedicated classroom tablets operating on IndexedDB local cache"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Classroom Tablets</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">6 / 6 Connected</div>
              <p className="text-[11px] text-slate-400 mt-1">Classrooms LH-301 to LH-306 fully operational.</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Last Batch Synchronization</span>
              </div>
              <div className="text-xl font-bold font-mono text-indigo-300">{data.offlineSyncHealth.lastBatchSync}</div>
              <p className="text-[11px] text-slate-400 mt-1">Automatic push on Wi-Fi reconnect.</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pending Offline Records</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">0 Queued</div>
              <p className="text-[11px] text-slate-400 mt-1">All attendance mutations acknowledged by server.</p>
            </div>
          </div>
        </BentoCard>

      </div>
    </div>
  );
}

export default HodDashboard;
