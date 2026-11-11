// HOLD'EM — THE SOUNDS' PLAN (HE5 — docs/holdem.md "THE SOUNDS"), PURE: the motion's own timeline (motion-plan.js#schedule — the dealer's
// FRESH events this phone hasn't shown: never a replay after a refresh, a rejoin or a sleep) → the cues to play, each landing with its
// animation. No DOM, no clock, no randomness of its own (`rng` comes in — the deals' variety). sfx.js plays them; the view adds the
// sounds that come from YOUR screen, not an event: YOUR TURN, the last-5-seconds TICK, the CHAMPION on the podium.
//   a new hand → shuffle · each card dealt → deal (≥ 110 ms apart, rate 1 ± 4 %, volume 0.85–1.0) · each board card + your own flip → flip ·
//   fold → fold · check → check · a blind / call / bet → chip-bet · raise → chip-raise · all in → all-in · a pot (or side pot) awarded →
//   pot-win (+ hand-win when YOU win it — once a run) · your REBUY → chip-stack · the showdown's reveal → showdown · anyone OUT → knockout ·
//   a new blind level → blinds-up
import { BEAT } from './motion-plan.js';
import { DEAL_VARY } from './sfx.js';

/** the deals never closer than this (ms) — each its own sound */
export const DEAL_MIN_GAP = 110;

/**
 * steps = schedule(...)'s timeline; ctx: { me (your uid), rng () → [0, 1) }. → [{ name, at, rate?, vol? }] sorted by `at` (ms from now).
 */
export function soundPlan(steps, { me = null, rng } = {}) {
  const r = typeof rng === 'function' ? rng : () => 0.5;
  const cues = [];
  const add = (name, at, extra) => cues.push({ name, at: Math.max(0, Math.round(at)), ...extra });
  let showdown = false, iWon = false, ko = false;
  for (const s of steps || []) {
    switch (s.kind) {
      case 'deal': {
        add('shuffle', s.at - BEAT.dealLead);
        const n = (s.ids || []).length, gap = Math.max(DEAL_MIN_GAP, BEAT.dealGap);
        for (let k = 0; k < 2 * n; k++) {
          add('deal', s.at + k * gap + BEAT.dealFly * 0.8, {
            rate: +(1 + (r() * 2 - 1) * DEAL_VARY.rate).toFixed(3),
            vol: +(DEAL_VARY.vol[0] + r() * (DEAL_VARY.vol[1] - DEAL_VARY.vol[0])).toFixed(3),
          });
        }
        break;
      }
      case 'heroFlip': add('flip', s.at); break;
      case 'chip': {
        const name = s.allin ? 'all-in' : s.t === 'raised' ? 'chip-raise' : 'chip-bet';
        add(name, s.at + BEAT.chip * 0.75);   // (the chip lands — HE10 (A42): the blinds at the approved gain, no unapproved 0.75)
        break;
      }
      case 'check': add('check', s.at); break;
      case 'fold': add('fold', s.at); break;
      case 'board': add('flip', s.at); break;
      case 'shown':
        if (s.choice) add('flip', s.at);
        else if (!showdown) { showdown = true; add('showdown', s.at); }
        break;
      case 'award': {
        add('pot-win', s.at + 120);
        if (!iWon && me && ((s.pot && s.pot.winners) || []).some(w => w.id === me)) { iWon = true; add('hand-win', s.at + 120); }
        break;
      }
      case 'rebuy': if (s.id === me) add('chip-stack', s.at); break;
      case 'out': if (!ko) { ko = true; add('knockout', s.at + 300); } break;   // (HE10 — A35: ONE knockout a run — several busts at once never stack the sting)
      case 'level': add('blinds-up', s.at); break;
      default: break;
    }
  }
  return cues.sort((a, b) => a.at - b.at);
}

/**
 * THE TICK (the last 5 s of YOUR clock — the shot clock, then your time bank): which second to tick now, or 0. `left` = ms until your
 * turn's FINAL deadline (the bank included); a tick once per whole second 5 → 1.
 */
export function tickSecond(left) {
  if (!(left > 0) || left > 5000) return 0;
  return Math.ceil(left / 1000);
}
