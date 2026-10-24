// CITY 2.0 — THE HARBOR, PF: THE CENTREPIECE + ITS EVENT LIGHTING RIG (the plan: core/harbor-centre.js, PURE + tested).
// The owner: future events are built on the brick inlay (props.js#drawInlay) — a Christmas tree, a pumpkin pyramid, a July 4th
// stage — and they must be LIT without new lamps. So the inlay carries four brass FLOOR SPOTS (flush in its soldier course: baked
// with the paving, off + nearly invisible), and this module, the hook every holiday part (11a–c) uses:
//
//   harbor().centrepiece.set({ piece, h, rig: { on, col: [r, g, b], k }, lights: [{ x, y, z, col, r, k, tw, ph }] }) / .clear()
//     piece  — fn(x, cam, m, T, ctx) or { draw(x, cam, m, T, ctx), light?(x, cam, m, T, ctx) }: its art, drawn in screen pt
//              standing on the inlay m (L.medallion); ctx = the props' ctx (season, lamps, snow…) + { cap, rig: { col, spots }, h }.
//              light(): its own LIGHT PASS — only the rig's light landing on its faces (black elsewhere); without one the rig's
//              light is laid on the piece's own pixels (its colour × the light, falling off upward from each spot).
//              The props' light model for the art: props.js#PROP_KIT; within h ≤ the cap (centrepieceCap: under the blade + the hub).
//     rig    — on (default: while a piece stands), its colour (default a warm white), its strength k (0..2). It comes up with the
//              street lamps (their ramp): by day nothing shows.
//     lights — the piece's own lights (a tree's bulbs, lanterns, string lights on poles): world x, z relative to the inlay's
//              centre, y up; drawn LIVE as a source + a tight halo (crisp — never haze), tw a twinkle in Hz.
//
// THE COST: nothing at all without a piece (one check a frame). With one: the piece + its light pass are baked into a small
// sprite (its box only) whenever it or the look changes (the scene's re-bakes); live, a frame draws that sprite, the lit sprite
// ('lighter', at the rig's level now), four spots (a cached paving-spot + halo sprite each) and the piece's lights.
// &force=centrepiece-test: THE TEST PIECE (props.js — a granite obelisk on a stepped plinth), lit by the rig at night.

import { project } from '../../core/harbor-layout.js';
import { signSpots } from '../../core/harbor-neon.js';
import { centrepieceCap } from '../../core/harbor-promenade.js';
import { rigSpots, normCentre, rigLevel, centreBox, centreActive, RIG } from '../../core/harbor-centre.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { pieceCtx } from './stage.js';
import { TEST_PIECE } from './props.js';

