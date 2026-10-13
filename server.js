import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const rooms = new Map();
const clients = new Map();
app.disable('x-powered-by');
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/lan', (_req, res) => {
  const urls = [];
  for (const addresses of Object.values(networkInterfaces())) for (const address of addresses || []) {
    if (address.family === 'IPv4' && !address.internal) urls.push(`http://${address.address}:${port}`);
  }
  res.json({ urls });
});
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
wss.on('connection', socket => {
  clients.set(socket, { room: null, playerId: Math.random().toString(36).slice(2, 8) });
  socket.on('message', raw => {
    if (raw.length > 8192) return socket.close(1009, 'Message too large');
    let data; try { data = JSON.parse(raw.toString()); } catch { return; }
    const client = clients.get(socket); if (!client) return;
    if (data.type === 'create' || data.type === 'join') {
      const code = String(data.code || '').toUpperCase();
      if (!/^[A-Z0-9]{5}$/.test(code)) return socket.send(JSON.stringify({ type: 'error', message: 'Code invalide.' }));
      let room = rooms.get(code);
      if (!room && data.type === 'join') return socket.send(JSON.stringify({ type: 'error', message: 'Ce salon n’existe pas. Crée-le sur le PC hôte.' }));
      if (!room) { room = new Set(); rooms.set(code, room); }
      if (room.size >= 2) return socket.send(JSON.stringify({ type: 'error', message: 'Ce salon est complet.' }));
      client.room = code; room.add(socket);
      socket.send(JSON.stringify({ type: 'room', code, player: room.size, count: room.size }));
      for (const peer of room) if (peer !== socket) peer.send(JSON.stringify({ type: 'peer', connected: true, count: room.size }));
      return;
    }
    if (data.type === 'state' && client.room) {
      const room = rooms.get(client.room); if (!room) return;
      const state = { type: 'state', player: data.player, playerId: client.playerId };
      for (const peer of room) if (peer !== socket && peer.readyState === 1) peer.send(JSON.stringify(state));
    }
  });
  socket.on('close', () => {
    const client = clients.get(socket); if (!client) return;
    const room = rooms.get(client.room);
    if (room) { room.delete(socket); for (const peer of room) if (peer.readyState === 1) peer.send(JSON.stringify({ type: 'peer', connected: false, count: room.size })); if (room.size === 0) rooms.delete(client.room); }
    clients.delete(socket);
  });
});
const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => {
  console.log(`Véhicule Arena : http://localhost:${port}`);
  for (const addresses of Object.values(networkInterfaces())) for (const address of addresses || []) if (address.family === 'IPv4' && !address.internal) console.log(`Réseau local : http://${address.address}:${port}`);
});
