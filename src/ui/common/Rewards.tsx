export function CoinChip({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`chip bg-butter-light text-[#8a6200] ${className}`}>
      <span aria-hidden>🪙</span>
      {amount}
    </span>
  );
}

export function XpChip({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`chip bg-lilac-light text-[#6a4fd0] ${className}`}>
      <span aria-hidden>⭐</span>
      {amount} XP
    </span>
  );
}

export function ProgressBar({ value, className = '', tone = 'pink' }: { value: number; className?: string; tone?: 'pink' | 'mint' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`h-3 rounded-full bg-white/80 overflow-hidden shadow-inner ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tone === 'pink' ? 'bar-fill' : 'bg-mint'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
