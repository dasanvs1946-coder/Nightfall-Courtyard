import { ARENA_HALF_SIZE, COURTYARD_OBSTACLES } from './collision';
import { ArenaId, GameModeId, ObstacleBox, TacticalPadKind } from './types';

export interface ArenaCoord {
  x: number;
  z: number;
}

export interface TacticalPadSpec {
  kind: TacticalPadKind;
  x: number;
  z: number;
  scrapCost: number;
  label: string;
}

export interface ArenaSpec {
  id: ArenaId;
  name: string;
  shortLabel: string;
  subtitle: string;
  halfSize: number;
  obstacles: ObstacleBox[];
  barrelCoords: ArenaCoord[];
  cryoCanisterCoords: ArenaCoord[];
  generatorCoords: [ArenaCoord, ArenaCoord];
  tacticalPads: [TacticalPadSpec, TacticalPadSpec];
  supplyDropCoords: ArenaCoord[];
  spawnIntervalMultiplier: number;
  groundColor: number;
  groundRoughness: number;
  groundMetalness: number;
  ambientTintHex: string;
  accentHex: string;
  hasTrainHazard?: boolean;
  trainLaneZ?: number;
  trainHalfWidth?: number;
  toxicVents?: ArenaCoord[];
  hasOpenDropEdges?: boolean;
}

export const PARKING_DECK_OBSTACLES: ObstacleBox[] = [
  // Dense structural concrete pillars creating narrow flashlight sightlines
  {
    id: 'pillar-nw',
    kind: 'pillar',
    x: -7.5,
    z: -7.5,
    halfW: 1.05,
    halfD: 1.05,
    height: 4.6,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'pillar-ne',
    kind: 'pillar',
    x: 7.5,
    z: -7.5,
    halfW: 1.05,
    halfD: 1.05,
    height: 4.6,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'pillar-sw',
    kind: 'pillar',
    x: -7.5,
    z: 7.5,
    halfW: 1.05,
    halfD: 1.05,
    height: 4.6,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'pillar-se',
    kind: 'pillar',
    x: 7.5,
    z: 7.5,
    halfW: 1.05,
    halfD: 1.05,
    height: 4.6,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'pillar-w',
    kind: 'pillar',
    x: -14.2,
    z: 0,
    halfW: 1.05,
    halfD: 1.05,
    height: 4.6,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'pillar-e',
    kind: 'pillar',
    x: 14.2,
    z: 0,
    halfW: 1.05,
    halfD: 1.05,
    height: 4.6,
    rotationY: 0,
    blocksBullets: true,
  },
  // Wrecked sedans parked between bays
  {
    id: 'deck-car-n',
    kind: 'car',
    x: 0,
    z: -12.6,
    halfW: 2.15,
    halfD: 1.02,
    height: 1.45,
    rotationY: 0.08,
    blocksBullets: true,
    colorVariant: 1,
  },
  {
    id: 'deck-car-s',
    kind: 'car',
    x: 0,
    z: 12.6,
    halfW: 2.15,
    halfD: 1.02,
    height: 1.45,
    rotationY: -0.1,
    blocksBullets: true,
    colorVariant: 2,
  },
  {
    id: 'deck-crate-w',
    kind: 'crate',
    x: -13.0,
    z: -12.0,
    halfW: 1.1,
    halfD: 0.85,
    height: 1.2,
    rotationY: 0.25,
    blocksBullets: true,
  },
  {
    id: 'deck-crate-e',
    kind: 'crate',
    x: 13.0,
    z: 12.0,
    halfW: 1.1,
    halfD: 0.85,
    height: 1.2,
    rotationY: -0.22,
    blocksBullets: true,
  },
];

