import mongoose from 'mongoose';

const campusResourceBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resourceId: {
    type: String,
    required: true,
    enum: ['AUDITORIUM_RAMANUJAN', 'SEMINAR_APJ_HALL', 'ADV_COMPUTING_LAB', 'ROBOTICS_RIG', 'CONFERENCE_SUITE_B'],
    index: true
  },
  resourceName: {
    type: String,
    required: true
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    index: true
  },
  timeSlot: {
    type: String,
    required: true,
    enum: ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00']
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookedByName: { type: String, required: true },
  bookedByRole: { type: String, required: true },
  purpose: { type: String, required: true },
  attendeesCount: { type: Number, default: 20 },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED',
    index: true
  }
}, {
  timestamps: true
});

// Enforce server-side transactional collision lock: two users cannot double-book the same slot
campusResourceBookingSchema.index(
  { resourceId: 1, date: 1, timeSlot: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
);

const CampusResourceBooking = mongoose.model('CampusResourceBooking', campusResourceBookingSchema);
export default CampusResourceBooking;
