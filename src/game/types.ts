export type RoomId =
  | 'kitchen'
  | 'living'
  | 'bathroom'
  | 'laundry'
  | 'bedroom'
  | 'garden'
  | 'kids'
  | 'sunroom';

export type TaskId =
  | 'cook_breakfast'
  | 'wash_dishes'
  | 'clean_living'
  | 'vacuum_floor'
  | 'do_laundry'
  | 'make_bed'
  | 'water_garden'
  | 'tidy_toys'
  | 'family_dinner';

export type ToolId = 'none' | 'mop' | 'vacuum' | 'can';

export type WasherState = 'empty' | 'loaded' | 'washing' | 'done';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type AnimState = 'idle' | 'walk' | 'interact' | 'cook' | 'clean' | 'water' | 'sit' | 'eat' | 'floor';

export interface Settings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  quality: GraphicsQuality;
  cameraDistance: number; // 8..16
  hijab: boolean;
}

export interface PlacedItem {
  uid: string;
  itemId: string;
  x: number;
  z: number;
  rot: number; // radians, multiples of PI/2
}

/** World state for the current task cycle ("day"). Reset when a new day starts. */
export interface CycleProgress {
  dirtCleaned: string[];
  dustCollected: string[];
  clothesCollected: string[];
  clothesLoaded: boolean;
  washer: WasherState;
  washRemaining: number; // seconds
  bedMade: boolean;
  plantsWatered: string[];
  toysCarried: string[];
  toysStored: string[];
}

export interface PlayerStats {
  coinsEarned: number;
  tasksCompleted: number;
  itemsBought: number;
  daysCompleted: number;
}

export type ContactId = 'abang' | 'adik' | 'jiran' | 'mak' | 'grup' | 'posmen' | 'kedai';

export interface ChatMsg {
  from: 'them' | 'me' | 'system';
  text: string;
}

export interface PhoneState {
  threads: Partial<Record<ContactId, ChatMsg[]>>;
  unread: Partial<Record<ContactId, number>>;
  /** Event waiting for the player to pick a reply. */
  pending: { eventId: string; contact: ContactId; at: number } | null;
  /** Relationship meters 0..10. */
  rel: Record<ContactId, number>;
  flags: string[];
  /** Follow-up events scheduled at a given playTime. */
  queue: { eventId: string; at: number }[];
  /** playTime when the next random event may fire. */
  nextAt: number;
  /** playTime each event last fired (for cooldowns). */
  seen: Record<string, number>;
}

export type CatState = 'none' | 'visiting' | 'hidden' | 'pet';

/** Things random events put into the house. Reset daily where it makes sense. */
export interface WorldState {
  poop: boolean;
  cat: CatState;
  food: boolean;
  parcel: boolean;
  /** Seconds of rain left (0 = dry). */
  rainLeft: number;
  /** Clothes have been brought in from the line today. */
  kainAngkat: boolean;
}

/** The family's daily routine (reset every morning). */
export interface FamilyState {
  breakfastCalled: boolean;
  adikAteBreakfast: boolean;
  adikSkippedBreakfast: boolean;
  dinnerCooked: boolean;
  dinnerCalled: boolean;
  dinnerEaten: boolean;
  /** playTime when the current meal finishes. */
  mealEndsAt: number;
  abangGreeted: boolean;
  lateNoticeShown: boolean;
}

/** Everything that is persisted (LocalStorage + optional cloud). */
export interface SaveData {
  version: number;
  level: number;
  xp: number;
  coins: number;
  day: number;
  completedTasks: TaskId[];
  unlockedRooms: RoomId[];
  inventory: Record<string, number>; // owned but not placed
  placed: PlacedItem[];
  cycle: CycleProgress;
  equipped: ToolId;
  trackedTask: TaskId | null;
  settings: Settings;
  playerPos: { x: number; z: number };
  stats: PlayerStats;
  phone: PhoneState;
  world: WorldState;
  /** Unpaused seconds played – drives the event scheduler. */
  playTime: number;
  /** In-game time of day, minutes since midnight. */
  clock: number;
  family: FamilyState;
  /** Shop discount for the rest of the day (0..0.5). */
  shopDiscount: number;
  savedAt: number;
}
