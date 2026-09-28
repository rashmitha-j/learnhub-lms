# LearnHub — Online Learning Management System

A full-stack MERN learning platform where **instructors** build and publish courses (sections, video lessons, quizzes) and **students** enroll, learn lesson by lesson, track their progress and take auto-graded quizzes. A minimal **admin** area provides platform oversight.

The project focuses on clean REST API design, server-side authorization (roles + resource ownership), and business rules enforced on the backend (progress and quiz scores are never trusted from the client).

---

## Features

### Student
- Register / log in (JWT)
- Browse the catalog with search, category & level filters, sorting and pagination
- Course details page with curriculum preview (lesson titles and durations; video links stay locked until enrollment)
- Free one-click enrollment (duplicate enrollment is prevented)
- Learning page: embedded YouTube/Vimeo player (other URLs open externally), section/lesson sidebar, previous/next navigation
- Mark lessons complete; progress % is calculated by the server
- Resume where you stopped (opens the first incomplete lesson)
- Course completion with a completion date when every lesson is done
- Quizzes: multiple-choice questions, server-side scoring, pass/fail against a passing score, full answer review after submitting, attempt history, retakes
- Dashboard: enrolled / in-progress / completed counts, average quiz score, recent courses, recent quiz results, quick actions
- Profile: edit name and bio, change password (email is read-only)

### Instructor
- Register as an instructor (role chosen at sign-up)
- Dashboard: total / published / draft courses, total students, recent enrollments
- Create and edit courses: title, description, category, level, thumbnail URL (live preview), requirements, learning outcomes
- Curriculum builder: add, rename, reorder and delete sections; add, edit, reorder and delete lessons (video URL + duration)
- Quiz editor: section-level or course-level quizzes, 2–6 options per question, choose the correct answer, passing score
- Publish / unpublish (a course needs at least one lesson before it can be published; new courses start as drafts)
- Per-course Students page: enrolled students with progress and status, plus all quiz results
- Delete a course (cascades to its sections, lessons, quizzes, enrollments and attempts)

