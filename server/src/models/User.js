import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BLUEPRINT_ROLES } from './Role.js';
import './College.js';

const userRoleAssignmentSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: BLUEPRINT_ROLES
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  departmentId: {
    type: String,
    default: null
  },
  classId: {
    type: String,
    default: null
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  roles: [userRoleAssignmentSchema],
  activeRole: {
    type: String,
    enum: BLUEPRINT_ROLES,
    default: 'STUDENT'
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'active'
  },
  // Optional role-specific metadata
  studentProfile: {
    rollNo: { type: String, default: '' },
    usn: { type: String, default: '' },
    semester: { type: Number, default: 6 },
    cgpa: { type: Number, default: 8.85 },
    batch: { type: String, default: '2022-2026' },
    attendancePercentage: { type: Number, default: 88.4 }
  },
  facultyProfile: {
    employeeId: { type: String, default: '' },
    designation: { type: String, default: 'Assistant Professor' },
    department: { type: String, default: 'CSE' },
    subjects: [{ type: String }]
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compare password helper
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Revoke all existing sessions
userSchema.methods.revokeAllSessions = function() {
  this.tokenVersion += 1;
  return this.save();
};

export const User = mongoose.model('User', userSchema);
export default User;
