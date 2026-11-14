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
//   · THE ROOM WINS: the daily screen's pause (judge.pause(room)) carries the freshest chunk (judge.bind) — and the run's close then sends NO
//     checkpoint behind it (PFIX-3 — S2: two uploads from one offset raced)
//   · PFIX-3 — A PAUSE IS ONLY A PAUSE ONCE THE SERVER HOLDS IT (FABLE REVIEW 2's M1–M3): a tap's pause waits for the upload in flight; the
//     hide's goes at once with keepalive (a page going away may never get a second chance — the server takes both orders); an answer with no
//     pause (`pa`), or no answer, is NEVER "paused": the phone stays frozen + UNCONFIRMED and asks again (the return, `online`, the RESUME tap
//     — the server backdates the pause to the board's tick, so nothing is lost); RESUME never goes out before the pause is confirmed
//   · THE END: the top-out (or THE END at 8:00) → the final upload → judge.finish() → the score's line
// Plain + functional (THE DROP B brings the ticket, the share, the polish).
import { h } from '../../ui/dom.js';
import { tubeButton } from '../../ui/components.js';
import { createView as createPrismView } from '../prism/view.js';
import { createDropRun, input, stepTo, replay, TICK, COUNT_MS, dropLine, scoreOf, ticksOf, tenthsOf, linesOf } from '../prism/drop.js';
import { boardString } from '../prism/engine.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { CK_MS, SLOW_TOL_MS, MAX_TAIL_MS, clockOffset } from '../prism/drop-judge.js';
import { dropKey } from '../prism/bot.js';
import { rngFrom, hashString } from '../../core/rng.js';
import { installTestHook, removeTestHook } from '../kit/hook.js';
import { loadManifest } from '../prism/songs.js';
import { dealSongs, setForLook } from '../prism/logic.js';
import { dropSkin } from '../prism/skin-deal.js';
import { settings, updateSettings } from '../../audio/settings.js';
/** the songs a run deals (≈ 3 min each: 8 minutes of play + the pauses' 20 minutes never run out) */
export const DROP_SONGS = 10;
/** the one-time hint stays this long into the run at most (the first move takes it sooner) */
export const HINT_MS = 6000;
/** the finish's retries: backed off to this, and woken at once by `online` / the page showing — no limit while the card is open */
export const FINISH_WAIT_MAX_MS = 15_000;

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
    if (r.done != null) { host.replaceChildren(doneCard(r.done, !!(r.run && r.run.rf))); return; }
    drv = createDriver({ judge, start: r, uid: state.uid, hint: state.hint || null, onHint: state.onHint || null });
    // THE DROP B — PRISM DROP's OWN SONGS: the DAY or the NIGHT set by this phone's look (a solo daily — the phone's own look decides), dealt from
    // the day (everyone's run hears the same order), on the view's synced player (the quick start, the heard-beat clock, the night gains) from
    // the 3-2-1; enough songs for 8 minutes + the pauses (the playlist runs on the wall clock). No manifest = a silent run, never a stuck one.
    const manifest = await loadManifest().catch(() => []);
    if (gone) return;
    const deal = dealSongs({ manifest, set: setForLook(document.body.dataset.look === 'day' ? 'day' : 'night'), roomSeed: `drop:${r.day}`, pos: 0, count: DROP_SONGS });
    // (SKINS 1: THE DROP draws in the PLAYER's own rotation — this phone's counter, +1 a day's run; a refresh / a resume keeps the day's skin)
    const sk = dropSkin(settings, r.day);
    if (sk.patch) updateSettings(sk.patch);
    const game = {
      sk: sk.k, id: 'prism', matchId: `drop-${r.day}`, phase: 'play', settings: { mode: 'survival' }, seed: r.run.seed, songs: deal.songs, sd: deal.sd, set: deal.set, cu: deal.cu, ff: deal.ff,
      participants: { [state.uid]: true }, playStartAt: drv.goLocal(), songStartAt: drv.goLocal() - COUNT_MS, pp: hashString(`${r.run.seed}:paper`) % 4, drop: true,
    };
    inner = createPrismView();
    inner.mount(host, { ...state, game, drop: drv, live: {}, liveKey: null, players: state.players || {}, presence: {} });
  }
}

