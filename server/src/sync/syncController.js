import SyncOperation from '../models/SyncOperation.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Assignment from '../models/Assignment.js';
import FacultyAssignment from '../models/FacultyAssignment.js';
import Device from '../models/Device.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// Entity model map
const ENTITY_MODEL_MAP = {
  attendanceRecords: AttendanceRecord,
  assignments: Assignment
};

/**
 * Compute field-level differences between client payload, current server state, and base state
 */
function computeFieldDiffs(clientPayload = {}, serverState = {}, baseState = {}) {
  const diffs = [];
  const allKeys = new Set([
    ...Object.keys(clientPayload),
    ...Object.keys(serverState)
  ]);

  // Keys to ignore during field diff
  const ignoredKeys = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'version', 'recordId', 'serverId', 'syncStatus', 'deletedAt']);

  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue;

    const clientVal = clientPayload[key];
    const serverVal = serverState[key];
    const baseVal = baseState ? baseState[key] : undefined;

    // Check if client and server diverge
    if (JSON.stringify(clientVal) !== JSON.stringify(serverVal)) {
      diffs.push({
        field: key,
        clientValue: clientVal ?? null,
        serverValue: serverVal ?? null,
        baseValue: baseVal ?? null
      });
    }
  }

  return diffs;
}

/**
 * POST /api/v1/sync/push
 * Batch mutation processing with idempotency and optimistic concurrency control
 */
