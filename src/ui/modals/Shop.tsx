import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, FURNITURE, type FurnitureCategory } from '../../game/config/furniture';
import { sfx, toast } from '../../game/events';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { XpChip } from '../common/Rewards';

type Tab = 'all' | FurnitureCategory;

export function Shop() {
  const level = useGameStore((s) => s.level);
  const coins = useGameStore((s) => s.coins);
  const inventory = useGameStore((s) => s.inventory);
  const placed = useGameStore((s) => s.placed);
  const buy = useGameStore((s) => s.buyItem);
  const priceOf = useGameStore((s) => s.priceOf);
  const discount = useGameStore((s) => s.shopDiscount);
  const startPlacement = useUiStore((s) => s.startPlacement);
  const [tab, setTab] = useState<Tab>('all');

  const tabs = useMemo<Tab[]>(() => ['all', ...Array.from(new Set(FURNITURE.map((f) => f.category)))], []);
  const items = FURNITURE.filter((f) => tab === 'all' || f.category === tab).sort(
    (a, b) => Number(a.requiredLevel > level) - Number(b.requiredLevel > level) || a.requiredLevel - b.requiredLevel || a.price - b.price,
  );

  const onBuy = (id: string, name: string) => {
    const res = buy(id);
    if (res === 'ok') {
      sfx('coin');
      toast(`${name} masuk inventori!`, '🛍️', 'success');
    } else if (res === 'coins') {
      sfx('error');
      toast('Duit tak cukup lagi – siapkan kerja rumah dulu!', '🪙', 'warn');
    } else if (res === 'locked') {
      sfx('error');
      toast('Naik level dulu untuk buka barang ni.', '🔒', 'warn');
    }
  };

  return (
    <Modal title="Kedai Perabot" icon="🛍️" width="lg">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto scroll-soft pb-1 -mx-1 px-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                sfx('click');
                setTab(t);
              }}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === t ? 'bg-candy text-white shadow-[0_3px_0_#d94b86]' : 'bg-white text-ink-soft shadow-[0_3px_0_#f2d3e0]'
              }`}
            >
              {t === 'all' ? 'Semua' : CATEGORY_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {discount > 0 && <span className="chip bg-candy text-white text-sm px-3 py-1 animate-bob">🔥 Diskaun {Math.round(discount * 100)}% hari ni!</span>}
          <div className="chip bg-butter-light text-[#8a6200] text-base px-3 py-1">🪙 {coins}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((f) => {
          const locked = f.requiredLevel > level;
          const owned = inventory[f.id] ?? 0;
          const inHome = placed.filter((p) => p.itemId === f.id).length;
          const affordable = coins >= priceOf(f.id);
          return (
            <div key={f.id} className={`rounded-3xl bg-white p-3 flex flex-col shadow-[0_4px_0_#f2d3e0] ${locked ? 'opacity-70' : ''}`}>
              <div className="relative grid place-items-center h-24 rounded-2xl text-5xl" style={{ background: `linear-gradient(135deg, ${f.color}66, ${f.accent}55)` }}>
                <span aria-hidden className={locked ? 'grayscale' : ''}>
                  {f.emoji}
                </span>
                {locked && <span className="absolute top-1.5 right-1.5 chip bg-ink text-white">🔒 Lv {f.requiredLevel}</span>}
                {(owned > 0 || inHome > 0) && <span className="absolute top-1.5 left-1.5 chip bg-white/90 text-ink">Ada {owned + inHome}</span>}
              </div>
              <div className="mt-2 font-semibold leading-tight text-sm min-h-[2.5em]">{f.name}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-ink-soft">
                {CATEGORY_LABELS[f.category]}
                {owned + inHome === 0 && <XpChip amount={f.xp} className="!text-[10px] !px-1.5" />}
              </div>
              <div className="mt-auto pt-2 flex flex-col gap-1.5">
                <Button
                  variant={locked ? 'white' : affordable ? 'butter' : 'white'}
                  className="!py-2 text-sm"
                  disabled={locked}
                  onClick={() => onBuy(f.id, f.name)}
                  silent
                >
                  {locked ? `Level ${f.requiredLevel}` : discount > 0 ? (<><s className="opacity-50 mr-1">{f.price}</s>🪙 {priceOf(f.id)}</>) : <>🪙 {f.price}</>}
                </Button>
                {owned > 0 && (
                  <Button variant="mint" className="!py-2 text-sm" onClick={() => startPlacement({ itemId: f.id, rot: 0 })}>
                    Letak sekarang
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
