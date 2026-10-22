// Arena de Bichos: serves the game page and relays room presence between players over WebSocket.
// No accounts: anyone with the link can create or join a room by its 4-letter code.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const GAME_FILE = path.join(__dirname, "arena-bichos.html");
const MAX_PER_ROOM = 12;
const ROOM_NAME = /^[a-z0-9][a-z0-9_.-]{0,47}$/;

// The game file is written as a page body (that is how the claude.ai version publishes it), so wrap it in a full document here.
function page() {
  const body = fs.readFileSync(GAME_FILE, "utf8");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">` +
    `<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}` +
    `body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>` +
    `<script>window.ARENA_WS = true;</script></head><body>${body}</body></html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    res.end(page());
  } else if (url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
  } else {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("No encontrado");
  }
});

const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 16 * 1024 });
const rooms = new Map();

const plainObject = v => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
function broadcast(from, msg) {
  const room = rooms.get(from.room);
  if (!room) return;
  const text = JSON.stringify(msg);
  for (const other of room) if (other !== from && other.readyState === 1) other.send(text);
}

wss.on("connection", ws => {
  ws.id = crypto.randomBytes(6).toString("hex");
  ws.room = null;
  ws.presence = {};
  ws.alive = true;
  ws.budget = 60;
  ws.on("pong", () => { ws.alive = true; });

  ws.on("message", raw => {
    if (--ws.budget < 0) return; // more than ~60 messages a second: drop the extra ones
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.t === "join" && !ws.room && typeof m.room === "string" && ROOM_NAME.test(m.room)) {
      let room = rooms.get(m.room);
      if (!room) rooms.set(m.room, room = new Set());
      if (room.size >= MAX_PER_ROOM) { ws.send(JSON.stringify({ t: "full" })); ws.close(); return; }
      ws.room = m.room;
      ws.presence = plainObject(m.presence);
      ws.send(JSON.stringify({ t: "welcome", peer: ws.id, peers: [...room].map(o => ({ peer: o.id, presence: o.presence })) }));
      room.add(ws);
      broadcast(ws, { t: "p", peer: ws.id, data: ws.presence });
    } else if (m.t === "presence" && ws.room) {
      ws.presence = plainObject(m.data);
      broadcast(ws, { t: "p", peer: ws.id, data: ws.presence });
    }
  });

  ws.on("close", () => {
    const room = ws.room && rooms.get(ws.room);
    if (!room) return;
    room.delete(ws);
    broadcast(ws, { t: "left", peer: ws.id });
    if (!room.size) rooms.delete(ws.room);
  });
});

// Refill each connection's message budget every second and drop connections that stopped answering pings.
setInterval(() => { for (const ws of wss.clients) ws.budget = 60; }, 1000);
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false;
    ws.ping();
  }
}, 15000);

server.listen(PORT, () => console.log(`Arena de Bichos en http://localhost:${PORT}`));
