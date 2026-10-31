import express from 'express';
import {
  getSessions,
  getSessionById,
  saveRoster,
  lockSession,
  submitCorrection,
  getCorrections,
  reviewCorrection,
  startQrSession,
  rotateQrSession,
  verifyQrAttendance,
  getAnomalies,
  getAttendanceForecast
} from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// Session Queries & Roster Management
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId', getSessionById);
router.post('/sessions/:sessionId/roster', auditAction('ATTENDANCE_ROSTER_SAVE', 'AttendanceRecord'), saveRoster);
router.post('/sessions/:sessionId/lock', auditAction('ATTENDANCE_SESSION_LOCK', 'ClassSession'), lockSession);

// Multi-step Correction Approval Workflow
router.post('/sessions/:sessionId/corrections', auditAction('ATTENDANCE_CORRECTION_REQUEST', 'AttendanceRecord'), submitCorrection);
router.get('/corrections', getCorrections);
router.post('/corrections/:requestId/review', auditAction('ATTENDANCE_CORRECTION_REVIEW', 'AttendanceRecord'), reviewCorrection);

// Rotating Time-Bound QR Attendance
router.post('/sessions/:sessionId/qr/start', startQrSession);
router.post('/sessions/:sessionId/qr/rotate', rotateQrSession);
router.post('/sessions/:sessionId/qr/verify', auditAction('QR_ATTENDANCE_VERIFY', 'AttendanceRecord'), verifyQrAttendance);

// Analytics, Forecasting & Anomaly Detection
router.get('/anomalies', getAnomalies);
router.get('/forecast/:studentRollNo', getAttendanceForecast);

export default router;
