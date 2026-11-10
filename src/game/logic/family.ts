import type { AnimState, SaveData } from '../types';
import {
  ABANG_BEDTIME,
  ABANG_HOME,
  ABANG_HOME_LATE,
  ADIK_BEDTIME,
  ADIK_SCHOOL_BACK,
  ADIK_SCHOOL_LEAVE,
  BREAKFAST_END,
  DINNER_START,
} from './time';

export type NpcId = 'adik' | 'abang';
export type Spot = 'play' | 'table' | 'away' | 'sofa' | 'bed';

export interface NpcPlan {
  spot: Spot;
  /** Animation once the NPC has arrived. */
  anim: AnimState;
}

export function abangHomeTime(s: SaveData): number {
  return s.phone.flags.includes('abangLambat') ? ABANG_HOME_LATE : ABANG_HOME;
}

export function abangIsHome(s: SaveData): boolean {
  return s.clock >= abangHomeTime(s) && s.clock < ABANG_BEDTIME + 60 * 3;
}

export function breakfastMealActive(s: SaveData): boolean {
  const f = s.family;
  return f.breakfastCalled && !f.adikAteBreakfast;
}

export function dinnerMealActive(s: SaveData): boolean {
  const f = s.family;
  return f.dinnerCalled && !f.dinnerEaten;
}

export function adikAtSchool(s: SaveData): boolean {
  return s.clock >= ADIK_SCHOOL_LEAVE && s.clock < ADIK_SCHOOL_BACK && !breakfastMealActive(s);
}

/** Where each family member wants to be right now. Pure – the 3D scene walks them there. */
export function npcPlan(s: SaveData): Record<NpcId, NpcPlan> {
  // ── Adik ──
  let adik: NpcPlan;
  if (dinnerMealActive(s) || breakfastMealActive(s)) adik = { spot: 'table', anim: 'eat' };
  else if (s.clock >= ADIK_BEDTIME) adik = { spot: 'bed', anim: 'idle' };
  else if (adikAtSchool(s)) adik = { spot: 'away', anim: 'idle' };
  else adik = { spot: 'play', anim: 'floor' };

  // ── Abang ──
  let abang: NpcPlan;
  if (!abangIsHome(s) && !dinnerMealActive(s)) abang = { spot: s.clock >= ABANG_BEDTIME ? 'bed' : 'away', anim: 'idle' };
  else if (dinnerMealActive(s)) abang = { spot: 'table', anim: 'eat' };
  else if (s.clock >= ABANG_BEDTIME) abang = { spot: 'bed', anim: 'idle' };
  else abang = { spot: 'sofa', anim: 'sit' };

  return { adik, abang };
}

export type StoveMode = 'breakfast' | 'dinner' | 'closed';

export function stoveMode(s: SaveData): StoveMode {
  if (s.clock < BREAKFAST_END) return 'breakfast';
  if (s.clock >= DINNER_START) return 'dinner';
  return 'closed';
}

/** Can the player call the family to the table right now? Returns the meal or a reason. */
export function callFamilyState(s: SaveData): { meal: 'breakfast' | 'dinner' } | { reason: string } | null {
  const f = s.family;
  if (s.clock < DINNER_START) {
    if (!s.completedTasks.includes('cook_breakfast') || f.adikAteBreakfast || f.adikSkippedBreakfast || f.breakfastCalled) return null;
    if (s.clock >= ADIK_SCHOOL_LEAVE) return null;
    return { meal: 'breakfast' };
  }
  if (f.dinnerEaten || f.dinnerCalled) return null;
  if (!f.dinnerCooked) return { reason: 'Masak makan malam dulu kat dapur.' };
  if (!abangIsHome(s)) return { reason: `Tunggu abang balik dulu (${s.phone.flags.includes('abangLambat') ? '8:00 malam' : '6:30 petang'}).` };
  return { meal: 'dinner' };
}

/** Abang notices a tidy house when he gets home. */
export function houseTidy(s: SaveData): boolean {
  return s.completedTasks.includes('clean_living') && s.completedTasks.includes('wash_dishes') && !s.world.poop;
}
