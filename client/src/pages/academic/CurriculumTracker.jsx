import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import BentoCard from '../../components/common/BentoCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Calendar,
  UserCheck
} from 'lucide-react';
import clsx from 'clsx';

export function CurriculumTracker() {
  const [velocityData, setVelocityData] = useState(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('CS301');
  const [activeSubject, setActiveSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [updatingTopicId, setUpdatingTopicId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load curriculum velocity and initial subject
  const loadData = async (subjectCode = selectedSubjectCode) => {
    try {
      const [velRes, subjRes] = await Promise.all([
        api.request('/academic/curriculum-velocity'),
        api.request(`/academic/subjects/${subjectCode}`)
      ]);

      if (velRes.success) setVelocityData(velRes.data);
      if (subjRes.success) setActiveSubject(subjRes.data);
    } catch (err) {
      console.error('Failed to load curriculum tracker', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedSubjectCode);
  }, [selectedSubjectCode]);

  // Toggle unit expansion
  const toggleUnit = (unitNumber) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitNumber]: !prev[unitNumber]
    }));
  };

  // Toggle topic completion
  const handleToggleTopic = async (topicId, currentStatus) => {
    setUpdatingTopicId(topicId);
    try {
      const res = await api.request(`/academic/subjects/${selectedSubjectCode}/topics/${topicId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isCompleted: !currentStatus })
      });

      if (res.success) {
        // Optimistically update activeSubject topics and progress
        setActiveSubject(prev => {
          if (!prev) return prev;
          const updatedUnits = prev.syllabusUnits.map(unit => ({
            ...unit,
            topics: unit.topics.map(t => t.topicId === topicId ? { ...t, isCompleted: !currentStatus, completedAt: !currentStatus ? new Date().toISOString() : null } : t)
          }));
          return {
            ...prev,
            syllabusUnits: updatedUnits,
            syllabusProgress: res.data.syllabusProgress
          };
        });

        // Refresh velocity summary
        const velRes = await api.request('/academic/curriculum-velocity');
        if (velRes.success) setVelocityData(velRes.data);

        setToastMessage(`Topic marked as ${!currentStatus ? 'Completed & Verified' : 'Pending'}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert('Failed to update topic: ' + err.message);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  if (loading || !activeSubject) {
    return <BentoSkeleton />;
  }

  const selectedVelocity = velocityData?.subjects?.find(s => s.code === selectedSubjectCode);
  const delta = activeSubject.syllabusProgress - activeSubject.targetMilestoneProgress;
  const isAhead = delta >= 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141C] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">Academic Session 2025-2026</Badge>
            <span className="text-xs text-slate-400 font-mono">Week 12 of 16 (75% of Semester Elapsed)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Curriculum Coverage & Velocity Tracker
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Interactive syllabus topic verification, academic calendar milestones, and NAAC syllabus velocity analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Milestone Target</div>
            <div className="text-base font-bold text-white font-mono">{activeSubject.targetMilestoneProgress}% by W12</div>
          </div>
        </div>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {velocityData?.subjects?.map((sub) => {
          const isSelected = sub.code === selectedSubjectCode;
          return (
            <button
              key={sub.code}
              onClick={() => setSelectedSubjectCode(sub.code)}
              className={clsx(
                'flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 border',
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20 font-semibold'
                  : 'bg-[#12141C] text-slate-400 hover:text-white border-white/[0.08] hover:border-white/15'
              )}
            >
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/20">{sub.code}</span>
              <span>{sub.name}</span>
              <span className={clsx(
                'text-[10px] font-mono px-1.5 py-0.2 rounded-full',
                isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-300'
              )}>
                {sub.actualProgress}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Milestone & Velocity KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Actual Progress */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Syllabus Covered</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">
            {activeSubject.syllabusProgress}%
          </div>
          <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${activeSubject.syllabusProgress}%` }}
            />
          </div>
        </div>

        {/* Card 2: Velocity Status */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Curriculum Pace</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {isAhead ? `+${delta}% Ahead` : `${delta}% Behind`}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {isAhead ? 'Pacing ahead of week 12 milestone' : 'Extra tutorial lectures recommended'}
          </div>
        </div>

        {/* Card 3: Topics Completed */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Verified Topics Taught</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {selectedVelocity?.completedTopics || 0} / {selectedVelocity?.totalTopics || 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across {activeSubject.syllabusUnits?.length || 5} syllabus units
          </div>
        </div>

        {/* Card 4: Assigned Course Professor */}
        <div className="p-5 rounded-2xl bg-[#12141C] border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Course Professor</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {activeSubject.assignedFaculty?.name || 'Prof. Ananya Sen'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {activeSubject.credits} Credits • {activeSubject.type.toUpperCase()}
          </div>
        </div>

      </div>

      {/* Unit-by-Unit Interactive Topics Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Syllabus Units & Topic Verification Checklist</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click topic checkbox to verify delivery in lecture hall
          </span>
        </div>

        <div className="space-y-3">
          {activeSubject.syllabusUnits?.map((unit) => {
            const isExpanded = expandedUnits[unit.unitNumber] ?? true;
            const unitCompletedTopics = unit.topics?.filter(t => t.isCompleted).length || 0;
            const unitTotalTopics = unit.topics?.length || 0;
            const unitPct = unitTotalTopics > 0 ? Math.round((unitCompletedTopics / unitTotalTopics) * 100) : 0;

            return (
              <div
                key={unit.unitNumber}
                className="rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-hidden transition-all"
              >
                {/* Unit Header Accordion Trigger */}
                <div
                  onClick={() => toggleUnit(unit.unitNumber)}
                  className="p-4 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer flex items-center justify-between border-b border-white/5 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      U{unit.unitNumber}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{unit.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{unit.description} • ~{unit.estimatedHours} Hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="font-mono text-xs font-semibold text-slate-200">
                        {unitCompletedTopics} / {unitTotalTopics} Topics
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{unitPct}% Complete</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Topics Checklist */}
                {isExpanded && (
                  <div className="p-4 divide-y divide-white/5">
                    {unit.topics?.map((topic) => (
                      <div
                        key={topic.topicId}
                        className="py-3 flex items-start justify-between gap-3 group hover:bg-white/[0.01] px-2 rounded-lg transition-colors"
                      >
                        <div
                          onClick={() => handleToggleTopic(topic.topicId, topic.isCompleted)}
                          className="flex items-start gap-3 cursor-pointer flex-1"
                        >
                          <button
                            type="button"
                            disabled={updatingTopicId === topic.topicId}
                            className={clsx(
                              'mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
                              topic.isCompleted
                                ? 'bg-emerald-500 border-emerald-400 text-black shadow-sm'
                                : 'border-white/20 hover:border-indigo-400'
                            )}
                          >
                            {topic.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                          </button>

                          <div>
                            <span className={clsx(
                              'text-xs font-medium transition-colors',
                              topic.isCompleted ? 'text-slate-300 line-through opacity-75' : 'text-slate-100'
                            )}>
                              {topic.name}
                            </span>
                            {topic.completedAt && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Verified taught: {new Date(topic.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Badge
                            variant={topic.isCompleted ? 'emerald' : 'neutral'}
                            size="xs"
                          >
                            {topic.isCompleted ? 'Taught' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default CurriculumTracker;
