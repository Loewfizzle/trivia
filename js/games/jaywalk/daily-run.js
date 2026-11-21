// JAYWALK's DAILY — THE PHONE HALF (DAILY B — docs/jaywalk.md "THE DAILY"; the server half: api/_lib/jaywalk-daily.js). A DAILY RUN module for
// js/screens/daily.js#openRun (a `tries` row loads THIS, never the room cartridge — so nothing here is in JAYWALK's preload graph / its budget):
//   daily.create(…) → the run's shell · createApiJudge() → THE DAILY KIT's judge (+ roomWins) · createView() → the run's screen
// THE RUN = the REAL JAYWALK view (view.js — both looks, its sounds, its lines) in MODES.daily through ONE adapter (`state.jwDaily`): START →
// the day's seed + the SERVER's go (tick 0 = go — the 3 · 2 · 1 is the lead) + the proof node's path (dly/jaywalk/{day}/w/{uid}/{try}); the
// view appends its hops there as server-stamped chunks (THE DROPPED SIGNAL as every run); the end (out · THE MOTHERSHIP at 5:00) →
// this module writes `e` (awaited: the chunks before it have landed — one connection, in order) → FINISH → the SERVER's lanes on the end card,
// never the phone's own count. NO PAUSE, NO RESUME, NO STOP (J3 — THREE TRIES ALL DAY: a try ends only by a hit or THE MOTHERSHIP at 5:00):
// hiding the app, a refresh, leaving or THE ROOM WINS still end the try (scored as it stands — FINISH sent with keepalive on the way out; the
// server also closes a quiet try by itself — no peeking at the course). Between tries: TRY AGAIN (n TRIES LEFT) · COME BACK LATER (back to the
// dailies — the day is NEVER marked done: the ticket keeps TRY AGAIN from the SERVER's tries until the 3rd try or 4 am).
import { h } from '../../ui/dom.js';
import { tubeButton } from '../../ui/components.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { dbRef, set as dbSet, serverTimestamp, want, release, expectRefusal } from '../../firebase.js';
import { api } from '../../profile/api.js';
import { createDailyJudge } from '../../daily/judge.js';
import { todayNow, onToday } from '../../daily/today.js';
import { placeLine, tryEndedLine, NEW_BEST } from '../../daily/today-logic.js';
import { stampSvg } from '../../daily/ticket-art.js';
import { splitsCard } from './splits-card.js';
import { CV_LATEST, CV_REV } from './versions.js';

export const GAME_ID = 'jaywalk';
export const TRIES = 3;
const WANT = 'jaywalk-daily';
const lanesOf = l => `${l} ${l === 1 ? 'LANE' : 'LANES'}`;
const jwLanes = s => Math.floor(Math.max(0, Number(s) || 0) / 1e5);

/** the run's shell (one player, one try at a time — the try's own course comes from START) */
export const daily = {
  on: false,
  create: ({ date, uid, now, daySet } = {}) => ({ id: GAME_ID, mode: 'daily', matchId: `jwd${String((daySet && daySet.day) || date || '').replace(/\D/g, '')}`, day: (daySet && daySet.day) || date, phase: 'play', playAt: 0, startedAt: now, participants: { [uid]: true } }),
};

/** THE DAILY KIT's judge: start · finish · roomWins (THE ROOM WINS — the server ends the try as it stands) · pause = roomWins (the screens' word) */
export function createApiJudge() {
  // (J2 — COURSE RULES v2: START says the newest course version this phone knows — the SERVER picks the day's; an old phone says nothing)
  const j = createDailyJudge(GAME_ID, { moves: { roomWins: room => ({ room }) }, start: { cvs: CV_LATEST, cvr: CV_REV } });
  j.pause = room => j.roomWins(room);
  return j;
}

/** the try's end, the phone's half: `e` = the server's time (the rules: once, inside the try's window) — the chunks before it have landed */
// (refused only when there is nothing to end: the app hidden in the 3 · 2 · 1 (before go) or past the try's window — the server closes it all the same)
const writeEnd = path => { if (!path) return Promise.resolve(); expectRefusal(`${path}/e`, 'jaywalk daily: the try ended before GO / past its window'); return dbSet(dbRef(`${path}/e`), serverTimestamp()).catch(() => {}); };

