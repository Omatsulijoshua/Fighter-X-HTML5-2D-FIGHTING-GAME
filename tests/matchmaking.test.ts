import { expect, test, describe, vi } from 'vitest';
import { Matchmaker } from '../apps/server/src/matchmaking/matchmaker.js';

describe('Matchmaking API Service Tests', () => {
  test('should join players to matchmaking queue and handle duplicates', () => {
    const matchmaker = new Matchmaker();

    expect(matchmaker.getQueueSize()).toBe(0);

    const player1 = { userId: 'u1', username: 'KairoUser', socketId: 's1', queuedAt: Date.now() };
    const success = matchmaker.joinQueue(player1);

    expect(success).toBe(true);
    expect(matchmaker.getQueueSize()).toBe(1);

    const dupSuccess = matchmaker.joinQueue(player1);
    expect(dupSuccess).toBe(false);
    expect(matchmaker.getQueueSize()).toBe(1);
  });

  test('should purge players when leaving queue', () => {
    const matchmaker = new Matchmaker();
    const player1 = { userId: 'u1', username: 'KairoUser', socketId: 's1', queuedAt: Date.now() };
    const player2 = { userId: 'u2', username: 'NyxUser', socketId: 's2', queuedAt: Date.now() };

    matchmaker.joinQueue(player1);
    matchmaker.joinQueue(player2);

    expect(matchmaker.getQueueSize()).toBe(2);

    const left = matchmaker.leaveQueue('u1');
    expect(left).toBe(true);
    expect(matchmaker.getQueueSize()).toBe(1);

    const leftSocket = matchmaker.leaveQueue('s2');
    expect(leftSocket).toBe(true);
    expect(matchmaker.getQueueSize()).toBe(0);
  });

  test('should match players in pairs and emit roomCode events', () => {
    const matchmaker = new Matchmaker();
    const player1 = { userId: 'u1', username: 'KairoUser', socketId: 's1', queuedAt: Date.now() };
    const player2 = { userId: 'u2', username: 'NyxUser', socketId: 's2', queuedAt: Date.now() };
    const player3 = { userId: 'u3', username: 'BrutusUser', socketId: 's3', queuedAt: Date.now() };

    matchmaker.joinQueue(player1);
    matchmaker.joinQueue(player2);
    matchmaker.joinQueue(player3);

    const mockIo = {
      to: vi.fn().mockImplementation(() => ({
        emit: vi.fn()
      }))
    } as any;

    matchmaker.tickMatchmaking(mockIo);

    expect(matchmaker.getQueueSize()).toBe(1);
    expect(matchmaker.getQueue()[0].userId).toBe('u3');

    expect(mockIo.to).toHaveBeenCalledWith('s1');
    expect(mockIo.to).toHaveBeenCalledWith('s2');
    expect(mockIo.to).not.toHaveBeenCalledWith('s3');
  });
});
