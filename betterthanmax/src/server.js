import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import PushNotifications from 'node-pushnotifications'
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
        const text = message.toString();

        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(text);
            }
        });
    });
    ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
    });
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())

const publicVAPIDKey = "BN46Nf2_v1PHLf8JBehfnb3RBJlaVQ4XDRkcY8anb6Sw74C1__tzwGyb_SvZZr9W-eUfupl6rieMRVvs-ScNdHQ";
const privateVAPIDKey = process.env.PRIVATE_VAPID_KEY;
console.log(privateVAPIDKey)

app.post("/notification", (req, res) => {
    const subscribtion = req.body;
    const { message } = req.query;
    
    const settings = {
        web: {
            vapidDetails: {
                subject: "mailto: <davidiskieveshton@gmail.com>",
                publicKey: publicVAPIDKey,
                privateKey: privateVAPIDKey
            },
            gcmAPIKey: "gcmkey",
            TTL: 2419200,
            contentEncoding: "aes128gcm",
            headers: {},
        },
        isAlwaysUseFCM: false
    };

    const push = new PushNotifications(settings);

    const payload = { 
        title: "You got a message:",
        body: message
    };
    push.send(subscribtion, payload, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
    })
})

app.use('/auth', authRoutes);
app.use('/chats/globalChat', authMiddleware, globalChatRoutes);

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});