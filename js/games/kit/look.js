// THE ROOM's LOOK SWITCH (SHELL 2.0 B1 — the owner via the dailies chat, Nov 5 7:55–7:56 am): a room of ONE (and the dailies later) picks
// the match's look — AUTO (the real sun, like the city) · DAY · NIGHT — with ONE round SUN / MOON button beside PLAY on the room dock
// (room-dock.js — it always shows its state: the icon + AUTO / DAY / NIGHT under it). The choice is REMEMBERED per device (the next solo room
// starts on it) and LOCKED once the match starts: the console resolves it at the start (AUTO → day / night by the sun then), keeps that for
// the whole match (per match id) and sets body[data-look="day|night"] while the match is on screen. Games draw nothing of their own — they
// READ the look (CSS: body[data-look="day"] …, JS: document.body.dataset.look). The city is untouched.
//   LOOKS · nextLook(l) · savedLook() · saveLook(l) · resolveLook(choice, sunUp) → 'day' | 'night' · matchLook(matchId, choice, sunUp)
export const LOOKS = Object.freeze(['auto', 'day', 'night']);
export const LOOK_LABEL = Object.freeze({ auto: 'AUTO', day: 'DAY', night: 'NIGHT' });
const KEY = 'ns:look', MKEY = 'ns:look:m';
export const nextLook = l => LOOKS[(Math.max(0, LOOKS.indexOf(l)) + 1) % LOOKS.length];
export function savedLook() { try { const v = localStorage.getItem(KEY); return LOOKS.includes(v) ? v : 'auto'; } catch { return 'auto'; } }
export function saveLook(l) { if (!LOOKS.includes(l)) return; try { localStorage.setItem(KEY, l); } catch { /* private mode: this room only */ } }
/** the look a choice gives now: DAY / NIGHT as picked; AUTO = the real sun (sunUp: true by day) */
export const resolveLook = (choice, sunUp) => (choice === 'day' || choice === 'night' ? choice : sunUp ? 'day' : 'night');
/** LOCKED for the match: the first call for a match id resolves + keeps it (this tab's session); every later call returns the kept one */
export function matchLook(matchId, choice, sunUp) {
  const want = resolveLook(choice, sunUp);
  if (!matchId) return want;
  try {
    const kept = JSON.parse(sessionStorage.getItem(MKEY) || 'null');
    if (kept && kept.m === matchId && (kept.l === 'day' || kept.l === 'night')) return kept.l;
    sessionStorage.setItem(MKEY, JSON.stringify({ m: matchId, l: want }));
  } catch { /* fine: the resolved look */ }
  return want;
}
/** is the sun up now at this phone's place? (core/sky.js — the city's own sun: its day + golden + dawn light) */
export async function sunUpNow(ms) {
  try {
    const S = await import('../../core/sky.js');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const L = S.look(ms, tz), w = L.w || {};
    return (w.day || 0) + (w.golden || 0) + (w.dawn || 0) >= 0.5;
  } catch { return true; }
}
