// THE END-OF-ROUND MOMENT (PROGRESSION A — the owner's mockups: progression-end-of-round.png A · GILDED + progression-moments.png 1–2). It
// opens over the podium once THIS phone's result is back (every phone its own; /api down = it never opens — the podium is as before), and
// CONTINUE goes back to the podium (REMATCH / LOBBY as today). ~4–5 s, a tap anywhere skips to its end; reduced motion = the end, still:
//   the placement lands → the XP lines count up one by one (xp-tick) → the total punches in (xp-total) → the level bar fills (what you had
//   a dimmer pink tube, what you just earned the bright pink tube — LOBBY FIXES: the profile's tube, no gold) → a LEVEL-UP flips the medal (medal-flip + level-up) + a burst, its unlocks shown →
//   the streak flame flickers on (flame-on) + today's dot lights → "NEXT UNLOCK AT LEVEL 25" (WHEN, never WHAT) → an achievement slides in
//   (achievement). Only transform + opacity move (60 fps).
import { h, vibrate } from '../ui/dom.js';
import { GAMES } from '../config.js';
import { levelInfo, bandOf, nextRewardLevel, BANDS } from '../core/levels.js';
import { streakView, streakDay } from '../core/streak.js';
import { ACH } from '../core/achievements.js';
import { ITEM, TIER_NAMES, KINDS } from '../core/items.js';
import { pgSfx, pgPrefetch } from '../audio/progress-sfx.js';
import { pgSheet, fanCrown, medal, flameIcon, reduced, num, pctFor, pctLine, cardVars, glowClass } from './look.js';

const PLACE = ['', '1ST PLACE', '2ND PLACE', '3RD PLACE'];
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'}`;

/** What a placing reads as. */
export function placeLine(o) {
  const n = o.n || 2, r = o.rank || n;
  const place = o.win ? '1ST PLACE' : r === 1 ? 'DEADLOCK' : PLACE[r] || `${ordinal(r)} PLACE`;
  const who = `${WORDS[n] || n} players`;
  const sub = o.win ? 'the room is yours' : r === 1 ? 'nobody blinked' : r === 2 ? 'one step off the top' : r === n ? 'there’s always the next round' : 'in the mix';
  return { place, sub: `${who} · ${sub}` };
}

/** A small picture of an item (a card's palette, a glow on a name, an emblem's glyph, a tube, the flame). */
export function itemSwatch(id, name = 'YOU') {
  const it = ITEM[id];
  if (!it) return h('span.pg-sw');
  if (it.kind === 'card') return h('span.pg-sw.is-card', { style: cardVars(id) }, h('i'));
  if (it.kind === 'glow') return h('span.pg-sw.is-glow', h('b', { class: glowClass(id) }, name.slice(0, 3)));
  if (it.kind === 'emblem') return h('span.pg-sw.is-emb', h('b', it.glyph || '◆'));
  if (it.kind === 'flame') return h('span.pg-sw.is-flame', flameIcon('lit', 22));
  if (it.kind === 'tube') return h('span.pg-sw.is-tube', h('i'));
  return h('span.pg-sw.is-favor', h('b', '✦'));
}

let open = null;
/** Close (CONTINUE / the podium leaving). */
export function closeMoment() { if (open) open.close(); }
export const momentOpen = () => !!open;

/**
 * Opens the moment for one outcome (the server's answer for this player — core/progress.js via /api/report). ctx: { game (id), match
 * (tonight's match number), name (for a glow swatch), now } → { el, skip(), close() }
 */
