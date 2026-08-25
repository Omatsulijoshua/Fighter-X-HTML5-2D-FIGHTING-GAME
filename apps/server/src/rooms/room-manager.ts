export interface RoomPlayer {
  socketId: string;
  userId: string;
  username: string;
  ready: boolean;
  characterId: string | null;
}

export interface GameRoom {
  roomCode: string;
  players: RoomPlayer[];
  matchState: string;
  stageId: string | null;
  hostSocketId: string;
}

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private socketToRoom = new Map<string, string>();

  public createRoom(socketId: string, userId: string, username: string): GameRoom {
    let roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    while (this.rooms.has(roomCode)) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const hostPlayer: RoomPlayer = {
      socketId,
      userId,
      username,
      ready: false,
      characterId: null
    };

    const newRoom: GameRoom = {
      roomCode,
      players: [hostPlayer],
      matchState: 'CHARACTER_SELECT',
      stageId: null,
      hostSocketId: socketId
    };

    this.rooms.set(roomCode, newRoom);
    this.socketToRoom.set(socketId, roomCode);
    console.log(`Room created: ${roomCode} by host socket ${socketId}`);
    return newRoom;
  }

  public joinRoom(roomCode: string, socketId: string, userId: string, username: string): GameRoom | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    if (room.players.length >= 2) return null;

    const alreadyIn = room.players.some(p => p.userId === userId);
    if (alreadyIn) return room;

    const guestPlayer: RoomPlayer = {
      socketId,
      userId,
      username,
      ready: false,
      characterId: null
    };

    room.players.push(guestPlayer);
    this.socketToRoom.set(socketId, roomCode);
    console.log(`Player ${username} joined room ${roomCode}`);
    return room;
  }

  public leaveRoom(socketId: string): { roomCode: string; closed: boolean } | null {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    this.socketToRoom.delete(socketId);

    if (room) {
      room.players = room.players.filter(p => p.socketId !== socketId);
      
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
        console.log(`Room closed (empty): ${roomCode}`);
        return { roomCode, closed: true };
      }

      if (room.hostSocketId === socketId) {
        room.hostSocketId = room.players[0].socketId;
        console.log(`Host migrated in room ${roomCode} to socket ${room.hostSocketId}`);
      }

      return { roomCode, closed: false };
    }

    return null;
  }

  public getPlayerRoom(socketId: string): GameRoom | null {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode) || null;
  }

  public getOpponentSocketId(socketId: string): string | null {
    const room = this.getPlayerRoom(socketId);
    if (!room) return null;
    const opponent = room.players.find(p => p.socketId !== socketId);
    return opponent ? opponent.socketId : null;
  }

  public getRoom(roomCode: string): GameRoom | null {
    return this.rooms.get(roomCode) || null;
  }
}

export const roomManager = new RoomManager();
