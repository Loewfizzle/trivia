// CITY 2.0 — THE HARBOR, PART 7b: THE SPEAKEASY'S LIFE — the window MOMENTS drawn (the plan, the catalogue + the rooms' states:
// core/harbor-moments.js, PURE). The speakeasy's live layer (speakeasy.js#createSpeakeasy) calls this every frame; the rooms' STILL
// looks (paintRoom — the back-bar's bottles, the shade, the lamp room, the card table, the drawn curtains) stay in its cached lit
// canvas, and only what moves is drawn here, in the front wall's own units (v up; ~13.6 pt a unit on a 402 phone):
//   THE PEOPLE   silhouettes ~12–18 pt (figure(): a body, a head, two jointed arms, a hat, a prop) — dark against a lit room at
//                night, lit by the daylight against a dark room by day; on the jazz room's shade a soft shadow (the legs below it dark)
//   THE CAT      a large sitting silhouette, its tail flicking (cat())
//   (WIN3: THE BOSS'S TV ROOM — the apartment's TV glow with NO PERSON; the quiet nights' beds; THE PARTY IN THE WINDOWS — docs/harbor/passes/win3.md)
//   THE STATES   the apartment's TV glow (22:00 → 3 am: an IRREGULAR blue flicker — core#tvLight), its switch-off at 3 (SP3: a last
//                flicker, then DARK until the wake — the edge window's low lamp keeps the building never fully dark), the bar's afternoon (a half-drawn shade, the lower half lit), its last light + the
//                sweeping (3 → 4 am), the barbershop's day (the barber + a customer every ~8 min; the barber reading in his own
//                chair between them) and its CLOSED card before 9
//   THE MOMENTS  PAINT[id](env, el, len, inst) — one painter per catalogue entry (wake, shop-open, bartender, lights-out, dance,
//                toast, sax, cat, peek, tango, mirror) + the taps (a curtain twitches, a head peeks out, the cat leaps off)
// ADD A MOMENT: an entry in core/harbor-moments.js#MOMENTS + PAINT[id] here (+ a sound through env.play if it has one).
// THE FILES (C4a split): windows.js the life (the plan per frame, draw(), the passer-by, the taps' hit, the TV's landing) ·
// window-rooms.js the glass + the 2.5D rooms + paintRoom · window-figure.js the figure kit + palettes · window-paint.js the rooms'
// states, the shop + PAINT[id] · window-holiday.js the holidays' rooms + moments.
import { safeCtx } from '../../ui/canvas-safe.js';
import { litPal, RIM_COL, RIM_SIDE, traceReset, traceWindow, setRim, figure, traceList } from './window-figure.js';
import { PARKED_ROOMS, parkedNight, parkedLevel, partyAt } from '../../core/harbor-moments.js';
import { dayKey, hourPlan, routineAt, quietNight, bedtimes, BED_ROOMS, bedLevel, windowParty, windowPartyAt, MOMENT, usesBlind, BLIND, blindAt, starOnly, momentsAt, blindsAt, roomState, bossDayPlan, bossDayAt, bossSignal, edgeMoods, edgeShades, TANGO_PATH, STAGE_ROOM, STAGE, tvLight } from '../../core/harbor-moments.js';
import { sunTimes } from '../../core/sky.js';
import { stepDanceClock, createDanceClock } from '../../core/harbor-dance.js';
import { clamp01, rgb, tri, glassOf, R, boxOf, deepAt, hsh, mixc, TAU, landing } from './window-rooms.js';
import { reportError } from '../../errlog.js';
import { createPaint } from './window-paint.js';
import { createHoliday } from './window-holiday.js';
export { paintRoom, lateOf, ROOM_TINT, LATE_TINT } from './window-rooms.js';

