import { CrateKind, ZombieKind } from './types';

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
  boss: {
    kind: 'boss',
    label: 'Overlord',
    maxHp: 980,
    speed: 2.35,
    radius: 1.08,
    damage: 36,
    attackRange: 2.55,
    attackWindup: 0.72,
    attackCooldown: 1.6,
    knockbackResist: 0.9,
    scoreValue: 1800,
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

export function isBossWaveNumber(wave: number): boolean {
  return wave >= 5 && wave % 5 === 0;
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

export function buildWavePlan(wave: number, rng: () => number = Math.random): WavePlan {
  const isBossWave = isBossWaveNumber(wave);
  const totalCount = Math.min(48, 7 + wave * 4);
  const queue: ZombieKind[] = [];

  for (let i = 0; i < totalCount; i++) {
    const roll = rng();
    if (wave === 1) {
      queue.push(i >= totalCount - 2 && roll < 0.65 ? 'runner' : 'walker');
    } else if (wave === 2) {
      if (roll < 0.34) queue.push('runner');
      else if (i === totalCount - 1 || roll > 0.9) queue.push('brute');
      else queue.push('walker');
    } else {
      const bruteProb = Math.min(0.24, 0.1 + (wave - 3) * 0.03);
      const runnerProb = Math.min(0.4, 0.28 + (wave - 3) * 0.02);
      if (roll < bruteProb) queue.push('brute');
      else if (roll < bruteProb + runnerProb) queue.push('runner');
      else queue.push('walker');
    }
  }

  if (isBossWave) {
    // Spawn boss immediately at the start of the wave alongside supporting horde
    queue.unshift('boss');
  }

  return {
    wave,
    isBossWave,
    queue,
    spawnInterval: Math.max(0.42, 1.35 - (wave - 1) * 0.11),
    maxConcurrent: Math.min(22, 7 + wave * 2),
    speedMultiplier: 1 + Math.min(0.35, (wave - 1) * 0.045),
    hpMultiplier: Math.pow(1.025, Math.max(0, wave - 1)),
    damageMultiplier: Math.pow(1.005, Math.max(0, wave - 1)),
  };
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
