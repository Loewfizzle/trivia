// THE LAYER STACK (LOBBY 2.0 B — the owner's room test, Nov 4: on an existing account in the room, YOU → CUSTOMIZE YOUR CARD "did nothing";
// ‹ BACK on the profile then revealed it — CUSTOMIZE (z 70) had opened BEHIND the room's profile overlay (z 85)). Every pop-up that opens over
// another one — the profile's glass sheets, CUSTOMIZE, the full card — takes the NEXT layer here, so the newest is always on top, whatever
// screen (the title's profile, the room's overlay, a guest list) it opened from. The base sits above the screens + the profile overlay and
// under the end-of-round moment (9000); the toasts + the signal banner sit above every layer (components.css). Esc closes the TOP one only.
//   const release = takeLayer(el)   → el.style.zIndex = the next layer; call release() when it closes · isTopLayer(el)
const BASE = 400;
let z = BASE;
const open = [];

export function takeLayer(el) {
  z++;
  if (el) { el.style.zIndex = String(z); el.dataset.layer = String(z); }
  const entry = { el };
  open.push(entry);
  let done = false;
  return () => {
    if (done) return; done = true;
    const i = open.indexOf(entry); if (i >= 0) open.splice(i, 1);
    if (!open.length) z = BASE;
  };
}
/** true when el is the newest open layer (or nothing is in the stack) — an Esc handler closes only the top */
export const isTopLayer = el => !open.length || open[open.length - 1].el === el;
export const layerDebug = () => ({ z, open: open.length, top: open.length ? open[open.length - 1].el.className : null });

// ONE SHEET STACK for the WHOLE app (the owner's ADD-ON, Nov 4 8:18 am — "in GUESTS, tapping a slim card opens the FULL CARD BEHIND the sheet"):
// every pop-up that lands on <body> — the profile's sheets, CUSTOMIZE, the full card, AND the older .modal sheets (HOW TO PLAY, a game's
// options, settings, credits) — takes the next layer as it appears, and gives it back when it goes: whatever opens from a sheet opens ON
// TOP of it. One MutationObserver on <body>'s own children (never the subtree); the pop-ups that call takeLayer() themselves are skipped.
const POPUPS = '.modal, .pfs, .vl-dress, .vl-full';
let watching = false;
const released = new WeakMap();
export function watchLayers() {
  if (watching || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
  watching = true;
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
// streak card) and closes every .modal still open the way Esc does (its backdrop's click). Never throws.
const closers = new Set();
/** a module's own "close whatever I have open" → unregister() */
export function onCloseAll(fn) { closers.add(fn); return () => closers.delete(fn); }
export function closeAll() {
  for (const fn of [...closers]) { try { fn(); } catch (e) { console.warn('[layers] close', e); } }
  if (typeof document === 'undefined') return;
  for (const m of [...document.querySelectorAll('.modal:not(.out)')].reverse()) { try { m.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch { /* fine */ } }
}
