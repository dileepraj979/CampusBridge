import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import User from '../src/models/User.js';
import SyncOperation from '../src/models/SyncOperation.js';
import AttendanceRecord from '../src/models/AttendanceRecord.js';
import { signAccessToken } from '../src/utils/tokens.js';
import { connectDB } from '../src/config/db.js';
import { randomUUID } from 'crypto';

describe('Idempotent Sync Push & Deduplication Engine', () => {
  let facultyToken;
  let testOperationId;

  beforeAll(async () => {
    await connectDB();
    const facultyUser = await User.findOne({ email: 'faculty.cse@ait.edu' });
    if (facultyUser) {
      facultyToken = signAccessToken(facultyUser, facultyUser.roles[0]);
    }
    testOperationId = `test_op_${randomUUID()}`;
  });

  it('successfully applies a new mutation and records the operation receipt', async () => {
    if (!facultyToken) return;

    const testPayload = {
      mutations: [
        {
          operationId: testOperationId,
          entityType: 'attendanceRecords',
          entityId: `rec_test_${Date.now()}`,
          operationType: 'CREATE',
          baseVersion: 1,
          payload: {
            classId: 'CS-3A',
            subjectCode: 'CS301',
            date: '2026-11-01',
            totalStudents: 60,
            presentCount: 56,
            absentCount: 4,
            records: [
              { rollNo: '22CS081', status: 'Present' },
              { rollNo: '22CS082', status: 'Present' }
            ]
          }
        }
      ]
    };

    const res = await request(app)
      .post('/api/v1/sync/push')
      .set('Authorization', `Bearer ${facultyToken}`)
      .set('X-Device-Fingerprint', 'device_test_node_01')
      .send(testPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const results = res.body.data?.results || res.body.results;
    expect(Array.isArray(results)).toBe(true);

    const firstResult = results[0];
    expect(firstResult.operationId).toBe(testOperationId);
    expect(firstResult.status).toBe('applied');
    expect(firstResult.isIdempotentReplay).toBeFalsy();

    // Verify stored in SyncOperation collection
    const storedOp = await SyncOperation.findOne({ operationId: testOperationId });
    expect(storedOp).toBeDefined();
    expect(storedOp.status).toBe('applied');
  });

  it('re-submitting the exact same operationId returns stored receipt with isIdempotentReplay: true and zero duplicate records', async () => {
    if (!facultyToken) return;

    const countBeforeReplay = await AttendanceRecord.countDocuments({ date: '2026-11-01', classId: 'CS-3A' });

    // Submit the duplicate payload
    const duplicatePayload = {
      mutations: [
        {
          operationId: testOperationId,
          entityType: 'attendanceRecords',
          entityId: `rec_test_${Date.now()}`,
          operationType: 'CREATE',
          baseVersion: 1,
          payload: {
            classId: 'CS-3A',
            subjectCode: 'CS301',
            date: '2026-11-01'
          }
        }
      ]
    };

    const res = await request(app)
      .post('/api/v1/sync/push')
      .set('Authorization', `Bearer ${facultyToken}`)
      .set('X-Device-Fingerprint', 'device_test_node_01')
      .send(duplicatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const results = res.body.data?.results || res.body.results;
    expect(Array.isArray(results)).toBe(true);

    const replayResult = results[0];
    expect(replayResult.operationId).toBe(testOperationId);
    expect(replayResult.status).toBe('applied');
    expect(replayResult.isIdempotentReplay).toBe(true);

    // Verify database record count did NOT increment
    const countAfterReplay = await AttendanceRecord.countDocuments({ date: '2026-11-01', classId: 'CS-3A' });
    expect(countAfterReplay).toBe(countBeforeReplay);
  });
});
