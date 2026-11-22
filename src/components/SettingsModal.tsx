import React from 'react';
import { Sliders, X } from 'lucide-react';
import { GameSettings, GraphicsQuality } from '../game/types';

interface SettingsModalProps {
  open: boolean;
  settings: GameSettings;
  onUpdate: (next: GameSettings) => void;
  onClose: () => void;
}

const QUALITY_OPTIONS: {
  value: GraphicsQuality;
  label: string;
  desc: string;
}[] = [
  {
    value: 'low',
    label: 'Low',
    desc: '1.0x DPR · No shadows or rain',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: '1.25x mobile DPR · Reduced rain',
  },
  {
    value: 'high',
    label: 'High',
    desc: 'Full shadows · 1.5x mobile DPR cap',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  settings,
  onUpdate,
  onClose,
}) => {
  if (!open) return null;

  const activeQualityDesc =
    QUALITY_OPTIONS.find((q) => q.value === settings.graphicsQuality)?.desc ?? '';

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(7, 10, 16, 0.84)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        data-testid="settings-modal"
        className="w-full max-w-sm rounded-2xl border border-slate-700/85 p-5 shadow-2xl"
        style={{ backgroundColor: 'rgba(11, 16, 26, 0.96)' }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h2
              id="settings-heading"
              className="font-display text-lg font-extrabold tracking-wide text-white uppercase"
            >
              Engine &amp; Control Settings
            </h2>
          </div>
          <button
            type="button"
            data-testid="close-settings"
            aria-label="Close Settings"
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Graphics Quality */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
            <span className="text-slate-300">Graphics Quality</span>
            <span className="text-amber-300">{settings.graphicsQuality}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {QUALITY_OPTIONS.map((opt) => {
              const active = settings.graphicsQuality === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`setting-quality-${opt.value}`}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onUpdate({ ...settings, graphicsQuality: opt.value });
                  }}
                  className={`min-h-[42px] cursor-pointer rounded-xl border px-2 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors ${
                    active
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            {activeQualityDesc}
          </div>
        </div>

        {/* Toggle Rows */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={settings.hapticsEnabled}
            data-testid="setting-haptics"
            onClick={(e) => {
              e.currentTarget.blur();
              onUpdate({ ...settings, hapticsEnabled: !settings.hapticsEnabled });
            }}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-2 text-left transition-colors hover:border-slate-600"
          >
            <div>
              <div className="text-xs font-bold tracking-wide text-white uppercase">
                Haptics Vibration
              </div>
              <div className="text-[11px] text-slate-400">
                Shotgun blasts, damage, turret &amp; revive bursts
              </div>
            </div>
            <span
              className={`font-mono-tabular shrink-0 rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                settings.hapticsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.hapticsEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={settings.autoFire}
            data-testid="setting-autofire"
            onClick={(e) => {
              e.currentTarget.blur();
              onUpdate({ ...settings, autoFire: !settings.autoFire });
            }}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-2 text-left transition-colors hover:border-slate-600"
          >
            <div>
              <div className="text-xs font-bold tracking-wide text-white uppercase">
                Auto-Fire Mode
              </div>
              <div className="text-[11px] text-slate-400">
                Auto-tracks and fires at nearest infected in range
              </div>
            </div>
            <span
              className={`font-mono-tabular shrink-0 rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                settings.autoFire
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.autoFire ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={settings.showFps}
            data-testid="setting-fps"
            onClick={(e) => {
              e.currentTarget.blur();
              onUpdate({ ...settings, showFps: !settings.showFps });
            }}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/75 px-3.5 py-2 text-left transition-colors hover:border-slate-600"
          >
            <div>
              <div className="text-xs font-bold tracking-wide text-white uppercase">
                Show FPS Counter
              </div>
              <div className="text-[11px] text-slate-400">
                Live frame rate readout in combat HUD
              </div>
            </div>
            <span
              className={`font-mono-tabular shrink-0 rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                settings.showFps
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.showFps ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onClose();
          }}
          className="mt-5 min-h-[44px] w-full cursor-pointer rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400"
        >
          Done
        </button>
      </div>
    </div>
  );
};
