import { GadgetId, PerkId, SynergyId } from './types';

export interface SynergySpec {
  id: SynergyId;
  name: string;
  perkId: PerkId;
  gadgetId: GadgetId;
  description: string;
  accentHex: string;
}

export const SYNERGY_ORDER: SynergyId[] = [
  'frost_mortar',
  'electric_fence',
  'nuke_decoy',
  'twin_tripmine',
];

export const SYNERGY_SPECS: Record<SynergyId, SynergySpec> = {
  frost_mortar: {
    id: 'frost_mortar',
    name: 'Frost-Shell Artillery',
    perkId: 'cryo_rounds',
    gadgetId: 'mortar',
    description: 'Mortar Strike detonations deep-freeze survivors in blast radius for 3.6s.',
    accentHex: '#38BDF8',
  },
  electric_fence: {
    id: 'electric_fence',
    name: 'High-Voltage Electric Fence',
    perkId: 'shockwave_coil',
    gadgetId: 'wire',
    description: 'Barbed Wire discharges continuous arc-shock pulses dealing 3.2x shock damage.',
    accentHex: '#F59E0B',
  },
  nuke_decoy: {
    id: 'nuke_decoy',
    name: 'Proximity Nuke Decoy',
    perkId: 'incendiary',
    gadgetId: 'decoy',
    description: 'Decoy Flares detonate in a massive incendiary firebomb blast on burnout.',
    accentHex: '#F97316',
  },
  twin_tripmine: {
    id: 'twin_tripmine',
    name: 'Overcharged Twin-Beam Tripmine',
    perkId: 'piercing_core',
    gadgetId: 'tripmine',
    description: 'Laser Tripmines gain 2 detonation charges and wider armor-piercing shock blasts.',
    accentHex: '#EF4444',
  },
};

export function evaluateActiveSynergies(
  ownedPerks: PerkId[],
  equippedGadget?: GadgetId,
): SynergyId[] {
  const perkSet = new Set(ownedPerks);
  return SYNERGY_ORDER.filter((id) => {
    const spec = SYNERGY_SPECS[id];
    if (!perkSet.has(spec.perkId)) return false;
    if (equippedGadget) return spec.gadgetId === equippedGadget || perkSet.has(spec.perkId);
    return true;
  });
}

export function isSynergyUnlocked(
  synergyId: SynergyId,
  ownedPerks: PerkId[],
): boolean {
  const spec = SYNERGY_SPECS[synergyId];
  return ownedPerks.includes(spec.perkId);
}
