/** In-game clock helpers. Time is stored as minutes since midnight. */

export const DAY_START = 7 * 60; // 7:00 pagi
export const CLOCK_MAX = 23 * 60 + 30; // the clock waits here until you sleep
/** Game minutes per real (unpaused) second: 7 pagi → 9 malam ≈ 9 minutes of play. */
export const MIN_PER_SEC = 1.6;

export const BREAKFAST_END = 12 * 60;
export const ADIK_SCHOOL_LEAVE = 9 * 60 + 30;
export const ADIK_SCHOOL_BACK = 14 * 60;
export const DINNER_START = 17 * 60;
export const ABANG_HOME = 18 * 60 + 30;
export const ABANG_HOME_LATE = 20 * 60;
export const SLEEP_FROM = 21 * 60;
export const ADIK_BEDTIME = 21 * 60 + 30;
export const ABANG_BEDTIME = 22 * 60 + 15;

export function period(m: number): string {
  if (m < 5 * 60) return 'pagi buta';
  if (m < 12 * 60) return 'pagi';
  if (m < 14 * 60) return 'tengah hari';
  if (m < 19 * 60) return 'petang';
  return 'malam';
}

/** "7:05 pagi" */
export function formatClock(m: number): string {
  const mins = Math.floor(m) % (24 * 60);
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  const h12 = h % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${period(mins)}`;
}

export function clockIcon(m: number): string {
  if (m < 11 * 60) return '🌅';
  if (m < 17 * 60) return '☀️';
  if (m < 19 * 60 + 30) return '🌇';
  return '🌙';
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 0 = night, 1 = full day. Dawn before 7:30, dusk 18:00–19:45. */
export function daylight(m: number): number {
  return smooth(5.5 * 60, 7.5 * 60, m) * (1 - smooth(18 * 60, 19.75 * 60, m));
}

/** 0..1 how "golden hour" it is (morning & evening glow). */
export function goldenHour(m: number): number {
  const evening = smooth(16.5 * 60, 18.3 * 60, m) * (1 - smooth(18.8 * 60, 19.8 * 60, m));
  const morning = 1 - smooth(7 * 60, 8.5 * 60, m);
  return Math.max(evening, morning * 0.6);
}

export function isNight(m: number): boolean {
  return daylight(m) < 0.35;
}
