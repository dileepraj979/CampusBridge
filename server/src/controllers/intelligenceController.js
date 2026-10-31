import EarlyWarningRecord from '../models/EarlyWarningRecord.js';
import CounselingNote from '../models/CounselingNote.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

// Realistic sample cohort for early-warning evaluation
const SAMPLE_STUDENT_METRICS = [
  {
    rollNo: '22CS081',
    name: 'Aarav Sharma',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 68.2,
    missedAssignments: 3,
    backlogCount: 1,
    currentCgpa: 6.4,
    recentCgpaDelta: -0.8
  },
  {
    rollNo: '22CS082',
    name: 'Aditi Deshmukh',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 94.5,
    missedAssignments: 0,
    backlogCount: 0,
    currentCgpa: 9.2,
    recentCgpaDelta: +0.3
  },
  {
    rollNo: '22CS083',
    name: 'Bhavin Patel',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 71.0,
    missedAssignments: 2,
    backlogCount: 0,
    currentCgpa: 7.1,
    recentCgpaDelta: -0.4
  },
  {
    rollNo: '22CS084',
    name: 'Divya Iyer',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 96.8,
    missedAssignments: 0,
    backlogCount: 0,
    currentCgpa: 9.6,
    recentCgpaDelta: +0.2
  },
  {
    rollNo: '22CS085',
    name: 'Eshwar Reddy',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 61.5,
    missedAssignments: 4,
    backlogCount: 2,
    currentCgpa: 5.8,
    recentCgpaDelta: -1.2
  },
  {
    rollNo: '22CS086',
    name: 'Fatima Zahra',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 77.4,
    missedAssignments: 1,
    backlogCount: 0,
    currentCgpa: 7.8,
    recentCgpaDelta: -0.2
  },
  {
    rollNo: '22CS087',
    name: 'Gaurav Nair',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 83.0,
    missedAssignments: 0,
    backlogCount: 0,
    currentCgpa: 8.4,
    recentCgpaDelta: +0.1
  },
  {
    rollNo: '22CS088',
    name: 'Harini Sundaram',
    departmentId: 'CSE',
    classId: 'CS-3A',
    attendancePct: 73.5,
    missedAssignments: 2,
    backlogCount: 1,
    currentCgpa: 6.9,
    recentCgpaDelta: -0.5
  }
];

/**
 * Calculates risk level and builds transparent contributing factors
 */
