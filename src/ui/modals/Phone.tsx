import { useEffect, useRef } from 'react';
import { CONTACTS, CONTACT_ORDER } from '../../game/config/phoneEvents';
import { useGameStore } from '../../game/store/gameStore';
import { useUiStore } from '../../game/store/uiStore';
import type { ContactId } from '../../game/types';
import { Modal } from '../common/Modal';

export function Hearts({ value }: { value: number }) {
  // 0..10 → five hearts with halves
  return (
    <span className="text-xs tracking-tight" aria-label={`Hubungan ${value}/10`}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = value - i * 2;
        return <span key={i}>{v >= 2 ? '❤️' : v === 1 ? '🩷' : '🤍'}</span>;
      })}
    </span>
  );
}

function Avatar({ c, size = 'w-11 h-11 text-2xl' }: { c: ContactId; size?: string }) {
  const def = CONTACTS[c];
  return (
    <div className={`grid place-items-center rounded-full shrink-0 shadow-inner ${size}`} style={{ background: `${def.color}66` }} aria-hidden>
      {def.avatar}
    </div>
  );
}

function ContactList({ onOpen }: { onOpen: (c: ContactId) => void }) {
  const phone = useGameStore((s) => s.phone);
  const contacts = CONTACT_ORDER.filter((c) => (phone.threads[c]?.length ?? 0) > 0 || CONTACTS[c].hasMeter);
  return (
    <ul className="space-y-2">
      {contacts.map((c) => {
        const def = CONTACTS[c];
        const thread = phone.threads[c] ?? [];
        const last = thread[thread.length - 1];
        const unread = phone.unread[c] ?? 0;
        const waiting = phone.pending?.contact === c;
        return (
          <li key={c}>
            <button
              onClick={() => onOpen(c)}
              className={`w-full text-left rounded-3xl p-2.5 flex items-center gap-3 transition hover:brightness-105 ${
                waiting ? 'bg-candy-light shadow-[0_3px_0_#f3b7cf]' : 'bg-white shadow-[0_3px_0_#f2d3e0]'
              }`}
            >
              <Avatar c={c} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{def.name}</span>
                  {def.hasMeter && <Hearts value={phone.rel[c]} />}
                </div>
                <div className={`text-xs truncate ${unread ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                  {last ? `${last.from === 'me' ? 'Awak: ' : ''}${last.text}` : 'Belum ada mesej'}
                </div>
              </div>
              {unread > 0 && <span className="min-w-6 h-6 px-1.5 grid place-items-center rounded-full bg-candy text-white text-xs font-bold">{unread}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChatView({ c, onBack }: { c: ContactId; onBack: () => void }) {
  const thread = useGameStore((s) => s.phone.threads[c]) ?? [];
  const pending = useGameStore((s) => s.phone.pending);
  const rel = useGameStore((s) => s.phone.rel[c]);
  const answer = useGameStore((s) => s.answerEvent);
  const markRead = useGameStore((s) => s.markRead);
  const currentChoices = useGameStore((s) => s.currentChoices);
  const scroller = useRef<HTMLDivElement>(null);
  const def = CONTACTS[c];
  const choices = pending?.contact === c ? currentChoices() : [];

  useEffect(() => {
    markRead(c);
  }, [c, thread.length, markRead]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [thread.length]);

  return (
    <div className="flex flex-col h-[min(62dvh,520px)]">
      <div className="flex items-center gap-2 pb-2 border-b-2 border-candy-light">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white shadow grid place-items-center font-bold" aria-label="Kembali ke senarai">
          ←
        </button>
        <Avatar c={c} size="w-9 h-9 text-xl" />
        <div className="min-w-0 flex-1">
          <div className="font-bold leading-tight truncate">{def.name}</div>
          {def.hasMeter && <Hearts value={rel} />}
        </div>
      </div>
      <div ref={scroller} className="flex-1 overflow-y-auto scroll-soft py-3 space-y-2 bg-[radial-gradient(#ffe3ec_1px,transparent_1px)] [background-size:14px_14px]">
        {thread.map((m, i) =>
          m.from === 'system' ? (
            <div key={i} className="text-center text-[11px] text-ink-soft">
              {m.text}
            </div>
          ) : (
            <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 text-sm leading-snug shadow-sm animate-pop-in ${
                  m.from === 'me' ? 'bg-[#d9fdd3] rounded-2xl rounded-br-md' : 'bg-white rounded-2xl rounded-bl-md'
                }`}
              >
                {m.text}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="pt-2 border-t-2 border-candy-light">
        {choices.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-candy">Balas:</div>
            {choices.map((ch, i) => (
              <button
                key={i}
                onClick={() => answer(i)}
                className="w-full text-left rounded-2xl bg-white px-3 py-2 text-sm font-semibold shadow-[0_3px_0_#f2d3e0] hover:bg-candy-light active:translate-y-0.5 transition"
              >
                {ch.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-full bg-white/70 px-4 py-2 text-sm text-ink-soft">Tiada apa nak dibalas sekarang…</div>
        )}
      </div>
    </div>
  );
}

export function Phone() {
  const selected = useUiStore((s) => s.phoneContact);
  const setContact = useUiStore((s) => s.setPhoneContact);
  const pending = useGameStore((s) => s.phone.pending);

  // Opening the phone jumps straight to whoever is waiting for a reply.
  useEffect(() => {
    if (!useUiStore.getState().phoneContact && pending) setContact(pending.contact);
    // only when the phone is opened
  }, []);

  return (
    <Modal title="Telefon" icon="📱" width="sm">
      {selected ? <ChatView c={selected} onBack={() => setContact(null)} /> : <ContactList onOpen={setContact} />}
    </Modal>
  );
}
