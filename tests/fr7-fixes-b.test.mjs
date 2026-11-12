// FR7 FIXES B — "the launch + the plumbing" (Nov 12 — docs/harbor/passes/fr7-fixes-b.md): each finding's unit test (each failed before its fix)
import test from 'node:test';
import assert from 'node:assert/strict';
import { streakPlay, FREEZE } from '../js/core/streak.js';
import { resetStats, resetCost, previewLine, RESET_STATS } from '../js/core/reset.js';
import { boardHidden, countedPlays } from '../js/core/progress.js';
import { countedPlaysFromRecords, sinceReset } from '../js/core/board-fill.js';

test('E2 — the freezes a player holds survive THE PROGRESS RESET: a new run starts with them (capped at the hold limit)', () => {
  const day = 'd20261113';
  const after = resetStats({ xp: 900, st: { n: 12, d: 'd20261110', b: 14, f: 2, h: {} } });
  assert.deepEqual(after.st, { f: 2 }, 'the reset keeps the freezes');
  const { st } = streakPlay(after.st, day);
  assert.equal(st.f, 2, 'the first play after the reset keeps 2 freezes (it used to be 0)');
  assert.equal(st.n, 1, 'a new run');
  assert.equal(streakPlay({ f: 9 }, day).st.f, FREEZE.hold, 'capped at the hold limit');
  assert.equal(streakPlay(null, day).st.f, 0, 'a brand-new player: none');
  assert.equal(streakPlay({ f: 'x' }, day).st.f, 0, 'garbage → 0');
});

test('E4 — the reset clears COUNTED PLAYS: the boards\' 3-play floor applies again; the dry run lists them', () => {
  assert.ok(RESET_STATS.includes('cp'), 'cp is a reset field');
  const vet = { xp: 5000, cp: 40, g: { prism: { p: 30, w: 9 } }, it: { 'card-founder': 1 } };
  const prof = { n: 'Vet' };
  assert.equal(boardHidden(prof, vet, 3), false, 'listed before');
  const after = resetStats(vet);
  assert.equal(after.cp, undefined, 'cp gone');
  assert.equal(countedPlays(after), 0, 'no counted plays (the estimate from `g` is gone too)');
  assert.equal(boardHidden(prof, after, 3), 'matches', 'off the boards until 3 counted plays again');
  assert.deepEqual(after.it, vet.it, 'items kept');
  assert.equal(resetCost(vet).plays, 40, 'the cost names the counted plays');
  assert.match(previewLine({ profiles: 2, xp: 10, records: 0, achievements: 0, streaks: 0, plays: 41, items: 0 }), /· 41 counted plays will be reset; 0 items removed$/);
  // the back-fill counts only the plays after THE RESET EPOCH (it used to read every record)
  const results = { a: { at: 100, n: 2, o: { P: {}, Q: {} } }, b: { at: 900, n: 2, o: { P: {} } } };
  const since = sinceReset({ results, daily: {} }, 500);
  assert.deepEqual(countedPlaysFromRecords(since), { P: 1 }, 'only the post-reset match counts');
});

