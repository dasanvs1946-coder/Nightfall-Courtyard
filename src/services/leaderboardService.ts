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
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { SKIN_ORDER } from '../game/career';
import { ARENA_ORDER, GAME_MODE_ORDER } from '../game/arenas';
import { getDailyChallengeConfig, getUtcDateKey } from '../game/dailyChallenge';
import { isValidCallsign, sanitizeCallsign } from '../game/storage';
import { ArenaId, GameModeId, SkinId } from '../game/types';

export interface LeaderboardRecord {
  uid: string;
  callsign: string;
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
  const clean = sanitizeCallsign(raw);
  return isValidCallsign(clean) ? clean : 'SURVIVOR_01';
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
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid ?? d.id),
        callsign: String(data.callsign ?? 'SURVIVOR'),
        wave: Number(data.wave ?? 1),
        kills: Number(data.kills ?? 0),
        score: Number(data.score ?? 0),
        mode: normalizeMode(String(data.mode ?? 'normal')),
        arena: normalizeArena(String(data.arena ?? 'courtyard')),
        skinId: normalizeSkin(String(data.skinId ?? 'nightwatch')),
        platform: data.platform === 'APK' ? 'APK' : 'Web',
      };
    });
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
  reason?: 'unauthenticated' | 'not_verified' | 'not_personal_best';
}

export async function submitLeaderboardRun(
  params: SubmitRunParams,
): Promise<SubmitRunResult> {
  const user = auth.currentUser;
  if (!user) {
    return {
      submittedGlobal: false,
      submittedDaily: false,
      reason: 'unauthenticated',
    };
  }
  if (!user.emailVerified) {
    return {
      submittedGlobal: false,
      submittedDaily: false,
      reason: 'not_verified',
    };
  }

  const uid = user.uid;
  const callsign = normalizeCallsign(params.callsign);
  const wave = clampInt(params.wave, 1, 999);
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
      if (score > existingScore || (score === existingScore && wave > Number(existingData.wave ?? 0))) {
        await setDoc(globalRef, {
          uid,
          callsign,
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
