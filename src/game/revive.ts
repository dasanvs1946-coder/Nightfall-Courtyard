export const REVIVE_HP_RATIO = 0.75;
export const REVIVE_INVULN_SEC = 3.0;
export const REVIVE_SHOCKWAVE_RADIUS = 8.5;
export const REVIVE_SHOCKWAVE_KNOCKBACK = 14.0;
export const REVIVE_ACID_CLEAR_RADIUS = 9.0;

export function getReviveRestoreHp(maxHp: number): number {
  const safeMax = Math.max(1, Math.round(maxHp));
  return Math.max(1, Math.round(safeMax * REVIVE_HP_RATIO));
}

export function shouldFlashInvulnMesh(invulnTimer: number): boolean {
  if (invulnTimer <= 0.5) return true;
  return Math.floor(invulnTimer * 14) % 2 === 0;
}

export interface ShockwavePushResult {
  inRange: boolean;
  dirX: number;
  dirZ: number;
  pushForce: number;
}

export function computeReviveShockwavePush(
  playerX: number,
  playerZ: number,
  targetX: number,
  targetZ: number,
  targetRadius = 0,
  blastRadius = REVIVE_SHOCKWAVE_RADIUS,
  maxPush = REVIVE_SHOCKWAVE_KNOCKBACK,
): ShockwavePushResult {
  const dx = targetX - playerX;
  const dz = targetZ - playerZ;
  const dist = Math.hypot(dx, dz);
  if (dist > blastRadius + targetRadius) {
    return { inRange: false, dirX: 0, dirZ: 0, pushForce: 0 };
  }
  const invDist = dist > 1e-4 ? 1 / dist : 0;
  const dirX = invDist > 0 ? dx * invDist : 0;
  const dirZ = invDist > 0 ? dz * invDist : -1;
  const falloff = 0.55 + 0.45 * (1 - Math.min(1, dist / Math.max(0.01, blastRadius)));
  return {
    inRange: true,
    dirX,
    dirZ,
    pushForce: maxPush * falloff,
  };
}

export function isAcidPoolClearedByRevive(
  playerX: number,
  playerZ: number,
  poolX: number,
  poolZ: number,
  poolRadius = 0,
  clearRadius = REVIVE_ACID_CLEAR_RADIUS,
): boolean {
  return Math.hypot(poolX - playerX, poolZ - playerZ) <= clearRadius + poolRadius;
}
