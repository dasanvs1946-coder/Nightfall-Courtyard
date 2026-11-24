import { ALL_DRONE_IDS, DRONE_ORDER, DRONE_SPECS } from './drones';
import {
  createDefaultDailyContractsState,
  createDefaultTechLabLevels,
  getDailyContractsForDate,
  getTechLabUpgradeCost,
  getUnlockedWeaponCamos,
  refreshDailyContractsForDate,
  TECH_LAB_MAX_TIER,
  TECH_LAB_ORDER,
  WEAPON_CAMO_ORDER,
} from './phase3Meta';
import { StorageLike } from './storage';
import {
  CareerStats,
  DroneId,
  EquippedWeaponCamos,
  KillsByEnemyType,
  KillsByWeapon,
  PermanentUpgradeId,
  PermanentUpgrades,
  SkinId,
  SurvivorClassId,
  TechLabUpgradeId,
  WeaponCamoId,
  WeaponId,
  ZombieKind,
} from './types';
import { PHASE1_ARMORY_WEAPONS, WEAPON_ORDER, WEAPON_SPECS } from './weapons';

export const CAREER_STORAGE_KEY = 'nightfall_courtyard_career_v1';

export const ZOMBIE_KIND_ORDER: ZombieKind[] = [
  'walker',
  'runner',
  'brute',
  'spitter',
  'stalker',
  'breacher',
  'bomber',
  'howler',
  'juggernaut',
  'siege_breaker',
  'necromancer',
  'matriarch',
  'crawler',
  'ravager',
  'boss',
];

export const SKIN_ORDER: SkinId[] = [
  'nightwatch',
  'crimson_recon',
  'hazmat_breacher',
  'cyber_ronin',
  'storm_phantom',
  'golden_sovereign',
];

export interface SkinSpec {
  id: SkinId;
  name: string;
  subtitle: string;
  unlockRequirementText: string;
  fxTags: string[];
  armorColor: number;
  clothColor: number;
  pouchColor: number;
  visorColor: number;
  trimColor: number;
  beamColor: number;
  coneColor: number;
  trailColor: number;
  reviveColor: number;
  emissiveIntensity: number;
  hasBioPack?: boolean;
  hasKatana?: boolean;
  hasHood?: boolean;
  hasExoTrim?: boolean;
  previewAccentHex: string;
}

