import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { TASK_BY_ID } from '../../game/config/tasks';
import { sfx } from '../../game/events';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { audio } from '../../game/systems/audio';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CoinChip, ProgressBar, XpChip } from '../common/Rewards';

const SIZE = 260;
const GRID = 16;
const BRUSH = 24;
const PLATES = 4;
const DONE_AT = 0.9;
const PLATE_COLORS = ['#ffd6e6', '#d4f7ea', '#ece5ff', '#fff3cc'];

interface Plate {
  grime: HTMLCanvasElement;
  dirty: boolean[]; // grid cells containing grime
  cleaned: boolean[];
  total: number;
}

function makePlate(): Plate {
  const grime = document.createElement('canvas');
  grime.width = SIZE;
  grime.height = SIZE;
  const ctx = grime.getContext('2d')!;
  const dirty = new Array<boolean>(GRID * GRID).fill(false);
  const cell = SIZE / GRID;
  const blobs = 9 + Math.floor(Math.random() * 4);
  for (let i = 0; i < blobs; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 78;
    const x = SIZE / 2 + Math.cos(a) * r;
    const y = SIZE / 2 + Math.sin(a) * r;
    const rad = 14 + Math.random() * 20;
    ctx.fillStyle = ['#a8794b', '#8a6646', '#b7c46a', '#c9854f'][i % 4];
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * (0.6 + Math.random() * 0.5), Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
    // mark grid cells covered by the blob
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const cx = gx * cell + cell / 2;
        const cy = gy * cell + cell / 2;
        if (Math.hypot(cx - x, cy - y) < rad) dirty[gy * GRID + gx] = true;
      }
    }
  }
  return { grime, dirty, cleaned: new Array<boolean>(GRID * GRID).fill(false), total: dirty.filter(Boolean).length || 1 };
}

export function DishwashGame() {
  const close = useUiStore((s) => s.closeModal);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plate = useRef<Plate | null>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<{ coins: number; xp: number } | null>(null);
  const [plateClean, setPlateClean] = useState(false);
  const scrubbing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(
    (sparkle = false) => {
      const c = canvas.current;
      const p = plate.current;
      if (!c || !p) return;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, SIZE, SIZE);
      // plate
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, 122, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PLATE_COLORS[index % PLATE_COLORS.length];
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, 108, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f7f3fb';
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(p.grime, 0, 0);
      if (sparkle) {
        ctx.fillStyle = '#fff6a8';
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(SIZE / 2 + Math.cos(a) * 95, SIZE / 2 + Math.sin(a) * 95, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [index],
  );

  useEffect(() => {
    plate.current = makePlate();
    setProgress(0);
    setPlateClean(false);
    draw();
  }, [index, draw]);

  useEffect(() => () => audio.stopLoop('scrub'), []);

  const nextPlate = useCallback(() => {
    if (index + 1 >= PLATES) {
      const ok = useGameStore.getState().completeTask('wash_dishes');
      const t = TASK_BY_ID.wash_dishes;
      setDone({ coins: ok ? t.coins : 0, xp: ok ? t.xp : 0 });
    } else {
      setIndex(index + 1);
    }
  }, [index]);

  const scrubAt = useCallback(
    (x: number, y: number) => {
      const p = plate.current;
      if (!p || plateClean) return;
      const g = p.grime.getContext('2d')!;
      g.globalCompositeOperation = 'destination-out';
      g.globalAlpha = 1;
      const from = last.current ?? { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / 8));
      const cell = SIZE / GRID;
      for (let s = 1; s <= steps; s++) {
        const px = from.x + ((x - from.x) * s) / steps;
        const py = from.y + ((y - from.y) * s) / steps;
        g.beginPath();
        g.arc(px, py, BRUSH, 0, Math.PI * 2);
        g.fill();
        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const i = gy * GRID + gx;
            if (!p.dirty[i] || p.cleaned[i]) continue;
            if (Math.hypot(gx * cell + cell / 2 - px, gy * cell + cell / 2 - py) < BRUSH) p.cleaned[i] = true;
          }
        }
      }
      g.globalCompositeOperation = 'source-over';
      last.current = { x, y };
      const prog = p.cleaned.filter(Boolean).length / p.total;
      setProgress(prog);
      if (prog >= DONE_AT) {
        // wipe the leftovers so the plate looks spotless
        g.clearRect(0, 0, SIZE, SIZE);
        setPlateClean(true);
        draw(true);
        sfx('sparkle');
        audio.stopLoop('scrub');
        setTimeout(nextPlate, 650);
      } else {
        draw();
      }
    },
    [draw, nextPlate, plateClean],
  );

  const toLocal = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * SIZE, y: ((e.clientY - rect.top) / rect.height) * SIZE };
  };

  // Keyboard alternative: each press scrubs the dirtiest remaining spot.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') || done) return;
      e.preventDefault();
      const p = plate.current;
      if (!p) return;
      const i = p.dirty.findIndex((d, k) => d && !p.cleaned[k]);
      if (i < 0) return;
      const cell = SIZE / GRID;
      last.current = null;
      scrubAt((i % GRID) * cell + cell / 2, Math.floor(i / GRID) * cell + cell / 2);
      last.current = null;
      sfx('swish');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrubAt, done]);

  if (done) {
    return (
      <Modal title="Berkilat!" icon="✨" width="sm">
        <div className="text-center py-2">
          <div className="text-7xl animate-bob" aria-hidden>
            🍽️
          </div>
          <p className="text-ink-soft mt-2">Semua {PLATES} pinggan dah berkilat.</p>
          <div className="flex justify-center gap-2 mt-4">
            <CoinChip amount={done.coins} className="text-base px-3 py-1" />
            <XpChip amount={done.xp} className="text-base px-3 py-1" />
          </div>
          <Button variant="mint" className="mt-6 w-full text-lg" onClick={close}>
            Siap! 🫧
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Basuh pinggan" icon="🍽️" width="sm">
      <div className="text-center">
        <div className="text-sm text-ink-soft">
          Pinggan {index + 1} / {PLATES} · gosok guna jari atau mouse
        </div>
        <div className="relative mx-auto my-3 w-[260px] max-w-full aspect-square rounded-full bg-[#cfeaf7] p-2 shadow-inner">
          <canvas
            ref={canvas}
            width={SIZE}
            height={SIZE}
            className="w-full h-full touch-none cursor-[grab] active:cursor-grabbing"
            aria-label="Pinggan kotor – seret untuk gosok"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scrubbing.current = true;
              last.current = null;
              audio.startLoop('scrub');
              const p = toLocal(e);
              scrubAt(p.x, p.y);
            }}
            onPointerMove={(e) => {
              if (!scrubbing.current) return;
              const p = toLocal(e);
              scrubAt(p.x, p.y);
            }}
            onPointerUp={() => {
              scrubbing.current = false;
              last.current = null;
              audio.stopLoop('scrub');
            }}
            onPointerCancel={() => {
              scrubbing.current = false;
              audio.stopLoop('scrub');
            }}
          />
          <div className="pointer-events-none absolute -top-1 -right-1 text-3xl" aria-hidden>
            🧽
          </div>
        </div>
        <ProgressBar value={progress / DONE_AT} tone="mint" />
        <p className="text-xs text-ink-soft mt-2">Papan kekunci: tekan Space / E untuk gosok</p>
      </div>
    </Modal>
  );
}
