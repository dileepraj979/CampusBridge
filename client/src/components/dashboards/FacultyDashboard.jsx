import React, { useState, useEffect } from 'react';
import BentoCard from '../common/BentoCard.jsx';
import Badge from '../common/Badge.jsx';
import { BentoSkeleton } from '../common/Skeleton.jsx';
import api from '../../services/api.js';
import { db } from '../../db/dexieDb.js';
import { useSync } from '../../context/SyncContext.jsx';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HardDrive,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award
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

export function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [cachedStudents, setCachedStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { isOnline, refreshCounts, queueTestMutation } = useSync();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getDashboard('FACULTY');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load Faculty dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Open Offline Attendance Sheet with cached Dexie students
  const handleOpenAttendance = async (lecture) => {
    setSelectedLecture(lecture);
    setSaveSuccess(false);
    const students = await db.students.toArray();
    setCachedStudents(students);

    // Default all students to present
    const initialMap = {};
    students.forEach(s => { initialMap[s.recordId] = true; });
    setAttendanceMap(initialMap);

    setAttendanceModalOpen(true);
  };

  const toggleStudent = (recordId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedLecture) return;

    const presentList = Object.keys(attendanceMap).filter(id => attendanceMap[id]);
    const absentList = Object.keys(attendanceMap).filter(id => !attendanceMap[id]);

    // Save mutation into Dexie IndexedDB
    const recordId = 'att-' + Date.now();
    await db.attendanceQueue.add({
      recordId,
      serverId: null,
      classId: selectedLecture.classSection,
      subjectCode: selectedLecture.subjectCode,
      date: new Date().toISOString().split('T')[0],
      presentCount: presentList.length,
      absentCount: absentList.length,
      version: 1,
      updatedAt: new Date().toISOString(),
      lastSyncedAt: isOnline ? new Date().toISOString() : null,
      syncStatus: isOnline ? 'synced' : 'pending',
      deletedAt: null
    });

    await refreshCounts();
    setSaveSuccess(true);
    setTimeout(() => {
      setAttendanceModalOpen(false);
    }, 1200);
  };

  if (loading || !data) {
    return <BentoSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/30 via-indigo-900/20 to-slate-900/40 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="emerald" size="sm">Faculty Lecture Register</Badge>
            <span className="text-xs text-slate-400 font-mono">Employee ID: {data.employeeId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome, {data.facultyName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Offline biometric & roll-call attendance, gradebook submissions, and course pack distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="emerald" dot>
            Zero-Latency Offline Mode Enabled
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{kpi.label}</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
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
        
        {/* Card 1: Today's Class Schedule with Instant Offline Attendance */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-8"
          title="Today's Teaching Schedule & Attendance Registers"
          subtitle="Click any class to take zero-latency attendance via cached IndexedDB student list"
          badge={<Badge variant="primary" size="xs">Interactive</Badge>}
        >
          <div className="space-y-3 pt-3">
            {data.todaySchedule.map((lecture) => (
              <div
                key={lecture.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {lecture.subjectCode}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-200">{lecture.subjectName}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lecture.time}
                    </span>
                    <span>•</span>
                    <span>{lecture.room}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-300">{lecture.classSection}</span>
                    <span>({lecture.totalStudents} Students)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAttendance(lecture)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Take Attendance</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Card 2: Grade Distribution Sparkline / BarChart */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-4"
          title="Class Performance Distribution"
          subtitle="Midterm evaluation grades for CS301 Algorithms"
        >
          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gradeDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="grade" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#12141C] border border-white/10 rounded-xl p-2.5 text-xs shadow-xl font-mono">
                          <p className="font-semibold text-white">{payload[0].payload.grade}</p>
                          <p className="text-emerald-400">{payload[0].value} Students</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

      </div>

      {/* Offline Attendance Modal Dialog */}
      {attendanceModalOpen && selectedLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setAttendanceModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#12141C] border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="xs">Dexie Cached Roster</Badge>
                  <span className="font-mono text-xs text-indigo-400">{selectedLecture.classSection}</span>
                </div>
                <h3 className="text-base font-semibold text-white mt-1">
                  {selectedLecture.subjectName} ({selectedLecture.subjectCode})
                </h3>
              </div>
              <Badge variant={isOnline ? 'emerald' : 'amber'} dot size="xs">
                {isOnline ? 'Online Synced' : 'Offline Mode (Local DB)'}
              </Badge>
            </div>

            {/* Modal Body: List of Cached Students */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              <p className="text-xs text-slate-400 mb-3">
                Tap any student row to toggle between <span className="text-emerald-400 font-semibold">Present</span> and <span className="text-rose-400 font-semibold">Absent</span>. Changes write directly to Dexie.js IndexedDB.
              </p>

              {cachedStudents.map((std) => {
                const isPresent = attendanceMap[std.recordId] ?? true;
                return (
                  <div
                    key={std.recordId}
                    onClick={() => toggleStudent(std.recordId)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between cursor-pointer transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-semibold text-slate-300">
                        {std.rollNo.slice(-3)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{std.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{std.rollNo}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={isPresent ? 'text-xs text-emerald-400 font-semibold' : 'text-xs text-rose-400 font-semibold'}>
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                      {isPresent ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">
                  {Object.values(attendanceMap).filter(Boolean).length} Present
                </span>
                {' • '}
                <span className="font-semibold text-rose-400">
                  {Object.values(attendanceMap).filter(v => !v).length} Absent
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors flex items-center gap-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved to IndexedDB!</span>
                    </>
                  ) : (
                    <span>Confirm & Commit Attendance</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default FacultyDashboard;
