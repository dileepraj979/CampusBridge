import User from '../models/User.js';
import College from '../models/College.js';
import Role from '../models/Role.js';
import Device from '../models/Device.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_COOKIE_NAME, COOKIE_OPTIONS } from '../utils/tokens.js';
import { AppError } from '../middleware/errorHandler.js';
import { getRoleWithPermissions } from '../middleware/rbac.js';

export async function login(req, res, next) {
  try {
    const { email, password, deviceFingerprint, deviceName } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .populate('roles.collegeId', 'name code');

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'active') {
      throw new AppError('Your account has been suspended or is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    // Register or update device if fingerprint provided
    if (deviceFingerprint) {
      await Device.findOneAndUpdate(
        { userId: user._id, deviceFingerprint },
        {
          deviceName: deviceName || 'Browser Workstation',
          browser: req.headers['user-agent'] || 'Modern Browser',
          ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
          lastSyncAt: new Date(),
          revokedAt: null
        },
        { upsert: true, new: true }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Prepare active role assignment
    const activeAssignment = user.roles.find(r => r.role === user.activeRole) || user.roles[0];
    const roleDoc = await getRoleWithPermissions(user.activeRole);

    const accessToken = signAccessToken(user, activeAssignment);
    const refreshToken = signRefreshToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          ...userObj,
          permissions: roleDoc?.permissions || []
        }
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 401, 'MISSING_REFRESH_TOKEN');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.sub).populate('roles.collegeId', 'name code');
    if (!user || user.status !== 'active') {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }

    // Immediate server-side revocation check
    if (decoded.tokenVersion !== user.tokenVersion) {
      res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
      throw new AppError('Session was revoked. Please log in again.', 401, 'SESSION_REVOKED');
    }

    const activeAssignment = user.roles.find(r => r.role === user.activeRole) || user.roles[0];
    const roleDoc = await getRoleWithPermissions(user.activeRole);

    const newAccessToken = signAccessToken(user, activeAssignment);
    const newRefreshToken = signRefreshToken(user);

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          ...user.toObject(),
          permissions: roleDoc?.permissions || []
        }
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function switchRole(req, res, next) {
  try {
    const { targetRole } = req.body;
    const user = req.user;

    const hasRole = user.roles.some(r => r.role === targetRole);
    if (!hasRole && user.activeRole !== 'SUPER_ADMIN') {
      throw new AppError(`You are not assigned the role '${targetRole}'`, 403, 'ROLE_NOT_ASSIGNED');
    }

    user.activeRole = targetRole;
    await user.save();

    const activeAssignment = user.roles.find(r => r.role === targetRole) || user.roles[0];
    const roleDoc = await getRoleWithPermissions(targetRole);

    const newAccessToken = signAccessToken(user, activeAssignment);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        activeRole: targetRole,
        permissions: roleDoc?.permissions || [],
        scope: {
          collegeId: activeAssignment?.collegeId,
          departmentId: activeAssignment?.departmentId,
          classId: activeAssignment?.classId
        }
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeAllSessions(req, res, next) {
  try {
    const targetUserId = req.params.userId || req.user._id;

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Bump tokenVersion - immediately invalidates all tokens
    await user.revokeAllSessions();

    res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);

    res.json({
      success: true,
      data: {
        message: 'All active sessions for this user have been immediately revoked',
        tokenVersion: user.tokenVersion
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate('roles.collegeId', 'name code domain')
      .lean();

    const roleDoc = await getRoleWithPermissions(user.activeRole);

    res.json({
      success: true,
      data: {
        ...user,
        permissions: roleDoc?.permissions || [],
        scope: req.scope
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    requestId: req.id
  });
}

// Demo quick-switch endpoint for testing
export async function getDemoAccounts(req, res, next) {
  try {
    const users = await User.find({ status: 'active' })
      .select('name email activeRole roles')
      .populate('roles.collegeId', 'name code')
      .lean();

    res.json({
      success: true,
      data: users,
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
