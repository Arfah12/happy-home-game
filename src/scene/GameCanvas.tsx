import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../game/store/gameStore';
import { useUiStore } from '../game/store/uiStore';
import type { GraphicsQuality } from '../game/types';
import { CameraRig } from './CameraRig';
import { GameLoop, NearHighlight, PlacementController, TaskMarker } from './GameSystems';
import { House } from './House';
import { SkyLights } from './SkyLights';
import { Family } from './Family';
import { Player } from './Player';
import { PlacedFurniture, PlacementGhost } from './furniture/PlacedFurniture';
import { QualityContext } from './primitives';
import { ClothesPiles, DustBunnies, Stains, Toys } from './props/TaskObjects';
import { WorldEvents } from './props/WorldEvents';
import { Bathroom } from './rooms/Bathroom';
import { Bedroom } from './rooms/Bedroom';
import { Garden, KidsRoom, Sunroom } from './rooms/ExtraRooms';
import { Kitchen } from './rooms/Kitchen';
import { Laundry } from './rooms/Laundry';
import { LivingRoom } from './rooms/LivingRoom';

const DPR: Record<GraphicsQuality, [number, number]> = {
  low: [0.6, 1],
  medium: [1, 1.5],
  high: [1, 2],
};

function World() {
  return (
    <>
      <House />
      <Kitchen />
      <LivingRoom />
      <Bathroom />
      <Laundry />
      <Bedroom />
      <KidsRoom />
      <Sunroom />
      <Garden />
      <Stains />
      <DustBunnies />
      <ClothesPiles />
      <Toys />
      <WorldEvents />
      <Family />
      <PlacedFurniture />
    </>
  );
}

export default function GameCanvas() {
  const quality = useGameStore((s) => s.settings.quality);
  const setSceneReady = useUiStore((s) => s.setSceneReady);
  const setWebglError = useUiStore((s) => s.setWebglError);

  useEffect(() => () => setSceneReady(false), [setSceneReady]);

  return (
    <Canvas
      // Re-create the renderer when quality changes (antialias can't be toggled live).
      key={quality}
      className="!absolute inset-0 touch-none"
      shadows={quality !== 'low' ? 'soft' : false}
      dpr={DPR[quality]}
      flat
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 45, near: 0.5, far: 140, position: [4, 12, 6] }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          setWebglError('Grafik terputus (mungkin memori peranti tak cukup).');
        });
        canvas.addEventListener('webglcontextrestored', () => setWebglError(null));
      }}
      onPointerMissed={() => undefined}
    >
      <QualityContext.Provider value={quality}>
        <SkyLights quality={quality} />
        <World />
        <Player />
        <CameraRig />
        <GameLoop />
        <PlacementController />
        <PlacementGhost />
        <TaskMarker />
        <NearHighlight />
        <ReadySignal onReady={() => setSceneReady(true)} />
      </QualityContext.Provider>
    </Canvas>
  );
}

/** Marks the scene as ready once the first frames have actually rendered. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) onReady();
  });
  return null;
}
