import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { npcPlan, type NpcId, type Spot } from '../game/logic/family';
import { useGameStore } from '../game/store/gameStore';
import { isWorldPaused } from '../game/store/uiStore';
import type { SaveData } from '../game/types';
import { ABANG_LOOK, ADIK_LOOK, Person, type AnimSource, type Look } from './Character';
import { Ball, Block } from './primitives';

/* ───────────── Walking graph (door-to-door waypoints, NPCs don't collide) ───────────── */

type Pt = [number, number];

const NODES: Record<string, Pt> = {
  play: [7.4, -5.0],
  livMid: [3.0, -4.2],
  livDoorW: [-1.2, -4.2],
  kitDoor: [-2.9, -4.2],
  kitMid: [-4.3, -4.6],
  kitS: [-6.0, -5.0],
  kitW: [-8.1, -4.3],
  seatAdik: [-5.05, -3.85],
  seatAbang: [-6.95, -3.85],
  sofa: [4.3, -6.95],
  eastDoor: [9.3, -4.4],
  outside: [11.9, -4.4],
  hall: [6.4, -0.9],
  bedroom: [6.4, 1.3],
  bedW: [6.6, 6.5],
  bedS: [8.8, 7.0],
  kidsDoor: [11.5, 7.0],
  kidsPlay: [13.0, 4.6],
};

const EDGES: [string, string][] = [
  ['play', 'livMid'], ['livMid', 'livDoorW'], ['livDoorW', 'kitDoor'], ['kitDoor', 'kitMid'], ['kitMid', 'seatAdik'],
  ['kitMid', 'kitS'], ['kitS', 'kitW'], ['kitW', 'seatAbang'], ['livMid', 'sofa'], ['play', 'sofa'],
  ['play', 'eastDoor'], ['eastDoor', 'outside'], ['livMid', 'hall'], ['play', 'hall'], ['hall', 'bedroom'],
  ['bedroom', 'bedW'], ['bedW', 'bedS'], ['bedS', 'kidsDoor'], ['kidsDoor', 'kidsPlay'],
];

const ADJ: Record<string, string[]> = {};
for (const [a, b] of EDGES) {
  (ADJ[a] ??= []).push(b);
  (ADJ[b] ??= []).push(a);
}

