// FREEFALL — THE GO-LIVE (Nov 28 — docs/games/passes/freefall-golive.md): the three iPhone fixes (static), the two flips + what follows
// them, the weekly goal's pin, the cards out of THE LAB, /freefall-lab gone, THE HELD LIST's pure halves (the held row + RELEASE), and the
// counting-ON cases the pure steps can prove (THE DAILY CEILING + countedPlays for a FREEFALL row, the tie-break's win flags).
// The emulators' side: tests/integration/server.test.mjs (the held run end to end, the cards, THE AVERAGE from the 5th run, /board's tab).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import '../api/_lib/catalog.js';   // (the server-only catalog — the achievements' checks)
import { GAMES, isPlayable } from '../js/config.js';
import { GOAL_GAMES, GOAL_FROM, goalGames } from '../js/core/boards.js';
import { weeklyGoal } from '../js/core/ranks.js';
import { weekKey } from '../js/core/week.js';
import { matchStep, releaseStep, countedPlays, RELEASE_KEEP } from '../js/core/progress.js';
import { extractMatch, ffTooPerfect, ffHoldWhy, heldNode, heldId, FF_HOLD } from '../js/core/match-report.js';
import { NAME_GAP, spreadNames } from '../js/games/freefall/matchhud.js';
import { SIGN_HOLD, signRoster } from '../js/core/harbor-neon.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const DAY = 864e5, T0 = Date.UTC(2026, 10, 30, 18);   // (Mon Nov 30, 1 pm New York — the week after the go-live)

