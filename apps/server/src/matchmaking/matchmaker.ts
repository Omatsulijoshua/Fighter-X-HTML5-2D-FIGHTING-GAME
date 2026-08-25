import { Server } from 'socket.io';

export interface QueuedPlayer {
  userId: string;
  username: string;
  socketId: string;
  queuedAt: number;
}

export class Matchmaker {
  private queue: QueuedPlayer[] = [];

  public joinQueue(player: QueuedPlayer): boolean {
    const exists = this.queue.some(p => p.userId === player.userId);
    if (exists) return false;

    this.queue.push(player);
    console.log(`Player joined matchmaking queue: ${player.username} (${player.userId})`);
    return true;
  }

  public leaveQueue(userId: string): boolean {
    const initialLen = this.queue.length;
    
    // Support leaving by userId or socketId
    this.queue = this.queue.filter(p => p.userId !== userId && p.socketId !== userId);

    const left = this.queue.length < initialLen;
    if (left) {
      console.log(`Player left matchmaking queue: ${userId}`);
    }
    return left;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getQueue(): QueuedPlayer[] {
    return [...this.queue];
  }

  public tickMatchmaking(io: Server) {
    while (this.queue.length >= 2) {
      const p1 = this.queue.shift()!;
      const p2 = this.queue.shift()!;

      const roomCode = `ROOM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      console.log(`Matchmaking found pair: ${p1.username} vs ${p2.username}. Room: ${roomCode}`);

      io.to(p1.socketId).emit('matchmaking-matched', {
        roomCode,
        opponent: { id: p2.userId, username: p2.username }
      });

      io.to(p2.socketId).emit('matchmaking-matched', {
        roomCode,
        opponent: { id: p1.userId, username: p1.username }
      });
    }
  }
}

export const matchmaker = new Matchmaker();
