import mongoose from 'mongoose';

const syncOperationSchema = new mongoose.Schema({
  operationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceFingerprint: {
    type: String,
    default: ''
  },
  entityType: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true
  },
  operationType: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'conflict', 'failed', 'rejected'],
    default: 'applied',
    index: true
  },
  clientBaseVersion: {
    type: Number,
    default: 1
  },
  serverVersion: {
    type: Number,
    default: 1
  },
  receipt: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  conflictData: {
    clientPayload: mongoose.Schema.Types.Mixed,
    serverCurrentState: mongoose.Schema.Types.Mixed,
    baseState: mongoose.Schema.Types.Mixed,
    fieldDiffs: [
      {
        field: String,
        clientValue: mongoose.Schema.Types.Mixed,
        serverValue: mongoose.Schema.Types.Mixed,
        baseValue: mongoose.Schema.Types.Mixed
      }
    ]
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolutionStrategy: {
    type: String,
    enum: ['accept_server', 'force_override', 'manual_merge', null],
    default: null
  },
  auditReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const SyncOperation = mongoose.model('SyncOperation', syncOperationSchema);
export default SyncOperation;
