// FREEFALL — THE END SCREEN's BODY in the cartridge (F4A · F4B — docs/freefall.md "THE END SCREEN"; HIGH RISE's final.js is the pattern):
// the BODY inside the console's podium frame (ui/final.js owns the frame: its header slot — THE LOGO, put there by view.js —, the XP box,
// THE UNIVERSAL FOOTER: PLAY AGAIN · SHARE | HOME · a match: REMATCH · ROOM | SHARE). ONE builder with the test page's card (endscreen.js):
// the CAUSE, THE FLOOR NUMBER, FLOORS, "YOUR BEST · n · AVG n" (a NEW BEST: the AVG on its own line), the one line, YOUR TABLE — all from
// THE JUDGE's own row (director.js: the host's replay of the proof node), then the SERVER's own answer for this match (it REPLAYED the
// run itself — profile/queue.js's outcome). /api down = just the floor.
// THE SWITCH IS OFF until go-live (api/_lib/freefall.js#FREEFALL_COUNTS): the server judges the run and AWARDS NOTHING — its answer is the
// small line "WOULD COUNT · FLOOR 85 · +12 XP" just over the bar; YOUR BEST stays this phone's own (no AVG: the board has no rows).
// F4B — A MATCH's body (JAYWALK's + HIGH RISE's: the frame's own WINNER line leads, the console lists EVERY place under this body as slim
// cards with their floors + how their run ended): how YOUR run ended · "57 FLOORS · YOU FINISHED 2ND" · your call's result · the would-line.
// THE SHARE CARD is DRAWN while the end screen is read (share.js, lazily — nothing goes up until SHARE). No pills, no emoji, no dev text.
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { END_WORDS, gameStandings } from './logic.js';
import { ordinal } from './match.js';
import { endCard } from './endscreen.js';
import { BEST_KEY, cleanBest } from './best.js';
import { BOARD, SRV_BEST_KEY, wouldLine } from './lines.js';

const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* fine */ } } };
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');
// (F5B — SHARE = THE PICTURE ONLY: the card is drawn + encoded at the end screen; the TAP must reach the share sheet in its own turn — so
//  the share module, once the end screen has loaded it, is called DIRECTLY: no import's promise between the tap and navigator.share)
let SH = null;
const shareMod = () => lazyImport(import('./share.js'), './share.js').then(m => (SH = m));
const warmShare = (game, state) => shareMod().then(m => (typeof m.warmShare === 'function' ? m.warmShare(game, state) : null)).catch(() => {});
/** SHARE (index.js#shareRun — the console's universal footer): the picture alone, in the tap's own turn */
export const shareNow = (game, state) => (SH ? SH.shareRun(game, state) : shareMod().then(m => m.shareRun(game, state)));

/**
 * YOUR TABLE (JAYWALK's — victory.js#yourTable): you + the friends YOUR list names with a FREEFALL best (the server's read: /api/profile
 * `table` — never a pid in the page), best first, as SLIM CARDS (ui/strip-board.js — stills + THE LIVE LANE: the cards' faces sit well to
 * the RIGHT, clear of the name), the floors at the right — THE AVERAGE under them where the server sends one. Shown only when a friend
 * has a best; ≤ TABLE_ROWS rows — you always among them. EMPTY while counting is OFF (the board has no rows). `rowsOf` = the rows'
 * source (the checks hand in a fixture).
 */
