import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { DUST_SPOTS, PLAYER_RADIUS } from '../game/config/layout';
import { sfx } from '../game/events';
import { useGameStore } from '../game/store/gameStore';
import { useInteractionStore } from '../game/store/interactionStore';
import { isWorldPaused, useUiStore } from '../game/store/uiStore';
import { getColliders, resolveCircle } from '../game/systems/collision';
import { input, moveVector } from '../game/systems/input';
import { findNearest, getInteractable, isInRange, triggerInteract } from '../game/systems/interactions';
import { playGesture, player, teleportPlayer } from '../game/systems/playerState';
import { Character } from './Character';

const WALK_SPEED = 4.2;

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function Player() {
  const group = useRef<THREE.Group>(null);
  const nearTimer = useRef(0);
  const saveTimer = useRef(0);
  const stuck = useRef(0);

  // Restore the saved position (pushed out of any collider just in case).
  useEffect(() => {
    const g = useGameStore.getState();
    const p = resolveCircle(g.playerPos.x, g.playerPos.z, PLAYER_RADIUS, getColliders(g.unlockedRooms, g.placed));
    teleportPlayer(p.x, p.z);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const paused = isWorldPaused();
    const g = useGameStore.getState();
    const ui = useUiStore.getState();
    const istore = useInteractionStore.getState();

    let mv = { x: 0, z: 0, mag: 0 };
    if (!paused) {
      mv = moveVector();
      if (mv.mag > 0) {
        input.moveTarget = null;
      } else if (input.moveTarget) {
        const tgt = input.moveTarget;
        const dx = tgt.x - player.x;
        const dz = tgt.z - player.z;
        const d = Math.hypot(dx, dz);
        const arrived = tgt.interactId ? isInRange(tgt.interactId) : d < 0.12;
        if (arrived) {
          input.moveTarget = null;
          if (tgt.interactId) triggerInteract(tgt.interactId);
        } else {
          mv = { x: dx / d, z: dz / d, mag: Math.min(1, d / 0.5 + 0.35) };
        }
      }
    } else {
      input.interactQueued = false;
    }

    // Any movement cancels an ongoing timed action.
    if (istore.work && mv.mag > 0) istore.setWork(null);

    const speed = WALK_SPEED * mv.mag;
    if (mv.mag > 0) {
      const nx = player.x + mv.x * speed * dt;
      const nz = player.z + mv.z * speed * dt;
      const res = resolveCircle(nx, nz, PLAYER_RADIUS, getColliders(g.unlockedRooms, g.placed));
      const moved = Math.hypot(res.x - player.x, res.z - player.z);
      if (input.moveTarget) {
        stuck.current = moved < speed * dt * 0.25 ? stuck.current + dt : 0;
        if (stuck.current > 0.5) {
          input.moveTarget = null;
          stuck.current = 0;
        }
      }
      player.x = res.x;
      player.z = res.z;
      player.yaw = lerpAngle(player.yaw, Math.atan2(mv.x, mv.z), 1 - Math.exp(-14 * dt));
    }
    player.speed += (speed - player.speed) * (1 - Math.exp(-12 * dt));

    // Timed work sessions (scrubbing, making the bed, watering…).
    const work = istore.work;
    if (work && !paused) {
      const it = getInteractable(work.id);
      if (!it || it.disabledReason || !isInRange(work.id)) {
        istore.setWork(null);
      } else {
        const elapsed = work.elapsed + dt;
        if (elapsed >= work.duration) {
          istore.setWork(null);
          playGesture(300);
          it.run();
        } else {
          istore.setWork({ ...work, elapsed });
        }
      }
    }

    // Vacuum: suck up dust bunnies by walking over them.
    if (g.equipped === 'vacuum' && !paused && !g.completedTasks.includes('vacuum_floor')) {
      for (const d of DUST_SPOTS) {
        if (g.cycle.dustCollected.includes(d.id)) continue;
        if (Math.hypot(d.x - player.x, d.z - player.z) < 0.85) g.collectDust(d.id);
      }
    }

    // Animation state.
    const modal = ui.modal;
    const activeWork = useInteractionStore.getState().work;
    if (activeWork) player.anim = getInteractable(activeWork.id)?.anim ?? 'clean';
    else if (modal === 'cooking') player.anim = 'cook';
    else if (modal === 'dishes') player.anim = 'clean';
    else if (performance.now() < player.gestureUntil) player.anim = 'interact';
    else if (player.speed > 0.25) player.anim = 'walk';
    else player.anim = 'idle';

    // Interaction prompt (throttled).
    nearTimer.current -= dt;
    if (nearTimer.current <= 0) {
      nearTimer.current = 0.1;
      if (paused || ui.placement) istore.setNear(null);
      else {
        const n = findNearest(player.x, player.z);
        istore.setNear(n ? { id: n.id, label: n.label, icon: n.icon, disabledReason: n.disabledReason } : null);
      }
    }

    // Interact key / button.
    if (input.interactQueued && !ui.placement) {
      input.interactQueued = false;
      if (!paused && !useInteractionStore.getState().work) {
        const n = findNearest(player.x, player.z);
        if (n) triggerInteract(n.id);
        else sfx('click');
      }
    }

    // Persist position every couple of seconds.
    saveTimer.current += dt;
    if (saveTimer.current > 2.5) {
      saveTimer.current = 0;
      if (Math.hypot(g.playerPos.x - player.x, g.playerPos.z - player.z) > 0.3) g.setPlayerPos(player.x, player.z);
    }

    if (group.current) {
      group.current.position.set(player.x, 0, player.z);
      group.current.rotation.y = player.yaw;
    }
  });

  return (
    <group ref={group}>
      <Character />
    </group>
  );
}
