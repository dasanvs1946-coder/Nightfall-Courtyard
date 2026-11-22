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
  computeZombieHitDamage,
  getBossCycleHpMultiplier,
  getBossRangedCooldown,
  getBossTitle,
  isBossWaveNumber,
  isPointInFlashlightCone,
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
  BOSS_KILL_UP_BONUS,
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
  KILLS_PER_UPGRADE_POINT,
  MAX_UPGRADE_LEVEL,
  purchaseUpgrade,
  WAVE_CLEAR_UP_BOSS,
  WAVE_CLEAR_UP_REGULAR,
} from './upgrades';
import {
  getNextWeatherKind,
  getWeatherForWaveStart,
  parseWeatherParam,
  WEATHER_PRESETS,
} from './weather';
import { getMinimapObstacles, worldToMinimap } from './minimap';
import {
  getNextTacticalGear,
  TACTICAL_GEAR_ORDER,
  TACTICAL_GEAR_SPECS,
} from './tacticalGear';
import {
  computeReviveShockwavePush,
  getReviveRestoreHp,
  isAcidPoolClearedByRevive,
  REVIVE_INVULN_SEC,
  shouldFlashInvulnMesh,
} from './revive';
import { APP_VERSION } from './version';
import { compareSemVer, isRemoteVersionNewer, parseSemVer } from './semver';
import {
  DEFAULT_GAME_SETTINGS,
  getEffectivePixelRatio,
  getRainQualityScale,
  loadSettings,
  saveSettings,
  shouldEnableShadows,
} from './settings';
import {
  BESTIARY_ENTRIES,
  CLASS_ORDER,
  computeRunScrapReward,
  createDefaultCareerStats,
  evaluateSkinUnlocks,
  getBestiaryMasteryBonusPct,
  getBestiaryMasteryMultiplier,
  getPermanentBaseHpBonus,
  getPermanentDashCooldownMultiplier,
  getPermanentReloadMultiplier,
  getPermanentStartingUpBonus,
  getSkinProgress,
  isClassUnlocked,
  loadCareerStats,
  purchasePermanentUpgrade,
  saveCareerStats,
  SKIN_ORDER,
} from './career';
import {
  evaluateWeaponEvolutions,
  PERK_ORDER,
  rollPerkDraftChoices,
} from './perks';
import { GADGET_ORDER, GADGET_SPECS, getNextGadget } from './gadgets';
import { ARENA_ORDER, ARENA_SPECS, GAME_MODE_ORDER, GAME_MODE_SPECS } from './arenas';
import { createSeededRng, getDailyChallengeConfig } from './dailyChallenge';
import {
  isValidCallsign,
  sanitizeCallsign,
} from './storage';
import {
  createInitialWeaponMastery,
  getWeaponMasteryCost,
  getWeaponMasteryDamageMult,
  MAX_WEAPON_MASTERY_LEVEL,
  purchaseWeaponMastery,
} from './upgrades';

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

