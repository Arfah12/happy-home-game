import { PLAYER_SPAWN } from '../config/layout';
import type { AnimState } from '../types';

/**
 * The live player transform. Mutated every frame by the Player component and
 * read by the camera, character animation and interaction system.
 */
export const player = {
  x: PLAYER_SPAWN.x,
  z: PLAYER_SPAWN.z,
  yaw: 0,
  speed: 0,
  anim: 'idle' as AnimState,
  carrying: false,
  /** performance.now() until which the short "interact" gesture plays. */
  gestureUntil: 0,
};

export function teleportPlayer(x: number, z: number): void {
  player.x = x;
  player.z = z;
  player.speed = 0;
}

export function playGesture(ms = 450): void {
  player.gestureUntil = performance.now() + ms;
}
