import React from 'react';
import { Bot, Check, Crosshair, Lock, Shield, Wrench, Zap } from 'lucide-react';
import {
  CLASS_ORDER,
  CLASS_SPECS,
  getClassProgressText,
  getPermanentUpgradeCost,
  isClassUnlocked,
  PERMANENT_UPGRADE_ORDER,
  PERMANENT_UPGRADE_SPECS,
} from '../game/career';
import { DRONE_ORDER, DRONE_SPECS } from '../game/drones';
import {
  CareerStats,
  DroneId,
  PermanentUpgradeId,
  SurvivorClassId,
  WeaponId,
} from '../game/types';
import { ULTIMATE_SPECS } from '../game/ultimates';
import { PHASE1_ARMORY_WEAPONS, WEAPON_SPECS } from '../game/weapons';

interface WorkshopPanelProps {
  career: CareerStats;
  onSelectClass: (classId: SurvivorClassId) => void;
  onBuyPermanentUpgrade: (id: PermanentUpgradeId) => void;
  onUnlockArmoryWeapon: (weaponId: WeaponId) => void;
  onSelectOrUnlockDrone: (droneId: DroneId) => void;
}

export const WorkshopPanel: React.FC<WorkshopPanelProps> = ({
  career,
  onSelectClass,
  onBuyPermanentUpgrade,
  onUnlockArmoryWeapon,
  onSelectOrUnlockDrone,
}) => {
  return (
    <div
      data-testid="workshop-panel"
      className="pointer-events-auto flex max-h-[62dvh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-700/80 p-3.5 shadow-2xl sm:p-4"
      style={{ backgroundColor: 'rgba(9, 10, 15, 0.95)' }}
    >
      {/* Survivor Classes */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-white uppercase">
            <Shield className="h-3.5 w-3.5 text-cyan-300" />
            <span>Survivor Classes</span>
          </div>
          <span className="font-mono-tabular text-[10px] font-semibold text-slate-400">
            Active: {CLASS_SPECS[career.selectedClass].name}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CLASS_ORDER.map((id) => {
            const spec = CLASS_SPECS[id];
            const ult = ULTIMATE_SPECS[id];
            const unlocked = isClassUnlocked(id, career);
            const selected = career.selectedClass === id;
            const progressText = getClassProgressText(id, career);

            return (
              <div
                key={id}
                data-testid={`class-card-${id}`}
                className={`flex flex-col justify-between rounded-xl border p-2.5 ${
                  selected
                    ? 'border-cyan-400 bg-slate-900/95'
                    : 'border-slate-800 bg-[#0e111a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: spec.accentHex }}
                      />
                      <span className="text-xs font-extrabold tracking-wide text-white uppercase">
                        {spec.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {spec.roleTag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-300">
                    {spec.perksSummary}
                  </p>
                  <div className="mt-1.5 flex items-start gap-1 rounded border border-purple-500/30 bg-purple-950/25 px-1.5 py-1 text-[10px] text-purple-200">
                    <Zap className="mt-0.5 h-3 w-3 shrink-0 text-purple-300" />
                    <span>
                      <strong className="uppercase">Ult [Q]: {ult.name}</strong> —{' '}
                      {ult.description}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-[10px] font-semibold text-slate-400">
                    {unlocked ? spec.unlockRequirementText : progressText}
                  </span>
                  <button
                    type="button"
                    data-testid={`class-action-${id}`}
                    disabled={!unlocked || selected}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      if (unlocked && !selected) {
                        onSelectClass(id);
                      }
                    }}
                    className={`flex min-h-[34px] cursor-pointer items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                      selected
                        ? 'border border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                        : unlocked
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Active</span>
                      </>
                    ) : unlocked ? (
                      <span>Select</span>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        <span>Locked</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permanent Scrap Skill Tree */}
      <div className="border-t border-slate-800 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-white uppercase">
            <Wrench className="h-3.5 w-3.5 text-amber-400" />
            <span>Permanent Scrap Armory</span>
          </div>
          <span
            data-testid="scrap-balance"
            className="font-mono-tabular rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-extrabold text-amber-300"
          >
            {career.scrap} SCRAP
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERMANENT_UPGRADE_ORDER.map((id) => {
            const spec = PERMANENT_UPGRADE_SPECS[id];
            const level = career.permanentUpgrades[id];
            const isMax = level >= spec.maxLevel;
            const cost = getPermanentUpgradeCost(id, level);
            const canAfford = !isMax && career.scrap >= cost;

            return (
              <div
                key={id}
                data-testid={`perm-upgrade-${id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#0e111a] p-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-extrabold tracking-wide text-white uppercase">
                      {spec.name}
                    </span>
                    <span className="font-mono-tabular text-[10px] font-bold text-amber-300">
                      Lv {level}/{spec.maxLevel}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {spec.effectPerLevel}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid={`buy-perm-${id}`}
                  disabled={!canAfford || isMax}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    if (canAfford && !isMax) {
                      onBuyPermanentUpgrade(id);
                    }
                  }}
                  className={`font-mono-tabular min-h-[38px] shrink-0 cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                    isMax
                      ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : canAfford
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  {isMax ? 'Maxed' : `${cost} Scrap`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Autonomous Combat Drones */}
      <div className="border-t border-slate-800 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-white uppercase">
            <Bot className="h-3.5 w-3.5 text-cyan-300" />
            <span>Autonomous Combat Drones</span>
          </div>
          <span className="font-mono-tabular text-[10px] font-semibold text-slate-400">
            Active:{' '}
            {career.equippedDrone === 'none'
              ? 'None'
              : DRONE_SPECS[career.equippedDrone].name}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DRONE_ORDER.map((id) => {
            const spec = DRONE_SPECS[id];
            const unlocked = career.unlockedDrones.includes(id);
            const equipped = career.equippedDrone === id;
            const canAfford = career.scrap >= spec.scrapCost;

            return (
              <div
                key={id}
                data-testid={`drone-card-${id}`}
                className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 ${
                  equipped
                    ? 'border-cyan-400 bg-slate-900/95'
                    : 'border-slate-800 bg-[#0e111a]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: spec.accentHex }}
                    />
                    <span className="truncate text-xs font-extrabold tracking-wide text-white uppercase">
                      {spec.name}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-slate-400">
                    {spec.description}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid={`drone-action-${id}`}
                  disabled={!unlocked && !canAfford}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectOrUnlockDrone(id);
                  }}
                  className={`font-mono-tabular min-h-[36px] shrink-0 cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                    equipped
                      ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                      : unlocked
                        ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                        : canAfford
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  {equipped
                    ? 'Equipped'
                    : unlocked
                      ? 'Equip'
                      : `${spec.scrapCost} Scrap`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Armory Weapons (Unlock Permanently for Wave 1 or Draft Mid-Run) */}
      <div className="border-t border-slate-800 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-white uppercase">
            <Crosshair className="h-3.5 w-3.5 text-amber-400" />
            <span>Special Armory Weapons</span>
          </div>
          <span className="font-mono-tabular text-[10px] font-semibold text-slate-400">
            {career.unlockedWeapons.length}/{PHASE1_ARMORY_WEAPONS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PHASE1_ARMORY_WEAPONS.map((wId) => {
            const spec = WEAPON_SPECS[wId];
            const cost = spec.scrapUnlockCost ?? 50;
            const unlocked = career.unlockedWeapons.includes(wId);
            const canAfford = !unlocked && career.scrap >= cost;

            return (
              <div
                key={wId}
                data-testid={`armory-weapon-${wId}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#0e111a] p-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-extrabold tracking-wide text-white uppercase">
                    {spec.name}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-400">
                    {spec.role}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid={`unlock-weapon-${wId}`}
                  disabled={unlocked || !canAfford}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    if (!unlocked && canAfford) {
                      onUnlockArmoryWeapon(wId);
                    }
                  }}
                  className={`font-mono-tabular min-h-[36px] shrink-0 cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                    unlocked
                      ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : canAfford
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  {unlocked ? 'Unlocked' : `${cost} Scrap`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
