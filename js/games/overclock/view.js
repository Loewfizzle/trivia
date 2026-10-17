// OVERCLOCK — player view. Challenges are generated locally from the room seed;
// progress (parts done / correct) is written to oc/{match}/{ci}/{uid} after every
// step so a refresh resumes mid-challenge.
import { h, clear, pulseClass, vibrate } from '../../ui/dom.js';
import { avatar, createTimer, countUp, leaderboard } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { playerOrder } from '../../core/room-logic.js';
import { shuffle } from '../../core/rng.js';
import { sfx } from '../../audio/sfx.js';
import { decodeQuestion } from '../../trivia/feed.js';
import { loadLengths, answersFor, isValidGuess } from '../cipher/words.js';
import {
  INFO, generate, unscrambleAccepts, partsFor, STROOP_COLORS, REFLEX_TIMEOUT_MS, reflexCredit,
  lexiconOk, timelineCorrect, closestCredit, rewirePower, rewireOk, REWIRE_SHAPES, LEXICON_PARTS,
  linkAccepts, normWord, applyOp, OP_SIGN, COMPASS_DIRS, COMPASS_TURN, COMPASS_STEP_MS, COMPASS_GAP_MS, COMPASS_START_MS, COMPASS_FLASH_MS,
  SORT_CARDS, sortWindowMs, sortOk,
} from './challenges.js';
import { bankFor, loadBank, preloadFor, BANK_TYPES } from './banks.js';
import { CHALLENGE_MS, levelOf, totals, standings } from './logic.js';

const GHOST = { name: 'GHOST', color: 'yellow', avatar: 'ghost' };
// 3, 2.5, 3.47 → '3', '2.5', '3.5' (partial credit)
const fmtOk = n => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString());
// 1234.5 → '1,234.5' (Closest Call)
const fmtVal = v => { const [i, d] = String(v).split('.'); return Number(i).toLocaleString('en-US') + (d != null ? `.${d}` : ''); };
// Higher or Lower values: 39 million, 1.44 billion, 0.49 km², 1876, c. 2560 BC
function fmtStat(unit, v, shown) {
  if (shown) return shown;
  if (unit === 'year') return String(v);
  if (unit === 'million' && v >= 1000) return `${(v / 1000).toFixed(2).replace(/0$/, '')} billion`;
  if (unit === 'million' && v < 1) return `${Math.round(v * 1000)} thousand`;
  return unit ? `${fmtVal(v)} ${unit}` : fmtVal(v);
}
// Sort It only stores the net score (right − ½ wrong) and how many cards were sorted; this recovers right/wrong.
const sortSplit = (ok, p) => { const wrong = Math.max(0, Math.round((p - ok) / 1.5)); return { right: p - wrong, wrong }; };
// Make 24 tiles: whole numbers, or an exact fraction drawn stacked
const fmtSigned = n => (n < 0 ? `−${-n}` : String(n));
const fracEl = v => (v[1] === 1 ? h('span.m24-int', fmtSigned(v[0])) : h('span.m24-frac', h('b', fmtSigned(v[0])), h('i'), h('b', String(v[1]))));
// Compass rose (static) and needle (turned with a CSS transform)
const ROSE_SVG = (() => {
  const p = (r, a) => { const t = (a * Math.PI) / 180; return [(100 + r * Math.sin(t)).toFixed(1), (100 - r * Math.cos(t)).toFixed(1)]; };
  const ticks = [];
  for (let a = 0; a < 360; a += 10) {
    const big = a % 90 === 0, mid = a % 45 === 0;
    const [x1, y1] = p(92, a), [x2, y2] = p(big ? 78 : mid ? 82 : 87, a);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${big ? 'tk-b' : 'tk'}"/>`);
  }
  const star = (r1, r2, rot) => Array.from({ length: 8 }, (_, i) => p(i % 2 ? r2 : r1, i * 45 + rot).join(',')).join(' ');
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" class="ring"/><circle cx="100" cy="100" r="70" class="ring2"/>${ticks.join('')}`
    + `<polygon points="${star(64, 16, 0)}" class="star"/><polygon points="${star(42, 11, 22.5)}" class="star2"/></svg>`;
})();
const NEEDLE_SVG = '<svg viewBox="0 0 200 200" aria-hidden="true"><polygon points="100,24 113,100 87,100" class="nd-n"/><polygon points="100,176 113,100 87,100" class="nd-s"/><circle cx="100" cy="100" r="8" class="nd-hub"/></svg>';
const DIR_NAME = { N: 'NORTH', E: 'EAST', S: 'SOUTH', W: 'WEST' };
const TURN_TEXT = { L: 'TURN LEFT', R: 'TURN RIGHT', A: 'TURN AROUND' };
const TURN_SVG = {
  R: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40V22a8 8 0 0 1 8-8h14"/><path d="M30 6l8 8-8 8"/></svg>',
  L: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M34 40V22a8 8 0 0 0-8-8H12"/><path d="M18 6l-8 8 8 8"/></svg>',
  A: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40V20a10 10 0 0 1 20 0v14"/><path d="M26 28l8 8 8-8"/></svg>',
};

