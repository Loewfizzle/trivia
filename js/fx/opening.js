// `card-founder` (THE VAULT 2A; the owner's pick, Nov 3 11:50 am: the big NEON SPEAKEASY sign lighting letter by letter over the city,
// the speakeasy's 1924 date stone, the founder's REAL member number stamped in gold — a numbered first edition). The night over the harbor's skyline; on the roof of the speakeasy (its parapet + the EST. 1924 DATE STONE,
// lit from below), the big sign on its steel frame: the title's own NEON tubes (ui/logo.js — the same letters, the same pink) over
// SPEAKEASY in the city's tube alphabet, in cream. THE SWITCH-ON: dark, then letter by letter each tube stutters on (N · E · O · N, then
// S-P-E-A-K-E-A-S-Y faster), and once the whole sign burns two searchlights rise behind it, sweeping — opening night; the city's windows
// warm. A 12-second loop; the still frame: the sign fully lit. The member number + MEMBER SINCE are the card's DOM (crisp at 3×: the
// gold stamp — js/vault/full.js + strip.js), never painted. + THE BORDER LASER (gold).
import { glow, stamp, sprite, smooth, wob, rng, sparkle, fract } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { backdrop, bakeDpr } from './sg-kit.js';
import { beam } from './bulbs.js';
import { signLayout, drawTube, ignite, hum, PINK, CREAM } from './sign-kit.js';
import { front as realFront } from './speak-front.js';

const LOOP = 12;
const SKY = { sky: [[0, '#05040c'], [0.5, '#0d0a1e'], [0.8, '#1a1026'], [1, '#120a18']], stars: 30, starRgb: '236,232,255', starTo: 0.55, seed: 1924,
  glow: [{ x: 0.5, y: 0.75, r: 0.9, rgb: '255,90,170', a: 0.14, sy: 0.5 }, { x: 0.18, y: 0.1, r: 0.5, rgb: '120,110,220', a: 0.12 }],
  skyline: { y: 0.8, tall: 0.16, dark: ['#100c1c', '#0a0712'], win: [['255,214,140', 0.6], ['255,120,200', 0.25], ['236,240,255', 0.15]], p: 0.18, rim: 'rgba(255,120,200,0.14)' } };
// the sign in its own units: NEON 100 tall (the logo's letters, 332 wide) over SPEAKEASY; the frame's feet at y 205
const SIGN_FULL = signLayout([{ logo: true, y: 0, h: 100, cx: 166, col: PINK }, { word: 'SPEAKEASY', y: 122, h: 30, cx: 166, col: CREAM, track: 0.5 }]);
const SIGN_STRIP = SIGN_FULL;
const SW = 332, SH = 152, FOOT = 206;
// the switch-on: NEON slowly, then SPEAKEASY quicker — each letter's start (s into the loop)
const START = SIGN_FULL.map((L, i) => (i < 4 ? 0.9 + i * 0.45 : 2.9 + (i - 4) * 0.2));
const ALL_LIT = START[START.length - 1] + 0.45;

/** the roof under the sign (baked): the steel frame (posts + bracing + the raceways behind each line), the speakeasy's parapet with its
 *  coping + the DATE STONE (EST. 1924, carved — re-baked once the font is in), the dark wall below with a few warm windows */
