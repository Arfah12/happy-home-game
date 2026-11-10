import { memo } from 'react';
import { FIXTURES, GARDEN_PLANTS, STATIONS } from '../../game/config/layout';
import { useGameStore } from '../../game/store/gameStore';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl, Disc } from '../primitives';
import { PottedPlant, Rug } from '../props/Common';
import { Twinkles } from '../props/Effects';

/* ───────────────────────── Children's room ───────────────────────── */

function KidsRoomImpl() {
  const [bx, bz] = FIXTURES.kidsBed.pos;
  const [tx, tz] = FIXTURES.toyBox.pos;
  const toysCarried = useGameStore((s) => s.cycle.toysCarried.length);
  const stored = useGameStore((s) => s.cycle.toysStored.length);
  const onBox = clickInteract('toybox');
  return (
    <group>
      <group position={[bx, 0, bz]}>
        <Block size={[1.9, 0.3, 1.9]} position={[0, 0.18, 0]} color="#bde0ff" radius={0.1} />
        <Block size={[1.8, 0.2, 1.8]} position={[0, 0.4, 0]} color="#fff3a3" radius={0.08} />
        <Block size={[0.6, 0.15, 0.4]} position={[0.5, 0.56, 0]} rotation={[0, Math.PI / 2, 0]} color="#ffffff" radius={0.07} />
        <Block size={[0.14, 0.9, 1.95]} position={[0.95, 0.5, 0]} color="#ff9fb8" radius={0.07} />
        {/* star blanket */}
        <Ball r={0.12} position={[-0.3, 0.52, 0.3]} color="#ffd166" scale={[1, 0.3, 1]} cast={false} />
      </group>
      <group position={[tx, 0, tz]} onClick={onBox}>
        <Block size={[1.0, 0.55, 1.1]} position={[0, 0.28, 0]} color="#ffd166" radius={0.08} />
        <Block size={[1.05, 0.12, 1.15]} position={[0, 0.6, 0]} color="#ef476f" radius={0.05} />
        <Ball r={0.07} position={[-0.52, 0.4, 0]} color="#06d6a0" cast={false} />
        {stored > 0 && <Ball r={0.13} position={[0.1, 0.72, 0.1]} color="#06d6a0" />}
      </group>
      {toysCarried > 0 && <Twinkles position={[STATIONS.toyBox.x, 0.4, STATIONS.toyBox.z]} radius={0.4} />}
      <Rug position={[13.4, 0, 3.6]} r={1.4} color="#bde0ff" accent="#fff3a3" />
      {/* wall stars */}
      {[0.8, 1.6, 4.4, 5.2].map((z, i) => (
        <Ball key={z} r={0.14} position={[16.84, 1.2 + (i % 2) * 0.25, z]} color={i % 2 ? '#ffd166' : '#ff9fb8'} scale={[0.3, 1, 1]} cast={false} />
      ))}
    </group>
  );
}

export const KidsRoom = memo(KidsRoomImpl);

/* ───────────────────────── Sunroom (larger house) ─────────────────── */

function SunroomImpl() {
  const [lx, lz] = FIXTURES.sunLounge.pos;
  return (
    <group>
      <group position={[lx, 0, lz]}>
        <Block size={[2.2, 0.4, 1.0]} position={[0, 0.25, 0]} color="#ffe08a" radius={0.12} />
        <Block size={[2.2, 0.6, 0.25]} position={[0, 0.65, -0.38]} color="#ffe08a" radius={0.1} />
        <Block size={[0.6, 0.14, 0.4]} position={[-0.7, 0.55, 0]} color="#ffffff" radius={0.06} />
        <Block size={[0.6, 0.14, 0.4]} position={[0.7, 0.55, 0]} color="#bfeee0" radius={0.06} />
      </group>
      <PottedPlant position={[11, 0, -7.3]} scale={1.3} leaf="#5bbf6e" />
      <PottedPlant position={[16.3, 0, -7.3]} scale={1.1} pot="#ffd166" />
      <PottedPlant position={[16.3, 0, -1]} scale={0.9} pot="#bde0ff" />
      <Rug position={[13.5, 0, -4]} r={1.6} color="#fff3a3" accent="#ffffff" scale={[1.2, 0.9]} />
      {/* skylight glow */}
      <Disc r={1.4} position={[13.5, 0.02, -4]} color="#fffbe6" m={{ opacity: 0.35, emissive: '#fff2c0', emissiveIntensity: 0.4 }} />
    </group>
  );
}

