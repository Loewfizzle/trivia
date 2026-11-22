// HIGH RISE's DAILY — THE PHONE HALF (HIGH RISE DAILY A — docs/highrise.md "THE DAILY"; the server half: api/_lib/highrise-daily.js). A DAILY
// RUN module for js/screens/daily.js#openRun (DAILY_RUNS — never the room cartridge: nothing here is in HIGH RISE's preload graph / its budget):
//   daily.create(…) → the run's shell · createApiJudge() → THE DAILY KIT's judge (+ pause = THE ROOM WINS) · createView() → the run's screen
// THE RUN = the REAL HIGH RISE stage (stage.js — the night / day look, its sounds, its HUD) in mode 'daily' (THE MOTHERSHIP at floor 200):
// START → the day's seed + the leg's GO + its tick T + the log the SERVER has (a resume: replayed at once, unheard) → the 3 · 2 · 1 → the slab
// enters at T. Every tap goes up AT ONCE as its own server-stamped chunk on the leg's node (THE UNDO GUARD: a hold resumes from the last tap
// the SERVER has — the 3-holds cap is what bounds a tap lost on the way). ONE SHOT — no TRY AGAIN.
// THE HELD RUN: hidden / refreshed / killed with a hold left = the run HELD (the clock stops; nothing ends) → back on screen: the queued chunk
// a moment to land, then START again = a hold (the slab that was swinging enters again at its entry after a 3 · 2 · 1). No hold left: a hide
// ENDS the run (`e`, FINISH with keepalive). Leaving with the back button = a hold (the ticket says RESUME). THE ROOM WINS = a FREE hold.
// The end card (minimal — DAILY B styles it): the SERVER's floors, the place line, DAILY BEST, BACK TO THE DAILIES.
import { h } from '../../ui/dom.js';
import { tubeButton } from '../../ui/components.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { loadSheet } from '../lazy-view.js';
import { dbRef, set as dbSet, serverTimestamp, serverNow, want, release, expectRefusal } from '../../firebase.js';
import { api } from '../../profile/api.js';
import { createDailyJudge } from '../../daily/judge.js';
import { todayNow, onToday } from '../../daily/today.js';
import { placeLine, NEW_BEST } from '../../daily/today-logic.js';
import { createProofWriter } from '../kit/proof-writer.js';
import { CLOCK } from './proof.js';
import { TICK_HZ } from './tuning.js';
import { HOLDS, hrFloors, hrPerfects } from './held.js';

export const GAME_ID = 'highrise';
const WANT = 'highrise-daily';
/** the stage's own sheets (the cartridge's: index.js — the kit's + the stage's, never a page) */
const SHEETS = ['kit', 'highrise-play'];
/** back on screen: the last chunk a moment to land before the hold's START (the server closes the leg — a later one is refused) */
export const LAND_WAIT_MS = 1500;
const TEST = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]emu(?:&|=|$)/.test(location.search || '');
const floorsOf = f => `${f} ${f === 1 ? 'FLOOR' : 'FLOORS'}`;
const holdsLine = n => (n <= 0 ? 'NO HOLDS LEFT — HIDING THE APP ENDS THE RUN' : `${n} ${n === 1 ? 'HOLD' : 'HOLDS'} LEFT`);

/** the run's shell (one player, ONE SHOT — the run's own course comes from START) */
export const daily = {
  on: false,
  create: ({ date, uid, now, daySet } = {}) => ({ id: GAME_ID, mode: 'daily', matchId: `hrd${String((daySet && daySet.day) || date || '').replace(/\D/g, '')}`, day: (daySet && daySet.day) || date, phase: 'play', playAt: 0, startedAt: now, participants: { [uid]: true } }),
};

/** THE DAILY KIT's judge: start · finish · pause (THE ROOM WINS — a FREE hold on the server: the room checked there) */
export function createApiJudge() {
  return createDailyJudge(GAME_ID, { moves: { pause: room => ({ room }) } });
}

