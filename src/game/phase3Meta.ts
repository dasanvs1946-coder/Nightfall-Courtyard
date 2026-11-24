import { hashSeedString } from './dailyChallenge';
import {
  DailyContractEventType,
  DailyContractsState,
  DailyContractSpec,
  TechLabLevels,
  TechLabUpgradeId,
  WeaponCamoId,
  WeeklyMutatorId,
} from './types';

// -----------------------------------------------------------------------------
// Weekly Mutator Trials
// -----------------------------------------------------------------------------

export interface WeeklyMutatorSpec {
  id: WeeklyMutatorId;
  name: string;
  badge: string;
  description: string;
  accentHex: string;
}

export const WEEKLY_MUTATOR_ORDER: WeeklyMutatorId[] = [
  'one_hit_chaos',
  'explosives_only',
  'hyper_speed_2x',
  'zero_reload',
  'all_elite_nightmare',
];

export const WEEKLY_MUTATOR_SPECS: Record<WeeklyMutatorId, WeeklyMutatorSpec> = {
  one_hit_chaos: {
    id: 'one_hit_chaos',
    name: 'One-Hit Chaos',
    badge: 'GLASS LETHAL',
    description: 'Player deals 3x weapon damage, but any enemy hit deals 85% max HP.',
    accentHex: '#EF4444',
  },
  explosives_only: {
    id: 'explosives_only',
    name: 'Explosives Only',
    badge: 'ORDNANCE',
    description: 'Launchers, Flamethrower, Chem & blast gadgets deal 2.2x damage; bullets deal 35%.',
    accentHex: '#F97316',
  },
  hyper_speed_2x: {
    id: 'hyper_speed_2x',
    name: 'Hyper-Speed 2x',
    badge: '2X VELOCITY',
    description: 'Zombies sprint at 2x speed while survivors gain +35% speed & faster dash.',
    accentHex: '#38BDF8',
  },
  zero_reload: {
    id: 'zero_reload',
    name: 'Zero-Reload Madness',
    badge: 'BOTTOMLESS',
    description: 'Bottomless magazines & infinite reserve ammo across every weapon.',
    accentHex: '#22C55E',
  },
  all_elite_nightmare: {
    id: 'all_elite_nightmare',
    name: 'All-Elite Nightmare',
    badge: 'ALL ELITE',
    description: 'Every infected spawns with a randomized Elite Affix & +35% HP.',
    accentHex: '#A855F7',
  },
};

