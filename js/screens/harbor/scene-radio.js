// CITY CONTROLS A — THE RADIO in the city (a cut like scene-legend / scene-fireworks): the moments the owner (+ CC-B's crew) FIRED, played
// ONCE each at their start on the server clock — never the preview panel's loop (a forced preview starts again a few seconds after each
// end + vanishes when cleared; a fired moment plays its whole length + leaves by its own motion). core/harbor-radio.js#startOf says how:
//   legend:<kind> · flyby · blackbird · words (skytyped by day in the SMOKE COLOUR picked — CC-B; the DRONE SHOW after dark — in its colour) · banner · balloons
//   · fireworks (a one-off show: the weeknight's or the full party show) · lightning · hold:<force id> (the force held on for its length —
//   the searchlights, the sky beams, the party, a dance break)
// A night-only moment on a phone where it's still light is skipped there (the city's time ALWAYS follows the real clock). A late load
// joins a running moment mid-way (its start in the past); a STOP ends it on the phone's next read. Each phone the same start: the server's.
import { jackDef, startOf, localStart, lenOf } from '../../core/harbor-radio.js';

/** C: { clock, srv (server ms), dark () → bool, off () → the zone (minutes east), legend (kind, atClock), stopLegend (), sky () → the sky
 *  API, blackbird (atClock) → bool, stopBlackbird (), lightning (atClock, o) → bool, stopLightning (), resetEvents (), log (what) } */
export function createSceneRadio(C) {
  let list = [];                          // the moments this phone knows (the city's + the desk's), by id
  const played = new Map();               // id → { kind, arg, startS (server ms) } once started (or 'skip')
  const held = new Set();                 // the force ids THIS module added to clock.force
  let fw = [];                            // the one-off shows (scene-fireworks reads them): [{ id, kind, t0 (clock s) }]
  const startMs = m => (m.local ? localStart(m.local, m.made || m.at, C.off()) : m.at);

  function set(moments) {
    const next = new Map();
    for (const m of moments || []) if (m && m.id && jackDef(m.jack)) next.set(m.id, m);
    // (a moment gone from the list while it runs = stopped on the server: its piece stops here too)
    for (const [id, p] of played) { const m = next.get(id); if (p !== 'skip' && (!m || m.state === 'stopped')) { stop(id, p); played.set(id, 'skip'); } }
    list = [...next.values()];
  }
  function stop(id, p) {
    C.log(`radio: ${id} stopped`);
    if (p.kind === 'legend') C.stopLegend();
    else if (p.kind === 'blackbird') C.stopBlackbird();
    else if (p.kind === 'lightning') C.stopLightning();
    else if (p.kind === 'fireworks') fw = fw.filter(s => s.id !== id);
    else if (p.kind !== 'hold') { try { const api = C.sky(); if (api && api.stop) api.stop(); } catch { /* fine */ } }
  }
  function begin(m, S, now, S0) {
    const atClock = C.clock.now() - (now - S0);             // (the moment's start on the city's clock — a late load lands mid-way)
    const a = C.sky();
    switch (S.kind) {
      case 'legend': C.legend(S.arg, atClock); return true;
      case 'flyby': return !!(a && a.airshow('flyby', { at: atClock }));
      case 'blackbird': return !!C.blackbird(atClock);
      case 'words': {
        if (!a) return false;
        if (C.dark()) return !!a.drones([{ text: S.text }], { at: atClock, colour: S.colour === 'rainbow' ? 'rainbow' : `#${S.colour || 'ffffff'}` });
        return !!a.skytype(S.text, { at: atClock, colour: S.colour || null });   // (CC-B: coloured smoke by day — the owner's pick)
      }
      case 'banner': return !!(a && a.banner([S.text], { at: atClock, passes: 2 }));
      case 'balloons': return !!(a && a.balloons({ at: atClock, fade: true, into: 0.3 }));
      case 'fireworks': fw = [...fw.filter(s => s.id !== m.id), { id: m.id, kind: S.show === 'full' ? 'party' : 'show', t0: atClock / 1000 }]; return true;
      case 'lightning': return !!C.lightning(atClock, { seed: m.id });
      case 'hold': return true;
      default: return false;
    }
  }
  /** once a frame (before the forces are read): start what's due, hold what's running, let go of what's over */
  function tick() {
    const now = C.srv(), want = new Set();
    for (const m of list) {
      if (m.state === 'stopped') continue;
      const S0 = startMs(m), len = lenOf(m) * 1000, end = m.local ? S0 + len : Math.max(m.until || 0, S0 + len);
      if (now < S0 || now >= end) { if (now >= end && played.has(m.id) && played.get(m.id) !== 'skip') played.set(m.id, 'skip'); continue; }
      const j = jackDef(m.jack), S = startOf(m);
      if (!played.has(m.id)) {
        if (j.dark && !C.dark()) { played.set(m.id, 'skip'); C.log(`radio: ${m.jack} skipped here (not dark)`); continue; }
        let ok = false; try { ok = Number.isFinite(S0) && begin(m, S, now, S0); } catch (e) { console.warn('[harbor] radio', m.jack, e); }
        if (!ok && S.kind !== 'hold') continue;            // (not ready yet — a sky piece before the lanes: next frame)
        played.set(m.id, { kind: S.kind, arg: S.arg, startS: S0 }); C.log(`radio: ${m.jack} started (${Math.round((now - S0) / 1000)} s in)`);
      }
      if (S.kind === 'hold' && played.get(m.id) !== 'skip') want.add(S.arg);
    }
    // the held forces (the same Set every module reads): on while their moment runs, off after — only the ones this module put there
    const f = C.clock.force;
    for (const id of want) if (!f.has(id)) { f.add(id); held.add(id); if (id === 'searchlights') C.resetEvents(); }
    for (const id of [...held]) if (!want.has(id)) { held.delete(id); if (f.has(id)) { f.delete(id); if (id === 'searchlights') C.resetEvents(); } }
    for (const id of [...held]) if (!f.has(id)) f.add(id);   // (a panel re-apply cleared the Set: put them back)
    if (played.size > 200) for (const k of [...played.keys()].slice(0, 100)) played.delete(k);
  }
  return {
    set, tick,
    /** the one-off shows for scene-fireworks (each once — never the preview's again-after-a-pause) */
    fw: () => fw,
    debug: () => ({ moments: list.map(m => ({ id: m.id, jack: m.jack, at: m.at, until: m.until, state: m.state, played: played.has(m.id) ? (played.get(m.id) === 'skip' ? 'skip' : 'on') : '' })), held: [...held], fw: fw.map(s => ({ id: s.id, kind: s.kind })) }),
  };
}
