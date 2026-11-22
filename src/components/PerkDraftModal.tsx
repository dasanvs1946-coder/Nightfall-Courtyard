import React from 'react';
import { Skull, Sparkles, Zap } from 'lucide-react';
import { CURSED_PERK_SPECS, PERK_SPECS } from '../game/perks';
import { CursedPerkId, PerkId } from '../game/types';

interface PerkDraftModalProps {
  wave: number;
  choices: PerkId[] | null;
  cursedChoice: CursedPerkId | null;
  ownedCount: number;
  onSelectPerk: (perkId: PerkId) => void;
  onSelectCursedPerk: (cursedId: CursedPerkId) => void;
}

export const PerkDraftModal: React.FC<PerkDraftModalProps> = ({
  wave,
  choices,
  cursedChoice,
  ownedCount,
  onSelectPerk,
  onSelectCursedPerk,
}) => {
  if (!choices || choices.length === 0) return null;

  const cursedSpec = cursedChoice ? CURSED_PERK_SPECS[cursedChoice] : null;
  const maxKeyLabel = cursedSpec ? 'Keys [1-4]' : 'Keys [1-3]';

  return (
    <div
      data-testid="perk-draft-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perk-draft-heading"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(9, 10, 15, 0.9)' }}
    >
      <div
        className={`flex max-h-[92dvh] w-full flex-col rounded-2xl border border-amber-500/60 p-4 shadow-[0_0_48px_rgba(245,158,11,0.2)] sm:p-6 ${
          cursedSpec ? 'max-w-4xl' : 'max-w-3xl'
        }`}
        style={{ backgroundColor: '#090A0F' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest text-amber-400 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Tactical Supply Draft · Wave {wave} Cleared</span>
            </div>
            <h2
              id="perk-draft-heading"
              className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white uppercase sm:text-3xl"
            >
              Choose 1 Tactical Perk
            </h2>
          </div>
          <div className="font-mono-tabular rounded-lg border border-amber-500/40 bg-slate-900/90 px-2.5 py-1 text-xs font-bold text-amber-300 uppercase">
            {ownedCount} Owned · {maxKeyLabel}
          </div>
        </div>

        <div
          className={`mt-4 grid grid-cols-1 gap-3 overflow-y-auto pr-0.5 ${
            cursedSpec ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
          }`}
        >
          {choices.map((perkId, idx) => {
            const spec = PERK_SPECS[perkId];
            return (
              <button
                key={perkId}
                type="button"
                data-testid={`perk-card-${perkId}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectPerk(perkId);
                }}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-700/80 bg-[#0F131C] p-3.5 text-left transition-all hover:border-amber-400 hover:bg-[#141A26] active:scale-[0.99] sm:p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase"
                      style={{
                        backgroundColor: `${spec.accentHex}22`,
                        color: spec.accentHex,
                      }}
                    >
                      {spec.tag}
                    </span>
                    <span className="font-mono-tabular rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 group-hover:border-amber-400/60 group-hover:text-amber-300">
                      [{idx + 1}]
                    </span>
                  </div>

                  <div className="font-display mt-2.5 text-lg font-extrabold tracking-wide text-white uppercase group-hover:text-amber-300 sm:text-xl">
                    {spec.name}
                  </div>

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    {spec.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2">
                  {spec.evolutionHint && (
                    <div className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[10px] font-semibold text-amber-200">
                      <Zap className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      <span>{spec.evolutionHint}</span>
                    </div>
                  )}
                  <div className="rounded-lg bg-amber-500/15 py-1.5 text-center text-[11px] font-extrabold tracking-wider text-amber-300 uppercase transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
                    Equip Perk
                  </div>
                </div>
              </button>
            );
          })}

          {cursedSpec && (
            <button
              key={cursedSpec.id}
              type="button"
              data-testid={`cursed-perk-card-${cursedSpec.id}`}
              onClick={(e) => {
                e.currentTarget.blur();
                onSelectCursedPerk(cursedSpec.id);
              }}
              className="group flex cursor-pointer flex-col justify-between rounded-xl border border-rose-500/75 bg-[#190B12] p-3.5 text-left shadow-[0_0_24px_rgba(244,63,94,0.18)] transition-all hover:border-rose-400 hover:bg-[#240F1A] active:scale-[0.99] sm:p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-rose-500/25 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-rose-300 uppercase">
                    <Skull className="h-3 w-3" />
                    <span>Cursed Pact</span>
                  </span>
                  <span className="font-mono-tabular rounded border border-rose-500/50 bg-rose-950 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                    [4]
                  </span>
                </div>

                <div className="font-display mt-2.5 text-lg font-extrabold tracking-wide text-rose-200 uppercase group-hover:text-white sm:text-xl">
                  {cursedSpec.name}
                </div>

                <div className="mt-2 space-y-1.5 text-xs leading-snug">
                  <div className="rounded border border-emerald-500/30 bg-emerald-950/35 px-2 py-1 font-semibold text-emerald-300">
                    + {cursedSpec.upside}
                  </div>
                  <div className="rounded border border-rose-500/35 bg-rose-950/55 px-2 py-1 font-semibold text-rose-300">
                    - {cursedSpec.downside}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2">
                <div className="rounded-lg bg-rose-500/25 py-1.5 text-center text-[11px] font-extrabold tracking-wider text-rose-200 uppercase transition-colors group-hover:bg-rose-500 group-hover:text-white">
                  Accept Pact
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
