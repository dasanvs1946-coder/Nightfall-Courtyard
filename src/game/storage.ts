import { ARENA_ORDER, GAME_MODE_ORDER } from './arenas';
import { ALL_DRONE_IDS } from './drones';
import { GADGET_ORDER } from './gadgets';
import { CURSED_PERK_ORDER, EVOLUTION_ORDER, PERK_ORDER } from './perks';
import { TACTICAL_GEAR_ORDER } from './tacticalGear';
import {
  ArenaId,
  CursedPerkId,
  DroneId,
  EvolutionId,
  GadgetId,
  GameModeId,
  NextRivalInfo,
  PerkId,
  SavedRunProgress,
  TacticalGearId,
  UpgradeLevels,
  WeaponId,
  WeaponMasteryLevels,
  WeaponRuntimeState,
} from './types';
import {
  createInitialUpgradeLevels,
  createInitialWeaponMastery,
  MAX_UPGRADE_LEVEL,
  MAX_WEAPON_MASTERY_LEVEL,
} from './upgrades';
import { createInitialWeapons, WEAPON_ORDER, WEAPON_SPECS } from './weapons';

const HIGH_SCORE_KEY = 'nightfall_courtyard_high_score_v1';
const RUN_PROGRESS_KEY = 'nightfall_courtyard_run_progress_v1';
const CALLSIGN_KEY = 'nightfall_courtyard_callsign_v1';
const CLAN_TAG_KEY = 'nightfall_courtyard_clan_tag_v1';
const CACHED_TOP20_KEY = 'nightfall_courtyard_cached_top20_v1';

export interface CachedRivalEntry {
  uid: string;
  callsign: string;
  clanTag: string;
  score: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function sanitizeCallsign(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/ {2,}/g, ' ')
    .slice(0, 15);
}

export function isValidCallsign(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.length <= 15 &&
    /^[A-Za-z0-9 ]{3,15}$/.test(trimmed)
  );
}

export function generateDefaultCallsign(): string {
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `SURVIVOR ${num}`.slice(0, 15);
}

export function loadCallsign(
  storage: StorageLike | null = getBrowserStorage(),
): string {
  if (!storage) return 'SURVIVOR 1001';
  try {
    const existing = storage.getItem(CALLSIGN_KEY);
    if (existing) {
      const migrated = sanitizeCallsign(existing).trim();
      if (isValidCallsign(migrated)) {
        if (migrated !== existing) {
          storage.setItem(CALLSIGN_KEY, migrated);
        }
        return migrated;
      }
    }
    const generated = generateDefaultCallsign();
    storage.setItem(CALLSIGN_KEY, generated);
    return generated;
  } catch {
    return 'SURVIVOR 1001';
  }
}

export function saveCallsign(
  raw: string,
  storage: StorageLike | null = getBrowserStorage(),
): string {
  const sanitized = sanitizeCallsign(raw).trim();
  const valid = isValidCallsign(sanitized)
    ? sanitized
    : loadCallsign(storage);
  if (storage) {
    try {
      storage.setItem(CALLSIGN_KEY, valid);
    } catch {
      // Ignore storage errors
    }
  }
  return valid;
}

export function sanitizeClanTag(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
}

export function isValidClanTag(raw: string): boolean {
  const clean = sanitizeClanTag(raw);
  return clean.length === 0 || (clean.length >= 3 && clean.length <= 4);
}

export function loadClanTag(
  storage: StorageLike | null = getBrowserStorage(),
): string {
  if (!storage) return '';
  try {
    const raw = storage.getItem(CLAN_TAG_KEY);
    if (!raw) return '';
    const clean = sanitizeClanTag(raw);
    return clean.length >= 3 && clean.length <= 4 ? clean : '';
  } catch {
    return '';
  }
}

export function saveClanTag(
  raw: string,
  storage: StorageLike | null = getBrowserStorage(),
): string {
  const clean = sanitizeClanTag(raw);
  const valid = clean.length >= 3 && clean.length <= 4 ? clean : '';
  if (storage) {
    try {
      if (valid) {
        storage.setItem(CLAN_TAG_KEY, valid);
      } else if (storage.removeItem) {
        storage.removeItem(CLAN_TAG_KEY);
      } else {
        storage.setItem(CLAN_TAG_KEY, '');
      }
    } catch {
      // Ignore storage errors
    }
  }
  return valid;
}

