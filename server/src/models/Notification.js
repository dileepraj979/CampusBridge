import mongoose from 'mongoose';

const readReceiptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  collegeId: {
    type: String,
    required: true,
    default: 'AIT',
    index: true
  },
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['ACADEMIC', 'OPERATIONS', 'FEES', 'SERVICES', 'EXAMINATIONS', 'EMERGENCY', 'SYSTEM'],
    default: 'ACADEMIC',
    index: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
    default: 'NORMAL',
    index: true
  },
  targetRoles: [{
    type: String
  }],
  targetDepartment: {
    type: String,
    default: 'ALL'
  },
  targetClassId: {
    type: String
  },
  targetUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isBroadcast: {
    type: Boolean,
    default: false,
    index: true
  },
  broadcastExpiresAt: {
    type: Date
  },
  actionLink: {
    type: String
  },
  senderName: {
    type: String,
    default: 'CampusBridge System'
  },
  senderRole: {
    type: String,
    default: 'COLLEGE_ADMIN'
  },
  readBy: [readReceiptSchema],
  webPushDeliveredCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

notificationSchema.index({ collegeId: 1, priority: 1, isBroadcast: 1 });
notificationSchema.index({ collegeId: 1, targetDepartment: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
