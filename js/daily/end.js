// THE DAILY KIT — THE END SCREEN's shared parts (DM1 — FABLE REVIEW #1, 10): the finish recorded (a lost signal retried, backed off — a
// retry is free: the server keeps the first finish), the "NEXT … IN 13:39:21" countdown to 4 am Eastern on the server's clock, the SHARE +
// countdown + record block every daily's end screen closes with, the headline that shrinks to its line, and SHARE's plain-line fallback.
// A game keeps its own headline, numbers and picture (its classes keep its prefix — `pw-` / `cc-`).
import { h } from '../ui/dom.js';
import { tubeButton } from '../ui/components.js';
import { easternParts } from '../core/week.js';
import { streakDay } from '../core/streak.js';
import { msToTurn, fmtCountdown } from './clock.js';

// (an error worth another try — js/daily/retry.js, PURE: the shared rule)
import { retryable } from './retry.js';
export { retryable };

/** the score to the server: up to `tries` times, backed off by `wait` (the view's — it never resolves once the view is gone) → { ok, resp } */
export async function recordFinish(finish, { wait, alive = () => true, tries = 4 } = {}) {
  for (let t = 0; t < tries && alive(); t++) {
    try { return { ok: true, resp: await finish() }; } catch (e) {
      if (!retryable(e)) break;
      await wait(800 * (t + 1));
    }
  }
  return { ok: false, resp: null };
}

/** "NEXT HARBOR IN 13:06:44", ticking each second on the server's clock (`now()`); a run that crossed the turn (DFIX1): `open` → the interval */
export function tickTurn(el, { now, day, open, next, alive = () => true }) {
  const paint = () => {
    const t = now();
    el.textContent = day() < streakDay(t) ? open : `${next} ${fmtCountdown(msToTurn(easternParts(t), t % 1000))}`;
  };
  paint();
  const id = setInterval(() => { if (!alive()) clearInterval(id); else paint(); }, 1000);
  return id;
}

/** the block under every daily's result: SHARE (the screen's one pink main), the countdown, the quiet record line → { el, next, rec } */
export function endActions(prefix, { onShare, rec = '' } = {}) {
  const next = h(`div.${prefix}-end-next`);
  const recEl = h(`div.${prefix}-end-rec`, { 'aria-live': 'polite' }, rec);
  const el = h(`div.${prefix}-end-actions`, tubeButton('SHARE', { kind: 'main', block: true, cls: `${prefix}-share`, onClick: () => onShare() }), next, recEl);
  return { el, next, rec: recEl };
}
/** the line the record shows only once every try failed */
export const NOT_RECORDED = 'NOT RECORDED · NO SIGNAL';

/** a headline shrinks to its line (never wraps, never clips) */
export function fitTitle(el) {
  const max = parseFloat(getComputedStyle(el).fontSize) || 40;
  let size = max;
  el.style.fontSize = '';
  for (let i = 0; i < 12 && el.scrollWidth > el.clientWidth + 1 && size > 18; i++) { size -= 2; el.style.fontSize = `${size}px`; }
}

/** SHARE: the game's share card (lazy — `load()` imports + shares it); if that fails, the plain line through the share sheet (or copied) */
export async function shareOrLine(load, line) {
  try { return await load(); } catch {
    try { if (navigator.share) await navigator.share({ text: line }); else await navigator.clipboard.writeText(line); } catch { /* the user closed it */ }
    return 'line';
  }
}

/** THE MUSIC FOLLOWS THE LOOK (PW2 / CC2): DAY = the day deck, NIGHT = the evening deck; the console re-reads it on a look change (app.js) */
export const lookMusic = () => [typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day' ? 'mood:day' : 'mood:evening', 'menu'];
