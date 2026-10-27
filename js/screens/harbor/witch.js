// CITY 2.0 — THE HARBOR, PART 11a-1: THE WITCH (docs/harbor.md#part-11a-1) — replaces City 1.0's district witch on the Harbor.
// WHEN is pure (core/harbor-ghost.js#witchAt: a pass every ~7 min on Halloween night, ~25 min on the last week's nights — the same
// moment on every phone); &force=witch loops a pass. A crafted silhouette ~40–46 pt long on a phone: the tall pointed hat with its
// tip bent back by the wind + a wide brim, the long hooked profile, hair streaming, a CLOAK billowing behind her in travelling
// ripples, the dress's hem fluttering, a pointed boot, a long crooked broom with a bound bundle of twigs — and a trail of drifting
// NEON sparkles (orange + green) off the bristles. Lit like a figure crossing the moon: a near-black silhouette with a cool moonlit rim
// on the moon's side (strongest as she crosses its disc) and the city's neon rim from below. Her path crosses the real moon when it's
// up (fs.moonAt); otherwise she flies the LOW sky against the city's glow (the high sky is too dark for a silhouette). The three depth rules: behind the NEON logo + the tagline (the title's DOM is
// over the canvas), in front of the moon + the stars + the clouds. A cackle once as she passes the moon. Drawn at scene.js
// HOOK-B-SKY. Reduced motion: no witch.
import { witchAt, witchPath, WITCH_LEN } from '../../core/harbor-ghost.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** her figure in a 100-unit box (facing +x, y down; the broom's line through the origin) — a single silhouette path set, then filled
 *  by the caller. ph: the time (the cloak's + hair's ripples), fl: 0..1 the flutter's strength */
