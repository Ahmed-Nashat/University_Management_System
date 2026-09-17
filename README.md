# University Management System

A full-stack university management application with a React/Vite interface and an
Express/Sequelize API for departments, students, professors, courses, semesters,
sections, enrollments, grade publishing, and grade audit history.

## Web Interface

The React interface lives in `frontend/`. It follows the schedule-first UI plan:
an off-white canvas, navy/blue course content, restrained orange actions, and
translucent floating navigation. The student and professor workspaces are separate.

- **Students:** sign in with `studentNumber` only; see their classes, enroll in a
  section, and read their own grades. No management or grade-editing controls.
- **Professors:** sign in with their existing email and password; manage students,
  professors, departments, courses, sections, semesters, and enrollment results.
- **Preview:** the sign-in page offers interactive sample workspaces. Preview
  changes stay in memory and reset on refresh; they never change database records.

Start the API with the existing instructions below, then in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The development server forwards `/api` to the API
at `http://127.0.0.1:3000`. To use another local API port:

```powershell
$env:API_TARGET = 'http://127.0.0.1:3001'
npm run dev
```

For an **existing database**, run this once from `src` before using student
enrollment. It allows an unpublished grade to be `NULL`, preserving existing data:

```powershell
npm run prepare:student-enrollment
```

New databases get the nullable field from the model automatically. New student
enrollments have `status: "pending"` and `finalGrade: null`. Professors save
draft results and publish them separately through `/professors/publishGrades`.
Student enrollment checks semester end date, duplicate enrollment, capacity, and
same-semester timetable conflicts in a transaction.

### Login and permissions

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | `{ role: "student", studentNumber }` or `{ role: "professor", email, password }` |
| GET | `/auth/me` | Current signed-in identity |
| POST | `/auth/logout` | Revoke the current session; send JSON `{}` |
| GET | `/portal/workspace` | Student's own classes/grades plus section catalog |
| POST | `/portal/enroll` | Enroll the signed-in student using `{ sectionId }` |

All existing management API routes now require a professor session. Sign in first
in Postman and retain its cookie jar. Student data is scoped on the server, and
student requests cannot set grades or another student's identity.

Sessions use random, HttpOnly, SameSite=Strict cookies with an eight-hour expiry.
They are stored in memory, so restarting the API signs everyone out. Login attempts
are limited to 15 per IP per 15 minutes. Writes require JSON, and browser writes
must match `UI_ORIGINS` (a comma-separated list; defaults to the two localhost
origins on port 5173).

Student-number-only login is the requested behavior: anyone who knows a valid
student number can access that student's portal. It is identification, not proof
of identity. Professor accounts still require their password.

### Verification and deployment scope

```powershell
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix src test
```

The optional live API test creates uniquely named temporary fixtures, tests both
roles and enrollment isolation, and removes only its own fixtures. With the API
running on port 3001:

```powershell
cd src
$env:RUN_PORTAL_INTEGRATION = '1'
$env:TEST_API_URL = 'http://127.0.0.1:3001'
npm test
```

The built UI is in `frontend/dist`. Deployment needs a web server that serves those
files and proxies `/api/*` to the backend with `/api` removed. Vite's development
proxy is not included in the build. Use HTTPS, `NODE_ENV=production` for Secure
cookies, the deployed origin in `UI_ORIGINS`, and a shared session store before
running multiple backend instances. There is no public professor registration;
existing professors sign in, and authenticated professors can add records.

Attendance and announcements do not have backend modules and are not included in
this implementation. Browser refresh returns to the sign-in screen; the preview
role switch is not available in a live session.

The current backend dependency audit reports two moderate findings through
Sequelize's `uuid` dependency. No forced major-version downgrade was applied as
part of the UI work. The frontend dependency audit passed with no findings.

## Features

- Create, list, update, soft-delete, and hard-delete university records.
- Automatically generate student numbers in the `STD-YYYY-0001` format.
- Use UUID primary keys for students and professors.
- Assign a professor as a student's academic advisor.
- Assign professors to course sections.
- Prevent duplicate section codes for the same course and semester.
- Enroll students in sections and prevent duplicate student-section enrollments.
- Return related student, section, and course data with enrollment responses.
- Keep deleted records through Sequelize soft deletes (`paranoid: true`).

## Tech Stack

- Node.js with ES modules
- Express 5
- Sequelize 6
- MySQL
- dotenv
- bcrypt
- nodemon and cross-env for local development

## Project Structure

```text
.
├── .env
├── README.md
└── src/
    ├── main.js                 # Application entry point and route registration
    ├── config/                 # Environment configuration
    ├── common/                 # Shared response and error middleware
    ├── db/
    │   ├── connection.js        # Sequelize connection and schema sync
    │   └── model/               # Sequelize models and associations
    └── module/                  # Controller and service for each API module
        ├── student/
        ├── professor/
        ├── department/
        ├── course/
        ├── semester/
        ├── section/
        └── enrollment/
```

## Requirements

- Node.js 18 or later
- MySQL server

## Installation

1. Clone the repository and open its root directory.

2. Create a `.env` file in the repository root:

```env
PORT=3000
DB_NAME=university_managment_system
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
```

3. Install dependencies from the `src` directory:

```bash
cd src
npm install
```

4. Start the API:

```bash
npm start
```

The API starts at `http://localhost:3000`. On startup, Sequelize connects to
the configured database and synchronizes the models.

