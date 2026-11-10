import { useEffect, useState, type ReactNode } from 'react';
import { sfx, toast } from '../../game/events';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import {
  downloadProgress,
  getCloudUser,
  isCloudConfigured,
  onCloudAuthChange,
  signInWithEmail,
  signOut,
  uploadProgress,
  type CloudUser,
} from '../../game/systems/cloudSave';
import { clearLocal } from '../../game/systems/save';
import { teleportPlayer } from '../../game/systems/playerState';
import type { GraphicsQuality } from '../../game/types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="font-semibold">{label}</span>
      <div className="flex-1 max-w-[60%] flex justify-end">{children}</div>
    </div>
  );
}

function CloudSection() {
  const [user, setUser] = useState<CloudUser | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isCloudConfigured) return;
    let unsub = () => {};
    void getCloudUser().then(setUser);
    void onCloudAuthChange(setUser).then((u) => (unsub = u));
    return () => unsub();
  }, []);

  if (!isCloudConfigured) {
    return (
      <p className="text-sm text-ink-soft rounded-2xl bg-white p-3">
        ☁️ Simpanan awan tak aktif. Progress awak disimpan automatik dalam peranti ni. (Developer: masukkan kunci Supabase dalam <code>.env</code> untuk aktifkan.)
      </p>
    );
  }

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await fn());
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <form
        className="rounded-2xl bg-white p-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const r = await signInWithEmail(email.trim());
            return r.ok ? 'Semak inbox untuk link log masuk ✉️' : r.error;
          });
        }}
      >
        <p className="text-sm text-ink-soft">Log masuk untuk backup rumah awak & main kat peranti lain.</p>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Alamat e-mel"
            className="flex-1 min-w-0 rounded-xl border-2 border-candy-light px-3 py-2 outline-none focus:border-candy"
          />
          <Button variant="sky" type="submit" disabled={busy} className="!py-2">
            Hantar link
          </Button>
        </div>
        {msg && <p className="text-sm font-semibold">{msg}</p>}
      </form>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-3 space-y-2">
      <p className="text-sm">
        Log masuk sebagai <b>{user.email}</b>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="sky"
          className="!py-2 text-sm"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const r = await uploadProgress();
              return r.ok ? 'Dah simpan dalam awan ☁️' : r.error;
            })
          }
        >
          ⬆️ Upload
        </Button>
        <Button
          className="!py-2 text-sm"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const r = await downloadProgress();
              if (!r.ok) return r.error;
              if (!r.data) return 'Belum ada simpanan awan.';
              useGameStore.getState().loadSave(r.data);
              teleportPlayer(r.data.playerPos.x, r.data.playerPos.z);
              return 'Simpanan awan dimuatkan ✅';
            })
          }
        >
          ⬇️ Download
        </Button>
        <Button className="!py-2 text-sm" disabled={busy} onClick={() => void run(async () => (await signOut(), 'Dah log keluar'))}>
          Log keluar
        </Button>
      </div>
      {msg && <p className="text-sm font-semibold">{msg}</p>}
    </div>
  );
}

export function Settings() {
  const settings = useGameStore((s) => s.settings);
  const update = useGameStore((s) => s.updateSettings);
  const reset = useGameStore((s) => s.resetGame);
  const [confirmReset, setConfirmReset] = useState(false);

  const qualities: { id: GraphicsQuality; label: string }[] = [
    { id: 'low', label: 'Rendah' },
    { id: 'medium', label: 'Sederhana' },
    { id: 'high', label: 'Tinggi' },
  ];

  return (
    <Modal title="Tetapan" icon="⚙️" width="md">
      <h3 className="font-bold text-lg">Bunyi</h3>
      <div className="divide-y divide-candy-light">
        <Row label="🎵 Muzik">
          <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} onChange={(e) => update({ musicVolume: Number(e.target.value) })} className="w-full" aria-label="Kelantangan muzik" />
        </Row>
        <Row label="🔔 Kesan bunyi">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sfxVolume}
            onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
            onPointerUp={() => sfx('pop')}
            className="w-full"
            aria-label="Kelantangan kesan bunyi"
          />
        </Row>
        <Row label="🔇 Senyap semua">
          <button
            role="switch"
            aria-checked={settings.muted}
            onClick={() => update({ muted: !settings.muted })}
            className={`relative w-14 h-8 rounded-full transition ${settings.muted ? 'bg-candy' : 'bg-candy-light'}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${settings.muted ? 'left-7' : 'left-1'}`} />
          </button>
        </Row>
      </div>

      <h3 className="font-bold text-lg mt-4">Grafik & watak</h3>
      <div className="divide-y divide-candy-light">
        <Row label="✨ Kualiti">
          <div className="flex rounded-2xl bg-white p-1 shadow-inner" role="radiogroup" aria-label="Kualiti grafik">
            {qualities.map((q) => (
              <button
                key={q.id}
                role="radio"
                aria-checked={settings.quality === q.id}
                onClick={() => {
                  sfx('click');
                  update({ quality: q.id });
                }}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${settings.quality === q.id ? 'bg-candy text-white' : 'text-ink-soft'}`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </Row>
        <Row label="🧕 Pakai tudung">
          <button
            role="switch"
            aria-checked={settings.hijab}
            onClick={() => update({ hijab: !settings.hijab })}
            className={`relative w-14 h-8 rounded-full transition ${settings.hijab ? 'bg-candy' : 'bg-candy-light'}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${settings.hijab ? 'left-7' : 'left-1'}`} />
          </button>
        </Row>
        <Row label="🎥 Jarak kamera">
          <input type="range" min={8} max={16} step={0.5} value={settings.cameraDistance} onChange={(e) => update({ cameraDistance: Number(e.target.value) })} className="w-full" aria-label="Jarak kamera" />
        </Row>
      </div>
      <p className="text-xs text-ink-soft mt-1">Guna “Rendah” untuk telefon lama supaya lebih lancar (tiada bayang, bentuk ringkas).</p>

      <h3 className="font-bold text-lg mt-4 mb-2">Simpanan awan</h3>
      <CloudSection />

      <h3 className="font-bold text-lg mt-4 mb-2">Progress</h3>
      <Button
        variant={confirmReset ? 'pink' : 'white'}
        className="w-full"
        onClick={() => {
          if (!confirmReset) return setConfirmReset(true);
          reset();
          clearLocal();
          const pos = useGameStore.getState().playerPos;
          teleportPlayer(pos.x, pos.z);
          setConfirmReset(false);
          useUiStore.getState().setScreen('menu');
          toast('Progress dipadam. Mula baru!', '🌱');
        }}
      >
        {confirmReset ? 'Tekan sekali lagi untuk padam semua' : '🗑️ Padam progress'}
      </Button>
    </Modal>
  );
}
