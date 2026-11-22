import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Calendar, Globe, LogIn, LogOut, RefreshCw, Trophy, X } from 'lucide-react';
import { ARENA_SPECS, GAME_MODE_SPECS } from '../game/arenas';
import { SKIN_SPECS } from '../game/career';
import { getUtcDateKey } from '../game/dailyChallenge';
import {
  fetchDailyTop20,
  fetchGlobalTop20,
  LeaderboardRecord,
} from '../services/leaderboardService';

interface LeaderboardModalProps {
  open: boolean;
  user: User | null;
  currentCallsign: string;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}

type BoardTab = 'global' | 'daily';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  open,
  user,
  currentCallsign,
  onSignIn,
  onSignOut,
  onClose,
}) => {
  const [boardTab, setBoardTab] = useState<BoardTab>('global');
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const dateKey = getUtcDateKey();

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows =
        boardTab === 'global'
          ? await fetchGlobalTop20()
          : await fetchDailyTop20(dateKey);
      setRecords(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach leaderboard right now.',
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [boardTab, dateKey]);

  useEffect(() => {
    if (open) {
      void loadBoard();
    }
  }, [open, loadBoard]);

  if (!open) return null;

  return (
    <div
      data-testid="leaderboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(7, 10, 16, 0.88)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-heading"
        className="flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-2xl border border-amber-500/50 p-4 shadow-2xl sm:p-5"
        style={{ backgroundColor: '#090A0F' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15">
              <Trophy className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <h2
                id="leaderboard-heading"
                className="font-display text-lg font-extrabold tracking-wide text-white uppercase sm:text-xl"
              >
                Top 20 Survivors
              </h2>
              <p className="font-mono-tabular text-[11px] text-slate-400">
                Active Callsign: <span className="font-bold text-amber-300">{currentCallsign}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Refresh Leaderboard"
              onClick={() => void loadBoard()}
              disabled={loading}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              data-testid="close-leaderboard"
              aria-label="Close Leaderboard"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Auth Status & Board Tabs */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label="Leaderboard Scope"
            className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={boardTab === 'global'}
              data-testid="lb-tab-global"
              onClick={() => setBoardTab('global')}
              className={`flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase ${
                boardTab === 'global'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Global Top 20</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={boardTab === 'daily'}
              data-testid="lb-tab-daily"
              onClick={() => setBoardTab('daily')}
              className={`flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase ${
                boardTab === 'daily'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily ({dateKey})</span>
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="max-w-[140px] truncate font-medium text-emerald-300">
                {user.email || 'Signed In'}
              </span>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => {
                  setAuthBusy(true);
                  void onSignOut().finally(() => setAuthBusy(false));
                }}
                className="flex min-h-[32px] cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-300 uppercase hover:text-white"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="lb-google-signin"
              disabled={authBusy}
              onClick={() => {
                setAuthBusy(true);
                void onSignIn().finally(() => setAuthBusy(false));
              }}
              className="flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg border border-cyan-400/60 bg-cyan-500/15 px-3 py-1 text-[11px] font-extrabold tracking-wider text-cyan-200 uppercase hover:bg-cyan-500/25 disabled:opacity-50"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In to Post Scores</span>
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#0d111a]">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Loading Rankings...
            </div>
          ) : error ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 p-4 text-center">
              <div className="text-xs font-semibold text-rose-300">{error}</div>
              <button
                type="button"
                onClick={() => void loadBoard()}
                className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white uppercase"
              >
                Retry
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-1.5 p-4 text-center">
              <div className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                No {boardTab === 'daily' ? "Today's Daily" : 'Global'} Runs Posted Yet
              </div>
              <p className="max-w-xs text-[11px] text-slate-400">
                Sign in with Google and survive a run to claim Rank #1 on the board.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {records.map((entry, idx) => {
                const isSelf = user?.uid === entry.uid;
                const skin = SKIN_SPECS[entry.skinId];
                const arenaSpec = ARENA_SPECS[entry.arena];
                const modeSpec = GAME_MODE_SPECS[entry.mode];
                return (
                  <div
                    key={`${entry.uid}-${idx}`}
                    data-testid={`lb-row-${idx}`}
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-xs ${
                      isSelf
                        ? 'border-l-2 border-amber-400 bg-amber-500/12'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`font-mono-tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <span
                        title={skin.name}
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full border border-white/25"
                        style={{ backgroundColor: skin.previewAccentHex }}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-tabular truncate font-extrabold text-white">
                            {entry.callsign}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300 uppercase">
                            {entry.platform}
                          </span>
                          {isSelf && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-300 uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span style={{ color: modeSpec.accentHex }}>
                            {modeSpec.shortLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{arenaSpec.shortLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="font-mono-tabular flex items-center gap-3 text-right">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">
                          Wave
                        </div>
                        <div className="font-bold text-sky-300">W{entry.wave}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">
                          Kills
                        </div>
                        <div className="font-bold text-slate-200">{entry.kills}</div>
                      </div>
                      <div className="min-w-[66px]">
                        <div className="text-[9px] font-bold text-slate-500 uppercase">
                          Score
                        </div>
                        <div className="font-extrabold text-amber-400">
                          {entry.score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