export function getUtcWeekKey(date: Date = new Date()): string {
  // Compute ISO-8601 UTC week key e.g. "2026-W47"
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeeklyTrialConfig(weekKey: string = getUtcWeekKey()): {
  weekKey: string;
  mutator: WeeklyMutatorId;
  spec: WeeklyMutatorSpec;
} {
  const seed = hashSeedString(`weekly:${weekKey}`);
  const mutator = WEEKLY_MUTATOR_ORDER[seed % WEEKLY_MUTATOR_ORDER.length];
  return {
    weekKey,
    mutator,
    spec: WEEKLY_MUTATOR_SPECS[mutator],
  };
}

// -----------------------------------------------------------------------------
// Extraction Mode Constants & Multipliers
// -----------------------------------------------------------------------------

export const EXTRACTION_HOLD_SEC = 20;

export function isExtractionWave(wave: number): boolean {
  return wave >= 5 && wave % 5 === 0;
}

export function getExtractionMultiplier(wave: number): number {
  const cycle = Math.max(1, Math.floor(Math.max(5, wave) / 5));
  return 2 + cycle; // Wave 5 => 3x, Wave 10 => 4x, Wave 15 => 5x
}

// -----------------------------------------------------------------------------
// Permanent TECH LAB Skill Tree (5 Tiers)
// -----------------------------------------------------------------------------

export const TECH_LAB_MAX_TIER = 5;

export const TECH_LAB_ORDER: TechLabUpgradeId[] = [
  'reinforced_plating',
  'kinetic_thrusters',
  'precision_optics',
  'tactical_rig',
  'salvage_protocol',
];

export interface TechLabUpgradeSpec {
  id: TechLabUpgradeId;
  name: string;
  branchTag: string;
  effectSummary: string;
  accentHex: string;
  tierCosts: [number, number, number, number, number];
}

export const TECH_LAB_SPECS: Record<TechLabUpgradeId, TechLabUpgradeSpec> = {
  reinforced_plating: {
    id: 'reinforced_plating',
    name: 'Reinforced Plating',
    branchTag: 'ARMOR',
    effectSummary: '+20 Max HP & +4% Armor DR per tier',
    accentHex: '#38BDF8',
    tierCosts: [45, 75, 115, 165, 225],
  },
  kinetic_thrusters: {
    id: 'kinetic_thrusters',
    name: 'Kinetic Thrusters',
    branchTag: 'MOBILITY',
    effectSummary: '-6% Dash CD & +3% Move Speed per tier',
    accentHex: '#22D3EE',
    tierCosts: [40, 70, 105, 150, 210],
  },
  precision_optics: {
    id: 'precision_optics',
    name: 'Precision Optics',
    branchTag: 'BALLISTICS',
    effectSummary: '+3% Crit Chance & +15% Crit Damage per tier',
    accentHex: '#F59E0B',
    tierCosts: [50, 85, 125, 175, 240],
  },
  tactical_rig: {
    id: 'tactical_rig',
    name: 'Tactical Rig',
    branchTag: 'GADGETS',
    effectSummary: '+1 Max Gadget Charge at T1/T3/T5 & -6% Gadget CD / tier',
    accentHex: '#A855F7',
    tierCosts: [55, 90, 135, 185, 250],
  },
  salvage_protocol: {
    id: 'salvage_protocol',
    name: 'Salvage Protocol',
    branchTag: 'ECONOMY',
    effectSummary: '+12% Scrap Earned / tier & +1 Perk Reroll at T1/T3/T5',
    accentHex: '#22C55E',
    tierCosts: [50, 85, 130, 180, 245],
  },
};

export function createDefaultTechLabLevels(): TechLabLevels {
  return {
    reinforced_plating: 0,
    kinetic_thrusters: 0,
    precision_optics: 0,
    tactical_rig: 0,
    salvage_protocol: 0,
  };
}

export function getTechLabUpgradeCost(
  id: TechLabUpgradeId,
  currentTier: number,
): number {
  const clamped = Math.max(0, Math.min(TECH_LAB_MAX_TIER - 1, Math.floor(currentTier)));
  return TECH_LAB_SPECS[id].tierCosts[clamped];
}

export interface TechLabBonuses {
  maxHpBonus: number;
  armorDrBonus: number;
  dashCooldownMult: number;
  moveSpeedMult: number;
  critChanceBonus: number;
  critDamageBonus: number;
  bonusGadgetCharges: number;
  gadgetCooldownMult: number;
  scrapMult: number;
  startingPerkRerolls: number;
}

export function getTechLabBonuses(techLab: TechLabLevels): TechLabBonuses {
  const plating = Math.max(0, Math.min(TECH_LAB_MAX_TIER, techLab.reinforced_plating || 0));
  const thrusters = Math.max(0, Math.min(TECH_LAB_MAX_TIER, techLab.kinetic_thrusters || 0));
  const optics = Math.max(0, Math.min(TECH_LAB_MAX_TIER, techLab.precision_optics || 0));
  const rig = Math.max(0, Math.min(TECH_LAB_MAX_TIER, techLab.tactical_rig || 0));
  const salvage = Math.max(0, Math.min(TECH_LAB_MAX_TIER, techLab.salvage_protocol || 0));

  return {
    maxHpBonus: plating * 20,
    armorDrBonus: plating * 0.04,
    dashCooldownMult: Math.max(0.65, 1 - thrusters * 0.06),
    moveSpeedMult: 1 + thrusters * 0.03,
    critChanceBonus: optics * 0.03,
    critDamageBonus: optics * 0.15,
    bonusGadgetCharges: Math.ceil(rig / 2), // T1->1, T3->2, T5->3
    gadgetCooldownMult: Math.max(0.65, 1 - rig * 0.06),
    scrapMult: 1 + salvage * 0.12,
    startingPerkRerolls: Math.ceil(salvage / 2), // T1->1, T3->2, T5->3
  };
}

// -----------------------------------------------------------------------------
// Weapon Mastery Camos
// -----------------------------------------------------------------------------

export interface WeaponCamoSpec {
  id: WeaponCamoId;
  name: string;
  killMilestone: number;
  damageBonusPct: number;
  accentHex: string;
  swatchColor: number;
  metalness: number;
  roughness: number;
  emissiveColor: number;
  emissiveIntensity: number;
}

export const WEAPON_CAMO_ORDER: WeaponCamoId[] = [
  'none',
  'carbon_fiber',
  'tactical_gold',
  'reactive_neon',
];

export const WEAPON_CAMO_SPECS: Record<WeaponCamoId, WeaponCamoSpec> = {
  none: {
    id: 'none',
    name: 'Factory Issue',
    killMilestone: 0,
    damageBonusPct: 0,
    accentHex: '#64748B',
    swatchColor: 0x334155,
    metalness: 0.6,
    roughness: 0.4,
    emissiveColor: 0x000000,
    emissiveIntensity: 0,
  },
  carbon_fiber: {
    id: 'carbon_fiber',
    name: 'Carbon Fiber',
    killMilestone: 100,
    damageBonusPct: 5,
    accentHex: '#94A3B8',
    swatchColor: 0x181c24,
    metalness: 0.78,
    roughness: 0.28,
    emissiveColor: 0x334155,
    emissiveIntensity: 0.25,
  },
  tactical_gold: {
    id: 'tactical_gold',
    name: 'Tactical Gold',
    killMilestone: 500,
    damageBonusPct: 10,
    accentHex: '#F59E0B',
    swatchColor: 0xf59e0b,
    metalness: 0.92,
    roughness: 0.18,
    emissiveColor: 0xd97706,
    emissiveIntensity: 0.35,
  },
  reactive_neon: {
    id: 'reactive_neon',
    name: 'Reactive Neon',
    killMilestone: 1500,
    damageBonusPct: 15,
    accentHex: '#22D3EE',
    swatchColor: 0x0891b2,
    metalness: 0.85,
    roughness: 0.16,
    emissiveColor: 0x22d3ee,
    emissiveIntensity: 1.05,
  },
};

export function getUnlockedWeaponCamos(kills: number): WeaponCamoId[] {
  const safeKills = Math.max(0, Math.floor(kills));
  return WEAPON_CAMO_ORDER.filter(
    (camo) => safeKills >= WEAPON_CAMO_SPECS[camo].killMilestone,
  );
}

export function getHighestUnlockedCamo(kills: number): WeaponCamoId {
  const unlocked = getUnlockedWeaponCamos(kills);
  return unlocked[unlocked.length - 1] ?? 'none';
}

export function getWeaponCamoDamageMultiplier(kills: number): number {
  const highest = getHighestUnlockedCamo(kills);
  return 1 + WEAPON_CAMO_SPECS[highest].damageBonusPct / 100;
}

export function getNextCamoMilestone(kills: number): {
  nextCamo: WeaponCamoId | null;
  target: number;
  current: number;
} {
  const safeKills = Math.max(0, Math.floor(kills));
  for (const id of WEAPON_CAMO_ORDER) {
    if (id === 'none') continue;
    const req = WEAPON_CAMO_SPECS[id].killMilestone;
    if (safeKills < req) {
      return { nextCamo: id, target: req, current: safeKills };
    }
  }
  return { nextCamo: null, target: 1500, current: safeKills };
}

// -----------------------------------------------------------------------------
// 3 Rotating Daily Contracts
// -----------------------------------------------------------------------------

export const DAILY_CONTRACTS_PER_DAY = 3;

export const DAILY_CONTRACT_POOL: DailyContractSpec[] = [
  {
    id: 'contract_juggernaut_shatter',
    title: 'Armor Breaker',
    description: 'Shatter 8 Juggernaut Shields with heavy arms or blasts.',
    eventType: 'juggernaut_shatter',
    target: 8,
    scrapReward: 75,
    accentHex: '#F59E0B',
  },
  {
    id: 'contract_combo_35',
    title: 'Relentless Momentum',
    description: 'Reach a 3.5x Killstreak Combo multiplier in a single run.',
    eventType: 'reach_combo',
    target: 35,
    valueScale: 10,
    valueSuffix: 'x',
    scrapReward: 70,
    accentHex: '#EF4444',
  },
  {
    id: 'contract_emp_elites',
    title: 'Signal Purger',
    description: 'Eliminate 4 EMP Jammer Elites.',
    eventType: 'emp_elite_kill',
    target: 4,
    scrapReward: 80,
    accentHex: '#A855F7',
  },
  {
    id: 'contract_boss_slayer',
    title: 'Warden Takedown',
    description: 'Defeat 2 Iron Warden Bosses in any competitive mode.',
    eventType: 'boss_kill',
    target: 2,
    scrapReward: 95,
    accentHex: '#F43F5E',
  },
  {
    id: 'contract_extraction_run',
    title: 'Clean Exfil',
    description: 'Complete 1 successful Extraction Chopper exfil.',
    eventType: 'extraction_complete',
    target: 1,
    scrapReward: 90,
    accentHex: '#22C55E',
  },
  {
    id: 'contract_gadget_ops',
    title: 'Field Engineer',
    description: 'Deploy 10 Tactical Gadgets (Tripmines, Decoys, Wire, Mortar).',
    eventType: 'gadget_deploy',
    target: 10,
    scrapReward: 65,
    accentHex: '#38BDF8',
  },
  {
    id: 'contract_rifle_smg_kills',
    title: 'Automatic Sweep',
    description: 'Score 180 kills using Assault Rifles or SMGs.',
    eventType: 'rifle_smg_kill',
    target: 180,
    scrapReward: 75,
    accentHex: '#22D3EE',
  },
  {
    id: 'contract_blackout_siege',
    title: 'Hold The Perimeter',
    description: 'Clear 6 waves in Blackout or Siege Defense.',
    eventType: 'blackout_siege_wave',
    target: 6,
    scrapReward: 85,
    accentHex: '#FBBF24',
  },
];

function getUtcDateStr(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyContractsForDate(
  dateKey: string = getUtcDateStr(),
): DailyContractSpec[] {
  const pool = [...DAILY_CONTRACT_POOL];
  let seed = hashSeedString(`contracts:${dateKey}`);
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, DAILY_CONTRACTS_PER_DAY);
}

export function createDefaultDailyContractsState(
  dateKey: string = getUtcDateStr(),
): DailyContractsState {
  return {
    dateKey,
    progress: {},
    claimedIds: [],
  };
}

export function refreshDailyContractsForDate(
  state: DailyContractsState | undefined,
  dateKey: string = getUtcDateStr(),
): DailyContractsState {
  if (!state || state.dateKey !== dateKey) {
    return createDefaultDailyContractsState(dateKey);
  }
  const activeIds = new Set(getDailyContractsForDate(dateKey).map((c) => c.id));
  const cleanProgress: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.progress || {})) {
    if (activeIds.has(k) && Number.isFinite(v) && v > 0) {
      cleanProgress[k] = Math.floor(v);
    }
  }
  const cleanClaimed = Array.isArray(state.claimedIds)
    ? Array.from(new Set(state.claimedIds.filter((id) => activeIds.has(id))))
    : [];
  return {
    dateKey,
    progress: cleanProgress,
    claimedIds: cleanClaimed,
  };
}