export function createWindowLife() {
  const blocks = new Map();           // `${key}|${hour}` → that hour's plan
  const droppedScenes = new Set();    // (HOTFIX: the scenes whose painter threw this session — sceneSafe)
  let dark = null, darkKey = '', routines = {}, rKey = '';
  const taps = [];                     // { id, kind, at (frame s) } — the viewer's own taps (local, not synced)
  let catTap = -1, forcedT0 = -1, forcedId = null, last = { on: [], states: {}, sec: 0, key: '', next: null, forced: null }, busyNow = false, smokeForced = false, lastBox = null;
  const sprites = new Map();
  function spot(col) {
    const key = col.join(','); let cv = sprites.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = safeCtx(cv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [t, a] of [[0, 1], [0.18, 0.62], [0.42, 0.22], [0.7, 0.06], [1, 0]]) g.addColorStop(t, `rgba(${key},${a})`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); sprites.set(key, cv);
    return cv;
  }
  const glow = (c, col, x, y, r, a, sy = 1) => { if (a <= 0.004) return; c.globalAlpha = Math.min(1, a); c.drawImage(spot(col), x - r, y - r * sy, r * 2, r * 2 * sy); };
  /** SP4 — a figure's look in a LIT room: its palette in this room's lamp light, the lamp's modelling (the shade side), its marks; the
   *  rim comes from setRim (the room's). o.lamp: a colour to override the room's (the ofrenda's candles) */
  const litP = (E, pal, o = {}) => ({ pal: litPal(pal, o.lamp || RIM_COL[E.w.id] || [255, 222, 176], E.kl), lit: { side: o.side == null ? (RIM_SIDE[E.w.id] || 0) : o.side, a: o.a == null ? 0.5 : o.a }, marks: pal.m || null });

  // the local clock: seconds after local midnight, the date's key + weekday (the tz offset from the look: core/sky.js#localParts)
  function localNow(ms, off) {
    const lms = ms + (off || 0) * 60000, d = new Date(lms);
    return { key: dayKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), dow: d.getUTCDay(), month: d.getUTCMonth() + 1, sec: (((lms / 1000) % 86400) + 86400) % 86400, lms };
  }
  const darkAtNow = (h, d) => { const [a, b] = d || [19, 7]; return h >= a || h < b; };
  function block(key, hour, ctx) {
    const hl = ctx.hol, k = `${key}|${hour}|${ctx.dow}|${ctx.dark.map(v => v.toFixed(2)).join(',')}|${ctx.wx || ''}|${hl ? `${hl.id}${hl.stage}${hl.eve ? 'e' : ''}${hl.w}` : ''}|${ctx.boot ? 'b' : ''}${ctx.raid ? 'r' : ''}`;
    let b = blocks.get(k);
    if (!b) { b = hourPlan(key, hour, ctx); blocks.set(k, b); if (blocks.size > 8) blocks.delete(blocks.keys().next().value); }
    return b;
  }

  /**
   * frame(f): this frame's life — the moments on (the plan: this hour + the last), the rooms' states, the forced preview.
   * f.life = { ms (the city's clock), off (the tz offset, min), tz, lat, lon, moment (a forced id), dark: [duskH, dawnH] | null }
   * → { on: [{ id, win, el, len, n }], states: { apartment, bar, shop }, full: Set (windows drawn whole here: their lit canvas 0) }
   */
  function frame(f) {
    const L = f.life || {}, ms = L.ms || Date.now(), loc = localNow(ms, L.off), h = loc.sec / 3600;
    if (L.dark) dark = L.dark;
    else if (darkKey !== loc.key && L.tz && L.lat != null) {
      darkKey = loc.key;
      try { const st = sunTimes(ms, L.tz, L.lat, L.lon), hr = t => ((((t + (L.off || 0) * 60000) / 3.6e6) % 24) + 24) % 24; dark = st.rise && st.set ? [hr(st.set) + 0.35, hr(st.rise) - 0.35] : [19, 7]; } catch { dark = [19, 7]; }
    }
    const ctx = { dow: loc.dow, month: loc.month, dark: dark || [19, 7], wx: L.wx || null, hol: L.hol || null, boot: !!L.boot, raid: !!L.raid, party: !!L.party, mothman: !!L.mothman };   // (WIN: the cash count's gates; WIN2: the eyes' + the moods')
    smokeForced = !!L.smoke;   // (11a-1: the holiday's scenes — scene.js passes the DAY's stage)   // (9a: the weather gate — 'hot' | 'rain' | null)
    if (rKey !== loc.key) { rKey = loc.key; routines = {}; for (const m of ['wake', 'shop-open', 'bartender', 'lights-out']) routines[m] = routineAt(m, loc.key); }
    // WIN3 — THE BOSS's TV ROOM + THE QUIET NIGHTS: the night's key (the evening's date; the small hours belong to it); a raid night snaps
    // the TV off early as the siren starts (L.raidS: seconds since it; it stays off till morning); on a quiet night (core#quietNight) the
    // other rooms go to bed one by one after midnight (core#bedtimes → each room's level, the lamp clicking off)
    const nightKey = h < 6 ? localNow(ms - 86400e3, L.off).key : loc.key, sMid = h < 6 ? h * 3600 : h * 3600 - 86400;
    if (L.raidS != null && L.raidS >= 0 && L.raidS < 7200) tvDead = nightKey;
    const tvOff = tvDead === nightKey;
    const quiet = quietNight(nightKey, { party: ctx.party, seed: L.seed }), bed = quiet ? bedtimes(nightKey, { seed: L.seed }) : null, bedK = {};
    for (const id of BED_ROOMS) bedK[id] = bed ? bedLevel(bed, id, sMid) : 1;
    // NIGHT-C — THE QUIET BUILDING (core#parkedNight): at night — not a party evening, not a panel preview, not &force=no-quiet-building —
    // the bar, the jazz room + the upper middle are PARKED: the blind rolls down (the blind cycle — never a cut) as the rooms' night begins
    // and up again at dawn / a party; a seeded mix lit behind it, the lit lamps going out one by one later (their lit level → bedK)
    const ekd = nightKey.split('-').map(Number), eveDow = new Date(Date.UTC(ekd[0], ekd[1] - 1, ekd[2])).getUTCDay();
    const parkOn = !L.noPark && !(L.moment && MOMENT[L.moment]) && darkAtNow(h, ctx.dark) && !ctx.party && !partyAt(eveDow, 22, nightKey);
    const PN = parkOn ? parkedNight(nightKey, { seed: L.seed }) : null, park = {}, pdt = parkT == null ? 1e9 : Math.max(0, f.t - parkT); parkT = f.t;
    for (const id of PARKED_ROOMS) {
      const want = parkOn ? 1 : 0, b0 = parkB[id], b = b0 == null || pdt > 2 ? want : b0 + Math.sign(want - b0) * Math.min(Math.abs(want - b0), pdt / BLIND.down);
      parkB[id] = b; park[id] = b;
      if (parkOn) bedK[id] = Math.min(bedK[id] == null ? 1 : bedK[id], parkedLevel(PN, id, sMid));
    }
    // WIN3 — THE PARTY IN THE WINDOWS (core#windowParty): at the party's PEAK the rooms go up one by one in a seeded order, each its own
    // colour; forced (&force=window-party) from the page's start; a raid CUTS it (the lights off, the dancers scatter, the blinds drop —
    // a 1.6-s tail from partyKeep) and it stays dead for the night
    let party = null;
    { const pf = !!L.partyForce; if (pf && partyT0 == null) partyT0 = f.t; if (!pf) partyT0 = null;
      const peakS = pf ? f.t - partyT0 : (L.partyPhase === 'peak' && L.partyPeakS != null ? L.partyPeakS : null);
      if (peakS != null && peakS >= 0 && partyDead !== nightKey) {
        const P = windowParty(nightKey, { seed: L.seed }), st = windowPartyAt(P, peakS, pf ? null : L.partyEndS, L.raidS);
        if (st.cut) { partyDead = nightKey; partyCutT = f.t; partyKeep = partyKeep || { k: windowPartyAt(P, peakS, pf ? null : L.partyEndS).k, col: P.col, order: P.order }; }
        else party = { on: st.on, k: st.k, col: P.col, order: P.order, s: +peakS.toFixed(1), beat: L.beat || null, forced: pf, cut: false };
      }
      if (partyDead === nightKey && partyCutT != null && f.t - partyCutT < 1.6 && partyKeep) party = { on: true, k: partyKeep.k, col: partyKeep.col, order: partyKeep.order, cut: true, scatter: f.t - partyCutT, beat: L.beat || null };
      if (partyDead !== nightKey) { partyCutT = null; partyKeep = null; }
    }
    let on, blinds = {};
    const forced = L.moment && MOMENT[L.moment] ? L.moment : null;
    if (forced) {
      // THE PREVIEW (&force=window&moment=<id>, the panel's WINDOWS rows): that moment on a loop from 1.2 s in, nothing else drawn
      // (9c — the blind's moments: their lead-in — the blind down + held — before the scene, the blind up + down again round each loop)
      const bl = usesBlind(forced), lead = bl ? BLIND.down + BLIND.hold + 0.3 : 1.2;
      if (forcedId !== forced) { forcedId = forced; forcedT0 = f.t + lead; }
      const m = MOMENT[forced], cyc = m.len + (bl ? 2 * (BLIND.down + BLIND.hold) + 0.6 : 2.5), el = f.t - forcedT0;
      const n = Math.floor(el / cyc), e = el - n * cyc;
      const winN = q => (m.windows === 'all' ? 'all' : (Array.isArray(m.windows) ? m.windows[((q % m.windows.length) + m.windows.length) % m.windows.length] : m.windows));
      on = el >= 0 && e < m.len ? [{ id: forced, win: winN(n), el: e, len: m.len, n: -1 - n, p: e / m.len }] : [];
      if (bl) { const n0 = Math.max(0, n), rel = el - n0 * cyc, b0 = blindAt(rel, m.len), b1 = blindAt(rel - cyc, m.len); blinds = {}; if (b0 > 0) blinds[winN(n0)] = b0; if (b1 > 0) blinds[winN(n0 + 1)] = Math.max(blinds[winN(n0 + 1)] || 0, b1); }
    } else {
      forcedId = null;
      const hr = Math.floor(h), prev = hr ? block(loc.key, hr - 1, ctx) : block(localNow(ms - 86400e3, L.off).key, 23, { ...ctx, dow: (loc.dow + 6) % 7 }).map(e => ({ ...e, t0: e.t0 - 86400 }));
      const all = [...prev, ...block(loc.key, hr, ctx)];
      on = starOnly(momentsAt(all, loc.sec));   // (SP3: one star window at a time)
      blinds = blindsAt(all, loc.sec);           // (9c: the blinds' cycles round the moments that use them — before + after their window)
      if (bed) for (const id of Object.keys(blinds)) if (bedK[id] != null && bedK[id] <= 0.5) delete blinds[id];
      if (party && party.on) for (const id of Object.keys(blinds)) if (party.k[id] > 0.01) delete blinds[id];
      if (bed) on = on.filter(e => e.win === 'all' || bedK[e.win] == null || bedK[e.win] > 0.5);   // (WIN3: a room gone to bed has no moments)
      // (NIGHT-C: a PARKED room's moments sleep — the holidays' scenes too (Halloween week's costume party ran every ~45 s: not a quiet
      // building); only its routines keep their hour. The holiday's sill pieces stay; a party night — Halloween itself — is unchanged)
      if (parkOn) { on = on.filter(e => e.win === 'all' || !PARKED_ROOMS.includes(e.win) || !!(MOMENT[e.id] && MOMENT[e.id].rarity === 'routine'));
        for (const id of PARKED_ROOMS) if (!on.some(e => e.win === id)) delete blinds[id]; }
      if (party && party.on) on = on.filter(e => e.win !== 'all' && !(party.k[e.win] > 0.01));   // (WIN3: a room at the party has no other moment)
      // (Reduced motion: no moving moments — the rooms keep their states: the TV's light steady, the night lamp, the shop's barber still)
      if (f.motion === false || f.motion === 0) { on = []; blinds = {}; }   // (11a-1: the title passes motion 0 — the old === false never caught it)
    }
    const states = { apartment: roomState('apartment', h, routines), bar: roomState('bar', h, routines), shop: roomState('shop', h, routines) };
    // SP5 — THE BOSS's ROOM (core#bossDayPlan / bossSignal / bossWatch): the shade drawn all day (its rare life: the peek, the cigar smoke,
    // an overcast day's shadow), the bootleggers' tell (the violet lamp + the spade from the afternoon until the truck; &force=boss-signal),
    // on a party night the shade down + his shadow watching the street (&force=boss-watch any night). The window is painted WHOLE here,
    // always (the lit layer's lamp room is never seen: the one window that never opens)
    const overcast = !!L.overcast, bKey = `${loc.key}|${overcast ? 'o' : ''}`;
    if (bossKey !== bKey) { bossKey = bKey; bossPlan = bossDayPlan(loc.key, { seed: L.seed, overcast }); }
    const bossParty = !!L.bossWatch || !!(party && party.on && !party.cut);
    const boss = { day: bossDayAt(bossPlan, loc.sec), signal: L.bossSignal ? 1 : bossSignal(loc.sec, { boot: ctx.boot, sat: loc.dow === 6, truckAt: L.truckAt == null ? null : L.truckAt }), party: bossParty, watch: bossParty && f.motion !== false && f.motion !== 0 ? watchNow(L, f.t) : null };   // (11a-2: the walk-up cycle on the peak's clock; forced: the demo cycle from the flag)
    const full = new Set(['apartment']);
    if (states.bar === 'last') full.add('bar');
    for (const e of on) if (e.id === 'lights-out') full.add('apartment'); else if (e.id === 'wake') full.add(e.win); else if (e.id === 'bartender') full.add('bar'); else if (e.id === 'eyes') full.add(e.win);   // (WIN2: the eyes' dark room; SP5: the wake in its own window)
    if (party && party.on) for (const id of party.order) if (party.k[id] > 0.001 || party.cut) full.add(id);   // (WIN3: a party room is drawn whole here)
    // WIN2 — THE EDGE WINDOWS' MOOD LIGHTS: at night the two edge windows are the live layer's (their mood seeded by the night's date)
    if (darkAtNow(h, ctx.dark)) { full.add('edge2'); full.add('edge3'); }
    const moods = edgeMoods(nightKey, { hol: ctx.hol ? ctx.hol.id : null, party: ctx.party });
    // SP5 — the edge windows' roller shades tonight (core#edgeShades) + THE DANCE CLOCK every dancer in the building reads (core/harbor-dance.js:
    // the song's grid blended, the energy winding down at a song's end, idle in the gap, picking up on the new song)
    const shades = edgeShades(nightKey, { seed: L.seed });
    stepDanceClock(wd, wdT == null ? 0 : Math.max(0, f.t - wdT), L.beat ? { beatsF: L.beat.beatsF, gap: !!L.beat.gap, left: L.beat.left == null ? null : L.beat.left, id: L.beat.id || null } : null); wdT = f.t;
    const cur = block(loc.key, Math.floor(h), ctx), nx = cur.find(e => e.t0 > loc.sec);
    last = { on, blinds, park, parkOn, parked: PN, states, boss, shades, dance: { bf: wd.bf, dk: wd.dk, cheer: wd.cheer, gap: wd.gap }, sec: loc.sec, h, sMid, quiet, bed: bedK, bedAt: bed, tvOff, party, tvLate: h >= 0.75 && h < 6, raidS: L.raidS == null ? null : +L.raidS.toFixed(1), key: loc.key, forced, full, hol: ctx.hol, next: nx ? { id: nx.id, win: nx.win, in: Math.round(nx.t0 - loc.sec) } : null, dark: ctx.dark, moods, nightKey };
    return last;
  }

  // ---------------------------------------------------------------- drawing
  /**
   * draw(c, env): after the lit rooms. env = { map(c) (the front wall's transform), wins (+ u, v), shopWin [w0, w1, v0, v1], door
   * { card: [u, v] }, k (the night 0..1 × fade), levels (each window's lit level), f (the frame: t, motion, tw { day, gold, night },
   * party, tier, fade), play(slot, o), loop(slot, o) }
   */
  function draw(c, env) {
    const fr = last, f = env.f, t = f.t || 0, k = env.k, day = clamp01(1 - k), mo = f.motion !== false && f.motion !== 0;
    const T = f.tw || { day: 1 - k, gold: 0, night: k };
    const frameC = rgb(tri(T, [30, 54, 46], [40, 40, 40], [11, 12, 22]));
    const winOf = id => env.wins.find(w => w.id === id);
    const byWin = new Map();
    for (const e of fr.on) {
      if (e.win === 'all') { for (const id of TANGO_PATH) if (!(fr.park && fr.park[id] > 0.5)) (byWin.get(id) || byWin.set(id, []).get(id)).push(e); }   // (NIGHT-C: never through a parked room)
      else (byWin.get(e.win) || byWin.set(e.win, []).get(e.win)).push(e);
    }
    c.save(); env.map(c);
    // (WIN — what keeps the city at 60 fps: a moment on, a tap answering, someone passing deep in a room — scene.js#fastNow reads busy())
    if (!env.only) traceReset(); busyNow = fr.on.length > 0 || taps.some(o => t - o.at < 3.2) || (catTap >= 0 && t - catTap < 1);
    const passer = mo && !fr.on.some(e => MOMENT[e.id] && MOMENT[e.id].rarity !== 'routine') ? passerAt(t) : null;
    // the glints: the glasses + the shaker catching the light where they are (warm at night, a cool sparkle by day)
    const glints = (x, gx, gy, s) => { const a = x.globalAlpha; x.save(); x.globalCompositeOperation = 'lighter'; glow(x, k > 0.3 ? [255, 236, 190] : [255, 255, 255], gx, gy, 0.12 * s, 0.85 * Math.max(0.35, k) * a); x.restore(); };
    for (const w of env.wins) {
      const G = glassOf(w), lv = env.levels[env.wins.indexOf(w)], kl = k * (fr.full.has(w.id) ? 1 : lv);
      const list = byWin.get(w.id) || [];
      const tap = taps.find(o => o.id === w.id && t - o.at < 3.2);
      const dress = holDress(fr.hol, w.id) || (list.some(e => e.id === 'ofrenda') ? 'ofrenda' : null);
      const bl9 = fr.blinds ? fr.blinds[w.id] || 0 : 0;   // (9c: a moment's blind cycle in this window)
      const pk = fr.park ? fr.park[w.id] || 0 : 0;         // (NIGHT-C: a parked room's blind)
      if (env.only && w.id !== env.only) continue;          // (NIGHT-C: one window — the crisp layer's copy of a live room)
      if (env.skip && env.skip.has(w.id)) continue;         // (… and the city skips it while that copy covers it)
      if (!list.length && !tap && !dress && !fr.full.has(w.id) && kl < 0.01 && w.id !== 'bar' && !(w.id === 'apartment' && fr.states.apartment !== 'lamp') && bl9 < 0.002 && pk < 0.002) continue;
      if (w.edge && k < 0.01 && !list.length && !tap && !dress && bl9 < 0.002) continue;
      c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, G.ch); c.clip();
      traceWindow(w.id);
      // WIN3 — A ROOM GONE TO BED (a quiet night): its pane dark, nothing drawn in it (the lit layer is × its bed level too: speakeasy.js)
      const bedk = fr.bed && fr.bed[w.id] != null ? fr.bed[w.id] : 1;
      // NIGHT-C — A PARKED ROOM, its blind all the way down: just the blind (warm with its lamp behind it, or dark), the holiday's sill piece
      // in front of it — nothing behind it is drawn
      if (pk > 0.998 && !list.length && !tap && k > 0.01) {
        const E0 = { c, G, w, k, kl, day, t, mo, T, glints, f, env, frameC, after: [], B: boxOf(G, env.vp) }; E0.deep = (t2, fn) => deepAt(c, E0.B, t2, fn);
        cycleBlind(E0, 1);
        if (dress === 'pumpkin') sillPumpkin(E0);
        c.restore(); for (const fn of E0.after) fn(); continue;
      }
      if (bedk < 0.02 && !list.length && !tap && pk < 0.002) { R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(7,8,15)'); c.restore(); continue; }
      // WIN3 — THE PARTY IN THE WINDOWS: a room at the party is painted whole here (the colour, the crowd, the blind); the edge windows
      // join with their party cycle (light + shadow only, in the cycle's colours)
      if (fr.party && fr.party.on && fr.party.k[w.id] != null && (fr.party.k[w.id] > 0.001 || fr.party.cut) && k > 0.01) {
        const B2 = boxOf(G, env.vp), E2 = { c, G, w, k, t, mo, B: B2, deep: (t2, fn) => deepAt(c, B2, t2, fn) };
        partyRoom(E2, fr.party.col[w.id], fr.party.k[w.id], { party: fr.party, edge: !!w.edge, cut: fr.party.cut, scatter: fr.party.scatter || 0, seed: w.id.length * 7 + w.id.charCodeAt(0), n: w.id === 'bar' ? 4 : 3 });
        c.restore(); continue;
      }
      const B = boxOf(G, env.vp);   // (WIN: the room's box — every painter places its people at a depth through E.deep(t, fn))
      if (B && w.id === 'bar') lastBox = { faces: Object.keys(B.faces).filter(q => B.faces[q]), k: B.k, floorU: +(B.back.h0 - G.h0).toFixed(3), leftU: +(B.back.g0 - G.g0).toFixed(3) };
      const E = { c, G, w, k, kl, day, t, mo, T, glints, f, env, frameC, after: [], B, deep: (t2, fn) => deepAt(c, B, t2, fn) };
      // (11a-1: each room's lamp rims its silhouettes — its own warm tone, stronger on the lamp's side)
      setRim(k > 0.25 && kl > 0.05 ? { col: RIM_COL[w.id] || [255, 222, 176], a: 0.48 * Math.min(1, kl * 1.2), side: RIM_SIDE[w.id] || 0, w: 0.026 } : null);
      // (SP3 — THE STAGING: a zoom about the pane's foot — close moments bold at the glass, cropped by the frame; core#STAGE)
      const zoomed = (z, fn) => { if (z === 1) return fn(); c.save(); c.translate(G.cx, G.h0); c.scale(z, z); c.translate(-G.cx, -G.h0); const r = fn(); c.restore(); return r; };
      // WIN3 — the LAST SHADOW before a room's lamp clicks off (a quiet night): someone passing deep in the room in its last seconds
      if (fr.bedAt && fr.bedAt[w.id] != null && fr.sMid != null && mo) { const toBed = fr.bedAt[w.id] - fr.sMid; if (toBed > 0 && toBed < 4.5) passing(E, { u: 1 - toBed / 4.5, dir: 1, seed: 3 }); }
      const eyesOn = list.some(e => e.id === 'eyes');   // (WIN2: the eyes own the whole dark window — no room, no people under them)
      // the room's own state (POLISH 5: single panes — nothing is laid back over the glass after)
      if (w.id === 'apartment' && !eyesOn) zoomed(STAGE_ROOM, () => apartmentState(E, fr.states.apartment, list));
      if (w.id === 'bar' && !eyesOn) zoomed(STAGE_ROOM, () => barState(E, fr.states.bar, list));
      if (w.id === 'jazz' && kl > 0.01 && !eyesOn && !list.some(e => e.id === 'mummy' || e.id === 'football')) { const solo = list.find(e => e.id === 'sax'); zoomed(solo ? STAGE.sax : STAGE_ROOM, () => saxPlayer(E, solo)); }
      // WIN2 — THE EDGE WINDOWS' MOOD LIGHTS (light + shadow only, no people): at night the whole pane is the mood's
      if (w.edge && k > 0.01 && fr.full.has(w.id) && dress !== 'ofrenda') edgeMood(E, fr.moods ? fr.moods[w.id] : 'candle', fr.moods);
      // (SP3 — the windows that aren't the star keep SLOW SIMPLE LIFE: now and then someone passes deep in the room, a soft shadow.
      // WIN — ONE passer at a time across the whole building, never while a star moment plays: the owner saw figures moving in several
      // panes at once and read it as "the tango in all the windows" — a moment belongs to ONE window, and so does a passer-by)
      if (!list.length && kl > 0.05 && mo && passer && passer.id === w.id && !w.edge) passing(E, passer);
      // 11a-1 — THE HOLIDAY IN THE ROOM: the ofrenda on its sill (its candles lit one by one while the ofrenda moment runs) · a jack-o'-lantern
      if (dress === 'ofrenda') ofrendaState(E, list.find(e => e.id === 'ofrenda'), fr.hol && fr.hol.id === 'dotd' ? fr.hol.ofrendas : 1);
      else if (dress === 'pumpkin' && kl > 0.05) sillPumpkin(E);
      // the moments in this window
      for (const e of list) { const p = PAINT[e.id]; if (p) sceneSafe(c, e.id, () => zoomed(STAGE[e.id] || 1, () => p(E, e.el, e.len, e))); }
      { const bk9 = list.length ? bl9 : Math.max(bl9, pk);   // (NIGHT-C: + a parked room's blind rolling down at dusk / up at dawn)
        if (bk9 > 0.002) cycleBlind(E, bk9); }   // (9c: never a cut — the blind down, the scene swapped under it, the blind up)
      if (tap) sceneSafe(c, `tap:${w.id}`, () => tapPaint(E, tap));
      c.restore();
      for (const fn of E.after) fn();
    }
    c.restore();
    setRim(null);
    // the shop (the barbershop's big window): its day life, its CLOSED card, the hidden mirror door
    if (env.only) return;   // (NIGHT-C: the crisp layer's one window — the shop + the TV's spill stay the city's)
    traceWindow('shop');
    shop(c, env, fr, byWin.get('shop') || [], { k, day, t, mo, T, f });
    traceWindow('');
    // the TV's blue spill on the brick round the apartment window (the bake's warm blobs belong to the lit rooms)
    spills(c, env, fr, t);
  }

  // ---------------------------------------------------------------- SLOW LIFE (SP3; WIN: one passer at a time)
  const PASS_WINS = ['bar', 'jazz', 'back'], PASS_PER = 64, PASS_LEN = 8;   // (WIN2: the edge windows are light + shadow only)
  /** the building's one passer-by now: every PASS_PER s one slot picks ONE window (seeded on the slot: every phone the same) and someone
   *  crosses deep in it for PASS_LEN s → { id, u (0..1), dir, seed } or null */
  function passerAt(t) {
    const slot = Math.floor(t / PASS_PER), start = slot * PASS_PER + hsh(slot, 21) * (PASS_PER - PASS_LEN - 4) + 2, u = (t - start) / PASS_LEN;
    if (u < 0 || u >= 1) return null;
    return { id: PASS_WINS[Math.floor(hsh(slot, 22) * PASS_WINS.length)], u, dir: hsh(slot, 23) < 0.5 ? -1 : 1, seed: slot };
  }
  /** someone passing deep in a lit room: a soft dark shape gliding across the back wall */
  function passing(E, P) {
    const { c, G, t, kl } = E, { u, dir, seed } = P, x = G.cx + dir * (u - 0.5) * (G.cw + 1.2), y = G.h0 + G.ch * 0.08, s = 1.15;
    const a = 0.26 * kl * Math.sin(Math.PI * u);
    busyNow = true;
    c.save(); c.globalAlpha = a;
    E.deep(0.9, () => figure(c, { x, y, s, rim: null, lean: -dir * 0.04, tilt: 0, face: dir, arms: [[0.06 + 0.06 * Math.sin(t * 3), 0.1], [0.06 - 0.06 * Math.sin(t * 3), 0.1]], col: 'rgb(40,20,14)', hat: seed % 2 ? 'fedora' : null, hair: seed % 2 ? null : 'bob' }));   // (deep in the room: small)
    c.restore();
  }

  // HOTFIX (Oct 27 — the owner's iPhone froze on night loads): a window scene's painter that throws used to throw out of the whole frame,
  // every frame, until the city's loop stopped (scene.js#frameFailed). Now that one scene drops out for the session — reported to
  // /admin once — and the city keeps running. (Not a cover: the error is still reported, and tests/integration e2e-harbor `freeze` fails on it.)
  function sceneSafe(c, id, fn) {
    if (droppedScenes.has(id)) return;
    c.save();
    try { fn(); } catch (err) { droppedScenes.add(id); console.error('[harbor] a window scene failed and was dropped:', id, err); reportError(err, `harbor window scene ${id}`); }
    c.restore();
  }
  /** 9c — THE BLIND CYCLE (core#blindAt): the building's cream holland linen rolled down from the head to b (0 up … 1 down): by day lit
   *  evenly from outside, at night glowing with the room's light behind it; the hem bar + the ring pull, the roller's shadow at the head */
  function cycleBlind(E, b) {
    const { c, G, kl, day } = E, cover = 0.96 * b, hem = G.h1 - G.ch * cover, lamp = Math.min(1, (kl || 0) * 1.2);
    const cloth = mixc(mixc([30, 26, 26], [226, 204, 164], day), [255, 214, 150], 0.55 * lamp * (1 - day));
    const g = c.createLinearGradient(0, hem, 0, G.h1); g.addColorStop(0, rgb(mixc(cloth, [40, 30, 24], 0.25))); g.addColorStop(0.5, rgb(mixc(cloth, [255, 244, 220], 0.1))); g.addColorStop(1, rgb(mixc(cloth, [40, 30, 24], 0.32)));
    c.fillStyle = g; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, G.h1 - hem + 0.1);
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, 0.03);
    c.fillStyle = rgb(mixc([176, 146, 84], cloth, 0.3)); c.fillRect(G.g0 - 0.1, hem - 0.013, G.cw + 0.2, 0.028);   // (the hem bar)
    c.strokeStyle = rgb([156, 126, 70], 0.95); c.lineWidth = 0.016; c.beginPath(); c.arc(G.cx, hem - 0.075, 0.036, 0, TAU); c.stroke();
    // (C4a: at night the cloth is a LIT BLIND — the room's lamp a radial through it, the folds, the edges — over the even day linen)
    const nk = lamp * (1 - day);
    if (nk > 0.01) { c.save(); c.globalAlpha = Math.min(1, (1 - day) * 1.4); litBlind(c, G, { hem, cloth: [70, 58, 46], col: [255, 214, 150], a: nk, lamp: { u: G.cx, v: Math.max(hem + 0.15, G.h0 + G.ch * 0.6) }, sil: false }); c.restore(); }   // (the ring pull)
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(G.g0, G.h1 - 0.05, G.cw, 0.05);   // (the roller's shadow at the head)
  }

  let tvDead = null;   // (tvDead: the night key the TV snapped off on — a raid)
  const parkB = {}; let parkT = null;   // (NIGHT-C: each parked room's blind 0 up … 1 down, eased over the blind's own BLIND.down)
  let bossKey = '', bossPlan = [];   // (SP5: the boss's day plan, rebuilt per day / overcast)
  const wd = createDanceClock(); let wdT = null;   // (SP5: the building's dance clock)
  let partyT0 = null, partyDead = null, partyCutT = null, partyKeep = null;   // (WIN3: the window party — forced from t0; dead after a raid's cut)

  // ---------------------------------------------------------------- the TV's blue LANDING outside the glass (SP2: crisp — the sill's
  // lit top + the reveal + a short fall, flickering with the set; the soft blob over the brick is gone)
  function spills(c, env, fr, t) {
    const w = env.wins.find(o => o.id === 'apartment');
    // (SP6: the same blue as the room — the scene's near colour; on a party night the boss's set from the party's start, softened by his shade)
    const st = fr.states.apartment, bossTv = !!(last.boss && last.boss.party) && (st === 'lamp' || st === 'tv');
    if (!w || (st !== 'tv' && !bossTv) || env.k < 0.02) return;
    const tv = env.f.motion !== false && env.f.motion !== 0 ? tvLight(t, 11) : { k: 0.75, tint: 0.4, warm: 0 };
    c.save(); env.map(c); c.globalCompositeOperation = 'lighter';
    landing(c, glassOf(w), tvCols(tv, t).near, (bossTv ? 0.55 : 0.8) * env.k * Math.min(0.92, tv.k));
    c.restore();
  }

  // ---------------------------------------------------------------- the sounds (each calls its slot; an empty slot is silent)
  // (FP3a, FREV H3: the mirror's door + the cat's meow are MOMENT_CUES now — core/city-sounds.js; sounds.js#life plays them on the clock)
  /** the beds' levels (sounds.js#speakeasy keeps them, ducked under the music like the city's bed): the club's murmur through the
   *  wall while the bar is open at night (louder on a party night), the TV's murmur upstairs late */
  function bedLevels(k, party) {
    const st = last.states || {};
    return { club: st.bar === 'open' && k > 0.3 ? (party ? 1 : 0.6) * k : 0, party: !!party, tv: st.apartment === 'tv' && k > 0.3 ? 0.7 * k : 0 };
  }


  /** a tap on the speakeasy (screen pt) → { kind, id } or null: a window (its curtain twitches / a head peeks out / the patron
   *  salutes / the lamp swings), the cat (it leaps off) */
  function hit(x, y, wins, t) {
    for (const w of wins) {
      const r = w.rect; if (x < r.x - 2 || x > r.x + r.w + 2 || y < r.y - 2 || y > r.y + r.h + 2) continue;
      const catOn = last.on.find(e => e.id === 'cat' && e.win === w.id);
      if (catOn && catTap < 0) { catTap = t; return { kind: 'cat', id: w.id }; }
      const kind = w.edge ? 'twitch' : w.id === 'bar' ? 'salute' : w.id === 'back' ? 'lamp' : w.id === 'apartment' ? 'shade' : 'peek';   // (SP5: the boss's window — the shade lifts an inch, never a head)
      taps.splice(0, taps.length, ...taps.filter(o => t - o.at < 3.2 && o.id !== w.id), { id: w.id, kind, at: t });
      return { kind: 'window', id: w.id, tap: kind };
    }
    return null;
  }


  // ---------------------------------------------------------------- the painters (C4a: window-paint.js + window-holiday.js)
  // S: what the painters share with the life — its taps, the dance clock, the glow sprite, the lit look; the life's state read live
  // (getters) + the two traces the painters write (lastTv, cashTrace: the readout + the e2e)
  const S = { taps, wd, glow, litP, get last() { return last; }, get routines() { return routines; }, get smokeForced() { return smokeForced; }, get catTap() { return catTap; }, lastTv: null, cashTrace: { flicks: 0 } };
  const { apartmentState, barState, saxPlayer, edgeMood, partyRoom, watchNow, tvCols, shop, tapPaint, litBlind, PAINT: ROOM_PAINT } = createPaint(S);
  const { holDress, ofrendaState, sillPumpkin, PAINT: HOL_PAINT } = createHoliday({ glow, litP });
  const PAINT = { ...HOL_PAINT, ...ROOM_PAINT };

  return {
    frame, draw, hit, bedLevels,
    /** WIN3 — the window party's colour spilling out: [{ id, u (the pane's middle along the facade), col, k }] for the rooms up now (the full windows) */
    partySpill: wins => { const P = last.party; if (!P || !P.on || P.cut) return []; return (wins || []).filter(w => !w.edge && P.k[w.id] > 0.01).map(w => ({ id: w.id, u: (w.u[0] + w.u[1]) / 2, col: P.col[w.id], k: P.k[w.id] })); },
    paint: PAINT,
    /** a tap on the cat let go (its next instance comes back) */
    catReset() { catTap = -1; },
    /** WIN: something in a window is MOVING (a moment, a tap's answer, a passer-by) — a 60-fps reason (scene.js#fastNow) */
    busy: () => busyNow,
    debug: () => ({ dropped: [...droppedScenes], blinds: last.blinds || {}, park: last.park || {}, parkOn: !!last.parkOn, parked: last.parked || null, shades: last.shades || null, dance: last.dance || null, boss: last.boss ? { day: last.boss.day ? { id: last.boss.day.id, p: +last.boss.day.p.toFixed(2) } : null, signal: +last.boss.signal.toFixed(2), party: last.boss.party, watch: last.boss.watch ? { a: +last.boss.watch.a.toFixed(2), near: +last.boss.watch.near.toFixed(2), phase: last.boss.watch.phase, stand: last.boss.watch.stand, ember: +last.boss.watch.ember.toFixed(2), head: +last.boss.watch.head.toFixed(2), shift: +last.boss.watch.shift.toFixed(2), x: +last.boss.watch.x.toFixed(2) } : null } : null, party: last.party ? { on: last.party.on, k: last.party.k, col: last.party.col, order: last.party.order, s: last.party.s, cut: last.party.cut, forced: !!last.party.forced, beat: last.party.beat ? +last.party.beat.beatsF.toFixed(2) : null } : null, tv: S.lastTv, tvOff: !!last.tvOff, quiet: !!last.quiet, bed: last.bed || null, bedAt: last.bedAt || null, raidS: last.raidS == null ? null : last.raidS, cash: S.cashTrace, on: last.on.map(e => ({ id: e.id, win: e.win, el: +e.el.toFixed(1), len: e.len })), states: { ...last.states }, moods: last.moods || null, nightKey: last.nightKey || null, h: last.h, sec: last.sec, next: last.next, forced: last.forced, sec: Math.round(last.sec || 0), dark: last.dark, full: [...(last.full || [])], blocks: blocks.size, busy: busyNow, figs: traceList().slice(), box: lastBox }),
    destroy() { for (const cv of sprites.values()) cv.width = cv.height = 0; sprites.clear(); blocks.clear(); },
  };
}
