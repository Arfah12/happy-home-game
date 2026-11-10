import { beforeEach, describe, expect, it } from 'vitest';
import { CLOTHES_PILES, DIRT_SPOTS, DUST_SPOTS, PLAYER_RADIUS, STATIONS } from '../config/layout';
import { MAX_LEVEL, PERFECT_DAY_BONUS, STARTING_COINS, xpToNext } from '../config/levels';
import { TASK_BY_ID } from '../config/tasks';
import { onGameEvent, type GameEvent } from '../events';
import { newGame } from '../logic/defaults';
import { applyXp } from '../logic/progression';
import { sanitizeSave } from '../logic/sanitize';
import { currentTask, taskGuide } from '../logic/taskGuide';
import { WASH_DURATION, selectSaveData, useGameStore } from '../store/gameStore';
import { STATIC_COLLIDERS, getColliders, resolveCircle } from '../systems/collision';
import { validatePlacement } from '../systems/placement';

const store = () => useGameStore.getState();

beforeEach(() => {
  store().loadSave(newGame());
});

describe('progression', () => {
  it('starts with the documented values', () => {
    const s = store();
    expect(s.level).toBe(1);
    expect(s.xp).toBe(0);
    expect(s.coins).toBe(STARTING_COINS);
    expect(s.unlockedRooms).toEqual(['kitchen', 'living', 'bathroom']);
  });

  it('applies multiple level-ups and carries leftover XP', () => {
    const r = applyXp(1, 0, xpToNext(1) + xpToNext(2) + 5);
    expect(r.level).toBe(3);
    expect(r.xp).toBe(5);
    expect(r.levelsGained).toEqual([2, 3]);
  });

  it('caps at the max level', () => {
    expect(applyXp(MAX_LEVEL, 0, 99999).level).toBe(MAX_LEVEL);
  });
});

describe('task rewards', () => {
  it('pays the documented reward once per cycle', () => {
    expect(store().completeTask('cook_breakfast')).toBe(true);
    expect(store().coins).toBe(STARTING_COINS + 50);
    expect(store().xp).toBe(20);
    // duplicate claim in the same cycle is ignored
    expect(store().completeTask('cook_breakfast')).toBe(false);
    expect(store().coins).toBe(STARTING_COINS + 50);
  });

  it('refuses tasks above the player level', () => {
    expect(store().completeTask('do_laundry')).toBe(false);
    expect(store().coins).toBe(STARTING_COINS);
  });

  it('applies multipliers', () => {
    store().completeTask('cook_breakfast', { coins: 1.5, xp: 1.2 });
    expect(store().coins).toBe(STARTING_COINS + 75);
    expect(store().xp).toBe(24);
  });

  it('levels up and unlocks the laundry room', () => {
    const levels: number[] = [];
    const off = onGameEvent((e: GameEvent) => {
      if (e.type === 'levelUp') levels.push(e.level);
    });
    store().completeTask('cook_breakfast'); // 20
    store().completeTask('clean_living'); // 25
    store().completeTask('vacuum_floor'); // 18 → 63 ≥ 60
    off();
    expect(store().level).toBe(2);
    expect(levels).toEqual([2]);
    expect(store().unlockedRooms).toContain('laundry');
  });
});

describe('activities', () => {
  it('cleaning every stain completes the living room task', () => {
    DIRT_SPOTS.forEach((d) => store().cleanDirt(d.id));
    expect(store().completedTasks).toContain('clean_living');
    expect(store().coins).toBe(STARTING_COINS + TASK_BY_ID.clean_living.coins);
  });

  it('vacuuming all dust bunnies completes the vacuum task', () => {
    DUST_SPOTS.slice(0, -1).forEach((d) => store().collectDust(d.id));
    expect(store().completedTasks).not.toContain('vacuum_floor');
    store().collectDust(DUST_SPOTS[DUST_SPOTS.length - 1].id);
    expect(store().completedTasks).toContain('vacuum_floor');
  });

  it('runs the full laundry cycle', () => {
    store().loadSave({ ...newGame(), level: 2 });
    store().loadWasher();
    expect(store().cycle.washer).toBe('empty'); // nothing collected yet
    CLOTHES_PILES.forEach((c) => store().pickClothes(c.id));
    store().loadWasher();
    expect(store().cycle.washer).toBe('loaded');
    store().startWasher();
    expect(store().cycle.washer).toBe('washing');
    for (let t = 0; t < WASH_DURATION + 1; t += 0.5) store().tickWasher(0.5);
    expect(store().cycle.washer).toBe('done');
    const before = store().coins;
    store().collectLaundry();
    expect(store().coins).toBe(before + TASK_BY_ID.do_laundry.coins);
    expect(store().completedTasks).toContain('do_laundry');
  });

  it('ending a perfect day pays a bonus and resets the cycle', () => {
    store().completeTask('cook_breakfast');
    store().completeTask('wash_dishes');
    store().completeTask('clean_living');
    store().completeTask('vacuum_floor');
    // level 2 now → laundry became available, so the day is NOT perfect
    const coins = store().coins;
    const { perfect } = store().endDay();
    expect(perfect).toBe(false);
    expect(store().coins).toBe(coins);
    expect(store().day).toBe(2);
    expect(store().completedTasks).toEqual([]);
  });

  it('pays the perfect-day bonus when everything is done', () => {
    ['cook_breakfast', 'wash_dishes'].forEach((t) => store().completeTask(t as 'cook_breakfast'));
    // stay at level 1 by not doing the bigger chores: set completed list manually
    store().loadSave({ ...newGame(), completedTasks: ['cook_breakfast', 'wash_dishes', 'clean_living', 'vacuum_floor', 'family_dinner'] });
    const coins = store().coins;
    expect(store().endDay().perfect).toBe(true);
    expect(store().coins).toBe(coins + PERFECT_DAY_BONUS.coins);
  });
});

