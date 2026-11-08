// OVERCLOCK — THE VICTORY BODY (OC2 — docs/overclock.md "End of match"; contract D8, docs/cartridge.md): finalScene(el, game, state) draws ONLY
// the body inside the console's podium FRAME (ui/final.js#createFinal owns BACK TO THE ROOM, the XP box, "already yours" / the next unlock,
// THE CARD REVEAL + their order). NO rematch / lobby buttons here.
//   "OVERCLOCKED" · a slanted WINNER stamp · the winner's NAME as a crafted NEON TUBE sign that POWERS UP (each letter's lit tube a
//   pre-rendered layer whose opacity flickers on in sequence, then holds steady) · slow rotating light rays behind it (one pre-rendered
//   layer, transform: rotate) · their score · THE PODIUM 2-1-3 on the console's real SLIM CARDS (ui/strip-board.js — one shared effect
//   surface) slamming up · the two AWARD CHIPS (logic.js#awardChips).
//   A tie at the top = CO-WINNERS: both names on the sign, the shared top step (never PHOTO FINISH — the server's rule).
//   SOLO: no podium — the score is the hero; NEW PERSONAL BEST only when the SERVER's outcome says one was set (/api — profile/queue.js),
//   otherwise YOUR SCORE. With /api down: just the score.
//   The winner's sound (17-winner-fanfare — the owner's main one) as the sign powers up; everything works silently.
//   NOBODY SCORED (OC8 — A2, THE FABLE REVIEW: a 0–0 match was crowned CO-WINNERS with the fanfare): the top score 0 → no neon sign, no
//   WINNER stamp, no fanfare, no podium, no co-winners — a graphite NOBODY SCORED stamp + "0 POINTS". A solo run with 0 → no personal-best line
//   (the server never records it either — core/match-report.js#overclockExtra).
// 60 fps: transform + opacity only; every glow is a static layer. Reduced motion / a late rejoin: the sign lit at rest, no rays turning.
import { h, reducedMotion } from '../../ui/dom.js';
import { avatar, leaderboard, countUp, fmtNum } from '../../ui/components.js';
import { colorHex } from '../../config.js';
import { serverNow } from '../../firebase.js';
import { LETTERS } from '../../core/marks.js';
import { standings, awardChips, finalBeats } from './logic.js';
import { ocSfx } from './sfx.js';

// ---------------------------------------------------------------------------------------------- THE NEON TUBE SIGN
// the city's tube alphabet (core/marks.js — 10 × 14, single strokes) + digits and a few marks in the same hand
const EXTRA = {
  0: 'M5 0 C9.6 0 9.6 14 5 14 C0.4 14 0.4 0 5 0 Z', 1: 'M2.6 3 L5.6 0 V14 M2.6 14 H8.4',
  2: 'M1.2 3.2 Q2 0 5 0 Q8.8 0 8.8 3.6 Q8.8 6.4 5.6 8.6 L1 14 H9', 3: 'M1.2 1.6 Q2.6 0 5 0 Q8.6 0 8.6 3.4 Q8.6 6.8 4.6 6.8 Q9 6.8 9 10.4 Q9 14 5 14 Q2.2 14 1 12',
  4: 'M7 14 V0 L1 9.6 H9.4', 5: 'M8.6 0 H2 L1.4 6.4 Q3 5.4 5 5.4 Q9 5.4 9 9.6 Q9 14 5 14 Q2.2 14 1 12',
  6: 'M8.4 1.4 Q7 0 5 0 Q1 0 1 7.6 Q1 14 5 14 Q9 14 9 9.6 Q9 5.6 5 5.6 Q2.2 5.6 1.1 7.8', 7: 'M1 0 H9 L3.6 14',
  8: 'M5 7 Q1.4 7 1.4 3.5 Q1.4 0 5 0 Q8.6 0 8.6 3.5 Q8.6 7 5 7 Q1 7 1 10.5 Q1 14 5 14 Q9 14 9 10.5 Q9 7 5 7 Z',
  9: 'M1.6 12.6 Q3 14 5 14 Q9 14 9 6.4 Q9 0 5 0 Q1 0 1 4.4 Q1 8.4 5 8.4 Q7.8 8.4 8.9 6.2',
  '-': 'M2 7.4 H8', '.': 'M4.4 13.4 H5.6', '_': 'M1 14 H9', '!': 'M5 0 V9.4 M5 12.8 V14', '&': 'M8.6 14 L2.2 5.2 Q1.2 3.6 1.8 2 Q2.6 0 4.6 0 Q7 0 7 2.4 Q7 4.4 4.2 6.4 Q1 8.6 1 10.8 Q1 14 4.6 14 Q7.4 14 9.2 9.6',
};
export const tubeGlyph = ch => LETTERS[ch] || EXTRA[ch] || null;
const STEP = 12;   // a letter's advance (10 wide + 2), a space = 7
let signN = 0;
/** the name as tube letters: every glyph its own HTML-wrapped layers (unlit glass · lit tube) — only the lit layer's opacity animates */
export function neonSign(names, { delay = 500, step = 85 } = {}) {
  const id = `ocsg${++signN}`;
  let k = 0;
  const lines = names.map(({ text, color }) => {
    const chars = [...String(text || '').toUpperCase()].slice(0, 14);
    const width = chars.reduce((w, ch) => w + (ch === ' ' || !tubeGlyph(ch) ? 7 : STEP), 0) - 2;
    return h('div.oc-sign-line', { style: { '--tube': color, '--n': Math.max(1, width) } }, chars.map(ch => {
      const d = tubeGlyph(ch);
      if (!d) return h('span.oc-sign-gap', { 'aria-hidden': 'true' });
      const i = k++;
      const svg = layer => `<svg viewBox="-2.2 -2.2 14.4 18.4" aria-hidden="true">${layer}</svg>`;
      return h('span.oc-sign-ch', { 'aria-hidden': 'true', style: { '--i': i } },
        h('span.oc-sign-off', { html: svg(`<path class="oc-tube-glass" d="${d}"/><path class="oc-tube-dead" d="${d}"/>`) }),
        h('span.oc-sign-on', { html: svg(`<path class="oc-tube-glow" filter="url(#${id})" d="${d}"/><path class="oc-tube-body" d="${d}"/><path class="oc-tube-core" d="${d}"/>`) }));
    }));
  });
  const defs = h('span.oc-sign-defs', { html: `<svg width="0" height="0" aria-hidden="true"><defs><filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.3"/></filter></defs></svg>` });
  const label = names.map(n => n.text).join(' and ');
  return h('div.oc-sign', { role: 'img', 'aria-label': label, style: { '--d0': `${delay}ms`, '--st': `${step}ms`, '--count': k } }, defs, lines);
}

