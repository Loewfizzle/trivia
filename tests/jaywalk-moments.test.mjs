// JAYWALK J1 — THE MATCH MOMENTS, the rules (PURE — js/games/jaywalk/moments.js; docs/jaywalk.md "THE MATCH MOMENTS"): every OUT from the
// player's OWN end (their node's `e` / this phone's own engine) — never the host's state; HEAD TO HEAD exactly once when a 3+ match narrows
// TO two (never at the start, never in a 2-player match); the duel strip; LAST ONE STANDING for the survivor; THE MOTHERSHIP is no out; a
// rejoin replays nothing; the words. + the screen half wired as the prompt asks (sources).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMoments, stepMoments, bannerWords, lastWords, OUT_MERGE_MS, BANNER_MS, X_MS } from '../js/games/jaywalk/moments.js';

const e = (l, w = 'car') => ({ l, t: l * 30, w });
const run = (M, ids, me, ends, mine = null, lanes = {}) => stepMoments(M, { ids, me, ends, mine, lanes });

test('4 PLAYERS → 3 → 2 → 1: an OUT event per out (with the players left), HEAD TO HEAD ONCE at two, the duel strip from then, LAST ONE STANDING for the survivor', () => {
  const ids = ['ben', 'mia', 'liam', 'jo'], M = createMoments(), ends = { mia: null, liam: null, jo: null };
  let s = run(M, ids, 'ben', ends);
  assert.deepEqual(s.events, []); assert.equal(s.duel, null, 'no strip with four in');
  ends.mia = e(87); s = run(M, ids, 'ben', ends);
  assert.deepEqual(s.events, [{ k: 'out', uid: 'mia', l: 87, left: 3 }]);
  s = run(M, ids, 'ben', ends); assert.deepEqual(s.events, [], 'one event per out — never again');
  ends.liam = e(90); s = run(M, ids, 'ben', ends, null, { ben: 142, jo: 138 });
  assert.deepEqual(s.events, [{ k: 'out', uid: 'liam', l: 90, left: 2 }, { k: 'h2h', a: 'ben', b: 'jo' }]);
  assert.deepEqual(s.duel, ['ben', 'jo'], 'the duel strip');
  s = run(M, ids, 'ben', ends); assert.equal(s.events.length, 0, 'HEAD TO HEAD exactly once');
  ends.jo = e(150); s = run(M, ids, 'ben', ends, null, { ben: 173, jo: 150 });
  assert.deepEqual(s.events, [{ k: 'out', uid: 'jo', l: 150, left: 1 }, { k: 'last', lead: 23 }]);
  assert.equal(s.duel, null, 'the strip ends with the duel');
  assert.equal(lastWords(23), '+23 LANES AHEAD · KEEP GOING');
});

test('a 2-PLAYER MATCH: no HEAD TO HEAD / siren ever — the duel strip from the start; LAST ONE STANDING when the other goes out', () => {
  const M = createMoments(), ends = { jo: null };
  let s = run(M, ['ben', 'jo'], 'ben', ends);
  assert.deepEqual(s.duel, ['ben', 'jo']);
  ends.jo = e(40); s = run(M, ['ben', 'jo'], 'ben', ends, null, { ben: 41, jo: 40 });
  assert.deepEqual(s.events.map(x => x.k), ['out', 'last']);
  assert.ok(!s.events.some(x => x.k === 'h2h'));
});

test('THIS PHONE OUT: no banner for its own out (its OUT card says it), but it counts — the others\' HEAD TO HEAD + no LAST ONE STANDING for a phone that is out', () => {
  const ids = ['ben', 'mia', 'jo'], M = createMoments(), ends = { mia: null, jo: null };
  run(M, ids, 'ben', ends);
  const s = run(M, ids, 'ben', ends, { w: 'water', l: 30 });
  assert.deepEqual(s.events, [{ k: 'h2h', a: 'mia', b: 'jo' }], 'a 3-player match narrowed to two by MY out: HEAD TO HEAD, no banner for me');
  ends.mia = e(80); const t = run(M, ids, 'ben', ends, { w: 'water', l: 30 });
  assert.deepEqual(t.events.map(x => x.k), ['out'], 'Jo survives — no LAST ONE STANDING on my phone');
});

test('A WATCHER (not a player) sees every out + the head-to-head; never LAST ONE STANDING', () => {
  const ids = ['a', 'b', 'c'], M = createMoments(), ends = { a: null, b: null, c: null };
  run(M, ids, 'watcher', ends);
  ends.a = e(10); assert.deepEqual(run(M, ids, 'watcher', ends).events.map(x => x.k), ['out', 'h2h']);
  ends.b = e(20); assert.deepEqual(run(M, ids, 'watcher', ends).events.map(x => x.k), ['out']);
});

