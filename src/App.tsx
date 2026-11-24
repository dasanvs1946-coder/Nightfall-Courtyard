import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { HudOverlay } from './components/HudOverlay';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PerkDraftModal } from './components/PerkDraftModal';
import { SettingsModal } from './components/SettingsModal';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import { WeaponDraftModal } from './components/WeaponDraftModal';
import {
  ensureAnonymousAuth,
  subscribeToAuthState,
  testFirestoreConnection,
} from './firebase';
import { loadCareerStats } from './game/career';
import { loadSettings } from './game/settings';
import {
  loadCallsign,
  loadClanTag,
  loadHighScore,
  loadRunProgress,
} from './game/storage';
import {
  CareerStats,
  FloatingDamage,
  GameSettings,
  HudSnapshot,
  SavedRunProgress,
  SkinId,
} from './game/types';
import { ULTIMATE_SPECS } from './game/ultimates';
import {
  createInitialUpgradeLevels,
  createInitialWeaponMastery,
  KILLS_PER_UPGRADE_POINT,
} from './game/upgrades';
import { APP_VERSION } from './game/version';
import { createInitialWeapons } from './game/weapons';
import { parseWeatherParam } from './game/weather';
import { GameEngine } from './scene/GameEngine';
import {
  autoRestoreCloudSaveIfFresh,
  backupCareerToCloud,
  recordPlatformLogin,
} from './services/cloudSaveService';
import {
  fetchGlobalTop20,
  submitLeaderboardRun,
  updateLeaderboardCallsign,
  updateLeaderboardIdentity,
} from './services/leaderboardService';
import {
  AppUpdateInfo,
  checkForAppUpdate,
  triggerWebCacheBustReload,
} from './services/updateChecker';

