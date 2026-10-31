import express from 'express';
import { registerDevice, listUserDevices, revokeDevice } from '../controllers/deviceController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/register', auditAction('DEVICE_REGISTERED', 'Device'), registerDevice);
router.get('/my-devices', listUserDevices);
router.delete('/:deviceId', auditAction('DEVICE_REVOKED', 'Device'), revokeDevice);

export default router;
