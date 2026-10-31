import mongoose from 'mongoose';

const counselingAccessLogSchema = new mongoose.Schema({
  accessedBy: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  purpose: {
    type: String,
    default: 'CONFIDENTIAL_REVIEW'
  }
}, { _id: false });

const counselingNoteSchema = new mongoose.Schema({
  collegeId: {
    type: String,
    required: true,
    default: 'AIT',
    index: true
  },
  studentRollNo: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  departmentId: {
    type: String,
    required: true
  },
  classId: {
    type: String,
    required: true
  },
  counselorEmail: {
    type: String,
    required: true
  },
  counselorName: {
    type: String,
    required: true
  },
  counselorRole: {
    type: String,
    required: true,
    enum: ['COUNSELOR', 'CLASS_ADVISOR', 'HOD', 'PRINCIPAL']
  },
  sessionDate: {
    type: Date,
    default: Date.now
  },
  sessionType: {
    type: String,
    enum: [
      'ACADEMIC_INTERVENTION',
      'ONE_ON_ONE_MENTORING',
      'ATTENDANCE_WARNING',
      'PARENT_CONSULTATION',
      'PSYCHOLOGICAL_SUPPORT',
      'CAREER_GUIDANCE'
    ],
    default: 'ACADEMIC_INTERVENTION'
  },
  keyConcerns: [{
    type: String
  }],
  notes: {
    type: String,
    required: true
  },
  actionPlan: {
    type: String,
    required: true
  },
  nextFollowUpDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
    default: 'OPEN'
  },
  isConfidential: {
    type: Boolean,
    default: true
  },
  authorizedRoles: [{
    type: String,
    enum: ['COUNSELOR', 'CLASS_ADVISOR', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN']
  }],
  accessAudit: [counselingAccessLogSchema]
}, {
  timestamps: true
});

counselingNoteSchema.index({ collegeId: 1, studentRollNo: 1 });

const CounselingNote = mongoose.model('CounselingNote', counselingNoteSchema);
export default CounselingNote;
