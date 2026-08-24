import { io } from 'socket.io-client';
import { GAME_WIDTH, GAME_HEIGHT, SOCKET_EVENTS } from '@shadow-clash/shared';

// Setup elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const serverStatusEl = document.getElementById('server-status');
const fpsEl = document.getElementById('game-fps');

// Set canvas dimensions based on shared constants
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Connect to Socket.io server
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
  
  // Start ping measurement
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

// FPS counter variables
let frameCount = 0;
let lastFpsUpdate = 0;
let fps = 0;

// Simple loop to draw placeholder visual for Phase 1
function render(timestamp: number) {
  // Calculate FPS
  if (!lastFpsUpdate) lastFpsUpdate = timestamp;
  frameCount++;
  if (timestamp - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
    if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFpsUpdate = timestamp;
  }

  if (ctx) {
    // Clear canvas
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw grid background
    ctx.strokeStyle = '#1f2833';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Draw a ground line
    ctx.strokeStyle = '#45f3ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - 100);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - 100);
    ctx.stroke();

    // Fill ground floor
    ctx.fillStyle = 'rgba(31, 40, 51, 0.5)';
    ctx.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);

    // Drawing title text
    ctx.fillStyle = '#66fcf1';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHADOW CLASH', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

    // Subtitle
    ctx.fillStyle = '#c5c6c7';
    ctx.font = '20px sans-serif';
    ctx.fillText('PHASE 1: PROJECT SETUP COMPLETE', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);

    // Drawing mock fighter boxes
    // Player 1 (Left)
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(200, GAME_HEIGHT - 350, 100, 250);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, GAME_HEIGHT - 350, 100, 250);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('PLAYER 1', 250, GAME_HEIGHT - 370);

    // Player 2 (Right)
    ctx.fillStyle = '#0055ff';
    ctx.fillRect(GAME_WIDTH - 300, GAME_HEIGHT - 350, 100, 250);
    ctx.strokeRect(GAME_WIDTH - 300, GAME_HEIGHT - 350, 100, 250);
    ctx.fillStyle = '#fff';
    ctx.fillText('PLAYER 2', GAME_WIDTH - 250, GAME_HEIGHT - 370);
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