function nearestNode(x: number, z: number): string {
  let best = 'livMid';
  let bd = Infinity;
  for (const [k, [nx, nz]] of Object.entries(NODES)) {
    const d = Math.hypot(nx - x, nz - z);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

function route(from: string, to: string): string[] {
  const prev: Record<string, string | null> = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const n = queue.shift() as string;
    if (n === to) break;
    for (const m of ADJ[n] ?? []) {
      if (!(m in prev)) {
        prev[m] = n;
        queue.push(m);
      }
    }
  }
  if (!(to in prev)) return [to];
  const path: string[] = [];
  for (let n: string | null = to; n; n = prev[n]) path.unshift(n);
  return path;
}

const TABLE_CENTER: Pt = [-6, -3.3];

interface Target {
  node: string;
  /** Hide once arrived (gone to work / school / bed). */
  hide: boolean;
  yaw?: number;
}

function targetFor(who: NpcId, spot: Spot, s: SaveData): Target {
  const kidsRoom = s.level >= 8;
  switch (spot) {
    case 'table': {
      const node = who === 'adik' ? 'seatAdik' : 'seatAbang';
      const [x, z] = NODES[node];
      return { node, hide: false, yaw: Math.atan2(TABLE_CENTER[0] - x, TABLE_CENTER[1] - z) };
    }
    case 'sofa':
      return { node: 'sofa', hide: false, yaw: 0 };
    case 'away':
      return { node: 'outside', hide: true };
    case 'bed':
      return { node: who === 'adik' && kidsRoom ? 'kidsPlay' : 'bedroom', hide: true };
    default:
      return kidsRoom && who === 'adik' ? { node: 'kidsPlay', hide: false, yaw: 0.6 } : { node: 'play', hide: false, yaw: -0.5 };
  }
}

/* ───────────── NPC ───────────── */

interface NpcState extends AnimSource {
  x: number;
  z: number;
  yaw: number;
  path: Pt[];
  targetKey: string;
  visible: boolean;
}

function Npc({ who, look, speed }: { who: NpcId; look: Look; speed: number }) {
  const group = useRef<THREE.Group>(null);
  const st = useRef<NpcState>({ x: 0, z: 0, yaw: 0, anim: 'idle', speed: 0, path: [], targetKey: '', visible: false });

  // Start already in place (no walking in from nowhere when the game loads).
  useEffect(() => {
    const s = useGameStore.getState();
    const plan = npcPlan(s)[who];
    const t = targetFor(who, plan.spot, s);
    const [x, z] = NODES[t.node];
    Object.assign(st.current, { x, z, yaw: t.yaw ?? 0, path: [], targetKey: `${plan.spot}|${t.node}`, visible: !t.hide, anim: plan.anim });
  }, [who]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const n = st.current;
    const s = useGameStore.getState();
    const plan = npcPlan(s)[who];
    const target = targetFor(who, plan.spot, s);
    const key = `${plan.spot}|${target.node}`;

    if (key !== n.targetKey) {
      n.targetKey = key;
      const from = nearestNode(n.x, n.z);
      n.path = route(from, target.node).map((k) => NODES[k]);
      // If hidden (coming back from outside / bed), appear at the start of the route.
      if (!n.visible) {
        const start = NODES[from];
        n.x = start[0];
        n.z = start[1];
        n.visible = true;
      }
    }

    const paused = isWorldPaused();
    if (n.path.length && !paused) {
      const [tx, tz] = n.path[0];
      const dx = tx - n.x;
      const dz = tz - n.z;
      const d = Math.hypot(dx, dz);
      const step = speed * dt;
      if (d <= step) {
        n.x = tx;
        n.z = tz;
        n.path.shift();
      } else {
        n.x += (dx / d) * step;
        n.z += (dz / d) * step;
        const want = Math.atan2(dx, dz);
        let diff = want - n.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        n.yaw += diff * (1 - Math.exp(-12 * dt));
      }
      n.anim = 'walk';
      n.speed = speed;
    } else if (!n.path.length) {
      n.anim = plan.anim;
      n.speed = 0;
      if (target.yaw !== undefined) {
        let diff = target.yaw - n.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        n.yaw += diff * (1 - Math.exp(-8 * dt));
      }
      if (target.hide) n.visible = false;
    }

    if (group.current) {
      group.current.visible = n.visible;
      group.current.position.set(n.x, 0, n.z);
      group.current.rotation.y = n.yaw;
    }
  });

  return (
    <group ref={group} visible={false}>
      <Person look={look} src={st.current} />
      {who === 'adik' && <PlayToys src={st.current} />}
    </group>
  );
}

/** A couple of toys next to Adik while she plays on the floor. */
function PlayToys({ src }: { src: AnimSource }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = src.anim === 'floor';
  });
  return (
    <group ref={ref} visible={false}>
      <Ball r={0.11} position={[0.25, 0.11, 0.35]} color="#ef476f" />
      <Block size={[0.16, 0.16, 0.16]} position={[-0.25, 0.08, 0.35]} rotation={[0, 0.5, 0]} color="#06d6a0" radius={0.03} />
      <Block size={[0.12, 0.12, 0.12]} position={[-0.22, 0.22, 0.36]} rotation={[0, 0.2, 0]} color="#ffd166" radius={0.03} />
    </group>
  );
}

export function Family() {
  return (
    <>
      <Npc who="adik" look={ADIK_LOOK} speed={2.8} />
      <Npc who="abang" look={ABANG_LOOK} speed={2.4} />
    </>
  );
}
