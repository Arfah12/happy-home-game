import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import type { FurnitureItem } from '../../game/config/furniture';
import { Ball, Block, Cyl, Disc } from '../primitives';
import { FloorLamp, PottedPlant, Rug } from '../props/Common';

function Fish({ color, offset }: { color: string; offset: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.7 + offset;
    ref.current.position.x = Math.sin(t) * 0.5;
    ref.current.position.y = 0.55 + Math.sin(t * 2.3) * 0.08;
    ref.current.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={ref}>
      <Ball r={0.07} color={color} scale={[1.4, 1, 0.6]} low cast={false} />
      <Cyl r={0.05} h={0.06} topRatio={0.05} position={[-0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={color} cast={false} />
    </group>
  );
}

/** Procedural model for every furniture item, built from the catalog colours. */
function FurnitureModelImpl({ item }: { item: FurnitureItem }) {
  const { color: c, accent: a } = item;
  const [w, d] = item.size;
  switch (item.model) {
    case 'rug':
      return <Rug position={[0, 0, 0]} r={w / 2} color={c} accent={a} />;
    case 'plant_pot':
      return <PottedPlant position={[0, 0, 0]} leaf={c} pot={a} />;
    case 'plant_tall':
      return (
        <group>
          <Cyl r={0.28} h={0.45} topRatio={1.2} position={[0, 0.22, 0]} color="#ffffff" />
          <Cyl r={0.03} h={0.9} position={[0, 0.85, 0]} color="#5a8a4a" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Ball key={i} r={0.24} position={[Math.cos(i * 1.3) * 0.25, 0.9 + i * 0.16, Math.sin(i * 1.3) * 0.25]} color={c} scale={[1.3, 0.35, 0.9]} rotation={[0, i, 0.3]} />
          ))}
        </group>
      );
    case 'floor_lamp':
      return <FloorLamp position={[0, 0, 0]} shade={c} />;
    case 'side_table':
      return (
        <group>
          <Cyl r={0.36} h={0.06} position={[0, 0.55, 0]} color={c} />
          <Cyl r={0.05} h={0.52} position={[0, 0.27, 0]} color={a} />
          <Cyl r={0.22} h={0.04} position={[0, 0.02, 0]} color={a} />
          <Cyl r={0.06} h={0.14} position={[0.1, 0.65, 0]} color="#ffffff" />
          <Ball r={0.06} position={[0.1, 0.76, 0]} color="#ff7eb6" low />
        </group>
      );
    case 'bean_bag':
      return (
        <group>
          <Ball r={0.52} position={[0, 0.32, 0]} color={c} scale={[1, 0.62, 1]} />
          <Ball r={0.36} position={[0, 0.55, -0.22]} color={a} scale={[1.1, 0.8, 0.7]} />
        </group>
      );
    case 'armchair':
      return (
        <group>
          <Block size={[w, 0.4, d]} position={[0, 0.25, 0]} color={c} radius={0.12} />
          <Block size={[w, 0.6, 0.25]} position={[0, 0.65, -d / 2 + 0.12]} color={c} radius={0.12} />
          <Block size={[0.22, 0.45, d]} position={[-w / 2 + 0.11, 0.5, 0]} color={a} radius={0.1} />
          <Block size={[0.22, 0.45, d]} position={[w / 2 - 0.11, 0.5, 0]} color={a} radius={0.1} />
          <Block size={[w - 0.5, 0.14, d - 0.35]} position={[0, 0.5, 0.08]} color="#ffffff" radius={0.06} />
        </group>
      );
    case 'bookshelf':
      return (
        <group>
          <Block size={[w, 1.6, d]} position={[0, 0.8, 0]} color={c} radius={0.04} />
          {[0.35, 0.8, 1.25].map((y, row) => (
            <group key={y}>
              <Block size={[w - 0.1, 0.38, d - 0.08]} position={[0, y, 0.05]} color="#fff7ec" radius={0.01} cast={false} />
              {[0, 1, 2, 3, 4].map((i) => (
                <Block
                  key={i}
                  size={[0.12, 0.3 - (i % 2) * 0.05, d - 0.15]}
                  position={[-w / 2 + 0.2 + i * 0.16 + row * 0.1, y - 0.02, 0.06]}
                  color={['#ff9fb8', a, '#ffd166', '#9be3c4', '#c9b6ff'][(i + row) % 5]}
                  radius={0.015}
                />
              ))}
            </group>
          ))}
        </group>
      );
    case 'easel_art':
      return (
        <group>
          <Cyl r={0.025} h={1.4} position={[-0.25, 0.68, 0.08]} rotation={[0.12, 0, 0.12]} color="#c98f5f" />
          <Cyl r={0.025} h={1.4} position={[0.25, 0.68, 0.08]} rotation={[0.12, 0, -0.12]} color="#c98f5f" />
          <Cyl r={0.025} h={1.35} position={[0, 0.65, -0.2]} rotation={[-0.3, 0, 0]} color="#c98f5f" />
          <Block size={[0.8, 0.6, 0.04]} position={[0, 1.05, 0.06]} rotation={[-0.12, 0, 0]} color="#ffffff" radius={0.02} />
          <Block size={[0.7, 0.25, 0.02]} position={[0, 0.94, 0.09]} rotation={[-0.12, 0, 0]} color={c} radius={0.01} cast={false} />
          <Block size={[0.7, 0.25, 0.02]} position={[0, 1.17, 0.07]} rotation={[-0.12, 0, 0]} color="#bfe6ff" radius={0.01} cast={false} />
          <Ball r={0.09} position={[0.15, 1.12, 0.1]} color={a} scale={[1, 1, 0.3]} cast={false} />
        </group>
      );
    case 'nightstand':
      return (
        <group>
          <Block size={[w, 0.55, d]} position={[0, 0.3, 0]} color={c} radius={0.1} />
          <Block size={[w - 0.1, 0.03, 0.03]} position={[0, 0.32, d / 2]} color={a} radius={0} cast={false} />
          <Ball r={0.05} position={[0, 0.45, d / 2]} color={a} low cast={false} />
          <Ball r={0.13} position={[0.12, 0.7, 0]} color="#fff2b3" m={{ emissive: '#ffe08a', emissiveIntensity: 0.7 }} />
        </group>
      );
    case 'dresser':
      return (
        <group>
          <Block size={[w, 0.95, d]} position={[0, 0.5, 0]} color={c} radius={0.06} />
          {[0.25, 0.55, 0.85].map((y) => (
            <group key={y}>
              <Block size={[w - 0.12, 0.25, 0.03]} position={[0, y - 0.03, d / 2]} color={a} radius={0.02} cast={false} />
              <Ball r={0.035} position={[0, y - 0.03, d / 2 + 0.03]} color="#f6c945" low cast={false} />
            </group>
          ))}
          <Cyl r={0.08} h={0.2} position={[-0.45, 1.08, 0]} color="#ffb3cf" />
          <Ball r={0.1} position={[-0.45, 1.24, 0]} color="#ffd166" />
        </group>
      );
    case 'sofa':
      return (
        <group>
          <Block size={[w, 0.42, d]} position={[0, 0.27, 0]} color={c} radius={0.14} />
          <Block size={[w, 0.66, 0.3]} position={[0, 0.68, -d / 2 + 0.15]} color={c} radius={0.14} />
          <Block size={[0.3, 0.55, d]} position={[-w / 2 + 0.15, 0.5, 0]} color={c} radius={0.13} />
          <Block size={[0.3, 0.55, d]} position={[w / 2 - 0.15, 0.5, 0]} color={c} radius={0.13} />
          <Block size={[w / 2 - 0.35, 0.15, d - 0.4]} position={[-(w / 4) + 0.08, 0.55, 0.1]} color={a} radius={0.07} />
          <Block size={[w / 2 - 0.35, 0.15, d - 0.4]} position={[w / 4 - 0.08, 0.55, 0.1]} color={a} radius={0.07} />
        </group>
      );
    case 'coffee_table':
      return (
        <group>
          <Block size={[w, 0.08, d]} position={[0, 0.42, 0]} color={c} radius={0.04} />
          <Block size={[w - 0.2, 0.05, d - 0.2]} position={[0, 0.15, 0]} color={c} radius={0.02} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
            <Cyl key={i} r={0.04} h={0.4} position={[sx * (w / 2 - 0.1), 0.2, sz * (d / 2 - 0.1)]} color={c} />
          ))}
          <Cyl r={0.09} h={0.1} position={[0.3, 0.51, 0]} color={a} />
          <Block size={[0.35, 0.05, 0.25]} position={[-0.25, 0.48, 0.05]} rotation={[0, 0.3, 0]} color="#ff9fb8" radius={0.01} />
        </group>
      );
    case 'tv_stand':
      return (
        <group>
          <Block size={[w, 0.5, d]} position={[0, 0.25, 0]} color={c} radius={0.06} />
          <Block size={[1.0, 0.65, 0.22]} position={[0, 0.85, 0]} color={a} radius={0.1} />
          <Block size={[0.85, 0.5, 0.02]} position={[0, 0.86, 0.11]} color="#8fd3ff" m={{ emissive: '#8fd3ff', emissiveIntensity: 0.5, rough: 0.2 }} radius={0.04} cast={false} />
          <Cyl r={0.01} h={0.35} position={[-0.2, 1.33, 0]} rotation={[0, 0, 0.5]} color={a} cast={false} />
          <Cyl r={0.01} h={0.35} position={[0.2, 1.33, 0]} rotation={[0, 0, -0.5]} color={a} cast={false} />
        </group>
      );
    case 'bench':
      return (
        <group>
          {[-0.12, 0.12].map((z) => (
            <Block key={z} size={[w, 0.06, 0.2]} position={[0, 0.45, z]} color={c} radius={0.02} />
          ))}
          <Block size={[w, 0.35, 0.06]} position={[0, 0.75, -0.25]} color={c} radius={0.02} />
          {[-w / 2 + 0.15, w / 2 - 0.15].map((x) => (
            <Block key={x} size={[0.08, 0.45, 0.5]} position={[x, 0.22, 0]} color={a} radius={0.02} />
          ))}
        </group>
      );
    case 'flower_bed':
      return (
        <group>
          <Block size={[w, 0.25, d]} position={[0, 0.12, 0]} color="#c98f5f" radius={0.06} />
          <Block size={[w - 0.1, 0.03, d - 0.1]} position={[0, 0.25, 0]} color="#7a5235" radius={0.01} cast={false} />
          {Array.from({ length: 8 }, (_, i) => (
            <group key={i} position={[-w / 2 + 0.2 + (i % 4) * ((w - 0.4) / 3), 0.25, i < 4 ? -0.15 : 0.15]}>
              <Cyl r={0.015} h={0.3} position={[0, 0.15, 0]} color="#5a8a4a" cast={false} />
              <Ball r={0.08} position={[0, 0.32, 0]} color={i % 2 ? c : a} scale={[1, 1.3, 1]} low />
            </group>
          ))}
        </group>
      );
    case 'fountain':
      return <Fountain c={c} a={a} w={w} />;
    case 'piano':
      return (
        <group>
          <Block size={[1.5, 0.35, 1.7]} position={[0, 0.85, 0]} color={c} m={{ rough: 0.2 }} radius={0.2} />
          <Block size={[1.3, 0.04, 0.25]} position={[0, 0.72, 0.85]} color={a} radius={0.01} />
          {Array.from({ length: 9 }, (_, i) => (
            <Block key={i} size={[0.06, 0.03, 0.15]} position={[-0.56 + i * 0.14, 0.75, 0.8]} color="#2f2b3a" radius={0} cast={false} />
          ))}
          {[[-0.6, 0.6], [0.6, 0.6], [0, -0.65]].map(([x, z], i) => (
            <Cyl key={i} r={0.06} h={0.7} position={[x, 0.35, z]} color={c} />
          ))}
          <Block size={[1.4, 0.04, 1.2]} position={[0, 1.3, -0.25]} rotation={[-0.6, 0, 0]} color={c} m={{ rough: 0.2 }} radius={0.02} />
        </group>
      );
    case 'aquarium':
      return (
        <group>
          <Block size={[w, 0.4, d]} position={[0, 0.2, 0]} color="#e8cba8" radius={0.04} />
          <Block size={[w - 0.05, 0.7, d - 0.05]} position={[0, 0.75, 0]} color={c} m={{ opacity: 0.5, rough: 0.05 }} radius={0.03} cast={false} />
          <Block size={[w - 0.1, 0.06, d - 0.1]} position={[0, 0.43, 0]} color="#ffe6b3" radius={0.01} cast={false} />
          <group position={[0, 0.4, 0]}>
            <Fish color={a} offset={0} />
            <Fish color="#ffd166" offset={2} />
            <Fish color="#ff7eb6" offset={4} />
          </group>
          <Cyl r={0.05} h={0.3} position={[0.5, 0.6, 0]} color="#3fae6a" cast={false} />
          <Ball r={0.07} position={[-0.5, 0.5, 0.05]} color="#ff9fb8" low cast={false} />
        </group>
      );
    case 'dining_set':
      return (
        <group>
          <Cyl r={0.75} h={0.06} position={[0, 0.75, 0]} color={c} />
          <Cyl r={0.08} h={0.72} position={[0, 0.37, 0]} color={a} />
          <Cyl r={0.35} h={0.04} position={[0, 0.02, 0]} color={a} />
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang) => (
            <group key={ang} position={[Math.sin(ang) * 0.8, 0, Math.cos(ang) * 0.8]} rotation={[0, ang, 0]}>
              <Cyl r={0.2} h={0.06} position={[0, 0.48, 0]} color={a} />
              <Cyl r={0.03} h={0.46} position={[0, 0.23, 0]} color="#e8cba8" />
            </group>
          ))}
          <Cyl r={0.1} h={0.12} position={[0, 0.84, 0]} color="#ffffff" />
          <Ball r={0.08} position={[0, 0.95, 0]} color="#ff7eb6" low />
        </group>
      );
    case 'toy_chest':
      return (
        <group>
          <Block size={[w, 0.5, d]} position={[0, 0.25, 0]} color={c} radius={0.08} />
          <Block size={[w + 0.04, 0.12, d + 0.04]} position={[0, 0.55, 0]} color={a} radius={0.05} />
          <Ball r={0.12} position={[-0.25, 0.7, 0]} color="#06d6a0" />
          <Block size={[0.18, 0.18, 0.18]} position={[0.2, 0.7, 0]} rotation={[0, 0.5, 0]} color="#118ab2" radius={0.03} />
        </group>
      );
    case 'rocking_horse':
      return (
        <group>
          <Cyl r={0.6} h={0.06} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} topRatio={1} color={a} />
          <Block size={[0.7, 0.3, 0.3]} position={[0, 0.55, 0]} color={c} radius={0.12} />
          <Block size={[0.2, 0.4, 0.2]} position={[0.35, 0.8, 0]} rotation={[0, 0, -0.3]} color={c} radius={0.08} />
          <Block size={[0.3, 0.18, 0.2]} position={[0.5, 0.95, 0]} color={c} radius={0.08} />
          <Ball r={0.03} position={[0.58, 1.0, 0.09]} color="#2f2b3a" low cast={false} />
          <Block size={[0.08, 0.3, 0.08]} position={[-0.38, 0.6, 0]} rotation={[0, 0, 0.6]} color="#c98f5f" radius={0.03} />
          {[[-0.25, 0.1], [0.25, 0.1], [-0.25, -0.1], [0.25, -0.1]].map(([x, z], i) => (
            <Cyl key={i} r={0.035} h={0.3} position={[x, 0.3, z]} color={c} />
          ))}
        </group>
      );
    case 'lounge_chair':
      return (
        <group>
          <Block size={[w, 0.12, 1.2]} position={[0, 0.35, 0.3]} color={c} radius={0.05} />
          <Block size={[w, 0.12, 0.8]} position={[0, 0.62, -0.5]} rotation={[0.6, 0, 0]} color={c} radius={0.05} />
          <Block size={[w - 0.2, 0.08, 0.3]} position={[0, 0.82, -0.62]} rotation={[0.6, 0, 0]} color={a} radius={0.04} />
          {[[-0.3, 0.8], [0.3, 0.8], [-0.3, -0.6], [0.3, -0.6]].map(([x, z], i) => (
            <Cyl key={i} r={0.03} h={0.33} position={[x, 0.16, z]} color="#ffffff" />
          ))}
        </group>
      );
    case 'crystal_lamp':
      return (
        <group>
          <Cyl r={0.25} h={0.06} position={[0, 0.03, 0]} color={a} m={{ metal: 0.7, rough: 0.25 }} />
          <Cyl r={0.03} h={1.5} position={[0, 0.78, 0]} color={a} m={{ metal: 0.7, rough: 0.25 }} />
          {Array.from({ length: 8 }, (_, i) => (
            <Ball key={i} r={0.07} position={[Math.cos(i * 0.785) * 0.28, 1.45 + (i % 2) * 0.12, Math.sin(i * 0.785) * 0.28]} color={c} m={{ emissive: '#dff1ff', emissiveIntensity: 1.1, rough: 0.05 }} low />
          ))}
          <Ball r={0.16} position={[0, 1.55, 0]} color="#ffffff" m={{ emissive: '#fff4c2', emissiveIntensity: 1.4 }} />
        </group>
      );
  }
}

function Fountain({ c, a, w }: { c: string; a: string; w: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.y = 1 + Math.sin(clock.elapsedTime * 4) * 0.12;
  });
  return (
    <group>
      <Cyl r={w / 2} h={0.35} position={[0, 0.17, 0]} color={c} />
      <Disc r={w / 2 - 0.1} position={[0, 0.36, 0]} color={a} m={{ rough: 0.1, opacity: 0.85 }} />
      <Cyl r={0.12} h={0.7} position={[0, 0.6, 0]} color={c} />
      <Cyl r={0.35} h={0.1} position={[0, 0.95, 0]} color={c} />
      <group ref={ref} position={[0, 1.0, 0]}>
        <Cyl r={0.05} h={0.35} topRatio={0.3} position={[0, 0.17, 0]} color={a} m={{ opacity: 0.7, emissive: a, emissiveIntensity: 0.3 }} cast={false} />
      </group>
      <Ball r={0.1} position={[0.4, 0.45, 0.1]} color="#ffffff" scale={[1.3, 1, 1]} low />
    </group>
  );
}

export const FurnitureModel = memo(FurnitureModelImpl);
