import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Briefcase,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Send,
  Building,
  GraduationCap,
  Sparkles,
  Search,
  Plus,
  FileCheck
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import clsx from 'clsx';

const API_BASE = 'http://localhost:5000/api';

export default function PlacementSkillPassport({ onNavigateToVerify }) {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('placements'); // 'placements' | 'skill_passport'
  const [drives, setDrives] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Issue Certificate Modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [newCert, setNewCert] = useState({
    studentRollNo: '22CS089',
    studentName: 'Aarav Sharma',
    certificateType: 'AUTONOMOUS_COURSE_MASTERY',
    title: 'Advanced Distributed Systems & Consensus Algorithms',
    honorsClassification: 'Grade O (10.0 Grade Points) with Distinction',
    skillsAcquired: 'Raft Consensus, Vector Clocks, Byzantine Fault Tolerance, Go'
  });

  useEffect(() => {
    fetchDrives();
    fetchCertificates();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/placement/drives`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDrives(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/placement/certificates?rollNo=22CS089`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCertificates(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyDrive = async (driveCode) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/placement/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ driveCode, rollNo: '22CS089' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchDrives();
      } else {
        showToast(data.error?.message || 'Application rejected by eligibility guard', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const skills = newCert.skillsAcquired.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/placement/certificates/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newCert,
          skillsAcquired: skills
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Cryptographic certificate issued! Hash: ${data.data.cryptographicHash.slice(0, 12)}...`);
        setIsIssueModalOpen(false);
        fetchCertificates();
      } else {
        showToast(data.error?.message || 'Issuance failed', 'error');
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Placement Portal & Verifiable Skill Passport
                <Badge variant="success">Cryptographic Seals</Badge>
              </h1>
              <p className="text-xs text-slate-400">
                Automated CGPA/backlog eligibility filtering, company drives, and verifiable digital certificates with SHA-256 public verification
              </p>
            </div>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#12141C] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('placements')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'placements' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Placement Drives ({drives.length})
            </button>
            <button
              onClick={() => setActiveTab('skill_passport')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'skill_passport' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              <Award className="w-3.5 h-3.5" />
              Skill Passport & Credentials ({certificates.length})
            </button>
          </div>

          {activeTab === 'skill_passport' && (
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Verifiable Credential
            </button>
          )}
        </div>
      </div>

      {/* 1. PLACEMENT DRIVES TAB */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          {/* Eligibility Banner for Student */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#12141C] to-emerald-950/30 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Student Academic Standing Profile
                </span>
                <div className="text-xs text-slate-300 font-mono mt-0.5">
                  Roll: <strong>22CS089</strong> • Verified CGPA: <strong className="text-emerald-400">8.85 / 10.0</strong> • Active Backlogs: <strong className="text-emerald-400">0</strong>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Eligible for <strong className="text-white">Tier-1 Dream Offers</strong> (&gt; 15 LPA)
            </div>
          </div>

          {/* Drives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drives.map((d) => (
              <div
                key={d._id || d.driveCode}
                className="bg-[#12141C]/80 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl"
              >
                <div className="space-y-4">
                  {/* Top Row: Company & Package */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300 font-bold">
                        {d.driveCode}
                      </span>
                      <h3 className="font-bold text-white text-base mt-2">{d.companyName}</h3>
                      <div className="text-xs text-indigo-300 font-medium">{d.roleTitle}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xl font-extrabold text-emerald-400">
                        {d.packageLpa} LPA
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">CTC Package</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{d.description}</p>

                  {/* Eligibility Check Pill */}
                  <div className="p-3 rounded-xl bg-[#090A0F] border border-white/[0.06] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Required Min CGPA:</span>
                      <span className="font-mono font-bold text-white">{d.eligibilityCriteria.minCgpa}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Allowed Backlogs:</span>
                      <span className="font-mono font-bold text-white">{d.eligibilityCriteria.maxActiveBacklogs}</span>
                    </div>
                    <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-slate-400">Your Eligibility:</span>
                      {d.studentEligibility?.isEligible ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Ineligible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interview Pipeline Rounds */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Hiring Stages:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {d.rounds?.map((r, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Drive: {new Date(d.driveDate).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => handleApplyDrive(d.driveCode)}
                    disabled={!d.studentEligibility?.isEligible}
                    className={clsx(
                      'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all',
                      d.studentEligibility?.isEligible
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SKILL PASSPORT & VERIFIABLE CERTIFICATES TAB */}
      {activeTab === 'skill_passport' && (
        <div className="space-y-6">
          {/* Explanation Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#12141C] to-indigo-950/30 border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Verifiable Credential Engine & Cryptographic Skill Passport
                </h4>
                <p className="text-xs text-slate-300">
                  Institutional achievements are sealed with immutable SHA-256 cryptographic hashes. Anyone can independently verify authenticity at the public verification portal without requiring an account.
                </p>
              </div>
            </div>
          </div>

          {/* Certificates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert._id || cert.certificateId}
                className={clsx(
                  'bg-[#12141C]/90 backdrop-blur-xl border rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl relative overflow-hidden',
                  cert.isVerifiedByCollege ? 'border-amber-500/40 shadow-amber-950/20' : 'border-white/[0.08]'
                )}
              >
                {/* Holographic Border Top Accent */}
                {cert.isVerifiedByCollege && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {cert.certificateId}
                      </span>
                      <h3 className="font-bold text-white text-base mt-2">{cert.title}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">{cert.issuerInstitution}</div>
                    </div>

                    {cert.isVerifiedByCollege ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        College-Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                        Self-Claim (Unverified)
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#090A0F] border border-white/[0.06] text-xs space-y-1 font-mono">
                    <div className="text-slate-400">
                      Recipient: <strong className="text-white">{cert.studentName} ({cert.studentRollNo})</strong>
                    </div>
                    <div className="text-slate-400">
                      Classification: <strong className="text-amber-300">{cert.honorsClassification}</strong>
                    </div>
                    {cert.verifiedBy && (
                      <div className="text-[11px] text-slate-500">
                        Signed Authority: {cert.verifiedBy}
                      </div>
                    )}
                  </div>

                  {/* Skills Pills */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Verified Competencies:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cert.skillsAcquired?.map((sk, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Hash & Verification Button */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 text-[10px]">SHA-256 Hash:</span>
                    <span className="text-slate-300 text-[10px] truncate max-w-[240px]">
                      {cert.cryptographicHash}
                    </span>
                  </div>

                  {cert.publicVerificationUrl && (
                    <button
                      onClick={() => onNavigateToVerify && onNavigateToVerify(cert.cryptographicHash)}
                      className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold border border-purple-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify Authenticity on Public Portal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUE CERTIFICATE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleIssueCertificate} className="bg-[#12141C] border border-white/[0.1] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Issue Verifiable Digital Credential
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Student Roll Number</label>
              <input
                type="text"
                required
                value={newCert.studentRollNo}
                onChange={(e) => setNewCert({ ...newCert, studentRollNo: e.target.value })}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Certificate Type</label>
              <select
                value={newCert.certificateType}
                onChange={(e) => setNewCert({ ...newCert, certificateType: e.target.value })}
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="AUTONOMOUS_COURSE_MASTERY">Autonomous Course Mastery</option>
                <option value="SEMESTER_HONORS">Dean’s Honor Roll / Semester Honors</option>
                <option value="HACKATHON_WINNER">National / Institutional Hackathon Winner</option>
                <option value="DEGREE">Degree Certificate (Provisional)</option>
                <option value="SPORTS_EXCELLENCE">Inter-University Sports Excellence</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Certificate Title</label>
              <input
                type="text"
                required
                value={newCert.title}
                onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                placeholder="e.g. Dean’s Honor Roll — Academic Excellence..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Skills Acquired (Comma Separated)</label>
              <input
                type="text"
                value={newCert.skillsAcquired}
                onChange={(e) => setNewCert({ ...newCert, skillsAcquired: e.target.value })}
                placeholder="e.g. Distributed Systems, Zero-Knowledge Proofs, Go"
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Cryptographically Sign & Issue
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
