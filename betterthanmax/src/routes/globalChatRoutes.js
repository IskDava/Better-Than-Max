import express from 'express'
import db from '../db.js'

const router = express.Router();

router.get('/', (req, res) => {
    const getMessages = db.prepare(`SELECT * FROM globalchat_messages`);

    const getUserById = db.prepare(`SELECT * FROM users WHERE id = ?`)

    const messages = getMessages.all();
    console.log(messages);
    let result = [];
    messages.forEach(message => {
        const sender = {
            id: message.sender_id,
            username: getUserById.get(message.sender_id).username
        };
        result.push({
            id: message.id,
            content: message.content,
            sender,
            isMine: sender.id == req.userId
        });
        console.log(result)
    });
    res.status(200).json(result)
})

router.post('/', (req, res) => {
    const { content, senderUsername } = req.body;

    const findIdByUsername = db.prepare(`SELECT * FROM users WHERE username = ?`);
    const sender = findIdByUsername.get(senderUsername);
    const senderId = sender.id;

    const insertMessage = db.prepare(`INSERT INTO globalchat_messages (content, sender_id) VALUES (?, ?)`);
    insertMessage.run(content, senderId);

    console.log("Added message");
    res.sendStatus(201);
})

export default router