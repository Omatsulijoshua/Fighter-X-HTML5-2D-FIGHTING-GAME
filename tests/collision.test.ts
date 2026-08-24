import { expect, test, describe } from 'vitest';
import { CollisionDetector, CollisionBox } from '../apps/client/src/game/collision/collision-detector.js';

describe('Collision Detector Tests', () => {
  test('AABB overlap should detect intersecting rectangles', () => {
    const boxA: CollisionBox = { position: { x: 10, y: 10 }, width: 50, height: 50 };
    const boxB: CollisionBox = { position: { x: 40, y: 40 }, width: 50, height: 50 };
    expect(CollisionDetector.checkAABBOverlap(boxA, boxB)).toBe(true);
  });

  test('AABB overlap should return false for disjoint rectangles', () => {
    const boxA: CollisionBox = { position: { x: 10, y: 10 }, width: 50, height: 50 };
    const boxB: CollisionBox = { position: { x: 100, y: 10 }, width: 50, height: 50 };
    expect(CollisionDetector.checkAABBOverlap(boxA, boxB)).toBe(false);
  });

  test('resolveBodyCollisions should push overlapping boxes apart', () => {
    const p1 = { position: { x: 100, y: 100 }, width: 100, height: 200, velocity: { x: 0, y: 0 } };
    const p2 = { position: { x: 150, y: 100 }, width: 100, height: 200, velocity: { x: 0, y: 0 } };

    // Overlap is 50px (from x=150 to x=200).
    // Push amount should be 25px each.
    CollisionDetector.resolveBodyCollisions(p1, p2, 2000);

    expect(p1.position.x).toBe(75);
    expect(p2.position.x).toBe(175);
  });

  test('resolveBodyCollisions should respect corners and push uncornered player fully', () => {
    const p1 = { position: { x: 0, y: 100 }, width: 100, height: 200, velocity: { x: 0, y: 0 } };
    const p2 = { position: { x: 50, y: 100 }, width: 100, height: 200, velocity: { x: 0, y: 0 } };

    // Overlap is 50px. P1 is at left wall (x=0). P1 cannot move left.
    // P2 should be pushed right by full 50px.
    CollisionDetector.resolveBodyCollisions(p1, p2, 2000);

    expect(p1.position.x).toBe(0);
    expect(p2.position.x).toBe(100);
  });
});
