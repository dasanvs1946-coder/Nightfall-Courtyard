import { WeaponId, WeaponRuntimeState, WeaponSpec } from './types';

export const WEAPON_ORDER: WeaponId[] = [
  'pistol',
  'smg',
  'shotgun',
  'rifle',
  'revolver',
  'autoshotgun',
  'dmr',
  'lmg',
  'dual',
  'sniper',
  'flamethrower',
  'railgun',
];

export const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
  pistol: {
    id: 'pistol',
    name: 'M9 Tactical',
    shortCode: 'M9',
    role: 'Sidearm · Infinite Reserve',
    magSize: 12,
    infiniteReserve: true,
    startReserve: 999,
    maxReserve: 999,
    ammoCrateAmount: 0,
    fireInterval: 0.24,
    reloadDuration: 1.05,
    damage: 34,
    pellets: 1,
    spreadRad: 0.025,
    range: 26,
    knockback: 3.4,
    unlockWave: 1,
    tracerColor: 0xffd166,
    screenShake: 0.14,
  },
  smg: {
    id: 'smg',
    name: 'MP5K Submachine',
    shortCode: 'MP5',
    role: 'SMG · High-Rate Burst',
    magSize: 32,
    infiniteReserve: false,
    startReserve: 160,
    maxReserve: 320,
    ammoCrateAmount: 80,
    fireInterval: 0.072,
    reloadDuration: 1.25,
    damage: 17,
    pellets: 1,
    spreadRad: 0.085,
    range: 22,
    knockback: 1.5,
    unlockWave: 2,
    tracerColor: 0xfde047,
    screenShake: 0.08,
  },
  shotgun: {
    id: 'shotgun',
    name: 'M870 Breacher',
    shortCode: 'M870',
    role: 'Shotgun · 6-Pellet Spread',
    magSize: 6,
    infiniteReserve: false,
    startReserve: 24,
    maxReserve: 48,
    ammoCrateAmount: 12,
    fireInterval: 0.66,
    reloadDuration: 1.6,
    damage: 26,
    pellets: 6,
    spreadRad: 0.21,
    range: 15,
    knockback: 6.8,
    unlockWave: 3,
    tracerColor: 0xfb923c,
    screenShake: 0.34,
  },
  rifle: {
    id: 'rifle',
    name: 'MK18 Carbine',
    shortCode: 'MK18',
    role: 'Assault Rifle · Rapid Auto',
    magSize: 30,
    infiniteReserve: false,
    startReserve: 120,
    maxReserve: 240,
    ammoCrateAmount: 60,
    fireInterval: 0.095,
    reloadDuration: 1.45,
    damage: 25,
    pellets: 1,
    spreadRad: 0.052,
    range: 28,
    knockback: 2.3,
    unlockWave: 4,
    tracerColor: 0x38bdf8,
    screenShake: 0.11,
  },
  revolver: {
    id: 'revolver',
    name: 'Python .357',
    shortCode: '.357',
    role: 'Magnum · Heavy Stopping Power',
    magSize: 6,
    infiniteReserve: false,
    startReserve: 36,
    maxReserve: 72,
    ammoCrateAmount: 18,
    fireInterval: 0.38,
    reloadDuration: 1.4,
    damage: 86,
    pellets: 1,
    spreadRad: 0.015,
    range: 29,
    knockback: 7.4,
    unlockWave: 6,
    tracerColor: 0xfef08a,
    screenShake: 0.28,
  },
  autoshotgun: {
    id: 'autoshotgun',
    name: 'AA-12 Striker',
    shortCode: 'AA12',
    role: 'Auto Shotgun · Rapid 5-Pellet',
    magSize: 12,
    infiniteReserve: false,
    startReserve: 48,
    maxReserve: 96,
    ammoCrateAmount: 24,
    fireInterval: 0.26,
    reloadDuration: 1.75,
    damage: 22,
    pellets: 5,
    spreadRad: 0.24,
    range: 14,
    knockback: 5.5,
    unlockWave: 8,
    tracerColor: 0xf97316,
    screenShake: 0.28,
  },
  dmr: {
    id: 'dmr',
    name: 'MK14 Marksman',
    shortCode: 'DMR',
    role: 'Precision DMR · Piercing',
    magSize: 16,
    infiniteReserve: false,
    startReserve: 64,
    maxReserve: 128,
    ammoCrateAmount: 32,
    fireInterval: 0.24,
    reloadDuration: 1.55,
    damage: 78,
    pellets: 1,
    spreadRad: 0.01,
    range: 35,
    knockback: 4.8,
    pierceCount: 2,
    unlockWave: 10,
    tracerColor: 0x60a5fa,
    screenShake: 0.22,
  },
  lmg: {
    id: 'lmg',
    name: 'M249 Saw',
    shortCode: 'SAW',
    role: 'Heavy LMG · 90-Round Belt',
    magSize: 90,
    infiniteReserve: false,
    startReserve: 180,
    maxReserve: 360,
    ammoCrateAmount: 90,
    fireInterval: 0.078,
    reloadDuration: 2.35,
    damage: 28,
    pellets: 1,
    spreadRad: 0.07,
    range: 30,
    knockback: 2.8,
    unlockWave: 12,
    tracerColor: 0xfbbf24,
    screenShake: 0.13,
  },
  dual: {
    id: 'dual',
    name: 'Twin Glocks',
    shortCode: 'DUAL',
    role: 'Akimbo · Twin-Barrel Spray',
    magSize: 28,
    infiniteReserve: false,
    startReserve: 140,
    maxReserve: 280,
    ammoCrateAmount: 56,
    fireInterval: 0.11,
    reloadDuration: 1.5,
    damage: 29,
    pellets: 2,
    spreadRad: 0.065,
    range: 24,
    knockback: 2.6,
    unlockWave: 14,
    tracerColor: 0xfde68a,
    screenShake: 0.15,
  },
  sniper: {
    id: 'sniper',
    name: 'Barrett M82',
    shortCode: 'M82',
    role: 'Anti-Materiel · 3x Pierce',
    magSize: 5,
    infiniteReserve: false,
    startReserve: 25,
    maxReserve: 50,
    ammoCrateAmount: 10,
    fireInterval: 0.78,
    reloadDuration: 2.0,
    damage: 215,
    pellets: 1,
    spreadRad: 0.005,
    range: 42,
    knockback: 10.5,
    pierceCount: 3,
    unlockWave: 16,
    tracerColor: 0xf87171,
    screenShake: 0.45,
  },
  flamethrower: {
    id: 'flamethrower',
    name: 'M2 Incinerator',
    shortCode: 'FLAM',
    role: 'Thermite Cone · Crowd Melt',
    magSize: 45,
    infiniteReserve: false,
    startReserve: 135,
    maxReserve: 270,
    ammoCrateAmount: 65,
    fireInterval: 0.08,
    reloadDuration: 1.9,
    damage: 14,
    pellets: 3,
    spreadRad: 0.25,
    range: 11.5,
    knockback: 1.4,
    unlockWave: 18,
    tracerColor: 0xff5722,
    screenShake: 0.09,
  },
  railgun: {
    id: 'railgun',
    name: 'XR-9 Railgun',
    shortCode: 'RAIL',
    role: 'Coil Cannon · 4x Hyper-Pierce',
    magSize: 8,
    infiniteReserve: false,
    startReserve: 32,
    maxReserve: 64,
    ammoCrateAmount: 16,
    fireInterval: 0.56,
    reloadDuration: 1.85,
    damage: 295,
    pellets: 1,
    spreadRad: 0.003,
    range: 44,
    knockback: 11.0,
    pierceCount: 4,
    unlockWave: 20,
    tracerColor: 0x22d3ee,
    screenShake: 0.42,
  },
};

