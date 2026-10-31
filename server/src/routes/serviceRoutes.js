import express from 'express';
import {
  getServiceRequests,
  createServiceRequest,
  approveServiceRequestStage,
  rejectServiceRequestStage,
  getGrievances,
  fileGrievance,
  resolveGrievance
} from '../controllers/serviceController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

// Multi-stage Service Requests
router.get('/requests', getServiceRequests);
router.post('/requests', auditAction('SERVICE_REQUEST_CREATE', 'ServiceRequest'), createServiceRequest);
router.post('/requests/:ticketNumber/approve', auditAction('SERVICE_REQUEST_APPROVE', 'ServiceRequest'), approveServiceRequestStage);
router.post('/requests/:ticketNumber/reject', auditAction('SERVICE_REQUEST_REJECT', 'ServiceRequest'), rejectServiceRequestStage);

// Privacy-isolated Grievances
router.get('/grievances', getGrievances);
router.post('/grievances', auditAction('GRIEVANCE_FILE', 'Grievance'), fileGrievance);
router.post('/grievances/:trackingNumber/resolve', auditAction('GRIEVANCE_RESOLVE', 'Grievance'), resolveGrievance);

export default router;
