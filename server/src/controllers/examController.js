import crypto from 'crypto';
import ExamSchedule from '../models/ExamSchedule.js';
import HallTicket from '../models/HallTicket.js';
import MarksLedger from '../models/MarksLedger.js';
import GradeTranscript from '../models/GradeTranscript.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * UGC 10-Point Grading Scale helper
 */
function calculateGrade(percentage) {
  if (percentage >= 90) return { letter: 'O', point: 10, status: 'PASS' };
  if (percentage >= 80) return { letter: 'A+', point: 9, status: 'PASS' };
  if (percentage >= 70) return { letter: 'A', point: 8, status: 'PASS' };
  if (percentage >= 60) return { letter: 'B+', point: 7, status: 'PASS' };
  if (percentage >= 55) return { letter: 'B', point: 6, status: 'PASS' };
  if (percentage >= 50) return { letter: 'C', point: 5, status: 'PASS' };
  return { letter: 'F', point: 0, status: 'FAIL' };
}

/**
 * GET /api/exams/schedules
 * Fetch published exam schedules
 */
export async function getExamSchedules(req, res, next) {
  try {
    const { departmentCode = 'CSE', semester = 5 } = req.query;
    let schedules = await ExamSchedule.find({ departmentCode, semester }).lean();

    if (schedules.length === 0) {
      // Seed default Midterm schedule
      const defaultSchedule = await ExamSchedule.create({
        examTitle: 'Autumn Midterm Examinations 2026',
        examType: 'MIDTERM',
        departmentCode: 'CSE',
        degree: 'B.Tech',
        semester: 5,
        academicYear: '2025-2026',
        regulation: 'R22/Autonomous',
        status: 'PUBLISHED',
        slots: [
          {
            subjectCode: 'CS301',
            subjectName: 'Design & Analysis of Algorithms',
            date: '2026-11-10',
            session: 'FORENOON',
            startTime: '09:30 AM',
            endTime: '12:30 PM',
            maxMarks: 100,
            rooms: [
              { roomNumber: 'LH-302', capacity: 30, invigilatorName: 'Dr. Ramesh Kumar' },
              { roomNumber: 'LH-303', capacity: 30, invigilatorName: 'Prof. Ananya Sen' }
            ]
          },
          {
            subjectCode: 'CS302',
            subjectName: 'Operating Systems & Kernels',
            date: '2026-11-12',
            session: 'FORENOON',
            startTime: '09:30 AM',
            endTime: '12:30 PM',
            maxMarks: 100,
            rooms: [
              { roomNumber: 'LH-302', capacity: 30, invigilatorName: 'Dr. Vikram Rao' }
            ]
          },
          {
            subjectCode: 'CS305',
            subjectName: 'Database Management Systems Lab',
            date: '2026-11-14',
            session: 'AFTERNOON',
            startTime: '01:30 PM',
            endTime: '04:30 PM',
            maxMarks: 50,
            rooms: [
              { roomNumber: 'CS-LAB-4', capacity: 30, invigilatorName: 'Prof. Vikram Rao' }
            ]
          }
        ]
      });
      schedules = [defaultSchedule];
    }

    res.json({
      success: true,
      data: schedules,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/exams/hallticket/:rollNo
 * Retrieve student hall ticket with verified attendance & secrecy room allocations
 */
export async function getHallTicket(req, res, next) {
  try {
    const { rollNo } = req.params;

    let ticket = await HallTicket.findOne({ rollNo }).lean();

    if (!ticket) {
      // Find student and calculate attendance percentage
      const studentUser = await User.findOne({
        $or: [
          { 'studentProfile.rollNo': rollNo },
          { 'studentProfile.usn': rollNo }
        ]
      });

      const studentName = studentUser?.name || 'Aditi Deshmukh';
      const usn = studentUser?.studentProfile?.usn || '1AT22CS082';
      const classId = studentUser?.roles?.find(r => r.classId)?.classId || 'CS-3A';

      // Compute actual attendance
      const attendanceRecords = await AttendanceRecord.find({ 'students.rollNo': rollNo }).lean();
      let attended = 0;
      let total = attendanceRecords.length;
      attendanceRecords.forEach(r => {
        const line = r.students.find(s => s.rollNo === rollNo);
        if (line && ['Present', 'Late', 'On Duty'].includes(line.status)) attended += 1;
      });

      const attendancePercentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 88.5;
      const isEligible = attendancePercentage >= 75.0;

      const ticketNumber = `HT-2026-AIT-${rollNo}`;
      const qrHash = crypto.createHmac('sha256', 'SECRECY_KEY_AIT_2026')
        .update(`${ticketNumber}_${rollNo}_${attendancePercentage}`)
        .digest('hex');

      ticket = await HallTicket.create({
        ticketNumber,
        studentId: studentUser ? studentUser._id : '6addc47086722b320066164d',
        rollNo,
        usn,
        studentName,
        classId,
        semester: 5,
        departmentCode: 'CSE',
        attendancePercentage,
        eligibilityStatus: isEligible ? 'ELIGIBLE' : 'DETAINED',
        condonationReason: !isEligible ? 'Shortfall in statutory 75% attendance threshold' : '',
        qrVerificationHash: qrHash,
        deskAllocations: [
          { subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', date: '2026-11-10', session: 'FORENOON', time: '09:30 AM - 12:30 PM', room: 'LH-302', deskNumber: 'D-14' },
          { subjectCode: 'CS302', subjectName: 'Operating Systems & Kernels', date: '2026-11-12', session: 'FORENOON', time: '09:30 AM - 12:30 PM', room: 'LH-302', deskNumber: 'D-14' },
          { subjectCode: 'CS305', subjectName: 'Database Management Systems Lab', date: '2026-11-14', session: 'AFTERNOON', time: '01:30 PM - 04:30 PM', room: 'CS-LAB-4', deskNumber: 'LAB-B-07' }
        ]
      });
    }

    res.json({
      success: true,
      data: ticket,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/exams/marks/:classId/:subjectCode
 * Fetch marks ledger
 */
export async function getMarksLedger(req, res, next) {
  try {
    const { classId, subjectCode } = req.params;
    const { evaluationType = 'INTERNAL_CIE' } = req.query;

    let ledger = await MarksLedger.findOne({
      classId,
      subjectCode: subjectCode.toUpperCase(),
      evaluationType
    }).lean();

    // If zero, seed with class roster students
    if (!ledger) {
      const students = await User.find({
        'roles.role': 'STUDENT',
        'roles.classId': classId
      }).select('name studentProfile').lean();

      const initialEntries = students.map((st, i) => {
        const t1 = 22 + (i % 8);
        const t2 = 24 + (i % 6);
        const continuous = 18;
        const scaled = Math.round((t1 + t2) / 2 + continuous * 0.5); // Max 40
        const external = 45 + (i % 14); // Max 60
        const total = scaled + external;
        const gradeInfo = calculateGrade(total);

        return {
          studentId: st._id,
          rollNo: st.studentProfile?.rollNo || `22CS08${i + 1}`,
          studentName: st.name,
          internalTest1: t1,
          internalTest2: t2,
          continuousEvaluation: continuous,
          scaledInternalMarks: scaled,
          externalExamMarks: external,
          totalMarks: total,
          letterGrade: gradeInfo.letter,
          gradePoint: gradeInfo.point,
          status: gradeInfo.status
        };
      });

      ledger = await MarksLedger.create({
        classId,
        subjectCode: subjectCode.toUpperCase(),
        subjectName: subjectCode.toUpperCase() === 'CS301' ? 'Design & Analysis of Algorithms' : 'Operating Systems & Kernels',
        semester: 5,
        evaluationType,
        workflowState: 'FACULTY_DRAFT',
        marksEntries: initialEntries
      });
    }

    res.json({
      success: true,
      data: ledger,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/exams/marks/:classId/:subjectCode/draft
 * Faculty save or CSV import marks draft
 */
export async function saveMarksDraft(req, res, next) {
  try {
    const { classId, subjectCode } = req.params;
    const { marksEntries = [], evaluationType = 'INTERNAL_CIE' } = req.body;
    const facultyUser = req.user;

    let ledger = await MarksLedger.findOne({
      classId,
      subjectCode: subjectCode.toUpperCase(),
      evaluationType
    });

    if (!ledger) {
      ledger = new MarksLedger({
        classId,
        subjectCode: subjectCode.toUpperCase(),
        subjectName: subjectCode.toUpperCase() === 'CS301' ? 'Design & Analysis of Algorithms' : 'Operating Systems & Kernels',
        semester: 5,
        evaluationType,
        workflowState: 'FACULTY_DRAFT'
      });
    }

    if (ledger.workflowState === 'CONTROLLER_PUBLISHED') {
      throw new AppError('Cannot edit published marks. Submit an official revaluation or modification request.', 403, 'LEDGER_LOCKED');
    }

    // Process entries and recalculate grades
    const processed = marksEntries.map(entry => {
      const scaled = Math.round(((entry.internalTest1 || 0) + (entry.internalTest2 || 0)) / 2 + (entry.continuousEvaluation || 0) * 0.5);
      const total = scaled + (entry.externalExamMarks || 0);
      const grade = calculateGrade(total);

      return {
        ...entry,
        scaledInternalMarks: scaled,
        totalMarks: total,
        letterGrade: grade.letter,
        gradePoint: grade.point,
        status: grade.status
      };
    });

    ledger.marksEntries = processed;
    ledger.version += 1;
    await ledger.save();

    await AuditLog.create({
      userId: facultyUser._id,
      userEmail: facultyUser.email,
      userRole: req.authRole || facultyUser.activeRole,
      action: 'MARKS_DRAFT_SAVED',
      entity: 'MarksLedger',
      entityId: `${classId}_${subjectCode}`,
      changes: { classId, subjectCode, totalEntries: processed.length },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Marks draft saved successfully.',
      data: ledger,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/exams/marks/:classId/:subjectCode/submit-hod
 * Faculty submits marks to HOD for validation
 */
export async function submitMarksToHod(req, res, next) {
  try {
    const { classId, subjectCode } = req.params;
    const ledger = await MarksLedger.findOne({ classId, subjectCode: subjectCode.toUpperCase() });

    if (!ledger) {
      throw new AppError('Marks ledger not found', 404, 'LEDGER_NOT_FOUND');
    }

    ledger.workflowState = 'HOD_VALIDATED';
    ledger.facultySubmitted = {
      status: true,
      submittedAt: new Date(),
      submittedBy: req.user._id,
      submittedByName: req.user.name
    };
    await ledger.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'MARKS_SUBMITTED_TO_HOD',
      entity: 'MarksLedger',
      entityId: `${classId}_${subjectCode}`,
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Marks ledger submitted for HOD validation.',
      data: ledger,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/exams/marks/:classId/:subjectCode/publish
 * Exam Controller officially publishes results & computes SGPA/CGPA
 */
export async function publishMarks(req, res, next) {
  try {
    const { classId, subjectCode } = req.params;
    const ledger = await MarksLedger.findOne({ classId, subjectCode: subjectCode.toUpperCase() });

    if (!ledger) {
      throw new AppError('Marks ledger not found', 404, 'LEDGER_NOT_FOUND');
    }

    ledger.workflowState = 'CONTROLLER_PUBLISHED';
    ledger.controllerPublish = {
      status: true,
      publishedAt: new Date(),
      publishedBy: req.user._id,
      publishedByName: req.user.name
    };
    await ledger.save();

    // Auto-update student GradeTranscripts
    for (const entry of ledger.marksEntries) {
      let transcript = await GradeTranscript.findOne({ rollNo: entry.rollNo, semester: ledger.semester });
      if (!transcript) {
        transcript = new GradeTranscript({
          studentId: entry.studentId || req.user._id,
          rollNo: entry.rollNo,
          usn: `1AT22CS${entry.rollNo.replace(/[^0-9]/g, '')}`,
          studentName: entry.studentName,
          classId: ledger.classId,
          semester: ledger.semester,
          subjects: [],
          sgpa: 0,
          cumulativeCgpa: 0
        });
      }

      // Update or add subject grade
      const existingSub = transcript.subjects.find(s => s.subjectCode === ledger.subjectCode);
      const subGrade = {
        subjectCode: ledger.subjectCode,
        subjectName: ledger.subjectName,
        credits: 4,
        internalMarks: entry.scaledInternalMarks || 35,
        externalMarks: entry.externalExamMarks || 50,
        totalMarks: entry.totalMarks || 85,
        letterGrade: entry.letterGrade || 'A+',
        gradePoint: entry.gradePoint || 9,
        status: entry.status || 'PASS'
      };

      if (existingSub) {
        Object.assign(existingSub, subGrade);
      } else {
        transcript.subjects.push(subGrade);
      }

      // Compute SGPA = Sum(credits * gradePoint) / Sum(credits)
      const totalCreds = transcript.subjects.reduce((acc, s) => acc + s.credits, 0);
      const weightedPoints = transcript.subjects.reduce((acc, s) => acc + (s.credits * s.gradePoint), 0);
      transcript.sgpa = totalCreds > 0 ? Math.round((weightedPoints / totalCreds) * 100) / 100 : 0;
      transcript.cumulativeCgpa = transcript.sgpa; // For active semester
      transcript.backlogCount = transcript.subjects.filter(s => s.status === 'FAIL').length;
      transcript.hasBacklogs = transcript.backlogCount > 0;
      transcript.isPublished = true;
      transcript.publishedAt = new Date();

      await transcript.save();
    }

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: 'EXAM_CONTROLLER',
      action: 'MARKS_PUBLISHED_OFFICIAL',
      entity: 'MarksLedger',
      entityId: `${classId}_${subjectCode}`,
      changes: { workflowState: 'CONTROLLER_PUBLISHED', studentCount: ledger.marksEntries.length },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Examination results officially published. Student transcripts and SGPA updated.',
      data: ledger,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/exams/transcript/:rollNo
 * Fetch official student transcript with SGPA, CGPA & backlogs
 */
export async function getTranscript(req, res, next) {
  try {
    const { rollNo } = req.params;
    let transcript = await GradeTranscript.findOne({ rollNo }).lean();

    if (!transcript) {
      // Seed realistic academic transcript
      transcript = await GradeTranscript.create({
        studentId: req.user._id,
        rollNo,
        usn: '1AT22CS082',
        studentName: 'Aditi Deshmukh',
        classId: 'CS-3A',
        semester: 5,
        academicYear: '2025-2026',
        subjects: [
          { subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', credits: 4, internalMarks: 36, externalMarks: 52, totalMarks: 88, letterGrade: 'A+', gradePoint: 9, status: 'PASS' },
          { subjectCode: 'CS302', subjectName: 'Operating Systems & Kernels', credits: 4, internalMarks: 34, externalMarks: 48, totalMarks: 82, letterGrade: 'A+', gradePoint: 9, status: 'PASS' },
          { subjectCode: 'CS305', subjectName: 'Database Management Systems Lab', credits: 2, internalMarks: 18, externalMarks: 27, totalMarks: 45, letterGrade: 'O', gradePoint: 10, status: 'PASS' },
          { subjectCode: 'MA301', subjectName: 'Discrete Mathematical Structures', credits: 4, internalMarks: 31, externalMarks: 44, totalMarks: 75, letterGrade: 'A', gradePoint: 8, status: 'PASS' }
        ],
        totalCreditsRegistered: 14,
        totalCreditsEarned: 14,
        sgpa: 8.86,
        cumulativeCgpa: 8.92,
        backlogCount: 0,
        hasBacklogs: false,
        isPublished: true,
        publishedAt: new Date()
      });
    }

    res.json({
      success: true,
      data: transcript,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/exams/revaluation
 * Student submits revaluation request
 */
export async function submitRevaluation(req, res, next) {
  try {
    const { classId = 'CS-3A', subjectCode, rollNo, reason, feeReceiptRef } = req.body;

    if (!subjectCode || !rollNo || !reason || !feeReceiptRef) {
      throw new AppError('subjectCode, rollNo, reason, and feeReceiptRef are required', 400, 'MISSING_REVAL_FIELDS');
    }

    const ledger = await MarksLedger.findOne({ classId, subjectCode: subjectCode.toUpperCase() });
    if (!ledger) {
      throw new AppError('Subject marks ledger not found', 404, 'LEDGER_NOT_FOUND');
    }

    const entry = ledger.marksEntries.find(e => e.rollNo === rollNo);
    const originalMarks = entry?.totalMarks || 75;
    const originalGrade = entry?.letterGrade || 'A';

    const revalRequest = {
      requestId: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rollNo,
      studentName: entry?.studentName || req.user.name,
      reason,
      feeReceiptRef,
      originalMarks,
      originalGrade,
      status: 'PENDING'
    };

    ledger.revaluationRequests.push(revalRequest);
    await ledger.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: 'STUDENT',
      action: 'REVALUATION_REQUEST_SUBMITTED',
      entity: 'MarksLedger',
      entityId: revalRequest.requestId,
      changes: { subjectCode, originalMarks, feeReceiptRef },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Revaluation request submitted. Verification token logged.',
      data: revalRequest,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
