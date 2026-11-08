// A RUN KEEPS ITS OWN DAY (DFIX1 — docs/cartridge.md "THE DAILY PLUG-IN", FABLE REVIEW #1 finding 1): a judged daily's every call after
// `start` names the day that start returned, so a run that crosses 4 am Eastern finishes on ITS day (the server takes today's or yesterday's
// when the player has a start there — api/daily.js#dayOfCall). The day is remembered per device while the run is in flight, so a refresh
// across the turn asks for the old run back (the server opens today's once that one is scored). Both judges (THE PASSWORD, COAST CLEAR) use it.
//   const d = runDay('password');   d.asked() → the day a start asks for (or null) · d.started(resp) after a start · d.day() for every call ·
//   d.scored() after a finish
export function runDay(game) {
  const KEY = `daily:run-day:${game}`;
  let day = null;
  const stored = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const keep = d => { try { if (d) localStorage.setItem(KEY, d); else localStorage.removeItem(KEY); } catch { /* fine: the memory copy holds */ } };
  return {
    asked: () => day || stored() || null,
    /** after a start: the run's day; remembered while the run is in flight (no score yet) */
    started(r) { if (r && r.day) day = r.day; keep(r && r.day && r.done == null ? r.day : null); },
    day: () => day,
    /** the run is scored: the next start opens today's */
    scored() { keep(null); },
    /** the call's body with the run's day (none before a start — the server takes today's) */
    with: body => (day ? { ...body, day } : body),
  };
}
