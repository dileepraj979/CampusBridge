import mongoose from 'mongoose';

const examSlotSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    index: true
  },
  subjectName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true // YYYY-MM-DD
  },
  session: {
    type: String,
    enum: ['FORENOON', 'AFTERNOON'],
    default: 'FORENOON'
  },
  startTime: {
    type: String,
    default: '09:30 AM'
  },
  endTime: {
    type: String,
    default: '12:30 PM'
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  rooms: [{
    roomNumber: String,
    capacity: Number,
    invigilatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invigilatorName: String
  }]
}, { _id: true });

const examScheduleSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false,
    index: true
  },
  examTitle: {
    type: String,
    required: true,
    default: 'Autumn Midterm Examinations 2026'
  },
  examType: {
    type: String,
    enum: ['MIDTERM', 'END_SEMESTER', 'SUPPLEMENTARY', 'PRACTICAL'],
    default: 'MIDTERM'
  },
  departmentCode: {
    type: String,
    required: true,
    default: 'CSE',
    index: true
  },
  degree: {
    type: String,
    default: 'B.Tech'
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
  regulation: {
    type: String,
    default: 'R22/Autonomous'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'COMPLETED'],
    default: 'PUBLISHED',
    index: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  slots: [examSlotSchema]
}, {
  timestamps: true
});

examScheduleSchema.index({ departmentCode: 1, semester: 1, academicYear: 1 });

export const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema);
export default ExamSchedule;
