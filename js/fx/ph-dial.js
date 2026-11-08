// `card-penthouse` (epic — DM2, the owner's design "A · THE DIAL" — Downloads\grok\dailies-cards-v3\penthouse-own-a.png), DRAWN IN CODE (no art
// file): an Art Deco elevator FLOOR DIAL — 1 → 9 → PH round a gold arch on black lacquer, sunburst rays behind — over gold elevator doors with
// chevrons between fluted Deco pilasters. THE MOTION (an 8-s loop): the needle sweeps up from 1 (each floor lighting as it passes) and lands on
// PH with a small settle → PH + its wedge BLAZE warm gold (a soft bloom) → a LINE OF LIGHT opens between the doors → a glint runs round the arch
// → it all eases back down to 1. Reduced motion = the landed frame (the needle on PH, PH lit, the doors' light open).
// THE BAR (SAFECRACKER + GHOST RUN's cinematic renders): brushed / polished gold with real gradients + specular lines, the lacquer's depth (a
// warm pool under the dial, a slow sheen), subtle grain, a bloom on PH + the door light; crisp at 3× (every static part baked once per size at
// the phone's own ratio — ONE sprite; the moving parts are a needle sprite + stamps); 60 fps on the shared surface (THE GL PAINTER — no text
// in the GL frame: the numbers are baked).
// THE LAYOUT (scene units 1000 × 630 — a full card): the dial's pivot at (740, 400) — the hero ~74 % across, the left 42 % dark lacquer for the
// name; the SLIM strip has its OWN band (20–52 % down — the upper numbers, the arch + PH), scaled to the strip's height + set so the pivot sits
// ~0.80 across; PH clear of the gem corner on both.
import { sprite, stamp, glow, sparkle, clamp01, smooth, lerp, fract } from './kit.js';
import { rrect } from './renderer.js';
import { bakeDpr } from './sg-kit.js';

import { SW, SH, C, R_OUT, R_IN, R_NUM, R_WEDGE, R_HUB, DEG, FLOORS, ANG, PH, STEP, pt, phMap } from './ph-specs.js';
const LOOP = 8, STILL_T = 5;

