import { expect, test, describe } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';

describe('Character Selection Screen Tests', () => {
  test('should cycle cursor index and wrap correctly', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    expect(context.matchState).toBe('CHARACTER_SELECT');
    expect(context.p1CursorIndex).toBe(0);

    // Mock P1 moving cursor right
    context.p1InputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: true, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.p1CursorIndex).toBe(1);
    expect(context.p1InputCooldown).toBe(12);

    // Mock P1 moving cursor left (back to 0)
    context.p1InputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: true, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();
    expect(context.p1CursorIndex).toBe(0);

    // Mock P1 moving cursor left again (wrap to index 3)
    context.p1InputCooldown = 0;
    (loop as any).tick();
    expect(context.p1CursorIndex).toBe(3);
  });

  test('should lock selection and trigger CPU auto-selection in single player', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);
    context.isSinglePlayer = true;
    context.p1CursorIndex = 2; // NYX

    context.p1InputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.p1SelectedChar).toBe('NYX');
    expect(context.p2SelectedChar).not.toBeNull();
    expect(context.matchState).toBe('COUNTDOWN');
    expect(context.p1.name).toBe('NYX');
  });
});
