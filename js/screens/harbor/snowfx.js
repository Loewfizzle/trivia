// CITY 2.0 — PART 9b: THE FALLING SNOW (live, over the city): three depths — far fine + dim, mid, near big soft flakes — falling SLOWLY
// (far ~14 pt/s, near ~40) and drifting with the REAL wind + a lazy sway; LIT by what they fall past (the rain's light grid — rainfx.js
// #lightAt: the NEON logo, the signs, the lamps' globes): pink near the tubes, amber by the lamps, a pale blue-white elsewhere at night,
// white by day. Batched by quantized colour (one path a batch). Caps 70 / 140 / 230 by tier. Reduced motion: a still, light snowfall.
// + THE AWNING's SLAB (9b — "WEATHER ON THE SPEAKEASY"): now + then a slab of snow slides off the awning's front edge and drops (a white
//   chunk breaking into a puff on the walk) — only while snow lies on it.
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const CAPS = [60, 130, 220];   // (the speed round: the near flakes carry the look)
const DEPTH = [{ k: 0.42, v: 14, r: 0.85, a: 0.6 }, { k: 0.36, v: 24, r: 1.45, a: 0.88 }, { k: 0.22, v: 40, r: 2.9, a: 0.72 }];

// ATM-B — HEAVY SNOW IN LAYERS OF DEPTH (the owner, Oct 27: "heavy snow + wind still broken — the layers of depth"): the three depths are
// drawn WHERE THEY ARE — the far fine flakes behind the near skyline (s.layer 'far'), the mid layer over the harbor ('mid'), the big near
// flakes over everything ('near', which also moves them all once a frame) — + the white veil softening the skyline (fogdepth.js, driven by
// the snow); in heavy snow the near flakes BIGGER + more of them. THE BLIZZARD (s.blizzard 0..1): the snow DRIVEN SIDEWAYS in the gust
// waves (the near flakes become short streaks along their flight), denser. + THE TREES SHAKING SNOW OFF in the gusts (shake()), THE GROUND
// SNOW blowing in streamers + drifting against the speakeasy + the benches (ground()) — never on the street under the dock (it's open).
const LAYER = { far: 0, mid: 1, near: 2 };
export function createSnowfall() {
  let W = 0, H = 0, flakes = [], slab = null, nextSlab = 0, puffs = [], streams = [];
  const shook = new Map();
  const spawn = (d, anywhere) => ({ d, x: Math.random() * (W + 80) - 40, y: anywhere ? Math.random() * H : -6 - Math.random() * 30, ph: Math.random() * 6.28, s: 0.75 + Math.random() * 0.5, land: H * (d === 0 ? 0.62 + Math.random() * 0.12 : d === 1 ? 0.75 + Math.random() * 0.15 : 0.9 + Math.random() * 0.12) });
  return {
    resize(w, h) { if (w === W && h === H) return; W = w; H = h; flakes = []; },
    /** s: { snow 0..1, wind (m/s, + = blowing right on screen), windAt? (u 0..1 → the wind there, m/s signed — ATM-A), day 0..1, dt (ms), t, tier, motion, lightAt (x, y) → [r,g,b,k] | null } */
    draw(c, s) {
      const sec = Math.min(0.1, (s.dt || 16) / 1000), tier = s.tier == null ? 2 : s.tier, only = s.layer ? LAYER[s.layer] : null, moving = only == null || only === 2;
      const bz = clamp01(s.blizzard || 0), heavy = clamp01((s.snow - 0.6) / 0.4);
      const want = s.snow > 0.004 ? Math.round(CAPS[tier] * Math.min(1, 0.15 + 0.85 * s.snow) * (1 + 0.35 * heavy + 0.6 * bz) * (s.motion ? 1 : 0.35)) : 0;
      if (!want && !flakes.length) return;
      if (moving) {
        while (flakes.length < want) { const r = Math.random(), d = r < DEPTH[0].k ? 0 : r < DEPTH[0].k + DEPTH[1].k ? 1 : 2; flakes.push(spawn(d, flakes.length < want * 0.7 && want - flakes.length > 20)); }
        if (flakes.length > want) flakes.length = want;
      }
      const day = clamp01(s.day), night = 1 - day, wind = Math.max(-16, Math.min(16, s.wind || 0)) * 2.6 * (1 + 1.5 * bz);
      const big = 1 + 0.35 * heavy + 0.15 * bz, streak = bz > 0.25 && s.motion;
      const B = new Map();
      const base = day > 0.5 ? [250, 252, 255] : [200, 208, 240];
      const q = v => Math.round(v / 24) * 24;
      const lines = streak ? new Map() : null;
      for (const f of flakes) {
        const D = DEPTH[f.d];
        if (s.motion && moving) {
          f.y += D.v * f.s * sec * (1 + 0.55 * bz);
          // (ATM-A: the shared wind THERE — the gust waves roll through the snow: it gusts sideways in sheets, settles in the lulls;
          // ATM-B: a blizzard DRIVES it sideways — the gusts' share stronger)
          const wf = s.windAt ? Math.max(-16, Math.min(16, s.windAt(f.x < 0 ? 0 : f.x > W ? 1 : f.x / W))) * 2.6 * (1 + 1.5 * bz) : wind;
          f.vx = wf * (0.5 + 0.5 * f.d) + Math.sin(s.t * 0.7 + f.ph) * (6 + 6 * f.d) * (1 - 0.6 * bz);
          f.x += f.vx * sec;
          if (f.y > f.land) Object.assign(f, spawn(f.d, false));
          if (f.x > W + 40) f.x -= W + 80; else if (f.x < -40) f.x += W + 80;
        }
        if (only != null && f.d !== only) continue;
        let col = base;
        const L = night > 0.15 && s.lightAt ? s.lightAt(f.x, f.y) : null;
        if (L && L[3] > 0.02) { const k = Math.min(1, L[3] * 2.2) * night; col = [col[0] + (L[0] - col[0]) * k * 0.7 + 40 * k, col[1] + (L[1] - col[1]) * k * 0.7 + 40 * k, col[2] + (L[2] - col[2]) * k * 0.7 + 40 * k]; }
        const a = D.a * (f.d === 0 ? 0.6 + 0.4 * day : 1) * Math.min(1, (f.land - f.y) / 40 + 0.2);
        const r0 = Math.min(255, q(col[0])), g0 = Math.min(255, q(col[1])), b0 = Math.min(255, q(col[2])), al = Math.round(a * 4), key = ((f.d * 4 + al) * 11 + r0 / 24) * 121 + (g0 / 24) * 11 + b0 / 24;   // (a number, never a string a flake)
        if (lines && f.d > 0) {
          // (the blizzard: a near / mid flake a short streak along its flight — the snow reads DRIVEN, not drifting)
          let ln = lines.get(key); if (!ln) { ln = { col: [r0, g0, b0], a: al / 4, w: D.r * big * (f.d === 2 ? 0.8 : 0.7), seg: [] }; lines.set(key, ln); }
          const vy = D.v * f.s * (1 + 0.55 * bz), vx = f.vx || 0, k = (f.d === 2 ? 0.13 : 0.09) * bz;
          ln.seg.push(f.x - vx * k, f.y - vy * k, f.x, f.y);
          continue;
        }
        let b = B.get(key); if (!b) { b = { col: [r0, g0, b0], a: al / 4, d: f.d, pts: [] }; B.set(key, b); }
        b.pts.push(f.x, f.y, D.r * f.s * (f.d === 2 ? big : 1));
      }
      if (lines) { c.lineCap = 'round'; for (const ln of lines.values()) { if (ln.a <= 0) continue; c.globalAlpha = ln.a; c.strokeStyle = `rgb(${ln.col[0] | 0},${ln.col[1] | 0},${ln.col[2] | 0})`; c.lineWidth = ln.w; c.beginPath(); const g = ln.seg; for (let i = 0; i < g.length; i += 4) { c.moveTo(g[i], g[i + 1]); c.lineTo(g[i + 2], g[i + 3]); } c.stroke(); } }
      for (const b of B.values()) {
        if (b.a <= 0) continue;
        c.globalAlpha = b.a; c.fillStyle = `rgb(${b.col[0] | 0},${b.col[1] | 0},${b.col[2] | 0})`;
        if (b.d === 0) { for (let i = 0; i < b.pts.length; i += 3) { const r = b.pts[i + 2]; c.fillRect(b.pts[i] - r, b.pts[i + 1] - r, r * 2, r * 2); } continue; }   // (the far ones: tiny squares — no arcs)
        c.beginPath();
        for (let i = 0; i < b.pts.length; i += 3) { const r = b.pts[i + 2]; c.moveTo(b.pts[i] + r, b.pts[i + 1]); c.arc(b.pts[i], b.pts[i + 1], r, 0, 6.2832); }
        c.fill();
      }
      c.globalAlpha = 1;
    },
    /** THE AWNING's SLAB: { on (snow lies on it), a: the awning's front edge on screen { x0, x1, y }, foot (the walk's y), col, t, dt, motion,
     *  force (slide one now) } — a chunk slides off now + then (every 2–6 min) */
    slab(c, s) {
      const now = s.t;
      if (!s.on || !s.motion) { slab = null; return; }
      if (!nextSlab) nextSlab = now + 20 + Math.random() * 60;
      if (!slab && (now >= nextSlab || s.force)) {
        const w = (s.a.x1 - s.a.x0) * (0.18 + Math.random() * 0.2), x = s.a.x0 + Math.random() * (s.a.x1 - s.a.x0 - w);
        slab = { x, w, t0: now, y: s.a.y }; nextSlab = now + 120 + Math.random() * 240;
      }
      if (!slab) return;
      const u = now - slab.t0, fall = Math.max(0, u - 0.7), h = Math.max(2.5, slab.w * 0.18);
      c.fillStyle = `rgb(${s.col[0] | 0},${s.col[1] | 0},${s.col[2] | 0})`;
      if (u < 0.7) {                                   // (it creeps over the edge, tipping)
        const k = u / 0.7; c.globalAlpha = 1; c.beginPath(); c.ellipse(slab.x + slab.w / 2, slab.y + k * h * 0.8, slab.w / 2, h * (0.6 + 0.3 * k), 0.1 * k, 0, 6.2832); c.fill();
      } else {
        const y = slab.y + h * 0.8 + 0.5 * 600 * fall * fall;
        if (y < s.foot) { c.globalAlpha = 1; c.beginPath(); c.ellipse(slab.x + slab.w / 2, y, slab.w / 2 * (1 - 0.15 * fall), h * 0.8, 0.2, 0, 6.2832); c.fill(); }
        else {                                          // (it bursts into a puff on the walk)
          const land = Math.sqrt(2 * (s.foot - slab.y - h * 0.8) / 600) + 0.7, v = u - land;
          if (v > 1.2) { slab = null; c.globalAlpha = 1; return; }
          c.globalAlpha = Math.max(0, 1 - v / 1.2);
          for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 6), r = slab.w * (0.15 + 0.5 * v); c.beginPath(); c.arc(slab.x + slab.w / 2 + Math.cos(a) * r, s.foot + Math.sin(a) * r * 0.4, Math.max(1, slab.w * 0.12 * (1 - v / 1.4)), 0, 6.2832); c.fill(); }
        }
      }
      c.globalAlpha = 1;
    },
    /** THE TREES SHAKING SNOW OFF in the gusts: s = { on (snow on the crowns 0..1), trees: [{ x, y (the crown's top), r }], at (u → the gust
     *  there 0..1), wind (signed m/s), W, t, dt, motion, day } — a gust reaching a crown (rising past ~0.45) knocks a puff of snow off it,
     *  drifting down + downwind */
    shake(c, s) {
      const sec = Math.min(0.1, (s.dt || 16) / 1000);
      if (s.on > 0.1 && s.motion && s.at && s.trees) for (let i = 0; i < s.trees.length; i++) {
        const tr = s.trees[i], g = s.at(Math.max(0, Math.min(1, tr.x / (s.W || W || 1)))), was = shook.get(i) || 0;
        if (g > 0.45 && was <= 0.45 && puffs.length < 160) for (let k = 0; k < 18; k++) puffs.push({ x: tr.x + (Math.random() - 0.5) * tr.r * 1.6, y: tr.y + Math.random() * tr.r * 0.9, vx: (s.wind || 0) * (1.2 + Math.random()) + (Math.random() - 0.5) * 8, vy: 6 + Math.random() * 14, r: 0.9 + Math.random() * 1.8, a: 0.95, life: 2 + Math.random() * 1.6 });
        shook.set(i, g);
      }
      if (!puffs.length) return;
      c.save(); c.fillStyle = s.day > 0.5 ? 'rgb(248,250,255)' : 'rgb(206,212,240)';
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        if (s.motion) { p.x += p.vx * sec; p.y += p.vy * sec; p.vy += 22 * sec; p.life -= sec; }
        if (p.life <= 0) { puffs.splice(i, 1); continue; }
        c.globalAlpha = Math.min(1, p.life / 1.2) * p.a; c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      c.restore();
    },
    /** THE GROUND SNOW in the wind: s = { lie (snow lying 0..1), band: { y0, y1 } (the promenade — never the street under the dock), W, at,
     *  side (+1 blowing right), level (the wind 0..1), t, dt, motion, day, drifts: [{ x, y, w }] (the speakeasy's foot, the benches' legs),
     *  blizzard } — STREAMERS of snow blown low along the stones in the gusts + soft DRIFTS banked against the walls + legs (downwind side) */
    ground(c, s) {
      const lie = clamp01(s.lie || 0); if (lie < 0.15 || !s.band) return;
      const day = clamp01(s.day || 0), col = day > 0.5 ? [246, 248, 254] : [196, 202, 232], sh = day > 0.5 ? [206, 214, 230] : [120, 126, 160];
      // the DRIFTS (they build with the snow + the wind — banked on the downwind side)
      const dk = lie * (0.5 + 0.5 * clamp01(s.level || 0) + 0.3 * clamp01(s.blizzard || 0));
      if (dk > 0.15 && s.drifts) for (const d of s.drifts) {
        const w = d.w * (0.7 + 0.6 * dk), h = Math.max(2, w * 0.22 * dk), x = d.x + (s.side || 1) * w * 0.25;
        c.globalAlpha = 0.95; c.fillStyle = `rgb(${col})`; c.beginPath(); c.ellipse(x, d.y, w, h, 0, Math.PI, 0); c.fill();
        c.globalAlpha = 0.35; c.fillStyle = `rgb(${sh})`; c.fillRect(x - w, d.y - 0.6, w * 2, 1.2);
      }
      // the STREAMERS: long low wisps racing along the stones while a gust blows (a strong wind only)
      const sec = Math.min(0.1, (s.dt || 16) / 1000), lv = clamp01(((s.level || 0) - 0.35) / 0.4) + 0.6 * clamp01(s.blizzard || 0);
      if (!streams.length) { let q = 31; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; }; for (let i = 0; i < 9; i++) streams.push({ x: r() * (s.W || W), y: r(), len: 40 + r() * 70, ph: r() * 6.28 }); }
      if (lv < 0.05) return;
      const B = s.band;
      c.save(); c.fillStyle = `rgb(${col})`;
      for (const st of streams) {
        const g = s.at ? s.at(Math.max(0, Math.min(1, st.x / (s.W || W || 1)))) : 0.5;
        if (s.motion) { st.x += (s.side || 1) * (60 + 140 * g) * lv * sec; if (st.x > (s.W || W) + st.len) st.x = -st.len; else if (st.x < -st.len) st.x = (s.W || W) + st.len; }
        const a = lie * lv * (0.15 + 0.55 * g) * (0.7 + 0.3 * Math.sin((s.t || 0) * 1.3 + st.ph));
        if (a < 0.02) continue;
        const y = B.y0 + (B.y1 - B.y0) * (0.1 + 0.8 * st.y);
        c.globalAlpha = Math.min(0.75, a); c.beginPath(); c.ellipse(st.x, y, st.len * (0.7 + 0.5 * g), 1.4 + 1.6 * g, 0, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    },
    debug: () => ({ flakes: flakes.length, slab: !!slab, puffs: puffs.length }),
  };
}

