import { Vector2D, FighterState, MatchState } from '@shadow-clash/shared';
import { PhysicsEntity } from '../physics/physics-engine.js';
import { CollisionBox } from '../collision/collision-detector.js';
import { GameCamera } from '../camera/game-camera.js';
import { InputManager, PLAYER_1_DEFAULT_BINDINGS, PLAYER_2_DEFAULT_BINDINGS } from '../input/input-manager.js';
import { Fighter } from '../fighters/fighter.js';

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

export const STAGE_WIDTH = 2000;
export const GROUND_Y = 620; // Height is 720, ground floor at 620

export class GameContext {
  public p1: Fighter;
  public p2: Fighter;
  public camera: GameCamera;
  public inputP1: InputManager;
  public inputP2: InputManager;
  
  public tickCount: number = 0;
  public debugMode: boolean = false;
  public isPaused: boolean = false;

  // Round / Match System variables
  public matchState: MatchState = 'COUNTDOWN';
  public roundNumber: number = 1;
  public p1RoundWins: number = 0;
  public p2RoundWins: number = 0;
  public roundTimer: number = 99 * 60; // 99 seconds in ticks (at 60 ticks/sec)
  public countdownTimer: number = 3 * 60; // 3 seconds in ticks
  public roundWinner: string | null = null;
  public matchWinner: string | null = null;

  constructor() {
    this.camera = new GameCamera();
    this.inputP1 = new InputManager(PLAYER_1_DEFAULT_BINDINGS);
    this.inputP2 = new InputManager(PLAYER_2_DEFAULT_BINDINGS);

    // Initializing Player 1 (Fast martial artist template)
    this.p1 = new Fighter({
      id: 'p1',
      name: 'KAIRO',
      x: 300,
      weight: 1.0,
      speed: 6.0,
      jumpForce: 18.0,
      facingLeft: false,
    });

    // Initializing Player 2 (Heavy armored template)
    this.p2 = new Fighter({
      id: 'p2',
      name: 'BRUTUS',
      x: STAGE_WIDTH - 400,
      weight: 1.2,
      speed: 4.5,
      jumpForce: 16.0,
      facingLeft: true,
    });
  }
}
