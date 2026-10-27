// CITY 2.0 — THE HARBOR: THE CAFÉ-LIGHT CANOPY on THE SPEAKEASY's roof (SP2 — the owner found NEON PASS 4 / 7b's string lights cheap:
// many small bulbs on a wrapped-looking wire). Now FEWER, BIGGER warm Edison bulbs (~8–12 in view), widely spaced, hung in a few
// deep, graceful swags between tall slim posts standing on the roof deck — SET BACK behind the parapet (the parapet + the Deco crest
// hide what hangs behind them: the drawing is clipped to the sky above the building's front silhouette), clear of the billboard's
// frame; the wire thin, barely there. Each bulb: a glass globe, a bright filament core, a TIGHT halo — crisp, never a haze; ~2200 K;
// their light lands a little on the parapet. PARTY NIGHTS: warm party colours (amber, pink, gold, a little violet) slowly cycling, a
// soft punch on the beat. By day: clear glass globes on the wire, a dark filament inside.
// A REUSABLE SYSTEM: set({ scheme: 'warm'|'party'|'christmas'|'halloween' }) or set({ colours: [[r,g,b]…] }) (Part 11's holidays).
//   layout(L)   the posts, the swags + the bulbs on screen, the front silhouette that hides them
//   draw(c, f)  f: { k (0..1 lit), day (0..1), party: { on, energy, beats, beatU, punch } | null, t, motion, tier }
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V } from '../../core/harbor-speakeasy.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** THE SWITCH for the speakeasy roof's lights (scene.js draws them) */
/** the bulbs' look (pt × K, the camera's scale: ~1 on a phone): the globe's radius, the socket, the halo (× r) + its strength, the
 *  parapet's light (land: its face, edge: the coping's lit line) */
export const BULB = Object.freeze({ r: 2.3, socket: 1.1, halo: 2.6, haloA: 0.42, land: 0.1, edge: 0.22 });
/** THE CANOPY's posts (the speakeasy's wall units across, set back on the deck; top: their height over the pavement) + its swags
 *  (a → b, sag: units, n: bulbs). The left run comes in from off screen (the roof goes on past the edge). */
export const CANOPY = Object.freeze({ back: 1.2, top: 13.0, posts: [-1.6, 2.55, 9.75], corner: { in: 0.55, z: 11 },
  swags: [{ a: 0, b: 1, sag: 0.95, n: 3 }, { a: 1, b: 2, sag: 1.05, n: 7 }, { a: 2, b: 3, sag: 0.55, n: 2 }], hidden: 0.35 });
const SCHEMES = {
  warm: [[255, 196, 120]],
  party: [[255, 170, 60], [255, 92, 150], [255, 206, 84], [255, 128, 70], [186, 110, 255]],
  christmas: [[255, 60, 60], [80, 255, 120], [255, 214, 120], [90, 160, 255]],
  halloween: [[255, 140, 30], [170, 70, 255]],
  dotd: [[255, 150, 20], [236, 50, 140], [150, 70, 220], [40, 200, 180], [255, 206, 60]],   // (11a-1: Day of the Dead)
  harvest: [[255, 184, 92], [255, 140, 52], [255, 212, 130], [236, 110, 48]],                   // (11a-2: Thanksgiving — warm harvest golds + amber)
};

/** the front's top silhouette (wall units u → v): the parapet, the pier finials, the stepped Deco crest (speakeasy.js#paintFrontDeco) */
export function frontProfile() {
  const P = SPEAK_V.parapet, rects = [];
  for (const u of [9.95]) rects.push([u - 0.24, u + 0.24, P + 0.18], [u - 0.13, u + 0.13, P + 0.32]);
  // (POL4: the raised panel that holds the date stone, then the Deco's two steps — speakeasy-bake.js#DATE)
  for (const [hw, top] of [[1.95, P + 0.37], [0.9, P + 0.61], [0.42, SPEAK_V.crest]]) rects.push([5.6 - hw - 0.04, 5.6 + hw + 0.04, top]);
  const xs = [...new Set([-3, 11.2, ...rects.flatMap(r => [r[0], r[1]])])].sort((a, b) => a - b), out = [];
  for (let i = 0; i < xs.length; i++) {
    const m = i + 1 < xs.length ? (xs[i] + xs[i + 1]) / 2 : xs[i] - 1e-6, h = Math.max(P, ...rects.filter(r => m >= r[0] && m <= r[1]).map(r => r[2]));
    if (i) out.push([xs[i], out[out.length - 1][1]]);
    out.push([xs[i], h]);
  }
  return out;
}

