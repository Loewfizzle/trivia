// THE 30 ACHIEVEMENTS + THE AWARD ENGINE (PROGRESSION A), PURE — shared by /api (the only writer) and the screens (names + lines of the
// ones you OWN). The owner's list (plan.md "THE ACHIEVEMENTS — DRAFT", Nov 2): shown ONLY once earned, each with "X% OF PLAYERS HAVE THIS";
// no list of what's left, no totals, no ??? anywhere. Each one unlocks an ITEM (core/items.js).
//
// THE ENGINE: everything that grants (levels, streak milestones, achievements, FOUNDER — later CITY SIGHTINGS) writes items into the
// player's stats (pstats/{pid}/it) inside the one transaction that counts the match / daily / event — IDEMPOTENT (an owned item or a held
// achievement is never granted twice; a replayed report is skipped by its key) and AUDITED by the outcome the server stores
// (results/{key}/o/{pid} — what a match granted — + pstats/{pid}/ac { id: at }).
//
// The counters the checks read (pstats/{pid}/pa — server-only):
//   nt nights with a match · nd the last one · ho rooms hosted · hk the last hosted room · h4 rooms of 4+ hosted · h4k the last one ·
//   lc last places · pn { d, n } matches on tonight's party night · fr { pid: [nights, last night] } (≤ 30 friends) · hol { holiday: 1 } ·
//   m8 an 8-player match · ow a match 2–4 am · rn a real thunderstorm · sn real snow · kn THE KNOCK · pw THE WATCHER's hour ·
//   bd played on your birthday (PROGRESSION B) · sg { legendary: count } + sgt (CITY SIGHTINGS — PROGRESSION B) · gf { flag: 1 } (games)
import { MAX_DAILIES_A_DAY } from './daily.js';

/** The legendaries a sighting can be (PROGRESSION B adds the tap; THE WITNESS = every one of them). A new legendary = a new id here. */
export const LEGENDARIES = ['ufo', 'tr3b', 'blackbird', 'f22', 'ghostship', 'aurora', 'fireball', 'skull', 'btc'];
const sum = (g, k) => Object.values(g || {}).reduce((a, x) => a + ((x && x[k]) || 0), 0);
const A = (id, name, group, item, line, check, x = {}) => ({ id, name, group, item, line, check, ...x });

// THE VAULT 1B — NAMES ONLY TO OWNERS: the 30 achievements (names, lines, checks, items) live on the SERVER (api/_lib/catalog.js); this
// module keeps the ENGINE + a registry the server fills at import (a phone gets display rows only for the ones its player holds).
export const ACHIEVEMENTS = [];
export const ACH = {};
/** THE GAME CONTRACT: the achievements a game brings (its rework adds its own in api/_lib/catalog.js + sets the flags in its match report's `f`). */
export const GAME_ACHIEVEMENTS = {};
/** add achievements (the server's catalog — with their checks — or a response's `ach` display rows for the ones this player holds) */
export function registerAchievements(rows) {
  if (!rows) return;
  for (const a of Array.isArray(rows) ? rows : Object.entries(rows).map(([id, v]) => ({ id, ...v }))) {
    if (!a || !a.id) continue;
    if (!ACH[a.id]) { ACHIEVEMENTS.push(a); ACH[a.id] = a; if (a.game) (GAME_ACHIEVEMENTS[a.game] ||= []).push(a.id); } else Object.assign(ACH[a.id], a);
  }
}
/** Achievements the player HOLDS, newest first (the profile): ac = pstats.ac { id: at }. */
export const heldOf = ac => Object.keys(ac || {}).filter(id => ACH[id]).sort((a, b) => ac[b] - ac[a]).map(id => ACH[id]);

// ------------------------------------------------------------------ the counters
const MAX_FRIENDS = 30;
/**
 * A counted match into the counters. x = { gid, rank, win, n, night (the streak day), hosted, roomKey, party (a party night), hourET,
 * holiday (an id | null), friends [pids], flags { name: 1 } (the game's — match-report's row.f) } → a new pa.
 */
