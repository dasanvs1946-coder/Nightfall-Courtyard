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

export function isBossWaveNumber(wave: number): boolean {
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

export function buildWavePlan(wave: number, rng: () => number = Math.random): WavePlan {
  const isBossWave = isBossWaveNumber(wave);
  const waves1To14 = Math.min(14, wave);
  const wavesPost14 = Math.max(0, wave - 14);
  const totalCount = Math.min(
    62,
    Math.round(6 + waves1To14 * 2.4 + wavesPost14 * 0.65),
  );
  const queue: ZombieKind[] = [];

  for (let i = 0; i < totalCount; i++) {
    const roll = rng();
    if (wave === 1) {
      queue.push(i >= totalCount - 2 && roll < 0.65 ? 'runner' : 'walker');
    } else if (wave === 2) {
      if (roll < 0.34) queue.push('runner');
      else if (i === totalCount - 1 || roll > 0.9) queue.push('brute');
      else queue.push('walker');
    } else if (wave === 3) {
      const bruteProb = 0.14;
      const runnerProb = 0.3;
      if (roll < bruteProb) queue.push('brute');
      else if (roll < bruteProb + runnerProb) queue.push('runner');
      else queue.push('walker');
    } else {
      // Wave 4+: Acid Spitters; Wave 7+: Shadow Stalkers; Wave 10+: Riot Breachers
      const spitterProb = wave >= 4 ? Math.min(0.16, 0.11 + (wave - 4) * 0.008) : 0;
      const stalkerProb = wave >= 7 ? Math.min(0.14, 0.09 + (wave - 7) * 0.008) : 0;
      const breacherProb = wave >= 10 ? Math.min(0.12, 0.07 + (wave - 10) * 0.006) : 0;
      const bruteProb = Math.min(0.16, 0.1 + (wave - 3) * 0.01);
      const runnerProb = Math.min(0.26, 0.22 + (wave - 3) * 0.006);

      let cursor = spitterProb;
      if (roll < cursor) {
        queue.push('spitter');
        continue;
      }
      cursor += stalkerProb;
      if (roll < cursor) {
        queue.push('stalker');
        continue;
      }
      cursor += breacherProb;
      if (roll < cursor) {
        queue.push('breacher');
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

  // Ensure new signature archetypes visibly debut at their milestone waves
  if (wave >= 4 && !queue.includes('spitter')) {
    queue[Math.min(queue.length - 1, 2)] = 'spitter';
  }
  if (wave >= 7 && !queue.includes('stalker')) {
    queue[Math.min(queue.length - 1, 3)] = 'stalker';
  }
  if (wave >= 10 && !queue.includes('breacher')) {
    queue[Math.min(queue.length - 1, 4)] = 'breacher';
  }

  if (isBossWave) {
    // Spawn boss immediately at the start of the wave alongside supporting horde
    queue.unshift('boss');
  }

  // Waves 1-5: +2.5% HP / +0.5% damage per round
  // Waves 6-14: moderate mid-game ramp; Wave 15+: flattened scaling to prevent extreme bullet sponges
  const baseWaves = Math.min(4, Math.max(0, wave - 1));
  const midWaves = Math.min(9, Math.max(0, wave - 5));
  const lateWaves = Math.max(0, wave - 14);

  const hpMultiplier =
    Math.pow(1.025, baseWaves) *
    Math.pow(1.055, midWaves) *
    (1 + lateWaves * 0.045);
  const damageMultiplier =
    Math.pow(1.005, baseWaves) *
    Math.pow(1.018, midWaves) *
    Math.pow(1.008, lateWaves);
  const speedMultiplier =
    1 +
    Math.min(0.18, Math.max(0, wave - 1) * 0.03) +
    Math.min(0.16, Math.max(0, wave - 6) * 0.006);

  return {
    wave,
    isBossWave,
    queue,
    spawnInterval: Math.max(
      0.38,
      1.35 - Math.min(4, Math.max(0, wave - 1)) * 0.1 - midWaves * 0.035 - lateWaves * 0.012,
    ),
    maxConcurrent: Math.min(
      26,
      Math.round(7 + Math.min(12, wave) * 1.4 + Math.max(0, wave - 12) * 0.25),
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
): { finalDamage: number; blockedByArmor: boolean } {
  if (kind !== 'breacher' || armorBypass) {
    return { finalDamage: Math.max(1, Math.round(rawDamage)), blockedByArmor: false };
  }
  const dot = bulletDirX * zombieFacingX + bulletDirZ * zombieFacingZ;
  // Bullet traveling opposite to Breacher's front shield normal strikes front armor
  if (dot < -0.25) {
    return {
      finalDamage: Math.max(1, Math.round(rawDamage * 0.35)),
      blockedByArmor: true,
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