export const SKIN_SPECS: Record<SkinId, SkinSpec> = {
  nightwatch: {
    id: 'nightwatch',
    name: 'Nightwatch Operative',
    subtitle: 'Standard courtyard tactical responder',
    unlockRequirementText: 'Free Default Issue',
    fxTags: ['Slate Gear', 'Cyan Beam'],
    armorColor: 0x334155,
    clothColor: 0x1e293b,
    pouchColor: 0x475569,
    visorColor: 0x38bdf8,
    trimColor: 0x38bdf8,
    beamColor: 0xe0f2fe,
    coneColor: 0xbae6fd,
    trailColor: 0x38bdf8,
    reviveColor: 0x38bdf8,
    emissiveIntensity: 1.65,
    previewAccentHex: '#38bdf8',
  },
  crimson_recon: {
    id: 'crimson_recon',
    name: 'Crimson Recon',
    subtitle: 'Stealth black rig with ruby optics',
    unlockRequirementText: '150 Total Kills',
    fxTags: ['#EF4444 Visor', 'Red Dash Trail'],
    armorColor: 0x18181b,
    clothColor: 0x09090b,
    pouchColor: 0x27272a,
    visorColor: 0xef4444,
    trimColor: 0xef4444,
    beamColor: 0xfecaca,
    coneColor: 0xfca5a5,
    trailColor: 0xef4444,
    reviveColor: 0xef4444,
    emissiveIntensity: 2.0,
    previewAccentHex: '#EF4444',
  },
  hazmat_breacher: {
    id: 'hazmat_breacher',
    name: 'Bio-Hazmat Breacher',
    subtitle: 'Containment plating & pressurized bio-pack',
    unlockRequirementText: 'Reach Wave 5',
    fxTags: ['Green Bio-Pack', '#22C55E Beam'],
    armorColor: 0xeab308,
    clothColor: 0x111827,
    pouchColor: 0x1f2937,
    visorColor: 0x22c55e,
    trimColor: 0x22c55e,
    beamColor: 0x22c55e,
    coneColor: 0x4ade80,
    trailColor: 0x22c55e,
    reviveColor: 0x22c55e,
    emissiveIntensity: 1.9,
    hasBioPack: true,
    previewAccentHex: '#22C55E',
  },
  cyber_ronin: {
    id: 'cyber_ronin',
    name: 'Cyber Ronin',
    subtitle: 'Obsidian cyber frame & spine blade',
    unlockRequirementText: '500 Total Kills',
    fxTags: ['Back Katana', 'Ice-Blue Trail'],
    armorColor: 0x0f172a,
    clothColor: 0x090a0f,
    pouchColor: 0x1e293b,
    visorColor: 0x06b6d4,
    trimColor: 0x06b6d4,
    beamColor: 0x67e8f9,
    coneColor: 0x22d3ee,
    trailColor: 0x38bdf8,
    reviveColor: 0x06b6d4,
    emissiveIntensity: 2.2,
    hasKatana: true,
    previewAccentHex: '#06B6D4',
  },
  storm_phantom: {
    id: 'storm_phantom',
    name: 'Storm Phantom',
    subtitle: 'Hooded shroud & ultraviolet spotlight',
    unlockRequirementText: 'Wave 10 or 25,000 Score',
    fxTags: ['Hooded Cloak', 'UV Beam'],
    armorColor: 0x1e1b4b,
    clothColor: 0x090814,
    pouchColor: 0x312e81,
    visorColor: 0xa855f7,
    trimColor: 0xa855f7,
    beamColor: 0xc084fc,
    coneColor: 0xa855f7,
    trailColor: 0xa855f7,
    reviveColor: 0xa855f7,
    emissiveIntensity: 2.25,
    hasHood: true,
    previewAccentHex: '#A855F7',
  },
  golden_sovereign: {
    id: 'golden_sovereign',
    name: 'Golden Sovereign',
    subtitle: 'Brushed gold exo-suit for apex survivors',
    unlockRequirementText: '1,500 Kills or 50,000 Score',
    fxTags: ['Amber Spotlight', 'Gold Revive'],
    armorColor: 0xf59e0b,
    clothColor: 0x111827,
    pouchColor: 0x78350f,
    visorColor: 0xfbbf24,
    trimColor: 0xf59e0b,
    beamColor: 0xfde68a,
    coneColor: 0xf59e0b,
    trailColor: 0xf59e0b,
    reviveColor: 0xf59e0b,
    emissiveIntensity: 2.35,
    hasExoTrim: true,
    previewAccentHex: '#F59E0B',
  },
};

export interface SkinProgressInfo {
  unlocked: boolean;
  current: number;
  target: number;
  ratio: number;
  label: string;
}

export function isSkinUnlockSatisfied(
  skinId: SkinId,
  career: CareerStats,
): boolean {
  switch (skinId) {
    case 'nightwatch':
      return true;
    case 'crimson_recon':
      return career.totalKills >= 150;
    case 'hazmat_breacher':
      return career.bestWave >= 5;
    case 'cyber_ronin':
      return career.totalKills >= 500;
    case 'storm_phantom':
      return career.bestWave >= 10 || career.bestScore >= 25000;
    case 'golden_sovereign':
      return career.totalKills >= 1500 || career.bestScore >= 50000;
  }
}

export function getSkinProgress(
  skinId: SkinId,
  career: CareerStats,
): SkinProgressInfo {
  const alreadyUnlocked =
    career.unlockedSkins.includes(skinId) || isSkinUnlockSatisfied(skinId, career);
  switch (skinId) {
    case 'nightwatch':
      return { unlocked: true, current: 1, target: 1, ratio: 1, label: 'Unlocked' };
    case 'crimson_recon': {
      const c = Math.min(150, career.totalKills);
      return {
        unlocked: alreadyUnlocked,
        current: c,
        target: 150,
        ratio: c / 150,
        label: `${career.totalKills}/150 Kills`,
      };
    }
    case 'hazmat_breacher': {
      const c = Math.min(5, career.bestWave);
      return {
        unlocked: alreadyUnlocked,
        current: c,
        target: 5,
        ratio: c / 5,
        label: `Wave ${career.bestWave}/5`,
      };
    }
    case 'cyber_ronin': {
      const c = Math.min(500, career.totalKills);
      return {
        unlocked: alreadyUnlocked,
        current: c,
        target: 500,
        ratio: c / 500,
        label: `${career.totalKills}/500 Kills`,
      };
    }
    case 'storm_phantom': {
      const waveRatio = Math.min(1, career.bestWave / 10);
      const scoreRatio = Math.min(1, career.bestScore / 25000);
      const useWave = waveRatio >= scoreRatio;
      return {
        unlocked: alreadyUnlocked,
        current: useWave ? Math.min(10, career.bestWave) : Math.min(25000, career.bestScore),
        target: useWave ? 10 : 25000,
        ratio: Math.max(waveRatio, scoreRatio),
        label: useWave
          ? `Wave ${career.bestWave}/10`
          : `${career.bestScore.toLocaleString()}/25,000`,
      };
    }
    case 'golden_sovereign': {
      const killRatio = Math.min(1, career.totalKills / 1500);
      const scoreRatio = Math.min(1, career.bestScore / 50000);
      const useKills = killRatio >= scoreRatio;
      return {
        unlocked: alreadyUnlocked,
        current: useKills
          ? Math.min(1500, career.totalKills)
          : Math.min(50000, career.bestScore),
        target: useKills ? 1500 : 50000,
        ratio: Math.max(killRatio, scoreRatio),
        label: useKills
          ? `${career.totalKills}/1,500 Kills`
          : `${career.bestScore.toLocaleString()}/50,000`,
      };
    }
  }
}

