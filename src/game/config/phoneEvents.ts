import type { ContactId, SaveData, WorldState } from '../types';

/* ───────────────────────── Contacts ───────────────────────── */

export interface ContactDef {
  id: ContactId;
  name: string;
  avatar: string;
  color: string;
  /** Shown as a relationship meter in the phone. */
  hasMeter: boolean;
}

export const CONTACTS: Record<ContactId, ContactDef> = {
  abang: { id: 'abang', name: 'Abang Sayang ❤️', avatar: '👨🏻', color: '#8bc6ff', hasMeter: true },
  adik: { id: 'adik', name: 'Adik (anak)', avatar: '👧🏻', color: '#ffd166', hasMeter: true },
  jiran: { id: 'jiran', name: 'Kak Mah Sebelah', avatar: '🧕🏻', color: '#9be3c4', hasMeter: true },
  mak: { id: 'mak', name: 'Mak Mertua', avatar: '👵🏻', color: '#c9b6ff', hasMeter: true },
  grup: { id: 'grup', name: 'Grup Taman Bahagia 🏘️', avatar: '🏘️', color: '#ffb3c9', hasMeter: false },
  posmen: { id: 'posmen', name: 'Abang Posmen', avatar: '📦', color: '#f6c26b', hasMeter: false },
  kedai: { id: 'kedai', name: 'Kedai Perabot Ceria', avatar: '🛍️', color: '#ff9f80', hasMeter: false },
};

export const CONTACT_ORDER: ContactId[] = ['abang', 'adik', 'jiran', 'mak', 'grup', 'posmen', 'kedai'];

/* ───────────────────────── Event API ───────────────────────── */

/** What an event / choice is allowed to do to the game. */
export interface EventApi {
  s: SaveData;
  /** Coins may be negative (spending). */
  grant: (coins: number, xp: number, label: string) => void;
  rel: (c: ContactId, delta: number) => void;
  say: (c: ContactId, text: string) => void;
  note: (c: ContactId, text: string) => void;
  later: (eventId: string, delaySec: number) => void;
  world: (patch: Partial<WorldState>) => void;
  flag: (name: string, on?: boolean) => void;
  discount: (pct: number) => void;
  openShop: () => void;
}

export interface EventChoice {
  label: string;
  /** What the player sends (defaults to the label). */
  reply?: string;
  /** Contact's answer after the reply. */
  response?: string;
  run?: (api: EventApi) => void;
}

export interface PhoneEventDef {
  id: string;
  contact: ContactId;
  minLevel?: number;
  weight?: number | ((s: SaveData) => number);
  /** Seconds of play before this event can repeat (default 420). */
  cooldown?: number;
  /** Only fires when scheduled by another event. */
  followUpOnly?: boolean;
  when?: (s: SaveData) => boolean;
  messages: string[] | ((s: SaveData) => string[]);
  onDeliver?: (api: EventApi) => void;
  choices: EventChoice[] | ((s: SaveData) => EventChoice[]);
}

const relOf = (s: SaveData, c: ContactId) => s.phone.rel[c] ?? 5;
const hasFlag = (s: SaveData, f: string) => s.phone.flags.includes(f);

/** Is the house clean enough for mother-in-law? */
export function houseIsClean(s: SaveData): boolean {
  return s.completedTasks.includes('wash_dishes') && s.completedTasks.includes('clean_living') && !s.world.poop;
}

/* ───────────────────────── Events ───────────────────────── */