// ---------------------------------------------------------------------------------------------- THE BODY
const GHOST = { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
const fmtSecs = ms => `${(ms / 1000).toFixed(1)} s`;
/** the console calls this inside its podium frame (ui/final.js) — draw the body into el */
export function finalScene(el, game, state) {
  const players = (state && state.players) || {};
  const me = state && state.uid;
  const rows = standings(game);
  const solo = Object.keys(game.participants || {}).length === 1;
  const p = uid => players[uid] || GHOST;
  // late (a rejoin long after the power-up) or reduced motion: everything at rest
  const type = game.order && game.order[game.ci];
  const vAt = (game.phaseStartAt || 0) + finalBeats(type, solo).victory;
  const late = serverNow() - vAt > 6000;
  const still = late || reducedMotion();
  el.classList.add('oc-vic');
  if (still) el.classList.add('is-still');
  if (!rows.length || !(rows[0].score > 0)) el.classList.add('is-zero');   // (A2: no rays when nobody scored)
  const zero = !rows.length || !(rows[0].score > 0);   // (A2: nobody scored — every total 0)
  const chips = zero ? [] : awardChips(game);
  const top = rows.filter(r => r.rank === 1);
  const winners = top.slice(0, 2);
  const score = h('b.oc-vic-score-n', still ? fmtNum(rows[0] ? rows[0].score : 0) : '0');
  const kids = [
    // (OC3 Group 0 — the owner's phone: the turning rays poked past the screen's edges and the page slid SIDEWAYS) the rays turn inside a
    // CLIP of their own, exactly the panel's width — nothing outside it can ever widen the screen
    h('div.oc-vic-rays-clip', { 'aria-hidden': 'true' }, h('div.oc-vic-rays')),
    h('div.oc-vic-title', { 'data-text': 'OVERCLOCKED' }, 'OVERCLOCKED'),
  ];
  if (solo) {
    const mine = rows[0] || { score: 0 };
    const stamp = h('div.oc-vic-stamp.is-solo', h('span.oc-vic-stamp-glow', { 'aria-hidden': 'true' }), h('b', 'YOUR SCORE'));
    const best = h('div.oc-vic-best');
    kids.push(stamp, h('div.oc-vic-solo', h('b.oc-vic-solo-n', still ? fmtNum(mine.score) : '0'), h('span.oc-vic-solo-k', 'POINTS')), best);
    if (!still && !zero) setTimeout(() => { const n = el.querySelector('.oc-vic-solo-n'); if (n && n.isConnected) countUp(n, 0, mine.score, 1400); }, 700);
    // (A2: a 0 run never shows a personal-best line — the server keeps no board row for it)
    // NEW PERSONAL BEST — only from the server's own answer (OC5: QUICK + STANDARD solo runs each have a board; /api down = just the score)
    if (!zero) import('../../profile/queue.js').then(Q => {
      const k = state && state.code ? Q.matchKey(state.code, game.matchId) : null;
      // (OC5: QUICK runs have their own board now — overclock-quick-solo; a run that didn't beat it shows YOUR BEST from the outcome's bests)
      const show = o => {
        if (!o || !best.isConnected) return;
        const pb = (o.pbs || []).find(x => /^overclock-/.test(String(x.b)));
        if (pb) {
          stamp.querySelector('b').textContent = 'NEW PERSONAL BEST';
          stamp.classList.add('is-pb');
          best.textContent = pb.prev != null ? `WAS ${fmtNum(pb.prev)}` : 'YOUR FIRST ON THE BOARD';
          return;
        }
        const b = Object.entries(o.bests || {}).find(([k]) => /^overclock-.*-solo$/.test(k));
        if (b) best.textContent = `YOUR BEST · ${fmtNum(b[1])}`;
      };
      if (!k) return;
      show(Q.outcomeFor(k));
      const off = Q.onOutcome((kk, o) => { if (kk === k) show(o); });
      const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); off(); } }, 3000);
    }).catch(() => {});
  } else if (zero) {
    // NOBODY SCORED (A2): the graphite stamp + the zero — no sign, no fanfare, no podium (nobody earned a step)
    el.dataset.podium = 'none';   // (FRIENDS B — B4: the console's results list then shows everyone)
    kids.push(
      h('div.oc-vic-stamp.is-none', h('span.oc-vic-stamp-glow', { 'aria-hidden': 'true' }), h('b', 'NOBODY SCORED')),
      h('div.oc-vic-solo.is-none', h('b.oc-vic-solo-n', '0'), h('span.oc-vic-solo-k', 'POINTS')));
  } else {
    const names = winners.map(r => ({ text: p(r.uid).name, color: colorHex(p(r.uid).color) }));
    kids.push(
      h('div.oc-vic-stamp', h('span.oc-vic-stamp-glow', { 'aria-hidden': 'true' }), h('b', top.length > 1 ? 'CO-WINNERS' : 'WINNER')),
      neonSign(names),
      h('div.oc-vic-score', score, h('span', top.length > 1 ? 'PTS EACH' : 'PTS')),
      podium(game, rows, players, me));
    if (!still) {
      setTimeout(() => { if (el.isConnected) countUp(score, 0, rows[0] ? rows[0].score : 0, 1300); }, 900);
      setTimeout(() => { if (el.isConnected) ocSfx('fanfare'); }, 480);
    }
  }
  if (chips.length) kids.push(h('div.oc-vic-chips', chips.map(c => chip(c, p, me))));
  el.append(...kids);
}

