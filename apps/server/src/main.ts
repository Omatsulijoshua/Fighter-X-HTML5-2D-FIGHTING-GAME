import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GAME_WIDTH, GAME_HEIGHT, SOCKET_EVENTS } from '@shadow-clash/shared';

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

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Shadow Clash Backend listening on port ${port}`);
  console.log(`Game Canvas Size Configured: ${GAME_WIDTH}x${GAME_HEIGHT}`);
});
