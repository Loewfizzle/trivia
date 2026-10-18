// HIGH STAKES — the high-roller back room of Neon Speakeasy.
//
// Layers: the baked room (scene.js) → the lamp's warm pool, the lamp itself and the ALL IN darkness (css, compositor
// only) → the effects canvas (haze, flying chips, gold sweep, chip rain) → the table's DOM: seats along the top, the felt
// with its cards (category, question, showdown bets, standings), your stack and the bet controls at the bottom.
// Everything renders from state: a refresh mid-showdown picks the timeline up where it is, without replaying sounds.
import { h, reducedMotion, vibrate } from '../../ui/dom.js';
import { avatar, countUp } from '../../ui/components.js';
import { rankBadge } from '../../ui/emblems.js';
import { pubOf } from '../../profile/public.js';
import { createFinal } from '../../ui/final.js';
import { colorHex } from '../../config.js';
import { dbRef, get, set, serverNow, serverTimestamp } from '../../firebase.js';
import { setPlaylist, duckMusic } from '../../audio/music.js';
import { settings } from '../../audio/settings.js';
import { rngFrom, shuffle } from '../../core/rng.js';
import { createAnnouncer, createCards, reportPanel, createTiers, installTestHook, removeTestHook } from '../kit/index.js';
import { MS, ROUNDS, FINAL, START, catLabel, payout, isDoubleDown, isFinal, minBet, clampBet, ledger, standings, showMs } from './logic.js';
import { decodeQ } from './questions.js';
import { createRoom, breakdown, CHIP } from './scene.js';
import { createSfx } from './audio.js';
import { ICONS } from './icons.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const num = n => Math.round(n).toLocaleString('en-US');
const signed = n => (n > 0 ? `+${num(n)}` : n < 0 ? `−${num(-n)}` : '0');
export const musicOrder = code => shuffle(rngFrom(`${code}:stakes:music`), ['high1', 'high2', 'high3']);

