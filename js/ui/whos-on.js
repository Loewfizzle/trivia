// PLAY NOW — Group 2: WHO'S ON (the owner's live list) — ONE builder for both places it shows: the radio's LEDGER (a tap on IN THE CITY →
// THE SHEET) and /admin → STATS. The SERVER builds the list on the owner's ask (api/_lib/radio.js#whosOnNow — the owner ROLE checked; the
// crew + everyone else are refused): each person's SLIM CARD (ui/strip-board.js — never a second strip system; THE BOARD's public fields
// only) · WHERE (THE CITY · ROOM <CODE> · <GAME> · SOLO · <GAME> · THE DAILY · <NAME>) · the last check-in; guests counted on ONE line.
// Refreshed every 30 s ONLY while it is open + on screen (THE CITY'S IDLE POLLS: no new periodic call while it's closed — the timer ends
// with the block).
import { h } from './dom.js';
import { lazyImport } from './lazy-import.js';
import { whereLine, agoLine, guestLine } from '../core/whos-on.js';
import { GAMES, DAILIES } from '../config.js';

export const WHO_REFRESH_MS = 30e3;
const NAMES = Object.fromEntries([...GAMES, ...DAILIES].map(g => [g.id, g.name]));
const onScreen = () => { try { return document.visibilityState === 'visible' && (typeof document.hasFocus !== 'function' || document.hasFocus()); } catch { return true; } };

// (THE POOL FIXES — the owner's 1:21 pm add-on: the place line breaks only BETWEEN its parts — "ROOM GULF ·" / "PRISM DROP", never "PRISM" / "DROP")
const whereParts = line => String(line).split(' · ').flatMap((t, i, all) => [h('span.wo-part', i < all.length - 1 ? `${t} ·` : t), i < all.length - 1 ? ' ' : null]).filter(Boolean);

/** the list block → { el, refresh, destroy } — api: profile/api.js#api */
export function whosOnBlock({ api }) {
  const list = h('ol.wo-list', { 'aria-live': 'polite' }, h('li.wo-wait', 'Asking the city…'));
  const foot = h('p.wo-guests');
  const stamp = h('p.wo-stamp');
  const el = h('div.wo', list, foot, stamp);
  let dead = false, t = 0, busy = false;
  async function refresh() {
    if (dead || busy) return;
    busy = true;
    try {
      const [d, SB] = await Promise.all([api('admin', { action: 'radioWhosOn' }), lazyImport(import('./strip-board.js'), './strip-board.js').then(m => m.stripKit().then(K => ({ ...m, K })))]);
      if (dead) return;
      const rows = (d && d.rows) || [];
      list.classList.toggle('is-strips', rows.length > 0);
      list.classList.add('is-still');
      if (!rows.length) list.replaceChildren(h('li.wo-wait', 'Nobody with a card is on right now.'));
      else {
        list.replaceChildren(...rows.map(r => {
          const st = SB.stripFor(SB.K, r.card);
          return h('li.wo-row', { dataset: { k: r.where && r.where.k } }, h('div.wo-card', st.el), h('div.wo-meta', h('b.wo-where', ...whereParts(whereLine(r.where, NAMES))), h('small.wo-ago', agoLine(r.at, d.now))));
        }));
        // (THE POOL FIXES add-on 3 — the owner's call: STATIC CARDS here, no animation — no effect surface, so each strip shows its BAKED
        //  STILL (vault/stills.js: a card drawn in code reads as its still wherever no effect paints it) or its CSS art; .is-still stops every
        //  CSS animation inside the list. Cheaper + faster to open)
      }
      const g = guestLine(d && d.guests);
      foot.textContent = g || '';
      foot.hidden = !g;
      stamp.textContent = `${rows.length} with a card · checked ${new Date(d.now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · a check-in every ~5 min`;
    } catch (e) {
      if (!dead) list.replaceChildren(h('li.wo-wait', /not_owner|403/.test(String(e && (e.code || e.message))) ? 'The owner only.' : 'Couldn’t ask the city — try again in a moment.'));
    } finally { busy = false; }
  }
  const tick = () => {
    clearTimeout(t);
    if (dead) return;
    if (!el.isConnected) { destroy(); return; }   // (the block left the page: the timer ends with it — never a call while it's closed)
    if (onScreen()) refresh();
    t = setTimeout(tick, WHO_REFRESH_MS);
  };
  function destroy() { dead = true; clearTimeout(t); }
  refresh();
  t = setTimeout(tick, WHO_REFRESH_MS);
  return { el, refresh, destroy };
}

/** THE SHEET (the radio's LEDGER → IN THE CITY) */
export function openWhosOn({ api, openSheet }) {
  const B = whosOnBlock({ api });
  return openSheet({ title: 'WHO’S ON', kicker: 'ONLINE NOW · THE OWNER ONLY', cls: 'wo-sheet', label: 'Who’s on', body: [B.el], onClose: () => B.destroy() });
}
