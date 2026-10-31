// CITY 2.0 — ATM-B: FREEZING RAIN READS AS ICE AT A GLANCE (the owner, Oct 26 after 9a: "freezing rain just looked like rain"; plan.md
// ~L2030–2039; decisions.md §10). ICE ON EVERYTHING ABOVE: ICICLES along the awning's front edge, the cornice, the belt course, the window
// heads + the shop window's, the SIGNS' FRAMES (the vertical blade's bottom + a glaze down its sides, the roof signs' bottoms — each
// catching its own light), the RAILING; a GLAZE (a bright wet-ice line) on every one of those edges + the benches' seats; an ICE SHEEN on
// the promenade (a cold sheen + slow glints). Big, clear shapes at phone size — an icicle is a few pt long, never hair-fine: a pale
// body, one bright highlight down it, a twinkling tip. They GROW with the ice (core/harbor-weather.js#stepWeather: ice over ~4 min) and
// stay while it lasts. Drawn live (a few hundred small fills — the tier table's `icicles` caps them on weak phones).
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mixC = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));

/** PURE: an edge's icicles — seeded along it (x share 0..1, length share, width pt, a lean, glint phase) */
export function iciclesOf(edge, seed = 1) {
  let s = (seed * 2654435761 + 97) >>> 0; const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const len = Math.hypot(edge.x1 - edge.x0, edge.y1 - edge.y0), out = [];
  const step = 1 / Math.max(1, len * (edge.dens || 0.3));
  for (let u = step * r(); u < 1; u += step * (0.55 + 0.9 * r())) out.push({ u, l: 0.3 + 0.7 * r() ** 1.5, w: 1.4 + 1.2 * r(), lean: (r() - 0.5) * 0.22, g: r() });
  return out;
}

export function createIceFx() {
  const caches = new WeakMap();   // edge list → its icicles (the railing's list + the rest: two lists a frame)
  let drawn = 0, nEdges = 0;
  const glints = [];
  return {
    /** s: { ice (0..1), edges: [{ x0, y0, x1, y1, len (pt: the longest icicle), dens (per pt), tint ([r,g,b] | null), warm (bool: the
     *  speakeasy's own edges catch its light at night), side (bool: a glaze line only — a sign's side) }], ground: { y0, y1, W } | null,
     *  night, day, t, motion, max (the tier's cap) } */
    draw(c, s) {
      if (!s.keep) drawn = 0;
      const ice = clamp01(s.ice || 0);
      if (ice < 0.03 || !s.edges || !s.edges.length) return;
      let cache = caches.get(s.edges);
      if (!cache) { cache = s.edges.map((e, i) => (e.side ? [] : iciclesOf(e, i + 1 + (s.seed || 0)))); caches.set(s.edges, cache); }
      nEdges = Math.max(nEdges, s.edges.length);
      const night = clamp01(s.night || 0), day = clamp01(s.day || 0), grow = 0.3 + 0.7 * ice, tt = s.motion ? s.t || 0 : 0;
      const body0 = day > 0.5 ? [200, 222, 246] : [150, 176, 222];
      let budget = s.max || 160;
      c.save();
      // the ICE SHEEN on the promenade: a cold sheen down the stones + slow glints (the lamps + the neon in the ice)
      if (s.ground && s.ground.y1 > s.ground.y0) {
        const G = s.ground, g = c.createLinearGradient(0, G.y0, 0, G.y1);
        const sc = day > 0.5 ? '226,238,255' : '150,176,236';
        g.addColorStop(0, `rgba(${sc},${(0.16 * ice).toFixed(3)})`); g.addColorStop(0.5, `rgba(${sc},${(0.07 * ice).toFixed(3)})`); g.addColorStop(1, `rgba(${sc},${(0.12 * ice).toFixed(3)})`);
        c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter'; c.fillStyle = g; c.fillRect(0, G.y0, G.W, G.y1 - G.y0);
        if (!glints.length) { let q = 777; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; }; for (let i = 0; i < 26; i++) glints.push({ x: r(), y: r(), w: 6 + r() * 16, p: r() * 6.28 }); }
        c.globalCompositeOperation = 'lighter';
        for (const gl of glints) {
          const a = ice * (0.18 + 0.32 * Math.max(0, Math.sin(tt * 0.9 + gl.p))) * (day > 0.5 ? 0.7 : 1);
          if (a < 0.02) continue;
          const x = gl.x * G.W, y = G.y0 + (G.y1 - G.y0) * (0.08 + 0.85 * gl.y), w = gl.w * (0.6 + 0.6 * gl.y);
          c.globalAlpha = a; c.fillStyle = day > 0.5 ? 'rgb(255,255,255)' : 'rgb(214,226,255)'; c.beginPath(); c.ellipse(x, y, w, Math.max(0.6, w * 0.08), 0, 0, Math.PI * 2); c.fill();
        }
      }
      c.globalCompositeOperation = 'source-over';
      for (let i = 0; i < s.edges.length; i++) {
        const e = s.edges[i], tint = e.tint ? e.tint : e.warm && night > 0.3 ? [255, 214, 168] : null;
        const body = tint ? mixC(body0, tint, e.tint ? 0.55 : 0.45 * night) : body0;
        // THE GLAZE: a bright line of ice along the edge (a sign's side: down its frame)
        c.globalAlpha = Math.min(1, (0.45 + 0.4 * ice) * (day > 0.5 ? 0.8 : 1));
        c.strokeStyle = `rgb(${mixC(body, [255, 255, 255], 0.55)})`; c.lineWidth = e.side ? 1.2 : 1;
        c.beginPath(); c.moveTo(e.x0, e.y0 + 0.5); c.lineTo(e.x1, e.y1 + 0.5); c.stroke();
        // THE ICICLES hanging from it
        const list = cache[i];
        for (const ic of list) {
          if (budget-- <= 0) break;
          const x = e.x0 + (e.x1 - e.x0) * ic.u, y = e.y0 + (e.y1 - e.y0) * ic.u + 0.6, l = (e.len || 5) * ic.l * grow, w = ic.w, tip = x + ic.lean * l;
          if (l < 1) continue;
          c.globalAlpha = 0.62 + 0.3 * ice; c.fillStyle = `rgb(${body})`;
          c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(tip, y + l); c.closePath(); c.fill();
          // its highlight: one bright line down the lit side
          c.globalAlpha = 0.85; c.strokeStyle = `rgb(${mixC(body, [255, 255, 255], 0.7)})`; c.lineWidth = Math.max(0.5, w * 0.32);
          c.beginPath(); c.moveTo(x - w * 0.18, y + 0.3); c.lineTo(x - w * 0.18 + (tip - x) * 0.7, y + l * 0.7); c.stroke();
          // a twinkling tip (a quarter of them at a time): the light caught in the drop at its point
          const tw = Math.sin(tt * 2.2 + ic.g * 30);
          if (tw > 0.55) { c.globalAlpha = (tw - 0.55) / 0.45 * (day > 0.5 ? 0.75 : 0.95); c.fillStyle = tint && e.tint ? `rgb(${mixC(e.tint, [255, 255, 255], 0.5)})` : 'rgb(255,255,255)'; c.fillRect(tip - 0.8, y + l - 0.8, 1.6, 1.6); }
          drawn++;
        }
      }
      c.restore();
    },
    debug: () => ({ icicles: drawn, edges: nEdges }),
  };
}
