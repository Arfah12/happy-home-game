import { useMemo } from 'react';
import { levelInfo } from '../../game/config/levels';
import { useUiStore } from '../../game/store/uiStore';
import { Button } from '../common/Button';

const CONFETTI = ['#ff6fa8', '#ffcf4d', '#3fc79c', '#a98bff', '#6cc3ff', '#ff9f80'];

export function LevelUp() {
  const queue = useUiStore((s) => s.levelUpQueue);
  const shift = useUiStore((s) => s.shiftLevelUp);
  const level = queue[0];
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        color: CONFETTI[i % CONFETTI.length],
        size: 6 + Math.random() * 8,
        round: i % 3 === 0,
      })),
    // regenerated for every new level
    [level],
  );
  if (level === undefined) return null;
  const info = levelInfo(level);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-[#5b3d66]/45 backdrop-blur-sm" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 animate-confetti"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              background: p.color,
              borderRadius: p.round ? '999px' : '3px',
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div role="dialog" aria-modal="true" aria-label={`Naik ke level ${level}`} className="panel relative w-full max-w-sm p-6 text-center animate-pop-in">
        <div className="text-sm font-bold uppercase tracking-[0.25em] text-candy">Naik level!</div>
        <div className="relative mx-auto mt-3 w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ff6fa8,#ffcf4d,#3fc79c,#a98bff,#ff6fa8)] animate-spin-slow opacity-80" />
          <div className="absolute inset-2 rounded-full bg-cream grid place-items-center shadow-inner">
            <div>
              <div className="text-4xl leading-none" aria-hidden>
                {info.emoji}
              </div>
              <div className="text-4xl font-bold leading-none mt-1">{level}</div>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-4">{info.title}</h2>
        <ul className="mt-3 space-y-1.5 text-left">
          {info.unlocks.map((u) => (
            <li key={u} className="flex gap-2 items-start rounded-2xl bg-white px-3 py-2 text-sm shadow-[0_2px_0_#f2d3e0]">
              <span aria-hidden>🎁</span>
              <span>{u}</span>
            </li>
          ))}
        </ul>
        <Button variant="pink" className="mt-5 w-full text-lg" onClick={shift}>
          Best gila! 🎉
        </Button>
      </div>
    </div>
  );
}
