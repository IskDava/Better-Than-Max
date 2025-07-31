import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync(':memory:');

db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`);

db.exec(`
    CREATE TABLE globalchat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        sender_id INTEGER,
        FOREIGN KEY (sender_id) REFERENCES users(id)
    )
`);

export default db;