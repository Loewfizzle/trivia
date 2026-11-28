// THE END-SCREEN BOARD (F5B — the owner's FINAL SHAPE, Nov 27: docs/cartridge.md "THE END-SCREEN BOARD"): ONE shared leaderboard block for
// the podium (ui/final.js mounts it under the game's body), PER-GAME OPT-IN — a cartridge's `END_BOARD = { b, word, avg }` (games/contract.js).
// ON (THE END-BOARD SWITCH-ON, Nov 27): FREEFALL · JAYWALK · HIGH RISE (+ AVG) · PRISM DROP (SCORE RUSH) · OVERCLOCK (QUICK, solo) — a
// cartridge without END_BOARD never loads this module (its end screen is exactly as it was: NEON PAR, SLIPSTREAM, HOLD'EM).
//   SOLO: the board's TOP 3 — everyone by default — under ONE header: the tick "☐ FRIENDS ONLY" (F5C — the owner, Nov 27: no "THE WORLD"
//     heading; a drawn box + the words: no pill; unticked = everyone) that switches the rows to YOUR TABLE (you + your friends' bests — the server's /api/profile `table`). ONE remembered setting for every game
//     (localStorage `ns:endb:fr`, wrapped). No friends yet → "NO FRIENDS YET", the world stays. Each row: the rank, the player's SLIM CARD
//     (ui/strip-board.js — stills + THE LIVE LANE; THE YOU ROW's glow on yours), BEST + AVG (the row's STORED average — core/board-avg.js:
//     a dash under 5 runs). Not in the top 3 → ONE small line under them: "YOU · 12TH · 88 FLOORS".
//     READS: ONE board fetch (the all-time top 100) a session — YOUR TABLE only once FRIENDS is ticked — both kept for the session.
//   MATCH: the match's own TOP 3 (the frame's own rows: rank, slim card, the score + AVG off each room-mate's profile — `av`, already in
//     the room's mirror: no read) + "YOU · 5TH · 49 FLOORS" only from 4th down.
// Prefix `eb-` (css/components.css). DOM + the lazy kits only; nothing here counts or writes anything.
import { h } from './dom.js';
import { lazyImport } from './lazy-import.js';
import { boardDef, fmtValue } from '../core/boards.js';

/** the remembered FRIENDS tick — ONE setting for every game */
export const FRIENDS_KEY = 'ns:endb:fr';
/** how many rows the block shows */
export const TOP = 3;
const readFr = () => { try { return localStorage.getItem(FRIENDS_KEY) === '1'; } catch { return false; } };
const writeFr = on => { try { localStorage.setItem(FRIENDS_KEY, on ? '1' : '0'); } catch { /* this page only */ } };
const whole = n => Math.max(0, Math.round(Number(n) || 0));
const num = n => whole(n).toLocaleString('en-US');
/** PURE: 1 → 1ST · 2 → 2ND · 3 → 3RD · 12 → 12TH · 22 → 22ND */
export function ordinal(n) { const v = whole(n), t = v % 100, u = v % 10; return `${v}${t >= 11 && t <= 13 ? 'TH' : u === 1 ? 'ST' : u === 2 ? 'ND' : u === 3 ? 'RD' : 'TH'}`; }
/** PURE: a board value as the block prints it — the BOARD's own format (THE END-BOARD SWITCH-ON: HIGH RISE's board keeps a tower as ONE sort
 *  number — core/boards.js fmt 'floor' prints its floor); a plain count = "1,234" (no board known: the number itself) */
export const valText = (v, b) => { const d = b ? boardDef(b) : null; return d && d.fmt !== 'int' ? fmtValue(d, Number(v)) : num(v); };
/** PURE: the YOU line — "YOU · 12TH · 88 FLOORS" (no rank known: "YOU · 88 FLOORS"); `b` = the board (its format) */
export const youLine = (rank, v, word, b = null) => `YOU · ${rank > 0 ? `${ordinal(rank)} · ` : ''}${valText(v, b)} ${word}`;
/** PURE: the rows the block shows from a ranked list (each { rank, v, me? }) → { top: the first TOP, you: your row when it is not among them } */
export function pickRows(rows, n = TOP) {
  const all = (rows || []).filter(r => r && Number.isFinite(Number(r.v)));
  const top = all.slice(0, n), me = all.find(r => r.me);
  // (F5C — a SHARED place: ranked 3rd but 4th in the list → you take the last top slot that shares your place — never a "YOU · 3RD" line)
  if (me && !top.includes(me) && me.rank > 0 && me.rank <= n) { const i = top.map(r => r.rank).lastIndexOf(me.rank); if (i >= 0) top[i] = me; }
  return { top, you: me && !top.includes(me) ? me : null };
}

