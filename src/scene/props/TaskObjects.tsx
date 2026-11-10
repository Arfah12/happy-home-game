import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import { CLOTHES_PILES, DIRT_SPOTS, DUST_SPOTS, TOYS } from '../../game/config/layout';
import { useGameStore } from '../../game/store/gameStore';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl, Disc } from '../primitives';
import { Twinkles } from './Effects';

/* ───────────── Stains: fade out while being scrubbed, sparkle when clean ───────────── */

function Stain({ id, x, z, r, cleaned }: { id: string; x: number; z: number; r: number; cleaned: boolean }) {
  const onClick = clickInteract(`dirt_${id}`);
  if (cleaned) return <Twinkles position={[x, 0, z]} count={5} radius={r} />;
  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <Disc r={r} position={[0, 0.02, 0]} color="#9b7653" m={{ opacity: 0.75 }} scale={[1, 0.8]} />
      <Disc r={r * 0.55} position={[r * 0.55, 0.021, r * 0.2]} color="#8a6646" m={{ opacity: 0.75 }} />
      <Disc r={r * 0.4} position={[-r * 0.5, 0.022, -r * 0.35]} color="#8a6646" m={{ opacity: 0.75 }} />
      <Disc r={r * 0.22} position={[r * 0.1, 0.023, -r * 0.6]} color="#7a5a3c" m={{ opacity: 0.8 }} />
    </group>
  );
}

function StainsImpl() {
  const cleaned = useGameStore((s) => s.cycle.dirtCleaned);
  const done = useGameStore((s) => s.completedTasks.includes('clean_living'));
  if (done) return null;
  return (
    <group>
      {DIRT_SPOTS.map((d) => (
        <Stain key={d.id} {...d} cleaned={cleaned.includes(d.id)} />
      ))}
    </group>
  );
}
export const Stains = memo(StainsImpl);

/* ───────────── Dust bunnies: little fuzzballs with eyes ───────────── */

function DustBunny({ x, z, i }: { x: number; z: number; i: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + i;
    ref.current.position.y = Math.abs(Math.sin(t * 2.2)) * 0.06;
    ref.current.rotation.y = Math.sin(t * 0.7) * 0.6;
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={ref}>
        <Ball r={0.17} position={[0, 0.15, 0]} color="#b9b3c4" />
        <Ball r={0.1} position={[0.13, 0.12, 0.05]} color="#c9c3d4" low />
        <Ball r={0.09} position={[-0.12, 0.13, -0.04]} color="#c9c3d4" low />
        <Ball r={0.03} position={[0.06, 0.2, 0.15]} color="#2f2b3a" low cast={false} />
        <Ball r={0.03} position={[-0.06, 0.2, 0.15]} color="#2f2b3a" low cast={false} />
      </group>
      <Disc r={0.2} position={[0, 0.012, 0]} color="#a39cae" m={{ opacity: 0.35 }} />
    </group>
  );
}

function DustImpl() {
  const collected = useGameStore((s) => s.cycle.dustCollected);
  const done = useGameStore((s) => s.completedTasks.includes('vacuum_floor'));
  if (done) return null;
  return (
    <group>
      {DUST_SPOTS.filter((d) => !collected.includes(d.id)).map((d, i) => (
        <DustBunny key={d.id} x={d.x} z={d.z} i={i} />
      ))}
    </group>
  );
}
export const DustBunnies = memo(DustImpl);

/* ───────────── Dirty clothes piles ───────────── */

function ClothesImpl() {
  const level = useGameStore((s) => s.level);
  const collected = useGameStore((s) => s.cycle.clothesCollected);
  const washer = useGameStore((s) => s.cycle.washer);
  const done = useGameStore((s) => s.completedTasks.includes('do_laundry'));
  if (level < 2 || done || washer !== 'empty') return null;
  return (
    <group>
      {CLOTHES_PILES.filter((c) => !collected.includes(c.id)).map((c) => (
        <group key={c.id} position={[c.x, 0, c.z]} onClick={clickInteract(`clothes_${c.id}`)}>
          <Ball r={0.3} position={[0, 0.1, 0]} color={c.color} scale={[1.2, 0.4, 1]} />
          <Ball r={0.22} position={[0.15, 0.2, 0.08]} color="#ffffff" scale={[1.1, 0.45, 0.8]} />
          <Block size={[0.32, 0.06, 0.22]} position={[-0.15, 0.25, -0.05]} rotation={[0, 0.6, 0.15]} color="#ff9f80" radius={0.02} />
          {/* stink lines */}
          <Cyl r={0.012} h={0.25} position={[0.05, 0.48, 0]} rotation={[0, 0, 0.3]} color="#c3d18a" cast={false} />
          <Cyl r={0.012} h={0.2} position={[-0.08, 0.46, 0]} rotation={[0, 0, -0.3]} color="#c3d18a" cast={false} />
        </group>
      ))}
    </group>
  );
}
export const ClothesPiles = memo(ClothesImpl);

/* ───────────── Toys in the children's room ───────────── */

function Toy({ kind, color }: { kind: (typeof TOYS)[number]['kind']; color: string }) {
  switch (kind) {
    case 'ball':
      return <Ball r={0.18} position={[0, 0.18, 0]} color={color} />;
    case 'block':
      return (
        <group>
          <Block size={[0.28, 0.28, 0.28]} position={[0, 0.14, 0]} color={color} radius={0.04} />
          <Block size={[0.22, 0.22, 0.22]} position={[0.05, 0.39, 0]} rotation={[0, 0.5, 0]} color="#ffd166" radius={0.04} />
        </group>
      );
    case 'bear':
      return (
        <group>
          <Ball r={0.17} position={[0, 0.17, 0]} color={color} />
          <Ball r={0.12} position={[0, 0.4, 0.02]} color={color} />
          <Ball r={0.05} position={[0.09, 0.5, 0]} color={color} low />
          <Ball r={0.05} position={[-0.09, 0.5, 0]} color={color} low />
          <Ball r={0.04} position={[0, 0.38, 0.12]} color="#f5deb3" low cast={false} />
        </group>
      );
    case 'duck':
      return (
        <group>
          <Ball r={0.16} position={[0, 0.14, 0]} color={color} scale={[1.2, 0.9, 1]} />
          <Ball r={0.1} position={[0.1, 0.3, 0]} color={color} />
          <Cyl r={0.04} h={0.08} position={[0.2, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} color="#ff9f43" />
        </group>
      );
  }
}

function ToysImpl() {
  const level = useGameStore((s) => s.level);
  const carried = useGameStore((s) => s.cycle.toysCarried);
  const stored = useGameStore((s) => s.cycle.toysStored);
  if (level < 8) return null;
  return (
    <group>
      {TOYS.filter((t) => !carried.includes(t.id) && !stored.includes(t.id)).map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]} onClick={clickInteract(`toy_${t.id}`)}>
          <Toy kind={t.kind} color={t.color} />
        </group>
      ))}
    </group>
  );
}
export const Toys = memo(ToysImpl);

export { Toy };