export function createView() {
  let host = null, ctx = null, S = null, gone = false, wanted = false, offToday = null;
  let leg = null;        // the leg in play: { path, T, base (the log's taps before it), go, left, day }
  let state = 'idle';    // 'idle' (the welcome) · 'starting' · 'count' (the 3 · 2 · 1) · 'live' · 'held' · 'ending' · 'done'
  let W = null, lastChunk = Promise.resolve(), countEl = null, countRaf = 0, card = null, holdEl = null, resuming = false;
  let roomHeld = false;  // (THE ROOM WINS held the run: unmount never ends it — the free hold is the server's)
  const perfOf = srv => performance.now() - (serverNow() - srv);
  const playing = () => state === 'live' || state === 'count' || state === 'held' || state === 'starting';

  // ---- THE CHUNKS: every tap at once (pipe — one connection keeps them in order), its LOCAL tick (the leg's tick 0 = T)
  function newWriter() {
    const taps = () => (S ? S.taps() : []);
    return createProofWriter({
      count: () => Math.max(0, taps().length - leg.base),
      pack: (a, b) => { const t = taps(); let s = '', p = a > 0 ? t[leg.base + a - 1] - leg.T : 0; for (let i = a; i < b; i++) { const v = t[leg.base + i] - leg.T; s += (i > a ? '.' : '') + (v - p).toString(36); p = v; } return s; },
      entriesOf: () => -1, chunkMax: CLOCK.chunkMax, chunks: 1000, flushMs: () => 0, pipe: true,
      io: {
        now: () => performance.now(), timer: (fn, ms) => setTimeout(fn, ms),
        chunk: (i, s) => { const path = leg.path; expectRefusal(`${path}/c`, 'highrise daily: a chunk after the leg closed (a hold / the end)', 30_000, 'late-proof'); return (lastChunk = dbSet(dbRef(`${path}/c/${i}`), { s, at: serverTimestamp() })); },
        end: () => { const path = leg.path; expectRefusal(`${path}/e`, 'highrise daily: the leg already closed (a hold / the server\'s end)', 30_000, 'late-proof'); return dbSet(dbRef(`${path}/e`), serverTimestamp()); },
        read: () => Promise.reject(new Error('never read — the node is server-only')),
      },
    });
  }

  // ---- THE 3 · 2 · 1 (the leg's GO — not run time)
  function count(go) {
    if (!countEl) { countEl = h('div.dy-hr-count', { 'aria-live': 'polite', style: { position: 'absolute', inset: '0', display: 'grid', placeItems: 'start center', paddingTop: '22vh', pointerEvents: 'none', zIndex: '5', font: '900 min(30vw, 160px)/1 var(--font-num)', color: '#fff', textShadow: '0 0 24px #ff4fd8' } }); host.append(countEl); }
    cancelAnimationFrame(countRaf);
    let shown = '';
    const step = () => {
      if (gone) return;
      const left = go - serverNow();
      const txt = left > 0 ? String(Math.min(3, Math.ceil(left / 1000))) : left > -600 ? 'GO' : '';
      if (txt !== shown) { shown = txt; countEl.textContent = txt; }
      if (left <= 0 && state === 'count') state = 'live';
      if (txt) countRaf = requestAnimationFrame(step); else countEl.textContent = '';
    };
    step();
  }
  function holdNote(text) {
    if (!holdEl) { holdEl = h('div.dy-hr-hold', { style: { position: 'absolute', left: '16px', right: '16px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)', textAlign: 'center', pointerEvents: 'none', zIndex: '5', font: '700 16px/1.3 var(--font-ui)', letterSpacing: '0.14em', color: '#fff', textShadow: '0 0 4px #000, 0 0 12px #000, 0 1px 2px #000' } }); host.append(holdEl); }
    holdEl.textContent = text || '';
  }

  // ---- START (the stage's GO): a fresh run, a RESUME (a hold), or the run already over (the end card — never an unproven run)
  async function go() {
    state = 'starting';
    let r;
    try { r = await ctx.judge.start(); } catch (e) { state = 'idle'; showFail(e); return new Promise(() => {}); }
    if (gone) return new Promise(() => {});
    if (!r.run) { state = 'done'; endCard(r.fin || { score: r.done, day: r.day }, r.ended); return new Promise(() => {}); }
    const run = r.run, base = (run.ev || []).filter(x => typeof x === 'number').length;
    leg = { path: run.path, T: run.t, base, go: run.go, left: Number(run.left) || 0, day: r.day };
    W = newWriter();
    state = 'count';
    count(run.go);
    holdNote(run.held ? `HELD · ${holdsLine(leg.left)}` : `ONE SHOT · ${holdsLine(leg.left)}`);
    setTimeout(() => { if (!gone && holdEl && state !== 'held') holdNote(''); }, 4500);
    // (tick 0 of the PLAY clock on this page: the leg's GO is its tick T)
    // (the log so far = the server's — a resume's own HOLD put at its end: the same log the judge will replay)
    const events = [...(run.ev || []), ...(run.leg > 0 ? [run.room ? { k: 'hold', t: run.t, r: 1 } : { k: 'hold', t: run.t }] : [])];
    // (the answer landed while the page is hidden: the run is held the moment the stage has adopted it — never live unseen)
    if (document.visibilityState === 'hidden') setTimeout(() => away('hidden'), 0);
    return { mode: 'daily', seed: run.seed, t0: perfOf(run.go - T2ms(run.t)), events };
  }
  const T2ms = t => (t * 1000) / TICK_HZ;

  // ---- THE HELD RUN
  /** hidden / leaving: a hold left → HELD (the clock stops; the chunks so far go up now) · none → the run ENDS here */
  function away(why) {
    if (!S || (state !== 'live' && state !== 'count')) return;
    if (W) W.flush(true);
    if (leg && leg.left > 0) { state = 'held'; S.hold(true); cancelAnimationFrame(countRaf); if (countEl) countEl.textContent = ''; return; }
    endRun(why);
  }
  /** back on screen: the last chunk a moment to land, then START again (a hold — the server picks the slab's entry from what it has) */
  function back() {
    if (state !== 'held' || resuming || gone) return;
    resuming = true;
    holdNote('BACK IN 3 …');
    Promise.race([lastChunk.catch(() => {}), new Promise(res => setTimeout(res, LAND_WAIT_MS))])
      .then(() => go()).then(G => { resuming = false; if (G && !gone && S) S.adopt(G); })
      .catch(() => { resuming = false; });
  }
  /** THE END on this phone: `e` behind the last chunk, then FINISH (keepalive — the page may be going) → the end card */
  function endRun() {
    if (state === 'ending' || state === 'done') return;
    state = 'ending';
    if (S) S.hold(true);
    if (W) W.end({});
    const day = leg && leg.day;
    const fin = api('daily', { action: 'finish', game: GAME_ID, ...(day ? { day } : {}) }, { keepalive: true });
    fin.then(r => { if (!gone && document.visibilityState !== 'hidden') endCard(r); else finAfter = r; }, () => { finAfter = null; });
  }
  let finAfter = null;
  const onVis = () => { if (document.visibilityState === 'hidden') away('hidden'); else if (state === 'held') back(); else if (state === 'ending' && finAfter) endCard(finAfter); };
  const onHide = () => away('pagehide');

  // ---- the stage's own moments
  function over() { if (W) W.flush(true); }
  function ended() {
    // (the stage's end moment — the out / THE MOTHERSHIP / TIME'S UP: `e` behind the last chunk, then FINISH → the SERVER's floors)
    if (state === 'done') return {};
    state = 'ending';
    if (W) W.end({});
    card = cardShell('SCORING YOUR RUN');
    const p = W ? Promise.race([lastChunk.catch(() => {}), new Promise(res => setTimeout(res, LAND_WAIT_MS))]) : Promise.resolve();
    p.then(() => ctx.judge.finish()).then(r => endCard(r), e => { if (card) { card.note.textContent = e && e.code === 'not_done' ? 'RUN ENDED' : 'COULDN’T SCORE IT — CHECK YOUR SIGNAL'; } });
    return {};   // (the stage's own card stays down: this is the daily's)
  }

  // ---- THE END CARD (the SERVER's floors) — minimal: DAILY B styles it
  function cardShell(noteText) {
    if (card && card.el.isConnected) { card.note.textContent = noteText; return card; }
    const big = h('div.dy-jw-big.dy-hr-big', '…'), note = h('div.dy-jw-note.dy-jw-end-rec', noteText), foot = h('div.dy-jw-foot');
    const kick = h('div.dy-jw-kick', 'HIGH RISE · DAILY');
    const el = h('div.jw-final.dy-jw-end.dy-hr-end', { style: { position: 'absolute', inset: '0', zIndex: '6' } }, h('div.dy-jw-in', kick, big, note, foot));
    host.append(el);
    return (card = { el, big, note, foot, kick });
  }
  function endCard(r, why) {
    if (gone) return;
    state = 'done';
    if (S) S.hold(true);
    cancelAnimationFrame(countRaf); if (countEl) countEl.textContent = ''; holdNote('');
    const C = cardShell('');
    const score = r && r.score != null ? r.score : null, f = score != null ? hrFloors(score) : 0;
    C.big.textContent = floorsOf(f);
    C.el.dataset.floors = String(f); C.el.dataset.perfects = String(score != null ? hrPerfects(score) : 0); if (why) C.el.dataset.ended = why;
    const gold = !!(r && r.newBest && r.best && r.best.day === r.day);
    const placeNow = () => { const t = todayNow(), pl = t && t.place && t.place[GAME_ID]; return pl && pl.p ? placeLine(pl.p, Math.max(pl.n || 0, pl.p)) : ''; };
    const bestS = r && r.best && r.best.s != null ? r.best.s : score;
    const setNote = () => {
      if (r && r.counted === false) { C.note.textContent = 'YOUR SCORE COUNTS FROM TOMORROW'; return; }
      C.note.className = `dy-jw-note dy-jw-end-rec${gold ? ' dy-gold' : ''}`;
      C.note.textContent = gold ? NEW_BEST : placeNow() || (bestS != null ? `DAILY BEST · ${floorsOf(hrFloors(bestS))}` : '');
    };
    setNote();
    if (offToday) offToday();
    offToday = onToday(() => { if (!gone && C.note.isConnected) setNote(); });
    C.foot.replaceChildren(tubeButton('BACK TO THE DAILIES', { kind: 'main', block: true, attrs: { 'data-press': true }, onClick: () => ctx.onBack && ctx.onBack(true) }));
  }
  function showFail(e) {
    const C = cardShell(e && e.code === 'busy' ? 'ONE MOMENT — TRY AGAIN' : 'THE DAILY COULDN’T START — CHECK YOUR SIGNAL');
    C.big.textContent = '';
    C.foot.replaceChildren(tubeButton('BACK TO THE DAILIES', { kind: 'main', block: true, attrs: { 'data-press': true }, onClick: () => ctx.onBack && ctx.onBack() }));
  }

  return {
    mount(el, st) {
      host = h('div.dy-hr', { style: { position: 'relative', width: '100%', height: '100%' } }); el.append(host); ctx = st;
      want(WANT); wanted = true;   // (THE PARKED DATABASE: the chunks need the socket while the run is open)
      document.addEventListener('visibilitychange', onVis);
      addEventListener('pagehide', onHide);
      // (the stage is a phone-shaped column — .hi-stage's own width; centred on a wide screen: THE DESKTOP COMES FREE)
      const stageEl = h('div.dy-hr-stage', { style: { position: 'absolute', inset: '0', display: 'flex', justifyContent: 'center' } });
      host.append(stageEl);
      Promise.all([lazyImport(import('./stage.js'), './stage.js'), ...SHEETS.map(loadSheet)]).then(([M]) => {
        if (gone) return;
        const lookNow = () => (document.body && document.body.dataset.look === 'day' ? 'day' : 'night');
        S = M.createStage(stageEl, {
          hook: TEST ? '__hiDaily' : '', lookNow, best: { read: () => 0, write() {}, runs: false },
          go, onFrame: () => { if (W && state === 'live') W.flush(false); }, onOver: over, onEnd: ended,
        });
        if (TEST) window.__hiDailyRun = { state: () => state, leg: () => (leg ? { ...leg } : null), stage: () => S };
        if (todayNow() && todayNow().started && todayNow().started[GAME_ID]) holdNote('YOUR RUN IS HELD — TAP TO GO ON');
      }).catch(e => { console.warn('[highrise daily]', e); showFail(e); });
    },
    update() {},
    /** a run in play on this phone (THE ROOM WINS reads it: the banner + the free hold) */
    playing,
    left: () => (leg ? leg.left : HOLDS),
    /** THE ROOM WINS (js/screens/daily.js — its pause call tells the server: a FREE hold): the run is held here at once */
    roomWon() { if (state === 'live' || state === 'count') { if (W) W.flush(true); state = 'held'; if (S) S.hold(true); roomHeld = true; } },
    unmount() {
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('pagehide', onHide);
      // (leaving mid-run: with a hold left (or THE ROOM WINS' free one) the run is HELD — the ticket says RESUME; none left → it ENDS here)
      if (!roomHeld && (state === 'live' || state === 'count')) { if (leg && leg.left > 0) { if (W) W.flush(true); } else endRun('leave'); }
      gone = true;
      cancelAnimationFrame(countRaf);
      if (offToday) offToday();
      try { if (S) S.destroy ? S.destroy() : S.stop(); } catch { /* fine */ }
      S = null;
      if (host) host.remove();
      if (wanted) { release(WANT); wanted = false; }
    },
  };
}
