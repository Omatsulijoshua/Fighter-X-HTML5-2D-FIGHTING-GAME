export type FighterState =
  | 'IDLE'
  | 'WALKING'
  | 'RUNNING'
  | 'JUMPING'
  | 'CROUCHING'
  | 'BLOCKING'
  | 'ATTACKING'
  | 'SPECIAL_ATTACK'
  | 'GRABBING'
  | 'THROWING'
  | 'HIT'
  | 'STUNNED'
  | 'KNOCKED_DOWN'
  | 'GETTING_UP'
  | 'DEAD'
  | 'VICTORY';

export type MatchState =
  | 'WAITING'
  | 'CHARACTER_SELECT'
  | 'COUNTDOWN'
  | 'FIGHTING'
  | 'ROUND_END'
  | 'MATCH_END';

export interface AttackDefinition {
  id: string;
  name: string;
  damage: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  hitStun: number;
  blockStun: number;
  knockback: number;
  energyCost: number;
  range: number;
  hitType: 'HIGH' | 'MID' | 'LOW' | 'THROW';
  comboValue: number;
}

export interface FighterDefinition {
  id: string;
  name: string;
  description: string;
  maxHealth: number;
  maxEnergy: number;
  speed: number;
  jumpForce: number;
  weight: number;
  attackPower: number;
  defense: number;
  specialPower: number;
  attacks: AttackDefinition[];
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Hitbox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface FighterStatePayload {
  id: string;
  name: string;
  position: Vector2D;
  velocity: Vector2D;
  health: number;
  energy: number;
  state: FighterState;
  facingLeft: boolean;
}

export interface GameStatePayload {
  tick: number;
  players: FighterStatePayload[];
  matchState: MatchState;
  roundWinner: string | null;
  matchWinner: string | null;
  roundTimer: number;
}
