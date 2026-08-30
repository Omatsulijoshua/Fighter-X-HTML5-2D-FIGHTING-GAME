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

// 1. Connect to Socket.io server
const socket = io(window.location.origin);
let lastPingTime = 0;
let latency = 0;
let isServerConnected = false;

// 2. Initialize Game Context (with socket)
const context = new GameContext(socket);

// 3. Initialize Game Loop
const gameLoop = new GameLoop(ctx, context);
gameLoop.start();

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

// --- ONLINE MATCHMAKING & LOBBY SOCKET LISTENERS ---
socket.on('matchmaking-matched', (payload: { roomCode: string, opponent: { id: string, username: string } }) => {
  console.log(`Matched! Room: ${payload.roomCode}, opponent: ${payload.opponent.username}`);
  context.roomCode = payload.roomCode;
  socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
    roomCode: payload.roomCode,
    userId: socket.id,
    username: 'Online Player'
  });
});

socket.on(SOCKET_EVENTS.ROOM_JOINED, (payload: { roomCode: string, players: any[] }) => {
  console.log('Room joined successfully:', payload);
  context.roomCode = payload.roomCode;
  const isHost = payload.players[0].id === socket.id;
  context.multiplayerSlot = isHost ? 'p1' : 'p2';
  context.isMultiplayer = true;

  if (isHost) {
    context.inputP2.isRemote = true;
    context.inputP1.isRemote = false;
  } else {
    context.inputP1.isRemote = true;
    context.inputP2.isRemote = false;
  }

  context.matchState = 'CHARACTER_SELECT';
  context.p1CursorIndex = 0;
  context.p2CursorIndex = 1;
  context.p1SelectedChar = null;
  context.p2SelectedChar = null;
  context.opponentCursorIndex = isHost ? 1 : 0;
  context.opponentSelectedChar = null;
  context.menuInputCooldown = 12;
});

socket.on(SOCKET_EVENTS.CHARACTER_CURSOR_MOVED, (payload: { socketId: string, cursorIndex: number }) => {
  context.opponentCursorIndex = payload.cursorIndex;
  if (context.multiplayerSlot === 'p1') {
    context.p2CursorIndex = payload.cursorIndex;
  } else {
    context.p1CursorIndex = payload.cursorIndex;
  }
});

socket.on('room-player-selected', (payload: { players: any[], matchState: string }) => {
  const isHost = context.multiplayerSlot === 'p1';
  const remotePlayer = payload.players.find((p: any) => p.id !== socket.id);
  const localPlayer = payload.players.find((p: any) => p.id === socket.id);

  if (localPlayer) {
    if (isHost) {
      context.p1SelectedChar = localPlayer.characterId;
    } else {
      context.p2SelectedChar = localPlayer.characterId;
    }
  }
  if (remotePlayer) {
    context.opponentSelectedChar = remotePlayer.characterId;
    if (isHost) {
      context.p2SelectedChar = remotePlayer.characterId;
    } else {
      context.p1SelectedChar = remotePlayer.characterId;
    }
  }

  if (payload.matchState === 'STAGE_SELECT') {
    context.matchState = 'STAGE_SELECT';
    context.stageCursorIndex = 0;
    context.stageInputCooldown = 12;
  }
});

socket.on(SOCKET_EVENTS.MATCH_START, (payload: { stageId: string, p1SelectedChar: string, p2SelectedChar: string }) => {
  console.log('Online match starting:', payload);
  context.selectedStageId = payload.stageId;
  context.p1SelectedChar = payload.p1SelectedChar;
  context.p2SelectedChar = payload.p2SelectedChar;
  
  context.initializeFighters(payload.p1SelectedChar, payload.p2SelectedChar);
  context.matchState = 'COUNTDOWN';
  context.countdownTimer = 3 * 60;
});

socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, () => {
  console.log('Opponent disconnected!');
  context.resetArcade();
  context.matchState = 'MAIN_MENU';
});

socket.on(SOCKET_EVENTS.GAME_INPUT, (payload: { tick: number, inputs: any }) => {
  if (context.multiplayerSlot === 'p1') {
    context.inputP2.injectNetworkInput(payload.tick, payload.inputs);
  } else {
    context.inputP1.injectNetworkInput(payload.tick, payload.inputs);
  }
});

// 4. Debug Mode toggle binding (F3)
window.addEventListener('keydown', (e) => {
  if (e.code === 'F3') {
    e.preventDefault();
    context.debugMode = !context.debugMode;
    console.log(`Debug Mode toggled: ${context.debugMode}`);
  }
});

// 5. Touch Controls binding
window.addEventListener('touchstart', () => {
  document.body.classList.add('show-touch');
}, { once: true });

const touchControls = document.getElementById('touch-controls');
if (touchControls) {
  const buttons = touchControls.querySelectorAll('.touch-btn');
  buttons.forEach(btn => {
    const action = btn.getAttribute('data-action') as any;

    const handleStart = (e: Event) => {
      e.preventDefault();
      context.inputP1.setVirtualInput(action, true);
    };

    const handleEnd = (e: Event) => {
      e.preventDefault();
      context.inputP1.setVirtualInput(action, false);
    };

    btn.addEventListener('touchstart', handleStart, { passive: false });
    btn.addEventListener('touchend', handleEnd, { passive: false });
    btn.addEventListener('touchcancel', handleEnd, { passive: false });

    btn.addEventListener('mousedown', handleStart);
    btn.addEventListener('mouseup', handleEnd);
    btn.addEventListener('mouseleave', handleEnd);
  });
}
