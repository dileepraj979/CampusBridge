import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceFingerprint: {
    type: String,
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    default: 'Offline Browser Client'
  },
  browser: {
    type: String,
    default: 'Chrome/Edge/Safari'
  },
  os: {
    type: String,
    default: 'Desktop'
  },
  offlineCapabilities: {
    type: Boolean,
    default: true
  },
  isTrusted: {
    type: Boolean,
    default: true
  },
  cachedStores: [{
    storeName: String,
    recordCount: Number,
    lastCachedAt: Date
  }],
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Check if device is active and not revoked
deviceSchema.methods.isActive = function() {
  return !this.revokedAt && this.isTrusted;
};

export const Device = mongoose.model('Device', deviceSchema);
export default Device;