export async function pushSync(req, res, next) {
  try {
    const { mutations } = req.body;
    const userId = req.user._id;
    const deviceFingerprint = req.headers['x-device-fingerprint'] || '';

    if (!Array.isArray(mutations) || mutations.length === 0) {
      throw new AppError('Array of mutations is required', 400, 'INVALID_MUTATIONS_PAYLOAD');
    }

    const results = [];

    for (const mut of mutations) {
      const {
        operationId,
        entityType,
        entityId,
        operationType = 'CREATE',
        payload = {},
        baseVersion = 1
      } = mut;

      if (!operationId) {
        results.push({
          operationId: null,
          status: 'failed',
          errorMessage: 'Missing operationId'
        });
        continue;
      }

      // 1. Idempotency Check: if operationId was already processed, return stored receipt
      const existingOp = await SyncOperation.findOne({ operationId });
      if (existingOp) {
        logger.info(`[Idempotent Replay] Operation ${operationId} already processed with status: ${existingOp.status}`);
        results.push({
          operationId,
          status: existingOp.status,
          receipt: existingOp.receipt,
          conflictData: existingOp.conflictData || undefined,
          isIdempotentReplay: true
        });
        continue;
      }

      const Model = ENTITY_MODEL_MAP[entityType];
      if (!Model) {
        const errorResult = {
          operationId,
          status: 'failed',
          errorMessage: `Unsupported entityType '${entityType}'`
        };
        await SyncOperation.create({
          operationId,
          userId,
          deviceFingerprint,
          entityType,
          entityId,
          operationType,
          status: 'failed',
          receipt: errorResult
        });
        results.push(errorResult);
        continue;
      }

      // 2. Locate target record
      let targetRecord = await Model.findOne({
        $or: [{ recordId: entityId }, { _id: entityId.match(/^[0-9a-fA-F]{24}$/) ? entityId : null }]
      });

      // 2b. Phase 4 Attendance Authorization & Locking Validation
      if (entityType === 'attendanceRecords') {
        // If locked, reject direct mutation
        if (targetRecord && targetRecord.isLocked) {
          const lockedError = {
            operationId,
            status: 'failed',
            errorMessage: 'Attendance session is locked. Submit a formal correction approval request to HOD.'
          };
          await SyncOperation.create({
            operationId,
            userId,
            deviceFingerprint,
            entityType,
            entityId,
            operationType,
            status: 'failed',
            receipt: lockedError
          });
          results.push(lockedError);
          continue;
        }

        // Validate faculty authorization for target classId
        const userRole = req.authRole || req.user.activeRole;
        if (userRole === 'FACULTY' || userRole === 'CLASS_ADVISOR') {
          const targetClassId = payload.classId || (targetRecord && targetRecord.classId);
          if (targetClassId) {
            const hasRoleAssignment = req.user.roles?.some(r => r.classId === targetClassId);
            const hasFacultyAssignment = await FacultyAssignment.findOne({
              facultyId: userId,
              classId: targetClassId
            });

            // Permit assigned class or demo primary class CS-3A
            if (!hasRoleAssignment && !hasFacultyAssignment && targetClassId !== 'CS-3A') {
              const authError = {
                operationId,
                status: 'failed',
                errorMessage: `Unauthorized: Faculty is not assigned to class '${targetClassId}'`
              };
              await SyncOperation.create({
                operationId,
                userId,
                deviceFingerprint,
                entityType,
                entityId,
                operationType,
                status: 'failed',
                receipt: authError
              });
              results.push(authError);
              continue;
            }
          }
        }
      }

      // 3. Optimistic Concurrency Evaluation
      if (targetRecord) {
        const serverVersion = targetRecord.version || 1;

        // If client baseVersion diverged from server version -> CONFLICT DETECTED
        if (baseVersion !== serverVersion) {
          const serverCurrentState = targetRecord.toObject();
          const fieldDiffs = computeFieldDiffs(payload, serverCurrentState, { version: baseVersion });

          const conflictData = {
            clientPayload: payload,
            serverCurrentState,
            baseState: { version: baseVersion },
            fieldDiffs
          };

          const conflictReceipt = {
            operationId,
            status: 'conflict',
            entityType,
            entityId,
            clientBaseVersion: baseVersion,
            serverVersion,
            conflictData
          };

          await SyncOperation.create({
            operationId,
            userId,
            deviceFingerprint,
            entityType,
            entityId,
            operationType,
            status: 'conflict',
            clientBaseVersion: baseVersion,
            serverVersion,
            receipt: conflictReceipt,
            conflictData
          });

          logger.warn(`[Sync Conflict] Divergence detected on ${entityType} '${entityId}'. Client v${baseVersion} vs Server v${serverVersion}`);
          results.push(conflictReceipt);
          continue;
        }

        // Versions match -> Apply update / delete
        if (operationType === 'DELETE') {
          targetRecord.deletedAt = new Date();
          targetRecord.version = serverVersion + 1;
        } else {
          Object.assign(targetRecord, payload);
          targetRecord.version = serverVersion + 1;
          targetRecord.updatedAt = new Date();
        }

        await targetRecord.save();

        const successReceipt = {
          operationId,
          status: 'applied',
          entityType,
          entityId: targetRecord.recordId,
          serverId: targetRecord._id.toString(),
          version: targetRecord.version,
          updatedAt: targetRecord.updatedAt
        };

        await SyncOperation.create({
          operationId,
          userId,
          deviceFingerprint,
          entityType,
          entityId: targetRecord.recordId,
          operationType,
          status: 'applied',
          clientBaseVersion: baseVersion,
          serverVersion: targetRecord.version,
          receipt: successReceipt
        });

        results.push(successReceipt);
      } else {
        // Record does not exist -> CREATE new record
        const newRecordData = {
          ...payload,
          recordId: entityId || `srv_rec_${Date.now()}`,
          version: 1,
          markedBy: userId,
          collegeId: req.scope?.collegeId || null,
          syncStatus: 'synced',
          updatedAt: new Date()
        };

        const createdRecord = await Model.create(newRecordData);

        const createReceipt = {
          operationId,
          status: 'applied',
          entityType,
          entityId: createdRecord.recordId,
          serverId: createdRecord._id.toString(),
          version: createdRecord.version,
          updatedAt: createdRecord.updatedAt
        };

        await SyncOperation.create({
          operationId,
          userId,
          deviceFingerprint,
          entityType,
          entityId: createdRecord.recordId,
          operationType,
          status: 'applied',
          clientBaseVersion: baseVersion,
          serverVersion: 1,
          receipt: createReceipt
        });

        results.push(createReceipt);
      }
    }

    res.json({
      success: true,
      data: {
        processedCount: results.length,
        results
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/sync/pull
 * Incremental cursor-based synchronization
 */
export async function pullSync(req, res, next) {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since) : new Date(0);

    const filter = { updatedAt: { $gt: sinceDate } };

    const [attendanceChanges, assignmentChanges] = await Promise.all([
      AttendanceRecord.find(filter).lean(),
      Assignment.find(filter).lean()
    ]);

    const changes = [
      ...attendanceChanges.map(c => ({ entityType: 'attendanceRecords', record: c })),
      ...assignmentChanges.map(c => ({ entityType: 'assignments', record: c }))
    ];

    res.json({
      success: true,
      data: {
        changes,
        cursor: new Date().toISOString(),
        totalChanges: changes.length
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/sync/resolve-conflict
 * Interactive conflict resolution: 'accept_server' | 'force_override' | 'manual_merge'
 */
export async function resolveConflict(req, res, next) {
  try {
    const { operationId, strategy, overridePayload, auditReason } = req.body;
    const userId = req.user._id;

    if (!operationId || !strategy) {
      throw new AppError('operationId and strategy are required', 400, 'MISSING_CONFLICT_PARAMETERS');
    }

    const op = await SyncOperation.findOne({ operationId, status: 'conflict' });
    if (!op) {
      throw new AppError('Conflict operation not found or already resolved', 404, 'CONFLICT_NOT_FOUND');
    }

    const Model = ENTITY_MODEL_MAP[op.entityType];
    if (!Model) {
      throw new AppError(`Unknown entityType ${op.entityType}`, 400, 'INVALID_ENTITY_TYPE');
    }

    let targetRecord = await Model.findOne({
      $or: [{ recordId: op.entityId }, { _id: op.entityId.match(/^[0-9a-fA-F]{24}$/) ? op.entityId : null }]
    });

    if (!targetRecord) {
      throw new AppError('Target server record not found', 404, 'RECORD_NOT_FOUND');
    }

    const beforeState = targetRecord.toObject();

    if (strategy === 'force_override') {
      if (!auditReason || auditReason.trim().length < 5) {
        throw new AppError('Audit Reason (min 5 characters) is mandatory to force an offline override on academic records', 400, 'AUDIT_REASON_REQUIRED');
      }

      // Apply client override payload
      Object.assign(targetRecord, overridePayload || op.conflictData?.clientPayload || {});
      targetRecord.version += 1;
      targetRecord.updatedAt = new Date();
      await targetRecord.save();

      // Log immutable audit record
      await AuditLog.create({
        userId,
        userEmail: req.user.email,
        userRole: req.authRole || req.user.activeRole,
        action: 'CONFLICT_FORCE_OVERRIDE',
        entity: op.entityType,
        entityId: targetRecord.recordId,
        collegeId: req.scope?.collegeId || null,
        departmentId: req.scope?.departmentId || null,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
        auditReason,
        changes: {
          before: beforeState,
          after: targetRecord.toObject(),
          auditReason
        },
        status: 'SUCCESS',
        requestId: req.id
      });
    } else if (strategy === 'manual_merge') {
      if (!overridePayload) {
        throw new AppError('overridePayload required for manual_merge', 400, 'MISSING_MERGE_PAYLOAD');
      }

      Object.assign(targetRecord, overridePayload);
      targetRecord.version += 1;
      targetRecord.updatedAt = new Date();
      await targetRecord.save();

      await AuditLog.create({
        userId,
        userEmail: req.user.email,
        userRole: req.authRole || req.user.activeRole,
        action: 'CONFLICT_MANUAL_MERGE',
        entity: op.entityType,
        entityId: targetRecord.recordId,
        collegeId: req.scope?.collegeId || null,
        changes: { before: beforeState, after: targetRecord.toObject(), auditReason: auditReason || 'Manual field reconciliation' },
        status: 'SUCCESS',
        requestId: req.id
      });
    } else if (strategy === 'accept_server') {
      // Discard client change, keep server state as truth
      logger.info(`Conflict ${operationId} resolved by accepting server state.`);
    }

    // Mark SyncOperation as resolved
    op.status = 'applied';
    op.resolvedAt = new Date();
    op.resolvedBy = userId;
    op.resolutionStrategy = strategy;
    op.auditReason = auditReason || null;
    op.receipt = {
      operationId,
      status: 'resolved',
      strategy,
      recordId: targetRecord.recordId,
      currentVersion: targetRecord.version
    };
    await op.save();

    res.json({
      success: true,
      data: {
        message: `Conflict successfully resolved via '${strategy}'`,
        resolvedRecord: targetRecord.toObject()
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/sync/health
 * Campus-wide sync health telemetry, device registry, and conflict lists
 */
export async function getSyncHealth(req, res, next) {
  try {
    const [totalDevices, activeDevices, pendingOps, activeConflicts, conflictsList] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ revokedAt: null }),
      SyncOperation.countDocuments({ status: { $in: ['queued', 'syncing'] } }),
      SyncOperation.countDocuments({ status: 'conflict' }),
      SyncOperation.find({ status: 'conflict' })
        .populate('userId', 'name email activeRole')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    const devices = await Device.find()
      .populate('userId', 'name email activeRole')
      .sort({ lastSyncAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalDevices,
          activeDevices,
          pendingOps,
          activeConflicts,
          syncHealthScore: activeConflicts === 0 ? '100% HEALTHY' : `${Math.max(70, 100 - activeConflicts * 5)}% ATTENTION NEEDED`
        },
        devices,
        conflicts: conflictsList
      },
      requestId: req.id
    });
  } catch (err) {
    next(err);
  }
}
