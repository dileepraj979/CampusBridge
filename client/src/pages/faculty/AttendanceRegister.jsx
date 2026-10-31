import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { db, createOfflineContract, createOfflineMutation } from '../../db/dexieDb.js';
import { useSync } from '../../context/SyncContext.jsx';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Lock,
  QrCode,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  Calendar,
  MessageSquare,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

export function AttendanceRegister() {
  const { isOnline, triggerSync } = useSync();

  // Selected session state
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'pending'
  const [toastMessage, setToastMessage] = useState(null);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState(null);
  const [qrExpiresIn, setQrExpiresIn] = useState(15);
  const [qrScansCount, setQrScansCount] = useState(0);

  // Correction Request Modal State
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    newStatus: 'Present',
    reason: ''
  });

  // Table row refs for keyboard navigation scrolling
  const rowRefs = useRef([]);

  // 1. Load Sessions for Class CS-3A
  const loadSessions = async () => {
    try {
      if (navigator.onLine) {
        const res = await api.request('/attendance/sessions?classId=CS-3A');
        if (res.success && res.data.length > 0) {
          setSessions(res.data);
          if (!selectedSessionId) {
            setSelectedSessionId(res.data[0]._id);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Online session fetch failed, falling back to local defaults:', err.message);
    }

    // Fallback default sessions if offline
    const fallbackSessions = [
      {
        _id: 'sess_local_01',
        classId: 'CS-3A',
        subjectCode: 'CS301',
        subjectName: 'Design & Analysis of Algorithms',
        periodNumber: 1,
        startTime: '09:30 AM',
        endTime: '10:30 AM',
        room: 'LH-302',
        sessionType: 'theory',
        status: 'active',
        isLocked: false
      },
      {
        _id: 'sess_local_02',
        classId: 'CS-3A',
        subjectCode: 'CS302',
        subjectName: 'Operating Systems & Kernels',
        periodNumber: 2,
        startTime: '10:45 AM',
        endTime: '11:45 AM',
        room: 'LH-302',
        sessionType: 'theory',
        status: 'scheduled',
        isLocked: false
      }
    ];
    setSessions(fallbackSessions);
    if (!selectedSessionId) setSelectedSessionId(fallbackSessions[0]._id);
  };

  // 2. Load Roster for Selected Session
  const loadSessionRoster = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true);

    try {
      // Try online API first
      if (navigator.onLine) {
        const res = await api.request(`/attendance/sessions/${sessionId}`);
        if (res.success && res.data) {
          setSessionData(res.data.session);
          setStudents(res.data.attendance.students || []);
          setSyncStatus('synced');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Online roster load failed, attempting IndexedDB local load:', err.message);
    }

    // Offline IndexedDB Load from db.students or db.attendanceRecords
    try {
      const cachedStudents = await db.students.where({ classId: 'CS-3A' }).toArray();
      if (cachedStudents.length > 0) {
        const roster = cachedStudents.map(st => ({
          studentId: st.serverId || st.recordId,
          rollNo: st.rollNo,
          name: st.name,
          status: 'Present',
          remarks: '',
          verificationMethod: 'ROSTER_MANUAL'
        }));
        setStudents(roster);
      } else {
        // Fallback default sample students
        setStudents([
          { studentId: 'st_01', rollNo: '22CS081', name: 'Aarav Sharma', status: 'Present', remarks: '', verificationMethod: 'ROSTER_MANUAL' },
          { studentId: 'st_02', rollNo: '22CS082', name: 'Aditi Deshmukh', status: 'Present', remarks: '', verificationMethod: 'ROSTER_MANUAL' },
          { studentId: 'st_03', rollNo: '22CS083', name: 'Bhavin Patel', status: 'Present', remarks: '', verificationMethod: 'ROSTER_MANUAL' },
          { studentId: 'st_04', rollNo: '22CS084', name: 'Divya Iyer', status: 'Present', remarks: '', verificationMethod: 'ROSTER_MANUAL' }
        ]);
      }
      setSyncStatus('pending');
    } catch (dbErr) {
      console.error('Dexie read failed', dbErr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionRoster(selectedSessionId);
    }
  }, [selectedSessionId]);

  // 3. Status Toggle Logic
  const handleSetStatus = (rollNo, newStatus) => {
    if (sessionData?.isLocked) return;

    setStudents(prev =>
      prev.map(st => (st.rollNo === rollNo ? { ...st, status: newStatus } : st))
    );
    setSyncStatus('pending');
  };

  // 4. "Mark All Present except..." Action
  const handleMarkAllPresent = () => {
    if (sessionData?.isLocked) return;

    setStudents(prev =>
      prev.map(st => ({
        ...st,
        status: 'Present'
      }))
    );
    setSyncStatus('pending');
    showToast('All 60 students marked Present. Quickly toggle absentees below.');
  };

  // 5. Keyboard Shortcuts (P, A, L, Arrow Navigation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside input / modal
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || qrModalOpen || correctionModalOpen) {
        return;
      }

      if (sessionData?.isLocked) return;

      const activeStudent = filteredStudents[selectedRowIndex];
      if (!activeStudent) return;

      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleSetStatus(activeStudent.rollNo, 'Present');
        advanceRow();
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSetStatus(activeStudent.rollNo, 'Absent');
        advanceRow();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleSetStatus(activeStudent.rollNo, 'Late');
        advanceRow();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        advanceRow();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowIndex, students, sessionData, qrModalOpen, correctionModalOpen]);

  const advanceRow = () => {
    setSelectedRowIndex(prev => Math.min(filteredStudents.length - 1, prev + 1));
  };

  // Auto-scroll to selected row
  useEffect(() => {
    if (rowRefs.current[selectedRowIndex]) {
      rowRefs.current[selectedRowIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedRowIndex]);

  // 6. Optimistic Local Save & Sync Engine
  const handleSaveAttendance = async (isFinalSubmission = false) => {
    setSaving(true);
    const session = sessionData || sessions.find(s => s._id === selectedSessionId);

    const payload = {
      classId: session?.classId || 'CS-3A',
      subjectCode: session?.subjectCode || 'CS301',
      date: session?.date || new Date().toISOString().split('T')[0],
      periodNumber: session?.periodNumber || 1,
      students,
      isFinalSubmission
    };

    try {
      // 1. Optimistically save to IndexedDB (survives refresh)
      const localRecordId = `att_${payload.classId.toLowerCase()}_${payload.date.replace(/-/g, '')}_p${payload.periodNumber}`;
      await db.attendanceRecords.put(
        createOfflineContract({
          recordId: localRecordId,
          classId: payload.classId,
          subjectCode: payload.subjectCode,
          date: payload.date,
          periodNumber: payload.periodNumber,
          totalStudents: students.length,
          presentCount: students.filter(s => s.status === 'Present').length,
          absentCount: students.filter(s => s.status === 'Absent').length,
          students,
          isLocked: isFinalSubmission,
          syncStatus: isOnline ? 'synced' : 'pending'
        })
      );

      // 2. If offline, queue mutation
      if (!navigator.onLine) {
        const mutation = createOfflineMutation({
          entityType: 'attendanceRecords',
          entityId: localRecordId,
          operationType: 'UPDATE',
          payload
        });
        await db.offlineMutations.put(mutation);
        setSyncStatus('pending');
        showToast('Saved locally in IndexedDB (Offline). Queued for background sync.');
        setSaving(false);
        return;
      }

      // 3. Online: Send directly to backend
      const res = await api.request(`/attendance/sessions/${selectedSessionId}/roster`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSyncStatus('synced');
        if (isFinalSubmission) {
          setSessionData(prev => ({ ...prev, isLocked: true, status: 'locked' }));
          showToast('Attendance finalized and session officially locked.');
        } else {
          showToast('Attendance roster synchronized with cloud.');
        }
      }
    } catch (err) {
      console.warn('Sync failed, saved to local cache:', err.message);
      setSyncStatus('pending');
      showToast('Connection issue: Saved locally to IndexedDB.');
    } finally {
      setSaving(false);
    }
  };

  // 7. Rotating QR Attendance Engine
  const handleLaunchQr = async () => {
    setQrModalOpen(true);
    try {
      const res = await api.request(`/attendance/sessions/${selectedSessionId}/qr/start`, {
        method: 'POST'
      });
      if (res.success) {
        setQrToken(res.data.token);
        setQrExpiresIn(15);
      }
    } catch (err) {
      // Simulate local token if offline
      setQrToken('CAMPUS_' + Math.random().toString(36).substring(2, 8).toUpperCase());
    }
  };

  // QR Timer & Rotation Loop
  useEffect(() => {
    let interval = null;
    if (qrModalOpen) {
      interval = setInterval(async () => {
        setQrExpiresIn(prev => {
          if (prev <= 1) {
            // Rotate token
            api.request(`/attendance/sessions/${selectedSessionId}/qr/rotate`, { method: 'POST' })
              .then(r => { if (r.success) setQrToken(r.data.token); })
              .catch(() => setQrToken('CAMPUS_' + Math.random().toString(36).substring(2, 8).toUpperCase()));
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [qrModalOpen, selectedSessionId]);

  // 8. Submit Correction Request
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionTarget || !correctionForm.reason) return;

    try {
      const res = await api.request(`/attendance/sessions/${selectedSessionId}/corrections`, {
        method: 'POST',
        body: JSON.stringify({
          studentRollNo: correctionTarget.rollNo,
          studentName: correctionTarget.name,
          previousStatus: correctionTarget.status,
          newStatus: correctionForm.newStatus,
          reason: correctionForm.reason
        })
      });

      if (res.success) {
        setCorrectionModalOpen(false);
        showToast(`Correction request submitted for ${correctionTarget.rollNo}. Awaiting HOD review.`);
      }
    } catch (err) {
      alert('Failed to submit correction: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Students
  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status Metrics
  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const lateCount = students.filter(s => s.status === 'Late').length;
  const onDutyCount = students.filter(s => s.status === 'On Duty').length;
  const leaveCount = students.filter(s => s.status === 'Approved Leave').length;
  const totalCount = students.length || 60;
  const presentPct = Math.round((presentCount / totalCount) * 100);

  if (loading && !sessionData && students.length === 0) {
    return <BentoSkeleton />;
  }

  const activeSession = sessionData || sessions.find(s => s._id === selectedSessionId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141C] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Session Selector & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#12141C] to-slate-900 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
              Period {activeSession?.periodNumber || 1} • {activeSession?.startTime} - {activeSession?.endTime}
            </span>
            <span className="text-xs text-slate-400 font-mono">Room {activeSession?.room || 'LH-302'}</span>
            {activeSession?.isLocked ? (
              <Badge variant="danger" size="sm">
                <Lock className="w-3 h-3 mr-1 inline" /> Session Locked
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Active Session
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{activeSession?.subjectCode}: {activeSession?.subjectName}</span>
            <span className="text-slate-500 font-mono text-sm">({activeSession?.classId || 'CS-3A'})</span>
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Period Selector */}
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40 font-mono"
          >
            {sessions.map(s => (
              <option key={s._id} value={s._id} className="bg-[#12141C]">
                Period {s.periodNumber}: {s.subjectCode} ({s.room})
              </option>
            ))}
          </select>

          {/* QR Code Projector Launch */}
          <button
            onClick={handleLaunchQr}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>Launch Rotating QR</span>
          </button>

          {/* Save / Sync Button */}
          <button
            onClick={() => handleSaveAttendance(false)}
            disabled={saving || activeSession?.isLocked}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all",
              syncStatus === 'pending'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
            )}
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", saving && "animate-spin")} />
            <span>{syncStatus === 'pending' ? 'Sync Local Changes' : 'Save Attendance'}</span>
          </button>

          {/* Final Lock Button */}
          {!activeSession?.isLocked && (
            <button
              onClick={() => handleSaveAttendance(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Finalize & Lock</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics & Hotkeys Header Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium">Present Rate</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">{presentPct}%</span>
            <span className="text-[10px] text-slate-500 font-mono">({presentCount}/{totalCount})</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium">Absentees</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{absentCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium">Late Arrivals</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{lateCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium">On Duty / Leave</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{onDutyCount + leaveCount}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium">Offline Storage</div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
            <div className={clsx("w-2 h-2 rounded-full", syncStatus === 'synced' ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
            <span className={syncStatus === 'synced' ? "text-emerald-300" : "text-amber-300"}>
              {syncStatus === 'synced' ? 'IndexedDB Synced' : 'Pending Sync'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium">Fast Keybinds</div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-indigo-300">
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10">P</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10">A</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10">L</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10">↑↓</kbd>
          </div>
        </div>
      </div>

      {/* Roster Controls: Search & 1-Click Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141C] p-3 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedRowIndex(0); }}
            placeholder="Search by student name or roll number..."
            className="w-full pl-9 pr-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          {!activeSession?.isLocked && (
            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Present Except...</span>
            </button>
          )}

          <div className="text-xs text-slate-400 font-mono px-2">
            {filteredStudents.length} Students
          </div>
        </div>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="rounded-2xl border border-white/10 bg-[#12141C] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/10 font-semibold text-slate-400 tracking-wider uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center w-80">Attendance Status</th>
                <th className="py-3 px-4 w-28 text-center">Verification</th>
                <th className="py-3 px-4 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((st, idx) => {
                const isSelected = idx === selectedRowIndex;

                return (
                  <tr
                    key={st.rollNo}
                    ref={el => rowRefs.current[idx] = el}
                    onClick={() => setSelectedRowIndex(idx)}
                    className={clsx(
                      "transition-colors cursor-pointer",
                      isSelected ? "bg-indigo-500/10 border-l-2 border-indigo-400" : "hover:bg-white/[0.02]"
                    )}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Roll Number */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {st.rollNo}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{st.name}</div>
                      {st.remarks && (
                        <div className="text-[11px] text-amber-400/80 mt-0.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{st.remarks}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Pill Switcher */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {['Present', 'Absent', 'Late', 'On Duty'].map((status) => {
                          const isActive = st.status === status;
                          return (
                            <button
                              key={status}
                              disabled={activeSession?.isLocked}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetStatus(st.rollNo, status);
                              }}
                              className={clsx(
                                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                                isActive && status === 'Present' && "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30",
                                isActive && status === 'Absent' && "bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30",
                                isActive && status === 'Late' && "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30",
                                isActive && status === 'On Duty' && "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30",
                                !isActive && "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"
                              )}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Verification Method */}
                    <td className="py-3 px-4 text-center font-mono text-[10px]">
                      {st.verificationMethod === 'QR_SCAN' ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                          QR Scan
                        </span>
                      ) : st.verificationMethod === 'CORRECTION_OVERRIDE' ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold">
                          HOD Override
                        </span>
                      ) : (
                        <span className="text-slate-500">Roster</span>
                      )}
                    </td>

                    {/* Actions / Correction Request */}
                    <td className="py-3 px-4 text-right">
                      {activeSession?.isLocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCorrectionTarget(st);
                            setCorrectionForm({ newStatus: st.status === 'Present' ? 'Absent' : 'Present', reason: '' });
                            setCorrectionModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-medium transition-colors"
                        >
                          Request Edit
                        </button>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. Rotating QR Code Modal Projector */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#12141C] border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Live Session QR Check-in</div>
                  <div className="text-[11px] text-slate-400 font-mono">{activeSession?.subjectCode} • Period {activeSession?.periodNumber}</div>
                </div>
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* QR Code Presentation Box */}
            <div className="relative mx-auto w-64 h-64 p-4 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl">
              {/* Dynamic Simulated High-Density QR Pattern */}
              <div className="w-full h-full bg-slate-950 rounded-xl p-3 flex flex-col justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                
                {/* 3 Corner Anchor Marks */}
                <div className="w-full flex justify-between">
                  <div className="w-8 h-8 border-4 border-purple-400 rounded-sm flex items-center justify-center"><div className="w-3 h-3 bg-purple-400" /></div>
                  <div className="w-8 h-8 border-4 border-purple-400 rounded-sm flex items-center justify-center"><div className="w-3 h-3 bg-purple-400" /></div>
                </div>

                <div className="text-center font-mono text-xs font-bold text-purple-200 tracking-wider bg-black/70 px-2 py-1 rounded">
                  {qrToken || 'GENERATING_TOKEN'}
                </div>

                <div className="w-full flex justify-between items-end">
                  <div className="w-8 h-8 border-4 border-purple-400 rounded-sm flex items-center justify-center"><div className="w-3 h-3 bg-purple-400" /></div>
                  <div className="w-6 h-6 border-2 border-purple-300/60 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Rotation Countdown & Scan Telemetry */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>Rotates in <strong className="text-white">{qrExpiresIn}s</strong></span>
              </div>
              <div className="text-emerald-400">
                {students.filter(s => s.verificationMethod === 'QR_SCAN').length} Student Scans
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Project this screen in the lecture hall. The token automatically rotates every 15 seconds to prevent cross-room screenshot sharing.
            </p>
          </div>
        </div>
      )}

      {/* 10. Correction Request Modal */}
      {correctionModalOpen && correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSubmitCorrection}
            className="w-full max-w-md bg-[#12141C] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span>Submit Attendance Correction Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5 text-xs space-y-1">
              <div><strong className="text-slate-400">Student:</strong> <span className="text-white font-medium">{correctionTarget.name} ({correctionTarget.rollNo})</span></div>
              <div><strong className="text-slate-400">Current Status:</strong> <span className="font-mono text-rose-400">{correctionTarget.status}</span></div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Proposed New Status</label>
              <select
                value={correctionForm.newStatus}
                onChange={(e) => setCorrectionForm({ ...correctionForm, newStatus: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/40"
              >
                <option value="Present" className="bg-[#12141C]">Present</option>
                <option value="On Duty" className="bg-[#12141C]">On Duty (Authorized Event)</option>
                <option value="Approved Leave" className="bg-[#12141C]">Approved Medical Leave</option>
                <option value="Late" className="bg-[#12141C]">Late Arrival</option>
                <option value="Absent" className="bg-[#12141C]">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">
                Mandatory Justification / Proof
              </label>
              <textarea
                required
                rows={3}
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                placeholder="E.g., Student submitted medical certificate verified by campus clinic, or participated in Inter-College Hackathon OD."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Submit for HOD Approval
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default AttendanceRegister;
