import { ARENA_SPECS } from './arenas';
import {
  ArenaId,
  CrateKind,
  DailyMutatorId,
  GameModeId,
  WeeklyMutatorId,
  ZombieKind,
} from './types';

export interface ZombieArchetypeSpec {
  kind: ZombieKind;
  label: string;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  attackRange: number;
  attackWindup: number;
  attackCooldown: number;
  knockbackResist: number; // 0..1 (1 = immune)
  scoreValue: number;
  dropChance: number;
}

export const ZOMBIE_SPECS: Record<ZombieKind, ZombieArchetypeSpec> = {
  walker: {
    kind: 'walker',
    label: 'Walker',
    maxHp: 65,
    speed: 2.75,
    radius: 0.48,
    damage: 12,
    attackRange: 1.15,
    attackWindup: 0.3,
    attackCooldown: 0.95,
    knockbackResist: 0.1,
    scoreValue: 100,
    dropChance: 0.18,
  },
  runner: {
    kind: 'runner',
    label: 'Runner',
    maxHp: 42,
    speed: 4.55,
    radius: 0.42,
    damage: 14,
    attackRange: 1.2,
    attackWindup: 0.28,
    attackCooldown: 0.72,
    knockbackResist: 0.0,
    scoreValue: 150,
    dropChance: 0.24,
  },
  brute: {
    kind: 'brute',
    label: 'Brute',
    maxHp: 260,
    speed: 2.05,
    radius: 0.78,
    damage: 26,
    attackRange: 1.75,
    attackWindup: 0.55,
    attackCooldown: 1.35,
    knockbackResist: 0.68,
    scoreValue: 350,
    dropChance: 0.52,
  },
  spitter: {
    kind: 'spitter',
    label: 'Acid Spitter',
    maxHp: 78,
    speed: 2.55,
    radius: 0.5,
    damage: 16,
    attackRange: 11.5,
    attackWindup: 0.7,
    attackCooldown: 3.1,
    knockbackResist: 0.15,
    scoreValue: 220,
    dropChance: 0.28,
  },
  stalker: {
    kind: 'stalker',
    label: 'Shadow Stalker',
    maxHp: 52,
    speed: 4.35,
    radius: 0.44,
    damage: 18,
    attackRange: 1.35,
    attackWindup: 0.22,
    attackCooldown: 0.85,
    knockbackResist: 0.05,
    scoreValue: 240,
    dropChance: 0.28,
  },
  breacher: {
    kind: 'breacher',
    label: 'Riot Breacher',
    maxHp: 315,
    speed: 1.85,
    radius: 0.72,
    damage: 28,
    attackRange: 1.65,
    attackWindup: 0.5,
    attackCooldown: 1.35,
    knockbackResist: 0.78,
    scoreValue: 420,
    dropChance: 0.56,
  },
  bomber: {
    kind: 'bomber',
    label: 'Volatile Bomber',
    maxHp: 94,
    speed: 3.15,
    radius: 0.54,
    damage: 32,
    attackRange: 1.55,
    attackWindup: 0.42,
    attackCooldown: 1.1,
    knockbackResist: 0.22,
    scoreValue: 290,
    dropChance: 0.34,
  },
  howler: {
    kind: 'howler',
    label: 'Howler',
    maxHp: 88,
    speed: 2.45,
    radius: 0.48,
    damage: 14,
    attackRange: 10.5,
    attackWindup: 0.65,
    attackCooldown: 3.4,
    knockbackResist: 0.12,
    scoreValue: 270,
    dropChance: 0.34,
  },
  juggernaut: {
    kind: 'juggernaut',
    label: 'Juggernaut Charger',
    maxHp: 370,
    speed: 1.95,
    radius: 0.82,
    damage: 34,
    attackRange: 1.8,
    attackWindup: 0.5,
    attackCooldown: 1.3,
    knockbackResist: 0.82,
    scoreValue: 520,
    dropChance: 0.65,
  },
  siege_breaker: {
    kind: 'siege_breaker',
    label: 'Siege Breaker',
    maxHp: 235,
    speed: 2.5,
    radius: 0.68,
    damage: 28,
    attackRange: 1.6,
    attackWindup: 0.42,
    attackCooldown: 1.05,
    knockbackResist: 0.55,
    scoreValue: 410,
    dropChance: 0.45,
  },
  necromancer: {
    kind: 'necromancer',
    label: 'Necromancer',
    maxHp: 135,
    speed: 2.2,
    radius: 0.52,
    damage: 18,
    attackRange: 13.5,
    attackWindup: 0.65,
    attackCooldown: 2.75,
    knockbackResist: 0.25,
    scoreValue: 450,
    dropChance: 0.48,
  },
  matriarch: {
    kind: 'matriarch',
    label: 'Hive Matriarch',
    maxHp: 390,
    speed: 1.75,
    radius: 0.8,
    damage: 24,
    attackRange: 1.65,
    attackWindup: 0.55,
    attackCooldown: 1.35,
    knockbackResist: 0.72,
    scoreValue: 540,
    dropChance: 0.65,
  },
  crawler: {
    kind: 'crawler',
    label: 'Hive Crawler',
    maxHp: 28,
    speed: 4.85,
    radius: 0.34,
    damage: 9,
    attackRange: 1.0,
    attackWindup: 0.2,
    attackCooldown: 0.65,
    knockbackResist: 0.0,
    scoreValue: 75,
    dropChance: 0.08,
  },
  ravager: {
    kind: 'ravager',
    label: 'Apex Ravager',
    maxHp: 560,
    speed: 4.45,
    radius: 0.66,
    damage: 32,
    attackRange: 1.75,
    attackWindup: 0.32,
    attackCooldown: 0.85,
    knockbackResist: 0.45,
    scoreValue: 780,
    dropChance: 0.85,
  },
  boss: {
    kind: 'boss',
    label: 'Iron Warden',
    maxHp: 1520,
    speed: 2.48,
    radius: 1.1,
    damage: 40,
    attackRange: 2.65,
    attackWindup: 0.62,
    attackCooldown: 1.05,
    knockbackResist: 0.92,
    scoreValue: 2200,
    dropChance: 1.0,
  },
};

