export const SOCKET_EVENTS = {
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  ROOM_ERROR: 'room-error',
  
  PLAYER_READY: 'player-ready',
  CHARACTER_SELECTED: 'character-selected',
  
  MATCH_START: 'match-start',
  GAME_INPUT: 'game-input',
  GAME_STATE: 'game-state',
  PLAYER_HIT: 'player-hit',
  ROUND_START: 'round-start',
  ROUND_END: 'round-end',
  MATCH_END: 'match-end',
  
  PING: 'ping',
  PONG: 'pong',
  
  PLAYER_DISCONNECTED: 'player-disconnected',
  PLAYER_RECONNECTED: 'player-reconnected',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

export interface JoinRoomPayload {
  roomCode: string;
  username: string;
}

export interface RoomJoinedPayload {
  roomCode: string;
  players: { id: string; username: string; ready: boolean }[];
}

export interface GameInputPayload {
  tick: number;
  inputs: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    lightAttack: boolean;
    heavyAttack: boolean;
    specialAttack: boolean;
    block: boolean;
    grab: boolean;
  };
}