export function createInitialWeapons(): WeaponRuntimeState[] {
  return WEAPON_ORDER.map((id) => {
    const spec = WEAPON_SPECS[id];
    return {
      id,
      unlocked: spec.unlockWave <= 1,
      mag: spec.magSize,
      reserve: spec.startReserve,
    };
  });
}

export function canFireWeapon(state: WeaponRuntimeState): boolean {
  return state.unlocked && state.mag > 0;
}

export function consumeAmmoOnFire(state: WeaponRuntimeState): boolean {
  if (!canFireWeapon(state)) return false;
  state.mag -= 1;
  return true;
}

export function canStartReload(
  state: WeaponRuntimeState,
  magSizeOverride?: number,
): boolean {
  const spec = WEAPON_SPECS[state.id];
  const targetMag = magSizeOverride ?? spec.magSize;
  if (!state.unlocked) return false;
  if (state.mag >= targetMag) return false;
  if (!spec.infiniteReserve && state.reserve <= 0) return false;
  return true;
}

export function completeReload(
  state: WeaponRuntimeState,
  magSizeOverride?: number,
): number {
  const spec = WEAPON_SPECS[state.id];
  const targetMag = magSizeOverride ?? spec.magSize;
  const needed = targetMag - state.mag;
  if (needed <= 0) return 0;

  if (spec.infiniteReserve) {
    state.mag = targetMag;
    return needed;
  }

  const loaded = Math.min(needed, state.reserve);
  state.mag += loaded;
  state.reserve -= loaded;
  return loaded;
}

