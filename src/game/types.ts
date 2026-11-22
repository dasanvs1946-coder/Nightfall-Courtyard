export type GamePhase = 'title' | 'playing' | 'paused' | 'revive' | 'gameover';

export type WeaponId =
  | 'pistol'
  | 'smg'
  | 'shotgun'
  | 'rifle'
  | 'revolver'
  | 'autoshotgun'
  | 'dmr'
  | 'lmg'
  | 'dual'
  | 'sniper'
  | 'flamethrower'
  | 'railgun';

export type ZombieKind =
  | 'walker'
  | 'runner'
  | 'brute'
  | 'spitter'
  | 'stalker'
  | 'breacher'
  | 'boss';

export type TacticalGearId = 'mine' | 'turret' | 'flashbang';

export type CrateKind = 'health' | 'ammo' | 'rapidfire';

export type UpgradeId =
  | 'damage'
  | 'handling'
  | 'vitality'
  | 'mobility'
  | 'capacity';

export type UpgradeLevels = Record<UpgradeId, number>;

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  hapticsEnabled: boolean;
  autoFire: boolean;
  showFps: boolean;
}

export type SkinId =
  | 'nightwatch'
  | 'crimson_recon'
  | 'hazmat_breacher'
  | 'cyber_ronin'
  | 'storm_phantom'
  | 'golden_sovereign';

export type SurvivorClassId =
  | 'vanguard'
  | 'engineer'
  | 'recon'
  | 'demolitionist';

export type PermanentUpgradeId =
  | 'baseHp'
  | 'reloadSpeed'
  | 'startingUp'
  | 'dashCooldown';

export type PermanentUpgrades = Record<PermanentUpgradeId, number>;

export type KillsByEnemyType = Record<ZombieKind, number>;

export interface CareerStats {
  totalKills: number;
  bestWave: number;
  bestScore: number;
  bossesKilled: number;
  scrap: number;
  killsByEnemyType: KillsByEnemyType;
  unlockedSkins: SkinId[];
  equippedSkinId: SkinId;
  selectedClass: SurvivorClassId;
  permanentUpgrades: PermanentUpgrades;
}

export interface RemoteAppConfig {
  latestVersion: string;
  downloadUrl: string;
  changelog: string;
}

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  shortCode: string;
  role: string;
  magSize: number;
  infiniteReserve: boolean;
  startReserve: number;
  maxReserve: number;
  ammoCrateAmount: number;
  fireInterval: number; // seconds between shots
  reloadDuration: number; // seconds
  damage: number;
  pellets: number;
  spreadRad: number; // half-angle cone in radians
  range: number;
  knockback: number;
  pierceCount?: number;
  unlockWave: number;
  tracerColor: number;
  screenShake: number;
}

export interface WeaponRuntimeState {
  id: WeaponId;
  unlocked: boolean;
  mag: number;
  reserve: number; // ignored when infiniteReserve is true
}

export interface SavedRunProgress {
  lastWave: number;
  score: number;
  kills: number;
  upgradePoints: number;
  upgradeLevels: UpgradeLevels;
  activeWeapon: WeaponId;
  equippedGear?: TacticalGearId;
  weapons?: WeaponRuntimeState[];
  hasUsedRevive?: boolean;
  mode?: 'survival';
  activeInterrupted?: boolean;
}

export interface ObstacleBox {
  id: string;
  kind: 'car' | 'crate' | 'lamp' | 'planter';
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  height: number;
  rotationY: number; // radians
  blocksBullets: boolean;
  colorVariant?: number;
}

export interface FloatingDamage {
  id: number;
  x: number; // screen px
  y: number; // screen px
  amount: number;
  isCrit: boolean;
  isWeakpoint?: boolean;
  blockedByArmor?: boolean;
  age: number;
  duration: number;
}

export interface BossHudState {
  name: string;
  hp: number;
  maxHp: number;
  wave: number;
}

export type WeatherKind = 'clear' | 'mist' | 'rain' | 'storm';

export interface MinimapEnemy {
  x: number;
  z: number;
  kind: ZombieKind;
  revealed?: boolean;
}

export interface MinimapPickup {
  x: number;
  z: number;
  kind: CrateKind;
}

export interface MinimapHazard {
  x: number;
  z: number;
  kind: 'acid' | 'mine' | 'turret';
}

export interface MinimapSnapshot {
  playerX: number;
  playerZ: number;
  playerAimAngle: number;
  enemies: MinimapEnemy[];
  pickups: MinimapPickup[];
  hazards?: MinimapHazard[];
}

export interface HudSnapshot {
  phase: GamePhase;
  hp: number;
  maxHp: number;
  ghostHp: number;
  score: number;
  highScore: number;
  wave: number;
  zombiesRemaining: number;
  activeWeapon: WeaponId;
  weapons: WeaponRuntimeState[];
  isReloading: boolean;
  reloadProgress: number; // 0..1
  dashCooldownProgress: number; // 1 = ready, 0..1 recharging
  equippedGear: TacticalGearId;
  gearCooldownProgress: number; // 1 = ready, 0..1 recharging
  gearCooldownRemaining: number; // seconds
  rapidFireRemaining: number; // seconds
  muted: boolean;
  waveBanner: string | null;
  pickupToast: string | null;
  skinUnlockToast: string | null;
  kills: number;
  damageTaken: number;
  isNewHighScore: boolean;
  upgradePoints: number;
  killsTowardNextUp: number;
  killsPerUp: number;
  upgradeLevels: UpgradeLevels;
  activeBoss: BossHudState | null;
  weather: WeatherKind;
  bloodSplatter: number; // 0..1 screen blood splatter intensity
  bloodSeed: number;
  hasUsedRevive: boolean;
  fps: number;
  showFps: boolean;
  autoFire: boolean;
  equippedSkinId: SkinId;
  selectedClass: SurvivorClassId;
  lastScrapEarned: number;
  minimap: MinimapSnapshot;
}
