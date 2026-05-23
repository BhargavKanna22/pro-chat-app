const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const webpush = require('web-push');
const db = require('./database');
const setupSocketHandlers = require('./socketHandlers');

// Setup Web Push
const VAPID_PUBLIC_KEY = 'BEANpOYTUDIqy-9RvnN8SOX1hehsrZB7e_KznUJry_bOoUr5wP_E9oOfcl-GbT8g1ih2bJD0IrGFXmspNTXQQdo';
const VAPID_PRIVATE_KEY = 'tnW0cCx5JDPetCAbXbqSkMbpV2hDPVyFdLdcNMHIWeM';
webpush.setVapidDetails('mailto:gorlisatya714@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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
app.get('/api/vapid-public-key', (req, res) => {
  res.send(VAPID_PUBLIC_KEY);
});

app.post('/api/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Subscription and userId required' });
  }

  const subStr = JSON.stringify(subscription);
  db.run('UPDATE users SET push_subscription = ? WHERE id = ?', [subStr, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({});
  });
});

app.post('/api/check-email', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ exists: !!row });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password, name, avatar } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email and password
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // Login returning user
      db.run('UPDATE users SET isOnline = 1 WHERE id = ?', [row.id], function(updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        return res.json({ user: { id: row.id, name: row.name, avatar: row.avatar, password: row.password, email: row.email, isOnline: 1 } });
      });
    } else {
      // Check if email already exists with DIFFERENT password
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingEmail) => {
        if (existingEmail) {
          return res.status(401).json({ error: 'Incorrect password for this email.' });
        }
        
        // Register new user
        if (!name || !avatar) {
           return res.status(400).json({ error: 'Name and avatar are required for new users' });
        }

        db.run('INSERT INTO users (name, password, avatar, email, isOnline) VALUES (?, ?, ?, ?, 1)', [name, password, avatar, email], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ user: { id: this.lastID, name, avatar, password, email, isOnline: 1 } });
        });
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

app.put('/api/users/:userId/name', (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Also notify other users in the room if we wanted to, but the easiest way is to let the frontend update state
    res.json({ success: true, name });
  });
});

app.delete('/api/users/:userId/chats', (req, res) => {
  const { userId } = req.params;
  db.run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
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
