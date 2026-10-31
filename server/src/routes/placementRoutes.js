import express from 'express';
import {
  getPlacementDrives,
  applyForDrive,
  getCertificates,
  issueCertificate,
  verifyPublicCertificate
} from '../controllers/placementController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

// 1. PUBLIC ROUTE (No auth required for external verification)
router.get('/verify/:certificateHash', verifyPublicCertificate);

// 2. Protected Routes
router.use(authMiddleware);

// Placements
router.get('/drives', getPlacementDrives);
router.post('/apply', auditAction('PLACEMENT_APPLY', 'PlacementApplication'), applyForDrive);

// Skill Passport & Certificates
router.get('/certificates', getCertificates);
router.post('/certificates/issue', auditAction('CERTIFICATE_ISSUE', 'DigitalCertificate'), issueCertificate);

export default router;
