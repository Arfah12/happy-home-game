import { memo } from 'react';
import { FIXTURES } from '../../game/config/layout';
import { Ball, Block, Cyl } from '../primitives';
import { Rug } from '../props/Common';

function BathroomImpl() {
  const [tx, tz] = FIXTURES.toilet.pos;
  const [sx, sz] = FIXTURES.bathSink.pos;
  return (
    <group>
      {/* bathtub */}
      <group position={[-9.22, 0, 6.38]}>
        <Block size={[1.42, 0.62, 3.1]} position={[0, 0.31, 0]} color="#ffffff" radius={0.22} />
        <Block size={[1.1, 0.04, 2.75]} position={[0, 0.58, 0]} color="#9fdcff" m={{ rough: 0.1, opacity: 0.9 }} radius={0.02} cast={false} />
        {[-0.1, 0.25, -0.3, 0.4, 0].map((bx, i) => (
          <Ball key={i} r={0.12 + (i % 2) * 0.05} position={[bx, 0.64, -0.8 + i * 0.35]} color="#ffffff" low cast={false} />
        ))}
        {/* rubber duck */}
        <group position={[0.15, 0.66, 0.6]}>
          <Ball r={0.11} color="#ffd166" scale={[1.2, 0.9, 1]} />
          <Ball r={0.07} position={[0.06, 0.1, 0]} color="#ffd166" />
          <Cyl r={0.03} h={0.06} position={[0.13, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} color="#ff9f43" />
        </group>
        <Cyl r={0.03} h={0.3} position={[-0.6, 0.85, -1.35]} color="#d9d9e6" m={{ metal: 0.6, rough: 0.25 }} />
      </group>
      {/* toilet */}
      <group position={[tx, 0, tz]}>
        <Cyl r={0.22} h={0.42} topRatio={1.15} position={[0, 0.21, 0.05]} color="#ffffff" />
        <Cyl r={0.27} h={0.07} position={[0, 0.45, 0.08]} color="#ffffff" />
        <Block size={[0.55, 0.55, 0.22]} position={[0, 0.65, -0.3]} color="#ffffff" radius={0.06} />
        <Block size={[0.12, 0.04, 0.05]} position={[0.15, 0.88, -0.2]} color="#cfd6e6" radius={0.01} />
      </group>
      {/* vanity + mirror */}
      <group position={[sx, 0, sz]}>
        <Block size={[0.8, 0.85, 1.3]} position={[0, 0.42, 0]} color="#bfe6ff" radius={0.06} />
        <Block size={[0.85, 0.06, 1.35]} position={[0, 0.88, 0]} color="#ffffff" radius={0.03} />
        <Cyl r={0.26} h={0.04} position={[0.05, 0.92, 0]} color="#e2f2fb" cast={false} />
        <Cyl r={0.025} h={0.22} position={[-0.25, 1.02, 0]} color="#d9d9e6" m={{ metal: 0.6, rough: 0.25 }} />
        <Block size={[0.05, 0.9, 0.8]} position={[-0.38, 1.6, 0]} color="#ffffff" radius={0.03} />
        <Block size={[0.03, 0.78, 0.68]} position={[-0.35, 1.6, 0]} color="#dff3ff" m={{ rough: 0.05, metal: 0.4 }} radius={0.02} cast={false} />
        <Cyl r={0.05} h={0.14} position={[0.15, 0.98, 0.45]} color="#ff9fb8" />
        <Cyl r={0.04} h={0.18} position={[0.15, 1.0, 0.3]} color="#9be3c4" />
      </group>
      {/* towel rack */}
      <group position={[-7.5, 0, 7.8]}>
        <Cyl r={0.02} h={0.9} position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]} color="#d9d9e6" />
        <Block size={[0.4, 0.7, 0.06]} position={[-0.2, 1.0, 0]} color="#ffb3c9" radius={0.03} />
        <Block size={[0.35, 0.55, 0.06]} position={[0.22, 1.08, 0]} color="#bfeee0" radius={0.03} />
      </group>
      <Rug position={[-7.3, 0, 4.2]} r={0.7} color="#bfeee0" accent="#ffffff" scale={[1, 1.4]} />
    </group>
  );
}

export const Bathroom = memo(BathroomImpl);
