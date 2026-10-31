import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  GraduationCap,
  FileText,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  Check,
  X,
  Lock,
  Layers,
  Sparkles,
  FileCheck
} from 'lucide-react';
import clsx from 'clsx';

export function ExamResultsEngine() {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('hallticket'); // 'hallticket' | 'marks_workflow' | 'transcript'
  const [schedules, setSchedules] = useState([]);
  const [hallTicket, setHallTicket] = useState(null);
  const [marksLedger, setMarksLedger] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Marks Editing State (Faculty / HOD)
  const [editableMarks, setEditableMarks] = useState([]);
  const [savingMarks, setSavingMarks] = useState(false);

  // Revaluation Request Modal
  const [revalModalOpen, setRevalModalOpen] = useState(false);
  const [revalForm, setRevalForm] = useState({
    subjectCode: 'CS301',
    reason: '',
    feeReceiptRef: 'AIT-REV-2026-9041'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedRes, ticketRes, marksRes, transRes] = await Promise.all([
        api.request('/exams/schedules?departmentCode=CSE&semester=5'),
        api.request('/exams/hallticket/22CS082').catch(() => null),
        api.request('/exams/marks/CS-3A/CS301?evaluationType=INTERNAL_CIE').catch(() => null),
        api.request('/exams/transcript/22CS082').catch(() => null)
      ]);

      if (schedRes.success) setSchedules(schedRes.data || []);
      if (ticketRes?.success) setHallTicket(ticketRes.data);
      if (marksRes?.success) {
        setMarksLedger(marksRes.data);
        setEditableMarks(marksRes.data.marksEntries || []);
      }
      if (transRes?.success) setTranscript(transRes.data);
    } catch (err) {
      console.error('Failed to load exam data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Marks Draft (Faculty)
  const handleSaveMarksDraft = async () => {
    setSavingMarks(true);
    try {
      const res = await api.request('/exams/marks/CS-3A/CS301/draft', {
        method: 'POST',
        body: JSON.stringify({ marksEntries: editableMarks })
      });
      if (res.success) {
        showToast('Marks draft saved locally. Status: FACULTY_DRAFT');
        setMarksLedger(res.data);
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingMarks(false);
    }
  };

  // Submit to HOD
  const handleSubmitToHod = async () => {
    try {
      const res = await api.request('/exams/marks/CS-3A/CS301/submit-hod', { method: 'POST' });
      if (res.success) {
        showToast('Marks ledger submitted to HOD for formal validation.');
        setMarksLedger(res.data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Publish Official Results (Exam Controller)
  const handlePublishResults = async () => {
    try {
      const res = await api.request('/exams/marks/CS-3A/CS301/publish', { method: 'POST' });
      if (res.success) {
        showToast('Results published officially by Examination Controller. Transcripts updated.');
        setMarksLedger(res.data);
        const transRes = await api.request('/exams/transcript/22CS082');
        if (transRes.success) setTranscript(transRes.data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Revaluation Request
  const handleSubmitRevaluation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.request('/exams/revaluation', {
        method: 'POST',
        body: JSON.stringify({
          rollNo: '22CS082',
          ...revalForm
        })
      });
      if (res.success) {
        showToast('Paper revaluation request registered. Receipt token generated.');
        setRevalModalOpen(false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading && !hallTicket) {
    return <BentoSkeleton />;
  }

  const isEligibleForHallTicket = hallTicket?.attendancePercentage >= 75.0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141C] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#12141C] to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="purple" size="sm">Office of the Controller of Examinations</Badge>
            <span className="text-xs text-slate-400 font-mono">Autonomous Regulations R22 • Sem 5</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-400" />
            <span>Examination Planning, Marks Workflow & Result Engine</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Strict separation of duties: Faculty marks entry $\rightarrow$ HOD validation $\rightarrow$ Controller publishing, verified hall tickets, and UGC 10-point GPA calculations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start lg:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('hallticket')}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg transition-all",
              activeTab === 'hallticket'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            Hall Ticket & Schedule
          </button>
          <button
            onClick={() => setActiveTab('marks_workflow')}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg transition-all",
              activeTab === 'marks_workflow'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            Marks Approval Workflow
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg transition-all",
              activeTab === 'transcript'
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            Transcript & SGPA
          </button>
        </div>
      </div>

      {/* TAB 1: HALL TICKET & EXAM PLANNING */}
      {activeTab === 'hallticket' && (
        <div className="space-y-6">
          
          {/* Eligibility Alert Banner */}
          <div className={clsx(
            "p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3",
            isEligibleForHallTicket
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          )}>
            <div className="flex items-center gap-2.5">
              {isEligibleForHallTicket ? <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />}
              <div>
                <div className="font-bold text-white text-sm">
                  {isEligibleForHallTicket
                    ? 'Attendance Requirement Satisfied (Eligible for Examinations)'
                    : 'Attendance Shortfall: Student Detained from Examination'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  Verified Attendance: <strong>{hallTicket?.attendancePercentage}%</strong> (Statutory limit: 75.0%).
                  {isEligibleForHallTicket ? ' Official Hall Ticket with secrecy room allocations unlocked.' : ' Submit an urgent condonation appeal to HOD with medical certificate.'}
                </div>
              </div>
            </div>

            {isEligibleForHallTicket && (
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Hall Ticket</span>
              </button>
            )}
          </div>

          {/* Printable Official Hall Ticket Document */}
          {isEligibleForHallTicket && hallTicket && (
            <div className="p-8 rounded-3xl bg-[#12141C] border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
              
              {/* College Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
                <div>
                  <div className="text-xs text-indigo-400 font-mono font-semibold uppercase tracking-wider">
                    Apex Institute of Technology • Autonomous Examination Authority
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Midterm Examination Hall Ticket & Admit Card
                  </h2>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Ticket Ref: {hallTicket.ticketNumber} • Academic Session 2025-2026
                  </div>
                </div>

                {/* QR Code Verification Stamp */}
                <div className="p-2.5 rounded-xl bg-white text-slate-950 flex items-center gap-3 self-start sm:self-auto shadow-xl">
                  <div className="w-12 h-12 bg-black rounded-lg p-1 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left font-mono text-[10px]">
                    <div className="font-bold text-indigo-900">VERIFIED AUTHENTIC</div>
                    <div className="text-slate-600">Scan at Entry Door</div>
                  </div>
                </div>
              </div>

              {/* Student Dossier Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-black/20 border border-white/5 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Student Name</span>
                  <div className="font-bold text-white mt-0.5">{hallTicket.studentName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Roll No / USN</span>
                  <div className="font-bold text-indigo-300 mt-0.5">{hallTicket.rollNo} ({hallTicket.usn})</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Program & Cohort</span>
                  <div className="font-bold text-white mt-0.5">{hallTicket.departmentCode} • {hallTicket.classId}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Statutory Attendance</span>
                  <div className="font-bold text-emerald-400 mt-0.5">{hallTicket.attendancePercentage}% (Eligible)</div>
                </div>
              </div>

              {/* Desk & Secrecy Hall Allocation Matrix */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Secrecy Room & Desk Allocations
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/40 text-[10px] text-slate-400 font-mono uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">Date & Session</th>
                        <th className="py-2.5 px-4">Examination Timings</th>
                        <th className="py-2.5 px-4 text-center">Allocated Room</th>
                        <th className="py-2.5 px-4 text-right">Desk Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {hallTicket.deskAllocations.map((d, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-sans font-semibold text-white">
                            {d.subjectCode}: {d.subjectName}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {d.date} ({d.session})
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {d.time}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-300">
                            {d.room}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">
                            {d.deskNumber}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Secrecy Watermark & Instructions */}
              <div className="text-[11px] text-slate-400 leading-relaxed border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-end gap-4 font-mono">
                <div>
                  <p>1. Candidates must carry their physical college ID card along with this verified Hall Ticket.</p>
                  <p>2. Electronic communication devices and smartwatches are strictly prohibited inside exam halls.</p>
                </div>
                <div className="text-right text-slate-500 text-[10px]">
                  <div>Controller of Examinations</div>
                  <div>Digitally Signed & Sealed</div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: MARKS APPROVAL WORKFLOW (SEPARATION OF DUTIES) */}
      {activeTab === 'marks_workflow' && (
        <div className="space-y-4">
          
          {/* Workflow Stepper Bar */}
          <div className="p-4 rounded-2xl bg-[#12141C] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-white text-sm">Continuous Internal Evaluation (CIE) Marks Ledger</div>
              <div className="text-slate-400 font-mono text-[11px]">
                CS-3A • CS301 Design & Analysis of Algorithms • Max 40 Scaled CIE Marks
              </div>
            </div>

            {/* Stage Badge & Actions */}
            <div className="flex items-center gap-2">
              <span className={clsx(
                "px-3 py-1 rounded-full font-mono text-xs font-bold uppercase",
                marksLedger?.workflowState === 'CONTROLLER_PUBLISHED' ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" :
                marksLedger?.workflowState === 'HOD_VALIDATED' ? "bg-blue-500/10 text-blue-300 border border-blue-500/30" :
                "bg-amber-500/10 text-amber-300 border border-amber-500/30"
              )}>
                {marksLedger?.workflowState?.replace(/_/g, ' ') || 'FACULTY DRAFT'}
              </span>

              {/* Faculty Action */}
              {marksLedger?.workflowState === 'FACULTY_DRAFT' && (
                <>
                  <button
                    onClick={handleSaveMarksDraft}
                    disabled={savingMarks}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handleSubmitToHod}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    Submit to HOD
                  </button>
                </>
              )}

              {/* Controller Action */}
              {marksLedger?.workflowState === 'HOD_VALIDATED' && (
                <button
                  onClick={handlePublishResults}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-colors shadow-lg shadow-emerald-600/30"
                >
                  Publish Official Results
                </button>
              )}
            </div>
          </div>

          {/* Marks Table with Inline Inputs */}
          <div className="rounded-2xl border border-white/10 bg-[#12141C] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-black/30 text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-sans">Student Name</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4 text-center">Test 1 (30)</th>
                    <th className="py-3 px-4 text-center">Test 2 (30)</th>
                    <th className="py-3 px-4 text-center">Continuous Obs (20)</th>
                    <th className="py-3 px-4 text-center">Scaled CIE (40)</th>
                    <th className="py-3 px-4 text-center">Exam Marks (60)</th>
                    <th className="py-3 px-4 text-center">Total (100)</th>
                    <th className="py-3 px-4 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {editableMarks.map((entry, idx) => (
                    <tr key={entry.rollNo} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                        {entry.studentName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {entry.rollNo}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          disabled={marksLedger?.workflowState === 'CONTROLLER_PUBLISHED'}
                          value={entry.internalTest1 || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const copy = [...editableMarks];
                            copy[idx].internalTest1 = val;
                            setEditableMarks(copy);
                          }}
                          className="w-16 bg-black/30 border border-white/10 rounded-lg py-1 px-2 text-center text-white focus:outline-none focus:border-indigo-500/40"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          disabled={marksLedger?.workflowState === 'CONTROLLER_PUBLISHED'}
                          value={entry.internalTest2 || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const copy = [...editableMarks];
                            copy[idx].internalTest2 = val;
                            setEditableMarks(copy);
                          }}
                          className="w-16 bg-black/30 border border-white/10 rounded-lg py-1 px-2 text-center text-white focus:outline-none focus:border-indigo-500/40"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          disabled={marksLedger?.workflowState === 'CONTROLLER_PUBLISHED'}
                          value={entry.continuousEvaluation || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const copy = [...editableMarks];
                            copy[idx].continuousEvaluation = val;
                            setEditableMarks(copy);
                          }}
                          className="w-16 bg-black/30 border border-white/10 rounded-lg py-1 px-2 text-center text-white focus:outline-none focus:border-indigo-500/40"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-300">
                        {entry.scaledInternalMarks || Math.round(((entry.internalTest1 || 0) + (entry.internalTest2 || 0)) / 2 + (entry.continuousEvaluation || 0) * 0.5)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {entry.externalExamMarks || 48}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white text-sm">
                        {entry.totalMarks || 84}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {entry.letterGrade || 'A+'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC TRANSCRIPT & REVALUATIONS */}
      {activeTab === 'transcript' && transcript && (
        <div className="space-y-6">
          
          {/* GPA Telemetry Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#12141C] border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Semester SGPA</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{transcript.sgpa} / 10.0</div>
              <div className="text-[11px] text-slate-400 mt-1">UGC 10-Point Scale</div>
            </div>

            <div className="p-4 rounded-xl bg-[#12141C] border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Cumulative CGPA</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{transcript.cumulativeCgpa}</div>
              <div className="text-[11px] text-slate-400 mt-1">First Class with Distinction</div>
            </div>

            <div className="p-4 rounded-xl bg-[#12141C] border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Credits Earned</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{transcript.totalCreditsEarned} / {transcript.totalCreditsRegistered}</div>
              <div className="text-[11px] text-slate-400 mt-1">All Courses Cleared</div>
            </div>

            <div className="p-4 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Backlog Count</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{transcript.backlogCount}</div>
              </div>
              <button
                onClick={() => setRevalModalOpen(true)}
                className="text-indigo-400 text-xs font-semibold hover:underline flex items-center gap-1 font-mono mt-1"
              >
                <span>Request Revaluation →</span>
              </button>
            </div>
          </div>

          {/* Transcript Subjects Table */}
          <div className="rounded-2xl border border-white/10 bg-[#12141C] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-black/30 text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-sans">Course Code & Title</th>
                    <th className="py-3 px-4 text-center">Credits</th>
                    <th className="py-3 px-4 text-center">CIE Marks (40)</th>
                    <th className="py-3 px-4 text-center">SEE Marks (60)</th>
                    <th className="py-3 px-4 text-center">Total (100)</th>
                    <th className="py-3 px-4 text-center">Grade Point</th>
                    <th className="py-3 px-4 text-right">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transcript.subjects?.map((sub) => (
                    <tr key={sub.subjectCode} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-sans font-semibold text-white">
                        <span className="font-mono text-indigo-400 font-bold mr-2">{sub.subjectCode}</span>
                        <span>{sub.subjectName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                        {sub.credits}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {sub.internalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {sub.externalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-white text-sm">
                        {sub.totalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-400">
                        {sub.gradePoint} / 10
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <span className="px-2.5 py-0.5 rounded font-bold font-mono text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {sub.letterGrade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Revaluation Request */}
      {revalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSubmitRevaluation}
            className="w-full max-w-md bg-[#12141C] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Paper Revaluation & Photocopy Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setRevalModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Select Subject</label>
              <select
                value={revalForm.subjectCode}
                onChange={(e) => setRevalForm({ ...revalForm, subjectCode: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="CS301" className="bg-[#12141C]">CS301: Design & Analysis of Algorithms</option>
                <option value="CS302" className="bg-[#12141C]">CS302: Operating Systems & Kernels</option>
                <option value="MA301" className="bg-[#12141C]">MA301: Discrete Mathematical Structures</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Reason for Revaluation Appeal</label>
              <textarea
                required
                rows={3}
                value={revalForm.reason}
                onChange={(e) => setRevalForm({ ...revalForm, reason: e.target.value })}
                placeholder="E.g., In Question 4b (Dynamic Programming matrix chain), answer verified with official solution key indicates full marks deserved."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Fee Receipt Reference Number</label>
              <input
                type="text"
                required
                value={revalForm.feeReceiptRef}
                onChange={(e) => setRevalForm({ ...revalForm, feeReceiptRef: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRevalModalOpen(false)}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                Submit Revaluation Request
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default ExamResultsEngine;
