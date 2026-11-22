import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SoundEngine } from '../audio/soundEngine';
import {
  ARENA_HALF_SIZE,
  COURTYARD_OBSTACLES,
  raycastCircleDistance,
  raycastObstaclesAndWalls,
  resolveArenaCollisions,
} from '../game/collision';
import {
  clearRunProgress,
  loadCallsign,
  loadHighScore,
  loadRunProgress,
  saveCallsign,
  saveHighScore,
  saveRunProgress,
} from '../game/storage';
import {
  computeReviveShockwavePush,
  getReviveRestoreHp,
  isAcidPoolClearedByRevive,
  REVIVE_INVULN_SEC,
  REVIVE_SHOCKWAVE_RADIUS,
  shouldFlashInvulnMesh,
} from '../game/revive';
import {
  ArenaId,
  CareerStats,
  CrateKind,
  DailyMutatorId,
  EvolutionId,
  FloatingDamage,
  GadgetId,
  GameModeId,
  GamePhase,
  GameSettings,
  GeneratorHudStatus,
  HudSnapshot,
  MinimapHazard,
  MinimapPickup,
  PerkId,
  PermanentUpgradeId,
  SavedRunProgress,
  SkinId,
  SurvivorClassId,
  TacticalGearId,
  UpgradeId,
  UpgradeLevels,
  WeaponId,
  WeaponMasteryLevels,
  WeaponRuntimeState,
  WeatherKind,
  ZombieKind,
} from '../game/types';
import { ARENA_SPECS, GAME_MODE_SPECS } from '../game/arenas';
import {
  createSeededRng,
  DAILY_MUTATOR_SPECS,
  getDailyChallengeConfig,
} from '../game/dailyChallenge';
import { GADGET_SPECS, getNextGadget } from '../game/gadgets';
import {
  evaluateWeaponEvolutions,
  EVOLUTION_SPECS,
  PERK_SPECS,
  rollPerkDraftChoices,
} from '../game/perks';
import {
  TACTICAL_GEAR_SPECS,
  getNextTacticalGear,
} from '../game/tacticalGear';
import {
  BOSS_KILL_UP_BONUS,
  createInitialUpgradeLevels,
  createInitialWeaponMastery,
  getDamageMultiplier,
  getDamageTakenMultiplier,
  getDashCooldownMultiplier,
  getEffectiveMagSize,
  getFireRateMultiplier,
  getMaxHpForLevel,
  getMoveSpeedMultiplier,
  getReloadDurationMultiplier,
  getWeaponMasteryDamageMult,
  KILLS_PER_UPGRADE_POINT,
  purchaseUpgrade,
  purchaseWeaponMastery,
  UPGRADE_SPECS,
  WAVE_CLEAR_UP_BOSS,
  WAVE_CLEAR_UP_REGULAR,
} from '../game/upgrades';
import {
  buildWavePlan,
  computeZombieHitDamage,
  getBossCycleHpMultiplier,
  getBossRangedCooldown,
  getBossTitle,
  isBossWaveNumber,
  isPointInFlashlightCone,
  rollCrateDrop,
  WavePlan,
  ZOMBIE_SPECS,
} from '../game/waves';
import {
  canFireWeapon,
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
} from '../game/weapons';
import {
  applyBossPhase2Glow,
  applyPlayerSkin,
  buildBarbedWireMesh,
  buildCarMesh,
  buildConcretePillar,
  buildCornerBrazier,
  buildCrateCluster,
  buildDecoyFlare,
  buildDeployableTurretRig,
  buildDumpster,
  buildExplosiveBarrel,
  buildFloodlightGenerator,
  buildJerseyBarrier,
  buildLaserTripmine,
  buildMortarTargetRing,
  buildPickupCrate,
  buildPlayerRig,
  buildProximityMineMesh,
  buildRiskSupplyCrate,
  buildStreetLamp,
  buildZombieRig,
  DeployableTurretRig,
  disposeSharedModelGeometries,
  ExplosiveBarrelRig,
  FloodlightGeneratorRig,
  PlayerRig,
  ProximityMineRig,
  StreetLampRig,
  updateDiegeticFootArcs,
  ZombieRig,
} from './models';
import {
  CLASS_SPECS,
  computeRunScrapReward,
  evaluateSkinUnlocks,
  getBestiaryMasteryMultiplier,
  getPermanentBaseHpBonus,
  getPermanentDashCooldownMultiplier,
  getPermanentReloadMultiplier,
  getPermanentStartingUpBonus,
  loadCareerStats,
  purchasePermanentUpgrade,
  saveCareerStats,
  SKIN_SPECS,
} from '../game/career';
import {
  getEffectivePixelRatio,
  getRainQualityScale,
  isMobileDeviceViewport,
  loadSettings,
  saveSettings,
  shouldEnableShadows,
} from '../game/settings';

import {
  hapticPlayerDamage,
  hapticReviveShockwave,
  hapticShotgunBlast,
  hapticTurretDeploy,
  setHapticsEnabled,
} from '../services/haptics';
import {
  getNextWeatherKind,
  getWeatherForWaveStart,
  WEATHER_PRESETS,
} from '../game/weather';
import {
  createAsphaltTextures,
  createBloodSplatTexture,
  createBrickWallTexture,
  createContactShadowTexture,
  createCrateTexture,
  createDirectionalSplatterTexture,
  createHazardChevronTexture,
  createLightPoolTexture,
  createPlazaEmblemTexture,
  createSidewalkTexture,
} from './textures';

interface ActiveZombie {
  id: number;
  kind: ZombieKind;
  rig: ZombieRig;
  x: number;
  z: number;
  vx: number;
  vz: number;
  knockVx: number;
  knockVz: number;
  facingYaw: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  attackRange: number;
  attackWindup: number;
  attackCooldown: number;
  knockbackResist: number;
  scoreValue: number;
  weaveSeed: number;
  flankSide: number;
  hitFlashTimer: number;
  windupTimer: number;
  isWindingUp: boolean;
  cooldownTimer: number;
  rangedCooldown: number;
  stunTimer: number;
  revealTimer: number;
  wasRevealed: boolean;
  lungeTimer: number;
  chargeCooldown: number;
  chargeTimer: number;
  chargePending: boolean;
  chargeDirX: number;
  chargeDirZ: number;
  acidTargetX: number;
  acidTargetZ: number;
  dying: boolean;
  deathTimer: number;
  walkPhase: number;
  lastStepIndex: number;
  howlerBuffTimer: number;
  howlerCooldown: number;
  cryoTimer: number;
  burnTimer: number;
  burnDps: number;
  phase2Triggered: boolean;
  bossSlamCooldown: number;
}

interface ActiveBarrel {
  id: string;
  rig: ExplosiveBarrelRig;
  x: number;
  z: number;
  active: boolean;
  respawnTimer: number;
}

interface ActiveGenerator {
  id: string;
  rig: FloodlightGeneratorRig;
  x: number;
  z: number;
  powered: boolean;
  hp: number;
  maxHp: number;
  chargeProgress: number;
  activeRemaining: number;
  playerInside: boolean;
}

interface ActiveSupplyCrate {
  id: number;
  mesh: THREE.Group;
  x: number;
  z: number;
  age: number;
  life: number;
}

interface ActiveTripmine {
  root: THREE.Group;
  x: number;
  z: number;
  armTimer: number;
  life: number;
}

interface ActiveDecoy {
  root: THREE.Group;
  x: number;
  z: number;
  life: number;
  maxLife: number;
}

interface ActiveWire {
  root: THREE.Group;
  x: number;
  z: number;
  life: number;
  tickTimer: number;
}

interface ActiveMortar {
  group: THREE.Group;
  fillMat: THREE.MeshBasicMaterial;
  x: number;
  z: number;
  age: number;
  duration: number;
}

interface BossProjectile {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  life: number;
}

interface AcidProjectile {
  mesh: THREE.Mesh;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  elapsed: number;
  duration: number;
  damage: number;
}

interface AcidPuddle {
  active: boolean;
  x: number;
  z: number;
  age: number;
  duration: number;
  tickTimer: number;
  damage: number;
}

interface ActiveMine {
  rig: ProximityMineRig;
  x: number;
  z: number;
  armTimer: number;
  life: number;
}

interface ActiveTurret {
  rig: DeployableTurretRig;
  x: number;
  z: number;
  life: number;
  fireTimer: number;
  flashTimer: number;
}

interface FlashRing {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  duration: number;
  maxRadius: number;
}

interface ActivePickup {
  id: number;
  kind: CrateKind;
  mesh: THREE.Group;
  x: number;
  z: number;
  age: number;
  life: number;
}

interface TracerSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  angle: number;
  length: number;
  r: number;
  g: number;
  b: number;
  life: number;
  maxLife: number;
}

interface CasingSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  life: number;
  maxLife: number;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  splatsOnLand: boolean;
}

interface BloodDecalSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  currentScaleX: number;
  currentScaleY: number;
  targetScaleX: number;
  targetScaleY: number;
  age: number;
  opacity: number;
}

interface RainDropSlot {
  x: number;
  y: number;
  z: number;
  speed: number;
  len: number;
}

interface FloatingDamageInternal {
  id: number;
  wx: number;
  wy: number;
  wz: number;
  amount: number;
  isCrit: boolean;
  isWeakpoint?: boolean;
  blockedByArmor?: boolean;
  age: number;
  duration: number;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onFloatingDamageUpdate: (items: FloatingDamage[]) => void;
  onSavedProgressUpdate?: (saved: SavedRunProgress | null) => void;
  onCareerUpdate?: (career: CareerStats) => void;
  onSettingsUpdate?: (settings: GameSettings) => void;
}

const MAX_TRACERS = 48;
const MAX_CASINGS = 72;
const MAX_PARTICLES = 180;
const MAX_DECALS = 56;
const MAX_RAIN_DROPS = 180;
const MAX_ACID_POOLS = 16;
const MAX_ACID_IMPACT_RINGS = 12;
const ZOMBIE_LIGHT_POOL_SIZE = 5;
const PLAYER_RADIUS = 0.48;
const PLAYER_SPEED = 6.8;
const DASH_DURATION = 0.17;
const DASH_SPEED = 20.5;
const DASH_COOLDOWN = 2.4;

