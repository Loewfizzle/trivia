// JAYWALK J2 — THE SOUND RULE for THE BLACKBIRD's runways (docs/jaywalk.md "THE SOUND RULE"; the owner, Nov 21). PURE: no imports, no
// DOM, no clock of its own — flyers.js hands it the frame's time + where the kid is; it answers WHICH sound, never plays one.
//   · THE CRACKLE (the radio — "incoming"): only when a runway is within REACH lanes ahead of YOUR kid (or under him), ONCE per runway
//     visit, never within COOL_MS of the last one, the three takes in rotation (never the same twice running).
//   · THE REPEAT TELLS while he waits at / on that runway: its lights (always — the view) + a soft TICK at most, never the crackle again.
//   · EVERY JET PASS keeps its full scream + boom, FADED BY DISTANCE (loud next to him, quieter a few lanes off, off-screen = silent); the
//     burning trail's fire flicker the same, under the boom.
// The warning stays VISUAL (the lights race in every tell, the trail burns on the road): fair with the sound off.

export const RS = Object.freeze({
  reach: 3,                 // (lanes AHEAD of the kid a runway's first lane may be for a visit to begin — or he is on it)
  leave: 2,                 // (… the visit ends once he is this many lanes past its last lane, or back below its reach by this many)
  coolMs: 8000,             // (the crackle never twice within this)
  takes: Object.freeze(['radio-static_1', 'radio-static_2', 'radio-static_3']),
  far: 8,                   // (a jet this many lanes away or more is silent — the screen shows ≈ 3 behind … 10 ahead)
  fall: 0.75,               // (each lane past the next one keeps this share of the level)
});

/** a pass's level by its lane's distance from the kid (lanes): 1 next to him (0 – 1 lanes) → × RS.fall a lane → 0 from RS.far, or off-screen */
export function distGain(d, onScreen = true) {
  const a = Math.abs(d);
  if (!onScreen || !(a < RS.far)) return 0;
  return a <= 1 ? 1 : Math.pow(RS.fall, a - 1);
}

/**
 * THE EARS — one per scene (this phone's own living kid). Each frame: `see(y0, n)` for every runway drawn, then `frame(now, kidLane)`
 * (a visit begins / ends). A lane's tell beginning: `tell(y0, now)` → 'crackle' (play `take()`) | 'tick' | '' — a runway being
 * visited ticks once its visit has crackled (or its cooldown kept the crackle away); a runway not visited says nothing (its jet still
 * screams + booms at its distance).
 */
export function createRunwayEars() {
  const seen = new Map();           // y0 → n (the runways drawn this frame)
  let visit = null, lastAt = -1e12, take = -1, owed = false;   // (visit: { y0, n, cracked } · owed: a visit began, its crackle waits for its first tell)
  const inReach = (y0, n, k) => k >= y0 - RS.reach && k < y0 + n;
  return {
    see(y0, n) { seen.set(y0, n); },
    /** the frame's end: a visit begins / ends by where the kid is (his lane, a cell number — the lane he stands on) */
    frame(now, kidLane) {
      const k = Math.floor(kidLane);
      if (visit && (k >= visit.y0 + visit.n + RS.leave || k < visit.y0 - RS.reach - RS.leave)) visit = null;
      if (!visit) {
        for (const [y0, n] of seen) if (inReach(y0, n, k)) { visit = { y0, n, cracked: false }; owed = true; break; }
      }
      seen.clear();
    },
    /** a lane of runway `y0` began its tell at `now` → what it sounds like for this kid */
    tell(y0, now) {
      if (!visit || visit.y0 !== y0) return '';
      if (owed && !visit.cracked) {
        owed = false; visit.cracked = true;
        if (now - lastAt >= RS.coolMs) { lastAt = now; take = (take + 1) % RS.takes.length; return 'crackle'; }
        return 'tick';
      }
      return 'tick';
    },
    /** the crackle take tell() just picked (rotating — never the same twice in a row) */
    take: () => RS.takes[Math.max(0, take)],
    /** a new run / the scene resting: no visit (the cooldown + the rotation carry on) */
    reset() { visit = null; owed = false; seen.clear(); },
    state: () => ({ visit: visit ? { ...visit } : null, lastAt, take }),
  };
}
