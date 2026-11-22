import React from 'react';
import {
  ChevronUp,
  Crosshair,
  Flame,
  HeartPulse,
  Layers,
  ShieldAlert,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { DRONE_SPECS } from '../game/drones';
import { GADGET_ORDER, GADGET_SPECS } from '../game/gadgets';
import {
  CURSED_PERK_SPECS,
  EVOLUTION_SPECS,
  getWeaponEvolutionHint,
  PERK_SPECS,
} from '../game/perks';
import { SYNERGY_SPECS } from '../game/synergies';
import { TACTICAL_GEAR_ORDER, TACTICAL_GEAR_SPECS } from '../game/tacticalGear';
import {
  CursedPerkId,
  DroneId,
  EvolutionId,
  GadgetId,
  PerkId,
  SynergyId,
  TacticalGearId,
  UpgradeId,
  UpgradeLevels,
  WeaponId,
  WeaponMasteryLevels,
} from '../game/types';
import {
  canPurchaseUpgrade,
  canPurchaseWeaponMastery,
  getUpgradeCost,
  getWeaponMasteryCost,
  MAX_WEAPON_MASTERY_LEVEL,
  UPGRADE_ORDER,
  UPGRADE_SPECS,
  WAVE_CLEAR_UP_BOSS,
  WAVE_CLEAR_UP_REGULAR,
} from '../game/upgrades';
import { WEAPON_SPECS } from '../game/weapons';

interface UpgradeTabProps {
  open: boolean;
  upgradePoints: number;
  killsTowardNextUp: number;
  killsPerUp: number;
  upgradeLevels: UpgradeLevels;
  weaponMastery: WeaponMasteryLevels;
  activeWeapon: WeaponId;
  equippedGear: TacticalGearId;
  equippedGadget: GadgetId;
  equippedDrone: DroneId;
  ownedPerks: PerkId[];
  ownedCursedPerks: CursedPerkId[];
  evolvedWeapons: EvolutionId[];
  activeSynergies: SynergyId[];
  onToggle: () => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onBuyMastery: (weaponId: WeaponId) => void;
  onEquipGear: (id: TacticalGearId) => void;
  onEquipGadget: (id: GadgetId) => void;
}

const UPGRADE_ICONS: Record<UpgradeId, React.ReactNode> = {
  damage: <Crosshair className="h-4 w-4 text-amber-400" />,
  handling: <Zap className="h-4 w-4 text-sky-400" />,
  capacity: <Layers className="h-4 w-4 text-indigo-400" />,
  vitality: <HeartPulse className="h-4 w-4 text-emerald-400" />,
  mobility: <ShieldAlert className="h-4 w-4 text-cyan-400" />,
};

export const UpgradeTab: React.FC<UpgradeTabProps> = ({
  open,
  upgradePoints,
  killsTowardNextUp,
  killsPerUp,
  upgradeLevels,
  weaponMastery,
  activeWeapon,
  equippedGear,
  equippedGadget,
  equippedDrone,
  ownedPerks,
  ownedCursedPerks,
  evolvedWeapons,
  activeSynergies,
  onToggle,
  onBuyUpgrade,
  onBuyMastery,
  onEquipGear,
  onEquipGadget,
}) => {
  const hasPoints = upgradePoints > 0;
  const activeWeaponSpec = WEAPON_SPECS[activeWeapon];
  const masteryLv = weaponMastery[activeWeapon] ?? 0;
  const masteryMaxed = masteryLv >= MAX_WEAPON_MASTERY_LEVEL;
  const masteryCost = getWeaponMasteryCost(masteryLv);
  const canAffordMastery = canPurchaseWeaponMastery(
    weaponMastery,
    upgradePoints,
    activeWeapon,
  );

  const evoHint = getWeaponEvolutionHint(activeWeapon);

  return (
    <div className="pointer-events-auto relative mt-1.5 flex flex-col items-start">
      {/* Compact Small Upgrades Tab Button */}
      <button
        type="button"
        tabIndex={-1}
        data-testid="upgrade-tab-toggle"
        aria-expanded={open}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          onToggle();
          e.currentTarget.blur();
        }}
        className={`flex min-h-[38px] cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-colors ${
          open
            ? 'border-amber-400/80 text-white'
            : hasPoints
              ? 'border-amber-500/75 text-amber-200 hover:border-amber-400'
              : 'border-slate-700/70 text-slate-300 hover:border-slate-500'
        }`}
        style={{ backgroundColor: 'rgba(10, 15, 24, 0.88)' }}
      >
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-amber-400" />
        )}
        <span className="font-display text-xs font-bold tracking-wider uppercase">
          Upgrades
        </span>
        <span
          data-testid="upgrade-points-badge"
          className={`font-mono-tabular whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold ${
            hasPoints
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {upgradePoints} UP
        </span>
        <span className="font-mono-tabular hidden text-[10px] text-slate-400 sm:inline">
          {killsTowardNextUp}/{killsPerUp}
        </span>
      </button>

      {/* Collapsible Compact Upgrade Drawer */}
      {open && (
        <div
          data-testid="upgrade-drawer"
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-full left-0 z-40 mt-1.5 w-[min(336px,calc(100vw-1.5rem))] rounded-xl border border-slate-700/85 p-2.5 shadow-2xl"
          style={{ backgroundColor: 'rgba(10, 15, 24, 0.96)' }}
        >
          <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div>
              <div className="font-display text-sm font-extrabold tracking-wide text-white uppercase">
                Field Upgrades
              </div>
              <div className="text-[10px] text-slate-400">
                +1 UP / {killsPerUp} kills · +{WAVE_CLEAR_UP_REGULAR} Wave · +{WAVE_CLEAR_UP_BOSS} Boss
              </div>
            </div>
            <div className="font-mono-tabular text-xs font-bold text-amber-400">
              {upgradePoints} UP
            </div>
          </div>

          <div className="flex max-h-[58dvh] flex-col gap-1.5 overflow-y-auto pr-0.5">
            {/* Active Weapon Mastery Row */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/45 bg-amber-950/25 px-2 py-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                  <Flame className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-bold text-amber-200">
                      {activeWeaponSpec.name} Mastery
                    </span>
                    <span className="font-mono-tabular shrink-0 text-[10px] font-bold text-amber-300">
                      Lv {masteryLv}/{MAX_WEAPON_MASTERY_LEVEL}
                    </span>
                  </div>
                  <div className="truncate text-[10px] text-slate-300">
                    +10% Damage / Lv {evoHint ? `· ${evoHint}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                tabIndex={-1}
                data-testid="buy-mastery-btn"
                disabled={!canAffordMastery}
                onClick={(e) => {
                  onBuyMastery(activeWeapon);
                  e.currentTarget.blur();
                }}
                className={`font-mono-tabular min-h-[32px] shrink-0 cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
                  masteryMaxed
                    ? 'bg-slate-800 text-emerald-400'
                    : canAffordMastery
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-slate-800/80 text-slate-500'
                }`}
              >
                {masteryMaxed ? 'MAX' : `${masteryCost} UP`}
              </button>
            </div>

            {/* Compact Mid-Run Tactical Gear & Gadget Switchers */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-1.5">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                <span className="text-slate-400">Tactical Gear [G]</span>
                <span className="font-mono-tabular text-cyan-300">
                  {TACTICAL_GEAR_SPECS[equippedGear].cooldownSec}s CD
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {TACTICAL_GEAR_ORDER.map((gearId) => {
                  const gear = TACTICAL_GEAR_SPECS[gearId];
                  const active = gearId === equippedGear;
                  return (
                    <button
                      key={gearId}
                      type="button"
                      tabIndex={-1}
                      data-testid={`equip-gear-${gearId}`}
                      onClick={(e) => {
                        onEquipGear(gearId);
                        e.currentTarget.blur();
                      }}
                      className={`min-h-[28px] cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-700/70 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {gear.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 mb-1 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                <span className="text-slate-400">Gadget Slot [E]</span>
                <span className="font-mono-tabular text-amber-300">
                  {GADGET_SPECS[equippedGadget].cooldownSec}s CD
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {GADGET_ORDER.map((gadgetId) => {
                  const g = GADGET_SPECS[gadgetId];
                  const active = gadgetId === equippedGadget;
                  return (
                    <button
                      key={gadgetId}
                      type="button"
                      tabIndex={-1}
                      data-testid={`equip-gadget-${gadgetId}`}
                      onClick={(e) => {
                        onEquipGadget(gadgetId);
                        e.currentTarget.blur();
                      }}
                      className={`min-h-[28px] cursor-pointer rounded border px-1 py-0.5 text-[9px] font-bold tracking-wide uppercase transition-colors ${
                        active
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-slate-700/70 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {g.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {UPGRADE_ORDER.map((id) => {
              const spec = UPGRADE_SPECS[id];
              const level = upgradeLevels[id];
              const isMaxed = level >= spec.maxLevel;
              const cost = getUpgradeCost(level);
              const affordable = canPurchaseUpgrade(
                upgradeLevels,
                upgradePoints,
                id,
              );

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/75 px-2 py-1.5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                      {UPGRADE_ICONS[id]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate text-xs font-bold text-slate-100">
                          {spec.name}
                        </span>
                        <span className="font-mono-tabular shrink-0 text-[10px] font-semibold text-slate-300">
                          Lv {level}/{spec.maxLevel}
                        </span>
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {spec.effectSummary}
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full transition-[width] duration-150 ${
                            isMaxed ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((level / spec.maxLevel) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid={`buy-upgrade-${id}`}
                    disabled={!affordable}
                    onClick={(e) => {
                      onBuyUpgrade(id);
                      e.currentTarget.blur();
                    }}
                    className={`font-mono-tabular min-h-[34px] shrink-0 cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
                      isMaxed
                        ? 'bg-slate-800 text-emerald-400'
                        : affordable
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-800/80 text-slate-500'
                    }`}
                  >
                    {isMaxed ? 'MAX' : `${cost} UP`}
                  </button>
                </div>
              );
            })}

            {/* Owned Perks, Synergies, Cursed Pacts, Drone & Evolutions Summary */}
            {(ownedPerks.length > 0 ||
              ownedCursedPerks.length > 0 ||
              activeSynergies.length > 0 ||
              evolvedWeapons.length > 0 ||
              equippedDrone !== 'none') && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/75 p-2">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  <Sparkles className="h-3 w-3" />
                  <span>Active Perks, Synergies &amp; Evolutions</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {equippedDrone !== 'none' && (
                    <span className="rounded border border-cyan-400/60 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-cyan-200 uppercase">
                      Drone: {DRONE_SPECS[equippedDrone].shortLabel}
                    </span>
                  )}
                  {evolvedWeapons.map((evo) => (
                    <span
                      key={evo}
                      className="rounded border border-amber-400/70 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-200 uppercase"
                    >
                      {EVOLUTION_SPECS[evo].name}
                    </span>
                  ))}
                  {activeSynergies.map((syn) => (
                    <span
                      key={syn}
                      className="rounded border border-sky-400/60 bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-200 uppercase"
                    >
                      {SYNERGY_SPECS[syn].name}
                    </span>
                  ))}
                  {ownedCursedPerks.map((cursed) => (
                    <span
                      key={cursed}
                      className="rounded border border-rose-500/70 bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-200 uppercase"
                    >
                      {CURSED_PERK_SPECS[cursed].name}
                    </span>
                  ))}
                  {ownedPerks.map((perk) => (
                    <span
                      key={perk}
                      className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300"
                    >
                      {PERK_SPECS[perk].name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
