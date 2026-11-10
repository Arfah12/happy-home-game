import { FURNITURE_BY_ID } from '../config/furniture';
import { sfx, toast } from '../events';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { validatePlacement } from './placement';

export function rotatePlacement(): void {
  const p = useUiStore.getState().placement;
  if (!p) return;
  useUiStore.getState().updatePlacement({ rot: (p.rot + Math.PI / 2) % (Math.PI * 2) });
  sfx('click');
}

export function confirmPlacement(): boolean {
  const ui = useUiStore.getState();
  const p = ui.placement;
  if (!p) return false;
  const g = useGameStore.getState();
  const ok = validatePlacement(p.itemId, p.x, p.z, p.rot, g.unlockedRooms, g.placed, p.uid);
  if (!ok) {
    toast('Tak muat situ – cuba tempat lain.', '🚫', 'warn');
    sfx('error');
    return false;
  }
  const name = FURNITURE_BY_ID[p.itemId]?.name ?? 'Perabot';
  if (p.uid) {
    g.movePlaced(p.uid, p.x, p.z, p.rot);
    toast(`${name} dah dialih!`, '✨', 'success');
  } else {
    if (!g.placeFromInventory(p.itemId, p.x, p.z, p.rot)) return false;
    toast(`${name} dah diletak!`, '🏡', 'success');
  }
  sfx('sparkle');
  ui.endPlacement();
  return true;
}

export function cancelPlacement(): void {
  useUiStore.getState().endPlacement();
  sfx('click');
}

/** Moves a placed item back to the inventory. */
export function storePlacement(): void {
  const ui = useUiStore.getState();
  const p = ui.placement;
  if (!p) return;
  if (p.uid) {
    useGameStore.getState().storePlaced(p.uid);
    toast(`${FURNITURE_BY_ID[p.itemId]?.name ?? 'Barang'} disimpan dalam inventori`, '📦');
  }
  ui.endPlacement();
  sfx('pop');
}
