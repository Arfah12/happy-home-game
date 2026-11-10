import { FURNITURE_BY_ID } from '../config/furniture';
import { ROOMS, STATIONS, type Rect } from '../config/layout';
import type { PlacedItem, RoomId } from '../types';
import { STATIC_COLLIDERS, footprintRect, rectsOverlap } from './collision';

export const GRID = 0.25;

export const snap = (v: number) => Math.round(v / GRID) * GRID;

const STATION_POINTS = Object.values(STATIONS);

function insideAnyRoom(r: Rect, rooms: RoomId[]): boolean {
  return rooms.some((id) => {
    const room = ROOMS[id].rect;
    return r[0] >= room[0] + 0.12 && r[2] <= room[2] - 0.12 && r[1] >= room[1] + 0.12 && r[3] <= room[3] - 0.12;
  });
}

/**
 * A spot is valid when the footprint is fully inside one unlocked room,
 * does not intersect walls / fixtures / other furniture and leaves every
 * activity station reachable.
 */
export function validatePlacement(
  itemId: string,
  x: number,
  z: number,
  rot: number,
  rooms: RoomId[],
  placed: PlacedItem[],
  excludeUid?: string,
): boolean {
  const item = FURNITURE_BY_ID[itemId];
  if (!item) return false;
  const r = footprintRect(itemId, x, z, rot);
  if (!insideAnyRoom(r, rooms)) return false;
  for (const c of STATIC_COLLIDERS) if (rectsOverlap(r, c)) return false;
  for (const p of STATION_POINTS) {
    const grown: Rect = [r[0] - 0.45, r[1] - 0.45, r[2] + 0.45, r[3] + 0.45];
    if (p.x > grown[0] && p.x < grown[2] && p.z > grown[1] && p.z < grown[3]) return false;
  }
  for (const p of placed) {
    if (p.uid === excludeUid) continue;
    const other = FURNITURE_BY_ID[p.itemId];
    // Rugs may sit under (or have things on top of) other furniture.
    if (!other || !other.collide || !item.collide) continue;
    if (rectsOverlap(r, footprintRect(p.itemId, p.x, p.z, p.rot))) return false;
  }
  return true;
}
