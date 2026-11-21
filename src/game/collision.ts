import { ObstacleBox } from './types';

export const ARENA_HALF_SIZE = 21.5;

export const COURTYARD_OBSTACLES: ObstacleBox[] = [
  // Abandoned sedans/taxis providing mid-lane tactical cover (open center at 0,0)
  {
    id: 'car-nw',
    kind: 'car',
    x: -8.5,
    z: -7.0,
    halfW: 2.15,
    halfD: 1.02,
    height: 1.45,
    rotationY: 0.18,
    blocksBullets: true,
    colorVariant: 0,
  },
  {
    id: 'car-ne',
    kind: 'car',
    x: 9.2,
    z: -7.5,
    halfW: 1.02,
    halfD: 2.15,
    height: 1.45,
    rotationY: -0.14,
    blocksBullets: true,
    colorVariant: 1,
  },
  {
    id: 'car-sw',
    kind: 'car',
    x: -9.4,
    z: 8.2,
    halfW: 1.02,
    halfD: 2.15,
    height: 1.45,
    rotationY: 0.12,
    blocksBullets: true,
    colorVariant: 2,
  },
  {
    id: 'car-se',
    kind: 'car',
    x: 8.4,
    z: 8.8,
    halfW: 2.15,
    halfD: 1.02,
    height: 1.45,
    rotationY: -0.22,
    blocksBullets: true,
    colorVariant: 0,
  },

  // Supply crate clusters (low-to-medium tactical cover)
  {
    id: 'crate-n',
    kind: 'crate',
    x: 0.2,
    z: -11.5,
    halfW: 1.35,
    halfD: 0.85,
    height: 1.2,
    rotationY: 0.06,
    blocksBullets: true,
  },
  {
    id: 'crate-s',
    kind: 'crate',
    x: -0.4,
    z: 11.8,
    halfW: 1.4,
    halfD: 0.85,
    height: 1.2,
    rotationY: -0.08,
    blocksBullets: true,
  },
  {
    id: 'crate-w',
    kind: 'crate',
    x: -14.2,
    z: 0.4,
    halfW: 0.9,
    halfD: 1.45,
    height: 1.25,
    rotationY: 0.1,
    blocksBullets: true,
  },
  {
    id: 'crate-e',
    kind: 'crate',
    x: 14.5,
    z: -0.5,
    halfW: 0.9,
    halfD: 1.45,
    height: 1.25,
    rotationY: -0.12,
    blocksBullets: true,
  },
  {
    id: 'crate-mid-w',
    kind: 'crate',
    x: -5.2,
    z: 2.6,
    halfW: 0.8,
    halfD: 0.8,
    height: 1.15,
    rotationY: 0.35,
    blocksBullets: true,
  },
  {
    id: 'crate-mid-e',
    kind: 'crate',
    x: 5.5,
    z: -2.4,
    halfW: 0.8,
    halfD: 0.8,
    height: 1.15,
    rotationY: -0.28,
    blocksBullets: true,
  },

  // Streetlamp bases at the four courtyard plaza corners
  {
    id: 'lamp-nw',
    kind: 'lamp',
    x: -13.0,
    z: -13.0,
    halfW: 0.42,
    halfD: 0.42,
    height: 5.4,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'lamp-ne',
    kind: 'lamp',
    x: 13.0,
    z: -13.0,
    halfW: 0.42,
    halfD: 0.42,
    height: 5.4,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'lamp-sw',
    kind: 'lamp',
    x: -13.0,
    z: 13.0,
    halfW: 0.42,
    halfD: 0.42,
    height: 5.4,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'lamp-se',
    kind: 'lamp',
    x: 13.0,
    z: 13.0,
    halfW: 0.42,
    halfD: 0.42,
    height: 5.4,
    rotationY: 0,
    blocksBullets: true,
  },
];

export interface Vec2 {
  x: number;
  z: number;
}

/**
 * Resolves circle collision against an oriented 2D box (OBB) in XZ plane.
 * Returns updated position.
 */
export function resolveCircleVsObstacle(
  px: number,
  pz: number,
  radius: number,
  obs: ObstacleBox,
): Vec2 {
  const dx = px - obs.x;
  const dz = pz - obs.z;
  const cos = Math.cos(-obs.rotationY);
  const sin = Math.sin(-obs.rotationY);

  // Rotate circle center into obstacle local space
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;

  const clampedX = Math.max(-obs.halfW, Math.min(obs.halfW, lx));
  const clampedZ = Math.max(-obs.halfD, Math.min(obs.halfD, lz));

  const diffX = lx - clampedX;
  const diffZ = lz - clampedZ;
  const distSq = diffX * diffX + diffZ * diffZ;

  if (distSq >= radius * radius) {
    return { x: px, z: pz };
  }

  let pushLocalX = 0;
  let pushLocalZ = 0;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    pushLocalX = (diffX / dist) * overlap;
    pushLocalZ = (diffZ / dist) * overlap;
  } else {
    // Center is inside the box: push out along nearest edge
    const penX = obs.halfW - Math.abs(lx) + radius;
    const penZ = obs.halfD - Math.abs(lz) + radius;
    if (penX < penZ) {
      pushLocalX = lx >= 0 ? penX : -penX;
    } else {
      pushLocalZ = lz >= 0 ? penZ : -penZ;
    }
  }

  // Rotate push vector back to world space (+rotationY)
  const wCos = Math.cos(obs.rotationY);
  const wSin = Math.sin(obs.rotationY);
  return {
    x: px + (pushLocalX * wCos - pushLocalZ * wSin),
    z: pz + (pushLocalX * wSin + pushLocalZ * wCos),
  };
}