export function loadCachedTop20Rivals(
  storage: StorageLike | null = getBrowserStorage(),
): CachedRivalEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(CACHED_TOP20_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list: CachedRivalEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Partial<CachedRivalEntry>;
      const score = Math.max(0, Math.round(Number(obj.score) || 0));
      const callsign = sanitizeCallsign(String(obj.callsign ?? '')).trim();
      if (!callsign || score <= 0) continue;
      list.push({
        uid: String(obj.uid ?? ''),
        callsign,
        clanTag: sanitizeClanTag(String(obj.clanTag ?? '')),
        score,
      });
    }
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 20);
  } catch {
    return [];
  }
}

export function saveCachedTop20Rivals(
  entries: CachedRivalEntry[],
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    const clean = entries
      .filter((e) => e && e.score > 0 && e.callsign.trim().length > 0)
      .slice(0, 20)
      .map((e) => ({
        uid: String(e.uid || ''),
        callsign: sanitizeCallsign(e.callsign).trim(),
        clanTag: sanitizeClanTag(e.clanTag || ''),
        score: Math.max(0, Math.round(e.score)),
      }))
      .sort((a, b) => b.score - a.score);
    storage.setItem(CACHED_TOP20_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage quota errors
  }
}

export function computeNextRival(
  currentScore: number,
  rivals: CachedRivalEntry[],
  selfUid?: string | null,
): NextRivalInfo | null {
  if (!rivals.length) return null;
  const sorted = [...rivals].sort((a, b) => b.score - a.score);
  // Find the lowest-ranked (closest target) rival whose score is still strictly above currentScore
  let targetIdx = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const entry = sorted[i];
    if (selfUid && entry.uid === selfUid) continue;
    if (entry.score > currentScore) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx === -1) return null;
  const target = sorted[targetIdx];
  return {
    rank: targetIdx + 1,
    callsign: target.callsign,
    clanTag: target.clanTag,
    targetScore: target.score,
    scoreToOvertake: Math.max(1, target.score - Math.floor(currentScore)),
  };
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

function sanitizeWeaponMastery(raw: unknown): WeaponMasteryLevels {
  const base = createInitialWeaponMastery();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  for (const id of WEAPON_ORDER) {
    const val = Number(obj[id]);
    if (Number.isFinite(val)) {
      base[id] = Math.max(0, Math.min(MAX_WEAPON_MASTERY_LEVEL, Math.floor(val)));
    }
  }
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

function sanitizePerks(raw: unknown): PerkId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<PerkId>();
  for (const item of raw) {
    if (typeof item === 'string' && (PERK_ORDER as string[]).includes(item)) {
      seen.add(item as PerkId);
    }
  }
  return Array.from(seen);
}

function sanitizeCursedPerks(raw: unknown): CursedPerkId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<CursedPerkId>();
  for (const item of raw) {
    if (
      typeof item === 'string' &&
      (CURSED_PERK_ORDER as string[]).includes(item)
    ) {
      seen.add(item as CursedPerkId);
    }
  }
  return Array.from(seen);
}

