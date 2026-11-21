import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canStartReload,
  completeReload,
  consumeAmmoOnFire,
  createInitialWeapons,
  getEffectiveFireInterval,
  getNextUnlockedWeapon,
  getPrevUnlockedWeapon,
  grantAmmoCrate,
  unlockWeaponsForWave,
  WEAPON_ORDER,
  WEAPON_SPECS,
} from './weapons';
import {
  ARENA_HALF_SIZE,
  COURTYARD_OBSTACLES,
  raycastCircleDistance,
  raycastObstaclesAndWalls,
  resolveArenaCollisions,
} from './collision';
import {
  buildWavePlan,
  getBossTitle,
  isBossWaveNumber,
  rollCrateDrop,
  ZOMBIE_SPECS,
} from './waves';
import {
  clearRunProgress,
  loadHighScore,
  loadRunProgress,
  saveHighScore,
  saveRunProgress,
  StorageLike,
} from './storage';
import {
  canPurchaseUpgrade,
  createInitialUpgradeLevels,
  getDamageMultiplier,
  getDamageTakenMultiplier,
  getDashCooldownMultiplier,
  getEffectiveMagSize,
  getFireRateMultiplier,
  getMaxHpForLevel,
  getMoveSpeedMultiplier,
  getReloadDurationMultiplier,
  getUpgradeCost,
  MAX_UPGRADE_LEVEL,
  purchaseUpgrade,
} from './upgrades';
import {
  getNextWeatherKind,
  getWeatherForWaveStart,
  parseWeatherParam,
  WEATHER_PRESETS,
} from './weather';
import { getMinimapObstacles, worldToMinimap } from './minimap';

test('weapon progression has 12 distinct weapons unlocking across waves 1 to 20 with next/prev cycling', () => {
  assert.equal(WEAPON_ORDER.length, 12);
  const weapons = createInitialWeapons();
  assert.equal(weapons.length, 12);

  const pistol = weapons.find((w) => w.id === 'pistol')!;
  const smg = weapons.find((w) => w.id === 'smg')!;
  const shotgun = weapons.find((w) => w.id === 'shotgun')!;
  const railgun = weapons.find((w) => w.id === 'railgun')!;

  assert.equal(pistol.unlocked, true);
  assert.equal(pistol.mag, 12);
  assert.equal(smg.unlocked, false);
  assert.equal(shotgun.unlocked, false);
  assert.equal(railgun.unlocked, false);

  // Fire pistol and reload infinitely
  assert.equal(consumeAmmoOnFire(pistol), true);
  assert.equal(pistol.mag, 11);
  assert.equal(canStartReload(pistol), true);
  assert.equal(completeReload(pistol), 1);
  assert.equal(pistol.mag, 12);

  // Extended mag size override supports capacity upgrades
  assert.equal(canStartReload(pistol, 15), true);
  assert.equal(completeReload(pistol, 15), 3);
  assert.equal(pistol.mag, 15);

  // Wave 2 unlocks SMG, Wave 3 unlocks Shotgun
  assert.deepEqual(unlockWeaponsForWave(weapons, 2), ['smg']);
  assert.equal(getNextUnlockedWeapon(weapons, 'pistol'), 'smg');
  assert.equal(getPrevUnlockedWeapon(weapons, 'pistol'), 'smg');

  assert.deepEqual(unlockWeaponsForWave(weapons, 3), ['shotgun']);
  assert.equal(getNextUnlockedWeapon(weapons, 'smg'), 'shotgun');
  assert.equal(getPrevUnlockedWeapon(weapons, 'pistol'), 'shotgun');

  // Wave 20 unlocks all 12 weapons including XR-9 Railgun
  unlockWeaponsForWave(weapons, 20);
  assert.equal(weapons.filter((w) => w.unlocked).length, 12);
  assert.equal(railgun.unlocked, true);
  assert.equal(WEAPON_SPECS.railgun.pierceCount, 4);
  assert.equal(getNextUnlockedWeapon(weapons, 'railgun'), 'pistol');
  assert.equal(getPrevUnlockedWeapon(weapons, 'pistol'), 'railgun');
});

test('finite reserve weapons consume reserve on reload and gain ammo from crates', () => {
  const weapons = createInitialWeapons();
  unlockWeaponsForWave(weapons, 4);
  const rifle = weapons.find((w) => w.id === 'rifle')!;

  rifle.mag = 10;
  rifle.reserve = 50;
  const loaded = completeReload(rifle);
  assert.equal(loaded, 20);
  assert.equal(rifle.mag, 30);
  assert.equal(rifle.reserve, 30);

  const granted = grantAmmoCrate(weapons);
  assert.ok(granted.length > 0);
  assert.equal(rifle.reserve, 30 + WEAPON_SPECS.rifle.ammoCrateAmount);
});

test('rapid fire reduces effective fire interval', () => {
  const normal = getEffectiveFireInterval('pistol', 0);
  const boosted = getEffectiveFireInterval('pistol', 5);
  assert.ok(boosted < normal);
});

