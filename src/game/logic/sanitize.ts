import { FURNITURE_BY_ID } from '../config/furniture';
import { MAX_LEVEL, roomsForLevel } from '../config/levels';
import { TASK_BY_ID } from '../config/tasks';
import { PHONE_EVENT_BY_ID } from '../config/phoneEvents';
import type { CatState, ChatMsg, ContactId, CycleProgress, PhoneState, PlacedItem, SaveData, TaskId, ToolId, WasherState, WorldState } from '../types';
import { ALL_CONTACTS, SAVE_VERSION, defaultSettings, freshCycle, freshFamily, freshPhone, freshWorld, newGame } from './defaults';
import { CLOCK_MAX, DAY_START } from './time';

const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const TOOLS: ToolId[] = ['none', 'mop', 'vacuum', 'can'];
const WASHER: WasherState[] = ['empty', 'loaded', 'washing', 'done'];

const CATS: CatState[] = ['none', 'visiting', 'hidden', 'pet'];
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

function sanitizePhone(raw: unknown): PhoneState {
  const base = freshPhone();
  if (!raw || typeof raw !== 'object') return base;
  const r = obj(raw);
  const threads: PhoneState['threads'] = {};
  const t = obj(r.threads);
  for (const c of ALL_CONTACTS) {
    if (!Array.isArray(t[c])) continue;
    threads[c] = (t[c] as unknown[]).flatMap((m): ChatMsg[] => {
      const o = obj(m);
      const from = o.from === 'me' || o.from === 'them' || o.from === 'system' ? o.from : null;
      return from && typeof o.text === 'string' ? [{ from, text: o.text.slice(0, 300) }] : [];
    }).slice(-40);
  }
  const unread: PhoneState['unread'] = {};
  const u = obj(r.unread);
  const rel = { ...base.rel };
  const rr = obj(r.rel);
  for (const c of ALL_CONTACTS) {
    const n = num(u[c], 0, 0, 99);
    if (n > 0) unread[c] = Math.floor(n);
    rel[c] = Math.round(num(rr[c], 5, 0, 10));
  }
  const p = obj(r.pending);
  const pending =
    typeof p.eventId === 'string' && PHONE_EVENT_BY_ID[p.eventId] && ALL_CONTACTS.includes(p.contact as ContactId)
      ? { eventId: p.eventId, contact: p.contact as ContactId, at: num(p.at, 0, 0) }
      : null;
  const queue = Array.isArray(r.queue)
    ? (r.queue as unknown[]).flatMap((q) => {
        const o = obj(q);
        return typeof o.eventId === 'string' && PHONE_EVENT_BY_ID[o.eventId] ? [{ eventId: o.eventId, at: num(o.at, 0, 0) }] : [];
      })
    : [];
  const seen: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj(r.seen))) if (PHONE_EVENT_BY_ID[k]) seen[k] = num(v, 0, 0);
  return { threads, unread, pending, rel, flags: strArr(r.flags), queue, nextAt: num(r.nextAt, base.nextAt, 0), seen };
}

function sanitizeWorld(raw: unknown): WorldState {
  const w = obj(raw);
  const base = freshWorld();
  return {
    poop: w.poop === true,
    cat: CATS.includes(w.cat as CatState) ? (w.cat as CatState) : base.cat,
    food: w.food === true,
    parcel: w.parcel === true,
    rainLeft: num(w.rainLeft, 0, 0, 120),
    kainAngkat: w.kainAngkat === true,
  };
}

/**
 * Turns untrusted JSON (old saves, hand-edited LocalStorage, cloud rows)
 * into a valid SaveData. Unknown fields are dropped, missing ones defaulted.
 */
