import { useCallback, useEffect, useRef, useState } from 'react';
import { DELUXE_COOKING_BONUS, UPGRADES } from '../../game/config/levels';
import { PERFECT_FRACTION, RECIPES, type Recipe } from '../../game/config/recipes';
import { TASK_BY_ID } from '../../game/config/tasks';
import { sfx } from '../../game/events';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { audio } from '../../game/systems/audio';
import { stoveMode } from '../../game/logic/family';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CoinChip, XpChip } from '../common/Rewards';

type Phase = 'select' | 'play' | 'result';
type Grade = 'Perfect' | 'Mantap' | 'Boleh la';

const GRADE_MULT: Record<Grade, number> = { Perfect: 1.25, Mantap: 1, 'Boleh la': 0.9 };

function newZone(width: number): number {
  return width / 2 + 0.08 + Math.random() * (1 - width - 0.16);
}

export function CookingGame() {
  const level = useGameStore((s) => s.level);
  const close = useUiStore((s) => s.closeModal);
  const [phase, setPhase] = useState<Phase>('select');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [round, setRound] = useState(0);
  const [zone, setZone] = useState(0.5);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null);
  const [shake, setShake] = useState(0);
  const [result, setResult] = useState<{ grade: Grade; coins: number; xp: number } | null>(null);
  const stats = useRef({ misses: 0, perfects: 0 });
  const needle = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const start = useRef(0);
  const locked = useRef(false);

  const deluxe = level >= UPGRADES.kitchenDeluxe;
  // Decided once when the stove is opened.
  const [meal] = useState(() => (stoveMode(useGameStore.getState()) === 'dinner' ? 'dinner' : 'breakfast'));

  // Needle animation (direct DOM updates – no React re-render per frame).
  useEffect(() => {
    if (phase !== 'play' || !recipe) return;
    let raf = 0;
    start.current = performance.now();
    const tick = (now: number) => {
      const t = ((now - start.current) / 1000) * recipe.speed;
      const p = t % 2;
      pos.current = p < 1 ? p : 2 - p;
      if (needle.current) needle.current.style.left = `${pos.current * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    audio.startLoop('sizzle');
    return () => {
      cancelAnimationFrame(raf);
      audio.stopLoop('sizzle');
    };
  }, [phase, recipe]);

  const finish = useCallback(
    (r: Recipe) => {
      const { misses, perfects } = stats.current;
      const grade: Grade = misses === 0 && perfects >= Math.ceil(r.steps.length / 2) ? 'Perfect' : misses <= 1 ? 'Mantap' : 'Boleh la';
      const coinMult = r.rewardMultiplier * GRADE_MULT[grade] * (deluxe ? DELUXE_COOKING_BONUS : 1);
      const xpMult = r.rewardMultiplier;
      const base = TASK_BY_ID.cook_breakfast;
      if (meal === 'dinner') {
        useGameStore.getState().cookDinner();
        setResult({ grade, coins: 0, xp: 5 });
      } else {
        const ok = useGameStore.getState().completeTask('cook_breakfast', { coins: coinMult, xp: xpMult });
        setResult({ grade, coins: ok ? Math.round(base.coins * coinMult) : 0, xp: ok ? Math.round(base.xp * xpMult) : 0 });
      }
      setPhase('result');
    },
    [deluxe, meal],
  );

  const stop = useCallback(() => {
    if (phase !== 'play' || !recipe || locked.current) return;
    const half = recipe.zoneWidth / 2;
    const d = Math.abs(pos.current - zone);
    locked.current = true;
    if (d <= half) {
      const perfect = d <= half * PERFECT_FRACTION;
      if (perfect) stats.current.perfects += 1;
      sfx(perfect ? 'perfect' : 'chop');
      setFeedback({ text: perfect ? 'Perfect! ✨' : 'Cun!', good: true });
      setTimeout(() => {
        locked.current = false;
        setFeedback(null);
        if (round + 1 >= recipe.steps.length) finish(recipe);
        else {
          setRound(round + 1);
          setZone(newZone(recipe.zoneWidth));
          start.current = performance.now() - Math.random() * 1000;
        }
      }, 520);
    } else {
      stats.current.misses += 1;
      sfx('error');
      setShake((s) => s + 1);
      setFeedback({ text: 'Alamak! Cuba lagi', good: false });
      setTimeout(() => {
        locked.current = false;
        setFeedback(null);
        setZone(newZone(recipe.zoneWidth));
      }, 650);
    }
  }, [phase, recipe, zone, round, finish]);

  // Space / Enter / E to stop the needle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stop]);

  const begin = (r: Recipe) => {
    stats.current = { misses: 0, perfects: 0 };
    setRecipe(r);
    setRound(0);
    setZone(newZone(r.zoneWidth));
    setPhase('play');
  };

  if (phase === 'select') {
    return (
      <Modal title={meal === 'dinner' ? 'Nak masak apa malam ni?' : 'Nak masak apa pagi ni?'} icon={meal === 'dinner' ? '🍲' : '🍳'}>
        <p className="text-ink-soft mb-4">
          Pilih resipi. Masakan lebih susah, lebih banyak duit & XP.
          {deluxe && <span className="ml-1 font-semibold text-candy">Dapur deluxe: +25% duit!</span>}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RECIPES.map((r) => {
            const locked = r.requiredLevel > level;
            return (
              <button
                key={r.id}
                disabled={locked}
                onClick={() => {
                  sfx('click');
                  begin(r);
                }}
                className="group text-left rounded-3xl p-3 bg-white shadow-[0_4px_0_#f2d3e0] hover:-translate-y-0.5 active:translate-y-0.5 transition disabled:opacity-55 disabled:hover:translate-y-0 flex items-center gap-3"
              >
                <div className="grid place-items-center w-16 h-16 rounded-2xl text-4xl shrink-0" style={{ background: `${r.color}55` }}>
                  {locked ? '🔒' : r.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold leading-tight">{r.name}</div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {locked ? `Dibuka pada level ${r.requiredLevel}` : `${r.steps.length} langkah · ganjaran ×${r.rewardMultiplier.toFixed(1)}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    );
  }

  if (phase === 'result' && result && recipe) {
    return (
      <Modal title={meal === 'dinner' ? 'Makan malam dah siap!' : 'Sarapan dah siap!'} icon={recipe.emoji} width="sm" onClose={close}>
        <div className="text-center py-2">
          <div className="text-7xl animate-bob" aria-hidden>
            {recipe.emoji}
          </div>
          <div className="mt-3 text-3xl font-bold text-candy">{result.grade}!</div>
          <p className="text-ink-soft mt-1">Wangi {recipe.name} satu rumah! 😋</p>
          <p className="text-sm font-semibold text-candy mt-2">
            {meal === 'dinner' ? '📣 Bila abang dah balik, panggil semua makan kat meja!' : '📣 Jangan lupa panggil Adik sarapan kat meja!'}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {result.coins > 0 && <CoinChip amount={result.coins} className="text-base px-3 py-1" />}
            <XpChip amount={result.xp} className="text-base px-3 py-1" />
          </div>
          <Button variant="pink" className="mt-6 w-full text-lg" onClick={close}>
            Sedapnyaa! 🥰
          </Button>
        </div>
      </Modal>
    );
  }

  if (!recipe) return null;
  const half = recipe.zoneWidth / 2;
  return (
    <Modal title={recipe.name} icon={recipe.emoji} width="md">
      <div className="text-center">
        <div className="flex justify-center gap-2 mb-3" aria-label={`Langkah ${round + 1} daripada ${recipe.steps.length}`}>
          {recipe.steps.map((s, i) => (
            <span key={s} className={`w-3 h-3 rounded-full ${i < round ? 'bg-mint' : i === round ? 'bg-candy' : 'bg-candy-light'}`} />
          ))}
        </div>
        <div className="text-sm uppercase tracking-wider text-ink-soft">
          Langkah {round + 1} / {recipe.steps.length}
        </div>
        <div className="text-2xl font-bold mt-1">{recipe.steps[round]}</div>
        <div className="text-6xl my-4 animate-bob" aria-hidden>
          {recipe.emoji}
        </div>

        <div key={shake} className={`relative h-14 rounded-2xl bg-white shadow-inner overflow-hidden ${shake ? 'animate-wiggle' : ''}`}>
          <div className="absolute inset-y-0 bg-mint/35 border-x-2 border-mint" style={{ left: `${(zone - half) * 100}%`, width: `${recipe.zoneWidth * 100}%` }} />
          <div
            className="absolute inset-y-0 bg-butter/70"
            style={{ left: `${(zone - half * PERFECT_FRACTION) * 100}%`, width: `${recipe.zoneWidth * PERFECT_FRACTION * 100}%` }}
          />
          <div ref={needle} className="absolute top-1 bottom-1 w-2 -ml-1 rounded-full bg-candy shadow-[0_0_0_3px_white]" style={{ left: '0%' }} />
        </div>
        <div className={`h-8 mt-2 font-semibold ${feedback?.good ? 'text-mint' : 'text-candy'}`} aria-live="polite">
          {feedback?.text ?? 'Berhentikan senduk dalam zon hijau – kuning emas = perfect!'}
        </div>
        <Button variant="pink" className="w-full text-xl py-4" onClick={stop} silent>
          STOP! 🥄
        </Button>
        <p className="text-xs text-ink-soft mt-2">Tekan butang atau Space / E</p>
      </div>
    </Modal>
  );
}
