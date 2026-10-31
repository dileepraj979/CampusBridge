import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
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
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vision: {
    type: String,
    default: 'To achieve global excellence in engineering education, cutting-edge research, and industry innovation.'
  },
  establishedYear: {
    type: Number,
    default: 2002
  },
  intakeCapacity: {
    type: Number,
    default: 180
  },
  labCount: {
    type: Number,
    default: 8
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

export const Department = mongoose.model('Department', departmentSchema);
export default Department;