function roof(k, w, h, ox, oy, dpr, full, frameOnly = false) {
  const font = typeof document !== 'undefined' && document.fonts && document.fonts.check('700 12px "Chakra Petch"') ? 'f' : 'n';
  return sprite(`fm-roof:${w}x${h}:${k.toFixed(3)}:${full ? 1 : 0}:${frameOnly ? 1 : 0}:${font}@${dpr}`, w * dpr, h * dpr, (c) => {
    c.scale(dpr, dpr);
    const X = u => ox + u * k, Y = v => oy + v * k, roofY = Y(FOOT);
    // THE FRAME: two raceways (the letters' mounting bars), posts + X-bracing down to the roof
    c.strokeStyle = '#3a2836'; c.lineCap = 'butt';
    c.fillStyle = '#2a1e2a'; c.fillRect(X(-6), Y(46), (SW + 12) * k, 7 * k); c.fillRect(X(14), Y(132), (SW - 28) * k, 5 * k);
    c.lineWidth = Math.max(1, 3.2 * k);
    for (const u of [40, 126, 206, 292]) { c.beginPath(); c.moveTo(X(u), Y(30)); c.lineTo(X(u), roofY); c.stroke(); }
    c.lineWidth = Math.max(0.7, 1.6 * k);
    for (const [a, b] of [[40, 126], [126, 206], [206, 292]]) for (const [v0, v1] of [[152, FOOT], [FOOT, 152]]) { c.beginPath(); c.moveTo(X(a), Y(v0)); c.lineTo(X(b), Y(v1)); c.stroke(); }
    c.beginPath(); c.moveTo(X(30), Y(152)); c.lineTo(X(302), Y(152)); c.stroke();
    c.strokeStyle = 'rgba(255,120,200,0.35)'; c.lineWidth = Math.max(0.5, 0.8 * k);           // (the sign's pink on the steel's top edges)
    for (const u of [40, 126, 206, 292]) { c.beginPath(); c.moveTo(X(u) - 1.2 * k, Y(54)); c.lineTo(X(u) - 1.2 * k, roofY); c.stroke(); }
    if (frameOnly) return;
    // THE BUILDING: the parapet (a stepped Deco centre), its coping, the wall
    const bx0 = X(-34), bx1 = X(SW + 34), cx = X(SW / 2);          // (the speakeasy's own block — the city carries on each side)
    const bg = c.createLinearGradient(0, roofY, 0, h); bg.addColorStop(0, '#3a1a26'); bg.addColorStop(0.5, '#24101a'); bg.addColorStop(1, '#170a12');
    c.fillStyle = bg; c.fillRect(bx0, roofY, bx1 - bx0, h - roofY);
    c.fillStyle = '#3a1a26';
    c.beginPath(); c.moveTo(cx - 70 * k, roofY); c.lineTo(cx - 70 * k, roofY - 10 * k); c.lineTo(cx - 44 * k, roofY - 10 * k); c.lineTo(cx - 44 * k, roofY - 18 * k);
    c.lineTo(cx + 44 * k, roofY - 18 * k); c.lineTo(cx + 44 * k, roofY - 10 * k); c.lineTo(cx + 70 * k, roofY - 10 * k); c.lineTo(cx + 70 * k, roofY); c.closePath(); c.fill();
    // the coping: a pale limestone line catching the sign's pink from above
    c.fillStyle = 'rgba(240,214,226,0.75)'; c.fillRect(bx0, roofY - 0.6, bx1 - bx0, Math.max(1.2, 2.2 * k));
    c.fillStyle = 'rgba(232,200,214,0.4)'; c.fillRect(cx - 44 * k, roofY - 18 * k, 88 * k, Math.max(0.8, 1.2 * k));
    // brick courses, faint
    c.fillStyle = 'rgba(255,190,200,0.05)';
    for (let v = roofY + 6 * k; v < h; v += 7 * k) c.fillRect(bx0, v, bx1 - bx0, Math.max(0.5, 0.6 * k));
    // a few warm windows in the wall below (full card: a row under the parapet — the plate sits over the rest)
    const r = rng(31);
    if (full) for (let i = 0; i < 6; i++) {
      const wx = bx0 + (i + 0.5) / 6 * (bx1 - bx0), wy = roofY + 52 * k; if (i === 2 || i === 3) continue;              // (the date stone's bay stays dark)
      const wg = c.createLinearGradient(0, wy, 0, wy + 26 * k); wg.addColorStop(0, 'rgba(255,214,150,0.9)'); wg.addColorStop(1, 'rgba(214,130,70,0.85)');
      c.fillStyle = '#12080c'; c.fillRect(wx - 9 * k, wy - 2 * k, 18 * k, 30 * k); c.fillStyle = wg; c.fillRect(wx - 7.5 * k, wy, 15 * k, 26 * k);
      c.fillStyle = 'rgba(40,16,12,0.85)'; c.fillRect(wx - 0.6 * k, wy, 1.2 * k, 26 * k); c.fillRect(wx - 7.5 * k, wy + 9 * k, 15 * k, 1.1 * k);
      c.fillStyle = 'rgba(240,214,226,0.55)'; c.fillRect(wx - 9 * k, wy + 28 * k, 18 * k, Math.max(0.8, 1.4 * k));
      void r;
    }
    // the block's edges: a limestone quoin line each side
    c.fillStyle = 'rgba(240,214,226,0.28)'; c.fillRect(bx0, roofY, Math.max(1, 1.4 * k), h - roofY); c.fillRect(bx1 - Math.max(1, 1.4 * k), roofY, Math.max(1, 1.4 * k), h - roofY);
    // THE DATE STONE: a limestone tablet in the parapet's step, EST. / 1924 carved (a shadow + a lit lower edge)
    if (full) {
      const sw = 136 * k, sh = 58 * k, sx = cx - sw / 2, sy = roofY - 16 * k;
      const g = c.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, '#efe2cf'); g.addColorStop(1, '#bfae92');
      c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
      c.strokeStyle = 'rgba(60,40,30,0.7)'; c.lineWidth = Math.max(0.6, 0.9 * k); c.strokeRect(sx + 2 * k, sy + 2 * k, sw - 4 * k, sh - 4 * k);
      c.fillStyle = 'rgba(255,140,200,0.18)'; c.fillRect(sx, sy, sw, sh * 0.35);           // (the sign's light on its top)
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const ff = `"Chakra Petch", Orbitron, sans-serif`;
      for (const [txt, px, yy] of [['EST.', 15, 0.3], ['1924', 25, 0.68]]) {
        c.font = `700 ${px * k}px ${ff}`;
        c.fillStyle = 'rgba(255,250,240,0.55)'; c.fillText(txt, cx, sy + sh * yy + 0.7 * k);          // (the carve's lit lower lip)
        c.fillStyle = '#3a271c'; c.fillText(txt, cx, sy + sh * yy);
      }
    }
  });
}

