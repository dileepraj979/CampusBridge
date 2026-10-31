import mongoose from 'mongoose';

const studyMaterialItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  unitNumber: { type: Number, required: true },
  type: {
    type: String,
    enum: ['PDF', 'SLIDES', 'CODE', 'VIDEO_LINK'],
    default: 'PDF'
  },
  fileUrl: { type: String, required: true },
  fileSizeBytes: { type: Number, default: 4194304 }, // e.g. 4MB
  isEssential: { type: Boolean, default: true }
}, { _id: true });

const practiceQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  unitNumber: { type: Number, default: 1 },
  type: {
    type: String,
    enum: ['MCQ', 'DESCRIPTIVE'],
    default: 'MCQ'
  },
  options: [String],
  answer: { type: String, required: true },
  explanation: { type: String, default: '' }
}, { _id: true });

const qnaPostSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    default: () => `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  },
  askedBy: { type: String, required: true },
  askedByEmail: { type: String, required: true },
  question: { type: String, required: true },
  askedAt: { type: Date, default: Date.now },
  answers: [{
    answeredBy: String,
    role: String,
    answer: String,
    answeredAt: { type: Date, default: Date.now },
    helpfulCount: { type: Number, default: 0 }
  }]
}, { _id: false });

const studyPackSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  subjectName: {
    type: String,
    required: true
  },
  departmentCode: {
    type: String,
    required: true,
    default: 'CSE',
    index: true
  },
  semester: {
    type: Number,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: 'v2.4'
  },
  totalBundleSizeBytes: {
    type: Number,
    default: 26214400 // ~25 MB
  },
  expirationDays: {
    type: Number,
    default: 14 // 14 days valid offline before checking for freshness
  },
  materials: [studyMaterialItemSchema],
  practiceQuestions: [practiceQuestionSchema],
  qnaForum: [qnaPostSchema]
}, {
  timestamps: true
});

export const StudyPack = mongoose.model('StudyPack', studyPackSchema);
export default StudyPack;