export const Sunroom = memo(SunroomImpl);

/* ───────────────────────── Garden ────────────────────────────────── */

function GardenPlant({ id, x, z, color, watered }: { id: string; x: number; z: number; color: string; watered: boolean }) {
  const onClick = clickInteract(`plant_${id}`);
  const s = watered ? 1.15 : 0.8;
  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <Cyl r={0.7} h={0.18} position={[0, 0.09, 0]} color="#b98b63" />
      <Disc r={0.62} position={[0, 0.185, 0]} color={watered ? '#7a5235' : '#a17a57'} />
      <group scale={s}>
        <Ball r={0.42} position={[0, 0.55, 0]} color={watered ? '#5fc46f' : '#a6c27a'} />
        <Ball r={0.3} position={[0.32, 0.45, 0.1]} color={watered ? '#6fd17c' : '#b2c986'} />
        <Ball r={0.3} position={[-0.32, 0.47, -0.1]} color={watered ? '#6fd17c' : '#b2c986'} />
        {watered &&
          [0, 1, 2, 3, 4].map((i) => (
            <Ball key={i} r={0.1} position={[Math.cos(i * 1.26) * 0.38, 0.75 + (i % 2) * 0.1, Math.sin(i * 1.26) * 0.3]} color={color} />
          ))}
      </group>
      {watered && <Twinkles position={[0, 0.4, 0]} count={4} radius={0.6} color="#bfe6ff" />}
    </group>
  );
}

function GardenImpl() {
  const watered = useGameStore((s) => s.cycle.plantsWatered);
  const equipped = useGameStore((s) => s.equipped);
  const [tx, tz] = FIXTURES.gardenTap.pos;
  const onTap = clickInteract('tap');
  return (
    <group>
      {GARDEN_PLANTS.map((p) => (
        <GardenPlant key={p.id} {...p} watered={watered.includes(p.id)} />
      ))}
      {/* tap + bucket + watering can */}
      <group position={[tx, 0, tz]} onClick={onTap}>
        <Cyl r={0.08} h={0.8} position={[0, 0.4, 0]} color="#a7b1c2" m={{ metal: 0.5, rough: 0.3 }} />
        <Cyl r={0.05} h={0.25} position={[0.1, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} color="#a7b1c2" />
        <Ball r={0.07} position={[0, 0.85, 0]} color="#ff7eb6" />
        <Cyl r={0.2} h={0.28} topRatio={1.15} position={[0.25, 0.14, 0.2]} color="#8bc6ff" />
        {equipped !== 'can' && (
          <group position={[0.3, 0, -0.25]}>
            <Cyl r={0.15} h={0.26} position={[0, 0.13, 0]} color="#7ee0b0" />
            <Cyl r={0.025} h={0.3} position={[0.18, 0.2, 0]} rotation={[0, 0, -0.9]} color="#7ee0b0" />
          </group>
        )}
      </group>
      {/* decorative flower borders along the fence */}
      {Array.from({ length: 18 }, (_, i) => -9 + i * 1.5).map((x, i) => (
        <group key={x} position={[x, 0, 14.5]}>
          <Ball r={0.22} position={[0, 0.2, 0]} color="#8fd18a" low />
          <Ball r={0.08} position={[0.06, 0.4, 0.05]} color={['#ff7eb6', '#ffd54f', '#b28dff', '#ff8f6b'][i % 4]} low cast={false} />
        </group>
      ))}
      {/* stepping stones */}
      {[[-2, 10.5], [-0.5, 11.2], [8, 10.6], [9.5, 11.3]].map(([x, z]) => (
        <Cyl key={`${x}-${z}`} r={0.35} h={0.04} position={[x, 0.02, z]} color="#f1e4d3" cast={false} receive />
      ))}
    </group>
  );
}

export const Garden = memo(GardenImpl);
