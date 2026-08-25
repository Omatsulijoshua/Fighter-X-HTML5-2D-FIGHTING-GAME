import { expect, test, describe } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';

describe('Stage Selection Screen Tests', () => {
  test('should cycle stage cursor index and wrap correctly', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.matchState = 'STAGE_SELECT';
    expect(context.stageCursorIndex).toBe(0);

    // Mock P1 moving cursor right
    context.stageInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: true, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.stageCursorIndex).toBe(1);
    expect(context.stageInputCooldown).toBe(12);

    // Mock P1 moving cursor left (back to 0)
    context.stageInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: true, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();
    expect(context.stageCursorIndex).toBe(0);

    // Mock wrap left (goes to index 2)
    context.stageInputCooldown = 0;
    (loop as any).tick();
    expect(context.stageCursorIndex).toBe(2);
  });

  test('should confirm stage selection and launch countdown', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.matchState = 'STAGE_SELECT';
    context.stageCursorIndex = 1; // CYBER_GRID
    context.p1SelectedChar = 'KAIRO';
    context.p2SelectedChar = 'BRUTUS';

    context.stageInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.selectedStageId).toBe('CYBER_GRID');
    expect(context.matchState).toBe('COUNTDOWN');
    expect(context.p1.name).toBe('KAIRO');
  });
});
