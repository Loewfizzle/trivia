// THE CONSOLE FIX — THE RUN HOLD, the cartridge half (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST").
// The long notes: docs/games/jaywalk-notes.md

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