/**
 * 9b — THE WINTER WORK's live effects (people.js#drawCar, after the truck): THE PLOW's SPRAY — snow thrown up off the blade's top in an
 * arc toward the kerb, a white plume that reads at phone size while it moves; THE SALT TRUCK's FAN — grains sprayed from the spinner
 * under its tail in a widening cone onto the road + the darker WET lane it leaves behind it.
 * o: { x (screen: the truck's middle), y (the road under it), sp (pt a unit), dir, len (units), speed (u / s), t, night 0..1, xEnd (screen:
 *     where the lane leaves the screen behind it), fade }
 */
export function workFx(c, kind, o) {
  const mv = clamp01((o.speed || 0) / 1.5), sp = o.sp, d = o.dir, t = o.t || 0;
  if (kind === 'plow') {
    if (mv < 0.05) return;
    const bx = o.x + d * (o.len / 2 + 0.1) * sp;            // (the blade's outer end)
    c.fillStyle = o.night > 0.5 ? 'rgb(172,178,214)' : 'rgb(246,249,255)';
    for (let i = 0; i < 24; i++) {
      const u = ((t * 1.4 + i / 24) % 1), a = (1 - u * u) * 0.95 * mv * (o.fade == null ? 1 : o.fade), w = ((i * 0.618) % 1) - 0.5;
      if (a < 0.03) continue;
      // (each puff leaves the blade's top, arcs up + forward-out, falls back toward the kerb as it spreads — a bold white plume)
      const px = bx + d * (0.1 + 2.4 * u + 0.4 * w) * sp, py = o.y - (1.1 + 2.0 * u - 2.6 * u * u + 0.3 * w) * sp, r = (0.2 + 0.42 * u) * sp;
      c.globalAlpha = a; c.beginPath(); c.arc(px, py, Math.max(0.8, r), 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
  } else if (kind === 'flusher') {
    // 9e — THE WATER WAGON: two FANS of spray from the nozzles at the TAIL (the owner: "the water should be coming out the back of it"),
    // low + wide out to both sides + trailing behind, arcing down onto the road — droplets caught in the lamps at night (a pale
    // silver-blue), sparkling white by day; the road behind left dark + glossy (a wide wet band out to where the lane leaves the screen)
    const nx = o.x - d * (o.len / 2 - 0.15) * sp, fade = o.fade == null ? 1 : o.fade;
    if (o.xEnd != null) { const a = Math.min(nx, o.xEnd), w = Math.abs(o.xEnd - nx); c.globalAlpha = 0.3 * fade; c.fillStyle = 'rgb(14,16,26)'; c.fillRect(a, o.y - 0.7 * sp, w, 1.3 * sp); c.globalAlpha = 0.12 * fade; c.fillStyle = o.night > 0.5 ? 'rgb(150,160,200)' : 'rgb(230,236,246)'; c.fillRect(a, o.y - 0.2 * sp, w, Math.max(0.6, 0.12 * sp)); c.globalAlpha = 1; }
    if (mv < 0.05) return;
    c.fillStyle = o.night > 0.5 ? 'rgb(196,210,240)' : 'rgb(244,248,255)';
    // (2nd look pass: the fans were a faint mist at phone size — bigger, brighter drops, wider out, a soft veil behind them)
    c.globalAlpha = 0.18 * mv * fade; c.beginPath(); c.ellipse(nx - d * 1.0 * sp, o.y - 0.25 * sp, 1.6 * sp, 0.55 * sp, 0, 0, 6.2832); c.fill();
    for (let i = 0; i < 64; i++) {
      const u = ((t * 1.7 + i * 0.381) % 1), side = i % 2 ? 1 : -1, w = ((i * 0.618) % 1) - 0.5, a = (1 - u * u) * (0.85 + 0.15 * w) * mv * fade;
      const px = nx - d * (0.3 + 1.5 * u + 0.35 * w) * sp, py = o.y - (0.45 + 1.1 * u - 1.3 * u * u) * sp + side * (0.15 + 2.0 * u) * sp * 0.45, r = Math.max(0.9, (0.09 + 0.14 * u) * sp);
      c.globalAlpha = a; c.beginPath(); c.arc(px, py, r, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
  } else if (kind === 'salter') {
    const tx = o.x - d * (o.len / 2 - 0.2) * sp;             // (the spinner under the tail)
    // the wet salted lane behind it (darker, a faint gloss) — out to where the lane leaves the screen
    if (o.xEnd != null) { const a = Math.min(tx, o.xEnd), w = Math.abs(o.xEnd - tx); c.globalAlpha = 0.22 * (o.fade == null ? 1 : o.fade); c.fillStyle = 'rgb(18,18,28)'; c.fillRect(a, o.y - 0.5 * sp, w, 0.9 * sp); c.globalAlpha = 1; }
    if (mv < 0.05) return;
    c.fillStyle = o.night > 0.5 ? 'rgb(200,204,226)' : 'rgb(236,234,226)';
    for (let i = 0; i < 26; i++) {
      const u = ((t * 2.4 + i * 0.381) % 1), side = ((i * 0.618) % 1) * 2 - 1, a = (1 - u) * 0.85 * mv;
      const px = tx - d * (0.15 + 1.1 * u) * sp + side * 0.25 * sp * u, py = o.y - (0.55 - 0.5 * u) * sp + side * 0.35 * sp * u;
      c.globalAlpha = a; c.fillRect(px, py, Math.max(0.7, 0.07 * sp), Math.max(0.7, 0.07 * sp));
    }
    c.globalAlpha = 1;
  }
}
