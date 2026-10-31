import Dexie from 'dexie';

/**
 * CampusBridgeLocalDB — Dexie.js IndexedDB Architecture
 * Enforces Offline-First Record Contract on all entities:
 * { recordId, serverId, version, updatedAt, lastSyncedAt, syncStatus, deletedAt }
 */
export class CampusBridgeLocalDB extends Dexie {
  constructor() {
    super('CampusBridgeLocalDB');

    // Version 1 (Phase 1 legacy stores)
    this.version(1).stores({
      students: '&recordId, serverId, rollNo, name, departmentId, classId, syncStatus, updatedAt',
      attendanceQueue: '&recordId, serverId, classId, subjectCode, date, syncStatus, updatedAt',
      studyPacks: '&recordId, serverId, subjectCode, title, syncStatus, updatedAt',
      syncLog: '++id, action, entity, status, timestamp',
      deviceMeta: '&key, value'
    });

    // Version 2 (Phase 2 Comprehensive 10-Store Architecture)
    this.version(2).stores({
      userProfile: '&recordId, serverId, email, activeRole, syncStatus, updatedAt',
      timetables: '&recordId, serverId, classId, dayOfWeek, syncStatus, updatedAt',
      attendanceRecords: '&recordId, serverId, classId, subjectCode, date, syncStatus, updatedAt',
      assignments: '&recordId, serverId, classId, subjectCode, title, dueDate, syncStatus, updatedAt',
      downloadedMaterials: '&recordId, serverId, subjectCode, title, mimeType, syncStatus, updatedAt',
      announcements: '&recordId, serverId, category, priority, syncStatus, updatedAt',
      notifications: '&recordId, serverId, isRead, syncStatus, updatedAt',
      offlineMutations: '&operationId, entityType, entityId, operationType, status, createdAt, retryCount',
      syncMetadata: '&key, value, lastSyncedAt',
      referenceData: '&recordId, category, code, syncStatus, updatedAt',
      // Maintain Phase 1 legacy compatibility
      students: '&recordId, serverId, rollNo, name, departmentId, classId, syncStatus, updatedAt',
      attendanceQueue: '&recordId, serverId, classId, subjectCode, date, syncStatus, updatedAt',
      studyPacks: '&recordId, serverId, subjectCode, title, syncStatus, updatedAt',
      syncLog: '++id, action, entity, status, timestamp',
      deviceMeta: '&key, value'
    });
  }
}

export const db = new CampusBridgeLocalDB();

// Helper to generate UUID v4
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Factory helper to construct a record satisfying the Offline-First Contract
export function createOfflineContract(data = {}) {
  const now = new Date().toISOString();
  return {
    recordId: data.recordId || `rec_${generateUUID()}`,
    serverId: data.serverId || null,
    version: data.version || 1,
    updatedAt: data.updatedAt || now,
    lastSyncedAt: data.lastSyncedAt || null,
    syncStatus: data.syncStatus || 'pending',
    deletedAt: data.deletedAt || null,
    ...data
  };
}

// Factory helper to construct an Offline Mutation record
export function createOfflineMutation({
  entityType,
  entityId,
  operationType = 'CREATE',
  payload,
  baseVersion = 1
}) {
  return {
    operationId: generateUUID(),
    entityType,
    entityId,
    operationType, // 'CREATE' | 'UPDATE' | 'DELETE'
    payload,
    baseVersion,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'queued', // 'queued' | 'syncing' | 'failed' | 'conflict'
    errorMessage: null,
    conflictData: null
  };
}

