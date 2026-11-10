import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { Button } from '../common/Button';

const TIPS = [
  'Ikut anak panah pink untuk cari kerja seterusnya.',
  'Mesin basuh jalan sendiri – masak sarapan sementara tunggu!',
  'Siapkan semua kerja sebelum tidur untuk bonus hari sempurna.',
  'Kalau abang chat, jangan lupa balas 😆',
  'Panggil Adik sarapan sebelum dia pergi sekolah! 🎒',
  'Abang balik 6:30 petang – siapkan makan malam 🍲',
  'Hujan turun? Cepat angkat kain kat ampaian! ☔',
  'Level tinggi buka bilik baru & resipi sedap.',
];

export function LoadingScreen() {
  const tip = TIPS[Math.floor((Date.now() / 1000) % TIPS.length)];
  return (
    <div className="absolute inset-0 z-[60] grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#fff4f9,#ffd6e6)] animate-fade-in">
      <div className="text-center px-6">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full border-8 border-candy-light border-t-candy animate-spin" />
          <div className="absolute inset-0 grid place-items-center text-4xl" aria-hidden>
            🏡
          </div>
        </div>
        <div className="mt-5 text-2xl font-bold">Tengah kemas rumah…</div>
        <p className="mt-2 text-ink-soft max-w-xs mx-auto">💡 {tip}</p>
      </div>
    </div>
  );
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function WebGLFallback({ message }: { message: string }) {
  const setQuality = useGameStore((s) => s.updateSettings);
  return (
    <div className="absolute inset-0 z-[70] grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#fff4f9,#ffd6e6)] p-5">
      <div className="panel max-w-md p-6 text-center">
        <div className="text-5xl" aria-hidden>
          🥺
        </div>
        <h2 className="text-2xl font-bold mt-2">Grafik 3D tak dapat dibuka</h2>
        <p className="text-ink-soft mt-2">{message}</p>
        <ul className="text-left text-sm text-ink-soft mt-3 list-disc pl-5 space-y-1">
          <li>Hidupkan hardware acceleration dalam tetapan browser.</li>
          <li>Update browser atau cuba Chrome, Edge, Firefox atau Safari.</li>
          <li>Tutup tab lain yang berat dan cuba lagi.</li>
        </ul>
        <div className="flex flex-col gap-2 mt-5">
          <Button
            variant="pink"
            onClick={() => {
              setQuality({ quality: 'low' });
              useUiStore.getState().setWebglError(null);
              window.location.reload();
            }}
          >
            Cuba lagi (kualiti rendah)
          </Button>
          <Button onClick={() => useUiStore.getState().setScreen('menu')}>Balik menu</Button>
        </div>
        <p className="text-xs text-ink-soft mt-3">Progress awak selamat – dah disimpan dalam peranti ni.</p>
      </div>
    </div>
  );
}

interface BoundaryState {
  error: Error | null;
}

/** Catches renderer crashes so a WebGL problem never takes the whole UI down. */
export class SceneErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[scene] crashed', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <WebGLFallback message={`Ada masalah masa lukis rumah (${this.state.error.message}).`} />;
    }
    return this.props.children;
  }
}