// ---- the gold (2D bakes only): a brushed vertical gold · a polished ring (conic where the browser has it) ----
const GOLD = [[0, '#3a2408'], [0.18, '#8a5f1e'], [0.36, '#d9a94e'], [0.47, '#fff1c4'], [0.55, '#e8bd62'], [0.74, '#9c6c25'], [1, '#4a2f0c']];
function goldLin(c, x0, y0, x1, y1, stops = GOLD) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; }
function goldRing(c, cx, cy) {
  if (typeof c.createConicGradient !== 'function') return goldLin(c, cx - R_OUT, cy - R_OUT, cx + R_OUT, cy);
  const g = c.createConicGradient(-Math.PI / 2, cx, cy);
  [[0, '#fff0c2'], [0.06, '#d4a24a'], [0.16, '#7d5519'], [0.26, '#e2b45a'], [0.33, '#fff4d0'], [0.42, '#b7832f'], [0.5, '#5e3d10'], [0.58, '#b98634'], [0.67, '#fff1c8'], [0.75, '#c99640'], [0.84, '#73501a'], [0.93, '#dcae55'], [1, '#fff0c2']].forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
/** brushed streaks across a gold shape (clip it first): fine light + dark hairlines */
function brush(c, x, y, w, h, k, seed = 1) {
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  c.save(); c.globalCompositeOperation = 'overlay';
  for (let i = 0; i < Math.max(12, h / (2.2 * k)); i++) {
    const yy = y + rnd() * h;
    c.fillStyle = rnd() < 0.5 ? `rgba(255,248,220,${0.05 + rnd() * 0.1})` : `rgba(40,20,0,${0.06 + rnd() * 0.1})`;
    c.fillRect(x, yy, w, Math.max(0.5, 0.6 * k));
  }
  c.restore();
}

/** THE STATIC SCENE, baked ONCE per slot size + ratio: the lacquer, the rays, the grain, the arch + its face, the dim wedges + floors, the doors */
function scene(w, h, full, dpr) {
  const fonts = typeof document !== 'undefined' && document.fonts && document.fonts.check ? (document.fonts.check('700 20px Orbitron') ? 'o' : 'f') : 'f';
  return sprite(`ph-dial:${full ? 'F' : 'S'}:${Math.round(w)}x${Math.round(h)}@${dpr}:${fonts}`, w * dpr, h * dpr, c => {
    const M = phMap(w, h, full);
    c.scale(dpr, dpr);
    // THE LACQUER: near-black, a warm pool round the dial, darker to the edges, a slow diagonal sheen
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#07060a'); bg.addColorStop(1, '#030203'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.save(); c.translate(M.ox, M.oy); c.scale(M.k, M.k);
    const k = 1 / M.k;   // (one scene unit in device px → hairline sizes)
    const pool = c.createRadialGradient(C.x, C.y - 40, 10, C.x, C.y - 40, 620);
    pool.addColorStop(0, 'rgba(70,48,18,0.55)'); pool.addColorStop(0.35, 'rgba(36,24,9,0.35)'); pool.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = pool; c.fillRect(-400, -200, SW + 800, SH + 400);
    // THE SUNBURST: alternating wedges from the pivot across the whole card (faint gold, fading out; quieter on the name's side)
    c.save();
    const rays = 36;
    for (let i = 0; i < rays; i++) {
      if (i % 2) continue;
      const a0 = (i / rays) * Math.PI * 2, a1 = ((i + 1) / rays) * Math.PI * 2;
      c.beginPath(); c.moveTo(C.x, C.y); c.arc(C.x, C.y, 1300, a0, a1); c.closePath();
      const g = c.createRadialGradient(C.x, C.y, R_OUT, C.x, C.y, 1000);
      g.addColorStop(0, 'rgba(214,170,90,0.12)'); g.addColorStop(0.5, 'rgba(180,140,70,0.05)'); g.addColorStop(1, 'rgba(160,120,60,0)');
      c.fillStyle = g; c.fill();
    }
    c.restore();
    // the name's side kept dark (the left 42 %): a soft fade over the rays
    const left = c.createLinearGradient(0, 0, 470, 0); left.addColorStop(0, 'rgba(4,3,5,0.85)'); left.addColorStop(0.75, 'rgba(4,3,5,0.35)'); left.addColorStop(1, 'rgba(4,3,5,0)');
    c.fillStyle = left; c.fillRect(-400, -200, 870, SH + 400);

    // THE PILASTERS (the arch's legs, fluted) + THE DOORS between them
    const legL = C.x - R_OUT, legR = C.x + R_OUT - 22, legW = 22, base = C.y + 6;
    for (const lx of [legL, legR]) {
      c.save(); c.beginPath(); c.rect(lx, base, legW, SH - base + 40); c.clip();
      c.fillStyle = goldLin(c, lx, 0, lx + legW, 0); c.fillRect(lx, base, legW, SH);
      brush(c, lx, base, legW, SH, k, lx);
      for (const f of [0.28, 0.5, 0.72]) { c.fillStyle = 'rgba(40,22,4,0.55)'; c.fillRect(lx + legW * f - 1.1, base + 8, 2.2, SH); c.fillStyle = 'rgba(255,240,200,0.35)'; c.fillRect(lx + legW * f + 1.1, base + 8, 0.9, SH); }
      c.restore();
    }
    // the cornice: a gold ledge the arch stands on, its ears stepped out past the legs (Deco)
    const cor = (x0, x1, y0, hh) => { c.fillStyle = goldLin(c, 0, y0, 0, y0 + hh, [[0, '#fff0c4'], [0.3, '#d6a650'], [0.7, '#8a5e1f'], [1, '#3c2608']]); c.fillRect(x0, y0, x1 - x0, hh); };
    cor(legL - 10, legR + legW + 10, base - 4, 12); cor(legL - 16, legL, base + 3, 6); cor(legR + legW, legR + legW + 16, base + 3, 6);
    // the doors: two lacquered panels, a thin gold frame each, three gold chevrons stacked on each, the seam between them
    const dx0 = legL + legW, dx1 = legR, dTop = base + 8, seam = C.x;
    for (const [x0, x1] of [[dx0 + 6, seam - 2], [seam + 2, dx1 - 6]]) {
      const pg = c.createLinearGradient(x0, 0, x1, 0); pg.addColorStop(0, '#120c06'); pg.addColorStop(0.5, '#1d140a'); pg.addColorStop(1, '#0d0904');
      c.fillStyle = pg; c.fillRect(x0, dTop, x1 - x0, SH - dTop + 20);
      c.strokeStyle = goldLin(c, x0, 0, x1, 0, [[0, '#7a531a'], [0.5, '#e7bb64'], [1, '#7a531a']]); c.lineWidth = 3.2; c.strokeRect(x0 + 6, dTop + 8, x1 - x0 - 12, SH);
      const mx = (x0 + x1) / 2, cw = (x1 - x0) * 0.32;
      for (let j = 0; j < 4; j++) {
        const yy = dTop + 44 + j * 34;
        c.beginPath(); c.moveTo(mx - cw, yy + 14); c.lineTo(mx, yy); c.lineTo(mx + cw, yy + 14);
        c.strokeStyle = goldLin(c, mx - cw, yy, mx + cw, yy, [[0, '#5e3f12'], [0.5, '#f6d088'], [1, '#5e3f12']]); c.lineWidth = 3; c.lineJoin = 'miter'; c.stroke();
      }
    }
    c.fillStyle = '#050302'; c.fillRect(seam - 2, dTop, 4, SH);

    // THE DIAL FACE: the upper half-disc, black lacquer with a faint radial falloff
    c.save(); c.beginPath(); c.arc(C.x, C.y, R_IN, Math.PI, 0); c.closePath(); c.clip();
    const face = c.createRadialGradient(C.x, C.y, 10, C.x, C.y, R_IN); face.addColorStop(0, '#1a1209'); face.addColorStop(1, '#060403');
    c.fillStyle = face; c.fillRect(C.x - R_IN, C.y - R_IN, R_IN * 2, R_IN);
    // THE WEDGES (dim): one per floor, brushed gold from the hub out — the lit ones are drawn live over these
    FLOORS.forEach((_, i) => {
      const a = ANG[i], half = 6.1 * DEG;
      c.beginPath(); c.moveTo(C.x, C.y); c.arc(C.x, C.y, R_WEDGE, -(a + half), -(a - half)); c.closePath();
      const g = c.createRadialGradient(C.x, C.y, R_HUB, C.x, C.y, R_WEDGE);
      g.addColorStop(0, 'rgba(90,60,20,0.25)'); g.addColorStop(0.6, i === PH ? 'rgba(170,120,45,0.55)' : 'rgba(150,104,38,0.5)'); g.addColorStop(1, i === PH ? 'rgba(220,170,80,0.7)' : 'rgba(190,140,60,0.62)');
      c.fillStyle = g; c.fill();
    });
    // the minute ticks inside the ring
    for (let a = 180; a >= 0; a -= 4.133) { const r0 = Math.abs((188 - a) % 12.4) < 0.1 ? R_IN - 14 : R_IN - 8, [x0, y0] = pt(a * DEG, r0), [x1, y1] = pt(a * DEG, R_IN - 2); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = 'rgba(232,190,110,0.45)'; c.lineWidth = 1.4; c.stroke(); }
    c.restore();
    // THE ARCH RING: polished gold (conic), a bevel — a light inner lip + a dark outer edge — + its specular line
    c.save();
    c.beginPath(); c.arc(C.x, C.y, R_OUT, Math.PI, 0); c.arc(C.x, C.y, R_IN, 0, Math.PI, true); c.closePath();
    c.fillStyle = goldRing(c, C.x, C.y); c.fill();
    c.clip(); brush(c, C.x - R_OUT, C.y - R_OUT, R_OUT * 2, R_OUT, k, 7);
    c.restore();
    c.beginPath(); c.arc(C.x, C.y, R_IN + 1.2, Math.PI, 0); c.strokeStyle = 'rgba(255,244,210,0.7)'; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.arc(C.x, C.y, R_OUT - 0.8, Math.PI, 0); c.strokeStyle = 'rgba(50,28,4,0.9)'; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.arc(C.x, C.y, (R_OUT + R_IN) / 2 + 3, 205 * DEG, 245 * DEG); c.strokeStyle = 'rgba(255,252,236,0.55)'; c.lineWidth = 2.2; c.lineCap = 'round'; c.stroke();
    // the hub ring (the needle's boss sits in it — drawn live)
    c.beginPath(); c.arc(C.x, C.y, R_HUB, 0, Math.PI * 2); c.lineWidth = 7; c.strokeStyle = goldRing(c, C.x, C.y); c.stroke();
    c.beginPath(); c.arc(C.x, C.y, R_HUB - 4, 0, Math.PI * 2); c.lineWidth = 1.2; c.strokeStyle = 'rgba(40,22,4,0.8)'; c.stroke();
    // THE FLOORS (dim): gold numerals on the dark round the arch; PH bigger
    c.textAlign = 'center'; c.textBaseline = 'middle';
    FLOORS.forEach((f, i) => {
      const [x, y] = pt(ANG[i], i === PH ? R_NUM + 6 : R_NUM);
      c.font = i === PH ? '900 46px Orbitron, "Chakra Petch", system-ui, sans-serif' : '700 34px Orbitron, "Chakra Petch", system-ui, sans-serif';
      c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillText(f, x + 1.5, y + 2);
      c.fillStyle = goldLin(c, 0, y - 20, 0, y + 20, [[0, '#f3d79a'], [0.5, '#c79a4c'], [1, '#86602a']]);
      c.globalAlpha = i === PH ? 0.85 : 0.72; c.fillText(f, x, y); c.globalAlpha = 1;
    });
    c.restore();
    // THE GRAIN: a fine film over the lacquer
    let s = 12345; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (w * h) / 40; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,240,210,0.035)' : 'rgba(0,0,0,0.06)'; c.fillRect(rnd() * w, rnd() * h, 0.7, 0.7); }
  });
}