export function recordContractEvent(
  state: DailyContractsState,
  eventType: DailyContractEventType,
  amount = 1,
  dateKey: string = getUtcDateStr(),
): { state: DailyContractsState; newlyCompleted: DailyContractSpec[] } {
  const next = refreshDailyContractsForDate(state, dateKey);
  const active = getDailyContractsForDate(dateKey);
  const newlyCompleted: DailyContractSpec[] = [];
  const nextProgress = { ...next.progress };

  for (const spec of active) {
    if (spec.eventType !== eventType) continue;
    const prev = nextProgress[spec.id] ?? 0;
    if (prev >= spec.target) continue;
    const updated =
      eventType === 'reach_combo'
        ? Math.min(spec.target, Math.max(prev, Math.floor(amount)))
        : Math.min(spec.target, prev + Math.max(1, Math.floor(amount)));
    nextProgress[spec.id] = updated;
    if (updated >= spec.target && prev < spec.target) {
      newlyCompleted.push(spec);
    }
  }

  return {
    state: {
      dateKey: next.dateKey,
      progress: nextProgress,
      claimedIds: [...next.claimedIds],
    },
    newlyCompleted,
  };
}

export function getClaimableDailyContractsCount(
  state: DailyContractsState,
  dateKey: string = getUtcDateStr(),
): number {
  const refreshed = refreshDailyContractsForDate(state, dateKey);
  const active = getDailyContractsForDate(dateKey);
  return active.filter((c) => {
    const prog = refreshed.progress[c.id] ?? 0;
    return prog >= c.target && !refreshed.claimedIds.includes(c.id);
  }).length;
}
