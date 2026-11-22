import React from 'react';
import { Check, Lock } from 'lucide-react';
import { getSkinProgress, SKIN_ORDER, SKIN_SPECS } from '../game/career';
import { CareerStats, SkinId } from '../game/types';

interface SkinsPanelProps {
  career: CareerStats;
  previewSkinId: SkinId;
  onPreview: (skinId: SkinId) => void;
  onEquip: (skinId: SkinId) => void;
}

export const SkinsPanel: React.FC<SkinsPanelProps> = ({
  career,
  previewSkinId,
  onPreview,
  onEquip,
}) => {
  const previewSpec = SKIN_SPECS[previewSkinId];

  return (
    <div
      data-testid="skins-panel"
      className="pointer-events-auto flex max-h-[42dvh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700/80 p-2.5 shadow-2xl sm:max-h-[48dvh] sm:p-4"
      style={{ backgroundColor: '#090A0F' }}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-800/90 pb-1.5">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
            Live 3D Operative Preview
          </div>
          <div className="font-display text-sm font-extrabold tracking-wide text-white uppercase sm:text-base">
            {previewSpec.name}
          </div>
        </div>
        <div className="font-mono-tabular text-[11px] font-semibold text-slate-400">
          {career.unlockedSkins.length}/{SKIN_ORDER.length} Unlocked
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-3 sm:gap-2">
        {SKIN_ORDER.map((id) => {
          const spec = SKIN_SPECS[id];
          const progress = getSkinProgress(id, career);
          const isEquipped = career.equippedSkinId === id;
          const isPreviewing = previewSkinId === id;

          return (
            <div
              key={id}
              data-testid={`skin-card-${id}`}
              onClick={() => onPreview(id)}
              className={`flex cursor-pointer flex-col justify-between rounded-xl border p-2.5 transition-colors ${
                isPreviewing
                  ? 'border-cyan-400 bg-slate-900/95'
                  : 'border-slate-800 bg-[#0e111a] hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: spec.previewAccentHex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-extrabold tracking-wide text-white uppercase">
                      {spec.name}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                      {spec.unlockRequirementText}
                    </div>
                  </div>
                </div>

                {/* FX Tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {spec.fxTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-slate-700/80 bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-300 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Unlock Progress Bar */}
                {!progress.unlocked && (
                  <div className="mt-2">
                    <div className="font-mono-tabular flex justify-between text-[9px] font-semibold text-slate-400">
                      <span>Progress</span>
                      <span>{progress.label}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-slate-950">
                      <div
                        className="h-full transition-[width] duration-200"
                        style={{
                          width: `${Math.round(progress.ratio * 100)}%`,
                          backgroundColor: spec.previewAccentHex,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                data-testid={`skin-action-${id}`}
                disabled={!progress.unlocked || isEquipped}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onPreview(id);
                  if (progress.unlocked && !isEquipped) {
                    onEquip(id);
                  }
                }}
                className={`mt-2.5 flex min-h-[34px] w-full cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-wider uppercase transition-colors ${
                  isEquipped
                    ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : progress.unlocked
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                }`}
              >
                {isEquipped ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Equipped</span>
                  </>
                ) : progress.unlocked ? (
                  <span>Equip</span>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Locked</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
