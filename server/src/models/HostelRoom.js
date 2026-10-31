import mongoose from 'mongoose';

const occupantSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  bedNumber: { type: String, required: true },
  checkInDate: { type: Date, default: Date.now }
}, { _id: false });

const hostelRoomSchema = new mongoose.Schema({
  blockName: {
    type: String,
    required: true,
    enum: ['Aryabhata Hall (Block A)', 'Gargi Bhavan (Block B)', 'Visvesvaraya Hostel (Block C)']
  },
  floor: {
    type: Number,
    required: true
  },
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomType: {
    type: String,
    enum: ['SINGLE_DELUXE', 'DOUBLE_ATTACHED', 'TRIPLE_STANDARD'],
    default: 'DOUBLE_ATTACHED'
  },
  capacity: {
    type: Number,
    required: true,
    default: 2
  },
  occupiedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE'],
    default: 'VACANT',
    index: true
  },
  amenities: [{
    type: String
  }],
  occupants: [occupantSchema]
}, {
  timestamps: true
});

const HostelRoom = mongoose.model('HostelRoom', hostelRoomSchema);
export default HostelRoom;
