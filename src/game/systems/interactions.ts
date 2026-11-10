import { FURNITURE_BY_ID } from '../config/furniture';
import {
  CLOTHES_PILES,
  DIRT_SPOTS,
  EVENT_SPOTS,
  GARDEN_PLANTS,
  STATIONS,
  TOYS,
} from '../config/layout';
import { sfx, toast } from '../events';
import { callFamilyState, stoveMode } from '../logic/family';
import { TABLE_CALL } from '../logic/taskGuide';
import { useGameStore, type GameState } from '../store/gameStore';
import { useInteractionStore } from '../store/interactionStore';
import { useUiStore } from '../store/uiStore';
import type { AnimState } from '../types';
import { playGesture, player } from './playerState';

export interface Interactable {
  id: string;
  x: number;
  z: number;
  radius: number;
  label: string;
  icon: string;
  /** If set, the action is a timed "work" session (seconds). */
  duration?: number;
  anim?: AnimState;
  /** When present the interaction is shown but cannot be used. */
  disabledReason?: string;
  run: () => void;
}

const done = (s: GameState, id: Parameters<GameState['isTaskDone']>[0]) => s.completedTasks.includes(id);

function build(s: GameState): Interactable[] {
  const g = useGameStore.getState();
  const ui = useUiStore.getState();
  const list: Interactable[] = [];

  // ── Kitchen ─────────────────────────────────────────────
  const mode = stoveMode(s);
  list.push({
    id: 'stove',
    ...STATIONS.stove,
    radius: 1.25,
    icon: mode === 'dinner' ? '🍲' : '🍳',
    label: mode === 'dinner' ? 'Masak makan malam' : 'Masak sarapan',
    disabledReason:
      mode === 'breakfast'
        ? done(s, 'cook_breakfast')
          ? 'Sarapan dah siap hari ni!'
          : undefined
        : mode === 'dinner'
          ? s.family.dinnerCooked
            ? 'Makan malam dah siap atas meja!'
            : undefined
          : done(s, 'cook_breakfast')
            ? 'Rehat dulu… masak makan malam lepas 5 petang 😌'
            : 'Dah lewat untuk sarapan 😅 Masak makan malam lepas 5 petang.',
    run: () => ui.openModal('cooking'),
  });
  const call = callFamilyState(s);
  if (call) {
    list.push({
      id: 'call_family',
      ...TABLE_CALL,
      radius: 1.3,
      icon: '📣',
      label: 'meal' in call && call.meal === 'breakfast' ? 'Panggil Adik sarapan' : 'Panggil semua makan malam',
      disabledReason: 'reason' in call ? call.reason : undefined,
      run: () => g.callFamily(),
    });
  }
  list.push({
    id: 'sink',
    ...STATIONS.sink,
    radius: 1.15,
    icon: '🍽️',
    label: 'Basuh pinggan',
    disabledReason: done(s, 'wash_dishes') ? 'Pinggan dah berkilat.' : undefined,
    run: () => ui.openModal('dishes'),
  });

  // ── Tool rack ───────────────────────────────────────────
  list.push({
    id: 'tool_mop',
    ...STATIONS.toolMop,
    radius: 0.75,
    icon: '🧹',
    label: s.equipped === 'mop' ? 'Simpan mop' : 'Ambil mop',
    run: () => {
      g.setEquipped(s.equipped === 'mop' ? 'none' : 'mop');
      sfx('pop');
    },
  });
  list.push({
    id: 'tool_vacuum',
    ...STATIONS.toolVacuum,
    radius: 0.75,
    icon: '🌀',
    label: s.equipped === 'vacuum' ? 'Simpan vakum' : 'Ambil vakum',
    run: () => {
      g.setEquipped(s.equipped === 'vacuum' ? 'none' : 'vacuum');
      sfx('pop');
    },
  });

  // ── Living room stains ──────────────────────────────────
  if (!done(s, 'clean_living')) {
    for (const d of DIRT_SPOTS) {
      if (s.cycle.dirtCleaned.includes(d.id)) continue;
      list.push({
        id: `dirt_${d.id}`,
        x: d.x,
        z: d.z,
        radius: d.r + 0.85,
        icon: '🧽',
        label: 'Gosok kotoran',
        duration: 1.6,
        anim: 'clean',
        disabledReason: s.equipped !== 'mop' ? 'Ambil mop kat rak alatan dulu.' : undefined,
        run: () => g.cleanDirt(d.id),
      });
    }
  }

  // ── Laundry ─────────────────────────────────────────────
  if (s.level >= 2) {
    if (!done(s, 'do_laundry') && s.cycle.washer === 'empty') {
      for (const c of CLOTHES_PILES) {
        if (s.cycle.clothesCollected.includes(c.id)) continue;
        list.push({
          id: `clothes_${c.id}`,
          x: c.x,
          z: c.z,
          radius: 1.0,
          icon: '👕',
          label: 'Kutip baju kotor',
          run: () => g.pickClothes(c.id),
        });
      }
    }
    const collected = s.cycle.clothesCollected.length;
    const w = s.cycle.washer;
    let label = 'Mesin basuh';
    let disabledReason: string | undefined;
    let run = () => {};
    if (done(s, 'do_laundry')) {
      disabledReason = 'Baju dah siap basuh hari ni.';
    } else if (w === 'empty') {
      label = 'Masukkan baju';
      if (collected < CLOTHES_PILES.length)
        disabledReason = `Kutip baju kotor dulu (${collected}/${CLOTHES_PILES.length}).`;
      run = () => g.loadWasher();
    } else if (w === 'loaded') {
      label = 'Tekan start';
      run = () => g.startWasher();
    } else if (w === 'washing') {
      label = 'Tengah basuh…';
      disabledReason = `Tengah basuh – ${Math.ceil(s.cycle.washRemaining)} saat lagi.`;
    } else {
      label = 'Ambil baju bersih';
      run = () => g.collectLaundry();
    }
    list.push({ id: 'washer', ...STATIONS.washer, radius: 1.2, icon: '🫧', label, disabledReason, run });
  }

  // ── Bedroom ─────────────────────────────────────────────
  if (s.level >= 3) {
    list.push({
      id: 'bed',
      ...STATIONS.bed,
      radius: 1.3,
      icon: '🛏️',
      label: 'Kemas katil',
      duration: 2.4,
      anim: 'clean',
      disabledReason: s.cycle.bedMade ? 'Katil dah kemas & cantik.' : undefined,
      run: () => g.makeBed(),
    });
  }

  // ── Garden ──────────────────────────────────────────────
  if (s.level >= 5) {
    list.push({
      id: 'tap',
      ...STATIONS.tap,
      radius: 1.0,
      icon: '🚰',
      label: s.equipped === 'can' ? 'Simpan penyiram' : 'Isi penyiram air',
      run: () => {
        g.setEquipped(s.equipped === 'can' ? 'none' : 'can');
        sfx(s.equipped === 'can' ? 'pop' : 'water');
      },
    });
    if (!done(s, 'water_garden')) {
      for (const p of GARDEN_PLANTS) {
        if (s.cycle.plantsWatered.includes(p.id)) continue;
        list.push({
          id: `plant_${p.id}`,
          x: p.x,
          z: p.z - 0.9,
          radius: 1.1,
          icon: '💧',
          label: 'Siram pokok',
          duration: 1.4,
          anim: 'water',
          disabledReason: s.equipped !== 'can' ? 'Isi penyiram kat paip dulu.' : undefined,
          run: () => g.waterPlant(p.id),
        });
      }
    }
  }

  // ── Children's room ─────────────────────────────────────
  if (s.level >= 8) {
    if (!done(s, 'tidy_toys')) {
      for (const t of TOYS) {
        if (s.cycle.toysCarried.includes(t.id) || s.cycle.toysStored.includes(t.id)) continue;
        list.push({ id: `toy_${t.id}`, x: t.x, z: t.z, radius: 0.95, icon: '🧸', label: 'Kutip mainan', run: () => g.pickToy(t.id) });
      }
    }
    list.push({
      id: 'toybox',
      ...STATIONS.toyBox,
      radius: 1.1,
      icon: '🎁',
      label: 'Masukkan mainan',
      disabledReason: done(s, 'tidy_toys')
        ? 'Semua mainan dah kemas!'
        : s.cycle.toysCarried.length === 0
          ? 'Kutip mainan dulu.'
          : undefined,
      run: () => g.storeToys(),
    });
  }

  // ── Random-event objects ────────────────────────────────
  if (s.world.poop) {
    list.push({
      id: 'poop',
      ...EVENT_SPOTS.poop,
      radius: 1.1,
      icon: '💩',
      label: 'Buang tahi kucing',
      duration: 1.8,
      anim: 'clean',
      run: () => g.cleanPoop(),
    });
  }
  if (s.world.cat === 'visiting' || s.world.cat === 'pet') {
    list.push({
      id: 'cat',
      ...EVENT_SPOTS.cat,
      radius: 0.95,
      icon: '🐱',
      label: 'Belai Oyen',
      run: () => {
        sfx('meow');
        toast('Meow~ Oyen suka dibelai 😽', '🐱');
      },
    });
  }
  if (s.world.food) {
    list.push({ id: 'food', ...EVENT_SPOTS.food, radius: 1.1, icon: '🍛', label: 'Ambil rendang Kak Mah', run: () => g.takeFood() });
  }
  if (s.world.parcel) {
    list.push({ id: 'parcel', ...EVENT_SPOTS.parcel, radius: 1.0, icon: '📦', label: 'Buka parcel', run: () => void g.openParcel() });
  }
  if (s.world.rainLeft > 0 && !s.world.kainAngkat && s.level >= 2) {
    list.push({
      id: 'ampaian',
      ...EVENT_SPOTS.ampaian,
      radius: 1.6,
      icon: '☔',
      label: 'Angkat kain!',
      duration: 2.0,
      anim: 'interact',
      run: () => g.angkatKain(),
    });
  }

  // ── Placed furniture (re-arrange) ───────────────────────
  if (!ui.placement) {
    for (const p of s.placed) {
      const item = FURNITURE_BY_ID[p.itemId];
      if (!item) continue;
      list.push({
        id: `furn_${p.uid}`,
        x: p.x,
        z: p.z,
        radius: Math.max(item.size[0], item.size[1]) / 2 + 0.7,
        icon: '✋',
        label: `Alih ${item.name}`,
        run: () => {
          ui.startPlacement({ itemId: p.itemId, uid: p.uid, rot: p.rot, x: p.x, z: p.z });
          sfx('pop');
        },
      });
    }
  }

  return list;
}