export interface WavePlan {
  wave: number;
  isBossWave: boolean;
  queue: ZombieKind[];
  spawnInterval: number;
  maxConcurrent: number;
  speedMultiplier: number;
  hpMultiplier: number;
  damageMultiplier: number;
}

export interface BuildWavePlanOptions {
  mode?: GameModeId;
  arena?: ArenaId;
  mutator?: DailyMutatorId;
  weeklyMutator?: WeeklyMutatorId;
}

export function isBossWaveNumber(
  wave: number,
  mode: GameModeId = 'normal',
): boolean {
  if (mode === 'boss_rush') return wave >= 1;
  return wave >= 5 && wave % 5 === 0;
}

export function getBossCycleHpMultiplier(wave: number): number {
  const cycle = Math.max(1, Math.floor(wave / 5));
  return (
    1 +
    Math.min(2, cycle - 1) * 0.25 +
    Math.max(0, cycle - 3) * 0.14
  );
}

export function getBossRangedCooldown(wave: number): number {
  const cycle = Math.max(1, Math.floor(wave / 5));
  return Math.max(1.45, 2.25 - (cycle - 1) * 0.1);
}

export function getBossTitle(wave: number): string {
  const titles = [
    'IRON WARDEN',
    'PLAGUE COLOSSUS',
    'DREAD JUGGERNAUT',
    'ABYSSAL TYRANT',
  ];
  const idx = Math.max(0, Math.floor(wave / 5) - 1) % titles.length;
  return `${titles[idx]} · W${wave}`;
}

export function getOverdriveTier(wave: number): 0 | 1 | 2 | 3 {
  if (wave >= 20) return 3;
  if (wave >= 15) return 2;
  if (wave >= 10) return 1;
  return 0;
}

