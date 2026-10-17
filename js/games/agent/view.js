// DOUBLE AGENT — player view. A classified surveillance feed in graphite and silver: the players' own colours are
// the only colour on screen. Everything renders from the room state; the unmasking runs on server time since the
// phase began, so every phone (and a phone that rejoins) shows the same moment.
//
// Your classified file comes from spy/{code}/card/{uid} (readable only by you). In SAME ROOM mode every file —
// agent or not — has the same panel, brightness, animation, sound and buzz; only the words on it differ.
import { h, clear, pulseClass, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, createTimer, countUp, leaderboard } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, update as dbUpdate, remove, onValue, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { isHost } from '../../store.js';
import { sfx } from '../../audio/sfx.js';
import { duckMusic } from '../../audio/music.js';
import {
  BRIEF_MS, VOTE_MS, LAST_MS, UNMASK_EACH_MS, CLUE_MAX, PTS, clueProblem, totals, standings,
} from './logic.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@0123456789';
const pad2 = n => String(n).padStart(2, '0');
const caseNo = m => `${String(m || '').toUpperCase().slice(0, 4)}-${(String(m || 'x').charCodeAt(0) % 9) + 1}`;
const FINGERPRINT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6c-9.4 0-17 7.6-17 17 0 2.2.4 4.3 1.2 6.2M40.2 29a17 17 0 0 0 .8-6c0-9.4-7.6-17-17-17M14 37.5A16.9 16.9 0 0 1 11 28v-5c0-7.2 5.8-13 13-13s13 5.8 13 13v4.5M18 40.5c-1.3-2.6-2-5.5-2-8.5v-9a8 8 0 0 1 16 0v8c0 3 .6 5.8 1.6 8.4M24 43c-2.4-3.2-3.6-7-3.6-11v-9a3.6 3.6 0 0 1 7.2 0v9"/></svg>';

