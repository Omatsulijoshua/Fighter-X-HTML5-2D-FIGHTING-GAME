import { GameContext, STAGE_WIDTH, GROUND_Y } from './game-context.js';
import { PhysicsEngine } from '../physics/physics-engine.js';
import { CollisionDetector } from '../collision/collision-detector.js';
import { Renderer } from './renderer.js';
import { Fighter } from '../fighters/fighter.js';
import { AIOpponent } from './ai-opponent.js';

export class GameLoop {
  private context: GameContext;
  private ctx: CanvasRenderingContext2D;
  private running: boolean = false;
  private aiOpponent: AIOpponent = new AIOpponent();

  // Fixed timestep configuration: 60 logic ticks per second (~16.67ms)
  private readonly TICK_MS = 1000 / 60;
  private accumulator = 0;
  private lastTime = 0;

  // FPS metrics
  private fps = 0;
  private frameCount = 0;
  private fpsLastTime = 0;

  // Round delay ticks
  private roundEndDelay = 0;

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

    // 1. Poll inputs based on state
    let p1Inputs = { left: false, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false };
    let p2Inputs = { left: false, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false };

    if (this.context.matchState === 'FIGHTING') {
      p1Inputs = this.context.inputP1.getInputs(this.context.tickCount).inputs;
      if (this.context.isSinglePlayer) {
        p2Inputs = this.aiOpponent.update(
          p2,
          p1,
          this.context.aiDifficulty,
          this.context.tickCount,
          this.context.projectiles
        );
      } else {
        p2Inputs = this.context.inputP2.getInputs(this.context.tickCount).inputs;
      }
    }

    // 2. Update players
    p1.update(p1Inputs, p2.position);
    p2.update(p2Inputs, p1.position);

    // 3. Apply physics
    PhysicsEngine.applyGravity(p1);
    PhysicsEngine.applyGravity(p2);

    PhysicsEngine.updatePosition(p1);
    PhysicsEngine.updatePosition(p2);

    // 4. Clamping
    PhysicsEngine.constrainToStage(p1, STAGE_WIDTH, 720, GROUND_Y, p1.width, p1.height);
    PhysicsEngine.constrainToStage(p2, STAGE_WIDTH, 720, GROUND_Y, p2.width, p2.height);

    // 5. Body pushback collisions
    if (p1.state !== 'DEAD' && p2.state !== 'DEAD' && this.context.matchState !== 'ROUND_END') {
      CollisionDetector.resolveBodyCollisions(p1, p2, STAGE_WIDTH);
    }

    // 6. Projectiles updates
    this.updateProjectiles();

    // 7. Dynamic facing direction updates
    if (p1.state !== 'DEAD' && p2.state !== 'DEAD') {
      if (p1.position.x + p1.width / 2 < p2.position.x + p2.width / 2) {
        p1.facingLeft = false;
        p2.facingLeft = true;
      } else {
        p1.facingLeft = true;
        p2.facingLeft = false;
      }
    }

    // 8. Match progression ticks
    switch (this.context.matchState) {
      case 'COUNTDOWN':
        this.context.countdownTimer--;
        if (this.context.countdownTimer <= 0) {
          this.context.matchState = 'FIGHTING';
          this.context.roundTimer = 99 * 60;
        }
        break;

      case 'FIGHTING':
        this.context.roundTimer--;

        // Evaluate attack contacts
        this.checkAttacks(p1, p2);
        this.checkAttacks(p2, p1);

        // Check KOs or timeouts
        if (p1.health <= 0 || p2.health <= 0 || this.context.roundTimer <= 0) {
          this.context.matchState = 'ROUND_END';
          this.roundEndDelay = 3 * 60;

          if (p1.health === p2.health) {
            this.context.roundWinner = null;
          } else if (p1.health > p2.health) {
            this.context.roundWinner = 'p1';
            this.context.p1RoundWins++;
          } else {
            this.context.roundWinner = 'p2';
            this.context.p2RoundWins++;
          }
        }
        break;

      case 'ROUND_END':
        this.roundEndDelay--;
        if (this.roundEndDelay <= 0) {
          if (this.context.p1RoundWins === 2 || this.context.p2RoundWins === 2) {
            this.context.matchState = 'MATCH_END';
            this.context.matchWinner = this.context.p1RoundWins === 2 ? 'p1' : 'p2';
          } else {
            this.context.roundNumber++;
            this.context.matchState = 'COUNTDOWN';
            this.context.countdownTimer = 3 * 60;
            this.context.roundWinner = null;
            this.context.projectiles = []; // clear projectiles
            
            // Reset players
            p1.resetFighter(300, false);
            p2.resetFighter(STAGE_WIDTH - 400, true);
          }
        }
        break;

      case 'MATCH_END':
        break;
    }

