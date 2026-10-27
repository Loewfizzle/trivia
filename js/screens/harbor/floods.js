// CITY 2.0 — 9c: THE CENTREPIECE's SHOW LIGHTING (the owner, Oct 27: the uncarved giant pumpkin sat DARK on the compass, brown on brown
// — "it's being shown off, so it should be well lit … it can be dark when the jack-o'-lantern's lit"). Reusable for EVERY centrepiece
// (the giant ₿ pumpkin, the harvest display, the snowman, later the Christmas tree): at night a pair of warm 1920s FLOODLIGHTS low on the
// inlay's rim (front-left + front-right) wash the piece from its front sides — a bright warm POOL on the cobbles round it, a soft
// SHADOW thrown behind it, the light on its faces (its own colours × the flood: brightest low + at the sides) and a RIM along its top
// edges. They come on with the street lamps at dusk; when the piece LIGHTS ITSELF (the carved ₿'s fire, a tree's lights) they DIM slowly
// to a low fill (its own glow is the star, its shape still reads); by day nothing. The level: core/harbor-centre.js#floodTarget (pure).
//   const F = createFloods();  F.under(c, o) BEFORE the piece · F.over(c, o) AFTER it; o = { cam, m: { x, z, r } (the piece's footprint:
//   world centre + radius), h (its height, world), lamps (0..1), self (0..1: how lit it is by itself), t (s), fade, tier, sprite: { cv, x,
//   y, w, h } (the piece's own drawn sprite — its silhouette carries the wash), power (a blackout: 0) }
import { project } from '../../core/harbor-layout.js';
import { floodTarget, FLOOD } from '../../core/harbor-centre.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export function createFloods() {
  let k = 0, lastT = null, washes = new WeakMap(), glowCv = null;
  /** the eased level this frame (slow: ~4 s — the floods dim down as the fire catches, come up with the lamps) */
  function step(o) {
    const target = floodTarget(o.lamps || 0, o.self || 0) * (o.power == null ? 1 : o.power);
    const t = o.t || 0, dt = lastT == null ? 1e9 : Math.max(0, t - lastT); lastT = t;
    k = dt > 30 ? target : k + (target - k) * Math.min(1, dt / FLOOD.ease);   // (a load / a jump joins at once — never a fade on camera after one)
    return k;
  }
  const glow = () => {
    if (glowCv) return glowCv;
    glowCv = mk(64, 64); const x = safeCtx(glowCv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [t, a] of [[0, 1], [0.16, 0.7], [0.4, 0.22], [0.7, 0.05], [1, 0]]) g.addColorStop(t, `rgba(255,214,150,${a})`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return glowCv;
  };
  /** the wash for a sprite (cached per sprite canvas): the flood's light on the piece's own colours + its top rim, in the sprite's pixels */
  function washOf(cv) {
    let w = washes.get(cv);
    if (w && w.w === cv.width && w.h === cv.height) return w.cv;
    const W = cv.width, H = cv.height, M = mk(W, H), Q = mk(W, H), out = mk(W, H), R = mk(W, H);
    const mx = safeCtx(M), qx = safeCtx(Q), ox = safeCtx(out), rx = safeCtx(R);
    if (!mx || !qx || !ox || !rx) return null;
    // the light map: two floods from the lower front sides (warm), a little fill over the whole face, falling off toward the top
    mx.fillStyle = 'rgb(70,56,40)'; mx.fillRect(0, 0, W, H); mx.globalCompositeOperation = 'lighter';
    for (const sx of [0.1, 0.9]) { const g = mx.createRadialGradient(W * sx, H * 1.02, 0, W * sx, H * 1.02, Math.max(W, H) * 0.95); g.addColorStop(0, 'rgba(255,210,150,1)'); g.addColorStop(0.5, 'rgba(255,190,120,0.55)'); g.addColorStop(1, 'rgba(255,170,100,0)'); mx.fillStyle = g; mx.fillRect(0, 0, W, H); }
    // Q: the piece's colours × the light (its night colours are dark: laid on twice)
    qx.drawImage(cv, 0, 0); qx.globalCompositeOperation = 'multiply'; qx.drawImage(M, 0, 0); qx.globalCompositeOperation = 'destination-in'; qx.drawImage(cv, 0, 0);
    // R: the RIM — the top band of the silhouette (itself minus itself shifted down), a warm white edge catching the floods
    const d = Math.max(2, Math.round(H * 0.025));
    rx.drawImage(cv, 0, 0); rx.globalCompositeOperation = 'destination-out'; rx.drawImage(cv, 0, d); rx.globalCompositeOperation = 'source-in'; rx.fillStyle = 'rgb(255,226,180)'; rx.fillRect(0, 0, W, H);
    // the wash: a share of the plain light on the silhouette + the lit colours ×2.4 + the rim
    ox.drawImage(cv, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.globalAlpha = 0.32; ox.drawImage(M, 0, 0); ox.globalAlpha = 1;
    ox.globalCompositeOperation = 'lighter'; ox.drawImage(Q, 0, 0); ox.drawImage(Q, 0, 0); ox.globalAlpha = 0.4; ox.drawImage(Q, 0, 0); ox.globalAlpha = 0.75; ox.drawImage(R, 0, 0); ox.globalAlpha = 1;
    M.width = M.height = Q.width = Q.height = R.width = R.height = 0;
    washes.set(cv, { cv: out, w: W, h: H });
    return out;
  }
  const fixtures = (cam, m) => [-1, 1].map(sd => ({ sd, x: m.x + sd * (m.r + FLOOD.out), y: FLOOD.y, z: m.z - m.r * FLOOD.fwd }));
  return {
    /** before the piece: the soft shadow thrown behind it + the warm pool on the cobbles round it */
    under(c, o) {
      const kk = step(o) * (o.fade == null ? 1 : o.fade);
      if (kk < 0.01 || !o.cam || !o.m) return;
      const { cam, m } = o, [sx, sy] = project(cam, m.x, 0, m.z + m.r * 0.9), s = cam.F / (m.z + m.r * 0.9);
      c.save();
      c.fillStyle = `rgba(8,6,18,${(0.34 * kk).toFixed(3)})`; c.beginPath(); c.ellipse(sx, sy, m.r * 1.35 * s, m.r * 0.32 * s, 0, 0, TAU); c.fill();
      const [px, py] = project(cam, m.x, 0, m.z - m.r * 0.35), ps = cam.F / (m.z - m.r * 0.35), R = m.r * FLOOD.pool * ps;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.6 * kk);
      c.translate(px, py); c.scale(1, 0.34); c.drawImage(glow(), -R, -R, R * 2, R * 2);
      c.restore();
    },
    /** after the piece: the light on it (its sprite's silhouette), the two fixtures with their lit lenses, a faint beam each */
    over(c, o) {
      const kk = k * (o.fade == null ? 1 : o.fade) * (o.power == null ? 1 : o.power);
      if (kk < 0.01 || !o.cam || !o.m) return;
      const { cam, m } = o;
      // the fixtures' iron drums (under the light: black cans on short yokes, their open fronts toward the piece)
      c.save();
      for (const f of fixtures(cam, m)) {
        const [fx, fy] = project(cam, f.x, f.y, f.z), [gx, gy] = project(cam, f.x, 0, f.z), s = cam.F / f.z, r = 0.2 * s;
        c.fillStyle = 'rgb(24,22,26)'; c.fillRect(gx - Math.max(0.5, 0.04 * s), fy, Math.max(1, 0.08 * s), gy - fy);
        c.beginPath(); c.ellipse(fx - f.sd * r * 0.55, fy, r * 0.9, r, 0, 0, TAU); c.fill();
      }
      c.restore();
      c.save(); c.globalCompositeOperation = 'lighter';
      const sp = o.sprite;
      if (sp && sp.cv && sp.cv.width > 2) { const wcv = washOf(sp.cv); if (wcv) { c.globalAlpha = Math.min(1, (o.wash == null ? 0.72 : o.wash) * kk); c.drawImage(wcv, sp.x, sp.y, sp.w, sp.h); } }
      for (const f of fixtures(cam, m)) {
        const [fx, fy] = project(cam, f.x, f.y, f.z), s = cam.F / f.z;
        const [tx, ty] = project(cam, m.x, (o.h || 2) * 0.45, m.z);
        // the beam: a faint warm wedge from the lens toward the piece's middle (o.tier 0: none)
        if (o.tier !== 0) { const w = 0.55 * s, dx = tx - fx, dy = ty - fy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, sp2 = (o.h || 2) * 0.4 * cam.F / m.z;
          const g = c.createLinearGradient(fx, fy, tx, ty); g.addColorStop(0, `rgba(255,214,150,${(0.16 * kk).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,150,0)');
          c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.moveTo(fx + nx * w * 0.3, fy + ny * w * 0.3); c.lineTo(tx + nx * sp2, ty + ny * sp2); c.lineTo(tx - nx * sp2, ty - ny * sp2); c.lineTo(fx - nx * w * 0.3, fy - ny * w * 0.3); c.closePath(); c.fill(); }
        // the lens: a warm halo + a white-hot core
        const hr = 0.7 * s; c.globalAlpha = Math.min(1, 0.85 * kk); c.drawImage(glow(), fx - hr, fy - hr, hr * 2, hr * 2);
        const cr = 0.16 * s; c.globalAlpha = Math.min(1, kk); c.fillStyle = 'rgb(255,248,232)'; c.beginPath(); c.arc(fx, fy, Math.max(0.6, cr), 0, TAU); c.fill();
      }
      c.restore();
    },
    level: () => k,
    debug: () => ({ k: +k.toFixed(3) }),
  };
}
