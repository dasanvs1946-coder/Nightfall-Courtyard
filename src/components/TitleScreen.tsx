import React, { useEffect, useState } from 'react';
import { Download, Sliders } from 'lucide-react';
import { CLASS_SPECS, SKIN_SPECS } from '../game/career';
import { TACTICAL_GEAR_ORDER, TACTICAL_GEAR_SPECS } from '../game/tacticalGear';
import {
  CareerStats,
  PermanentUpgradeId,
  RemoteAppConfig,
  SavedRunProgress,
  SkinId,
  SurvivorClassId,
  TacticalGearId,
} from '../game/types';
import { APP_VERSION } from '../game/version';
import { BestiaryPanel } from './BestiaryPanel';
import { SkinsPanel } from './SkinsPanel';
import { WorkshopPanel } from './WorkshopPanel';

type TitleTab = 'play' | 'skins' | 'classes' | 'intel';

interface TitleScreenProps {
  highScore: number;
  savedProgress: SavedRunProgress | null;
  equippedGear: TacticalGearId;
  career: CareerStats;
  androidUpdate: RemoteAppConfig | null;
  onEquipGear: (id: TacticalGearId) => void;
  onOpenSettings: () => void;
  onSkinPreviewChange: (active: boolean, skinId?: SkinId) => void;
  onEquipSkin: (skinId: SkinId) => void;
  onSelectClass: (classId: SurvivorClassId) => void;
  onBuyPermanentUpgrade: (id: PermanentUpgradeId) => void;
  onStartFromBeginning: () => void;
  onResumeInterrupted: () => void;
}