// Pre-populate local offline cache with realistic institutional data across all stores
export async function seedLocalCacheIfEmpty() {
  try {
    const userCount = await db.userProfile.count();
    if (userCount === 0) {
      const now = new Date().toISOString();

      // 1. userProfile
      await db.userProfile.put(
        createOfflineContract({
          recordId: 'usr_current',
          serverId: '6addc47086722b320066164d',
          name: 'Dr. Vasundhara Sen, Ph.D.',
          email: 'principal@ait.edu',
          activeRole: 'PRINCIPAL',
          departmentId: 'CSE',
          collegeId: 'AIT',
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      );

      // 2. timetables
      const sampleTimetables = [
        createOfflineContract({
          recordId: 'tt_cs3a_mon_1',
          classId: 'CS-3A',
          dayOfWeek: 'Monday',
          period: 1,
          time: '09:30 AM - 10:30 AM',
          subjectCode: 'CS301',
          subjectName: 'Design & Analysis of Algorithms',
          facultyName: 'Prof. Ananya Sen',
          room: 'LH-302',
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'tt_cs3a_mon_2',
          classId: 'CS-3A',
          dayOfWeek: 'Monday',
          period: 2,
          time: '10:45 AM - 11:45 AM',
          subjectCode: 'CS302',
          subjectName: 'Operating Systems & Kernels',
          facultyName: 'Dr. Ramesh Kumar',
          room: 'LH-302',
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'tt_cs3a_mon_3',
          classId: 'CS-3A',
          dayOfWeek: 'Monday',
          period: 3,
          time: '01:30 PM - 03:30 PM',
          subjectCode: 'CS305',
          subjectName: 'Database Management Systems Lab',
          facultyName: 'Prof. Vikram Rao',
          room: 'Lab 4',
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.timetables.bulkPut(sampleTimetables);

      // 3. attendanceRecords
      const sampleAttendance = [
        createOfflineContract({
          recordId: 'att_cs3a_20261024_cs301',
          classId: 'CS-3A',
          subjectCode: 'CS301',
          date: '2026-10-24',
          totalStudents: 60,
          presentCount: 56,
          absentCount: 4,
          markedBy: 'faculty.cse@ait.edu',
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'att_cs3a_20261025_cs302',
          classId: 'CS-3A',
          subjectCode: 'CS302',
          date: '2026-10-25',
          totalStudents: 60,
          presentCount: 58,
          absentCount: 2,
          markedBy: 'faculty.cse@ait.edu',
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.attendanceRecords.bulkPut(sampleAttendance);

      // 4. assignments
      const sampleAssignments = [
        createOfflineContract({
          recordId: 'asg_algo_dp_01',
          classId: 'CS-3A',
          subjectCode: 'CS301',
          title: 'Assignment 3: Dynamic Programming on Trees',
          description: 'Implement Floyd-Warshall and Tree Knapsack algorithms in C++20 with benchmarks.',
          dueDate: '2026-10-30T23:59:59Z',
          maxMarks: 25,
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'asg_os_pipe_02',
          classId: 'CS-3A',
          subjectCode: 'CS302',
          title: 'Assignment 2: POSIX Shared Memory IPC',
          description: 'Build a zero-copy circular ring buffer between producer and consumer processes.',
          dueDate: '2026-11-04T23:59:59Z',
          maxMarks: 20,
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.assignments.bulkPut(sampleAssignments);

      // 5. downloadedMaterials
      const sampleMaterials = [
        createOfflineContract({
          recordId: 'mat_cs301_unit3',
          subjectCode: 'CS301',
          title: 'Unit 3: Graph Algorithms & Network Flows.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 8388608,
          isAvailableOffline: true,
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'mat_cs302_unit2',
          subjectCode: 'CS302',
          title: 'Unit 2: Memory Management & Paging Tables.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 5242880,
          isAvailableOffline: true,
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.downloadedMaterials.bulkPut(sampleMaterials);

      // 6. announcements
      const sampleAnnouncements = [
        createOfflineContract({
          recordId: 'ann_nba_eval_2026',
          category: 'ACADEMIC',
          priority: 'HIGH',
          title: 'NBA Peer Team Campus Accreditation Visit',
          content: 'The National Board of Accreditation expert committee will inspect CSE facilities Nov 14-16.',
          author: 'Principal Office',
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'ann_midterm_schedule',
          category: 'EXAMINATIONS',
          priority: 'MEDIUM',
          title: 'Midterm Examination Schedule Released',
          content: 'Semester 3, 5, and 7 timetables have been published. Download hall tickets from portal.',
          author: 'Controller of Examinations',
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.announcements.bulkPut(sampleAnnouncements);

      // 7. notifications
      const sampleNotifications = [
        createOfflineContract({
          recordId: 'notif_att_alert_01',
          title: 'Attendance Recorded',
          message: 'Lecture CS301 attendance has been recorded and queued for background sync.',
          isRead: false,
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'notif_sync_success_02',
          title: 'Offline Sync Successful',
          message: '12 local classroom records were merged with campus cloud database.',
          isRead: true,
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.notifications.bulkPut(sampleNotifications);

      // 8. offlineMutations (pre-seed 1 pending mutation to verify queue visually)
      const testMutation = createOfflineMutation({
        entityType: 'attendanceRecords',
        entityId: 'att_pending_batch_01',
        operationType: 'CREATE',
        payload: {
          classId: 'CS-3A',
          subjectCode: 'CS301',
          date: new Date().toISOString().split('T')[0],
          presentCount: 57,
          absentCount: 3,
          note: 'Marked in offline laboratory tablet'
        },
        baseVersion: 1
      });
      await db.offlineMutations.put(testMutation);

      // 9. syncMetadata
      await db.syncMetadata.put({
        key: 'lastSyncCursor',
        value: now,
        lastSyncedAt: now
      });
      await db.syncMetadata.put({
        key: 'deviceFingerprint',
        value: 'dev_fp_ait_' + Date.now().toString(36),
        lastSyncedAt: now
      });

      // 10. referenceData
      const sampleRefData = [
        createOfflineContract({
          recordId: 'ref_dept_cse',
          category: 'DEPARTMENTS',
          code: 'CSE',
          name: 'Computer Science & Engineering',
          syncStatus: 'synced',
          lastSyncedAt: now
        }),
        createOfflineContract({
          recordId: 'ref_subj_cs301',
          category: 'SUBJECTS',
          code: 'CS301',
          name: 'Design & Analysis of Algorithms',
          syncStatus: 'synced',
          lastSyncedAt: now
        })
      ];
      await db.referenceData.bulkPut(sampleRefData);

      // Legacy stores seeding (Phase 1 compatibility)
      const sampleStudents = [
        { recordId: 'std-rec-01', serverId: 'srv-01', rollNo: '22CS081', name: 'Aarav Sharma', departmentId: 'CSE', classId: 'CS-3A', attendancePct: 88.4, version: 1, updatedAt: now, lastSyncedAt: now, syncStatus: 'synced', deletedAt: null },
        { recordId: 'std-rec-02', serverId: 'srv-02', rollNo: '22CS082', name: 'Aditi Deshmukh', departmentId: 'CSE', classId: 'CS-3A', attendancePct: 94.1, version: 1, updatedAt: now, lastSyncedAt: now, syncStatus: 'synced', deletedAt: null },
        { recordId: 'std-rec-03', serverId: 'srv-03', rollNo: '22CS083', name: 'Bhavin Patel', departmentId: 'CSE', classId: 'CS-3A', attendancePct: 81.0, version: 1, updatedAt: now, lastSyncedAt: now, syncStatus: 'synced', deletedAt: null },
        { recordId: 'std-rec-04', serverId: 'srv-04', rollNo: '22CS084', name: 'Divya Iyer', departmentId: 'CSE', classId: 'CS-3A', attendancePct: 96.5, version: 1, updatedAt: now, lastSyncedAt: now, syncStatus: 'synced', deletedAt: null }
      ];
      await db.students.bulkPut(sampleStudents);

      await db.syncLog.add({
        action: 'BOOTSTRAP_PHASE2_STORES',
        entity: 'CampusBridgeLocalDB',
        status: 'SUCCESS',
        timestamp: now
      });
    }
  } catch (err) {
    console.error('Dexie seeding error', err);
  }
}
