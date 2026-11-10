import { memo } from 'react';
import { FIXTURES, SINK_POS, STOVE_POS } from '../../game/config/layout';
import { UPGRADES } from '../../game/config/levels';
import { DINNER_START } from '../../game/logic/time';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { clickInteract } from '../interactClick';
import { Ball, Block, Cyl, Disc } from '../primitives';
import { Puffs } from '../props/Effects';
import { Chair } from '../props/Common';

const CAB = '#fff7ec';
const DOOR = '#bfeee0';

function Stove({ deluxe, cooking, cooked }: { deluxe: boolean; cooking: boolean; cooked: boolean }) {
  const { x, z } = STOVE_POS;
  const burner = cooking ? { emissive: '#ff6b3d', emissiveIntensity: 1.3 } : undefined;
  const onClick = clickInteract('stove');
  return (
    <group position={[x, 0, z]}>
      {/* oven front */}
      <Block size={[0.95, 0.62, 0.04]} position={[0, 0.43, 0.48]} color={deluxe ? '#ff9fb8' : '#ececf3'} radius={0.03} onClick={onClick} />
      <Block size={[0.62, 0.3, 0.03]} position={[0, 0.45, 0.5]} color="#3d3a4f" radius={0.02} m={{ rough: 0.2 }} cast={false} onClick={onClick} />
      <Block size={[0.5, 0.04, 0.05]} position={[0, 0.68, 0.53]} color={deluxe ? '#f6c945' : '#b9b6c9'} m={deluxe ? { metal: 0.6, rough: 0.3 } : undefined} radius={0.02} />
      {/* cook top */}
      <Block size={[0.98, 0.04, 0.9]} position={[0, 0.97, 0]} color={deluxe ? '#2f2b3a' : '#4a4658'} m={{ rough: 0.3 }} radius={0.02} onClick={onClick} />
      {[[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]].map(([bx, bz], i) => (
        <Cyl key={i} r={0.14} h={0.012} position={[bx, 1.0, bz]} color={cooking ? '#ff8a5c' : '#2a2733'} m={burner} cast={false} />
      ))}
      {/* knobs */}
      {[-0.3, -0.1, 0.1, 0.3].map((kx) => (
        <Cyl key={kx} r={0.035} h={0.04} position={[kx, 0.88, 0.49]} rotation={[Math.PI / 2, 0, 0]} color="#ffffff" cast={false} />
      ))}
      {/* frying pan */}
      <group position={[-0.22, 1.04, 0.2]}>
        <Cyl r={0.2} h={0.05} color="#3b3846" m={{ rough: 0.35 }} onClick={onClick} />
        <Block size={[0.32, 0.03, 0.05]} position={[0.32, 0.01, 0.06]} rotation={[0, -0.3, 0]} color="#ffb3c9" radius={0.015} />
        {cooking && <Cyl r={0.14} h={0.02} position={[0, 0.03, 0]} color="#ffe27a" cast={false} />}
      </group>
      {/* little teapot */}
      <group position={[0.22, 1.08, -0.18]}>
        <Ball r={0.13} color="#9fd8ff" scale={[1, 0.85, 1]} />
        <Cyl r={0.03} h={0.14} position={[0.15, 0.03, 0]} rotation={[0, 0, -0.9]} color="#9fd8ff" cast={false} />
        <Ball r={0.035} position={[0, 0.12, 0]} color="#ffffff" cast={false} />
      </group>
      <Puffs active={cooking || cooked} position={[-0.22, 1.1, 0.2]} count={cooking ? 6 : 3} />
      {/* range hood */}
      <Block size={[1.1, 0.35, 0.6]} position={[0, 2.0, -0.15]} color={deluxe ? '#ffb3c9' : '#f2eef8'} radius={0.08} />
      {deluxe && <Block size={[1.12, 0.06, 0.62]} position={[0, 1.83, -0.15]} color="#f6c945" m={{ metal: 0.7, rough: 0.25 }} radius={0.02} />}
    </group>
  );
}

