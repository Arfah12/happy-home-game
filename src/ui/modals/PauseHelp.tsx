import { useUiStore } from '../../game/store/uiStore';
import { saveNow } from '../../game/systems/save';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export function PauseMenu() {
  const open = useUiStore((s) => s.openModal);
  const close = useUiStore((s) => s.closeModal);
  const setScreen = useUiStore((s) => s.setScreen);
  return (
    <Modal title="Rehat jap" icon="⏸️" width="sm">
      <div className="flex flex-col gap-3 pt-1">
        <Button variant="pink" className="text-lg" onClick={close}>
          ▶️ Sambung main
        </Button>
        <Button onClick={() => open('tasks')}>📋 Senarai kerja</Button>
        <Button onClick={() => open('settings', 'pause')}>⚙️ Tetapan</Button>
        <Button onClick={() => open('help', 'pause')}>❓ Cara main</Button>
        <Button
          onClick={() => {
            saveNow();
            setScreen('menu');
          }}
        >
          🏠 Simpan & menu utama
        </Button>
      </div>
    </Modal>
  );
}

const CONTROLS: [string, string][] = [
  ['Gerak', 'WASD / anak panah · joystick kat telefon · klik lantai'],
  ['Buat kerja', 'E, Space atau Enter · tekan butang besar · klik objek'],
  ['Telefon', 'Butang 📱 – balas chat suami, anak, jiran & mak mertua'],
  ['Pusing perabot', 'R atau butang ⟳ masa letak'],
  ['Rehat / balik', 'Esc'],
];

export function HelpPanel() {
  return (
    <Modal title="Cara main" icon="❓" width="md">
      <div className="space-y-4 text-[15px]">
        <p>
          Selamat datang ke rumah comel awak! Siapkan kerja rumah harian untuk dapat <b>🪙 duit</b> dan <b>⭐ XP</b>. Naik level untuk buka bilik, resipi & perabot baru, lepas tu hias rumah impian awak.
        </p>
        <div className="grid gap-2">
          {CONTROLS.map(([k, v]) => (
            <div key={k} className="flex gap-3 rounded-2xl bg-white p-2.5 shadow-[0_2px_0_#f2d3e0]">
              <span className="font-bold w-32 shrink-0">{k}</span>
              <span className="text-ink-soft">{v}</span>
            </div>
          ))}
        </div>
        <ul className="list-disc pl-5 space-y-1 text-ink-soft">
          <li>Ikut anak panah pink – dia tunjuk kerja seterusnya.</li>
          <li>🕖 Hari bermula 7 pagi. Masak sarapan, lepas tu panggil Adik makan kat meja sebelum dia pergi sekolah (9:30).</li>
          <li>🌇 Lepas 5 petang masak makan malam. Abang balik kerja 6:30 petang – panggil semua makan sekali!</li>
          <li>🌙 Tidur lepas 9 malam. Dah siap awal? Guna butang ⏩ dalam senarai kerja.</li>
          <li>Mop & vakum ada kat rak alatan dalam ruang tamu.</li>
          <li>Mesin basuh jalan sendiri – buat kerja lain sementara tunggu.</li>
          <li>Telefon akan berbunyi 📱 – suami, anak, jiran & mak mertua chat. Pilihan jawapan awak ada kesannya! 😆</li>
          <li>Kadang-kadang ada hal tak dijangka: Oyen berak dalam rumah, hujan turun, jiran hantar makanan…</li>
          <li>Setiap kerja dibayar sekali sehari. Tidur (Tamat hari) untuk hari baru; siapkan semua untuk bonus!</li>
          <li>Beli perabot kat kedai, letak dari inventori. Jalan dekat perabot untuk alihkan.</li>
        </ul>
      </div>
    </Modal>
  );
}