const UNCHECKED = 'THIS RUN COULDN’T BE CHECKED';
const doneCard = (score, rf = false) => h('div.dr-done', h('b', 'TODAY’S DROP IS DONE'), h('span', dropLine(score)), rf ? h('small.dr-sub', UNCHECKED) : null);

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
  let sent = R0.len || 0, flights = 0, lastCk = 0, ended = !!R0.e, finished = false, result = null, refused = null;
  // (THE DROP B: away = the open pause is a HIDE's; pzOk = the server has confirmed it (a run that comes back paused is the server's own);
  //  hid = a hide with no pause left { at, k }; holding = the away end's upload in flight — the run stands still until the server answers.
  //  PFIX-3: asking = the pause's call in flight (one at a time), resuming = a RESUME tap in flight, roomAsked = THE ROOM WINS' pause went out)
  let away = false, pzOk = R0.pa != null, hid = null, holding = false, asking = null, resuming = false, roomAsked = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let lost = false;                                                              // (the tests' hook only: calls that never leave the phone)
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
    /** THE ROOM WINS' pause (judge.js): the freshest chunk — and the close that follows sends no checkpoint from the same offset (S2) */
    roomChunk() { roomAsked = true; return D.chunk(); },
    input(code) { if (pausedAt != null || ended) return 'noop'; const r = input(run, code); if (r === 'ok') hintGo(); return r; },
    frame,
    attach,
    stop,
    state: () => ({ k: run.k, t: run.k * TICK, lines: run.eng.lines, over: run.over, sent, len: run.log.length, paused: pausedAt != null, kind, left, ended, finished, result, refused, refresh, away, pzOk, holding, flying: flights > 0 }),
  };
  judge.bind && judge.bind(D);
  function target() { return Math.floor((clock() - go - pm) / TICK); }
  const chunkNow = () => ({ at: sent, add: run.log.slice(sent), k: run.k, ...(run.over ? { fin: 1 } : {}) });
  // (PFIX-3 — FABLE REVIEW 2's S4: the offset to the server's clock keeps the LARGEST estimate seen — an answer's latency only ever makes one
  //  too SMALL, and re-reading it from every answer moved the run's clock BACK by each slow answer's delay: the board froze, then lurched. A
  //  far smaller one (the phone's own clock was set forward mid-run) is believed again — drop-judge.js#clockOffset.)
  const took = r => {
    if (r && Number.isFinite(Number(r.now))) off = clockOffset(off, Number(r.now) - Date.now());
    if (r && r.pm != null) pm = r.pm; if (r && r.go) go = r.go; if (r && r.left != null) left = r.left;
  };

  function frame() {
    if (ended || pausedAt != null || holding || hiddenNow()) return;   // (hidden: no frames on a phone anyway — the return decides)
    stepTo(run, target());
    if (bot && !run.over) runBot();
    if (els.hint && run.k * TICK >= HINT_MS) hintGo();
    if (run.over) { ended = true; finish(); return; }
    if (!flights && clock() - lastCk >= CK_MS) send().catch(() => {});
  }
  /** ONE upload (a checkpoint, or the chunk a pause carries). One at a time — null when another is in flight; only the hide's keepalive call
   *  (`ka`) goes beside one. The server's checked length is the truth for `sent` (PFIX-3: two answers may land in either order) */
  async function send(action = 'checkpoint', ka = false, body0 = null) {
    if (flights && !ka) return null;
    flights++;
    const b = body0 || D.chunk(), body = ka ? { ...b, $ka: 1 } : b;
    try {
      if (lost) throw Object.assign(new Error('lost'), { status: 0, code: 'offline' });
      const r = await judge[action](body);
      took(r);
      if (r.resync) sent = r.len; else sent = Math.max(sent, Number.isInteger(r.len) ? r.len : body.at + body.add.length);
      lastCk = clock();
      if (r.e && !ended) { ended = true; finish(); }
      return r;
    } catch (e) {
      if (e && e.status === 422 && e.code !== 'too_early') refused = e.code || 'refused';
      // (the server holds a pause this phone didn't know of — a pause call that landed after the phone gave up on it: shown, RESUME ends it)
      if (e && e.code === 'paused') { if (pausedAt == null) { pausedAt = clock(); kind = 'p'; away = false; } pzOk = true; paint(); }
      lastCk = clock();
      throw e;
    } finally { flights--; }
  }
  /** THE END's upload + the finish. PFIX-3 (FABLE REVIEW 2 — S5): it NEVER gives up while the card is open — backed off to FINISH_WAIT_MAX_MS,
   *  woken at once when the signal is back (`online`) or the page shows again; a refusal the server can't take back ends it (its own line). */
  let finishing = false, wake = null, stopped = false;
  async function finish() {
    if (finishing) return;
    finishing = true;
    paint();
    for (let i = 0; !finished && !stopped; i++) {
      try {
        while (flights) await sleep(100);
        if (lost) throw Object.assign(new Error('lost'), { status: 0, code: 'offline' });
        if (sent < run.log.length || run.over) { const b = D.chunk(); const r = await judge.checkpoint(b).catch(e => (e && (e.code === 'finished' || e.code === 'done') ? { e: 1 } : Promise.reject(e))); if (r && !r.resync) sent = Math.max(sent, b.at + b.add.length); else if (r && r.resync) { sent = r.len; continue; } }
        result = await judge.finish();
        finished = true;
        refused = result && result.rf ? 'unchecked' : null;       // (the server scored it at the last point it could prove — it says so)
      } catch (e) {
        // (a refusal the server can't take back ends it; `too_early` is not one — the run's last tick is a moment ahead of the server's clock:
        //  the same upload is in bounds a moment later)
        if (e && e.status === 422 && e.code !== 'too_early') { refused = e.code || 'refused'; break; }
        await new Promise(r => { const t = setTimeout(r, Math.min(FINISH_WAIT_MAX_MS, 1000 * (i + 1))); wake = () => { clearTimeout(t); r(); }; });
        wake = null;
      }
    }
    finishing = false;
    paint();
  }
  /** PAUSE (the tap): frozen at once; the server's pause asked AFTER the upload in flight (M1) — never "paused" on no answer */
  async function pause() {
    if (pausedAt != null || ended || left <= 0) return;
    stepTo(run, target());
    if (run.over) return;                                                        // (the tap's tick ended the run — the next frame finishes it)
    pausedAt = clock(); kind = 'p'; away = false; pzOk = false; left = Math.max(0, left - 1);   // (frozen at the tap; the server's stamp + count land a beat later)
    paint();
    await askPause();
  }
  /**
   * PFIX-3 — ask the server for the pause this phone already shows. ONE call at a time; a tap's / a return's waits for the upload in flight (its
   * answer moves `sent` — two uploads from one offset never race); the hide's (`ka`) goes at once with keepalive. → true = the server holds it.
   *   pa in the answer (or 409 paused) → confirmed · no pause granted (the limit) → the phone un-pauses: a hide becomes a no-pause hide ·
   *   no answer → still frozen + unconfirmed: asked again by the return, `online` and the RESUME tap (the server backdates it to this chunk's tick)
   */
  function askPause(ka = false) {
    if (asking && !ka) return asking;
    const p = (async () => {
      if (!ka) while (flights) await sleep(40);
      if (pausedAt == null || ended) return false;
      if (pzOk) return true;
      const at0 = pausedAt;
      try {
        const r = await send('ppause', ka, chunkNow());
        if (!r || r.e) return false;                                             // (null: another upload slipped in — asked again; e: the run ended there)
        if (r.pa != null) { pzOk = true; paint(); return true; }
        noPause(at0);                                                            // (the server granted none — its count of pauses left is in the answer)
        return false;
      } catch (e) {
        if (e && e.code === 'paused') { pzOk = true; paint(); return true; }
        if (e && e.code === 'pause_limit') { left = 0; noPause(at0); return false; }
        if (e && (e.code === 'finished' || e.code === 'done')) { if (!ended) { ended = true; finish(); } return false; }
        return false;                                                            // (no signal: unconfirmed — the phone stays frozen and asks again)
      }
    })();
    if (!ka) { asking = p; p.finally(() => { if (asking === p) asking = null; }); }
    return p;
  }
  /** the server granted no pause: the clock was never stopped — a hide goes on as a no-pause hide from its moment, a tap just plays on */
  function noPause(at0) {
    const wasAway = away;
    pausedAt = null; kind = null; away = false; pzOk = false;
    paint();
    if (wasAway) { hid = { at: at0, k: run.k }; if (!hiddenNow()) back(); }
  }
  /** THE DROP B — the page hid with a pause left: an automatic PLAYER pause (keepalive — it lands though the page is going) */
  function hidePause() {
    pausedAt = clock(); kind = 'p'; away = true; pzOk = false; left = Math.max(0, left - 1);
    paint();
    askPause(true);
  }
  /** THE DROP B — back on the page */
  function back() {
    if (ended) return;
    // (a pause the server never confirmed — the hide's call was lost, or a tap's answer never came: asked again; the server backdates it)
    if (pausedAt != null && kind === 'p' && !pzOk) { askPause(); return; }
    if (!hid) return;
    const gap = clock() - hid.at, k0 = hid.k;
    hid = null;
    if (gap <= SLOW_TOL_MS) return;                                              // (a short hide: the run catches up on the next frame)
    // away past the bound with no pause left: the run ends at the hide's checkpoint + MAX_TAIL_MS of play (the server checks the gap)
    holding = true;
    stepTo(run, Math.min(target(), k0 + ticksOf(MAX_TAIL_MS)));
    paint();
    const tail = async () => { while (flights) await sleep(40); return send('checkpoint', false, { ...chunkNow(), aw: 1 }); };
    tail().then(() => { holding = false; paint(); }).catch(() => { holding = false; paint(); });
  }
  /** RESUME: only on a pause the server HOLDS (an unconfirmed one is confirmed first — else the clock would have run through it: M1) */
  async function resume() {
    if (resuming || pausedAt == null || ended) return;
    resuming = true;
    try {
      if (kind === 'p' && !pzOk && !(await askPause())) return;                  // (still no answer: the card stays — tap again when the signal is back)
      const r = await judge.resume(); took(r); pausedAt = null; kind = null; away = false; pzOk = false; paint(); if (r.e) { ended = true; finish(); }
    } catch (e) { console.warn('[drop] resume', e); } finally { resuming = false; }
  }
  // THE ADD-ON (the cost check) + THE DROP B: the page hiding / the phone locking / leaving = an AUTOMATIC PLAYER PAUSE while one is left (it
  // carries the run's freshest chunk — a refresh resumes there); none left = a checkpoint, the clock running
  function gone() {
    // (PFIX-3: a tap's pause still waiting for its answer when the page goes → asked again now, with keepalive)
    if (!ended && pausedAt != null && kind === 'p' && !pzOk) { askPause(true); return; }
    if (ended || pausedAt != null || hid || holding) return;
    stepTo(run, target());                                                       // (the run up to the moment the page went)
    if (run.over) return;
    if (left > 0) hidePause();
    else { hid = { at: clock(), k: run.k }; send('checkpoint', true, chunkNow()).catch(() => {}); }
  }
  function onVis() { if (document.visibilityState === 'hidden') gone(); else { if (wake) wake(); back(); } }
  const onHide = () => gone();
  const onLine = () => { if (wake) wake(); if (!hiddenNow()) back(); };          // (the signal is back: the finish tries at once; an unconfirmed pause is asked again)
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onHide);
  window.addEventListener('online', onLine);

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
    // (PFIX-3 — S3: a run that comes back already ENDED (its final upload landed, the finish never did) is finished NOW — it used to sit on
    //  "SENDING YOUR RUN…" for good: nothing ever called the finish)
    if (ended && !finished) finish();
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
      kids.push(h('small.dr-sub', refused && (finished || !finishing) ? UNCHECKED : finished ? (result && result.counted === false ? 'COUNTS FROM TOMORROW' : 'SCORED') : 'SENDING YOUR RUN…'));
      // THE DROP B — SHARE: SHARE YOUR RUN's card with THE DROP's final board (every junk row SOLID — js/games/drop/share.js), the time, the lines
      if (finished && !refused) { kids.push(tubeButton('SHARE', { kind: 'secondary', cls: 'dr-share', onClick: () => shareRun(sc) })); sharer(sc).then(H => H.warm()).catch(() => {}); }   // (PFIX-3 — S11: built as the card shows)
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
  /** THE SHARE CARD's handle (share.js#prepDrop — the kit's prepShare): ONE per look; the card + its file are made when the end card shows,
   *  the tap only sends them (one send at a time) */
  let shareH = null, shareLook = null;
  async function sharer(sc) {
    const look = typeof document !== 'undefined' && document.body.dataset.look === 'day' ? 'day' : 'night';
    if (!shareH || shareLook !== look) {
      const S = await lazyImport(import('./share.js'), './share.js');
      shareLook = look; shareH = S.prepDrop({ inputs: { t: tenthsOf(sc) * 100, ln: linesOf(sc), b: boardString(run.eng, 20), day: start.day }, look });
    }
    return shareH;
  }
  async function shareRun(sc) {
    try { shared = await (await sharer(sc)).send(); } catch (e) { console.warn('[drop] share', e); shared = 'failed'; }
  }
  let shared = null;
  function stop() {
    stopped = true; if (wake) wake();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', onHide);
    window.removeEventListener('online', onLine);
    // (PFIX-3 — S2: never right behind THE ROOM WINS' pause — it carries this very chunk, and the two raced from one offset)
    if (!ended && pausedAt == null && !roomAsked) send().catch(() => {});
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
    shared: () => shared,
    show: () => back(),
    send: () => send().catch(() => null),
    off: () => off,
    took: r => took(r),
    lose: (on = true) => { lost = !!on; },          // (the tests: the next calls never leave the phone — a lost hide)
    log: () => run.log,
  });
  return D;
}