test('spawn position (0,0) is completely clear of obstacles and collisions push out of cover', () => {
  const spawn = resolveArenaCollisions(0, 0, 0.5);
  assert.equal(spawn.x, 0);
  assert.equal(spawn.z, 0);

  const car = COURTYARD_OBSTACLES.find((o) => o.kind === 'car')!;
  const resolved = resolveArenaCollisions(car.x, car.z, 0.5);
  const dist = Math.hypot(resolved.x - car.x, resolved.z - car.z);
  assert.ok(dist >= Math.min(car.halfW, car.halfD));

  const wallResolved = resolveArenaCollisions(100, -100, 0.5);
  assert.ok(wallResolved.x <= ARENA_HALF_SIZE - 0.5 + 1e-6);
  assert.ok(wallResolved.z >= -ARENA_HALF_SIZE + 0.5 - 1e-6);
});

test('raycast stops at cover obstacles and detects zombie circle hits', () => {
  const crateN = COURTYARD_OBSTACLES.find((o) => o.id === 'crate-n')!;
  const hitDist = raycastObstaclesAndWalls(crateN.x, 0, 0, -1, 30);
  assert.ok(hitDist < 12, `Expected ray to stop at crate-n, got ${hitDist}`);

  const circleHit = raycastCircleDistance(0, 0, 0, -1, 20, 0, -5, 0.5);
  assert.ok(circleHit !== null && Math.abs(circleHit - 4.5) < 1e-5);
});

test('wave plans scale zombie count, +2.5% HP and +0.5% damage per round, moderate runner speed, and spawn bosses only on multiples of 5', () => {
  const w1 = buildWavePlan(1, () => 0.5);
  const w2 = buildWavePlan(2, () => 0.5);
  const w3 = buildWavePlan(3, () => 0.15);
  const w4 = buildWavePlan(4, () => 0.5);
  const w5 = buildWavePlan(5, () => 0.5);
  const w6 = buildWavePlan(6, () => 0.5);
  const w10 = buildWavePlan(10, () => 0.5);

  assert.ok(w3.queue.length > w1.queue.length);
  assert.ok(Math.abs(w1.hpMultiplier - 1) < 1e-9);
  assert.ok(Math.abs(w2.hpMultiplier - 1.025) < 1e-9);
  assert.ok(Math.abs(w3.hpMultiplier - Math.pow(1.025, 2)) < 1e-9);
  assert.ok(Math.abs(w1.damageMultiplier - 1) < 1e-9);
  assert.ok(Math.abs(w2.damageMultiplier - 1.005) < 1e-9);
  assert.ok(Math.abs(w3.damageMultiplier - Math.pow(1.005, 2)) < 1e-9);

  assert.ok(w3.speedMultiplier > w1.speedMultiplier);
  assert.ok(ZOMBIE_SPECS.runner.speed > ZOMBIE_SPECS.walker.speed);
  assert.ok(ZOMBIE_SPECS.runner.speed < 5.0);
  assert.ok(ZOMBIE_SPECS.brute.maxHp > ZOMBIE_SPECS.walker.maxHp);
  assert.ok(ZOMBIE_SPECS.boss.maxHp > ZOMBIE_SPECS.brute.maxHp);

  assert.equal(isBossWaveNumber(1), false);
  assert.equal(isBossWaveNumber(4), false);
  assert.equal(isBossWaveNumber(5), true);
  assert.equal(isBossWaveNumber(10), true);

  assert.equal(w4.isBossWave, false);
  assert.equal(w4.queue.includes('boss'), false);
  assert.equal(w5.isBossWave, true);
  assert.equal(w5.queue.filter((k) => k === 'boss').length, 1);
  assert.equal(w6.queue.includes('boss'), false);
  assert.equal(w10.isBossWave, true);
  assert.equal(w10.queue.filter((k) => k === 'boss').length, 1);
  assert.ok(getBossTitle(5).includes('W5'));

  const drop = rollCrateDrop('brute', 0.3, () => 0.1);
  assert.equal(drop, 'health');
});