/** a lit floor numeral (the warm blaze — baked: no text in the GL frame) */
const litFloor = (i, px, dpr) => sprite(`ph-lit:${i}:${Math.round(px)}@${dpr}`, px * 2.6 * dpr, px * 1.6 * dpr, (c, W, H) => {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `${i === PH ? 900 : 700} ${px * dpr}px Orbitron, "Chakra Petch", system-ui, sans-serif`;
  c.shadowColor = 'rgba(255,190,90,0.95)'; c.shadowBlur = px * 0.5 * dpr;
  const g = c.createLinearGradient(0, H * 0.2, 0, H * 0.8); g.addColorStop(0, '#fffbe8'); g.addColorStop(0.55, '#ffe2a0'); g.addColorStop(1, '#f0b860');
  c.fillStyle = g; c.fillText(FLOORS[i], W / 2, H / 2 + px * 0.04 * dpr);
  c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,250,0.85)'; c.fillText(FLOORS[i], W / 2, H / 2 + px * 0.04 * dpr);
});
/** the needle: a tapered polished-gold blade with a centre ridge + a short counterweight, pointing RIGHT from the pivot (baked) */
const NEEDLE_L = 150, NEEDLE_T = 30;
const needle = (k, dpr) => sprite(`ph-needle:${k.toFixed(3)}@${dpr}`, (NEEDLE_L + NEEDLE_T + 8) * k * dpr, 26 * k * dpr, (c, W, H) => {
  const u = k * dpr, cy = H / 2, px = (NEEDLE_T + 4) * u;
  c.beginPath(); c.moveTo(px - NEEDLE_T * u, cy - 5 * u); c.lineTo(px, cy - 7 * u); c.lineTo(px + NEEDLE_L * u, cy); c.lineTo(px, cy + 7 * u); c.lineTo(px - NEEDLE_T * u, cy + 5 * u); c.closePath();
  c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 4 * u; c.shadowOffsetY = 2 * u;
  c.fillStyle = goldLin(c, 0, cy - 7 * u, 0, cy + 7 * u, [[0, '#fff3cc'], [0.42, '#f0c76c'], [0.5, '#fffaf0'], [0.58, '#c8923a'], [1, '#6a4512']]); c.fill();
  c.shadowColor = 'transparent';
  c.beginPath(); c.moveTo(px, cy); c.lineTo(px + NEEDLE_L * u, cy); c.strokeStyle = 'rgba(255,255,245,0.85)'; c.lineWidth = 0.9 * u; c.stroke();
});
/** the boss over the pivot: a gold dome with its highlight (baked) */
const boss = (k, dpr) => sprite(`ph-boss:${k.toFixed(3)}@${dpr}`, 44 * k * dpr, 44 * k * dpr, (c, W) => {
  const r = W / 2, g = c.createRadialGradient(r * 0.7, r * 0.6, r * 0.05, r, r, r * 0.95);
  g.addColorStop(0, '#fffbe6'); g.addColorStop(0.3, '#f2c66a'); g.addColorStop(0.75, '#8c5e1c'); g.addColorStop(1, '#3a2406');
  c.beginPath(); c.arc(r, r, r * 0.92, 0, Math.PI * 2); c.fillStyle = g; c.fill();
});

