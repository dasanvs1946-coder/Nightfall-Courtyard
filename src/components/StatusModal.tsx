import React from 'react';
import { HudSnapshot } from '../game/types';

interface StatusModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onContinueLastWave: () => void;
  onRestartFromBeginning: () => void;
  onTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  hud,
  onResume,
  onContinueLastWave,
  onRestartFromBeginning,
  onTitle,
}) => {
  if (hud.phase !== 'paused' && hud.phase !== 'gameover') {
    return null;
  }

  const isGameOver = hud.phase === 'gameover';
  const canRetryWave = hud.wave > 1;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7, 10, 16, 0.78)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
        className="w-full max-w-sm rounded-2xl border border-slate-700/80 p-6 shadow-2xl"
        style={{ backgroundColor: 'rgba(13, 19, 30, 0.96)' }}
      >
        <div className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
          {isGameOver ? 'Overrun in Courtyard' : 'Simulation Paused'}
        </div>

        <h2
          id="modal-heading"
          className="font-display mt-1 text-4xl font-extrabold tracking-tight text-white uppercase"
        >
          {isGameOver ? 'Game Over' : 'Paused'}
        </h2>

        {isGameOver && hud.isNewHighScore && (
          <div className="mt-2 text-xs font-bold tracking-wider text-emerald-400 uppercase">
            New High Score Recorded
          </div>
        )}

        {/* Tabular Run Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-800 py-4">
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Wave
            </div>
            <div className="font-mono-tabular mt-0.5 text-xl font-bold text-white">
              {hud.wave}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Score
            </div>
            <div className="font-mono-tabular mt-0.5 text-xl font-bold text-amber-400">
              {hud.score}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Best
            </div>
            <div className="font-mono-tabular mt-0.5 text-xl font-bold text-slate-200">
              {hud.highScore}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Infected Eliminated · {hud.kills}</span>
          <span>Damage Taken · {hud.damageTaken}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {!isGameOver ? (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onResume();
              }}
              className="min-h-[46px] w-full cursor-pointer rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold tracking-wide text-slate-950 uppercase hover:bg-amber-400"
            >
              Resume
            </button>
          ) : canRetryWave ? (
            <button
              type="button"
              data-testid="retry-last-wave"
              onClick={(e) => {
                e.currentTarget.blur();
                onContinueLastWave();
              }}
              className="min-h-[46px] w-full cursor-pointer rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold tracking-wide text-slate-950 uppercase hover:bg-amber-400"
            >
              Continue Wave {hud.wave}
            </button>
          ) : null}

          <button
            type="button"
            data-start="true"
            data-testid="restart-beginning"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestartFromBeginning();
            }}
            className={
              isGameOver && !canRetryWave
                ? 'min-h-[46px] w-full cursor-pointer rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold tracking-wide text-slate-950 uppercase hover:bg-amber-400'
                : 'min-h-[44px] w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-sm font-semibold tracking-wide text-slate-100 uppercase hover:bg-slate-700'
            }
          >
            {isGameOver
              ? canRetryWave
                ? 'Start from Wave 1'
                : 'Try Again'
              : 'Restart from Wave 1'}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTitle();
            }}
            className="min-h-[44px] w-full cursor-pointer rounded-xl border border-slate-800 bg-transparent px-5 py-2 text-sm font-semibold tracking-wide text-slate-400 uppercase hover:text-slate-200"
          >
            Back to Title
          </button>
        </div>
      </div>
    </div>
  );
};