export const CLASS_ORDER: SurvivorClassId[] = [
  'vanguard',
  'engineer',
  'recon',
  'demolitionist',
];

export interface SurvivorClassSpec {
  id: SurvivorClassId;
  name: string;
  roleTag: string;
  unlockRequirementText: string;
  perksSummary: string;
  accentHex: string;
  reviveShockwaveRadiusMult: number;
  reviveShockwavePushMult: number;
  startsWithFreeTurret: boolean;
  turretFireRateMult: number;
  moveSpeedMult: number;
  dashCooldownMult: number;
  flashlightConeMult: number;
  blastRadiusMult: number;
  gearCooldownMult: number;
  bonusMineCap: number;
  startsWithBonusMine: boolean;
}

export const CLASS_SPECS: Record<SurvivorClassId, SurvivorClassSpec> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    roleTag: 'Balanced Responder',
    unlockRequirementText: 'Default Class',
    perksSummary: 'Balanced HP · +35% Revive Shockwave Radius & Knockback',
    accentHex: '#38bdf8',
    reviveShockwaveRadiusMult: 1.35,
    reviveShockwavePushMult: 1.25,
    startsWithFreeTurret: false,
    turretFireRateMult: 1.0,
    moveSpeedMult: 1.0,
    dashCooldownMult: 1.0,
    flashlightConeMult: 1.0,
    blastRadiusMult: 1.0,
    gearCooldownMult: 1.0,
    bonusMineCap: 0,
    startsWithBonusMine: false,
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    roleTag: 'Tactical Specialist',
    unlockRequirementText: 'Reach Wave 8',
    perksSummary: 'Starts with 1 Free Sentry Turret · +25% Turret Fire Rate',
    accentHex: '#22c55e',
    reviveShockwaveRadiusMult: 1.0,
    reviveShockwavePushMult: 1.0,
    startsWithFreeTurret: true,
    turretFireRateMult: 1.25,
    moveSpeedMult: 1.0,
    dashCooldownMult: 1.0,
    flashlightConeMult: 1.0,
    blastRadiusMult: 1.0,
    gearCooldownMult: 1.0,
    bonusMineCap: 0,
    startsWithBonusMine: false,
  },
  recon: {
    id: 'recon',
    name: 'Recon',
    roleTag: 'High-Mobility Scout',
    unlockRequirementText: '300 Total Kills',
    perksSummary: '+12% Move Speed · -18% Dash Cooldown · +35% Flashlight Cone',
    accentHex: '#a855f7',
    reviveShockwaveRadiusMult: 1.0,
    reviveShockwavePushMult: 1.0,
    startsWithFreeTurret: false,
    turretFireRateMult: 1.0,
    moveSpeedMult: 1.12,
    dashCooldownMult: 0.82,
    flashlightConeMult: 1.35,
    blastRadiusMult: 1.0,
    gearCooldownMult: 1.0,
    bonusMineCap: 0,
    startsWithBonusMine: false,
  },
  demolitionist: {
    id: 'demolitionist',
    name: 'Demolitionist',
    roleTag: 'Ordnance Breacher',
    unlockRequirementText: '5 Boss Kills',
    perksSummary: '+30% Blast Radius · -20% Gear Cooldown · +1 Starting Mine',
    accentHex: '#f59e0b',
    reviveShockwaveRadiusMult: 1.0,
    reviveShockwavePushMult: 1.0,
    startsWithFreeTurret: false,
    turretFireRateMult: 1.0,
    moveSpeedMult: 1.0,
    dashCooldownMult: 1.0,
    flashlightConeMult: 1.0,
    blastRadiusMult: 1.3,
    gearCooldownMult: 0.8,
    bonusMineCap: 1,
    startsWithBonusMine: true,
  },
};

