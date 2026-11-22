import {
  EvolutionId,
  PerkId,
  UpgradeLevels,
  WeaponMasteryLevels,
} from './types';

export interface PerkSpec {
  id: PerkId;
  name: string;
  tag: string;
  summary: string;
  accentHex: string;
  evolutionHint?: string;
}

export const PERK_ORDER: PerkId[] = [
  'cryo_rounds',
  'storm_conductor',
  'uv_overdrive',
  'vampiric_rounds',
  'twin_turrets',
  'incendiary',
  'piercing_core',
  'shockwave_coil',
  'extended_drums',
  'critical_optics',
  'dash_shockwave',
];

export const PERK_SPECS: Record<PerkId, PerkSpec> = {
  cryo_rounds: {
    id: 'cryo_rounds',
    name: 'Cryo Rounds',
    tag: 'CROWD CONTROL',
    summary: 'Bullets chill Runners and Riot Breachers, slowing movement by 30% for 2.8s.',
    accentHex: '#38BDF8',
  },
  storm_conductor: {
    id: 'storm_conductor',
    name: 'Storm Conductor',
    tag: 'ARC VOLTAGE',
    summary: 'Shots have a 22% chance (45% in Storm/Rain) to arc chain-lightning to nearby infected.',
    accentHex: '#60A5FA',
  },
  uv_overdrive: {
    id: 'uv_overdrive',
    name: 'UV Overdrive',
    tag: 'BEAM BURN',
    summary: 'Widens tactical flashlight cone by 32% and scorches Shadow Stalkers inside the beam.',
    accentHex: '#A855F7',
  },
  vampiric_rounds: {
    id: 'vampiric_rounds',
    name: 'Vampiric Rounds',
    tag: 'SUSTAIN',
    summary: 'Syphon +2% Max HP every 5 zombie eliminations.',
    accentHex: '#EF4444',
  },
  twin_turrets: {
    id: 'twin_turrets',
    name: 'Twin-Barrel Turrets',
    tag: 'FIREPOWER',
    summary: 'Sentry Turrets fire piercing dual-round bursts for +35% effective burst output.',
    accentHex: '#22C55E',
  },
  incendiary: {
    id: 'incendiary',
    name: 'Incendiary Shells',
    tag: 'THERMITE',
    summary: 'Ignites hit targets for 18% burn DoT over 2.5s.',
    accentHex: '#F97316',
    evolutionHint: 'Evolves M870 Shotgun Lv5 -> Dragon\'s Breath',
  },
  piercing_core: {
    id: 'piercing_core',
    name: 'Piercing Core',
    tag: 'BALLISTICS',
    summary: '+1 bullet pierce on non-piercing weapons and +12% armor penetration damage.',
    accentHex: '#06B6D4',
    evolutionHint: 'Evolves MP5K SMG Lv5 -> Rail-SMG',
  },
  shockwave_coil: {
    id: 'shockwave_coil',
    name: 'Shockwave Coil',
    tag: 'TESLA TECH',
    summary: 'Explosions & deployed gear emit an electro-pulse that staggers nearby enemies.',
    accentHex: '#F59E0B',
    evolutionHint: 'Evolves Turret (Rate Lv5) -> Tesla Coil',
  },
  extended_drums: {
    id: 'extended_drums',
    name: 'Extended Drums',
    tag: 'MAGAZINE',
    summary: '+25% magazine capacity and +15% faster reload cycles.',
    accentHex: '#EAB308',
  },
  critical_optics: {
    id: 'critical_optics',
    name: 'Critical Optics',
    tag: 'PRECISION',
    summary: '+14% critical hit chance (2.1x amber damage multiplier).',
    accentHex: '#F59E0B',
  },
  dash_shockwave: {
    id: 'dash_shockwave',
    name: 'Dash Shockwave',
    tag: 'MOBILITY',
    summary: 'Tactical Dash emits a kinetic pulse pushing enemies away and clearing acid.',
    accentHex: '#38BDF8',
  },
};

export interface EvolutionSpec {
  id: EvolutionId;
  name: string;
  requirementLabel: string;
  summary: string;
  accentHex: string;
}

export const EVOLUTION_ORDER: EvolutionId[] = [
  'dragons_breath',
  'rail_smg',
  'tesla_coil',
];

export const EVOLUTION_SPECS: Record<EvolutionId, EvolutionSpec> = {
  dragons_breath: {
    id: 'dragons_breath',
    name: "Dragon's Breath",
    requirementLabel: 'Shotgun Lv 5 + Incendiary',
    summary: '10-pellet wide flaming buckshot cone that ignites hordes on impact.',
    accentHex: '#F97316',
  },
  rail_smg: {
    id: 'rail_smg',
    name: 'Rail-SMG',
    requirementLabel: 'SMG Lv 5 + Piercing Core',
    summary: 'High-velocity cyan magnetic bolts with 3x pierce and +40% damage.',
    accentHex: '#06B6D4',
  },
  tesla_coil: {
    id: 'tesla_coil',
    name: 'Tesla Coil',
    requirementLabel: 'Trigger Lv 5 + Shockwave Coil',
    summary: 'Sentry Turrets transform into arc pylons chaining lightning across 3 targets.',
    accentHex: '#F59E0B',
  },
};

export function rollPerkDraftChoices(
  ownedPerks: PerkId[],
  rng: () => number = Math.random,
): PerkId[] {
  const unowned = PERK_ORDER.filter((p) => !ownedPerks.includes(p));
  const pool = unowned.length >= 3 ? [...unowned] : [...PERK_ORDER];

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  return pool.slice(0, 3);
}

export function evaluateWeaponEvolutions(
  weaponMastery: WeaponMasteryLevels,
  upgradeLevels: UpgradeLevels,
  ownedPerks: PerkId[],
  alreadyEvolved: EvolutionId[],
): EvolutionId[] {
  const unlocked: EvolutionId[] = [];
  const perkSet = new Set(ownedPerks);
  const evolvedSet = new Set(alreadyEvolved);

  if (
    !evolvedSet.has('dragons_breath') &&
    weaponMastery.shotgun >= 5 &&
    perkSet.has('incendiary')
  ) {
    unlocked.push('dragons_breath');
  }
  if (
    !evolvedSet.has('rail_smg') &&
    weaponMastery.smg >= 5 &&
    perkSet.has('piercing_core')
  ) {
    unlocked.push('rail_smg');
  }
  if (
    !evolvedSet.has('tesla_coil') &&
    upgradeLevels.handling >= 5 &&
    perkSet.has('shockwave_coil')
  ) {
    unlocked.push('tesla_coil');
  }

  return unlocked;
}
