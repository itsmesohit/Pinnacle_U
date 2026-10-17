# Pinnacle College — Student Information & Academic Management System (SIS)

A modern, responsive, role-based College Student Management System built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**. The application features an enterprise SaaS dashboard aesthetic inspired by modern productivity tools such as Linear, Vercel, and Stripe.

---

## 🚀 Live Demo Credentials

The application includes predefined demo accounts with pre-seeded data. You can switch between roles with a single click on the login screen:

| Role | Email Address | Password | Permissions Summary |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `admin123` | Full administrative control: students, faculty, courses, departments, attendance, grading, analytics, and system settings. |
| **Teacher** | `teacher@college.edu` | `teacher123` | Course-level management: view assigned classes, mark/edit attendance, record evaluation grades, student rosters. |
| **Student** | `student@college.edu` | `student123` | Personal academic portal: enrolled courses, attendance progress, evaluation scores, notices, and profile. |

---

## 🛠 Technology Stack

- **Core Framework:** React 18+ & Vite
- **Language:** TypeScript 5+ (Strict Type-Safety)
- **Styling:** Tailwind CSS with custom dark mode design tokens
- **Routing:** React Router v6 with declarative role-protected routes
- **Visualizations & Charts:** Recharts (Enrollment trends, departmental distribution, grade bands, benchmarks)
- **Micro-Animations:** Framer Motion
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form + Zod schema validation
- **Date Formatting:** date-fns
- **Toasts & Feedback:** Sonner accessible toast notification system
- **Persistence:** Browser `localStorage` with versioned schemas (`college_sis_v1_*`) and reactive event listeners

---

## 📦 Key Modules & Features

### 1. Role-Based Dashboards
- **Admin Dashboard:**
  - Executive stat cards: Total students, faculty, courses, departments, institutional attendance, and students below attendance threshold.
  - Interactive enrollment trend area charts with year/semester toggles.
  - Department distribution donut chart.
  - Course enrollment capacity bar charts.
  - Audit log of recent application operations.
  - Quick action shortcuts to enroll students, add teachers, or create courses.
- **Teacher Dashboard:**
  - Assigned courses and active enrollments count.
  - Daily scheduled lecture lineup with one-click attendance triggers.
  - Course capacity gauges and attendance averages.
  - Recent grade submissions and attendance logs.
- **Student Dashboard:**
  - Personalized welcome banner with degree program, student ID, and GPA estimate.
  - Real-time attendance rate progress indicators.
  - Enrolled courses with credit breakdowns and instructors.
  - Grade history and campus-wide notices.

### 2. Complete Student Management (CRUD)
- **Searchable & Sortable Directory:** Live debounced search across names, student IDs, and emails.
- **Multi-parameter Filtering:** Filter by department, academic year (1–4), semester (1–8), and status (`Active`, `Inactive`, `Graduated`, `Suspended`).
- **Data Export:** Export filtered student cohorts directly to UTF-8 compliant CSV.
- **Student Modal Form:** Validated inputs for personal info, inclusive gender options, academic data, home address, and guardian/emergency contacts.
- **Student Profile View:** Tabbed layout displaying personal details, registered courses, attendance session history, and evaluation grades.
- **Destructive Action Safety:** Confirmation dialogs for individual and bulk student deletions.

### 3. Faculty Management
- **Teacher Directory:** Search, filter by department, designation, and employment status (`Active`, `On Leave`, `Retired`, `Terminated`).
- **Teacher Profile:** View assigned courses, total students taught, and contact information.
- **Teacher Modal Form:** Manage professorial titles, specializations, joining dates, and departments.

### 4. Course & Department Management
- **Course Catalog:** Filter by department, semester, and course status.
- **Seat Capacity Limits:** Automatic seat saturation tracking (`enrolled` vs `maxCapacity`) with overflow guards.
- **Enrollment Engine:** Prevent duplicate student enrollments and enforce class capacity caps.
- **Department Hierarchy:** Track academic units, student/faculty totals, and appoint Department Heads.
- **Relational Integrity Guard:** Rejects department deletion if students, faculty, or courses are actively attached.

### 5. Attendance Module
- **Classroom Attendance Register:** Select course and session date.
- **Status Marking:** Fast toggle between `Present`, `Absent`, `Late`, and `Excused`.
- **Mark All Present:** One-click utility for rapid classroom submissions.
- **Institutional Policy:** Excused absences are excluded from attendance percentage calculations.
- **Deficit Alerts:** Automatically flags students with attendance rates below the configured minimum (default: 75%).

