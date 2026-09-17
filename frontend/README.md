# Campus UI

React + Vite university portal. See the repository README for setup, authentication,
the optional existing-database upgrade, verification, and deployment constraints.

## Source map

- `src/Login.jsx`: student-number / professor-password sign-in and demo entry.
- `src/App.jsx`: separate student and professor workspaces.
- `src/components.jsx`: keyboard-accessible dialogs and record forms.
- `src/modules.js`: form definitions and the backend's editable-field rules.
- `src/api.js`: API requests, pagination normalization, and session expiry handling.
- `src/demo.js`: temporary sample records and demo operations.
- `src/styles.css`: responsive layout, palette, glass controls, reduced-motion and
  reduced-transparency preferences.

The student navigation intentionally has only Classes, Enroll, and Grades.
Professor management actions are server-protected; a demo role selector is never
used as authorization for live data.

## Academic workflows

Professors open **My teaching** to manage their own section rosters, save grades
and results, publish drafts, and read audit history. Saving a changed result
returns it to draft; publication makes it visible to students. History includes
the actor, student number, timestamp, and before/after values.

Students keep Classes, Enroll, and Grades. Weekly schedules use section day/start/
end fields and semester dates. Enrollment cards display conflicts and incomplete
timetables; the API remains responsible for enforcing enrollment rules.

## Additional source files

- `src/Teaching.jsx`: roster, grading, publication confirmation, audit history.
- `src/academic.js`: recurring dates, timetable labels, enrollment notices.
- `src/DepartmentFilter.jsx`: shared keyboard-accessible `SelectMenu` for
  departments and preview roles.
- `tests/academic.test.js`: timetable boundaries, conflicts, and form payloads.

Login role changes animate the selection indicator and password field height.
Operating-system reduced-motion preferences disable these transitions.

## Local checks

```powershell
npm test
npm run build
```

Run the API separately from `../src`. The Vite proxy forwards `/api` to port
3000 by default. If login returns HTML instead of JSON, restart with
`npm run dev -- --config vite.config.js`. Preview mode uses only temporary data;
visual review remains manual.
