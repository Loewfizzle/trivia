// CITY 2.0 — THE HARBOR, Part 6a: THE BIRDS (docs/harbor.md#part-6a). Who is up comes from core/harbor-sky.js#birdsNow (the
// hour, the month, the weather); every bird is a crafted silhouette drawn live (a few paths each — no sprite to tint), lit by
// the hour: by day the gulls' white undersides against the city, at dusk dark shapes against the glowing sky.
//   GULLS   harbor(c)  a few wheeling over the water in front of the skyline by day — long glides on bent "M" wings (white
//                      body + underwings, grey mantle when they bank, black tips), a few lazy wingbeats to climb; nearer ones
//                      bigger. Drawn before the water: the mirror reflects them.
//   SWIFTS  low(c)     a screaming party darting round the rooftops on summer evenings (scythe wings, fast flicker)
//   BATS    low(c)     summer dusk into the night: smooth looping paths with quick darts (a fast but smooth swerve ~once a
//                      second, the bat banking into it), fast scalloped wings — core/harbor-flight.js#batAt
//   GEESE   sky(c)     V's crossing a sky lane (never across the sign): never a perfect V — uneven arms, irregular spacing,
//                      birds drifting in their slots, 1–2 stragglers trailing with a gap (flapping harder), now and then one
//                      dropping back + rejoining or two trading places (core/harbor-flight.js#geesePlan); the wingbeats ripple
//                      down each arm; autumn's head south (away: they shrink into the haze), spring's come toward us
// Every path is a function of (its seed, the seconds since the flight began): frame-rate independent, no per-frame dice.
// (The bats' old JITTER: they rode the raw roofline — a step function with 50–90 pt jumps at the building edges — so a bat
// teleported up and down as it crossed one, flickering when its ±6 pt wobble straddled an edge. Now: core#smoothRoof.)
//   HERON   sky(c)     the district's rare slow crossing on spring-to-autumn nights (neck folded, legs trailing) — &force=heron-sky
//                      (8b1: &force=heron is the heron on its PILING at dawn now — wildlife.js)
// Reduced effects: no birds on the wing (the district's rule). Heavy events elsewhere thin them (fs.density).
import { birdsNow } from '../../core/harbor-sky.js';
import { smoothRoof, roofAt as roofLerp, batPlan, batAt, geesePlan, goosePose, geeseTail } from '../../core/harbor-flight.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const rnd = (a, b) => a + Math.random() * (b - a);
const seed32 = () => (Math.random() * 4294967296) >>> 0;

