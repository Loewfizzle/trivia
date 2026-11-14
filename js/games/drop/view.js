// THE DROP — THE RUN on the phone (THE DROP A — docs/prism.md "THE DROP"). PRISM DROP's REAL view (js/games/prism/view.js) mounted in its
// DROP mode: the board, the look (both), the sound + the gestures are PRISM's; this file is the DRIVER the view asks each frame:
//   · THE CLOCK: the run's tick = (the server's now − go − the pauses) / TICK — `go` + the pauses from the server's answers, the phone's offset
//     to the server's clock from each answer's `now` (no database socket — THE PARKED DATABASE); the run is stepped to it (drop.js#stepTo)
//   · THE RECORDER: every input the view hands over goes through drop.js#input (the log keeps the ones that did something)
//   · CHECKPOINTS: the log's new chunk every CK_MS (6 s) + when the page hides; a lost answer → resync from the server's length
//   · PAUSE (3 a run): the board HIDDEN, the clock stopped by the server; a REFRESH resumes at the latest checkpoint — one pause used (one line)
//   · THE ROOM WINS: the daily screen's pause (judge.pause(room)) carries the freshest chunk (judge.bind)
//   · THE END: the top-out (or THE END at 8:00) → the final upload → judge.finish() → the score's line
// Plain + functional (THE DROP B brings the ticket, the share, the polish).
import { h } from '../../ui/dom.js';
import { tubeButton } from '../../ui/components.js';
import { createView as createPrismView } from '../prism/view.js';
import { createDropRun, input, stepTo, replay, TICK, COUNT_MS, dropLine, scoreOf } from '../prism/drop.js';
import { CK_MS } from '../prism/drop-judge.js';
import { dropKey } from '../prism/bot.js';
import { rngFrom, hashString } from '../../core/rng.js';
import { installTestHook, removeTestHook } from '../kit/hook.js';

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
    drv = createDriver({ judge, start: r, uid: state.uid });
    const game = {
      id: 'prism', matchId: `drop-${r.day}`, phase: 'play', settings: { mode: 'survival' }, seed: r.run.seed, songs: [], sd: [],
      participants: { [state.uid]: true }, playStartAt: drv.goLocal(), songStartAt: drv.goLocal() - COUNT_MS, pp: hashString(`${r.run.seed}:paper`) % 4, drop: true,
    };
    inner = createPrismView();
    inner.mount(host, { ...state, game, drop: drv, live: {}, liveKey: null, players: state.players || {}, presence: {} });
  }
}

const doneCard = score => h('div.dr-done', h('b', 'TODAY’S DROP IS DONE'), h('span', dropLine(score)));

/** the run's driver — what PRISM's view asks each frame (+ the pause control, the end) */
export function createDriver({ judge, start, uid }) {
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
  const refresh = !!R0.refresh;
  let els = {}, bot = null, botNext = 0, botPlan = null;
  const D = {
    run,
    goLocal: () => go - off,
    paused: () => pausedAt != null,
    left: () => left,
    /** the freshest chunk (a pause carries it — THE ROOM WINS' too) */
    chunk() { stepTo(run, target()); return { at: sent, add: run.log.slice(sent), k: run.k, ...(run.over ? { fin: 1 } : {}) }; },
    input(code) { if (pausedAt != null || ended) return 'noop'; return input(run, code); },
    frame,
    attach,
    stop,
    state: () => ({ k: run.k, t: run.k * TICK, lines: run.eng.lines, over: run.over, sent, len: run.log.length, paused: pausedAt != null, kind, left, ended, finished, result, refused, refresh }),
  };
  judge.bind && judge.bind(D);
  function target() { return Math.floor((clock() - go - pm) / TICK); }
  const took = r => { if (r && Number.isFinite(Number(r.now))) off = Number(r.now) - Date.now(); if (r && r.pm != null) pm = r.pm; if (r && r.go) go = r.go; if (r && r.left != null) left = r.left; };

  function frame() {
    if (ended || pausedAt != null) return;
    stepTo(run, target());
    if (bot && !run.over) runBot();
    if (run.over) { ended = true; finish(); return; }
    if (!flying && clock() - lastCk >= CK_MS) send();
  }
  async function send(action = 'checkpoint') {
    if (flying) return null;
    flying = true;
    const body = D.chunk();
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
    pausedAt = clock(); kind = 'p';                                             // (frozen at the tap; the server's stamp lands a beat later)
    paint();
    try { const r = await send('ppause'); if (r && r.pa == null) pausedAt = null; paint(); }   // (the server's answer: its count of pauses left)
    catch (e) { if (!(e && e.code === 'paused')) { pausedAt = null; kind = null; paint(); } }
  }
  async function resume() {
    try { const r = await judge.resume(); took(r); pausedAt = null; kind = null; paint(); if (r.e) { ended = true; finish(); } } catch (e) { console.warn('[drop] resume', e); }
  }
  function onVis() {
    if (document.visibilityState !== 'hidden' || ended) return;
    if (pausedAt == null && left > 0) pause(); else if (pausedAt == null) send().catch(() => {});
  }
  document.addEventListener('visibilitychange', onVis);

  // ---- the view's places: the PAUSE control at the rail's top, the paused / the end card over the board
  function attach({ root, rail, overlay }) {
    els = { root, rail, overlay };
    els.pause = h('button.dr-pause', { type: 'button', 'data-nogesture': '', 'aria-label': 'Pause', onpointerup: () => pause() }, h('i.dr-bars', { 'aria-hidden': 'true' }), h('small.dr-left'));
    rail.prepend(els.pause);
    els.card = h('div.dr-card');
    overlay.append(els.card);
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
      kids.push(h('b.dr-title', kind === 'r' ? 'YOUR ROOM STARTED A GAME' : 'PAUSED'));
      if (refresh) kids.push(h('small.dr-sub', 'LAST CHECKPOINT · 1 PAUSE USED'));   // (a refresh: back at the latest checkpoint — it cost one)
      kids.push(h('small.dr-sub', `${left} ${left === 1 ? 'PAUSE' : 'PAUSES'} LEFT`));
      kids.push(tubeButton('RESUME', { kind: 'main', onClick: () => resume() }));
    }
    els.card.replaceChildren(...kids);
    els.card.hidden = !kids.length;
  }
  function stop() {
    document.removeEventListener('visibilitychange', onVis);
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
    send: () => send(),
    log: () => run.log,
  });
  return D;
}
