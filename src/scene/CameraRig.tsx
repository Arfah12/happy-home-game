import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../game/store/gameStore';
import { player } from '../game/systems/playerState';

/** Smooth third-person / isometric follow camera. */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3(player.x, 0.8, player.z));
  const desired = useRef(new THREE.Vector3());
  const focus = useRef(new THREE.Vector3());

  const offset = (dist: number, portrait: boolean) => {
    // On tall phone screens pull back a little so more of the room is visible.
    const d = portrait ? dist * 1.25 : dist;
    return { y: d * 0.95, z: d * 0.78 };
  };

  useEffect(() => {
    const dist = useGameStore.getState().settings.cameraDistance;
    const o = offset(dist, size.height > size.width);
    camera.position.set(player.x, o.y, player.z + o.z);
    look.current.set(player.x, 0.8, player.z);
    camera.lookAt(look.current);
  }, [camera, size.height, size.width]);

  useFrame((_, dt) => {
    const dist = useGameStore.getState().settings.cameraDistance;
    const o = offset(dist, size.height > size.width);
    desired.current.set(player.x, o.y, player.z + o.z);
    const k = 1 - Math.exp(-5 * Math.min(dt, 0.05));
    camera.position.lerp(desired.current, k);
    focus.current.set(player.x, 0.8, player.z);
    look.current.lerp(focus.current, Math.min(1, k * 1.4));
    camera.lookAt(look.current);
  });

  return null;
}
