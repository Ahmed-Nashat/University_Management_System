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
