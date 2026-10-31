import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { db, createOfflineContract } from '../../db/dexieDb.js';
import { useSync } from '../../context/SyncContext.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Sparkles,
  X,
  Layers
} from 'lucide-react';
import clsx from 'clsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_TIMES = [
  { period: 1, label: '09:30 AM - 10:30 AM' },
  { period: 2, label: '10:30 AM - 11:30 AM' },
  { period: 3, label: '11:45 AM - 12:45 PM' },
  { period: 4, label: '01:30 PM - 02:30 PM' },
  { period: 5, label: '02:30 PM - 04:30 PM (Lab Slot)' }
];

export function TimetableMatrix() {
  const [selectedClass, setSelectedClass] = useState('CS-3A');
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const { isOnline } = useSync();

  // New slot form state
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 'Monday',
    periodNumber: 1,
    subjectCode: 'CS301',
    subjectName: 'Design & Analysis of Algorithms',
    facultyName: 'Prof. Ananya Sen',
    room: 'LH-302',
    type: 'theory'
  });

  const loadTimetable = async (classId = selectedClass) => {
    setLoading(true);
    setConflictError(null);
    try {
      // 1. Check local Dexie store first for offline instant access
      const cached = await db.timetables.where('classId').equals(classId).toArray();
      if (cached && cached.length > 0) {
        setTimetable({ classId, slots: cached });
      }

      // 2. Fetch fresh from server if online
      if (navigator.onLine) {
        const res = await api.request(`/timetable/class/${classId}`);
        if (res.success && res.data) {
          setTimetable(res.data);

          // Update Dexie cache
          if (res.data.slots) {
            for (const s of res.data.slots) {
              await db.timetables.put(createOfflineContract({
                ...s,
                classId,
                syncStatus: 'synced'
              }));
            }
          }
        }
      }
    } catch (err) {
      console.warn('Timetable fetch error, falling back to local Dexie cache:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable(selectedClass);
  }, [selectedClass]);

  // Handle Save Slot with conflict checking
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setConflictError(null);

    try {
      const res = await api.request('/timetable/slot', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass,
          ...slotForm
        })
      });

      if (res.success) {
        setSuccessToast(`Slot scheduled: ${slotForm.subjectCode} on ${slotForm.dayOfWeek} P${slotForm.periodNumber}`);
        setModalOpen(false);
        await loadTimetable(selectedClass);
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch (err) {
      setConflictError(err.message || 'Schedule conflict detected');
    }
  };

  // Quick simulate conflict
  const triggerSimulatedConflict = () => {
    // Attempt to book Prof. Ananya Sen in LH-302 on Tuesday Period 1 (where she's already booked for CS-4A or CS-3A)
    setSlotForm({
      dayOfWeek: 'Tuesday',
      periodNumber: 1,
      subjectCode: 'CS402',
      subjectName: 'Distributed Systems',
      facultyName: 'Prof. Ananya Sen',
      room: 'LH-302', // conflict!
      type: 'theory'
    });
    setModalOpen(true);
  };

  if (loading && !timetable) {
    return <BentoSkeleton />;
  }

  const currentDayName = DAYS[new Date().getDay() - 1] || 'Monday';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141C] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Smart Schedule Matrix</Badge>
            <span className="text-xs text-slate-400 font-mono">Real-time Faculty & Hall Conflict Guard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Class Cohort Timetable Engine
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Zero-latency timetable grid cached in Dexie.js with double-booking prevention across faculty and lecture halls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="emerald" dot>
            Dexie Cached for Offline
          </Badge>
          <button
            onClick={() => {
              setConflictError(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Slot</span>
          </button>
        </div>
      </div>

      {/* Class Cohort Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-[#12141C] p-1 rounded-xl border border-white/[0.08]">
          {['CS-1A', 'CS-2A', 'CS-3A', 'CS-4A'].map((cohort) => (
            <button
              key={cohort}
              onClick={() => setSelectedClass(cohort)}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                selectedClass === cohort
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {cohort}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>Today ({currentDayName})</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-300">Room LH-302 Primary</span>
        </div>
      </div>

      {/* Weekly Timetable Matrix Grid */}
      <div className="rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.08] text-slate-400 font-medium">
                <th className="p-4 w-32 font-semibold">Day / Period</th>
                {PERIOD_TIMES.map((pt) => (
                  <th key={pt.period} className="p-4 border-l border-white/5">
                    <div className="text-slate-200 font-semibold">Period {pt.period}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{pt.label}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {DAYS.map((day) => {
                const isCurrentDay = day === currentDayName;
                return (
                  <tr
                    key={day}
                    className={clsx(
                      'transition-colors',
                      isCurrentDay ? 'bg-indigo-500/[0.03]' : 'hover:bg-white/[0.01]'
                    )}
                  >
                    <td className="p-4 font-semibold text-slate-200 border-r border-white/5 flex items-center gap-2">
                      {isCurrentDay && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                      <span>{day}</span>
                    </td>

                    {PERIOD_TIMES.map((pt) => {
                      const slot = timetable?.slots?.find(
                        (s) => s.dayOfWeek === day && s.periodNumber === pt.period
                      );

                      if (!slot) {
                        return (
                          <td
                            key={pt.period}
                            className="p-3 border-l border-white/5 text-slate-600 font-mono text-[11px] text-center italic"
                          >
                            Recess / Free
                          </td>
                        );
                      }

                      const isLab = slot.type === 'lab';

                      return (
                        <td
                          key={pt.period}
                          className="p-3 border-l border-white/5 align-top"
                        >
                          <div
                            className={clsx(
                              'p-3 rounded-xl border flex flex-col justify-between space-y-2 h-full transition-all group',
                              isLab
                                ? 'bg-purple-500/[0.06] border-purple-500/20 hover:border-purple-500/40 text-purple-200'
                                : 'bg-white/[0.02] border-white/5 hover:border-indigo-500/30 text-slate-200'
                            )}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/30 text-indigo-300">
                                {slot.subjectCode}
                              </span>
                              <Badge variant={isLab ? 'purple' : 'neutral'} size="xs">
                                {slot.type.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="font-semibold text-xs text-white leading-tight">
                              {slot.subjectName}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-slate-300 truncate max-w-[120px]">
                                <User className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{slot.facultyName.split(' ')[0]} {slot.facultyName.split(' ')[1]?.[0]}.</span>
                              </span>
                              <span className="flex items-center gap-1 font-mono text-indigo-400 shrink-0">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {slot.room}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule / Reschedule Slot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-[#12141C] border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Schedule Class Slot</h3>
                  <p className="text-xs text-slate-400 font-mono">Cohort {selectedClass} • Autonomous Verification</p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 space-y-4 text-xs">
              {conflictError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">{conflictError}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Day of Week</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {DAYS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Period Slot</label>
                  <select
                    value={slotForm.periodNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, periodNumber: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {PERIOD_TIMES.map(p => (
                      <option key={p.period} value={p.period} className="bg-slate-900">
                        Period {p.period} ({p.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Subject Code</label>
                  <input
                    type="text"
                    value={slotForm.subjectCode}
                    onChange={(e) => setSlotForm({ ...slotForm, subjectCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS301"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Classroom / Lab</label>
                  <input
                    type="text"
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                    placeholder="e.g. LH-302 or Computing Lab 3"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Subject Title</label>
                <input
                  type="text"
                  value={slotForm.subjectName}
                  onChange={(e) => setSlotForm({ ...slotForm, subjectName: e.target.value })}
                  placeholder="e.g. Design & Analysis of Algorithms"
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Assigned Faculty</label>
                  <input
                    type="text"
                    value={slotForm.facultyName}
                    onChange={(e) => setSlotForm({ ...slotForm, facultyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Session Type</label>
                  <select
                    value={slotForm.type}
                    onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="theory" className="bg-slate-900">Theory Lecture</option>
                    <option value="lab" className="bg-slate-900">Laboratory Practical</option>
                    <option value="tutorial" className="bg-slate-900">Tutorial / Mentoring</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Auto-Conflict Detection Active</span>
                <span className="font-mono text-emerald-400">Strict OCC</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-colors"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TimetableMatrix;
