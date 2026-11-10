import { MAX_LEVEL, xpToNext } from '../config/levels';

export interface XpResult {
  level: number;
  xp: number;
  levelsGained: number[];
}

/** Adds XP and resolves any number of level-ups. Pure. */
export function applyXp(level: number, xp: number, gain: number): XpResult {
  let lv = level;
  let cur = xp + Math.max(0, Math.round(gain));
  const levelsGained: number[] = [];
  while (lv < MAX_LEVEL && cur >= xpToNext(lv)) {
    cur -= xpToNext(lv);
    lv += 1;
    levelsGained.push(lv);
  }
  if (lv >= MAX_LEVEL) {
    lv = MAX_LEVEL;
    // Keep accumulating XP at max level for bragging rights, but it no longer levels.
  }
  return { level: lv, xp: cur, levelsGained };
}

/** 0..1 progress towards the next level. */
export function levelProgress(level: number, xp: number): number {
  if (level >= MAX_LEVEL) return 1;
  return Math.max(0, Math.min(1, xp / xpToNext(level)));
}
