import { Vector2D, FighterState, AttackDefinition, FighterDefinition } from '@shadow-clash/shared';
import { GamePlayer, GROUND_Y } from '../engine/game-context.js';

import { LIGHT_ATTACK, HEAVY_ATTACK, SPECIAL_ATTACK, THROW_ATTACK } from './attack-definitions.js';
export { LIGHT_ATTACK, HEAVY_ATTACK, SPECIAL_ATTACK, THROW_ATTACK };

export class Fighter implements GamePlayer {
  public definition: FighterDefinition;
  public id: string;
  public name: string;
  public position: Vector2D;
  public velocity: Vector2D;
  public width: number = 100;
  public height: number = 250;
  public weight: number;
  public speed: number;
  public jumpForce: number;
  public isGrounded: boolean = false;
  
  public health: number;
  public maxHealth: number;
  public energy: number;
  public maxEnergy: number;
  public facingLeft: boolean;
  public state: FighterState = 'IDLE';

  // State timers
  public stateTimer: number = 0;
  public currentAttack: AttackDefinition | null = null;
  public attackPhase: 'STARTUP' | 'ACTIVE' | 'RECOVERY' | 'NONE' = 'NONE';
  public hasLandedHitThisAttack: boolean = false;
  public hitFlash: boolean = false;

  // Combo mechanics
  public comboCount: number = 0;
  public comboTimer: number = 0;

  // Invincibility status
  public isInvincible: boolean = false;

  // Projectile spawn hook
  public onSpawnProjectile?: (proj: { x: number; y: number; vx: number; damage: number; ownerId: string }) => void;

  constructor(
    definition: FighterDefinition,
    config: { id: string; x: number; facingLeft: boolean }
  ) {
    this.definition = definition;
    this.id = config.id;
    this.name = definition.name;
    this.position = { x: config.x, y: GROUND_Y - 250 };
    this.velocity = { x: 0, y: 0 };
    this.weight = definition.weight;
    this.speed = definition.speed;
    this.jumpForce = definition.jumpForce;
    this.facingLeft = config.facingLeft;
    this.health = definition.maxHealth;
    this.maxHealth = definition.maxHealth;
    this.energy = 0;
    this.maxEnergy = definition.maxEnergy;
  }

  public getHurtboxes(): { position: Vector2D; width: number; height: number }[] {
    if (this.state === 'DEAD' || this.state === 'KNOCKED_DOWN') return [];
    
    if (this.height === 150) {
      return [
        { position: { x: this.position.x + 20, y: this.position.y }, width: 60, height: 40 }, // Head
        { position: { x: this.position.x + 10, y: this.position.y + 40 }, width: 80, height: 70 }, // Torso
        { position: { x: this.position.x + 10, y: this.position.y + 110 }, width: 80, height: 40 }, // Legs
      ];
    }
    
    return [
      { position: { x: this.position.x + 20, y: this.position.y }, width: 60, height: 50 }, // Head
      { position: { x: this.position.x + 10, y: this.position.y + 50 }, width: 80, height: 110 }, // Torso
      { position: { x: this.position.x + 15, y: this.position.y + 160 }, width: 70, height: 90 }, // Legs
    ];
  }

  public getAttackDefinition(id: string): AttackDefinition {
    const attack = this.definition.attacks.find(a => a.id === id);
    if (!attack) {
      if (id === 'light') return LIGHT_ATTACK;
      if (id === 'heavy') return HEAVY_ATTACK;
      if (id === 'special') return SPECIAL_ATTACK;
      return THROW_ATTACK;
    }
    return attack;
  }

  public update(inputs: any, opponentPos: Vector2D) {
    if (this.state === 'DEAD') {
      this.velocity.x = 0;
      return;
    }

    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    if (this.hitFlash && this.state !== 'HIT') {
      this.hitFlash = false;
    }

    // 1. Knockdown cycle
    if (this.state === 'KNOCKED_DOWN') {
      this.isInvincible = true;
      this.stateTimer--;
      this.velocity.x = 0;
      if (this.stateTimer <= 0) {
        this.state = 'GETTING_UP';
        this.stateTimer = 15;
      }
      return;
    }

    // 2. Get up cycle
    if (this.state === 'GETTING_UP') {
      this.isInvincible = true;
      this.stateTimer--;
      this.velocity.x = 0;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.isInvincible = false;
      }
      return;
    }

