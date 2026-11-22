export type SemVerTuple = [number, number, number];

export function parseSemVer(version: string): SemVerTuple {
  if (typeof version !== 'string') return [0, 0, 0];
  const cleaned = version
    .trim()
    .replace(/^[vV]+/, '')
    .split(/[-+]/)[0];
  if (!cleaned) return [0, 0, 0];
  const parts = cleaned.split('.');
  const parsePart = (idx: number): number => {
    const raw = parts[idx];
    if (!raw || !/^\d+$/.test(raw)) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  return [parsePart(0), parsePart(1), parsePart(2)];
}

export function compareSemVer(a: string, b: string): number {
  const va = parseSemVer(a);
  const vb = parseSemVer(b);
  for (let i = 0; i < 3; i++) {
    if (va[i] > vb[i]) return 1;
    if (va[i] < vb[i]) return -1;
  }
  return 0;
}

export function isRemoteVersionNewer(
  remoteVersion: string,
  localVersion: string,
): boolean {
  const remote = parseSemVer(remoteVersion);
  if (remote[0] === 0 && remote[1] === 0 && remote[2] === 0) {
    return false;
  }
  return compareSemVer(remoteVersion, localVersion) > 0;
}
