// CIPHER BREACH — player view. Renders from mirrored DB state; the only local
// state is the row being typed and an optimistic copy of my own board.
import { h, clear, pulseClass, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, createTimer, countUp, leaderboard, burst, fmtNum } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { playerOrder } from '../../core/room-logic.js';
import {
  evaluateGuess, keyStates, asArray, standings, totals, encodeWord, decodeWord, secretKey, MAX_GUESSES,
} from './logic.js';
import { isValidGuess, isLoaded, loadLength } from './words.js';
import { sfx } from '../../audio/sfx.js';

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', '>zxcvbnm<'];
const FLIP_STAGGER = 110;

export function createView() {
  let root, st;
  let els = {};
  let local = null;          // { key, length, guesses, patterns, input, solved, done }
  let phaseKey = '';         // `${matchId}|${round}|${phase}` of the overlay currently built
  let timer, introRaf = 0, cancelers = [];
  let ro;
  let lastScore = 0;

  // ---------- helpers ----------
  const game = () => st.game;
  const roundKey = g => `${g.matchId}/${g.round}`;
  const secret = g => decodeWord(g.secret, secretKey(st.code, g.matchId, g.round));
  const amPlaying = () => !!(st.game && st.game.participants && st.game.participants[st.uid]);
  const L = () => game().lengths[game().round];
  // live boards only count once they belong to this round
  const boardsFor = g => (st.liveKey && st.liveKey.includes(`"boards/${roundKey(g)}"`) && st.live.boards) || {};

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter') { press('>'); e.preventDefault(); }
    else if (e.key === 'Backspace') { press('<'); e.preventDefault(); }
    else if (/^[a-z]$/i.test(e.key)) press(e.key.toLowerCase());
  }

  // ---------- mount ----------
  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('cb');
    els.round = h('div.cb-round');
    els.score = h('div.cb-score', '0');
    timer = createTimer({ warnAt: 15_000, ticks: true });
    els.header = h('header.game-head',
      h('div.cb-head-l', h('div.cb-title', 'CIPHER', h('b', 'BREACH')), els.round),
      h('div.cb-head-r', h('div.cb-score-wrap', h('small', 'SCORE'), els.score)),
    );
    els.timerWrap = h('div.cb-timer', timer.el);
    els.opps = h('div.cb-opps');
    els.board = h('div.cb-board');
    els.boardWrap = h('div.cb-board-wrap', els.board);
    els.msg = h('div.cb-msg');
    els.kbd = buildKeyboard();
    els.overlay = h('div.cb-overlay');
    root.append(els.header, els.timerWrap, els.opps, els.boardWrap, els.msg, els.kbd, els.overlay);
    ro = new ResizeObserver(sizeBoard);
    ro.observe(els.boardWrap);
    window.addEventListener('keydown', onKey);
    update(state);
  }

  function unmount() {
    window.removeEventListener('keydown', onKey);
    ro && ro.disconnect();
    timer && timer.stop();
    cancelAnimationFrame(introRaf);
    cancelers.forEach(c => c());
    if (els.final) els.final.destroy();
  }

  // ---------- update ----------
  function update(state) {
    st = state;
    const g = game();
    if (!g) return;
    syncLocal(g);
    root.dataset.phase = g.phase;
    root.classList.toggle('is-spectator', !amPlaying());
    els.round.textContent = `R${g.round + 1}/${g.rounds} · ${L()} LETTERS`;
    timer.set(g.phaseEndsAt, g.phase === 'play' ? g.roundMs : g.phaseEndsAt - g.phaseStartAt);
    els.timerWrap.classList.toggle('is-play', g.phase === 'play');

    const myTotal = totals(g)[st.uid] || 0;
    if (myTotal !== lastScore) { cancelers.push(countUp(els.score, lastScore, myTotal, 900)); lastScore = myTotal; }

    renderBoardState();
    renderKeyboard();
    renderOpponents(g);
    renderMessage(g);

    const pk = `${g.matchId}|${g.round}|${g.phase}`;
    if (pk !== phaseKey) { phaseKey = pk; buildOverlay(g); }
    else if (g.phase === 'reveal') refreshReveal(g);
    else if (g.phase === 'final' && els.final) els.final.refresh();
  }

  // Local board <- DB (adopts the stored board after a refresh / rejoin)
  function syncLocal(g) {
    const key = roundKey(g);
    const length = L();
    if (!local || local.key !== key) {
      local = { key, length, guesses: [], patterns: [], input: '', solved: false, done: false, revealed: 0 };
      buildBoard(length);
      sizeBoard();
      if (!isLoaded(length)) loadLength(length).catch(() => {});
    }
    const boards = boardsFor(g);
    const mine = boards[st.uid];
    if (mine) {
      const pats = asArray(mine.p);
      if (pats.length > local.patterns.length) {
        const sk = secretKey(st.code, g.matchId, g.round);
        local.guesses = asArray(mine.g).map(x => decodeWord(x, sk));
        local.patterns = pats;
        local.solved = !!mine.solved;
        local.done = !!mine.done;
        local.revealed = pats.length; // restored rows appear without animation
        for (let r = 0; r < pats.length; r++) paintRow(r, local.guesses[r], pats[r], false);
      }
    }
  }

  // ---------- board ----------
  function buildBoard(length) {
    clear(els.board);
    els.board.style.setProperty('--len', length);
    els.rows = [];
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = h('div.cb-row');
      for (let i = 0; i < length; i++) {
        row.append(h('div.tile', h('div.tile-in', h('span.face.front'), h('span.face.back'))));
      }
      els.rows.push(row);
      els.board.append(row);
    }
  }

  function sizeBoard() {
    if (!local) return;
    const w = els.boardWrap.clientWidth;
    const hgt = els.boardWrap.clientHeight;
    const gap = 6;
    const size = Math.floor(Math.max(24, Math.min(64, (w - gap * (local.length - 1)) / local.length, (hgt - gap * 5) / 6)));
    els.board.style.setProperty('--tile', `${size}px`);
  }

  function setTileLetter(tile, ch) {
    tile.querySelector('.front').textContent = ch || '';
    tile.querySelector('.back').textContent = ch || '';
  }

  function paintRow(r, word, pattern, animate) {
    const row = els.rows[r];
    if (!row) return;
    [...row.children].forEach((tile, i) => {
      setTileLetter(tile, word[i]);
      tile.dataset.s = pattern[i];
      tile.classList.add('filled');
      if (animate && !reducedMotion()) {
        tile.style.setProperty('--d', `${i * FLIP_STAGGER}ms`);
        tile.classList.remove('instant');
      } else tile.classList.add('instant');
      tile.classList.add('flip');
    });
  }

  function renderBoardState() {
    const r = local.patterns.length;
    if (r >= MAX_GUESSES || local.done) return;
    const row = els.rows[r];
    [...row.children].forEach((tile, i) => {
      const ch = local.input[i] || '';
      const had = tile.querySelector('.front').textContent;
      setTileLetter(tile, ch);
      tile.classList.toggle('filled', !!ch);
      if (ch && !had) pulseClass(tile, 'pop');
    });
  }

  // ---------- keyboard ----------
  function buildKeyboard() {
    const kb = h('div.kbd', { role: 'group', 'aria-label': 'Keyboard', dataset: { sfx: 'none' } });
    els.keys = {};
    for (const rowStr of KEY_ROWS) {
      const row = h('div.kbd-row');
      for (const k of rowStr) {
        const label = k === '>' ? 'ENTER' : k === '<' ? '⌫' : k;
        const b = h('button.key', {
          type: 'button', class: k === '>' || k === '<' ? 'key-wide' : null, dataset: { k },
          'aria-label': k === '>' ? 'Enter' : k === '<' ? 'Backspace' : k,
          onpointerdown: e => { e.preventDefault(); press(k); pulseClass(b, 'hit', 160); },
          onclick: e => { if (e.detail === 0) press(k); }, // keyboard-activated button (a11y)
        }, label);
        els.keys[k] = b;
        row.append(b);
      }
      kb.append(row);
    }
    return kb;
  }

  function renderKeyboard() {
    // Only reveal states for rows whose flip animation has finished.
    const n = local.revealed;
    const ks = keyStates(local.guesses.slice(0, n), local.patterns.slice(0, n));
    for (const [k, b] of Object.entries(els.keys)) {
      if (k.length === 1 && /[a-z]/.test(k)) {
        if (ks[k] !== undefined) b.dataset.s = ks[k]; else delete b.dataset.s;
      }
    }
    const canType = game().phase === 'play' && amPlaying() && !local.done;
    els.kbd.classList.toggle('is-locked', !canType);
  }

  function press(k) {
    const g = game();
    if (!g || g.phase !== 'play' || !amPlaying() || local.done) return;
    if (k === '<') { local.input = local.input.slice(0, -1); renderBoardState(); return; }
    if (k === '>') { submit(); return; }
    if (local.input.length >= local.length) return;
    vibrate(8);
    sfx('key');
    local.input += k;
    renderBoardState();
  }

  async function submit() {
    const g = game();
    const row = els.rows[local.patterns.length];
    const word = local.input;
    if (word.length < local.length) { reject(row, 'NOT ENOUGH LETTERS'); return; }
    if (!isLoaded(local.length)) { toast('LOADING DICTIONARY…', 'info', 1200); await loadLength(local.length).catch(() => {}); }
    if (!isValidGuess(word)) { reject(row, 'NOT IN DICTIONARY'); return; }
    if (local.guesses.includes(word)) { reject(row, 'ALREADY TRIED'); return; }

    const answer = secret(g);
    const pattern = evaluateGuess(word, answer);
    const r = local.patterns.length;
    local.guesses.push(word);
    local.patterns.push(pattern);
    local.input = '';
    local.solved = /^2+$/.test(pattern);
    local.done = local.solved || local.patterns.length >= MAX_GUESSES;
    paintRow(r, word, pattern, true);
    if (!reducedMotion()) [...pattern].forEach((s, i) => setTimeout(() => sfx('flip', { state: s, i }), i * FLIP_STAGGER + 260));
    const flipMs = reducedMotion() ? 0 : local.length * FLIP_STAGGER + 450;
    setTimeout(() => {
      local.revealed = Math.max(local.revealed, r + 1);
      renderKeyboard();
      if (local.solved) {
        els.rows[r].classList.add('win');
        vibrate([20, 40, 80]);
        sfx('solve');
        burst(els.boardWrap, ['#3dff8b', '#00f0ff', '#e8f6ff'], 28);
      } else if (local.done) { vibrate([60, 40, 60]); sfx('absent'); }
    }, flipMs);
    renderKeyboard();

    const sk = secretKey(st.code, g.matchId, g.round);
    const board = {
      g: local.guesses.map(w => encodeWord(w, sk)),
      p: local.patterns.slice(),
      solved: local.solved,
      done: local.done,
      at: serverTimestamp(),
    };
    if (local.solved) board.solvedAt = serverTimestamp();
    set(dbRef(`rooms/${st.code}/boards/${g.matchId}/${g.round}/${st.uid}`), board)
      .catch(() => toast('GUESS NOT SENT — ROUND CLOSED', 'err'));
  }

  function reject(row, msg) {
    vibrate([30, 30, 30]);
    sfx('invalid');
    if (row) pulseClass(row, 'shake', 500);
    toast(msg, 'err', 1200);
  }

  // ---------- opponents ----------
  function renderOpponents(g) {
    const uids = playerOrder(st.players).filter(u => g.participants && g.participants[u] && u !== st.uid);
    // include participants who left (no player node) at the end
    for (const u of Object.keys(g.participants || {})) if (u !== st.uid && !uids.includes(u)) uids.push(u);
    const key = `${roundKey(g)}|${uids.join(',')}`;
    if (els.opps.dataset.key !== key) {
      els.opps.dataset.key = key;
      clear(els.opps);
      els.oppMap = {};
      els.opps.style.setProperty('--n', uids.length);
      for (const uid of uids) {
        const p = st.players[uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
        const cells = [];
        const grid = h('div.mini', { style: { '--len': L() } });
        for (let i = 0; i < MAX_GUESSES * L(); i++) { const c = h('i'); cells.push(c); grid.append(c); }
        const status = h('span.opp-status');
        const card = h('div.opp', { style: { '--c': colorHex(p.color) } },
          h('div.opp-head', avatar(p.avatar, p.color, 18), h('span.opp-name', p.name)), grid, status);
        els.oppMap[uid] = { card, cells, status, shown: 0 };
        els.opps.append(card);
      }
    }
    for (const uid of uids) {
      const o = els.oppMap[uid];
      const b = boardsFor(g)[uid] || {};
      const pats = asArray(b.p);
      pats.forEach((p, r) => {
        for (let i = 0; i < p.length; i++) {
          const c = o.cells[r * L() + i];
          if (c && c.dataset.s !== p[i]) { c.dataset.s = p[i]; if (r >= o.shown) c.style.setProperty('--d', `${i * 50}ms`); }
        }
      });
      o.shown = pats.length;
      const offline = !(st.presence[uid] && st.presence[uid].online);
      o.card.classList.toggle('is-solved', !!b.solved);
      o.card.classList.toggle('is-out', !!b.done && !b.solved);
      o.card.classList.toggle('is-lost', offline);
      o.status.textContent = offline ? 'SIGNAL LOST' : b.solved ? `CRACKED ${pats.length}/6` : b.done ? 'LOCKED OUT' : pats.length ? `${pats.length}/6` : 'DECRYPTING';
    }
  }

  function renderMessage(g) {
    let msg = '';
    if (!amPlaying()) msg = 'SPECTATING — YOU JOIN NEXT MATCH';
    else if (g.phase === 'play' && local.solved) msg = 'CIPHER CRACKED — WAITING FOR OTHERS';
    else if (g.phase === 'play' && local.done) msg = 'OUT OF ATTEMPTS — WAITING FOR OTHERS';
    els.msg.textContent = msg;
    els.msg.classList.toggle('is-on', !!msg);
  }

  // ---------- phase overlays ----------
  function buildOverlay(g) {
    cancelAnimationFrame(introRaf);
    clear(els.overlay);
    els.overlay.className = `cb-overlay ov-${g.phase}`;
    if (g.phase === 'intro') buildIntro(g);
    else if (g.phase === 'reveal') buildReveal(g);
    else if (g.phase === 'standings') buildStandings(g);
    else if (g.phase === 'final') buildFinal(g);
  }

  function buildIntro(g) {
    const num = h('div.intro-count', '3');
    els.overlay.append(h('div.intro',
      h('div.intro-kicker', 'INCOMING TRANSMISSION'),
      h('div.intro-round', 'ROUND ', h('b', String(g.round + 1).padStart(2, '0')), h('span', ` / ${String(g.rounds).padStart(2, '0')}`)),
      h('div.intro-len', `${L()}-LETTER CIPHER`),
      h('div.intro-dots', Array.from({ length: L() }, () => h('i'))),
      num));
    let last = '';
    const tickIntro = () => {
      const left = g.phaseEndsAt - serverNow();
      const t = left > 0 ? String(Math.ceil(left / 1000)) : 'GO';
      if (t !== last) { last = t; num.textContent = t; pulseClass(num, 'tick'); if (t !== 'GO') { vibrate(10); sfx('tick'); } else sfx('challenge'); }
      if (left > -500) introRaf = requestAnimationFrame(tickIntro);
    };
    tickIntro();
  }

  function buildReveal(g) {
    const word = (g.reveal || '').toLowerCase();
    const tiles = h('div.reveal-word', { style: { '--len': word.length } },
      [...word].map((ch, i) => h('div.tile.flip', { dataset: { s: '2' }, style: { '--d': `${200 + i * FLIP_STAGGER}ms` } },
        h('div.tile-in', h('span.face.front', ''), h('span.face.back', ch)))));
    els.revealList = h('ol.reveal-list');
    els.overlay.append(h('div.sheet.reveal',
      h('div.sheet-kicker', local.solved ? 'CIPHER CRACKED' : amPlaying() ? 'BREACH FAILED — THE WORD WAS' : 'THE WORD WAS'),
      tiles,
      els.revealList));
    els.revealShown = false;
    sfx('roundEnd');
    refreshReveal(g);
    if (local.solved) setTimeout(() => burst(els.overlay, ['#3dff8b', '#00f0ff', '#f3ff3a']), 900);
  }

  function refreshReveal(g) {
    const res = (g.results && g.results[g.round]) || null;
    if (!res || els.revealShown) return;
    els.revealShown = true;
    const rows = Object.entries(res).sort((a, b) => b[1].pts - a[1].pts || a[1].t - b[1].t);
    rows.forEach(([uid, r], i) => {
      const p = st.players[uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
      const pts = h('span.rr-pts', '+0');
      const detail = r.solved ? `✓ ${r.n}/6 · ${fmtTime(r.t)}` : '✗ NO BREACH';
      els.revealList.append(h('li.rr', { class: uid === st.uid ? 'is-me' : null, style: { '--c': colorHex(p.color), animationDelay: `${700 + i * 90}ms` } },
        avatar(p.avatar, p.color, 28), h('span.rr-name', p.name), h('span.rr-detail', { class: r.solved ? 'ok' : 'bad' }, detail), pts));
      setTimeout(() => cancelers.push(countUp(pts, 0, r.pts, 900, n => `+${fmtNum(n)}`)), 900 + i * 90);
    });
  }

  function buildStandings(g) {
    const now = standings(g, g.round);
    const prev = standings(g, g.round - 1);
    const prevMap = Object.fromEntries(prev.map(r => [r.uid, r]));
    const res = (g.results && g.results[g.round]) || {};
    const rows = now.map(r => ({ ...r, prevScore: prevMap[r.uid] ? prevMap[r.uid].score : 0, prevRank: prevMap[r.uid] && g.round > 0 ? prevMap[r.uid].rank : null, delta: res[r.uid] ? res[r.uid].pts : 0 }));
    const next = g.lengths[g.round + 1];
    els.overlay.append(h('div.panel-full.standings',
      h('div.sheet-kicker', `STANDINGS // AFTER ROUND ${g.round + 1}`),
      leaderboard(rows, st.players, { me: st.uid, presence: st.presence }),
      h('div.next-up', 'NEXT: ', h('b', `${next}-LETTER CIPHER`), ` · ROUND ${g.round + 2}/${g.rounds}`)));
  }

  function buildFinal(g) {
    els.final = createFinal({
      rows: standings(g), players: st.players, me: st.uid, presence: st.presence,
      winnerLine: name => `${name} BREACHED THE MAINFRAME`,
    });
    els.overlay.append(els.final.el);
  }

  return { mount, update, unmount };
}

function fmtTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
