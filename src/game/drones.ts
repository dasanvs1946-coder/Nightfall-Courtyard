import { DroneId } from './types';

export interface DroneSpec {
  id: Exclude<DroneId, 'none'>;
  name: string;
  shortLabel: string;
  scrapCost: number;
  role: string;
  description: string;
  accentHex: string;
  colorHex: number;
  cooldownSec: number;
  range: number;
}

export const DRONE_ORDER: Array<Exclude<DroneId, 'none'>> = [
  'laser_scout',
  'cryo_drone',
  'medic_drone',
  'scrap_magnet',
];

export const ALL_DRONE_IDS: DroneId[] = ['none', ...DRONE_ORDER];

export const DRONE_SPECS: Record<Exclude<DroneId, 'none'>, DroneSpec> = {
  laser_scout: {
    id: 'laser_scout',
    name: 'Laser Scout Drone',
    shortLabel: 'LASER',
    scrapCost: 50,
    role: 'Autonomous Striker',
    description: 'Orbits you and fires rapid cyan precision laser bolts at nearby threats.',
    accentHex: '#38BDF8',
    colorHex: 0x38bdf8,
    cooldownSec: 0.72,
    range: 15,
  },
  cryo_drone: {
    id: 'cryo_drone',
    name: 'Cryo Pulse Drone',
    shortLabel: 'CRYO',
    scrapCost: 65,
    role: 'Frost Emitter',
    description: 'Releases periodic cryo waves that chill and slow nearby infected by 30%.',
    accentHex: '#22D3EE',
    colorHex: 0x22d3ee,
    cooldownSec: 3.4,
    range: 7.5,
  },
  medic_drone: {
    id: 'medic_drone',
    name: 'Medic Nanite Drone',
    shortLabel: 'MEDIC',
    scrapCost: 80,
    role: 'Field Support',
    description: 'Periodically patches armor plating, restoring +6 HP every 6.5s.',
    accentHex: '#22C55E',
    colorHex: 0x22c55e,
    cooldownSec: 6.5,
    range: 4,
  },
  scrap_magnet: {
    id: 'scrap_magnet',
    name: 'Magnet Salvage Drone',
    shortLabel: 'MAGNET',
    scrapCost: 60,
    role: 'Pickup Tractor',
    description: 'Pulls ammo, medkits, and rapid-fire crates across 13m + grants +25% Scrap.',
    accentHex: '#F59E0B',
    colorHex: 0xf59e0b,
    cooldownSec: 0.25,
    range: 13.0,
  },
};
