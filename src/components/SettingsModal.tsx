import React, { useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  Gamepad2,
  RotateCcw,
  Sliders,
  Volume2,
  X,
} from 'lucide-react';
import { DEFAULT_TOUCH_HUD_SETTINGS } from '../game/settings';
import {
  CareerStats,
  FpsCap,
  GameSettings,
  GraphicsQuality,
  TouchButtonOffset,
} from '../game/types';
import {
  CloudPlayerSnapshot,
  createTransferCode,
  redeemTransferCode,
} from '../services/cloudSaveService';

interface SettingsModalProps {
  open: boolean;
  settings: GameSettings;
  userUid: string | null;
  career: CareerStats;
  highScore: number;
  callsign: string;
  clanTag: string;
  onUpdate: (next: GameSettings) => void;
  onCloudRestore: (snapshot: CloudPlayerSnapshot) => void;
  onClose: () => void;
}

type SettingsTab = 'general' | 'hud' | 'cloud';

const QUALITY_OPTIONS: {
  value: GraphicsQuality;
  label: string;
  desc: string;
}[] = [
  {
    value: 'low',
    label: 'Low',
    desc: '0.75x scale · No shadows, bloom or rain',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: '1.25x mobile DPR · Balanced shadows & rain',
  },
  {
    value: 'high',
    label: 'High',
    desc: 'Bloom + full shadows · 1.5x mobile DPR cap',
  },
];

const FPS_CAP_OPTIONS: FpsCap[] = [30, 60, 120];

