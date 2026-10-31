import mongoose from 'mongoose';

const contributingFactorSchema = new mongoose.Schema({
  factor: {
    type: String,
    required: true,
    enum: ['ATTENDANCE_DEFICIT', 'MISSED_ASSIGNMENTS', 'BACKLOG_ACCUMULATION', 'CGPA_DROP', 'FEE_OVERDUE']
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'INFORMATIONAL'],
    default: 'WARNING'
  },
  detail: {
    type: String,
    required: true
  },
  metricValue: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  }
}, { _id: false });

const earlyWarningRecordSchema = new mongoose.Schema({
  collegeId: {
    type: String,
    required: true,
    default: 'AIT',
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentRollNo: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  departmentId: {
    type: String,
    required: true,
    index: true
  },
  classId: {
    type: String,
    required: true,
    index: true
  },
  semester: {
    type: Number,
    default: 5
  },
  riskLevel: {
    type: String,
    enum: ['HIGH_RISK', 'MODERATE_RISK', 'WATCHLIST', 'STABLE'],
    default: 'WATCHLIST',
    index: true
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attendancePct: {
    type: Number,
    default: 100
  },
  missedAssignments: {
    type: Number,
    default: 0
  },
  backlogCount: {
    type: Number,
    default: 0
  },
  currentCgpa: {
    type: Number,
    default: 8.0
  },
  contributingFactors: [contributingFactorSchema],
  status: {
    type: String,
    enum: ['ACTIVE', 'IN_COUNSELING', 'RESOLVED', 'MONITORING'],
    default: 'ACTIVE',
    index: true
  },
  advisorAssigned: {
    type: String,
    default: 'Class Advisor'
  },
  lastEvaluatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

earlyWarningRecordSchema.index({ collegeId: 1, departmentId: 1, riskLevel: 1 });
earlyWarningRecordSchema.index({ collegeId: 1, classId: 1 });

const EarlyWarningRecord = mongoose.model('EarlyWarningRecord', earlyWarningRecordSchema);
export default EarlyWarningRecord;
