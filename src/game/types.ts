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
  | 'railgun'
  | 'twin9'
  | 'cryo_carbine'
  | 'pulse_katana'
  | 'vulcan_minigun'
  | 'gauss_carbine'
  | 'micro_launcher'
  | 'chem_thrower';

export type ZombieKind =
  | 'walker'
  | 'runner'
  | 'brute'
  | 'spitter'
  | 'stalker'
  | 'breacher'
  | 'bomber'
  | 'howler'
  | 'juggernaut'
  | 'siege_breaker'
  | 'necromancer'
  | 'matriarch'
  | 'crawler'
  | 'ravager'
  | 'boss';

export type TacticalGearId = 'mine' | 'turret' | 'flashbang';

export type GadgetId = 'tripmine' | 'decoy' | 'wire' | 'mortar';

export type ArenaId =
  | 'courtyard'
  | 'parking_deck'
  | 'helipad'
  | 'subway'
  | 'biolab'
  | 'rooftop';

export type EliteAffixId =
  | 'emp_jammer'
  | 'cryo_proof'
  | 'phase_blinker'
  | 'vampiric'
  | 'berserker';

export type MidWaveEventId = 'orbital_supply' | 'blood_moon' | 'emp_outage';

export type TacticalPadKind = 'auto_turret' | 'overcharge_light';

export type GameModeId =
  | 'normal'
  | 'storm'
  | 'blackout'
  | 'boss_rush'
  | 'daily'
  | 'extraction'
  | 'siege'
  | 'weekly'
  | 'sandbox';

export type WeeklyMutatorId =
  | 'one_hit_chaos'
  | 'explosives_only'
  | 'hyper_speed_2x'
  | 'zero_reload'
  | 'all_elite_nightmare';

export type DailyMutatorId =
  | 'acid_rain'
  | 'hyper_dash'
  | 'volatile_horde'
  | 'blackout_surge';

export type PerkId =
  | 'cryo_rounds'
  | 'storm_conductor'
  | 'uv_overdrive'
  | 'vampiric_rounds'
  | 'twin_turrets'
  | 'incendiary'
  | 'piercing_core'
  | 'shockwave_coil'
  | 'extended_drums'
  | 'critical_optics'
  | 'dash_shockwave';

export type CursedPerkId =
  | 'cursed_glass_cannon'
  | 'cursed_bloodthirst'
  | 'cursed_overclocked_legs';

export type EvolutionId =
  | 'dragons_breath'
  | 'rail_smg'
  | 'tesla_coil'
  | 'phantom_enforcers'
  | 'absolute_zero'
  | 'void_cleaver'
  | 'hellfire_gatling'
  | 'singularity_railgun'
  | 'swarm_barrage'
  | 'napalm_bioblaster';

export type DroneId =
  | 'none'
  | 'laser_scout'
  | 'cryo_drone'
  | 'medic_drone'
  | 'scrap_magnet';

export type SynergyId =
  | 'frost_mortar'
  | 'electric_fence'
  | 'nuke_decoy'
  | 'twin_tripmine';

export type DamageNumberKind =
  | 'normal'
  | 'crit'
  | 'cryo'
  | 'shield'
  | 'weakpoint'
  | 'execute';

export type CrateKind = 'health' | 'ammo' | 'rapidfire';

export type UpgradeId =
  | 'damage'
  | 'handling'
  | 'vitality'
  | 'mobility'
  | 'capacity';

export type UpgradeLevels = Record<UpgradeId, number>;

export type WeaponMasteryLevels = Record<WeaponId, number>;

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type FpsCap = 30 | 60 | 120;

export interface TouchButtonOffset {
  x: number; // -80..80 px
  y: number; // -80..80 px
}

