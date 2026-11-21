import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CloudFog,
  CloudLightning,
  CloudRain,
  Moon,
  Pause,
  Skull,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FloatingDamage, HudSnapshot, UpgradeId, WeaponId } from '../game/types';
import { WEAPON_SPECS } from '../game/weapons';
import { WEATHER_PRESETS } from '../game/weather';
import { ActionControls } from './ActionControls';
import { Minimap } from './Minimap';
import { UpgradeTab } from './UpgradeTab';
import { VirtualThumbstick } from './VirtualThumbstick';

interface HudOverlayProps {
  hud: HudSnapshot;
  floatingDamages: FloatingDamage[];
  upgradesOpen: boolean;
  onMoveStick: (x: number, y: number) => void;
  onAimStick: (x: number, y: number, active: boolean) => void;
  onDash: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
  onPrevWeapon: () => void;
  onNextWeapon: () => void;
  onSelectWeapon: (id: WeaponId) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onToggleUpgrades: () => void;
  onBuyUpgrade: (id: UpgradeId) => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  floatingDamages,
  upgradesOpen,
  onMoveStick,
  onAimStick,
  onDash,
  onReload,
  onSwitchWeapon,
  onPrevWeapon,
  onNextWeapon,
  onSelectWeapon,
  onToggleMute,
  onPause,
  onToggleUpgrades,
  onBuyUpgrade,
}) => {
  const activeWeaponState =
    hud.weapons.find((w) => w.id === hud.activeWeapon) ?? hud.weapons[0];
  const unlockedWeapons = hud.weapons.filter((w) => w.unlocked);
  const nextLockedWeapon = hud.weapons.find((w) => !w.unlocked);
  const activeSpec = WEAPON_SPECS[hud.activeWeapon];
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const ghostPct = Math.max(hpPct, Math.min(100, (hud.ghostHp / hud.maxHp) * 100));
  const lowHp = hpPct <= 30;
  const bossPct = hud.activeBoss
    ? Math.max(0, Math.min(100, (hud.activeBoss.hp / hud.activeBoss.maxHp) * 100))
    : 0;
  const weatherLabel = WEATHER_PRESETS[hud.weather].label;
  const WeatherIcon =
    hud.weather === 'storm'
      ? CloudLightning
      : hud.weather === 'rain'
        ? CloudRain
        : hud.weather === 'mist'
          ? CloudFog
          : Moon;
  const bloodAlpha = Math.max(0, Math.min(1, hud.bloodSplatter));
  const seedShift = (hud.bloodSeed % 5) * 14;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-5">
      {/* Dynamic Screen Blood Splatter on Player Damage */}
      {bloodAlpha > 0.02 && (
        <div
          aria-hidden="true"
          data-testid="screen-blood-splatter"
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-150"
          style={{
            opacity: bloodAlpha,
            boxShadow: `inset 0 0 110px rgba(185, 28, 28, ${0.55 * bloodAlpha})`,
          }}
        >
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <g fill="rgba(168, 16, 24, 0.72)">
              <circle cx={90 + seedShift} cy={140} r={24} />
              <circle cx={125 + seedShift} cy={175} r={11} />
              <ellipse cx={68} cy={220 + seedShift} rx={12} ry={28} />
              <circle cx={910 - seedShift} cy={160} r={28} />
              <circle cx={872 - seedShift} cy={198} r={13} />
              <ellipse cx={938} cy={250 + seedShift} rx={10} ry={34} />
              <circle cx={140 + seedShift} cy={860} r={26} />
              <circle cx={180 + seedShift} cy={835} r={10} />
              <ellipse cx={82} cy={790 - seedShift} rx={11} ry={30} />
              <circle cx={885 - seedShift} cy={855} r={25} />
              <circle cx={845 - seedShift} cy={820} r={12} />
              <ellipse cx={930} cy={780 - seedShift} rx={13} ry={32} />
              <circle cx={490 + seedShift} cy={44} r={18} />
              <circle cx={520 - seedShift} cy={958} r={20} />
            </g>
          </svg>
        </div>
      )}

      {/* Low HP peripheral crimson edge vignette */}
      {lowHp && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.55)',
          }}
        />
      )}

      {/* Floating Damage Numbers Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      >
        {floatingDamages.map((d) => {
          const opacity = Math.max(0, 1 - d.age / d.duration);
          return (
            <div
              key={d.id}
              className={`font-mono-tabular hud-text-shadow absolute -translate-x-1/2 -translate-y-1/2 font-bold ${
                d.isCrit ? 'text-base text-amber-300' : 'text-sm text-white'
              }`}
              style={{
                left: d.x,
                top: d.y,
                opacity,
              }}
            >
              {d.amount}
            </div>
          );
        })}
      </div>

      {/* Top HUD Row (Compact Perimeter Clusters, fits cleanly within 390px mobile) */}
      <div className="relative z-30 flex items-start justify-between gap-1.5 sm:gap-3">
        {/* Top-Left Column: Health, Wave, Score + Small Upgrades Tab */}
        <div className="flex flex-col items-start">
          <div
            className="pointer-events-auto flex w-[138px] flex-col gap-1 rounded-xl border border-slate-700/70 px-2 py-1.5 sm:w-auto sm:min-w-[230px] sm:gap-1.5 sm:px-3 sm:py-2"
            style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
          >
            <div className="flex items-center justify-between gap-1.5 sm:gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase sm:text-[10px]">
                  HP
                </span>
                <span
                  className={`font-mono-tabular text-xs font-bold sm:text-base ${
                    lowHp ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {hud.hp}
                </span>
                <span className="font-mono-tabular hidden text-[10px] text-slate-500 sm:inline">
                  /{hud.maxHp}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-300 sm:gap-2 sm:text-xs">
                <span className="font-display text-xs font-bold tracking-wide text-amber-400 sm:text-sm">
                  W{hud.wave}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="font-mono-tabular whitespace-nowrap text-slate-300">
                  {hud.zombiesRemaining} left
                </span>
              </div>
            </div>

            {/* Health bar with delayed ghost damage bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-sm bg-slate-900 sm:h-2.5 sm:w-52">
              <div
                className="absolute inset-y-0 left-0 bg-red-500/75"
                style={{ width: `${ghostPct}%` }}
              />
              <div
                className={`absolute inset-y-0 left-0 transition-[width] duration-100 ${
                  lowHp ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-1.5 text-[10px] sm:gap-3 sm:text-xs">
              <div className="flex items-baseline gap-1">
                <span className="hidden text-[9px] font-semibold tracking-wider text-slate-400 uppercase sm:inline sm:text-[10px]">
                  Score
                </span>
                <span className="font-mono-tabular font-bold text-white">
                  {hud.score}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase sm:text-[10px]">
                  Best
                </span>
                <span className="font-mono-tabular font-semibold text-amber-300">
                  {hud.highScore}
                </span>
              </div>
            </div>
          </div>

          <UpgradeTab
            open={upgradesOpen}
            upgradePoints={hud.upgradePoints}
            killsTowardNextUp={hud.killsTowardNextUp}
            killsPerUp={hud.killsPerUp}
            upgradeLevels={hud.upgradeLevels}
            onToggle={onToggleUpgrades}
            onBuyUpgrade={onBuyUpgrade}
          />
        </div>

        {/* Top-Right: Weapon, Ammo, Rapid Fire, Weather & Utility Buttons */}
        <div className="pointer-events-auto flex items-start gap-1.5 sm:gap-2">
          <div className="flex flex-col items-end gap-1.5">
            <div
              className="flex max-w-[166px] flex-col items-end gap-1 rounded-xl border border-slate-700/70 px-2 py-1.5 sm:max-w-none sm:px-3 sm:py-2"
              style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
            >
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-display max-w-[78px] truncate text-xs font-bold tracking-wide text-slate-100 uppercase sm:max-w-none sm:text-sm">
                {activeSpec.name}
              </span>
              <span className="font-mono-tabular text-xs font-bold text-amber-400 sm:text-lg">
                {hud.isReloading
                  ? 'RLD'
                  : `${activeWeaponState.mag}/${
                      activeSpec.infiniteReserve ? '∞' : activeWeaponState.reserve
                    }`}
              </span>
            </div>

            {/* Weapon arsenal counter + prev/next cycle */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                tabIndex={-1}
                disabled={unlockedWeapons.length <= 1}
                aria-label="Previous Weapon"
                onClick={(e) => {
                  onPrevWeapon();
                  e.currentTarget.blur();
                }}
                className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-35"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="font-mono-tabular text-[10px] font-semibold text-slate-300">
                {unlockedWeapons.length}/{hud.weapons.length}
              </span>
              <button
                type="button"
                tabIndex={-1}
                disabled={unlockedWeapons.length <= 1}
                aria-label="Next Weapon"
                onClick={(e) => {
                  onNextWeapon();
                  e.currentTarget.blur();
                }}
                className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-35"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Unlocked weapon tabs (compact single-row scroll on mobile, wrapped grid on desktop) */}
            <div
              data-testid="unlocked-weapons-bar"
              className="flex max-w-[144px] flex-nowrap gap-1 overflow-x-auto sm:max-w-[290px] sm:flex-wrap sm:justify-end sm:overflow-visible"
            >
              {unlockedWeapons.map((w) => {
                const isSelected = w.id === hud.activeWeapon;
                return (
                  <button
                    key={w.id}
                    type="button"
                    tabIndex={-1}
                    aria-label={`Equip ${WEAPON_SPECS[w.id].name}`}
                    onClick={(e) => {
                      onSelectWeapon(w.id);
                      e.currentTarget.blur();
                    }}
                    className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold tracking-wide uppercase transition-colors sm:px-1.5 sm:text-[10px] ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {WEAPON_SPECS[w.id].shortCode}
                  </button>
                );
              })}
            </div>
            {nextLockedWeapon && (
              <div className="font-mono-tabular text-[9px] text-slate-400">
                Next: {WEAPON_SPECS[nextLockedWeapon.id].shortCode} @ W
                {WEAPON_SPECS[nextLockedWeapon.id].unlockWave}
              </div>
            )}

              {hud.rapidFireRemaining > 0 && (
                <div className="font-mono-tabular text-[10px] font-bold text-red-400 sm:text-[11px]">
                  RAPID {hud.rapidFireRemaining.toFixed(1)}s
                </div>
              )}
            </div>

            <div
              data-testid="weather-badge"
              aria-label={`Weather: ${weatherLabel}`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/70 px-2.5 py-1 text-[10px] font-bold tracking-wider text-sky-200 uppercase sm:text-[11px]"
              style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
            >
              <WeatherIcon className="h-3.5 w-3.5 text-sky-300" />
              <span>{weatherLabel}</span>
            </div>
          </div>

          {/* Utility Buttons: Mute & Pause */}
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              aria-label={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                onToggleMute();
                e.currentTarget.blur();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 text-slate-200 hover:border-slate-500 sm:h-11 sm:w-11"
              style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
            >
              {hud.muted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game"
              onClick={(e) => {
                onPause();
                e.currentTarget.blur();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 text-slate-200 hover:border-slate-500 sm:h-11 sm:w-11"
              style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
            >
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Boss Health Bar & Transient Wave Banner (Stacked cleanly below Top HUD Row, zero overlap) */}
      <div className="pointer-events-none relative z-20 mt-2 mb-auto flex w-[min(360px,92vw)] flex-col items-center gap-1.5 self-center">
        {hud.activeBoss && !upgradesOpen && (
          <div
            data-testid="boss-health-bar"
            className="w-full rounded-xl border border-rose-500/60 px-3 py-1.5"
            style={{ backgroundColor: 'rgba(16, 10, 18, 0.88)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Skull className="h-3.5 w-3.5 text-rose-400" />
                <span className="font-display text-xs font-extrabold tracking-wider text-rose-300 uppercase sm:text-sm">
                  {hud.activeBoss.name}
                </span>
              </div>
              <span className="font-mono-tabular text-[11px] font-bold text-rose-200">
                {hud.activeBoss.hp}/{hud.activeBoss.maxHp}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-sm bg-slate-950">
              <div
                className="h-full bg-rose-500 transition-[width] duration-100"
                style={{ width: `${bossPct}%` }}
              />
            </div>
          </div>
        )}

        {hud.waveBanner && !upgradesOpen && (
          <div
            className="font-display hud-text-shadow rounded-lg border border-amber-500/40 px-3.5 py-1 text-center text-sm font-extrabold tracking-wider text-amber-300 uppercase sm:px-4 sm:py-1.5 sm:text-xl"
            style={{ backgroundColor: 'rgba(10, 15, 24, 0.82)' }}
          >
            {hud.waveBanner}
          </div>
        )}
        {hud.pickupToast && !upgradesOpen && (
          <div className="font-mono-tabular hud-text-shadow text-xs font-bold tracking-wider text-emerald-300 uppercase sm:text-sm">
            {hud.pickupToast}
          </div>
        )}
      </div>

      {/* Bottom Touch Controls Row + Centered Tactical Mini Map */}
      <div className="relative z-20 flex items-end justify-between pb-1">
        <VirtualThumbstick
          side="left"
          label="Move Joystick"
          accentColor="#38bdf8"
          testId="move-stick"
          onChange={(x, y) => onMoveStick(x, y)}
        />

        <Minimap minimap={hud.minimap} />

        <div className="flex flex-col items-end gap-3">
          <ActionControls
            activeWeapon={hud.activeWeapon}
            weapons={hud.weapons}
            upgradeLevels={hud.upgradeLevels}
            dashCooldownProgress={hud.dashCooldownProgress}
            isReloading={hud.isReloading}
            reloadProgress={hud.reloadProgress}
            onDash={onDash}
            onReload={onReload}
            onSwitchWeapon={onSwitchWeapon}
          />
          <VirtualThumbstick
            side="right"
            label="Aim and Fire Joystick"
            accentColor="#ef4444"
            testId="aim-stick"
            onChange={onAimStick}
          />
        </div>
      </div>
    </div>
  );
};
