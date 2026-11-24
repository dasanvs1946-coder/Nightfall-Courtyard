import { Capacitor } from '@capacitor/core';
import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  ensureAnonymousAuth,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  loadCareerStats,
  sanitizeCareerStats,
  saveCareerStats,
} from '../game/career';
import {
  isValidCallsign,
  loadCallsign,
  loadClanTag,
  loadHighScore,
  sanitizeCallsign,
  sanitizeClanTag,
  saveCallsign,
  saveClanTag,
  saveHighScore,
} from '../game/storage';
import { CareerStats } from '../game/types';

export interface CloudPlayerSnapshot {
  callsign: string;
  clanTag: string;
  highScore: number;
  career: CareerStats;
  updatedAtMs: number;
}

const TRANSFER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function getSafeHost(): string {
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname.slice(0, 128) || 'localhost';
    }
  } catch {
    // ignore
  }
  return 'capacitor-apk';
}

function getLoginPlatformTag(): 'APK' | 'WEB' {
  try {
    return Capacitor.isNativePlatform() ? 'APK' : 'WEB';
  } catch {
    return 'WEB';
  }
}

function normalizeSafeCallsign(raw: string): string {
  const clean = sanitizeCallsign(raw).trim();
  return isValidCallsign(clean) ? clean : loadCallsign();
}

