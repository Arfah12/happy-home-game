import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import { FURNITURE_BY_ID } from '../../game/config/furniture';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { footprintRect } from '../../game/systems/collision';
import { clickInteract } from '../interactClick';
import { GEO, mat } from '../primitives';
import { FurnitureModel } from './FurnitureModel';

function PlacedFurnitureImpl() {
  const placed = useGameStore((s) => s.placed);
  const movingUid = useUiStore((s) => s.placement?.uid);
  return (
    <group>
      {placed.map((p) => {
        if (p.uid === movingUid) return null; // shown as the ghost instead
        const item = FURNITURE_BY_ID[p.itemId];
        if (!item) return null;
        return (
          <group key={p.uid} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]} onClick={clickInteract(`furn_${p.uid}`)}>
            <FurnitureModel item={item} />
          </group>
        );
      })}
    </group>
  );
}

export const PlacedFurniture = memo(PlacedFurnitureImpl);

/** The item being placed / moved, plus a coloured footprint showing validity. */
export function PlacementGhost() {
  const placement = useUiStore((s) => s.placement);
  const bob = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (bob.current) bob.current.position.y = 0.06 + Math.sin(clock.elapsedTime * 5) * 0.04;
  });
  if (!placement) return null;
  const item = FURNITURE_BY_ID[placement.itemId];
  if (!item) return null;
  const r = footprintRect(item.id, placement.x, placement.z, placement.rot);
  const color = placement.valid ? '#4ade80' : '#f87171';
  return (
    <group>
      <mesh
        geometry={GEO.plane}
        material={mat(color, { opacity: 0.45, emissive: color, emissiveIntensity: 0.5 })}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(r[0] + r[2]) / 2, 0.035, (r[1] + r[3]) / 2]}
        scale={[r[2] - r[0], r[3] - r[1], 1]}
      />
      <group position={[placement.x, 0, placement.z]} rotation={[0, placement.rot, 0]}>
        <group ref={bob}>
          <FurnitureModel item={item} />
        </group>
      </group>
    </group>
  );
}
