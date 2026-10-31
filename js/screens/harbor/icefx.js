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
  // (ATM-C — CHUNKY on the nearest ledges (edge.big: the awning, the window heads, the blade, the cornice): HALF as many, about twice as wide —
  // a few bold icicles read at phone size where a fringe of thin ones read as rain; between them a few short stubs)
  const big = !!edge.big, step = 1 / Math.max(1, len * (edge.dens || 0.3) * (big ? 0.5 : 1));
  for (let u = step * r(); u < 1; u += step * (0.55 + 0.9 * r())) out.push({ u, l: (big ? 0.35 : 0.3) + (big ? 0.65 : 0.7) * r() ** 1.5, w: big ? 2.6 + 1.8 * r() : 1.4 + 1.2 * r(), lean: (r() - 0.5) * 0.22, g: r() });
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
      if (!cache) { cache = s.edges.map((e, i) => (e.side ? [] : iciclesOf(e, i + 1 + (s.seed || 0)))); cache.order = s.edges.map((e, i) => i).sort((a, b) => (s.edges[b].big ? 1 : 0) - (s.edges[a].big ? 1 : 0)); caches.set(s.edges, cache); }   // (ATM-C: the chunky edges first — the tier's icicle cap never runs out before the blade)
      nEdges = Math.max(nEdges, s.edges.length);
      const night = clamp01(s.night || 0), day = clamp01(s.day || 0), grow = 0.3 + 0.7 * ice, tt = s.motion ? s.t || 0 : 0;
      const body0 = day > 0.5 ? [200, 222, 246] : [150, 176, 222];
      let budget = s.max || 160;
      c.save();
      // ATM-C — THE ICE CARRIES IT (the owner, Oct 31: freezing rain "just looks like LIGHT RAIN" — night + day): the ground a SHINY ICE
      // SHEET (a glassy cold sheen, long mirror streaks of the lamps + the neon, bright glints), FROSTED panes, a COLDER grade; the
      // icicles chunky + the glaze glassy (below)
      if (s.ground && s.ground.y1 > s.ground.y0) {
        const G = s.ground, g = c.createLinearGradient(0, G.y0, 0, G.y1);
        const sc = day > 0.5 ? '232,242,255' : '150,180,240';
        g.addColorStop(0, `rgba(${sc},${(0.42 * ice).toFixed(3)})`); g.addColorStop(0.45, `rgba(${sc},${(0.22 * ice).toFixed(3)})`); g.addColorStop(1, `rgba(${sc},${(0.34 * ice).toFixed(3)})`);
        c.globalCompositeOperation = day > 0.5 ? 'source-over' : 'lighter'; c.fillStyle = g; c.fillRect(0, G.y0, G.W, G.y1 - G.y0);
        if (!glints.length) { let q = 777; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; }; for (let i = 0; i < 30; i++) glints.push({ x: r(), y: r(), w: 16 + r() * 34, p: r() * 6.28, c: (r() * 4) | 0 }); }
        c.globalCompositeOperation = 'lighter';
        // (the mirror streaks: long thin horizontal sheens — at night in the neon's + the lamps' colours, white by day — breathing slowly)
        const SC = day > 0.5 ? [[255, 255, 255], [240, 248, 255], [255, 255, 255], [232, 244, 255]] : [[255, 120, 200], [120, 220, 255], [255, 210, 150], [200, 214, 255]];
        for (const gl of glints) {
          const a = ice * (0.32 + 0.45 * Math.max(0, Math.sin(tt * 0.7 + gl.p))) * (day > 0.5 ? 0.8 : 1);
          if (a < 0.02) continue;
          const x = gl.x * G.W, y = G.y0 + (G.y1 - G.y0) * (0.08 + 0.85 * gl.y), w = gl.w * (0.6 + 0.7 * gl.y);
          c.globalAlpha = a; c.fillStyle = `rgb(${SC[gl.c]})`; c.beginPath(); c.ellipse(x, y, w, Math.max(0.9, w * 0.075), 0, 0, Math.PI * 2); c.fill();
          c.globalAlpha = Math.min(1, a * 1.6); c.fillStyle = 'rgb(255,255,255)'; c.beginPath(); c.ellipse(x, y, w * 0.18, Math.max(0.6, w * 0.035), 0, 0, Math.PI * 2); c.fill();
        }
      }
      // FROSTED PANES (the speakeasy's + the shop's glass): a pale cold film, frostier toward the corners
      if (s.panes) {
        c.globalCompositeOperation = 'source-over';
        const fc = day > 0.5 ? '228,240,255' : '170,196,240';
        for (const P of s.panes) {
          const r = Math.max(P.w, P.h) * 0.75, gx = c.createRadialGradient(P.x + P.w / 2, P.y + P.h / 2, Math.min(P.w, P.h) * 0.2, P.x + P.w / 2, P.y + P.h / 2, r);
          gx.addColorStop(0, `rgba(${fc},${(0.1 * ice).toFixed(3)})`); gx.addColorStop(1, `rgba(${fc},${(0.42 * ice).toFixed(3)})`);
          c.globalAlpha = 1; c.fillStyle = gx; c.fillRect(P.x, P.y, P.w, P.h);
        }
      }
      c.globalCompositeOperation = 'source-over';
      for (const i of cache.order) {
        const e = s.edges[i], tint = e.tint ? e.tint : e.warm && night > 0.3 ? [255, 214, 168] : null;
        const body = tint ? mixC(body0, tint, e.tint ? 0.55 : 0.45 * night) : body0;
        // THE GLAZE: a bright line of ice along the edge (a sign's side: down its frame)
        c.globalAlpha = Math.min(1, (0.55 + 0.4 * ice) * (day > 0.5 ? 0.85 : 1));
        c.strokeStyle = `rgb(${mixC(body, [255, 255, 255], 0.62)})`; c.lineWidth = e.side ? 1.6 : e.big ? 1.8 : 1.5;
        c.beginPath(); c.moveTo(e.x0, e.y0 + 0.5); c.lineTo(e.x1, e.y1 + 0.5); c.stroke();
        // (ATM-C: the glaze GLASSY — specular glints sliding slowly along it, catching the neon + the lamps (white by day))
        if (!e.side) {
          const el = Math.hypot(e.x1 - e.x0, e.y1 - e.y0), n = Math.max(1, Math.min(4, Math.round(el / 70))), gc = e.tint ? mixC(e.tint, [255, 255, 255], 0.35) : night > 0.3 ? [214, 230, 255] : [255, 255, 255];
          c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgb(${gc})`;
          for (let k = 0; k < n; k++) {
            const u = (((tt * 0.03 + k / n + i * 0.37) % 1) + 1) % 1, gx = e.x0 + (e.x1 - e.x0) * u, gy = e.y0 + (e.y1 - e.y0) * u + 0.5, gw = 5 + el * 0.02;
            c.globalAlpha = Math.min(1, 0.55 + 0.35 * ice) * Math.sin(Math.PI * u); c.beginPath(); c.ellipse(gx, gy, gw, 1.1, Math.atan2(e.y1 - e.y0, e.x1 - e.x0), 0, Math.PI * 2); c.fill();
          }
          c.globalCompositeOperation = 'source-over';
        }
        // THE ICICLES hanging from it
        const list = cache[i];
        for (const ic of list) {
          if (budget-- <= 0) break;
          const x = e.x0 + (e.x1 - e.x0) * ic.u, y = e.y0 + (e.y1 - e.y0) * ic.u + 0.6, l = (e.len || 5) * ic.l * grow, w = ic.w, tip = x + ic.lean * l;
          if (l < 1) continue;
          // (a chunky icicle: a glassy body, slightly bulged near the top, a darker cold edge on the shadow side, a bright lit side)
          c.globalAlpha = 0.66 + 0.3 * ice; c.fillStyle = `rgb(${body})`;
          c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.quadraticCurveTo(x + w * 0.42 + (tip - x) * 0.3, y + l * 0.3, tip, y + l); c.quadraticCurveTo(x - w * 0.42 + (tip - x) * 0.3, y + l * 0.3, x - w / 2, y); c.fill();
          if (e.big) { c.globalAlpha = 0.35; c.strokeStyle = `rgb(${mixC(body, [40, 70, 120], 0.45)})`; c.lineWidth = Math.max(0.5, w * 0.16); c.beginPath(); c.moveTo(x + w * 0.38, y + 0.4); c.lineTo(x + w * 0.1 + (tip - x) * 0.75, y + l * 0.75); c.stroke(); }
          // its highlight: one bright line down the lit side
          c.globalAlpha = 0.92; c.strokeStyle = `rgb(${mixC(body, [255, 255, 255], 0.78)})`; c.lineWidth = Math.max(0.5, w * 0.3);
          c.beginPath(); c.moveTo(x - w * 0.2, y + 0.3); c.lineTo(x - w * 0.2 + (tip - x) * 0.7, y + l * 0.72); c.stroke();
          // the tip: a bright bead of light (always on the big ones, twinkling on the rest) + a small glow at night
          const tw = Math.sin(tt * 2.2 + ic.g * 30), tc = tint && e.tint ? `rgb(${mixC(e.tint, [255, 255, 255], 0.5)})` : 'rgb(255,255,255)';
          if (e.big) {
            const bk = 0.55 + 0.45 * Math.max(0, tw), br = Math.max(0.8, w * 0.24);
            if (night > 0.3) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.1 * bk * night; c.fillStyle = tc; c.beginPath(); c.arc(tip, y + l - br * 0.5, br * 2.6, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over'; }
            c.globalAlpha = bk; c.fillStyle = tc; c.beginPath(); c.arc(tip, y + l - br * 0.5, br, 0, Math.PI * 2); c.fill();
          } else if (tw > 0.55) { c.globalAlpha = (tw - 0.55) / 0.45 * (day > 0.5 ? 0.75 : 0.95); c.fillStyle = tc; c.fillRect(tip - 0.8, y + l - 0.8, 1.6, 1.6); }
          drawn++;
        }
      }
      // THE COLDER GRADE (the main call — the one with the ground): the whole frame a touch blue-white
      if (s.ground && s.grade) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = day > 0.5 ? `rgba(206,226,255,${(0.08 * ice).toFixed(3)})` : `rgba(110,146,220,${(0.07 * ice).toFixed(3)})`; c.fillRect(0, 0, s.grade.W, s.grade.H); }
      c.restore();
    },
    debug: () => ({ icicles: drawn, edges: nEdges }),
  };
}
