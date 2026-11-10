import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { CLOTHES_PILES, TOYS } from '../game/config/layout';
import { useGameStore } from '../game/store/gameStore';
import { player } from '../game/systems/playerState';
import type { AnimState, ToolId } from '../game/types';
import { Ball, Block, Cyl } from './primitives';
import { Toy } from './props/TaskObjects';

/* ───────────────────────── Looks ───────────────────────── */

export interface Look {
  skin: string;
  outfit: 'dress' | 'shirt';
  top: string;
  bottom: string;
  apron: boolean;
  hair: 'bun' | 'hijab' | 'short' | 'pigtails';
  hairColor: string;
  hijabColor: string;
  shoes: string;
  scale: number;
  mustache?: boolean;
}

export const MAMA_LOOK: Look = {
  skin: '#ffd9c2',
  outfit: 'dress',
  top: '#ff8fb5',
  bottom: '#ff8fb5',
  apron: true,
  hair: 'bun',
  hairColor: '#7a4a3a',
  hijabColor: '#f59ac0',
  shoes: '#c9a7ff',
  scale: 1,
};

export const ADIK_LOOK: Look = {
  skin: '#ffd9c2',
  outfit: 'dress',
  top: '#ffd166',
  bottom: '#ffd166',
  apron: false,
  hair: 'pigtails',
  hairColor: '#4a2f25',
  hijabColor: '#ffffff',
  shoes: '#ff7eb6',
  scale: 0.66,
};

export const ABANG_LOOK: Look = {
  skin: '#f2c9a8',
  outfit: 'shirt',
  top: '#8bc6ff',
  bottom: '#3d4a6b',
  apron: false,
  hair: 'short',
  hairColor: '#2b2320',
  hijabColor: '#ffffff',
  shoes: '#3b2f2a',
  scale: 1.1,
  mustache: true,
};

/* ───────────────────────── Tudung geometry ───────────────────────── */

const hijabMats = new Map<string, THREE.MeshStandardMaterial>();
function hijabMat(color: string) {
  let m = hijabMats.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide });
    hijabMats.set(color, m);
  }
  return m;
}
// A full crown cap plus a side/back piece with an opening for the face.
const HIJAB_CROWN = new THREE.SphereGeometry(0.3, 28, 10, 0, Math.PI * 2, 0, Math.PI * 0.3);
const HIJAB_SIDES = new THREE.SphereGeometry(0.3, 28, 14, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, Math.PI * 0.29, Math.PI * 0.5);

/* ───────────────────────── Poses ───────────────────────── */

interface Pose {
  lShoulderX: number;
  lShoulderZ: number;
  rShoulderX: number;
  rShoulderZ: number;
  lElbow: number;
  rElbow: number;
  lHip: number;
  rHip: number;
  lKnee: number;
  rKnee: number;
  torsoX: number;
  torsoY: number;
  headX: number;
  headZ: number;
  bob: number;
}

const ZERO: Pose = {
  lShoulderX: 0, lShoulderZ: 0, rShoulderX: 0, rShoulderZ: 0, lElbow: 0, rElbow: 0,
  lHip: 0, rHip: 0, lKnee: 0, rKnee: 0, torsoX: 0, torsoY: 0, headX: 0, headZ: 0, bob: 0,
};

const HIP_Y = 0.55;

