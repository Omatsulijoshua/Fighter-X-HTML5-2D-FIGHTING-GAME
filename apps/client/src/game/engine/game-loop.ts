import { GameContext, STAGE_WIDTH, GROUND_Y } from './game-context.js';
import { PhysicsEngine } from '../physics/physics-engine.js';
import { CollisionDetector } from '../collision/collision-detector.js';
import { Renderer } from './renderer.js';
import { Fighter } from '../fighters/fighter.js';

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

    if (elapsed > 250) {
      elapsed = 250;
    }

    this.accumulator += elapsed;

    while (this.accumulator >= this.TICK_MS) {
      this.tick();
      this.accumulator -= this.TICK_MS;
    }

    this.frameCount++;
    if (timestamp - this.fpsLastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.fpsLastTime));
      this.frameCount = 0;
      this.fpsLastTime = timestamp;
    }

    Renderer.draw(this.ctx, this.context, this.fps);

    requestAnimationFrame((t) => this.loop(t));
  }

  private tick() {
    if (this.context.isPaused) return;

    this.context.tickCount++;

    const p1 = this.context.p1;
    const p2 = this.context.p2;

    // 1. Poll inputs
    const p1Inputs = this.context.inputP1.getInputs(this.context.tickCount).inputs;
    const p2Inputs = this.context.inputP2.getInputs(this.context.tickCount).inputs;

    // 2. Update player states and timers
    p1.update(p1Inputs, p2.position);
    p2.update(p2Inputs, p1.position);

    // 3. Apply physics (Gravity and velocity update)
    PhysicsEngine.applyGravity(p1);
    PhysicsEngine.applyGravity(p2);

    PhysicsEngine.updatePosition(p1);
    PhysicsEngine.updatePosition(p2);

    // 4. Stage wall and floor constraints
    PhysicsEngine.constrainToStage(p1, STAGE_WIDTH, 720, GROUND_Y, p1.width, p1.height);
    PhysicsEngine.constrainToStage(p2, STAGE_WIDTH, 720, GROUND_Y, p2.width, p2.height);

    // 5. Resolve body overlapping (push players apart, unless dead)
    if (p1.state !== 'DEAD' && p2.state !== 'DEAD') {
      CollisionDetector.resolveBodyCollisions(p1, p2, STAGE_WIDTH);
    }

    // 6. Attack Hit Detection
    this.checkAttacks(p1, p2);
    this.checkAttacks(p2, p1);

    // 7. Set Facing Direction (Fighters face each other)
    if (p1.state !== 'DEAD' && p2.state !== 'DEAD') {
      if (p1.position.x + p1.width / 2 < p2.position.x + p2.width / 2) {
        p1.facingLeft = false;
        p2.facingLeft = true;
      } else {
        p1.facingLeft = true;
        p2.facingLeft = false;
      }
    }

    // 8. Camera tracking update
    this.context.camera.update(p1.position, p2.position, STAGE_WIDTH);
  }

  private checkAttacks(attacker: Fighter, defender: Fighter) {
    if (attacker.state !== 'ATTACKING' || attacker.attackPhase !== 'ACTIVE' || attacker.hasLandedHitThisAttack) {
      return;
    }

    const hitbox = attacker.getAttackHitbox();
    if (!hitbox || !attacker.currentAttack) return;

    // Check if attack hitbox overlaps defender's body box
    const hitRegistered = CollisionDetector.checkAABBOverlap(hitbox, defender);
    if (hitRegistered) {
      attacker.hasLandedHitThisAttack = true;

      // Determine damage and knockback directions
      const attack = attacker.currentAttack;
      
      // Keep track of defender state before taking hit (to build correct energy)
      const defenderStateBefore = defender.state;
      const isFacingOpponent = defender.facingLeft === !attacker.facingLeft;
      const willBeBlocked = defenderStateBefore === 'BLOCKING' && isFacingOpponent;

      defender.takeDamage(attack.damage, attack.knockback, attack.hitStun, attacker.facingLeft);

      // Build energy
      if (willBeBlocked) {
        // Successful block
        defender.energy = Math.min(defender.maxEnergy, defender.energy + 8);
        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 5);
      } else {
        // Successful hit landed
        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 15);
        defender.energy = Math.min(defender.maxEnergy, defender.energy + 10);
      }
    }
  }
}
