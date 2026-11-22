import { GadgetId } from './types';

export interface GadgetSpec {
  id: GadgetId;
  name: string;
  shortLabel: string;
  cooldownSec: number;
  description: string;
  damage: number;
  radius: number;
  durationSec?: number;
  maxActive: number;
  accentHex: string;
}

export const GADGET_ORDER: GadgetId[] = [
  'tripmine',
  'decoy',
  'wire',
  'mortar',
];

export const GADGET_SPECS: Record<GadgetId, GadgetSpec> = {
  tripmine: {
    id: 'tripmine',
    name: 'Laser Tripmine',
    shortLabel: 'TRIP',
    cooldownSec: 15,
    description: 'Projects a ruby laser beam that detonates when crossed.',
    damage: 310,
    radius: 4.2,
    maxActive: 3,
    accentHex: '#EF4444',
  },
  decoy: {
    id: 'decoy',
    name: 'Decoy Flare',
    shortLabel: 'DECOY',
    cooldownSec: 20,
    description: 'Lures nearby infected away from you for 5s before burning out.',
    damage: 0,
    radius: 13.5,
    durationSec: 5.0,
    maxActive: 1,
    accentHex: '#F59E0B',
  },
  wire: {
    id: 'wire',
    name: 'Barbed Wire',
    shortLabel: 'WIRE',
    cooldownSec: 18,
    description: 'Chokepoint razor snare slowing zombies by 50% for 14s.',
    damage: 14,
    radius: 2.8,
    durationSec: 14.0,
    maxActive: 2,
    accentHex: '#94A3B8',
  },
  mortar: {
    id: 'mortar',
    name: 'Mortar Strike',
    shortLabel: 'MORTAR',
    cooldownSec: 24,
    description: 'Calls a high-explosive shell ahead of your aim for boss armor break.',
    damage: 460,
    radius: 5.2,
    durationSec: 1.05,
    maxActive: 2,
    accentHex: '#F97316',
  },
};

export function getNextGadget(current: GadgetId): GadgetId {
  const idx = GADGET_ORDER.indexOf(current);
  return GADGET_ORDER[(idx + 1) % GADGET_ORDER.length];
}
