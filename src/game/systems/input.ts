/**
 * Shared, mutable input state. Read every frame by the Player – kept outside
 * React so that key presses and joystick drags never cause re-renders.
 */
export interface MoveTarget {
  x: number;
  z: number;
  /** Interactable to trigger once the player arrives. */
  interactId?: string;
}

export const input = {
  keys: new Set<string>(),
  joy: { x: 0, y: 0 },
  interactQueued: false,
  rotateQueued: false,
  moveTarget: null as MoveTarget | null,
};

const UP = ['KeyW', 'ArrowUp'];
const DOWN = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const MOVE_KEYS = new Set([...UP, ...DOWN, ...LEFT, ...RIGHT]);

/** Camera-relative move direction on the floor plane, magnitude 0..1. */
export function moveVector(): { x: number; z: number; mag: number } {
  let x = 0;
  let z = 0;
  const k = input.keys;
  if (UP.some((c) => k.has(c))) z -= 1;
  if (DOWN.some((c) => k.has(c))) z += 1;
  if (LEFT.some((c) => k.has(c))) x -= 1;
  if (RIGHT.some((c) => k.has(c))) x += 1;
  x += input.joy.x;
  z += input.joy.y;
  const mag = Math.hypot(x, z);
  if (mag < 0.12) return { x: 0, z: 0, mag: 0 };
  const m = Math.min(1, mag);
  return { x: (x / mag) * m, z: (z / mag) * m, mag: m };
}

function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export interface KeyboardHandlers {
  onEscape: () => void;
}

export function initKeyboard(handlers: KeyboardHandlers): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTyping(e)) return;
    if (MOVE_KEYS.has(e.code)) {
      input.keys.add(e.code);
      input.moveTarget = null; // keyboard overrides click-to-move
      e.preventDefault();
      return;
    }
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      input.interactQueued = true;
      e.preventDefault();
    } else if (e.code === 'KeyR') {
      input.rotateQueued = true;
    } else if (e.code === 'Escape') {
      handlers.onEscape();
    }
  };
  const up = (e: KeyboardEvent) => {
    input.keys.delete(e.code);
  };
  const blur = () => {
    input.keys.clear();
    input.joy.x = 0;
    input.joy.y = 0;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}

export function clearInput(): void {
  input.keys.clear();
  input.joy.x = 0;
  input.joy.y = 0;
  input.interactQueued = false;
  input.rotateQueued = false;
  input.moveTarget = null;
}
