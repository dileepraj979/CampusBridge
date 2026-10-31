import mongoose from 'mongoose';

const approvalStageSchema = new mongoose.Schema({
  stageNumber: { type: Number, required: true },
  stageName: { type: String, required: true },
  approverRole: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'],
    default: 'PENDING'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actionTakenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actionTakenByName: { type: String, default: '' },
  actionDate: { type: Date, default: null },
  remarks: { type: String, default: '' }
}, { _id: false });

const serviceRequestSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  requestType: {
    type: String,
    required: true,
    enum: [
      'STUDENT_LEAVE',
      'FACULTY_LEAVE',
      'ATTENDANCE_CORRECTION',
      'BONAFIDE_CERTIFICATE',
      'TRANSCRIPT_ISSUANCE',
      'HOSTEL_ROOM_CHANGE',
      'TRANSPORT_ROUTE_CHANGE',
      'FEE_CONCESSION'
    ],
    index: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requesterName: { type: String, required: true },
  requesterRole: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  departmentId: { type: String, default: 'CSE' },
  classId: { type: String, default: 'CS-3A' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  slaHours: { type: Number, default: 48 },
  slaDeadline: { type: Date, required: true },
  isSlaBreached: { type: Boolean, default: false },
  stages: [approvalStageSchema],
  currentStageIndex: { type: Number, default: 0 },
  overallStatus: {
    type: String,
    enum: ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'FULFILLED', 'ESCALATED'],
    default: 'SUBMITTED',
    index: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSizeBytes: Number
  }],
  auditHistory: [{
    action: String,
    actorName: String,
    actorRole: String,
    timestamp: { type: Date, default: Date.now },
    comment: String
  }]
}, {
  timestamps: true
});

serviceRequestSchema.index({ overallStatus: 1, departmentId: 1 });
serviceRequestSchema.index({ requesterId: 1, createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest;
