import { useEffect, useState } from 'react';
import { FURNITURE_BY_ID } from '../../game/config/furniture';
import { MAX_LEVEL, levelInfo, xpToNext } from '../../game/config/levels';
import { currentTask, taskGuide } from '../../game/logic/taskGuide';
import { clockIcon, formatClock } from '../../game/logic/time';
import { levelProgress } from '../../game/logic/progression';
import { sfx } from '../../game/events';
import { useGameStore } from '../../game/store/gameStore';
import { useInteractionStore } from '../../game/store/interactionStore';
import { useUiStore } from '../../game/store/uiStore';
import { input } from '../../game/systems/input';
import { cancelPlacement, confirmPlacement, rotatePlacement, storePlacement } from '../../game/systems/placementActions';
import { player } from '../../game/systems/playerState';
import { Button, IconButton } from '../common/Button';
import { CoinChip, ProgressBar, XpChip } from '../common/Rewards';
import { Joystick, useIsTouch } from './Joystick';
import { CONTACTS } from '../../game/config/phoneEvents';

function PhoneButton() {
  const unread = useGameStore((s) => Object.values(s.phone.unread).reduce((a, b) => a + (b ?? 0), 0));
  const waiting = useGameStore((s) => !!s.phone.pending);
  const openPhone = useUiStore((s) => s.openPhone);
  return (
    <div className={`relative ${waiting ? 'animate-wiggle [animation-iteration-count:infinite] [animation-duration:1.4s]' : ''}`}>
      <IconButton label="Telefon" icon="📱" variant="sky" onClick={() => openPhone(null)} />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1 grid place-items-center rounded-full bg-candy text-white text-xs font-bold border-2 border-white pointer-events-none">
          {unread}
        </span>
      )}
    </div>
  );
}

function PhoneBanner() {
  const banner = useUiStore((s) => s.phoneBanner);
  const hide = useUiStore((s) => s.hidePhoneBanner);
  const openPhone = useUiStore((s) => s.openPhone);
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(hide, 6000);
    return () => clearTimeout(t);
  }, [banner, hide]);
  if (!banner) return null;
  const c = CONTACTS[banner.contact];
  return (
    <button
      key={banner.id}
      onClick={() => openPhone(banner.contact)}
      className="glass rounded-3xl p-2.5 pr-4 flex items-center gap-3 w-[min(88vw,360px)] text-left animate-slide-down"
    >
      <span className="grid place-items-center w-10 h-10 rounded-full text-2xl shrink-0" style={{ background: `${c.color}66` }} aria-hidden>
        {c.avatar}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-candy">📱 {c.name}</span>
        <span className="block text-sm font-semibold truncate">{banner.text}</span>
        <span className="block text-[10px] text-ink-soft">Tekan untuk balas</span>
      </span>
    </button>
  );
}

const TOOL_LABEL: Record<string, string> = { mop: '🧹 Mop', vacuum: '🌀 Vakum', can: '🚿 Penyiram' };

function LevelBadge() {
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const day = useGameStore((s) => s.day);
  const max = level >= MAX_LEVEL;
  return (
    <div className="glass rounded-3xl p-2 pr-4 flex items-center gap-3 animate-slide-down">
      <div className="relative grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-b from-[#ff9ac4] to-candy text-white shadow-[0_3px_0_#d94b86]">
        <span className="text-xl font-bold leading-none">{level}</span>
        <span className="absolute -bottom-1.5 text-[9px] font-bold bg-white text-candy rounded-full px-1.5 shadow">LV</span>
      </div>
      <div className="w-32 sm:w-44">
        <div className="flex justify-between text-xs font-semibold">
          <span className="truncate">{levelInfo(level).title}</span>
          <span className="text-ink-soft">Hari {day}</span>
        </div>
        <ProgressBar value={levelProgress(level, xp)} className="mt-1" />
        <div className="text-[10px] text-ink-soft mt-0.5">{max ? 'Level maksimum – rumah impian!' : `${Math.floor(xp)} / ${xpToNext(level)} XP`}</div>
      </div>
    </div>
  );
}

function ClockChip() {
  const clock = useGameStore((s) => Math.floor(s.clock / 5) * 5);
  return (
    <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 font-bold tabular-nums" aria-label={`Pukul ${formatClock(clock)}`}>
      <span aria-hidden>{clockIcon(clock)}</span>
      <span className="text-sm">{formatClock(clock)}</span>
    </div>
  );
}

