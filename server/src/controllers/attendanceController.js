import crypto from 'crypto';
import ClassSession from '../models/ClassSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Generate a rotating time-bound QR token
 */
function generateQrToken(sessionId, secret) {
  const windowTime = Math.floor(Date.now() / 15000); // 15-second rotation window
  return crypto.createHmac('sha256', secret).update(`${sessionId}_${windowTime}`).digest('hex').substring(0, 16);
}

/**
 * GET /api/attendance/sessions
 * Fetch sessions for classId, date, or faculty
 */
export async function getSessions(req, res, next) {
  try {
    const { classId = 'CS-3A', date = new Date().toISOString().split('T')[0], facultyId } = req.query;
    const filter = { date };

    if (classId) filter.classId = classId;
    if (facultyId) filter.facultyId = facultyId;

    let sessions = await ClassSession.find(filter)
      .populate('facultyId', 'name email')
      .populate('attendanceRecordId')
      .sort({ periodNumber: 1 })
      .lean();

    // If no sessions exist for today, create realistic default schedule for class CS-3A
    if (sessions.length === 0 && classId === 'CS-3A') {
      const defaultFaculty = await User.findOne({ email: 'faculty.cse@ait.edu' });
      const defaultFacultyId = defaultFaculty ? defaultFaculty._id : req.user._id;

      const seedSessions = [
        {
          classId: 'CS-3A',
          departmentCode: 'CSE',
          subjectCode: 'CS301',
          subjectName: 'Design & Analysis of Algorithms',
          facultyId: defaultFacultyId,
          facultyName: 'Prof. Ananya Sen',
          date,
          periodNumber: 1,
          startTime: '09:30 AM',
          endTime: '10:30 AM',
          room: 'LH-302',
          sessionType: 'theory',
          status: 'scheduled'
        },
        {
          classId: 'CS-3A',
          departmentCode: 'CSE',
          subjectCode: 'CS302',
          subjectName: 'Operating Systems & Kernels',
          facultyId: defaultFacultyId,
          facultyName: 'Dr. Ramesh Kumar',
          date,
          periodNumber: 2,
          startTime: '10:45 AM',
          endTime: '11:45 AM',
          room: 'LH-302',
          sessionType: 'theory',
          status: 'scheduled'
        },
        {
          classId: 'CS-3A',
          departmentCode: 'CSE',
          subjectCode: 'CS305',
          subjectName: 'Database Management Systems Lab',
          facultyId: defaultFacultyId,
          facultyName: 'Prof. Vikram Rao',
          date,
          periodNumber: 3,
          startTime: '01:30 PM',
          endTime: '03:30 PM',
          room: 'CS-LAB-4',
          sessionType: 'lab',
          status: 'scheduled'
        }
      ];

      await ClassSession.insertMany(seedSessions);

      sessions = await ClassSession.find(filter)
        .populate('facultyId', 'name email')
        .sort({ periodNumber: 1 })
        .lean();
    }

    res.json({
      success: true,
      data: sessions,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/sessions/:sessionId
 * Fetch single session details with student roster & current attendance record
 */
export async function getSessionById(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await ClassSession.findById(sessionId).populate('facultyId', 'name email').lean();

    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    // Find existing attendance record or construct roster from students
    let attendance = null;
    if (session.attendanceRecordId) {
      attendance = await AttendanceRecord.findById(session.attendanceRecordId).lean();
    } else {
      attendance = await AttendanceRecord.findOne({
        classId: session.classId,
        date: session.date,
        periodNumber: session.periodNumber
      }).lean();
    }

    // Load registered students in cohort if not yet populated in record
    const cohortStudents = await User.find({
      'roles.role': 'STUDENT',
      'roles.classId': session.classId
    })
      .select('name email studentProfile')
      .sort({ 'studentProfile.rollNo': 1 })
      .lean();

    const studentList = cohortStudents.map(st => {
      const existingLine = attendance?.students?.find(
        s => s.rollNo === (st.studentProfile?.rollNo || st.studentProfile?.usn)
      );

      return {
        studentId: st._id,
        rollNo: st.studentProfile?.rollNo || st.studentProfile?.usn || 'UNASSIGNED',
        name: st.name,
        status: existingLine?.status || 'Present',
        remarks: existingLine?.remarks || '',
        verificationMethod: existingLine?.verificationMethod || 'ROSTER_MANUAL',
        markedAt: existingLine?.markedAt || null
      };
    });

    res.json({
      success: true,
      data: {
        session,
        attendance: attendance || {
          classId: session.classId,
          subjectCode: session.subjectCode,
          date: session.date,
          periodNumber: session.periodNumber,
          isLocked: session.isLocked,
          totalStudents: studentList.length,
          presentCount: studentList.filter(s => s.status === 'Present').length,
          absentCount: studentList.filter(s => s.status === 'Absent').length,
          lateCount: studentList.filter(s => s.status === 'Late').length,
          onDutyCount: studentList.filter(s => s.status === 'On Duty').length,
          approvedLeaveCount: studentList.filter(s => s.status === 'Approved Leave').length,
          students: studentList,
          correctionRequests: [],
          anomalyFlags: []
        }
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/sessions/:sessionId/roster
 * Submit or save full attendance roster
 */
export async function saveRoster(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { students = [], topicCovered = '', note = '', isFinalSubmission = false } = req.body;
    const userId = req.user._id;

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.isLocked) {
      throw new AppError('Attendance session is locked. Submit a formal correction approval request to HOD.', 403, 'SESSION_LOCKED');
    }

    // Calculate status counts
    const presentCount = students.filter(s => s.status === 'Present').length;
    const absentCount = students.filter(s => s.status === 'Absent').length;
    const lateCount = students.filter(s => s.status === 'Late').length;
    const onDutyCount = students.filter(s => s.status === 'On Duty').length;
    const approvedLeaveCount = students.filter(s => s.status === 'Approved Leave').length;
    const totalStudents = students.length;

    // Check for anomalies
    const anomalyFlags = [];
    const submissionTime = new Date();
    const currentHour = submissionTime.getHours();

    // 1. Out of schedule hours anomaly (e.g. before 8 AM or after 8 PM)
    if (currentHour < 8 || currentHour >= 20) {
      anomalyFlags.push({
        type: 'OUT_OF_SCHEDULE_HOURS',
        severity: 'MEDIUM',
        description: `Attendance submitted at ${submissionTime.toLocaleTimeString()} outside standard lecture hours (08:00 - 20:00).`,
        detectedAt: submissionTime,
        resolved: false
      });
    }

    // 2. Sudden absentee spike anomaly (>35% absent)
    if (totalStudents > 0 && (absentCount / totalStudents) > 0.35) {
      anomalyFlags.push({
        type: 'SUDDEN_ABSENTEE_SPIKE',
        severity: 'HIGH',
        description: `High absentee rate detected: ${absentCount} of ${totalStudents} students (${Math.round((absentCount / totalStudents) * 100)}%) marked Absent.`,
        detectedAt: submissionTime,
        resolved: false
      });
    }

    // Locate or create AttendanceRecord
    let record = null;
    if (session.attendanceRecordId) {
      record = await AttendanceRecord.findById(session.attendanceRecordId);
    } else {
      record = await AttendanceRecord.findOne({
        classId: session.classId,
        date: session.date,
        periodNumber: session.periodNumber
      });
    }

    const recordId = record?.recordId || `att_${session.classId.toLowerCase().replace(/[^a-z0-9]/g, '')}_${session.date.replace(/-/g, '')}_p${session.periodNumber}`;

    if (!record) {
      record = new AttendanceRecord({
        recordId,
        sessionId: session._id,
        classId: session.classId,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        date: session.date,
        periodNumber: session.periodNumber,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        onDutyCount,
        approvedLeaveCount,
        students,
        anomalyFlags,
        note,
        markedBy: userId,
        markedByEmail: req.user.email,
        collegeId: session.collegeId,
        version: 1
      });
    } else {
      record.totalStudents = totalStudents;
      record.presentCount = presentCount;
      record.absentCount = absentCount;
      record.lateCount = lateCount;
      record.onDutyCount = onDutyCount;
      record.approvedLeaveCount = approvedLeaveCount;
      record.students = students;
      record.note = note || record.note;
      record.version += 1;
      record.updatedAt = new Date();

      if (anomalyFlags.length > 0) {
        record.anomalyFlags.push(...anomalyFlags);
      }
    }

    if (isFinalSubmission) {
      record.isLocked = true;
      record.lockedAt = new Date();
      record.lockedBy = userId;
    }

    await record.save();

    // Update Session
    session.attendanceRecordId = record._id;
    session.status = isFinalSubmission ? 'completed' : 'active';
    session.topicCovered = topicCovered || session.topicCovered;
    if (isFinalSubmission) {
      session.isLocked = true;
      session.lockedAt = new Date();
      session.lockedBy = userId;
    }
    await session.save();

    // Log in immutable AuditLog
    await AuditLog.create({
      userId,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: isFinalSubmission ? 'ATTENDANCE_FINAL_LOCK' : 'ATTENDANCE_ROSTER_SAVED',
      entity: 'AttendanceRecord',
      entityId: record.recordId,
      collegeId: session.collegeId,
      departmentId: session.departmentCode,
      changes: {
        sessionId: session._id,
        classId: session.classId,
        subjectCode: session.subjectCode,
        presentCount,
        absentCount,
        lateCount,
        isFinalSubmission
      },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      data: {
        record,
        session
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/sessions/:sessionId/lock
 * Lock attendance session
 */
export async function lockSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    session.isLocked = true;
    session.lockedAt = new Date();
    session.lockedBy = userId;
    session.status = 'locked';
    await session.save();

    if (session.attendanceRecordId) {
      await AttendanceRecord.findByIdAndUpdate(session.attendanceRecordId, {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: userId
      });
    }

    await AuditLog.create({
      userId,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'ATTENDANCE_SESSION_LOCKED',
      entity: 'ClassSession',
      entityId: session._id.toString(),
      changes: { isLocked: true, lockedAt: session.lockedAt },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Attendance session successfully locked.',
      data: session,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/sessions/:sessionId/corrections
 * Submit formal correction request (Faculty submission -> HOD review)
 */
export async function submitCorrection(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { studentRollNo, studentName, previousStatus, newStatus, reason } = req.body;
    const userId = req.user._id;

    if (!studentRollNo || !previousStatus || !newStatus || !reason) {
      throw new AppError('studentRollNo, previousStatus, newStatus, and reason are required', 400, 'MISSING_CORRECTION_FIELDS');
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const record = await AttendanceRecord.findOne({
      $or: [{ sessionId: session._id }, { _id: session.attendanceRecordId }]
    });

    if (!record) {
      throw new AppError('Attendance record not found for this session', 404, 'RECORD_NOT_FOUND');
    }

    const newCorrection = {
      requestId: `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      requestedBy: userId,
      requestedByEmail: req.user.email,
      studentRollNo,
      studentName: studentName || '',
      previousStatus,
      newStatus,
      reason,
      status: 'PENDING',
      createdAt: new Date()
    };

    record.correctionRequests.push(newCorrection);
    await record.save();

    res.json({
      success: true,
      message: 'Correction request submitted for HOD review.',
      data: newCorrection,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/corrections
 * List all correction requests (for HOD / Principal review)
 */
export async function getCorrections(req, res, next) {
  try {
    const { status = 'PENDING' } = req.query;

    const records = await AttendanceRecord.find({
      'correctionRequests.status': status
    })
      .populate('sessionId')
      .lean();

    const allCorrections = [];
    records.forEach(rec => {
      rec.correctionRequests
        .filter(cr => cr.status === status)
        .forEach(cr => {
          allCorrections.push({
            ...cr,
            classId: rec.classId,
            subjectCode: rec.subjectCode,
            subjectName: rec.subjectName,
            date: rec.date,
            periodNumber: rec.periodNumber,
            recordId: rec.recordId
          });
        });
    });

    res.json({
      success: true,
      data: allCorrections,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/corrections/:requestId/review
 * HOD / Principal approve or reject a correction request
 */
export async function reviewCorrection(req, res, next) {
  try {
    const { requestId } = req.params;
    const { action, reviewRemarks = '', auditReason = '' } = req.body; // 'APPROVE' | 'REJECT'
    const userId = req.user._id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      throw new AppError("Action must be 'APPROVE' or 'REJECT'", 400, 'INVALID_ACTION');
    }

    if (action === 'APPROVE' && (!auditReason || auditReason.trim().length < 5)) {
      throw new AppError('Audit reason (min 5 chars) is mandatory to approve an official attendance correction', 400, 'AUDIT_REASON_REQUIRED');
    }

    const record = await AttendanceRecord.findOne({
      'correctionRequests.requestId': requestId
    });

    if (!record) {
      throw new AppError('Correction request not found', 404, 'CORRECTION_NOT_FOUND');
    }

    const cr = record.correctionRequests.find(c => c.requestId === requestId);
    if (!cr) {
      throw new AppError('Correction request not found', 404, 'CORRECTION_NOT_FOUND');
    }

    if (cr.status !== 'PENDING') {
      throw new AppError(`Correction request has already been ${cr.status}`, 400, 'ALREADY_PROCESSED');
    }

    cr.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    cr.reviewedBy = userId;
    cr.reviewedByEmail = req.user.email;
    cr.reviewedAt = new Date();
    cr.reviewRemarks = reviewRemarks;

    // If approved, update student's status on roster and recalculate counts
    if (action === 'APPROVE') {
      const studentLine = record.students.find(s => s.rollNo === cr.studentRollNo);
      if (studentLine) {
        studentLine.status = cr.newStatus;
        studentLine.verificationMethod = 'CORRECTION_OVERRIDE';
        studentLine.remarks = `Correction Approved by HOD: ${cr.reason}`;
      }

      // Recompute counts
      record.presentCount = record.students.filter(s => s.status === 'Present').length;
      record.absentCount = record.students.filter(s => s.status === 'Absent').length;
      record.lateCount = record.students.filter(s => s.status === 'Late').length;
      record.onDutyCount = record.students.filter(s => s.status === 'On Duty').length;
      record.approvedLeaveCount = record.students.filter(s => s.status === 'Approved Leave').length;
      record.version += 1;

      // Log immutable AuditLog
      await AuditLog.create({
        userId,
        userEmail: req.user.email,
        userRole: req.authRole || req.user.activeRole,
        action: 'ATTENDANCE_CORRECTION_APPROVED',
        entity: 'AttendanceRecord',
        entityId: record.recordId,
        auditReason,
        changes: {
          requestId,
          studentRollNo: cr.studentRollNo,
          previousStatus: cr.previousStatus,
          newStatus: cr.newStatus,
          reason: cr.reason,
          auditReason
        },
        status: 'SUCCESS',
        requestId: req.id
      });
    }

    await record.save();

    res.json({
      success: true,
      message: `Correction request ${cr.status.toLowerCase()} successfully.`,
      data: cr,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/sessions/:sessionId/qr/start
 * Launch time-bound rotating QR code projection
 */
export async function startQrSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await ClassSession.findById(sessionId);

    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const secret = crypto.randomBytes(16).toString('hex');
    const token = generateQrToken(sessionId, secret);

    session.qrActive = true;
    session.qrCodeSecret = secret;
    session.qrRotationToken = token;
    session.qrCodeExpiresAt = new Date(Date.now() + 15000); // 15 seconds
    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        qrActive: true,
        token,
        rotationIntervalSeconds: 15,
        expiresAt: session.qrCodeExpiresAt,
        scansCount: session.qrScansCount
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/sessions/:sessionId/qr/rotate
 * Rotate token to prevent screenshot sharing
 */
export async function rotateQrSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await ClassSession.findById(sessionId);

    if (!session || !session.qrActive || !session.qrCodeSecret) {
      throw new AppError('Active QR session not found', 400, 'NO_ACTIVE_QR_SESSION');
    }

    const token = generateQrToken(sessionId, session.qrCodeSecret);
    session.qrRotationToken = token;
    session.qrCodeExpiresAt = new Date(Date.now() + 15000);
    await session.save();

    res.json({
      success: true,
      data: {
        token,
        expiresAt: session.qrCodeExpiresAt,
        scansCount: session.qrScansCount
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/sessions/:sessionId/qr/verify
 * Student checks in via QR code
 */
export async function verifyQrAttendance(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { token, studentRollNo } = req.body;
    const studentUser = req.user;

    const session = await ClassSession.findById(sessionId);
    if (!session || !session.qrActive) {
      throw new AppError('QR attendance session is not active', 400, 'QR_SESSION_INACTIVE');
    }

    // Verify token matches active or previous window token
    const expectedCurrent = generateQrToken(sessionId, session.qrCodeSecret);
    if (token !== expectedCurrent && token !== session.qrRotationToken) {
      throw new AppError('QR code expired or invalid. Please scan the current code on the screen.', 400, 'INVALID_QR_TOKEN');
    }

    // Determine student roll number
    const targetRoll = studentRollNo || studentUser.studentProfile?.rollNo || studentUser.studentProfile?.usn;
    if (!targetRoll) {
      throw new AppError('Student roll number not identified', 400, 'ROLL_NUMBER_REQUIRED');
    }

    // Locate attendance record
    let record = await AttendanceRecord.findOne({
      $or: [{ sessionId: session._id }, { _id: session.attendanceRecordId }]
    });

    if (!record) {
      record = new AttendanceRecord({
        recordId: `att_${session.classId.toLowerCase().replace(/[^a-z0-9]/g, '')}_${session.date.replace(/-/g, '')}_p${session.periodNumber}`,
        sessionId: session._id,
        classId: session.classId,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        date: session.date,
        periodNumber: session.periodNumber,
        students: []
      });
    }

    // Check if student line item already exists
    let studentLine = record.students.find(s => s.rollNo === targetRoll);
    if (studentLine && studentLine.status === 'Present') {
      return res.json({
        success: true,
        message: 'Attendance already verified for this session.',
        data: { rollNo: targetRoll, status: 'Present', duplicate: true }
      });
    }

    if (!studentLine) {
      record.students.push({
        studentId: studentUser._id,
        rollNo: targetRoll,
        name: studentUser.name,
        status: 'Present',
        verificationMethod: 'QR_SCAN',
        markedAt: new Date()
      });
    } else {
      studentLine.status = 'Present';
      studentLine.verificationMethod = 'QR_SCAN';
      studentLine.markedAt = new Date();
    }

    // Recompute counts
    record.presentCount = record.students.filter(s => s.status === 'Present').length;
    record.absentCount = record.students.filter(s => s.status === 'Absent').length;
    record.totalStudents = Math.max(record.students.length, 60);
    await record.save();

    session.qrScansCount += 1;
    await session.save();

    res.json({
      success: true,
      message: `Verified Present: ${targetRoll} (${studentUser.name})`,
      data: {
        rollNo: targetRoll,
        status: 'Present',
        verificationMethod: 'QR_SCAN',
        scansCount: session.qrScansCount
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/anomalies
 * List detected attendance anomalies across the department/college
 */
export async function getAnomalies(req, res, next) {
  try {
    const records = await AttendanceRecord.find({
      'anomalyFlags.0': { $exists: true }
    })
      .sort({ updatedAt: -1 })
      .lean();

    const anomalies = [];
    records.forEach(rec => {
      rec.anomalyFlags.forEach((flag, idx) => {
        anomalies.push({
          id: `${rec.recordId}_anom_${idx}`,
          recordId: rec.recordId,
          classId: rec.classId,
          subjectCode: rec.subjectCode,
          date: rec.date,
          periodNumber: rec.periodNumber,
          type: flag.type,
          severity: flag.severity,
          description: flag.description,
          detectedAt: flag.detectedAt,
          resolved: flag.resolved,
          resolutionNote: flag.resolutionNote
        });
      });
    });

    res.json({
      success: true,
      data: anomalies,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/forecast/:studentRollNo
 * Calculate dynamic attendance eligibility forecasting against 75% target threshold
 */
export async function getAttendanceForecast(req, res, next) {
  try {
    const { studentRollNo } = req.params;

    // Aggregate all attendance records for this student
    const records = await AttendanceRecord.find({
      'students.rollNo': studentRollNo
    }).lean();

    let totalClassesHeld = 0;
    let totalClassesAttended = 0;
    const subjectBreakdown = {};

    records.forEach(rec => {
      const studentLine = rec.students.find(s => s.rollNo === studentRollNo);
      if (!studentLine) return;

      totalClassesHeld += 1;
      const isAttended = ['Present', 'Late', 'On Duty'].includes(studentLine.status);
      if (isAttended) totalClassesAttended += 1;

      if (!subjectBreakdown[rec.subjectCode]) {
        subjectBreakdown[rec.subjectCode] = {
          code: rec.subjectCode,
          name: rec.subjectName || rec.subjectCode,
          held: 0,
          attended: 0
        };
      }
      subjectBreakdown[rec.subjectCode].held += 1;
      if (isAttended) subjectBreakdown[rec.subjectCode].attended += 1;
    });

    // If zero records found in DB yet, provide realistic academic baseline for demonstration
    if (totalClassesHeld === 0) {
      totalClassesHeld = 48;
      totalClassesAttended = 34; // 70.8% -> below 75% threshold!
      subjectBreakdown['CS301'] = { code: 'CS301', name: 'Design & Analysis of Algorithms', held: 16, attended: 11 };
      subjectBreakdown['CS302'] = { code: 'CS302', name: 'Operating Systems & Kernels', held: 18, attended: 15 };
      subjectBreakdown['CS305'] = { code: 'CS305', name: 'Database Management Systems Lab', held: 14, attended: 8 };
    }

    const currentPercentage = Math.round((totalClassesAttended / totalClassesHeld) * 1000) / 10;
    const TARGET_THRESHOLD = 75; // Statutory target percentage

    let classesNeededToTarget = 0;
    let classesCanMiss = 0;
    const isAboveTarget = currentPercentage >= TARGET_THRESHOLD;

    if (!isAboveTarget) {
      // Formula: ceil((0.75 * Total - Attended) / (1 - 0.75)) = ceil((3T - 4A))
      // e.g. T=48, A=34 -> (3*48 - 4*34) = (144 - 136) = 8 consecutive classes needed
      const rawNeeded = (0.75 * totalClassesHeld - totalClassesAttended) / (1 - 0.75);
      classesNeededToTarget = Math.max(0, Math.ceil(rawNeeded));
    } else {
      // Formula: floor((Attended - 0.75 * Total) / 0.75) = floor((4A - 3T) / 3)
      const rawCanMiss = (totalClassesAttended - 0.75 * totalClassesHeld) / 0.75;
      classesCanMiss = Math.max(0, Math.floor(rawCanMiss));
    }

    const breakdownList = Object.values(subjectBreakdown).map(sub => {
      const pct = Math.round((sub.attended / sub.held) * 1000) / 10;
      const subAbove = pct >= TARGET_THRESHOLD;
      const needed = !subAbove ? Math.max(0, Math.ceil((0.75 * sub.held - sub.attended) / 0.25)) : 0;
      const canMiss = subAbove ? Math.max(0, Math.floor((sub.attended - 0.75 * sub.held) / 0.75)) : 0;

      return {
        ...sub,
        percentage: pct,
        isAboveTarget: subAbove,
        classesNeededToTarget: needed,
        classesCanMiss: canMiss
      };
    });

    res.json({
      success: true,
      data: {
        studentRollNo,
        totalClassesHeld,
        totalClassesAttended,
        currentPercentage,
        targetThreshold: TARGET_THRESHOLD,
        isAboveTarget,
        classesNeededToTarget,
        classesCanMiss,
        subjects: breakdownList
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
