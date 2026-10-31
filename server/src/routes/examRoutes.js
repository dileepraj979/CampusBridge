import express from 'express';
import {
  getExamSchedules,
  getHallTicket,
  getMarksLedger,
  saveMarksDraft,
  submitMarksToHod,
  publishMarks,
  getTranscript,
  submitRevaluation
} from '../controllers/examController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// Exam Planning & Hall Tickets
router.get('/schedules', getExamSchedules);
router.get('/hallticket/:rollNo', getHallTicket);

// Marks Management & Separation of Duties
router.get('/marks/:classId/:subjectCode', getMarksLedger);
router.post('/marks/:classId/:subjectCode/draft', auditAction('MARKS_DRAFT_SAVE', 'MarksLedger'), saveMarksDraft);
router.post('/marks/:classId/:subjectCode/submit-hod', auditAction('MARKS_HOD_SUBMIT', 'MarksLedger'), submitMarksToHod);
router.post('/marks/:classId/:subjectCode/publish', auditAction('MARKS_PUBLISH', 'MarksLedger'), publishMarks);

// Results & Revaluations
router.get('/transcript/:rollNo', getTranscript);
router.post('/revaluation', auditAction('REVALUATION_SUBMIT', 'MarksLedger'), submitRevaluation);

export default router;
