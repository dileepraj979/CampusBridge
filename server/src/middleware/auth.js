import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

export async function authMiddleware(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided'
        },
        requestId: req.id
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid authorization token'
        },
        requestId: req.id
      });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token no longer exists'
        },
        requestId: req.id
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'User account is suspended or inactive'
        },
        requestId: req.id
      });
    }

    // Check immediate server-side revocation via tokenVersion
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_REVOKED',
          message: 'Session has been revoked on the server. Please log in again.'
        },
        requestId: req.id
      });
    }

    // Determine active role assignment
    const activeAssignment = user.roles.find(r => r.role === user.activeRole) || user.roles[0];

    req.user = user;
    req.authRole = user.activeRole;
    req.scope = {
      collegeId: activeAssignment?.collegeId?.toString() || null,
      departmentId: activeAssignment?.departmentId || null,
      classId: activeAssignment?.classId || null
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message, requestId: req.id });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_AUTH_ERROR',
        message: 'Internal server error during authentication'
      },
      requestId: req.id
    });
  }
}

export default authMiddleware;
