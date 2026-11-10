import { sanitizeSave } from '../logic/sanitize';
import { selectSaveData, useGameStore } from '../store/gameStore';
import type { SaveData } from '../types';

export const SAVE_KEY = 'happy-home:save:v1';

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const s = window.localStorage;
    const probe = '__hh_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    // Private mode / disabled storage – the game still runs, it just won't persist.
    return null;
  }
}

export function hasLocalSave(): boolean {
  return !!storage()?.getItem(SAVE_KEY);
}

export function loadLocal(): SaveData | null {
  const s = storage();
  const raw = s?.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return sanitizeSave(JSON.parse(raw));
  } catch (err) {
    console.warn('[save] corrupt save ignored', err);
    return null;
  }
}

export function saveLocal(data: SaveData): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('[save] failed to write', err);
    return false;
  }
}

export function clearLocal(): void {
  storage()?.removeItem(SAVE_KEY);
}

export function saveNow(): void {
  saveLocal(selectSaveData(useGameStore.getState()));
}

/** Loads the LocalStorage save (if any) into the store. */
export function restoreProgress(): boolean {
  const data = loadLocal();
  if (data) {
    useGameStore.getState().loadSave(data);
    return true;
  }
  return false;
}

/**
 * Debounced autosave on every state change, plus a flush when the tab is
 * hidden or closed so nothing is lost on mobile.
 */
export function startAutoSave(delayMs = 700): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsub = useGameStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveNow();
    }, delayMs);
  });
  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    saveNow();
  };
  const onVis = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    unsub();
    window.removeEventListener('pagehide', flush);
    document.removeEventListener('visibilitychange', onVis);
    flush();
  };
}
