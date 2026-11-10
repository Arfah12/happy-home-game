import { PLAYER_SPAWN } from '../config/layout';
import { STARTING_COINS, roomsForLevel } from '../config/levels';
import { FIRST_EVENT_AT } from '../config/phoneEvents';
import type { ContactId, CycleProgress, FamilyState, PhoneState, SaveData, Settings, WorldState } from '../types';
import { DAY_START } from './time';

export const SAVE_VERSION = 1;

export function defaultSettings(): Settings {
  const coarse =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;
  return {
    musicVolume: 0.55,
    sfxVolume: 0.8,
    muted: false,
    quality: coarse ? 'medium' : 'high',
    cameraDistance: 11,
    hijab: true,
  };
}

export function freshCycle(): CycleProgress {
  return {
    dirtCleaned: [],
    dustCollected: [],
    clothesCollected: [],
    clothesLoaded: false,
    washer: 'empty',
    washRemaining: 0,
    bedMade: false,
    plantsWatered: [],
    toysCarried: [],
    toysStored: [],
  };
}

export const ALL_CONTACTS: ContactId[] = ['abang', 'adik', 'jiran', 'mak', 'grup', 'posmen', 'kedai'];

export function freshPhone(): PhoneState {
  return {
    threads: { abang: [{ from: 'them', text: 'Selamat pagi sayang! Abang pergi kerja dulu ye 😘 Jangan lupa sarapan.' }] },
    unread: { abang: 1 },
    pending: null,
    rel: { abang: 5, adik: 5, jiran: 5, mak: 5, grup: 5, posmen: 5, kedai: 5 },
    flags: [],
    queue: [],
    nextAt: FIRST_EVENT_AT,
    seen: {},
  };
}

export function freshWorld(): WorldState {
  return { poop: false, cat: 'none', food: false, parcel: false, rainLeft: 0, kainAngkat: false };
}

export function freshFamily(): FamilyState {
  return {
    breakfastCalled: false,
    adikAteBreakfast: false,
    adikSkippedBreakfast: false,
    dinnerCooked: false,
    dinnerCalled: false,
    dinnerEaten: false,
    mealEndsAt: 0,
    abangGreeted: false,
    lateNoticeShown: false,
  };
}

export function newGame(): SaveData {
  return {
    version: SAVE_VERSION,
    level: 1,
    xp: 0,
    coins: STARTING_COINS,
    day: 1,
    completedTasks: [],
    unlockedRooms: roomsForLevel(1),
    inventory: {},
    placed: [],
    cycle: freshCycle(),
    equipped: 'none',
    trackedTask: null,
    settings: defaultSettings(),
    playerPos: { ...PLAYER_SPAWN },
    stats: { coinsEarned: 0, tasksCompleted: 0, itemsBought: 0, daysCompleted: 0 },
    phone: freshPhone(),
    world: freshWorld(),
    playTime: 0,
    clock: DAY_START,
    family: freshFamily(),
    shopDiscount: 0,
    savedAt: Date.now(),
  };
}
