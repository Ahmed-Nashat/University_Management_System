# University Management System — Technical Documentation

> **Internal reference** · Last reviewed: September 17, 2026 · Repository layout: React/Vite frontend + Express/Sequelize API

## 1. What this project is

University Management System is a full-stack academic administration application. It has two deliberately separated experiences:

| Audience | What they can do |
| --- | --- |
| **Student** | Sign in with a student number, see only their own schedule and grades, browse sections, and enroll in an available section. |
| **Professor** | Sign in with email and password, then manage students, professors, departments, courses, semesters, sections, enrollments, and published grades. |
| **Visitor / reviewer** | Open a browser-only student or professor preview. Preview data is generated in memory and is never sent to MySQL. |

The backend is the source of truth for authorization. The frontend changes what is visible for each role, but it does not decide who is allowed to call an API.

## 2. Architecture at a glance

```text
Browser
  │
  ├─ React 19 + Vite UI (frontend/, port 5173 in development)
  │    └─ fetch('/api/...') with JSON and the browser session cookie
  │
  └─ Vite development proxy removes /api
       │
       ▼
Express 5 API (src/, port from PORT)
  ├─ login/session/origin middleware
  ├─ role gates: student portal or professor management
  ├─ controllers → services → Sequelize models
  │
  └─ MySQL through mysql2 / Sequelize 6
```

### Main runtime flow

1. `src/main.js` loads configuration, adds Express middleware, registers Sequelize relationships, authenticates/synchronizes the database, and starts listening.
2. `/auth/*` is public only for login/logout and session lookup.
3. Every route after `/auth` requires a valid session cookie.
4. `/portal/*` then permits students only; all management routes require a professor session.
5. Sequelize persists records in MySQL. Core academic models use timestamps and soft deletion; audit logs have `createdAt` only and no public update/delete endpoint.

## 3. Repository map

```text
University_Managment_System/
├── README.md                        # Quick-start and deployment notes
├── DOCUMENTATION.md                 # This detailed internal guide
├── database_design/
│   ├── erd_design.png                # Entity relationship diagram
│   └── relational_schema_design.png  # Relational schema diagram
├── frontend/                         # Browser application
│   ├── src/
│   │   ├── App.jsx                   # Workspace state, pages, live/demo loading
│   │   ├── Login.jsx                 # Role-specific login screen
│   │   ├── api.js                    # Fetch client, pagination, mutations
│   │   ├── modules.js                # UI field definitions and endpoint mapping
│   │   ├── demo.js                   # Non-persistent preview records
│   │   ├── components.jsx             # Dialogs and record forms
│   │   ├── DepartmentFilter.jsx      # Accessible custom department filter
│   │   └── styles.css                # Responsive visual system
│   └── tests/contracts.test.js       # UI/API contract unit tests
└── src/                              # API package
    ├── main.js                       # Application entry point
    ├── config/config.service.js      # Root .env loading
    ├── db/
    │   ├── connection.js             # Sequelize connection + sync
    │   └── model/                    # Models and relationships
    ├── common/                       # Errors, response helper, bcrypt helpers
    ├── module/                       # Auth and academic resource modules
    ├── scripts/prepare-student-enrollment.js
    └── tests/                        # Session and opt-in live integration tests
```

## 4. Technologies and why they are used

| Layer | Technology | Role in this project |
| --- | --- | --- |
| API runtime | Node.js, ES modules | Runs the backend with native `import` syntax. |
| HTTP server | Express 5 | Routing, JSON parsing, middleware, responses. |
| ORM | Sequelize 6 | Defines models, associations, validation, transactions, soft deletes, and MySQL queries. |
| Database driver | mysql2 | Sequelize's MySQL connector. |
| Database | MySQL | Persistent relational storage. |
| Password protection | bcrypt | Hashes professor passwords with cost factor 10 and compares credentials at login. |
| Configuration | dotenv | Loads the root `.env` file from `src/config/config.service.js`. |
| Backend DX | nodemon, cross-env | Restarts the development API and sets `NODE_ENV`. |
| Frontend | React 19 | Component-based UI, state, dialogs, role workspaces. |
| Bundler/dev server | Vite 8 | Development server, `/api` proxy, and production build. |
| Icons | lucide-react | Interface icon set. |
| Tests | Node built-in test runner | Contract, session, and optional live integration coverage. |

