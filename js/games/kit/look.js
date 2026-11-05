// THE GAME LOOK (SHELL 2.0 B2 — the owner, Nov 5 12:20 pm: the B1 sun / moon button above PLAY was "more confusing than helpful"): a SETTINGS
// row — ☰ → Settings → "Game look: AUTO · DAY · NIGHT" (ui/settings-panel.js), reachable in the room AND in a game. PER DEVICE (localStorage;
// multiplayer too — it only changes YOUR screen). NO LOCK (B1's "locked once the match starts" dropped): a change mid-game re-themes your
// screen at once. AUTO (the default) = the real sun (core/sky.js — like the city), re-read every minute. app.js#paintLook sets
// body[data-look="day|night"] while a match is on screen; games draw NO switch of their own and READ the look live (CSS: body[data-look="day"]
// …, JS: document.body.dataset.look + the 'ns-look' event). The city is untouched.
//   LOOKS · LOOK_LABEL · savedLook() · saveLook(l) (fires 'ns-look') · resolveLook(choice, sunUp) → 'day' | 'night' · sunUpNow(ms)
export const LOOKS = Object.freeze(['auto', 'day', 'night']);
export const LOOK_LABEL = Object.freeze({ auto: 'AUTO', day: 'DAY', night: 'NIGHT' });
export const LOOK_EVENT = 'ns-look';
const KEY = 'ns:look';
export function savedLook() { try { const v = localStorage.getItem(KEY); return LOOKS.includes(v) ? v : 'auto'; } catch { return 'auto'; } }
export function saveLook(l) {
  if (!LOOKS.includes(l)) return;
  try { localStorage.setItem(KEY, l); } catch { /* private mode: this tab only */ }
  mem = l;
  try { window.dispatchEvent(new CustomEvent(LOOK_EVENT, { detail: l })); } catch { /* not a browser */ }
}
let mem = null;
/** the choice now (a private-mode tab keeps its last pick in memory) */
export const currentLook = () => mem || savedLook();
/** the look a choice gives now: DAY / NIGHT as picked; AUTO = the real sun (sunUp: true by day) */
export const resolveLook = (choice, sunUp) => (choice === 'day' || choice === 'night' ? choice : sunUp ? 'day' : 'night');
/** is the sun up now at this phone's place? (core/sky.js — the city's own sun: its day + golden + dawn light) */
export async function sunUpNow(ms) {
  try {
    const S = await import('../../core/sky.js');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const L = S.look(ms, tz), w = L.w || {};
    return (w.day || 0) + (w.golden || 0) + (w.dawn || 0) >= 0.5;
  } catch { return true; }
}
