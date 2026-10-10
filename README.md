# Exam Management System

A complete web-based exam management platform with role-based access for admin, teacher, and student users.

## Features

- Admin, teacher, and student roles
- Course and exam management
- Question bank creation
- Student exam attempts with timer-style flow
- Automatic scoring for objective answers
- Results dashboard
- SQLite database with seeded demo users

## Demo credentials

- Admin: admin@example.com / admin123
- Teacher: teacher@example.com / teacher123
- Student: student@example.com / student123

## Tech stack

- Frontend: React + Vite + CSS
- Backend: Node.js + Express
- Database: SQLite
- Auth: JWT

## Run locally

```bash
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and the backend API runs on http://localhost:5000.

## Production build

```bash
npm run build
npm run server
```

## Project structure

```bash
server/
  db.js
  index.js
src/
  App.jsx
  main.jsx
  index.css
index.html
vite.config.js
package.json
```
