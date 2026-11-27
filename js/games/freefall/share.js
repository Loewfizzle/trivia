// FREEFALL — SHARE in the cartridge (F4B — docs/freefall.md "THE SHARE CARD"; F5B — SHARE = THE PICTURE ONLY): the run's card (card.js —
// the drawing, shared with the test page) from THE JUDGE's own numbers + this phone's staged frame of the run (shot.js), DRAWN + ENCODED
// while the end screen is read (warmShare — final.js); the tap hands the phone's share sheet EXACTLY ONE PNG file (send.js): no text, no
// title, no link, nothing uploaded (F5B: the link upload at the tap was what lost the picture on the owner's iPhone). Solo + match alike.
// Lazy (index.js#shareRun + final.js): the cartridge's start bundle never carries it.
import { state as live } from '../../store.js';
import { gameStandings, seedOf } from './logic.js';
import { shotFor } from './shot.js';
import { cardFor } from './card.js';
import { prepPicture } from './send.js';
export * from './card.js';

const whole = n => Math.max(0, Math.floor(Number(n) || 0));

/** PURE: this player's run in the game's results — THE JUDGE's rows (director.js#scoreNode: f floors · bl blazes · w how it ended · go)
 *  + the MATCH line's numbers: their place in the game's standings, of how many players */
export function runOf(game, uid) {
  const r = ((game && game.results) || {})[uid] || {}, solo = !game || game.mode === 'solo';
  const st = solo ? [] : gameStandings(game), me = st.find(s => s.uid === uid);
  return { floor: whole(r.f), blazes: whole(r.bl), cause: String(r.w || ''), made: r.w === 'made', mode: solo ? 'solo' : 'match', place: me ? me.rank : 0, of: st.length, go: Number(r.go) || 0 };
}
let held = null;   // { m, prep } — ONE match's picture at a time on this phone
function prepRun(game, state) {
  const m = game && game.matchId, uid = state && state.uid, code = state && state.code;
  if (held && held.m === m) return held;
  const me = (state && state.players && state.players[uid]) || {};
  const prep = prepPicture(async () => {
    if (!(live.game && live.game.matchId === m)) return null;
    // (the numbers = THE JUDGE's — the host's result rows: the podium's; the picture = this phone's own STAGED frame of the run — kept under
    //  the match's id by the cartridge's stage, else under the run's seed: logic.js#seedOf of its GO)
    const run = runOf(game, uid), shot = shotFor(m) || (run.go ? shotFor(seedOf(code, m, run.go)) : null);
    return cardFor({ ...run, name: me.name }, shot);
  });
  held = { m, prep };
  return held;
}
/** the end screen is up: the card is DRAWN + ENCODED (its PNG kept on the phone) — the tap has nothing left to wait for */
export function warmShare(game, state) { try { prepRun(game, state).prep.warm(); } catch { /* the tap builds it */ } }
/** SHARE → 'shared' | 'none' | 'shown' | 'busy' | 'failed' — THE PICTURE ALONE (the share sheet in the tap's own turn once it is ready) */
export function shareRun(game, state) { return prepRun(game, state).prep.send(); }
