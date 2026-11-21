// THE PROOF WRITER (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF WRITER"): what a run WRITES to its proof node — the log in
// chunks (c/{i}), then the end (e). ONE copy for JAYWALK + HIGH RISE (each had its own, 24 % the same code). PURE: no imports — the view
// hands it the writes (`io`: proof-io.js), the unit test a fake (tests/proof-writer.test.mjs).
//
// WHY (the review's MUST 2 a — THE LEAF WRITES): the old writers sent every chunk at once and forgot it. A host on a modified phone
// flipped the game's phase for a moment: a rival's chunk was REFUSED, the next index landed, the log had a hole and THE JUDGE refused the
// whole run. And an honest phone DROPPED its own unsent moves the moment its mirror said the match had left `play` — the mirror is the
// host's. Now:
//   · ONE BURST AT A TIME: the next chunk leaves only once the one before it is ACKNOWLEDGED — a later chunk never lands before an
//     earlier one (the judge reads the chunks' clock).
//   · A REFUSED CHUNK IS SENT AGAIN: the node's chunks are read back from the SERVER (never the mirror), the writer goes on from what is
//     really there — after 0.4 · 0.8 · 1.6 · 3 s … for as long as a chunk that lands can still count (GIVE_UP_MS).
//   · NEVER DROPPED ON THE MIRROR ALONE: a mirror that says "the match moved on" only makes a refusal EXPECTED (a quiet count); the
//     moves are dropped after LATE_TRIES refusals in that state — the match really is over.
//   · A DEAD LINE (no answer for STALL_MS): the new moves queue up behind the unanswered chunk once a second — they land TOGETHER when
//     the line is back, as they always did (THE DROPPED SIGNAL: the judge wants a burst, each chunk less late than the one before).
//   · THE END goes up only behind the last chunk's acknowledgement (HIGH RISE's rules take no chunk once `e` is there).
// `pipe` (JAYWALK's DAILY — its own node, its own rules: unreadable, nothing after its end): the old way — every chunk at once, none again.

export const STALL_MS = 1500, STALL_FLUSH_MS = 1000, LATE_TRIES = 3, END_TRIES = 5, GIVE_UP_MS = 90_000;
export const RETRY_MS = Object.freeze([400, 800, 1600, 3000]);

/**
 * createProofWriter({ count, pack, entriesOf, chunkMax, chunks, flushMs, left, onLate, onDead, io, pipe })
 *   count()          the moves logged so far (taps / hops)
 *   pack(a, b)       the chunk string of the moves [a, b)
 *   entriesOf(c)     a node's `c` as the SERVER holds it → how many moves it holds, −1 = broken (a hole, a bad chunk)
 *   chunkMax, chunks the rules' bounds: a chunk's length, the number of chunks
 *   flushMs()        new moves go up this often (a match: at once; a solo run: once a second)
 *   left()           this phone's mirror says the match moved on (the host's word — never a reason to drop a move by itself)
 *   onLate(why)      'seen' = about to write although left() (the view makes the refusal EXPECTED) · 'dropped' = the moves were given up
 *   onDead(why)      the log can not be completed any more ('hole' — a chunk is missing behind a later one; 'refused' — GIVE_UP_MS of refusals)
 *   io               { now(), timer(fn, ms), chunk(i, s) → Promise, end(payload) → Promise, read() → Promise<the node's `c`> }
 * → { reset({ sent, next, verify }), flush(force), end(payload), close(), state() }
 */
