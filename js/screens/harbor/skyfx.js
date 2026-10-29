// CITY 2.0 — THE HARBOR, Part 6a: THE EVERYDAY SKY — the manager (docs/harbor/passes/part-6a.md). It owns the sky's pieces and decides
// what flies:
//   the scheduler's events   banner (daily, by day), helicopter (daily), balloons (calm clear mornings / summer evenings), the
//                            balloon festival (rare, heavy) — each piece's flight is a function of the event's start (every
//                            phone sees the same sky); the REAL weather is checked when it starts (a forbidden one stays home)
//   THE HOLIDAY SKY          on the clock (core/harbor-sky.js#SKY_HOLIDAYS): a skywriting / skytyping message by day (clear, low
//                            wind only), a DRONE SHOW at night — at the entry's local hour; Parts 11a–c fill it in, CITY CONTROL
//                            cancels / overrides (setSkyHoliday). Sky messages are otherwise API-only (no random ones).
//   the API (harbor().sky)   banner(lines, o) · skywrite(text) · skytype(text) · drones(specs, o) · balloons(o) · helicopter() ·
//                            fly(route, o) (Part 10's yacht landing) — each starts NOW (or at o.at, clock ms)
//   the previews (&force=)   banner[&text=A|B] · skywrite[&text=] · skytype[&text=] · drones[&text=A|B] (POLISH 4: a message only)
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
import { createAirShow, SHOW_LEN } from './jets.js';
import { createMeteors } from './meteors.js';
import { createAurora } from './aurora.js';
import { flybyDay } from '../../core/harbor-legend.js';
import { sunTimes } from '../../core/sky.js';
import { project } from '../../core/harbor-layout.js';
import { bannerPanels, eventMessage, smokeWeather, balloonWeather, bannerWeather, skyHolidayOn, saleDayOn, fillText, droneTimeline, DRONE_SHAPES, messagePages } from '../../core/harbor-sky.js';
import { LANES } from '../../core/harbor-events.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const hexRgb = h => { const n = parseInt(String(h).replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

