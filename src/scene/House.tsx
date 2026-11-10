import { memo, useMemo } from 'react';
import { ROOMS, ROOM_ORDER, WALLS, WALL_THICKNESS, wallSegments, type RoomDef } from '../game/config/layout';
import { UPGRADES, roomUnlockLevel } from '../game/config/levels';
import { isNight } from '../game/logic/time';
import { useGameStore } from '../game/store/gameStore';
import type { RoomId } from '../game/types';
import { Label } from './Label';
import { clickFloor } from './interactClick';
import { Ball, Block, Cyl, GEO, mat } from './primitives';
import { floorTexture } from './textures';

function Floor({ room, locked }: { room: RoomDef; locked: boolean }) {
  const [x0, z0, x1, z1] = room.rect;
  const w = x1 - x0;
  const d = z1 - z0;
  const tex = useMemo(
    () => floorTexture(room.pattern, room.floor, room.floorAlt, [w / (room.pattern === 'tiles' ? 1.6 : 2.4), d / (room.pattern === 'tiles' ? 1.6 : 2.4)]),
    [room, w, d],
  );
  return (
    <group>
      <mesh
        geometry={GEO.plane}
        material={mat('#ffffff', { map: tex, rough: 0.9 })}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(x0 + x1) / 2, 0.001, (z0 + z1) / 2]}
        scale={[w, d, 1]}
        receiveShadow
        onClick={clickFloor}
      />
      {locked && (
        <>
          <mesh
            geometry={GEO.plane}
            material={mat('#8f86a3', { opacity: 0.62 })}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[(x0 + x1) / 2, 0.02, (z0 + z1) / 2]}
            scale={[w, d, 1]}
          />
          <LockedSign room={room.id} x={(x0 + x1) / 2} z={(z0 + z1) / 2} />
        </>
      )}
    </group>
  );
}

function LockedSign({ room, x, z }: { room: RoomId; x: number; z: number }) {
  const lv = roomUnlockLevel(room);
  return (
    <group position={[x, 0, z]}>
      <Cyl r={0.06} h={1.2} position={[0, 0.6, 0]} color="#c9a27c" />
      <Block size={[1.3, 0.8, 0.08]} position={[0, 1.35, 0]} color="#fff5e1" radius={0.06} />
      <Ball r={0.17} position={[0, 1.42, 0.06]} color="#ffb84d" scale={[1, 1, 0.5]} />
      <Block size={[0.26, 0.2, 0.08]} position={[0, 1.24, 0.06]} color="#ff9f1c" radius={0.03} />
      <Label text={`🔒 ${ROOMS[room].name} · Lv ${lv}`} position={[0, 2.25, 0]} height={0.5} bg="rgba(77,57,92,0.88)" fg="#ffffff" />
      {/* construction cones */}
      <Cyl r={0.22} h={0.5} topRatio={0.15} position={[-1.4, 0.25, 0.6]} color="#ff9f43" />
      <Cyl r={0.22} h={0.5} topRatio={0.15} position={[1.5, 0.25, -0.5]} color="#ff9f43" />
    </group>
  );
}

function Walls({ trim, wall }: { trim: string; wall: string }) {
  const parts = useMemo(() => {
    const out: { key: string; size: [number, number, number]; pos: [number, number, number]; fence: boolean }[] = [];
    WALLS.forEach((w, wi) => {
      wallSegments(w).forEach(([a, b], si) => {
        const len = b - a;
        const mid = (a + b) / 2;
        const size: [number, number, number] =
          w.axis === 'x' ? [len + WALL_THICKNESS, w.height, WALL_THICKNESS] : [WALL_THICKNESS, w.height, len + WALL_THICKNESS];
        const pos: [number, number, number] = w.axis === 'x' ? [mid, w.height / 2, w.at] : [w.at, w.height / 2, mid];
        out.push({ key: `${wi}-${si}`, size, pos, fence: w.kind === 'fence' });
      });
    });
    return out;
  }, []);

  return (
    <group>
      {parts.map((p) =>
        p.fence ? (
          <Fence key={p.key} size={p.size} pos={p.pos} />
        ) : (
          <group key={p.key}>
            <Block size={p.size} position={p.pos} color={wall} radius={0.04} receive />
            {/* pastel cap / trim on top of every wall */}
            <Block
              size={[p.size[0] + 0.06, 0.07, p.size[2] + 0.06]}
              position={[p.pos[0], p.size[1] + 0.03, p.pos[2]]}
              color={trim}
              radius={0.03}
              m={trim === '#f6c945' ? { metal: 0.6, rough: 0.3 } : undefined}
            />
          </group>
        ),
      )}
    </group>
  );
}

