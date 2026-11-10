import { useMemo } from 'react';
import { labelTexture, type LabelOpts } from './textures';

interface LabelProps extends LabelOpts {
  text: string;
  position: [number, number, number];
  height?: number;
}

/** Camera-facing text sign rendered from a cached canvas texture. */
export function Label({ text, position, height = 0.55, bg, fg, font }: LabelProps) {
  const { tex, aspect } = useMemo(() => labelTexture(text, { bg, fg, font }), [text, bg, fg, font]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
    </sprite>
  );
}