    // 9. Camera center midpoint LERP update
    this.context.camera.update(p1.position, p2.position, STAGE_WIDTH);
  }

  private checkAttacks(attacker: Fighter, defender: Fighter) {
    if (attacker.state !== 'ATTACKING' || attacker.attackPhase !== 'ACTIVE' || attacker.hasLandedHitThisAttack) {
      return;
    }

    const hitbox = attacker.getAttackHitbox();
    if (!hitbox || !attacker.currentAttack) return;

    const hurtboxes = defender.getHurtboxes();
    let hitRegistered = false;

    for (const hurtbox of hurtboxes) {
      if (CollisionDetector.checkAABBOverlap(hitbox, hurtbox)) {
        hitRegistered = true;
        break;
      }
    }

    if (hitRegistered) {
      attacker.hasLandedHitThisAttack = true;
      const attack = attacker.currentAttack;

      if (attack.id === 'throw') {
        defender.takeThrow(attack.damage, attack.knockback, attacker.facingLeft);
        attacker.comboCount++;
        attacker.comboTimer = 90;
        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 15);
        defender.energy = Math.min(defender.maxEnergy, defender.energy + 10);
        return;
      }

      const isFacingOpponent = defender.facingLeft === !attacker.facingLeft;
      const willBeBlocked = defender.state === 'BLOCKING' && isFacingOpponent;

      if (willBeBlocked) {
        defender.takeDamage(attack.damage, attack.knockback, attack.hitStun, attacker.facingLeft);
        defender.energy = Math.min(defender.maxEnergy, defender.energy + 8);
        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 5);
      } else {
        const damageScale = Math.max(0.20, Math.pow(0.85, attacker.comboCount));
        const finalDamage = Math.round(attack.damage * damageScale);

        defender.takeDamage(finalDamage, attack.knockback, attack.hitStun, attacker.facingLeft);

        attacker.comboCount++;
        attacker.comboTimer = 90;

        attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 15);
        defender.energy = Math.min(defender.maxEnergy, defender.energy + 10);
      }
    }
  }

  private updateProjectiles() {
    const projectiles = this.context.projectiles;
    const p1 = this.context.p1;
    const p2 = this.context.p2;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      if (!proj.active) {
        projectiles.splice(i, 1);
        continue;
      }

      // Translate projectile
      proj.position.x += proj.velocity.x;

      // Bound check cleanup
      if (proj.position.x < 0 || proj.position.x > STAGE_WIDTH) {
        proj.active = false;
        projectiles.splice(i, 1);
        continue;
      }

      // Check collision details against opponent
      const target = proj.ownerId === 'p1' ? p2 : p1;
      const attacker = proj.ownerId === 'p1' ? p1 : p2;

      if (target.state !== 'DEAD' && !target.isInvincible) {
        const hurtboxes = target.getHurtboxes();
        let hitLanded = false;
        const projBox = { position: proj.position, width: proj.width, height: proj.height };

        for (const hurtbox of hurtboxes) {
          if (CollisionDetector.checkAABBOverlap(projBox, hurtbox)) {
            hitLanded = true;
            break;
          }
        }

        if (hitLanded) {
          proj.active = false;
          
          const isFacingOpponent = target.facingLeft === (proj.velocity.x > 0);
          const willBeBlocked = target.state === 'BLOCKING' && isFacingOpponent;

          if (willBeBlocked) {
            target.takeDamage(proj.damage, 4, 12, proj.velocity.x < 0);
            target.energy = Math.min(target.maxEnergy, target.energy + 8);
            attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 5);
          } else {
            const damageScale = Math.max(0.20, Math.pow(0.85, attacker.comboCount));
            const finalDamage = Math.round(proj.damage * damageScale);

            target.takeDamage(finalDamage, 6, 18, proj.velocity.x < 0);
            
            attacker.comboCount++;
            attacker.comboTimer = 90;
            
            attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 15);
            target.energy = Math.min(target.maxEnergy, target.energy + 10);
          }

          projectiles.splice(i, 1);
        }
      }
    }
  }
}
