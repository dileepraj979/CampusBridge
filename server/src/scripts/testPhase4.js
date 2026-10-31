import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase4Verification() {
  console.log('--- Starting CampusBridge Phase 4 Automated Verification ---');

  // Step 1: Authenticate as Faculty (Prof. Ananya Sen / faculty.cse@ait.edu)
  console.log('1. Authenticating as faculty.cse@ait.edu...');
  const facultyLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty.cse@ait.edu', password: 'password123' })
  });
  const facultyLogin = await facultyLoginRes.json();
  if (!facultyLoginRes.ok) throw new Error(`Faculty login failed: ${JSON.stringify(facultyLogin)}`);
  const facultyToken = facultyLogin.data.accessToken;
  const facultyHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${facultyToken}`
  };
  console.log('   Authenticated as Faculty:', facultyLogin.data.user.name);

  // Authenticate as Principal / HOD for approval reviews
  console.log('   Authenticating as principal@ait.edu for administrative reviews...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@ait.edu', password: 'password123' })
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.data.accessToken;
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // Step 2: Fetch Class Sessions for Class CS-3A
  console.log('\n2. Testing GET /api/attendance/sessions?classId=CS-3A...');
  const sessionsRes = await fetch(`${API_BASE}/attendance/sessions?classId=CS-3A`, { headers: facultyHeaders });
  const sessionsData = await sessionsRes.json();
  if (!sessionsRes.ok) throw new Error(`Failed to fetch sessions: ${JSON.stringify(sessionsData)}`);
  console.log(`   Found ${sessionsData.data.length} sessions for class CS-3A:`);
  sessionsData.data.forEach(s => {
    console.log(`   - Period ${s.periodNumber}: [${s.subjectCode}] ${s.subjectName} in ${s.room} (${s.startTime} - ${s.endTime}). Status: ${s.status}`);
  });
  const targetSession = sessionsData.data[0];

  // Step 3: Fetch Session Details & Student Roster
  console.log(`\n3. Testing GET /api/attendance/sessions/${targetSession._id}...`);
  const rosterRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}`, { headers: facultyHeaders });
  const rosterData = await rosterRes.json();
  if (!rosterRes.ok) throw new Error(`Failed to fetch roster: ${JSON.stringify(rosterData)}`);
  const initialRoster = rosterData.data.attendance.students;
  console.log(`   Roster loaded with ${initialRoster.length} students. Sample:`, initialRoster.slice(0, 3).map(s => `${s.rollNo} (${s.name})`).join(', '));

  // Step 4: Submit Full Attendance Roster with mixed statuses
  console.log(`\n4. Testing POST /api/attendance/sessions/${targetSession._id}/roster...`);
  const updatedStudents = initialRoster.map((s, idx) => ({
    ...s,
    status: idx === 0 ? 'Absent' : idx === 1 ? 'Late' : idx === 2 ? 'On Duty' : 'Present',
    remarks: idx === 0 ? 'Unexcused absence' : idx === 2 ? 'Robotics competition OD' : ''
  }));

  const saveRosterRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/roster`, {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      students: updatedStudents,
      topicCovered: 'Divide and conquer recurrence relations',
      note: 'Period 1 completed on schedule',
      isFinalSubmission: false
    })
  });
  const saveRosterData = await saveRosterRes.json();
  if (!saveRosterRes.ok) throw new Error(`Failed to save roster: ${JSON.stringify(saveRosterData)}`);
  const rec = saveRosterData.data.record;
  console.log(`   Roster saved: Present=${rec.presentCount}, Absent=${rec.absentCount}, Late=${rec.lateCount}, OnDuty=${rec.onDutyCount}`);
  if (rec.absentCount !== 1 || rec.lateCount !== 1) {
    throw new Error('Attendance counts did not match submission');
  }

  // Step 5: Test Rotating Time-Bound QR Attendance Engine
  console.log(`\n5. Testing Time-Bound QR Code Attendance Engine...`);
  console.log(`   Launching QR session via POST /api/attendance/sessions/${targetSession._id}/qr/start...`);
  const qrStartRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/qr/start`, {
    method: 'POST',
    headers: facultyHeaders
  });
  const qrStartData = await qrStartRes.json();
  if (!qrStartRes.ok) throw new Error(`Failed to start QR: ${JSON.stringify(qrStartData)}`);
  const token1 = qrStartData.data.token;
  console.log(`   QR Session Active! Initial Token: ${token1} (Expires in ${qrStartData.data.rotationIntervalSeconds}s)`);

  console.log(`   Rotating token via POST /api/attendance/sessions/${targetSession._id}/qr/rotate...`);
  const qrRotateRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/qr/rotate`, {
    method: 'POST',
    headers: facultyHeaders
  });
  const qrRotateData = await qrRotateRes.json();
  const token2 = qrRotateData.data.token;
  console.log(`   Rotated Token: ${token2}`);

  console.log(`   Student scanning with fresh token via POST /api/attendance/sessions/${targetSession._id}/qr/verify...`);
  const verifyRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/qr/verify`, {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      token: token2,
      studentRollNo: updatedStudents[0].rollNo // student who was marked Absent
    })
  });
  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(`QR verification failed: ${JSON.stringify(verifyData)}`);
  console.log(`   QR Verification Success: ${verifyData.message}. Status=${verifyData.data.status}, Method=${verifyData.data.verificationMethod}`);

  console.log('   Testing QR verification with EXPIRED / BOGUS token (expecting 400 rejection)...');
  const bogusRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/qr/verify`, {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      token: 'INVALID_BOGUS_TOKEN_123',
      studentRollNo: updatedStudents[1].rollNo
    })
  });
  console.log(`   Bogus token check HTTP Status: ${bogusRes.status} (Expected 400)`);
  if (bogusRes.status !== 400) throw new Error(`Expected 400 for bogus token, got ${bogusRes.status}`);

  // Step 6: Test Attendance Session Locking & Rejection
  console.log(`\n6. Testing Session Locking via POST /api/attendance/sessions/${targetSession._id}/lock...`);
  const lockRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/lock`, {
    method: 'POST',
    headers: facultyHeaders
  });
  const lockData = await lockRes.json();
  if (!lockRes.ok) throw new Error(`Failed to lock session: ${JSON.stringify(lockData)}`);
  console.log(`   Session is now locked: isLocked=${lockData.data.isLocked}`);

  console.log('   Attempting direct edit on locked session (expecting 403 Forbidden)...');
  const directEditRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/roster`, {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({ students: updatedStudents })
  });
  console.log(`   Direct edit on locked session HTTP Status: ${directEditRes.status} (Expected 403)`);
  if (directEditRes.status !== 403) throw new Error(`Expected 403 Forbidden, got ${directEditRes.status}`);

  // Step 7: Test Multi-step Correction Approval Workflow (Faculty submission -> HOD review)
  console.log(`\n7. Testing Multi-Step Correction Approval Workflow...`);
  console.log(`   Faculty submitting correction request for student ${updatedStudents[0].rollNo}...`);
  const correctionSubmitRes = await fetch(`${API_BASE}/attendance/sessions/${targetSession._id}/corrections`, {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      studentRollNo: updatedStudents[0].rollNo,
      studentName: updatedStudents[0].name,
      previousStatus: 'Absent',
      newStatus: 'Present',
      reason: 'Physical attendance verified via laboratory seat assignment log.'
    })
  });
  const correctionSubmitData = await correctionSubmitRes.json();
  if (!correctionSubmitRes.ok) throw new Error(`Failed to submit correction: ${JSON.stringify(correctionSubmitData)}`);
  const reqId = correctionSubmitData.data.requestId;
  console.log(`   Correction submitted with requestId: ${reqId}. Status: ${correctionSubmitData.data.status}`);

  console.log(`   HOD querying pending corrections via GET /api/attendance/corrections...`);
  const pendingRes = await fetch(`${API_BASE}/attendance/corrections?status=PENDING`, { headers: adminHeaders });
  const pendingData = await pendingRes.json();
  const targetReq = pendingData.data.find(c => c.requestId === reqId);
  console.log(`   Found pending correction in HOD queue: ${targetReq?.studentRollNo} (${targetReq?.previousStatus} -> ${targetReq?.newStatus})`);

  console.log(`   HOD approving correction with mandatory Audit Reason...`);
  const approveRes = await fetch(`${API_BASE}/attendance/corrections/${reqId}/review`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      action: 'APPROVE',
      auditReason: 'Verified laboratory bench camera footage confirms student physical presence.',
      reviewRemarks: 'Approved with verified lab log.'
    })
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok) throw new Error(`Failed to approve correction: ${JSON.stringify(approveData)}`);
  console.log(`   Correction Approval Success: Status=${approveData.data.status}. ReviewedBy=${approveData.data.reviewedByEmail}`);

  // Step 8: Test Dynamic Attendance Forecasting Engine (AICTE 75% standard)
  console.log(`\n8. Testing Dynamic Attendance Forecasting Engine...`);
  const forecastRes = await fetch(`${API_BASE}/attendance/forecast/22CS082`, { headers: facultyHeaders });
  const forecastData = await forecastRes.json();
  if (!forecastRes.ok) throw new Error(`Failed to fetch forecast: ${JSON.stringify(forecastData)}`);
  const f = forecastData.data;
  console.log(`   Student: ${f.studentRollNo} | Attended: ${f.totalClassesAttended}/${f.totalClassesHeld} (${f.currentPercentage}%)`);
  console.log(`   Statutory Target: ${f.targetThreshold}% | Above Target: ${f.isAboveTarget}`);
  console.log(`   Safe Classes Can Miss: ${f.classesCanMiss} | Recovery Classes Needed: ${f.classesNeededToTarget}`);
  console.log(`   Subject Breakdown:`, f.subjects.map(s => `[${s.code}]: ${s.percentage}% (${s.attended}/${s.held})`).join(', '));

  // Step 9: Test Anomaly Detection Feed
  console.log(`\n9. Testing Attendance Anomaly Feed via GET /api/attendance/anomalies...`);
  const anomRes = await fetch(`${API_BASE}/attendance/anomalies`, { headers: adminHeaders });
  const anomData = await anomRes.json();
  console.log(`   Retrieved ${anomData.data.length} anomalies across records.`);

  // Step 10: Test Phase 2 Sync Validation (Faculty Class Authorization)
  console.log(`\n10. Testing Phase 2 Offline Sync Validation for Attendance Authorization...`);
  console.log('    Attempting to push attendance mutation for UNAUTHORIZED class ME-3B with faculty credentials...');
  const syncUnauthorizedRes = await fetch(`${API_BASE}/v1/sync/push`, {
    method: 'POST',
    headers: facultyHeaders,
    body: JSON.stringify({
      mutations: [
        {
          operationId: 'op_unauthorized_test_' + Date.now(),
          entityType: 'attendanceRecords',
          entityId: 'att_me3b_test_01',
          operationType: 'CREATE',
          payload: {
            classId: 'ME-3B', // Faculty is CSE, not Mechanical!
            subjectCode: 'ME301',
            date: '2026-10-25',
            presentCount: 50,
            absentCount: 10
          },
          baseVersion: 1
        }
      ]
    })
  });
  const syncUnauthorizedData = await syncUnauthorizedRes.json();
  const mutResult = syncUnauthorizedData.data.results[0];
  console.log(`    Sync Push Status: ${mutResult.status}. Error: "${mutResult.errorMessage}"`);
  if (mutResult.status !== 'failed' || !mutResult.errorMessage.includes('Unauthorized')) {
    throw new Error('Expected sync validation to reject unauthorized class mutation');
  }

  console.log('\n>>> All Phase 4 Attendance Engine, QR Verification, Forecasting & Anomaly verifications PASSED! <<<');
}

runPhase4Verification().catch(err => {
  console.error('Phase 4 verification failed:', err);
  process.exit(1);
});
