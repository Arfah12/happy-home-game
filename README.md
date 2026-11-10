# 🏡 Happy Home – Housewife Simulator

A cozy, colourful 3D life-simulation game that runs in the browser on desktop, tablet and phone.
Walk around a pastel house, cook breakfast, do the laundry, mop, vacuum, wash dishes, make the bed,
water the garden and tidy the kids' room. Earn coins and XP, level up, unlock rooms and decorate
your dream home with furniture you place yourself.

Built with **React 19 · TypeScript · Vite · Three.js · React Three Fiber · Drei · Zustand · Tailwind CSS 4**,
with optional **Supabase** cloud saves. All 3D models, textures, music and sound effects are generated
procedurally in code – there are no third‑party assets to license.

**Bahasa:** seluruh game dalam Bahasa Melayu santai, dengan perisa Malaysia (nasi lemak, roti jala,
Oyen kucing jiran, grup WhatsApp taman, mak mertua datang spot-check 😆). Watak boleh pakai tudung
(Tetapan → 🧕 Pakai tudung).

---

## Quick start

Requirements: **Node.js 20+** (22 LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). To test on a phone on the same Wi‑Fi:

```bash
npm run dev -- --host
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |
| `npm test` | Run the game-logic unit tests (Vitest) |

## How to play

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys, or click the floor | Virtual joystick |
| Interact | **E** / Space / Enter, or click an object | Big action button, or tap an object |
| Rotate furniture | **R** | ⟳ button |
| Pause / back | **Esc** | ⏸ button |

Follow the pink arrow – it always points at your next chore.

### Daily chores

| Chore | Unlocks | Reward | How |
| --- | --- | --- | --- |
| 🍳 Cook breakfast | Lv 1 | 50 🪙 · 20 XP | Stove → pick a recipe → timing mini-game (stop the spoon in the green zone; gold = perfect) |
| 🍽️ Wash the dishes | Lv 1 | 30 🪙 · 10 XP | Sink → scrub 4 plates with finger/mouse (keyboard: Space) |
| 🧽 Clean the living room | Lv 1 | 60 🪙 · 25 XP | Take the mop from the tool rack, scrub all 5 stains |
| 🌀 Vacuum the floor | Lv 1 | 45 🪙 · 18 XP | Take the vacuum, walk over all 6 dust bunnies |
| 🧺 Do the laundry | Lv 2 | 40 🪙 · 15 XP | Collect 3 piles → load washer → start → wait → collect |
| 🛏️ Make the bed | Lv 3 | 35 🪙 · 14 XP | Bedroom |
| 🌻 Water the garden | Lv 5 | 55 🪙 · 22 XP | Fill the can at the tap, water 4 plants |
| 🧸 Tidy the toys | Lv 8 | 65 🪙 · 26 XP | Pick up 4 toys, put them in the toy box |

Each chore pays **once per day** (task cycle). Open **Chores → End day** to sleep and start a new day.
Finishing every available chore first gives a **perfect-day bonus** (+100 🪙, +15 XP).
Recipes change the reward (×1.0 – ×1.5) and a perfect cook adds +25 % coins.

### Levels

XP needed per level: 60, 100, 140 … 380 (≈ 2,000 XP to Lv 10, roughly two weeks of in-game days).

| Lv | Unlock |
| --- | --- |
| 1 | Basic kitchen, living room, bathroom |
| 2 | Laundry area |
| 3 | Bedroom, Nasi Lemak recipe |
| 4 | Living-room makeover (wallpaper, pendant lamp) + sofa/TV set |
| 5 | Garden |
| 6 | Premium furniture (piano, aquarium, velvet sofa) |
| 7 | Deluxe stove (+25 % cooking coins), new recipes, dining set |
| 8 | Children's room |
| 9 | Larger house – sunroom extension |
| 10 | Dream house makeover (golden trims, fairy lights) + dream collection |

### 🌅 Siang & malam + keluarga (day/night & family)

The in-game clock runs from **7:00 pagi** to midnight (≈9 minutes of play; it only ticks while
unpaused). The sun moves across the sky, evenings turn golden, nights are dark blue with the moon,
stars, crickets and the house lamps switched on.

| Time | What happens |
| --- | --- |
| 7:00 pagi | Day starts. Adik plays in the living room. Cook breakfast before 12:00 tengah hari |
| after cooking | **📣 Panggil Adik sarapan** at the dining table → he walks over, sits and eats (+XP, ❤️) |
| 9:30 pagi | Adik leaves for school (hungry if nobody called him 😢) |
| 2:00 petang | Adik comes home |
| 5:00 petang | Stove switches to **makan malam** |
| 6:30 petang | Abang comes home (8:00 malam if he said he has a meeting), greets you and rests on the sofa |
| evening | **📣 Panggil semua makan malam** → the whole family eats together → chore *Makan malam sekeluarga* (70 🪙 · 30 XP) |
| 9:00 malam | You can sleep (Senarai kerja → 🌙 Tidur). Finished early? Use ⏩ to skip to 5 petang / 9 malam |

Family members are articulated characters sharing Mama's skeleton (walk, sit, eat, play-on-floor
animations) and walk between rooms on a door-to-door waypoint graph (`src/scene/Family.tsx`); their
schedule is a pure function of the save (`src/game/logic/family.ts`).

### 📱 Telefon & kejadian rawak (phone & random events)

Every ~1–1.5 minutes of play the phone buzzes. Open it with the 📱 button (or tap the banner) and
pick a reply – choices change coins, XP and **relationship hearts** (Abang, Adik, Kak Mah, Mak Mertua).
Unanswered chats expire after ~2.5 minutes ("tak dibalas"). Some chats chain into follow-ups.

| Event | What happens |
| --- | --- |
| 🐱 Oyen berak dalam rumah | Oyen + poop appear in the living room. Buang / gaduh dengan Kak Mah / sorok Oyen dalam kotak (Kak Mah will ask later… and Adik might snitch) / bagi Oyen makan |
| ☔ Hujan! Angkat kain | (Lv 2) Rain starts – run to the laundry clothesline within 40 s for a reward |
| 🍛 Jiran hantar rendang | Tupperware on the dining table → take it → later "tupperware akak jangan lupa pulang" |
| 👵 Mak mertua nak datang | 2-minute warning, then she judges the house (dishes, mopping, no poop) |
| 💸 Abang transfer duit dapur | +RM50 when the relationship is good |
| 🛍️ Jualan kilat | 20 % off all furniture for the rest of the day |
| 📦 Parcel | A mystery furniture item at the door |
| plus | Abang tanya masak apa, Adik nak aiskrim potong, cikgu suruh bawa tisu, 3A, gotong-royong, kereta block pagar, pasar malam, kenduri… |

Events live in `src/game/config/phoneEvents.ts` – adding a new one is just a new object with
messages, choices and effects.

### Decorating

Buy furniture in the **Shop** (26 items, level-gated). Bought items go to the **Inventory**; press
**Place** and position the glowing ghost in front of you (or point with the mouse). Green = fits,
red = blocked. Walk up to placed furniture and interact to move it again, or **Store** it.

## Project structure

```
src/
  game/
    config/      levels, tasks, recipes, furniture catalog, house layout (pure data)
    logic/       pure functions: XP/level maths, defaults, save sanitizer, task guidance
    store/       Zustand stores – gameStore (persisted progress), uiStore, interactionStore
    systems/     input, collision, interactions, placement, save (LocalStorage),
                 cloudSave (Supabase), procedural audio engine
    events.ts    tiny event bus (toasts, rewards, level-ups, sounds)
    __tests__/   Vitest unit tests for economy, activities, collision, saves
  scene/         React Three Fiber scene
    rooms/       kitchen, living room, bathroom, laundry, bedroom, kids, sunroom, garden
    props/       shared props, task objects (stains, dust bunnies, clothes, toys), effects
    furniture/   procedural furniture models, placed furniture & placement ghost
    Character    articulated procedural character + animations (idle/walk/interact/cook/clean/water)
    Player       movement, collision, click-to-move, interaction & work timers
  ui/            HUD, joystick, modals (tasks, shop, inventory, settings, pause, level-up),
                 mini-games (cooking, dishwashing), menu & status screens
  lib/supabase.ts  lazy, optional Supabase client
