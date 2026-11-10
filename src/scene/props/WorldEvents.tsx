import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { EVENT_SPOTS } from '../../game/config/layout';
import { useGameStore } from '../../game/store/gameStore';
import { player } from '../../game/systems/playerState';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl } from '../primitives';
import { Puffs } from './Effects';

const ORANGE = '#f4a340';
const STRIPE = '#d9822b';

/** Oyen – the neighbour's chubby orange cat. */
function Oyen({ lying }: { lying: boolean }) {
  const tail = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2.2) * 0.45;
    if (body.current) body.current.scale.y = 1 + Math.sin(t * (lying ? 2.5 : 1.6)) * 0.03;
  });
  return (
    <group ref={body} rotation={[0, lying ? 0.6 : -0.4, 0]}>
      {/* body */}
      <Ball r={0.22} position={[0, lying ? 0.14 : 0.2, 0]} color={ORANGE} scale={lying ? [1.5, 0.6, 0.9] : [1, 1.05, 1.2]} />
      {[-0.08, 0, 0.08].map((z) => (
        <Block key={z} size={[0.05, 0.03, 0.2]} position={[0, lying ? 0.27 : 0.4, z]} rotation={[0, Math.PI / 2, 0]} color={STRIPE} radius={0.01} cast={false} />
      ))}
      {/* head */}
      <group position={lying ? [0.3, 0.2, 0] : [0, 0.48, 0.14]}>
        <Ball r={0.16} color={ORANGE} />
        <Cyl r={0.06} h={0.12} topRatio={0.05} position={[-0.09, 0.15, 0]} color={ORANGE} />
        <Cyl r={0.06} h={0.12} topRatio={0.05} position={[0.09, 0.15, 0]} color={ORANGE} />
        <Ball r={0.03} position={[-0.06, 0.03, 0.14]} color="#2f2b3a" low cast={false} scale={[1, lying ? 0.25 : 1.2, 1]} />
        <Ball r={0.03} position={[0.06, 0.03, 0.14]} color="#2f2b3a" low cast={false} scale={[1, lying ? 0.25 : 1.2, 1]} />
        <Ball r={0.02} position={[0, -0.02, 0.155]} color="#ff8fa3" low cast={false} />
        <Ball r={0.06} position={[0, -0.05, 0.11]} color="#fff2e0" low cast={false} scale={[1.3, 0.7, 0.8]} />
      </group>
      {/* tail */}
      <group ref={tail} position={[lying ? -0.3 : 0, lying ? 0.12 : 0.1, lying ? 0 : -0.22]}>
        <Cyl r={0.035} h={0.38} position={[0, 0.17, -0.05]} rotation={[-0.5, 0, 0]} color={ORANGE} />
        <Ball r={0.04} position={[0, 0.34, -0.14]} color={STRIPE} low />
      </group>
      {!lying &&
        [-0.08, 0.08].map((x) => <Ball key={x} r={0.05} position={[x, 0.04, 0.18]} color="#fff2e0" low />)}
    </group>
  );
}

function Poop() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.4;
  });
  const onClick = clickInteract('poop');
  return (
    <group position={[EVENT_SPOTS.poop.x, 0, EVENT_SPOTS.poop.z]} onClick={onClick}>
      <group ref={ref}>
        <Ball r={0.16} position={[0, 0.07, 0]} color="#8a5a34" scale={[1, 0.55, 1]} />
        <Ball r={0.11} position={[0.01, 0.16, 0]} color="#7a4e2c" scale={[1, 0.6, 1]} />
        <Ball r={0.07} position={[0, 0.23, 0]} color="#8a5a34" scale={[1, 0.7, 1]} />
        <Cyl r={0.03} h={0.06} topRatio={0.1} position={[0, 0.29, 0]} color="#7a4e2c" />
      </group>
      {/* stink */}
      <Puffs active position={[0, 0.25, 0]} color="#c8d98a" count={4} spread={0.15} rise={0.7} size={0.06} />
    </group>
  );
}

