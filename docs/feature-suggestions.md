# 🚀 Engrew Platform — Feature Suggestions

> **Platform:** Bilingual (English / Hebrew) Online Hebrew Learning Platform  
> **Stack:** React 18 + Vite + TypeScript + TailwindCSS · Node.js + Express + PostgreSQL + Prisma + Redis  
> **Document Purpose:** Curated improvement roadmap covering new features, performance, and security hardening.

---

## 📋 Table of Contents

1. [✨ 15 New Feature Suggestions](#-15-new-feature-suggestions)
2. [⚡ 15 Performance Improvements](#-15-performance-improvements)
3. [🔒 15 Security Hardening Improvements](#-15-security-hardening-improvements)

---

## ✨ 15 New Feature Suggestions

### 1. 🤖 AI-Powered Hebrew Writing Correction
Allow students to type a Hebrew sentence and receive instant AI feedback on grammar, vowel (Nikud) placement, and sentence structure. Integrate with OpenAI GPT-4o or a dedicated NLP service tuned to Hebrew morphology. Corrections can be shown inline with color-coded diffs.

> **Note:** This would complement the existing games suite (Flashcards, Matching, Quiz) by adding open-ended writing practice.

---

### 2. 📱 Progressive Web App (PWA) Support
Add a `manifest.json` and a Service Worker to enable install-to-homescreen on Android and iOS. Students can open Engrew from their phone home screen, receive push notifications for upcoming lessons, and access flashcards offline via a cached asset strategy.

---

### 3. 🔔 Smart Lesson Reminder Notifications
Build a scheduled background job (using `node-cron` or BullMQ) that sends push/email/SMS reminders 24h and 30 minutes before each scheduled lesson. The existing `Notification` model already has the `REMINDER` category and `priority` fields — this feature just needs the job scheduler and delivery adapters (Resend for email, Twilio for SMS).

---

### 4. 📊 Student Progress Analytics Dashboard
Add a dedicated "My Progress" section in the student sidebar that visualizes:
- Weekly lesson attendance rate (line chart).
- Points earned per week (bar chart).
- Game accuracy over time per game type.
- Hebrew level progression timeline.

Use `Recharts` or `Chart.js` for rendering. All data is derivable from existing `PointsLedger`, `StudentGameSession`, and `Lesson` tables.

---

### 5. 🗣️ Live In-Lesson Chat & Whiteboard
Embed a real-time collaborative whiteboard alongside the Zoom link. Use a lightweight WebSocket channel (via `socket.io`) or a third-party tool like Liveblocks to let teacher and student draw Hebrew letters, annotate vocab, and share a live text chat during the 25-minute session — without leaving the platform.

---

### 6. 🏆 Weekly Leaderboard Resets & Seasonal Badges
Extend the existing leaderboard to support weekly and monthly resets with an archive of past seasons. Award unique seasonal achievement badges (e.g., "Month of Tishrei Champion") stored in a new `Badge` model and displayed on the student profile card.

---

### 7. 🎙️ Student Voice Recording Submissions
Allow students to record themselves pronouncing Hebrew words or sentences directly in the browser (Web Audio API + MediaRecorder). Recordings are uploaded to cloud storage (AWS S3 / Cloudflare R2) and attached to homework submissions for teachers to review and provide vocal feedback.

---

### 8. 📅 Teacher Availability Bulk Import via Calendar Sync (iCal/Google Calendar)
Let teachers import their availability by syncing with an external Google Calendar or by uploading a `.ics` file. The system auto-populates `TimeSlot` rows, drastically reducing manual slot entry time and preventing double-booking conflicts.

---

### 9. 💳 Self-Service Package Purchase (Stripe Integration)
Add a student-facing package marketplace where students can browse available packages and pay directly via Stripe Checkout or Stripe Elements. On payment success, a webhook auto-assigns the `StudentPackage` and grants the corresponding credits — removing the need for admin manual assignment.

---

### 10. 📝 Structured Lesson Notes (Teacher → Student)
Upgrade the existing `teacherNotes` free-text field to a structured rich-text editor (TipTap or Quill) with support for:
- Hebrew text with Nikud.
- Vocabulary tables.
- Color-highlighted phrases.
- Embedded audio clips.

Notes are displayed to students in their "Lessons & Recordings" tab after each session.

---

### 11. 🌐 Parent/Guardian Portal
Add a read-only `GUARDIAN` role that can be linked to one or more student accounts. Guardians can view lesson schedules, homework status, points, and package balance — without being able to book or modify anything. Essential for young learner enrollment.

---

### 12. 🎯 Personalized Learning Path Generator
Based on a student's Hebrew level, completed lessons, game accuracy, and homework grades, the system generates a recommended weekly study plan. The plan surfaces the most relevant games, suggests specific homework, and recommends which teacher specialty to look for in the next booking.

---

### 13. 📧 Automated Certificate of Completion
When a student completes all lessons in a package and reaches a target score/streak milestone, the system auto-generates a branded PDF certificate (via `puppeteer` or `@react-pdf/renderer`) and emails it to the student. The certificate includes their name, level achieved, and completion date.

---

### 14. 🔄 Lesson Rescheduling (Not Just Cancellation)
Currently students can only cancel a lesson (refunding 1 credit). Add a "Reschedule" flow that lets a student pick a new available slot with the same teacher without consuming an additional credit. The old slot becomes available again and the new booking is recorded with a `rescheduledFromId` reference.

---

### 15. 📚 Content Library — Shareable Hebrew Resources
Add an admin-managed resource library where teachers can upload and tag PDFs, audio files, and vocabulary sheets by level and topic. Students can browse the library filtered by their `HebrewLevel` and download or preview resources directly in the dashboard.

---

## ⚡ 15 Performance Improvements

### 1. ⚡ Redis Query Caching for Hot Endpoints
Wrap the most-read API responses (`/api/v1/teachers`, `/api/v1/games`, `/api/v1/settings/landing-page`) in Redis `GET`/`SETEX` with short TTLs (30–60 seconds). The Redis client is already in the stack — this avoids repeated full PostgreSQL round-trips for data that rarely changes.

---

### 2. 🔑 Database Connection Pooling with PgBouncer
Add `PgBouncer` (transaction pooling mode) in front of PostgreSQL on Railway. This prevents connection exhaustion under concurrent users since Prisma opens a new connection per request by default. Expect a significant reduction in P99 latency under load.

---

### 3. 🗜️ Enable Brotli / Gzip Compression on the API
Add `compression` middleware (`npm install compression`) to the Express app. All JSON API responses will be compressed, reducing payload sizes by 60–80% for large teacher/student lists and game config JSONs.

---

### 4. 📦 Frontend Bundle Splitting & Lazy Routing
Each dashboard (Admin, Teacher, Student) is a large chunk. Use React's `React.lazy()` + `Suspense` and Vite's `manualChunks` option to split each dashboard, game, and modal into its own async chunk. Reduces initial bundle size and TTI (Time to Interactive) by ~50%.

---

### 5. 🖼️ Image Optimization & Next-Gen Formats
Convert `logo.png` and all avatar/landing-page images to WebP and serve them via a CDN with responsive `srcset` attributes. Add `loading="lazy"` to all below-the-fold images. The logo is currently 1408×768 — serving a correctly-sized WebP saves significant bytes.

---

### 6. 📋 Pagination & Cursor-Based Infinite Scroll
The `/api/v1/lessons`, `/api/v1/games`, and `/api/v1/notifications` endpoints currently return all records. Add `cursor`-based pagination (using `lessonId`/`createdAt` as cursors) and implement infinite scroll on the frontend. This prevents memory bloat for high-volume student accounts.

---

### 7. 🔎 Prisma `select` Projections — Stop Over-Fetching
Many Prisma queries use `include: { user: true }` which returns every column of the joined record. Replace with explicit `select: { firstName, lastName, email }` projections to cut transferred data and query cost by 40–60%.

---

### 8. ⏳ Background Job Queue for Heavy Operations
Move email sending, PDF generation, and notification dispatching off the HTTP request path into a `BullMQ` queue backed by the existing Redis instance. API responses return immediately while jobs process asynchronously — improves perceived latency for all write operations.

---

### 9. 🏗️ React Query (TanStack Query) for Client-Side Data Management
Replace raw `fetch`/`useEffect` patterns with `TanStack Query` for automatic caching, deduplication, background refetching, and stale-while-revalidate semantics. Eliminates redundant API calls when switching between sidebar tabs.

---

### 10. 🔢 Computed Columns & Materialized Views for Analytics
The leaderboard and points totals are recalculated on every request by summing the `PointsLedger` table. Create a PostgreSQL materialized view `student_rank_mv` refreshed every 5 minutes via a cron job, so the leaderboard endpoint performs a single indexed scan instead of a full aggregate.

---

### 11. 🌐 CDN for Static Assets (Vercel Edge / Cloudflare)
Serve all Vite-built static assets (JS, CSS, fonts, images) through Vercel's Edge Network or Cloudflare CDN with long `Cache-Control: immutable` headers for content-hashed filenames. Eliminates repeated origin server hits for returning users.

---

### 12. 📡 HTTP/2 + Keep-Alive on the Express Server
Enable HTTP/2 on the backend via `spdy` or `http2` modules and set `Connection: keep-alive` headers. This allows multiplexed API requests from the frontend, reducing TCP handshake overhead on dashboards that fire 4–6 parallel API calls on mount.

---

### 13. 🗂️ Index Optimization for Composite Queries
Add missing composite indexes for the most common query patterns:
- `(teacherId, status, scheduledAt)` on `Lesson`
- `(studentId, status)` on `Homework`
- `(userId, category, isRead)` on `Notification`

These cover the exact `WHERE` + `ORDER BY` clauses used in dashboard queries, eliminating sequential scans.

---

### 14. 📲 Debounced Search & Memoized Renders
In the Admin user management table, every keystroke in the search box triggers a full API call. Add a 300ms `debounce` on the input and `useMemo` / `React.memo` on the user list rows to prevent unnecessary re-renders. For game config editors with complex `configJson`, apply deep memoization.

---

### 15. 🔁 Vite Build Caching & Pre-bundling Optimization
Add `optimizeDeps.include` in `vite.config.ts` for heavy dependencies (`recharts`, `framer-motion`, `react-query`) to prevent cold-start pre-bundling delays. Enable Vite's persistent file-system cache (`cacheDir`) in CI/CD to skip unchanged dependency re-bundling across deployments.

---

## 🔒 15 Security Hardening Improvements

### 1. 🛡️ HTTP Security Headers (Helmet.js)
Install and configure `helmet` middleware on the Express app. This sets critical headers with a single call:
- `Content-Security-Policy` — prevents XSS and inline script injection.
- `Strict-Transport-Security` — enforces HTTPS.
- `X-Frame-Options: DENY` — prevents clickjacking.
- `X-Content-Type-Options: nosniff`.

> ⚠️ **Warning:** Without these headers, the API is vulnerable to clickjacking and MIME-type sniffing attacks even if authentication is correct.

---

### 2. 🔒 JWT Refresh Token Rotation with Reuse Detection
The `RefreshToken` model already stores `tokenHash`, `revoked`, `ipAddress`, and `userAgent`. Implement **single-use rotation**: every token refresh invalidates the old token and issues a new one. If a revoked token is ever presented again, immediately revoke the entire token family for that user (indicating token theft).

---

### 3. 🚦 Per-Route Rate Limiting
Add `express-rate-limit` with separate limiters per route class:
- `/api/v1/auth/login` → **10 requests / 15 minutes** per IP.
- `/api/v1/auth/refresh` → **30 requests / 15 minutes** per IP.
- General API → **300 requests / 15 minutes** per authenticated user.

The `failedLogins` and `lockedUntil` fields on `User` are already there — rate limiting at the network layer adds a first line of defense before the DB is hit.

---

### 4. 🔐 argon2 Password Hashing (Replace bcrypt)
Migrate `passwordHash` from `bcrypt` to `argon2id` (the Password Hashing Competition winner). `argon2id` is memory-hard, making offline brute-force attacks ~1000× more expensive per attempt. The migration can be done transparently: rehash on next login for existing users.

---

### 5. ✅ Strict Input Validation with Zod Schemas
Wrap every API route handler with a `zod` schema parsed before the controller runs. This prevents:
- Mass-assignment attacks (unexpected fields in `req.body`).
- SQL injection via malformed UUIDs or strings passed to Prisma.
- Type coercion vulnerabilities in package credit amounts.

The `configJson` field on `Game` is especially important — validate its structure server-side, not just client-side.

---

### 6. 🕵️ Audit Log for All Sensitive Actions
The `AuditLog` model exists but usage may be incomplete. Ensure every sensitive action is recorded:
- Admin granting credits or assigning packages.
- Any user role change.
- Password resets.
- Failed login attempts (with IP).
- Token revocations.

Expose an **Admin Audit Trail** UI tab so Super Admins can review all sensitive operations chronologically.

---

### 7. 🧹 Environment Variable Hardening
Audit `backend/.env` and ensure:
- `JWT_SECRET` and `REFRESH_SECRET` are ≥ 64 random bytes (not human-readable passphrases).
- Database credentials are rotated periodically.
- No secrets exist in `frontend/.env` (Vite exposes all `VITE_` prefixed vars to the client bundle).
- Add a startup check that `NODE_ENV === 'production'` rejects any placeholder secrets.

> ⚠️ **Caution:** Any secret committed in `backend/.env` should be immediately rotated if the repo has ever been public.

---

### 8. 🔑 Role-Based Access Control (RBAC) Middleware Hardening
Audit every API route to confirm role guards are enforced at the middleware level, not just inside controller logic. Specifically:
- `POST /api/v1/packages/grant-credits` must be `SUPER_ADMIN` only (not `ADMIN`).
- `DELETE /api/v1/games/:id` must verify the requesting teacher is the game creator.
- Students must not be able to view other students' homework or recordings.

---

### 9. 🌐 CORS Policy Lockdown
Replace `cors({ origin: '*' })` (if present) with an explicit allowlist:
```ts
cors({
  origin: ['https://engrew.com', 'http://localhost:3000'],
  credentials: true,
})
```
This prevents unauthorized third-party web pages from making authenticated cross-origin requests using a user's cookies or tokens.

---

### 10. 📂 Secure File Upload Validation
When teacher/student attachments (homework, voice recordings) are uploaded:
- Validate MIME type **server-side** using `file-type` (magic bytes), not just the `Content-Type` header.
- Enforce maximum file size limits (e.g., 10 MB for PDFs, 25 MB for audio).
- Store files in private cloud storage (S3 with signed URLs) — never serve user-uploaded files from a public URL without expiry.

---

### 11. 🍪 Secure Cookie Configuration for Tokens
If refresh tokens are stored in cookies (recommended over `localStorage`):
- Set `HttpOnly: true` — prevents JavaScript access.
- Set `Secure: true` — HTTPS only.
- Set `SameSite: Strict` — prevents CSRF.
- Set an explicit `Domain` and short `Max-Age` matching the token's `expiresAt`.

---

### 12. 🔍 Dependency Vulnerability Scanning (npm audit + Snyk)
Integrate `npm audit --audit-level=high` into the CI/CD pipeline. Add a `snyk` scan as a GitHub Actions step that blocks deployment if any critical CVE is found in the dependency tree. Run for both `frontend/` and `backend/` packages.

---

### 13. 🛑 SQL Injection Prevention — Parameterized Prisma Queries Only
Audit the codebase for any use of `prisma.$queryRaw` or `prisma.$executeRaw` with string interpolation. Replace with `Prisma.sql` tagged template literals which enforce parameterization. Even though Prisma is generally safe, raw query escapes deserve explicit review.

---

### 14. 🔏 Data Encryption at Rest for PII
Encrypt sensitive student PII fields before writing to the database:
- Student `notes` (may contain medical or learning disability info).
- Teacher `bio`.
- `teacherFeedback` and `comments` on homework.

Use AES-256-GCM with a key stored in a secrets manager (AWS KMS, HashiCorp Vault) — not in the `.env` file.

---

### 15. 🧪 Automated Security Testing in CI
Add the following to the GitHub Actions workflow:
- **SAST**: Run `semgrep` with the `r/typescript` and `r/nodejs` rulesets on every PR.
- **DAST**: Run `OWASP ZAP` baseline scan against the staging API after each deployment.
- **Secret scanning**: Enable GitHub's native secret scanning + `gitleaks` pre-commit hook to prevent accidental credential commits.

---

## 📌 Priority Matrix

| Priority | Suggestion | Category |
|----------|-----------|----------|
| 🔴 **Critical** | HTTP Security Headers (Helmet) | Security |
| 🔴 **Critical** | Rate Limiting on Auth Routes | Security |
| 🔴 **Critical** | JWT Refresh Token Rotation | Security |
| 🟠 **High** | Stripe Self-Service Package Purchase | New Feature |
| 🟠 **High** | Redis Query Caching for Hot Endpoints | Performance |
| 🟠 **High** | Zod Input Validation on All Routes | Security |
| 🟠 **High** | PWA Support | New Feature |
| 🟡 **Medium** | Smart Lesson Reminder Notifications | New Feature |
| 🟡 **Medium** | React Query (TanStack Query) Integration | Performance |
| 🟡 **Medium** | Frontend Bundle Splitting & Lazy Routing | Performance |
| 🟡 **Medium** | AI-Powered Hebrew Writing Correction | New Feature |
| 🟡 **Medium** | RBAC Middleware Hardening | Security |
| 🟢 **Nice to Have** | Parent / Guardian Portal | New Feature |
| 🟢 **Nice to Have** | Automated Certificate of Completion | New Feature |
| 🟢 **Nice to Have** | Materialized Leaderboard View | Performance |

---

*Document generated for the **Engrew** Hebrew Learning Platform — November 2026.*
