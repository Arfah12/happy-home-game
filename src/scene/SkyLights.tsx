import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { daylight, goldenHour } from '../game/logic/time';
import { useGameStore } from '../game/store/gameStore';
import type { GraphicsQuality } from '../game/types';
import { GEO, mat } from './primitives';

const C = (hex: string) => new THREE.Color(hex);
const SKY = { day: C('#ffe6f0'), gold: C('#ffc6a3'), night: C('#1b2142'), rainDay: C('#c9cfe0'), rainNight: C('#141a2e') };
const SUN = { day: C('#fff1dc'), gold: C('#ffb070'), moon: C('#9fb4ff') };
const HEMI_SKY = { day: C('#fff6ee'), night: C('#3a4a8a') };

/** Indoor lamps that switch on in the evening. */
const LAMPS: [number, number, number][] = [
  [-6, 2.3, -3.3], // kitchen / dining
  [4, 2.3, -4.2], // living room
  [6.6, 1.7, -6.9], // floor lamp
  [-2, 2.2, 4], // laundry
  [5.5, 2.2, 4], // bedroom
];

/**
 * Sun, moon, sky colour, fog and house lamps – all driven by the in-game clock.
 * Updated in useFrame so the scene never re-renders just because time passes.
 */
export function SkyLights({ quality }: { quality: GraphicsQuality }) {
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const lamps = useRef<(THREE.PointLight | null)[]>([]);
  const night = useRef<THREE.Group>(null);
  const shadows = quality !== 'low';
  const map = quality === 'high' ? 2048 : 1024;
  const lampCount = quality === 'low' ? 2 : LAMPS.length;
  const tmp = useMemo(() => ({ sky: new THREE.Color(), sun: new THREE.Color() }), []);

  useEffect(() => {
    scene.background = new THREE.Color('#ffe6f0');
    scene.fog = new THREE.Fog('#ffe6f0', 38, 80);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame((_, dt) => {
    const s = useGameStore.getState();
    const m = s.clock;
    const day = daylight(m);
    const gold = goldenHour(m) * day;
    const rain = s.world.rainLeft > 0 ? 1 : 0;
    const k = 1 - Math.exp(-2 * Math.min(dt, 0.1)); // smooth transitions

    // Sky / fog colour
    tmp.sky.copy(SKY.night).lerp(rain ? SKY.rainDay : SKY.day, day);
    if (!rain) tmp.sky.lerp(SKY.gold, gold * 0.7);
    else tmp.sky.lerp(SKY.rainNight, 1 - day);
    if (scene.background instanceof THREE.Color) scene.background.lerp(tmp.sky, k);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.lerp(tmp.sky, k);
      scene.fog.near = rain ? 26 : 38;
      scene.fog.far = rain ? 60 : 80;
    }

    // Sun travels east → west across the day; the moon takes over at night.
    if (sun.current) {
      const a = Math.min(1, Math.max(0, (m - 6 * 60) / (13.5 * 60))) * Math.PI;
      const isDay = day > 0.15;
      sun.current.position.set(isDay ? Math.cos(a) * 18 : -8, isDay ? 6 + Math.sin(a) * 16 : 18, 12);
      tmp.sun.copy(SUN.moon).lerp(SUN.day, day).lerp(SUN.gold, gold);
      sun.current.color.lerp(tmp.sun, k);
      const target = (0.35 + day * 1.45) * (rain ? 0.45 : 1);
      sun.current.intensity += (target - sun.current.intensity) * k;
    }
    if (hemi.current) {
      hemi.current.color.lerp(tmp.sun.copy(HEMI_SKY.night).lerp(HEMI_SKY.day, day), k);
      const target = (0.55 + day * 0.7) * (rain ? 0.85 : 1);
      hemi.current.intensity += (target - hemi.current.intensity) * k;
    }
    if (ambient.current) ambient.current.intensity = 0.1 + day * 0.08;
    const lampOn = Math.max(0, 1 - day * 1.6) + rain * 0.3;
    lamps.current.forEach((l) => {
      if (l) l.intensity += (lampOn * 5 - l.intensity) * k;
    });
    if (night.current) night.current.visible = day < 0.5 && !rain;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff6ee', '#e6d3ff', 1.25]} />
      <ambientLight ref={ambient} intensity={0.18} />
      <directionalLight
        ref={sun}
        position={[9, 20, 14]}
        intensity={1.75}
        color="#fff1dc"
        castShadow={shadows}
        shadow-mapSize={[map, map]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {LAMPS.slice(0, lampCount).map((p, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lamps.current[i] = el;
          }}
          position={p}
          color="#ffd59a"
          intensity={0}
          distance={9}
          decay={1.5}
        />
      ))}
      <group ref={night} visible={false}>
        <mesh geometry={GEO.sphere} material={mat('#fff8dc', { emissive: '#fff4c2', emissiveIntensity: 1.2 })} position={[-14, 16, -34]} scale={2.2} />
        {Array.from({ length: 40 }, (_, i) => (
          <mesh
            key={i}
            geometry={GEO.sphereLow}
            material={mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 1 })}
            position={[((i * 37) % 70) - 30, 10 + ((i * 13) % 14), -34 - ((i * 7) % 10)]}
            scale={0.12 + (i % 3) * 0.05}
          />
        ))}
      </group>
    </>
  );
}
