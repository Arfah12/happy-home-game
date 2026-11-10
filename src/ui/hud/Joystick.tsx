import { useEffect, useRef, useState } from 'react';
import { input } from '../../game/systems/input';

const RADIUS = 52;

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(() =>
    typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window),
  );
  useEffect(() => {
    // Switch to touch controls the first time the screen is touched (hybrid devices).
    const onTouch = () => setTouch(true);
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);
  return touch;
}

/** Floating virtual joystick – writes straight into the shared input state. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    input.joy.x = dx / RADIUS;
    input.joy.y = dy / RADIUS;
    input.moveTarget = null;
  };

  const release = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    input.joy.x = 0;
    input.joy.y = 0;
  };

  useEffect(() => release, []);

  return (
    <div
      ref={base}
      role="application"
      aria-label="Joystick gerak"
      className="relative w-36 h-36 rounded-full bg-white/45 border-4 border-white/80 shadow-[0_8px_24px_rgba(91,61,102,0.25)] backdrop-blur-sm touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current = e.pointerId;
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <div
        className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full bg-gradient-to-b from-[#ff9ac4] to-candy shadow-[0_4px_0_#d94b86] border-4 border-white"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
