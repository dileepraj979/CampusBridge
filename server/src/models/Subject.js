import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  name: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lectureNotesUrl: { type: String, default: '' }
}, { _id: false });

const syllabusUnitSchema = new mongoose.Schema({
  unitNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedHours: { type: Number, default: 9 },
  topics: [topicSchema]
}, { _id: false });

const subjectSchema = new mongoose.Schema({
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
  departmentCode: {
    type: String,
    default: 'CSE',
    index: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['theory', 'lab', 'elective', 'project'],
    default: 'theory'
  },
  credits: {
    type: Number,
    required: true,
    default: 4
  },
  semester: {
    type: Number,
    required: true,
    index: true
  },
  assignedFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  prerequisites: [{
    type: String
  }],
  syllabusUnits: [syllabusUnitSchema],
  syllabusProgress: {
    type: Number,
    default: 0 // percentage 0 - 100
  },
  targetMilestoneProgress: {
    type: Number,
    default: 80 // expected milestone at current semester week
  }
}, {
  timestamps: true
});

// Auto-calculate syllabusProgress on save
subjectSchema.pre('save', function(next) {
  let totalTopics = 0;
  let completedTopics = 0;

  if (this.syllabusUnits && this.syllabusUnits.length > 0) {
    for (const unit of this.syllabusUnits) {
      if (unit.topics && unit.topics.length > 0) {
        totalTopics += unit.topics.length;
        completedTopics += unit.topics.filter(t => t.isCompleted).length;
      }
    }
  }

  this.syllabusProgress = totalTopics > 0
    ? Math.round((completedTopics / totalTopics) * 100)
    : 0;

  next();
});

export const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
