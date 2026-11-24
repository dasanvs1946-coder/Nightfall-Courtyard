import React, { useState } from 'react';
import { Download, Share2, ShieldCheck, Sliders, Trophy } from 'lucide-react';
import { ARENA_SPECS, GAME_MODE_SPECS } from '../game/arenas';
import { HudSnapshot } from '../game/types';
import { shareOrDownloadBattleCard } from '../services/battleCard';

interface StatusModalProps {
  hud: HudSnapshot;
  leaderboardStatus: string | null;
  onResume: () => void;
  onRevive: () => void;
  onEndRun: () => void;
  onRestartFromBeginning: () => void;
  onTitle: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  hud,
  leaderboardStatus,
  onResume,
  onRevive,
  onEndRun,
  onRestartFromBeginning,
  onTitle,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  const [cardState, setCardState] = useState<'idle' | 'saving' | 'done'>('idle');

  if (
    hud.phase !== 'paused' &&
    hud.phase !== 'revive' &&
    hud.phase !== 'gameover'
  ) {
    return null;
  }

  if (hud.phase === 'revive') {
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4"
        style={{ backgroundColor: 'rgba(7, 10, 16, 0.84)' }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="revive-modal-heading"
          data-testid="revive-modal"
          className="w-full max-w-sm rounded-2xl border border-cyan-400/70 p-6 shadow-[0_0_40px_rgba(34,211,238,0.22)]"
          style={{ backgroundColor: 'rgba(11, 18, 30, 0.96)' }}
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-300 uppercase">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span>Critical Condition · Wave {hud.wave}</span>
          </div>

          <h2
            id="revive-modal-heading"
            className="font-display mt-1.5 text-2xl font-extrabold tracking-tight text-white uppercase sm:text-3xl"
          >
            SECOND CHANCE — FREE REVIVE
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
            Restore 75% HP, refill your active magazine, unleash a shockwave that clears acid &amp; knocks back nearby zombies, and gain 3s invulnerability.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-800 py-3">
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Wave
              </div>
              <div className="font-mono-tabular mt-0.5 text-lg font-bold text-white">
                {hud.wave}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Score
              </div>
              <div className="font-mono-tabular mt-0.5 text-lg font-bold text-amber-400">
                {hud.score}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Kills
              </div>
              <div className="font-mono-tabular mt-0.5 text-lg font-bold text-cyan-300">
                {hud.kills}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="revive-now"
              onClick={(e) => {
                e.currentTarget.blur();
                onRevive();
              }}
              className="min-h-[48px] w-full cursor-pointer rounded-xl bg-cyan-400 px-5 py-3 text-sm font-extrabold tracking-wide text-slate-950 uppercase shadow-lg transition-transform hover:bg-cyan-300 active:scale-[0.98]"
            >
              Revive Now (1 Left)
            </button>

            <button
              type="button"
              data-testid="end-run"
              onClick={(e) => {
                e.currentTarget.blur();
                onEndRun();
              }}
              className="min-h-[42px] w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-2 text-xs font-bold tracking-wide text-slate-300 uppercase hover:border-rose-500/70 hover:text-rose-200"
            >
              End Run
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isGameOver = hud.phase === 'gameover';
  const arenaName = ARENA_SPECS[hud.arena].shortLabel;
  const modeName = GAME_MODE_SPECS[hud.mode].shortLabel;

  const displayIdentity = hud.clanTag
    ? `[${hud.clanTag}] ${hud.callsign}`
    : hud.callsign;

  const handleBattleCard = async () => {
    if (cardState === 'saving') return;
    setCardState('saving');
    const res = await shareOrDownloadBattleCard({
      callsign: hud.callsign,
      clanTag: hud.clanTag,
      skinId: hud.equippedSkinId,
      mode: hud.mode,
      arena: hud.arena,
      wave: hud.wave,
      kills: hud.kills,
      bossesKilled: hud.bossesKilledInRun,
      score: hud.score,
      isNewHighScore: hud.isNewHighScore,
    });
    setCardState(res === 'failed' ? 'idle' : 'done');
    setTimeout(() => setCardState('idle'), 2600);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(7, 10, 16, 0.84)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
        className={`max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6 ${
          isGameOver && hud.extractedVictory
            ? 'border-emerald-400/75 shadow-[0_0_36px_rgba(34,197,94,0.22)]'
            : 'border-slate-700/80'
        }`}
        style={{ backgroundColor: 'rgba(13, 19, 30, 0.96)' }}
      >
        <div
          className={`text-[11px] font-semibold tracking-widest uppercase ${
            isGameOver && hud.extractedVictory ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {isGameOver
            ? hud.extractedVictory
              ? `${displayIdentity} · ${arenaName} · EXFIL COMPLETE`
              : `${displayIdentity} · ${arenaName} · ${modeName}`
            : 'Simulation Paused'}
        </div>

        <h2
          id="modal-heading"
          data-testid="status-modal-heading"
          className={`font-display mt-1 text-3xl font-extrabold tracking-tight uppercase sm:text-4xl ${
            isGameOver && hud.extractedVictory ? 'text-emerald-300' : 'text-white'
          }`}
        >
          {isGameOver
            ? hud.extractedVictory
              ? 'Extraction Complete'
              : hud.customGameOverTitle || 'Game Over'
            : 'Paused'}
        </h2>

        {isGameOver && hud.extractedVictory && (
          <div
            data-testid="extraction-victory-badge"
            className="mt-1.5 text-xs font-extrabold tracking-wider text-emerald-300 uppercase"
          >
            Chopper Evacuated · Bonus Scrap Banked
          </div>
        )}

        {isGameOver && hud.isNewHighScore && (
          <div className="mt-1.5 text-xs font-bold tracking-wider text-emerald-400 uppercase">
            New High Score Recorded
          </div>
        )}

        {/* Tabular Run Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-800 py-3">
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
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Best
            </div>
            <div className="font-mono-tabular mt-0.5 text-xl font-bold text-slate-200">
              {hud.highScore.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>Kills · {hud.kills}</span>
          <span>Bosses · {hud.bossesKilledInRun}</span>
          <span>Dmg · {hud.damageTaken}</span>
        </div>

        {isGameOver && hud.lastScrapEarned > 0 && (
          <div
            data-testid="scrap-earned-badge"
            className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-extrabold tracking-wider text-amber-300 uppercase"
          >
            <span>Armory Scrap Earned</span>
            <span className="font-mono-tabular">+{hud.lastScrapEarned} SCRAP</span>
          </div>
        )}

        {isGameOver && leaderboardStatus && (
          <div
            data-testid="leaderboard-submit-status"
            className="mt-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-center text-[11px] font-semibold text-cyan-200"
          >
            {leaderboardStatus}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {!isGameOver && (
            <>
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
              <button
                type="button"
                data-testid="pause-open-settings"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenSettings();
                }}
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/85 px-5 py-2 text-xs font-bold tracking-wide text-slate-200 uppercase hover:border-amber-400/70 hover:text-amber-200"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                <span>Settings &amp; HUD</span>
              </button>
            </>
          )}

          {isGameOver && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="battle-card-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  void handleBattleCard();
                }}
                className="flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500/15 px-3 py-2 text-[11px] font-extrabold tracking-wide text-amber-200 uppercase hover:bg-amber-500/25"
              >
                {cardState === 'done' ? (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Card Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>{cardState === 'saving' ? 'Saving...' : 'Battle Card'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="gameover-leaderboard-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenLeaderboard();
                }}
                className="flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-500/15 px-3 py-2 text-[11px] font-extrabold tracking-wide text-cyan-200 uppercase hover:bg-cyan-500/25"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>Top 20</span>
              </button>
            </div>
          )}

          <button
            type="button"
            data-start="true"
            data-testid="restart-beginning"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestartFromBeginning();
            }}
            className={
              isGameOver
                ? 'min-h-[46px] w-full cursor-pointer rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold tracking-wide text-slate-950 uppercase hover:bg-amber-400'
                : 'min-h-[42px] w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2 text-sm font-semibold tracking-wide text-slate-100 uppercase hover:bg-slate-700'
            }
          >
            {isGameOver ? 'New Run' : 'Restart from Wave 1'}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTitle();
            }}
            className="min-h-[40px] w-full cursor-pointer rounded-xl border border-slate-800 bg-transparent px-5 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase hover:text-slate-200"
          >
            Back to Title
          </button>
        </div>
      </div>
    </div>
  );
};
