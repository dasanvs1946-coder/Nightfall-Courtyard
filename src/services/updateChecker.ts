import { Capacitor } from '@capacitor/core';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { isRemoteVersionNewer } from '../game/semver';
import { RemoteAppConfig } from '../game/types';

function isSafeDownloadUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function checkForAndroidUpdate(
  localVersion: string,
): Promise<RemoteAppConfig | null> {
  // Strictly Android-only native check — never run or display on Web
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const ref = doc(db, 'config', 'app');
  try {
    let snap;
    try {
      snap = await getDocFromServer(ref);
    } catch {
      snap = await getDoc(ref);
    }

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as Partial<RemoteAppConfig> | undefined;
    if (!data || typeof data.latestVersion !== 'string') {
      return null;
    }

    if (!isRemoteVersionNewer(data.latestVersion, localVersion)) {
      return null;
    }

    const downloadUrl =
      typeof data.downloadUrl === 'string' && isSafeDownloadUrl(data.downloadUrl)
        ? data.downloadUrl
        : 'https://nightfallcourtyard.lovable.app';

    const changelog =
      typeof data.changelog === 'string' ? data.changelog.trim() : '';

    return {
      latestVersion: data.latestVersion.trim(),
      downloadUrl,
      changelog,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'config/app');
    return null;
  }
}
