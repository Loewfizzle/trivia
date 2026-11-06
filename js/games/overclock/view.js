// OVERCLOCK — player view: header, progress strip, rules cards, standings and the final podium.
// OC1 — THE OVERDRIVE FRAME (docs/overclock.md): the carbon background (a grid + a slow orange / blue haze + a vignette), the header (the
// name of the challenge, the score as a big rolling slanted number), THE TACH (kit/tach.js), THE COMBO meter (fx.js), the title SLAM +
// 3-2-1 (kit/slam.js), the right / wrong feedback (fx.js), THE ANSWER after TRIVIA + TRUE OR FALSE (answers.js), the sounds (sfx.js).
// Every challenge sits inside this frame — the ones not rebuilt yet (OC3 / OC4) keep their old screens in it.
// Challenges are generated locally from the room seed; each challenge's screen lives in ui/<type>.js and the reveal
// panels in reveals.js. Progress (parts done / correct) is written to oc/{match}/{ci}/{uid} after every step so a
// refresh resumes mid-challenge.
import { h, clear, pulseClass, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, countUp, leaderboard, fmtNum } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, update as dbUpdate, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { playerOrder } from '../../core/room-logic.js';
import { sfx } from '../../audio/sfx.js';
import { decodeQuestion } from '../../trivia/feed.js';
import { loadLengths, answersFor } from '../cipher/words.js';
import { INFO, generate, partsFor, SORT_CARDS } from './challenges.js';
import { fmtOk, fmtVal, sortSplit } from './shared.js';
import uiUnscramble from './ui/unscramble.js';
import uiMemory from './ui/memory.js';
import uiOddOne from './ui/oddone.js';
import uiNumeric from './ui/numeric.js';
import uiTrivia from './ui/trivia.js';
import uiStroop from './ui/stroop.js';
import uiReflex from './ui/reflex.js';
import uiCount from './ui/count.js';
import uiTrueFalse from './ui/truefalse.js';
import uiTimeline from './ui/timeline.js';
import uiClosest from './ui/closest.js';
import uiRewire from './ui/rewire.js';
import uiMissingLink from './ui/missinglink.js';
import uiSpellcheck from './ui/spellcheck.js';
import uiCompass from './ui/compass.js';
import uiSortIt from './ui/sortit.js';
import uiHigherLower from './ui/higherlower.js';
import { bankFor, loadBank, preloadFor, BANK_TYPES } from './banks.js';
import { CHALLENGE_MS, SKIP_MIN_MS, COMBO_NEUTRAL, levelOf, totals, standings, comboFold, nextInSec, standingsMs, roundWinOf, resultBeats, finalBeats, beatAt, beatStart, roundWins, awardChips, bestWorst } from './logic.js';
import { createTach } from '../kit/tach.js';
import { createSlam } from '../kit/slam.js';
import { ocSfx } from './sfx.js';
import { createCombo, createFx, comboSound } from './fx.js';
import { buildAnswer, hasAnswer, loadPicks, savePicks } from './answers.js';
import { demoFor } from './demos.js';



const GHOST = { name: 'GHOST', color: 'yellow', avatar: 'ghost' };
// challenge type → its screen (ui/*.js)
const SCREENS = {
  unscramble: uiUnscramble, memory: uiMemory, oddone: uiOddOne, math: uiNumeric, pattern: uiNumeric, trivia: uiTrivia,
  stroop: uiStroop, reflex: uiReflex, count: uiCount, truefalse: uiTrueFalse,
  timeline: uiTimeline, closest: uiClosest, rewire: uiRewire,
  missinglink: uiMissingLink, spellcheck: uiSpellcheck, compass: uiCompass, sortit: uiSortIt, higherlower: uiHigherLower,
};

