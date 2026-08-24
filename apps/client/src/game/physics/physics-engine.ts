import { Vector2D } from '@shadow-clash/shared';

export interface PhysicsEntity {
  position: Vector2D;
  velocity: Vector2D;
  weight: number;
  speed: number;
  jumpForce: number;
  isGrounded: boolean;
}

export class PhysicsEngine {
  public static GRAVITY = 0.8;
  public static TERMINAL_VELOCITY = 15;
  public static FRICTION = 0.85; // Ground friction
  public static AIR_RESISTANCE = 0.95; // Air horizontal resistance

  public static applyGravity(entity: PhysicsEntity) {
    if (!entity.isGrounded) {
      entity.velocity.y += PhysicsEngine.GRAVITY * entity.weight;
      if (entity.velocity.y > PhysicsEngine.TERMINAL_VELOCITY) {
        entity.velocity.y = PhysicsEngine.TERMINAL_VELOCITY;
      }
    }
  }

  public static applyFriction(entity: PhysicsEntity) {
    const coeff = entity.isGrounded ? PhysicsEngine.FRICTION : PhysicsEngine.AIR_RESISTANCE;
    entity.velocity.x *= coeff;
    
    // Stop small movement
    if (Math.abs(entity.velocity.x) < 0.01) {
      entity.velocity.x = 0;
    }
  }

  public static updatePosition(entity: PhysicsEntity) {
    entity.position.x += entity.velocity.x;
    entity.position.y += entity.velocity.y;
  }

  public static constrainToStage(
    entity: PhysicsEntity, 
    stageWidth: number, 
    stageHeight: number, 
    groundY: number,
    entityWidth: number,
    entityHeight: number
  ) {
    // Floor collision
    if (entity.position.y >= groundY - entityHeight) {
      entity.position.y = groundY - entityHeight;
      entity.velocity.y = 0;
      entity.isGrounded = true;
    } else {
      entity.isGrounded = false;
    }

    // Left border collision
    if (entity.position.x < 0) {
      entity.position.x = 0;
      entity.velocity.x = 0;
    }

    // Right border collision
    if (entity.position.x > stageWidth - entityWidth) {
      entity.position.x = stageWidth - entityWidth;
      entity.velocity.x = 0;
    }
  }
}
