import mongoose from 'mongoose';

const feeComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const installmentSchema = new mongoose.Schema({
  installmentNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'OVERDUE'],
    default: 'PENDING'
  },
  paidAt: { type: Date, default: null },
  transactionId: { type: String, default: null }
}, { _id: false });

const paymentRecordSchema = new mongoose.Schema({
  transactionId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  razorpayOrderId: { type: String, required: true },
  razorpaySignature: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  method: { type: String, default: 'UPI_NETBANKING' },
  verified: { type: Boolean, default: true }
}, { _id: false });

const feeInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rollNo: {
    type: String,
    required: true,
    index: true
  },
  studentName: { type: String, required: true },
  departmentId: { type: String, default: 'CSE' },
  semester: { type: Number, required: true },
  academicYear: { type: String, default: '2025-2026' },
  components: [feeComponentSchema],
  totalAmount: { type: Number, required: true },
  scholarshipApplied: {
    schemeName: { type: String, default: '' },
    concessionAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE'
    }
  },
  netPayable: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'],
    default: 'UNPAID',
    index: true
  },
  installments: [installmentSchema],
  payments: [paymentRecordSchema]
}, {
  timestamps: true
});

const FeeInvoice = mongoose.model('FeeInvoice', feeInvoiceSchema);
export default FeeInvoice;
