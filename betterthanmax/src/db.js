import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync('./src/databases/main.db');

try {
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
} catch {
    console.log("Already have a database named main.db, so will read from it");
}

export default db;