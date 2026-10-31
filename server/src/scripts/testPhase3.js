import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase3Verification() {
  console.log('--- Starting CampusBridge Phase 3 Automated Verification ---');

  // Step 1: Login as Principal to obtain JWT
  console.log('1. Authenticating as principal@ait.edu...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@ait.edu', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  const token = loginData.data.accessToken;
  console.log('   Authenticated successfully. User:', loginData.data.user.name);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 2: Fetch Departments
  console.log('\n2. Testing GET /api/academic/departments...');
  const deptRes = await fetch(`${API_BASE}/academic/departments`, { headers: authHeaders });
  const deptData = await deptRes.json();
  if (!deptRes.ok) throw new Error(`Failed to fetch departments: ${JSON.stringify(deptData)}`);
  console.log(`   Found ${deptData.data.length} departments:`, deptData.data.map(d => `${d.code} (${d.name})`).join(', '));
  if (deptData.data.length === 0) throw new Error('Expected departments to be seeded');

  // Step 3: Fetch Curriculum Velocity
  console.log('\n3. Testing GET /api/academic/curriculum-velocity...');
  const velRes = await fetch(`${API_BASE}/academic/curriculum-velocity`, { headers: authHeaders });
  const velData = await velRes.json();
  if (!velRes.ok) throw new Error(`Failed to fetch velocity: ${JSON.stringify(velData)}`);
  console.log(`   Found ${velData.data.subjects.length} subjects in velocity metrics (Department: ${velData.data.department}):`);
  velData.data.subjects.forEach(s => {
    console.log(`   - [${s.code}] ${s.name}: ${s.completedTopics}/${s.totalTopics} topics (${s.actualProgress}%). Target: ${s.targetMilestone}%. Velocity: ${s.status}`);
  });
  if (velData.data.subjects.length === 0) throw new Error('Expected subjects in velocity tracker');

  // Step 4: Fetch Subject Details & Toggle Topic
  console.log('\n4. Testing Subject details & topic progress toggle on CS301...');
  const subRes = await fetch(`${API_BASE}/academic/subjects/CS301`, { headers: authHeaders });
  const subData = await subRes.json();
  const subject = subData.data;
  console.log(`   Subject: ${subject.name} (Units: ${subject.syllabusUnits.length})`);
  
  // Pick a topic from Unit 1
  const unit1 = subject.syllabusUnits[0];
  const targetTopic = unit1.topics[1]; // second topic
  const initialStatus = targetTopic.isCompleted;
  console.log(`   Target topic: [${targetTopic.topicId}] "${targetTopic.name}" (current status: ${initialStatus})`);

  const toggleRes = await fetch(`${API_BASE}/academic/subjects/CS301/topics/${targetTopic.topicId}/toggle`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ isCompleted: !initialStatus, notes: 'Automated test verification checkoff' })
  });
  const toggleData = await toggleRes.json();
  if (!toggleRes.ok) throw new Error(`Failed to toggle topic: ${JSON.stringify(toggleData)}`);
  console.log(`   Toggle response: Status=${toggleRes.status}, New Syllabus Progress=${toggleData.data.syllabusProgress}%`);
  console.log(`   Topic isCompleted is now:`, toggleData.data.isCompleted);

  // Re-toggle back to preserve initial seed state
  await fetch(`${API_BASE}/academic/subjects/CS301/topics/${targetTopic.topicId}/toggle`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ isCompleted: initialStatus })
  });
  console.log('   Reverted topic status back for consistency.');

  // Step 5: Test Student Cohort Querying
  console.log('\n5. Testing GET /api/academic/student-cohorts?classId=CS-3A...');
  const studRes = await fetch(`${API_BASE}/academic/student-cohorts?classId=CS-3A`, { headers: authHeaders });
  const studData = await studRes.json();
  if (!studRes.ok) throw new Error(`Failed to fetch student cohorts: ${JSON.stringify(studData)}`);
  console.log(`   Found ${studData.data.students.length} students in section ${studData.data.activeCohort}:`);
  studData.data.students.slice(0, 3).forEach(st => {
    console.log(`   - ${st.name} | USN: ${st.studentProfile?.usn} | Roll: ${st.studentProfile?.rollNo} | GPA: ${st.studentProfile?.currentGPA}`);
  });

  // Step 6: Test Class Timetable Retrieval
  console.log('\n6. Testing GET /api/timetable/class/CS-3A...');
  const ttRes = await fetch(`${API_BASE}/timetable/class/CS-3A`, { headers: authHeaders });
  const ttData = await ttRes.json();
  console.log(`   Retrieved timetable for ${ttData.data.classId} (${ttData.data.slots.length} total weekly slots across days: ${[...new Set(ttData.data.slots.map(s => s.dayOfWeek))].join(', ')})`);

  // Step 7: Test Timetable Conflict Detection Engine
  console.log('\n7. Testing Smart Timetable Conflict Engine (Double Booking Prevention)...');
  const existingSlot = ttData.data.slots[0];
  console.log(`   Existing slot: Day=${existingSlot.dayOfWeek}, Period=${existingSlot.periodNumber}, Faculty=${existingSlot.facultyName}, Room=${existingSlot.room}`);

  // Attempt to schedule a conflicting slot in another section (CS-3B) with the SAME faculty at the SAME period
  console.log('   Attempting to double-book faculty in section CS-3B at same day & period...');
  const conflictFacultyRes = await fetch(`${API_BASE}/timetable/slot`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      classId: 'CS-3B',
      dayOfWeek: existingSlot.dayOfWeek,
      periodNumber: existingSlot.periodNumber,
      startTime: existingSlot.startTime,
      endTime: existingSlot.endTime,
      subjectCode: 'CS302',
      subjectName: 'Operating Systems & Kernels',
      facultyId: existingSlot.facultyId,
      facultyName: existingSlot.facultyName,
      room: 'LH-305', // Different room, but same faculty
      type: 'theory'
    })
  });
  console.log(`   Faculty clash check HTTP Status: ${conflictFacultyRes.status}`);
  const conflictFacultyData = await conflictFacultyRes.json();
  console.log(`   Clash error message: "${conflictFacultyData.error?.message || conflictFacultyData.error}"`);
  if (conflictFacultyRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for faculty clash, got ${conflictFacultyRes.status}`);
  }

  // Attempt to book the SAME ROOM with different faculty
  console.log('   Attempting to double-book room ' + existingSlot.room + ' in section CS-3B at same day & period...');
  const conflictRoomRes = await fetch(`${API_BASE}/timetable/slot`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      classId: 'CS-3B',
      dayOfWeek: existingSlot.dayOfWeek,
      periodNumber: existingSlot.periodNumber,
      startTime: existingSlot.startTime,
      endTime: existingSlot.endTime,
      subjectCode: 'CS302',
      subjectName: 'Operating Systems & Kernels',
      facultyId: '6addc47086722b320066164d', // Different faculty
      facultyName: 'Dr. Vasundhara Sen',
      room: existingSlot.room, // Same room!
      type: 'theory'
    })
  });
  console.log(`   Room clash check HTTP Status: ${conflictRoomRes.status}`);
  const conflictRoomData = await conflictRoomRes.json();
  console.log(`   Clash error message: "${conflictRoomData.error?.message || conflictRoomData.error}"`);
  if (conflictRoomRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for room clash, got ${conflictRoomRes.status}`);
  }

  // Attempt a valid non-conflicting slot (e.g. Saturday period 1)
  console.log('   Testing valid non-conflicting slot creation on Saturday...');
  const validRes = await fetch(`${API_BASE}/timetable/slot`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      classId: 'CS-3B',
      dayOfWeek: 'Saturday',
      periodNumber: 1,
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      subjectCode: 'CS305',
      subjectName: 'Database Management Systems Laboratory',
      facultyId: existingSlot.facultyId,
      facultyName: existingSlot.facultyName,
      room: 'CS-LAB-2',
      type: 'lab'
    })
  });
  console.log(`   Valid slot creation HTTP Status: ${validRes.status}`);
  const validData = await validRes.json();
  console.log(`   Valid slot message: "${validData.message}"`);
  if (validRes.status !== 200) {
    throw new Error(`Expected 200 OK for valid slot, got ${validRes.status}`);
  }

  console.log('\n>>> All Phase 3 Academic, Curriculum, and Smart Timetable verifications PASSED! <<<');
}

runPhase3Verification().catch(err => {
  console.error('Phase 3 verification failed:', err);
  process.exit(1);
});
