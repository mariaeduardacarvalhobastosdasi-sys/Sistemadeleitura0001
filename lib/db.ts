import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'employee'))
  );

  CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    type INTEGER NOT NULL CHECK(type IN (1, 2, 3, 4)),
    current_reading REAL NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    is_open INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id INTEGER NOT NULL,
    cycle_id INTEGER NOT NULL,
    start_reading REAL NOT NULL,
    end_reading REAL NOT NULL,
    factor REAL NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(machine_id) REFERENCES machines(id),
    FOREIGN KEY(cycle_id) REFERENCES cycles(id)
  );
`);

// Seed default users if not exists
const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (users.count === 0) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('gerente', 'gerente123', 'manager');
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('funcionario', 'func123', 'employee');
}

export default db;
