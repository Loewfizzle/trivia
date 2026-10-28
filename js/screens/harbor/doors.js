// CITY 2.0 — THE HARBOR, FP3b item 8: REAL DOORS — the speakeasy's unmarked side door + the barbershop's glazed door, drawn LIVE over
// the baked facade while someone walks through (the owner's 8P note 13: "the door swings open, they step through, it closes — never a
// fade"). The plan (who passes when, how open the door is) is PURE: core/harbor-people.js#doorLeg / doorOpenK / folkAt().doors.
// Drawn in this order, over the bake: THE DOORWAY (its dark reveal — at night the side door's stairwell glowing amber), THE PEOPLE
// INSIDE it (clipped to the opening, dimming as they go deeper — people.js#drawInside), THE LEAF (oak, hinged on its strap-hinge side,
// swung INTO the building — so a closing door sweeps over whoever just went in), and at night THE SPILL: the side door's light out
// onto its two granite steps + the cobbles — a crisp warm pool like the sconce's, never a glow or a haze.
import { project } from '../../core/harbor-layout.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`);

/** the doors' looks + the swing: the leaf opens to SWING rad (~77°); the spill reaches SPILL units out from the threshold; 9d: the
 *  live door crossfades into the baked one over the last HAND of the swing (k), the leaf drawn in STRIPS (its perspective), turning
 *  away from the street's light by up to TURN (a multiply toward black at full swing) */
export const DOORS = Object.freeze({
  swing: 1.35, spill: 2.3, hand: 0.07, strips: 12, turn: 0.42,
  side: { oak: [[60, 38, 27], [74, 42, 30], [15, 11, 16]], dark: [20, 14, 15], amberTop: [96, 44, 20], amberLow: [255, 168, 88], glass: false },
  shop: { oak: [[86, 52, 34], [96, 56, 36], [20, 14, 18]], dark: [92, 78, 66], amberTop: [96, 80, 66], amberLow: [180, 150, 120], glass: true },
});

/**
 * One door's live layer. c: the canvas; G: speakGeo; d: { u0, u1, v0, v1 } (the opening in wall units); id 'side' | 'shop'; k: how
 * open (0..1); f: { day, night, fade, power }; inside(c, clip): draws whoever is in the doorway (already clipped) → the opening's
 * screen rect
 */
