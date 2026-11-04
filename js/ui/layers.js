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
  if (el) el.style.zIndex = String(z);
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
