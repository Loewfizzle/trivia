// THE DROP — THE RUN on the phone (THE DROP A — docs/prism.md "THE DROP"). PRISM DROP's REAL view (js/games/prism/view.js) mounted in its
// DROP mode: the board, the look (both), the sound + the gestures are PRISM's; this file is the DRIVER the view asks each frame:
//   · THE CLOCK: the run's tick = (the server's now − go − the pauses) / TICK — `go` + the pauses from the server's answers, the phone's offset
//     to the server's clock from each answer's `now` (no database socket — THE PARKED DATABASE); the run is stepped to it (drop.js#stepTo)
//   · THE RECORDER: every input the view hands over goes through drop.js#input (the log keeps the ones that did something)
//   · CHECKPOINTS: the log's new chunk every CK_MS (30 s of play) + a pause + the page hiding / pagehide (batched — ≲ 30 calls a run); a lost
//     answer → resync from the server's length
//   · PAUSE (3 a run): the board HIDDEN, the clock stopped by the server; a REFRESH resumes at the latest checkpoint — one pause used (one line)
//   · THE DROP B — HIDING THE PAGE (a call, the lock, an app switch) = an AUTOMATIC PLAYER PAUSE (one of the 3, server-timed, sent with keepalive);
//     back on the page the board stays hidden behind RESUME (PAUSED · 2 LEFT). No pause left → the run keeps its clock: back within SLOW_TOL_MS
//     it catches up; later → it ends at the hide's checkpoint + MAX_TAIL_MS of play (the phone says `aw`, the server checks it on its own clock)
//   · THE ROOM WINS: the daily screen's pause (judge.pause(room)) carries the freshest chunk (judge.bind)
//   · THE END: the top-out (or THE END at 8:00) → the final upload → judge.finish() → the score's line
// Plain + functional (THE DROP B brings the ticket, the share, the polish).
import { h } from '../../ui/dom.js';
import { tubeButton } from '../../ui/components.js';
import { createView as createPrismView } from '../prism/view.js';
import { createDropRun, input, stepTo, replay, TICK, COUNT_MS, dropLine, scoreOf, ticksOf } from '../prism/drop.js';
import { CK_MS, SLOW_TOL_MS, MAX_TAIL_MS } from '../prism/drop-judge.js';
import { dropKey } from '../prism/bot.js';
import { rngFrom, hashString } from '../../core/rng.js';
import { installTestHook, removeTestHook } from '../kit/hook.js';
import { loadManifest } from '../prism/songs.js';
import { dealSongs, setForLook } from '../prism/logic.js';
/** the songs a run deals (≈ 3 min each: 8 minutes of play + the pauses' 20 minutes never run out) */
export const DROP_SONGS = 10;
/** the one-time hint stays this long into the run at most (the first move takes it sooner) */
export const HINT_MS = 6000;

export function createView() {
  let inner = null, drv = null, host = null, gone = false;
  return {
    mount(el, state) {
      host = h('div.dr-host');
      el.append(host);
      begin(state).catch(e => { console.warn('[drop]', e); if (!gone) host.replaceChildren(h('p.dy-quiet.dy-fail', 'THE DROP couldn’t start. Check your signal and try again.')); });
    },
    update() { /* the run is driven by the server's answers + its own clock — the console's state changes nothing here */ },
    unmount() { gone = true; if (drv) drv.stop(); if (inner) inner.unmount(); inner = null; if (host) host.remove(); },
  };

  async function begin(state) {
    const judge = state.judge;
    if (!judge) throw new Error('no judge');
    const r = await judge.start();
    if (gone) return;
    if (r.done != null) { host.replaceChildren(doneCard(r.done)); return; }
    drv = createDriver({ judge, start: r, uid: state.uid, hint: state.hint || null, onHint: state.onHint || null });
    // THE DROP B — PRISM DROP's OWN SONGS: the DAY or the NIGHT set by this phone's look (a solo daily — the phone's own look decides), dealt from
    // the day (everyone's run hears the same order), on the view's synced player (the quick start, the heard-beat clock, the night gains) from
    // the 3-2-1; enough songs for 8 minutes + the pauses (the playlist runs on the wall clock). No manifest = a silent run, never a stuck one.
    const manifest = await loadManifest().catch(() => []);
    if (gone) return;
    const deal = dealSongs({ manifest, set: setForLook(document.body.dataset.look === 'day' ? 'day' : 'night'), roomSeed: `drop:${r.day}`, pos: 0, count: DROP_SONGS });
    const game = {
      id: 'prism', matchId: `drop-${r.day}`, phase: 'play', settings: { mode: 'survival' }, seed: r.run.seed, songs: deal.songs, sd: deal.sd, set: deal.set, cu: deal.cu, ff: deal.ff,
      participants: { [state.uid]: true }, playStartAt: drv.goLocal(), songStartAt: drv.goLocal() - COUNT_MS, pp: hashString(`${r.run.seed}:paper`) % 4, drop: true,
    };
    inner = createPrismView();
    inner.mount(host, { ...state, game, drop: drv, live: {}, liveKey: null, players: state.players || {}, presence: {} });
  }
}