export function createStrings() {
  let runs = [], bulbs = [], posts = [], K = 1, cfg = { scheme: null, colours: null }, par = null, occ = null, litCv = null, litKey = '', litAt = null;
  const halos = new Map();
  // a bulb's halo per colour (cached): tight — gone within BULB.halo radii
  function halo(col) {
    const key = col.join(',');
    if (halos.has(key)) return halos.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(${key},1)`); g.addColorStop(0.3, `rgba(${key},0.5)`); g.addColorStop(0.6, `rgba(${key},0.12)`); g.addColorStop(1, `rgba(${key},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    if (halos.size > 40) { for (const d of halos.values()) d.width = 0; halos.clear(); }
    halos.set(key, c);
    return c;
  }
  // the screen y of the building's silhouette at screen x (the clip's top edge): null = open sky there
  const occAt = sx => {
    if (!occ) return null;
    for (let i = 0; i + 1 < occ.length; i++) { const [x0, y0] = occ[i], [x1, y1] = occ[i + 1]; if (sx >= Math.min(x0, x1) && sx <= Math.max(x0, x1) && x1 !== x0) return y0 + (y1 - y0) * (sx - x0) / (x1 - x0); }
    return null;
  };
  function layout(L) {
    const cam = L.cam, s = L.speakeasy, C = CANOPY, zb = s.z0 + C.back, len = Math.hypot(s.side.x - s.x1, s.side.z - s.z0), dx = (s.side.x - s.x1) / len, dz = (s.side.z - s.z0) / len;
    K = cam.F / 600;
    runs = []; bulbs = []; litKey = '';
    // the posts: along the front (set back on the deck) + one at the back of the roof by the side wall
    const cz = Math.min(s.z0 + C.corner.z, s.side.z - 1), cnr = [s.x1 + dx * (cz - s.z0) / Math.max(1e-6, dz) - C.corner.in, C.top - 0.3, cz];
    const world = [...C.posts.map(u => [s.x0 + u, C.top, zb]), cnr];
    posts = world.map(([x, y, z]) => ({ top: project(cam, x, y, z), foot: project(cam, x, SPEAK_V.parapet - 0.3, z) }));
    // the front's silhouette on screen (the parapet + finials + crest, then the side wall's parapet back) — what hides the canopy
    occ = frontProfile().map(([u, v]) => project(cam, s.x0 + u, v, s.z0));
    occ.push(project(cam, s.x1 + dx * len, SPEAK_V.parapet, s.z0 + dz * len));
    const r = BULB.r * K + 0.25;
    for (const sw of C.swags) {
      const a = world[sw.a], b = world[sw.b], pts = [];
      const at = u => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sw.sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      for (let i = 0; i <= 28; i++) pts.push(project(cam, ...at(i / 28)));
      runs.push(pts);
      for (let i = 0; i < sw.n; i++) {
        const u = (i + 0.5) / sw.n, [wx, wy, wz] = at(u), w = project(cam, wx, wy, wz), p = project(cam, wx, wy - 0.13 - BULB.socket * 0.05, wz);
        if (p[0] < -r || p[0] > cam.W + r) continue;
        // (a bulb mostly behind the parapet or the crest isn't drawn — the clip would leave a sliver)
        const top = occAt(p[0]); if (top != null && p[1] - r + 2 * r * (1 - C.hidden) > top) continue;
        bulbs.push({ x: p[0], y: p[1] + r * 0.2, w: w, i: bulbs.length });
      }
    }
    { const [xa, ya] = project(cam, s.x0, SPEAK_V.parapet, s.z0), [xb] = project(cam, s.x1, SPEAK_V.parapet, s.z0), [, yb] = project(cam, s.x0, SPEAK_V.cornice[1], s.z0); par = { x0: Math.max(0, xa), x1: xb, y0: ya, y1: yb }; }
  }
  function colours() { return cfg.colours || SCHEMES[cfg.scheme] || null; }
  // the clip: the sky above the building's silhouette (evenodd: the screen minus the building)
  function clip(c) {
    if (!occ) return;
    c.beginPath(); c.rect(-50, -50, 1e4, 1e4);
    c.moveTo(occ[0][0] - 400, occ[0][1]); for (const [x, y] of occ) c.lineTo(x, y);
    const e = occ[occ.length - 1]; c.lineTo(e[0], 1e4); c.lineTo(occ[0][0] - 400, 1e4); c.closePath();
    c.clip('evenodd');
  }
  /** the lit bulbs into one sprite (screen pt + a halo's pad), at the canvas's device scale */
  function paintLit(dpr, tier, colOf, rb, k) {
    if (!bulbs.length) return;
    const pad = rb * BULB.halo * 1.3 + 2, x0 = Math.min(...bulbs.map(b => b.x)) - pad, y0 = Math.min(...bulbs.map(b => b.y)) - pad;
    litAt = { x: x0, y: y0, w: Math.max(...bulbs.map(b => b.x)) + pad - x0, h: Math.max(...bulbs.map(b => b.y)) + pad - y0 };
    litCv = litCv || document.createElement('canvas'); litCv.width = Math.ceil(litAt.w * dpr); litCv.height = Math.ceil(litAt.h * dpr);
    const x = safeCtx(litCv); x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr); x.clearRect(x0, y0, litAt.w, litAt.h);
    x.globalCompositeOperation = 'lighter';
    if (tier !== 0) for (const b of bulbs) { const [col, a] = colOf(b); x.globalAlpha = Math.min(1, a * BULB.haloA); const R = rb * BULB.halo; x.drawImage(halo(col), b.x - R, b.y - R, R * 2, R * 2); }
    x.globalCompositeOperation = 'source-over';
    for (const b of bulbs) {
      const [col, a] = colOf(b), e = Math.min(1, a);
      // the globe: the warm glass (darker toward its rim), the filament's bright core (a short upright loop), a glint
      const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, rb);
      g.addColorStop(0, `rgba(${col.map(v => Math.round(Math.min(255, v * 0.6 + 110))).join(',')},${(0.95 * e).toFixed(3)})`); g.addColorStop(0.7, `rgba(${col.join(',')},${(0.9 * e).toFixed(3)})`); g.addColorStop(1, `rgba(${col.map(v => Math.round(v * 0.62)).join(',')},${(0.95 * e).toFixed(3)})`);
      x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, rb, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(255,252,236,${e.toFixed(3)})`; x.beginPath(); x.ellipse(b.x, b.y + rb * 0.05, rb * 0.24, rb * 0.48, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(255,255,255,${(0.5 * e).toFixed(3)})`; x.beginPath(); x.arc(b.x - rb * 0.42, b.y - rb * 0.4, rb * 0.2, 0, Math.PI * 2); x.fill();
    }
  }

  function draw(c, f) {
    if (!runs.length) return;
    const k = f.k || 0, day = f.day || 0, rb = BULB.r * K + 0.25;
    c.save(); clip(c);
    // the posts: tall + slim (dark iron), a small cap; the wire: thin, barely there
    c.strokeStyle = k > 0.3 ? 'rgba(70,54,50,0.95)' : 'rgba(28,24,30,0.95)'; c.lineWidth = Math.max(1, 0.95 * K);
    c.beginPath(); for (const p of posts) { c.moveTo(p.foot[0], p.foot[1]); c.lineTo(p.top[0], p.top[1] - 1.2 * K); } c.stroke();
    c.fillStyle = 'rgba(28,24,30,0.95)'; for (const p of posts) c.fillRect(p.top[0] - 1.1 * K, p.top[1] - 1.6 * K, 2.2 * K, 0.8 * K);
    c.lineWidth = Math.max(0.6, 0.55 * K); c.strokeStyle = k > 0.3 ? 'rgba(120,88,66,0.85)' : 'rgba(34,32,38,0.7)';   // (at night the wire catches the bulbs' light: it reads as hung, never floating dots)
    c.beginPath(); for (const pts of runs) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); } c.stroke();
    // the sockets: a short drop from the wire + a dark brass cap over each globe
    c.fillStyle = 'rgba(30,26,26,0.95)';
    for (const b of bulbs) { c.fillRect(b.x - 0.25 * K, b.w[1], 0.5 * K, b.y - rb - b.w[1] + 0.3); c.fillRect(b.x - rb * 0.42, b.y - rb - BULB.socket * K * 0.7, rb * 0.84, BULB.socket * K * 0.8); }
    // by day (and fading as they light): clear glass globes — pale glass, a dark filament, a highlight
    if (k < 0.98) {
      // (8b1 — the blackout's leftovers: after dark an UNLIT globe is dark glass catching a little of the night sky — the daylight's
      // pale glass + white glint read as lit bulbs in the TR-3B's blackout)
      const a = (1 - k) * (0.55 + 0.45 * day), dg = Math.max(0, Math.min(1, day)), gc = [0, 1, 2].map(i => Math.round([58, 60, 76][i] + ([226, 230, 234][i] - [58, 60, 76][i]) * dg)).join(',');
      for (const b of bulbs) {
        c.fillStyle = `rgba(${gc},${(0.55 * a).toFixed(3)})`; c.beginPath(); c.arc(b.x, b.y, rb, 0, Math.PI * 2); c.fill();
        c.strokeStyle = `rgba(150,156,166,${(0.7 * a).toFixed(3)})`; c.lineWidth = Math.max(0.4, 0.3 * K); c.beginPath(); c.arc(b.x, b.y, rb - 0.2, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = `rgba(90,70,60,${(0.8 * a).toFixed(3)})`; c.beginPath(); c.moveTo(b.x - rb * 0.18, b.y - rb * 0.55); c.lineTo(b.x - rb * 0.12, b.y + rb * 0.3); c.lineTo(b.x + rb * 0.12, b.y + rb * 0.3); c.lineTo(b.x + rb * 0.18, b.y - rb * 0.55); c.stroke();
        c.fillStyle = `rgba(255,255,255,${(0.85 * a * (0.25 + 0.75 * dg)).toFixed(3)})`; c.beginPath(); c.arc(b.x - rb * 0.4, b.y - rb * 0.38, rb * 0.26, 0, Math.PI * 2); c.fill();
      }
    }
    if (k > 0.01) {
      const p = f.party, pk = p && p.on > 0.05 ? clamp01(p.on) : 0, own = colours();
      const pal = own || (pk > 0.05 ? SCHEMES.party : SCHEMES.warm);
      // the party: the colours SLOWLY cycling (a step every 2.6 s, crossfaded), a soft punch on the beat
      const step = f.motion ? Math.floor(f.t / 2.6) : 0, fr = f.motion ? clamp01(((f.t / 2.6) % 1) * 2.5) : 1;
      const punch = p && f.motion ? (p.punch || 0) * pk : 0, pq = Math.round(punch * 6) / 6, fq = Math.round(fr * 4) / 4;
      const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
      const colOf = bb => {
        if (pal.length < 2) return [pal[0], k];
        const ci = ((bb.i + step) % pal.length + pal.length) % pal.length, cj = ((bb.i + step - 1) % pal.length + pal.length) % pal.length;
        return [mixc(pal[cj], pal[ci], fq), k * (1 + 0.35 * pq)];
      };
      // the lit bulbs — ONE SPRITE, re-painted only when the light, the colour step or the punch moves a notch
      const key = `${Math.round(k * 16)}|${f.tier === 0 ? 0 : 1}|${pal.length > 1 ? `${step}|${fq}|${pq}` : 's'}|${own ? own.join(';') : ''}|${c.getTransform().a.toFixed(2)}`;
      if (key !== litKey) { litKey = key; paintLit(c.getTransform().a, f.tier, colOf, rb, k); }
      if (litCv && litAt) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.drawImage(litCv, litAt.x, litAt.y, litAt.w, litAt.h); }
    }
    c.restore();
    // THE LIGHT LANDING on the parapet (outside the clip — it lands on the building's face): the coping's lit line + a faint warm fall
    if (k > 0.01 && par && par.x1 > par.x0) {
      const pk = f.party && f.party.on > 0.3, gc = pk ? [255, 160, 150] : [255, 200, 140];
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(0, par.y0, 0, par.y1); g.addColorStop(0, `rgba(${gc},${(BULB.land * k).toFixed(3)})`); g.addColorStop(1, `rgba(${gc},0)`);
      c.fillStyle = g; c.fillRect(par.x0, par.y0, par.x1 - par.x0, par.y1 - par.y0);
      c.fillStyle = `rgba(${gc},${(BULB.edge * k).toFixed(3)})`; c.fillRect(par.x0, par.y0 - 0.5 * K, par.x1 - par.x0, 0.6 * K);
      c.restore();
    }
  }
  return {
    layout, draw,
    /** later parts: { scheme: 'warm'|'party'|'christmas'|'halloween' } or { colours: [[r,g,b]…] } (null resets) */
    set(o = {}) { if ('scheme' in o) cfg.scheme = o.scheme || null; if ('colours' in o) cfg.colours = o.colours || null; },
    debug: () => ({ runs: runs.length, bulbs: bulbs.length, posts: posts.length, at: bulbs.map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1) })), cfg: { ...cfg } }),
    destroy() { for (const d of halos.values()) d.width = 0; halos.clear(); runs = []; bulbs = []; if (litCv) litCv.width = litCv.height = 0; litCv = null; litKey = ''; },
  };
}
