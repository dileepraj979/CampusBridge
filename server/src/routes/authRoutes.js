import express from 'express';
import {
  login,
  refresh,
  switchRole,
  revokeAllSessions,
  getMe,
  logout,
  getDemoAccounts
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', auditAction('USER_LOGIN', 'Auth'), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/demo-accounts', getDemoAccounts);

// Protected endpoints
router.get('/me', authMiddleware, getMe);
router.post('/switch-role', authMiddleware, auditAction('ROLE_SWITCH', 'UserRole'), switchRole);
router.post('/revoke-sessions/:userId?', authMiddleware, auditAction('REVOKE_ALL_SESSIONS', 'UserSession'), revokeAllSessions);

export default router;
