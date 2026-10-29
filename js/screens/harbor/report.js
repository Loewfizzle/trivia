// CITY 2.0 — 9e: SEND REPORT + THE HANG WATCH (the owner's iPhone: the TR-3B's full run "just stuck … the music still plays, but
// everything else is frozen"; Chrome never reproduced it and Safari's engine won't install here). Two ways a phone tells /admin what
// happened, both POST /api/log { p: 'report', r: { kind, text } } (api/log.js#logReport → /admin → "Reports from phones"):
//   · SEND REPORT — a button in the &debug=1 strip (ui/debug-strip.js#createDebugButton): one tap sends the scene's snapshot
//     (scene.js#reportText: the frame stats + the tier's steps, the legendary's run, the loop, the load log, the last errors, the
//     user agent, the memory) — kind 'tap';
//   · THE HANG WATCH — a tiny Worker (made from a Blob: no extra file to cache). The page posts it a BEAT once a second with the
//     latest snapshot (+ with &debug=1 a MARK each time the frame enters a new part, so a hang names the part it hung in). iOS keeps
//     the music playing off the main thread, so "frozen with music" = the main thread stuck: when no beat comes for HANG_MS while the
//     page said it was visible, the WORKER sends the last snapshot itself — kind 'hang' — and a short follow-up if the page comes back.
//     A beat while hidden pauses it (a locked phone is no hang). Once a session; the server rate-limits too.
//   · a STALL (no frames while the page answers — scene.js#frameGap / the loop stopping on failed frames) sends kind 'stall'.
// Like every report, polish: no worker (old browser, blocked) → no watch, nothing breaks.

const HANG_MS = 7000;

const WORKER = `
let snap = '', vis = 'visible', last = Date.now(), sent = false, mark = '', markAt = 0, back = false;
const post = (kind, text) => fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, keepalive: true,
  body: JSON.stringify({ p: 'report', r: { kind, text } }) }).catch(() => {});
onmessage = e => {
  const m = e.data || {};
  if (m.t === 'beat') {
    const gap = Date.now() - last;
    if (sent && !back && vis === 'visible') { back = true; post('hang', 'THE PAGE CAME BACK after ' + (gap / 1000).toFixed(1) + ' s without answering (the report before this one is the hang).\\n\\n' + (m.snap || '')); }
    last = Date.now(); vis = m.vis || 'visible'; if (m.snap) snap = m.snap;
  } else if (m.t === 'mark') { mark = m.m; markAt = Date.now(); }
  else if (m.t === 'vis') { vis = m.vis; last = Date.now(); }
};
setInterval(() => {
  if (sent || vis !== 'visible') return;
  const gap = Date.now() - last;
  if (gap < ${HANG_MS}) return;
  sent = true;
  post('hang', 'THE MAIN THREAD STOPPED ANSWERING for ' + (gap / 1000).toFixed(1) + ' s while the page was visible (the music can keep playing — iOS plays it off the main thread).\\n'
    + (mark ? 'The frame was last in: ' + mark + ' (' + ((Date.now() - markAt) / 1000).toFixed(1) + ' s ago) — a hang there.\\n' : 'No frame marks (open the link with &debug=1 to name the part it hangs in).\\n')
    + '\\nThe last snapshot (taken ≤ 1 s before it stopped):\\n' + snap);
}, 1000);
`;

/** o: { text(kind) → the snapshot, marks (bool: post the frame's parts — &debug=1) } */
export function createReporter(o) {
  let worker = null, url = null, beatT = 0, lastSend = 0, stallSent = false, lastMark = '';
  const send = (kind) => {
    let text = '';
    try { text = o.text(kind); } catch (e) { text = `(the snapshot failed: ${e && e.message})`; }
    return fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, keepalive: text.length < 60000, body: JSON.stringify({ p: 'report', r: { kind, text } }) })
      .then(r => r.json().catch(() => ({}))).then(j => !!(j && j.kept)).catch(() => false);
  };
  try {
    if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      url = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
      worker = new Worker(url);
      const beat = () => { try { worker.postMessage({ t: 'beat', vis: document.visibilityState, snap: o.text('hang') }); } catch { /* polish */ } };
      beatT = setInterval(beat, 1000); beat();
      document.addEventListener('visibilitychange', onVis);
    }
  } catch { worker = null; }
  function onVis() { try { if (worker) worker.postMessage({ t: 'vis', vis: document.visibilityState }); } catch { /* polish */ } }
  return {
    get watching() { return !!worker; },
    /** the frame entered a part (&debug=1 only — a postMessage per part; a hang names where it hung) */
    mark(m) { if (!o.marks || !worker || m === lastMark) return; lastMark = m; try { worker.postMessage({ t: 'mark', m }); } catch { /* polish */ } },
    /** SEND REPORT (the button): → Promise<bool> kept by the server */
    send(kind = 'tap') { const now = Date.now(); if (now - lastSend < 4000) return Promise.resolve(false); lastSend = now; return send(kind); },
    /** C4c — THE PHONE BENCH: a report of its own (kind 'bench', the text given) → Promise<bool> kept by the server */
    sendText(kind, text) {
      return fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, keepalive: text.length < 60000, body: JSON.stringify({ p: 'report', r: { kind, text } }) })
        .then(r => r.json().catch(() => ({}))).then(j => !!(j && j.kept)).catch(() => false);
    },
    /** a stall the page itself noticed (once a session) */
    stall() { if (stallSent) return; stallSent = true; send('stall'); },
    destroy() { clearInterval(beatT); document.removeEventListener('visibilitychange', onVis); try { if (worker) worker.terminate(); } catch { /* */ } if (url) URL.revokeObjectURL(url); worker = null; },
  };
}
