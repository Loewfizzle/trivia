// OVERCLOCK — player view: header, progress strip, rules cards, standings and the final podium.
// Challenges are generated locally from the room seed; each challenge's screen lives in ui/<type>.js and the reveal
// panels in reveals.js. Progress (parts done / correct) is written to oc/{match}/{ci}/{uid} after every step so a
// refresh resumes mid-challenge.
import { h, clear, pulseClass, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, createTimer, countUp, leaderboard, fmtNum } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { playerOrder } from '../../core/room-logic.js';
import { sfx } from '../../audio/sfx.js';
import { decodeQuestion } from '../../trivia/feed.js';
import { loadLengths, answersFor } from '../cipher/words.js';
import { INFO, generate, partsFor, SORT_CARDS } from './challenges.js';
import { fmtOk, fmtVal, sortSplit } from './shared.js';
import { buildReveal, hasReveal } from './reveals.js';
import uiUnscramble from './ui/unscramble.js';
import uiMemory from './ui/memory.js';
import uiOddOne from './ui/oddone.js';
import uiNumeric from './ui/numeric.js';
import uiTrivia from './ui/trivia.js';
import uiStroop from './ui/stroop.js';
import uiReflex from './ui/reflex.js';
import uiCount from './ui/count.js';
import uiTrueFalse from './ui/truefalse.js';
import uiLexicon from './ui/lexicon.js';
import uiTimeline from './ui/timeline.js';
import uiClosest from './ui/closest.js';
import uiRewire from './ui/rewire.js';
import uiMissingLink from './ui/missinglink.js';
import uiSpellcheck from './ui/spellcheck.js';
import uiMake24 from './ui/make24.js';
import uiCompass from './ui/compass.js';
import uiSortIt from './ui/sortit.js';
import uiHigherLower from './ui/higherlower.js';
import { bankFor, loadBank, preloadFor, BANK_TYPES } from './banks.js';
import { CHALLENGE_MS, OVERALL_STAGE_MS, levelOf, totals, standings } from './logic.js';



