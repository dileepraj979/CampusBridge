import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

export function auditAction(action, entity, options = {}) {
  return async (req, res, next) => {
    // Intercept res.json to capture response status
    const originalJson = res.json.bind(res);

    res.json = function(body) {
      // Restore original method
      res.json = originalJson;

      // Process audit asynchronously to not block client response
      (async () => {
        try {
          const user = req.user;
          const status = res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAILURE';

          const entityId = options.getEntityId
            ? options.getEntityId(req, body)
            : req.params.id || req.body?.id || body?.data?.id || body?.data?._id || null;

          const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
          const userAgent = req.headers['user-agent'] || 'Unknown';

          const changes = options.getChanges
            ? options.getChanges(req, body)
            : {
                before: req.auditBefore || null,
                after: body?.data || null
              };

          await AuditLog.create({
            userId: user?._id || null,
            userEmail: user?.email || req.body?.email || 'anonymous',
            userRole: req.authRole || user?.activeRole || 'UNAUTHENTICATED',
            action,
            entity,
            entityId: entityId ? entityId.toString() : null,
            collegeId: req.scope?.collegeId || user?.roles?.[0]?.collegeId || null,
            departmentId: req.scope?.departmentId || null,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent,
            changes,
            status,
            requestId: req.id || ''
          });

          logger.debug(`Audit log recorded: [${action}] on ${entity} (${status})`, { requestId: req.id });
        } catch (auditErr) {
          logger.error('Failed to write immutable audit log', { error: auditErr.message, requestId: req.id });
        }
      })();

      return originalJson(body);
    };

    next();
  };
}

export default auditAction;
