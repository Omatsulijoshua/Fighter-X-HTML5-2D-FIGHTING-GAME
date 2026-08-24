import { AttackDefinition } from '@shadow-clash/shared';

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
  knockback: 12,
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
  knockback: 16,
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
  blockStun: 0,
  knockback: 10,
  energyCost: 0,
  range: 65,
  hitType: 'THROW',
  comboValue: 1
};