describe('shop & decoration', () => {
  it('buys, places, moves and stores furniture', () => {
    expect(store().buyItem('potted_fern')).toBe('ok');
    expect(store().coins).toBe(STARTING_COINS - 40);
    expect(store().inventory.potted_fern).toBe(1);
    expect(store().buyItem('grand_piano')).toBe('locked');
    expect(store().placeFromInventory('potted_fern', 4, -3, 0)).toBe(true);
    expect(store().inventory.potted_fern).toBeUndefined();
    const uid = store().placed[0].uid;
    store().movePlaced(uid, 5, -3, Math.PI / 2);
    expect(store().placed[0].x).toBe(5);
    store().storePlaced(uid);
    expect(store().placed).toHaveLength(0);
    expect(store().inventory.potted_fern).toBe(1);
  });

  it('rejects purchases without enough coins', () => {
    store().loadSave({ ...newGame(), coins: 10 });
    expect(store().buyItem('pastel_armchair')).toBe('coins');
    expect(store().coins).toBe(10);
  });

  it('validates placement against walls, locked rooms and stations', () => {
    const rooms = store().unlockedRooms;
    expect(validatePlacement('potted_fern', 4, -3.5, 0, rooms, [])).toBe(true);
    // inside a wall
    expect(validatePlacement('potted_fern', -2, -6, 0, rooms, [])).toBe(false);
    // locked bedroom
    expect(validatePlacement('potted_fern', 5, 4, 0, rooms, [])).toBe(false);
    // blocking the stove
    expect(validatePlacement('potted_fern', STATIONS.stove.x, STATIONS.stove.z, 0, rooms, [])).toBe(false);
    // overlapping another piece
    const placed = [{ uid: 'a', itemId: 'pastel_armchair', x: 4, z: -3.5, rot: 0 }];
    expect(validatePlacement('potted_fern', 4, -3.5, 0, rooms, placed)).toBe(false);
    // rugs may go under furniture
    expect(validatePlacement('cozy_rug', 4, -3.5, 0, rooms, placed)).toBe(true);
  });
});

describe('collision', () => {
  it('pushes the player out of walls', () => {
    const p = resolveCircle(-2, -6, PLAYER_RADIUS, STATIC_COLLIDERS);
    expect(Math.abs(p.x - -2)).toBeGreaterThanOrEqual(PLAYER_RADIUS);
  });

  it('lets the player walk through door gaps', () => {
    const p = resolveCircle(-2, -4.2, PLAYER_RADIUS, STATIC_COLLIDERS);
    expect(p.x).toBeCloseTo(-2);
    expect(p.z).toBeCloseTo(-4.2);
  });

  it('blocks locked rooms', () => {
    const cols = getColliders(store().unlockedRooms, []);
    const p = resolveCircle(5, 3, PLAYER_RADIUS, cols);
    expect(p.z).toBeLessThan(0);
  });

  it('keeps every station reachable (not inside a collider)', () => {
    const cols = getColliders(['kitchen', 'living', 'bathroom', 'laundry', 'bedroom', 'garden', 'kids', 'sunroom'], []);
    for (const [name, s] of Object.entries(STATIONS)) {
      const p = resolveCircle(s.x, s.z, PLAYER_RADIUS, cols);
      expect(Math.hypot(p.x - s.x, p.z - s.z), name).toBeLessThan(0.45);
    }
  });
});