export function isClassUnlocked(
  classId: SurvivorClassId,
  career: CareerStats,
): boolean {
  switch (classId) {
    case 'vanguard':
      return true;
    case 'engineer':
      return career.bestWave >= 8;
    case 'recon':
      return career.totalKills >= 300;
    case 'demolitionist':
      return career.bossesKilled >= 5;
  }
}

export function getClassProgressText(
  classId: SurvivorClassId,
  career: CareerStats,
): string {
  switch (classId) {
    case 'vanguard':
      return 'Unlocked';
    case 'engineer':
      return `Wave ${Math.min(8, career.bestWave)}/8`;
    case 'recon':
      return `${Math.min(300, career.totalKills)}/300 Kills`;
    case 'demolitionist':
      return `${Math.min(5, career.bossesKilled)}/5 Bosses`;
  }
}

export const PERMANENT_UPGRADE_ORDER: PermanentUpgradeId[] = [
  'baseHp',
  'reloadSpeed',
  'startingUp',
  'dashCooldown',
];

export interface PermanentUpgradeSpec {
  id: PermanentUpgradeId;
  name: string;
  effectPerLevel: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
}

export const PERMANENT_UPGRADE_SPECS: Record<
  PermanentUpgradeId,
  PermanentUpgradeSpec
> = {
  baseHp: {
    id: 'baseHp',
    name: 'Reinforced Vest',
    effectPerLevel: '+10 Base Max HP / lv',
    maxLevel: 10,
    baseCost: 15,
    costStep: 10,
  },
  reloadSpeed: {
    id: 'reloadSpeed',
    name: 'Sleight of Hand',
    effectPerLevel: '+4% Reload Speed / lv',
    maxLevel: 10,
    baseCost: 18,
    costStep: 12,
  },
  startingUp: {
    id: 'startingUp',
    name: 'Tactical Cache',
    effectPerLevel: '+1 Starting UP / lv',
    maxLevel: 8,
    baseCost: 25,
    costStep: 15,
  },
  dashCooldown: {
    id: 'dashCooldown',
    name: 'Pneumatic Thrusters',
    effectPerLevel: '-3% Dash Cooldown / lv',
    maxLevel: 10,
    baseCost: 20,
    costStep: 12,
  },
};

export function getPermanentUpgradeCost(
  id: PermanentUpgradeId,
  currentLevel: number,
): number {
  const spec = PERMANENT_UPGRADE_SPECS[id];
  return spec.baseCost + Math.max(0, currentLevel) * spec.costStep;
}

export function getPermanentBaseHpBonus(upgrades: PermanentUpgrades): number {
  return Math.max(0, upgrades.baseHp) * 10;
}

export function getPermanentReloadMultiplier(
  upgrades: PermanentUpgrades,
): number {
  return 1 / (1 + Math.max(0, upgrades.reloadSpeed) * 0.04);
}

export function getPermanentStartingUpBonus(
  upgrades: PermanentUpgrades,
): number {
  return Math.max(0, upgrades.startingUp);
}

export function getPermanentDashCooldownMultiplier(
  upgrades: PermanentUpgrades,
): number {
  return Math.max(0.65, 1 - Math.max(0, upgrades.dashCooldown) * 0.03);
}

export const BESTIARY_MILESTONE_STEP = 100;
export const BESTIARY_MAX_MILESTONE_TIERS = 5;

export interface BestiaryEntrySpec {
  kind: ZombieKind;
  name: string;
  threatLevel: string;
  firstWave: string;
  intelNote: string;
  accentHex: string;
}

