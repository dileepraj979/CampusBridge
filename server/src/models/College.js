import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  code: { type: String, required: true }
}, { _id: false });

const classSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  departmentId: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true }
}, { _id: false });

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  domain: { type: String, required: true, lowercase: true, trim: true },
  address: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  departments: [departmentSchema],
  classes: [classSchema],
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_setup'],
    default: 'active'
  },
  settings: {
    allowOfflineAttendance: { type: Boolean, default: true },
    maxOfflineSyncBufferHours: { type: Number, default: 72 },
    accreditationScore: { type: Number, default: 3.84 }, // NAAC Grade A++ scale
    academicYear: { type: String, default: '2025-2026' }
  }
}, {
  timestamps: true
});

export const College = mongoose.model('College', collegeSchema);
export default College;
