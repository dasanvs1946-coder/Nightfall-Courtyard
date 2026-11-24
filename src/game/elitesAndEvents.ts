import { EliteAffixId, MidWaveEventId, WeaponId } from './types';

export interface EliteAffixSpec {
  id: EliteAffixId;
  tag: string;
  name: string;
  description: string;
  colorHex: number;
  accentHex: string;
}

export const ELITE_AFFIX_ORDER: EliteAffixId[] = [
  'emp_jammer',
  'cryo_proof',
  'phase_blinker',
  'vampiric',
  'berserker',
];

export const ELITE_AFFIX_SPECS: Record<EliteAffixId, EliteAffixSpec> = {
  emp_jammer: {
    id: 'emp_jammer',
    tag: 'EMP JAMMER',
    name: 'EMP Jammer',
    description: 'Disables Drones and Auto-Turrets within 10m.',
    colorHex: 0x38bdf8,
    accentHex: '#38BDF8',
  },
  cryo_proof: {
    id: 'cryo_proof',
    tag: 'CRYO-PROOF',
    name: 'Cryo-Proof',
    description: 'Immune to Cryo Freeze & Singularity gravity pull.',
    colorHex: 0xe0f2fe,
    accentHex: '#BAE6FD',
  },
  phase_blinker: {
    id: 'phase_blinker',
    tag: 'PHASE-BLINKER',
    name: 'Phase-Blinker',
    description: 'Teleports closer when struck from long range.',
    colorHex: 0xc084fc,
    accentHex: '#C084FC',
  },
  vampiric: {
    id: 'vampiric',
    tag: 'VAMPIRIC',
    name: 'Vampiric',
    description: 'Heals nearby infected whenever dealing damage.',
    colorHex: 0xf43f5e,
    accentHex: '#F43F5E',
  },
  berserker: {
    id: 'berserker',
    tag: 'BERSERKER',
    name: 'Berserker',
    description: '+50% Speed & faster attacks below 35% HP.',
    colorHex: 0xf59e0b,
    accentHex: '#F59E0B',
  },
};

export const CC_IMMUNITY_DURATION_SEC = 4.0;

export function canApplyHardCc(
  ccImmunityTimer: number,
  affixes: readonly EliteAffixId[] = [],
): boolean {
  if (ccImmunityTimer > 0) return false;
  if (affixes.includes('cryo_proof')) return false;
  return true;
}

export function rollEliteAffixes(
  wave: number,
  rng: () => number = Math.random,
  forceElite = false,
): EliteAffixId[] {
  if (wave < 6 && !forceElite) return [];
  const eliteChance = forceElite
    ? 1
    : Math.min(0.38, 0.16 + Math.max(0, wave - 6) * 0.018);
  if (rng() > eliteChance) return [];

  const desiredCount =
    wave >= 12 && rng() < Math.min(0.45, 0.2 + (wave - 12) * 0.025) ? 2 : 1;

  const pool = [...ELITE_AFFIX_ORDER];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, desiredCount);
}

export interface MidWaveEventSpec {
  id: MidWaveEventId;
  title: string;
  sirenBanner: string;
  description: string;
  accentHex: string;
}

export const MID_WAVE_EVENT_ORDER: MidWaveEventId[] = [
  'orbital_supply',
  'blood_moon',
  'emp_outage',
];

export const MID_WAVE_EVENT_SPECS: Record<MidWaveEventId, MidWaveEventSpec> = {
  orbital_supply: {
    id: 'orbital_supply',
    title: 'ORBITAL SUPPLY DROP',
    sirenBanner: 'ORBITAL POD INCOMING — HOLD ZONE FOR 6s',
    description: 'Hold inside the beacon for 6s to claim a free Perk/Weapon upgrade + Scrap.',
    accentHex: '#38BDF8',
  },
  blood_moon: {
    id: 'blood_moon',
    title: 'BLOOD MOON SURGE',
    sirenBanner: 'BLOOD MOON RISING — 2X SCORE & IN-RUN SCRAP',
    description: '20s Crimson Frenzy: Zombies +30% speed & +25% armor · Rewards 2x Score & Scrap!',
    accentHex: '#EF4444',
  },
  emp_outage: {
    id: 'emp_outage',
    title: 'SUDDEN EMP OUTAGE',
    sirenBanner: 'EMP GRID BLACKOUT — FLIP GREEN BREAKER SWITCH',
    description: 'Arena power & Drones offline until you reach and flip the green Breaker Switch.',
    accentHex: '#22C55E',
  },
};

export function rollMidWaveEvent(
  wave: number,
  rng: () => number = Math.random,
  forceEvent = false,
): MidWaveEventId | null {
  if (wave < 3 && !forceEvent) return null;
  const triggerChance = forceEvent ? 1 : Math.min(0.85, 0.45 + (wave - 3) * 0.04);
  if (rng() > triggerChance) return null;
  const idx = Math.floor(rng() * MID_WAVE_EVENT_ORDER.length);
  return MID_WAVE_EVENT_ORDER[idx] ?? 'orbital_supply';
}

export const BOSS_PHASE2_THRESHOLD = 0.65;
export const BOSS_PHASE3_THRESHOLD = 0.30;

export function getBossPhaseForHp(hp: number, maxHp: number): 1 | 2 | 3 {
  if (maxHp <= 0) return 1;
  const ratio = hp / maxHp;
  if (ratio <= BOSS_PHASE3_THRESHOLD) return 3;
  if (ratio <= BOSS_PHASE2_THRESHOLD) return 2;
  return 1;
}

/**
 * Computes a pinched flanking approach target point for agile infected (Runners, Stalkers, Ravagers)
 * so squads spread laterally instead of conga-lining into piercing shots.
 */
export function computeFlankingVector(
  playerX: number,
  playerZ: number,
  zombieX: number,
  zombieZ: number,
  flankSign: number,
  angleRad = 0.58,
): { dirX: number; dirZ: number } {
  const dx = playerX - zombieX;
  const dz = playerZ - zombieZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-4) return { dirX: 0, dirZ: 1 };
  const baseX = dx / dist;
  const baseZ = dz / dist;

  // Taper flank offset as zombie gets within strike range (< 4.2m) so it commits to bite
  const taper = dist <= 3.6 ? 0 : Math.min(1, (dist - 3.6) / 6.0);
  const theta = angleRad * taper * (flankSign >= 0 ? 1 : -1);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    dirX: baseX * cos - baseZ * sin,
    dirZ: baseX * sin + baseZ * cos,
  };
}

/**
 * Checks whether an entity has crossed past the open drop abyss of Neon Rooftop.
 */
export function isRooftopEdgeDrop(
  x: number,
  z: number,
  arenaHalfSize: number,
  margin = 0.08,
): boolean {
  const limit = arenaHalfSize - margin;
  return Math.abs(x) >= limit || Math.abs(z) >= limit;
}

export const JUGGERNAUT_SHATTER_WEAPONS: readonly WeaponId[] = [
  'gauss_carbine',
  'railgun',
  'pulse_katana',
  'chem_thrower',
  'micro_launcher',
];

export function isJuggernautShatterWeapon(weaponId: WeaponId): boolean {
  return JUGGERNAUT_SHATTER_WEAPONS.includes(weaponId);
}
