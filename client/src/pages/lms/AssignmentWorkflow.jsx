import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { db, createOfflineContract, createOfflineMutation } from '../../db/dexieDb.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSync } from '../../context/SyncContext.jsx';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Sliders,
  Send,
  MessageSquare,
  HardDrive,
  Download,
  Filter,
  Search,
  Plus,
  RefreshCw,
  FileCheck,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

export function AssignmentWorkflow() {
  const { user, activeRole } = useAuth();
  const { isOnline } = useSync();

  const isFaculty = ['FACULTY', 'CLASS_ADVISOR', 'HOD', 'PRINCIPAL'].includes(activeRole);

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading Drawer State (Faculty)
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gradingRubricScores, setGradingRubricScores] = useState({});
  const [facultyFeedback, setFacultyFeedback] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);

  // Student Submission State
  const [submissionText, setSubmissionText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [offlineExceptionReason, setOfflineExceptionReason] = useState('');
  const [showExceptionBox, setShowExceptionBox] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 1. Load Assignments
  const loadAssignments = async () => {
    try {
      if (navigator.onLine) {
        const res = await api.request('/assignments?classId=CS-3A');
        if (res.success && res.data.length > 0) {
          setAssignments(res.data);
          if (!selectedAssignmentId) setSelectedAssignmentId(res.data[0]._id || res.data[0].recordId);
          return;
        }
      }
    } catch (err) {
      console.warn('Online assignment load failed, trying IndexedDB:', err.message);
    }

    // Offline IndexedDB Load
    try {
      const cached = await db.assignments.toArray();
      if (cached.length > 0) {
        setAssignments(cached);
        if (!selectedAssignmentId) setSelectedAssignmentId(cached[0]._id || cached[0].recordId);
      }
    } catch (dbErr) {
      console.error('Dexie read failed', dbErr);
    }
  };

  // 2. Load Details & Submissions
  const loadAssignmentDetails = async (id) => {
    if (!id) return;
    setLoading(true);

    try {
      if (navigator.onLine) {
        const [detailRes, subsRes] = await Promise.all([
          api.request(`/assignments/${id}`),
          api.request(`/assignments/${id}/submissions`).catch(() => ({ data: { submissions: [] } }))
        ]);

        if (detailRes.success) setAssignmentData(detailRes.data);
        if (subsRes.success) setSubmissions(subsRes.data.submissions || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Online fetch failed, falling back to cached details:', err.message);
    }

    // Offline fallback
    const target = assignments.find(a => (a._id === id || a.recordId === id));
    setAssignmentData(target || null);
    setLoading(false);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      loadAssignmentDetails(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  // Handle open grading drawer
  const handleOpenGrading = (sub) => {
    setActiveSubmission(sub);
    const initialScores = {};
    if (sub.rubricScores && sub.rubricScores.length > 0) {
      sub.rubricScores.forEach(r => { initialScores[r.criterionName] = r.pointsAwarded; });
    } else if (assignmentData?.rubric) {
      assignmentData.rubric.forEach(r => { initialScores[r.criterionName] = r.maxPoints; });
    }
    setGradingRubricScores(initialScores);
    setFacultyFeedback(sub.facultyFeedback || sub.aiDraftFeedback || '');
  };

  // Generate AI Draft Feedback
  const handleGenerateAiFeedback = async () => {
    setAiDraftLoading(true);
    const rubricArray = Object.entries(gradingRubricScores).map(([name, pts]) => ({
      criterionName: name,
      pointsAwarded: pts,
      maxPoints: assignmentData?.rubric?.find(r => r.criterionName === name)?.maxPoints || 10
    }));

    try {
      const res = await api.request(`/assignments/${selectedAssignmentId}/submissions/${activeSubmission._id}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          rubricScores: rubricArray,
          facultyFeedback,
          generateAiDraft: true,
          releaseFeedback: false
        })
      });

      if (res.success) {
        setFacultyFeedback(res.data.aiDraftFeedback);
        showToast('AI constructive feedback suggestion generated based on rubric criteria.');
      }
    } catch (err) {
      alert('AI feedback generation failed: ' + err.message);
    } finally {
      setAiDraftLoading(false);
    }
  };

  // Submit Grade & Release Feedback
  const handleSaveGrade = async (releaseFeedback = false) => {
    setSavingGrade(true);
    const rubricArray = Object.entries(gradingRubricScores).map(([name, pts]) => ({
      criterionName: name,
      pointsAwarded: pts,
      maxPoints: assignmentData?.rubric?.find(r => r.criterionName === name)?.maxPoints || 10
    }));

    try {
      const res = await api.request(`/assignments/${selectedAssignmentId}/submissions/${activeSubmission._id}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          rubricScores: rubricArray,
          facultyFeedback,
          releaseFeedback
        })
      });

      if (res.success) {
        showToast(releaseFeedback ? 'Feedback released to student portal.' : 'Grade draft saved.');
        setActiveSubmission(null);
        await loadAssignmentDetails(selectedAssignmentId);
      }
    } catch (err) {
      alert('Failed to save grade: ' + err.message);
    } finally {
      setSavingGrade(false);
    }
  };

  // Student Submit Work
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingStudent(true);

    const clientTimestamp = new Date().toISOString();
    const payload = {
      submissionFiles: attachedFiles.length > 0 ? attachedFiles : [
        { fileName: '22CS082_Tree_Knapsack_Solution.cpp', fileSizeBytes: 12400, mimeType: 'text/x-c++src' },
        { fileName: '22CS082_Algorithmic_Proof_Report.pdf', fileSizeBytes: 4194304, mimeType: 'application/pdf' }
      ],
      submissionText: submissionText || 'Implemented dynamic programming algorithm on trees with O(N) space complexity.',
      clientTimestamp,
      offlineExceptionReason: showExceptionBox ? offlineExceptionReason : ''
    };

    try {
      if (!navigator.onLine) {
        // Save to Dexie offline queue
        const mutation = createOfflineMutation({
          entityType: 'assignments',
          entityId: `sub_${selectedAssignmentId}_local`,
          operationType: 'CREATE',
          payload
        });
        await db.offlineMutations.put(mutation);
        showToast('Offline Mode: Submission cached locally in IndexedDB. Will sync when back online.');
        setSubmittingStudent(false);
        return;
      }

      const res = await api.request(`/assignments/${selectedAssignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        showToast(res.message);
        setSubmissionText('');
        setAttachedFiles([]);
        setShowExceptionBox(false);
        await loadAssignmentDetails(selectedAssignmentId);
      }
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmittingStudent(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading && !assignmentData) {
    return <BentoSkeleton />;
  }

  const activeAssignment = assignmentData || assignments.find(a => a._id === selectedAssignmentId || a.recordId === selectedAssignmentId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141C] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#12141C] to-slate-900 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
              {activeAssignment?.subjectCode || 'CS301'} • Due {activeAssignment?.dueDate ? new Date(activeAssignment.dueDate).toLocaleDateString() : 'Nov 30'}
            </span>
            <Badge variant="primary" size="sm">
              Max {activeAssignment?.maxMarks || 25} Marks
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{activeAssignment?.title}</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            {activeAssignment?.description}
          </p>
        </div>

        {/* Assignment Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedAssignmentId || ''}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40 font-mono"
          >
            {assignments.map(a => (
              <option key={a._id || a.recordId} value={a._id || a.recordId} className="bg-[#12141C]">
                {a.subjectCode}: {a.title.slice(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: FACULTY VIEW — Submissions & Inline Rubric Grading */}
      {isFaculty ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <span>Student Submissions & Rubric Evaluation Ledger</span>
            </h2>
            <div className="text-xs text-slate-400 font-mono">
              {submissions.length} Submissions • {submissions.filter(s => s.status === 'Graded' || s.status === 'Feedback Released').length} Graded
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12141C] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/30 border-b border-white/10 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Submitted At (Official)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-right">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {submissions.map((sub) => {
                    return (
                      <tr key={sub._id || sub.recordId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-300">
                          {sub.rollNo}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {sub.studentName}
                          {sub.offlineException?.requested && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                              Offline Exception Req
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(sub.submittedAt).toLocaleString()}
                          {sub.isLate && (
                            <span className="ml-1 text-rose-400 font-semibold">(Late)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={clsx(
                            "px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold",
                            sub.status === 'Feedback Released' ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" :
                            sub.status === 'Graded' ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30" :
                            sub.status === 'Late' ? "bg-rose-500/10 text-rose-300 border border-rose-500/30" :
                            "bg-white/5 text-slate-400 border border-white/10"
                          )}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                          {sub.totalScore !== null ? (
                            <span className="text-emerald-400">{sub.totalScore} / {sub.maxScore}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium transition-colors"
                          >
                            Grade Rubric
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SECTION 2: STUDENT VIEW — Offline-Ready Assignment Submission */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Instructions & Rubric Card */}
          <div className="lg:col-span-7 space-y-4">
            <BentoCard
              colSpan="col-span-12"
              title="Assignment Rubric Criteria"
              subtitle="Scoring benchmarks configured by the course instructor"
            >
              <div className="space-y-3 pt-2">
                {activeAssignment?.rubric?.map((crit, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{crit.criterionName}</span>
                      <span className="font-mono text-indigo-400 font-bold">{crit.maxPoints} Points</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{crit.description}</p>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Offline Attachment Alert Banner */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Offline-First Submission Notice</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Official submission timestamps are recorded upon server receipt. If network outage causes late arrival, you can attach an auditable Offline Exception Request with device logs.
              </p>
            </div>
          </div>

          {/* Submission Composer Card */}
          <div className="lg:col-span-5">
            <BentoCard
              colSpan="col-span-12"
              title="Submit Assignment Solution"
              subtitle="Attach code and report for automated server receipt"
            >
              <form onSubmit={handleStudentSubmit} className="space-y-4 pt-2 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Attached Files</label>
                  <div className="p-4 rounded-xl bg-black/20 border-2 border-dashed border-white/10 hover:border-indigo-500/40 transition-colors text-center cursor-pointer">
                    <UploadCloud className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                    <span className="text-slate-400 font-mono text-[11px]">Click or drag & drop C++, Java, PDF files</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Solution Notes / Asymptotic Analysis</label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Briefly describe your approach, recurrence relations, and Big-O complexity..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                {/* Offline Exception Request Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowExceptionBox(!showExceptionBox)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>{showExceptionBox ? '– Remove Offline Exception Request' : '+ Request Offline Network Outage Exception'}</span>
                  </button>

                  {showExceptionBox && (
                    <div className="mt-2 space-y-1">
                      <textarea
                        rows={2}
                        value={offlineExceptionReason}
                        onChange={(e) => setOfflineExceptionReason(e.target.value)}
                        placeholder="State reason for offline submission delay (e.g., campus dormitory broadband failure between 22:00 - 23:30)..."
                        className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingStudent}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingStudent ? 'Uploading & Timestamping...' : 'Submit Assignment'}</span>
                </button>
              </form>
            </BentoCard>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: Inline Faculty Rubric Grading Drawer */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl h-full bg-[#12141C] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200 text-xs">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Evaluate: {activeSubmission.studentName}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Roll: {activeSubmission.rollNo} • Status: {activeSubmission.status}
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubmission(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Submission Files & Text */}
              <div className="mt-4 p-3.5 rounded-xl bg-white/5 space-y-2">
                <div className="font-semibold text-slate-300">Submitted Files:</div>
                <div className="space-y-1">
                  {activeSubmission.submissionFiles?.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-black/20 font-mono text-[11px]">
                      <span>{f.fileName}</span>
                      <button className="text-indigo-400 hover:underline">Preview</button>
                    </div>
                  ))}
                </div>
                {activeSubmission.submissionText && (
                  <p className="text-slate-400 italic text-[11px] pt-1">"{activeSubmission.submissionText}"</p>
                )}
              </div>

              {/* Rubric Criteria Sliders */}
              <div className="mt-5 space-y-4">
                <div className="font-bold text-slate-200 uppercase text-[11px] tracking-wider">
                  Rubric Scoring Criteria
                </div>
                {assignmentData?.rubric?.map((crit, idx) => {
                  const currentScore = gradingRubricScores[crit.criterionName] ?? crit.maxPoints;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{crit.criterionName}</span>
                        <span className="font-mono font-bold text-indigo-400">
                          {currentScore} / {crit.maxPoints} Pts
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={crit.maxPoints}
                        value={currentScore}
                        onChange={(e) => setGradingRubricScores({
                          ...gradingRubricScores,
                          [crit.criterionName]: parseInt(e.target.value, 10)
                        })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {/* AI Constructive Feedback Assistant */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Instructor Feedback</span>
                  <button
                    type="button"
                    onClick={handleGenerateAiFeedback}
                    disabled={aiDraftLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiDraftLoading ? 'Synthesizing...' : 'Draft AI Feedback'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={facultyFeedback}
                  onChange={(e) => setFacultyFeedback(e.target.value)}
                  placeholder="Provide constructive assessment comments for the student..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 text-xs"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="font-mono text-sm font-bold text-white">
                Total Score: <span className="text-emerald-400">
                  {Object.values(gradingRubricScores).reduce((a, b) => a + b, 0)} / {activeSubmission.maxScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveGrade(false)}
                  disabled={savingGrade}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGrade(true)}
                  disabled={savingGrade}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-600/20"
                >
                  Release Feedback
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AssignmentWorkflow;
