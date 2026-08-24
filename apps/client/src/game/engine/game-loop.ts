import { GameContext, STAGE_WIDTH, GROUND_Y } from './game-context.js';
import { PhysicsEngine } from '../physics/physics-engine.js';
import { CollisionDetector } from '../collision/collision-detector.js';
import { Renderer } from './renderer.js';

export class GameLoop {
  private context: GameContext;
  private ctx: CanvasRenderingContext2D;
  private running: boolean = false;

  // Fixed timestep configuration: 60 logic ticks per second (~16.67ms)
  private readonly TICK_MS = 1000 / 60;
  private accumulator = 0;
  private lastTime = 0;

  // FPS metrics
  private fps = 0;
  private frameCount = 0;
  private fpsLastTime = 0;

  constructor(ctx: CanvasRenderingContext2D, context: GameContext) {
    this.ctx = ctx;
    this.context = context;
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.fpsLastTime = this.lastTime;
    requestAnimationFrame((t) => this.loop(t));
  }

  public stop() {
    this.running = false;
  }

  private loop(timestamp: number) {
    if (!this.running) return;

    let elapsed = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap elapsed time to prevent spiral of death
    if (elapsed > 250) {
      elapsed = 250;
    }

    this.accumulator += elapsed;

    // Run simulation ticks
    while (this.accumulator >= this.TICK_MS) {
      this.tick();
      this.accumulator -= this.TICK_MS;
    }

    // Calculate FPS
    this.frameCount++;
    if (timestamp - this.fpsLastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.fpsLastTime));
      this.frameCount = 0;
      this.fpsLastTime = timestamp;
    }

    // Render frame
    Renderer.draw(this.ctx, this.context, this.fps);

    requestAnimationFrame((t) => this.loop(t));
  }

  private tick() {
    if (this.context.isPaused) return;

    this.context.tickCount++;

    const p1 = this.context.p1;
    const p2 = this.context.p2;

    // 1. Process P1 Inputs
    if (this.context.inputP1.isPressed('left')) {
      p1.velocity.x = -p1.speed;
      p1.state = 'WALKING';
    } else if (this.context.inputP1.isPressed('right')) {
      p1.velocity.x = p1.speed;
      p1.state = 'WALKING';
    } else {
      p1.velocity.x = 0;
      p1.state = 'IDLE';
    }

    if (this.context.inputP1.isPressed('up') && p1.isGrounded) {
      p1.velocity.y = -p1.jumpForce;
      p1.isGrounded = false;
      p1.state = 'JUMPING';
    }

    // 2. Process P2 Inputs
    if (this.context.inputP2.isPressed('left')) {
      p2.velocity.x = -p2.speed;
      p2.state = 'WALKING';
    } else if (this.context.inputP2.isPressed('right')) {
      p2.velocity.x = p2.speed;
      p2.state = 'WALKING';
    } else {
      p2.velocity.x = 0;
      p2.state = 'IDLE';
    }

    if (this.context.inputP2.isPressed('up') && p2.isGrounded) {
      p2.velocity.y = -p2.jumpForce;
      p2.isGrounded = false;
      p2.state = 'JUMPING';
    }

    // 3. Apply physics (Gravity and velocity update)
    PhysicsEngine.applyGravity(p1);
    PhysicsEngine.applyGravity(p2);

    PhysicsEngine.updatePosition(p1);
    PhysicsEngine.updatePosition(p2);

    // 4. Stage wall and floor constraints
    PhysicsEngine.constrainToStage(p1, STAGE_WIDTH, 720, GROUND_Y, p1.width, p1.height);
    PhysicsEngine.constrainToStage(p2, STAGE_WIDTH, 720, GROUND_Y, p2.width, p2.height);

    // 5. Resolve body overlapping (push players apart)
    CollisionDetector.resolveBodyCollisions(p1, p2, STAGE_WIDTH);

    // 6. Set Facing Direction (Fighters face each other)
    if (p1.position.x + p1.width / 2 < p2.position.x + p2.width / 2) {
      p1.facingLeft = false;
      p2.facingLeft = true;
    } else {
      p1.facingLeft = true;
      p2.facingLeft = false;
    }

    // 7. Camera tracking update
    this.context.camera.update(p1.position, p2.position, STAGE_WIDTH);
  }
}
