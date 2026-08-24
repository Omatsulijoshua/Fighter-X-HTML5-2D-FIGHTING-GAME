import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@shadow-clash/shared';
import { GameContext } from './game/engine/game-context.js';
import { GameLoop } from './game/engine/game-loop.js';

// Setup elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const serverStatusEl = document.getElementById('server-status');

if (!ctx) {
  throw new Error('Could not acquire 2D canvas context');
}

// 1. Initialize Game Context
const context = new GameContext();

// 2. Initialize Game Loop
const gameLoop = new GameLoop(ctx, context);
gameLoop.start();

// 3. Connect to Socket.io server
const socket = io(window.location.origin);
let lastPingTime = 0;
let latency = 0;
let isServerConnected = false;

socket.on('connect', () => {
  isServerConnected = true;
  if (serverStatusEl) {
    serverStatusEl.textContent = 'Server: Connected';
    serverStatusEl.style.color = '#4caf50';
  }
  console.log('Connected to server!');
  sendPing();
});

socket.on('disconnect', () => {
  isServerConnected = false;
  if (serverStatusEl) {
    serverStatusEl.textContent = 'Server: Disconnected';
    serverStatusEl.style.color = '#f44336';
  }
  console.log('Disconnected from server!');
});

socket.on(SOCKET_EVENTS.PONG, () => {
  latency = Date.now() - lastPingTime;
  if (serverStatusEl && isServerConnected) {
    serverStatusEl.textContent = `Server: Connected (Ping: ${latency}ms)`;
  }
  setTimeout(sendPing, 2000); // Ping every 2 seconds
});

function sendPing() {
  if (socket.connected) {
    lastPingTime = Date.now();
    socket.emit(SOCKET_EVENTS.PING);
  }
}

// 4. Debug Mode toggle binding (F3)
window.addEventListener('keydown', (e) => {
  if (e.code === 'F3') {
    e.preventDefault();
    context.debugMode = !context.debugMode;
    console.log(`Debug Mode toggled: ${context.debugMode}`);
  }
});
