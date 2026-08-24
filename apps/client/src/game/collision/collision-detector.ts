import { Vector2D } from '@shadow-clash/shared';

export interface CollisionBox {
  position: Vector2D;
  width: number;
  height: number;
}

export class CollisionDetector {
  public static checkAABBOverlap(boxA: CollisionBox, boxB: CollisionBox): boolean {
    return (
      boxA.position.x < boxB.position.x + boxB.width &&
      boxA.position.x + boxA.width > boxB.position.x &&
      boxA.position.y < boxB.position.y + boxB.height &&
      boxA.position.y + boxA.height > boxB.position.y
    );
  }

  public static resolveBodyCollisions(
    p1: CollisionBox & { velocity: Vector2D },
    p2: CollisionBox & { velocity: Vector2D },
    stageWidth: number
  ) {
    if (!this.checkAABBOverlap(p1, p2)) return;

    // Calculate horizontal overlap
    const overlapX = Math.min(p1.position.x + p1.width, p2.position.x + p2.width) - Math.max(p1.position.x, p2.position.x);
    if (overlapX <= 0) return;

    // Determine who is on the left and who is on the right
    const p1IsLeft = p1.position.x + p1.width / 2 < p2.position.x + p2.width / 2;
    const pushAmount = overlapX / 2;

    const p1AtLeftWall = p1.position.x <= 0;
    const p2AtRightWall = p2.position.x + p2.width >= stageWidth;
    const p1AtRightWall = p1.position.x + p1.width >= stageWidth;
    const p2AtLeftWall = p2.position.x <= 0;

    if (p1IsLeft) {
      if (p1AtLeftWall && !p2AtRightWall) {
        p2.position.x += overlapX;
      } else if (p2AtRightWall && !p1AtLeftWall) {
        p1.position.x -= overlapX;
      } else {
        p1.position.x -= pushAmount;
        p2.position.x += pushAmount;
      }
    } else {
      if (p1AtRightWall && !p2AtLeftWall) {
        p2.position.x -= overlapX;
      } else if (p2AtLeftWall && !p1AtRightWall) {
        p1.position.x += overlapX;
      } else {
        p1.position.x += pushAmount;
        p2.position.x -= pushAmount;
      }
    }

    // Keep positions inside stage borders after displacement
    if (p1.position.x < 0) p1.position.x = 0;
    if (p1.position.x > stageWidth - p1.width) p1.position.x = stageWidth - p1.width;
    if (p2.position.x < 0) p2.position.x = 0;
    if (p2.position.x > stageWidth - p2.width) p2.position.x = stageWidth - p2.width;
  }
}
