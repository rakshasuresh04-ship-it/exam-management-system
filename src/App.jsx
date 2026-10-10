import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function apiRequest(url, options = {}, token) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('ems_token') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('ems_token', token);
    } else {
      localStorage.removeItem('ems_token');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage setToken={setToken} />} />
        <Route path="/dashboard" element={token ? <DashboardPage token={token} setToken={setToken} /> : <Navigate to="/" replace />} />
        <Route path="/exams" element={token ? <ExamsPage token={token} /> : <Navigate to="/" replace />} />
        <Route path="/create-exam" element={token ? <CreateExamPage token={token} /> : <Navigate to="/" replace />} />
        <Route path="/attempt/:examId" element={token ? <AttemptPage token={token} /> : <Navigate to="/" replace />} />
        <Route path="/results" element={token ? <ResultsPage token={token} /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function LoginPage({ setToken }) {
  const [form, setForm] = useState({ email: 'student@example.com', password: 'student123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setToken(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card login-card">
        <div className="auth-header">
          <h1>Exam Management System</h1>
          <p>Sign in to manage assessments and results</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            required
          />

          {error && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button className="primary-btn" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18, fontSize: '0.85rem' }}>
          Demo accounts: admin@example.com / admin123, teacher@example.com / teacher123, student@example.com / student123
        </p>
      </div>
    </div>
  );
}

function DashboardPage({ token, setToken }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [userData, statsData] = await Promise.all([
          apiRequest('/api/me', {}, token),
          apiRequest('/api/dashboard', {}, token),
        ]);
        setUser(userData.user);
        setStats(statsData);
      } catch (error) {
        console.error(error);
        setToken('');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, setToken]);

  if (loading || !user || !stats) {
    return <PageShell token={token} setToken={setToken} title="Loading dashboard..." />;
  }

  return (
    <PageShell token={token} setToken={setToken} title={`Welcome, ${user.name}`}>
      <div className="grid grid-3">
        <div className="card stat-card">
          <div className="stat-label">Total Exams</div>
          <div className="stat-value">{stats.totalExams}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Students</div>
          <div className="stat-value">{stats.totalStudents}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Average Score</div>
          <div className="stat-value">{stats.averageScore}%</div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <h2>Quick actions</h2>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Assessments</h3>
          <p className="muted">Create and publish exam papers, manage question sets, and schedule tests.</p>
          <Link to="/create-exam"><button className="primary-btn">Create Exam</button></Link>
        </div>
        <div className="card">
          <h3>Results</h3>
          <p className="muted">Check student progress, review marks, and monitor performance trends.</p>
          <Link to="/results"><button className="secondary-btn">View Results</button></Link>
        </div>
      </div>
    </PageShell>
  );
}

