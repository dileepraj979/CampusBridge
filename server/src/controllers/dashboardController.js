export async function getDashboardData(req, res, next) {
  try {
    const role = req.params.role || req.authRole || req.user.activeRole;
    const department = req.scope?.departmentId || 'CSE';

    let dashboardData = {};

    switch (role) {
      case 'PRINCIPAL':
        dashboardData = {
          role: 'PRINCIPAL',
          kpis: [
            { id: 'enrolled', label: 'Total Enrolled Students', value: '3,420', change: '+4.8% YoY', trend: 'up', color: 'indigo' },
            { id: 'faculty', label: 'Faculty & Researchers', value: '184', change: '100% Ph.D/M.Tech', trend: 'neutral', color: 'blue' },
            { id: 'attendance', label: 'Campus Daily Attendance', value: '94.2%', change: '+1.4% vs last week', trend: 'up', color: 'emerald' },
            { id: 'fees', label: 'Fee Realization Rate', value: '92.4%', change: '₹18.42 Cr / ₹19.9 Cr', trend: 'up', color: 'amber' },
            { id: 'accreditation', label: 'NAAC A++ Readiness', value: '3.84 / 4.0', change: 'Target 3.90', trend: 'up', color: 'purple' }
          ],
          departmentComparison: [
            { name: 'CSE', attendance: 96.2, passRate: 98.4, facultyLoad: 88 },
            { name: 'AI & ML', attendance: 97.1, passRate: 99.0, facultyLoad: 92 },
            { name: 'ECE', attendance: 94.0, passRate: 95.2, facultyLoad: 84 },
            { name: 'MECH', attendance: 91.5, passRate: 92.1, facultyLoad: 78 },
            { name: 'CIVIL', attendance: 89.8, passRate: 90.4, facultyLoad: 76 },
            { name: 'MBA', attendance: 95.4, passRate: 97.0, facultyLoad: 85 }
          ],
          monthlyTrends: [
            { month: 'Jun', attendance: 91, syllabus: 15 },
            { month: 'Jul', attendance: 93, syllabus: 32 },
            { month: 'Aug', attendance: 94, syllabus: 51 },
            { month: 'Sep', attendance: 92, syllabus: 68 },
            { month: 'Oct', attendance: 95, syllabus: 84 }
          ],
          liveAlerts: [
            { id: 1, type: 'CRITICAL', text: 'NBA Peer Evaluation Scheduled for Nov 14-16, 2026', time: '10m ago' },
            { id: 2, type: 'INFO', text: 'Offline Campus Synced: 42 Faculty Tablets updated without conflict', time: '25m ago' },
            { id: 3, type: 'WARNING', text: 'Civil Dept: 3 Laboratory equipment calibration pending renewal', time: '2h ago' }
          ],
          offlineStatusSummary: {
            registeredDevices: 42,
            activeSyncNodes: 42,
            conflictsDetected: 0,
            lastSyncTimestamp: new Date().toISOString()
          }
        };
        break;

      case 'HOD':
        dashboardData = {
          role: 'HOD',
          departmentName: department === 'CSE' ? 'Computer Science & Engineering' : department,
          departmentCode: department,
          kpis: [
            { id: 'deptStudents', label: 'Department Enrolled', value: '480', change: '8 Sections', trend: 'up', color: 'indigo' },
            { id: 'deptFaculty', label: 'Department Faculty', value: '24', change: '1:20 Ratio', trend: 'neutral', color: 'blue' },
            { id: 'syllabus', label: 'Curriculum Velocity', value: '82.4%', change: 'On Track', trend: 'up', color: 'emerald' },
            { id: 'labHealth', label: 'Lab Systems Operational', value: '118 / 120', change: '98.3% uptime', trend: 'up', color: 'purple' }
          ],
          classAttendance: [
            { classId: 'CS-1A', semester: 'Sem 1', attendance: 95.8, present: 58, total: 60 },
            { classId: 'CS-2A', semester: 'Sem 3', attendance: 92.4, present: 55, total: 60 },
            { classId: 'CS-3A', semester: 'Sem 5', attendance: 96.5, present: 58, total: 60 },
            { classId: 'CS-4A', semester: 'Sem 7', attendance: 89.2, present: 53, total: 60 }
          ],
          facultyWorkload: [
            { name: 'Dr. Ramesh Kumar', courses: 2, weeklyHours: 16, attendanceSync: '100%' },
            { name: 'Prof. Ananya Sen', courses: 3, weeklyHours: 18, attendanceSync: '98%' },
            { name: 'Prof. Vikram Rao', courses: 2, weeklyHours: 14, attendanceSync: '100%' },
            { name: 'Prof. Sneha Patel', courses: 3, weeklyHours: 19, attendanceSync: '96%' }
          ],
          offlineSyncHealth: {
            departmentSyncNodes: 6,
            lastBatchSync: '2 minutes ago',
            pendingOfflineRecords: 0
          }
        };
        break;

      case 'FACULTY':
        dashboardData = {
          role: 'FACULTY',
          facultyName: req.user.name,
          employeeId: req.user.facultyProfile?.employeeId || 'FAC-CSE-042',
          kpis: [
            { id: 'todayLectures', label: "Today's Lectures", value: '3 Classes', change: '1 Lab • 2 Theories', trend: 'neutral', color: 'indigo' },
            { id: 'markedAttendance', label: 'Attendance Recorded', value: '96.8%', change: 'Cached for Offline', trend: 'up', color: 'emerald' },
            { id: 'pendingGrading', label: 'Pending Evaluations', value: '14 Submissions', change: 'Due in 2 days', trend: 'warning', color: 'amber' },
            { id: 'avgPerformance', label: 'Class GPA Average', value: '8.42 / 10', change: '+0.3 vs Midterm 1', trend: 'up', color: 'purple' }
          ],
          todaySchedule: [
            {
              id: 'lec-1',
              subjectCode: 'CS301',
              subjectName: 'Design & Analysis of Algorithms',
              time: '09:30 AM - 10:30 AM',
              room: 'LH-302',
              classSection: 'CS-3A',
              totalStudents: 60,
              attendanceMarked: true,
              syncStatus: 'synced'
            },
            {
              id: 'lec-2',
              subjectCode: 'CS402',
              subjectName: 'Distributed Cloud Systems',
              time: '11:00 AM - 01:00 PM',
              room: 'Computing Lab 3',
              classSection: 'CS-4A',
              totalStudents: 55,
              attendanceMarked: false,
              syncStatus: 'pending'
            },
            {
              id: 'lec-3',
              subjectCode: 'CS305',
              subjectName: 'Database Management Lab',
              time: '02:30 PM - 04:30 PM',
              room: 'DBMS Lab 1',
              classSection: 'CS-3B',
              totalStudents: 58,
              attendanceMarked: false,
              syncStatus: 'cached'
            }
          ],
          gradeDistribution: [
            { grade: 'O (90-100)', count: 18 },
            { grade: 'A+ (80-89)', count: 24 },
            { grade: 'A (70-79)', count: 12 },
            { grade: 'B+ (60-69)', count: 5 },
            { grade: 'B (50-59)', count: 1 }
          ]
        };
        break;

      case 'STUDENT':
      default:
        dashboardData = {
          role: 'STUDENT',
          studentName: req.user.name,
          rollNo: req.user.studentProfile?.rollNo || '22CS089',
          semester: req.user.studentProfile?.semester || 6,
          cgpa: req.user.studentProfile?.cgpa || 8.85,
          kpis: [
            { id: 'overallAttendance', label: 'Cumulative Attendance', value: '88.4%', change: 'Min Required: 75%', trend: 'up', color: 'emerald' },
            { id: 'currentCgpa', label: 'Current CGPA', value: '8.85', change: 'Top 5% of Class', trend: 'up', color: 'indigo' },
            { id: 'pendingAssignments', label: 'Assignments Due', value: '2 Due Soon', change: 'DSA & ML Lab', trend: 'warning', color: 'amber' },
            { id: 'offlinePacks', label: 'Offline Study Packs', value: '4 Cached', change: '18.4 MB in Dexie', trend: 'neutral', color: 'purple' }
          ],
          bunkCalculator: {
            safeToBunk: 4,
            warningCourse: 'Computer Networks',
            warningCourseAttendance: 76.5,
            message: 'You can safely miss 4 classes of CS301 (Algorithms) and remain above 75% threshold.'
          },
          subjectAttendance: [
            { code: 'CS301', name: 'Design & Analysis of Algorithms', attended: 38, total: 42, percentage: 90.5, status: 'safe' },
            { code: 'CS302', name: 'Operating Systems & Kernels', attended: 35, total: 40, percentage: 87.5, status: 'safe' },
            { code: 'CS303', name: 'Computer Networks', attended: 26, total: 34, percentage: 76.5, status: 'warning' },
            { code: 'CS304', name: 'Database Management Systems', attended: 39, total: 42, percentage: 92.8, status: 'safe' },
            { code: 'CS305', name: 'Machine Learning Fundamentals', attended: 33, total: 36, percentage: 91.6, status: 'safe' }
          ],
          upcomingExams: [
            { code: 'CS301', name: 'Algorithms Mid-Term Examination', date: 'Oct 30, 2026', time: '10:00 AM', hall: 'Exam Block 2, Hall 204' },
            { code: 'CS302', name: 'Operating Systems Lab Viva', date: 'Nov 04, 2026', time: '02:00 PM', hall: 'Systems Lab 2' }
          ],
          cachedStudyPacks: [
            { id: 'pack-1', title: 'Algorithms - Dynamic Programming & Graphs', size: '6.4 MB', lastSynced: 'Today, 10:15 AM' },
            { id: 'pack-2', title: 'OS Kernel Concurrency Notes', size: '4.8 MB', lastSynced: 'Yesterday' },
            { id: 'pack-3', title: 'DBMS Normalization & B+ Trees Cheatsheet', size: '3.2 MB', lastSynced: 'Oct 22' },
            { id: 'pack-4', title: 'Midterm Question Bank (2023-2025)', size: '4.0 MB', lastSynced: 'Oct 20' }
          ]
        };
        break;
    }

    res.json({
      success: true,
      data: dashboardData,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
