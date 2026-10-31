import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

// Only Super Admin, College Admin, Principal, and Auditor can read immutable audit logs
router.get(
  '/',
  requireRoles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'AUDITOR'),
  listAuditLogs
);

export default router;
