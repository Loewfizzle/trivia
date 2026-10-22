// CITY 2.0 — THE HARBOR, Part 6a: THE EVERYDAY SKY — the manager (docs/harbor.md#part-6a). It owns the sky's pieces and decides
// what flies:
//   the scheduler's events   banner (daily, by day), helicopter (daily), balloons (calm clear mornings / summer evenings), the
//                            balloon festival (rare, heavy) — each piece's flight is a function of the event's start (every
//                            phone sees the same sky); the REAL weather is checked when it starts (a forbidden one stays home)
//   THE HOLIDAY SKY          on the clock (core/harbor-sky.js#SKY_HOLIDAYS): a skywriting / skytyping message by day (clear, low
//                            wind only), a DRONE SHOW at night — at the entry's local hour; Parts 11a–c fill it in, CITY CONTROL
//                            cancels / overrides (setSkyHoliday). Sky messages are otherwise API-only (no random ones).
//   the API (harbor().sky)   banner(lines, o) · skywrite(text) · skytype(text) · drones(specs, o) · balloons(o) · helicopter() ·
//                            fly(route, o) (Part 10's yacht landing) — each starts NOW (or at o.at, clock ms)
//   the previews (&force=)   banner[&text=A|B] · skywrite[&text=] · skytype[&text=] · drones[&text=A|B&show=heart,star,mark:pulse]
//                            · helicopter · balloons · balloon-festival · aurora · planes · approach · geese · swifts · bats-dusk ·
//                            heron · satellites — they repeat while the page is open
// The planes keep to the FREE sky lanes (a lane a piece holds is never shared); a HEAVY piece (skywriting, skytyping, the drone
// show, the festival) quiets the rest of the city (quiet(): the scene merges it into fs.density).
import { createAir } from './air.js';
import { createBanner } from './banner.js';
import { createSmoke } from './smoke.js';
import { createBirds } from './birds.js';
import { createBalloons } from './balloons.js';
import { createDrones } from './drones.js';
import { createCelestial } from './moon.js';
import { project } from '../../core/harbor-layout.js';
import { bannerPanels, eventMessage, smokeWeather, balloonWeather, bannerWeather, skyHolidayOn, fillText, droneTimeline, DRONE_SHAPES, SKYWRITE_MAX } from '../../core/harbor-sky.js';
import { LANES } from '../../core/harbor-events.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createSkyFx({ games = [], clock, qp } = {}) {
  const air = createAir(), banner = createBanner(), smoke = createSmoke(), birds = createBirds(), balloons = createBalloons(), drones = createDrones(), cel = createCelestial();
  let W = 1, H = 1, HZ = 1, L = null, lanes = null, waterTop = 0, waterY1 = 0, barge = null;
  const handled = new Set();                 // the scheduler's events already turned into pieces (id|start)
  const holiday = new Set();                 // the holiday sky's moments already started (date|day / date|night)
  let festival = false, last = null, forcedAt = new Map(), aurora = { on: false, strength: 0 };
  const force = clock ? clock.force : new Set();

  // ---- the pieces' lanes (what a plane may not use; what a scheduled event finds taken)
  function used() {
    const u = new Set();
    if (banner.on()) u.add('sky-high');
    if (smoke.on()) { u.add('sky-high'); u.add('sky-low'); }
    if (balloons.on()) { u.add('sky-low'); if (festival) u.add('sky-high'); }
    if (air.heliOn()) u.add('sky-low');
    if (drones.on()) { u.add('sky-high'); u.add('sky-low'); u.add('water'); }
    return u;
  }
  const heavy = () => smoke.on() || drones.on() || (balloons.on() && festival);

  // ---- starting pieces (s: the frame state)
  const startBanner = (s, lines, at, o = {}) => { const p = bannerPanels(lines); if (!p.length) return false; banner.start(p, at, { colour: o.colour, passes: o.passes || 2, dir: o.dir || (Math.floor(at / 1000) % 2 ? -1 : 1) }); return true; };
  function startSmoke(s, kind, text, at) {
    const t = String(text || '').trim();
    if (!t || !lanes) return false;
    // (a message too long for one plane's letters goes to the skytypers)
    const k = kind === 'skywrite' && t.length > SKYWRITE_MAX ? 'skytype' : kind;
    return smoke.start(k, t, lanes['sky-high'], at);
  }
  function droneBox() {
    const ln = lanes && lanes['sky-low'];
    if (!ln) return null;
    const h = Math.max(ln.h, Math.min(ln.h * 1.4, waterTop - 26 - ln.y));
    return { x: ln.x + ln.w * 0.04, y: ln.y + 4, w: ln.w * 0.92, h: h - 6 };
  }
  function startDrones(s, specs, at, o = {}) {
    const box = droneBox();
    if (!box || !barge || !specs || !specs.length) return false;
    return drones.start(specs, at, { box, barge, waterTop, year: s.L.local ? s.L.local.y : 2026, seed: o.seed || Math.floor(at / 1000), calm: !!o.calm });
  }
  function startBalloons(s, at, fest, seed) {
    if (!lanes) return false;
    festival = !!fest;
    const wd = s.L.windDir == null ? 250 : s.L.windDir;
    balloons.start({ at, seed, festival: fest, lanes: { 'sky-high': lanes['sky-high'], 'sky-low': lanes['sky-low'] }, windSign: Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1 });
    return true;
  }

  // ---- what the frame starts: the scheduler's events, the holiday sky, the previews
  function sync(s, active) {
    const u = used(), Lk = s.L;
    for (const e of active) {
      const key = `${e.id}|${e.start}`;
      if (handled.has(key) || !['banner', 'helicopter', 'balloons', 'balloon-festival'].includes(e.id)) continue;
      handled.add(key); if (handled.size > 200) handled.clear();
      if (e.lanes.some(l => u.has(l))) continue;                             // (a holiday / API piece holds the lane)
      if (e.id === 'banner' && bannerWeather(Lk)) startBanner(s, eventMessage('banner', e.seed, games), e.start, { passes: 2 });
      else if (e.id === 'helicopter' && !Lk.storm && (Lk.wind || 0) < 14) air.heli(s, e.start, e.seed);
      else if ((e.id === 'balloons' || e.id === 'balloon-festival') && balloonWeather(Lk)) startBalloons(s, e.start, e.id === 'balloon-festival', e.seed);
    }
    // THE HOLIDAY SKY, on the clock: the entry's local hour → its clock ms; a piece starts there (a late arrival lands mid-way)
    const lc = Lk.local;
    if (lc && !Lk.alwaysNight) {
      const ent = skyHolidayOn(lc.y, lc.m, lc.d), hr = lc.h + lc.mi / 60 + (lc.s || 0) / 3600, date = `${lc.y}-${lc.m}-${lc.d}`;
      const atOf = h => s.now - (hr - h) * 3600e3;
      if (ent && ent.day && !holiday.has(`${date}|day`) && hr >= ent.day.h && hr < ent.day.h + 0.08 && smokeWeather(Lk) && !smoke.on()) {
        if (startSmoke(s, ent.day.kind, fillText(ent.day.text, lc.y), atOf(ent.day.h))) holiday.add(`${date}|day`);
      }
      if (ent && ent.night && !holiday.has(`${date}|night`) && hr >= ent.night.h && hr < ent.night.h + droneTimeline(ent.night.show.length, ent.calm).end / 3600 && !drones.on()
        && clamp01(Lk.w.night + Lk.w.late) > 0.6 && !(Lk.rain > 0.1) && !Lk.storm && (Lk.wind || 0) < 12) {
        if (startDrones(s, ent.night.show, atOf(ent.night.h), { calm: ent.calm, seed: lc.y * 400 + lc.m * 31 + lc.d })) holiday.add(`${date}|night`);
      }
    }
    // THE PREVIEWS (&force=…): start at once, again a few seconds after each ends
    const again = (id, on, fn) => { if (!force.has(id) || on) return; const t = forcedAt.get(id) || 0; if (performance.now() - t < 2500) return; forcedAt.set(id, performance.now()); fn(); };
    if (s.textRects && s.textRects.neon && lanes) {
      const text = qp && qp.get('text');
      again('banner', banner.on(), () => startBanner(s, text ? text.split('|') : ['FRESH LEMONADE', 'AT THE PIER'], s.now, { passes: 2 }));
      again('skywrite', smoke.on(), () => startSmoke(s, 'skywrite', text || 'HELLO', s.now));
      again('skytype', smoke.on(), () => startSmoke(s, 'skytype', text || 'HAPPY BIRTHDAY STEVE', s.now));
      again('helicopter', air.heliOn(), () => air.heli(s, s.now, Math.floor(s.now / 1000)));
      again('balloons', balloons.on(), () => startBalloons(s, s.now, false, 3));
      again('balloon-festival', balloons.on(), () => startBalloons(s, s.now, true, 5));
      again('drones', drones.on(), () => {
        const show = (qp && qp.get('show') ? qp.get('show').split(',') : ['heart']).map(t => (DRONE_SHAPES.includes(t) || t.startsWith('mark:') ? { shape: t } : { text: t.toUpperCase() }));
        const msgs = (text || 'HELLO').split('|').map(t => ({ text: t.toUpperCase() }));
        startDrones(s, qp && qp.get('show') ? [...show, ...msgs] : [show[0], ...msgs, { shape: 'star' }], s.now, { calm: force.has('drones-calm') });
      });
    }
  }

  return {
    /** a re-layout: the camera's sky lanes, the water's top (the drones + the gulls), the barge's place */
    layout(l, o) {
      L = l; lanes = l.lanes; W = l.cam.W; H = l.cam.H; HZ = o.HZ; waterTop = o.waterTop; waterY1 = o.waterY1;
      // (the barge: open water in front of Rosie's landing — nearer than the wheel, the lighthouse and Rosie; behind the taxi)
      const cam = l.cam, z = 108, xs = W * (cam.wide ? 0.6 : 0.71), wx = (xs - cam.VPX) * z / cam.F, [bx, by] = project(cam, wx, -0.8, z);
      barge = { x: bx, y: by, w: cam.F * 13 / z };
      for (const m of [air, banner, smoke, birds, balloons, drones, cel]) if (m.resize) m.resize(W, H, HZ);
      for (const m of [air, banner, smoke, balloons, drones]) if (m.setDpr) m.setDpr(o.dpr);
    },
    setLanes(l) { lanes = l; },
    setTier(t) { for (const m of [air, banner, smoke, birds, drones, cel]) if (m.setTier) m.setTier(t); },
    /** tonight's aurora (the scene: auroraTonight + the sky) — strength for the art */
    setAurora(a) { aurora = a || { on: false, strength: 0 }; },
    /** the frame's state: start what the scheduler / the clock / the previews ask (call once a frame, before drawing) */
    tick(s, active) { last = s; if (lanes) sync(s, active); },
    // ---- the draw passes (scene.js, far → near)
    /** the sun's golden-hour haze (after the sun's disc) */
    sunHaze: (c, s, sun) => cel.sunHaze(c, s, sun),
    /** the sky layer (after the sun, before the clouds): planes + satellites + the helicopter, balloons, the banner, the smoke, geese */
    sky(c, s) {
      const u = used(), inUse = air.lanesInUse();
      const free = { 'sky-high': !u.has('sky-high'), 'sky-low': !u.has('sky-low') };
      if (!s.force.has('no-planes')) air.draw(c, s, free);
      balloons.draw(c, s);
      if (lanes) banner.draw(c, s, lanes['sky-high']);
      smoke.draw(c, s);
      if (!s.force.has('no-birds') && s.motion) birds.sky(c, s, { 'sky-high': free['sky-high'] && !inUse.has('sky-high'), 'sky-low': free['sky-low'] && !inUse.has('sky-low') });
    },
    /** over the far rows: swifts + bats round the rooftops */
    low(c, s) { if (!s.force.has('no-birds') && s.motion) birds.low(c, s); },
    /** after the near city (before the water: the mirror doubles them): the drones up in the sky, the gulls over the harbor */
    city(c, s) {
      drones.draw(c, s, 'sky');
      if (!s.force.has('no-birds') && lanes) birds.harbor(c, s, { x0: 0, x1: W, y0: lanes.skyline.y + lanes.skyline.h * 0.45, y1: waterTop - 6 });
    },
    /** after the harbor layer: the barge + the drones still low by it, the helicopter's searchlight down to the water */
    harbor(c, s) { drones.barge(c, s); drones.draw(c, s, 'low'); },
    /** after the near boats: the helicopter's searchlight down to the water */
    beam(c, s) { air.beam(c, s, waterTop + (waterY1 - waterTop) * 0.35); },
    /** the moon (district/fx.js's hook) */
    moon: (c, o) => cel.moon(c, o),
    /** the aurora (district/fx.js's hook) */
    aurora(c, s) {
      const st = s.force.has('aurora') && !aurora.on ? 0.8 : aurora.strength;
      const ln = lanes && lanes['sky-low'];
      cel.aurora(c, s, st, { y0: Math.max(0, (s.safeTop || 0) + 20), y1: ln ? ln.y + ln.h + 24 : HZ * 0.7 });
    },
    /** lanes a heavy piece quiets (merged into the scheduler's quiet → fs.density) */
    quiet() { if (!heavy()) return []; const u = used(); return LANES.filter(l => !u.has(l)); },
    /** anything fast up there (the calm frame rate: 60 fps while it flies) */
    busy: () => air.busy() || banner.on() || smoke.on() || drones.on() || birds.busy() || balloons.on(),
    // ---- THE API (harbor().sky): each piece starts now, or at o.at (clock ms); → true if it could start
    api: {
      banner: (lines, o = {}) => !!last && startBanner(last, lines, o.at || last.now, o),
      skywrite: (text, o = {}) => !!last && startSmoke(last, 'skywrite', text, o.at || last.now),
      skytype: (text, o = {}) => !!last && startSmoke(last, 'skytype', text, o.at || last.now),
      drones: (specs, o = {}) => !!last && startDrones(last, (Array.isArray(specs) ? specs : [specs]).map(x => (typeof x === 'string' ? (DRONE_SHAPES.includes(x) || x.startsWith('mark:') ? { shape: x } : { text: x }) : x)), o.at || last.now, o),
      balloons: (o = {}) => !!last && startBalloons(last, o.at || last.now, !!o.festival, o.seed || 3),
      helicopter: (o = {}) => { if (!last) return false; air.heli(last, o.at || last.now, o.seed || 1); return air.heliOn(); },
      fly: (route, o = {}) => { if (!last) return false; air.fly(last, route, o); return true; },
      stop: () => { banner.stop(); smoke.stop(); drones.stop(); balloons.stop(); },
    },
    debug: () => ({ cel: cel.debug(), air: air.debug(), banner: banner.debug(), smoke: smoke.debug(), birds: birds.debug(), balloons: balloons.debug(), drones: drones.debug(), barge, aurora, used: [...used()], heavy: heavy() }),
    destroy() { for (const m of [air, banner, smoke, balloons, drones, cel]) m.destroy(); },
  };
}