function sanitizeEvolutions(raw: unknown): EvolutionId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<EvolutionId>();
  for (const item of raw) {
    if (typeof item === 'string' && (EVOLUTION_ORDER as string[]).includes(item)) {
      seen.add(item as EvolutionId);
    }
  }
  return Array.from(seen);
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

    const equippedGadget =
      typeof parsed.equippedGadget === 'string' &&
      (GADGET_ORDER as string[]).includes(parsed.equippedGadget)
        ? (parsed.equippedGadget as GadgetId)
        : 'tripmine';

    const arena: ArenaId =
      typeof parsed.arena === 'string' &&
      (ARENA_ORDER as string[]).includes(parsed.arena)
        ? (parsed.arena as ArenaId)
        : 'courtyard';

    let mode: GameModeId | 'survival' = 'normal';
    if (parsed.mode === 'sandbox') {
      return null;
    }
    if (parsed.mode === 'survival') {
      mode = 'survival';
    } else if (
      typeof parsed.mode === 'string' &&
      (GAME_MODE_ORDER as string[]).includes(parsed.mode)
    ) {
      mode = parsed.mode as GameModeId;
    }

    const weapons = sanitizeWeapons(parsed.weapons);

    const equippedDrone: DroneId =
      typeof parsed.equippedDrone === 'string' &&
      (ALL_DRONE_IDS as string[]).includes(parsed.equippedDrone)
        ? (parsed.equippedDrone as DroneId)
        : 'none';

    return {
      lastWave: Math.min(999, lastWave),
      score: Math.max(0, Math.round(Number(parsed.score) || 0)),
      kills: Math.max(0, Math.floor(Number(parsed.kills) || 0)),
      upgradePoints: Math.max(0, Math.floor(Number(parsed.upgradePoints) || 0)),
      upgradeLevels: sanitizeUpgradeLevels(parsed.upgradeLevels),
      weaponMastery: sanitizeWeaponMastery(parsed.weaponMastery),
      activeWeapon,
      equippedGear,
      equippedGadget,
      equippedDrone,
      weapons,
      hasUsedRevive: Boolean(parsed.hasUsedRevive),
      mode,
      arena,
      ownedPerks: sanitizePerks(parsed.ownedPerks),
      ownedCursedPerks: sanitizeCursedPerks(parsed.ownedCursedPerks),
      evolvedWeapons: sanitizeEvolutions(parsed.evolvedWeapons),
      ultimateCharge: Math.max(
        0,
        Math.min(100, Number(parsed.ultimateCharge) || 0),
      ),
      dailyDateKey:
        typeof parsed.dailyDateKey === 'string' ? parsed.dailyDateKey : undefined,
      perkDraftPending: Boolean(parsed.perkDraftPending),
      perkDraftSeedCursor: Math.max(
        0,
        Math.floor(Number(parsed.perkDraftSeedCursor) || 0),
      ),
      weaponDraftPending: Boolean(parsed.weaponDraftPending),
      activeInterrupted: parsed.activeInterrupted !== false,
      inRunScrap: Math.max(0, Math.floor(Number(parsed.inRunScrap) || 0)),
    };
  } catch {
    return null;
  }
}

export function saveRunProgress(
  progress: SavedRunProgress,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage || progress.mode === 'sandbox') return;
  try {
    const clean: SavedRunProgress = {
      lastWave: Math.max(1, Math.floor(progress.lastWave)),
      score: Math.max(0, Math.round(progress.score)),
      kills: Math.max(0, Math.floor(progress.kills)),
      upgradePoints: Math.max(0, Math.floor(progress.upgradePoints)),
      upgradeLevels: sanitizeUpgradeLevels(progress.upgradeLevels),
      weaponMastery: sanitizeWeaponMastery(progress.weaponMastery),
      activeWeapon: progress.activeWeapon,
      equippedGear: progress.equippedGear ?? 'mine',
      equippedGadget: progress.equippedGadget ?? 'tripmine',
      equippedDrone: progress.equippedDrone ?? 'none',
      weapons: sanitizeWeapons(progress.weapons),
      hasUsedRevive: Boolean(progress.hasUsedRevive),
      mode: progress.mode ?? 'normal',
      arena: progress.arena ?? 'courtyard',
      ownedPerks: sanitizePerks(progress.ownedPerks),
      ownedCursedPerks: sanitizeCursedPerks(progress.ownedCursedPerks),
      evolvedWeapons: sanitizeEvolutions(progress.evolvedWeapons),
      ultimateCharge: Math.max(0, Math.min(100, progress.ultimateCharge ?? 0)),
      dailyDateKey: progress.dailyDateKey,
      perkDraftPending: Boolean(progress.perkDraftPending),
      perkDraftSeedCursor: Math.max(0, Math.floor(progress.perkDraftSeedCursor ?? 0)),
      weaponDraftPending: Boolean(progress.weaponDraftPending),
      activeInterrupted: progress.activeInterrupted ?? true,
      inRunScrap: Math.max(0, Math.floor(progress.inRunScrap ?? 0)),
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
