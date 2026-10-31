import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import StudyPack from '../models/StudyPack.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * GET /api/assignments
 * List assignments for class or subject
 */
export async function getAssignments(req, res, next) {
  try {
    const { classId = 'CS-3A', subjectCode } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (subjectCode) filter.subjectCode = subjectCode;

    let assignments = await Assignment.find(filter).sort({ dueDate: 1 }).lean();

    // Seed realistic assignments if empty
    if (assignments.length === 0 && classId === 'CS-3A') {
      const sample = [
        {
          recordId: 'asg_algo_dp_01',
          classId: 'CS-3A',
          subjectCode: 'CS301',
          title: 'Assignment 3: Dynamic Programming on Trees',
          description: 'Implement Floyd-Warshall and Tree Knapsack algorithms in C++20 with benchmarks and complexity analysis.',
          dueDate: new Date(Date.now() + 5 * 86400000), // In 5 days
          maxMarks: 25,
          status: 'Published',
          allowLateSubmissions: true,
          latePenaltyPercentPerDay: 5,
          rubric: [
            { criterionName: 'Algorithmic Correctness', maxPoints: 10, description: 'Correct execution on all hidden benchmark tests' },
            { criterionName: 'Code Optimization & Modern C++', maxPoints: 8, description: 'Effective usage of standard containers and memoization' },
            { criterionName: 'Complexity Proofs & Writeup', maxPoints: 7, description: 'Formal Big-O proofs and recurrence relations' }
          ],
          attachments: [
            { fileName: 'DP_Tree_Problem_Specification.pdf', fileUrl: '/materials/dp_spec.pdf', fileSizeBytes: 1048576 }
          ]
        },
        {
          recordId: 'asg_os_ipc_02',
          classId: 'CS-3A',
          subjectCode: 'CS302',
          title: 'Assignment 2: POSIX Shared Memory IPC',
          description: 'Build a zero-copy circular ring buffer between producer and consumer processes with mutex semaphores.',
          dueDate: new Date(Date.now() + 10 * 86400000),
          maxMarks: 20,
          status: 'Published',
          allowLateSubmissions: true,
          latePenaltyPercentPerDay: 5,
          rubric: [
            { criterionName: 'Ring Buffer Architecture', maxPoints: 10, description: 'Deadlock-free concurrent memory layout' },
            { criterionName: 'POSIX Semaphore Handling', maxPoints: 6, description: 'Clean teardown on SIGINT' },
            { criterionName: 'Benchmark Report', maxPoints: 4, description: 'Throughput comparisons vs named pipes' }
          ]
        }
      ];

      await Assignment.insertMany(sample);
      assignments = await Assignment.find(filter).sort({ dueDate: 1 }).lean();
    }

    res.json({
      success: true,
      data: assignments,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/assignments/:id
 * Get single assignment with rubric
 */
export async function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { recordId: id }]
    }).lean();

    if (!assignment) {
      throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: assignment,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/assignments
 * Faculty create assignment with rubric
 */
export async function createAssignment(req, res, next) {
  try {
    const {
      classId,
      subjectCode,
      title,
      description,
      dueDate,
      maxMarks = 20,
      rubric = [],
      attachments = []
    } = req.body;

    if (!classId || !subjectCode || !title || !dueDate) {
      throw new AppError('classId, subjectCode, title, and dueDate are required', 400, 'MISSING_FIELDS');
    }

    const recordId = `asg_${subjectCode.toLowerCase()}_${Date.now()}`;

    const assignment = new Assignment({
      recordId,
      classId,
      subjectCode,
      title,
      description,
      dueDate: new Date(dueDate),
      maxMarks,
      rubric,
      attachments,
      createdBy: req.user._id,
      collegeId: req.scope?.collegeId || null,
      status: 'Published'
    });

    await assignment.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'ASSIGNMENT_PUBLISHED',
      entity: 'Assignment',
      entityId: assignment.recordId,
      changes: { classId, subjectCode, title, maxMarks },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      data: assignment,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/assignments/:id/submissions
 * Faculty view all student submissions for an assignment
 */
export async function getSubmissions(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { recordId: id }]
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    let submissions = await AssignmentSubmission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name email studentProfile')
      .sort({ rollNo: 1 })
      .lean();

    // If zero submissions, seed realistic student submissions for class CS-3A
    if (submissions.length === 0) {
      const students = await User.find({
        'roles.role': 'STUDENT',
        'roles.classId': assignment.classId
      }).select('name email studentProfile').lean();

      if (students.length > 0) {
        const seedSubs = students.map((st, idx) => ({
          recordId: `sub_${assignment.recordId}_${st.studentProfile?.rollNo || idx}`,
          assignmentId: assignment._id,
          studentId: st._id,
          rollNo: st.studentProfile?.rollNo || `22CS08${idx + 1}`,
          studentName: st.name,
          classId: assignment.classId,
          subjectCode: assignment.subjectCode,
          status: idx === 0 ? 'Submitted' : idx === 1 ? 'Under Review' : idx === 2 ? 'Late' : 'Draft',
          submittedAt: new Date(Date.now() - (idx * 3600000)),
          isLate: idx === 2,
          submissionFiles: [
            { fileName: `${st.studentProfile?.rollNo || '22CS081'}_Solution_Code.cpp`, fileSizeBytes: 14200, mimeType: 'text/x-c++src' },
            { fileName: `${st.studentProfile?.rollNo || '22CS081'}_Report.pdf`, fileSizeBytes: 524288, mimeType: 'application/pdf' }
          ],
          submissionText: 'Implemented dynamic programming algorithm on trees with O(N) space complexity.',
          maxScore: assignment.maxMarks,
          totalScore: idx === 1 ? 23 : null,
          rubricScores: idx === 1 ? [
            { criterionName: 'Algorithmic Correctness', pointsAwarded: 9, maxPoints: 10, feedback: 'Passed all hidden test cases' },
            { criterionName: 'Code Optimization & Modern C++', pointsAwarded: 8, maxPoints: 8, feedback: 'Excellent memory allocation' },
            { criterionName: 'Complexity Proofs & Writeup', pointsAwarded: 6, maxPoints: 7, feedback: 'Recurrence relation well structured' }
          ] : []
        }));

        await AssignmentSubmission.insertMany(seedSubs);
        submissions = await AssignmentSubmission.find({ assignmentId: assignment._id }).lean();
      }
    }

    res.json({
      success: true,
      data: {
        assignment,
        submissions
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/assignments/:id/submit
 * Student submit assignment (supports offline client timestamp and exception request)
 */
export async function submitAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const {
      submissionFiles = [],
      submissionText = '',
      clientTimestamp,
      offlineExceptionReason = ''
    } = req.body;

    const studentUser = req.user;
    const assignment = await Assignment.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { recordId: id }]
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    const officialServerTimestamp = new Date();
    const isLate = officialServerTimestamp > assignment.dueDate;

    let submission = await AssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: studentUser._id
    });

    const recordId = submission?.recordId || `sub_${assignment.recordId}_${studentUser.studentProfile?.rollNo || studentUser._id}`;

    if (!submission) {
      submission = new AssignmentSubmission({
        recordId,
        assignmentId: assignment._id,
        studentId: studentUser._id,
        rollNo: studentUser.studentProfile?.rollNo || studentUser.studentProfile?.usn || '22CS082',
        studentName: studentUser.name,
        classId: assignment.classId,
        subjectCode: assignment.subjectCode,
        status: isLate ? 'Late' : 'Submitted',
        submittedAt: officialServerTimestamp,
        clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : officialServerTimestamp,
        isLate,
        submissionFiles,
        submissionText,
        maxScore: assignment.maxMarks
      });
    } else {
      submission.submissionFiles = submissionFiles.length > 0 ? submissionFiles : submission.submissionFiles;
      submission.submissionText = submissionText || submission.submissionText;
      submission.submittedAt = officialServerTimestamp;
      submission.isLate = isLate;
      submission.status = isLate ? 'Late' : 'Resubmitted';
      submission.version += 1;
    }

    // Handle offline exception request if provided
    const exceptionReason = offlineExceptionReason || (req.body.offlineException && req.body.offlineException.reason);
    if (exceptionReason) {
      submission.offlineException = {
        requested: true,
        reason: exceptionReason,
        status: 'PENDING',
        reviewedBy: null,
        reviewRemarks: ''
      };
    }

    await submission.save();

    await AuditLog.create({
      userId: studentUser._id,
      userEmail: studentUser.email,
      userRole: 'STUDENT',
      action: isLate ? 'ASSIGNMENT_SUBMITTED_LATE' : 'ASSIGNMENT_SUBMITTED',
      entity: 'AssignmentSubmission',
      entityId: submission.recordId,
      changes: { isLate, officialReceipt: officialServerTimestamp, clientTimestamp },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: isLate
        ? 'Assignment received past official deadline. Timestamp logged.'
        : 'Assignment submitted successfully. Official server receipt generated.',
      data: submission,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/assignments/:id/submissions/:subId/grade
 * Faculty inline grading with rubric scoring & AI draft feedback
 */
export async function gradeSubmission(req, res, next) {
  try {
    const { subId } = req.params;
    const { rubricScores = [], facultyFeedback = '', generateAiDraft = false, releaseFeedback = false } = req.body;
    const facultyUser = req.user;

    const submission = await AssignmentSubmission.findById(subId);
    if (!submission) {
      throw new AppError('Submission not found', 404, 'SUBMISSION_NOT_FOUND');
    }

    // Compute total score from rubric
    let totalScore = 0;
    rubricScores.forEach(r => {
      totalScore += (r.pointsAwarded || 0);
    });

    submission.rubricScores = rubricScores;
    submission.totalScore = totalScore;
    submission.facultyFeedback = facultyFeedback;

    // AI feedback generator
    const percentage = Math.round((totalScore / (submission.maxScore || 50)) * 100);
    let draftText = '';
    if (percentage >= 85) {
      draftText = `Exceptional mastery demonstrated in ${submission.subjectCode}. The solution exhibits optimal asymptotic time complexity, clean modular design, and thorough edge-case validation. For further challenge, consider benching with larger tree topologies.`;
    } else if (percentage >= 70) {
      draftText = `Solid implementation with strong foundational algorithmic logic. Ensure deeper verification of boundary conditions (e.g. empty inputs, single-node trees). Code structure is clean, but additional inline documentation is recommended.`;
    } else {
      draftText = `Commendable effort on the core problem statement. However, there are significant performance bottlenecks in the recurrence evaluation leading to redundant recomputations. Review the memoization lecture notes in Unit 2 and re-test with hidden inputs.`;
    }
    submission.aiDraftFeedback = draftText;
    if (!facultyFeedback) {
      submission.facultyFeedback = draftText;
    }

    submission.status = releaseFeedback ? 'Feedback Released' : 'Graded';
    submission.version += 1;
    await submission.save();

    res.json({
      success: true,
      message: releaseFeedback ? 'Grades and feedback officially released to student.' : 'Grades saved as draft.',
      data: submission,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/lms/studypacks/:subjectCode
 * Subject Learning Hub & Q&A
 */
export async function getStudyPack(req, res, next) {
  try {
    const { subjectCode } = req.params;
    let pack = await StudyPack.findOne({ subjectCode: subjectCode.toUpperCase() }).lean();

    if (!pack) {
      // Seed rich study pack
      pack = await StudyPack.create({
        subjectCode: subjectCode.toUpperCase(),
        subjectName: subjectCode.toUpperCase() === 'CS301' ? 'Design & Analysis of Algorithms' : 'Operating Systems & Kernels',
        departmentCode: 'CSE',
        semester: 5,
        title: `${subjectCode.toUpperCase()} Comprehensive Autonomous Course Pack`,
        version: 'v2.4',
        totalBundleSizeBytes: 28311552, // 27 MB
        expirationDays: 14,
        materials: [
          { title: 'Unit 1: Divide & Conquer and Master Theorem.pdf', unitNumber: 1, type: 'PDF', fileUrl: '/materials/cs301_u1.pdf', fileSizeBytes: 5242880 },
          { title: 'Unit 2: Dynamic Programming & Matrix Chain Multiplication.pdf', unitNumber: 2, type: 'PDF', fileUrl: '/materials/cs301_u2.pdf', fileSizeBytes: 6291456 },
          { title: 'Unit 3: Greedy Methods & Huffman Coding Lecture Slides.pdf', unitNumber: 3, type: 'SLIDES', fileUrl: '/materials/cs301_u3.pdf', fileSizeBytes: 4194304 },
          { title: 'Graph Algorithms Interactive Benchmark Suite (C++20)', unitNumber: 4, type: 'CODE', fileUrl: '/materials/cs301_code.zip', fileSizeBytes: 2097152 }
        ],
        practiceQuestions: [
          {
            question: 'What is the tight asymptotic time complexity of Floyd-Warshall all-pairs shortest paths?',
            unitNumber: 2,
            type: 'MCQ',
            options: ['O(V^2)', 'O(V^3)', 'O(V * E)', 'O(E log V)'],
            answer: 'O(V^3)',
            explanation: 'Floyd-Warshall checks all triple vertex paths via dynamic programming in Theta(V^3) time.'
          },
          {
            question: 'Under what condition does the Master Theorem Case 1 apply to T(n) = aT(n/b) + f(n)?',
            unitNumber: 1,
            type: 'MCQ',
            options: ['f(n) = O(n^(log_b(a) - epsilon))', 'f(n) = Theta(n^(log_b(a)))', 'f(n) = Omega(n^(log_b(a) + epsilon))', 'None of the above'],
            answer: 'f(n) = O(n^(log_b(a) - epsilon))',
            explanation: 'When f(n) is polynomially smaller than n^(log_b(a)), Case 1 states T(n) = Theta(n^(log_b(a))).'
          }
        ],
        qnaForum: [
          {
            questionId: 'q_01',
            askedBy: 'Bhavin Patel',
            askedByEmail: 'bhavin.patel@ait.edu',
            question: 'In Unit 2 Knapsack 0/1, why is the recursive state space O(n * W) pseudo-polynomial instead of strictly polynomial?',
            askedAt: new Date(Date.now() - 48 * 3600000),
            answers: [
              {
                answeredBy: 'Prof. Ananya Sen',
                role: 'FACULTY',
                answer: 'Because W (the weight capacity) takes O(log W) bits to represent. The runtime is polynomial in the magnitude of W, but exponential in the input length (bit count).',
                helpfulCount: 8
              }
            ]
          }
        ]
      });
    }

    res.json({
      success: true,
      data: pack,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/lms/studypacks/:subjectCode/bundle
 * 1-Click Offline Study Pack Downloader: bundles syllabus, notes, timetable, assignments & quizzes
 */
export async function downloadStudyPackBundle(req, res, next) {
  try {
    const { subjectCode } = req.params;
    const pack = await StudyPack.findOne({ subjectCode: subjectCode.toUpperCase() }).lean();

    if (!pack) {
      throw new AppError('Study pack not found', 404, 'STUDY_PACK_NOT_FOUND');
    }

    const assignments = await Assignment.find({ subjectCode: subjectCode.toUpperCase() }).lean();

    // Construct single offline package payload
    const offlineBundle = {
      bundleId: `bundle_${pack.subjectCode.toLowerCase()}_${Date.now()}`,
      subjectCode: pack.subjectCode,
      subjectName: pack.subjectName,
      version: pack.version,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + pack.expirationDays * 86400000).toISOString(),
      bundleSizeBytes: pack.totalBundleSizeBytes,
      syllabusUnits: [
        { unit: 1, title: 'Foundations of Algorithm Analysis & Divide/Conquer' },
        { unit: 2, title: 'Dynamic Programming & Memoization Strategies' },
        { unit: 3, title: 'Greedy Techniques & Minimum Spanning Trees' },
        { unit: 4, title: 'Graph Traversal & Shortest Path Algorithms' },
        { unit: 5, title: 'NP-Completeness & Approximation Algorithms' }
      ],
      materials: pack.materials,
      assignments,
      practiceQuizzes: pack.practiceQuestions,
      qnaCache: pack.qnaForum
    };

    res.json({
      success: true,
      message: `Offline bundle generated for ${pack.subjectCode}. Cached for ${pack.expirationDays} days offline access.`,
      data: offlineBundle,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