/** THE PODIUM 2-1-3 on the console's SLIM CARDS: the top step (gold-orange) + 2nd (steel, lower left) + 3rd (bronze, lower right); a tie at
 *  the top shares the top step. The rows are the console's leaderboard() rows, upgraded to the real strips (ui/strip-board.js — ONE shared
 *  effect surface for all of them, every strip calm); they slam up 3rd → 2nd → 1st. */
function podium(game, rows, players, me) {
  const firsts = rows.filter(r => r.rank === 1).slice(0, 3);
  const rest = rows.filter(r => r.rank !== 1).slice(0, Math.max(0, 3 - firsts.length));
  const pick = [...firsts, ...rest];
  const list = leaderboard(pick, players, { me, stagger: 0 });
  list.classList.add('oc-vic-pod-list');
  [...list.children].forEach((row, i) => {
    const r = pick[i];
    const place = r.rank === 1 ? 'is-p1' : i === firsts.length ? 'is-p2' : 'is-p3';
    row.classList.add('oc-vic-step', place);
    row.style.setProperty('--k', String(place === 'is-p1' ? 2 + i : place === 'is-p2' ? 1 : 0));
    row.style.animationDelay = '';   // (leaderboard() staggers its rows inline — the podium times its own slam: 3rd → 2nd → 1st)
  });
  const box = h('div.oc-vic-podium', { class: firsts.length > 1 ? 'is-shared' : null }, list);
  // (leaderboard() upgrades its own rows to the slim cards — ui/strip-board.js, lazy; the plain rows show until then / if it can't)
  return box;
}

// (OC5 — LONG SHOT: a winning DUMB LUCK ticket at 8-1 or longer)
const CHIP = { streak: ['BEST STREAK', c => `×${c.v}`], fastest: ['FASTEST', c => `${fmtSecs(c.v)}`], longshot: ['LONG SHOT', c => `${c.v}-1`] };
function chip(c, p, me) {
  const [k, v] = CHIP[c.k];
  const who = p(c.uid);
  return h('div.oc-vic-chip', { class: c.uid === me ? 'is-me' : null, style: { '--c': colorHex(who.color) } },
    h('span.oc-vic-chip-k', k),
    h('b.oc-vic-chip-v', v(c), c.k === 'fastest' ? h('small', ' / RIGHT ANSWER') : null),
    h('span.oc-vic-chip-who', avatar(who.avatar, who.color, 22), h('span', c.uid === me ? 'YOU' : who.name)));
}
