import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router();

router.get('/getusername', (req, res) => {
    const id = req.userId;

    try {
    const fingUserById = db.prepare(`SELECT * FROM users WHERE id = ?`);
    const user = fingUserById.get(id);

    if (!user) res.status(404).json({ message: "user not found"});

    res.status(200).json({ name: user.username });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }

})

export default router