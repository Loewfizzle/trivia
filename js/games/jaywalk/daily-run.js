// JAYWALK's DAILY — THE PHONE HALF (DAILY B — docs/jaywalk.md "THE DAILY"; the server half: api/_lib/jaywalk-daily.js). A DAILY RUN module for
// js/screens/daily.js#openRun (a `tries` row loads THIS, never the room cartridge — so nothing here is in JAYWALK's preload graph / its budget):
//   daily.create(…) → the run's shell · createApiJudge() → THE DAILY KIT's judge (+ roomWins) · createView() → the run's screen
// THE RUN = the REAL JAYWALK view (view.js — both looks, its sounds, its lines) in MODES.daily through ONE adapter (`state.jwDaily`): START →
// the day's seed + the SERVER's go (tick 0 = go — the 3 · 2 · 1 is the lead) + the proof node's path (dly/jaywalk/{day}/w/{uid}/{try}); the
// view appends its hops there as server-stamped chunks (THE DROPPED SIGNAL as every run); the end (out · THE MOTHERSHIP at 5:00 · STOP) →
// this module writes `e` (awaited: the chunks before it have landed — one connection, in order) → FINISH → the SERVER's lanes on the end card,
// never the phone's own count. NO PAUSE, NO RESUME: STOP, hiding the app, a refresh, leaving or THE ROOM WINS end the try (scored as it stands
// — FINISH sent with keepalive on the way out; the server also closes a quiet try by itself). Between tries: TRY AGAIN (n TRIES LEFT) · DONE.
import { h } from '../../ui/dom.js';
import { tubeButton } from '../../ui/components.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { dbRef, set as dbSet, serverTimestamp, want, release, expectRefusal } from '../../firebase.js';
import { api } from '../../profile/api.js';
import { createDailyJudge } from '../../daily/judge.js';
import { todayNow, onToday, markTriesDone } from '../../daily/today.js';
import { placeLine, tryEndedLine, NEW_BEST } from '../../daily/today-logic.js';
import { stampSvg } from '../../daily/ticket-art.js';

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
  const j = createDailyJudge(GAME_ID, { moves: { roomWins: room => ({ room }) } });
  j.pause = room => j.roomWins(room);
  return j;
}

/** the try's end, the phone's half: `e` = the server's time (the rules: once, inside the try's window) — the chunks before it have landed */
// (refused only when there is nothing to end: a STOP in the 3 · 2 · 1 (before go) or past the try's window — the server closes it all the same)
const writeEnd = path => { if (!path) return Promise.resolve(); expectRefusal(`${path}/e`, 'jaywalk daily: the try ended before GO / past its window'); return dbSet(dbRef(`${path}/e`), serverTimestamp()).catch(() => {}); };

export function createView() {
  const JW = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('jaywalk'));
  let host = null, ctx = null, inner = null, D = null, stage = null, stopBtn = null, card = null, gone = false, wanted = false;
  let cur = null;       // the try in play: { i, left, path, ended }
  let offToday = null;

  /** a try in play on this phone (a start answered, its end not yet sent) */
  const playing = () => !!(cur && !cur.ended);
  /** END THE TRY (STOP · hidden · leaving · a refresh): the view's run stops, `e`, then FINISH (keepalive when the page is going) */
  function endTry(how) {
    if (!playing()) return null;
    cur.ended = true;
    if (D && D.stop) D.stop();
    if (stopBtn) { stopBtn.remove(); stopBtn = null; }
    const path = cur.path, day = cur.day;
    if (how === 'away') {
      writeEnd(path);
      api('daily', { action: 'finish', game: GAME_ID, ...(day ? { day } : {}) }, { keepalive: true }).catch(() => {});
      return null;
    }
    return writeEnd(path);
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
        addStop();
        return { seed: run.seed, go: run.go };
      },
      end: (over, line) => endCard(over, line),
    };
    inner = JW();
    inner.mount(stage, { uid: ctx.uid, code: '', game: ctx.game, players: ctx.players || {}, meta: { status: 'playing' }, live: {}, liveKey: null, presence: {}, jwDaily: D });
  }
  /** STOP — ends the try early (it counts as played): a second tap within 2.5 s (THE CONFIRM — never a mis-tap that costs a try) */
  function addStop() {
    if (stopBtn || gone) return;
    stopBtn = tubeButton('STOP', { kind: 'secondary', size: 'sm', cls: 'dy-jw-stop', confirm: 'TAP AGAIN TO STOP', onClick: () => { const p = endTry('stop'); if (p) p.then(() => {}); } });
    host.append(stopBtn);
  }

  /** the END CARD over the resting scene: the server's lanes for THIS try, DAILY BEST / the gold, TRY AGAIN (n TRIES LEFT) · DONE — or ADMITTED */
  function endCard(over, line) {
    if (stopBtn) { stopBtn.remove(); stopBtn = null; }
    const big = h('div.dy-jw-big', '…');
    const note = h('div.dy-jw-note.dy-jw-end-rec', 'SCORING YOUR TRY');
    const foot = h('div.dy-jw-foot');
    const kick = h('div.dy-jw-kick', cur ? `JAYWALK · TRY ${cur.i + 1} OF ${TRIES}` : 'JAYWALK');
    card = h('div.jw-final.dy-jw-end', h('div.dy-jw-in', kick, over && line ? h('div.dy-jw-cause', line) : null, big, note, foot));
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
    const dn = tubeButton('DONE', { kind: 'secondary', block: true, cls: 'dy-jw-done', attrs: { 'data-press': true }, onClick: () => { markTriesDone(GAME_ID, r.day); if (ctx.onBack) ctx.onBack(true); } });
    foot.replaceChildren(again, h('div.dy-jw-left', `${left} ${left === 1 ? 'TRY' : 'TRIES'} LEFT`), dn);
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
