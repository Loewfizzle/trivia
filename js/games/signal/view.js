// LAST SIGNAL — player view: arena of rivals (tap to target), my vitals, the
// question, and reveal/elimination drama. All state comes from the DB mirror;
// local state is only "what I tapped" until the write lands.
import { h, clear, pulseClass, vibrate, reducedMotion } from '../../ui/dom.js';
import { avatar, createTimer } from '../../ui/components.js';
import { createFinal } from '../../ui/final.js';
import { toast } from '../../ui/toast.js';
import { dbRef, set, serverTimestamp, serverNow } from '../../firebase.js';
import { colorHex } from '../../config.js';
import { playerOrder } from '../../core/room-logic.js';
import { sfx } from '../../audio/sfx.js';
import { decodeQuestion } from '../../trivia/feed.js';
import { CATEGORY_LABEL } from '../../trivia/categories.js';
import { START_SHIELDS, QUESTION_MS, multiplier, isAlive, aliveUids, rankings, decay, strikeDamage } from './logic.js';

const GHOST = { name: 'GHOST', color: 'red', avatar: 'ghost' };
const LETTERS = ['A', 'B', 'C', 'D'];

export function createView() {
  let root, st;
  const els = {};
  let timer;
  let phaseKey = '';
  let cards = {};           // uid -> { el, hpFill, hpNum, pips, tag }
  let myChoice = null;      // { key, c } choice I tapped this question
  let fxDone = new Set();   // reveal effects already played (by q)
  let outSeen = null;       // eliminated set we've already animated
  let targetPickedFor = ''; // question key we auto-picked a target for
  let introRaf = 0;
  let final = null;
  let lastMult = null;

  const g = () => st.game;
  const me = () => st.uid;
  const qKey = game => `${game.matchId}|${game.q || 0}`;
  const participant = game => !!(game.participants && game.participants[me()]);
  const player = uid => st.players[uid] || GHOST;
  const answersNow = game => (st.liveKey && st.liveKey.includes(`answers/${game.matchId}/${game.q || 0}"`) && st.live.answers) || {};
  const targetsNow = () => (st.live && st.live.targets) || {};

  function mount(el, state) {
    root = el;
    st = state;
    root.classList.add('ls');
    timer = createTimer({ warnAt: 5_000, ticks: true });
    els.sub = h('div.ls-sub');
    els.alive = h('div.ls-alive');
    els.head = h('header.game-head',
      h('div.ls-head-l', h('div.ls-title', 'LAST', h('b', 'SIGNAL')), els.sub),
      els.alive);
    els.timer = h('div.ls-timer', timer.el);

    // my vitals
    els.meAvatar = h('div.ls-me-av');
    els.meName = h('div.ls-me-name');
    els.meHpFill = h('div.hp-fill');
    els.meHpNum = h('div.ls-me-hp');
    els.mePips = h('div.pips');
    els.meTarget = h('div.ls-me-target');
    els.meThreat = h('div.ls-me-threat');
    els.me = h('section.ls-me',
      els.meAvatar,
      h('div.ls-me-body',
        h('div.ls-me-row', els.meName, els.mePips, els.meHpNum),
        h('div.hp-bar.hp-bar-lg', els.meHpFill),
        h('div.ls-me-row.ls-me-row-2', els.meTarget, els.meThreat)));

    els.arena = h('section.ls-arena', { 'aria-label': 'Rivals — tap to target' });
    els.qCat = h('div.ls-q-cat');
    els.qText = h('p.ls-q-text');
    els.qMain = h('div.ls-q-main', els.qCat, els.qText);
    els.qFeed = h('div.ls-q-feed');
    els.q = h('section.ls-q', els.qMain, els.qFeed);
    els.opts = h('div.ls-opts', LETTERS.map((L, i) => h('button.ls-opt', {
      type: 'button', dataset: { i: String(i), sfx: 'none' }, onclick: () => answer(i),
    }, h('span.ls-opt-key', L), h('span.ls-opt-text'))));
    els.overlay = h('div.ls-overlay');
    els.flash = h('div.ls-flash', { 'aria-hidden': 'true' });
    els.play = h('div.ls-play', els.q, els.opts);
    root.append(els.head, els.timer, els.me, els.arena, els.play, els.overlay, els.flash);
    update(state);
  }

  function unmount() {
    timer && timer.stop();
    cancelAnimationFrame(introRaf);
    if (final) final.destroy();
  }

  function update(state) {
    st = state;
    const game = g();
    if (!game) return;
    const d = decay(game);
    root.style.setProperty('--decay', d.toFixed(3));
    root.classList.toggle('decay-1', d > 0.01);
    root.classList.toggle('decay-2', d >= 0.5);
    root.classList.toggle('decay-3', d >= 0.75);
    root.dataset.phase = game.phase;
    const amAlive = isAlive(game, me());
    root.classList.toggle('is-spectator', !amAlive);

    const mult = multiplier(game.q || 0);
    const alive = aliveUids(game);
    els.sub.textContent = game.phase === 'intro' ? 'BATTLE ROYALE' : `Q${String((game.q || 0) + 1).padStart(2, '0')} · DMG ×${mult}`;
    els.alive.replaceChildren(h('b', String(alive.length)), h('span', 'ALIVE'));
    timer.set(game.phaseEndsAt, game.phase === 'question' ? QUESTION_MS : Math.max(1, game.phaseEndsAt - game.phaseStartAt));
    els.timer.classList.toggle('is-live', game.phase === 'question');

    if (game.phase === 'question' && lastMult !== null && mult !== lastMult && mult > 1) escalate(mult);
    lastMult = mult;

    autoTarget(game);
    renderMe(game);
    renderArena(game);
    renderQuestion(game);
    revealFx(game);
    eliminationFx(game);

    const pk = `${game.matchId}|${game.q || 0}|${game.phase}`;
    if (pk !== phaseKey) { phaseKey = pk; buildOverlay(game); }
    else if (game.phase === 'final' && final) final.refresh();
  }

  // ---------- targeting ----------
  function myTarget(game) {
    const t = targetsNow()[me()];
    return t && t !== me() && isAlive(game, t) ? t : null;
  }

  function setTarget(uid) {
    const game = g();
    if (!isAlive(game, me()) || uid === me() || !isAlive(game, uid)) return;
    if (targetsNow()[me()] === uid) return;
    st.live.targets = { ...targetsNow(), [me()]: uid }; // optimistic
    set(dbRef(`rooms/${st.code}/targets/${game.matchId}/${me()}`), uid).catch(() => {});
    sfx('select');
    vibrate(12);
    renderArena(game);
    renderMe(game);
  }

  function autoTarget(game) {
    if (!isAlive(game, me()) || game.phase === 'final' || !st.liveKey) return;
    if (myTarget(game)) return;
    const key = `${qKey(game)}|${Object.keys(game.out || {}).length}`;
    if (targetPickedFor === key) return;
    const rivals = aliveUids(game).filter(u => u !== me());
    if (!rivals.length) return;
    targetPickedFor = key;
    const pick = rivals[Math.floor(Math.random() * rivals.length)];
    st.live.targets = { ...targetsNow(), [me()]: pick };
    set(dbRef(`rooms/${st.code}/targets/${game.matchId}/${me()}`), pick).catch(() => {});
  }

  // ---------- my vitals ----------
  function renderMe(game) {
    const p = player(me());
    const max = (game.settings && game.settings.hp) || 100;
    const hp = Math.max(0, (game.hp && game.hp[me()]) || 0);
    const sh = (game.sh && game.sh[me()]) || 0;
    if (els.meAvatar.dataset.k !== `${p.avatar}|${p.color}`) {
      els.meAvatar.dataset.k = `${p.avatar}|${p.color}`;
      els.meAvatar.replaceChildren(avatar(p.avatar, p.color, 46));
    }
    els.me.style.setProperty('--c', colorHex(p.color));
    els.meName.textContent = participant(game) ? p.name : `${p.name} · SPECTATOR`;
    els.meHpFill.style.transform = `scaleX(${hp / max})`;
    els.meHpFill.classList.toggle('is-low', hp / max <= 0.3);
    els.meHpNum.textContent = String(hp);
    renderPips(els.mePips, sh);
    const t = myTarget(game);
    if (!isAlive(game, me())) {
      els.meTarget.replaceChildren(h('span.ls-dead', participant(game) ? 'FLATLINED — SPECTATING' : 'SPECTATING'));
      els.meThreat.textContent = '';
    } else {
      const tp = t ? player(t) : null;
      els.meTarget.replaceChildren(h('span.label', 'TARGET'), tp ? h('b', { style: { color: colorHex(tp.color) } }, ` ⌖ ${tp.name}`) : h('b', ' —'));
      const threats = Object.entries(targetsNow()).filter(([u, v]) => v === me() && u !== me() && isAlive(game, u)).length;
      els.meThreat.textContent = threats ? `${threats} LOCKED ON YOU` : '';
    }
  }

  function renderPips(container, n) {
    if (container.childElementCount !== START_SHIELDS) {
      clear(container);
      for (let i = 0; i < START_SHIELDS; i++) container.append(h('i'));
    }
    [...container.children].forEach((pip, i) => pip.classList.toggle('on', i < n));
  }

  // ---------- arena ----------
  function renderArena(game) {
    const uids = playerOrder(st.players).filter(u => game.participants && game.participants[u] && u !== me());
    for (const u of Object.keys(game.participants || {})) if (u !== me() && !uids.includes(u)) uids.push(u);
    const sig = uids.join(',');
    if (els.arena.dataset.sig !== sig) {
      els.arena.dataset.sig = sig;
      clear(els.arena);
      cards = {};
      els.arena.style.setProperty('--cols', uids.length <= 2 ? 2 : uids.length <= 4 ? uids.length : 4);
      for (const uid of uids) {
        const p = player(uid);
        const hpFill = h('div.hp-fill');
        const hpNum = h('span.card-hp');
        const pips = h('div.pips.pips-sm');
        const tag = h('span.card-tag');
        const el = h('button.ls-card', {
          type: 'button', dataset: { uid, sfx: 'none' }, style: { '--c': colorHex(p.color) },
          'aria-label': `Target ${p.name}`, onclick: () => setTarget(uid),
        },
        h('i.reticle'),
        h('div.card-top', avatar(p.avatar, p.color, 24), h('span.card-name', p.name)),
        h('div.hp-bar', hpFill),
        h('div.card-bot', pips, tag, hpNum));
        cards[uid] = { el, hpFill, hpNum, pips, tag };
        els.arena.append(el);
      }
    }
    const max = (game.settings && game.settings.hp) || 100;
    const answers = answersNow(game);
    const target = myTarget(game);
    for (const uid of uids) {
      const c = cards[uid];
      const alive = isAlive(game, uid);
      const hp = Math.max(0, (game.hp && game.hp[uid]) || 0);
      c.hpFill.style.transform = `scaleX(${hp / max})`;
      c.hpFill.classList.toggle('is-low', hp / max <= 0.3);
      c.hpNum.textContent = alive ? String(hp) : '';
      renderPips(c.pips, (game.sh && game.sh[uid]) || 0);
      const offline = !(st.presence[uid] && st.presence[uid].online);
      c.el.classList.toggle('is-target', uid === target);
      c.el.classList.toggle('is-out', !alive);
      c.el.classList.toggle('is-lost', offline && alive);
      c.el.disabled = !alive || !isAlive(game, me());
      c.tag.textContent = !alive ? 'FLATLINE' : offline ? 'SIGNAL LOST' : game.phase === 'question' && answers[uid] ? 'LOCKED' : '';
      c.tag.className = `card-tag${answers[uid] && game.phase === 'question' ? ' is-locked' : ''}`;
    }
  }

  // ---------- question ----------
  function renderQuestion(game) {
    const showQ = game.phase === 'question' || game.phase === 'reveal';
    els.play.classList.toggle('is-hidden', !showQ);
    els.q.classList.toggle('is-reveal', game.phase === 'reveal');
    if (!showQ) return;
    const item = decodeQuestion(game, st.code, game.q || 0);
    const key = qKey(game);
    if (els.q.dataset.key !== key) {
      els.q.dataset.key = key;
      els.qCat.textContent = item ? `${CATEGORY_LABEL[item.cat] || 'GENERAL'} · ${String(item.d || 'medium').toUpperCase()}` : 'DECRYPTING…';
      els.qText.textContent = item ? item.q : '…';
      [...els.opts.children].forEach((b, i) => { b.querySelector('.ls-opt-text').textContent = item ? item.a[i] : ''; });
      pulseClass(els.q, 'q-in');
      pulseClass(els.opts, 'q-in');
      if (myChoice && myChoice.key !== key) myChoice = null;
    }
    const mine = answersNow(game)[me()];
    const chosen = mine ? mine.c : myChoice && myChoice.key === key ? myChoice.c : null;
    const log = game.log && game.log[game.q || 0];
    const correct = game.phase === 'reveal' && log ? log.c : null;
    const canAnswer = game.phase === 'question' && isAlive(game, me()) && chosen == null;
    [...els.opts.children].forEach((b, i) => {
      b.disabled = !canAnswer;
      b.classList.toggle('is-chosen', chosen === i);
      b.classList.toggle('is-correct', correct === i);
      b.classList.toggle('is-wrong', correct != null && chosen === i && i !== correct);
    });
    els.opts.classList.toggle('is-answered', chosen != null);
  }

  function answer(i) {
    const game = g();
    if (!game || game.phase !== 'question' || !isAlive(game, me())) return;
    const key = qKey(game);
    if ((myChoice && myChoice.key === key) || answersNow(game)[me()]) return;
    myChoice = { key, c: i };
    sfx('lock');
    vibrate(15);
    renderQuestion(game);
    const elapsed = serverNow() - (game.qStartAt || 0);
    els.qCat.textContent = `TRANSMITTED · ${strikeDamage(elapsed, multiplier(game.q || 0))} DMG IF CORRECT`;
    set(dbRef(`rooms/${st.code}/answers/${game.matchId}/${game.q || 0}/${me()}`), { c: i, at: serverTimestamp() })
      .catch(() => { toast('TOO LATE — SIGNAL CLOSED', 'err'); });
  }

  // ---------- reveal effects (once per question) ----------
  function revealFx(game) {
    if (game.phase !== 'reveal') return;
    const q = game.q || 0;
    const log = game.log && game.log[q];
    if (!log || fxDone.has(`${game.matchId}|${q}`)) return;
    fxDone.add(`${game.matchId}|${q}`);
    const ev = log.ev || [];
    const hurt = ev.filter(e => (e.t === 'hit' && e.v === me()) || (e.t === 'burn' && e.u === me()));
    const struck = ev.filter(e => e.t === 'hit' && e.a === me());
    const lostShield = ev.some(e => e.t === 'shield' && e.u === me());
    let delay = 250;
    struck.forEach(e => {
      setTimeout(() => {
        sfx('strike');
        vibrate(25);
        const c = cards[e.v];
        if (c) { pulseClass(c.el, 'struck', 900); floatNum(c.el, `−${e.d}`); }
      }, delay);
      delay += 250;
    });
    ev.filter(e => e.t === 'hit' && e.a !== me() && e.v !== me()).forEach(e => {
      const c = cards[e.v];
      if (c) setTimeout(() => { pulseClass(c.el, 'grazed', 700); floatNum(c.el, `−${e.d}`, true); }, 200);
    });
    if (hurt.length) {
      const total = hurt.reduce((s, e) => s + e.d, 0);
      setTimeout(() => {
        sfx('hit');
        vibrate([50, 40, 90]);
        pulseClass(root, 'hurt', 700);
        floatNum(els.me, `−${total}`);
      }, delay + 100);
    }
    if (lostShield) setTimeout(() => { sfx('shieldBreak'); vibrate(20); pulseClass(els.mePips, 'shatter', 800); }, 150);
    if (!hurt.length && !struck.length && !lostShield) sfx('roundEnd');
  }

  function floatNum(anchor, text, small = false) {
    if (reducedMotion()) return;
    const n = h('span.float-dmg', { class: small ? 'is-small' : null }, text);
    anchor.append(n);
    setTimeout(() => n.remove(), 1300);
  }

  function eliminationFx(game) {
    const out = Object.keys(game.out || {});
    if (outSeen === null) { outSeen = new Set(out); return; } // don't replay history after a refresh
    const fresh = out.filter(u => !outSeen.has(u));
    if (!fresh.length) return;
    fresh.forEach(u => outSeen.add(u));
    setTimeout(() => {
      sfx('eliminate');
      if (fresh.includes(me())) flatline();
      else {
        fresh.forEach(u => cards[u] && pulseClass(cards[u].el, 'dying', 1400));
        pulseClass(root, 'quake', 900);
        vibrate([30, 60, 30]);
        const names = fresh.map(u => player(u).name).join(' + ');
        banner(`${names} FLATLINED`);
      }
    }, 900);
  }

  function flatline() {
    vibrate([120, 60, 200]);
    const ov = h('div.flatline', { 'aria-live': 'assertive' },
      h('div.flatline-line'),
      h('strong', { 'data-text': 'FLATLINE' }, 'FLATLINE'),
      h('small', 'SIGNAL LOST — YOU ARE NOW SPECTATING'));
    root.append(ov);
    setTimeout(() => ov.classList.add('out'), reducedMotion() ? 1200 : 2800);
    setTimeout(() => ov.remove(), reducedMotion() ? 1500 : 3400);
  }

  function banner(text) {
    const b = h('div.ls-banner', text);
    root.append(b);
    setTimeout(() => b.remove(), 2600);
  }

  function escalate(mult) {
    banner(`ESCALATION — DAMAGE ×${mult}`);
    sfx('challenge');
    pulseClass(root, 'quake', 600);
  }

  // ---------- overlays ----------
  function buildOverlay(game) {
    cancelAnimationFrame(introRaf);
    clear(els.overlay);
    els.overlay.className = `ls-overlay ov-${game.phase}`;
    if (game.phase === 'intro') buildIntro(game);
    else if (game.phase === 'final') buildFinal(game);
    if (game.phase === 'reveal') buildReveal(game); else clear(els.qFeed);
  }

  function buildIntro(game) {
    const num = h('div.ls-count', '5');
    const hp = (game.settings && game.settings.hp) || 100;
    els.overlay.append(h('div.ls-intro',
      h('div.ls-intro-kicker', 'EMERGENCY BROADCAST'),
      h('div.ls-intro-title', { 'data-text': 'LAST SIGNAL' }, 'LAST SIGNAL'),
      h('ul.ls-rules',
        h('li', h('b', `${hp} HP`), ' + ', h('b', `${START_SHIELDS} SHIELDS`), ' each'),
        h('li', 'Answer right to ', h('b', 'strike your target'), ' — faster hits harder'),
        h('li', 'Wrong or silent: ', h('b', 'lose a shield'), ', then HP'),
        h('li', 'Damage escalates every 5 questions. ', h('b', 'Last one standing wins.'))),
      num));
    let last = '';
    const tick = () => {
      const left = game.phaseEndsAt - serverNow();
      const t = left > 0 ? String(Math.ceil(left / 1000)) : '';
      if (t !== last) { last = t; num.textContent = t; if (t) { pulseClass(num, 'tick'); sfx('tick'); } }
      if (left > -300) introRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function buildReveal(game) {
    const q = game.q || 0;
    const log = (game.log && game.log[q]) || { ev: [] };
    const item = decodeQuestion(game, st.code, q);
    const lines = h('ol.ls-feed');
    const name = uid => {
      const p = player(uid);
      return h('b', { style: { color: colorHex(p.color) } }, uid === me() ? 'YOU' : p.name);
    };
    const ev = log.ev || [];
    ev.forEach((e, i) => {
      let row;
      if (e.t === 'hit') row = h('li.feed-hit', name(e.a), h('span.feed-arrow', '⟶'), name(e.v), h('span.feed-dmg', `−${e.d}`));
      else if (e.t === 'shield') row = h('li.feed-shield', name(e.u), h('span.feed-note', e.left ? 'SHIELD CRACKED' : 'LAST SHIELD GONE'));
      else if (e.t === 'burn') row = h('li.feed-burn', name(e.u), h('span.feed-note', 'EXPOSED'), h('span.feed-dmg', `−${e.d}`));
      else row = h('li.feed-out', name(e.u), h('span.feed-note', 'FLATLINED'));
      row.style.animationDelay = `${150 + i * 90}ms`;
      lines.append(row);
    });
    if (!ev.length) lines.append(h('li.feed-note', 'NO SIGNAL EXCHANGED'));
    els.qFeed.replaceChildren(
      item ? h('p.ls-q-recap', item.q) : null,
      h('div.ls-q-cat', 'CORRECT ANSWER'),
      h('div.ls-answer', item && log.c != null ? item.a[log.c] : '—'),
      lines);
  }

  function buildFinal(game) {
    const rows = rankings(game).map(r => ({
      uid: r.uid, rank: r.rank, score: r.hp,
      note: r.out === undefined ? `${r.sh} SHIELD${r.sh === 1 ? '' : 'S'} LEFT` : `FLATLINED Q${r.out + 1}`,
    }));
    final = createFinal({
      rows, players: st.players, me: me(), presence: st.presence, scoreLabel: 'HP',
      kicker: 'TRANSMISSION ENDED',
      winnerLine: nm => `${nm} IS THE LAST SIGNAL`,
    });
    els.overlay.append(final.el);
  }

  return { mount, update, unmount };
}
