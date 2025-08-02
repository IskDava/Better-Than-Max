import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import webpush from 'web-push'
import bodyParser from 'body-parser'
import authRoutes from './routes/authRoutes.js'
import globalChatRoutes from './routes/globalChatRoutes.js'
import authMiddleware from './middleware/authMiddleware.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT;

let clients = [];

wss.on("connection", ws => {
    clients.push(ws);
    ws.on("message", message => {

        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
    ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
    });
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(bodyParser.json())

const publicVAPIDKey = "BCNIzgwqLoxQBoZjk8wLg5Lxaprlc6wkXXZ-94GljbD5OORZHGduHrzc2p8eJv16mt9tHftDlgNLVEmn4a6ZK1U";
const privateVAPIDKey = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails(
    'mailto:davidiskieveshton@gmail.com',
    publicVAPIDKey,
    privateVAPIDKey
)

app.post("/notification", async (req, res) => {
    const subscribtion = req.body;
    const { message } = req.query;
    
    const payload = JSON.stringify({
        title: 'New message',
        body: message
    });

    const options = {
        TTL: 60,
        headers: { urgency: 'high' }
    };

    try {
        await webpush.sendNotification(subscribtion, payload, options);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.use('/auth', authRoutes);
app.use('/chats/globalChat', authMiddleware, globalChatRoutes);

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});