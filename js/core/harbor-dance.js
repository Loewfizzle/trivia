// CITY 2.0 — THE DANCE CLOCK (PURE; SP5 — the owner: when the song switched the dancers JITTERED — a snap as their beat clock re-aligned —
// and kept dancing at full speed through the gap). Every dancer in the city (the window party, the promenade's circle) reads THIS clock,
// not the beat's raw grid:
//   bf     the dancers' beat count — it follows the song's grid, but every change of PHASE or TEMPO is BLENDED (the offset to the grid
//          closes over ~BLEND_S, the rate eases over ~1 s): a new song's grid never snaps them. Without a song it free-runs at its last rate.
//   dk     their ENERGY 0..1: 1 on a song; WINDING DOWN over the song's last WIND_S seconds (the moves slow + soften); 0 in the GAP
//          between songs (they idle: sway, shift weight, turn to each other, a clap, a sip); PICKING UP over ~PICK_S once the new song
//          starts. Music off / no music at all is NOT a gap (the city dances on its own calm beat as before).
//   cheer  1 → 0 over CHEER_S from the moment a song ends — a little cheer between songs.
// tests/harbor-dance.test.mjs.
export const BLEND_S = 0.5, RATE_S = 1.0, WIND_S = 8, PICK_S = 1.2, CHEER_S = 2.2, CALM_RATE = 2;   // (120 bpm = 2 beats / s)

export function createDanceClock() { return { bf: 0, rate: CALM_RATE, dk: 1, idle: 0, gap: 0, id: null, cheer: 0, cheerAt: null, t: 0, init: false, lastT: null }; }

/**
 * step(D, dt, beat) → D (mutated). beat = { beatsF (the city's beat count), gap (true: the music is on but between songs), left (seconds
 * to the song's end | null), id (the song) } | null (no beat at all: the clock free-runs, the energy full — the city's own beat).
 */
export function stepDanceClock(D, dt, beat) {
  dt = Math.max(0, Math.min(0.25, dt || 0));
  const has = !!(beat && beat.beatsF != null && !beat.gap), gap = !!(beat && beat.gap);
  const target = has ? beat.beatsF : D.bf + D.rate * dt;
  if (!D.init) { D.bf = target; D.init = true; D.id = has ? beat.id || null : null; D.lastT = has ? beat.beatsF : null; D.t += dt; return D; }
  // the tempo: the grid's advance per second, eased over RATE_S (a new song's tempo comes in smoothly)
  if (has && D.lastT != null && dt > 0) { const adv = (beat.beatsF - D.lastT) / dt; if (adv > 0 && adv < 12) D.rate += (adv - D.rate) * Math.min(1, dt / RATE_S); }
  D.lastT = has ? beat.beatsF : null;
  // the phase: the clock advances at its own rate and closes the offset to the grid over BLEND_S — never a snap
  D.bf += D.rate * dt;
  // (the offset IN THE BAR — mod 4 beats: a new song's count starts from 0 again, but only the phase + the downbeat matter to a dancer)
  const off = ((target - D.bf) % 4 + 6) % 4 - 2;
  D.bf += off * Math.min(1, dt / BLEND_S);
  // the energy
  const want = gap ? 0 : !has ? 1 : beat.left != null && beat.left < WIND_S ? Math.max(0, beat.left / WIND_S) : 1;
  const up = want > D.dk, dmax = dt / (up ? PICK_S : 0.6);   // (a rate limit: the pick-up takes PICK_S, a wind-down follows its song)
  D.dk += Math.sign(want - D.dk) * Math.min(Math.abs(want - D.dk), dmax);
  if (has && beat.id && beat.id !== D.id) D.id = beat.id;
  if (gap && D.gap === 0) D.cheerAt = D.t;
  D.gap = gap ? 1 : 0;
  D.cheer = D.cheerAt != null && D.t - D.cheerAt < CHEER_S ? 1 - (D.t - D.cheerAt) / CHEER_S : 0;
  D.idle = 1 - D.dk;
  D.t += dt;
  return D;
}

/** THE IDLE MOVES (0..1 each, from the clock's time + a dancer's seed): a slow sway, a weight shift, a turn to a neighbour, a clap now and
 *  then, a sip — the painters scale them by (1 − dk) */
export function idleMoves(t, seed = 0) {
  const sway = Math.sin(t * 1.1 + seed * 1.7), shift = Math.sin(t * 0.37 + seed * 0.9);
  const per = 5.5 + (seed % 7) * 0.6, ph = ((t + seed * 1.3) % per) / per;
  const clap = ph < 0.18 ? Math.sin(Math.PI * ph / 0.18) : 0;                       // (a clap early in each cycle)
  const sip = ph > 0.55 && ph < 0.8 ? Math.sin(Math.PI * (ph - 0.55) / 0.25) : 0;   // (a sip later)
  const turn = Math.sin(t * 0.23 + seed * 2.1);                                      // (facing: toward a neighbour and back)
  return { sway, shift, clap: seed % 3 === 0 ? clap : 0, sip: seed % 3 === 1 ? sip : 0, turn };
}
