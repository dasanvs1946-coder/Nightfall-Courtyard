import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

function triggerImpact(style: ImpactStyle, webDurationMs: number): void {
  if (!hapticsEnabled) return;
  try {
    if (Capacitor.isNativePlatform()) {
      void Haptics.impact({ style }).catch(() => {});
      return;
    }
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    ) {
      navigator.vibrate(webDurationMs);
    }
  } catch {
    // Safe fallback on unsupported browsers
  }
}

export function hapticShotgunBlast(): void {
  triggerImpact(ImpactStyle.Heavy, 32);
}

export function hapticPlayerDamage(): void {
  triggerImpact(ImpactStyle.Medium, 45);
}

export function hapticTurretDeploy(): void {
  triggerImpact(ImpactStyle.Light, 20);
}

export function hapticReviveShockwave(): void {
  if (!hapticsEnabled) return;
  try {
    if (Capacitor.isNativePlatform()) {
      void Haptics.vibrate({ duration: 120 }).catch(() => {});
      return;
    }
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    ) {
      navigator.vibrate([45, 30, 75]);
    }
  } catch {
    // Safe fallback
  }
}
