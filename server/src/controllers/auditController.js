import AuditLog from '../models/AuditLog.js';

export async function listAuditLogs(req, res, next) {
  try {
    const { action, entity, limit = 50, page = 1 } = req.query;

    const query = {};

    // Scope check: if user is not SUPER_ADMIN, isolate by user's college
    if (req.authRole !== 'SUPER_ADMIN' && req.scope?.collegeId) {
      query.collegeId = req.scope.collegeId;
    }

    if (action) query.action = action;
    if (entity) query.entity = entity;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / limit)
        }
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