function CoinCounter() {
  const coins = useGameStore((s) => s.coins);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [coins]);
  return (
    <div className={`glass rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-2 transition-transform ${bump ? 'scale-110' : ''}`} aria-label={`RM${coins}`}>
      <span className="grid place-items-center w-8 h-8 rounded-full bg-butter text-lg shadow-[0_2px_0_#d9a520]" aria-hidden>
        🪙
      </span>
      <span className="text-lg font-bold tabular-nums">{coins.toLocaleString()}</span>
    </div>
  );
}

function CurrentTaskCard() {
  const s = useGameStore();
  const open = useUiStore((u) => u.openModal);
  const task = currentTask(s);
  if (!task) {
    return (
      <button onClick={() => open('tasks')} className="glass rounded-3xl p-3 text-left w-[min(62vw,18rem)] animate-slide-down">
        <div className="font-bold">🎉 Semua kerja dah siap!</div>
        <div className="text-xs text-ink-soft">Buka senarai kerja & tidur untuk mula hari baru.</div>
      </button>
    );
  }
  const g = taskGuide(task.id, s, player);
  return (
    <button
      onClick={() => {
        sfx('click');
        open('tasks');
      }}
      className="glass rounded-3xl p-3 text-left w-[min(62vw,18rem)] animate-slide-down hover:brightness-105 transition"
      aria-label={`Kerja sekarang: ${task.name}. ${g.hint}`}
    >
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-candy-light text-xl shrink-0" aria-hidden>
          {task.icon}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-bold text-candy">{s.trackedTask === task.id ? '📍 Dijejak' : 'Kerja sekarang'}</div>
          <div className="font-bold leading-tight truncate">{task.name}</div>
        </div>
      </div>
      <div className="text-xs text-ink-soft mt-1.5 leading-snug">{g.hint}</div>
      {g.progress && <ProgressBar value={g.progress.done / g.progress.total} tone="mint" className="mt-1.5 !h-2" />}
      <div className="flex gap-1.5 mt-2">
        <CoinChip amount={task.coins} />
        <XpChip amount={task.xp} />
      </div>
    </button>
  );
}

function StatusChips() {
  const equipped = useGameStore((s) => s.equipped);
  const setEquipped = useGameStore((s) => s.setEquipped);
  const washer = useGameStore((s) => s.cycle.washer);
  const remaining = useGameStore((s) => Math.ceil(s.cycle.washRemaining));
  const toys = useGameStore((s) => s.cycle.toysCarried.length);
  const clothes = useGameStore((s) => (s.cycle.washer === 'empty' && !s.completedTasks.includes('do_laundry') ? s.cycle.clothesCollected.length : 0));
  return (
    <div className="flex flex-col items-start gap-1.5">
      {equipped !== 'none' && (
        <div className="glass rounded-full pl-3 pr-1 py-1 flex items-center gap-2 text-sm font-semibold animate-pop-in">
          {TOOL_LABEL[equipped]}
          <button
            className="w-6 h-6 rounded-full bg-candy-light text-xs"
            aria-label="Simpan alat"
            onClick={() => {
              sfx('pop');
              setEquipped('none');
            }}
          >
            ✕
          </button>
        </div>
      )}
      {clothes > 0 && <div className="glass chip !text-sm !py-1 animate-pop-in">🧺 Baju kotor {clothes}/3</div>}
      {toys > 0 && <div className="glass chip !text-sm !py-1 animate-pop-in">🧸 Bawa {toys} mainan</div>}
      {washer === 'washing' && <div className="glass chip !text-sm !py-1 animate-pop-in">🫧 Tengah basuh… {remaining}s</div>}
      {washer === 'done' && <div className="glass chip !text-sm !py-1 bg-mint-light animate-bob">🧼 Baju dah siap!</div>}
    </div>
  );
}

function WorkProgress() {
  const work = useInteractionStore((s) => s.work);
  if (!work) return null;
  const pct = Math.min(1, work.elapsed / work.duration);
  return (
    <div className="glass rounded-2xl px-4 py-2 w-56 text-center animate-pop-in">
      <div className="text-sm font-semibold">{work.label}…</div>
      <ProgressBar value={pct} tone="mint" className="mt-1" />
    </div>
  );
}

function InteractPrompt({ touch }: { touch: boolean }) {
  const near = useInteractionStore((s) => s.near);
  const work = useInteractionStore((s) => s.work);
  if (!near || work || touch) return null;
  return (
    <button
      onClick={() => {
        input.interactQueued = true;
      }}
      className={`glass rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-2 animate-pop-in ${near.disabledReason ? 'opacity-80' : ''}`}
    >
      <kbd className="grid place-items-center w-8 h-8 rounded-full bg-candy text-white font-bold shadow-[0_2px_0_#d94b86]">E</kbd>
      <span className="font-semibold">
        {near.icon} {near.label}
      </span>
      {near.disabledReason && <span className="text-xs text-ink-soft max-w-48 truncate">· {near.disabledReason}</span>}
    </button>
  );
}

