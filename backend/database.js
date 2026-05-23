const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to SQLite database');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      password TEXT,
      avatar TEXT,
      email TEXT,
      push_subscription TEXT,
      isOnline INTEGER DEFAULT 0,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, () => {
      // Safely attempt to add email column if it doesn't exist yet
      db.run("ALTER TABLE users ADD COLUMN email TEXT", (err) => {
        // Ignore error if column already exists
      });
      // Safely attempt to add push_subscription column
      db.run("ALTER TABLE users ADD COLUMN push_subscription TEXT", (err) => {
      });
    });

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      content TEXT,
      reaction TEXT,
      reply_to TEXT,
      status TEXT DEFAULT 'sent',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (receiver_id) REFERENCES users (id)
    )`);
  }
});

module.exports = db;
