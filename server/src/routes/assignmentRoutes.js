import express from 'express';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
  getStudyPack,
  downloadStudyPackBundle
} from '../controllers/assignmentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// Assignment Lifecycle
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/', auditAction('ASSIGNMENT_CREATE', 'Assignment'), createAssignment);
router.get('/:id/submissions', getSubmissions);
router.post('/:id/submit', auditAction('ASSIGNMENT_SUBMIT', 'AssignmentSubmission'), submitAssignment);
router.post('/:id/submissions/:subId/grade', auditAction('ASSIGNMENT_GRADE', 'AssignmentSubmission'), gradeSubmission);
router.post('/:id/grade/:subId', auditAction('ASSIGNMENT_GRADE', 'AssignmentSubmission'), gradeSubmission);

// LMS & Offline Study Pack Bundler
router.get('/studypack/:subjectCode', getStudyPack);
router.get('/studypacks/:subjectCode', getStudyPack);
router.get('/studypack/:subjectCode/bundle', downloadStudyPackBundle);
router.get('/studypacks/:subjectCode/bundle', downloadStudyPackBundle);

export default router;