export function getLateGameArmorRatio(wave: number): number {
  if (wave < 10) return 0;
  if (wave < 15) return 0.08;
  if (wave < 20) return 0.14;
  return Math.min(0.24, 0.18 + (wave - 20) * 0.005);
}

export function getLateGameProjectileSpeedMult(wave: number): number {
  if (wave < 10) return 1.0;
  if (wave < 15) return 1.12;
  if (wave < 20) return 1.24;
  return Math.min(1.45, 1.32 + (wave - 20) * 0.01);
}

export function buildWavePlan(
  wave: number,
  rng: () => number = Math.random,
  options: BuildWavePlanOptions = {},
): WavePlan {
  const mode = options.mode ?? 'normal';
  const arena = options.arena ?? 'courtyard';
  const mutator = options.mutator;
  const weeklyMutator = options.weeklyMutator;

  const isBossWave = isBossWaveNumber(wave, mode);
  const waves1To14 = Math.min(14, wave);
  const wavesPost14 = Math.max(0, wave - 14);
  const overdriveSquadBonus =
    wave >= 20 ? 10 : wave >= 15 ? 6 : wave >= 10 ? 3 : 0;
  const baseTotal = Math.min(
    72,
    Math.round(6 + waves1To14 * 2.4 + wavesPost14 * 0.65 + overdriveSquadBonus),
  );
  const totalCount =
    mode === 'boss_rush'
      ? Math.min(26, 6 + Math.round(wave * 1.25))
      : baseTotal;

  const queue: ZombieKind[] = [];

  for (let i = 0; i < totalCount; i++) {
    const roll = rng();
    if (wave === 1 && mode !== 'boss_rush') {
      queue.push(i >= totalCount - 2 && roll < 0.65 ? 'runner' : 'walker');
    } else if (wave === 2 && mode !== 'boss_rush') {
      if (roll < 0.34) queue.push('runner');
      else if (i === totalCount - 1 || roll > 0.9) queue.push('brute');
      else queue.push('walker');
    } else if (wave === 3 && mode !== 'boss_rush') {
      const bomberProb = mutator === 'volatile_horde' ? 0.24 : 0.14;
      const bruteProb = 0.12;
      const runnerProb = 0.28;
      if (roll < bruteProb) queue.push('brute');
      else if (roll < bruteProb + bomberProb) queue.push('bomber');
      else if (roll < bruteProb + bomberProb + runnerProb) queue.push('runner');
      else queue.push('walker');
    } else {
      const juggernautProb = wave >= 4 ? Math.min(0.11, 0.06 + (wave - 4) * 0.005) : 0;
      const spitterProb = wave >= 4 ? Math.min(0.13, 0.09 + (wave - 4) * 0.006) : 0;
      const siegeBreakerProb = wave >= 5 ? Math.min(0.1, 0.06 + (wave - 5) * 0.004) : 0;
      const bomberProb =
        wave >= 3
          ? Math.min(0.14, (mutator === 'volatile_horde' ? 0.16 : 0.08) + (wave - 3) * 0.005)
          : 0;
      const howlerProb = wave >= 6 ? Math.min(0.09, 0.06 + (wave - 6) * 0.004) : 0;
      const necroProb = wave >= 6 ? Math.min(0.09, 0.055 + (wave - 6) * 0.004) : 0;
      const stalkerProb = wave >= 7 ? Math.min(0.12, 0.08 + (wave - 7) * 0.005) : 0;
      const matriarchProb = wave >= 8 ? Math.min(0.08, 0.05 + (wave - 8) * 0.004) : 0;
      const breacherProb = wave >= 10 ? Math.min(0.1, 0.06 + (wave - 10) * 0.004) : 0;
      const ravagerProb = wave >= 12 ? Math.min(0.08, 0.04 + (wave - 12) * 0.004) : 0;
      const bruteProb = Math.min(0.1, 0.06 + Math.max(0, wave - 3) * 0.004);
      const runnerProb = Math.min(0.2, 0.15 + Math.max(0, wave - 3) * 0.004);

      let cursor = spitterProb;
      if (roll < cursor) {
        queue.push('spitter');
        continue;
      }
      cursor += juggernautProb;
      if (roll < cursor) {
        queue.push('juggernaut');
        continue;
      }
      cursor += siegeBreakerProb;
      if (roll < cursor) {
        queue.push('siege_breaker');
        continue;
      }
      cursor += bomberProb;
      if (roll < cursor) {
        queue.push('bomber');
        continue;
      }
      cursor += howlerProb;
      if (roll < cursor) {
        queue.push('howler');
        continue;
      }
      cursor += necroProb;
      if (roll < cursor) {
        queue.push('necromancer');
        continue;
      }
      cursor += stalkerProb;
      if (roll < cursor) {
        queue.push('stalker');
        continue;
      }
      cursor += matriarchProb;
      if (roll < cursor) {
        queue.push('matriarch');
        continue;
      }
      cursor += breacherProb;
      if (roll < cursor) {
        queue.push('breacher');
        continue;
      }
      cursor += ravagerProb;
      if (roll < cursor) {
        queue.push('ravager');
        continue;
      }
      cursor += bruteProb;
      if (roll < cursor) {
        queue.push('brute');
        continue;
      }
      cursor += runnerProb;
      if (roll < cursor) {
        queue.push('runner');
      } else {
        queue.push('walker');
      }
    }
  }

  // Ensure signature archetypes visibly debut at their milestone waves without clobbering one another
  if (wave >= 3 && !queue.includes('bomber')) {
    queue[Math.min(queue.length - 1, 1)] = 'bomber';
  }
  if (wave >= 4 && !queue.includes('spitter')) {
    queue[Math.min(queue.length - 1, 2)] = 'spitter';
  }
  if (wave >= 4 && !queue.includes('juggernaut')) {
    queue[Math.min(queue.length - 1, 3)] = 'juggernaut';
  }
  if (wave >= 5 && !queue.includes('siege_breaker')) {
    queue[Math.min(queue.length - 1, 4)] = 'siege_breaker';
  }
  if (wave >= 6 && !queue.includes('howler')) {
    queue[Math.min(queue.length - 1, 5)] = 'howler';
  }
  if (wave >= 6 && !queue.includes('necromancer')) {
    queue[Math.min(queue.length - 1, 6)] = 'necromancer';
  }
  if (wave >= 7 && !queue.includes('stalker')) {
    queue[Math.min(queue.length - 1, 7)] = 'stalker';
  }
  if (wave >= 8 && !queue.includes('matriarch')) {
    queue[Math.min(queue.length - 1, 8)] = 'matriarch';
  }
  if (wave >= 10 && !queue.includes('breacher')) {
    queue[Math.min(queue.length - 1, 9)] = 'breacher';
  }
  if (wave >= 12 && !queue.includes('ravager')) {
    queue[Math.min(queue.length - 1, 10)] = 'ravager';
  }

  if (isBossWave) {
    queue.unshift('boss');
  }

  const baseWaves = Math.min(4, Math.max(0, wave - 1));
  const midWaves = Math.min(9, Math.max(0, wave - 5));
  const lateWaves = Math.max(0, wave - 14);
  const overdriveHpStep =
    wave >= 20 ? 1.18 : wave >= 15 ? 1.09 : wave >= 10 ? 1.04 : 1.0;

  const weeklyHpMult = weeklyMutator === 'all_elite_nightmare' ? 1.35 : 1.0;
  const hpMultiplier =
    Math.pow(1.025, baseWaves) *
    Math.pow(1.055, midWaves) *
    (1 + lateWaves * 0.04) *
    overdriveHpStep *
    weeklyHpMult;
  const damageMultiplier =
    Math.pow(1.005, baseWaves) *
    Math.pow(1.018, midWaves) *
    Math.pow(1.008, lateWaves);

  let speedMultiplier =
    1 +
    Math.min(0.18, Math.max(0, wave - 1) * 0.03) +
    Math.min(0.15, Math.max(0, wave - 6) * 0.0055);

  if (mutator === 'acid_rain') speedMultiplier *= 1.12;
  else if (mutator === 'hyper_dash') speedMultiplier *= 1.06;
  else if (mutator === 'volatile_horde') speedMultiplier *= 1.1;
  else if (mutator === 'blackout_surge') speedMultiplier *= 1.04;

  if (weeklyMutator === 'hyper_speed_2x') speedMultiplier *= 2.0;

  const arenaSpawnMult = ARENA_SPECS[arena].spawnIntervalMultiplier;
  const mutatorSpawnMult =
    mutator === 'hyper_dash'
      ? 0.85
      : mutator === 'volatile_horde'
        ? 0.92
        : mutator === 'acid_rain'
          ? 0.95
          : 1.0;

  const baseInterval = Math.max(
    0.37,
    1.35 - Math.min(4, Math.max(0, wave - 1)) * 0.1 - midWaves * 0.035 - lateWaves * 0.012,
  );
  const spawnInterval = Math.max(0.32, baseInterval * arenaSpawnMult * mutatorSpawnMult);

  return {
    wave,
    isBossWave,
    queue,
    spawnInterval,
    maxConcurrent: Math.min(
      30,
      Math.round(7 + Math.min(12, wave) * 1.4 + Math.max(0, wave - 12) * 0.35),
    ),
    speedMultiplier,
    hpMultiplier,
    damageMultiplier,
  };
}

