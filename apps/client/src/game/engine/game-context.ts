import { Vector2D, FighterState, MatchState } from '@shadow-clash/shared';
import { PhysicsEntity } from '../physics/physics-engine.js';
import { CollisionBox } from '../collision/collision-detector.js';
import { GameCamera } from '../camera/game-camera.js';
import { InputManager, PLAYER_1_DEFAULT_BINDINGS, PLAYER_2_DEFAULT_BINDINGS } from '../input/input-manager.js';
import { Fighter } from '../fighters/fighter.js';
import { FIGHTER_TEMPLATES } from '../fighters/fighter-definitions.js';

export interface GamePlayer extends PhysicsEntity, CollisionBox {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  facingLeft: boolean;
  state: FighterState;
}

export interface GameProjectile {
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  damage: number;
  ownerId: string;
  active: boolean;
}

export const STAGE_WIDTH = 2000;
export const GROUND_Y = 620;

export class GameContext {
  public p1: Fighter;
  public p2: Fighter;
  public camera: GameCamera;
  public inputP1: InputManager;
  public inputP2: InputManager;
  
  public tickCount: number = 0;
  public debugMode: boolean = false;
  public isPaused: boolean = false;

  // Round / Match variables
  public matchState: MatchState = 'COUNTDOWN';
  public roundNumber: number = 1;
  public p1RoundWins: number = 0;
  public p2RoundWins: number = 0;
  public roundTimer: number = 99 * 60;
  public countdownTimer: number = 3 * 60;
  public roundWinner: string | null = null;
  public matchWinner: string | null = null;

  // Single player / AI variables
  public isSinglePlayer: boolean = true;
  public aiDifficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT' = 'NORMAL';

  // Projectile tracking
  public projectiles: GameProjectile[] = [];

  constructor() {
    this.camera = new GameCamera();
    this.inputP1 = new InputManager(PLAYER_1_DEFAULT_BINDINGS);
    this.inputP2 = new InputManager(PLAYER_2_DEFAULT_BINDINGS);

    // Instantiate Player 1 as KAIRO (Fast martial artist template)
    this.p1 = new Fighter(FIGHTER_TEMPLATES.KAIRO, {
      id: 'p1',
      x: 300,
      facingLeft: false,
    });

    // Instantiate Player 2 as BRUTUS (Heavy armored tank template)
    this.p2 = new Fighter(FIGHTER_TEMPLATES.BRUTUS, {
      id: 'p2',
      x: STAGE_WIDTH - 400,
      facingLeft: true,
    });

    // Register projectile spawn triggers
    this.p1.onSpawnProjectile = (proj) => this.spawnProjectile(proj);
    this.p2.onSpawnProjectile = (proj) => this.spawnProjectile(proj);
  }

  private spawnProjectile(proj: { x: number; y: number; vx: number; damage: number; ownerId: string }) {
    this.projectiles.push({
      position: { x: proj.x, y: proj.y },
      velocity: { x: proj.vx, y: 0 },
      width: 40,
      height: 20,
      damage: proj.damage,
      ownerId: proj.ownerId,
      active: true
    });
    console.log(`Projectile spawned by ${proj.ownerId} at [${proj.x}, ${proj.y}]`);
  }
}
