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
/** app.js: () → true while a match is on screen (the reload waits for the room / the podium) */
export function holdSkewReload(fn) { hold = typeof fn === 'function' ? fn : () => false; }

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

function checkSkew(e, tag) {
  if (busy || typeof location === 'undefined') return busy;
  busy = (async () => {
    const live = await liveDeploy();
    const done = readRK();
    const v = skewVerdict(bootV == null ? null : bootV, live, done);
    if (v !== 'reload' || done === undefined) {   // (no session storage: never reload — it couldn't stop a loop)
      if (v === 'reload') console.warn(`[skew] ${tag}: deploy ${bootV} → ${live}, but no session storage — no reload`);
      busy = null; return false;
    }
    try { sessionStorage.setItem(RK, live); } catch { busy = null; return false; }
    console.warn(`[skew] ${tag} failed to load (${(e && e.message) || e}) — this page is deploy ${bootV}, the live one ${live}: ONE reload${hold() ? ' once the match is over' : ''}`);
    while (hold()) await new Promise(r => setTimeout(r, 1000));
    // (the boot's files asked for afresh first — WebKit's reload alone reused another deploy's cached copy: LOAD FIX 3)
    try { if (window.__boot && window.__boot.refresh) await window.__boot.refresh(); } catch { /* the reload still goes */ }
    location.reload();
    return true;
  })();
  return busy;
}

/** the test hook (tests/lazy-import.test.mjs + the skew E2E) */
export const skewDebug = () => ({ page: bootV === undefined ? undefined : bootV, reloadedFor: readRK(), checking: !!busy });