// ---------------------------------------------------------------- THE FULL CARD (THE VAULT 2B — the owner's lab FIX: "Needs to be much
// higher quality. Close building looks cheap."). the sign's first night, re-composed: the sign stands on the city's OWN speakeasy — its real
// front painted face-on by the city's painters (speak-front.js: the stepped crest, the EST. 1924 date stone in the parapet, the dentil
// cornice, the wall-washers' warm cones, the real lit rooms); the steel frame's feet behind the crest. The FLAIR: each letter catches
// with a POWER SURGE — a burst of white-hot sparks off the tube as it stutters on, falling under gravity —; once it all burns the two
// searchlights rise from behind the roof, sweeping, the sign's pink washes the crest + the cornice, and GOLD CONFETTI drifts down
// across the whole card. The still frame: everything lit, the beams crossed, the confetti held.
/** each letter's centre in sign units (its sparks fly from there) */
const CENTRE = SIGN_FULL.map(L => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of L.polys) for (const [x, y] of p.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2]; });
/** the sparks of letter i's ignition at e s after it started (white-hot, cooling to gold, falling) */
function sparks(c, i, e, k, ox, oy, q) {
  if (e < 0 || e > 0.9) return;
  const [cx, cy, rx, ry] = CENTRE[i], r = rng(70 + i), n = Math.round((i < 4 ? 14 : 7) * q), spr = sparkle('255,236,190');
  for (let j = 0; j < n; j++) {
    const a = r() * Math.PI * 2, v = (0.6 + r() * 0.9) * (i < 4 ? 70 : 40), x0 = cx + Math.cos(a) * rx * r(), y0 = cy + Math.sin(a) * ry * r();
    const px = ox + (x0 + Math.cos(a) * v * e) * k, py = oy + (y0 + Math.sin(a) * v * e + 160 * e * e) * k;
    const life = 1 - e / 0.9, sz = (2 + r() * 2.4) * Math.max(0.6, k * 4) * life;
    stamp(c, spr, px, py, sz * 2.2, Math.min(1, life * 1.4));
  }
}
/** gold confetti drifting down (seeded, stateless by t): flakes turning (their width the turn), a glint on a few */
function confetti(c, w, h, t, a, q) {
  const r = rng(1924), n = Math.round(46 * q), F = ['#ffd27a', '#ffe9b0', '#e8a83a', '#ff8fd0', '#fff4d8'];
  for (let i = 0; i < n; i++) {
    const sp = 9 + r() * 14, x0 = r() * w, ph = r() * 100, sw = 6 + r() * 10, col = F[i % F.length], sz = 1.6 + r() * 2.2;
    const y = fract((t * sp + ph * 7) / (h + 20)) * (h + 20) - 10, x = x0 + Math.sin(t * 1.3 + ph) * sw, turn = Math.cos(t * (2 + r() * 3) + ph);
    c.globalAlpha = a * (0.55 + 0.45 * Math.abs(turn)); c.fillStyle = col;
    c.save(); c.translate(x, y); c.rotate(ph + t * 0.6); c.fillRect(-sz * Math.abs(turn), -sz * 0.45, sz * 2 * Math.abs(turn) + 0.4, sz * 0.9); c.restore();
  }
  c.globalAlpha = 1;
}
function drawFull(c, s, t, Q) {
  const { w, h } = s, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = Q.still, q = Q.q || 1;
  const tt = still ? 8 : t % LOOP;
  const k = (h * 0.2) / SH, ox = w / 2 - (SW / 2) * k, oy = h * 0.205, footY = oy + FOOT * k;
  const lit = still ? 1 : smooth(ALL_LIT, ALL_LIT + 1.2, tt) * (1 - smooth(LOOP - 0.5, LOOP - 0.1, tt));
  const off = tt > LOOP - 0.5 ? 1 - smooth(LOOP - 0.5, LOOP - 0.3, tt) : 1;
  const signLight = (still ? 1 : START.reduce((a, s0, i) => a + ignite(tt, s0, i), 0) / START.length) * off;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.drawImage(backdrop('fm-full2', w, h, dpr, { ...SKY, skyline: { ...SKY.skyline, y: 0.86, tall: 0.24 } }), 0, 0, w, h);
  const F = realFront(w * 0.66 / 11.2, dpr, { key: 'fm' });
  const bx = F.cv ? w / 2 - F.wpx / 2 : 0, by = F.cv ? footY - (F.H - F.V.parapet) * F.k : footY;
  // THE SEARCHLIGHTS: two, rising from behind the roof once the sign burns, sweeping + crossing
  if (lit > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const L = h * 1.25;
    for (const [i, u] of [[0, 0.16], [1, 0.84]]) {
      const a = (i ? 1 : -1) * 0.3 + (still ? (i ? -0.18 : 0.18) : Math.sin(tt * 0.55 + i * 2.2) * 0.4);
      c.save(); c.translate(F.cv ? bx + F.wpx * u : w * u, footY + 2); c.rotate(a); c.globalAlpha = 0.7 * lit; c.drawImage(beam(), -L * 0.18, -L, L * 0.36, L); c.restore();
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  // the sky behind the sign warms with it
  c.globalCompositeOperation = 'lighter';
  stamp(c, glow('255,70,170', 0.08, 64), ox + SW * k / 2, oy + 50 * k, SW * k * 2, 0.34 * signLight, SH * k * 1.5);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // the steel frame, then the building in front of its feet
  c.drawImage(roof(k, w, h, ox, oy, dpr, true, true), 0, 0, w, h);
  if (F.cv) {
    c.drawImage(F.cv, bx, by, F.wpx, F.hpx);
    // the sign's pink landing on the crest + the cornice (from above), the date stone catching it
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,80,170', 0.12, 64), w / 2, footY, F.wpx * 1.05, 0.42 * signLight, F.k * 4.2);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  } else c.drawImage(roof(k, w, h, ox, oy, dpr, true), 0, 0, w, h);
  // THE SIGN: every tube's glass, then its light as it catches — + the surge's sparks
  SIGN_FULL.forEach((L, i) => { const a = still ? hum(0, i) : ignite(tt, START[i], i) * hum(tt, i) * off; drawTube(c, L, k, dpr, ox, oy, a); });
  if (!still) { c.globalCompositeOperation = 'lighter'; SIGN_FULL.forEach((L, i) => sparks(c, i, tt - START[i], k, ox, oy, q)); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  // the first night: gold confetti once it all burns
  if (lit > 0.01) confetti(c, w, h, still ? 3.3 : tt, 0.9 * lit, q);
  c.restore();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  drawLaser(c, w, h, t, { rgb: '255,206,120', still, radius: rad });
}

export default {
  id: 'opening', tier: 'legendary', bleed: 10, stillT: 8,
  draw(c, s, t, Q) {
    if (s.opts.full) { drawFull(c, s, t, Q); return; }
    const { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = Q.still;
    const tt = still ? 8 : t % LOOP;
    // the sign's place: a full card — centred high (the plate + the stamp sit below it); a strip — right of the plate
    const k = full ? (h * 0.27) / SH : Math.min((h * 0.72) / SH, (w * 0.245) / SW), ox = full ? w / 2 - (SW / 2) * k : w * 0.595 - (SW / 2) * k, oy = full ? h * 0.2 : h * 0.07;
    const lit = smooth(ALL_LIT, ALL_LIT + 1.2, tt) * (1 - smooth(LOOP - 0.5, LOOP - 0.1, tt));
    const off = tt > LOOP - 0.5 ? 1 - smooth(LOOP - 0.5, LOOP - 0.3, tt) : 1;     // (the power cut before the loop: every tube out at once)
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'fm-full' : 'fm', w, h, dpr, full ? SKY : { ...SKY, skyline: { ...SKY.skyline, y: 1, tall: 0.3 } }), 0, 0, w, h);
    // THE SEARCHLIGHTS (opening night): rising behind the sign once it's all lit, sweeping + crossing
    if (lit > 0.01) {
      c.globalCompositeOperation = 'lighter';
      const L = full ? h * 1.15 : h * 1.7;
      for (const [i, bx] of [[0, ox + SW * k * 0.18], [1, ox + SW * k * 0.82]]) {
        const a = (i ? 1 : -1) * 0.32 + (still ? 0 : Math.sin(tt * 0.55 + i * 2.2) * 0.42);
        c.save(); c.translate(bx, oy + FOOT * k); c.rotate(a); c.globalAlpha = 0.75 * lit; c.drawImage(beam(), -L * 0.2, -L, L * 0.4, L); c.restore();
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
    // the city warms with the sign (the pink light on the roofs + the sky behind)
    c.globalCompositeOperation = 'lighter';
    const signLight = (still ? 1 : START.reduce((a, s0, i) => a + ignite(tt, s0, i), 0) / START.length) * off;
    stamp(c, glow('255,70,170', 0.08, 64), ox + SW * k / 2, oy + 50 * k, SW * k * 1.8, 0.32 * signLight, SH * k * 1.3);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;                                                       // (a stamp leaves its alpha behind)
    // (THE VAULT 2B — the owner's FIX: "the close building looks cheap" → the full card stands the sign on the city's OWN speakeasy,
    //  painted face-on by the city's painters (speak-front.js): its crest, the EST. 1924 date stone, the dentil cornice, the lit rooms)
    c.drawImage(roof(k, w, h, ox, oy, dpr, full), 0, 0, w, h);
    // THE SIGN: every tube's glass, then its light as it comes on
    SIGN_FULL.forEach((L, i) => { const a = still ? hum(0, i) : ignite(tt, START[i], i) * hum(tt, i) * off; drawTube(c, L, k, dpr, ox, oy, a); });
    // the sign's light on the roof + the date stone (a pink wash, from above)
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,90,180', 0.1, 64), ox + SW * k / 2, oy + (FOOT + 10) * k, SW * k * 1.2, 0.22 * signLight, 60 * k);
    if (!still && lit > 0.5) { const gx = ox + SW * k * (0.5 + 0.45 * wob(tt * 0.3, 2)); stamp(c, glow('255,236,200', 0.3, 32), gx, oy + FOOT * k + 2, 10 * k + 6, 0.2 * lit); }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,206,120', still, radius: rad });
  },
};
