import mongoose from 'mongoose';

const waitlistEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  reservedAt: { type: Date, default: Date.now },
  queuePosition: { type: Number, required: true }
}, { _id: false });

const libraryBookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    default: 'CSE',
    index: true
  },
  shelfLocation: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Textbook'
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1
  },
  coverImage: {
    type: String,
    default: ''
  },
  waitlist: [waitlistEntrySchema]
}, {
  timestamps: true
});

const LibraryBook = mongoose.model('LibraryBook', libraryBookSchema);
export default LibraryBook;
