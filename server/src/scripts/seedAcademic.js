import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import College from '../models/College.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

dotenv.config();

async function seedAcademic() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusbridge';
  logger.info(`Connecting to MongoDB for academic seeding: ${uri}`);
  await mongoose.connect(uri);

  const college = await College.findOne({ code: 'AIT' });
  if (!college) {
    throw new Error('College AIT not found. Please run seed.js first.');
  }

  const facultyUser = await User.findOne({ email: 'faculty.cse@ait.edu' });
  const hodUser = await User.findOne({ email: 'hod.cse@ait.edu' });

  logger.info('--- Seeding Departments ---');
  await Department.deleteMany({ collegeId: college._id });
  const deptCse = await Department.create({
    collegeId: college._id,
    name: 'Computer Science & Engineering',
    code: 'CSE',
    hod: hodUser?._id || null,
    vision: 'Pioneering intelligent systems, autonomous algorithms, and distributed computing.',
    establishedYear: 2002,
    intakeCapacity: 180,
    labCount: 8,
    status: 'active'
  });

  const deptAiml = await Department.create({
    collegeId: college._id,
    name: 'Artificial Intelligence & Machine Learning',
    code: 'AIML',
    vision: 'Spearheading cognitive AI, neural architectures, and computational linguistics.',
    establishedYear: 2020,
    intakeCapacity: 120,
    labCount: 6,
    status: 'active'
  });

  const deptEce = await Department.create({
    collegeId: college._id,
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    vision: 'Excellence in VLSI design, embedded IoT networks, and photonics.',
    establishedYear: 2004,
    intakeCapacity: 120,
    labCount: 6,
    status: 'active'
  });

  logger.info('--- Seeding Degree Courses ---');
  await Course.deleteMany({ collegeId: college._id });
  const btechCse = await Course.create({
    collegeId: college._id,
    departmentId: deptCse._id,
    name: 'Bachelor of Technology in Computer Science & Engineering',
    code: 'BTECH-CSE',
    degree: 'B.Tech',
    totalSemesters: 8,
    creditRequirements: 160,
    branchSpecializations: [
      'Artificial Intelligence & Deep Learning',
      'Cyber Security & Cryptography',
      'Cloud Architecture & DevOps'
    ],
    academicRegulations: 'Autonomous CBCS Curriculum 2024 (Outcome-Based Education)'
  });

  logger.info('--- Seeding Subjects & Detailed Syllabus Units ---');
  await Subject.deleteMany({ collegeId: college._id });

  const subjectsData = [
    {
      collegeId: college._id,
      departmentId: deptCse._id,
      departmentCode: 'CSE',
      code: 'CS301',
      name: 'Design & Analysis of Algorithms',
      type: 'theory',
      credits: 4,
      semester: 5,
      assignedFaculty: facultyUser?._id || null,
      prerequisites: ['CS201 Data Structures & Applications'],
      targetMilestoneProgress: 80,
      syllabusUnits: [
        {
          unitNumber: 1,
          title: 'Asymptotic Analysis & Recurrences',
          description: 'Big-O, Omega, Theta notations, Master theorem, recursion tree method',
          estimatedHours: 8,
          topics: [
            { topicId: 'cs301_u1_t1', name: 'Asymptotic Notation and Growth of Functions', isCompleted: true },
            { topicId: 'cs301_u1_t2', name: 'Master Theorem for Divide & Conquer', isCompleted: true },
            { topicId: 'cs301_u1_t3', name: 'Substitution & Recursion Tree Analysis', isCompleted: true }
          ]
        },
        {
          unitNumber: 2,
          title: 'Divide & Conquer and Greedy Paradigms',
          description: 'Strassen matrix multiplication, fractional knapsack, Huffman codes',
          estimatedHours: 10,
          topics: [
            { topicId: 'cs301_u2_t1', name: 'Strassen’s Sub-cubic Matrix Multiplication', isCompleted: true },
            { topicId: 'cs301_u2_t2', name: 'Optimal Activity Selection Problem', isCompleted: true },
            { topicId: 'cs301_u2_t3', name: 'Huffman Coding and Prefix Codes', isCompleted: true },
            { topicId: 'cs301_u2_t4', name: 'Fractional Knapsack Optimization', isCompleted: true }
          ]
        },
        {
          unitNumber: 3,
          title: 'Dynamic Programming Paradigms',
          description: 'Optimal substructure, memoization, 0/1 knapsack, Matrix Chain Multiplication, Bellman-Ford',
          estimatedHours: 12,
          topics: [
            { topicId: 'cs301_u3_t1', name: 'Matrix Chain Multiplication and Memoization', isCompleted: true },
            { topicId: 'cs301_u3_t2', name: 'Longest Common Subsequence (LCS)', isCompleted: true },
            { topicId: 'cs301_u3_t3', name: '0/1 Knapsack Dynamic Programming Table', isCompleted: true },
            { topicId: 'cs301_u3_t4', name: 'Floyd-Warshall All-Pairs Shortest Path', isCompleted: true }
          ]
        },
        {
          unitNumber: 4,
          title: 'Graph Algorithms & Network Flows',
          description: 'Maximum flow, Ford-Fulkerson, Edmonds-Karp, Bipartite matching',
          estimatedHours: 10,
          topics: [
            { topicId: 'cs301_u4_t1', name: 'Max-Flow Min-Cut Theorem', isCompleted: true },
            { topicId: 'cs301_u4_t2', name: 'Ford-Fulkerson Residual Graphs', isCompleted: false },
            { topicId: 'cs301_u4_t3', name: 'Maximum Bipartite Matching', isCompleted: false }
          ]
        },
        {
          unitNumber: 5,
          title: 'Intractability & NP-Completeness',
          description: 'P, NP, NP-Complete, Polynomial reductions, Cook-Levin theorem, 3-SAT',
          estimatedHours: 8,
          topics: [
            { topicId: 'cs301_u5_t1', name: 'Polynomial Time Verification & Certificates', isCompleted: false },
            { topicId: 'cs301_u5_t2', name: 'Cook-Levin Theorem and 3-SAT Reduction', isCompleted: false },
            { topicId: 'cs301_u5_t3', name: 'Vertex Cover & Hamiltonian Cycle Reductions', isCompleted: false }
          ]
        }
      ]
    },
    {
      collegeId: college._id,
      departmentId: deptCse._id,
      departmentCode: 'CSE',
      code: 'CS302',
      name: 'Operating Systems & Kernels',
      type: 'theory',
      credits: 4,
      semester: 5,
      assignedFaculty: facultyUser?._id || null,
      targetMilestoneProgress: 75,
      syllabusUnits: [
        {
          unitNumber: 1,
          title: 'Kernel Architecture & Process Virtualization',
          description: 'System calls, trap handling, context switching, fork-exec model',
          estimatedHours: 8,
          topics: [
            { topicId: 'cs302_u1_t1', name: 'Monolithic vs Microkernel Architectures', isCompleted: true },
            { topicId: 'cs302_u1_t2', name: 'Process Control Block and Context Switch', isCompleted: true },
            { topicId: 'cs302_u1_t3', name: 'Inter-Process Communication Mechanisms', isCompleted: true }
          ]
        },
        {
          unitNumber: 2,
          title: 'Concurrency, Synchronization & Locks',
          description: 'Peterson algorithm, Semaphores, Mutex, Monitors, Deadlock bankers algorithm',
          estimatedHours: 10,
          topics: [
            { topicId: 'cs302_u2_t1', name: 'Critical Section Problem & Hardware Locks', isCompleted: true },
            { topicId: 'cs302_u2_t2', name: 'Semaphores & Dining Philosophers Problem', isCompleted: true },
            { topicId: 'cs302_u2_t3', name: 'Banker’s Deadlock Avoidance Algorithm', isCompleted: true }
          ]
        },
        {
          unitNumber: 3,
          title: 'Memory Management & Virtual Memory',
          description: 'Paging, multi-level page tables, TLB caches, Page replacement algorithms',
          estimatedHours: 10,
          topics: [
            { topicId: 'cs302_u3_t1', name: 'Address Translation & Paging Hardware', isCompleted: true },
            { topicId: 'cs302_u3_t2', name: 'TLB Miss Handling and Inverted Tables', isCompleted: true },
            { topicId: 'cs302_u3_t3', name: 'LRU & Clock Page Replacement Strategies', isCompleted: false }
          ]
        }
      ]
    },
    {
      collegeId: college._id,
      departmentId: deptCse._id,
      departmentCode: 'CSE',
      code: 'CS305',
      name: 'Database Management Systems Lab',
      type: 'lab',
      credits: 2,
      semester: 5,
      assignedFaculty: facultyUser?._id || null,
      targetMilestoneProgress: 85,
      syllabusUnits: [
        {
          unitNumber: 1,
          title: 'Relational Schema Design & DDL/DML',
          description: 'SQL constraints, nested queries, joins',
          estimatedHours: 12,
          topics: [
            { topicId: 'cs305_u1_t1', name: 'Complex Subqueries and Cartesian Joins', isCompleted: true },
            { topicId: 'cs305_u1_t2', name: 'Triggers, Assertions and Stored Procedures', isCompleted: true },
            { topicId: 'cs305_u1_t3', name: 'PL/SQL Cursor Programming', isCompleted: true }
          ]
        },
        {
          unitNumber: 2,
          title: 'ACID Transactions & Index Benchmarking',
          description: 'B+ Tree indexing, EXPLAIN ANALYZE queries',
          estimatedHours: 12,
          topics: [
            { topicId: 'cs305_u2_t1', name: 'B+ Tree Index Creation and Query Plans', isCompleted: true },
            { topicId: 'cs305_u2_t2', name: 'Transaction Isolation Level Anomalies', isCompleted: true }
          ]
        }
      ]
    }
  ];

  for (const s of subjectsData) {
    const subDoc = new Subject(s);
    await subDoc.save(); // triggers pre-save progress calculator
  }
  logger.info(`Seeded ${subjectsData.length} Subjects with full syllabus topic breakdowns.`);

  logger.info('--- Seeding Smart Weekly Timetable for CS-3A ---');
  await Timetable.deleteMany({ classId: 'CS-3A' });

  const weeklySlots = [
    // Monday
    { slotId: 'mon_p1', dayOfWeek: 'Monday', periodNumber: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'mon_p2', dayOfWeek: 'Monday', periodNumber: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectCode: 'CS302', subjectName: 'Operating Systems & Kernels', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },
    { slotId: 'mon_p3', dayOfWeek: 'Monday', periodNumber: 3, startTime: '11:45 AM', endTime: '12:45 PM', subjectCode: 'CS303', subjectName: 'Computer Networks & Protocols', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'mon_p4', dayOfWeek: 'Monday', periodNumber: 4, startTime: '01:30 PM', endTime: '03:30 PM', subjectCode: 'CS305', subjectName: 'Database Management Lab', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'Computing Lab 3', type: 'lab' },

    // Tuesday
    { slotId: 'tue_p1', dayOfWeek: 'Tuesday', periodNumber: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectCode: 'CS303', subjectName: 'Computer Networks & Protocols', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'tue_p2', dayOfWeek: 'Tuesday', periodNumber: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'tue_p3', dayOfWeek: 'Tuesday', periodNumber: 3, startTime: '11:45 AM', endTime: '12:45 PM', subjectCode: 'CS304', subjectName: 'Database Management Systems', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },
    { slotId: 'tue_p4', dayOfWeek: 'Tuesday', periodNumber: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectCode: 'CS302', subjectName: 'Operating Systems & Kernels', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },

    // Wednesday
    { slotId: 'wed_p1', dayOfWeek: 'Wednesday', periodNumber: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectCode: 'CS302', subjectName: 'Operating Systems & Kernels', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },
    { slotId: 'wed_p2', dayOfWeek: 'Wednesday', periodNumber: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectCode: 'CS304', subjectName: 'Database Management Systems', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },
    { slotId: 'wed_p3', dayOfWeek: 'Wednesday', periodNumber: 3, startTime: '11:45 AM', endTime: '12:45 PM', subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'wed_p4', dayOfWeek: 'Wednesday', periodNumber: 4, startTime: '01:30 PM', endTime: '03:30 PM', subjectCode: 'CS306', subjectName: 'Cloud & Virtualization Lab', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'Cloud Computing Lab', type: 'lab' },

    // Thursday
    { slotId: 'thu_p1', dayOfWeek: 'Thursday', periodNumber: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'thu_p2', dayOfWeek: 'Thursday', periodNumber: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectCode: 'CS303', subjectName: 'Computer Networks & Protocols', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'thu_p3', dayOfWeek: 'Thursday', periodNumber: 3, startTime: '11:45 AM', endTime: '12:45 PM', subjectCode: 'CS302', subjectName: 'Operating Systems & Kernels', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },
    { slotId: 'thu_p4', dayOfWeek: 'Thursday', periodNumber: 4, startTime: '01:30 PM', endTime: '02:30 PM', subjectCode: 'CS304', subjectName: 'Database Management Systems', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },

    // Friday
    { slotId: 'fri_p1', dayOfWeek: 'Friday', periodNumber: 1, startTime: '09:30 AM', endTime: '10:30 AM', subjectCode: 'CS304', subjectName: 'Database Management Systems', facultyId: hodUser?._id, facultyName: 'Dr. Aris Thorne', room: 'LH-302', type: 'theory' },
    { slotId: 'fri_p2', dayOfWeek: 'Friday', periodNumber: 2, startTime: '10:30 AM', endTime: '11:30 AM', subjectCode: 'CS301', subjectName: 'Design & Analysis of Algorithms', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'fri_p3', dayOfWeek: 'Friday', periodNumber: 3, startTime: '11:45 AM', endTime: '12:45 PM', subjectCode: 'CS303', subjectName: 'Computer Networks & Protocols', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'LH-302', type: 'theory' },
    { slotId: 'fri_p4', dayOfWeek: 'Friday', periodNumber: 4, startTime: '01:30 PM', endTime: '03:30 PM', subjectCode: 'CS307', subjectName: 'Technical Seminar & Capstone Mentoring', facultyId: facultyUser?._id, facultyName: 'Prof. Ananya Sen', room: 'Seminar Hall 2', type: 'tutorial' }
  ];

  await Timetable.create({
    collegeId: college._id,
    classId: 'CS-3A',
    departmentCode: 'CSE',
    semester: 5,
    academicYear: '2025-2026',
    slots: weeklySlots,
    version: 1
  });
  logger.info('Seeded Timetable for CS-3A (20 weekly period slots).');

  logger.info('--- Seeding Additional Student Cohort Roster for CS-3A ---');
  const defaultPassword = await bcrypt.hash('password123', 10);
  const additionalStudents = [
    { name: 'Aditi Deshmukh', email: 'aditi.d@ait.edu', rollNo: '22CS082', usn: '1AT22CS082', attendancePercentage: 94.1, cgpa: 9.15 },
    { name: 'Bhavin Patel', email: 'bhavin.p@ait.edu', rollNo: '22CS083', usn: '1AT22CS083', attendancePercentage: 81.0, cgpa: 8.20 },
    { name: 'Divya Iyer', email: 'divya.i@ait.edu', rollNo: '22CS084', usn: '1AT22CS084', attendancePercentage: 96.5, cgpa: 9.42 },
    { name: 'Farhan Zaidi', email: 'farhan.z@ait.edu', rollNo: '22CS085', usn: '1AT22CS085', attendancePercentage: 77.2, cgpa: 7.95 },
    { name: 'Ishita Roy', email: 'ishita.r@ait.edu', rollNo: '22CS086', usn: '1AT22CS086', attendancePercentage: 92.0, cgpa: 8.70 },
    { name: 'Karthik Raja', email: 'karthik.r@ait.edu', rollNo: '22CS087', usn: '1AT22CS087', attendancePercentage: 85.3, cgpa: 8.45 },
    { name: 'Meera Nair', email: 'meera.n@ait.edu', rollNo: '22CS088', usn: '1AT22CS088', attendancePercentage: 89.9, cgpa: 8.90 },
    { name: 'Nikhil Verma', email: 'nikhil.v@ait.edu', rollNo: '22CS090', usn: '1AT22CS090', attendancePercentage: 91.2, cgpa: 8.65 }
  ];

  for (const s of additionalStudents) {
    await User.findOneAndUpdate(
      { email: s.email },
      {
        name: s.name,
        email: s.email,
        passwordHash: defaultPassword,
        phone: '+91 98800 22000',
        activeRole: 'STUDENT',
        roles: [{ role: 'STUDENT', collegeId: college._id, departmentId: 'CSE', classId: 'CS-3A' }],
        studentProfile: {
          rollNo: s.rollNo,
          usn: s.usn,
          semester: 5,
          cgpa: s.cgpa,
          batch: '2022-2026',
          attendancePercentage: s.attendancePercentage
        },
        tokenVersion: 0,
        status: 'active'
      },
      { upsert: true, new: true }
    );
  }
  logger.info(`Seeded ${additionalStudents.length} additional cohort students for CS-3A.`);

  logger.info('🎉 ACADEMIC SEEDING COMPLETED SUCCESSFULLY!');
  await mongoose.disconnect();
}

seedAcademic().catch(err => {
  logger.error('Academic seeding failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
