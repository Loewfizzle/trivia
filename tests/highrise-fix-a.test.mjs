// HIGH RISE REVIEW FIX A — THE MATCH (docs/games/passes/highrise-fix-a.md · docs/highrise.md "THE MATCH"): the unit half of the pass.
// The browser halves: tests/integration/highrise-place.mjs (THE TOP HUD's gaps, the place ties, WATCH's list) · highrise-spectate.mjs
// (SPECTATE IN SYNC) · e2e-highrise.mjs (YOUR BEST) · e2e-highrise-match.mjs (the look at any hour). MUST 3 + SHOULD 1: highrise-match.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';

test('SPECTATE IN SYNC: the watched tower is played back WATCH_DELAY_MS late (750 — taps arrive 0.17–0.5 s late), a late line grows it (eased, ≤ 2.5 s); each tap at its own tick; the slab held at its sweep edge; a clean start', async () => {
  const s = read(`${HI}stage.js`);
  const m = s.match(/export const WATCH_DELAY_MS = (\d+);/), x = s.match(/export const WATCH_DELAY_MAX_MS = (\d+), WATCH_MARGIN_MS = (\d+), WATCH_SLEW = ([\d.]+);/);
  assert.ok(m && Number(m[1]) === 750, 'the delay: 750 ms');
  assert.ok(x && Number(x[1]) === 2500 && Number(x[2]) === 300 && Number(x[3]) > 0 && Number(x[3]) < 0.5, 'grown to the lateness + 300 ms, ≤ 2.5 s, eased in (never a jump)');
  assert.ok(s.includes('wP = Math.max(0, FS[TAU] - wD);') && s.includes('io[0] = watchW ? wP : FS[TAU];'), 'drawn at THE PLAYBACK TICK');
  assert.ok(s.includes('while (wN < tp.length && tp[wN] <= P && !isOver(run)) tap(run, tp[wN++], ev);'), 'a tap applied when the playback reaches ITS tick');
  assert.ok(s.includes('stepTo(run, Math.min(P, endBy(run, tp.length ? tp[tp.length - 1] : 0)), ev);'), 'their end at its own tick too');
  assert.ok(s.includes('feedWatch(); T.feed(ev); ev.length = 0;\n      view.adopt(run, T);'), 'a switch: caught up + fed BEFORE the view adopts it (no half-drawn slab)');
  assert.ok(s.includes('if (wRec && wRecN < wRec.length / WREC) recWatch();') && s.includes('wRec = null'), 'the frame record is the test only (null in play)');
});

test('THE TOP HUD + THE WATCH LIST: the place number top-right with "/ 8" under it · the band line narrow · ≤ LIST_MAX rows in WATCH (the leaders + the watched + YOU)', async () => {
  const css = read('css/highrise-play.css'), hud = read(`${HI}matchhud.js`);
  assert.match(css, /\.hi-place \{ position: absolute; z-index: 2; right: 12px;/);
  assert.match(css, /\.hi-place span \{ flex: 0 0 100%;/, '"/ 8" on its own line UNDER the ordinal');
  assert.match(css, /\.hi-stage\.is-match \.hi-bandrow \{ display: flex;[^}]*max-width: 200px;/);
  const { LIST_MAX } = await import(new URL(`../${HI}matchhud.js`, import.meta.url));
  assert.equal(LIST_MAX, 5);
  assert.ok(hud.includes('r.show = n <= LIST_MAX || p.me || p.watched || lead-- > 0;'));
  assert.ok(hud.includes('if (p.floor !== prevF || pf !== prevP) { rank = i + 1; prevF = p.floor; prevP = pf; }'), 'the list places: the floor, then the perfects (the owner call)');
});

test('SHOULD 5 — no GHOST all match: the rivals\' names + colours are read again whenever the room\'s player list changes', () => {
  const v = read(`${HI}view.js`);
  assert.ok(v.includes('if (st.players !== playersSeen) {') && v.includes('R.name = nm; R.hex = hx; R.rgb = rgbOf(hx); R.row.name = nm;'));
});

test('SHOULD 4 + 10 — YOUR BEST (the owner call): a COUNTED run raises it, solo or match (the server record, like JAYWALK) — the cartridge never raises it from a run of its own; the test page keeps its phone best', () => {
  const v = read(`${HI}view.js`), s = read(`${HI}stage.js`), p = read(`${HI}play.js`);
  assert.ok(v.includes('best: { read: () => cleanBest(ls.get(SRV_BEST_KEY)), write() {}, runs: false },'));
  assert.ok(s.includes('const runsSetBest = !o.best || o.best.runs !== false;'));
  assert.ok(p.includes('best: { read: readBest, write: writeBest }'), 'the test page: its own phone best, as before');
});
