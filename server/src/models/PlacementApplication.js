import mongoose from 'mongoose';

const placementApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementDrive',
    required: true,
    index: true
  },
  companyName: { type: String, required: true },
  roleTitle: { type: String, required: true },
  packageLpa: { type: Number, required: true },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  department: { type: String, default: 'CSE' },
  studentCgpa: { type: Number, required: true },
  activeBacklogs: { type: Number, required: true, default: 0 },
  isEligible: { type: Boolean, required: true, default: true },
  stage: {
    type: String,
    enum: ['APPLIED', 'SHORTLISTED', 'ASSESSMENT_CLEARED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED'],
    default: 'APPLIED',
    index: true
  },
  appliedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

placementApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

const PlacementApplication = mongoose.model('PlacementApplication', placementApplicationSchema);
export default PlacementApplication;
