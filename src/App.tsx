import { Suspense, lazy, useEffect, useState } from 'react';
import { onGameEvent } from './game/events';
import { useGameStore } from './game/store/gameStore';
import { useUiStore } from './game/store/uiStore';
import { audio } from './game/systems/audio';
import { isCloudConfigured, recordTaskCompletion, uploadProgress, getCloudUser } from './game/systems/cloudSave';
import { initKeyboard } from './game/systems/input';
import { cancelPlacement } from './game/systems/placementActions';
import { startAutoSave } from './game/systems/save';
import type { ContactId, TaskId } from './game/types';
import { Hud } from './ui/hud/Hud';
import { RewardPops, Toasts } from './ui/hud/Notifications';
import { CookingGame } from './ui/minigames/CookingGame';
import { DishwashGame } from './ui/minigames/DishwashGame';
import { Inventory } from './ui/modals/Inventory';
import { LevelUp } from './ui/modals/LevelUp';
import { HelpPanel, PauseMenu } from './ui/modals/PauseHelp';
import { Phone } from './ui/modals/Phone';
import { Settings } from './ui/modals/Settings';
import { Shop } from './ui/modals/Shop';
import { TaskPanel } from './ui/modals/TaskPanel';
import { MainMenu } from './ui/screens/MainMenu';
import { LoadingScreen, SceneErrorBoundary, WebGLFallback, hasWebGL } from './ui/screens/Status';

// The 3D engine is code-split so the main menu appears instantly.
const GameCanvas = lazy(() => import('./scene/GameCanvas'));

function useGameEvents() {
  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleCloudSync = () => {
      if (!isCloudConfigured) return;
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(async () => {
        if (await getCloudUser()) await uploadProgress();
      }, 4000);
    };

    const off = onGameEvent((e) => {
      const ui = useUiStore.getState();
      switch (e.type) {
        case 'toast':
          ui.pushToast({ text: e.text, icon: e.icon, tone: e.tone ?? 'info' });
          break;
        case 'reward':
          ui.pushReward({ coins: e.coins, xp: e.xp, label: e.label });
          audio.play(e.coins > 0 ? 'reward' : 'sparkle');
          break;
        case 'levelUp':
          setTimeout(() => {
            useUiStore.getState().queueLevelUp(e.level);
            audio.play('levelup');
          }, 700);
          scheduleCloudSync();
          break;
        case 'sfx':
          audio.play(e.name);
          break;
        case 'phone':
          ui.showPhoneBanner(e.contact as ContactId, e.text);
          break;
        case 'openShop':
          ui.openModal('shop');
          break;
        case 'taskComplete':
          void recordTaskCompletion(e.taskId as TaskId, useGameStore.getState().day);
          scheduleCloudSync();
          break;
      }
    });
    return () => {
      off();
      if (syncTimer) clearTimeout(syncTimer);
    };
  }, []);
}

function useAudioSettings() {
  const music = useGameStore((s) => s.settings.musicVolume);
  const sfxVol = useGameStore((s) => s.settings.sfxVolume);
  const muted = useGameStore((s) => s.settings.muted);
  useEffect(() => audio.setVolumes(music, sfxVol, muted), [music, sfxVol, muted]);
}

function useGlobalKeys() {
  useEffect(
    () =>
      initKeyboard({
        onEscape: () => {
          const ui = useUiStore.getState();
          if (ui.screen !== 'game') {
            if (ui.modal) ui.closeModal();
            return;
          }
          if (ui.levelUpQueue.length) ui.shiftLevelUp();
          else if (ui.placement) cancelPlacement();
          else if (ui.modal) ui.closeModal();
          else ui.openModal('pause');
        },
      }),
    [],
  );
}

function ActiveModal() {
  const modal = useUiStore((s) => s.modal);
  switch (modal) {
    case 'cooking':
      return <CookingGame />;
    case 'dishes':
      return <DishwashGame />;
    case 'shop':
      return <Shop />;
    case 'inventory':
      return <Inventory />;
    case 'tasks':
      return <TaskPanel />;
    case 'settings':
      return <Settings />;
    case 'pause':
      return <PauseMenu />;
    case 'help':
      return <HelpPanel />;
    case 'phone':
      return <Phone />;
    default:
      return null;
  }
}

export default function App() {
  const screen = useUiStore((s) => s.screen);
  const sceneReady = useUiStore((s) => s.sceneReady);
  const webglError = useUiStore((s) => s.webglError);
  const [webglOk] = useState(() => hasWebGL());

  useGameEvents();
  useAudioSettings();
  useGlobalKeys();
  useEffect(() => startAutoSave(), []);

  // Unlock audio on the very first interaction anywhere (mobile autoplay rules).
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // Pause the music on the menu, play it in-game.
  useEffect(() => {
    if (screen === 'game') audio.startMusic();
    else {
      audio.stopMusic();
      audio.stopAllLoops();
    }
  }, [screen]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {screen === 'menu' && <MainMenu />}
      {screen === 'game' &&
        (webglOk ? (
          <SceneErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <GameCanvas />
            </Suspense>
            {!sceneReady && <LoadingScreen />}
            {sceneReady && <Hud />}
          </SceneErrorBoundary>
        ) : (
          <WebGLFallback message="Browser atau peranti awak tak sokong WebGL, yang diperlukan untuk grafik 3D Happy Home." />
        ))}
      {webglError && <WebGLFallback message={webglError} />}
      <ActiveModal />
      <LevelUp />
      <RewardPops />
      <Toasts />
    </div>
  );
}
