// THE PASSWORD — THE SCREEN (PW1 + PW2 — docs/password.md). Renders purely from the RUN the server hands back (judge.start → the record so
// far; every guess's answer folded in with logic.js#applyGuess): the sign, THE DRAWN DOORS (doors.js), the 6 × 5 grid, the kit's letter
// keyboard (ENTER, the drawn delete key, the keys' marks). Letters typed but not sent live only here — a tear-down (an app switch, the room
// starting a game) clears them and a re-mount resumes from the server's record on the same door / next guess (nothing lost, nothing counted).
// PW2: THE DOOR REVEAL between the doors (the row glows, the drawn door swings open, warm light floods the screen, the board clears, THE BACK
// ROOM's empty board slides in — skippable by a tap; the state is already advanced, so a suspend mid-reveal resumes on the right board),
// THE END SCREEN (the board + keyboard leave; the headline, ONE number, the mini grids, SHARE, the countdown to 4 am Eastern), THE DAY LOOK
// (css/password.css retokens under body[data-look] — the game draws no switch, it re-themes live), the sounds (sfx.js).
//   createView() → { mount(el, state), update(state), unmount() }   state.game = the run shell (daily.create / start) · state.judge = a judge
//   (the preview's fake; default THE API JUDGE — judge.js) · window.__password = the test hook (the preview + the E2E)
import { h, clear, reducedMotion } from '../../ui/dom.js';
import { recordFinish, tickTurn, endActions, fitTitle, shareOrLine, NOT_RECORDED } from '../../daily/end.js';
import { runDayKey as dayKeyOf } from '../../daily/clock.js';
import { createKeyboard } from '../kit/keyboard.js';
import { createApiJudge } from './judge.js';
import { createDoors } from './doors.js';
import { pwSfx, pwSfxBytes } from './sfx.js';
import { createRun, applyGuess, canGuess, keyStates, scoreOf, doorOf, headline, failLine, fmtTime, shareLine, DOOR_NAMES, DOORS, GUESSES, WORD_LEN, HIT, NEAR } from './logic.js';

export const FLIP_STEP_MS = 250;      // the tiles flip one by one, this far apart (the owner: ~0.25 s)
export const FLIP_MS = 500;
// PW2 — THE DOOR REVEAL's beats (from the last tile's landing): the row's glow → the swing + the flood → the board clears → the next board in
export const REVEAL = Object.freeze({ glow: 320, swing: 950, clear: 380, slide: 420, floodHold: 520, short: 0.7 });
export const HELD_MS = 1100;          // a held door: the thud, the door dims, then the end screen
export const LEAVE_MS = 400;          // the board + keyboard animate out before the end screen comes in

