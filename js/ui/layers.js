// THE LAYER STACK (LOBBY 2.0 B — the owner's room test, Nov 4: on an existing account in the room, YOU → CUSTOMIZE YOUR CARD "did nothing";
// ‹ BACK on the profile then revealed it — CUSTOMIZE (z 70) had opened BEHIND the room's profile overlay (z 85)). Every pop-up that opens over
// another one — THE SHEET (ui/sheet.js), CUSTOMIZE, the full card, the sighting pop-ups, the streak card — takes the NEXT layer here, so the
// newest is always on top, whatever screen it opened from. The base sits above the screens + the profile overlay and under the end-of-round
// moment (9000); the message bar + the signal banner sit above every layer (components.css).
//   const release = takeLayer(el, { close, min? })   → el.style.zIndex = the next layer; call release() when it closes · isTopLayer(el)
// SHELL 2.0 A — ONE Esc (review-6.md H11: seven Esc handlers, only three asked who was on top): THIS file owns the only Escape listener;
// it closes the TOP layer only, through the close the pop-up gave takeLayer(). A pop-up never listens for Escape itself.
const BASE = 400;
let z = BASE;
const open = [];

export function takeLayer(el, { close = null, min = 0 } = {}) {
  // (min: a pop-up that must sit over the end-of-round moment (9000) — the streak card, the sightings — keeps its height; whatever opens
  //  FROM it still takes the next layer above it: review-6.md H2)
  z = Math.max(z + 1, min);
  if (el) { el.style.zIndex = String(z); el.dataset.layer = String(z); }
  const entry = { el, close, t: now(), seen: false };
  open.push(entry);
  listenEsc();
  let done = false;
  return () => {
    if (done) return; done = true;
    const i = open.indexOf(entry); if (i >= 0) open.splice(i, 1);
    if (!open.length) z = BASE;
  };
}
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** CITY A — FABLE REVIEW 2's C2: a layer nobody gives back killed every city tap until a reload (THE RADIO's destroy(), ?preview=card).
 *  An entry whose element LEFT THE PAGE is dropped here — once it was seen in the page, or 1 s after it was taken (a layer taken just
 *  before its element is appended is never dropped in that gap). PURE on the entry: `gone(entry, t)`. */
export function layerGone(e, t = now()) {
  if (!e || !e.el || typeof e.el.isConnected !== 'boolean') return false;
  if (e.el.isConnected) { e.seen = true; return false; }
  return e.seen || t - (e.t || 0) > 1000;
}
function prune() {
  const t = now();
  for (let i = open.length - 1; i >= 0; i--) if (layerGone(open[i], t)) { open.splice(i, 1); pruned++; }
  if (!open.length) z = BASE;
}
let pruned = 0;
/** true when el is the newest open layer (or nothing is in the stack) */
export const isTopLayer = el => { prune(); return !open.length || open[open.length - 1].el === el; };
/** how many pop-ups are open on THE LAYER STACK (CITY FIXES: the title's screen at rest waits for none) — a layer whose element left the page is gone (C2) */
export const layersOpen = () => { prune(); return open.length; };
/**
 * THE JUST-BORN GUARD (CITY A — FABLE REVIEW 2's C3, ONE helper for every pop-up): a pop-up opened from a pointer-up gets that same tap's
 * `click` a moment later (Chromium's touch emulation, Playwright's WebKit, Android) — on its backdrop, which closed it at once. A backdrop
 * click in the pop-up's first `ms` is the opening finger, never a close. `const old = bornGuard(); … if (old()) close();`
 */
export function bornGuard(ms = 350) { const t0 = now(); return () => now() - t0 > ms; }
/**
 * IS A SCREEN ON TOP OF THE CITY? — PURE (the owner's live bug, Nov 14 2026: a tap on a SCORES slim card opened a billboard's game card
 * THROUGH the DAILY screen; docs/title.md "A SCREEN ON TOP OF THE CITY"). The city listens on the WINDOW, so it asks before it answers a touch:
 *   layers   how many pop-ups / overlays are open on THE LAYER STACK (layersOpen() — every sheet, the dailies' screen + runs, CUSTOMIZE, a
 *            full card, the player page, the album, the radio, a streak card, a sighting's photo)
 *   held     the city is HELD under a full-screen overlay (ui/city-hold.js — the DAILY screen, a full card, the guests' screen)
 *   inCity   the touch began ON THE CITY (touchInCity below — false = on something another screen put on <body>: a game's screen, a banner)
 * → true = the touch belongs to the screen on top: the city's taps, sightings, billboards, door and hover all ignore it.
 */
