import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import { FIXTURES } from '../../game/config/layout';
import { useGameStore } from '../../game/store/gameStore';
import { isWorldPaused } from '../../game/store/uiStore';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl } from '../primitives';
import { Puffs, Twinkles } from '../props/Effects';

function Washer({ state }: { state: string }) {
  const [x, z] = FIXTURES.washer.pos;
  const body = useRef<THREE.Group>(null);
  const drum = useRef<THREE.Group>(null);
  const washing = state === 'washing';
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const go = washing && !isWorldPaused();
    if (drum.current && go) drum.current.rotation.z += dt * 9;
    if (body.current) {
      body.current.position.x = go ? Math.sin(t * 38) * 0.012 : 0;
      body.current.rotation.z = go ? Math.sin(t * 23) * 0.012 : 0;
    }
  });
  const onClick = clickInteract('washer');
  const clothes = state === 'loaded' || state === 'washing';
  return (
    <group position={[x, 0, z]}>
      <group ref={body}>
        <Block size={[0.95, 1.05, 0.9]} position={[0, 0.53, 0]} color="#ffffff" radius={0.1} onClick={onClick} />
        <Block size={[0.95, 0.18, 0.06]} position={[0, 0.95, 0.43]} color="#e3d7ff" radius={0.04} cast={false} />
        <Ball r={0.04} position={[-0.3, 0.95, 0.47]} color={washing ? '#7ee081' : '#ff7eb6'} m={{ emissive: washing ? '#7ee081' : '#ff7eb6', emissiveIntensity: 0.8 }} cast={false} />
        <Cyl r={0.06} h={0.04} position={[0.25, 0.95, 0.47]} rotation={[Math.PI / 2, 0, 0]} color="#8f7aa8" cast={false} />
        {/* porthole */}
        <group position={[0, 0.45, 0.45]}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.3, 0.05, 10, 28]} />
            <meshStandardMaterial color="#cfd6e6" metalness={0.5} roughness={0.25} />
          </mesh>
          <Cyl r={0.27} h={0.02} rotation={[Math.PI / 2, 0, 0]} color="#bfe6ff" m={{ opacity: 0.55, rough: 0.05 }} cast={false} />
          <group ref={drum} position={[0, 0, -0.04]}>
            {clothes &&
              ['#8ecdf2', '#ffb3c9', '#ffe08a', '#9be3c4'].map((c, i) => (
                <Ball key={c} r={0.09} position={[Math.cos(i * 1.6) * 0.13, Math.sin(i * 1.6) * 0.13, 0]} color={c} scale={[1, 0.7, 0.6]} cast={false} low />
              ))}
          </group>
        </group>
      </group>
      <Puffs active={washing} position={[0, 1.1, 0]} color="#e6f7ff" count={5} spread={0.25} rise={0.6} size={0.08} />
    </group>
  );
}

function LaundryImpl() {
  const washer = useGameStore((s) => s.cycle.washer);
  const laundryDone = useGameStore((s) => s.completedTasks.includes('do_laundry'));
  const kainAngkat = useGameStore((s) => s.world.kainAngkat);
  const raining = useGameStore((s) => s.world.rainLeft > 0);
  const [dx, dz] = FIXTURES.dryer.pos;
  const [shx, shz] = FIXTURES.laundryShelf.pos;
  return (
    <group>
      <Washer state={washer} />
      {/* dryer */}
      <group position={[dx, 0, dz]}>
        <Block size={[0.95, 1.05, 0.9]} position={[0, 0.53, 0]} color="#ffe3ec" radius={0.1} />
        <Cyl r={0.28} h={0.03} position={[0, 0.45, 0.45]} rotation={[Math.PI / 2, 0, 0]} color="#fff7fa" cast={false} />
        <Block size={[0.95, 0.18, 0.06]} position={[0, 0.95, 0.43]} color="#ffc2d6" radius={0.04} cast={false} />
      </group>
      {/* detergent shelf */}
      <group position={[shx, 0, shz]}>
        <Block size={[1.75, 0.06, 0.6]} position={[0, 0.9, 0]} color="#f6dcc0" radius={0.02} />
        <Block size={[1.75, 0.06, 0.6]} position={[0, 0.3, 0]} color="#f6dcc0" radius={0.02} />
        {[-0.8, 0.8].map((lx) => (
          <Block key={lx} size={[0.06, 0.95, 0.6]} position={[lx, 0.47, 0]} color="#f6dcc0" radius={0.02} />
        ))}
        <Block size={[0.28, 0.36, 0.2]} position={[-0.45, 1.11, 0]} color="#8bc6ff" radius={0.06} />
        <Block size={[0.22, 0.3, 0.18]} position={[-0.1, 1.08, 0]} color="#ff9fb8" radius={0.06} />
        <Cyl r={0.1} h={0.28} position={[0.3, 1.07, 0]} color="#9be3c4" />
        {/* laundry basket with clean, folded clothes once done */}
        <group position={[0.2, 0.33, 0]}>
          <Block size={[0.7, 0.35, 0.45]} position={[0, 0.17, 0]} color="#e9c89f" radius={0.08} />
          {laundryDone &&
            ['#8ecdf2', '#ffb3c9', '#ffe08a'].map((c, i) => (
              <Block key={c} size={[0.5, 0.08, 0.32]} position={[0, 0.37 + i * 0.08, 0]} color={c} radius={0.03} />
            ))}
        </group>
      </group>
      {/* clothesline */}
      <Cyl r={0.012} h={4.6} position={[-2.2, 2.05, 0.6]} rotation={[0, 0, Math.PI / 2]} color="#ffffff" cast={false} />
      {!kainAngkat &&
        ['#ffb3c9', '#bfe6ff', '#fff3a3', '#c9b6ff'].map((c, i) => (
          <group key={c} onClick={clickInteract('ampaian')}>
            <Block size={[0.42, 0.5, 0.02]} position={[-3.8 + i * 1.05, 1.78, 0.6]} rotation={[raining ? Math.sin(i) * 0.25 : 0, 0, 0]} color={c} radius={0.04} />
          </group>
        ))}
      {raining && !kainAngkat && <Twinkles position={[-2.2, 1.6, 0.8]} count={6} radius={1.2} color="#a9c8ff" />}
    </group>
  );
}

export const Laundry = memo(LaundryImpl);