function ExamsPage({ token }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await apiRequest('/api/exams', {}, token);
        setExams(data.exams || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadExams();
  }, [token]);

  return (
    <PageShell token={token} title="Exams">
      <div className="section-title">
        <h2>Available assessments</h2>
        <Link to="/create-exam"><button className="primary-btn">New exam</button></Link>
      </div>

      {loading ? (
        <div className="card empty-state">Loading exams…</div>
      ) : exams.length === 0 ? (
        <div className="card empty-state">No exams have been created yet.</div>
      ) : (
        <div className="exam-list">
          {exams.map((exam) => (
            <div className="exam-item" key={exam.id}>
              <div>
                <h3>{exam.title}</h3>
                <div className="meta">
                  <span>{exam.course_name}</span>
                  <span>{exam.duration_minutes} mins</span>
                  <span>{exam.total_marks} marks</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="tag">{exam.status}</span>
                <Link to={`/attempt/${exam.id}`}><button className="primary-btn">Attempt</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function CreateExamPage({ token }) {
  const [form, setForm] = useState({
    title: '',
    courseId: '1',
    durationMinutes: '60',
    totalMarks: '100',
    startTime: '',
    endTime: '',
  });
  const [questions, setQuestions] = useState([
    {
      text: '',
      type: 'mcq',
      marks: '10',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
    },
  ]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await apiRequest('/api/courses', {}, token);
        setCourses(data.courses || []);
        if (data.courses?.length) {
          setForm((prev) => ({ ...prev, courseId: String(data.courses[0].id) }));
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadCourses();
  }, [token]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        text: '',
        type: 'mcq',
        marks: '10',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 'Option 1',
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[questionIndex].options[optionIndex] = value;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await apiRequest('/api/exams', {
        method: 'POST',
        body: JSON.stringify({ ...form, questions }),
      }, token);

      navigate('/exams');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <PageShell token={token} title="Create exam">
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label>Course</label>
              <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Duration (minutes)</label>
              <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required />
            </div>
            <div>
              <label>Total marks</label>
              <input type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} required />
            </div>
            <div>
              <label>Start time</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label>End time</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 28 }}>
            <h2>Questions</h2>
            <button type="button" className="secondary-btn" onClick={addQuestion}>Add question</button>
          </div>

          <div className="question-builder">
            {questions.map((question, index) => (
              <div className="question-box" key={index}>
                <div className="form-grid">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Question text</label>
                    <textarea value={question.text} onChange={(e) => updateQuestion(index, 'text', e.target.value)} required />
                  </div>

                  <div>
                    <label>Type</label>
                    <select value={question.type} onChange={(e) => updateQuestion(index, 'type', e.target.value)}>
                      <option value="mcq">MCQ</option>
                      <option value="text">Text</option>
                    </select>
                  </div>

                  <div>
                    <label>Marks</label>
                    <input type="number" value={question.marks} onChange={(e) => updateQuestion(index, 'marks', e.target.value)} required />
                  </div>
                </div>

                {question.type === 'mcq' && (
                  <div style={{ marginTop: 16 }}>
                    <label>Options</label>
                    <div className="answer-row">
                      {question.options.map((option, optionIndex) => (
                        <input
                          key={optionIndex}
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                        />
                      ))}
                    </div>

                    <label style={{ marginTop: 12 }}>Correct answer</label>
                    <select value={question.correctAnswer} onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}>
                      {question.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                )}

                {question.type === 'text' && (
                  <div style={{ marginTop: 16 }}>
                    <label>Expected answer</label>
                    <input value={question.correctAnswer} onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {message && <p style={{ color: 'var(--danger)', marginTop: 18 }}>{message}</p>}

          <div style={{ marginTop: 24 }}>
            <button className="primary-btn" type="submit">Create exam</button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

function AttemptPage({ token }) {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadExam() {
      try {
        const data = await apiRequest(`/api/exams/${examId}`, {}, token);
        setExam(data.exam);
        const initial = {};
        data.exam.questions.forEach((q) => {
          initial[q.id] = q.type === 'mcq' ? '' : '';
        });
        setAnswers(initial);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId, token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const payload = Object.entries(answers).map(([questionId, value]) => ({ questionId: Number(questionId), value }));

    try {
      const result = await apiRequest(`/api/attempts/${examId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      }, token);

      navigate('/results', { state: { lastResult: result } });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !exam) {
    return <PageShell token={token} title="Loading exam..." />;
  }

  return (
    <PageShell token={token} title={exam.title}>
      <div className="card">
        <div className="meta" style={{ marginBottom: 18 }}>
          <span>{exam.course_name}</span>
          <span>{exam.duration_minutes} mins</span>
          <span>{exam.total_marks} marks</span>
        </div>

        {exam.questions.map((question, idx) => (
          <div className="question-card" key={question.id}>
            <h3>Q{idx + 1}. {question.text}</h3>
            <p className="muted">Marks: {question.marks}</p>

            {question.type === 'mcq' ? (
              <div className="option-list">
                {question.options.map((option) => (
                  <label key={option} className="option-item">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here"
              />
            )}
          </div>
        ))}

        <button className="primary-btn" onClick={handleSubmit}>Submit exam</button>
      </div>
    </PageShell>
  );
}

function ResultsPage({ token }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await apiRequest('/api/results', {}, token);
        setResults(data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [token]);

  return (
    <PageShell token={token} title="Results">
      {loading ? (
        <div className="card empty-state">Loading results…</div>
      ) : results.length === 0 ? (
        <div className="card empty-state">No results found yet.</div>
      ) : (
        <div className="exam-list">
          {results.map((result) => (
            <div className="result-box" key={result.id}>
              <h3>{result.title}</h3>
              <div className="meta">
                <span>Score: {result.score}/{result.total_marks}</span>
                <span>Percentage: {result.percentage}%</span>
                <span>Submitted: {new Date(result.submitted_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ token, setToken, title, children }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('ems_token');
    setToken ? setToken('') : null;
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="logo">ExamFlow</div>
        <nav className="nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/exams">Exams</Link>
          <Link to="/results">Results</Link>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>

      <main className="page">
        <div className="section-title">
          <h2>{title}</h2>
        </div>
        {children}
      </main>
    </div>
  );
}

export default App;
