import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const dataDir = path.join(process.cwd(), 'server', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'exam.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    options_json TEXT,
    correct_answer TEXT,
    marks INTEGER NOT NULL,
    FOREIGN KEY(exam_id) REFERENCES exams(id)
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    submitted_at TEXT,
    score INTEGER DEFAULT 0,
    total_marks INTEGER DEFAULT 0,
    FOREIGN KEY(exam_id) REFERENCES exams(id),
    FOREIGN KEY(student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_option TEXT,
    text_answer TEXT,
    is_correct INTEGER DEFAULT 0,
    marks_awarded INTEGER DEFAULT 0,
    FOREIGN KEY(attempt_id) REFERENCES attempts(id),
    FOREIGN KEY(question_id) REFERENCES questions(id)
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    building TEXT NOT NULL,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS exam_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    UNIQUE(exam_id, student_id),
    FOREIGN KEY(exam_id) REFERENCES exams(id),
    FOREIGN KEY(student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS seat_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    UNIQUE(exam_id, student_id),
    UNIQUE(exam_id, room_id, seat_number),
    FOREIGN KEY(exam_id) REFERENCES exams(id),
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  );
`);

const seedUsers = [
  ['Admin User', 'admin@example.com', 'admin123', 'admin'],
  ['Teacher User', 'teacher@example.com', 'teacher123', 'teacher'],
  ['Student User', 'student@example.com', 'student123', 'student'],
  ['Student Two', 'student2@example.com', 'student123', 'student'],
  ['Student Three', 'student3@example.com', 'student123', 'student'],
];

const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  seedUsers.forEach(([name, email, password, role]) => {
    insertUser.run(name, email, bcrypt.hashSync(password, 10), role);
  });

  const insertCourse = db.prepare('INSERT INTO courses (name, code) VALUES (?, ?)');
  insertCourse.run('Database Systems', 'DBS101');
  insertCourse.run('Software Engineering', 'SE201');
  insertCourse.run('Operating Systems', 'OS301');

  const teacherId = db.prepare('SELECT id FROM users WHERE email = ?').get('teacher@example.com').id;
  const courseId = db.prepare('SELECT id FROM courses WHERE code = ?').get('DBS101').id;

  const examInsert = db.prepare(`
    INSERT INTO exams (title, course_id, teacher_id, duration_minutes, total_marks, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
  `);

  const exam = examInsert.run('Database Fundamentals Quiz', courseId, teacherId, 45, 40, new Date(Date.now() - 3600000).toISOString(), new Date(Date.now() + 86400000).toISOString());

  const questionInsert = db.prepare(`
    INSERT INTO questions (exam_id, question_text, question_type, options_json, correct_answer, marks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const questions = [
    {
      text: 'Which SQL command is used to retrieve data from a database?',
      type: 'mcq',
      options: ['UPDATE', 'SELECT', 'INSERT', 'DELETE'],
      answer: 'SELECT',
      marks: 10,
    },
    {
      text: 'What does DBMS stand for?',
      type: 'mcq',
      options: ['Database Management System', 'Data Backup Management Service', 'Digital Business Management System', 'Database Monitoring System'],
      answer: 'Database Management System',
      marks: 10,
    },
    {
      text: 'Explain the purpose of a primary key in a relational database.',
      type: 'text',
      answer: 'A primary key uniquely identifies each record in a table and prevents duplicate rows.',
      marks: 20,
    },
  ];

  questions.forEach((question) => {
    questionInsert.run(
      exam.lastInsertRowid,
      question.text,
      question.type,
      JSON.stringify(question.options || []),
      question.answer,
      question.marks
    );
  });

  const studentIds = db.prepare("SELECT id FROM users WHERE role = 'student' ORDER BY id").all().map((row) => row.id);
  const enrollExam = db.prepare('INSERT INTO exam_students (exam_id, student_id) VALUES (?, ?)');
  studentIds.forEach((studentId) => enrollExam.run(exam.lastInsertRowid, studentId));

  const roomInsert = db.prepare('INSERT INTO rooms (name, capacity, building, status) VALUES (?, ?, ?, ?)');
  roomInsert.run('Hall A-201', 30, 'Block A', 'active');
  roomInsert.run('Hall B-305', 25, 'Block B', 'active');
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getUserById(id) {
  return db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
}

export function getCourses() {
  return db.prepare('SELECT * FROM courses ORDER BY id').all();
}

export function getExams() {
  return db.prepare(`
    SELECT e.*, c.name as course_name, u.name as teacher_name,
      (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as question_count
    FROM exams e
    JOIN courses c ON c.id = e.course_id
    JOIN users u ON u.id = e.teacher_id
    ORDER BY e.created_at DESC
  `).all();
}

export function getExamById(examId) {
  const exam = db.prepare(`
    SELECT e.*, c.name as course_name, u.name as teacher_name
    FROM exams e
    JOIN courses c ON c.id = e.course_id
    JOIN users u ON u.id = e.teacher_id
    WHERE e.id = ?
  `).get(examId);

  if (!exam) return null;

  const questions = db.prepare(`
    SELECT id, question_text as text, question_type as type, options_json as options, correct_answer as correctAnswer, marks
    FROM questions
    WHERE exam_id = ?
  `).all(examId);

  exam.questions = questions.map((q) => ({ ...q, options: q.options ? JSON.parse(q.options) : [] }));
  return exam;
}

export function createExam({ title, courseId, teacherId, durationMinutes, totalMarks, startTime, endTime, questions }) {
  const exam = db.prepare(`
    INSERT INTO exams (title, course_id, teacher_id, duration_minutes, total_marks, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
  `).run(title, Number(courseId), teacherId, Number(durationMinutes), Number(totalMarks), startTime, endTime);

  const insertQuestion = db.prepare(`
    INSERT INTO questions (exam_id, question_text, question_type, options_json, correct_answer, marks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  questions.forEach((question) => {
    insertQuestion.run(
      exam.lastInsertRowid,
      question.text,
      question.type,
      JSON.stringify(question.options || []),
      question.correctAnswer || question.answer || '',
      Number(question.marks || 0)
    );
  });

  const studentIds = db.prepare("SELECT id FROM users WHERE role = 'student' ORDER BY id").all().map((row) => row.id);
  const enrollExam = db.prepare('INSERT INTO exam_students (exam_id, student_id) VALUES (?, ?)');
  studentIds.forEach((studentId) => {
    try {
      enrollExam.run(exam.lastInsertRowid, studentId);
    } catch (error) {
      // Ignore duplicate entries if any
    }
  });

  return getExamById(exam.lastInsertRowid);
}

export function startAttempt(examId, studentId) {
  const existing = db.prepare('SELECT * FROM attempts WHERE exam_id = ? AND student_id = ?').get(examId, studentId);
  if (existing) {
    return existing;
  }

  const exam = getExamById(examId);
  const result = db.prepare(`
    INSERT INTO attempts (exam_id, student_id, started_at, submitted_at, score, total_marks)
    VALUES (?, ?, ?, NULL, 0, ?)
  `).run(examId, studentId, new Date().toISOString(), exam.total_marks);

  return db.prepare('SELECT * FROM attempts WHERE id = ?').get(result.lastInsertRowid);
}

export function submitAttempt(attemptId, answers) {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(attemptId);
  if (!attempt) throw new Error('Attempt not found');

  const exam = getExamById(attempt.exam_id);
  const answerInsert = db.prepare(`
    INSERT INTO answers (attempt_id, question_id, selected_option, text_answer, is_correct, marks_awarded)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalScore = 0;

  exam.questions.forEach((question) => {
    const answerInput = answers.find((item) => Number(item.questionId) === question.id);
    const userValue = answerInput?.value ?? '';

    let isCorrect = false;
    let marksAwarded = 0;

    if (question.type === 'mcq') {
      isCorrect = String(userValue).trim() === String(question.correctAnswer || '').trim();
      marksAwarded = isCorrect ? Number(question.marks || 0) : 0;
    } else {
      isCorrect = String(userValue).trim().toLowerCase() === String(question.correctAnswer || '').trim().toLowerCase();
      marksAwarded = isCorrect ? Number(question.marks || 0) : 0;
    }

    totalScore += marksAwarded;

    answerInsert.run(
      attemptId,
      question.id,
      question.type === 'mcq' ? userValue : null,
      question.type === 'text' ? userValue : null,
      isCorrect ? 1 : 0,
      marksAwarded
    );
  });

  db.prepare(`
    UPDATE attempts
    SET submitted_at = ?, score = ?, total_marks = ?
    WHERE id = ?
  `).run(new Date().toISOString(), totalScore, exam.total_marks, attemptId);

  return {
    id: attemptId,
    score: totalScore,
    totalMarks: exam.total_marks,
    percentage: Math.round((totalScore / exam.total_marks) * 100),
  };
}

export function getDashboardStats() {
  const examCount = db.prepare('SELECT COUNT(*) as count FROM exams').get().count;
  const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;

  const scoreRow = db.prepare(`
    SELECT AVG(score * 100.0 / CASE WHEN total_marks = 0 THEN 1 ELSE total_marks END) as averageScore
    FROM attempts
    WHERE submitted_at IS NOT NULL
  `).get();

  return {
    totalExams: examCount,
    totalStudents: studentCount,
    averageScore: Math.round(scoreRow.averageScore || 0),
  };
}

export function getResultsForUser(userId) {
  return db.prepare(`
    SELECT a.id, a.score, a.total_marks, a.submitted_at, e.title
    FROM attempts a
    JOIN exams e ON e.id = a.exam_id
    WHERE a.student_id = ? AND a.submitted_at IS NOT NULL
    ORDER BY a.submitted_at DESC
  `).all(userId).map((row) => ({
    ...row,
    percentage: row.total_marks ? Math.round((row.score / row.total_marks) * 100) : 0,
  }));
}

export function getAllUsers() {
  return db.prepare('SELECT id, name, email, role FROM users ORDER BY id').all();
}

export function getRooms() {
  return db.prepare('SELECT * FROM rooms ORDER BY id').all();
}

export function createRoom({ name, capacity, building }) {
  const result = db.prepare('INSERT INTO rooms (name, capacity, building, status) VALUES (?, ?, ?, ?)')
    .run(name, Number(capacity), building, 'active');
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
}

export function getExamStudents(examId) {
  return db.prepare(`
    SELECT u.id, u.name, u.email, u.role
    FROM exam_students es
    JOIN users u ON u.id = es.student_id
    WHERE es.exam_id = ?
    ORDER BY u.name
  `).all(examId);
}

export function allocateSeatsForExam(examId) {
  const rooms = db.prepare('SELECT * FROM rooms WHERE status = ? ORDER BY id').all('active');
  const students = getExamStudents(examId);

  db.prepare('DELETE FROM seat_allocations WHERE exam_id = ?').run(examId);

  let seatCounter = 0;
  let currentRoomIndex = 0;

  const allocations = [];

  students.forEach((student) => {
    if (currentRoomIndex >= rooms.length) {
      currentRoomIndex = 0;
    }

    const room = rooms[currentRoomIndex];
    const roomSeatCount = Number(room.capacity || 0);
    const roomAllocationCount = db.prepare('SELECT COUNT(*) as count FROM seat_allocations WHERE exam_id = ? AND room_id = ?').get(examId, room.id).count;

    if (roomAllocationCount >= roomSeatCount) {
      currentRoomIndex += 1;
      if (currentRoomIndex >= rooms.length) {
        throw new Error('No room capacity available for this exam');
      }
      const nextRoom = rooms[currentRoomIndex];
      const seatNumber = db.prepare('SELECT COUNT(*) as count FROM seat_allocations WHERE exam_id = ? AND room_id = ?').get(examId, nextRoom.id).count + 1;
      db.prepare('INSERT INTO seat_allocations (exam_id, student_id, room_id, seat_number) VALUES (?, ?, ?, ?)')
        .run(examId, student.id, nextRoom.id, seatNumber);
      allocations.push({ student: student.name, room: nextRoom.name, seat: seatNumber });
      return;
    }

    const seatNumber = db.prepare('SELECT COUNT(*) as count FROM seat_allocations WHERE exam_id = ? AND room_id = ?').get(examId, room.id).count + 1;
    db.prepare('INSERT INTO seat_allocations (exam_id, student_id, room_id, seat_number) VALUES (?, ?, ?, ?)')
      .run(examId, student.id, room.id, seatNumber);
    allocations.push({ student: student.name, room: room.name, seat: seatNumber });
    seatCounter += 1;
    currentRoomIndex += 1;
  });

  return allocations;
}

export function getSeatAllocations(examId) {
  return db.prepare(`
    SELECT sa.id, sa.exam_id, sa.room_id, sa.seat_number, sa.student_id,
      u.name as student_name, u.email,
      r.name as room_name, r.building
    FROM seat_allocations sa
    JOIN users u ON u.id = sa.student_id
    JOIN rooms r ON r.id = sa.room_id
    WHERE sa.exam_id = ?
    ORDER BY sa.room_id, sa.seat_number
  `).all(examId);
}

export function getHallTicketData(examId, studentId) {
  const row = db.prepare(`
    SELECT sa.id, sa.seat_number, sa.room_id, r.name as room_name, r.building,
      e.title as exam_title, e.start_time, e.end_time,
      u.name as student_name, u.email,
      c.name as course_name
    FROM seat_allocations sa
    JOIN rooms r ON r.id = sa.room_id
    JOIN exams e ON e.id = sa.exam_id
    JOIN users u ON u.id = sa.student_id
    JOIN courses c ON c.id = e.course_id
    WHERE sa.exam_id = ? AND sa.student_id = ?
  `).get(examId, studentId);

  if (!row) {
    return null;
  }

  return {
    ...row,
    examDate: row.start_time ? new Date(row.start_time).toLocaleDateString() : '',
    examTime: row.start_time && row.end_time ? `${new Date(row.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(row.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '',
  };
}

export default db;
