import Role from '../models/Role.js';
import logger from '../config/logger.js';

// In-memory cache for role permissions to ensure sub-millisecond RBAC checks
const roleCache = new Map();

export async function getRoleWithPermissions(roleCode) {
  if (roleCache.has(roleCode)) {
    return roleCache.get(roleCode);
  }
  const roleDoc = await Role.findOne({ code: roleCode }).lean();
  if (roleDoc) {
    roleCache.set(roleCode, roleDoc);
  }
  return roleDoc;
}

export function clearRoleCache() {
  roleCache.clear();
}

/**
 * Require user to possess at least one of the specified roles
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        requestId: req.id
      });
    }

    const currentRole = req.authRole || req.user.activeRole;

    // Super Admin has universal access
    if (currentRole === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user has active role or any assigned role among allowedRoles
    const hasRole = allowedRoles.includes(currentRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. Role '${currentRole}' is not authorized. Allowed: ${allowedRoles.join(', ')}`
        },
        requestId: req.id
      });
    }

    next();
  };
}

/**
 * Require specific permission string (e.g. 'attendance:mark', 'students:read')
 */
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          requestId: req.id
        });
      }

      const currentRole = req.authRole || req.user.activeRole;
      if (currentRole === 'SUPER_ADMIN') {
        return next();
      }

      const roleDoc = await getRoleWithPermissions(currentRole);
      if (!roleDoc) {
        return res.status(403).json({
          success: false,
          error: { code: 'ROLE_UNDEFINED', message: `Role definition for '${currentRole}' not found` },
          requestId: req.id
        });
      }

      const hasPermission = roleDoc.permissions.includes('*') || roleDoc.permissions.includes(permission);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_PERMISSION',
            message: `Current role '${currentRole}' lacks permission: '${permission}'`
          },
          requestId: req.id
        });
      }

      next();
    } catch (err) {
      logger.error('Error in RBAC permission check', { error: err.message, requestId: req.id });
      res.status(500).json({ success: false, error: { message: 'RBAC evaluation failed' }, requestId: req.id });
    }
  };
}

/**
 * Validate college, department, or class scope isolation
 */
export function requireScope(scopeType = 'college') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' }, requestId: req.id });
    }

    const currentRole = req.authRole || req.user.activeRole;
    if (currentRole === 'SUPER_ADMIN') {
      return next();
    }

    const { collegeId, departmentId, classId } = req.scope || {};

    if (scopeType === 'college') {
      const targetCollege = req.params.collegeId || req.body.collegeId || req.query.collegeId;
      if (targetCollege && collegeId && targetCollege !== collegeId) {
        return res.status(403).json({
          success: false,
          error: { code: 'COLLEGE_SCOPE_VIOLATION', message: 'Cross-college access forbidden' },
          requestId: req.id
        });
      }
    }

    if (scopeType === 'department') {
      const targetDept = req.params.departmentId || req.body.departmentId || req.query.departmentId;
      if (targetDept && departmentId && targetDept !== departmentId) {
        return res.status(403).json({
          success: false,
          error: { code: 'DEPARTMENT_SCOPE_VIOLATION', message: 'Cross-department access forbidden' },
          requestId: req.id
        });
      }
    }

    if (scopeType === 'class') {
      const targetClass = req.params.classId || req.body.classId || req.query.classId;
      if (targetClass && classId && targetClass !== classId) {
        return res.status(403).json({
          success: false,
          error: { code: 'CLASS_SCOPE_VIOLATION', message: 'Cross-class access forbidden' },
          requestId: req.id
        });
      }
    }

    next();
  };
}
