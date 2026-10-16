// NEURAL BLUFF — player view. Ministry-of-Truth dossier aesthetic.
// The reveal is driven by server time since the phase began, so every phone shows
// the same exhibit at the same moment and a rejoining player lands mid-reveal.
import { h, clear, pulseClass, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, createTimer, countUp, leaderboard, fmtNum } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { playerOrder } from '../../core/room-logic.js';
import { sfx } from '../../audio/sfx.js';
import { decodeQuestion } from './index.js';
import {
  WRITE_MS, VOTE_MS, LIE_MAX, FINAL_MULTIPLIER,
  tooClose, cleanLie, optionKey, revealStepAt, standings, totals,
} from './logic.js';

const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const CAT = { brands: 'BRANDS', inventions: 'INVENTIONS', history: 'HISTORY', science: 'SCIENCE', animals: 'FAUNA', food: 'PROVISIONS', geography: 'TERRITORIES', laws: 'STATUTES', words: 'LANGUAGE', pop: 'CULTURE', sports: 'ATHLETICS', misc: 'MISCELLANY' };

export function createView() {
  let root, st;
  const els = {};
  let timer;
  let phaseKey = '';
  let final = null;
  let lastScore = 0;
  let raf = 0;
  let shownStep = null;
  let draft = '';               // what I'm typing (survives re-renders)
  let myLie = null;             // { key, t } last lie I filed this round
  let myVote = null;            // { key, k, like } optimistic vote this round
  let vvHandler = null;

  const g = () => st.game;
  const me = () => st.uid;
  const roundKey = game => `${game.matchId}|${game.round}`;
  const participant = game => !!(game.participants && game.participants[me()]);
  const player = uid => st.players[uid] || GHOST;
  const liveFor = (game, name) => (st.liveKey && st.liveKey.includes(`"${name}/${game.matchId}/${game.round}"`) && st.live[name]) || {};
  const question = game => decodeQuestion(game, st.code);
  const isFinalRound = game => game.round >= game.rounds - 1;

  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('nb');
    timer = createTimer({ warnAt: 10_000, ticks: true });
    els.sub = h('div.nb-sub');
    els.score = h('div.nb-score', '0');
    els.head = h('header.game-head',
      h('div.nb-head-l', h('div.nb-title', 'NEURAL', h('b', 'BLUFF')), els.sub),
      h('div.nb-score-wrap', h('small', 'SCORE'), els.score));
    els.timer = h('div.nb-timer', timer.el);
    els.stage = h('section.nb-stage');
    els.overlay = h('div.nb-overlay');
    root.append(els.head, els.timer, els.stage, els.overlay);
    // iOS: keep the input above the on-screen keyboard
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
    update(state);
  }

  function unmount() {
    timer && timer.stop();
    cancelAnimationFrame(raf);
    if (final) final.destroy();
    if (vvHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', vvHandler);
      window.visualViewport.removeEventListener('scroll', vvHandler);
    }
  }

  function update(state) {
    st = state;
    const game = g();
    if (!game) return;
    const q = question(game);
    root.dataset.phase = game.phase;
    root.classList.toggle('is-final-round', isFinalRound(game));
    root.classList.toggle('is-spectator', !participant(game));
    els.sub.textContent = `FILE ${String(game.round + 1).padStart(2, '0')}/${String(game.rounds).padStart(2, '0')}${q ? ` · ${CAT[q.cat] || 'CLASSIFIED'}` : ''}${isFinalRound(game) ? ' · ×3' : ''}`;
    const total = game.phase === 'write' ? WRITE_MS : game.phase === 'vote' ? VOTE_MS : Math.max(1, game.phaseEndsAt - game.phaseStartAt);
    timer.set(game.phaseEndsAt, total);
    els.timer.classList.toggle('is-live', game.phase === 'write' || game.phase === 'vote');
    const myTotal = totals(game)[me()] || 0;
    if (myTotal !== lastScore && game.phase !== 'reveal') { countUp(els.score, lastScore, myTotal, 900); lastScore = myTotal; }

    const pk = `${roundKey(game)}|${game.phase}`;
    if (pk !== phaseKey) {
      const roundChanged = !phaseKey.startsWith(`${roundKey(game)}|`);
      phaseKey = pk;
      if (roundChanged) { draft = ''; myLie = null; myVote = null; }
      buildPhase(game);
    } else {
      refreshPhase(game);
    }
  }

  // ---------- phase builders ----------
  function buildPhase(game) {
    cancelAnimationFrame(raf);
    clear(els.stage);
    clear(els.overlay);
    els.overlay.className = `nb-overlay ov-${game.phase}`;
    shownStep = null;
    if (game.phase === 'intro') buildIntro(game);
    else if (game.phase === 'write') buildWrite(game);
    else if (game.phase === 'vote') buildVote(game);
    else if (game.phase === 'reveal') buildReveal(game);
    else if (game.phase === 'standings') buildStandings(game);
    else if (game.phase === 'final') buildFinal(game);
  }

  function refreshPhase(game) {
    if (game.phase === 'write') refreshWrite(game);
    else if (game.phase === 'vote') refreshVote(game);
    else if (game.phase === 'final' && final) final.refresh();
  }

  // The question with its blank rendered as a redaction bar.
  function questionEl(q, small = false) {
    const parts = String(q.q).split('____');
    return h('p.nb-q', { class: small ? 'is-small' : null },
      parts.map((p, i) => [p, i < parts.length - 1 ? h('span.redact', { 'aria-label': 'blank' }, ' '.repeat(8)) : null]));
  }

  // ---------- INTRO ----------
  function buildIntro(game) {
    const last = isFinalRound(game);
    els.overlay.append(h('div.nb-intro', { class: last ? 'is-final' : null },
      h('div.nb-intro-eye', { 'aria-hidden': 'true' }, h('i')),
      h('div.nb-intro-kicker', last ? 'FINAL DIRECTIVE' : 'MINISTRY OF TRUTH'),
      h('div.nb-intro-file', 'CASE FILE ', h('b', String(game.round + 1).padStart(2, '0'))),
      last ? h('div.stamp.stamp-red.nb-intro-stamp', `TRIPLE POINTS ×${FINAL_MULTIPLIER}`) : h('div.stamp.nb-intro-stamp', 'CLASSIFIED'),
      h('p.nb-intro-rules', last ? 'Everything counts three times. Lie like your freedom depends on it.' : 'Invent a believable answer. Then find the truth among the lies.')));
    sfx(last ? 'challenge' : 'join');
    if (last) vibrate([30, 40, 30, 40, 80]);
  }

  // ---------- WRITE ----------
  function buildWrite(game) {
    const q = question(game);
    if (!q) { els.stage.append(h('div.nb-wait', 'DECRYPTING FILE…')); return; }
    els.filed = h('div.nb-filed');
    els.hint = h('p.nb-hint', 'Write a fake answer convincing enough to fool everyone else.');
    els.input = h('input.input.nb-input', {
      type: 'text', maxLength: LIE_MAX, placeholder: 'YOUR FABRICATION', autocomplete: 'off', autocorrect: 'off',
      autocapitalize: 'none', spellcheck: false, enterkeyhint: 'send', 'aria-label': 'Your fake answer', value: draft,
      oninput: e => { draft = e.target.value; els.hint.classList.remove('is-err'); },
      onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); fileLie(); } },
      onfocus: () => setTimeout(() => els.form && els.form.scrollIntoView({ block: 'end', behavior: reducedMotion() ? 'auto' : 'smooth' }), 260),
    });
    els.fileBtn = h('button.btn.btn-primary.btn-block.nb-file-btn', { type: 'button', onclick: fileLie }, h('span', 'FILE LIE'));
    els.form = h('div.nb-form', els.input, els.fileBtn, els.hint);
    els.stage.append(
      h('article.dossier',
        h('div.dossier-head', h('span', `FILE ${String(game.round + 1).padStart(2, '0')}`), h('span', CAT[q.cat] || 'CLASSIFIED'), h('span.dossier-eye', '◉')),
        questionEl(q)),
      participant(game) ? els.form : h('div.nb-observer', 'OBSERVER MODE — you join the next game.'),
      els.filed);
    refreshWrite(game);
  }

  function fileLie() {
    const game = g();
    if (!game || game.phase !== 'write' || !participant(game)) return;
    const q = question(game);
    const t = cleanLie(els.input.value);
    if (!t) { els.input.focus(); return; }
    if (tooClose(t, q.a, q.v)) {
      els.hint.textContent = 'Too close to the truth. The Ministry needs a lie — try another.';
      els.hint.classList.add('is-err');
      sfx('invalid');
      vibrate([20, 30, 20]);
      pulseClass(els.input, 'shake', 500);
      return;
    }
    myLie = { key: roundKey(game), t };
    set(dbRef(`rooms/${st.code}/lies/${game.matchId}/${game.round}/${me()}`), { t, at: serverTimestamp() })
      .catch(() => toast('TOO LATE — FILING CLOSED', 'err'));
    sfx('lock');
    vibrate(15);
    els.input.blur();
    refreshWrite(game);
  }

  function refreshWrite(game) {
    if (!els.filed) return;
    const lies = liveFor(game, 'lies');
    const mine = (lies[me()] && lies[me()].t) || (myLie && myLie.key === roundKey(game) ? myLie.t : null);
    if (els.form) els.form.classList.toggle('is-filed', !!mine);
    if (mine && els.fileBtn) {
      els.fileBtn.firstChild.textContent = 'UPDATE LIE';
      els.hint.classList.remove('is-err');
      els.hint.replaceChildren('Filed: ', h('b', `“${mine}”`), ' — edit and refile any time before the clock runs out.');
    }
    const uids = playerOrder(st.players).filter(u => game.participants && game.participants[u]);
    els.filed.replaceChildren(h('span.label', 'REPORTS FILED'), h('div.nb-filed-row', uids.map(uid => {
      const p = player(uid);
      const done = !!(lies[uid] && lies[uid].t) || (uid === me() && !!mine);
      return h('span.nb-agent', { class: done ? 'is-done' : null, style: { '--c': colorHex(p.color) }, title: p.name }, avatar(p.avatar, p.color, 26), done ? h('i', '✓') : null);
    })));
  }

  // ---------- VOTE ----------
  function buildVote(game) {
    const q = question(game);
    els.voteList = h('div.nb-options', { role: 'radiogroup', 'aria-label': 'Which is the truth?' });
    els.voteStatus = h('p.nb-hint');
    els.stage.append(
      q ? h('article.dossier.is-compact', questionEl(q, true)) : null,
      h('div.nb-vote-head', h('span.label', 'WHICH IS THE TRUTH?'), h('span.nb-like-hint', '♥ = funniest lie')),
      els.voteList,
      els.voteStatus);
    const ownKey = myOwnKey(game);
    (game.options || []).forEach((o, i) => {
      const own = o.k === ownKey;
      const like = h('button.nb-like', {
        type: 'button', 'aria-label': `Like “${o.t}”`, dataset: { sfx: 'none' }, disabled: own,
        onclick: e => { e.stopPropagation(); castVote(game, null, o.k); },
      }, '♥');
      const btn = h('div.nb-opt', { role: 'radio', tabIndex: own ? -1 : 0, dataset: { k: o.k }, class: own ? 'is-own' : null, style: { animationDelay: `${i * 60}ms` },
        onclick: () => { if (!own) castVote(game, o.k, undefined); },
        onkeydown: e => { if ((e.key === 'Enter' || e.key === ' ') && !own) { e.preventDefault(); castVote(game, o.k, undefined); } },
      }, h('span.nb-opt-mark'), h('span.nb-opt-text', o.t), own ? h('span.tag.tag-dim', 'YOUR LIE') : like);
      els.voteList.append(btn);
    });
    refreshVote(game);
  }

  function myOwnKey(game) {
    const lies = liveFor(game, 'lies');
    const t = (lies[me()] && lies[me()].t) || (myLie && myLie.key === roundKey(game) ? myLie.t : null);
    return t ? optionKey(cleanLie(t)) : null;
  }

  function castVote(game, k, like) {
    if (game.phase !== 'vote' || !participant(game)) return;
    const prev = currentVote(game);
    const next = { k: k !== null && k !== undefined ? k : prev.k, like: like !== undefined ? (prev.like === like ? null : like) : prev.like };
    if (!next.k) { if (like !== undefined) { toast('PICK THE TRUTH FIRST, THEN ♥ A LIE', 'info', 1800); } return; }
    myVote = { key: roundKey(game), ...next };
    const data = { k: next.k, at: serverTimestamp() };
    if (next.like) data.like = next.like;
    set(dbRef(`rooms/${st.code}/votes/${game.matchId}/${game.round}/${me()}`), data).catch(() => toast('VOTING CLOSED', 'err'));
    sfx(like !== undefined ? 'node' : 'select', { i: 6 });
    vibrate(10);
    refreshVote(game);
  }

  function currentVote(game) {
    const v = liveFor(game, 'votes')[me()];
    if (myVote && myVote.key === roundKey(game)) return myVote;
    return v ? { k: v.k, like: v.like || null } : { k: null, like: null };
  }

  function refreshVote(game) {
    if (!els.voteList) return;
    const v = currentVote(game);
    const canVote = participant(game);
    [...els.voteList.children].forEach(b => {
      const k = b.dataset.k;
      b.classList.toggle('is-picked', v.k === k);
      b.setAttribute('aria-checked', String(v.k === k));
      const like = b.querySelector('.nb-like');
      if (like) { like.classList.toggle('is-on', v.like === k); like.disabled = !canVote; }
      b.classList.toggle('is-locked', !canVote);
    });
    const votes = liveFor(game, 'votes');
    const voted = Object.keys(game.participants || {}).filter(u => votes[u] && votes[u].k).length;
    const total = Object.keys(game.participants || {}).length;
    els.voteStatus.textContent = !canVote ? 'OBSERVER MODE'
      : !v.k ? 'Tap the answer you believe is real.'
      : voted >= total ? 'ALL VOTES IN · last chance to ♥ a lie'
      : `VOTE CAST · change it any time · ${voted}/${total} voted`;
  }

  // ---------- REVEAL ----------
  function buildReveal(game) {
    els.revealCard = h('div.nb-reveal');
    els.stage.append(els.revealCard);
    const tick = () => {
      const s = game.reveal;
      if (!s) return;
      const idx = revealStepAt(s, serverNow() - game.phaseStartAt);
      if (idx !== shownStep) { shownStep = idx; renderStep(game, s, idx); }
      if (g() === game && game.phase === 'reveal') raf = requestAnimationFrame(tick);
    };
    tick();
  }

  function names(uids) {
    return uids.map(u => player(u).name).join(' + ');
  }

  function voterChips(uids, pts) {
    return h('div.nb-voters', uids.map((u, i) => {
      const p = player(u);
      return h('span.nb-voter', { style: { '--c': colorHex(p.color), animationDelay: `${300 + i * 140}ms` } }, avatar(p.avatar, p.color, 30), h('b', u === me() ? 'YOU' : p.name), pts ? h('small', pts) : null);
    }));
  }

  function renderStep(game, s, idx) {
    clear(els.revealCard);
    const mult = isFinalRound(game) ? FINAL_MULTIPLIER : 1;
    if (idx < 0) {
      els.revealCard.append(h('div.nb-reveal-lead', h('div.nb-scan'), h('span', 'DECLASSIFYING…')));
      return;
    }
    if (idx >= s.steps.length) { renderTally(game, s); return; }
    const step = s.steps[idx];
    const lieCount = s.steps.length - 1;
    if (!step.truth) {
      const author = step.house ? 'HOUSE LIE — MINISTRY ISSUE' : `FABRICATED BY ${names(step.authors)}`;
      const mine = step.authors.includes(me());
      els.revealCard.append(h('article.exhibit', { class: mine ? 'is-mine' : null },
        h('div.exhibit-kicker', `EXHIBIT ${idx + 1} OF ${lieCount} · FELL FOR IT`),
        h('div.exhibit-text', `“${step.t}”`),
        voterChips(step.voters, null),
        h('div.exhibit-author',
          h('span.redact-lift', { 'aria-hidden': 'true' }),
          h('span.exhibit-by', author),
          !step.house ? h('span.exhibit-pts', `+${fmtNum(500 * mult * step.voters.length)}`) : null),
        step.likes ? h('div.exhibit-likes', `♥ ${step.likes}`) : null,
        h('div.stamp.stamp-red.exhibit-stamp', 'DECEPTION')));
      sfx('select');
      setTimeout(() => { if (shownStep === idx) { sfx('invalid'); vibrate(mine ? [30, 40, 60] : 12); } }, 1500);
    } else {
      const found = step.voters.includes(me());
      els.revealCard.append(h('article.exhibit.is-truth', { class: found ? 'is-found' : null },
        h('div.exhibit-kicker', 'THE TRUTH'),
        h('div.exhibit-text', step.t),
        step.voters.length ? voterChips(step.voters, `+${fmtNum(1000 * mult)}`) : h('p.nb-hint', 'Nobody found the truth.'),
        h('div.stamp.stamp-green.exhibit-stamp', 'TRUTH VERIFIED')));
      sfx('correct');
      setTimeout(() => { if (shownStep === idx) { sfx('solve'); if (found) vibrate([20, 40, 80]); } }, 1300);
    }
  }

  function renderTally(game, s) {
    const res = (game.results && game.results[game.round]) || {};
    const rows = Object.entries(res).sort((a, b) => b[1].pts - a[1].pts);
    const list = h('ol.nb-tally');
    rows.forEach(([uid, r], i) => {
      const p = player(uid);
      const pts = h('span.nb-tally-pts', '+0');
      const bits = [r.truth ? 'FOUND TRUTH' : null, r.fooled ? `FOOLED ${r.fooled}` : null, r.likes ? `♥ ${r.likes}` : null].filter(Boolean).join(' · ') || 'NO POINTS';
      list.append(h('li.nb-tally-row', { class: uid === me() ? 'is-me' : null, style: { '--c': colorHex(p.color), animationDelay: `${i * 80}ms` } },
        avatar(p.avatar, p.color, 28), h('span.nb-tally-name', p.name, h('small', bits)), pts));
      setTimeout(() => countUp(pts, 0, r.pts, 900, n => `+${fmtNum(n)}`), 250 + i * 80);
    });
    sfx('shimmer');
    els.revealCard.append(h('article.exhibit.is-tally',
      h('div.exhibit-kicker', `FILE ${String(game.round + 1).padStart(2, '0')} · TALLY`),
      list,
      s.unpicked.length ? h('p.nb-unpicked', 'UNCHOSEN: ', s.unpicked.map((u, i) => [i ? ' · ' : '', h('b', `“${u.t}”`), ` (${u.house ? 'house' : names(u.authors)})`])) : null));
  }

  // ---------- STANDINGS / FINAL ----------
  function buildStandings(game) {
    const now = standings(game, game.round);
    const prev = Object.fromEntries(standings(game, game.round - 1).map(r => [r.uid, r]));
    const res = (game.results && game.results[game.round]) || {};
    const rows = now.map(r => ({
      ...r,
      prevScore: prev[r.uid] ? prev[r.uid].score : 0,
      prevRank: game.round > 0 && prev[r.uid] ? prev[r.uid].rank : null,
      delta: res[r.uid] ? res[r.uid].pts : 0,
    }));
    const nextFinal = game.round + 1 >= game.rounds - 1;
    els.overlay.append(h('div.panel-full.standings.nb-standings',
      h('div.sheet-kicker', `CITIZEN RANKINGS // AFTER FILE ${String(game.round + 1).padStart(2, '0')}`),
      leaderboard(rows, st.players, { me: me(), presence: st.presence }),
      h('div.next-up', nextFinal ? h('b', 'NEXT: FINAL DIRECTIVE · TRIPLE POINTS') : ['NEXT: ', h('b', `FILE ${String(game.round + 2).padStart(2, '0')}`)])));
  }

  function buildFinal(game) {
    final = createFinal({
      rows: standings(game), players: st.players, me: me(), presence: st.presence, scoreLabel: 'PTS',
      kicker: 'INVESTIGATION CLOSED',
      winnerLine: nm => `${nm} — MINISTER OF TRUTH`,
    });
    els.overlay.append(final.el);
  }

  return { mount, update, unmount };
}

