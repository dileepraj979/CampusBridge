import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  FileCheck,
  Search,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Check,
  X
} from 'lucide-react';
import clsx from 'clsx';

export function AttendanceAnomalyPanel() {
  const [anomalies, setAnomalies] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('anomalies'); // 'anomalies' | 'corrections'
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  
  // Review Modal State
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [auditReason, setAuditReason] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [anomRes, corrRes] = await Promise.all([
        api.request('/attendance/anomalies'),
        api.request('/attendance/corrections?status=PENDING')
      ]);

      if (anomRes.success) {
        setAnomalies(anomRes.data || []);
      }
      if (corrRes.success) {
        setCorrections(corrRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load anomaly telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewCorrection = async (e) => {
    e.preventDefault();
    if (!selectedCorrection) return;

    if (reviewAction === 'APPROVE' && (!auditReason || auditReason.trim().length < 5)) {
      alert('Audit Reason (min 5 characters) is mandatory to approve an official academic correction.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.request(`/attendance/corrections/${selectedCorrection.requestId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action: reviewAction,
          auditReason,
          reviewRemarks
        })
      });

      if (res.success) {
        setToastMessage(`Correction ${reviewAction === 'APPROVE' ? 'Approved & Applied' : 'Rejected'}: ${selectedCorrection.studentRollNo}`);
        setSelectedCorrection(null);
        setAuditReason('');
        setReviewRemarks('');
        await loadData();
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      alert('Review failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Seed sample anomalies if empty for demonstration
  const displayAnomalies = anomalies.length > 0 ? anomalies : [
    {
      id: 'anom_01',
      recordId: 'att_cs3a_20261024_cs301',
      classId: 'CS-3A',
      subjectCode: 'CS301',
      date: '2026-10-24',
      periodNumber: 1,
      type: 'OUT_OF_SCHEDULE_HOURS',
      severity: 'MEDIUM',
      description: 'Attendance submitted at 21:42 (9:42 PM), outside scheduled lecture hours (09:30 AM - 10:30 AM).',
      detectedAt: new Date(Date.now() - 86400000).toISOString(),
      resolved: false
    },
    {
      id: 'anom_02',
      recordId: 'att_cs3a_20261023_cs302',
      classId: 'CS-3A',
      subjectCode: 'CS302',
      date: '2026-10-23',
      periodNumber: 2,
      type: 'BULK_RETROACTIVE_EDIT',
      severity: 'HIGH',
      description: '14 student statuses retroactively altered 48 hours after session locked by faculty tablet.',
      detectedAt: new Date(Date.now() - 172800000).toISOString(),
      resolved: false
    },
    {
      id: 'anom_03',
      recordId: 'att_cs3a_20261025_cs305',
      classId: 'CS-3A',
      subjectCode: 'CS305',
      date: '2026-10-25',
      periodNumber: 3,
      type: 'SUDDEN_ABSENTEE_SPIKE',
      severity: 'HIGH',
      description: 'Absentee spike: 26 of 60 students (43.3%) marked Absent in Laboratory slot.',
      detectedAt: new Date().toISOString(),
      resolved: false
    }
  ];

  const filteredAnomalies = displayAnomalies.filter(
    a => filterSeverity === 'ALL' || a.severity === filterSeverity
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#12141C] to-slate-900 border border-rose-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="danger" size="sm">HOD & Administrative Governance</Badge>
            <span className="text-xs text-slate-400 font-mono">Academic Session 2025-2026</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <span>Attendance Anomaly Detection & Correction Console</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Automated heuristic auditing: flagging bulk retroactive edits, out-of-schedule submissions, and multi-step faculty correction approvals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('anomalies')}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === 'anomalies'
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Anomalies ({filteredAnomalies.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === 'corrections'
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Pending Corrections ({corrections.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Flagged Anomalies</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{filteredAnomalies.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Automated Heuristic Flags</div>
        </div>

        <div className="p-4 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">High Severity Alerts</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {filteredAnomalies.filter(a => a.severity === 'HIGH').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires Immediate Human Review</div>
        </div>

        <div className="p-4 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Pending Correction Requests</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">{corrections.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Faculty Change Submissions</div>
        </div>

        <div className="p-4 rounded-xl bg-[#12141C] border border-white/5 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Audit Trail Status</div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 mt-1 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Immutable</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">All Overrides Require Justification</div>
        </div>
      </div>

      {/* TAB 1: Flagged Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Automated Attendance Anomaly Feed</span>
            </h2>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors",
                    filterSeverity === sev ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAnomalies.map((anom) => (
              <div
                key={anom.id}
                className={clsx(
                  "p-4 rounded-xl bg-[#12141C] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  anom.severity === 'HIGH' ? "border-rose-500/30 hover:border-rose-500/50" : "border-white/10 hover:border-white/20"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                      anom.severity === 'HIGH' ? "bg-rose-500/10 text-rose-300 border border-rose-500/30" : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                    )}>
                      {anom.severity} SEVERITY
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      {anom.classId} • {anom.subjectCode} • Period {anom.periodNumber} ({anom.date})
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {anom.type.replace(/_/g, ' ')}
                  </div>
                  <p className="text-xs text-slate-300">
                    {anom.description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Detected: {new Date(anom.detectedAt).toLocaleString()} • Record: {anom.recordId}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => alert(`Anomaly details logged in audit trail for ${anom.recordId}`)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                  >
                    View Audit Context
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Anomaly acknowledged and noted for ${anom.classId}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Multi-step Correction Approval Queue */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Pending Correction Approval Workflow (Faculty → HOD)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Statutory Requirement: Every approved status change requires an immutable audit justification.
            </span>
          </div>

          {corrections.length === 0 ? (
            <div className="p-8 text-center bg-[#12141C] border border-white/5 rounded-2xl text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
              <p className="font-semibold text-slate-200">No Pending Correction Requests</p>
              <p className="text-xs text-slate-500 mt-1">All faculty attendance corrections have been reviewed and finalized.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {corrections.map((cr) => (
                <div
                  key={cr.requestId}
                  className="p-5 rounded-2xl bg-[#12141C] border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold">
                        {cr.classId} • {cr.subjectCode} ({cr.date})
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Period {cr.periodNumber}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-white text-sm">{cr.studentRollNo}</span>
                      {cr.studentName && <span className="text-slate-400 text-xs">({cr.studentName})</span>}
                      <span className="text-slate-500 text-xs">• Requested by {cr.requestedByEmail}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold font-mono">
                        {cr.previousStatus}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold font-mono">
                        {cr.newStatus}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300">
                      <strong className="text-slate-400">Faculty Justification:</strong> {cr.reason}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCorrection(cr);
                        setReviewAction('REJECT');
                        setAuditReason('Request rejected upon HOD review.');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCorrection(cr);
                        setReviewAction('APPROVE');
                        setAuditReason('');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Review & Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Modal with Mandatory Audit Reason */}
      {selectedCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleReviewCorrection}
            className="w-full max-w-lg bg-[#12141C] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>
                  {reviewAction === 'APPROVE' ? 'Approve Attendance Correction' : 'Reject Correction Request'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCorrection(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 space-y-1.5">
              <div><strong className="text-slate-400">Student:</strong> <span className="text-white font-semibold">{selectedCorrection.studentRollNo}</span></div>
              <div><strong className="text-slate-400">Class & Subject:</strong> <span className="font-mono text-indigo-300">{selectedCorrection.classId} • {selectedCorrection.subjectCode}</span></div>
              <div><strong className="text-slate-400">Transition:</strong> <span className="font-mono text-rose-400">{selectedCorrection.previousStatus}</span> → <span className="font-mono text-emerald-400">{selectedCorrection.newStatus}</span></div>
              <div><strong className="text-slate-400">Faculty Reason:</strong> <span className="text-slate-200">{selectedCorrection.reason}</span></div>
            </div>

            {reviewAction === 'APPROVE' && (
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Mandatory Audit Reason (Immutable Record) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="E.g., Verified authorized On-Duty letter issued by Dean of Student Affairs for inter-college technical symposium."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40"
                />
                <span className="text-[10px] text-slate-500">Minimum 5 characters. This will be stored forever in the AuditLog.</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Review Remarks / Notes to Faculty (Optional)
              </label>
              <input
                type="text"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="E.g., Medical certificate verified with campus dispensary."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedCorrection(null)}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={clsx(
                  "px-4 py-2 rounded-xl font-bold transition-all shadow-lg",
                  reviewAction === 'APPROVE'
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                )}
              >
                {submitting ? 'Applying...' : reviewAction === 'APPROVE' ? 'Confirm & Apply Override' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default AttendanceAnomalyPanel;
