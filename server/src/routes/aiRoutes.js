import express from 'express';
import { handleAiQuery, generateFacultyRubric, summarizeClassPerformance } from '../controllers/aiController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Public to authenticated campus roles (Student, Faculty, Advisor, HOD, Principal)
router.post('/query', handleAiQuery);

// Faculty & Academic Leadership only
router.post('/faculty/generate-rubric', generateFacultyRubric);
router.post('/faculty/summarize-class', summarizeClassPerformance);

export default router;