export const TABLE_ROWS = 4;
export function tableRows(rows, max = TABLE_ROWS) {
  const all = (rows || []).filter(r => r && typeof r.v === 'number').map((r, i) => ({ ...r, place: i + 1 }));
  if (all.length < 2 || !all.some(r => !r.me)) return [];
  const top = all.slice(0, max), me = all.find(r => r.me);
  if (me && !top.includes(me)) top[top.length - 1] = me;
  return top;
}
const askTable = () => lazyImport(import('../../profile/api.js'), '../../profile/api.js').then(A => A.api('profile', { action: 'table', b: BOARD })).then(d => d && d.rows);
export function yourTable(el, rowsOf = askTable) {
  const slot = h('div.ff-table');
  el.append(slot);
  Promise.all([
    Promise.resolve().then(rowsOf),
    lazyImport(import('../../ui/strip-board.js'), '../../ui/strip-board.js').then(m => m.stripKit().then(K => ({ m, K }))),
    lazyImport(import('../../core/board-avg.js'), '../../core/board-avg.js'),
  ]).then(([all, SB, AV]) => {
    const rows = tableRows(all);
    if (!rows.length || !slot.isConnected) { slot.remove(); return; }
    const strips = [], hasAv = rows.some(r => 'av' in r), list = h(`ol.ff-table-list${hasAv ? '.has-av' : ''}`, ...rows.map(r => {
      const st = SB.m.stripFor(SB.K, r, { friend: !r.me }); strips.push(st);
      return h('li', { class: r.me ? 'is-me' : null }, h('span.ff-table-n', String(r.place)), h('div.ff-table-card', SB.m.markMine(st.el, !!r.me)), h('b', num(r.v), 'av' in r ? h('small.ff-table-av', AV.avgLabel(r.av)) : null));   // (THE YOU ROW: the shared glow)
    }));
    list.style.setProperty('--ff-d', String(Math.max(...rows.map(r => num(r.v).length))));
    slot.replaceChildren(h('div.ff-table-k', 'YOUR TABLE'), list);
    const surface = SB.K.liveList(list, { label: 'freefall-table' });
    strips.forEach((st, i) => SB.m.stripFx(SB.K, surface, st, i + 1));
    const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
  }).catch(() => slot.remove());
}

/** the would-line sits just over the bar (moved there once the frame stands — never among the personal numbers; it goes away at go-live) */
const overBarOf = (el, would) => () => { const fr = el.closest('.final'), foot = fr && fr.querySelector('.final-foot'); if (foot && would.nextElementSibling !== foot) foot.before(would); };