// Pre-allocated scratch math helpers (Zero GC in loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.94);
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private sound = new SoundEngine();

  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private disposables: Array<{ dispose: () => void }> = [];

  private shadowTex!: THREE.CanvasTexture;
  private bloodSplatTex!: THREE.CanvasTexture;
  private bloodStreakTex!: THREE.CanvasTexture;
  private playerRig!: PlayerRig;
  private laserBeam!: THREE.Mesh;
  private laserDot!: THREE.Mesh;
  private moonLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private groundMat!: THREE.MeshStandardMaterial;

  private tracerMesh!: THREE.InstancedMesh;
  private tracers: TracerSlot[] = [];
  private tracerCursor = 0;
  private casingMesh!: THREE.InstancedMesh;
  private casings: CasingSlot[] = [];
  private casingCursor = 0;
  private particleMesh!: THREE.InstancedMesh;
  private particles: ParticleSlot[] = [];
  private particleCursor = 0;
  private decals: BloodDecalSlot[] = [];
  private decalCursor = 0;
  private ambientDust!: THREE.Points;
  private dustMat!: THREE.PointsMaterial;
  private rainMesh!: THREE.InstancedMesh;
  private rainDrops: RainDropSlot[] = [];
  private acidPoolDiscMesh!: THREE.InstancedMesh;
  private acidPoolRimMesh!: THREE.InstancedMesh;
  private acidImpactRingMesh!: THREE.InstancedMesh;
  private cornerEmbers: Array<{
    mesh: THREE.Mesh;
    light: THREE.PointLight | null;
    phase: number;
  }> = [];
  private streetLamps: Array<{
    rig: StreetLampRig;
    phase: number;
    glitchCooldown: number;
    glitchTimer: number;
  }> = [];
  private zombieLights: THREE.PointLight[] = [];
  private zombieLightCandidates: Array<{ z: ActiveZombie; score: number }> = [];

  private frameId = 0;
  private disposed = false;
  private lastTimestamp = 0;
  private resizeObserver: ResizeObserver;
  private viewportW = 1;
  private viewportH = 1;

  // Settings, Career & FPS
  private settings: GameSettings = loadSettings();
  private career: CareerStats = loadCareerStats();
  private skinPreviewActive = false;
  private skinPreviewId: SkinId | null = null;
  private skinPreviewRotation = 0;
  private skinUnlockToast: string | null = null;
  private skinUnlockToastTimer = 0;
  private bossesKilledInRun = 0;
  private lastScrapEarned = 0;
  private fpsFrameCount = 0;
  private fpsElapsed = 0;
  private currentFps = 60;

  // Game State
  private phase: GamePhase = 'title';
  private playerX = 0;
  private playerZ = 0;
  private playerAimAngle = 0; // 0 = -Z (north)
  private playerWalkPhase = 0;
  private cachedMuzzleX = 0;
  private cachedMuzzleZ = -1;
  private hp = 100;
  private maxHp = 100;
  private ghostHp = 100;
  private score = 0;
  private highScore = loadHighScore();
  private isNewHighScore = false;
  private kills = 0;
  private damageTaken = 0;

  private weapons: WeaponRuntimeState[] = createInitialWeapons();
  private activeWeapon: WeaponId = 'pistol';
  private fireCooldown = 0;
  private isReloading = false;
  private reloadTimer = 0;
  private rapidFireRemaining = 0;
  private muzzleFlashTimer = 0;
  private recoilOffset = 0;

  private dashTimer = 0;
  private dashCooldownTimer = 0;
  private dashDirX = 0;
  private dashDirZ = -1;
  private invulnTimer = 0;
  private hasUsedRevive = false;
  private arenaGroup = new THREE.Group();
  private arena: ArenaId = loadRunProgress()?.arena ?? 'courtyard';
  private mode: GameModeId = (() => {
    const savedMode = loadRunProgress()?.mode;
    return savedMode && savedMode !== 'survival' ? savedMode : 'normal';
  })();
  private dailyDateKey: string | null = null;
  private dailyMutator: DailyMutatorId | undefined = undefined;
  private dailyMutatorLabel: string | null = null;
  private seededRng: (() => number) | null = null;
  private perkDraftSeedCursor = 0;
  private callsign = loadCallsign();

  private arenaResources!: {
    sidewalkTex: THREE.CanvasTexture;
    crateTex: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
    brickTex: { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
    lightPoolTex: THREE.CanvasTexture;
    plazaEmblemTex: THREE.CanvasTexture;
    hazardTex: THREE.CanvasTexture;
  };

  // Tactical Gear & Dedicated Gadget State
  private equippedGear: TacticalGearId = loadRunProgress()?.equippedGear ?? 'mine';
  private gearCooldownTimer = 0;
  private activeMines: ActiveMine[] = [];
  private activeTurrets: ActiveTurret[] = [];
  private equippedGadget: GadgetId = loadRunProgress()?.equippedGadget ?? 'tripmine';
  private gadgetCooldownTimer = 0;
  private activeTripmines: ActiveTripmine[] = [];
  private activeDecoys: ActiveDecoy[] = [];
  private activeWires: ActiveWire[] = [];
  private activeMortars: ActiveMortar[] = [];
  private flashRings: FlashRing[] = [];
  private flashRingGeo = new THREE.RingGeometry(0.82, 1.0, 32);

  // Interactive Arena Mechanics
  private barrels: ActiveBarrel[] = [];
  private generators: ActiveGenerator[] = [];
  private supplyCrate: ActiveSupplyCrate | null = null;
  private supplyDropTimer = 18;
  private minigunRemaining = 0;

  // Perks, Evolutions & Weapon Mastery
  private weaponMastery: WeaponMasteryLevels = createInitialWeaponMastery();
  private ownedPerks: PerkId[] = [];
  private perkDraftChoices: PerkId[] | null = null;
  private evolvedWeapons: EvolutionId[] = [];
  private evolutionBanner: string | null = null;
  private evolutionBannerTimer = 0;
  private vampiricKillCounter = 0;

  // Wave & Entities
  private wave = 1;
  private wavePlan: WavePlan = buildWavePlan(1);
  private spawnTimer = 0.8;
  private wavePauseTimer = 0;
  private waveBanner: string | null = null;
  private waveBannerTimer = 0;
  private pickupToast: string | null = null;
  private pickupToastTimer = 0;

  private nextEntityId = 1;
  private zombies: ActiveZombie[] = [];
  private pickups: ActivePickup[] = [];
  private bossProjectiles: BossProjectile[] = [];
  private bossProjGeo = new THREE.SphereGeometry(0.24, 10, 8);
  private bossProjMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  private acidProjectiles: AcidProjectile[] = [];
  private acidProjGeo = new THREE.SphereGeometry(0.22, 8, 6);
  private acidProjMat = new THREE.MeshBasicMaterial({ color: 0xa3e635 });
  private acidPuddles: AcidPuddle[] = [];
  private floatingDamages: FloatingDamageInternal[] = [];

  // Dynamic Weather & Blood Splatter State
  private weatherOverride: WeatherKind | null = null;
  private weatherKind: WeatherKind = 'clear';
  private weatherTimer = 22;
  private weatherRainStrength = 0;
  private weatherFogDensity = 0.0145;
  private weatherWindX = 0.35;
  private weatherWindZ = 0.2;
  private lightningTimer = 6.5;
  private lightningFlash = 0;
  private fogColorCurrent = new THREE.Color(0x070a10);
  private fogColorTarget = new THREE.Color(0x070a10);
  private lightningColor = new THREE.Color(0x60a5fa);
  private bloodSplatter = 0;
  private bloodSeed = 1;

  // Upgrades & Simulation Pause
  private upgradePoints = 1;
  private killsTowardNextUp = 0;
  private upgradeLevels: UpgradeLevels = createInitialUpgradeLevels();
  private uiSimulationPaused = false;
  private initialWave = 1;

  // Camera & Juice
  private camPos = new THREE.Vector3(0, 20, 12);
  private camLook = new THREE.Vector3(0, 0, 0);
  private camRecoilX = 0;
  private camRecoilZ = 0;
  private trauma = 0;
  private hitstopTimer = 0;
  private titleOrbitAngle = 0.4;
  private hudEmitTimer = 0;
  private lastEmittedPhase: GamePhase | null = null;

  // Input State
  private keys = new Set<string>();
  private mouseDown = false;
  private hasMouseAim = false;
  private mouseClientX = 0;
  private mouseClientY = 0;
  private moveStickX = 0;
  private moveStickY = 0;
  private aimStickX = 0;
  private aimStickY = 0;
  private aimStickActive = false;

  constructor(
    container: HTMLElement,
    callbacks: EngineCallbacks,
    autostart: boolean,
    startWave = 1,
    startWeather: WeatherKind | null = null,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.weatherOverride = startWeather;
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    this.container.appendChild(canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070a10);
    this.scene.fog = new THREE.FogExp2(0x070a10, 0.0165);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.5, 160);

    // Procedural Studio Environment Map (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    pmrem.dispose();

    this.buildArenaScene();
    this.buildPools();

    this.updateSize();
    this.applyGraphicsSettings();
    applyPlayerSkin(this.playerRig, this.career.equippedSkinId);
    this.applyClassFlashlightVisuals();
    setHapticsEnabled(this.settings.hapticsEnabled);
    this.resizeObserver = new ResizeObserver(() => this.updateSize());
    this.resizeObserver.observe(this.container);

    this.attachEvents(canvas);

    this.initialWave = Math.max(1, Math.min(50, Math.floor(startWave)));
    if (this.weatherOverride) {
      this.applyWeatherImmediate(this.weatherOverride);
    }
    this.disposables.push(
      this.bossProjGeo,
      this.bossProjMat,
      this.acidProjGeo,
      this.acidProjMat,
      this.flashRingGeo,
    );

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    if (autostart) {
      this.startNewGame({ fromBeginning: true });
    } else {
      this.setPhase('title');
      this.updateTitleCamera(0);
      this.renderer.render(this.scene, this.camera);
      this.emitHudSnapshot(true);
    }

    this.lastTimestamp = performance.now();
    this.scheduleNextFrame();
  }

  private buildArenaScene(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const asphalt = createAsphaltTextures(maxAniso);
    const sidewalkTex = createSidewalkTexture(maxAniso);
    const crateTex = createCrateTexture(maxAniso);
    const brickTex = createBrickWallTexture(maxAniso);
    this.shadowTex = createContactShadowTexture();
    this.bloodSplatTex = createBloodSplatTexture();
    this.bloodStreakTex = createDirectionalSplatterTexture();
    const lightPoolTex = createLightPoolTexture();
    const plazaEmblemTex = createPlazaEmblemTexture(maxAniso);
    const hazardTex = createHazardChevronTexture(maxAniso);
    this.arenaResources = {
      sidewalkTex,
      crateTex,
      brickTex,
      lightPoolTex,
      plazaEmblemTex,
      hazardTex,
    };
    this.disposables.push(
      ...[
        asphalt.map,
        asphalt.roughnessMap,
        asphalt.bumpMap,
        sidewalkTex,
        crateTex.map,
        crateTex.bumpMap,
        brickTex.map,
        brickTex.bumpMap,
        this.shadowTex,
        this.bloodSplatTex,
        this.bloodStreakTex,
        lightPoolTex,
        plazaEmblemTex,
        hazardTex,
      ].filter((item): item is NonNullable<typeof item> => Boolean(item)),
    );

    // 1. Lighting Rig: Cool moonlight key + silhouette rim light + Hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x5275b5, 0x181310, 1.02);
    this.scene.add(this.hemiLight);

    this.moonLight = new THREE.DirectionalLight(0xa5c8ff, 1.42);
    this.moonLight.position.set(16, 28, 12);
    this.moonLight.castShadow = !this.isSoftwareGl;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 2;
    this.moonLight.shadow.camera.far = 75;
    this.moonLight.shadow.camera.left = -25;
    this.moonLight.shadow.camera.right = 25;
    this.moonLight.shadow.camera.top = 25;
    this.moonLight.shadow.camera.bottom = -25;
    this.moonLight.shadow.bias = -0.0005;
    this.moonLight.shadow.normalBias = 0.02;
    this.scene.add(this.moonLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.58);
    rimLight.position.set(-18, 16, -20);
    this.scene.add(rimLight);

    // 2. Ground Asphalt Plane (140m x 140m extends past playable area)
    const groundGeo = new THREE.PlaneGeometry(140, 140);
    this.groundMat = new THREE.MeshStandardMaterial({
      map: asphalt.map,
      roughnessMap: asphalt.roughnessMap,
      bumpMap: asphalt.bumpMap,
      bumpScale: 0.035,
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0.08,
    });
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.scene.add(this.arenaGroup);
    this.rebuildArena();

    // 5. Player Rig + Red Laser Sight
    this.playerRig = buildPlayerRig(this.shadowTex, !this.isSoftwareGl);
    this.scene.add(this.playerRig.root);

    // Laser beam geometry pivoted at z = -0.5 scaled by length along -Z
    const laserGeo = new THREE.BoxGeometry(0.032, 0.032, 1);
    laserGeo.translate(0, 0, -0.5);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xff2b2b,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    this.laserBeam = new THREE.Mesh(laserGeo, laserMat);
    this.laserBeam.position.set(0, 0.94, 0);
    this.scene.add(this.laserBeam);

    this.laserDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4d4d }),
    );
    this.scene.add(this.laserDot);
  }

  private getObstacles() {
    return ARENA_SPECS[this.arena].obstacles;
  }

  private getHalfSize(): number {
    return ARENA_SPECS[this.arena].halfSize;
  }

  private rebuildArena(): void {
    const {
      sidewalkTex,
      crateTex,
      brickTex,
      lightPoolTex,
      plazaEmblemTex,
      hazardTex,
    } = this.arenaResources;

    // Cleanly dispose previous arenaGroup geometry/materials
    this.arenaGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        if (m.geometry && !m.geometry.userData?.shared) {
          m.geometry.dispose();
        }
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });
    while (this.arenaGroup.children.length > 0) {
      this.arenaGroup.remove(this.arenaGroup.children[0]);
    }
    this.streetLamps = [];
    this.cornerEmbers = [];
    this.barrels = [];
    this.generators = [];

    const arenaSpec = ARENA_SPECS[this.arena];
    const halfSize = arenaSpec.halfSize;

    // Concrete Perimeter Sidewalk & Curb Walkways
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      color: this.arena === 'parking_deck' ? 0xcbd5e1 : 0xffffff,
      roughness: 0.88,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const swWidth = 2.4;
    const swSpan = halfSize * 2;
    const swOffset = halfSize - swWidth / 2;
    const swSegments: [number, number, number, number][] = [
      [0, -swOffset, swSpan, swWidth],
      [0, swOffset, swSpan, swWidth],
      [-swOffset, 0, swWidth, swSpan - swWidth * 2],
      [swOffset, 0, swWidth, swSpan - swWidth * 2],
    ];
    for (const [sx, sz, sw, sd] of swSegments) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.08, sd), sidewalkMat);
      walk.position.set(sx, 0.04, sz);
      walk.receiveShadow = true;
      this.arenaGroup.add(walk);
    }

    // Arena-specific floor markings
    if (this.arena === 'courtyard') {
      const plazaEmblem = new THREE.Mesh(
        new THREE.PlaneGeometry(9.6, 9.6),
        new THREE.MeshBasicMaterial({
          map: plazaEmblemTex,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      );
      plazaEmblem.rotation.x = -Math.PI / 2;
      plazaEmblem.position.y = 0.024;
      this.arenaGroup.add(plazaEmblem);

      const stripeMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const dashGeo = new THREE.PlaneGeometry(0.28, 1.4);
      for (const d of [-14, -10.5, -7, 7, 10.5, 14]) {
        const dashNS = new THREE.Mesh(dashGeo, stripeMat);
        dashNS.rotation.x = -Math.PI / 2;
        dashNS.position.set(0, 0.022, d);
        this.arenaGroup.add(dashNS);

        const dashEW = new THREE.Mesh(dashGeo, stripeMat);
        dashEW.rotation.x = -Math.PI / 2;
        dashEW.rotation.z = Math.PI / 2;
        dashEW.position.set(d, 0.022, 0);
        this.arenaGroup.add(dashEW);
      }
    } else if (this.arena === 'parking_deck') {
      const bayMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const bayLineGeo = new THREE.PlaneGeometry(0.18, 4.4);
      for (let x = -14; x <= 14; x += 3.5) {
        if (Math.abs(x) < 1.5) continue;
        for (const zSign of [-1, 1]) {
          const line = new THREE.Mesh(bayLineGeo, bayMat);
          line.rotation.x = -Math.PI / 2;
          line.position.set(x, 0.023, zSign * 14.5);
          this.arenaGroup.add(line);
        }
      }
      const laneArrowMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(26, 0.22), laneArrowMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.y = 0.022;
      this.arenaGroup.add(centerLine);
    } else {
      // Abandoned Helipad: giant ringed landing pad & 'H' markings
      const padRing = new THREE.Mesh(
        new THREE.RingGeometry(6.8, 7.35, 48),
        new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      padRing.rotation.x = -Math.PI / 2;
      padRing.position.y = 0.025;
      this.arenaGroup.add(padRing);

      const hMat = new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const barGeo = new THREE.PlaneGeometry(0.85, 5.6);
      const hLeft = new THREE.Mesh(barGeo, hMat);
      hLeft.rotation.x = -Math.PI / 2;
      hLeft.position.set(-1.9, 0.026, 0);
      const hRight = new THREE.Mesh(barGeo, hMat);
      hRight.rotation.x = -Math.PI / 2;
      hRight.position.set(1.9, 0.026, 0);
      const hCross = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.85), hMat);
      hCross.rotation.x = -Math.PI / 2;
      hCross.position.set(0, 0.026, 0);
      this.arenaGroup.add(hLeft, hRight, hCross);
    }

    // Cast-iron manhole covers for street micro-detail
    const ironGrateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.48,
      metalness: 0.72,
    });
    for (const [mx, mz] of [
      [-3.8, -4.6],
      [4.2, 5.1],
      [-11.5, 2.5],
      [11.2, -3.5],
    ]) {
      const manhole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.55, 0.04, 16),
        ironGrateMat,
      );
      manhole.position.set(mx, 0.02, mz);
      manhole.receiveShadow = true;
      this.arenaGroup.add(manhole);
    }

    // Perimeter Walls, Pilasters, Wrought-Iron Fence & Open Gates
    const wallMat = new THREE.MeshStandardMaterial({
      ...(this.arena === 'courtyard'
        ? { map: brickTex.map, bumpMap: brickTex.bumpMap, bumpScale: 0.04 }
        : {}),
      color: this.arena === 'parking_deck' ? 0x1e293b : this.arena === 'helipad' ? 0x334155 : 0xffffff,
      roughness: 0.88,
      metalness: this.arena === 'courtyard' ? 0.05 : 0.25,
    });
    const wallCapMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.52,
      metalness: 0.35,
    });
    const ironFenceMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.82,
    });

    const span = halfSize * 2 + 1.2;
    const wallThickness = 1.1;
    const wallHeight = this.arena === 'helipad' ? 1.2 : 2.4;
    const wallOffset = halfSize + wallThickness * 0.5;

    const wallSpecs: [number, number, number, number][] = [
      [0, -wallOffset, span, wallThickness],
      [0, wallOffset, span, wallThickness],
      [-wallOffset, 0, wallThickness, span],
      [wallOffset, 0, wallThickness, span],
    ];
    for (const [wx, wz, ww, wd] of wallSpecs) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(ww, wallHeight, wd),
        wallMat,
      );
      wall.position.set(wx, wallHeight / 2, wz);
      wall.receiveShadow = true;
      wall.castShadow = true;
      this.arenaGroup.add(wall);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(ww + 0.16, 0.18, wd + 0.16),
        wallCapMat,
      );
      cap.position.set(wx, wallHeight + 0.09, wz);
      this.arenaGroup.add(cap);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(
          ww > wd ? ww : 0.1,
          0.1,
          wd > ww ? wd : 0.1,
        ),
        ironFenceMat,
      );
      rail.position.set(wx, wallHeight + 0.72, wz);
      this.arenaGroup.add(rail);
    }

    const pilasterGeo = new THREE.BoxGeometry(1.45, wallHeight + 0.9, 1.45);
    const gateArchGeo = new THREE.BoxGeometry(5.2, 0.32, 0.4);
    for (let p = -halfSize; p <= halfSize; p += 10.75) {
      for (const [px, pz] of [
        [p, -wallOffset],
        [p, wallOffset],
        [-wallOffset, p],
        [wallOffset, p],
      ]) {
        const pil = new THREE.Mesh(pilasterGeo, wallMat);
        pil.position.set(px, (wallHeight + 0.9) / 2, pz);
        pil.castShadow = true;
        this.arenaGroup.add(pil);
      }
    }
    if (this.arena !== 'helipad') {
      for (const [gx, gz, rot] of [
        [0, -wallOffset, 0],
        [0, wallOffset, 0],
        [-wallOffset, 0, Math.PI / 2],
        [wallOffset, 0, Math.PI / 2],
      ]) {
        const arch = new THREE.Mesh(gateArchGeo, ironFenceMat);
        arch.position.set(gx, 3.25, gz);
        arch.rotation.y = rot;
        this.arenaGroup.add(arch);
      }
    }

    // Perimeter Dumpsters, Corner Fire Braziers & Wall-Edge Jersey Barriers
    for (const [dx, dz, rot] of [
      [-16.8, -20.2, 0.05],
      [16.8, 20.2, -3.09],
    ]) {
      const dumpster = buildDumpster(this.shadowTex);
      dumpster.position.set(dx, 0, dz);
      dumpster.rotation.y = rot;
      this.arenaGroup.add(dumpster);
    }

    const brazierCoords: [number, number][] = [
      [-20.3, -20.3],
      [20.3, -20.3],
      [-20.3, 20.3],
      [20.3, 20.3],
    ];
    brazierCoords.forEach(([bx, bz], idx) => {
      const brazier = buildCornerBrazier(this.shadowTex, !this.isSoftwareGl);
      brazier.group.position.set(bx, 0, bz);
      this.arenaGroup.add(brazier.group);
      this.cornerEmbers.push({
        mesh: brazier.emberMesh,
        light: brazier.pointLight,
        phase: idx * 1.65,
      });
    });

    const barrierPlacements: [number, number, number][] = [
      [-4.6, -21.05, 0],
      [4.6, -21.05, 0],
      [-4.6, 21.05, 0],
      [4.6, 21.05, 0],
      [-21.05, -4.6, Math.PI / 2],
      [-21.05, 4.6, Math.PI / 2],
      [21.05, -4.6, Math.PI / 2],
      [21.05, 4.6, Math.PI / 2],
    ];
    for (const [jx, jz, rot] of barrierPlacements) {
      const barrier = buildJerseyBarrier(hazardTex);
      barrier.position.set(jx, 0, jz);
      barrier.rotation.y = rot;
      this.arenaGroup.add(barrier);
    }

    // Surrounding urban city block silhouettes
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.15,
    });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const neonRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const outerCoords: [number, number, number, number, number][] = [
      [-32, -30, 12, 16, 10],
      [-14, -34, 16, 12, 11],
      [14, -33, 14, 18, 10],
      [33, -28, 12, 14, 12],
      [-34, 0, 12, 20, 16],
      [34, 2, 12, 15, 18],
      [-32, 31, 13, 13, 12],
      [0, 35, 22, 10, 10],
      [32, 32, 14, 17, 12],
    ];
    outerCoords.forEach(([bx, bz, bw, bh, bd], idx) => {
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bldgMat);
      bldg.position.set(bx, bh / 2, bz);
      this.arenaGroup.add(bldg);

      const hvac = new THREE.Mesh(
        new THREE.BoxGeometry(bw * 0.35, 1.4, bd * 0.35),
        wallCapMat,
      );
      hvac.position.set(bx + 1.2, bh + 0.7, bz);
      this.arenaGroup.add(hvac);

      for (let w = 0; w < 3; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.3, 0.2), winMat);
        win.position.set(
          bx + (w - 1) * 3.1,
          bh * (0.55 + (w % 2) * 0.16),
          bz + (bz < 0 ? bd / 2 + 0.05 : -bd / 2 - 0.05),
        );
        this.arenaGroup.add(win);
      }

      if (idx === 1 || idx === 2 || idx === 4) {
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(3.8, 0.65, 0.22),
          idx === 1 ? neonRedMat : neonCyanMat,
        );
        sign.position.set(
          bx,
          5.2,
          bz + (bz < 0 ? bd / 2 + 0.15 : -bd / 2 - 0.15),
        );
        if (idx === 4) {
          sign.rotation.y = Math.PI / 2;
          sign.position.set(bx + bw / 2 + 0.15, 5.4, bz);
        }
        this.arenaGroup.add(sign);
      }
    });

    // Arena Tactical Obstacles (Cars, Crates, Pillars, Streetlamps)
    let lampIdx = 0;
    for (const obs of arenaSpec.obstacles) {
      let mesh: THREE.Group;
      if (obs.kind === 'car') {
        mesh = buildCarMesh(
          obs.colorVariant ?? 0,
          obs.halfW,
          obs.halfD,
          this.shadowTex,
        );
      } else if (obs.kind === 'crate') {
        mesh = buildCrateCluster(
          obs.halfW,
          obs.halfD,
          obs.height,
          crateTex,
          this.shadowTex,
          hazardTex,
        );
      } else if (obs.kind === 'pillar') {
        mesh = buildConcretePillar(
          obs.halfW,
          obs.halfD,
          obs.height,
          this.shadowTex,
          hazardTex,
        );
      } else {
        const lampRig = buildStreetLamp(lightPoolTex, true);
        mesh = lampRig.group;
        mesh.rotation.y = Math.atan2(-obs.x, -obs.z);
        this.streetLamps.push({
          rig: lampRig,
          phase: lampIdx * 1.93,
          glitchCooldown: 2.2 + lampIdx * 1.4,
          glitchTimer: 0,
        });
        lampIdx += 1;
      }
      mesh.position.set(obs.x, 0, obs.z);
      if (obs.kind !== 'lamp') {
        mesh.rotation.y = obs.rotationY;
      }
      this.arenaGroup.add(mesh);
    }

    // Explosive Barrels
    arenaSpec.barrelCoords.forEach((coord, idx) => {
      const rig = buildExplosiveBarrel(this.shadowTex, hazardTex);
      rig.root.position.set(coord.x, 0, coord.z);
      this.arenaGroup.add(rig.root);
      this.barrels.push({
        id: `barrel-${idx}`,
        rig,
        x: coord.x,
        z: coord.z,
        active: true,
        respawnTimer: 0,
      });
    });

    // Floodlight Generators
    arenaSpec.generatorCoords.forEach((coord, idx) => {
      const rig = buildFloodlightGenerator(
        this.shadowTex,
        lightPoolTex,
        !this.isSoftwareGl,
      );
      rig.root.position.set(coord.x, 0, coord.z);
      this.arenaGroup.add(rig.root);
      this.generators.push({
        id: idx === 0 ? 'GEN-W' : 'GEN-E',
        rig,
        x: coord.x,
        z: coord.z,
        powered: false,
        hp: 100,
        maxHp: 100,
        chargeProgress: 0,
        activeRemaining: 0,
        playerInside: false,
      });
    });
  }

  private buildPools(): void {
    // InstancedMesh Bullet Tracer Pool
    const tracerGeo = new THREE.BoxGeometry(0.068, 0.068, 1);
    tracerGeo.translate(0, 0, -0.5);
    const tracerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.tracerMesh = new THREE.InstancedMesh(tracerGeo, tracerMat, MAX_TRACERS);
    this.tracerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.tracerMesh.frustumCulled = false;
    for (let i = 0; i < MAX_TRACERS; i++) {
      this.tracers.push({
        active: false,
        x: 0,
        y: -20,
        z: 0,
        angle: 0,
        length: 1,
        r: 1,
        g: 0.85,
        b: 0.4,
        life: 0,
        maxLife: 0.09,
      });
      _mat4.makeScale(0, 0, 0);
      this.tracerMesh.setMatrixAt(i, _mat4);
      _color.setRGB(1, 0.85, 0.4);
      this.tracerMesh.setColorAt(i, _color);
    }
    this.tracerMesh.instanceMatrix.needsUpdate = true;
    if (this.tracerMesh.instanceColor) {
      this.tracerMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.tracerMesh);

    // InstancedMesh Brass Shell Casings Pool
    const casingGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.12, 6);
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.35,
      metalness: 0.88,
    });
    this.casingMesh = new THREE.InstancedMesh(casingGeo, casingMat, MAX_CASINGS);
    this.casingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.casingMesh.frustumCulled = false;
    for (let i = 0; i < MAX_CASINGS; i++) {
      this.casings.push({
        active: false,
        x: 0,
        y: -20,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        vrx: 0,
        vry: 0,
        life: 0,
        maxLife: 0.9,
      });
      _mat4.makeScale(0, 0, 0);
      this.casingMesh.setMatrixAt(i, _mat4);
    }
    this.casingMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.casingMesh);

    // InstancedMesh Acid Pools (Disc + Outer Glow Rim)
    const acidDiscGeo = new THREE.CircleGeometry(1.85, 22);
    acidDiscGeo.rotateX(-Math.PI / 2);
    const acidDiscMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.acidPoolDiscMesh = new THREE.InstancedMesh(
      acidDiscGeo,
      acidDiscMat,
      MAX_ACID_POOLS,
    );
    this.acidPoolDiscMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.acidPoolDiscMesh.frustumCulled = false;

    const acidRimGeo = new THREE.RingGeometry(1.66, 1.88, 22);
    acidRimGeo.rotateX(-Math.PI / 2);
    const acidRimMat = new THREE.MeshBasicMaterial({
      color: 0xa3e635,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.acidPoolRimMesh = new THREE.InstancedMesh(
      acidRimGeo,
      acidRimMat,
      MAX_ACID_POOLS,
    );
    this.acidPoolRimMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.acidPoolRimMesh.frustumCulled = false;

    for (let i = 0; i < MAX_ACID_POOLS; i++) {
      this.acidPuddles.push({
        active: false,
        x: 0,
        z: 0,
        age: 0,
        duration: 5.5,
        tickTimer: 0,
        damage: 0,
      });
      _mat4.makeScale(0, 0, 0);
      this.acidPoolDiscMesh.setMatrixAt(i, _mat4);
      this.acidPoolRimMesh.setMatrixAt(i, _mat4);
    }
    this.acidPoolDiscMesh.instanceMatrix.needsUpdate = true;
    this.acidPoolRimMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.acidPoolDiscMesh);
    this.scene.add(this.acidPoolRimMesh);

    // InstancedMesh Red Ground Telegraph Rings for incoming Acid Spitter Globs
    const acidTargetGeo = new THREE.RingGeometry(1.05, 1.42, 24);
    acidTargetGeo.rotateX(-Math.PI / 2);
    const acidTargetMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.acidImpactRingMesh = new THREE.InstancedMesh(
      acidTargetGeo,
      acidTargetMat,
      MAX_ACID_IMPACT_RINGS,
    );
    this.acidImpactRingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.acidImpactRingMesh.frustumCulled = false;
    for (let i = 0; i < MAX_ACID_IMPACT_RINGS; i++) {
      _mat4.makeScale(0, 0, 0);
      this.acidImpactRingMesh.setMatrixAt(i, _mat4);
    }
    this.acidImpactRingMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.acidImpactRingMesh);

    // InstancedMesh particle ring buffer
    const pGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, MAX_PARTICLES);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -20,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.4,
        size: 1,
        r: 1,
        g: 1,
        b: 1,
        splatsOnLand: false,
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      _color.setRGB(1, 1, 1);
      this.particleMesh.setColorAt(i, _color);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.particleMesh);

    // Ground Blood Splat & Directional Streak Decal Ring Buffer
    const decalGeo = new THREE.PlaneGeometry(1.5, 1.5);
    for (let i = 0; i < MAX_DECALS; i++) {
      const decalMat = new THREE.MeshBasicMaterial({
        map: this.bloodSplatTex,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const mesh = new THREE.Mesh(decalGeo, decalMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.scene.add(mesh);
      this.decals.push({
        mesh,
        mat: decalMat,
        active: false,
        currentScaleX: 1,
        currentScaleY: 1,
        targetScaleX: 1,
        targetScaleY: 1,
        age: 0,
        opacity: 0.82,
      });
    }

    // Drifting Night Fog / Ash Motes
    const dustCount = 85;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() * 2 - 1) * ARENA_HALF_SIZE;
      dustPos[i * 3 + 1] = 0.6 + Math.random() * 4.5;
      dustPos[i * 3 + 2] = (Math.random() * 2 - 1) * ARENA_HALF_SIZE;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: 0xfde68a,
      size: 0.15,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this.ambientDust = new THREE.Points(dustGeo, this.dustMat);
    this.scene.add(this.ambientDust);

    // Dynamic 3D Rain Streak InstancedMesh Pool
    const rainGeo = new THREE.BoxGeometry(0.032, 0.85, 0.032);
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this.rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, MAX_RAIN_DROPS);
    this.rainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = false;
    for (let i = 0; i < MAX_RAIN_DROPS; i++) {
      this.rainDrops.push({
        x: (Math.random() * 2 - 1) * 20,
        y: Math.random() * 14,
        z: (Math.random() * 2 - 1) * 20,
        speed: 19 + Math.random() * 7,
        len: 0.75 + Math.random() * 0.6,
      });
      _mat4.makeScale(0, 0, 0);
      this.rainMesh.setMatrixAt(i, _mat4);
    }
    this.rainMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.rainMesh);

    // Pre-allocated dynamic PointLight pool that tracks active zombies
    for (let i = 0; i < ZOMBIE_LIGHT_POOL_SIZE; i++) {
      const zLight = new THREE.PointLight(0xff2e2e, 0, 6.2, 2);
      zLight.position.set(0, -10, 0);
      this.scene.add(zLight);
      this.zombieLights.push(zLight);
    }
  }

  private attachEvents(canvas: HTMLElement): void {
    const unlockAudio = () => this.sound.unlock();
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    canvas.addEventListener('pointerdown', this.handleCanvasPointerDown);
    canvas.addEventListener('wheel', this.handleCanvasWheel, { passive: true });
    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.addEventListener('pointerup', this.handleWindowPointerUp);
    canvas.addEventListener('contextmenu', this.preventContext);

    this.disposables.push({
      dispose: () => {
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.handleWindowBlur);
        document.removeEventListener(
          'visibilitychange',
          this.handleVisibilityChange,
        );
        canvas.removeEventListener('pointerdown', this.handleCanvasPointerDown);
        canvas.removeEventListener('wheel', this.handleCanvasWheel);
        window.removeEventListener('pointermove', this.handleWindowPointerMove);
        window.removeEventListener('pointerup', this.handleWindowPointerUp);
        canvas.removeEventListener('contextmenu', this.preventContext);
      },
    });
  }

  private preventContext = (e: Event) => e.preventDefault();

  private handleWindowBlur = () => {
    this.clearHeldInputs();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.clearHeldInputs();
    }
  };

  private clearHeldInputs(): void {
    this.keys.clear();
    this.mouseDown = false;
    this.moveStickX = 0;
    this.moveStickY = 0;
    this.aimStickActive = false;
    this.aimStickX = 0;
    this.aimStickY = 0;
  }

  private handleCanvasWheel = (e: WheelEvent) => {
    if (this.phase !== 'playing' || this.uiSimulationPaused) return;
    if (Math.abs(e.deltaY) < 4) return;
    if (e.deltaY > 0) {
      this.switchWeapon();
    } else {
      this.prevWeapon();
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.sound.unlock();
    const code = e.code;
    const activeTag = (e.target as HTMLElement | null)?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
      return;
    }

    if (this.phase === 'title') {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        const saved = loadRunProgress();
        const canResume = Boolean(saved && saved.activeInterrupted !== false);
        this.startNewGame({
          fromBeginning: !canResume,
          resumeInterrupted: canResume,
        });
      }
      return;
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (this.phase === 'playing' && !this.perkDraftChoices) {
        this.pauseGame();
        return;
      } else if (this.phase === 'paused') {
        this.resumeGame();
        return;
      }
    }

    if (code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (this.phase !== 'playing') return;

    if (this.perkDraftChoices) {
      if (code === 'Digit1' && this.perkDraftChoices[0]) {
        this.choosePerk(this.perkDraftChoices[0]);
      } else if (code === 'Digit2' && this.perkDraftChoices[1]) {
        this.choosePerk(this.perkDraftChoices[1]);
      } else if (code === 'Digit3' && this.perkDraftChoices[2]) {
        this.choosePerk(this.perkDraftChoices[2]);
      }
      return;
    }

    this.keys.add(code);

    const weaponHotkeys = [
      'Digit1',
      'Digit2',
      'Digit3',
      'Digit4',
      'Digit5',
      'Digit6',
      'Digit7',
      'Digit8',
      'Digit9',
      'Digit0',
      'Minus',
      'Equal',
    ];
    const slotIdx = weaponHotkeys.indexOf(code);
    if (slotIdx !== -1 && slotIdx < WEAPON_ORDER.length) {
      this.selectWeapon(WEAPON_ORDER[slotIdx]);
      return;
    }

    if (code === 'Space') {
      e.preventDefault();
      this.triggerDash();
    } else if (code === 'KeyR') {
      this.triggerReload();
    } else if (code === 'KeyG' || code === 'KeyE') {
      this.triggerGear();
    } else if (code === 'KeyQ') {
      this.triggerGadget();
    } else if (code === 'Tab') {
      e.preventDefault();
      this.switchWeapon();
    } else if (code === 'BracketLeft') {
      this.prevWeapon();
    } else if (code === 'BracketRight') {
      this.switchWeapon();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handleCanvasPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (this.phase !== 'playing') return;
    this.sound.unlock();
    if (e.button === 0) {
      this.mouseDown = true;
      this.hasMouseAim = true;
      this.mouseClientX = e.clientX;
      this.mouseClientY = e.clientY;
    }
  };

  private handleWindowPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.hasMouseAim = true;
    this.mouseClientX = e.clientX;
    this.mouseClientY = e.clientY;
  };

  private handleWindowPointerUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  // --- Public Controls for Touch & UI ---

  public setMoveStick(x: number, y: number): void {
    this.sound.unlock();
    this.moveStickX = THREE.MathUtils.clamp(x, -1, 1);
    this.moveStickY = THREE.MathUtils.clamp(y, -1, 1);
  }

  public setAimStick(x: number, y: number, active: boolean): void {
    this.sound.unlock();
    this.aimStickX = THREE.MathUtils.clamp(x, -1, 1);
    this.aimStickY = THREE.MathUtils.clamp(y, -1, 1);
    this.aimStickActive = active;
    if (active) {
      this.hasMouseAim = false;
    }
  }

  private hasPerk(id: PerkId): boolean {
    return this.ownedPerks.includes(id);
  }

  private hasEvolution(id: EvolutionId): boolean {
    return this.evolvedWeapons.includes(id);
  }

  private rand(): number {
    return this.seededRng ? this.seededRng() : Math.random();
  }

  public triggerDash(): void {
    if (this.phase !== 'playing' || this.uiSimulationPaused) return;
    if (this.dashCooldownTimer > 0 || this.dashTimer > 0) return;

    const moveVec = this.getDesiredMoveVector();
    if (moveVec.len > 0.1) {
      this.dashDirX = moveVec.x;
      this.dashDirZ = moveVec.z;
    } else {
      this.dashDirX = -Math.sin(this.playerAimAngle);
      this.dashDirZ = -Math.cos(this.playerAimAngle);
    }
    this.dashTimer = DASH_DURATION;
    this.dashCooldownTimer = this.getEffectiveDashCooldown();
    this.invulnTimer = Math.max(this.invulnTimer, DASH_DURATION + 0.08);
    this.sound.playDash();
    const trailColor =
      SKIN_SPECS[this.career.equippedSkinId]?.trailColor ?? 0x38bdf8;
    this.spawnBurstParticles(
      this.playerX,
      0.5,
      this.playerZ,
      10,
      trailColor,
      4.5,
    );

    if (this.hasPerk('dash_shockwave')) {
      const pulseR = 4.6;
      const dmg = Math.round(48 * getDamageMultiplier(this.upgradeLevels));
      this.spawnFlashRing(this.playerX, this.playerZ, pulseR, 0x38bdf8, 0.34);
      for (let i = this.zombies.length - 1; i >= 0; i--) {
        const z = this.zombies[i];
        if (z.dying) continue;
        const dx = z.x - this.playerX;
        const dz = z.z - this.playerZ;
        const dist = Math.hypot(dx, dz) || 0.001;
        if (dist <= pulseR + z.radius) {
          z.stunTimer = Math.max(z.stunTimer, z.kind === 'boss' ? 0.4 : 0.9);
          this.damageZombie(z, dmg, false, dx / dist, dz / dist, 11.5, true);
        }
      }
      for (let i = 0; i < this.acidPuddles.length; i++) {
        const puddle = this.acidPuddles[i];
        if (
          puddle.active &&
          Math.hypot(puddle.x - this.playerX, puddle.z - this.playerZ) <= 4.2
        ) {
          puddle.active = false;
        }
      }
    }

    this.emitHudSnapshot(true);
  }

  public triggerReload(): void {
    if (this.phase !== 'playing' || this.uiSimulationPaused) return;
    if (this.isReloading) return;
    const state = this.getActiveWeaponState();
    const magSize = this.getWeaponMagSize(state.id);
    if (!canStartReload(state, magSize)) return;

    this.isReloading = true;
    this.reloadTimer = this.getEffectiveReloadDuration(state.id);
    this.sound.playReloadStart();
    this.emitHudSnapshot(true);
  }

  public equipGear(id: TacticalGearId): void {
    if (this.equippedGear === id) return;
    this.equippedGear = id;
    if (this.phase === 'playing' || this.phase === 'paused') {
      this.pickupToast = `GEAR · ${TACTICAL_GEAR_SPECS[id].name.toUpperCase()}`;
      this.pickupToastTimer = 1.6;
      this.persistCurrentProgress();
    }
    this.emitHudSnapshot(true);
  }

  public cycleGear(): void {
    this.equipGear(getNextTacticalGear(this.equippedGear));
  }

  public equipGadget(id: GadgetId): void {
    if (this.equippedGadget === id) return;
    this.equippedGadget = id;
    if (this.phase === 'playing' || this.phase === 'paused') {
      this.pickupToast = `GADGET · ${GADGET_SPECS[id].name.toUpperCase()}`;
      this.pickupToastTimer = 1.6;
      this.persistCurrentProgress();
    }
    this.emitHudSnapshot(true);
  }

  public cycleGadget(): void {
    this.equipGadget(getNextGadget(this.equippedGadget));
  }

  public triggerGadget(): void {
    if (
      this.phase !== 'playing' ||
      this.uiSimulationPaused ||
      this.perkDraftChoices
    ) {
      return;
    }
    if (this.gadgetCooldownTimer > 0) return;

    const gadgetId = this.equippedGadget;
    const spec = GADGET_SPECS[gadgetId];
    this.gadgetCooldownTimer =
      spec.cooldownSec * (this.dailyMutator === 'hyper_dash' ? 0.85 : 1);

    const fwdX = -Math.sin(this.playerAimAngle);
    const fwdZ = -Math.cos(this.playerAimAngle);
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();

    if (gadgetId === 'tripmine') {
      const pos = resolveArenaCollisions(
        this.playerX + fwdX * 1.25,
        this.playerZ + fwdZ * 1.25,
        0.4,
        obstacles,
        halfSize,
      );
      if (this.activeTripmines.length >= spec.maxActive) {
        const oldest = this.activeTripmines.shift();
        if (oldest) this.scene.remove(oldest.root);
      }
      const root = buildLaserTripmine(this.shadowTex);
      root.position.set(pos.x, 0, pos.z);
      root.rotation.y = this.playerAimAngle;
      this.scene.add(root);
      this.activeTripmines.push({
        root,
        x: pos.x,
        z: pos.z,
        armTimer: 0.4,
        life: 55,
      });
      this.sound.playGadgetDeploy('tripmine');
      this.pickupToast = 'LASER TRIPMINE SET';
      this.pickupToastTimer = 1.4;
    } else if (gadgetId === 'decoy') {
      const pos = resolveArenaCollisions(
        this.playerX + fwdX * 4.5,
        this.playerZ + fwdZ * 4.5,
        0.45,
        obstacles,
        halfSize,
      );
      if (this.activeDecoys.length >= spec.maxActive) {
        const oldest = this.activeDecoys.shift();
        if (oldest) this.scene.remove(oldest.root);
      }
      const root = buildDecoyFlare(this.shadowTex);
      root.position.set(pos.x, 0, pos.z);
      this.scene.add(root);
      const dur = spec.durationSec ?? 5.0;
      this.activeDecoys.push({
        root,
        x: pos.x,
        z: pos.z,
        life: dur,
        maxLife: dur,
      });
      this.sound.playGadgetDeploy('decoy');
      this.pickupToast = 'DECOY FLARE LIT · 5s LURE';
      this.pickupToastTimer = 1.6;
      this.spawnBurstParticles(pos.x, 0.3, pos.z, 12, 0xf59e0b, 4.2);
    } else if (gadgetId === 'wire') {
      const pos = resolveArenaCollisions(
        this.playerX + fwdX * 1.8,
        this.playerZ + fwdZ * 1.8,
        0.55,
        obstacles,
        halfSize,
      );
      if (this.activeWires.length >= spec.maxActive) {
        const oldest = this.activeWires.shift();
        if (oldest) this.scene.remove(oldest.root);
      }
      const root = buildBarbedWireMesh(this.shadowTex);
      root.position.set(pos.x, 0, pos.z);
      root.rotation.y = this.playerAimAngle;
      this.scene.add(root);
      this.activeWires.push({
        root,
        x: pos.x,
        z: pos.z,
        life: spec.durationSec ?? 14.0,
        tickTimer: 0,
      });
      this.sound.playGadgetDeploy('wire');
      this.pickupToast = 'BARBED WIRE DEPLOYED';
      this.pickupToastTimer = 1.5;
    } else {
      // Mortar Strike 7.5m along aim vector
      const pos = resolveArenaCollisions(
        this.playerX + fwdX * 7.5,
        this.playerZ + fwdZ * 7.5,
        0.8,
        obstacles,
        halfSize,
      );
      const ringRig = buildMortarTargetRing(spec.radius);
      ringRig.group.position.set(pos.x, 0, pos.z);
      this.scene.add(ringRig.group);
      this.activeMortars.push({
        group: ringRig.group,
        fillMat: ringRig.fillMat,
        x: pos.x,
        z: pos.z,
        age: 0,
        duration: spec.durationSec ?? 1.05,
      });
      this.sound.playGadgetDeploy('mortar');
      this.pickupToast = 'MORTAR STRIKE INBOUND';
      this.pickupToastTimer = 1.4;
    }

    this.emitHudSnapshot(true);
  }

  public triggerGear(): void {
    if (
      this.phase !== 'playing' ||
      this.uiSimulationPaused ||
      this.perkDraftChoices
    ) {
      return;
    }
    if (this.gearCooldownTimer > 0) return;

    const gearId = this.equippedGear;
    const spec = TACTICAL_GEAR_SPECS[gearId];
    const classSpec = CLASS_SPECS[this.career.selectedClass];
    this.gearCooldownTimer = spec.cooldownSec * classSpec.gearCooldownMult;

    const fwdX = -Math.sin(this.playerAimAngle);
    const fwdZ = -Math.cos(this.playerAimAngle);
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();

    if (gearId === 'mine') {
      const pos = resolveArenaCollisions(
        this.playerX + fwdX * 1.15,
        this.playerZ + fwdZ * 1.15,
        0.4,
        obstacles,
        halfSize,
      );
      const maxMines = spec.maxActive + classSpec.bonusMineCap;
      if (this.activeMines.length >= maxMines) {
        const oldest = this.activeMines.shift();
        if (oldest) this.scene.remove(oldest.rig.root);
      }
      const rig = buildProximityMineMesh(this.shadowTex);
      rig.root.position.set(pos.x, 0, pos.z);
      this.scene.add(rig.root);
      this.activeMines.push({
        rig,
        x: pos.x,
        z: pos.z,
        armTimer: spec.armDelaySec ?? 0.45,
        life: 45,
      });
      this.sound.playGearDeploy('mine');
      this.pickupToast = 'PROXIMITY MINE ARMED';
      this.pickupToastTimer = 1.4;
      this.spawnBurstParticles(pos.x, 0.2, pos.z, 8, 0xf59e0b, 3.2);
    } else if (gearId === 'turret') {
      const pos = resolveArenaCollisions(
        this.playerX + fwdX * 1.3,
        this.playerZ + fwdZ * 1.3,
        0.55,
        obstacles,
        halfSize,
      );
      if (this.activeTurrets.length >= spec.maxActive) {
        const oldest = this.activeTurrets.shift();
        if (oldest) this.scene.remove(oldest.rig.root);
      }
      const rig = buildDeployableTurretRig(this.shadowTex);
      rig.root.position.set(pos.x, 0, pos.z);
      rig.headGroup.rotation.y = this.playerAimAngle;
      this.scene.add(rig.root);
      this.activeTurrets.push({
        rig,
        x: pos.x,
        z: pos.z,
        life: spec.durationSec ?? 14,
        fireTimer: 0.25,
        flashTimer: 0,
      });
      hapticTurretDeploy();
      this.sound.playGearDeploy('turret');
      this.pickupToast = this.hasEvolution('tesla_coil')
        ? 'TESLA COIL DEPLOYED'
        : 'SENTRY TURRET DEPLOYED';
      this.pickupToastTimer = 1.6;
      this.spawnBurstParticles(
        pos.x,
        0.5,
        pos.z,
        10,
        this.hasEvolution('tesla_coil') ? 0xf59e0b : 0x38bdf8,
        4.0,
      );
    } else {
      // Flashbang blast around player
      const blastR = spec.blastRadius * classSpec.blastRadiusMult;
      const dmg = Math.round(spec.damage * getDamageMultiplier(this.upgradeLevels));
      this.sound.playFlashbang();
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.02);
      this.trauma = Math.min(0.95, this.trauma + 0.42);
      this.spawnFlashRing(this.playerX, this.playerZ, blastR, 0xe0f2fe, 0.34);
      this.spawnBurstParticles(this.playerX, 0.9, this.playerZ, 24, 0xf8fafc, 8.2);

      for (let i = this.zombies.length - 1; i >= 0; i--) {
        const z = this.zombies[i];
        if (z.dying) continue;
        const dx = z.x - this.playerX;
        const dz = z.z - this.playerZ;
        const dist = Math.hypot(dx, dz) || 0.001;
        if (dist <= blastR + z.radius) {
          z.stunTimer = Math.max(
            z.stunTimer,
            z.kind === 'boss'
              ? (spec.bossStunDurationSec ?? 1.8)
              : (spec.stunDurationSec ?? 4.0),
          );
          z.revealTimer = Math.max(z.revealTimer, 4.5);
          z.isWindingUp = false;
          z.chargePending = false;
          if (z.rig.telegraphRing) z.rig.telegraphRing.visible = false;
          if (z.rig.telegraphLine) z.rig.telegraphLine.visible = false;
          this.damageZombie(z, dmg, false, dx / dist, dz / dist, 7.5, true);
        }
      }
      this.pickupToast = 'FLASHBANG · ENEMIES STUNNED';
      this.pickupToastTimer = 1.6;
    }

    this.emitHudSnapshot(true);
  }

  public switchWeapon(): void {
    if (this.phase !== 'playing') return;
    const next = getNextUnlockedWeapon(this.weapons, this.activeWeapon);
    if (next !== this.activeWeapon) {
      this.selectWeapon(next);
    }
  }

  public prevWeapon(): void {
    if (this.phase !== 'playing') return;
    const prev = getPrevUnlockedWeapon(this.weapons, this.activeWeapon);
    if (prev !== this.activeWeapon) {
      this.selectWeapon(prev);
    }
  }

  public selectWeapon(id: WeaponId): void {
    if (this.phase !== 'playing') return;
    const target = this.weapons.find((w) => w.id === id);
    if (!target || !target.unlocked || id === this.activeWeapon) return;
    this.activeWeapon = id;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.syncPlayerWeaponVisibility();
    this.sound.playReloadStart();
    this.persistCurrentProgress();
    this.emitHudSnapshot(true);
  }

  public setUpgradeDrawerOpen(open: boolean): void {
    if (this.phase !== 'playing') {
      this.uiSimulationPaused = false;
      return;
    }
    this.uiSimulationPaused = open || Boolean(this.perkDraftChoices);
    if (open) {
      this.clearHeldInputs();
    }
  }

  private evaluateEvolutions(): void {
    const newly = evaluateWeaponEvolutions(
      this.weaponMastery,
      this.upgradeLevels,
      this.ownedPerks,
      this.evolvedWeapons,
    );
    if (newly.length > 0) {
      for (const evoId of newly) {
        if (!this.evolvedWeapons.includes(evoId)) {
          this.evolvedWeapons.push(evoId);
        }
      }
      const last = newly[newly.length - 1];
      this.evolutionBanner = `WEAPON EVOLVED · ${EVOLUTION_SPECS[last].name.toUpperCase()}`;
      this.evolutionBannerTimer = 3.2;
      this.sound.playWeaponEvolution();
      this.spawnBurstParticles(this.playerX, 1.0, this.playerZ, 22, 0xf59e0b, 6.8);
    }
  }

  public buyUpgrade(id: UpgradeId): boolean {
    if (this.phase !== 'playing') return false;
    const prevMags: Partial<Record<WeaponId, number>> = {};
    for (const wId of WEAPON_ORDER) {
      prevMags[wId] = this.getWeaponMagSize(wId);
    }

    const result = purchaseUpgrade(this.upgradeLevels, this.upgradePoints, id);
    if (!result.purchased) return false;
    this.upgradePoints = result.nextPoints;

    if (id === 'vitality') {
      this.maxHp =
        getMaxHpForLevel(this.upgradeLevels) +
        getPermanentBaseHpBonus(this.career.permanentUpgrades);
      this.hp = Math.min(this.maxHp, this.hp + 12);
      this.ghostHp = Math.max(this.ghostHp, this.hp);
    } else if (id === 'capacity') {
      for (const w of this.weapons) {
        const nextMag = this.getWeaponMagSize(w.id);
        const delta = Math.max(0, nextMag - (prevMags[w.id] ?? nextMag));
        if (delta > 0 && w.unlocked) {
          w.mag = Math.min(nextMag, w.mag + delta);
        }
      }
    }

    this.sound.playUpgrade();
    this.pickupToast = `UPGRADED · ${UPGRADE_SPECS[id].name.toUpperCase()} LV${result.newLevel}`;
    this.pickupToastTimer = 1.8;
    this.evaluateEvolutions();
    this.spawnBurstParticles(this.playerX, 0.9, this.playerZ, 12, 0x38bdf8, 4.5);
    this.persistCurrentProgress();
    this.emitHudSnapshot(true);
    return true;
  }

  public buyWeaponMastery(weaponId: WeaponId): boolean {
    if (this.phase !== 'playing') return false;
    const res = purchaseWeaponMastery(
      this.weaponMastery,
      this.upgradePoints,
      weaponId,
    );
    if (!res.purchased) return false;
    this.upgradePoints = res.nextPoints;
    this.sound.playUpgrade();
    this.pickupToast = `${WEAPON_SPECS[weaponId].shortCode} MASTERY LV${res.newLevel}`;
    this.pickupToastTimer = 1.8;
    this.evaluateEvolutions();
    this.spawnBurstParticles(this.playerX, 0.9, this.playerZ, 12, 0xf59e0b, 4.5);
    this.persistCurrentProgress();
    this.emitHudSnapshot(true);
    return true;
  }

  public choosePerk(perkId: PerkId): void {
    if (this.phase !== 'playing' || !this.perkDraftChoices) return;
    if (!this.perkDraftChoices.includes(perkId)) return;

    const prevMagSizes: Partial<Record<WeaponId, number>> = {};
    for (const wId of WEAPON_ORDER) {
      prevMagSizes[wId] = this.getWeaponMagSize(wId);
    }

    if (!this.ownedPerks.includes(perkId)) {
      this.ownedPerks.push(perkId);
    }
    this.perkDraftChoices = null;
    this.uiSimulationPaused = false;
    this.sound.playPerkSelect();
    this.pickupToast = `PERK · ${PERK_SPECS[perkId].name.toUpperCase()}`;
    this.pickupToastTimer = 2.1;

    if (perkId === 'extended_drums') {
      for (const w of this.weapons) {
        const nextMag = this.getWeaponMagSize(w.id);
        const delta = Math.max(0, nextMag - (prevMagSizes[w.id] ?? nextMag));
        if (delta > 0 && w.unlocked) {
          w.mag = Math.min(nextMag, w.mag + delta);
        }
      }
    } else if (perkId === 'uv_overdrive') {
      this.applyClassFlashlightVisuals();
    }

    this.evaluateEvolutions();
    this.advanceToNextWave();
  }

  public setArena(arenaId: ArenaId): void {
    if (this.arena === arenaId) return;
    this.arena = arenaId;
    this.rebuildArena();
    this.emitHudSnapshot(true);
  }

  public setGameMode(modeId: GameModeId): void {
    this.mode = modeId;
    if (modeId !== 'daily') {
      this.dailyDateKey = null;
      this.dailyMutator = undefined;
      this.dailyMutatorLabel = null;
    }
    if (this.phase === 'title') {
      this.applyWeatherImmediate(
        modeId === 'storm' ? 'storm' : (this.weatherOverride ?? 'clear'),
      );
    }
    this.emitHudSnapshot(true);
  }

  public setCallsign(raw: string): string {
    this.callsign = saveCallsign(raw);
    this.emitHudSnapshot(true);
    return this.callsign;
  }

  public startDailyRun(): void {
    const cfg = getDailyChallengeConfig();
    this.mode = 'daily';
    this.arena = cfg.arena;
    this.dailyDateKey = cfg.dateKey;
    this.dailyMutator = cfg.mutator.id;
    this.dailyMutatorLabel = `${cfg.mutator.name} · ${cfg.mutator.summary}`;
    this.rebuildArena();
    this.startNewGame({ fromBeginning: true });
  }

  // --- Settings, Career, Skins, Classes & Live 3D Preview ---

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public setSettings(next: GameSettings): GameSettings {
    this.settings = saveSettings(next);
    this.applyGraphicsSettings();
    setHapticsEnabled(this.settings.hapticsEnabled);
    this.callbacks.onSettingsUpdate?.({ ...this.settings });
    this.emitHudSnapshot(true);
    return { ...this.settings };
  }

  private applyGraphicsSettings(): void {
    const mobile = isMobileDeviceViewport(
      this.viewportW,
      typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0,
    );
    const dpr = getEffectivePixelRatio(
      this.settings.graphicsQuality,
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      mobile,
      this.isSoftwareGl,
    );
    this.renderer.setPixelRatio(dpr);
    const shadows = shouldEnableShadows(
      this.settings.graphicsQuality,
      this.isSoftwareGl,
    );
    this.renderer.shadowMap.enabled = shadows;
    if (this.moonLight) {
      this.moonLight.castShadow = shadows;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  private applyClassFlashlightVisuals(): void {
    const uvMult = this.hasPerk('uv_overdrive') ? 1.32 : 1;
    const mult = CLASS_SPECS[this.career.selectedClass].flashlightConeMult * uvMult;
    this.playerRig.flashlightSpot.angle = Math.min(1.15, 0.56 * mult);
    this.playerRig.flashlightCone.scale.set(mult, 1, mult);
  }

  public getCareer(): CareerStats {
    return this.career;
  }

  public setSkinPreviewMode(active: boolean, skinId?: SkinId): void {
    this.skinPreviewActive = active;
    if (active) {
      const targetSkin: SkinId = skinId ?? this.career.equippedSkinId;
      this.skinPreviewId = targetSkin;
      applyPlayerSkin(this.playerRig, targetSkin);
    } else {
      this.skinPreviewId = null;
      this.skinPreviewRotation = 0;
      this.playerRig.root.rotation.y = 0;
      applyPlayerSkin(this.playerRig, this.career.equippedSkinId);
    }
  }

  public equipSkin(skinId: SkinId): CareerStats {
    if (!this.career.unlockedSkins.includes(skinId)) {
      return this.career;
    }
    this.career = saveCareerStats({
      ...this.career,
      equippedSkinId: skinId,
    });
    applyPlayerSkin(this.playerRig, skinId);
    if (this.skinPreviewActive) {
      this.skinPreviewId = skinId;
    }
    this.callbacks.onCareerUpdate?.(this.career);
    this.emitHudSnapshot(true);
    return this.career;
  }

  public selectClass(classId: SurvivorClassId): CareerStats {
    this.career = saveCareerStats({
      ...this.career,
      selectedClass: classId,
    });
    this.applyClassFlashlightVisuals();
    this.callbacks.onCareerUpdate?.(this.career);
    this.emitHudSnapshot(true);
    return this.career;
  }

  public buyPermanentUpgrade(
    id: PermanentUpgradeId,
  ): { purchased: boolean; career: CareerStats } {
    const res = purchasePermanentUpgrade(this.career, id);
    if (res.purchased) {
      this.career = saveCareerStats(res.career);
      this.sound.playUpgrade();
      this.callbacks.onCareerUpdate?.(this.career);
      this.emitHudSnapshot(true);
    }
    return { purchased: res.purchased, career: this.career };
  }

  private checkCareerSkinUnlocks(): void {
    const newly = evaluateSkinUnlocks(this.career);
    if (newly.length > 0) {
      const skinName = SKIN_SPECS[newly[newly.length - 1]].name;
      this.skinUnlockToast = `SKIN UNLOCKED: ${skinName.toUpperCase()}`;
      this.skinUnlockToastTimer = 3.2;
      this.sound.playUpgrade();
      this.callbacks.onCareerUpdate?.(this.career);
    }
  }

  private getEffectiveDashCooldown(): number {
    const mutMult =
      this.dailyMutator === 'hyper_dash'
        ? DAILY_MUTATOR_SPECS.hyper_dash.dashCooldownMult
        : 1;
    return (
      DASH_COOLDOWN *
      getDashCooldownMultiplier(this.upgradeLevels) *
      getPermanentDashCooldownMultiplier(this.career.permanentUpgrades) *
      CLASS_SPECS[this.career.selectedClass].dashCooldownMult *
      mutMult
    );
  }

  private getEffectiveMoveSpeed(): number {
    return (
      PLAYER_SPEED *
      getMoveSpeedMultiplier(this.upgradeLevels) *
      CLASS_SPECS[this.career.selectedClass].moveSpeedMult
    );
  }

  private getEffectiveReloadDuration(id: WeaponId): number {
    const perkMult = this.hasPerk('extended_drums') ? 0.85 : 1;
    return (
      WEAPON_SPECS[id].reloadDuration *
      getReloadDurationMultiplier(this.upgradeLevels) *
      getPermanentReloadMultiplier(this.career.permanentUpgrades) *
      perkMult
    );
  }

  private getWeaponMagSize(id: WeaponId): number {
    const base = getEffectiveMagSize(id, this.upgradeLevels);
    return this.hasPerk('extended_drums') ? Math.round(base * 1.25) : base;
  }

  private buildCurrentWavePlan(wave: number): WavePlan {
    const rng =
      this.mode === 'daily' && this.dailyDateKey
        ? createSeededRng(`nightfall-daily-${this.dailyDateKey}-wave-${wave}`)
        : Math.random;
    return buildWavePlan(wave, rng, {
      mode: this.mode,
      arena: this.arena,
      mutator: this.dailyMutator,
    });
  }

  private persistCurrentProgress(perkDraftPending = false): void {
    saveRunProgress({
      lastWave: this.wave,
      score: this.score,
      kills: this.kills,
      upgradePoints: this.upgradePoints,
      upgradeLevels: { ...this.upgradeLevels },
      weaponMastery: { ...this.weaponMastery },
      activeWeapon: this.activeWeapon,
      equippedGear: this.equippedGear,
      equippedGadget: this.equippedGadget,
      weapons: this.weapons.map((w) => ({ ...w })),
      hasUsedRevive: this.hasUsedRevive,
      mode: this.mode,
      arena: this.arena,
      ownedPerks: [...this.ownedPerks],
      evolvedWeapons: [...this.evolvedWeapons],
      dailyDateKey: this.dailyDateKey ?? undefined,
      perkDraftPending,
      perkDraftSeedCursor: this.perkDraftSeedCursor,
      activeInterrupted: true,
    });
    this.callbacks.onSavedProgressUpdate?.(loadRunProgress());
  }

  public startNewGame(options?: {
    fromBeginning?: boolean;
    startWaveOverride?: number;
    resumeInterrupted?: boolean;
  }): void {
    this.sound.unlock();
    this.clearEntities();
    this.clearHeldInputs();
    this.uiSimulationPaused = false;

    const fromBeginning = options?.fromBeginning ?? true;
    const resumeInterrupted = options?.resumeInterrupted ?? !fromBeginning;
    const saved = !fromBeginning ? loadRunProgress() : null;
    const startingUpBonus = getPermanentStartingUpBonus(
      this.career.permanentUpgrades,
    );

    this.skinPreviewActive = false;
    this.skinPreviewId = null;
    this.skinUnlockToast = null;
    this.skinUnlockToastTimer = 0;
    this.evolutionBanner = null;
    this.evolutionBannerTimer = 0;
    this.perkDraftChoices = null;
    this.bossesKilledInRun = 0;
    this.lastScrapEarned = 0;
    this.minigunRemaining = 0;
    this.vampiricKillCounter = 0;
    this.supplyDropTimer = 18;

    if (saved) {
      this.wave = options?.startWaveOverride ?? saved.lastWave;
      this.upgradePoints = saved.upgradePoints;
      this.upgradeLevels = { ...saved.upgradeLevels };
      this.weaponMastery = saved.weaponMastery
        ? { ...saved.weaponMastery }
        : createInitialWeaponMastery();
      this.score = saved.score;
      this.kills = saved.kills;
      this.killsTowardNextUp = 0;
      this.hasUsedRevive = Boolean(saved.hasUsedRevive);
      if (saved.equippedGear) {
        this.equippedGear = saved.equippedGear;
      }
      if (saved.equippedGadget) {
        this.equippedGadget = saved.equippedGadget;
      }
      if (saved.arena && saved.arena !== this.arena) {
        this.arena = saved.arena;
      }
      if (saved.mode && saved.mode !== 'survival') {
        this.mode = saved.mode;
      }
      this.ownedPerks = saved.ownedPerks ? [...saved.ownedPerks] : [];
      this.evolvedWeapons = saved.evolvedWeapons
        ? [...saved.evolvedWeapons]
        : [];
      this.perkDraftSeedCursor = saved.perkDraftSeedCursor ?? 0;
      if (this.mode === 'daily') {
        const cfg = getDailyChallengeConfig(saved.dailyDateKey);
        this.dailyDateKey = cfg.dateKey;
        this.dailyMutator = cfg.mutator.id;
        this.dailyMutatorLabel = `${cfg.mutator.name} · ${cfg.mutator.summary}`;
        this.seededRng = createSeededRng(`nightfall-daily-${cfg.dateKey}-sim`);
      } else {
        this.dailyDateKey = null;
        this.dailyMutator = undefined;
        this.dailyMutatorLabel = null;
        this.seededRng = null;
      }
    } else {
      this.wave = options?.startWaveOverride ?? this.initialWave;
      this.upgradePoints = 1 + startingUpBonus;
      this.killsTowardNextUp = 0;
      this.upgradeLevels = createInitialUpgradeLevels();
      this.weaponMastery = createInitialWeaponMastery();
      this.ownedPerks = [];
      this.evolvedWeapons = [];
      this.perkDraftSeedCursor = 0;
      this.score = 0;
      this.kills = 0;
      this.hasUsedRevive = false;
      if (this.mode === 'daily') {
        const cfg = getDailyChallengeConfig();
        this.arena = cfg.arena;
        this.dailyDateKey = cfg.dateKey;
        this.dailyMutator = cfg.mutator.id;
        this.dailyMutatorLabel = `${cfg.mutator.name} · ${cfg.mutator.summary}`;
        this.seededRng = createSeededRng(`nightfall-daily-${cfg.dateKey}-sim`);
      } else {
        this.dailyDateKey = null;
        this.dailyMutator = undefined;
        this.dailyMutatorLabel = null;
        this.seededRng = null;
      }
      clearRunProgress();
      this.callbacks.onSavedProgressUpdate?.(null);
    }

    this.rebuildArena();
    applyPlayerSkin(this.playerRig, this.career.equippedSkinId);
    this.applyClassFlashlightVisuals();

    this.playerX = 0;
    this.playerZ = 0;
    this.playerAimAngle = 0;
    this.playerWalkPhase = 0;
    this.maxHp =
      getMaxHpForLevel(this.upgradeLevels) +
      getPermanentBaseHpBonus(this.career.permanentUpgrades);
    const isResumingInterrupted = Boolean(saved && resumeInterrupted);
    this.hp = isResumingInterrupted
      ? getReviveRestoreHp(this.maxHp)
      : this.maxHp;
    this.ghostHp = this.hp;
    this.isNewHighScore = false;
    this.damageTaken = 0;

    this.weapons = createInitialWeapons();
    if (saved?.weapons) {
      const savedById = new Map(saved.weapons.map((w) => [w.id, w]));
      for (const w of this.weapons) {
        const prev = savedById.get(w.id);
        if (!prev) continue;
        w.unlocked = w.id === 'pistol' ? true : prev.unlocked;
        w.mag = Math.min(this.getWeaponMagSize(w.id), Math.max(0, prev.mag));
        w.reserve = prev.reserve;
      }
    }
    unlockWeaponsForWave(this.weapons, this.wave, (id) =>
      this.getWeaponMagSize(id),
    );
    const preferredWeapon = saved?.activeWeapon ?? 'pistol';
    const isPreferredUnlocked =
      this.weapons.find((w) => w.id === preferredWeapon)?.unlocked ?? false;
    this.activeWeapon = isPreferredUnlocked ? preferredWeapon : 'pistol';
    this.syncPlayerWeaponVisibility();
    this.fireCooldown = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.rapidFireRemaining = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.gearCooldownTimer = 0;
    this.gadgetCooldownTimer = 0;
    this.invulnTimer = isResumingInterrupted ? REVIVE_INVULN_SEC : 0.5;
    this.camRecoilX = 0;
    this.camRecoilZ = 0;
    this.trauma = 0;
    this.hitstopTimer = 0;

    // Class Starting Tactical Perks on fresh runs
    const classSpec = CLASS_SPECS[this.career.selectedClass];
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();
    if (!saved) {
      if (classSpec.startsWithFreeTurret) {
        const turretPos = resolveArenaCollisions(
          1.4,
          -1.2,
          0.55,
          obstacles,
          halfSize,
        );
        const rig = buildDeployableTurretRig(this.shadowTex);
        rig.root.position.set(turretPos.x, 0, turretPos.z);
        this.scene.add(rig.root);
        this.activeTurrets.push({
          rig,
          x: turretPos.x,
          z: turretPos.z,
          life: TACTICAL_GEAR_SPECS.turret.durationSec ?? 14,
          fireTimer: 0.4,
          flashTimer: 0,
        });
      }
      if (classSpec.startsWithBonusMine) {
        const minePos = resolveArenaCollisions(
          -1.3,
          -1.3,
          0.4,
          obstacles,
          halfSize,
        );
        const rig = buildProximityMineMesh(this.shadowTex);
        rig.root.position.set(minePos.x, 0, minePos.z);
        this.scene.add(rig.root);
        this.activeMines.push({
          rig,
          x: minePos.x,
          z: minePos.z,
          armTimer: 0.2,
          life: 45,
        });
      }
    }

    this.wavePlan = this.buildCurrentWavePlan(this.wave);
    this.spawnTimer = 0.2;
    this.wavePauseTimer = 0;
    this.bloodSplatter = 0;
    const startWeather: WeatherKind =
      this.weatherOverride ??
      (this.mode === 'storm' || this.dailyMutator === 'acid_rain'
        ? 'storm'
        : this.mode === 'blackout' || this.dailyMutator === 'blackout_surge'
          ? 'mist'
          : getWeatherForWaveStart(this.wave));
    this.applyWeatherImmediate(startWeather);

    this.waveBanner = isBossWaveNumber(this.wave, this.mode)
      ? `BOSS WAVE ${this.wave} · ${getBossTitle(this.wave)}`
      : isResumingInterrupted
        ? `RESUMED WAVE ${this.wave} · 75% HP`
        : this.mode === 'daily' && this.dailyDateKey
          ? `DAILY SEED ${this.dailyDateKey} · WAVE ${this.wave}`
          : this.wave > 1
            ? `RESUMED WAVE ${this.wave} · SURVIVE THE NIGHT`
            : `WAVE ${this.wave} · SURVIVE THE NIGHT`;
    this.waveBannerTimer = 2.4;
    this.pickupToast = isResumingInterrupted
      ? 'RUN RESTORED · 3S SHIELD'
      : this.dailyMutatorLabel
        ? `MUTATOR · ${DAILY_MUTATOR_SPECS[this.dailyMutator!].name.toUpperCase()}`
        : null;
    this.pickupToastTimer = isResumingInterrupted || this.dailyMutatorLabel ? 2.4 : 0;

    this.playerRig.root.position.set(0, 0, 0);
    this.playerRig.root.rotation.y = 0;
    this.playerRig.root.visible = shouldFlashInvulnMesh(this.invulnTimer);
    updateDiegeticFootArcs(this.playerRig, false, 0, 1);

    const portrait = this.viewportW < 700;
    this.camPos.set(0, portrait ? 23.5 : 19.5, portrait ? 12.2 : 11.2);
    this.camLook.set(0, 0.5, 0);

    this.setPhase('playing');
    if (saved?.perkDraftPending) {
      const draftRng =
        this.mode === 'daily' && this.dailyDateKey
          ? createSeededRng(
              `nightfall-daily-${this.dailyDateKey}-perk-${this.perkDraftSeedCursor}`,
            )
          : Math.random;
      this.perkDraftChoices = rollPerkDraftChoices(this.ownedPerks, draftRng);
      this.uiSimulationPaused = true;
      this.persistCurrentProgress(true);
    } else {
      this.persistCurrentProgress(false);
    }
    this.emitHudSnapshot(true);
  }

  public triggerRevive(): void {
    if (this.phase !== 'revive' || this.hasUsedRevive) return;
    this.sound.unlock();
    this.hasUsedRevive = true;
    this.hp = getReviveRestoreHp(this.maxHp);
    this.ghostHp = this.hp;
    this.isReloading = false;
    this.reloadTimer = 0;

    const activeState = this.getActiveWeaponState();
    activeState.mag = this.getWeaponMagSize(activeState.id);

    this.invulnTimer = REVIVE_INVULN_SEC;
    this.playerRig.root.visible = shouldFlashInvulnMesh(this.invulnTimer);
    this.bloodSplatter = 0;

    const classSpec = CLASS_SPECS[this.career.selectedClass];
    const shockRadius =
      REVIVE_SHOCKWAVE_RADIUS * classSpec.reviveShockwaveRadiusMult;
    const reviveColor =
      SKIN_SPECS[this.career.equippedSkinId]?.reviveColor ?? 0x38bdf8;

    hapticReviveShockwave();
    this.sound.playRevive();
    this.trauma = Math.min(1.0, this.trauma + 0.55);
    this.spawnFlashRing(this.playerX, this.playerZ, shockRadius, reviveColor, 0.46);
    this.spawnBurstParticles(
      this.playerX,
      0.9,
      this.playerZ,
      28,
      reviveColor,
      9.5,
    );

    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.dying) continue;
      const dx = z.x - this.playerX;
      const dz = z.z - this.playerZ;
      const dist = Math.hypot(dx, dz) || 0.001;
      const push = computeReviveShockwavePush(
        this.playerX,
        this.playerZ,
        z.x,
        z.z,
        z.radius,
      );
      if (!push.inRange && dist > shockRadius + z.radius) continue;
      const dirX = push.inRange ? push.dirX : dx / dist;
      const dirZ = push.inRange ? push.dirZ : dz / dist;
      const pushForce =
        (push.inRange ? push.pushForce : 14) * classSpec.reviveShockwavePushMult;
      const resist =
        z.kind === 'boss' ? 0.35 : z.kind === 'breacher' ? 0.65 : 1.0;
      z.knockVx += dirX * pushForce * resist;
      z.knockVz += dirZ * pushForce * resist;
      z.stunTimer = Math.max(z.stunTimer, z.kind === 'boss' ? 0.9 : 1.5);
      z.isWindingUp = false;
      z.chargePending = false;
      if (z.rig.telegraphRing) z.rig.telegraphRing.visible = false;
      if (z.rig.telegraphLine) z.rig.telegraphLine.visible = false;
    }

    for (let i = 0; i < this.acidPuddles.length; i++) {
      const puddle = this.acidPuddles[i];
      if (!puddle.active) continue;
      if (
        isAcidPoolClearedByRevive(
          this.playerX,
          this.playerZ,
          puddle.x,
          puddle.z,
          1.85,
        )
      ) {
        puddle.active = false;
      }
    }
    for (let i = this.acidProjectiles.length - 1; i >= 0; i--) {
      const ap = this.acidProjectiles[i];
      if (
        Math.hypot(
          ap.mesh.position.x - this.playerX,
          ap.mesh.position.z - this.playerZ,
        ) <= shockRadius
      ) {
        this.scene.remove(ap.mesh);
        this.acidProjectiles.splice(i, 1);
      }
    }
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i];
      if (
        Math.hypot(bp.x - this.playerX, bp.z - this.playerZ) <= shockRadius
      ) {
        this.scene.remove(bp.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }

    this.pickupToast = 'SECOND CHANCE · 75% HP';
    this.pickupToastTimer = 2.0;
    this.clearHeldInputs();
    this.persistCurrentProgress();
    this.setPhase('playing');
    this.emitHudSnapshot(true);
  }

  public confirmEndRun(): void {
    if (this.phase !== 'revive') return;
    this.finalizeGameOver();
    this.emitHudSnapshot(true);
  }

  private finalizeGameOver(): void {
    this.uiSimulationPaused = false;
    this.perkDraftChoices = null;
    this.sound.setBossIntensity(false);
    const prevBest = this.highScore;
    this.highScore = saveHighScore(this.score);
    if (this.highScore > prevBest && this.score >= this.highScore) {
      this.isNewHighScore = true;
    }

    const scrapReward = computeRunScrapReward({
      wave: this.wave,
      kills: this.kills,
      bossesKilledInRun: this.bossesKilledInRun,
      rewardMultiplier: GAME_MODE_SPECS[this.mode].rewardMultiplier,
    });
    this.lastScrapEarned = scrapReward;
    this.career.bestWave = Math.max(this.career.bestWave, this.wave);
    this.career.bestScore = Math.max(this.career.bestScore, Math.round(this.score));
    this.career.scrap += scrapReward;
    this.checkCareerSkinUnlocks();
    this.career = saveCareerStats(this.career);
    this.callbacks.onCareerUpdate?.(this.career);

    clearRunProgress();
    this.callbacks.onSavedProgressUpdate?.(null);
    this.sound.playGameOver();
    this.clearHeldInputs();
    this.playerRig.root.visible = true;
    this.setPhase('gameover');
  }

  public pauseGame(): void {
    if (this.phase !== 'playing') return;
    this.uiSimulationPaused = false;
    this.clearHeldInputs();
    this.persistCurrentProgress(Boolean(this.perkDraftChoices));
    this.setPhase('paused');
    this.emitHudSnapshot(true);
  }

  public resumeGame(): void {
    if (this.phase !== 'paused') return;
    this.clearHeldInputs();
    this.setPhase('playing');
    this.emitHudSnapshot(true);
  }

  public returnToTitle(): void {
    this.uiSimulationPaused = false;
    this.sound.setBossIntensity(false);
    if (
      this.phase === 'playing' ||
      this.phase === 'paused' ||
      this.phase === 'revive'
    ) {
      this.persistCurrentProgress(Boolean(this.perkDraftChoices));
    }
    this.perkDraftChoices = null;
    this.evolutionBanner = null;
    this.evolutionBannerTimer = 0;
    this.clearEntities();
    this.clearHeldInputs();
    this.bloodSplatter = 0;
    this.playerX = 0;
    this.playerZ = 0;
    this.playerAimAngle = 0;
    this.playerRig.root.position.set(0, 0, 0);
    this.playerRig.root.rotation.y = 0;
    this.playerRig.root.visible = true;
    updateDiegeticFootArcs(this.playerRig, false, 0, 1);
    applyPlayerSkin(this.playerRig, this.career.equippedSkinId);
    this.rebuildArena();
    this.applyWeatherImmediate(
      this.mode === 'storm' ? 'storm' : (this.weatherOverride ?? 'clear'),
    );
    this.setPhase('title');
    this.emitHudSnapshot(true);
  }

  public toggleMute(): void {
    this.sound.unlock();
    this.sound.toggleMute();
    this.emitHudSnapshot(true);
  }

  private setPhase(next: GamePhase): void {
    this.phase = next;
    document.body.dataset.state = next;
  }

  private clearEntities(): void {
    for (const z of this.zombies) {
      this.scene.remove(z.rig.root);
    }
    this.zombies = [];
    for (const p of this.pickups) {
      this.scene.remove(p.mesh);
    }
    this.pickups = [];
    for (const proj of this.bossProjectiles) {
      this.scene.remove(proj.mesh);
    }
    this.bossProjectiles = [];
    for (const ap of this.acidProjectiles) {
      this.scene.remove(ap.mesh);
    }
    this.acidProjectiles = [];
    for (let i = 0; i < this.acidPuddles.length; i++) {
      this.acidPuddles[i].active = false;
      _mat4.makeScale(0, 0, 0);
      this.acidPoolDiscMesh.setMatrixAt(i, _mat4);
      this.acidPoolRimMesh.setMatrixAt(i, _mat4);
    }
    this.acidPoolDiscMesh.instanceMatrix.needsUpdate = true;
    this.acidPoolRimMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < MAX_ACID_IMPACT_RINGS; i++) {
      _mat4.makeScale(0, 0, 0);
      this.acidImpactRingMesh.setMatrixAt(i, _mat4);
    }
    this.acidImpactRingMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.tracers.length; i++) {
      this.tracers[i].active = false;
      _mat4.makeScale(0, 0, 0);
      this.tracerMesh.setMatrixAt(i, _mat4);
    }
    this.tracerMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.casings.length; i++) {
      this.casings[i].active = false;
      _mat4.makeScale(0, 0, 0);
      this.casingMesh.setMatrixAt(i, _mat4);
    }
    this.casingMesh.instanceMatrix.needsUpdate = true;

    for (const mine of this.activeMines) {
      this.scene.remove(mine.rig.root);
    }
    this.activeMines = [];
    for (const turret of this.activeTurrets) {
      this.scene.remove(turret.rig.root);
    }
    this.activeTurrets = [];
    for (const tm of this.activeTripmines) {
      this.scene.remove(tm.root);
    }
    this.activeTripmines = [];
    for (const dec of this.activeDecoys) {
      this.scene.remove(dec.root);
    }
    this.activeDecoys = [];
    for (const wire of this.activeWires) {
      this.scene.remove(wire.root);
    }
    this.activeWires = [];
    for (const m of this.activeMortars) {
      this.scene.remove(m.group);
    }
    this.activeMortars = [];
    if (this.supplyCrate) {
      this.scene.remove(this.supplyCrate.mesh);
      this.supplyCrate = null;
    }
    for (const ring of this.flashRings) {
      this.scene.remove(ring.mesh);
    }
    this.flashRings = [];
    for (const d of this.decals) {
      d.active = false;
      d.mesh.visible = false;
    }
    this.floatingDamages = [];
    this.callbacks.onFloatingDamageUpdate([]);
  }

  private syncPlayerWeaponVisibility(): void {
    for (const id of WEAPON_ORDER) {
      this.playerRig.weaponModels[id].visible = id === this.activeWeapon;
    }
  }

  private getActiveWeaponState(): WeaponRuntimeState {
    return (
      this.weapons.find((w) => w.id === this.activeWeapon) ?? this.weapons[0]
    );
  }

  private updateSize(): void {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    this.viewportW = w;
    this.viewportH = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.applyGraphicsSettings();
    this.renderer.setSize(w, h, false);
  }

  // --- Main Loop & Software WebGL Pacing ---

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick());
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(): void {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    // FPS tracking
    this.fpsFrameCount += 1;
    this.fpsElapsed += Math.max(0.001, rawDt);
    if (this.fpsElapsed >= 0.45) {
      this.currentFps = Math.min(
        240,
        Math.max(1, Math.round(this.fpsFrameCount / this.fpsElapsed)),
      );
      this.fpsFrameCount = 0;
      this.fpsElapsed = 0;
    }

    if (this.skinUnlockToastTimer > 0) {
      this.skinUnlockToastTimer -= dt;
      if (this.skinUnlockToastTimer <= 0) this.skinUnlockToast = null;
    }

    this.updateVisualEffects(dt);

    // Dynamic music boss intensity check
    let bossAlive = false;
    if (this.phase === 'playing') {
      for (let i = 0; i < this.zombies.length; i++) {
        if (!this.zombies[i].dying && this.zombies[i].kind === 'boss') {
          bossAlive = true;
          break;
        }
      }
    }
    this.sound.setBossIntensity(bossAlive);
    this.sound.updateDynamicMusic(
      dt,
      this.phase === 'playing' && !this.uiSimulationPaused,
    );

    if (this.phase === 'title') {
      this.updateTitleCamera(dt);
    } else if (this.phase === 'playing') {
      if (!this.uiSimulationPaused) {
        if (this.hitstopTimer > 0) {
          this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        } else {
          this.updatePlaying(dt);
        }
      }
      this.updateGameplayCamera(dt);
      this.updateFloatingDamage(dt);
    }

    this.renderer.render(this.scene, this.camera);

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.095 || this.lastEmittedPhase !== this.phase) {
      this.hudEmitTimer = 0;
      this.emitHudSnapshot(false);
    }

    this.scheduleNextFrame();
  }

  private updateTitleCamera(dt: number): void {
    if (this.skinPreviewActive) {
      this.skinPreviewRotation += dt * 0.82;
      this.playerRig.root.position.set(0, 0, 0);
      this.playerRig.root.rotation.y = this.skinPreviewRotation;
      this.playerRig.root.visible = true;
      const portrait = this.viewportW < 700;
      this.camera.position.set(0, portrait ? 2.35 : 1.9, portrait ? 5.9 : 4.2);
      this.camera.lookAt(0, portrait ? 0.05 : -0.35, 0);
      this.laserBeam.visible = false;
      this.laserDot.visible = false;
      return;
    }
    this.titleOrbitAngle += dt * 0.16;
    const radius = 14.2;
    this.camera.position.set(
      Math.cos(this.titleOrbitAngle) * radius,
      10.2,
      Math.sin(this.titleOrbitAngle) * radius,
    );
    this.camera.lookAt(0, 0.8, 0);
    this.laserBeam.visible = false;
    this.laserDot.visible = false;
  }

  private updatePlaying(dt: number): void {
    // Timers
    if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }
    if (this.gearCooldownTimer > 0) {
      this.gearCooldownTimer = Math.max(0, this.gearCooldownTimer - dt);
    }
    if (this.gadgetCooldownTimer > 0) {
      this.gadgetCooldownTimer = Math.max(0, this.gadgetCooldownTimer - dt);
    }
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.rapidFireRemaining > 0) {
      this.rapidFireRemaining = Math.max(0, this.rapidFireRemaining - dt);
    }
    if (this.minigunRemaining > 0) {
      this.minigunRemaining = Math.max(0, this.minigunRemaining - dt);
    }
    if (this.bloodSplatter > 0) {
      this.bloodSplatter = Math.max(0, this.bloodSplatter - dt * 0.72);
    }
    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer -= dt;
      if (this.waveBannerTimer <= 0) this.waveBanner = null;
    }
    if (this.pickupToastTimer > 0) {
      this.pickupToastTimer -= dt;
      if (this.pickupToastTimer <= 0) this.pickupToast = null;
    }
    if (this.evolutionBannerTimer > 0) {
      this.evolutionBannerTimer -= dt;
      if (this.evolutionBannerTimer <= 0) this.evolutionBanner = null;
    }

    // Dynamic Weather Progression
    const forcedWeather =
      this.weatherOverride ??
      (this.mode === 'storm' || this.dailyMutator === 'acid_rain'
        ? 'storm'
        : null);
    if (!forcedWeather) {
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.setWeatherKind(getNextWeatherKind(this.weatherKind, this.wave));
      }
    }

    // Delayed ghost health bar
    if (this.ghostHp > this.hp) {
      this.ghostHp = Math.max(this.hp, this.ghostHp - 28 * dt);
    } else {
      this.ghostHp = this.hp;
    }

    // Reload progress
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.reloadTimer = 0;
        const state = this.getActiveWeaponState();
        completeReload(state, this.getWeaponMagSize(state.id));
        this.sound.playReloadComplete();
        this.emitHudSnapshot(true);
      }
    }

    // Player Movement (Dash or Stick/WASD)
    let moveMag = 0;
    const moveSpeed = this.getEffectiveMoveSpeed();
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.playerX += this.dashDirX * DASH_SPEED * dt;
      this.playerZ += this.dashDirZ * DASH_SPEED * dt;
      moveMag = 1;
    } else {
      const move = this.getDesiredMoveVector();
      moveMag = move.len;
      this.playerX += move.x * moveSpeed * move.len * dt;
      this.playerZ += move.z * moveSpeed * move.len * dt;
    }

    const resolved = resolveArenaCollisions(
      this.playerX,
      this.playerZ,
      PLAYER_RADIUS,
      this.getObstacles(),
      this.getHalfSize(),
    );
    this.playerX = resolved.x;
    this.playerZ = resolved.z;

    // Player Aiming (Right Stick > Mouse > Auto-Fire > Movement direction)
    let wantsToFire = false;
    if (this.aimStickActive) {
      const len = Math.hypot(this.aimStickX, this.aimStickY);
      if (len > 0.14) {
        // Local -Z is angle 0, so atan2(-dx, -dy) rotates toward (dx, dy)
        this.playerAimAngle = Math.atan2(-this.aimStickX, -this.aimStickY);
        wantsToFire = len > 0.25;
      }
    } else if (this.hasMouseAim) {
      this.updateMouseAim();
      wantsToFire = this.mouseDown;
    } else if (this.settings.autoFire) {
      const autoTarget = this.findAutoFireTarget();
      if (autoTarget) {
        const tdx = autoTarget.x - this.playerX;
        const tdz = autoTarget.z - this.playerZ;
        this.playerAimAngle = Math.atan2(-tdx, -tdz);
        wantsToFire = true;
      } else if (moveMag > 0.2) {
        const move = this.getDesiredMoveVector();
        this.playerAimAngle = Math.atan2(-move.x, -move.z);
      }
    } else if (moveMag > 0.2) {
      const move = this.getDesiredMoveVector();
      this.playerAimAngle = Math.atan2(-move.x, -move.z);
    }

    if (this.mouseDown && !this.aimStickActive) {
      wantsToFire = true;
    }

    // Animate player legs & recoil
    if (moveMag > 0.05) {
      this.playerWalkPhase += dt * 13 * moveMag;
      const swing = Math.sin(this.playerWalkPhase) * 0.45;
      this.playerRig.leftLeg.rotation.x = swing;
      this.playerRig.rightLeg.rotation.x = -swing;
    } else {
      this.playerRig.leftLeg.rotation.x = THREE.MathUtils.damp(
        this.playerRig.leftLeg.rotation.x,
        0,
        12,
        dt,
      );
      this.playerRig.rightLeg.rotation.x = THREE.MathUtils.damp(
        this.playerRig.rightLeg.rotation.x,
        0,
        12,
        dt,
      );
    }

    this.recoilOffset = THREE.MathUtils.damp(this.recoilOffset, 0, 18, dt);
    this.playerRig.bodyGroup.position.z = this.recoilOffset;
    this.playerRig.root.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.root.rotation.y = this.playerAimAngle;
    this.playerRig.root.visible =
      this.invulnTimer > 0 ? shouldFlashInvulnMesh(this.invulnTimer) : true;

    // Slim circular diegetic reload & dash cooldown arc around survivor's feet
    const reloadDur = this.getEffectiveReloadDuration(this.activeWeapon);
    const reloadProg = this.isReloading
      ? 1 - Math.max(0, this.reloadTimer / reloadDur)
      : 0;
    const dashCd = this.getEffectiveDashCooldown();
    const dashProg =
      this.dashCooldownTimer > 0
        ? 1 - Math.min(1, this.dashCooldownTimer / dashCd)
        : 1;
    updateDiegeticFootArcs(this.playerRig, this.isReloading, reloadProg, dashProg);

    // Update visible red laser sight
    this.updateLaserSight();

    // Firing
    if (
      wantsToFire &&
      (this.minigunRemaining > 0 || !this.isReloading) &&
      this.fireCooldown <= 0
    ) {
      this.tryFireWeapon();
    }

    // Wave spawning & progression
    this.updateWaveSpawning(dt);

    // Update Zombies
    this.updateZombies(dt);

    // Update Tactical Gear (Mines, Turrets, Flashbang rings)
    this.updateTacticalGear(dt);

    // Update Boss Plasma Projectiles & Acid Spitter Hazards
    this.updateBossProjectiles(dt);
    this.updateAcidHazards(dt);

    // Update Pickups
    this.updatePickups(dt);
  }

  private getDesiredMoveVector(): { x: number; z: number; len: number } {
    let kx = 0;
    let kz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kz += 1;

    const kLen = Math.hypot(kx, kz);
    if (kLen > 0) {
      return { x: kx / kLen, z: kz / kLen, len: 1 };
    }

    const sLen = Math.hypot(this.moveStickX, this.moveStickY);
    if (sLen > 0.08) {
      const clamped = Math.min(1, sLen);
      return {
        x: this.moveStickX / sLen,
        z: this.moveStickY / sLen,
        len: clamped,
      };
    }
    return { x: 0, z: 0, len: 0 };
  }

  private findAutoFireTarget(): ActiveZombie | null {
    const maxRange = WEAPON_SPECS[this.activeWeapon].range;
    const maxDistSq = maxRange * maxRange;
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();
    let best: ActiveZombie | null = null;
    let bestDistSq = maxDistSq;
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.dying) continue;
      const dx = z.x - this.playerX;
      const dz = z.z - this.playerZ;
      const dSq = dx * dx + dz * dz;
      if (dSq >= bestDistSq) continue;
      const d = Math.sqrt(dSq) || 1;
      const wallDist = raycastObstaclesAndWalls(
        this.playerX,
        this.playerZ,
        dx / d,
        dz / d,
        d,
        obstacles,
        halfSize,
      );
      if (wallDist >= d - z.radius * 0.5) {
        bestDistSq = dSq;
        best = z;
      }
    }
    return best;
  }

  private updateMouseAim(): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    _ndc.set(
      ((this.mouseClientX - rect.left) / rect.width) * 2 - 1,
      -((this.mouseClientY - rect.top) / rect.height) * 2 + 1,
    );
    _raycaster.setFromCamera(_ndc, this.camera);
    if (_raycaster.ray.intersectPlane(_aimPlane, _vec3A)) {
      const dx = _vec3A.x - this.playerX;
      const dz = _vec3A.z - this.playerZ;
      if (dx * dx + dz * dz > 0.04) {
        this.playerAimAngle = Math.atan2(-dx, -dz);
      }
    }
  }

  private updateLaserSight(): void {
    this.playerRig.root.updateMatrixWorld(true);
    this.playerRig.muzzlePoint.getWorldPosition(_vec3A);
    this.cachedMuzzleX = _vec3A.x;
    this.cachedMuzzleZ = _vec3A.z;
    const dirX = -Math.sin(this.playerAimAngle);
    const dirZ = -Math.cos(this.playerAimAngle);
    const maxRange = WEAPON_SPECS[this.activeWeapon].range;

    let dist = raycastObstaclesAndWalls(
      _vec3A.x,
      _vec3A.z,
      dirX,
      dirZ,
      maxRange,
      this.getObstacles(),
      this.getHalfSize(),
    );

    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.dying) continue;
      const hitD = raycastCircleDistance(
        _vec3A.x,
        _vec3A.z,
        dirX,
        dirZ,
        dist,
        z.x,
        z.z,
        z.radius,
      );
      if (hitD !== null && hitD < dist) {
        dist = hitD;
      }
    }

    this.laserBeam.visible = true;
    this.laserBeam.position.set(_vec3A.x, 0.94, _vec3A.z);
    this.laserBeam.rotation.y = this.playerAimAngle;
    this.laserBeam.scale.set(1, 1, Math.max(0.2, dist));

    this.laserDot.visible = true;
    this.laserDot.position.set(
      _vec3A.x + dirX * dist,
      0.94,
      _vec3A.z + dirZ * dist,
    );
  }

  private detonateBarrel(b: ActiveBarrel): void {
    if (!b.active) return;
    b.active = false;
    b.respawnTimer = 28;
    b.rig.root.visible = false;

    const blastR = 6.2;
    this.sound.playBarrelExplosion();
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.02);
    this.trauma = Math.min(1.0, this.trauma + 0.65);
    this.spawnFlashRing(b.x, b.z, blastR, 0xf97316, 0.34);
    this.spawnBurstParticles(b.x, 0.65, b.z, 28, 0xfbbf24, 9.5);

    const dmg = Math.round(360 * getDamageMultiplier(this.upgradeLevels));
    for (let j = this.zombies.length - 1; j >= 0; j--) {
      const z = this.zombies[j];
      if (z.dying) continue;
      const dx = z.x - b.x;
      const dz = z.z - b.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      if (dist <= blastR + z.radius) {
        const falloff = Math.max(0.5, 1 - (dist / (blastR + 1)) * 0.5);
        z.burnTimer = Math.max(z.burnTimer, 2.5);
        z.burnDps = Math.max(z.burnDps, 24);
        if (this.hasPerk('shockwave_coil')) {
          z.stunTimer = Math.max(z.stunTimer, z.kind === 'boss' ? 0.5 : 1.0);
        }
        this.damageZombie(
          z,
          Math.round(dmg * falloff),
          true,
          dx / dist,
          dz / dist,
          10.5,
          true,
        );
      }
    }
  }

  private triggerChainLightning(
    originZombie: ActiveZombie,
    baseDmg: number,
    maxJumps: number,
    colorHex: number,
  ): void {
    let curr = originZombie;
    const hitIds = new Set<number>([curr.id]);
    for (let jump = 0; jump < maxJumps; jump++) {
      let nearest: ActiveZombie | null = null;
      let bestDistSq = 6.5 * 6.5;
      for (let i = 0; i < this.zombies.length; i++) {
        const z = this.zombies[i];
        if (z.dying || hitIds.has(z.id)) continue;
        const dx = z.x - curr.x;
        const dz = z.z - curr.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          nearest = z;
        }
      }
      if (!nearest) break;
      hitIds.add(nearest.id);
      const dx = nearest.x - curr.x;
      const dz = nearest.z - curr.z;
      const dist = Math.sqrt(bestDistSq) || 0.1;
      const arcAngle = Math.atan2(-dx, -dz);
      this.spawnTracer(curr.x, 1.0, curr.z, arcAngle, dist, colorHex);
      this.sound.playTeslaArc();
      const arcDmg = Math.max(6, Math.round(baseDmg * 0.6));
      this.damageZombie(nearest, arcDmg, false, dx / dist, dz / dist, 1.2, true);
      curr = nearest;
    }
  }

  private tryFireWeapon(): void {
    const isMinigun = this.minigunRemaining > 0;
    const state = this.getActiveWeaponState();
    const spec = WEAPON_SPECS[state.id];
    const magSize = this.getWeaponMagSize(state.id);

    if (!isMinigun && !canFireWeapon(state)) {
      if (canStartReload(state, magSize)) {
        this.triggerReload();
      } else {
        this.fireCooldown = 0.25;
        this.sound.playEmptyClick();
        if (state.id !== 'pistol' && state.reserve <= 0) {
          this.selectWeapon('pistol');
        }
      }
      return;
    }

    if (!isMinigun) {
      consumeAmmoOnFire(state);
    }

    const isDragonsBreath =
      !isMinigun &&
      state.id === 'shotgun' &&
      this.hasEvolution('dragons_breath');
    const isRailSmg =
      !isMinigun && state.id === 'smg' && this.hasEvolution('rail_smg');

    this.fireCooldown = isMinigun
      ? 0.075
      : getEffectiveFireInterval(state.id, this.rapidFireRemaining) *
        getFireRateMultiplier(this.upgradeLevels);
    this.recoilOffset = Math.min(0.18, this.recoilOffset + 0.085);
    const shake = isMinigun ? 0.08 : spec.screenShake;
    this.trauma = Math.min(0.85, this.trauma + shake);

    const kickMag = Math.min(0.55, shake * 1.15);
    this.camRecoilX = THREE.MathUtils.clamp(
      this.camRecoilX + Math.sin(this.playerAimAngle) * kickMag,
      -0.65,
      0.65,
    );
    this.camRecoilZ = THREE.MathUtils.clamp(
      this.camRecoilZ + Math.cos(this.playerAimAngle) * kickMag,
      -0.65,
      0.65,
    );

    if (!isMinigun && (state.id === 'shotgun' || state.id === 'autoshotgun')) {
      hapticShotgunBlast();
    }

    // Muzzle flash
    this.muzzleFlashTimer = 0.055;
    this.playerRig.muzzleFlash.visible = true;
    this.playerRig.muzzleFlash.rotation.z = Math.random() * Math.PI;
    if (this.playerRig.flashLight) {
      this.playerRig.flashLight.intensity = 10;
    }

    this.sound.playShoot(isMinigun ? 'lmg' : state.id);

    const muzzleX = this.cachedMuzzleX;
    const muzzleZ = this.cachedMuzzleZ;
    this.spawnShellCasing(muzzleX, muzzleZ, this.playerAimAngle);

    const masteryMult = isMinigun
      ? 1
      : getWeaponMasteryDamageMult(this.weaponMastery[state.id] ?? 0);
    const damageMult = getDamageMultiplier(this.upgradeLevels) * masteryMult;
    const pellets = isMinigun ? 1 : isDragonsBreath ? 10 : spec.pellets;
    const spreadRad = isMinigun ? 0.09 : isDragonsBreath ? 0.34 : spec.spreadRad;
    const range = isMinigun ? 24 : spec.range;
    const baseDamage = isMinigun
      ? 36
      : isDragonsBreath
        ? Math.round(spec.damage * 1.28)
        : isRailSmg
          ? Math.round(spec.damage * 1.4)
          : spec.damage;
    const tracerColor = isMinigun
      ? 0xfbbf24
      : isDragonsBreath
        ? 0xf97316
        : isRailSmg
          ? 0x22d3ee
          : spec.tracerColor;

    let pierceLimit = isMinigun
      ? 1
      : isRailSmg
        ? 3
        : (spec.pierceCount ?? 1);
    if (this.hasPerk('piercing_core') && pierceLimit === 1) {
      pierceLimit = 2;
    }

    const armorBypass = (!isMinigun && state.id === 'railgun') || isRailSmg;
    const critChance = 0.16 + (this.hasPerk('critical_optics') ? 0.14 : 0);
    const critMult = this.hasPerk('critical_optics') ? 2.1 : 1.5;
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();

    let killedAny = false;
    for (let p = 0; p < pellets; p++) {
      const spread = (Math.random() * 2 - 1) * spreadRad;
      const angle = this.playerAimAngle + spread;
      const dirX = -Math.sin(angle);
      const dirZ = -Math.cos(angle);

      const wallDist = raycastObstaclesAndWalls(
        muzzleX,
        muzzleZ,
        dirX,
        dirZ,
        range,
        obstacles,
        halfSize,
      );

      // Check explosive barrels along shot ray
      let hitBarrel: ActiveBarrel | null = null;
      let hitBarrelDist = wallDist;
      for (let b = 0; b < this.barrels.length; b++) {
        const barrel = this.barrels[b];
        if (!barrel.active) continue;
        const bd = raycastCircleDistance(
          muzzleX,
          muzzleZ,
          dirX,
          dirZ,
          hitBarrelDist,
          barrel.x,
          barrel.z,
          0.56,
        );
        if (bd !== null && bd < hitBarrelDist) {
          hitBarrelDist = bd;
          hitBarrel = barrel;
        }
      }

      const hits: Array<{ z: ActiveZombie; dist: number }> = [];
      for (let i = 0; i < this.zombies.length; i++) {
        const z = this.zombies[i];
        if (z.dying) continue;
        const d = raycastCircleDistance(
          muzzleX,
          muzzleZ,
          dirX,
          dirZ,
          hitBarrelDist,
          z.x,
          z.z,
          z.radius * 1.08,
        );
        if (d !== null && d < hitBarrelDist) {
          hits.push({ z, dist: d });
        }
      }

      if (hitBarrel && (hits.length === 0 || hitBarrelDist < hits[0].dist)) {
        this.spawnTracer(
          muzzleX,
          0.94,
          muzzleZ,
          angle,
          hitBarrelDist,
          tracerColor,
        );
        this.detonateBarrel(hitBarrel);
        continue;
      }

      hits.sort((a, b) => a.dist - b.dist);
      const targets = hits.slice(0, pierceLimit);
      const tracerDist =
        targets.length > 0 && pierceLimit === 1
          ? targets[0].dist
          : targets.length >= pierceLimit
            ? targets[targets.length - 1].dist
            : wallDist;

      const endX = muzzleX + dirX * tracerDist;
      const endZ = muzzleZ + dirZ * tracerDist;
      this.spawnTracer(muzzleX, 0.94, muzzleZ, angle, tracerDist, tracerColor);

      if (targets.length > 0) {
        for (const hit of targets) {
          const hitX = muzzleX + dirX * hit.dist;
          const hitZ = muzzleZ + dirZ * hit.dist;
          const isCrit = Math.random() < critChance;
          const dmg = Math.round(baseDamage * damageMult * (isCrit ? critMult : 1));

          if (this.hasPerk('cryo_rounds')) {
            hit.z.cryoTimer = Math.max(hit.z.cryoTimer, 2.8);
          }
          if (isDragonsBreath || this.hasPerk('incendiary')) {
            hit.z.burnTimer = Math.max(
              hit.z.burnTimer,
              isDragonsBreath ? 2.8 : 2.5,
            );
            hit.z.burnDps = Math.max(
              hit.z.burnDps,
              Math.round(dmg * (isDragonsBreath ? 0.28 : 0.18)),
            );
          }

          const killed = this.damageZombie(
            hit.z,
            dmg,
            isCrit,
            dirX,
            dirZ,
            isMinigun ? 2.8 : spec.knockback,
            armorBypass,
          );
          if (killed) killedAny = true;

          if (!hit.z.dying && this.hasPerk('storm_conductor')) {
            const isWet =
              this.weatherKind === 'rain' ||
              this.weatherKind === 'storm' ||
              this.mode === 'storm';
            if (Math.random() < (isWet ? 0.45 : 0.22)) {
              this.triggerChainLightning(hit.z, dmg, 1, 0x60a5fa);
            }
          }

          this.spawnDirectionalBloodBurst(
            hitX,
            0.95,
            hitZ,
            dirX,
            dirZ,
            isCrit ? 10 : 6,
            isCrit ? 7.2 : 5.6,
            true,
          );
          if (
            isCrit ||
            killed ||
            isDragonsBreath ||
            isRailSmg ||
            state.id === 'shotgun' ||
            state.id === 'autoshotgun' ||
            state.id === 'sniper' ||
            state.id === 'railgun'
          ) {
            this.spawnDirectionalBloodStreak(
              hit.z.x + dirX * (hit.z.radius + 0.45),
              hit.z.z + dirZ * (hit.z.radius + 0.45),
              angle,
              killed ? 1.45 : isCrit ? 1.25 : 0.9,
            );
          }
        }
      } else if (wallDist < range - 0.1) {
        this.spawnBurstParticles(endX, 0.85, endZ, 4, 0xfbbf24, 4.0);
      }
    }

    if (
      killedAny &&
      !isMinigun &&
      (state.id === 'shotgun' ||
        state.id === 'autoshotgun' ||
        state.id === 'sniper' ||
        state.id === 'railgun')
    ) {
      this.hitstopTimer = 0.025;
    }

    // Auto reload if magazine hits 0 and reserve allows
    if (!isMinigun && state.mag === 0 && canStartReload(state, magSize)) {
      this.triggerReload();
    }

    this.emitHudSnapshot(true);
  }

  private damageZombie(
    z: ActiveZombie,
    amount: number,
    isCrit: boolean,
    dirX: number,
    dirZ: number,
    knockback: number,
    armorBypass = false,
  ): boolean {
    if (z.dying) return false;
    const facingX = -Math.sin(z.facingYaw);
    const facingZ = -Math.cos(z.facingYaw);
    const masteryMult = getBestiaryMasteryMultiplier(
      z.kind,
      this.career.killsByEnemyType,
    );
    let { finalDamage, blockedByArmor } = computeZombieHitDamage(
      Math.round(amount * masteryMult),
      z.kind,
      dirX,
      dirZ,
      facingX,
      facingZ,
      armorBypass,
    );

    if (blockedByArmor && this.hasPerk('piercing_core')) {
      finalDamage = Math.round(finalDamage * 1.12);
    }

    // Floodlight Generators weaken Shadow Stalkers inside light cone
    if (z.kind === 'stalker') {
      for (let g = 0; g < this.generators.length; g++) {
        const gen = this.generators[g];
        if (
          gen.powered &&
          Math.hypot(z.x - gen.x, z.z - gen.z) <= 12.5
        ) {
          finalDamage = Math.round(finalDamage * 1.25);
          break;
        }
      }
    }

    const hitRear = dirX * facingX + dirZ * facingZ > 0.25;
    const isWeakpoint =
      z.kind === 'boss' && !blockedByArmor && (hitRear || isCrit);
    if (isWeakpoint) {
      finalDamage = Math.round(finalDamage * 1.35);
    }

    z.hp -= finalDamage;
    z.hitFlashTimer = 0.065;
    z.revealTimer = Math.max(z.revealTimer, 0.85);
    const kbForce = knockback * (1 - z.knockbackResist) * (blockedByArmor ? 0.45 : 1);
    z.knockVx += dirX * kbForce;
    z.knockVz += dirZ * kbForce;

    if (blockedByArmor) {
      this.sound.playArmorClang();
      this.spawnBurstParticles(
        z.x + facingX * 0.68,
        1.05,
        z.z + facingZ * 0.68,
        6,
        0x7dd3fc,
        5.0,
      );
    }

    this.floatingDamages.push({
      id: this.nextEntityId++,
      wx: z.x + (Math.random() - 0.5) * 0.4,
      wy:
        z.kind === 'boss'
          ? 2.8
          : z.kind === 'brute' || z.kind === 'breacher'
            ? 2.1
            : 1.55,
      wz: z.z,
      amount: finalDamage,
      isCrit: isCrit && !blockedByArmor && !isWeakpoint,
      isWeakpoint,
      blockedByArmor,
      age: 0,
      duration: 0.65,
    });

    if (z.hp <= 0) {
      z.dying = true;
      z.deathTimer = z.kind === 'boss' ? 0.55 : 0.35;
      z.rig.hpBarGroup.visible = false;
      if (z.rig.telegraphRing) {
        z.rig.telegraphRing.visible = false;
      }
      if (z.rig.telegraphLine) {
        z.rig.telegraphLine.visible = false;
      }
      this.kills += 1;
      this.killsTowardNextUp += 1;
      if (this.killsTowardNextUp >= KILLS_PER_UPGRADE_POINT) {
        this.killsTowardNextUp -= KILLS_PER_UPGRADE_POINT;
        this.upgradePoints += 1;
      }

      if (this.hasPerk('vampiric_rounds')) {
        this.vampiricKillCounter += 1;
        if (this.vampiricKillCounter >= 5) {
          this.vampiricKillCounter -= 5;
          const heal = Math.max(2, Math.round(this.maxHp * 0.02));
          this.hp = Math.min(this.maxHp, this.hp + heal);
          this.spawnBurstParticles(this.playerX, 0.9, this.playerZ, 8, 0x22c55e, 3.8);
        }
      }

      // Career & Bestiary kill tracking
      this.career.totalKills += 1;
      this.career.killsByEnemyType[z.kind] =
        (this.career.killsByEnemyType[z.kind] ?? 0) + 1;

      if (z.kind === 'boss') {
        this.bossesKilledInRun += 1;
        this.career.bossesKilled += 1;
        this.upgradePoints += BOSS_KILL_UP_BONUS;
        this.trauma = Math.min(1.0, this.trauma + 0.7);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.02);
        this.pickupToast = `BOSS DEFEATED · +${BOSS_KILL_UP_BONUS} UP`;
        this.pickupToastTimer = 2.6;
        this.spawnDirectionalBloodBurst(z.x, 1.2, z.z, dirX, dirZ, 28, 8.6, true);
      } else {
        this.spawnDirectionalBloodBurst(
          z.x,
          0.9,
          z.z,
          dirX,
          dirZ,
          16,
          6.8,
          true,
        );
      }

      // Volatile Bomber death blast damages surrounding enemies!
      if (z.kind === 'bomber') {
        const blastR = 4.4;
        this.sound.playBomberExplosion();
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.02);
        this.trauma = Math.min(1.0, this.trauma + 0.5);
        this.spawnFlashRing(z.x, z.z, blastR, 0xf97316, 0.34);
        this.spawnBurstParticles(z.x, 0.75, z.z, 22, 0xf97316, 8.5);
        const splashDmg = Math.round(145 * Math.max(1, this.wavePlan.hpMultiplier * 0.6));
        for (let j = this.zombies.length - 1; j >= 0; j--) {
          const other = this.zombies[j];
          if (other.dying || other.id === z.id) continue;
          const odx = other.x - z.x;
          const odz = other.z - z.z;
          const od = Math.hypot(odx, odz) || 0.001;
          if (od <= blastR + other.radius) {
            this.damageZombie(
              other,
              splashDmg,
              true,
              odx / od,
              odz / od,
              8.0,
              true,
            );
          }
        }
        const pdx = this.playerX - z.x;
        const pdz = this.playerZ - z.z;
        const pDist = Math.hypot(pdx, pdz) || 0.001;
        if (pDist <= 2.6 + PLAYER_RADIUS) {
          this.damagePlayer(z.damage * 0.85, pdx / pDist, pdz / pDist);
        }
      } else if (
        this.dailyMutator === 'volatile_horde' &&
        z.kind !== 'boss' &&
        this.rand() < 0.35
      ) {
        this.spawnAcidPuddle(z.x, z.z, 12);
      }

      const scoreMult =
        this.mode === 'blackout' ? 2 : this.dailyMutator === 'acid_rain' ? 1.25 : 1;
      this.score += Math.round(z.scoreValue * scoreMult);
      this.career.bestScore = Math.max(this.career.bestScore, Math.round(this.score));
      if (this.score > this.highScore) {
        this.highScore = saveHighScore(this.score);
        this.isNewHighScore = true;
      }
      this.checkCareerSkinUnlocks();
      this.career = saveCareerStats(this.career);
      this.callbacks.onCareerUpdate?.(this.career);

      this.sound.playKill();
      this.spawnBloodDecal(
        z.x,
        z.z,
        z.kind === 'boss'
          ? 2.5
          : z.kind === 'brute' || z.kind === 'breacher'
            ? 1.65
            : 1.15,
      );

      const dropKind = rollCrateDrop(z.kind, this.hp / this.maxHp, () => this.rand());
      if (dropKind) {
        this.spawnPickup(dropKind, z.x, z.z);
      }
      return true;
    }

    z.rig.hpBarGroup.visible = true;
    z.rig.hpBarFill.scale.x = Math.max(0.04, z.hp / z.maxHp);

    if (!blockedByArmor) {
      this.sound.playHit(
        z.kind === 'brute' || z.kind === 'boss' || z.kind === 'breacher',
      );
    }
    return false;
  }

  private spawnPickup(kind: CrateKind, x: number, z: number): void {
    const resolved = resolveArenaCollisions(
      x,
      z,
      0.55,
      this.getObstacles(),
      this.getHalfSize(),
    );
    const mesh = buildPickupCrate(kind, this.shadowTex);
    mesh.position.set(resolved.x, 0, resolved.z);
    this.scene.add(mesh);
    this.pickups.push({
      id: this.nextEntityId++,
      kind,
      mesh,
      x: resolved.x,
      z: resolved.z,
      age: 0,
      life: 18,
    });
  }

  private advanceToNextWave(): void {
    this.wave += 1;
    this.career.bestWave = Math.max(this.career.bestWave, this.wave);
    this.checkCareerSkinUnlocks();
    this.career = saveCareerStats(this.career);
    this.callbacks.onCareerUpdate?.(this.career);

    const unlocked = unlockWeaponsForWave(this.weapons, this.wave, (id) =>
      this.getWeaponMagSize(id),
    );
    if (unlocked.length > 0) {
      const spec = WEAPON_SPECS[unlocked[0]];
      this.activeWeapon = unlocked[0];
      this.syncPlayerWeaponVisibility();
      this.isReloading = false;
      this.pickupToast = `UNLOCKED ${spec.name.toUpperCase()}`;
      this.pickupToastTimer = 2.6;
    }

    this.wavePlan = this.buildCurrentWavePlan(this.wave);
    this.spawnTimer = 0.5;
    this.waveBanner = isBossWaveNumber(this.wave, this.mode)
      ? `BOSS WAVE ${this.wave} · ${getBossTitle(this.wave)}`
      : `WAVE ${this.wave} INCOMING`;
    this.waveBannerTimer = 2.4;
    if (!this.weatherOverride && isBossWaveNumber(this.wave, this.mode)) {
      this.setWeatherKind('storm');
    }
    this.persistCurrentProgress(false);
    this.emitHudSnapshot(true);
  }

  private updateWaveSpawning(dt: number): void {
    let aliveCount = 0;
    for (let i = 0; i < this.zombies.length; i++) {
      if (!this.zombies[i].dying) aliveCount++;
    }

    if (this.wavePlan.queue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && aliveCount < this.wavePlan.maxConcurrent) {
        const nextKind = this.wavePlan.queue.shift()!;
        this.spawnZombie(nextKind);
        this.spawnTimer = this.wavePlan.spawnInterval;
      }
      return;
    }

    // Check wave clear
    if (aliveCount === 0) {
      if (this.wavePauseTimer <= 0) {
        this.wavePauseTimer = 2.1;
        this.sound.playWaveClear();
        const waveUp = isBossWaveNumber(this.wave, this.mode)
          ? WAVE_CLEAR_UP_BOSS
          : WAVE_CLEAR_UP_REGULAR;
        this.upgradePoints += waveUp;

        const nextWave = this.wave + 1;
        const unlocked = unlockWeaponsForWave(this.weapons, nextWave, (id) =>
          this.getWeaponMagSize(id),
        );
        if (unlocked.length > 0) {
          const spec = WEAPON_SPECS[unlocked[0]];
          this.activeWeapon = unlocked[0];
          this.syncPlayerWeaponVisibility();
          this.isReloading = false;
          this.waveBanner = `WAVE ${this.wave} CLEARED · +${waveUp} UP · UNLOCKED ${spec.name.toUpperCase()}`;
        } else {
          this.waveBanner = `WAVE ${this.wave} CLEARED · +${waveUp} UP`;
        }
        this.waveBannerTimer = 2.6;
        this.emitHudSnapshot(true);
      } else {
        this.wavePauseTimer -= dt;
        if (this.wavePauseTimer <= 0) {
          const shouldDraftPerk =
            this.wave % 2 === 0 ||
            this.wavePlan.isBossWave ||
            this.mode === 'boss_rush';
          if (shouldDraftPerk) {
            const draftRng =
              this.mode === 'daily' && this.dailyDateKey
                ? createSeededRng(
                    `nightfall-daily-${this.dailyDateKey}-perk-${this.perkDraftSeedCursor++}`,
                  )
                : Math.random;
            this.perkDraftChoices = rollPerkDraftChoices(
              this.ownedPerks,
              draftRng,
            );
            this.uiSimulationPaused = true;
            this.clearHeldInputs();
            this.persistCurrentProgress(true);
            this.emitHudSnapshot(true);
            return;
          }
          this.advanceToNextWave();
        }
      }
    }
  }

  private spawnZombie(kind: ZombieKind, overridePos?: { x: number; z: number }): void {
    const spec = ZOMBIE_SPECS[kind];
    const rig = buildZombieRig(kind, this.shadowTex);
    const halfSize = this.getHalfSize();

    let sx = overridePos?.x ?? 0;
    let sz = overridePos?.z ?? 0;
    if (!overridePos) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const edge = Math.floor(this.rand() * 4);
        const along = (this.rand() * 2 - 1) * (halfSize - 2.5);
        const bound = halfSize - 1.4;
        if (edge === 0) {
          sx = along;
          sz = -bound;
        } else if (edge === 1) {
          sx = along;
          sz = bound;
        } else if (edge === 2) {
          sx = -bound;
          sz = along;
        } else {
          sx = bound;
          sz = along;
        }
        if (Math.hypot(sx - this.playerX, sz - this.playerZ) > 9.5) break;
      }
    }

    const pos = resolveArenaCollisions(
      sx,
      sz,
      spec.radius,
      this.getObstacles(),
      halfSize,
    );
    const initialYaw = Math.atan2(-(this.playerX - pos.x), -(this.playerZ - pos.z));
    rig.root.position.set(pos.x, 0, pos.z);
    rig.root.rotation.y = initialYaw;
    this.scene.add(rig.root);

    const bossCycleScale =
      kind === 'boss' ? getBossCycleHpMultiplier(this.wave) : 1;
    const hp = Math.round(spec.maxHp * this.wavePlan.hpMultiplier * bossCycleScale);
    this.zombies.push({
      id: this.nextEntityId++,
      kind,
      rig,
      x: pos.x,
      z: pos.z,
      vx: 0,
      vz: 0,
      knockVx: 0,
      knockVz: 0,
      facingYaw: initialYaw,
      hp,
      maxHp: hp,
      speed: spec.speed * this.wavePlan.speedMultiplier,
      radius: spec.radius,
      damage: spec.damage * this.wavePlan.damageMultiplier,
      attackRange: spec.attackRange,
      attackWindup: spec.attackWindup,
      attackCooldown: spec.attackCooldown,
      knockbackResist: spec.knockbackResist,
      scoreValue: spec.scoreValue,
      weaveSeed: Math.random() * Math.PI * 2,
      flankSide: Math.random() < 0.5 ? -1 : 1,
      hitFlashTimer: 0,
      windupTimer: 0,
      isWindingUp: false,
      cooldownTimer: 0,
      rangedCooldown: kind === 'boss' ? getBossRangedCooldown(this.wave) : 0,
      stunTimer: 0,
      revealTimer: 0,
      wasRevealed: false,
      lungeTimer: 0,
      chargeCooldown: kind === 'breacher' ? 2.2 + Math.random() * 1.4 : 0,
      chargeTimer: 0,
      chargePending: false,
      chargeDirX: 0,
      chargeDirZ: 0,
      acidTargetX: pos.x,
      acidTargetZ: pos.z,
      dying: false,
      deathTimer: 0,
      walkPhase: Math.random() * Math.PI * 2,
      lastStepIndex: 0,
      howlerBuffTimer: 0,
      howlerCooldown: kind === 'howler' ? 1.8 + Math.random() * 1.2 : 0,
      cryoTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      phase2Triggered: false,
      bossSlamCooldown: kind === 'boss' ? 4.8 : 0,
    });

    if (kind === 'boss') {
      this.sound.playBossSpawn();
      this.waveBanner = `BOSS INCOMING · ${getBossTitle(this.wave)}`;
      this.waveBannerTimer = 2.6;
      this.trauma = Math.min(1.0, this.trauma + 0.45);
      this.emitHudSnapshot(true);
    }
  }

  private updateZombies(dt: number): void {
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();
    const uvOverdrive = this.hasPerk('uv_overdrive');
    const coneRange =
      14.5 *
      CLASS_SPECS[this.career.selectedClass].flashlightConeMult *
      (uvOverdrive ? 1.32 : 1);
    const coneHalf = (Math.PI / 4.8) * (uvOverdrive ? 1.25 : 1);

    // Attack token pool: cap concurrent active windup attackers at 5
    let activeAttackers = 0;
    for (let i = 0; i < this.zombies.length; i++) {
      if (this.zombies[i].isWindingUp) activeAttackers++;
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      if (z.stunTimer > 0) z.stunTimer = Math.max(0, z.stunTimer - dt);
      if (z.revealTimer > 0) z.revealTimer = Math.max(0, z.revealTimer - dt);
      if (z.lungeTimer > 0) z.lungeTimer = Math.max(0, z.lungeTimer - dt);
      if (z.howlerBuffTimer > 0) z.howlerBuffTimer = Math.max(0, z.howlerBuffTimer - dt);
      if (z.cryoTimer > 0) z.cryoTimer = Math.max(0, z.cryoTimer - dt);
      if (z.bossSlamCooldown > 0) z.bossSlamCooldown = Math.max(0, z.bossSlamCooldown - dt);
      if (z.chargeCooldown > 0) {
        z.chargeCooldown = Math.max(0, z.chargeCooldown - dt);
      }
      if (z.chargeTimer > 0) {
        z.chargeTimer = Math.max(0, z.chargeTimer - dt);
      }

      // Hit flash, stun, cryo, or incendiary burn visuals
      if (z.hitFlashTimer > 0) {
        z.hitFlashTimer -= dt;
        const flashOn = z.hitFlashTimer > 0;
        for (const mat of z.rig.hitFlashMaterials) {
          mat.emissive.setHex(flashOn ? 0xffffff : 0x000000);
          mat.emissiveIntensity = flashOn ? 0.85 : 0;
        }
      } else if (z.stunTimer > 0) {
        const pulse = 0.28 + 0.18 * Math.sin(this.lastTimestamp * 0.018);
        for (const mat of z.rig.hitFlashMaterials) {
          mat.emissive.setHex(0x7dd3fc);
          mat.emissiveIntensity = pulse;
        }
      } else if (z.burnTimer > 0) {
        for (const mat of z.rig.hitFlashMaterials) {
          mat.emissive.setHex(0xf97316);
          mat.emissiveIntensity = 0.35;
        }
      } else if (z.cryoTimer > 0) {
        for (const mat of z.rig.hitFlashMaterials) {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.25;
        }
      } else if (z.howlerBuffTimer > 0) {
        for (const mat of z.rig.hitFlashMaterials) {
          mat.emissive.setHex(0xfbbf24);
          mat.emissiveIntensity = 0.22;
        }
      }

      // KO topple transition
      if (z.dying) {
        z.deathTimer -= dt;
        const p = 1 - Math.max(0, z.deathTimer / 0.35);
        z.rig.bodyGroup.rotation.x = -p * (Math.PI / 2);
        z.rig.bodyGroup.position.y = -p * 0.28;
        const s = 1 - p * 0.35;
        z.rig.root.scale.set(s, s, s);
        if (z.deathTimer <= 0) {
          this.scene.remove(z.rig.root);
          this.zombies.splice(i, 1);
        }
        continue;
      }

      // Incendiary / Dragon's Breath burn DoT ticks cleanly every 0.5s
      if (z.burnTimer > 0 && z.burnDps > 0) {
        const prevBucket = Math.floor(z.burnTimer / 0.5);
        z.burnTimer = Math.max(0, z.burnTimer - dt);
        const nextBucket = Math.floor(z.burnTimer / 0.5);
        if (nextBucket !== prevBucket) {
          const tickDmg = Math.max(2, Math.round(z.burnDps * 0.5));
          const killedByBurn = this.damageZombie(z, tickDmg, false, 0, 1, 0, true);
          if (killedByBurn) continue;
        }
      }

      if (z.cooldownTimer > 0) z.cooldownTimer = Math.max(0, z.cooldownTimer - dt);

      // Boss Phase 2 Rage Transition at <= 50% HP
      if (z.kind === 'boss' && !z.phase2Triggered && z.hp <= z.maxHp * 0.5) {
        z.phase2Triggered = true;
        applyBossPhase2Glow(z.rig);
        this.sound.playBossPhase2Roar();
        this.trauma = Math.min(1.0, this.trauma + 0.55);
        this.waveBanner = `${getBossTitle(this.wave)} · ENRAGED PHASE 2`;
        this.waveBannerTimer = 2.6;
        z.speed *= 1.24;
        z.rangedCooldown = Math.min(z.rangedCooldown, 0.7);
        this.spawnFlashRing(z.x, z.z, 6.2, 0xf97316, 0.42);
        this.spawnBurstParticles(z.x, 1.4, z.z, 26, 0xf97316, 8.8);
        this.spawnZombie('runner', { x: z.x + 2.1, z: z.z + 1.2 });
        this.spawnZombie('bomber', { x: z.x - 2.1, z: z.z - 1.2 });
        this.emitHudSnapshot(true);
      }

      // Target selection: Decoy Flare lures non-boss zombies away from player
      let targetX = this.playerX;
      let targetZ = this.playerZ;
      let chasingDecoy = false;
      if (z.kind !== 'boss' && this.activeDecoys.length > 0) {
        const dec = this.activeDecoys[0];
        if (Math.hypot(dec.x - z.x, dec.z - z.z) <= GADGET_SPECS.decoy.radius) {
          targetX = dec.x;
          targetZ = dec.z;
          chasingDecoy = true;
        }
      }

      // Zombies near a powered Floodlight Generator may target & disable it
      let targetGenerator: ActiveGenerator | null = null;
      if (!chasingDecoy && z.kind !== 'spitter' && z.kind !== 'howler') {
        const pDist = Math.hypot(this.playerX - z.x, this.playerZ - z.z);
        for (let g = 0; g < this.generators.length; g++) {
          const gen = this.generators[g];
          if (!gen.powered) continue;
          const gDist = Math.hypot(gen.x - z.x, gen.z - z.z);
          if (gDist < pDist * 0.8 && gDist < 7.5) {
            targetGenerator = gen;
            targetX = gen.x;
            targetZ = gen.z;
            break;
          }
        }
      }

      const dx = targetX - z.x;
      const dz = targetZ - z.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      const toPlayerX = dx / dist;
      const toPlayerZ = dz / dist;

      // Shadow Stalker stealth reveal inside flashlight cone OR powered generator light + UV Overdrive burn
      if (z.kind === 'stalker' && z.rig.stalkerMaterials) {
        let inGenLight = false;
        for (let g = 0; g < this.generators.length; g++) {
          const gen = this.generators[g];
          if (gen.powered && Math.hypot(z.x - gen.x, z.z - gen.z) <= 12.5) {
            inGenLight = true;
            break;
          }
        }
        const inFlashlightCone = isPointInFlashlightCone(
          this.playerX,
          this.playerZ,
          this.playerAimAngle,
          z.x,
          z.z,
          coneRange,
          coneHalf,
        );
        const inCone = z.revealTimer > 0 || z.stunTimer > 0 || inGenLight || inFlashlightCone;
        if (inCone && !z.wasRevealed) {
          this.sound.playStalkerHiss();
        }
        z.wasRevealed = inCone;
        const targetBodyAlpha = inCone ? 0.96 : 0.16;
        const targetEyeAlpha = inCone ? 1.0 : 0.42;
        const mats = z.rig.stalkerMaterials;
        for (let m = 0; m < mats.length; m++) {
          const mat = mats[m];
          const target = m === mats.length - 1 ? targetEyeAlpha : targetBodyAlpha;
          mat.opacity += (target - mat.opacity) * Math.min(1, dt * 10);
        }
        if (inFlashlightCone && uvOverdrive) {
          z.burnTimer = Math.max(z.burnTimer, 0.6);
          z.burnDps = Math.max(
            z.burnDps,
            Math.round(28 * getDamageMultiplier(this.upgradeLevels)),
          );
        }
      }

      // Stunned enemies hold position & decay knockback cleanly
      if (z.stunTimer > 0) {
        z.x += z.knockVx * dt;
        z.z += z.knockVz * dt;
        z.knockVx *= Math.exp(-9.5 * dt);
        z.knockVz *= Math.exp(-9.5 * dt);
        const res = resolveArenaCollisions(z.x, z.z, z.radius, obstacles, halfSize);
        z.x = res.x;
        z.z = res.z;
        z.rig.root.position.set(z.x, 0, z.z);
        continue;
      }

      // Howler AoE speed-buff shriek
      if (z.kind === 'howler') {
        z.howlerCooldown -= dt;
        if (z.howlerCooldown <= 0 && dist < 16) {
          z.howlerCooldown = 5.4;
          this.sound.playHowlerScream();
          this.spawnFlashRing(z.x, z.z, 7.2, 0xfbbf24, 0.45);
          for (let j = 0; j < this.zombies.length; j++) {
            const other = this.zombies[j];
            if (other.dying || other.id === z.id) continue;
            if (Math.hypot(other.x - z.x, other.z - z.z) <= 7.2) {
              other.howlerBuffTimer = Math.max(other.howlerBuffTimer, 4.2);
            }
          }
        }
      }

      // Movement policy per zombie archetype
      let desiredX = toPlayerX;
      let desiredZ = toPlayerZ;
      let moveSpeedMult = 1.0;

      if (z.kind === 'walker') {
        const perpX = -toPlayerZ;
        const perpZ = toPlayerX;
        const weave = Math.sin(z.walkPhase * 0.45 + z.weaveSeed) * 0.32;
        desiredX += perpX * weave;
        desiredZ += perpZ * weave;
      } else if (z.kind === 'runner' && dist > 4.2) {
        const angle = Math.atan2(toPlayerZ, toPlayerX) + z.flankSide * 0.48;
        desiredX = Math.cos(angle);
        desiredZ = Math.sin(angle);
      } else if (z.kind === 'spitter' || z.kind === 'howler') {
        if (dist < 5.6) {
          desiredX = -toPlayerX;
          desiredZ = -toPlayerZ;
          moveSpeedMult = 0.72;
        } else if (dist < 9.5) {
          desiredX = -toPlayerZ * z.flankSide;
          desiredZ = toPlayerX * z.flankSide;
          moveSpeedMult = 0.65;
        }
      } else if (z.kind === 'stalker') {
        if (dist > 5.0) {
          const angle = Math.atan2(toPlayerZ, toPlayerX) + z.flankSide * 0.58;
          desiredX = Math.cos(angle);
          desiredZ = Math.sin(angle);
        } else if (z.lungeTimer <= 0 && z.cooldownTimer <= 0 && dist > 1.8) {
          z.lungeTimer = 0.45;
          this.sound.playStalkerLunge();
        }
        if (z.lungeTimer > 0) {
          moveSpeedMult = 1.62;
        }
      } else if (z.kind === 'breacher' && z.chargeTimer > 0) {
        desiredX = z.chargeDirX;
        desiredZ = z.chargeDirZ;
        moveSpeedMult = 2.3;
      }

      if (z.cryoTimer > 0) moveSpeedMult *= 0.7;
      if (z.howlerBuffTimer > 0) moveSpeedMult *= 1.35;
      for (let w = 0; w < this.activeWires.length; w++) {
        const wire = this.activeWires[w];
        if (Math.hypot(z.x - wire.x, z.z - wire.z) <= GADGET_SPECS.wire.radius) {
          moveSpeedMult *= 0.5;
          break;
        }
      }

      const dLen = Math.hypot(desiredX, desiredZ) || 1;
      desiredX /= dLen;
      desiredZ /= dLen;

      // Boss ranged plasma barrage & Phase 2 shock slam
      if (z.kind === 'boss' && !z.isWindingUp) {
        z.rangedCooldown -= dt;
        const pDist = Math.hypot(this.playerX - z.x, this.playerZ - z.z);
        if (z.rangedCooldown <= 0 && pDist > 3.6 && pDist < 17.5) {
          this.fireBossBarrage(
            z.x,
            z.z,
            Math.atan2(this.playerZ - z.z, this.playerX - z.x),
          );
          z.rangedCooldown =
            getBossRangedCooldown(this.wave) * (z.phase2Triggered ? 0.75 : 1);
        }
        if (z.phase2Triggered && z.bossSlamCooldown <= 0 && pDist < 7.2) {
          z.bossSlamCooldown = 5.4;
          this.spawnFlashRing(z.x, z.z, 5.2, 0xf43f5e, 0.36);
          this.spawnBurstParticles(z.x, 0.4, z.z, 18, 0xf97316, 7.6);
          this.trauma = Math.min(1.0, this.trauma + 0.4);
          this.sound.playBruteTelegraph();
          if (pDist <= 4.8) {
            const px = (this.playerX - z.x) / (pDist || 1);
            const pz = (this.playerZ - z.z) / (pDist || 1);
            this.damagePlayer(z.damage * 0.8, px, pz);
          }
          if (this.zombies.length < 14) {
            this.spawnZombie('runner', { x: z.x + 1.8, z: z.z - 1.4 });
          }
        }
      }

      // Attack windup & telegraph check (melee, Breacher charge, or Acid Spitter ranged glob)
      if (z.isWindingUp) {
        z.windupTimer -= dt;
        const denom = z.chargePending ? 0.45 : z.attackWindup;
        const prog = 1 - Math.max(0, z.windupTimer / denom);
        if (z.kind === 'spitter') {
          const spitDx = z.acidTargetX - z.x;
          const spitDz = z.acidTargetZ - z.z;
          const spitDist = Math.max(1.2, Math.hypot(spitDx, spitDz));
          if (z.rig.telegraphRing) {
            z.rig.telegraphRing.visible = true;
            z.rig.telegraphRing.position.set(0, 0.045, -spitDist);
            z.rig.telegraphRing.scale.setScalar(0.65 + prog * 0.48);
            (z.rig.telegraphRing.material as THREE.MeshBasicMaterial).opacity =
              0.38 + prog * 0.52;
          }
          if (z.rig.telegraphLine) {
            z.rig.telegraphLine.visible = true;
            z.rig.telegraphLine.scale.set(1, 1, spitDist);
            (z.rig.telegraphLine.material as THREE.MeshBasicMaterial).opacity =
              0.42 + prog * 0.45;
          }
          if (z.windupTimer <= 0) {
            z.isWindingUp = false;
            z.cooldownTimer = z.attackCooldown;
            if (z.rig.telegraphRing) z.rig.telegraphRing.visible = false;
            if (z.rig.telegraphLine) z.rig.telegraphLine.visible = false;
            this.spawnAcidProjectile(
              z.x,
              z.z,
              z.acidTargetX,
              z.acidTargetZ,
              z.damage,
            );
          }
        } else {
          if (z.rig.telegraphRing) {
            z.rig.telegraphRing.visible = true;
            z.rig.telegraphRing.position.set(0, 0.045, 0);
            z.rig.telegraphRing.scale.setScalar(0.65 + prog * 0.42);
            (z.rig.telegraphRing.material as THREE.MeshBasicMaterial).opacity =
              0.35 + prog * 0.5;
          }
          if (z.windupTimer <= 0) {
            z.isWindingUp = false;
            if (z.rig.telegraphRing) z.rig.telegraphRing.visible = false;
            if (z.chargePending) {
              z.chargePending = false;
              z.chargeTimer = 0.42;
              z.chargeCooldown = 4.6;
              z.chargeDirX = toPlayerX;
              z.chargeDirZ = toPlayerZ;
            } else {
              z.cooldownTimer = z.attackCooldown;
              if (targetGenerator && targetGenerator.powered) {
                targetGenerator.hp = Math.max(0, targetGenerator.hp - z.damage * 1.4);
                this.spawnBurstParticles(targetGenerator.x, 1.0, targetGenerator.z, 6, 0x38bdf8, 4.2);
                if (targetGenerator.hp <= 0) {
                  targetGenerator.powered = false;
                  targetGenerator.activeRemaining = 0;
                  targetGenerator.chargeProgress = 0;
                  this.sound.playGeneratorDisable();
                  this.pickupToast = `${targetGenerator.id} DISABLED — BLACKOUT`;
                  this.pickupToastTimer = 2.4;
                }
              } else if (!chasingDecoy) {
                const pDist = Math.hypot(this.playerX - z.x, this.playerZ - z.z);
                const slamRadius =
                  z.kind === 'boss'
                    ? z.attackRange + 0.5
                    : z.attackRange + PLAYER_RADIUS + 0.35;
                if (pDist <= slamRadius) {
                  const pLen = pDist || 1;
                  this.damagePlayer(
                    z.damage,
                    (this.playerX - z.x) / pLen,
                    (this.playerZ - z.z) / pLen,
                  );
                }
              }
              if (z.kind === 'boss') {
                this.trauma = Math.min(1.0, this.trauma + 0.35);
                this.spawnBurstParticles(z.x, 0.25, z.z, 14, 0xf43f5e, 6.2);
              }
            }
          }
        }
      } else if (z.kind === 'spitter' && !chasingDecoy) {
        if (
          dist >= 3.2 &&
          dist <= z.attackRange &&
          z.cooldownTimer <= 0 &&
          activeAttackers < 5
        ) {
          z.isWindingUp = true;
          z.windupTimer = z.attackWindup;
          z.acidTargetX = this.playerX;
          z.acidTargetZ = this.playerZ;
          activeAttackers++;
        }
      } else if (
        z.kind === 'breacher' &&
        !chasingDecoy &&
        !targetGenerator &&
        dist >= 3.0 &&
        dist <= 7.2 &&
        z.chargeCooldown <= 0 &&
        z.chargeTimer <= 0 &&
        activeAttackers < 5
      ) {
        z.isWindingUp = true;
        z.chargePending = true;
        z.windupTimer = 0.45;
        activeAttackers++;
        this.sound.playBruteTelegraph();
      } else if (
        !chasingDecoy &&
        dist <= z.attackRange + (targetGenerator ? 0.95 : PLAYER_RADIUS * 0.6) &&
        z.cooldownTimer <= 0 &&
        activeAttackers < 5
      ) {
        z.isWindingUp = true;
        z.chargePending = false;
        z.windupTimer = z.attackWindup;
        activeAttackers++;
        if (z.kind === 'brute' || z.kind === 'boss' || z.kind === 'breacher') {
          this.sound.playBruteTelegraph();
        }
      }

      // Soft separation from neighboring zombies
      let sepX = 0;
      let sepZ = 0;
      for (let j = 0; j < this.zombies.length; j++) {
        if (i === j) continue;
        const other = this.zombies[j];
        if (other.dying) continue;
        const ox = z.x - other.x;
        const oz = z.z - other.z;
        const oDistSq = ox * ox + oz * oz;
        const minSep = z.radius + other.radius + 0.12;
        if (oDistSq > 1e-5 && oDistSq < minSep * minSep) {
          const oDist = Math.sqrt(oDistSq);
          const push = (minSep - oDist) / minSep;
          sepX += (ox / oDist) * push * 2.5;
          sepZ += (oz / oDist) * push * 2.5;
        }
      }

      const speedFactor = z.isWindingUp ? 0.12 : moveSpeedMult;
      z.x += (desiredX * z.speed * speedFactor + sepX + z.knockVx) * dt;
      z.z += (desiredZ * z.speed * speedFactor + sepZ + z.knockVz) * dt;

      // Exponential knockback damping
      z.knockVx *= Math.exp(-9.5 * dt);
      z.knockVz *= Math.exp(-9.5 * dt);

      const resolved = resolveArenaCollisions(
        z.x,
        z.z,
        z.radius,
        obstacles,
        halfSize,
      );
      z.x = resolved.x;
      z.z = resolved.z;

      // Facing yaw (Riot Breachers pivot slower so flanking & dashing behind is rewarded)
      const desiredYaw =
        z.kind === 'spitter' && z.isWindingUp
          ? Math.atan2(-(z.acidTargetX - z.x), -(z.acidTargetZ - z.z))
          : Math.atan2(-toPlayerX, -toPlayerZ);
      if (z.kind === 'breacher') {
        let diff = desiredYaw - z.facingYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const maxTurn = 2.4 * dt;
        z.facingYaw += Math.max(-maxTurn, Math.min(maxTurn, diff));
      } else {
        z.facingYaw = desiredYaw;
      }

      // Update mesh transform & gait
      z.walkPhase += dt * z.speed * 2.2;
      if (z.kind === 'boss') {
        const stepIdx = Math.floor(z.walkPhase / Math.PI);
        if (stepIdx !== z.lastStepIndex) {
          z.lastStepIndex = stepIdx;
          this.sound.playBossFootstep();
        }
      }
      z.rig.root.position.set(z.x, 0, z.z);
      z.rig.root.rotation.y = z.facingYaw;
      if (z.rig.hpBarGroup.visible) {
        z.rig.hpBarGroup.rotation.set(-0.85, -z.facingYaw, 0, 'YXZ');
      }
      const bob = Math.abs(Math.sin(z.walkPhase)) * 0.08;
      z.rig.bodyGroup.position.y = bob;
      z.rig.leftArm.rotation.x = Math.sin(z.walkPhase) * 0.25;
      z.rig.rightArm.rotation.x = -Math.sin(z.walkPhase) * 0.25;
    }
  }

  private spawnAcidProjectile(
    sx: number,
    sz: number,
    tx: number,
    tz: number,
    damage: number,
  ): void {
    this.sound.playAcidSpit();
    const mesh = new THREE.Mesh(this.acidProjGeo, this.acidProjMat);
    mesh.position.set(sx, 1.0, sz);
    this.scene.add(mesh);
    const dist = Math.hypot(tx - sx, tz - sz);
    const duration = Math.max(0.32, Math.min(0.68, dist / 14));
    this.acidProjectiles.push({
      mesh,
      startX: sx,
      startZ: sz,
      targetX: tx,
      targetZ: tz,
      elapsed: 0,
      duration,
      damage,
    });
  }

  private spawnAcidPuddle(x: number, z: number, damage: number): void {
    const pos = resolveArenaCollisions(
      x,
      z,
      0.8,
      this.getObstacles(),
      this.getHalfSize(),
    );
    let slot = this.acidPuddles.find((p) => !p.active);
    if (!slot) {
      // Recycle oldest active acid pool from fixed pool
      slot = this.acidPuddles.reduce((oldest, curr) =>
        curr.age > oldest.age ? curr : oldest,
      );
    }
    slot.active = true;
    slot.x = pos.x;
    slot.z = pos.z;
    slot.age = 0;
    slot.duration = 5.5;
    slot.tickTimer = 0;
    slot.damage = damage;

    this.sound.playAcidSplat();
    this.spawnBurstParticles(pos.x, 0.2, pos.z, 10, 0x84cc16, 4.4);
  }

  private updateAcidHazards(dt: number): void {
    // Acid arcing globs + pooled red ground impact telegraph rings
    for (let i = this.acidProjectiles.length - 1; i >= 0; i--) {
      const p = this.acidProjectiles[i];
      p.elapsed += dt;
      const t = Math.min(1, p.elapsed / p.duration);
      const cx = p.startX + (p.targetX - p.startX) * t;
      const cz = p.startZ + (p.targetZ - p.startZ) * t;
      const cy = 0.95 * (1 - t) + Math.sin(t * Math.PI) * 2.2;
      p.mesh.position.set(cx, Math.max(0.15, cy), cz);

      if (t >= 1) {
        this.scene.remove(p.mesh);
        this.acidProjectiles.splice(i, 1);
        this.spawnAcidPuddle(cx, cz, p.damage);
        if (Math.hypot(this.playerX - cx, this.playerZ - cz) <= 1.35) {
          const dx = this.playerX - cx;
          const dz = this.playerZ - cz;
          const len = Math.hypot(dx, dz) || 1;
          this.damagePlayer(p.damage * 0.75, dx / len, dz / len);
        }
      }
    }

    _quat.identity();
    for (let i = 0; i < MAX_ACID_IMPACT_RINGS; i++) {
      if (i < this.acidProjectiles.length) {
        const p = this.acidProjectiles[i];
        const t = Math.min(1, p.elapsed / p.duration);
        const s = 0.7 + 0.55 * t;
        _vec3B.set(p.targetX, 0.048, p.targetZ);
        _scale.set(s, 1, s);
        _mat4.compose(_vec3B, _quat, _scale);
      } else {
        _mat4.makeScale(0, 0, 0);
      }
      this.acidImpactRingMesh.setMatrixAt(i, _mat4);
    }
    this.acidImpactRingMesh.instanceMatrix.needsUpdate = true;

    // Active acid puddles on courtyard floor (InstancedMesh pool)
    let anyPoolDirty = false;
    for (let i = 0; i < this.acidPuddles.length; i++) {
      const puddle = this.acidPuddles[i];
      if (!puddle.active) continue;
      anyPoolDirty = true;
      puddle.age += dt;
      if (puddle.age >= puddle.duration) {
        puddle.active = false;
        _mat4.makeScale(0, 0, 0);
        this.acidPoolDiscMesh.setMatrixAt(i, _mat4);
        this.acidPoolRimMesh.setMatrixAt(i, _mat4);
        continue;
      }
      const fade =
        puddle.age > puddle.duration - 1.1
          ? Math.max(0, (puddle.duration - puddle.age) / 1.1)
          : 1;
      const pulse = 0.94 + 0.06 * Math.sin(puddle.age * 7);
      const scaleXZ = fade * pulse;
      _vec3B.set(puddle.x, 0.025, puddle.z);
      _scale.set(scaleXZ, 1, scaleXZ);
      _mat4.compose(_vec3B, _quat, _scale);
      this.acidPoolDiscMesh.setMatrixAt(i, _mat4);
      _vec3B.y = 0.029;
      _mat4.compose(_vec3B, _quat, _scale);
      this.acidPoolRimMesh.setMatrixAt(i, _mat4);

      puddle.tickTimer = Math.max(0, puddle.tickTimer - dt);
      const distToPlayer = Math.hypot(
        this.playerX - puddle.x,
        this.playerZ - puddle.z,
      );
      if (
        distToPlayer <= 1.85 &&
        puddle.tickTimer <= 0 &&
        this.invulnTimer <= 0
      ) {
        puddle.tickTimer = 0.48;
        const dx = this.playerX - puddle.x;
        const dz = this.playerZ - puddle.z;
        const len = Math.hypot(dx, dz) || 1;
        this.damagePlayer(puddle.damage * 0.68, dx / len, dz / len);
      }
    }
    if (anyPoolDirty) {
      this.acidPoolDiscMesh.instanceMatrix.needsUpdate = true;
      this.acidPoolRimMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private spawnFlashRing(
    x: number,
    z: number,
    maxRadius: number,
    colorHex: number,
    duration = 0.32,
  ): void {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(this.flashRingGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.08, z);
    mesh.scale.setScalar(0.5);
    this.scene.add(mesh);
    this.flashRings.push({ mesh, mat, age: 0, duration, maxRadius });
  }

  private updateTacticalGear(dt: number): void {
    const mineSpec = TACTICAL_GEAR_SPECS.mine;
    const turretSpec = TACTICAL_GEAR_SPECS.turret;
    const obstacles = this.getObstacles();
    const halfSize = this.getHalfSize();
    const hasShockwaveCoil = this.hasPerk('shockwave_coil');
    const hasTwinTurrets = this.hasPerk('twin_turrets');
    const hasTeslaCoil = this.hasEvolution('tesla_coil');

    // Proximity Mines
    for (let i = this.activeMines.length - 1; i >= 0; i--) {
      const m = this.activeMines[i];
      m.life -= dt;
      if (m.armTimer > 0) m.armTimer -= dt;
      const armed = m.armTimer <= 0;
      const blink = armed ? (Math.sin(this.lastTimestamp * 0.015) > 0 ? 2.5 : 0.4) : 0.3;
      m.rig.ledMat.emissiveIntensity = blink;
      m.rig.ringMesh.visible = armed;

      let triggered = m.life <= 0;
      if (armed && !triggered) {
        const trigR = mineSpec.triggerRadius ?? 1.85;
        for (let j = 0; j < this.zombies.length; j++) {
          const z = this.zombies[j];
          if (z.dying) continue;
          const d = Math.hypot(z.x - m.x, z.z - m.z);
          if (d <= trigR + z.radius * 0.6) {
            triggered = true;
            break;
          }
        }
      }

      if (triggered) {
        this.scene.remove(m.rig.root);
        this.activeMines.splice(i, 1);
        if (m.life > 0) {
          const blastRadius =
            mineSpec.blastRadius *
            CLASS_SPECS[this.career.selectedClass].blastRadiusMult;
          this.sound.playGearExplosion();
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.02);
          this.trauma = Math.min(1.0, this.trauma + 0.58);
          this.spawnFlashRing(
            m.x,
            m.z,
            blastRadius,
            hasShockwaveCoil ? 0x38bdf8 : 0xf97316,
            0.3,
          );
          this.spawnBurstParticles(m.x, 0.45, m.z, 26, 0xfbbf24, 9.0);
          const dmg = Math.round(
            mineSpec.damage * getDamageMultiplier(this.upgradeLevels),
          );
          for (let j = this.zombies.length - 1; j >= 0; j--) {
            const z = this.zombies[j];
            if (z.dying) continue;
            const dx = z.x - m.x;
            const dz = z.z - m.z;
            const dist = Math.hypot(dx, dz) || 0.001;
            if (dist <= blastRadius + z.radius) {
              if (hasShockwaveCoil) {
                z.stunTimer = Math.max(z.stunTimer, z.kind === 'boss' ? 0.5 : 1.0);
              }
              const falloff = Math.max(0.55, 1 - (dist / (blastRadius + 1)) * 0.45);
              this.damageZombie(
                z,
                Math.round(dmg * falloff),
                true,
                dx / dist,
                dz / dist,
                10,
                true,
              );
            }
          }
        }
      }
    }

    // Deployable Sentry Turrets (Supports Twin-Barrel Turrets & Tesla Coil evolution)
    const turretRange = turretSpec.range ?? 13.5;
    const turretDmgMult = getDamageMultiplier(this.upgradeLevels);
    const turretRateMult = CLASS_SPECS[this.career.selectedClass].turretFireRateMult;
    for (let i = this.activeTurrets.length - 1; i >= 0; i--) {
      const t = this.activeTurrets[i];
      t.life -= dt;
      if (t.flashTimer > 0) {
        t.flashTimer -= dt;
        if (t.flashTimer <= 0) t.rig.muzzleFlash.visible = false;
      }
      if (t.life <= 0) {
        this.scene.remove(t.rig.root);
        this.activeTurrets.splice(i, 1);
        this.spawnBurstParticles(t.x, 0.5, t.z, 8, 0x38bdf8, 3.8);
        continue;
      }

      if (t.life < 2.2) {
        t.rig.ringMat.opacity = 0.15 + 0.2 * Math.abs(Math.sin(t.life * 8));
      }

      t.fireTimer -= dt;
      let bestTarget: ActiveZombie | null = null;
      let bestDistSq = turretRange * turretRange;
      for (let j = 0; j < this.zombies.length; j++) {
        const z = this.zombies[j];
        if (z.dying) continue;
        const dx = z.x - t.x;
        const dz = z.z - t.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          const d = Math.sqrt(dSq) || 1;
          const wallDist = raycastObstaclesAndWalls(
            t.x,
            t.z,
            dx / d,
            dz / d,
            d,
            obstacles,
            halfSize,
          );
          if (wallDist >= d - z.radius * 0.5) {
            bestDistSq = dSq;
            bestTarget = z;
          }
        }
      }

      if (bestTarget) {
        const dx = bestTarget.x - t.x;
        const dz = bestTarget.z - t.z;
        const targetYaw = Math.atan2(-dx, -dz);
        t.rig.headGroup.rotation.y = targetYaw;

        if (t.fireTimer <= 0) {
          t.fireTimer = (turretSpec.fireIntervalSec ?? 0.22) / turretRateMult;
          t.flashTimer = 0.045;
          t.rig.muzzleFlash.visible = true;
          t.rig.muzzleFlash.rotation.z = Math.random() * Math.PI;
          const dist = Math.sqrt(bestDistSq) || 1;
          const dirX = dx / dist;
          const dirZ = dz / dist;
          const mx = t.x + dirX * 0.72;
          const mz = t.z + dirZ * 0.72;
          const tracerColor = hasTeslaCoil ? 0xf59e0b : 0x38bdf8;
          this.spawnTracer(mx, 0.74, mz, targetYaw, dist, tracerColor);
          if (hasTeslaCoil) {
            this.sound.playTeslaArc();
          } else {
            this.sound.playShoot('smg');
          }
          const dmg = Math.round(
            turretSpec.damage *
              turretDmgMult *
              (hasTwinTurrets ? 1.35 : 1) *
              (hasTeslaCoil ? 1.2 : 1),
          );
          this.damageZombie(bestTarget, dmg, hasTeslaCoil, dirX, dirZ, 2.2, hasTeslaCoil);
          if (hasTeslaCoil && !bestTarget.dying) {
            this.triggerChainLightning(bestTarget, dmg, 2, 0xf59e0b);
          } else if (hasTwinTurrets && !bestTarget.dying) {
            this.spawnTracer(
              mx + 0.14 * dirZ,
              0.74,
              mz - 0.14 * dirX,
              targetYaw,
              dist,
              0x22c55e,
            );
          }
          this.spawnDirectionalBloodBurst(
            bestTarget.x,
            0.85,
            bestTarget.z,
            dirX,
            dirZ,
            4,
            4.5,
            true,
          );
        }
      } else {
        t.rig.headGroup.rotation.y += dt * 0.85;
      }
    }

    // Tactical Gadget: Laser Tripmines
    for (let i = this.activeTripmines.length - 1; i >= 0; i--) {
      const tm = this.activeTripmines[i];
      tm.life -= dt;
      if (tm.armTimer > 0) tm.armTimer -= dt;
      let triggered = tm.life <= 0;
      if (tm.armTimer <= 0 && !triggered) {
        for (let j = 0; j < this.zombies.length; j++) {
          const z = this.zombies[j];
          if (z.dying) continue;
          if (Math.hypot(z.x - tm.x, z.z - tm.z) <= 1.7 + z.radius * 0.5) {
            triggered = true;
            break;
          }
        }
      }
      if (triggered) {
        this.scene.remove(tm.root);
        this.activeTripmines.splice(i, 1);
        if (tm.life > 0) {
          const r =
            GADGET_SPECS.tripmine.radius *
            CLASS_SPECS[this.career.selectedClass].blastRadiusMult;
          this.sound.playGearExplosion();
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.02);
          this.trauma = Math.min(1.0, this.trauma + 0.55);
          this.spawnFlashRing(tm.x, tm.z, r, 0xef4444, 0.32);
          this.spawnBurstParticles(tm.x, 0.45, tm.z, 24, 0xef4444, 8.8);
          const dmg = Math.round(
            GADGET_SPECS.tripmine.damage * getDamageMultiplier(this.upgradeLevels),
          );
          for (let j = this.zombies.length - 1; j >= 0; j--) {
            const z = this.zombies[j];
            if (z.dying) continue;
            const dx = z.x - tm.x;
            const dz = z.z - tm.z;
            const dist = Math.hypot(dx, dz) || 0.001;
            if (dist <= r + z.radius) {
              if (hasShockwaveCoil) {
                z.stunTimer = Math.max(z.stunTimer, z.kind === 'boss' ? 0.5 : 1.0);
              }
              this.damageZombie(z, dmg, true, dx / dist, dz / dist, 10, true);
            }
          }
        }
      }
    }

    // Tactical Gadget: Decoy Flares
    for (let i = this.activeDecoys.length - 1; i >= 0; i--) {
      const dec = this.activeDecoys[i];
      dec.life -= dt;
      dec.root.rotation.y += dt * 3.5;
      if (dec.life <= 0) {
        this.scene.remove(dec.root);
        this.activeDecoys.splice(i, 1);
      }
    }

    // Tactical Gadget: Barbed Wire Snares
    for (let i = this.activeWires.length - 1; i >= 0; i--) {
      const wire = this.activeWires[i];
      wire.life -= dt;
      if (wire.life <= 0) {
        this.scene.remove(wire.root);
        this.activeWires.splice(i, 1);
        continue;
      }
      wire.tickTimer -= dt;
      if (wire.tickTimer <= 0) {
        wire.tickTimer = 0.7;
        const dmg = Math.round(
          GADGET_SPECS.wire.damage * getDamageMultiplier(this.upgradeLevels),
        );
        for (let j = this.zombies.length - 1; j >= 0; j--) {
          const z = this.zombies[j];
          if (z.dying) continue;
          if (Math.hypot(z.x - wire.x, z.z - wire.z) <= GADGET_SPECS.wire.radius) {
            this.damageZombie(z, dmg, false, 0, 1, 0, true);
          }
        }
      }
    }

    // Tactical Gadget: Mortar Strikes
    for (let i = this.activeMortars.length - 1; i >= 0; i--) {
      const m = this.activeMortars[i];
      m.age += dt;
      const p = Math.min(1, m.age / m.duration);
      m.fillMat.opacity = 0.25 + p * 0.58;
      m.group.scale.setScalar(0.85 + p * 0.15);
      if (m.age >= m.duration) {
        this.scene.remove(m.group);
        this.activeMortars.splice(i, 1);
        const r =
          GADGET_SPECS.mortar.radius *
          CLASS_SPECS[this.career.selectedClass].blastRadiusMult;
        this.sound.playMortarImpact();
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.025);
        this.trauma = Math.min(1.0, this.trauma + 0.72);
        this.spawnFlashRing(m.x, m.z, r, 0xf97316, 0.36);
        this.spawnBurstParticles(m.x, 0.65, m.z, 30, 0xfbbf24, 10.5);
        const dmg = Math.round(
          GADGET_SPECS.mortar.damage * getDamageMultiplier(this.upgradeLevels),
        );
        for (let j = this.zombies.length - 1; j >= 0; j--) {
          const z = this.zombies[j];
          if (z.dying) continue;
          const dx = z.x - m.x;
          const dz = z.z - m.z;
          const dist = Math.hypot(dx, dz) || 0.001;
          if (dist <= r + z.radius) {
            if (hasShockwaveCoil) {
              z.stunTimer = Math.max(z.stunTimer, z.kind === 'boss' ? 0.65 : 1.15);
            }
            const falloff = Math.max(0.6, 1 - (dist / (r + 1)) * 0.4);
            this.damageZombie(
              z,
              Math.round(dmg * falloff),
              true,
              dx / dist,
              dz / dist,
              11.5,
              true,
            );
          }
        }
      }
    }

    // Respawning Explosive Barrels
    for (let i = 0; i < this.barrels.length; i++) {
      const b = this.barrels[i];
      if (b.active) continue;
      b.respawnTimer -= dt;
      if (b.respawnTimer <= 0) {
        if (Math.hypot(this.playerX - b.x, this.playerZ - b.z) > 1.8) {
          b.active = true;
          b.rig.root.visible = true;
          this.spawnBurstParticles(b.x, 0.4, b.z, 8, 0xef4444, 3.6);
        }
      }
    }

    // Floodlight Generators (4s capture ring -> 45s illumination)
    for (let i = 0; i < this.generators.length; i++) {
      const gen = this.generators[i];
      const dist = Math.hypot(this.playerX - gen.x, this.playerZ - gen.z);
      gen.playerInside = dist <= 2.65;
      if (gen.powered) {
        gen.activeRemaining -= dt;
        if (gen.activeRemaining <= 0) {
          gen.powered = false;
          gen.activeRemaining = 0;
          gen.chargeProgress = 0;
          this.sound.playGeneratorDisable();
        }
      } else if (gen.playerInside) {
        gen.chargeProgress = Math.min(1, gen.chargeProgress + dt / 4.0);
        if (gen.chargeProgress >= 1) {
          gen.powered = true;
          gen.activeRemaining = 45;
          gen.hp = gen.maxHp;
          this.sound.playGeneratorOnline();
          this.pickupToast = `${gen.id} FLOODLIGHT ONLINE (45s)`;
          this.pickupToastTimer = 2.4;
          this.spawnFlashRing(gen.x, gen.z, 4.2, 0x38bdf8, 0.35);
          this.emitHudSnapshot(true);
        }
      } else if (gen.chargeProgress > 0) {
        gen.chargeProgress = Math.max(0, gen.chargeProgress - dt * 0.25);
      }

      gen.rig.beaconMat.emissive.setHex(gen.powered ? 0xbae6fd : 0x38bdf8);
      gen.rig.beaconMat.emissiveIntensity = gen.powered
        ? 3.4
        : gen.playerInside
          ? 1.9
          : 0.4;
      gen.rig.poolMat.opacity = gen.powered ? 0.55 : 0;
      if (gen.rig.spotLight) {
        gen.rig.spotLight.intensity = gen.powered ? 28 : 0;
      }
      gen.rig.ringMat.color.setHex(
        gen.powered ? 0x22c55e : gen.playerInside ? 0xfbbf24 : 0x38bdf8,
      );
      gen.rig.ringMat.opacity = gen.powered ? 0.52 : gen.playerInside ? 0.78 : 0.38;
    }

    // Risk-Reward Corner Supply Crate Spawns & Pickups
    if (!this.supplyCrate) {
      this.supplyDropTimer -= dt;
      if (this.supplyDropTimer <= 0) {
        const coords = ARENA_SPECS[this.arena].supplyDropCoords;
        let chosen = coords[0];
        let bestDist = -1;
        for (const c of coords) {
          const d = Math.hypot(c.x - this.playerX, c.z - this.playerZ);
          if (d > bestDist && this.rand() > 0.2) {
            bestDist = d;
            chosen = c;
          }
        }
        const mesh = buildRiskSupplyCrate(this.shadowTex);
        mesh.position.set(chosen.x, 0, chosen.z);
        this.scene.add(mesh);
        this.supplyCrate = {
          id: this.nextEntityId++,
          mesh,
          x: chosen.x,
          z: chosen.z,
          age: 0,
          life: 24,
        };
        this.supplyDropTimer = 28;
        this.pickupToast = 'SUPPLY DROP IN CORNER CRATE';
        this.pickupToastTimer = 2.4;
        this.emitHudSnapshot(true);
      }
    } else {
      const sc = this.supplyCrate;
      sc.age += dt;
      sc.mesh.rotation.y += dt * 1.15;
      if (Math.hypot(this.playerX - sc.x, this.playerZ - sc.z) <= 1.35) {
        this.scene.remove(sc.mesh);
        this.supplyCrate = null;
        this.sound.playPickup('rapidfire');
        const roll = this.rand();
        if (roll < 0.36) {
          this.minigunRemaining = 15;
          this.pickupToast = 'SUPPLY CRATE · MINIGUN OVERDRIVE (15s)';
        } else if (roll < 0.7) {
          this.upgradePoints += 2;
          this.pickupToast = 'SUPPLY CRATE · +2 UPGRADE POINTS';
        } else {
          grantAmmoCrate(this.weapons, (id) => this.getWeaponMagSize(id));
          this.hp = Math.min(this.maxHp, this.hp + 30);
          this.pickupToast = 'SUPPLY CRATE · FULL AMMO + 30 HP';
        }
        this.pickupToastTimer = 2.6;
        this.spawnBurstParticles(this.playerX, 0.9, this.playerZ, 18, 0xf59e0b, 6.4);
        this.emitHudSnapshot(true);
      } else if (sc.age >= sc.life) {
        this.scene.remove(sc.mesh);
        this.supplyCrate = null;
      }
    }

    // Expanding shockwave / flash rings
    for (let i = this.flashRings.length - 1; i >= 0; i--) {
      const r = this.flashRings[i];
      r.age += dt;
      if (r.age >= r.duration) {
        this.scene.remove(r.mesh);
        r.mat.dispose();
        this.flashRings.splice(i, 1);
        continue;
      }
      const p = r.age / r.duration;
      r.mesh.scale.setScalar(0.5 + p * r.maxRadius);
      r.mat.opacity = 0.85 * (1 - p);
    }
  }

  private fireBossBarrage(bx: number, bz: number, baseAngle: number): void {
    this.sound.playBossBarrage();
    const projSpeed = 12.2;
    const offsets = [-0.26, 0, 0.26];
    for (const off of offsets) {
      const a = baseAngle + off;
      const vx = Math.cos(a) * projSpeed;
      const vz = Math.sin(a) * projSpeed;
      const mesh = new THREE.Mesh(this.bossProjGeo, this.bossProjMat);
      mesh.position.set(bx, 1.35, bz);
      this.scene.add(mesh);
      this.bossProjectiles.push({
        mesh,
        x: bx,
        z: bz,
        vx,
        vz,
        damage: 20 * this.wavePlan.damageMultiplier,
        life: 2.2,
      });
    }
  }

  private updateBossProjectiles(dt: number): void {
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.bossProjectiles.splice(i, 1);
        continue;
      }
      const speed = Math.hypot(p.vx, p.vz) || 1;
      const step = speed * dt;
      const blockedDist = raycastObstaclesAndWalls(
        p.x,
        p.z,
        p.vx / speed,
        p.vz / speed,
        step + 0.15,
        this.getObstacles(),
        this.getHalfSize(),
      );
      if (blockedDist <= step + 0.05) {
        this.spawnBurstParticles(p.x, 1.0, p.z, 5, 0xf43f5e, 4.2);
        this.scene.remove(p.mesh);
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, 1.25, p.z);

      const distToPlayer = Math.hypot(this.playerX - p.x, this.playerZ - p.z);
      if (distToPlayer <= PLAYER_RADIUS + 0.24) {
        this.damagePlayer(p.damage, p.vx / speed, p.vz / speed);
        this.scene.remove(p.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }
  }

  private damagePlayer(amount: number, dirX: number, dirZ: number): void {
    if (this.invulnTimer > 0 || this.phase !== 'playing') return;

    const mitigated = Math.max(
      1,
      Math.round(amount * getDamageTakenMultiplier(this.upgradeLevels)),
    );
    this.hp = Math.max(0, this.hp - mitigated);
    this.damageTaken += mitigated;
    this.invulnTimer = 0.45;
    this.bloodSplatter = 1.0;
    this.bloodSeed += 1;
    this.trauma = Math.min(1.0, this.trauma + 0.55);
    this.hitstopTimer = 0.04;
    hapticPlayerDamage();
    this.sound.playPlayerHurt();

    // Small knockback impulse away from attacker
    const resolved = resolveArenaCollisions(
      this.playerX + dirX * 0.55,
      this.playerZ + dirZ * 0.55,
      PLAYER_RADIUS,
      this.getObstacles(),
      this.getHalfSize(),
    );
    this.playerX = resolved.x;
    this.playerZ = resolved.z;

    this.spawnDirectionalBloodBurst(
      this.playerX,
      0.9,
      this.playerZ,
      dirX,
      dirZ,
      14,
      6.0,
      true,
    );
    this.spawnBloodDecal(this.playerX, this.playerZ, 0.72);

    if (this.hp <= 0) {
      if (!this.hasUsedRevive) {
        this.uiSimulationPaused = false;
        this.clearHeldInputs();
        this.playerRig.root.visible = true;
        this.setPhase('revive');
        this.emitHudSnapshot(true);
        return;
      }
      this.finalizeGameOver();
    }
    this.emitHudSnapshot(true);
  }

  private updatePickups(dt: number): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.age += dt;
      const body = p.mesh.getObjectByName('pickup-body');
      if (body) {
        body.rotation.y += dt * 1.9;
        body.position.y = Math.sin(p.age * 4) * 0.1;
      }

      const dist = Math.hypot(this.playerX - p.x, this.playerZ - p.z);
      if (dist <= PLAYER_RADIUS + 0.72) {
        this.applyPickup(p.kind);
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.age >= p.life) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  private applyPickup(kind: CrateKind): void {
    this.sound.playPickup(kind);
    if (kind === 'health') {
      const healed = Math.min(this.maxHp - this.hp, 35);
      this.hp += healed;
      this.pickupToast = healed > 0 ? `+${healed} HEALTH` : 'HEALTH FULL';
      this.spawnBurstParticles(this.playerX, 0.8, this.playerZ, 10, 0x22c55e, 4.2);
    } else if (kind === 'ammo') {
      const granted = grantAmmoCrate(this.weapons, (id) =>
        this.getWeaponMagSize(id),
      );
      this.pickupToast = granted.length > 0 ? granted.join(' · ') : 'AMMO FULL';
      this.spawnBurstParticles(this.playerX, 0.8, this.playerZ, 10, 0xf59e0b, 4.2);
    } else {
      this.rapidFireRemaining = 8.0;
      this.pickupToast = 'RAPID FIRE · 8s';
      this.spawnBurstParticles(this.playerX, 0.8, this.playerZ, 12, 0xef4444, 5.0);
    }
    this.pickupToastTimer = 2.0;
    this.emitHudSnapshot(true);
  }

  private spawnTracer(
    x: number,
    y: number,
    z: number,
    angle: number,
    length: number,
    colorHex: number,
  ): void {
    const slot = this.tracers[this.tracerCursor];
    this.tracerCursor = (this.tracerCursor + 1) % MAX_TRACERS;
    _color.setHex(colorHex);
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.z = z;
    slot.angle = angle;
    slot.length = Math.max(0.4, length);
    slot.r = _color.r;
    slot.g = _color.g;
    slot.b = _color.b;
    slot.life = slot.maxLife;
  }

  private spawnBurstParticles(
    x: number,
    y: number,
    z: number,
    count: number,
    colorHex: number,
    speed: number,
  ): void {
    _color.setHex(colorHex);
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
      const theta = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.75);
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.z = z;
      slot.vx = Math.cos(theta) * spd;
      slot.vy = 1.8 + Math.random() * 3.5;
      slot.vz = Math.sin(theta) * spd;
      slot.maxLife = 0.25 + Math.random() * 0.25;
      slot.life = slot.maxLife;
      slot.size = 0.7 + Math.random() * 0.7;
      slot.r = _color.r;
      slot.g = _color.g;
      slot.b = _color.b;
      slot.splatsOnLand = false;
    }
  }

  private spawnDirectionalBloodBurst(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirZ: number,
    count: number,
    speed: number,
    splatsOnLand: boolean,
  ): void {
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
      const baseAngle = Math.atan2(dirZ, dirX);
      const sprayAngle = baseAngle + (Math.random() - 0.5) * 1.15;
      const spd = speed * (0.55 + Math.random() * 0.85);
      const shade = 0.65 + Math.random() * 0.35;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.z = z;
      slot.vx = Math.cos(sprayAngle) * spd;
      slot.vy = 1.5 + Math.random() * 3.2;
      slot.vz = Math.sin(sprayAngle) * spd;
      slot.maxLife = 0.28 + Math.random() * 0.24;
      slot.life = slot.maxLife;
      slot.size = 0.65 + Math.random() * 0.75;
      slot.r = 0.88 * shade;
      slot.g = 0.08 * shade;
      slot.b = 0.1 * shade;
      slot.splatsOnLand = splatsOnLand;
    }
  }

  private spawnRainSplash(x: number, z: number): void {
    const slot = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
    const theta = Math.random() * Math.PI * 2;
    slot.active = true;
    slot.x = x;
    slot.y = 0.06;
    slot.z = z;
    slot.vx = Math.cos(theta) * 1.1;
    slot.vy = 1.6 + Math.random() * 0.9;
    slot.vz = Math.sin(theta) * 1.1;
    slot.maxLife = 0.15;
    slot.life = 0.15;
    slot.size = 0.26;
    slot.r = 0.72;
    slot.g = 0.88;
    slot.b = 0.98;
    slot.splatsOnLand = false;
  }

  private spawnShellCasing(x: number, z: number, aimAngle: number): void {
    const slot = this.casings[this.casingCursor];
    this.casingCursor = (this.casingCursor + 1) % MAX_CASINGS;
    // Eject to the right of the gun barrel
    const rightX = Math.cos(aimAngle);
    const rightZ = -Math.sin(aimAngle);
    const spd = 2.6 + Math.random() * 1.4;
    slot.active = true;
    slot.x = x;
    slot.y = 0.96;
    slot.z = z;
    slot.vx = rightX * spd + (Math.random() - 0.5) * 0.8;
    slot.vy = 2.8 + Math.random() * 1.2;
    slot.vz = rightZ * spd + (Math.random() - 0.5) * 0.8;
    slot.rx = Math.random() * Math.PI;
    slot.ry = aimAngle;
    slot.rz = Math.random() * Math.PI;
    slot.vrx = (Math.random() * 2 - 1) * 14;
    slot.vry = (Math.random() * 2 - 1) * 12;
    slot.maxLife = 0.85;
    slot.life = slot.maxLife;
  }

  private spawnBloodDecal(x: number, z: number, scale: number): void {
    const slot = this.decals[this.decalCursor];
    this.decalCursor = (this.decalCursor + 1) % MAX_DECALS;
    slot.active = true;
    slot.age = 0;
    slot.opacity = 0.86;
    slot.mat.map = this.bloodSplatTex;
    slot.mat.opacity = slot.opacity;
    slot.mesh.position.set(x, 0.018, z);
    slot.mesh.rotation.z = Math.random() * Math.PI * 2;
    const s = scale * (0.9 + Math.random() * 0.4);
    slot.targetScaleX = s;
    slot.targetScaleY = s;
    slot.currentScaleX = s * 0.35;
    slot.currentScaleY = s * 0.35;
    slot.mesh.scale.set(slot.currentScaleX, slot.currentScaleY, 1);
    slot.mesh.visible = true;
  }

  private spawnDirectionalBloodStreak(
    x: number,
    z: number,
    angle: number,
    scale: number,
  ): void {
    const slot = this.decals[this.decalCursor];
    this.decalCursor = (this.decalCursor + 1) % MAX_DECALS;
    slot.active = true;
    slot.age = 0;
    slot.opacity = 0.84;
    slot.mat.map = this.bloodStreakTex;
    slot.mat.opacity = slot.opacity;
    slot.mesh.position.set(x, 0.019, z);
    // Align canvas top (-Y in plane before X-rotation -> -Z world forward) with shot angle
    slot.mesh.rotation.z = angle + (Math.random() - 0.5) * 0.22;
    const sx = scale * (0.65 + Math.random() * 0.25);
    const sy = scale * (1.25 + Math.random() * 0.45);
    slot.targetScaleX = sx;
    slot.targetScaleY = sy;
    slot.currentScaleX = sx * 0.4;
    slot.currentScaleY = sy * 0.3;
    slot.mesh.scale.set(slot.currentScaleX, slot.currentScaleY, 1);
    slot.mesh.visible = true;
  }

  private setWeatherKind(next: WeatherKind): void {
    if (this.weatherKind === next) return;
    this.weatherKind = next;
    const preset = WEATHER_PRESETS[next];
    this.weatherTimer = preset.durationSec;
    if (next === 'storm') {
      this.lightningTimer = 1.6;
    }
    if (this.phase === 'playing' && !this.waveBanner) {
      this.pickupToast = `WEATHER · ${preset.label.toUpperCase()}`;
      this.pickupToastTimer = 2.0;
    }
    this.emitHudSnapshot(true);
  }

  private applyWeatherImmediate(kind: WeatherKind): void {
    this.weatherKind = kind;
    const preset = WEATHER_PRESETS[kind];
    this.weatherTimer = preset.durationSec;
    this.weatherRainStrength = preset.rainIntensity;
    this.weatherFogDensity = preset.fogDensity;
    this.weatherWindX = preset.windX;
    this.weatherWindZ = preset.windZ;
    this.fogColorCurrent.setHex(preset.fogColorHex);
    this.fogColorTarget.setHex(preset.fogColorHex);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = preset.fogDensity;
      this.scene.fog.color.copy(this.fogColorCurrent);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this.fogColorCurrent);
    }
    if (this.groundMat) {
      this.groundMat.roughness = preset.groundRoughness;
      this.groundMat.metalness = preset.groundMetalness;
    }
    if (kind === 'storm') {
      this.lightningTimer = 1.4;
    }
  }

  private updateWeatherVisuals(dt: number): void {
    const preset = WEATHER_PRESETS[this.weatherKind];
    const k = 1 - Math.exp(-1.4 * dt);

    this.weatherRainStrength += (preset.rainIntensity - this.weatherRainStrength) * k;
    this.weatherFogDensity += (preset.fogDensity - this.weatherFogDensity) * k;
    this.weatherWindX += (preset.windX - this.weatherWindX) * k;
    this.weatherWindZ += (preset.windZ - this.weatherWindZ) * k;
    this.fogColorTarget.setHex(preset.fogColorHex);
    this.fogColorCurrent.lerp(this.fogColorTarget, k);

    if (this.groundMat) {
      this.groundMat.roughness += (preset.groundRoughness - this.groundMat.roughness) * k;
      this.groundMat.metalness += (preset.groundMetalness - this.groundMat.metalness) * k;
    }

    if (this.dustMat) {
      const mistOpacity =
        this.weatherKind === 'mist'
          ? 0.65
          : this.weatherKind === 'storm'
            ? 0.25
            : 0.4;
      this.dustMat.opacity += (mistOpacity - this.dustMat.opacity) * k;
    }

    // Lightning during storm
    if (preset.lightningEnabled) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningFlash = 1.0;
        this.lightningTimer = 5.5 + Math.random() * 5.5;
        this.sound.playThunder(0.9);
      }
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.4);
    }
    const flashBoost = this.lightningFlash * this.lightningFlash;

    const isBlackoutLighting =
      this.mode === 'blackout' || this.dailyMutator === 'blackout_surge';
    const baseMoon = isBlackoutLighting ? 0.22 : 1.42;
    const baseHemi = isBlackoutLighting ? 0.26 : 1.02;

    if (this.moonLight) {
      this.moonLight.intensity = baseMoon + flashBoost * 2.8;
    }
    if (this.hemiLight) {
      this.hemiLight.intensity = baseHemi + flashBoost * 1.15;
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = isBlackoutLighting
        ? Math.max(this.weatherFogDensity, 0.022)
        : this.weatherFogDensity;
      this.scene.fog.color
        .copy(this.fogColorCurrent)
        .lerp(this.lightningColor, flashBoost * 0.45);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background
        .copy(this.fogColorCurrent)
        .lerp(this.lightningColor, flashBoost * 0.45);
    }

    // Rain InstancedMesh animation (modulated by Graphics Quality setting)
    const rainQualityScale = getRainQualityScale(this.settings.graphicsQuality);
    const activeDrops = Math.floor(
      MAX_RAIN_DROPS * this.weatherRainStrength * rainQualityScale,
    );
    if (activeDrops <= 2) {
      this.rainMesh.visible = false;
    } else {
      this.rainMesh.visible = true;
      const tiltX = Math.atan2(this.weatherWindZ, 19);
      const tiltZ = -Math.atan2(this.weatherWindX, 19);
      _quat.setFromEuler(_euler.set(tiltX, 0, tiltZ));
      for (let i = 0; i < MAX_RAIN_DROPS; i++) {
        if (i >= activeDrops) {
          _mat4.makeScale(0, 0, 0);
          this.rainMesh.setMatrixAt(i, _mat4);
          continue;
        }
        const drop = this.rainDrops[i];
        drop.x += this.weatherWindX * dt;
        drop.z += this.weatherWindZ * dt;
        drop.y -= drop.speed * dt;
        if (drop.y <= 0.05) {
          if (Math.random() < 0.08 * this.weatherRainStrength) {
            this.spawnRainSplash(drop.x, drop.z);
          }
          drop.y = 12.5 + Math.random() * 3.5;
          drop.x = this.playerX + (Math.random() * 2 - 1) * 19;
          drop.z = this.playerZ + (Math.random() * 2 - 1) * 19;
        }
        _vec3B.set(drop.x, drop.y, drop.z);
        _scale.set(1, drop.len, 1);
        _mat4.compose(_vec3B, _quat, _scale);
        this.rainMesh.setMatrixAt(i, _mat4);
      }
      this.rainMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private updateVisualEffects(dt: number): void {
    this.updateWeatherVisuals(dt);

    // Ambient drifting night dust motes
    if (this.ambientDust) {
      const half = this.getHalfSize();
      const attr = this.ambientDust.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] +=
          (Math.sin(this.lastTimestamp * 0.0005 + i) * 0.18 + this.weatherWindX * 0.35) *
          dt;
        arr[i + 1] += 0.12 * dt;
        arr[i + 2] += this.weatherWindZ * 0.25 * dt;
        if (arr[i] > half) arr[i] = -half;
        if (arr[i] < -half) arr[i] = half;
        if (arr[i + 2] > half) arr[i + 2] = -half;
        if (arr[i + 2] < -half) arr[i + 2] = half;
        if (arr[i + 1] > 5.2) arr[i + 1] = 0.4;
      }
      attr.needsUpdate = true;
    }

    // Dynamic blood decal spreading & rain washout
    const washRate = WEATHER_PRESETS[this.weatherKind].wetnessWashRate;
    const growK = 1 - Math.exp(-9.5 * dt);
    for (let i = 0; i < this.decals.length; i++) {
      const d = this.decals[i];
      if (!d.active) continue;
      d.age += dt;
      d.currentScaleX += (d.targetScaleX - d.currentScaleX) * growK;
      d.currentScaleY += (d.targetScaleY - d.currentScaleY) * growK;
      d.mesh.scale.set(d.currentScaleX, d.currentScaleY, 1);

      if (washRate > 0 && d.age > 2.2) {
        d.opacity = Math.max(0, d.opacity - washRate * dt);
        d.mat.opacity = d.opacity;
        if (d.opacity <= 0.02) {
          d.active = false;
          d.mesh.visible = false;
        }
      }
    }

    // Subtle burn-barrel firelight flicker & rising sparks
    for (let i = 0; i < this.cornerEmbers.length; i++) {
      const ember = this.cornerEmbers[i];
      const pulse =
        0.85 +
        0.22 * Math.sin(this.lastTimestamp * 0.008 + ember.phase) +
        0.12 * Math.cos(this.lastTimestamp * 0.019 + ember.phase * 2);
      const emberMat = ember.mesh.material as THREE.MeshStandardMaterial;
      emberMat.emissiveIntensity = 1.9 + pulse * 0.65;
      if (ember.light) {
        ember.light.intensity = 7.5 + pulse * 3.5;
      }
    }

    // Subtle organic sodium-vapor streetlamp flicker & rare brownout hum
    const timeSec = this.lastTimestamp * 0.001;
    for (let i = 0; i < this.streetLamps.length; i++) {
      const lamp = this.streetLamps[i];
      lamp.glitchCooldown -= dt;
      if (lamp.glitchCooldown <= 0) {
        lamp.glitchTimer = 0.16 + Math.random() * 0.16;
        lamp.glitchCooldown = 4.0 + Math.random() * 6.5;
      }
      let dip = 0;
      if (lamp.glitchTimer > 0) {
        lamp.glitchTimer = Math.max(0, lamp.glitchTimer - dt);
        dip = 0.24 * Math.abs(Math.sin(timeSec * 38 + lamp.phase));
      }
      const hum =
        0.95 +
        0.045 * Math.sin(timeSec * 2.3 + lamp.phase) +
        0.025 * Math.sin(timeSec * 11.4 + lamp.phase * 1.9);
      const flicker = Math.max(0.62, Math.min(1.06, hum - dip));
      if (lamp.rig.pointLight) {
        lamp.rig.pointLight.intensity = 18 * flicker;
      }
      lamp.rig.bulbMat.emissiveIntensity = 2.4 * flicker;
      lamp.rig.coneMat.opacity = 0.055 * (0.65 + 0.35 * flicker);
      lamp.rig.poolMat.opacity = 0.72 + 0.22 * flicker;
    }

    // Dynamic PointLight pool following highest-priority/nearest living zombies
    if (this.zombieLights.length > 0) {
      this.zombieLightCandidates.length = 0;
      for (let i = 0; i < this.zombies.length; i++) {
        const z = this.zombies[i];
        if (z.dying) continue;
        const dx = z.x - this.playerX;
        const dz = z.z - this.playerZ;
        const distSq = dx * dx + dz * dz;
        const score = z.kind === 'boss' ? -10000 + distSq : distSq;
        this.zombieLightCandidates.push({ z, score });
      }
      this.zombieLightCandidates.sort((a, b) => a.score - b.score);

      for (let i = 0; i < this.zombieLights.length; i++) {
        const zLight = this.zombieLights[i];
        if (i >= this.zombieLightCandidates.length) {
          zLight.intensity = 0;
          continue;
        }
        const z = this.zombieLightCandidates[i].z;
        const pulse = 0.88 + 0.12 * Math.sin(timeSec * 5.2 + z.weaveSeed);
        const yHeight =
          z.kind === 'boss' ? 1.85 : z.kind === 'brute' || z.kind === 'breacher' ? 1.35 : 1.05;
        zLight.position.set(z.x, yHeight, z.z);
        if (z.kind === 'boss') {
          zLight.color.setHex(0xf43f5e);
          zLight.distance = 8.5;
          zLight.intensity = 6.8 * pulse;
        } else if (z.kind === 'runner') {
          zLight.color.setHex(0xff2e2e);
          zLight.distance = 6.2;
          zLight.intensity = 4.2 * pulse;
        } else if (z.kind === 'brute') {
          zLight.color.setHex(0xff7b00);
          zLight.distance = 6.8;
          zLight.intensity = 4.8 * pulse;
        } else if (z.kind === 'spitter') {
          zLight.color.setHex(0x84cc16);
          zLight.distance = 6.0;
          zLight.intensity = 4.4 * pulse;
        } else if (z.kind === 'stalker') {
          zLight.color.setHex(0xa855f7);
          zLight.distance = 4.8;
          zLight.intensity = (z.revealTimer > 0 ? 3.8 : 1.5) * pulse;
        } else if (z.kind === 'breacher') {
          zLight.color.setHex(0x38bdf8);
          zLight.distance = 6.4;
          zLight.intensity = 4.2 * pulse;
        } else {
          zLight.color.setHex(0xa3e635);
          zLight.distance = 5.2;
          zLight.intensity = 3.1 * pulse;
        }
      }
    }

    // Muzzle flash fade
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.playerRig.muzzleFlash.visible = false;
        if (this.playerRig.flashLight) this.playerRig.flashLight.intensity = 0;
      }
    }

    // InstancedMesh Bullet Tracers update
    let anyTracerUpdated = false;
    for (let i = 0; i < MAX_TRACERS; i++) {
      const t = this.tracers[i];
      if (!t.active) continue;
      anyTracerUpdated = true;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        _mat4.makeScale(0, 0, 0);
        this.tracerMesh.setMatrixAt(i, _mat4);
        continue;
      }
      const alpha = Math.max(0.05, t.life / t.maxLife);
      _quat.setFromEuler(_euler.set(0, t.angle, 0));
      _vec3B.set(t.x, t.y, t.z);
      _scale.set(alpha, alpha, t.length);
      _mat4.compose(_vec3B, _quat, _scale);
      this.tracerMesh.setMatrixAt(i, _mat4);
      _color.setRGB(t.r * alpha, t.g * alpha, t.b * alpha);
      this.tracerMesh.setColorAt(i, _color);
    }
    if (anyTracerUpdated) {
      this.tracerMesh.instanceMatrix.needsUpdate = true;
      if (this.tracerMesh.instanceColor) {
        this.tracerMesh.instanceColor.needsUpdate = true;
      }
    }

    // InstancedMesh Brass Shell Casings update
    let anyCasingUpdated = false;
    for (let i = 0; i < MAX_CASINGS; i++) {
      const c = this.casings[i];
      if (!c.active) continue;
      anyCasingUpdated = true;
      c.life -= dt;
      if (c.life <= 0) {
        c.active = false;
        _mat4.makeScale(0, 0, 0);
        this.casingMesh.setMatrixAt(i, _mat4);
        continue;
      }
      c.vy -= 16 * dt;
      c.x += c.vx * dt;
      c.z += c.vz * dt;
      c.y += c.vy * dt;
      if (c.y <= 0.04) {
        c.y = 0.04;
        if (c.vy < -0.6) {
          c.vy = -c.vy * 0.36;
        } else {
          c.vy = 0;
        }
        c.vx *= 0.82;
        c.vz *= 0.82;
        c.vrx *= 0.72;
        c.vry *= 0.72;
      }
      c.rx += c.vrx * dt;
      c.ry += c.vry * dt;
      const fade = c.life < 0.25 ? Math.max(0, c.life / 0.25) : 1;
      _quat.setFromEuler(_euler.set(c.rx, c.ry, c.rz));
      _vec3B.set(c.x, c.y, c.z);
      _scale.set(fade, fade, fade);
      _mat4.compose(_vec3B, _quat, _scale);
      this.casingMesh.setMatrixAt(i, _mat4);
    }
    if (anyCasingUpdated) {
      this.casingMesh.instanceMatrix.needsUpdate = true;
    }

    // Particles InstancedMesh update
    let anyParticleUpdated = false;
    _quat.identity();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      anyParticleUpdated = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vy -= 14 * dt;
      p.x += p.vx * dt;
      const nextY = p.y + p.vy * dt;
      if (nextY <= 0.05 && p.vy < 0 && p.splatsOnLand) {
        p.splatsOnLand = false;
        if (Math.random() < 0.42) {
          this.spawnBloodDecal(p.x, p.z, 0.35 + Math.random() * 0.3);
        }
        p.vx *= 0.25;
        p.vz *= 0.25;
        p.vy = 0;
      }
      p.y = Math.max(0.05, nextY);
      p.z += p.vz * dt;
      const s = p.size * (p.life / p.maxLife);
      _vec3B.set(p.x, p.y, p.z);
      _scale.set(s, s, s);
      _mat4.compose(_vec3B, _quat, _scale);
      this.particleMesh.setMatrixAt(i, _mat4);
      _color.setRGB(p.r, p.g, p.b);
      this.particleMesh.setColorAt(i, _color);
    }
    if (anyParticleUpdated) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) {
        this.particleMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private updateGameplayCamera(dt: number): void {
    const portrait = this.viewportW < 700;
    const height = portrait ? 23.5 : 19.2;
    const backOffset = portrait ? 12.2 : 10.8;

    // Slight aim lead toward player facing
    const leadX = -Math.sin(this.playerAimAngle) * 1.4;
    const leadZ = -Math.cos(this.playerAimAngle) * 1.4;

    const targetX = this.playerX + leadX;
    const targetZ = this.playerZ + backOffset + leadZ * 0.55;

    const k = 1 - Math.exp(-8.5 * dt);
    this.camPos.x += (targetX - this.camPos.x) * k;
    this.camPos.y += (height - this.camPos.y) * k;
    this.camPos.z += (targetZ - this.camPos.z) * k;

    this.camLook.x += (this.playerX + leadX * 0.65 - this.camLook.x) * k;
    this.camLook.y = 0.6;
    this.camLook.z += (this.playerZ + leadZ * 0.65 - this.camLook.z) * k;

    // Exponentially damped directional camera recoil + trauma shake
    this.camRecoilX = THREE.MathUtils.damp(this.camRecoilX, 0, 14, dt);
    this.camRecoilZ = THREE.MathUtils.damp(this.camRecoilZ, 0, 14, dt);

    // Decaying trauma * trauma camera shake
    this.trauma = Math.max(0, this.trauma - dt * 2.2);
    const shake = this.trauma * this.trauma;
    const sx = (Math.random() * 2 - 1) * shake * 0.65 + this.camRecoilX;
    const sy = (Math.random() * 2 - 1) * shake * 0.45;
    const sz = (Math.random() * 2 - 1) * shake * 0.65 + this.camRecoilZ;

    this.camera.position.set(this.camPos.x + sx, this.camPos.y + sy, this.camPos.z + sz);
    this.camera.lookAt(this.camLook.x, this.camLook.y, this.camLook.z);
  }

  private updateFloatingDamage(dt: number): void {
    if (this.floatingDamages.length === 0) return;
    const projected: FloatingDamage[] = [];
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const f = this.floatingDamages[i];
      f.age += dt;
      f.wy += dt * 1.25;
      if (f.age >= f.duration) {
        this.floatingDamages.splice(i, 1);
        continue;
      }
      _vec3B.set(f.wx, f.wy, f.wz).project(this.camera);
      if (_vec3B.z >= -1 && _vec3B.z <= 1) {
        projected.push({
          id: f.id,
          x: (_vec3B.x * 0.5 + 0.5) * this.viewportW,
          y: (-_vec3B.y * 0.5 + 0.5) * this.viewportH,
          amount: f.amount,
          isCrit: f.isCrit,
          isWeakpoint: f.isWeakpoint,
          blockedByArmor: f.blockedByArmor,
          age: f.age,
          duration: f.duration,
        });
      }
    }
    this.callbacks.onFloatingDamageUpdate(projected);
  }

  private emitHudSnapshot(force: boolean): void {
    if (!force && this.disposed) return;
    this.lastEmittedPhase = this.phase;
    const reloadDur = this.getEffectiveReloadDuration(this.activeWeapon);
    const reloadProgress = this.isReloading
      ? 1 - Math.max(0, this.reloadTimer / reloadDur)
      : 0;
    const dashCd = this.getEffectiveDashCooldown();
    const dashCooldownProgress =
      this.dashCooldownTimer > 0
        ? 1 - Math.min(1, this.dashCooldownTimer / dashCd)
        : 1;
    const gearCd =
      TACTICAL_GEAR_SPECS[this.equippedGear].cooldownSec *
      CLASS_SPECS[this.career.selectedClass].gearCooldownMult;
    const gearCooldownProgress =
      this.gearCooldownTimer > 0
        ? 1 - Math.min(1, this.gearCooldownTimer / gearCd)
        : 1;
    const gearCooldownRemaining = Math.max(0, this.gearCooldownTimer);

    const gadgetCd =
      GADGET_SPECS[this.equippedGadget].cooldownSec *
      CLASS_SPECS[this.career.selectedClass].gearCooldownMult;
    const gadgetCooldownProgress =
      this.gadgetCooldownTimer > 0
        ? 1 - Math.min(1, this.gadgetCooldownTimer / gadgetCd)
        : 1;
    const gadgetCooldownRemaining = Math.max(0, this.gadgetCooldownTimer);

    const aliveEnemies: Array<{
      x: number;
      z: number;
      kind: ZombieKind;
      revealed?: boolean;
    }> = [];
    let boss: ActiveZombie | undefined;
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.dying) continue;
      if (z.kind === 'boss') boss = z;
      aliveEnemies.push({
        x: z.x,
        z: z.z,
        kind: z.kind,
        revealed: z.kind === 'stalker' ? z.revealTimer > 0 : true,
      });
    }
    const zombiesRemaining = this.wavePlan.queue.length + aliveEnemies.length;

    const hazards: MinimapHazard[] = [];
    for (let i = 0; i < this.acidPuddles.length; i++) {
      const p = this.acidPuddles[i];
      if (!p.active) continue;
      hazards.push({ x: p.x, z: p.z, kind: 'acid' });
    }
    for (let i = 0; i < this.activeMines.length; i++) {
      const m = this.activeMines[i];
      hazards.push({ x: m.x, z: m.z, kind: 'mine' });
    }
    for (let i = 0; i < this.activeTurrets.length; i++) {
      const t = this.activeTurrets[i];
      hazards.push({ x: t.x, z: t.z, kind: 'turret' });
    }
    for (let i = 0; i < this.activeTripmines.length; i++) {
      const tm = this.activeTripmines[i];
      hazards.push({ x: tm.x, z: tm.z, kind: 'tripmine' });
    }
    for (let i = 0; i < this.activeDecoys.length; i++) {
      const dec = this.activeDecoys[i];
      hazards.push({ x: dec.x, z: dec.z, kind: 'decoy' });
    }
    for (let i = 0; i < this.activeWires.length; i++) {
      const w = this.activeWires[i];
      hazards.push({ x: w.x, z: w.z, kind: 'wire' });
    }
    let barrelsReady = 0;
    for (let i = 0; i < this.barrels.length; i++) {
      const b = this.barrels[i];
      if (b.active) {
        barrelsReady++;
        hazards.push({ x: b.x, z: b.z, kind: 'barrel' });
      }
    }
    const generatorStatuses: GeneratorHudStatus[] = this.generators.map((g) => {
      hazards.push({
        x: g.x,
        z: g.z,
        kind: g.powered ? 'generator_on' : 'generator_off',
      });
      return {
        id: g.id,
        x: g.x,
        z: g.z,
        powered: g.powered,
        progress: g.powered ? Math.max(0, g.activeRemaining / 45) : g.chargeProgress,
        playerInside: g.playerInside,
      };
    });

    const minimapPickups: MinimapPickup[] = this.pickups.map((p) => ({
      x: p.x,
      z: p.z,
      kind: p.kind,
    }));
    if (this.supplyCrate) {
      minimapPickups.push({
        x: this.supplyCrate.x,
        z: this.supplyCrate.z,
        kind: 'supply',
      });
    }

    this.callbacks.onHudUpdate({
      phase: this.phase,
      hp: Math.round(this.hp),
      maxHp: this.maxHp,
      ghostHp: Math.round(this.ghostHp),
      score: Math.round(this.score),
      highScore: Math.round(this.highScore),
      wave: this.wave,
      zombiesRemaining,
      activeWeapon: this.activeWeapon,
      weapons: this.weapons.map((w) => ({ ...w })),
      isReloading: this.isReloading,
      reloadProgress,
      dashCooldownProgress,
      equippedGear: this.equippedGear,
      gearCooldownProgress,
      gearCooldownRemaining,
      equippedGadget: this.equippedGadget,
      gadgetCooldownProgress,
      gadgetCooldownRemaining,
      rapidFireRemaining: this.rapidFireRemaining,
      minigunRemaining: this.minigunRemaining,
      muted: this.sound.isMuted(),
      waveBanner: this.waveBanner,
      pickupToast: this.pickupToast,
      skinUnlockToast: this.skinUnlockToast,
      evolutionBanner: this.evolutionBanner,
      kills: this.kills,
      damageTaken: Math.round(this.damageTaken),
      isNewHighScore: this.isNewHighScore,
      upgradePoints: this.upgradePoints,
      killsTowardNextUp: this.killsTowardNextUp,
      killsPerUp: KILLS_PER_UPGRADE_POINT,
      upgradeLevels: { ...this.upgradeLevels },
      weaponMastery: { ...this.weaponMastery },
      ownedPerks: [...this.ownedPerks],
      perkDraftChoices: this.perkDraftChoices ? [...this.perkDraftChoices] : null,
      evolvedWeapons: [...this.evolvedWeapons],
      arena: this.arena,
      mode: this.mode,
      dailyDateKey: this.dailyDateKey,
      dailyMutatorLabel: this.dailyMutatorLabel,
      generators: generatorStatuses,
      barrelsReady,
      bossPhase2Active: Boolean(boss?.phase2Triggered),
      bossesKilledInRun: this.bossesKilledInRun,
      callsign: this.callsign,
      activeBoss: boss
        ? {
            name: getBossTitle(this.wave),
            hp: Math.max(0, Math.ceil(boss.hp)),
            maxHp: boss.maxHp,
            wave: this.wave,
            phase2: boss.phase2Triggered,
          }
        : null,
      weather: this.weatherKind,
      bloodSplatter: Math.round(this.bloodSplatter * 20) / 20,
      bloodSeed: this.bloodSeed,
      hasUsedRevive: this.hasUsedRevive,
      fps: this.currentFps,
      showFps: this.settings.showFps,
      autoFire: this.settings.autoFire,
      equippedSkinId: this.career.equippedSkinId,
      selectedClass: this.career.selectedClass,
      lastScrapEarned: this.lastScrapEarned,
      minimap: {
        playerX: this.playerX,
        playerZ: this.playerZ,
        playerAimAngle: this.playerAimAngle,
        enemies: aliveEnemies,
        pickups: minimapPickups,
        hazards,
      },
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.flashRingGeo.dispose();
    this.acidProjGeo.dispose();
    this.acidProjMat.dispose();
    this.bossProjGeo.dispose();
    this.bossProjMat.dispose();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        if (m.geometry && !m.geometry.userData?.shared) {
          m.geometry.dispose();
        }
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });
    disposeSharedModelGeometries();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
