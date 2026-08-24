import { GameInputPayload } from '@shadow-clash/shared';

export interface InputBindings {
  left: string;
  right: string;
  up: string;
  down: string;
  lightAttack: string;
  heavyAttack: string;
  specialAttack: string;
  block: string;
  grab: string;
  dodge: string;
}

export const PLAYER_1_DEFAULT_BINDINGS: InputBindings = {
  left: 'KeyA',
  right: 'KeyD',
  up: 'KeyW',
  down: 'KeyS',
  lightAttack: 'KeyJ',
  heavyAttack: 'KeyK',
  specialAttack: 'KeyL',
  block: 'KeyI',
  grab: 'KeyU',
  dodge: 'KeyO',
};

export const PLAYER_2_DEFAULT_BINDINGS: InputBindings = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  lightAttack: 'Numpad1',
  heavyAttack: 'Numpad2',
  specialAttack: 'Numpad3',
  block: 'Numpad4',
  grab: 'Numpad5',
  dodge: 'Numpad6',
};

export class InputManager {
  private keyStates: Map<string, boolean> = new Map();
  private bindings: InputBindings;

  constructor(bindings: InputBindings) {
    this.bindings = bindings;
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on arrow keys and spacebar
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keyStates.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keyStates.set(e.code, false);
    });
  }

  public isPressed(action: keyof InputBindings): boolean {
    const code = this.bindings[action];
    return this.keyStates.get(code) === true;
  }

  public getInputs(tick: number): GameInputPayload {
    return {
      tick,
      inputs: {
        left: this.isPressed('left'),
        right: this.isPressed('right'),
        up: this.isPressed('up'),
        down: this.isPressed('down'),
        lightAttack: this.isPressed('lightAttack'),
        heavyAttack: this.isPressed('heavyAttack'),
        specialAttack: this.isPressed('specialAttack'),
        block: this.isPressed('block'),
        grab: this.isPressed('grab'),
      }
    };
  }

  public clear() {
    this.keyStates.clear();
  }
}