export function createView() {
  let root = null, st = null, judge = null, gone = false;
  let run = null, typed = '', busy = false, startedAt = 0, doneScore = null, finished = null, revealing = false, ending = false;
  let day = null, offset = 0;   // (DFIX1: the run's OWN day — from its start; the server clock's offset for the countdown)
  let kb = null, doors = null, timers = [], clockT = 0, skipReveal = null;
  const els = {};
  const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); if (!gone) fn(); }, ms); timers.push(t); return t; };
  const wait = ms => new Promise(res => later(res, ms));
  const onKeyDown = e => { if (!kb || busy || e.metaKey || e.ctrlKey || e.altKey) return; kb.key(e); };
  const onTap = () => { if (skipReveal) skipReveal(); };

  function build() {
    els.sign = h('h1.pw-sign', h('span.pw-sign-t', 'THE PASSWORD'), h('span.pw-sign-dot', { 'aria-hidden': 'true' }, '.'));
    doors = createDoors(DOOR_NAMES);
    els.grid = h('div.pw-grid', { role: 'grid', 'aria-label': 'your guesses' }, Array.from({ length: GUESSES }, () => h('div.pw-row', { role: 'row' }, Array.from({ length: WORD_LEN }, () => h('div.pw-tile', { role: 'gridcell' })))));
    els.board = h('div.pw-board', els.grid);
    els.note = h('div.pw-note', { role: 'status', 'aria-live': 'assertive' });
    kb = createKeyboard({ go: 'ENTER', maxLen: WORD_LEN, onChange: v => { typed = v; paintTyped(); }, onGo: () => submit(), onKey: (k, changed) => { if (changed) pwSfx(k === '⌫' ? 'back' : 'tap'); } });
    els.kb = h('div.pw-kb', kb.el);
    els.flood = h('div.pw-flood', { 'aria-hidden': 'true' });
    els.end = h('div.pw-endscr', { role: 'dialog', 'aria-label': 'the result', hidden: true });
    els.play = h('div.pw-play', els.board, els.note, els.kb);
    root.classList.add('pw-screen');
    root.append(h('header.pw-head', els.sign), doors.el, els.play, els.end, els.flood);
    root.addEventListener('pointerdown', onTap);
  }
  const rows = () => [...els.grid.children];
  const tiles = r => [...rows()[r].children];
  const markName = m => (m === HIT ? 'right' : m === NEAR ? 'close' : 'miss');

  /** the whole board from the run (no motion — a mount, a resume, a re-render) */
  function render() {
    if (!run) return;
    const d = doorOf(run) || run.doors[DOORS - 1];
    const di = run.doors.indexOf(d);
    doors.set(run);
    els.grid.dataset.door = String(di);
    rows().forEach((row, r) => {
      row.className = 'pw-row';
      const g = d.guesses[r], m = d.marks[r];
      tiles(r).forEach((t, c) => {
        t.className = 'pw-tile';
        t.textContent = g ? g[c] : '';
        if (m) t.classList.add(`is-${m[c]}`);
        t.setAttribute('aria-label', g ? `${g[c]} ${markName(m[c])}` : 'empty');
      });
      if (g && m && m.every(x => x === HIT)) row.classList.add('is-won');
    });
    paintTyped();
    kb.setKeyStates(keyStates(run));
    // (DFIX1: no line under the grid on a lost door — the door row says LOCKED OUT, the end screen shows its word)
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
    pwSfx('refuse');
    note(text, true);
  }

  /** the tiles of row r flip one by one; the marks land at each flip's midpoint; resolves after the last */
  function flip(r, marks) {
    const ts = tiles(r);
    if (reducedMotion()) { ts.forEach((t, c) => { t.classList.remove('is-typed'); t.classList.add(`is-${marks[c]}`); }); return wait(120); }
    ts.forEach((t, c) => { t.style.setProperty('--d', `${c * FLIP_STEP_MS}ms`); t.classList.add('is-flip'); later(() => { t.classList.remove('is-typed'); t.classList.add(`is-${marks[c]}`); pwSfx(marks[c]); }, c * FLIP_STEP_MS + FLIP_MS / 2); });
    return new Promise(res => later(() => { ts.forEach(t => t.classList.remove('is-flip')); res(); }, (WORD_LEN - 1) * FLIP_STEP_MS + FLIP_MS));
  }

  async function submit() {
    if (!run || busy || revealing) return;
    if (canGuess(run)) return;
    if (typed.length < WORD_LEN) { shake('NOT ENOUGH LETTERS'); return; }
    if (!judge.canType(typed)) { shake('NOT IN THE LIST'); return; }
    busy = true; kb.lock(true);
    const word = typed;
    pwSfx('submit');
    try {
      const resp = await judge.guess(word);
      if (gone) return;
      const r = doorOf(run).guesses.length;
      const was = run;
      run = applyGuess(run, resp, word);
      typed = ''; kb.clear();
      await flip(r, resp.marks);
      if (gone) return;
      const row = rows()[r];
      if (row && resp.solved) row.classList.add('is-won');
      kb.setKeyStates(keyStates(run));
      if (resp.solved) await reveal(resp.door, resp.next != null);          // THE DOOR REVEAL (the next board slides in, or the end follows)
      else if (resp.failed) await held(resp.door);
      else render();
      void was;
      if (resp.done) end();
    } catch (e) {
      if (gone) return;
      const code = e && e.code;
      if (code === 'not_a_word') shake('NOT IN THE LIST');
      else if (code === 'out_of_step' || code === 'finished' || code === 'closed' || code === 'not_started') await resync();
      else note('NO SIGNAL · TRY AGAIN', true);
    } finally {
      busy = false;
      if (!gone && !ending) { kb.lock(!!canGuess(run)); paintTyped(); }
    }
  }

  /**
   * THE DOOR REVEAL (PW2): the solved row glows → the drawn door swings open + warm light floods the screen → the board clears → the next
   * door's empty board slides in (door `di` + 1 goes current). Shorter for THE BACK ROOM (the end screen follows). A tap skips to the end
   * state. The run is ALREADY advanced (applyGuess) — a suspend here resumes on the right board.
   */
  function reveal(di, next) {
    const k = next ? 1 : REVEAL.short;
    if (reducedMotion()) { pwSfx('unlock'); render(); return wait(300); }
    revealing = true;
    pwSfx('unlock');
    root.classList.add('is-reveal');
    return new Promise(res => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true; revealing = false; skipReveal = null;
        root.classList.remove('is-reveal', 'is-flood');
        els.grid.classList.remove('is-out');
        render();
        if (next) { els.grid.classList.add('is-in'); later(() => els.grid.classList.remove('is-in'), REVEAL.slide + 50); }
        res();
      };
      skipReveal = finish;
      later(() => { if (done) return; doors.set(run); root.classList.add('is-flood'); pwSfx('open'); }, REVEAL.glow * k);   // the swing + the light
      later(() => { if (done) return; root.classList.remove('is-flood'); }, (REVEAL.glow + REVEAL.floodHold) * k);
      later(() => { if (done) return; els.grid.classList.add('is-out'); }, (REVEAL.glow + REVEAL.swing) * k);           // the board clears
      later(finish, (REVEAL.glow + REVEAL.swing + REVEAL.clear) * k);
    });
  }
  /** a HELD door: no swing — the door dims red (a low thud — sfx), then the end screen */
  function held() {
    doors.set(run);
    render();
    pwSfx('fail');
    return wait(reducedMotion() ? 300 : HELD_MS);
  }

  // ---------------------------------------------------------------- THE END SCREEN (PW2)
  const miniGrid = d => h('div.pw-mini', { role: 'img', 'aria-label': `${d.guesses.length} guesses` },
    d.marks.map(m => h('div.pw-mini-row', m.map(x => h('i.pw-mini-c', { class: `is-${x}` })))));
  /** the board + keyboard leave (~0.4 s), one clean screen comes in; the server records the score */
  async function end() {
    if (!run || !run.done || ending) return;
    ending = true;
    kb.lock(true);
    const s = scoreOf(run);
    const crack = s.doors === DOORS;
    clear(els.end);
    els.end.classList.toggle('is-crack', crack);
    els.end.classList.toggle('is-fail', !crack);
    const title = h('h2.pw-end-t', headline(run));
    // (the owner's ADD-ON: no status text on the end screen — the record's state lives in the hook + a quiet NO SIGNAL line only when it failed)
    const acts = endActions('pw', { onShare: () => share() });   // (DM1 — THE DAILY KIT: SHARE + the countdown + the record line)
    const rec = acts.rec, next = acts.next;
    const played = run.doors.filter(d => d.guesses.length);
    els.end.append(
      h('div.pw-end-result',
        title,
        // WELCOME IN: ONE big number + the time small under it · LOCKED OUT: one small line "6 GUESSES · 2:15" (no big number)
        crack ? h('div.pw-end-n', h('b', String(s.guesses)), h('span', s.guesses === 1 ? 'GUESS' : 'GUESSES')) : null,
        crack ? h('div.pw-end-time', fmtTime(s.time)) : h('div.pw-end-line', failLine(run)),
        h('div.pw-end-grids', played.map(d => h('div.pw-end-door', miniGrid(d), h('b.pw-end-word', { class: d.state === 'solved' ? 'is-open' : 'is-shut' }, d.word || ''))))),
      acts.el);
    // the board + the keys leave, the end screen comes in
    els.play.classList.add('is-out');
    doors.set(run);
    await wait(reducedMotion() ? 0 : LEAVE_MS);
    if (gone) return;
    els.play.hidden = true;
    els.end.hidden = false;
    void els.end.offsetWidth;
    els.end.classList.add('is-in');
    if (crack && !finished) pwSfx('win');
    fitTitle(title);
    tickClock(next);
    if (finished) return;
    els.rec = rec;
    record();
  }
  /** the score to the server (DFIX1 — like COAST CLEAR's): a lost signal is retried, backed off; a retry is free (the server keeps the first
   *  finish); nothing on screen while it waits — a quiet NOT RECORDED line only once every try failed */
  async function record() {
    const r = await recordFinish(() => judge.finish(), { wait, alive: () => !gone });   // (DM1 — THE DAILY KIT: retried, backed off)
    if (gone) return;
    if (r.ok) { const f = r.resp; doneScore = f && f.score != null ? f.score : doneScore; finished = 'RECORDED'; return; }
    if (finished !== 'RECORDED') { finished = 'FAILED'; if (els.rec) els.rec.textContent = NOT_RECORDED; }
  }
  /** the run's own day (DFIX1) */
  const runDayKey = () => dayKeyOf(day, startedAt, Date.now() + offset);
  /** "NEXT PASSWORD IN 13:39:21" — to the next 4 am Eastern, ticking (the server's clock); a run that crossed the turn: today's is open */
  function tickClock(el) {
    clearInterval(clockT);
    clockT = tickTurn(el, { now: () => Date.now() + offset, day: runDayKey, open: 'TODAY’S PASSWORD IS OPEN', next: 'NEXT PASSWORD IN', alive: () => !gone });
  }
  /** SHARE (PW2 — share.js, lazy): the image + the one line; the plain line if the card can't be made */
  async function share() {
    const line = shareLine(run, runDayKey());
    await shareOrLine(async () => (await import('./share.js')).shareRun({ run, line, look: document.body.dataset.look || 'night', root }), line);
  }

  /** the run from the server (a mount, a resume, a re-sync after an out-of-step answer) */
  async function resync() {
    let r;
    busy = true; if (kb) kb.lock(true);   // (the keys wait for the server's run — the hook says busy meanwhile)
    try { r = await judge.start(); } catch (e) { busy = false; if (!gone) { note('NO SIGNAL · TRY AGAIN', true); kb.lock(!!canGuess(run)); } return false; }
    busy = false;
    if (gone) return false;
    startedAt = r.startedAt || startedAt;
    day = r.day || day;
    if (Number.isFinite(r.now)) offset = r.now - Date.now();
    doneScore = r.done != null ? r.done : null;
    run = r.run ? { ...r.run, startedAt: r.run.startedAt || startedAt } : createRun({ day: r.day, uid: st && st.uid, startedAt });
    if (doneScore != null) finished = 'RECORDED';
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
      pwSfxBytes();   // (the sounds' bytes now; they decode on first use — never a wait, never a throw)
      resync();
      window.__password = {
        run: () => run, typed: () => typed, busy: () => busy, finished: () => finished,
        type: w => { for (const ch of String(w).toUpperCase()) kb.key({ key: ch, preventDefault() {} }); },
        enter: () => submit(), back: () => kb.key({ key: 'Backspace', preventDefault() {} }),
        state: () => ({ door: run && run.door, done: !!(run && run.done), guesses: run ? run.doors.map(d => d.guesses.length) : [], typed, busy, reveal: revealing, handoff: revealing, end: !els.end.hidden && els.end.classList.contains('is-in'), ending, doors: doors ? [doors.state(0), doors.state(1)] : [] }),
        skip: () => { if (skipReveal) skipReveal(); },
        resync, share,
      };
    },
    update(state) { st = state; },
    unmount() {
      gone = true;
      for (const t of timers) clearTimeout(t);
      timers = [];
      clearInterval(clockT);
      window.removeEventListener('keydown', onKeyDown);
      typed = '';   // (letters typed but not sent are gone with the screen)
      if (kb) kb.destroy();
      if (doors) doors.destroy();
      if (root) { root.removeEventListener('pointerdown', onTap); clear(root); root.classList.remove('pw-screen', 'is-reveal', 'is-flood'); }
      delete window.__password;
      root = null; kb = null; doors = null; revealing = false; ending = false; skipReveal = null;
    },
  };
  return api;
}