/** F4B — A MATCH's body. A watcher (a late joiner): nothing of their own. */
function matchScene(el, game, state) {
  const uid = state && state.uid, code = state && state.code, mine = !!(game.participants && game.participants[uid]);
  el.classList.add('ff-fin'); el.dataset.mode = 'match'; el.dataset.podium = 'none';
  if (!mine) return;
  warmShare(game, state);
  const r = ((game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  const place = (gameStandings(game).find(x => x.uid === uid) || {}).rank || 0, floorsTxt = `${num(floor)} ${floor === 1 ? 'FLOOR' : 'FLOORS'}`;
  const would = h('div.ff-fin-would', ''), cause = h('div.ff-ec-cause.fn-line', game.unproven || r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || 'NO RUN');
  cause.classList.toggle('is-gold', made);
  const body = h(`div.ff-ec${made ? '.is-made' : ''}`, cause,
    h('div.ff-fin-place', game.unproven ? `${floorsTxt} · NO LINE TO THE BOARD` : place ? `${floorsTxt} · YOU FINISHED ${ordinal(place)}` : floorsTxt));
  el.replaceChildren(body, would);
  const c = (game.calls || {})[uid];
  if (c) el.append(h('div.ff-fin-call', c.ok ? `YOUR CALL WAS RIGHT · +${c.bonus} POINTS` : 'YOUR CALL MISSED'));
  const overBar = overBarOf(el, would);
  setTimeout(overBar, 0);
  // (the winner's moment: the console's own sting is off for this game — a match plays it here, once the crown lands; a draw: none)
  const first = gameStandings(game).filter(x => x.rank === 1);
  if (first.length === 1) setTimeout(() => { if (el.isConnected) lazyImport(import('../../audio/progress-sfx.js'), '../../audio/progress-sfx.js').then(m => m.pgSfx('victory')).catch(() => {}); }, 2500);
  if (!code || game.unproven) return;
  // the server's own answer for this match (it REPLAYED every player's run): THE SWITCH's line while counting is OFF; a NEW BEST once ON
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      if (o.would) { globalThis.__ffWould = game.matchId; overBar(); would.textContent = wouldLine(o.would); would.classList.toggle('is-off', !!o.would.skip); el.dataset.would = String(o.would.floor); return; }   // (THE SWITCH said WOULD COUNT — the share card asks no link: the picture alone goes out)
      const pb = (o.pbs || []).find(x => x.b === BOARD);
      // (a COUNTED match raises YOUR BEST, as the server's record does — NEW BEST only of a best beaten)
      if (pb && !el.querySelector('.ff-fin-best')) { ls.set(SRV_BEST_KEY, cleanBest(pb.v)); const beat = pb.prev != null && cleanBest(pb.prev) > 0; body.append(h(`div.ff-ec-best.ff-fin-best${beat ? '.is-new' : ''}`, beat ? `NEW BEST · WAS ${num(pb.prev)}` : `YOUR BEST · ${num(pb.v)}`)); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}

export function finalScene(el, game, state) {
  if (game && game.mode !== 'solo') { matchScene(el, game, state); return; }
  const uid = state && state.uid, code = state && state.code;
  const r = ((game && game.results) || {})[uid] || {}, floor = Math.max(0, Math.floor(Number(r.f) || 0)), made = r.w === 'made';
  el.classList.add('ff-fin'); el.dataset.mode = 'solo';
  if (game && game.participants && game.participants[uid]) warmShare(game, state);
  const EC = endCard({}), would = h('div.ff-fin-would', '');
  EC.set({ words: r.bad ? 'NOT COUNTED' : END_WORDS[r.w] || 'THE RUN IS OVER', made, floor, bounces: r.b, blazes: r.bl, bestRun: r.br });
  el.replaceChildren(EC.el, would);
  const overBar = overBarOf(el, would);
  setTimeout(overBar, 0);   // (once the frame stands: YOUR TABLE sits right under the personal numbers — nothing between them)
  // YOUR BEST as this phone knows it (the server's last answer once counting is ON — else its own; no AVG is known yet): the server's
  // answer below puts it right — "YOUR BEST · n · AVG n"
  const known = cleanBest(ls.get(SRV_BEST_KEY)) || cleanBest(ls.get(BEST_KEY));
  EC.best(known, false, 0);
  if (!code || !(floor > 0)) return;
  let tabled = false;
  const table = () => { if (!tabled && el.isConnected) { tabled = true; yourTable(EC.table); } };
  setTimeout(table, 2200);
  lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').then(Q => {
    const k = Q.matchKey(code, game.matchId);
    const show = o => {
      if (!o || !el.isConnected) return;
      table();
      // THE SWITCH, OFF: the server judged the run, awarded nothing, and says what it WOULD have
      if (o.would) { globalThis.__ffWould = game.matchId; overBar(); would.textContent = wouldLine(o.would); would.classList.toggle('is-off', !!o.would.skip); el.dataset.would = String(o.would.floor); return; }
      // counting ON: NEW BEST / YOUR BEST from the server's own record of this match — and THE AVERAGE after it (JAYWALK's JT2: from 5
      // counted solo runs; under that a dash)
      const pb = (o.pbs || []).find(x => x.b === BOARD), cur = (o.bests || {})[BOARD], av = o.av && BOARD in o.av ? o.av[BOARD] : undefined;
      if (pb) { ls.set(SRV_BEST_KEY, cleanBest(pb.v)); EC.best(cleanBest(pb.v), pb.prev != null && cleanBest(pb.prev) > 0, cleanBest(pb.prev), av); }   // (NEW BEST only of a best that was BEATEN — a first counted run is YOUR BEST)
      else if (cur != null) { ls.set(SRV_BEST_KEY, cleanBest(cur)); EC.best(cleanBest(cur), false, 0, av); }
    };
    show(Q.outcomeFor(k));
    const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
  }).catch(() => {});
}
