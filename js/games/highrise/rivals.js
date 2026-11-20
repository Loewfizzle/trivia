// HIGH RISE — THE RIVALS (S4B — docs/highrise.md "THE MATCH"): PURE (no DOM, no clock). In a match everyone climbs the SAME seed, so a
// rival's tower = their own tap log through the SAME engine: their proof node's chunks (rooms/{CODE}/hr/{matchId}/{uid}/c — mirrored for
// everyone, each chunk read once as it lands) → their floor, their perfects, how their tower ended. EXACT + deterministic: with every
// tap in, a rival's state = that player's own, tick for tick.
//   · NO NEW TAP IS EVER ASSUMED: a rival's run is stepped only by the taps that have LANDED. A MISS / TOO THIN / the finish is known
//     from the tap itself; THE FUSE's end (TOO SLOW) only once that player's own `e` is here — it arrives right behind their last chunk —
//     so a tower never falls on this screen and stands up again when a late tap lands (JAYWALK's "a death only once confirmed").
//   · THE 6:00 CAP falls for everyone still standing at its own tick: nothing to confirm.
// And what a player SEES of them: THE HEIGHT TAPES (a rival under you = a thin tape round YOUR tower at their floor) + THE TAGS (a rival
// at or above you = a right-edge tag "ALEX ▲3" in the clear column) — at most the 3 nearest each way, tags that would overlap MERGE.
import { createRun, tap, stepTo, isOver, endBy } from './engine.js';
import { unpackTaps } from './replay.js';

/** at most this many rivals as tags (above) · as tapes on the tower (below) */
export const RIVALS_SHOWN = 3;
/** a rival whose slab's fuse is this far past (ticks) with no tap and no end here = NO SIGNAL (their phone is away — their end may still land) */
export const SILENT_TICKS = 240;

/** a rival: their confirmed run + how much of their node has been read */
export function createRival(seed, mode = 'match') {
  return { seed, mode, run: createRun({ seed, mode }), n: 0, last: 0, taps: [], done: false, bad: false, capped: false };
}
/** the match's seed moved (THE FIRST GO landed late on this phone): the rival starts again on it — their chunks are read again */
export function resetRival(R, seed) { R.seed = seed; R.run = createRun({ seed, mode: R.mode }); R.n = 0; R.last = 0; R.taps.length = 0; R.done = false; R.bad = false; R.capped = false; }
/**
 * a rival's proof node as it stands → the chunks not read yet go through the engine (each chunk ONCE); their `e` = the log is complete:
 * the run is played to its END (the fuse — or what a tap had already decided). → how many new taps landed
 */
export function feedRival(R, node) {
  let fresh = 0;
  const c = node && node.c;
  if (c && !R.bad) {
    for (let v = c[R.n]; v && typeof v.s === 'string'; v = c[R.n]) {
      const ticks = unpackTaps(v.s);   // (a chunk alone unpacks from 0: its first gap counts from the tap before it)
      if (!ticks) { R.bad = true; break; }
      const from = R.last;
      for (let i = 0; i < ticks.length; i++) {
        const tk = from + ticks[i];
        if (isOver(R.run) || !tap(R.run, tk)) { R.bad = true; break; }   // (a tap the engine refuses: the judge will refuse that log — the tower stands where it stood)
        R.taps.push(tk); R.last = tk; fresh++;
      }
      R.n++;
      if (R.bad) break;
    }
  }
  if (node && node.e && !R.done) { R.done = true; if (!isOver(R.run)) stepTo(R.run, endBy(R.run, R.last)); }
  return fresh;
}
/** THE CAP: at its tick every tower still standing stops where it stands — MARKED, never stepped (a tap of theirs from before the cap
 *  may still be on its way: the engine is moved by landed taps alone) */
export function capRival(R, tick) {
  const cap = R.run.R.modes[R.mode] ? R.run.R.modes[R.mode].capTicks : null;
  if (cap != null && tick >= cap && !isOver(R.run)) R.capped = true;
}
/** has this rival's climb ENDED, as far as this phone knows? (the finish + the cap are ends too: `rivalEnd` says which) */
export const rivalOver = R => isOver(R.run) || R.capped;
/** 'made' | 'cap' | 'out' | '' (still climbing) */
export const rivalEnd = R => (isOver(R.run) ? (R.run.st === 'made' ? 'made' : R.run.st === 'cap' ? 'cap' : 'out') : R.capped ? 'cap' : '');
/** their slab's fuse is long past at `tick` — a whole floor's longest time (FLOOR_TICKS_MAX) + SILENT_TICKS since their last LANDED tap —
 *  with no tap and no end here: their signal is away (shown as such — never as out). (A rival's run rests in its landing beat between
 *  two taps: it is moved by landed taps alone — so this is counted from the last one, never from a slab's own state.) */
export const rivalSilent = (R, tick) => !isOver(R.run) && !R.capped && !R.done && tick > R.last + R.run.R.floorTicksMax + SILENT_TICKS;
/** WATCHING a tower: the next slab ENTERS on the clock (the entry is the seed's — nothing of the player's), so it is seen sliding; it is
 *  never stepped to its fuse (a held slab waits for its tap / their end) → the tick the engine may be stepped to now (−1 = not yet) */