function toTimestampMs(ts: unknown): number {
  if (
    ts &&
    typeof ts === 'object' &&
    'toMillis' in ts &&
    typeof (ts as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return Number((ts as { toMillis: () => number }).toMillis()) || 0;
  }
  return 0;
}

export async function recordPlatformLogin(user: User): Promise<void> {
  if (!user?.uid) return;
  const path = `player_logins/${user.uid}`;
  const ref = doc(db, 'player_logins', user.uid);
  const platform = getLoginPlatformTag();
  const host = getSafeHost();

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        platform,
        host,
        loginCount: 1,
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        platform,
        host,
        loginCount: increment(1),
        lastLoginAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function backupCareerToCloud(params: {
  career: CareerStats;
  highScore: number;
  callsign: string;
  clanTag: string;
}): Promise<boolean> {
  let user = auth.currentUser;
  if (!user) {
    const res = await ensureAnonymousAuth();
    user = res.user;
  }
  if (!user) return false;

  const uid = user.uid;
  const path = `players/${uid}`;
  const ref = doc(db, 'players', uid);
  const cleanCareer = sanitizeCareerStats(params.career);
  const cleanCallsign = normalizeSafeCallsign(params.callsign);
  const cleanClanTag = sanitizeClanTag(params.clanTag);
  const cleanHighScore = Math.max(
    0,
    Math.min(100_000_000, Math.round(Math.max(params.highScore, cleanCareer.bestScore))),
  );

  try {
    await setDoc(ref, {
      uid,
      callsign: cleanCallsign,
      clanTag: cleanClanTag,
      highScore: cleanHighScore,
      career: cleanCareer,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchCloudCareerBackup(): Promise<CloudPlayerSnapshot | null> {
  let user = auth.currentUser;
  if (!user) {
    const res = await ensureAnonymousAuth();
    user = res.user;
  }
  if (!user) return null;

  const path = `players/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'players', user.uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      callsign: normalizeSafeCallsign(String(data.callsign ?? '')),
      clanTag: sanitizeClanTag(String(data.clanTag ?? '')),
      highScore: Math.max(0, Math.round(Number(data.highScore) || 0)),
      career: sanitizeCareerStats(data.career),
      updatedAtMs: toTimestampMs(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function isLocalCareerFresh(career: CareerStats, highScore: number): boolean {
  return (
    career.totalKills === 0 &&
    career.scrap === 0 &&
    career.bestScore === 0 &&
    career.bestWave <= 1 &&
    highScore === 0 &&
    career.unlockedWeapons.length === 0 &&
    career.unlockedDrones.length === 0
  );
}

export async function autoRestoreCloudSaveIfFresh(): Promise<CloudPlayerSnapshot | null> {
  const localCareer = loadCareerStats();
  const localHigh = loadHighScore();
  const cloud = await fetchCloudCareerBackup();
  if (!cloud) return null;

  const localTotalProgress =
    localCareer.totalKills + localCareer.scrap + localHigh + localCareer.bestWave * 50;
  const cloudTotalProgress =
    cloud.career.totalKills + cloud.career.scrap + cloud.highScore + cloud.career.bestWave * 50;

  if (isLocalCareerFresh(localCareer, localHigh) && cloudTotalProgress > localTotalProgress) {
    saveCareerStats(cloud.career);
    saveHighScore(cloud.highScore);
    saveCallsign(cloud.callsign);
    saveClanTag(cloud.clanTag);
    return cloud;
  }
  return null;
}

function generateSixCharCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += TRANSFER_ALPHABET[Math.floor(Math.random() * TRANSFER_ALPHABET.length)];
  }
  return out;
}

export async function createTransferCode(params?: {
  career?: CareerStats;
  highScore?: number;
  callsign?: string;
  clanTag?: string;
}): Promise<string> {
  let user = auth.currentUser;
  if (!user) {
    const res = await ensureAnonymousAuth();
    user = res.user;
  }
  if (!user) {
    throw new Error('Connect to network before generating a Transfer Code.');
  }

  const uid = user.uid;
  const cleanCareer = sanitizeCareerStats(params?.career ?? loadCareerStats());
  const cleanCallsign = normalizeSafeCallsign(params?.callsign ?? loadCallsign());
  const cleanClanTag = sanitizeClanTag(params?.clanTag ?? loadClanTag());
  const cleanHighScore = Math.max(
    0,
    Math.min(
      100_000_000,
      Math.round(Math.max(params?.highScore ?? loadHighScore(), cleanCareer.bestScore)),
    ),
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSixCharCode();
    const path = `transfer_codes/${code}`;
    const ref = doc(db, 'transfer_codes', code);
    try {
      const existing = await getDoc(ref);
      if (existing.exists() && existing.data().ownerUid !== uid) {
        continue;
      }
      await setDoc(ref, {
        code,
        ownerUid: uid,
        callsign: cleanCallsign,
        clanTag: cleanClanTag,
        highScore: cleanHighScore,
        career: cleanCareer,
        createdAt: existing.exists()
          ? existing.data().createdAt ?? serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await backupCareerToCloud({
        career: cleanCareer,
        highScore: cleanHighScore,
        callsign: cleanCallsign,
        clanTag: cleanClanTag,
      });
      return code;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  throw new Error('Unable to allocate a unique Transfer Code. Try again.');
}

export async function redeemTransferCode(rawCode: string): Promise<CloudPlayerSnapshot> {
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    throw new Error('Enter a valid 6-character Transfer Code.');
  }

  let user = auth.currentUser;
  if (!user) {
    const res = await ensureAnonymousAuth();
    user = res.user;
  }
  if (!user) {
    throw new Error('Network connection required to redeem a Transfer Code.');
  }

  const path = `transfer_codes/${code}`;
  let snap;
  try {
    snap = await getDoc(doc(db, 'transfer_codes', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw new Error('Failed to fetch Transfer Code from cloud.');
  }

  if (!snap.exists()) {
    throw new Error(`Transfer Code "${code}" not found.`);
  }

  const data = snap.data();
  const restoredCareer = sanitizeCareerStats(data.career);
  const restoredCallsign = normalizeSafeCallsign(String(data.callsign ?? loadCallsign()));
  const restoredClanTag = sanitizeClanTag(String(data.clanTag ?? ''));
  const restoredHigh = Math.max(
    0,
    Math.round(Math.max(Number(data.highScore) || 0, restoredCareer.bestScore)),
  );

  saveCareerStats(restoredCareer);
  saveHighScore(restoredHigh);
  saveCallsign(restoredCallsign);
  saveClanTag(restoredClanTag);

  await backupCareerToCloud({
    career: restoredCareer,
    highScore: restoredHigh,
    callsign: restoredCallsign,
    clanTag: restoredClanTag,
  });

  return {
    callsign: restoredCallsign,
    clanTag: restoredClanTag,
    highScore: restoredHigh,
    career: restoredCareer,
    updatedAtMs: Date.now(),
  };
}