test('GROUP 0 — THE TOP LINE clears the corner buttons; THE RAIL\'s names never touch (settled + eased); THE SPIKE RULE rests the tier for the page', () => {
  const hud = read('js/games/freefall/hudgl.js'), stage = read('js/games/freefall/stage.js');
  assert.match(hud, /function topLines\(set, t, A, edge\) \{/, 'the top line: centred right of the corner buttons, two lines at the last \' · \' when too wide');
  assert.match(hud, /lay\(R2\.top, ts, topLines\(ts, st\.top, k\.topA, st\.edge \? st\.edge - ox : 0\)\);/);
  assert.match(stage, /const edge = \(\) => H\.edge\(PAGE && !soundsBtn\.hidden \? soundsBtn\.getBoundingClientRect\(\)\.right : 0\);/, 'the edge read at a STATE CHANGE (never in a frame)');
  // the names: 14.4 px a box (12 px × 1.2) — the gap never smaller; 8 players on ONE slice spread a full gap apart
  assert.equal(NAME_GAP, 17); assert.ok(NAME_GAP > 12 * 1.2 + 2);
  const L = spreadNames(Array.from({ length: 7 }, () => ({ y: 120 })), NAME_GAP, 500).map(x => x.ny).sort((a, b) => a - b);
  for (let i = 1; i < L.length; i++) assert.ok(L[i] - L[i - 1] >= NAME_GAP - 1e-9, `names ${i - 1} + ${i}: ${L[i] - L[i - 1]} px apart`);
  assert.match(hud, /function apart\(M, n, now\) \{/, 'the EASED names kept apart too (no crossing mid-ease)');
  // THE SPIKE RULE: one NO HELP → back and the timing rule never ticks again for the page
  assert.match(stage, /if \(pin == null && !spikeOff && frameN % 10 === 0\) tiers\.tick\(now\);/);
  assert.match(stage, /export const SPIKE = Object\.freeze\(\{ n: 4, span: 20000, trial: 10000, settle: 500, helped: 0\.5, floor: 1 \}\);/, 'the rule itself unchanged');
});

test('GROUP 1 — THE TWO FLIPS: playable (NEW from Nov 28), counting ON with the kill switch kept; THE BOARD\'s eighth tab; THE SIGN HOLD; the teal accents', () => {
  const g = GAMES.find(x => x.id === 'freefall');
  assert.ok(g.playable && !g.preview && g.live === '2026-11-28' && isPlayable('freefall'));
  const ff = read('api/_lib/freefall.js');
  assert.match(ff, /export const FREEFALL_COUNTS = true;/);
  assert.match(read('api/report.js'), /export const freefallCounts = async \(\) => \{ if \(emulated\(\)\) \{ const t = await val\('testFreefallCounts'\); if \(t === true \|\| t === false\) return t; \} return FREEFALL_COUNTS; \};/, 'the emulators\' flip is TWO-WAY: the OFF path stays tested');
  assert.match(read('js/board/view.js'), /export const TABS = Object\.freeze\(\[[^\]]*'highrise', 'freefall'\]\);/);
  assert.match(read('js/board/view.js'), /export const HIDDEN_TABS = Object\.freeze\(\[\]\);/);
  assert.deepEqual([...SIGN_HOLD], ['freefall'], 'held off every city sign until THE CITY PASS installs its sign');
  assert.ok(!signRoster(GAMES).some(x => x.id === 'freefall'));
  for (const [f, re] of [['js/ui/tube-logo.js', /LOGO_ACC = \{[^}]*freefall: '#27e0e6'/], ['js/screens/title.js', /const ACC = \{[^}]*freefall: '#27e0e6'/], ['js/screens/harbor/signs.js', /SIGN_ACC = \{[^}]*freefall: '#27e0e6'/]]) assert.match(read(f), re, `${f}: FREEFALL's teal`);
  assert.ok(!existsSync(new URL('../freefall-lab.html', import.meta.url)) && !existsSync(new URL('../js/games/freefall/lab.js', import.meta.url)) && !existsSync(new URL('../js/games/freefall/graybox.js', import.meta.url)) && !existsSync(new URL('../css/freefall-lab.css', import.meta.url)), '/freefall-lab DELETED');
  assert.ok(existsSync(new URL('../freefall-play.html', import.meta.url)), '/freefall-play stays (never counts)');
  assert.doesNotMatch(read('scripts/serve.mjs') + read('tests/integration/kit/page-loads.mjs'), /freefall-lab'/);
  assert.match(read('tests/integration/e2e-smoke.mjs'), /\['freefall', \{\}\],/, 'its smoke start');
});

test('GROUP 1 — THE WEEKLY GOAL: FREEFALL joins by its row, PINNED out of the week it went live (no mid-week re-roll) — in from the Monday 4 am line', () => {
  assert.ok(GOAL_GAMES.includes('freefall'), 'a playable board game');
  assert.equal(GOAL_FROM.freefall, 'w20261130');
  const live = weekKey(Date.UTC(2026, 10, 28, 15)), next = weekKey(Date.UTC(2026, 10, 30, 10)), before4 = weekKey(Date.UTC(2026, 10, 30, 8));
  assert.deepEqual([live, before4, next], ['w20261123', 'w20261123', 'w20261130'], 'the week turns at the Monday 4 am line (New York)');
  assert.ok(!goalGames(live).includes('freefall') && goalGames(next).includes('freefall'));
  const pre = GOAL_GAMES.filter(x => x !== 'freefall');
  assert.deepEqual(weeklyGoal(live, goalGames(live)), weeklyGoal(live, pre), 'this week\'s goal = the one it was before the flip');
  assert.match(read('js/core/progress.js'), /weeklyGoal\(wk, goalGames\(wk\)\)/); assert.match(read('js/progress/profile.js'), /weeklyGoal\(wk, goalGames\(wk\)\)/, 'the server + the phone the same goal');
});

test('GROUP 1 — THE CARDS out of THE LAB (the owner approved all six): shipped as they are, their tiers without a lab row, no lab text', async () => {
  const { SHIPPED } = await import('../js/vault/approved.js');
  const { SHIPPED_TIERS, LAB } = await import('../js/vault/catalog.js');
  for (const [id, tier] of [['card-splashdown', 'rare'], ['card-terminalvelocity', 'epic'], ['card-rockbottom', 'legendary']]) {
    assert.ok(SHIPPED.includes(id) && SHIPPED.includes(`full-${id}`), `${id}: shipped`);
    assert.equal(SHIPPED_TIERS[id], tier);
    assert.ok(!LAB.some(x => x.id === id || x.id === `full-${id}`), `${id}: no lab row`);
  }
  assert.doesNotMatch(read('api/_lib/lab-text.js'), /HIDDEN until FREEFALL goes live|"card-splashdown"/);
});

// ---- GROUP 2 — THE HELD LIST's pure halves
const tooPerfect = { f: 160, t: 9000, w: 'red', b: 30, bl: 4, br: 52, ft: 'reachedHarbor terminal' };
const soloGame = (uid, r) => ({ id: 'freefall', matchId: 'm1', phase: 'final', mode: 'solo', sv: 1, participants: { [uid]: true }, settings: {}, results: { [uid]: r } });

test('GROUP 2 — a too-perfect run is HELD: XP paid (a counted solo play of XP only), no board row / average / card; its /admin row says why', () => {
  assert.ok(ffTooPerfect(tooPerfect) && FF_HOLD.bestRun === 40);
  const ex = extractMatch(soloGame('u1', tooPerfect));
  const o = ex.rows.u1, rej = ex.rejected.find(r => r.v === 'held');
  assert.deepEqual(o.rec, {}, 'no record'); assert.equal(o.av, undefined, 'no average'); assert.equal(o.f, undefined, 'no card flags'); assert.equal(o.sv, undefined, 'no verified play');
  assert.deepEqual(rej, { uid: 'u1', board: 'freefall-solo', v: 'held', f: 160, b: 30, br: 52, ff: 'harbor terminal', so: 1 }, 'the held row keeps what a RELEASE needs');
  assert.equal(ffHoldWhy(rej), 'NO BOUNCE FOR 52 FLOORS (THE LINE: 40)');
  assert.equal(ffHoldWhy({ f: 150, b: 20, br: 12 }), '0.13 BOUNCES A FLOOR OVER 150 FLOORS (THE LINE: UNDER 0.3 FROM 100)');
  const id = heldId('ABCD_m1', 'p123'), node = heldNode({ key: 'ABCD_m1', pid: 'p123', name: 'FALLER', tag: '1234', r: rej, gid: 'freefall', at: T0 - 5000, now: T0 });
  assert.equal(id, 'ABCD_m1_p123');
  assert.deepEqual(node, { pid: 'p123', n: 'FALLER', t: '1234', g: 'freefall', key: 'ABCD_m1', at: T0 - 5000, f: 160, b: 30, br: 52, ff: 'harbor terminal', so: 1, why: 'NO BOUNCE FOR 52 FLOORS (THE LINE: 40)', rec: T0 });
  assert.equal(heldId('A.B#C', 'x/y'), 'A-B-C_x-y', 'a database key');
  // in a MATCH: held = no win (the XP stands), the row says MATCH
  const m = extractMatch({ ...soloGame('u1', tooPerfect), mode: 'match', participants: { u1: true, u2: true }, results: { u1: tooPerfect, u2: { f: 40, t: 3000, w: 'red', b: 30, br: 6 } } });
  assert.equal(m.rows.u1.win, false); assert.equal(m.rows.u2.win, false, 'the next one down is not given the win either (a held row still placed first)');
  assert.equal(m.rejected.find(r => r.v === 'held').so, 0);
});

test('GROUP 2 — RELEASE (PURE): the board row + THE AVERAGE + the cards as if it had counted, EXACTLY ONCE — never XP, never the streak', () => {
  const s0 = { xp: 1234, st: { n: 3, d: 'd20261129' }, b: { 'freefall-solo': { a: 90, w: 90, wk: 'w20261130' } }, cp: 7, pa: { gf: {} }, it: {} };
  const h = { id: 'ABCD_m1_p123', b: 'freefall-solo', v: 160, solo: true, ft: 'harbor terminal', gid: 'freefall', at: T0 - 60_000 };
  const r = releaseStep(s0, h, T0);
  assert.ok(!r.skip);
  assert.equal(r.next.b['freefall-solo'].a, 160, 'THE BOARD: the best'); assert.equal(r.next.b['freefall-solo'].w, 160, '… this week\'s');
  assert.deepEqual(r.pbs, [{ b: 'freefall-solo', v: 160, prev: 90, first: false }]);
  assert.ok(r.next.av && r.next.av['freefall-solo'], 'THE AVERAGE: its day row'); assert.ok('freefall-solo' in r.av);
  assert.equal(r.next.cp, 8, 'a counted play (a solo run the server replayed — it was held, not refused)');
  assert.equal(r.next.pa.gf['freefall-harbor'], 1); assert.equal(r.next.pa.gf['freefall-terminal'], 1);
  assert.ok(r.next.it['card-splashdown'] && r.next.it['card-terminalvelocity'] && !r.next.it['card-rockbottom'], `the cards its replay earned (${r.items.join(' ')})`);
  assert.ok(r.ach.includes('splashdown') && r.ach.includes('terminal-velocity'));
  assert.equal(r.next.xp, 1234, 'never XP'); assert.deepEqual(r.next.st, s0.st, 'never the streak'); assert.equal(r.next.m, s0.m, 'never a match key');
  assert.equal(releaseStep(r.next, h, T0 + 1000).skip, 'released', 'EXACTLY ONCE (pstats.rl/{id})');
  // a lower held run: the best stays; a MATCH run: no average, no counted play (the room match counted it already)
  const low = releaseStep(s0, { ...h, id: 'x2', v: 60, solo: false, ft: '' }, T0);
  assert.equal(low.next.b['freefall-solo'].a, 90); assert.deepEqual(low.pbs, []); assert.equal(low.next.cp, 7); assert.equal(low.next.av, undefined);
  // the kept ids are capped
  let s = {}; for (let i = 0; i < RELEASE_KEEP + 5; i++) s = releaseStep(s, { ...h, id: `k${i}`, v: 1 }, T0 + i).next;
  assert.equal(Object.keys(s.rl).length, RELEASE_KEEP);
});

test('GROUP 2 — the server + /admin wiring: recorded at the count, owner-only actions audited, a DURABLE node, the rules closed to clients', () => {
  const rep = read('api/report.js'), adm = read('api/admin.js'), held = read('api/_lib/held.js'), ui = read('js/admin/admin.js');
  assert.ok(rep.indexOf("if (ex.rejected.some(r => r && r.v === 'held')) await import('./_lib/held.js')") > rep.indexOf("await ref(`results/${key}`).set({ st: 'done'"), 'recorded once the match is counted');
  assert.match(adm, /case 'heldRelease': case 'heldReject': \{/); assert.match(adm, /await audit\(me, body\.action, r\.pid,/);
  assert.match(held, /ref\(`ffheld\/\$\{id\}`\)\.transaction\(cur => \(cur == null \? null : cur\.st === 'busy'/, 'RELEASE claims the row first (null kept: the server re-runs it on the real row)');
  assert.match(read('api/_lib/backup-pure.js'), /'nocount', 'ffheld'\]\);/);
  assert.doesNotMatch(read('database.rules.json'), /"ffheld"/, 'no client rule — the root is closed (no re-publish)');
  assert.match(ui, /card\('ad-held', 'Held runs'/); assert.match(ui, /confirmBtn\('RELEASE', act\(x, 'heldRelease'\), ''\)/); assert.match(ui, /confirmBtn\('REJECT', act\(x, 'heldReject', 'REJECTED'\), 'is-danger'\)/);
});

// ---- GROUP 3 — counting ON, the pure halves
const roomRow = (rank, f, win) => ({ rank, win, c: { p: 1, ...(win ? { w: 1 } : {}) }, rec: { 'freefall-solo': f } });

test('GROUP 3 — THE DAILY CEILING + countedPlays for FREEFALL rows: 20 room matches a streak day pay, the 21st plays for nothing; a verified solo run is a counted play, a held one is not', () => {
  let s = {};
  for (let i = 0; i < 20; i++) { const r = matchStep(s, { key: `R_m${i}`, gid: 'freefall', row: roomRow(1, 40 + i, true), n: 3, now: T0 + i * 60_000, gap: 45_000 }); assert.ok(!r.skip && r.xp.total > 0, `match ${i + 1} pays`); s = r.next; }
  assert.equal(countedPlays(s), 20, 'every counted room match is a counted play');
  const c = matchStep(s, { key: 'R_m20', gid: 'freefall', row: roomRow(1, 99, true), n: 3, now: T0 + 20 * 60_000, gap: 45_000 });
  assert.equal(c.xp.total, 0, 'THE DAILY CEILING: the 21st pays nothing'); assert.deepEqual(c.pbs, [], '… moves no board');
  assert.equal(c.next.b['freefall-solo'].a, 59, '… the best stays the 20th\'s');
  // a SOLO run the server replayed (sv) → +1 counted play; a held one (no sv) → none
  const solo = (sv, key) => matchStep({}, { key, gid: 'freefall', row: { rank: 1, win: false, c: { p: 1 }, rec: { 'freefall-solo': 50 }, solo: true, ...(sv ? { sv: 1, av: { 'freefall-solo': 50 } } : {}) }, n: 1, now: T0, gap: 0 });
  assert.equal(solo(true, 'a').next.cp, 1); assert.equal(solo(false, 'b').next.cp, 0);
});

test('GROUP 3 — THE TIE-BREAK through the report: the same floor → the earlier tick wins alone; the same floor AND tick = a SHARED first (both win in a room of 3) · a room of 2 all tied = a DRAW (nobody wins)', () => {
  const g = res => ({ id: 'freefall', matchId: 'm', phase: 'final', mode: 'match', sv: 1, participants: Object.fromEntries(Object.keys(res).map(u => [u, true])), settings: {}, results: res });
  const R = (f, t) => ({ f, t, w: 'red', b: 20, br: 5 });
  let ex = extractMatch(g({ a: R(80, 4000), b: R(80, 3900), c: R(30, 2000) }));
  assert.deepEqual(['a', 'b', 'c'].map(u => [ex.rows[u].rank, ex.rows[u].win]), [[2, false], [1, true], [3, false]], 'the earlier tick wins');
  ex = extractMatch(g({ a: R(80, 4000), b: R(80, 4000), c: R(30, 2000) }));
  assert.deepEqual(['a', 'b', 'c'].map(u => [ex.rows[u].rank, ex.rows[u].win]), [[1, true], [1, true], [3, false]], 'a shared first: both win');
  ex = extractMatch(g({ a: R(80, 4000), b: R(80, 4000) }));
  assert.deepEqual(['a', 'b'].map(u => [ex.rows[u].rank, ex.rows[u].win]), [[1, false], [1, false]], 'EVERYONE TIED = a DRAW');
  assert.ok(['a', 'b'].every(u => ex.rows[u].rec['freefall-solo'] === 80), '… each best still counts');
});