export const entryTick = (run, tick) => (run.st === 'beat' && tick >= run.s0 ? run.s0 : -1);
/** … and the tick its slab is DRAWN at (held at its last tick before the fuse) */
export const drawTick = (run, tick) => (run.st === 'slide' ? Math.min(tick, run.s0 + 2 * run.S - 1) : tick);

const byId = (a, b) => (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0);
/**
 * the rivals a player standing on `floor` is shown: rows [{ uid, name, floor, … }] → { above, below } — `above` = the ≤ max NEAREST at
 * or over that floor (a right-edge tag each, nearest first) · `below` = the ≤ max NEAREST under it (a tape on the tower each)
 */
export function nearest(rows, floor, max = RIVALS_SHOWN) {
  const above = [], below = [];
  for (const r of rows || []) (r.floor >= floor ? above : below).push(r);
  above.sort((a, b) => a.floor - b.floor || byId(a, b));
  below.sort((a, b) => b.floor - a.floor || byId(a, b));
  return { above: above.slice(0, max), below: below.slice(0, max) };
}
/** a rival's tag: "ALEX ▲3" — on your own floor: "ALEX · LEVEL" */
export const rivalTag = (name, up) => (up > 0 ? `${name} ▲${up}` : `${name} · LEVEL`);
/**
 * TAGS THAT WOULD OVERLAP MERGE: items [{ uid, name, up (floors over you), y (px — where its tag would sit) }] → [{ text, y, uids }]:
 * tags closer than `gap` px are ONE tag — the NEAREST rival's name + "+N" + its own ▲ ("ALEX +2 ▲3"), at that rival's height
 */
export function mergeTags(items, gap = 30) {
  const list = (items || []).slice().sort((a, b) => a.up - b.up || byId(a, b)), out = [];
  for (const it of list) {
    const g = out.find(q => Math.abs(q.y - it.y) < gap);
    if (g) { g.uids.push(it.uid); g.text = `${g.name} +${g.uids.length - 1}${g.up > 0 ? ` ▲${g.up}` : ' · LEVEL'}`; }
    else out.push({ text: rivalTag(it.name, it.up), y: it.y, uids: [it.uid], name: it.name, up: it.up });
  }
  return out;
}
/**
 * A PASS: `sides` remembers which side of you each rival last stood on (+1 = you are over them · −1 = they are over you; level = no
 * change). → 'me' (YOU passed them) | 'them' (they passed YOU) | '' — never at the start, when everyone is level
 */
export function passStep(sides, uid, mine, theirs) {
  const s = Math.sign(mine - theirs);
  if (!s) return '';
  const was = sides[uid] || 0;
  sides[uid] = s;
  return was && was !== s ? (s > 0 ? 'me' : 'them') : '';
}
/**
 * THE MATCH's CALLS (the announcer's lane — PURE): `memo` = { sides: {}, said: {} } kept for the match · `me` = { floor, over } · `rows` =
 * the RIVALS [{ uid, name, floor, end }] → [{ text, kind }]:
 *   a PASS either way — "YOU PASSED ALEX" · "ALEX PASSED YOU"; several in one beat are ONE call ("3 PASSED YOU": everyone climbs at the
 *   same pace, so a slab dropped on its second pass lets the whole room by at once) · who is OUT ("FINN IS OUT · 21") · who MADE IT.
 *   (A rival's own streak is never called: the room's streaks run in step — seven calls at every tenth floor.)
 */
export function matchCalls(memo, me, rows) {
  const out = [], meUp = [], themUp = [];
  for (const r of rows || []) {
    if (!me.over) { const how = passStep(memo.sides, r.uid, me.floor, r.floor); if (how === 'me') meUp.push(r.name); else if (how === 'them') themUp.push(r.name); }
    if (r.end && !memo.said[r.uid]) { memo.said[r.uid] = 1; if (r.end === 'made') out.push({ text: `${r.name} MADE IT`, kind: 'made' }); else if (r.end === 'out') out.push({ text: `${r.name} IS OUT · ${r.floor}`, kind: 'gone' }); }
  }
  if (meUp.length) out.unshift({ text: meUp.length === 1 ? `YOU PASSED ${meUp[0]}` : `YOU PASSED ${meUp.length}`, kind: 'pass' });
  if (themUp.length) out.unshift({ text: themUp.length === 1 ? `${themUp[0]} PASSED YOU` : `${themUp.length} PASSED YOU`, kind: 'passed' });
  return out;
}
/** THE ALTIMETER's order: the highest first (then the most perfects, then the id) */
export const altOrder = rows => (rows || []).slice().sort((a, b) => b.floor - a.floor || (b.perfects || 0) - (a.perfects || 0) || byId(a, b));
/** the players still climbing, the highest first — whom a watcher follows: the picked one while they are in, else THE LEADER */
export function follow(rows, pick = '') {
  const live = altOrder((rows || []).filter(r => !r.over));
  if (pick && live.some(r => r.uid === pick)) return pick;
  const pool = live.length ? live : altOrder(rows);
  return pool.length ? pool[0].uid : '';
}
/** a tap while watching: the next player still in after `cur` (the highest first, round and round) */
export function nextFollow(rows, cur) {
  const live = altOrder((rows || []).filter(r => !r.over));
  if (live.length < 2) return live.length ? live[0].uid : cur;
  return live[(live.findIndex(r => r.uid === cur) + 1) % live.length].uid;
}
