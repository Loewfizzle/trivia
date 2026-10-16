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
} from './challenges.js';
import { bankFor, loadBank, preloadFor } from './banks.js';
import { CHALLENGE_MS, levelOf, totals, standings } from './logic.js';

const GHOST = { name: 'GHOST', color: 'yellow', avatar: 'ghost' };
// 3, 2.5, 3.47 → '3', '2.5', '3.5' (partial credit)
const fmtOk = n => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString());
// 1234.5 → '1,234.5' (Closest Call)
const fmtVal = v => { const [i, d] = String(v).split('.'); return Number(i).toLocaleString('en-US') + (d != null ? `.${d}` : ''); };
const BANK_TYPES = ['lexicon', 'timeline', 'closest'];

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
    loadLengths([5, 6, 7]).then(() => { wordsReady = true; if (st) update(st); }).catch(() => {});
    if (state.game && state.game.order) preloadFor(state.game.order).then(() => { if (st) update(st); });
    // test hook (emulator runs only): the E2E compares puzzles across phones and reads progress
    if (/[?&]emu\b/.test(location.search)) {
      window.__oc = {
        spec: () => chal && chal.spec,
        state: () => chal && { type: chal.spec.type, ok: chal.ok, p: chal.p, done: chal.done, extra: chal.extra },
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
      chal = { key, spec, parts: spec.parts, p: mine.p || 0, ok: mine.ok || 0, done: !!mine.done, ui: null, marks: [], times: [], extra: {} };
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
      btns = it.order.map((id, k) => fastButton('button.cc-opt', { dataset: { c: id }, 'aria-label': `${STROOP_COLORS[id].name} ink` }, () => choose(id), h('span.cc-key', String(k + 1)), STROOP_COLORS[id].name));
      wrap.replaceChildren(h('div.ch-prompt', `TAP THE INK COLOR · ${chal.p + 1}/${s.items.length}`), word, h('div.cc-opts', btns));
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

  // ---------- overlays ----------
  function buildOverlay(game) {
    cancelAnimationFrame(introRaf);
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
    if (type === 'closest') {
      const spec = chal && chal.spec && chal.spec.type === 'closest' ? chal.spec : buildSpec(game);
      return b.g == null || !spec ? 'NO GUESS' : `${fmtVal(b.g)} · ${Math.round((100 * Math.abs(b.g - spec.answer)) / spec.answer)}% OFF`;
    }
    return `${fmtOk(r.ok)}/${r.parts} CORRECT`;
  }

  // The reveal above the leaderboard: best words, the right order, or the number line.
  function reveal(game) {
    const type = game.order[game.ci];
    if (!['lexicon', 'timeline', 'closest'].includes(type)) return null;
    const spec = buildSpec(game);
    if (!spec) return null;
    const boards = boardsNow(game);
    const uids = Object.keys(game.participants || {});
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
