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
  private injectedInputs: Map<number, any> = new Map();

  constructor(bindings: InputBindings) {
    this.bindings = bindings;
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;
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

  public injectNetworkInput(tick: number, inputs: any) {
    this.injectedInputs.set(tick, inputs);
  }

  public isPressed(action: keyof InputBindings): boolean {
    const code = this.bindings[action];
    return this.keyStates.get(code) === true;
  }

  public getInputs(tick: number): GameInputPayload {
    if (this.injectedInputs.has(tick)) {
      return {
        tick,
        inputs: this.injectedInputs.get(tick)
      };
    }
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

  public isRemote: boolean = false;

  public hasInputForTick(tick: number): boolean {
    if (this.isRemote) {
      return this.injectedInputs.has(tick);
    }
    return true;
  }

  public setVirtualInput(action: keyof InputBindings, isPressed: boolean) {
    const code = this.bindings[action];
    if (code) {
      this.keyStates.set(code, isPressed);
    }
  }

  public clear() {
    this.keyStates.clear();
    this.injectedInputs.clear();
  }
}
