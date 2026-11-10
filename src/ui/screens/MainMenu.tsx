import { useState } from 'react';
import { levelInfo } from '../../game/config/levels';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { audio } from '../../game/systems/audio';
import { clearInput } from '../../game/systems/input';
import { teleportPlayer } from '../../game/systems/playerState';
import { clearLocal, hasLocalSave, saveNow } from '../../game/systems/save';
import { Button } from '../common/Button';

function FloatingDecor() {
  const items = ['🧁', '🌷', '🫖', '🧸', '🪴', '💖', '🍳', '🧺', '✨', '🛋️'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((e, i) => (
        <span
          key={i}
          className="absolute text-3xl sm:text-4xl opacity-70 animate-bob"
          style={{
            // keep decorations along the sides, away from the title and buttons
            left: `${i % 2 ? 3 + ((i * 7) % 14) : 83 + ((i * 5) % 12)}%`,
            top: `${(i * 53) % 85 + 5}%`,
            animationDelay: `${(i % 5) * 0.4}s`,
            animationDuration: `${2.2 + (i % 4) * 0.5}s`,
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}

function HouseArt() {
  return (
    <div className="relative mx-auto w-44 h-40 sm:w-52 sm:h-48 animate-bob" aria-hidden>
      <div className="absolute bottom-0 left-4 right-4 h-[62%] rounded-[1.6rem] bg-white shadow-[0_8px_0_#f2c5d8]" />
      <div
        className="absolute top-0 left-0 right-0 h-[48%] bg-candy rounded-t-[2rem]"
        style={{ clipPath: 'polygon(50% 0, 100% 78%, 100% 100%, 0 100%, 0 78%)' }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[34%] rounded-t-2xl bg-butter shadow-inner" />
      <div className="absolute bottom-[22%] left-[22%] w-9 h-9 rounded-xl bg-sky/70 border-4 border-white" />
      <div className="absolute bottom-[22%] right-[22%] w-9 h-9 rounded-xl bg-sky/70 border-4 border-white" />
      <div className="absolute top-[22%] left-1/2 -translate-x-1/2 text-3xl">💗</div>
      <div className="absolute -right-4 bottom-0 text-4xl">🌷</div>
      <div className="absolute -left-3 bottom-0 text-4xl">🪴</div>
    </div>
  );
}

export function MainMenu() {
  const setScreen = useUiStore((s) => s.setScreen);
  const openModal = useUiStore((s) => s.openModal);
  const level = useGameStore((s) => s.level);
  const coins = useGameStore((s) => s.coins);
  const day = useGameStore((s) => s.day);
  const [hasSave] = useState(() => hasLocalSave());
  const [confirmNew, setConfirmNew] = useState(false);

  const start = () => {
    audio.unlock();
    audio.startMusic();
    clearInput();
    setScreen('game');
  };

  const newGame = () => {
    if (hasSave && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    const keep = useGameStore.getState().settings;
    useGameStore.getState().resetGame();
    useGameStore.getState().updateSettings(keep);
    clearLocal();
    saveNow();
    const p = useGameStore.getState().playerPos;
    teleportPlayer(p.x, p.z);
    start();
    setTimeout(() => useUiStore.getState().openModal('help'), 900);
  };

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[radial-gradient(circle_at_30%_20%,#fff4f9,#ffd6e6_55%,#ffc2da)]">
      <FloatingDecor />
      <div className="relative min-h-full flex flex-col items-center justify-center px-5 py-10 text-center">
        <HouseArt />
        <h1 className="mt-5 text-5xl sm:text-6xl font-bold tracking-tight text-candy drop-shadow-[0_4px_0_#fff]">Happy Home</h1>
        <p className="mt-1 text-lg sm:text-xl font-semibold text-ink-soft">Simulasi Suri Rumah Santai 🏡</p>

        <div className="panel mt-7 w-full max-w-sm p-5 flex flex-col gap-3 animate-pop-in">
          {hasSave && (
            <Button variant="pink" className="text-xl py-4" onClick={start}>
              ▶️ Sambung
              <span className="ml-1 text-sm font-medium opacity-90">
                Lv {level} · Hari {day} · 🪙{coins}
              </span>
            </Button>
          )}
          <Button variant={hasSave ? 'white' : 'pink'} className={hasSave ? '' : 'text-xl py-4'} onClick={newGame}>
            {confirmNew ? '⚠️ Tekan lagi – save lama akan dipadam' : hasSave ? '🌱 Main baru' : '▶️ Main'}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => openModal('settings')}>⚙️ Tetapan</Button>
            <Button onClick={() => openModal('help')}>❓ Cara main</Button>
          </div>
        </div>
        {hasSave && <p className="mt-4 text-sm text-ink-soft">{levelInfo(level).emoji} {levelInfo(level).title}</p>}
        <p className="mt-6 text-xs text-ink-soft/80">Progress disimpan automatik dalam peranti ni · boleh main offline</p>
      </div>
    </div>
  );
}
