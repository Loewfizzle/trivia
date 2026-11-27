// FREEFALL — THE BOT ROOM (F4B — the test page's `?mode=match&rivals=N`, the look shots, the speed test with 8 ghosts, the unit tests'
// 8-player sims; NEVER in the cartridge: nothing here writes or counts). Each bot's whole run on the match's seed (bot.js — the sims'
// players) is turned into what its PHONE would have sent: the packed input log's FINAL events in chunks (proof.js#finalCount ·
// packRange — the cartridge's own writer's rule), each with the tick it ARRIVES at (the flush + the line), then its end. `reveal(tick)`
// hands the stage the proof nodes as the room would hold them at that tick — the ghosts are fed exactly as in a real match. PURE.
import { createRun, stepTo, turn, isOver, resultOf, logOf } from './engine.js';
import { makeBot, playBot, BOT_IDS } from './bot.js';
import { finalCount, packRange } from './proof.js';
import { MODES } from './tuning.js';

/** a bot's phone sends its new final events every this many ticks (250 ms) · they arrive this many ticks later (the line: 200 ms) */
export const SIM_FLUSH_TICKS = 15, SIM_LAG_TICKS = 12;
export const SIM_NAMES = Object.freeze(['MIA', 'LIAM', 'CHARLIE', 'ZOE', 'NOAH', 'AVA', 'KAI', 'RUBY']);
export const SIM_HEX = Object.freeze(['#00f0ff', '#ffd23f', '#7dff7a', '#ff8a3d', '#c35bff', '#ff5fa2', '#5db8ff', '#f4f1de']);

/** ONE bot's run on `seed` as its phone sends it → { uid, name, hex, chunks: [{ at (the tick it arrives), s }], end: { at, e: { f, t, w } }, result, log } */
export function botRun(seed, k, { bot = BOT_IDS[k % BOT_IDS.length], maxFloor = 400, flush = SIM_FLUSH_TICKS, lag = SIM_LAG_TICKS, mode = 'match' } = {}) {
  const plan = createRun({ seed, mode });
  playBot(plan, makeBot(bot, `${seed}:${k}`), { maxFloor });
  if (!isOver(plan)) stepTo(plan, MODES[mode].capTicks);
  const log = logOf(plan), run = createRun({ seed, mode }), chunks = [];
  let sent = 0, i = 0;
  const send = T => { const n = finalCount(run); if (n > sent) { chunks.push({ at: T + lag, s: packRange(run, sent, n) }); sent = n; } };
  for (let T = 0; !isOver(run); T++) {
    while (i < log.length && log[i].t === T) { const e = log[i++]; turn(run, T, ((e.a - run.a + 6144) % 4096) - 2048); }
    stepTo(run, T);
    if (T % flush === 0) send(T);
  }
  send(run.end);
  const r = resultOf(run);
  return { uid: `bot${k}`, name: SIM_NAMES[k % SIM_NAMES.length], hex: SIM_HEX[k % SIM_HEX.length], chunks, end: { at: run.end + lag + 2, e: { f: r.floor, t: r.tick, w: r.cause } }, result: r, log };
}
/**
 * a ROOM of `n` bots on `seed` → { players, nodes: { uid: node }, reveal(tick) → nodes (the SAME objects, grown in place: a chunk / an
 * end is there once its tick has come), results }. `o.bots` = the bots' ids in order · `o.maxFloor` (a check keeps them near a floor).
 */
export function createSim(seed, n, o = {}) {
  const runs = [], nodes = {}, next = [];
  for (let k = 0; k < n; k++) { const B = botRun(seed, k, { ...o, bot: o.bots ? o.bots[k % o.bots.length] : undefined }); runs.push(B); nodes[B.uid] = { go: 1, c: {} }; next.push(0); }
  return {
    players: runs.map(B => ({ uid: B.uid, name: B.name, hex: B.hex })), nodes, runs,
    results: Object.fromEntries(runs.map(B => [B.uid, B.result])),
    reveal(tick) {
      for (let k = 0; k < runs.length; k++) {
        const B = runs[k], node = nodes[B.uid];
        while (next[k] < B.chunks.length && B.chunks[next[k]].at <= tick) { node.c[next[k]] = B.chunks[next[k]]; next[k]++; }
        if (!node.e && next[k] >= B.chunks.length && B.end.at <= tick) node.e = B.end.e;
      }
      return nodes;
    },
  };
}
