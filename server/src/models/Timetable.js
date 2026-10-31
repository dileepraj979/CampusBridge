import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  periodNumber: { type: Number, required: true }, // 1 to 6
  startTime: { type: String, required: true }, // '09:30 AM'
  endTime: { type: String, required: true }, // '10:30 AM'
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  facultyName: { type: String, required: true },
  room: { type: String, required: true }, // 'LH-302', 'Lab 4'
  type: { type: String, enum: ['theory', 'lab', 'tutorial'], default: 'theory' }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  classId: {
    type: String,
    required: true,
    index: true
  },
  departmentCode: {
    type: String,
    default: 'CSE',
    index: true
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
  slots: [timetableSlotSchema],
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
