import mongoose from 'mongoose';

const rubricCriterionSchema = new mongoose.Schema({
  criterionName: { type: String, required: true },
  maxPoints: { type: Number, default: 5 },
  description: { type: String, default: '' },
  levels: [{
    label: { type: String, default: 'Competent' },
    points: { type: Number, default: 0 },
    description: { type: String, default: '' }
  }]
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  classId: {
    type: String,
    required: true,
    index: true
  },
  subjectCode: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  maxMarks: {
    type: Number,
    default: 20
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Closed'],
    default: 'Published',
    index: true
  },
  allowLateSubmissions: {
    type: Boolean,
    default: true
  },
  latePenaltyPercentPerDay: {
    type: Number,
    default: 5
  },
  rubric: [rubricCriterionSchema],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSizeBytes: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false
  },
  version: {
    type: Number,
    default: 1,
    index: true
  },
  syncStatus: {
    type: String,
    default: 'synced'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