## 5. Local setup and commands

### Prerequisites

- Node.js **18+**
- A running MySQL server
- A MySQL database/user with access to the configured database

### Environment configuration

Create `.env` at the **repository root**. It is ignored by Git. Do not commit it or paste its real values into documentation.

```env
# API
PORT=3000
NODE_ENV=development

# MySQL
DB_NAME=university_managment_system
DB_USER=your_mysql_user
DB_PASSWORD=replace_with_your_private_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DIALECT=mysql

# Optional: comma-separated browser origins allowed to make writes
UI_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `PORT` | Yes | API listener | The app throws at startup when missing. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_DIALECT` | Effectively yes | Sequelize connection | Use `mysql` as the dialect. |
| `NODE_ENV` | Recommended | Session cookie | `production` adds the cookie `Secure` flag. The current `npm start` script explicitly uses `development`. |
| `UI_ORIGINS` | Optional | Write-request origin guard | Defaults to the two local Vite origins above. |
| `API_TARGET` | Optional, frontend dev only | Vite proxy | Overrides `http://127.0.0.1:3000`. |
| `RUN_PORTAL_INTEGRATION` | Optional, test only | Live integration test | Set to `1` to enable database/API integration testing. |
| `TEST_API_URL` | Optional, test only | Live integration test | Defaults to `http://127.0.0.1:3001`. |

### Start locally

