import mongoose from 'mongoose';

const placementDriveSchema = new mongoose.Schema({
  driveCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyLogo: {
    type: String,
    default: ''
  },
  roleTitle: {
    type: String,
    required: true
  },
  packageLpa: {
    type: Number,
    required: true
  },
  driveDate: {
    type: Date,
    required: true
  },
  jobLocation: {
    type: String,
    default: 'Bangalore / Remote'
  },
  eligibilityCriteria: {
    minCgpa: { type: Number, required: true, default: 7.0 },
    maxActiveBacklogs: { type: Number, required: true, default: 0 },
    eligibleDepartments: [{ type: String }]
  },
  rounds: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'REGISTRATION_CLOSED', 'COMPLETED'],
    default: 'ACTIVE'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);
export default PlacementDrive;
