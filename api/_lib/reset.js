// THE PROGRESS RESET (THE SPEED PASS add-on — the owner, Nov 4): /admin's PROGRESS RESET card, admins only (api/admin.js — audited), on
// the server's own credentials; REPEATABLE (now AND at THE SWITCH-OVER). The rules of what goes + what stays: js/core/reset.js (PURE).
//   progressReset { confirm?, typed? } → the DRY RUN (confirm false): { preview: { profiles, xp, records, achievements, streaks, items: 0,
//       boards (lb entries) }, line } — nothing written. confirm true + typed === 'RESET':
//       1. THE BACKUP — backups/{stamp}: every profile's whole pstats + its profile's progress fields, lb/, pcount/n + pcount/a (server only:
//          no rule reads it; ~a few KB a player — the free plan's 1 GB holds thousands of them); the newest BACKUP_KEEP kept
//       2. FOUNDING MEMBER FIRST — founderSweep(): every player who qualifies gets the card BEFORE anything is wiped (never costs anyone it)
//       3. THE RESET — pstats/{pid} = resetStats(…), profiles/{pid}/{x,l,r,s,sd,m}, lb/ removed, pcount/n + pcount/a removed (the
//          achievements' "X% have this" start again; pcount/i — the items' — stays: everyone keeps them)
//     → { done, stamp, preview, line, founders }. A second run is harmless (everything is already at zero; a new small backup).
//   progressBackups → { backups: [{ stamp, at, by, profiles }] } newest first
//   progressRestore { stamp, confirm, typed: 'RESTORE' } → puts a backup's progress back (the items each player owns NOW are kept + the
//       backup's merged in — a restore never takes an item away)
import { ref, val } from './fb.js';
import { resetStats, resetProfile, resetCost, previewLine, RESET_STATS } from '../../js/core/reset.js';
import { founderSweep } from './founder.js';
import { clearBoardCache } from './lb.js';
import { ApiError } from './http.js';

export const BACKUP_KEEP = 5;
const PROFILE_FIELDS = ['x', 'l', 'r', 's', 'sd', 'm'];

async function snapshot() {
  const [stats, profiles, lb, pn, pa] = await Promise.all([val('pstats'), val('profiles'), val('lb'), val('pcount/n'), val('pcount/a')]);
  return { stats: stats || {}, profiles: profiles || {}, lb: lb || null, pn: pn || 0, pa: pa || null };
}

function previewOf(S) {
  const p = { profiles: 0, xp: 0, records: 0, achievements: 0, streaks: 0, items: 0, boards: 0 };
  for (const pid of Object.keys(S.profiles)) {
    if (!S.profiles[pid] || !S.profiles[pid].n) continue;
    p.profiles++;
    const c = resetCost(S.stats[pid]);
    p.xp += c.xp; p.records += c.records; p.achievements += c.achievements; p.streaks += c.streak ? 1 : 0;
  }
  for (const periods of Object.values(S.lb || {})) for (const rows of Object.values(periods || {})) p.boards += Object.keys(rows || {}).length;
  return p;
}

export async function progressReset({ confirm = false, typed = '', me = null, now = Date.now() } = {}) {
  const S0 = await snapshot();
  const preview = previewOf(S0);
  if (!confirm) return { done: false, preview, line: previewLine(preview) };
  if (typed !== 'RESET') throw new ApiError(400, 'type_reset', 'Type RESET to confirm.');
  // 1. THE BACKUP (before anything changes)
  const stamp = `b${now}`;
  const prof = {};
  for (const [pid, p] of Object.entries(S0.profiles)) if (p) prof[pid] = Object.fromEntries(PROFILE_FIELDS.filter(k => p[k] != null).map(k => [k, p[k]]));
  await ref(`backups/${stamp}`).set({ at: now, by: me, profiles: preview.profiles, s: S0.stats, p: prof, lb: S0.lb, pn: S0.pn, pa: S0.pa });
  const all = Object.keys((await val('backups')) || {}).sort();
  if (all.length > BACKUP_KEEP) await ref('backups').update(Object.fromEntries(all.slice(0, all.length - BACKUP_KEEP).map(k => [k, null])));
  // 2. FOUNDING MEMBER FIRST
  const founders = await founderSweep(now);
  // 3. THE RESET (read again: the sweep just granted cards)
  const stats = (await val('pstats')) || {};
  const patch = { lb: null, 'pcount/n': null, 'pcount/a': null };
  for (const [pid, s] of Object.entries(stats)) {
    const next = resetStats(s);
    for (const k of RESET_STATS) patch[`pstats/${pid}/${k}`] = next && next[k] !== undefined ? next[k] : null;
  }
  for (const [pid, p] of Object.entries(S0.profiles)) if (p && p.n) for (const [k, v] of Object.entries(resetProfile())) patch[`profiles/${pid}/${k}`] = v;
  await ref('/').update(patch);
  clearBoardCache();
  return { done: true, stamp, preview, line: previewLine(preview), founders };
}

export async function progressBackups() {
  const all = (await val('backups')) || {};
  return { backups: Object.entries(all).map(([stamp, b]) => ({ stamp, at: b.at, by: b.by || null, profiles: b.profiles || 0 })).sort((a, b) => b.at - a.at) };
}

export async function progressRestore({ stamp, confirm = false, typed = '' } = {}) {
  if (!/^b\d{10,16}$/.test(String(stamp || ''))) throw new ApiError(400, 'bad_stamp');
  const B = await val(`backups/${stamp}`);
  if (!B) throw new ApiError(404, 'no_backup', 'No such backup.');
  if (!confirm) return { done: false, stamp, profiles: B.profiles || 0 };
  if (typed !== 'RESTORE') throw new ApiError(400, 'type_restore', 'Type RESTORE to confirm.');
  const [cur, profs] = await Promise.all([val('pstats').then(v => v || {}), val('profiles').then(v => v || {})]);
  const patch = { lb: B.lb || null, 'pcount/n': B.pn || null, 'pcount/a': B.pa || null };
  // (only profiles that still exist — one removed since the backup (TEST PLAYERS) never comes back as a half node)
  for (const [pid, s] of Object.entries(B.s || {})) {
    if (!profs[pid]) continue;
    for (const k of RESET_STATS) patch[`pstats/${pid}/${k}`] = s && s[k] !== undefined ? s[k] : null;
    // (a restore never takes an item away: what they own now + what the backup had)
    if (s && s.it) patch[`pstats/${pid}/it`] = { ...s.it, ...((cur[pid] && cur[pid].it) || {}) };
  }
  for (const [pid, p] of Object.entries(B.p || {})) if (profs[pid]) for (const k of PROFILE_FIELDS) patch[`profiles/${pid}/${k}`] = p[k] != null ? p[k] : null;
  await ref('/').update(patch);
  clearBoardCache();
  return { done: true, stamp, profiles: B.profiles || 0 };
}
