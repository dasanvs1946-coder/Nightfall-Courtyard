import { ARENA_ORDER } from './arenas';
import { ArenaId, DailyMutatorId } from './types';

export interface DailyMutatorSpec {
  id: DailyMutatorId;
  name: string;
  summary: string;
  spawnIntervalMult: number;
  zombieSpeedMult: number;
  dashCooldownMult: number;
  acidDropsOnDeath: boolean;
  blackoutLighting: boolean;
}

export const DAILY_MUTATOR_ORDER: DailyMutatorId[] = [
  'acid_rain',
  'hyper_dash',
  'volatile_horde',
  'blackout_surge',
];

export const DAILY_MUTATOR_SPECS: Record<DailyMutatorId, DailyMutatorSpec> = {
  acid_rain: {
    id: 'acid_rain',
    name: 'Acid Squall',
    summary: 'Storm weather · +12% infected move speed · +25% score bonus.',
    spawnIntervalMult: 0.95,
    zombieSpeedMult: 1.12,
    dashCooldownMult: 1.0,
    acidDropsOnDeath: false,
    blackoutLighting: false,
  },
  hyper_dash: {
    id: 'hyper_dash',
    name: 'Hyper Thrusters',
    summary: '-35% Dash cooldown · +15% faster wave spawns.',
    spawnIntervalMult: 0.85,
    zombieSpeedMult: 1.06,
    dashCooldownMult: 0.65,
    acidDropsOnDeath: false,
    blackoutLighting: false,
  },
  volatile_horde: {
    id: 'volatile_horde',
    name: 'Volatile Outbreak',
    summary: 'Heavy Bomber packs · Runners move +10% faster.',
    spawnIntervalMult: 0.92,
    zombieSpeedMult: 1.1,
    dashCooldownMult: 1.0,
    acidDropsOnDeath: true,
    blackoutLighting: false,
  },
  blackout_surge: {
    id: 'blackout_surge',
    name: 'Blackout Surge',
    summary: 'Reduced ambient light · Relies on generators & flashlight.',
    spawnIntervalMult: 0.96,
    zombieSpeedMult: 1.04,
    dashCooldownMult: 0.9,
    acidDropsOnDeath: false,
    blackoutLighting: true,
  },
};

export interface DailyChallengeConfig {
  dateKey: string;
  arena: ArenaId;
  mutator: DailyMutatorSpec;
  seedValue: number;
}

export function getUtcDateKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hashSeedString(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seedStr: string): () => number {
  let state = hashSeedString(seedStr) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyChallengeConfig(
  dateKey: string = getUtcDateKey(),
): DailyChallengeConfig {
  const seedValue = hashSeedString(`nightfall-daily-${dateKey}`);
  const rng = createSeededRng(`nightfall-daily-${dateKey}`);
  const arena = ARENA_ORDER[Math.floor(rng() * ARENA_ORDER.length)];
  const mutatorId =
    DAILY_MUTATOR_ORDER[Math.floor(rng() * DAILY_MUTATOR_ORDER.length)];
  return {
    dateKey,
    arena,
    mutator: DAILY_MUTATOR_SPECS[mutatorId],
    seedValue,
  };
}
