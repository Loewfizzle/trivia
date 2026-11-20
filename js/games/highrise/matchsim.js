// HIGH RISE — THE MATCH's LOOK ON THE TEST PAGE (S4B — docs/highrise.md "THE MATCH"; `/highrise-play?mode=match&rivals=7`): N BOT RIVALS
// on the page's own seed — each a sim player (bot.js: a timing error σ) whose whole tap log is made up front and "lands" as the run's
// clock passes each tap (+ a network's beat), through the SAME rivals.js path a real match's proof nodes take. A VIEW's scaffolding: the
// altimeter, the height tapes, the tags, the calls and WATCH with a full room of 8 — on one phone, with no room, no server: NOTHING
// COUNTS (the page's door is shut; this module imports only the rules + the bots). Lazy, the test page only.
import { createRun } from './engine.js';
import { gaussBot, playBot } from './bot.js';
import { judgeRun } from './replay.js';
import { createRival, rivalOver, rivalEnd, capRival, matchCalls } from './rivals.js';
import { tap, stepTo, isOver } from './engine.js';
import { BEAT, FLOOR_TICKS_MAX } from './tuning.js';

/** the rivals' names, colours (the console's player colours) + their timing errors (ms): a near-perfect one, good ones, sloppy ones */
export const SIM = Object.freeze([
  ['ALEX', '#00f0ff', 9], ['BOB', '#ff2bd6', 22], ['CLEO', '#3dff8b', 28], ['DEE', '#f3ff3a', 40], ['EVE', '#ff8a3d', 34], ['FINN', '#8f7bff', 60], ['GUS', '#ff5a5a', 48],
]);
/** a tap "lands" on this phone this many ticks after it was made (a network's beat) */
const LAG = 9;
const rgbOf = hex => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

/** startSim(hook, n) → { stop, watch(i), state } — pumps the rivals' rows into the stage ten times a second */
export function startSim(S, n) {
  let seed = '', list = [], key = '', memo = { sides: {}, said: {} };
  function build() {
    seed = S.seed(); key = ''; memo = { sides: {}, said: {} };
    list = SIM.slice(0, n).map(([name, hex, sigma], i) => {
      const taps = playBot(createRun({ seed, mode: 'match' }), gaussBot({ sigmaMs: sigma, seed: `sim${i}` }));
      return { uid: `s${i}`, name, hex, rgb: rgbOf(hex), all: taps, end: judgeRun({ seed, mode: 'match', taps }).end, R: createRival(seed), k: 0, done: false };
    });
  }
  function pump() {
    if (S.seed() !== seed) build();
    if (!S.live()) return;
    const tick = Math.floor(S.tick()), me = S.result(), hud = S.hud();
    for (const p of list) {
      while (p.k < p.all.length && p.all[p.k] + LAG <= tick && !isOver(p.R.run)) { if (tap(p.R.run, p.all[p.k])) { p.R.taps.push(p.all[p.k]); p.R.last = p.all[p.k]; } p.k++; }
      if (!p.done && p.k >= p.all.length && tick >= p.end + LAG) { p.done = true; p.R.done = true; if (!isOver(p.R.run)) stepTo(p.R.run, p.R.last + BEAT + FLOOR_TICKS_MAX); }
      capRival(p.R, tick);
    }
    const watched = S.watching();
    const rows = list.map(p => ({ uid: p.uid, name: p.name, hex: p.hex, rgb: p.rgb, floor: p.R.run.floor, perfects: p.R.run.perfects, over: rivalOver(p.R), end: rivalEnd(p.R), silent: false, me: false, watched: watched === p.uid }));
    rows.push({ uid: 'me', name: 'YOU', hex: '#ffffff', rgb: [1, 1, 1], floor: me.floor, perfects: me.perfects, over: me.over, end: me.made ? 'made' : me.cause === 'cap' ? 'cap' : me.over ? 'out' : '', silent: false, me: true, watched: false });
    const k = rows.map(r => `${r.uid}:${r.floor}:${r.end}:${r.watched ? 1 : 0}`).join('|');
    if (k !== key) { key = k; S.rivals(rows); }
    // THE CALLS (rivals.js#matchCalls): a pass either way · who is out · who made it
    for (const c of matchCalls(memo, me, rows.filter(r => !r.me))) hud.announce(c.text, c.kind);
  }
  build();
  const iv = setInterval(pump, 100);
  return {
    stop() { clearInterval(iv); },
    pump,
    /** WATCH rival i (the look check: the page's own run must be over in a match — or `S.spectate` first) */
    watch(i) { const p = list[i]; if (p) S.watch({ uid: p.uid, name: p.name, seed, taps: p.R.taps, done: () => p.done }); },
    state: () => list.map(p => ({ uid: p.uid, name: p.name, floor: p.R.run.floor, over: rivalOver(p.R), end: rivalEnd(p.R), k: p.k, of: p.all.length })),
  };
}