export const BESTIARY_ENTRIES: BestiaryEntrySpec[] = [
  {
    kind: 'walker',
    name: 'Walker',
    threatLevel: 'Low',
    firstWave: 'Wave 1+',
    intelNote: 'Shambling infected that weaves in packs to flank isolated targets.',
    accentHex: '#a3e635',
  },
  {
    kind: 'runner',
    name: 'Runner',
    threatLevel: 'Moderate',
    firstWave: 'Wave 1+',
    intelNote: 'Frenzied sprinter with exposed crimson spine nodes. Circles before closing.',
    accentHex: '#ef4444',
  },
  {
    kind: 'brute',
    name: 'Brute',
    threatLevel: 'High',
    firstWave: 'Wave 2+',
    intelNote: 'Concrete-maul juggernaut. Watch for red windup rings before slams.',
    accentHex: '#f97316',
  },
  {
    kind: 'bomber',
    name: 'Volatile Bomber',
    threatLevel: 'High',
    firstWave: 'Wave 3+',
    intelNote: 'Pressurized volatile pustules detonate on death—snipe inside packs to chain-clear hordes.',
    accentHex: '#fb923c',
  },
  {
    kind: 'spitter',
    name: 'Acid Spitter',
    threatLevel: 'High',
    firstWave: 'Wave 4+',
    intelNote: 'Kites at mid-range and lobs corrosive globs that leave damaging floor pools.',
    accentHex: '#84cc16',
  },
  {
    kind: 'howler',
    name: 'Howler',
    threatLevel: 'High',
    firstWave: 'Wave 6+',
    intelNote: 'Bio-acoustic screamer whose pulsing roar accelerates nearby infected by 35%. Eliminate fast.',
    accentHex: '#fbbf24',
  },
  {
    kind: 'stalker',
    name: 'Shadow Stalker',
    threatLevel: 'Severe',
    firstWave: 'Wave 7+',
    intelNote: 'Cloaked ambusher revealed cleanly inside your flashlight cone or active floodlights.',
    accentHex: '#a855f7',
  },
  {
    kind: 'breacher',
    name: 'Riot Breacher',
    threatLevel: 'Severe',
    firstWave: 'Wave 10+',
    intelNote: 'Ballistic shield blocks 65% frontal bullet damage. Flank, dash behind, or detonate barrels.',
    accentHex: '#38bdf8',
  },
  {
    kind: 'juggernaut',
    name: 'Juggernaut Charger',
    threatLevel: 'Severe',
    firstWave: 'Wave 4+',
    intelNote: 'Heavy frontal armor reduces rapid gunfire by 60% until shattered by Gauss, Railgun, Katana, Chem, or explosives. Charges straight through floor traps.',
    accentHex: '#f59e0b',
  },
  {
    kind: 'siege_breaker',
    name: 'Siege Breaker',
    threatLevel: 'Severe',
    firstWave: 'Wave 5+',
    intelNote: 'Anti-fortification hunter that prioritizes smashing player Tripmines, Decoys, Wire, Mines, and Auto-Turrets.',
    accentHex: '#ef4444',
  },
  {
    kind: 'necromancer',
    name: 'Necromancer',
    threatLevel: 'Severe',
    firstWave: 'Wave 6+',
    intelNote: 'Holds perimeter sightlines, fires dark bolts, and raises nearby fallen corpses with cyan overshields.',
    accentHex: '#c084fc',
  },
  {
    kind: 'matriarch',
    name: 'Hive Matriarch',
    threatLevel: 'Severe',
    firstWave: 'Wave 8+',
    intelNote: 'Armored brood carrier continuously spawning Hive Crawlers until eliminated.',
    accentHex: '#10b981',
  },
  {
    kind: 'crawler',
    name: 'Hive Crawler',
    threatLevel: 'Low',
    firstWave: 'Wave 8+',
    intelNote: 'Agile swarm scuttler spawned by Hive Matriarchs to overwhelm reloading defenders.',
    accentHex: '#34d399',
  },
  {
    kind: 'ravager',
    name: 'Apex Ravager',
    threatLevel: 'Apex',
    firstWave: 'Wave 12+',
    intelNote: 'Mini-boss hunter that side-steps straight-line aim and leaps cleanly over floor traps.',
    accentHex: '#f43f5e',
  },
  {
    kind: 'boss',
    name: 'Iron Warden',
    threatLevel: 'Apex',
    firstWave: 'Every 5th Wave',
    intelNote: '3-Phase Siege Colossus: activates an invulnerable P2 shield backed by 2 Power Pylons at 65% HP and enrages with sweeping beams & mortars below 30% HP.',
    accentHex: '#f43f5e',
  },
];

export function getBestiaryMasteryTier(kills: number): number {
  return Math.min(
    BESTIARY_MAX_MILESTONE_TIERS,
    Math.floor(Math.max(0, kills) / BESTIARY_MILESTONE_STEP),
  );
}

export function getBestiaryMasteryBonusPct(kills: number): number {
  return getBestiaryMasteryTier(kills) * 5;
}

export function getBestiaryMasteryMultiplier(
  kind: ZombieKind,
  killsByEnemyType: KillsByEnemyType,
): number {
  const kills = killsByEnemyType[kind] ?? 0;
  return 1 + getBestiaryMasteryTier(kills) * 0.05;
}