function HiddenBox() {
  const ears = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ears.current) ears.current.position.y = 0.52 + Math.max(0, Math.sin(clock.elapsedTime * 1.3)) * 0.06;
  });
  return (
    <group position={[EVENT_SPOTS.cat.x, 0, EVENT_SPOTS.cat.z]} rotation={[0, 0.3, 0]}>
      <Block size={[0.6, 0.5, 0.5]} position={[0, 0.25, 0]} color="#d1a36a" radius={0.02} />
      <Block size={[0.6, 0.02, 0.25]} position={[0, 0.52, -0.33]} rotation={[0.9, 0, 0]} color="#c4955c" radius={0} />
      <Block size={[0.64, 0.05, 0.04]} position={[0, 0.47, 0.26]} color="#e8d2a8" radius={0} cast={false} />
      <group ref={ears}>
        <Cyl r={0.05} h={0.1} topRatio={0.05} position={[-0.08, 0, 0]} color={ORANGE} />
        <Cyl r={0.05} h={0.1} topRatio={0.05} position={[0.08, 0, 0]} color={ORANGE} />
        <Ball r={0.025} position={[-0.05, -0.06, 0.12]} color="#2f2b3a" low cast={false} />
        <Ball r={0.025} position={[0.05, -0.06, 0.12]} color="#2f2b3a" low cast={false} />
      </group>
    </group>
  );
}

function Tupperware() {
  const onClick = clickInteract('food');
  return (
    <group position={[-6.0, 0.79, -2.75]} onClick={onClick}>
      <Block size={[0.42, 0.16, 0.3]} position={[0, 0.08, 0]} color="#7fc4f5" m={{ opacity: 0.85 }} radius={0.05} />
      <Block size={[0.44, 0.04, 0.32]} position={[0, 0.18, 0]} color="#3e8ed0" radius={0.02} />
      <Block size={[0.34, 0.08, 0.22]} position={[0, 0.07, 0]} color="#7a3b1e" radius={0.03} cast={false} />
      <Puffs active position={[0, 0.2, 0]} count={3} spread={0.1} rise={0.4} size={0.05} />
    </group>
  );
}

function Parcel() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.04;
  });
  const onClick = clickInteract('parcel');
  return (
    <group position={[EVENT_SPOTS.parcel.x, 0, EVENT_SPOTS.parcel.z]} onClick={onClick}>
      <group ref={ref} rotation={[0, 0.4, 0]}>
        <Block size={[0.55, 0.4, 0.45]} position={[0, 0.2, 0]} color="#d1a36a" radius={0.02} />
        <Block size={[0.57, 0.06, 0.12]} position={[0, 0.4, 0]} color="#ffd166" radius={0} cast={false} />
        <Block size={[0.12, 0.06, 0.47]} position={[0, 0.4, 0]} color="#ffd166" radius={0} cast={false} />
        <Block size={[0.2, 0.12, 0.01]} position={[0.1, 0.25, 0.23]} color="#ffffff" radius={0} cast={false} />
      </group>
    </group>
  );
}

/** Rain drops that follow the player around (cheap: one Points object). */
function Rain() {
  const COUNT = 700;
  const AREA = 26;
  const { geometry, speeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const sp = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * AREA;
      pos[i * 3 + 1] = Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * AREA;
      sp[i] = 9 + Math.random() * 5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry: g, speeds: sp };
  }, []);
  const material = useMemo(
    () => new THREE.PointsMaterial({ color: '#a9c8ff', size: 0.09, transparent: true, opacity: 0.75, depthWrite: false }),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const d = Math.min(dt, 0.05);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= speeds[i] * d;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] += 12;
    }
    attr.needsUpdate = true;
    if (group.current) group.current.position.set(player.x, 0, player.z);
  });
  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

function WorldEventsImpl() {
  const w = useGameStore((s) => s.world);
  return (
    <group>
      {w.poop && <Poop />}
      {(w.cat === 'visiting' || w.cat === 'pet') && (
        <group position={[EVENT_SPOTS.cat.x, 0, EVENT_SPOTS.cat.z]} onClick={clickInteract('cat')}>
          <Oyen lying={w.cat === 'pet'} />
        </group>
      )}
      {w.cat === 'hidden' && <HiddenBox />}
      {w.food && <Tupperware />}
      {w.parcel && <Parcel />}
      {w.rainLeft > 0 && <Rain />}
    </group>
  );
}

export const WorldEvents = memo(WorldEventsImpl);
