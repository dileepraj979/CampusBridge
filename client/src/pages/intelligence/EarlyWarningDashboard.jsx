import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  TrendingDown,
  Sliders,
  Filter,
  FileText,
  Lock,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  Search,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import clsx from 'clsx';

export function EarlyWarningDashboard() {
  const { user, activeRole } = useAuth();

  // Threshold controls
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [missedAssignmentsThreshold, setMissedAssignmentsThreshold] = useState(2);
  const [backlogThreshold, setBacklogThreshold] = useState(0);
  const [cgpaThreshold, setCgpaThreshold] = useState(6.5);
  const [showThresholdControls, setShowThresholdControls] = useState(false);

  // Data states
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalEvaluated: 8,
    highRiskCount: 2,
    moderateRiskCount: 3,
    watchlistCount: 1,
    stableCount: 2,
    activeCounselingCount: 3
  });
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'HIGH_RISK' | 'MODERATE_RISK' | 'WATCHLIST'

  // Counseling notes drawer / modal
  const [counselingNotes, setCounselingNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showLogNoteModal, setShowLogNoteModal] = useState(false);
  const [newNoteForm, setNewNoteForm] = useState({
    sessionType: 'ACADEMIC_INTERVENTION',
    keyConcerns: '',
    notes: '',
    actionPlan: '',
    nextFollowUpDate: ''
  });
  const [submittingNote, setSubmittingNote] = useState(false);

  // Fetch early warning data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        departmentId: user?.departmentId || 'CSE',
        classId: 'CS-3A',
        attendanceThreshold: attendanceThreshold.toString(),
        missedAssignmentsThreshold: missedAssignmentsThreshold.toString(),
        backlogThreshold: backlogThreshold.toString(),
        cgpaThreshold: cgpaThreshold.toString()
      });

      const res = await fetch(`http://localhost:5000/api/intelligence/early-warning?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cb_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        if (data.meta?.summary) {
          setSummary(data.meta.summary);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch early warning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [attendanceThreshold, missedAssignmentsThreshold, backlogThreshold, cgpaThreshold]);

  // Fetch confidential counseling notes for a selected student
  const fetchStudentCounselingNotes = async (rollNo) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`http://localhost:5000/api/intelligence/counseling-notes?rollNo=${rollNo}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('cb_token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCounselingNotes(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load counseling notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    fetchStudentCounselingNotes(student.rollNo);
  };

  // Submit new confidential counseling note
  const handleSubmitCounselingNote = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !newNoteForm.notes || !newNoteForm.actionPlan) return;

    setSubmittingNote(true);
    try {
      const res = await fetch('http://localhost:5000/api/intelligence/counseling-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cb_token') || ''}`
        },
        body: JSON.stringify({
          studentRollNo: selectedStudent.rollNo,
          studentName: selectedStudent.name,
          departmentId: selectedStudent.departmentId,
          classId: selectedStudent.classId,
          sessionType: newNoteForm.sessionType,
          keyConcerns: newNoteForm.keyConcerns.split(',').map(s => s.trim()).filter(Boolean),
          notes: newNoteForm.notes,
          actionPlan: newNoteForm.actionPlan,
          nextFollowUpDate: newNoteForm.nextFollowUpDate || null
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowLogNoteModal(false);
        setNewNoteForm({
          sessionType: 'ACADEMIC_INTERVENTION',
          keyConcerns: '',
          notes: '',
          actionPlan: '',
          nextFollowUpDate: ''
        });
        fetchStudentCounselingNotes(selectedStudent.rollNo);
      }
    } catch (err) {
      console.error('Failed to submit counseling note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Filter students by risk level and search
  const filteredStudents = students.filter(s => {
    const matchesFilter = riskFilter === 'ALL' || s.riskLevel === riskFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Academic Early-Warning Intelligence
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Proactive Student Care
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Department CSE • Class CS-3A • Real-time attendance deficits, backlog spikes, and confidential counseling notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowThresholdControls(!showThresholdControls)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
              showThresholdControls
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurable Thresholds</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            Recalculate Risk Matrix
          </button>
        </div>
      </div>

      {/* Configurable Threshold Drawer Bar */}
      {showThresholdControls && (
        <div className="p-4 rounded-2xl bg-[#12141C] border border-indigo-500/30 shadow-xl space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Sliders className="w-4 h-4" />
              Dynamic Early-Warning Sensitivity Parameters
            </span>
            <span className="text-[11px] text-slate-400">Values update student risk scores automatically</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Min Attendance:</span>
                <span className="font-mono text-indigo-300 font-bold">{attendanceThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="85"
                step="1"
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">Statutory minimum: 75%</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Missed Assignments:</span>
                <span className="font-mono text-amber-400 font-bold">{missedAssignmentsThreshold} max</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={missedAssignmentsThreshold}
                onChange={(e) => setMissedAssignmentsThreshold(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">Flags students exceeding limit</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Backlog Spike:</span>
                <span className="font-mono text-rose-400 font-bold">&gt; {backlogThreshold} backlogs</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={backlogThreshold}
                onChange={(e) => setBacklogThreshold(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">Trigger on any active arrears</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Benchmark CGPA:</span>
                <span className="font-mono text-purple-400 font-bold">{cgpaThreshold} / 10.0</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="8.0"
                step="0.1"
                value={cgpaThreshold}
                onChange={(e) => setCgpaThreshold(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500">Academic probation threshold</div>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#12141C] border border-white/[0.08] space-y-1">
          <div className="text-xs text-slate-400">Total Evaluated</div>
          <div className="text-2xl font-bold font-mono text-white">{summary.totalEvaluated}</div>
          <div className="text-[10px] text-slate-500">Cohort CS-3A</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
          <div className="text-xs text-rose-300 font-medium">Critical Risk</div>
          <div className="text-2xl font-bold font-mono text-rose-400">{summary.highRiskCount}</div>
          <div className="text-[10px] text-rose-400/80">Immediate intervention</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <div className="text-xs text-amber-300 font-medium">Moderate Risk</div>
          <div className="text-2xl font-bold font-mono text-amber-400">{summary.moderateRiskCount}</div>
          <div className="text-[10px] text-amber-400/80">Attendance / task deficit</div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
          <div className="text-xs text-indigo-300 font-medium">Watchlist</div>
          <div className="text-2xl font-bold font-mono text-indigo-400">{summary.watchlistCount}</div>
          <div className="text-[10px] text-indigo-400/80">Borderline metrics</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="text-xs text-emerald-300 font-medium">Stable Cohort</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{summary.stableCount}</div>
          <div className="text-[10px] text-emerald-400/80">&gt;= 75% &amp; clear standing</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12141C] border border-white/[0.08] space-y-1">
          <div className="text-xs text-slate-400">Active Counseling</div>
          <div className="text-2xl font-bold font-mono text-purple-400">{summary.activeCounselingCount}</div>
          <div className="text-[10px] text-slate-500">Mentoring in progress</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#12141C] rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'HIGH_RISK', 'MODERATE_RISK', 'WATCHLIST'].map((rf) => (
            <button
              key={rf}
              onClick={() => setRiskFilter(rf)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
                riskFilter === rf
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {rf === 'ALL'
                ? 'All Students'
                : rf === 'HIGH_RISK'
                ? 'High Risk'
                : rf === 'MODERATE_RISK'
                ? 'Moderate Risk'
                : 'Watchlist'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or roll no..."
            className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Table: Student Risk Register */}
      <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 text-slate-400 border-b border-white/[0.08] font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Missed Tasks</th>
                <th className="py-3 px-4">Backlogs</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Evaluating academic risk signals across cohort...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No students match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr
                    key={s.rollNo}
                    onClick={() => handleSelectStudent(s)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{s.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{s.rollNo} • {s.classId}</div>
                    </td>

                    <td className="py-3 px-4">
                      {s.riskLevel === 'HIGH_RISK' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Critical Risk
                        </span>
                      ) : s.riskLevel === 'MODERATE_RISK' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Moderate
                        </span>
                      ) : s.riskLevel === 'WATCHLIST' ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Watchlist
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Stable
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              s.riskScore >= 60 ? 'bg-rose-500' : s.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${s.riskScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 font-bold">{s.riskScore}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          'font-mono font-bold',
                          s.attendancePct < 65
                            ? 'text-rose-400'
                            : s.attendancePct < 75
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        )}
                      >
                        {s.attendancePct}%
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          'font-mono',
                          s.missedAssignments > 0 ? 'text-amber-300 font-semibold' : 'text-slate-400'
                        )}
                      >
                        {s.missedAssignments}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          'font-mono',
                          s.backlogCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'
                        )}
                      >
                        {s.backlogCount}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-200 font-medium">{s.currentCgpa}</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStudent(s);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition-colors text-xs flex items-center gap-1 ml-auto"
                      >
                        <span>Factors &amp; Notes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over / Modal: Student Factor Breakdown & Confidential Mentoring Notes */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedStudent(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-2xl bg-[#0F111A] border-l border-white/[0.08] flex flex-col h-full shadow-2xl shadow-black z-10 overflow-y-auto">
            
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] bg-[#12141C] flex items-center justify-between sticky top-0 z-20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">{selectedStudent.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {selectedStudent.rollNo}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selectedStudent.departmentId} • Class {selectedStudent.classId} • Academic Risk Profile
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              
              {/* Snapshot Cards */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-slate-400">Risk Score</div>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">{selectedStudent.riskScore}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-slate-400">Attendance</div>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{selectedStudent.attendancePct}%</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-slate-400">Missed Tasks</div>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">{selectedStudent.missedAssignments}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-slate-400">Backlogs</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{selectedStudent.backlogCount}</div>
                </div>
              </div>

              {/* Exact Contributing Factors Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Exact Contributing Risk Factors ({selectedStudent.contributingFactors?.length || 0})
                </h4>

                {selectedStudent.contributingFactors?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All academic engagement metrics satisfy institutional benchmark thresholds.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.contributingFactors?.map((cf, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          'p-3 rounded-xl border flex items-start gap-3',
                          cf.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        )}
                      >
                        <div className="w-2 h-2 rounded-full bg-current mt-1.5 shrink-0" />
                        <div className="flex-1 text-xs">
                          <div className="font-semibold flex items-center justify-between">
                            <span>{cf.factor.replace('_', ' ')}</span>
                            <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-black/40">
                              {cf.severity}
                            </span>
                          </div>
                          <div className="text-slate-300 mt-0.5">{cf.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confidential Mentoring & Counseling Notes Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      Confidential Mentoring &amp; Counseling Notes
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Audit Logged
                    </span>
                  </div>

                  <button
                    onClick={() => setShowLogNoteModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Session</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[11px] text-slate-400">
                  🔒 <strong>Privacy Assurance:</strong> Mentoring notes are strictly isolated from general faculty and students. Every view and edit is recorded with timestamp and accessor role.
                </div>

                {loadingNotes ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Loading confidential notes...
                  </div>
                ) : counselingNotes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-slate-500">
                    No counseling sessions recorded yet for {selectedStudent.name}. Click "Log Session" to add an intervention.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {counselingNotes.map((note) => (
                      <div
                        key={note._id}
                        className="p-4 rounded-2xl bg-[#12141C] border border-white/[0.08] space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-300">
                            {note.sessionType.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {new Date(note.sessionDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                          {note.notes}
                        </div>

                        <div className="text-xs text-slate-400">
                          <strong className="text-slate-200">Action Plan: </strong>
                          {note.actionPlan}
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Counselor: {note.counselorName} ({note.counselorRole})</span>
                          {note.nextFollowUpDate && (
                            <span className="font-mono text-amber-400">
                              Next: {new Date(note.nextFollowUpDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal: Log New Counseling Session */}
      {showLogNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setShowLogNoteModal(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-lg bg-[#12141C] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Log Confidential Counseling Session</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Student: {selectedStudent?.name} ({selectedStudent?.rollNo})
                </div>
              </div>
              <button
                onClick={() => setShowLogNoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCounselingNote} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Session Type</label>
                <select
                  value={newNoteForm.sessionType}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, sessionType: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACADEMIC_INTERVENTION">Academic Intervention</option>
                  <option value="ONE_ON_ONE_MENTORING">One-on-One Mentoring</option>
                  <option value="ATTENDANCE_WARNING">Attendance Warning Notice</option>
                  <option value="PARENT_CONSULTATION">Parent Consultation</option>
                  <option value="CAREER_GUIDANCE">Career Guidance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Key Concerns (comma separated)</label>
                <input
                  type="text"
                  value={newNoteForm.keyConcerns}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, keyConcerns: e.target.value })}
                  placeholder="e.g. Lab attendance deficit, difficulty with DP algorithms"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Confidential Session Notes</label>
                <textarea
                  rows="3"
                  value={newNoteForm.notes}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, notes: e.target.value })}
                  placeholder="Detailed session observations and student responses..."
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Prescribed Action Plan</label>
                <input
                  type="text"
                  value={newNoteForm.actionPlan}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, actionPlan: e.target.value })}
                  placeholder="e.g. Attend remedial sessions Mon/Wed, resubmit Assignment 2"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={newNoteForm.nextFollowUpDate}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, nextFollowUpDate: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogNoteModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submittingNote ? 'Recording Note...' : 'Save Note (Audit Logged)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default EarlyWarningDashboard;