export async function openMoment(o, ctx = {}) {
  if (!o || !o.xp || open) return null;
  await pgSheet();
  pgPrefetch(['xp-tick', 'xp-total', 'level-up', 'medal-flip', 'flame-on', 'achievement']);
  const now = ctx.now || Date.now();
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const R = reduced();
  const game = (GAMES.find(g => g.id === (ctx.game || o.gid)) || { name: '' }).name;
  const pl = placeLine(o);
  const L0 = levelInfo(o.xp.from), L1 = levelInfo(o.xp.to);
  const up = L1.lvl > L0.lvl;
  // (THE VAULT 1B: WHICH level gave an item comes with its display row from the server — `lv` — never a table in the site's code)
  const lvlItems = (o.items || []).filter(id => { const lv = ITEM[id] && ITEM[id].lv; return !!lv && lv > L0.lvl && lv <= L1.lvl; });
  const sv = o.st ? streakView(o.st, streakDay(now)) : null;
  const ach = (o.ach || []).map(id => ACH[id]).filter(Boolean).slice(0, 3);
  const tease = nextRewardLevel(L1.lvl);

  // ---- the panel
  const lines = (o.xp.parts || []).map(p => {
    const v = h('b.pg-v', '+0');
    const row = h('div.pg-line', h('span', p.label), v);
    return { row, v, to: p.v };
  });
  const total = h('b.pg-total-v', `+${num(o.xp.gain)} XP`);
  const md = medal(L0.lvl, 56);
  const had = h('i.pg-bar-had'), got = h('i.pg-bar-got');
  const lvlName = h('b.pg-lv-n', `LEVEL ${L0.lvl}`), lvlNeed = h('span.pg-lv-need', L0.max ? 'THE TOP' : `${num(L0.need)} XP to ${L0.lvl + 1}`);
  const band = h('div.pg-band', h('b', bandOf(L0.lvl).name), h('em', ` · ${bandOf(L0.lvl).line}`));
  const streakRow = sv && sv.n ? h('div.pg-box.pg-streak', { class: sv.full ? 'is-full' : '' },
    flameIcon('waiting', 30),
    h('div.pg-streak-t',
      h('b', `${sv.n} NIGHT STREAK`),
      // (the line only when there's news — won back, a freeze used; otherwise the dots say it: today's lights up)
      h('span', o.sev && o.sev.restored ? 'Won back — the run is yours again' : o.sev && o.sev.frozen && o.sev.frozen.length ? 'A freeze covered the night you missed' : ''),
      h('span.pg-dots', ...sv.week.map(d => h('i', { class: `is-${d.s}`, title: d.day }, DOW[d.wd]))))) : null;
  // (LOBBY FIXES — the owner, Nov 4 2:31 pm: "NEXT UNLOCK AT LEVEL 9". WHAT it is never shows: an item's name reaches only its owner —
  //  THE VAULT 1B's rule, tests/vault-names.test.mjs — so the line alone)
  const teaseRow = tease ? h('div.pg-box.pg-tease', h('b', `NEXT UNLOCK AT LEVEL ${tease}`)) : null;
  const achRows = ach.map(a => h('div.pg-box.pg-ach', { dataset: { id: a.id } },
    itemSwatch(a.item, ctx.name),
    h('div', h('small', 'ACHIEVEMENT'), h('b', a.name), h('span', a.line), h('em.pg-pct', { dataset: { a: a.id } }))));
  // what the match unlocked besides an achievement's own item (the level's rewards — also shown big in the level-up —, the streak's milestones)
  const unlockRows = (o.items || []).filter(id => !ach.some(a => a.item === id) && ITEM[id] && id !== 'card-gilded').slice(0, 2)
    .map(id => h('div.pg-box.pg-unl', itemSwatch(id, ctx.name), h('div', h('small', `UNLOCKED · ${TIER_NAMES[ITEM[id].tier]}`), h('b', ITEM[id].name), h('span', ITEM[id].line), h('em.pg-pct', { dataset: { i: id } }))));
  // (the owner's PROGRESSION A review: the whole moment FITS ONE SCREEN — the first unlock / achievement shows, the rest fold into
  //  "+N MORE" (a tap opens them in place); CONTINUE sits in the flow at the bottom, never pinned)
  const folded = [...unlockRows, ...achRows].slice(1);
  folded.forEach(r => r.classList.add('is-fold'));
  const moreRow = folded.length ? h('button.pg-box.pg-more', { type: 'button', onclick: e => { e.stopPropagation(); moreRow.remove(); folded.forEach(r => { r.classList.remove('is-fold'); r.classList.add('is-in'); }); } }, h('b', `+${folded.length} MORE`)) : null;
  const cont = h('button.pg-btn', { type: 'button', onclick: e => { e.stopPropagation(); if (upShown && !upAck) { ackUp(); return; } close(); } }, 'CONTINUE');
  const panel = h('div.pg-panel', { role: 'dialog', 'aria-label': `${pl.place} — your progress` },
    fanCrown(),
    h('div.pg-kick', [game, ctx.match ? `MATCH ${ctx.match}` : null].filter(Boolean).join(' · ') || 'MATCH COMPLETE'),
    h('h2.pg-place', pl.place),
    h('p.pg-sub', pl.sub),
    h('div.pg-lines', ...lines.map(l => l.row)),
    h('div.pg-total', h('span', 'TOTAL'), total),
    h('div.pg-lv', md, h('div.pg-lv-main', h('div.pg-lv-top', lvlName, lvlNeed), h('div.pg-bar.pg-bar-tube.pg-bar-mo', had, got), band)),
    h('div.pg-extras', streakRow, teaseRow, ...unlockRows, ...achRows, moreRow),
    cont);
  const burst = h('div.pg-burst', { 'aria-hidden': 'true' }, ...Array.from({ length: 22 }, (_, i) => h('i', { style: { '--a': `${(360 / 22) * i + (i % 3) * 5}deg`, '--d': `${70 + (i % 4) * 26}px`, '--s': `${0.5 + (i % 3) * 0.3}` } })));
  const lvUp = up ? levelUpCard(L1, L0, lvlItems, ctx.name) : null;
  // THE LEVEL-UP HOLDS (the owner's review: "I couldn't even read it"): up until a TAP — taps in its first second are ignored (a skip-tap
  // can't throw it away unread), a soft TAP TO CONTINUE after a second; then the score screen finishes from there
  let upShown = false, upAck = !up, upAt = 0, phaseB = null;
  const UP_HOLD_MS = 1000;
  function showUp() {
    if (!lvUp || upShown) return;
    upShown = true; upAt = performance.now();
    lvUp.el.classList.add('is-on', 'is-held'); el.classList.add('is-up');
    setTimeout(() => { if (el.isConnected && !upAck) lvUp.el.classList.add('is-tap'); }, UP_HOLD_MS);
  }
  function ackUp() {
    if (!upShown || upAck) return false;
    if (performance.now() - upAt < UP_HOLD_MS) return true;
    upAck = true;
    lvUp.el.classList.remove('is-on', 'is-held', 'is-tap');
    if (phaseB) { const f = phaseB; phaseB = null; f(); }
    return true;
  }
  const el = h('div.pg-moment', { class: R ? 'is-still' : '', onpointerup: () => { if (upShown && !upAck) { ackUp(); return; } skip(); } }, h('div.pg-veil'), panel, burst, lvUp ? lvUp.el : null);
  document.body.append(el);
  try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch { /* fine */ }

  // the X% lines — filled whenever the server answers
  pctFor().then(P => {
    if (!el.isConnected) return;
    el.querySelectorAll('.pg-pct').forEach(x => { const v = x.dataset.a ? P.a[x.dataset.a] : P.i[x.dataset.i]; x.textContent = pctLine(v); });
  });

  // ---- the end state (a skip, reduced motion)
  let done = false;
  function endState() {
    lines.forEach(l => { l.row.classList.add('is-in'); l.v.textContent = `+${num(l.to)}`; });
    el.classList.add('is-total', 'is-lv', 'is-extras', 'is-end');
    setBar(L1.frac, L1.lvl === L0.lvl ? L0.frac : 0);
    md.querySelectorAll('b').forEach(b => { b.textContent = String(L1.lvl); });
    lvlName.textContent = `LEVEL ${L1.lvl}`;
    lvlNeed.textContent = L1.max ? 'THE TOP' : `${num(L1.need)} XP to ${L1.lvl + 1}`;
    band.replaceChildren(h('b', bandOf(L1.lvl).name), h('em', ` · ${bandOf(L1.lvl).line}`));
    if (streakRow) { streakRow.querySelector('.pg-flame').className = `pg-flame is-lit`; streakRow.classList.add('is-on'); }
    el.querySelectorAll('.pg-box').forEach(b => b.classList.add('is-in'));
    // (a skip lands on the level-up, held — it is never skipped unread)
    if (lvUp && !upAck) showUp();
  }
  function setBar(frac, hadFrac) {
    had.style.transform = `scaleX(${Math.max(0, Math.min(1, hadFrac))})`;
    got.style.transform = `scaleX(${Math.max(0, Math.min(1, frac))})`;
  }
  function skip() {
    if (done) return;
    done = true;
    phaseB = null;
    timers.forEach(clearTimeout);
    endState();
  }
  function close() {
    if (!open || open.el !== el) return;
    skip();
    open = null;
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 320);
    if (ctx.onClose) ctx.onClose();
  }
  open = { el, close, skip, upHeld: () => upShown && !upAck };
  setBar(L0.frac, L0.frac);
  if (R) { skip(); return open; }

  // ---- the timeline
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-on')));
  let t = 420;
  later(() => el.classList.add('is-place'), t);
  t += 520;
  lines.forEach((l, i) => {
    later(() => {
      l.row.classList.add('is-in');
      const t0 = performance.now(), dur = 260;
      const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); l.v.textContent = `+${num(l.to * k)}`; if (k < 1 && !done) requestAnimationFrame(step); };
      requestAnimationFrame(step);
      pgSfx('xp-tick', { rate: 1 + i * 0.04 });
    }, t + i * 280);
  });
  t += lines.length * 280 + 160;
  later(() => { el.classList.add('is-total'); pgSfx('xp-total'); }, t);
  t += 380;
  later(() => { el.classList.add('is-lv'); setBar(up ? 1 : L1.frac, L0.frac); }, t);
  t += 760;
  // THE REST (after the level-up's tap, or straight on): the medal flips, the extras come in
  const rest = (t1) => {
    let t = t1;
    if (up) {
      later(() => {
        md.classList.add('is-flip');
        later(() => { md.querySelectorAll('b').forEach(b => { b.textContent = String(L1.lvl); }); }, 240);   // (edge-on at ~45–55 %)
        lvlName.textContent = `LEVEL ${L1.lvl}`;
        lvlNeed.textContent = L1.max ? 'THE TOP' : `${num(L1.need)} XP to ${L1.lvl + 1}`;
        band.replaceChildren(h('b', bandOf(L1.lvl).name), h('em', ` · ${bandOf(L1.lvl).line}`));
        had.style.transition = 'none'; got.style.transition = 'none'; setBar(0, 0);
        requestAnimationFrame(() => requestAnimationFrame(() => { had.style.transition = ''; got.style.transition = ''; setBar(L1.frac, 0); }));
      }, t);
      t += 520;
    }
    later(() => el.classList.add('is-extras'), t);
    if (streakRow) {
      later(() => { streakRow.classList.add('is-in'); }, t);
      later(() => { streakRow.querySelector('.pg-flame').className = 'pg-flame is-lit is-ignite'; streakRow.classList.add('is-on'); pgSfx('flame-on'); }, t + 220);
      t += 560;
    }
    if (teaseRow) { later(() => teaseRow.classList.add('is-in'), t); t += 300; }
    const shown = [...unlockRows, ...achRows].filter(r => !r.classList.contains('is-fold'));
    shown.forEach(r => { later(() => { r.classList.add('is-in'); pgSfx(achRows.includes(r) ? 'achievement' : 'achievement', { gain: achRows.includes(r) ? 1 : 0.8 }); }, t); t += 450; });
    if (moreRow) { later(() => moreRow.classList.add('is-in'), t); t += 200; }
    later(() => { done = true; el.classList.add('is-end'); }, t + 100);
  };
  if (up) {
    later(() => {
      showUp();
      pgSfx('medal-flip');
      later(() => { pgSfx('level-up'); el.classList.add('is-burst'); vibrate([20, 50, 20, 120]); }, 240);
    }, t);
    // (the takeover waits for its tap; the rest runs from then — ackUp → phaseB)
    phaseB = () => rest(120);
    return open;
  }
  rest(t);
  return open;
}

