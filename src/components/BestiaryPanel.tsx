import React, { useState } from 'react';
import { Award, BookOpen, Check, Crosshair, ShieldAlert } from 'lucide-react';
import {
  BESTIARY_ENTRIES,
  BESTIARY_MAX_MILESTONE_TIERS,
  BESTIARY_MILESTONE_STEP,
  getBestiaryMasteryBonusPct,
  getBestiaryMasteryTier,
} from '../game/career';
import { getWeaponEvolutionHint } from '../game/perks';
import {
  getDailyContractsForDate,
  getNextCamoMilestone,
  getUnlockedWeaponCamos,
  refreshDailyContractsForDate,
  TECH_LAB_MAX_TIER,
  TECH_LAB_ORDER,
  WEAPON_CAMO_ORDER,
  WEAPON_CAMO_SPECS,
} from '../game/phase3Meta';
import { CareerStats, WeaponCamoId, WeaponId } from '../game/types';
import { WEAPON_ORDER, WEAPON_SPECS } from '../game/weapons';

type IntelSubtab = 'enemies' | 'weapons' | 'record';

interface BestiaryPanelProps {
  career: CareerStats;
  onEquipWeaponCamo: (weaponId: WeaponId, camoId: WeaponCamoId) => void;
}

export const BestiaryPanel: React.FC<BestiaryPanelProps> = ({
  career,
  onEquipWeaponCamo,
}) => {
  const [subtab, setSubtab] = useState<IntelSubtab>('enemies');

  const totalTechTiers = TECH_LAB_ORDER.reduce(
    (sum, id) => sum + (career.techLab[id] ?? 0),
    0,
  );
  const maxTechTiers = TECH_LAB_ORDER.length * TECH_LAB_MAX_TIER;
  const refreshedContracts = refreshDailyContractsForDate(career.dailyContracts);
  const dailyContracts = getDailyContractsForDate(refreshedContracts.dateKey);
  const completedContractsToday = dailyContracts.filter(
    (c) => (refreshedContracts.progress[c.id] ?? 0) >= c.target,
  ).length;

  let favoriteWeaponId: WeaponId = 'pistol';
  let favoriteWeaponKills = -1;
  for (const wId of WEAPON_ORDER) {
    const k = career.killsByWeapon[wId] ?? 0;
    if (k > favoriteWeaponKills) {
      favoriteWeaponKills = k;
      favoriteWeaponId = wId;
    }
  }

  return (
    <div
      data-testid="bestiary-panel"
      className="pointer-events-auto flex max-h-[62dvh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700/80 p-3.5 shadow-2xl sm:p-4"
      style={{ backgroundColor: 'rgba(9, 10, 15, 0.95)' }}
    >
      {/* Header + Subtabs */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-rose-400" />
          <div>
            <h2 className="font-display text-sm font-extrabold tracking-wide text-white uppercase sm:text-base">
              Tactical Intel Compendium
            </h2>
            <p className="text-[10px] text-slate-400">
              {subtab === 'enemies'
                ? `Every ${BESTIARY_MILESTONE_STEP} kills unlocks +5% permanent damage mastery (max +${BESTIARY_MAX_MILESTONE_TIERS * 5}%)`
                : subtab === 'weapons'
                  ? 'Kill milestones unlock Carbon Fiber (100), Tactical Gold (500), and Reactive Neon (1500) + DMG bonuses'
                  : 'Lifetime operative combat record & extraction statistics'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            data-testid="intel-subtab-enemies"
            onClick={(e) => {
              e.currentTarget.blur();
              setSubtab('enemies');
            }}
            className={`flex min-h-[28px] cursor-pointer items-center justify-center gap-1 rounded px-2 text-[10px] font-extrabold tracking-wider uppercase ${
              subtab === 'enemies'
                ? 'bg-rose-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Enemies</span>
          </button>
          <button
            type="button"
            data-testid="intel-subtab-weapons"
            onClick={(e) => {
              e.currentTarget.blur();
              setSubtab('weapons');
            }}
            className={`flex min-h-[28px] cursor-pointer items-center justify-center gap-1 rounded px-2 text-[10px] font-extrabold tracking-wider uppercase ${
              subtab === 'weapons'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Crosshair className="h-3 w-3" />
            <span>Weapons</span>
          </button>
          <button
            type="button"
            data-testid="intel-subtab-record"
            onClick={(e) => {
              e.currentTarget.blur();
              setSubtab('record');
            }}
            className={`flex min-h-[28px] cursor-pointer items-center justify-center gap-1 rounded px-2 text-[10px] font-extrabold tracking-wider uppercase ${
              subtab === 'record'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="h-3 w-3" />
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Enemies & Bosses */}
      {subtab === 'enemies' && (
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
                    <span>
                      Mastery Tier {tier}/{BESTIARY_MAX_MILESTONE_TIERS}
                    </span>
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
      )}

      {/* Subtab 2: Weapons & Mastery Camos */}
      {subtab === 'weapons' && (
        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
          {WEAPON_ORDER.map((wId) => {
            const spec = WEAPON_SPECS[wId];
            const kills = career.killsByWeapon[wId] ?? 0;
            const unlockedCamos = getUnlockedWeaponCamos(kills);
            const equippedCamo = career.equippedCamos[wId] ?? 'none';
            const nextMilestone = getNextCamoMilestone(kills);
            const evoHint = getWeaponEvolutionHint(wId);
            const rpm = Math.round(60 / Math.max(0.03, spec.fireInterval));
            const progressRatio = nextMilestone.nextCamo
              ? Math.min(1, nextMilestone.current / nextMilestone.target)
              : 1;

            return (
              <div
                key={wId}
                data-testid={`weapon-intel-${wId}`}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0e111a] p-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold tracking-wide text-white uppercase">
                      {spec.name}
                    </span>
                    <span className="font-mono-tabular rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      {kills.toLocaleString()} Kills
                    </span>
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-400">{spec.role}</div>

                  <div className="font-mono-tabular mt-1.5 grid grid-cols-4 gap-1 rounded bg-slate-950/90 px-1.5 py-1 text-center text-[9px] text-slate-300">
                    <span>DMG {spec.damage * spec.pellets}</span>
                    <span>{rpm} RPM</span>
                    <span>MAG {spec.magSize}</span>
                    <span>RNG {spec.range}m</span>
                  </div>

                  {evoHint && (
                    <div className="mt-1.5 text-[10px] font-semibold text-amber-300/90">
                      Evo: {evoHint}
                    </div>
                  )}
                </div>

                {/* Camo Milestone Progress + Equip Chips */}
                <div className="mt-2 border-t border-slate-800/80 pt-2">
                  <div className="font-mono-tabular flex justify-between text-[9px] text-slate-400">
                    <span>Mastery Camo</span>
                    <span>
                      {nextMilestone.nextCamo
                        ? `${nextMilestone.current}/${nextMilestone.target} ${WEAPON_CAMO_SPECS[nextMilestone.nextCamo].name}`
                        : 'All Camos Unlocked (+15% DMG)'}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-slate-950">
                    <div
                      className="h-full bg-cyan-400 transition-[width] duration-200"
                      style={{ width: `${Math.round(progressRatio * 100)}%` }}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-1">
                    {WEAPON_CAMO_ORDER.map((camoId) => {
                      const camoSpec = WEAPON_CAMO_SPECS[camoId];
                      const unlocked = unlockedCamos.includes(camoId);
                      const isEquipped = equippedCamo === camoId;
                      return (
                        <button
                          key={camoId}
                          type="button"
                          disabled={!unlocked || isEquipped}
                          data-testid={`equip-camo-${wId}-${camoId}`}
                          onClick={(e) => {
                            e.currentTarget.blur();
                            if (unlocked && !isEquipped) {
                              onEquipWeaponCamo(wId, camoId);
                            }
                          }}
                          className={`flex min-h-[26px] cursor-pointer items-center justify-center gap-0.5 rounded border px-1 text-[8px] font-extrabold tracking-wide uppercase ${
                            isEquipped
                              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                              : unlocked
                                ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-400'
                                : 'cursor-not-allowed border-slate-900 bg-slate-950 text-slate-600'
                          }`}
                        >
                          {isEquipped && <Check className="h-2.5 w-2.5 shrink-0" />}
                          <span className="truncate">
                            {camoId === 'none'
                              ? 'Base'
                              : camoId === 'carbon_fiber'
                                ? 'Carbon'
                                : camoId === 'tactical_gold'
                                  ? 'Gold'
                                  : 'Neon'}
                          </span>
                          {camoSpec.damageBonusPct > 0 && unlocked && (
                            <span className="text-emerald-300">
                              +{camoSpec.damageBonusPct}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab 3: Combat Record */}
      {subtab === 'record' && (
        <div
          data-testid="combat-record-panel"
          className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-0.5 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Total Eliminations
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-white">
              {career.totalKills.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Best Wave
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-amber-400">
              Wave {career.bestWave}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Highest Score
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-cyan-300">
              {career.bestScore.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Bosses Defeated
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-rose-400">
              {career.bossesKilled}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Extractions Completed
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-emerald-400">
              {career.totalExtractions}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Tech Lab Mastery
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-sky-300">
              {totalTechTiers}/{maxTechTiers}
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Favorite Weapon
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-display text-lg font-extrabold text-amber-300 uppercase">
                {WEAPON_SPECS[favoriteWeaponId].name}
              </span>
              <span className="font-mono-tabular text-xs font-bold text-slate-300">
                {Math.max(0, favoriteWeaponKills).toLocaleString()} Kills
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0e111a] p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Contracts Today
            </div>
            <div className="font-mono-tabular mt-1 text-2xl font-extrabold text-amber-300">
              {completedContractsToday}/{dailyContracts.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
