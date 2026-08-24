import { expect, test, describe } from 'vitest';
import { Fighter } from '../apps/client/src/game/fighters/fighter.js';
import { FIGHTER_TEMPLATES } from '../apps/client/src/game/fighters/fighter-definitions.js';
import { GameContext } from '../apps/client/src/game/engine/game-context.js';

describe('Projectile Tests', () => {
  test('Razor Energy Blade should spawn a projectile inside context', () => {
    const context = new GameContext();
    context.p1 = new Fighter(FIGHTER_TEMPLATES.RAZOR, { id: 'p1', x: 300, facingLeft: false });
    
    context.p1.onSpawnProjectile = (proj) => {
      context.projectiles.push({
        position: { x: proj.x, y: proj.y },
        velocity: { x: proj.vx, y: 0 },
        width: 40,
        height: 20,
        damage: proj.damage,
        ownerId: proj.ownerId,
        active: true
      });
    };

    context.p1.isGrounded = true;
    context.p1.energy = 50;

    // Trigger special attack
    context.p1.update({ specialAttack: true }, context.p2.position);

    // Razor special has 12 startup frames. It fires on tick 13.
    for (let i = 0; i < 13; i++) {
      context.p1.update({}, context.p2.position);
    }

    expect(context.projectiles.length).toBe(1);
    expect(context.projectiles[0].ownerId).toBe('p1');
    expect(context.projectiles[0].damage).toBe(20);
    expect(context.projectiles[0].velocity.x).toBe(12);
  });
});
