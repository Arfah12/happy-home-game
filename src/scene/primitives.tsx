import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { createContext, useContext, type ReactNode } from 'react';
import * as THREE from 'three';
import type { GraphicsQuality } from '../game/types';

/* ───────────────────────── Quality context ───────────────────────── */

export const QualityContext = createContext<GraphicsQuality>('high');
export const useQuality = () => useContext(QualityContext);

/* ───────────────────────── Shared materials ──────────────────────── */

export interface MatOpts {
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  map?: THREE.Texture;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

/** Materials are cached by colour + options so hundreds of meshes share a handful of materials. */
export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.rough ?? 0.78}|${o.metal ?? 0}|${o.emissive ?? ''}|${o.emissiveIntensity ?? 0}|${o.opacity ?? 1}|${o.map?.uuid ?? ''}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.78,
      metalness: o.metal ?? 0,
      emissive: o.emissive ? new THREE.Color(o.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: o.emissiveIntensity ?? 0,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
      map: o.map ?? null,
      depthWrite: (o.opacity ?? 1) >= 1,
    });
    matCache.set(key, m);
  }
  return m;
}

/* ───────────────────────── Shared geometries ─────────────────────── */

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 20, 14),
  sphereLow: new THREE.SphereGeometry(1, 10, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
  plane: new THREE.PlaneGeometry(1, 1),
  circle: new THREE.CircleGeometry(1, 32),
  ring: new THREE.RingGeometry(0.82, 1, 40),
  cone: new THREE.ConeGeometry(1, 1, 20),
  torus: new THREE.TorusGeometry(1, 0.22, 10, 28),
};

const taperCache = new Map<string, THREE.CylinderGeometry>();
function taper(ratio: number, segs = 20): THREE.CylinderGeometry {
  const key = `${ratio.toFixed(3)}|${segs}`;
  let g = taperCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(ratio, 1, 1, segs);
    taperCache.set(key, g);
  }
  return g;
}

/* ───────────────────────── Primitive components ──────────────────── */

type Vec3 = [number, number, number];

interface Common {
  position?: Vec3;
  rotation?: Vec3;
  color: string;
  m?: MatOpts;
  cast?: boolean;
  receive?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export interface BlockProps extends Common {
  size: Vec3;
  radius?: number;
}

/** A rounded box (falls back to a plain shared box on low quality). */
export function Block({ size, radius = 0.05, position, rotation, color, m, cast = true, receive = false, onClick }: BlockProps) {
  const quality = useQuality();
  const material = mat(color, m);
  const minHalf = Math.min(size[0], size[1], size[2]) / 2;
  const r = Math.min(radius, minHalf - 0.002);
  if (quality === 'low' || r <= 0.004) {
    return (
      <mesh
        geometry={GEO.box}
        material={material}
        scale={size}
        position={position}
        rotation={rotation}
        castShadow={cast}
        receiveShadow={receive}
        onClick={onClick}
      />
    );
  }
  return (
    <RoundedBox
      args={size}
      radius={r}
      smoothness={quality === 'high' ? 3 : 2}
      material={material}
      position={position}
      rotation={rotation}
      castShadow={cast}
      receiveShadow={receive}
      onClick={onClick}
    />
  );
}

export interface CylProps extends Common {
  r: number;
  h: number;
  /** Top radius as a fraction of the bottom radius (cones / tapered legs). */
  topRatio?: number;
  segments?: number;
}

export function Cyl({ r, h, topRatio = 1, segments = 20, position, rotation, color, m, cast = true, receive = false, onClick }: CylProps) {
  const geometry = topRatio === 1 && segments === 20 ? GEO.cyl : taper(topRatio, segments);
  return (
    <mesh
      geometry={geometry}
      material={mat(color, m)}
      scale={[r, h, r]}
      position={position}
      rotation={rotation}
      castShadow={cast}
      receiveShadow={receive}
      onClick={onClick}
    />
  );
}

export interface BallProps extends Common {
  r: number;
  scale?: Vec3;
  low?: boolean;
}

export function Ball({ r, scale = [1, 1, 1], position, rotation, color, m, cast = true, receive = false, low, onClick }: BallProps) {
  const quality = useQuality();
  return (
    <mesh
      geometry={low || quality === 'low' ? GEO.sphereLow : GEO.sphere}
      material={mat(color, m)}
      scale={[r * scale[0], r * scale[1], r * scale[2]]}
      position={position}
      rotation={rotation}
      castShadow={cast}
      receiveShadow={receive}
      onClick={onClick}
    />
  );
}

/** Flat disc lying on the floor. */
export function Disc({ r, position, color, m, scale = [1, 1], onClick }: { r: number; position: Vec3; color: string; m?: MatOpts; scale?: [number, number]; onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  return (
    <mesh
      geometry={GEO.circle}
      material={mat(color, m)}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[r * scale[0], r * scale[1], 1]}
      position={position}
      receiveShadow
      onClick={onClick}
    />
  );
}

export function Group({ children, position, rotation, scale }: { children: ReactNode; position?: Vec3; rotation?: Vec3; scale?: number | Vec3 }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {children}
    </group>
  );
}
