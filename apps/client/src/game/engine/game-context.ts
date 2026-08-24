import { Vector2D, FighterState } from '@shadow-clash/shared';
import { PhysicsEntity } from '../physics/physics-engine.js';
import { CollisionBox } from '../collision/collision-detector.js';
import { GameCamera } from '../camera/game-camera.js';
import { InputManager, PLAYER_1_DEFAULT_BINDINGS, PLAYER_2_DEFAULT_BINDINGS } from '../input/input-manager.js';

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
  public p1: GamePlayer;
  public p2: GamePlayer;
  public camera: GameCamera;
  public inputP1: InputManager;
  public inputP2: InputManager;
  
  public tickCount: number = 0;
  public debugMode: boolean = false;
  public isPaused: boolean = false;

  constructor() {
    this.camera = new GameCamera();
    this.inputP1 = new InputManager(PLAYER_1_DEFAULT_BINDINGS);
    this.inputP2 = new InputManager(PLAYER_2_DEFAULT_BINDINGS);

    // Initializing Player 1 (Fast martial artist template)
    this.p1 = {
      id: 'p1',
      name: 'KAIRO',
      position: { x: 300, y: GROUND_Y - 250 },
      velocity: { x: 0, y: 0 },
      width: 100,
      height: 250,
      weight: 1.0,
      speed: 6.0,
      jumpForce: 18.0,
      isGrounded: false,
      health: 100,
      maxHealth: 100,
      energy: 0,
      maxEnergy: 100,
      facingLeft: false,
      state: 'IDLE'
    };

    // Initializing Player 2 (Heavy armored template)
    this.p2 = {
      id: 'p2',
      name: 'BRUTUS',
      position: { x: STAGE_WIDTH - 400, y: GROUND_Y - 250 },
      velocity: { x: 0, y: 0 },
      width: 100,
      height: 250,
      weight: 1.2,
      speed: 4.5,
      jumpForce: 16.0,
      isGrounded: false,
      health: 100,
      maxHealth: 100,
      energy: 0,
      maxEnergy: 100,
      facingLeft: true,
      state: 'IDLE'
    };
  }
}
