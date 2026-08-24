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
  knockback: 10,
  energyCost: 0,
  range: 110,
  hitType: 'MID',
  comboValue: 2
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

  // State timers and animation phase helpers
  public stateTimer: number = 0;
  public currentAttack: AttackDefinition | null = null;
  public attackPhase: 'STARTUP' | 'ACTIVE' | 'RECOVERY' | 'NONE' = 'NONE';
  public hasLandedHitThisAttack: boolean = false;
  public hitFlash: boolean = false;

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

  public update(inputs: any, opponentPos: Vector2D) {
    if (this.state === 'DEAD') {
      this.velocity.x = 0;
      return;
    }

    if (this.hitFlash && this.state !== 'HIT') {
      this.hitFlash = false;
    }

    // Decrement stun frame counter
    if (this.state === 'HIT' || this.state === 'STUNNED') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.hitFlash = false;
      }
      return; // Ignore controls while hit-stunned
    }

    // Run active attack cycles
    if (this.state === 'ATTACKING' && this.currentAttack) {
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

    let targetState: FighterState = 'IDLE';

    // 1. Crouch input adjustments (Ground level only)
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

    // 2. Block input checks
    if (inputs.block && this.isGrounded && targetState !== 'CROUCHING') {
      targetState = 'BLOCKING';
      this.velocity.x = 0;
    }

    // 3. Attack triggers (Can only trigger from IDLE standing)
    if (this.isGrounded && targetState === 'IDLE') {
      if (inputs.lightAttack) {
        this.startAttack(LIGHT_ATTACK);
        return;
      } else if (inputs.heavyAttack) {
        this.startAttack(HEAVY_ATTACK);
        return;
      }
    }

    // 4. Horizontal movement and jumping checks
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
    if (this.state === 'DEAD') return;

    // Check if player is blocking and facing the attack direction
    const isFacingOpponent = this.facingLeft === !opponentFacingLeft;
    
    if (this.state === 'BLOCKING' && isFacingOpponent) {
      // Blocked!
      this.health -= Math.round(amount * 0.1); // Take 10% chip damage
      this.velocity.x = opponentFacingLeft ? -knockbackX * 0.4 : knockbackX * 0.4;
      this.state = 'STUNNED';
      this.stateTimer = Math.round(stunFrames * 0.5); // Stun reduced by 50%
      this.hitFlash = false;
    } else {
      // Full Hit!
      this.health -= amount;
      this.velocity.x = opponentFacingLeft ? -knockbackX : knockbackX;
      this.state = 'HIT';
      this.stateTimer = stunFrames;
      this.hitFlash = true;
    }

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
    const hitboxHeight = 60;

    const x = this.facingLeft 
      ? this.position.x - hitboxWidth 
      : this.position.x + this.width;
    
    const y = this.position.y + 50;

    return {
      position: { x, y },
      width: hitboxWidth,
      height: hitboxHeight
    };
  }
}
