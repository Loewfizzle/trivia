// THE PHASE ACCUMULATOR (SHELL 2.0 B1 — THE RACING CLOUDS; the owner, Nov 5 8:26 am: he reopened last night's tab and the clouds RACED
// across the sky). Anything drawn as SPEED × THE CLOCK (a cloud at x0 + speed(wind) × tSec, the water's drift, the fog's wisps) moves at
// speed + tSec × d(speed)/dt the moment its speed changes — the live weather refreshing after hours away eased the mean wind to a new value,
// and with tSec hours into the city's 6-hour block that was hundreds of points a second.
// A phase keeps the POSITION continuous instead: while the speed holds, p = p0 + s × (t − t0); when it changes at t, p0 takes the value it
// had reached and the new speed runs from there. The FIRST sight starts on the clock's own formula (p = s × t), so two phones that open
// on the same wind still agree; it starts over that way when the clock runs backwards (a new plan / a new block). PURE — no frame dt,
// no Date.now(): the caller's clock (the city's server-time seconds) is the only time it sees.
//   const ph = phaseClock();  ph.at(tSec, speed) → the distance travelled (speed units × seconds)   ph.reset()
export function phaseClock() {
  let t0 = null, p0 = 0, s0 = 0;
  function at(t, s) {
    if (!Number.isFinite(t) || !Number.isFinite(s)) return t0 === null ? 0 : p0 + s0 * ((Number.isFinite(t) ? t : t0) - t0);
    if (t0 === null || t < t0 - 1) { t0 = t; s0 = s; p0 = s * t; }
    else if (s !== s0) { p0 += s0 * (t - t0); t0 = t; s0 = s; }
    return p0 + s0 * (t - t0);
  }
  return { at, reset() { t0 = null; p0 = 0; s0 = 0; } };
}
