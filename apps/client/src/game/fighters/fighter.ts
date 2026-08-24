import { Vector2D, FighterState, AttackDefinition } from '@shadow-clash/shared';
import { GamePlayer, GROUND_Y } from '../engine/game-context.js';

export const LIGHT_ATTACK: AttackDefinition = {
  id: 'light',
  name: 'Light Punch',
  damage: 6,
  startupFrames: 5,
  activeFrames: 6,
  recoveryFrames: 8,
  hitStun: 15,
  blockStun: 8,
  knockback: 5,
  energyCost: 0,
  range: 80,
  hitType: 'MID',
  comboValue: 1
};

export const HEAVY_ATTACK: AttackDefinition = {
  id: 'heavy',
  name: 'Heavy Kick',
  damage: 14,
  startupFrames: 10,
  activeFrames: 8,
  recoveryFrames: 15,
  hitStun: 24,
  blockStun: 12,
  knockback: 12, // Knocks down
  energyCost: 0,
  range: 110,
  hitType: 'MID',
  comboValue: 2
};

export const SPECIAL_ATTACK: AttackDefinition = {
  id: 'special',
  name: 'Special Strike',
  damage: 22,
  startupFrames: 12,
  activeFrames: 10,
  recoveryFrames: 18,
  hitStun: 35,
  blockStun: 15,
  knockback: 16, // Knocks down
  energyCost: 30,
  range: 160,
  hitType: 'MID',
  comboValue: 3
};

export const THROW_ATTACK: AttackDefinition = {
  id: 'throw',
  name: 'Body Slam',
  damage: 16,
  startupFrames: 4,
  activeFrames: 4,
  recoveryFrames: 14,
  hitStun: 40,
  blockStun: 0, // Unblockable
  knockback: 10, // Knocks down
  energyCost: 0,
  range: 65,
  hitType: 'THROW',
  comboValue: 1
};

export class Fighter implements GamePlayer {
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

  constructor(config: {
    id: string;
    name: string;
    x: number;
    weight: number;
    speed: number;
    jumpForce: number;
    facingLeft: boolean;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.position = { x: config.x, y: GROUND_Y - 250 };
    this.velocity = { x: 0, y: 0 };
    this.weight = config.weight;
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.facingLeft = config.facingLeft;
    this.health = 100;
    this.maxHealth = 100;
    this.energy = 0;
    this.maxEnergy = 100;
  }

  public getHurtboxes(): { position: Vector2D; width: number; height: number }[] {
    if (this.state === 'DEAD' || this.state === 'KNOCKED_DOWN') return [];
    
    // Crouch Shifted Hurtboxes
    if (this.height === 150) {
      return [
        { position: { x: this.position.x + 20, y: this.position.y }, width: 60, height: 40 }, // Head
        { position: { x: this.position.x + 10, y: this.position.y + 40 }, width: 80, height: 70 }, // Torso
        { position: { x: this.position.x + 10, y: this.position.y + 110 }, width: 80, height: 40 }, // Legs
      ];
    }
    
    // Standing Hurtboxes
    return [
      { position: { x: this.position.x + 20, y: this.position.y }, width: 60, height: 50 }, // Head
      { position: { x: this.position.x + 10, y: this.position.y + 50 }, width: 80, height: 110 }, // Torso
      { position: { x: this.position.x + 15, y: this.position.y + 160 }, width: 70, height: 90 }, // Legs
    ];
  }

  public update(inputs: any, opponentPos: Vector2D) {
    if (this.state === 'DEAD') {
      this.velocity.x = 0;
      return;
    }

    // Tick down combo timer
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
        this.stateTimer = 15; // 15 frames to get up
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

    // 4. Active Attack / Throw execution cycles
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

      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.currentAttack = null;
        this.attackPhase = 'NONE';
        this.hasLandedHitThisAttack = false;
      }
      
      this.velocity.x = 0;
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

    // Attacks (only allowed when idle standing)
    if (this.isGrounded && targetState === 'IDLE') {
      if (inputs.specialAttack && this.energy >= SPECIAL_ATTACK.energyCost) {
        this.energy -= SPECIAL_ATTACK.energyCost;
        this.startAttack(SPECIAL_ATTACK);
        return;
      } else if (inputs.grab) {
        this.startAttack(THROW_ATTACK);
        return;
      } else if (inputs.lightAttack) {
        this.startAttack(LIGHT_ATTACK);
        return;
      } else if (inputs.heavyAttack) {
        this.startAttack(HEAVY_ATTACK);
        return;
      }
    }

    // Movement updates
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

  private startAttack(attack: AttackDefinition) {
    this.state = 'ATTACKING';
    this.currentAttack = attack;
    this.attackPhase = 'STARTUP';
    this.stateTimer = attack.startupFrames + attack.activeFrames + attack.recoveryFrames;
    this.velocity.x = 0;
    this.hasLandedHitThisAttack = false;
  }

  public takeDamage(amount: number, knockbackX: number, stunFrames: number, opponentFacingLeft: boolean) {
    if (this.state === 'DEAD' || this.isInvincible) return;

    const isFacingOpponent = this.facingLeft === !opponentFacingLeft;

    if (this.state === 'BLOCKING' && isFacingOpponent) {
      // successful block
      this.health -= Math.round(amount * 0.1); // chip damage
      this.velocity.x = opponentFacingLeft ? -knockbackX * 0.3 : knockbackX * 0.3;
      this.state = 'STUNNED';
      this.stateTimer = Math.round(stunFrames * 0.5); // block stun
      this.hitFlash = false;
    } else {
      // Full hit
      this.health -= amount;
      this.velocity.x = opponentFacingLeft ? -knockbackX : knockbackX;
      
      // Determine if attack knocks down
      const isKnockdown = knockbackX >= 10;
      if (isKnockdown) {
        this.state = 'KNOCKED_DOWN';
        this.stateTimer = 35; // 35 frames lying flat
        this.velocity.y = -4; // vertical lift bounce
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
    this.velocity.y = -6; // Higher bounce lift
    this.state = 'KNOCKED_DOWN';
    this.stateTimer = 40; // longer knockdown
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
    this.position = { x: xPosition, y: GROUND_Y - 250 };
    this.velocity = { x: 0, y: 0 };
    this.height = 250;
    this.health = 100;
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
  }
}
