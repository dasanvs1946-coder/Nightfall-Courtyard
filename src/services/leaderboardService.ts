import { Capacitor } from '@capacitor/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  ensureAnonymousAuth,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { SKIN_ORDER } from '../game/career';
import { ARENA_ORDER, GAME_MODE_ORDER } from '../game/arenas';
import { getDailyChallengeConfig, getUtcDateKey } from '../game/dailyChallenge';
import {
  isValidCallsign,
  loadClanTag,
  sanitizeCallsign,
  sanitizeClanTag,
  saveCachedTop20Rivals,
} from '../game/storage';
import { ArenaId, GameModeId, SkinId } from '../game/types';
import { APP_VERSION } from '../game/version';

export interface LeaderboardRecord {
  uid: string;
  callsign: string;
  clanTag: string;
  appVersion?: string;
  wave: number;
  kills: number;
  score: number;
  mode: GameModeId;
  arena: ArenaId;
  skinId: SkinId;
  platform: 'Web' | 'APK';
  dateKey?: string;
  mutator?: string;
}

export function getClientPlatformTag(): 'Web' | 'APK' {
  try {
    return Capacitor.isNativePlatform() ? 'APK' : 'Web';
  } catch {
    return 'Web';
  }
}

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function normalizeCallsign(raw: string): string {
  const clean = sanitizeCallsign(raw).trim();
  return isValidCallsign(clean) ? clean : 'SURVIVOR 01';
}

function normalizeMode(raw: string): GameModeId {
  return GAME_MODE_ORDER.includes(raw as GameModeId)
    ? (raw as GameModeId)
    : 'normal';
}

function normalizeArena(raw: string): ArenaId {
  return ARENA_ORDER.includes(raw as ArenaId) ? (raw as ArenaId) : 'courtyard';
}

function normalizeSkin(raw: string): SkinId {
  return SKIN_ORDER.includes(raw as SkinId) ? (raw as SkinId) : 'nightwatch';
}

export async function fetchGlobalTop20(): Promise<LeaderboardRecord[]> {
  const colPath = 'leaderboard';
  try {
    const q = query(
      collection(db, colPath),
      where('score', '>=', 0),
      orderBy('score', 'desc'),
      limit(20),
    );
    const snap = await getDocs(q);
    const rows: LeaderboardRecord[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid ?? d.id),
        callsign: String(data.callsign ?? 'SURVIVOR'),
        clanTag: sanitizeClanTag(String(data.clanTag ?? '')),
        appVersion: typeof data.appVersion === 'string' ? data.appVersion : undefined,
        wave: Number(data.wave ?? 1),
        kills: Number(data.kills ?? 0),
        score: Number(data.score ?? 0),
        mode: normalizeMode(String(data.mode ?? 'normal')),
        arena: normalizeArena(String(data.arena ?? 'courtyard')),
        skinId: normalizeSkin(String(data.skinId ?? 'nightwatch')),
        platform: data.platform === 'APK' ? 'APK' : 'Web',
      };
    });
    saveCachedTop20Rivals(
      rows.map((r) => ({
        uid: r.uid,
        callsign: r.callsign,
        clanTag: r.clanTag,
        score: r.score,
      })),
    );
    return rows;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
    throw error;
  }
}