export function unlockWeaponsForWave(
  weapons: WeaponRuntimeState[],
  wave: number,
  getMagSize?: (id: WeaponId) => number,
): WeaponId[] {
  const newlyUnlocked: WeaponId[] = [];
  for (const w of weapons) {
    const spec = WEAPON_SPECS[w.id];
    if (!w.unlocked && wave >= spec.unlockWave) {
      w.unlocked = true;
      w.mag = getMagSize ? getMagSize(w.id) : spec.magSize;
      w.reserve = spec.startReserve;
      newlyUnlocked.push(w.id);
    }
  }
  return newlyUnlocked;
}

export function grantAmmoCrate(
  weapons: WeaponRuntimeState[],
  getMagSize?: (id: WeaponId) => number,
): string[] {
  const granted: string[] = [];
  for (const w of weapons) {
    if (!w.unlocked) continue;
    const spec = WEAPON_SPECS[w.id];
    if (!spec.infiniteReserve && spec.ammoCrateAmount > 0) {
      const prev = w.reserve;
      w.reserve = Math.min(spec.maxReserve, w.reserve + spec.ammoCrateAmount);
      const diff = w.reserve - prev;
      if (diff > 0) {
        granted.push(`+${diff} ${spec.shortCode}`);
      }
    }
  }
  if (granted.length === 0) {
    for (const w of weapons) {
      if (!w.unlocked) continue;
      const spec = WEAPON_SPECS[w.id];
      const targetMag = getMagSize ? getMagSize(w.id) : spec.magSize;
      if (w.mag < targetMag) {
        w.mag = targetMag;
        granted.push(`${spec.shortCode} Full`);
      }
    }
  }
  return granted.slice(0, 3);
}

export function getNextUnlockedWeapon(
  weapons: WeaponRuntimeState[],
  current: WeaponId,
): WeaponId {
  const unlocked = weapons.filter((w) => w.unlocked).map((w) => w.id);
  if (unlocked.length <= 1) return current;
  const idx = unlocked.indexOf(current);
  return unlocked[(idx + 1) % unlocked.length];
}

export function getPrevUnlockedWeapon(
  weapons: WeaponRuntimeState[],
  current: WeaponId,
): WeaponId {
  const unlocked = weapons.filter((w) => w.unlocked).map((w) => w.id);
  if (unlocked.length <= 1) return current;
  const idx = unlocked.indexOf(current);
  return unlocked[(idx - 1 + unlocked.length) % unlocked.length];
}

export function getEffectiveFireInterval(
  id: WeaponId,
  rapidFireRemaining: number,
): number {
  const base = WEAPON_SPECS[id].fireInterval;
  return rapidFireRemaining > 0 ? base * 0.52 : base;
}
