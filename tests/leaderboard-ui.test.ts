import { expect, test, describe, vi } from 'vitest';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';
import { GameLoop } from '../apps/client/src/game/engine/game-loop.js';

describe('Visual Leaderboard Interface Navigation Tests', () => {
  test('should navigate to Leaderboards state and navigate back on input key', () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { rank: 1, username: 'BrutusMaximus', rating: 1500, wins: 20, losses: 5, favoriteFighter: 'BRUTUS' }
        ])
      })
    );

    const context = new GameContext();
    const loop = new GameLoop({} as any, context);

    expect(context.matchState).toBe('MAIN_MENU');

    context.menuIndex = 3;
    context.menuInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.matchState).toBe('LEADERBOARD');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3005/api/leaderboard');

    context.menuInputCooldown = 0;
    context.inputP1.getInputs = () => ({
      inputs: { left: false, right: false, up: false, down: false, lightAttack: true, heavyAttack: false, specialAttack: false, block: false, grab: false }
    } as any);

    (loop as any).tick();

    expect(context.matchState).toBe('MAIN_MENU');
  });
});
