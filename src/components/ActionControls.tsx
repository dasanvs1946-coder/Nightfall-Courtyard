import React from 'react';
import { WEAPON_SPECS } from '../game/weapons';
import { getEffectiveMagSize } from '../game/upgrades';
import { UpgradeLevels, WeaponId, WeaponRuntimeState } from '../game/types';

interface ActionControlsProps {
  activeWeapon: WeaponId;
  weapons: WeaponRuntimeState[];
  upgradeLevels: UpgradeLevels;
  dashCooldownProgress: number; // 1 = ready
  isReloading: boolean;
  reloadProgress: number; // 0..1
  onDash: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  activeWeapon,
  weapons,
  upgradeLevels,
  dashCooldownProgress,
  isReloading,
  reloadProgress,
  onDash,
  onReload,
  onSwitchWeapon,
}) => {
  const dashReady = dashCooldownProgress >= 0.999;
  const activeState = weapons.find((w) => w.id === activeWeapon);
  const spec = WEAPON_SPECS[activeWeapon];
  const magCapacity = getEffectiveMagSize(activeWeapon, upgradeLevels);
  const unlockedCount = weapons.filter((w) => w.unlocked).length;
  const canReload =
    !isReloading &&
    activeState !== undefined &&
    activeState.mag < magCapacity &&
    (spec.infiniteReserve || activeState.reserve > 0);

  return (
    <div className="pointer-events-auto flex items-center gap-2.5">
      {/* Switch Weapon Button */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Switch Weapon"
        disabled={unlockedCount <= 1}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSwitchWeapon();
          e.currentTarget.blur();
        }}
        className="relative flex h-13 w-13 flex-col items-center justify-center rounded-xl border text-slate-100 transition-transform active:scale-95 disabled:opacity-40"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderColor:
            unlockedCount > 1
              ? 'rgba(56, 189, 248, 0.55)'
              : 'rgba(148, 163, 184, 0.25)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 2l4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="M7 22l-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
        <span className="mt-0.5 text-[9px] font-semibold tracking-wider text-sky-300 uppercase">
          Swap
        </span>
      </button>

      {/* Reload Button */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Reload Weapon"
        disabled={!canReload && !isReloading}
        onPointerDown={(e) => {
          e.stopPropagation();
          onReload();
          e.currentTarget.blur();
        }}
        className="relative flex h-13 w-13 flex-col items-center justify-center overflow-hidden rounded-xl border text-slate-100 transition-transform active:scale-95 disabled:opacity-45"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderColor: isReloading
            ? 'rgba(245, 158, 11, 0.85)'
            : 'rgba(245, 158, 11, 0.5)',
        }}
      >
        {isReloading && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-amber-500/35"
            style={{ height: `${Math.round(reloadProgress * 100)}%` }}
          />
        )}
        <svg
          viewBox="0 0 24 24"
          className="relative z-10 h-5 w-5 text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
        <span className="relative z-10 mt-0.5 text-[9px] font-semibold tracking-wider text-amber-300 uppercase">
          {isReloading ? '...' : 'Reload'}
        </span>
      </button>

      {/* Dash Button with Cooldown Indicator */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Dash"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDash();
          e.currentTarget.blur();
        }}
        className="relative flex h-14 w-14 flex-col items-center justify-center overflow-hidden rounded-xl border text-white transition-transform active:scale-95"
        style={{
          backgroundColor: dashReady
            ? 'rgba(14, 165, 233, 0.28)'
            : 'rgba(15, 23, 42, 0.85)',
          borderColor: dashReady
            ? 'rgba(56, 189, 248, 0.9)'
            : 'rgba(148, 163, 184, 0.35)',
        }}
      >
        {!dashReady && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-sky-500/30"
            style={{ height: `${Math.round(dashCooldownProgress * 100)}%` }}
          />
        )}
        <svg
          viewBox="0 0 24 24"
          className="relative z-10 h-5 w-5 text-sky-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="relative z-10 mt-0.5 text-[9px] font-bold tracking-wider text-sky-200 uppercase">
          {dashReady ? 'Dash' : `${Math.round(dashCooldownProgress * 100)}%`}
        </span>
      </button>
    </div>
  );
};
