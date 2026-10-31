import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LifeBuoy,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Plus,
  Send,
  Eye,
  Lock,
  FileText,
  UserCheck,
  Building,
  RefreshCw,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import clsx from 'clsx';

const API_BASE = 'http://localhost:5000/api';

export default function ServiceDesk() {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'grievances'
  const [requests, setRequests] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Form states
  const [newRequest, setNewRequest] = useState({
    requestType: 'BONAFIDE_CERTIFICATE',
    title: '',
    description: '',
    priority: 'MEDIUM',
    slaHours: 48
  });

  const [newGrievance, setNewGrievance] = useState({
    isAnonymous: false,
    category: 'ACADEMIC',
    severity: 'STANDARD',
    subject: '',
    details: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchGrievances();
  }, [statusFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      let url = `${API_BASE}/services/requests`;
      if (statusFilter !== 'ALL') url += `?overallStatus=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrievances = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/grievances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGrievances(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Service ticket ${data.data.ticketNumber} created successfully!`);
        setIsRequestModalOpen(false);
        setNewRequest({
          requestType: 'BONAFIDE_CERTIFICATE',
          title: '',
          description: '',
          priority: 'MEDIUM',
          slaHours: 48
        });
        fetchRequests();
      } else {
        showToast(data.error?.message || 'Failed to create request', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveStage = async (ticketNumber) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/requests/${ticketNumber}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: approvalRemarks })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelectedRequest(null);
        setApprovalRemarks('');
        fetchRequests();
      } else {
        showToast(data.error?.message || 'Approval failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectStage = async (ticketNumber) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/requests/${ticketNumber}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: approvalRemarks || 'Rejected by approver' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelectedRequest(null);
        setApprovalRemarks('');
        fetchRequests();
      } else {
        showToast(data.error?.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleFileGrievance = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/services/grievances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newGrievance)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Confidential complaint registered! Tracking ID: ${data.data.trackingNumber}`);
        setIsGrievanceModalOpen(false);
        setNewGrievance({
          isAnonymous: false,
          category: 'ACADEMIC',
          severity: 'STANDARD',
          subject: '',
          details: ''
        });
        fetchGrievances();
      } else {
        showToast(data.error?.message || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4',
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
          )}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Unified Service Desk & Grievance Portal
                <Badge variant="warning">SLA Monitored</Badge>
              </h1>
              <p className="text-xs text-slate-400">
                Multi-stage digital workflows, SLA breach prevention & anti-retaliation grievance tracking
              </p>
            </div>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#12141C] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('requests')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              Service Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('grievances')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'grievances' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Confidential Grievances ({grievances.length})
            </button>
          </div>

          {activeTab === 'requests' ? (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Service Ticket
            </button>
          ) : (
            <button
              onClick={() => setIsGrievanceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              File Confidential Grievance
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SERVICE REQUESTS & APPROVAL WORKFLOW */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-[#12141C]/60 backdrop-blur-xl border border-white/[0.08] p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium px-2">Filter Status:</span>
              {['ALL', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    statusFilter === st
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Standard Institutional SLA: <strong>24h - 48h</strong> per approval stage</span>
            </div>
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => (
              <div
                key={req._id || req.ticketNumber}
                className={clsx(
                  'bg-[#12141C]/80 backdrop-blur-xl border rounded-2xl p-5 transition-all space-y-4 hover:border-indigo-500/40',
                  req.isSlaBreached ? 'border-rose-500/40 bg-rose-950/10' : 'border-white/[0.08]'
                )}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300 font-semibold">
                      {req.ticketNumber}
                    </span>
                    <Badge
                      variant={
                        req.overallStatus === 'APPROVED' ? 'success' :
                        req.overallStatus === 'REJECTED' ? 'danger' :
                        req.overallStatus === 'IN_REVIEW' ? 'info' : 'warning'
                      }
                    >
                      {req.overallStatus.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {req.requestType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      Priority: <strong className="text-slate-200">{req.priority}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className={clsx('w-3.5 h-3.5', req.isSlaBreached ? 'text-rose-400 animate-pulse' : 'text-slate-400')} />
                      <span className={req.isSlaBreached ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {req.isSlaBreached ? 'SLA BREACHED' : `Deadline: ${new Date(req.slaDeadline).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-semibold text-white text-sm">{req.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{req.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 font-mono">
                    <span>Requester: {req.requesterName} ({req.requesterRole})</span>
                    <span>Class: {req.classId || 'CS-3A'}</span>
                    <span>Department: {req.departmentId || 'CSE'}</span>
                  </div>
                </div>

                {/* Multi-Stage Approval Workflow Visualizer */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Multi-Stage Approval Pipeline
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {req.stages?.map((stage, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          'p-3 rounded-xl border flex flex-col justify-between transition-all',
                          stage.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' :
                          stage.status === 'REJECTED' ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' :
                          idx === req.currentStageIndex && req.overallStatus !== 'APPROVED' ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200 shadow-md shadow-indigo-950/50' :
                          'bg-white/[0.02] border-white/[0.06] text-slate-400'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                            Stage {stage.stageNumber} • {stage.approverRole}
                          </span>
                          {stage.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {stage.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          {stage.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="font-medium text-xs text-white mt-1">
                          {stage.stageName}
                        </div>
                        {stage.actionTakenByName && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Action by: {stage.actionTakenByName}
                            {stage.remarks && <div className="italic text-slate-300">"{stage.remarks}"</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons for Authorized Approvers */}
                {req.overallStatus !== 'APPROVED' && req.overallStatus !== 'REJECTED' && (
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Take Approval Action
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRIVACY-ISOLATED GRIEVANCE PORTAL */}
      {activeTab === 'grievances' && (
        <div className="space-y-6">
          {/* Confidentiality Alert Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#12141C] to-indigo-950/40 border border-rose-500/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Confidentiality & Anti-Retaliation Protection Protocol
              </h4>
              <p className="text-xs text-slate-300">
                Grievances filed here are encrypted and accessible exclusively by designated Ombudsman & Internal Complaints Committee (ICC) officials. Every single record view is logged into an immutable security audit trail. Anonymous submissions are stripped of IP, device fingerprints, and identity hashes.
              </p>
            </div>
          </div>

          {/* Grievances List */}
          <div className="grid grid-cols-1 gap-4">
            {grievances.map((g) => (
              <div
                key={g._id || g.trackingNumber}
                className="bg-[#12141C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 space-y-3 hover:border-rose-500/40 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold">
                      {g.trackingNumber}
                    </span>
                    <Badge variant={g.status === 'RESOLVED' ? 'success' : 'warning'}>
                      {g.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {g.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    Complainant: <strong className="text-slate-200">{g.complainantMaskedId}</strong> ({g.isAnonymous ? 'ANONYMOUS' : 'CONFIDENTIAL ID'})
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-sm">{g.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1">{g.details}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/[0.06] font-mono">
                  <span>Assigned Committee: <strong>{g.assignedCommittee}</strong></span>
                  <span>7-Day Escalation Deadline: {new Date(g.escalationDeadline).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROVAL ACTION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/[0.1] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Approve Service Request</span>
              <span className="text-xs font-mono text-indigo-400">{selectedRequest.ticketNumber}</span>
            </h3>

            <p className="text-xs text-slate-300">
              You are endorsing stage: <strong>{selectedRequest.stages[selectedRequest.currentStageIndex]?.stageName}</strong> for <strong>{selectedRequest.requesterName}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Remarks & Authorization Endorsement:</label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="e.g. Verified supporting documents and student academic clearance..."
                rows={3}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectStage(selectedRequest.ticketNumber)}
                className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold border border-rose-500/30 transition-all"
              >
                Reject Stage
              </button>
              <button
                onClick={() => handleApproveStage(selectedRequest.ticketNumber)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SERVICE REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateRequest} className="bg-[#12141C] border border-white/[0.1] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Service Request</h3>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Request Type</label>
              <select
                value={newRequest.requestType}
                onChange={(e) => setNewRequest({ ...newRequest, requestType: e.target.value })}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate Request</option>
                <option value="STUDENT_LEAVE">Student Leave / On-Duty Request</option>
                <option value="ATTENDANCE_CORRECTION">Attendance Correction Appeal</option>
                <option value="TRANSCRIPT_ISSUANCE">Official Transcript Issuance</option>
                <option value="HOSTEL_ROOM_CHANGE">Hostel Room Allocation / Change</option>
                <option value="TRANSPORT_ROUTE_CHANGE">Transport Route Change</option>
                <option value="FEE_CONCESSION">Fee Concession / Scholarship Review</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Request Subject / Purpose</label>
              <input
                type="text"
                required
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                placeholder="e.g. Bonafide Certificate for National Scholarship Portal..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Detailed Justification</label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Provide all context, dates, roll number and necessary details..."
                rows={3}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW GRIEVANCE MODAL */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleFileGrievance} className="bg-[#12141C] border border-white/[0.1] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              File Confidential Grievance
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#090A0F] border border-white/10">
              <span className="text-xs text-slate-300">File as Anonymous Complainant</span>
              <input
                type="checkbox"
                checked={newGrievance.isAnonymous}
                onChange={(e) => setNewGrievance({ ...newGrievance, isAnonymous: e.target.checked })}
                className="w-4 h-4 accent-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Category</label>
              <select
                value={newGrievance.category}
                onChange={(e) => setNewGrievance({ ...newGrievance, category: e.target.value })}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="ACADEMIC">Academic Discrepancy & Evaluation</option>
                <option value="INFRASTRUCTURE">Campus Infrastructure & Safety</option>
                <option value="HARASSMENT_POSH">Harassment / POSH Committee</option>
                <option value="HOSTEL_MESS">Hostel & Food Safety</option>
                <option value="DISCRIMINATION">Discrimination / Equal Opportunity</option>
                <option value="FINANCE">Financial / Fee Discrepancy</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Subject</label>
              <input
                type="text"
                required
                value={newGrievance.subject}
                onChange={(e) => setNewGrievance({ ...newGrievance, subject: e.target.value })}
                placeholder="Summary of incident or complaint..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Incident Details & Evidence</label>
              <textarea
                required
                value={newGrievance.details}
                onChange={(e) => setNewGrievance({ ...newGrievance, details: e.target.value })}
                placeholder="Explain the incident with dates, locations and circumstances..."
                rows={4}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsGrievanceModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
              >
                Register Confidential Complaint
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