let cacheState: GameState | null = null;
let cachePlacement: unknown = undefined;
let cacheList: Interactable[] = [];

export function getInteractables(): Interactable[] {
  const s = useGameStore.getState();
  const placement = useUiStore.getState().placement;
  const placementFlag = placement ? 1 : 0;
  if (s !== cacheState || cachePlacement !== placementFlag) {
    cacheState = s;
    cachePlacement = placementFlag;
    cacheList = build(s);
  }
  return cacheList;
}

export function getInteractable(id: string): Interactable | undefined {
  return getInteractables().find((i) => i.id === id);
}

/** Interactions get priority over furniture when both are in range. */
export function findNearest(x: number, z: number): Interactable | null {
  let best: Interactable | null = null;
  let bestScore = Infinity;
  for (const it of getInteractables()) {
    const d = Math.hypot(it.x - x, it.z - z);
    if (d > it.radius) continue;
    const score = d / it.radius + (it.id.startsWith('furn_') ? 0.6 : 0) + (it.disabledReason ? 0.3 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}

export function isInRange(id: string, x = player.x, z = player.z): boolean {
  const it = getInteractable(id);
  return !!it && Math.hypot(it.x - x, it.z - z) <= it.radius;
}

/** Executes an interaction (press) or starts a timed work session. */
export function triggerInteract(id: string): void {
  const it = getInteractable(id);
  if (!it) return;
  if (it.disabledReason) {
    toast(it.disabledReason, it.icon, 'warn');
    sfx('error');
    return;
  }
  // Face the target.
  player.yaw = Math.atan2(it.x - player.x, it.z - player.z);
  if (it.duration) {
    useInteractionStore.getState().setWork({ id: it.id, label: it.label, duration: it.duration, elapsed: 0 });
    sfx(it.anim === 'water' ? 'water' : 'swish');
    return;
  }
  playGesture();
  sfx('click');
  it.run();
}
