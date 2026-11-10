import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { FURNITURE_BY_ID } from '../game/config/furniture';
import { useGameStore } from '../game/store/gameStore';
import { useInteractionStore } from '../game/store/interactionStore';
import { isWorldPaused, useUiStore } from '../game/store/uiStore';
import { audio } from '../game/systems/audio';
import { input, moveVector } from '../game/systems/input';
import { getInteractable } from '../game/systems/interactions';
import { snap, validatePlacement } from '../game/systems/placement';
import { confirmPlacement, rotatePlacement } from '../game/systems/placementActions';
import { player } from '../game/systems/playerState';
import { currentTask, taskGuide } from '../game/logic/taskGuide';
import { isNight } from '../game/logic/time';
import { GEO, mat } from './primitives';

/** Non-visual per-frame systems: washer timer and looping sounds. */
export function GameLoop() {
  useFrame((_, dt) => {
    const paused = isWorldPaused();
    const g = useGameStore.getState();
    if (!paused) {
      g.tickWasher(Math.min(dt, 0.1));
      g.advanceTime(Math.min(dt, 0.1));
    }
    const work = useInteractionStore.getState().work;
    audio.setLoop('washer', g.cycle.washer === 'washing' && !paused);
    audio.setLoop('vacuum', g.equipped === 'vacuum' && player.speed > 0.6 && !paused);
    audio.setLoop('rain', g.world.rainLeft > 0 && !paused);
    audio.setLoop('night', isNight(g.clock) && !paused && g.world.rainLeft <= 0);
    audio.setLoop('scrub', !!work && !paused && getInteractable(work.id)?.anim === 'clean');
  });
  return null;
}

/**
 * Drives the placement ghost: it sits in front of the player (touch /
 * keyboard) or follows the mouse over the floor; validity is re-checked
 * whenever it moves.
 */
export function PlacementController() {
  const pointer = useRef<{ x: number; z: number } | null>(null);
  const lastPointer = useRef<string>('mouse');
  const placement = useUiStore((s) => s.placement);

  useFrame(() => {
    const ui = useUiStore.getState();
    const p = ui.placement;
    if (!p) {
      pointer.current = null;
      return;
    }
    if (input.rotateQueued) {
      input.rotateQueued = false;
      rotatePlacement();
    }
    if (input.interactQueued) {
      input.interactQueued = false;
      confirmPlacement();
      return;
    }
    if (moveVector().mag > 0) pointer.current = null;
    const item = FURNITURE_BY_ID[p.itemId];
    if (!item) return;
    let x: number;
    let z: number;
    if (pointer.current) {
      x = pointer.current.x;
      z = pointer.current.z;
    } else {
      const ahead = Math.max(item.size[0], item.size[1]) / 2 + 0.75;
      x = player.x + Math.sin(player.yaw) * ahead;
      z = player.z + Math.cos(player.yaw) * ahead;
    }
    x = snap(x);
    z = snap(z);
    const g = useGameStore.getState();
    const valid = validatePlacement(p.itemId, x, z, p.rot, g.unlockedRooms, g.placed, p.uid);
    ui.updatePlacement({ x, z, valid });
  });

  if (!placement) return null;
  // Invisible floor-wide catcher for mouse placement.
  return (
    <mesh
      geometry={GEO.plane}
      material={mat('#ffffff', { opacity: 0 })}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[3.5, 0.05, 3.5]}
      scale={[60, 60, 1]}
      onPointerDown={(e) => {
        lastPointer.current = e.pointerType;
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse') pointer.current = { x: e.point.x, z: e.point.z };
      }}
      onClick={(e) => {
        if (e.delta > 8) return;
        e.stopPropagation();
        // Touch: a tap moves the ghost there (confirm with the Place button).
        // Mouse: a click places it right away.
        pointer.current = { x: e.point.x, z: e.point.z };
        if (lastPointer.current !== 'mouse') return;
        const g = useGameStore.getState();
        const p = useUiStore.getState().placement;
        if (!p) return;
        const x = snap(e.point.x);
        const z = snap(e.point.z);
        useUiStore.getState().updatePlacement({ x, z, valid: validatePlacement(p.itemId, x, z, p.rot, g.unlockedRooms, g.placed, p.uid) });
        confirmPlacement();
      }}
    />
  );
}

/** Bouncing arrow over the next objective of the current task. */
export function TaskMarker() {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const g = useGameStore.getState();
    const ui = useUiStore.getState();
    const task = currentTask(g);
    const guide = task ? taskGuide(task.id, g, player) : null;
    const target = guide?.target;
    const show = !!target && !ui.placement && Math.hypot(target.x - player.x, target.z - player.z) > 1.0;
    ref.current.visible = show;
    if (!show || !target) return;
    const t = clock.elapsedTime;
    ref.current.position.set(target.x, 0, target.z);
    const arrow = ref.current.children[0];
    if (arrow) {
      arrow.position.y = 2.0 + Math.sin(t * 4) * 0.15;
      arrow.rotation.y = t * 2;
    }
    if (ring.current) {
      const s = 0.55 + ((t * 0.8) % 1) * 0.35;
      ring.current.scale.set(s, s, 1);
    }
  });
  return (
    <group ref={ref} visible={false}>
      <group>
        <mesh geometry={GEO.cone} material={mat('#ff6fa8', { emissive: '#ff6fa8', emissiveIntensity: 0.5 })} rotation={[Math.PI, 0, 0]} scale={[0.22, 0.4, 0.22]} />
        <mesh geometry={GEO.sphereLow} material={mat('#ffffff')} position={[0, 0.3, 0]} scale={0.1} />
      </group>
      <mesh ref={ring} geometry={GEO.ring} material={mat('#ff6fa8', { opacity: 0.6, emissive: '#ff6fa8', emissiveIntensity: 0.4 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} />
    </group>
  );
}

/** Soft glowing ring under whatever the player can interact with. */
export function NearHighlight() {
  const near = useInteractionStore((s) => s.near);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 0.7 + Math.sin(clock.elapsedTime * 5) * 0.06;
      ref.current.scale.set(s, s, 1);
    }
  });
  if (!near) return null;
  const it = getInteractable(near.id);
  if (!it) return null;
  const color = near.disabledReason ? '#c4b5d6' : '#ffd23f';
  return (
    <mesh
      ref={ref}
      geometry={GEO.ring}
      material={mat(color, { opacity: 0.85, emissive: color, emissiveIntensity: 0.6 })}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[it.x, 0.045, it.z]}
    />
  );
}
