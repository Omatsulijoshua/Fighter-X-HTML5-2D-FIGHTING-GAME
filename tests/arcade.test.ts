import { expect, test, describe } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';

describe('Arcade Mode Progression Tests', () => {
  test('should bypass stage selection and set up Match 1 upon character lock', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.isArcadeMode = true;
    context.arcadeStage = 1;
    context.p1CursorIndex = 0; // KAIRO

    context.p1InputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.p1SelectedChar).toBe('KAIRO');
    expect(context.p2SelectedChar).toBe('KAIRO');
    expect(context.selectedStageId).toBe('SHADOW_SANCTUARY');
    expect(context.aiDifficulty).toBe('EASY');
    expect(context.matchState).toBe('COUNTDOWN');
  });

  test('should trigger arcade cleared state when P1 wins 2 rounds', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.isArcadeMode = true;
    context.arcadeStage = 1;
    context.matchState = 'ROUND_END';
    (loop as any).roundEndDelay = 1;

    context.p1RoundWins = 2;

    (loop as any).tick();

    expect(context.arcadeCleared).toBe(true);
    expect(context.arcadeGameOver).toBe(false);
  });

  test('should advance stage and reset properties upon advance button input', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.isArcadeMode = true;
    context.arcadeStage = 1;
    context.arcadeCleared = true;
    context.p1SelectedChar = 'NYX';

    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.arcadeStage).toBe(2);
    expect(context.p2SelectedChar).toBe('NYX');
    expect(context.selectedStageId).toBe('CYBER_GRID');
    expect(context.aiDifficulty).toBe('NORMAL');
    expect(context.arcadeCleared).toBe(false);
    expect(context.matchState).toBe('COUNTDOWN');
  });

  test('should trigger game over on CPU victory and reset/retry match', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.isArcadeMode = true;
    context.arcadeStage = 2;
    context.matchState = 'ROUND_END';
    (loop as any).roundEndDelay = 1;
    context.p2RoundWins = 2;

    (loop as any).tick();

    expect(context.arcadeGameOver).toBe(true);

    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.arcadeGameOver).toBe(false);
    expect(context.arcadeStage).toBe(2);
    expect(context.p1RoundWins).toBe(0);
    expect(context.p2RoundWins).toBe(0);
    expect(context.matchState).toBe('COUNTDOWN');
  });
});