```powershell
# Terminal 1 — API
cd src
npm install
npm start

# Terminal 2 — UI
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite sends browser requests beginning with `/api` to the backend and removes the `/api` prefix.

To point Vite to another API port:

```powershell
$env:API_TARGET = 'http://127.0.0.1:3001'
cd frontend
npm run dev
```

### Existing database upgrade

The current enrollment model accepts `finalGrade: null`. For a database created before that change, run this once:

```powershell
cd src
npm run prepare:student-enrollment
```

It changes `enrollments.finalGrade` to nullable and preserves existing values. Normal startup uses `sequelize.sync()` to create missing tables, but does **not** run schema alterations.

### Verification commands

```powershell
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix src test
```

Optional live test (start an API on port 3001 first):

```powershell
cd src
$env:RUN_PORTAL_INTEGRATION = '1'
$env:TEST_API_URL = 'http://127.0.0.1:3001'
npm test
```

The integration test creates uniquely named fixtures and permanently removes only the records it created.

## 6. Authentication, sessions, and permissions

### Login contracts

| Role | Request body | Identity behavior |
| --- | --- | --- |
| Student | `{ "role": "student", "studentNumber": "STD-2026-0001" }` | Finds the student number directly. This is identification only, not strong authentication. |
| Professor | `{ "role": "professor", "email": "name@university.edu", "password": "..." }` | Lowercases/trims email, then verifies a bcrypt password hash. |

On success, the server sends a random 32-byte opaque token in a `campus_session` cookie. The token is 64 hexadecimal characters and maps to a server-side session record.

### Session design

- Cookie flags: `HttpOnly`, `SameSite=Strict`, path `/`, 8-hour expiry.
- `Secure` is enabled when `NODE_ENV === "production"`.
- Sessions and login-rate-limit buckets are in process memory.
- A background sweep removes expired data each minute.
- Restarting the API invalidates every active session.
- Login attempts are limited to 15 per IP in a 15-minute window.
- `GET /auth/me` rebuilds the public identity from the current database record.
- `POST /auth/logout` deletes the in-memory session and clears the cookie.

### Authorization matrix

| Route family | Anonymous | Student session | Professor session |
| --- | ---: | ---: | ---: |
| `/auth/login`, `/auth/logout` | Allowed | Allowed | Allowed |
| `/auth/me` | 401 | Own identity | Own identity |
| `/portal/*` | 401 | Allowed | 403 |
| `/students`, `/professors`, `/departments`, `/courses`, `/sections`, `/semesters`, `/enrollments` | 401 | 403 | Allowed |

### Write protections

All non-GET/HEAD/OPTIONS requests must be JSON. The server rejects cross-site requests (`Sec-Fetch-Site: cross-site`) and rejects an `Origin` not listed in `UI_ORIGINS`. All responses have `Cache-Control: no-store`, and Express' `X-Powered-By` header is disabled.

## 7. Data model

Every model has timestamps and Sequelize soft deletion (`paranoid: true`), so normal deletes set `deletedAt`. A hard-delete endpoint physically removes selected resources.

### Entity fields

| Entity | Primary key | Important fields / constraints |
| --- | --- | --- |
| `students` | UUID | Auto-generated `studentNumber`, unique email and phone, first/last name, virtual `userName`, DOB, virtual age, address, level 1–5, status, admission date, department, optional academic advisor. |
| `professors` | UUID | Name, unique lowercased email, bcrypt password, unique Egyptian mobile number, department. Password is excluded from JSON output. |
| `departments` | Integer | Trimmed name, unique Egyptian mobile number, office. |
| `courses` | Integer | Globally unique code and name, optional description, department. |
| `semesters` | Integer | `academicYear` in `YYYY/YYYY` form, `fall` / `spring` / `summer`, start and end dates. |
| `sections` | Integer | Room, first scheduled datetime, recurring day/start/end times, capacity, section code, course, semester, professor. Unique index across section code + course + semester. |
| `enrollments` | Integer | Student, section, enrollment date, result status (`pending`, `passed`, `failed`), nullable final letter grade, and `gradeStatus` (`draft` or `published`). |

### Relationships

```text
Department 1 ──< Student
Department 1 ──< Professor
Department 1 ──< Course
Professor  1 ──< Student       (academicAdvisorId, optional)
Professor  1 ──< Section
Course     1 ──< Section
Semester   1 ──< Section
Student    >──< Section        (through Enrollment)
```

### Student number generation

When a new student is created, the model searches including soft-deleted students for the highest current-year value and assigns the next value, such as `STD-2026-0001`. The update service explicitly removes any submitted `studentNumber`, preserving the login identifier.

## 8. API conventions

- Development base URL: `http://127.0.0.1:3000`
- Frontend base URL: `/api` (Vite rewrites this during development)
- Authentication: browser cookie, not an `Authorization` header.
- Write requests: `Content-Type: application/json`.
- Successful management responses normally have `{ "msg": "...", "data": ... }`.
- Errors normally have `{ "msg": "..." }`; Sequelize field validation returns `{ "err": "..." }` with HTTP 422.
- Lists use `page` and `limit`; invalid / missing values fall back to module defaults.

### Auth and portal APIs

| Method | Endpoint | Access | Body / query | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | Public | Role-specific login body | Creates a session and returns public identity. |
| GET | `/auth/me` | Signed-in user | — | Returns current public identity. |
| POST | `/auth/logout` | Any | `{}` | Ends the current session. |
| GET | `/portal/workspace` | Student | — | Returns own student record, own enrollments, plus course/section catalog lookup data. Section rows include `occupied`. |
| POST | `/portal/enroll` | Student | `{ "sectionId": 12 }` | Creates only the authenticated student's pending enrollment. |

`/portal/enroll` runs in a transaction and locks the student and section. It rejects invalid IDs, missing sections, closed semesters, duplicate enrollment, full sections, incomplete timetables, and overlapping sections in the same semester. It always writes `status: "pending"` and `finalGrade: null`; supplied student ID, grade, or status fields are ignored.

### Professor management APIs

All routes in this table require a professor session.

| Resource | Method | Endpoint | Body / query | Notes |
| --- | --- | --- | --- | --- |
| Students | POST | `/students/addStudent` | Student fields | Student number is generated; do not send it. |
|  | GET | `/students?page=1&limit=10` | Pagination | Includes soft-deleted students and academic-advisor name. |
|  | PATCH | `/students/updateStudent?studentNumber=STD-...` | Mutable student fields | `id` and `studentNumber` are ignored. |
|  | PATCH | `/students/assignAcademicAdvisor?studentNumber=STD-...` | `{ "academicAdvisorId": "uuid" }` | Validates both records. |
|  | DELETE | `/students/deleteStudent?studentNumber=STD-...` | — | Soft delete. |
| Professors | POST | `/professors/addProfessor` | Professor fields incl. password | Password is bcrypt-hashed. |
|  | GET | `/professors?page=1&limit=10` | Pagination | Includes sections; password excluded. |
|  | PATCH | `/professors/update?email=...` | Current `password` plus editable fields | Requires the current password. Email cannot be changed by the service. |
|  | PATCH | `/professors/updatePassword?email=...` | `{ "oldPassword": "...", "newPassword": "..." }` | Requires old-password verification. |
|  | POST | `/professors/assignSection` | `{ "sectionCode": "...", "professorId": "uuid" }` | Reassigns a section by section code. |
|  | DELETE | `/professors/delete?search=email-or-phone` | — | Soft delete. |
| Departments | POST | `/departments/create` | `{ name, office, phoneNumber }` | Name/phone duplicate check. |
|  | GET | `/departments?page=1&limit=10` | Pagination | Includes related courses and professors. |
|  | PATCH | `/departments/update?id=1` | Department fields | Ignores submitted `id`. |
|  | DELETE | `/departments/delete?id=1&hard=true` | `hard` optional | Soft delete by default. |
| Courses | POST | `/courses/create` | `{ code, name, description?, departmentId }` | Checks department and global name/code uniqueness. |
|  | GET | `/courses?page=1&limit=10` | Pagination | Includes department name. |
|  | PATCH | `/courses/update?code=CS201` | `{ departmentId?, description? }` | Code and name are intentionally not updated. |
|  | DELETE | `/courses/delete?code=CS201&hard=true` | `hard` optional | Soft delete by default. |
| Semesters | POST | `/semesters/create` | `{ academicYear, term, startDate, endDate }` | End date must follow start date; term/year must be unique. |
|  | GET | `/semesters?page=1&limit=10` | Pagination | Includes section codes. |
|  | PATCH | `/semesters/update?semesterId=1` | Semester fields | Revalidates combined date values. |
|  | DELETE | `/semesters/delete?semesterId=1&hard=true` | `hard` optional | Soft delete by default. |
| Sections | POST | `/sections/createSection` | Section fields | Checks referenced course/professor/semester and tuple uniqueness. |
|  | GET | `/sections?page=1&limit=10` | Pagination; `admin` optional | `admin` makes soft-deleted rows visible. |
|  | PATCH | `/sections/updateSection?id=1` | Mutable section fields | `id` and `sectionCode` are ignored. |
|  | DELETE | `/sections/deleteSection?sectionId=1` | — | Soft delete. |
|  | DELETE | `/sections/hardDeleteSection?sectionId=1` | — | Permanent delete. |
| Enrollments | POST | `/enrollments/create?studentId=uuid` | `{ sectionId, status, finalGrade, enrolledAt }` | Professor-managed enrollment creation. Prevents duplicate student/section. |
|  | GET | `/enrollments?page=1&limit=10` | Pagination | Includes student, section, and course. |
|  | GET | `/enrollments/getEnrollment?enrollmentId=1` | — | Returns one populated enrollment. |
|  | PATCH | `/enrollments/updateEnrollment?enrollmentId=1` | `{ status?, finalGrade? }` | Updates only result/grade; requires the section owner and records audit history. |
|  | DELETE | `/enrollments/deleteEnrollment?enrollmentId=1` | — | Soft delete. |
|  | DELETE | `/enrollments/hardDeleteEnrollment?enrollmentId=1` | — | Permanent delete. |

## 9. Frontend behavior

### Live mode

`App.jsx` starts at the login screen. After a real login, it loads:

- **Student:** `/portal/workspace`, preserving server-enforced ownership.
- **Professor:** all seven management datasets through bounded paginated requests.

The API client uses a 15-second request timeout, always sends JSON, and emits a `campus-session-expired` browser event on a 401 received outside auth routes. The application then returns the user to sign-in.

### Preview mode

The login page has “Explore the student/professor preview.” Preview state originates in `frontend/src/demo.js`, remains in memory, and resets on browser refresh. It supports UI interactions and duplicate checks but never writes to MySQL.

### UX and accessibility details

- Responsive course schedules and management tables.
- Keyboard-accessible dialogs and forms.
- Custom department listbox with arrow keys, Home/End, Escape, focus return, and type-ahead matching.
- Skip-to-content link, semantic labels, live error messaging, and reduced-motion / reduced-transparency styling support.
- Frontend field rules mirror important backend constraints, while the backend remains authoritative.

## 10. Error behavior and validation

| Condition | HTTP status | Response pattern |
| --- | ---: | --- |
| Missing/expired session | 401 | `Please sign in to continue.` |
| Student calls management API / professor calls portal | 403 | Role-specific message. |
| Cross-site write or unapproved browser origin | 403 | Cross-site/origin message. |
| Non-JSON write | 415 | `Send application/json.` |
| Model validation failure | 422 | `{ err: first Sequelize validation message }` |
| Unique constraint conflict | 409 | `{ msg: "<field> is already used" }` |
| Service rule / missing record | Usually 400, 404, or 409 | `{ msg: service error message }` |
| Login rate limit | 429 | Retry-after-window message. |

## 11. Deployment notes

1. Build the frontend with `npm --prefix frontend run build`; output is `frontend/dist`.
2. Serve those static files from a web server/CDN.
3. Proxy `/api/*` to the Express backend while removing `/api`, matching Vite's development rewrite.
4. Use HTTPS and `NODE_ENV=production` so session cookies have the `Secure` flag.
5. Set `UI_ORIGINS` to the exact deployed UI origin(s).
6. Use a production MySQL database and protected environment-variable storage.
7. Replace the in-memory `Map` session store and rate-limit store with a shared persistent service before horizontal scaling; otherwise each backend instance has different sessions.
8. Add operational database migrations before evolving a production schema. Current startup synchronization creates absent tables but does not provide a migration history.

## 12. Current scope and intentional limits

- There is no attendance, announcement, public professor registration, password-reset flow, or persistent “remember me” implementation.
- Student-number-only login is intentionally weak identity verification. Use a password, OTP, or SSO before treating it as production-grade student authentication.
- The API trusts that authenticated professors can manage all academic records; there is no department-level or assigned-section authorization scope.
- Soft deletion is present across models, but reference-integrity policies for deleting related records should be defined before production use.
- The current README notes a backend dependency audit finding via Sequelize's transitive `uuid` dependency; review/update the dependency chain as part of production hardening.

## 13. Maintenance checklist

- Keep `frontend/src/modules.js` aligned with controller routes and allowed editable fields.
- When adding a model: define it, export it in `db/model/index.js`, create associations in `assocciation.js`, add service/controller/route export, then update UI module definitions if it needs UI management.
- When adding a secret/config value: add only its name and purpose to the environment table; put the actual value in private environment storage, never source control.
- Run frontend tests, frontend build, and backend tests before changing API contracts.
- For student enrollment schema changes, preserve the student portal guarantee that students cannot provide another `studentId`, `status`, or `finalGrade`.

## 14. Useful reference files

- `README.md` — concise setup, user-flow, and deployment overview.
- `database_design/erd_design.png` — visual entity relationship reference.
- `database_design/relational_schema_design.png` — relational schema reference.
- `frontend/tests/contracts.test.js` — expected request paths and payload transformations.
- `src/tests/session.test.js` — cookie, role gate, write guard, and throttle expectations.
- `src/tests/portal.integration.test.js` — opt-in end-to-end authorization and enrollment behavior.

## 14. Grade workflows and audit logs (September 17 update)

`src/module/professor/grade.service.js` centralizes grade/status changes and
publication. Professor controllers and the legacy enrollment update endpoint
use it, so changes through either path receive ownership checks and audit logs.
It uses `checkExisting` for required lookups. The helper spreads query options
into Sequelize calls so transactions, locks and includes are honored.

A changed grade or result sets `gradeStatus` to `draft`. Re-saving identical
values makes no change and creates no audit entry. Publishing changes only draft
enrollments with a non-null final grade. No eligible drafts returns HTTP 400.
The student workspace retains all enrolled classes but replaces unpublished
`finalGrade` values with null before serializing the response.

| Method | Endpoint | Input / behavior |
| --- | --- | --- |
| PUT | `/professors/updateFinalGrade` | `{ sectionId, studentNumber, finalGrade }` |
| PUT | `/professors/updatStatus` | `{ sectionId, studentNumber, status }`; existing route spelling retained |
| PATCH | `/professors/publishGrades` | `{ sectionId }`; returns `publishedCount` |
| GET | `/sections/getSectionRoaster` | `sectionId`, `page`, `limit`; existing route spelling retained |
| GET | `/professors/auditLogs` | `sectionId`, `page`, `limit`; newest changes first, maximum 100 per page |

`audit_logs` stores id, professorId, professorName, sectionId, enrollmentId,
studentNumber, action, before, after, and createdAt. Snapshots contain finalGrade,
status, and gradeStatus, with no passwords or session tokens. Every log insertion
shares a transaction with its mutation: failure rolls back the whole operation.
History is restricted to the current section owner. Historical names/numbers are
stored as snapshots. Old changes are not reconstructed. This is grade/result/
publication history, not a general log of all administrative CRUD or logins.

### UI entry points

**My teaching** lets a professor choose an assigned section, page through its
roster, save grade and result separately, confirm publication, and switch to
Audit history. Errors appear in the panel; writes disable action controls.
The preview supports these actions against temporary demo data.

Section forms collect `dayOfWeek`, `startTime`, and `endTime`. Student schedules
repeat within semester dates and display actual durations. Enrollment cards warn
about overlapping same-semester sections; back-to-back classes are allowed.
The professor management enrollment-create endpoint does not currently share all
student portal capacity/timetable checks.

Department and preview-role controls use a shared custom listbox with keyboard
navigation. The login role switch animates its indicator, identity field, and
password expansion while respecting reduced-motion preferences. The hidden
password field is disabled and excluded from student form submission.

### Existing database setup

From `src`, run `npm run prepare:student-enrollment`,
`npm run prepare:timetable`, and `npm run prepare:audit-logs` as needed.
These commands preserve existing records. For databases without `gradeStatus`,
check the schema and then add it once:

```sql
ALTER TABLE enrollments
ADD COLUMN gradeStatus VARCHAR(255) NOT NULL DEFAULT 'draft';
```

Startup sync creates missing tables but does not alter existing columns. Keep
`alter: true` disabled to avoid repeated automatic index/schema alterations.
Existing timetable columns start nullable; fill each section's real times.

### Verification

```powershell
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix src test
```

For the audit integration test, run from `src` against the local database:

```powershell
$env:RUN_GRADE_INTEGRATION = '1'
node --test tests/grades.integration.test.js
Remove-Item Env:RUN_GRADE_INTEGRATION
```

It requires an existing student/section for fixture relationships, creates a
separate temporary section/enrollment, checks ownership, publication, pagination,
and rollback on log failure, then removes only those test records.
The portal integration test additionally checks roster response names, student
publication visibility, audit API pagination, and student audit access denial.
Visual review is manual; successful builds do not establish visual correctness.

### Local API troubleshooting

Keep both API and frontend running. `/api/auth/me` through port 5173 must return
JSON (HTTP 401 while signed out). HTML indicates the Vite proxy is not loaded:
restart from `frontend` with `npm run dev -- --config vite.config.js`.
API restarts clear in-memory sessions, requiring another login.