function Fence({ size, pos }: { size: [number, number, number]; pos: [number, number, number] }) {
  const alongX = size[0] > size[2];
  const len = alongX ? size[0] : size[2];
  const count = Math.max(2, Math.floor(len / 0.5));
  const pickets = Array.from({ length: count }, (_, i) => -len / 2 + (i + 0.5) * (len / count));
  return (
    <group position={[pos[0], 0, pos[2]]}>
      {pickets.map((o, i) => (
        <Block
          key={i}
          size={[0.14, 0.7, 0.08]}
          position={alongX ? [o, 0.35, 0] : [0, 0.35, o]}
          rotation={alongX ? [0, 0, 0] : [0, Math.PI / 2, 0]}
          color="#ffffff"
          radius={0.03}
        />
      ))}
      <Block size={alongX ? [len, 0.08, 0.06] : [0.06, 0.08, len]} position={[0, 0.48, 0]} color="#fff3f8" radius={0} />
      <Block size={alongX ? [len, 0.08, 0.06] : [0.06, 0.08, len]} position={[0, 0.2, 0]} color="#fff3f8" radius={0} />
    </group>
  );
}

/** Windows, frames and wall decor on the tall back walls. */
function WallDecor({ makeover, dream, night }: { makeover: boolean; dream: boolean; night: boolean }) {
  const windows = [-6.2, 1.2, 7.2, 13.5];
  const pane = night ? '#2a3566' : '#bfe6ff';
  const paneM = night ? { rough: 0.15, emissive: '#7d8fd6', emissiveIntensity: 0.25 } : { rough: 0.15, emissive: '#bfe6ff', emissiveIntensity: 0.35 };
  return (
    <group>
      {windows.map((x) => (
        <group key={x} position={[x, 1.55, -7.86]}>
          <Block size={[1.7, 1.15, 0.06]} color="#ffffff" radius={0.04} />
          <Block size={[1.5, 0.95, 0.05]} position={[0, 0, 0.02]} color={pane} m={paneM} radius={0.02} cast={false} />
          <Block size={[0.05, 0.95, 0.07]} position={[0, 0, 0.04]} color="#ffffff" radius={0} cast={false} />
          <Block size={[1.5, 0.05, 0.07]} position={[0, 0, 0.04]} color="#ffffff" radius={0} cast={false} />
          {/* curtains */}
          <Block size={[0.32, 1.35, 0.06]} position={[-0.95, -0.05, 0.07]} color={makeover && x > -2 && x < 10 ? '#9fe0c9' : '#ffb8cf'} radius={0.05} />
          <Block size={[0.32, 1.35, 0.06]} position={[0.95, -0.05, 0.07]} color={makeover && x > -2 && x < 10 ? '#9fe0c9' : '#ffb8cf'} radius={0.05} />
          {/* window sill flowers */}
          <Block size={[1.8, 0.07, 0.2]} position={[0, -0.62, 0.1]} color="#ffffff" radius={0.02} />
        </group>
      ))}
      {/* west-wall windows */}
      {[-4.5, 4.5].map((z) => (
        <group key={z} position={[-9.86, 1.55, z]} rotation={[0, Math.PI / 2, 0]}>
          <Block size={[1.5, 1.05, 0.06]} color="#ffffff" radius={0.04} />
          <Block size={[1.3, 0.85, 0.05]} position={[0, 0, 0.02]} color={pane} m={paneM} radius={0.02} cast={false} />
        </group>
      ))}
      {/* picture frames in the living room */}
      <group position={[3.2, 1.75, -7.86]}>
        <Block size={[0.7, 0.55, 0.05]} color={makeover ? '#f6c945' : '#ffffff'} radius={0.03} />
        <Block size={[0.56, 0.41, 0.03]} position={[0, 0, 0.025]} color="#ffd6a5" radius={0.01} cast={false} />
        <Ball r={0.09} position={[0.1, 0.05, 0.05]} color="#ff9fb8" scale={[1, 1, 0.3]} cast={false} />
      </group>
      <group position={[4.9, 1.75, -7.86]}>
        <Block size={[0.55, 0.7, 0.05]} color={makeover ? '#f6c945' : '#ffffff'} radius={0.03} />
        <Block size={[0.41, 0.56, 0.03]} position={[0, 0, 0.025]} color="#b9e4c9" radius={0.01} cast={false} />
        <Cyl r={0.12} h={0.02} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} color="#fff7a8" cast={false} />
      </group>
      {makeover && (
        <group>
          {/* striped wallpaper panel behind the sofa */}
          {Array.from({ length: 12 }, (_, i) => (
            <Block key={i} size={[0.24, 2.4, 0.02]} position={[-1.6 + i * 1.0, 1.25, -7.87]} color={i % 2 ? '#ffe3ec' : '#fff1f5'} radius={0} cast={false} />
          ))}
          {/* pendant lamp */}
          <Cyl r={0.015} h={1.1} position={[4, 2.25, -4.6]} color="#8f7aa8" cast={false} />
          <Cyl r={0.45} h={0.35} topRatio={0.35} position={[4, 1.55, -4.6]} color="#ffe6a8" m={{ emissive: '#ffd27a', emissiveIntensity: 0.6 }} />
        </group>
      )}
      {dream && <FairyLights />}
    </group>
  );
}

