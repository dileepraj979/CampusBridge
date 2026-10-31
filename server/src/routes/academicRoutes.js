import express from 'express';
import {
  getDepartments,
  getCourses,
  getSubjects,
  getSubjectByCode,
  toggleTopicProgress,
  getCurriculumVelocity,
  getStudentCohorts
} from '../controllers/academicController.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/departments', getDepartments);
router.get('/courses', getCourses);
router.get('/subjects', getSubjects);
router.get('/subjects/:code', getSubjectByCode);
router.post('/subjects/:code/topics/:topicId/toggle', auditAction('TOPIC_PROGRESS_UPDATE', 'Subject'), toggleTopicProgress);
router.get('/curriculum-velocity', getCurriculumVelocity);
router.get('/student-cohorts', getStudentCohorts);

export default router;
