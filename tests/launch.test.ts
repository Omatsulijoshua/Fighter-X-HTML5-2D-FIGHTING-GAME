import { expect, test, describe } from 'vitest';
import { GAME_WIDTH, GAME_HEIGHT, SOCKET_EVENTS } from '@shadow-clash/shared';
import { FIGHTER_TEMPLATES } from '../apps/client/src/game/fighters/fighter-definitions.js';
import { STAGE_TEMPLATES } from '../apps/client/src/game/stages/stage-definitions.js';

describe('Final Launch & Build Configurations Tests', () => {
  test('should verify shared game configurations', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(SOCKET_EVENTS.ROOM_JOINED).toBe('room-joined');
  });

  test('should verify client fighter definitions and stats integrity', () => {
    expect(Object.keys(FIGHTER_TEMPLATES)).toContain('KAIRO');
    expect(FIGHTER_TEMPLATES.BRUTUS.maxHealth).toBe(120);
    expect(FIGHTER_TEMPLATES.NYX.speed).toBe(6.5);
  });

  test('should verify client stage templates definitions', () => {
    expect(Object.keys(STAGE_TEMPLATES)).toContain('SHADOW_SANCTUARY');
    expect(STAGE_TEMPLATES.CYBER_GRID.gridColor).toBe('#00b3ff');
  });
});