const TAB_ITEMS: { id: TitleTab; label: string }[] = [
  { id: 'play', label: 'PLAY' },
  { id: 'skins', label: 'SKINS' },
  { id: 'classes', label: 'CLASSES' },
  { id: 'intel', label: 'INTEL' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highScore,
  savedProgress,
  equippedGear,
  career,
  androidUpdate,
  onEquipGear,
  onOpenSettings,
  onSkinPreviewChange,
  onEquipSkin,
  onSelectClass,
  onBuyPermanentUpgrade,
  onStartFromBeginning,
  onResumeInterrupted,
}) => {
  const [tab, setTab] = useState<TitleTab>('play');
  const [previewSkinId, setPreviewSkinId] = useState<SkinId>(career.equippedSkinId);

  useEffect(() => {
    setPreviewSkinId(career.equippedSkinId);
  }, [career.equippedSkinId]);

  useEffect(() => {
    if (tab === 'skins') {
      onSkinPreviewChange(true, previewSkinId);
    } else {
      onSkinPreviewChange(false);
    }
    return () => {
      onSkinPreviewChange(false);
    };
  }, [tab, previewSkinId, onSkinPreviewChange]);

  const canResume =
    savedProgress !== null && savedProgress.activeInterrupted !== false;
  const activeGearSpec = TACTICAL_GEAR_SPECS[equippedGear];
  const activeClassSpec = CLASS_SPECS[career.selectedClass];
  const activeSkinSpec = SKIN_SPECS[career.equippedSkinId];
  const isSkinsTab = tab === 'skins';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-8">
      {/* Subtle scrim for title readability (disabled in SKINS preview so 3D operative stays crystal clear) */}
      {!isSkinsTab && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 24% 34%, rgba(7, 10, 16, 0.78) 0%, rgba(7, 10, 16, 0.25) 55%, rgba(7, 10, 16, 0.65) 100%)',
          }}
        />
      )}

      {/* Top Bar: Version, Career Best/Scrap, Navigation Tabs & Settings */}
      <div className="pointer-events-auto flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono-tabular hud-text-shadow text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Nightfall Courtyard · {APP_VERSION}
          </div>

          <div className="flex items-center gap-2">
            {highScore > 0 && (
              <div className="font-mono-tabular hud-text-shadow text-xs font-bold tracking-wider text-amber-400 uppercase">
                Best · {highScore}
              </div>
            )}
            <div
              data-testid="title-scrap-badge"
              className="font-mono-tabular rounded-lg border border-amber-500/40 bg-slate-950/85 px-2 py-1 text-[11px] font-bold text-amber-300"
            >
              {career.scrap} SCRAP
            </div>
            <button
              type="button"
              data-testid="open-settings"
              aria-label="Open Settings"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenSettings();
              }}
              className="flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-200 uppercase hover:border-slate-500 hover:text-white"
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: PLAY | SKINS | CLASSES | INTEL */}
        <div
          role="tablist"
          aria-label="Armory and Mission Navigation"
          className="grid max-w-md grid-cols-4 gap-1.5 rounded-xl border border-slate-800/90 p-1"
          style={{ backgroundColor: 'rgba(9, 10, 15, 0.92)' }}
        >
          {TAB_ITEMS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`tab-${item.id}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setTab(item.id);
                }}
                className={`min-h-[36px] cursor-pointer rounded-lg px-2 py-1 text-[11px] font-extrabold tracking-wider uppercase transition-colors ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Android-Only Native Update Banner (Never renders on Web) */}
        {androidUpdate && (
          <div
            data-testid="android-update-banner"
            className="flex max-w-lg flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/75 bg-amber-950/90 px-3.5 py-2 text-xs shadow-lg"
          >
            <div>
              <div className="font-extrabold tracking-wide text-amber-300 uppercase">
                Update Available ({androidUpdate.latestVersion})
              </div>
              {androidUpdate.changelog && (
                <div className="text-[11px] text-slate-200">
                  {androidUpdate.changelog}
                </div>
              )}
            </div>
            <a
              href={androidUpdate.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[36px] items-center gap-1 rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
          </div>
        )}
      </div>

      {/* Center / Lower Stage Content by Active Tab */}
      {tab === 'play' && (
        <div className="pointer-events-auto my-auto max-w-lg">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <svg
              viewBox="0 0 48 48"
              className="h-8 w-8 shrink-0 text-amber-400 sm:h-10 sm:w-10"
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
            <span className="font-mono-tabular text-[11px] font-semibold tracking-widest text-amber-400/90 uppercase">
              {activeClassSpec.name} · {activeSkinSpec.name}
            </span>
          </div>

          <h1 className="font-display hud-text-shadow text-3xl font-extrabold tracking-tight text-white uppercase sm:text-6xl">
            Nightfall Courtyard
          </h1>

          <p className="hud-text-shadow mt-1.5 max-w-md text-xs leading-relaxed text-slate-300 sm:mt-2.5 sm:text-sm">
            Hold the dark urban plaza against Acid Spitters, Shadow Stalkers, Riot Breachers, and Iron Wardens. Earn Scrap to unlock classes and permanent armory upgrades.
          </p>

          {/* Compact Tactical Gear Loadout Selector */}
          <div
            className="mt-3 rounded-xl border border-slate-700/75 p-2.5 sm:mt-4"
            style={{ backgroundColor: 'rgba(10, 15, 24, 0.84)' }}
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
          <div className="mt-3.5 flex flex-col gap-2 sm:mt-4">
            {canResume && (
              <button
                type="button"
                data-testid="resume-interrupted-run"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onResumeInterrupted();
                }}
                className="group w-full cursor-pointer rounded-xl border border-cyan-400/80 bg-cyan-950/75 px-4 py-2.5 text-left shadow-[0_0_24px_rgba(34,211,238,0.28)] transition-all hover:border-cyan-300 hover:bg-cyan-900/80 active:scale-[0.99]"
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
      )}

      {tab === 'skins' && (
        <div className="mt-auto flex w-full justify-center pb-1">
          <SkinsPanel
            career={career}
            previewSkinId={previewSkinId}
            onPreview={(skinId) => setPreviewSkinId(skinId)}
            onEquip={onEquipSkin}
          />
        </div>
      )}

      {tab === 'classes' && (
        <div className="my-auto flex w-full justify-center">
          <WorkshopPanel
            career={career}
            onSelectClass={onSelectClass}
            onBuyPermanentUpgrade={onBuyPermanentUpgrade}
          />
        </div>
      )}

      {tab === 'intel' && (
        <div className="my-auto flex w-full justify-center">
          <BestiaryPanel career={career} />
        </div>
      )}

      {/* Single flat bottom control hint */}
      {!isSkinsTab && (
        <div className="hud-text-shadow text-center text-[11px] font-medium tracking-wide text-slate-400 sm:text-left sm:text-xs">
          Left Stick / WASD Move · Right Stick / Mouse Aim &amp; Fire · Space Dash · G/E Tactical Gear · R Reload
        </div>
      )}
    </div>
  );
};
