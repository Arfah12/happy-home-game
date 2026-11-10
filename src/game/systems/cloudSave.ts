import { getSupabase, isCloudConfigured } from '../../lib/supabase';
import { sanitizeSave } from '../logic/sanitize';
import { selectSaveData, useGameStore } from '../store/gameStore';
import type { SaveData, TaskId } from '../types';

/**
 * Cloud save layer. Every function is a no-op (returning a clear status)
 * when Supabase is not configured, so the rest of the game never needs to
 * care whether the player is online.
 */

export interface CloudUser {
  id: string;
  email: string | null;
}

export type CloudResult = { ok: true } | { ok: false; error: string };

const notConfigured: CloudResult = { ok: false, error: 'Simpanan awan belum disediakan.' };

export { isCloudConfigured };

export async function getCloudUser(): Promise<CloudUser | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? { id: u.id, email: u.email ?? null } : null;
}

export async function onCloudAuthChange(cb: (u: CloudUser | null) => void): Promise<() => void> {
  const sb = await getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_evt, session) => {
    const u = session?.user;
    cb(u ? { id: u.id, email: u.email ?? null } : null);
  });
  return () => data.subscription.unsubscribe();
}

/** Passwordless e-mail login (magic link). */
export async function signInWithEmail(email: string): Promise<CloudResult> {
  const sb = await getSupabase();
  if (!sb) return notConfigured;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = await getSupabase();
  await sb?.auth.signOut();
}

/** Uploads the full local progress to the player's own rows. */
export async function uploadProgress(): Promise<CloudResult> {
  const sb = await getSupabase();
  if (!sb) return notConfigured;
  const user = await getCloudUser();
  if (!user) return { ok: false, error: 'Sila log masuk dulu.' };
  const save = selectSaveData(useGameStore.getState());

  const progress = await sb.from('player_progress').upsert(
    {
      user_id: user.id,
      level: save.level,
      xp: save.xp,
      coins: save.coins,
      unlocked_rooms: save.unlockedRooms,
      game_state: save,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (progress.error) return { ok: false, error: progress.error.message };

  // Inventory = everything owned (in storage + placed in the house).
  const owned: Record<string, number> = { ...save.inventory };
  for (const p of save.placed) owned[p.itemId] = (owned[p.itemId] ?? 0) + 1;
  const rows = Object.entries(owned).map(([item_id, quantity]) => ({ user_id: user.id, item_id, quantity }));
  const del = await sb.from('player_inventory').delete().eq('user_id', user.id);
  if (del.error) return { ok: false, error: del.error.message };
  if (rows.length) {
    const ins = await sb.from('player_inventory').insert(rows);
    if (ins.error) return { ok: false, error: ins.error.message };
  }
  return { ok: true };
}

/** Downloads the cloud copy. Returns null when the player has no cloud save yet. */
export async function downloadProgress(): Promise<{ ok: true; data: SaveData | null } | { ok: false; error: string }> {
  const sb = await getSupabase();
  if (!sb) return { ok: false, error: 'Simpanan awan belum disediakan.' };
  const user = await getCloudUser();
  if (!user) return { ok: false, error: 'Sila log masuk dulu.' };
  const { data, error } = await sb
    .from('player_progress')
    .select('game_state')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data?.game_state) return { ok: true, data: null };
  return { ok: true, data: sanitizeSave(data.game_state) };
}

/**
 * Records a claimed task reward. The (user_id, task_id, cycle_day) unique
 * constraint makes the server reject duplicate claims as well.
 */
export async function recordTaskCompletion(taskId: TaskId, day: number): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;
  const user = await getCloudUser();
  if (!user) return;
  const { error } = await sb
    .from('task_completions')
    .insert({ user_id: user.id, task_id: taskId, cycle_day: day, reward_claimed: true });
  if (error && error.code !== '23505') console.warn('[cloud] task completion not recorded', error.message);
}
