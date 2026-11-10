import { memo } from 'react';
import { FIXTURES } from '../../game/config/layout';
import { useGameStore } from '../../game/store/gameStore';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl } from '../primitives';
import { FloorLamp, PottedPlant, Rug } from '../props/Common';

function Bed({ made }: { made: boolean }) {
  const [x, z] = FIXTURES.bed.pos;
  const onClick = clickInteract('bed');
  return (
    // Bed lies along X with the headboard against the east wall.
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
      <Block size={[2.0, 0.35, 2.6]} position={[0, 0.2, 0]} color="#f6dcc0" radius={0.08} onClick={onClick} />
      <Block size={[1.9, 0.25, 2.45]} position={[0, 0.47, 0]} color="#ffffff" radius={0.1} onClick={onClick} />
      <Block size={[2.1, 1.1, 0.14]} position={[0, 0.62, -1.3]} color="#ffb3cf" radius={0.12} />
      {made ? (
        <>
          <Block size={[1.95, 0.08, 1.75]} position={[0, 0.62, 0.35]} color="#c9b6ff" radius={0.04} onClick={onClick} />
          <Block size={[1.95, 0.09, 0.3]} position={[0, 0.63, -0.45]} color="#ffffff" radius={0.04} />
          <Block size={[0.75, 0.16, 0.42]} position={[-0.45, 0.68, -0.88]} color="#fff7fb" radius={0.08} />
          <Block size={[0.75, 0.16, 0.42]} position={[0.45, 0.68, -0.88]} color="#fff7fb" radius={0.08} />
          <Ball r={0.13} position={[0, 0.74, -0.7]} color="#ffd6e7" scale={[1.2, 0.8, 0.6]} />
        </>
      ) : (
        <>
          <Block size={[1.7, 0.14, 1.5]} position={[0.15, 0.66, 0.4]} rotation={[0, 0.35, 0.05]} color="#c9b6ff" radius={0.07} onClick={onClick} />
          <Ball r={0.3} position={[-0.4, 0.7, 0.2]} color="#c9b6ff" scale={[1.3, 0.45, 1]} />
          <Block size={[0.75, 0.16, 0.42]} position={[0.5, 0.72, -0.7]} rotation={[0.3, 0.6, 0.2]} color="#fff7fb" radius={0.08} />
          <Block size={[0.75, 0.16, 0.42]} position={[-0.9, 0.3, 1.0]} rotation={[0.9, 0.3, 0]} color="#fff7fb" radius={0.08} />
        </>
      )}
    </group>
  );
}

function BedroomImpl() {
  const made = useGameStore((s) => s.cycle.bedMade);
  const [nx, nz] = FIXTURES.nightstandBuiltIn.pos;
  const [wx, wz] = FIXTURES.wardrobe.pos;
  return (
    <group>
      <Bed made={made} />
      <group position={[nx, 0, nz]}>
        <Block size={[0.6, 0.55, 0.6]} position={[0, 0.28, 0]} color="#ffffff" radius={0.06} />
        <Ball r={0.03} position={[-0.31, 0.3, 0]} color="#ffb3cf" cast={false} />
        <Cyl r={0.05} h={0.25} position={[0, 0.68, 0]} color="#c9b6ff" />
        <Cyl r={0.17} h={0.18} topRatio={0.6} position={[0, 0.88, 0]} color="#fff2b3" m={{ emissive: '#ffe08a', emissiveIntensity: 0.6 }} />
      </group>
      <group position={[wx, 0, wz]}>
        <Block size={[2.0, 2.0, 0.75]} position={[0, 1.0, 0]} color="#fff1e0" radius={0.08} />
        <Block size={[0.03, 1.8, 0.02]} position={[0, 1.02, 0.38]} color="#e8cba8" radius={0} cast={false} />
        <Block size={[0.05, 0.3, 0.05]} position={[-0.12, 1.1, 0.4]} color="#ffb3cf" radius={0.02} />
        <Block size={[0.05, 0.3, 0.05]} position={[0.12, 1.1, 0.4]} color="#ffb3cf" radius={0.02} />
      </group>
      <Rug position={[5.6, 0, 4.0]} r={1.3} color="#ffd6e7" accent="#ffffff" scale={[1.2, 1]} />
      <FloorLamp position={[9.4, 0, 0.6]} shade="#ffd6e7" />
      <PottedPlant position={[1.6, 0, 7.4]} leaf="#7fd18c" pot="#c9b6ff" />
    </group>
  );
}

export const Bedroom = memo(BedroomImpl);
