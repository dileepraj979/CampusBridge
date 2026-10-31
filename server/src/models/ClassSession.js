import mongoose from 'mongoose';

const classSessionSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false,
    index: true
  },
  departmentCode: {
    type: String,
    required: true,
    default: 'CSE',
    index: true
  },
  classId: {
    type: String,
    required: true,
    index: true
  },
  subjectCode: {
    type: String,
    required: true,
    index: true
  },
  subjectName: {
    type: String,
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  facultyName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  periodNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  startTime: {
    type: String,
    default: '09:30 AM'
  },
  endTime: {
    type: String,
    default: '10:30 AM'
  },
  room: {
    type: String,
    required: true,
    default: 'LH-302'
  },
  sessionType: {
    type: String,
    enum: ['theory', 'lab'],
    default: 'theory'
  },
  topicCovered: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'locked'],
    default: 'scheduled',
    index: true
  },
  isLocked: {
    type: Boolean,
    default: false,
    index: true
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attendanceRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceRecord',
    default: null
  },
  // Rotating time-bound QR Code state
  qrActive: {
    type: Boolean,
    default: false
  },
  qrCodeSecret: {
    type: String,
    default: null
  },
  qrRotationToken: {
    type: String,
    default: null
  },
  qrCodeExpiresAt: {
    type: Date,
    default: null
  },
  qrScansCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

classSessionSchema.index({ classId: 1, date: 1, periodNumber: 1 });
classSessionSchema.index({ facultyId: 1, date: 1 });

export const ClassSession = mongoose.model('ClassSession', classSessionSchema);
export default ClassSession;