export function createDefaultKillsByEnemyType(): KillsByEnemyType {
  return {
    walker: 0,
    runner: 0,
    brute: 0,
    spitter: 0,
    stalker: 0,
    breacher: 0,
    bomber: 0,
    howler: 0,
    juggernaut: 0,
    siege_breaker: 0,
    necromancer: 0,
    matriarch: 0,
    crawler: 0,
    ravager: 0,
    boss: 0,
  };
}

export function createDefaultPermanentUpgrades(): PermanentUpgrades {
  return {
    baseHp: 0,
    reloadSpeed: 0,
    startingUp: 0,
    dashCooldown: 0,
  };
}

export function createDefaultKillsByWeapon(): KillsByWeapon {
  const out = {} as KillsByWeapon;
  for (const w of WEAPON_ORDER) {
    out[w] = 0;
  }
  return out;
}

export function createDefaultCareerStats(): CareerStats {
  return {
    totalKills: 0,
    bestWave: 1,
    bestScore: 0,
    bossesKilled: 0,
    totalExtractions: 0,
    scrap: 0,
    killsByEnemyType: createDefaultKillsByEnemyType(),
    killsByWeapon: createDefaultKillsByWeapon(),
    equippedCamos: {},
    unlockedSkins: ['nightwatch'],
    equippedSkinId: 'nightwatch',
    selectedClass: 'vanguard',
    permanentUpgrades: createDefaultPermanentUpgrades(),
    techLab: createDefaultTechLabLevels(),
    dailyContracts: createDefaultDailyContractsState(),
    unlockedWeapons: [],
    unlockedDrones: [],
    equippedDrone: 'none',
  };
}

export function evaluateSkinUnlocks(career: CareerStats): SkinId[] {
  const newlyUnlocked: SkinId[] = [];
  for (const skinId of SKIN_ORDER) {
    if (!career.unlockedSkins.includes(skinId) && isSkinUnlockSatisfied(skinId, career)) {
      career.unlockedSkins.push(skinId);
      newlyUnlocked.push(skinId);
    }
  }
  return newlyUnlocked;
}

