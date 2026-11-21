import React from 'react';
import { TACTICAL_GEAR_ORDER, TACTICAL_GEAR_SPECS } from '../game/tacticalGear';
import { SavedRunProgress, TacticalGearId } from '../game/types';
import { APP_VERSION } from '../game/version';

interface TitleScreenProps {
  highScore: number;
  savedProgress: SavedRunProgress | null;
  equippedGear: TacticalGearId;
  onEquipGear: (id: TacticalGearId) => void;
  onStartFromBeginning: () => void;
  onResumeInterrupted: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highScore,
  savedProgress,
  equippedGear,
  onEquipGear,
  onStartFromBeginning,
  onResumeInterrupted,
}) => {
  const canResume =
    savedProgress !== null && savedProgress.activeInterrupted !== false;
  const activeGearSpec = TACTICAL_GEAR_SPECS[equippedGear];

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-5 sm:p-10">
      {/* Subtle top-left scrim for guaranteed title contrast over live 3D courtyard */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 24% 34%, rgba(7, 10, 16, 0.78) 0%, rgba(7, 10, 16, 0.25) 55%, rgba(7, 10, 16, 0.65) 100%)',
        }}
      />

      {/* Top row: version + minimal high score readout */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono-tabular hud-text-shadow text-xs font-semibold tracking-wider text-slate-300 uppercase">
          Nightfall Courtyard · {APP_VERSION}
        </div>
        {highScore > 0 && (
          <div className="font-mono-tabular hud-text-shadow text-xs font-bold tracking-wider text-amber-400 uppercase">
            Best · {highScore}
          </div>
        )}
      </div>

      {/* Left-biased Title Lockup + Tactical Gear Selector + Start Choice CTA */}
      <div className="pointer-events-auto my-auto max-w-lg">
        {/* Bespoke inline SVG Tactical Crest & Title Lockup */}
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <svg
            viewBox="0 0 48 48"
            className="h-9 w-9 shrink-0 text-amber-400 sm:h-11 sm:w-11"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeOpacity="0.85"
            />
            <circle cx="24" cy="24" r="11" stroke="#ef4444" strokeWidth="2" />
            <line x1="24" y1="2" x2="24" y2="11" stroke="currentColor" strokeWidth="2.5" />
            <line x1="24" y1="37" x2="24" y2="46" stroke="currentColor" strokeWidth="2.5" />
            <line x1="2" y1="24" x2="11" y2="24" stroke="currentColor" strokeWidth="2.5" />
            <line x1="37" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="3" fill="#ef4444" />
          </svg>
          <span className="font-mono-tabular text-xs font-semibold tracking-widest text-amber-400/90 uppercase">
            3D Twin-Stick Survival
          </span>
        </div>

        <h1 className="font-display hud-text-shadow text-4xl font-extrabold tracking-tight text-white uppercase sm:text-7xl">
          Nightfall Courtyard
        </h1>

        <p className="hud-text-shadow mt-2 max-w-md text-xs leading-relaxed text-slate-300 sm:mt-3 sm:text-base">
          Hold the dark urban plaza against Acid Spitters, Shadow Stalkers, Riot Breachers, and Iron Wardens. Unlock 12 weapons and level upgrades up to Lv 50.
        </p>

        {/* Compact Tactical Gear Loadout Selector */}
        <div
          className="mt-3.5 rounded-xl border border-slate-700/75 p-2.5 sm:mt-5"
          style={{ backgroundColor: 'rgba(10, 15, 24, 0.78)' }}
        >
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
            <span className="text-slate-400">Tactical Gear Slot</span>
            <span className="font-mono-tabular text-cyan-300">
              CD {activeGearSpec.cooldownSec}s
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {TACTICAL_GEAR_ORDER.map((id) => {
              const spec = TACTICAL_GEAR_SPECS[id];
              const active = id === equippedGear;
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`title-gear-${id}`}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onEquipGear(id);
                  }}
                  className={`min-h-[36px] cursor-pointer rounded-lg border px-2 py-1 text-[11px] font-bold tracking-wide uppercase transition-colors ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {spec.shortLabel}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-300">
            <span className="font-semibold text-white">{activeGearSpec.name}:</span>{' '}
            {activeGearSpec.description}
          </div>
        </div>

        {/* Mid-Round Exit / Disconnect Recovery Banner + Start CTA */}
        <div className="mt-4 flex flex-col gap-2.5 sm:mt-5">
          {canResume && (
            <button
              type="button"
              data-testid="resume-interrupted-run"
              onClick={(e) => {
                e.currentTarget.blur();
                onResumeInterrupted();
              }}
              className="group w-full cursor-pointer rounded-xl border border-cyan-400/80 bg-cyan-950/75 px-4 py-3 text-left shadow-[0_0_24px_rgba(34,211,238,0.28)] transition-all hover:border-cyan-300 hover:bg-cyan-900/80 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold tracking-wide text-cyan-200 uppercase sm:text-sm">
                  Active Run Interrupted (Wave {savedProgress.lastWave}) — Resume &amp; Revive
                </span>
              </div>
              <div className="font-mono-tabular mt-1 text-[11px] text-slate-300">
                Score {savedProgress.score} · {savedProgress.kills} Kills ·{' '}
                {savedProgress.upgradePoints} UP ·{' '}
                {savedProgress.hasUsedRevive ? 'Revive Used' : '1 Free Revive'}
              </div>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              data-start="true"
              data-testid="start-beginning"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartFromBeginning();
              }}
              className={
                canResume
                  ? 'min-h-[44px] cursor-pointer rounded-xl border border-slate-600/80 bg-slate-900/85 px-5 py-2.5 text-xs font-bold tracking-wide text-slate-100 uppercase shadow-lg transition-colors hover:border-slate-400 hover:bg-slate-800 active:scale-[0.98] sm:min-h-[48px] sm:px-6 sm:py-3 sm:text-sm'
                  : 'min-h-[46px] cursor-pointer rounded-xl bg-amber-500 px-7 py-2.5 text-sm font-bold tracking-wide text-slate-950 uppercase shadow-lg transition-transform hover:bg-amber-400 active:scale-[0.98] sm:min-h-[48px] sm:px-8 sm:py-3 sm:text-base'
              }
            >
              New Run
            </button>
          </div>
        </div>
      </div>

      {/* Single flat bottom control hint */}
      <div className="hud-text-shadow text-center text-[11px] font-medium tracking-wide text-slate-400 sm:text-left sm:text-xs">
        Left Stick / WASD Move · Right Stick / Mouse Aim &amp; Fire · Space Dash · G/E Tactical Gear · R Reload
      </div>
    </div>
  );
};

