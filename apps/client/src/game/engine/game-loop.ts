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

    if (this.context.matchState === 'MAIN_MENU') {
      this.updateMainMenu();
      return;
    }

    if (this.context.matchState === 'LEADERBOARD') {
      this.updateLeaderboardScreen();
      return;
    }

    if (this.context.arcadeCleared || this.context.arcadeGameOver) {
      this.updateArcadeOverlays();
      return;
    }

    if (this.context.matchState === 'CHARACTER_SELECT') {
      this.updateCharacterSelection();
      return;
    }

    if (this.context.matchState === 'STAGE_SELECT') {
      this.updateStageSelection();
      return;
    }

    if (this.context.matchState === 'FIGHTING') {
      if (this.context.isMultiplayer) {
        const hasP1 = this.context.inputP1.hasInputForTick(this.context.tickCount);
        const hasP2 = this.context.inputP2.hasInputForTick(this.context.tickCount);
        if (!hasP1 || !hasP2) {
          // Freeze loop tick
          return;
        }
      }
    }

    this.context.tickCount++;

    const p1 = this.context.p1;
    const p2 = this.context.p2;

    // 1. Poll inputs based on state
    let p1Inputs = { left: false, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false };
    let p2Inputs = { left: false, right: false, up: false, down: false, lightAttack: false, heavyAttack: false, specialAttack: false, block: false, grab: false };

    if (this.context.matchState === 'FIGHTING') {
      if (this.context.isMultiplayer) {
        const localInputs = this.context.inputP1.getInputs(this.context.tickCount).inputs;

        this.context.socket?.emit('game-input', {
          tick: this.context.tickCount,
          inputs: localInputs
        });

        if (this.context.multiplayerSlot === 'p1') {
          this.context.inputP1.injectNetworkInput(this.context.tickCount, localInputs);
        } else {
          this.context.inputP2.injectNetworkInput(this.context.tickCount, localInputs);
        }

        p1Inputs = this.context.inputP1.getInputs(this.context.tickCount).inputs;
        p2Inputs = this.context.inputP2.getInputs(this.context.tickCount).inputs;
      } else {
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
            if (this.context.isArcadeMode) {
              if (this.context.p1RoundWins === 2) {
                this.context.arcadeCleared = true;
                if (this.context.arcadeStage === 4) {
                  this.context.matchState = 'MATCH_END';
                  this.context.matchWinner = 'p1';
                }
              } else {
                this.context.arcadeGameOver = true;
              }
            } else {
              this.context.matchState = 'MATCH_END';
              this.context.matchWinner = this.context.p1RoundWins === 2 ? 'p1' : 'p2';
            }
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
        {
          const p1Inputs = this.context.inputP1.getInputs(this.context.tickCount).inputs;
          if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
            this.context.resetArcade();
            this.context.matchState = 'MAIN_MENU';
            this.context.arcadeStage = 1;
            this.context.arcadeCleared = false;
            this.context.arcadeGameOver = false;
            this.context.p1SelectedChar = null;
            this.context.p2SelectedChar = null;
            this.context.selectedStageId = null;
            this.context.menuIndex = 0;
            this.context.menuInputCooldown = 12;
          }
        }
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

  private updateCharacterSelection() {
    const ctx = this.context;
    const fighterKeys = ['KAIRO', 'BRUTUS', 'NYX', 'RAZOR'];

    if (ctx.p1InputCooldown > 0) ctx.p1InputCooldown--;
    if (ctx.p2InputCooldown > 0) ctx.p2InputCooldown--;

    const p1Inputs = ctx.inputP1.getInputs(ctx.tickCount).inputs;

    if (ctx.isMultiplayer) {
      if (ctx.multiplayerSlot === 'p1') {
        if (!ctx.p1SelectedChar && ctx.p1InputCooldown === 0) {
          let cursorChanged = false;
          if (p1Inputs.left) {
            ctx.p1CursorIndex = (ctx.p1CursorIndex - 1 + 4) % 4;
            ctx.p1InputCooldown = 12;
            cursorChanged = true;
          } else if (p1Inputs.right) {
            ctx.p1CursorIndex = (ctx.p1CursorIndex + 1) % 4;
            ctx.p1InputCooldown = 12;
            cursorChanged = true;
          } else if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
            ctx.p1SelectedChar = fighterKeys[ctx.p1CursorIndex];
            ctx.p1InputCooldown = 12;
            ctx.socket?.emit('character-selected', { characterId: ctx.p1SelectedChar });
          }
          if (cursorChanged) {
            ctx.socket?.emit('character-cursor-move', { cursorIndex: ctx.p1CursorIndex });
          }
        }
      } else if (ctx.multiplayerSlot === 'p2') {
        if (!ctx.p2SelectedChar && ctx.p1InputCooldown === 0) {
          let cursorChanged = false;
          if (p1Inputs.left) {
            ctx.p2CursorIndex = (ctx.p2CursorIndex - 1 + 4) % 4;
            ctx.p1InputCooldown = 12;
            cursorChanged = true;
          } else if (p1Inputs.right) {
            ctx.p2CursorIndex = (ctx.p2CursorIndex + 1) % 4;
            ctx.p1InputCooldown = 12;
            cursorChanged = true;
          } else if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
            ctx.p2SelectedChar = fighterKeys[ctx.p2CursorIndex];
            ctx.p1InputCooldown = 12;
            ctx.socket?.emit('character-selected', { characterId: ctx.p2SelectedChar });
          }
          if (cursorChanged) {
            ctx.socket?.emit('character-cursor-move', { cursorIndex: ctx.p2CursorIndex });
          }
        }
      }
      return;
    }

    if (!ctx.p1SelectedChar && ctx.p1InputCooldown === 0) {
      if (p1Inputs.left) {
        ctx.p1CursorIndex = (ctx.p1CursorIndex - 1 + 4) % 4;
        ctx.p1InputCooldown = 12;
      } else if (p1Inputs.right) {
        ctx.p1CursorIndex = (ctx.p1CursorIndex + 1) % 4;
        ctx.p1InputCooldown = 12;
      } else if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
        ctx.p1SelectedChar = fighterKeys[ctx.p1CursorIndex];
        ctx.p1InputCooldown = 12;

        if (ctx.isSinglePlayer) {
          const cpuIdx = Math.floor(Math.random() * 4);
          ctx.p2CursorIndex = cpuIdx;
          ctx.p2SelectedChar = fighterKeys[cpuIdx];
        }
      }
    }

    if (!ctx.isSinglePlayer && !ctx.p2SelectedChar && ctx.p2InputCooldown === 0) {
      const p2Inputs = ctx.inputP2.getInputs(ctx.tickCount).inputs;
      if (p2Inputs.left) {
        ctx.p2CursorIndex = (ctx.p2CursorIndex - 1 + 4) % 4;
        ctx.p2InputCooldown = 12;
      } else if (p2Inputs.right) {
        ctx.p2CursorIndex = (ctx.p2CursorIndex + 1) % 4;
        ctx.p2InputCooldown = 12;
      } else if (p2Inputs.lightAttack || p2Inputs.specialAttack) {
        ctx.p2SelectedChar = fighterKeys[ctx.p2CursorIndex];
        ctx.p2InputCooldown = 12;
      }
    }

    if (ctx.p1SelectedChar) {
      if (ctx.isArcadeMode) {
        const idx = ctx.arcadeStage - 1;
        const cpuOpponents = ['KAIRO', 'NYX', 'RAZOR', 'BRUTUS'];
        const cpuStages = ['SHADOW_SANCTUARY', 'CYBER_GRID', 'VOLCANIC_RIFT', 'VOLCANIC_RIFT'];
        const cpuDiffs = ['EASY', 'NORMAL', 'HARD', 'EXPERT'] as const;

        ctx.p2SelectedChar = cpuOpponents[idx];
        ctx.selectedStageId = cpuStages[idx];
        ctx.aiDifficulty = cpuDiffs[idx];

        ctx.initializeFighters(ctx.p1SelectedChar, ctx.p2SelectedChar);

        ctx.matchState = 'COUNTDOWN';
        ctx.countdownTimer = 3 * 60;
        ctx.roundNumber = 1;
        ctx.p1RoundWins = 0;
        ctx.p2RoundWins = 0;
        ctx.roundWinner = null;
        ctx.matchWinner = null;
        ctx.projectiles = [];
      } else if (ctx.p2SelectedChar) {
        ctx.matchState = 'STAGE_SELECT';
        ctx.stageCursorIndex = 0;
        ctx.stageInputCooldown = 12;
      }
    }
  }

  private updateStageSelection() {
    const ctx = this.context;
    const stageKeys = ['SHADOW_SANCTUARY', 'CYBER_GRID', 'VOLCANIC_RIFT'];

    if (ctx.stageInputCooldown > 0) ctx.stageInputCooldown--;

    if (ctx.isMultiplayer) {
      if (ctx.multiplayerSlot !== 'p1') {
        // Guest waits, has no stage select inputs
        return;
      }
    }

    const p1Inputs = ctx.inputP1.getInputs(ctx.tickCount).inputs;

    if (ctx.stageInputCooldown === 0) {
      if (p1Inputs.left) {
        ctx.stageCursorIndex = (ctx.stageCursorIndex - 1 + 3) % 3;
        ctx.stageInputCooldown = 12;
      } else if (p1Inputs.right) {
        ctx.stageCursorIndex = (ctx.stageCursorIndex + 1) % 3;
        ctx.stageInputCooldown = 12;
      } else if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
        const stageId = stageKeys[ctx.stageCursorIndex];
        ctx.stageInputCooldown = 12;

        if (ctx.isMultiplayer) {
          ctx.socket?.emit('stage-selected', { stageId });
        } else {
          ctx.selectedStageId = stageId;
          if (ctx.p1SelectedChar && ctx.p2SelectedChar) {
            ctx.initializeFighters(ctx.p1SelectedChar, ctx.p2SelectedChar);
          }

          ctx.matchState = 'COUNTDOWN';
          ctx.countdownTimer = 3 * 60;
          ctx.roundNumber = 1;
          ctx.p1RoundWins = 0;
          ctx.p2RoundWins = 0;
          ctx.roundWinner = null;
          ctx.matchWinner = null;
          ctx.projectiles = [];
        }
      }
    }
  }

  private updateArcadeOverlays() {
    const ctx = this.context;
    const p1Inputs = ctx.inputP1.getInputs(ctx.tickCount).inputs;

    if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
      if (ctx.arcadeCleared) {
        ctx.arcadeCleared = false;

        if (ctx.arcadeStage < 4) {
          ctx.arcadeStage++;
          const idx = ctx.arcadeStage - 1;
          const cpuOpponents = ['KAIRO', 'NYX', 'RAZOR', 'BRUTUS'];
          const cpuStages = ['SHADOW_SANCTUARY', 'CYBER_GRID', 'VOLCANIC_RIFT', 'VOLCANIC_RIFT'];
          const cpuDiffs = ['EASY', 'NORMAL', 'HARD', 'EXPERT'] as const;

          ctx.p2SelectedChar = cpuOpponents[idx];
          ctx.selectedStageId = cpuStages[idx];
          ctx.aiDifficulty = cpuDiffs[idx];

          if (ctx.p1SelectedChar && ctx.p2SelectedChar) {
            ctx.initializeFighters(ctx.p1SelectedChar, ctx.p2SelectedChar);
          }

          ctx.matchState = 'COUNTDOWN';
          ctx.countdownTimer = 3 * 60;
          ctx.roundNumber = 1;
          ctx.p1RoundWins = 0;
          ctx.p2RoundWins = 0;
          ctx.roundWinner = null;
          ctx.matchWinner = null;
          ctx.projectiles = [];
        } else {
          ctx.resetArcade();
        }
      } else if (ctx.arcadeGameOver) {
        ctx.arcadeGameOver = false;

        if (ctx.p1SelectedChar && ctx.p2SelectedChar) {
          ctx.initializeFighters(ctx.p1SelectedChar, ctx.p2SelectedChar);
        }

        ctx.matchState = 'COUNTDOWN';
        ctx.countdownTimer = 3 * 60;
        ctx.roundNumber = 1;
        ctx.p1RoundWins = 0;
        ctx.p2RoundWins = 0;
        ctx.roundWinner = null;
        ctx.matchWinner = null;
        ctx.projectiles = [];
      }
    }
  }

  private updateMainMenu() {
    const ctx = this.context;
    if (ctx.menuInputCooldown > 0) ctx.menuInputCooldown--;

    const p1Inputs = ctx.inputP1.getInputs(ctx.tickCount).inputs;

    if (ctx.menuInputCooldown === 0) {
      if (p1Inputs.up) {
        ctx.menuIndex = (ctx.menuIndex - 1 + 4) % 4;
        ctx.menuInputCooldown = 12;
      } else if (p1Inputs.down) {
        ctx.menuIndex = (ctx.menuIndex + 1) % 4;
        ctx.menuInputCooldown = 12;
      } else if (p1Inputs.lightAttack || p1Inputs.specialAttack) {
        ctx.menuInputCooldown = 12;
        ctx.p1SelectedChar = null;
        ctx.p2SelectedChar = null;
        ctx.selectedStageId = null;
        ctx.isMultiplayer = false;

        if (ctx.menuIndex === 0) {
          ctx.isSinglePlayer = true;
          ctx.isArcadeMode = true;
          ctx.matchState = 'CHARACTER_SELECT';
        } else if (ctx.menuIndex === 1) {
          ctx.isSinglePlayer = false;
          ctx.isArcadeMode = false;
          ctx.matchState = 'CHARACTER_SELECT';
        } else if (ctx.menuIndex === 2) {
          ctx.isSinglePlayer = false;
          ctx.isArcadeMode = false;
          ctx.isMultiplayer = true;
          ctx.matchState = 'WAITING';

          ctx.socket?.emit('matchmaking-join', {
            userId: ctx.socket?.id || 'guest_p',
            username: 'Online Player'
          });
        } else if (ctx.menuIndex === 3) {
          ctx.matchState = 'LEADERBOARD';
          fetch('http://localhost:3005/api/leaderboard')
            .then(res => res.json())
            .then(data => {
              ctx.leaderboardData = data;
            })
            .catch(err => {
              console.error('Failed to fetch leaderboard:', err);
              ctx.leaderboardData = [];
            });
        }
      }
    }
  }

  private updateLeaderboardScreen() {
    const ctx = this.context;
    if (ctx.menuInputCooldown > 0) ctx.menuInputCooldown--;

    const p1Inputs = ctx.inputP1.getInputs(ctx.tickCount).inputs;

    if (ctx.menuInputCooldown === 0 && (p1Inputs.lightAttack || p1Inputs.specialAttack)) {
      ctx.menuInputCooldown = 12;
      ctx.matchState = 'MAIN_MENU';
    }
  }
}
