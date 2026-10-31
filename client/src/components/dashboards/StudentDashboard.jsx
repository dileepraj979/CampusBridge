import React, { useState, useEffect } from 'react';
import BentoCard from '../common/BentoCard.jsx';
import Badge from '../common/Badge.jsx';
import { BentoSkeleton } from '../common/Skeleton.jsx';
import api from '../../services/api.js';
import {
  CalendarCheck,
  GraduationCap,
  Calculator,
  HardDrive,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  DownloadCloud,
  QrCode,
  Sparkles,
  Send,
  Check,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

export function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedMisses, setSimulatedMisses] = useState(0);
  const [forecast, setForecast] = useState(null);

  // Self QR Check-in State
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrVerifying, setQrVerifying] = useState(false);
  const [qrVerifiedSession, setQrVerifiedSession] = useState(null);
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [dashRes, foreRes] = await Promise.all([
          api.getDashboard('STUDENT'),
          api.request('/attendance/forecast/22CS082').catch(() => null)
        ]);

        if (dashRes.success && dashRes.data) {
          setData(dashRes.data);
        }
        if (foreRes && foreRes.success) {
          setForecast(foreRes.data);
        }
      } catch (err) {
        console.error('Failed to load Student dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Handle QR Check-in submission
  const handleVerifyQr = async (e) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) return;

    setQrVerifying(true);
    setQrError(null);

    try {
      // Find today's session or use active period 1 session
      const sessionsRes = await api.request('/attendance/sessions?classId=CS-3A');
      const targetSession = sessionsRes.data?.[0];

      if (!targetSession) {
        throw new Error('No active class session found for check-in right now');
      }

      const res = await api.request(`/attendance/sessions/${targetSession._id}/qr/verify`, {
        method: 'POST',
        body: JSON.stringify({
          token: qrTokenInput.trim(),
          studentRollNo: data?.rollNo || '22CS082'
        })
      });

      if (res.success) {
        setQrVerifiedSession({
          subjectCode: targetSession.subjectCode,
          periodNumber: targetSession.periodNumber,
          room: targetSession.room,
          message: res.message
        });
        setQrTokenInput('');
      }
    } catch (err) {
      setQrError(err.message || 'Invalid or expired QR token');
    } finally {
      setQrVerifying(false);
    }
  };

  if (loading || !data) {
    return <BentoSkeleton />;
  }

  // Exact Mathematical Attendance Forecasting Engine (Statutory Target: 75%)
  const TARGET = 0.75;
  const currentTotal = forecast?.totalClassesHeld || 48;
  const currentAttended = forecast?.totalClassesAttended || 43; // 89.6%
  const currentPercentage = ((currentAttended / currentTotal) * 100).toFixed(1);

  // If student misses simulatedMisses lectures
  const newTotal = currentTotal + simulatedMisses;
  const newAttended = currentAttended;
  const projectedPercentage = ((newAttended / newTotal) * 100).toFixed(1);
  const isProjectedSafe = parseFloat(projectedPercentage) >= 75.0;

  // Exact formulas:
  // If < 75%: Consecutive classes needed without missing = ceil((0.75 * Total - Attended) / (1 - 0.75)) = ceil(3T - 4A)
  // If >= 75%: Max classes can miss while staying >= 75% = floor((Attended - 0.75 * Total) / 0.75) = floor((4A - 3T) / 3)
  const exactCanMiss = Math.max(0, Math.floor((4 * currentAttended - 3 * currentTotal) / 3));
  const exactNeededTo75 = Math.max(0, Math.ceil(3 * currentTotal - 4 * currentAttended));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900/40 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">Undergraduate Scholar</Badge>
            <span className="text-xs text-slate-400 font-mono">Roll: {data.rollNo} • Sem {data.semester}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Hello, {data.studentName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Statutory 75% threshold forecaster, rotating QR session check-in, and offline study pack cacher.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current CGPA</div>
            <div className="text-lg font-bold text-indigo-400 font-mono">{data.cgpa} / 10.0</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{kpi.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
              {kpi.value}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Card 1: Dynamic Attendance Forecaster Card (Requirement 4) */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-7"
          title="Dynamic Attendance Forecaster & 75% Statutory Guard"
          subtitle="Real-time mathematical projection to guarantee exam hall-ticket eligibility"
          badge={<Badge variant="primary" size="xs">AICTE 75% Standard</Badge>}
        >
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 pt-3">
            
            {/* Aggregate Progress & Threshold Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#12141C] border border-white/5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Current Aggregate</span>
                <div className="text-lg font-bold text-white mt-0.5">{currentPercentage}%</div>
                <div className="text-[11px] text-slate-500 font-normal">{currentAttended} / {currentTotal} delivered</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Safe Miss Margin</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {exactCanMiss > 0 ? `+${exactCanMiss} Classes` : '0 Margin'}
                </div>
                <div className="text-[11px] text-slate-500 font-normal">Can safely miss while ≥ 75%</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Recovery Needed</span>
                <div className={clsx("text-lg font-bold mt-0.5", exactNeededTo75 > 0 ? "text-rose-400" : "text-slate-400")}>
                  {exactNeededTo75 > 0 ? `${exactNeededTo75} Classes` : 'None (Compliant)'}
                </div>
                <div className="text-[11px] text-slate-500 font-normal">Consecutive attendance to hit 75%</div>
              </div>
            </div>

            {/* Interactive Simulation Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Hypothetical Simulation: If I skip upcoming lectures:</span>
                <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  +{simulatedMisses} Skipped Classes
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={simulatedMisses}
                onChange={(e) => setSimulatedMisses(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>3</span>
                <span>{exactCanMiss} (Safe Threshold)</span>
                <span>9</span>
                <span>12</span>
              </div>
            </div>

            {/* Projection Feedback Banner */}
            <div className={clsx(
              "p-3.5 rounded-xl border flex items-center justify-between transition-all",
              isProjectedSafe
                ? "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-200"
                : "bg-rose-500/[0.08] border-rose-500/30 text-rose-200"
            )}>
              <div className="flex items-center gap-2.5 text-xs">
                {isProjectedSafe ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-white">
                    {isProjectedSafe
                      ? `Eligible! Projected Attendance: ${projectedPercentage}%`
                      : `Ineligible! Projected Attendance drops to ${projectedPercentage}%`}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {isProjectedSafe
                      ? `You remain above the statutory 75.0% threshold with ${Math.max(0, exactCanMiss - simulatedMisses)} safe absences left.`
                      : `Missing ${simulatedMisses} classes puts you at risk of exam debarment. Attend next lectures to recover.`}
                  </div>
                </div>
              </div>
              <span className="font-mono font-bold text-base tabular-nums">{projectedPercentage}%</span>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Self QR Attendance Check-In Widget (Requirement 3) */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-5"
          title="Live Lecture QR Check-in"
          subtitle="Scan or submit rotating 15-second lecture token projected on screen"
          badge={<Badge variant="purple" size="xs">Instant Verify</Badge>}
        >
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 pt-3">
            {qrVerifiedSession ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 text-center animate-in zoom-in-95">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-sm text-white">Attendance Officially Verified!</div>
                <div className="text-xs text-emerald-300 font-mono">
                  {qrVerifiedSession.subjectCode} • Period {qrVerifiedSession.periodNumber} ({qrVerifiedSession.room})
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Recorded in immutable session register with verification method: QR_SCAN.
                </p>
                <button
                  onClick={() => setQrVerifiedSession(null)}
                  className="mt-2 text-[11px] text-indigo-400 hover:underline font-mono"
                >
                  Scan another lecture
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyQr} className="space-y-3">
                <div className="p-3 rounded-xl bg-[#12141C] border border-white/5 text-xs space-y-1">
                  <div className="text-slate-400 font-medium">Currently Active Session:</div>
                  <div className="text-white font-semibold flex items-center justify-between">
                    <span>CS301: Design & Analysis of Algorithms</span>
                    <span className="font-mono text-purple-400 text-[11px]">Period 1 • LH-302</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    16-Character Rotating Token from Screen
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={qrTokenInput}
                      onChange={(e) => setQrTokenInput(e.target.value)}
                      placeholder="e.g. 8d39f4a17e0b5c2a"
                      className="flex-1 bg-[#12141C] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/40"
                    />
                    <button
                      type="submit"
                      disabled={qrVerifying}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{qrVerifying ? 'Verifying...' : 'Check In'}</span>
                    </button>
                  </div>
                </div>

                {qrError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{qrError}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tokens rotate every 15 seconds to prevent off-campus screenshot transmission. Only active enrolled cohort students are accepted.
                </p>
              </form>
            )}
          </div>
        </BentoCard>

        {/* Card 2: Offline Cached Study Packs */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-6"
          title="Cached Offline Study Packs"
          subtitle="Available for zero-connectivity reading stored in Dexie.js IndexedDB"
          badge={<Badge variant="emerald" size="xs">Dexie Cached</Badge>}
        >
          <div className="space-y-2.5 pt-2">
            {data.cachedStudyPacks.map((pack) => (
              <div
                key={pack.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <HardDrive className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">{pack.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {pack.size} • Synced {pack.lastSynced}
                    </div>
                  </div>
                </div>
                <Badge variant="emerald" size="xs">
                  Offline Ready
                </Badge>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Card 3: Course-by-Course Attendance Ledger */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-8"
          title="Semester 6 Course Attendance Breakdown"
          subtitle="Real-time attendance registers submitted by department professors"
        >
          <div className="space-y-2 pt-2">
            {data.subjectAttendance.map((sub) => (
              <div
                key={sub.code}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-indigo-300">
                      {sub.code}
                    </span>
                    <span className="font-semibold text-slate-200">{sub.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    {sub.attended} Attended / {sub.total} Delivered
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold text-sm ${sub.status === 'safe' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {sub.percentage}%
                  </span>
                  <Badge variant={sub.status === 'safe' ? 'emerald' : 'amber'} size="xs">
                    {sub.status === 'safe' ? 'Compliant' : 'Near Margin'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Card 4: Upcoming Exam Schedule */}
        <BentoCard
          colSpan="col-span-12 lg:col-span-4"
          title="Midterm Examination Schedule"
          subtitle="Secrecy hall allocations & verified timings"
          badge={<Badge variant="purple" size="xs">Official</Badge>}
        >
          <div className="space-y-3 pt-2">
            {data.upcomingExams.map((exam, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-indigo-400 font-semibold">
                  <span>{exam.code}</span>
                  <span className="text-slate-400">{exam.date}</span>
                </div>
                <div className="font-semibold text-slate-200">{exam.name}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{exam.time} • {exam.hall}</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

      </div>
    </div>
  );
}

export default StudentDashboard;
