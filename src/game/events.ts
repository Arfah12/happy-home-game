import type { SfxName } from './systems/audio';

export type GameEvent =
  | { type: 'toast'; text: string; icon?: string; tone?: 'info' | 'success' | 'warn' }
  | { type: 'reward'; coins: number; xp: number; label: string }
  | { type: 'levelUp'; level: number }
  | { type: 'sfx'; name: SfxName }
  | { type: 'taskComplete'; taskId: string }
  | { type: 'phone'; contact: string; text: string }
  | { type: 'openShop' };

type Listener = (e: GameEvent) => void;

const listeners = new Set<Listener>();

export function onGameEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emit(e: GameEvent): void {
  listeners.forEach((fn) => fn(e));
}

export const toast = (text: string, icon?: string, tone: 'info' | 'success' | 'warn' = 'info') =>
  emit({ type: 'toast', text, icon, tone });

export const sfx = (name: SfxName) => emit({ type: 'sfx', name });
