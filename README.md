# CampusBridge — Offline-First Smart College Management Platform

[![Platform](https://img.shields.io/badge/Platform-MERN%20%2B%20PWA%20%2B%20Dexie.js-6366F1)](https://github.com/campusbridge)
[![Architecture](https://img.shields.io/badge/Architecture-Offline--First%20Honest%20Optimistic%20UI-10B981)](#offline-first-architecture)
[![RBAC](https://img.shields.io/badge/RBAC-18%20Specialized%20Roles-8B5CF6)](#the-18-institutional-roles)
[![Tests](https://img.shields.io/badge/Automated%20Tests-16%20Unit%20%26%20Integration%20Passed-059669)](#automated-testing)
[![PWA](https://img.shields.io/badge/PWA-Installable%20App%20Shell%20v1.0-F59E0B)](#pwa--service-worker)

> **CampusBridge** is an ultra-premium, production-grade College Management System built with a "Linear x Vercel Academic" aesthetic. It is engineered from the ground up to operate reliably across intermittent, low-bandwidth, or zero-connectivity campus environments.

---

## 🏛️ Key Capabilities by Phase

### Phase 1: Foundation, 18-Role RBAC & Ultra-Premium App Shell
- **Modular Monorepo:** Structured Express backend with structured JSON logging, centralized error handling, and Vite + React frontend.
- **Granular RBAC Engine:** Full support for 18 institutional roles with hierarchical permissions scoped to College, Department, and Class.
- **Ultra-Craft UI:** Obsidian Dark theme (`#090A0F`), glassmorphism, responsive Bento Grids, and instant Command Palette (`⌘K`).

### Phase 2: Offline-First IndexedDB Architecture & Conflict Resolution Center
- **10 Dexie.js Stores:** `userProfile`, `timetables`, `attendanceRecords`, `assignments`, `downloadedMaterials`, `announcements`, `notifications`, `offlineMutations`, `syncMetadata`, and `referenceData`.
- **Dynamic Sync Island:** Persistent top navigation pill morphing smoothly between **Online • Synced** (Emerald), **Offline • Pending** (Amber), and **Conflict Detected** (Rose).
- **Idempotent Queue:** Guaranteed deduplication via UUIDv4 `operationId` tracking.
- **Conflict Resolution Center:** Visual 3-way diffing tool with side-by-side client, server, and base versions.

### Phase 3: Departments, Curriculum Tracker & Smart Timetable Matrix
- **Curriculum Coverage Tracker:** Interactive syllabus checklists comparing actual teaching pace against semester targets.
- **Smart Timetable Matrix:** Conflict-free classroom timetable grid with faculty workload and room allocations.
- **Student Lifecycle Registry:** Cohort directories, proctoring assignments, and academic standing history.

### Phase 4: Offline Attendance Engine & Anomaly Detection
- **Fast Attendance Roster:** 100% offline-capable classroom attendance register with instant toggle controls.
- **Live Rotating QR:** Cryptographically signed time-window verification codes preventing proxy attendance.
- **Attendance Forecasting:** Projection formula computing classes required to reach 75% or safe skips allowed.
- **Anomaly Detection:** Heuristic audit flags detecting rapid headcounts, cross-department clashes, and weekend anomalies.

### Phase 5: Assignments Workflow, LMS Study Packs & Examination Engine
- **Assignment State Machine:** Complete workflow (`Draft -> Submitted -> Under Review -> Graded -> Feedback Released`).
- **Offline LMS Study Packs:** Compressed bundles of lecture PDFs and syllabus guides stored locally in IndexedDB.
- **Examination & Results Engine:** R22 autonomous grading scheme, continuous internal evaluation (CIE), and automatic SGPA/CGPA calculation.

### Phase 6: Unified Service Desk, Campus Operations & Verifiable Skill Passport
- **Unified Service Desk:** Multi-stage approvals (`CLASS_ADVISOR -> HOD -> PRINCIPAL`) with statutory SLA timers.
- **Confidential Grievances:** Privacy-isolated reporting portal with tracking IDs (`GRV-2026-XXXXX`) and restricted access logging.
- **Campus Operations:** Fee invoices with installment timelines, simulated Razorpay HMAC checkout, library barcode circulation with copy collision locks, and campus resource booking with server-side transactional double-booking prevention (`409 Conflict`).
- **Student Skill Passport:** Verified credentials vs self-claims, SHA-256 HMAC cryptographic seals, and public verification endpoint (`/verify/:certificateHash`) with minimal PII exposure.

### Phase 7: Role-Scoped AI Assistant, Early-Warning Care & PWA
- **Slide-Over Academic AI Co-Pilot:** Grounded in authorized institutional syllabi and policies.
  - *Students:* Syllabus explainer, 3-question practice quiz generator, 5-day revision planner, and college policy Q&A.
  - *Faculty:* Quiz/rubric draft generator with approval warning, and class performance summarizer.
  - *Offline Deterministic Engine:* Automatically switches to Dexie-powered local search when offline without failing.
- **Academic Early-Warning Dashboard:** Flags students by configurable thresholds (attendance < 75%, missed assignments, backlogs) with exact contributing factor breakdown and confidential, audit-logged mentoring notes.
- **Unified Notification Center:** In-app alerts, Web Push API integration, and campus-wide emergency broadcasts.
- **Custom PWA Service Worker:** App shell precaching, Stale-While-Revalidate, storage quota monitoring, and strict cache purges on logout.
- **Comprehensive Automated Test Suite:** 16 Vitest unit & integration tests + Flagship Playwright E2E offline attendance recovery test.

---

## ⚡ Quickstart & Installation

### Prerequisites
- **Node.js:** v18.0.0 or later (v20+ recommended)
- **MongoDB:** v6.0 or later running on `localhost:27017`

### 1. Clone & Install Dependencies
```bash
# Install root, server, and client dependencies in one command
npm run install:all
```

### 2. Seed Institutional Database
```bash
# Seeds departments (CSE), courses, timetable, faculty, students, and reference data
npm run seed
```

### 3. Launch Development Servers
```bash
# Starts both Express backend (port 5000) and Vite frontend (port 5173) concurrently
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Credentials (Multi-Role Switcher)

CampusBridge includes an interactive **Role Switcher Dock** at the top of the interface. You can also sign in manually with any of the seeded credentials:

| Email | Password | Role | Context / Scope |
|---|---|---|---|
| `principal@ait.edu` | `password123` | `PRINCIPAL` | Apex Institute of Technology |
| `hod.cse@ait.edu` | `password123` | `HOD` | Department of CSE |
| `faculty.cse@ait.edu` | `password123` | `FACULTY` | Class CS-3A / Algorithms |
| `advisor.cse@ait.edu` | `password123` | `CLASS_ADVISOR` | Class CS-3A Mentoring |
| `student.cse@ait.edu` | `password123` | `STUDENT` | Aarav Sharma (Roll: 22CS089) |
| `parent.cse@ait.edu` | `password123` | `PARENT` | Ward: 22CS089 |
| `controller@ait.edu` | `password123` | `EXAM_CONTROLLER`| Examination Cell |
| `accountant@ait.edu` | `password123` | `ACCOUNTANT` | Bursar & Accounts Office |

---

## 🧪 Automated Testing Suite

```bash
# Run Vitest Unit & Integration Test Suite (GPA math, Forecasting, RBAC, Idempotent Sync)
npm --prefix server run test

# Run Flagship Offline Attendance Recovery Test (Node.js lifecycle)
node server/src/scripts/testOfflineRecovery.js

# Test Client Production Build
npm run build
```

---

## 🐳 Docker Container Deployment

CampusBridge includes full multi-container Docker support:
```bash
# Start MongoDB, Express Backend, and Vite Client
docker compose up --build
```
- Client Web UI: `http://localhost:5173`
- Server API Engine: `http://localhost:5000/api`
- MongoDB Database: `mongodb://localhost:27017/campusbridge`

---

## 📚 Technical Documentation
- [System Architecture & Blueprint](file:///home/dilee/Web_Dev/College_Management_Platform/docs/architecture.md)
- [Offline Synchronization Engine & Protocol](file:///home/dilee/Web_Dev/College_Management_Platform/docs/offline-sync.md)
- [Security, Cryptography & Privacy Isolation](file:///home/dilee/Web_Dev/College_Management_Platform/docs/security.md)

---
*CampusBridge — Engineering academic excellence with offline-first resilience.*