describe('save data', () => {
  it('sanitizes garbage and keeps valid fields', () => {
    const s = sanitizeSave({ level: 99, coins: -5, inventory: { potted_fern: 2, fake: 3 }, completedTasks: ['cook_breakfast', 'nope'] });
    expect(s.level).toBe(MAX_LEVEL);
    expect(s.coins).toBe(0);
    expect(s.inventory).toEqual({ potted_fern: 2 });
    expect(s.completedTasks).toEqual(['cook_breakfast']);
    expect(s.unlockedRooms).toContain('sunroom');
  });

  it('round-trips through JSON', () => {
    store().buyItem('potted_fern');
    store().completeTask('wash_dishes');
    const json = JSON.stringify(store());
    const back = sanitizeSave(JSON.parse(json));
    expect(back.coins).toBe(store().coins);
    expect(back.inventory).toEqual(store().inventory);
    expect(back.completedTasks).toEqual(['wash_dishes']);
  });
});

describe('task guide', () => {
  it('points to the tool rack before cleaning', () => {
    const g = taskGuide('clean_living', store(), { x: 0, z: 0 });
    expect(g.target).toEqual(STATIONS.toolMop);
    expect(currentTask(store())?.id).toBe('cook_breakfast');
  });
});

describe('phone & random events', () => {
  const tick = (sec: number) => {
    for (let t = 0; t < sec; t += 1) store().advanceTime(1);
  };

  it('fires the first random event after a short while', () => {
    expect(store().phone.pending).toBe(null);
    tick(30);
    expect(store().phone.pending).not.toBe(null);
    expect(Object.values(store().phone.unread).reduce((a, b) => a + (b ?? 0), 0)).toBeGreaterThanOrEqual(2);
  });

  it('Oyen poops; hiding him triggers the neighbour follow-up chain', () => {
    expect(store().deliverEvent('oyen_poop')).toBe(true);
    expect(store().world.poop).toBe(true);
    expect(store().world.cat).toBe('visiting');
    store().answerEvent(2); // sorok Oyen
    expect(store().world.cat).toBe('hidden');
    expect(store().phone.pending).toBe(null);
    tick(50);
    expect(store().phone.pending?.eventId).toBe('jiran_lostcat');
    store().answerEvent(0); // mengaku
    expect(store().world.cat).toBe('none');
    const coins = store().coins;
    store().cleanPoop();
    expect(store().world.poop).toBe(false);
    expect(store().coins).toBe(coins + 12);
  });

  it('picking a fight lowers the neighbour relationship', () => {
    store().deliverEvent('oyen_poop');
    store().answerEvent(1);
    expect(store().phone.rel.jiran).toBe(3);
  });

  it('rain: bringing in the clothes in time pays out, once', () => {
    store().loadSave({ ...newGame(), level: 2 });
    store().deliverEvent('abang_rain');
    expect(store().world.rainLeft).toBe(40);
    const coins = store().coins;
    store().angkatKain();
    store().angkatKain();
    expect(store().coins).toBe(coins + 15);
    tick(45);
    expect(store().world.rainLeft).toBe(0);
  });

  it('neighbour food → take it → tupperware reminder later', () => {
    store().deliverEvent('jiran_food');
    store().answerEvent(0);
    expect(store().world.food).toBe(true);
    store().takeFood();
    expect(store().world.food).toBe(false);
    for (let i = 0; i < 90 && store().phone.pending?.eventId !== 'jiran_tupperware'; i++) {
      if (store().phone.pending) store().answerEvent(0); // reply to any chat in between
      tick(1);
    }
    expect(store().phone.pending?.eventId).toBe('jiran_tupperware');
    store().answerEvent(0);
    expect(store().phone.flags).not.toContain('pinjamTupperware');
    expect(store().phone.rel.jiran).toBe(8);
  });

  it('the flash sale discounts shop prices for the day', () => {
    store().deliverEvent('kedai_sale');
    expect(store().priceOf('pastel_armchair')).toBe(120);
    store().buyItem('pastel_armchair');
    expect(store().coins).toBe(STARTING_COINS - 120);
    store().answerEvent(1);
    store().endDay();
    expect(store().shopDiscount).toBe(0);
  });

  it('mother-in-law judges the house', () => {
    store().loadSave({ ...newGame(), level: 2, completedTasks: ['wash_dishes', 'clean_living'] });
    store().deliverEvent('mak_arrive');
    expect(store().phone.rel.mak).toBe(7);
    expect(store().currentChoices()).toHaveLength(1);
    store().loadSave({ ...newGame(), level: 2 });
    store().deliverEvent('mak_arrive');
    expect(store().phone.rel.mak).toBe(4);
    expect(store().currentChoices()).toHaveLength(2);
  });

  it('parcels contain a level-appropriate item', () => {
    store().deliverEvent('posmen_parcel');
    const id = store().openParcel();
    expect(typeof id).toBe('string');
    expect(store().inventory[id as string]).toBe(1);
  });

  it('every event can be delivered and every choice answered without errors', async () => {
    const { PHONE_EVENTS } = await import('../config/phoneEvents');
    for (const e of PHONE_EVENTS) {
      for (let i = 0; i < 4; i++) {
        store().loadSave({ ...newGame(), level: 10 });
        expect(store().deliverEvent(e.id), e.id).toBe(true);
        const choices = store().currentChoices();
        if (i < choices.length) store().answerEvent(i);
        tick(3);
      }
    }
  });

  it('ignored chats expire so new ones can arrive', () => {
    store().deliverEvent('adik_ice');
    tick(160);
    expect(store().phone.threads.adik?.some((m) => m.text === '(tak dibalas)')).toBe(true);
  });

  it('phone state survives a save round-trip', () => {
    store().deliverEvent('adik_ice');
    store().answerEvent(0);
    store().deliverEvent('oyen_poop');
    const back = sanitizeSave(JSON.parse(JSON.stringify(selectSaveData(store()))));
    expect(back.world.poop).toBe(true);
    expect(back.phone.pending?.eventId).toBe('oyen_poop');
    expect(back.phone.threads.adik?.length).toBe(store().phone.threads.adik?.length);
    expect(back.phone.rel.adik).toBe(6);
  });
});