export function createView() {
  let root, st;
  const els = {};
  let timer;
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

  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('oc');
    timer = createTimer({ warnAt: 8_000, ticks: true });
    els.sub = h('div.oc-sub');
    els.score = h('div.oc-score', '0');
    els.head = h('header.game-head',
      h('div.oc-head-l', h('div.oc-title', 'OVER', h('b', 'CLOCK')), els.sub),
      h('div.oc-score-wrap', h('small', 'SCORE'), els.score));
    els.timer = h('div.oc-timer', timer.el);
    els.strip = h('div.oc-strip');
    els.stage = h('section.oc-stage');
    els.overlay = h('div.oc-overlay');
    root.append(els.head, els.timer, els.strip, els.stage, els.overlay);
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
      };
    }
    update(state);
  }

  function unmount() {
    timer && timer.stop();
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
    els.sub.textContent = `C${String(game.ci + 1).padStart(2, '0')}/${game.total} · ${INFO[type].name}${isFinal ? ' · ×2' : ''}`;
    timer.set(game.phaseEndsAt, game.phase === 'play' ? CHALLENGE_MS : Math.max(1, game.phaseEndsAt - game.phaseStartAt));
    els.timer.classList.toggle('is-live', game.phase === 'play');
    const total = totals(game)[me()] || 0;
    if (total !== lastScore) { countUp(els.score, lastScore, total, 900); lastScore = total; }

    renderStrip(game);
    renderStage(game);

    const pk = `${ckey(game)}|${game.phase}`;
    if (pk !== phaseKey) { phaseKey = pk; buildOverlay(game); }
    else if (game.phase === 'final' && final) final.refresh();
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
      const mine = boardsNow(game)[me()] || {};
      chal = { key, spec, parts: spec.parts, p: mine.p || 0, ok: mine.ok || 0, done: !!mine.done, ui: null, marks: [], times: [], extra: {}, local: {} };
      for (const f of ['w', 'o', 'g', 'rw']) if (mine[f] != null) chal.extra[f] = mine[f];
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
    return generate(type, { seed: game.seed, ci: game.ci, level: levelOf(game.ci, game.total), occ }, deps);
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
      sfx(credit >= 0.5 ? 'ocCorrect' : 'ocWrong');
      vibrate(credit >= 0.5 ? 12 : [20, 30, 20]);
    }
    if (chal.p >= chal.parts) finish();
    else write(false);
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
    const data = { p: chal.p, ok: chal.ok, n: chal.parts, done, at: serverTimestamp(), ...(chal.extra || {}) };
    if (done) data.doneAt = serverTimestamp();
    set(dbRef(`rooms/${st.code}/oc/${game.matchId}/${game.ci}/${me()}`), data).catch(() => toast('TOO LATE — CHALLENGE CLOSED', 'err'));
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
      make24: () => [h('b', fmtOk(chal.ok)), ' / 2 solved'],
      sortit: () => [h('b', String(sortSplit(chal.ok, chal.p).right)), ` / ${SORT_CARDS} sorted right`],
      higherlower: () => ['STREAK ', h('b', String(Math.floor(chal.ok)))],
    };
    if (NEW_DONE[t]) {
      els.stage.append(h('div.oc-done', { class: perfect ? 'is-perfect' : null },
        h('div.oc-done-mark', perfect ? 'PERFECT' : t === 'higherlower' ? 'RUN OVER' : 'LOCKED IN'), h('div.oc-done-score', ...NEW_DONE[t]()), h('div.oc-done-wait', 'WAITING FOR THE OTHERS…')));
      if (perfect) sfx('solve');
      return;
    }
    if (t === 'closest' || t === 'lexicon' || t === 'timeline' || t === 'rewire') {
      // (Closest Call never shows how close you were until the reveal)
      const line = t === 'closest' ? [h('b', fmtVal(chal.extra.g ?? 0)), ` ${chal.spec.unit}`]
        : t === 'lexicon' ? [h('b', (chal.extra.w || '—').toUpperCase()), ` · ${(chal.extra.w || '').length} letters`]
          : t === 'timeline' ? [h('b', fmtOk(chal.ok)), ' / 4 in place']
            : [h('b', String(Math.floor(chal.ok))), ' / 2 circuits'];
      const top = t === 'closest' ? 'LOCKED IN' : perfect ? 'PERFECT' : t === 'lexicon' ? 'BEST WORD' : 'LOCKED IN';
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
    els.stage.append(h('div.ch-hero', { class: isFinal ? 'is-final' : null },
      h('span.ch-hero-glyph', info.glyph),
      h('div.ch-hero-text', h('b', info.name), h('small', isFinal ? 'FINAL · DOUBLE POINTS' : `CHALLENGE ${game.ci + 1} OF ${game.total}`)),
      els.pips));
    paintPips();
    const ui = {
      unscramble: uiUnscramble, memory: uiMemory, oddone: uiOddOne, math: uiNumeric, pattern: uiNumeric, trivia: uiTrivia,
      stroop: uiStroop, reflex: uiReflex, count: uiCount, truefalse: uiTrueFalse,
      lexicon: uiLexicon, timeline: uiTimeline, closest: uiClosest, rewire: uiRewire,
      missinglink: uiMissingLink, spellcheck: uiSpellcheck, make24: uiMake24, compass: uiCompass, sortit: uiSortIt, higherlower: uiHigherLower,
    }[s.type](s);
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

  // ---------- keyboard routing (math / pattern / unscramble) ----------
  let keyHandler = null;
  function onKey(e) { if (keyHandler && !e.metaKey && !e.ctrlKey) keyHandler(e); }
  window.addEventListener('keydown', onKey);

  // ---------- UNSCRAMBLE ----------
  function uiUnscramble(s) {
    const n = s.word.length;
    let pool = s.letters.map((ch, i) => ({ ch, i }));
    let picked = [];
    const slots = h('div.us-slots', { style: { '--n': n } });
    const tiles = h('div.us-tiles', { style: { '--n': n } });
    const render = () => {
      clear(slots);
      for (let k = 0; k < n; k++) {
        const t = picked[k];
        slots.append(h('button.us-slot', { type: 'button', class: t ? 'is-full' : null, dataset: { sfx: 'none' }, onclick: () => { if (t) { picked.splice(k, 1); sfx('key'); render(); } } }, t ? t.ch : ''));
      }
      clear(tiles);
      for (const t of pool) {
        const used = picked.includes(t);
        tiles.append(h('button.us-tile', { type: 'button', class: used ? 'is-used' : null, disabled: used, dataset: { sfx: 'none' }, onclick: () => add(t) }, t.ch));
      }
    };
    const add = t => {
      if (picked.length >= n || picked.includes(t)) return;
      picked.push(t);
      sfx('key');
      vibrate(6);
      render();
      if (picked.length === n) check();
    };
    const check = () => {
      const guess = picked.map(t => t.ch).join('');
      if (unscrambleAccepts(guess, s.word, isValidGuess)) {
        slots.classList.add('is-win');
        part(true);
      } else {
        sfx('invalid');
        vibrate([30, 30, 30]);
        pulseClass(slots, 'shake', 500);
        setTimeout(() => { picked = []; render(); }, 420);
      }
    };
    keyHandler = e => {
      if (/^[a-z]$/i.test(e.key)) { const t = pool.find(x => x.ch === e.key.toLowerCase() && !picked.includes(x)); if (t) add(t); }
      else if (e.key === 'Backspace') { picked.pop(); render(); }
    };
    render();
    const el = h('div.ch.ch-unscramble',
      h('div.ch-prompt', 'REBUILD THE WORD'),
      slots, tiles,
      h('div.ch-actions',
        h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { pool = shuffle(Math.random, pool); render(); } }, 'SHUFFLE'),
        h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { picked = []; render(); } }, 'CLEAR')));
    return { el, destroy() { keyHandler = null; } };
  }

  // ---------- MEMORY ----------
  function uiMemory(s) {
    const nodes = [];
    const grid = h('div.mem-grid');
    let mode = chal.p > 0 ? 'input' : 'watch';
    let pos = chal.p;
    const timers = [];
    const status = h('div.ch-prompt', mode === 'watch' ? 'WATCH THE SEQUENCE' : 'REPEAT IT');
    const counter = h('div.mem-count');
    const paintCount = () => { counter.textContent = mode === 'watch' ? `LENGTH ${s.seq.length}` : `${pos} / ${s.seq.length}`; };
    for (let i = 0; i < 9; i++) {
      const b = h('button.mem-node', { type: 'button', dataset: { sfx: 'none' }, disabled: mode === 'watch', onclick: () => tap(i) }, h('i'));
      nodes.push(b);
      grid.append(b);
    }
    const glow = (i, ms) => { pulseClass(nodes[i], 'lit', ms); };
    const tap = i => {
      if (mode !== 'input' || chal.done) return;
      glow(i, 260);
      sfx('node', { i });
      const right = s.seq[pos] === i;
      pos++;
      paintCount();
      if (!right) {
        pulseClass(nodes[i], 'miss', 500);
        pulseClass(nodes[s.seq[pos - 1]], 'hint', 700);
        chal.p = pos;
        sfx('ocWrong');
        vibrate([20, 30, 20]);
        mode = 'over';
        finish();
        return;
      }
      chal.p = pos - 1; // part() increments
      part(true, true);
    };
    if (mode === 'watch') {
      const startAt = 700;
      s.seq.forEach((n, k) => timers.push(setTimeout(() => { glow(n, s.stepMs * 0.75); sfx('node', { i: n }); }, startAt + k * s.stepMs)));
      timers.push(setTimeout(() => {
        mode = 'input';
        status.textContent = 'REPEAT IT';
        nodes.forEach(b => { b.disabled = false; });
        grid.classList.add('is-input');
        paintCount();
      }, startAt + s.seq.length * s.stepMs + 150));
    } else grid.classList.add('is-input');
    paintCount();
    const el = h('div.ch.ch-memory', status, grid, counter);
    return { el, destroy() { timers.forEach(clearTimeout); } };
  }

  // ---------- ODD ONE OUT ----------
  function uiOddOne(s) {
    const wrap = h('div.ch.ch-odd');
    const show = () => {
      clear(wrap);
      if (chal.p >= s.grids.length) return;
      const gspec = s.grids[chal.p];
      const grid = h('div.odd-grid', { style: { '--n': gspec.size } });
      for (let i = 0; i < gspec.size * gspec.size; i++) {
        const b = h('button.odd-cell', { type: 'button', dataset: { sfx: 'none' }, onclick: () => pickCell(i, gspec, grid) }, i === gspec.idx ? gspec.odd : gspec.base);
        grid.append(b);
      }
      wrap.append(h('div.ch-prompt', `FIND THE ODD ONE · ${chal.p + 1}/${s.grids.length}`), grid);
    };
    let locked = false;
    const pickCell = (i, gspec, grid) => {
      if (locked) return;
      locked = true;
      const right = i === gspec.idx;
      grid.children[gspec.idx].classList.add('is-odd');
      if (!right) grid.children[i].classList.add('is-miss');
      part(right);
      setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 350 : 750);
    };
    show();
    return { el: wrap };
  }

  // ---------- QUICK MATH / PATTERN LOCK (numeric keypad) ----------
  function uiNumeric(s) {
    const items = s.type === 'math'
      ? s.problems.map(p => ({ prompt: h('div.num-q', p.text, h('span.num-eq', ' = ?')), ans: p.ans }))
      : s.seqs.map(q => ({ prompt: h('div.num-q.num-seq', q.shown.join(', '), h('span.num-eq', ', ?')), ans: q.ans }));
    const head = h('div.ch-prompt');
    const promptBox = h('div.num-prompt');
    const display = h('div.num-display');
    let value = '';
    let locked = false;
    const paint = () => {
      display.textContent = value || ' ';
      display.classList.toggle('is-empty', !value);
    };
    const show = () => {
      if (chal.p >= items.length) return;
      head.textContent = `${s.type === 'math' ? 'SOLVE' : 'NEXT IN SEQUENCE'} · ${chal.p + 1}/${items.length}`;
      promptBox.replaceChildren(items[chal.p].prompt);
      pulseClass(promptBox, 'q-in');
      value = '';
      paint();
    };
    const press = k => {
      if (locked || chal.done) return;
      if (k === '<') { value = value.slice(0, -1); paint(); return; }
      if (k === '>') {
        if (!value) return;
        const right = Number(value) === items[chal.p].ans;
        locked = true;
        display.classList.add(right ? 'is-right' : 'is-wrong');
        if (!right) display.textContent = `${value} → ${items[chal.p].ans}`;
        part(right);
        setTimeout(() => { locked = false; display.classList.remove('is-right', 'is-wrong'); if (!chal.done) show(); }, right ? 380 : 900);
        return;
      }
      if (value.length >= 6) return;
      value += k;
      sfx('key');
      vibrate(6);
      paint();
    };
    const pad = h('div.keypad', { dataset: { sfx: 'none' } },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<', '0', '>'].map(k => h('button.kp', {
        type: 'button', class: k === '>' ? 'kp-go' : k === '<' ? 'kp-del' : null,
        onpointerdown: e => { e.preventDefault(); press(k); },
        onclick: e => { if (e.detail === 0) press(k); },
      }, k === '<' ? '⌫' : k === '>' ? 'ENTER' : k)));
    keyHandler = e => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('<');
      else if (e.key === 'Enter') press('>');
    };
    show();
    return { el: h('div.ch.ch-num', head, promptBox, display, pad), destroy() { keyHandler = null; } };
  }

  // ---------- TRIVIA LIGHTNING ----------
  function uiTrivia(s) {
    const wrap = h('div.ch.ch-trivia');
    let locked = false;
    const show = () => {
      if (chal.p >= s.questions.length) return;
      const q = s.questions[chal.p];
      const opts = q.a.map((a, i) => h('button.tl-opt', { type: 'button', dataset: { sfx: 'none' }, onclick: () => choose(i, q, opts) }, h('span.tl-key', 'ABCD'[i]), h('span', a)));
      wrap.replaceChildren(
        h('div.ch-prompt', `LIGHTNING · ${chal.p + 1}/${s.questions.length}`),
        h('p.tl-q', q.q),
        h('div.tl-opts', opts));
      pulseClass(wrap, 'q-in');
    };
    const choose = (i, q, opts) => {
      if (locked) return;
      locked = true;
      opts[q.c].classList.add('is-correct');
      if (i !== q.c) opts[i].classList.add('is-wrong');
      part(i === q.c);
      setTimeout(() => { locked = false; if (!chal.done) show(); }, i === q.c ? 450 : 900);
    };
    show();
    return { el: wrap };
  }

  // Buttons that react on touch-down (a click waits for the finger to lift — too slow for these).
  const fastButton = (sel, attrs, onPress, ...kids) => h(sel, {
    type: 'button', dataset: { sfx: 'none', ...(attrs.dataset || {}) }, ...attrs,
    onpointerdown: e => { e.preventDefault(); onPress(e); },
    onclick: e => { if (e.detail === 0) onPress(e); }, // keyboard / assistive activation
  }, ...kids);

  // ---------- COLOR CLASH ----------
  function uiStroop(s) {
    const wrap = h('div.ch.ch-stroop');
    let locked = false;
    let btns = [];
    const show = () => {
      if (chal.p >= s.items.length) return;
      const it = s.items[chal.p];
      const word = h('div.cc-word', { style: { '--ink': STROOP_COLORS[it.ink].hex }, 'aria-label': `The word ${STROOP_COLORS[it.word].name}` }, STROOP_COLORS[it.word].name);
      btns = it.order.map((id, k) => fastButton('button.cc-opt', { dataset: { c: id }, 'aria-label': `${STROOP_COLORS[id].name} text` }, () => choose(id), h('span.cc-key', String(k + 1)), STROOP_COLORS[id].name));
      wrap.replaceChildren(h('div.ch-prompt', `TAP THE TEXT COLOR · ${chal.p + 1}/${s.items.length}`), word, h('div.cc-opts', btns));
      pulseClass(word, 'q-in');
    };
    const choose = id => {
      if (locked || chal.done) return;
      locked = true;
      const it = s.items[chal.p];
      const right = id === it.ink;
      btns.find(b => b.dataset.c === it.ink).classList.add('is-correct');
      if (!right) btns.find(b => b.dataset.c === id).classList.add('is-wrong');
      part(right);
      setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 220 : 650);
    };
    keyHandler = e => { const k = Number(e.key); if (k >= 1 && k <= 4 && s.items[chal.p]) choose(s.items[chal.p].order[k - 1]); };
    show();
    return { el: wrap, destroy() { keyHandler = null; } };
  }

  // ---------- SIGNAL LOCK ----------
  function uiReflex(s) {
    const label = h('div.rx-label', 'GET READY');
    const sub = h('div.rx-sub', `ROUND ${chal.p + 1}/${s.parts}`);
    const pad = fastButton('button.rx-pad', { 'aria-label': 'Reaction pad' }, e => tap(e), label, sub);
    const log = h('div.rx-log', Array.from({ length: s.parts }, (_, i) => h('span.rx-chip', { class: i < chal.p ? 'is-done' : null }, i < chal.p ? '✓' : '—')));
    let mode = 'idle';
    let goAt = 0;
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const startRound = () => {
      if (chal.done || chal.p >= s.parts) return;
      mode = 'wait';
      pad.className = 'rx-pad is-wait';
      label.textContent = 'WAIT…';
      sub.textContent = `ROUND ${chal.p + 1}/${s.parts}`;
      later(go, s.delays[chal.p]);
    };
    const go = () => {
      mode = 'go';
      goAt = performance.now();
      pad.className = 'rx-pad is-go';
      label.textContent = 'TAP!';
      sfx('select');
      // time from the frame the flash actually paints
      requestAnimationFrame(() => { if (mode === 'go') goAt = performance.now(); });
      later(() => { if (mode === 'go') record(null, 'TOO SLOW'); }, REFLEX_TIMEOUT_MS);
    };
    const tap = e => {
      if (mode === 'wait') record(null, 'TOO EARLY');
      else if (mode === 'go') record(Math.max(0, (e && e.timeStamp ? e.timeStamp : performance.now()) - goAt));
    };
    const record = (ms, why) => {
      mode = 'shown';
      timers.forEach(clearTimeout);
      timers = [];
      const i = chal.p;
      chal.times[i] = ms;
      pad.className = `rx-pad ${ms == null ? 'is-miss' : 'is-hit'}`;
      label.textContent = ms == null ? why : `${Math.round(ms)} ms`;
      const chip = log.children[i];
      if (chip) { chip.textContent = ms == null ? '✕' : String(Math.round(ms)); chip.className = `rx-chip ${ms == null ? 'is-miss' : 'is-hit'}`; }
      part(ms == null ? 0 : reflexCredit(ms));
      if (!chal.done) later(startRound, 950);
    };
    later(startRound, 900);
    keyHandler = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(e); } };
    return { el: h('div.ch.ch-reflex', h('div.ch-prompt', 'TAP THE MOMENT IT FLASHES'), pad, log), destroy() { timers.forEach(clearTimeout); keyHandler = null; } };
  }

  // ---------- QUICK COUNT ----------
  const SHAPE_NAME = { tri: 'triangle', dot: 'circle', sq: 'square', dia: 'diamond' };
  const shape = id => h('i.qc-shape', { dataset: { s: id }, 'aria-label': SHAPE_NAME[id] });
  function uiCount(s) {
    const wrap = h('div.ch.ch-count');
    let timer = 0;
    let locked = false;
    const show = () => {
      if (chal.p >= s.items.length) return;
      const it = s.items[chal.p];
      locked = false;
      const grid = h('div.qc-grid', { style: { '--n': it.size } }, it.cells.map(c => h('span.qc-cell', c ? shape(c) : null)));
      wrap.replaceChildren(h('div.ch-prompt', `MEMORIZE · ${chal.p + 1}/${s.items.length}`), grid);
      timer = setTimeout(() => ask(it), it.flashMs);
    };
    const ask = it => {
      const opts = it.options.map(v => fastButton('button.qc-opt', { dataset: { v: String(v) } }, () => choose(v, it, opts), String(v)));
      wrap.replaceChildren(
        h('div.ch-prompt', `HOW MANY? · ${chal.p + 1}/${s.items.length}`),
        h('div.qc-ask', 'HOW MANY ', shape(it.target), ' ?'),
        h('div.qc-opts', opts));
    };
    const choose = (v, it, opts) => {
      if (locked || chal.done) return;
      locked = true;
      const credit = v === it.ans ? 1 : Math.abs(v - it.ans) === 1 ? 0.5 : 0;
      opts.find(b => Number(b.dataset.v) === it.ans).classList.add('is-correct');
      if (credit < 1) opts.find(b => Number(b.dataset.v) === v).classList.add(credit ? 'is-close' : 'is-wrong');
      part(credit);
      timer = setTimeout(() => { if (!chal.done) show(); }, credit === 1 ? 420 : 900);
    };
    show();
    return { el: wrap, destroy() { clearTimeout(timer); } };
  }

  // ---------- TRUE OR FALSE ----------
  function uiTrueFalse(s) {
    const wrap = h('div.ch.ch-tf');
    let locked = false;
    let yes, no;
    const show = () => {
      if (chal.p >= s.items.length) return;
      const it = s.items[chal.p];
      const text = h('p.tf-q', it.text);
      yes = fastButton('button.tf-btn.tf-true', {}, () => choose(true), 'TRUE');
      no = fastButton('button.tf-btn.tf-false', {}, () => choose(false), 'FALSE');
      wrap.replaceChildren(h('div.ch-prompt', `TRUE OR FALSE · ${chal.p + 1}/${s.items.length}`), text, h('div.tf-btns', no, yes));
      pulseClass(text, 'q-in');
    };
    const choose = v => {
      if (locked || chal.done) return;
      locked = true;
      const it = s.items[chal.p];
      const right = v === it.truth;
      (it.truth ? yes : no).classList.add('is-correct');
      if (!right) (v ? yes : no).classList.add('is-wrong');
      part(right);
      setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 260 : 800);
    };
    keyHandler = e => {
      const k = e.key.toLowerCase();
      if (k === 't' || k === 'arrowright') choose(true);
      else if (k === 'f' || k === 'arrowleft') choose(false);
    };
    show();
    return { el: wrap, destroy() { keyHandler = null; } };
  }

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
  }

  // ---------- LEXICON ----------
  function uiLexicon(s) {
    const valid = new Set(s.words);
    const found = [];
    let best = chal.extra.w || '';
    let order = s.letters.map((ch, i) => ({ ch, i }));
    let picked = [];
    const word = h('div.lx-word', { 'aria-live': 'polite' });
    const meter = h('div.lx-meter');
    const hint = h('div.lx-hint');
    const grid = h('div.lx-grid');
    const chips = h('div.lx-found');
    const paint = () => {
      word.replaceChildren(...(picked.length ? picked.map(t => h('span.lx-l', t.ch.toUpperCase())) : [h('span.lx-ph', 'TAP LETTERS')]));
      word.classList.toggle('is-empty', !picked.length);
      grid.replaceChildren(...order.map(t => fastButton('button.lx-tile', { class: picked.includes(t) ? 'is-used' : null, disabled: picked.includes(t), 'aria-label': t.ch }, () => add(t), t.ch.toUpperCase())));
      meter.replaceChildren(h('span', 'BEST ', h('b', best ? `${best.length}` : '–')), h('span', 'LONGEST POSSIBLE ', h('b', String(s.max))));
    };
    const say = (t, kind = '') => { hint.textContent = t; hint.className = `lx-hint is-on ${kind}`; clearTimeout(say.t); say.t = setTimeout(() => { hint.className = 'lx-hint'; }, 1300); };
    const add = t => { if (chal.done || picked.includes(t)) return; picked.push(t); sfx('key'); vibrate(5); paint(); };
    const back = () => { picked.pop(); paint(); };
    const submit = () => {
      if (chal.done) return;
      const w = picked.map(t => t.ch).join('');
      if (w.length < 3) { say('3+ LETTERS', 'is-warn'); return; }
      if (!valid.has(w)) { sfx('invalid'); vibrate([30, 30, 30]); pulseClass(word, 'shake', 450); say('NOT IN THE DICTIONARY', 'is-warn'); return; }
      if (found.includes(w)) { say('ALREADY FOUND', 'is-warn'); picked = []; paint(); return; }
      found.unshift(w);
      chips.prepend(h('span.lx-chip', { class: w.length >= best.length ? 'is-best' : null }, w.toUpperCase(), h('small', String(w.length))));
      picked = [];
      if (w.length > best.length) {
        best = w;
        chips.querySelectorAll('.lx-chip').forEach((c, k) => c.classList.toggle('is-best', k === 0));
        const max = best.length >= s.max;
        say(max ? 'LONGEST POSSIBLE!' : `NEW BEST · ${w.length} LETTERS`, 'is-good');
        sfx(max ? 'solve' : 'ocCorrect');
        vibrate(max ? [20, 40, 20] : 12);
        progress(lexiconOk(best.length, s.max), lexiconOk(best.length, s.max), { w: best }, max, 900);
      } else { say(`+ ${w.toUpperCase()}`, 'is-good'); sfx('ocCorrect'); }
      paint();
    };
    keyHandler = e => {
      if (/^[a-z]$/i.test(e.key)) { const t = order.find(x => x.ch === e.key.toLowerCase() && !picked.includes(x)); if (t) add(t); }
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter') submit();
    };
    if (best) chips.append(h('span.lx-chip.is-best', best.toUpperCase(), h('small', String(best.length))));
    paint();
    const el = h('div.ch.ch-lexicon',
      h('div.ch-prompt', 'BUILD THE LONGEST WORD'),
      meter, word, hint, grid,
      h('div.ch-actions.lx-actions',
        h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { order = shuffle(Math.random, order); paint(); } }, 'SHUFFLE'),
        h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-label': 'Delete letter', onclick: back }, '⌫'),
        h('button.btn.btn-primary.btn-sm.lx-go', { type: 'button', onclick: submit }, 'SUBMIT')),
      chips);
    return { el, destroy() { keyHandler = null; clearTimeout(say.t); } };
  }

  // ---------- TIMELINE ----------
  function uiTimeline(s) {
    let picks = [];
    const [from, to] = s.dir.split('→').map(x => x.trim());
    const submitBtn = h('button.btn.btn-primary.btn-block.tl-submit', { type: 'button', disabled: true, onclick: () => submit() }, 'LOCK IN ORDER');
    const rows = s.shown.map((_, idx) => fastButton('button.tm-item', { 'aria-label': s.items[s.shown[idx]].label }, () => tap(idx),
      h('span.tm-badge'), h('span.tm-label', s.items[s.shown[idx]].label), h('span.tm-val')));
    const paint = () => {
      rows.forEach((r, idx) => {
        const k = picks.indexOf(idx);
        r.classList.toggle('is-picked', k >= 0);
        r.querySelector('.tm-badge').textContent = k >= 0 ? String(k + 1) : '';
      });
      submitBtn.disabled = picks.length < 4;
    };
    const tap = idx => {
      if (chal.done) return;
      const k = picks.indexOf(idx);
      if (k >= 0) picks.splice(k, 1); else if (picks.length < 4) picks.push(idx);
      sfx(k >= 0 ? 'tap' : 'key');
      vibrate(6);
      paint();
    };
    const submit = () => {
      if (chal.done || picks.length < 4) return;
      const right = timelineCorrect(s, picks);
      rows.forEach((r, idx) => {
        const pos = s.shown[idx];
        r.classList.add(picks.indexOf(idx) === pos ? 'is-right' : 'is-wrong');
        r.querySelector('.tm-val').textContent = `#${pos + 1} · ${s.items[pos].value}`;
      });
      sfx(right === 4 ? 'solve' : right >= 2 ? 'ocCorrect' : 'ocWrong');
      vibrate(right === 4 ? [20, 40, 20] : 12);
      progress(right, 4, { o: picks.join('') }, true, 2200);
    };
    paint();
    const el = h('div.ch.ch-timeline',
      h('div.tm-head', h('span.tm-cat', s.title), h('p.tm-ask', s.ask)),
      h('div.tm-dir', h('span', '1 = ', h('b', from)), h('i', '→'), h('span', '4 = ', h('b', to))),
      h('div.tm-list', rows),
      submitBtn);
    return { el };
  }

  // ---------- CLOSEST CALL ----------
  function uiClosest(s) {
    let value = '';
    const display = h('div.cl-display');
    const unit = h('span.cl-unit', s.unit);
    const paint = () => {
      display.replaceChildren(h('span.cl-num', value ? fmtVal(value) : '0'), unit);
      display.classList.toggle('is-empty', !value);
      lock.disabled = !value || value === '.';
    };
    const press = k => {
      if (chal.done) return;
      if (k === '<') value = value.slice(0, -1);
      else if (k === '.') { if (!value.includes('.') && value.length < 10) value = (value || '0') + '.'; }
      else if (value.replace('.', '').length < 10) value = value === '0' ? k : value + k;
      sfx('key');
      vibrate(5);
      paint();
    };
    const go = () => {
      if (chal.done || !value || value === '.') return;
      const g = Number(value);
      if (!(g >= 0)) return;
      sfx('lock');
      vibrate(14);
      progress(closestCredit(g, s.answer), 1, { g }, true, 350);
    };
    const pad = h('div.keypad.cl-pad', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].map(k => fastButton('button.kp', { class: k === '<' ? 'kp-del' : null, 'aria-label': k === '<' ? 'Delete' : k }, () => press(k), k === '<' ? '⌫' : k)));
    const lock = h('button.btn.btn-primary.btn-block.cl-lock', { type: 'button', disabled: true, onclick: go }, 'LOCK IT IN');
    keyHandler = e => {
      if (/^[0-9.]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('<');
      else if (e.key === 'Enter') go();
    };
    paint();
    const el = h('div.ch.ch-closest',
      h('div.cl-card', h('span.cl-cat', s.cat.toUpperCase()), h('p.cl-q', s.q)),
      display, pad, lock);
    return { el, destroy() { keyHandler = null; } };
  }

  // ---------- REWIRE ----------
  function uiRewire(s) {
    const wrap = h('div.ch.ch-rewire');
    let idx = Math.min(1, Math.floor(chal.p));
    let solvedCount = Math.floor(chal.p);
    let pz, turns, vis, tiles, board, core, src, title;
    let pending = 0;
    const pipe = mask => {
      const seg = [];
      if (mask & 1) seg.push('<rect x="40" y="-2" width="20" height="52" rx="2"/>');
      if (mask & 2) seg.push('<rect x="50" y="40" width="52" height="20" rx="2"/>');
      if (mask & 4) seg.push('<rect x="40" y="50" width="20" height="52" rx="2"/>');
      if (mask & 8) seg.push('<rect x="-2" y="40" width="52" height="20" rx="2"/>');
      seg.push('<circle cx="50" cy="50" r="15"/>');
      return seg.join('');
    };
    const tileSvg = shape => `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="rw-dim">${pipe(REWIRE_SHAPES[shape])}</g><g class="rw-lit">${pipe(REWIRE_SHAPES[shape])}</g></svg>`;
    const save = () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        const pw = rewirePower(pz, turns);
        progress(rewireOk(solvedCount, pw.reach), rewireOk(solvedCount, pw.reach), { rw: turns.join('') });
      }, 400);
    };
    const flow = (pw, animate) => {
      tiles.forEach((t, i) => {
        const on = pw.lit.has(i);
        t.style.setProperty('--d', animate && on ? `${pw.depth.get(i) * 70}ms` : '0ms');
        t.classList.toggle('is-lit', on);
      });
      src.classList.toggle('is-on', pw.lit.size > 0);
      core.classList.toggle('is-on', pw.solved);
    };
    const build = () => {
      pz = s.puzzles[idx];
      const saved = chal.extra.rw && chal.extra.rw.length === pz.n * pz.n && idx === Math.floor(chal.p) ? [...chal.extra.rw].map(Number) : null;
      turns = saved || pz.start.slice();
      vis = turns.slice();
      tiles = pz.tiles.map((shape, i) => {
        const t = fastButton('button.rw-tile', { 'aria-label': `Tile ${Math.floor(i / pz.n) + 1}-${(i % pz.n) + 1}` }, () => turn(i));
        t.innerHTML = tileSvg(shape);
        t.firstChild.style.transform = `rotate(${vis[i] * 90}deg)`;
        return t;
      });
      board = h('div.rw-grid', { style: { '--n': pz.n } }, tiles);
      src = h('div.rw-src', { style: { '--r': pz.src, '--n': pz.n }, 'aria-hidden': 'true' }, h('i'));
      core = h('div.rw-core', { style: { '--r': pz.core, '--n': pz.n }, 'aria-hidden': 'true' }, h('i'), h('span', 'CORE'));
      title = h('div.ch-prompt', `CIRCUIT ${idx + 1}/2 · ${pz.n}×${pz.n}`);
      wrap.replaceChildren(title, h('div.rw-frame', src, board, core), h('div.rw-hint', 'TAP A TILE TO ROTATE IT'));
      pulseClass(wrap, 'q-in');
      flow(rewirePower(pz, turns), false);
    };
    let busy = false;
    const turn = i => {
      if (chal.done || busy) return;
      vis[i] += 1;
      turns[i] = (turns[i] + 1) % 4;
      tiles[i].firstChild.style.transform = `rotate(${vis[i] * 90}deg)`;
      sfx('key');
      vibrate(5);
      const pw = rewirePower(pz, turns);
      flow(pw, true);
      if (pw.solved) {
        busy = true;
        solvedCount += 1;
        clearTimeout(pending);
        sfx(solvedCount >= 2 ? 'solve' : 'ocCorrect');
        vibrate([20, 40, 30]);
        wrap.classList.add('is-solved');
        if (solvedCount >= 2) { progress(2, 2, { rw: '' }, true, 1300); return; }
        progress(rewireOk(1, 0), 1, { rw: '' });
        setTimeout(() => { busy = false; wrap.classList.remove('is-solved'); idx = 1; chal.extra.rw = ''; build(); }, 1100);
      } else save();
    };
    build();
    return { el: wrap, destroy() { clearTimeout(pending); } };
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
  }

  // ---------- MISSING LINK ----------
  function uiMissingLink(s) {
    const wrap = h('div.ch.ch-link');
    let idx = Math.min(1, Math.floor(chal.p));
    let busy = false;
    const input = h('input.ml-input', {
      type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off',
      spellcheck: 'false', enterkeyhint: 'go', 'aria-label': 'Your answer',
    });
    const blanks = h('div.ml-blanks', { 'aria-hidden': 'true' });
    const field = h('label.ml-field', blanks, input);
    const hint = h('div.ml-hint');
    const title = h('div.ch-prompt');
    const words = h('div.ml-words');
    const pz = () => s.puzzles[idx];
    const len = () => normWord(pz().answer).length;
    const go = fastButton('button.btn.btn-primary.ml-go', {}, () => submit(), 'ENTER');
    const skip = fastButton('button.btn.btn-ghost.ml-skip', {}, () => doSkip(), 'SKIP →');
    const paint = () => {
      const v = normWord(input.value);
      const cells = Math.max(len(), v.length);
      const focused = document.activeElement === input;
      blanks.style.setProperty('--n', cells);
      blanks.replaceChildren(...Array.from({ length: cells }, (_, i) => h('span.ml-cell', {
        class: [i < v.length ? 'is-full' : '', i >= len() ? 'is-extra' : '', focused && i === Math.min(v.length, cells - 1) ? 'is-caret' : ''].join(' '),
      }, v[i] || '')));
      field.classList.toggle('is-focus', focused);
    };
    const say = (t, cls = '') => { hint.textContent = t; hint.className = `ml-hint ${cls}`; };
    const show = () => {
      title.textContent = `PUZZLE ${idx + 1}/2 · ${len()} LETTERS`;
      words.replaceChildren(...pz().words.map((w, k) => h('div.ml-word', { style: { animationDelay: `${k * 90}ms` } }, w)));
      input.value = '';
      input.maxLength = len() + 3;
      skip.hidden = idx > 0;
      wrap.classList.remove('is-solved');
      say(matchMedia('(pointer: coarse)').matches ? 'TAP THE BOXES TO TYPE' : 'TYPE YOUR ANSWER · ENTER');
      paint();
    };
    const advance = () => { busy = false; if (chal.done) return; idx = 1; show(); };
    const success = () => {
      busy = true;
      wrap.classList.add('is-solved');
      blanks.replaceChildren(...[...normWord(pz().answer)].map((c, i) => h('span.ml-cell.is-full.is-win', { style: { animationDelay: `${i * 45}ms` } }, c)));
      say('LINKED!', 'is-good');
      part(true);
      if (!chal.done) setTimeout(advance, 950);
    };
    const submit = () => {
      if (busy || chal.done) return;
      const v = normWord(input.value);
      if (!v) { say('TYPE YOUR ANSWER FIRST', 'is-warn'); input.focus({ preventScroll: true }); return; }
      if (linkAccepts(v, pz())) { success(); return; }
      sfx('invalid');
      vibrate([30, 30, 30]);
      pulseClass(field, 'shake', 450);
      say('NOT IT — TRY AGAIN', 'is-warn');
      input.focus({ preventScroll: true });
      input.select();
    };
    const doSkip = () => {
      if (busy || chal.done || idx > 0) return;
      busy = true;
      say(`IT WAS ${normWord(pz().answer)}`, 'is-warn');
      part(false, true);
      setTimeout(advance, 1300);
    };
    input.addEventListener('input', () => {
      const clean = input.value.toUpperCase().replace(/[^A-Z]/g, '');
      if (clean !== input.value) input.value = clean;
      if (busy) return;
      sfx('key');
      paint();
      // the exact answer locks in by itself; anything else (a plural, a wrong guess) waits for ENTER
      if (normWord(input.value).length === len() && linkAccepts(input.value, pz())) success();
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    input.addEventListener('focus', paint);
    input.addEventListener('blur', paint);
    show();
    // desktop: type straight away (a phone needs a tap to raise its keyboard)
    if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => input.focus({ preventScroll: true }), 60);
    wrap.append(title, words, field, hint, h('div.ml-actions', skip, go));
    return { el: wrap, destroy() { input.blur(); } };
  }

  // ---------- SPELLCHECK ----------
  function uiSpellcheck(s) {
    const wrap = h('div.ch.ch-spell');
    let locked = false;
    let btns = [];
    const show = () => {
      if (chal.p >= s.items.length) return;
      const it = s.items[chal.p];
      btns = it.options.map((w, k) => fastButton('button.sp-opt', { 'aria-label': w }, () => choose(k), h('span.sp-key', String(k + 1)), h('span.sp-word', w)));
      wrap.replaceChildren(h('div.ch-prompt', `WHICH IS SPELLED RIGHT? · ${chal.p + 1}/${s.items.length}`), h('div.sp-opts', btns));
      pulseClass(wrap, 'q-in');
    };
    const choose = k => {
      if (locked || chal.done) return;
      locked = true;
      const it = s.items[chal.p];
      const right = k === it.ans;
      btns[it.ans].classList.add('is-correct');
      if (!right) btns[k].classList.add('is-wrong');
      btns.forEach((b, i) => { if (i !== it.ans && i !== k) b.classList.add('is-dim'); });
      part(right);
      setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 480 : 1100);
    };
    keyHandler = e => { const k = Number(e.key); if (k >= 1 && k <= 4) choose(k - 1); };
    show();
    return { el: wrap, destroy() { keyHandler = null; } };
  }

  // ---------- MAKE 24 ----------
  function uiMake24(s) {
    const wrap = h('div.ch.ch-m24');
    let idx = Math.min(1, Math.floor(chal.p));
    let tiles = [], history = [], sel = null, op = null, busy = false, uid = 0;
    const title = h('div.ch-prompt');
    const tileRow = h('div.m24-tiles');
    const status = h('div.m24-status');
    const OPS = { '+': 'Plus', '-': 'Minus', '*': 'Times', '/': 'Divided by' };
    const opBtns = Object.keys(OPS).map(o => fastButton('button.m24-op', { dataset: { op: o }, 'aria-label': OPS[o] }, () => pickOp(o), OP_SIGN[o]));
    const undoBtn = fastButton('button.btn.btn-ghost.btn-sm', {}, () => undo(), '↶ UNDO');
    const resetBtn = fastButton('button.btn.btn-ghost.btn-sm', {}, () => reset(), 'RESET');
    const skipBtn = fastButton('button.btn.btn-ghost.btn-sm', {}, () => doSkip(), 'SKIP →');
    const fmtV = v => (v[1] === 1 ? fmtSigned(v[0]) : `${fmtSigned(v[0])}/${v[1]}`);
    const say = (t, cls = '') => { status.textContent = t; status.className = `m24-status ${cls}`; };
    const paint = fresh => {
      tileRow.style.setProperty('--n', tiles.length);
      tileRow.replaceChildren(...tiles.map((t, k) => fastButton('button.m24-tile', {
        class: [t.id === sel ? 'is-sel' : '', t.id === fresh ? 'is-new' : ''].join(' '), 'aria-label': `Tile ${fmtV(t.v)}`, dataset: { k: String(k) },
      }, () => pickTile(t.id), fracEl(t.v))));
      opBtns.forEach(b => b.classList.toggle('is-on', b.dataset.op === op));
      wrap.classList.toggle('has-sel', sel != null);
      undoBtn.disabled = !history.length;
      resetBtn.disabled = !history.length;
    };
    const show = () => {
      tiles = s.puzzles[idx].nums.map(n => ({ id: uid++, v: [n, 1] }));
      history = []; sel = null; op = null;
      title.textContent = `PUZZLE ${idx + 1}/2 · ${idx ? 'HARD' : 'EASY'}`;
      skipBtn.hidden = idx > 0;
      wrap.classList.remove('is-solved');
      say('NUMBER → OPERATOR → NUMBER');
      paint();
      pulseClass(tileRow, 'q-in');
    };
    const next = () => { busy = false; if (chal.done) return; idx = 1; show(); };
    const pickTile = id => {
      if (busy || chal.done) return;
      if (sel == null || (op == null && sel !== id)) { sel = id; sfx('key'); vibrate(5); paint(); return; }
      if (sel === id) { sel = null; op = null; sfx('tap'); paint(); return; }
      merge(sel, op, id);
    };
    const pickOp = o => {
      if (busy || chal.done) return;
      if (sel == null) { say('PICK A NUMBER FIRST', 'is-warn'); pulseClass(tileRow, 'nudge', 400); return; }
      op = op === o ? null : o;
      sfx('tap');
      vibrate(5);
      paint();
    };
    const merge = (aId, o, bId) => {
      const a = tiles.find(t => t.id === aId), b = tiles.find(t => t.id === bId);
      const v = applyOp(a.v, o, b.v);
      if (!v) { sfx('invalid'); pulseClass(tileRow, 'shake', 450); say('YOU CAN’T DIVIDE BY ZERO', 'is-warn'); op = null; paint(); return; }
      history.push(tiles.map(t => ({ ...t })));
      const t = { id: uid++, v };
      tiles = tiles.flatMap(x => (x.id === aId ? [] : x.id === bId ? [t] : [x]));
      sel = tiles.length > 1 ? t.id : null; // keep going from the result
      op = null;
      sfx('select');
      vibrate(8);
      paint(t.id);
      if (tiles.length > 1) { say(`${fmtV(a.v)} ${OP_SIGN[o]} ${fmtV(b.v)} = ${fmtV(v)}`); return; }
      if (v[0] === 24 && v[1] === 1) {
        busy = true;
        wrap.classList.add('is-solved');
        say('24 — SOLVED!', 'is-good');
        part(true);
        if (!chal.done) setTimeout(next, 1000);
      } else {
        sfx('invalid');
        pulseClass(tileRow, 'shake', 450);
        say(`THAT MAKES ${fmtV(v)} — UNDO OR RESET`, 'is-warn');
      }
    };
    const undo = () => { if (busy || !history.length) return; tiles = history.pop(); sel = null; op = null; sfx('tap'); say('UNDONE'); paint(); };
    const reset = () => { if (busy || !history.length) return; tiles = history[0]; history = []; sel = null; op = null; sfx('tap'); say('BACK TO THE START'); paint(); };
    const doSkip = () => {
      if (busy || chal.done || idx > 0) return;
      busy = true;
      say(`ONE WAY: ${s.puzzles[0].sol}`, 'is-warn');
      part(false, true);
      setTimeout(next, 1800);
    };
    keyHandler = e => {
      if (OPS[e.key] || e.key === 'x') pickOp(e.key === 'x' ? '*' : e.key);
      else if (/^[1-4]$/.test(e.key) && tiles[Number(e.key) - 1]) pickTile(tiles[Number(e.key) - 1].id);
      else if (e.key === 'Backspace') undo();
      else if (e.key === 'Escape') reset();
    };
    show();
    wrap.append(title, h('div.m24-target', h('small', 'MAKE'), h('b', '24')), tileRow, h('div.m24-ops', opBtns), status, h('div.ch-actions.m24-actions', undoBtn, resetBtn, skipBtn));
    return { el: wrap, destroy() { keyHandler = null; } };
  }

  // ---------- COMPASS ----------
  function uiCompass(s) {
    const wrap = h('div.ch.ch-compass');
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let r = chal.p;
    let mode = 'idle';
    let rot = 0;
    const needle = h('div.cp-needle', { html: NEEDLE_SVG });
    const rose = h('div.cp-rose', { html: ROSE_SVG }, needle);
    const card = h('div.cp-card');
    const dots = h('div.cp-dots');
    const title = h('div.ch-prompt');
    const btns = COMPASS_DIRS.map((d, i) => fastButton(`button.cp-dir.cp-${d.toLowerCase()}`, { disabled: true, 'aria-label': DIR_NAME[d] }, () => answer(i), d));
    const point = dir => { rot += ((((dir * 90 - rot) % 360) + 540) % 360) - 180; needle.style.transform = `rotate(${rot}deg)`; };
    const setDirs = on => btns.forEach(b => { b.disabled = !on; b.classList.remove('is-correct', 'is-wrong'); });
    const round = () => {
      if (chal.done || r >= s.rounds.length) return;
      const R = s.rounds[r];
      mode = 'start';
      title.textContent = `ROUND ${r + 1}/${s.rounds.length} · ${R.turns.length} TURNS`;
      setDirs(false);
      wrap.classList.remove('is-asking');
      needle.classList.remove('is-hidden');
      point(R.start);
      card.className = 'cp-card is-start';
      card.replaceChildren(h('small', 'YOU’RE FACING'), h('b', DIR_NAME[COMPASS_DIRS[R.start]]));
      pulseClass(card, 'tick');
      dots.replaceChildren(...[...R.turns].map(() => h('i')));
      sfx('select');
      let t = COMPASS_START_MS[r];
      [...R.turns].forEach((turn, k) => {
        later(() => {
          mode = 'turns';
          needle.classList.add('is-hidden');
          card.className = 'cp-card is-turn';
          card.replaceChildren(h('span.cp-ico', { html: TURN_SVG[turn] }), h('b', TURN_TEXT[turn]));
          pulseClass(card, 'tick');
          dots.children[k] && dots.children[k].classList.add('on');
          sfx('node', { i: k % 9 });
        }, t);
        t += COMPASS_STEP_MS[r];
        later(() => { card.className = 'cp-card is-gap'; }, t);
        t += COMPASS_GAP_MS;
      });
      later(() => {
        mode = 'ask';
        (chal.local.askAt ||= [])[r] = Math.round(serverNow() - g().playStartAt); // E2E: when each question came up
        card.className = 'cp-card is-ask';
        card.replaceChildren(h('b', 'WHICH WAY NOW?'));
        wrap.classList.add('is-asking');
        setDirs(true);
      }, t);
    };
    const answer = d => {
      if (mode !== 'ask' || chal.done) return;
      mode = 'shown';
      const R = s.rounds[r];
      const right = d === R.ans;
      setDirs(false);
      wrap.classList.remove('is-asking');
      btns[R.ans].classList.add('is-correct');
      if (!right) btns[d].classList.add('is-wrong');
      needle.classList.remove('is-hidden');
      point(R.ans);
      card.className = `cp-card ${right ? 'is-right' : 'is-miss'}`;
      card.replaceChildren(h('b', right ? 'CORRECT' : `IT WAS ${DIR_NAME[COMPASS_DIRS[R.ans]]}`));
      part(right);
      r = chal.p;
      if (!chal.done) later(round, COMPASS_FLASH_MS);
    };
    keyHandler = e => {
      const k = { arrowup: 0, n: 0, arrowright: 1, e: 1, arrowdown: 2, s: 2, arrowleft: 3, w: 3 }[e.key.toLowerCase()];
      if (k != null) { e.preventDefault(); answer(k); }
    };
    wrap.append(title, card, dots, h('div.cp-grid', btns[0], btns[3], rose, btns[1], btns[2]));
    later(round, 350);
    return { el: wrap, destroy() { timers.forEach(clearTimeout); keyHandler = null; } };
  }

  // ---------- SORT IT ----------
  function uiSortIt(s) {
    const wrap = h('div.ch.ch-sort');
    const loc = chal.local.sort || (chal.local.sort = { ...sortSplit(chal.ok, chal.p), log: [] });
    let i = chal.p;
    let busy = true;
    let card = null;
    let timer = 0;
    let drag = null;
    const sideL = h('div.st-side.st-left', h('i', '←'), h('b', s.left));
    const sideR = h('div.st-side.st-right', h('b', s.right), h('i', '→'));
    const flashL = h('div.st-flash.st-flash-l');
    const flashR = h('div.st-flash.st-flash-r');
    const deck = h('div.st-deck');
    const fill = h('i');
    const bar = h('div.st-bar', fill);
    const count = h('div.st-count');
    const hint = h('div.st-hint', 'SWIPE THE CARD — OR TAP A SIDE');
    const paintCount = () => count.replaceChildren(
      h('span', `CARD ${Math.min(i + 1, s.cards.length)}/${s.cards.length}`),
      h('span.st-tally', h('b.is-ok', `✓ ${loc.right}`), h('b.is-bad', `✕ ${loc.wrong}`)));
    const deal = () => {
      if (chal.done || i >= s.cards.length) return;
      card = h('div.st-card.is-in', h('span', s.cards[i].t));
      deck.replaceChildren(...(i + 1 < s.cards.length ? [h('div.st-card.is-back')] : []), card);
      const ms = sortWindowMs(i);
      fill.style.transition = 'none';
      fill.style.transform = 'scaleX(1)';
      void fill.offsetWidth;
      fill.style.transition = `transform ${ms}ms linear`;
      fill.style.transform = 'scaleX(0)';
      clearTimeout(timer);
      timer = setTimeout(() => commit(null), ms);
      busy = false;
      paintCount();
    };
    const commit = side => {
      if (busy || chal.done || !card) return;
      busy = true;
      clearTimeout(timer);
      const c = s.cards[i];
      const ok = side === c.s;
      if (ok) loc.right += 1; else loc.wrong += 1;
      loc.log[i] = side;
      const el = card;
      card = null;
      const dir = side == null ? 0 : side === 0 ? -1 : 1;
      el.classList.remove('is-in', 'is-drag');
      el.classList.add(ok ? 'is-right' : 'is-wrong', 'is-out');
      el.style.transform = dir ? `translateX(${dir * 135}%) rotate(${dir * 20}deg)` : 'translateY(45%) scale(0.85)';
      const fl = (side ?? c.s) === 0 ? flashL : flashR;
      fl.classList.remove('is-ok', 'is-bad');
      fl.classList.add(ok ? 'is-ok' : 'is-bad');
      pulseClass(fl, 'on', 450);
      hint.textContent = ok ? 'SWIPE THE CARD — OR TAP A SIDE' : side == null ? `TOO SLOW — ${c.s ? s.right : s.left}` : `NOPE — ${c.s ? s.right : s.left}`;
      hint.classList.toggle('is-warn', !ok);
      sfx(ok ? 'ocCorrect' : 'ocWrong');
      vibrate(ok ? 10 : [20, 30, 20]);
      i += 1;
      step(sortOk(loc.right, loc.wrong), i, ok ? 'ok' : 'miss', i >= s.cards.length, 600);
      paintCount();
      if (i < s.cards.length) setTimeout(deal, 230);
    };
    const springBack = () => { if (card) { card.classList.remove('is-drag'); card.style.transform = ''; card.style.removeProperty('--lean'); } sideL.classList.remove('is-hot'); sideR.classList.remove('is-hot'); };
    wrap.addEventListener('pointerdown', e => {
      if (busy || !card || chal.done || drag) return;
      e.preventDefault();
      const now = performance.now();
      drag = { id: e.pointerId, x: e.clientX, t: now, dx: 0, moved: false, lx: e.clientX, lt: now, vx: 0 };
      try { wrap.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
      card.classList.add('is-drag');
    });
    wrap.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id || !card) return;
      const now = performance.now();
      drag.dx = e.clientX - drag.x;
      if (now > drag.lt) { drag.vx = (e.clientX - drag.lx) / (now - drag.lt); drag.lx = e.clientX; drag.lt = now; }
      if (Math.abs(drag.dx) > 8) drag.moved = true;
      card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 16}deg)`;
      card.style.setProperty('--lean', Math.min(1, Math.abs(drag.dx) / 90).toFixed(2));
      card.dataset.lean = drag.dx < 0 ? 'l' : 'r';
      sideL.classList.toggle('is-hot', drag.dx < -30);
      sideR.classList.toggle('is-hot', drag.dx > 30);
    });
    wrap.addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!card) return;
      const box = wrap.getBoundingClientRect();
      if (Math.abs(d.dx) > 70 || (Math.abs(d.dx) > 24 && Math.abs(d.vx) > 0.45)) { springBack(); commit(d.dx < 0 ? 0 : 1); }
      else if (!d.moved && performance.now() - d.t < 450) { springBack(); commit(e.clientX < box.left + box.width / 2 ? 0 : 1); }
      else springBack();
    });
    wrap.addEventListener('pointercancel', () => { drag = null; springBack(); });
    keyHandler = e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); commit(0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); commit(1); }
    };
    wrap.append(h('div.st-sides', sideL, sideR), count, h('div.st-table', flashL, deck, flashR), bar, hint);
    paintCount();
    setTimeout(deal, 300);
    return { el: wrap, destroy() { clearTimeout(timer); keyHandler = null; } };
  }

  // ---------- HIGHER OR LOWER ----------
  function uiHigherLower(s) {
    const wrap = h('div.ch.ch-hl');
    let k = Math.floor(chal.ok);
    let locked = false;
    let opts = [];
    const streak = h('div.hl-streak');
    const paintStreak = () => streak.replaceChildren(h('small', 'STREAK'), h('b', String(k)), h('span', `/${s.pairs.length}`));
    const show = () => {
      if (chal.done || k >= s.pairs.length) return;
      const P = s.pairs[k];
      opts = [P.a, P.b].map((x, side) => fastButton('button.hl-opt', { 'aria-label': x.name }, () => choose(side), h('span.hl-name', x.name), h('span.hl-val')));
      wrap.replaceChildren(
        h('div.hl-head', h('span.hl-stat', P.stat), streak),
        h('p.hl-ask', P.ask),
        h('div.hl-opts', opts[0], h('div.hl-vs', 'VS'), opts[1]));
      paintStreak();
      pulseClass(wrap, 'q-in');
    };
    const choose = side => {
      if (locked || chal.done) return;
      locked = true;
      const P = s.pairs[k];
      const right = side === P.ans;
      [P.a, P.b].forEach((x, j) => { opts[j].querySelector('.hl-val').textContent = fmtStat(P.unit, x.v, x.shown); opts[j].classList.add('is-shown'); });
      opts[P.ans].classList.add('is-correct');
      opts[1 - P.ans].classList.add(right ? 'is-dim' : 'is-wrong');
      sfx(right ? 'ocCorrect' : 'ocWrong');
      vibrate(right ? 12 : [20, 30, 20]);
      if (!right) { step(k, k + 1, 'miss', true, 1700); return; }
      k += 1;
      paintStreak();
      pulseClass(streak, 'tick');
      step(k, k, 'ok', k >= s.pairs.length, 1200);
      if (k < s.pairs.length) setTimeout(() => { locked = false; show(); }, 1250);
    };
    keyHandler = e => { if (e.key === '1' || e.key === 'ArrowUp') choose(0); else if (e.key === '2' || e.key === 'ArrowDown') choose(1); };
    show();
    return { el: wrap, destroy() { keyHandler = null; } };
  }

  // ---------- reveals for the newest six ----------
  const solvedBoth = (game, uids) => { const res = (game.results && game.results[game.ci]) || {}; return uids.filter(u => res[u] && res[u].ok >= 2).length; };
  function revealLink(spec, game, boards, uids) {
    const both = solvedBoth(game, uids);
    return h('section.rv.rv-ml',
      h('div.rv-kicker', 'THE MISSING LINKS', h('span.rv-ask', 'Each word joins the answer, before or after.')),
      spec.puzzles.map((p, k) => h('div.rv-ml-row', { style: { animationDelay: `${250 + k * 350}ms` } },
        h('span.rv-ml-words', p.words.join(' · ')), h('i', '→'), h('b', normWord(p.answer)))),
      h('div.rv-us-count', h('b', `${both}/${uids.length}`), ' LINKED BOTH'));
  }
  function revealSpell(spec) {
    return h('section.rv.rv-sp',
      h('div.rv-kicker', 'THE RIGHT SPELLINGS', h('span.rv-ask', 'Next to the usual mistake, crossed out.')),
      h('ol.rv-sp-list', spec.items.map((it, k) => h('li', { style: { animationDelay: `${200 + k * 150}ms` } },
        h('b', it.word), h('s', it.common)))));
  }
  function revealM24(spec, game, boards, uids) {
    const both = solvedBoth(game, uids);
    return h('section.rv.rv-m24',
      h('div.rv-kicker', 'ONE WAY TO MAKE 24', h('span.rv-ask', 'There’s often more than one.')),
      spec.puzzles.map((p, k) => h('div.rv-m24-row', { style: { animationDelay: `${250 + k * 350}ms` } },
        h('span.rv-m24-tiles', [...p.nums].sort((a, b) => a - b).map(n => h('i', String(n)))),
        h('b.rv-m24-sol', `${p.sol} = 24`),
        h('small', k ? 'HARD' : 'EASY'))),
      h('div.rv-us-count', h('b', `${both}/${uids.length}`), ' SOLVED BOTH'));
  }
  function revealCompass(spec) {
    const TURN_CHIP = { L: 'L', R: 'R', A: '180°' };
    const rows = spec.rounds.map((R, k) => {
      const needle = h('i.rv-cp-needle');
      const turns = h('div.rv-cp-turns', [...R.turns].map(t => h('span', TURN_CHIP[t])));
      const out = h('b.rv-cp-out', COMPASS_DIRS[R.ans]);
      let rot = R.start * 90;
      needle.style.transform = `rotate(${rot}deg)`;
      [...R.turns].forEach((t, j) => revealTimers.push(setTimeout(() => {
        rot += COMPASS_TURN[t] === 3 ? -90 : COMPASS_TURN[t] * 90;
        needle.style.transform = `rotate(${rot}deg)`;
        turns.children[j].classList.add('on');
        if (j === R.turns.length - 1) out.classList.add('on');
      }, 700 + k * 90 + j * 420)));
      return h('div.rv-cp-row', { style: { animationDelay: `${120 + k * 90}ms` } },
        h('span.rv-cp-start', COMPASS_DIRS[R.start]), h('div.rv-cp-rose', needle), turns, out);
    });
    return h('section.rv.rv-cp', h('div.rv-kicker', 'THE TURNS, PLAYED OUT', h('span.rv-ask', 'Where you started, every turn, where you ended.')), h('div.rv-cp-list', rows));
  }
  function revealSort(spec, game) {
    const mine = chal && chal.key === ckey(game) && chal.local.sort ? chal.local.sort.log : null;
    const col = side => h('div.rv-st-col',
      h('div.rv-st-label', side ? spec.right : spec.left),
      spec.cards.map((c, i) => ({ c, i })).filter(x => x.c.s === side).map(({ c, i }) => h('span.rv-st-chip', {
        class: mine && i in mine && mine[i] !== side ? 'is-miss' : null,
        style: { animationDelay: `${200 + i * 60}ms` },
      }, c.t)));
    return h('section.rv.rv-st',
      h('div.rv-kicker', 'WHERE THEY BELONG', h('span.rv-ask', 'All twelve cards, on the right side.')),
      h('div.rv-st-cols', col(0), col(1)),
      mine && mine.some((v, i) => v !== spec.cards[i].s) ? h('div.rv-st-note', 'RED = YOU SORTED IT THE OTHER WAY') : null);
  }
  function revealHL(spec, game, boards, uids) {
    const res = (game.results && game.results[game.ci]) || {};
    const runs = uids.map(u => ({ u, s: Math.floor((res[u] && res[u].ok) || 0), p: (boards[u] && boards[u].p) || 0 }));
    const best = Math.max(0, ...runs.map(x => x.s));
    const leaders = runs.filter(x => best > 0 && x.s === best).map(x => player(x.u).name);
    // the pair that ended the most runs (a run that ended on a miss has p = streak + 1)
    const ends = {};
    for (const x of runs) if (x.p > x.s) ends[x.s] = (ends[x.s] || 0) + 1;
    const worst = Object.entries(ends).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const pair = P => h('div.rv-hl-pair',
      h('div.rv-hl-ask', P.ask),
      [P.a, P.b].map((x, i) => h('div.rv-hl-item', { class: i === P.ans ? 'is-win' : null }, h('span', x.name), h('b', fmtStat(P.unit, x.v, x.shown)))));
    return h('section.rv.rv-hl',
      h('div.rv-kicker', best ? `LONGEST STREAK · ${best}` : 'NO STREAKS THIS TIME', leaders.length ? h('span.rv-ask', leaders.join(' & ')) : null),
      worst ? [h('div.rv-hl-sub', `THE ONE THAT TRIPPED UP ${worst[1]} ${worst[1] === 1 ? 'PLAYER' : 'PLAYERS'}`), pair(spec.pairs[Number(worst[0])])]
        : best >= spec.pairs.length ? h('div.rv-hl-sub', 'A PERFECT 10 — NOBODY SLIPPED') : null);
  }

  // ---------- overlays ----------
  function buildOverlay(game) {
    cancelAnimationFrame(introRaf);
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    clear(els.overlay);
    els.overlay.className = `oc-overlay ov-${game.phase}`;
    if (game.phase === 'ready') buildReady(game);
    else if (game.phase === 'standings') buildStandings(game);
    else if (game.phase === 'final') buildFinal(game);
  }

  function buildReady(game) {
    const type = game.order[game.ci];
    const info = INFO[type];
    const isFinal = game.ci === game.total - 1;
    const num = h('div.oc-count');
    const card = h('div.oc-ready', { class: game.brief ? 'is-brief' : null },
      h('div.oc-ready-kicker', isFinal ? 'FINAL CHALLENGE · DOUBLE POINTS' : `CHALLENGE ${String(game.ci + 1).padStart(2, '0')} / ${game.total}`),
      h('div.oc-glyph', info.glyph),
      h('div.oc-ready-name', { 'data-text': info.name }, info.name),
      game.brief ? h('ul.oc-rules', info.rules.map(r => h('li', r))) : null,
      num);
    els.overlay.append(card);
    if (isFinal) root.classList.add('is-final');
    sfx(game.brief ? 'join' : 'tick');
    let last = '';
    const tick = () => {
      const left = game.phaseEndsAt - serverNow();
      const t = left > 0 && left <= 3000 ? String(Math.ceil(left / 1000)) : left > 3000 ? '' : 'GO';
      if (t !== last) { last = t; num.textContent = t; if (t) { pulseClass(num, 'tick'); if (t !== 'GO') sfx('tick'); } }
      if (left > -300) introRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function buildStandings(game) {
    const now = standings(game, game.ci);
    const prev = standings(game, game.ci - 1);
    const prevMap = Object.fromEntries(prev.map(r => [r.uid, r]));
    const res = (game.results && game.results[game.ci]) || {};
    const rows = now.map(r => ({
      ...r,
      prevScore: prevMap[r.uid] ? prevMap[r.uid].score : 0,
      prevRank: game.ci > 0 && prevMap[r.uid] ? prevMap[r.uid].rank : null,
      delta: res[r.uid] ? res[r.uid].pts : 0,
      note: noteFor(game, res[r.uid], boardsNow(game)[r.uid]),
    }));
    const next = game.order[game.ci + 1];
    const mine = res[me()];
    if (mine) sfx(mine.ok >= mine.parts ? 'correct' : 'roundEnd');
    els.overlay.append(h('div.panel-full.oc-standings',
      reveal(game),
      h('div.sheet-kicker', `LEADERBOARD // AFTER ${String(game.ci + 1).padStart(2, '0')}`),
      leaderboard(rows, st.players, { me: me(), presence: st.presence }),
      next ? h('div.next-up', 'NEXT: ', h('b', INFO[next].name), game.ci + 1 === game.total - 1 ? ' · ×2 POINTS' : '') : null));
  }

  function noteFor(game, r, b) {
    if (!r) return '';
    const type = game.order[game.ci];
    b = b || {};
    if (type === 'reflex') return `REFLEX ${Math.round((100 * r.ok) / r.parts)}%`;
    if (type === 'lexicon') return b.w ? `BEST: ${b.w.toUpperCase()}` : 'NO WORD';
    if (type === 'timeline') return `${fmtOk(r.ok)}/4 IN PLACE`;
    if (type === 'rewire') return `${Math.floor(r.ok)}/2 CIRCUITS`;
    if (type === 'missinglink') return `${fmtOk(r.ok)}/2 LINKED`;
    if (type === 'make24') return `${fmtOk(r.ok)}/2 SOLVED`;
    if (type === 'higherlower') return `STREAK ${Math.floor(r.ok)}`;
    if (type === 'sortit') return b.p ? `${sortSplit(r.ok, b.p).right}/${SORT_CARDS} SORTED RIGHT` : 'NO SORTS';
    if (type === 'closest') {
      const spec = chal && chal.spec && chal.spec.type === 'closest' ? chal.spec : buildSpec(game);
      return b.g == null || !spec ? 'NO GUESS' : `${fmtVal(b.g)} · ${Math.round((100 * Math.abs(b.g - spec.answer)) / spec.answer)}% OFF`;
    }
    return `${fmtOk(r.ok)}/${r.parts} CORRECT`;
  }

  // The reveal above the leaderboard: best words, the right order, or the number line.
  function reveal(game) {
    const type = game.order[game.ci];
    const NEW_REVEAL = { missinglink: revealLink, spellcheck: revealSpell, make24: revealM24, compass: revealCompass, sortit: revealSort, higherlower: revealHL };
    if (!NEW_REVEAL[type] && !['lexicon', 'timeline', 'closest', 'unscramble'].includes(type)) return null;
    const spec = buildSpec(game);
    if (!spec) return null;
    const boards = boardsNow(game);
    const uids = Object.keys(game.participants || {});
    if (NEW_REVEAL[type]) return NEW_REVEAL[type](spec, game, boards, uids);
    if (type === 'unscramble') {
      const res = (game.results && game.results[game.ci]) || {};
      const solved = uids.filter(u => res[u] && res[u].ok >= 1).length;
      return h('section.rv.rv-us',
        h('div.rv-kicker', 'THE WORD WAS',
          h('div.rv-best', h('b', spec.word.toUpperCase()), h('small', `FROM ${spec.letters.join('').toUpperCase()}`))),
        h('div.rv-us-count', h('b', `${solved}/${uids.length}`), solved === 1 ? ' PLAYER CRACKED IT' : ' PLAYERS CRACKED IT'));
    }
    if (type === 'lexicon') {
      const rows = uids.map(uid => ({ uid, w: (boards[uid] && boards[uid].w) || '' })).sort((a, b) => b.w.length - a.w.length);
      return h('section.rv.rv-lex',
        h('div.rv-kicker', 'LONGEST POSSIBLE', h('div.rv-best', spec.best.map(w => h('b', w.toUpperCase())), h('small', `${spec.max} LETTERS`))),
        h('div.rv-words', rows.map((r, k) => {
          const p = player(r.uid);
          return h('div.rv-word', { class: r.w.length === spec.max ? 'is-max' : null, style: { '--c': colorHex(p.color), animationDelay: `${300 + k * 90}ms` } },
            h('span.rv-name', p.name), h('span.rv-w', r.w ? r.w.toUpperCase() : '—'), h('small', r.w ? String(r.w.length) : ''));
        })));
    }
    if (type === 'timeline') {
      return h('section.rv.rv-tl',
        h('div.rv-kicker', `${spec.title} · ${spec.dir}`, h('span.rv-ask', spec.ask)),
        h('ol.rv-order', spec.items.map((it, k) => h('li', { style: { animationDelay: `${250 + k * 220}ms` } },
          h('span.rv-pos', String(k + 1)), h('span.rv-label', it.label), h('b.rv-val', it.value)))));
    }
    return numberLine(spec, boards, uids);
  }

  function numberLine(spec, boards, uids) {
    const entries = uids.filter(u => boards[u] && typeof boards[u].g === 'number').map(u => ({ uid: u, g: boards[u].g, err: Math.abs(boards[u].g - spec.answer) / spec.answer }));
    const vals = [...entries.map(e => e.g), spec.answer];
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const log = lo > 0 && hi / lo > 30;
    const f = v => (log ? Math.log10(Math.max(v, lo)) : v);
    let a = f(lo), b = f(hi);
    if (b - a < 1e-9) { a -= 1; b += 1; }
    const pad = (b - a) * 0.08;
    a -= pad; b += pad;
    const pos = v => Math.max(0, Math.min(1, (f(v) - a) / (b - a)));
    const best = entries.length ? Math.min(...entries.map(e => e.err)) : null;
    // labels alternate above / below the line, nudged apart when crowded
    const sorted = [...entries].sort((x, y) => x.g - y.g);
    const lanes = [-Infinity, -Infinity, -Infinity, -Infinity];
    const markers = sorted.map((e, k) => {
      const x = pos(e.g);
      let lane = k % 2;
      if (x - lanes[lane] < 0.18) lane += 2;
      if (lane > 3) lane = k % 4;
      lanes[lane] = x;
      const p = player(e.uid);
      return h('div.nl-mark', {
        class: [`lane-${lane}`, e.err === best ? 'is-closest' : ''].join(' '),
        style: { '--x': x, '--c': colorHex(p.color), animationDelay: `${200 + k * 120}ms` },
      }, h('i'), h('span.nl-tag', h('b', p.name), h('small', fmtVal(e.g))));
    });
    const answer = h('div.nl-answer', { style: { '--x': pos(spec.answer) } }, h('i'), h('span', h('small', 'ANSWER'), h('b', `${fmtVal(spec.answer)} ${spec.unit}`)));
    const winner = entries.filter(e => e.err === best).map(e => player(e.uid).name);
    sfx('shimmer');
    return h('section.rv.rv-cc',
      h('div.rv-kicker', spec.q),
      h('div.nl', h('div.nl-track'), h('div.nl-lo', fmtVal(Math.round(log ? 10 ** (a + pad) : lo))), h('div.nl-hi', fmtVal(Math.round(log ? 10 ** (b - pad) : hi))), markers, answer),
      winner.length ? h('div.nl-win', { style: { animationDelay: '2.3s' } }, 'CLOSEST: ', h('b', winner.join(' & ')), ' · +60') : h('div.nl-win', 'NO GUESSES'));
  }

  function buildFinal(game) {
    final = createFinal({
      rows: standings(game), players: st.players, me: me(), presence: st.presence, scoreLabel: 'PTS',
      kicker: 'GAUNTLET COMPLETE',
      winnerLine: nm => `${nm} RAN THE HOTTEST`,
    });
    els.overlay.append(final.el);
  }

  return { mount, update, unmount };
}
