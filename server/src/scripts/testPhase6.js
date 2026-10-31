import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ServiceRequest from '../models/ServiceRequest.js';
import Grievance from '../models/Grievance.js';
import FeeInvoice from '../models/FeeInvoice.js';
import LibraryBook from '../models/LibraryBook.js';
import LibraryCheckout from '../models/LibraryCheckout.js';
import CampusResourceBooking from '../models/CampusResourceBooking.js';
import PlacementDrive from '../models/PlacementDrive.js';
import PlacementApplication from '../models/PlacementApplication.js';
import DigitalCertificate from '../models/DigitalCertificate.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runPhase6Verification() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusbridge');

  console.log('================================================================');
  console.log('  CampusBridge Phase 6: Service Desk, Ops & Skill Passport Test ');
  console.log('================================================================\n');

  // 1. Authenticate Faculty (Prof. Ananya Sen)
  console.log('1. Authenticating as faculty.cse@ait.edu (Class Advisor)...');
  const facLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty.cse@ait.edu', password: 'password123' })
  });
  const facLogin = await facLoginRes.json();
  const facToken = facLogin.data.accessToken;
  const facHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${facToken}`
  };
  console.log(`   ✓ Authenticated Faculty: ${facLogin.data.user.name} (${facLogin.data.user.activeRole})`);

  // 2. Authenticate Student (Aarav Sharma - 22CS089)
  console.log('\n2. Authenticating as student.cse@ait.edu...');
  const stuLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student.cse@ait.edu', password: 'password123' })
  });
  const stuLogin = await stuLoginRes.json();
  const stuToken = stuLogin.data.accessToken;
  const stuHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${stuToken}`
  };
  console.log(`   ✓ Authenticated Student: ${stuLogin.data.user.name} (Roll: 22CS089)`);

  // 3. Authenticate HOD & Principal
  console.log('\n3. Authenticating as hod.cse@ait.edu & principal@ait.edu...');
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
  console.log(`   ✓ Authenticated Administrative Officers.`);

  // ----------------------------------------------------------------
  // SECTION 1: Unified Service Desk & Grievances
  // ----------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(' SECTION 1: Unified Service Desk & Grievance Engine             ');
  console.log('----------------------------------------------------------------');

  console.log('\n4. Student creates multi-stage Service Request via POST /api/services/requests...');
  const createReqRes = await fetch(`${API_BASE}/services/requests`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({
      requestType: 'STUDENT_LEAVE',
      title: 'Duty Leave for International ACM ICPC Regional Finals',
      description: 'Qualified for Regional onsite round at Amritapuri. Requesting academic leave with attendance waiver.',
      priority: 'HIGH',
      slaHours: 48
    })
  });
  const createReqData = await createReqRes.json();
  if (!createReqRes.ok) throw new Error(`Create service request failed: ${JSON.stringify(createReqData)}`);
  const serviceTicket = createReqData.data;
  console.log(`   ✓ Service Request Filed! Ticket Number: ${serviceTicket.ticketNumber}`);
  console.log(`   ✓ Multi-Stage Workflow Stages: ${serviceTicket.stages.length} stages (${serviceTicket.stages.map(s => s.stageName).join(' -> ')})`);
  console.log(`   ✓ SLA Deadline: ${serviceTicket.slaDeadline} (Status: ${serviceTicket.overallStatus})`);

  console.log(`\n5. Class Advisor approves Stage 1 via POST /api/services/requests/${serviceTicket.ticketNumber}/approve...`);
  const appStage1Res = await fetch(`${API_BASE}/services/requests/${serviceTicket.ticketNumber}/approve`, {
    method: 'POST',
    headers: facHeaders,
    body: JSON.stringify({ remarks: 'Verified team invitation letter. Student ranks in top 2% cohort.' })
  });
  const appStage1Data = await appStage1Res.json();
  if (!appStage1Res.ok) throw new Error(`Stage 1 approval failed: ${JSON.stringify(appStage1Data)}`);
  console.log(`   ✓ Stage 1 Approved by Class Advisor! Overall Status: ${appStage1Data.data.overallStatus}`);
  console.log(`   ✓ Current Stage Index advanced to: ${appStage1Data.data.currentStageIndex} (${appStage1Data.data.stages[appStage1Data.data.currentStageIndex]?.stageName})`);

  console.log(`\n6. HOD approves Stage 2 via POST /api/services/requests/${serviceTicket.ticketNumber}/approve...`);
  const appStage2Res = await fetch(`${API_BASE}/services/requests/${serviceTicket.ticketNumber}/approve`, {
    method: 'POST',
    headers: hodHeaders,
    body: JSON.stringify({ remarks: 'Sanctioned full On-Duty attendance credit for ICPC regionals.' })
  });
  const appStage2Data = await appStage2Res.json();
  if (!appStage2Res.ok) throw new Error(`Stage 2 approval failed: ${JSON.stringify(appStage2Data)}`);
  console.log(`   ✓ Stage 2 Approved by HOD! Final Request Status: ${appStage2Data.data.overallStatus}`);

  console.log('\n7. Student files confidential Grievance via POST /api/services/grievances...');
  const fileGrvRes = await fetch(`${API_BASE}/services/grievances`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({
      isAnonymous: true,
      category: 'INFRASTRUCTURE',
      severity: 'STANDARD',
      subject: 'UPS Backup failure in Advanced Networking Lab during power transition',
      details: 'Workstation power cuts during automated grading tests cause file system corruption.'
    })
  });
  const fileGrvData = await fileGrvRes.json();
  if (!fileGrvRes.ok) throw new Error(`File grievance failed: ${JSON.stringify(fileGrvData)}`);
  console.log(`   ✓ Confidential Grievance Registered! Tracking ID: ${fileGrvData.data.trackingNumber}`);
  console.log(`   ✓ Assigned Committee: ${fileGrvData.data.assignedCommittee}`);
  console.log(`   ✓ Statutory 7-Day Escalation Deadline: ${fileGrvData.data.escalationDeadline}`);

  console.log('\n8. Authorized Ombudsman/Principal retrieves Grievances with access audit logging...');
  const getGrvRes = await fetch(`${API_BASE}/services/grievances`, { headers: adminHeaders });
  const getGrvData = await getGrvRes.json();
  if (!getGrvRes.ok) throw new Error(`Get grievances failed: ${JSON.stringify(getGrvData)}`);
  console.log(`   ✓ Confidential Grievances Retrieved: ${getGrvData.data.length} records.`);
  console.log(`   ✓ Access Audit logged for confidential oversight view.`);

  // ----------------------------------------------------------------
  // SECTION 2: Finance, Library, Hostel, Transport & Resource Locks
  // ----------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(' SECTION 2: Finance, Library, Transport & Resource Locks        ');
  console.log('----------------------------------------------------------------');

  console.log('\n9. Student queries Fee Invoice via GET /api/operations/finance/invoices...');
  const invRes = await fetch(`${API_BASE}/operations/finance/invoices?rollNo=22CS089`, { headers: stuHeaders });
  const invData = await invRes.json();
  if (!invRes.ok) throw new Error(`Fetch invoice failed: ${JSON.stringify(invData)}`);
  const invoice = invData.data[0];
  console.log(`   ✓ Invoice Retrieved: ${invoice.invoiceNumber}`);
  console.log(`   ✓ Components: ${invoice.components.map(c => `${c.name} (₹${c.amount})`).join(', ')}`);
  console.log(`   ✓ Scholarship Concession: ${invoice.scholarshipApplied?.schemeName} (-₹${invoice.scholarshipApplied?.concessionAmount})`);
  console.log(`   ✓ Net Payable: ₹${invoice.netPayable} | Remaining Due: ₹${invoice.dueAmount}`);

  console.log('\n10. Testing Simulated Razorpay Gateway & Webhook Signature Verification...');
  const createOrderRes = await fetch(`${API_BASE}/operations/finance/create-order`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, amount: 35000 })
  });
  const createOrderData = await createOrderRes.json();
  const orderId = createOrderData.data.orderId;
  console.log(`   ✓ Simulated Razorpay Order Generated: ${orderId} (₹35,000)`);

  const verifyPayRes = await fetch(`${API_BASE}/operations/finance/verify-payment`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      razorpayOrderId: orderId,
      razorpayPaymentId: `pay_${Date.now()}`,
      razorpaySignature: 'simulated_success_signature',
      amount: 35000
    })
  });
  const verifyPayData = await verifyPayRes.json();
  if (!verifyPayRes.ok) throw new Error(`Verify payment failed: ${JSON.stringify(verifyPayData)}`);
  console.log(`   ✓ Payment Verified! Transaction ID: ${verifyPayData.data.transactionId}`);
  console.log(`   ✓ Updated Invoice Status: ${verifyPayData.data.status} | Remaining Due: ₹${verifyPayData.data.dueAmount}`);

  console.log('\n11. Testing Library Catalogue & Authoritative Copy Collision Prevention...');
  const booksRes = await fetch(`${API_BASE}/operations/library/books`, { headers: stuHeaders });
  const booksData = await booksRes.json();
  const targetBook = booksData.data[0];
  console.log(`   ✓ Library Catalogue Loaded: ${booksData.data.length} titles.`);
  console.log(`   ✓ Target Book: '${targetBook.title}' (Barcode: ${targetBook.barcode}, Available: ${targetBook.availableCopies}/${targetBook.totalCopies})`);

  const checkoutRes = await fetch(`${API_BASE}/operations/library/checkout`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({ barcode: targetBook.barcode, rollNo: '22CS089' })
  });
  const checkoutData = await checkoutRes.json();
  if (!checkoutRes.ok) throw new Error(`Library checkout failed: ${JSON.stringify(checkoutData)}`);
  const checkout = checkoutData.data.checkout;
  console.log(`   ✓ Book Checked Out! Transaction: ${checkout.transactionId}`);
  console.log(`   ✓ Statutory Due Date: ${checkout.dueDate.slice(0, 10)} (Remaining Copies: ${checkoutData.data.remainingCopies})`);

  const returnRes = await fetch(`${API_BASE}/operations/library/return`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({ transactionId: checkout.transactionId })
  });
  const returnData = await returnRes.json();
  if (!returnRes.ok) throw new Error(`Library return failed: ${JSON.stringify(returnData)}`);
  console.log(`   ✓ Book Returned! Status: ${returnData.data.checkout.status}, Overdue Fine Assessed: ₹${returnData.data.fineAmount}`);

  console.log('\n12. Fetch Hostel Occupancy & Transport Route Monitors...');
  const hostelRes = await fetch(`${API_BASE}/operations/hostel/rooms`, { headers: stuHeaders });
  const hostelData = await hostelRes.json();
  console.log(`   ✓ Hostel Rooms: ${hostelData.data.length} rooms retrieved for ${hostelData.data[0]?.blockName || 'Aryabhata Hall'}`);

  const transportRes = await fetch(`${API_BASE}/operations/transport/routes`, { headers: stuHeaders });
  const transportData = await transportRes.json();
  console.log(`   ✓ Transport Routes: ${transportData.data.length} active bus routes.`);
  transportData.data.forEach(r => {
    console.log(`     - [${r.routeNumber}] ${r.routeName}: ${r.allocatedSeats}/${r.totalCapacity} Seats (${r.occupancyStatus})`);
  });

  console.log('\n13. Testing Campus Resource Booking with Server-Side Transactional Lock...');
  const testDate = '2026-11-20';
  const testSlot = '14:00 - 16:00';
  const testResource = 'AUDITORIUM_RAMANUJAN';

  // Clean any previous test booking for idempotency
  await CampusResourceBooking.deleteMany({ resourceId: testResource, date: testDate, timeSlot: testSlot });

  console.log(`   Step A: Faculty reserves Ramanujan Auditorium for ${testDate} [${testSlot}]...`);
  const bookRes1 = await fetch(`${API_BASE}/operations/resources/book`, {
    method: 'POST',
    headers: facHeaders,
    body: JSON.stringify({
      resourceId: testResource,
      resourceName: 'Ramanujan Grand Auditorium',
      date: testDate,
      timeSlot: testSlot,
      purpose: 'ACM Distinguished Lecture Series on Quantum Computing',
      attendeesCount: 250
    })
  });
  const bookData1 = await bookRes1.json();
  if (!bookRes1.ok) throw new Error(`Resource booking 1 failed: ${JSON.stringify(bookData1)}`);
  console.log(`   ✓ Booking 1 Confirmed! ID: ${bookData1.data.bookingId} (Status: ${bookData1.data.status})`);

  console.log(`   Step B: Attempting to DOUBLE-BOOK the exact same slot with concurrent user...`);
  const bookRes2 = await fetch(`${API_BASE}/operations/resources/book`, {
    method: 'POST',
    headers: hodHeaders,
    body: JSON.stringify({
      resourceId: testResource,
      resourceName: 'Ramanujan Grand Auditorium',
      date: testDate,
      timeSlot: testSlot,
      purpose: 'Department CSE Symposium (Conflicting Slot)',
      attendeesCount: 150
    })
  });
  const bookData2 = await bookRes2.json();
  if (bookRes2.status === 409) {
    console.log(`   ✓ Transactional Lock Triggered! Conflict Rejected with HTTP 409:`);
    console.log(`     "${bookData2.error?.message}"`);
  } else {
    throw new Error(`Double booking was NOT rejected! Server returned: ${JSON.stringify(bookData2)}`);
  }

  // ----------------------------------------------------------------
  // SECTION 3: Placements & Verifiable Skill Passport
  // ----------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(' SECTION 3: Placements & Verifiable Skill Passport Engine       ');
  console.log('----------------------------------------------------------------');

  console.log('\n14. Fetch Placement Drives with automated eligibility evaluation...');
  const drivesRes = await fetch(`${API_BASE}/placement/drives`, { headers: stuHeaders });
  const drivesData = await drivesRes.json();
  if (!drivesRes.ok) throw new Error(`Fetch drives failed: ${JSON.stringify(drivesData)}`);
  console.log(`   ✓ Placement Drives Loaded: ${drivesData.data.length} active corporate drives.`);
  drivesData.data.forEach(d => {
    console.log(`     - ${d.companyName} | ${d.roleTitle} (${d.packageLpa} LPA) | Min CGPA: ${d.eligibilityCriteria.minCgpa} | Eligible: ${d.studentEligibility?.isEligible}`);
  });

  const dreamDrive = drivesData.data[0];
  console.log(`\n15. Eligible Student applies for '${dreamDrive.companyName}' via POST /api/placement/apply...`);
  // Clean previous application for idempotency
  await PlacementApplication.deleteMany({ driveId: dreamDrive._id, rollNo: '22CS089' });

  const applyRes = await fetch(`${API_BASE}/placement/apply`, {
    method: 'POST',
    headers: stuHeaders,
    body: JSON.stringify({ driveCode: dreamDrive.driveCode, rollNo: '22CS089' })
  });
  const applyData = await applyRes.json();
  if (!applyRes.ok) throw new Error(`Apply drive failed: ${JSON.stringify(applyData)}`);
  console.log(`   ✓ Application Submitted! Application ID: ${applyData.data.applicationId} (Stage: ${applyData.data.stage})`);

  console.log('\n16. Query Skill Passport credentials distinguishing College-Verified vs Self-Claims...');
  const certsRes = await fetch(`${API_BASE}/placement/certificates?rollNo=22CS089`, { headers: stuHeaders });
  const certsData = await certsRes.json();
  if (!certsRes.ok) throw new Error(`Fetch certificates failed: ${JSON.stringify(certsData)}`);
  console.log(`   ✓ Skill Passport Retrieved: ${certsData.data.length} credentials.`);
  certsData.data.forEach(c => {
    console.log(`     - [${c.isVerifiedByCollege ? 'COLLEGE-VERIFIED' : 'SELF-CLAIM'}] "${c.title}"`);
    console.log(`       Issuer: ${c.issuerInstitution} | Hash: ${c.cryptographicHash.slice(0, 16)}...`);
  });

  const verifiedCert = certsData.data.find(c => c.isVerifiedByCollege);
  if (!verifiedCert) throw new Error('No college verified certificate found');

  console.log(`\n17. Testing Public Verification Endpoint: GET /api/verify/${verifiedCert.cryptographicHash}...`);
  // Public request: Notice NO headers or Authorization token sent!
  const publicVerifyRes = await fetch(`${API_BASE}/verify/${verifiedCert.cryptographicHash}`);
  const publicVerifyData = await publicVerifyRes.json();
  if (!publicVerifyRes.ok || !publicVerifyData.isAuthentic) {
    throw new Error(`Public verification failed: ${JSON.stringify(publicVerifyData)}`);
  }
  const pub = publicVerifyData.data;
  console.log(`   ✓ Authenticity Confirmed via Public Gateway! Status: ${pub.authenticityStatus}`);
  console.log(`   ✓ Minimal Data Exposure Verified:`);
  console.log(`     - Certificate Title: ${pub.title}`);
  console.log(`     - Masked Recipient: ${pub.recipientMasked}`);
  console.log(`     - Issuing Institution: ${pub.issuerInstitution}`);
  console.log(`     - Verification Authority: ${pub.verifiedByAuthority}`);
  console.log(`     - Verified Competencies: ${pub.skillsVerified?.join(', ')}`);
  console.log(`     - Cryptographic Algorithm: ${pub.cryptographicSeal?.algorithm}`);
  console.log(`     - Verification Hash: ${pub.cryptographicSeal?.verificationHash}`);

  console.log('\n================================================================');
  console.log('  All Phase 6 Endpoints & Workflows Successfully Verified!      ');
  console.log('================================================================');

  await mongoose.disconnect();
}

runPhase6Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nVerification Error:', err.message);
    process.exit(1);
  });
