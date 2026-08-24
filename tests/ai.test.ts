import { expect, test, describe } from 'vitest';
import { Fighter } from '../apps/client/src/game/fighters/fighter.js';
import { FIGHTER_TEMPLATES } from '../apps/client/src/game/fighters/fighter-definitions.js';
import { AIOpponent } from '../apps/client/src/game/engine/ai-opponent.js';

describe('AI Opponent System Tests', () => {
  test('AI should only update decisions at specified intervals based on difficulty', () => {
    const ai = new Fighter(FIGHTER_TEMPLATES.BRUTUS, { id: 'p2', x: 500, facingLeft: true });
    const player = new Fighter(FIGHTER_TEMPLATES.KAIRO, { id: 'p1', x: 200, facingLeft: false });
    const opponent = new AIOpponent();

    // EASY decision interval is 30 ticks
    const input1 = opponent.update(ai, player, 'EASY', 0, []);
    const input2 = opponent.update(ai, player, 'EASY', 15, []);
    
    // tick 15 is not divisible by 30, so it returns same object/inputs as tick 0
    expect(input2).toEqual(input1);

    // EXPERT decision interval is 2 ticks
    const inputExpert1 = opponent.update(ai, player, 'EXPERT', 0, []);
    const inputExpert2 = opponent.update(ai, player, 'EXPERT', 2, []);
    expect(inputExpert2).toBeDefined();
  });

  test('EXPERT AI should block active player attacks with high probability', () => {
    const ai = new Fighter(FIGHTER_TEMPLATES.BRUTUS, { id: 'p2', x: 250, facingLeft: true });
    const player = new Fighter(FIGHTER_TEMPLATES.KAIRO, { id: 'p1', x: 200, facingLeft: false });
    const opponent = new AIOpponent();

    player.state = 'ATTACKING';
    player.attackPhase = 'ACTIVE';

    let blockCount = 0;
    for (let i = 0; i < 100; i++) {
      const inputs = opponent.update(ai, player, 'EXPERT', i * 2, []);
      if (inputs.block) blockCount++;
    }

    expect(blockCount).toBeGreaterThan(80);
  });

  test('EASY AI should block active player attacks with low probability', () => {
    const ai = new Fighter(FIGHTER_TEMPLATES.BRUTUS, { id: 'p2', x: 250, facingLeft: true });
    const player = new Fighter(FIGHTER_TEMPLATES.KAIRO, { id: 'p1', x: 200, facingLeft: false });
    const opponent = new AIOpponent();

    player.state = 'ATTACKING';
    player.attackPhase = 'ACTIVE';

    let blockCount = 0;
    for (let i = 0; i < 100; i++) {
      const inputs = opponent.update(ai, player, 'EASY', i * 30, []);
      if (inputs.block) blockCount++;
    }

    expect(blockCount).toBeLessThan(35);
  });
});
