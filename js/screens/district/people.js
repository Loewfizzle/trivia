// THE STREET, Part 2 — the people (docs/title.md "THE STREET"; the rules: core/people.js). scene.js calls:
//   back(c, fs)        after the street furniture: THE SPEAKEASY'S DOOR (its own layer: sconce, peephole, knob, the pink neon glass,
//                      the doorman, visits, the hint, the knock; party nights: brass posts, the velvet rope, the line), the people on
//                      the sidewalk (walking, a couple, a dog walker, someone at the shelter, the cab hailer), umbrellas, holidays
//   ground(c, fs, streak)  after the street's reflections: the door's light on the sidewalk and in the wet street, umbrellas' colours
//                      in the wet street, footprints in the snow
// A person is ~10 pt tall (the owner's call, Oct 21): light and colour carry them (a lamp-side rim, an umbrella, the lit doorway).
// Talks with street.js through two small shared objects: hail (the cab hail) and stop (the bus at its shelter).
import { pedWant, pedKind, umbrellaFor, doorGap, visitSlot, hintDue, hailGap, lineLength, holidayStreet } from '../../core/people.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

const WARM = [255, 196, 128], PINK = [255, 70, 170], SKIN = [196, 160, 136];
const COATS = [[48, 56, 82], [92, 92, 100], [140, 112, 80], [70, 84, 60], [110, 40, 46], [36, 36, 42], [168, 150, 120]];
const P_H = 10;                                       // a person's height in K

