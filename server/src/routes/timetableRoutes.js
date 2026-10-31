import express from 'express';
import {
  getClassTimetable,
  getFacultyTimetable,
  saveTimetableSlot
} from '../controllers/timetableController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/class/:classId?', getClassTimetable);
router.get('/faculty/:facultyId', getFacultyTimetable);
router.post('/slot', auditAction('TIMETABLE_SLOT_UPDATE', 'Timetable'), saveTimetableSlot);

export default router;
