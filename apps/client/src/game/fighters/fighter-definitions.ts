import { FighterDefinition, AttackDefinition } from '@shadow-clash/shared';
import { LIGHT_ATTACK, HEAVY_ATTACK, SPECIAL_ATTACK, THROW_ATTACK } from './attack-definitions.js';

export const FIGHTER_TEMPLATES: Record<string, FighterDefinition> = {
  KAIRO: {
    id: 'kairo',
    name: 'KAIRO',
    description: 'Fast martial artist utilizing quick strikes and swift energy dashes.',
    maxHealth: 90,
    maxEnergy: 100,
    speed: 7.0,
    jumpForce: 19.0,
    weight: 0.9,
    attackPower: 1.0,
    defense: 0.9,
    specialPower: 1.0,
    attacks: [
      LIGHT_ATTACK,
      HEAVY_ATTACK,
      {
        ...SPECIAL_ATTACK,
        id: 'special',
        name: 'Energy Dash',
        damage: 20,
        startupFrames: 8,
        activeFrames: 12,
        recoveryFrames: 14,
        range: 180,
        knockback: 10
      },
      THROW_ATTACK
    ]
  },
  BRUTUS: {
    id: 'brutus',
    name: 'BRUTUS',
    description: 'Heavy armored fighter dealing devastating close-range ground smashes.',
    maxHealth: 120,
    maxEnergy: 100,
    speed: 4.0,
    jumpForce: 15.5,
    weight: 1.3,
    attackPower: 1.25,
    defense: 1.2,
    specialPower: 1.0,
    attacks: [
      LIGHT_ATTACK,
      HEAVY_ATTACK,
      {
        ...SPECIAL_ATTACK,
        id: 'special',
        name: 'Ground Smash',
        damage: 26,
        startupFrames: 15,
        activeFrames: 8,
        recoveryFrames: 22,
        range: 200, // Massive range
        knockback: 18
      },
      THROW_ATTACK
    ]
  },
  NYX: {
    id: 'nyx',
    name: 'NYX',
    description: 'Agile shadow assassin who teleports behind opponents and executes fast combo chains.',
    maxHealth: 90,
    maxEnergy: 100,
    speed: 6.5,
    jumpForce: 18.5,
    weight: 0.95,
    attackPower: 0.9,
    defense: 0.8,
    specialPower: 1.05,
    attacks: [
      LIGHT_ATTACK,
      HEAVY_ATTACK,
      {
        ...SPECIAL_ATTACK,
        id: 'special',
        name: 'Shadow Teleport',
        damage: 18,
        startupFrames: 10,
        activeFrames: 8,
        recoveryFrames: 15,
        range: 80,
        knockback: 8
      },
      THROW_ATTACK
    ]
  },
  RAZOR: {
    id: 'razor',
    name: 'RAZOR',
    description: 'Balanced warrior utilizing energy blade projectiles to control space.',
    maxHealth: 100,
    maxEnergy: 100,
    speed: 5.5,
    jumpForce: 17.0,
    weight: 1.0,
    attackPower: 1.05,
    defense: 1.0,
    specialPower: 1.0,
    attacks: [
      LIGHT_ATTACK,
      HEAVY_ATTACK,
      {
        ...SPECIAL_ATTACK,
        id: 'special',
        name: 'Energy Blade',
        damage: 20,
        startupFrames: 12,
        activeFrames: 6,
        recoveryFrames: 18,
        range: 120,
        knockback: 10
      },
      THROW_ATTACK
    ]
  }
};
