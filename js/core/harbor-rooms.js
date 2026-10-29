// CITY 2.0 — THE HARBOR, WIN: 2.5D ROOMS (PURE — tests/harbor-rooms.test.mjs; drawn by screens/harbor/windows.js). The owner (Oct 26,
// "rooms felt a little flat, let's try 2.5D"): each room behind a speakeasy window is a BOX IN PERSPECTIVE seen from the street's real
// angle — the back wall is the glass's rect shrunk toward the scene's VANISHING POINT (the camera's: right of the speakeasy, above its
// upper floors — so the upper rooms show their FLOOR and their LEFT wall, never the ceiling: the camera's eye is over the roof), the
// faces between the glass and the back wall are the floor / ceiling / side walls. A plane at depth t (0 = the glass, 1 = the back wall)
// is the glass's picture scaled about the vanishing point by scale(t): a figure painted "at the glass" lands at depth t through ONE
// uniform scale about the VP — nearer = bigger, walking toward the window grows it, its feet on the floor at that depth. The lamp's light
// FALLS OFF (lampPool: a pool on the floor under it, the back wall brightest round it, the corners dark). NOT real 3D (the camera never
// moves): every room stays Canvas 2D, baked once in the lit canvas; only the people move.
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const SLIVER = 0.04;   // (a face under ~half a point is hidden, not a face)

/** the back wall's scale (depth 1) — a deliberate exaggeration: a real 3-unit-deep room at z ≈ 43 shrinks 6 %, unreadable on a 30-pt pane */
export const ROOM_DEPTH = 0.78;
/** how far each room's own vanishing point is pulled from its glass's centre toward the scene's (0 = a frontal box, 1 = the true
 *  oblique view through a 30-pt pane: mostly side wall + floor, the back wall past the right jamb — unreadable): the back wall shifts a
 *  little up + right, a floor + a left-wall sliver show, the right wall + the ceiling stay hidden */
const ROOM_PULL = 0.12;

/**
 * roomBox(G, vp, kBack, pull) → { back { g0, g1, h0, h1 }, faces { floor, ceiling, left, right } (each a quad [[u, v] × 4] or null), vp (the
 * room's own, pulled), k, scale(t), at(u, v, t) } — G: the glass { g0, g1, h0, h1 } in wall units (v up), vp: { u, v } the scene's vanishing
 * point in the same units (wallVP)
 */
export function roomBox(G, vp0, kBack = ROOM_DEPTH, pull = ROOM_PULL) {
  const cu = (G.g0 + G.g1) / 2, cv = (G.h0 + G.h1) / 2, vp = { u: cu + (vp0.u - cu) * pull, v: cv + (vp0.v - cv) * pull };
  // (the eye stays on the scene's side of the pane: right of its jamb when the scene's VP is right of it, above its head when the VP is
  // above — so the right wall + the ceiling never show, whatever the pull)
  if (vp0.u > G.g1) vp.u = Math.max(vp.u, G.g1 + 0.06); else if (vp0.u < G.g0) vp.u = Math.min(vp.u, G.g0 - 0.06);
  if (vp0.v > G.h1) vp.v = Math.max(vp.v, G.h1 + 0.06); else if (vp0.v < G.h0) vp.v = Math.min(vp.v, G.h0 - 0.06);
  const k = kBack, sx = u => vp.u + (u - vp.u) * k, sy = v => vp.v + (v - vp.v) * k;
  const back = { g0: sx(G.g0), g1: sx(G.g1), h0: sy(G.h0), h1: sy(G.h1) };
  const faces = {
    floor: back.h0 > G.h0 + SLIVER ? [[G.g0, G.h0], [G.g1, G.h0], [back.g1, back.h0], [back.g0, back.h0]] : null,
    ceiling: back.h1 < G.h1 - SLIVER ? [[G.g0, G.h1], [back.g0, back.h1], [back.g1, back.h1], [G.g1, G.h1]] : null,
    left: back.g0 > G.g0 + SLIVER ? [[G.g0, G.h0], [back.g0, back.h0], [back.g0, back.h1], [G.g0, G.h1]] : null,
    right: back.g1 < G.g1 - SLIVER ? [[G.g1, G.h0], [G.g1, G.h1], [back.g1, back.h1], [back.g1, back.h0]] : null,
  };
  const scale = t => 1 + (k - 1) * clamp01(t);
  return { back, faces, vp: { u: vp.u, v: vp.v }, k, scale, at: (u, v, t) => { const s = scale(t); return [vp.u + (u - vp.u) * s, vp.v + (v - vp.v) * s]; } };
}

/** the vanishing point in a wall's own units from the front map (screen = (ox + K·u, oy − K·v)) and the camera's (VPX, VPY) */
export const wallVP = (ox, oy, K, VPX, VPY) => ({ u: (VPX - ox) / K, v: (oy - VPY) / K });

/**
 * THE LAMP'S LIGHT in a box (for the painters — the numbers, not the paint): lamp { u, v, t } (its place at its depth, in the glass's
 * units), → { floor: [u, v, r] (the pool's centre on the floor at the lamp's depth + its radius in the glass's units), wall: [u, v, r]
 * (its brightest point on the back wall), corner: 0..1 (how dark the box's far corners go) }
 */
export function lampPool(B, G, lamp, o = {}) {
  const t = clamp01(lamp.t == null ? 0.8 : lamp.t), s = B.scale(t), [fu, fv] = B.at(lamp.u, G.h0, t), [wu, wv] = B.at(lamp.u, lamp.v, 1);
  const reach = (o.reach == null ? 1.1 : o.reach);
  return { floor: [fu, fv, reach * s * (G.g1 - G.g0) * 0.55], wall: [wu, wv, reach * B.k * (G.g1 - G.g0) * 0.6], corner: o.corner == null ? 0.55 : o.corner };
}