export function createSkyFx({ games = [], clock, qp, dim = null, allow = null } = {}) {
  const may = (id, kind) => !allow || allow(id, kind);
  const aur = createAurora(), met = createMeteors(), show = createAirShow(), air = createAir(), banner = createBanner(), smoke = createSmoke(), birds = createBirds(), balloons = createBalloons(), drones = createDrones(), cel = createCelestial();
  let W = 1, H = 1, HZ = 1, L = null, lanes = null, waterTop = 0, waterY1 = 0, barge = null;
  const handled = new Set();                 // the scheduler's events already turned into pieces (id|start)
  let duskOf = null;                         // (POLISH 4: tonight's sunset hour for the surprise flyby, per date)
  const holiday = new Set();                 // the holiday sky's moments already started (date|day / date|night)
  let aurNow = 0, festival = false, last = null, forcedAt = new Map(), aurora = { on: false, strength: 0 }, lastSun = null;
  // THE PREVIEW PANEL: a preview it switched on flies FIRST from the clock ms its state began (every phone the same moment, a
  // late arrival mid-flight); its repeats start when they start, like a preview link's
  const firstAt = new Map();
  const force = clock ? clock.force : new Set();

  // ---- the pieces' lanes (what a plane may not use; what a scheduled event finds taken)
  function used() {
    const u = new Set();
    if (banner.on()) u.add('tagline');
    if (smoke.on()) { u.add('sky-high'); u.add('sky-low'); }
    if (balloons.on()) { u.add('sky-low'); if (festival) u.add('sky-high'); }
    if (air.heliOn()) u.add('sky-low');
    if (drones.on()) { u.add('sky-high'); u.add('sky-low'); u.add('water'); }
    if (show.on()) { u.add('sky-high'); u.add('sky-low'); }      // (6b: the air show / the missing man take the whole sky)
    return u;
  }
  const heavy = () => smoke.on() || drones.on() || show.on() || (balloons.on() && festival);

  // ---- starting pieces (s: the frame state)
  const startBanner = (s, lines, at, o = {}) => { const p = bannerPanels(lines); if (!p.length) return false; banner.start(p, at, { colour: o.colour, passes: o.passes || 2, dir: o.dir || (Math.floor(at / 1000) % 2 ? -1 : 1) }); return true; };
  // (6b: SKYWRITING IS CUT — every sky text message is skytyped; 'skywrite' stays an alias for old callers + links)
  function startSmoke(s, kind, text, at) {
    const t = String(text || '').trim();
    if (!t || !lanes) return false;
    const box = msgBox(s);
    if (!box) return false;
    const wd = s.L.windDir == null ? 250 : s.L.windDir;
    return smoke.start('skytype', t, box, at, { gust: Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1 });
  }
  // 6b — THE MESSAGE BOX: ONE layout for every sky message (skytyping by day, the drone show at night) — the whole open sky, from under
  // the corner buttons down to just above the TALLEST crown across it (its spire + the needle's tube: a margin); the NEON sign + the
  // tagline dim to a ghost while it's up (signFor). A wide screen keeps it to the middle ~60 %.
  function crownIn(s, x, w, y0) {
    let crown = H * 0.6;
    const sk = s && s.skyline;
    if (sk) for (let i = Math.max(0, Math.floor(x / 4)); i <= Math.min(sk.length - 1, Math.ceil((x + w) / 4)); i++) if (sk[i] < crown) crown = sk[i];
    if (L && L.towers) for (const t of L.towers) { const tp = t.tiers[t.tiers.length - 1], cx = (tp.x0 + tp.x1) / 2, [sx, sy] = project(L.cam, cx, tp.y0 + tp.h + (tp.crown ? tp.crown.h : 0) + (t.needle || 0), tp.z0); if (sx > x && sx < x + w && sy - 4 < crown && sy > y0 + 60) crown = sy - 4; }
    return crown;
  }
  function msgBox(s) {
    if (!L) return null;
    const wide = L.cam.wide, x = wide ? W * 0.2 : W * 0.04, w = wide ? W * 0.6 : W * 0.92;
    const y0 = Math.max(0, (s.safeTop || 0)) + 52;
    const y1 = crownIn(s, x, w, y0) - 14;
    return { x, y: y0, w, h: Math.max(60, y1 - y0) };
  }
  // THE BANNER'S LANE (6b, the owner): just under SPEAKEASY, through the tagline's band (the tagline fades out while it passes)
  function bannerLane(s) {
    const wr = s.textRects && s.textRects.word, tg = lanes && lanes.tagline;
    if (!wr) return tg ? { x: 0, y: tg.y - 6, w: W, h: 40 } : lanes && lanes['sky-high'];
    return { x: 0, y: wr.y + wr.h + 2, w: W, h: 40 };
  }
  // THE FORMATION'S BOX (NEON PASS 3, the owner: it sat down among the towers, lost in the city): OPEN SKY ONLY — from under the
  // tagline (or under the SPEAKEASY word once the tagline has faded: the freed band) down to the TALLEST crown across the box (its
  // spire + beacon: a margin), never over a tower, a roof sign or the NEON word. The drones still rise from the barge past the
  // city into it; the formation scales to fit (drones.js). A wide screen keeps the lane's own height.
  function droneBox(s) {
    const ln = lanes && lanes['sky-low'];
    if (!ln) return null;
    const x = ln.x + ln.w * 0.04, w = ln.w * 0.92;
    // (always the freed band: under the tagline there are only ~10–25 pt — the tagline steps aside while drones are up: skyBusyTag)
    const y0 = (ln.y0NoTag != null ? ln.y0NoTag : ln.y) + 4;
    let crown = ln.y + ln.h;
    const sk = s && s.skyline;
    if (sk) for (let i = Math.max(0, Math.floor(x / 4)); i <= Math.min(sk.length - 1, Math.ceil((x + w) / 4)); i++) if (sk[i] < crown) crown = sk[i];
    // (+ the thin spires the roofline leaves out: a crown's needle, THE NEON NEEDLE's tube above the needle tower)
    if (L && L.towers) for (const t of L.towers) { const tp = t.tiers[t.tiers.length - 1], cx = (tp.x0 + tp.x1) / 2, [sx, sy] = project(L.cam, cx, tp.y0 + tp.h + (tp.crown ? tp.crown.h : 0) + (t.needle || 0), tp.z0); if (sx > x && sx < x + w && sy - 4 < crown) crown = sy - 4; }
    const y1 = crown - 12;
    return { x, y: y0, w, h: Math.max(24, y1 - y0) };
  }
  function startDrones(s, specs0, at, o = {}) {
    let box = msgBox(s) || droneBox(s);
    // (9a — POLISH 5's known issue: the first line sat under the NEON sign's 15 % ghost — the drones' lines now start UNDER the letters:
    // below SPEAKEASY (its ghost too), the tagline's band free (it steps aside while drones fly), down to the crowns)
    const wr = s.textRects && (s.textRects.word || s.textRects.neon);
    if (box && wr) { const y0 = Math.max(box.y, wr.y + wr.h + 6), y1 = box.y + box.h; if (y1 - y0 >= 90) box = { ...box, y: y0, h: y1 - y0 }; }
    // (6b: a long message plays as PAGES — each its own formation, wrapped for the biggest letters in the box)
    const specs = [];
    // (POLISH 4: a MESSAGE only — no opening figure, no shapes: any { shape } asked for is left out)
    for (const sp of (specs0 || []).filter(sp => sp && sp.text != null)) {
      if (sp && sp.text != null && !sp.lines) { for (const pg of messagePages(fillText(sp.text, s.L.local ? s.L.local.y : 2026), { aspect: box ? box.w / box.h : 1.4 })) specs.push({ ...sp, text: pg.join(' '), lines: pg }); }
      else specs.push(sp);
    }
    if (!box || !barge || !specs || !specs.length) return false;
    // THE COLOURS (NEON PASS 2; CITY CONTROL's colour picker later): o.colour (one colour for the messages), o.colours + o.by
    // ('word' | 'letter': a colour per word / per letter), o.colour 'rainbow', o.cycle (the colours drift while a formation holds),
    // o.wave (default on: the new colours ripple across the swarm through each morph) — a spec's own col / cols win
    const C = v => (typeof v === 'string' && /^#?[0-9a-f]{6}$/i.test(v) ? hexRgb(v) : v);
    const out = specs.map(sp => (sp.text == null ? { ...sp, cycle: sp.cycle ?? !!o.cycle } : { ...sp, col: C(sp.col) || (sp.cols ? undefined : C(o.colour)), cols: sp.cols ? sp.cols.map(C) : o.colours ? o.colours.map(C) : undefined, by: sp.by || o.by, cycle: sp.cycle ?? !!o.cycle }));
    return drones.start(out, at, { box, barge, waterTop, year: s.L.local ? s.L.local.y : 2026, seed: o.seed || Math.floor(at / 1000), calm: !!o.calm, wave: o.wave });
  }
  function startBalloons(s, at, fest, seed, o = {}) {
    if (!lanes) return false;
    festival = !!fest;
    const wd = s.L.windDir == null ? 250 : s.L.windDir;
    // (6b: BALLOONS USE THE WHOLE SKY — from under the corner buttons to the crowns, behind the sign, in front of the sun + the moon)
    const mb = msgBox(s), box = mb ? { x: 0, y: mb.y, w: W, h: mb.h + 10 } : null;
    balloons.start({ at, seed, festival: fest, box, lanes: { 'sky-high': lanes['sky-high'], 'sky-low': lanes['sky-low'] }, windSign: Math.sin(wd * Math.PI / 180) >= 0 ? 1 : -1, fast: !!o.fast, fade: !!o.fade });
    return true;
  }

  // ---- 6b — THE SIGN MAKES ROOM FOR SKY MESSAGES (plan.md depth rule 2): while a message types / a drone show flies, the NEON sign +
  // the tagline power down on purpose — a dim with a flicker or two — to a faint GHOST (15 %), so unlit tubes never cut through the
  // message drawn behind them; it re-ignites once the last page has been read (~15 s after it's complete) while the message carries on
  // fading behind it. The banner plane only fades the tagline (it flies through its band). core/harbor-signdim.js via the scene.
  let msgAt = -1, msgOn = false;
  const FLICK = [[0, 0.55], [0.18, 1], [0.34, 0.3], [0.5, 0.8], [0.66, 0.15]];
  function signFor(s) {
    if (!dim) return;
    const now = s.now, on = (smoke.on() && !smoke.released(s)) || (drones.on() && !drones.released(now));
    if (on && !msgOn) msgAt = performance.now();
    msgOn = on;
    if (on) {
      const e = (performance.now() - msgAt) / 1000;
      let lv = 0.15; for (const [t0, v] of FLICK) if (e >= t0) lv = v;
      dim('msg', { logo: s.motion ? lv : 0.15, tag: 0, ms: e < 0.8 ? 70 : 1400 });
    } else dim('msg', null);
    dim('banner', banner.on() ? { logo: 1, tag: 0, ms: 1500 } : null);
  }

  // ---- what the frame starts: the scheduler's events, the holiday sky, the previews
  function sync(s, active, recent = []) {
    const u = used(), Lk = s.L;
    // 9a — THE BALLOONS STAY UP (45–90 min, their event's window 12): a flight launched before this page opened is still up — joined
    // mid-way (opening the city 30 min in shows it mid-sky); the weather is checked now, as when it starts
    if (!balloons.on()) for (const e of recent) {
      if (e.id !== 'balloons' && e.id !== 'balloon-festival') continue;
      const key = `${e.id}|${e.start}`, fest = e.id === 'balloon-festival';
      if (handled.has(key) || s.now - e.start > balloons.flightLen(e.seed, fest) * 1000 - 30000) continue;
      handled.add(key);
      if (balloonWeather(Lk) && (!fest || may('festival', 'rare'))) { startBalloons(s, e.start, fest, e.seed); break; }
    }
    for (const e of active) {
      const key = `${e.id}|${e.start}`;
      if (handled.has(key) || !['banner', 'helicopter', 'balloons', 'balloon-festival'].includes(e.id)) continue;
      handled.add(key); if (handled.size > 200) handled.clear();
      if (e.lanes.some(l => u.has(l))) continue;                             // (a holiday / API piece holds the lane)
      if (e.id === 'banner' && bannerWeather(Lk)) startBanner(s, eventMessage('banner', e.seed, games, s.holiday || null), e.start, { passes: 2 });   // (11a-1: a holiday's lines)
      else if (e.id === 'helicopter' && !Lk.storm && (Lk.wind || 0) < 14) air.heli(s, e.start, e.seed);
      else if ((e.id === 'balloons' || e.id === 'balloon-festival') && balloonWeather(Lk) && (e.id === 'balloons' || may('festival', 'rare'))) startBalloons(s, e.start, e.id === 'balloon-festival', e.seed);
    }
    // THE HOLIDAY SKY, on the clock: the entry's local hour → its clock ms; a piece starts there (a late arrival lands mid-way)
    const lc = Lk.local;
    if (lc && !Lk.alwaysNight) {
      const ent = skyHolidayOn(lc.y, lc.m, lc.d), hr = lc.h + lc.mi / 60 + (lc.s || 0) / 3600, date = `${lc.y}-${lc.m}-${lc.d}`;
      const atOf = h => s.now - (hr - h) * 3600e3;
      // (11a-2 — A SALE DAY's banner (core/harbor-sky.js#SALE_DAYS: Black Friday) on the clock: its passes, weather allowing)
      { const sd = saleDayOn(lc.y, lc.m, lc.d), sb = sd && sd.banner;
        if (sb && !holiday.has(`${date}|sale`) && hr >= sb.h && hr < sb.h + 0.08 && bannerWeather(Lk) && !banner.on() && !u.has('sky-high')) { if (startBanner(s, sb.text, atOf(sb.h), { passes: sb.passes })) holiday.add(`${date}|sale`); } }
      if (ent && ent.day && !holiday.has(`${date}|day`) && hr >= ent.day.h && hr < ent.day.h + 0.08 && smokeWeather(Lk) && !smoke.on()) {
        if (startSmoke(s, ent.day.kind, fillText(ent.day.text, lc.y), atOf(ent.day.h))) holiday.add(`${date}|day`);
      }
      // (6b: THE MILITARY JETS on their days — the missing man on Memorial + Veterans Day, the air show on July 4th; clear + by day)
      if (ent && ent.show && !holiday.has(`${date}|show`) && hr >= ent.show.h && hr < ent.show.h + SHOW_LEN[ent.show.kind] / 3600 && !show.on() && !Lk.rain && !Lk.storm && (Lk.cloud || 0) < 0.8 && may('airshow', 'holiday')) {
        if (show.start(ent.show.kind, atOf(ent.show.h))) holiday.add(`${date}|show`);
      }
      // (POLISH 4: THE SURPRISE FLYBY — ~twice a month, golden hour → 11 pm, mostly after dark; a few F-16s straight across on
      // afterburner, in a random direction; weather allowing; never over a show already flying)
      if (!duskOf || duskOf.date !== date) { const st = Lk.lat != null ? sunTimes(s.now, 'UTC', Lk.lat, Lk.lon) : null; duskOf = { date, h: st && st.set ? ((((st.set / 60000 + (lc.off || 0)) % 1440) + 1440) % 1440) / 60 : 19 }; }
      const fb = flybyDay(lc.y, lc.m, lc.d, duskOf.h);
      if (fb && !holiday.has(`${date}|flyby`) && hr >= fb.h && hr < fb.h + SHOW_LEN.flyby / 3600 && !show.on() && !Lk.storm && !(Lk.rain > 0.3) && (Lk.fog || 0) < 0.5) {
        if (show.start('flyby', atOf(fb.h), { dir: fb.dir, n: fb.n })) holiday.add(`${date}|flyby`);
      }
      if (ent && ent.night && !holiday.has(`${date}|night`) && hr >= ent.night.h && hr < ent.night.h + droneTimeline(ent.night.show.length, ent.calm).end / 3600 && !drones.on()
        && clamp01(Lk.w.night + Lk.w.late) > 0.6 && !(Lk.rain > 0.1) && !Lk.storm && (Lk.wind || 0) < 12 && may('drones', 'holiday')) {
        if (startDrones(s, ent.night.show, atOf(ent.night.h), { calm: ent.calm, seed: lc.y * 400 + lc.m * 31 + lc.d })) holiday.add(`${date}|night`);
      }
    }
    // THE PREVIEWS (&force=…): start at once, again a few seconds after each ends
    const again = (id, on, fn) => {
      if (!force.has(id) || on) return; const t = forcedAt.get(id) || 0; if (performance.now() - t < 2500) return; forcedAt.set(id, performance.now());
      const a = firstAt.get(id); firstAt.delete(id);
      fn(a != null ? a : s.now);
    };
    if (s.textRects && s.textRects.neon && lanes) {
      const text = qp && qp.get('text');
      again('banner', banner.on(), at => startBanner(s, text ? text.split('|') : ['FRESH LEMONADE', 'AT THE PIER'], at, { passes: 2 }));
      again('skywrite', smoke.on(), at => startSmoke(s, 'skytype', text || 'HELLO', at));     // (6b: skywriting cut — an old link types it)
      again('skytype', smoke.on(), at => startSmoke(s, 'skytype', text || 'HAPPY BIRTHDAY JESSICA', at));
      again('helicopter', air.heliOn(), at => air.heli(s, at, Math.floor(at / 1000)));
      again('jets', show.on(), at => show.start('airshow', at));
      again('missing-man', show.on(), at => show.start('missing', at));
      again('flyby', show.on(), at => show.start('flyby', at, { dir: (Math.floor(at / 1000) & 1) ? 1 : -1, n: 2 + (Math.floor(at / 7000) % 3) }));
      // (9a: the long flights — a preview joins a single flight 30 % in (in view); the FAST rows show the whole crossing ×12)
      again('balloons', balloons.on(), at => startBalloons(s, at - balloons.flightLen(3, false) * 300, false, 3, { fade: true }));
      again('balloon-festival', balloons.on(), at => startBalloons(s, at, true, 5));
      again('balloons-fast', balloons.on(), at => startBalloons(s, at, false, 3, { fast: true }));
      again('balloon-festival-fast', balloons.on(), at => startBalloons(s, at, true, 5, { fast: true }));
      again('drones', drones.on(), at => {
        // (POLISH 4: the drone show is A MESSAGE — its pages only; an old link's &show=heart,… is ignored)
        const msgs = (text || 'HELLO').split('|').map(t => ({ text: t.toUpperCase() }));
        const cs = qp && qp.get('colours') ? qp.get('colours').split(',') : null;
        startDrones(s, msgs, at, { calm: force.has('drones-calm'), colour: qp && qp.get('colour') ? (qp.get('colour') === 'rainbow' ? 'rainbow' : '#' + qp.get('colour').replace('#', '')) : undefined, colours: cs && cs.map(c => '#' + c.replace('#', '')), by: qp && qp.get('by'), cycle: !!(qp && qp.get('cycle')) });
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
      for (const m of [air, banner, smoke, birds, balloons, drones, cel, met, aur]) if (m.resize) m.resize(W, H, HZ);
      for (const m of [air, banner, smoke, balloons, drones, show]) if (m.setDpr) m.setDpr(o.dpr);
    },
    setLanes(l) { lanes = l; },
    /** THE PREVIEW PANEL changed the flags: gone = the &force= ids switched off (or changed: their pieces leave the sky at once);
     *  came = the ones switched on (or changed) — their first flight starts at `at` (clock ms) */
    remote(at, gone = [], came = []) {
      for (const id of came) { firstAt.set(id, at); forcedAt.delete(id); }
      for (const id of gone) {
        if (!came.includes(id)) firstAt.delete(id);
        if (id === 'banner') banner.stop();
        else if (id === 'skywrite' || id === 'skytype') smoke.stop();
        else if (id === 'drones') drones.stop();
        else if (id === 'jets' || id === 'missing-man' || id === 'flyby') show.stop();
        else if (id === 'balloons' || id === 'balloon-festival') balloons.stop();
      }
    },
    setTier(t) { for (const m of [air, banner, smoke, birds, drones, cel, aur]) if (m.setTier) m.setTier(t); },
    /** tonight's aurora (the scene: auroraTonight + the sky) — strength for the art */
    setAurora(a) { aurora = a || { on: false, strength: 0 }; },
    /** the frame's state: start what the scheduler / the clock / the previews ask (call once a frame, before drawing) */
    tick(s, active, recent) { last = s; if (lanes) sync(s, active, recent); signFor(s); },
    // ---- the draw passes (scene.js, far → near)
    /** the sun's golden-hour haze (after the sun's disc) */
    sunHaze: (c, s, sun) => { lastSun = sun || null; return cel.sunHaze(c, s, sun); },
    /** the sky layer (after the sun, before the clouds): planes + satellites + the helicopter, balloons, the banner, the smoke, geese */
    sky(c, s) {
      const u = used(), inUse = air.lanesInUse();
      const free = { 'sky-high': !u.has('sky-high'), 'sky-low': !u.has('sky-low') };
      if (!s.force.has('no-planes')) air.draw(c, s, free);
      balloons.draw(c, s);
      if (lanes) banner.draw(c, s, bannerLane(s));
      smoke.draw(c, s, lastSun);                                   // (POLISH 4: the sun, so the sky letters' dark halo firms up in front of its glare)
      if (show.on()) show.draw(c, s, msgBox(s));                 // (6b: the air show / the missing man — the whole open sky)
      if (!s.force.has('no-birds') && s.motion) birds.sky(c, s, { 'sky-high': free['sky-high'] && !inUse.has('sky-high'), 'sky-low': free['sky-low'] && !inUse.has('sky-low') });
    },
    /** POLISH 5 — CLOUDS NEVER COVER A MESSAGE: a skytyped message is up (the scene draws every cloud BEHIND it while it is) */
    msgUp: () => (smoke.on() ? smoke.bounds() : null),
    /** over the far rows: swifts + bats round the rooftops */
    low(c, s) { if (!s.force.has('no-birds') && s.motion) birds.low(c, s); },
    /** after the near city (before the water: the mirror doubles them): the drones up in the sky, the gulls over the harbor */
    city(c, s) {
      // (6b: the helicopter over the harbor, in front of the skyline — never behind a tower; its searchlight down to the waterline)
      air.heliDraw(c, s); air.beam(c, s, waterTop + (waterY1 - waterTop) * 0.35, 'upper', waterTop);
      drones.draw(c, s, 'sky');
      if (!s.force.has('no-birds') && lanes) birds.harbor(c, s, { x0: 0, x1: W, y0: lanes.skyline.y + lanes.skyline.h * 0.45, y1: waterTop - 6 });
    },
    /** after the harbor layer: the barge + the drones still low by it, the helicopter's searchlight down to the water */
    harbor(c, s) { if (aurNow > 0.02) { aur.reflect(c, aurNow, { y0: waterTop, y1: waterY1 }, s.t, s.motion); aurNow = 0; } drones.barge(c, s); drones.draw(c, s, 'low'); air.beam(c, s, waterTop + (waterY1 - waterTop) * 0.35, 'lower', waterTop); },
    /** after the near boats: the helicopter's searchlight down to the water */
    beam() { /* (6b: the searchlight draws with the helicopter now — city() + harbor()) */ },
    /** 6b: the shooting stars (district/fx.js's hook: rarer on the Harbor, their own art) */
    meteors: (c, s) => met.draw(c, s),
    /** the moon (district/fx.js's hook) */
    moon: (c, o) => cel.moon(c, o),
    /** SP: the moon's surroundings — the tagline's band (its 22° halo never crosses it), tonight's cirrostratus veil */
    moonSky: o => cel.skyIs(o),
    /** the aurora (district/fx.js's hook) */
    aurora(c, s) {
      const st = s.force.has('aurora') && !aurora.on ? 0.8 : aurora.strength;
      // (6b: City 1.0's smooth curtain re-fitted to the whole sky — its foot on the crowns, the city drawn over it — aurora.js)
      const y0 = Math.max(0, (s.safeTop || 0) + 20), y1 = crownIn(s, 0, W, y0) + 34;
      aur.draw(c, st, { y0, y1 }, s.t, s.motion); aurNow = st;
    },
    /** 6b — THE DIRECTOR: the heavy pieces up now ([{ id, kind }]) */
    heavies: () => [drones.on() ? { id: 'drones', kind: 'holiday' } : null, show.on() && show.kind() !== 'flyby' ? { id: 'airshow', kind: 'holiday' } : null, smoke.on() ? { id: 'skytype', kind: 'holiday' } : null, balloons.on() && festival ? { id: 'festival', kind: 'rare' } : null].filter(Boolean),
    /** lanes a heavy piece quiets (merged into the scheduler's quiet → fs.density) */
    quiet() { if (!heavy()) return []; const u = used(); return LANES.filter(l => !u.has(l)); },
    /** anything fast up there (the calm frame rate: 60 fps while it flies) */
    busy: () => show.on() || air.busy() || banner.on() || smoke.on() || drones.on() || birds.busy() || balloons.on(),
    /** (6b: the tagline steps aside through the sign-dim hook now — signFor) */
    holdTag: () => false,
    /** PART 8a — THE CITY SOUNDS (screens/harbor/sounds.js reads it ~4× a second): what's up there now — the planes + the
     *  helicopter (where), the banner plane, the skywriters, the balloons, the drone show, the birds */
    listen: () => ({ jets: last ? show.listen(last) : null, air: air.debug(), banner: banner.on(), smoke: smoke.on(), balloons: balloons.on() ? balloons.burn() : null, drones: drones.on(), birds: birds.debug() }),
    // ---- THE API (harbor().sky): each piece starts now, or at o.at (clock ms); → true if it could start
    api: {
      banner: (lines, o = {}) => !!last && startBanner(last, lines, o.at || last.now, o),
      skywrite: (text, o = {}) => !!last && startSmoke(last, 'skytype', text, o.at || last.now),   // (6b: skywriting cut — typed)
      skytype: (text, o = {}) => !!last && startSmoke(last, 'skytype', text, o.at || last.now),
      drones: (specs, o = {}) => !!last && startDrones(last, (Array.isArray(specs) ? specs : [specs]).map(x => (typeof x === 'string' ? (DRONE_SHAPES.includes(x) || x.startsWith('mark:') ? { shape: x } : { text: x }) : x)), o.at || last.now, o),
      balloons: (o = {}) => !!last && startBalloons(last, o.at || last.now, !!o.festival, o.seed || 3, { fast: !!o.fast, fade: !!o.fade }),
      helicopter: (o = {}) => { if (!last) return false; air.heli(last, o.at || last.now, o.seed || 1); return air.heliOn(); },
      /** 6b: the jets — airshow('airshow' | 'missing', { at }) */
      airshow: (kind = 'airshow', o = {}) => !!last && show.start(kind, o.at || last.now),
      fly: (route, o = {}) => { if (!last) return false; air.fly(last, route, o); return true; },
      stop: () => { banner.stop(); smoke.stop(); drones.stop(); balloons.stop(); show.stop(); },
    },
    debug: () => ({ meteors: met.debug(), show: show.debug(), cel: cel.debug(), air: air.debug(), banner: banner.debug(), smoke: smoke.debug(), birds: birds.debug(), balloons: balloons.debug(), drones: drones.debug(), barge, aurora, used: [...used()], heavy: heavy() }),
    destroy() { for (const m of [air, banner, smoke, balloons, drones, cel, show, met, aur]) m.destroy(); },
  };
}
