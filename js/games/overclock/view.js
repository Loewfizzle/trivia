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
import { INFO, generate, unscrambleAccepts, partsFor, STROOP_COLORS, REFLEX_TIMEOUT_MS, reflexCredit } from './challenges.js';
import { CHALLENGE_MS, levelOf, totals, standings } from './logic.js';

const GHOST = { name: 'GHOST', color: 'yellow', avatar: 'ghost' };
// 3, 2.5, 3.47 → '3', '2.5', '3.5' (partial credit)
const fmtOk = n => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString());

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
      chal = { key, spec, parts: spec.parts, p: mine.p || 0, ok: mine.ok || 0, done: !!mine.done, ui: null, marks: [], times: [] };
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
    return generate(type, { seed: game.seed, ci: game.ci, level: levelOf(game.ci, game.total) }, deps);
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
    const data = { p: chal.p, ok: chal.ok, n: chal.parts, done, at: serverTimestamp() };
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
    }[s.type](s);
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
      note: !res[r.uid] ? '' : game.order[game.ci] === 'reflex' ? `REFLEX ${Math.round((100 * res[r.uid].ok) / res[r.uid].parts)}%` : `${fmtOk(res[r.uid].ok)}/${res[r.uid].parts} CORRECT`,
    }));
    const next = game.order[game.ci + 1];
    const mine = res[me()];
    if (mine) sfx(mine.ok >= mine.parts ? 'correct' : 'roundEnd');
    els.overlay.append(h('div.panel-full.oc-standings',
      h('div.sheet-kicker', `LEADERBOARD // AFTER ${String(game.ci + 1).padStart(2, '0')}`),
      leaderboard(rows, st.players, { me: me(), presence: st.presence }),
      next ? h('div.next-up', 'NEXT: ', h('b', INFO[next].name), game.ci + 1 === game.total - 1 ? ' · ×2 POINTS' : '') : null));
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