### 6. Grades & Academic Evaluation
- **Assessment Recording:** Record Quizzes, Midterms, Finals, Assignments, Projects, and Labs.
- **Automatic Grading:** Calculates percentage score and assigns letter grades (`A+` down to `F`) based on institutional grade bands.
- **Input Validation:** Prevents marks obtained from exceeding max marks.
- **Instructor Feedback:** Attach optional qualitative feedback for student guidance.
- **Cohort Grade Distribution:** Visual distribution chart showing grade frequency.

### 7. Campus Announcements & Alerts
- **Broadcast Notices:** Target announcements to `All Campus`, `Faculty Only`, or `Students Only`.
- **Administrative Controls:** Create, update, or remove bulletins with optional expiry dates.

### 8. Institutional Reports & Analytics
- **Cross-Departmental Benchmarks:** Compare average attendance rates against academic exam scores.
- **Deficit Audit Table:** Exportable list of at-risk students for early intervention.
- **CSV Data Dumps:** Export departmental summaries and audit registers.

### 9. Application Settings & Storage Control
- **Appearance Customizer:** Toggle between Light, Dark, or System matching themes.
- **Attendance Policy Configurator:** Customize the minimum threshold percentage.
- **Admin Storage Reset:** Re-seed initial demo dataset with a single confirmation.

---

## 🏃 Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm or pnpm

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd student_mngment_sys
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. Build production bundle:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

---

## 📂 Project Architecture

```
src/
├── app/
│   └── router.tsx             # Route definitions with role protection
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main application shell with sidebar & header
│   │   ├── Header.tsx         # Top bar: search, theme toggle, notifications, profile
│   │   ├── Sidebar.tsx        # Responsive collapsible sidebar navigation
│   │   └── ProtectedRoute.tsx # Client-side authorization guard
│   └── ui/
│       ├── Badge.tsx          # Status badges and semantic tags
│       ├── Button.tsx         # Reusable accessible button with loading states
│       ├── Card.tsx           # Surfaces, StatCards, and EmptyStates
│       ├── Dialog.tsx         # Accessible modal and confirm dialogs
│       ├── Input.tsx          # Form inputs and select dropdowns
│       ├── Table.tsx          # Paginated and sortable table components
│       └── Tabs.tsx           # Tabbed navigation switcher
├── context/
│   ├── AuthContext.tsx        # Session state, demo login, role permissions
│   └── ThemeContext.tsx       # Light / Dark / System theme management
├── hooks/
│   └── useData.ts             # Reactive data subscription, debouncing & pagination
├── lib/
│   ├── dataService.ts         # Central CRUD service with pub/sub event system
│   ├── seedData.ts            # Realistic college seed dataset (40 students, etc.)
│   ├── storage.ts             # Versioned localStorage storage layer & ID generator
│   └── utils.ts               # Tailwind class merge utility
├── pages/
│   ├── announcements/         # Bulletins & campus notices
│   ├── attendance/            # Classroom attendance register
│   ├── auth/                  # Login page with demo persona selector
│   ├── courses/               # Course catalog, details & student enrollment
│   ├── dashboard/             # Role-specific dashboards (Admin, Teacher, Student)
│   ├── departments/           # Department hierarchy management
│   ├── grades/                # Evaluation entry and grade distribution
│   ├── reports/               # Institutional benchmarks and deficit audit
│   ├── settings/              # Appearance, college parameters & storage reset
│   ├── students/              # Student directory and profiles
│   └── teachers/              # Faculty roster and profiles
└── types/
    └── index.ts               # Core TypeScript entity definitions
```

---

## 🌐 Static Deployment Instructions

The application is completely static and can be deployed directly to any static hosting provider.

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the root directory.
3. Configure build command: `npm run build` and output directory: `dist`.

### Deploy to Netlify
1. Connect repository in the Netlify dashboard.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add a `_redirects` file in `public/` with:
   ```text
   /*    /index.html   200
   ```

---

## 🔒 Security & Prototype Notice

> **Important:** This is a client-side frontend prototype built for evaluation and demonstration.
> - Data is persisted inside the browser's `localStorage` and is isolated to your specific browser profile.
> - Authentication and role-based permissions are simulated client-side. In a production environment, authorization checks and credential handling must be enforced by a hardened backend API and database.
