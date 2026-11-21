import React from 'react';
import { SavedRunProgress } from '../game/types';

interface TitleScreenProps {
  highScore: number;
  savedProgress: SavedRunProgress | null;
  onStartFromBeginning: () => void;
  onContinueLastWave: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highScore,
  savedProgress,
  onStartFromBeginning,
  onContinueLastWave,
}) => {
  const canContinue = savedProgress !== null && savedProgress.lastWave > 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-6 sm:p-10">
      {/* Subtle top-left scrim for guaranteed title contrast over live 3D courtyard */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 24% 34%, rgba(7, 10, 16, 0.78) 0%, rgba(7, 10, 16, 0.25) 55%, rgba(7, 10, 16, 0.65) 100%)',
        }}
      />

      {/* Top row: minimal high score readout */}
      <div className="flex items-center justify-between">
        <div className="font-mono-tabular hud-text-shadow text-xs font-semibold tracking-wider text-slate-300 uppercase">
          Nightfall Courtyard
        </div>
        {highScore > 0 && (
          <div className="font-mono-tabular hud-text-shadow text-xs font-bold tracking-wider text-amber-400 uppercase">
            Best Score · {highScore}
          </div>
        )}
      </div>

      {/* Left-biased Title Lockup + Start Choice CTA */}
      <div className="pointer-events-auto my-auto max-w-lg">
        {/* Bespoke inline SVG Tactical Crest & Title Lockup */}
        <div className="mb-3 flex items-center gap-3">
          <svg
            viewBox="0 0 48 48"
            className="h-11 w-11 shrink-0 text-amber-400"
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
            <circle
              cx="24"
              cy="24"
              r="11"
              stroke="#ef4444"
              strokeWidth="2"
            />
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

        <h1 className="font-display hud-text-shadow text-5xl font-extrabold tracking-tight text-white uppercase sm:text-7xl">
          Nightfall Courtyard
        </h1>

        <p className="hud-text-shadow mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
          Hold the dark urban plaza against relentless waves, armored Brutes, and Overlord bosses. Unlock 12 weapons and level field upgrades up to Lv 50.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {canContinue && (
            <button
              type="button"
              data-testid="continue-last-wave"
              onClick={(e) => {
                e.currentTarget.blur();
                onContinueLastWave();
              }}
              className="min-h-[48px] cursor-pointer rounded-xl bg-amber-500 px-7 py-3 text-base font-bold tracking-wide text-slate-950 uppercase shadow-lg transition-transform hover:bg-amber-400 active:scale-[0.98]"
            >
              Continue Wave {savedProgress.lastWave}
            </button>
          )}

          <button
            type="button"
            data-start="true"
            data-testid="start-beginning"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartFromBeginning();
            }}
            className={
              canContinue
                ? 'min-h-[48px] cursor-pointer rounded-xl border border-slate-600/80 bg-slate-900/85 px-6 py-3 text-sm font-bold tracking-wide text-slate-100 uppercase shadow-lg transition-colors hover:border-slate-400 hover:bg-slate-800 active:scale-[0.98]'
                : 'min-h-[48px] cursor-pointer rounded-xl bg-amber-500 px-8 py-3 text-base font-bold tracking-wide text-slate-950 uppercase shadow-lg transition-transform hover:bg-amber-400 active:scale-[0.98]'
            }
          >
            {canContinue ? 'Start from Beginning' : 'Start Survival'}
          </button>
        </div>

        {canContinue && (
          <div className="font-mono-tabular hud-text-shadow mt-2.5 text-xs text-slate-300">
            Last Run · Wave {savedProgress.lastWave} · Score {savedProgress.score} ·{' '}
            {savedProgress.upgradePoints} UP saved
          </div>
        )}
      </div>

      {/* Single flat bottom control hint */}
      <div className="hud-text-shadow text-center text-xs font-medium tracking-wide text-slate-400 sm:text-left">
        Left Stick / WASD Move · Right Stick / Mouse Aim & Fire · Space Dash · R Reload · Q / Scroll Switch Weapon
      </div>
    </div>
  );
};
