import mongoose from 'mongoose';

const studentAttendanceLineSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  rollNo: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'On Duty', 'Approved Leave'],
    default: 'Present'
  },
  remarks: {
    type: String,
    default: ''
  },
  verificationMethod: {
    type: String,
    enum: ['ROSTER_MANUAL', 'QR_SCAN', 'CORRECTION_OVERRIDE'],
    default: 'ROSTER_MANUAL'
  },
  markedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const correctionRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    default: () => `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByEmail: {
    type: String,
    required: true
  },
  studentRollNo: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    default: ''
  },
  previousStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'On Duty', 'Approved Leave'],
    required: true
  },
  newStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'On Duty', 'Approved Leave'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedByEmail: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewRemarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const anomalyFlagSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true // 'BULK_RETROACTIVE_EDIT' | 'OUT_OF_SCHEDULE_HOURS' | 'CONTRADICTORY_OFFLINE_ONLINE' | 'SUDDEN_ABSENTEE_SPIKE'
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  description: {
    type: String,
    required: true
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: String,
    default: null
  },
  resolutionNote: {
    type: String,
    default: ''
  }
}, { _id: false });

const attendanceRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSession',
    default: null,
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
    default: ''
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  periodNumber: {
    type: Number,
    default: 1
  },
  totalStudents: {
    type: Number,
    default: 60
  },
  presentCount: {
    type: Number,
    required: true,
    default: 0
  },
  absentCount: {
    type: Number,
    required: true,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  onDutyCount: {
    type: Number,
    default: 0
  },
  approvedLeaveCount: {
    type: Number,
    default: 0
  },
  students: [studentAttendanceLineSchema],
  correctionRequests: [correctionRequestSchema],
  anomalyFlags: [anomalyFlagSchema],
  note: {
    type: String,
    default: ''
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  markedByEmail: {
    type: String,
    default: ''
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false
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
  version: {
    type: Number,
    default: 1,
    index: true
  },
  syncStatus: {
    type: String,
    default: 'synced'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

attendanceRecordSchema.index({ classId: 1, date: 1, subjectCode: 1 });
attendanceRecordSchema.index({ 'correctionRequests.status': 1 });
attendanceRecordSchema.index({ 'anomalyFlags.resolved': 1 });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
