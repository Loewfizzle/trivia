// THE PROGRESS RESET (THE SPEED PASS add-on — the owner, Nov 4: REPEATABLE — he runs it now AND at THE SWITCH-OVER), PURE — the server
// (api/_lib/reset.js) runs it on every profile from /admin: a backup first, a preview, CONFIRM twice (type RESET). EVERYONE KEEPS THEIR
// REWARDS (the owner's rule): only PROGRESS goes.
//   RESETS (pstats/{pid}): xp (→ LEVEL 1, the emblem rank), g (the career counters = MASTERY + the per-match counters), gw + wk (this
//     week), b (the records), day, gd (the weekly goal paid), pa + ac (the achievements' progress + the achievements), dl (the dailies),
//     st (THE STREAK — its run, best, history, win-back; the FREEZES HELD stay: a freeze is a reward)
//   RESETS (profiles/{pid}): x, l, r (XP, level, rank), s + sd (the streak shown), m (counted matches — the boards' 3-match floor)
//   KEEPS: it (EVERY item: cards, emblems, tube styles, glows, finishes — the dev + gift 1-of-1s, FOUNDING MEMBER), fv (favors held), m{}
//     (the counted-match keys: a match from before the reset can never be counted again), ov (the overlap windows), fd, last, and any field
//     this list doesn't name (a future node is kept, never wiped by accident); the profile itself — name, tag, colour, emblem, MEMBER Nº,
//     the key, the equipped card + finishes
import { levelOf, emblemRank } from './levels.js';

/** the progress fields of pstats/{pid} that the reset clears */
export const RESET_STATS = Object.freeze(['xp', 'xw', 'dp', 'g', 'gw', 'wk', 'b', 'day', 'gd', 'pa', 'ac', 'dl', 'st']);   // (BOARD 2.0 A: + xw — this week's XP, dp — the daily points)

/** one player's stats after the reset (null stays null) */
export function resetStats(s) {
  if (!s || typeof s !== 'object') return s || null;
  const out = {};
  for (const [k, v] of Object.entries(s)) if (!RESET_STATS.includes(k)) out[k] = v;
  const f = s.st && s.st.f;
  if (f > 0) out.st = { f };   // (the freezes held are a reward: a new run starts with them)
  return out;
}

/** the profile fields the reset writes (a patch under profiles/{pid}/) */
export function resetProfile() {
  return { x: 0, l: levelOf(0), r: emblemRank(0), s: null, sd: null, m: 0 };
}

/** what one player's reset takes: { xp, records, achievements, items (always 0 — the rule), streak } */
export function resetCost(s) {
  const st = s || {};
  return {
    xp: st.xp || 0,
    records: Object.keys(st.b || {}).length,
    achievements: Object.keys(st.ac || {}).length,
    streak: (st.st && st.st.n) || 0,
    items: 0,
  };
}

/** THE PREVIEW line: "46 profiles · 12,340 XP · 9 board records · 31 achievements will be reset; 0 items removed" */
export function previewLine(p) {
  const n = v => Number(v || 0).toLocaleString('en-US');
  return `${n(p.profiles)} profile${p.profiles === 1 ? '' : 's'} · ${n(p.xp)} XP · ${n(p.records)} board record${p.records === 1 ? '' : 's'} · ${n(p.achievements)} achievement${p.achievements === 1 ? '' : 's'} · ${n(p.streaks)} streak${p.streaks === 1 ? '' : 's'} will be reset; ${n(p.items)} items removed`;
}

/** the next level with a reward this player does NOT own yet (levels: [{ lvl, item }] — the server's table; owned: { itemId: at }) */
export function nextUnownedLevel(levels, lvl, owned = {}) {
  const ahead = (levels || []).filter(r => r.lvl > lvl && !(owned && owned[r.item])).map(r => r.lvl);
  return ahead.length ? Math.min(...ahead) : null;
}
