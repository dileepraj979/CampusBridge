import mongoose from 'mongoose';

const rubricScoreSchema = new mongoose.Schema({
  criterionName: { type: String, required: true },
  pointsAwarded: { type: Number, required: true },
  maxPoints: { type: Number, required: true },
  feedback: { type: String, default: '' }
}, { _id: false });

const submissionFileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  fileSizeBytes: { type: Number, default: 0 },
  mimeType: { type: String, default: 'application/pdf' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const offlineExceptionSchema = new mongoose.Schema({
  requested: { type: Boolean, default: false },
  reason: { type: String, default: '' },
  evidenceUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewRemarks: { type: String, default: '' },
  reviewedAt: { type: Date, default: null }
}, { _id: false });

const assignmentSubmissionSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rollNo: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
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
  status: {
    type: String,
    enum: [
      'Draft',
      'Submitted',
      'Under Review',
      'Graded',
      'Feedback Released',
      'Late',
      'Returned for Revision',
      'Resubmitted'
    ],
    default: 'Submitted',
    index: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  clientTimestamp: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false,
    index: true
  },
  submissionFiles: [submissionFileSchema],
  submissionText: {
    type: String,
    default: ''
  },
  rubricScores: [rubricScoreSchema],
  totalScore: {
    type: Number,
    default: null
  },
  maxScore: {
    type: Number,
    default: 20
  },
  facultyFeedback: {
    type: String,
    default: ''
  },
  aiDraftFeedback: {
    type: String,
    default: ''
  },
  offlineException: {
    type: offlineExceptionSchema,
    default: () => ({ requested: false })
  },
  version: {
    type: Number,
    default: 1
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

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
export default AssignmentSubmission;
