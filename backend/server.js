const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./database');
const setupSocketHandlers = require('./socketHandlers');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// API Routes
app.post('/api/login', (req, res) => {
  const { name, password, avatar } = req.body;
  
  if (!name || !password || !avatar) {
    return res.status(400).json({ error: 'Name, password, and avatar are required' });
  }

  // Find user by password and avatar
  db.get('SELECT * FROM users WHERE password = ? AND avatar = ?', [password, avatar], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // Update name and online status for this avatar in this password room
      db.run('UPDATE users SET name = ?, isOnline = 1 WHERE id = ?', [name, row.id], function(updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        return res.json({ user: { id: row.id, name, avatar, password, isOnline: 1 } });
      });
    } else {
      // Register new user for this avatar in this room
      db.run('INSERT INTO users (name, password, avatar, isOnline) VALUES (?, ?, ?, 1)', [name, password, avatar], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ user: { id: this.lastID, name, avatar, isOnline: 1 } });
      });
    }
  });
});

app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(500).json({ error: err ? err.message : 'User not found' });
    
    db.all('SELECT id, name, avatar, isOnline FROM users WHERE password = ? AND id != ?', [user.password, userId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
});

app.get('/api/messages/:userId/:contactId', (req, res) => {
  const { userId, contactId } = req.params;
  db.all(
    `SELECT * FROM messages 
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) 
     ORDER BY timestamp ASC`,
    [userId, contactId, contactId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.delete('/api/messages/:userId/:contactId', (req, res) => {
  const { userId, contactId } = req.params;
  db.run(
    `DELETE FROM messages 
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
    [userId, contactId, contactId, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, deleted: this.changes });
    }
  );
});

// Periodic cleanup: Delete messages for rooms where everyone has been offline for >= 2 hours
setInterval(() => {
  db.all(`
    SELECT password 
    FROM users 
    GROUP BY password 
    HAVING MAX(isOnline) = 0 
       AND MAX(last_seen) <= datetime('now', '-2 hours')
  `, [], (err, rows) => {
    if (err) return console.error('Cleanup error:', err);
    if (!rows || rows.length === 0) return;
    
    const inactivePasswords = rows.map(r => r.password);
    const placeholders = inactivePasswords.map(() => '?').join(',');
    
    db.all(`SELECT id FROM users WHERE password IN (${placeholders})`, inactivePasswords, (err, userRows) => {
      if (err || !userRows.length) return;
      
      const userIds = userRows.map(u => u.id);
      const idPlaceholders = userIds.map(() => '?').join(',');
      
      db.run(`DELETE FROM messages WHERE sender_id IN (${idPlaceholders})`, userIds, function(err) {
        if (!err && this.changes > 0) {
          console.log(`Automatically cleaned up ${this.changes} messages from inactive rooms (offline > 2 hrs).`);
        }
      });
    });
  });
}, 5 * 60 * 1000); // Check every 5 minutes

setupSocketHandlers(io, db);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
