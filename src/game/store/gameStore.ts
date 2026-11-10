import { create } from 'zustand';
import { FURNITURE_BY_ID } from '../config/furniture';
import { CLOTHES_PILES, DIRT_SPOTS, DUST_SPOTS, GARDEN_PLANTS, TOYS } from '../config/layout';
import { PERFECT_DAY_BONUS, levelInfo, roomsForLevel } from '../config/levels';
import { FURNITURE } from '../config/furniture';
import {
  DEFAULT_COOLDOWN,
  EVENT_GAP,
  FOOD_REWARD,
  MAX_THREAD,
  PHONE_EVENTS,
  PHONE_EVENT_BY_ID,
  POOP_REWARD,
  RAIN_REWARD,
  type EventApi,
  type EventChoice,
  type PhoneEventDef,
} from '../config/phoneEvents';
import { TASK_BY_ID, availableTasks } from '../config/tasks';
import { emit, sfx, toast } from '../events';
import { freshCycle, freshFamily, freshWorld, newGame } from '../logic/defaults';
import { abangHomeTime, callFamilyState, houseTidy } from '../logic/family';
import { ADIK_SCHOOL_LEAVE, CLOCK_MAX, DAY_START, DINNER_START, MIN_PER_SEC, SLEEP_FROM } from '../logic/time';
import { applyXp } from '../logic/progression';
import type { ChatMsg, ContactId, PhoneState, SaveData, Settings, TaskId, ToolId, WorldState } from '../types';

export const WASH_DURATION = 14; // seconds
export const PENDING_EXPIRES = 150; // seconds before an unanswered chat is dropped
export const BREAKFAST_MEAL_SECS = 13;
export const DINNER_MEAL_SECS = 18;

export type BuyResult = 'ok' | 'locked' | 'coins' | 'unknown';

export interface RewardMultipliers {
  coins?: number;
  xp?: number;
}

export interface GameActions {
  /** Grants a task reward once per cycle. Returns false if already claimed / unavailable. */
  completeTask: (id: TaskId, mult?: RewardMultipliers) => boolean;
  isTaskDone: (id: TaskId) => boolean;
  buyItem: (itemId: string) => BuyResult;
  placeFromInventory: (itemId: string, x: number, z: number, rot: number) => boolean;
  movePlaced: (uid: string, x: number, z: number, rot: number) => void;
  storePlaced: (uid: string) => void;
  setEquipped: (tool: ToolId) => void;
  cleanDirt: (id: string) => void;
  collectDust: (id: string) => void;
  pickClothes: (id: string) => void;
  loadWasher: () => void;
  startWasher: () => void;
  tickWasher: (dt: number) => void;
  collectLaundry: () => void;
  makeBed: () => void;
  waterPlant: (id: string) => void;
  pickToy: (id: string) => void;
  storeToys: () => void;
  endDay: () => { perfect: boolean };
  updateSettings: (patch: Partial<Settings>) => void;
  setTracked: (id: TaskId | null) => void;
  setPlayerPos: (x: number, z: number) => void;
  loadSave: (data: SaveData) => void;
  resetGame: () => void;
  /** Price after today's discount. */
  priceOf: (itemId: string) => number;
  /** Advances play time: rain timer + phone event scheduler. */
  advanceTime: (dt: number) => void;
  deliverEvent: (eventId: string) => boolean;
  answerEvent: (choiceIndex: number) => void;
  currentChoices: () => EventChoice[];
  markRead: (c: ContactId) => void;
  cleanPoop: () => void;
  takeFood: () => void;
  openParcel: () => string | null;
  angkatKain: () => void;
  /** Dinner was cooked (rewards come when the family eats). */
  cookDinner: () => void;
  callFamily: () => boolean;
  /** Fast-forward: to 5 petang, to 9 malam. Returns the new clock. */
  skipTime: () => number;
}

export function resolveList<T>(v: T[] | ((s: SaveData) => T[]), s: SaveData): T[] {
  return typeof v === 'function' ? v(s) : v;
}

