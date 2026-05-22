const connectedUsers = new Map(); // socket.id -> userId
const userRooms = new Map(); // socket.id -> password

function setupSocketHandlers(io, db) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_login', (userId) => {
      connectedUsers.set(socket.id, userId);
      db.get('SELECT password FROM users WHERE id = ?', [userId], (err, row) => {
        if (!row) return;
        const password = row.password;
        socket.join(password);
        userRooms.set(socket.id, password);
        
        db.run('UPDATE users SET isOnline = 1 WHERE id = ?', [userId]);
        
        db.get('SELECT id, name, avatar, isOnline FROM users WHERE id = ?', [userId], (err, user) => {
           if (user) io.to(password).emit('user_status_change', user);
        });
      });
    });

    socket.on('send_message', (data) => {
      const { sender_id, receiver_id, content, reply_to } = data;
      const room = userRooms.get(socket.id);
      
      db.run(
        'INSERT INTO messages (sender_id, receiver_id, content, reply_to, status) VALUES (?, ?, ?, ?, ?)',
        [sender_id, receiver_id, content, reply_to || null, 'sent'],
        function(err) {
          if (err) return console.error(err);
          
          const message = {
            id: this.lastID,
            sender_id,
            receiver_id,
            content,
            reply_to: reply_to || null,
            status: 'sent',
            timestamp: new Date().toISOString()
          };
          
          if (room) {
            io.to(room).emit('receive_message', message);
          } else {
            io.emit('receive_message', message);
          }
        }
      );
    });

    socket.on('clear_chat', ({ sender_id, receiver_id }) => {
      const room = userRooms.get(socket.id);
      if (room) {
        io.to(room).emit('chat_cleared', { sender_id, receiver_id });
      }
    });

    socket.on('react_message', ({ messageId, reaction }) => {
      const room = userRooms.get(socket.id);
      db.run('UPDATE messages SET reaction = ? WHERE id = ?', [reaction, messageId], function(err) {
        if (err) return console.error(err);
        if (room) {
          io.to(room).emit('message_reacted', { messageId, reaction });
        }
      });
    });

    socket.on('mark_read', ({ sender_id, receiver_id }) => {
      const room = userRooms.get(socket.id);
      db.run("UPDATE messages SET status = 'read' WHERE sender_id = ? AND receiver_id = ? AND status = 'sent'", 
        [sender_id, receiver_id], 
        function(err) {
          if (err) return console.error(err);
          if (this.changes > 0 && room) {
            io.to(room).emit('messages_read', { sender_id, receiver_id });
          }
      });
    });

    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      const room = userRooms.get(socket.id);
      if (userId) {
        db.run("UPDATE users SET isOnline = 0, last_seen = datetime('now') WHERE id = ?", [userId]);
        if (room) {
           io.to(room).emit('user_status_change', { id: userId, isOnline: 0 });
        }
        connectedUsers.delete(socket.id);
        userRooms.delete(socket.id);
      }
      console.log('User disconnected:', socket.id);
    });
  });
}

module.exports = setupSocketHandlers;
