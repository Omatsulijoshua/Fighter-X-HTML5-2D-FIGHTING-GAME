import { expect, test, describe } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';
import { InputManager, PLAYER_1_DEFAULT_BINDINGS } from '../apps/client/src/game/input/input-manager.js';

describe('In-game Delay-Based Synchronization Tests', () => {
  test('should toggle isRemote status and evaluate hasInputForTick properly', () => {
    const input = new InputManager(PLAYER_1_DEFAULT_BINDINGS);

    expect(input.isRemote).toBe(false);
    expect(input.hasInputForTick(10)).toBe(true);

    input.isRemote = true;
    expect(input.hasInputForTick(10)).toBe(false);

    input.injectNetworkInput(10, { left: true });
    expect(input.hasInputForTick(10)).toBe(true);
  });

  test('should freeze loop tick if remote input is missing and advance upon injection', () => {
    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    context.matchState = 'FIGHTING';
    context.isMultiplayer = true;
    context.multiplayerSlot = 'p1';

    context.inputP1.isRemote = false;
    context.inputP2.isRemote = true;

    context.tickCount = 5;

    (loop as any).tick();

    expect(context.tickCount).toBe(5);

    context.inputP2.injectNetworkInput(5, { left: false, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false });

    (loop as any).tick();

    expect(context.tickCount).toBe(6);
  });
});