const HUD_OFFSET_FIELDS: Array<{
  key: 'dashOffset' | 'ultimateOffset' | 'gadgetOffset' | 'reloadOffset';
  label: string;
}> = [
  { key: 'dashOffset', label: 'Dash Button' },
  { key: 'ultimateOffset', label: 'Ultimate Button' },
  { key: 'gadgetOffset', label: 'Gadget Button' },
  { key: 'reloadOffset', label: 'Reload Button' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  settings,
  userUid,
  career,
  highScore,
  callsign,
  clanTag,
  onUpdate,
  onCloudRestore,
  onClose,
}) => {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  if (!open) return null;

  const activeQualityDesc =
    QUALITY_OPTIONS.find((q) => q.value === settings.graphicsQuality)?.desc ?? '';

  const updateOffset = (
    key: 'dashOffset' | 'ultimateOffset' | 'gadgetOffset' | 'reloadOffset',
    axis: keyof TouchButtonOffset,
    delta: number,
  ) => {
    const cur = settings.touchHud[key];
    const nextVal = Math.max(-72, Math.min(72, cur[axis] + delta));
    onUpdate({
      ...settings,
      touchHud: {
        ...settings.touchHud,
        [key]: {
          ...cur,
          [axis]: nextVal,
        },
      },
    });
  };

  const handleGenerateCode = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    setCloudMessage(null);
    setCopied(false);
    try {
      const code = await createTransferCode({
        career,
        highScore,
        callsign,
        clanTag,
      });
      setGeneratedCode(code);
      setCloudMessage({
        kind: 'ok',
        text: 'Cloud snapshot backed up. Save this 6-char code to restore on any device.',
      });
    } catch (err) {
      setCloudMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Unable to generate Transfer Code.',
      });
    } finally {
      setCloudBusy(false);
    }
  };

  const handleRedeemCode = async () => {
    if (cloudBusy) return;
    setCloudBusy(true);
    setCloudMessage(null);
    try {
      const restored = await redeemTransferCode(redeemInput);
      onCloudRestore(restored);
      setRedeemInput('');
      setCloudMessage({
        kind: 'ok',
        text: `Restored ${restored.callsign} (${restored.career.scrap} Scrap, Best ${restored.highScore.toLocaleString()} pts).`,
      });
    } catch (err) {
      setCloudMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Unable to redeem Transfer Code.',
      });
    } finally {
      setCloudBusy(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard?.writeText(generatedCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(7, 10, 16, 0.86)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        data-testid="settings-modal"
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-2xl border border-slate-700/85 p-4 shadow-2xl sm:p-5"
        style={{ backgroundColor: 'rgba(11, 16, 26, 0.97)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h2
              id="settings-heading"
              className="font-display text-lg font-extrabold tracking-wide text-white uppercase"
            >
              Settings &amp; Cloud Sync
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
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div
          role="tablist"
          aria-label="Settings Categories"
          className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'general'}
            data-testid="settings-tab-general"
            onClick={() => setTab('general')}
            className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
              tab === 'general'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Engine/Audio</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'hud'}
            data-testid="settings-tab-hud"
            onClick={() => setTab('hud')}
            className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
              tab === 'hud'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>Touch HUD</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'cloud'}
            data-testid="settings-tab-cloud"
            onClick={() => setTab('cloud')}
            className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
              tab === 'cloud'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Cloud Sync</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="mt-3 flex-1 overflow-y-auto pr-0.5">
          {tab === 'general' && (
            <div className="flex flex-col gap-3.5">
              {/* Graphics Quality */}
              <div>
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
                        className={`min-h-[38px] cursor-pointer rounded-xl border px-2 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors ${
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
                <div className="mt-1 text-[11px] text-slate-400">
                  {activeQualityDesc}
                </div>
              </div>

              {/* FPS Cap */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                  <span className="text-slate-300">Frame Rate Cap</span>
                  <span className="font-mono-tabular text-cyan-300">
                    {settings.fpsCap} FPS
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {FPS_CAP_OPTIONS.map((cap) => {
                    const active = settings.fpsCap === cap;
                    return (
                      <button
                        key={cap}
                        type="button"
                        data-testid={`setting-fps-${cap}`}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onUpdate({ ...settings, fpsCap: cap });
                        }}
                        className={`font-mono-tabular min-h-[36px] cursor-pointer rounded-xl border px-2 py-1 text-xs font-extrabold uppercase transition-colors ${
                          active
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                            : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {cap} FPS
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Sliders */}
              <div className="flex flex-col gap-2.5 rounded-xl border border-slate-800 bg-slate-900/65 p-3">
                <div className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                  Audio Mix
                </div>
                {(
                  [
                    {
                      key: 'masterVolume',
                      label: 'Master',
                      testId: 'slider-master-vol',
                    },
                    {
                      key: 'musicVolume',
                      label: 'Music',
                      testId: 'slider-music-vol',
                    },
                    {
                      key: 'sfxVolume',
                      label: 'SFX',
                      testId: 'slider-sfx-vol',
                    },
                  ] as const
                ).map((item) => {
                  const pct = Math.round(settings[item.key] * 100);
                  return (
                    <label
                      key={item.key}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="w-14 font-bold text-slate-300 uppercase">
                        {item.label}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        data-testid={item.testId}
                        value={pct}
                        onChange={(e) =>
                          onUpdate({
                            ...settings,
                            [item.key]: Number(e.target.value) / 100,
                          })
                        }
                        className="h-1.5 flex-1 cursor-pointer accent-amber-400"
                      />
                      <span className="font-mono-tabular w-10 text-right font-bold text-amber-300">
                        {pct}%
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.hapticsEnabled}
                  data-testid="setting-haptics"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onUpdate({ ...settings, hapticsEnabled: !settings.hapticsEnabled });
                  }}
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/75 px-3 py-2 text-left hover:border-slate-600"
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
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/75 px-3 py-2 text-left hover:border-slate-600"
                >
                  <div>
                    <div className="text-xs font-bold tracking-wide text-white uppercase">
                      Auto-Fire Mode
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Auto-tracks &amp; fires at nearest infected in range
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
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/75 px-3 py-2 text-left hover:border-slate-600"
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
            </div>
          )}

          {tab === 'hud' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                  <span className="text-slate-300">Joystick Size</span>
                  <span className="font-mono-tabular text-amber-300">
                    {settings.touchHud.joystickScale.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={75}
                  max={135}
                  step={5}
                  data-testid="slider-joystick-scale"
                  value={Math.round(settings.touchHud.joystickScale * 100)}
                  onChange={(e) =>
                    onUpdate({
                      ...settings,
                      touchHud: {
                        ...settings.touchHud,
                        joystickScale: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="h-1.5 w-full cursor-pointer accent-amber-400"
                />

                <div className="mt-3 mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                  <span className="text-slate-300">Controls Opacity</span>
                  <span className="font-mono-tabular text-cyan-300">
                    {Math.round(settings.touchHud.buttonOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  data-testid="slider-button-opacity"
                  value={Math.round(settings.touchHud.buttonOpacity * 100)}
                  onChange={(e) =>
                    onUpdate({
                      ...settings,
                      touchHud: {
                        ...settings.touchHud,
                        buttonOpacity: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="h-1.5 w-full cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                    Button Offset Nudge
                  </span>
                  <button
                    type="button"
                    data-testid="reset-touch-hud"
                    onClick={() =>
                      onUpdate({
                        ...settings,
                        touchHud: {
                          ...DEFAULT_TOUCH_HUD_SETTINGS,
                          dashOffset: { x: 0, y: 0 },
                          ultimateOffset: { x: 0, y: 0 },
                          gadgetOffset: { x: 0, y: 0 },
                          reloadOffset: { x: 0, y: 0 },
                        },
                      })
                    }
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-300 uppercase hover:border-amber-400 hover:text-amber-200"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {HUD_OFFSET_FIELDS.map((field) => {
                    const val = settings.touchHud[field.key];
                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/90 bg-slate-950/75 px-2.5 py-1.5"
                      >
                        <div>
                          <div className="text-[11px] font-bold text-slate-200 uppercase">
                            {field.label}
                          </div>
                          <div className="font-mono-tabular text-[10px] text-slate-400">
                            X {val.x}px · Y {val.y}px
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`${field.label} Left`}
                            onClick={() => updateOffset(field.key, 'x', -12)}
                            className="h-7 w-7 cursor-pointer rounded border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:border-amber-400"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            aria-label={`${field.label} Up`}
                            onClick={() => updateOffset(field.key, 'y', -12)}
                            className="h-7 w-7 cursor-pointer rounded border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:border-amber-400"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={`${field.label} Down`}
                            onClick={() => updateOffset(field.key, 'y', 12)}
                            className="h-7 w-7 cursor-pointer rounded border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:border-amber-400"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            aria-label={`${field.label} Right`}
                            onClick={() => updateOffset(field.key, 'x', 12)}
                            className="h-7 w-7 cursor-pointer rounded border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:border-amber-400"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
                Bluetooth Gamepad Supported: Left Stick Move · Right Stick Aim · R2 Fire · L2 Dash · L1 Gadget · R1 Gear · Y Ult · X Reload · B Swap
              </div>
            </div>
          )}

          {tab === 'cloud' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                  <span className="text-slate-300">Cloud Profile Status</span>
                  <span
                    className={
                      userUid ? 'text-emerald-400' : 'text-amber-300'
                    }
                  >
                    {userUid ? 'Auto-Synced' : 'Connecting...'}
                  </span>
                </div>
                <div className="font-mono-tabular mt-1 text-[11px] text-slate-400">
                  {clanTag ? `[${clanTag}] ` : ''}
                  {callsign} · {career.scrap} Scrap · Best {highScore.toLocaleString()}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  Your Scrap, Skins, Classes, Armory Weapons, Drones, Tech Lab, and Daily Contracts back up silently to Firestore. Generate a 6-character Transfer Code to move your save to another browser or Android APK.
                </p>

                <button
                  type="button"
                  data-testid="generate-transfer-code"
                  disabled={cloudBusy}
                  onClick={() => void handleGenerateCode()}
                  className="mt-3 min-h-[40px] w-full cursor-pointer rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-3 py-2 text-xs font-extrabold tracking-wider text-cyan-200 uppercase hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  {cloudBusy ? 'Syncing...' : 'Generate 6-Char Transfer Code'}
                </button>

                {generatedCode && (
                  <div
                    data-testid="generated-transfer-code"
                    className="mt-2.5 flex items-center justify-between rounded-xl border border-amber-400/60 bg-slate-950 px-3 py-2"
                  >
                    <span className="font-mono-tabular text-lg font-black tracking-[0.25em] text-amber-300">
                      {generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-200 uppercase hover:border-amber-400"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
                <label
                  htmlFor="redeem-transfer-code"
                  className="block text-[11px] font-bold tracking-wider text-slate-300 uppercase"
                >
                  Restore From Transfer Code
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="redeem-transfer-code"
                    data-testid="redeem-transfer-input"
                    type="text"
                    maxLength={6}
                    value={redeemInput}
                    onChange={(e) =>
                      setRedeemInput(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6),
                      )
                    }
                    placeholder="ABC234"
                    className="font-mono-tabular h-9 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-extrabold tracking-[0.2em] text-amber-300 uppercase focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-testid="redeem-transfer-btn"
                    disabled={cloudBusy || redeemInput.length !== 6}
                    onClick={() => void handleRedeemCode()}
                    className="h-9 cursor-pointer rounded-lg bg-amber-500 px-3 text-[11px] font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Restore
                  </button>
                </div>
              </div>

              {cloudMessage && (
                <div
                  data-testid="cloud-sync-message"
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                    cloudMessage.kind === 'ok'
                      ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200'
                      : 'border-rose-500/50 bg-rose-950/50 text-rose-200'
                  }`}
                >
                  {cloudMessage.text}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onClose();
          }}
          className="mt-4 min-h-[42px] w-full cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold tracking-wider text-slate-950 uppercase hover:bg-amber-400"
        >
          Done
        </button>
      </div>
    </div>
  );
};