test('THE MOTHERSHIP is a finish, not an OUT: no banner, no HEAD TO HEAD, no LAST ONE STANDING when it takes the runs still in', () => {
  const ids = ['a', 'b', 'c'], M = createMoments(), ends = { b: null, c: null };
  run(M, ids, 'a', ends);
  ends.b = e(200, 'taken'); ends.c = e(190, 'taken');
  const s = run(M, ids, 'a', ends, { w: 'taken', l: 210 });
  assert.deepEqual(s.events, []);
});

test('TWO OUTS IN ONE STEP (3 → 1): two OUT events (the view merges them into ONE banner), no HEAD TO HEAD, LAST ONE STANDING', () => {
  const ids = ['a', 'b', 'c'], M = createMoments(), ends = { b: null, c: null };
  run(M, ids, 'a', ends);
  ends.b = e(5); ends.c = e(6);
  assert.deepEqual(run(M, ids, 'a', ends, null, { a: 9, b: 5, c: 6 }).events.map(x => x.k), ['out', 'out', 'last']);
  const W = bannerWords([{ name: 'MIA', l: 5 }, { name: 'LIAM', l: 6 }], 1);
  assert.equal(W.head, 'MIA + LIAM OUT'); assert.equal(W.sub, '1 LEFT');
  const O = bannerWords([{ name: 'MIA', l: 87 }], 3);
  assert.equal(O.head, 'MIA IS OUT'); assert.equal(O.sub, '87 LANES · 3 LEFT');
  assert.ok(OUT_MERGE_MS <= 1000 && BANNER_MS === 1500 && X_MS === 1500);
});

test('A REFRESH / REJOIN mid-duel: the state as it stands is the baseline — no moment replayed — and the duel strip is drawn from the state at once', () => {
  const ids = ['a', 'b', 'c', 'd'], M = createMoments();
  const s = run(M, ids, 'a', { b: e(3), c: e(9), d: null });
  assert.deepEqual(s.events, []); assert.deepEqual(s.duel, ['a', 'd']);
  assert.deepEqual(run(M, ids, 'a', { b: e(3), c: e(9), d: e(12) }, null, { a: 20, d: 12 }).events.map(x => x.k), ['out', 'last']);
});

test('AN HONEST END GAME never shows a fake OUT: the moments read ONLY each player\'s own end (`e`) — the host\'s phase / results are never an input', () => {
  const src = readFileSync(new URL('../js/games/jaywalk/moments.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(src, /phase|results|final|game\./, 'no host state in the rules');
  const ids = ['a', 'b', 'c'], M = createMoments();
  run(M, ids, 'a', { b: null, c: null });
  assert.deepEqual(run(M, ids, 'a', { b: null, c: null }).events, [], 'the host ended the match: nobody\'s own end came — nothing shows');
  const v = readFileSync(new URL('../js/games/jaywalk/view.js', import.meta.url), 'utf8');
  assert.match(v, /ends\[u\] = e \|\| null/, 'the view feeds the nodes\' own `e`');
  assert.match(v, /const own = mine\(g\) && run && isOver\(run\)/, '… and this phone\'s own engine');
});

test('THE SCREEN (moments-view.js + css): nothing over the lanes\' middle (the top band only), pointer-events none, Reduced motion = a steady glow, the sounds through the shared engine', () => {
  const v = readFileSync(new URL('../js/games/jaywalk/moments-view.js', import.meta.url), 'utf8'), css = readFileSync(new URL('../css/jaywalk.css', import.meta.url), 'utf8');
  for (const id of ['out-drop', 'h2h-siren', 'last-standing']) assert.match(v, new RegExp(`o\\.sound\\('${id}'\\)`));
  assert.match(css, /\.jw-mom \{[^}]*pointer-events: none/);
  for (const c of ['jw-ban', 'jw-h2h', 'jw-duel', 'jw-last']) { const m = css.match(new RegExp(`\\.${c} \\{[^}]*top: calc\\(env\\(safe-area-inset-top\\) \\+ (\\d+)px\\)`)); assert.ok(m && Number(m[1]) <= 160, `${c} sits in the top band (${m && m[1]} px — the lanes' middle clear)`); }
  const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce) { .jw-ban, .jw-h2h, .jw-last'));
  assert.ok(rm.length && rm.split('\n')[0].includes('.jw-flash { display: none; }'), 'Reduced motion: no pulse, no flash');
  assert.match(css, /\.jw-edge\.is-still \{ animation: jw-edge-still/);
  assert.match(css, /\.jw-duel-p\.is-lead::before/, 'the leader marked by a shape');
  assert.doesNotMatch(css.slice(css.indexOf('J1 — THE MATCH MOMENTS'), css.indexOf('@keyframes jw-last')), /border-radius: (999|50%)|border-radius: \d\d+px/, 'no pills');
});