export function drawDoor(c, G, d, id, k, f, inside, leaf = null) {
  if (k <= 0.002) return null;
  const S = DOORS[id], s = G.s, cam = G.cam, day = clamp01(f.day || 0), night = clamp01(f.night || 0), P = f.power == null ? 1 : f.power;
  // (9d — THE HAND-OFF: over the last HAND of the swing the LEAF alone fades into the baked door under it — the leaf is the bake's own
  // paint, so only a resampling's softness is left to hide, never a jump. The doorway + whoever is in it are drawn only while the leaf
  // is opaque: at a few degrees the opening is a sub-point sliver, and a see-through leaf would show the guest who just went in as a
  // ghost on the door)
  const hand = k < DOORS.hand, hk = clamp01(k / DOORS.hand), fade = (f.fade == null ? 1 : f.fade) * (leaf ? hk * hk * (3 - 2 * hk) : 1);
  const at = (u, v, dz = 0) => project(cam, s.x0 + u, v, s.z0 + dz);
  const [x0, y0] = at(d.u0, d.v1), [x1, y1] = at(d.u1, d.v0), rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  c.save(); c.globalAlpha = fade;
  // ---- THE DOORWAY: the reveal (by day a dim passage; the side door at night: the stair down to the club glowing amber, brightest low)
  const lit = id === 'side' ? night * P : 0;
  if (!hand) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgb(mix(S.dark, S.amberTop, lit))); g.addColorStop(1, rgb(mix(S.dark, S.amberLow, lit * 0.95)));
  c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  // the jamb's depth: a thin shadowed reveal on the hinge side
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0, y0, Math.max(0.6, (x1 - x0) * 0.08), y1 - y0);
  // ---- THE PEOPLE INSIDE the doorway (people.js — each clipped here, dimming with depth)
  if (inside) { c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); inside(c, rect); c.restore(); }
  } else {
    // (the hand-off: the doorway only in the SLIVER the leaf leaves open — the opening minus the leaf — fading with the leaf, so the
    // last point of dark beside its free edge closes smoothly instead of flicking to the bake when the hand-off begins)
    const th = k * DOORS.swing, W = d.u1 - d.u0, cu = d.u0 + W * Math.cos(th), dz = W * Math.sin(th);
    const q = [at(d.u0, d.v0), at(d.u0, d.v1), at(cu, d.v1, dz), at(cu, d.v0, dz)];
    c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.clip('evenodd');
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(mix(S.dark, S.amberTop, lit))); g.addColorStop(1, rgb(mix(S.dark, S.amberLow, lit * 0.95)));
    c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
  }
  // ---- THE LEAF: hinged at u0, swung in by k × SWING — its OUTER face still toward us (the camera stands right of the door)
  c.globalAlpha = fade;
  { const th = k * DOORS.swing, W = d.u1 - d.u0, cu = d.u0 + W * Math.cos(th), dz = W * Math.sin(th);
    const q = [at(d.u0, d.v0), at(d.u0, d.v1), at(cu, d.v1, dz), at(cu, d.v0, dz)];
    if (leaf && leaf.cv && leaf.cv.width > 1) {
      // 9d: THE BAKED DOOR SWINGING — the leaf's sprite (the bake's own paint: planks, strap hinges, the grille, the knob, the lamp's
      // light) laid into the turning quad in thin strips (each an affine: together the perspective), then darkened as it turns away
      // from the street's light; its free edge catches the light (amber from the passage at night on the side door)
      const cv = leaf.cv, cw = cv.width, ch = cv.height, n = DOORS.strips;
      const pt = (t, v) => at(d.u0 + W * t * Math.cos(th), v, W * t * Math.sin(th));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, a = pt(t0, d.v1), b = pt(t1, d.v1), e = pt(t0, d.v0);
        const sx = t0 * cw, sw = (t1 - t0) * cw, ow = Math.min(cw - sx, sw + 0.75);
        c.save(); c.transform((b[0] - a[0]) / sw, (b[1] - a[1]) / sw, (e[0] - a[0]) / ch, (e[1] - a[1]) / ch, a[0], a[1]);
        c.drawImage(cv, sx, 0, ow, ch, 0, 0, ow, ch); c.restore();
      }
      const turn = DOORS.turn * (1 - Math.cos(th));
      c.fillStyle = `rgba(0,0,0,${turn.toFixed(3)})`; c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fill();
      const oak = S.oak, edge = [0, 1, 2].map(i => oak[0][i] * day + oak[2][i] * (1 - day));
      c.strokeStyle = rgb(mix(mix(edge, [255, 200, 140], 0.6 * lit), [255, 230, 190], 0.2 * day)); c.lineWidth = Math.max(0.5, G.K * 0.05 * Math.sin(th) + 0.3);
      c.beginPath(); c.moveTo(q[2][0], q[2][1]); c.lineTo(q[3][0], q[3][1]); c.stroke();
    } else {
    const oak = S.oak, base = [0, 1, 2].map(i => oak[0][i] * day + oak[2][i] * (1 - day));
    // (its inner face lit by the passage: amber at night on the side door; a shade darker the further it swings)
    const face = mix(mix(base, [150, 78, 38], 0.55 * lit), [0, 0, 0], 0.18 * k);
    c.fillStyle = rgb(face); c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fill();
    // the planks (or the shop door's glass), the free edge catching the light
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    if (S.glass) {
      // (the glazed upper panel: t across the leaf, v up it — bilinear in the leaf's quad)
      const at2 = (t, v) => lerp(lerp(q[0], q[3], t), lerp(q[1], q[2], t), v), pane = [at2(0.14, 0.36), at2(0.86, 0.36), at2(0.86, 0.92), at2(0.14, 0.92)];
      c.fillStyle = rgb(mix([150, 170, 190], [40, 36, 44], 1 - day * 0.8)); c.beginPath(); c.moveTo(pane[0][0], pane[0][1]); for (const p of pane.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fill();
    } else {
      c.strokeStyle = rgb(mix(face, [0, 0, 0], 0.3)); c.lineWidth = Math.max(0.4, G.K * 0.02);
      for (const t of [0.25, 0.5, 0.75]) { const a = lerp(q[0], q[3], t), b = lerp(q[1], q[2], t); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    }
    c.strokeStyle = rgb(mix(face, [255, 220, 170], 0.25 + 0.3 * lit)); c.lineWidth = Math.max(0.5, G.K * 0.03);
    c.beginPath(); c.moveTo(q[2][0], q[2][1]); c.lineTo(q[3][0], q[3][1]); c.stroke(); } }
  // ---- THE SPILL (night, the side door): its light out over the two granite steps + onto the cobbles — a crisp pool, widening as it
  // comes toward us, strongest at the threshold
  if (id === 'side' && lit > 0.02) {
    const a = 0.5 * lit * k, spread = 0.55, L = DOORS.spill * (0.4 + 0.6 * k);
    c.globalCompositeOperation = 'lighter';
    const band = (z0, z1, y, w0, w1, a0, a1) => {
      const p = [at(d.u0 - w0, y, -z0), at(d.u1 + w0 * 0.6, y, -z0), at(d.u1 + w1 * 0.6, y, -z1), at(d.u0 - w1, y, -z1)];
      const gg = c.createLinearGradient(0, p[0][1], 0, p[2][1]); gg.addColorStop(0, `rgba(255,176,96,${a0.toFixed(3)})`); gg.addColorStop(1, `rgba(255,176,96,${a1.toFixed(3)})`);
      c.fillStyle = gg; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (const r of p.slice(1)) c.lineTo(r[0], r[1]); c.closePath(); c.fill();
    };
    // (the steps' tops: z0 − 0.4 → z0 at 0.26; z0 − 0.75 → z0 − 0.4 at 0.13 — paintGround's two worn steps; then the cobbles)
    band(0, 0.4, 0.26, 0, spread * 0.2, a, a * 0.92);
    band(0.4, 0.75, 0.13, spread * 0.2, spread * 0.38, a * 0.9, a * 0.8);
    band(0.75, 0.75 + L, 0, spread * 0.38, spread, a * 0.75, 0);
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
  return rect;
}
