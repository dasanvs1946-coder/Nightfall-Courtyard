import { StorageLike } from './storage';
import { GameSettings, GraphicsQuality } from './types';

export const SETTINGS_STORAGE_KEY = 'nightfall_courtyard_settings_v1';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  hapticsEnabled: true,
  autoFire: false,
  showFps: false,
};

const VALID_QUALITIES: GraphicsQuality[] = ['low', 'medium', 'high'];

export function sanitizeSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_GAME_SETTINGS };
  }
  const obj = raw as Partial<GameSettings>;
  const graphicsQuality: GraphicsQuality = VALID_QUALITIES.includes(
    obj.graphicsQuality as GraphicsQuality,
  )
    ? (obj.graphicsQuality as GraphicsQuality)
    : DEFAULT_GAME_SETTINGS.graphicsQuality;

  return {
    graphicsQuality,
    hapticsEnabled:
      typeof obj.hapticsEnabled === 'boolean'
        ? obj.hapticsEnabled
        : DEFAULT_GAME_SETTINGS.hapticsEnabled,
    autoFire:
      typeof obj.autoFire === 'boolean'
        ? obj.autoFire
        : DEFAULT_GAME_SETTINGS.autoFire,
    showFps:
      typeof obj.showFps === 'boolean'
        ? obj.showFps
        : DEFAULT_GAME_SETTINGS.showFps,
  };
}

export function loadSettings(
  storage: StorageLike | null = getBrowserStorage(),
): GameSettings {
  if (!storage) return { ...DEFAULT_GAME_SETTINGS };
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAME_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export function saveSettings(
  settings: GameSettings,
  storage: StorageLike | null = getBrowserStorage(),
): GameSettings {
  const clean = sanitizeSettings(settings);
  if (storage) {
    try {
      storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore storage quota errors
    }
  }
  return clean;
}

export function isMobileDeviceViewport(
  viewportWidth: number,
  maxTouchPoints = 0,
): boolean {
  return viewportWidth < 900 || maxTouchPoints > 0;
}

export function getEffectivePixelRatio(
  quality: GraphicsQuality,
  devicePixelRatio: number,
  isMobile: boolean,
  isSoftwareGl: boolean,
): number {
  if (isSoftwareGl || quality === 'low') return 1;
  const safeDpr = Math.max(1, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1);
  if (quality === 'medium') {
    return isMobile ? Math.min(safeDpr, 1.25) : Math.min(safeDpr, 1.5);
  }
  // High quality clamps pixelRatio to max 1.5 on mobile, 2.0 on desktop
  return isMobile ? Math.min(safeDpr, 1.5) : Math.min(safeDpr, 2);
}

export function shouldEnableShadows(
  quality: GraphicsQuality,
  isSoftwareGl: boolean,
): boolean {
  if (isSoftwareGl) return false;
  return quality !== 'low';
}

export function getRainQualityScale(quality: GraphicsQuality): number {
  if (quality === 'low') return 0;
  if (quality === 'medium') return 0.55;
  return 1.0;
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