export interface TouchHudSettings {
  joystickScale: number; // 0.75..1.35
  buttonOpacity: number; // 0.4..1.0
  dashOffset: TouchButtonOffset;
  ultimateOffset: TouchButtonOffset;
  gadgetOffset: TouchButtonOffset;
  reloadOffset: TouchButtonOffset;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  fpsCap: FpsCap;
  hapticsEnabled: boolean;
  autoFire: boolean;
  showFps: boolean;
  masterVolume: number; // 0..1
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  touchHud: TouchHudSettings;
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

export type TechLabUpgradeId =
  | 'reinforced_plating'
  | 'kinetic_thrusters'
  | 'precision_optics'
  | 'tactical_rig'
  | 'salvage_protocol';

export type TechLabLevels = Record<TechLabUpgradeId, number>;

export type WeaponCamoId =
  | 'none'
  | 'carbon_fiber'
  | 'tactical_gold'
  | 'reactive_neon';

export type DailyContractEventType =
  | 'juggernaut_shatter'
  | 'reach_combo'
  | 'emp_elite_kill'
  | 'boss_kill'
  | 'extraction_complete'
  | 'gadget_deploy'
  | 'rifle_smg_kill'
  | 'blackout_siege_wave';

export interface DailyContractSpec {
  id: string;
  title: string;
  description: string;
  eventType: DailyContractEventType;
  target: number;
  scrapReward: number;
  accentHex: string;
  valueScale?: number;
  valueSuffix?: string;
}

export interface DailyContractsState {
  dateKey: string;
  progress: Record<string, number>;
  claimedIds: string[];
}

export type KillsByEnemyType = Record<ZombieKind, number>;

export type KillsByWeapon = Record<WeaponId, number>;

export type EquippedWeaponCamos = Partial<Record<WeaponId, WeaponCamoId>>;

export interface CareerStats {
  totalKills: number;
  bestWave: number;
  bestScore: number;
  bossesKilled: number;
  totalExtractions: number;
  scrap: number;
  killsByEnemyType: KillsByEnemyType;
  killsByWeapon: KillsByWeapon;
  equippedCamos: EquippedWeaponCamos;
  unlockedSkins: SkinId[];
  equippedSkinId: SkinId;
  selectedClass: SurvivorClassId;
  permanentUpgrades: PermanentUpgrades;
  techLab: TechLabLevels;
  dailyContracts: DailyContractsState;
  unlockedWeapons: WeaponId[];
  unlockedDrones: DroneId[];
  equippedDrone: DroneId;
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
  armoryOnly?: boolean;
  scrapUnlockCost?: number;
  meleeArc?: boolean;
  spinUpMax?: number;
  homingMissiles?: number;
  chillDuration?: number;
  ricochetCount?: number;
  createsAcidFire?: boolean;
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
  weaponMastery?: WeaponMasteryLevels;
  activeWeapon: WeaponId;
  equippedGear?: TacticalGearId;
  equippedGadget?: GadgetId;
  equippedDrone?: DroneId;
  weapons?: WeaponRuntimeState[];
  hasUsedRevive?: boolean;
  mode?: GameModeId | 'survival';
  arena?: ArenaId;
  ownedPerks?: PerkId[];
  ownedCursedPerks?: CursedPerkId[];
  evolvedWeapons?: EvolutionId[];
  ultimateCharge?: number;
  dailyDateKey?: string;
  perkDraftPending?: boolean;
  perkDraftSeedCursor?: number;
  weaponDraftPending?: boolean;
  activeInterrupted?: boolean;
  inRunScrap?: number;
}

export interface ObstacleBox {
  id: string;
  kind: 'car' | 'crate' | 'lamp' | 'planter' | 'pillar' | 'pod' | 'pillar_tech';
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  height: number;
  rotationY: number; // radians
  blocksBullets: boolean;
  colorVariant?: number;
  destructible?: boolean;
  maxHp?: number;
}

export interface FloatingDamage {
  id: number;
  x: number; // screen px
  y: number; // screen px
  amount: number;
  isCrit: boolean;
  isWeakpoint?: boolean;
  blockedByArmor?: boolean;
  kind?: DamageNumberKind;
  label?: string;
  age: number;
  duration: number;
}

export interface BossHudState {
  name: string;
  hp: number;
  maxHp: number;
  wave: number;
  phase2?: boolean;
  phase: 1 | 2 | 3;
  shielded: boolean;
  pylonsRemaining: number;
}

export interface ActiveEventHudState {
  id: MidWaveEventId;
  title: string;
  subtitle: string;
  progress?: number; // 0..1
  remainingSec?: number;
  accentHex: string;
}

export interface PadPromptHudState {
  kind: TacticalPadKind;
  label: string;
  cost: number;
  progress: number; // 0..1
  affordable: boolean;
  activeRemaining: number;
}

export type WeatherKind = 'clear' | 'mist' | 'rain' | 'storm';

export interface MinimapEnemy {
  x: number;
  z: number;
  kind: ZombieKind;
  revealed?: boolean;
  isElite?: boolean;
}

export interface MinimapPickup {
  x: number;
  z: number;
  kind: CrateKind | 'supply';
}

export interface MinimapHazard {
  x: number;
  z: number;
  kind:
    | 'acid'
    | 'mine'
    | 'turret'
    | 'barrel'
    | 'cryo_canister'
    | 'generator_on'
    | 'generator_off'
    | 'decoy'
    | 'wire'
    | 'tripmine'
    | 'pylon'
    | 'train_lane'
    | 'toxic_vent'
    | 'breaker_switch'
    | 'pad_turret'
    | 'pad_overcharge'
    | 'orbital_pod'
    | 'reactor_core'
    | 'extraction_zone';
}

export interface MinimapSnapshot {
  playerX: number;
  playerZ: number;
  playerAimAngle: number;
  enemies: MinimapEnemy[];
  pickups: MinimapPickup[];
  hazards?: MinimapHazard[];
}

export interface GeneratorHudStatus {
  id: string;
  x: number;
  z: number;
  powered: boolean;
  progress: number; // 0..1
  playerInside: boolean;
}

export interface NextRivalInfo {
  rank: number;
  callsign: string;
  clanTag: string;
  targetScore: number;
  scoreToOvertake: number;
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
  equippedGadget: GadgetId;
  gadgetCooldownProgress: number; // 1 = ready, 0..1 recharging
  gadgetCooldownRemaining: number; // seconds
  equippedDrone: DroneId;
  ultimateCharge: number; // 0..100
  ultimateActiveRemaining: number; // seconds
  ultimateName: string;
  comboCount: number;
  comboMultiplier: number;
  comboTimerRatio: number; // 0..1
  comboCallout: string | null;
  rapidFireRemaining: number; // seconds
  minigunRemaining: number; // seconds
  muted: boolean;
  waveBanner: string | null;
  pickupToast: string | null;
  skinUnlockToast: string | null;
  evolutionBanner: string | null;
  kills: number;
  damageTaken: number;
  isNewHighScore: boolean;
  upgradePoints: number;
  killsTowardNextUp: number;
  killsPerUp: number;
  upgradeLevels: UpgradeLevels;
  weaponMastery: WeaponMasteryLevels;
  ownedPerks: PerkId[];
  ownedCursedPerks: CursedPerkId[];
  perkDraftChoices: PerkId[] | null;
  cursedDraftChoice: CursedPerkId | null;
  weaponDraftChoices: WeaponId[] | null;
  evolvedWeapons: EvolutionId[];
  activeSynergies: SynergyId[];
  arena: ArenaId;
  mode: GameModeId;
  dailyDateKey: string | null;
  dailyMutatorLabel: string | null;
  generators: GeneratorHudStatus[];
  barrelsReady: number;
  inRunScrap: number;
  activeEvent: ActiveEventHudState | null;
  activePadPrompt: PadPromptHudState | null;
  overchargeRemaining: number;
  hazardWarningBanner: string | null;
  bossPhase2Active: boolean;
  bossesKilledInRun: number;
  callsign: string;
  clanTag: string;
  nextRival: NextRivalInfo | null;
  rivalOvertakenBanner: string | null;
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
  weeklyMutatorId: WeeklyMutatorId | null;
  weeklyMutatorName: string | null;
  reactorCore: { hp: number; maxHp: number } | null;
  extractionState: {
    wave: number;
    holdProgress: number;
    holdSecRequired: number;
    multiplier: number;
    active: boolean;
    wavedOff: boolean;
  } | null;
  extractedVictory: boolean;
  customGameOverTitle: string | null;
  gadgetCharges: number;
  gadgetMaxCharges: number;
  perkRerollsRemaining: number;
  sandboxMode: boolean;
  minimap: MinimapSnapshot;
}
