import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GAME_WIDTH, GAME_HEIGHT, SOCKET_EVENTS } from '@shadow-clash/shared';
import { matchmaker } from './matchmaking/matchmaker.js';
import { roomManager } from './rooms/room-manager.js';

const app = express();
const port = process.env.PORT || 3005;

app.use(cors({
  origin: '*',
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gameDimensions: { width: GAME_WIDTH, height: GAME_HEIGHT }
  });
});

// REST Matchmaking Endpoints
app.post('/api/matchmaking/join', (req, res) => {
  const { userId, username, socketId } = req.body;
  if (!userId || !username || !socketId) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }
  const success = matchmaker.joinQueue({
    userId,
    username,
    socketId,
    queuedAt: Date.now()
  });
  if (success) {
    res.json({ status: 'queued', userId });
  } else {
    res.json({ status: 'already_queued' });
  }
});

app.post('/api/matchmaking/leave', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  matchmaker.leaveQueue(userId);
  res.json({ status: 'left' });
});

app.get('/api/matchmaking/status', (req, res) => {
  res.json({ queueSize: matchmaker.getQueueSize() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Simple Ping-Pong
  socket.on(SOCKET_EVENTS.PING, () => {
    socket.emit(SOCKET_EVENTS.PONG);
  });

  // Socket Matchmaking listeners
  socket.on(SOCKET_EVENTS.MATCHMAKING_JOIN, (payload: { userId: string; username: string }) => {
    const { userId, username } = payload;
    if (userId && username) {
      matchmaker.joinQueue({
        userId,
        username,
        socketId: socket.id,
        queuedAt: Date.now()
      });
    }
  });

  socket.on(SOCKET_EVENTS.MATCHMAKING_LEAVE, (payload: { userId: string }) => {
    const { userId } = payload;
    if (userId) {
      matchmaker.leaveQueue(userId);
    }
  });

  // Socket Room listeners
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (payload: { userId: string; username: string }) => {
    const { userId, username } = payload;
    if (userId && username) {
      const room = roomManager.createRoom(socket.id, userId, username);
      socket.join(`room_${room.roomCode}`);
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomCode: room.roomCode });
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload: { roomCode: string; userId: string; username: string }) => {
    const { roomCode, userId, username } = payload;
    if (roomCode && userId && username) {
      const room = roomManager.joinRoom(roomCode, socket.id, userId, username);
      if (room) {
        socket.join(`room_${roomCode}`);
        io.to(`room_${roomCode}`).emit(SOCKET_EVENTS.ROOM_JOINED, {
          roomCode,
          players: room.players.map(p => ({ id: p.userId, username: p.username, ready: p.ready }))
        });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Room not found or full' });
      }
    }
  });

  socket.on(SOCKET_EVENTS.CHARACTER_SELECTED, (payload: { characterId: string }) => {
    const { characterId } = payload;
    const room = roomManager.getPlayerRoom(socket.id);
    if (room) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.characterId = characterId;
        player.ready = true;
      }

      const allSelected = room.players.length === 2 && room.players.every(p => p.ready && p.characterId !== null);
      if (allSelected) {
        room.matchState = 'STAGE_SELECT';
      }

      io.to(`room_${room.roomCode}`).emit('room-player-selected', {
        players: room.players.map(p => ({ id: p.userId, username: p.username, ready: p.ready, characterId: p.characterId })),
        matchState: room.matchState
      });
    }
  });

  socket.on(SOCKET_EVENTS.CHARACTER_CURSOR_MOVE, (payload: { cursorIndex: number }) => {
    const oppSocketId = roomManager.getOpponentSocketId(socket.id);
    if (oppSocketId) {
      io.to(oppSocketId).emit(SOCKET_EVENTS.CHARACTER_CURSOR_MOVED, {
        socketId: socket.id,
        cursorIndex: payload.cursorIndex
      });
    }
  });

  socket.on('stage-selected', (payload: { stageId: string }) => {
    const { stageId } = payload;
    const room = roomManager.getPlayerRoom(socket.id);
    if (room && room.hostSocketId === socket.id) {
      room.stageId = stageId;
      room.matchState = 'COUNTDOWN';
      
      const p1 = room.players[0];
      const p2 = room.players[1];

      io.to(`room_${room.roomCode}`).emit(SOCKET_EVENTS.MATCH_START, {
        stageId,
        p1SelectedChar: p1.characterId,
        p2SelectedChar: p2.characterId
      });
    }
  });

  socket.on(SOCKET_EVENTS.GAME_INPUT, (payload: any) => {
    const oppSocketId = roomManager.getOpponentSocketId(socket.id);
    if (oppSocketId) {
      io.to(oppSocketId).emit(SOCKET_EVENTS.GAME_INPUT, payload);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    matchmaker.leaveQueue(socket.id);

    const roomDetails = roomManager.leaveRoom(socket.id);
    if (roomDetails) {
      const { roomCode, closed } = roomDetails;
      if (!closed) {
        io.to(`room_${roomCode}`).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, { socketId: socket.id });
      }
    }
  });
});

// Periodic Matchmaking Check (every 1 second)
setInterval(() => {
  matchmaker.tickMatchmaking(io);
}, 1000);

httpServer.listen(port, () => {
  console.log(`Shadow Clash Backend listening on port ${port}`);
  console.log(`Game Canvas Size Configured: ${GAME_WIDTH}x${GAME_HEIGHT}`);
});
