import { FURNITURE_BY_ID } from '../../game/config/furniture';
import { ROOMS, roomAt } from '../../game/config/layout';
import { sfx, toast } from '../../game/events';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export function Inventory() {
  const inventory = useGameStore((s) => s.inventory);
  const placed = useGameStore((s) => s.placed);
  const storePlaced = useGameStore((s) => s.storePlaced);
  const startPlacement = useUiStore((s) => s.startPlacement);
  const openModal = useUiStore((s) => s.openModal);

  const stored = Object.entries(inventory).filter(([id, q]) => q > 0 && FURNITURE_BY_ID[id]);

  return (
    <Modal title="Inventori" icon="📦" width="md">
      <section>
        <h3 className="font-bold text-lg mb-2">Dalam stor</h3>
        {stored.length === 0 ? (
          <div className="rounded-3xl bg-white p-5 text-center shadow-[0_3px_0_#f2d3e0]">
            <div className="text-4xl" aria-hidden>
              🛋️
            </div>
            <p className="text-ink-soft mt-1">Stor kosong. Beli perabot untuk hias rumah!</p>
            <Button variant="butter" className="mt-3" onClick={() => openModal('shop')}>
              Pergi kedai
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {stored.map(([id, q]) => {
              const f = FURNITURE_BY_ID[id];
              return (
                <li key={id} className="rounded-3xl bg-white p-2.5 flex items-center gap-3 shadow-[0_3px_0_#f2d3e0]">
                  <div className="grid place-items-center w-12 h-12 rounded-2xl text-3xl shrink-0" style={{ background: `${f.color}66` }} aria-hidden>
                    {f.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight">{f.name}</div>
                    <div className="text-xs text-ink-soft">× {q}</div>
                  </div>
                  <Button variant="mint" className="!px-3 !py-2 text-sm" onClick={() => startPlacement({ itemId: id, rot: 0 })}>
                    Letak
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-5">
        <h3 className="font-bold text-lg mb-2">Dalam rumah</h3>
        {placed.length === 0 ? (
          <p className="text-ink-soft text-sm">Belum ada perabot diletak.</p>
        ) : (
          <ul className="space-y-2">
            {placed.map((p) => {
              const f = FURNITURE_BY_ID[p.itemId];
              if (!f) return null;
              const room = roomAt(p.x, p.z);
              return (
                <li key={p.uid} className="rounded-3xl bg-white/80 p-2.5 flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-2xl text-2xl shrink-0" style={{ background: `${f.color}55` }} aria-hidden>
                    {f.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight">{f.name}</div>
                    <div className="text-xs text-ink-soft">{room ? ROOMS[room].name : 'Rumah'}</div>
                  </div>
                  <Button className="!px-3 !py-2 text-sm" onClick={() => startPlacement({ itemId: p.itemId, uid: p.uid, rot: p.rot, x: p.x, z: p.z })}>
                    Alih
                  </Button>
                  <Button
                    className="!px-3 !py-2 text-sm"
                    silent
                    onClick={() => {
                      storePlaced(p.uid);
                      sfx('pop');
                      toast(`${f.name} disimpan dalam stor`, '📦');
                    }}
                  >
                    Simpan
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-ink-soft mt-3">Tip: jalan dekat perabot dan tekan E (atau tap) untuk alihkan.</p>
      </section>
    </Modal>
  );
}
