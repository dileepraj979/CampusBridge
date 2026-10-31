import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { db, createOfflineContract } from '../../db/dexieDb.js';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  BookOpen,
  DownloadCloud,
  HardDrive,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  Share2,
  Trash2,
  PlayCircle,
  Code,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

export function SubjectLearningHub() {
  const [selectedSubject, setSelectedSubject] = useState('CS301');
  const [studyPack, setStudyPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [isCachedLocally, setIsCachedLocally] = useState(false);
  const [cacheFootprintMB, setCacheFootprintMB] = useState(27.0);
  const [toastMessage, setToastMessage] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [activeUnitTab, setActiveUnitTab] = useState(1);

  const loadSubjectData = async (code = selectedSubject) => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const res = await api.request(`/lms/studypacks/${code}`);
        if (res.success && res.data) {
          setStudyPack(res.data);
          setLoading(false);
          checkLocalCache(code);
          return;
        }
      }
    } catch (err) {
      console.warn('Online LMS load failed, checking local Dexie cache:', err.message);
    }

    // Offline Dexie check
    try {
      const cachedBundle = await db.studyPacks.get(`pack_${code.toLowerCase()}`);
      if (cachedBundle) {
        setStudyPack(cachedBundle);
        setIsCachedLocally(true);
      }
    } catch (err) {
      console.error('Dexie read failed', err);
    } finally {
      setLoading(false);
    }
  };

  const checkLocalCache = async (code) => {
    try {
      const cached = await db.studyPacks.get(`pack_${code.toLowerCase()}`);
      setIsCachedLocally(!!cached);
    } catch (e) {
      setIsCachedLocally(false);
    }
  };

  useEffect(() => {
    loadSubjectData(selectedSubject);
  }, [selectedSubject]);

  // 1-Click Offline Study Pack Downloader
  const handleDownloadOfflineBundle = async () => {
    setDownloadingBundle(true);
    try {
      const res = await api.request(`/lms/studypacks/${selectedSubject}/bundle`);
      if (res.success && res.data) {
        const bundle = res.data;

        // Store into Dexie studyPacks store & downloadedMaterials
        await db.studyPacks.put(
          createOfflineContract({
            recordId: `pack_${selectedSubject.toLowerCase()}`,
            subjectCode: bundle.subjectCode,
            title: bundle.subjectName,
            version: bundle.version,
            data: bundle,
            cachedAt: new Date().toISOString(),
            expiresAt: bundle.expiresAt,
            syncStatus: 'synced'
          })
        );

        // Populate downloadedMaterials store
        const materialContracts = bundle.materials.map((m, i) =>
          createOfflineContract({
            recordId: `mat_${bundle.subjectCode.toLowerCase()}_${i}`,
            subjectCode: bundle.subjectCode,
            title: m.title,
            mimeType: 'application/pdf',
            fileSizeBytes: m.fileSizeBytes,
            syncStatus: 'synced'
          })
        );
        await db.downloadedMaterials.bulkPut(materialContracts);

        setIsCachedLocally(true);
        setCacheFootprintMB(Math.round((bundle.bundleSizeBytes / 1048576) * 10) / 10);
        showToast(`Offline Pack Downloaded: ${bundle.subjectCode} is now 100% available offline for 14 days.`);
      }
    } catch (err) {
      alert('Offline bundle download failed: ' + err.message);
    } finally {
      setDownloadingBundle(false);
    }
  };

  // Clear Local Cache
  const handleClearCache = async () => {
    try {
      await db.studyPacks.delete(`pack_${selectedSubject.toLowerCase()}`);
      setIsCachedLocally(false);
      showToast('Local offline study pack purged from IndexedDB storage.');
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading && !studyPack) {
    return <BentoSkeleton />;
  }

  const materialsForUnit = studyPack?.materials?.filter(m => m.unitNumber === activeUnitTab) || [];
  const practiceForUnit = studyPack?.practiceQuestions?.filter(p => p.unitNumber === activeUnitTab) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141C] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & 1-Click Bundler Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#12141C] to-indigo-950/40 border border-blue-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">
              {studyPack?.subjectCode} • Semester {studyPack?.semester} (Autonomous Core)
            </span>
            <Badge variant="emerald" size="sm">
              Syllabus Coverage: 82%
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{studyPack?.subjectName} Learning Hub</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Complete unit-wise course pack: verified slide decks, interactive code benchmarks, practice quizzes, and offline bundles.
          </p>
        </div>

        {/* 1-Click Study Pack Bundler Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Switcher */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 font-mono"
          >
            <option value="CS301" className="bg-[#12141C]">CS301: Algorithms</option>
            <option value="CS302" className="bg-[#12141C]">CS302: Operating Systems</option>
            <option value="CS305" className="bg-[#12141C]">CS305: DBMS Lab</option>
          </select>

          {isCachedLocally ? (
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cached Offline ({cacheFootprintMB} MB)</span>
              </div>
              <button
                onClick={handleClearCache}
                title="Clear local offline storage"
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDownloadOfflineBundle}
              disabled={downloadingBundle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <DownloadCloud className={clsx("w-4 h-4", downloadingBundle && "animate-bounce")} />
              <span>{downloadingBundle ? 'Bundling Offline Pack...' : '1-Click Offline Study Pack'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Storage Footprint & Offline Expiration Telemetry Bar */}
      <div className="p-3.5 rounded-xl bg-[#12141C] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>IndexedDB Quota: <strong className="text-white">{isCachedLocally ? `${cacheFootprintMB} MB` : '0 MB'}</strong> / 500 MB</span>
          </div>
          <div className="text-slate-500">|</div>
          <div className="text-slate-400">
            Validity: <span className="text-emerald-400">14 Days Offline Access</span>
          </div>
        </div>
        <div className="text-slate-500 text-[11px]">
          Bundles: Syllabus + Unit Slides + Code + Offline Quizzes
        </div>
      </div>

      {/* Unit Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto text-xs font-semibold">
        {[1, 2, 3, 4, 5].map((u) => (
          <button
            key={u}
            onClick={() => setActiveUnitTab(u)}
            className={clsx(
              "px-4 py-2 rounded-xl transition-all whitespace-nowrap",
              activeUnitTab === u
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            Unit {u}: {u === 1 ? 'Divide & Conquer' : u === 2 ? 'Dynamic Programming' : u === 3 ? 'Greedy Algorithms' : u === 4 ? 'Graph Traversal' : 'NP-Completeness'}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Unit Learning Materials & Code Benchmarks */}
        <div className="lg:col-span-8 space-y-4">
          <BentoCard
            colSpan="col-span-12"
            title={`Unit ${activeUnitTab} Curated Course Materials`}
            subtitle="Verified academic PDFs, instructor slide decks, and code repositories"
          >
            <div className="space-y-3 pt-2">
              {materialsForUnit.length > 0 ? (
                materialsForUnit.map((mat) => (
                  <div
                    key={mat._id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {mat.type === 'PDF' ? <FileText className="w-4 h-4" /> :
                         mat.type === 'SLIDES' ? <PlayCircle className="w-4 h-4" /> :
                         <Code className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {mat.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {mat.type} • {Math.round((mat.fileSizeBytes / 1048576) * 10) / 10} MB • Verified Autonomous Syllabus
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast(`Opening ${mat.title}...`)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium transition-colors"
                    >
                      Read Material
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Materials being synchronized by department faculty for Unit {activeUnitTab}.
                </div>
              )}
            </div>
          </BentoCard>

          {/* Unit Practice Quizzes */}
          <BentoCard
            colSpan="col-span-12"
            title="Unit Practice Quizzes (Self-Evaluation)"
            subtitle="Offline-ready conceptual questions with instant solutions"
            badge={<Badge variant="purple" size="xs">CIE Preparation</Badge>}
          >
            <div className="space-y-3 pt-2">
              {practiceForUnit.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  <div className="font-semibold text-slate-200">
                    Q{idx + 1}: {q.question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    {q.options?.map((opt, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "p-2 rounded-lg border",
                          opt === q.answer ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold" : "bg-white/5 border-white/5 text-slate-400"
                        )}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <strong className="text-slate-300">Explanation:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        {/* Right 4 Cols: Moderated Q&A Forum */}
        <div className="lg:col-span-4 space-y-4">
          <BentoCard
            colSpan="col-span-12"
            title="Moderated Subject Q&A"
            subtitle="Ask professors and peer scholars conceptual doubts"
          >
            <div className="space-y-4 pt-2 text-xs">
              
              {/* Question Input */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Have a doubt about Floyd-Warshall or Tree DP? Ask here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 text-xs"
                />
                <button
                  onClick={() => {
                    if (!newQuestionText) return;
                    showToast('Question posted to moderated course forum.');
                    setNewQuestionText('');
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-600/20"
                >
                  Post Question
                </button>
              </div>

              {/* Forum Questions Thread */}
              <div className="space-y-3 pt-2">
                {studyPack?.qnaForum?.map((q) => (
                  <div key={q.questionId} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="font-semibold text-slate-200">
                      {q.question}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Asked by {q.askedBy} • {new Date(q.askedAt).toLocaleDateString()}
                    </div>

                    {/* Answers */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      {q.answers?.map((ans, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-indigo-300">{ans.answeredBy} ({ans.role})</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {ans.helpfulCount} helpful
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">{ans.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </BentoCard>
        </div>

      </div>

    </div>
  );
}

export default SubjectLearningHub;
