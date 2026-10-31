import mongoose from 'mongoose';

const deskAllocationSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  date: { type: String, required: true },
  session: { type: String, default: 'FORENOON' },
  time: { type: String, default: '09:30 AM - 12:30 PM' },
  room: { type: String, required: true },
  deskNumber: { type: String, required: true }
}, { _id: false });

const hallTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
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
    required: true,
    index: true
  },
  semester: {
    type: Number,
    required: true
  },
  departmentCode: {
    type: String,
    required: true,
    default: 'CSE'
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  examTitle: {
    type: String,
    default: 'Autumn Midterm Examinations 2026'
  },
  attendancePercentage: {
    type: Number,
    required: true
  },
  eligibilityStatus: {
    type: String,
    enum: ['ELIGIBLE', 'CONDONED', 'DETAINED'],
    default: 'ELIGIBLE',
    index: true
  },
  condonationReason: {
    type: String,
    default: ''
  },
  qrVerificationHash: {
    type: String,
    required: true
  },
  deskAllocations: [deskAllocationSchema],
  isDownloaded: {
    type: Boolean,
    default: false
  },
  downloadedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

hallTicketSchema.index({ rollNo: 1, examTitle: 1 }, { unique: true });

export const HallTicket = mongoose.model('HallTicket', hallTicketSchema);
export default HallTicket;