## API Modules

| Module | Base route | Main capabilities |
| --- | --- | --- |
| Students | `/students` | Add, list, update, delete, and assign an academic advisor |
| Professors | `/professors` | Add, list, update, delete, update password, and assign sections |
| Departments | `/departments` | Create, list, update, and delete departments |
| Courses | `/courses` | Create, list, update, and delete courses |
| Semesters | `/semesters` | Create, list, update, and delete semesters |
| Sections | `/sections` | Create, list, update, soft-delete, and hard-delete sections |
| Enrollments | `/enrollments` | Create, list, get, update, soft-delete, and hard-delete enrollments |

### Enrollment Routes

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/enrollments/create?studentId={studentId}` | Enroll a student in a section |
| `GET` | `/enrollments?page=1&limit=10` | Get a paginated enrollment list |
| `GET` | `/enrollments/getEnrollment?enrollmentId={id}` | Get one enrollment with related data |
| `PATCH` | `/enrollments/updateEnrollment?enrollmentId={id}` | Update the status or final grade |
| `DELETE` | `/enrollments/deleteEnrollment?enrollmentId={id}` | Soft-delete an enrollment |
| `DELETE` | `/enrollments/hardDeleteEnrollment?enrollmentId={id}` | Permanently delete an enrollment |

## Database Relationships

- A department has many students, professors, and courses.
- A professor belongs to a department, advises many students, and teaches many sections.
- A student belongs to a department and can have one academic advisor.
- A course belongs to a department and has many sections.
- A semester has many sections.
- A section belongs to one course, semester, and professor.
- Students and sections have a many-to-many relationship through enrollments.

## API Documentation

See [technical documentation](DOCUMENTATION.md) for architecture, database models,
authentication, workflows, and testing, and [frontend documentation](frontend/README.md)
for UI setup and source files.

Use the complete [Postman API documentation](https://documenter.getpostman.com/view/57007367/2sBYB1MTQz) for request bodies, parameters, and saved success/error examples.

## Notes

- The `.env` file is loaded from the repository root, even though the npm package is inside `src`.
- Student numbers are generated by the model; do not send `studentNumber` when creating a student.
- IDs for students and professors are UUIDs. Department, course, semester, section, and enrollment IDs are numeric.
- `sequelize.sync()` is enabled in `src/db/connection.js`. It creates missing tables from the models when the application starts.

### Grade publishing and audit history

Professor grade and result edits return the enrollment to draft. Publishing affects
only draft enrollments with a final grade. Each edit/publication writes an audit
entry in the same transaction, including professor, student number, section,
before/after result, and timestamp. History begins when this feature is installed;
existing changes are not reconstructed. No API permits editing/deleting audit rows.

- `PUT /professors/updateFinalGrade`: sectionId, studentNumber, finalGrade.
- `PUT /professors/updatStatus`: sectionId, studentNumber, status.
- `PATCH /professors/publishGrades`: sectionId.
- `GET /professors/auditLogs?sectionId=15&page=1&limit=10`: section-owner history.
- `GET /sections/getSectionRoaster?sectionId=15&page=1&limit=10`: roster with draft/published state.

Use `npm run prepare:audit-logs` from `src` to create the audit table explicitly
(startup sync also creates missing tables). Use `npm run prepare:timetable` for
existing section tables, then fill each section's day/start/end values.
`RUN_GRADE_INTEGRATION=1` enables the database-backed audit test; it creates and
removes its own section/enrollment fixtures and requires existing relationships.

### Academic UI

Sign in as a professor and open **My teaching** to select an assigned section,
page through its roster, save grades/results, publish drafts, and read audit history.
Student Classes repeat weekly within their semester dates. Enroll shows conflicts
and incomplete timetables, and Grades displays results only after publication.
Section forms now require a weekly day, start time and end time. The demo workspace
supports the same teaching actions with temporary sample history.

### Latest interface updates

- **My teaching:** assigned-section selector, paginated rosters, grade and result
  editing, publication confirmation, and paginated audit history.
- **Classes:** recurring weekly schedules within semester dates, using
  `dayOfWeek`, `startTime`, and `endTime`.
- **Enroll:** notices for timetable conflicts, missing times, and closed semesters.
- **Grades:** unpublished grades remain hidden while enrolled classes stay visible.
- Custom department and preview-role menus support keyboard navigation.
- Login role switching uses a sliding highlight and animated fields, with
  reduced-motion support.

### Troubleshooting local login

Run both `npm start` from `src` and `npm run dev` from `frontend`.
Open `http://127.0.0.1:5173/`. An unauthenticated request to
`http://127.0.0.1:5173/api/auth/me` should return JSON with HTTP 401.
If it returns HTML, restart Vite from `frontend` using
`npm run dev -- --config vite.config.js` to load the API proxy.
If it cannot connect, check that the API and MySQL are running. API restarts
invalidate existing sessions; sign in again. Use the same hostname for all
Postman requests so its session cookie is retained.

For older databases that lack `gradeStatus`, add it once (check the schema first):

```sql
ALTER TABLE enrollments
ADD COLUMN gradeStatus VARCHAR(255) NOT NULL DEFAULT 'draft';
```

Do not enable automatic `sync({ alter: true })`: schema upgrades are explicit.
The timetable upgrade leaves existing rows nullable to preserve data; fill in
their real timetable before allowing student enrollment.
