// THE STREAK (PROGRESSION A), PURE — the server keeps it (pstats/{pid}/st, inside the match / daily transaction); screens only read it.
//   THE DAY turns at 4 am EASTERN (late nights count for the evening they started). A COUNTED MATCH keeps it (a daily too, once they exist).
//   FREEZES: the first on streak day 3, then one every 7 more (10, 17, 24 …); hold 2; used AUTOMATICALLY on a missed day.
//   WIN IT BACK: a broken streak comes back with 3 plays within 3 days of coming back (back within 3 days of the break) — once a month.
//   THE OUTAGE: a day the owner marks in /admin (the site was down) breaks nobody's streak (it doesn't add a day either; no freeze used).
//   MILESTONES (cosmetic — NO XP): 3 FULL NEON · 7 a name glow · 14 a tube style · 30 THE 30-NIGHT FLAME · 50 an emblem shape ·
//   100 a rare card + a FAVOR · 200 + 365 legendary cards.
//
//   st = { n (the run, days played), d ('d20261102' — the last day played), b (best), f (freezes held), fn (the run length that earns the
//          next freeze), h { day: 1 played · 2 frozen · 3 outage · 4 won back } (the last 15 days), w (a WIN IT BACK in progress:
//          { n: the run lost, B: the break day, s: the day they came back, k: plays so far }) | null, wm ('m202611' — the month one was won back) }
import { dayKey } from './week.js';

export const DAY_TURN_H = 4;
export const FREEZE = { first: 3, every: 7, hold: 2 };
export const WIN_BACK = { plays: 3, days: 3 };
export const MILESTONES = [
  { n: 3, items: ['flame-full'] },
  { n: 7, items: ['glow-afterglow'] },
  { n: 14, items: ['tube-ember'] },
  { n: 30, items: ['card-flame30'] },
  { n: 50, items: ['emb-torch'] },
  { n: 100, items: ['card-century', 'favor'], favor: 1 },
  { n: 200, items: ['card-wildfire'] },
  { n: 365, items: ['card-eternal'] },
];
const KEEP_DAYS = 15;

/** The streak day of an instant: the Eastern date, turning at 4 am ('d20261102' from Nov 2 4:00 am to Nov 3 3:59 am). */
export const streakDay = ms => dayKey(ms - DAY_TURN_H * 3600_000);
/** 'd20261102' ↔ a day number (days since 1970) — plain calendar arithmetic. */
export const dayNum = dk => { const s = String(dk); return Math.round(Date.UTC(+s.slice(1, 5), +s.slice(5, 7) - 1, +s.slice(7, 9)) / 864e5); };
export const dayOf = num => { const d = new Date(num * 864e5); const p = x => String(x).padStart(2, '0'); return `d${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}`; };
const monthOf = dk => `m${String(dk).slice(1, 7)}`;
/** The weekday of a streak day (0 = Monday … 6 = Sunday). */
export const weekdayOf = dk => (new Date(dayNum(dk) * 864e5).getUTCDay() + 6) % 7;

function prune(h, today) {
  const t = dayNum(today), out = {};
  for (const [k, v] of Object.entries(h || {})) if (t - dayNum(k) < KEEP_DAYS) out[k] = v;
  return out;
}
const milestonesBetween = (a, b) => MILESTONES.filter(m => m.n > a && m.n <= b);

/**
 * One play (a counted match / a daily) on streak day `day`. outage: a Set (or object) of outage day keys.
 * → { st, ev: { first (the day's first play), frozen [days], outage [days], broke: { lost } | null, offer (a WIN IT BACK began),
 *     restored: { n } | null, freezes (earned), milestones [{ n, items, favor? }] } }
 */
export function streakPlay(st0, day, outage = null) {
  const isOut = d => !!outage && (outage instanceof Set ? outage.has(d) : !!outage[d]);
  const ev = { first: false, frozen: [], outage: [], broke: null, offer: false, restored: null, freezes: 0, milestones: [] };
  const s = st0 && st0.d ? { n: st0.n || 1, d: st0.d, b: st0.b || st0.n || 1, f: st0.f || 0, fn: st0.fn || FREEZE.first, h: { ...(st0.h || {}) }, w: st0.w || null, wm: st0.wm || null } : null;
  const D = dayNum(day);
  if (!s) {
    const st = { n: 1, d: day, b: 1, f: 0, fn: FREEZE.first, h: { [day]: 1 }, w: null, wm: null };
    ev.first = true;
    return { st, ev };
  }
  const L = dayNum(s.d);
  if (D < L) return { st: s, ev };                                   // a clock from the past: nothing changes
  const prevN = s.n;
  if (D === L) {
    // the same day: only a WIN IT BACK counts plays
    if (s.w) winBackPlay(s, D, ev);
    return finish(s, prevN, day, ev);
  }
  ev.first = true;
  // the days missed between: outage days are free, then freezes, then the break
  let brokeAt = null;
  for (let m = L + 1; m < D; m++) {
    const mk = dayOf(m);
    if (isOut(mk)) { s.h[mk] = 3; ev.outage.push(mk); continue; }
    if (s.f > 0) { s.f--; s.h[mk] = 2; ev.frozen.push(mk); continue; }
    brokeAt = m; break;
  }
  if (s.w && D > s.w.s + WIN_BACK.days - 1) s.w = null;             // a WIN IT BACK that ran out of days
  if (brokeAt != null) {
    ev.broke = { lost: s.n };
    // back within 3 days of the break, and none won back this month → the offer (this play is its first)
    const offer = D - brokeAt <= WIN_BACK.days - 1 && s.wm !== monthOf(day) && s.n >= 2;
    s.w = offer ? { n: s.n, B: dayOf(brokeAt), s: D, k: 0 } : null;
    s.n = 1; s.f = 0; s.fn = FREEZE.first;
    ev.offer = offer;
    if (s.w) winBackPlay(s, D, ev);
  } else {
    s.n += 1;
    if (s.w) winBackPlay(s, D, ev);
  }
  s.d = day;
  s.h[day] = 1;
  return finish(s, prevN, day, ev);
}

