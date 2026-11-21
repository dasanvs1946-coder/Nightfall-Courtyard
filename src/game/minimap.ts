import { ARENA_HALF_SIZE, COURTYARD_OBSTACLES } from './collision';
import { ObstacleBox } from './types';

export interface MinimapPoint {
  x: number;
  y: number;
}

export interface MinimapObstacleShape {
  id: string;
  kind: ObstacleBox['kind'];
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: number;
}

export function worldToMinimap(
  wx: number,
  wz: number,
  mapSize = 100,
  arenaHalfSize: number = ARENA_HALF_SIZE,
): MinimapPoint {
  const padding = mapSize * 0.06;
  const usable = mapSize - padding * 2;
  const nx = (wx + arenaHalfSize) / (arenaHalfSize * 2);
  const nz = (wz + arenaHalfSize) / (arenaHalfSize * 2);
  const clampedX = Math.max(0, Math.min(1, nx));
  const clampedZ = Math.max(0, Math.min(1, nz));
  return {
    x: padding + clampedX * usable,
    y: padding + clampedZ * usable,
  };
}

export function getMinimapObstacles(
  mapSize = 100,
  obstacles: ObstacleBox[] = COURTYARD_OBSTACLES,
  arenaHalfSize: number = ARENA_HALF_SIZE,
): MinimapObstacleShape[] {
  const usable = mapSize * 0.88;
  const scale = usable / (arenaHalfSize * 2);
  return obstacles.map((obs) => {
    const center = worldToMinimap(obs.x, obs.z, mapSize, arenaHalfSize);
    return {
      id: obs.id,
      kind: obs.kind,
      cx: center.x,
      cy: center.y,
      width: Math.max(2, obs.halfW * 2 * scale),
      height: Math.max(2, obs.halfD * 2 * scale),
      rotationDeg: (-obs.rotationY * 180) / Math.PI,
    };
  });
}
