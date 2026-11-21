import {
  SavedRunProgress,
  TacticalGearId,
  UpgradeLevels,
  WeaponId,
  WeaponRuntimeState,
} from './types';
import { createInitialUpgradeLevels, MAX_UPGRADE_LEVEL } from './upgrades';
import { TACTICAL_GEAR_ORDER } from './tacticalGear';
import { createInitialWeapons, WEAPON_ORDER, WEAPON_SPECS } from './weapons';

const HIGH_SCORE_KEY = 'nightfall_courtyard_high_score_v1';
const RUN_PROGRESS_KEY = 'nightfall_courtyard_run_progress_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function loadHighScore(storage: StorageLike | null = getBrowserStorage()): number {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(HIGH_SCORE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(
  score: number,
  storage: StorageLike | null = getBrowserStorage(),
): number {
  const safeScore = Math.max(0, Math.round(score));
  const currentBest = loadHighScore(storage);
  const nextBest = Math.max(currentBest, safeScore);
  if (storage && nextBest > currentBest) {
    try {
      storage.setItem(HIGH_SCORE_KEY, String(nextBest));
    } catch {
      // Ignore storage quota / privacy mode failures
    }
  }
  return nextBest;
}

function sanitizeUpgradeLevels(raw: unknown): UpgradeLevels {
  const base = createInitialUpgradeLevels();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  (Object.keys(base) as Array<keyof UpgradeLevels>).forEach((k) => {
    const val = Number(obj[k]);
    if (Number.isFinite(val)) {
      base[k] = Math.max(0, Math.min(MAX_UPGRADE_LEVEL, Math.floor(val)));
    }
  });
  return base;
}

function sanitizeWeapons(raw: unknown): WeaponRuntimeState[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const base = createInitialWeapons();
  const byId = new Map<WeaponId, Partial<WeaponRuntimeState>>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<WeaponRuntimeState>;
    if (
      typeof candidate.id === 'string' &&
      (WEAPON_ORDER as string[]).includes(candidate.id)
    ) {
      byId.set(candidate.id as WeaponId, candidate);
    }
  }
  if (byId.size === 0) return undefined;

  return base.map((w) => {
    const saved = byId.get(w.id);
    if (!saved) return w;
    const spec = WEAPON_SPECS[w.id];
    const unlocked = w.id === 'pistol' ? true : Boolean(saved.unlocked);
    const mag = Number.isFinite(Number(saved.mag))
      ? Math.max(0, Math.min(999, Math.floor(Number(saved.mag))))
      : w.mag;
    const reserve = spec.infiniteReserve
      ? 0
      : Number.isFinite(Number(saved.reserve))
        ? Math.max(0, Math.min(9999, Math.floor(Number(saved.reserve))))
        : w.reserve;
    return {
      id: w.id,
      unlocked,
      mag,
      reserve,
    };
  });
}

export function loadRunProgress(
  storage: StorageLike | null = getBrowserStorage(),
): SavedRunProgress | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(RUN_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedRunProgress>;
    const lastWave = Math.floor(Number(parsed.lastWave));
    if (!Number.isFinite(lastWave) || lastWave < 1) return null;

    const activeWeapon =
      typeof parsed.activeWeapon === 'string' &&
      (WEAPON_ORDER as string[]).includes(parsed.activeWeapon)
        ? (parsed.activeWeapon as WeaponId)
        : 'pistol';

    const equippedGear =
      typeof parsed.equippedGear === 'string' &&
      (TACTICAL_GEAR_ORDER as string[]).includes(parsed.equippedGear)
        ? (parsed.equippedGear as TacticalGearId)
        : 'mine';

    const weapons = sanitizeWeapons(parsed.weapons);

    return {
      lastWave: Math.min(999, lastWave),
      score: Math.max(0, Math.round(Number(parsed.score) || 0)),
      kills: Math.max(0, Math.floor(Number(parsed.kills) || 0)),
      upgradePoints: Math.max(0, Math.floor(Number(parsed.upgradePoints) || 0)),
      upgradeLevels: sanitizeUpgradeLevels(parsed.upgradeLevels),
      activeWeapon,
      equippedGear,
      weapons,
      hasUsedRevive: Boolean(parsed.hasUsedRevive),
      mode: parsed.mode === 'survival' ? 'survival' : 'survival',
      activeInterrupted: parsed.activeInterrupted !== false,
    };
  } catch {
    return null;
  }
}

export function saveRunProgress(
  progress: SavedRunProgress,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    const clean: SavedRunProgress = {
      lastWave: Math.max(1, Math.floor(progress.lastWave)),
      score: Math.max(0, Math.round(progress.score)),
      kills: Math.max(0, Math.floor(progress.kills)),
      upgradePoints: Math.max(0, Math.floor(progress.upgradePoints)),
      upgradeLevels: sanitizeUpgradeLevels(progress.upgradeLevels),
      activeWeapon: progress.activeWeapon,
      equippedGear: progress.equippedGear ?? 'mine',
      weapons: sanitizeWeapons(progress.weapons),
      hasUsedRevive: Boolean(progress.hasUsedRevive),
      mode: progress.mode ?? 'survival',
      activeInterrupted: progress.activeInterrupted ?? true,
    };
    storage.setItem(RUN_PROGRESS_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage failures
  }
}

export function clearRunProgress(
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    if (storage.removeItem) {
      storage.removeItem(RUN_PROGRESS_KEY);
    } else {
      storage.setItem(RUN_PROGRESS_KEY, '');
    }
  } catch {
    // Ignore storage failures
  }
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