test('v1.1.0 waves introduce 6 regular archetypes and flatten post-Wave 14 scaling so Waves 15-50 stay fair', () => {
  const w1 = buildWavePlan(1, () => 0.5);
  const w2 = buildWavePlan(2, () => 0.5);
  const w3 = buildWavePlan(3, () => 0.15);
  const w4 = buildWavePlan(4, () => 0.5);
  const w5 = buildWavePlan(5, () => 0.5);
  const w6 = buildWavePlan(6, () => 0.5);
  const w7 = buildWavePlan(7, () => 0.5);
  const w10 = buildWavePlan(10, () => 0.5);
  const w14 = buildWavePlan(14, () => 0.5);
  const w25 = buildWavePlan(25, () => 0.5);
  const w50 = buildWavePlan(50, () => 0.5);

  // Early rounds keep +2.5% HP / +0.5% damage ramp, mid-game ramps gently, post-14 flattens cleanly
  assert.ok(Math.abs(w1.hpMultiplier - 1) < 1e-9);
  assert.ok(Math.abs(w2.hpMultiplier - 1.025) < 1e-9);
  assert.ok(Math.abs(w3.hpMultiplier - Math.pow(1.025, 2)) < 1e-9);
  assert.ok(Math.abs(w1.damageMultiplier - 1) < 1e-9);
  assert.ok(Math.abs(w2.damageMultiplier - 1.005) < 1e-9);
  assert.ok(w6.hpMultiplier > Math.pow(1.025, 5));
  assert.ok(w14.hpMultiplier < 2.0);
  assert.ok(w25.hpMultiplier > w14.hpMultiplier && w25.hpMultiplier < 3.0);
  assert.ok(w50.hpMultiplier > w25.hpMultiplier && w50.hpMultiplier < 5.2);
  assert.ok(w25.damageMultiplier < 1.45);
  assert.ok(w50.damageMultiplier < 1.75);
  assert.ok(w50.speedMultiplier <= 1.35);
  assert.ok(w25.queue.length >= 45);
  assert.ok(w50.spawnInterval >= 0.35 && w50.spawnInterval <= 0.45);

  // New regular enemy archetypes debut on Waves 4, 7, and 10
  assert.equal(w4.queue.includes('spitter'), true);
  assert.equal(w7.queue.includes('stalker'), true);
  assert.equal(w10.queue.includes('breacher'), true);

  assert.ok(ZOMBIE_SPECS.runner.speed > ZOMBIE_SPECS.walker.speed);
  assert.ok(ZOMBIE_SPECS.runner.speed < 5.0);
  assert.ok(ZOMBIE_SPECS.stalker.speed > ZOMBIE_SPECS.walker.speed);
  assert.ok(ZOMBIE_SPECS.breacher.maxHp > ZOMBIE_SPECS.brute.maxHp);
  assert.ok(ZOMBIE_SPECS.boss.maxHp >= 1500);

  // Boss cycle scaling & faster ranged barrage recovery
  assert.ok(getBossCycleHpMultiplier(10) > getBossCycleHpMultiplier(5));
  assert.ok(getBossRangedCooldown(25) < getBossRangedCooldown(5));

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

test('Riot Breacher front shield reduces frontal bullet damage by 65%, while flanking or bypass deals full damage', () => {
  // Breacher facing south (+Z: x=0, z=1)
  // Shot fired north (-Z: x=0, z=-1) hits front shield -> 35% of 100 = 35
  const frontal = computeZombieHitDamage(100, 'breacher', 0, -1, 0, 1, false);
  assert.equal(frontal.blockedByArmor, true);
  assert.equal(frontal.finalDamage, 35);

  // Shot from flank (+X: x=1, z=0) -> full 100 damage
  const flank = computeZombieHitDamage(100, 'breacher', 1, 0, 0, 1, false);
  assert.equal(flank.blockedByArmor, false);
  assert.equal(flank.finalDamage, 100);

  // Shot from behind (+Z: x=0, z=1) -> full 100 damage
  const rear = computeZombieHitDamage(100, 'breacher', 0, 1, 0, 1, false);
  assert.equal(rear.blockedByArmor, false);
  assert.equal(rear.finalDamage, 100);

  // Explosive / armor-bypass hit front -> full 100 damage
  const bypass = computeZombieHitDamage(100, 'breacher', 0, -1, 0, 1, true);
  assert.equal(bypass.blockedByArmor, false);
  assert.equal(bypass.finalDamage, 100);
});

test('Flashlight cone check accurately reveals Shadow Stalkers inside beam and hides those outside', () => {
  // Player at (0,0) aiming straight north (angle = 0 -> fwd = (0, -1))
  assert.equal(isPointInFlashlightCone(0, 0, 0, 0, -7), true);
  assert.equal(isPointInFlashlightCone(0, 0, 0, 1.5, -7), true);
  // Behind player -> false
  assert.equal(isPointInFlashlightCone(0, 0, 0, 0, 6), false);
  // Out of flashlight range -> false
  assert.equal(isPointInFlashlightCone(0, 0, 0, 0, -18), false);
});

test('tighter UP economy and steeper upgrade costs scale cleanly up to Level 50', () => {
  assert.equal(MAX_UPGRADE_LEVEL, 50);
  assert.equal(KILLS_PER_UPGRADE_POINT, 8);
  assert.equal(WAVE_CLEAR_UP_REGULAR, 1);
  assert.equal(WAVE_CLEAR_UP_BOSS, 2);
  assert.equal(BOSS_KILL_UP_BONUS, 2);

  const levels = createInitialUpgradeLevels();
  let points = 12;

  assert.equal(getUpgradeCost(0), 1);
  assert.equal(getUpgradeCost(2), 1);
  assert.equal(getUpgradeCost(3), 2);
  assert.equal(getUpgradeCost(12), 6);
  assert.equal(getUpgradeCost(25), 11);
  assert.equal(getUpgradeCost(49), 21);

  for (let i = 0; i < 6; i++) {
    const res = purchaseUpgrade(levels, points, 'damage');
    assert.equal(res.purchased, true);
    points = res.nextPoints;
  }
  assert.equal(levels.damage, 6);
  assert.equal(points, 3); // 3 * 1 UP + 3 * 2 UP = 9 UP spent
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

  // Level 49 -> 50 costs 21 UP, then 50+ caps
  levels.damage = 49;
  assert.equal(canPurchaseUpgrade(levels, 20, 'damage'), false);
  assert.equal(canPurchaseUpgrade(levels, 21, 'damage'), true);
  const maxRes = purchaseUpgrade(levels, 25, 'damage');
  assert.equal(maxRes.purchased, true);
  assert.equal(maxRes.newLevel, 50);
  assert.equal(canPurchaseUpgrade(levels, 999, 'damage'), false);
});

test('high score and run progress (including equipped tactical gear) persist cleanly', () => {
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

  const savedWeapons = createInitialWeapons();
  savedWeapons[1].unlocked = true;
  savedWeapons[1].mag = 22;
  savedWeapons[1].reserve = 95;

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
      equippedGear: 'turret',
      weapons: savedWeapons,
      hasUsedRevive: true,
      mode: 'survival',
      activeInterrupted: true,
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
  assert.equal(loaded.equippedGear, 'turret');
  assert.equal(loaded.hasUsedRevive, true);
  assert.equal(loaded.mode, 'survival');
  assert.equal(loaded.activeInterrupted, true);
  assert.equal(loaded.weapons?.[1].unlocked, true);
  assert.equal(loaded.weapons?.[1].mag, 22);
  assert.equal(loaded.weapons?.[1].reserve, 95);

  clearRunProgress(mockStorage);
  assert.equal(loadRunProgress(mockStorage), null);
});

test('free revive restores 75% HP, flashes 3s invulnerability, pushes zombies, and clears nearby acid pools', () => {
  assert.equal(REVIVE_INVULN_SEC, 3.0);
  assert.equal(getReviveRestoreHp(100), 75);
  assert.equal(getReviveRestoreHp(220), 165);

  // Brief grace stays visible; 3s revive shield toggles visibly
  assert.equal(shouldFlashInvulnMesh(0.4), true);
  const flashStates = new Set<boolean>();
  for (let t = 0.6; t <= 2.9; t += 0.05) {
    flashStates.add(shouldFlashInvulnMesh(t));
  }
  assert.equal(flashStates.has(true), true);
  assert.equal(flashStates.has(false), true);

  // Shockwave knocks back nearby zombies and leaves far zombies untouched
  const near = computeReviveShockwavePush(0, 0, 2.5, 0, 0.5);
  assert.equal(near.inRange, true);
  assert.ok(near.dirX > 0.99);
  assert.ok(near.pushForce > 9);

  const far = computeReviveShockwavePush(0, 0, 14, 0, 0.5);
  assert.equal(far.inRange, false);

  // Acid pools within blast radius are cleared
  assert.equal(isAcidPoolClearedByRevive(0, 0, 4, 4, 1.5), true);
  assert.equal(isAcidPoolClearedByRevive(0, 0, 15, 0, 1.5), false);
});

test('tactical gear specs and cycling cover mine, turret, and flashbang with long cooldowns', () => {
  assert.deepEqual(TACTICAL_GEAR_ORDER, ['mine', 'turret', 'flashbang']);
  assert.ok(TACTICAL_GEAR_SPECS.mine.cooldownSec >= 12);
  assert.ok(TACTICAL_GEAR_SPECS.turret.cooldownSec >= 15);
  assert.ok(TACTICAL_GEAR_SPECS.flashbang.cooldownSec >= 12);
  assert.equal(getNextTacticalGear('mine'), 'turret');
  assert.equal(getNextTacticalGear('turret'), 'flashbang');
  assert.equal(getNextTacticalGear('flashbang'), 'mine');
});

test('app version matches 2.0.0 release', () => {
  assert.equal(APP_VERSION, '2.0.0');
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

test('strict numeric SemVer comparison handles v prefixes and multi-digit segments accurately', () => {
  assert.deepEqual(parseSemVer('v1.2.0'), [1, 2, 0]);
  assert.deepEqual(parseSemVer('1.2.10'), [1, 2, 10]);
  assert.deepEqual(parseSemVer('invalid'), [0, 0, 0]);

  assert.equal(compareSemVer('v1.2.10', 'v1.2.2'), 1);
  assert.equal(compareSemVer('1.2.0', 'v1.2.0'), 0);
  assert.equal(compareSemVer('v1.1.9', 'v1.2.0'), -1);

  assert.equal(isRemoteVersionNewer('1.2.1', 'v1.2.0'), true);
  assert.equal(isRemoteVersionNewer('v2.0.0', 'v1.9.9'), true);
  assert.equal(isRemoteVersionNewer('v1.2.0', 'v1.2.0'), false);
  assert.equal(isRemoteVersionNewer('v1.1.5', 'v1.2.0'), false);
  assert.equal(isRemoteVersionNewer('0.0.0', 'v1.2.0'), false);
});

test('game settings persist and clamp mobile pixelRatio to 1.5 max', () => {
  const map = new Map<string, string>();
  const mockStorage: StorageLike = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };

  assert.deepEqual(loadSettings(mockStorage), DEFAULT_GAME_SETTINGS);
  saveSettings(
    {
      graphicsQuality: 'medium',
      hapticsEnabled: false,
      autoFire: true,
      showFps: true,
    },
    mockStorage,
  );
  const loaded = loadSettings(mockStorage);
  assert.equal(loaded.graphicsQuality, 'medium');
  assert.equal(loaded.hapticsEnabled, false);
  assert.equal(loaded.autoFire, true);
  assert.equal(loaded.showFps, true);

  // Mobile DPR 3.0 clamps strictly to <= 1.5
  assert.equal(getEffectivePixelRatio('high', 3.0, true, false), 1.5);
  assert.equal(getEffectivePixelRatio('medium', 3.0, true, false), 1.25);
  assert.equal(getEffectivePixelRatio('low', 3.0, false, false), 1);
  assert.equal(getEffectivePixelRatio('high', 3.0, false, true), 1);
  assert.equal(getEffectivePixelRatio('high', 2.0, false, false), 2);
  assert.equal(shouldEnableShadows('low', false), false);
  assert.equal(shouldEnableShadows('high', false), true);
  assert.equal(shouldEnableShadows('high', true), false);
  assert.equal(getRainQualityScale('low'), 0);
  assert.equal(getRainQualityScale('high'), 1);
});

test('career stats, 6 skin thresholds, 4 classes, permanent scrap upgrades, and bestiary mastery work end-to-end', () => {
  assert.equal(SKIN_ORDER.length, 6);
  assert.equal(CLASS_ORDER.length, 4);

  const map = new Map<string, string>();
  const mockStorage: StorageLike = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };

  const career = createDefaultCareerStats();
  assert.deepEqual(career.unlockedSkins, ['nightwatch']);
  assert.equal(isClassUnlocked('vanguard', career), true);
  assert.equal(isClassUnlocked('engineer', career), false);
  assert.equal(isClassUnlocked('recon', career), false);
  assert.equal(isClassUnlocked('demolitionist', career), false);

  // Cross wave 8 + 500 kills + 5 bosses + 25,000 score
  career.totalKills = 500;
  career.bestWave = 10;
  career.bestScore = 26000;
  career.bossesKilled = 5;
  const newlyUnlocked = evaluateSkinUnlocks(career);
  assert.deepEqual(newlyUnlocked, [
    'crimson_recon',
    'hazmat_breacher',
    'cyber_ronin',
    'storm_phantom',
  ]);
  assert.equal(isClassUnlocked('engineer', career), true);
  assert.equal(isClassUnlocked('recon', career), true);
  assert.equal(isClassUnlocked('demolitionist', career), true);

  // Golden Sovereign still locked until 1500 kills or 50000 score
  const goldProg = getSkinProgress('golden_sovereign', career);
  assert.equal(goldProg.unlocked, false);

  // Scrap reward & permanent upgrades
  career.scrap = computeRunScrapReward({
    wave: 10,
    kills: 150,
    bossesKilledInRun: 2,
  });
  assert.ok(career.scrap > 100);
  const buyHp = purchasePermanentUpgrade(career, 'baseHp');
  assert.equal(buyHp.purchased, true);
  assert.equal(getPermanentBaseHpBonus(buyHp.career.permanentUpgrades), 10);
  assert.ok(getPermanentReloadMultiplier({ ...buyHp.career.permanentUpgrades, reloadSpeed: 5 }) < 0.85);
  assert.equal(getPermanentStartingUpBonus({ ...buyHp.career.permanentUpgrades, startingUp: 3 }), 3);
  assert.ok(getPermanentDashCooldownMultiplier({ ...buyHp.career.permanentUpgrades, dashCooldown: 4 }) < 0.9);

  // Save and reload career
  buyHp.career.killsByEnemyType.walker = 210;
  saveCareerStats(buyHp.career, mockStorage);
  const reloaded = loadCareerStats(mockStorage);
  assert.equal(reloaded.totalKills, 500);
  assert.equal(reloaded.killsByEnemyType.walker, 210);
  assert.equal(getBestiaryMasteryBonusPct(210), 10);
  assert.ok(Math.abs(getBestiaryMasteryMultiplier('walker', reloaded.killsByEnemyType) - 1.1) < 1e-9);
  assert.equal(getBestiaryMasteryMultiplier('runner', reloaded.killsByEnemyType), 1);
});

test('perks, weapon mastery, and weapon evolutions unlock deterministically without duplicates', () => {
  assert.equal(PERK_ORDER.length, 11);
  const owned = ['cryo_rounds', 'vampiric_rounds'] as const;
  const draft = rollPerkDraftChoices([...owned], createSeededRng('perk-seed-1'));
  assert.equal(draft.length, 3);
  assert.equal(new Set(draft).size, 3);
  assert.equal(draft.includes('cryo_rounds'), false);

  const mastery = createInitialWeaponMastery();
  assert.equal(MAX_WEAPON_MASTERY_LEVEL, 5);
  assert.equal(getWeaponMasteryCost(0), 1);
  assert.equal(getWeaponMasteryCost(2), 2);
  assert.equal(getWeaponMasteryCost(4), 3);

  let up = 20;
  for (let i = 0; i < 5; i++) {
    const res = purchaseWeaponMastery(mastery, up, 'shotgun');
    assert.equal(res.purchased, true);
    up = res.nextPoints;
  }
  assert.equal(mastery.shotgun, 5);
  assert.equal(purchaseWeaponMastery(mastery, up, 'shotgun').purchased, false);
  assert.ok(Math.abs(getWeaponMasteryDamageMult(5) - 1.5) < 1e-9);

  mastery.smg = 5;
  const upgrades = createInitialUpgradeLevels();
  upgrades.handling = 5;

  const unlocked = evaluateWeaponEvolutions(
    mastery,
    upgrades,
    ['incendiary', 'piercing_core', 'shockwave_coil'],
    [],
  );
  assert.deepEqual(unlocked, ['dragons_breath', 'rail_smg', 'tesla_coil']);

  // Already evolved entries are not returned twice
  const repeat = evaluateWeaponEvolutions(
    mastery,
    upgrades,
    ['incendiary', 'piercing_core', 'shockwave_coil'],
    unlocked,
  );
  assert.deepEqual(repeat, []);
});

test('dedicated tactical gadgets, 3 arenas, 5 modes, 9-enemy bestiary, daily seed, and callsign validation work cleanly', () => {
  assert.deepEqual(GADGET_ORDER, ['tripmine', 'decoy', 'wire', 'mortar']);
  assert.equal(getNextGadget('tripmine'), 'decoy');
  assert.equal(getNextGadget('mortar'), 'tripmine');
  assert.ok(GADGET_SPECS.mortar.damage > 400);

  assert.deepEqual(ARENA_ORDER, ['courtyard', 'parking_deck', 'helipad']);
  for (const arenaId of ARENA_ORDER) {
    const spec = ARENA_SPECS[arenaId];
    assert.ok(spec.barrelCoords.length >= 4);
    assert.equal(spec.generatorCoords.length, 2);
    assert.equal(spec.supplyDropCoords.length, 4);
    const minimapObs = getMinimapObstacles(100, spec.obstacles, spec.halfSize);
    assert.equal(minimapObs.length, spec.obstacles.length);
  }
  assert.ok(ARENA_SPECS.helipad.spawnIntervalMultiplier < 1.0);

  assert.deepEqual(GAME_MODE_ORDER, [
    'normal',
    'storm',
    'blackout',
    'boss_rush',
    'daily',
  ]);
  assert.equal(GAME_MODE_SPECS.blackout.rewardMultiplier, 2);
  assert.equal(isBossWaveNumber(1, 'boss_rush'), true);
  assert.equal(isBossWaveNumber(1, 'normal'), false);

  const w3 = buildWavePlan(3, () => 0.5);
  const w6 = buildWavePlan(6, () => 0.5);
  assert.equal(w3.queue.includes('bomber'), true);
  assert.equal(w6.queue.includes('howler'), true);
  assert.equal(BESTIARY_ENTRIES.length, 9);

  // Daily challenge deterministic for same UTC key
  const d1 = getDailyChallengeConfig('2026-11-22');
  const d2 = getDailyChallengeConfig('2026-11-22');
  assert.deepEqual(d1, d2);

  // Callsign sanitization & validation
  assert.equal(sanitizeCallsign('ghost_99!@#'), 'ghost_99');
  assert.equal(isValidCallsign('GHOST_99'), true);
  assert.equal(isValidCallsign('AB'), false);

  // v2.0.0 run snapshot persistence
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
  saveRunProgress(
    {
      lastWave: 6,
      score: 4200,
      kills: 88,
      upgradePoints: 4,
      upgradeLevels: createInitialUpgradeLevels(),
      weaponMastery: { ...createInitialWeaponMastery(), shotgun: 5 },
      activeWeapon: 'shotgun',
      equippedGear: 'turret',
      equippedGadget: 'mortar',
      arena: 'parking_deck',
      mode: 'blackout',
      ownedPerks: ['incendiary', 'uv_overdrive'],
      evolvedWeapons: ['dragons_breath'],
      activeInterrupted: true,
    },
    mockStorage,
  );
  const restored = loadRunProgress(mockStorage)!;
  assert.equal(restored.arena, 'parking_deck');
  assert.equal(restored.mode, 'blackout');
  assert.equal(restored.equippedGadget, 'mortar');
  assert.equal(restored.weaponMastery?.shotgun, 5);
  assert.deepEqual(restored.ownedPerks, ['incendiary', 'uv_overdrive']);
  assert.deepEqual(restored.evolvedWeapons, ['dragons_breath']);
});



