import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GAME_WIDTH, GAME_HEIGHT, SOCKET_EVENTS } from '@shadow-clash/shared';
import { matchmaker } from './matchmaking/matchmaker.js';

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

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    matchmaker.leaveQueue(socket.id); // Auto-purge offline sockets
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
