import { useCallback, useEffect, useRef, useState } from 'react';
import { HudOverlay } from './components/HudOverlay';
import { SettingsModal } from './components/SettingsModal';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import { loadCareerStats } from './game/career';
import { loadSettings } from './game/settings';
import { loadHighScore, loadRunProgress } from './game/storage';
import {
  CareerStats,
  FloatingDamage,
  GameSettings,
  HudSnapshot,
  RemoteAppConfig,
  SavedRunProgress,
  SkinId,
} from './game/types';
import {
  createInitialUpgradeLevels,
  KILLS_PER_UPGRADE_POINT,
} from './game/upgrades';
import { APP_VERSION } from './game/version';
import { createInitialWeapons } from './game/weapons';
import { parseWeatherParam } from './game/weather';
import { GameEngine } from './scene/GameEngine';
import { checkForAndroidUpdate } from './services/updateChecker';

function createDefaultHudSnapshot(): HudSnapshot {
  const saved = loadRunProgress();
  const initialCareer = loadCareerStats();
  const initialSettings = loadSettings();
  return {
    phase: 'title',
    hp: 100,
    maxHp: 100,
    ghostHp: 100,
    score: 0,
    highScore: loadHighScore(),
    wave: 1,
    zombiesRemaining: 0,
    activeWeapon: 'pistol',
    weapons: createInitialWeapons(),
    isReloading: false,
    reloadProgress: 0,
    dashCooldownProgress: 1,
    equippedGear: saved?.equippedGear ?? 'mine',
    gearCooldownProgress: 1,
    gearCooldownRemaining: 0,
    rapidFireRemaining: 0,
    muted: false,
    waveBanner: null,
    pickupToast: null,
    skinUnlockToast: null,
    kills: 0,
    damageTaken: 0,
    isNewHighScore: false,
    upgradePoints: 1,
    killsTowardNextUp: 0,
    killsPerUp: KILLS_PER_UPGRADE_POINT,
    upgradeLevels: createInitialUpgradeLevels(),
    activeBoss: null,
    weather: 'clear',
    bloodSplatter: 0,
    bloodSeed: 1,
    hasUsedRevive: false,
    fps: 60,
    showFps: initialSettings.showFps,
    autoFire: initialSettings.autoFire,
    equippedSkinId: initialCareer.equippedSkinId,
    selectedClass: initialCareer.selectedClass,
    lastScrapEarned: 0,
    minimap: {
      playerX: 0,
      playerZ: 0,
      playerAimAngle: 0,
      enemies: [],
      pickups: [],
      hazards: [],
    },
  };
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(() => createDefaultHudSnapshot());
  const [savedProgress, setSavedProgress] = useState<SavedRunProgress | null>(() =>
    loadRunProgress(),
  );
  const [career, setCareer] = useState<CareerStats>(() => loadCareerStats());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [androidUpdate, setAndroidUpdate] = useState<RemoteAppConfig | null>(null);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const [upgradesOpen, setUpgradesOpen] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    if (hud.phase !== 'playing' && upgradesOpen) {
      setUpgradesOpen(false);
      engineRef.current?.setUpgradeDrawerOpen(false);
    }
  }, [hud.phase, upgradesOpen]);

  useEffect(() => {
    let active = true;
    checkForAndroidUpdate(APP_VERSION)
      .then((res) => {
        if (active && res) {
          setAndroidUpdate(res);
        }
      })
      .catch(() => {
        // Update check silently ignored if offline or unauthorized
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyU' && hud.phase === 'playing') {
        setUpgradesOpen((prev) => {
          const next = !prev;
          engineRef.current?.setUpgradeDrawerOpen(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hud.phase]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    const waveParam = Number(params.get('wave') || '1');
    const startWave = Number.isFinite(waveParam) && waveParam >= 1 ? waveParam : 1;
    const startWeather = parseWeatherParam(params.get('weather'));

    let engine: GameEngine | null = null;
    try {
      engine = new GameEngine(
        container,
        {
          onHudUpdate: (snapshot) => setHud(snapshot),
          onFloatingDamageUpdate: (items) => setFloatingDamages(items),
          onSavedProgressUpdate: (saved) => setSavedProgress(saved),
          onCareerUpdate: (nextCareer) => setCareer(nextCareer),
          onSettingsUpdate: (nextSettings) => setSettings(nextSettings),
        },
        autostart,
        startWave,
        startWeather,
      );
      engineRef.current = engine;
    } catch (err) {
      setWebglError(
        err instanceof Error ? err.message : 'Unable to initialize 3D WebGL renderer.',
      );
    }

    return () => {
      engineRef.current = null;
      engine?.dispose();
    };
  }, []);

  const handleToggleUpgrades = () => {
    setUpgradesOpen((prev) => {
      const next = !prev;
      engineRef.current?.setUpgradeDrawerOpen(next);
      return next;
    });
  };

  const handleSkinPreviewChange = useCallback(
    (active: boolean, skinId?: SkinId) => {
      engineRef.current?.setSkinPreviewMode(active, skinId);
    },
    [],
  );

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#070a10] touch-none select-none">
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 h-full w-full touch-none"
      />

      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a10] p-6 text-center">
          <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h1 className="font-display text-2xl font-bold text-white uppercase">
              3D Graphics Unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-300">{webglError}</p>
          </div>
        </div>
      )}

      {!webglError && hud.phase === 'title' && (
        <TitleScreen
          highScore={hud.highScore}
          savedProgress={savedProgress}
          equippedGear={hud.equippedGear}
          career={career}
          androidUpdate={androidUpdate}
          onEquipGear={(id) => engineRef.current?.equipGear(id)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSkinPreviewChange={handleSkinPreviewChange}
          onEquipSkin={(skinId) => engineRef.current?.equipSkin(skinId)}
          onSelectClass={(classId) => engineRef.current?.selectClass(classId)}
          onBuyPermanentUpgrade={(id) =>
            engineRef.current?.buyPermanentUpgrade(id)
          }
          onStartFromBeginning={() => {
            setSettingsOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.startNewGame({ fromBeginning: true });
          }}
          onResumeInterrupted={() => {
            setSettingsOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.startNewGame({
              fromBeginning: false,
              resumeInterrupted: true,
            });
          }}
        />
      )}

      {!webglError && hud.phase === 'title' && (
        <SettingsModal
          open={settingsOpen}
          settings={settings}
          onUpdate={(next) => {
            setSettings(next);
            engineRef.current?.setSettings(next);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {!webglError && hud.phase !== 'title' && (
        <HudOverlay
          hud={hud}
          floatingDamages={floatingDamages}
          upgradesOpen={upgradesOpen}
          onMoveStick={(x, y) => engineRef.current?.setMoveStick(x, y)}
          onAimStick={(x, y, active) =>
            engineRef.current?.setAimStick(x, y, active)
          }
          onDash={() => engineRef.current?.triggerDash()}
          onReload={() => engineRef.current?.triggerReload()}
          onSwitchWeapon={() => engineRef.current?.switchWeapon()}
          onTriggerGear={() => engineRef.current?.triggerGear()}
          onEquipGear={(id) => engineRef.current?.equipGear(id)}
          onPrevWeapon={() => engineRef.current?.prevWeapon()}
          onNextWeapon={() => engineRef.current?.switchWeapon()}
          onSelectWeapon={(id) => engineRef.current?.selectWeapon(id)}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onPause={() => {
            setUpgradesOpen(false);
            engineRef.current?.pauseGame();
          }}
          onToggleUpgrades={handleToggleUpgrades}
          onBuyUpgrade={(id) => engineRef.current?.buyUpgrade(id)}
        />
      )}

      {!webglError && (
        <StatusModal
          hud={hud}
          onResume={() => engineRef.current?.resumeGame()}
          onRevive={() => engineRef.current?.triggerRevive()}
          onEndRun={() => engineRef.current?.confirmEndRun()}
          onRestartFromBeginning={() => {
            setUpgradesOpen(false);
            engineRef.current?.startNewGame({ fromBeginning: true });
          }}
          onTitle={() => {
            setUpgradesOpen(false);
            engineRef.current?.returnToTitle();
          }}
        />
      )}
    </main>
  );
}