export function createView() {
  let st = null, game = null, root = null, room = null, raf = 0, ro = null, destroyed = false;
  let ann = null, cards = null, finalView = null, report = null;
  const els = {};
  const sfx = createSfx();
  const reduced = () => !!settings.reducedFx || reducedMotion();
  const tiers = createTiers({ apply: t => { if (room) room.setTier(t); } });
  const me = () => st && st.uid;
  const inMatch = () => !!(game && game.participants && game.participants[me()]);
  let pos = { seats: {}, pot: null, house: null, dock: null };
  // per round, on this phone
  let local = { rk: null, bet: null, lockedBet: null, answer: null, answeredAt: 0, shownCat: false, played: new Set(), betPreview: null };
  let lastPhaseKey = '';
  let showT0 = 0;
  let botTimer = 0, bot = null;

  // ================================================================ mount
  function mount(el, state) {
    st = state;
    root = h('div.hs.mk-root', { 'data-sfx': 'none' });
    els.room = h('canvas.hs-room', { 'aria-hidden': 'true' });
    els.fx = h('canvas.hs-fx', { 'aria-hidden': 'true' });
    els.pool = h('div.hs-pool', { 'aria-hidden': 'true' });
    els.lamp = h('div.hs-lamp', { 'aria-hidden': 'true' }, h('i.hs-lamp-shade'), h('i.hs-lamp-bulb'));
    els.dim = h('div.hs-dim', { 'aria-hidden': 'true' });
    els.spot = h('div.hs-spot', { 'aria-hidden': 'true' });
    els.round = h('div.hs-round');
    els.timer = h('div.hs-timer', h('i'), h('b'));
    els.top = h('header.hs-top', els.round, els.timer);
    els.seats = h('div.hs-seats');
    els.felt = h('div.hs-felt');
    els.pot = h('div.hs-pot', h('div.hs-pot-pile'), h('div.hs-pot-l', 'THE POT'));
    els.cat = h('div.hs-cat', h('div.hs-cat-in', h('div.hs-cat-back'), h('div.hs-cat-front')));
    els.qcard = h('div.hs-q');
    els.show = h('div.hs-show');
    els.stand = h('div.hs-stand');
    els.felt.append(els.pot, els.cat, els.qcard, els.show, els.stand);
    els.ann = h('div.hs-ann', { 'aria-live': 'polite' });
    els.felt.append(els.ann);
    els.dock = h('div.hs-dock');
    els.overlay = h('div.hs-overlay');
    els.final = h('div.hs-final');
    root.append(els.room, els.pool, els.lamp, els.fx, els.dim, els.spot,
      h('div.hs-ui', els.top, els.seats, els.felt, els.dock), els.overlay, els.final);
    el.classList.add('hs-screen');
    el.append(root);
    document.body.classList.add('hs-on');
    loadFont();
    ann = createAnnouncer(els.ann, { prefix: 'hs', holdMs: 1700, queueMax: 4 });
    cards = createCards(els.overlay, { prefix: 'hs' });
    room = createRoom(els.room, els.fx, { reduced: reduced() });
    ro = new ResizeObserver(() => { if (!room) return; room.resize(root.clientWidth, root.clientHeight); measure(); });
    ro.observe(root);
    setPlaylist('stakes', musicOrder(state.code));
    setupHook();
    update(state);
    raf = requestAnimationFrame(frame);
  }

  function loadFont() {
    if (document.getElementById('hs-font')) return;
    document.head.append(h('link', { id: 'hs-font', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap' }));
  }

  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    clearTimeout(botTimer);
    if (ro) ro.disconnect();
    sfx.stop();
    duckMusic(1, 0.6);
    if (room) room.destroy();
    if (finalView) finalView.destroy();
    document.body.classList.remove('hs-on', 'hs-allin', 'hs-dd');
    removeTestHook('__stakes', hook);
  }

  // positions for the chips in flight: offsets, never bounding rects (the screen slides in with a transform)
  const offsetIn = el => { let x = 0, y = 0; for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };
  const center = el => { if (!el || !el.offsetParent) return null; const [x, y] = offsetIn(el); return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 }; };
  function measure() {
    if (!room || !root) return;
    const [fx, fy] = offsetIn(els.felt);
    const table = { x: fx - 12, y: fy - 12, w: els.felt.offsetWidth + 24, h: els.felt.offsetHeight + 24 };
    pos.pot = center(els.pot) || { x: table.x + table.w / 2, y: table.y + table.h * 0.4 };
    pos.house = { x: table.x + table.w - 26, y: table.y + 18 };
    pos.dock = center(els.dock.querySelector('.hs-mystack') || els.dock);
    pos.seats = {};
    for (const s of els.seats.querySelectorAll('.hs-seat')) pos.seats[s.dataset.uid] = center(s.querySelector('.hs-seat-chips') || s);
    room.setLayout({ table, pot: pos.pot, house: pos.house });
  }

  // ================================================================ state
  function update(state) {
    st = state;
    const g = state.game;
    if (!g || g.id !== 'stakes') return;
    const newMatch = !game || game.matchId !== g.matchId;
    game = g;
    if (newMatch) resetMatch();
    if (local.rk !== game.rk) newRound();
    renderSeats();
    syncPhase();
    renderDock();
  }

  function resetMatch() {
    local = { rk: null, bet: null, lockedBet: null, answer: null, answeredAt: 0, played: new Set(), betPreview: null };
    lastPhaseKey = '';
    if (finalView) { finalView.destroy(); finalView = null; }
    els.final.replaceChildren();
    root.classList.remove('is-final');
  }

  function newRound() {
    local.rk = game.rk;
    local.bet = null; local.lockedBet = null; local.answer = null; local.answeredAt = 0; local.played = new Set(); local.betPreview = null;
    // refresh / rejoin: what this phone already sent this round (readable by its owner only)
    if (inMatch() && ['bet', 'q', 'show'].includes(game.phase)) {
      const rk = game.rk, m = game.matchId;
      get(dbRef(`hsbet/${st.code}/${m}/${rk}/${me()}`)).then(s => {
        const v = s.val();
        if (!v || !game || game.rk !== rk || game.matchId !== m) return;
        if (v.b) local.lockedBet = v.b.b;
        if (v.a) local.answer = v.a.a;
        renderDock(); renderQuestion(true);
      }).catch(() => {});
    }
  }

  const phaseKey = () => `${game.matchId}|${game.round}|${game.phase}`;
  const L = () => ledger(game, game.round);                       // the table before this round's result
  const myStack = () => { const x = L()[me()]; return x ? x.stack : START; };
  const plan = () => (game.plan || {})[game.round] || {};
  const locks = () => (st.live && st.live.lock) || {};

  function syncPhase() {
    const key = phaseKey();
    const fresh = key !== lastPhaseKey;
    lastPhaseKey = key;
    root.dataset.phase = game.phase;
    if (fresh && game.phase !== 'show') { root.classList.remove('is-dealt'); els.show.classList.remove('is-dealt'); els.show.dataset.sig = ''; }
    const dd = isDoubleDown(game.round), allin = isFinal(game.round);
    root.classList.toggle('is-dd', dd && game.phase !== 'final');
    root.classList.toggle('is-allin', allin && !['final', 'intro'].includes(game.phase));
    renderTop();
    // what is on the felt
    els.cat.classList.toggle('is-on', ['cat', 'bet'].includes(game.phase));
    els.cat.classList.toggle('is-small', game.phase === 'bet');
    els.pot.classList.toggle('is-on', ['bet', 'q', 'show'].includes(game.phase));
    els.qcard.classList.toggle('is-on', ['q', 'show'].includes(game.phase));
    els.show.classList.toggle('is-on', game.phase === 'show');
    els.stand.classList.toggle('is-on', game.phase === 'stand');
    if (game.phase === 'intro' && fresh) onIntro();
    if (game.phase === 'cat') renderCat(fresh);
    if (game.phase === 'bet') { renderCat(false); renderPot(); }
    if (game.phase === 'q') { renderQuestion(fresh); renderPot(); if (fresh) sfx.play('deal'); }
    if (game.phase === 'show') { renderQuestion(false); renderShow(fresh); }
    if (game.phase === 'stand') renderStand(fresh);
    if (game.phase === 'final') renderFinal(fresh);
    if (fresh) {
      if (game.phase === 'stand' || game.phase === 'cat') { duckMusic(1, 1.2); room.setRain(false); }
      if (game.phase !== 'show' && game.phase !== 'final') sfx.tension(false);
      requestAnimationFrame(measure);
    }
  }

  // ================================================================ the top bar
  function renderTop() {
    const r = game.round;
    const label = game.phase === 'intro' ? 'HIGH STAKES' : game.phase === 'final' ? 'THE HOUSE CLOSES' : isFinal(r) ? 'ALL IN · THE FINAL' : `ROUND ${r + 1} OF ${ROUNDS}`;
    const sub = isDoubleDown(r) && game.phase !== 'final' ? 'DOUBLE DOWN' : game.phase === 'bet' ? 'PLACE YOUR BET' : game.phase === 'q' ? 'ANSWER' : game.phase === 'show' ? 'SHOWDOWN' : '';
    const sig = `${label}|${sub}`;
    if (els.round.dataset.sig !== sig) {
      els.round.dataset.sig = sig;
      els.round.replaceChildren(...[h('b', label), sub ? h('span', { class: isDoubleDown(r) ? 'is-dd' : '' }, sub) : null].filter(Boolean));
    }
    els.timer.hidden = !['bet', 'q'].includes(game.phase);
  }

  // ================================================================ seats
  function seatOrder() {
    return Object.keys(game.participants || {}).sort((a, b) => ((st.players[a] || {}).joinedAt || 0) - ((st.players[b] || {}).joinedAt || 0) || (a < b ? -1 : 1));
  }
  function seatValues() {
    // during the showdown, the chips only move once they've flown
    const moved = game.phase !== 'show' || (showT0 && serverNow() >= showT0 + chipsAt());
    return ledger(game, moved ? game.round + 1 : game.round);
  }
  function renderSeats() {
    const order = seatOrder();
    const V = seatValues();
    const lead = Object.entries(V).sort((a, b) => b[1].net - a[1].net)[0];
    const leader = lead && game.round > 0 && lead[1].net > START ? lead[0] : null;
    const lk = locks();
    const sig = JSON.stringify([order, order.map(u => [V[u] && V[u].stack, V[u] && V[u].loanN, lk[u], (st.players[u] || {}).name, st.presence[u] && st.presence[u].online, pubOf(st.players[u]) && pubOf(st.players[u]).r]), leader, game.phase]);
    if (els.seats.dataset.sig === sig) return;
    const first = !els.seats.dataset.sig;
    els.seats.dataset.sig = sig;
    els.seats.style.setProperty('--n', order.length);
    const prev = {};
    for (const s of els.seats.querySelectorAll('.hs-seat')) prev[s.dataset.uid] = Number(s.dataset.stack);
    els.seats.replaceChildren(...order.map(uid => {
      const p = st.players[uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
      const v = V[uid] || { stack: START, loanN: 0 };
      const l = lk[uid] || {};
      const status = game.phase === 'bet' ? (l.b ? 'LOCKED' : 'BETTING') : game.phase === 'q' ? (l.a ? 'ANSWERED' : 'THINKING') : '';
      const off = st.presence[uid] && st.presence[uid].online === false;
      const count = h('b.hs-seat-n', num(prev[uid] ?? v.stack));
      const seat = h('div.hs-seat', {
        dataset: { uid, stack: String(v.stack) },
        class: [uid === me() ? 'is-me' : '', uid === leader ? 'is-leader' : '', off ? 'is-off' : '', status ? `st-${status.toLowerCase()}` : ''].join(' '),
        style: { '--c': colorHex(p.color) },
      },
      h('div.hs-seat-name', avatar(p.avatar, p.color, 18), h('span', p.name)),
      h('div.hs-seat-chips', h('i.hs-chip-ico'), count, rankBadge(pubOf(p), { tag: false, size: 12 })),
      v.loanN ? h('div.hs-iou', { title: `On the house's credit: ${v.loanN} × 200` }, `IOU${v.loanN > 1 ? ` ×${v.loanN}` : ''}`) : null,
      status ? h('div.hs-seat-st', { title: status, 'aria-label': status }, /LOCKED|ANSWERED/.test(status) ? '✓' : '') : null);
      if (!first && prev[uid] != null && prev[uid] !== v.stack) countUp(count, prev[uid], v.stack, reduced() ? 1 : 900, num);
      return seat;
    }));
    requestAnimationFrame(measure);
  }

  // ================================================================ intro + category
  function onIntro() {
    cards.card('HIGH STAKES', `${num(START)} CHIPS EACH · ${ROUNDS} ROUNDS + ALL IN`, MS.intro - 600, 'intro');
    sfx.play('chips', { n: 10 });
  }

  function renderCat(fresh) {
    const p = plan();
    if (!p.cat) return;
    const r = game.round;
    const mult = payout(p.d, r);
    const front = els.cat.querySelector('.hs-cat-front');
    const sig = `${game.matchId}|${r}`;
    if (front.dataset.sig !== sig) {
      front.dataset.sig = sig;
      front.replaceChildren(
        h('div.hs-cat-corner', h('i', { html: ICONS[p.cat] || ICONS.general }), h('b', p.d === 'hard' ? 'H' : 'M')),
        h('div.hs-cat-emblem', { html: ICONS[p.cat] || ICONS.general }),
        h('div.hs-cat-name', catLabel(p.cat)),
        h('div.hs-cat-diff', { class: p.d === 'hard' ? 'is-hard' : '' }, h('b', p.d.toUpperCase()), h('span', `PAYS ${mult}×`)),
        h('div.hs-cat-corner.is-b', h('i', { html: ICONS[p.cat] || ICONS.general }), h('b', p.d === 'hard' ? 'H' : 'M')));
      els.cat.classList.remove('is-flipped');
    }
    if (game.phase !== 'cat') { els.cat.classList.add('is-landed', 'is-flipped'); return; }
    // the timeline: (DOUBLE DOWN / ALL IN title card) → the card lands → it turns over
    const since = serverNow() - game.phaseStartAt;
    const pre = (isDoubleDown(r) ? MS.dd : 0) + (isFinal(r) ? MS.allin : 0);
    if (fresh) {
      els.cat.classList.remove('is-flipped', 'is-landed');
      if (isDoubleDown(r) && since < MS.dd) {
        cards.card('DOUBLE DOWN', 'EVERY PAYOUT THIS ROUND IS DOUBLED', MS.dd - 300, 'dd');
        sfx.play('dd'); room.shimmer(); root.classList.add('is-flare'); setTimeout(() => root.classList.remove('is-flare'), 1800);
      }
      if (isFinal(r) && since < MS.allin) {
        cards.card('ALL IN', 'THE FINAL · ALWAYS HARD · BET UP TO EVERYTHING', MS.allin - 400, 'allin');
        sfx.tension(true); duckMusic(0.35, 2.5);
      }
    }
    const landAt = pre + 150, flipAt = pre + 900;
    later('land', landAt, () => { els.cat.classList.add('is-landed'); sfx.play('deal'); });
    later('flip', flipAt, () => { els.cat.classList.add('is-flipped'); sfx.play('flip'); ann.announce(`${catLabel(p.cat)} · ${p.d.toUpperCase()}`, p.d === 'hard' ? 'hard' : 'cat'); });
  }

  // one-shot timeline items per round: skipped (without sound) if a refresh lands after them
  const timers = new Map();
  function later(id, atMs, fn, base = game.phaseStartAt) {
    const key = `${game.matchId}|${game.round}|${game.phase}|${id}`;
    if (local.played.has(key) || timers.has(key)) return;
    const wait = base + atMs - serverNow();
    if (wait < -900) { local.played.add(key); silentCatchUp(id); return; }
    timers.set(key, setTimeout(() => { timers.delete(key); if (destroyed || local.played.has(key)) return; local.played.add(key); fn(); }, Math.max(0, wait)));
  }
  function silentCatchUp(id) {
    if (id === 'land') els.cat.classList.add('is-landed');
    if (id === 'flip') els.cat.classList.add('is-flipped');
  }

  // ================================================================ the pot
  function renderPot() {
    const lk = locks();
    const n = Object.values(lk).filter(x => x && x.b).length;
    const pile = els.pot.querySelector('.hs-pot-pile');
    if (Number(pile.dataset.n) === n) return;
    const before = Number(pile.dataset.n || 0);
    pile.dataset.n = n;
    // a neat pile per bettor (the amounts stay secret: every bettor's chips look the same until the showdown)
    pile.replaceChildren(...Array.from({ length: n }, (_, i) => h('i.hs-pchip', { style: { '--i': i, '--a': `${(i * 137) % 360}deg` } })));
    if (n > before && before >= 0 && game.phase === 'bet') {
      // someone else locked: their chips slide in from their seat
      for (const [uid, x] of Object.entries(lk)) {
        if (!x || !x.b || uid === me() || pile.dataset[`u${uid}`]) continue;
        pile.dataset[`u${uid}`] = '1';
        room.chips(pos.seats[uid], pos.pot, 150, { kind: 'bet', max: 5 });
        sfx.play('chips', { n: 4, pan: 0 });
      }
    }
  }

  // ================================================================ betting (the dock)
  function renderDock() {
    if (!game) return;
    const phase = game.phase;
    const mine = inMatch();
    const stack = myStack();
    const sig = JSON.stringify([phase, game.round, stack, local.lockedBet, local.answer, mine, locks()[me()] && locks()[me()].b]);
    if (els.dock.dataset.sig === sig && phase !== 'bet') return;
    if (els.dock.dataset.sig === sig) return;
    els.dock.dataset.sig = sig;
    root.classList.toggle('is-betting', phase === 'bet' && mine && local.lockedBet == null);
    if (!mine) { els.dock.replaceChildren(h('div.hs-spec', 'WATCHING — YOU’LL BE DEALT IN NEXT GAME')); return; }
    const stackEl = h('div.hs-mystack', chipStack(stack), h('div.hs-mystack-l', h('span', 'YOUR STACK'), h('b', num(stack))));
    const l = ledger(game, game.round)[me()];
    const iou = l && l.loanN ? h('div.hs-iou.is-me', `ON CREDIT · IOU ${num(l.loans)}`) : null;
    if (phase === 'bet' && local.lockedBet == null && !(locks()[me()] && locks()[me()].b)) {
      els.dock.replaceChildren(betControls(stack), h('div.hs-dock-row', stackEl, iou));   // h() skips a null child
      return;
    }
    const lockedBet = local.lockedBet;
    const line = phase === 'bet' ? h('div.hs-locked', h('span', 'LOCKED IN'), h('b', lockedBet != null ? num(lockedBet) : '✓'), h('em', waitingLine('b')))
      : phase === 'q' ? h('div.hs-locked', h('span', 'YOUR BET'), h('b', lockedBet != null ? num(lockedBet) : num(minBet(stack))), h('em', local.answer != null ? waitingLine('a') : 'PICK YOUR ANSWER'))
        : null;
    els.dock.replaceChildren(h('div.hs-dock-row', stackEl, iou, line));
  }

  function waitingLine(k) {
    const parts = Object.keys(game.participants || {}).filter(u => !(st.presence[u] && st.presence[u].online === false));
    const left = parts.filter(u => !(locks()[u] && locks()[u][k])).length;
    return left ? `WAITING FOR ${left}` : 'ALL IN';
  }

  /** The stack in front of you: columns of chips by value, believable heights. */
  function chipStack(amount) {
    // tall, believable columns: hundreds and quarters for an ordinary stack, the big plaques once it's large
    const denoms = amount >= 4000 ? [1000, 500, 100] : amount >= 500 ? [100, 25, 10] : [25, 10];
    const list = [];
    let left = Math.max(0, Math.round(amount));
    for (const d of denoms) while (left >= d && list.length < 40) { list.push(d); left -= d; }
    if (left > 0 && list.length < 40) list.push(10);
    const cols = {};
    for (const v of list) (cols[v] ||= []).push(v);
    return h('div.hs-stack', ...Object.entries(cols).sort((a, b) => b[0] - a[0]).slice(0, 4).map(([v, arr]) => h('div.hs-col', { style: { '--c': CHIP[v].body, '--e': CHIP[v].edge } },
      ...arr.slice(0, 11).map((_, i) => h('i.hs-schip', { style: { '--i': i } })))));
  }

  function betControls(stack) {
    const min = minBet(stack), max = stack;
    const p = plan();
    const mult = payout(p.d, game.round);
    if (local.bet == null) {
      let saved = null;
      try { saved = Number(sessionStorage.getItem(`hs:bet:${game.matchId}:${game.rk}`)); } catch { /* fine */ }
      local.bet = clampBet(saved || min, stack);
    }
    const amount = h('b.hs-bet-n', num(local.bet));
    const win = h('span.hs-bet-win');
    const step = max > 200 ? 10 : 1;
    const slider = h('input.hs-slider', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(local.bet), 'aria-label': 'Your bet',
      oninput: e => setBet(Number(e.target.value), false) });
    const paint = () => {
      amount.textContent = num(local.bet);
      win.textContent = `WIN +${num(local.bet * mult)}`;
      const f = max > min ? (local.bet - min) / (max - min) : 1;
      slider.style.setProperty('--f', String(f));
      if (Number(slider.value) !== local.bet) slider.value = String(local.bet);
      allBtn.classList.toggle('is-on', local.bet === max);
    };
    const setBet = (v, fromBtn = true) => {
      const before = local.bet;
      local.bet = clampBet(v, stack);
      try { sessionStorage.setItem(`hs:bet:${game.matchId}:${game.rk}`, String(local.bet)); } catch { /* fine */ }
      paint();
      if (fromBtn && local.bet !== before) sfx.play(local.bet > before ? 'chips' : 'chip', { n: 3 });
      else if (!fromBtn && Math.abs(local.bet - before) >= Math.max(10, (max - min) / 12)) sfx.play('chip');
    };
    const quick = (label, f) => h('button.hs-quick', { type: 'button', onclick: () => setBet(f(stack)) }, label);
    const allBtn = h('button.hs-quick.is-all', { type: 'button', onclick: () => setBet(max) }, 'ALL IN');
    const addChip = v => () => {
      const from = center(document.querySelector(`.hs-add[data-v="${v}"]`));
      if (local.bet + v > max) { sfx.play('deny'); return; }
      room.chips(from, pos.pot, v, { kind: 'bet', max: 1 });
      setTimeout(() => sfx.play('chip'), 380);
      setBet(local.bet + v, false);
    };
    const adders = [10, 25, 100, 500].filter(v => v <= max).map(v => {
      const b = h('button.hs-add', { type: 'button', dataset: { v: String(v) }, 'aria-label': `Add ${v}`, style: { '--c': CHIP[v].body, '--e': CHIP[v].edge, '--k': CHIP[v].ink } }, h('span', String(v)));
      dragChip(b, v, addChip(v));
      return b;
    });
    const lock = h('button.hs-lockin', { type: 'button', onclick: () => lockBet() }, h('span', 'LOCK IN'));
    paint();
    return h('div.hs-bet',
      h('div.hs-bet-head', h('span.hs-bet-k', 'YOUR BET'), amount, win),
      slider,
      h('div.hs-bet-row', quick('MIN', () => min), quick('¼', s => Math.round(s / 4)), quick('½', s => Math.round(s / 2)), allBtn),
      h('div.hs-bet-row.is-adders', h('span.hs-add-l', 'TAP OR DRAG CHIPS'), ...adders),
      lock);
  }

  // a chip dragged up into the pot adds itself (a tap does too)
  function dragChip(b, v, add) {
    let start = null;
    b.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY }; b.setPointerCapture(e.pointerId); b.classList.add('is-held'); });
    b.addEventListener('pointermove', e => { if (!start) return; b.style.setProperty('--dx', `${e.clientX - start.x}px`); b.style.setProperty('--dy', `${Math.min(0, e.clientY - start.y)}px`); });
    const end = e => {
      if (!start) return;
      const dy = e.clientY - start.y, dx = e.clientX - start.x;
      start = null;
      b.classList.remove('is-held'); b.style.removeProperty('--dx'); b.style.removeProperty('--dy');
      if (Math.hypot(dx, dy) < 8 || dy < -40) add();
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', () => { start = null; b.classList.remove('is-held'); });
  }

  async function lockBet(v = local.bet) {
    if (!inMatch() || game.phase !== 'bet' || local.lockedBet != null) return;
    const stack = myStack();
    const bet = clampBet(v, stack);
    const rk = game.rk, m = game.matchId;
    local.lockedBet = bet;
    sfx.play('lock');
    vibrate(18);
    room.chips(pos.dock, pos.pot, bet, { kind: 'bet', max: 10 });
    setTimeout(() => sfx.play('chips', { n: Math.min(10, breakdown(bet, 10).length) }), 300);
    renderDock();
    try {
      await set(dbRef(`hsbet/${st.code}/${m}/${rk}/${me()}/b`), { b: bet, at: serverTimestamp() });
      await set(dbRef(`rooms/${st.code}/hslock/${m}/${rk}/${me()}/b`), serverTimestamp());
    } catch (e) { console.warn('bet', e); if (game && game.rk === rk) { local.lockedBet = null; renderDock(); } }
  }

  // ================================================================ the question
  function renderQuestion(fresh) {
    const p = plan();
    if (!p.cat || !['q', 'show'].includes(game.phase)) return;
    const q = decodeQ(game, st.code, p.i);
    if (!q) return;
    const reveal = game.reveal && game.reveal[game.round];
    const shown = game.phase === 'show' && reveal != null && lit();
    const sig = `${game.matchId}|${game.round}|${local.answer}|${shown}|${game.phase}`;
    if (els.qcard.dataset.sig === sig && !fresh) return;
    els.qcard.dataset.sig = sig;
    const mult = payout(p.d, game.round);
    const canAnswer = game.phase === 'q' && inMatch() && local.answer == null && !(locks()[me()] && locks()[me()].a);
    els.qcard.replaceChildren(h('div.hs-q-in',
      h('div.hs-q-k', h('i', { html: ICONS[p.cat] || ICONS.general }), h('span', `${catLabel(p.cat)} · ${p.d.toUpperCase()} · PAYS ${mult}×`)),
      h('div.hs-q-text', q.q),
      h('div.hs-q-opts', ...q.a.map((t, i) => h('button.hs-opt', {
        type: 'button', disabled: !canAnswer || null,
        class: [local.answer === i ? 'is-mine' : '', shown && i === reveal ? 'is-right' : '', shown && local.answer === i && i !== reveal ? 'is-wrong' : '', shown && i !== reveal && local.answer !== i ? 'is-dim' : ''].join(' '),
        onclick: () => answer(i),
      }, h('b', LETTERS[i]), h('span', t)))),
      h('div.hs-q-bar', h('i'))));
  }

  async function answer(i) {
    if (!inMatch() || game.phase !== 'q' || local.answer != null) return;
    const rk = game.rk, m = game.matchId;
    local.answer = i;
    sfx.play('lock');
    renderQuestion(true); renderDock();
    try {
      await set(dbRef(`hsbet/${st.code}/${m}/${rk}/${me()}/a`), { a: i, at: serverTimestamp() });
      await set(dbRef(`rooms/${st.code}/hslock/${m}/${rk}/${me()}/a`), serverTimestamp());
    } catch (e) { console.warn('answer', e); if (game && game.rk === rk) { local.answer = null; renderQuestion(true); } }
  }

  // ================================================================ the showdown
  const SHOW = { light: 0, cards: 1200, flip0: 1700, step: 650 };
  function chipsAt() {
    const n = Object.keys(game.participants || {}).length;
    return isFinal(game.round) ? 1200 + n * 2600 : SHOW.flip0 + n * SHOW.step + 250;
  }
  const lit = () => !!showT0 && serverNow() >= showT0 + SHOW.light;

  function renderShow(fresh) {
    const res = game.res && game.res[game.round];
    if (!res) {
      if (fresh) { duckMusic(isFinal(game.round) ? 0.12 : 0.6, 0.8); els.show.replaceChildren(h('div.hs-show-wait', 'THE DEALER COUNTS THE BETS…')); }
      showT0 = 0;
      return;
    }
    const n = Object.keys(game.participants || {}).length;
    showT0 = game.phaseEndsAt - showMs(n, isFinal(game.round));
    const final = isFinal(game.round);
    const order = final && game.order ? game.order : seatOrder();
    const sig = `${game.matchId}|${game.round}`;
    if (els.show.dataset.sig !== sig) {
      els.show.dataset.sig = sig;
      els.show.classList.toggle('is-final', final);
      els.show.replaceChildren(...order.map((uid, i) => betCard(uid, res[uid], i)));
    }
    const base = showT0;
    later('light', SHOW.light, () => { renderQuestion(true); const r = res[me()]; sfx.play('correct'); if (r && inMatch()) setTimeout(() => sfx.play(r.ok ? 'win' : 'wrong'), 500); }, base);
    later('cards', SHOW.cards, () => { els.show.classList.add('is-dealt'); root.classList.add('is-dealt'); sfx.play('deal'); }, base);
    order.forEach((uid, i) => {
      const at = final ? 1200 + i * 2600 : SHOW.flip0 + i * SHOW.step;
      later(`spot${i}`, final ? at - 500 : at, () => { if (final) spotlight(uid); }, base);
      later(`flip${i}`, at, () => flipCard(uid, res[uid], final), base);
      if (final) later(`pay${i}`, at + 1100, () => pay(uid, res[uid]), base);
    });
    if (!final) later('pay', chipsAt(), () => { for (const uid of order) pay(uid, res[uid]); renderSeats(); }, base);
    else later('payall', chipsAt(), () => { spotlight(null); renderSeats(); sfx.tension(false); duckMusic(0.5, 1.2); }, base);
    // a refresh that lands later: show the flipped cards straight away
    const since = serverNow() - base;
    if (since > SHOW.cards) { els.show.classList.add('is-dealt'); root.classList.add('is-dealt'); }
    order.forEach((uid, i) => { const at = final ? 1200 + i * 2600 : SHOW.flip0 + i * SHOW.step; if (since > at + 900) els.show.querySelector(`[data-uid="${uid}"]`)?.classList.add('is-flipped'); });
  }

  function betCard(uid, r, i) {
    const p = st.players[uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
    const x = r || { b: 0, a: -1, ok: false, d: 0 };
    return h('div.hs-bc', { dataset: { uid }, style: { '--i': i, '--c': colorHex(p.color) }, class: uid === me() ? 'is-me' : '' },
      h('div.hs-bc-in',
        h('div.hs-bc-back'),
        h('div.hs-bc-front', { class: x.ok ? 'is-win' : 'is-lose' },
          h('div.hs-bc-who', avatar(p.avatar, p.color, 22), h('span', p.name)),
          h('div.hs-bc-ans', x.a >= 0 ? LETTERS[x.a] : '—'),
          h('div.hs-bc-bet', h('span', 'BET'), h('b', num(x.b))),
          h('div.hs-bc-d', signed(x.d)))));
  }
  function flipCard(uid, r, final) {
    const c = els.show.querySelector(`[data-uid="${uid}"]`);
    if (c) c.classList.add('is-flipped');
    sfx.play('tick'); setTimeout(() => sfx.play('flip'), 60);
  }
  function pay(uid, r) {
    if (!r) return;
    const seat = pos.seats[uid];
    if (r.ok) { room.chips(pos.pot, seat, r.b + r.d, { kind: 'win', max: 12 }); setTimeout(() => sfx.play('chips', { n: 8 }), 500); }
    else { room.chips(seat, pos.house, r.b, { kind: 'lose', max: 8 }); sfx.play('lose'); }
  }
  function spotlight(uid) {
    if (!uid) { els.spot.classList.remove('is-on'); return; }
    const c = els.show.querySelector(`[data-uid="${uid}"]`);
    const at = center(c);
    if (!at) return;
    els.spot.style.setProperty('--x', `${at.x}px`); els.spot.style.setProperty('--y', `${at.y}px`);
    els.spot.classList.add('is-on');
    els.show.querySelectorAll('.hs-bc').forEach(b => b.classList.toggle('is-focus', b === c));
  }

  // ================================================================ standings
  function renderStand(fresh) {
    const rows = standings(game, game.round + 1);
    const before = ledger(game, game.round);
    const sig = `${game.matchId}|${game.round}`;
    if (els.stand.dataset.sig === sig) return;
    els.stand.dataset.sig = sig;
    els.stand.replaceChildren(h('div.hs-st-in',
      h('div.hs-st-k', isFinal(game.round + 1) ? 'BEFORE THE FINAL' : `AFTER ROUND ${game.round + 1}`),
      h('ol.hs-st-list', ...rows.map((r, i) => {
        const p = st.players[r.uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
        const x = game.res && game.res[game.round] && game.res[game.round][r.uid];
        const d = x ? x.d : 0;
        const val = h('b.hs-st-n', num(before[r.uid] ? before[r.uid].net : START));
        setTimeout(() => countUp(val, before[r.uid] ? before[r.uid].net : START, r.net, reduced() ? 1 : 900, num), 250 + i * 70);
        return h('li.hs-st-row', { class: [r.uid === me() ? 'is-me' : '', i === 0 ? 'is-first' : ''].join(' '), style: { '--c': colorHex(p.color), '--i': i } },
          h('span.hs-st-r', String(r.rank)), avatar(p.avatar, p.color, 26), h('span.hs-st-name', p.name, r.loans ? h('em.hs-iou', `IOU ${num(r.loans)}`) : null),
          h('span.hs-st-d', { class: d > 0 ? 'is-up' : d < 0 ? 'is-down' : '' }, d ? signed(d) : ''), val);
      }))));
    if (fresh) sfx.play('chips', { n: 4 });
  }

  // ================================================================ the final
  function renderFinal(fresh) {
    root.classList.add('is-final');
    if (finalView) return;
    const rows = standings(game).map(r => ({ uid: r.uid, rank: r.rank, score: r.net, note: r.loans ? `IOU ${num(r.loans)} REPAID` : null }));
    const L = ledger(game);
    report = reportPanel({
      prefix: 'hs', title: 'THE BOOKS', head: ['PLACE', 'CHIPS', 'BEST HAND', 'RIGHT', 'LOANS'],
      rows: standings(game).map((r, i) => {
        const p = st.players[r.uid] || { name: 'GHOST', color: 'cyan' };
        return { uid: r.uid, name: p.name, color: colorHex(p.color), me: r.uid === me(), cells: [String(r.rank), num(r.net), L[r.uid].best ? `+${num(L[r.uid].best)}` : '—', `${L[r.uid].right}/${ROUNDS + 1}`, L[r.uid].loans ? num(L[r.uid].loans) : '—'] };
      }),
    });
    finalView = createFinal({
      rows, players: st.players, me: me(), presence: st.presence,
      winnerLine: name => `${name} takes the house`, scoreLabel: 'CHIPS', kicker: 'THE HOUSE CLOSES', extra: report,
    });
    els.final.replaceChildren(finalView.el);
    if (fresh) { room.setRain(true); duckMusic(1, 1.5); sfx.tension(false); }
    else room.setRain(true);
  }

  // ================================================================ frame
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!room || !game) return;
    // timers
    if (['bet', 'q'].includes(game.phase) && game.phaseEndsAt) {
      const total = game.phase === 'bet' ? MS.bet : MS.q;
      const left = Math.max(0, game.phaseEndsAt - serverNow());
      const f = Math.min(1, left / total);
      els.timer.style.setProperty('--f', f.toFixed(4));
      const s = Math.ceil(left / 1000);
      const b = els.timer.lastChild;
      if (b.textContent !== String(s)) { b.textContent = String(s); els.timer.classList.toggle('is-low', s <= 5); if (s <= 5 && s > 0) sfx.play('tick'); }
      const bar = els.qcard.querySelector('.hs-q-bar i');
      if (bar) bar.style.transform = `scaleX(${f.toFixed(4)})`;
    }
    const work = room.frame(now);
    tiers.sample(now, work);
    tiers.tick(now);
    // the bot (tests)
  }

  // ================================================================ test hook
  let hook = null;
  function setupHook() {
    hook = {
      state: () => ({ phase: game && game.phase, round: game && game.round, plan: game && plan(), stack: game && myStack(), bet: local.bet, lockedBet: local.lockedBet, answer: local.answer, seats: els.seats.children.length, showT0 }),
      bet: v => lockBet(v),
      setBet: v => { local.bet = clampBet(v, myStack()); els.dock.dataset.sig = ''; renderDock(); return local.bet; },
      answer: i => answer(i),
      correct: () => { const p = plan(); const q = p.cat && decodeQ(game, st.code, p.i); return q ? q.c : null; },
      room: () => room && room.stats(),
      tier: () => tiers.get(),
      setTier: t => tiers.set(t),
      fps: () => tiers.fps(),
      work: () => tiers.work(),
      announcements: () => ann.log.slice(),
      bot: (opts = {}) => { bot = { rate: opts.rate ?? 0.6, allIn: opts.allIn || 0, seed: opts.seed || 1, delay: opts.delay ?? 400 }; botTick(); return true; },
      stopBot: () => { bot = null; clearTimeout(botTimer); },
    };
    installTestHook('__stakes', hook);
  }
  function botTick() {
    clearTimeout(botTimer);
    if (!bot || destroyed) return;
    botTimer = setTimeout(botTick, bot.delay);
    if (!game || !inMatch()) return;
    const R = rngFrom(`${bot.seed}:${game.round}:${me()}`);
    if (game.phase === 'bet' && local.lockedBet == null && !(locks()[me()] && locks()[me()].b)) {
      const s = myStack();
      lockBet(R() < bot.allIn ? s : Math.round(s * (0.1 + R() * 0.4)));
    }
    if (game.phase === 'q' && local.answer == null && !(locks()[me()] && locks()[me()].a)) {
      const c = hook.correct();
      answer(R() < bot.rate && c != null ? c : Math.floor(R() * 4));
    }
  }

  return { mount, update, unmount };
}
