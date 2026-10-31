import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entity: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    default: null
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  departmentId: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  userAgent: {
    type: String,
    default: ''
  },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    auditReason: { type: String, default: null }
  },
  auditReason: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS'
  },
  requestId: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  }
}, {
  timestamps: false // we use immutable timestamp
});

// Enforce immutability - prevent update/delete of audit logs
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace'], function(next) {
  next(new Error('AuditLog documents are immutable and cannot be modified.'));
});

auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function(next) {
  next(new Error('AuditLog documents are immutable and cannot be deleted.'));
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
