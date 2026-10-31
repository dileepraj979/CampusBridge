import Department from '../models/Department.js';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import FacultyAssignment from '../models/FacultyAssignment.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/academic/departments
 */
export async function getDepartments(req, res, next) {
  try {
    const departments = await Department.find()
      .populate('hod', 'name email activeRole phone')
      .lean();

    res.json({
      success: true,
      data: departments,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/academic/courses
 */
export async function getCourses(req, res, next) {
  try {
    const courses = await Course.find()
      .populate('departmentId', 'name code')
      .lean();

    res.json({
      success: true,
      data: courses,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/academic/subjects
 */
export async function getSubjects(req, res, next) {
  try {
    const { departmentCode, semester } = req.query;
    const filter = {};

    if (departmentCode) filter.departmentCode = departmentCode;
    if (semester) filter.semester = parseInt(semester, 10);

    const subjects = await Subject.find(filter)
      .populate('assignedFaculty', 'name email facultyProfile')
      .sort({ semester: 1, code: 1 })
      .lean();

    res.json({
      success: true,
      data: subjects,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/academic/subjects/:code
 */
export async function getSubjectByCode(req, res, next) {
  try {
    const { code } = req.params;
    const subject = await Subject.findOne({ code: code.toUpperCase() })
      .populate('assignedFaculty', 'name email facultyProfile')
      .lean();

    if (!subject) {
      throw new AppError(`Subject with code '${code}' not found`, 404, 'SUBJECT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: subject,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/academic/subjects/:code/topics/:topicId/toggle
 * Check off a syllabus topic taught
 */
export async function toggleTopicProgress(req, res, next) {
  try {
    const { code, topicId } = req.params;
    const { isCompleted } = req.body;
    const user = req.user;

    const subject = await Subject.findOne({ code: code.toUpperCase() });
    if (!subject) {
      throw new AppError(`Subject '${code}' not found`, 404, 'SUBJECT_NOT_FOUND');
    }

    let targetTopic = null;
    let targetUnit = null;

    for (const unit of subject.syllabusUnits) {
      const found = unit.topics.find(t => t.topicId === topicId);
      if (found) {
        targetTopic = found;
        targetUnit = unit;
        break;
      }
    }

    if (!targetTopic) {
      throw new AppError(`Topic '${topicId}' not found in subject '${code}'`, 404, 'TOPIC_NOT_FOUND');
    }

    const previousStatus = targetTopic.isCompleted;
    targetTopic.isCompleted = isCompleted ?? !previousStatus;
    targetTopic.completedAt = targetTopic.isCompleted ? new Date() : null;
    targetTopic.completedBy = targetTopic.isCompleted ? user._id : null;

    // Save will trigger the pre-save hook to re-calculate subject.syllabusProgress
    await subject.save();

    // Log in immutable AuditLog if marking as completed
    if (targetTopic.isCompleted) {
      await AuditLog.create({
        userId: user._id,
        userEmail: user.email,
        userRole: req.authRole || user.activeRole,
        action: 'SYLLABUS_TOPIC_COMPLETED',
        entity: 'Subject',
        entityId: subject.code,
        collegeId: subject.collegeId,
        departmentId: subject.departmentCode,
        changes: {
          unitNumber: targetUnit.unitNumber,
          topicId: targetTopic.topicId,
          topicName: targetTopic.name,
          newSubjectProgress: subject.syllabusProgress
        },
        status: 'SUCCESS',
        requestId: req.id
      });
    }

    res.json({
      success: true,
      data: {
        subjectCode: subject.code,
        topicId: targetTopic.topicId,
        isCompleted: targetTopic.isCompleted,
        completedAt: targetTopic.completedAt,
        syllabusProgress: subject.syllabusProgress,
        targetMilestoneProgress: subject.targetMilestoneProgress
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/academic/curriculum-velocity
 * Multi-subject syllabus pace comparative analytics
 */
export async function getCurriculumVelocity(req, res, next) {
  try {
    const subjects = await Subject.find({ departmentCode: req.scope?.departmentId || 'CSE' })
      .populate('assignedFaculty', 'name email')
      .lean();

    const velocityData = subjects.map(sub => {
      const delta = sub.syllabusProgress - sub.targetMilestoneProgress;
      const status = delta >= 0 ? 'Ahead of Schedule' : delta >= -10 ? 'On Track' : 'Behind Milestone';
      return {
        code: sub.code,
        name: sub.name,
        semester: sub.semester,
        type: sub.type,
        facultyName: sub.assignedFaculty?.name || 'Assigned Faculty',
        actualProgress: sub.syllabusProgress,
        targetMilestone: sub.targetMilestoneProgress,
        variancePercentage: delta,
        status,
        unitsCount: sub.syllabusUnits?.length || 5,
        totalTopics: sub.syllabusUnits?.reduce((acc, u) => acc + (u.topics?.length || 0), 0) || 0,
        completedTopics: sub.syllabusUnits?.reduce((acc, u) => acc + (u.topics?.filter(t => t.isCompleted).length || 0), 0) || 0
      };
    });

    res.json({
      success: true,
      data: {
        academicWeek: 12,
        totalSemesterWeeks: 16,
        department: req.scope?.departmentId || 'CSE',
        subjects: velocityData
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/academic/students-cohorts
 * Student Lifecycle cohorts and student roster
 */
export async function getStudentCohorts(req, res, next) {
  try {
    const { classId = 'CS-3A' } = req.query;

    const students = await User.find({
      'roles.role': 'STUDENT',
      'roles.classId': classId
    })
      .select('-passwordHash')
      .sort({ 'studentProfile.rollNo': 1 })
      .lean();

    // Cohort summaries
    const cohorts = [
      { id: 'CS-1A', semester: 1, department: 'CSE', totalStudents: 60, advisor: 'Prof. Vikram Rao', passRate: 98.2 },
      { id: 'CS-2A', semester: 3, department: 'CSE', totalStudents: 60, advisor: 'Dr. Ramesh Kumar', passRate: 96.5 },
      { id: 'CS-3A', semester: 5, department: 'CSE', totalStudents: 60, advisor: 'Prof. Ananya Sen', passRate: 97.4 },
      { id: 'CS-4A', semester: 7, department: 'CSE', totalStudents: 60, advisor: 'Dr. Aris Thorne', passRate: 99.0 }
    ];

    res.json({
      success: true,
      data: {
        activeCohort: classId,
        cohorts,
        students
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
