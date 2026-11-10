import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { GEO, mat } from '../primitives';

/** Rising puffs of steam / bubbles. Purely visual. */
export function Puffs({
  active,
  position,
  color = '#ffffff',
  count = 5,
  spread = 0.2,
  rise = 0.9,
  size = 0.09,
}: {
  active: boolean;
  position: [number, number, number];
  color?: string;
  count?: number;
  spread?: number;
  rise?: number;
  size?: number;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.visible = active;
      if (!active) return;
      const p = (t * 0.6 + i / count) % 1;
      m.position.set(Math.sin(i * 2.3 + t) * spread, p * rise, Math.cos(i * 1.7 + t) * spread * 0.6);
      const s = size * (0.6 + p) * (1 - p * 0.6);
      m.scale.setScalar(s);
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={GEO.sphereLow}
          material={mat(color, { opacity: 0.75 })}
          visible={false}
        />
      ))}
    </group>
  );
}

/** Twinkling sparkles that pop around a point (cleaned spots, rewards). */
export function Twinkles({ position, count = 6, radius = 0.5, color = '#fff6a8' }: { position: [number, number, number]; count?: number; radius?: number; color?: string }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 0.8 + i / count) % 1;
      const a = i * 2.4;
      m.position.set(Math.cos(a) * radius * (0.4 + p * 0.6), 0.1 + p * 0.6, Math.sin(a) * radius * (0.4 + p * 0.6));
      m.scale.setScalar(0.05 * Math.sin(p * Math.PI));
      m.rotation.y = t * 3 + i;
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={GEO.cone}
          material={mat(color, { emissive: color, emissiveIntensity: 1.2 })}
        />
      ))}
    </group>
  );
}
