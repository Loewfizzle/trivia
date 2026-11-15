// LOAD FIX 4 — THE SKEW WRAPPER (Grok's boot audit #8): every module loaded AFTER the boot (the radio, the room screens, the banner, the
// pop-ups, the dailies, THE BOARD, the profile, the games' views + cartridges …) is fetched from WHATEVER DEPLOY IS LIVE at that moment and
// linked against the deploy this page loaded. After a deploy, a new file that imports a new export can't link (a SyntaxError — cached in
// the module map: every retry fails the same), and the old code swallowed it: the radio silently gone, a room with no room screen, a blank
// game. So EVERY dynamic import goes through lazyImport (tests/lazy-import.test.mjs fails on a stray; the boot's own on its allow-list):
// on a SyntaxError / TypeError it asks the deploy's id (GET /api/time — no-store, `v` = the commit; the page's own = the first answer it
// got: firebase.js#syncTimeNoSocket → noteDeploy) and, when it CHANGED since this page loaded, reloads ONCE for that deploy (sessionStorage
// — never a loop; no storage = no reload). Never mid-match: while a match is on screen (app.js#holdSkewReload) it waits for the room or the
// podium, then reloads — the rejoin brings the phone back to its room. The same deploy (or no answer) = nothing more: the caller's own
// handling, as before (its warn / its report to /admin). The error always reaches the caller unchanged.
const RK = 'ns:skew-re';
let bootV;                  // undefined = not known yet · null = the server names none (local dev) · string = this page's deploy
let hold = () => false;     // true while a reload must wait (a match on screen)
let busy = null;            // the one check running

/** the deploy id this page loaded with — the FIRST /api/time answer (later ones are what's live now) */
export function noteDeploy(v) { if (bootV === undefined) bootV = v == null || v === '' ? null : String(v); }
let workerV = false;        // PLAY NOW — Group 0a: the build the worker serves this page from (its pin) — truer than /api/time's first answer

/** PURE: the page's answer to the worker's ns:build-gone → { mix, reload }. CITY A — item 10, THE CATCH-UP RELOAD WAITS FOR A RETURN (the owner's
 *  home-screen app reloaded on a YOU tap — the music stopped): the page ALWAYS keeps going on the live deploy's files for now (`mix` — the way a
 *  match already did) and its ONE reload is QUEUED for the next time the app comes back on screen (reloadAtReturn); a reload already done for
 *  that deploy = mix, never a loop; no session storage = mix, no reload — it couldn't stop a loop. (`holding` no longer changes the answer.) */
export function goneAnswer({ reloadedFor, live }) {
  if (reloadedFor === undefined || (live && reloadedFor === live)) return { mix: true, reload: false };
  return { mix: true, reload: true };
}
/** PURE: may the queued catch-up reload run NOW? Only at a RETURN (the app back on screen / opened), never mid-match (holding), never with a
 *  sheet open or a finger down (gated). FIXES R1 — THE SHARE HOLD (the owner's home-screen app reloaded after SHARE TODAY → sending it to
 *  himself): a share sheet, and the app it hands the link to, is no return — never within SHARE_HOLD_MS of a share's start or end
 *  (`sharedAgo` — js/daily/share.js#shareHold stamps globalThis.__nsShareAt: a hub, THE STALE-MODULE RULE) */
export const SHARE_HOLD_MS = 60_000;
export const reloadAtReturn = ({ returning, holding, gated, sharedAgo = Infinity }) => !!returning && !holding && !gated && !(sharedAgo >= 0 && sharedAgo < SHARE_HOLD_MS);
const sharedAgo = () => { const t = Number(globalThis.__nsShareAt) || 0; return t ? Date.now() - t : Infinity; };
let gate = () => false, whereFn = () => '';
/** app.js: hold() → true while a match is on screen; o.gate() → true while a sheet / pop-up is open or a finger is down; o.where() = the screen */
export function holdSkewReload(fn, o = {}) {
  hold = typeof fn === 'function' ? fn : () => false;
  if (typeof o.gate === 'function') gate = o.gate;
  if (typeof o.where === 'function') whereFn = o.where;
}

/** PURE: could this error be two deploys' files meeting? (a link / parse error, or a failed fetch — the deploy id decides) */
export function maySkew(e) {
  const n = e && e.name, m = String((e && e.message) || '');
  return n === 'SyntaxError' || n === 'TypeError' || /does not provide an export|Importing binding name|ambiguous indirect export|dynamically imported module|Importing a module script failed/i.test(m);
}
/** PURE: a deploy check's answer → 'reload' (this page's deploy is gone + no reload yet for that one) · 'same' · 'unknown' · 'done' */
export function skewVerdict(page, live, reloadedFor) {
  if (page == null || live == null) return 'unknown';
  if (page === live) return 'same';
  return reloadedFor === live ? 'done' : 'reload';
}

/** wrap a dynamic import's promise: `lazyImport(import('./x.js'), 'x')` — resolves / rejects exactly as the import does */
export function lazyImport(p, tag = '') {
  return Promise.resolve(p).catch(e => { if (maySkew(e)) checkSkew(e, tag); throw e; });
}

