import { expect, test, describe, vi } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';

describe('Online Character Selection Screen Tests', () => {
  test('should toggle Online Matchmaking mode and emit join queue request', () => {
    const mockSocket = {
      emit: vi.fn(),
      on: vi.fn()
    };
    const context = new GameContext(mockSocket);
    const loop = new GameLoop({} as any, context);

    expect(context.matchState).toBe('MAIN_MENU');

    context.menuIndex = 2;
    context.menuInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.isMultiplayer).toBe(true);
    expect(context.matchState).toBe('WAITING');
    expect(mockSocket.emit).toHaveBeenCalledWith('matchmaking-join', expect.any(Object));
  });

  test('should handle matchmaking match, room join, and cursor sync', () => {
    const mockSocket = {
      emit: vi.fn(),
      on: vi.fn()
    };
    const context = new GameContext(mockSocket);
    const loop = new GameLoop({} as any, context);

    context.isMultiplayer = true;
    context.multiplayerSlot = 'p1';
    context.matchState = 'CHARACTER_SELECT';

    context.p1CursorIndex = 0;
    context.p1InputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: true, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.p1CursorIndex).toBe(1);
    expect(mockSocket.emit).toHaveBeenCalledWith('character-cursor-move', { cursorIndex: 1 });
  });
});
