// HOLD'EM — THE MOTION's PLAYER (HE4 — docs/holdem.md "THE MOTION"): runs motion-plan.js#schedule's steps over the table the view has
// ALREADY painted from the state. Every move is transform + opacity on the compositor (the Web Animations API, its delays — no per-frame
// JS but the number roll-ups, which the view's one frame loop ticks), every one ≤ ~0.5 s, none takes a tap (the layer is pointer-events:
// none) and none covers your buttons or your cards for long. A thing the state already shows but the motion hasn't reached yet (the river,
// a bet's chip, the dealt backs) waits invisible on the first keyframe (`fill: backwards`) — so a refresh, which runs no motion, simply
// shows the state. prefers-reduced-motion = instant states (only the words: BLINDS UP, HEADS UP, the KO card).
import { h, reducedMotion } from '../../ui/dom.js';
import { BEAT, holdsOf, awardLine, winLine, winningCards } from './motion-plan.js';

const BACK = new URL('../../../assets/holdem/cardback-casino.webp', import.meta.url).href;
const PERSP = 'perspective(700px)';

/**
 * view = { pos(id, what: 'emblem' | 'cards' | 'bet' | 'dealer'), seatEl(id), heroId(), heroCards(), slot(i), board(), potPos(),
 *          name(id), best(id), hold, numbers(), award(a | null), toast(text), moment(text), ko(step) }
 */
