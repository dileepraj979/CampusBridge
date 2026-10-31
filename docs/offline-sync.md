# CampusBridge Offline Synchronization Engine & Protocol

## 1. Design Philosophy: Honest Optimistic UI
CampusBridge treats network failure as an ordinary, expected state rather than an exception. When a faculty member marks attendance in a remote basement laboratory or a student reviews cached study packs on transit, all actions succeed instantaneously against **Dexie.js IndexedDB**.

However, to prevent academic fraud and maintain statutory integrity, the user interface adheres strictly to **Honest Optimistic UI**:
- Offline mutations are visually badged with pulsing Amber indicators: `Pending Sync (Local Tablet)`.
- Records are **never** marked as officially confirmed until the authoritative campus server acknowledges them with a server timestamp and MongoDB ObjectId.
- In the event of a concurrent edit by another user or administrator, the system transitions to a Rose alert: `Conflict Detected — Review Required`.

---

## 2. The Offline Mutation State Machine

```
   +----------------------+
   | User Action Offline  |
   +----------------------+
              |
              v
   +----------------------+
   | Insert to Dexie.js   | ---> Assigned unique operationId (UUIDv4)
   | offlineMutations     |      Status: 'queued', retryCount: 0
   +----------------------+
              |
              | (Network reconnects or Manual Trigger)
              v
   +----------------------+
   | Batch Push Payload   | ---> POST /api/v1/sync/push
   | { mutations: [...] } |      With X-Device-Fingerprint
   +----------------------+
              |
              +--------------------------+--------------------------+
              |                          |                          |
   (Version Matches Base)     (Version Diverges)         (Already Processed)
              |                          |                          |
              v                          v                          v
   +----------------------+   +----------------------+   +----------------------+
   | Applied to MongoDB   |   | Conflict Detected    |   | Idempotent Replay    |
   | Version Incremented  |   | 3-Way Field Diffs    |   | Stored Receipt Sent  |
   | Status: 'applied'    |   | Status: 'conflict'   |   | Zero Duplicate Rows  |
   +----------------------+   +----------------------+   +----------------------+
              |                          |                          |
              v                          v                          v
   +----------------------+   +----------------------+   +----------------------+
   | Dynamic Sync Island  |   | Interactive Conflict |   | Client Cache Updated |
   | turns Emerald        |   | Resolution Drawer    |   | No Mutation Dups     |
   | (Online • Synced)    |   | (Field Merge UI)     |   +----------------------+
   +----------------------+   +----------------------+
```

---

## 3. Idempotent Deduplication via UUIDv4
Network drops frequently occur *after* the server has processed a mutation but *before* the client receives the HTTP response. Without idempotency, automatic retries cause duplicate attendance records, multiple fee invoices, or corrupted headcounts.

### How CampusBridge Solves Replay Duplication:
1. Every client mutation generates a persistent UUIDv4 `operationId` at the exact millisecond of user creation.
2. The server indexes `SyncOperation` by `{ operationId: 1 }` with a unique constraint.
3. When `/api/v1/sync/push` receives an operation:
   - If `operationId` is novel: The mutation is executed, authoritative records are created, and the receipt is saved in MongoDB.
   - If `operationId` was already processed: The mutation is **not re-executed**. The server immediately returns the previously recorded receipt with `isIdempotentReplay: true`.
4. Automated verification in [`server/test/idempotentSync.test.js`](file:///home/dilee/Web_Dev/College_Management_Platform/server/test/idempotentSync.test.js) guarantees zero duplicate rows even under infinite network retries.

---

## 4. Conflict Resolution & 3-Way Diffing
When a mutation specifies a `baseVersion` that does not match the server's current `version`:
1. The server computes field-level differences across three states:
   - `clientPayload`: The changes made on the offline browser.
   - `serverCurrentState`: The current record state in MongoDB.
   - `baseState`: The version the client originally checked out.
2. The mutation is saved with `status: 'conflict'` along with the structured diff.
3. On the frontend, clicking the pulsing Rose dot on the **Dynamic Sync Island** opens the **Offline Sync & Recovery Drawer**, allowing the user to inspect differences side-by-side:
   - **Accept Server State:** Overwrites local Dexie record with latest campus cloud data.
   - **Force Client Override:** Promotes client values with an explicit audit justification note.
   - **Field-by-Field Merge:** Granularly chooses which attributes (e.g. remarks vs attendance marks) to retain.

---

## 5. Incremental Cursor-Based Pull
To minimize cellular bandwidth and battery consumption on student tablets:
- Clients maintain `lastSyncCursor` (ISO 8601 timestamp) in `syncMetadata`.
- Pull requests invoke `GET /api/v1/sync/pull?cursor=2026-10-25T14:00:00Z`.
- The server performs a compound scan: `{ collegeId, updatedAt: { $gt: cursor } }`.
- Only modified records are transferred over the wire and merged into local IndexedDB stores.