export function createPeople() {
  let W = 1, H = 1, HZ = 1, K = 1, tier = 2;
  const glowC = new Map();
  const glow = c => { const k = c.map(v => Math.round(v / 16) * 16).join(','); let g = glowC.get(k); if (!g) { g = mk(64, 64); const x = g.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${k},1)`); gr.addColorStop(0.3, `rgba(${k},0.45)`); gr.addColorStop(1, `rgba(${k},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowC.set(k, g); } return g; };
  let peds = [], nextId = 1, prints = [], line = [], sparks = [];
  const door = { open: 0, openUntil: 0, peep: 0, peepUntil: 0, lastSlot: null, knockAt: -99, lastHintS: null, rect: null, side: 1 };
  const hail = { id: null, x: 0, state: null, cab: null, lastSlot: null };   // street.js reads it and writes .cab ('coming'|'stopped'|'gone')
  const stop = { x: 0, dwell: false, lastDwell: false };                    // street.js writes .dwell while the bus waits at the shelter
  let restAt = performance.now(), lastSecond = -1;
  const onInput = () => { restAt = performance.now(); door.lastHintS = null; };
  if (typeof window !== 'undefined') { window.addEventListener('pointerdown', onInput, { passive: true }); window.addEventListener('keydown', onInput); }
  let dbg = { visits: 0, hints: 0, hails: 0, boarded: 0, knocks: 0 };

  // ---------------------------------------------------------------- the people
  function spawn(fs, o = {}) {
    const { L } = fs;
    const hr = L.local ? L.local.h + L.local.mi / 60 : 20;
    const kind = o.kind || pedKind(Math.random(), hr);
    const dir = o.dir || (Math.random() < 0.5 ? 1 : -1);
    const snow = (L.snow || 0) > 0.3;
    const umb = fs.force.has('umbrellas') ? [[214, 44, 52], [40, 92, 196], [236, 186, 40], [26, 26, 32]][nextId % 4] : umbrellaFor(Math.random(), L, Math.random());
    const p = {
      id: nextId++, kind, dir, x: o.x != null ? o.x : dir > 0 ? -12 * K : W + 12 * K, sp: (9 + Math.random() * 4) * K * (snow ? 0.72 : 1) * (kind === 'dog' ? 0.85 : 1),
      h: (P_H + (Math.random() - 0.5) * 1.6) * K, coat: COATS[Math.floor(Math.random() * COATS.length)], ph: Math.random() * TAU,
      umb: kind === 'dog' && umb ? null : umb, hood: snow, alpha: o.alpha ?? 0, state: o.state || 'walk', target: o.target ?? null, kid: !!o.kid, lantern: !!o.lantern, sparkler: !!o.sparkler, life: 0,
    };
    if (kind === 'couple') p.mate = { h: p.h * (0.9 + Math.random() * 0.12), coat: COATS[Math.floor(Math.random() * COATS.length)], umb: p.umb && Math.random() < 0.5 ? null : p.umb };
    peds.push(p);
    return p;
  }

  function figure(c, x, y, h, coat, ph, moving, dark, rim, umb, hood, kid) {
    // a small silhouette: head, coat, legs with a stride; a rim of lamp light on the lamp side; an umbrella's coloured dome
    const s = h / P_H;
    const col = dark > 0.5 ? mix(coat, [14, 14, 22], 0.82) : coat;
    const stride = moving ? Math.sin(ph) : 0;
    c.fillStyle = rgba(col.map(v => v * 0.8), 1);
    // legs
    c.fillRect(x - 0.9 * s * K + stride * 0.9 * s * K, y - 3.6 * s * K, 0.85 * s * K, 3.6 * s * K);
    c.fillRect(x + 0.05 * s * K - stride * 0.9 * s * K, y - 3.6 * s * K, 0.85 * s * K, 3.6 * s * K);
    // the coat (a soft trapezoid)
    c.fillStyle = rgba(col, 1);
    c.beginPath(); c.moveTo(x - 1.7 * s * K, y - 3.4 * s * K); c.lineTo(x + 1.7 * s * K, y - 3.4 * s * K); c.lineTo(x + 1.25 * s * K, y - 8.2 * s * K); c.lineTo(x - 1.25 * s * K, y - 8.2 * s * K); c.closePath(); c.fill();
    // the head (a hood in the snow)
    c.fillStyle = dark > 0.5 ? rgba([18, 16, 22], 1) : hood ? rgba(col, 1) : rgba(kid ? [120, 84, 60] : [62, 46, 40], 1);
    c.beginPath(); c.arc(x, y - 9 * s * K, (hood ? 1.25 : 1.05) * s * K, 0, TAU); c.fill();
    if (dark < 0.5 && !hood) { c.fillStyle = rgba(SKIN, 0.9); c.beginPath(); c.arc(x + 0.25 * s * K, y - 8.9 * s * K, 0.6 * s * K, 0, TAU); c.fill(); }
    // the rim of light on the side facing the nearest lamp (or the sconce) — drawn in one additive pass after everyone
    if (rim && rim.k > 0.03) rims.push({ x, y, s, side: rim.side, col: rim.col, a: Math.min(1, rim.k) * c.globalAlpha });
    // the umbrella: a coloured dome with a soft highlight (the best-reading part of a rainy street)
    if (umb) {
      const uy = y - 11.4 * s * K, uw = 5 * s * K, uh = 2.6 * s * K;
      const lit = dark > 0.5 ? 0.78 + 0.45 * (rim ? rim.k : 0) : 1;
      c.strokeStyle = rgba([20, 20, 26], 0.9); c.lineWidth = 0.35 * K; c.beginPath(); c.moveTo(x, uy); c.lineTo(x, y - 8 * s * K); c.stroke();
      // the dome, its scalloped rim, a soft highlight; at night it catches a little of the street's light
      const col = umb.map(v => Math.min(255, v * lit));
      c.fillStyle = rgba(col, 1);
      c.beginPath(); c.ellipse(x, uy, uw, uh, 0, Math.PI, TAU); c.closePath(); c.fill();
      c.fillStyle = rgba(col.map(v => v * 0.72), 1);
      for (let k = 0; k < 4; k++) { const sx = x - uw + (k + 0.5) * (uw / 2); c.beginPath(); c.ellipse(sx, uy, uw / 4, 0.42 * s * K, 0, 0, Math.PI); c.fill(); }
      c.fillStyle = rgba(mix(umb, [255, 255, 255], 0.6), 0.6 * lit); c.beginPath(); c.ellipse(x - uw * 0.28, uy - uh * 0.48, uw * 0.42, 0.5 * s * K, -0.18, 0, TAU); c.fill();
      if (dark > 0.5) glows.push({ col: umb.map(v => Math.max(v, 60)), x: x - uw * 1.5, y: uy - uh * 2, w: uw * 3, h: uh * 3, a: (0.18 + 0.25 * (rim ? rim.k : 0)) * c.globalAlpha });
    }
  }

  function rimFor(x, fs, doorX) {
    // the nearest lit lamp (or the door's sconce at night) lights one side
    const lamps = (fs.street && fs.street.lamps) || [];
    let best = null;
    for (const l of lamps) { const d = Math.abs(l.x - x); if (l.lit > 0.05 && d < 34 * K && (!best || d < best.d)) best = { d, x: l.x, col: l.col, lit: l.lit * (1 + (l.boost || 0) * 0.5) }; }
    if (doorX != null && doorSconce > 0.05) { const d = Math.abs(doorX - x); if (d < 22 * K && (!best || d < best.d)) best = { d, x: doorX, col: WARM, lit: doorSconce }; }
    if (!best) return null;
    return { side: Math.sign(best.x - x) || 1, col: best.col, k: best.lit * (1 - best.d / (34 * K)) * 1.1 };
  }
  let doorSconce = 0, lastHol = null;
  const rims = [], glows = [];
  function lightPass(c) {
    if (!rims.length && !glows.length) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const g of glows) { c.globalAlpha = g.a; c.drawImage(glow(g.col), g.x, g.y, g.w, g.h); }
    for (const r of rims) {
      c.globalAlpha = r.a; c.fillStyle = rgba(r.col, 1);
      const sx = r.x + r.side * 1.45 * r.s * K;
      c.fillRect(sx - (r.side > 0 ? 0.7 : 0) * r.s * K, r.y - 8.1 * r.s * K, 0.7 * r.s * K, 4.7 * r.s * K);
      c.fillRect(r.x + r.side * 0.6 * r.s * K - 0.6 * r.s * K, r.y - 9.8 * r.s * K, 1.2 * r.s * K, 1.2 * r.s * K);
    }
    c.restore();
    rims.length = 0; glows.length = 0;
  }

  // ---------------------------------------------------------------- per frame
  function back(c, fs) {
    const info = fs.street;
    if (!info || !info.door) return;
    const { L, t, dt } = fs;
    const sec = Math.min(0.1, dt / 1000), speed = Math.min(8, fs.speed || 1), now = fs.now;
    const motion = fs.motion, hr = L.local ? L.local.h + L.local.mi / 60 : 20;
    const dark = clamp01(L.w.night + L.w.late + (L.alwaysNight ? 1 : 0));
    const party = fs.party && fs.party.on > 0 ? fs.party : null;
    const phone = W < 760 || H > W;
    const hol = holidayStreet(L, { finale: party && party.finale }); lastHol = hol;
    const dx = info.door.x;
    door.side = (info.door.right - dx) >= (dx - info.door.left) ? 1 : -1;      // the line forms on the roomier side
    doorSconce = dark;
    // ---- the door's life: visits (a little story), the hint, party nights
    const gap = fs.force.has('door') ? 0.3 : doorGap(hr, party ? party.ramp : 0);
    const slot = visitSlot(now, gap);
    if (slot != null && slot !== door.lastSlot && door.lastSlot != null && dark > 0.3) {
      if (party && line.length) { door.admit = true; }
      else spawn(fs, { kind: 'solo', state: 'visit', target: dx, dir: Math.random() < 0.5 ? 1 : -1 });
      dbg.visits++;
    }
    door.lastSlot = slot;
    // the hint: resting a while, the peephole flicks open now and then on its own (an invitation to the curious)
    const restS = (performance.now() - restAt) / 1000 * (fs.speed > 1 ? fs.speed : 1);
    if (dark > 0.3 && (fs.force.has('hint') ? t - (door.lastHintT || -99) > 6 : hintDue(restS, door.lastHintS))) { door.lastHintS = restS; door.lastHintT = t; door.peepUntil = t + 1; dbg.hints++; }
    if (door.admit) { door.admit = false; door.peepUntil = t + 0.5; door.openUntil = t + 2.4; if (line.length) line[0].entering = true; }
    // ---- the party line: brass posts, the velvet rope, 3–6 waiting (rim-lit in the party's colours), thinning after hours
    const want = (fs.force.has('line') ? 5 : Math.max(lineLength(party, phone), hol.nyeLine)) * (dark > 0.3 ? 1 : 0);
    const spacing = 5.2 * K, start = 13 * K;
    const room = Math.max(0, (door.side > 0 ? info.door.right - dx : dx - info.door.left) - start - 3 * K);
    const fit = Math.min(want, 1 + Math.floor(room / spacing));
    while (line.filter(m => !m.leaving && !m.entering).length < fit) line.push({ slot: line.length, x: null, alpha: 0, h: (P_H + (Math.random() - 0.5) * 1.6) * K, coat: COATS[Math.floor(Math.random() * COATS.length)], ph: Math.random() * TAU, col: party && party.palette ? party.palette[line.length % party.palette.length] : PINK, sparkler: false });
    const live = line.filter(m => !m.leaving && !m.entering);
    if (live.length > fit) live[live.length - 1].leaving = true;
    // ---- the people on the street
    const wantP = Math.max(0, pedWant(hr, { dow: L.local ? L.local.dow : 3, party: party ? party.ramp : 0, rain: L.rain || 0, phone }) + (fs.force.has('peds') ? 3 : 0) - (tier === 1 ? 1 : 0));
    const cap = tier === 0 ? 1 : tier === 1 ? Math.ceil(wantP / 2) + 1 : wantP;
    const walking = peds.filter(p => p.state === 'walk').length;
    if (walking < Math.min(cap, wantP) && Math.random() < sec * (fs.force.has('peds') ? 2 : 0.35) * speed) spawn(fs, fs.force.has('peds') && !peds.length ? { x: W * (0.2 + Math.random() * 0.6), alpha: 1 } : {});
    // Halloween evening: a small group of trick-or-treaters with glowing jack-o'-lanterns (rare, never a crowd)
    if ((hol.halloweenKids || fs.force.has('halloween-kids')) && dark > 0.3 && !peds.some(p => p.kid) && Math.random() < sec * 0.12 * speed) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      for (let k = 0; k < 2 + (Math.random() < 0.5 ? 1 : 0); k++) { const p = spawn(fs, { kind: 'solo', kid: true, lantern: true, dir, x: (dir > 0 ? -12 : W + 12) - dir * k * 6 * K }); p.h = (6.6 + Math.random()) * K; p.sp = 8 * K; }
    }
    // July 4th after dark: sparklers on the sidewalk
    if ((hol.sparklers && !hol.nyeSparklers || fs.force.has('sparklers')) && dark > 0.3 && !peds.some(p => p.sparkler) && Math.random() < sec * 0.1 * speed) spawn(fs, { kind: 'solo', sparkler: true });
    // the bus stop: someone waits; boards when the bus stops; now and then someone steps off
    if (info.shelter) {
      stop.x = info.shelter.x;
      const waiting = peds.find(p => p.state === 'wait');
      if (!waiting && Math.random() < sec * (fs.force.has('peds') ? 0.5 : 0.05) * speed && !(hr >= 2 && hr < 5)) spawn(fs, { kind: 'solo', state: 'towait', target: info.shelter.x + (Math.random() - 0.5) * 6 * K });
      if (stop.dwell && !stop.lastDwell) {
        for (const p of peds) if (p.state === 'wait') { p.state = 'board'; dbg.boarded++; }
        if (Math.random() < 0.6) { const off = spawn(fs, { kind: 'solo', x: info.shelter.x, state: 'walk', alpha: 0 }); off.delay = 1.2; }
      }
      stop.lastDwell = stop.dwell;
    }
    // the cab hail: someone at the curb steps forward; street.js sends a cab that pulls over, its door light flicks on, they go
    const hg = fs.force.has('hail') ? 0.35 : hailGap(hr, party ? party.ramp : 0);
    const hs = Number.isFinite(hg) ? Math.floor(now / 60000 / hg) : null;
    if (hs != null && hs !== hail.lastSlot && hail.lastSlot != null && !hail.id && dark > 0.2) {
      const lo = W * 0.15, hi = W * 0.85;
      const target = lo + Math.random() * (hi - lo);
      const p = spawn(fs, { kind: 'solo', state: 'tohail', target, dir: target > W / 2 ? -1 : 1 });
      hail.id = p.id; hail.x = target; hail.state = 'walking'; hail.cab = null; dbg.hails++;
    }
    hail.lastSlot = hs;
    // ---- move everyone
    const slow = motion ? 1 : 0.55;           // Reduced effects: people still walk, slowly
    for (const p of peds) {
      p.life += sec;
      if (p.delay > 0) { p.delay -= sec; continue; }
      const edgeA = clamp01(Math.min(p.x + 10 * K, W + 10 * K - p.x) / (14 * K));
      const toward = (x, then) => { const d = x - p.x; p.dir = Math.sign(d) || p.dir; if (Math.abs(d) < 1 * K) { p.x = x; then(); } else p.x += p.dir * Math.min(Math.abs(d), p.sp * sec * slow * Math.min(3, speed)); };
      if (p.state === 'walk') { p.x += p.dir * p.sp * sec * slow * Math.min(3, speed); p.alpha = Math.min(edgeA, p.alpha + sec * 2); }
      else if (p.state === 'visit') { p.alpha = Math.min(edgeA, p.alpha + sec * 2); toward(dx, () => { p.state = 'atdoor'; p.wait = 0.9; door.peepUntil = t + 0.6; }); }
      else if (p.state === 'atdoor') { p.wait -= sec; if (p.wait <= 0 && door.openUntil < t) { door.openUntil = t + 2.2; p.state = 'enter'; } }
      else if (p.state === 'enter') { p.alpha -= sec * 1.3; if (p.alpha <= 0) p.gone = true; }
      else if (p.state === 'towait') { p.alpha = Math.min(edgeA, p.alpha + sec * 2); toward(p.target, () => { p.state = 'wait'; }); }
      else if (p.state === 'wait') { p.alpha = Math.min(1, p.alpha + sec); }
      else if (p.state === 'board') { p.alpha -= sec * 1.6; p.x += (stop.x - p.x) * Math.min(1, sec * 2); if (p.alpha <= 0) p.gone = true; }
      else if (p.state === 'tohail') { p.alpha = Math.min(edgeA, p.alpha + sec * 2); toward(p.target, () => { p.state = 'hailing'; hail.state = 'waiting'; p.step = 0; }); }
      else if (p.state === 'hailing') {
        p.step = Math.min(1, p.step + sec * 1.5);                               // steps forward toward the street
        if (hail.cab === 'stopped') { p.state = 'gettingin'; p.t0 = t; }
        if (p.life > 60) { p.state = 'walk'; hail.id = null; hail.state = null; }   // (no cab came: walks on)
      } else if (p.state === 'gettingin') { if (t - p.t0 > 0.7) { p.alpha -= sec * 2.5; if (p.alpha <= 0) { p.gone = true; hail.state = 'in'; } } }
      if (p.state === 'walk' && ((p.dir > 0 && p.x > W + 16 * K) || (p.dir < 0 && p.x < -16 * K))) p.gone = true;
      // footprints in the snow, fading
      if ((L.snow || 0) > 0.3 && motion && p.state === 'walk' && Math.random() < sec * 3) prints.push({ x: p.x, a: 1 });
    }
    if (hail.state === 'in' && hail.cab === 'gone') { hail.id = null; hail.state = null; hail.cab = null; }
    peds = peds.filter(p => !p.gone);
    prints = prints.filter(f => (f.a -= sec / 40) > 0).slice(-60);
    // ---- draw: the door first (the people pass in front of it)
    if (!fs.force.has('no-pp-door')) drawDoor(c, fs, info, dark, party, hol, t);
    if (!fs.force.has('no-pp-figs')) for (const p of peds) {
      if (p.delay > 0 || p.alpha <= 0.01) continue;
      const moving = p.state === 'walk' || p.state === 'visit' || p.state === 'towait' || p.state === 'tohail';
      if (moving && motion) p.ph += sec * (p.sp / K) * 0.55 * Math.min(3, speed);
      const y = HZ - 0.2 * K + (p.state === 'hailing' || p.state === 'gettingin' ? p.step * 1.6 * K : 0);
      const rim = dark > 0.3 ? rimFor(p.x, fs, info.door.x) : null;
      c.globalAlpha = clamp01(p.alpha);
      figure(c, p.x, y, p.h, p.coat, p.ph, moving, dark, rim, p.umb, p.hood, p.kid);
      if (p.mate) figure(c, p.x - p.dir * 3.2 * K, y, p.mate.h, p.mate.coat, p.ph + 1.4, moving, dark, rim, p.mate.umb, p.hood, false);
      if (p.kind === 'dog') { const gx = p.x + p.dir * 4.5 * K; c.fillStyle = dark > 0.5 ? 'rgba(16,14,20,1)' : 'rgba(110,80,52,1)'; c.fillRect(gx - 1.6 * K, y - 2.2 * K, 3.2 * K, 1.2 * K); c.fillRect(gx + p.dir * 1.4 * K - 0.5 * K, y - 2.9 * K, 1 * K, 1 * K); c.fillRect(gx - 1.3 * K, y - 1.1 * K, 0.5 * K, 1.1 * K); c.fillRect(gx + 0.9 * K, y - 1.1 * K, 0.5 * K, 1.1 * K); }
      // a raised arm toward the street (the hail reads by the step forward and the cab's light, not the arm)
      if (p.state === 'hailing') { c.strokeStyle = rgba(dark > 0.5 ? [18, 18, 26] : p.coat, 1); c.lineWidth = 0.7 * K; c.beginPath(); c.moveTo(p.x, y - 7.4 * K); c.lineTo(p.x + p.dir * 1.6 * K, y - 10.6 * K); c.stroke(); }
      // the jack-o'-lantern / the sparkler (light and motion: what reads)
      if (p.lantern) { const by = y - 3.8 * K + Math.sin(p.ph * 2) * 0.5 * K, bx = p.x + p.dir * 1.6 * K; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp01(p.alpha) * 0.8; c.drawImage(glow([255, 130, 20]), bx - 4 * K, by - 4 * K, 8 * K, 8 * K); c.restore(); c.fillStyle = 'rgba(255,140,30,1)'; c.beginPath(); c.arc(bx, by, 1.1 * K, 0, TAU); c.fill(); }
      if (p.sparkler) sparkle(c, p.x + p.dir * 1.8 * K, y - 8 * K, p.alpha, sec);
    }
    c.globalAlpha = 1;
    lightPass(c);
    void lastSecond; void hex;
  }

  function sparkle(c, x, y, a, sec) {
    if (tier > 0 && Math.random() < 0.9) for (let k = 0; k < 2; k++) sparks.push({ x, y, vx: (Math.random() - 0.5) * 22 * K, vy: (Math.random() - 0.7) * 22 * K, life: 0, max: 0.25 + Math.random() * 0.3 });
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp01(a); c.drawImage(glow([255, 226, 160]), x - 4 * K, y - 4 * K, 8 * K, 8 * K); c.restore();
    void sec;
  }

  let doorKey = '', doorCv = null;
  function doorBake(dark, s, wreath) {
    const q = Math.round(dark * 10) / 10;
    const key = `${q}|${s}|${wreath ? 1 : 0}|${K}`;
    if (key === doorKey && doorCv) return doorCv;
    doorKey = key;
    const dpr2 = 2, w = 46 * K, h = 31 * K, ox = 23 * K, oy = 29 * K;    // (the sprite's origin at the door's foot)
    const solid = mk(w * dpr2, h * dpr2), light = mk(w * dpr2, h * dpr2);
    const S = solid.getContext('2d'), Lc = light.getContext('2d');
    S.scale(dpr2, dpr2); Lc.scale(dpr2, dpr2);
    const x = ox, y = oy, dw = 7 * K, dh = 13 * K;
    Lc.globalCompositeOperation = 'lighter';
    if (q > 0.05) { Lc.globalAlpha = 0.34 * q; Lc.drawImage(glow(WARM), x - 20 * K, y - dh - 12 * K, 40 * K, dh + 16 * K); }
    // the recess, the door and its panels, the knob
    S.fillStyle = 'rgba(6,4,8,0.95)'; S.fillRect(x - dw / 2 - 1.2 * K, y - dh - 1.4 * K, dw + 2.4 * K, dh + 1.4 * K);
    S.fillStyle = q > 0.5 ? 'rgba(30,20,16,1)' : 'rgba(58,38,28,1)'; S.fillRect(x - dw / 2, y - dh, dw, dh);
    S.fillStyle = q > 0.5 ? 'rgba(20,13,11,1)' : 'rgba(44,28,20,1)'; S.fillRect(x - dw / 2 + 1 * K, y - dh + 1.2 * K, dw - 2 * K, dh * 0.38); S.fillRect(x - dw / 2 + 1 * K, y - dh * 0.52, dw - 2 * K, dh * 0.42);
    S.fillStyle = 'rgba(214,170,90,1)'; S.beginPath(); S.arc(x - s * (dw / 2 - 1.3 * K), y - dh * 0.45, 0.45 * K, 0, TAU); S.fill();
    // the wreath with a few warm bulbs
    if (wreath) {
      const wy = y - dh * 0.62;
      S.strokeStyle = 'rgba(34,92,52,1)'; S.lineWidth = 0.9 * K; S.beginPath(); S.arc(x, wy, 1.7 * K, 0, TAU); S.stroke();
      if (q > 0.3) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; Lc.globalAlpha = 0.8; Lc.drawImage(glow([255, 196, 120]), x + Math.cos(a) * 1.7 * K - 1.4 * K, wy + Math.sin(a) * 1.7 * K - 1.4 * K, 2.8 * K, 2.8 * K); }
    }
    // the sconce (off by day) and the pink neon cocktail glass — the only marking
    if (q > 0.05) { Lc.globalAlpha = 0.9 * q; Lc.drawImage(glow(WARM), x - 9 * K, y - dh - 8 * K, 18 * K, 13 * K); }
    S.fillStyle = q > 0.05 ? rgba([255, 226, 180], q) : 'rgba(30,26,30,1)'; S.fillRect(x - 1 * K, y - dh - 2.4 * K, 2 * K, 0.9 * K);
    const gx = x - s * (dw / 2 + 3.6 * K), gy = y - dh * 0.7;
    S.strokeStyle = q > 0.05 ? rgba(mix(PINK, [255, 255, 255], 0.35), Math.min(1, q)) : 'rgba(70,50,64,0.9)'; S.lineWidth = 0.45 * K;
    S.beginPath(); S.moveTo(gx - 1.6 * K, gy - 1.6 * K); S.lineTo(gx + 1.6 * K, gy - 1.6 * K); S.lineTo(gx, gy); S.lineTo(gx - 1.6 * K, gy - 1.6 * K); S.moveTo(gx, gy); S.lineTo(gx, gy + 1.6 * K); S.moveTo(gx - 0.9 * K, gy + 1.6 * K); S.lineTo(gx + 0.9 * K, gy + 1.6 * K); S.stroke();
    if (q > 0.05) { Lc.globalAlpha = 0.45 * q; Lc.drawImage(glow(PINK), gx - 5 * K, gy - 5 * K, 10 * K, 10 * K); }
    // the doorman: broad, beside the door, rim-lit by the sconce (not by day)
    if (q > 0.3) {
      const mx = x + s * 6 * K;
      S.globalAlpha = q;
      figure(S, mx, y - 0.2 * K, 10.6 * K, [20, 20, 26], 0, false, 1, null, null, false, false);
      S.fillStyle = 'rgba(14,14,20,1)'; S.fillRect(mx - 2.1 * K, y - 8.2 * K, 4.2 * K, 2.4 * K);
      S.globalAlpha = 1;
      Lc.globalAlpha = 0.9 * q; Lc.fillStyle = rgba(WARM, 1);
      const sx = mx - s * 1.45 * 1.06 * K; Lc.fillRect(sx - (s < 0 ? 0.7 : 0) * K, y - 8.6 * K, 0.7 * K, 5 * K); Lc.fillRect(mx - s * 0.6 * K - 0.6 * K, y - 10.3 * K, 1.2 * K, 1.2 * K);
    }
    if (doorCv) { doorCv.solid.width = 0; doorCv.light.width = 0; }
    doorCv = { solid, light, ox, oy, w, h };
    return doorCv;
  }

  function drawDoor(c, fs, info, dark, party, hol, t) {
    const x = info.door.x, y = HZ, dw = 7 * K, dh = 13 * K, s = door.side;
    door.rect = { x: x - 22 * K, y: y - 31 * K, w: 44 * K, h: 44 * K };      // the knock's tap target (≥ 44 pt; never the dock: it's 38+ pt below)
    door.screen = { x, y, w: dw, h: dh };
    const sec = Math.min(0.1, fs.dt / 1000);
    // opening: a crack of warm light (and a hint of the room's glow), then closed
    const openK = t < door.openUntil ? smooth(0, 0.35, door.openUntil - 2.2 < t ? Math.min(t - (door.openUntil - 2.2), door.openUntil - t) : 0) : 0;
    door.open += ((t < door.openUntil ? 1 : 0) - door.open) * Math.min(1, sec * 4);
    door.peep += ((t < door.peepUntil ? 1 : 0) - door.peep) * Math.min(1, sec * 10);
    // the door's still parts, baked per light level (two sprites: the solids, and its lights added on top) — the sconce's wash on
    // the wall (what makes it a place at night, and what the doorman's silhouette reads against), the recess, the door, the knob,
    // the wreath, the sconce, the pink neon glass, the doorman rim-lit by the sconce; then the live bits: the line's party wash,
    // the warm slice as it opens, the peephole, the glass breathing on the beat
    const wreath = !!(hol.wreath || fs.force.has('wreath'));
    const db = doorBake(dark, s, wreath);
    c.drawImage(db.solid, x - db.ox, y - db.oy, db.w, db.h);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.drawImage(db.light, x - db.ox, y - db.oy, db.w, db.h);
    if (dark > 0.05 && line.length && party && party.palette) { const lx = x + s * (13 * K + line.length * 2.6 * K); c.globalAlpha = 0.38 * dark * (0.8 + 0.2 * party.breath); c.drawImage(glow(party.palette[0]), lx - line.length * 4 * K - 10 * K, y - 18 * K, line.length * 8 * K + 20 * K, 21 * K); }
    if (dark > 0.05 && party && fs.motion) { const gx = x - s * (dw / 2 + 3.6 * K), gy = y - dh * 0.7; c.globalAlpha = 0.5 * dark * party.breath; c.drawImage(glow(PINK), gx - 5 * K, gy - 5 * K, 10 * K, 10 * K); }
    c.restore();
    // the warm slice of light as it opens (pulsing faintly with the party light)
    if (door.open > 0.02) {
      const pulse = party ? 0.85 + 0.15 * party.breath : 1;
      const sw = 2.6 * K * door.open, sx = x + s * (dw / 2 - sw);
      c.fillStyle = rgba(party && party.palette ? mix(WARM, party.palette[0], 0.25) : WARM, 0.95 * door.open * pulse); c.fillRect(Math.min(sx, sx + sw), y - dh + 0.4 * K, sw, dh - 0.4 * K);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * door.open * pulse; c.drawImage(glow(WARM), x - 12 * K, y - dh - 4 * K, 24 * K, dh + 8 * K); c.restore();
    }
    // the peephole slot at eye level: amber, brighter when someone checks
    const peepA = (dark > 0.3 ? 0.45 : 0.15) + 0.55 * door.peep;
    c.fillStyle = rgba(mix([200, 120, 40], [255, 214, 140], door.peep), peepA); c.fillRect(x - 1.5 * K, y - dh * 0.74, 3 * K, 0.8 * K);
    if (door.peep > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = door.peep * 0.8; c.drawImage(glow([255, 190, 100]), x - 4 * K, y - dh * 0.74 - 3.6 * K, 8 * K, 8 * K); c.restore(); }
    // party nights: brass posts, the red velvet rope, the line (rim-lit in the party's colours; sparklers at the New Year)
    const lineOn = line.length > 0;
    if (lineOn) {
      const p0 = x + s * 9 * K, p1 = x + s * (9 * K + Math.max(10 * K, (line.length) * 5.2 * K));
      for (const px of [p0, p1]) { c.fillStyle = 'rgba(214,172,86,1)'; c.fillRect(px - 0.4 * K, y - 4.4 * K, 0.8 * K, 4.4 * K); c.beginPath(); c.arc(px, y - 4.6 * K, 0.6 * K, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(176,24,40,1)'; c.lineWidth = 0.7 * K; c.beginPath(); c.moveTo(p0, y - 3.8 * K); c.quadraticCurveTo((p0 + p1) / 2, y - 1.6 * K, p1, y - 3.8 * K); c.stroke();
      const sec2 = Math.min(0.1, fs.dt / 1000);
      line.forEach((m, i) => {
        const tx = x + s * (13 * K + i * 5.2 * K);
        if (m.x == null) m.x = tx + s * 8 * K;
        if (m.entering) { m.x += (x - m.x) * Math.min(1, sec2 * 2); m.alpha -= sec2 * 1.2; if (m.alpha <= 0) m.gone = true; }
        else if (m.leaving) { m.x += s * 6 * K * sec2; m.alpha -= sec2; if (m.alpha <= 0) m.gone = true; }
        else { m.x += (tx - m.x) * Math.min(1, sec2 * 1.5); m.alpha = Math.min(1, m.alpha + sec2); }
        if (m.alpha <= 0.01) return;
        m.ph += sec2 * 0.8;
        c.globalAlpha = clamp01(m.alpha);
        figure(c, m.x, y - 0.2 * K, m.h, m.coat, m.ph * 0.3, false, dark, { side: -s, col: party && party.palette ? party.palette[i % party.palette.length] : m.col, k: 1.25 * dark }, null, false, false);
        if (hol.nyeSparklers || (fs.force.has('sparklers') && party)) sparkle(c, m.x + 1.6 * K, y - 8.4 * K, m.alpha, sec2);
      });
      line = line.filter(m => !m.gone);
      c.globalAlpha = 1;
    }
    lightPass(c);
    // the sparks of the sparklers (shared)
    if (sparks.length) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,232,170,1)';
      sparks = sparks.filter(sp => { sp.life += sec; if (sp.life > sp.max) return false; sp.x += sp.vx * sec; sp.y += sp.vy * sec; sp.vy += 30 * K * sec; c.globalAlpha = 1 - sp.life / sp.max; c.fillRect(sp.x, sp.y, 0.5 * K, 0.5 * K); return true; });
      if (sparks.length > 120) sparks.splice(0, sparks.length - 120);
      c.restore();
    }
  }

  // the door's light on the sidewalk and in the wet street; umbrellas' colours in the wet street; footprints in the snow
  function ground(c, fs, streak) {
    const info = fs.street; if (!info || !info.door || !door.screen || fs.force.has('no-pp-ground')) return;
    const { L, t } = fs, dark = clamp01(L.w.night + L.w.late + (L.alwaysNight ? 1 : 0)), wet = L.rain ? 1.6 : 1;
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (dark > 0.05) {
      const x = info.door.x;
      c.globalAlpha = 0.45 * dark + 0.4 * door.open; c.drawImage(glow(WARM), x - 14 * K, HZ - 3 * K, 28 * K, 6 * K);
      if (streak) streak(x, 5 * K, (H - HZ) * 0.3 * (L.rain ? 1.3 : 0.9), '#ffc480', (0.1 + 0.18 * door.open) * dark * wet, t, 3.3);
      if (streak) streak(x - door.side * 7 * K, 3 * K, (H - HZ) * 0.2, '#ff46aa', 0.07 * dark * wet, t, 4.1);
    }
    if (L.rain && streak) for (const p of peds) if (p.umb && p.alpha > 0.1) streak(p.x, 6 * K, (H - HZ) * 0.26, hex(p.umb.map(v => Math.max(v, 60))), 0.24 * p.alpha, t, p.id);
    c.globalCompositeOperation = 'source-over';
    if (prints.length) { c.fillStyle = 'rgba(70,80,104,1)'; for (const f of prints) { c.globalAlpha = f.a * 0.5; c.fillRect(f.x, HZ + 0.6 * K, 0.9 * K, 0.5 * K); } }
    c.restore(); c.globalAlpha = 1;
  }

  return {
    resize(w, h, hz, d, k) { W = w; H = h; HZ = hz; K = k; peds = []; line = []; prints = []; },
    setTier(t) { tier = t; },
    back, ground,
    hail, stop,
    /** the knock: a tap on the door — the peephole slides open with a warm flash (title.js opens JOIN and plays the knock) */
    knock(t) { door.knockAt = t; door.peepUntil = t + 1.1; dbg.knocks++; },
    /** a tap at (x, y) on the door's target? */
    hitDoor: (x, y) => !!door.rect && x >= door.rect.x && x <= door.rect.x + door.rect.w && y >= door.rect.y && y <= door.rect.y + door.rect.h,
    /** where the door stands on screen (the lobby will stand guests outside it) */
    door: () => (door.screen ? { ...door.screen, rect: door.rect, side: door.side } : null),
    debug: () => ({ at: peds.map(p => [Math.round(p.x), +p.alpha.toFixed(2), p.state, p.umb ? 1 : 0]), peds: peds.length, walking: peds.filter(p => p.state === 'walk').length, umbrellas: peds.filter(p => p.umb).length, kinds: peds.reduce((m, p) => { m[p.kind] = (m[p.kind] || 0) + 1; return m; }, {}), kids: peds.filter(p => p.kid).length, wreath: !!(lastHol && lastHol.wreath), sparklers: peds.filter(p => p.sparkler).length + (sparks.length ? 1 : 0), line: line.length, door: { open: +door.open.toFixed(2), peep: +door.peep.toFixed(2), rect: door.rect, side: door.side, screen: door.screen }, hail: { id: hail.id, state: hail.state, cab: hail.cab }, waiting: peds.filter(p => p.state === 'wait').length, prints: prints.length, ...dbg }),
    destroy() { if (typeof window !== 'undefined') { window.removeEventListener('pointerdown', onInput); window.removeEventListener('keydown', onInput); } },
  };
}