export function sanitizeCareerStats(raw: unknown): CareerStats {
  const base = createDefaultCareerStats();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<CareerStats>;

  base.totalKills = Math.max(0, Math.floor(Number(obj.totalKills) || 0));
  base.bestWave = Math.max(1, Math.floor(Number(obj.bestWave) || 1));
  base.bestScore = Math.max(0, Math.round(Number(obj.bestScore) || 0));
  base.bossesKilled = Math.max(0, Math.floor(Number(obj.bossesKilled) || 0));
  base.totalExtractions = Math.max(0, Math.floor(Number(obj.totalExtractions) || 0));
  base.scrap = Math.max(0, Math.floor(Number(obj.scrap) || 0));

  if (obj.killsByEnemyType && typeof obj.killsByEnemyType === 'object') {
    for (const k of ZOMBIE_KIND_ORDER) {
      const val = Number(obj.killsByEnemyType[k]);
      base.killsByEnemyType[k] = Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
    }
  }

  if (obj.killsByWeapon && typeof obj.killsByWeapon === 'object') {
    for (const w of WEAPON_ORDER) {
      const val = Number(obj.killsByWeapon[w]);
      base.killsByWeapon[w] = Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
    }
  }

  if (obj.equippedCamos && typeof obj.equippedCamos === 'object') {
    const cleanCamos: EquippedWeaponCamos = {};
    for (const w of WEAPON_ORDER) {
      const c = obj.equippedCamos[w];
      if (typeof c === 'string' && WEAPON_CAMO_ORDER.includes(c as WeaponCamoId)) {
        const unlocked = getUnlockedWeaponCamos(base.killsByWeapon[w]);
        if (unlocked.includes(c as WeaponCamoId)) {
          cleanCamos[w] = c as WeaponCamoId;
        }
      }
    }
    base.equippedCamos = cleanCamos;
  }

  if (obj.permanentUpgrades && typeof obj.permanentUpgrades === 'object') {
    for (const k of PERMANENT_UPGRADE_ORDER) {
      const val = Number(obj.permanentUpgrades[k]);
      const maxLv = PERMANENT_UPGRADE_SPECS[k].maxLevel;
      base.permanentUpgrades[k] =
        Number.isFinite(val) && val > 0 ? Math.min(maxLv, Math.floor(val)) : 0;
    }
  }

  if (obj.techLab && typeof obj.techLab === 'object') {
    for (const k of TECH_LAB_ORDER) {
      const val = Number(obj.techLab[k]);
      base.techLab[k] =
        Number.isFinite(val) && val > 0 ? Math.min(TECH_LAB_MAX_TIER, Math.floor(val)) : 0;
    }
  }

  base.dailyContracts = refreshDailyContractsForDate(obj.dailyContracts);

  const unlockedSet = new Set<SkinId>(['nightwatch']);
  if (Array.isArray(obj.unlockedSkins)) {
    for (const s of obj.unlockedSkins) {
      if (SKIN_ORDER.includes(s as SkinId)) {
        unlockedSet.add(s as SkinId);
      }
    }
  }
  base.unlockedSkins = SKIN_ORDER.filter((s) => unlockedSet.has(s));
  evaluateSkinUnlocks(base);

  if (
    typeof obj.equippedSkinId === 'string' &&
    base.unlockedSkins.includes(obj.equippedSkinId as SkinId)
  ) {
    base.equippedSkinId = obj.equippedSkinId as SkinId;
  }

  if (
    typeof obj.selectedClass === 'string' &&
    CLASS_ORDER.includes(obj.selectedClass as SurvivorClassId) &&
    isClassUnlocked(obj.selectedClass as SurvivorClassId, base)
  ) {
    base.selectedClass = obj.selectedClass as SurvivorClassId;
  }

  const unlockedWepSet = new Set<WeaponId>();
  if (Array.isArray(obj.unlockedWeapons)) {
    for (const w of obj.unlockedWeapons) {
      if (PHASE1_ARMORY_WEAPONS.includes(w as WeaponId)) {
        unlockedWepSet.add(w as WeaponId);
      }
    }
  }
  base.unlockedWeapons = PHASE1_ARMORY_WEAPONS.filter((w) => unlockedWepSet.has(w));

  const unlockedDroneSet = new Set<DroneId>();
  if (Array.isArray(obj.unlockedDrones)) {
    for (const d of obj.unlockedDrones) {
      if (DRONE_ORDER.includes(d as Exclude<DroneId, 'none'>)) {
        unlockedDroneSet.add(d as DroneId);
      }
    }
  }
  base.unlockedDrones = DRONE_ORDER.filter((d) => unlockedDroneSet.has(d));

  if (
    typeof obj.equippedDrone === 'string' &&
    ALL_DRONE_IDS.includes(obj.equippedDrone as DroneId) &&
    (obj.equippedDrone === 'none' ||
      base.unlockedDrones.includes(obj.equippedDrone as DroneId))
  ) {
    base.equippedDrone = obj.equippedDrone as DroneId;
  }

  return base;
}

export function loadCareerStats(
  storage: StorageLike | null = getBrowserStorage(),
): CareerStats {
  if (!storage) return createDefaultCareerStats();
  try {
    const raw = storage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return createDefaultCareerStats();
    return sanitizeCareerStats(JSON.parse(raw));
  } catch {
    return createDefaultCareerStats();
  }
}