export function sanitizeSave(raw: unknown): SaveData {
  const base = newGame();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;

  const level = Math.round(num(r.level, 1, 1, MAX_LEVEL));
  const completedTasks = strArr(r.completedTasks).filter((t): t is TaskId => t in TASK_BY_ID);

  const inventory: Record<string, number> = {};
  if (r.inventory && typeof r.inventory === 'object') {
    for (const [k, v] of Object.entries(r.inventory as Record<string, unknown>)) {
      if (FURNITURE_BY_ID[k]) {
        const q = Math.floor(num(v, 0, 0, 999));
        if (q > 0) inventory[k] = q;
      }
    }
  }

  const placed: PlacedItem[] = Array.isArray(r.placed)
    ? (r.placed as unknown[]).flatMap((p) => {
        if (!p || typeof p !== 'object') return [];
        const o = p as Record<string, unknown>;
        if (typeof o.itemId !== 'string' || !FURNITURE_BY_ID[o.itemId]) return [];
        return [
          {
            uid: typeof o.uid === 'string' ? o.uid : Math.random().toString(36).slice(2),
            itemId: o.itemId,
            x: num(o.x, 0, -20, 30),
            z: num(o.z, 0, -20, 30),
            rot: num(o.rot, 0),
          },
        ];
      })
    : [];

  const c = (r.cycle && typeof r.cycle === 'object' ? r.cycle : {}) as Record<string, unknown>;
  const fc = freshCycle();
  const cycle: CycleProgress = {
    dirtCleaned: strArr(c.dirtCleaned),
    dustCollected: strArr(c.dustCollected),
    clothesCollected: strArr(c.clothesCollected),
    clothesLoaded: c.clothesLoaded === true,
    washer: WASHER.includes(c.washer as WasherState) ? (c.washer as WasherState) : fc.washer,
    washRemaining: num(c.washRemaining, 0, 0, 120),
    bedMade: c.bedMade === true,
    plantsWatered: strArr(c.plantsWatered),
    toysCarried: strArr(c.toysCarried),
    toysStored: strArr(c.toysStored),
  };

  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, unknown>;
  const ds = defaultSettings();
  const stats = (r.stats && typeof r.stats === 'object' ? r.stats : {}) as Record<string, unknown>;
  const pos = (r.playerPos && typeof r.playerPos === 'object' ? r.playerPos : {}) as Record<string, unknown>;

  return {
    version: SAVE_VERSION,
    level,
    xp: num(r.xp, 0, 0),
    coins: Math.floor(num(r.coins, base.coins, 0)),
    day: Math.floor(num(r.day, 1, 1)),
    completedTasks: Array.from(new Set(completedTasks)),
    // Rooms are always derived from level so a save can never "lose" or fake a room.
    unlockedRooms: roomsForLevel(level),
    inventory,
    placed,
    cycle,
    equipped: TOOLS.includes(r.equipped as ToolId) ? (r.equipped as ToolId) : 'none',
    trackedTask: typeof r.trackedTask === 'string' && r.trackedTask in TASK_BY_ID ? (r.trackedTask as TaskId) : null,
    settings: {
      musicVolume: num(s.musicVolume, ds.musicVolume, 0, 1),
      sfxVolume: num(s.sfxVolume, ds.sfxVolume, 0, 1),
      muted: s.muted === true,
      quality: s.quality === 'low' || s.quality === 'medium' || s.quality === 'high' ? s.quality : ds.quality,
      cameraDistance: num(s.cameraDistance, ds.cameraDistance, 8, 16),
      hijab: typeof s.hijab === 'boolean' ? s.hijab : ds.hijab,
    },
    playerPos: { x: num(pos.x, base.playerPos.x, -10, 17), z: num(pos.z, base.playerPos.z, -8, 15) },
    stats: {
      coinsEarned: num(stats.coinsEarned, 0, 0),
      tasksCompleted: num(stats.tasksCompleted, 0, 0),
      itemsBought: num(stats.itemsBought, 0, 0),
      daysCompleted: num(stats.daysCompleted, 0, 0),
    },
    phone: sanitizePhone(r.phone),
    world: sanitizeWorld(r.world),
    playTime: num(r.playTime, 0, 0),
    clock: num(r.clock, DAY_START, 0, CLOCK_MAX),
    family: (() => {
      const f = obj(r.family);
      const base = freshFamily();
      const out = { ...base };
      for (const k of Object.keys(base) as (keyof typeof base)[]) {
        if (k === 'mealEndsAt') out.mealEndsAt = num(f.mealEndsAt, 0, 0);
        else out[k] = f[k] === true;
      }
      return out;
    })(),
    shopDiscount: num(r.shopDiscount, 0, 0, 0.5),
    savedAt: num(r.savedAt, Date.now()),
  };
}