    // 3. Stun / Hit cycles
    if (this.state === 'HIT' || this.state === 'STUNNED') {
      this.isInvincible = false;
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.hitFlash = false;
      }
      return;
    }

    // 4. Active Attack / Special execution cycles
    if (this.state === 'ATTACKING' && this.currentAttack) {
      this.isInvincible = false;
      this.stateTimer--;
      const attack = this.currentAttack;
      
      const totalFrames = attack.startupFrames + attack.activeFrames + attack.recoveryFrames;
      const currentFrame = totalFrames - this.stateTimer;

      if (currentFrame <= attack.startupFrames) {
        this.attackPhase = 'STARTUP';
      } else if (currentFrame <= attack.startupFrames + attack.activeFrames) {
        this.attackPhase = 'ACTIVE';
      } else {
        this.attackPhase = 'RECOVERY';
      }

      // Spawning projectile for Razor Energy Blade on active frame trigger
      if (this.name === 'RAZOR' && attack.id === 'special' && currentFrame === attack.startupFrames + 1) {
        if (!this.hasLandedHitThisAttack) {
          this.hasLandedHitThisAttack = true; // prevent multi-spawn
          if (this.onSpawnProjectile) {
            const px = this.facingLeft ? this.position.x - 30 : this.position.x + this.width + 10;
            const py = this.position.y + 70;
            const pvx = this.facingLeft ? -12 : 12;
            this.onSpawnProjectile({
              x: px,
              y: py,
              vx: pvx,
              damage: attack.damage,
              ownerId: this.id
            });
          }
        }
      }

      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.currentAttack = null;
        this.attackPhase = 'NONE';
        this.hasLandedHitThisAttack = false;
      }
      
      // Energy Dash forward movement override
      if (this.name === 'KAIRO' && attack.id === 'special' && this.attackPhase === 'ACTIVE') {
        this.velocity.x = this.facingLeft ? -this.speed * 2.2 : this.speed * 2.2;
      } else {
        this.velocity.x = 0;
      }
      return;
    }

    this.isInvincible = false;
    let targetState: FighterState = 'IDLE';

    // Crouch input
    if (inputs.down && this.isGrounded) {
      if (this.height === 250) {
        this.height = 150;
        this.position.y += 100;
      }
      targetState = 'CROUCHING';
      this.velocity.x = 0;
    } else {
      if (this.height === 150) {
        this.height = 250;
        this.position.y -= 100;
      }
    }

    // Block input
    if (inputs.block && this.isGrounded && targetState !== 'CROUCHING') {
      targetState = 'BLOCKING';
      this.velocity.x = 0;
    }

    // Attacks (only allowed when standing idle)
    if (this.isGrounded && targetState === 'IDLE') {
      const lightDef = this.getAttackDefinition('light');
      const heavyDef = this.getAttackDefinition('heavy');
      const specialDef = this.getAttackDefinition('special');
      const throwDef = this.getAttackDefinition('throw');

      if (inputs.specialAttack && this.energy >= specialDef.energyCost) {
        this.energy -= specialDef.energyCost;
        this.startAttack(specialDef, opponentPos);
        return;
      } else if (inputs.grab) {
        this.startAttack(throwDef, opponentPos);
        return;
      } else if (inputs.lightAttack) {
        this.startAttack(lightDef, opponentPos);
        return;
      } else if (inputs.heavyAttack) {
        this.startAttack(heavyDef, opponentPos);
        return;
      }
    }

    // Move / Jump updates
    if (targetState === 'IDLE' || !this.isGrounded) {
      if (inputs.left) {
        this.velocity.x = -this.speed;
        if (this.isGrounded) targetState = 'WALKING';
      } else if (inputs.right) {
        this.velocity.x = this.speed;
        if (this.isGrounded) targetState = 'WALKING';
      } else {
        this.velocity.x = 0;
      }

      if (inputs.up && this.isGrounded) {
        this.velocity.y = -this.jumpForce;
        this.isGrounded = false;
        targetState = 'JUMPING';
      }
    }

    if (!this.isGrounded) {
      targetState = 'JUMPING';
    }

    this.state = targetState;
  }

  private startAttack(attack: AttackDefinition, opponentPos: Vector2D) {
    this.state = 'ATTACKING';
    this.currentAttack = attack;
    this.attackPhase = 'STARTUP';
    this.stateTimer = attack.startupFrames + attack.activeFrames + attack.recoveryFrames;
    this.velocity.x = 0;
    this.hasLandedHitThisAttack = false;

    // Nyx Shadow Teleport instantly swaps sides behind the opponent
    if (this.name === 'NYX' && attack.id === 'special') {
      const pushDir = opponentPos.x > this.position.x ? 90 : -90;
      this.position.x = opponentPos.x + pushDir;
      
      // Stage constraints clamping
      if (this.position.x < 0) this.position.x = 0;
      if (this.position.x > 2000 - this.width) this.position.x = 2000 - this.width;
      
      this.position.y = GROUND_Y - this.height;
      this.facingLeft = this.position.x > opponentPos.x;
    }
  }

  public takeDamage(amount: number, knockbackX: number, stunFrames: number, opponentFacingLeft: boolean) {
    if (this.state === 'DEAD' || this.isInvincible) return;

    const isFacingOpponent = this.facingLeft === !opponentFacingLeft;

    if (this.state === 'BLOCKING' && isFacingOpponent) {
      this.health -= Math.round(amount * 0.1); // chip damage
      this.velocity.x = opponentFacingLeft ? -knockbackX * 0.3 : knockbackX * 0.3;
      this.state = 'STUNNED';
      this.stateTimer = Math.round(stunFrames * 0.5);
      this.hitFlash = false;
    } else {
      this.health -= amount;
      this.velocity.x = opponentFacingLeft ? -knockbackX : knockbackX;
      
      const isKnockdown = knockbackX >= 10;
      if (isKnockdown) {
        this.state = 'KNOCKED_DOWN';
        this.stateTimer = 35;
        this.velocity.y = -4;
      } else {
        this.state = 'HIT';
        this.stateTimer = stunFrames;
      }
      this.hitFlash = true;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.state = 'DEAD';
      this.velocity.x = 0;
    }
  }

  public takeThrow(damage: number, knockback: number, opponentFacingLeft: boolean) {
    if (this.state === 'DEAD' || this.isInvincible) return;

    this.health -= damage;
    this.velocity.x = opponentFacingLeft ? -knockback : knockback;
    this.velocity.y = -6;
    this.state = 'KNOCKED_DOWN';
    this.stateTimer = 40;
    this.hitFlash = true;

    if (this.health <= 0) {
      this.health = 0;
      this.state = 'DEAD';
      this.velocity.x = 0;
    }
  }

  public getAttackHitbox(): { position: Vector2D; width: number; height: number } | null {
    if (this.state !== 'ATTACKING' || this.attackPhase !== 'ACTIVE' || !this.currentAttack) {
      return null;
    }

    const attack = this.currentAttack;
    
    // Razor Energy Blade spawns projectile and has no body active hitbox
    if (this.name === 'RAZOR' && attack.id === 'special') {
      return null;
    }

    const hitboxWidth = attack.range;
    const hitboxHeight = attack.id === 'throw' ? 80 : 60;

    const x = this.facingLeft 
      ? this.position.x - hitboxWidth 
      : this.position.x + this.width;
    
    const y = this.position.y + (attack.id === 'throw' ? 80 : 50);

    return {
      position: { x, y },
      width: hitboxWidth,
      height: hitboxHeight
    };
  }

  public resetFighter(xPosition: number, facingLeft: boolean) {
    this.position = { x: xPosition, y: GROUND_Y - this.height };
    this.velocity = { x: 0, y: 0 };
    this.facingLeft = facingLeft;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.currentAttack = null;
    this.attackPhase = 'NONE';
    this.hasLandedHitThisAttack = false;
    this.hitFlash = false;
    this.isInvincible = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.health = this.maxHealth;
  }
}