export async function fetchDailyTop20(
  dateKey: string = getUtcDateKey(),
): Promise<LeaderboardRecord[]> {
  const colPath = `daily_leaderboard/${dateKey}/entries`;
  try {
    const q = query(
      collection(db, 'daily_leaderboard', dateKey, 'entries'),
      where('score', '>=', 0),
      orderBy('score', 'desc'),
      limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid ?? d.id),
        callsign: String(data.callsign ?? 'SURVIVOR'),
        clanTag: sanitizeClanTag(String(data.clanTag ?? '')),
        appVersion: typeof data.appVersion === 'string' ? data.appVersion : undefined,
        wave: Number(data.wave ?? 1),
        kills: Number(data.kills ?? 0),
        score: Number(data.score ?? 0),
        mode: 'daily',
        arena: normalizeArena(String(data.arena ?? 'courtyard')),
        skinId: normalizeSkin(String(data.skinId ?? 'nightwatch')),
        platform: data.platform === 'APK' ? 'APK' : 'Web',
        dateKey: String(data.dateKey ?? dateKey),
        mutator: String(data.mutator ?? ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
    throw error;
  }
}

export interface SubmitRunParams {
  callsign: string;
  clanTag?: string;
  wave: number;
  kills: number;
  score: number;
  mode: GameModeId;
  arena: ArenaId;
  skinId: SkinId;
  dailyDateKey?: string | null;
}

export interface SubmitRunResult {
  submittedGlobal: boolean;
  submittedDaily: boolean;
  reason?: 'unauthenticated' | 'not_personal_best';
}

export async function submitLeaderboardRun(
  params: SubmitRunParams,
): Promise<SubmitRunResult> {
  if (params.mode === 'sandbox') {
    return {
      submittedGlobal: false,
      submittedDaily: false,
      reason: 'not_personal_best',
    };
  }
  let user = auth.currentUser;
  if (!user) {
    const res = await ensureAnonymousAuth();
    user = res.user;
  }
  if (!user) {
    return {
      submittedGlobal: false,
      submittedDaily: false,
      reason: 'unauthenticated',
    };
  }

  const uid = user.uid;
  const callsign = normalizeCallsign(params.callsign);
  const rawClan = sanitizeClanTag(params.clanTag ?? loadClanTag());
  const clanTag = rawClan.length >= 3 ? rawClan : '';
  const wave = clampInt(params.wave, 1, 200);
  const kills = clampInt(params.kills, 0, 1000000);
  const score = clampInt(params.score, 0, 100000000);
  const mode = normalizeMode(params.mode);
  const arena = normalizeArena(params.arena);
  const skinId = normalizeSkin(params.skinId);
  const platform = getClientPlatformTag();

  let submittedGlobal = false;
  let submittedDaily = false;

  const globalPath = `leaderboard/${uid}`;
  const globalRef = doc(db, 'leaderboard', uid);

  try {
    const existingSnap = await getDoc(globalRef);
    if (!existingSnap.exists()) {
      await setDoc(globalRef, {
        uid,
        callsign,
        clanTag,
        appVersion: APP_VERSION,
        wave,
        kills,
        score,
        mode,
        arena,
        skinId,
        platform,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      submittedGlobal = true;
    } else {
      const existingData = existingSnap.data();
      const existingScore = Number(existingData.score ?? 0);
      if (
        score > existingScore ||
        (score === existingScore && wave > Number(existingData.wave ?? 0))
      ) {
        await setDoc(globalRef, {
          uid,
          callsign,
          clanTag,
          appVersion: APP_VERSION,
          wave,
          kills,
          score,
          mode,
          arena,
          skinId,
          platform,
          isPublic: true,
          createdAt: existingData.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        submittedGlobal = true;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, globalPath);
    throw error;
  }

  if (mode === 'daily') {
    const dateKey = params.dailyDateKey || getUtcDateKey();
    const dailyCfg = getDailyChallengeConfig(dateKey);
    const dailyPath = `daily_leaderboard/${dateKey}/entries/${uid}`;
    const dailyRef = doc(db, 'daily_leaderboard', dateKey, 'entries', uid);
    try {
      const existingDailySnap = await getDoc(dailyRef);
      if (!existingDailySnap.exists()) {
        await setDoc(dailyRef, {
          uid,
          callsign,
          clanTag,
          appVersion: APP_VERSION,
          dateKey,
          mutator: dailyCfg.mutator.name.slice(0, 48),
          wave,
          kills,
          score,
          mode: 'daily',
          arena: dailyCfg.arena,
          skinId,
          platform,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        submittedDaily = true;
      } else {
        const existingData = existingDailySnap.data();
        const existingScore = Number(existingData.score ?? 0);
        if (score >= existingScore) {
          await setDoc(dailyRef, {
            uid,
            callsign,
            clanTag,
            appVersion: APP_VERSION,
            dateKey,
            mutator: dailyCfg.mutator.name.slice(0, 48),
            wave,
            kills,
            score,
            mode: 'daily',
            arena: dailyCfg.arena,
            skinId,
            platform,
            isPublic: true,
            createdAt: existingData.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          submittedDaily = true;
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, dailyPath);
      throw error;
    }
  }

  return {
    submittedGlobal,
    submittedDaily,
    reason: !submittedGlobal && !submittedDaily ? 'not_personal_best' : undefined,
  };
}

export async function updateLeaderboardIdentity(
  rawCallsign: string,
  rawClanTag?: string,
): Promise<boolean> {
  let user = auth.currentUser;
  if (!user) {
    const res = await ensureAnonymousAuth();
    user = res.user;
  }
  if (!user) return false;

  const callsign = normalizeCallsign(rawCallsign);
  const cleanedTag = sanitizeClanTag(rawClanTag ?? loadClanTag());
  const clanTag = cleanedTag.length >= 3 ? cleanedTag : '';
  const uid = user.uid;
  let updatedAny = false;

  const globalRef = doc(db, 'leaderboard', uid);
  try {
    const snap = await getDoc(globalRef);
    if (
      snap.exists() &&
      (snap.data().callsign !== callsign || (snap.data().clanTag ?? '') !== clanTag)
    ) {
      await updateDoc(globalRef, {
        callsign,
        clanTag,
        appVersion: APP_VERSION,
        updatedAt: serverTimestamp(),
      });
      updatedAny = true;
    }
  } catch {
    // Non-fatal if offline or no record exists yet
  }

  const dateKey = getUtcDateKey();
  const dailyRef = doc(db, 'daily_leaderboard', dateKey, 'entries', uid);
  try {
    const dailySnap = await getDoc(dailyRef);
    if (
      dailySnap.exists() &&
      (dailySnap.data().callsign !== callsign ||
        (dailySnap.data().clanTag ?? '') !== clanTag)
    ) {
      await updateDoc(dailyRef, {
        callsign,
        clanTag,
        appVersion: APP_VERSION,
        updatedAt: serverTimestamp(),
      });
      updatedAny = true;
    }
  } catch {
    // Non-fatal if offline or no daily record exists yet
  }

  return updatedAny;
}

export async function updateLeaderboardCallsign(
  rawCallsign: string,
): Promise<boolean> {
  return updateLeaderboardIdentity(rawCallsign);
}