export const HELIPAD_OBSTACLES: ObstacleBox[] = [
  // Wide open center pad with sparse perimeter cargo & corner beacons
  {
    id: 'heli-crate-nw',
    kind: 'crate',
    x: -12.8,
    z: -11.4,
    halfW: 1.35,
    halfD: 0.9,
    height: 1.2,
    rotationY: 0.35,
    blocksBullets: true,
  },
  {
    id: 'heli-crate-ne',
    kind: 'crate',
    x: 12.8,
    z: -11.4,
    halfW: 1.35,
    halfD: 0.9,
    height: 1.2,
    rotationY: -0.35,
    blocksBullets: true,
  },
  {
    id: 'heli-crate-sw',
    kind: 'crate',
    x: -12.8,
    z: 11.4,
    halfW: 1.35,
    halfD: 0.9,
    height: 1.2,
    rotationY: -0.35,
    blocksBullets: true,
  },
  {
    id: 'heli-crate-se',
    kind: 'crate',
    x: 12.8,
    z: 11.4,
    halfW: 1.35,
    halfD: 0.9,
    height: 1.2,
    rotationY: 0.35,
    blocksBullets: true,
  },
  {
    id: 'heli-beacon-w',
    kind: 'lamp',
    x: -15.5,
    z: 0,
    halfW: 0.42,
    halfD: 0.42,
    height: 4.8,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'heli-beacon-e',
    kind: 'lamp',
    x: 15.5,
    z: 0,
    halfW: 0.42,
    halfD: 0.42,
    height: 4.8,
    rotationY: 0,
    blocksBullets: true,
  },
];

export const SUBWAY_OBSTACLES: ObstacleBox[] = [
  // North platform concrete pillars framing track edge
  {
    id: 'sub-pillar-nw',
    kind: 'pillar',
    x: -10.5,
    z: -5.2,
    halfW: 0.9,
    halfD: 0.9,
    height: 4.5,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'sub-pillar-nc',
    kind: 'pillar',
    x: 0,
    z: -5.2,
    halfW: 0.9,
    halfD: 0.9,
    height: 4.5,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'sub-pillar-ne',
    kind: 'pillar',
    x: 10.5,
    z: -5.2,
    halfW: 0.9,
    halfD: 0.9,
    height: 4.5,
    rotationY: 0,
    blocksBullets: true,
  },
  // South platform concrete pillars
  {
    id: 'sub-pillar-sw',
    kind: 'pillar',
    x: -10.5,
    z: 5.2,
    halfW: 0.9,
    halfD: 0.9,
    height: 4.5,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'sub-pillar-sc',
    kind: 'pillar',
    x: 0,
    z: 5.2,
    halfW: 0.9,
    halfD: 0.9,
    height: 4.5,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'sub-pillar-se',
    kind: 'pillar',
    x: 10.5,
    z: 5.2,
    halfW: 0.9,
    halfD: 0.9,
    height: 4.5,
    rotationY: 0,
    blocksBullets: true,
  },
  // Quarantine supply crates along outer platform bays
  {
    id: 'sub-crate-nw',
    kind: 'crate',
    x: -14.5,
    z: -12.5,
    halfW: 1.4,
    halfD: 0.9,
    height: 1.3,
    rotationY: 0.14,
    blocksBullets: true,
  },
  {
    id: 'sub-crate-se',
    kind: 'crate',
    x: 14.5,
    z: 12.5,
    halfW: 1.4,
    halfD: 0.9,
    height: 1.3,
    rotationY: -0.14,
    blocksBullets: true,
  },
];

