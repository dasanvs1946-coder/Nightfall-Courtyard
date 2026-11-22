import { ARENA_HALF_SIZE, COURTYARD_OBSTACLES } from './collision';
import { ArenaId, GameModeId, ObstacleBox } from './types';

export interface ArenaCoord {
  x: number;
  z: number;
}

export interface ArenaSpec {
  id: ArenaId;
  name: string;
  shortLabel: string;
  subtitle: string;
  halfSize: number;
  obstacles: ObstacleBox[];
  barrelCoords: ArenaCoord[];
  generatorCoords: [ArenaCoord, ArenaCoord];
  supplyDropCoords: ArenaCoord[];
  spawnIntervalMultiplier: number;
  groundColor: number;
  groundRoughness: number;
  groundMetalness: number;
  ambientTintHex: string;
  accentHex: string;
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

export const ARENA_ORDER: ArenaId[] = ['courtyard', 'parking_deck', 'helipad'];

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
    generatorCoords: [
      { x: -11.5, z: 0 },
      { x: 11.5, z: 0 },
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
    generatorCoords: [
      { x: 0, z: -7.5 },
      { x: 0, z: 7.5 },
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
    generatorCoords: [
      { x: -10.5, z: 0 },
      { x: 10.5, z: 0 },
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
  'daily',
];

export const SELECTABLE_TITLE_MODES: GameModeId[] = [
  'normal',
  'storm',
  'blackout',
  'boss_rush',
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
  daily: {
    id: 'daily',
    name: 'Daily Seeded Run',
    shortLabel: 'DAILY SEED',
    description: 'Global UTC daily seed — identical arena, mutator & perks.',
    rewardMultiplier: 1.5,
    accentHex: '#F59E0B',
  },
};
