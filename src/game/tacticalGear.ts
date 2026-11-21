import { TacticalGearId } from './types';

export interface TacticalGearSpec {
  id: TacticalGearId;
  name: string;
  shortLabel: string;
  cooldownSec: number;
  description: string;
  blastRadius: number;
  damage: number;
  maxActive: number;
  armDelaySec?: number;
  triggerRadius?: number;
  durationSec?: number;
  range?: number;
  fireIntervalSec?: number;
  stunDurationSec?: number;
  bossStunDurationSec?: number;
}

export const TACTICAL_GEAR_ORDER: TacticalGearId[] = [
  'mine',
  'turret',
  'flashbang',
];

export const TACTICAL_GEAR_SPECS: Record<TacticalGearId, TacticalGearSpec> = {
  mine: {
    id: 'mine',
    name: 'Proximity Mine',
    shortLabel: 'MINE',
    cooldownSec: 16,
    description: 'Arms on ground; detonates 280 DMG shrapnel blast.',
    blastRadius: 3.9,
    damage: 280,
    maxActive: 3,
    armDelaySec: 0.45,
    triggerRadius: 1.85,
  },
  turret: {
    id: 'turret',
    name: 'Sentry Turret',
    shortLabel: 'TURRET',
    cooldownSec: 24,
    description: 'Auto-aiming twin gun turret active for 14s.',
    blastRadius: 0,
    damage: 26,
    maxActive: 2,
    durationSec: 14,
    range: 13.5,
    fireIntervalSec: 0.22,
  },
  flashbang: {
    id: 'flashbang',
    name: 'Flashbang',
    shortLabel: 'FLASH',
    cooldownSec: 18,
    description: 'Stuns nearby zombies for 4s & breaks shields.',
    blastRadius: 6.4,
    damage: 55,
    maxActive: 1,
    stunDurationSec: 4.0,
    bossStunDurationSec: 1.8,
  },
};

export function getNextTacticalGear(current: TacticalGearId): TacticalGearId {
  const idx = TACTICAL_GEAR_ORDER.indexOf(current);
  return TACTICAL_GEAR_ORDER[(idx + 1) % TACTICAL_GEAR_ORDER.length];
}
