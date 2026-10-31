import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';
import logger from '../config/logger.js';
import { randomUUID } from 'crypto';

// Seed sample notifications if empty
async function seedDefaultNotificationsIfEmpty() {
  const count = await Notification.countDocuments();
  if (count === 0) {
    const defaultNotifs = [
      {
        collegeId: 'AIT',
        notificationId: 'NTF-2026-SYS-001',
        title: 'End-Semester Theory & Practical Schedule Published',
        message: 'The official Autonomous Examination Schedule for Semester 3, 5, and 7 has been approved by the COE. Hall tickets available for download.',
        category: 'EXAMINATIONS',
        priority: 'HIGH',
        targetRoles: ['STUDENT', 'FACULTY', 'HOD'],
        targetDepartment: 'ALL',
        senderName: 'Controller of Examinations',
        senderRole: 'EXAM_CONTROLLER'
      },
      {
        collegeId: 'AIT',
        notificationId: 'NTF-2026-SYS-002',
        title: 'Tuition Fee Installment 2 Deadline Approaching',
        message: 'Final date for second installment tuition payment without surcharge is November 10, 2026. Use simulated Razorpay portal for instant receipts.',
        category: 'FEES',
        priority: 'NORMAL',
        targetRoles: ['STUDENT', 'PARENT', 'ACCOUNTANT'],
        targetDepartment: 'ALL',
        senderName: 'Bursar & Accounts Office',
        senderRole: 'ACCOUNTANT'
      },
      {
        collegeId: 'AIT',
        notificationId: 'NTF-2026-SYS-003',
        title: 'Academic Early-Warning Advisory Notice',
        message: 'Faculty Class Advisors have generated the mid-semester attendance deficit reports. Please schedule counseling reviews with students < 75%.',
        category: 'ACADEMIC',
        priority: 'HIGH',
        targetRoles: ['FACULTY', 'CLASS_ADVISOR', 'HOD', 'COUNSELOR'],
        targetDepartment: 'CSE',
        senderName: 'Dean of Academic Affairs',
        senderRole: 'PRINCIPAL'
      }
    ];
    await Notification.insertMany(defaultNotifs);
    logger.info('Default institutional notifications seeded successfully');
  }
}

/**
 * GET /api/notifications
 * Retrieves notifications tailored to user role, department, and broadcast status
 */
export async function getNotifications(req, res) {
  try {
    await seedDefaultNotificationsIfEmpty();

    const user = req.user;
    const role = req.role || user.activeRole;
    const departmentId = user.departmentId || 'CSE';
    const { category, priority } = req.query;

    const filter = {
      collegeId: 'AIT',
      $or: [
        { isBroadcast: true },
        { targetRoles: { $in: [role, 'ALL'] } },
        { targetRoles: { $size: 0 } },
        { targetUserIds: user._id }
      ],
      $and: [
        {
          $or: [
            { targetDepartment: 'ALL' },
            { targetDepartment: departmentId }
          ]
        }
      ]
    };

    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    const notifications = await Notification.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(50);

    const formatted = notifications.map(n => {
      const isRead = n.readBy.some(r => r.userId?.toString() === user._id?.toString());
      return {
        _id: n._id,
        notificationId: n.notificationId,
        title: n.title,
        message: n.message,
        category: n.category,
        priority: n.priority,
        isBroadcast: n.isBroadcast,
        senderName: n.senderName,
        senderRole: n.senderRole,
        actionLink: n.actionLink,
        createdAt: n.createdAt,
        isRead
      };
    });

    // Extract active emergency broadcasts for the alert banner
    const activeBroadcasts = formatted.filter(n => n.isBroadcast && n.priority === 'CRITICAL');

    return res.json({
      success: true,
      count: formatted.length,
      unreadCount: formatted.filter(n => !n.isRead).length,
      activeBroadcasts,
      notifications: formatted,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_FETCH_FAILED', message: error.message },
      requestId: req.id
    });
  }
}

/**
 * POST /api/notifications/:id/read
 * Marks a notification as read
 */
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
        requestId: req.id
      });
    }

    const alreadyRead = notif.readBy.some(r => r.userId?.toString() === user._id?.toString());
    if (!alreadyRead) {
      notif.readBy.push({
        userId: user._id,
        readAt: new Date()
      });
      await notif.save();
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
      requestId: req.id
    });
  } catch (error) {
    logger.error('Failed to mark notification read:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'MARK_READ_FAILED', message: error.message },
      requestId: req.id
    });
  }
}

/**
 * POST /api/notifications/broadcast
 * Dispatches a campus-wide high-priority emergency broadcast
 */
export async function broadcastEmergency(req, res) {
  try {
    const user = req.user;
    const role = req.role || user.activeRole;
    const { title, message, category = 'EMERGENCY', priority = 'CRITICAL', expiresHours = 24 } = req.body;

    // Restricted to Institutional Leadership
    const allowedRoles = ['PRINCIPAL', 'SUPER_ADMIN', 'COLLEGE_ADMIN'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_BROADCAST',
          message: 'Campus-wide emergency broadcasts are strictly restricted to the Principal and Institutional Admin.'
        },
        requestId: req.id
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAYLOAD', message: 'Title and message are required' },
        requestId: req.id
      });
    }

    const expiresAt = new Date(Date.now() + (parseInt(expiresHours, 10) || 24) * 60 * 60 * 1000);

    const broadcast = new Notification({
      collegeId: 'AIT',
      notificationId: `EMG-${Date.now().toString().slice(-6)}`,
      title,
      message,
      category,
      priority,
      targetRoles: [], // all roles
      targetDepartment: 'ALL',
      isBroadcast: true,
      broadcastExpiresAt: expiresAt,
      senderName: user.name || 'Office of the Principal',
      senderRole: role
    });

    await broadcast.save();

    logger.warn(`Campus emergency broadcast triggered by ${user.email}: "${title}"`);

    return res.status(201).json({
      success: true,
      message: 'Emergency broadcast dispatched across campus devices',
      data: broadcast,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Failed to dispatch emergency broadcast:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'BROADCAST_FAILED', message: error.message },
      requestId: req.id
    });
  }
}

/**
 * POST /api/notifications/push-subscribe
 * Registers a Web Push API subscription
 */
export async function subscribeWebPush(req, res) {
  try {
    const user = req.user;
    const { endpoint, keys, deviceFingerprint, userAgent } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SUBSCRIPTION', message: 'Valid endpoint and crypto keys are required' },
        requestId: req.id
      });
    }

    // Upsert the subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        collegeId: 'AIT',
        userId: user._id,
        endpoint,
        keys,
        deviceFingerprint: deviceFingerprint || 'browser_client',
        userAgent: userAgent || 'Client Browser',
        isActive: true
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Web Push subscription registered successfully',
      requestId: req.id
    });
  } catch (error) {
    logger.error('Web Push subscription failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'PUSH_SUBSCRIBE_FAILED', message: error.message },
      requestId: req.id
    });
  }
}