export function isPointInFlashlightCone(
  playerX: number,
  playerZ: number,
  playerAimAngle: number,
  targetX: number,
  targetZ: number,
  maxRange = 14.5,
  halfAngleRad = Math.PI / 4.8,
): boolean {
  const dx = targetX - playerX;
  const dz = targetZ - playerZ;
  const distSq = dx * dx + dz * dz;
  if (distSq > maxRange * maxRange) return false;
  if (distSq < 1.2) return true;
  const dist = Math.sqrt(distSq);
  const fwdX = -Math.sin(playerAimAngle);
  const fwdZ = -Math.cos(playerAimAngle);
  const dot = (dx / dist) * fwdX + (dz / dist) * fwdZ;
  return dot >= Math.cos(halfAngleRad);
}

export function computeZombieHitDamage(
  rawDamage: number,
  kind: ZombieKind,
  bulletDirX: number,
  bulletDirZ: number,
  zombieFacingX: number,
  zombieFacingZ: number,
  armorBypass = false,
  juggernautArmorIntact = true,
  lateGameArmorRatio = 0,
): { finalDamage: number; blockedByArmor: boolean } {
  const dot = bulletDirX * zombieFacingX + bulletDirZ * zombieFacingZ;

  if (kind === 'breacher' && !armorBypass && dot < -0.25) {
    return {
      finalDamage: Math.max(1, Math.round(rawDamage * 0.35)),
      blockedByArmor: true,
    };
  }

  if (
    kind === 'juggernaut' &&
    juggernautArmorIntact &&
    !armorBypass &&
    dot < -0.15
  ) {
    return {
      finalDamage: Math.max(1, Math.round(rawDamage * 0.4)),
      blockedByArmor: true,
    };
  }

  if (!armorBypass && lateGameArmorRatio > 0) {
    const scaled = rawDamage * (1 - Math.min(0.3, lateGameArmorRatio));
    return {
      finalDamage: Math.max(1, Math.round(scaled)),
      blockedByArmor: false,
    };
  }

  return { finalDamage: Math.max(1, Math.round(rawDamage)), blockedByArmor: false };
}

export function rollCrateDrop(
  kind: ZombieKind,
  playerHpRatio: number,
  rng: () => number = Math.random,
): CrateKind | null {
  const spec = ZOMBIE_SPECS[kind];
  if (rng() > spec.dropChance) return null;

  const r = rng();
  const healthWeight = playerHpRatio < 0.55 ? 0.48 : 0.34;
  const ammoWeight = 0.4;
  if (r < healthWeight) return 'health';
  if (r < healthWeight + ammoWeight) return 'ammo';
  return 'rapidfire';
}