export function createMotion(layer, view) {
  const anims = new Set(), timers = new Set(), tweens = [];
  const reduce = () => reducedMotion();

  function animate(el, frames, opts) {
    if (!el || !el.animate) return null;
    const a = el.animate(frames, { fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)', ...opts });
    anims.add(a);
    a.onfinish = a.oncancel = () => anims.delete(a);
    return a;
  }
  const later = (ms, fn) => { const t = setTimeout(() => { timers.delete(t); fn(); }, Math.max(0, ms)); timers.add(t); };
  /** a hold that lets go of `amount` over `dur` from `delay` (eased) — `take(d)` gets each step's share; the view's frame loop calls tick */
  function roll(amount, dur, delay, take) {
    tweens.push({ amount, done: 0, dur: Math.max(1, dur), start: performance.now() + delay, take });
  }
  function tick(now) {
    if (!tweens.length) return;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i];
      if (now < w.start) continue;
      const f = Math.max(0, Math.min(1, (now - w.start) / w.dur));
      const v = f >= 1 ? w.amount : Math.round(w.amount * (1 - (1 - f) * (1 - f)));
      if (v !== w.done) { w.take(v - w.done); w.done = v; }
      if (f >= 1) tweens.splice(i, 1);
    }
    view.numbers();
  }

  // a GHOST: a card back or a chip that flies over the table (absolute in the layer, its own transform) and goes when it lands
  function ghost(kind, from, to, { delay = 0, dur = BEAT.chip, w = 14, hh = 14, fade = false, s0 = 1, s1 = 1, r0 = 0, r1 = 0 } = {}) {
    if (!from || !to) return;
    const el = kind === 'back' ? h('img.he-ghost.he-gback', { src: BACK, alt: '', draggable: 'false' }) : h('i.he-ghost.he-chip');
    el.style.width = `${w}px`; el.style.height = `${hh}px`;
    layer.append(el);
    const at = (p, s, r) => `translate(${(p.x - w / 2).toFixed(1)}px, ${(p.y - hh / 2).toFixed(1)}px) rotate(${r}deg) scale(${s})`;
    const a = animate(el, [
      { transform: at(from, s0, r0), opacity: 0, offset: 0 },
      { transform: at(from, s0, r0), opacity: 1, offset: 0.06 },
      { transform: at(to, s1, r1), opacity: fade ? 0 : 1, offset: 1 },
    ], { duration: dur, delay, fill: 'both' });
    if (!a) { el.remove(); return; }
    a.finished.then(() => el.remove(), () => el.remove());
  }
  /** an element the state shows already but the motion reaches later: hidden until `delay`, then in */
  const appear = (el, delay, dur = 120) => animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay });
  /** a card turns face up (its back on the reverse: css .he-card.is-flip — preserve-3d + the back face) */
  function flip(card, delay, dur = BEAT.flip) {
    if (!card) return;
    if (!card.querySelector('.he-cback')) card.append(h('img.he-cback', { src: BACK, alt: '', draggable: 'false' }));
    card.classList.add('is-flip');
    const a = animate(card, [
      { transform: `${PERSP} rotateY(180deg)` },
      { transform: `${PERSP} rotateY(-8deg) scale(1.04)`, offset: 0.78 },
      { transform: `${PERSP} rotateY(0deg)` },
    ], { duration: dur, delay, easing: 'ease-out' });
    const done = () => { card.classList.remove('is-flip'); const b = card.querySelector('.he-cback'); if (b) b.remove(); };
    if (a) a.finished.then(done, done); else done();
  }

  // ------------------------------------------------------------------ the steps
  const STEP = {
    deal(s) {
      const n = s.ids.length, hero = view.heroId();
      const from = view.pos(s.button, 'dealer') || view.board();
      for (let r = 0; r < 2; r++) s.ids.forEach((id, i) => {
        const d = s.at + (r * n + i) * BEAT.dealGap;
        if (id === hero) {
          const hc = view.heroCards()[r];
          const L = view.L();
          ghost('back', from, view.pos(id, 'card' + r), { delay: d, dur: BEAT.dealFly, w: L.hand.card.w, hh: L.hand.card.h, s0: 0.3, s1: 1, r0: -20, r1: r ? 5 : -5 });
          if (hc) appear(hc, d + BEAT.dealFly - 30, 60);
        } else {
          const seat = view.seatEl(id);
          ghost('back', from, view.pos(id, 'cards'), { delay: d, dur: BEAT.dealFly, w: 21, hh: 30, s0: 0.8, r0: -30, r1: r ? 8 : 0 });
          const back = seat && seat.querySelectorAll('.he-backs .he-back')[r];
          if (back) appear(back, d + BEAT.dealFly - 30, 60);
        }
      });
    },
    heroFlip(s) {
      view.heroCards().forEach((hc, i) => flip(hc.querySelector('.he-card'), s.at + i * 70));
      // (your hand's name waits for your cards to turn up — never a spoiler under two backs)
      const lab = view.heroEl().querySelector('.he-label');
      if (lab) appear(lab, s.at + 200, 160);
    },
    chip(s) {
      const hero = s.id === view.heroId();
      ghost('chip', view.pos(s.id, 'emblem'), view.pos(s.id, 'bet'), { delay: s.at, dur: BEAT.chip, s0: 0.7 });
      const seat = hero ? view.heroEl() : view.seatEl(s.id);
      const bet = seat && seat.querySelector(':scope > .he-bet');
      if (bet) appear(bet, s.at + BEAT.chip - 40, 100);
      if (s.allin) {
        const tag = hero ? view.heroEl().querySelector('.he-ytag') : seat && seat.querySelector('.he-tag');
        if (tag) animate(tag, [{ scale: '1.9', opacity: 0 }, { scale: '0.94', opacity: 1, offset: 0.7 }, { scale: '1', opacity: 1 }], { duration: 280, delay: s.at + 60 });
      }
    },
    sweep(s) {
      const to = view.potPos();
      let sum = 0;
      s.from.forEach(({ id, amount }) => { sum += amount; ghost('chip', view.pos(id, 'bet'), to, { delay: s.at, dur: BEAT.sweep, s1: 0.8 }); });
      view.hold.sweep += sum;
      roll(sum, 240, s.at + BEAT.sweep - 120, d => { view.hold.sweep = Math.max(0, view.hold.sweep - d); });
    },
    back(s) { ghost('chip', view.pos(s.id, 'bet'), view.pos(s.id, 'emblem'), { delay: s.at, dur: BEAT.chip, s1: 0.7, fade: true }); },
    board(s) {
      const slot = view.slot(s.i), card = slot && slot.querySelector('.he-card');
      flip(card, s.at);
    },
    fold(s) {
      if (s.id === view.heroId()) return;
      const from = view.pos(s.id, 'cards'), mid = view.board();
      if (!from || !mid) return;
      const to = { x: from.x + (mid.x - from.x) * 0.45, y: from.y + (mid.y - from.y) * 0.45 };
      for (let r = 0; r < 2; r++) ghost('back', { x: from.x + r * 8, y: from.y }, to, { delay: s.at + r * 30, dur: BEAT.fold, w: 21, hh: 30, fade: true, r0: r * 8, r1: 30 });
    },
    shown(s) {
      if (s.id === view.heroId()) { if (s.choice) view.heroCards().forEach((hc, i) => flip(hc.querySelector('.he-card'), s.at + i * 60, 260)); return; }
      const seat = view.seatEl(s.id);
      if (seat) seat.querySelectorAll('.he-shown .he-card').forEach((c, i) => flip(c, s.at + i * 50, 280));
    },
    award(s) {
      const p = s.pot, to = p.winners || [];
      const from = view.potPos();
      later(s.at, () => view.award({ line: awardLine(p, view.name, s.of > 1 || p.side || p.pot > 0), win: winLine(p), cards: winningCards(p, view.best), ids: to.map(w => w.id) }));
      to.forEach((w, j) => {
        for (let c = 0; c < 3; c++) ghost('chip', from, view.pos(w.id, 'emblem'), { delay: s.at + 120 + c * 50 + j * 40, dur: BEAT.award - 60, s1: 0.85 });
        roll(w.amount || 0, 320, s.at + BEAT.award - 120, d => { view.hold.stack[w.id] = Math.max(0, (view.hold.stack[w.id] || 0) - d); });
      });
      roll(p.amount || 0, 280, s.at + 140, d => { view.hold.pot = Math.max(0, view.hold.pot - d); });
      if (s.i === s.of - 1) later(s.at + BEAT.award + 900, () => view.award(null));
    },
    level(s) { view.toast(`BLINDS UP · ${fmtN(s.sb)}/${fmtN(s.bb)}`); },
    headsUp() { view.moment('HEADS UP'); },
    out(s) { if (s.id === view.me()) later(s.at + 300, () => view.ko(s)); },
  };
  const fmtN = n => Math.round(n || 0).toLocaleString('en-US');

  /** run a timeline (motion-plan.js#schedule) over the painted state */
  function run(steps) {
    if (!steps.length) return;
    const H = holdsOf(steps);
    if (reduce()) {
      for (const s of steps) if (s.kind === 'level' || s.kind === 'headsUp' || s.kind === 'out') STEP[s.kind](s);
      return;
    }
    // what the awards hold back (the stacks + the pot roll up as each pot lands)
    for (const [id, v] of Object.entries(H.stack)) view.hold.stack[id] = (view.hold.stack[id] || 0) + v;
    view.hold.pot += H.pot;
    view.numbers();
    for (const s of steps) { try { STEP[s.kind] && STEP[s.kind](s); } catch (e) { console.warn('[holdem motion]', s.kind, e); } }
  }

  /** a jump (a gap, a refresh, unmount): everything in flight stops, the holds let go — the state shows as it is */
  function cancel() {
    for (const a of [...anims]) { try { a.cancel(); } catch { /* gone */ } }
    anims.clear();
    for (const t of timers) clearTimeout(t);
    timers.clear();
    tweens.length = 0;
    layer.replaceChildren();
    view.hold.stack = {}; view.hold.pot = 0; view.hold.sweep = 0;
    view.award(null);
  }
  const busy = () => anims.size > 0 || tweens.length > 0;

  return { run, cancel, tick, busy, animate, flip };
}
