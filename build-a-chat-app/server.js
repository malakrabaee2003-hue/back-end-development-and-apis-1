import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

// تعويض المتغيرات الخاصة بالمسارات في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

// 1. Create the HTTP server to serve public/index.html
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url.startsWith('/?username=')) {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
  } else if (req.url === '/script.js') {
    fs.readFile(path.join(__dirname, 'public', 'script.js'), (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 2. Create the WebSocketServer from the ws package
const wss = new WebSocketServer({ server });

// دالة مساعدة لإرسال الرسائل لجميع المتصلين
function broadcast(messageObj) {
  const messageString = JSON.stringify(messageObj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

// 3. Register a 'connection' listener on wss
wss.on('connection', (socket, req) => {
  // 4. Parse the username from the URL query string
  const urlObj = new URL(req.url, "http://localhost");
  const username = urlObj.searchParams.get("username") || "Anonymous";

  // إرسال رسالة انضمام للمستخدم الجديد فوراً
  broadcast({ type: "system", text: `${username} joined` });

  // 5. Register a 'message' listener on the socket
  socket.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data);
      // بث رسالة الدردشة للجميع
      broadcast({
        type: 'chat',
        username: parsedData.username || username,
        text: parsedData.text
      });
    } catch (err) {
      console.error("Error parsing message data:", err);
    }
  });

  // 6. Register a 'close' listener on the socket
  socket.on('close', () => {
    // بث رسالة مغادرة المستخدم
    broadcast({ type: 'system', text: `${username} left` });
  });
});

// 7. Start the server
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});
