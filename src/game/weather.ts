import { WeatherKind } from './types';

export interface WeatherAtmosphere {
  kind: WeatherKind;
  label: string;
  fogDensity: number;
  fogColorHex: number;
  rainIntensity: number; // 0..1
  windX: number;
  windZ: number;
  groundRoughness: number;
  groundMetalness: number;
  wetnessWashRate: number; // opacity/sec blood wash rate in rain
  lightningEnabled: boolean;
  durationSec: number;
}

export const WEATHER_CYCLE: WeatherKind[] = ['clear', 'mist', 'rain', 'storm'];

export const WEATHER_PRESETS: Record<WeatherKind, WeatherAtmosphere> = {
  clear: {
    kind: 'clear',
    label: 'Clear',
    fogDensity: 0.0145,
    fogColorHex: 0x070a10,
    rainIntensity: 0,
    windX: 0.35,
    windZ: 0.2,
    groundRoughness: 0.84,
    groundMetalness: 0.08,
    wetnessWashRate: 0,
    lightningEnabled: false,
    durationSec: 22,
  },
  mist: {
    kind: 'mist',
    label: 'Mist',
    fogDensity: 0.0245,
    fogColorHex: 0x0e1826,
    rainIntensity: 0.14,
    windX: 1.2,
    windZ: 0.7,
    groundRoughness: 0.68,
    groundMetalness: 0.11,
    wetnessWashRate: 0.004,
    lightningEnabled: false,
    durationSec: 20,
  },
  rain: {
    kind: 'rain',
    label: 'Rain',
    fogDensity: 0.021,
    fogColorHex: 0x091320,
    rainIntensity: 0.72,
    windX: -2.4,
    windZ: 1.4,
    groundRoughness: 0.36,
    groundMetalness: 0.18,
    wetnessWashRate: 0.018,
    lightningEnabled: false,
    durationSec: 26,
  },
  storm: {
    kind: 'storm',
    label: 'Storm',
    fogDensity: 0.0275,
    fogColorHex: 0x080f1d,
    rainIntensity: 1.0,
    windX: -4.4,
    windZ: 2.3,
    groundRoughness: 0.22,
    groundMetalness: 0.24,
    wetnessWashRate: 0.03,
    lightningEnabled: true,
    durationSec: 24,
  },
};

export function getNextWeatherKind(
  current: WeatherKind,
  wave: number,
): WeatherKind {
  if (wave > 0 && wave % 5 === 0) {
    return 'storm';
  }
  const idx = WEATHER_CYCLE.indexOf(current);
  return WEATHER_CYCLE[(idx + 1) % WEATHER_CYCLE.length];
}

export function getWeatherForWaveStart(wave: number): WeatherKind {
  if (wave > 0 && wave % 5 === 0) return 'storm';
  if (wave <= 1) return 'clear';
  return WEATHER_CYCLE[(wave - 1) % WEATHER_CYCLE.length];
}

export function parseWeatherParam(raw: string | null): WeatherKind | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  if (norm === 'clear' || norm === 'mist' || norm === 'rain' || norm === 'storm') {
    return norm;
  }
  return null;
}
