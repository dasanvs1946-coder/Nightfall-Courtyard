import {
  CursedPerkId,
  EvolutionId,
  PerkId,
  UpgradeLevels,
  WeaponId,
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
    evolutionHint: 'Evolves Cryo-Carbine Lv5 -> Absolute Zero Beam · Synergizes Mortar',
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
    evolutionHint:
      "Evolves Shotgun Lv5 -> Dragon's Breath & Chem-Thrower Lv5 -> Napalm Bio-Blaster",
  },
  piercing_core: {
    id: 'piercing_core',
    name: 'Piercing Core',
    tag: 'BALLISTICS',
    summary: '+1 bullet pierce on non-piercing weapons and +12% armor penetration damage.',
    accentHex: '#06B6D4',
    evolutionHint:
      'Evolves SMG Lv5 -> Rail-SMG & Twin-9 Lv5 -> Phantom Enforcers',
  },
  shockwave_coil: {
    id: 'shockwave_coil',
    name: 'Shockwave Coil',
    tag: 'TESLA TECH',
    summary: 'Explosions & deployed gear emit an electro-pulse that staggers nearby enemies.',
    accentHex: '#F59E0B',
    evolutionHint:
      'Evolves Turret Lv5 -> Tesla Coil & MML-4 Lv5 -> Swarm Barrage Pod',
  },
  extended_drums: {
    id: 'extended_drums',
    name: 'Extended Drums',
    tag: 'MAGAZINE',
    summary: '+25% magazine capacity and +15% faster reload cycles.',
    accentHex: '#EAB308',
    evolutionHint: 'Evolves Vulcan Minigun Lv5 -> Hellfire Gatling',
  },
  critical_optics: {
    id: 'critical_optics',
    name: 'Critical Optics',
    tag: 'PRECISION',
    summary: '+14% critical hit chance (2.1x gold crit damage multiplier).',
    accentHex: '#F59E0B',
    evolutionHint: 'Evolves Gauss Carbine Lv5 -> Singularity Railgun',
  },
  dash_shockwave: {
    id: 'dash_shockwave',
    name: 'Dash Shockwave',
    tag: 'MOBILITY',
    summary: 'Tactical Dash emits a kinetic pulse pushing enemies away and clearing acid.',
    accentHex: '#38BDF8',
    evolutionHint: 'Evolves Pulse Katana Lv5 -> Void Cleaver',
  },
};

export interface CursedPerkSpec {
  id: CursedPerkId;
  name: string;
  upside: string;
  downside: string;
  accentHex: string;
}

export const CURSED_PERK_ORDER: CursedPerkId[] = [
  'cursed_glass_cannon',
  'cursed_bloodthirst',
  'cursed_overclocked_legs',
];

export const CURSED_PERK_SPECS: Record<CursedPerkId, CursedPerkSpec> = {
  cursed_glass_cannon: {
    id: 'cursed_glass_cannon',
    name: 'Glass Cannon',
    upside: '+85% All Weapon & Explosive Damage',
    downside: '-40% Max HP for this run',
    accentHex: '#F43F5E',
  },
  cursed_bloodthirst: {
    id: 'cursed_bloodthirst',
    name: 'Bloodthirst',
    upside: 'Heal +3 HP on every infected kill',
    downside: 'Disables between-wave automatic healing',
    accentHex: '#E11D48',
  },
  cursed_overclocked_legs: {
    id: 'cursed_overclocked_legs',
    name: 'Overclocked Legs',
    upside: '+40% Move Speed & -35% Dash Cooldown',
    downside: '+25% Infected movement speed',
    accentHex: '#FB7185',
  },
};

export interface EvolutionSpec {
  id: EvolutionId;
  name: string;
  weaponId?: WeaponId;
  requirementLabel: string;
  summary: string;
  accentHex: string;
}

export const EVOLUTION_ORDER: EvolutionId[] = [
  'dragons_breath',
  'rail_smg',
  'tesla_coil',
  'phantom_enforcers',
  'absolute_zero',
  'void_cleaver',
  'hellfire_gatling',
  'singularity_railgun',
  'swarm_barrage',
  'napalm_bioblaster',
];