export const BIOLAB_OBSTACLES: ObstacleBox[] = [
  // Destructible glass containment pods
  {
    id: 'biolab-pod-nw',
    kind: 'pod',
    x: -7.5,
    z: -7.5,
    halfW: 1.15,
    halfD: 1.15,
    height: 3.1,
    rotationY: 0,
    blocksBullets: true,
    destructible: true,
    maxHp: 140,
  },
  {
    id: 'biolab-pod-ne',
    kind: 'pod',
    x: 7.5,
    z: -7.5,
    halfW: 1.15,
    halfD: 1.15,
    height: 3.1,
    rotationY: 0,
    blocksBullets: true,
    destructible: true,
    maxHp: 140,
  },
  {
    id: 'biolab-pod-sw',
    kind: 'pod',
    x: -7.5,
    z: 7.5,
    halfW: 1.15,
    halfD: 1.15,
    height: 3.1,
    rotationY: 0,
    blocksBullets: true,
    destructible: true,
    maxHp: 140,
  },
  {
    id: 'biolab-pod-se',
    kind: 'pod',
    x: 7.5,
    z: 7.5,
    halfW: 1.15,
    halfD: 1.15,
    height: 3.1,
    rotationY: 0,
    blocksBullets: true,
    destructible: true,
    maxHp: 140,
  },
  // Permanent structural reactor pylons & hazard crates
  {
    id: 'biolab-tech-w',
    kind: 'pillar_tech',
    x: -14.8,
    z: -4.2,
    halfW: 0.95,
    halfD: 0.95,
    height: 4.4,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'biolab-tech-e',
    kind: 'pillar_tech',
    x: 14.8,
    z: 4.2,
    halfW: 0.95,
    halfD: 0.95,
    height: 4.4,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'biolab-crate-n',
    kind: 'crate',
    x: 0,
    z: -14.2,
    halfW: 1.5,
    halfD: 0.85,
    height: 1.25,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'biolab-crate-s',
    kind: 'crate',
    x: 0,
    z: 14.2,
    halfW: 1.5,
    halfD: 0.85,
    height: 1.25,
    rotationY: 0,
    blocksBullets: true,
  },
];

export const ROOFTOP_OBSTACLES: ObstacleBox[] = [
  // Cyber-amber HVAC / server pylons leaving wide perimeter knockback lanes
  {
    id: 'roof-tech-nw',
    kind: 'pillar_tech',
    x: -7.2,
    z: -7.2,
    halfW: 1.1,
    halfD: 1.1,
    height: 2.8,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'roof-tech-ne',
    kind: 'pillar_tech',
    x: 7.2,
    z: -7.2,
    halfW: 1.1,
    halfD: 1.1,
    height: 2.8,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'roof-tech-sw',
    kind: 'pillar_tech',
    x: -7.2,
    z: 7.2,
    halfW: 1.1,
    halfD: 1.1,
    height: 2.8,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'roof-tech-se',
    kind: 'pillar_tech',
    x: 7.2,
    z: 7.2,
    halfW: 1.1,
    halfD: 1.1,
    height: 2.8,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'roof-crate-n',
    kind: 'crate',
    x: 0,
    z: -11.8,
    halfW: 1.5,
    halfD: 0.85,
    height: 1.15,
    rotationY: 0,
    blocksBullets: true,
  },
  {
    id: 'roof-crate-s',
    kind: 'crate',
    x: 0,
    z: 11.8,
    halfW: 1.5,
    halfD: 0.85,
    height: 1.15,
    rotationY: 0,
    blocksBullets: true,
  },
];

export const ARENA_ORDER: ArenaId[] = [
  'courtyard',
  'parking_deck',
  'helipad',
  'subway',
  'biolab',
  'rooftop',
];

