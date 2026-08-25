import { expect, test, describe } from 'vitest';
import { RoomManager } from '../apps/server/src/rooms/room-manager.js';

describe('Multiplayer Room Coordinator Tests', () => {
  test('should create rooms and register host details', () => {
    const manager = new RoomManager();

    const room = manager.createRoom('host_s', 'u1', 'HostUser');

    expect(room).not.toBeNull();
    expect(room.roomCode).toHaveLength(6);
    expect(room.hostSocketId).toBe('host_s');
    expect(room.players).toHaveLength(1);
    expect(room.players[0].userId).toBe('u1');
    expect(room.matchState).toBe('CHARACTER_SELECT');
  });

  test('should append guest players to rooms and respect limits', () => {
    const manager = new RoomManager();
    const room = manager.createRoom('host_s', 'u1', 'HostUser');
    const code = room.roomCode;

    const joinedRoom = manager.joinRoom(code, 'guest_s', 'u2', 'GuestUser');
    expect(joinedRoom).not.toBeNull();
    expect(joinedRoom!.players).toHaveLength(2);
    expect(joinedRoom!.players[1].userId).toBe('u2');

    const fullRoom = manager.joinRoom(code, 'third_s', 'u3', 'ThirdUser');
    expect(fullRoom).toBeNull();
  });

  test('should locate opponents and migrate host on disconnects', () => {
    const manager = new RoomManager();
    const room = manager.createRoom('host_s', 'u1', 'HostUser');
    const code = room.roomCode;

    manager.joinRoom(code, 'guest_s', 'u2', 'GuestUser');

    const opp = manager.getOpponentSocketId('host_s');
    expect(opp).toBe('guest_s');

    const oppGuest = manager.getOpponentSocketId('guest_s');
    expect(oppGuest).toBe('host_s');

    const leaveDetails = manager.leaveRoom('host_s');
    expect(leaveDetails).not.toBeNull();
    expect(leaveDetails!.closed).toBe(false);

    const updatedRoom = manager.getRoom(code);
    expect(updatedRoom).not.toBeNull();
    expect(updatedRoom!.hostSocketId).toBe('guest_s');
    expect(updatedRoom!.players).toHaveLength(1);

    const closeDetails = manager.leaveRoom('guest_s');
    expect(closeDetails!.closed).toBe(true);
    expect(manager.getRoom(code)).toBeNull();
  });
});
