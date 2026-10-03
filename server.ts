/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GameRoom } from './server/gameRoom';
import { GameRoomSummary } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Active Game Rooms Store
const activeRooms = new Map<string, GameRoom>();

// Seed default public rooms
function seedDefaultRooms() {
  const defaultRooms = [
    { id: 'ALPHA', name: 'Outpost Hostile Sector', mapId: 'outpost' as const, mode: 'ffa' as const, maxPlayers: 8, botCount: 1 },
    { id: 'BRAVO', name: 'Bunker 17 Red Alert', mapId: 'bunker' as const, mode: 'ffa' as const, maxPlayers: 8, botCount: 1 },
    { id: 'CYBER', name: 'Cyber Neon Combat', mapId: 'cyber' as const, mode: 'ffa' as const, maxPlayers: 8, botCount: 1 },
  ];

  for (const r of defaultRooms) {
    if (!activeRooms.has(r.id)) {
      const room = new GameRoom(r.id, r.name, r.mapId, r.mode, r.maxPlayers, r.botCount);
      activeRooms.set(r.id, room);
    }
  }
}

seedDefaultRooms();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // API Routes
  app.get('/api/rooms', (req, res) => {
    const list: GameRoomSummary[] = [];
    for (const room of activeRooms.values()) {
      const humanCount = room.clients.size;
      list.push({
        id: room.id,
        name: room.name,
        mapId: room.mapId,
        mode: room.mode,
        playerCount: humanCount,
        maxPlayers: room.maxPlayers,
        botCount: room.botCount,
        status: room.status,
        isPrivate: false,
      });
    }
    res.json(list);
  });

  app.post('/api/rooms', (req, res) => {
    const { name, mapId, mode, maxPlayers, botCount } = req.body;
    const roomId = 'MIL' + Math.floor(1000 + Math.random() * 9000);
    const roomName = name?.trim() || `Squad Room ${roomId}`;

    const newRoom = new GameRoom(
      roomId,
      roomName,
      mapId || 'outpost',
      mode || 'ffa',
      Number(maxPlayers) || 8,
      Number(botCount ?? 1)
    );

    activeRooms.set(roomId, newRoom);
    res.json({
      success: true,
      roomId,
      name: roomName,
    });
  });

  // WebSocket Connection Handling
  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { action } = msg;

        if (action === 'join_room') {
          const { roomId, playerId, name, loadout } = msg;
          let targetRoom = activeRooms.get(roomId);

          if (!targetRoom) {
            // Auto create room if code doesn't exist (1 hostile enemy at a time)
            targetRoom = new GameRoom(roomId, `Room ${roomId}`, 'outpost', 'ffa', 8, 1);
            activeRooms.set(roomId, targetRoom);
          }

          currentRoomId = roomId;
          currentPlayerId = playerId;
          targetRoom.addClient(ws, playerId, name, loadout);
        } else if (action === 'leave_room') {
          if (currentRoomId && currentPlayerId) {
            const room = activeRooms.get(currentRoomId);
            room?.removeClient(currentPlayerId);
            currentRoomId = null;
            currentPlayerId = null;
          }
        } else if (currentRoomId && currentPlayerId) {
          const room = activeRooms.get(currentRoomId);
          room?.handleClientMessage(currentPlayerId, msg);
        }
      } catch (err) {
        console.error('WS Parse Error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = activeRooms.get(currentRoomId);
        room?.removeClient(currentPlayerId);
      }
    });
  });

  // Attach Vite or Static
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Mini Militia 3D Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
