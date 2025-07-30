import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT ||  2727;

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

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});