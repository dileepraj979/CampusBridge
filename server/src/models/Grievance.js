import mongoose from 'mongoose';

const grievanceSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  complainantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  complainantMaskedId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ACADEMIC', 'INFRASTRUCTURE', 'HARASSMENT_POSH', 'HOSTEL_MESS', 'DISCRIMINATION', 'FINANCE'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['STANDARD', 'SENSITIVE', 'URGENT_POSH'],
    default: 'STANDARD'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['FILED', 'UNDER_INVESTIGATION', 'HEARING_SCHEDULED', 'RESOLVED', 'ESCALATED'],
    default: 'FILED',
    index: true
  },
  assignedCommittee: {
    type: String,
    default: 'Campus Ombudsman / Anti-Ragging Committee'
  },
  resolutionNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  escalationDeadline: {
    type: Date,
    required: true
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date,
    default: null
  },
  accessAudit: [{
    accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accessedByName: String,
    accessedByRole: String,
    accessedAt: { type: Date, default: Date.now },
    purpose: String
  }]
}, {
  timestamps: true
});

const Grievance = mongoose.model('Grievance', grievanceSchema);
export default Grievance;
