import mongoose from 'mongoose';

export const BLUEPRINT_ROLES = [
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
  'PRINCIPAL',
  'HOD',
  'FACULTY',
  'CLASS_ADVISOR',
  'STUDENT',
  'PARENT',
  'EXAM_CONTROLLER',
  'LIBRARIAN',
  'ACCOUNTANT',
  'PLACEMENT_OFFICER',
  'PLACEMENT_RECRUITER',
  'HOSTEL_WARDEN',
  'TRANSPORT_MANAGER',
  'COUNSELOR',
  'IT_SUPPORT',
  'AUDITOR'
];

const roleSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    enum: BLUEPRINT_ROLES
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  hierarchyLevel: {
    type: Number,
    required: true
  },
  scopeLevel: {
    type: String,
    enum: ['global', 'college', 'department', 'class', 'personal'],
    default: 'college'
  },
  permissions: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

export const Role = mongoose.model('Role', roleSchema);
export default Role;
