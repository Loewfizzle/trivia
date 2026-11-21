// THE CONSOLE FIX — THE RUN HOLD, the cartridge half (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST").
// JAYWALK's + HIGH RISE's screens share it. A MODIFIED host wrote `final` (or moved the room on) while honest runs were LIVE — every phone
// left its run for the podium / the room, he played on and won. Now:
//   · A LIVE RUN IS PLAYED OUT: a phone whose own PROVEN run is live never shows the podium, and tells the router it holds the run
//     (`holdsRun` — app.js's RUN HOLD keeps the screen through a moved-on room, room.js holds a kick); the run's end is written, THEN the
//     phone follows the room (`pingRouter`).
//   · THE PODIUM WAITS FOR THE LIVE RUNS (`createLiveWait`): a phone that is out (watching) sees `final` while a rival's run is still live
//     (the game's liveOf — core/proof.js#liveGoers, the honest host's own "has it ended?" rule on the players' own nodes): it keeps
//     watching; the podium comes once none is (the cap ends every wait) — scored then from the nodes as they stand (the game's own
//     finalPatch), never the early `final`'s numbers.
// An honest match never waits here: the host writes `final` only once no run is live.
// Lazy (the cartridges'): app.js's hub is read through globalThis (THE STALE-MODULE RULE).

/** how long a held phone waits for its own end's acknowledgement after the run (a dead line: Firebase keeps the write queued — it lands
 *  when the line is back, the phone follows the room meanwhile) */
export const END_OWED_MS = 8000;
/** the podium's live check, at most this often (it reads every node — never in a frame of play) */
export const LIVE_CHECK_MS = 500;

/** the router's hub (app.js) — null on a page without it (THE LAB, the test page) */
const hub = () => globalThis.__nsRunHold || null;

/** → ping(): ask the router to follow the room again — only while it holds this screen (or a kick waits), at most twice a second */
export function createRouterPing() {
  let at = -1e9;
  return function ping() {
    const RH = hub();
    if (!RH || !(RH.on || RH.wait)) return;
    const t = performance.now();
    if (t - at < LIVE_CHECK_MS) return;
    at = t;
    try { RH.check(); } catch { /* the router's own business */ }
  };
}

/** presence ({ uid: { online } } — store.state.presence) → { uid: bool } for the given nodes */
function onlineOf(presence, tree) {
  const out = {};
  for (const u in tree) out[u] = !!(presence && presence[u] && presence[u].online);
  return out;
}

/**
 * createLiveWait(liveOf) → wait({ code, matchId, runs, presence, now, skip }) → the uids whose run is still live (an empty array = show the
 * podium now). Read at most every LIVE_CHECK_MS (the last answer in between); `skip` = this phone's own uid (its own run is the view's
 * business). `waited()` = the podium was held back at least once (→ score it from the nodes).
 */
export function createLiveWait(liveOf) {
  let at = -1e9, last = [], held = false, key = '';
  function wait({ code, matchId, runs, presence, now, skip = '' }) {
    if (!runs) return last;
    const t = performance.now();
    if (key === matchId && t - at < LIVE_CHECK_MS) return last;
    at = t; key = matchId;
    let L = null;
    try { L = liveOf({ code, matchId, tree: runs, now, online: onlineOf(presence, runs) }); } catch { L = null; }
    last = L ? L.uids.filter(u => u !== skip) : [];
    if (last.length) held = true;
    return last;
  }
  return { wait, waited: () => held, reset() { at = -1e9; last = []; held = false; key = ''; } };
}