const GHOST = { name: 'GHOST', color: 'yellow', avatar: 'ghost' };
// challenge type → its screen (ui/*.js)
const SCREENS = {
  unscramble: uiUnscramble, memory: uiMemory, oddone: uiOddOne, math: uiNumeric, pattern: uiNumeric, trivia: uiTrivia,
  stroop: uiStroop, reflex: uiReflex, count: uiCount, truefalse: uiTrueFalse,
  lexicon: uiLexicon, timeline: uiTimeline, closest: uiClosest, rewire: uiRewire,
  missinglink: uiMissingLink, spellcheck: uiSpellcheck, make24: uiMake24, compass: uiCompass, sortit: uiSortIt, higherlower: uiHigherLower,
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
    const panel = h('div.panel-full.oc-standings',
      reveal(game),
      roundBoard(game, rows),
      next ? h('div.next-up', 'NEXT: ', h('b', INFO[next].name), game.ci + 1 === game.total - 1 ? ' · ×2 POINTS' : '') : null);
    els.overlay.append(panel);
  }

  // The round, then the race: one list of rows ranked by this challenge's points (bars, a crown on the round's winner),
  // then — OVERALL_STAGE_MS before the end — the same rows slide into the overall order while the totals count up.
  // Timed from phaseStartAt / phaseEndsAt (server time), so a refresh mid-way lands on the right stage.
  function roundBoard(game, rows) {
    const type = game.order[game.ci];
    const final = game.ci === game.total - 1;
    const res = (game.results && game.results[game.ci]) || {};
    const pts = u => (res[u] ? res[u].pts : 0);
    const byRound = rows.slice().sort((a, b) => pts(b.uid) - pts(a.uid) || a.rank - b.rank);
    const top = Math.max(0, ...rows.map(r => pts(r.uid)));
    const winners = top > 0 ? byRound.filter(r => pts(r.uid) === top) : [];
    const roundPos = Object.fromEntries(byRound.map((r, i) => [r.uid, i]));
    const totalPos = Object.fromEntries(rows.map((r, i) => [r.uid, i]));
    const roundRank = {};
    byRound.forEach((r, i) => { roundRank[r.uid] = i > 0 && pts(r.uid) === pts(byRound[i - 1].uid) ? roundRank[byRound[i - 1].uid] : i + 1; });
    const ROW = 58;
    const list = h('div.oc-rb-list', { style: { height: `${rows.length * ROW}px` } });
    const items = rows.map(r => {
      const p = st.players[r.uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
      const off = st.presence[r.uid] && st.presence[r.uid].online === false;
      const crown = winners.some(w => w.uid === r.uid);
      const rank = h('span.lb-rank', String(roundRank[r.uid]));
      const score = h('span.lb-score.oc-rb-score', `+${fmtNum(pts(r.uid))}`);
      const bar = h('i.oc-rb-bar', { style: { transform: `scaleX(${top > 0 ? Math.max(0.02, pts(r.uid) / top) : 0.02})` } });
      const el = h('div.lb-row.oc-rb-row', { class: [r.uid === me() ? 'is-me' : '', crown ? 'is-crown' : '', off ? 'is-off' : ''].join(' '), style: { '--c': colorHex(p.color), transform: `translateY(${roundPos[r.uid] * ROW}px)` } },
        bar, rank, avatar(p.avatar, p.color, 28),
        h('span.lb-name', p.name, crown ? h('i.oc-rb-crown', { 'aria-label': 'won the round' }, '♛') : null, r.note ? h('small.lb-note', r.note) : null),
        h('span.oc-rb-delta', `+${fmtNum(pts(r.uid))}`),
        score);
      return { r, el, rank, score };
    });
    list.append(...items.map(x => x.el));
    const n2 = String(game.ci + 1).padStart(2, '0');
    const kicker = h('div.sheet-kicker.oc-rb-kicker', `CHALLENGE ${n2} // THIS ROUND`);
    const tags = [];
    if (final) tags.push('×2 POINTS');
    if (type === 'closest' && winners.length) tags.push('CLOSEST GUESS BONUS');
    const head = winners.length
      ? h('div.oc-rb-head',
        h('span.oc-rb-head-k', winners.length > 1 ? 'SHARED ROUND' : 'ROUND WINNER'),
        h('b', winners.map(w => (st.players[w.uid] || {}).name || '—').join(' · ')),
        h('span.oc-rb-head-pts', `+${fmtNum(top)}`),
        ...tags.map(t => h('span.oc-rb-tag', t)))
      : h('div.oc-rb-head.is-none', h('b', 'NOBODY CRACKED IT'), ...tags.map(t => h('span.oc-rb-tag', t)));
    const box = h('div.oc-rb', head, kicker, list);
    const toOverall = (animate) => {
      box.classList.add('is-overall');
      if (!animate) box.classList.add('is-instant');
      kicker.textContent = `LEADERBOARD // AFTER ${n2}`;
      for (const x of items) {
        x.el.style.transform = `translateY(${totalPos[x.r.uid] * ROW}px)`;
        x.rank.textContent = String(x.r.rank);
        x.el.classList.toggle('is-first', x.r.rank === 1);
        x.el.classList.toggle(x.r.prevRank && x.r.prevRank > x.r.rank ? 'move-up' : 'x', true);
        if (animate && !reducedMotion()) countUp(x.score, x.r.prevScore || 0, x.r.score, 900);
        else x.score.textContent = fmtNum(x.r.score);
      }
      if (animate) sfx('shimmer');
    };
    const at = Math.max(game.phaseStartAt + 1500, game.phaseEndsAt - OVERALL_STAGE_MS);
    const wait = at - serverNow();
    if (wait <= 0) toOverall(false);
    else revealTimers.push(setTimeout(() => { if (box.isConnected) toOverall(true); }, wait));
    return box;
  }

  function reveal(game) {
    if (!hasReveal(game.order[game.ci])) return null;
    const spec = buildSpec(game);
    if (!spec) return null;
    return buildReveal(game, spec, {
      boards: boardsNow(game),
      uids: Object.keys(game.participants || {}),
      player,
      timers: revealTimers,
      sortLog: chal && chal.key === ckey(game) && chal.local.sort ? chal.local.sort.log : null,
    });
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
