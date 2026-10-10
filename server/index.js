import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  createExam,
  getCourses,
  getDashboardStats,
  getExamById,
  getExams,
  getResultsForUser,
  getUserByEmail,
  getUserById,
  startAttempt,
  submitAttempt,
} from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'exam-secret-key';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.replace('Bearer ', '') : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return res.json({ user: safeUser, token: signToken(safeUser) });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user });
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  const stats = getDashboardStats();
  return res.json(stats);
});

app.get('/api/courses', authMiddleware, (req, res) => {
  return res.json({ courses: getCourses() });
});

app.get('/api/exams', authMiddleware, (req, res) => {
  return res.json({ exams: getExams() });
});

app.post('/api/exams', authMiddleware, (req, res) => {
  const { title, courseId, durationMinutes, totalMarks, startTime, endTime, questions } = req.body;

  if (!title || !courseId || !durationMinutes || !totalMarks || !startTime || !endTime || !Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ message: 'Please provide valid exam information and at least one question' });
  }

  const exam = createExam({
    title,
    courseId,
    teacherId: req.user.id,
    durationMinutes,
    totalMarks,
    startTime,
    endTime,
    questions,
  });

  return res.status(201).json({ exam });
});

app.get('/api/exams/:id', authMiddleware, (req, res) => {
  const exam = getExamById(Number(req.params.id));
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }

  return res.json({ exam });
});

app.post('/api/exams/:id/attempts', authMiddleware, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can attempt exams' });
  }

  const attempt = startAttempt(Number(req.params.id), Number(req.user.id));
  return res.status(201).json({ attempt });
});

app.post('/api/attempts/:id/submit', authMiddleware, (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: 'Answers are required' });
  }

  const result = submitAttempt(Number(req.params.id), answers);
  return res.json({ result });
});

app.get('/api/results', authMiddleware, (req, res) => {
  const results = getResultsForUser(req.user.id);
  return res.json({ results });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