export const EVOLUTION_SPECS: Record<EvolutionId, EvolutionSpec> = {
  dragons_breath: {
    id: 'dragons_breath',
    weaponId: 'shotgun',
    name: "Dragon's Breath",
    requirementLabel: 'Shotgun Lv 5 + Incendiary',
    summary: '10-pellet wide flaming buckshot cone that ignites hordes on impact.',
    accentHex: '#F97316',
  },
  rail_smg: {
    id: 'rail_smg',
    weaponId: 'smg',
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
  phantom_enforcers: {
    id: 'phantom_enforcers',
    weaponId: 'twin9',
    name: 'Phantom Enforcers',
    requirementLabel: 'Twin-9 Lv 5 + Piercing Core',
    summary: 'Spectral akimbo rounds ricochet automatically up to 3 nearby targets.',
    accentHex: '#22D3EE',
  },
  absolute_zero: {
    id: 'absolute_zero',
    weaponId: 'cryo_carbine',
    name: 'Absolute Zero Beam',
    requirementLabel: 'Cryo-Carbine Lv 5 + Cryo Rounds',
    summary: 'Freezes infected solid; frozen eliminations shatter in an AoE frost nova.',
    accentHex: '#38BDF8',
  },
  void_cleaver: {
    id: 'void_cleaver',
    weaponId: 'pulse_katana',
    name: 'Void Cleaver',
    requirementLabel: 'Pulse Katana Lv 5 + Dash Shockwave',
    summary: 'Every katana slash launches piercing plasma crescent waves forward.',
    accentHex: '#C084FC',
  },
  hellfire_gatling: {
    id: 'hellfire_gatling',
    weaponId: 'vulcan_minigun',
    name: 'Hellfire Gatling',
    requirementLabel: 'Vulcan Minigun Lv 5 + Extended Drums',
    summary: 'High-RPM rotary barrel firing explosive incendiary splash rounds.',
    accentHex: '#FB923C',
  },
  singularity_railgun: {
    id: 'singularity_railgun',
    weaponId: 'gauss_carbine',
    name: 'Singularity Railgun',
    requirementLabel: 'Gauss Carbine Lv 5 + Critical Optics',
    summary: 'Hyper-pierces entire lines and spawns a gravity vortex pulling hordes inward.',
    accentHex: '#818CF8',
  },
  swarm_barrage: {
    id: 'swarm_barrage',
    weaponId: 'micro_launcher',
    name: 'Swarm Barrage Pod',
    requirementLabel: 'MML-4 Launcher Lv 5 + Shockwave Coil',
    summary: 'Unleashes 6 high-explosive homing micro-missiles every salvo.',
    accentHex: '#F97316',
  },
  napalm_bioblaster: {
    id: 'napalm_bioblaster',
    weaponId: 'chem_thrower',
    name: 'Napalm Bio-Blaster',
    requirementLabel: 'Chem-Thrower Lv 5 + Incendiary',
    summary: 'Coats the courtyard in persistent corrosive-napalm fire pools.',
    accentHex: '#84CC16',
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

export function rollCursedPerkChoice(
  ownedCursed: CursedPerkId[],
  rng: () => number = Math.random,
  chance = 0.25,
): CursedPerkId | null {
  const unowned = CURSED_PERK_ORDER.filter((c) => !ownedCursed.includes(c));
  if (unowned.length === 0) return null;
  if (rng() > chance) return null;
  const idx = Math.floor(rng() * unowned.length);
  return unowned[idx] ?? null;
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
    (weaponMastery.shotgun ?? 0) >= 5 &&
    perkSet.has('incendiary')
  ) {
    unlocked.push('dragons_breath');
  }
  if (
    !evolvedSet.has('rail_smg') &&
    (weaponMastery.smg ?? 0) >= 5 &&
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
  if (
    !evolvedSet.has('phantom_enforcers') &&
    (weaponMastery.twin9 ?? 0) >= 5 &&
    perkSet.has('piercing_core')
  ) {
    unlocked.push('phantom_enforcers');
  }
  if (
    !evolvedSet.has('absolute_zero') &&
    (weaponMastery.cryo_carbine ?? 0) >= 5 &&
    perkSet.has('cryo_rounds')
  ) {
    unlocked.push('absolute_zero');
  }
  if (
    !evolvedSet.has('void_cleaver') &&
    (weaponMastery.pulse_katana ?? 0) >= 5 &&
    perkSet.has('dash_shockwave')
  ) {
    unlocked.push('void_cleaver');
  }
  if (
    !evolvedSet.has('hellfire_gatling') &&
    (weaponMastery.vulcan_minigun ?? 0) >= 5 &&
    perkSet.has('extended_drums')
  ) {
    unlocked.push('hellfire_gatling');
  }
  if (
    !evolvedSet.has('singularity_railgun') &&
    (weaponMastery.gauss_carbine ?? 0) >= 5 &&
    perkSet.has('critical_optics')
  ) {
    unlocked.push('singularity_railgun');
  }
  if (
    !evolvedSet.has('swarm_barrage') &&
    (weaponMastery.micro_launcher ?? 0) >= 5 &&
    perkSet.has('shockwave_coil')
  ) {
    unlocked.push('swarm_barrage');
  }
  if (
    !evolvedSet.has('napalm_bioblaster') &&
    (weaponMastery.chem_thrower ?? 0) >= 5 &&
    perkSet.has('incendiary')
  ) {
    unlocked.push('napalm_bioblaster');
  }

  return unlocked;
}

const WEAPON_TO_EVOLUTION: Partial<Record<WeaponId, EvolutionId>> = {
  shotgun: 'dragons_breath',
  smg: 'rail_smg',
  twin9: 'phantom_enforcers',
  cryo_carbine: 'absolute_zero',
  pulse_katana: 'void_cleaver',
  vulcan_minigun: 'hellfire_gatling',
  gauss_carbine: 'singularity_railgun',
  micro_launcher: 'swarm_barrage',
  chem_thrower: 'napalm_bioblaster',
};

export function getEvolvedWeaponDisplay(
  weaponId: WeaponId,
  defaultName: string,
  evolvedWeapons: EvolutionId[],
): { name: string; isEvolved: boolean } {
  const evoId = WEAPON_TO_EVOLUTION[weaponId];
  if (evoId && evolvedWeapons.includes(evoId)) {
    return { name: EVOLUTION_SPECS[evoId].name, isEvolved: true };
  }
  return { name: defaultName, isEvolved: false };
}

export function getWeaponEvolutionHint(weaponId: WeaponId): string | null {
  const evoId = WEAPON_TO_EVOLUTION[weaponId];
  if (!evoId) return null;
  const spec = EVOLUTION_SPECS[evoId];
  return `${spec.requirementLabel} -> ${spec.name}`;
}
