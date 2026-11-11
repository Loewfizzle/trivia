// HOLD'EM — THE MOTION's PLAN (HE4 — docs/holdem.md "THE MOTION"), PURE: which of the dealer's events this phone has NOT shown yet, and
// the timeline they play as. No DOM, no clock (`now` comes in = serverNow()). The view (motion.js) only runs what this returns.
//   ANIMATIONS COME FROM THE STATE: a phone animates only events numbered after the last one it showed (`ev[].n`), only while they are
//   FRESH (≤ MAX_AGE_MS old) and only when it has the whole run of them (no gap) — a refresh, a rejoin or a phone that slept jumps straight
//   to the current state (the view paints the state first; the motion only plays over it). NOTHING here can hold the table up: the dealer's
//   pauses (HE2: 3 s after a fold-win, 6 s after a showdown) run on the server whatever a phone shows.
// tests/holdem-motion.test.mjs.

/** an event older than this (the server's clock) is history — never animated */
export const MAX_AGE_MS = 2500;
/** the beats (ms) — every one ≤ ~0.5 s; the side-pot awards one after the other */
export const BEAT = {
  // the deal (HE5 — THE SOUNDS): the shuffle first (dealLead), then a card every 110 ms (each its own sound — never smeared), each flies
  // 260 ms; your two flip 60 ms after the last lands (HE4: 45 ms a card, no lead)
  dealLead: 450, dealGap: 110, dealFly: 260, heroFlip: 60, flip: 320,
  chip: 260, chipGap: 110,                                 // a bet's chip seat → its spot; several in one batch one after the other
  sweep: 380,                                              // the bets swept into the pot together
  boardGap: 90,                                            // the flop's three flip 90 ms apart
  shownGap: 60,                                            // the showdown's hands turn up 60 ms apart
  award: 450, awardGap: 900,                               // a pot's chips fly to its winner(s) in 450 ms; the next pot 900 ms later
  fold: 340, toast: 2400, headsUp: 1600, ko: 4000,
};

/**
 * The events to animate: numbered after `seen`, all present (no gap), the newest ≤ MAX_AGE_MS old. → { list, seen } — `seen` = the newest
 * number either way (a stale or gapped run is skipped whole: the state already shows its end). `seen` null = the first look (a mount /
 * refresh): nothing animates.
 */
export function freshEvents(ev, seen, now, maxAge = MAX_AGE_MS) {
  const list = (Array.isArray(ev) ? ev : []).filter(e => e && Number.isFinite(e.n)).sort((a, b) => a.n - b.n);
  const top = list.length ? list[list.length - 1].n : (seen ?? 0);
  if (seen == null) return { list: [], seen: top };
  const fresh = list.filter(e => e.n > seen);
  if (!fresh.length) return { list: [], seen: Math.max(seen, top) };
  const gap = fresh[0].n !== seen + 1;
  const stale = !(now - (fresh[fresh.length - 1].at || 0) <= maxAge);
  return { list: gap || stale ? [] : fresh, seen: top };
}

/** THE AWARD ORDER: the side pots one at a time, the smallest first, the main pot (pot 0) last. */
export function awardOrder(pots) {
  const main = pots.filter(p => !p.side && !(p.pot > 0)), sides = pots.filter(p => p.side || p.pot > 0);
  return [...sides.sort((a, b) => (a.amount - b.amount) || (b.pot - a.pot)), ...main];
}

const fmt = n => Math.round(n || 0).toLocaleString('en-US');
/**
 * A pot's line while it's awarded: "SIDE POT · 1,320 → BO" · "MAIN POT · 2,400 → ALEX" (when there were side pots) · "POT · 90 → BO" ·
 * a split "POT · 2,400 → ALEX & BO" (3+: "→ 3 WAY"). `name(id)` = the player's name.
 */
export function awardLine(p, name, hasSides) {
  const ws = (p.winners || []).map(w => w.id);
  const kind = p.side || p.pot > 0 ? 'SIDE POT' : hasSides ? 'MAIN POT' : 'POT';
  const to = ws.length > 2 ? `${ws.length} WAY` : ws.map(name).join(' & ');
  return `${kind} · ${fmt(p.amount)} → ${to}`;
}
/** the gold line over it: the winning hand ("STRAIGHT · SEVEN HIGH"), a tie "SPLIT POT", a fold-win nothing */
export function winLine(p) {
  if (!p || p.byFold) return '';
  if ((p.winners || []).length > 1) return 'SPLIT POT';
  return p.label || '';
}

/**
 * THE TIMELINE for a run of fresh events. ctx: { bets: { id: bet } (the bets in front of the seats on the table this phone last showed),
 * me, heroId, k (the opponents drawn before this run) }. → [{ at, kind, … }] (ms from now), in time order:
 *   chip { id, amount, allin, t }   a bet / call / raise / blind / all in (t = the dealer's event — HE5: which chip sound): a chip seat → its spot (+ allin → the tag's stamp)
 *   deal { ids, button, heads }  the deal (its own stagger inside: BEAT.dealGap a card, round by round — BEAT.dealLead after the hand's start:
 *                                the shuffle)   heroFlip { }  your two turn up
 *   check { id } · rebuy { id }   HE5: no motion — THE SOUNDS only (sound-plan.js)
 *   sweep { from: [{ id, amount }] }   every bet in front → the pot (the pot number rolls up)
 *   board { i, card }            a board card flips in (the flop three BEAT.boardGap apart)
 *   fold { id }                  the seat's backs slide to the middle + fade
 *   shown { id, choice }         a hand turns face up (a showdown, a run-out, a fold-win's SHOW)
 *   award { pot, i, of }         one pot's chips → its winner(s), its line + its winners' five lifted (the side pots first, the main last)
 *   back { id, amount }          an uncalled bet returns to its seat
 *   level { sb, bb }             BLINDS UP · sb/bb, under the level line       headsUp { }   the table got down to two
 *   out { id, place, by }        a seat busts (the KO card when it's you — after the awards)
 */
