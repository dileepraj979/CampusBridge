import mongoose from 'mongoose';

const facultyAssignmentSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: String,
    required: true,
    index: true
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  semester: {
    type: Number,
    required: true
  },
  weeklyHours: {
    type: Number,
    default: 4
  },
  isClassAdvisor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const FacultyAssignment = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
export default FacultyAssignment;
