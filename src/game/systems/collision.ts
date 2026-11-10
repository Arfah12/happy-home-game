import { FURNITURE_BY_ID } from '../config/furniture';
import {
  FIXTURES,
  ROOMS,
  ROOM_ORDER,
  WALLS,
  WALL_THICKNESS,
  WORLD_BOUNDS,
  wallSegments,
  type Rect,
} from '../config/layout';
import type { PlacedItem, RoomId } from '../types';

const half = WALL_THICKNESS / 2;

/** Static colliders that never change: walls, fence and built-in fixtures. */
export const STATIC_COLLIDERS: Rect[] = (() => {
  const out: Rect[] = [];
  for (const w of WALLS) {
    for (const [a, b] of wallSegments(w)) {
      out.push(w.axis === 'x' ? [a, w.at - half, b, w.at + half] : [w.at - half, a, w.at + half, b]);
    }
  }
  for (const f of Object.values(FIXTURES)) out.push(f.rect);
  return out;
})();

/** Footprint of a piece of furniture after rotation (90° steps). */
export function footprintRect(itemId: string, x: number, z: number, rot: number): Rect {
  const item = FURNITURE_BY_ID[itemId];
  const [w, d] = item ? item.size : [1, 1];
  const quarter = Math.round(rot / (Math.PI / 2));
  const swap = Math.abs(quarter) % 2 === 1;
  const hw = (swap ? d : w) / 2;
  const hd = (swap ? w : d) / 2;
  return [x - hw, z - hd, x + hw, z + hd];
}

let cacheKey: { rooms: RoomId[]; placed: PlacedItem[] } | null = null;
let cached: Rect[] = STATIC_COLLIDERS;

/** All colliders for the current state – locked rooms act as solid blocks. */
export function getColliders(unlockedRooms: RoomId[], placed: PlacedItem[]): Rect[] {
  if (cacheKey && cacheKey.rooms === unlockedRooms && cacheKey.placed === placed) return cached;
  const list = [...STATIC_COLLIDERS];
  for (const id of ROOM_ORDER) {
    if (!unlockedRooms.includes(id)) list.push(ROOMS[id].rect);
  }
  for (const p of placed) {
    const item = FURNITURE_BY_ID[p.itemId];
    if (item?.collide) {
      const r = footprintRect(p.itemId, p.x, p.z, p.rot);
      // Slightly smaller than the visual so the player can hug furniture.
      list.push([r[0] + 0.08, r[1] + 0.08, r[2] - 0.08, r[3] - 0.08]);
    }
  }
  cacheKey = { rooms: unlockedRooms, placed };
  cached = list;
  return list;
}

/** Pushes a circle out of every rectangle it overlaps. */
export function resolveCircle(x: number, z: number, r: number, rects: Rect[]): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (let iter = 0; iter < 3; iter++) {
    let moved = false;
    for (const [x0, z0, x1, z1] of rects) {
      const cx = Math.max(x0, Math.min(px, x1));
      const cz = Math.max(z0, Math.min(pz, z1));
      const dx = px - cx;
      const dz = pz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        px = cx + (dx / d) * r;
        pz = cz + (dz / d) * r;
      } else {
        // Centre is inside the rect: push out along the shortest axis.
        const left = px - x0;
        const right = x1 - px;
        const top = pz - z0;
        const bottom = z1 - pz;
        const m = Math.min(left, right, top, bottom);
        if (m === left) px = x0 - r;
        else if (m === right) px = x1 + r;
        else if (m === top) pz = z0 - r;
        else pz = z1 + r;
      }
      moved = true;
    }
    if (!moved) break;
  }
  px = Math.max(WORLD_BOUNDS[0] + r, Math.min(WORLD_BOUNDS[2] - r, px));
  pz = Math.max(WORLD_BOUNDS[1] + r, Math.min(WORLD_BOUNDS[3] - r, pz));
  return { x: px, z: pz };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}