function FairyLights() {
  const bulbs = Array.from({ length: 34 }, (_, i) => i);
  const colors = ['#fff3a3', '#ffc2e2', '#bde0ff', '#c9ffd8'];
  return (
    <group>
      {bulbs.map((i) => {
        const x = -9.6 + i * 0.8;
        const y = 2.45 - Math.abs(Math.sin(i * 0.9)) * 0.22;
        return (
          <Ball key={i} r={0.06} position={[x, y, -7.78]} color={colors[i % 4]} m={{ emissive: colors[i % 4], emissiveIntensity: 1.4 }} cast={false} low />
        );
      })}
    </group>
  );
}

function Outside() {
  const trees = useMemo(
    () => [
      [-13, -5], [-13.5, 2], [-12.5, 9], [-13, 14], [20, -6], [20.5, 1], [19.8, 8], [20.4, 14],
      [-6, 18], [2, 18.5], [9, 18], [15, 18.2], [-3, -11], [6, -11.2], [13, -10.8],
    ],
    [],
  );
  return (
    <group>
      <mesh geometry={GEO.plane} material={mat('#c4e8b0', { rough: 1 })} rotation={[-Math.PI / 2, 0, 0]} position={[3.5, -0.02, 3.5]} scale={[90, 90, 1]} receiveShadow onClick={clickFloor} />
      {/* path from the bedroom door into the garden */}
      {[8.6, 9.4, 10.2].map((z, i) => (
        <Cyl key={z} r={0.42} h={0.04} position={[3.5 + (i % 2 ? 0.2 : -0.15), 0.02, z]} color="#f1e4d3" cast={false} receive />
      ))}
      {trees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} scale={0.9 + ((i * 37) % 10) / 20}>
          <Cyl r={0.22} h={1.2} position={[0, 0.6, 0]} color="#b98b63" />
          <Ball r={1.15} position={[0, 1.9, 0]} color={i % 3 === 0 ? '#9ed98a' : i % 3 === 1 ? '#86cc7a' : '#ffc4dc'} />
          <Ball r={0.8} position={[0.55, 2.5, 0.2]} color={i % 3 === 2 ? '#ffd6e7' : '#a8e398'} />
        </group>
      ))}
    </group>
  );
}

function HouseImpl() {
  const level = useGameStore((s) => s.level);
  const unlocked = useGameStore((s) => s.unlockedRooms);
  const night = useGameStore((s) => isNight(s.clock));
  const dream = level >= UPGRADES.dreamHouse;
  const makeover = level >= UPGRADES.livingMakeover;
  return (
    <group>
      <Outside />
      {ROOM_ORDER.map((id) => (
        <Floor key={id} room={ROOMS[id]} locked={!unlocked.includes(id)} />
      ))}
      <Walls trim={dream ? '#f6c945' : '#ffb3cf'} wall={dream ? '#fffaf0' : '#fff6ee'} />
      <WallDecor makeover={makeover} dream={dream} night={night} />
    </group>
  );
}

export const House = memo(HouseImpl);