export function noteMatch(pa0, x) {
  const p = { ...(pa0 || {}) };
  if (p.nd !== x.night) { p.nt = (p.nt || 0) + 1; p.nd = x.night; }
  if (x.hosted && x.roomKey && p.hk !== x.roomKey) { p.ho = (p.ho || 0) + 1; p.hk = x.roomKey; }
  if (x.hosted && x.roomKey && x.n >= 4 && p.h4k !== x.roomKey) { p.h4 = (p.h4 || 0) + 1; p.h4k = x.roomKey; }
  if (x.n >= 2 && x.rank === x.n && !x.win) p.lc = (p.lc || 0) + 1;
  if (x.party) p.pn = p.pn && p.pn.d === x.night ? { d: x.night, n: p.pn.n + 1 } : { d: x.night, n: 1 };
  if (x.n >= 8) p.m8 = 1;
  if (x.hourET >= 2 && x.hourET < 4) p.ow = 1;
  if (x.holiday) p.hol = { ...(p.hol || {}), [x.holiday]: 1 };
  if (x.friends && x.friends.length) {
    const fr = { ...(p.fr || {}) };
    for (const f of x.friends) { const c = fr[f]; if (!c) fr[f] = [1, x.night]; else if (c[1] !== x.night) fr[f] = [c[0] + 1, x.night]; }
    const keys = Object.keys(fr);
    if (keys.length > MAX_FRIENDS) keys.sort((a, b) => (fr[b][0] - fr[a][0]) || String(fr[b][1]).localeCompare(String(fr[a][1]))).slice(MAX_FRIENDS).forEach(k => delete fr[k]);
    p.fr = fr;
  }
  for (const [k, v] of Object.entries(x.flags || {})) if (v) {
    p.gf = { ...(p.gf || {}), [`${x.gid}.${k}`]: 1 };
    if (k === 'comeback') p.gf.comeback = 1;
  }
  return p;
}

/** An event outside a match (THE KNOCK, THE WATCHER, the real weather, a SIGHTING, a birthday) into the counters → a new pa (or null: nothing new). */
export function noteEvent(pa0, ev) {
  const p = { ...(pa0 || {}) };
  switch (ev && ev.k) {
    case 'knock': if (p.kn) return null; p.kn = 1; return p;
    case 'watch': if (p.pw) return null; p.pw = 1; return p;
    case 'storm': if (p.rn) return null; p.rn = 1; return p;
    case 'snow': if (p.sn) return null; p.sn = 1; return p;
    case 'birthday': if (p.bd) return null; p.bd = 1; return p;
    case 'sighting': {
      if (!LEGENDARIES.includes(ev.id)) return null;
      p.sg = { ...(p.sg || {}), [ev.id]: ((p.sg && p.sg[ev.id]) || 0) + 1 };
      p.sgt = (p.sgt || 0) + 1;
      return p;
    }
    default: return null;
  }
}

// ------------------------------------------------------------------ THE AWARD ENGINE
/**
 * Every achievement the stats now satisfy that the player doesn't hold yet → held (ac) + its item granted (it). FOUNDER: while the window
 * is open, any player with a counted match (or daily) gets FOUNDING MEMBER. Mutates `next`; → { ach: [ids], items: [ids] } (only new ones).
 */
export function awardAll(next, now, { founderOpen = false } = {}) {
  const pa = next.pa || {};
  const ac = { ...(next.ac || {}) };
  const it = { ...(next.it || {}) };
  const ach = [], items = [];
  for (const a of ACHIEVEMENTS) {
    if (ac[a.id]) continue;
    let ok = false;
    try { ok = !!a.check(next, pa); } catch { ok = false; }
    if (!ok) continue;
    ac[a.id] = now; ach.push(a.id);
    if (a.item && !it[a.item]) { it[a.item] = now; items.push(a.item); }
  }
  // PROGRESSION B — CITY SIGHTINGS: a legendary's FIRST counted sighting → its MATCHED PAIR (its legendary card + its emblem)
  for (const id of LEGENDARIES) {
    if (!(pa.sg && pa.sg[id])) continue;
    for (const item of [`card-sg-${id}`, `emb-sg-${id}`]) if (!it[item]) { it[item] = now; items.push(item); }
  }
  const played = sum(next.g, 'p') + ((next.dl && next.dl.n) || 0);
  if (founderOpen && played >= 1 && !it['card-founder']) { it['card-founder'] = now; items.push('card-founder'); next.fd = 1; }
  if (ach.length) next.ac = ac;
  if (items.length) next.it = it;
  return { ach, items };
}
