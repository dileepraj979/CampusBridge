import express from 'express';
import { listUsers, assignRolesToUser } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// View directory - any authenticated user with scoped access
router.get('/', listUsers);

// Multi-role assignment - College Admin or Super Admin only
router.post(
  '/:userId/roles',
  requireRoles('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  auditAction('ROLE_ASSIGNMENT_UPDATE', 'UserRole'),
  assignRolesToUser
);

export default router;