export function resolveArenaCollisions(
  x: number,
  z: number,
  radius: number,
  obstacles: ObstacleBox[] = COURTYARD_OBSTACLES,
  arenaHalfSize: number = ARENA_HALF_SIZE,
): Vec2 {
  let rx = x;
  let rz = z;

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < obstacles.length; i++) {
      const next = resolveCircleVsObstacle(rx, rz, radius, obstacles[i]);
      rx = next.x;
      rz = next.z;
    }
    const maxBound = arenaHalfSize - radius;
    if (rx < -maxBound) rx = -maxBound;
    if (rx > maxBound) rx = maxBound;
    if (rz < -maxBound) rz = -maxBound;
    if (rz > maxBound) rz = maxBound;
  }

  return { x: rx, z: rz };
}

/**
 * Ray intersection against an oriented 2D box (OBB) in XZ plane.
 * Returns hit distance along unit direction (dirX, dirZ) within [0, maxDist], or null.
 */
export function raycastObstacleDistance(
  ox: number,
  oz: number,
  dirX: number,
  dirZ: number,
  maxDist: number,
  obs: ObstacleBox,
): number | null {
  const relX = ox - obs.x;
  const relZ = oz - obs.z;
  const cos = Math.cos(-obs.rotationY);
  const sin = Math.sin(-obs.rotationY);

  const lox = relX * cos - relZ * sin;
  const loz = relX * sin + relZ * cos;
  const ldx = dirX * cos - dirZ * sin;
  const ldz = dirX * sin + dirZ * cos;

  let tMin = 0;
  let tMax = maxDist;

  if (Math.abs(ldx) < 1e-7) {
    if (lox < -obs.halfW || lox > obs.halfW) return null;
  } else {
    let t1 = (-obs.halfW - lox) / ldx;
    let t2 = (obs.halfW - lox) / ldx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }

  if (Math.abs(ldz) < 1e-7) {
    if (loz < -obs.halfD || loz > obs.halfD) return null;
  } else {
    let t1 = (-obs.halfD - loz) / ldz;
    let t2 = (obs.halfD - loz) / ldz;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }

  return tMin >= 0 && tMin <= maxDist ? tMin : null;
}

/**
 * Ray intersection against arena boundary walls [-arenaHalfSize, arenaHalfSize].
 */
export function raycastArenaWalls(
  ox: number,
  oz: number,
  dirX: number,
  dirZ: number,
  maxDist: number,
  arenaHalfSize: number = ARENA_HALF_SIZE,
): number {
  let best = maxDist;
  if (Math.abs(dirX) > 1e-7) {
    const tx1 = (-arenaHalfSize - ox) / dirX;
    if (tx1 > 0 && tx1 < best) best = tx1;
    const tx2 = (arenaHalfSize - ox) / dirX;
    if (tx2 > 0 && tx2 < best) best = tx2;
  }
  if (Math.abs(dirZ) > 1e-7) {
    const tz1 = (-arenaHalfSize - oz) / dirZ;
    if (tz1 > 0 && tz1 < best) best = tz1;
    const tz2 = (arenaHalfSize - oz) / dirZ;
    if (tz2 > 0 && tz2 < best) best = tz2;
  }
  return best;
}

export function raycastObstaclesAndWalls(
  ox: number,
  oz: number,
  dirX: number,
  dirZ: number,
  maxDist: number,
  obstacles: ObstacleBox[] = COURTYARD_OBSTACLES,
  arenaHalfSize: number = ARENA_HALF_SIZE,
): number {
  let closest = raycastArenaWalls(ox, oz, dirX, dirZ, maxDist, arenaHalfSize);
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (!obs.blocksBullets) continue;
    const d = raycastObstacleDistance(ox, oz, dirX, dirZ, closest, obs);
    if (d !== null && d < closest) {
      closest = d;
    }
  }
  return closest;
}

/**
 * Ray vs circle in XZ plane. Returns distance to hit or null.
 */
export function raycastCircleDistance(
  ox: number,
  oz: number,
  dirX: number,
  dirZ: number,
  maxDist: number,
  cx: number,
  cz: number,
  radius: number,
): number | null {
  const fx = ox - cx;
  const fz = oz - cz;
  const b = 2 * (fx * dirX + fz * dirZ);
  const c = fx * fx + fz * fz - radius * radius;
  if (c <= 0) return 0;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const sqrtD = Math.sqrt(disc);
  const t = (-b - sqrtD) / 2;
  if (t >= 0 && t <= maxDist) return t;
  return null;
}