/** THE LEVEL-UP (mockup 2): the big medal flips to the new number with a burst; its unlocks with their tier + X%. */
function levelUpCard(L1, L0, items, name) {
  const b0 = bandOf(L0.lvl), b1 = bandOf(L1.lvl);
  const nb = BANDS[BANDS.indexOf(b1) + 1];
  const nextBand = b1 !== b0 ? `NEW BAND · ${b1.name}` : nb && nb.from - L1.lvl <= 3 ? `Still ${b1.name} · ${nb.name} is close` : `Still ${b1.name}`;
  const el = h('div.pg-up', { 'aria-live': 'polite' },
    h('span.pg-up-rays', { 'aria-hidden': 'true' }),
    h('small', 'LEVEL UP'),
    medal(L1.lvl, 148),
    h('b.pg-up-n', `LEVEL ${L1.lvl}`),
    h('em', nextBand),
    ...items.slice(0, 2).map(id => h('div.pg-box.pg-unl.is-in', itemSwatch(id, name), h('div', h('small', 'UNLOCKED'), h('b', ITEM[id].name), h('span', `${TIER_NAMES[ITEM[id].tier]} · ${KINDS[ITEM[id].kind]}`), h('em.pg-pct', { dataset: { i: id } })))),
    h('div.pg-up-tap', { 'aria-hidden': 'true' }, 'TAP TO CONTINUE'));
  return { el };
}
