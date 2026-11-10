import { create } from 'zustand';
import type { ContactId } from '../types';

export type Screen = 'menu' | 'game';

export type ModalId =
  | 'cooking'
  | 'dishes'
  | 'shop'
  | 'inventory'
  | 'tasks'
  | 'settings'
  | 'pause'
  | 'help'
  | 'phone';

export interface Toast {
  id: number;
  text: string;
  icon?: string;
  tone: 'info' | 'success' | 'warn';
}

export interface RewardPop {
  id: number;
  coins: number;
  xp: number;
  label: string;
}

export interface Placement {
  itemId: string;
  /** Set when re-arranging an already placed piece. */
  uid?: string;
  rot: number;
  x: number;
  z: number;
  valid: boolean;
}

interface UiState {
  screen: Screen;
  modal: ModalId | null;
  /** Modal to return to when a nested modal (e.g. settings from pause) closes. */
  returnTo: ModalId | null;
  levelUpQueue: number[];
  toasts: Toast[];
  rewards: RewardPop[];
  placement: Placement | null;
  sceneReady: boolean;
  webglError: string | null;
  phoneContact: ContactId | null;
  phoneBanner: { id: number; contact: ContactId; text: string } | null;

  setScreen: (s: Screen) => void;
  openModal: (m: ModalId, returnTo?: ModalId | null) => void;
  closeModal: () => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  pushReward: (r: Omit<RewardPop, 'id'>) => void;
  dismissReward: (id: number) => void;
  queueLevelUp: (level: number) => void;
  shiftLevelUp: () => void;
  startPlacement: (p: Omit<Placement, 'valid' | 'x' | 'z'> & { x?: number; z?: number }) => void;
  updatePlacement: (patch: Partial<Placement>) => void;
  endPlacement: () => void;
  setSceneReady: (v: boolean) => void;
  setWebglError: (msg: string | null) => void;
  openPhone: (contact?: ContactId | null) => void;
  setPhoneContact: (c: ContactId | null) => void;
  showPhoneBanner: (contact: ContactId, text: string) => void;
  hidePhoneBanner: () => void;
}

let nextId = 1;

export const useUiStore = create<UiState>()((set, get) => ({
  screen: 'menu',
  modal: null,
  returnTo: null,
  levelUpQueue: [],
  toasts: [],
  rewards: [],
  placement: null,
  sceneReady: false,
  webglError: null,
  phoneContact: null,
  phoneBanner: null,

  setScreen: (screen) => set({ screen, modal: null, returnTo: null, placement: null }),
  openModal: (modal, returnTo = null) => set({ modal, returnTo }),
  closeModal: () => {
    const { returnTo } = get();
    set({ modal: returnTo, returnTo: null });
  },
  pushToast: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  pushReward: (r) => {
    const id = nextId++;
    set({ rewards: [...get().rewards.slice(-2), { ...r, id }] });
  },
  dismissReward: (id) => set({ rewards: get().rewards.filter((r) => r.id !== id) }),
  queueLevelUp: (level) => set({ levelUpQueue: [...get().levelUpQueue, level] }),
  shiftLevelUp: () => set({ levelUpQueue: get().levelUpQueue.slice(1) }),
  startPlacement: (p) => set({ placement: { x: 0, z: 0, ...p, valid: false }, modal: null, returnTo: null }),
  updatePlacement: (patch) => {
    const cur = get().placement;
    if (!cur) return;
    // Avoid store churn when nothing changed (called every frame).
    let changed = false;
    for (const k of Object.keys(patch) as (keyof Placement)[]) {
      if (cur[k] !== patch[k]) {
        changed = true;
        break;
      }
    }
    if (changed) set({ placement: { ...cur, ...patch } });
  },
  endPlacement: () => set({ placement: null }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setWebglError: (webglError) => set({ webglError }),
  openPhone: (contact = null) => set({ modal: 'phone', returnTo: null, phoneContact: contact, phoneBanner: null }),
  setPhoneContact: (phoneContact) => set({ phoneContact }),
  showPhoneBanner: (contact, text) => set({ phoneBanner: { id: nextId++, contact, text } }),
  hidePhoneBanner: () => set({ phoneBanner: null }),
}));

/** The world is frozen while any menu / modal / level-up screen is showing. */
export function isWorldPaused(): boolean {
  const s = useUiStore.getState();
  return s.screen !== 'game' || s.modal !== null || s.levelUpQueue.length > 0;
}
