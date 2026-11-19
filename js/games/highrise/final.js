// HIGH RISE — THE END SCREEN (S4A — docs/highrise.md "THE CARTRIDGE"): the BODY inside the console's podium frame (ui/final.js owns the
// frame: the XP box, THE FOOT — END-SCREEN STANDARD A: PLAY AGAIN · BACK TO THE CITY). It names HOW THE TOWER ENDED (the game's own
// table — logic.js#END_WORDS), THE FLOOR, the band reached, the perfects, then YOUR BEST — or NEW BEST — and YOUR TABLE: only from the
// SERVER's own answer for this match (it REPLAYED the run from the proof node — profile/queue.js's outcome); /api down = just the floor.
// THE SWITCH IS OFF until go-live (api/_lib/highrise.js#HIGHRISE_COUNTS): the server judges the run and AWARDS NOTHING — its answer is
// the small line "WOULD COUNT · FLOOR 85 · +12 XP" (the proof the whole pipeline works), and YOUR BEST stays this phone's own.
// No pills, no emoji, no dev text. JAYWALK's victory.js is the pattern.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { END_WORDS, perfectsLine, floorOf } from './logic.js';
import { BANDS, bandAt } from './bands.js';
import { BEST_KEY, cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY } from './lines.js';

const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* fine */ } } };
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');

/** THE SWITCH's line (counting OFF): what the server WOULD have awarded for the run it just judged — floor, XP, the streak, a best, a card */
export function wouldLine(w) {
  if (!w || typeof w !== 'object') return '';
  if (w.skip) return `WOULD NOT COUNT · ${String(w.skip).toUpperCase()}`;
  const parts = [`FLOOR ${num(w.floor)}`, `+${num(w.xp)} XP`];
  if (w.best) parts.push('NEW BEST');
  if (w.cards && w.cards.length) parts.push(w.cards.length === 1 ? '1 CARD' : `${w.cards.length} CARDS`);
  return `WOULD COUNT · ${parts.join(' · ')}`;
}

/**
 * YOUR TABLE (JAYWALK's — victory.js#yourTable): you + the friends YOUR list names with a HIGH RISE best (the server's read: /api/profile
 * `table` — never a pid in the page), best first, as SLIM CARDS (ui/strip-board.js — stills + THE LIVE LANE), the floor at the right. Shown
 * only when a friend has a best; ≤ TABLE_ROWS rows — you always among them. EMPTY while counting is OFF (the board has no rows).
 */
export const TABLE_ROWS = 4;
export function tableRows(rows, max = TABLE_ROWS) {
  const all = (rows || []).filter(r => r && typeof r.v === 'number').map((r, i) => ({ ...r, place: i + 1 }));
  if (all.length < 2 || !all.some(r => !r.me)) return [];
  const top = all.slice(0, max), me = all.find(r => r.me);
  if (me && !top.includes(me)) top[top.length - 1] = me;
  return top;
}
export function yourTable(el) {
  const slot = h('div.hi-table');
  el.append(slot);
  Promise.all([
    lazyImport(import('../../profile/api.js'), '../../profile/api.js').then(A => A.api('profile', { action: 'table', b: BOARD })),
    lazyImport(import('../../ui/strip-board.js'), '../../ui/strip-board.js').then(m => m.stripKit().then(K => ({ m, K }))),
  ]).then(([d, SB]) => {
    const rows = tableRows(d && d.rows);
    if (!rows.length || !slot.isConnected) { slot.remove(); return; }
    const strips = [], list = h('ol.hi-table-list', ...rows.map(r => {
      const st = SB.m.stripFor(SB.K, r, { friend: !r.me }); strips.push(st);
      return h('li', { class: r.me ? 'is-me' : null }, h('span.hi-table-n', String(r.place)), h('div.hi-table-card', SB.m.markMine(st.el, !!r.me)), h('b', num(floorOf(r.v))));   // (THE YOU ROW: the shared glow)
    }));
    list.style.setProperty('--hi-d', String(Math.max(...rows.map(r => num(floorOf(r.v)).length))));
    slot.replaceChildren(h('div.hi-table-k', 'YOUR TABLE'), list);
    const surface = SB.K.liveList(list, { label: 'highrise-table' });
    strips.forEach((st, i) => SB.m.stripFx(SB.K, surface, st, i + 1));
    const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
  }).catch(() => slot.remove());
}

export function finalScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code;
  const r = ((game && game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  el.classList.add('hi-fin'); el.dataset.mode = 'solo';
  if (made) el.classList.add('is-made');
  const big = h('b'), best = h('div.hi-fin-best', ''), would = h('div.hi-fin-would', '');
  big.replaceChildren(...[...String(floor)].map(d => h('span.hi-dg', { 'aria-hidden': 'true' }, d))); big.setAttribute('aria-label', String(floor));
  el.replaceChildren(
    h('div.hi-fin-t', r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || 'THE TOWER STANDS'),
    h('div.hi-fin-floor', h('span.hi-fin-k', 'FLOOR'), big),
    h('div.hi-fin-band', BANDS[bandAt(floor)].name),
    h('div.hi-fin-l', `${perfectsLine(r.p)} · BEST STREAK ${Math.floor(Number(r.s) || 0)}`),
    best, would);
  // YOUR BEST as this phone knows it (the server's last answer once counting is ON — else its own): the server's answer below puts it right
  const srv = cleanBest(ls.get(SRV_BEST_KEY)), known = srv || cleanBest(ls.get(BEST_KEY));
  // (THE REVIEW: the stage stored a run's new best BEFORE this screen was asked for — while counting is OFF (no server best yet) the
  //  phone's own record says NEW BEST · WAS n here; the server's answer takes the line over once counting is ON)
  const nb = globalThis.__hiNewBest;
  if (!srv && nb && game && nb.m === game.matchId && nb.v === floor && floor > 0) { best.textContent = nb.was > 0 ? `NEW BEST · WAS ${num(nb.was)}` : 'NEW BEST'; best.classList.add('is-new'); }
  else if (known > 0) best.textContent = `YOUR BEST · ${num(known)}`;
  if (!code) return;
  let tabled = false;
  const table = () => { if (!tabled && el.isConnected) { tabled = true; yourTable(el); } };
  setTimeout(table, 2200);
  // (THE REVIEW: the server's answer is shown WHATEVER the host's own row says — a podium row of 0 never hides it)
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      table();
      // THE SWITCH, OFF: the server judged the run, awarded nothing, and says what it WOULD have
      if (o.would) { would.textContent = wouldLine(o.would); would.classList.toggle('is-off', !!o.would.skip); el.dataset.would = String(o.would.floor); return; }
      // counting ON: NEW BEST / YOUR BEST from the server's own record of this match
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD];
      if (pb) {
        ls.set(SRV_BEST_KEY, floorOf(pb.v));
        best.textContent = pb.prev != null ? `NEW BEST · WAS ${num(floorOf(pb.prev))}` : 'NEW BEST'; best.classList.add('is-new');
        lazyImport(import('./sfx.js'), './sfx.js').then(S => S.play('streak', { rate: 1.12 })).catch(() => {});
      } else if (cur != null) { ls.set(SRV_BEST_KEY, floorOf(cur)); best.textContent = `YOUR BEST · ${num(floorOf(cur))}`; }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
