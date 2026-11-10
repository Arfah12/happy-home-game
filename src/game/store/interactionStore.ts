import { create } from 'zustand';

export interface NearTarget {
  id: string;
  label: string;
  icon: string;
  disabledReason?: string;
}

export interface WorkSession {
  id: string;
  label: string;
  duration: number;
  elapsed: number;
}

interface InteractionState {
  near: NearTarget | null;
  work: WorkSession | null;
  setNear: (n: NearTarget | null) => void;
  setWork: (w: WorkSession | null) => void;
}

export const useInteractionStore = create<InteractionState>()((set, get) => ({
  near: null,
  work: null,
  setNear: (n) => {
    const cur = get().near;
    if (
      cur?.id === n?.id &&
      cur?.label === n?.label &&
      cur?.disabledReason === n?.disabledReason &&
      cur?.icon === n?.icon
    )
      return;
    set({ near: n });
  },
  setWork: (work) => set({ work }),
}));
