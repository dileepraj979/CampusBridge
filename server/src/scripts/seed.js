import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import College from '../models/College.js';
import Role, { BLUEPRINT_ROLES } from '../models/Role.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Device from '../models/Device.js';
import logger from '../config/logger.js';

dotenv.config();

const ROLES_SEED_DATA = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Universal platform-wide authority, cross-tenant management',
    hierarchyLevel: 1,
    scopeLevel: 'global',
    permissions: ['*']
  },
  {
    code: 'COLLEGE_ADMIN',
    name: 'College Administrator',
    description: 'Full institutional governance, college-level user and role provisioning',
    hierarchyLevel: 2,
    scopeLevel: 'college',
    permissions: [
      'college:manage', 'users:create', 'users:read', 'users:update', 'users:assign_role',
      'audit:read', 'devices:manage', 'academic:configure', 'attendance:override'
    ]
  },
  {
    code: 'PRINCIPAL',
    name: 'Principal / Dean',
    description: 'Executive academic & administrative leadership, campus-wide monitoring',
    hierarchyLevel: 3,
    scopeLevel: 'college',
    permissions: [
      'campus:analytics', 'faculty:view', 'students:view', 'accreditation:manage',
      'audit:read', 'attendance:read_all', 'finance:summary_read', 'notices:publish'
    ]
  },
  {
    code: 'HOD',
    name: 'Head of Department',
    description: 'Departmental curriculum, faculty workload allocation, student performance',
    hierarchyLevel: 4,
    scopeLevel: 'department',
    permissions: [
      'department:manage', 'department:faculty_read', 'department:students_read',
      'curriculum:track', 'attendance:department_read', 'timetables:approve', 'offline_sync:monitor'
    ]
  },
  {
    code: 'FACULTY',
    name: 'Professor / Lecturer',
    description: 'Course delivery, lecture logging, zero-latency offline attendance, grading',
    hierarchyLevel: 5,
    scopeLevel: 'class',
    permissions: [
      'attendance:mark_offline', 'attendance:mark_online', 'attendance:read',
      'course:manage_content', 'assignments:grade', 'students:read_assigned'
    ]
  },
  {
    code: 'CLASS_ADVISOR',
    name: 'Class Advisor / Proctor',
    description: 'Mentorship of specific student cohort, attendance tracking, parent communication',
    hierarchyLevel: 6,
    scopeLevel: 'class',
    permissions: [
      'class:monitor', 'attendance:class_read', 'attendance:bunk_alert',
      'mentorship:log', 'parent:communicate'
    ]
  },
  {
    code: 'STUDENT',
    name: 'Undergraduate / Postgraduate Student',
    description: 'Attendance tracking, safe-bunk forecasting, offline study packs, fee payment',
    hierarchyLevel: 7,
    scopeLevel: 'personal',
    permissions: [
      'student:view_self', 'attendance:view_self', 'study_packs:cache_offline',
      'assignments:submit', 'grades:view_self', 'fees:pay'
    ]
  },
  {
    code: 'PARENT',
    name: 'Parent / Guardian',
    description: 'Ward performance tracking, attendance alerts, proctor teleconference',
    hierarchyLevel: 8,
    scopeLevel: 'personal',
    permissions: ['ward:view_attendance', 'ward:view_grades', 'fees:view_dues']
  },
  {
    code: 'EXAM_CONTROLLER',
    name: 'Controller of Examinations',
    description: 'Secrecy section, exam scheduling, hall tickets, mark sheet generation',
    hierarchyLevel: 5,
    scopeLevel: 'college',
    permissions: ['exams:schedule', 'hall_tickets:generate', 'grades:publish', 'revaluation:manage']
  },
  {
    code: 'LIBRARIAN',
    name: 'Head Librarian',
    description: 'RFID & offline catalogue checkout, digital repository, overdue fines',
    hierarchyLevel: 9,
    scopeLevel: 'college',
    permissions: ['library:issue', 'library:return', 'library:catalog', 'library:fines']
  },
  {
    code: 'ACCOUNTANT',
    name: 'Chief Bursar / Accountant',
    description: 'Fee collection reconciliation, scholarship disbursement, payroll audit',
    hierarchyLevel: 9,
    scopeLevel: 'college',
    permissions: ['fees:reconcile', 'payroll:view', 'scholarships:manage', 'invoices:issue']
  },
  {
    code: 'PLACEMENT_OFFICER',
    name: 'Head of Training & Placement',
    description: 'Corporate recruitment drives, eligibility filters, job offers',
    hierarchyLevel: 5,
    scopeLevel: 'college',
    permissions: ['placement:drives_manage', 'placement:eligibility_filter', 'placement:offers_issue']
  },
  {
    code: 'PLACEMENT_RECRUITER',
    name: 'Visiting Corporate Recruiter',
    description: 'Candidate screening, interview scheduling, shortlist submission',
    hierarchyLevel: 10,
    scopeLevel: 'college',
    permissions: ['recruiter:candidates_view', 'recruiter:interviews_conduct', 'recruiter:shortlist']
  },
  {
    code: 'HOSTEL_WARDEN',
    name: 'Chief Hostel Warden',
    description: 'Room allocation, mess management, offline biometric night roll-call',
    hierarchyLevel: 9,
    scopeLevel: 'college',
    permissions: ['hostel:rooms_allocate', 'hostel:roll_call', 'hostel:gate_passes']
  },
  {
    code: 'TRANSPORT_MANAGER',
    name: 'Fleet & Transport Manager',
    description: 'Bus routes, GPS fleet telemetry, student boarding pass validation',
    hierarchyLevel: 9,
    scopeLevel: 'college',
    permissions: ['transport:routes_manage', 'transport:passes_issue', 'transport:telemetry_view']
  },
  {
    code: 'COUNSELOR',
    name: 'Mental Health & Student Counselor',
    description: 'Confidential wellness appointments, psychiatric notes, intervention logs',
    hierarchyLevel: 8,
    scopeLevel: 'college',
    permissions: ['counseling:sessions_manage', 'counseling:notes_confidential']
  },
  {
    code: 'IT_SUPPORT',
    name: 'Network & Systems Engineer',
    description: 'PWA device token provisioning, campus Wi-Fi credentials, sync node monitoring',
    hierarchyLevel: 9,
    scopeLevel: 'college',
    permissions: ['it:devices_register', 'it:sync_nodes_monitor', 'it:credentials_reset']
  },
  {
    code: 'AUDITOR',
    name: 'Compliance & Quality Auditor',
    description: 'Read-only immutable audit trail inspection, NAAC/NBA trace exporter',
    hierarchyLevel: 4,
    scopeLevel: 'college',
    permissions: ['audit:read', 'compliance:export', 'attendance:verify_hash']
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusbridge';
  logger.info(`Connecting to MongoDB for seeding: ${uri}`);

  await mongoose.connect(uri);

  logger.info('--- Clearing Existing Data ---');
  await College.deleteMany({});
  await Role.deleteMany({});
  await User.deleteMany({});
  await Device.deleteMany({});
  await AuditLog.collection.drop().catch(() => {}); // safely drop collection to clear immutable constraints

  logger.info('--- Seeding Roles (All 18 Blueprint Roles) ---');
  const roleDocs = await Role.insertMany(ROLES_SEED_DATA);
  logger.info(`Seeded ${roleDocs.length} blueprint roles successfully.`);

  logger.info('--- Seeding Demo College ---');
  const college = await College.create({
    name: 'Apex Institute of Technology & Science',
    code: 'AIT',
    domain: 'ait.edu',
    address: 'Academic Corridor 4, Knowledge City, Bangalore, KA - 560100',
    logoUrl: '/assets/ait-logo.svg',
    status: 'active',
    departments: [
      { id: 'CSE', name: 'Computer Science & Engineering', code: 'CSE' },
      { id: 'AIML', name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
      { id: 'ECE', name: 'Electronics & Communication Engineering', code: 'ECE' },
      { id: 'MECH', name: 'Mechanical & Automation Engineering', code: 'MECH' },
      { id: 'CIVIL', name: 'Civil & Environmental Engineering', code: 'CIVIL' },
      { id: 'MBA', name: 'Management Studies & Data Analytics', code: 'MBA' }
    ],
    classes: [
      { id: 'CS-1A', name: 'B.Tech CSE - 1st Year (Section A)', departmentId: 'CSE', semester: 1, section: 'A' },
      { id: 'CS-2A', name: 'B.Tech CSE - 2nd Year (Section A)', departmentId: 'CSE', semester: 3, section: 'A' },
      { id: 'CS-3A', name: 'B.Tech CSE - 3rd Year (Section A)', departmentId: 'CSE', semester: 5, section: 'A' },
      { id: 'CS-4A', name: 'B.Tech CSE - 4th Year (Section A)', departmentId: 'CSE', semester: 7, section: 'A' }
    ],
    settings: {
      allowOfflineAttendance: true,
      maxOfflineSyncBufferHours: 72,
      accreditationScore: 3.84,
      academicYear: '2025-2026'
    }
  });
  logger.info(`Seeded College: ${college.name} (${college.code})`);

  logger.info('--- Seeding Users with Fine-Grained RBAC & Scopes ---');
  const defaultPassword = await bcrypt.hash('password123', 10);

  const usersData = [
    {
      name: 'Dr. Christopher Vance',
      email: 'superadmin@campusbridge.edu',
      passwordHash: defaultPassword,
      phone: '+91 98800 11001',
      activeRole: 'SUPER_ADMIN',
      roles: [
        { role: 'SUPER_ADMIN', collegeId: null, departmentId: null, classId: null }
      ],
      tokenVersion: 0,
      status: 'active'
    },
    {
      name: 'Rajesh Mehra',
      email: 'admin@ait.edu',
      passwordHash: defaultPassword,
      phone: '+91 98800 11002',
      activeRole: 'COLLEGE_ADMIN',
      roles: [
        { role: 'COLLEGE_ADMIN', collegeId: college._id, departmentId: null, classId: null },
        { role: 'AUDITOR', collegeId: college._id, departmentId: null, classId: null }
      ],
      tokenVersion: 0,
      status: 'active'
    },
    {
      name: 'Dr. Vasundhara Sen, Ph.D.',
      email: 'principal@ait.edu',
      passwordHash: defaultPassword,
      phone: '+91 98800 11003',
      activeRole: 'PRINCIPAL',
      roles: [
        { role: 'PRINCIPAL', collegeId: college._id, departmentId: null, classId: null },
        { role: 'FACULTY', collegeId: college._id, departmentId: 'CSE', classId: null }
      ],
      tokenVersion: 0,
      status: 'active'
    },
    {
      name: 'Dr. Aris Thorne',
      email: 'hod.cse@ait.edu',
      passwordHash: defaultPassword,
      phone: '+91 98800 11004',
      activeRole: 'HOD',
      roles: [
        { role: 'HOD', collegeId: college._id, departmentId: 'CSE', classId: null },
        { role: 'FACULTY', collegeId: college._id, departmentId: 'CSE', classId: 'CS-3A' }
      ],
      facultyProfile: {
        employeeId: 'EMP-CSE-001',
        designation: 'Professor & Head of Department',
        department: 'CSE',
        subjects: ['Distributed Systems', 'Advanced Algorithms']
      },
      tokenVersion: 0,
      status: 'active'
    },
    {
      name: 'Prof. Ananya Sen',
      email: 'faculty.cse@ait.edu',
      passwordHash: defaultPassword,
      phone: '+91 98800 11005',
      activeRole: 'FACULTY',
      roles: [
        { role: 'FACULTY', collegeId: college._id, departmentId: 'CSE', classId: 'CS-3A' },
        { role: 'CLASS_ADVISOR', collegeId: college._id, departmentId: 'CSE', classId: 'CS-3A' }
      ],
      facultyProfile: {
        employeeId: 'EMP-CSE-042',
        designation: 'Assistant Professor',
        department: 'CSE',
        subjects: ['Design & Analysis of Algorithms', 'Cloud Computing Lab']
      },
      tokenVersion: 0,
      status: 'active'
    },
    {
      name: 'Aarav Sharma',
      email: 'student.cse@ait.edu',
      passwordHash: defaultPassword,
      phone: '+91 98800 11006',
      activeRole: 'STUDENT',
      roles: [
        { role: 'STUDENT', collegeId: college._id, departmentId: 'CSE', classId: 'CS-3A' }
      ],
      studentProfile: {
        rollNo: '22CS089',
        usn: '1AT22CS089',
        semester: 6,
        cgpa: 8.85,
        batch: '2022-2026',
        attendancePercentage: 88.4
      },
      tokenVersion: 0,
      status: 'active'
    }
  ];

  const createdUsers = await User.insertMany(usersData);
  logger.info(`Seeded ${createdUsers.length} initial users across roles.`);

  logger.info('--- Seeding Demo Offline Device ---');
  await Device.create({
    userId: createdUsers[4]._id, // Prof. Ananya Sen
    deviceFingerprint: 'browser_fp_fac_macbook_pro_01',
    deviceName: 'Faculty Air 15" (Classroom Lab)',
    browser: 'Chrome 130 / macOS 15.1',
    os: 'macOS',
    offlineCapabilities: true,
    isTrusted: true,
    cachedStores: [
      { storeName: 'cachedStudents', recordCount: 60, lastCachedAt: new Date() },
      { storeName: 'offlineAttendance', recordCount: 12, lastCachedAt: new Date() }
    ],
    lastSyncAt: new Date()
  });

  logger.info('--- Seeding Initial Immutable Audit Trail ---');
  await AuditLog.create({
    userId: createdUsers[0]._id,
    userEmail: createdUsers[0].email,
    userRole: 'SUPER_ADMIN',
    action: 'INITIAL_SYSTEM_PROVISION',
    entity: 'College',
    entityId: college._id.toString(),
    collegeId: college._id,
    ipAddress: '127.0.0.1',
    userAgent: 'CampusBridge Engine Seeder v1',
    changes: {
      before: null,
      after: { collegeCode: 'AIT', rolesInitialized: 18 }
    },
    status: 'SUCCESS',
    requestId: 'seed-req-001'
  });

  logger.info('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  logger.info('---------------------------------------------');
  logger.info('Demo Credentials (Password: password123):');
  logger.info('• Super Admin   : superadmin@campusbridge.edu');
  logger.info('• College Admin : admin@ait.edu');
  logger.info('• Principal     : principal@ait.edu');
  logger.info('• HOD (CSE)     : hod.cse@ait.edu');
  logger.info('• Faculty (CSE) : faculty.cse@ait.edu');
  logger.info('• Student (CSE) : student.cse@ait.edu');
  logger.info('---------------------------------------------');

  await mongoose.disconnect();
}

seed().catch(err => {
  logger.error('Database seeding failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
