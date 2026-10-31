import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listUsers(req, res, next) {
  try {
    const { role, departmentId, search } = req.query;
    const query = {};

    // Scoped college isolation
    if (req.authRole !== 'SUPER_ADMIN' && req.scope?.collegeId) {
      query['roles.collegeId'] = req.scope.collegeId;
    }

    if (role) {
      query['roles.role'] = role;
    }

    if (departmentId) {
      query['roles.departmentId'] = departmentId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .populate('roles.collegeId', 'name code')
      .limit(100)
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

export async function assignRolesToUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { roles, activeRole } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      throw new AppError('At least one role assignment is required', 400, 'INVALID_ROLES');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    req.auditBefore = { roles: user.roles, activeRole: user.activeRole };

    user.roles = roles;
    if (activeRole) {
      user.activeRole = activeRole;
    } else if (!roles.some(r => r.role === user.activeRole)) {
      user.activeRole = roles[0].role;
    }

    // Changing roles increments tokenVersion to force token refresh/re-verification
    user.tokenVersion += 1;
    await user.save();

    res.json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        activeRole: user.activeRole,
        tokenVersion: user.tokenVersion
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