const doneCard = score => h('div.dr-done', h('b', 'TODAY’S DROP IS DONE'), h('span', dropLine(score)));

/** the run's driver — what PRISM's view asks each frame (+ the pause control, the end) */
export function createDriver({ judge, start, uid, hint = null, onHint = null }) {
  const R0 = start.run;
  let off = (Number(start.now) || Date.now()) - Date.now();                     // the server's clock − this phone's
  const clock = () => Date.now() + off;
  let run;
  if (R0.log && R0.k) {
    const R = replay(R0.log, R0.seed, { to: R0.k });
    run = R.ok ? R.run : createDropRun(R0.seed);
    run.log = R.ok ? R0.log : '';
  } else run = createDropRun(R0.seed);
  let go = R0.go, pm = R0.pm || 0, pausedAt = R0.pa != null ? R0.pa : null, kind = R0.kd || null, left = R0.left ?? 3;
  let sent = R0.len || 0, flying = false, lastCk = 0, ended = !!R0.e, finished = false, result = null, refused = null;
  // (THE DROP B: away = the open pause is a HIDE's; pzOk = the server has confirmed it; hid = a hide with no pause left { at, k }; holding = the
  //  away end's upload in flight — the run stands still until the server answers)
  let away = false, pzOk = false, hid = null, holding = false;
  const hiddenNow = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
  // (a reload: the server's resume cost one pause (`refresh`) — or THE DROP B: the reload's own pagehide already paused it (one of the 3) and the
  //  start resumed into that pause; either way the run is back at its latest checkpoint, one pause used — the same one line)
  const refresh = !!R0.refresh || (R0.pa != null && R0.kd === 'p' && !R0.fresh);
  let els = {}, bot = null, botNext = 0, botPlan = null;
  const D = {
    run,
    goLocal: () => go - off,
    paused: () => pausedAt != null,
    left: () => left,
    /** the freshest chunk (a pause carries it — THE ROOM WINS' too) */
    chunk() { if (!holding && !hiddenNow() && pausedAt == null) stepTo(run, target()); return chunkNow(); },
    input(code) { if (pausedAt != null || ended) return 'noop'; const r = input(run, code); if (r === 'ok') hintGo(); return r; },
    frame,
    attach,
    stop,
    state: () => ({ k: run.k, t: run.k * TICK, lines: run.eng.lines, over: run.over, sent, len: run.log.length, paused: pausedAt != null, kind, left, ended, finished, result, refused, refresh, away, pzOk, holding }),
  };
  judge.bind && judge.bind(D);
  function target() { return Math.floor((clock() - go - pm) / TICK); }
  const chunkNow = () => ({ at: sent, add: run.log.slice(sent), k: run.k, ...(run.over ? { fin: 1 } : {}) });
  const took = r => { if (r && Number.isFinite(Number(r.now))) off = Number(r.now) - Date.now(); if (r && r.pm != null) pm = r.pm; if (r && r.go) go = r.go; if (r && r.left != null) left = r.left; };

  function frame() {
    if (ended || pausedAt != null || holding || hiddenNow()) return;   // (hidden: no frames on a phone anyway — the return decides)
    stepTo(run, target());
    if (bot && !run.over) runBot();
    if (els.hint && run.k * TICK >= HINT_MS) hintGo();
    if (run.over) { ended = true; finish(); return; }
    if (!flying && clock() - lastCk >= CK_MS) send();
  }
  async function send(action = 'checkpoint', ka = false, body0 = null) {
    if (flying && !ka) return null;
    flying = true;
    const b = body0 || D.chunk(), body = ka ? { ...b, $ka: 1 } : b;
    try {
      const r = await judge[action](body);
      took(r);
      if (r.resync) sent = r.len; else sent = body.at + body.add.length;
      lastCk = clock();
      if (r.e && !ended) { ended = true; finish(); }
      return r;
    } catch (e) {
      if (e && e.status === 422) refused = e.code || 'refused';
      if (e && e.code === 'paused') { pausedAt = clock(); paint(); }
      lastCk = clock();
      throw e;
    } finally { flying = false; }
  }
  async function finish() {
    paint();
    for (let i = 0; i < 6 && !finished; i++) {
      try {
        while (flying) await new Promise(r => setTimeout(r, 100));
        if (sent < run.log.length || run.over) { const b = D.chunk(); const r = await judge.checkpoint(b).catch(e => (e && e.code === 'finished' ? { e: 1 } : Promise.reject(e))); if (r && !r.resync) sent = b.at + b.add.length; else if (r && r.resync) { sent = r.len; continue; } }
        result = await judge.finish();
        finished = true;
      } catch (e) {
        if (e && e.status === 422) { refused = e.code || 'refused'; break; }
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    paint();
  }
  async function pause() {
    if (pausedAt != null || ended || left <= 0) return;
    stepTo(run, target());
    const body = chunkNow();
    pausedAt = clock(); kind = 'p'; away = false; left = Math.max(0, left - 1);   // (frozen at the tap; the server's stamp + count land a beat later)
    paint();
    try { const r = await send('ppause', false, body); if (r && r.pa == null) { pausedAt = null; kind = null; } else pzOk = true; paint(); }   // (the server's answer: its count of pauses left)
    catch (e) { if (e && e.code === 'paused') pzOk = true; else { pausedAt = null; kind = null; left += 1; paint(); } }
  }
  /** THE DROP B — the page hid with a pause left: an automatic PLAYER pause (keepalive — it lands though the page is going) */
  async function hidePause() {
    const at = clock(), body = chunkNow();
    pausedAt = at; kind = 'p'; away = true; pzOk = false; left = Math.max(0, left - 1);
    paint();
    try {
      const r = await send('ppause', true, body);
      if (r && r.pa != null) pzOk = true;
      else if (r && !r.e) { pausedAt = null; kind = null; away = false; hid = { at, k: run.k }; if (!hiddenNow()) back(); }   // (no pause granted — a no-pause hide)
      paint();
    } catch (e) {
      if (e && e.code === 'paused') pzOk = true;
      else if (e && e.code === 'pause_limit') { pausedAt = null; kind = null; away = false; left = 0; hid = { at, k: run.k }; paint(); if (!hiddenNow()) back(); }
      /* else unconfirmed — the return asks again */
    }
  }
  /** THE DROP B — back on the page */
  function back() {
    if (ended) return;
    if (pausedAt != null && away && !pzOk) {
      // (the hide's pause never got its answer — asked again; already paused = a free repeat; no pause granted → a no-pause hide from then)
      const at = pausedAt;
      send('ppause', false, chunkNow()).then(r => { if (r && r.pa != null) pzOk = true; else if (r && !r.e) { pausedAt = null; kind = null; away = false; hid = { at, k: run.k }; back(); } paint(); }).catch(e => { if (e && e.code === 'paused') pzOk = true; else if (e && e.code === 'pause_limit') { pausedAt = null; kind = null; away = false; left = 0; hid = { at, k: run.k }; paint(); back(); } });
      return;
    }
    if (!hid) return;
    const gap = clock() - hid.at, k0 = hid.k;
    hid = null;
    if (gap <= SLOW_TOL_MS) return;                                              // (a short hide: the run catches up on the next frame)
    // away past the bound with no pause left: the run ends at the hide's checkpoint + MAX_TAIL_MS of play (the server checks the gap)
    holding = true;
    stepTo(run, Math.min(target(), k0 + ticksOf(MAX_TAIL_MS)));
    paint();
    send('checkpoint', false, { ...chunkNow(), aw: 1 }).then(() => { holding = false; paint(); }).catch(() => { holding = false; paint(); });
  }
  async function resume() {
    try { const r = await judge.resume(); took(r); pausedAt = null; kind = null; away = false; paint(); if (r.e) { ended = true; finish(); } } catch (e) { console.warn('[drop] resume', e); }
  }
  // THE ADD-ON (the cost check) + THE DROP B: the page hiding / the phone locking / leaving = an AUTOMATIC PLAYER PAUSE while one is left (it
  // carries the run's freshest chunk — a refresh resumes there); none left = a checkpoint, the clock running
  function gone() {
    if (ended || pausedAt != null || hid || holding) return;
    stepTo(run, target());                                                       // (the run up to the moment the page went)
    if (run.over) return;
    if (left > 0) hidePause();
    else { hid = { at: clock(), k: run.k }; send('checkpoint', true, chunkNow()).catch(() => {}); }
  }
  function onVis() { if (document.visibilityState === 'hidden') gone(); else back(); }
  const onHide = () => gone();
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onHide);

  // ---- the view's places: the PAUSE control at the rail's top, the paused / the end card over the board
  function attach({ root, rail, overlay }) {
    els = { root, rail, overlay };
    els.pause = h('button.dr-pause', { type: 'button', 'data-nogesture': '', 'aria-label': 'Pause', onpointerup: () => pause() }, h('i.dr-bars', { 'aria-hidden': 'true' }), h('small.dr-left'));
    rail.prepend(els.pause);
    els.card = h('div.dr-card');
    overlay.append(els.card);
    // THE DROP B — THE ONE-TIME HINT (the row's `lesson` + index.js#HINT — the DAILY screen hands it in on a player's FIRST run): one calm line at
    // the board's top through the 3-2-1, gone at the first move or HINT_MS of play — then seen (the server's flag, every device)
    if (hint) { els.hint = h('p.dr-hint', String(hint)); overlay.append(els.hint); }
    paint();
  }
  function paint() {
    if (!els.root) return;
    els.root.classList.toggle('dr-paused', pausedAt != null);
    els.root.classList.toggle('dr-ended', ended);
    const lf = els.pause && els.pause.querySelector('.dr-left');
    if (lf) lf.textContent = String(left);
    if (els.pause) els.pause.disabled = left <= 0 || pausedAt != null || ended;
    const kids = [];
    if (ended) {
      const sc = result && result.score != null ? result.score : scoreOf(run.k * TICK, run.eng.lines);
      kids.push(h('b.dr-title', 'THE DROP'), h('span.dr-line', dropLine(sc)));
      kids.push(h('small.dr-sub', refused ? 'THIS RUN COULDN’T BE CHECKED' : finished ? (result && result.counted === false ? 'COUNTS FROM TOMORROW' : 'SCORED') : 'SENDING YOUR RUN…'));
    } else if (pausedAt != null) {
      // (THE DROP B: ONE line — PAUSED · 2 LEFT — for a tap, a hide and a refresh alike; a refresh adds where it came back; a room's pause is free)
      if (kind === 'r') kids.push(h('b.dr-title', 'YOUR ROOM STARTED A GAME'), h('small.dr-sub', 'THIS PAUSE IS FREE'));
      else kids.push(h('b.dr-title', `PAUSED · ${left} LEFT`));
      if (refresh && kind !== 'r') kids.push(h('small.dr-sub', 'LAST CHECKPOINT · 1 PAUSE USED'));   // (a refresh: back at the latest checkpoint — it cost one)
      kids.push(tubeButton('RESUME', { kind: 'main', onClick: () => resume() }));
    }
    els.card.replaceChildren(...kids);
    els.card.hidden = !kids.length;
  }
  function hintGo() {
    if (!els.hint || els.hint.classList.contains('is-gone')) return;
    const el = els.hint;
    el.classList.add('is-gone');
    setTimeout(() => { el.remove(); if (els.hint === el) els.hint = null; }, 700);
    if (typeof onHint === 'function') { try { onHint(); } catch (e) { console.warn('[drop] hint', e); } }
  }
  function stop() {
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', onHide);
    if (!ended && pausedAt == null) send().catch(() => {});
    if (hook) { removeTestHook('__drop', hook); hook = null; }
  }
  // ---- the tests' bot (window.__drop.bot — never a player's): a key every `every` ms toward its placement
  function runBot() {
    const now = performance.now();
    if (now < botNext) return;
    botNext = now + bot.every;
    if (bot.dumb) { input(run, 'X'); return; }                              // (the e2e's quick top-out: every piece slammed where it spawns)
    const r = dropKey(run.eng, botPlan, { rnd: bot.rnd });
    botPlan = r.plan;
    if (r.code) input(run, r.code);
  }
  let hook = installTestHook('__drop', {
    state: () => D.state(),
    bot: (o = {}) => { bot = { every: o.every ?? 70, dumb: !!o.dumb, rnd: rngFrom(`drop:${uid}:${o.seed || 1}`) }; },
    noBot: () => { bot = null; },
    pause: () => pause(),
    resume: () => resume(),
    hide: () => gone(),
    hint: () => !!(els.hint && !els.hint.classList.contains('is-gone')),
    show: () => back(),
    send: () => send(),
    log: () => run.log,
  });
  return D;
}