export const ARENA_SPECS: Record<ArenaId, ArenaSpec> = {
  courtyard: {
    id: 'courtyard',
    name: 'Courtyard',
    shortLabel: 'COURTYARD',
    subtitle: 'Classic flooded plaza with abandoned cars & streetlamps',
    halfSize: ARENA_HALF_SIZE,
    obstacles: COURTYARD_OBSTACLES,
    barrelCoords: [
      { x: -5.8, z: -5.6 },
      { x: 6.0, z: -5.4 },
      { x: -6.4, z: 6.2 },
      { x: 6.4, z: 6.0 },
    ],
    cryoCanisterCoords: [
      { x: -11.2, z: -4.2 },
      { x: 11.2, z: 4.2 },
    ],
    generatorCoords: [
      { x: -11.5, z: 0 },
      { x: 11.5, z: 0 },
    ],
    tacticalPads: [
      { kind: 'auto_turret', x: -3.5, z: -15.5, scrapCost: 25, label: 'Auto-Turret' },
      { kind: 'overcharge_light', x: 3.5, z: 15.5, scrapCost: 20, label: 'Overcharge Light' },
    ],
    supplyDropCoords: [
      { x: -16.8, z: -16.8 },
      { x: 16.8, z: -16.8 },
      { x: -16.8, z: 16.8 },
      { x: 16.8, z: 16.8 },
    ],
    spawnIntervalMultiplier: 1.0,
    groundColor: 0x161b24,
    groundRoughness: 0.36,
    groundMetalness: 0.32,
    ambientTintHex: '#38BDF8',
    accentHex: '#38BDF8',
  },
  parking_deck: {
    id: 'parking_deck',
    name: 'Flooded Parking Deck',
    shortLabel: 'PARKING DECK',
    subtitle: 'Tight concrete pillars, slick water & narrow sightlines',
    halfSize: ARENA_HALF_SIZE,
    obstacles: PARKING_DECK_OBSTACLES,
    barrelCoords: [
      { x: -3.8, z: -8.0 },
      { x: 3.8, z: 8.0 },
      { x: -10.8, z: 3.6 },
      { x: 10.8, z: -3.6 },
    ],
    cryoCanisterCoords: [
      { x: -11.5, z: -11.5 },
      { x: 11.5, z: -11.5 },
    ],
    generatorCoords: [
      { x: 0, z: -7.5 },
      { x: 0, z: 7.5 },
    ],
    tacticalPads: [
      { kind: 'auto_turret', x: -10.2, z: -4.2, scrapCost: 25, label: 'Auto-Turret' },
      { kind: 'overcharge_light', x: 10.2, z: 4.2, scrapCost: 20, label: 'Overcharge Light' },
    ],
    supplyDropCoords: [
      { x: -16.8, z: -16.2 },
      { x: 16.8, z: -16.2 },
      { x: -16.8, z: 16.2 },
      { x: 16.8, z: 16.2 },
    ],
    spawnIntervalMultiplier: 0.96,
    groundColor: 0x121820,
    groundRoughness: 0.16,
    groundMetalness: 0.62,
    ambientTintHex: '#22D3EE',
    accentHex: '#06B6D4',
  },
  helipad: {
    id: 'helipad',
    name: 'Abandoned Helipad',
    shortLabel: 'HELIPAD',
    subtitle: 'Wide open exposed rooftop with 20% faster horde spawns',
    halfSize: ARENA_HALF_SIZE,
    obstacles: HELIPAD_OBSTACLES,
    barrelCoords: [
      { x: -8.0, z: -8.0 },
      { x: 8.0, z: -8.0 },
      { x: -8.0, z: 8.0 },
      { x: 8.0, z: 8.0 },
      { x: 0, z: -13.5 },
    ],
    cryoCanisterCoords: [
      { x: -4.8, z: 12.2 },
      { x: 4.8, z: -12.2 },
    ],
    generatorCoords: [
      { x: -10.5, z: 0 },
      { x: 10.5, z: 0 },
    ],
    tacticalPads: [
      { kind: 'auto_turret', x: 0, z: -8.8, scrapCost: 25, label: 'Auto-Turret' },
      { kind: 'overcharge_light', x: 0, z: 8.8, scrapCost: 20, label: 'Overcharge Light' },
    ],
    supplyDropCoords: [
      { x: -17.2, z: -16.5 },
      { x: 17.2, z: -16.5 },
      { x: -17.2, z: 16.5 },
      { x: 17.2, z: 16.5 },
    ],
    spawnIntervalMultiplier: 0.8,
    groundColor: 0x1b2028,
    groundRoughness: 0.54,
    groundMetalness: 0.24,
    ambientTintHex: '#F59E0B',
    accentHex: '#F59E0B',
  },
  subway: {
    id: 'subway',
    name: 'Subway Quarantine',
    shortLabel: 'SUBWAY',
    subtitle: 'Pillar choke points & periodic lethal high-speed armored train',
    halfSize: ARENA_HALF_SIZE,
    obstacles: SUBWAY_OBSTACLES,
    barrelCoords: [
      { x: -6.2, z: -8.8 },
      { x: 6.2, z: -8.8 },
      { x: -6.2, z: 8.8 },
      { x: 6.2, z: 8.8 },
    ],
    cryoCanisterCoords: [
      { x: -14.2, z: 6.8 },
      { x: 14.2, z: -6.8 },
    ],
    generatorCoords: [
      { x: -5.5, z: -12.2 },
      { x: 5.5, z: 12.2 },
    ],
    tacticalPads: [
      { kind: 'auto_turret', x: 5.5, z: -11.5, scrapCost: 25, label: 'Auto-Turret' },
      { kind: 'overcharge_light', x: -5.5, z: 11.5, scrapCost: 20, label: 'Overcharge Light' },
    ],
    supplyDropCoords: [
      { x: -16.8, z: -16.8 },
      { x: 16.8, z: -16.8 },
      { x: -16.8, z: 16.8 },
      { x: 16.8, z: 16.8 },
    ],
    spawnIntervalMultiplier: 0.95,
    groundColor: 0x14171f,
    groundRoughness: 0.42,
    groundMetalness: 0.36,
    ambientTintHex: '#FBBF24',
    accentHex: '#F59E0B',
    hasTrainHazard: true,
    trainLaneZ: 0,
    trainHalfWidth: 2.35,
  },
  biolab: {
    id: 'biolab',
    name: 'Biolab Reactor',
    shortLabel: 'BIOLAB',
    subtitle: 'Destructible cryo-glass pods & timed toxic gas vents',
    halfSize: ARENA_HALF_SIZE,
    obstacles: BIOLAB_OBSTACLES,
    barrelCoords: [
      { x: -4.2, z: -11.0 },
      { x: 4.2, z: -11.0 },
      { x: -4.2, z: 11.0 },
      { x: 4.2, z: 11.0 },
    ],
    cryoCanisterCoords: [
      { x: -11.5, z: -4.2 },
      { x: 11.5, z: 4.2 },
      { x: 0, z: -6.0 },
    ],
    generatorCoords: [
      { x: -12.2, z: 8.0 },
      { x: 12.2, z: -8.0 },
    ],
    tacticalPads: [
      { kind: 'auto_turret', x: -12.2, z: -8.0, scrapCost: 25, label: 'Auto-Turret' },
      { kind: 'overcharge_light', x: 12.2, z: 8.0, scrapCost: 20, label: 'Overcharge Light' },
    ],
    supplyDropCoords: [
      { x: -16.6, z: -16.6 },
      { x: 16.6, z: -16.6 },
      { x: -16.6, z: 16.6 },
      { x: 16.6, z: 16.6 },
    ],
    spawnIntervalMultiplier: 0.94,
    groundColor: 0x0f1a1c,
    groundRoughness: 0.25,
    groundMetalness: 0.52,
    ambientTintHex: '#22C55E',
    accentHex: '#22C55E',
    toxicVents: [
      { x: -11.5, z: 0 },
      { x: 11.5, z: 0 },
      { x: 0, z: -9.5 },
      { x: 0, z: 9.5 },
    ],
  },
  rooftop: {
    id: 'rooftop',
    name: 'Neon Rooftop',
    shortLabel: 'ROOFTOP',
    subtitle: 'Rain-slicked cyber skyline with lethal edge drops for knockback kills',
    halfSize: ARENA_HALF_SIZE,
    obstacles: ROOFTOP_OBSTACLES,
    barrelCoords: [
      { x: -11.0, z: -11.0 },
      { x: 11.0, z: -11.0 },
      { x: -11.0, z: 11.0 },
      { x: 11.0, z: 11.0 },
    ],
    cryoCanisterCoords: [
      { x: -12.5, z: 0 },
      { x: 12.5, z: 0 },
    ],
    generatorCoords: [
      { x: -4.8, z: -4.8 },
      { x: 4.8, z: 4.8 },
    ],
    tacticalPads: [
      { kind: 'auto_turret', x: -4.8, z: 4.8, scrapCost: 25, label: 'Auto-Turret' },
      { kind: 'overcharge_light', x: 4.8, z: -4.8, scrapCost: 20, label: 'Overcharge Light' },
    ],
    supplyDropCoords: [
      { x: -15.5, z: -15.5 },
      { x: 15.5, z: -15.5 },
      { x: -15.5, z: 15.5 },
      { x: 15.5, z: 15.5 },
    ],
    spawnIntervalMultiplier: 0.9,
    groundColor: 0x101422,
    groundRoughness: 0.14,
    groundMetalness: 0.68,
    ambientTintHex: '#F97316',
    accentHex: '#FB923C',
    hasOpenDropEdges: true,
  },
};

