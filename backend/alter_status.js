const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/chat.db');

db.serialize(() => {
  db.run("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'", (err) => {
    if (err) console.log(err.message);
    else console.log("Added status to messages");
  });
  db.run("UPDATE messages SET status = 'sent'", (err) => {
    if (err) console.log(err.message);
    else console.log("Updated status in messages");
  });
});
