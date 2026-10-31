import mongoose from 'mongoose';

const digitalCertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  certificateType: {
    type: String,
    required: true,
    enum: [
      'DEGREE',
      'SEMESTER_HONORS',
      'HACKATHON_WINNER',
      'AUTONOMOUS_COURSE_MASTERY',
      'SPORTS_EXCELLENCE',
      'STUDENT_SELF_CLAIM'
    ],
    index: true
  },
  title: {
    type: String,
    required: true
  },
  issuerInstitution: {
    type: String,
    default: 'Apex Institute of Technology (Autonomous)'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  studentDepartment: {
    type: String,
    default: 'Computer Science & Engineering'
  },
  isVerifiedByCollege: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  verifiedBy: {
    type: String,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: {
    type: Date,
    default: null
  },
  honorsClassification: {
    type: String,
    default: 'Distinction / Exemplary Grade Point'
  },
  skillsAcquired: [{
    type: String
  }],
  cryptographicHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrCodePayload: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const DigitalCertificate = mongoose.model('DigitalCertificate', digitalCertificateSchema);
export default DigitalCertificate;
