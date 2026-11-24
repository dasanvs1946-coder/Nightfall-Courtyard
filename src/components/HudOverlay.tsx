import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CloudFog,
  CloudLightning,
  CloudRain,
  Moon,
  Pause,
  PlaneTakeoff,
  Shield,
  Skull,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { ARENA_SPECS, GAME_MODE_SPECS } from '../game/arenas';
import { DRONE_SPECS } from '../game/drones';
import { getEvolvedWeaponDisplay } from '../game/perks';
import {
  FloatingDamage,
  GadgetId,
  HudSnapshot,
  TacticalGearId,
  TouchHudSettings,
  UpgradeId,
  WeaponId,
} from '../game/types';
import { WEAPON_ORDER, WEAPON_SPECS } from '../game/weapons';
import { WEATHER_PRESETS } from '../game/weather';
import { ActionControls } from './ActionControls';
import { Minimap } from './Minimap';
import { UpgradeTab } from './UpgradeTab';
import { VirtualThumbstick } from './VirtualThumbstick';

interface HudOverlayProps {
  hud: HudSnapshot;
  floatingDamages: FloatingDamage[];
  upgradesOpen: boolean;
  touchHud: TouchHudSettings;
  onMoveStick: (x: number, y: number) => void;
  onAimStick: (x: number, y: number, active: boolean) => void;
  onDash: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
  onTriggerGear: () => void;
  onTriggerGadget: () => void;
  onTriggerUltimate: () => void;
  onEquipGear: (id: TacticalGearId) => void;
  onEquipGadget: (id: GadgetId) => void;
  onPrevWeapon: () => void;
  onNextWeapon: () => void;
  onSelectWeapon: (id: WeaponId) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onToggleUpgrades: () => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onBuyMastery: (weaponId: WeaponId) => void;
  onWaveOffExtraction: () => void;
  onSandboxSpawnEnemy: (
    kind: 'walker' | 'juggernaut' | 'elite_squad' | 'boss',
  ) => void;
  onSandboxEquipWeapon: (weaponId: WeaponId) => void;
  onSandboxTriggerEvolution: () => void;
  onSandboxChargeUltimate: () => void;
  onSandboxRefill: () => void;
  onSandboxClearEnemies: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  floatingDamages,
  upgradesOpen,
  touchHud,
  onMoveStick,
  onAimStick,
  onDash,
  onReload,
  onSwitchWeapon,
  onTriggerGear,
  onTriggerGadget,
  onTriggerUltimate,
  onEquipGear,
  onEquipGadget,
  onPrevWeapon,
  onNextWeapon,
  onSelectWeapon,
  onToggleMute,
  onPause,
  onToggleUpgrades,
  onBuyUpgrade,
  onBuyMastery,
  onWaveOffExtraction,
  onSandboxSpawnEnemy,
  onSandboxEquipWeapon,
  onSandboxTriggerEvolution,
  onSandboxChargeUltimate,
  onSandboxRefill,
  onSandboxClearEnemies,
}) => {
  const [sandboxOpen, setSandboxOpen] = useState(true);
  const activeWeaponState =
    hud.weapons.find((w) => w.id === hud.activeWeapon) ?? hud.weapons[0];
  const unlockedWeapons = hud.weapons.filter((w) => w.unlocked);
  const nextLockedWeapon = hud.weapons.find(
    (w) => !w.unlocked && !WEAPON_SPECS[w.id].armoryOnly,
  );
  const activeSpec = WEAPON_SPECS[hud.activeWeapon];
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const ghostPct = Math.max(hpPct, Math.min(100, (hud.ghostHp / hud.maxHp) * 100));
  const lowHp = hpPct <= 30;
  const bossPct = hud.activeBoss
    ? Math.max(0, Math.min(100, (hud.activeBoss.hp / hud.activeBoss.maxHp) * 100))
    : 0;
  const weatherLabel = WEATHER_PRESETS[hud.weather].label;
  const modeSpec = GAME_MODE_SPECS[hud.mode];
  const arenaSpec = ARENA_SPECS[hud.arena];
  const capturingGenerator = hud.generators.find((g) => g.playerInside && !g.powered);
  const poweredGenCount = hud.generators.filter((g) => g.powered).length;
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

  const { name: weaponDisplayName, isEvolved: isWeaponEvolved } =
    getEvolvedWeaponDisplay(hud.activeWeapon, activeSpec.name, hud.evolvedWeapons);

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
          const kind =
            d.kind ??
            (d.isWeakpoint ? 'weakpoint' : d.isCrit ? 'crit' : 'normal');
          const customColor = d.blockedByArmor
            ? undefined
            : kind === 'crit'
              ? '#F59E0B'
              : kind === 'cryo' || kind === 'shield' || kind === 'execute'
                ? '#22D3EE'
                : undefined;
          return (
            <div
              key={d.id}
              className={`font-mono-tabular hud-text-shadow absolute -translate-x-1/2 -translate-y-1/2 font-bold ${
                d.blockedByArmor
                  ? 'text-xs text-sky-300'
                  : kind === 'weakpoint'
                    ? 'text-lg font-extrabold text-rose-500'
                    : kind === 'crit' || kind === 'execute'
                      ? 'text-base font-extrabold'
                      : kind === 'cryo' || kind === 'shield'
                        ? 'text-sm font-extrabold'
                        : 'text-sm text-white'
              }`}
              style={{
                left: d.x,
                top: d.y,
                opacity,
                color: customColor,
              }}
            >
              {d.label ? `${d.label} ` : ''}
              {d.amount > 0 ? d.amount : ''}
            </div>
          );
        })}
      </div>

      {/* Top HUD Row */}
      <div className="relative z-30 flex items-start justify-between gap-1.5 sm:gap-3">
        {/* Top-Left Column: Health, Wave, Score + Mode Tag + Small Upgrades Tab */}
        <div className="flex flex-col items-start">
          <div
            className="pointer-events-auto flex w-[156px] flex-col gap-1 rounded-xl border border-slate-700/70 px-2 py-1.5 sm:w-auto sm:min-w-[248px] sm:gap-1.5 sm:px-3 sm:py-2"
            style={{ backgroundColor: 'rgba(10, 15, 24, 0.86)' }}
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
            <div className="relative h-2 w-full overflow-hidden rounded-sm bg-slate-900 sm:h-2.5 sm:w-56">
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
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] font-semibold tracking-wider text-cyan-400 uppercase sm:text-[10px]">
                  Scrap
                </span>
                <span
                  data-testid="in-run-scrap"
                  className="font-mono-tabular font-bold text-cyan-200"
                >
                  {hud.inRunScrap}
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
            weaponMastery={hud.weaponMastery}
            activeWeapon={hud.activeWeapon}
            equippedGear={hud.equippedGear}
            equippedGadget={hud.equippedGadget}
            equippedDrone={hud.equippedDrone}
            ownedPerks={hud.ownedPerks}
            ownedCursedPerks={hud.ownedCursedPerks}
            evolvedWeapons={hud.evolvedWeapons}
            activeSynergies={hud.activeSynergies}
            onToggle={onToggleUpgrades}
            onBuyUpgrade={onBuyUpgrade}
            onBuyMastery={onBuyMastery}
            onEquipGear={onEquipGear}
            onEquipGadget={onEquipGadget}
          />

          {/* Collapsible Sandbox Command Panel */}
          {hud.sandboxMode && !upgradesOpen && (
            <div
              data-testid="sandbox-panel"
              className="pointer-events-auto mt-1.5 w-[210px] rounded-xl border border-slate-700/80 p-2 sm:w-[258px]"
              style={{ backgroundColor: 'rgba(9, 13, 22, 0.92)' }}
            >
              <button
                type="button"
                tabIndex={-1}
                data-testid="sandbox-toggle-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSandboxOpen((prev) => !prev);
                }}
                className="flex w-full cursor-pointer items-center justify-between text-[10px] font-extrabold tracking-wider text-amber-300 uppercase"
              >
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Sandbox Deck</span>
                </span>
                <span className="text-slate-400">
                  {sandboxOpen ? 'Hide' : 'Show'}
                </span>
              </button>

              {sandboxOpen && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-spawn-walker"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxSpawnEnemy('walker');
                      }}
                      className="cursor-pointer rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[9px] font-bold text-slate-200 uppercase hover:border-amber-400"
                    >
                      + Walker
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-spawn-juggernaut"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxSpawnEnemy('juggernaut');
                      }}
                      className="cursor-pointer rounded border border-amber-500/50 bg-amber-950/35 px-1.5 py-1 text-[9px] font-bold text-amber-200 uppercase hover:border-amber-400"
                    >
                      + Juggernaut
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-spawn-elite"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxSpawnEnemy('elite_squad');
                      }}
                      className="cursor-pointer rounded border border-purple-500/50 bg-purple-950/35 px-1.5 py-1 text-[9px] font-bold text-purple-200 uppercase hover:border-purple-400"
                    >
                      + Elite Squad
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-spawn-boss"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxSpawnEnemy('boss');
                      }}
                      className="cursor-pointer rounded border border-rose-500/50 bg-rose-950/35 px-1.5 py-1 text-[9px] font-bold text-rose-200 uppercase hover:border-rose-400"
                    >
                      + Iron Warden
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <label
                      htmlFor="sandbox-weapon-select"
                      className="text-[9px] font-bold text-slate-400 uppercase"
                    >
                      Arm
                    </label>
                    <select
                      id="sandbox-weapon-select"
                      data-testid="sandbox-weapon-select"
                      value={hud.activeWeapon}
                      onChange={(e) => {
                        onSandboxEquipWeapon(e.target.value as WeaponId);
                        e.currentTarget.blur();
                      }}
                      className="font-mono-tabular h-6 flex-1 rounded border border-slate-700 bg-slate-950 px-1 text-[10px] font-bold text-amber-300 uppercase focus:border-amber-400 focus:outline-none"
                    >
                      {WEAPON_ORDER.map((wId) => (
                        <option key={wId} value={wId}>
                          {WEAPON_SPECS[wId].shortCode} · {WEAPON_SPECS[wId].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-evolve-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxTriggerEvolution();
                      }}
                      className="cursor-pointer rounded border border-amber-400/60 bg-amber-500/20 px-1 py-1 text-[9px] font-extrabold text-amber-200 uppercase hover:bg-amber-500/35"
                    >
                      All Evo
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-ult-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxChargeUltimate();
                      }}
                      className="cursor-pointer rounded border border-purple-400/60 bg-purple-500/20 px-1 py-1 text-[9px] font-extrabold text-purple-200 uppercase hover:bg-purple-500/35"
                    >
                      Max Ult
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-refill-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxRefill();
                      }}
                      className="cursor-pointer rounded border border-emerald-400/60 bg-emerald-500/20 px-1 py-1 text-[9px] font-extrabold text-emerald-200 uppercase hover:bg-emerald-500/35"
                    >
                      Refill
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="sandbox-clear-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSandboxClearEnemies();
                      }}
                      className="cursor-pointer rounded border border-slate-600 bg-slate-800 px-1 py-1 text-[9px] font-extrabold text-slate-200 uppercase hover:bg-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Right: Weapon, Ammo, Powerups, Mode/Gen Tags, Weather & Utility Buttons */}
        <div className="pointer-events-auto flex items-start gap-1.5 sm:gap-2">
          <div className="flex flex-col items-end gap-1.5">
            <div
              className="flex max-w-[162px] flex-col items-end gap-1 rounded-xl border border-slate-700/70 px-2 py-1.5 sm:max-w-none sm:px-3 sm:py-2"
              style={{ backgroundColor: 'rgba(10, 15, 24, 0.86)' }}
            >
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span
                  className={`font-display max-w-[82px] truncate text-xs font-bold tracking-wide uppercase sm:max-w-none sm:text-sm ${
                    isWeaponEvolved ? 'text-amber-300' : 'text-slate-100'
                  }`}
                >
                  {weaponDisplayName}
                </span>
                <span className="font-mono-tabular text-xs font-bold text-amber-400 sm:text-lg">
                  {hud.isReloading
                    ? 'RLD'
                    : hud.minigunRemaining > 0
                      ? '∞'
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

              {/* Unlocked weapon tabs */}
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

              {hud.minigunRemaining > 0 && (
                <div
                  data-testid="minigun-timer"
                  className="font-mono-tabular text-[10px] font-extrabold text-amber-300 sm:text-[11px]"
                >
                  MINIGUN {hud.minigunRemaining.toFixed(1)}s
                </div>
              )}

              {hud.rapidFireRemaining > 0 && (
                <div className="font-mono-tabular text-[10px] font-bold text-red-400 sm:text-[11px]">
                  RAPID {hud.rapidFireRemaining.toFixed(1)}s
                </div>
              )}
            </div>

            <div className="flex max-w-[180px] flex-wrap items-center justify-end gap-1 sm:max-w-none">
              {hud.mode !== 'normal' && (
                <div
                  data-testid="mode-badge"
                  className="font-mono-tabular rounded-xl border border-slate-700/80 px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase sm:py-1 sm:text-[10px]"
                  style={{
                    backgroundColor: 'rgba(10, 15, 24, 0.88)',
                    color: modeSpec.accentHex,
                  }}
                >
                  {modeSpec.shortLabel}
                </div>
              )}
              {hud.mode === 'weekly' && hud.weeklyMutatorName && (
                <div
                  data-testid="weekly-mutator-hud-badge"
                  className="font-mono-tabular rounded-xl border border-orange-400/60 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-orange-300 uppercase sm:py-1 sm:text-[10px]"
                  style={{ backgroundColor: 'rgba(20, 12, 8, 0.9)' }}
                >
                  {hud.weeklyMutatorName}
                </div>
              )}
              {hud.equippedDrone !== 'none' && (
                <div
                  data-testid="drone-badge"
                  className="font-mono-tabular rounded-xl border border-cyan-400/50 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-cyan-200 uppercase sm:py-1 sm:text-[10px]"
                  style={{ backgroundColor: 'rgba(10, 15, 24, 0.88)' }}
                >
                  {DRONE_SPECS[hud.equippedDrone].shortLabel}
                </div>
              )}
              {hud.activeSynergies.length > 0 && (
                <div
                  data-testid="synergy-badge"
                  className="font-mono-tabular rounded-xl border border-sky-400/50 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-sky-200 uppercase sm:py-1 sm:text-[10px]"
                  style={{ backgroundColor: 'rgba(10, 15, 24, 0.88)' }}
                >
                  SYN {hud.activeSynergies.length}
                </div>
              )}
              {poweredGenCount > 0 && (
                <div
                  className="font-mono-tabular flex items-center gap-1 rounded-xl border border-cyan-400/50 px-2 py-0.5 text-[9px] font-extrabold text-cyan-300 uppercase sm:py-1 sm:text-[10px]"
                  style={{ backgroundColor: 'rgba(10, 15, 24, 0.88)' }}
                >
                  <Zap className="h-3 w-3" />
                  <span>GEN {poweredGenCount}/2</span>
                </div>
              )}
              {hud.overchargeRemaining > 0 && (
                <div
                  data-testid="overcharge-badge"
                  className="font-mono-tabular flex items-center gap-1 rounded-xl border border-amber-400/60 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 uppercase sm:py-1 sm:text-[10px]"
                  style={{ backgroundColor: 'rgba(10, 15, 24, 0.88)' }}
                >
                  <Zap className="h-3 w-3" />
                  <span>+20% ROF {hud.overchargeRemaining.toFixed(1)}s</span>
                </div>
              )}
              {hud.showFps && (
                <div
                  data-testid="fps-counter"
                  className="font-mono-tabular rounded-xl border border-amber-500/45 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-amber-300 uppercase sm:py-1 sm:text-[11px]"
                  style={{ backgroundColor: 'rgba(10, 15, 24, 0.86)' }}
                >
                  {hud.fps} FPS
                </div>
              )}
              {hud.autoFire && (
                <div
                  data-testid="autofire-badge"
                  className="font-mono-tabular rounded-xl border border-cyan-400/50 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-cyan-300 uppercase sm:py-1 sm:text-[11px]"
                  style={{ backgroundColor: 'rgba(10, 15, 24, 0.86)' }}
                >
                  Auto
                </div>
              )}
              <div
                data-testid="weather-badge"
                aria-label={`Weather: ${weatherLabel}, Arena: ${arenaSpec.name}`}
                className="flex items-center gap-1 rounded-xl border border-slate-700/70 px-2 py-0.5 text-[9px] font-bold tracking-wider text-sky-200 uppercase sm:px-2.5 sm:py-1 sm:text-[11px]"
                style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
              >
                <WeatherIcon className="h-3 w-3 text-sky-300 sm:h-3.5 sm:w-3.5" />
                <span>{weatherLabel}</span>
              </div>
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

      {/* Killstreak Combo, Next Rival, Boss Health Bar, Generator Ring Capture & Transient Banners */}
      <div className="pointer-events-none relative z-20 mt-2 mb-auto flex w-[min(360px,92vw)] flex-col items-center gap-1.5 self-center">
        {hud.rivalOvertakenBanner && !upgradesOpen && (
          <div
            data-testid="rival-overtaken-banner"
            className="font-mono-tabular w-full rounded-xl border border-emerald-400/90 px-3 py-1 text-center text-[10px] font-extrabold tracking-wider text-emerald-200 uppercase shadow-[0_0_24px_rgba(34,197,94,0.35)] sm:text-xs"
            style={{ backgroundColor: 'rgba(6, 28, 18, 0.94)' }}
          >
            {hud.rivalOvertakenBanner}
          </div>
        )}

        {hud.nextRival && !upgradesOpen && !hud.sandboxMode && (
          <div
            data-testid="next-rival-bar"
            className="font-mono-tabular flex w-full items-center justify-between gap-2 rounded-xl border border-amber-500/45 px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase sm:text-[10px]"
            style={{ backgroundColor: 'rgba(10, 14, 24, 0.88)' }}
          >
            <span className="truncate text-slate-300">
              NEXT RIVAL{' '}
              <span className="font-extrabold text-amber-300">
                #{hud.nextRival.rank}{' '}
                {hud.nextRival.clanTag ? `[${hud.nextRival.clanTag}] ` : ''}
                {hud.nextRival.callsign}
              </span>
            </span>
            <span className="shrink-0 font-extrabold text-cyan-300">
              {hud.nextRival.scoreToOvertake.toLocaleString()} PTS
            </span>
          </div>
        )}

        {hud.reactorCore && !upgradesOpen && (
          <div
            data-testid="siege-core-bar"
            className="w-full rounded-xl border border-cyan-400/75 px-3 py-1.5 shadow-[0_0_22px_rgba(34,211,238,0.2)]"
            style={{ backgroundColor: 'rgba(8, 18, 28, 0.92)' }}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold tracking-wider uppercase sm:text-xs">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Shield className="h-3.5 w-3.5 text-cyan-300" />
                <span>Power Core Integrity</span>
              </span>
              <span className="font-mono-tabular text-cyan-100">
                {hud.reactorCore.hp}/{hud.reactorCore.maxHp}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-sm bg-slate-950">
              <div
                className={`h-full transition-[width] duration-100 ${
                  hud.reactorCore.hp / Math.max(1, hud.reactorCore.maxHp) <= 0.3
                    ? 'bg-rose-500'
                    : 'bg-cyan-400'
                }`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (hud.reactorCore.hp / Math.max(1, hud.reactorCore.maxHp)) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {hud.extractionState && hud.extractionState.active && !upgradesOpen && (
          <div
            data-testid="extraction-banner"
            className="pointer-events-auto w-full rounded-xl border border-emerald-400/80 px-3 py-2 shadow-[0_0_26px_rgba(34,197,94,0.28)]"
            style={{ backgroundColor: 'rgba(8, 24, 18, 0.94)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-emerald-300 uppercase sm:text-xs">
                <PlaneTakeoff className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  Chopper Exfil ({hud.extractionState.multiplier}x Scrap)
                </span>
              </div>
              <button
                type="button"
                tabIndex={-1}
                data-testid="wave-off-extraction"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onWaveOffExtraction();
                }}
                className="cursor-pointer rounded border border-amber-400/75 bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-amber-200 uppercase hover:bg-amber-500 hover:text-slate-950"
              >
                Wave Off [X]
              </button>
            </div>
            <div className="font-mono-tabular mt-1 flex items-center justify-between text-[10px] text-emerald-100">
              <span>Hold Central Landing Pad</span>
              <span>
                {hud.extractionState.holdProgress.toFixed(1)}s /{' '}
                {hud.extractionState.holdSecRequired}s
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-sm bg-slate-950">
              <div
                className="h-full bg-emerald-400 transition-[width] duration-75"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (hud.extractionState.holdProgress /
                        Math.max(1, hud.extractionState.holdSecRequired)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {hud.comboCount >= 2 && !upgradesOpen && (
          <div
            data-testid="combo-badge"
            className="w-56 rounded-xl border border-amber-400/60 px-3 py-1 sm:w-64"
            style={{ backgroundColor: 'rgba(14, 16, 26, 0.88)' }}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold tracking-wider uppercase sm:text-xs">
              <span className="font-mono-tabular text-amber-300">
                {hud.comboCount}x COMBO · x{hud.comboMultiplier.toFixed(1)}
              </span>
              {hud.comboCallout && (
                <span className="text-rose-400">{hud.comboCallout}</span>
              )}
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-sm bg-slate-900">
              <div
                className="h-full bg-amber-400 transition-[width] duration-75"
                style={{ width: `${Math.round(hud.comboTimerRatio * 100)}%` }}
              />
            </div>
          </div>
        )}

        {hud.activeBoss && !upgradesOpen && (
          <div
            data-testid="boss-health-bar"
            className={`w-full rounded-xl border px-3 py-1.5 ${
              hud.activeBoss.shielded
                ? 'border-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.28)]'
                : hud.activeBoss.phase === 3
                  ? 'border-rose-400/90 shadow-[0_0_26px_rgba(244,63,94,0.42)]'
                  : hud.activeBoss.phase === 2 || hud.activeBoss.phase2
                    ? 'border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.3)]'
                    : 'border-rose-500/60'
            }`}
            style={{ backgroundColor: 'rgba(16, 10, 18, 0.9)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <Skull className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <span className="font-display truncate text-xs font-extrabold tracking-wider text-rose-300 uppercase sm:text-sm">
                  {hud.activeBoss.name}
                </span>
                <span
                  className={`font-mono-tabular shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                    hud.activeBoss.shielded
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : hud.activeBoss.phase === 3
                        ? 'bg-rose-500/25 text-rose-200'
                        : hud.activeBoss.phase === 2
                          ? 'bg-amber-500/25 text-amber-200'
                          : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {hud.activeBoss.shielded
                    ? `SHIELDED · ${hud.activeBoss.pylonsRemaining} PYLON${hud.activeBoss.pylonsRemaining === 1 ? '' : 'S'}`
                    : `P${hud.activeBoss.phase}`}
                </span>
              </div>
              <span className="font-mono-tabular shrink-0 text-[11px] font-bold text-rose-200">
                {hud.activeBoss.hp}/{hud.activeBoss.maxHp}
              </span>
            </div>
            <div className="relative mt-1 h-2 w-full overflow-hidden rounded-sm bg-slate-950">
              <div
                className={`h-full transition-[width] duration-100 ${
                  hud.activeBoss.shielded
                    ? 'bg-cyan-400'
                    : hud.activeBoss.phase === 3
                      ? 'bg-rose-500'
                      : hud.activeBoss.phase === 2 || hud.activeBoss.phase2
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                }`}
                style={{ width: `${bossPct}%` }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-slate-950/85"
                style={{ left: '30%' }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-slate-950/85"
                style={{ left: '65%' }}
              />
            </div>
          </div>
        )}

        {hud.hazardWarningBanner && !upgradesOpen && (
          <div
            data-testid="hazard-warning-banner"
            className="font-mono-tabular w-full rounded-xl border border-rose-500/85 px-3 py-1 text-center text-[10px] font-extrabold tracking-wider text-rose-200 uppercase shadow-[0_0_20px_rgba(239,68,68,0.3)] sm:text-xs"
            style={{ backgroundColor: 'rgba(32, 8, 12, 0.92)' }}
          >
            {hud.hazardWarningBanner}
          </div>
        )}

        {hud.activeEvent && !upgradesOpen && (
          <div
            data-testid="midwave-event-banner"
            className="w-full rounded-xl border px-3 py-1.5"
            style={{
              backgroundColor: 'rgba(10, 15, 24, 0.92)',
              borderColor: hud.activeEvent.accentHex,
            }}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold tracking-wider uppercase sm:text-xs">
              <span style={{ color: hud.activeEvent.accentHex }}>
                {hud.activeEvent.title}
              </span>
              {typeof hud.activeEvent.remainingSec === 'number' && (
                <span className="font-mono-tabular text-slate-200">
                  {hud.activeEvent.remainingSec.toFixed(1)}s
                </span>
              )}
              {typeof hud.activeEvent.progress === 'number' && (
                <span className="font-mono-tabular text-sky-200">
                  {Math.round(hud.activeEvent.progress * 100)}%
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-200">
              {hud.activeEvent.subtitle}
            </div>
            {typeof hud.activeEvent.progress === 'number' && (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-slate-900">
                <div
                  className="h-full transition-[width] duration-100"
                  style={{
                    width: `${Math.round(hud.activeEvent.progress * 100)}%`,
                    backgroundColor: hud.activeEvent.accentHex,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {hud.activePadPrompt && !upgradesOpen && (
          <div
            data-testid="tactical-pad-prompt"
            className="w-64 rounded-xl border border-amber-400/75 px-3 py-1.5"
            style={{ backgroundColor: 'rgba(12, 16, 26, 0.92)' }}
          >
            <div className="font-mono-tabular flex items-center justify-between text-[10px] font-extrabold uppercase">
              <span className="text-amber-300">{hud.activePadPrompt.label}</span>
              <span
                className={
                  hud.activePadPrompt.activeRemaining > 0
                    ? 'text-emerald-300'
                    : hud.activePadPrompt.affordable
                      ? 'text-cyan-300'
                      : 'text-rose-400'
                }
              >
                {hud.activePadPrompt.activeRemaining > 0
                  ? `ACTIVE ${hud.activePadPrompt.activeRemaining.toFixed(0)}s`
                  : `${hud.activePadPrompt.cost} SCRAP`}
              </span>
            </div>
            {hud.activePadPrompt.activeRemaining <= 0 && (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-slate-900">
                <div
                  className={`h-full transition-[width] duration-100 ${
                    hud.activePadPrompt.affordable ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.round(hud.activePadPrompt.progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {capturingGenerator && !upgradesOpen && (
          <div
            data-testid="generator-capture-bar"
            className="w-64 rounded-xl border border-cyan-400/70 px-3 py-1.5"
            style={{ backgroundColor: 'rgba(9, 16, 28, 0.9)' }}
          >
            <div className="font-mono-tabular flex items-center justify-between text-[10px] font-extrabold text-cyan-200 uppercase">
              <span>Powering Floodlight...</span>
              <span>{Math.round(capturingGenerator.progress * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-slate-900">
              <div
                className="h-full bg-cyan-400 transition-[width] duration-100"
                style={{ width: `${Math.round(capturingGenerator.progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {hud.evolutionBanner && !upgradesOpen && (
          <div
            data-testid="evolution-banner"
            className="font-display hud-text-shadow rounded-xl border border-amber-400 px-4 py-1.5 text-center text-xs font-extrabold tracking-wider text-amber-300 uppercase shadow-[0_0_30px_rgba(245,158,11,0.45)] sm:text-base"
            style={{ backgroundColor: 'rgba(18, 12, 8, 0.95)' }}
          >
            {hud.evolutionBanner}
          </div>
        )}

        {hud.waveBanner && !upgradesOpen && (
          <div
            className="font-display hud-text-shadow rounded-lg border border-amber-500/40 px-3.5 py-1 text-center text-sm font-extrabold tracking-wider text-amber-300 uppercase sm:px-4 sm:py-1.5 sm:text-xl"
            style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
          >
            {hud.waveBanner}
          </div>
        )}
        {hud.skinUnlockToast && !upgradesOpen && (
          <div
            data-testid="skin-unlock-toast"
            className="font-display hud-text-shadow rounded-xl border border-amber-400/80 px-3.5 py-1.5 text-center text-xs font-extrabold tracking-wider text-amber-300 uppercase shadow-[0_0_24px_rgba(245,158,11,0.35)] sm:text-sm"
            style={{ backgroundColor: 'rgba(14, 18, 28, 0.94)' }}
          >
            {hud.skinUnlockToast}
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
          scale={touchHud.joystickScale}
          opacity={touchHud.buttonOpacity}
          onChange={(x, y) => onMoveStick(x, y)}
        />

        <Minimap minimap={hud.minimap} arena={hud.arena} />

        <div className="flex flex-col items-end gap-3">
          <ActionControls
            activeWeapon={hud.activeWeapon}
            weapons={hud.weapons}
            upgradeLevels={hud.upgradeLevels}
            dashCooldownProgress={hud.dashCooldownProgress}
            equippedGear={hud.equippedGear}
            gearCooldownProgress={hud.gearCooldownProgress}
            gearCooldownRemaining={hud.gearCooldownRemaining}
            equippedGadget={hud.equippedGadget}
            gadgetCooldownProgress={hud.gadgetCooldownProgress}
            gadgetCooldownRemaining={hud.gadgetCooldownRemaining}
            gadgetCharges={hud.gadgetCharges}
            gadgetMaxCharges={hud.gadgetMaxCharges}
            ultimateCharge={hud.ultimateCharge}
            ultimateActiveRemaining={hud.ultimateActiveRemaining}
            ultimateName={hud.ultimateName}
            isReloading={hud.isReloading}
            reloadProgress={hud.reloadProgress}
            touchHud={touchHud}
            onDash={onDash}
            onReload={onReload}
            onSwitchWeapon={onSwitchWeapon}
            onTriggerGear={onTriggerGear}
            onTriggerGadget={onTriggerGadget}
            onTriggerUltimate={onTriggerUltimate}
          />
          <VirtualThumbstick
            side="right"
            label="Aim and Fire Joystick"
            accentColor="#ef4444"
            testId="aim-stick"
            scale={touchHud.joystickScale}
            opacity={touchHud.buttonOpacity}
            onChange={onAimStick}
          />
        </div>
      </div>
    </div>
  );
};