function Sink({ dishesDone, washing }: { dishesDone: boolean; washing: boolean }) {
  const { x, z } = SINK_POS;
  const onClick = clickInteract('sink');
  return (
    <group position={[x, 0, z]}>
      <Block size={[1.05, 0.03, 0.62]} position={[0, 0.975, 0.05]} color="#d4e9f5" m={{ rough: 0.2, metal: 0.2 }} radius={0.01} cast={false} onClick={onClick} />
      <Block size={[1.12, 0.05, 0.08]} position={[0, 0.99, 0.38]} color="#ffffff" radius={0.02} cast={false} />
      {/* faucet */}
      <Cyl r={0.04} h={0.38} position={[0, 1.15, -0.32]} color="#d9d9e6" m={{ metal: 0.6, rough: 0.25 }} />
      <Cyl r={0.035} h={0.3} position={[0, 1.33, -0.18]} rotation={[Math.PI / 2, 0, 0]} color="#d9d9e6" m={{ metal: 0.6, rough: 0.25 }} />
      {/* dirty plate stack */}
      {!dishesDone &&
        [0, 1, 2, 3].map((i) => (
          <group key={i} position={[(i % 2) * 0.08 - 0.04, 1.0 + i * 0.035, 0.05]} onClick={onClick}>
            <Cyl r={0.22} h={0.03} color="#ffffff" />
            <Disc r={0.05} position={[0.05, 0.017, 0.04]} color="#a8794b" />
            <Disc r={0.035} position={[-0.07, 0.017, -0.03]} color="#8bc34a" />
          </group>
        ))}
      <Puffs active={washing} position={[0, 1.02, 0.05]} color="#dff3ff" count={7} spread={0.28} rise={0.45} size={0.07} />
      {/* drying rack with clean plates */}
      {dishesDone && (
        <group position={[0.95, 1.0, 0]}>
          <Block size={[0.6, 0.04, 0.45]} color="#ffb3c9" radius={0.02} />
          {[-0.18, -0.06, 0.06, 0.18].map((px) => (
            <Cyl key={px} r={0.2} h={0.025} position={[px, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} color="#ffffff" m={{ rough: 0.3 }} />
          ))}
        </group>
      )}
    </group>
  );
}

function DiningTable({ breakfast, breakfastEaten, dinner, dinnerEaten }: { breakfast: boolean; breakfastEaten: boolean; dinner: boolean; dinnerEaten: boolean }) {
  const [x, z] = FIXTURES.diningTable.pos;
  return (
    <group position={[x, 0, z]}>
      <Cyl r={0.38} h={0.05} position={[0, 0.025, 0]} color="#e8cba8" />
      <Cyl r={0.09} h={0.7} position={[0, 0.38, 0]} color="#e8cba8" />
      <Cyl r={0.85} h={0.06} position={[0, 0.75, 0]} color="#fff1e0" />
      <Cyl r={0.7} h={0.008} position={[0, 0.785, 0]} color="#ffd6e3" cast={false} />
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
        <Chair key={a} position={[Math.sin(a) * 1.1, 0, Math.cos(a) * 1.1]} rotation={[0, a + Math.PI, 0]} color={a === 0 ? '#ffb3c9' : '#bfe6ff'} />
      ))}
      {/* vase */}
      <Cyl r={0.08} h={0.2} position={[0.25, 0.89, -0.25]} color="#c9b6ff" />
      <Ball r={0.08} position={[0.25, 1.05, -0.25]} color="#ff7eb6" />
      {breakfast && (
        // breakfast for Adik, at his seat
        <group position={[0.55, 0.8, -0.3]}>
          <Cyl r={0.22} h={0.025} color="#ffffff" />
          {!breakfastEaten &&
            [0, 1, 2].map((i) => <Cyl key={i} r={0.14 - i * 0.01} h={0.045} position={[0, 0.035 + i * 0.045, 0]} color="#f2c27b" />)}
          {breakfastEaten && <Disc r={0.05} position={[0.05, 0.016, 0.03]} color="#e8b26a" />}
          <Cyl r={0.05} h={0.11} position={[0.28, 0.06, 0.05]} color="#ffffff" />
          <Cyl r={0.042} h={0.01} position={[0.28, 0.115, 0.05]} color={breakfastEaten ? '#ffffff' : '#c58b5c'} cast={false} />
        </group>
      )}
      {dinner && (
        <group position={[0, 0.79, 0]}>
          {/* rice pot + dishes in the middle */}
          <Cyl r={0.17} h={0.14} position={[0.05, 0.07, 0.05]} color="#e6e1f0" />
          {!dinnerEaten && <Ball r={0.15} position={[0.05, 0.13, 0.05]} color="#ffffff" scale={[1, 0.4, 1]} />}
          <Cyl r={0.15} h={0.05} position={[-0.3, 0.025, 0.12]} color="#ffd6a5" />
          {!dinnerEaten && <Ball r={0.11} position={[-0.3, 0.06, 0.12]} color="#b5502c" scale={[1, 0.35, 1]} />}
          <Cyl r={0.13} h={0.05} position={[0.32, 0.025, -0.15]} color="#bfeee0" />
          {!dinnerEaten && <Ball r={0.09} position={[0.32, 0.06, -0.15]} color="#5fbf5f" scale={[1, 0.4, 1]} />}
          {/* a plate in front of every seat */}
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
            <group key={a} position={[Math.sin(a) * 0.55, 0.01, Math.cos(a) * 0.55]}>
              <Cyl r={0.17} h={0.02} color="#ffffff" />
              {!dinnerEaten && <Ball r={0.09} position={[0, 0.03, 0]} color="#fffaf0" scale={[1, 0.35, 1]} />}
            </group>
          ))}
          {!dinnerEaten && <Puffs active position={[0.05, 0.18, 0.05]} count={3} spread={0.08} rise={0.4} size={0.05} />}
        </group>
      )}
    </group>
  );
}

