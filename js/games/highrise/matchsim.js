// HIGH RISE — THE MATCH's LOOK ON THE TEST PAGE (S4B — docs/highrise.md "THE MATCH"; `/highrise-play?mode=match&rivals=7`): N BOT RIVALS
// on the page's own seed — each a sim player (bot.js: a timing error σ) whose whole tap log is made up front and "lands" as the run's
// clock passes each tap (+ a network's beat), through the SAME rivals.js path a real match's proof nodes take. A VIEW's scaffolding: the
// place number, the ranked list in WATCH, the height tapes, the tags, the calls and WATCH with a full room of 8 — on one phone, with no room, no server: NOTHING
// COUNTS (the page's door is shut; this module imports only the rules + the bots). Lazy, the test page only.
import { createRun } from './engine.js';
import { gaussBot, playBot } from './bot.js';
import { judgeRun } from './replay.js';
import { createRival, rivalOver, rivalEnd, capRival, matchCalls, follow, nextFollow } from './rivals.js';
import { tap, stepTo, isOver, endBy } from './engine.js';

/** the rivals' names, colours (the console's player colours) + their timing errors (ms): a near-perfect one, good ones, sloppy ones */
export const SIM = Object.freeze([
  ['ALEX', '#00f0ff', 9], ['BOB', '#ff2bd6', 22], ['CLEO', '#3dff8b', 28], ['DEE', '#f3ff3a', 40], ['EVE', '#ff8a3d', 34], ['FINN', '#8f7bff', 60], ['GUS', '#ff5a5a', 48],
]);
/** a tap "lands" on this phone this many ticks after it was made (a network's beat) */
const LAG = 9;
/** S5 — OUT = WATCH on the test page too: the page's own end card comes once every bot is down, or after this long watching */
export const SIM_WATCH_MS = 45000;
const rgbOf = hex => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

/** startSim(hook, n) → { stop, watch(i), state } — pumps the rivals' rows into the stage ten times a second */
export function startSim(S, n) {
  let seed = '', list = [], key = '', memo = { sides: {}, said: {} }, followUid = '', pickUid = '', nextPick = '', watchFrom = 0, lastRows = [], allOut = 0;
  const api = { watchOff: false };
  const meRec = { floor: 0, perfects: 0, over: false, made: false, cause: '' };
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
    const tick = Math.floor(S.tick()), me = S.me(meRec), hud = S.hud();
    for (const p of list) {
      while (p.k < p.all.length && p.all[p.k] + LAG <= tick && !isOver(p.R.run)) { if (tap(p.R.run, p.all[p.k])) { p.R.taps.push(p.all[p.k]); p.R.last = p.all[p.k]; } p.k++; }
      if (!p.done && p.k >= p.all.length && tick >= p.end + LAG) { p.done = true; p.R.done = true; if (!isOver(p.R.run)) stepTo(p.R.run, endBy(p.R.run, p.R.last)); }
      capRival(p.R, tick);
    }
    const watched = S.watching();
    const rows = list.map(p => ({ uid: p.uid, name: p.name, hex: p.hex, rgb: p.rgb, floor: p.R.run.floor, perfects: p.R.run.perfects, over: rivalOver(p.R), end: rivalEnd(p.R), silent: false, me: false, watched: watched === p.uid }));
    rows.push({ uid: 'me', name: 'YOU', hex: '#ffffff', rgb: [1, 1, 1], floor: me.floor, perfects: me.perfects, over: me.over, end: me.made ? 'made' : me.cause === 'cap' ? 'cap' : me.over ? 'out' : '', silent: false, me: true, watched: false });
    const k = rows.map(r => `${r.uid}:${r.floor}:${r.end}:${r.watched ? 1 : 0}`).join('|');
    if (k !== key) { key = k; S.rivals(rows); }
    lastRows = rows;
    // S5 — OUT = WATCH (the cartridge's flow, on the page): the leader first · a tap = the next · a row of the list = that bot; the
    // page's own end card once every bot is down (or after SIM_WATCH_MS)
    if (S.watchWait && S.watchWait()) {
      const now = performance.now(), bots = rows.filter(r => !r.me), live = bots.filter(r => !r.over);
      if (!watchFrom) watchFrom = now;
      // (REVIEW FIX A: the watched tower is played back late — the card waits for the playback to show the last bot's end)
      if (live.length) allOut = 0; else if (!allOut) allOut = now;
      if ((allOut && now - allOut > (S.watchSync ? S.watchSync().delayMs : 0) + 900) || now - watchFrom > SIM_WATCH_MS) { allOut = 0; watchFrom = 0; followUid = ''; pickUid = ''; nextPick = ''; hud.watching(''); S.unwatch(); return; }
      const f = pickUid && bots.some(r => r.uid === pickUid) ? pickUid : follow(bots, nextPick || followUid);   // (the one you follow STAYS while they climb)
      if (f && f !== followUid) { followUid = f; nextPick = ''; const p = list.find(q => q.uid === f); if (p) S.watch({ uid: p.uid, name: p.name, seed, taps: p.R.taps, done: () => p.done }); key = ''; }
      const F = bots.find(r => r.uid === followUid), fl = F && S.watching() === F.uid && S.watchFloor() >= 0 ? S.watchFloor() : F ? F.floor : 0;   // (REVIEW FIX A: the drawn — delayed — tower's floor)
      hud.watching(F ? (live.length && !F.over ? `WATCHING ${F.name} · ${fl} · TAP FOR THE NEXT` : `${F.name}’S TOWER · ${fl}`) : '');
    } else if (watchFrom) { watchFrom = 0; followUid = ''; pickUid = ''; nextPick = ''; }
    // THE CALLS (rivals.js#matchCalls): a pass either way · who is out · who made it
    for (const c of matchCalls(memo, me, rows)) hud.announce(c.text, c.kind);   // (your own row is skipped there)
  }
  build();
  const iv = setInterval(pump, 100);
  return Object.assign(api, {
    stop() { clearInterval(iv); },
    pump,
    /** (S5) the page's run is over: WATCH while a bot still climbs (never for a test bot that keeps the run going: `watchOff`) */
    wantWatch: () => !api.watchOff && list.some(p => !rivalOver(p.R)),
    /** a tap while watching: the next bot still in */
    next() { pickUid = ''; nextPick = nextFollow(lastRows.filter(r => !r.me), followUid); pump(); },
    /** a row of the ranked list: that bot (any of them — one already down too) */
    pick(uid) { if (list.some(p => p.uid === uid)) { pickUid = uid; pump(); } },
    /** WATCH rival i (the look check: the page's own run must be over in a match — or `S.spectate` first) */
    watch(i) { const p = list[i]; if (p) S.watch({ uid: p.uid, name: p.name, seed, taps: p.R.taps, done: () => p.done }); },
    /** (REVIEW FIX A — the spectate-sync test) a bot's LANDED taps as this phone has them */
    taps: uid => { const p = list.find(q => q.uid === uid); return p ? p.R.taps.slice() : []; },
    state: () => list.map(p => ({ uid: p.uid, name: p.name, floor: p.R.run.floor, over: rivalOver(p.R), end: rivalEnd(p.R), k: p.k, of: p.all.length })),
  });
}