export function schedule(list, ctx = {}) {
  const steps = [];
  let t = 0;
  let pending = { ...(ctx.bets || {}) };
  const anyPending = () => Object.values(pending).some(v => v > 0);
  const sweep = () => {
    const from = Object.entries(pending).filter(([, v]) => v > 0).map(([id, amount]) => ({ id, amount }));
    if (!from.length) return false;
    steps.push({ at: t, kind: 'sweep', from });
    pending = {};
    t += BEAT.sweep;
    return true;
  };
  let shownAt = null, potsDone = false;
  const pots = list.filter(e => e.t === 'pot');
  for (const e of list) {
    switch (e.t) {
      case 'dealt': {
        pending = {};
        const n = (e.ids || []).length;
        steps.push({ at: t + BEAT.dealLead, kind: 'deal', ids: e.ids || [], button: e.button, heads: !!e.heads });
        if (e.heads && (ctx.k == null || ctx.k > 1)) steps.push({ at: t, kind: 'headsUp' });
        if ((e.ids || []).includes(ctx.heroId)) steps.push({ at: t + BEAT.dealLead + 2 * n * BEAT.dealGap + BEAT.dealFly + BEAT.heroFlip, kind: 'heroFlip' });
        break;   // (the blinds' chips fly alongside the deal — the cursor stays)
      }
      case 'posted': case 'called': case 'bet': case 'raised': case 'allin': {
        const amount = e.amount || 0;
        if (e.t === 'posted') pending[e.id] = (pending[e.id] || 0) + amount;
        else pending[e.id] = e.to != null ? e.to : (pending[e.id] || 0) + amount;
        if (amount > 0 || e.t === 'allin') { steps.push({ at: t, kind: 'chip', id: e.id, amount, allin: e.t === 'allin' || !!e.allin, t: e.t }); t += BEAT.chipGap; }
        break;
      }
      case 'folded': steps.push({ at: t, kind: 'fold', id: e.id }); t += 80; break;
      case 'checked': steps.push({ at: t, kind: 'check', id: e.id }); t += 80; break;
      case 'rebuy': steps.push({ at: t, kind: 'rebuy', id: e.id }); break;
      case 'returned': steps.push({ at: t, kind: 'back', id: e.id, amount: e.amount || 0 }); if (pending[e.id]) pending[e.id] = Math.max(0, pending[e.id] - (e.amount || 0)); break;
      case 'street': {
        if (anyPending()) sweep();
        (e.cards || []).forEach((card, j) => steps.push({ at: t + j * BEAT.boardGap, kind: 'board', i: (e.board || []).length - (e.cards || []).length + j, card }));
        t += Math.max(0, (e.cards || []).length - 1) * BEAT.boardGap + BEAT.flip;
        break;
      }
      case 'shown': {
        if (shownAt == null) { if (anyPending()) sweep(); shownAt = t; }
        steps.push({ at: t, kind: 'shown', id: e.id, choice: !!e.byChoice });
        t += BEAT.shownGap;
        break;
      }
      case 'pot': {
        if (potsDone) break;
        potsDone = true;
        if (anyPending()) sweep();
        if (shownAt != null) t = Math.max(t, shownAt + BEAT.flip);
        const order = awardOrder(pots);
        order.forEach((p, i) => steps.push({ at: t + i * BEAT.awardGap, kind: 'award', pot: p, i, of: order.length }));
        t += (order.length - 1) * BEAT.awardGap + BEAT.award;
        break;
      }
      case 'level': steps.push({ at: 0, kind: 'level', sb: e.sb, bb: e.bb }); break;
      case 'out': steps.push({ at: t, kind: 'out', id: e.id, place: e.place, by: e.by }); break;
      default: break;
    }
  }
  return steps.sort((a, b) => a.at - b.at);
}

/** What the awards still to come hold back (so the stacks + the pot roll up as each lands): { stack: { id: chips }, pot } */
export function holdsOf(steps) {
  const stack = {};
  let pot = 0;
  for (const s of steps) {
    if (s.kind !== 'award') continue;
    pot += s.pot.amount || 0;
    for (const w of s.pot.winners || []) stack[w.id] = (stack[w.id] || 0) + (w.amount || 0);
  }
  return { stack, pot };
}

/**
 * THE SEATS DRAWN (HE4): every seat but one that went OUT in an earlier hand — a seat busted THIS hand stays (its OUT, its fade) until
 * the next deal, when the table re-spreads (never mid-hand). `places` = the match's [{ id, place, hand }].
 */
export function drawnSeats(seats, table, places) {
  const outHand = new Map((places || []).map(p => [p.id, p.hand]));
  return (seats || []).filter(x => x && (x.status !== 'out' || (outHand.has(x.id) && outHand.get(x.id) === (table && table.hand) && table.street === 'done')));
}

/** The winning five of a pot's winners (on the board + in their hands) — the showdown lifts them. best(id) = that seat's best five. → Set */
export function winningCards(pot, best) {
  const out = new Set();
  for (const w of (pot && pot.winners) || []) for (const c of best(w.id) || []) out.add(c);
  return out;
}
