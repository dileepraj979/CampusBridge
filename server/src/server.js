import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import logger from './config/logger.js';
import requestIdMiddleware from './middleware/requestId.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import syncRoutes from './sync/syncRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import examRoutes from './routes/examRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { verifyPublicCertificate } from './controllers/placementController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Request ID Tracing (must be first)
app.use(requestIdMiddleware);

// 2. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 3. CORS Configuration
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Device-Fingerprint']
}));

// 4. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // high threshold for dev/prod testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests created from this IP, please try again after 15 minutes'
    }
  }
});
app.use('/api/', limiter);

// 5. Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 6. Structured Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      requestId: req.id,
      ip: req.ip,
      statusCode: res.statusCode,
      durationMs: duration
    });
  });
  next();
});

// 7. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: 'CampusBridge Engine',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// 8. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/lms', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/grievances', serviceRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/verify/:certificateHash', verifyPublicCertificate);

// 9. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    },
    requestId: req.id
  });
});

// 10. Centralized Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 CampusBridge Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
