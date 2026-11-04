# Engrew — Comprehensive System Documentation & Architectural Reference

> **Platform:** Bilingual (English / Hebrew) Online Hebrew Learning Platform  
> **Brand Identity:** Engrew — Deep Mediterranean Teal (`#0c4a60`) & Golden Olive (`#8ea53d`)  
> **Status:** Fully Implemented & Running Locally  
> **Frontend URL:** [http://localhost:3000](http://localhost:3000)  
> **Backend API URL:** [http://localhost:5001/api/v1](http://localhost:5001/api/v1)  
> **API Health:** [http://localhost:5001/api/health](http://localhost:5001/api/health)  

---

## 1. Quick Start & Demo Credentials

The platform is seeded with production-grade test accounts covering every role. Quick one-click sign-in buttons are also provided on the [Login Screen](http://localhost:3000/login):

| Role | Email | Password | Primary Capabilities |
|------|-------|----------|----------------------|
| **Super Admin** | `admin@learnhebrew.com` | `Admin@2026!` | Apple-style Glassy Sidebar, Live Landing Page CMS, User CRUD, Packages, 25m Bookings |
| **Teacher** | `sarah.cohen@learnhebrew.com` | `Teacher@2026!` | Interactive 25-min Availability Calendar (12h IST), Zoom Launcher, Homework, Recordings |
| **Student (Beginner)** | `daniel.cohen@learnhebrew.com` | `Student@2026!` | 25-min Slot Booking (12h IST), Alef-Bet 3D Audio Flashcards, Matching Game, Quizzes |
| **Student (Intermediate)** | `noah.miller@gmail.com` | `Student@2026!` | Active package tracker, Homework submission, Leaderboard rank #1 |

---

## 2. Brand Identity & Design System

### 2.1 Logo Optimization & Bounding Box Extraction
- The brand asset (`Logo/EngrewLogo.png`, 1408×768) possessed ~65% empty transparent padding around the artwork.
- We cropped the logo to its visible content box (`500×568 px`), saved to `/frontend/public/logo.png`.
- The Navigation header container was expanded (`h-12 sm:h-14`) with high-DPI scaling and the official brand name **Engrew**.

### 2.2 Dual-Tone Brand Color System
Configured in `frontend/tailwind.config.js`:
- **Primary Deep Teal**:
  - `brand-teal-800: #0c4a60` (Core Identity)
  - `brand-teal-900: #083747` / `brand-teal-950: #04222d`
- **Accent Golden Olive**:
  - `brand-olive-500: #8ea53d` (Gold Accent)
  - `brand-olive-600: #758c2e` / `brand-olive-700: #5a6d25`

### 2.3 Clean Professional Aesthetics (Zero Raw Emojis)
- Replaced all raw Unicode emojis with high-fidelity, accessible vector icons from Lucide (`Sun`, `Moon`, `Star`, `CheckCircle`, `Calendar`, `Video`, `Award`, `Sparkles`, `Clock`, `Globe2`, `Sliders`, `X`).
- Database records and default CMS translations were cleaned of legacy symbols.

### 2.4 Complete Dark Mode Architecture
- **State & Persistence**: Implemented in [`frontend/src/store/themeStore.ts`](file:///Users/moustafamaher/Data/Work/Freelancing/Engrew/frontend/src/store/themeStore.ts) using Zustand with `localStorage ('engrew_theme')` persistence and automatic system preference detection (`prefers-color-scheme`).
- **One-Click Navbar Toggle**: Accessible Sun/Moon toggle button in the header alongside language selector.
- **Deep Palette Calibration**:
  - Light mode: Pure slates (`bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-900`).
  - Dark mode: OLED-friendly contrast (`dark:bg-slate-950`, `dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-white`, `dark:text-slate-300`).
- **Uniform Coverage**: Active across Navbar, Landing Page, Login Page, Student Dashboard, Teacher Dashboard, Admin Dashboard, Modals, and Games Suite (`FlashcardGame`, `MatchingGame`, `QuizGame`).

---

## 3. High-Impact Enhancements Implemented

### 3.1 Symmetrical & Comfortable Dashboard Layouts
- **Student Dashboard**: Top 3 status cards (Active Package, Upcoming 25-Min Lesson, Pending Homework) share matched paddings, full equal-height cards (`items-stretch h-full flex flex-col justify-between`), aligned bottom action buttons, and uniform responsive grids.
- **Teacher Dashboard**: Consistent 25-minute availability slot matrix with uniform height (`h-28`) across configured, booked, and available states.
- **Admin Dashboard**: Matched KPI metric cards and Apple-style frosted glass sidebar navigation.

### 3.2 Premium Glassy Split-Screen Login Layout (`LoginPage.tsx`)
- **Left Panel (Hero & Utility Brief)**:
  - Deep Teal gradient canvas with glowing ambient light.
  - Prominent Engrew logo and Hebrew academy wordmark.
  - Clear utilities overview:
    - 25-minute high-retention micro-lessons.
    - Synchronized Israel Timing (IST/IDT) schedules.
    - Real interactive games suite (audio flashcards, matching pairs, timed quizzes).
    - Google Drive cloud recordings & teacher notes.
- **Right Panel (Glassy Authentication)**:
  - Frosted glass container (`backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60`).
  - Secure email/password login with real-time feedback.
  - **1-Click Demo Evaluation Buttons** for Super Admin, Certified Teacher, and Student.
- **Responsive Geometry**:
  - Stacks vertically on small 6-inch mobile screens (< 640px).
  - Unfolds into an elegant 12-column split canvas on tablets and 16-inch laptops.

### 3.3 Ultra-Modern Landing Page (`LandingPage.tsx`)
- Grounded in real Hebrew subject matter, avoiding generic AI-generated templates.
- **Interactive Hebrew Audio Preview**: Lets prospective students click Hebrew words (`שָׁלוֹם`, `תּוֹדָה`, `אַהֲבָה`) to listen to native pronunciation using the Web Speech API (`he-IL`).
- **Real-Time CMS Customizer Integration**: Renders announcements, badges, hero headlines, and 3 feature cards live from PostgreSQL (`/settings/landing-page`).
- **25-Minute Micro-Lesson Scientific Showcase**: Highlights cognitive retention benefits (+40% retention vs 60m classes).
- **Israel Timing Coordination Showcase**: Explains how morning, afternoon, and evening slots correspond to Israel Standard Time.
- **Interactive FAQ Accordion**: Addresses common questions regarding 25m lessons, time zones, recordings, and gamification points.

### 3.4 12-Hour AM/PM System & Israel Timing (`Asia/Jerusalem`)
- Implemented in dedicated utility [`frontend/src/lib/timeUtils.ts`](file:///Users/moustafamaher/Data/Work/Freelancing/Engrew/frontend/src/lib/timeUtils.ts).
- All time intervals display in clean **12-hour AM/PM format** (e.g. `09:00 AM – 09:25 AM`, `02:30 PM – 02:55 PM`).
- Timezone is explicitly anchored to **Israel Timing (`IDT`/`IST`, Asia/Jerusalem, UTC+2 / UTC+3)** across:
  1. **Teacher Dashboard**: Weekly availability matrix and lesson schedules.
  2. **Student Dashboard**: 25-minute booking modal and upcoming lessons.
  3. **Admin Dashboard**: Bookings overview and teacher slot inspector.

### 3.5 Responsive Design Across All Devices (6" Phone to 16" Laptop)
- Fluid container widths (`max-w-7xl`, `max-w-5xl`, `max-w-[1500px]`).
- Scalable typography and touch targets (≥ 44px) on mobile.
- Mobile drawer navigation for the Admin dashboard sidebar on narrow screens.
- Zero horizontal overflow on 375px/390px mobile screens.

### 3.6 Professional Glassy Left Sidebar Navigation (Admin, Teacher, & Student)
All three portals (Super Admin, Certified Teacher, and Student) feature a unified, Apple-inspired left sidebar navigation:
- **Frosted Glass Elevation**: `backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70` with subtle border rings and ambient color glow.
- **Teacher Dashboard Sidebar (`TeacherDashboard.tsx`)**:
  - Branded Instructor Portal header with live status dot.
  - Quick action: `+ Assign Homework` shortcut modal trigger.
  - Section tabs with live badges:
    1. `25-Min Availability` (active slot counter badge)
    2. `Scheduled Lessons` (upcoming lessons count)
    3. `My Students` (enrolled students count)
    4. `Homework Reviews` (pending review count)
  - Bottom profile card with teacher avatar, full name, email, and "TEACHER" verified badge.
  - Responsive mobile top bar with hamburger drawer toggle.
- **Student Dashboard Sidebar (`StudentDashboard.tsx`)**:
  - Student Portal header with student proficiency level pill (`ALEF`, `BET`, etc.).
  - Gamification stats widget (Total points earned + Day streak).
  - Quick action: `+ Book 25-Min Lesson` direct booking shortcut.
  - Section tabs with real-time badges:
    1. `Overview & Status` (Welcome banner, gamification, package usage progress)
    2. `Book 25-Min Slot` (Remaining package balance badge)
    3. `Lessons & Recordings` (Upcoming lessons count & Google Drive recordings)
    4. `Homework & Feedback` (Pending homework assignments count)
    5. `Hebrew Games` (Games suite count)
    6. `Leaderboard` (Student's live score & top rank)
  - Bottom profile pill with student initial, email, and "STUDENT" role badge.
  - Responsive mobile top bar with active tab label and drawer toggle.
- **Admin Dashboard Sidebar (`AdminDashboard.tsx`)**:
  - Super Admin navigation with tabs for Overview, Users Management, Packages & Subscriptions, 25-Min Slot Bookings, and Landing Page CMS Editor.

### 3.7 Header Navigation Simplification & Glassy Toast Notification System
- **Clean Header Navigation**: All redundant navigation tabs were removed from the top navbar. The header is reserved exclusively for the Engrew brand wordmark, language toggle (`EN` / `עב`), dark mode toggle, and authenticated user profile controls. All navigation is handled cleanly via the left glassy sidebars in each dashboard.
- **Modern Glassy Toast Popup Messages**: Completely removed all legacy browser `alert()` dialogs across the platform. Implemented an Apple-style frosted popup message system in [`toastStore.ts`](file:///Users/moustafamaher/Data/Work/Freelancing/Engrew/frontend/src/store/toastStore.ts) and [`ToastContainer.tsx`](file:///Users/moustafamaher/Data/Work/Freelancing/Engrew/frontend/src/components/common/ToastContainer.tsx) (`success`, `error`, `warning`, `info`) with smooth slide animations, Lucide status icons, and manual dismiss controls.
- **Strict Bilingual Language Separation**:
  - In **English mode**: Every single word on screen is in English, except the academy name **Engrew**.
  - In **Hebrew mode**: Every single word on screen is in Hebrew (RTL), except the academy name **Engrew**.
  - Applies universally to the Landing Page, Login Page, Student Dashboard, Teacher Dashboard, and Admin Dashboard.

---

## 4. Real Hebrew Interactive Games Suite

1. **Alef-Bet 3D Audio Flashcards** (`FlashcardGame.tsx`):
   - Native audio pronunciation via Web Speech API (`he-IL`).
   - 3D flip card animation revealing transliteration, phonetic guide, and vowels (Nikud).
2. **Click-to-Match Hebrew Pairs** (`MatchingGame.tsx`):
   - Shuffled Hebrew words and English translations.
   - Dynamic selection states, match confirmation, mismatch shake, and full confetti celebration (`canvas-confetti`).
3. **Timed Vocabulary Quiz** (`QuizGame.tsx`):
   - Real-time countdown timer with streak multipliers.
   - All games submit scores to `/api/v1/games/:id/play` and award points to the student ledger.

---

## 5. API Reference & Key Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/health` | Public | Backend health check & timestamp |
| `GET` | `/api/v1/settings/landing-page` | Public | Fetches current landing page CMS configuration |
| `PUT` | `/api/v1/settings/landing-page` | Admin | Updates landing page CMS with immediate persistence |
| `POST` | `/api/v1/packages/grant-credits` | Admin/Superadmin | Grants custom session credits directly to a student |
| `POST` | `/api/v1/packages/:id/assign` | Admin | Assigns a package with optional custom credits override |
| `GET` | `/api/v1/teachers` | Authenticated | Lists all teachers with ratings and availability slots |
| `GET` | `/api/v1/teachers/:id/slots` | Authenticated | Fetches a teacher's configured availability slots |
| `POST` | `/api/v1/teachers/:id/slots` | Teacher/Admin | Creates a slot (`dayOfWeek`, `startTime`, `endTime`, `durationMinutes`) |
| `DELETE` | `/api/v1/teachers/:id/slots/:slotId` | Teacher/Admin | Deletes an availability slot |
| `POST` | `/api/v1/lessons` | Authenticated | Books a session (25, 40, or 55 min; consumes 1 session credit) |
| `POST` | `/api/v1/lessons/:id/cancel` | Authenticated | Cancels a scheduled lesson and refunds 1 session credit |
| `GET` | `/api/v1/games` | Authenticated | Lists all games (filterable by `level`, `gameType`, `lessonId`, `createdById`) |
| `POST` | `/api/v1/games` | Teacher / Admin | Creates a custom game tied to a level and optional lesson |
| `PUT` | `/api/v1/games/:id` | Teacher / Admin | Updates a custom game's content, titles, level, or points |
| `DELETE` | `/api/v1/games/:id` | Teacher / Admin | Removes a custom game |
| `POST` | `/api/v1/games/:id/play` | Student | Submits game session and awards points to ledger |

---

## 6. Multi-Duration Session & Credit Management Engine

### Three Session Duration Formats:
1. **25 Minutes**: Fast, intensive retention sessions.
2. **40 Minutes**: Intermediate depth sessions with conversational practice.
3. **55 Minutes**: Comprehensive immersion and advanced grammatical drill sessions.

### Superadmin Credit Governance:
- **Direct Credit Grants**: Superadmin can grant any number of session credits directly to any student (`POST /api/v1/packages/grant-credits`), with customizable reasons and automatic 90-day validity.
- **Package Assignment Overrides**: Superadmin can assign packages with standard lesson counts or specify custom credit overrides (`customCredits`).
- **Real-Time Credit Balances**: Students and admins view real-time available credits (`lessonsTotal - lessonsUsed`), with visual progress bars and zero-credit booking protection.
- **Automated Credit Accounting**: Booking any session format consumes 1 credit; canceling a scheduled session automatically refunds 1 credit.

---

## 7. Teacher Custom Interactive Games Engine (By Level & Lesson)

Teachers can create and customize educational games tailored to specific proficiency levels and directly tied to student lessons:

### 7.1 Game Formats Supported:
1. **Flashcards (`FLASHCARD`)**:
   - Front: Hebrew term/phrase with full Niqqud (vowel points) support and live Web Speech API Hebrew speech synthesis (`he-IL`).
   - Back: English translation.
   - Example Sentence: Hebrew contextual sentence.
   - 3D CSS flip animation and self-assessed mastery counter.
2. **Word Matching (`MATCHING`)**:
   - Hebrew word cards paired with English translations.
   - Interactive matching logic with audio cues, wrong match alerts, and celebration confetti on completion.
3. **Timed Quizzes (`QUIZ`)**:
   - 4-option multiple-choice questions with bilingual prompts (English + Hebrew).
   - Radio option selector for specifying correct answer keys.
   - Instant score calculation and leaderboard points reward.

### 7.2 Lesson & Level Linkage:
- **Hebrew Levels**: `BEGINNER`, `ELEMENTARY`, `INTERMEDIATE`, `ADVANCED`.
- **Lesson Linkage**: Games can be assigned to a specific student lesson (`lessonId`), highlighting it on the student dashboard as "Direct Practice for Your Lesson" with duration and date context.
- **Instant Curriculum Presets**: Teachers can click **"Load Level Preset"** to auto-populate high-yield Hebrew vocabulary and quizzes for that level.
- **Interactive In-Dashboard Preview**: Teachers can play-test their customized game right inside the dashboard before publishing to students.
- **Zero Browser Alerts**: Safe, modern glass modals and toast notifications for all interactions, edits, and deletions.

---

## 8. How to Run Locally

### Start Backend:
```bash
cd backend
npm run dev
# Running on http://localhost:5001
```

### Start Frontend:
```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```
