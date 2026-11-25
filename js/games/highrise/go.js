// HIGH RISE — THE SOLO GO (HIGH RISE PAD + GO, Nov 24 — docs/highrise.md "THE SOLO GO"): a solo run's GO used to get ONE try and ONE
// 4 s wait — a slow answer (a phone just back from the lock screen, a weak line) started the run UNPROVEN although its GO was on the way.
// Now THE MATCH's PATTERN: up to GO_TRIES writes GO_TRY_MS apart (a refusal is looked at and tried again), THE SERVER's copy of the node
// read again every GO_LOOK_MS while an answer is owed, all inside GO_WAIT_MS. A late answer still PROVES the run. Nothing is ever written
// twice at once: a write still in the air (queued behind a dead line — it lands when the line is back) is never sent again.
// PURE: the writes, the reads + the clock are handed in (view.js#askGo) — tests/highrise-go.test.mjs runs it on a fake line.
export const GO_TRIES = 7, GO_TRY_MS = 420, GO_LOOK_MS = 1250, GO_WAIT_MS = 9000;
/** a refusal that took this long to come back is no rules refusal: the write sat behind a dead line and landed past the rules' own
 *  window after THE STAMP (core/proof.js#GO_WINDOW_MS, 5 s) — never tried again (the tree is stamped: it would be refused for good), never the
 *  re-publish alarm: the run says NO CONNECTION */
export const GO_LATE_MS = 4500;

/**
 * soloGo({ write, read, now, timer, stale }) → Promise<{ go, c } | { why }>
 *   write() → Promise — THE STAMP + this run's GO (resolves = written · rejects = refused)
 *   read()  → Promise<node | null> — THE SERVER's copy of this run's proof node (never the mirror)
 *   now() ms · timer(fn, ms) · stale() → true = the run stopped waiting (the view gone, another match)
 *   why: 'no answer' (the line: nothing came back in GO_WAIT_MS) · 'refused' (every try refused: the rules) · 'left' (stale)
 */
export function soloGo({ write, read, now, timer, stale, tries = GO_TRIES, every = GO_TRY_MS, look = GO_LOOK_MS, total = GO_WAIT_MS, lateMs = GO_LATE_MS }) {
  return new Promise(res => {
    const t0 = now();
    let done = false, writing = false, wrote = false, late = false, n = 0, refusals = 0, looking = 0, lookAt = -1e9;
    const fin = v => { if (!done) { done = true; res(v); } };
    /** THE SERVER's copy: this run's GO is there (written now, or before a refresh) → the proof. One look at a time — but a write's own
     *  answer is looked at AT ONCE (`now`): an older look may still hang on the line that was dead */
    const see = force => {
      if (done || (looking && !force)) return;
      looking++; lookAt = now();
      Promise.resolve().then(read).then(node => { looking--; if (node && node.go > 0 && !node.e) fin({ go: node.go, c: node.c || null }); }, () => { looking--; });
    };
    const put = () => {
      n++; writing = true;
      const at = now();
      Promise.resolve().then(write).then(() => { writing = false; wrote = true; see(true); }, () => { writing = false; if (now() - at >= lateMs) late = true; else refusals++; see(true); });
    };
    const tick = () => {
      if (done) return;
      if (stale()) { fin({ why: 'left' }); return; }
      if (now() - t0 >= total) { fin({ why: refusals >= tries && !wrote && !late ? 'refused' : 'no answer' }); return; }
      const idle = !writing && !wrote && !late;
      if (idle && n < tries) put();
      else if (idle && !looking && now() - lookAt >= every) { fin({ why: 'refused' }); return; }   // (every try refused + the node looked at once more: the rules)
      else if (now() - lookAt >= look) see();
      timer(tick, every);
    };
    tick();
  });
}