export function createView() {
  const JW = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('jaywalk'));
  let host = null, ctx = null, inner = null, D = null, stage = null, card = null, gone = false, wanted = false, splits = null;
  let cur = null;       // the try in play: { i, left, path, ended }
  let offToday = null;

  /** a try in play on this phone (a start answered, its end not yet sent) */
  const playing = () => !!(cur && !cur.ended);
  /** END THE TRY (hidden · leaving · a refresh — J3: there is no STOP): the view's run stops, `e`, then FINISH with keepalive (the page is going) */
  function endTry() {
    if (!playing()) return null;
    cur.ended = true;
    if (D && D.stop) D.stop();
    const path = cur.path, day = cur.day;
    writeEnd(path);
    api('daily', { action: 'finish', game: GAME_ID, ...(day ? { day } : {}) }, { keepalive: true }).catch(() => {});
    return null;
  }
  const onVis = () => { if (document.visibilityState === 'hidden') endTry('away'); };
  const onHide = () => endTry('away');

  function mountTry() {
    if (gone) return;
    cur = null; card = null;
    stage = h('div.dy-jw-stage');
    host.replaceChildren(stage);
    D = {
      path: null,
      start: async () => {
        let r;
        try { r = await ctx.judge.start(); } catch (e) { showRefused(e); throw e; }
        const run = r && r.run;
        if (!run || !run.path) { showRefused({ code: 'no_tries', extra: r }); throw new Error('no run'); }
        D.path = run.path;
        cur = { i: Number(run.try) || 0, left: Number(run.left) || 0, path: run.path, day: r.day || null, ended: false };
        return { seed: run.seed, go: run.go, cv: run.cv === 2 ? 2 : 1 };
      },
      end: (over, line, sp) => endCard(over, line, sp),
    };
    inner = JW();
    inner.mount(stage, { uid: ctx.uid, code: '', game: ctx.game, players: ctx.players || {}, meta: { status: 'playing' }, live: {}, liveKey: null, presence: {}, jwDaily: D });
  }
  /** the END CARD over the resting scene: the server's lanes for THIS try, DAILY BEST / the gold, TRY AGAIN (n TRIES LEFT) · COME BACK LATER —
   *  or (the 3rd try) ADMITTED */
  function endCard(over, line, sp) {
    const big = h('div.dy-jw-big', '…');
    splits = splitsCard(sp);   // (J1 — YOUR SPLITS: at once from the phone's own engine; the server's answer marks the new bests)
    const note = h('div.dy-jw-note.dy-jw-end-rec', 'SCORING YOUR TRY');
    const foot = h('div.dy-jw-foot');
    const kick = h('div.dy-jw-kick', cur ? `JAYWALK · TRY ${cur.i + 1} OF ${TRIES}` : 'JAYWALK');
    card = h('div.jw-final.dy-jw-end', h('div.dy-jw-in', kick, over && line ? h('div.dy-jw-cause', line) : null, big, note, splits.el, foot));
    const ended = cur && !cur.ended ? (cur.ended = true, writeEnd(cur.path)) : Promise.resolve();
    ended.then(() => ctx.judge.finish()).then(r => fill(r, big, note, foot, kick)).catch(e => {
      note.textContent = e && e.code === 'not_done' ? 'TRY ENDED' : 'COULDN’T SCORE IT — CHECK YOUR SIGNAL';
      foot.replaceChildren(tubeButton('BACK TO THE DAILIES', { kind: 'main', block: true, attrs: { 'data-press': true }, onClick: () => ctx.onBack && ctx.onBack() }));
    });
    return card;
  }
  function fill(r, big, note, foot, kick) {
    if (gone) return;
    const tries = Array.isArray(r.tries) ? r.tries : [];
    const mine = r.try || [...tries].reverse().find(x => !x.open) || null;
    const lanes = mine ? Math.floor(Number(mine.l) || 0) : jwLanes(r.score);
    const left = Math.max(0, Number(r.left ?? (cur ? cur.left : 0)) || 0);
    if (mine && mine.i != null) kick.textContent = `JAYWALK · TRY ${Number(mine.i) + 1} OF ${TRIES}`;
    big.textContent = lanesOf(lanes);
    card.dataset.lanes = String(lanes); card.dataset.left = String(left);
    // (J1 — the SERVER's splits for this try (its replay — they win) + its best splits: the faster ones glow; the try still counts by lanes)
    if (splits) splits.server({ ...((r.credit && r.credit.sp) || {}), r: (mine && mine.sp) || (r.credit && r.credit.sp && r.credit.sp.r) || null });
    const gold = !!(r.newBest && r.best && r.best.day === r.day);
    const bestS = r.best && r.best.s != null ? r.best.s : r.score;
    const done = left === 0;
    const placeNow = () => { const t = todayNow(), pl = t && t.place && t.place[GAME_ID]; return pl && pl.p ? placeLine(pl.p, Math.max(pl.n || 0, pl.p)) : ''; };
    const setNote = () => {
      if (r.counted === false) { note.textContent = 'YOUR SCORE COUNTS FROM TOMORROW'; return; }
      note.className = `dy-jw-note dy-jw-end-rec${gold ? ' dy-gold' : ''}`;
      note.textContent = gold ? NEW_BEST : done ? placeNow() || `BEST OF ${TRIES} · ${lanesOf(jwLanes(r.score))}` : `DAILY BEST · ${lanesOf(jwLanes(bestS))}`;
    };
    setNote();
    if (offToday) offToday();
    offToday = done ? onToday(() => { if (!gone && note.isConnected) setNote(); }) : null;
    if (done) {
      // the 3rd try: ADMITTED — the best try is the day's result
      if (lanes !== jwLanes(r.score)) big.after(h('div.dy-jw-best', `YOUR BEST TODAY · ${lanesOf(jwLanes(r.score))}`));
      card.prepend(h('span.dy-stamp.dy-jw-stamp', { html: stampSvg(), role: 'img', 'aria-label': 'admitted — done for today' }));
      foot.replaceChildren(tubeButton('BACK TO THE DAILIES', { kind: 'main', block: true, attrs: { 'data-press': true }, onClick: () => ctx.onBack && ctx.onBack(true) }));
      return;
    }
    const again = tubeButton('TRY AGAIN', { kind: 'main', block: true, cls: 'dy-jw-again', attrs: { 'data-press': true }, onClick: () => tryAgain() });
    // (J3 — THREE TRIES ALL DAY: COME BACK LATER goes back to the dailies and marks NOTHING — the ticket keeps TRY AGAIN · n TRIES LEFT from the
    //  SERVER's tries all day, on any phone; the old DONE (`markTriesDone` — ADMITTED with tries unused) is retired for JAYWALK)
    const later = tubeButton('COME BACK LATER', { kind: 'secondary', block: true, cls: 'dy-jw-later', attrs: { 'data-press': true }, onClick: () => { if (ctx.onBack) ctx.onBack(false); } });
    foot.replaceChildren(again, h('div.dy-jw-left', `${left} ${left === 1 ? 'TRY' : 'TRIES'} LEFT`), later);
  }
  function tryAgain() {
    if (gone) return;
    globalThis.__nsAgainAt = performance.now();   // (view.js keeps its scene warm over the remount — INSTANT AGAIN's rule)
    try { if (inner) inner.unmount(); } catch { /* fine */ }
    inner = null;
    mountTry();
  }
  function showRefused(e) {
    const left0 = e && (e.code === 'no_tries' || (e.status === 409 && /tries/i.test(String(e.message || ''))));
    host.replaceChildren(h('div.jw-final.dy-jw-end', h('div.dy-jw-in', h('div.dy-jw-kick', 'JAYWALK'),
      h('div.dy-jw-note', left0 ? 'NO TRIES LEFT TODAY — THEY COME BACK AT 4 AM' : 'THE DAILY COULDN’T START — CHECK YOUR SIGNAL'),
      h('div.dy-jw-foot', tubeButton('BACK TO THE DAILIES', { kind: 'main', block: true, attrs: { 'data-press': true }, onClick: () => ctx.onBack && ctx.onBack() })))));
  }

  return {
    mount(el, state) {
      host = h('div.dy-jw'); el.append(host); ctx = state;
      want(WANT); wanted = true;   // (THE PARKED DATABASE: the chunks need the socket while the run is open)
      document.addEventListener('visibilitychange', onVis);
      addEventListener('pagehide', onHide);
      mountTry();
    },
    update() {},
    /** a try in play (THE ROOM WINS reads it: the banner + the server's end) · the tries left after it */
    playing,
    left: () => (cur ? cur.left : TRIES),
    /** THE ROOM WINS (js/screens/daily.js — its roomWins call tells the server): the try stops here at once, nothing more sent */
    roomWon() { if (playing()) { cur.ended = true; if (D && D.stop) D.stop(); } },
    unmount() {
      gone = true;
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('pagehide', onHide);
      // (leaving mid-try ENDS it — THE ROOM WINS already told the server itself)
      endTry('away');
      if (offToday) offToday();
      try { if (inner) inner.unmount(); } catch { /* fine */ }
      inner = null;
      if (host) host.remove();
      if (wanted) { release(WANT); wanted = false; }
    },
  };
}
export const tryEnded = tryEndedLine;
