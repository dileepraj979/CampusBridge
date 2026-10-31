import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  degree: {
    type: String,
    enum: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'MBA', 'Ph.D'],
    default: 'B.Tech'
  },
  totalSemesters: {
    type: Number,
    default: 8
  },
  creditRequirements: {
    type: Number,
    default: 160
  },
  branchSpecializations: [{
    type: String
  }],
  academicRegulations: {
    type: String,
    default: 'Autonomous CBCS Curriculum 2024-2028 (Outcome Based Education / AICTE Model)'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

export const Course = mongoose.model('Course', courseSchema);
export default Course;
