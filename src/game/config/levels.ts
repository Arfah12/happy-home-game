import type { RoomId } from '../types';

export const MAX_LEVEL = 10;

export const STARTING_COINS = 250;

/**
 * XP needed to go from `level` to `level + 1`.
 * A gentle linear curve: 60, 100, 140 … 380  (≈1,980 XP total to reach Lv 10).
 * One full in-game day yields ~70 XP early and ~170 XP late, so Lv 10 takes
 * roughly two weeks of in-game days – long enough to feel earned, short
 * enough to stay fun.
 */
export function xpToNext(level: number): number {
  if (level >= MAX_LEVEL) return Number.POSITIVE_INFINITY;
  return 60 + (level - 1) * 40;
}

export interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  rooms: RoomId[];
  unlocks: string[];
}

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    title: 'Suri Rumah Baru',
    emoji: '🏠',
    rooms: ['kitchen', 'living', 'bathroom'],
    unlocks: ['Dapur asas', 'Ruang tamu', 'Bilik air'],
  },
  {
    level: 2,
    title: 'Ratu Dobi',
    emoji: '🧺',
    rooms: ['laundry'],
    unlocks: ['Ruang dobi', 'Kerja harian: Basuh baju', 'Event baru: Hujan! Angkat kain', 'Rak buku & lukisan di kedai'],
  },
  {
    level: 3,
    title: 'Mimpi Indah',
    emoji: '🛏️',
    rooms: ['bedroom'],
    unlocks: ['Bilik tidur', 'Kerja harian: Kemas katil', 'Perabot bilik tidur', 'Resipi: Nasi Lemak'],
  },
  {
    level: 4,
    title: 'Ruang Tamu Baru',
    emoji: '🛋️',
    rooms: [],
    unlocks: ['Ruang tamu makeover: wallpaper & lampu baru', 'Sofa, meja kopi & kabinet TV'],
  },
  {
    level: 5,
    title: 'Tangan Hijau',
    emoji: '🌷',
    rooms: ['garden'],
    unlocks: ['Taman', 'Kerja harian: Siram pokok', 'Perabot taman'],
  },
  {
    level: 6,
    title: 'Hidup Mewah',
    emoji: '💎',
    rooms: [],
    unlocks: ['Koleksi premium: piano, akuarium, sofa baldu'],
  },
  {
    level: 7,
    title: 'Chef Rumahan',
    emoji: '👩‍🍳',
    rooms: [],
    unlocks: [
      'Dapur upgrade: dapur deluxe (+25% duit masak)',
      'Resipi: Mee Goreng Mamak & Roti Jala Kari',
      'Set meja makan',
    ],
  },
  {
    level: 8,
    title: 'Keluarga Bahagia',
    emoji: '🧸',
    rooms: ['kids'],
    unlocks: ['Bilik anak-anak', 'Kerja harian: Kemas mainan', 'Perabot budak-budak'],
  },
  {
    level: 9,
    title: 'Rumah Makin Besar',
    emoji: '🌞',
    rooms: ['sunroom'],
    unlocks: ['Rumah lebih besar: sambungan sunroom', 'Kerusi malas berjemur'],
  },
  {
    level: 10,
    title: 'Rumah Impian',
    emoji: '👑',
    rooms: [],
    unlocks: ['Makeover rumah impian: bingkai emas & lampu lip-lap', 'Koleksi impian: air pancut emas, lampu kristal'],
  },
];

export function levelInfo(level: number): LevelInfo {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, level - 1))];
}

export function roomsForLevel(level: number): RoomId[] {
  return LEVELS.filter((l) => l.level <= level).flatMap((l) => l.rooms);
}

/** Level at which a room unlocks. */
export function roomUnlockLevel(room: RoomId): number {
  const found = LEVELS.find((l) => l.rooms.includes(room));
  return found ? found.level : 1;
}

export const UPGRADES = {
  livingMakeover: 4,
  kitchenDeluxe: 7,
  dreamHouse: 10,
} as const;

/** Coin multiplier applied to cooking once the deluxe stove is unlocked. */
export const DELUXE_COOKING_BONUS = 1.25;

/** Bonus for finishing every available task before ending the day. */
export const PERFECT_DAY_BONUS = { coins: 100, xp: 15 } as const;