supabase/migrations/  SQL schema with Row Level Security
```

## Saving

* **Automatic local save** – every change is written to LocalStorage (debounced) and flushed when the
  tab is hidden/closed. Saved: level, XP, coins, day, completed tasks, unlocked rooms, inventory,
  furniture placements, in-progress chores, equipped tool, player position and settings.
  Saves are validated on load, so a corrupted or hand-edited save can't crash the game.
* **Optional cloud save** – see below. Not required to play.

## Optional: Supabase cloud saving

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration: either `supabase link` + `supabase db push` with the Supabase CLI, or paste
   `supabase/migrations/20261110000000_init.sql` into the SQL editor.
3. In **Authentication → URL configuration**, add your site URL (and `http://localhost:5173`) to the
   redirect URLs (used by the magic-link e-mail).
4. Copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

5. Restart `npm run dev`. **Settings → Cloud save** now offers e-mail sign-in, Upload and Download.
   Progress is also uploaded automatically a few seconds after each chore/level-up while signed in.

**Security:** only the public *anon* key is used in the browser. Never put the `service_role` key in
any `VITE_` variable – it would be shipped to every player. All player tables have Row Level Security
so users can only read/write their own rows; the furniture catalog is read-only to clients. The
`task_completions` table has a unique `(user_id, task_id, cycle_day)` constraint so a reward can't be
recorded twice for the same day.