export const PHONE_EVENTS: PhoneEventDef[] = [
  // ── Abang ──────────────────────────────────────────────
  {
    id: 'abang_dinner',
    contact: 'abang',
    when: (s) => s.clock < 18 * 60,
    messages: ['Sayang, malam ni masak apa? 😋'],
    choices: [
      { label: 'Nasi lemak special untuk abang 😘', response: 'Wahh tak sabar nak balik! ❤️', run: (a) => (a.rel('abang', 1), a.grant(0, 5, 'Isteri mithali')) },
      { label: 'Masak la sendiri, penat ni 😤', response: 'Ok ok... abang tapau je la 🥲', run: (a) => a.rel('abang', -1) },
      { label: 'Order delivery je la malam ni 🛵', response: 'Set! Abang belanja separuh 😁', run: (a) => a.grant(-8, 2, 'Order makanan') },
    ],
  },
  {
    id: 'abang_transfer',
    contact: 'abang',
    weight: (s) => (relOf(s, 'abang') >= 6 ? 1.4 : 0.6),
    when: (s) => relOf(s, 'abang') >= 4,
    cooldown: 600,
    messages: ['Abang dah transfer RM50 duit dapur ye 💸'],
    onDeliver: (a) => (a.grant(50, 0, 'Duit dapur dari abang'), a.note('abang', '💸 +RM50 diterima')),
    choices: [
      { label: 'Terima kasih sayang ❤️', response: 'Sama-sama sayang 😘', run: (a) => a.rel('abang', 1) },
      { label: 'Sikitnya bang 😒', response: 'Hujung bulan sayang... sabar ye 🥲', run: (a) => a.rel('abang', -1) },
    ],
  },
  {
    id: 'abang_late',
    contact: 'abang',
    when: (s) => s.clock < 18 * 60 && !s.phone.flags.includes('abangLambat'),
    messages: ['Abang balik lambat sikit hari ni, ada meeting. Dalam pukul 8 malam sampai.', 'Nak kirim apa-apa? 🛍️'],
    onDeliver: (a) => a.flag('abangLambat'),
    choices: [
      { label: 'Roti canai 2 keping, kuah banjir! 🫓', response: 'Baik bos 🫡 Nanti abang bawa balik.', run: (a) => a.grant(0, 4, 'Pesan roti canai') },
      { label: 'Bunga sekuntum boleh? 🌹', response: 'Hehe ok, rahsia ye 🌹', run: (a) => (a.rel('abang', 1), a.grant(0, 4, 'Romantik')) },
      { label: 'Tak payah, jimat duit 👍', response: 'Bagus isteri abang ni 👍', run: (a) => a.grant(10, 2, 'Jimat cermat') },
    ],
  },
  {
    id: 'abang_rain',
    contact: 'abang',
    minLevel: 2,
    weight: 1.2,
    cooldown: 600,
    when: (s) => s.world.rainLeft <= 0 && !s.world.kainAngkat,
    messages: ['SAYANG! Langit gelap dah ni ☁️', 'Angkat kain kat ampaian cepat!! ☔'],
    onDeliver: (a) => a.world({ rainLeft: 40 }),
    choices: [{ label: 'Ok bang, on the way! 🏃‍♀️', response: 'Cepat cepat! 😆' }],
  },

  // ── Adik ───────────────────────────────────────────────
  {
    id: 'adik_ice',
    contact: 'adik',
    when: (s) => s.clock >= 14 * 60 || s.clock < 9 * 60 + 30,
    messages: ['Mama, nak duit beli aiskrim potong boleh? 🥺🍦'],
    choices: [
      { label: 'Boleh, RM2 je tau', response: 'Yeayy sayang mama! 🍦', run: (a) => (a.grant(-2, 2, 'Aiskrim potong'), a.rel('adik', 1)) },
      { label: 'Tak boleh, nanti sakit gigi 🦷', response: 'Alaaa mama ni... 😢', run: (a) => a.rel('adik', -1) },
    ],
  },
  {
    id: 'adik_school',
    contact: 'adik',
    when: (s) => s.clock >= 14 * 60,
    messages: ['Mama!! Cikgu suruh bawak kotak tisu dengan gam esok 📚', 'Adik lupa nak bagitau semalam 🙈'],
    choices: [
      { label: 'Ok nanti mama beli', response: 'Terima kasih mama! 😘', run: (a) => (a.grant(-6, 5, 'Barang sekolah'), a.rel('adik', 1)) },
      { label: 'Kenapa baru bagitau sekarang?! 😤', response: 'Sorry mama... 🙈', run: (a) => a.rel('adik', -1) },
    ],
  },
  {
    id: 'adik_exam',
    contact: 'adik',
    minLevel: 3,
    cooldown: 900,
    messages: ['Mama... adik dapat 3A dalam ujian! 🎉📝'],
    choices: [
      { label: 'Pandainya! Jom belanja ayam goreng 🍗', response: 'YEAAAY!! 🍗🍗', run: (a) => (a.grant(-20, 12, 'Hadiah anak pandai'), a.rel('adik', 2)) },
      { label: 'Alhamdulillah, nanti mama masak sedap', response: 'Ok mama ❤️', run: (a) => (a.grant(0, 6, 'Anak pandai'), a.rel('adik', 1)) },
    ],
  },
  {
    id: 'adik_drawing',
    contact: 'adik',
    messages: ['Mama tengok ni, adik lukis rumah kita 🏠🎨', '[gambar: rumah warna pink, ada kucing oren]'],
    choices: [
      { label: 'Cantiknya! Mama tampal kat peti ais ❤️', response: 'Hehe 🥰', run: (a) => (a.rel('adik', 1), a.grant(0, 4, 'Mama penyayang')) },
      { label: 'Bagus. Dah siap homework?', response: 'Belum... 😶', run: (a) => a.grant(0, 3, 'Mama tegas') },
    ],
  },

  // ── Oyen the neighbour's cat ───────────────────────────
  {
    id: 'oyen_poop',
    contact: 'adik',
    weight: 1.3,
    cooldown: 500,
    when: (s) => !s.world.poop && s.world.cat === 'none',
    messages: ['MAMA!! Oyen kucing Kak Mah masuk rumah 🐱', 'Dia BERAK tepi pintu ruang tamu 🤢💩'],
    onDeliver: (a) => a.world({ poop: true, cat: 'visiting' }),
    choices: [
      { label: 'Takpe, mama buang 😮‍💨', response: 'Mama terbaik 👍 (pergi buang kat ruang tamu ye)' },
      {
        label: 'Panggil Kak Mah! Mama nak gaduh 😤',
        response: 'Alamak... adik takut 😬',
        run: (a) => (a.rel('jiran', -2), a.later('jiran_fight', 6)),
      },
      {
        label: 'Sorok Oyen dalam kotak 📦😈',
        response: 'Hah?! Mama jahat 😂',
        run: (a) => (a.world({ cat: 'hidden' }), a.later('jiran_lostcat', 45)),
      },
      {
        label: 'Bagi Oyen makan, comelnya 🥹',
        response: 'Mama ni... dia yang berak tau 😂',
        run: (a) => (a.world({ cat: 'pet' }), a.grant(-3, 3, 'Makanan kucing'), a.rel('jiran', 1)),
      },
    ],
  },
  {
    id: 'jiran_fight',
    contact: 'jiran',
    followUpOnly: true,
    messages: ['Eh, kucing akak mana pandai berak rumah orang! 😤', 'Jangan main tuduh-tuduh ye dik.'],
    choices: [
      {
        label: 'Ada bukti gambar ni! 📸💩',
        response: '...Ok la, sorry dik. Nanti akak marah Oyen 😅',
        run: (a) => (a.rel('jiran', 1), a.grant(0, 5, 'Menang gaduh')),
      },
      { label: 'Ok la kak, saya salah sangka 🙏', response: 'Haa tau pun 😌', run: (a) => a.rel('jiran', 1) },
      { label: 'Akak pun sama je! 😡', response: 'Ish budak ni!! 😤 (Kak Mah keluar dari chat)', run: (a) => a.rel('jiran', -2) },
    ],
  },
  {
    id: 'jiran_lostcat',
    contact: 'jiran',
    followUpOnly: true,
    when: (s) => s.world.cat === 'hidden',
    messages: ['Dik, ada nampak Oyen tak? 😢', 'Dah 2 jam tak balik. Akak risau sangat...'],
    choices: [
      {
        label: 'Ada... dalam kotak rumah saya 😅',
        response: 'HAH?! Haish... takpe la asalkan dia selamat 😮‍💨',
        run: (a) => (a.world({ cat: 'none' }), a.rel('jiran', -1), a.grant(0, 4, 'Jujur')),
      },
      {
        label: 'Tak nampak pun kak... 🙈',
        response: 'Takpe la... nanti akak cari lagi 😢',
        run: (a) => (a.flag('tipuJiran'), a.later('adik_snitch', 30)),
      },
    ],
  },
  {
    id: 'adik_snitch',
    contact: 'adik',
    followUpOnly: true,
    when: (s) => s.world.cat === 'hidden',
    messages: ['Mama... kenapa Oyen ada dalam kotak? 🤔', 'Kak Mah tengah menangis cari dia tadi.'],
    choices: [
      { label: 'Shhh rahsia kita berdua 🤫', response: 'Ok... 😶', run: (a) => a.rel('adik', -1) },
      {
        label: 'Jom kita pulangkan Oyen 🐱',
        response: 'Yay! Mama baik 😊',
        run: (a) => (a.world({ cat: 'none' }), a.rel('adik', 1), a.rel('jiran', 1), a.flag('tipuJiran', false), a.grant(0, 6, 'Insaf')),
      },
    ],
  },

  // ── Jiran ──────────────────────────────────────────────
  {
    id: 'jiran_food',
    contact: 'jiran',
    weight: (s) => 0.5 + relOf(s, 'jiran') * 0.15,
    when: (s) => !s.world.food && !hasFlag(s, 'pinjamTupperware') && relOf(s, 'jiran') >= 3,
    messages: ['Assalamualaikum dik 😊', 'Akak masak rendang lebih ni. Akak dah letak atas meja makan ye 🍛'],
    choices: [
      { label: 'Waalaikumsalam, terima kasih kak! 🥰', response: 'Sama-sama. Tupperware tu pulang nanti ye 😉', run: (a) => (a.world({ food: true }), a.rel('jiran', 1), a.flag('pinjamTupperware')) },
      { label: 'Eh susahkan akak je 😅', response: 'Takde susahnya, makan la 😊', run: (a) => (a.world({ food: true }), a.flag('pinjamTupperware')) },
      { label: 'Maaf kak, saya tengah diet 🙏', response: 'Takpe, akak bagi jiran depan la 😅', run: (a) => a.rel('jiran', -1) },
    ],
  },
  {
    id: 'jiran_tupperware',
    contact: 'jiran',
    followUpOnly: true,
    messages: ['Dik, tupperware biru akak jangan lupa pulang ye 😅'],
    choices: [
      {
        label: 'Pulang dengan kuih seri muka 😋',
        response: 'Ya Allah rajinnya! Terima kasih 🥹',
        run: (a) => (a.grant(-10, 8, 'Budi bahasa'), a.rel('jiran', 2), a.flag('pinjamTupperware', false)),
      },
      { label: 'Ok kak, kejap lagi saya hantar', response: 'Ok dik 👍', run: (a) => a.flag('pinjamTupperware', false) },
      {
        label: 'Tupperware apa ye kak? 🙈',
        response: 'Yang BIRU tu laa!! 😤',
        run: (a) => (a.rel('jiran', -2), a.later('jiran_tupperware', 120)),
      },
    ],
  },

  // ── Mak mertua ─────────────────────────────────────────
  {
    id: 'mak_visit',
    contact: 'mak',
    minLevel: 2,
    cooldown: 900,
    messages: ['Assalamualaikum.', 'Mak nak singgah rumah kejap lagi ye. Dalam 2 minit sampai.'],
    choices: [
      {
        label: 'Waalaikumsalam, datang la mak 😊',
        response: 'Mak bawa kuih sikit. (Psst... baik kemas rumah cepat!)',
        run: (a) => (a.rel('mak', 1), a.later('mak_arrive', 120)),
      },
      { label: 'Alamak mak, saya keluar ni... 😅', response: 'Oh ye ke... takpe la 🙂', run: (a) => a.rel('mak', -1) },
    ],
  },
  {
    id: 'mak_arrive',
    contact: 'mak',
    followUpOnly: true,
    messages: (s) =>
      houseIsClean(s)
        ? ['Mak dah sampai.', 'MasyaAllah, bersihnya rumah menantu mak! 😍']
        : ['Mak dah sampai...', 'Hmm. Pinggan dalam sinki tu belum basuh ye? Lantai pun... 🤨'],
    onDeliver: (a) => {
      // Remember the verdict so the reply options stay stable until answered.
      const clean = houseIsClean(a.s);
      a.flag('makPuas', clean);
      if (clean) {
        a.rel('mak', 2);
        a.grant(40, 20, 'Pujian mak mertua');
      } else {
        a.rel('mak', -1);
      }
    },
    choices: (s) =>
      hasFlag(s, 'makPuas')
        ? [{ label: 'Hehe biasa je mak 😊', response: 'Nah, duit raya awal 😉' }]
        : [
            { label: 'Saya baru nak kemas mak 😅', response: 'Hmm. Takpe, mak tolong sikit.' },
            { label: 'Sibuk sangat hari ni mak 🥲', response: 'Rehat la sekejap. Jangan penat sangat.' },
          ],
  },

  // ── Grup taman ─────────────────────────────────────────
  {
    id: 'grup_gotong',
    contact: 'grup',
    messages: ['📢 Pak Mat (AJK): Gotong-royong taman hari Ahad pukul 8 pagi. Semua dijemput! 🧹'],
    choices: [
      { label: 'InsyaAllah saya datang 💪', response: 'Pak Mat: Terima kasih puan 👍', run: (a) => (a.rel('jiran', 1), a.grant(0, 8, 'Semangat kejiranan')) },
      { label: '👍', run: (a) => a.grant(0, 3, 'Aktif dalam grup') },
      { label: '(seen je) 🙈', response: 'Pak Mat: Ramai yang seen je ni ya 🙂', run: (a) => a.rel('jiran', -1) },
    ],
  },
  {
    id: 'grup_car',
    contact: 'grup',
    messages: ['Siapa punya kereta kuning block pagar rumah No. 12?! 😡', 'Saya nak keluar kerja ni!!'],
    choices: [
      { label: 'Bukan saya, kereta saya merah 😅', run: (a) => a.grant(0, 3, 'Saksi') },
      { label: 'Sabar bang, mungkin tetamu kenduri 🙏', response: 'Hmm ok la 😮‍💨', run: (a) => (a.rel('jiran', 1), a.grant(0, 5, 'Pendamai')) },
    ],
  },
  {
    id: 'grup_pasar',
    contact: 'grup',
    when: (s) => s.clock >= 15 * 60,
    messages: ['Pasar malam malam ni ada gerai apam balik baru! Rangup gila 🥞🔥'],
    choices: [
      { label: 'Nak! Ajak abang sekali 😋', run: (a) => (a.grant(-10, 5, 'Pasar malam'), a.rel('abang', 1)) },
      { label: 'Jimat dulu bulan ni 😅', run: (a) => a.grant(0, 3, 'Berjimat') },
    ],
  },
  {
    id: 'grup_kenduri',
    contact: 'grup',
    minLevel: 3,
    cooldown: 900,
    messages: ['Jemput datang kenduri kahwin anak saya Sabtu ni 💐', 'Siapa boleh tolong rewang, PM ye!'],
    choices: [
      { label: 'Saya tolong masak gulai! 🍲', response: 'Alhamdulillah, terima kasih puan!', run: (a) => (a.rel('jiran', 2), a.grant(15, 10, 'Rewang kenduri')) },
      { label: 'InsyaAllah datang makan 😁', run: (a) => a.grant(0, 4, 'Tetamu kenduri') },
    ],
  },

  // ── Posmen & kedai ─────────────────────────────────────
  {
    id: 'posmen_parcel',
    contact: 'posmen',
    weight: 0.7,
    cooldown: 700,
    when: (s) => !s.world.parcel,
    messages: ['Puan, parcel dah sampai. Saya letak tepi pintu ruang tamu ye 📦'],
    onDeliver: (a) => a.world({ parcel: true }),
    choices: [{ label: 'Terima kasih bang! 🙏', response: '👍' }],
  },
  {
    id: 'kedai_sale',
    contact: 'kedai',
    weight: 0.6,
    cooldown: 1200,
    when: (s) => s.shopDiscount <= 0,
    messages: ['🛍️ JUALAN KILAT! Semua perabot diskaun 20% sampai esok pagi!', 'Cepat sebelum habis stok 🏃‍♀️'],
    onDeliver: (a) => a.discount(0.2),
    choices: [
      { label: 'Wah, nak tengok! 👀', run: (a) => a.openShop() },
      { label: 'Nanti la 😴' },
    ],
  },
];

export const PHONE_EVENT_BY_ID: Record<string, PhoneEventDef> = Object.fromEntries(PHONE_EVENTS.map((e) => [e.id, e]));

/** Seconds between random events. */
export const EVENT_GAP: [number, number] = [55, 100];
export const FIRST_EVENT_AT = 25;
export const DEFAULT_COOLDOWN = 420;
export const MAX_THREAD = 40;

export const RAIN_REWARD = { coins: 15, xp: 10 } as const;
export const POOP_REWARD = { coins: 12, xp: 8 } as const;
export const FOOD_REWARD = { coins: 20, xp: 10 } as const;