// ---- the session's reads (ONE each, kept)
const boards = new Map(), tables = new Map();
const api = () => lazyImport(import('../profile/api.js'), '../profile/api.js');
const myBid = () => lazyImport(import('../identity.js'), '../identity.js').then(I => { const m = I.loadMe(); return (m && m.profile && m.profile.bid) || null; }).catch(() => null);
function worldRows(b) {
  if (!boards.has(b)) boards.set(b, Promise.all([api().then(A => A.board(b, 'all', { n: 100 })), myBid()]).then(([d, bid]) => ((d && d.rows) || []).map(r => ({ ...r, me: !!(bid && r.id === bid) }))).catch(e => { boards.delete(b); throw e; }));
  return boards.get(b);
}
function tableRows(b) {
  if (!tables.has(b)) tables.set(b, api().then(A => A.api('profile', { action: 'table', b })).then(d => ((d && d.rows) || []).filter(r => r && typeof r.v === 'number').map((r, i) => ({ ...r, rank: i + 1 }))).catch(e => { tables.delete(b); throw e; }));
  return tables.get(b);
}
/** E2E only — the session's reads forgotten (a fixture re-seeded the board / YOUR TABLE: the next mount asks again) */
export const forgetReads = () => { boards.clear(); tables.clear(); };
// FIX C — S10 (FREEFALL's review; the shared block, every game with it on): the server's answer for a counted run carries a NEW BEST (`pbs`)
// → that board's kept reads are dropped and every block showing it reads again (the top 3 + the YOU line show the new row, no reload)
const shown = new Map();   // board → the mounted blocks' re-reads
export function newBests(outcome) {
  for (const p of (outcome && Array.isArray(outcome.pbs) ? outcome.pbs : [])) {
    if (!p || typeof p.b !== 'string') continue;
    boards.delete(p.b); tables.delete(p.b);
    for (const fn of shown.get(p.b) || []) { try { fn(); } catch { /* that block's own business */ } }
  }
}
let heard = false;
const hear = () => { if (heard) return; heard = true; lazyImport(import('../profile/queue.js'), '../profile/queue.js').then(Q => Q.onOutcome((k, o) => newBests(o))).catch(() => { heard = false; }); };
const kits = () => Promise.all([lazyImport(import('./strip-board.js'), './strip-board.js').then(m => m.stripKit().then(K => ({ m, K }))), lazyImport(import('../core/board-avg.js'), '../core/board-avg.js')]);

/** the rows into `list` as slim cards (ui/strip-board.js — THE LIVE LANE) → a destroy() */
function paintRows(list, rows, cfg, SB, AV, face) {
  const strips = [];
  list.replaceChildren(...rows.map(r => {
    const st = SB.m.stripFor(SB.K, face(r), { friend: false }); strips.push(st);
    return h('li', { class: r.me ? 'is-me' : null }, h('span.eb-n', String(r.rank)), h('div.eb-card', SB.m.markMine(st.el, !!r.me)),
      h('b.eb-v', valText(r.v, cfg.b), cfg.avg ? h('small.eb-av', AV.avgLabel(r.av != null && Number.isFinite(Number(r.av)) ? r.av : null)) : null));
  }));
  const d = Math.max(2, ...rows.map(r => valText(r.v, cfg.b).length));
  list.style.setProperty('--eb-d', String(d));
  list.classList.toggle('is-wide', d >= 5);   // (THE END-BOARD SWITCH-ON: a 5+ character score — OVERCLOCK's 4,120, PRISM DROP's 98,450 — a smaller numeral, so a 12-letter name still fits its card)
  const surface = SB.K.liveList(list, { label: 'end-board' });
  strips.forEach((st, i) => SB.m.stripFx(SB.K, surface, st, i + 1));
  return () => { try { surface.destroy(); } catch { /* fine */ } };
}

