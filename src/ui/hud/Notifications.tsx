import { useEffect } from 'react';
import { useUiStore, type RewardPop, type Toast } from '../../game/store/uiStore';

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useUiStore((s) => s.dismissToast);
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), 2600);
    return () => clearTimeout(id);
  }, [t.id, dismiss]);
  const tone = t.tone === 'success' ? 'border-mint' : t.tone === 'warn' ? 'border-candy' : 'border-white';
  return (
    <div className={`glass rounded-2xl px-4 py-2 flex items-center gap-2 border-l-4 ${tone} animate-slide-down max-w-[90vw]`} role="status">
      {t.icon && (
        <span className="text-xl" aria-hidden>
          {t.icon}
        </span>
      )}
      <span className="font-semibold text-sm">{t.text}</span>
    </div>
  );
}

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute top-24 sm:top-4 left-1/2 -translate-x-1/2 z-[55] flex flex-col items-center gap-2" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}

function RewardItem({ r }: { r: RewardPop }) {
  const dismiss = useUiStore((s) => s.dismissReward);
  useEffect(() => {
    const id = setTimeout(() => dismiss(r.id), 1700);
    return () => clearTimeout(id);
  }, [r.id, dismiss]);
  return (
    <div className="animate-float-up text-center">
      <div className="text-sm font-bold text-white drop-shadow-[0_2px_2px_rgba(91,61,102,0.6)]">{r.label}</div>
      <div className="flex gap-2 justify-center mt-1">
        {r.coins > 0 && <span className="chip bg-butter text-[#6b4a00] text-lg px-3 py-1 shadow-[0_3px_0_#d9a520]">+{r.coins} 🪙</span>}
        {r.xp > 0 && <span className="chip bg-lilac text-white text-lg px-3 py-1 shadow-[0_3px_0_#7d5ee0]">+{r.xp} XP</span>}
      </div>
    </div>
  );
}

export function RewardPops() {
  const rewards = useUiStore((s) => s.rewards);
  return (
    <div className="pointer-events-none absolute top-[38%] left-1/2 -translate-x-1/2 z-[35] flex flex-col items-center gap-3">
      {rewards.map((r) => (
        <RewardItem key={r.id} r={r} />
      ))}
    </div>
  );
}
