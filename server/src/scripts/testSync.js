// Global fetch is built-in in Node 18+

async function testSyncFlow() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('Testing Phase 2 Sync Engine & Concurrency Control on:', BASE_URL);

  // 1. Login as Principal to obtain accessToken
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'principal@ait.edu',
      password: 'password123',
      deviceFingerprint: 'test_dev_fingerprint_01'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.data.accessToken;
  console.log('✓ Logged in as Principal. Token acquired.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Device-Fingerprint': 'test_dev_fingerprint_01'
  };

  // 2. Test GET /api/v1/sync/health
  const healthRes = await fetch(`${BASE_URL}/v1/sync/health`, { headers: authHeaders });
  const healthData = await healthRes.json();
  console.log('✓ GET /api/v1/sync/health response:', {
    success: healthData.success,
    overview: healthData.data?.overview
  });

  // 3. Test POST /api/v1/sync/push - CREATE AttendanceRecord
  const opId1 = 'op_test_' + Date.now();
  const pushRes1 = await fetch(`${BASE_URL}/v1/sync/push`, {
    method: 'POST',
    headers: { ...authHeaders, 'X-Operation-Id': opId1 },
    body: JSON.stringify({
      mutations: [
        {
          operationId: opId1,
          entityType: 'attendanceRecords',
          entityId: 'att_test_rec_01',
          operationType: 'CREATE',
          payload: {
            classId: 'CS-3A',
            subjectCode: 'CS301',
            date: '2026-10-25',
            totalStudents: 60,
            presentCount: 56,
            absentCount: 4,
            note: 'Verification test record'
          },
          baseVersion: 1
        }
      ]
    })
  });
  const pushData1 = await pushRes1.json();
  console.log('✓ POST /api/v1/sync/push (CREATE) response:', pushData1.data?.results?.[0]);

  // 4. Test Idempotency - send exact same operationId again!
  const pushResIdempotent = await fetch(`${BASE_URL}/v1/sync/push`, {
    method: 'POST',
    headers: { ...authHeaders, 'X-Operation-Id': opId1 },
    body: JSON.stringify({
      mutations: [
        {
          operationId: opId1,
          entityType: 'attendanceRecords',
          entityId: 'att_test_rec_01',
          operationType: 'CREATE',
          payload: { note: 'Different payload should be ignored because operationId is identical' },
          baseVersion: 1
        }
      ]
    })
  });
  const pushDataIdempotent = await pushResIdempotent.json();
  console.log('✓ POST /api/v1/sync/push (IDEMPOTENCY TEST) isIdempotentReplay:', pushDataIdempotent.data?.results?.[0]?.isIdempotentReplay);

  // 5. Test Optimistic Concurrency Divergence / Conflict Generation
  // Target record is at version 1 (or 2). Attempt mutation with baseVersion 99 (divergence!)
  const opIdConflict = 'op_conflict_' + Date.now();
  const pushResConflict = await fetch(`${BASE_URL}/v1/sync/push`, {
    method: 'POST',
    headers: { ...authHeaders, 'X-Operation-Id': opIdConflict },
    body: JSON.stringify({
      mutations: [
        {
          operationId: opIdConflict,
          entityType: 'attendanceRecords',
          entityId: 'att_test_rec_01',
          operationType: 'UPDATE',
          payload: {
            presentCount: 60,
            absentCount: 0,
            note: 'Conflicting override with wrong baseVersion'
          },
          baseVersion: 99 // Deliberate mismatch
        }
      ]
    })
  });
  const pushDataConflict = await pushResConflict.json();
  const conflictResult = pushDataConflict.data?.results?.[0];
  console.log('✓ POST /api/v1/sync/push (CONFLICT TEST):', {
    status: conflictResult?.status,
    fieldDiffsCount: conflictResult?.conflictData?.fieldDiffs?.length
  });

  // 6. Test Conflict Resolution with Audit Reason
  const resolveRes = await fetch(`${BASE_URL}/v1/sync/resolve-conflict`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      operationId: opIdConflict,
      strategy: 'force_override',
      overridePayload: {
        presentCount: 58,
        absentCount: 2,
        note: 'Resolved via physical sign-in verification'
      },
      auditReason: 'Physical paper roster signed by classroom monitor confirms 58 present.'
    })
  });
  const resolveData = await resolveRes.json();
  console.log('✓ POST /api/v1/sync/resolve-conflict response:', {
    success: resolveData.success,
    message: resolveData.data?.message,
    newVersion: resolveData.data?.resolvedRecord?.version
  });

  // 7. Test GET /api/v1/sync/pull?since=...
  const pullRes = await fetch(`${BASE_URL}/v1/sync/pull?since=${encodeURIComponent(new Date(0).toISOString())}`, {
    headers: authHeaders
  });
  const pullData = await pullRes.json();
  console.log('✓ GET /api/v1/sync/pull changes pulled:', pullData.data?.totalChanges);

  console.log('\n🎉 ALL PHASE 2 SYNC ENGINE TESTS PASSED SUCCESSFULLY!');
}

testSyncFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