export function createCentre() {
  let L = null, cam = null, dpr = 2, cap = 0, spots = [], api = null, testOn = false, rev = 0;
  let spr = null, lit = null, sprKey = '', sprT = null, box = null;
  const glows = new Map();
  /** the state drawn now: the API's (a holiday part's) wins over the test piece */
  const current = () => api || (testOn ? TEST : null);
  let TEST = null;
  function layout(L0, { dpr: d = 2 } = {}) {
    L = L0; cam = L0.cam; dpr = d; sprKey = '';
    const m = L.medallion, bl = signSpots(L).find(sp => sp.id === 'n-blade'), w = L.wheel;
    const limits = [project(cam, w.x, w.y, w.z)[1]];
    if (bl && bl.rect) limits.push(bl.rect.y + bl.rect.h);
    cap = centrepieceCap(cam, m, limits);
    spots = rigSpots(m).map(sp => {
      const [x, y] = project(cam, sp.x, 0, sp.z), s = cam.F / sp.z, [, yn] = project(cam, sp.x, 0, sp.z - 1), [, yf] = project(cam, sp.x, 0, sp.z + 1);
      return { ...sp, sx: x, sy: y, s, flat: (yn - yf) / 2 / s };   // (flat: how squashed a circle on the paving is here)
    });
    TEST = normCentre({ piece: TEST_PIECE.piece, h: TEST_PIECE.h }, cap);
    if (api && api.raw) { const st = normCentre(api.raw, cap); api = st ? { ...st, raw: api.raw } : null; }   // (a new layout: the cap re-applied)
  }
  // ---- the cached glow sprites (a radial falloff per colour: the halo + the paving spot)
  function glow(col) {
    const key = col.join(',');
    if (glows.has(key)) return glows.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const x = safeCtx(c);
    if (x) { const g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, `rgba(${key},1)`); g.addColorStop(0.28, `rgba(${key},0.42)`); g.addColorStop(0.6, `rgba(${key},0.1)`); g.addColorStop(1, `rgba(${key},0)`); x.fillStyle = g; x.fillRect(0, 0, 48, 48); }
    if (glows.size > 24) { for (const v of glows.values()) v.width = v.height = 0; glows.clear(); }
    glows.set(key, c);
    return c;
  }
  // ---- the piece's sprite + its lit sprite (rebuilt when the piece, the look or the layout changes)
  function build(st, T) {
    const m = L.medallion, b = centreBox(cam, m, st.h), W = Math.max(1, Math.ceil(b.w * dpr)), H = Math.max(1, Math.ceil(b.h * dpr));
    box = b;
    const mk = old => { const c = old || document.createElement('canvas'); c.width = W; c.height = H; return c; };
    spr = mk(spr);
    const ctx = { ...pieceCtx(L), cap, h: st.h, rig: { ...st.rig, spots: rigSpots(m) } };
    const draw = typeof st.piece === 'function' ? st.piece : st.piece.draw, light = typeof st.piece === 'function' ? null : st.piece.light;
    const x = safeCtx(spr);
    if (!x) return;
    x.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
    try { draw(x, cam, m, T, ctx); } catch (e) { console.warn('[harbor] centrepiece draw', e); }
    lit = mk(lit);
    const y = safeCtx(lit);
    if (!y) return;
    if (light) {
      y.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
      try { light(y, cam, m, T, { ...ctx, pass: 'light' }); } catch (e) { console.warn('[harbor] centrepiece light', e); }
    } else {
      // the generic light: a LIGHT MAP (the rig's colour from each front spot up, gone ~⅔ of the way up the piece) laid on the
      // piece's own pixels — a share of the plain light + the light × the piece's colour (its night colours are dark: × 2.5)
      const M = document.createElement('canvas'), Q = document.createElement('canvas');
      M.width = Q.width = W; M.height = Q.height = H;
      const mx = safeCtx(M), qx = safeCtx(Q);
      if (!mx || !qx) return;
      mx.fillStyle = '#000'; mx.fillRect(0, 0, W, H); mx.globalCompositeOperation = 'lighter';
      const col = st.rig.col, hp = cam.F * st.h / m.z, ax = project(cam, m.x, 0, m.z)[0];
      for (const sp of spots.filter(q => q.front)) {
        const cx = (sp.sx * 0.55 + ax * 0.45 - b.x) * dpr, cy = (sp.sy - b.y) * dpr, R = hp * 0.66 * dpr;
        mx.save(); mx.translate(cx, cy); mx.scale(0.62, 1);
        const g = mx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.4, `rgba(${col},0.5)`); g.addColorStop(1, `rgba(${col},0)`);
        mx.fillStyle = g; mx.fillRect(-R, -R, R * 2, R * 2); mx.restore();
      }
      qx.drawImage(spr, 0, 0); qx.globalCompositeOperation = 'multiply'; qx.drawImage(M, 0, 0); qx.globalCompositeOperation = 'destination-in'; qx.drawImage(spr, 0, 0);
      y.setTransform(1, 0, 0, 1, 0, 0); y.drawImage(spr, 0, 0);
      y.globalCompositeOperation = 'source-atop'; y.fillStyle = '#000'; y.fillRect(0, 0, W, H);
      y.globalAlpha = 0.3; y.drawImage(M, 0, 0); y.globalAlpha = 1;
      y.globalCompositeOperation = 'lighter'; y.drawImage(Q, 0, 0); y.drawImage(Q, 0, 0); y.globalAlpha = 0.5; y.drawImage(Q, 0, 0);
      y.globalAlpha = 1; y.globalCompositeOperation = 'source-over';
      M.width = M.height = Q.width = Q.height = 0;
    }
  }
  /** a spot's light: the small bright spot it throws on the paving round it, the lit lens (a white-hot core), a tight halo */
  function drawSpot(c, sp, col, k) {
    const s = sp.s, g = glow(col);
    // the paving spot (the bricks round the lens lit: an ellipse on the ground, ~0.7 units)
    const pr = 0.75 * s;
    c.globalAlpha = Math.min(1, 0.55 * k); c.drawImage(g, sp.sx - pr, sp.sy - pr * sp.flat, pr * 2, pr * 2 * sp.flat);
    // the lens: its core + a tight halo (~0.4 units — crisp)
    const hr = 0.42 * s;
    c.globalAlpha = Math.min(1, 0.5 * k); c.drawImage(g, sp.sx - hr, sp.sy - hr * 0.6, hr * 2, hr * 1.2);
    const cr = RIG.lens * s;
    c.globalAlpha = Math.min(1, 0.95 * k); c.drawImage(glow([255, 250, 238]), sp.sx - cr * 1.6, sp.sy - cr * 1.6 * sp.flat, cr * 3.2, cr * 3.2 * sp.flat);
  }
  return {
    layout,
    /** set the centrepiece (see the header); returns the cleaned state's summary */
    set(o) { const st = normCentre(o, cap || Infinity); api = st ? { ...st, raw: o } : null; rev++; sprKey = ''; return st ? { h: st.h, rig: { ...st.rig }, lights: st.lights.length, cap } : null; },
    clear() { api = null; rev++; sprKey = ''; },
    /** &force=centrepiece-test (the scene, every frame) */
    test(on) { if (!!on !== testOn) { testOn = !!on; rev++; sprKey = ''; } },
    /** 8b's rule: an event stands on the inlay now (the cart stops short, the walkers go round) */
    active: () => centreActive(current()),
    /**
     * Live, every frame (after the stage layer, before the front row): o = { T (the baked look), lamps (the lamps' ramp now, 0..1),
     * fade, t (s) }. Nothing at all without a centrepiece.
     */
    draw(c, { T, lamps = 0, fade = 1, t = 0 } = {}) {
      const st = current();
      if (!st || !L || fade <= 0) return;
      const m = L.medallion, k = rigLevel(st, lamps) * fade, col = st.rig.col;
      if (st.piece) {
        const key = `${rev}|${dpr}|${cam.W}x${cam.H}`;
        if (key !== sprKey || T !== sprT) { sprT = T; sprKey = key; build(st, T); }
      }
      c.save(); c.globalCompositeOperation = 'lighter';
      if (k > 0.02) for (const sp of spots) if (!sp.front) drawSpot(c, sp, col, k);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = fade;
      if (st.piece && spr && box) {
        c.drawImage(spr, box.x, box.y, box.w, box.h);
        if (k > 0.02 && lit) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, k); c.drawImage(lit, box.x, box.y, box.w, box.h); if (k > 1) { c.globalAlpha = k - 1; c.drawImage(lit, box.x, box.y, box.w, box.h); } }
      }
      c.globalCompositeOperation = 'lighter';
      if (k > 0.02) for (const sp of spots) if (sp.front) drawSpot(c, sp, col, k);
      // the piece's own lights: a source + a tight halo each (twinkling if asked), after dark at full, by day faint
      if (st.lights.length) {
        const nk = fade * (0.35 + 0.65 * Math.min(1, lamps * 1.5));
        for (const l of st.lights) {
          const wx = m.x + l.x, wz = m.z + l.z, [sx, sy] = project(cam, wx, l.y, wz), s = cam.F / wz;
          const tw = l.tw ? 0.6 + 0.4 * Math.sin((t * l.tw + l.ph) * Math.PI * 2) : 1, a = Math.min(1, nk * l.k * tw);
          if (a < 0.02) continue;
          const r = l.r * s * 2.2;
          c.globalAlpha = a * 0.7; c.drawImage(glow(l.col), sx - r, sy - r, r * 2, r * 2);
          const cr = Math.max(0.6, l.r * s * 0.45);
          c.globalAlpha = a; c.drawImage(glow([255, 252, 240]), sx - cr, sy - cr, cr * 2, cr * 2);
        }
      }
      c.restore();
    },
    debug: () => {
      const st = current();
      return { on: !!st, test: !api && testOn, piece: !!(st && st.piece), h: st ? st.h : 0, cap, rig: st ? { ...st.rig } : null, lights: st ? st.lights.length : 0, active: centreActive(st),
        spots: spots.map(sp => ({ x: +sp.sx.toFixed(1), y: +sp.sy.toFixed(1), front: sp.front })), box: box ? { ...box } : null, rev };
    },
    destroy() { for (const v of glows.values()) v.width = v.height = 0; glows.clear(); if (spr) spr.width = spr.height = 0; if (lit) lit.width = lit.height = 0; spr = lit = null; },
  };
}
