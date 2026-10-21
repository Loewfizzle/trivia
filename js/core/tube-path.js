// TUBES as polylines (PURE: no DOM) — an SVG path (absolute M L H V Q C A Z: the NEON logo's, the games' marks, the tube
// alphabet) cut into polylines, and the light along a tube (hotter on the bends, dimmer at the electrodes). Shared by the
// Harbor's neon (screens/harbor/tubes.js), the logo's premium layers (ui/logo.js) and the games' tube logos (ui/tube-logo.js).
function tokens(d) {
  const out = [], re = /([MLHVQCAZ])([^MLHVQCAZ]*)/gi;
  let m;
  while ((m = re.exec(d))) out.push([m[1].toUpperCase(), (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number)]);
  return out;
}
// an SVG arc (endpoint form) → points
function arcPts(x1, y1, rx, ry, rot, large, sweep, x2, y2, n) {
  const phi = rot * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, xp = cp * dx + sp * dy, yp = -sp * dx + cp * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, den = rx * rx * yp * yp + ry * ry * xp * xp;
  let k = Math.sqrt(Math.max(0, num / (den || 1))); if (large === sweep) k = -k;
  const cxp = k * rx * yp / ry, cyp = -k * ry * xp / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
  const pts = [];
  for (let i = 1; i <= n; i++) { const t = t1 + dt * i / n, ex = rx * Math.cos(t), ey = ry * Math.sin(t); pts.push([cp * ex - sp * ey + cx, sp * ex + cp * ey + cy]); }
  return pts;
}
/**
 * An SVG path (absolute commands) → polylines [{ pts: [[x, y], …], closed }], scaled by s and offset by (ox, oy).
 * Curves are cut into steps of about `step` units (after scaling).
 */
export function flattenPath(d, s = 1, ox = 0, oy = 0, step = 2) {
  const out = [];
  let cur = null, start = null, poly = null;
  const P = (x, y) => [x * s + ox, y * s + oy];
  const seg = (a, b) => Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * s / step));
  for (const [cmd, n] of tokens(d)) {
    if (cmd === 'M') { for (let i = 0; i < n.length; i += 2) { if (i === 0) { start = cur = [n[0], n[1]]; poly = { pts: [P(n[0], n[1])], closed: false }; out.push(poly); } else { cur = [n[i], n[i + 1]]; poly.pts.push(P(cur[0], cur[1])); } } }
    else if (cmd === 'L') for (let i = 0; i < n.length; i += 2) { cur = [n[i], n[i + 1]]; poly.pts.push(P(cur[0], cur[1])); }
    else if (cmd === 'H') for (const v of n) { cur = [v, cur[1]]; poly.pts.push(P(cur[0], cur[1])); }
    else if (cmd === 'V') for (const v of n) { cur = [cur[0], v]; poly.pts.push(P(cur[0], cur[1])); }
    else if (cmd === 'Q') for (let i = 0; i < n.length; i += 4) {
      const c = [n[i], n[i + 1]], e = [n[i + 2], n[i + 3]], k = seg(cur, e);
      for (let j = 1; j <= k; j++) { const t = j / k, u = 1 - t; poly.pts.push(P(u * u * cur[0] + 2 * u * t * c[0] + t * t * e[0], u * u * cur[1] + 2 * u * t * c[1] + t * t * e[1])); }
      cur = e;
    } else if (cmd === 'C') for (let i = 0; i < n.length; i += 6) {
      const c1 = [n[i], n[i + 1]], c2 = [n[i + 2], n[i + 3]], e = [n[i + 4], n[i + 5]], k = seg(cur, e) + 2;
      for (let j = 1; j <= k; j++) { const t = j / k, u = 1 - t; poly.pts.push(P(u * u * u * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0], u * u * u * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1])); }
      cur = e;
    } else if (cmd === 'A') for (let i = 0; i < n.length; i += 7) {
      const e = [n[i + 5], n[i + 6]], k = Math.max(6, Math.ceil(Math.max(n[i], n[i + 1]) * s * Math.PI / step));
      for (const p of arcPts(cur[0], cur[1], n[i], n[i + 1], n[i + 2], n[i + 3], n[i + 4], e[0], e[1], k)) poly.pts.push(P(p[0], p[1]));
      cur = e;
    } else if (cmd === 'Z') { if (poly) { poly.closed = true; poly.pts.push(P(start[0], start[1])); } cur = start; }
  }
  return out.filter(p => p.pts.length > 1);
}

/** a polyline's light along its length: hotter on the bends, dimmer near open ends (the electrodes). → per-point 0.5..1.25 */
export function tubeLight(pts, closed = false, w = 1) {
  const n = pts.length, out = new Array(n).fill(0.86);
  let len = 0;
  const cum = [0];
  for (let i = 1; i < n; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(len); }
  for (let i = 1; i < n - 1; i++) {
    const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]), b = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
    let d = Math.abs(b - a); if (d > Math.PI) d = 2 * Math.PI - d;
    out[i] += Math.min(0.36, d * 0.55);
  }
  // a bend's heat spreads a little along the glass
  const sm = out.slice();
  for (let i = 1; i < n - 1; i++) sm[i] = (out[i - 1] + 2 * out[i] + out[i + 1]) / 4;
  if (!closed) for (let i = 0; i < n; i++) { const e = Math.min(cum[i], len - cum[i]); if (e < 4 * w) sm[i] *= 0.5 + 0.5 * (e / (4 * w)); }
  return sm;
}

