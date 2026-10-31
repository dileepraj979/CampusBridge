import express from 'express';
import {
  getFeeInvoices,
  createPaymentOrder,
  verifyRazorpayPayment,
  getLibraryBooks,
  checkoutBook,
  returnBook,
  getHostelRooms,
  getTransportRoutes,
  getResourceBookings,
  bookCampusResource
} from '../controllers/operationsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// Finance & Scholarships
router.get('/finance/invoices', getFeeInvoices);
router.post('/finance/create-order', createPaymentOrder);
router.post('/finance/verify-payment', auditAction('FEE_PAYMENT', 'FeeInvoice'), verifyRazorpayPayment);

// Library
router.get('/library/books', getLibraryBooks);
router.post('/library/checkout', auditAction('LIBRARY_CHECKOUT', 'LibraryCheckout'), checkoutBook);
router.post('/library/return', auditAction('LIBRARY_RETURN', 'LibraryCheckout'), returnBook);

// Hostel & Transport
router.get('/hostel/rooms', getHostelRooms);
router.get('/transport/routes', getTransportRoutes);

// Transactional Resource Booking (Double Booking Lock)
router.get('/resources/bookings', getResourceBookings);
router.post('/resources/book', auditAction('RESOURCE_BOOKING', 'CampusResourceBooking'), bookCampusResource);

export default router;