function eventWeight(e: PhoneEventDef, s: SaveData): number {
  if (e.weight === undefined) return 1;
  return typeof e.weight === 'function' ? e.weight(s) : e.weight;
}

/** Events allowed to fire right now (random pool). */
export function eligibleEvents(s: SaveData): PhoneEventDef[] {
  return PHONE_EVENTS.filter((e) => {
    if (e.followUpOnly) return false;
    if ((e.minLevel ?? 1) > s.level) return false;
    if (e.when && !e.when(s)) return false;
    const last = s.phone.seen[e.id];
    return last === undefined || s.playTime - last >= (e.cooldown ?? DEFAULT_COOLDOWN);
  });
}

export type GameState = SaveData & GameActions;

let washAccum = 0;
let timeAccum = 0;

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const useGameStore = create<GameState>()((set, get) => {
  /** Adds coins + XP, resolves level-ups and fires UI events. */
  const grant = (coins: number, xp: number, label: string) => {
    const s = get();
    const res = applyXp(s.level, s.xp, xp);
    if (coins < 0) toast(`-RM${-coins} · ${label}`, '💸');
    set({
      coins: Math.max(0, s.coins + coins),
      xp: res.xp,
      level: res.level,
      unlockedRooms: roomsForLevel(res.level),
      stats: { ...s.stats, coinsEarned: s.stats.coinsEarned + Math.max(0, coins) },
    });
    if (coins > 0 || xp > 0) emit({ type: 'reward', coins: Math.max(0, coins), xp, label });
    for (const lv of res.levelsGained) {
      emit({ type: 'levelUp', level: lv });
    }
  };

  const taskAvailable = (id: TaskId) => TASK_BY_ID[id].requiredLevel <= get().level;

  const push = (ph: PhoneState, c: ContactId, msg: ChatMsg, unread: boolean) => {
    ph.threads = { ...ph.threads, [c]: [...(ph.threads[c] ?? []), msg].slice(-MAX_THREAD) };
    if (unread) ph.unread = { ...ph.unread, [c]: (ph.unread[c] ?? 0) + 1 };
  };

  const bumpRel = (c: ContactId, d: number) => {
    const ph = get().phone;
    set({ phone: { ...ph, rel: { ...ph.rel, [c]: Math.max(0, Math.min(10, (ph.rel[c] ?? 5) + d)) } } });
  };
  const chat = (c: ContactId, text: string) => {
    const ph = { ...get().phone };
    push(ph, c, { from: 'them', text }, true);
    set({ phone: ph });
    emit({ type: 'phone', contact: c, text });
  };

  /** Family routine: meals finishing, Adik leaving for school, Abang coming home. */
  const runFamily = () => {
    const s = get();
    const f = s.family;
    if (f.breakfastCalled && !f.adikAteBreakfast && s.playTime >= f.mealEndsAt) {
      set({ family: { ...get().family, adikAteBreakfast: true } });
      bumpRel('adik', 1);
      grant(0, 8, 'Adik kenyang sarapan');
      toast('Adik dah kenyang, pergi sekolah! 🎒', '👧🏻', 'success');
    }
    const s2 = get();
    if (s2.clock >= ADIK_SCHOOL_LEAVE && !s2.family.adikAteBreakfast && !s2.family.breakfastCalled && !s2.family.adikSkippedBreakfast) {
      set({ family: { ...s2.family, adikSkippedBreakfast: true } });
      bumpRel('adik', -1);
      chat('adik', 'Mama… adik pergi sekolah perut kosong 😢');
    }
    const s3 = get();
    if (!s3.family.abangGreeted && s3.clock >= abangHomeTime(s3)) {
      const tidy = houseTidy(s3);
      set({ family: { ...s3.family, abangGreeted: true } });
      toast('Abang dah balik kerja! 🏠', '👨🏻', 'success');
      sfx('ding');
      if (tidy) {
        bumpRel('abang', 1);
        chat('abang', 'Assalamualaikum! Abang dah balik. Wah, bersihnya rumah 😍');
      } else {
        chat('abang', 'Assalamualaikum, abang dah balik! Penat ye hari ni? Takpe, abang tolong sikit 🥰');
      }
    }
    const s4 = get();
    if (s4.family.dinnerCalled && !s4.family.dinnerEaten && s4.playTime >= s4.family.mealEndsAt) {
      set({ family: { ...s4.family, dinnerEaten: true } });
      bumpRel('abang', 1);
      bumpRel('adik', 1);
      get().completeTask('family_dinner');
      toast('Alhamdulillah, kenyang semua! 😋', '🍽️', 'success');
    }
    const s5 = get();
    if (s5.clock >= CLOCK_MAX && !s5.family.lateNoticeShown) {
      set({ family: { ...s5.family, lateNoticeShown: true } });
      toast('Dah lewat malam… jom tidur 😴 (Senarai kerja → Tidur)', '🌙');
    }
  };

  /** Runs event code against draft copies of phone + world, then commits. */
  const withApi = (fn: (api: EventApi, ph: PhoneState) => void) => {
    const ph: PhoneState = { ...get().phone, flags: [...get().phone.flags], queue: [...get().phone.queue], rel: { ...get().phone.rel } };
    let w: WorldState = { ...get().world };
    let discount = get().shopDiscount;
    const api: EventApi = {
      get s() {
        return { ...get(), phone: ph, world: w, shopDiscount: discount };
      },
      grant: (c, x, label) => grant(c, x, label),
      rel: (c, d) => {
        const before = ph.rel[c] ?? 5;
        ph.rel[c] = Math.max(0, Math.min(10, before + d));
        if (d !== 0) toast(`${d > 0 ? '💗' : '💔'} ${relName(c)} ${d > 0 ? '+' : ''}${d}`, undefined, d > 0 ? 'success' : 'warn');
      },
      say: (c, text) => push(ph, c, { from: 'them', text }, true),
      note: (c, text) => push(ph, c, { from: 'system', text }, false),
      later: (id, delay) => {
        ph.queue = [...ph.queue.filter((q) => q.eventId !== id), { eventId: id, at: get().playTime + delay }];
      },
      world: (patch) => {
        w = { ...w, ...patch };
      },
      flag: (name, on = true) => {
        ph.flags = on ? Array.from(new Set([...ph.flags, name])) : ph.flags.filter((f) => f !== name);
      },
      discount: (pct) => {
        discount = pct;
      },
      openShop: () => emit({ type: 'openShop' }),
    };
    fn(api, ph);
    set({ phone: ph, world: w, shopDiscount: discount });
  };

  return {
    ...newGame(),

    isTaskDone: (id) => get().completedTasks.includes(id),

    completeTask: (id, mult = {}) => {
      const s = get();
      const def = TASK_BY_ID[id];
      if (!def || !taskAvailable(id)) return false;
      // Duplicate-reward guard: one reward per task per cycle.
      if (s.completedTasks.includes(id)) return false;
      set({
        completedTasks: [...s.completedTasks, id],
        trackedTask: s.trackedTask === id ? null : s.trackedTask,
        stats: { ...s.stats, tasksCompleted: s.stats.tasksCompleted + 1 },
      });
      const coins = Math.round(def.coins * (mult.coins ?? 1));
      const xp = Math.round(def.xp * (mult.xp ?? 1));
      emit({ type: 'taskComplete', taskId: id });
      grant(coins, xp, def.name);
      return true;
    },

    buyItem: (itemId) => {
      const s = get();
      const item = FURNITURE_BY_ID[itemId];
      if (!item) return 'unknown';
      if (item.requiredLevel > s.level) return 'locked';
      const price = get().priceOf(itemId);
      if (s.coins < price) return 'coins';
      const firstTime = !s.inventory[itemId] && !s.placed.some((p) => p.itemId === itemId);
      set({
        coins: s.coins - price,
        inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + 1 },
        stats: { ...s.stats, itemsBought: s.stats.itemsBought + 1 },
      });
      if (firstTime && item.xp > 0) {
        const res = applyXp(get().level, get().xp, item.xp);
        set({ xp: res.xp, level: res.level, unlockedRooms: roomsForLevel(res.level) });
        emit({ type: 'reward', coins: 0, xp: item.xp, label: `Baru: ${item.name}` });
        for (const lv of res.levelsGained) emit({ type: 'levelUp', level: lv });
      }
      return 'ok';
    },

    placeFromInventory: (itemId, x, z, rot) => {
      const s = get();
      const have = s.inventory[itemId] ?? 0;
      if (have <= 0) return false;
      const inventory = { ...s.inventory };
      if (have === 1) delete inventory[itemId];
      else inventory[itemId] = have - 1;
      set({ inventory, placed: [...s.placed, { uid: uid(), itemId, x, z, rot }] });
      return true;
    },

    movePlaced: (id, x, z, rot) => {
      set({ placed: get().placed.map((p) => (p.uid === id ? { ...p, x, z, rot } : p)) });
    },

    storePlaced: (id) => {
      const s = get();
      const p = s.placed.find((q) => q.uid === id);
      if (!p) return;
      set({
        placed: s.placed.filter((q) => q.uid !== id),
        inventory: { ...s.inventory, [p.itemId]: (s.inventory[p.itemId] ?? 0) + 1 },
      });
    },

    setEquipped: (tool) => set({ equipped: tool }),

    cleanDirt: (id) => {
      const s = get();
      if (s.cycle.dirtCleaned.includes(id)) return;
      const dirtCleaned = [...s.cycle.dirtCleaned, id];
      set({ cycle: { ...s.cycle, dirtCleaned } });
      sfx('sparkle');
      if (DIRT_SPOTS.every((d) => dirtCleaned.includes(d.id))) {
        get().completeTask('clean_living');
      } else {
        toast(`Kotoran hilang! ${dirtCleaned.length}/${DIRT_SPOTS.length}`, '✨');
      }
    },

    collectDust: (id) => {
      const s = get();
      if (s.cycle.dustCollected.includes(id)) return;
      const dustCollected = [...s.cycle.dustCollected, id];
      set({ cycle: { ...s.cycle, dustCollected } });
      sfx('pop');
      if (DUST_SPOTS.every((d) => dustCollected.includes(d.id))) {
        get().completeTask('vacuum_floor');
      }
    },

    pickClothes: (id) => {
      const s = get();
      if (s.cycle.clothesCollected.includes(id) || !taskAvailable('do_laundry')) return;
      const clothesCollected = [...s.cycle.clothesCollected, id];
      set({ cycle: { ...s.cycle, clothesCollected } });
      sfx('pop');
      const left = CLOTHES_PILES.length - clothesCollected.length;
      toast(left > 0 ? `Baju kotor dikutip – tinggal ${left} timbunan lagi` : 'Semua baju dah kutip! Bawa ke mesin basuh.', '👕');
    },

    loadWasher: () => {
      const s = get();
      if (s.cycle.washer !== 'empty' || s.cycle.clothesCollected.length < CLOTHES_PILES.length) return;
      set({ cycle: { ...s.cycle, washer: 'loaded', clothesLoaded: true } });
      sfx('pop');
      toast('Baju dah masuk. Tekan start!', '🧺');
    },

    startWasher: () => {
      const s = get();
      if (s.cycle.washer !== 'loaded') return;
      set({ cycle: { ...s.cycle, washer: 'washing', washRemaining: WASH_DURATION } });
      sfx('click');
      toast('Mesin tengah basuh… buat kerja lain dulu!', '🫧');
    },

    tickWasher: (dt) => {
      const s = get();
      if (s.cycle.washer !== 'washing') {
        washAccum = 0;
        return;
      }
      // Batch updates to ~4 per second so the store (and autosave) is not hit every frame.
      washAccum += dt;
      if (washAccum < 0.25) return;
      const step = washAccum;
      washAccum = 0;
      const remaining = s.cycle.washRemaining - step;
      if (remaining <= 0) {
        set({ cycle: { ...s.cycle, washer: 'done', washRemaining: 0 } });
        sfx('ding');
        toast('Baju dah siap basuh! Pergi ambil kat mesin.', '🧼', 'success');
      } else {
        set({ cycle: { ...s.cycle, washRemaining: remaining } });
      }
    },

    collectLaundry: () => {
      const s = get();
      if (s.cycle.washer !== 'done') return;
      set({ cycle: { ...s.cycle, washer: 'empty', washRemaining: 0 } });
      get().completeTask('do_laundry');
    },

    makeBed: () => {
      const s = get();
      if (s.cycle.bedMade) return;
      set({ cycle: { ...s.cycle, bedMade: true } });
      get().completeTask('make_bed');
    },

    waterPlant: (id) => {
      const s = get();
      if (s.cycle.plantsWatered.includes(id)) return;
      const plantsWatered = [...s.cycle.plantsWatered, id];
      set({ cycle: { ...s.cycle, plantsWatered } });
      sfx('water');
      if (GARDEN_PLANTS.every((p) => plantsWatered.includes(p.id))) {
        get().completeTask('water_garden');
      }
    },

    pickToy: (id) => {
      const s = get();
      if (s.cycle.toysCarried.includes(id) || s.cycle.toysStored.includes(id)) return;
      set({ cycle: { ...s.cycle, toysCarried: [...s.cycle.toysCarried, id] } });
      sfx('pop');
    },

    storeToys: () => {
      const s = get();
      if (s.cycle.toysCarried.length === 0) return;
      const toysStored = [...s.cycle.toysStored, ...s.cycle.toysCarried];
      set({ cycle: { ...s.cycle, toysStored, toysCarried: [] } });
      sfx('pop');
      if (TOYS.every((t) => toysStored.includes(t.id))) {
        get().completeTask('tidy_toys');
      } else {
        toast(`Mainan dikemas: ${toysStored.length}/${TOYS.length}`, '🧸');
      }
    },

    endDay: () => {
      const s = get();
      const avail = availableTasks(s.level);
      const perfect = avail.every((t) => s.completedTasks.includes(t.id));
      set({
        day: s.day + 1,
        completedTasks: [],
        cycle: freshCycle(),
        // The cat goes home and the rain stops overnight; mess stays until cleaned.
        world: { ...freshWorld(), poop: s.world.poop, parcel: s.world.parcel, food: s.world.food },
        shopDiscount: 0,
        clock: DAY_START,
        family: freshFamily(),
        phone: { ...s.phone, flags: s.phone.flags.filter((f) => f !== 'makPuas' && f !== 'abangLambat') },
        equipped: 'none',
        trackedTask: null,
        stats: { ...s.stats, daysCompleted: s.stats.daysCompleted + 1 },
      });
      if (perfect) {
        grant(PERFECT_DAY_BONUS.coins, PERFECT_DAY_BONUS.xp, 'Bonus hari sempurna!');
      }
      toast(`Selamat pagi! Hari ${s.day + 1} bermula.`, '☀️', 'success');
      return { perfect };
    },

    updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

    setTracked: (id) => set({ trackedTask: id }),

    setPlayerPos: (x, z) => set({ playerPos: { x, z } }),

    loadSave: (data) => set({ ...data, unlockedRooms: roomsForLevel(data.level) }),

    resetGame: () => {
      const keepSettings = get().settings;
      set({ ...newGame(), settings: keepSettings });
    },

    priceOf: (itemId) => {
      const item = FURNITURE_BY_ID[itemId];
      if (!item) return Infinity;
      return Math.round(item.price * (1 - get().shopDiscount));
    },

    advanceTime: (dt) => {
      timeAccum += dt;
      if (timeAccum < 1) return;
      const step = timeAccum;
      timeAccum = 0;
      const s = get();
      const playTime = s.playTime + step;
      let world = s.world;
      if (world.rainLeft > 0) {
        const left = Math.max(0, world.rainLeft - step);
        if (left === 0 && !world.kainAngkat) {
          toast('Alamak... kain basah semua 😭', '☔', 'warn');
          const ph = { ...s.phone };
          push(ph, 'abang', { from: 'them', text: 'Kain sempat angkat tak? 😅' }, true);
          set({ phone: ph });
        } else if (left === 0) {
          toast('Hujan dah berhenti 🌤️', '🌈');
        }
        world = { ...world, rainLeft: left };
      }
      set({ playTime, world, clock: Math.min(CLOCK_MAX, s.clock + step * MIN_PER_SEC) });
      runFamily();

      // Phone scheduler – one conversation at a time.
      let st = get();
      if (st.phone.pending && playTime - st.phone.pending.at > PENDING_EXPIRES) {
        // Ignored for too long: it's just "seen" now, no effects.
        const ph = { ...st.phone };
        push(ph, st.phone.pending.contact, { from: 'system', text: '(tak dibalas)' }, false);
        ph.pending = null;
        set({ phone: ph });
        st = get();
      }
      if (st.phone.pending) return;
      const due = st.phone.queue.find((q) => q.at <= playTime);
      if (due) {
        set({ phone: { ...st.phone, queue: st.phone.queue.filter((q) => q !== due) } });
        const def = PHONE_EVENT_BY_ID[due.eventId];
        if (!def?.when || def.when(get())) get().deliverEvent(due.eventId);
        return;
      }
      // Story follow-ups take priority: hold random chats if one is due soon.
      const followUpSoon = st.phone.queue.some((q) => q.at <= playTime + 25);
      if (playTime >= st.phone.nextAt && !followUpSoon) {
        const pool = eligibleEvents(st);
        const gap = EVENT_GAP[0] + Math.random() * (EVENT_GAP[1] - EVENT_GAP[0]);
        set({ phone: { ...get().phone, nextAt: playTime + gap } });
        if (!pool.length) return;
        const total = pool.reduce((sum, e) => sum + eventWeight(e, st), 0);
        let r = Math.random() * total;
        const pick = pool.find((e) => (r -= eventWeight(e, st)) <= 0) ?? pool[pool.length - 1];
        get().deliverEvent(pick.id);
      }
    },

    deliverEvent: (eventId) => {
      const def = PHONE_EVENT_BY_ID[eventId];
      if (!def || get().phone.pending) return false;
      const msgs = resolveList(def.messages, get());
      let last = '';
      withApi((api, ph) => {
        for (const m of msgs) {
          push(ph, def.contact, { from: 'them', text: m }, true);
          last = m;
        }
        ph.seen = { ...ph.seen, [eventId]: get().playTime };
        def.onDeliver?.(api);
        const choices = resolveList(def.choices, api.s);
        ph.pending = choices.length ? { eventId, contact: def.contact, at: get().playTime } : null;
      });
      emit({ type: 'phone', contact: def.contact, text: last });
      sfx('notify');
      return true;
    },

    currentChoices: () => {
      const p = get().phone.pending;
      const def = p ? PHONE_EVENT_BY_ID[p.eventId] : undefined;
      return def ? resolveList(def.choices, get()) : [];
    },

    answerEvent: (i) => {
      const p = get().phone.pending;
      if (!p) return;
      const choice = get().currentChoices()[i];
      if (!choice) return;
      withApi((api, ph) => {
        push(ph, p.contact, { from: 'me', text: choice.reply ?? choice.label }, false);
        if (choice.response) push(ph, p.contact, { from: 'them', text: choice.response }, false);
        ph.pending = null;
        choice.run?.(api);
      });
      sfx('pop');
    },

    markRead: (c) => {
      const ph = get().phone;
      if (!ph.unread[c]) return;
      const unread = { ...ph.unread };
      delete unread[c];
      set({ phone: { ...ph, unread } });
    },

    cleanPoop: () => {
      const s = get();
      if (!s.world.poop) return;
      set({ world: { ...s.world, poop: false, cat: s.world.cat === 'visiting' ? 'none' : s.world.cat } });
      sfx('sparkle');
      grant(POOP_REWARD.coins, POOP_REWARD.xp, 'Tahi kucing dibuang!');
    },

    takeFood: () => {
      const s = get();
      if (!s.world.food) return;
      set({ world: { ...s.world, food: false } });
      grant(FOOD_REWARD.coins, FOOD_REWARD.xp, 'Rendang Kak Mah – jimat duit lauk!');
      withApi((api) => api.later('jiran_tupperware', 70));
    },

    openParcel: () => {
      const s = get();
      if (!s.world.parcel) return null;
      const pool = FURNITURE.filter((f) => f.requiredLevel <= s.level && f.price <= 260);
      const item = pool[Math.floor(Math.random() * pool.length)];
      set({
        world: { ...s.world, parcel: false },
        inventory: item ? { ...s.inventory, [item.id]: (s.inventory[item.id] ?? 0) + 1 } : s.inventory,
      });
      sfx('reward');
      if (item) {
        toast(`Dalam parcel: ${item.name}! Ada dalam inventori 🎁`, item.emoji, 'success');
        grant(0, 6, 'Parcel misteri');
      }
      return item?.id ?? null;
    },

    angkatKain: () => {
      const s = get();
      if (s.world.kainAngkat || s.world.rainLeft <= 0) return;
      set({ world: { ...s.world, kainAngkat: true } });
      grant(RAIN_REWARD.coins, RAIN_REWARD.xp, 'Sempat angkat kain! ☔');
    },

    cookDinner: () => {
      const s = get();
      if (s.family.dinnerCooked || s.clock < DINNER_START) return;
      set({ family: { ...s.family, dinnerCooked: true } });
      grant(0, 5, 'Makan malam siap');
    },

    callFamily: () => {
      const s = get();
      const st = callFamilyState(s);
      if (!st || !('meal' in st)) return false;
      if (st.meal === 'breakfast') {
        set({ family: { ...s.family, breakfastCalled: true, mealEndsAt: s.playTime + BREAKFAST_MEAL_SECS } });
        toast('Adiiik! Mari makan sarapan! 📣', '👩🏻', 'info');
      } else {
        set({ family: { ...s.family, dinnerCalled: true, mealEndsAt: s.playTime + DINNER_MEAL_SECS } });
        toast('Abang, Adik! Jom makan malam! 📣', '👩🏻', 'info');
      }
      sfx('notify');
      return true;
    },

    skipTime: () => {
      const s = get();
      const target = s.clock < DINNER_START ? DINNER_START : Math.max(s.clock, SLEEP_FROM);
      set({ clock: target });
      runFamily();
      return target;
    },
  };
});

function relName(c: ContactId): string {
  return { abang: 'Abang', adik: 'Adik', jiran: 'Kak Mah', mak: 'Mak', grup: 'Jiran', posmen: 'Posmen', kedai: 'Kedai' }[c];
}

/** Snapshot of the persisted part of the state. */
export function selectSaveData(s: GameState): SaveData {
  return {
    version: s.version,
    level: s.level,
    xp: s.xp,
    coins: s.coins,
    day: s.day,
    completedTasks: s.completedTasks,
    unlockedRooms: s.unlockedRooms,
    inventory: s.inventory,
    placed: s.placed,
    cycle: s.cycle,
    equipped: s.equipped,
    trackedTask: s.trackedTask,
    settings: s.settings,
    playerPos: s.playerPos,
    stats: s.stats,
    phone: s.phone,
    world: s.world,
    playTime: s.playTime,
    clock: s.clock,
    family: s.family,
    shopDiscount: s.shopDiscount,
    savedAt: Date.now(),
  };
}

export function levelTitle(level: number): string {
  return levelInfo(level).title;
}