function evaluateStudentRiskMetrics(student, thresholds = {}) {
  const attMin = thresholds.attendanceThreshold || 75.0;
  const missedMax = thresholds.missedAssignmentsThreshold || 2;
  const backlogMax = thresholds.backlogThreshold || 0;
  const cgpaMin = thresholds.cgpaThreshold || 6.5;

  const factors = [];
  let score = 0;

  // 1. Attendance evaluation
  if (student.attendancePct < 65.0) {
    score += 45;
    factors.push({
      factor: 'ATTENDANCE_DEFICIT',
      severity: 'CRITICAL',
      detail: `Severe attendance shortage: ${student.attendancePct}% is below 65% condonation threshold (Risk of detention).`,
      metricValue: student.attendancePct,
      threshold: attMin
    });
  } else if (student.attendancePct < attMin) {
    score += 25;
    factors.push({
      factor: 'ATTENDANCE_DEFICIT',
      severity: 'WARNING',
      detail: `Attendance (${student.attendancePct}%) is below statutory 75% requirement.`,
      metricValue: student.attendancePct,
      threshold: attMin
    });
  } else if (student.attendancePct < 80.0) {
    score += 10;
    factors.push({
      factor: 'ATTENDANCE_DEFICIT',
      severity: 'INFORMATIONAL',
      detail: `Attendance (${student.attendancePct}%) is in borderline zone (75-80%).`,
      metricValue: student.attendancePct,
      threshold: 80.0
    });
  }

  // 2. Missed Assignments
  if (student.missedAssignments >= 3) {
    score += 30;
    factors.push({
      factor: 'MISSED_ASSIGNMENTS',
      severity: 'CRITICAL',
      detail: `${student.missedAssignments} overdue/unsubmitted coursework assignments.`,
      metricValue: student.missedAssignments,
      threshold: missedMax
    });
  } else if (student.missedAssignments >= missedMax) {
    score += 20;
    factors.push({
      factor: 'MISSED_ASSIGNMENTS',
      severity: 'WARNING',
      detail: `${student.missedAssignments} missed assignments exceeds tolerance limit.`,
      metricValue: student.missedAssignments,
      threshold: missedMax
    });
  }

  // 3. Backlogs
  if (student.backlogCount >= 2) {
    score += 35;
    factors.push({
      factor: 'BACKLOG_ACCUMULATION',
      severity: 'CRITICAL',
      detail: `${student.backlogCount} active backlogs accumulated. High risk of academic probation.`,
      metricValue: student.backlogCount,
      threshold: backlogMax
    });
  } else if (student.backlogCount > 0) {
    score += 20;
    factors.push({
      factor: 'BACKLOG_ACCUMULATION',
      severity: 'WARNING',
      detail: `${student.backlogCount} active backlog requiring remedial examination.`,
      metricValue: student.backlogCount,
      threshold: backlogMax
    });
  }

  // 4. CGPA Drop
  if (student.currentCgpa < cgpaMin) {
    score += 25;
    factors.push({
      factor: 'CGPA_DROP',
      severity: 'WARNING',
      detail: `Cumulative GPA (${student.currentCgpa}) is below benchmark minimum ${cgpaMin}.`,
      metricValue: student.currentCgpa,
      threshold: cgpaMin
    });
  }

  let riskLevel = 'STABLE';
  if (score >= 60 || student.attendancePct < 65.0 || student.backlogCount >= 2) {
    riskLevel = 'HIGH_RISK';
  } else if (score >= 35 || student.attendancePct < attMin || student.missedAssignments >= 2) {
    riskLevel = 'MODERATE_RISK';
  } else if (score >= 10) {
    riskLevel = 'WATCHLIST';
  }

  return {
    ...student,
    riskLevel,
    riskScore: Math.min(100, score),
    contributingFactors: factors
  };
}

/**
 * GET /api/intelligence/early-warning
 * Retrieves evaluated students, risk counts, and threshold filters
 */
export async function getEarlyWarningDashboard(req, res) {
  try {
    const {
      departmentId = 'CSE',
      classId = 'CS-3A',
      attendanceThreshold = 75,
      missedAssignmentsThreshold = 2,
      backlogThreshold = 0,
      cgpaThreshold = 6.5
    } = req.query;

    const thresholds = {
      attendanceThreshold: parseFloat(attendanceThreshold) || 75,
      missedAssignmentsThreshold: parseInt(missedAssignmentsThreshold, 10) || 2,
      backlogThreshold: parseInt(backlogThreshold, 10) || 0,
      cgpaThreshold: parseFloat(cgpaThreshold) || 6.5
    };

    // Evaluate students using the configured thresholds
    const evaluated = SAMPLE_STUDENT_METRICS.map(s => evaluateStudentRiskMetrics(s, thresholds));

    // Calculate aggregated metrics
    const highRisk = evaluated.filter(s => s.riskLevel === 'HIGH_RISK');
    const moderateRisk = evaluated.filter(s => s.riskLevel === 'MODERATE_RISK');
    const watchlist = evaluated.filter(s => s.riskLevel === 'WATCHLIST');
    const stable = evaluated.filter(s => s.riskLevel === 'STABLE');

    // Count open counseling notes
    const activeCounselingCount = await CounselingNote.countDocuments({
      departmentId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] }
    });

    return res.json({
      success: true,
      meta: {
        departmentId,
        classId,
        thresholds,
        totalEvaluated: evaluated.length,
        summary: {
          highRiskCount: highRisk.length,
          moderateRiskCount: moderateRisk.length,
          watchlistCount: watchlist.length,
          stableCount: stable.length,
          activeCounselingCount
        }
      },
      students: evaluated,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Early-Warning Dashboard query failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'EARLY_WARNING_QUERY_FAILED', message: error.message },
      requestId: req.id
    });
  }
}

/**
 * GET /api/intelligence/counseling-notes
 * Access-restricted counseling notes retrieval with audit logging
 */
