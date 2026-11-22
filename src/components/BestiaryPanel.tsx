import React from 'react';
import { BookOpen } from 'lucide-react';
import {
  BESTIARY_ENTRIES,
  BESTIARY_MAX_MILESTONE_TIERS,
  BESTIARY_MILESTONE_STEP,
  getBestiaryMasteryBonusPct,
  getBestiaryMasteryTier,
} from '../game/career';
import { CareerStats } from '../game/types';

interface BestiaryPanelProps {
  career: CareerStats;
}

export const BestiaryPanel: React.FC<BestiaryPanelProps> = ({ career }) => {
  return (
    <div
      data-testid="bestiary-panel"
      className="pointer-events-auto flex max-h-[62dvh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700/80 p-3.5 shadow-2xl sm:p-4"
      style={{ backgroundColor: 'rgba(9, 10, 15, 0.95)' }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-rose-400" />
          <div>
            <h2 className="font-display text-sm font-extrabold tracking-wide text-white uppercase sm:text-base">
              Threat Database (Bestiary)
            </h2>
            <p className="text-[10px] text-slate-400">
              Every {BESTIARY_MILESTONE_STEP} kills unlocks +5% permanent damage mastery (max +
              {BESTIARY_MAX_MILESTONE_TIERS * 5}%)
            </p>
          </div>
        </div>
        <div className="font-mono-tabular text-right text-[11px] font-bold text-slate-300">
          {career.totalKills.toLocaleString()} Total
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
        {BESTIARY_ENTRIES.map((entry) => {
          const kills = career.killsByEnemyType[entry.kind] ?? 0;
          const tier = getBestiaryMasteryTier(kills);
          const bonusPct = getBestiaryMasteryBonusPct(kills);
          const isMaxTier = tier >= BESTIARY_MAX_MILESTONE_TIERS;
          const nextMilestone = (tier + 1) * BESTIARY_MILESTONE_STEP;
          const progressWithinTier = isMaxTier
            ? 1
            : (kills % BESTIARY_MILESTONE_STEP) / BESTIARY_MILESTONE_STEP;

          return (
            <div
              key={entry.kind}
              data-testid={`bestiary-entry-${entry.kind}`}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0e111a] p-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.accentHex }}
                    />
                    <span className="text-xs font-extrabold tracking-wide text-white uppercase">
                      {entry.name}
                    </span>
                  </div>
                  <span
                    className={`font-mono-tabular rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      bonusPct > 0
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {bonusPct > 0 ? `+${bonusPct}% DMG` : entry.firstWave}
                  </span>
                </div>

                <div className="mt-0.5 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase">
                  <span>Threat: {entry.threatLevel}</span>
                  <span className="font-mono-tabular text-slate-300">
                    {kills.toLocaleString()} Kills
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-snug text-slate-300">
                  {entry.intelNote}
                </p>
              </div>

              <div className="mt-2">
                <div className="font-mono-tabular flex justify-between text-[9px] font-semibold text-slate-400">
                  <span>Mastery Tier {tier}/{BESTIARY_MAX_MILESTONE_TIERS}</span>
                  <span>
                    {isMaxTier
                      ? 'Max Mastery'
                      : `${kills}/${nextMilestone} Next +5%`}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-slate-950">
                  <div
                    className="h-full transition-[width] duration-200"
                    style={{
                      width: `${Math.round(progressWithinTier * 100)}%`,
                      backgroundColor: entry.accentHex,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
