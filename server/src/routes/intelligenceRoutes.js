import express from 'express';
import {
  getEarlyWarningDashboard,
  getCounselingNotes,
  createCounselingNote,
  updateCounselingNoteStatus
} from '../controllers/intelligenceController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Early-Warning Dashboard & Student Risk Evaluation
router.get('/early-warning', getEarlyWarningDashboard);

// Confidential Counseling & Mentoring Notes
router.get('/counseling-notes', getCounselingNotes);
router.post('/counseling-notes', createCounselingNote);
router.patch('/counseling-notes/:id/status', updateCounselingNoteStatus);

export default router;
