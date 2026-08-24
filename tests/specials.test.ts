import { expect, test, describe } from 'vitest';
import { Fighter } from '../apps/client/src/game/fighters/fighter.js';
import { FIGHTER_TEMPLATES } from '../apps/client/src/game/fighters/fighter-definitions.js';

describe('Special Attack Tests', () => {
  test('Kairo special should set high active horizontal velocity', () => {
    const kairo = new Fighter(FIGHTER_TEMPLATES.KAIRO, { id: 'p1', x: 300, facingLeft: false });
    kairo.isGrounded = true;
    kairo.energy = 50;

    kairo.update({ specialAttack: true }, { x: 500, y: 370 });
    expect(kairo.state).toBe('ATTACKING');
    
    // Progress through 8 startup frames to active phase
    for (let i = 0; i < 9; i++) {
      kairo.update({}, { x: 500, y: 370 });
    }

    expect(kairo.attackPhase).toBe('ACTIVE');
    expect(kairo.velocity.x).toBeGreaterThan(kairo.speed);
  });

  test('Nyx special should instantly teleport behind opponent', () => {
    const nyx = new Fighter(FIGHTER_TEMPLATES.NYX, { id: 'p1', x: 300, facingLeft: false });
    nyx.isGrounded = true;
    nyx.energy = 50;

    const opponentPos = { x: 500, y: 370 };
    nyx.update({ specialAttack: true }, opponentPos);

    expect(nyx.state).toBe('ATTACKING');
    expect(nyx.position.x).toBe(590);
    expect(nyx.facingLeft).toBe(true);
  });

  test('Brutus special should hit within a larger range', () => {
    const brutus = new Fighter(FIGHTER_TEMPLATES.BRUTUS, { id: 'p1', x: 300, facingLeft: false });
    brutus.isGrounded = true;
    brutus.energy = 50;

    brutus.update({ specialAttack: true }, { x: 500, y: 370 });
    
    for (let i = 0; i < 16; i++) {
      brutus.update({}, { x: 500, y: 370 });
    }

    expect(brutus.attackPhase).toBe('ACTIVE');
    const hitbox = brutus.getAttackHitbox();
    expect(hitbox).not.toBeNull();
    expect(hitbox!.width).toBe(200);
  });
});
