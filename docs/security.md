# CampusBridge Security, Cryptography & Privacy Isolation Architecture

## 1. Threat Model & Security Posture
CampusBridge is designed under the assumption of **zero client trust**. Because browser storage, IndexedDB, and local client clocks can be inspected or modified by end users, the server remains the sole authoritative source of truth for:
- Deadline enforcement (assignments, fee installments, condonations).
- Attendance percentages and semester credit completions.
- Role-based permissions and departmental boundaries.
- Cryptographic verification signatures.

---

## 2. Authentication & Session Revocation
```
+-----------------------------------------------------------------------------------------+
|                                    JWT Token Architecture                               |
|                                                                                         |
|  Access Token (15-Minute Expiry)                 Refresh Token (7-Day Expiry)           |
|  - Payload: { sub, email, activeRole,            - Stored in HttpOnly, Secure, SameSite |
|              collegeId, departmentId,              cookie (cb_refresh_token)            |
|              classId, tokenVersion }             - Payload: { sub, tokenVersion }       |
+-----------------------------------------------------------------------------------------+
```

### Instant Server-Side Session Revocation:
Every `User` record maintains a monotonically increasing integer `tokenVersion`. When an administrator revokes a user's access, or when an IT officer marks an offline tablet as lost or stolen:
1. The server executes `User.updateOne({ _id }, { $inc: { tokenVersion: 1 } })`.
2. Existing 15-minute access tokens carry the stale `tokenVersion` and are rejected immediately by [`authMiddleware.js`](file:///home/dilee/Web_Dev/College_Management_Platform/server/src/middleware/auth.js) with HTTP `401 SESSION_REVOKED`.
3. The Service Worker receives a `LOGOUT_PURGE` message that cleans all local precached app shell and dynamic assets.

---

## 3. Device Fingerprinting & Browser Registration
For institutional tablets used in campus laboratories and attendance terminals:
- Devices must be pre-registered by `COLLEGE_ADMIN` or `IT_SUPPORT` ([`Device.js`](file:///home/dilee/Web_Dev/College_Management_Platform/server/src/models/Device.js)).
- Every request carries the `X-Device-Fingerprint` header.
- The server checks device authorization status (`'registered' | 'revoked' | 'quarantined'`) before accepting batch sync pushes.

---

## 4. Cryptographic Digital Certificates & Tamper-Evident Seals
Degrees, provisional certificates, and honors transcripts are issued with cryptographic signatures:
1. **Hash Generation:** The server constructs a canonical representation of student roll number, degree code, CGPA, graduation date, and issuing authority, and hashes it using **HMAC-SHA256**:
   ```javascript
   const verificationHash = crypto.createHmac('sha256', process.env.CERTIFICATE_SECRET)
     .update(`${studentRollNo}:${degree}:${cgpa}:${issuedDate}`)
     .digest('hex');
   ```
2. **Public Verification Route (`/verify/:certificateHash`):**
   - Publicly accessible by employers, foreign universities, and credential evaluators without requiring user authentication.
   - **Minimal Privacy Exposure:** To comply with data privacy regulations, student identities are masked:
     - `recipientMasked: "Aarav S. (22****89)"`
     - Phone numbers, personal email addresses, and residential details are never returned in public payloads.
   - If the certificate is tampered with or does not match institutional records, the endpoint returns `isAuthentic: false` with HTTP 404.

---

## 5. Privacy Isolation: Grievances & Counseling Notes
- **Confidential Grievance Portal:**
  - Reports are filed with confidential tracking numbers (`GRV-2026-XXXXX`).
  - Anonymous mode isolates the student's true user ID from departmental faculty.
  - Every review action records an immutable audit entry in `accessAudit` detailing the viewer's ID, role, and timestamp.
- **Access-Restricted Mentoring Notes:**
  - Mentoring session observations and psychological support logs are strictly forbidden to unauthorized faculty or general students (verified via [`server/test/rbacIsolation.test.js`](file:///home/dilee/Web_Dev/College_Management_Platform/server/test/rbacIsolation.test.js)).
  - Accessible only to authorized `COUNSELOR`, `CLASS_ADVISOR`, `HOD`, and `PRINCIPAL`.

---

## 6. Concurrency Locks & Double-Booking Prevention
In high-demand campus resource booking (seminar auditoriums, robotics laboratories, campus transport seats), concurrent requests create race conditions.

CampusBridge implements a **compound partial unique index** in MongoDB:
```javascript
campusResourceBookingSchema.index(
  { resourceId: 1, date: 1, timeSlot: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
);
```
If two users attempt to reserve the same hall simultaneously, one request succeeds while the second request is immediately rejected at the database level with a MongoDB `E11000 duplicate key` error, translated by [`operationsController.js`](file:///home/dilee/Web_Dev/College_Management_Platform/server/src/controllers/operationsController.js) into HTTP `409 Conflict: This resource slot is already booked`.