export function createView() {
  let root, st;
  const els = {};
  let tach, combo, fx, slam = null;
  let phaseKey = '';
  let chal = null;      // { key, spec, ui, p, ok, done, parts }
  let introRaf = 0;
  let final = null;
  let lastScore = 0;
  let wordsReady = false;
  let vvHandler = null;
  let revealTimers = [];

  const g = () => st.game;
  const me = () => st.uid;
  const ckey = game => `${game.matchId}|${game.ci}`;
  const participant = game => !!(game.participants && game.participants[me()]);
  const player = uid => st.players[uid] || GHOST;
  const boardsNow = game => (st.liveKey && st.liveKey.includes(`"oc/${game.matchId}/${game.ci}"`) && st.live.boards) || {};
  // THE SEAL: your own answers (live.my_boards) + everyone's once the host has published them for the reveal (game.rv)
  const ownSealed = game => { const p = `/seal/${st.code}/oc/${game.matchId}/${game.ci}/${me()}`; return (st.liveKey && st.liveKey.includes(`"${p}"`) && st.live.my_boards) || {}; };
  const revealBoards = game => {
    const pub = boardsNow(game), rv = (game.rv && game.rv[game.ci]) || {}, out = {};
    for (const uid of new Set([...Object.keys(pub), ...Object.keys(rv)])) out[uid] = { ...(pub[uid] || {}), ...(rv[uid] || {}) };
    return out;
  };

  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('oc', 'oc-od');
    tach = createTach({ now: serverNow, onTick: k => ocSfx(k === 'up' ? 'timesUp' : k === 'urgent' ? 'tickUrgent' : 'tick') });
    combo = createCombo();
    fx = createFx(root);
    els.bg = h('div.oc-bg', { 'aria-hidden': 'true' }, h('i.oc-bg-grid'), h('i.oc-bg-haze.oc-bg-haze-a'), h('i.oc-bg-haze.oc-bg-haze-b'), h('i.oc-bg-vig'));
    els.num = h('span.oc-head-num');
    els.name = h('span.oc-head-name');
    els.x2 = h('span.oc-head-x2', '×2');
    els.sub = h('div.oc-sub', els.num, els.name, els.x2);
    els.score = h('b.oc-score-n', '0');
    els.head = h('header.game-head.oc-head',
      h('div.oc-head-l', h('div.oc-mark', 'OVER', h('b', 'CLOCK')), els.sub),
      h('div.oc-score', h('span.oc-score-k', 'SCORE'), els.score));
    els.timer = h('div.oc-tach', tach.el);
    els.strip = h('div.oc-strip');
    els.row = h('div.oc-row', combo.el, els.strip);
    els.stage = h('section.oc-stage');
    els.overlay = h('div.oc-overlay');
    root.append(els.bg, els.head, els.timer, els.row, els.stage, els.overlay, fx.el, tach.edge);
    // iOS keyboard (Missing Link): keep the answer above it
    if (window.visualViewport) {
      vvHandler = () => {
        const vv = window.visualViewport;
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty('--kb', `${Math.round(kb)}px`);
        root.classList.toggle('kb-open', kb > 80);
      };
      window.visualViewport.addEventListener('resize', vvHandler);
      window.visualViewport.addEventListener('scroll', vvHandler);
    }
    loadLengths([5, 6, 7]).then(() => { wordsReady = true; if (st) update(st); }).catch(() => {});
    if (state.game && state.game.order) preloadFor(state.game.order).then(() => { if (st) update(st); });
    // test hook (emulator runs only): the E2E compares puzzles across phones and reads progress
    if (/[?&]emu\b/.test(location.search)) {
      window.__oc = {
        spec: () => chal && chal.spec,
        state: () => chal && { type: chal.spec.type, ok: chal.ok, p: chal.p, done: chal.done, extra: chal.extra, local: chal.local },
        combo: () => combo && { n: combo.value, cueing: combo.cueing },
      };
    }
    update(state);
  }

  function unmount() {
    if (tach) tach.destroy();
    if (combo) combo.destroy();
    if (slam) slam.destroy();
    if (fx) fx.destroy();
    cancelAnimationFrame(introRaf);
    if (chal && chal.ui && chal.ui.destroy) chal.ui.destroy();
    if (final) final.destroy();
    window.removeEventListener('keydown', onKey);
    revealTimers.forEach(clearTimeout);
    if (vvHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', vvHandler);
      window.visualViewport.removeEventListener('scroll', vvHandler);
    }
  }

  function update(state) {
    st = state;
    const game = g();
    if (!game) return;
    const type = game.order[game.ci];
    const isFinal = game.ci === game.total - 1;
    root.dataset.phase = game.phase;
    els.num.textContent = `${String(game.ci + 1).padStart(2, '0')}/${String(game.total).padStart(2, '0')}`;
    els.name.textContent = INFO[type].name;
    els.x2.hidden = !isFinal;
    // THE TACH runs the challenge's 30 s only (the slam + the answer screens have their own clocks)
    if (game.phase === 'play') tach.set(game.phaseEndsAt, CHALLENGE_MS); else tach.stop();
    els.timer.classList.toggle('is-live', game.phase === 'play');
    const total = totals(game)[me()] || 0;
    if (total !== lastScore) { countUp(els.score, lastScore, total, 900); lastScore = total; }
    refreshCombo();

    renderStrip(game);
    renderStage(game);

    const pk = `${ckey(game)}|${game.phase}`;
    if (pk !== phaseKey) { phaseKey = pk; els.rows = null; buildOverlay(game); }
    else if (game.phase === 'final' && final) final.refresh();
    if (game.phase === 'standings') paintReady();
  }

  // ---------- players progress strip ----------
  function renderStrip(game) {
    const uids = playerOrder(st.players).filter(u => game.participants && game.participants[u]);
    const boards = boardsNow(game);
    const parts = partsFor(game.order[game.ci], levelOf(game.ci, game.total));
    const sig = uids.join(',');
    if (els.strip.dataset.sig !== sig) {
      els.strip.dataset.sig = sig;
      clear(els.strip);
      els.stripMap = {};
      for (const uid of uids) {
        const p = player(uid);
        const fill = h('i.oc-pfill');
        const el = h('div.oc-pchip', { style: { '--c': colorHex(p.color) }, class: uid === me() ? 'is-me' : null },
          avatar(p.avatar, p.color, 22), h('div.oc-pbar', fill));
        els.stripMap[uid] = { el, fill };
        els.strip.append(el);
      }
    }
    for (const uid of uids) {
      const b = boards[uid] || {};
      const s = els.stripMap[uid];
      const frac = game.phase === 'play' ? Math.min(1, (b.p || 0) / parts) : 0;
      s.fill.style.transform = `scaleX(${frac})`;
      s.el.classList.toggle('is-done', game.phase === 'play' && !!b.done);
      s.el.classList.toggle('is-lost', !(st.presence[uid] && st.presence[uid].online));
    }
  }

  // ---------- challenge stage ----------
  function renderStage(game) {
    if (game.phase !== 'play') {
      if (chal && chal.ui) { chal.ui.destroy && chal.ui.destroy(); }
      if (chal) chal.ui = null;
      if (!els.stage.querySelector('.oc-idle')) {
        clear(els.stage);
        els.stage.append(h('div.oc-idle', h('div.oc-idle-glyph', INFO[game.order[game.ci]].glyph)));
      }
      return;
    }
    if (!participant(game)) {
      if (!els.stage.querySelector('.oc-spectate')) { clear(els.stage); els.stage.append(h('div.oc-spectate', h('b', 'SPECTATING'), h('span', 'You join the next match.'))); }
      return;
    }
    const key = ckey(game);
    if (!chal || chal.key !== key) {
      // Wait for this challenge's saved progress to sync, so a refresh resumes where it left off.
      const synced = st.liveKey && st.liveKey.includes(`"oc/${game.matchId}/${game.ci}"`);
      const spec = synced ? buildSpec(game) : null;
      if (!spec) {
        if (!els.stage.querySelector('.oc-sync')) { clear(els.stage); els.stage.append(h('div.oc-sync', 'SYNCING CHALLENGE…')); }
        return;
      }
      const mine = boardsNow(game)[me()] || {}, env = ownSealed(game);
      chal = { key, spec, parts: spec.parts, p: mine.p || 0, ok: mine.ok || 0, done: !!mine.done, ui: null, marks: [], times: [], extra: {}, local: {} };
      for (const f of ['w', 'o', 'g', 'rw']) if (env[f] != null) chal.extra[f] = env[f]; else if (mine[f] != null) chal.extra[f] = mine[f];
      clear(els.stage);
      if (chal.done) showDone();
      else mountChallenge(game);
      if (!mine.p) sfx('challenge');
    }
  }

  function buildSpec(game) {
    const type = game.order[game.ci];
    const deps = {};
    if (type === 'unscramble') {
      if (!wordsReady) return null;
      deps.answersFor = answersFor;
    }
    if (type === 'trivia') {
      const start = game.tq && game.tq[game.ci];
      if (start == null) return null;
      deps.triviaItems = [0, 1, 2].map(i => decodeQuestion(game, st.code, start + i));
    }
    if (BANK_TYPES.includes(type)) {
      deps[type] = bankFor(type);
      if (!deps[type]) { loadBank(type).then(() => { if (st) update(st); }).catch(() => {}); return null; }
    }
    const occ = game.order.slice(0, game.ci).filter(t => t === type).length;
    // THE ROOM's NIGHT MEMORY (deal.js): the host dealt this challenge's items at the start — every phone builds the same one from it
    const deal = (game.deal && game.deal[game.ci]) || null;
    return generate(type, { seed: game.seed, ci: game.ci, level: levelOf(game.ci, game.total), occ, deal }, deps);
  }

  // Progress API shared by all challenge UIs. result: true / false, or partial credit 0..1
  // (Quick Count's off-by-one, Signal Lock's reaction time).
  function part(result, quiet = false) {
    if (!chal || chal.done) return;
    const credit = result === true ? 1 : result === false ? 0 : Math.max(0, Math.min(1, Number(result) || 0));
    chal.marks[chal.p] = credit >= 1 ? 'ok' : credit > 0 ? 'half' : 'miss';
    chal.p += 1;
    chal.ok = Math.round((chal.ok + credit) * 100) / 100;
    paintPips();
    if (!quiet) {
      ocSfx(credit >= 0.5 ? 'correct' : 'wrong');
      vibrate(credit >= 0.5 ? 12 : [20, 30, 20]);
      // a challenge that didn't hand its own tile to api.fx still gets the frame's wrong-answer edge + kick
      if (credit < 0.5 && !chal.fxDone) fx.wrong(null);
    }
    chal.fxDone = false;
    if (chal.p >= chal.parts) finish();
    else write(false);
    refreshCombo();
  }

  // THE COMBO meter: the game's combo/{me} (every closed challenge, the host's fold) + this challenge's marks so far
  let comboSeen = false;
  function refreshCombo() {
    const game = g();
    if (!game || !combo) return;
    const base = (game.combo && game.combo[me()]) || { c: 0, m: 0 };
    const live = game.phase === 'play' && chal && chal.key === ckey(game) ? comboFold(base, marksString()).c : base.c;
    const ev = combo.set(live);
    if (!comboSeen) { comboSeen = true; return; }
    if (ev.up) comboSound(live);
    // THE CUES (OC2 — never over the play area, never take a tap, ≤ 0.8 s): the meter ignites + the edge streak; x10 wins over x4
    const cue = ev.hit10 ? 'x10' : ev.hitOD ? 'od' : '';
    if (cue) { combo.ignite(cue); fx.streak(cue); }
  }

  function finish() {
    if (!chal || chal.done) return;
    chal.done = true;
    paintPips();
    write(true);
    setTimeout(showDone, 450);
  }

  function write(done) {
    const game = g();
    if (!game || !chal || !st.code) return;   // (FR6 FIXES A — B6: BACK TO THE ROOM with a done-timer pending: the match is gone — nothing to write)
    // THE SEAL: the progress in the room, the answers (w / o / g / rw) in your envelope — one atomic write
    const data = { p: chal.p, ok: chal.ok, n: chal.parts, done, at: serverTimestamp() };
    if (done) data.doneAt = serverTimestamp();
    const path = `oc/${game.matchId}/${game.ci}/${me()}`;
    const w = { [`rooms/${st.code}/${path}`]: data };
    if (chal.extra && Object.keys(chal.extra).length) w[`seal/${st.code}/${path}`] = { ...chal.extra, at: serverTimestamp() };
    dbUpdate(dbRef(), w).catch(() => toast('TOO LATE — CHALLENGE CLOSED', 'err'));
    // THE COMBO's marks (logic.js#comboFold) — its OWN write: on rules older than OC1 it's refused alone, the board above still lands
    const s = marksString();
    if (s) dbUpdate(dbRef(`rooms/${st.code}/ocm/${game.matchId}/${game.ci}/${me()}`), { s, at: serverTimestamp() }).catch(() => {});
  }
  /** this challenge's answers so far as combo marks: '1' right · '0' wrong · 'h' half · '-' a challenge with no right or wrong */
  function marksString() {
    if (!chal || !chal.p) return '';
    if (COMBO_NEUTRAL.has(chal.spec.type)) return '-'.repeat(Math.min(24, chal.p));
    let s = '';
    for (let i = 0; i < Math.min(24, chal.p); i++) s += chal.marks[i] === 'ok' ? '1' : chal.marks[i] === 'half' ? 'h' : '0';
    return s;
  }

  function showDone() {
    if (!chal) return;
    if (chal.ui && chal.ui.destroy) chal.ui.destroy();
    chal.ui = null;
    clear(els.stage);
    const reflex = chal.spec.type === 'reflex';
    const perfect = chal.ok >= chal.parts;
    const t = chal.spec.type;
    const NEW_DONE = {
      missinglink: () => [h('b', fmtOk(chal.ok)), ' / 2 linked'],
      sortit: () => [h('b', String(sortSplit(chal.ok, chal.p).right)), ` / ${SORT_CARDS} sorted right`],
      higherlower: () => ['STREAK ', h('b', String(Math.floor(chal.ok)))],
    };
    if (NEW_DONE[t]) {
      els.stage.append(h('div.oc-done', { class: perfect ? 'is-perfect' : null },
        h('div.oc-done-mark', perfect ? 'PERFECT' : t === 'higherlower' ? 'RUN OVER' : 'LOCKED IN'), h('div.oc-done-score', ...NEW_DONE[t]()), h('div.oc-done-wait', 'WAITING FOR THE OTHERS…')));
      if (perfect) sfx('solve');
      return;
    }
    if (t === 'closest' || t === 'timeline' || t === 'rewire') {
      // (Closest Call never shows how close you were until the reveal)
      const line = t === 'closest' ? [h('b', fmtVal(chal.extra.g ?? 0)), ` ${chal.spec.unit}`]
        : t === 'timeline' ? [h('b', fmtOk(chal.ok)), ' / 4 in place']
            : [h('b', String(Math.floor(chal.ok))), ' / 2 circuits'];
      const top = t === 'closest' ? 'LOCKED IN' : perfect ? 'PERFECT' : 'LOCKED IN';
      els.stage.append(h('div.oc-done', { class: perfect && t !== 'closest' ? 'is-perfect' : null },
        h('div.oc-done-mark', top), h('div.oc-done-score', ...line), h('div.oc-done-wait', 'WAITING FOR THE OTHERS…')));
      if (perfect && t !== 'closest') sfx('solve');
      return;
    }
    const hits = chal.times.filter(t => t != null);
    const score = reflex
      ? (hits.length ? [h('b', String(Math.round(hits.reduce((a, b) => a + b, 0) / hits.length))), ' ms avg'] : [h('b', `${Math.round((100 * chal.ok) / chal.parts)}%`), ' speed'])
      : [h('b', fmtOk(chal.ok)), ` / ${chal.parts}`];
    els.stage.append(h('div.oc-done', { class: perfect ? 'is-perfect' : null },
      h('div.oc-done-mark', perfect ? 'PERFECT' : 'LOCKED IN'),
      h('div.oc-done-score', ...score),
      h('div.oc-done-wait', 'WAITING FOR THE OTHERS…')));
    if (perfect) sfx('solve');
  }

  function mountChallenge(game) {
    const s = chal.spec;
    const info = INFO[s.type];
    const isFinal = game.ci === game.total - 1;
    els.pips = h('div.ch-pips', Array.from({ length: s.parts }, () => h('i')));
    els.stage.append(h('div.ch-hero', { class: isFinal ? 'is-final' : null, 'aria-label': info.name },
      h('span.ch-hero-glyph', info.glyph),
      h('div.ch-hero-text', h('b', info.name), h('small', isFinal ? 'FINAL · DOUBLE POINTS' : `CHALLENGE ${game.ci + 1} OF ${game.total}`)),
      els.pips));
    paintPips();
    const ui = SCREENS[s.type](s, api);
    if (s.type === 'closest') els.pips.hidden = true; // no hint before the reveal
    chal.ui = ui;
    els.stage.append(ui.el);
  }

  function paintPips() {
    if (!els.pips || !chal) return;
    [...els.pips.children].forEach((pip, i) => {
      pip.className = chal.marks[i] || (i < Math.floor(chal.ok) ? 'ok' : i < chal.p ? 'miss' : '');
    });
  }

  // ---------- keyboard routing (a challenge screen sets api.key while it's up) ----------
  let keyHandler = null;
  function onKey(e) { if (keyHandler && !e.metaKey && !e.ctrlKey) keyHandler(e); }
  window.addEventListener('keydown', onKey);

  // What a challenge screen (ui/*.js) gets: the current challenge state and the ways to record progress.
  const api = {
    get chal() { return chal; },
    part: (...a) => part(...a),
    progress: (...a) => progress(...a),
    step: (...a) => step(...a),
    finish: () => finish(),
    set key(fn) { keyHandler = fn; },
    game: () => g(),
    /** OVERDRIVE feedback on the tile the player tapped (call it before part()): right → burst + sparks into the score; wrong → crack + shake */
    fx(tile, right) { if (!chal) return; chal.fxDone = !right; if (right) fx.right(tile, els.score); else fx.wrong(tile); },
    /** your pick for part i (THE ANSWER shows it after the round — this device only) */
    pick(i, v) { const game = g(); if (!chal || !game) return; (chal.local.picks ||= loadPicks(game.matchId, game.ci))[i] = v; savePicks(game.matchId, game.ci, chal.local.picks); },
    sfx: name => ocSfx(name),
  };

  // Shared by the newer challenges: set progress directly (ok/p/extra) and publish; `done` locks it in.
  function progress(ok, p, extra, done = false, doneDelay = 450) {
    if (!chal || chal.done) return;
    chal.ok = Math.round(ok * 100) / 100;
    chal.p = Math.max(chal.ok, Math.min(chal.parts, p));
    Object.assign(chal.extra, extra || {});
    chal.marks = Array.from({ length: chal.parts }, (_, i) => (i < Math.floor(chal.ok) ? 'ok' : ''));
    paintPips();
    if (done) { chal.done = true; write(true); setTimeout(showDone, doneDelay); }
    else write(false);
    refreshCombo();
  }

  // Newer challenges that grade each step themselves: set ok/p, colour this step's pip, publish.
  function step(ok, p, mark, done = false, doneDelay = 450) {
    if (!chal || chal.done) return;
    if (mark) chal.marks[chal.p] = mark;
    chal.ok = Math.round(ok * 100) / 100;
    chal.p = Math.min(chal.parts, Math.max(chal.ok, p));
    paintPips();
    if (done || chal.p >= chal.parts) { chal.done = true; write(true); setTimeout(showDone, doneDelay); }
    else write(false);
    refreshCombo();
  }

  // ---------- overlays ----------
  function buildOverlay(game) {
    cancelAnimationFrame(introRaf);
    if (slam) { slam.destroy(); slam = null; }
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    clear(els.overlay);
    els.overlay.className = `oc-overlay ov-${game.phase}`;
    if (game.phase === 'ready') buildReady(game);
    else if (game.phase === 'standings') buildStandings(game);
    else if (game.phase === 'final') buildFinal(game);
  }

  // THE TITLE SLAM + 3-2-1 (kit/slam.js) inside the director's own ready time (READY_MS, or BRIEF_MS with the rules — never stretched)
  function buildReady(game) {
    const type = game.order[game.ci];
    const info = INFO[type];
    const isFinal = game.ci === game.total - 1;
    slam = createSlam({
      now: serverNow, startAt: game.phaseStartAt, endsAt: game.phaseEndsAt,
      kicker: isFinal ? 'FINAL CHALLENGE' : `CHALLENGE ${String(game.ci + 1).padStart(2, '0')} / ${String(game.total).padStart(2, '0')}`,
      name: info.name, sub: isFinal ? 'DOUBLE POINTS' : '',
      rules: game.brief ? info.rules : [], tone: isFinal ? 'final' : 'hot',
      demo: game.brief ? demoFor(type) : null,   // (OC3 — the hard ones' ~3 s demo, looping inside the rules card's own time)
      onIntro: () => ocSfx('intro'),
      onCount: c => ocSfx(c === 'GO' ? 'go' : 'count'),
    });
    els.overlay.append(h('div.oc-ready', { class: game.brief ? 'is-brief' : null }, slam.el));
    if (isFinal) root.classList.add('is-final');
  }

  // ---------- THE AFTER-CHALLENGE SCREEN (OC2 — THE RESULTS FLOW) ----------
  // Three BEATS inside the screen's own time (logic.js#resultBeats — the owner's timings unchanged): THE ANSWER → the ROUND WINNER banner →
  // the OVERALL standings (rows re-sort, ▲ blue / ▼ steel, the totals roll up, your row outlined orange, a lit READY mark on every row that
  // tapped). NEXT + the countdown + TAP WHEN READY keep their own footer (reserved — no row under them, 8 players at 390 × 844). Each beat is
  // timed from phaseStartAt on the server clock: a refresh / a rejoin / a new host lands on the right one, already settled.
  function buildStandings(game) {
    const res = (game.results && game.results[game.ci]) || {};
    const mine = res[me()];
    if (mine) sfx(mine.ok >= mine.parts ? 'correct' : 'roundEnd');
    const next = game.order[game.ci + 1];
    const nextUp = next ? h('div.next-up', 'NEXT: ', h('b', INFO[next].name), game.ci + 1 === game.total - 1 ? ' · ×2 POINTS' : '') : null;
    const body = resultsBody(game, resultBeats(game.order[game.ci], soloOf(game)));
    const panel = h('div.panel-full.oc-standings', body.el,
      h('footer.oc-st-foot', participant(game) ? readyTap(game, nextUp) : h('div.oc-next', nextUp, h('div.oc-next-watch', 'NEXT IN ', countdown(game, h('b.oc-next-n', ''))))));
    els.overlay.append(panel);
  }
  const soloOf = game => Object.keys(game.participants || {}).length === 1;

  /** the beats' layers + their timers. beats = resultBeats / finalBeats; extra = { final: el, victory: el } for the last challenge */
  function resultsBody(game, beats, extra = {}) {
    const mk = (cls, child) => { const l = h(cls, child); l.oc = child && child.oc; return l; };
    const layers = {
      answer: mk('div.oc-beat.oc-beat-answer', h('div.oc-st-scroll', reveal(game))),
      banner: beats.banner != null ? mk('div.oc-beat.oc-beat-banner', roundBanner(game)) : null,
      stand: mk('div.oc-beat.oc-beat-stand', overallBoard(game)),
      final: extra.final ? mk('div.oc-beat.oc-beat-final', extra.final) : null,
      victory: extra.victory ? mk('div.oc-beat.oc-beat-victory', extra.victory) : null,
    };
    const el = h('div.oc-st-body', Object.values(layers).filter(Boolean));
    let cur = '';
    const RANK = { answer: 0, banner: 1, stand: 2, final: 3, victory: 4 };
    const enter = (beat, animate) => {
      // (never backwards: a phone that skipped ahead ignores the timers of the beats it passed)
      if (beat === cur || !layers[beat] || (cur && RANK[beat] < RANK[cur])) return;
      cur = beat;
      for (const [k, l] of Object.entries(layers)) if (l) l.classList.toggle('is-on', k === beat);
      el.dataset.beat = beat;
      const l = layers[beat];
      l.classList.toggle('is-instant', !animate);
      if (l.oc && l.oc.enter) l.oc.enter(animate);
      if (extra.onBeat) extra.onBeat(beat, animate);
    };
    // the beat now (settled — no replayed animation), then a timer for each one still to come
    const since = serverNow() - (game.phaseStartAt || 0);
    enter(beatAt(beats, since), since < 400);
    for (const beat of ['banner', 'stand', 'final', 'victory']) {
      const at = beatStart(beats, beat);
      if (at == null || !layers[beat]) continue;
      const wait = (game.phaseStartAt || 0) + at - serverNow();
      if (wait > 0) revealTimers.push(setTimeout(() => { if (el.isConnected) enter(beat, true); }, wait));
    }
    return { el, enter, get beat() { return cur; } };
  }

  // THE ROUND WINNER: a slanted orange stamp + the winner's emblem + name as the hero (DEAD HEAT + the tied names · NO WINNER) — one rule:
  // logic.js#roundWin (the server's REDLINE rule), stored in game/rw
  function roundBanner(game) {
    const r = roundWinOf(game, game.ci);
    const type = game.order[game.ci];
    const tags = [];
    if (game.ci === game.total - 1) tags.push('×2 POINTS');
    if (type === 'closest' && r.kind === 'win') tags.push('CLOSEST GUESS BONUS');
    const who = (uid, size) => { const p = player(uid); return h('div.oc-rw-who', { class: uid === me() ? 'is-me' : null, style: { '--c': colorHex(p.color) } }, avatar(p.avatar, p.color, size), h('b.oc-rw-name', p.name), uid === me() ? h('span.oc-rw-you', 'YOU') : null); };
    const box = h('div.oc-rw', { class: `is-${r.kind}` },
      h('div.oc-rw-stamp', h('span.oc-rw-stamp-glow', { 'aria-hidden': 'true' }), h('b', r.kind === 'win' ? 'ROUND WINNER' : r.kind === 'tie' ? 'DEAD HEAT' : 'NO WINNER')),
      r.kind === 'win' ? h('div.oc-rw-hero', who(r.uid, 96), h('div.oc-rw-pts', `+${fmtNum(r.pts)}`))
        : r.kind === 'tie' ? h('div.oc-rw-tie', h('div.oc-rw-tied', r.uids.slice(0, 4).map(u => who(u, 58)), r.uids.length > 4 ? h('span.oc-rw-more', `+${r.uids.length - 4}`) : null), h('div.oc-rw-pts', `+${fmtNum(r.pts)} EACH · NOBODY TAKES IT`))
          : h('div.oc-rw-none', 'NOBODY SCORED THIS ROUND'),
      tags.length ? h('div.oc-rw-tags', tags.map(t => h('span.oc-rw-tag', t))) : null,
      h('div.oc-rw-k', `CHALLENGE ${String(game.ci + 1).padStart(2, '0')} · ${INFO[type].name}`));
    const layer = h('div.oc-rw-wrap', box);
    layer.oc = { enter: animate => { if (animate) { ocSfx('stamp'); if (r.kind === 'win' && r.uid === me()) setTimeout(() => ocSfx('rankUp'), 180); } } };
    return layer;
  }

  // THE OVERALL STANDINGS: the light slanted rows (OC1 — never the console's slim cards mid-game), in the order BEFORE this round, sliding
  // into the new one as the beat starts; ▲ n (blue) / ▼ n (dim steel); the round's points + the total rolling up; a lit mark when READY
  const ROW = 54;
  function overallBoard(game) {
    const now = standings(game, game.ci);
    const prev = standings(game, game.ci - 1);
    const prevMap = Object.fromEntries(prev.map(r => [r.uid, r]));
    const res = (game.results && game.results[game.ci]) || {};
    const rb = revealBoards(game);
    const prevPos = Object.fromEntries((game.ci > 0 ? prev : now).map((r, i) => [r.uid, i]));
    els.rows = {};
    const list = h('div.oc-sb-list', { style: { height: `${now.length * ROW}px` } });
    const items = now.map((r, i) => {
      const p = st.players[r.uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
      const pr = prevMap[r.uid];
      const moved = game.ci > 0 && pr ? pr.rank - r.rank : 0;
      const off = st.presence[r.uid] && st.presence[r.uid].online === false;
      const rank = h('span.lb-rank', String(pr && game.ci > 0 ? pr.rank : r.rank));
      const score = h('span.oc-sb-score', fmtNum(pr ? pr.score : 0));
      const mv = h('span.oc-sb-move', { class: moved > 0 ? 'is-up' : moved < 0 ? 'is-down' : 'is-same', 'aria-label': moved > 0 ? `up ${moved}` : moved < 0 ? `down ${-moved}` : 'no change' }, moved > 0 ? `▲${moved}` : moved < 0 ? `▼${-moved}` : '');
      const note = noteFor(game, res[r.uid], rb[r.uid]);
      const el = h('div.oc-lr.oc-sb-row', { class: [r.uid === me() ? 'is-me' : '', off ? 'is-off' : ''].join(' '), style: { '--c': colorHex(p.color), transform: `translateY(${prevPos[r.uid] * ROW}px)` }, dataset: { uid: r.uid } },
        rank, avatar(p.avatar, p.color, 30),
        h('span.lb-name', h('span.oc-sb-nm', p.name), note ? h('small.lb-note', note) : null),
        h('i.oc-sb-ready', { 'aria-label': 'ready', title: 'READY' }),
        mv, h('span.oc-sb-delta', `+${fmtNum(res[r.uid] ? res[r.uid].pts : 0)}`), score);
      els.rows[r.uid] = el;
      return { r, pr, el, rank, score, i, moved };
    });
    list.append(...items.map(x => x.el));
    const box = h('div.oc-sb', h('div.oc-sb-k', h('span', `LEADERBOARD // AFTER ${String(game.ci + 1).padStart(2, '0')}`), h('span.oc-sb-of', `${game.ci + 1} OF ${game.total}`)), list);
    paintReady();
    const settle = animate => {
      box.classList.add('is-sorted');
      for (const x of items) {
        x.el.style.transform = `translateY(${x.i * ROW}px)`;
        x.rank.textContent = String(x.r.rank);
        x.el.classList.toggle('is-first', x.r.rank === 1);
        if (animate && !reducedMotion()) countUp(x.score, x.pr ? x.pr.score : 0, x.r.score, 900);
        else x.score.textContent = fmtNum(x.r.score);
      }
    };
    box.oc = {
      enter(animate) {
        if (!animate) { box.classList.add('is-instant'); settle(false); return; }
        revealTimers.push(setTimeout(() => { if (!box.isConnected) return; settle(true); ocSfx('swoosh'); const meUp = items.find(x => x.r.uid === me() && x.moved > 0); if (meUp) setTimeout(() => ocSfx('rankUp'), 380); }, 260));
      },
    };
    const wrap = h('div.oc-sb-wrap', box);
    wrap.oc = box.oc;
    return wrap;
  }
  /** the READY marks on the standings rows (live: ocnext) */
  function paintReady() {
    if (!els.rows) return;
    const taps = (st.live && st.live.next) || {};
    for (const [uid, el] of Object.entries(els.rows)) el.classList.toggle('is-ready', !!taps[uid]);
  }

  // THE AFTER-CHALLENGE SKIP (OC1 — director.js 'standings'): NEXT IN n + TAP WHEN READY. Everyone connected tapped (≥ SKIP_MIN_MS in) →
  // the host moves on early; otherwise the full time runs. The tap is its own node (ocnext): refused on older rules = just no skip.
  function readyTap(game, nextUp = null) {
    const m = game.matchId, ci = game.ci;
    const left = h('b.oc-next-n', '');
    const btn = h('button.oc-next-btn', { type: 'button', dataset: { sfx: 'none' } }, h('span.oc-next-l', 'TAP WHEN READY'), h('span.oc-next-c', 'NEXT IN ', left));
    let sent = false;
    const send = () => {
      if (sent || !st.code) return;
      sent = true;
      btn.classList.add('is-sent');
      btn.querySelector('.oc-next-l').textContent = 'READY ✓';
      ocSfx('tap');
      dbUpdate(dbRef(`rooms/${st.code}/ocnext/${m}/${ci}/${me()}`), { at: serverTimestamp() }).catch(() => {});
    };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); send(); });
    btn.addEventListener('click', e => { if (e.detail === 0) send(); });
    const mine = st.live && st.live.next && st.live.next[me()];
    if (mine) { sent = true; btn.classList.add('is-sent'); btn.querySelector('.oc-next-l').textContent = 'READY ✓'; }
    countdown(game, left);
    btn.dataset.min = String(SKIP_MIN_MS);
    return h('div.oc-next', nextUp, btn);
  }
  /** "NEXT IN n" — logic.js#nextInSec on the server clock (0 … this screen's max), re-read 4× a second while the number is on screen */
  function countdown(game, el) {
    let last = '', first = true;
    const tick = () => {
      if (!first && !el.isConnected) return;
      first = false;
      const sec = String(nextInSec(game, serverNow()));
      if (sec !== last) { last = sec; el.textContent = sec; }
      revealTimers.push(setTimeout(tick, 250));
    };
    tick();
    return el;
  }

  // THE ANSWER (OC2 — every challenge; answers.js): built only once the challenge has CLOSED (standings / final — THE SEAL)
  function reveal(game) {
    const type = game.order[game.ci];
    if (!hasAnswer(type)) return null;
    const mine = chal && chal.key === ckey(game);
    const spec = mine ? chal.spec : buildSpec(game);
    if (!spec) return null;
    const picks = participant(game) ? ((mine && chal.local.picks) || loadPicks(game.matchId, game.ci)) : [];
    return h('section.rv.oc-rv-answer', buildAnswer(type, spec, picks, {
      game, me: me(), player,
      boards: revealBoards(game),
      uids: Object.keys(game.participants || {}),
      timers: revealTimers,
      sortLog: mine && chal.local.sort ? chal.local.sort.log : null,
    }));
  }

  function noteFor(game, r, b) {
    if (!r) return '';
    const type = game.order[game.ci];
    b = b || {};
    if (type === 'reflex') return `REFLEX ${Math.round((100 * r.ok) / r.parts)}%`;
    if (type === 'timeline') return `${fmtOk(r.ok)}/4 IN PLACE`;
    if (type === 'rewire') return `${Math.floor(r.ok)}/2 CIRCUITS`;
    if (type === 'missinglink') return `${fmtOk(r.ok)}/2 LINKED`;
    if (type === 'higherlower') return `STREAK ${Math.floor(r.ok)}`;
    if (type === 'sortit') return b.p ? `${sortSplit(r.ok, b.p).right}/${SORT_CARDS} SORTED RIGHT` : 'NO SORTS';
    if (type === 'closest') {
      const spec = chal && chal.spec && chal.spec.type === 'closest' ? chal.spec : buildSpec(game);
      return b.g == null || !spec ? 'NO GUESS' : `${fmtVal(b.g)} · ${Math.round((100 * Math.abs(b.g - spec.answer)) / spec.answer)}% OFF`;
    }
    return `${fmtOk(r.ok)}/${r.parts} CORRECT`;
  }

  // ---------- THE END OF THE MATCH (OC2 — inside 'final', FINAL_MS: no timing changed) ----------
  // logic.js#finalBeats: the LAST round's results (THE ANSWER → the ROUND WINNER → the standings, as every round) → THE FINAL STANDINGS →
  // THE VICTORY (the console's podium frame — ui/final.js#createFinal — with OUR body: victory.js#finalScene). Timed from the phase's start on
  // the server clock: a refresh / a rejoin / a host change lands on the right beat. SKIP › moves THIS phone on (nobody else — the phase is the
  // host's); it's remembered for the match on this device, so a refresh never goes back.
  const skipKey = m => `oc:skip:${m}`;
  const ORDER = ['answer', 'banner', 'stand', 'final', 'victory'];
  const loadSkip = m => { try { return sessionStorage.getItem(skipKey(m)) || ''; } catch { return ''; } };
  const saveSkip = (m, b) => { try { sessionStorage.setItem(skipKey(m), b); } catch { /* this screen only */ } };
  function buildFinal(game) {
    if (final) { final.destroy(); final = null; }
    const solo = soloOf(game);
    const beats = finalBeats(game.order[game.ci], solo);
    const since = serverNow() - (game.phaseStartAt || 0);
    const skipped = loadSkip(game.matchId);
    const atNow = ORDER.indexOf(beatAt(beats, since)) >= ORDER.indexOf(skipped) ? beatAt(beats, since) : skipped;
    if (atNow === 'victory') { mountVictory(game); return; }
    const res = (game.results && game.results[game.ci]) || {};
    if (res[me()] && since < 1500) sfx(res[me()].ok >= res[me()].parts ? 'correct' : 'roundEnd');
    let body = null;
    const nextOf = beat => {
      const live = ORDER.filter(b => beatStart(beats, b) != null);
      return live[live.indexOf(beat) + 1] || 'victory';
    };
    const label = h('span.oc-fin-l', '');
    const left = h('b.oc-next-n', '');
    const skip = h('button.oc-next-btn.oc-fin-skip', { type: 'button', dataset: { sfx: 'none' } }, label, h('span.oc-next-c', 'IN ', left, h('i.oc-fin-arrow', ' · SKIP ›')));
    const goTo = (beat, animate = true) => {
      if (beat === 'victory') { saveSkip(game.matchId, 'victory'); mountVictory(game, animate); return; }
      if (body) body.enter(beat, animate);
    };
    const onPress = () => { if (!body) return; const nb = nextOf(body.beat); saveSkip(game.matchId, nb); ocSfx('tap'); goTo(nb); };
    skip.addEventListener('pointerdown', e => { e.preventDefault(); onPress(); });
    skip.addEventListener('click', e => { if (e.detail === 0) onPress(); });
    // the footer counts to the next beat on the server clock (a skipped one reads its own next)
    const tick = () => {
      if (!skip.isConnected || !body) return;
      const nb = nextOf(body.beat);
      label.textContent = nb === 'final' ? 'FINAL STANDINGS' : nb === 'victory' ? 'THE WINNER' : nb === 'stand' ? 'THE STANDINGS' : 'THE ROUND WINNER';
      const at = (game.phaseStartAt || 0) + (beatStart(beats, nb) ?? beats.victory);
      left.textContent = String(Math.max(0, Math.ceil((at - serverNow()) / 1000)));
      revealTimers.push(setTimeout(tick, 250));
    };
    body = resultsBody(game, beats, {
      final: solo ? null : finalStandings(game),
      victory: h('div.oc-fin-hold'),
      onBeat: beat => { if (beat === 'victory') goTo('victory', true); },
    });
    if (atNow !== beatAt(beats, since)) body.enter(atNow, false);
    const panel = h('div.panel-full.oc-standings.oc-fin', body.el, h('footer.oc-st-foot', h('div.oc-next', h('div.next-up', 'THE LAST CHALLENGE · ', h('b', 'THE RESULTS')), skip)));
    els.overlay.append(panel);
    tick();
  }
  /** THE VICTORY: the console's podium frame + our body (finalScene — victory.js) */
  function mountVictory(game) {
    if (final) return;
    const old = els.overlay.querySelector('.oc-fin');
    if (old) old.remove();
    final = createFinal({
      rows: standings(game), players: st.players, me: me(), presence: st.presence, scoreLabel: 'PTS',
      kicker: `OVERCLOCK · ${String(game.total)} CHALLENGES`,
      winnerLine: nm => `${nm} RAN THE HOTTEST`,
    });
    els.overlay.append(final.el);
  }

  // THE FINAL STANDINGS: every player (2–8), the top three on the OVERDRIVE edges (gold-orange · steel · bronze — no clip-art medals), each
  // row: rank · emblem · name · ROUND WINS · the total counting up as the rows race in; YOUR BEST / YOUR WORST under it (your challenges)
  function finalStandings(game) {
    const rows = standings(game);
    const wins = roundWins(game);
    const list = h('div.oc-fs-list', rows.map((r, i) => {
      const p = player(r.uid);
      const n = h('b.oc-fs-total', '0');
      const row = h('div.oc-lr.oc-fs-row', { class: [r.uid === me() ? 'is-me' : '', r.rank <= 3 ? `is-p${r.rank}` : ''].join(' '), style: { '--c': colorHex(p.color), '--i': i } },
        h('span.lb-rank', String(r.rank)), avatar(p.avatar, p.color, 30),
        h('span.lb-name', h('span.oc-sb-nm', p.name)),
        h('span.oc-fs-wins', h('b', String(wins[r.uid] || 0)), h('small', wins[r.uid] === 1 ? 'ROUND WON' : 'ROUNDS WON')),
        n);
      row.oc = { n, score: r.score };
      return row;
    }));
    const bw = bestWorst(game, me());
    const tile = (k, x) => h('div.oc-fs-bw', { class: `is-${k}` }, h('span.oc-fs-bw-k', k === 'best' ? 'YOUR BEST' : 'YOUR WORST'), h('b', INFO[x.type] ? INFO[x.type].name : '—'), h('span.oc-fs-bw-v', `+${fmtNum(x.pts)}`, h('small', x.rel >= 1 ? ' · TOP OF THE ROOM' : ` · ${Math.round(x.rel * 100)}% OF THE BEST`)));
    const strip = bw && participant(game) ? h('div.oc-fs-strip', tile('best', bw.best), bw.worst ? tile('worst', bw.worst) : null) : null;
    const box = h('div.oc-fs', h('div.oc-fs-k', h('span', 'FINAL STANDINGS'), h('span.oc-sb-of', `${game.total} CHALLENGES`)), list, strip);
    box.oc = {
      enter(animate) {
        const rowsEl = [...list.children];
        if (!animate || reducedMotion()) { box.classList.add('is-instant'); rowsEl.forEach(r => { r.oc.n.textContent = fmtNum(r.oc.score); }); return; }
        box.classList.add('is-racing');
        ocSfx('swoosh');
        rowsEl.forEach((r, i) => revealTimers.push(setTimeout(() => { if (box.isConnected) countUp(r.oc.n, 0, r.oc.score, 1100); }, 260 + i * 90)));
      },
    };
    return box;
  }

  return { mount, update, unmount };
}
