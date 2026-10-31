import mongoose from 'mongoose';

const subjectGradeResultSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  credits: { type: Number, required: true, default: 4 },
  internalMarks: { type: Number, default: 0 },
  externalMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  letterGrade: { type: String, required: true }, // 'O', 'A+', 'A', 'B+', 'B', 'C', 'F'
  gradePoint: { type: Number, required: true }, // 10 to 0
  status: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' }
}, { _id: false });

const gradeTranscriptSchema = new mongoose.Schema({
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
  usn: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  classId: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    index: true
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  subjects: [subjectGradeResultSchema],
  totalCreditsRegistered: {
    type: Number,
    default: 20
  },
  totalCreditsEarned: {
    type: Number,
    default: 20
  },
  sgpa: {
    type: Number,
    required: true
  },
  cumulativeCgpa: {
    type: Number,
    required: true
  },
  backlogCount: {
    type: Number,
    default: 0
  },
  hasBacklogs: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

gradeTranscriptSchema.index({ rollNo: 1, semester: 1 }, { unique: true });

export const GradeTranscript = mongoose.model('GradeTranscript', gradeTranscriptSchema);
export default GradeTranscript;
