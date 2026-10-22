// CITY 2.0 — THE HARBOR, Part 6a: THE BIRDS (docs/harbor.md#part-6a). Who is up comes from core/harbor-sky.js#birdsNow (the
// hour, the month, the weather); every bird is a crafted silhouette drawn live (a few paths each — no sprite to tint), lit by
// the hour: by day the gulls' white undersides against the city, at dusk dark shapes against the glowing sky.
//   GULLS   harbor(c)  a few wheeling over the water in front of the skyline by day — long glides on bent "M" wings (white
//                      body + underwings, grey mantle when they bank, black tips), a few lazy wingbeats to climb; nearer ones
//                      bigger. Drawn before the water: the mirror reflects them.
//   SWIFTS  low(c)     a screaming party darting round the rooftops on summer evenings (scythe wings, fast flicker)
//   BATS    low(c)     summer dusk into the night: erratic, jinking flight, fast scalloped wings
//   GEESE   sky(c)     V's crossing a sky lane (never across the sign): the wingbeats ripple down each arm, the leader swaps
//                      now and then; autumn's head south (away: they shrink into the haze), spring's come toward us
//   HERON   sky(c)     the district's rare slow crossing on spring-to-autumn nights (neck folded, legs trailing)
// Reduced effects: no birds on the wing (the district's rule). Heavy events elsewhere thin them (fs.density).
import { birdsNow } from '../../core/harbor-sky.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const rnd = (a, b) => a + Math.random() * (b - a);

export function createBirds() {
  let W = 1, H = 1, HZ = 1, K = 1, tier = 2;
  let gulls = [], gullKey = '';
  let geese = null, nextGeese = rnd(20, 80);
  let swifts = null, nextSwifts = rnd(8, 30);
  let bats = null, nextBats = rnd(5, 20);
  let heron = null, nextHeron = rnd(300, 900);
  let who = { gulls: 0, swifts: 0, geese: 0, bats: 0 }, whoAt = -1e9;

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
  function bat(c, x, y, s, flap, dir, ink) {
    c.save(); c.translate(x, y); c.scale(dir * s / 10, s / 10);
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
    const y = lane.y + lane.h * rnd(0.35, 0.65), slope = rnd(-0.04, 0.04);
    return { n, dir, x: dir > 0 ? -90 * K : W + 90 * K, y, slope, v: rnd(16, 22) * K, s: 13 * K, k0: autumn ? 1 : 0.8, k1: autumn ? 0.78 : 1.02, t: 0, gap: 9.5 * K, forced, lead: 0, swapAt: rnd(12, 25), bottom: lane.y + lane.h, top: lane.y };
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
        const g = geese; g.t += sec; g.x += g.dir * g.v * sec; g.y += g.slope * g.v * sec;
        const span = W + 180 * K, k = clamp01((g.dir > 0 ? g.x + 90 * K : W + 90 * K - g.x) / span), sc = g.k0 + (g.k1 - g.k0) * k;
        if (g.t > g.swapAt) { g.lead = (g.lead + 1) % 3; g.swapAt = g.t + rnd(15, 30); }
        const fade = Math.min(1, (1 - k) * 8, k * 8) * (sc < 0.9 ? 0.75 + 0.25 * sc : 1);
        c.globalAlpha = fade;
        for (let i = 0; i < g.n; i++) {
          const arm = i === 0 ? 0 : Math.ceil(i / 2), side = i % 2 ? -1 : 1;
          const bx = g.x - g.dir * arm * g.gap * sc, by = g.y + side * arm * g.gap * 0.62 * sc + (i === g.lead ? 0 : 0) + Math.sin(g.t * 0.7 + i) * 0.6;
          if (by < g.top + 2 || by > g.bottom - 2) continue;
          goose(c, bx, by, g.s * sc, g.t * 5.2 - arm * 0.55, g.dir, ink);
        }
        c.globalAlpha = 1;
        if (k >= 1) geese = null;
      }
      // THE HERON (the district's rare night crossing, spring to autumn)
      const mn = L.local ? L.local.m : 6;
      nextHeron -= sec;
      if (!heron && motion && (force.has('heron') || (nextHeron <= 0 && ink.dark > 0.6 && mn >= 4 && mn <= 10))) {
        const lane = s.lanes && (free['sky-low'] ? s.lanes['sky-low'] : free['sky-high'] ? s.lanes['sky-high'] : force.has('heron') ? s.lanes['sky-low'] : null);   // (forced: a lane anyway)
        if (lane) { const dir = Math.random() < 0.5 ? 1 : -1; heron = { x: dir > 0 ? -40 : W + 40, y: lane.y + lane.h * 0.45, dir, v: 13 * K, t: 0 }; }
        nextHeron = rnd(900, 2400);
      }
      if (heron) { heron.t += sec; heron.x += heron.dir * heron.v * sec; heronDraw(c, heron.x, heron.y + Math.sin(heron.t * 0.6) * 2, 22 * K, heron.t * 2.4, heron.dir, ink); if (heron.x < -60 || heron.x > W + 60) heron = null; }
    },
    /** over the far rows (between the far skyline + the near one): SWIFTS + BATS round the rooftops */
    low(c, s) {
      const { L, dt, force, motion, t } = s, sec = dt / 1000, ink = inks(L), sky = s.skyline;
      const roofAt = x => (sky ? sky[Math.max(0, Math.min(sky.length - 1, Math.round(x / 4)))] : HZ * 0.6);
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
        bats = { t: 0, life: rnd(26, 40), b: Array.from({ length: n }, () => ({ cx: rnd(0.15, 0.85) * W, cy: rnd(18, 50) * K, r: rnd(18, 50) * K, w: rnd(0.8, 1.6) * (Math.random() < 0.5 ? 1 : -1), ph: rnd(0, TAU), j: rnd(2, 4), s: rnd(7, 9.5) * K, drift: rnd(-14, 14) * K })) };
        nextBats = force.has('bats-dusk') ? 3 : rnd(30, 90);
      }
      if (bats) {
        const g = bats; g.t += sec;
        const fade = Math.min(1, g.t / 2, (g.life - g.t) / 2);
        c.globalAlpha = clamp01(fade);
        for (const b of g.b) {
          const th = g.t * b.w + b.ph, jx = Math.sin(g.t * b.j * 3.1 + b.ph) * 6 * K, jy = Math.sin(g.t * b.j * 4.3 + b.ph * 2) * 5 * K;
          const x = b.cx + b.drift * g.t + Math.cos(th) * b.r + jx, y = roofAt(x) - b.cy + Math.sin(th * 1.3) * b.r * 0.4 + jy;
          bat(c, x, y, b.s, t * 48 + b.ph, Math.cos(th) * b.w < 0 ? 1 : -1, ink);
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
    debug: () => ({ who: Object.fromEntries(Object.entries(who).map(([k, v]) => [k, +v.toFixed(2)])), gulls: gulls.length, geese: geese ? geese.n : 0, swifts: swifts ? swifts.b.length : 0, bats: bats ? bats.b.length : 0, heron: !!heron }),
  };
}