function winBackPlay(s, D, ev) {
  const w = s.w;
  if (D > w.s + WIN_BACK.days - 1) { s.w = null; return; }
  w.k = (w.k || 0) + 1;
  if (w.k >= WIN_BACK.plays) {
    // restored: the lost run + the days played since (the gap counted as won back)
    for (let m = dayNum(w.B); m < w.s; m++) { const mk = dayOf(m); if (!s.h[mk]) s.h[mk] = 4; }
    s.n = w.n + s.n;
    s.wm = monthOf(dayOf(D));
    ev.restored = { n: s.n };
    s.w = null;
  }
}

function finish(s, prevN, day, ev) {
  if (!s.h[day]) s.h[day] = 1;
  while (s.n >= s.fn) { if (s.f < FREEZE.hold) { s.f++; ev.freezes++; } s.fn += FREEZE.every; }
  s.b = Math.max(s.b || 0, s.n);
  // milestones: the run passing them (a WIN IT BACK can pass several at once); a broken run starting over passes nothing new it had
  ev.milestones = milestonesBetween(ev.broke ? 0 : prevN, s.n).filter(m => !(ev.broke && m.n <= 1));
  s.h = prune(s.h, day);
  return { st: s, ev };
}

/**
 * The streak as it looks NOW (the screens; nothing is written): today = streakDay(now).
 * → { n, best, state: 'lit' (played today) | 'waiting' (not yet today — still alive) | 'frozen' (alive, a freeze will cover / covered a
 *     missed day) | 'out', freezes, full (3+ — full neon), week [{ day, wd, s: 'played'|'frozen'|'outage'|'won'|'missed'|'today'|'future' }]
 *     (Monday → Sunday of this week), winBack: { need, have, until (day key) } | null, nextMilestone }
 */
export function streakView(st, today, outage = null) {
  const isOut = d => !!outage && (outage instanceof Set ? outage.has(d) : !!outage[d]);
  const T = dayNum(today);
  const s = st && st.d ? st : null;
  let state = 'out', n = 0, freezes = s ? s.f || 0 : 0, winBack = null;
  const h = { ...((s && s.h) || {}) };
  if (s) {
    const L = dayNum(s.d);
    if (L === T) { state = 'lit'; n = s.n; }
    else if (L > T) { state = 'lit'; n = s.n; }
    else {
      let need = 0, broken = false;
      for (let m = L + 1; m < T; m++) { const mk = dayOf(m); if (isOut(mk)) { h[mk] = 3; continue; } need++; if (need <= freezes) h[mk] = 2; else { broken = true; break; } }
      if (!broken) { state = need ? 'frozen' : 'waiting'; n = s.n; freezes -= need; }
      else {
        state = 'out'; n = 0; freezes = 0;
        let brokeAt = L + 1; for (let m = L + 1, k = 0; m < T; m++) { if (isOut(dayOf(m))) continue; if (k++ >= (s.f || 0)) { brokeAt = m; break; } }
        if (T - brokeAt <= WIN_BACK.days - 1 && s.wm !== monthOf(today) && s.n >= 2) winBack = { need: WIN_BACK.plays, have: 0, until: dayOf(T + WIN_BACK.days - 1), lost: s.n };
      }
    }
    if (s.w && T <= s.w.s + WIN_BACK.days - 1) winBack = { need: WIN_BACK.plays, have: s.w.k || 0, until: dayOf(s.w.s + WIN_BACK.days - 1), lost: s.w.n };
  }
  const wd = weekdayOf(today), mon = T - wd;
  const KIND = { 1: 'played', 2: 'frozen', 3: 'outage', 4: 'won' };
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = dayOf(mon + i);
    const k = h[d] ? KIND[h[d]] : mon + i === T ? 'today' : mon + i > T ? 'future' : 'missed';
    return { day: d, wd: i, s: k };
  });
  const next = MILESTONES.find(m => m.n > n);
  return { n, best: s ? Math.max(s.b || 0, s.n || 0) : 0, state, freezes: Math.max(0, freezes), full: n >= 3, week, winBack, nextMilestone: next ? next.n : null };
}
