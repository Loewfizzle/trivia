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
  const entry = { el, close };
  open.push(entry);
  listenEsc();
  let done = false;
  return () => {
    if (done) return; done = true;
    const i = open.indexOf(entry); if (i >= 0) open.splice(i, 1);
    if (!open.length) z = BASE;
  };
}
/** true when el is the newest open layer (or nothing is in the stack) */
export const isTopLayer = el => !open.length || open[open.length - 1].el === el;
/** how many pop-ups are open on THE LAYER STACK (CITY FIXES: the title's screen at rest waits for none) */
export const layersOpen = () => open.length;
export const layerDebug = () => ({ z, open: open.length, top: open.length ? open[open.length - 1].el.className : null, esc: escN });

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
