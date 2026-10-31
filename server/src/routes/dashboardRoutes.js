import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get role-specific dashboard metrics and Bento data
router.get('/', getDashboardData);
router.get('/:role', getDashboardData);

export default router;
