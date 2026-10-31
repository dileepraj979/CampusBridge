import mongoose from 'mongoose';

const libraryCheckoutSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryBook',
    required: true,
    index: true
  },
  bookTitle: { type: String, required: true },
  isbn: { type: String, required: true },
  barcode: { type: String, required: true },
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rollNo: { type: String, required: true },
  borrowerName: { type: String, required: true },
  borrowerRole: { type: String, default: 'STUDENT' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST'],
    default: 'ISSUED',
    index: true
  }
}, {
  timestamps: true
});

const LibraryCheckout = mongoose.model('LibraryCheckout', libraryCheckoutSchema);
export default LibraryCheckout;
