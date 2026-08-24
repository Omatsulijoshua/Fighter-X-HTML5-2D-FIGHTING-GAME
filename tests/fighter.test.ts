import { expect, test, describe } from 'vitest';
import { Fighter } from '../apps/client/src/game/fighters/fighter.js';
import { FIGHTER_TEMPLATES } from '../apps/client/src/game/fighters/fighter-definitions.js';

describe('Fighter Class Tests', () => {
  test('should initialize with correct default values', () => {
    const fighter = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: false,
    });
    expect(fighter.health).toBe(90); // Kairo health template is 90
    expect(fighter.state).toBe('IDLE');
    expect(fighter.height).toBe(250);
  });

  test('should adjust height and position when crouching', () => {
    const fighter = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: false,
    });
    
    fighter.isGrounded = true;
    const initialY = fighter.position.y;
    
    // Crouch input active
    fighter.update({ down: true }, { x: 500, y: 370 });
    
    expect(fighter.height).toBe(150);
    expect(fighter.position.y).toBe(initialY + 100);
    expect(fighter.state).toBe('CROUCHING');

    // Crouch input inactive
    fighter.update({ down: false }, { x: 500, y: 370 });

    expect(fighter.height).toBe(250);
    expect(fighter.position.y).toBe(initialY);
    expect(fighter.state).toBe('IDLE');
  });

  test('should take full damage if not blocking', () => {
    const fighter = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: false,
    });
    
    // Attacked by opponent facing left (attack coming from right)
    fighter.takeDamage(10, 5, 20, true);
    
    expect(fighter.health).toBe(80); // 90 - 10 = 80
    expect(fighter.state).toBe('HIT');
    expect(fighter.stateTimer).toBe(20);
    expect(fighter.hitFlash).toBe(true);
  });

  test('should take chip damage if blocking and facing opponent', () => {
    const fighter = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: false, // Facing right (towards opponent)
    });
    
    fighter.state = 'BLOCKING';
    // Attacked by opponent facing left (attack from right)
    fighter.takeDamage(10, 5, 20, true);
    
    expect(fighter.health).toBe(89); // 90 - 1 chip damage = 89
    expect(fighter.state).toBe('STUNNED');
    expect(fighter.stateTimer).toBe(10); // 50% stun reduction
  });

  test('should take full damage if blocking but facing away from opponent', () => {
    const fighter = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: true, // Facing left (away from opponent on the right)
    });
    
    fighter.state = 'BLOCKING';
    // Attacked by opponent facing left (attack from right)
    fighter.takeDamage(10, 5, 20, true);
    
    expect(fighter.health).toBe(80); // Full damage
    expect(fighter.state).toBe('HIT');
  });

  test('should transition to DEAD when health is 0', () => {
    const fighter = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: false,
    });
    
    fighter.takeDamage(120, 5, 20, true);
    
    expect(fighter.health).toBe(0);
    expect(fighter.state).toBe('DEAD');
  });
});