export function createProofWriter({ count, pack, entriesOf, chunkMax, chunks, flushMs, left = () => false, onLate = () => {}, onDead = () => {}, io, pipe = false }) {
  let sent = 0, acked = 0, next = 0, lastSend = -1e9, flights = [], rewind = null, verify = false, reading = false, retryAt = 0, tries = 0, lateTries = 0, failSince = 0;
  let dead = '', closed = false, endPayload = null, endState = 0, endTries = 0, armed = false, urgent = false, gen = 0;   // (endState: 0 none · 1 waiting · 2 in flight · 3 there · 4 given up)

  function arm(ms) {
    if (armed || closed) return;
    armed = true;
    const g = gen;
    io.timer(() => { armed = false; if (g === gen && !closed) flush(false); }, Math.max(0, ms));
  }
  /** work is left and nothing may call back by itself (the run's own frame loop is over once the run is — and a DEAD LINE answers
   *  nothing): look again shortly. Never a timer while nothing is owed. */
  function later() {
    if (closed || reading) return;
    if (rewind || verify) { if (!flights.length) arm(retryAt - io.now()); return; }
    if (!((!dead && sent < count() && next < chunks) || endState === 1)) return;
    arm(flights.length ? STALL_FLUSH_MS : Math.min(250, flushMs()));
  }
  function die(why) { dead = why; flights = []; rewind = null; verify = false; onDead(why); }
  function giveUpLate() { dead = 'late'; sent = acked = count(); flights = []; rewind = null; verify = false; if (endState === 1) endState = 4; onLate('dropped'); }

  function settle(f, ok) {
    if (f.g !== gen) return;
    f.ok = ok;
    if (pipe) { const i = flights.indexOf(f); if (i >= 0) flights.splice(i, 1); if (ok && f.to > acked) acked = f.to; return; }
    if (!ok && (!rewind || f.i < rewind.i)) rewind = f;
    while (flights.length && flights[0].ok !== null) { const h = flights.shift(); if (h.ok && !rewind) { acked = h.to; tries = 0; lateTries = 0; failSince = 0; } }
    if (flights.length) return;
    if (rewind) {
      // (a refused chunk: the match really over? — the mirror says so AND the rules keep refusing; else it goes again, read back first)
      const now = io.now();
      if (left() && ++lateTries > LATE_TRIES) { giveUpLate(); return; }
      if (!failSince) failSince = now;
      if (now - failSince > GIVE_UP_MS) { die('refused'); return; }
      verify = true; retryAt = now + RETRY_MS[Math.min(tries++, RETRY_MS.length - 1)];
      later();
      return;
    }
    flush(false);
  }
  /** what is REALLY there (the server's `c`) → go on from it; unreadable → go on from the first refused chunk */
  function resync() {
    reading = true;
    const g = gen;
    const blind = () => { if (g !== gen || closed) return; reading = false; verify = false; if (rewind) { next = rewind.i; sent = acked = rewind.from; rewind = null; } urgent = true; flush(false); };
    Promise.resolve().then(() => io.read()).then(c => {
      if (g !== gen || closed) return;
      const e = entriesOf(c);
      if (e < 0) { reading = false; die('hole'); flush(false); return; }
      reading = false; verify = false; rewind = null;
      next = c ? Object.keys(c).length : 0; sent = acked = Math.min(count(), e);
      urgent = true; flush(false);
    }, blind);
  }
  function pumpEnd(stalled) {
    if (endState !== 1 || closed || reading || rewind || verify) return;
    if (!dead && sent < count() && next < chunks) return;        // (moves still to hand over)
    if (flights.length && !stalled && !pipe) return;             // (… or to be acknowledged: `e` never lands before the last chunk)
    endState = 2;
    const g = gen, late = left();
    if (late) onLate('seen');
    Promise.resolve().then(() => io.end(endPayload)).then(() => { if (g === gen) endState = 3; }, () => {
      if (g !== gen) return;
      // (a refused end: once the mirror says the match moved on it is not tried again — it was a signal for a host's step that has run)
      if (late || ++endTries >= END_TRIES) { endState = 4; return; }
      endState = 1; retryAt = io.now() + RETRY_MS[Math.min(endTries, RETRY_MS.length - 1)];
      arm(retryAt - io.now());
    });
  }
  /** `force` = these moves should leave NOW (the run's end, the page hidden) — at once, or the moment the chunk in the air is answered */
  function flush(force) {
    if (closed) return;
    const now = io.now();
    if (force) urgent = true;
    if (reading) return;
    if (rewind || verify) { if (now >= retryAt && !flights.length) resync(); else later(); return; }
    const stalled = flights.length > 0 && now - flights[0].at >= STALL_MS;
    if (!dead && sent < count() && next < chunks) {
      const wait = flights.length && !pipe ? (!stalled || now - lastSend < STALL_FLUSH_MS) : (!urgent && now - lastSend < flushMs());
      if (!wait) {
        lastSend = now; urgent = false;
        if (left()) onLate('seen');
        const n = count();
        while (sent < n && next < chunks) {
          let k = n - sent, s = pack(sent, sent + k);
          while (s.length > chunkMax && k > 1) { k = Math.ceil(k / 2); s = pack(sent, sent + k); }
          const f = { i: next, from: sent, to: sent + k, at: now, ok: null, g: gen };
          flights.push(f); next++; sent += k;
          Promise.resolve().then(() => io.chunk(f.i, s)).then(() => settle(f, true), () => settle(f, false));
        }
      }
    }
    pumpEnd(stalled);
    later();
  }

  return {
    /** a run begins / a rejoin takes the node's log back: `sent` moves in `next` chunks are there; `verify` = read the chunks fresh before the first write */
    reset({ sent: s = 0, next: n = 0, verify: v = false } = {}) {
      gen++; sent = acked = s; next = n; verify = !!v; flights = []; rewind = null; reading = false; retryAt = 0; tries = 0; lateTries = 0; failSince = 0;
      dead = ''; endPayload = null; endState = 0; endTries = 0; lastSend = -1e9; armed = false; urgent = false;
    },
    flush,
    /** the run is over: `e` goes up behind the last chunk (once) */
    end(payload) { if (endState !== 0 || closed) return; endPayload = payload; endState = 1; flush(true); },
    /** the view is going away: what is logged leaves now (in order, behind anything still unanswered) — nothing is tried again */
    close() {
      if (closed) return;
      if (!dead && !rewind && !verify && !reading) {
        const now = io.now(), n = count();
        if (sent < n && left()) onLate('seen');
        while (sent < n && next < chunks) {
          let k = n - sent, s = pack(sent, sent + k);
          while (s.length > chunkMax && k > 1) { k = Math.ceil(k / 2); s = pack(sent, sent + k); }
          const f = { i: next, from: sent, to: sent + k, at: now, ok: null, g: gen };
          flights.push(f); next++; sent += k;
          Promise.resolve().then(() => io.chunk(f.i, s)).then(null, () => {});
        }
        if (endState === 1) { endState = 2; Promise.resolve().then(() => io.end(endPayload)).then(null, () => {}); }
      }
      closed = true; gen++;
    },
    state: () => ({ sent, acked, chunks: next, flights: flights.length, dead, end: endState, verify: verify || !!rewind }),
    /** THE CONSOLE FIX: the run's end is asked for and NOT acknowledged yet (waiting behind a chunk, or in the air) — a held phone stays on
     *  its run until it is (no object made: read from a frame) */
    owes: () => !closed && !dead && (endState === 1 || endState === 2),
  };
}