function ActionButton() {
  const near = useInteractionStore((s) => s.near);
  const work = useInteractionStore((s) => s.work);
  return (
    <div className="flex flex-col items-center gap-1">
      {near && !work && (
        <div className="glass rounded-full px-3 py-1 text-xs font-semibold max-w-40 text-center animate-pop-in">{near.label}</div>
      )}
      <button
        aria-label={near ? near.label : 'Tekan'}
        onPointerDown={(e) => {
          e.preventDefault();
          input.interactQueued = true;
        }}
        className={`w-20 h-20 rounded-full text-3xl grid place-items-center select-none transition active:scale-95 ${
          near && !near.disabledReason
            ? 'bg-gradient-to-b from-[#ff9ac4] to-candy text-white shadow-[0_6px_0_#d94b86,0_10px_20px_rgba(91,61,102,0.3)] animate-bob'
            : 'bg-white/80 text-ink-soft shadow-[0_6px_0_#e5d5ec]'
        }`}
      >
        {near ? near.icon : '✋'}
      </button>
    </div>
  );
}

function PlacementBar() {
  const placement = useUiStore((s) => s.placement);
  if (!placement) return null;
  const item = FURNITURE_BY_ID[placement.itemId];
  return (
    <div className="panel px-4 py-3 w-[min(92vw,480px)] animate-pop-in">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {item?.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold leading-tight truncate">{placement.uid ? 'Alih' : 'Letak'} {item?.name}</div>
          <div className={`text-xs font-semibold ${placement.valid ? 'text-mint' : 'text-candy'}`}>
            {placement.valid ? '✓ Cantik letak sini!' : '✗ Tak muat – jalan atau tunjuk tempat lain'}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-2.5">
        <Button className="!px-2 !py-2 text-sm" onClick={rotatePlacement} silent aria-label="Pusing (R)">
          ⟳ Pusing
        </Button>
        <Button variant="mint" className="!px-2 !py-2 text-sm col-span-2" onClick={() => confirmPlacement()} silent disabled={!placement.valid}>
          ✓ Letak
        </Button>
        {placement.uid ? (
          <Button className="!px-2 !py-2 text-sm" onClick={storePlacement} silent>
            📦 Simpan
          </Button>
        ) : (
          <Button className="!px-2 !py-2 text-sm" onClick={cancelPlacement} silent>
            ✕ Batal
          </Button>
        )}
      </div>
      <p className="hidden sm:block text-[11px] text-ink-soft mt-2 text-center">Gerak guna WASD atau tunjuk dengan mouse · klik / E untuk letak · R pusing · Esc batal</p>
    </div>
  );
}

export function Hud() {
  const open = useUiStore((s) => s.openModal);
  const placement = useUiStore((s) => s.placement);
  const touch = useIsTouch();
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between safe-top safe-bottom px-3 sm:px-4">
      {/* top bar */}
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex flex-col gap-2">
          <LevelBadge />
          {!placement && <CurrentTaskCard />}
          <StatusChips />
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center">
            <ClockChip />
            <CoinCounter />
          </div>
          {/* one column on narrow phones, a compact 3×2 grid on wider screens */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 justify-items-end" dir="rtl">
            <PhoneButton />
            <IconButton label="Rehat" icon="⏸️" onClick={() => open('pause')} />
            <IconButton label="Kedai" icon="🛍️" variant="butter" onClick={() => open('shop')} />
            <IconButton label="Senarai kerja" icon="📋" onClick={() => open('tasks')} />
            <IconButton label="Tetapan" icon="⚙️" onClick={() => open('settings')} />
            <IconButton label="Inventori" icon="📦" onClick={() => open('inventory')} />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-28 max-sm:bottom-48">
        <PhoneBanner />
      </div>

      {/* bottom area */}
      <div className="relative flex items-end justify-between gap-2 pb-1">
        <div className="pointer-events-auto">{touch && !placement && <Joystick />}</div>
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-1 flex flex-col items-center gap-2">
          <WorkProgress />
          {placement ? <PlacementBar /> : <InteractPrompt touch={touch} />}
        </div>
        <div className="pointer-events-auto">{touch && !placement && <ActionButton />}</div>
      </div>
    </div>
  );
}