function KitchenImpl() {
  const level = useGameStore((s) => s.level);
  const cooked = useGameStore((s) => s.completedTasks.includes('cook_breakfast'));
  const dishesDone = useGameStore((s) => s.completedTasks.includes('wash_dishes'));
  const modal = useUiStore((s) => s.modal);
  const breakfastEaten = useGameStore((s) => s.family.adikAteBreakfast);
  const dinnerCooked = useGameStore((s) => s.family.dinnerCooked);
  const dinnerEaten = useGameStore((s) => s.family.dinnerEaten);
  const evening = useGameStore((s) => s.clock >= DINNER_START);
  const deluxe = level >= UPGRADES.kitchenDeluxe;
  return (
    <group>
      {/* fridge */}
      <group position={[-9.42, 0, -7.45]}>
        <Block size={[0.98, 2.0, 0.92]} position={[0, 1.0, 0]} color={deluxe ? '#ffd6e3' : '#bfeee0'} radius={0.1} />
        <Block size={[0.94, 0.02, 0.02]} position={[0, 1.3, 0.47]} color="#ffffff" radius={0} cast={false} />
        <Block size={[0.05, 0.4, 0.06]} position={[0.36, 1.6, 0.48]} color="#ffffff" radius={0.02} />
        <Block size={[0.05, 0.4, 0.06]} position={[0.36, 0.9, 0.48]} color="#ffffff" radius={0.02} />
        <Ball r={0.06} position={[-0.2, 1.7, 0.47]} color="#ff7eb6" scale={[1, 1, 0.4]} cast={false} />
        <Ball r={0.05} position={[0, 1.55, 0.47]} color="#ffd166" scale={[1, 1, 0.4]} cast={false} />
      </group>
      {/* cabinet run */}
      <Block size={[6.3, 0.9, 0.95]} position={[-5.75, 0.45, -7.45]} color={CAB} radius={0.05} receive />
      <Block size={[6.36, 0.07, 1.0]} position={[-5.75, 0.935, -7.45]} color={deluxe ? '#fff0f5' : '#fdfbff'} m={{ rough: 0.35 }} radius={0.03} receive />
      {[-8.35, -6.25, -4.25, -3.2].map((dx) => (
        <group key={dx} position={[dx, 0.45, -6.96]}>
          <Block size={[0.8, 0.7, 0.03]} color={DOOR} radius={0.04} cast={false} />
          <Ball r={0.035} position={[0.28, 0.2, 0.03]} color="#ffffff" cast={false} />
        </group>
      ))}
      {/* upper shelf with jars */}
      <Block size={[2.2, 0.06, 0.32]} position={[-3.9, 1.75, -7.72]} color="#f6dcc0" radius={0.02} />
      {[
        [-4.7, '#ffd166'],
        [-4.25, '#ff9fb8'],
        [-3.8, '#9be3c4'],
        [-3.3, '#c9b6ff'],
      ].map(([jx, c]) => (
        <group key={jx as number} position={[jx as number, 1.92, -7.72]}>
          <Cyl r={0.1} h={0.26} color="#f7fbff" m={{ opacity: 0.85, rough: 0.2 }} />
          <Cyl r={0.08} h={0.16} position={[0, -0.03, 0]} color={c as string} cast={false} />
          <Cyl r={0.11} h={0.05} position={[0, 0.15, 0]} color={c as string} />
        </group>
      ))}
      <Stove deluxe={deluxe} cooking={modal === 'cooking'} cooked={cooked} />
      <Sink dishesDone={dishesDone} washing={modal === 'dishes'} />
      <DiningTable breakfast={cooked && !evening} breakfastEaten={breakfastEaten} dinner={dinnerCooked} dinnerEaten={dinnerEaten} />
      {/* kitchen mat */}
      <Disc r={1} position={[-6.3, 0.012, -5.9]} color="#ffd6a5" scale={[1.4, 0.5]} />
    </group>
  );
}

export const Kitchen = memo(KitchenImpl);