import fs from 'node:fs';
import { execSync } from 'node:child_process';
/** a JPEG's { w, h } from its SOF marker */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}
test('the link previews: both pages on the PRIMARY host (www — the bare domain is a 308), /board\'s image re-shot (1200×630 JPEG ≤ 300 KB, a new ?v=)', () => {
  for (const f of ['index.html', 'board.html']) {
    const html = fs.readFileSync(f, 'utf8');
    for (const prop of ['og:url', 'og:image', 'twitter:image']) {
      const m = html.match(new RegExp(`(?:property|name)="${prop}" content="([^"]+)"`));
      assert.ok(m, `${f}: ${prop}`);
      assert.match(m[1], /^https:\/\/www\.neonspeakeasy\.com\//, `${f}: ${prop} on www (no 308 hop) — ${m[1]}`);
    }
  }
  const board = fs.readFileSync('board.html', 'utf8');
  assert.ok(!/og-board\.jpg\?v=1\b/.test(board), 'the board image\'s cache key bumped past v=1 (the old bar picture)');
  const img = fs.readFileSync('assets/og-board.jpg');
  assert.ok(img.length <= 300 * 1024, `og-board.jpg ${Math.round(img.length / 1024)} KB ≤ 300`);
  assert.deepEqual(jpegSize(img), { w: 1200, h: 630 });
});

test('D2 — DEFERRED to THE LAUNCH (the owner): NO edge cache on /js /css /assets in this pass; the worker network-first, no-cache, as before', () => {
  const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const cc = src => { const r = cfg.headers.find(x => x.source === src); const h = r && r.headers.find(x => x.key === 'Cache-Control'); return h ? h.value : null; };
  for (const d of ['js', 'css', 'assets']) assert.equal(cc(`/${d}/(.*)`), null, `${d}: no cache header yet — the owner checks every deploy on his iPhone at once`);
  const sw = fs.readFileSync('sw.js', 'utf8');
  assert.match(sw, /fetch\(req, \{ cache: 'no-cache' \}\)/, 'network-first, every file revalidated, as before');
  assert.ok(!/BUILD_PREFIX|toPage|modeFor/.test(sw), 'no per-deploy copy yet (docs/launch.md has the step)');
  assert.match(fs.readFileSync('docs/launch.md', 'utf8'), /THE EDGE CACHE/, 'the ready-to-run step is in docs/launch.md');
});

test('THE TWO-TAB HANG — every wait on a store is bounded: the worker\'s activation + its offline reads; the sign-in\'s IndexedDB', () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const act = sw.slice(sw.indexOf("addEventListener('activate'"), sw.indexOf("addEventListener('fetch'"));
  assert.match(act, /await within\(\(async \(\) => \{[\s\S]*caches\.keys\(\)[\s\S]*\}\)\(\), ACTIVATE_STORE_MS, null\);\s*await self\.clients\.claim\(\)/, 'the activation\'s clean-up bounded, then the claim');
  assert.match(sw, /const cached = await within\(caches\.match\(req/, 'the offline fallback\'s read bounded');
  const fb = fs.readFileSync('js/firebase.js', 'utf8');
  assert.match(fb, /const idbOk = await idbP;\s*if \(!idbOk\) \{\s*hideIdb\(\);[\s\S]{0,400}?\}\s*app = sdk\.initializeApp/, 'the probe decides BEFORE the SDK\'s app (its heartbeat opens IndexedDB)');
  assert.match(fb, /persistence: idbOk \? \[sdk\.browserLocalPersistence, sdk\.indexedDBLocalPersistence\] : \[sdk\.browserLocalPersistence\]/);
  // (Grok's second opinion: probe what the SDK opens NEXT, never creating a database by an upgrade)
  assert.match(fb, /export const IDB_PROBE_DBS = Object\.freeze\(\['firebaseLocalStorageDb', 'firebase-heartbeat-database'\]\);/);
  assert.match(fb, /rq\.onupgradeneeded = \(\) => \{ fresh = true; try \{ rq\.transaction\.abort\(\);/);
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /if \(!done && armedAt >= 0 && vis - armedAt >= WAYOUT\) \{[^}]*offerTap\(\); \}/, 'an armed reload that never came → TAP TO TRY AGAIN');
  assert.match(html, /new BroadcastChannel\('ns-tabs'\)/, 'the other tabs counted by a BroadcastChannel (never a socket)');
  assert.match(html, /' · other tabs open: ' \+ otherTabs\(\)/, 'the BOOT HANG report names the count');
});

// (idbAnswers' behaviour — a silent IndexedDB, a new + a returning player still signed in — is proven in WebKit: tests/integration/wk-twotabs.mjs;
//  js/firebase.js reads `location` at load, so it isn't imported here)

test('UMBRELLAS IN THE RAIN — the share grows with the rain: none under 0.12, ~1 in 3 at drizzle (0.22), ~3 in 4 in real rain; newspapers + collars fill in', async () => {
  const { lookOf, rainGear, RAIN_GEAR_MIN } = await import('../js/screens/harbor/folk.js');
  assert.equal(RAIN_GEAR_MIN, 0.12);
  assert.equal(rainGear(0.1).umbrella, 0);
  assert.ok(Math.abs(rainGear(0.22).umbrella - 1 / 3) < 0.03, `drizzle: ${rainGear(0.22).umbrella.toFixed(3)}`);
  assert.equal(rainGear(0.3).umbrella, 0.74); assert.equal(rainGear(0.8).umbrella, 0.74);
  const share = (rain, n = 3000) => {
    let u = 0, p = 0, c = 0, all = 0;
    for (let i = 0; i < n; i++) { const L = lookOf('walker', 1000 + i, { season: 'autumn', rain }); if (L.jog) continue; all++; if (L.umbrella) u++; else if (L.paper) p++; else if (L.collar) c++; }
    return { u: u / all, p: p / all, c: c / all, any: (u + p + c) / all };
  };
  const dry = share(0), drz = share(0.22), wet = share(0.5);
  assert.equal(dry.any, 0, 'dry: nobody');
  assert.ok(drz.u > 0.27 && drz.u < 0.4, `drizzle 0.22: umbrellas ${(drz.u * 100).toFixed(0)} % (about 1 in 3)`);
  assert.ok(drz.p > 0.05 && drz.c > 0.05, `drizzle: newspapers ${(drz.p * 100).toFixed(0)} % + collars up ${(drz.c * 100).toFixed(0)} % filling in`);
  assert.ok(wet.u > 0.68 && wet.u < 0.8, `real rain: umbrellas ${(wet.u * 100).toFixed(0)} % (about 3 in 4, as today)`);
  // real rain: the SAME look as before the change (the umbrella / newspaper draws unchanged; the collars on their own stream)
  for (let i = 0; i < 300; i++) {
    const a = lookOf('walker', 5000 + i, { season: 'autumn', rain: 0.5, wind: 12 }), b = lookOf('walker', 5000 + i, { season: 'autumn', rain: 0.9, wind: 12 });
    assert.deepEqual([a.umbrella, a.paper, a.holdHat, a.stride, a.dog], [b.umbrella, b.paper, b.holdHat, b.stride, b.dog], `seed ${5000 + i}: the same draws at any real-rain level`);
  }
});

test('UMBRELLAS IN THE RAIN — THE PEOPLE RULE: a walker\'s rain gear is fixed when their visit starts — the rain crossing a line never changes anyone in view', async () => {
  const { entryRain } = await import('../js/screens/harbor/folk.js');
  const rainOf = entryRain();
  assert.equal(rainOf('v1|7', 0.05), 0.06);   // (rounded to 0.02)
  assert.equal(rainOf('v1|7', 0.6), 0.06, 'the same visit: the rain it came in with, whatever the rain does now');
  assert.equal(rainOf('v2|7', 0.6), 0.6, 'a NEW visit (a walker entering now): today\'s rain');
  const people = fs.readFileSync('js/screens/harbor/people.js', 'utf8');
  assert.ok(!/env\.rain > 0\.3/.test(people), 'the look key no longer flips everyone at the 0.3 line');
  assert.match(people, /const rain0 = rainOf\(`\$\{mem\.vid\}\|\$\{mem\.m\.seed\}`, env\.rain\)/);
});

test('C5 — no /api code reads the WHOLE rooms tree (the live rooms come through the index: api/_lib/rooms-live.js)', () => {
  const files = execSync('git ls-files api', { encoding: 'utf8' }).split('\n').filter(f => f.endsWith('.js'));
  for (const f of files) assert.ok(!/val\(\s*['"`]rooms['"`]\s*\)/.test(fs.readFileSync(f, 'utf8')), `${f} reads the whole rooms tree`);
  assert.match(fs.readFileSync('api/_lib/rooms-live.js', 'utf8'), /orderByChild\('meta\/activeAt'\)\.startAt\(now - within\)\.limitToLast\(max\)/);
});

test("PD2 — SCORE RUSH's tighter margin (3 → 2.8, from a fresh sim): a run 3× the sim's best on prism3 is refused now; every best run still ≥ 2.5× under it", async () => {
  const { maxRushScore, RUSH_PACE } = await import('../js/core/match-report.js');
  assert.equal(RUSH_PACE.margin, 2.8);
  // (the sim, Nov 12 — node scripts/sim-prism-rush.mjs 24 4: prism3 141.8 s best 285,228; prism4 126.7 s best 248,202 — the tightest)
  assert.ok(maxRushScore(400, 141.8) < 3 * 285_228, `prism3: the bound ${maxRushScore(400, 141.8)} < 3 × its best (it was 866,377)`);
  assert.ok(maxRushScore(400, 141.8) >= 2.5 * 285_228, 'prism3: still ≥ 2.5 × the best run');
  assert.ok(maxRushScore(400, 126.7) >= 2.5 * 248_202, 'prism4: still ≥ 2.5 × the best run');
});

test('the NICE lines (FR7-A): HOST raced against 20 s with a plain line (one attempt at a time); a 425 backs off to 60 s; a radioWho NO remembered per profile', () => {
  const dock = fs.readFileSync('js/screens/title-dock.js', 'utf8');
  assert.match(dock, /const HOST_WAIT_MS = 20_000;/);
  assert.match(dock, /hostP = hostP \|\| createRoom\(p\)\.finally\(\(\) => \{ hostP = null; \}\);\s*await Promise\.race\(\[hostP, new Promise\(\(_, rej\) => setTimeout\(\(\) => rej\(new Error\('city-full'\)\), HOST_WAIT_MS\)\)\]\);/);
  assert.match(dock, /if \(\/city-full\/\.test\(m\)\) return 'The city’s full tonight — try again in a minute\.';/);
  const q = fs.readFileSync('js/profile/queue.js', 'utf8');
  assert.match(q, /e\.status === 425 \? Math\.min\(SETTLE_MAX_MS, 2000 \* 2 \*\* Math\.max\(0, x\.n - 1\)\)/);
  assert.match(q, /const SETTLE_MAX_MS = 60_000;/);
  const gate = fs.readFileSync('js/screens/harbor/radio-gate.js', 'utf8');
  assert.match(gate, /else if \(answered\) ss\.set\(KEY, \{ no: true, pid: lastPid, at: Date\.now\(\) \}\);/, 'a NO remembered (never a lost call)');
  assert.match(gate, /const no = !role && c && c\.no && c\.at > Date\.now\(\) - KEEP_MS && c\.pid === lastPid;/, '… for that profile only');
});

test('A SEAT IS NOT A PLAY — the walk back keeps the proof nodes; A RE-START KEEPS THE LAST MATCH\'s (every older match pruned, best effort)', async () => {
  const host = fs.readFileSync('js/host.js', 'utf8');
  assert.match(fs.readFileSync('js/games/registry.js', 'utf8'), /export const PROOF_NODE_LIST = Object\.freeze\(\['prism', 'oc', 'ocm'\]\);/);
  const back = host.slice(host.indexOf('export async function backToLobby'), host.indexOf('/** TESTS: backToLobby'));
  assert.match(back, /\.\.\.clearPlayerNodes\(true\)/, 'the walk back keeps them');
  const start = host.slice(host.indexOf('async function startGameNow'), host.indexOf('async function pruneProofs'));
  assert.match(start, /\.\.\.clearPlayerNodes\(true\),/, 'the start keeps them out of its atomic clear');
  assert.match(start, /pruneProofs\(state\.code, \[prevM, matchId\]\);/, 'then every match but the previous + the new one is pruned');
  const { staleProofPaths } = await import('../js/core/room-logic.js');
  assert.deepEqual(staleProofPaths({ prism: { A: {}, B: {}, Z: {} }, oc: { B: {}, Y: {} }, ocm: null }, ['B', 'C']), { 'prism/A': null, 'prism/Z': null, 'oc/Y': null });
  const rep = fs.readFileSync('api/report.js', 'utf8');
  assert.match(rep, /if \(!\(players && players\[u\]\) \|\| !playedIt\(u\)\) delete ex\.rows\[u\];/, 'every credited uid needs its own proof');
  assert.match(rep, /const real = realPlayers\(named\.filter\(playedIt\), players, known\)\.length;/, 'dropped BEFORE the count');
});

test('SIGHTINGS NEED THE CITY OPEN — the stamp\'s rules (PURE): one opening while the hellos keep coming, the previous kept; covers t with a lead + a trail; QUEUE_MS 15 min', async () => {
  const { cityOpenAt, openStep, QUEUE_MS, OPEN_LEAD_MS, OPEN_TRAIL_MS, CITY_GAP_MS } = await import('../js/core/sightings.js');
  assert.equal(QUEUE_MS, 15 * 60e3);
  let co = openStep(null, 1_000_000);
  co = openStep(co, 1_120_000); co = openStep(co, 1_240_000);
  assert.deepEqual([co.a, co.b], [1_000_000, 1_240_000], 'one opening');
  const later = openStep(co, 1_240_000 + CITY_GAP_MS + 1);
  assert.equal(later.a, 1_240_000 + CITY_GAP_MS + 1); assert.deepEqual(later.p, { a: 1_000_000, b: 1_240_000 }, 'the previous opening kept');
  assert.ok(cityOpenAt(later, 1_100_000), 'a t in the previous opening');
  assert.ok(cityOpenAt(co, 1_000_000 - OPEN_LEAD_MS) && !cityOpenAt(co, 1_000_000 - OPEN_LEAD_MS - 1));
  assert.ok(cityOpenAt(co, 1_240_000 + OPEN_TRAIL_MS) && !cityOpenAt(co, 1_240_000 + OPEN_TRAIL_MS + 1));
  assert.equal(cityOpenAt(null, 5), false, 'no stamp → closed');
});

test('PRESENT = PROVEN — an OVERCLOCK phone writes its own board when a challenge opens (never over one that exists; never DUMB LUCK\'s)', () => {
  const v = fs.readFileSync('js/games/overclock/view.js', 'utf8');
  assert.match(v, /if \(!boardsNow\(game\)\[me\(\)\] && game\.phase === 'play' && game\.order\[game\.ci\] !== LUCK && chal\.parts >= 1\) \{\s*dbUpdate\(dbRef\(`rooms\/\$\{st\.code\}\/oc\/\$\{game\.matchId\}\/\$\{game\.ci\}\/\$\{me\(\)\}`\), \{ p: 0, ok: 0, n: Math\.min\(12, chal\.parts\), done: false, at: serverTimestamp\(\) \}\)/);
});

test('THE QUEUE + THE STAMP AGREE — the gap = the queue (15 min); a hello after 5 silent minutes extends the opening; the phone keeps a no_stamp', async () => {
  const { openStep, cityOpenAt, stampBehind, CITY_GAP_MS, QUEUE_MS } = await import('../js/core/sightings.js');
  assert.ok(CITY_GAP_MS >= QUEUE_MS);
  let co = openStep(null, 0); co = openStep(co, 60e3); co = openStep(co, 60e3 + 5 * 60e3);
  assert.deepEqual([co.a, co.b], [0, 360e3], 'one opening across the silence');
  assert.ok(cityOpenAt(co, 60e3 + 4 * 60e3), 'a tap at minute 4 of the silence is covered');
  assert.ok(stampBehind(null, 5) && stampBehind({ a: 0, b: 0 }, 10 * 60e3) && !stampBehind(co, 300e3));
  const q = fs.readFileSync('js/profile/sightings.js', 'utf8');
  assert.match(q, /QAGE = 15 \* 60e3;/, 'the phone keeps a claim as long as the server takes it');
  assert.match(q, /if \(retryLater\(r\)\) \{ writeQ\(\[\.\.\.readQ\(\), c\]\); return \{ state: 'queued', r \}; \}/, 'a no_stamp answer is kept');
  assert.match(q, /window\.addEventListener\('online', \(\) => \{ flushSightings\(\)/, 'flushed when back online');
  assert.match(fs.readFileSync('js/screens/harbor/remote.js', 'utf8'), /api\('admin', \{ action: 'radioHello' \}\)\.then\(afterHello/, 'flushed after the city\'s hello');
});