export interface GameModeSpec {
  id: GameModeId;
  name: string;
  shortLabel: string;
  description: string;
  rewardMultiplier: number;
  accentHex: string;
}

export const GAME_MODE_ORDER: GameModeId[] = [
  'normal',
  'storm',
  'blackout',
  'boss_rush',
  'extraction',
  'siege',
  'weekly',
  'sandbox',
  'daily',
];

export const SELECTABLE_TITLE_MODES: GameModeId[] = [
  'normal',
  'storm',
  'blackout',
  'boss_rush',
  'extraction',
  'siege',
  'weekly',
  'sandbox',
];

export const GAME_MODE_SPECS: Record<GameModeId, GameModeSpec> = {
  normal: {
    id: 'normal',
    name: 'Standard Survival',
    shortLabel: 'NORMAL',
    description: 'Dynamic weather progression & boss every 5th wave.',
    rewardMultiplier: 1,
    accentHex: '#38BDF8',
  },
  storm: {
    id: 'storm',
    name: 'Monsoon Storm',
    shortLabel: 'STORM',
    description: 'Permanent torrential rain, lightning & wet chain conduction.',
    rewardMultiplier: 1.25,
    accentHex: '#60A5FA',
  },
  blackout: {
    id: 'blackout',
    name: 'Blackout Mode',
    shortLabel: 'BLACKOUT 2X',
    description: 'Pitch black except flashlight & generators. 2x Scrap & Score!',
    rewardMultiplier: 2,
    accentHex: '#A855F7',
  },
  boss_rush: {
    id: 'boss_rush',
    name: 'Boss Rush',
    shortLabel: 'BOSS RUSH',
    description: 'Every wave deploys an apex Boss with rapid perk drafts.',
    rewardMultiplier: 1.5,
    accentHex: '#EF4444',
  },
  extraction: {
    id: 'extraction',
    name: 'Extraction Mode',
    shortLabel: 'EXTRACTION',
    description: 'Hold the W5/W10/W15 Chopper Pad for 20s to bank 3x+ Scrap, or push deeper.',
    rewardMultiplier: 1.0,
    accentHex: '#22C55E',
  },
  siege: {
    id: 'siege',
    name: 'Siege / Reactor',
    shortLabel: 'SIEGE CORE',
    description: 'Defend the central 3D Power Core from 360° waves & Siege Breakers.',
    rewardMultiplier: 1.6,
    accentHex: '#22D3EE',
  },
  weekly: {
    id: 'weekly',
    name: 'Weekly Mutator Trial',
    shortLabel: 'WEEKLY 1.5X',
    description: 'Rotating weekly combat mutator with boosted 1.5x Scrap payout.',
    rewardMultiplier: 1.5,
    accentHex: '#F97316',
  },
  sandbox: {
    id: 'sandbox',
    name: 'Firing Range / Sandbox',
    shortLabel: 'SANDBOX',
    description: 'Zero-risk test yard: spawn elites, test weapons, evolutions & Ultimates.',
    rewardMultiplier: 0,
    accentHex: '#94A3B8',
  },
  daily: {
    id: 'daily',
    name: 'Daily Seeded Run',
    shortLabel: 'DAILY SEED',
    description: 'Global UTC daily seed — identical arena, mutator & perks.',
    rewardMultiplier: 1.5,
    accentHex: '#F59E0B',
  },
};
