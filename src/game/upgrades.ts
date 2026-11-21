import { UpgradeId, UpgradeLevels, WeaponId } from './types';
import { WEAPON_SPECS } from './weapons';

export const KILLS_PER_UPGRADE_POINT = 8; // Reduced ~40% UP gain rate per kill vs 5 kills
export const WAVE_CLEAR_UP_REGULAR = 1; // Tighter wave completion UP (-40%+ economy)
export const WAVE_CLEAR_UP_BOSS = 2;
export const BOSS_KILL_UP_BONUS = 2;
export const MAX_UPGRADE_LEVEL = 50;

export interface UpgradeSpec {
  id: UpgradeId;
  name: string;
  shortLabel: string;
  effectSummary: string;
  maxLevel: number;
}

export const UPGRADE_ORDER: UpgradeId[] = [
  'damage',
  'handling',
  'vitality',
  'mobility',
  'capacity',
];

export const UPGRADE_SPECS: Record<UpgradeId, UpgradeSpec> = {
  damage: {
    id: 'damage',
    name: 'Ballistics',
    shortLabel: 'DMG',
    effectSummary: '+8% weapon damage / lv',
    maxLevel: MAX_UPGRADE_LEVEL,
  },
  handling: {
    id: 'handling',
    name: 'Trigger & Mag',
    shortLabel: 'RATE',
    effectSummary: '+4% fire rate & +5% reload / lv',
    maxLevel: MAX_UPGRADE_LEVEL,
  },
  vitality: {
    id: 'vitality',
    name: 'Armor & Vitality',
    shortLabel: 'HP',
    effectSummary: '+12 max HP & +1.3% armor / lv',
    maxLevel: MAX_UPGRADE_LEVEL,
  },
  mobility: {
    id: 'mobility',
    name: 'Exo-Boots',
    shortLabel: 'SPD',
    effectSummary: '+1.6% speed & -1.3% dash CD / lv',
    maxLevel: MAX_UPGRADE_LEVEL,
  },
  capacity: {
    id: 'capacity',
    name: 'Extended Mags',
    shortLabel: 'MAG',
    effectSummary: '+10% mag capacity / lv',
    maxLevel: MAX_UPGRADE_LEVEL,
  },
};

export function createInitialUpgradeLevels(): UpgradeLevels {
  return {
    damage: 0,
    handling: 0,
    vitality: 0,
    mobility: 0,
    capacity: 0,
  };
}

export function getUpgradeCost(currentLevel: number): number {
  const lv = Math.max(0, currentLevel);
  return 1 + Math.floor(lv / 3) + Math.floor(lv / 12);
}

export function canPurchaseUpgrade(
  levels: UpgradeLevels,
  points: number,
  id: UpgradeId,
): boolean {
  const level = levels[id];
  if (level >= UPGRADE_SPECS[id].maxLevel) return false;
  return points >= getUpgradeCost(level);
}

export function purchaseUpgrade(
  levels: UpgradeLevels,
  points: number,
  id: UpgradeId,
): { purchased: boolean; nextPoints: number; newLevel: number } {
  if (!canPurchaseUpgrade(levels, points, id)) {
    return { purchased: false, nextPoints: points, newLevel: levels[id] };
  }
  const cost = getUpgradeCost(levels[id]);
  levels[id] += 1;
  return {
    purchased: true,
    nextPoints: points - cost,
    newLevel: levels[id],
  };
}

export function getDamageMultiplier(levels: UpgradeLevels): number {
  return 1 + levels.damage * 0.08;
}

export function getFireRateMultiplier(levels: UpgradeLevels): number {
  return 1 / (1 + levels.handling * 0.04);
}

export function getReloadDurationMultiplier(levels: UpgradeLevels): number {
  return 1 / (1 + levels.handling * 0.05);
}

export function getMaxHpForLevel(levels: UpgradeLevels): number {
  return 100 + levels.vitality * 12;
}

export function getDamageTakenMultiplier(levels: UpgradeLevels): number {
  return Math.max(0.35, 1 - levels.vitality * 0.013);
}

export function getMoveSpeedMultiplier(levels: UpgradeLevels): number {
  return 1 + levels.mobility * 0.016;
}

export function getDashCooldownMultiplier(levels: UpgradeLevels): number {
  return Math.max(0.35, 1 - levels.mobility * 0.013);
}

export function getEffectiveMagSize(
  id: WeaponId,
  levels: UpgradeLevels,
): number {
  const base = WEAPON_SPECS[id].magSize;
  return Math.round(base * (1 + levels.capacity * 0.1));
}
