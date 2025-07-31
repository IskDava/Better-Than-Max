import express from 'express'
import db from '../db.js'

const router = express.Router();

router.get('/', (req, res) => {
    const getMessages = db.prepare(`SELECT 
        m.id
        m.content
        u.id AS sender_id
        u.username AS sender_username
        FROM globalchat_messages AS m
        JOIN users AS u ON m.sender_id = u.id`);
    const messages = getMessages.all();
    let result = [];
    messages.forEach(message => {
        result.push({
            id : message.id,
            content : message.content,
            sender : message.sender,
            isMine : message.sender.id == req.userId
        });
    });
    res.status(200).json(result)
})

export default router