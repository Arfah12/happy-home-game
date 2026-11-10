import { useState } from 'react';
import { PERFECT_DAY_BONUS } from '../../game/config/levels';
import { TASKS } from '../../game/config/tasks';
import { taskGuide } from '../../game/logic/taskGuide';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { player } from '../../game/systems/playerState';
import { DINNER_START, SLEEP_FROM, clockIcon, formatClock } from '../../game/logic/time';
import { toast } from '../../game/events';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CoinChip, ProgressBar, XpChip } from '../common/Rewards';

export function TaskPanel() {
  const s = useGameStore();
  const close = useUiStore((u) => u.closeModal);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const available = TASKS.filter((t) => t.requiredLevel <= s.level);
  const doneCount = available.filter((t) => s.completedTasks.includes(t.id)).length;
  const allDone = doneCount === available.length;

  const canSleep = s.clock >= SLEEP_FROM;
  const endDay = () => {
    if (!canSleep) {
      const t = s.skipTime();
      toast(`⏩ Masa dicepatkan ke ${formatClock(t)}`, clockIcon(t));
      close();
      return;
    }
    if (!allDone && !confirmEnd) {
      setConfirmEnd(true);
      return;
    }
    s.endDay();
    close();
  };

  return (
    <Modal
      title={`Kerja Hari ${s.day}`}
      icon="📋"
      width="md"
      footer={
        <div className="space-y-2">
          {!canSleep && (
            <p className="text-xs text-center text-ink-soft">
              Sekarang {formatClock(s.clock)}. Boleh tidur lepas pukul 9 malam – atau cepatkan masa kalau dah siap kerja.
            </p>
          )}
          {canSleep && confirmEnd && !allDone && (
            <p className="text-sm text-center text-candy font-semibold animate-fade-in">
              Ada {available.length - doneCount} kerja belum siap. Nak tidur juga? (tiada bonus hari sempurna)
            </p>
          )}
          <Button variant={!canSleep ? 'sky' : allDone ? 'mint' : 'lilac'} className="w-full text-lg" onClick={endDay}>
            {!canSleep
              ? s.clock < DINNER_START
                ? '⏩ Cepatkan ke petang (5:00)'
                : '⏩ Cepatkan ke malam (9:00)'
              : allDone
                ? `🌙 Tidur & tuntut bonus RM${PERFECT_DAY_BONUS.coins}`
                : confirmEnd
                  ? '🌙 Ya, tidur sekarang'
                  : '🌙 Tidur'}
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <ProgressBar value={doneCount / Math.max(1, available.length)} tone="mint" className="flex-1 h-4" />
        <span className="font-semibold text-sm whitespace-nowrap">
          {doneCount}/{available.length} siap
        </span>
      </div>
      <ul className="space-y-2.5">
        {TASKS.map((t) => {
          const locked = t.requiredLevel > s.level;
          const done = s.completedTasks.includes(t.id);
          const tracked = s.trackedTask === t.id;
          const guide = !locked && !done ? taskGuide(t.id, s, player) : null;
          return (
            <li
              key={t.id}
              className={`rounded-3xl p-3 flex items-center gap-3 transition ${
                done ? 'bg-mint-light' : locked ? 'bg-white/60 opacity-70' : tracked ? 'bg-candy-light shadow-[0_3px_0_#f3b7cf]' : 'bg-white shadow-[0_3px_0_#f2d3e0]'
              }`}
            >
              <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white text-2xl shrink-0 shadow-sm" aria-hidden>
                {locked ? '🔒' : done ? '✅' : t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold leading-tight">{t.name}</div>
                <div className="text-xs text-ink-soft mt-0.5 truncate">
                  {locked ? `Dibuka pada level ${t.requiredLevel}` : done ? 'Dah siap hari ni – ganjaran dituntut' : guide?.hint}
                </div>
                {!locked && (
                  <div className="flex gap-1.5 mt-1.5">
                    <CoinChip amount={t.coins} />
                    <XpChip amount={t.xp} />
                    {guide?.progress && (
                      <span className="chip bg-sky/15 text-[#2a7fb8]">
                        {guide.progress.done}/{guide.progress.total}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!locked && !done && (
                <Button
                  variant={tracked ? 'pink' : 'white'}
                  className="!px-3 !py-2 text-sm"
                  onClick={() => s.setTracked(tracked ? null : t.id)}
                  aria-pressed={tracked}
                >
                  {tracked ? '📍 Dijejak' : 'Jejak'}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
