import logger from '../config/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  const message = err.message || 'An unexpected internal server error occurred';

  // Log error
  logger.error(`[Error] ${code}: ${message}`, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    requestId: req.id,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  const response = {
    success: false,
    error: {
      code,
      message,
      ...(err.details && { details: err.details })
    },
    requestId: req.id
  };

  if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export default errorHandler;
