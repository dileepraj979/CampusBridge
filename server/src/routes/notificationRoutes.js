import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  broadcastEmergency,
  subscribeWebPush
} from '../controllers/notificationController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// In-App Alerts & Multi-Channel Notifications
router.get('/', getNotifications);
router.post('/:id/read', markNotificationRead);

// Web Push API Registration
router.post('/push-subscribe', subscribeWebPush);

// Institutional Emergency Broadcast (Principal / Super Admin only)
router.post('/broadcast', broadcastEmergency);

export default router;