const easeOut = p => 1 - Math.pow(1 - p, 3);
/** the needle's angle at loop time p (s): rest on 1 → the climb (an ease-out + a small overshoot + settle) → hold → the fall back */
function needleAt(p) {
  if (p < 0.3) return ANG[0];
  if (p < 2.1) { const u = (p - 0.3) / 1.8, e = easeOut(u), over = Math.sin(clamp01((u - 0.72) / 0.28) * Math.PI) * 2.6 * DEG; return lerp(ANG[0], ANG[PH], e) - over; }
  if (p < 7.2) return ANG[PH];
  return lerp(ANG[PH], ANG[0], smooth(7.2, 7.95, p));
}

function draw(c, s, t, Q) {
  const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, dpr = bakeDpr(Q), still = Q.still;
  const M = phMap(w, h, full), k = M.k;
  const X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const p = still ? STILL_T : fract(t / LOOP) * LOOP;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(scene(w, h, full, dpr), 0, 0, w, h);
  const ang = needleAt(p);
  // the floors the needle passes light up (a quick warm flare that dims again); PH stays lit once landed
  const landed = p >= 2.0 && p < 7.6 ? smooth(2.0, 2.45, p) * (1 - smooth(7.2, 7.6, p)) : 0;
  const breath = still ? 0.6 : 0.5 + 0.5 * Math.sin(t * 1.6);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < FLOORS.length; i++) {
    let a;
    if (i === PH) a = landed;
    else { const passed = ang <= ANG[i] + 0.5 * DEG; const since = passed ? (ANG[i] - ang) / STEP : -1; a = passed && p < 2.6 ? clamp01(1 - since * 0.55) * (1 - smooth(2.1, 2.7, p)) : 0; }
    if (a <= 0.01) continue;
    // the lit wedge (warm gold, 'lighter' over the dim one)
    const half = 6.1 * DEG;
    c.beginPath(); c.moveTo(X(C.x), Y(C.y)); c.arc(X(C.x), Y(C.y), R_WEDGE * k, -(ANG[i] + half), -(ANG[i] - half)); c.closePath();
    c.globalAlpha = a * (i === PH ? 0.55 + 0.2 * breath : 0.45); c.fillStyle = i === PH ? 'rgba(255,196,96,1)' : 'rgba(255,184,90,1)'; c.fill();
    // the numeral's blaze
    const px = i === PH ? 46 : 34, [nx, ny] = pt(ANG[i], i === PH ? R_NUM + 6 : R_NUM);
    const spr = litFloor(i, px * k, dpr);
    stamp(c, glow('255,180,80', 0.2, 48), X(nx), Y(ny), px * k * (i === PH ? 4.2 : 2.6), a * (i === PH ? 0.55 + 0.25 * breath : 0.45));
    c.globalAlpha = a; c.drawImage(spr, X(nx) - (px * k * 2.6) / 2, Y(ny) - (px * k * 1.6) / 2, px * k * 2.6, px * k * 1.6);
  }
  // PH's bloom over the arch's crown when landed
  if (landed > 0.01) stamp(c, glow('255,200,110', 0.14, 64), X(pt(ANG[PH], R_OUT)[0]), Y(pt(ANG[PH], R_OUT)[1]), 300 * k, landed * (0.22 + 0.12 * breath));
  // THE NEEDLE (+ its soft warm cast while it moves) and the boss over the pivot
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  const nd = needle(k, dpr), nw = (NEEDLE_L + NEEDLE_T + 8) * k, nh = 26 * k;
  c.save(); c.translate(X(C.x), Y(C.y)); c.rotate(-ang); c.drawImage(nd, -(NEEDLE_T + 4) * k, -nh / 2, nw, nh); c.restore();
  const bs = 44 * k; c.drawImage(boss(k, dpr), X(C.x) - bs / 2, Y(C.y) - bs / 2, bs, bs);
  // THE DOORS' LIGHT: a line of warm light opening down the seam (full card + strip alike — the strip shows its top only)
  const door = still ? 1 : smooth(2.6, 3.6, p) * (1 - smooth(7.0, 7.5, p));
  if (door > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const top = C.y + 14, hh = SH - top;
    stamp(c, glow('255,196,110', 0.18, 64), X(C.x), Y(top + hh / 2), 70 * k * (0.5 + door), door * 0.5, hh * k * 1.25);
    c.globalAlpha = door * 0.95; c.fillStyle = '#fff4d8'; c.fillRect(X(C.x) - Math.max(0.6, 2.2 * door * k), Y(top), Math.max(1.2, 4.4 * door * k), hh * k);
    stamp(c, glow('255,230,170', 0.3, 48), X(C.x), Y(top + 6), 90 * k, door * 0.4, 30 * k);
  }
  // THE GLINT: a bright point running round the arch once the doors are open
  if (!still && p > 3.6 && p < 4.9) {
    const u = (p - 3.6) / 1.3, a = Math.PI - u * Math.PI, f = Math.sin(u * Math.PI), [gx, gy] = pt(a, (R_OUT + R_IN) / 2);
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,250,230', 0.4, 32), X(gx), Y(gy), 60 * k, 0.5 * f);
    stamp(c, sparkle('255,255,255', 48), X(gx), Y(gy), 46 * k, 0.9 * f);
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
export const phDial = { id: 'phDial', tier: 'epic', bleed: 0, stillT: STILL_T, draw };