/** Target pose for an animation state at time t. Pure. */
function targetPose(anim: AnimState, t: number, speed: number, carrying: boolean, scale: number): Pose {
  const p: Pose = { ...ZERO };
  // Vertical offset (in local units) so the hips sit on a 0.5 m chair seat.
  const seatBob = 0.5 / scale - HIP_Y;
  const floorBob = 0.12 / scale - HIP_Y;
  switch (anim) {
    case 'walk': {
      const f = 9 + speed * 1.2;
      const s = Math.sin(t * f);
      p.lHip = s * 0.6;
      p.rHip = -s * 0.6;
      p.lKnee = Math.max(0, -s) * 0.7;
      p.rKnee = Math.max(0, s) * 0.7;
      p.lShoulderX = -s * 0.55;
      p.rShoulderX = s * 0.55;
      p.lElbow = -0.35;
      p.rElbow = -0.35;
      p.bob = Math.abs(Math.cos(t * f)) * 0.05;
      p.torsoX = 0.06;
      p.headZ = Math.sin(t * f * 0.5) * 0.04;
      break;
    }
    case 'interact':
      p.rShoulderX = -1.35;
      p.rElbow = -0.3;
      p.lShoulderX = -0.2;
      p.torsoX = 0.12;
      p.headX = 0.15;
      break;
    case 'cook': {
      // Stirring motion with the right arm, left hand holding the pan.
      p.rShoulderX = -1.0 + Math.sin(t * 7) * 0.18;
      p.rShoulderZ = -0.15 + Math.cos(t * 7) * 0.18;
      p.rElbow = -0.9;
      p.lShoulderX = -0.85;
      p.lElbow = -0.8;
      p.torsoX = 0.12;
      p.headX = 0.25;
      p.headZ = Math.sin(t * 2) * 0.08;
      p.bob = Math.abs(Math.sin(t * 3.5)) * 0.015;
      break;
    }
    case 'clean': {
      // Sweeping / scrubbing side to side with both arms.
      const s = Math.sin(t * 8);
      p.rShoulderX = -0.9;
      p.lShoulderX = -0.9;
      p.rShoulderZ = s * 0.35;
      p.lShoulderZ = s * 0.35;
      p.rElbow = -0.4;
      p.lElbow = -0.4;
      p.torsoX = 0.28;
      p.torsoY = s * 0.25;
      p.lKnee = 0.25;
      p.rKnee = 0.25;
      p.lHip = -0.15;
      p.rHip = -0.15;
      p.headX = 0.2;
      p.bob = -0.04;
      break;
    }
    case 'water': {
      p.rShoulderX = -1.1;
      p.rElbow = -0.2;
      p.rShoulderZ = Math.sin(t * 3) * 0.1;
      p.lShoulderX = -0.3;
      p.torsoX = 0.18;
      p.headX = 0.3;
      break;
    }
    case 'sit': {
      p.lHip = -1.45;
      p.rHip = -1.45;
      p.lKnee = 1.45;
      p.rKnee = 1.45;
      p.bob = seatBob;
      p.lShoulderX = -0.35;
      p.rShoulderX = -0.35;
      p.lElbow = -0.6;
      p.rElbow = -0.6;
      p.torsoX = -0.08;
      p.headZ = Math.sin(t * 0.6) * 0.06;
      p.headX = -0.05 + Math.sin(t * 0.4) * 0.04;
      break;
    }
    case 'eat': {
      // Sitting at the table, spoon to mouth every couple of seconds.
      const bite = Math.max(0, Math.sin(t * 2.6));
      p.lHip = -1.45;
      p.rHip = -1.45;
      p.lKnee = 1.45;
      p.rKnee = 1.45;
      p.bob = seatBob;
      p.rShoulderX = -0.9 - bite * 0.7;
      p.rElbow = -0.6 - bite * 1.1;
      p.lShoulderX = -0.6;
      p.lElbow = -0.7;
      p.torsoX = 0.12;
      p.headX = 0.15 - bite * 0.12;
      p.headZ = Math.sin(t * 1.3) * 0.05;
      break;
    }
    case 'floor': {
      // Sitting on the floor, playing.
      const s = Math.sin(t * 3);
      p.lHip = -1.5;
      p.rHip = -1.5;
      p.lKnee = 0.15;
      p.rKnee = 0.15;
      p.bob = floorBob;
      p.lShoulderX = -0.7 + s * 0.3;
      p.rShoulderX = -0.7 - s * 0.3;
      p.lElbow = -0.5;
      p.rElbow = -0.5;
      p.torsoX = 0.15;
      p.headX = 0.25;
      p.headZ = Math.sin(t * 1.1) * 0.12;
      break;
    }
    default: {
      // Idle: gentle breathing and a little sway.
      p.lShoulderZ = 0.08 + Math.sin(t * 1.6) * 0.03;
      p.rShoulderZ = -0.08 - Math.sin(t * 1.6) * 0.03;
      p.lElbow = -0.15;
      p.rElbow = -0.15;
      p.bob = Math.sin(t * 1.6) * 0.008;
      p.headZ = Math.sin(t * 0.7) * 0.06;
      p.headX = Math.sin(t * 0.5) * 0.03;
    }
  }
  if (carrying) {
    // Arms forward to hold the basket / toys.
    p.lShoulderX = -1.0;
    p.rShoulderX = -1.0;
    p.lShoulderZ = 0.2;
    p.rShoulderZ = -0.2;
    p.lElbow = -0.6;
    p.rElbow = -0.6;
  }
  return p;
}

/* ───────────────────────── Person model ───────────────────────── */

/** Mutable animation source, read every frame (player singleton or an NPC's state). */
export interface AnimSource {
  anim: AnimState;
  speed: number;
  carrying?: boolean;
}

