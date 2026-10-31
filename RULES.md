# CampusBridge — Global Engineering & Premium UI Rules

## 1. Architectural Non-Negotiables
- **Architecture:** Modular Monorepo (`/client` React + Vite + TypeScript/JS, `/server` Node.js + Express + MongoDB/Mongoose).
- **Offline-First Contract:** Every cached entity in IndexedDB (via Dexie.js) MUST include: `recordId`, `serverId`, `version`, `updatedAt`, `lastSyncedAt`, `syncStatus` (`'synced' | 'pending' | 'conflict' | 'failed'`), and `deletedAt`.
- **Optimistic UI Honesty:** Never mark an offline mutation as officially confirmed until the server acknowledges it. Always display visual badges (`Pending Sync`, `Server Confirmed`, `Conflict Detected`).
- **Security & RBAC:** Enforce college-scoped, department-scoped, and class-scoped permissions on both client routes and Express middleware. Never trust client-submitted IDs or timestamps for deadline validation.

## 2. Ultra-Premium UI/UX Design System ("Linear x Vercel Academic")
- **Visual Aesthetic:** High-craft SaaS interface inspired by Linear, Vercel, and Raycast. Zero generic Bootstrap/Material layouts.
- **Color Tokens:**
  - **Dark Mode (Default/Preferred):** Canvas `#090A0F`, Elevated Surface `#12141C`, Glass Surface `rgba(18, 20, 28, 0.75)` with `backdrop-filter: blur(16px)`, Subtle Border `1px solid rgba(255, 255, 255, 0.08)`, Hover Border `rgba(99, 102, 241, 0.4)`.
  - **Light Mode:** Canvas `#F8FAFC`, Surface `#FFFFFF`, Subtle Border `1px solid #E2E8F0`.
  - **Accents:** Primary Electric Indigo (`#6366F1` to `#4F46E5`), Synced Emerald (`#10B981`), Offline/Pending Amber (`#F59E0B`), Conflict/Error Rose (`#F43F5E`).
- **Typography:**
  - Headings & UI: `'Plus Jakarta Sans'` or `'Inter'`, tight tracking (`-0.02em` on headers).
  - Monospace Data: `'JetBrains Mono'` for Student IDs, Subject Codes, Attendance Hashes, Sync Timestamps, and UUIDs.
- **Signature UI Patterns:**
  - **Dynamic Sync Island:** A persistent pill in the top navigation bar that morphs smoothly between states: Emerald dot (`Online • Synced`), pulsing Amber badge (`Offline • 4 Pending`), and Rose alert (`1 Conflict — Review`). Clicking it opens the slide-over **Offline Sync & Recovery Drawer**.
  - **Bento Grid Dashboards:** Role dashboards use asymmetric CSS Grid cards with subtle radial gradient spotlights on hover, micro-sparklines (Recharts), and tabular numerals (`font-variant-numeric: tabular-nums`).
  - **Command Palette (`Cmd/Ctrl + K`):** Global glassmorphic modal for instant permission-aware search across students, subjects, assignments, and cached offline study packs.
  - **Zero Jarring Loads:** Every table and card must use shimmer skeleton loaders, smooth micro-transitions (150ms cubic-bezier), custom empty-state illustrations, and non-blocking toast notifications.