// CITY 2.0 — THE PREVIEW PANEL + THE EVENTS (SCHED — FR5 C1's cut: a pure MOVE out of scene.js, no behaviour changed): the panel's state
// applied to this city (JUST ME / EVERYONE, the real city back), the neon moments it fires, the everyday events' tick + their drawing; one
// factory over ONE ctx of getters (+ setters) onto scene.js's own state (docs/harbor/review-5.md C1).
import { skyClock } from '../../core/sky.js';
import { SPELL_WORDS } from '../../core/harbor-windows.js';
import { REMOTE_KEYS, PREVIEW_KEYS, eventDef } from '../../core/harbor-remote.js';

/** C: scene.js's state by getters (+ a setter where this code assigns it): beam, beamK=, boats, bowForcedAt=, clock, DEBUG=, dpr, events=, fastUntil=, GRID=, L, lastDt, legends, legendWant=, lights, linkHeld, LOADLOG, lookAt=, neon, pageClock=, PT, q, qp, realLive=, refreshLook, remoteApplied=, remoteKey=, remoteWho=, S, sched=, shownAt, sky, skyKey=, spellBy=, spellOpts, tier, W, wheel, wheelParty */
export function createScenePanel(C) {
  // THE PREVIEW PANEL (core/harbor-remote.js + screens/harbor/remote.js): the preview links' URL flags swapped LIVE — the clock
  // (time, speed, weather, zone), the &force= set (the same Set every module reads), the flags' values (qp, read where they are
  // used) — and whatever a preview left behind when it goes (a scheme, a colour, a word, a held scene) put back. params: { key:
  // value } in place of the page's own REMOTE_KEYS, or null (back to the page's own URL); o.at: when it began (server ms),
  // o.srv: the server clock — a time jump runs from o.at, so every phone shows the same minute, and a sky piece the state asks for
  // starts at o.at (a late arrival lands mid-flight).
  let pageQ = new URLSearchParams(C.q);
  /** SP5 — CLEAR ALL = THE REAL CITY NOW (the owner): the page's OWN link flags (&when / &force / &wx / &hush…) are dropped too — the
   *  page clock becomes the real one at the place the link names (&tz / &at kept), the live weather comes back, every sky piece in
   *  flight + a legendary are stopped, the forced events end with their flags. → the flags that were stripped (the panel's toast) */
  function realCity() {
    const gone = [];
    C.linkHeld.clear();                                     // (9g: a link's legendary still waiting for its tap goes with the link)
    for (const k of PREVIEW_KEYS) if (pageQ.has(k)) { gone.push(k); pageQ.delete(k); }
    const c = skyClock('?' + pageQ.toString());
    C.pageClock = { now: c.now, wx: c.wx, speed: c.speed, tz: c.tz, preview: c.preview, force: new Set(c.force) };
    try { C.sky.api.stop(); } catch {}
    try { C.legendWant = null; if (C.legends) C.legends.stop(); } catch {}
    // (a link that only names the PLACE (&tz / &at) is still a 'preview' clock to skyClock — a seeded sky for the review links; the real
    // city wants the LIVE weather: keepLive, as the panel's own moved clock does — the readout says so; every later clear keeps it)
    C.realLive = !!(C.pageClock.preview && !C.pageClock.wx && !pageQ.has('when') && !(C.pageClock.speed > 1));
    C.remoteKey = '~'; applyRemote(null, {});
    return gone;
  }
  // (SP4: a JUST ME state the panel kept for this tab — sessionStorage, remote.js#ME_KEY — is applied before the reveal: the gate waits)
  const remoteStored = (() => { try { return !!sessionStorage.getItem('nd:hr-me'); } catch { return false; } })();
  function applyRemote(params, o = {}) {
    const srv = o.srv || Date.now, at = o.at != null ? o.at : srv();
    const key = params ? JSON.stringify(params) + '|' + at : '';
    C.remoteApplied = true;
    if (key === C.remoteKey) return false;
    C.remoteKey = key;
    C.remoteWho = params ? { who: o.who || 'me', params } : null;
    C.LOADLOG.add('panel', params ? `the preview panel's state applied (${Object.keys(params).join(', ')})${C.shownAt < 0 ? ' before the reveal' : ''}` : 'the preview panel cleared — the real city');
    const sp = new URLSearchParams(pageQ);
    if (params) { for (const k of REMOTE_KEYS) sp.delete(k); for (const [k, v] of Object.entries(params)) sp.set(k, v); }
    const before = new Set(C.clock.force), q0 = new URLSearchParams(C.qp), text0 = C.qp.get('text') + '|' + C.qp.get('style') + '|' + C.qp.get('tower');
    const c = params ? skyClock('?' + sp.toString()) : C.pageClock;
    C.clock.force.clear(); for (const id of c.force) C.clock.force.add(id);
    C.clock.tz = c.tz; C.clock.wx = c.wx; C.clock.speed = c.speed;
    if (params) {
      const timed = !!sp.get('when') || c.speed > 1;
      // (SP4 — the live weather stays unless the state sets the weather; a clock the panel moves KEEPS it (keepLive) — a preview LINK
      // (&when= in the page's own URL) is still the seeded sky, so every test + review link stays deterministic)
      C.clock.preview = C.pageClock.preview || !!c.wx || timed;
      C.clock.keepLive = timed && !C.pageClock.preview && !c.wx;
      if (timed) { const start = sp.get('when') ? c.now() : at, sp0 = c.speed; C.clock.now = () => start + (srv() - at) * sp0; }
      else C.clock.now = C.pageClock.now;
    } else { C.clock.preview = C.pageClock.preview; C.clock.now = C.pageClock.now; C.clock.keepLive = C.realLive; }
    for (const k of [...C.qp.keys()]) C.qp.delete(k);
    for (const [k, v] of sp) C.qp.append(k, v);
    C.GRID = sp.get('grid') === '1'; C.DEBUG = sp.get('debug') === '1';
    // what the previews that went off leave behind
    const gone = id => before.has(id) && !C.clock.force.has(id), came = id => !before.has(id) && C.clock.force.has(id);
    const f = C.clock.force;
    if ((gone('spell') || (f.has('spell') && text0 !== C.qp.get('text') + '|' + C.qp.get('style') + '|' + C.qp.get('tower'))) && C.spellBy === 'force') { C.lights.clear(); C.spellBy = null; }
    if (!f.has('wheel-scheme')) C.wheel.scheme(C.wheelParty ? 'party' : 'city');
    if (gone('beam-green')) C.beam.set({ colour: null });
    if (!f.has('rosie-lights')) C.boats.set({ rosie: 'city' });
    if (gone('neon-party')) { C.neon.moment('party', 0); C.neon.moment('chase', false); }
    if (!C.qp.get('scene')) C.neon.moment('show', null);
    else if (f.has('neon-party')) C.neon.moment('chase', false);
    if (gone('burnout')) C.neon.moment('burnout', false);
    if (!f.has('neon-scheme')) C.neon.moment('scheme', 'city');
    if (['demo', 'searchlights'].some(id => gone(id) || came(id))) { C.sched = null; C.events = { active: [], quiet: [] }; }
    if ((gone('taxi') || came('taxi') || gone('rosie-turn') || came('rosie-turn')) && C.L) C.boats.layout(C.L, { dpr: C.dpr, tier: C.tier, taxi: f.has('taxi'), turn: f.has('rosie-turn') });
    if (['rainbow', 'rainbow2', 'moonbow', 'neonbow'].some(id => gone(id) || came(id))) C.bowForcedAt = null;
    if (came('finale')) C.PT.finaleForced = false;
    // the sky's pieces: the ones the state asks for start at o.at (clock ms); the ones that went stop
    // (an event whose own flags changed — a new text, other shapes — starts over)
    const redo = [...f].filter(id => before.has(id) && (eventDef(id) && eventDef(id).inputs || []).some(k => q0.get(k) !== C.qp.get(k)));
    C.sky.remote(C.clock.now() - (srv() - at) * (C.clock.speed || 1), [...[...before].filter(id => gone(id)), ...redo], [...[...f].filter(id => came(id)), ...redo]);
    if (C.legends) C.legends.remote(C.clock.now() - (srv() - at) * (C.clock.speed || 1), [...before].filter(id => gone(id)), [...f].filter(id => came(id)));
    C.lookAt = 0; C.skyKey = '';                                       // (the look follows at once: the clock, the weather)
    // (SP4: the look + the holiday + the light rules refreshed NOW — a state applied before the reveal is in the first picture, and the
    // gate below sees the lit re-bake it wants before letting the city in, not a crossfade after)
    try { C.refreshLook(performance.now()); } catch (e) { console.warn('[harbor] remote look', e); }
    C.fastUntil = Math.max(C.fastUntil, performance.now() + 3000);
    return true;
  }
  // the neon's MOMENTS, previewed now (later parts call harbor().neon.moment): &force=neon-party (chasers + the beat + colour
  // shifts), &force=neon-flash&game=pulse (a game's colours sweeping the skyline, every 6 s), &force=neon-scheme&scheme=halloween
  let flashAt = -1e9;
  function neonMoments(t) {
    const f = C.clock.force;
    if (f.has('neon-party')) { C.neon.moment('party', 1); if (!C.qp.get('scene')) C.neon.moment('chase', true); }
    if (C.qp.get('scene')) C.neon.moment('show', C.qp.get('scene'));
    if (f.has('burnout')) C.neon.moment('burnout', true);
    if (f.has('neon-flash') && t - flashAt > 6 && t > 2.5) { flashAt = t; C.neon.moment('flash', { game: C.qp.get('game') || 'pulse' }); }
    if (f.has('neon-scheme')) C.neon.moment('scheme', C.qp.get('scheme') || 'halloween');
  }
  function eventsTick(now, nightK) {
    const on = id => C.events.active.find(e => e.id === id);
    const sl = on('searchlights');
    // (they warm up over a few seconds when the event starts and fade out the same when it ends)
    // (NEON PASS 3: the searchlights JOIN THE PARTY at its peak — the show's `lights`)
    C.beamK += ((sl ? 1 : Math.max(0, C.neon.show().lights)) - C.beamK) * Math.min(1, 0.025 * (C.S.motion ? (C.lastDt || 16.7) / 16.7 : 50));   // (per 60 Hz frame: the same warm-up at 30 Hz)
    if (C.clock.force.has('spell')) {
      if (C.spellBy !== 'force' && nightK > 0.1 && C.lights.spell(...C.spellOpts())) C.spellBy = 'force';
      return;
    }
    const sp = on('spell');
    if (sp && C.spellBy !== sp.seed && nightK > 0.1) { if (C.lights.spell(SPELL_WORDS[sp.seed % SPELL_WORDS.length], { style: sp.seed % 3 === 0 ? 'twinkle' : 'wipe' })) C.spellBy = sp.seed; }
    else if (!sp && C.spellBy != null && C.spellBy !== 'force') { C.lights.clear(); C.spellBy = null; }
  }
  // the events' look in Part 1: the debug-only demo (&force=demo) — a lantern drifting across the sky lane, labelled
  function drawEvents(c, where) {
    for (const e of C.events.active) {
      if (e.id !== 'demo' || where !== 'sky') continue;
      const ln = C.L.lanes['sky-low'], x = ln.x + ln.w * (0.1 + 0.8 * e.k), y = ln.y + ln.h / 2;
      c.fillStyle = 'rgba(255,190,90,0.95)'; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
      c.font = '600 9px "Chakra Petch", system-ui, sans-serif'; c.fillText(`EVENT demo · lane sky-low · ${Math.round(e.k * 100)}%`, Math.min(C.W - 150, x + 9), y + 3);
    }
  }
  return { applyRemote, drawEvents, eventsTick, neonMoments, realCity, remoteStored };
}
