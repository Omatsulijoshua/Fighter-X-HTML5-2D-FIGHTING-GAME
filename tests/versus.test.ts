import { expect, test, describe } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';

describe('Local Versus Mode Tests', () => {
  test('should cycle menu choices and configure Versus Mode settings', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    expect(context.matchState).toBe('MAIN_MENU');
    expect(context.menuIndex).toBe(0);

    // Mock P1 pressing S (Down)
    context.menuInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: true, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.menuIndex).toBe(1);
    expect(context.menuInputCooldown).toBe(12);

    // Mock P1 pressing J (Select)
    context.menuInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.isSinglePlayer).toBe(false);
    expect(context.isArcadeMode).toBe(false);
    expect(context.matchState).toBe('CHARACTER_SELECT');
  });

  test('should transition to STAGE_SELECT and initialize in local 2-Player Versus', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    // Enter Versus Mode character select
    context.matchState = 'CHARACTER_SELECT';
    context.isSinglePlayer = false;
    context.isArcadeMode = false;

    // Confirm Player 1 selection
    context.p1CursorIndex = 0; // KAIRO
    context.p1InputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);
    (loop as any).tick();

    expect(context.p1SelectedChar).toBe('KAIRO');
    expect(context.p2SelectedChar).toBeNull();
    expect(context.matchState).toBe('CHARACTER_SELECT');

    // Confirm Player 2 selection
    context.p2CursorIndex = 2; // NYX
    context.p2InputCooldown = 0;
    context.inputP2.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);
    (loop as any).tick();

    expect(context.p2SelectedChar).toBe('NYX');
    expect(context.matchState).toBe('STAGE_SELECT');

    // Confirm Stage Select
    context.stageCursorIndex = 1; // CYBER_GRID
    context.stageInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);
    (loop as any).tick();

    expect(context.selectedStageId).toBe('CYBER_GRID');
    expect(context.matchState).toBe('COUNTDOWN');
    expect(context.p1.name).toBe('KAIRO');
    expect(context.p2.name).toBe('NYX');
  });
});
