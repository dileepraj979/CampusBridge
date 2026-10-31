import mongoose from 'mongoose';

const studentMarkEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  internalTest1: { type: Number, default: null }, // Max 30
  internalTest2: { type: Number, default: null }, // Max 30
  continuousEvaluation: { type: Number, default: null }, // Max 20 (Lab/Assignment)
  scaledInternalMarks: { type: Number, default: null }, // Max 40
  externalExamMarks: { type: Number, default: null }, // Max 60
  totalMarks: { type: Number, default: null }, // Max 100
  letterGrade: {
    type: String,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', 'AB', null],
    default: null
  },
  gradePoint: { type: Number, default: null }, // 10 to 0
  status: {
    type: String,
    enum: ['PASS', 'FAIL', 'ABSENT', 'PENDING'],
    default: 'PENDING'
  }
}, { _id: false });

const revaluationRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    default: () => `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  reason: { type: String, required: true },
  feeReceiptRef: { type: String, required: true },
  originalMarks: { type: Number, required: true },
  originalGrade: { type: String, required: true },
  revisedMarks: { type: Number, default: null },
  revisedGrade: { type: String, default: null },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewRemarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const marksLedgerSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false
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
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  evaluationType: {
    type: String,
    enum: ['INTERNAL_CIE', 'SEMESTER_END', 'PRACTICAL_VIVA'],
    default: 'INTERNAL_CIE',
    index: true
  },
  // Multi-step Separation of Duties Approval Workflow
  workflowState: {
    type: String,
    enum: ['FACULTY_DRAFT', 'HOD_VALIDATED', 'CONTROLLER_PUBLISHED'],
    default: 'FACULTY_DRAFT',
    index: true
  },
  facultySubmitted: {
    status: { type: Boolean, default: false },
    submittedAt: Date,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedByName: String
  },
  hodValidation: {
    status: { type: Boolean, default: false },
    validatedAt: Date,
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedByName: String,
    remarks: String
  },
  controllerPublish: {
    status: { type: Boolean, default: false },
    publishedAt: Date,
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedByName: String
  },
  marksEntries: [studentMarkEntrySchema],
  revaluationRequests: [revaluationRequestSchema],
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

marksLedgerSchema.index({ classId: 1, subjectCode: 1, evaluationType: 1 }, { unique: true });

export const MarksLedger = mongoose.model('MarksLedger', marksLedgerSchema);
export default MarksLedger;
