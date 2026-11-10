import { memo } from 'react';
import { FIXTURES } from '../../game/config/layout';
import { UPGRADES } from '../../game/config/levels';
import { useGameStore } from '../../game/store/gameStore';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl } from '../primitives';
import { FloorLamp, PottedPlant, Rug, Shelf } from '../props/Common';

function Sofa({ makeover }: { makeover: boolean }) {
  const [x, z] = FIXTURES.sofa.pos;
  const body = makeover ? '#9fd3c7' : '#ffa8b8';
  const cushion = makeover ? '#c2eadf' : '#ffd0da';
  return (
    <group position={[x, 0, z]}>
      <Block size={[3.3, 0.42, 1.15]} position={[0, 0.27, 0]} color={body} radius={0.14} />
      <Block size={[3.3, 0.7, 0.32]} position={[0, 0.7, -0.42]} color={body} radius={0.14} />
      <Block size={[0.34, 0.6, 1.15]} position={[-1.5, 0.52, 0]} color={body} radius={0.14} />
      <Block size={[0.34, 0.6, 1.15]} position={[1.5, 0.52, 0]} color={body} radius={0.14} />
      {[-0.68, 0.68].map((cx) => (
        <Block key={cx} size={[1.3, 0.16, 0.85]} position={[cx, 0.55, 0.08]} color={cushion} radius={0.07} />
      ))}
      <Block size={[0.5, 0.45, 0.16]} position={[-0.95, 0.85, -0.18]} rotation={[0.2, 0.2, 0.1]} color="#fff3a3" radius={0.07} />
      <Block size={[0.5, 0.45, 0.16]} position={[0.95, 0.85, -0.18]} rotation={[0.2, -0.2, -0.1]} color="#c9b6ff" radius={0.07} />
      {[-1.45, 1.45].map((lx) => (
        <Cyl key={lx} r={0.04} h={0.1} position={[lx, 0.04, 0.4]} color="#b98b63" />
      ))}
    </group>
  );
}

function ToolRack({ equipped }: { equipped: string }) {
  const mopClick = clickInteract('tool_mop');
  const vacClick = clickInteract('tool_vacuum');
  return (
    <group position={[-1.8, 0, -1.5]}>
      <Block size={[0.12, 1.5, 1.8]} position={[0, 0.95, 0]} color="#f6dcc0" radius={0.04} />
      <Block size={[0.18, 0.06, 1.9]} position={[0.05, 1.72, 0]} color="#ffb3cf" radius={0.02} />
      {/* mop */}
      {equipped !== 'mop' && (
        <group position={[0.2, 0, -0.45]} onClick={mopClick}>
          <Cyl r={0.03} h={1.45} position={[0, 0.85, 0]} color="#8bc6ff" />
          <Block size={[0.14, 0.12, 0.4]} position={[0, 0.12, 0]} color="#ffffff" radius={0.04} />
          {[-0.12, -0.04, 0.04, 0.12].map((s) => (
            <Cyl key={s} r={0.03} h={0.14} position={[0, 0.05, s]} color="#e8f6ff" cast={false} />
          ))}
        </group>
      )}
      {/* upright vacuum */}
      {equipped !== 'vacuum' && (
        <group position={[0.25, 0, 0.45]} onClick={vacClick}>
          <Block size={[0.32, 0.12, 0.45]} position={[0, 0.07, 0]} color="#c9b6ff" radius={0.05} />
          <Block size={[0.26, 0.55, 0.22]} position={[-0.02, 0.45, 0]} color="#ff9fb8" radius={0.09} />
          <Cyl r={0.025} h={0.75} position={[-0.05, 1.05, 0]} color="#8f7aa8" />
          <Block size={[0.06, 0.06, 0.2]} position={[-0.05, 1.43, 0]} color="#8f7aa8" radius={0.02} />
        </group>
      )}
      {/* label hooks */}
      <Ball r={0.04} position={[0.08, 1.55, -0.45]} color="#ffffff" />
      <Ball r={0.04} position={[0.08, 1.55, 0.45]} color="#ffffff" />
    </group>
  );
}

function LivingRoomImpl() {
  const level = useGameStore((s) => s.level);
  const equipped = useGameStore((s) => s.equipped);
  const makeover = level >= UPGRADES.livingMakeover;
  return (
    <group>
      <Rug position={[4, 0, -4.6]} r={1.9} color={makeover ? '#a7dcc9' : '#ffcfe0'} accent="#ffffff" scale={[1.35, 0.9]} />
      <Sofa makeover={makeover} />
      <FloorLamp position={[FIXTURES.livingLamp.pos[0], 0, FIXTURES.livingLamp.pos[1]]} />
      <PottedPlant position={[FIXTURES.livingPlant.pos[0], 0, FIXTURES.livingPlant.pos[1]]} scale={1.15} />
      <Shelf position={[0.4, 1.25, -7.7]} />
      <ToolRack equipped={equipped} />
      {/* small side table with a lamp beside the sofa */}
      <group position={[1.9, 0, -7.35]}>
        <Cyl r={0.26} h={0.5} position={[0, 0.25, 0]} color="#fff1e0" />
        <Ball r={0.12} position={[0, 0.62, 0]} color="#fff3a3" m={{ emissive: '#ffe08a', emissiveIntensity: 0.6 }} />
      </group>
    </group>
  );
}

export const LivingRoom = memo(LivingRoomImpl);