export function createBirds() {
  let W = 1, H = 1, HZ = 1, K = 1, tier = 2;
  let gulls = [], gullKey = '';
  let geese = null, nextGeese = rnd(20, 80);
  let swifts = null, nextSwifts = rnd(8, 30);
  let bats = null, nextBats = rnd(5, 20);
  let heron = null, nextHeron = rnd(300, 900);
  let who = { gulls: 0, swifts: 0, geese: 0, bats: 0 }, whoAt = -1e9;
  let roofSrc = null, roofS = null;                       // the smoothed roofline (re-made when the layout's changes)
  const GP = { along: 0, across: 0, flap: 0 }, BP = { x: 0, y: 0, ax: 0, flap: 0 };   // scratch (no allocation per bird)

  // ---------------------------------------------------------------- the hour's inks
  function inks(L) {
    const dark = clamp01(L.w.night + L.w.late), day = clamp01(L.w.day + L.w.dawn * 0.6 + L.w.golden * 0.6), gold = clamp01(L.w.golden + L.w.dawn * 0.7);
    return {
      dark, day, gold,
      // a silhouette against the sky (geese, swifts, bats, the heron)
      sil: day > 0.5 ? (gold > 0.4 ? 'rgba(30,18,32,0.92)' : 'rgba(36,40,56,0.9)') : 'rgba(10,8,18,0.95)',
      rim: gold > 0.3 ? `rgba(255,190,130,${0.5 * gold})` : dark > 0.5 ? 'rgba(140,120,170,0.35)' : 'rgba(210,216,232,0.35)',
      // a gull: white below, grey mantle, black tips (warm at sunset)
      white: gold > 0.4 ? 'rgb(255,226,206)' : `rgb(${Math.round(160 + 92 * day)},${Math.round(164 + 90 * day)},${Math.round(178 + 78 * day)})`,
      grey: gold > 0.4 ? 'rgb(170,140,150)' : `rgb(${Math.round(110 + 70 * day)},${Math.round(118 + 72 * day)},${Math.round(134 + 70 * day)})`,
      tip: 'rgb(22,20,28)',
    };
  }

  // ---------------------------------------------------------------- the silhouettes (facing +x; s = wingspan, pt)
  // a gull: bent wings (the wrist up, the hand swept back + down), lift −1..1 (the beat), bank 0..1 (its back toward us: the mantle)
  function gull(c, x, y, s, lift, dir, bank, ink) {
    c.save(); c.translate(x, y); c.rotate(dir * bank * 0.35); c.scale(dir, 1);
    const h = s / 2, wr = -0.32 * lift - 0.12, tp = 0.22 * lift + 0.1;
    for (const side of [-1, 1]) {
      const near = side > 0, k = near ? 1 : 0.86;
      // a wing out to ±h: the shoulder → the wrist (up) → the tip (swept back + down), the trailing edge back to the body
      c.beginPath();
      const ox = side * 0.04 * h;
      c.moveTo(ox, -0.04 * h);
      c.quadraticCurveTo(side * 0.24 * h, (wr - 0.14) * h * k, side * 0.5 * h * k, wr * h * k);           // up to the wrist
      c.quadraticCurveTo(side * 0.78 * h * k, (wr + 0.02) * h * k, side * 1.0 * h * k, tp * h * k - 0.08 * h); // out to the tip
      c.quadraticCurveTo(side * 0.74 * h * k, (wr + 0.2) * h * k, side * 0.5 * h * k, (wr + 0.16) * h * k);     // the trailing edge back
      c.quadraticCurveTo(side * 0.26 * h, 0.04 * h, ox, 0.08 * h);
      c.closePath();
      c.fillStyle = bank > 0.5 && near ? ink.grey : ink.white; c.fill();
      // the black wing tip
      c.beginPath(); c.moveTo(side * 0.78 * h * k, (wr + 0.04) * h * k); c.quadraticCurveTo(side * 0.9 * h * k, (wr + 0.02) * h * k, side * 1.0 * h * k, tp * h * k - 0.08 * h); c.quadraticCurveTo(side * 0.86 * h * k, (wr + 0.14) * h * k, side * 0.76 * h * k, (wr + 0.15) * h * k); c.closePath();
      c.fillStyle = ink.tip; c.fill();
    }
    // the body seen from below (the classic gull "M"): a short white torpedo, the head a little forward, the fanned tail
    c.fillStyle = ink.white; c.beginPath(); c.ellipse(0, 0.04 * h, 0.075 * h, 0.15 * h, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(0.015 * h, -0.1 * h, 0.06 * h, 0, TAU); c.fill();
    c.fillStyle = 'rgb(226,180,60)'; c.beginPath(); c.moveTo(0.0, -0.15 * h); c.lineTo(0.03 * h, -0.2 * h); c.lineTo(0.035 * h, -0.14 * h); c.fill();
    c.fillStyle = ink.white; c.beginPath(); c.moveTo(-0.07 * h, 0.15 * h); c.lineTo(0.07 * h, 0.15 * h); c.lineTo(0.05 * h, 0.24 * h); c.lineTo(-0.05 * h, 0.24 * h); c.closePath(); c.fill();
    c.restore();
  }
  function goose(c, x, y, s, flap, dir, ink) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const up = Math.sin(flap);
    c.fillStyle = ink.sil; c.strokeStyle = ink.sil; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(s * 0.02, -s * 0.02); c.quadraticCurveTo(-s * 0.06, -s * (0.1 + 0.22 * up), -s * 0.12, -s * (0.04 + 0.34 * up)); c.quadraticCurveTo(-s * 0.02, -s * (0.02 + 0.12 * up), s * 0.1, -s * 0.01); c.fill();
    c.beginPath(); c.ellipse(0, 0, s * 0.3, s * 0.075, -0.04, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-s * 0.26, -s * 0.01); c.lineTo(-s * 0.38, -s * 0.03); c.lineTo(-s * 0.36, s * 0.035); c.closePath(); c.fill();
    c.lineWidth = s * 0.055; c.beginPath(); c.moveTo(s * 0.22, -s * 0.02); c.quadraticCurveTo(s * 0.42, -s * 0.06, s * 0.52, -s * 0.07); c.stroke();
    c.beginPath(); c.ellipse(s * 0.55, -s * 0.072, s * 0.055, s * 0.036, 0, 0, TAU); c.fill();
    c.strokeStyle = ink.rim; c.lineWidth = Math.max(0.5, s * 0.03); c.beginPath(); c.ellipse(0, s * 0.012, s * 0.27, s * 0.06, -0.04, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = ink.sil; c.beginPath(); c.moveTo(s * 0.08, -s * 0.03); c.quadraticCurveTo(-s * 0.02, -s * (0.16 + 0.3 * up), -s * 0.16, -s * (0.06 + 0.46 * up)); c.quadraticCurveTo(-s * 0.04, -s * (0.04 + 0.18 * up), s * 0.16, 0); c.fill();
    c.restore();
  }
  function swift(c, x, y, s, flap, ang, ink) {
    c.save(); c.translate(x, y); c.rotate(ang);
    const f = 0.75 + 0.25 * Math.sin(flap);
    c.fillStyle = ink.sil; c.beginPath();
    c.moveTo(s * 0.3, 0);
    c.quadraticCurveTo(s * 0.05, -s * 0.18 * f, -s * 0.35, -s * 0.5 * f);
    c.quadraticCurveTo(-s * 0.05, -s * 0.12 * f, -s * 0.12, -s * 0.02);
    c.lineTo(-s * 0.32, -s * 0.06); c.lineTo(-s * 0.22, 0); c.lineTo(-s * 0.32, s * 0.06); c.lineTo(-s * 0.12, s * 0.02);
    c.quadraticCurveTo(-s * 0.05, s * 0.12 * f, -s * 0.35, s * 0.5 * f);
    c.quadraticCurveTo(s * 0.05, s * 0.18 * f, s * 0.3, 0);
    c.fill(); c.restore();
  }
  function bat(c, x, y, s, flap, roll, ink) {
    c.save(); c.translate(x, y); c.rotate(roll); c.scale(s / 10, s / 10);
    const up = Math.sin(flap) * 0.9;
    c.fillStyle = ink.sil; c.beginPath();
    c.moveTo(0, -1);
    for (const side of [1, -1]) {
      c.lineTo(side * 1.4, -1.6 - 2.2 * up); c.lineTo(side * 3.2, -2.4 - 3.4 * up); c.lineTo(side * 5, -1.2 - 3.2 * up);
      // the scalloped trailing edge
      c.quadraticCurveTo(side * 4.2, 0.2 - 1.6 * up, side * 3.4, -0.2 - 1.8 * up); c.quadraticCurveTo(side * 2.6, 0.9 - 1 * up, side * 1.8, 0.2 - 0.9 * up); c.quadraticCurveTo(side * 1.2, 1.2 - 0.4 * up, 0, 1.2);
      if (side > 0) c.moveTo(0, -1);
    }
    c.fill();
    c.beginPath(); c.ellipse(0, 0, 0.9, 1.5, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-0.6, -1.3); c.lineTo(-0.4, -2.2); c.lineTo(-0.1, -1.4); c.moveTo(0.6, -1.3); c.lineTo(0.4, -2.2); c.lineTo(0.1, -1.4); c.fill();
    c.restore();
  }
  function heronDraw(c, x, y, s, flap, dir, ink) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const up = Math.sin(flap);
    c.fillStyle = ink.sil; c.strokeStyle = ink.sil; c.lineCap = 'round';
    c.beginPath(); c.moveTo(s * 0.06, -s * 0.02); c.quadraticCurveTo(-s * 0.1, -s * (0.12 + 0.3 * up), -s * 0.32, -s * (0.02 + 0.36 * up)); c.quadraticCurveTo(-s * 0.1, -s * (0.0 + 0.1 * up), s * 0.12, 0.01 * s); c.fill();
    c.beginPath(); c.ellipse(0, 0, s * 0.2, s * 0.06, 0, 0, TAU); c.fill();
    c.lineWidth = s * 0.045; c.beginPath(); c.moveTo(s * 0.17, -s * 0.02); c.quadraticCurveTo(s * 0.24, s * 0.06, s * 0.3, -s * 0.03); c.stroke();
    c.beginPath(); c.ellipse(s * 0.32, -s * 0.04, s * 0.04, s * 0.025, 0, 0, TAU); c.fill();
    c.lineWidth = s * 0.015; c.beginPath(); c.moveTo(s * 0.35, -s * 0.04); c.lineTo(s * 0.46, -s * 0.03); c.stroke();
    c.beginPath(); c.moveTo(-s * 0.18, s * 0.01); c.lineTo(-s * 0.48, s * 0.03); c.stroke();
    c.beginPath(); c.moveTo(s * 0.04, -s * 0.03); c.quadraticCurveTo(-s * 0.1, -s * (0.14 + 0.36 * up), -s * 0.4, -s * (0.04 + 0.46 * up)); c.quadraticCurveTo(-s * 0.12, -s * (0.02 + 0.14 * up), s * 0.14, 0); c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- the flocks
  function makeGulls(n, area) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const depth = Math.random();                       // 0 far … 1 near
      out.push({ cx: rnd(area.x0 + 30, area.x1 - 30), cy: rnd(area.y0, area.y1), rx: rnd(40, 95) * K, ry: rnd(6, 16) * K, w: rnd(0.12, 0.24) * (Math.random() < 0.5 ? 1 : -1), th: rnd(0, TAU), s: (13 + 9 * depth) * K, ph: rnd(0, TAU), drift: rnd(-4, 4) * K });
    }
    return out;
  }
  function newGeese(L, lane, forced) {
    if (!lane || lane.h < 24) return null;
    const n = 7 + Math.floor(Math.random() * 7), dir = Math.random() < 0.5 ? 1 : -1;
    const mn = L.local ? L.local.m : 10, autumn = L.south ? mn >= 3 && mn <= 5 : mn >= 9 && mn <= 11;
    const v = rnd(16, 22) * K, gap = 9.5 * K, plan0 = geesePlan(seed32(), n, (W + 200 * K) / v);
    // the leader comes in just off screen; the flight ends when the last straggler has left (the V's tail, at its largest)
    const tail = geeseTail(plan0) * gap * 1.02, lead = 24 * K, flight = W + 2 * lead + tail;
    // the whole V inside its lane when it fits (its arms' reach + a bird's slip to the side), the drift kept inside too
    const lo = lane.y + 4 + (-plan0.minAcross + 0.7) * gap, hi = lane.y + lane.h - 4 - (plan0.maxAcross + 0.7) * gap;
    let y, slope;
    if (lo <= hi) {
      y = lo + (hi - lo) * rnd(0.2, 0.8);
      const ye = Math.max(lo, Math.min(hi, y + rnd(-0.04, 0.04) * flight));   // where it may drift to by the far side
      slope = (ye - y) / flight;
    } else { y = (lo + hi) / 2; slope = 0; }                    // a lane too narrow: centred, its edge birds fade softly
    return { n, dir, x0: dir > 0 ? -lead : W + lead, x: 0, y0: y, y, slope, v, s: 13 * K, k0: autumn ? 1 : 0.8, k1: autumn ? 0.78 : 1.02, t: 0, gap, forced, span: flight, plan: plan0, bottom: lane.y + lane.h, top: lane.y };
  }

  return {
    resize(w, h, hz) { W = w; H = h; HZ = hz; K = Math.max(0.9, Math.min(1.35, w / 402)); gullKey = ''; geese = null; swifts = null; bats = null; },
    setTier(t) { tier = t; gullKey = ''; },
    /** the sky layer: geese in a free sky lane, the heron at night */
    sky(c, s, free) {
      const { L, dt, force, motion } = s, sec = dt / 1000;
      if (performance.now() - whoAt > 2000) { who = birdsNow(L); whoAt = performance.now(); }
      const ink = inks(L), dens = s.density ? Math.min(s.density['sky-high'], s.density['sky-low']) : 1;
      // GEESE: about 1.5 V's an hour in the migrations (a few in the rest of the year), in a free lane
      nextGeese -= sec;
      if (!geese && motion && (force.has('geese') || (nextGeese <= 0 && who.geese > 0.05 && dens >= 1))) {
        // (NEON PASS 5 — the owner: from the panel the geese often didn't show: planes held both lanes for half a minute. A FORCED
        // flock overrides the gate: it takes a lane anyway)
        let id = free['sky-high'] && (!free['sky-low'] || Math.random() < 0.55) ? 'sky-high' : free['sky-low'] ? 'sky-low' : null;
        if (!id && force.has('geese')) id = Math.random() < 0.5 ? 'sky-high' : 'sky-low';
        if (id && s.textRects && s.textRects.neon) geese = newGeese(L, s.lanes[id], force.has('geese'));
        nextGeese = force.has('geese') ? 6 : rnd(1200, 3600) / Math.max(0.1, who.geese);
      }
      if (geese) {
        // (a function of the flight's time: x, y + every bird's place come from g.t — the same at 30 fps as at 60)
        const g = geese; g.t += sec; g.x = g.x0 + g.dir * g.v * g.t; g.y = g.y0 + g.slope * g.v * g.t;
        const k = clamp01(g.v * g.t / g.span), sc = g.k0 + (g.k1 - g.k0) * k;
        const fade = sc < 0.9 ? 0.75 + 0.25 * sc : 1, unit = g.gap * sc;
        for (let i = 0; i < g.n; i++) {
          goosePose(g.plan, i, g.t, GP);
          const bx = g.x - g.dir * GP.along * unit, by = g.y + GP.across * unit + Math.sin(g.t * 0.7 + i * 1.7) * 0.6;
          if (bx < -20 * K || bx > W + 20 * K) continue;
          // the lane's edge: a soft 5 pt fade (a bird drifting out of the lane fades, never pops)
          const e = Math.min(by - g.top - 1, g.bottom - 1 - by) / 5;
          if (e <= 0) continue;
          c.globalAlpha = fade * (e < 1 ? e : 1);
          goose(c, bx, by, g.s * sc, GP.flap, g.dir, ink);
        }
        c.globalAlpha = 1;
        if (k >= 1) geese = null;
      }
      // THE HERON (the district's rare night crossing, spring to autumn)
      const mn = L.local ? L.local.m : 6;
      nextHeron -= sec;
      if (!heron && motion && (force.has('heron-sky') || (nextHeron <= 0 && ink.dark > 0.6 && mn >= 4 && mn <= 10))) {
        const lane = s.lanes && (free['sky-low'] ? s.lanes['sky-low'] : free['sky-high'] ? s.lanes['sky-high'] : force.has('heron-sky') ? s.lanes['sky-low'] : null);   // (forced: a lane anyway)
        if (lane) { const dir = Math.random() < 0.5 ? 1 : -1; heron = { x: dir > 0 ? -40 : W + 40, y: lane.y + lane.h * 0.45, dir, v: 13 * K, t: 0 }; }
        nextHeron = rnd(900, 2400);
      }
      if (heron) { heron.t += sec; heron.x += heron.dir * heron.v * sec; heronDraw(c, heron.x, heron.y + Math.sin(heron.t * 0.6) * 2, 22 * K, heron.t * 2.4, heron.dir, ink); if (heron.x < -60 || heron.x > W + 60) heron = null; }
    },
    /** over the far rows (between the far skyline + the near one): SWIFTS + BATS round the rooftops */
    low(c, s) {
      const { L, dt, force, motion, t } = s, sec = dt / 1000, ink = inks(L), sky = s.skyline;
      // (the roofline is a STEP function — a tower's edge jumps 50–90 pt in one 4-pt cell: a bird that rode it teleported)
      if (sky && sky !== roofSrc) { roofSrc = sky; roofS = smoothRoof(sky); }
      const roofAt = x => (sky ? roofLerp(roofS, x) : HZ * 0.6);
      const dens = s.density ? s.density.skyline : 1;
      // SWIFTS: a party of 8–14 every minute or two on summer evenings, darting along the roofs
      nextSwifts -= sec;
      if (!swifts && motion && (force.has('swifts') || (nextSwifts <= 0 && who.swifts > 0.2 && dens >= 1))) {
        const dir = Math.random() < 0.5 ? 1 : -1, n = tier === 0 ? 6 : 8 + Math.floor(Math.random() * 7);
        swifts = { dir, x: dir > 0 ? -60 : W + 60, v: rnd(60, 85) * K, t: 0, b: Array.from({ length: n }, () => ({ ox: rnd(-50, 50) * K, oy: rnd(-26, 6) * K, f: rnd(1.5, 3.2), ph: rnd(0, TAU), s: rnd(6.5, 8.5) * K })) };
        nextSwifts = force.has('swifts') ? 2 : rnd(40, 110);
      }
      if (swifts) {
        const g = swifts; g.t += sec; g.x += g.dir * g.v * sec;
        for (const b of g.b) {
          const x = g.x + b.ox + Math.sin(g.t * b.f + b.ph) * 26 * K, base = Math.min(roofAt(x) - 14 * K, HZ * 0.95), y = base + b.oy + Math.sin(g.t * b.f * 1.7 + b.ph) * 10 * K;
          const vx = g.dir * g.v + Math.cos(g.t * b.f + b.ph) * 26 * K * b.f, vy = Math.cos(g.t * b.f * 1.7 + b.ph) * 10 * K * b.f * 1.7;
          swift(c, x, y, b.s, t * 30 + b.ph, Math.atan2(vy, vx), ink);
        }
        if (g.x < -140 * K || g.x > W + 140 * K) swifts = null;
      }
      // BATS: summer dusk into the night — a handful jinking over the roofs
      nextBats -= sec;
      if (!bats && motion && (force.has('bats-dusk') || (nextBats <= 0 && who.bats > 0.2 && dens >= 1))) {
        const n = tier === 0 ? 3 : 5 + Math.floor(Math.random() * 4);
        // each bat: a home over the roofs (drifting slowly) + its own seeded flight (core/harbor-flight.js#batPlan)
        bats = { t: 0, life: rnd(26, 40), b: Array.from({ length: n }, () => ({ hx: rnd(0.15, 0.85) * W, hy: rnd(24, 56) * K, s: rnd(7, 9.5) * K, drift: rnd(-6, 6) * K, p: batPlan(seed32()) })) };
        nextBats = force.has('bats-dusk') ? 3 : rnd(30, 90);
      }
      if (bats) {
        const g = bats; g.t += sec;
        const fade = Math.min(1, g.t / 2, (g.life - g.t) / 2);
        c.globalAlpha = clamp01(fade);
        for (const b of g.b) {
          // the home's height follows the smoothed roofs (not the bat's own x: its swerves never drag the baseline about)
          const hx = b.hx + b.drift * g.t;
          batAt(b.p, g.t, BP);
          const roll = BP.ax > 0 ? Math.min(0.55, BP.ax / 2600) : Math.max(-0.55, BP.ax / 2600);   // banked into each dart
          bat(c, hx + BP.x * K, roofAt(hx) - b.hy + BP.y * K - Math.sin(BP.flap) * 0.5 * K, b.s, BP.flap, roll, ink);
        }
        c.globalAlpha = 1;
        if (g.t >= g.life) bats = null;
      }
    },
    /** over the harbor, in front of the skyline (before the water: they are reflected): THE GULLS by day */
    harbor(c, s, area) {
      const { L, t, motion } = s;
      const n = Math.round(who.gulls * (tier === 2 ? 5 : tier === 1 ? 4 : 2) * (s.density ? s.density.water : 1));
      const key = `${n}|${Math.round(area.y0)}|${Math.round(area.y1)}|${W}`;
      if (key !== gullKey) { gullKey = key; gulls = n > 0 ? makeGulls(n, area) : []; }
      if (!gulls.length || s.force.has('no-birds')) return;
      const ink = inks(L), fade = clamp01(who.gulls * 1.5);
      c.globalAlpha = fade;
      for (const g of gulls) {
        const th = g.th + (motion ? t * g.w : 0), x = g.cx + Math.cos(th) * g.rx + (motion ? Math.sin(t * 0.05 + g.ph) * 20 * K : 0), y = g.cy + Math.sin(th) * g.ry;
        const vx = -Math.sin(th) * g.rx * g.w, vy = Math.cos(th) * g.ry * g.w;
        // a glide (wings set) most of the time; a few wingbeats when climbing
        const climb = vy < -1 ? 1 : 0, beat = motion && climb ? Math.sin(t * 9 + g.ph) : 0.15 + 0.1 * Math.sin(t * 0.8 + g.ph);
        const bank = Math.abs(vy) / Math.max(1, Math.hypot(vx, vy));
        gull(c, x, y, g.s, beat, vx >= 0 ? 1 : -1, bank, ink);
      }
      c.globalAlpha = 1;
    },
    /** birds on the wing (geese, swifts, bats, the heron) keep 60 fps; the gulls glide slowly (30 is smooth) */
    busy: () => !!(geese || swifts || bats || heron),
    hit: () => null,
    debug: () => ({ who: Object.fromEntries(Object.entries(who).map(([k, v]) => [k, +v.toFixed(2)])), gulls: gulls.length, geese: geese ? geese.n : 0, geeseX: geese ? Math.round(geese.x) : null, swifts: swifts ? swifts.b.length : 0, bats: bats ? bats.b.length : 0, heron: !!heron }),
  };
}