describe('day/night & family routine', () => {
  const tick = (sec: number) => {
    for (let t = 0; t < sec; t += 1) store().advanceTime(1);
  };
  // keep random phone chats out of the way
  const quiet = () => store().loadSave({ ...newGame(), phone: { ...newGame().phone, nextAt: 1e9 } });

  it('the clock runs from 7 pagi and caps late at night', () => {
    quiet();
    expect(store().clock).toBe(7 * 60);
    tick(100);
    expect(store().clock).toBeCloseTo(7 * 60 + 160, 0);
    tick(2000);
    expect(store().clock).toBe(23 * 60 + 30);
  });

  it('breakfast: cook → call Adik → he eats and goes to school', async () => {
    const { npcPlan } = await import('../logic/family');
    quiet();
    store().completeTask('cook_breakfast');
    expect(npcPlan(store()).adik.spot).toBe('play');
    expect(store().callFamily()).toBe(true);
    expect(npcPlan(store()).adik.spot).toBe('table');
    tick(15);
    expect(store().family.adikAteBreakfast).toBe(true);
    expect(store().phone.rel.adik).toBe(6);
    tick(85); // past 9:30 pagi
    expect(npcPlan(store()).adik.spot).toBe('away');
  });

  it('Adik goes to school hungry if nobody calls him', () => {
    quiet();
    tick(100); // ~9:40 pagi
    expect(store().family.adikSkippedBreakfast).toBe(true);
    expect(store().phone.rel.adik).toBe(4);
  });

  it('dinner needs cooking after 5 petang and Abang at home', async () => {
    const { npcPlan, callFamilyState } = await import('../logic/family');
    quiet();
    store().cookDinner();
    expect(store().family.dinnerCooked).toBe(false); // too early
    store().skipTime(); // → 5 petang
    expect(store().clock).toBe(17 * 60);
    store().cookDinner();
    expect(store().family.dinnerCooked).toBe(true);
    expect(callFamilyState(store())).toEqual({ reason: 'Tunggu abang balik dulu (6:30 petang).' });
    expect(npcPlan(store()).abang.spot).toBe('away');
    tick(60); // → ~6:36 petang
    expect(store().family.abangGreeted).toBe(true);
    expect(npcPlan(store()).abang.spot).toBe('sofa');
    expect(store().callFamily()).toBe(true);
    expect(npcPlan(store()).abang.spot).toBe('table');
    expect(npcPlan(store()).adik.spot).toBe('table');
    const coins = store().coins;
    tick(20);
    expect(store().completedTasks).toContain('family_dinner');
    expect(store().coins).toBe(coins + 70);
  });

  it('Abang comes home late after a meeting', async () => {
    const { abangHomeTime } = await import('../logic/family');
    quiet();
    store().deliverEvent('abang_late');
    expect(abangHomeTime(store())).toBe(20 * 60);
    store().answerEvent(2);
    store().endDay();
    expect(abangHomeTime(store())).toBe(18 * 60 + 30);
    expect(store().clock).toBe(7 * 60);
  });

  it('skipping time goes 5 petang → 9 malam', () => {
    quiet();
    expect(store().skipTime()).toBe(17 * 60);
    expect(store().skipTime()).toBe(21 * 60);
  });
});