async function liveDeploy() {
  try {
    const r = await fetch('/api/time?v=1', { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    if (bootV === undefined) noteDeploy(j && j.v);   // (the boot's own sync hadn't answered yet: this is the best this page knows)
    return j && j.v ? String(j.v) : null;
  } catch { return null; }
}
const readRK = () => { try { return sessionStorage.getItem(RK); } catch { return undefined; } };

function checkSkew(e, tag, known) {
  if (busy || typeof location === 'undefined') return busy;
  busy = (async () => {
    const live = known || await liveDeploy();
    const done = readRK();
    const v = known ? (done === live ? 'done' : 'reload') : skewVerdict(bootV == null ? null : bootV, live, done);
    if (v !== 'reload' || done === undefined) {   // (no session storage: never reload — it couldn't stop a loop)
      if (v === 'reload') console.warn(`[skew] ${tag}: deploy ${bootV} → ${live}, but no session storage — no reload`);
      busy = null; return false;
    }
    console.warn(`[skew] ${tag} failed to load (${(e && e.message) || e}) — this page is deploy ${bootV}, the live one ${live}: ONE reload, when the app next comes back on screen`);
    queueReload(bootV, live, tag);
    return true;
  })();
  return busy;
}

// CITY A — item 10: THE QUEUED CATCH-UP RELOAD. Runs at a RETURN only (visibilitychange → visible after the page was hidden — the app reopened from
// the home screen / another app): never mid-tap, never mid-match, never while a sheet is open (a return with one open waits for the next return).
// Each one is LOGGED to /admin's reports first (kind 'reload': the build from → to, the screen, the reason, how long it waited) — sendBeacon,
// so the line survives the reload.
let pending = null, wasHidden = false;
function queueReload(from, live, tag) {
  if (pending) return;
  pending = { from: from == null ? '?' : String(from), live, tag, at: Date.now(), returns: 0 };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
}
function onVis() {
  if (!pending) return;
  if (document.visibilityState === 'hidden') { wasHidden = true; return; }
  if (!wasHidden) return;
  wasHidden = false; pending.returns++;
  let holding = true, gated = true;
  try { holding = !!hold(); gated = !!gate(); } catch { /* both stay true: wait */ }
  if (!reloadAtReturn({ returning: true, holding, gated, sharedAgo: sharedAgo() })) return;
  doReload();
}
async function doReload() {
  const P = pending; if (!P) return;
  try { sessionStorage.setItem(RK, P.live); } catch { pending = null; return; }   // (ONE per deploy — never a loop)
  let where = ''; try { where = String(whereFn() || ''); } catch { /* fine */ }
  try {
    const text = `A CATCH-UP RELOAD — ONE DEPLOY AT A TIME: this page's build ${String(P.from).slice(0, 7)} → the live ${String(P.live).slice(0, 7)}\nscreen: ${where || '?'}\nreason: ${P.tag}\nwaited: ${Math.round((Date.now() - P.at) / 1000)} s for a return (${P.returns} return${P.returns === 1 ? '' : 's'}) — never mid-tap, mid-match or with a sheet open`;
    const body = JSON.stringify({ p: 'report', r: { kind: 'reload', text } });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/log', new Blob([body], { type: 'text/plain' })))) fetch('/api/log', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* the log is polish */ }
  // (the boot's files asked for afresh first — WebKit's reload alone reused another deploy's cached copy: LOAD FIX 3)
  try { if (window.__boot && window.__boot.refresh) await window.__boot.refresh(); } catch { /* the reload still goes */ }
  location.reload();
}

// PLAY NOW — Group 0a: ONE BUILD PER PAGE (sw.js) — the worker tells this page its build (ns:build) and asks before it leaves it
// (ns:build-gone: the network moved to another deploy and this page wants a file its build's copy doesn't hold). The answer: no match on
// screen → `mix: false` + ONE reload now (the file is refused — the page is leaving); a match on screen → `mix: true` (the network's files
// until the podium) + the reload once the match is over (holdSkewReload); a reload already made for that deploy → `mix: true`, no loop.
const sw = typeof navigator !== 'undefined' && navigator.serviceWorker;
if (sw && typeof sw.addEventListener === 'function') {
  sw.addEventListener('message', ev => {
    const d = ev.data;
    if (!d || typeof d !== 'object') return;
    if (d.t === 'ns:build') { if (d.v) { workerV = String(d.v); if (bootV === undefined || bootV !== workerV) bootV = workerV; } return; }
    if (d.t !== 'ns:build-gone') return;
    const a = goneAnswer({ reloadedFor: readRK(), live: d.live ? String(d.live) : null });
    if (bootV === undefined || bootV !== d.v) bootV = d.v ? String(d.v) : bootV;
    try { if (!d.tell && ev.source) ev.source.postMessage({ t: 'ns:build-gone-ans', mix: a.mix }); else if (d.tell && a.mix && sw.controller) sw.controller.postMessage({ t: 'ns:build-gone-ans', mix: true }); } catch { /* the worker's own timeout answers */ }
    if (a.reload) checkSkew(new Error(`this page's build ${d.v} is gone (live ${d.live})`), 'one build per page', d.live ? String(d.live) : null);
  });
  try { if (sw.controller) sw.controller.postMessage({ t: 'ns:build?' }); } catch { /* polish */ }
}

/** the test hook (tests/lazy-import.test.mjs + the skew E2E) */
export const skewDebug = () => ({ page: bootV === undefined ? undefined : bootV, worker: workerV || null, reloadedFor: readRK(), checking: !!busy, pending: pending ? { ...pending } : null });
