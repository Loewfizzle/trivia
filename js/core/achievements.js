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

export const ACHIEVEMENTS = [
  // PLAYING
  A('first-round', 'FIRST ROUND', 'playing', 'glow-ember', 'Your first match.', (s) => sum(s.g, 'p') >= 1),
  A('house-warming', 'HOUSE WARMING', 'playing', 'emb-key', 'You hosted your first room.', (s, p) => p.ho >= 1),
  A('full-house', 'FULL HOUSE', 'playing', 'card-zebra', 'An eight-player match.', (s, p) => !!p.m8),
  A('the-regular', 'THE REGULAR', 'playing', 'card-camo', 'Ten different nights at the bar.', (s, p) => p.nt >= 10),
  A('top-shelf', 'TOP SHELF', 'playing', 'card-brushed', 'Ten wins.', (s) => sum(s.g, 'w') >= 10),
  A('made-man', 'MADE MAN', 'playing', 'card-marble', 'Fifty wins.', (s) => sum(s.g, 'w') >= 50),
  A('kingpin', 'KINGPIN', 'playing', 'card-marquee-gold', 'Two hundred and fifty wins.', (s) => sum(s.g, 'w') >= 250),
  A('the-host', 'THE HOST', 'playing', 'card-marquee', 'Twenty-five rooms of four or more, hosted.', (s, p) => p.h4 >= 25),
  A('comeback-kid', 'COMEBACK KID', 'playing', 'glow-spark', 'Last at the halfway point — then the win.', (s, p) => !!(p.gf && p.gf.comeback)),
  A('last-call', 'LAST CALL', 'playing', 'emb-cocktail', 'Last place, ten times. Have one on the house.', (s, p) => p.lc >= 10),
  A('party-animal', 'PARTY ANIMAL', 'playing', 'card-neoncamo', 'Five matches on one party night.', (s, p) => !!p.pn && p.pn.n >= 5),
  A('night-owl', 'NIGHT OWL', 'playing', 'emb-owl', 'A match between 2 and 4 am.', (s, p) => !!p.ow),
  A('the-crew', 'THE CREW', 'playing', 'emb-glasses', 'The same friend, ten nights.', (s, p) => Object.values(p.fr || {}).some(f => f && f[0] >= 10)),
  // THE CITY
  A('rainmaker', 'RAINMAKER', 'city', 'emb-lightning', 'You played through a real thunderstorm.', (s, p) => !!p.rn),
  A('snowed-in', 'SNOWED IN', 'city', 'emb-snowflake', 'You played while it really snowed.', (s, p) => !!p.sn),
  A('knock-knock', 'KNOCK KNOCK', 'city', 'emb-peephole', 'You know the knock.', (s, p) => !!p.kn),
  A('patience-pays', 'PATIENCE PAYS', 'city', 'card-carbon', 'You waited. Something flew.', (s, p) => !!p.pw),
  // CITY SIGHTINGS (each legendary's own card + emblem pair is PROGRESSION B's; these sit on top) — dormant until B's tap
  A('stargazer', 'STARGAZER', 'sightings', 'glow-starlight', 'Three different legends, seen.', (s, p) => Object.keys(p.sg || {}).length >= 3, { dormant: 'sightings' }),
  A('frequent-flyer', 'FREQUENT FLYER', 'sightings', 'emb-wings', 'Twenty-five sightings.', (s, p) => (p.sgt || 0) >= 25, { dormant: 'sightings' }),
  A('the-witness', 'THE WITNESS', 'sightings', 'card-witness', 'Every legend over the harbor, seen.', (s, p) => LEGENDARIES.every(id => p.sg && p.sg[id]), { dormant: 'sightings' }),
  // DAILIES — dormant until the first daily ships (the contract is built; the fake daily proves them)
  A('daily-bread', 'DAILY BREAD', 'dailies', 'glow-candle', 'A daily on seven different days.', (s) => !!s.dl && s.dl.n >= 7, { dormant: 'dailies' }),
  A('the-triple', 'THE TRIPLE', 'dailies', 'emb-stars', 'Every daily in one day.', (s) => !!s.dl && !!s.dl.day && Object.keys(s.dl.day.g || {}).length >= MAX_DAILIES_A_DAY, { dormant: 'dailies' }),
  A('early-bird', 'EARLY BIRD', 'dailies', 'emb-sunrise', 'A daily before 8 am.', (s) => !!s.dl && s.dl.early >= 1, { dormant: 'dailies' }),
  A('penthouse-suite', 'PENTHOUSE SUITE', 'dailies', 'card-penthouse', 'Top one percent of a daily.', (s) => !!s.dl && s.dl.ph >= 1, { dormant: 'dailies' }),
  // SPECIALS
  A('hodl', 'HODL', 'specials', 'emb-bitcoin', 'Twenty-one nights in a row.', (s) => !!s.st && Math.max(s.st.n || 0, s.st.b || 0) >= 21),
  A('many-happy-returns', 'MANY HAPPY RETURNS', 'specials', 'card-confetti', 'You played on your birthday.', (s, p) => !!p.bd, { dormant: 'birthday' }),
  A('seasons-greetings', 'SEASON’S GREETINGS', 'specials', 'glow-tinsel', 'Three holidays at the bar.', (s, p) => Object.keys(p.hol || {}).length >= 3),
  // GAME-SPECIFIC (placeholders — each game's rework sets 2–3 of its own: GAME_ACHIEVEMENTS + a flag from its match report)
  A('four-on-the-floor', 'FOUR ON THE FLOOR', 'prism', 'emb-prism', 'Four lines at once.', (s, p) => !!(p.gf && p.gf['prism.quad']), { game: 'prism' }),
  A('dead-on', 'DEAD ON', 'overclock', 'emb-bullseye', 'A Closest Call, dead on.', (s, p) => !!(p.gf && p.gf['overclock.exact']), { game: 'overclock' }),
  A('overclocked', 'OVERCLOCKED', 'overclock', 'card-circuit', 'Ten OVERCLOCK wins.', (s) => ((s.g && s.g.overclock && s.g.overclock.w) || 0) >= 10, { game: 'overclock' }),
];
export const ACH = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
/** THE GAME CONTRACT: the achievements a game brings (its rework adds its own here + sets the flags in its match report's `f`). */
export const GAME_ACHIEVEMENTS = ACHIEVEMENTS.filter(a => a.game).reduce((o, a) => ((o[a.game] ||= []).push(a.id), o), {});
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
