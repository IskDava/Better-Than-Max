import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router();

router.post('/register', (req, res) => {
    const { username, password } = req.body;

    const hashedPswd = bcrypt.hashSync(password, 8);

    try {
        const insertUser = db.prepare(`INSERT INTO users (username, password) VALUES (?,?)`);
        const result = insertUser.run(username, hashedPswd);

        const token = jwt.sign({id: result.lastInsertRowid}, process.env.JWT_SECRET, {expiresIn: '24h'});
        res.status(201).json({ token });
    } catch (err) {
        if (err.errstr === "constraint failed") {
            return res.status(409).send({ message: 'Username already taken' })
        }
        res.sendStatus(503);
    }
})

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    try {
        const getUser = db.prepare(`SELECT * FROM users WHERE username = ?`);
        const user = getUser.get(username);

        if (!user) {
            return res.status(404).send({message:"User not found"});
        }

        const passwordIsCorrect = bcrypt.compareSync(password, user.password);

        if (!passwordIsCorrect) {
            return res.status(401).send({message: "Invalid password"});
        }
        
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '24h'});
        res.status(202).json({ token })

    } catch (err) {
        console.log(err);
        res.sendStatus(503);
    }
})

export default router