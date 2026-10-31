import express from 'express';
import { pushSync, pullSync, resolveConflict, getSyncHealth } from './syncController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// Batch push mutations with idempotency and optimistic concurrency
router.post('/push', pushSync);

// Incremental cursor-based pull
router.get('/pull', pullSync);

// Interactive conflict resolution
router.post(
  '/resolve-conflict',
  auditAction('CONFLICT_RESOLUTION', 'SyncOperation'),
  resolveConflict
);

// Campus sync health and telemetry
router.get('/health', getSyncHealth);

export default router;