function createDefaultHudSnapshot(): HudSnapshot {
  const saved = loadRunProgress();
  const initialCareer = loadCareerStats();
  const initialSettings = loadSettings();
  const initialCallsign = loadCallsign();
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
    equippedGadget: saved?.equippedGadget ?? 'tripmine',
    gadgetCooldownProgress: 1,
    gadgetCooldownRemaining: 0,
    equippedDrone: initialCareer.equippedDrone,
    ultimateCharge: 0,
    ultimateActiveRemaining: 0,
    ultimateName: ULTIMATE_SPECS[initialCareer.selectedClass].name,
    comboCount: 0,
    comboMultiplier: 1,
    comboTimerRatio: 0,
    comboCallout: null,
    rapidFireRemaining: 0,
    minigunRemaining: 0,
    muted: false,
    waveBanner: null,
    pickupToast: null,
    skinUnlockToast: null,
    evolutionBanner: null,
    kills: 0,
    damageTaken: 0,
    isNewHighScore: false,
    upgradePoints: 1,
    killsTowardNextUp: 0,
    killsPerUp: KILLS_PER_UPGRADE_POINT,
    upgradeLevels: createInitialUpgradeLevels(),
    weaponMastery: createInitialWeaponMastery(),
    ownedPerks: [],
    ownedCursedPerks: [],
    perkDraftChoices: null,
    cursedDraftChoice: null,
    weaponDraftChoices: null,
    evolvedWeapons: [],
    activeSynergies: [],
    arena: 'courtyard',
    mode: 'normal',
    dailyDateKey: null,
    dailyMutatorLabel: null,
    generators: [],
    barrelsReady: 0,
    inRunScrap: saved?.inRunScrap ?? 0,
    activeEvent: null,
    activePadPrompt: null,
    overchargeRemaining: 0,
    hazardWarningBanner: null,
    bossPhase2Active: false,
    bossesKilledInRun: 0,
    callsign: initialCallsign,
    clanTag: loadClanTag(),
    nextRival: null,
    rivalOvertakenBanner: null,
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
    weeklyMutatorId: null,
    weeklyMutatorName: null,
    reactorCore: null,
    extractionState: null,
    extractedVictory: false,
    customGameOverTitle: null,
    gadgetCharges: 1,
    gadgetMaxCharges: 1,
    perkRerollsRemaining: 0,
    sandboxMode: false,
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
  const submittedRunKeyRef = useRef<string | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(() => createDefaultHudSnapshot());
  const [savedProgress, setSavedProgress] = useState<SavedRunProgress | null>(() =>
    loadRunProgress(),
  );
  const [career, setCareer] = useState<CareerStats>(() => loadCareerStats());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState<string | null>(null);
  const [appUpdate, setAppUpdate] = useState<AppUpdateInfo | null>(null);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const [upgradesOpen, setUpgradesOpen] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const loginRecordedUidRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void testFirestoreConnection();

    const onAuthedUser = (user: User) => {
      if (!active) return;
      setFirebaseUser(user);
      setAuthErrorCode(null);
      engineRef.current?.setSelfUid(user.uid);
      if (loginRecordedUidRef.current !== user.uid) {
        loginRecordedUidRef.current = user.uid;
        void recordPlatformLogin(user).catch(() => {});
        void autoRestoreCloudSaveIfFresh()
          .then((restored) => {
            if (!active || !restored) return;
            setCareer(restored.career);
            engineRef.current?.applyCloudSyncState({
              career: restored.career,
              highScore: restored.highScore,
              callsign: restored.callsign,
              clanTag: restored.clanTag,
            });
          })
          .catch(() => {});
      }
    };

    const unsubscribe = subscribeToAuthState((user) => {
      if (!active) return;
      if (user) {
        onAuthedUser(user);
      } else {
        setFirebaseUser(null);
      }
    });
    void ensureAnonymousAuth().then((res) => {
      if (!active) return;
      if (res.user) {
        onAuthedUser(res.user);
      } else if (res.errorCode) {
        setAuthErrorCode(res.errorCode);
      }
    });

    // Prefetch Top 20 rivals so Live Next Rival HUD is primed on Run 1
    void fetchGlobalTop20()
      .then((rows) => {
        if (!active) return;
        engineRef.current?.refreshCachedRivals(
          rows.map((r) => ({
            uid: r.uid,
            callsign: r.callsign,
            clanTag: r.clanTag,
            score: r.score,
          })),
        );
      })
      .catch(() => {});

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Automatic debounced Cloud Save Sync whenever progression updates
  useEffect(() => {
    if (!firebaseUser) return;
    const timer = window.setTimeout(() => {
      void backupCareerToCloud({
        career,
        highScore: hud.highScore,
        callsign: hud.callsign,
        clanTag: hud.clanTag,
      }).catch(() => {});
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [firebaseUser, career, hud.highScore, hud.callsign, hud.clanTag]);

  useEffect(() => {
    if (hud.phase !== 'playing' && upgradesOpen) {
      setUpgradesOpen(false);
      engineRef.current?.setUpgradeDrawerOpen(false);
    }
  }, [hud.phase, upgradesOpen]);

  useEffect(() => {
    let active = true;
    checkForAppUpdate(APP_VERSION)
      .then((res) => {
        if (active && res) {
          setAppUpdate(res);
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
    if (hud.phase !== 'gameover') {
      submittedRunKeyRef.current = null;
      setLeaderboardStatus(null);
      return;
    }
    const runKey = `${hud.wave}-${hud.score}-${hud.kills}-${hud.mode}-${hud.arena}-${firebaseUser?.uid ?? 'pending'}`;
    if (submittedRunKeyRef.current === runKey) return;
    submittedRunKeyRef.current = runKey;

    if (hud.mode === 'sandbox') {
      setLeaderboardStatus('Sandbox run — excluded from Global Top 20.');
      return;
    }

    setLeaderboardStatus('Submitting score to Top 20...');
    submitLeaderboardRun({
      callsign: hud.callsign,
      clanTag: hud.clanTag,
      wave: hud.wave,
      kills: hud.kills,
      score: hud.score,
      mode: hud.mode,
      arena: hud.arena,
      skinId: hud.equippedSkinId,
      dailyDateKey: hud.dailyDateKey,
    })
      .then((res) => {
        if (res.submittedGlobal || res.submittedDaily) {
          setLeaderboardStatus(
            res.submittedDaily
              ? 'Published new Global & Daily Top 20 record!'
              : 'Published new Personal Best to Global Top 20!',
          );
          void fetchGlobalTop20()
            .then((rows) => {
              engineRef.current?.refreshCachedRivals(
                rows.map((r) => ({
                  uid: r.uid,
                  callsign: r.callsign,
                  clanTag: r.clanTag,
                  score: r.score,
                })),
              );
            })
            .catch(() => {});
        } else if (res.reason === 'unauthenticated') {
          setLeaderboardStatus('Leaderboard offline — run saved locally.');
        } else if (res.reason === 'not_personal_best') {
          setLeaderboardStatus('Existing Top 20 personal best kept.');
        }
      })
      .catch(() => {
        setLeaderboardStatus('Offline — run saved locally.');
      });
  }, [
    hud.phase,
    hud.wave,
    hud.score,
    hud.kills,
    hud.mode,
    hud.arena,
    hud.callsign,
    hud.clanTag,
    hud.equippedSkinId,
    hud.dailyDateKey,
    firebaseUser,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
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
          equippedGadget={hud.equippedGadget}
          arena={hud.arena}
          mode={hud.mode}
          callsign={hud.callsign}
          clanTag={hud.clanTag}
          isOnline={Boolean(firebaseUser)}
          career={career}
          appUpdate={appUpdate}
          onTriggerWebUpdate={() => void triggerWebCacheBustReload()}
          onChangeCallsign={(raw) => {
            const saved = engineRef.current?.setCallsign(raw);
            if (saved) {
              void updateLeaderboardCallsign(saved);
            }
          }}
          onSelectArena={(id) => engineRef.current?.setArena(id)}
          onSelectMode={(id) => engineRef.current?.setGameMode(id)}
          onEquipGear={(id) => engineRef.current?.equipGear(id)}
          onEquipGadget={(id) => engineRef.current?.equipGadget(id)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onSkinPreviewChange={handleSkinPreviewChange}
          onEquipSkin={(skinId) => engineRef.current?.equipSkin(skinId)}
          onSelectClass={(classId) => engineRef.current?.selectClass(classId)}
          onBuyPermanentUpgrade={(id) =>
            engineRef.current?.buyPermanentUpgrade(id)
          }
          onBuyTechLabUpgrade={(id) => engineRef.current?.buyTechLabUpgrade(id)}
          onClaimDailyContract={(contractId) =>
            engineRef.current?.claimDailyContractReward(contractId)
          }
          onEquipWeaponCamo={(weaponId, camoId) =>
            engineRef.current?.setWeaponCamo(weaponId, camoId)
          }
          onUnlockArmoryWeapon={(weaponId) =>
            engineRef.current?.unlockArmoryWeaponWithScrap(weaponId)
          }
          onSelectOrUnlockDrone={(droneId) =>
            engineRef.current?.unlockOrEquipDroneWithScrap(droneId)
          }
          onStartFromBeginning={() => {
            setSettingsOpen(false);
            setLeaderboardOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.startNewGame({ fromBeginning: true });
          }}
          onStartDailyRun={() => {
            setSettingsOpen(false);
            setLeaderboardOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.startDailyRun();
          }}
          onResumeInterrupted={() => {
            setSettingsOpen(false);
            setLeaderboardOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.startNewGame({
              fromBeginning: false,
              resumeInterrupted: true,
            });
          }}
        />
      )}

      {!webglError && hud.phase !== 'title' && (
        <HudOverlay
          hud={hud}
          floatingDamages={floatingDamages}
          upgradesOpen={upgradesOpen}
          touchHud={settings.touchHud}
          onMoveStick={(x, y) => engineRef.current?.setMoveStick(x, y)}
          onAimStick={(x, y, active) =>
            engineRef.current?.setAimStick(x, y, active)
          }
          onDash={() => engineRef.current?.triggerDash()}
          onReload={() => engineRef.current?.triggerReload()}
          onSwitchWeapon={() => engineRef.current?.switchWeapon()}
          onTriggerGear={() => engineRef.current?.triggerGear()}
          onTriggerGadget={() => engineRef.current?.triggerGadget()}
          onTriggerUltimate={() => engineRef.current?.triggerUltimate()}
          onEquipGear={(id) => engineRef.current?.equipGear(id)}
          onEquipGadget={(id) => engineRef.current?.equipGadget(id)}
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
          onBuyMastery={(weaponId) =>
            engineRef.current?.buyWeaponMastery(weaponId)
          }
          onWaveOffExtraction={() => engineRef.current?.waveOffExtraction()}
          onSandboxSpawnEnemy={(kind) =>
            engineRef.current?.sandboxSpawnEnemy(kind)
          }
          onSandboxEquipWeapon={(weaponId) =>
            engineRef.current?.sandboxEquipWeapon(weaponId)
          }
          onSandboxTriggerEvolution={() =>
            engineRef.current?.sandboxTriggerEvolution()
          }
          onSandboxChargeUltimate={() =>
            engineRef.current?.sandboxChargeUltimate()
          }
          onSandboxRefill={() => engineRef.current?.sandboxRefill()}
          onSandboxClearEnemies={() =>
            engineRef.current?.sandboxClearEnemies()
          }
        />
      )}

      {!webglError && hud.phase === 'playing' && hud.perkDraftChoices && (
        <PerkDraftModal
          wave={hud.wave}
          choices={hud.perkDraftChoices}
          cursedChoice={hud.cursedDraftChoice}
          ownedCount={hud.ownedPerks.length}
          perkRerollsRemaining={hud.perkRerollsRemaining}
          onRerollPerks={() => engineRef.current?.rerollPerkDraft()}
          onSelectPerk={(perkId) => engineRef.current?.choosePerk(perkId)}
          onSelectCursedPerk={(cursedId) =>
            engineRef.current?.chooseCursedPerk(cursedId)
          }
        />
      )}

      {!webglError &&
        hud.phase === 'playing' &&
        !hud.perkDraftChoices &&
        hud.weaponDraftChoices && (
          <WeaponDraftModal
            wave={hud.wave}
            choices={hud.weaponDraftChoices}
            weapons={hud.weapons}
            onSelectWeapon={(weaponId) =>
              engineRef.current?.chooseWeaponDraft(weaponId)
            }
          />
        )}

      {!webglError && (
        <StatusModal
          hud={hud}
          leaderboardStatus={leaderboardStatus}
          onResume={() => engineRef.current?.resumeGame()}
          onRevive={() => engineRef.current?.triggerRevive()}
          onEndRun={() => engineRef.current?.confirmEndRun()}
          onRestartFromBeginning={() => {
            setSettingsOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.startNewGame({ fromBeginning: true });
          }}
          onTitle={() => {
            setSettingsOpen(false);
            setUpgradesOpen(false);
            engineRef.current?.returnToTitle();
          }}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {!webglError && (hud.phase === 'title' || hud.phase === 'paused') && (
        <SettingsModal
          open={settingsOpen}
          settings={settings}
          userUid={firebaseUser?.uid ?? null}
          career={career}
          highScore={hud.highScore}
          callsign={hud.callsign}
          clanTag={hud.clanTag}
          onUpdate={(next) => {
            setSettings(next);
            engineRef.current?.setSettings(next);
          }}
          onCloudRestore={(snapshot) => {
            setCareer(snapshot.career);
            engineRef.current?.applyCloudSyncState({
              career: snapshot.career,
              highScore: snapshot.highScore,
              callsign: snapshot.callsign,
              clanTag: snapshot.clanTag,
            });
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {!webglError && (
        <LeaderboardModal
          open={leaderboardOpen}
          user={firebaseUser}
          authErrorCode={authErrorCode}
          currentCallsign={hud.callsign}
          currentClanTag={hud.clanTag}
          onSaveIdentity={async (rawName, rawTag) => {
            const savedName = engineRef.current?.setCallsign(rawName);
            const savedTag = engineRef.current?.setClanTag(rawTag) ?? '';
            if (savedName) {
              await updateLeaderboardIdentity(savedName, savedTag);
            }
          }}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
    </main>
  );
}
