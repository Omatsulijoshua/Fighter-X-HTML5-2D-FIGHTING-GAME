import { expect, test } from 'vitest';
import { GAME_WIDTH, GAME_HEIGHT, SOCKET_EVENTS } from '../packages/shared/src/index.js';

test('shared constants load correctly', () => {
  expect(GAME_WIDTH).toBe(1280);
  expect(GAME_HEIGHT).toBe(720);
});

test('shared socket events are populated', () => {
  expect(SOCKET_EVENTS.PING).toBe('ping');
  expect(SOCKET_EVENTS.PONG).toBe('pong');
});
