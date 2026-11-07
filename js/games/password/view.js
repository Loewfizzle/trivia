// THE PASSWORD — THE SCREEN (PW1 — docs/password.md). Renders purely from the RUN the server hands back (judge.start → the record so far;
// every guess's answer folded in with logic.js#applyGuess): the sign, the two door chips, the status line, the 6 × 5 grid, the kit's letter
// keyboard (ENTER, the drawn delete key, the keys' marks). Letters typed but not sent live only here — a tear-down (an app switch, the room
// starting a game) clears them and a re-mount resumes from the server's record on the same door / next guess (nothing lost, nothing counted).
// NIGHT = neon (css/password.css — every colour a token; DAY drops in in PW2). The game draws NO look switch: body[data-look] is the console's.
//   createView() → { mount(el, state), update(state), unmount() }   state.game = the run shell (daily.create / start) · state.judge = a judge
//   (the preview's fake; default THE API JUDGE — judge.js) · window.__password = the test hook (the preview + the E2E)
import { h, clear, reducedMotion } from '../../ui/dom.js';
import { createKeyboard } from '../kit/keyboard.js';
import { createApiJudge } from './judge.js';
import { createRun, applyGuess, canGuess, keyStates, statusLine, scoreOf, doorOf, DOOR_NAMES, DOORS, GUESSES, WORD_LEN, HIT } from './logic.js';

export const FLIP_STEP_MS = 250;      // the tiles flip one by one, this far apart (the owner: ~0.25 s)
export const FLIP_MS = 500;
export const HANDOFF_MS = 1800;       // door 1 opens → THE BACK ROOM loads (a placeholder — the real door reveal is PW2)
export const END_DELAY_MS = 900;