export function createView() {
  let root, st;
  const els = {};
  let timer;
  let phaseKey = '';
  let final = null;
  let lastScore = 0;
  let clockTimer = 0;
  let vvHandler = null;
  let card = null;                 // my classified file for this round (or null)
  let cardOff = null;
  let cardUid = '';
  let seenFile = '';               // rk of the file I've opened at least once
  let board = null;                // the clue board (clues / debate / vote)
  let turnUi = null;               // my clue-input overlay
  let unmask = null;               // the unmasking sequence driver
  let debateChat = null;           // the full-screen debate chat (REMOTE)
  let lastVoided = 0;
  const decoded = new Set();       // clue keys already shown (only new ones decode)

  const g = () => st.game;
  const me = () => st.uid;
  // a player who left keeps the name the game remembered (game.names)
  const player = uid => st.players[uid] || (st.game && st.game.names && st.game.names[uid] ? { ...GHOST, name: st.game.names[uid], color: 'cyan' } : GHOST);
  const seated = game => !!(game.seat && game.seat.includes(me()));
  const mode = game => (game.settings && game.settings.mode) || 'remote';
  const NODE = { clues: 'agclue', ready: 'agready', pins: 'agpin', votes: 'agvote', guess: 'agguess' };
  const liveOf = (game, name) => (st.liveKey && st.liveKey.includes(`"${NODE[name]}/${game.matchId}/${game.rk}"`) && st.live[name]) || {};
  const writeMine = (node, value) => set(dbRef(`rooms/${st.code}/${node}/${g().matchId}/${g().rk}/${me()}`), value);
  const cardFor = game => (card && card.m === game.matchId && card.rk === game.rk ? card : null);

  // ---------------------------------------------------------------- mount / unmount
  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('da');
    timer = createTimer({ warnAt: 5_000, ticks: true });
    els.grain = h('div.da-grain', { 'aria-hidden': 'true' });
    els.frame = h('div.da-frame', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'));
    els.rec = h('div.da-rec', { 'aria-hidden': 'true' }, h('b', '●'), ' REC');
    els.clock = h('div.da-clock', { 'aria-hidden': 'true' });
    els.sub = h('div.da-sub');
    els.score = h('div.da-score', '0');
    els.head = h('header.game-head.da-head',
      h('div.da-head-l', h('div.da-title', 'DOUBLE', h('b', 'AGENT')), els.sub),
      h('div.da-score-wrap', h('small', 'SCORE'), els.score));
    els.timer = h('div.da-timer', timer.el);
    els.stage = h('section.da-stage');
    els.overlay = h('div.da-overlay');
    els.turn = h('div.da-turn-layer');
    root.append(els.grain, els.frame, els.rec, els.clock, els.head, els.timer, els.stage, els.turn, els.overlay);
    // iOS keyboard: keep the clue / debate / last-chance input above it
    if (window.visualViewport) {
      vvHandler = () => {
        const vv = window.visualViewport;
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty('--kb', `${Math.round(kb)}px`);
        root.classList.toggle('kb-open', kb > 80);
      };
      window.visualViewport.addEventListener('resize', vvHandler);
      window.visualViewport.addEventListener('scroll', vvHandler);
      vvHandler();
    }
    clockTimer = setInterval(paintClock, 250);
    paintClock();
    if (/[?&]emu\b/.test(location.search)) {
      window.__da = { card: () => card, view: () => ({ phaseKey, turnUi: !!turnUi, board: !!board }) };
    }
    update(state);
  }

  function unmount() {
    timer && timer.stop();
    clearInterval(clockTimer);
    if (cardOff) cardOff();
    if (board) board.destroy();
    if (turnUi) turnUi.destroy();
    if (unmask) unmask.destroy();
    if (debateChat) debateChat.destroy();
    if (final) final.destroy();
    duckMusic(1, 0.6);
    document.body.classList.remove('da-inline-chat');
    if (vvHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', vvHandler);
      window.visualViewport.removeEventListener('scroll', vvHandler);
    }
  }

  function paintClock() {
    const t = new Date(serverNow());
    els.clock.textContent = `${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}:${pad2(Math.floor(t.getMilliseconds() / 40))}`;
  }

  // my classified file: spy/{code}/card/{uid} — only I can read it
  function watchCard() {
    if (cardUid === `${st.code}|${me()}`) return;
    if (cardOff) cardOff();
    cardUid = `${st.code}|${me()}`;
    cardOff = onValue(dbRef(`spy/${st.code}/card/${me()}`), snap => {
      card = snap.val();
      if (st) update(st);
    }, () => { card = null; });
  }

  // ---------------------------------------------------------------- update
  function update(state) {
    st = state;
    const game = g();
    if (!game) return;
    watchCard();
    root.dataset.phase = game.phase;
    root.dataset.mode = mode(game);
    const rounds = game.settings.rounds;
    els.sub.textContent = `CASE ${caseNo(game.matchId)} · FILE ${game.round + 1}/${rounds} · ${PHASE_LABEL[game.phase] || ''}`;
    const total = game.phase === 'clues' ? game.settings.clueSec * 1000
      : game.phase === 'debate' ? game.settings.debateSec * 1000
        : game.phase === 'vote' ? VOTE_MS : game.phase === 'briefing' ? BRIEF_MS : game.phase === 'last' ? LAST_MS
          : Math.max(1, game.phaseEndsAt - game.phaseStartAt);
    timer.set(game.phaseEndsAt, total);
    els.timer.classList.toggle('is-live', ['briefing', 'clues', 'debate', 'vote', 'last'].includes(game.phase));
    const my = totals(game)[me()] || 0;
    if (my !== lastScore && !['unmask', 'last'].includes(game.phase)) { countUp(els.score, lastScore, my, 900); lastScore = my; }
    if ((game.voided || 0) > lastVoided) { if (lastVoided || phaseKey) toast('AN AGENT LEFT — FILES RE-ISSUED', 'warn', 3200); lastVoided = game.voided || 0; }

    const pk = `${game.matchId}|${game.rk}|${game.phase}`;
    if (pk !== phaseKey) { phaseKey = pk; build(game); }
    refresh(game);
  }

  const PHASE_LABEL = { intro: 'BRIEFING', briefing: 'READ YOUR FILE', clues: 'CLUES', debate: 'DEBATE', vote: 'VOTE', unmask: 'UNMASKING', last: 'LAST CHANCE', scores: 'CASE CLOSED', final: 'DEBRIEF' };

  function teardownPhase() {
    if (board) { board.destroy(); board = null; }
    if (turnUi) { turnUi.destroy(); turnUi = null; }
    if (unmask) { unmask.destroy(); unmask = null; }
    if (debateChat) { debateChat.destroy(); debateChat = null; }
    document.body.classList.remove('da-inline-chat');
    els.brief = null; els.debate = null; els.vote = null; els.last = null; els.talkCount = null;
    clear(els.stage);
    clear(els.overlay);
    clear(els.turn);
    els.overlay.className = 'da-overlay';
  }

  function build(game) {
    teardownPhase();
    if (game.phase !== 'unmask' && game.phase !== 'last') duckMusic(1, 1.4);
    switch (game.phase) {
      case 'intro': return buildIntro(game);
      case 'briefing': return buildBriefing(game);
      case 'clues': return buildBoardPhase(game);
      case 'debate': return buildBoardPhase(game);
      case 'vote': return buildBoardPhase(game);
      case 'unmask': return buildUnmask(game);
      case 'last': return buildLast(game);
      case 'scores': return buildScores(game);
      case 'final': return buildFinal(game);
      default: return null;
    }
  }

  function refresh(game) {
    if (els.brief) els.brief.refresh(game);
    if (board) board.update(game);
    if (game.phase === 'clues') refreshTurn(game);
    if (els.debate) els.debate.refresh(game);
    if (els.vote) els.vote.refresh(game);
    if (els.last) els.last.refresh(game);
    if (game.phase === 'final' && final) final.refresh();
  }

  // ---------------------------------------------------------------- shared bits
  // RGB-split glitch text: the two colour ghosts are pseudo-elements driven by data-text (transform only)
  const glitchText = (sel, text) => h(sel, { 'data-text': text }, text);
  function decodeInto(el, text, { quiet = false, speed = 38 } = {}) {
    const target = String(text);
    if (reducedMotion() || !target) { el.textContent = target; return () => {}; }
    let i = 0;
    let stop = false;
    const tick = () => {
      if (stop) return;
      let out = '';
      for (let k = 0; k < target.length; k++) {
        const ch = target[k];
        out += k < i || ch === ' ' || ch === '-' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (i <= target.length) { if (!quiet && i < target.length) sfx('daDecode', { i }); i += 1; setTimeout(tick, speed); }
    };
    tick();
    return () => { stop = true; el.textContent = target; };
  }
  // the secret word always fits on one line per word (long words shrink instead of breaking mid-word)
  function fitWord(el, word, big) {
    const longest = Math.max(...String(word).split(/s+/).map(w => w.length));
    const px = big ? Math.min(44, Math.floor(300 / (longest * 0.74))) : Math.min(20, Math.floor(150 / (longest * 0.74)));
    el.style.fontSize = `${Math.max(big ? 20 : 12, px)}px`;
    return el;
  }
  // a file you press and hold: the same element for the briefing and the in-game "peek"
  function fileCard(game, { big = true } = {}) {
    const c = cardFor(game);
    const room = mode(game) === 'room';
    const agent = !!(c && c.agent);
    const el = h('div.da-file', { class: [big ? 'is-big' : 'is-mini', room ? 'is-room' : 'is-remote', agent && !room ? 'is-agent-remote' : agent ? 'is-agent-room' : 'is-normal'].join(' ') });
    const sealed = h('div.da-file-seal',
      h('div.da-file-stamp', 'TOP SECRET'),
      h('span.da-fp', { html: FINGERPRINT }),
      h('b', c ? 'PRESS & HOLD' : 'DECRYPTING FILE…'),
      h('small', c ? 'TO READ YOUR FILE' : 'one moment'));
    const inner = c
      ? (agent
        ? h('div.da-file-body', h('small.da-k', 'YOU ARE THE'), glitchText('b.da-big.is-role', 'DOUBLE AGENT'), h('span.da-cat', `CATEGORY · ${c.cat}`), h('span.da-hint', room ? 'BLEND IN.' : 'You don’t know the word. Blend in.'))
        : h('div.da-file-body', h('small.da-k', 'THE WORD'), fitWord(glitchText('b.da-big', String(c.word).toUpperCase()), c.word, big), h('span.da-cat', `CATEGORY · ${c.cat}`), h('span.da-hint', room ? 'GIVE GOOD CLUES.' : 'Clue it — but not too obviously.')))
      : null;
    el.append(h('div.da-file-head', h('span', `FILE ${caseNo(game.matchId)}/${game.round + 1}`), h('span', 'EYES ONLY')), sealed, inner || '');
    const open = () => {
      if (!cardFor(game) || el.classList.contains('is-open')) return;
      el.classList.add('is-open');
      const c2 = cardFor(game);
      const jolt = c2.agent && !room; // REMOTE agent: the jolt. Everyone else — and in SAME ROOM everyone — the identical reveal
      const fx = jolt ? { sound: 'daAgent', buzz: [70, 40, 140], shake: true } : { sound: 'daReveal', buzz: [30], shake: false };
      sfx(fx.sound);
      vibrate(fx.buzz.length > 1 ? fx.buzz : fx.buzz[0]);
      if (fx.shake) pulseClass(root, 'da-shake', 520);
      if (window.__da) window.__da.reveal = { ...fx, cls: el.className }; // E2E: same-room reveals must match
      if (seenFile !== game.rk) { seenFile = game.rk; if (els.brief) els.brief.refresh(game); }
    };
    const close = () => el.classList.remove('is-open');
    el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch { /* */ } open(); });
    el.addEventListener('pointerup', close);
    el.addEventListener('pointercancel', close);
    el.addEventListener('lostpointercapture', close);
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Press and hold to read your classified file');
    el.tabIndex = 0;
    el.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); open(); } });
    el.addEventListener('keyup', close);
    return el;
  }

  // ---------------------------------------------------------------- INTRO: the title locks in out of static
  function buildIntro(game) {
    els.overlay.className = 'da-overlay ov-intro';
    const typed = h('div.da-typed');
    const left = Math.max(0, game.phaseEndsAt - serverNow());
    els.overlay.append(h('div.da-static.is-intro', { 'aria-hidden': 'true' }), h('div.da-intro',
      h('div.da-intro-case', `CASE ${caseNo(game.matchId)} · ${game.seat.length} OPERATIVES`),
      glitchText('h1.da-intro-title', 'DOUBLE AGENT'),
      typed,
      h('div.da-intro-rules', `${game.settings.rounds} FILES · ${game.settings.agents === 2 ? 'TWO AGENTS' : 'ONE AGENT'} · ${mode(game) === 'room' ? 'SAME ROOM' : 'REMOTE'}`)));
    sfx('daReveal');
    const text = 'CLASSIFIED BRIEFING';
    setTimeout(() => decodeInto(typed, text, { quiet: true, speed: 55 }), left > 5000 ? 1100 : 0);
  }

  // ---------------------------------------------------------------- BRIEFING: read your file, READY
  function buildBriefing(game) {
    if (!seated(game)) { els.stage.append(spectating(game)); return; }
    const fileWrap = h('div.da-file-wrap');
    const readyBtn = h('button.btn.btn-primary.btn-xl.btn-block.da-ready', { type: 'button', onclick: () => ready() }, h('span', 'READY'));
    const status = h('div.da-ready-row');
    const lead = h('p.da-lead');
    els.stage.append(h('div.da-brief',
      h('div.da-kicker', `CLASSIFIED FILE · ${game.round + 1} OF ${game.settings.rounds}`),
      lead, fileWrap, readyBtn, status));
    let built = '';
    const ready = () => {
      if (!cardFor(game) || seenFile !== game.rk) { toast('READ YOUR FILE FIRST — PRESS AND HOLD', 'info'); return; }
      writeMine('agready', { b: true }).catch(() => {});
      sfx('lock');
      vibrate(12);
    };
    els.brief = {
      refresh(gm) {
        if (gm.phase !== 'briefing') return;
        const key = cardFor(gm) ? `${gm.rk}|${cardFor(gm).agent}` : 'none';
        if (key !== built) { built = key; fileWrap.replaceChildren(fileCard(gm)); }
        const r = liveOf(gm, 'ready');
        const mine = r[me()] && r[me()].b;
        lead.textContent = mine ? 'Waiting for the other operatives…' : seenFile === gm.rk ? 'Got it? Tap READY.' : 'Everyone gets the same word — except the agent.';
        readyBtn.disabled = !!mine;
        readyBtn.firstChild.textContent = mine ? 'READY ✓' : 'READY';
        readyBtn.classList.toggle('is-armed', seenFile === gm.rk && !mine);
        status.replaceChildren(...gm.seat.map(u => {
          const p = player(u);
          return h('span.da-ready-dot', { class: r[u] && r[u].b ? 'is-ready' : null, style: { '--c': colorHex(p.color) }, title: p.name }, avatar(p.avatar, p.color, 22));
        }));
      },
    };
    els.brief.refresh(game);
  }

  function spectating(game) {
    return h('div.da-spectate', h('span.da-kicker', 'OBSERVING'), h('b', 'You join next round'), h('small', `${game.seat.length} operatives are on this file.`));
  }

  // ---------------------------------------------------------------- the board (clues / debate / vote)
  function buildBoardPhase(game) {
    const ph = game.phase;
    board = createBoard(game);
    const wrap = h('div.da-phase', { class: `is-${ph}` });
    const head = h('div.da-phase-head');
    wrap.append(head, board.el);
    els.stage.append(wrap);
    if (seated(game) && ph === 'clues') wrap.append(peekButton(game));
    if (seated(game) && ph === 'debate') { head.classList.add('has-peek'); head.append(h('div.da-peek.is-compact', fileCard(game, { big: false }))); }
    if (ph === 'clues') {
      head.append(h('div.da-kicker', 'CLUE ROUND'), h('p.da-lead', 'One word each. The board decodes as you go.'));
    }
    if (ph === 'debate') buildDebate(game, head, wrap);
    if (ph === 'vote') buildVote(game, head, wrap);
  }

  // hold to peek at your file during clues/debate (same look in SAME ROOM mode for everyone)
  function peekButton(game) {
    const mini = fileCard(game, { big: false });
    return h('div.da-peek', mini);
  }

  function createBoard(game) {
    const el = h('div.da-board', { class: `is-${game.phase}` });
    const tiles = new Map();
    const order = () => (g().order && g().order.length ? g().order : g().seat);
    const build = () => {
      clear(el);
      tiles.clear();
      for (const uid of order()) {
        const p = player(uid);
        const clues = h('div.da-clues');
        const pins = h('div.da-pins');
        const status = h('div.da-status');
        const tile = h('button.da-tile', {
          type: 'button', dataset: { uid, sfx: 'none' }, style: { '--c': colorHex(p.color) },
          'aria-label': p.name, onclick: () => tapTile(uid),
        },
        h('span.da-tile-corner', { 'aria-hidden': 'true' }),
        h('div.da-tile-id', avatar(p.avatar, p.color, 30), h('b.da-tile-name', p.name), uid === me() ? h('span.da-you', 'YOU') : null),
        status, clues, pins, h('i.da-scan', { 'aria-hidden': 'true' }));
        tiles.set(uid, { tile, clues, pins, status, shown: {} });
        el.append(tile);
      }
    };
    let sig = '';
    const api = {
      el,
      update(gm) {
        const s = order().join(',');
        if (s !== sig) { sig = s; build(); }
        el.className = `da-board is-${gm.phase} n-${order().length}`;
        const passes = gm.settings.passes;
        const pinsLive = liveOf(gm, 'pins');
        const votes = liveOf(gm, 'votes');
        for (const [uid, t] of tiles) {
          // clue slots, one per pass: decode when a clue first lands
          for (let p = 0; p < passes; p++) {
            const v = gm.board && gm.board[p] ? gm.board[p][uid] : undefined;
            let slot = t.clues.children[p];
            if (!slot) { slot = h('span.da-clue'); t.clues.append(slot); }
            const key = `${gm.matchId}|${gm.rk}|${p}|${uid}`;
            if (v === undefined) { if (t.shown[p] !== null) { slot.className = 'da-clue is-empty'; slot.textContent = '· · ·'; t.shown[p] = null; } continue; }
            if (t.shown[p] === v) continue;
            t.shown[p] = v;
            if (v === '') { slot.className = 'da-clue is-skip'; slot.textContent = '— NO SIGNAL —'; continue; }
            slot.className = 'da-clue is-in';
            if (decoded.has(key)) slot.textContent = v.toUpperCase();
            else { decoded.add(key); decodeInto(slot, v.toUpperCase()); }
          }
          const cur = gm.phase === 'clues' && gm.cur === uid;
          t.tile.classList.toggle('is-current', cur);
          t.tile.classList.toggle('is-me', uid === me());
          t.tile.classList.toggle('is-off', !(st.presence[uid] && st.presence[uid].online));
          t.status.textContent = cur ? `${player(uid).name} is thinking…` : '';
          // pins (debate + vote) and votes (vote): small marks in the pinner's / voter's colour
          const marks = [];
          if (gm.phase === 'debate' || gm.phase === 'vote') {
            for (const [pinner, target] of Object.entries(pinsLive)) if (target === uid) marks.push(['pin', pinner]);
          }
          if (gm.phase === 'vote') for (const [voter, x] of Object.entries(votes)) if (x && x.s === uid) marks.push([x.lock ? 'vote is-locked' : 'vote', voter]);
          const msig = JSON.stringify(marks);
          if (t.pins.dataset.sig !== msig) {
            const before = (t.pins.dataset.sig && JSON.parse(t.pins.dataset.sig).length) || 0;
            t.pins.dataset.sig = msig;
            t.pins.replaceChildren(...marks.map(([kind, who]) => h(`i.da-mark.${kind.replace(' ', '.')}`, { style: { '--c': colorHex(player(who).color) }, title: player(who).name })));
            if (marks.length > before) sfx(gm.phase === 'vote' ? 'daVote' : 'daPin');
          }
          const myPin = pinsLive[me()];
          const myVote = votes[me()];
          t.tile.classList.toggle('is-pinned', myPin === uid);
          t.tile.classList.toggle('is-voted', !!(myVote && myVote.s === uid));
          t.tile.disabled = !(seated(gm) && (gm.phase === 'debate' || gm.phase === 'vote') && uid !== me()) || !!(gm.phase === 'vote' && myVote && myVote.lock);
        }
      },
      destroy() {},
    };
    const tapTile = uid => {
      const gm = g();
      if (!seated(gm) || uid === me()) return;
      if (gm.phase === 'debate') {
        const pins = liveOf(gm, 'pins');
        const path = `rooms/${st.code}/agpin/${gm.matchId}/${gm.rk}/${me()}`;
        (pins[me()] === uid ? remove(dbRef(path)) : set(dbRef(path), uid)).catch(() => {});
        vibrate(8);
      } else if (gm.phase === 'vote') {
        const v = liveOf(gm, 'votes')[me()];
        if (v && v.lock) return;
        writeMine('agvote', { s: uid, lock: false, at: serverTimestamp() }).catch(() => toast('VOTING IS CLOSED', 'err'));
        vibrate(10);
      }
    };
    api.update(game);
    return api;
  }

  // ---------------------------------------------------------------- CLUES: my turn
  function refreshTurn(game) {
    const mine = seated(game) && game.cur === me();
    const key = `${game.rk}|${game.turn}`;
    if (!mine) { if (turnUi) { turnUi.destroy(); turnUi = null; } return; }
    if (turnUi && turnUi.key === key) { turnUi.refresh(game); return; }
    if (turnUi) turnUi.destroy();
    turnUi = buildTurn(game, key);
  }

  function buildTurn(game, key) {
    const c = cardFor(game);
    const input = h('input.da-input', {
      type: 'text', inputmode: 'text', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false',
      enterkeyhint: 'send', maxlength: String(CLUE_MAX), 'aria-label': 'Your one-word clue', placeholder: 'ONE WORD',
    });
    const err = h('div.da-err', { 'aria-live': 'polite' });
    const bar = h('i');
    const send = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button', dataset: { sfx: 'none' } }, h('span', 'TRANSMIT'));
    const remind = c
      ? (c.agent ? h('div.da-remind.is-agent', h('small', mode(game) === 'room' ? 'YOUR FILE' : 'YOU ARE THE AGENT · CATEGORY'), h('b', mode(game) === 'room' ? `${c.cat}` : c.cat))
        : h('div.da-remind', h('small', 'THE WORD'), h('b', String(c.word).toUpperCase())))
      : null;
    // in SAME ROOM the reminder never shows whether you're the agent: just the category for everyone, held to read
    const passTotal = game.settings.passes;
    const el = h('div.da-turn',
      h('div.da-turn-box',
        h('div.da-kicker', passTotal > 1 ? `YOUR TURN · CLUE ${game.pass + 1} OF ${passTotal}` : 'YOUR TURN'),
        mode(game) === 'room' ? peekButton(game) : remind,
        h('label.da-field', input, h('span.da-field-line')),
        err,
        h('div.da-turn-bar', bar),
        send));
    els.turn.append(el);
    pulseClass(el, 'is-in');
    sfx('select');
    vibrate([18, 40, 18]);
    const left = Math.max(0, (game.turnEndsAt || game.phaseEndsAt) - serverNow());
    const totalMs = game.settings.clueSec * 1000;
    bar.style.transform = `scaleX(${left / totalMs})`;
    requestAnimationFrame(() => { bar.style.transition = `transform ${left}ms linear`; bar.style.transform = 'scaleX(0)'; });
    let sent = false;
    const given = gm => Object.values(gm.board || {}).flatMap(p => Object.values(p || {})).filter(Boolean);
    const submit = () => {
      if (sent) return;
      const gm = g();
      const c2 = cardFor(gm);
      const problem = clueProblem(input.value, c2 && !c2.agent ? c2.word : null, given(gm));
      if (problem) { err.textContent = problem; pulseClass(el.querySelector('.da-field'), 'shake', 420); sfx('invalid'); return; }
      sent = true;
      set(dbRef(`rooms/${st.code}/agclue/${gm.matchId}/${gm.rk}/${gm.pass}/${me()}`), { t: input.value.trim(), at: serverTimestamp() })
        .then(() => { sfx('lock'); vibrate(14); el.classList.add('is-sent'); input.blur(); })
        .catch(() => { sent = false; err.textContent = 'Too late — your turn is over.'; });
    };
    input.addEventListener('input', () => {
      const clean = input.value.replace(/[^A-Za-z-]/g, '');
      if (clean !== input.value) input.value = clean;
      err.textContent = '';
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    send.addEventListener('pointerdown', e => { e.preventDefault(); submit(); }); // keeps the keyboard up until it's sent
    send.addEventListener('click', e => { if (e.detail === 0) submit(); });
    setTimeout(() => input.focus({ preventScroll: true }), 60);
    return {
      key,
      refresh() {},
      destroy() { input.blur(); el.classList.add('is-out'); setTimeout(() => el.remove(), 220); },
    };
  }

  // ---------------------------------------------------------------- DEBATE
  function buildDebate(game, head, wrap) {
    const room = mode(game) === 'room';
    const readyBtn = h('button.btn.btn-ghost.da-vote-ready', { type: 'button', onclick: () => toggleReady() }, 'READY TO VOTE');
    // every phone has the button; only the CURRENT host sees it (the host can change mid-debate)
    const endBtn = h('button.btn.btn-primary.da-end', { type: 'button', hidden: true, onclick: () => endDebate() }, 'START THE VOTE');
    const count = h('span.da-ready-count');
    head.prepend(h('div.da-head-text', h('div.da-kicker', room ? 'TALK IT OUT' : 'DEBATE'),
      h('p.da-lead', 'Tap a player to pin them as suspicious.')));
    if (room) {
      const big = h('div.da-talk-count');
      wrap.append(h('div.da-talk', h('b', 'TALK IT OUT'), big, h('small', 'Who sounded like they didn’t know the word?')));
      els.talkCount = big;
    } else {
      document.body.classList.add('da-inline-chat');
      debateChat = createDebateChat();
      wrap.append(debateChat.el);
    }
    if (seated(game)) wrap.append(h('div.da-debate-foot', readyBtn, count, endBtn));
    const toggleReady = () => {
      const gm = g();
      const r = liveOf(gm, 'ready')[me()] || {};
      writeMine('agready', { b: !!r.b, d: !r.d }).catch(() => {});
      sfx('tap');
    };
    const endDebate = () => {
      const gm = g();
      if (!isHost() || gm.phase !== 'debate') return;
      dbUpdate(dbRef(`rooms/${st.code}/game`), { debateEnd: true }).catch(() => {});
    };
    els.debate = {
      refresh(gm) {
        if (gm.phase !== 'debate') return;
        const r = liveOf(gm, 'ready');
        const online = gm.seat.filter(u => st.presence[u] && st.presence[u].online);
        const n = online.filter(u => r[u] && r[u].d).length;
        const mine = !!(r[me()] && r[me()].d);
        readyBtn.classList.toggle('is-on', mine);
        readyBtn.textContent = mine ? 'READY ✓' : 'READY TO VOTE';
        count.textContent = `${n}/${online.length} READY`;
        endBtn.hidden = !isHost();
        endBtn.disabled = n < online.length;
        endBtn.textContent = n < online.length ? 'WAITING FOR READY' : 'START THE VOTE';
        if (els.talkCount) els.talkCount.textContent = String(Math.max(0, Math.ceil((gm.phaseEndsAt - serverNow()) / 1000)));
      },
    };
    if (room) { const t = setInterval(() => { if (els.debate && g().phase === 'debate') els.debate.refresh(g()); else clearInterval(t); }, 500); }
  }

  // a big, readable chat for the REMOTE debate (the room chat's data, rules and filter)
  function createDebateChat() {
    const list = h('div.da-chat-list', { role: 'log', 'aria-live': 'polite', 'aria-label': 'Debate' });
    const input = h('input.da-chat-input', { type: 'text', maxlength: '300', enterkeyhint: 'send', autocomplete: 'off', autocorrect: 'on', spellcheck: true, placeholder: 'Make your case…', 'aria-label': 'Message' });
    const hint = h('div.da-chat-hint');
    const sendBtn = h('button.da-chat-send', { type: 'submit', 'aria-label': 'Send', dataset: { sfx: 'none' } }, 'SEND');
    const form = h('form.da-chat-form', { onsubmit: e => { e.preventDefault(); go(); } }, input, sendBtn);
    const el = h('div.da-chat', list, hint, form);
    let mod = null, logic = null, off = null, dead = false;
    const nodes = new Map();
    const filterOn = () => !!(st.meta && st.meta.settings && st.meta.settings.chat && st.meta.settings.chat.filter);
    const render = () => {
      if (!mod) return;
      const msgs = mod.chat.msgs.filter(m => m.at >= (g() ? g().phaseStartAt - 1000 : 0));
      const keep = new Set(msgs.map(m => m.k));
      for (const [k, n] of nodes) if (!keep.has(k)) { n.remove(); nodes.delete(k); }
      const bottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
      for (const m of msgs) {
        if (nodes.has(m.k)) continue;
        let n;
        if (m.s) n = h('div.da-msg.is-sys', m.x);
        else {
          const p = player(m.u);
          const text = h('span.da-msg-text');
          text.textContent = filterOn() ? logic.maskProfanity(m.t) : m.t;
          n = h('div.da-msg', { class: m.u === me() ? 'is-me' : null, style: { '--c': colorHex(p.color) } }, h('b', p.name || m.n), text);
        }
        nodes.set(m.k, n);
        list.append(n);
      }
      if (!msgs.length && !list.querySelector('.da-chat-empty')) list.append(h('div.da-chat-empty', 'Nobody has spoken yet. Someone is lying.'));
      if (msgs.length) { const e = list.querySelector('.da-chat-empty'); if (e) e.remove(); }
      if (bottom) list.scrollTop = list.scrollHeight;
    };
    const go = () => {
      if (!mod) return;
      const r = mod.send(input.value);
      if (r === 'ok') { input.value = ''; sfx('lock'); list.scrollTop = list.scrollHeight; }
      else if (r === 'slow') { hint.textContent = 'Slow down — one message a second.'; setTimeout(() => { hint.textContent = ''; }, 2000); }
    };
    input.addEventListener('input', () => { if (mod) { if (input.value.trim()) mod.typingPing(); else mod.stopTyping(); } });
    Promise.all([import('../../chat/chat.js'), import('../../chat/logic.js')]).then(([m, l]) => {
      if (dead) return;
      mod = m; logic = l;
      off = m.onChat(kind => { if (kind === 'msgs' || kind === 'outbox') render(); if (kind === 'msgs') m.markRead(); });
      render();
      list.scrollTop = list.scrollHeight;
    }).catch(() => { hint.textContent = 'Chat unavailable — talk it out!'; });
    return { el, destroy() { dead = true; if (off) off(); if (mod) mod.stopTyping(); input.blur(); } };
  }

  // ---------------------------------------------------------------- VOTE
  function buildVote(game, head, wrap) {
    const lockBtn = h('button.btn.btn-primary.btn-xl.btn-block.da-lock', { type: 'button', onclick: () => lockIn() }, h('span', 'LOCK IN VOTE'));
    const info = h('p.da-lead');
    head.append(h('div.da-kicker', game.settings.agents === 2 ? 'VOTE · TWO AGENTS HIDE AMONG YOU' : 'VOTE · WHO IS THE DOUBLE AGENT?'), info);
    if (seated(game)) wrap.append(h('div.da-vote-foot', lockBtn));
    sfx('select');
    const lockIn = () => {
      const gm = g();
      const v = liveOf(gm, 'votes')[me()];
      if (!v || !v.s || v.lock) return;
      writeMine('agvote', { s: v.s, lock: true, at: serverTimestamp() }).catch(() => {});
      sfx('daVote');
      vibrate([20, 30, 40]);
    };
    els.vote = {
      refresh(gm) {
        if (gm.phase !== 'vote') return;
        const v = liveOf(gm, 'votes')[me()];
        const votes = liveOf(gm, 'votes');
        const locked = Object.values(votes).filter(x => x && x.lock).length;
        info.textContent = !seated(gm) ? 'Watching the vote.' : v && v.lock ? `Locked in · ${locked}/${gm.seat.length} have voted` : v && v.s ? `Your pick: ${player(v.s).name}. Change it, or lock it in.` : 'Tap the player you suspect. Not yourself.';
        lockBtn.disabled = !(v && v.s) || !!(v && v.lock);
        lockBtn.firstChild.textContent = v && v.lock ? 'VOTE LOCKED ✓' : 'LOCK IN VOTE';
      },
    };
  }

  // ---------------------------------------------------------------- UNMASKING (server-time sequence)
  function buildUnmask(game) {
    duckMusic(0.06, 0.6);
    els.overlay.className = 'da-overlay ov-unmask';
    const accused = Object.keys(game.accused || {}).sort((a, b) => ((game.tally || {})[b] || 0) - ((game.tally || {})[a] || 0));
    const agents = Object.keys(game.agents || {});
    const stage = h('div.da-unmask');
    els.overlay.append(stage);
    const steps = [{ at: 0, kind: 'static' }];
    accused.forEach((u, i) => {
      const base = 900 + i * UNMASK_EACH_MS;
      steps.push({ at: base, kind: 'zoom', u }, { at: base + 1300, kind: 'verdict', u });
    });
    if (!accused.length) steps.push({ at: 900, kind: 'nobody' });
    steps.push({ at: 900 + Math.max(1, accused.length) * UNMASK_EACH_MS, kind: 'agents' });
    let shown = -1;
    let raf = 0;
    const draw = () => {
      const t = serverNow() - game.phaseStartAt;
      let k = 0;
      for (let i = 0; i < steps.length; i++) if (t >= steps[i].at) k = i;
      if (k !== shown) { const skipped = shown === -1 && k > 0; shown = k; paint(steps[k], skipped); }
      raf = requestAnimationFrame(draw);
    };
    const tile = (u, cls = '') => {
      const p = player(u);
      return h(`div.da-suspect${cls}`, { style: { '--c': colorHex(p.color) } },
        h('div.da-cross', h('i'), h('i'), h('i'), h('i')),
        avatar(p.avatar, p.color, 84),
        glitchText('b.da-suspect-name', p.name),
        h('small', `${(game.tally || {})[u] || 0} VOTE${((game.tally || {})[u] || 0) === 1 ? '' : 'S'}`));
    };
    const paint = (s, quiet) => {
      if (s.kind === 'static') {
        stage.replaceChildren(h('div.da-static.is-loud'), h('div.da-unmask-label', 'DECRYPTING SURVEILLANCE…'));
        if (!quiet) sfx('daUnmask');
      } else if (s.kind === 'zoom') {
        stage.replaceChildren(h('div.da-unmask-label', 'THE ACCUSED'), tile(s.u, '.is-zoom'));
      } else if (s.kind === 'verdict') {
        const isAgent = !!(game.agents || {})[s.u];
        stage.replaceChildren(h('div.da-unmask-label', 'THE ACCUSED'),
          isAgent
            ? h('div.da-verdict.is-agent', tile(s.u, '.is-fracture'), glitchText('b.da-verdict-word', 'DOUBLE AGENT'))
            : h('div.da-verdict.is-innocent', tile(s.u, '.is-cold'), h('b.da-stamp', 'INNOCENT')));
        if (!quiet) { sfx(isAgent ? 'daAgent' : 'daInnocent'); vibrate(isAgent ? [50, 30, 90] : 20); if (isAgent) pulseClass(root, 'da-shake', 480); }
      } else if (s.kind === 'nobody') {
        stage.replaceChildren(h('div.da-unmask-label', 'NO CONSENSUS'), h('b.da-nobody', 'THE VOTE IS SPLIT'), h('small.da-nobody-sub', 'Nobody is accused — the agent slips away.'));
        if (!quiet) sfx('daInnocent');
      } else if (s.kind === 'agents') {
        const caught = game.caught || {};
        stage.replaceChildren(
          h('div.da-unmask-label', agents.length > 1 ? 'THE DOUBLE AGENTS WERE' : 'THE DOUBLE AGENT WAS'),
          h('div.da-agents', agents.map(u => h('div.da-agent-out', { class: caught[u] ? 'is-caught' : 'is-free' }, tile(u, '.is-reveal'), h('span.da-agent-tag', caught[u] ? 'CAUGHT' : 'ESCAPED')))));
        if (!quiet) { sfx('daUnmask'); vibrate(30); }
      }
    };
    draw();
    unmask = { destroy() { cancelAnimationFrame(raf); } };
  }

  // ---------------------------------------------------------------- LAST CHANCE
  function buildLast(game) {
    duckMusic(0.3, 1.2);
    const caught = Object.keys(game.caught || {});
    const iAm = caught.includes(me());
    els.overlay.className = 'da-overlay ov-last';
    const box = h('div.da-last');
    els.overlay.append(box);
    const names = caught.map(u => player(u).name).join(' & ');
    if (iAm) {
      const c = cardFor(game);
      const input = h('input.da-input', { type: 'text', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'send', maxlength: '24', placeholder: 'THE WORD', 'aria-label': 'Name the secret word' });
      const send = h('button.btn.btn-primary.btn-xl.btn-block', { type: 'button', dataset: { sfx: 'none' } }, h('span', 'NAME IT'));
      const msg = h('div.da-err');
      box.append(h('div.da-kicker', 'LAST CHANCE'), glitchText('h2.da-last-title', 'YOU’VE BEEN CAUGHT'),
        h('p.da-lead', `Name the secret word and you steal the round.${c ? ` Category: ${c.cat}.` : ''}`),
        h('label.da-field', input, h('span.da-field-line')), msg, send);
      const go = () => {
        if (!input.value.trim()) return;
        writeMine('agguess', { t: input.value.trim().slice(0, 24), at: serverTimestamp() })
          .then(() => { send.disabled = true; input.disabled = true; msg.textContent = 'Transmitted. Fingers crossed.'; sfx('lock'); })
          .catch(() => { msg.textContent = 'Too late.'; });
      };
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      send.addEventListener('pointerdown', e => { e.preventDefault(); go(); });
      send.addEventListener('click', e => { if (e.detail === 0) go(); });
      setTimeout(() => input.focus({ preventScroll: true }), 80);
      pulseClass(root, 'da-shake', 400);
      sfx('daAgent');
      vibrate([40, 30, 80]);
    } else {
      box.append(h('div.da-kicker', 'LAST CHANCE'), glitchText('h2.da-last-title', caught.length > 1 ? 'AGENTS CAUGHT' : 'AGENT CAUGHT'),
        h('div.da-last-who', caught.map(u => { const p = player(u); return h('span', { style: { '--c': colorHex(p.color) } }, avatar(p.avatar, p.color, 40), h('b', p.name)); })),
        h('p.da-lead', `${names} ${caught.length > 1 ? 'are' : 'is'} trying to name the word. If they do, they steal the round.`));
      sfx('select');
    }
    els.last = { refresh() {} };
  }

  // ---------------------------------------------------------------- SCORES: the case file closes
  function buildScores(game) {
    els.overlay.className = 'da-overlay ov-scores';
    const res = (game.results && game.results[game.round]) || {};
    const agents = Object.keys(game.agents || {});
    const stolen = game.stolen || {};
    const caught = game.caught || {};
    const word = h('b.da-case-word');
    const outcome = agents.map(u => {
      const p = player(u);
      const line = stolen[u] ? ['STOLE THE ROUND', `named “${(game.guesses || {})[u] || ''}” · +${PTS.steal}`]
        : caught[u] ? ['CAUGHT', (game.guesses || {})[u] ? `guessed “${game.guesses[u]}” · innocents +${PTS.innocentCatch}` : `no guess · innocents +${PTS.innocentCatch}`]
          : ['ESCAPED', `+${PTS.escape}`];
      return h('div.da-outcome', { class: stolen[u] ? 'is-stolen' : caught[u] ? 'is-caught' : 'is-free', style: { '--c': colorHex(p.color) } },
        avatar(p.avatar, p.color, 34), h('b', p.name), h('span.da-outcome-tag', line[0]), h('small', line[1]));
    });
    const rows = [...game.seat].sort((a, b) => ((res[b] || {}).pts || 0) - ((res[a] || {}).pts || 0)).map((u, i) => {
      const p = player(u);
      const r = res[u] || {};
      const tags = [r.agent ? 'AGENT' : null, r.spotted ? 'SPOTTED IT' : null].filter(Boolean).join(' · ');
      return h('div.da-case-row', { class: [u === me() ? 'is-me' : '', r.agent ? 'is-agent' : ''].join(' '), style: { '--c': colorHex(p.color), animationDelay: `${600 + i * 90}ms` } },
        avatar(p.avatar, p.color, 26), h('span.da-case-name', p.name), h('small.da-case-tags', tags), h('b.da-case-pts', `+${r.pts || 0}`));
    });
    const next = game.round + 1 >= game.settings.rounds ? 'FINAL DEBRIEF NEXT' : `NEXT · FILE ${game.round + 2} OF ${game.settings.rounds}`;
    const board = leaderboard(standings(game).map(r => ({ ...r, delta: (res[r.uid] || {}).pts || 0 })), st.players, { me: me(), presence: st.presence });
    els.overlay.append(h('div.panel-full.da-case',
      h('div.da-case-head', h('span.da-kicker', `CASE ${caseNo(game.matchId)} · FILE ${game.round + 1} OF ${game.settings.rounds}`)),
      h('div.da-case-word-wrap', h('b.da-closed', 'CLOSED'), h('small', `THE WORD · ${game.cat || ''}`), word),
      h('div.da-outcomes', outcome),
      h('div.da-case-rows', rows),
      h('div.sheet-kicker', 'STANDINGS'),
      board,
      h('div.next-up', next)));
    decodeInto(word, String(game.word || '').toUpperCase(), { speed: 55 });
    if (Object.keys(stolen).length) { sfx('daStolen'); vibrate([40, 30, 40, 30, 120]); pulseClass(root, 'da-shake', 500); }
    else sfx(Object.keys(caught).length ? 'correct' : 'roundEnd');
  }

  // ---------------------------------------------------------------- FINAL
  function buildFinal(game) {
    final = createFinal({
      rows: standings(game), players: { ...Object.fromEntries(Object.keys(game.names || {}).map(u => [u, player(u)])), ...st.players }, me: me(), presence: st.presence, scoreLabel: 'PTS',
      kicker: 'OPERATION COMPLETE',
      winnerLine: nm => `${nm} READ THE ROOM BEST`,
    });
    els.overlay.className = 'da-overlay ov-final';
    els.overlay.append(final.el);
  }

  return { mount, update, unmount };
}

