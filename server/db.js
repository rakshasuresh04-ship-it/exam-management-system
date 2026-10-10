@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #f4f7fb;
  --card: #ffffff;
  --primary: #2f6fed;
  --primary-dark: #1f4ec5;
  --success: #1bbf7a;
  --warning: #ffb020;
  --danger: #ef5350;
  --text: #1c2430;
  --muted: #6b7280;
  --border: #e5e7eb;
  --shadow: 0 16px 30px rgba(31, 41, 55, 0.08);
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text);
}

body {
  min-height: 100vh;
}

button, input, select, textarea {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid var(--border);
  padding: 18px 32px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--primary);
}

.nav {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.nav a, .nav button {
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-weight: 600;
}

.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

.grid {
  display: grid;
  gap: 20px;
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 22px;
}

.stat-card {
  min-height: 120px;
}

.stat-label {
  color: var(--muted);
  font-size: 0.82rem;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.section-title h2 {
  margin: 0;
  font-size: 1.5rem;
}

.primary-btn, .secondary-btn, .danger-btn {
  border: none;
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  transition: 0.2s ease;
}

.primary-btn {
  background: var(--primary);
  color: #fff;
}

.primary-btn:hover {
  background: var(--primary-dark);
}

.secondary-btn {
  background: #edf3ff;
  color: var(--primary);
}

.danger-btn {
  background: #fee3e3;
  color: #c53030;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

label {
  display: block;
  color: var(--muted);
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 600;
}

input, select, textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  color: var(--text);
  margin-bottom: 14px;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.exam-list, .room-list {
  display: grid;
  gap: 18px;
}

.exam-item, .room-item {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 20px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.exam-item h3 {
  margin: 0 0 8px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 0.82rem;
}

.tag {
  display: inline-block;
  background: #edf3ff;
  color: var(--primary);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.76rem;
  font-weight: 700;
}

.question-builder {
  display: grid;
  gap: 18px;
  margin-top: 16px;
}

.question-box {
  border: 1px solid var(--border);
  border-radius: 15px;
  padding: 16px;
  background: #fafbff;
}

.answer-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.login-card {
  max-width: 480px;
  margin: 80px auto;
}

.auth-header {
  margin-bottom: 24px;
}

.auth-header h1 {
  margin: 0 0 8px;
}

.auth-header p {
  margin: 0;
  color: var(--muted);
}

.muted {
  color: var(--muted);
}

.result-box {
  padding: 18px;
  background: #f2faf7;
  border: 1px solid #cdeedb;
  border-radius: 14px;
}

.question-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  background: #fff;
  margin-bottom: 18px;
}

.option-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #f9fafb;
}

.option-item input {
  margin: 0;
  width: auto;
}

.empty-state {
  color: var(--muted);
  text-align: center;
  padding: 32px 20px;
}

.ticket-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #eef5ff, #f9fbff);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

th, td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
}

th {
  background: #f8faff;
}

@media (max-width: 860px) {
  .grid-3, .grid-2, .form-grid, .answer-row {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .exam-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
