import type { RoomId } from '../types';

/** Axis-aligned rectangle on the floor plane: [minX, minZ, maxX, maxZ]. */
export type Rect = [number, number, number, number];

export interface RoomDef {
  id: RoomId;
  name: string;
  rect: Rect;
  floor: string;
  floorAlt: string;
  wall: string;
  pattern: 'tiles' | 'planks' | 'grass' | 'carpet';
}

export const ROOMS: Record<RoomId, RoomDef> = {
  kitchen: { id: 'kitchen', name: 'Dapur', rect: [-10, -8, -2, 0], floor: '#fbeedd', floorAlt: '#f3dcc1', wall: '#ffe9c7', pattern: 'tiles' },
  living: { id: 'living', name: 'Ruang Tamu', rect: [-2, -8, 10, 0], floor: '#eccba5', floorAlt: '#e3bd93', wall: '#ffd6e3', pattern: 'planks' },
  bathroom: { id: 'bathroom', name: 'Bilik Air', rect: [-10, 0, -5, 8], floor: '#d8f1f6', floorAlt: '#c3e6ee', wall: '#cdeefa', pattern: 'tiles' },
  laundry: { id: 'laundry', name: 'Ruang Dobi', rect: [-5, 0, 1, 8], floor: '#ece4f8', floorAlt: '#dfd3f2', wall: '#e3d7ff', pattern: 'tiles' },
  bedroom: { id: 'bedroom', name: 'Bilik Tidur', rect: [1, 0, 10, 8], floor: '#f7dde4', floorAlt: '#f0cfd9', wall: '#ffd9e6', pattern: 'carpet' },
  kids: { id: 'kids', name: 'Bilik Anak', rect: [10, 0, 17, 8], floor: '#fff3c4', floorAlt: '#ffeaa3', wall: '#d6f5ff', pattern: 'carpet' },
  sunroom: { id: 'sunroom', name: 'Sunroom', rect: [10, -8, 17, 0], floor: '#e0f3d6', floorAlt: '#d1ebc4', wall: '#fff6d6', pattern: 'planks' },
  garden: { id: 'garden', name: 'Taman', rect: [-10, 8, 17, 15], floor: '#a8dc8f', floorAlt: '#9ad27f', wall: '#ffffff', pattern: 'grass' },
};

export const ROOM_ORDER: RoomId[] = ['kitchen', 'living', 'bathroom', 'laundry', 'bedroom', 'garden', 'kids', 'sunroom'];

export const WORLD_BOUNDS: Rect = [-10, -8, 17, 15];

export const WALL_THICKNESS = 0.24;

export interface WallDef {
  /** Fixed axis: 'x' means the wall runs along X at z = `at`. */
  axis: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  height: number;
  gaps: [number, number][];
  kind: 'exterior' | 'interior' | 'low' | 'fence';
}

export const WALLS: WallDef[] = [
  // Exterior back walls (tall – the camera looks over them from the south)
  { axis: 'x', at: -8, from: -10, to: 17, height: 2.7, gaps: [], kind: 'exterior' },
  { axis: 'z', at: -10, from: -8, to: 8, height: 2.7, gaps: [], kind: 'exterior' },
  { axis: 'z', at: 17, from: -8, to: 8, height: 2.7, gaps: [], kind: 'exterior' },
  // Front wall (kept low so it never hides the player)
  { axis: 'x', at: 8, from: -10, to: 17, height: 0.55, gaps: [[2.5, 4.5], [12.5, 14.5]], kind: 'low' },
  // Interior walls (dollhouse cut-away height)
  { axis: 'x', at: 0, from: -10, to: 17, height: 1.15, gaps: [[-8.6, -6.8], [-4.4, -2.7], [5.4, 7.4], [11.6, 13.6]], kind: 'interior' },
  { axis: 'z', at: -2, from: -8, to: 0, height: 1.15, gaps: [[-5.2, -3.2]], kind: 'interior' },
  { axis: 'z', at: -5, from: 0, to: 8, height: 1.15, gaps: [[3, 4.8]], kind: 'interior' },
  { axis: 'z', at: 1, from: 0, to: 8, height: 1.15, gaps: [[3, 4.8]], kind: 'interior' },
  { axis: 'z', at: 10, from: -8, to: 8, height: 1.15, gaps: [[-5.4, -3.4], [6.2, 7.8]], kind: 'interior' },
  // Garden fence
  { axis: 'x', at: 15, from: -10, to: 17, height: 0.7, gaps: [], kind: 'fence' },
  { axis: 'z', at: -10, from: 8, to: 15, height: 0.7, gaps: [], kind: 'fence' },
  { axis: 'z', at: 17, from: 8, to: 15, height: 0.7, gaps: [], kind: 'fence' },
];

/** Splits a wall into solid segments (between the door gaps). */
export function wallSegments(w: WallDef): [number, number][] {
  const gaps = [...w.gaps].sort((a, b) => a[0] - b[0]);
  const segs: [number, number][] = [];
  let cursor = w.from;
  for (const [g0, g1] of gaps) {
    if (g0 > cursor) segs.push([cursor, g0]);
    cursor = Math.max(cursor, g1);
  }
  if (cursor < w.to) segs.push([cursor, w.to]);
  return segs;
}

