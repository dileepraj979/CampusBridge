import { db, createOfflineContract, createOfflineMutation, generateUUID } from '../db/dexieDb.js';
import api from '../services/api.js';

// Event listeners for sync state changes
const syncListeners = new Set();

function emitSyncState(state) {
  syncListeners.forEach(listener => {
    try {
      listener(state);
    } catch (e) {
      console.error('[SyncEngine] Listener error', e);
    }
  });
}

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.isPaused = false;
    this.pauseReason = null;
    this.retryTimeout = null;
    this.maxRetries = 5;

    // Auto-sync listener on window online event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncEngine] Network re-established (online). Triggering auto-sync...');
        this.resumeAndSync();
      });
    }
  }

  onSyncStateChange(callback) {
    syncListeners.add(callback);
    return () => syncListeners.delete(callback);
  }

  /**
   * Safe execution guarded by Web Locks API to prevent multiple tabs from competing on mutations
   */
  async acquireLockAndExecute(fn) {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      try {
        return await navigator.locks.request('campusbridge-sync-lock', { ifAvailable: true }, async (lock) => {
          if (!lock) {
            console.log('[SyncEngine] Another browser tab is currently syncing. Skipping concurrent execution.');
            return { locked: true, success: false };
          }
          return await fn();
        });
      } catch (err) {
        console.warn('[SyncEngine] Web Locks API error, falling back to local execution:', err.message);
        return await fn();
      }
    }
    return await fn();
  }

  /**
   * Queue an offline mutation into Dexie.js and trigger immediate sync if online
   */
  async queueMutation({ entityType, entityId, operationType = 'CREATE', payload, baseVersion = 1 }) {
    const mutation = createOfflineMutation({
      entityType,
      entityId,
      operationType,
      payload,
      baseVersion
    });

    await db.offlineMutations.put(mutation);

    // Also update or insert local entity optimistically with 'pending' status
    const targetTable = db[entityType];
    if (targetTable) {
      const existing = await targetTable.get(entityId);
      const updatedEntity = createOfflineContract({
        ...(existing || {}),
        ...payload,
        recordId: entityId,
        version: baseVersion,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString()
      });
      await targetTable.put(updatedEntity);
    }

    emitSyncState({ event: 'MUTATION_QUEUED', mutation });

    // If online and not paused, trigger background push
    if (navigator.onLine && !this.isPaused) {
      this.fullSync().catch(err => console.error('[SyncEngine] Auto-push error', err));
    }

    return mutation;
  }

  /**
   * Push queued mutations to backend endpoint POST /api/v1/sync/push
   */
  async pushMutations() {
    // 1. Fetch queued mutations in chronological order
    const queued = await db.offlineMutations
      .where('status')
      .equals('queued')
      .sortBy('createdAt');

    if (queued.length === 0) {
      return { pushed: 0, conflicts: 0, failed: 0 };
    }

    console.log(`[SyncEngine] Dispatching batch of ${queued.length} queued mutations to server...`);

    // Mark items as 'syncing'
    const operationIds = queued.map(m => m.operationId);
    await db.offlineMutations
      .where('operationId')
      .anyOf(operationIds)
      .modify({ status: 'syncing' });

    emitSyncState({ event: 'SYNC_STARTED', count: queued.length });

    try {
      // 2. Dispatch payload to backend
      const res = await api.request('/v1/sync/push', {
        method: 'POST',
        headers: {
          'X-Operation-Id': queued[0].operationId
        },
        body: JSON.stringify({
          mutations: queued.map(m => ({
            operationId: m.operationId,
            entityType: m.entityType,
            entityId: m.entityId,
            operationType: m.operationType,
            payload: m.payload,
            baseVersion: m.baseVersion
          }))
        })
      });

      let appliedCount = 0;
      let conflictCount = 0;
      let failedCount = 0;

      if (res.success && res.data?.results) {
        for (const result of res.data.results) {
          const mut = queued.find(m => m.operationId === result.operationId);
          if (!mut) continue;

          if (result.status === 'applied') {
            appliedCount++;
            // Update local entity with serverId and incremented version
            const targetTable = db[mut.entityType];
            if (targetTable) {
              const localDoc = await targetTable.get(mut.entityId);
              if (localDoc) {
                await targetTable.update(mut.entityId, {
                  serverId: result.serverId,
                  version: result.version,
                  syncStatus: 'synced',
                  lastSyncedAt: new Date().toISOString()
                });
              }
            }

            // Remove or mark mutation as applied
            await db.offlineMutations.delete(mut.operationId);
          } else if (result.status === 'conflict') {
            conflictCount++;
            console.warn(`[SyncEngine] Conflict detected on mutation ${mut.operationId}:`, result.conflictData);

            // Update mutation status and store conflict details
            await db.offlineMutations.update(mut.operationId, {
              status: 'conflict',
              conflictData: result.conflictData,
              errorMessage: 'Concurrency conflict: server version has advanced.'
            });

            // Mark local entity as conflict
            const targetTable = db[mut.entityType];
            if (targetTable) {
              await targetTable.update(mut.entityId, { syncStatus: 'conflict' });
            }
          } else {
            failedCount++;
            await db.offlineMutations.update(mut.operationId, {
              status: 'failed',
              errorMessage: result.errorMessage || 'Server rejected mutation'
            });
          }
        }
      }

      emitSyncState({
        event: 'SYNC_PUSH_COMPLETED',
        appliedCount,
        conflictCount,
        failedCount
      });

      return { pushed: appliedCount, conflicts: conflictCount, failed: failedCount };
    } catch (error) {
      console.error('[SyncEngine] Push network/server error:', error);

      // Handle 4xx Client Validation / Permission error: immediate pause
      if (error.message && (error.message.includes('403') || error.message.includes('401') || error.message.includes('Validation'))) {
        this.isPaused = true;
        this.pauseReason = error.message;
        await db.offlineMutations
          .where('operationId')
          .anyOf(operationIds)
          .modify({ status: 'failed', errorMessage: error.message });

        emitSyncState({ event: 'SYNC_PAUSED', reason: error.message });
        return { pushed: 0, conflicts: 0, failed: queued.length, paused: true };
      }

      // Transient failure: apply exponential backoff with jitter and revert to 'queued'
      for (const mut of queued) {
        const nextRetry = (mut.retryCount || 0) + 1;
        const backoffMs = Math.min(30000, 1000 * Math.pow(2, nextRetry)) + Math.random() * 1000;

        await db.offlineMutations.update(mut.operationId, {
          status: nextRetry >= this.maxRetries ? 'failed' : 'queued',
          retryCount: nextRetry,
          errorMessage: `Transient error (retry ${nextRetry}): ${error.message}`
        });

        if (nextRetry < this.maxRetries && !this.retryTimeout) {
          this.retryTimeout = setTimeout(() => {
            this.retryTimeout = null;
            this.fullSync().catch(() => {});
          }, backoffMs);
        }
      }

      emitSyncState({ event: 'SYNC_FAILED', error: error.message });
      throw error;
    }
  }

  /**
   * Pull incremental updates via GET /api/v1/sync/pull?since=cursor
   */
  async pullUpdates() {
    try {
      const cursorDoc = await db.syncMetadata.get('lastSyncCursor');
      const since = cursorDoc?.value || new Date(0).toISOString();

      const res = await api.request(`/v1/sync/pull?since=${encodeURIComponent(since)}`);

      if (res.success && res.data) {
        const { changes, cursor } = res.data;

        if (Array.isArray(changes) && changes.length > 0) {
          for (const item of changes) {
            const { entityType, record } = item;
            const targetTable = db[entityType];
            if (targetTable && record) {
              const existing = await targetTable.get(record.recordId);
              // Only overwrite if local record is not in a 'pending' local edit state
              if (!existing || existing.syncStatus !== 'pending') {
                await targetTable.put(
                  createOfflineContract({
                    ...record,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date().toISOString()
                  })
                );
              }
            }
          }
        }

        // Update cursor in syncMetadata
        await db.syncMetadata.put({
          key: 'lastSyncCursor',
          value: cursor,
          lastSyncedAt: new Date().toISOString()
        });

        emitSyncState({ event: 'SYNC_PULL_COMPLETED', changesCount: changes?.length || 0 });
      }
    } catch (err) {
      console.warn('[SyncEngine] Pull updates error (offline or server unreachable):', err.message);
    }
  }

  /**
   * Full bidirectional synchronization guarded by Web Locks API
   */
  async fullSync() {
    if (this.isSyncing) {
      console.log('[SyncEngine] Full sync already in progress.');
      return;
    }

    if (!navigator.onLine) {
      console.log('[SyncEngine] Device is offline. Sync deferred.');
      return;
    }

    this.isSyncing = true;
    emitSyncState({ event: 'SYNC_STARTING' });

    try {
      await this.acquireLockAndExecute(async () => {
        // Step 1: Push local queued mutations to server
        const pushResult = await this.pushMutations();

        // Step 2: Pull cloud updates
        await this.pullUpdates();

        // Step 3: Record in local syncLog
        await db.syncLog.add({
          action: 'FULL_SYNC',
          entity: 'CampusBridgeLocalDB',
          status: 'SUCCESS',
          timestamp: new Date().toISOString()
        });

        emitSyncState({ event: 'SYNC_COMPLETED', pushResult });
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Resume paused sync engine
   */
  resumeAndSync() {
    this.isPaused = false;
    this.pauseReason = null;
    return this.fullSync();
  }

  /**
   * Resolve an active conflict via server endpoint POST /api/v1/sync/resolve-conflict
   */
  async resolveConflict(operationId, strategy, overridePayload, auditReason) {
    const mut = await db.offlineMutations.get(operationId);
    if (!mut) {
      throw new Error(`Mutation ${operationId} not found in offline store`);
    }

    const res = await api.request('/v1/sync/resolve-conflict', {
      method: 'POST',
      body: JSON.stringify({
        operationId,
        strategy, // 'accept_server' | 'force_override' | 'manual_merge'
        overridePayload: overridePayload || mut.payload,
        auditReason
      })
    });

    if (res.success) {
      const resolvedRecord = res.data.resolvedRecord;
      const targetTable = db[mut.entityType];

      if (targetTable && resolvedRecord) {
        await targetTable.put(
          createOfflineContract({
            ...resolvedRecord,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString()
          })
        );
      }

      // Delete resolved mutation from local queue
      await db.offlineMutations.delete(operationId);

      emitSyncState({ event: 'CONFLICT_RESOLVED', operationId, strategy });
      return res.data;
    }

    throw new Error(res.error?.message || 'Conflict resolution failed on server');
  }

  /**
   * Get telemetry counts of current queue state
   */
  async getQueueStats() {
    const queued = await db.offlineMutations.where('status').equals('queued').count();
    const syncing = await db.offlineMutations.where('status').equals('syncing').count();
    const conflicts = await db.offlineMutations.where('status').equals('conflict').count();
    const failed = await db.offlineMutations.where('status').equals('failed').count();

    return {
      queued,
      syncing,
      conflicts,
      failed,
      totalPending: queued + syncing + conflicts + failed
    };
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;
