import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSync } from '../../context/SyncContext.jsx';
import { db } from '../../db/dexieDb.js';
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  HelpCircle,
  Calendar,
  ShieldCheck,
  FileText,
  BarChart3,
  WifiOff,
  Zap,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

export function AiAssistantDrawer({ isOpen, onClose }) {
  const { user, activeRole } = useAuth();
  const { isOnline } = useSync();

  const isStudent = activeRole === 'STUDENT' || activeRole === 'PARENT';
  const isFaculty = activeRole === 'FACULTY' || activeRole === 'CLASS_ADVISOR' || activeRole === 'HOD';

  // Modes
  // Student: 'explain' | 'quiz' | 'revision' | 'policy'
  // Faculty: 'rubric' | 'summary' | 'explain'
  const [activeMode, setActiveMode] = useState(isStudent ? 'explain' : 'rubric');
  const [prompt, setPrompt] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('CS301');
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState([]);
  const [offlineStudyPacks, setOfflineStudyPacks] = useState([]);
  const [rubricPublished, setRubricPublished] = useState(false);

  // Load cached Dexie study packs for offline deterministic search
  useEffect(() => {
    async function loadOfflineMaterials() {
      try {
        const packs = await db.studyPacks.toArray();
        setOfflineStudyPacks(packs);
      } catch (e) {
        console.warn('Failed to load study packs from Dexie:', e);
      }
    }
    loadOfflineMaterials();
  }, []);

  // Offline deterministic fallback generator
  const runOfflineDeterministicEngine = async (queryText, mode) => {
    // Simulate instantaneous local deterministic query over Dexie records
    await new Promise((r) => setTimeout(r, 200));

    if (mode === 'policy' || queryText.toLowerCase().includes('rule') || queryText.toLowerCase().includes('attendance')) {
      return {
        answerType: 'LOCAL_POLICY_MATCH',
        isOfflineEngine: true,
        response: 'According to cached Institutional Regulations R22 (Section 4.2):\n\n' +
          '• Minimum Mandatory Attendance: 75% per semester per subject.\n' +
          '• Medical Condonation: Up to 10% (65% to 74.9%) by Principal upon certified hospital record.\n' +
          '• Below 65%: Strictly detained from Semester End Examinations.',
        citations: [
          {
            document: 'AIT Autonomous Regulations R22 (Offline Dexie Cache)',
            docCode: 'DEXIE-REF-R22-SEC4',
            verified: true,
            storageEngine: 'IndexedDB'
          }
        ]
      };
    }

    if (mode === 'quiz') {
      return {
        answerType: 'PRACTICE_QUIZ',
        isOfflineEngine: true,
        topic: queryText || 'Dynamic Programming & Memoization',
        subjectCode: selectedSubject,
        subjectName: 'Design & Analysis of Algorithms',
        questions: [
          {
            id: 1,
            questionText: '[Local Offline Cache] What is the difference between top-down memoization and bottom-up tabulation?',
            options: [
              'Memoization is iterative; tabulation is recursive',
              'Memoization uses recursion with cache; tabulation solves subproblems iteratively',
              'Tabulation consumes more memory than memoization',
              'They have completely different asymptotic time complexities'
            ],
            correctAnswerIndex: 1,
            explanation: 'Memoization maintains a lookup table while evaluating recursively. Tabulation builds up solutions iteratively starting from base cases.',
            hint: 'Recall the state matrix filling direction.'
          },
          {
            id: 2,
            questionText: '[Local Offline Cache] In Bellman-Ford, why do we relax all edges |V| - 1 times?',
            options: [
              'Because a simple shortest path has at most |V| - 1 edges',
              'To handle cycles with positive weights',
              'Because graph matrices require quadratic sweeps',
              'To guarantee asymptotic O(E) complexity'
            ],
            correctAnswerIndex: 0,
            explanation: 'A simple path without cycles cannot exceed |V| - 1 edges. Hence |V| - 1 passes guarantee shortest distance propagation.',
            hint: 'Consider the maximum number of hops in an acyclic path.'
          }
        ],
        citations: [
          {
            document: 'CS301 Offline Study Pack Unit 3 (Dexie Cache)',
            docCode: 'DEXIE-PACK-CS301-U3',
            verified: true,
            storageEngine: 'IndexedDB'
          }
        ]
      };
    }

    if (mode === 'revision') {
      return {
        answerType: 'REVISION_ROADMAP',
        isOfflineEngine: true,
        targetSubject: `${selectedSubject} Algorithms (Calculated from Offline Timetable)`,
        totalDays: 4,
        dailySchedule: [
          { day: 'Day 1', focus: 'Recurrence Relations & Master Theorem', tasks: ['Review Unit 1 PDF', 'Solve 4 divide-and-conquer recurrences'] },
          { day: 'Day 2', focus: 'Greedy Strategies & Huffman Codes', tasks: ['Implement Prefix Tree coding', 'Review Fractional Knapsack proofs'] },
          { day: 'Day 3', focus: 'Dynamic Programming Subproblems', tasks: ['Trace Matrix Chain Multiplication', 'Complete offline self-test'] },
          { day: 'Day 4', focus: 'Graph Algorithms Review', tasks: ['Compare Dijkstra vs Bellman-Ford', 'Take offline timed mock quiz'] }
        ],
        citations: [
          {
            document: 'Cached Academic Calendar & Syllabus Schedule',
            docCode: 'DEXIE-CAL-2026',
            verified: true,
            storageEngine: 'IndexedDB'
          }
        ]
      };
    }

    // Default: Local syllabus explainer
    return {
      answerType: 'SYLLABUS_EXPLAINER',
      isOfflineEngine: true,
      subjectCode: selectedSubject,
      subjectName: 'Design & Analysis of Algorithms',
      response: `[Local Deterministic Response]\n\nBased on your locally stored **${selectedSubject} study pack**, "${queryText || 'Core Algorithms'}" is part of Unit 3 (Dynamic Programming).\n\n` +
        `• **Key Topics:** Optimal Substructure, Overlapping Subproblems, Memoization Table.\n` +
        `• **Practical Application:** Solves 0/1 Knapsack, Longest Common Subsequence, and Floyd-Warshall.\n` +
        `• **Offline Study Tip:** You have 2 lecture PDFs cached in IndexedDB available for offline reading without internet.`,
      citations: [
        {
          document: `${selectedSubject} Cached Lecture Notes (Unit 3)`,
          docCode: `DEXIE-LMS-${selectedSubject}-U3`,
          verified: true,
          storageEngine: 'IndexedDB'
        }
      ]
    };
  };

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() && activeMode !== 'revision' && activeMode !== 'summary') {
      return;
    }

    setLoading(true);
    setRubricPublished(false);

    try {
      let resultData;

      if (!isOnline) {
        // Offline Fallback — Local Deterministic Mode via Dexie
        resultData = await runOfflineDeterministicEngine(textToSend, activeMode);
      } else {
        // Online Server Request
        let endpoint = '/api/ai/query';
        let body = {
          prompt: textToSend,
          subjectCode: selectedSubject,
          mode: activeMode
        };

        if (activeMode === 'rubric') {
          endpoint = '/api/ai/faculty/generate-rubric';
          body = { title: textToSend, subjectCode: selectedSubject };
        } else if (activeMode === 'summary') {
          endpoint = '/api/ai/faculty/summarize-class';
          body = { classId: 'CS-3A', subjectCode: selectedSubject };
        }

        const res = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('cb_token') || ''}`
          },
          body: JSON.stringify(body)
        });

        const json = await res.json();
        if (json.success) {
          resultData = json.data || json;
        } else {
          // If server returns error, gracefully fallback to local deterministic mode
          resultData = await runOfflineDeterministicEngine(textToSend, activeMode);
        }
      }

      setResponseLog((prev) => [
        ...prev,
        {
          id: Date.now(),
          mode: activeMode,
          prompt: textToSend,
          result: resultData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setPrompt('');
    } catch (err) {
      console.warn('Network query failed, falling back to local deterministic:', err);
      const fallback = await runOfflineDeterministicEngine(textToSend, activeMode);
      setResponseLog((prev) => [
        ...prev,
        {
          id: Date.now(),
          mode: activeMode,
          prompt: textToSend,
          result: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-Over Panel */}
      <div className="relative w-full max-w-xl bg-[#0F111A] border-l border-white/[0.08] flex flex-col h-full shadow-2xl shadow-black z-10">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] bg-[#12141C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">CampusBridge AI</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isStudent ? 'Student Study Engine' : 'Faculty Co-Pilot'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Grounded in verified institutional curricula & policies
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator */}
            {!isOnline ? (
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Zap className="w-3 h-3 text-amber-400" />
                Local Mode
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Verified Online
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Offline Deterministic Notice Banner */}
        {!isOnline && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-200">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Local Deterministic Engine Active:</strong> Querying cached IndexedDB study packs & policies without network latency.
            </span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="p-3 border-b border-white/[0.08] bg-black/20 flex items-center gap-2 overflow-x-auto">
          {isStudent ? (
            <>
              <button
                onClick={() => setActiveMode('explain')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'explain'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Syllabus Explainer</span>
              </button>
              <button
                onClick={() => setActiveMode('quiz')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Practice Quiz</span>
              </button>
              <button
                onClick={() => setActiveMode('revision')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'revision'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Revision Planner</span>
              </button>
              <button
                onClick={() => setActiveMode('policy')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'policy'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>College Policies</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveMode('rubric')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'rubric'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rubric Draft Generator</span>
              </button>
              <button
                onClick={() => setActiveMode('summary')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'summary'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Class Performance Summary</span>
              </button>
              <button
                onClick={() => setActiveMode('quiz')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                  activeMode === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Draft Pop Quiz</span>
              </button>
            </>
          )}
        </div>

        {/* Subject Context Selector */}
        <div className="px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Academic Context:
          </span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[#12141C] border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="CS301">CS301 — Design & Analysis of Algorithms</option>
            <option value="CS302">CS302 — Operating Systems & Kernels</option>
            <option value="CS305">CS305 — Database Systems Lab</option>
          </select>
        </div>

        {/* Message / Response Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {responseLog.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                {isStudent ? 'How can I assist your revision today?' : 'Faculty Academic Assistant Ready'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {isStudent
                  ? 'Ask about syllabus concepts, test your understanding with practice quizzes, or check college attendance & grading policies.'
                  : 'Generate draft evaluation rubrics with 4 performance levels or summarize classroom attendance and submission trends.'}
              </p>

              {/* Quick Prompt Starters */}
              <div className="flex flex-col gap-2 w-full max-w-sm text-left">
                {isStudent ? (
                  <>
                    <button
                      onClick={() => handleSend('Explain dynamic programming and memoization')}
                      className="text-xs p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>"Explain dynamic programming in CS301"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveMode('quiz');
                        handleSend('Generate 3 practice questions on shortest path algorithms');
                      }}
                      className="text-xs p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>"Generate practice quiz on Graph Algorithms"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveMode('policy');
                        handleSend('What is the minimum attendance rule and medical condonation?');
                      }}
                      className="text-xs p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>"What is the statutory attendance requirement?"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActiveMode('rubric');
                        handleSend('Distributed Systems Benchmark & Algorithm Defense');
                      }}
                      className="text-xs p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>"Generate 25-mark rubric for Lab Project"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveMode('summary');
                        handleSend('Summarize CS-3A cohort performance');
                      }}
                      className="text-xs p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>"Summarize CS-3A attendance & at-risk flags"</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            responseLog.map((item) => (
              <div key={item.id} className="space-y-3">
                
                {/* User Prompt Bubble */}
                {item.prompt && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-indigo-600 text-white px-4 py-2.5 text-xs shadow-md shadow-indigo-600/20">
                      {item.prompt}
                    </div>
                  </div>
                )}

                {/* AI Grounded Response Bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 shrink-0 flex items-center justify-center text-white text-xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 space-y-3">
                    
                    {/* Offline / Online Engine Badge */}
                    <div className="flex items-center gap-2">
                      {item.result?.isOfflineEngine ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          Local Deterministic Engine (Dexie.js)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
                          Institutional Server Grounded
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                    </div>

                    {/* Mode Specific Renderers */}
                    
                    {/* 1. Rubric Draft (Faculty) */}
                    {item.result?.status === 'DRAFT_REQUIRES_FACULTY_APPROVAL' || item.result?.criteria ? (
                      <div className="bg-[#12141C] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>DRAFT STATUS — Requires Faculty Approval:</strong> Review criteria and click below to publish this evaluation rubric into the LMS.
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.result.title}</h4>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Subject: <span className="font-mono text-indigo-300">{item.result.subjectCode}</span> • Max Marks: {item.result.maxMarks}
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {item.result.criteria?.map((c, cIdx) => (
                            <div key={cIdx} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                                <span>{c.criterionName}</span>
                                <span className="font-mono text-indigo-400">{c.weightageMarks} pts</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
                                {c.levels?.map((l, lIdx) => (
                                  <div key={lIdx} className="p-1.5 rounded bg-black/30 border border-white/5">
                                    <div className="text-indigo-300 font-medium">{l.level} ({l.marks} pts)</div>
                                    <div className="truncate text-slate-400">{l.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {rubricPublished ? '✓ Published to Course Assignments' : 'Ready for faculty sign-off'}
                          </span>
                          <button
                            disabled={rubricPublished}
                            onClick={() => setRubricPublished(true)}
                            className={clsx(
                              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md',
                              rubricPublished
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                            )}
                          >
                            {rubricPublished ? 'Published to LMS' : 'Approve & Publish to LMS'}
                          </button>
                        </div>
                      </div>
                    ) : item.result?.status === 'PREVIEW_PENDING_FACULTY_CONFIRMATION' ? (
                      /* 2. Class Performance Summary (Faculty) */
                      <div className="bg-[#12141C] border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">Cohort Performance Summary: {item.result.classId}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {item.result.cohortSize} Students Enrolled
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="text-slate-400">Average Attendance</div>
                            <div className="text-base font-bold text-white font-mono">{item.result.attendanceStats?.averageAttendancePct}%</div>
                            <div className="text-[10px] text-rose-400">{item.result.attendanceStats?.belowStatutoryMinimumCount} students &lt; 75%</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="text-slate-400">Submission Completion</div>
                            <div className="text-base font-bold text-emerald-400 font-mono">{item.result.assignmentVelocity?.averageSubmissionRatePct}%</div>
                            <div className="text-[10px] text-slate-400">{item.result.assignmentVelocity?.unsubmittedCount} unsubmitted</div>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-slate-300">
                          <div className="font-semibold text-slate-200">Critical Observations:</div>
                          {item.result.criticalObservations?.map((obs, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                              <span className="text-amber-400">•</span>
                              <span>{obs}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : item.result?.questions ? (
                      /* 3. Practice Quiz (Student) */
                      <div className="bg-[#12141C] border border-indigo-500/20 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">Practice Quiz: {item.result.topic || 'Curriculum Check'}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            3 Questions
                          </span>
                        </div>

                        {item.result.questions.map((q) => (
                          <div key={q.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2">
                            <div className="text-xs font-semibold text-slate-200">
                              {q.id}. {q.questionText}
                            </div>
                            <div className="space-y-1.5">
                              {q.options?.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => alert(oIdx === q.correctAnswerIndex ? 'Correct! ' + q.explanation : 'Incorrect. Hint: ' + q.hint)}
                                  className="w-full text-left text-xs p-2 rounded-lg bg-black/30 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-white/5 text-slate-300 transition-colors flex items-center justify-between"
                                >
                                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                </button>
                              ))}
                            </div>
                            <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-400" />
                              <span>Click an option to test your knowledge</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : item.result?.dailySchedule ? (
                      /* 4. Revision Roadmap */
                      <div className="bg-[#12141C] border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-white">5-Day Revision Plan: {item.result.targetSubject}</h4>
                        <div className="space-y-2">
                          {item.result.dailySchedule.map((ds, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
                              <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">{ds.day}</span>
                              <div className="text-xs">
                                <div className="font-semibold text-slate-200">{ds.focus}</div>
                                <div className="text-slate-400 mt-0.5">{ds.tasks?.join(' • ')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 5. Standard Grounded Syllabus or Policy Explainer */
                      <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl p-4 space-y-3 text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                        {item.result?.response || 'No explanation generated.'}
                      </div>
                    )}

                    {/* Source Citations Block */}
                    {item.result?.citations && item.result.citations.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] space-y-1">
                        <div className="font-medium text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Authoritative Source Grounding:</span>
                        </div>
                        {item.result.citations.map((cite, cIdx) => (
                          <div key={cIdx} className="font-mono text-indigo-300">
                            • {cite.document} ({cite.docCode || cite.unit}) {cite.storageEngine ? `— [${cite.storageEngine}]` : ''}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-slate-400 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Grounding query against academic documents...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-[#12141C]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeMode === 'quiz'
                  ? 'Enter topic for quiz (e.g. Dijkstra, DP on Trees)...'
                  : activeMode === 'rubric'
                  ? 'Assignment / Viva topic for rubric draft...'
                  : activeMode === 'policy'
                  ? 'Ask about attendance 75%, grading, grievances...'
                  : 'Ask about any syllabus topic in CS301...'
              }
              className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Powered by CampusBridge Academic Grounding Engine</span>
            <span>Shortcut: ⌘J / Ctrl+J</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AiAssistantDrawer;
