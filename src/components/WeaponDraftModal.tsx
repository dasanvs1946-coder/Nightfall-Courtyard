import React from 'react';
import { PackagePlus, Zap } from 'lucide-react';
import { getWeaponEvolutionHint } from '../game/perks';
import { WeaponId, WeaponRuntimeState } from '../game/types';
import { WEAPON_SPECS } from '../game/weapons';

interface WeaponDraftModalProps {
  wave: number;
  choices: WeaponId[] | null;
  weapons: WeaponRuntimeState[];
  onSelectWeapon: (weaponId: WeaponId) => void;
}

export const WeaponDraftModal: React.FC<WeaponDraftModalProps> = ({
  wave,
  choices,
  weapons,
  onSelectWeapon,
}) => {
  if (!choices || choices.length === 0) return null;

  return (
    <div
      data-testid="weapon-draft-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weapon-draft-heading"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(9, 10, 15, 0.9)' }}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-2xl border border-cyan-500/60 p-4 shadow-[0_0_48px_rgba(34,211,238,0.2)] sm:p-6"
        style={{ backgroundColor: '#090A0F' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest text-cyan-300 uppercase">
              <PackagePlus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Arsenal Supply Drop · Wave {wave} Cleared</span>
            </div>
            <h2
              id="weapon-draft-heading"
              className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white uppercase sm:text-3xl"
            >
              Choose 1 Weapon Crate
            </h2>
          </div>
          <div className="font-mono-tabular rounded-lg border border-cyan-500/40 bg-slate-900/90 px-2.5 py-1 text-xs font-bold text-cyan-300 uppercase">
            Keys [1-3]
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 overflow-y-auto pr-0.5 sm:grid-cols-3">
          {choices.map((weaponId, idx) => {
            const spec = WEAPON_SPECS[weaponId];
            const runtime = weapons.find((w) => w.id === weaponId);
            const alreadyUnlocked = Boolean(runtime?.unlocked);
            const evoHint = getWeaponEvolutionHint(weaponId);

            return (
              <button
                key={weaponId}
                type="button"
                data-testid={`weapon-card-${weaponId}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectWeapon(weaponId);
                }}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-700/80 bg-[#0F131C] p-3.5 text-left transition-all hover:border-cyan-400 hover:bg-[#141C2A] active:scale-[0.99] sm:p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                        alreadyUnlocked
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {alreadyUnlocked ? 'Mastery +1 & Resupply' : 'New Unlock'}
                    </span>
                    <span className="font-mono-tabular rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 group-hover:border-cyan-400/60 group-hover:text-cyan-300">
                      [{idx + 1}]
                    </span>
                  </div>

                  <div className="font-display mt-2.5 text-lg font-extrabold tracking-wide text-white uppercase group-hover:text-cyan-300 sm:text-xl">
                    {spec.name}
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    {spec.role}
                  </p>

                  <div className="font-mono-tabular mt-2.5 flex items-center gap-2 text-[11px] font-bold text-slate-300">
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-300">
                      DMG {spec.damage}
                      {spec.pellets > 1 ? `x${spec.pellets}` : ''}
                    </span>
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-cyan-200">
                      MAG {spec.infiniteReserve ? '∞' : spec.magSize}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  {evoHint && (
                    <div className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[10px] font-semibold text-amber-200">
                      <Zap className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      <span>{evoHint}</span>
                    </div>
                  )}
                  <div className="rounded-lg bg-cyan-500/15 py-1.5 text-center text-[11px] font-extrabold tracking-wider text-cyan-200 uppercase transition-colors group-hover:bg-cyan-400 group-hover:text-slate-950">
                    {alreadyUnlocked ? 'Upgrade & Equip' : 'Claim Weapon'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
