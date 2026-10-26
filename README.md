# AssignMate — Full React Website Source

This is a complete React + Vite frontend project for the Student Assignment Management System, with student and faculty workspaces.

## What is included
- Modern responsive login and role selection
- Student dashboard, assignment list/search/filter, assignment submission, submission history, notifications, profile
- Faculty dashboard, create/publish assignment, assignment management, student submissions, review/grading modal
- Responsive sidebar, status badges, statistics, deadline panels, and toast notifications
- Google Apps Script starter in `google-apps-script/Code.gs`

## Run locally
1. Install Node.js LTS from https://nodejs.org/
2. Extract this ZIP.
3. Open the `AssignMate_Full_Website` folder in VS Code.
4. In VS Code, choose Terminal → New Terminal.
5. Run:
   ```bash
   npm install
   npm run dev
   ```
6. Open the local URL Vite prints (usually `http://localhost:5173`).

## Build for deployment
```bash
npm run build
```
The production website files will be in `dist/`. Deploy `dist/` to a static host such as Netlify, Vercel, or GitHub Pages (Vite base-path settings may be needed for GitHub Pages).

## Google Sheets / Apps Script
The `google-apps-script/Code.gs` file is a starter API. Create a Google Sheet, set its ID in `SHEET_ID`, paste the code into Extensions → Apps Script, then deploy as a Web app. It creates the required tabs and supports basic list/create/submit/grade actions.

**Important honest limitation:** The React website currently runs with in-memory sample data and does not call the Apps Script API yet. The Apps Script file is a separate backend starter, not an already-connected production backend. The demo login is not secure authentication, and sample submission links are illustrative. Before using this for real students, connect the frontend to the deployed API and implement verified identity/role authorization and appropriate access controls. Do not store plaintext passwords in Sheets.