interface PersonProps {
  look: Look;
  src: AnimSource;
  /** Extra hair override (e.g. the player's tudung setting). */
  hijab?: boolean;
  /** Rendered in the right hand. */
  hand?: ReactNode;
  /** Rendered in front of the chest (carried things). */
  front?: ReactNode;
}

/** A cute articulated person: legs, arms with elbows, torso, head with face. */
export function Person({ look, src, hijab, hand, front }: PersonProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lFore = useRef<THREE.Group>(null);
  const rFore = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lShin = useRef<THREE.Group>(null);
  const rShin = useRef<THREE.Group>(null);
  const pose = useRef<Pose>({ ...ZERO });
  const blink = useRef<THREE.Group>(null);
  const blinkOffset = useRef(Math.random() * 3);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const target = targetPose(src.anim, t, src.speed, !!src.carrying && src.anim !== 'clean', look.scale);
    const k = 1 - Math.exp(-14 * Math.min(dt, 0.05));
    const p = pose.current;
    (Object.keys(p) as (keyof Pose)[]).forEach((key) => {
      p[key] += (target[key] - p[key]) * k;
    });
    if (root.current) root.current.position.y = p.bob;
    if (torso.current) {
      torso.current.rotation.x = p.torsoX;
      torso.current.rotation.y = p.torsoY;
    }
    if (head.current) {
      head.current.rotation.x = p.headX;
      head.current.rotation.z = p.headZ;
    }
    if (lArm.current) lArm.current.rotation.set(p.lShoulderX, 0, 0.12 + p.lShoulderZ);
    if (rArm.current) rArm.current.rotation.set(p.rShoulderX, 0, -0.12 + p.rShoulderZ);
    if (lFore.current) lFore.current.rotation.x = p.lElbow;
    if (rFore.current) rFore.current.rotation.x = p.rElbow;
    if (lLeg.current) lLeg.current.rotation.x = p.lHip;
    if (rLeg.current) rLeg.current.rotation.x = p.rHip;
    if (lShin.current) lShin.current.rotation.x = p.lKnee;
    if (rShin.current) rShin.current.rotation.x = p.rKnee;
    if (blink.current) {
      const b = (t + blinkOffset.current) % 3.6;
      blink.current.scale.y = b < 0.12 ? 0.15 : 1;
    }
  });

  const legColor = look.outfit === 'shirt' ? look.bottom : look.skin;
  const sleeve = look.top;
  const hair = hijab ? 'hijab' : look.hair;

  const leg = (side: 1 | -1, legRef: RefObject<THREE.Group | null>, shinRef: RefObject<THREE.Group | null>) => (
    <group ref={legRef} position={[0.1 * side, HIP_Y, 0]}>
      <Cyl r={0.065} h={0.28} position={[0, -0.14, 0]} color={legColor} />
      <group ref={shinRef} position={[0, -0.28, 0]}>
        <Cyl r={0.058} h={0.24} position={[0, -0.12, 0]} color={legColor} />
        <Block size={[0.13, 0.08, 0.22]} position={[0, -0.26, 0.04]} color={look.shoes} radius={0.04} />
        {look.outfit === 'dress' && <Ball r={0.04} position={[0, -0.22, 0.13]} color="#ffffff" low cast={false} />}
      </group>
    </group>
  );

  const arm = (side: 1 | -1, armRef: RefObject<THREE.Group | null>, foreRef: RefObject<THREE.Group | null>, children?: ReactNode) => (
    <group ref={armRef} position={[0.2 * side, 1.13, 0]}>
      <Ball r={0.07} color={sleeve} low />
      <Cyl r={0.05} h={0.2} position={[0, -0.11, 0]} color={look.outfit === 'shirt' ? sleeve : look.skin} />
      <group ref={foreRef} position={[0, -0.21, 0]}>
        <Cyl r={0.045} h={0.19} position={[0, -0.095, 0]} color={look.skin} />
        <group position={[0, -0.22, 0]}>
          <Ball r={0.055} color={look.skin} low />
          {children}
        </group>
      </group>
    </group>
  );

  return (
    <group scale={look.scale}>
      <group ref={root}>
        {leg(-1, lLeg, lShin)}
        {leg(1, rLeg, rShin)}
        <group ref={torso} position={[0, 0.5, 0]}>
          <group position={[0, -0.5, 0]}>
            {look.outfit === 'dress' ? (
              <>
                <Cyl r={0.36} h={0.5} topRatio={0.5} position={[0, 0.7, 0]} color={look.top} />
                <Cyl r={0.2} h={0.3} topRatio={0.85} position={[0, 1.05, 0]} color={look.top} />
              </>
            ) : (
              <>
                {/* trousers seat + shirt */}
                <Cyl r={0.2} h={0.18} position={[0, 0.6, 0]} color={look.bottom} />
                <Cyl r={0.22} h={0.5} topRatio={0.95} position={[0, 0.93, 0]} color={look.top} />
                <Block size={[0.12, 0.08, 0.03]} position={[0, 1.15, 0.19]} rotation={[-0.3, 0, 0]} color="#ffffff" radius={0.01} cast={false} />
                <Cyl r={0.21} h={0.03} position={[0, 0.69, 0]} color="#2b2320" cast={false} />
              </>
            )}
            {look.apron && (
              <>
                <Block size={[0.34, 0.42, 0.04]} position={[0, 0.72, 0.29]} rotation={[-0.32, 0, 0]} color="#ffffff" radius={0.03} />
                <Block size={[0.2, 0.18, 0.04]} position={[0, 1.04, 0.19]} rotation={[-0.08, 0, 0]} color="#ffffff" radius={0.03} />
                <Ball r={0.04} position={[0, 0.98, 0.21]} color="#ff7eb6" low cast={false} />
                <Cyl r={0.21} h={0.04} position={[0, 0.94, 0]} color="#ffffff" />
              </>
            )}
            <Cyl r={0.06} h={0.1} position={[0, 1.24, 0]} color={look.skin} />
            {arm(-1, lArm, lFore)}
            {arm(1, rArm, rFore, hand)}
            {front}
            {/* head */}
            <group ref={head} position={[0, 1.45, 0]}>
              <Ball r={0.27} color={look.skin} />
              {hair === 'hijab' && (
                <>
                  <mesh geometry={HIJAB_CROWN} material={hijabMat(look.hijabColor)} position={[0, 0.01, -0.01]} castShadow />
                  <mesh geometry={HIJAB_SIDES} material={hijabMat(look.hijabColor)} position={[0, 0.01, -0.01]} castShadow />
                  <Cyl r={0.31} h={0.34} topRatio={0.5} position={[0, -0.27, -0.01]} color={look.hijabColor} />
                  <Ball r={0.025} position={[0, -0.2, 0.2]} color="#fff3a3" m={{ metal: 0.5, rough: 0.3 }} low cast={false} />
                </>
              )}
              {hair === 'bun' && (
                <>
                  <Ball r={0.29} position={[0, 0.05, -0.04]} color={look.hairColor} scale={[1, 0.95, 0.95]} />
                  <Ball r={0.13} position={[0, 0.26, -0.2]} color={look.hairColor} />
                  <Ball r={0.06} position={[0.09, 0.32, -0.16]} color="#ff7eb6" low />
                  <Ball r={0.12} position={[0.13, 0.13, 0.17]} color={look.hairColor} scale={[1.2, 0.6, 0.6]} />
                  <Ball r={0.11} position={[-0.12, 0.15, 0.17]} color={look.hairColor} scale={[1.1, 0.55, 0.6]} />
                </>
              )}
              {hair === 'pigtails' && (
                <>
                  <Ball r={0.29} position={[0, 0.06, -0.04]} color={look.hairColor} scale={[1, 0.95, 0.95]} />
                  <Ball r={0.13} position={[0.29, 0.02, -0.04]} color={look.hairColor} scale={[0.8, 1.2, 0.8]} />
                  <Ball r={0.13} position={[-0.29, 0.02, -0.04]} color={look.hairColor} scale={[0.8, 1.2, 0.8]} />
                  <Ball r={0.05} position={[0.25, 0.13, -0.02]} color="#ff7eb6" low />
                  <Ball r={0.05} position={[-0.25, 0.13, -0.02]} color="#ff7eb6" low />
                  <Ball r={0.13} position={[0, 0.17, 0.16]} color={look.hairColor} scale={[1.6, 0.5, 0.6]} />
                </>
              )}
              {hair === 'short' && (
                <>
                  <Ball r={0.285} position={[0, 0.07, -0.03]} color={look.hairColor} scale={[1, 0.85, 0.95]} />
                  <Ball r={0.1} position={[0.08, 0.2, 0.17]} color={look.hairColor} scale={[1.8, 0.5, 0.6]} />
                </>
              )}
              {/* face */}
              <group ref={blink} position={[0, -0.02, 0.24]}>
                <Ball r={0.038} position={[0.09, 0, 0]} color="#2f2b3a" scale={[1, 1.25, 0.6]} low cast={false} />
                <Ball r={0.038} position={[-0.09, 0, 0]} color="#2f2b3a" scale={[1, 1.25, 0.6]} low cast={false} />
                <Ball r={0.012} position={[0.1, 0.018, 0.022]} color="#ffffff" low cast={false} />
                <Ball r={0.012} position={[-0.08, 0.018, 0.022]} color="#ffffff" low cast={false} />
              </group>
              <Ball r={0.045} position={[0.15, -0.08, 0.2]} color="#ffb3c4" scale={[1, 0.6, 0.4]} low cast={false} />
              <Ball r={0.045} position={[-0.15, -0.08, 0.2]} color="#ffb3c4" scale={[1, 0.6, 0.4]} low cast={false} />
              {look.mustache && <Ball r={0.05} position={[0, -0.075, 0.25]} color={look.hairColor} scale={[1.4, 0.35, 0.4]} low cast={false} />}
              <mesh position={[0, -0.11, 0.245]} rotation={[0, 0, Math.PI]} scale={0.045}>
                <torusGeometry args={[1, 0.25, 6, 14, Math.PI]} />
                <meshStandardMaterial color="#d9506f" />
              </mesh>
            </group>
          </group>
        </group>
      </group>
      {/* soft blob shadow for grounding */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#5b4a6b" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── Player (Mama) ───────────────────────── */

function HeldTool({ tool }: { tool: ToolId }) {
  // Positioned relative to the right hand (local -Y points down the arm).
  if (tool === 'mop')
    return (
      <group rotation={[1.2, 0, 0]}>
        <Cyl r={0.025} h={1.25} position={[0, -0.3, 0]} color="#8bc6ff" />
        <Block size={[0.4, 0.1, 0.14]} position={[0, -0.95, 0]} color="#ffffff" radius={0.04} />
      </group>
    );
  if (tool === 'vacuum')
    return (
      <group rotation={[0.9, 0, 0]}>
        <Cyl r={0.022} h={0.8} position={[0, -0.35, 0]} color="#8f7aa8" />
        <Block size={[0.22, 0.42, 0.18]} position={[0, -0.75, 0.04]} color="#ff9fb8" radius={0.07} />
        <Block size={[0.38, 0.09, 0.26]} position={[0, -0.98, 0.08]} color="#c9b6ff" radius={0.04} />
      </group>
    );
  if (tool === 'can')
    return (
      <group position={[0, -0.12, 0.05]}>
        <Cyl r={0.13} h={0.22} color="#7ee0b0" />
        <Cyl r={0.022} h={0.28} position={[0, 0.02, 0.17]} rotation={[1.0, 0, 0]} color="#7ee0b0" />
      </group>
    );
  return null;
}

/** The player character: Mama, with her tools and whatever she's carrying. */
export function Character() {
  const equipped = useGameStore((s) => s.equipped);
  const hijab = useGameStore((s) => s.settings.hijab);
  const clothes = useGameStore((s) => (s.cycle.washer === 'empty' && !s.completedTasks.includes('do_laundry') ? s.cycle.clothesCollected.length : 0));
  const toys = useGameStore((s) => s.cycle.toysCarried);
  player.carrying = clothes > 0 || toys.length > 0;

  const front = (
    <>
      {clothes > 0 && (
        <group position={[0, 0.98, 0.36]}>
          <Block size={[0.5, 0.22, 0.32]} color="#e9c89f" radius={0.06} />
          {Array.from({ length: Math.min(clothes, CLOTHES_PILES.length) }, (_, i) => (
            <Ball key={i} r={0.13} position={[(i - 1) * 0.13, 0.13, 0]} color={CLOTHES_PILES[i].color} scale={[1, 0.55, 0.9]} low />
          ))}
        </group>
      )}
      {toys.length > 0 && clothes === 0 && (
        <group position={[0, 0.85, 0.36]} scale={0.7}>
          {toys.slice(0, 3).map((id, i) => {
            const toy = TOYS.find((x) => x.id === id);
            return toy ? (
              <group key={id} position={[(i - 1) * 0.25, i * 0.12, 0]}>
                <Toy kind={toy.kind} color={toy.color} />
              </group>
            ) : null;
          })}
        </group>
      )}
    </>
  );

  return <Person look={MAMA_LOOK} src={player} hijab={hijab} hand={<HeldTool tool={equipped} />} front={front} />;
}