function figurePaths(x, ph, fl) {
  const w = (k, sp, a) => Math.sin(ph * sp - k) * a * fl;
  // ---- the CLOAK (behind everything): from her shoulders, billowing back in travelling waves, a scalloped hem
  x.beginPath();
  x.moveTo(8, -27);
  x.bezierCurveTo(-8, -34 + w(0.5, 6, 2), -24, -30 + w(1.2, 6, 3), -40, -33 + w(2.0, 6, 5));
  x.bezierCurveTo(-48, -35 + w(2.6, 6, 6), -56, -30 + w(3.2, 6, 7), -60, -26 + w(3.8, 6, 8));
  // the trailing hem: three scallops (each its own lag in the wave)
  x.quadraticCurveTo(-52, -24 + w(3.6, 6, 6), -50, -19 + w(3.4, 6, 6));
  x.quadraticCurveTo(-44, -20 + w(3.0, 6, 5), -41, -14 + w(2.8, 6, 5));
  x.quadraticCurveTo(-34, -15 + w(2.4, 6, 4), -30, -9 + w(2.2, 6, 3));
  x.quadraticCurveTo(-20, -11 + w(1.6, 6, 2), -8, -4);
  x.lineTo(4, -10);
  x.closePath(); x.fill(); x.beginPath();
  // ---- the BROOM: a long crooked handle (forward), the binding, the twig bundle (back)
  x.moveTo(-30, 1.6); x.quadraticCurveTo(10, -1.2, 58, -4.6); x.lineTo(58.4, -2.8); x.quadraticCurveTo(10, 1.0, -30, 4.0); x.closePath(); x.fill(); x.beginPath();
  x.moveTo(-28, -1.8); x.lineTo(-33, -1.6); x.lineTo(-33.4, 6.0); x.lineTo(-28.2, 5.6); x.closePath(); x.fill(); x.beginPath();
  // the twig bundle: a fan of slightly curved bristles (each its own length) — as one ragged shape + loose twigs (stroked by the caller)
  x.moveTo(-33, -1.8);
  x.quadraticCurveTo(-46, -7 + w(0.4, 9, 0.8), -64, -10 + w(0.6, 9, 1.5));
  x.lineTo(-58, -6.5); x.lineTo(-66, -4.4); x.lineTo(-59, -1.6); x.lineTo(-67, 1.6); x.lineTo(-59.5, 3.4); x.lineTo(-65, 8.4); x.lineTo(-57, 7.6);
  x.quadraticCurveTo(-46, 9.5 + w(0.5, 9, 0.8), -33, 6.0);
  x.closePath(); x.fill(); x.beginPath();
  // ---- the DRESS over the broom (the skirt draped down both sides, its hem fluttering back)
  x.moveTo(9, -8); x.lineTo(-7, -7);
  x.quadraticCurveTo(-14, -2 + w(1.0, 7, 1), -26, 3 + w(1.6, 7, 2.2));
  x.quadraticCurveTo(-22, 5 + w(1.5, 7, 2), -21, 7 + w(1.4, 7, 2.2));
  x.quadraticCurveTo(-14, 6 + w(1.1, 7, 1.6), -10, 9.5 + w(0.9, 7, 1.4));
  x.quadraticCurveTo(-4, 8.5 + w(0.6, 7, 1), 2, 10.5 + w(0.4, 7, 0.8));
  x.quadraticCurveTo(8, 7, 11, 1); x.closePath(); x.fill(); x.beginPath();
  // ---- the LEG + the pointed BOOT (the toe curled up), hanging forward of the broom
  x.moveTo(4, 3); x.quadraticCurveTo(9, 8, 8, 15); x.lineTo(13, 18.5); x.quadraticCurveTo(18, 19, 19.5, 15.5); x.quadraticCurveTo(17.5, 17, 14.5, 16); x.lineTo(11.6, 14.4); x.quadraticCurveTo(12, 8, 8.6, 2); x.closePath(); x.fill(); x.beginPath();
  // ---- the TORSO leaning forward (the cloak's shoulder over it)
  x.moveTo(-6, -6); x.quadraticCurveTo(-4, -20, 6, -29); x.quadraticCurveTo(13, -31, 15, -26); x.quadraticCurveTo(12, -16, 9, -5); x.closePath(); x.fill(); x.beginPath();
  // ---- the ARM reaching forward to grip the broom (bony fingers)
  x.moveTo(9, -25); x.quadraticCurveTo(15, -18, 19, -9); x.quadraticCurveTo(21, -5, 25, -2.8); x.lineTo(27.5, -2.2); x.lineTo(26.6, -4.6); x.lineTo(28.6, -4.9); x.lineTo(24.6, -6.2); x.quadraticCurveTo(20, -12, 13.5, -27); x.closePath(); x.fill(); x.beginPath();
  // ---- the SLEEVE: wide + flared from the elbow, hanging under the forearm, its cuff fluttering back
  x.moveTo(13.5, -21); x.quadraticCurveTo(17.5, -14, 20.5, -8.5); x.quadraticCurveTo(18.5, -5.5 + w(0.6, 7, 1.2), 15.5, -4.2 + w(0.8, 7, 1.8)); x.quadraticCurveTo(14, -6.5 + w(0.7, 7, 1.4), 12.2, -6.8 + w(0.9, 7, 1.6)); x.quadraticCurveTo(13.2, -13, 11.4, -19.5); x.closePath(); x.fill(); x.beginPath();
  // ---- the HEAD in profile: the long hooked nose, the pointed chin, the neck
  x.moveTo(9.5, -29); x.quadraticCurveTo(9, -36, 13, -38.5); x.quadraticCurveTo(17.5, -40, 19, -36.5);
  x.lineTo(23.5, -33.6); x.quadraticCurveTo(24.4, -32.6, 22.6, -32.6); x.lineTo(19.6, -33.2);   // (the nose, its hook)
  x.quadraticCurveTo(20, -31, 18.6, -30.2); x.lineTo(20.2, -27.6); x.quadraticCurveTo(17, -27.4, 15, -28.6); x.lineTo(13.6, -26); x.closePath(); x.fill(); x.beginPath();
  // ---- the HAIR streaming back from under the hat (long wisps)
  x.moveTo(12, -38); x.bezierCurveTo(4, -40 + w(0.2, 8, 1.2), -6, -36 + w(1, 8, 2.5), -16, -40 + w(1.8, 8, 3.5));
  x.lineTo(-11, -36 + w(1.6, 8, 3)); x.bezierCurveTo(-18, -33 + w(2.2, 8, 3.5), -10, -33 + w(1.2, 8, 2.5), -20, -31 + w(2.4, 8, 4));
  x.bezierCurveTo(-6, -30 + w(1, 8, 2), 4, -31, 10, -30); x.closePath(); x.fill(); x.beginPath();
  // ---- the HAT: the wide brim (an ellipse tilted back), the tall crown bending back in the wind, its tip curling
  x.moveTo(1, -39.5); x.quadraticCurveTo(14, -44, 26, -41.4); x.quadraticCurveTo(25, -39.6, 22, -39.4); x.quadraticCurveTo(12, -38.4, 2, -37.6); x.closePath(); x.fill(); x.beginPath();
  x.moveTo(7.4, -40.8); x.quadraticCurveTo(10, -52, 6, -61 + w(0.3, 5, 0.6)); x.quadraticCurveTo(1, -67 + w(0.5, 5, 1.2), -6.5, -66 + w(0.7, 5, 1.8));
  x.quadraticCurveTo(-1.5, -64.5 + w(0.6, 5, 1.4), 1.5, -61 + w(0.4, 5, 0.8)); x.quadraticCurveTo(7.5, -53, 19.5, -41.6); x.closePath(); x.fill(); x.beginPath();
}
/** the loose twigs + the handle's knots (strokes) */
function twigs(x, ph, fl) {
  const w = (k) => Math.sin(ph * 9 - k) * 0.8 * fl;
  x.beginPath();
  for (const [y0, y1, l, k] of [[-0.8, -9, 30, 0.2], [0.4, -4, 31, 0.5], [2, 1, 30, 0.7], [3.6, 6, 29, 0.9], [4.8, 10.6, 31, 1.2], [1.2, -12, 22, 0.4], [3, 11.5, 24, 1]]) {
    x.moveTo(-33, y0); x.quadraticCurveTo(-33 - l * 0.5, (y0 + y1) / 2 + w(k), -33 - l, y1 + w(k + 0.3));
  }
  x.moveTo(20, -1.6); x.lineTo(21, -3.6); x.moveTo(38, -3.2); x.lineTo(39.6, -5.4);
}