/** Fixed appliances / built-in furniture with their collision footprints. */
export const FIXTURES = {
  kitchenCounter: { rect: [-9.95, -7.95, -2.6, -6.95] as Rect },
  diningTable: { pos: [-6, -3.3] as [number, number], rect: [-7.0, -4.2, -5.0, -2.4] as Rect },
  sofa: { pos: [4, -7.25] as [number, number], rect: [2.3, -7.95, 5.7, -6.65] as Rect },
  livingLamp: { pos: [6.6, -7.3] as [number, number], rect: [6.3, -7.6, 6.9, -7.0] as Rect },
  livingPlant: { pos: [9.3, -7.3] as [number, number], rect: [8.95, -7.65, 9.65, -6.95] as Rect },
  toolRack: { rect: [-1.98, -2.4, -1.55, -0.6] as Rect },
  tub: { rect: [-9.95, 4.8, -8.5, 7.95] as Rect },
  toilet: { pos: [-6.1, 7.35] as [number, number], rect: [-6.5, 6.8, -5.7, 7.95] as Rect },
  bathSink: { pos: [-9.55, 1.9] as [number, number], rect: [-9.95, 1.2, -9.1, 2.6] as Rect },
  washer: { pos: [-3.6, 7.4] as [number, number], rect: [-4.1, 6.9, -3.1, 7.95] as Rect },
  dryer: { pos: [-2.4, 7.4] as [number, number], rect: [-2.9, 6.9, -1.9, 7.95] as Rect },
  laundryShelf: { pos: [-0.3, 7.6] as [number, number], rect: [-1.2, 7.25, 0.6, 7.95] as Rect },
  bed: { pos: [8.65, 4] as [number, number], rect: [7.3, 2.95, 9.98, 5.05] as Rect },
  nightstandBuiltIn: { pos: [9.6, 5.6] as [number, number], rect: [9.25, 5.25, 9.98, 5.95] as Rect },
  wardrobe: { pos: [2.2, 0.45] as [number, number], rect: [1.2, 0.05, 3.2, 0.85] as Rect },
  kidsBed: { pos: [16.0, 6.6] as [number, number], rect: [15.0, 5.6, 16.98, 7.6] as Rect },
  toyBox: { pos: [16.4, 3.0] as [number, number], rect: [15.85, 2.4, 16.98, 3.6] as Rect },
  gardenTap: { pos: [-9.4, 9.2] as [number, number], rect: [-9.8, 8.8, -9.0, 9.6] as Rect },
  sunLounge: { pos: [13.5, -7.2] as [number, number], rect: [12.4, -7.9, 14.6, -6.6] as Rect },
};

/** Interaction anchor points – where the player stands to use something. */
export const STATIONS = {
  stove: { x: -7.2, z: -6.2 },
  sink: { x: -5.3, z: -6.2 },
  toolMop: { x: -1.05, z: -1.95 },
  toolVacuum: { x: -1.05, z: -1.05 },
  washer: { x: -3.6, z: 6.3 },
  bed: { x: 6.75, z: 4.0 },
  toyBox: { x: 15.2, z: 3.0 },
  tap: { x: -8.6, z: 9.4 },
};

export const STOVE_POS = { x: -7.2, z: -7.45 };
export const SINK_POS = { x: -5.3, z: -7.45 };

/** Where random-event objects appear (all reachable from level 1, except the clothesline). */
export const EVENT_SPOTS = {
  poop: { x: 1.4, z: -1.2 },
  cat: { x: 0.5, z: -0.7 },
  food: { x: -6.0, z: -1.75 },
  parcel: { x: 6.4, z: -0.75 },
  ampaian: { x: -2.2, z: 1.4 },
};

export const DIRT_SPOTS = [
  { id: 'd1', x: 0.6, z: -5.4, r: 0.55 },
  { id: 'd2', x: 3.1, z: -2.6, r: 0.6 },
  { id: 'd3', x: 6.4, z: -4.6, r: 0.5 },
  { id: 'd4', x: 8.4, z: -5.9, r: 0.55 },
  { id: 'd5', x: 7.6, z: -1.6, r: 0.45 },
];

export const DUST_SPOTS = [
  { id: 'u1', x: -8.6, z: -1.4 },
  { id: 'u2', x: -3.4, z: -5.0 },
  { id: 'u3', x: -8.8, z: -5.2 },
  { id: 'u4', x: 0.8, z: -3.4 },
  { id: 'u5', x: 5.2, z: -1.0 },
  { id: 'u6', x: 9.1, z: -3.2 },
];

export const CLOTHES_PILES = [
  { id: 'c1', x: 8.8, z: -1.1, color: '#8ecdf2' },
  { id: 'c2', x: -6.4, z: 1.3, color: '#ffb3c9' },
  { id: 'c3', x: -0.6, z: 5.6, color: '#ffe08a' },
];

export const GARDEN_PLANTS = [
  { id: 'p1', x: -5.5, z: 13.2, color: '#ff7eb6' },
  { id: 'p2', x: 0.0, z: 13.4, color: '#ffd54f' },
  { id: 'p3', x: 6.0, z: 13.2, color: '#b28dff' },
  { id: 'p4', x: 12.0, z: 13.4, color: '#ff8f6b' },
];

export const TOYS = [
  { id: 't1', x: 12.4, z: 2.4, kind: 'ball' as const, color: '#ef476f' },
  { id: 't2', x: 14.8, z: 3.8, kind: 'block' as const, color: '#06d6a0' },
  { id: 't3', x: 12.9, z: 5.4, kind: 'bear' as const, color: '#c68b59' },
  { id: 't4', x: 15.9, z: 1.6, kind: 'duck' as const, color: '#ffd166' },
];

export const PLAYER_SPAWN = { x: 4, z: -3.5 };
export const PLAYER_RADIUS = 0.34;

export function rectContains(r: Rect, x: number, z: number, margin = 0): boolean {
  return x >= r[0] + margin && x <= r[2] - margin && z >= r[1] + margin && z <= r[3] - margin;
}

export function roomAt(x: number, z: number): RoomId | null {
  for (const id of ROOM_ORDER) {
    if (rectContains(ROOMS[id].rect, x, z)) return id;
  }
  return null;
}