export function saveCareerStats(
  career: CareerStats,
  storage: StorageLike | null = getBrowserStorage(),
): CareerStats {
  const clean = sanitizeCareerStats(career);
  if (storage) {
    try {
      storage.setItem(CAREER_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore storage quota errors
    }
  }
  return clean;
}

export function computeRunScrapReward(params: {
  wave: number;
  kills: number;
  bossesKilledInRun: number;
  rewardMultiplier?: number;
  techLabScrapMult?: number;
}): number {
  if (params.rewardMultiplier === 0) return 0;
  const w = Math.max(1, Math.floor(params.wave));
  const k = Math.max(0, Math.floor(params.kills));
  const b = Math.max(0, Math.floor(params.bossesKilledInRun));
  const mult = Math.max(1, params.rewardMultiplier ?? 1);
  const techMult = Math.max(1, params.techLabScrapMult ?? 1);
  return Math.max(5, Math.round((w * 6 + k * 0.35 + b * 20) * mult * techMult));
}

export function purchasePermanentUpgrade(
  career: CareerStats,
  id: PermanentUpgradeId,
): { purchased: boolean; career: CareerStats; newLevel: number } {
  const next = sanitizeCareerStats(career);
  const currentLv = next.permanentUpgrades[id];
  const maxLv = PERMANENT_UPGRADE_SPECS[id].maxLevel;
  if (currentLv >= maxLv) {
    return { purchased: false, career: next, newLevel: currentLv };
  }
  const cost = getPermanentUpgradeCost(id, currentLv);
  if (next.scrap < cost) {
    return { purchased: false, career: next, newLevel: currentLv };
  }
  next.scrap -= cost;
  next.permanentUpgrades[id] = currentLv + 1;
  return { purchased: true, career: next, newLevel: currentLv + 1 };
}

export function unlockArmoryWeapon(
  career: CareerStats,
  weaponId: WeaponId,
): { unlocked: boolean; career: CareerStats } {
  const next = sanitizeCareerStats(career);
  if (!PHASE1_ARMORY_WEAPONS.includes(weaponId)) {
    return { unlocked: false, career: next };
  }
  if (next.unlockedWeapons.includes(weaponId)) {
    return { unlocked: false, career: next };
  }
  const cost = WEAPON_SPECS[weaponId].scrapUnlockCost ?? 50;
  if (next.scrap < cost) {
    return { unlocked: false, career: next };
  }
  next.scrap -= cost;
  next.unlockedWeapons.push(weaponId);
  return { unlocked: true, career: next };
}

export function unlockOrEquipDrone(
  career: CareerStats,
  droneId: DroneId,
): { changed: boolean; purchased: boolean; career: CareerStats } {
  const next = sanitizeCareerStats(career);
  if (droneId === 'none') {
    const changed = next.equippedDrone !== 'none';
    next.equippedDrone = 'none';
    return { changed, purchased: false, career: next };
  }
  if (!DRONE_ORDER.includes(droneId)) {
    return { changed: false, purchased: false, career: next };
  }
  if (next.unlockedDrones.includes(droneId)) {
    const toggleOff = next.equippedDrone === droneId;
    next.equippedDrone = toggleOff ? 'none' : droneId;
    return { changed: true, purchased: false, career: next };
  }
  const cost = DRONE_SPECS[droneId].scrapCost;
  if (next.scrap < cost) {
    return { changed: false, purchased: false, career: next };
  }
  next.scrap -= cost;
  next.unlockedDrones.push(droneId);
  next.equippedDrone = droneId;
  return { changed: true, purchased: true, career: next };
}

export function purchaseTechLabUpgrade(
  career: CareerStats,
  id: TechLabUpgradeId,
): { purchased: boolean; career: CareerStats; newTier: number } {
  const next = sanitizeCareerStats(career);
  const currentTier = next.techLab[id] ?? 0;
  if (currentTier >= TECH_LAB_MAX_TIER) {
    return { purchased: false, career: next, newTier: currentTier };
  }
  const cost = getTechLabUpgradeCost(id, currentTier);
  if (next.scrap < cost) {
    return { purchased: false, career: next, newTier: currentTier };
  }
  next.scrap -= cost;
  next.techLab[id] = currentTier + 1;
  return { purchased: true, career: next, newTier: currentTier + 1 };
}

export function equipWeaponCamo(
  career: CareerStats,
  weaponId: WeaponId,
  camoId: WeaponCamoId,
): { changed: boolean; career: CareerStats } {
  const next = sanitizeCareerStats(career);
  if (!WEAPON_ORDER.includes(weaponId)) {
    return { changed: false, career: next };
  }
  const kills = next.killsByWeapon[weaponId] ?? 0;
  const unlocked = getUnlockedWeaponCamos(kills);
  if (!unlocked.includes(camoId)) {
    return { changed: false, career: next };
  }
  if (next.equippedCamos[weaponId] === camoId) {
    return { changed: false, career: next };
  }
  next.equippedCamos[weaponId] = camoId;
  return { changed: true, career: next };
}

export function claimCareerDailyContract(
  career: CareerStats,
  contractId: string,
  dateKey?: string,
): { claimed: boolean; reward: number; career: CareerStats } {
  const next = sanitizeCareerStats(career);
  next.dailyContracts = refreshDailyContractsForDate(next.dailyContracts, dateKey);
  const active = getDailyContractsForDate(next.dailyContracts.dateKey);
  const spec = active.find((c) => c.id === contractId);
  if (!spec) {
    return { claimed: false, reward: 0, career: next };
  }
  const progress = next.dailyContracts.progress[contractId] ?? 0;
  if (progress < spec.target || next.dailyContracts.claimedIds.includes(contractId)) {
    return { claimed: false, reward: 0, career: next };
  }
  next.dailyContracts.claimedIds.push(contractId);
  next.scrap += spec.scrapReward;
  return { claimed: true, reward: spec.scrapReward, career: next };
}

function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}
