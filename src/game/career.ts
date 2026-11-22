import { StorageLike } from './storage';
import {
  CareerStats,
  KillsByEnemyType,
  PermanentUpgradeId,
  PermanentUpgrades,
  SkinId,
  SurvivorClassId,
  ZombieKind,
} from './types';

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
    kind: 'boss',
    name: 'Iron Warden',
    threatLevel: 'Apex',
    firstWave: 'Every 5th Wave',
    intelNote: 'Siege colossus that enrages below 50% HP with shock slams and minion summons.',
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

export function createDefaultCareerStats(): CareerStats {
  return {
    totalKills: 0,
    bestWave: 1,
    bestScore: 0,
    bossesKilled: 0,
    scrap: 0,
    killsByEnemyType: createDefaultKillsByEnemyType(),
    unlockedSkins: ['nightwatch'],
    equippedSkinId: 'nightwatch',
    selectedClass: 'vanguard',
    permanentUpgrades: createDefaultPermanentUpgrades(),
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
  base.scrap = Math.max(0, Math.floor(Number(obj.scrap) || 0));

  if (obj.killsByEnemyType && typeof obj.killsByEnemyType === 'object') {
    for (const k of ZOMBIE_KIND_ORDER) {
      const val = Number(obj.killsByEnemyType[k]);
      base.killsByEnemyType[k] = Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
    }
  }

  if (obj.permanentUpgrades && typeof obj.permanentUpgrades === 'object') {
    for (const k of PERMANENT_UPGRADE_ORDER) {
      const val = Number(obj.permanentUpgrades[k]);
      const maxLv = PERMANENT_UPGRADE_SPECS[k].maxLevel;
      base.permanentUpgrades[k] =
        Number.isFinite(val) && val > 0 ? Math.min(maxLv, Math.floor(val)) : 0;
    }
  }

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
}): number {
  const w = Math.max(1, Math.floor(params.wave));
  const k = Math.max(0, Math.floor(params.kills));
  const b = Math.max(0, Math.floor(params.bossesKilledInRun));
  const mult = Math.max(1, params.rewardMultiplier ?? 1);
  return Math.max(5, Math.round((w * 6 + k * 0.35 + b * 20) * mult));
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
