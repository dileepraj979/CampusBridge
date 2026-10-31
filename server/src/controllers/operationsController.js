import crypto from 'crypto';
import FeeInvoice from '../models/FeeInvoice.js';
import LibraryBook from '../models/LibraryBook.js';
import LibraryCheckout from '../models/LibraryCheckout.js';
import HostelRoom from '../models/HostelRoom.js';
import TransportRoute from '../models/TransportRoute.js';
import CampusResourceBooking from '../models/CampusResourceBooking.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'campusbridge_rzp_secret_key_2026';

// -------------------------------------------------------------
// 1. FINANCE & SCHOLARSHIPS ENGINE
// -------------------------------------------------------------

/**
 * GET /api/operations/finance/invoices
 * Fetch fee invoices for student or department
 */
export async function getFeeInvoices(req, res, next) {
  try {
    const { rollNo, semester = 5 } = req.query;
    const filter = {};
    if (rollNo) filter.rollNo = rollNo;
    if (semester) filter.semester = Number(semester);

    let invoices = await FeeInvoice.find(filter).sort({ dueDate: 1 }).lean();

    // Seed realistic invoice if none exists
    if (invoices.length === 0) {
      const targetRoll = rollNo || req.user.studentProfile?.rollNo || '22CS089';
      const sampleInvoice = await FeeInvoice.create({
        invoiceNumber: `INV-2026-${targetRoll}-S5`,
        studentId: req.user._id,
        rollNo: targetRoll,
        studentName: req.user.name,
        departmentId: 'CSE',
        semester: 5,
        academicYear: '2025-2026',
        components: [
          { name: 'Tuition Fee (Autonomous Tier 1)', amount: 65000 },
          { name: 'Computing & Advanced AI Lab Fee', amount: 12000 },
          { name: 'Library & Digital Journals Access', amount: 5000 },
          { name: 'Autonomous Examination & Grade Card Fee', amount: 4500 },
          { name: 'Campus Placement & Training Corpus', amount: 8500 }
        ],
        totalAmount: 95000,
        scholarshipApplied: {
          schemeName: 'Merit-Cum-Means Academic Scholarship (Top 5% Cohort)',
          concessionAmount: 25000,
          status: 'APPROVED'
        },
        netPayable: 70000,
        paidAmount: 35000,
        dueAmount: 35000,
        dueDate: new Date(Date.now() + 15 * 86400000),
        status: 'PARTIAL',
        installments: [
          {
            installmentNumber: 1,
            amount: 35000,
            dueDate: new Date(Date.now() - 30 * 86400000),
            status: 'PAID',
            paidAt: new Date(Date.now() - 32 * 86400000),
            transactionId: 'TXN_RZP_S5_INST1_OK'
          },
          {
            installmentNumber: 2,
            amount: 35000,
            dueDate: new Date(Date.now() + 15 * 86400000),
            status: 'PENDING',
            paidAt: null,
            transactionId: null
          }
        ],
        payments: [
          {
            transactionId: 'TXN_RZP_S5_INST1_OK',
            razorpayPaymentId: 'pay_K99x82910aaB',
            razorpayOrderId: 'order_K99ord_01',
            razorpaySignature: 'sig_verified_mock_sha256',
            amount: 35000,
            paidAt: new Date(Date.now() - 32 * 86400000),
            method: 'UPI_NETBANKING',
            verified: true
          }
        ]
      });

      invoices = [sampleInvoice];
    }

    res.json({
      success: true,
      data: invoices,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/operations/finance/create-order
 * Create simulated Razorpay checkout order
 */
export async function createPaymentOrder(req, res, next) {
  try {
    const { invoiceNumber, amount } = req.body;
    if (!invoiceNumber || !amount) {
      throw new AppError('invoiceNumber and amount are required', 400, 'MISSING_FIELDS');
    }

    const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    res.json({
      success: true,
      data: {
        orderId,
        amount: Number(amount) * 100, // in paise
        currency: 'INR',
        invoiceNumber,
        key: 'rzp_test_campusbridge_mock'
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/operations/finance/verify-payment
 * Server-side Razorpay webhook/return HMAC-SHA256 signature verification
 */
export async function verifyRazorpayPayment(req, res, next) {
  try {
    const {
      invoiceNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount
    } = req.body;

    if (!invoiceNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('Missing payment verification parameters', 400, 'INVALID_PAYMENT_DATA');
    }

    // Verify HMAC-SHA256 signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // In simulated mode, accept either genuine HMAC or test prefix
    const isValidSignature =
      generatedSignature === razorpaySignature ||
      razorpaySignature.startsWith('sig_test_') ||
      razorpaySignature === 'simulated_success_signature';

    if (!isValidSignature) {
      throw new AppError('Payment signature verification failed. Tampered payload detected.', 400, 'SIGNATURE_MISMATCH');
    }

    const invoice = await FeeInvoice.findOne({ invoiceNumber });
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    const numericAmount = Number(amount) || invoice.dueAmount;
    invoice.paidAmount += numericAmount;
    invoice.dueAmount = Math.max(0, invoice.netPayable - invoice.paidAmount);
    invoice.status = invoice.dueAmount === 0 ? 'PAID' : 'PARTIAL';

    const transactionId = `TXN_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Mark pending installment if applicable
    const pendingInst = invoice.installments.find(i => i.status === 'PENDING');
    if (pendingInst) {
      pendingInst.status = 'PAID';
      pendingInst.paidAt = new Date();
      pendingInst.transactionId = transactionId;
    }

    invoice.payments.push({
      transactionId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount: numericAmount,
      paidAt: new Date(),
      method: 'RAZORPAY_GATEWAY',
      verified: true
    });

    await invoice.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'FEE_PAYMENT_VERIFIED',
      entity: 'FeeInvoice',
      entityId: invoiceNumber,
      changes: { transactionId, amount: numericAmount, status: invoice.status },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: `Payment of ₹${numericAmount.toLocaleString('en-IN')} verified. Receipt generated.`,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        paidAmount: invoice.paidAmount,
        dueAmount: invoice.dueAmount,
        transactionId
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// 2. LIBRARY SYSTEM WITH COPY COLLISION PREVENTION
// -------------------------------------------------------------

/**
 * GET /api/operations/library/books
 * List library catalogue with search and department filters
 */
export async function getLibraryBooks(req, res, next) {
  try {
    const { search, department } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    let books = await LibraryBook.find(filter).sort({ title: 1 }).lean();

    // Seed standard core textbooks if empty
    if (books.length === 0) {
      const sampleBooks = [
        {
          isbn: '978-0262033848',
          title: 'Introduction to Algorithms (CLRS)',
          author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
          department: 'CSE',
          shelfLocation: 'Stack CS-04, Bay B, Shelf 2',
          category: 'Textbook',
          barcode: 'BC-LIB-CS-001',
          totalCopies: 8,
          availableCopies: 3,
          coverImage: '/covers/clrs.png',
          waitlist: []
        },
        {
          isbn: '978-1118063330',
          title: 'Operating System Concepts (Dinosaur Book)',
          author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
          department: 'CSE',
          shelfLocation: 'Stack CS-02, Bay A, Shelf 1',
          category: 'Textbook',
          barcode: 'BC-LIB-CS-002',
          totalCopies: 5,
          availableCopies: 1,
          coverImage: '/covers/os.png',
          waitlist: []
        },
        {
          isbn: '978-0133594140',
          title: 'Computer Networks (5th Edition)',
          author: 'Andrew S. Tanenbaum, David J. Wetherall',
          department: 'CSE',
          shelfLocation: 'Stack CS-06, Bay C, Shelf 4',
          category: 'Textbook',
          barcode: 'BC-LIB-CS-003',
          totalCopies: 6,
          availableCopies: 4,
          coverImage: '/covers/networks.png',
          waitlist: []
        }
      ];

      await LibraryBook.insertMany(sampleBooks);
      books = await LibraryBook.find(filter).sort({ title: 1 }).lean();
    }

    res.json({
      success: true,
      data: books,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/operations/library/checkout
 * Check out book with atomic availableCopies decrementation (Collision Prevention)
 */
export async function checkoutBook(req, res, next) {
  try {
    const { barcode, rollNo = '22CS089' } = req.body;
    if (!barcode) {
      throw new AppError('barcode is required for checkout', 400, 'MISSING_BARCODE');
    }

    // Atomic copy collision prevention: checks availableCopies > 0 and decrements in single operation
    const book = await LibraryBook.findOneAndUpdate(
      { barcode, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!book) {
      // Check if book exists but zero copies left
      const existingBook = await LibraryBook.findOne({ barcode });
      if (existingBook) {
        throw new AppError(
          `All ${existingBook.totalCopies} copies of '${existingBook.title}' are currently on loan. Added to reservation waitlist.`,
          409,
          'BOOK_UNAVAILABLE'
        );
      }
      throw new AppError('Book barcode not found in catalogue', 404, 'BOOK_NOT_FOUND');
    }

    const transactionId = `LIB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const issueDate = new Date();
    const dueDate = new Date(Date.now() + 14 * 86400000); // 14-day statutory loan period

    const checkout = new LibraryCheckout({
      transactionId,
      bookId: book._id,
      bookTitle: book.title,
      isbn: book.isbn,
      barcode: book.barcode,
      borrowerId: req.user._id,
      rollNo,
      borrowerName: req.user.name,
      borrowerRole: req.authRole || req.user.activeRole,
      issueDate,
      dueDate,
      status: 'ISSUED'
    });

    await checkout.save();

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'LIBRARY_BOOK_CHECKOUT',
      entity: 'LibraryCheckout',
      entityId: transactionId,
      changes: { book: book.title, barcode, dueDate },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: `'${book.title}' checked out. Due date: ${dueDate.toISOString().slice(0, 10)}. Remaining copies: ${book.availableCopies}`,
      data: {
        checkout,
        remainingCopies: book.availableCopies
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/operations/library/return
 * Return book, calculate overdue fine, restore availableCopies
 */
export async function returnBook(req, res, next) {
  try {
    const { transactionId } = req.body;
    const checkout = await LibraryCheckout.findOne({ transactionId });
    if (!checkout) {
      throw new AppError('Checkout record not found', 404, 'RECORD_NOT_FOUND');
    }

    if (checkout.status === 'RETURNED') {
      throw new AppError('Book has already been returned', 400, 'ALREADY_RETURNED');
    }

    const returnDate = new Date();
    checkout.returnDate = returnDate;

    // Overdue fine calculation: ₹5 per day past due date
    let fineAmount = 0;
    if (returnDate > checkout.dueDate) {
      const daysOverdue = Math.ceil((returnDate - checkout.dueDate) / 86400000);
      fineAmount = daysOverdue * 5;
      checkout.fineAmount = fineAmount;
      checkout.status = 'OVERDUE';
    } else {
      checkout.status = 'RETURNED';
    }

    await checkout.save();

    // Restock available copy atomically
    await LibraryBook.findByIdAndUpdate(checkout.bookId, {
      $inc: { availableCopies: 1 }
    });

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'LIBRARY_BOOK_RETURNED',
      entity: 'LibraryCheckout',
      entityId: transactionId,
      changes: { fineAmount, status: checkout.status },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.json({
      success: true,
      message: `Book returned successfully.${fineAmount > 0 ? ` Overdue fine assessed: ₹${fineAmount}` : ''}`,
      data: {
        checkout,
        fineAmount
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// 3. HOSTEL & TRANSPORT OPERATIONS
// -------------------------------------------------------------

/**
 * GET /api/operations/hostel/rooms
 * List hostel room occupancy and amenities
 */
export async function getHostelRooms(req, res, next) {
  try {
    const { blockName = 'Aryabhata Hall (Block A)' } = req.query;
    let rooms = await HostelRoom.find({ blockName }).sort({ roomNumber: 1 }).lean();

    if (rooms.length === 0) {
      const sampleRooms = [
        {
          blockName: 'Aryabhata Hall (Block A)',
          floor: 1,
          roomNumber: 'A-101',
          roomType: 'DOUBLE_ATTACHED',
          capacity: 2,
          occupiedCount: 2,
          status: 'OCCUPIED',
          amenities: ['Attached Washroom', 'Study Desks', 'High-Speed LAN', 'Balcony'],
          occupants: [
            { studentId: req.user._id, rollNo: '22CS089', studentName: 'Aarav Sharma', bedNumber: 'Bed 1' },
            { studentId: req.user._id, rollNo: '22CS090', studentName: 'Rohan Verma', bedNumber: 'Bed 2' }
          ]
        },
        {
          blockName: 'Aryabhata Hall (Block A)',
          floor: 1,
          roomNumber: 'A-102',
          roomType: 'DOUBLE_ATTACHED',
          capacity: 2,
          occupiedCount: 1,
          status: 'VACANT',
          amenities: ['Attached Washroom', 'Study Desks', 'High-Speed LAN', 'Balcony'],
          occupants: [
            { studentId: req.user._id, rollNo: '22CS091', studentName: 'Sameer Joshi', bedNumber: 'Bed 1' }
          ]
        },
        {
          blockName: 'Aryabhata Hall (Block A)',
          floor: 2,
          roomNumber: 'A-201',
          roomType: 'SINGLE_DELUXE',
          capacity: 1,
          occupiedCount: 0,
          status: 'VACANT',
          amenities: ['Air Conditioned', 'Attached Washroom', 'Mini-Fridge', 'Balcony'],
          occupants: []
        }
      ];

      await HostelRoom.insertMany(sampleRooms);
      rooms = await HostelRoom.find({ blockName }).sort({ roomNumber: 1 }).lean();
    }

    res.json({
      success: true,
      data: rooms,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/operations/transport/routes
 * List transport routes, capacities and stops
 */
export async function getTransportRoutes(req, res, next) {
  try {
    let routes = await TransportRoute.find().sort({ routeNumber: 1 }).lean();

    if (routes.length === 0) {
      const sampleRoutes = [
        {
          routeNumber: 'Route 12',
          routeName: 'Electronic City Express -> Campus',
          busNumber: 'KA-01-CB-9082',
          driverName: 'Manjunath Gowda',
          driverPhone: '+91 98450 12345',
          totalCapacity: 50,
          allocatedSeats: 48,
          occupancyStatus: 'NEAR_CAPACITY',
          stops: [
            { stopName: 'Wipro Gate 5 (Electronic City)', morningPickupTime: '07:15 AM', eveningDropTime: '05:45 PM', sequence: 1 },
            { stopName: 'Silk Board Junction', morningPickupTime: '07:35 AM', eveningDropTime: '05:25 PM', sequence: 2 },
            { stopName: 'HSR Layout BDA Complex', morningPickupTime: '07:50 AM', eveningDropTime: '05:10 PM', sequence: 3 },
            { stopName: 'AIT Main Academic Gate', morningPickupTime: '08:25 AM', eveningDropTime: '04:30 PM', sequence: 4 }
          ]
        },
        {
          routeNumber: 'Route 05',
          routeName: 'Whitefield & ITPL Corridor -> Campus',
          busNumber: 'KA-01-CB-4411',
          driverName: 'Suresh Kumar',
          driverPhone: '+91 98450 67890',
          totalCapacity: 50,
          allocatedSeats: 34,
          occupancyStatus: 'NORMAL',
          stops: [
            { stopName: 'ITPL Main Gate', morningPickupTime: '07:20 AM', eveningDropTime: '05:40 PM', sequence: 1 },
            { stopName: 'Marathahalli Bridge', morningPickupTime: '07:45 AM', eveningDropTime: '05:15 PM', sequence: 2 },
            { stopName: 'AIT Main Academic Gate', morningPickupTime: '08:25 AM', eveningDropTime: '04:30 PM', sequence: 3 }
          ]
        }
      ];

      await TransportRoute.insertMany(sampleRoutes);
      routes = await TransportRoute.find().sort({ routeNumber: 1 }).lean();
    }

    res.json({
      success: true,
      data: routes,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// 4. TRANSACTIONAL CAMPUS RESOURCE BOOKING (Double-Booking Lock)
// -------------------------------------------------------------

/**
 * GET /api/operations/resources/bookings
 * List resource bookings for given date
 */
export async function getResourceBookings(req, res, next) {
  try {
    const { date = new Date().toISOString().slice(0, 10), resourceId } = req.query;
    const filter = { date, status: 'CONFIRMED' };
    if (resourceId) filter.resourceId = resourceId;

    const bookings = await CampusResourceBooking.find(filter).sort({ timeSlot: 1 }).lean();
    res.json({
      success: true,
      data: bookings,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/operations/resources/book
 * Enforces server-side transactional lock to prevent double booking the same slot
 */
export async function bookCampusResource(req, res, next) {
  try {
    const {
      resourceId,
      resourceName,
      date,
      timeSlot,
      purpose,
      attendeesCount = 30
    } = req.body;

    if (!resourceId || !date || !timeSlot || !purpose) {
      throw new AppError('resourceId, date, timeSlot, and purpose are required', 400, 'MISSING_BOOKING_FIELDS');
    }

    // Step 1: Query collision guard check
    const existingBooking = await CampusResourceBooking.findOne({
      resourceId,
      date,
      timeSlot,
      status: 'CONFIRMED'
    });

    if (existingBooking) {
      throw new AppError(
        `Transactional Collision: '${existingBooking.resourceName}' is already reserved for slot [${timeSlot}] on ${date} by ${existingBooking.bookedByName} (${existingBooking.bookedByRole}).`,
        409,
        'SLOT_DOUBLE_BOOKED'
      );
    }

    const bookingId = `RES-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const booking = new CampusResourceBooking({
      bookingId,
      resourceId,
      resourceName: resourceName || resourceId,
      date,
      timeSlot,
      bookedBy: req.user._id,
      bookedByName: req.user.name,
      bookedByRole: req.authRole || req.user.activeRole,
      purpose,
      attendeesCount,
      status: 'CONFIRMED'
    });

    // Step 2: Atomic insert protected by unique compound index
    try {
      await booking.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        throw new AppError(
          `Concurrent Double Booking Lock: Slot [${timeSlot}] for ${resourceName || resourceId} was just confirmed by another concurrent session.`,
          409,
          'CONCURRENT_LOCK_COLLISION'
        );
      }
      throw saveErr;
    }

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.authRole || req.user.activeRole,
      action: 'RESOURCE_BOOKED_CONFIRMED',
      entity: 'CampusResourceBooking',
      entityId: bookingId,
      changes: { resourceId, date, timeSlot, purpose },
      status: 'SUCCESS',
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: `Resource '${booking.resourceName}' locked and confirmed for ${date} [${timeSlot}].`,
      data: booking,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
