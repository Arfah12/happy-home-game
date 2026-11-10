import * as THREE from 'three';

/**
 * Procedural canvas textures (floors, labels). Generated once and cached,
 * so the game needs no image downloads.
 */

const cache = new Map<string, THREE.CanvasTexture>();

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas not supported');
  return [c, ctx];
}

function finish(c: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.needsUpdate = true;
  return t;
}

export type FloorPattern = 'tiles' | 'planks' | 'grass' | 'carpet';

export function floorTexture(pattern: FloorPattern, a: string, b: string, repeat: [number, number]): THREE.CanvasTexture {
  const key = `floor|${pattern}|${a}|${b}|${repeat.join('x')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, 128, 128);
  if (pattern === 'tiles') {
    ctx.fillStyle = b;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillRect(64, 64, 64, 64);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 64, 64);
    ctx.strokeRect(64, 0, 64, 64);
    ctx.strokeRect(0, 64, 64, 64);
    ctx.strokeRect(64, 64, 64, 64);
  } else if (pattern === 'planks') {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? b : a;
      ctx.fillRect(0, i * 32, 128, 32);
      ctx.fillStyle = 'rgba(120,80,40,0.18)';
      ctx.fillRect(0, i * 32, 128, 2);
      ctx.fillRect(((i * 47) % 100) + 10, i * 32, 2, 32);
    }
  } else if (pattern === 'carpet') {
    ctx.fillStyle = b;
    for (let y = 0; y < 128; y += 16) {
      for (let x = (y / 16) % 2 ? 8 : 0; x < 128; x += 16) {
        ctx.beginPath();
        ctx.arc(x + 4, y + 4, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // grass: soft speckles
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = rnd() > 0.5 ? b : 'rgba(255,255,255,0.18)';
      ctx.fillRect(rnd() * 128, rnd() * 128, 2, 4);
    }
  }
  const t = finish(c, repeat);
  cache.set(key, t);
  return t;
}

export interface LabelOpts {
  bg?: string;
  fg?: string;
  font?: number;
}

/** A rounded "pill" text label, used for room signs. Returns texture + aspect. */
const labelCache = new Map<string, { tex: THREE.CanvasTexture; aspect: number }>();

export function labelTexture(text: string, o: LabelOpts = {}): { tex: THREE.CanvasTexture; aspect: number } {
  const key = `label|${text}|${o.bg}|${o.fg}|${o.font}`;
  const hit = labelCache.get(key);
  if (hit) return hit;
  const fontPx = o.font ?? 44;
  const font = `600 ${fontPx}px Fredoka, "Trebuchet MS", system-ui, sans-serif`;
  const [m, mctx] = canvas(8, 8);
  void m;
  mctx.font = font;
  const w = Math.ceil(mctx.measureText(text).width) + fontPx * 1.4;
  const h = Math.ceil(fontPx * 1.7);
  const [c, ctx] = canvas(w, h);
  ctx.font = font;
  ctx.fillStyle = o.bg ?? 'rgba(255,255,255,0.92)';
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = o.fg ?? '#7a4b7f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const entry = { tex: finish(c), aspect: w / h };
  labelCache.set(key, entry);
  return entry;
}
