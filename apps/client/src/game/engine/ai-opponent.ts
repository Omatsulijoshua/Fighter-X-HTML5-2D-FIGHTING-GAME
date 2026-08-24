import { Vector2D } from '@shadow-clash/shared';
import { Fighter } from '../fighters/fighter.js';
import { GameProjectile } from './game-context.js';

export class AIOpponent {
  private lastInputs = {
    left: false,
    right: false,
    up: false,
    down: false,
    lightAttack: false,
    heavyAttack: false,
    specialAttack: false,
    block: false,
    grab: false
  };

  public update(
    ai: Fighter,
    player: Fighter,
    difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT',
    tickCount: number,
    projectiles: GameProjectile[]
  ): typeof this.lastInputs {
    // 1. Decision ticks delayed to model reaction times
    let decisionInterval = 15;
    if (difficulty === 'EASY') decisionInterval = 30;
    else if (difficulty === 'NORMAL') decisionInterval = 15;
    else if (difficulty === 'HARD') decisionInterval = 6;
    else if (difficulty === 'EXPERT') decisionInterval = 2;

    if (tickCount % decisionInterval !== 0) {
      return { ...this.lastInputs };
    }

    const inputs = {
      left: false,
      right: false,
      up: false,
      down: false,
      lightAttack: false,
      heavyAttack: false,
      specialAttack: false,
      block: false,
      grab: false
    };

    if (ai.state === 'DEAD' || player.state === 'DEAD') {
      this.lastInputs = inputs;
      return inputs;
    }

    const distance = Math.abs(ai.position.x - player.position.x);
    const isFacingPlayer = ai.facingLeft === (player.position.x < ai.position.x);

    // 2. Reactive Defense: Block when player is in active attack frames
    const isPlayerAttacking = player.state === 'ATTACKING' && player.attackPhase === 'ACTIVE';
    if (isPlayerAttacking && isFacingPlayer) {
      let blockChance = 0.45;
      if (difficulty === 'EASY') blockChance = 0.15;
      else if (difficulty === 'NORMAL') blockChance = 0.45;
      else if (difficulty === 'HARD') blockChance = 0.75;
      else if (difficulty === 'EXPERT') blockChance = 0.95;

      if (Math.random() < blockChance) {
        inputs.block = true;
        this.lastInputs = inputs;
        return inputs;
      }
    }

    // 3. React to oncoming projectiles (Jump over or Block)
    const oncomingProj = projectiles.find(p => p.ownerId !== ai.id &&
      ((p.velocity.x > 0 && p.position.x < ai.position.x) || (p.velocity.x < 0 && p.position.x > ai.position.x))
    );
    if (oncomingProj) {
      const projDist = Math.abs(oncomingProj.position.x - ai.position.x);
      if (projDist < 320) {
        if (difficulty === 'HARD' || difficulty === 'EXPERT') {
          if (Math.random() < 0.6) {
            inputs.up = true; // jump over projectile
          } else {
            inputs.block = true;
          }
          this.lastInputs = inputs;
          return inputs;
        }
      }
    }

    // 4. Distance-based decision branch
    if (distance < 95) {
      // Close Range
      const rand = Math.random();
      const isPlayerBlocking = player.state === 'BLOCKING';

      // Grabs targeting blocking players on high difficulties
      if (isPlayerBlocking && (difficulty === 'HARD' || difficulty === 'EXPERT')) {
        if (rand < 0.65) {
          inputs.grab = true;
        } else {
          inputs.lightAttack = true;
        }
      } else {
        if (rand < 0.4) {
          inputs.lightAttack = true;
        } else if (rand < 0.75) {
          inputs.heavyAttack = true;
        } else if (rand < 0.88 && difficulty !== 'EASY' && ai.energy >= 30) {
          inputs.specialAttack = true;
        } else if (difficulty === 'HARD' || difficulty === 'EXPERT') {
          inputs.grab = true;
        } else {
          inputs.block = true;
        }
      }
    } else if (distance < 240) {
      // Mid Range
      const rand = Math.random();
      if (rand < 0.4) {
        // Walk closer
        if (player.position.x < ai.position.x) {
          inputs.left = true;
        } else {
          inputs.right = true;
        }
      } else if (rand < 0.75 && difficulty !== 'EASY') {
        // Jump attack gap closer
        inputs.up = true;
        if (player.position.x < ai.position.x) {
          inputs.left = true;
        } else {
          inputs.right = true;
        }
      } else {
        if (ai.energy >= 30 && rand > 0.85 && difficulty !== 'EASY') {
          inputs.specialAttack = true;
        } else {
          inputs.heavyAttack = true;
        }
      }
    } else {
      // Far Range
      if (player.position.x < ai.position.x) {
        inputs.left = true;
      } else {
        inputs.right = true;
      }

      // Razor projectile harass
      if (ai.name === 'RAZOR' && ai.energy >= 30 && difficulty !== 'EASY' && Math.random() < 0.3) {
        inputs.specialAttack = true;
      }
    }

    this.lastInputs = inputs;
    return inputs;
  }
}
