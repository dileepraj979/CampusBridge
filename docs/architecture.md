# CampusBridge System Architecture & Blueprint

## 1. Executive Summary
CampusBridge is an **Offline-First Smart College Management Platform** designed for higher education institutions operating in environments with intermittent, low-bandwidth, or zero-connectivity campus network conditions. Built as a modular monorepo combining **Express + MongoDB** on the backend and **React + Vite + Dexie.js (IndexedDB)** on the frontend, it delivers sub-millisecond local reads, seamless background synchronization, fine-grained role-based access control (18 specialized academic roles), and verifiable cryptographic credentials.

---

## 2. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    Client Tier (PWA)                                    |
|                                                                                         |
|  +--------------------+   +-----------------------+   +------------------------------+  |
|  | Linear-Craft UI    |   | Dynamic Sync Island   |   | Slide-Over Grounded AI       |  |
|  | (Bento Dashboards, |   | (Emerald • Amber •    |   | (Syllabus Explainer, Quiz,   |  |
|  | Skeleton Loaders)  |   |  Conflict Resolver)   |   |  Faculty Rubric Co-Pilot)    |  |
|  +--------------------+   +-----------------------+   +------------------------------+  |
|             |                         |                                |                |
|             v                         v                                v                |
|  +-----------------------------------------------------------------------------------+  |
|  |               Dexie.js IndexedDB Architecture (10 Local Stores)                   |  |
|  | userProfile | timetables | attendanceRecords | assignments | downloadedMaterials  |  |
|  | announcements | notifications | offlineMutations | syncMetadata | referenceData   |  |
|  +-----------------------------------------------------------------------------------+  |
|             |                                                                           |
|             v                                                                           |
|  +--------------------+                                                                 |
|  | Service Worker     | App Shell precaching, Stale-While-Revalidate,                   |
|  | & Storage Quota    | Logout cache invalidation, Web Push Event dispatch              |
|  +--------------------+                                                                 |
+-----------------------------------------------------------------------------------------+
                                            |
                        HTTPS (REST + Batch Sync Protocol)
                                            |
                                            v
+-----------------------------------------------------------------------------------------+
|                                   Server Tier (Express)                                 |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | Request ID Tracing -> Helmet Security -> CORS -> Rate Limiter -> Request Logger   |  |
|  +-----------------------------------------------------------------------------------+  |
|             |                                                                           |
|             +---------------------+---------------------+                               |
|             |                     |                     |                               |
|             v                     v                     v                               |
|  +--------------------+  +--------------------+  +-----------------------------------+  |
|  | Auth & 18-Role     |  | Sync Controller    |  | Intelligence & Guidance           |  |
|  | RBAC Middleware    |  | - Idempotency      |  | - Early-Warning Risk Detection    |  |
|  | - JWT (15m HttpOnly|    (UUIDv4 dedup)     |  | - Confidential Mentoring Notes    |  |
|  |   access cookies)  |  | - Field-level diff |  | - Unified Multi-Channel Alerts    |  |
|  | - Device tokens    |  | - Concurrency lock |  | - Emergency Campus Broadcast      |  |
|  +--------------------+  +--------------------+  +-----------------------------------+  |
|             |                     |                     |                               |
|             +---------------------+---------------------+                               |
|                                   |                                                     |
|                                   v                                                     |
|  +-----------------------------------------------------------------------------------+  |
|  |             Authoritative MongoDB Tier (Mongoose ODM + Compound Indexes)           |  |
|  | Collections: Users, Colleges, Roles, AuditLogs, AttendanceRecords, Assignments,   |  |
|  | Submissions, MarksLedger, FeeInvoices, DigitalCertificates, EarlyWarningRecords   |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 3. The 18 Specialized Institutional Roles
CampusBridge enforces strict, granular permissions scoped at College, Department, Class, and Student levels:

| Role Identifier | Primary Responsibility & Scoping Boundary |
|---|---|
| `SUPER_ADMIN` | Multi-tenant platform management, system telemetry, and global audits. |
| `COLLEGE_ADMIN` | Campus-level configuration, departments, courses, and device registrations. |
| `PRINCIPAL` | Institutional executive dashboard, accreditation readiness (NAAC/NBA), emergency broadcasts, and high-level appeals. |
| `HOD` | Departmental curriculum tracking, syllabus completion audits, faculty workload matrices, and attendance correction reviews. |
| `FACULTY` | Classroom roster attendance marking, LMS assignments, rubric evaluations, offline study pack bundling, and AI quiz drafts. |
| `CLASS_ADVISOR` | Cohort mentoring, Early-Warning risk intervention, and first-stage service desk approvals. |
| `STUDENT` | Offline study pack viewer, attendance forecasts, assignment submission queue, grade transcripts, and verifiable skill passport. |
| `PARENT` | Read-only attendance summaries, examination hall tickets, fee invoice payment, and proctoring reports. |
| `EXAM_CONTROLLER`| Exam timetable scheduling, hall ticket generation, marks approval workflow, and ledger publishing. |
| `LIBRARIAN` | Barcode/QR checkout management, catalogue circulation, copy collision locks, and overdue fine collection (₹5/day). |
| `ACCOUNTANT` | Fee structure generation, installment tracking, scholarship reviews, and Razorpay webhook audits. |
| `PLACEMENT_OFFICER`| Campus recruitment drives, automated CGPA/backlog eligibility filters, and corporate liaison. |
| `PLACEMENT_RECRUITER`| Shortlisting candidate resumes and scheduling interview rounds. |
| `HOSTEL_WARDEN` | Room occupancy boards, bed allocation, and mess gate passes. |
| `TRANSPORT_MANAGER`| Bus fleet routes, morning/evening stop ETAs, and live capacity alerts. |
| `COUNSELOR` | Confidential one-on-one student counseling notes and psychosocial mentoring. |
| `IT_SUPPORT` | Registered offline browser devices, network node health, and token revocation. |
| `AUDITOR` | Read-only compliance inspection over immutable audit logs and tamper-evident hashes. |

---

## 4. Client-Side Dexie.js Schema & Offline Contract
Every cached record stored in IndexedDB strictly fulfills the **Offline-First Contract**:
```typescript
interface OfflineFirstRecord {
  recordId: string;       // Client UUID or server ID with prefix
  serverId: string | null;// Authoritative MongoDB ObjectId
  version: number;        // Monotonically increasing version counter
  updatedAt: string;      // ISO 8601 timestamp of last local update
  lastSyncedAt: string | null; // Null if pending sync
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed';
  deletedAt: string | null;    // Soft-deletion timestamp for tombstone propagation
}
```

### The 10 Core Offline Stores
1. `userProfile`: Cached credentials, active role, department scope, and device fingerprint.
2. `timetables`: Weekly lecture schedules, period slots, room allocations, and faculty names.
3. `attendanceRecords`: Offline classroom attendance rosters, headcounts, and verification hashes.
4. `assignments`: Coursework instructions, rubrics, deadlines, and offline draft attachments.
5. `downloadedMaterials`: Offline PDF lecture packs, code samples, and syllabus guides.
6. `announcements`: Institutional notices with categories and priority classifications.
7. `notifications`: In-app alert history, read receipts, and emergency broadcast banners.
8. `offlineMutations`: Idempotent mutation queue tracking pending offline changes with UUIDv4.
9. `syncMetadata`: High-watermark synchronization cursors and device telemetry.
10. `referenceData`: Fast local lookups for subjects, departments, and course codes.
