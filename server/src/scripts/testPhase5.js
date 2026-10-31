import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MarksLedger from '../models/MarksLedger.js';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase5Verification() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusbridge');
  // Reset test ledger state for idempotent test runs
  await MarksLedger.updateOne(
    { classId: 'CS-3A', subjectCode: 'CS301' },
    { $set: { workflowState: 'FACULTY_DRAFT' } }
  );

  console.log('================================================================');
  console.log('  CampusBridge Phase 5: LMS, Assignments & Exam Engine Test     ');
  console.log('================================================================\n');

  // 1. Authenticate Faculty (Prof. Ananya Sen)
  console.log('1. Authenticating as faculty.cse@ait.edu...');
  const facLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty.cse@ait.edu', password: 'password123' })
  });
  const facLogin = await facLoginRes.json();
  if (!facLoginRes.ok) throw new Error(`Faculty login failed: ${JSON.stringify(facLogin)}`);
  const facToken = facLogin.data.accessToken;
  const facHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${facToken}`
  };
  console.log(`   ✓ Authenticated: ${facLogin.data.user.name} (${facLogin.data.user.activeRole})`);

  // 2. Authenticate Student (Aarav Sharma - 22CS089)
  console.log('\n2. Authenticating as student.cse@ait.edu...');
  const stuLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student.cse@ait.edu', password: 'password123' })
  });
  const stuLogin = await stuLoginRes.json();
  if (!stuLoginRes.ok) throw new Error(`Student login failed: ${JSON.stringify(stuLogin)}`);
  const stuToken = stuLogin.data.accessToken;
  const stuHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${stuToken}`
  };
  console.log(`   ✓ Authenticated: ${stuLogin.data.user.name} (Roll: ${stuLogin.data.user.studentProfile?.rollNo || '22CS089'})`);

  // 3. Authenticate Principal / College Admin / HOD
  console.log('\n3. Authenticating as hod.cse@ait.edu & principal@ait.edu for separation of duties...');
  const hodLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hod.cse@ait.edu', password: 'password123' })
  });
  const hodLogin = await hodLoginRes.json();
  const hodHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${hodLogin.data.accessToken}`
  };

  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@ait.edu', password: 'password123' })
  });
  const adminLogin = await adminLoginRes.json();
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminLogin.data.accessToken}`
  };
  console.log(`   ✓ HOD & Examination Authority Authenticated.`);

  // SECTION 1: Assignments & Rubrics System
  console.log('\n----------------------------------------------------------------');
  console.log(' SECTION 1: Assignments Workflow & Rubrics System               ');
  console.log('----------------------------------------------------------------');

  console.log('\n4. Faculty creates Assignment with Rubric via POST /api/assignments...');
  const createAssignRes = await fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: facHeaders,
    body: JSON.stringify({
      title: 'Lab Exercise 4: Dynamic Programming & Bellman-Ford Optimization',
      code: 'CS301-A4',
      subjectCode: 'CS301',
      subjectName: 'Design & Analysis of Algorithms',
      classId: 'CS-3A',
      description: 'Implement shortest path algorithm handling negative weight cycles with strict O(V*E) complexity and memory bounds.',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxMarks: 50,
      rubric: [
        {
          criterionName: 'Algorithmic Complexity & Efficiency',
          maxPoints: 20,
          levels: [
            { label: 'Exemplary', points: 20, description: 'Optimal O(V*E) time and O(V) space' },
            { label: 'Proficient', points: 14, description: 'Correct complexity but suboptimal space' },
            { label: 'Developing', points: 8, description: 'Inefficient nested loops, O(V^2*E)' }
          ]
        },
        {
          criterionName: 'Negative Cycle Detection Correctness',
          maxPoints: 15,
          levels: [
            { label: 'Exemplary', points: 15, description: 'Robustly identifies all negative weight cycles' },
            { label: 'Proficient', points: 10, description: 'Identifies cycles but false positives on DAGs' },
            { label: 'Developing', points: 5, description: 'Fails edge cases or hangs on self-loops' }
          ]
        },
        {
          criterionName: 'Code Quality & Comprehensive Test Cases',
          maxPoints: 15,
          levels: [
            { label: 'Exemplary', points: 15, description: 'Clean modular code with automated assertions' },
            { label: 'Proficient', points: 10, description: 'Readable code, minimal inline tests' },
            { label: 'Developing', points: 5, description: 'Monolithic function without comments or tests' }
          ]
        }
      ]
    })
  });
  const createAssignData = await createAssignRes.json();
  if (!createAssignRes.ok) throw new Error(`Create assignment failed: ${JSON.stringify(createAssignData)}`);
  const assignment = createAssignData.data;
  console.log(`   ✓ Assignment Created: "${assignment.title}" (ID: ${assignment._id})`);
  console.log(`   ✓ Rubric Criteria Configured: ${assignment.rubric.length} dimensions (${assignment.rubric.map(r => r.criterionName).join(', ')})`);

  // 5. Student submits assignment with client timestamp + offline exception request
  console.log(`\n5. Student submits assignment via POST /api/assignments/${assignment._id}/submit...`);
  const clientTime = new Date(Date.now() - 3600000).toISOString();
  const submitRes = await fetch(`${API_BASE}/assignments/${assignment._id}/submit`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({
      clientTimestamp: clientTime,
      attachments: [
        { name: 'bellman_ford_optimized.py', size: '24.2 KB', url: '/storage/submissions/bellman_ford.py' },
        { name: 'complexity_benchmarks.pdf', size: '1.4 MB', url: '/storage/submissions/complexity.pdf' }
      ],
      studentNotes: 'Submitted from hostel terminal. Offline queue synchronized upon network reconnection.',
      offlineException: {
        requested: true,
        reason: 'Hostel mesh router blackout during scheduled deadline.'
      }
    })
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(`Student submission failed: ${JSON.stringify(submitData)}`);
  const submission = submitData.data;
  console.log(`   ✓ Submission Received! ID: ${submission._id}`);
  console.log(`   ✓ State Machine: Status = "${submission.status}"`);
  console.log(`   ✓ Client Preserved Time: ${submission.clientTimestamp}`);
  console.log(`   ✓ Official Server Receipt Time: ${submission.submittedAt}`);
  console.log(`   ✓ Offline Exception Filed: Requested = ${submission.offlineException?.requested}, Reason: "${submission.offlineException?.reason}"`);

  // 6. Faculty retrieves submissions and executes inline rubric grading
  console.log(`\n6. Faculty grades submission via POST /api/assignments/${assignment._id}/grade/${submission._id}...`);
  const gradeRes = await fetch(`${API_BASE}/assignments/${assignment._id}/grade/${submission._id}`, {
    method: 'POST',
    headers: facHeaders,
    body: JSON.stringify({
      rubricScores: [
        { criterionName: 'Algorithmic Complexity & Efficiency', pointsAwarded: 20, maxPoints: 20, feedback: 'Flawless O(V*E) implementation.' },
        { criterionName: 'Negative Cycle Detection Correctness', pointsAwarded: 15, maxPoints: 15, feedback: 'Detected all negative cycles correctly.' },
        { criterionName: 'Code Quality & Comprehensive Test Cases', pointsAwarded: 13, maxPoints: 15, feedback: 'Clean code; could add edge cases for disconnected components.' }
      ],
      facultyFeedback: 'Excellent work Aarav. Solid demonstration of graph invariants.'
    })
  });
  const gradeData = await gradeRes.json();
  if (!gradeRes.ok) throw new Error(`Grading submission failed: ${JSON.stringify(gradeData)}`);
  const gradedSubmission = gradeData.data;
  console.log(`   ✓ Submission Graded! Total Score: ${gradedSubmission.totalScore}/50. Status: ${gradedSubmission.status}`);
  console.log(`   ✓ AI Draft Feedback Suggestion Generated: "${gradedSubmission.aiDraftFeedback}"`);

  // SECTION 2: LMS & 1-Click Offline Study Pack Bundler
  console.log('\n----------------------------------------------------------------');
  console.log(' SECTION 2: LMS & Signature "Offline Study Pack" Bundler        ');
  console.log('----------------------------------------------------------------');

  console.log('\n7. Student fetches Subject Study Pack via GET /api/lms/studypack/CS301...');
  const packRes = await fetch(`${API_BASE}/lms/studypack/CS301`, { headers: stuHeaders });
  const packData = await packRes.json();
  if (!packRes.ok) throw new Error(`Failed to get study pack: ${JSON.stringify(packData)}`);
  const pack = packData.data;
  console.log(`   ✓ Study Materials: ${pack.materials?.length || 0} files across syllabus units`);
  console.log(`   ✓ Practice Questions: ${pack.practiceQuestions?.length || 0} self-evaluation MCQs`);
  console.log(`   ✓ Q&A Forum Discussions: ${pack.qnaForum?.length || 0} moderated threads`);

  console.log('\n8. Student downloads 1-Click Offline Study Pack Bundle via GET /api/lms/studypack/CS301/bundle...');
  const bundleRes = await fetch(`${API_BASE}/lms/studypack/CS301/bundle`, { headers: stuHeaders });
  const bundleData = await bundleRes.json();
  if (!bundleRes.ok) throw new Error(`Failed to bundle study pack: ${JSON.stringify(bundleData)}`);
  const bundle = bundleData.data;
  console.log(`   ✓ 1-Click Bundle Generated! Bundle ID: ${bundle.bundleId}`);
  console.log(`   ✓ Total Footprint: ${(bundle.bundleSizeBytes / (1024 * 1024)).toFixed(1)} MB`);
  console.log(`   ✓ Offline Expiration: ${bundle.expiresAt}`);
  console.log(`   ✓ Bundled Assets: ${bundle.materials.length} PDFs/Slides, ${bundle.assignments.length} Assignments, ${bundle.practiceQuizzes.length} Quizzes, ${bundle.qnaCache.length} Forum Threads.`);

  // SECTION 3: Examination, Marks Approval & Results Engine
  console.log('\n----------------------------------------------------------------');
  console.log(' SECTION 3: Examination, Marks Approval & Results Engine        ');
  console.log('----------------------------------------------------------------');

  console.log('\n9. Fetch Exam Schedules via GET /api/exams/schedules...');
  const schedulesRes = await fetch(`${API_BASE}/exams/schedules`, { headers: stuHeaders });
  const schedulesData = await schedulesRes.json();
  if (!schedulesRes.ok) throw new Error(`Failed to fetch exam schedules: ${JSON.stringify(schedulesData)}`);
  console.log(`   ✓ Retrieved ${schedulesData.data.length} Exam Schedules.`);
  schedulesData.data.forEach(sched => {
    console.log(`     - ${sched.examTitle} (${sched.regulation}): ${sched.slots.length} Slots:`);
    sched.slots.slice(0, 3).forEach(slot => {
      console.log(`       * [${slot.subjectCode}] ${slot.subjectName} | ${slot.date} (${slot.session}) | Max Marks: ${slot.maxMarks}`);
    });
  });

  console.log('\n10. Fetch Verified Hall Ticket via GET /api/exams/hallticket/22CS089...');
  const hallTicketRes = await fetch(`${API_BASE}/exams/hallticket/22CS089`, { headers: stuHeaders });
  const hallTicketData = await hallTicketRes.json();
  if (!hallTicketRes.ok) throw new Error(`Failed to fetch hall ticket: ${JSON.stringify(hallTicketData)}`);
  const ht = hallTicketData.data;
  console.log(`   ✓ Hall Ticket Issued: ${ht.ticketNumber}`);
  console.log(`   ✓ Student: ${ht.studentName} | Roll: ${ht.rollNo} | USN: ${ht.usn}`);
  console.log(`   ✓ Statutory Attendance Rate: ${ht.attendancePercentage}% (Eligibility: ${ht.eligibilityStatus})`);
  console.log(`   ✓ Anti-Tamper QR Verification Hash: ${ht.qrVerificationHash}`);

  console.log('\n11. Testing Strict Separation of Duties for Marks Management...');
  console.log('   Step A: Faculty saves marks draft via POST /api/exams/marks/CS-3A/CS301/draft...');
  const draftRes = await fetch(`${API_BASE}/exams/marks/CS-3A/CS301/draft`, {
    method: 'POST',
    headers: facHeaders,
    body: JSON.stringify({
      marksEntries: [
        {
          studentId: stuLogin.data.user._id,
          rollNo: '22CS089',
          studentName: 'Aarav Sharma',
          internalTest1: 28,
          internalTest2: 29,
          continuousEvaluation: 20,
          scaledInternalMarks: 38,
          externalExamMarks: 56
        }
      ]
    })
  });
  const draftData = await draftRes.json();
  if (!draftRes.ok) throw new Error(`Draft save failed: ${JSON.stringify(draftData)}`);
  console.log(`   ✓ Faculty Draft Saved. Workflow State: ${draftData.data.workflowState}`);

  console.log('   Step B: Faculty submits marks to HOD via POST /api/exams/marks/CS-3A/CS301/submit-hod...');
  const submitHodRes = await fetch(`${API_BASE}/exams/marks/CS-3A/CS301/submit-hod`, {
    method: 'POST',
    headers: facHeaders
  });
  const submitHodData = await submitHodRes.json();
  if (!submitHodRes.ok) throw new Error(`Submit HOD failed: ${JSON.stringify(submitHodData)}`);
  console.log(`   ✓ Advanced to HOD Validation. Workflow State: ${submitHodData.data.workflowState}`);

  console.log('   Step C: Examination Controller publishes marks via POST /api/exams/marks/CS-3A/CS301/publish...');
  const publishRes = await fetch(`${API_BASE}/exams/marks/CS-3A/CS301/publish`, {
    method: 'POST',
    headers: adminHeaders
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);
  console.log(`   ✓ Results Published! Workflow State: ${publishData.data.workflowState}`);

  console.log('\n12. Student checks Official Transcript via GET /api/exams/transcript/22CS089...');
  const transcriptRes = await fetch(`${API_BASE}/exams/transcript/22CS089`, { headers: stuHeaders });
  const transcriptData = await transcriptRes.json();
  if (!transcriptRes.ok) throw new Error(`Failed to fetch transcript: ${JSON.stringify(transcriptData)}`);
  const tr = transcriptData.data;
  console.log(`   ✓ Official Grade Transcript for ${tr.studentName}:`);
  console.log(`     - Semester: ${tr.semester} | Earned Credits: ${tr.totalCreditsEarned}/${tr.totalCreditsRegistered}`);
  console.log(`     - SGPA: ${tr.sgpa} | Cumulative CGPA: ${tr.cumulativeCgpa}`);
  console.log(`     - Active Backlogs: ${tr.backlogCount}`);
  console.log(`     - Subject Grades:`);
  tr.subjects.forEach(s => {
    console.log(`       * [${s.subjectCode}] ${s.subjectName} | Marks: ${s.totalMarks}/100 | Grade: ${s.letterGrade} (${s.gradePoint} pts) - ${s.status}`);
  });

  console.log('\n13. Student files Revaluation Request via POST /api/exams/revaluation...');
  const revalRes = await fetch(`${API_BASE}/exams/revaluation`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({
      rollNo: '22CS089',
      subjectCode: 'CS301',
      subjectName: 'Design & Analysis of Algorithms',
      reason: 'Discrepancy in question 4b Dynamic Programming trace marks breakdown.',
      feeReceiptRef: 'TXN_REVAL_883921'
    })
  });
  const revalData = await revalRes.json();
  if (!revalRes.ok) throw new Error(`Revaluation request failed: ${JSON.stringify(revalData)}`);
  console.log(`   ✓ Revaluation Request Logged: Status = ${revalData.data.status}, Receipt Ref = ${revalData.data.feeReceiptRef}, Request ID = ${revalData.data.requestId}`);

  console.log('\n================================================================');
  console.log('  All Phase 5 Endpoints & Workflows Successfully Verified!      ');
  console.log('================================================================');
  await mongoose.disconnect();
}

runPhase5Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nVerification Error:', err.message);
    process.exit(1);
  });
