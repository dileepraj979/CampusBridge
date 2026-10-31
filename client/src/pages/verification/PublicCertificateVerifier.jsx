import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  QrCode,
  Building,
  ArrowLeft,
  Printer,
  Sparkles,
  Lock
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import clsx from 'clsx';

const API_BASE = 'http://localhost:5000/api';

export default function PublicCertificateVerifier({ hash, onBack }) {
  const [verificationHash, setVerificationHash] = useState(hash || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (verificationHash) {
      verifyHash(verificationHash);
    }
  }, [verificationHash]);

  const verifyHash = async (targetHash) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/verify/${targetHash}`);
      const data = await res.json();
      if (data.success && data.isAuthentic) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Certificate verification failed. Hash not found in institutional records.');
        setResult(null);
      }
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (verificationHash.trim()) {
      verifyHash(verificationHash.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col justify-between p-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">Apex Institute of Technology</span>
            </div>
          </div>

          <Badge variant="success">Public Authenticity Gateway</Badge>
        </div>

        {/* Verification Search Bar */}
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={verificationHash}
            onChange={(e) => setVerificationHash(e.target.value)}
            placeholder="Enter or paste 64-character SHA-256 certificate verification hash..."
            className="flex-1 bg-[#12141C] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify Credential
          </button>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="p-12 text-center text-xs text-slate-400">
            Consulting immutable institutional cryptographic ledger...
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div className="bg-[#12141C]/90 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
            {/* Holographic Top Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-500" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Autonomous Institutional Registry • Verified Authentic
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{result.title}</h2>
                  <div className="text-xs text-slate-400">{result.issuerInstitution}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Officially Verified
                </span>
              </div>
            </div>

            {/* Credential Data (Minimal Privacy-Safe Exposure) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#090A0F] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Masked Recipient:</span>
                <div className="font-bold text-white font-mono text-sm">{result.recipientMasked}</div>
                <div className="text-[11px] text-slate-400">{result.department}</div>
              </div>

              <div className="p-4 rounded-xl bg-[#090A0F] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Classification & Standing:</span>
                <div className="font-bold text-amber-300 font-mono text-sm">{result.honorsClassification}</div>
                <div className="text-[11px] text-slate-400">Date of Award: {result.issuedDate}</div>
              </div>
            </div>

            {/* Verified Skills */}
            {result.skillsVerified?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Verified Academic & Technical Competencies:
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.skillsVerified.map((sk, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-200 border border-purple-500/30 font-mono">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cryptographic Proof Card */}
            <div className="p-4 rounded-2xl bg-[#090A0F]/90 border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Cryptographic Authenticity Seal
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">HMAC-SHA256 • Tamper Proof</span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 break-all bg-black/40 p-2.5 rounded-lg border border-white/5">
                {result.cryptographicSeal?.verificationHash}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono pt-1">
                <span>Certificate Reference: {result.certificateId}</span>
                <span>Signed by: {result.verifiedByAuthority}</span>
              </div>
            </div>

            {/* Print & Export Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Verification Certificate
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs space-y-2 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-rose-200">Verification Failed</div>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-500 pt-8 border-t border-white/[0.06] font-mono">
        Apex Institute of Technology • Verifiable Academic Credential Ledger • Zero-Knowledge Minimal Data Exposure
      </div>
    </div>
  );
}