export function cityCovered({ layers = 0, held = false, inCity = true } = {}) { return layers > 0 || !!held || !inCity; }
/**
 * DID THE TOUCH BEGIN ON THE CITY? — PURE (PFIX-3 — FABLE REVIEW 2's C1: the first rule asked only `root.contains(target)`, and the title's
 * root is a COLUMN (560 px; 1180 px on a big screen) while the city's canvas fills the whole window on <body> — so on a desktop, an iPad and
 * a phone held sideways every touch BESIDE the column landed on #stage and counted as "a screen on top": the door, the signs out there, the
 * sightings and the hover were dead). The city is: the title's root and everything in it · the root's ANCESTORS (#stage, <body> — the bare
 * page beside the column) · the scene's own wrap (the canvas on <body>). An element another screen put on <body> is none of the three.
 */
export function touchInCity(t, root, wrap) {
  if (!t) return false;
  const has = (a, b) => !!(a && b && typeof a.contains === 'function' && a.contains(b));
  return has(root, t) || has(t, root) || has(wrap, t);
}
export const layerDebug = () => { prune(); return { z, open: open.length, top: open.length && open[open.length - 1].el ? open[open.length - 1].el.className : null, esc: escN, pruned }; };

// THE ONE Esc: the top layer's own close (a layer taken without one — a watched .modal — gets its backdrop's click, the way a tap outside
// closes it); nothing open → the ☰ menu's closer (registered as the fallback below) or nothing
let escOn = false, escN = 0, escFallback = null;
/** the ☰ menu (not a layer — it sits over the corner) closes on Esc when no layer is open */
export function onEscFallback(fn) { escFallback = fn; listenEsc(); }
function listenEsc() {
  if (escOn || typeof document === 'undefined') return;
  escOn = true;
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    prune();
    const top = open[open.length - 1];
    if (top) {
      e.preventDefault(); escN++;
      try { if (top.close) top.close(); else top.el.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch (err) { console.warn('[layers] esc', err); }
      return;
    }
    if (escFallback) { try { escFallback(); } catch { /* fine */ } }
  });
}

// ONE SHEET STACK for the WHOLE app (the owner's ADD-ON, Nov 4 8:18 am — "in GUESTS, tapping a slim card opens the FULL CARD BEHIND the sheet"):
// a pop-up that lands on <body> without calling takeLayer() itself (a frozen game's own sheet) takes the next layer as it appears, and gives
// it back when it goes. One MutationObserver on <body>'s own children (never the subtree); the pop-ups that call takeLayer() are skipped.
const POPUPS = '.modal, .sh, .vl-dress, .vl-full';
let watching = false;
const released = new WeakMap();
export function watchLayers() {
  if (watching || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
  watching = true;
  listenEsc();
  new MutationObserver(list => {
    for (const m of list) {
      for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches(POPUPS) && !n.dataset.layer && !released.has(n)) released.set(n, takeLayer(n));
      for (const n of m.removedNodes) if (n.nodeType === 1 && released.has(n)) { released.get(n)(); released.delete(n); }
    }
  }).observe(document.body, { childList: true });
}

// FR6 FIXES A (B1 + B7) — CLOSE EVERYTHING. A guest with their profile, CUSTOMIZE, the full card, the ☰ menu or HOW TO PLAY open when the
// host tapped INITIATE kept that sheet OVER THE RUNNING MATCH (its clock running) until they backed out of two screens; a KICK left the
// profile overlay up. closeAll() — at the game start's stamp (room-city.js#startFx) and on leaving the room (room.js#exitRoom) — runs every
// registered closer (each pop-up's own module registers its close: the profile overlay, its sheets, CUSTOMIZE, the full card, the menu, the
// streak card) and closes every layer still open the way Esc does. Never throws.
const closers = new Set();
/** a module's own "close whatever I have open" → unregister() */
export function onCloseAll(fn) { closers.add(fn); return () => closers.delete(fn); }
export function closeAll() {
  for (const fn of [...closers]) { try { fn(); } catch (e) { console.warn('[layers] close', e); } }
  for (const top of [...open].reverse()) { try { if (top.close) top.close(); else top.el.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch { /* fine */ } }
}
