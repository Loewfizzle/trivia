// HIGH RISE — THE LOOK SWITCH's CHOICE (S3 — docs/highrise.md "THE LOOK SWITCH"): AUTO · DAY · NIGHT on the test page's START screen,
// remembered on THIS PHONE (`hi:play:look` — never a profile key, never a server call). AUTO = the real sun — THE SITE's OWN SUN RULE
// (games/kit/look.js#sunUpNow → core/sky.js: the city's sun, at this phone's place), asked again every minute. `?look=day|night` on the
// address = that look for this visit (a link to show one — nothing is stored).
// (At go-live the game reads the console's GAME LOOK setting — body[data-look] — like every game; this file is the test page's.)
import { LOOKS, LOOK_LABEL, resolveLook, sunUpNow } from '../kit/look.js';
export { LOOKS, LOOK_LABEL, resolveLook, sunUpNow };

export const LOOK_KEY = 'hi:play:look';
/** a stored / asked value → 'auto' | 'day' | 'night' */
export const cleanLook = v => (LOOKS.includes(v) ? v : 'auto');
export function readLook() { try { return cleanLook(localStorage.getItem(LOOK_KEY)); } catch { return 'auto'; } }
export function writeLook(l) { try { localStorage.setItem(LOOK_KEY, cleanLook(l)); } catch { /* a private window forgets: fine */ } }
/** before the sun rule has answered (it is a lazy module): the clock's own guess — day from 7 to 19 */
export const guessLook = hour => (hour >= 7 && hour < 19 ? 'day' : 'night');
