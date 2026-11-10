import type { ThreeEvent } from '@react-three/fiber';
import { getInteractable, isInRange, triggerInteract } from '../game/systems/interactions';
import { input } from '../game/systems/input';
import { isWorldPaused, useUiStore } from '../game/store/uiStore';

/**
 * Mouse / tap on a 3D object: interact when in range, otherwise walk there
 * and interact on arrival.
 */
export function clickInteract(id: string) {
  return (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return; // it was a drag, not a click
    e.stopPropagation();
    if (isWorldPaused() || useUiStore.getState().placement) return;
    const it = getInteractable(id);
    if (!it) return;
    if (isInRange(id)) triggerInteract(id);
    else input.moveTarget = { x: it.x, z: it.z, interactId: id };
  };
}

/** Clicking empty floor walks the player there. */
export function clickFloor(e: ThreeEvent<MouseEvent>): void {
  if (e.delta > 8) return;
  if (isWorldPaused()) return;
  if (useUiStore.getState().placement) return; // placement handles its own clicks
  input.moveTarget = { x: e.point.x, z: e.point.z };
}