test('upgrades scale smoothly up to Level 50 and respect max cap and tiered costs', () => {
  assert.equal(MAX_UPGRADE_LEVEL, 50);
  const levels = createInitialUpgradeLevels();
  let points = 12;

  assert.equal(getUpgradeCost(0), 1);
  assert.equal(getUpgradeCost(4), 1);
  assert.equal(getUpgradeCost(5), 2);
  assert.equal(getUpgradeCost(25), 6);
  assert.equal(getUpgradeCost(49), 10);

  for (let i = 0; i < 6; i++) {
    const res = purchaseUpgrade(levels, points, 'damage');
    assert.equal(res.purchased, true);
    points = res.nextPoints;
  }
  assert.equal(levels.damage, 6);
  assert.equal(points, 5); // 5 purchases @ 1 UP + 1 purchase @ 2 UP = 7 UP spent
  assert.ok(Math.abs(getDamageMultiplier(levels) - 1.48) < 1e-9);

  // Vitality, handling, mobility, and capacity scaling
  levels.vitality = 10;
  levels.handling = 10;
  levels.mobility = 10;
  levels.capacity = 5;
  assert.equal(getMaxHpForLevel(levels), 220);
  assert.ok(getDamageTakenMultiplier(levels) < 0.9);
  assert.ok(getFireRateMultiplier(levels) < 0.75);
  assert.ok(getReloadDurationMultiplier(levels) < 0.7);
  assert.ok(getMoveSpeedMultiplier(levels) > 1.15);
  assert.ok(getDashCooldownMultiplier(levels) < 0.9);
  assert.equal(getEffectiveMagSize('pistol', levels), Math.round(12 * 1.5));

  // Level 49 -> 50 succeeds, then 50+ caps
  levels.damage = 49;
  assert.equal(canPurchaseUpgrade(levels, 9, 'damage'), false);
  assert.equal(canPurchaseUpgrade(levels, 10, 'damage'), true);
  const maxRes = purchaseUpgrade(levels, 15, 'damage');
  assert.equal(maxRes.purchased, true);
  assert.equal(maxRes.newLevel, 50);
  assert.equal(canPurchaseUpgrade(levels, 999, 'damage'), false);
});

test('high score and run progress persist and support continue or reset from beginning', () => {
  const map = new Map<string, string>();
  const mockStorage: StorageLike = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };

  assert.equal(loadHighScore(mockStorage), 0);
  assert.equal(saveHighScore(1250, mockStorage), 1250);
  assert.equal(loadHighScore(mockStorage), 1250);
  assert.equal(saveHighScore(800, mockStorage), 1250);
  assert.equal(saveHighScore(2400, mockStorage), 2400);
  assert.equal(loadHighScore(mockStorage), 2400);

  assert.equal(loadRunProgress(mockStorage), null);
  saveRunProgress(
    {
      lastWave: 14,
      score: 6850,
      kills: 192,
      upgradePoints: 11,
      upgradeLevels: {
        damage: 18,
        handling: 12,
        vitality: 55, // Should clamp cleanly to 50
        mobility: 6,
        capacity: 9,
      },
      activeWeapon: 'dual',
    },
    mockStorage,
  );

  const loaded = loadRunProgress(mockStorage);
  assert.ok(loaded !== null);
  assert.equal(loaded.lastWave, 14);
  assert.equal(loaded.score, 6850);
  assert.equal(loaded.kills, 192);
  assert.equal(loaded.upgradePoints, 11);
  assert.equal(loaded.upgradeLevels.damage, 18);
  assert.equal(loaded.upgradeLevels.vitality, 50);
  assert.equal(loaded.activeWeapon, 'dual');

  clearRunProgress(mockStorage);
  assert.equal(loadRunProgress(mockStorage), null);
});

test('dynamic weather cycles across states, escalates to storm on boss waves, and parses query overrides', () => {
  assert.equal(getWeatherForWaveStart(1), 'clear');
  assert.equal(getWeatherForWaveStart(5), 'storm');
  assert.equal(getNextWeatherKind('clear', 1), 'mist');
  assert.equal(getNextWeatherKind('mist', 2), 'rain');
  assert.equal(getNextWeatherKind('rain', 3), 'storm');
  assert.equal(getNextWeatherKind('storm', 4), 'clear');
  assert.equal(getNextWeatherKind('clear', 5), 'storm');

  assert.equal(parseWeatherParam('STORM'), 'storm');
  assert.equal(parseWeatherParam('invalid'), null);
  assert.ok(WEATHER_PRESETS.storm.rainIntensity > WEATHER_PRESETS.rain.rainIntensity);
  assert.ok(WEATHER_PRESETS.storm.groundRoughness < WEATHER_PRESETS.clear.groundRoughness);
  assert.equal(WEATHER_PRESETS.storm.lightningEnabled, true);
});

test('minimap projects world coordinates, clamps out-of-bounds points, and includes courtyard obstacles', () => {
  const center = worldToMinimap(0, 0, 100);
  assert.equal(center.x, 50);
  assert.equal(center.y, 50);

  const nw = worldToMinimap(-ARENA_HALF_SIZE, -ARENA_HALF_SIZE, 100);
  const se = worldToMinimap(ARENA_HALF_SIZE, ARENA_HALF_SIZE, 100);
  assert.equal(nw.x, 6);
  assert.equal(nw.y, 6);
  assert.equal(se.x, 94);
  assert.equal(se.y, 94);

  const clamped = worldToMinimap(999, -999, 100);
  assert.equal(clamped.x, 94);
  assert.equal(clamped.y, 6);

  const shapes = getMinimapObstacles(100);
  assert.equal(shapes.length, COURTYARD_OBSTACLES.length);
  assert.ok(shapes.some((s) => s.kind === 'lamp'));
  assert.ok(shapes.some((s) => s.kind === 'car'));
});
