import { Ball, Block, Cyl, Disc } from '../primitives';

type V3 = [number, number, number];

export function Chair({ position, rotation, color = '#ffb3c9' }: { position: V3; rotation?: V3; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <Block size={[0.46, 0.07, 0.46]} position={[0, 0.46, 0]} color={color} radius={0.03} />
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <Cyl key={i} r={0.028} h={0.44} position={[x, 0.22, z]} color="#e8cba8" />
      ))}
      <Block size={[0.46, 0.5, 0.06]} position={[0, 0.72, -0.2]} color={color} radius={0.03} />
    </group>
  );
}

export function PottedPlant({ position, scale = 1, leaf = '#6cc47a', pot = '#f4a6a6' }: { position: V3; scale?: number; leaf?: string; pot?: string }) {
  return (
    <group position={position} scale={scale}>
      <Cyl r={0.22} h={0.36} topRatio={1.25} position={[0, 0.18, 0]} color={pot} />
      <Ball r={0.3} position={[0, 0.55, 0]} color={leaf} />
      <Ball r={0.22} position={[0.17, 0.72, 0.05]} color={leaf} />
      <Ball r={0.2} position={[-0.15, 0.75, -0.06]} color="#7fd18c" />
    </group>
  );
}

export function FloorLamp({ position, shade = '#fff2b3', glow = true }: { position: V3; shade?: string; glow?: boolean }) {
  return (
    <group position={position}>
      <Cyl r={0.2} h={0.04} position={[0, 0.02, 0]} color="#8f7aa8" />
      <Cyl r={0.025} h={1.4} position={[0, 0.72, 0]} color="#8f7aa8" />
      <Cyl r={0.28} h={0.32} topRatio={0.6} position={[0, 1.5, 0]} color={shade} m={glow ? { emissive: '#ffe08a', emissiveIntensity: 0.5 } : undefined} />
    </group>
  );
}

export function Rug({ position, r = 1, color = '#c9a7ff', accent = '#ffffff', scale = [1, 1] }: { position: V3; r?: number; color?: string; accent?: string; scale?: [number, number] }) {
  return (
    <group position={position}>
      <Disc r={r} position={[0, 0.01, 0]} color={color} scale={scale} />
      <Disc r={r * 0.72} position={[0, 0.014, 0]} color={accent} scale={scale} m={{ opacity: 0.55 }} />
      <Disc r={r * 0.5} position={[0, 0.018, 0]} color={color} scale={scale} />
    </group>
  );
}

export function Shelf({ position, rotation, color = '#f6dcc0' }: { position: V3; rotation?: V3; color?: string }) {
  const books = ['#ff9fb8', '#8bc6ff', '#ffd166', '#9be3c4', '#c9b6ff'];
  return (
    <group position={position} rotation={rotation}>
      <Block size={[1.8, 0.06, 0.4]} position={[0, 0.02, 0]} color={color} radius={0.02} />
      <Block size={[1.8, 0.06, 0.4]} position={[0, 0.6, 0]} color={color} radius={0.02} />
      <Block size={[0.06, 0.62, 0.4]} position={[-0.87, 0.3, 0]} color={color} radius={0.02} />
      <Block size={[0.06, 0.62, 0.4]} position={[0.87, 0.3, 0]} color={color} radius={0.02} />
      {books.map((c, i) => (
        <Block key={i} size={[0.1, 0.42, 0.3]} position={[-0.6 + i * 0.12, 0.27, 0]} rotation={[0, 0, i === 4 ? 0.25 : 0]} color={c} radius={0.015} />
      ))}
      <Ball r={0.13} position={[0.45, 0.18, 0]} color="#ffe08a" />
    </group>
  );
}
