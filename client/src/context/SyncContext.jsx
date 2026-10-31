import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, seedLocalCacheIfEmpty, generateUUID } from '../db/dexieDb.js';
import syncEngine from '../offline/syncEngine.js';

const SyncContext = createContext();

export function SyncProvider({ children }) {
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0]; // HH:mm:ss
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [storesData, setStoresData] = useState([]);
  const [storageEstimate, setStorageEstimate] = useState({ usageMB: '2.4', quotaMB: '2048', percentage: 0.1 });
  const [activeConflicts, setActiveConflicts] = useState([]);

  // Compute effective online state
  const isOnline = networkOnline && !simulatedOffline;

  // Global sync status pill flag
  const syncStatus = conflictCount > 0 ? 'conflict' : (!isOnline || pendingCount > 0) ? 'pending' : 'synced';

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh IndexedDB record counts and storage estimates
  const refreshCounts = useCallback(async () => {
    try {
      const stats = await syncEngine.getQueueStats();
      setPendingCount(stats.queued + stats.syncing);
      setConflictCount(stats.conflicts);

      // Fetch active conflicts from offlineMutations
      const conflicts = await db.offlineMutations
        .where('status')
        .equals('conflict')
        .toArray();
      setActiveConflicts(conflicts);

      // Estimate browser quota
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const usageMB = ((est.usage || 2400000) / (1024 * 1024)).toFixed(1);
        const quotaMB = ((est.quota || 2147483648) / (1024 * 1024)).toFixed(0);
        const percentage = Math.min(100, Math.max(0.1, ((est.usage || 2400000) / (est.quota || 2147483648)) * 100)).toFixed(1);
        setStorageEstimate({ usageMB, quotaMB, percentage });
      }

      // Count records across all 10 Phase 2 stores
      const [
        users,
        timetables,
        attendance,
        assignments,
        materials,
        announcements,
        notifications,
        mutations,
        refData
      ] = await Promise.all([
        db.userProfile.count(),
        db.timetables.count(),
        db.attendanceRecords.count(),
        db.assignments.count(),
        db.downloadedMaterials.count(),
        db.announcements.count(),
        db.notifications.count(),
        db.offlineMutations.count(),
        db.referenceData.count()
      ]);

      setStoresData([
        { name: 'attendanceRecords', label: 'Biometric Attendance Records', count: attendance, status: 'Locally Cached', offlineCapable: true, size: '~8.4 KB' },
        { name: 'assignments', label: 'Continuous Evaluations & Drafts', count: assignments, status: 'Locally Cached', offlineCapable: true, size: '~12.1 KB' },
        { name: 'downloadedMaterials', label: 'Offline Study Packs & Pdfs', count: materials, status: 'Available Offline', offlineCapable: true, size: '13.6 MB' },
        { name: 'timetables', label: 'Weekly Lecture Schedules', count: timetables, status: 'Available Offline', offlineCapable: true, size: '~4.2 KB' },
        { name: 'announcements', label: 'Campus Bulletins & Notices', count: announcements, status: 'Locally Cached', offlineCapable: true, size: '~6.8 KB' },
        { name: 'userProfile', label: 'User Roles & Scope Profile', count: users, status: 'Cached in IndexedDB', offlineCapable: true, size: '~2.0 KB' },
        { name: 'offlineMutations', label: 'Pending Mutation Queue', count: mutations, status: stats.conflicts > 0 ? `${stats.conflicts} Conflict` : stats.queued > 0 ? `${stats.queued} Queued` : 'All Synced', offlineCapable: true, size: '~3.5 KB' },
        { name: 'paymentGateway', label: 'Realtime University Bursar Gateway', count: 0, status: 'Online Only (Cloud)', offlineCapable: false, size: 'Razorpay API' },
        { name: 'examSecrecyVault', label: 'University Exam Question Bank', count: 0, status: 'Online Only (Cloud)', offlineCapable: false, size: 'Cloud DB' }
      ]);
    } catch (e) {
      console.error('Dexie refresh count error', e);
    }
  }, []);

  // Initialize DB and subscribe to syncEngine state
  useEffect(() => {
    async function init() {
      await seedLocalCacheIfEmpty();
      await refreshCounts();
    }
    init();

    const unsubscribe = syncEngine.onSyncStateChange((event) => {
      refreshCounts();
      if (event.event === 'SYNC_COMPLETED' || event.event === 'SYNC_PUSH_COMPLETED') {
        const d = new Date();
        setLastSyncTime(d.toTimeString().split(' ')[0]);
      }
    });

    return () => unsubscribe();
  }, [refreshCounts]);

  // Manual Trigger: Force Full Bidirectional Sync
  const triggerSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while Offline. Please disable offline simulation or connect to network.');
      return;
    }

    setIsSyncing(true);
    try {
      await syncEngine.fullSync();
      const d = new Date();
      setLastSyncTime(d.toTimeString().split(' ')[0]);
      await refreshCounts();
    } catch (err) {
      console.error('Manual sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Queue a test offline attendance draft
  const queueTestAttendance = async () => {
    const id = 'att_' + Date.now();
    await syncEngine.queueMutation({
      entityType: 'attendanceRecords',
      entityId: id,
      operationType: 'CREATE',
      payload: {
        recordId: id,
        classId: 'CS-3A',
        subjectCode: 'CS301',
        date: new Date().toISOString().split('T')[0],
        totalStudents: 60,
        presentCount: 56,
        absentCount: 4,
        note: 'Queued via Offline Sync Drawer test button'
      },
      baseVersion: 1
    });
    await refreshCounts();
  };

  // Queue a test offline assignment draft
  const queueTestAssignment = async () => {
    const id = 'asg_' + Date.now();
    await syncEngine.queueMutation({
      entityType: 'assignments',
      entityId: id,
      operationType: 'CREATE',
      payload: {
        recordId: id,
        classId: 'CS-3A',
        subjectCode: 'CS301',
        title: `Algorithms Lab Exercise ${new Date().toLocaleTimeString()}`,
        description: 'Offline created assignment task for DP graph problems.',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        maxMarks: 25
      },
      baseVersion: 1
    });
    await refreshCounts();
  };

  // Simulate a deliberate Concurrency Conflict
  const simulateConcurrencyConflict = async () => {
    const conflictId = 'att_conflict_' + Date.now();

    // 1. First ensure a server record exists at version 2 on the backend
    try {
      await syncEngine.queueMutation({
        entityType: 'attendanceRecords',
        entityId: conflictId,
        operationType: 'CREATE',
        payload: {
          recordId: conflictId,
          classId: 'CS-3A',
          subjectCode: 'CS301',
          date: new Date().toISOString().split('T')[0],
          totalStudents: 60,
          presentCount: 55,
          absentCount: 5,
          note: 'Initial Cloud Baseline Record'
        },
        baseVersion: 1
      });
      // Push it to create server record
      await syncEngine.pushMutations();
    } catch (e) {
      console.warn('Sim baseline creation', e);
    }

    // 2. Now queue a conflicting mutation with an outdated baseVersion (baseVersion: 1 while server is v2)
    const conflictMutation = {
      operationId: generateUUID(),
      entityType: 'attendanceRecords',
      entityId: conflictId,
      operationType: 'UPDATE',
      payload: {
        presentCount: 59,
        absentCount: 1,
        note: 'Offline Tablet Override (Conflicting presentCount)'
      },
      baseVersion: 1, // OUTDATED! Server is at version 2
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'queued',
      errorMessage: null,
      conflictData: null
    };

    await db.offlineMutations.put(conflictMutation);

    // Push it so the server optimistic concurrency controller detects the conflict!
    try {
      await syncEngine.pushMutations();
    } catch (e) {
      console.log('Expected conflict from push', e);
    }

    await refreshCounts();
  };

  // Interactive Conflict Resolution caller
  const resolveActiveConflict = async (operationId, strategy, overridePayload, auditReason) => {
    const res = await syncEngine.resolveConflict(operationId, strategy, overridePayload, auditReason);
    await refreshCounts();
    return res;
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        networkOnline,
        simulatedOffline,
        setSimulatedOffline,
        toggleOfflineSimulation: () => setSimulatedOffline(prev => !prev),
        syncStatus,
        pendingCount,
        lastSyncTime,
        isSyncing,
        conflictCount,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen(prev => !prev),
        triggerSync,
        queueTestAttendance,
        queueTestAssignment,
        simulateConcurrencyConflict,
        resolveActiveConflict,
        activeConflicts,
        storesData,
        storageEstimate,
        refreshCounts
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}

export default SyncContext;
