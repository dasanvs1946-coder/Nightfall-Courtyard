import { StorageLike } from './storage';
import {
  FpsCap,
  GameSettings,
  GraphicsQuality,
  TouchButtonOffset,
  TouchHudSettings,
} from './types';

export const SETTINGS_STORAGE_KEY = 'nightfall_courtyard_settings_v1';

export const DEFAULT_TOUCH_HUD_SETTINGS: TouchHudSettings = {
  joystickScale: 1,
  buttonOpacity: 0.92,
  dashOffset: { x: 0, y: 0 },
  ultimateOffset: { x: 0, y: 0 },
  gadgetOffset: { x: 0, y: 0 },
  reloadOffset: { x: 0, y: 0 },
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  fpsCap: 60,
  hapticsEnabled: true,
  autoFire: false,
  showFps: false,
  masterVolume: 0.85,
  musicVolume: 0.7,
  sfxVolume: 0.85,
  touchHud: {
    ...DEFAULT_TOUCH_HUD_SETTINGS,
    dashOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.dashOffset },
    ultimateOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.ultimateOffset },
    gadgetOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.gadgetOffset },
    reloadOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.reloadOffset },
  },
};

const VALID_QUALITIES: GraphicsQuality[] = ['low', 'medium', 'high'];
const VALID_FPS_CAPS: FpsCap[] = [30, 60, 120];

function clampNumber(val: unknown, fallback: number, min: number, max: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function sanitizeOffset(raw: unknown): TouchButtonOffset {
  if (!raw || typeof raw !== 'object') return { x: 0, y: 0 };
  const obj = raw as Partial<TouchButtonOffset>;
  return {
    x: Math.round(clampNumber(obj.x, 0, -72, 72)),
    y: Math.round(clampNumber(obj.y, 0, -72, 72)),
  };
}

export function sanitizeTouchHudSettings(raw: unknown): TouchHudSettings {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_TOUCH_HUD_SETTINGS,
      dashOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.dashOffset },
      ultimateOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.ultimateOffset },
      gadgetOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.gadgetOffset },
      reloadOffset: { ...DEFAULT_TOUCH_HUD_SETTINGS.reloadOffset },
    };
  }
  const obj = raw as Partial<TouchHudSettings>;
  return {
    joystickScale: Number(
      clampNumber(obj.joystickScale, DEFAULT_TOUCH_HUD_SETTINGS.joystickScale, 0.75, 1.35).toFixed(2),
    ),
    buttonOpacity: Number(
      clampNumber(obj.buttonOpacity, DEFAULT_TOUCH_HUD_SETTINGS.buttonOpacity, 0.4, 1.0).toFixed(2),
    ),
    dashOffset: sanitizeOffset(obj.dashOffset),
    ultimateOffset: sanitizeOffset(obj.ultimateOffset),
    gadgetOffset: sanitizeOffset(obj.gadgetOffset),
    reloadOffset: sanitizeOffset(obj.reloadOffset),
  };
}

export function sanitizeSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_GAME_SETTINGS,
      touchHud: sanitizeTouchHudSettings(null),
    };
  }
  const obj = raw as Partial<GameSettings>;
  const graphicsQuality: GraphicsQuality = VALID_QUALITIES.includes(
    obj.graphicsQuality as GraphicsQuality,
  )
    ? (obj.graphicsQuality as GraphicsQuality)
    : DEFAULT_GAME_SETTINGS.graphicsQuality;

  const fpsCap: FpsCap = VALID_FPS_CAPS.includes(obj.fpsCap as FpsCap)
    ? (obj.fpsCap as FpsCap)
    : DEFAULT_GAME_SETTINGS.fpsCap;

  return {
    graphicsQuality,
    fpsCap,
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
    masterVolume: Number(
      clampNumber(obj.masterVolume, DEFAULT_GAME_SETTINGS.masterVolume, 0, 1).toFixed(2),
    ),
    musicVolume: Number(
      clampNumber(obj.musicVolume, DEFAULT_GAME_SETTINGS.musicVolume, 0, 1).toFixed(2),
    ),
    sfxVolume: Number(
      clampNumber(obj.sfxVolume, DEFAULT_GAME_SETTINGS.sfxVolume, 0, 1).toFixed(2),
    ),
    touchHud: sanitizeTouchHudSettings(obj.touchHud),
  };
}

export function loadSettings(
  storage: StorageLike | null = getBrowserStorage(),
): GameSettings {
  if (!storage) return sanitizeSettings(null);
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return sanitizeSettings(null);
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return sanitizeSettings(null);
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
  if (isSoftwareGl) return 1;
  if (quality === 'low') return 0.75;
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

export function shouldEnableBloom(
  quality: GraphicsQuality,
  isSoftwareGl: boolean,
): boolean {
  if (isSoftwareGl) return false;
  return quality === 'high';
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