/**
 * mountEndBoard(el, cfg, { rows, players, me, solo, pubOf }) — fills `el` (the podium's slot): solo = the board's top 3 (everyone / YOUR TABLE — the FRIENDS ONLY tick);
 * a match = the frame's own rows (rows: [{ uid, rank, score }], best first). → { destroy() }
 */
export function mountEndBoard(el, cfg, { rows = [], players = {}, me = '', solo = true, pubOf = () => null } = {}) {
  const word = String(cfg.word || 'POINTS').toUpperCase(), b = cfg.b;
  const list = h('ol.eb-list'), you = h('div.eb-you'), note = h('div.eb-note');
  let off = null, gone = false;
  el.classList.add('eb', solo ? 'is-solo' : 'is-match');
  el.dataset.box = '';   // (THE FADE NEVER SLICES A BOX — ui/final.js#unslice)
  const done = () => { if (off) off(); off = null; };
  const show = (top, mine, face, still = () => true) => kits().then(([SB, AV]) => {
    if (gone || !still()) return;   // (a newer choice — the tick turned again — paints instead)
    done();
    off = paintRows(list, top, cfg, SB, AV, face);
    you.textContent = mine ? youLine(mine.rank, mine.v, word, b) : '';
    el.classList.toggle('has-rows', top.length > 0);
  });
  if (!solo) {
    // A MATCH: the frame's own rows — the top 3 + YOU from 4th down (the faces + AVG off the room's mirror: no read)
    const R = (rows || []).filter(r => r && r.uid).map(r => ({ uid: r.uid, rank: r.rank, v: r.score, me: r.uid === me, av: ((pubOf(players[r.uid]) || {}).av || {})[b] }));
    const { top, you: mine } = pickRows(R);
    el.append(h('div.eb-head', h('span.eb-k', 'THIS MATCH')), list, you);
    show(top, mine, r => pubOf(players[r.uid]) || { n: (players[r.uid] || {}).name, a: (players[r.uid] || {}).avatar, c: (players[r.uid] || {}).color }).catch(() => {});
    return { destroy() { gone = true; done(); } };
  }
  // SOLO: everyone · or YOUR TABLE (F5C: the header = the tick "☐ FRIENDS ONLY" alone — remembered; no heading word)
  const box = h('i.eb-box', { 'aria-hidden': 'true' });
  const tick = h('button.eb-tick', { type: 'button', role: 'checkbox', 'aria-checked': 'false', 'data-press': true, onclick: () => setFriends(!friends, true) }, box, h('span', 'FRIENDS ONLY'));
  el.append(h('div.eb-head', tick), list, you, note);
  let friends = false, ask = 0;
  function setFriends(on, byTap, msg = '') {
    friends = !!on; const n = ++ask;
    tick.setAttribute('aria-checked', String(friends)); tick.classList.toggle('is-on', friends);
    if (byTap) writeFr(friends);
    note.textContent = msg;
    (friends ? tableRows(b) : worldRows(b)).then(R => {
      if (gone || n !== ask) return;
      // (FIX C — S11: the tick unticks itself → '0' is REMEMBERED; the line says why only on the TAP that asked — never on a later end screen)
      if (friends && !R.some(r => !r.me)) { writeFr(false); setFriends(false, false, byTap ? 'NO FRIENDS YET' : ''); return; }
      const { top, you: mine } = pickRows(R);
      if (!top.length && !msg) note.textContent = 'NO RUNS ON THE BOARD YET';
      return show(top, mine, r => r, () => n === ask);
    }).catch(() => { if (!gone && n === ask) { note.textContent = 'THE BOARD IS RESTING'; done(); list.replaceChildren(); } });
  }
  setFriends(readFr(), false);
  hear();
  const again = () => { if (!gone) setFriends(friends, false); };
  if (!shown.has(b)) shown.set(b, new Set());
  shown.get(b).add(again);
  return { destroy() { gone = true; done(); const S = shown.get(b); if (S) S.delete(again); } };
}
