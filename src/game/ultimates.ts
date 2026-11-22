import { SurvivorClassId } from './types';

export interface UltimateSpec {
  classId: SurvivorClassId;
  name: string;
  shortLabel: string;
  description: string;
  durationSec: number;
  accentHex: string;
}

export const ULTIMATE_MAX_CHARGE = 100;

export const ULTIMATE_SPECS: Record<SurvivorClassId, UltimateSpec> = {
  demolitionist: {
    classId: 'demolitionist',
    name: 'Orbital Airstrike',
    shortLabel: 'AIRSTRIKE',
    description: 'Carpet-bombs the courtyard in 8 red-telegraphed heavy ordnance blasts.',
    durationSec: 2.6,
    accentHex: '#F97316',
  },
  recon: {
    classId: 'recon',
    name: 'Bullet-Time Overclock',
    shortLabel: 'BULLET-TIME',
    description: 'Slows infected by 65% for 6s with unlimited ammo & zero reloads.',
    durationSec: 6.0,
    accentHex: '#A855F7',
  },
  vanguard: {
    classId: 'vanguard',
    name: 'Nano-Shield Dome',
    shortLabel: 'NANO-SHIELD',
    description: '360-degree kinetic dome blocking all damage & regenerating 45% Max HP over 5s.',
    durationSec: 5.0,
    accentHex: '#38BDF8',
  },
  engineer: {
    classId: 'engineer',
    name: 'Minigun Overdrive',
    shortLabel: 'OVERDRIVE',
    description: 'Dual-barrel hyper-fire overdrive + supercharged sentry turrets for 7s.',
    durationSec: 7.0,
    accentHex: '#22C55E',
  },
};

export function gainUltimateCharge(
  currentCharge: number,
  damageDealt: number,
  isKill: boolean,
): number {
  const safeCurrent = Math.max(0, Math.min(ULTIMATE_MAX_CHARGE, currentCharge));
  const dmgGain = Math.max(0, damageDealt) * 0.025;
  const killGain = isKill ? 3.5 : 0;
  return Math.min(ULTIMATE_MAX_CHARGE, safeCurrent + dmgGain + killGain);
}

export function isUltimateReady(charge: number): boolean {
  return charge >= ULTIMATE_MAX_CHARGE - 1e-4;
}