export async function getCounselingNotes(req, res) {
  try {
    const user = req.user;
    const role = req.role || user.activeRole;
    const { rollNo } = req.query;

    // RBAC Isolation: Only Counselors, Class Advisors, HODs, and Principals are authorized
    const authorizedRoles = ['COUNSELOR', 'CLASS_ADVISOR', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN'];
    if (!authorizedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_COUNSELING_ACCESS',
          message: 'Confidential mentoring notes are restricted to counselors, advisors, and departmental leadership.'
        },
        requestId: req.id
      });
    }

    const query = {};
    if (rollNo) {
      query.studentRollNo = rollNo.toUpperCase();
    }

    const notes = await CounselingNote.find(query).sort({ createdAt: -1 });

    // Append access audit entry for privacy compliance
    if (notes.length > 0) {
      const accessEntry = {
        accessedBy: user.email || 'counselor@ait.edu',
        role,
        timestamp: new Date(),
        purpose: 'CONFIDENTIAL_DASHBOARD_REVIEW'
      };
      await CounselingNote.updateMany(
        { _id: { $in: notes.map(n => n._id) } },
        { $push: { accessAudit: accessEntry } }
      );
    }

    return res.json({
      success: true,
      count: notes.length,
      data: notes,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Failed to get counseling notes:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'COUNSELING_NOTES_FAILED', message: error.message },
      requestId: req.id
    });
  }
}

/**
 * POST /api/intelligence/counseling-notes
 * Creates a confidential mentoring follow-up note
 */
export async function createCounselingNote(req, res) {
  try {
    const user = req.user;
    const role = req.role || user.activeRole;
    const {
      studentRollNo,
      studentName,
      departmentId = 'CSE',
      classId = 'CS-3A',
      sessionType,
      keyConcerns = [],
      notes,
      actionPlan,
      nextFollowUpDate
    } = req.body;

    const authorizedRoles = ['COUNSELOR', 'CLASS_ADVISOR', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN'];
    if (!authorizedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to log counseling notes' },
        requestId: req.id
      });
    }

    if (!studentRollNo || !notes || !actionPlan) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'studentRollNo, notes, and actionPlan are required' },
        requestId: req.id
      });
    }

    const newNote = new CounselingNote({
      collegeId: 'AIT',
      studentRollNo: studentRollNo.toUpperCase(),
      studentName: studentName || 'Student',
      departmentId,
      classId,
      counselorEmail: user.email || 'advisor.cse@ait.edu',
      counselorName: user.name || 'Academic Mentor',
      counselorRole: role,
      sessionDate: new Date(),
      sessionType: sessionType || 'ACADEMIC_INTERVENTION',
      keyConcerns,
      notes,
      actionPlan,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      status: 'OPEN',
      isConfidential: true,
      authorizedRoles: ['COUNSELOR', 'CLASS_ADVISOR', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN'],
      accessAudit: [
        {
          accessedBy: user.email || 'advisor.cse@ait.edu',
          role,
          timestamp: new Date(),
          purpose: 'INITIAL_CREATION'
        }
      ]
    });

    await newNote.save();

    return res.status(201).json({
      success: true,
      message: 'Confidential counseling note recorded successfully',
      data: newNote,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Failed to create counseling note:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CREATE_NOTE_FAILED', message: error.message },
      requestId: req.id
    });
  }
}

/**
 * PATCH /api/intelligence/counseling-notes/:id/status
 * Updates resolution status of a counseling note
 */
export async function updateCounselingNoteStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const user = req.user;
    const role = req.role || user.activeRole;

    const note = await CounselingNote.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTE_NOT_FOUND', message: 'Counseling note not found' },
        requestId: req.id
      });
    }

    note.status = status || note.status;
    note.accessAudit.push({
      accessedBy: user.email || 'counselor@ait.edu',
      role,
      timestamp: new Date(),
      purpose: `STATUS_CHANGE_TO_${status}: ${remarks || 'Review complete'}`
    });

    await note.save();

    return res.json({
      success: true,
      message: 'Counseling note status updated',
      data: note,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Failed to update counseling note:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'UPDATE_NOTE_FAILED', message: error.message },
      requestId: req.id
    });
  }
}
