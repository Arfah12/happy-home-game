import { CLOTHES_PILES, DIRT_SPOTS, DUST_SPOTS, GARDEN_PLANTS, STATIONS, TOYS } from '../config/layout';
import { TASKS, TASK_BY_ID, type TaskDef } from '../config/tasks';
import type { SaveData, TaskId } from '../types';
import { abangIsHome, callFamilyState } from './family';
import { BREAKFAST_END, DINNER_START, formatClock } from './time';

export interface TaskGuide {
  hint: string;
  target?: { x: number; z: number };
  progress?: { done: number; total: number };
}

type Pt = { x: number; z: number };

export const TABLE_CALL = { x: -5.2, z: -1.85 };

function nearest<T extends Pt>(items: T[], from: Pt): T | undefined {
  let best: T | undefined;
  let bd = Infinity;
  for (const it of items) {
    const d = Math.hypot(it.x - from.x, it.z - from.z);
    if (d < bd) {
      bd = d;
      best = it;
    }
  }
  return best;
}

/** Context-aware "what do I do next" for each task. Pure. */
export function taskGuide(id: TaskId, s: SaveData, from: Pt): TaskGuide {
  if (s.completedTasks.includes(id)) return { hint: 'Dah siap hari ni ✓' };
  const c = s.cycle;
  switch (id) {
    case 'cook_breakfast':
      if (s.clock >= BREAKFAST_END) return { hint: 'Alamak, dah terlepas waktu sarapan hari ni 😅' };
      return { hint: `Masak sarapan sebelum ${formatClock(BREAKFAST_END)}.`, target: STATIONS.stove };
    case 'family_dinner': {
      const f = s.family;
      if (s.clock < DINNER_START) return { hint: 'Masak makan malam lepas pukul 5 petang.' };
      if (!f.dinnerCooked) return { hint: 'Masak makan malam kat dapur.', target: STATIONS.stove };
      if (f.dinnerCalled) return { hint: 'Tengah makan sekeluarga… 😋' };
      if (!abangIsHome(s)) return { hint: 'Makanan dah siap. Tunggu abang balik kerja.' };
      const c = callFamilyState(s);
      return c && 'meal' in c ? { hint: 'Panggil semua makan kat meja! 📣', target: TABLE_CALL } : { hint: 'Panggil keluarga makan kat meja.' };
    }
    case 'wash_dishes':
      return { hint: 'Basuh pinggan kat sinki dapur.', target: STATIONS.sink };
    case 'clean_living': {
      const left = DIRT_SPOTS.filter((d) => !c.dirtCleaned.includes(d.id));
      const progress = { done: c.dirtCleaned.length, total: DIRT_SPOTS.length };
      if (s.equipped !== 'mop') return { hint: 'Ambil mop kat rak alatan (ruang tamu).', target: STATIONS.toolMop, progress };
      return { hint: 'Gosok kotoran kat ruang tamu.', target: nearest(left, from), progress };
    }
    case 'vacuum_floor': {
      const left = DUST_SPOTS.filter((d) => !c.dustCollected.includes(d.id));
      const progress = { done: c.dustCollected.length, total: DUST_SPOTS.length };
      if (s.equipped !== 'vacuum')
        return { hint: 'Ambil vakum kat rak alatan (ruang tamu).', target: STATIONS.toolVacuum, progress };
      return { hint: 'Jalan atas bebola habuk untuk sedut.', target: nearest(left, from), progress };
    }
    case 'do_laundry': {
      const progress = { done: c.clothesCollected.length, total: CLOTHES_PILES.length };
      if (c.washer === 'empty') {
        const left = CLOTHES_PILES.filter((p) => !c.clothesCollected.includes(p.id));
        if (left.length) return { hint: 'Kutip baju kotor sekeliling rumah.', target: nearest(left, from), progress };
        return { hint: 'Masukkan baju dalam mesin basuh.', target: STATIONS.washer, progress };
      }
      if (c.washer === 'loaded') return { hint: 'Tekan start mesin basuh.', target: STATIONS.washer };
      if (c.washer === 'washing')
        return { hint: `Tengah basuh… ${Math.ceil(c.washRemaining)} saat lagi. Buat kerja lain dulu!` };
      return { hint: 'Ambil baju bersih.', target: STATIONS.washer };
    }
    case 'make_bed':
      return { hint: 'Kemas katil dalam bilik tidur.', target: STATIONS.bed };
    case 'water_garden': {
      const left = GARDEN_PLANTS.filter((p) => !c.plantsWatered.includes(p.id));
      const progress = { done: c.plantsWatered.length, total: GARDEN_PLANTS.length };
      if (s.equipped !== 'can') return { hint: 'Isi penyiram kat paip taman.', target: STATIONS.tap, progress };
      const p = nearest(left, from);
      return { hint: 'Siram semua pokok kat taman.', target: p ? { x: p.x, z: p.z - 0.9 } : undefined, progress };
    }
    case 'tidy_toys': {
      const left = TOYS.filter((t) => !c.toysCarried.includes(t.id) && !c.toysStored.includes(t.id));
      const progress = { done: c.toysStored.length, total: TOYS.length };
      if (left.length) return { hint: 'Kutip mainan atas lantai.', target: nearest(left, from), progress };
      return { hint: 'Masukkan mainan dalam kotak mainan.', target: STATIONS.toyBox, progress };
    }
  }
}

/** The task shown on the HUD: the tracked one, else the first unfinished one. */
export function currentTask(s: SaveData): TaskDef | null {
  const avail = TASKS.filter(
    (t) =>
      t.requiredLevel <= s.level &&
      !s.completedTasks.includes(t.id) &&
      !(t.id === 'cook_breakfast' && s.clock >= BREAKFAST_END) &&
      // dinner only becomes the focus in the evening
      !(t.id === 'family_dinner' && s.clock < DINNER_START),
  );
  if (s.trackedTask && avail.some((t) => t.id === s.trackedTask)) return TASK_BY_ID[s.trackedTask];
  // In the evening, dinner with the family is the main event.
  const dinner = avail.find((t) => t.id === 'family_dinner');
  if (dinner) return dinner;
  // While the washer runs, suggest something else to do.
  const notWaiting = avail.filter((t) => !(t.id === 'do_laundry' && s.cycle.washer === 'washing'));
  return notWaiting[0] ?? avail[0] ?? null;
}