export function createWitch() {
  let cur = null, cackled = '', sparks = [], fig = null, figKey = '', rim = null;
  const sparkSpr = new Map();
  function spark(col) {
    const key = col.join(','); let cv = sparkSpr.get(key);
    if (cv) return cv;
    cv = mk(32, 32); const x = safeCtx(cv), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,250,230,0.95)'); g.addColorStop(0.1, `rgba(${key},0.95)`); g.addColorStop(0.5, `rgba(${key},0.25)`); g.addColorStop(1, `rgba(${key},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    // a four-point star glint through it
    x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(${key},0.7)`; x.fillRect(15.4, 3, 1.2, 26); x.fillRect(3, 15.4, 26, 1.2);
    sparkSpr.set(key, cv);
    return cv;
  }

  /** the pass now: forced (a loop from the flag) or the clock's */
  function passOf(env) {
    if (env.since != null) {
      const e = env.nowS - env.since - 1.5, per = WITCH_LEN + 5;
      if (e < 0) return null;
      const n = Math.floor(e / per), s = e - n * per;
      return s < WITCH_LEN ? { s, len: WITCH_LEN, dir: n % 2 ? 1 : -1, lane: 0.4, slot: n } : null;
    }
    return witchAt(env.lc, env.weight);
  }

  /**
   * draw(c, env) — scene.js HOOK-B-SKY. env: { lc, weight (HP.witch), since (&force=witch's start, s) | null, nowS, W, HZ, safeTop,
   *   lanes, moonAt ({ x, y, r }) | null, t, dt, motion, tier, dark (0..1), play }
   */
  let drawMs = 0;
  function draw(c, env) { const t0 = performance.now(); drawInner(c, env); drawMs = drawMs * 0.9 + (performance.now() - t0) * 0.1; }
  function drawInner(c, env) {
    const dt = Math.min(0.1, (env.dt || 16) / 1000);
    const P = env.motion && env.dark > 0.35 ? passOf(env) : null;
    cur = null;
    if (P) {
      const u = P.s / P.len, size = Math.max(36, Math.min(54, env.W * 0.105)), sc = size / 100;
      const path = witchPath(u, P.dir);
      let x = env.W * path.x;
      // her height: across the MOON when it's up (the classic silhouette) — the path's swoop placed so she crosses its disc; else
      // the high sky's lane (seeded per pass)
      const m = env.moonAt, top = (env.safeTop || 40) + 30, low = env.HZ * 0.5;
      let base;
      const moonOn = m && m.y > top - 20 && m.y < env.HZ * 0.62 && m.x > -20 && m.x < env.W + 20;
      if (moonOn) { const um = P.dir > 0 ? (m.x / env.W + 0.18) / 1.36 : (1.18 - m.x / env.W) / 1.36; const pm = witchPath(clamp01(um), P.dir); base = m.y + size * 0.05 - pm.swoop * size * 0.5; }
      // (no moon: the LOW sky between the tagline + the crowns — the city's glow behind her makes the silhouette read; the high sky is
      // near-black there)
      else { const ln = env.lanes && (env.lanes['sky-low'] || env.lanes['sky-high']); base = ln ? ln.y + ln.h * (0.3 + 0.4 * P.lane) : top + (low - top) * (0.5 + 0.3 * P.lane); }
      const y = base + path.swoop * size * 0.5;
      const near = moonOn ? clamp01(1 - Math.hypot(x - m.x, y - size * 0.2 - m.y) / ((m.r || 12) * 2.6 + size * 0.5)) : 0;
      cur = { x, y, size, sc, dir: P.dir, tilt: path.tilt, u, near, s: P.s, slot: P.slot };
      // the cackle as she passes the moon (else in the middle of her pass) — once a pass
      const key = `${P.slot}|${P.dir}|${Math.floor((env.nowS - P.s) / 5)}`;
      if (env.play && cackled !== key && ((moonOn && near > 0.4) || (!moonOn && u > 0.45 && u < 0.6))) { cackled = key; env.play('witch-cackle', { pan: Math.max(-1, Math.min(1, x / env.W * 2 - 1)), gain: 0.75 }); }
      // the SPARKS off the bristles: orange + green neon motes drifting back + down, twinkling as they fade
      // (about 30 a second at tier 2 — drifting motes, not an exhaust plume)
      const n = Math.random() < (env.tier === 0 ? 0.3 : 0.5) ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const bx = x - P.dir * (60 + Math.random() * 6) * sc, by = y + (Math.random() * 10 - 3) * sc;
        sparks.push({ x: bx, y: by, vx: -P.dir * (6 + Math.random() * 14), vy: 6 + Math.random() * 14, life: 0, max: 1.4 + Math.random() * 1.8, col: Math.random() < 0.55 ? [255, 140, 40] : [100, 255, 130], s: 2.2 + Math.random() * 2.8, tw: Math.random() * 6 });
      }
    }
    if (sparks.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const keep = [];
      for (const p of sparks) {
        p.life += dt; if (p.life > p.max) continue; keep.push(p);
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy += 3 * dt;
        const k = 1 - p.life / p.max, tw = 0.6 + 0.4 * Math.sin(p.life * 18 + p.tw);
        c.globalAlpha = Math.min(1, 0.85 * k * tw); const r = p.s * (0.6 + 0.4 * k);
        c.drawImage(spark(p.col), p.x - r, p.y - r, r * 2, r * 2);
      }
      sparks = keep; if (sparks.length > 140) sparks.splice(0, sparks.length - 140);
      c.restore(); c.globalAlpha = 1;
    }
    if (!cur) return;
    drawFigure(c, cur, env);
  }

  // her silhouette, rim-lit: rendered into a small canvas each frame (she is one ~50 pt figure for 13 s every few minutes)
  // (11a-2 — the owner: "very choppy": she cost ~25 ms a frame at 4× CPU — two full canvases repainted every frame at the phone's 3×.
  // Now ONE canvas (the rims painted first, the silhouette over them), at most 2× density (a ~50 pt silhouette in motion), allocated
  // once at its largest + only grown, and the cloak's ripples REPAINTED at ~30 fps — her place still moves every frame (a sub-pixel
  // drawImage))
  let figT = -1, figSz = 0;
  function drawFigure(c, W, env) {
    const dpr = Math.min(2, env.dpr || 2), pad = 12, sz = W.size * 1.45 + pad * 2, px = Math.ceil(sz * dpr);
    if (!fig || fig.width < px) { if (fig) fig.width = fig.height = 0; fig = mk(px, px * 0.8); figT = -1; }
    const fresh = figSz !== px || env.t - figT >= 1 / 31 || env.t < figT || env.motion === false;
    const cx = px / 2, cy = Math.ceil(px * 0.8) * 0.56;
    if (fresh) {
      figT = env.t; figSz = px;
      const ph = env.t, fl = 1, fx = safeCtx(fig), k = W.sc * dpr;
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, fig.width, fig.height); fx.setTransform(k * W.dir, 0, 0, k, cx, cy); fx.rotate(W.tilt * W.dir);
      const paint = (col) => { fx.fillStyle = col; fx.beginPath(); figurePaths(fx, ph, fl); fx.fill(); fx.strokeStyle = col; fx.lineWidth = 1.3; fx.lineCap = 'round'; twigs(fx, ph, fl); fx.stroke(); };
      // the rims first, offset toward each light: (1) the moonlit rim — cool white, from above-behind, strongest crossing the disc;
      // (2) the neon from the city below — a warm orange-pink on the undersides; then the silhouette on top (the rims show at the edges)
      const moonA = 0.35 + 0.65 * W.near, o = 0.75 / W.sc;
      fx.save(); fx.translate(-1.0 * o, -1.25 * o); paint(`rgba(214,228,255,${moonA.toFixed(3)})`); fx.restore();
      fx.save(); fx.translate(0.3 * o, 1.2 * o); paint('rgba(255,120,170,0.6)'); fx.restore();
      paint('rgb(10,7,18)');
      // the details that read inside the silhouette: the hat's band (a faint purple sheen), the buckle's glint, the cloak's lining
      fx.fillStyle = 'rgba(120,70,170,0.55)'; fx.beginPath(); fx.moveTo(4, -43.5); fx.quadraticCurveTo(12, -45.5, 18.6, -43); fx.lineTo(19.2, -41.2); fx.quadraticCurveTo(12, -43.4, 3.6, -41.2); fx.closePath(); fx.fill();
      fx.fillStyle = 'rgba(255,190,90,0.9)'; fx.fillRect(10.2, -44.4, 2.2, 2.2);
      fx.fillStyle = 'rgba(90,36,120,0.5)'; fx.beginPath(); fx.moveTo(-8, -4); fx.quadraticCurveTo(-20, -11, -30, -9); fx.quadraticCurveTo(-24, -7, -8, -2); fx.closePath(); fx.fill();
    }
    const w = px / dpr, h = Math.ceil(px * 0.8) / dpr, x0 = W.x - w / 2, y0 = W.y - cy / dpr;
    c.save(); c.globalAlpha = Math.min(1, clamp01(W.u / 0.04) * clamp01((1 - W.u) / 0.04) + 0.0001);
    c.drawImage(fig, 0, 0, px, Math.ceil(px * 0.8), x0, y0, w, h);
    c.restore();
  }

  return {
    draw,
    /** the preview page: her figure at a place — W: { x, y, size, dir, tilt, near, u } */
    drawAt(c, W, env) { drawFigure(c, { sc: W.size / 100, tilt: 0, near: 0, u: 0.5, ...W }, env); },
    busy: () => !!cur || sparks.length > 0,
    debug: () => (cur ? { on: true, x: +cur.x.toFixed(1), y: Math.round(cur.y), u: +cur.u.toFixed(2), near: +cur.near.toFixed(2), sparks: sparks.length, ms: +drawMs.toFixed(2) } : { on: false, sparks: sparks.length, ms: +drawMs.toFixed(2) }),
    destroy() { sparks = []; if (fig) fig.width = fig.height = 0; fig = rim = null; for (const cv of sparkSpr.values()) cv.width = cv.height = 0; sparkSpr.clear(); },
  };
}
