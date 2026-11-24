import { Capacitor } from '@capacitor/core';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { isRemoteVersionNewer } from '../game/semver';
import { RemoteAppConfig } from '../game/types';

export interface AppUpdateInfo extends RemoteAppConfig {
  platform: 'APK' | 'WEB';
}

function isSafeDownloadUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function checkForAppUpdate(
  localVersion: string,
): Promise<AppUpdateInfo | null> {
  const isNative = (() => {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  })();

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
      platform: isNative ? 'APK' : 'WEB',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'config/app');
    return null;
  }
}

export async function checkForAndroidUpdate(
  localVersion: string,
): Promise<RemoteAppConfig | null> {
  const res = await checkForAppUpdate(localVersion);
  if (!res || res.platform !== 'APK') return null;
  return {
    latestVersion: res.latestVersion,
    downloadUrl: res.downloadUrl,
    changelog: res.changelog,
  };
}

export async function triggerWebCacheBustReload(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if ('caches' in window && window.caches) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
    if ('serviceWorker' in navigator && navigator.serviceWorker?.getRegistrations) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // Ignore storage/cache cleanup restrictions
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}
