# LearnHebrew — Full Project Plan & System Design

> **Platform:** Hebrew Language Learning Web Application
> **Stack:** React · Node.js (Express) · PostgreSQL · Vercel (Frontend) · Railway/Render (Backend)
> **Languages:** English 🇬🇧 · Hebrew 🇮🇱 (full i18n support)
> **Target Users:** Admin, Teachers, Students
> **Version:** 1.0.0
> **Date:** November 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Feature Specifications](#3-feature-specifications)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Security Design](#8-security-design)
9. [Performance Strategy](#9-performance-strategy)
10. [Internationalization (i18n)](#10-internationalization-i18n)
11. [Gamification System](#11-gamification-system)
12. [Calendar & Scheduling System](#12-calendar--scheduling-system)
13. [Package & Subscription System](#13-package--subscription-system)
14. [Feedback & Survey System](#14-feedback--survey-system)
15. [Admin Dashboard](#15-admin-dashboard)
16. [CI/CD Pipeline](#16-cicd-pipeline)
17. [Project Phases & Timeline](#17-project-phases--timeline)
18. [Technology Decisions](#18-technology-decisions)
19. [File & Folder Structure](#19-file--folder-structure)
20. [Environment Variables](#20-environment-variables)

---

## 1. Project Overview

**LearnHebrew** is a full-featured, bilingual (English/Hebrew) online Hebrew language learning platform. It connects students with professional Hebrew teachers through a managed scheduling system, tracks learning progress, gamifies the experience with points and games, and gives admins full control over users, packages, and content.

### Core Goals

| Goal | Description |
|------|-------------|
| **Smooth UX** | Fast, responsive, mobile-friendly navigation with no lag |
| **Admin Control** | Centralized management of users, packages, teachers, and calendar |
| **Student Experience** | Clear view of lessons, progress, subscriptions, and achievements |
| **Teacher Tools** | Calendar management, homework assignment, session notes |
| **Gamification** | Points system and games to increase engagement and retention |
| **Security** | Role-based access, encrypted data, secure APIs |
| **Scalability** | Architecture ready to handle growth without redesign |

---

## 2. User Roles & Permissions

### Role Hierarchy

```
Super Admin
  └── Admin
        ├── Teacher
        └── Student
```

### Permissions Matrix

| Feature                       | Super Admin | Admin | Teacher | Student |
|-------------------------------|:-----------:|:-----:|:-------:|:-------:|
| Create/Delete Users           | ✅ | ✅ | ❌ | ❌ |
| Create Email Accounts         | ✅ | ✅ | ❌ | ❌ |
| Assign Packages to Students   | ✅ | ✅ | ❌ | ❌ |
| Manage Packages               | ✅ | ✅ | ❌ | ❌ |
| View All Calendars            | ✅ | ✅ | ❌ | ❌ |
| Manage Own Calendar           | ✅ | ✅ | ✅ | ❌ |
| Assign Homework               | ✅ | ✅ | ✅ | ❌ |
| Add Session Notes             | ✅ | ✅ | ✅ | ❌ |
| View Own Schedule             | ✅ | ✅ | ✅ | ✅ |
| View Lessons & Materials      | ✅ | ✅ | ✅ | ✅ |
| Submit Lesson Feedback        | ❌ | ❌ | ❌ | ✅ |
| Submit Teacher Rating Survey  | ❌ | ❌ | ❌ | ✅ |
| View Subscription Status      | ✅ | ✅ | ❌ | ✅ |
| Play Games / Earn Points      | ❌ | ❌ | ❌ | ✅ |
| View Leaderboard              | ✅ | ✅ | ✅ | ✅ |
| System Settings               | ✅ | ❌ | ❌ | ❌ |

---

## 3. Feature Specifications

### 3.1 Authentication System

- **Admin-managed email creation** — only admins can create user accounts; no self-registration
- **JWT-based authentication** with access tokens (15 min) + refresh tokens (7 days)
- **Secure HTTP-only cookies** for refresh token storage
- **Password hashing** with bcrypt (cost factor 12)
- **First-login forced password change** flow
- **Role-based route guards** on both frontend and backend
- **Session invalidation** on logout (token blacklisting via Redis or DB)
- **Account lockout** after 5 failed login attempts (exponential backoff)
- **Audit log** for all auth events (login, logout, failed attempts, password changes)

---

### 3.2 Student Dashboard

The student's main view after login:

| Widget | Description |
|--------|-------------|
| **My Level** | Current Hebrew level (Beginner / Elementary / Intermediate / Advanced / Fluent) |
| **Upcoming Lessons** | Next scheduled lessons with teacher name, date, time, and join link |
| **Subscription Status** | Package name, expiry date, lessons used, lessons remaining, lessons taken this month |
| **Points & Achievements** | Total points earned, badges unlocked, current streak |
| **Recent Homework** | Pending assignments with due dates |
| **Lesson History** | Past lessons with Zoom recording link (via Google Drive) |
| **Quick Games** | Direct access to available language games |
| **Notifications** | Lesson reminders, homework due, subscription expiry alerts |

---

### 3.3 Teacher Dashboard

| Widget | Description |
|--------|-------------|
| **My Calendar** | Weekly/Monthly view of their schedule (regular + one-time classes) |
| **Today's Lessons** | List of today's sessions |
| **My Students** | List of assigned students with their levels and progress |
| **Pending Homework** | Assignments awaiting review |
| **Session Notes** | Per-session notes linked to each student |
| **Availability Management** | Set/update available time slots (30-minute slots) |
| **Notifications** | New bookings, student feedback, homework submissions |

---

### 3.4 Admin Dashboard

| Section | Features |
|---------|----------|
| **User Management** | Create, edit, deactivate users; assign roles; create email accounts |
| **Teacher Management** | View all teachers, their calendars, assigned students |
| **Student Management** | View all students, their levels, subscriptions, lesson history |
| **Package Management** | Create/edit/delete packages; assign packages to students |
| **Calendar Overview** | View all teachers' calendars in one unified view |
| **Bookings Management** | Create, modify, cancel bookings for any student/teacher |
| **Feedback & Reports** | View all teacher ratings and lesson feedback surveys |
| **Games Management** | Add/edit language games per level |
| **Analytics** | Usage stats, popular time slots, retention rates |
| **System Settings** | App config, notification settings, language toggle |

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│   React SPA (Vite)   ←→   i18n (EN/HE)   ←→   RTL Support │
│   TailwindCSS + Shadcn/UI                                   │
│   React Query (server state) + Zustand (client state)       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (REST + WebSocket)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                            │
│                                                             │
│   Node.js + Express.js                                      │
│   JWT Auth Middleware → Role Guard Middleware               │
│   Zod Validation → Controllers → Services → Repositories    │
│   Rate Limiting (express-rate-limit)                        │
│   Helmet.js (Security Headers)                              │
└────────┬───────────────────┬────────────────────────────────┘
         │                   │
         ▼                   ▼
┌──────────────┐    ┌─────────────────┐
│  PostgreSQL  │    │  Redis Cache    │
│  (Primary DB)│    │  (Sessions,     │
│              │    │   Rate Limits,  │
│  Prisma ORM  │    │   Real-time)    │
└──────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                       │
│                                                             │
│   SendGrid (Email Notifications)                            │
│   Google Drive (Recording Links via Teacher)                │
│   Zoom (External - Teacher manages independently)           │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Browser Request
    → Vercel Edge (CDN cache for static assets)
    → React Router (client-side routing)
    → React Query (check cache → API call)
    → Express Router
    → Auth Middleware (verify JWT)
    → Role Guard (check permissions)
    → Zod Validator (sanitize input)
    → Controller (orchestrate)
    → Service (business logic)
    → Prisma Repository (DB query)
    → PostgreSQL
    ← JSON Response
    ← React Query (cache response)
    ← UI Update
```

---

## 5. Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          ENUM('super_admin','admin','teacher','student') NOT NULL,
  language_pref ENUM('en','he') DEFAULT 'en',
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  must_change_pw BOOLEAN DEFAULT TRUE,
  failed_logins INTEGER DEFAULT 0,
  locked_until  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  created_by    UUID REFERENCES users(id)
);
```

#### `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked    BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `students`
```sql
CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  level         ENUM('beginner','elementary','intermediate','upper_intermediate','advanced','fluent') DEFAULT 'beginner',
  total_points  INTEGER DEFAULT 0,
  streak_days   INTEGER DEFAULT 0,
  last_lesson_at TIMESTAMP,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

#### `teachers`
```sql
CREATE TABLE teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio         TEXT,
  specialties TEXT[],
  rating_avg  DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `packages`
```sql
CREATE TABLE packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  name_he         VARCHAR(200) NOT NULL,
  description     TEXT,
  description_he  TEXT,
  total_lessons   INTEGER NOT NULL,
  validity_days   INTEGER NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

#### `student_packages`
```sql
CREATE TABLE student_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES students(id),
  package_id      UUID REFERENCES packages(id),
  assigned_by     UUID REFERENCES users(id),
  lessons_total   INTEGER NOT NULL,
  lessons_used    INTEGER DEFAULT 0,
  lessons_remaining INTEGER GENERATED ALWAYS AS (lessons_total - lessons_used) STORED,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          ENUM('active','expired','cancelled','completed') DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT NOW()
);
```

#### `time_slots`
```sql
CREATE TABLE time_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,       -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time  TIME NOT NULL,          -- e.g. '09:00:00'
  end_time    TIME NOT NULL,          -- always start_time + 30min
  slot_type   ENUM('regular','one_time') DEFAULT 'regular',
  is_available BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_slot_duration CHECK (end_time = start_time + INTERVAL '30 minutes')
);
```

#### `lessons`
```sql
CREATE TABLE lessons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID REFERENCES students(id),
  teacher_id        UUID REFERENCES teachers(id),
  time_slot_id      UUID REFERENCES time_slots(id),
  student_package_id UUID REFERENCES student_packages(id),
  scheduled_at      TIMESTAMP NOT NULL,
  duration_minutes  INTEGER DEFAULT 30,
  status            ENUM('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  lesson_type       ENUM('regular','one_time') DEFAULT 'regular',
  zoom_link         VARCHAR(500),
  recording_url     VARCHAR(500),    -- Google Drive link added by teacher
  teacher_notes     TEXT,
  cancelled_at      TIMESTAMP,
  cancelled_by      UUID REFERENCES users(id),
  cancel_reason     TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

#### `homework`
```sql
CREATE TABLE homework (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID REFERENCES lessons(id),
  student_id    UUID REFERENCES students(id),
  teacher_id    UUID REFERENCES teachers(id),
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  due_date      DATE,
  status        ENUM('pending','submitted','reviewed') DEFAULT 'pending',
  student_note  TEXT,
  teacher_feedback TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

#### `lesson_feedback`
```sql
CREATE TABLE lesson_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID UNIQUE REFERENCES lessons(id),
  student_id      UUID REFERENCES students(id),
  quality_rating  INTEGER NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  difficulty      INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  pace_rating     INTEGER CHECK (pace_rating BETWEEN 1 AND 5),
  comments        TEXT,
  submitted_at    TIMESTAMP DEFAULT NOW()
);
```

#### `teacher_surveys`
```sql
CREATE TABLE teacher_surveys (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID REFERENCES students(id),
  teacher_id         UUID REFERENCES teachers(id),
  communication      INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
  knowledge          INTEGER NOT NULL CHECK (knowledge BETWEEN 1 AND 5),
  punctuality        INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  overall_rating     INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comments           TEXT,
  submitted_at       TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_student_teacher_survey UNIQUE (student_id, teacher_id)
);
```

#### `games`
```sql
CREATE TABLE games (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200) NOT NULL,
  title_he    VARCHAR(200) NOT NULL,
  description TEXT,
  game_type   ENUM('flashcard','quiz','matching','fill_blank','pronunciation') NOT NULL,
  level       ENUM('beginner','elementary','intermediate','upper_intermediate','advanced','fluent') NOT NULL,
  config_json JSONB NOT NULL,     -- game-specific config (questions, cards, etc.)
  points_reward INTEGER DEFAULT 10,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `student_game_sessions`
```sql
CREATE TABLE student_game_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id),
  game_id     UUID REFERENCES games(id),
  score       INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed   BOOLEAN DEFAULT FALSE,
  played_at   TIMESTAMP DEFAULT NOW()
);
```

#### `points_ledger`
```sql
CREATE TABLE points_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id),
  event_type  ENUM('lesson_completed','game_played','homework_submitted','streak_bonus','manual') NOT NULL,
  points      INTEGER NOT NULL,
  reference_id UUID,              -- lesson_id or game_session_id or homework_id
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(300) NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  meta_json   JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(200) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   UUID,
  meta_json   JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API Design

### Base URL
```
Production:  https://api.learnhebrew.com/api/v1
Development: http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/login` | Public | Login with email + password |
| POST | `/auth/logout` | Auth | Logout & revoke refresh token |
| POST | `/auth/refresh` | Public (cookie) | Refresh access token |
| POST | `/auth/change-password` | Auth | Change password (first login) |
| POST | `/auth/forgot-password` | Public | Request password reset link |
| POST | `/auth/reset-password` | Public | Reset password with token |

### User Management (Admin+)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Admin | List all users with filters |
| POST | `/users` | Admin | Create a new user (email + role) |
| GET | `/users/:id` | Admin | Get user details |
| PATCH | `/users/:id` | Admin | Update user info |
| DELETE | `/users/:id` | Admin | Deactivate user |
| POST | `/users/:id/reset-password` | Admin | Force reset user password |

### Students

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/students` | Admin | List all students |
| GET | `/students/:id` | Admin, Teacher, Self | Student profile |
| PATCH | `/students/:id/level` | Admin | Update student level |
| GET | `/students/:id/dashboard` | Self | Full dashboard data |
| GET | `/students/:id/lessons` | Admin, Teacher, Self | Lesson history |
| GET | `/students/:id/packages` | Admin, Self | Package status |
| GET | `/students/:id/points` | Admin, Self | Points & achievements |
| GET | `/students/:id/homework` | Admin, Teacher, Self | Homework list |

### Teachers

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/teachers` | Admin | List all teachers |
| GET | `/teachers/:id` | Admin, Self | Teacher profile |
| GET | `/teachers/:id/calendar` | Admin, Teacher | Teacher's full calendar |
| GET | `/teachers/:id/slots` | Admin, Teacher, Student | Available time slots |
| POST | `/teachers/:id/slots` | Teacher | Add availability slot |
| PATCH | `/teachers/:id/slots/:slotId` | Teacher | Update a slot |
| DELETE | `/teachers/:id/slots/:slotId` | Teacher | Remove a slot |
| GET | `/teachers/:id/students` | Admin, Teacher | Students under this teacher |

### Lessons

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/lessons` | Admin | All lessons with filters |
| POST | `/lessons` | Admin | Book a lesson |
| GET | `/lessons/:id` | Auth | Lesson details |
| PATCH | `/lessons/:id` | Admin, Teacher | Update lesson (notes, recording) |
| DELETE | `/lessons/:id` | Admin | Cancel a lesson |
| POST | `/lessons/:id/complete` | Teacher | Mark lesson as completed |
| POST | `/lessons/:id/recording` | Teacher | Add Google Drive recording link |
| GET | `/lessons/:id/homework` | Auth | Get homework for this lesson |
| POST | `/lessons/:id/homework` | Teacher | Assign homework |

### Packages

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/packages` | Admin | All packages |
| POST | `/packages` | Admin | Create a package |
| PATCH | `/packages/:id` | Admin | Update a package |
| DELETE | `/packages/:id` | Admin | Delete a package |
| POST | `/packages/:id/assign` | Admin | Assign package to student |

### Feedback & Surveys

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/feedback/lesson/:lessonId` | Student | Submit lesson feedback |
| GET | `/feedback/lesson/:lessonId` | Admin, Teacher | View lesson feedback |
| POST | `/surveys/teacher/:teacherId` | Student | Submit teacher survey (once) |
| GET | `/surveys/teacher/:teacherId` | Admin | View all teacher surveys |

### Games

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/games` | Auth | List games (filtered by level) |
| GET | `/games/:id` | Auth | Get game config |
| POST | `/games` | Admin | Create a game |
| PATCH | `/games/:id` | Admin | Update a game |
| POST | `/games/:id/play` | Student | Record a game session + award points |
| GET | `/games/leaderboard` | Auth | Top students by points |

### Notifications

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/notifications` | Auth | Get user notifications |
| PATCH | `/notifications/:id/read` | Auth | Mark as read |
| PATCH | `/notifications/read-all` | Auth | Mark all as read |

---

## 7. Frontend Architecture

### Technology Stack

| Tool | Purpose |
|------|---------|
| **React 18** | UI framework with Concurrent Mode |
| **Vite** | Ultra-fast build tool |
| **TypeScript** | Type safety throughout |
| **TailwindCSS** | Utility-first styling |
| **Shadcn/UI** | Accessible, unstyled component library |
| **React Router v6** | Client-side routing with nested layouts |
| **React Query (TanStack)** | Server state, caching, background refetch |
| **Zustand** | Lightweight client-state management |
| **React Hook Form + Zod** | Form management and validation |
| **React-i18next** | Internationalization (EN/HE) |
| **FullCalendar** | Calendar UI for teacher schedules |
| **Recharts** | Analytics and progress charts |
| **Framer Motion** | Smooth animations and transitions |
| **Axios** | HTTP client with interceptors |
| **date-fns** | Date manipulation |

### Route Structure

```
/                           → Public landing page (EN/HE toggle)
/login                      → Login page
/change-password            → Force change password (first login)

/admin                      → Admin layout
  /admin/dashboard          → Admin overview
  /admin/users              → User management
  /admin/users/:id          → User detail/edit
  /admin/teachers           → Teacher management
  /admin/teachers/:id       → Teacher detail + calendar
  /admin/students           → Student management
  /admin/students/:id       → Student detail
  /admin/packages           → Package management
  /admin/calendar           → Unified calendar view
  /admin/bookings           → All bookings
  /admin/feedback           → Feedback & surveys
  /admin/games              → Game management
  /admin/analytics          → Reports and analytics

/teacher                    → Teacher layout
  /teacher/dashboard        → Today's overview
  /teacher/calendar         → Personal calendar + slot management
  /teacher/students         → My students list
  /teacher/students/:id     → Student profile view
  /teacher/homework         → Homework management

/student                    → Student layout
  /student/dashboard        → Main student dashboard
  /student/lessons          → Lesson history + recordings
  /student/schedule         → Upcoming lessons
  /student/subscription     → Package & subscription status
  /student/homework         → My homework
  /student/games            → Games lobby (filtered by level)
  /student/games/:id        → Play a game
  /student/leaderboard      → Points leaderboard
  /student/profile          → Profile settings
```

### Component Architecture

```
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx             # All route definitions
│   └── providers.tsx          # QueryClient, i18n, theme
├── components/
│   ├── ui/                    # Shadcn base components
│   ├── common/                # Shared app components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── LoadingSpinner.tsx
│   ├── admin/                 # Admin-specific components
│   ├── teacher/               # Teacher-specific components
│   ├── student/               # Student-specific components
│   └── games/                 # Game components per type
├── pages/                     # Page-level components
├── hooks/                     # Custom React hooks
├── services/                  # API service functions
├── store/                     # Zustand stores
├── types/                     # TypeScript interfaces
├── utils/                     # Helper functions
├── lib/                       # axios instance, query client
└── locales/
    ├── en/
    │   └── translation.json
    └── he/
        └── translation.json
```

---

## 8. Security Design

### Authentication Security

- **JWT Access Token**: 15-minute expiry, signed with RS256 (asymmetric keys)
- **Refresh Token**: 7-day expiry, stored as HTTP-only Secure SameSite=Strict cookie
- **Token Rotation**: New refresh token issued on every refresh request
- **Refresh Token Reuse Detection**: If reused refresh token is detected → revoke entire session family
- **Account Lockout**: After 5 failed logins → locked for 15 min (exponential backoff)
- **PKCE flow** ready for future OAuth integration (Google, etc.)

### API Security

```
Every API request:
  1. Rate limiting (100 req/15min per IP; 1000 req/15min per authenticated user)
  2. CORS whitelist (only allowed origins)
  3. Helmet.js security headers:
     - X-Content-Type-Options: nosniff
     - X-Frame-Options: DENY
     - X-XSS-Protection: 1; mode=block
     - Content-Security-Policy: strict
     - Strict-Transport-Security: max-age=31536000
  4. JWT verification
  5. Role authorization check
  6. Input sanitization (Zod schema validation)
  7. SQL injection prevention (Prisma parameterized queries)
```

### Data Security

- **Passwords**: bcrypt with cost factor 12 (never stored in plain text)
- **PII Encryption**: Sensitive fields encrypted at rest using AES-256
- **Database**: SSL connection enforced; no direct external DB access
- **Env Vars**: Never hardcoded; stored in GitHub Secrets and deployment env
- **Audit Trail**: Every sensitive action logged with user, IP, timestamp

### Frontend Security

- **XSS Prevention**: React's built-in escaping + DOMPurify for any raw HTML
- **CSRF Protection**: Double-submit cookie pattern + SameSite cookie attribute
- **Sensitive data**: Never stored in localStorage; use in-memory + HTTP-only cookies
- **Route Guards**: Client-side role checks (backend is the final authority)

---

## 9. Performance Strategy

### Backend Performance

| Strategy | Implementation |
|---------|----------------|
| **Database Indexing** | Index on `user_id`, `teacher_id`, `student_id`, `scheduled_at`, `status` on all major tables |
| **Query Optimization** | Use `select` in Prisma to fetch only needed fields |
| **Pagination** | Cursor-based pagination for all list endpoints |
| **Connection Pooling** | PgBouncer or Prisma connection pool (max 10-20 connections) |
| **Redis Caching** | Cache frequently read data (packages list, games list, leaderboard) with TTL |
| **Response Compression** | gzip/brotli compression via `compression` middleware |
| **Eager Loading** | Use Prisma `include` to avoid N+1 queries |

### Frontend Performance

| Strategy | Implementation |
|---------|----------------|
| **Code Splitting** | React.lazy + Suspense for all route components |
| **React Query Caching** | staleTime and gcTime configured per query type |
| **Image Optimization** | WebP format, lazy loading, proper sizing |
| **Bundle Optimization** | Vite tree-shaking, dynamic imports |
| **Memoization** | React.memo + useMemo + useCallback where needed |
| **Virtual Lists** | Virtualized lists for large datasets (react-virtual) |
| **Prefetching** | Prefetch next-page data on hover for pagination |
| **Service Worker** | Offline shell caching for fast repeat visits |

### CDN & Hosting

- **Frontend**: Vercel Edge Network (CDN globally distributed)
- **Static Assets**: Served from Vercel CDN with long cache headers
- **API**: Deployed on Railway or Render with auto-scaling
- **Database**: Hosted PostgreSQL with daily backups (Neon or Supabase or Railway)

---

## 10. Internationalization (i18n)

### Configuration

- Library: **react-i18next** with **i18next-browser-languagedetector**
- Supported Languages: **English** (`en`) and **Hebrew** (`he`)
- RTL Support: Hebrew requires Right-to-Left layout. Use `dir="rtl"` on `<html>` and Tailwind's `rtl:` utilities
- Language persistence: Stored in user profile DB field + localStorage fallback

### RTL Implementation

```tsx
// In App.tsx
const { i18n } = useTranslation();

useEffect(() => {
  document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

### Translation Files Structure

```json
// locales/en/translation.json
{
  "nav": {
    "dashboard": "Dashboard",
    "lessons": "Lessons",
    "schedule": "Schedule",
    "subscription": "Subscription",
    "games": "Games",
    "leaderboard": "Leaderboard"
  },
  "dashboard": {
    "welcome": "Welcome back, {{name}}!",
    "upcomingLessons": "Upcoming Lessons",
    "myLevel": "My Level",
    "points": "Points",
    "subscription": {
      "expires": "Expires",
      "lessonsUsed": "Lessons Used",
      "lessonsRemaining": "Lessons Remaining"
    }
  },
  "levels": {
    "beginner": "Beginner",
    "elementary": "Elementary",
    "intermediate": "Intermediate",
    "upper_intermediate": "Upper Intermediate",
    "advanced": "Advanced",
    "fluent": "Fluent"
  }
}
```

```json
// locales/he/translation.json
{
  "nav": {
    "dashboard": "לוח הבקרה",
    "lessons": "שיעורים",
    "schedule": "לוח זמנים",
    "subscription": "מנוי",
    "games": "משחקים",
    "leaderboard": "לוח תוצאות"
  },
  "dashboard": {
    "welcome": "ברוך שובך, {{name}}!",
    "upcomingLessons": "שיעורים קרובים",
    "myLevel": "הרמה שלי",
    "points": "נקודות",
    "subscription": {
      "expires": "פג תוקף",
      "lessonsUsed": "שיעורים שנוצלו",
      "lessonsRemaining": "שיעורים שנותרו"
    }
  },
  "levels": {
    "beginner": "מתחיל",
    "elementary": "יסודי",
    "intermediate": "בינוני",
    "upper_intermediate": "מעל בינוני",
    "advanced": "מתקדם",
    "fluent": "שוטף"
  }
}
```

---

## 11. Gamification System

### Points Earning Events

| Event | Points Awarded | Notes |
|-------|---------------|-------|
| Complete a lesson | +50 | Awarded when teacher marks lesson complete |
| Submit homework | +20 | Awarded on submission |
| Play a game | +10 | Per game session |
| Achieve perfect game score | +25 | Bonus on 100% score |
| 7-day login streak | +100 | Streak bonus |
| 30-day streak | +500 | Major milestone |
| First lesson completed | +100 | One-time welcome bonus |
| Level up | +200 | When admin changes level |

### Badges / Achievements

| Badge | Condition |
|-------|-----------|
| 🌟 First Step | Complete first lesson |
| 📚 Bookworm | Submit 10 homework assignments |
| 🔥 On Fire | 7-day streak |
| 💪 Dedicated | 30-day streak |
| 🎮 Gamer | Play 20 games |
| 🏆 Top Student | Reach #1 on leaderboard |
| 🎯 Perfect | Get 100% on 5 games |
| 🌈 Level Up | Advance to Intermediate level |

### Games Available by Level

| Level | Available Game Types |
|-------|---------------------|
| Beginner | Alphabet flashcards, Letter matching, Basic word quiz |
| Elementary | Vocabulary flashcards, Word-picture matching, Simple sentence fill-in |
| Intermediate | Sentence construction, Grammar quiz, Vocabulary in context |
| Upper Intermediate | Reading comprehension quiz, Conjugation drill, Idiom matching |
| Advanced | Advanced grammar, Article reading + quiz, Listening comprehension |
| Fluent | Speed reading, Complex grammar drill, Full paragraph composition |

### Game Types Implementation

| Game Type | Description |
|-----------|-------------|
| **Flashcard** | Flip card to reveal Hebrew/English; student self-rates |
| **Multiple Choice Quiz** | 4-option questions with timer |
| **Matching Pairs** | Drag Hebrew words to English translations |
| **Fill in the Blank** | Type the missing Hebrew word in a sentence |
| **Pronunciation Guide** | Listen to audio → select the correct word written |

---

## 12. Calendar & Scheduling System

### Two-Calendar Model

The system maintains **two linked calendar views** per teacher:

| Calendar | Description |
|----------|-------------|
| **Regular Calendar** | Recurring weekly slots (e.g., every Monday 10:00–10:30 AM) |
| **One-Time Calendar** | Single-occurrence bookings at any time |

> **Linking Rule**: If a slot is booked as a one-time lesson, it becomes unavailable on the regular calendar automatically. The two calendars share the same underlying slot data — no double-booking is possible.

### Slot System

- Every time slot is exactly **30 minutes**
- Teachers set their available slots for each day of the week
- Students (via admin) book specific slots → slot becomes `is_available = false`
- When a lesson is cancelled → slot reverts to `is_available = true`

### Conflict Prevention

```
When booking a lesson:
  1. Check slot is_available = true
  2. Check no existing lesson exists for teacher at same scheduled_at
  3. Check student has an active package with remaining lessons > 0
  4. Lock the slot (DB transaction with FOR UPDATE)
  5. Create the lesson record
  6. Update lessons_used on student_package
  7. Commit transaction
```

### Calendar UI Features

- **Week view** and **Month view** toggleable
- **Color coding**: Available (green), Booked (blue), One-time (orange), Cancelled (gray)
- **Admin view**: See all teachers in one unified calendar with teacher color coding
- **Student view**: See upcoming lessons only (read-only)
- **Teacher view**: See own full calendar; click slot to view/manage

---

## 13. Package & Subscription System

### Package Fields

| Field | Description |
|-------|-------------|
| Name (EN + HE) | Package display name in both languages |
| Description (EN + HE) | Full description in both languages |
| Total Lessons | Number of lessons included |
| Validity Days | How many calendar days the package is valid |
| Price | Package price (for display/record purposes) |
| Currency | USD / EUR / ILS etc. |
| Status | Active / Inactive |

### Subscription Tracking Per Student

- Each student can have one **active package** at a time
- Dashboard shows: total lessons, used, remaining, monthly count, expiry date
- Notifications sent when: 3 lessons remaining, 1 lesson remaining, package expires in 7 days, package expired
- Admin can manually extend expiry date or top up lessons

### Lesson Counter Logic

```
On lesson completion:
  student_package.lessons_used += 1
  → triggers check: if lessons_remaining == 3 → send notification
  → triggers check: if lessons_remaining == 1 → send urgent notification
  → triggers check: if lessons_remaining == 0 → package status = 'completed'
```

---

## 14. Feedback & Survey System

### Survey Types

**Survey 1: Lesson Quality Feedback** (submitted by student after EVERY lesson)
- Lesson quality rating (1–5 stars)
- Difficulty level (1–5)
- Pacing (1–5: too slow / just right / too fast)
- Open comment (optional)
- Triggered automatically 1 hour after lesson end (notification prompt)

**Survey 2: Teacher Rating Survey** (submitted by student ONCE per teacher)
- Communication skills (1–5)
- Subject knowledge (1–5)
- Punctuality (1–5)
- Overall satisfaction (1–5)
- Written comment (optional)
- Can be updated by student at any time after submission

### Feedback Visibility

| Who | What They See |
|-----|--------------|
| Admin | All feedback and survey data with analytics |
| Teacher | Average ratings + comments for their own lessons/profile |
| Student | Only their own submitted feedback |

---

## 15. Admin Dashboard

### Analytics & Reports

The admin analytics section includes:

| Report | Metrics |
|--------|---------|
| **Overview** | Total students, teachers, active packages, lessons this month |
| **Lesson Analytics** | Lessons completed per week/month, cancellation rate, no-show rate |
| **Teacher Performance** | Average rating per teacher, lessons delivered, student feedback |
| **Student Progress** | Level distribution, average points, homework completion rate |
| **Package Analytics** | Most popular packages, revenue breakdown, expiring soon |
| **Game Engagement** | Most played games, average scores per game/level |

---

## 16. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npm run test
      - run: cd backend && npm run lint

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run build

  deploy-frontend:
    needs: [test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: [test-backend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Railway / Render auto-deploys on push to main
      # or use their CLI here
```

### Deployment Environments

| Environment | Frontend URL | Backend URL | DB |
|-------------|-------------|-------------|-----|
| Development | localhost:3000 | localhost:5000 | Local PostgreSQL |
| Staging | staging.learnhebrew.com | api-staging.learnhebrew.com | Staging DB |
| Production | learnhebrew.com | api.learnhebrew.com | Production DB |

---

## 17. Project Phases & Timeline

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Project setup: monorepo, TypeScript configs, linting (ESLint + Prettier)
- [ ] Backend: Express + Prisma + PostgreSQL setup
- [ ] Database schema migration setup
- [ ] Auth system (JWT, refresh tokens, role guard)
- [ ] Frontend: Vite + React + Tailwind + Shadcn/UI setup
- [ ] i18n setup (EN + HE with RTL)
- [ ] CI/CD pipeline setup (GitHub Actions + Vercel)

### Phase 2 — Core Features (Weeks 3–5)
- [ ] Admin dashboard: User management (CRUD + email creation)
- [ ] Admin dashboard: Package management
- [ ] Teacher dashboard: Profile + availability slot management
- [ ] Calendar UI: FullCalendar integration (regular + one-time views)
- [ ] Booking system: Link students + teachers + packages + slots
- [ ] Student dashboard: Subscription status + upcoming lessons

### Phase 3 — Advanced Features (Weeks 6–8)
- [ ] Homework system (assign, submit, review)
- [ ] Google Drive recording link integration (teacher uploads link)
- [ ] Lesson notes system
- [ ] Feedback & Survey system
- [ ] Notification system (in-app + email via SendGrid)
- [ ] Points & gamification system (ledger, badges, leaderboard)

### Phase 4 — Games & Polish (Weeks 9–10)
- [ ] Games lobby UI (level-filtered)
- [ ] Flashcard game implementation
- [ ] Multiple choice quiz game implementation
- [ ] Matching pairs game implementation
- [ ] Admin game management panel
- [ ] Analytics dashboard for admin

### Phase 5 — QA, Security & Launch (Weeks 11–12)
- [ ] Full security audit (penetration testing checklist)
- [ ] Performance testing + optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile responsiveness testing (iOS + Android browsers)
- [ ] Hebrew RTL layout testing
- [ ] User acceptance testing (UAT) with client
- [ ] Bug fixes from UAT
- [ ] Production deployment
- [ ] Post-launch monitoring setup

---

## 18. Technology Decisions

### Why These Technologies?

| Technology | Reason |
|-----------|--------|
| **React + Vite** | Fastest dev experience; large ecosystem; perfect for SPAs |
| **TypeScript** | Catches bugs at compile time; better DX; self-documenting code |
| **Node.js + Express** | Lightweight, flexible, great for REST APIs; same language as frontend |
| **PostgreSQL** | ACID-compliant; relational data fits this domain perfectly; powerful |
| **Prisma ORM** | Type-safe DB queries; auto-generated types; easy migrations |
| **TailwindCSS** | Utility-first = faster styling; great RTL support via `rtl:` utilities |
| **Shadcn/UI** | Accessible, unstyled components that fit any design |
| **React Query** | Best-in-class server state management; built-in caching and refetching |
| **Zustand** | Simple, lightweight client state; zero boilerplate |
| **FullCalendar** | Professional calendar UI with RTL support |
| **Redis** | Fast in-memory cache for sessions, rate limits, and real-time features |
| **Vercel** | Zero-config deployment for React apps; global CDN |

---

## 19. File & Folder Structure

```
LearnHebrew/
├── docs/                           # ← This documentation folder
│   ├── github-setup.md
│   └── project-plan.md
├── frontend/                       # React application
│   ├── public/
│   │   └── locales/               # i18n translation files
│   │       ├── en/translation.json
│   │       └── he/translation.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn components
│   │   │   ├── common/           # Shared components
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   └── games/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   └── student/
│   │   ├── hooks/
│   │   ├── services/             # API calls (axios)
│   │   ├── store/                # Zustand stores
│   │   ├── types/                # TypeScript interfaces
│   │   ├── utils/
│   │   └── lib/
│   │       ├── axios.ts          # Axios instance + interceptors
│   │       └── queryClient.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/                        # Node.js API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts       # Prisma client
│   │   │   ├── redis.ts
│   │   │   └── env.ts            # Env validation with Zod
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── roleGuard.ts      # Role-based access
│   │   │   ├── rateLimiter.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.router.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts  # Zod schemas
│   │   │   ├── users/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── lessons/
│   │   │   ├── packages/
│   │   │   ├── feedback/
│   │   │   ├── games/
│   │   │   └── notifications/
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── bcrypt.ts
│   │   │   ├── email.ts          # SendGrid integration
│   │   │   └── auditLog.ts
│   │   └── app.ts                # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
└── README.md
```

---

## 20. Environment Variables

### Backend `.env`

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/learnhebrew
DIRECT_URL=postgresql://user:password@localhost:5432/learnhebrew

# Redis
REDIS_URL=redis://localhost:6379

# JWT (use RS256 asymmetric keys in production)
JWT_SECRET=your-very-long-random-secret-min-64-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-very-long-random-refresh-secret-min-64-chars
JWT_REFRESH_EXPIRES_IN=7d

# Email
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@learnhebrew.com
FROM_NAME=LearnHebrew

# App
APP_NAME=LearnHebrew
BCRYPT_ROUNDS=12
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=LearnHebrew
VITE_DEFAULT_LANGUAGE=en
```

---

> **Document Version**: 1.0
> **Prepared by**: Development Team
> **Last Updated**: November 2026
> **Status**: Ready for Implementation ✅

