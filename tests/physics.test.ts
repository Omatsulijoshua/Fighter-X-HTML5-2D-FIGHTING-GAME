import { expect, test, describe } from 'vitest';
import { PhysicsEngine, PhysicsEntity } from '../apps/client/src/game/physics/physics-engine.js';

describe('Physics Engine Tests', () => {
  test('gravity should not apply when entity is grounded', () => {
    const entity: PhysicsEntity = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      weight: 1.0,
      speed: 5.0,
      jumpForce: 10.0,
      isGrounded: true,
    };
    PhysicsEngine.applyGravity(entity);
    expect(entity.velocity.y).toBe(0);
  });

  test('gravity should apply when entity is in the air', () => {
    const entity: PhysicsEntity = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      weight: 1.0,
      speed: 5.0,
      jumpForce: 10.0,
      isGrounded: false,
    };
    PhysicsEngine.applyGravity(entity);
    expect(entity.velocity.y).toBeGreaterThan(0);
  });

  test('friction should slow down horizontal speed', () => {
    const entity: PhysicsEntity = {
      position: { x: 0, y: 0 },
      velocity: { x: 10, y: 0 },
      weight: 1.0,
      speed: 5.0,
      jumpForce: 10.0,
      isGrounded: true,
    };
    PhysicsEngine.applyFriction(entity);
    expect(entity.velocity.x).toBeLessThan(10);
    expect(entity.velocity.x).toBeGreaterThan(0);
  });

  test('constrainToStage should clamp entity y and set grounded', () => {
    const entity: PhysicsEntity = {
      position: { x: 0, y: 650 },
      velocity: { x: 0, y: 10 },
      weight: 1.0,
      speed: 5.0,
      jumpForce: 10.0,
      isGrounded: false,
    };
    const groundY = 620;
    const height = 250;
    PhysicsEngine.constrainToStage(entity, 2000, 720, groundY, 100, height);
    expect(entity.position.y).toBe(groundY - height);
    expect(entity.velocity.y).toBe(0);
    expect(entity.isGrounded).toBe(true);
  });
});
