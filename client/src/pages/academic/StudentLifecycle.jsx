import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import Badge from '../../components/common/Badge.jsx';
import { BentoSkeleton } from '../../components/common/Skeleton.jsx';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Search,
  Filter,
  UserCheck,
  X,
  Phone,
  Mail,
  Award,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import clsx from 'clsx';

export function StudentLifecycle() {
  const [cohortData, setCohortData] = useState(null);
  const [selectedCohort, setSelectedCohort] = useState('CS-3A');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadStudents = async (cohort = selectedCohort) => {
    setLoading(true);
    try {
      const res = await api.request(`/academic/student-cohorts?classId=${cohort}`);
      if (res.success && res.data) {
        setCohortData(res.data);
      }
    } catch (err) {
      console.error('Failed to load student cohorts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(selectedCohort);
  }, [selectedCohort]);

  if (loading && !cohortData) {
    return <BentoSkeleton />;
  }

  const students = cohortData?.students || [];
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentProfile?.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentProfile?.usn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCohortMeta = cohortData?.cohorts?.find(c => c.id === selectedCohort);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">Cohort Lifecycle & Mentorship</Badge>
            <span className="text-xs text-slate-400 font-mono">B.Tech Computer Science & Engineering</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Student Cohort Registry & Proctoring Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Comprehensive roster management, roll number series, attendance compliance, and advisor mentoring logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Class Advisor</div>
            <div className="text-sm font-semibold text-white truncate">{activeCohortMeta?.advisor || 'Prof. Ananya Sen'}</div>
          </div>
        </div>
      </div>

      {/* Cohort Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cohortData?.cohorts?.map((c) => {
          const isSelected = c.id === selectedCohort;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCohort(c.id)}
              className={clsx(
                'p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between',
                isSelected
                  ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-[#12141C] border-white/[0.08] hover:border-white/20'
              )}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-white">{c.id} (Sem {c.semester})</span>
                <Badge variant={isSelected ? 'primary' : 'neutral'} size="xs">
                  {c.department}
                </Badge>
              </div>

              <div className="text-2xl font-bold text-white font-mono">
                {c.totalStudents} Students
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Advisor: {c.advisor.split(' ')[1] || c.advisor}</span>
                <span className="font-mono text-emerald-400 font-semibold">{c.passRate}% Pass</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#12141C] p-3 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Roll No, USN, Name, Email..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Showing {filteredStudents.length} of {students.length} Enrolled Students</span>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="rounded-2xl bg-[#12141C] border border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.08] text-slate-400 font-medium">
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">University USN</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Batch / Sem</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4">CGPA</th>
                <th className="py-3.5 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredStudents.map((std) => {
                const attPct = std.studentProfile?.attendancePercentage ?? 88.4;
                const isCompliant = attPct >= 75.0;

                return (
                  <tr
                    key={std._id}
                    onClick={() => setSelectedStudent(std)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      {std.studentProfile?.rollNo || '22CS089'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {std.studentProfile?.usn || '1AT22CS089'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {std.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{std.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {std.studentProfile?.batch || '2022-2026'} • Sem {std.studentProfile?.semester || 5}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx('font-mono font-semibold', isCompliant ? 'text-emerald-400' : 'text-rose-400')}>
                          {attPct}%
                        </span>
                        <Badge variant={isCompliant ? 'emerald' : 'rose'} size="xs" dot>
                          {isCompliant ? 'Eligible' : 'Shortage'}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {std.studentProfile?.cgpa ? `${std.studentProfile.cgpa} / 10` : '8.85 / 10'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 group-hover:text-indigo-400">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Academic Dossier Slide-Over Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedStudent(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#12141C] border-l border-white/10 shadow-2xl flex flex-col text-slate-100">
              
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/25">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center justify-center text-sm">
                    {selectedStudent.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-white">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedStudent.studentProfile?.rollNo} • {selectedStudent.studentProfile?.usn}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dossier Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                
                {/* Academic Standing Card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Academic Standing
                  </div>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                      <div className="text-[10px] text-slate-400">Current CGPA</div>
                      <div className="text-lg font-bold text-indigo-400 mt-0.5">
                        {selectedStudent.studentProfile?.cgpa || 8.85}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                      <div className="text-[10px] text-slate-400">Attendance</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">
                        {selectedStudent.studentProfile?.attendancePercentage || 88.4}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Enrollments */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Semester 5 Registered Courses
                  </div>
                  {[
                    { code: 'CS301', name: 'Design & Analysis of Algorithms', attendance: '90.5%' },
                    { code: 'CS302', name: 'Operating Systems & Kernels', attendance: '87.5%' },
                    { code: 'CS303', name: 'Computer Networks & Protocols', attendance: '76.5%' },
                    { code: 'CS304', name: 'Database Management Systems', attendance: '92.8%' },
                    { code: 'CS305', name: 'DBMS Practical Laboratory', attendance: '96.0%' }
                  ].map((c) => (
                    <div
                      key={c.code}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-indigo-400 font-bold">{c.code}</span>
                        <div className="text-slate-300 font-medium text-[11px] mt-0.5">{c.name}</div>
                      </div>
                      <span className="font-mono text-slate-300">{c.attendance}</span>
                    </div>
                  ))}
                </div>

                {/* Mentorship & Proctor Notes */}
                <div className="p-4 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>Advisor Mentoring Note</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Student has demonstrated strong proficiency in algorithms and data structures. Recommended for competitive programming capstone tracks. Hall ticket approved for upcoming midterms.
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/25 flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Cohort Section: {selectedCohort}</span>
                <span>Proctor: Prof. Ananya Sen</span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentLifecycle;