### Admin (intentionally minimal)
- No public admin registration — admins are promoted manually (see [Creating an admin](#creating-an-admin))
- Platform stats (users by role, courses, enrollments, quiz attempts)
- Browse/search users (filter by role), all courses including drafts, and all enrollments (paginated)
- Publish/unpublish or delete any course

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, React Router 7, Axios, lucide-react icons, plain CSS (custom design tokens) |
| Backend | Node.js (20.19+), Express 5, Mongoose 9, express-validator, helmet, cors, morgan |
| Auth | JWT (jsonwebtoken, HS256), bcrypt password hashing |
| Database | MongoDB |
| Testing | Node's built-in test runner (`node:test`) + Supertest against a dedicated test database |
| Tooling | oxlint, nodemon, concurrently |

---

## Architecture

```
React SPA (Vite)  ──HTTP/JSON──►  Express REST API  ──Mongoose──►  MongoDB
  AuthProvider (JWT in localStorage)   routes → validators → auth/role middleware
  Axios client + service modules          → controllers → services → models
  Route guards by role                    centralized error handler
```

**Backend layering**
- `routes/` wire each endpoint to validation, `protect` (authentication) and `authorize(...roles)` (role check).
- `validators/` define express-validator rules; `middleware/validate.js` turns failures into `400` responses with field details.
- `controllers/` handle HTTP concerns; ownership checks live in `services/accessService.js` so every controller uses the same rules.
- `services/` contain business logic: progress recalculation, curriculum building, quiz grading, course stats (aggregations instead of N+1 queries), reordering.
- `middleware/errorHandler.js` maps Mongoose validation/cast errors, duplicate keys, JWT errors and malformed JSON to consistent responses.

**Response format**
```json
{ "success": true, "message": "optional", "data": { ... } }
{ "success": false, "message": "Validation failed", "details": [{ "field": "email", "message": "..." }] }
```

### Data model

| Model | Key fields | Indexes / constraints |
|-------|-----------|-----------------------|
| User | name, email, password (hashed, `select: false`), role (`student`/`instructor`/`admin`), bio | unique email (lower-cased) |
| Course | title, description, instructor → User, category, level, thumbnail, requirements[], learningOutcomes[], published, publishedAt | `{published, createdAt}`, `{published, category, level}`, `{instructor, updatedAt}` |
| Section | course → Course, title, order | `{course, order}` |
| Lesson | section → Section, course → Course (denormalized), title, description, videoUrl, duration (min), order | `{section, order}`, `{course}` |
| Enrollment | student, course, enrolledAt, completedLessons[], lastLesson, progress, completed, completedAt | **unique `{student, course}`**, `{course, enrolledAt}`, `{student, updatedAt}` |
| Quiz | course, section (optional), title, description, passingScore, questions[{question, options[], correctAnswer}] | `{course, section}` |
| QuizAttempt | student, quiz, course, answers[] (snapshot incl. correct answer), correctCount, totalQuestions, score, passed, submittedAt | `{quiz, student, submittedAt}`, `{student, submittedAt}`, `{course, submittedAt}` |

Quiz questions are embedded in the quiz document (they are always read and edited together). Attempts store a snapshot of each question so past results stay accurate if the quiz is edited later.

---

## Folder structure

```
lms/
├── package.json            # root scripts (dev runs both apps)
├── backend/
│   ├── .env.example
│   ├── src/
│   │   ├── app.js           # express app: helmet, CORS allowlist, routes, errors
│   │   ├── server.js        # DB connection, listen, graceful shutdown
│   │   ├── config/          # env.js (validated env vars), db.js
│   │   ├── controllers/     # auth, user, course, section, lesson, enrollment, quiz, instructor, admin, health
│   │   ├── middleware/      # auth (protect/optionalAuth/authorize), validate, errorHandler, notFound
│   │   ├── models/          # User, Course, Section, Lesson, Enrollment, Quiz, QuizAttempt
│   │   ├── routes/          # one router per resource, mounted under /api
│   │   ├── services/        # access, progress, course, quiz, order
│   │   ├── validators/      # express-validator rule sets
│   │   ├── utils/           # ApiError, apiResponse, constants, pagination, token, helpers
│   │   └── scripts/         # seed.js, promoteAdmin.js
│   └── tests/               # auth, courses, learning (integration tests)
└── frontend/
    ├── .env.example
    ├── vercel.json          # SPA rewrite
    └── src/
        ├── api/client.js    # axios instance, token + 401 handling, error helpers
        ├── services/        # auth, course, section, lesson, enrollment, quiz, user, instructor, admin
        ├── context/         # AuthProvider
        ├── hooks/           # useAuth, useApi, useDebouncedValue, useDocumentTitle
        ├── components/
        │   ├── layout/      # Navbar, Footer, Sidebar, MainLayout, DashboardLayout
        │   ├── routing/     # ProtectedRoute, RoleRoute, GuestRoute, ScrollToTop
        │   ├── ui/          # Button, Input, Select, Modal, ConfirmModal, Alert, Tabs, ProgressBar,
        │   │                #   StatusBadge, StatCard, Pagination, LoadingSpinner, ErrorMessage, EmptyState…
        │   ├── course/      # CourseCard, CourseGrid, CourseThumbnail, ListEditor, CourseSteps
        │   └── curriculum/  # SectionFormModal, LessonFormModal, QuizEditorModal
        ├── pages/           # public/, auth/, student/, instructor/, admin/, shared/
        └── utils/           # constants, format, video (YouTube/Vimeo embeds)
```

---

## Environment variables

**backend/.env** (copy from `backend/.env.example`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Long random secret used to sign tokens (**required**) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS, comma-separated |

**frontend/.env** (copy from `frontend/.env.example`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL including `/api`. Leave empty in development (Vite proxies `/api` to `localhost:5000`). |

`.env` files are git-ignored; only the `.env.example` placeholders are committed. Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Local setup

Requirements: **Node.js 20.19+** and a MongoDB instance (local `mongod` or a MongoDB Atlas cluster).

```bash
# 1. Install dependencies (root, backend, frontend)
npm run install:all

# 2. Configure environment
cp backend/.env.example backend/.env      # then set MONGO_URI and JWT_SECRET
cp frontend/.env.example frontend/.env    # optional in development

# 3. (Optional) load sample data — development only
npm run seed --prefix backend

# 4. Start API (http://localhost:5000) and web app (http://localhost:5173)
npm run dev
```

Other scripts:

| Command | Where | Purpose |
|---------|-------|---------|
| `npm run dev` | root | API + frontend together |
| `npm run build` | root | Frontend production build |
| `npm start` | root | Start the API (production) |
| `npm run lint` | root | Frontend lint (oxlint) |
| `npm test` | backend | API integration tests |
| `npm run seed` | backend | Reset the dev database with sample data |
| `npm run make-admin -- <email>` | backend | Promote an existing user to admin |

### Seed data (development only)

`npm run seed --prefix backend` **deletes all LMS data in the configured database** and inserts 5 users, 7 courses (6 published, 1 draft) with sections, lessons and quizzes, and sample enrollments. It refuses to run when `NODE_ENV=production`.

All seeded accounts share the fake, development-only password **`Password123`** (override with `SEED_PASSWORD`). Never use these accounts in a real deployment.

> **Local development only.** This password works only on a local database you seeded yourself. The live deployment's seeded accounts have different, private passwords. Never run the seed against the production database: it would wipe it and reset those accounts to this public password.

| Role | Email |
|------|-------|
| Admin | `admin@learnhub.dev` |
| Instructor | `instructor@learnhub.dev` |
| Instructor | `instructor2@learnhub.dev` |
| Student | `student@learnhub.dev` |
| Student | `student2@learnhub.dev` |

### Creating an admin

Admins cannot register through the API or UI. Register a normal account, then promote it:

```bash
npm run make-admin --prefix backend -- someone@example.com
```

(or set `role: "admin"` on the user document directly in MongoDB).

---

## API overview

All routes are prefixed with `/api`. 🔒 = requires a Bearer token.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | API + database status |
| POST | `/auth/register` | Public | Register as student or instructor (admin → 403) |
| POST | `/auth/login` | Public | Log in, returns `{ user, token }` |
| GET | `/auth/me` | 🔒 Any | Current user |
| PUT | `/users/me` | 🔒 Any | Update name/bio |
| PUT | `/users/me/password` | 🔒 Any | Change password |
| GET | `/courses` | Public | Published catalog: `search`, `category`, `level`, `instructor`, `sort`, `page`, `limit` |
| GET | `/courses/:id` | Public | Course details + curriculum preview (drafts visible to owner/admin only) |
| GET | `/courses/:id/content` | 🔒 Enrolled student / owner / admin | Full curriculum incl. video URLs |
| POST | `/courses` | 🔒 Instructor/Admin | Create course (starts as draft) |
| PUT | `/courses/:id` | 🔒 Owner/Admin | Update course, publish/unpublish |
| DELETE | `/courses/:id` | 🔒 Owner/Admin | Delete course (cascade) |
| POST | `/courses/:courseId/sections` | 🔒 Owner/Admin | Add section |
| PATCH | `/courses/:courseId/sections/reorder` | 🔒 Owner/Admin | Reorder sections `{ sectionIds }` |
| PUT / DELETE | `/sections/:id` | 🔒 Owner/Admin | Rename / delete section |
| POST | `/sections/:sectionId/lessons` | 🔒 Owner/Admin | Add lesson |
| PATCH | `/sections/:sectionId/lessons/reorder` | 🔒 Owner/Admin | Reorder lessons `{ lessonIds }` |
| GET | `/lessons/:id` | 🔒 Enrolled / owner / admin | Lesson content |
| PUT / DELETE | `/lessons/:id` | 🔒 Owner/Admin | Edit / delete lesson |
| POST | `/courses/:courseId/enroll` | 🔒 Student | Enroll (409 if already enrolled) |
| GET | `/enrollments/me` | 🔒 Student | My enrollments with progress |
| GET | `/enrollments/:courseId` | 🔒 Student | My enrollment in one course |
| POST | `/enrollments/:courseId/lessons/:lessonId/complete` | 🔒 Student | Mark lesson complete (idempotent) |
| GET | `/courses/:courseId/students` | 🔒 Owner/Admin | Enrolled students |
| POST | `/courses/:courseId/quizzes` | 🔒 Owner/Admin | Create quiz |
| GET | `/quizzes/:id` | 🔒 Enrolled / owner / admin | Quiz (answers hidden for students) |
| PUT / DELETE | `/quizzes/:id` | 🔒 Owner/Admin | Edit (incl. questions) / delete quiz |
| POST | `/quizzes/:id/submit` | 🔒 Enrolled student | Submit answers; server calculates score |
| GET | `/quizzes/:id/results` | 🔒 Student (own) / owner / admin (all) | Attempts |
| GET | `/quiz-attempts/me` | 🔒 Student | My recent attempts |
| GET | `/courses/:courseId/quiz-attempts` | 🔒 Owner/Admin | All attempts in a course |
| GET | `/instructor/dashboard` | 🔒 Instructor | Dashboard stats |
| GET | `/instructor/courses` | 🔒 Instructor | Own courses incl. drafts (`status`, `search`) |
| GET | `/admin/stats` | 🔒 Admin | Platform counts |
| GET | `/admin/users` · `/admin/courses` · `/admin/enrollments` | 🔒 Admin | Paginated lists |

---

## Security notes

- Passwords are hashed with bcrypt (12 rounds) and excluded from every query and response.
- JWTs carry only the user id and role; on every request the user **and role are reloaded from the database** — a tampered or stale role claim is ignored.
- `401` = missing/invalid/expired token; `403` = authenticated but not allowed (wrong role or not the owner/enrolled).
- Public registration only accepts `student` or `instructor`; `admin` is rejected with `403`.
- Login uses one generic error for unknown email and wrong password, and runs a bcrypt comparison in both cases so response times are similar.
- Ownership checks: instructors can only modify their own courses and everything inside them; admins can manage all courses.
- Draft courses return `404` to the public and cannot be enrolled in.
- Progress is derived on the server from completed lessons (idempotent `$addToSet`); client-sent progress values are ignored. Adding or deleting lessons recalculates every enrollment.
- Quiz correct answers are never sent to students before submission; scores are calculated on the server and client-sent scores are ignored.
- Input validation on every write endpoint (types, lengths, enums, http(s)-only URLs); search input is regex-escaped; object payloads (NoSQL injection attempts) are rejected.
- helmet security headers, CORS allowlist from `CLIENT_URL`, 1 MB body limit, stack traces hidden in production.
- No secrets in source code; configuration comes from environment variables.

---

## Testing

**Backend** — 77 integration tests run against a separate database (`lms_test` by default; override with `TEST_MONGO_URI`, the name must contain `test`). The database is dropped before and after each test file.

```bash
npm test --prefix backend
```

Coverage includes: registration (student/instructor, admin blocked, validation, duplicates), login (generic errors, injection payloads), `/auth/me`, missing/invalid/forged tokens, DB-role enforcement, role restrictions, profile and password changes, course CRUD, ownership, draft visibility, publish rules, search (incl. regex escaping), filters, pagination, sections/lessons CRUD + reorder + ownership, enrolled-only content access, enrollment and duplicate prevention, lesson completion, duplicate completion, progress calculation and recalculation after lesson changes, course completion, quiz CRUD and validation, hidden answers, server-side scoring, result visibility per role, dashboards and cascade deletes.

**Frontend** — `npm run lint` (oxlint) and `npm run build`. The UI flows (registration, login redirects, role routing, catalog search/filters, enrollment, learning & progress, quizzes, instructor course creation/curriculum/publishing, admin pages, and responsive layouts at 375/768/1280 px) were verified manually with a headless browser; there is no automated frontend test suite in the repository yet.

---

## Deployment

**Backend (Render — Web Service)**
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment: `NODE_ENV=production`, `MONGO_URI` (MongoDB Atlas), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL=https://<your-app>.vercel.app`
- Health check path: `/api/health`

**Frontend (Vercel)**
- Root directory: `frontend`, framework preset: Vite
- Build command: `npm run build`, output: `dist`
- Environment: `VITE_API_URL=https://<your-api>.onrender.com/api`
- `vercel.json` rewrites all routes to `index.html` so client-side routes work on refresh.

Node 20.19+ is required (`engines` in each `package.json`, `.nvmrc` at the root). Do not run the seed script against a production database.

---

## Future improvements (not implemented)

- Rate limiting on auth endpoints and account lockout
- Email verification, password reset and email change
- Refresh tokens / httpOnly cookie sessions
- Video uploads or hosting (lessons currently link to YouTube, Vimeo or external URLs)
- Automated frontend tests (component tests and Playwright end-to-end tests in CI)
- Drag-and-drop curriculum reordering (currently up/down buttons)
- Moving lessons between sections
- Course reviews/ratings and certificates of completion
- Tracking partial video watch time
- Payments, live classes, chat and notifications (intentionally out of scope)