Schema: `profiles`, `player_progress` (+ a `game_state jsonb` snapshot for placements/settings),
`task_completions` (+ `cycle_day`), `player_inventory`, `furniture_catalog` (seeded from
`src/game/config/furniture.ts`).

> Note: the economy is client-authoritative (the game is single-player and works offline), so a
> determined player could edit their own save. If you later add leaderboards or trading, move reward
> granting into a Supabase Edge Function / RPC.

## Build & deploy

```bash
npm run build      # outputs static files to dist/
npm run preview    # check the production build locally
```

`dist/` is a static site – host it anywhere:

* **Vercel** – import the repo; framework preset *Vite*; build `npm run build`; output `dist`.
  Add the two `VITE_SUPABASE_*` env vars if you use cloud saves.
* **Netlify** – build command `npm run build`, publish directory `dist`.
* **Cloudflare Pages** – build `npm run build`, output `dist`.
* **GitHub Pages / any sub-path** – set `base: '/your-repo/'` in `vite.config.ts` before building.

## Performance notes

* Graphics quality **Low / Medium / High** (Settings): Low disables shadows and anti-aliasing, lowers
  resolution and swaps rounded meshes for a single shared box geometry. Phones default to Medium.
* Materials and basic geometries are cached and shared; per-frame logic lives in `useFrame` and
  mutable singletons so movement never triggers React re-renders.
* The 3D engine is code-split – the menu loads instantly and three.js downloads in parallel.
* WebGL is checked before the scene starts; context loss and renderer crashes show a friendly
  recovery screen instead of a blank page.

## Testing

```bash
npm test
```

Covers the clock & family routine (breakfast, school, Abang coming home, dinner), the phone event scheduler, every event/choice combination, follow-up chains, chat expiry,
starting values, XP/level-ups, reward amounts and multipliers, the duplicate-reward guard,
every chore's completion path (including the full washing cycle), perfect-day bonus, shopping and
furniture placement rules, collision (walls, doors, locked rooms, every station reachable) and save
sanitising / round-tripping.

## License

Code: MIT. All visuals and audio are procedurally generated by this codebase.
#   h a p p y - h o m e - g a m e  
 #   h a p p y - h o m e - g a m e  
 #   h a p p y - h o m e - g a m e  
 #   h a p p y - h o m e - g a m e  
 