const svgNS = 'http://www.w3.org/2000/svg';
const mark = (d, cls) => { const s = document.createElementNS(svgNS, 'svg'); s.setAttribute('viewBox', '0 0 20 20'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls); const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', d); s.append(p); return s; };
const CHECK = 'M4 10.5l4 4 8-9', CROSS = 'M5 5l10 10M15 5L5 15';
const fmtTime = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function createView() {
  let root = null, st = null, judge = null, gone = false;
  let run = null, typed = '', busy = false, startedAt = 0, doneScore = null, finished = null;
  let kb = null, timers = [];
  const els = {};
  const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); if (!gone) fn(); }, ms); timers.push(t); return t; };
  const onKeyDown = e => { if (!kb || busy || e.metaKey || e.ctrlKey || e.altKey) return; kb.key(e); };

  function build() {
    els.sign = h('h1.pw-sign', 'THE PASSWORD');
    els.doors = h('div.pw-doors', DOOR_NAMES.map((n, i) => h('div.pw-door', { dataset: { door: i } }, h('span.pw-door-t', n), h('span.pw-door-x'))));
    els.line = h('div.pw-line', { 'aria-live': 'polite' });
    els.grid = h('div.pw-grid', { role: 'grid', 'aria-label': 'your guesses' }, Array.from({ length: GUESSES }, () => h('div.pw-row', { role: 'row' }, Array.from({ length: WORD_LEN }, () => h('div.pw-tile', { role: 'gridcell' })))));
    els.reveal = h('div.pw-reveal', { hidden: true });
    els.handoff = h('div.pw-card.pw-handoff', { role: 'status' }, h('div.pw-card-k', 'THE DOOR OPENS'), h('h2.pw-card-t', 'THE BACK ROOM'));
    els.end = h('div.pw-card.pw-end', { role: 'dialog', 'aria-label': 'the result' });
    els.board = h('div.pw-board', els.grid, els.reveal, els.handoff, els.end);
    els.note = h('div.pw-note', { role: 'status', 'aria-live': 'assertive' });
    kb = createKeyboard({ go: 'ENTER', maxLen: WORD_LEN, onChange: v => { typed = v; paintTyped(); }, onGo: () => submit() });
    els.kb = h('div.pw-kb', kb.el);
    root.classList.add('pw-screen');
    root.append(h('header.pw-head', els.sign), els.doors, els.line, els.board, els.note, els.kb);
  }
  const rows = () => [...els.grid.children];
  const tiles = r => [...rows()[r].children];

  /** the whole board from the run (no motion — a mount, a resume, a re-render) */
  function render() {
    if (!run) return;
    const d = doorOf(run) || run.doors[DOORS - 1];
    const di = run.doors.indexOf(d);
    els.doors.querySelectorAll('.pw-door').forEach((chip, i) => {
      const door = run.doors[i];
      chip.classList.toggle('is-on', !run.done && i === run.door);
      chip.classList.toggle('is-open', door.state === 'solved');
      chip.classList.toggle('is-shut', door.state === 'failed');
      const x = chip.querySelector('.pw-door-x');
      clear(x);
      if (door.state === 'solved') x.append(mark(CHECK, 'pw-door-mark'), h('span.pw-door-n', String(door.guesses.length)));
      else if (door.state === 'failed') x.append(mark(CROSS, 'pw-door-mark'));
      chip.setAttribute('aria-label', `${DOOR_NAMES[i]}: ${door.state === 'solved' ? `opened in ${door.guesses.length}` : door.state === 'failed' ? 'held' : i === run.door ? 'in play' : 'locked'}`);
    });
    els.line.textContent = statusLine(run);
    els.grid.dataset.door = String(di);
    rows().forEach((row, r) => {
      row.className = 'pw-row';
      const g = d.guesses[r], m = d.marks[r];
      tiles(r).forEach((t, c) => {
        t.className = 'pw-tile';
        t.textContent = g ? g[c] : '';
        if (m) t.classList.add(`is-${m[c]}`);
        t.setAttribute('aria-label', g ? `${g[c]} ${m[c] === HIT ? 'right' : m[c] === 'near' ? 'close' : 'miss'}` : 'empty');
      });
      if (g && m && m.every(x => x === HIT)) row.classList.add('is-won');
    });
    paintTyped();
    kb.setKeyStates(keyStates(run));
    const closed = d.state !== 'open' && d.word;
    els.reveal.hidden = !(closed && d.state === 'failed');
    if (closed && d.state === 'failed') { clear(els.reveal); els.reveal.append(`${DOOR_NAMES[di]} HELD · THE WORD WAS`, h('b', d.word)); }
    kb.lock(busy || !!canGuess(run));
  }
  function paintTyped() {
    if (!run) return;
    const d = doorOf(run);
    if (!d || d.state !== 'open') return;
    const r = d.guesses.length;
    if (r >= GUESSES) return;
    tiles(r).forEach((t, c) => {
      const ch = typed[c] || '';
      const had = t.textContent;
      t.textContent = ch;
      t.classList.toggle('is-typed', !!ch);
      if (ch && ch !== had) { t.classList.remove('is-typed'); void t.offsetWidth; t.classList.add('is-typed'); }
    });
  }
  function note(text, bad = false) {
    els.note.textContent = text;
    els.note.classList.toggle('is-bad', bad);
    els.note.classList.add('is-on');
    later(() => els.note.classList.remove('is-on'), 2400);
  }
  function shake(text) {
    const d = doorOf(run);
    const row = d ? rows()[d.guesses.length] : null;
    if (row) { row.classList.remove('is-shake'); void row.offsetWidth; row.classList.add('is-shake'); }
    note(text, true);
  }

  /** the tiles of row r flip one by one; the marks land at each flip's midpoint; resolves after the last */
  function reveal(r, marks) {
    const ts = tiles(r);
    if (reducedMotion()) { ts.forEach((t, c) => { t.classList.remove('is-typed'); t.classList.add(`is-${marks[c]}`); }); return new Promise(res => later(res, 120)); }
    ts.forEach((t, c) => { t.style.setProperty('--d', `${c * FLIP_STEP_MS}ms`); t.classList.add('is-flip'); later(() => { t.classList.remove('is-typed'); t.classList.add(`is-${marks[c]}`); }, c * FLIP_STEP_MS + FLIP_MS / 2); });
    return new Promise(res => later(() => { ts.forEach(t => t.classList.remove('is-flip')); res(); }, (WORD_LEN - 1) * FLIP_STEP_MS + FLIP_MS));
  }

  async function submit() {
    if (!run || busy) return;
    if (canGuess(run)) return;
    if (typed.length < WORD_LEN) { shake('NOT ENOUGH LETTERS'); return; }
    if (!judge.canType(typed)) { shake('NOT IN THE LIST'); return; }
    busy = true; kb.lock(true);
    const word = typed;
    try {
      const resp = await judge.guess(word);
      if (gone) return;
      const r = doorOf(run).guesses.length;
      run = applyGuess(run, resp, word);
      typed = ''; kb.clear();
      await reveal(r, resp.marks);
      if (gone) return;
      render();
      if (resp.next != null) await handoff();
      if (resp.done) later(() => end(), END_DELAY_MS);
    } catch (e) {
      if (gone) return;
      const code = e && e.code;
      if (code === 'not_a_word') shake('NOT IN THE LIST');
      else if (code === 'out_of_step' || code === 'finished' || code === 'closed' || code === 'not_started') await resync();
      else note('NO SIGNAL · TRY AGAIN', true);
    } finally {
      busy = false;
      if (!gone) { kb.lock(!!canGuess(run)); paintTyped(); }
    }
  }
  /** THE HAND-OFF: door 1's chip lights, THE BACK ROOM loads (PW2 draws the real door) */
  function handoff() {
    return new Promise(res => {
      els.handoff.classList.add('is-in'); els.board.classList.add('is-covered');
      later(() => { els.handoff.classList.remove('is-in'); els.board.classList.remove('is-covered'); render(); res(); }, HANDOFF_MS);
    });
  }
  /** THE END: a simple result — doors, guesses, time, the words (the real result + the share are PW2); the server records the score */
  async function end() {
    if (!run || !run.done) return;
    const s = scoreOf(run);
    const crack = s.doors === DOORS;
    clear(els.end);
    els.end.classList.toggle('is-crack', crack);
    els.end.classList.toggle('is-fail', !crack);
    const noteEl = h('div.pw-end-note', 'RECORDING…');
    els.end.append(
      h('div.pw-card-k', 'TONIGHT\'S PASSWORD'),
      h('h2.pw-card-t', crack ? 'YOU\'RE IN' : s.doors ? 'THE BACK ROOM HELD' : 'THE DOOR HELD'),
      h('div.pw-end-rows',
        h('div.pw-end-row', h('small', 'DOORS'), h('b', `${s.doors}/${DOORS}`)),
        h('div.pw-end-row', h('small', 'GUESSES'), h('b', String(s.guesses))),
        h('div.pw-end-row', h('small', 'TIME'), h('b', fmtTime(s.time)))),
      h('div.pw-end-words', run.doors.map((d, i) => h('div.pw-end-word', { class: d.state === 'solved' ? 'is-open' : d.state === 'failed' ? 'is-shut' : 'is-never' }, h('span', DOOR_NAMES[i]), h('b', d.word || 'NEVER OPENED')))),
      noteEl);
    els.end.classList.add('is-in'); els.board.classList.add('is-covered');
    if (finished) { noteEl.textContent = finished; noteEl.classList.add('is-ok'); return; }
    try {
      const f = await judge.finish();
      finished = f && f.again ? 'ALREADY RECORDED' : `RECORDED · SCORE ${f && f.score != null ? f.score : s.score}`;
      noteEl.classList.add('is-ok');
    } catch (e) { finished = null; noteEl.textContent = 'NOT RECORDED · NO SIGNAL'; }
    if (!gone) noteEl.textContent = finished || noteEl.textContent;
  }
  /** the run from the server (a mount, a resume, a re-sync after an out-of-step answer) */
  async function resync() {
    let r;
    busy = true; if (kb) kb.lock(true);   // (the keys wait for the server's run — the hook says busy meanwhile)
    try { r = await judge.start(); } catch (e) { busy = false; if (!gone) { note('NO SIGNAL · TRY AGAIN', true); kb.lock(!!canGuess(run)); } return false; }
    busy = false;
    if (gone) return false;
    startedAt = r.startedAt || startedAt;
    doneScore = r.done != null ? r.done : null;
    run = r.run ? { ...r.run, startedAt: r.run.startedAt || startedAt } : createRun({ day: r.day, uid: st && st.uid, startedAt });
    if (doneScore != null) finished = `RECORDED · SCORE ${doneScore}`;
    typed = ''; kb.clear();
    render();
    if (run.done) end();
    return true;
  }

  const api = {
    mount(el, state) {
      root = el; st = state; gone = false;
      judge = (state && state.judge) || createApiJudge();
      const g = state && state.game;
      run = g && Array.isArray(g.doors) ? g : createRun({ day: g && g.day, uid: state && state.uid, startedAt: (g && g.startedAt) || 0 });
      startedAt = run.startedAt || 0;
      build();
      render();
      window.addEventListener('keydown', onKeyDown);
      resync();
      window.__password = {
        run: () => run, typed: () => typed, busy: () => busy, finished: () => finished,
        type: w => { for (const ch of String(w).toUpperCase()) kb.key({ key: ch, preventDefault() {} }); },
        enter: () => submit(), back: () => kb.key({ key: 'Backspace', preventDefault() {} }),
        state: () => ({ door: run && run.door, done: !!(run && run.done), guesses: run ? run.doors.map(d => d.guesses.length) : [], typed, busy, handoff: els.handoff.classList.contains('is-in'), end: els.end.classList.contains('is-in') }),
        resync,
      };
    },
    update(state) { st = state; },
    unmount() {
      gone = true;
      for (const t of timers) clearTimeout(t);
      timers = [];
      window.removeEventListener('keydown', onKeyDown);
      typed = '';   // (letters typed but not sent are gone with the screen)
      if (kb) kb.destroy();
      if (root) { clear(root); root.classList.remove('pw-screen'); }
      delete window.__password;
      root = null; kb = null;
    },
  };
  return api;
}
