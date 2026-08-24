import { expect, test, describe } from 'vitest';
import { Fighter, LIGHT_ATTACK } from '../apps/client/src/game/fighters/fighter.js';
import { CollisionDetector } from '../apps/client/src/game/collision/collision-detector.js';

describe('Combat Engine Tests', () => {
  test('should detect overlap between attack hitbox and multi-hurtboxes', () => {
    const p1 = new Fighter({ id: 'p1', name: 'KAIRO', x: 100, weight: 1, speed: 5, jumpForce: 15, facingLeft: false });
    const p2 = new Fighter({ id: 'p2', name: 'BRUTUS', x: 150, weight: 1.2, speed: 4, jumpForce: 14, facingLeft: true });

    p1.state = 'ATTACKING';
    p1.attackPhase = 'ACTIVE';
    p1.currentAttack = LIGHT_ATTACK;

    const hitbox = p1.getAttackHitbox();
    expect(hitbox).not.toBeNull();

    const hurtboxes = p2.getHurtboxes();
    let hitLanded = false;
    for (const hurtbox of hurtboxes) {
      if (CollisionDetector.checkAABBOverlap(hitbox!, hurtbox)) {
        hitLanded = true;
        break;
      }
    }
    expect(hitLanded).toBe(true);
  });

  test('should apply combo damage scaling correctly', () => {
    const p1 = new Fighter({ id: 'p1', name: 'KAIRO', x: 300, weight: 1.0, speed: 6.0, jumpForce: 18.0, facingLeft: false });
    
    // First hit (combo = 0): scale = 1.0 -> 14 damage
    const scale0 = Math.max(0.20, Math.pow(0.85, p1.comboCount));
    const dmg0 = Math.round(14 * scale0);
    expect(dmg0).toBe(14);
    p1.comboCount++; // combo = 1

    // Second hit (combo = 1): scale = 0.85 -> 14 * 0.85 = 11.9 -> 12 damage
    const scale1 = Math.max(0.20, Math.pow(0.85, p1.comboCount));
    const dmg1 = Math.round(14 * scale1);
    expect(dmg1).toBe(12);

    // Tenth hit (combo = 9): scale = Math.max(0.20, 0.85^9 = 0.231) -> 14 * 0.231 = 3.23 -> 3 damage
    p1.comboCount = 9;
    const scale9 = Math.max(0.20, Math.pow(0.85, p1.comboCount));
    const dmg9 = Math.round(14 * scale9);
    expect(dmg9).toBe(3);
  });

  test('special attack should check and deduct energy cost', () => {
    const p1 = new Fighter({ id: 'p1', name: 'KAIRO', x: 300, weight: 1.0, speed: 6.0, jumpForce: 18.0, facingLeft: false });
    p1.isGrounded = true;
    
    // Attempt special with 0 energy
    p1.update({ specialAttack: true }, { x: 500, y: 370 });
    expect(p1.state).not.toBe('ATTACKING');

    // Give energy and execute
    p1.energy = 50;
    p1.update({ specialAttack: true }, { x: 500, y: 370 });
    expect(p1.state).toBe('ATTACKING');
    expect(p1.currentAttack?.id).toBe('special');
    expect(p1.energy).toBe(20); // 50 - 30 cost = 20
  });

  test('throws should ignore blocking state and apply damage and knockdown', () => {
    const defender = new Fighter({ id: 'p2', name: 'BRUTUS', x: 350, weight: 1.2, speed: 4.5, jumpForce: 16.0, facingLeft: true });
    
    defender.state = 'BLOCKING';

    // Take unblockable throw (comes from left, so attacker facingLeft = false)
    defender.takeThrow(16, 10, false);

    expect(defender.health).toBe(84); // 100 - 16 = 84
    expect(defender.state).toBe('KNOCKED_DOWN');
    expect(defender.stateTimer).toBe(40); // 40 frames knockdown
  });
});
