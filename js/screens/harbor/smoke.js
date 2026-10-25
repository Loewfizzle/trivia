// CITY 2.0 — THE HARBOR: SKYTYPING (Part 6a; rebuilt in 6b — docs/harbor.md#part-6b). SKYWRITING IS CUT (the owner, Oct 23: "if
// we're already doing the dot-matrix thing, let's not double up") — every sky text message is skytyped (or the banner, or the drones).
//   THE MESSAGE  6b's ONE LAYOUT for every sky message (core/harbor-sky.js#messagePages): up to 3 lines (~16 letters) a PAGE, up to
//                3 pages, each page wrapped for the BIGGEST letters in the open sky — from just above the crowns up to the top safe
//                area (the NEON sign dims to a ghost while it's up: skyfx.js); the next page is typed once the last has been read
//   THE PLANES   a formation of five sleek JETS (jets.js — the owner's call), one per row of the window font, sweeping in tight in a
//                shallow chevron, holding perfect spacing, a dot puffed as each passes a lit column, their afterburners glowing (a
//                hot cone + the Mach diamonds, brighter toward dusk); line 2 on the way back, line 3 across again
// THE SMOKE: every puff is born at a known time (a function of the time since the typing began: every phone sees the same letters, a
// refresh lands mid-word), then drifts on the REAL WIND, swells and softens and fades — a page READABLE for 15 s once it's complete,
// then blown away in ~5 s before the next one; the last page stays while the sign re-ignites and fades behind it over ~70 s. Drawn
// cheaply: the older puffs re-rendered into ONE layer a few times a second (8 while typing, 3 after), the newest live. Only on clear,
// low-wind days (core/harbor-sky.js#smokeWeather) — the API and &force= previews type whatever the weather.
import { messagePages, dotLayout } from '../../core/harbor-sky.js';
import { createJets, jetLook } from './jets.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
/** s a complete page stays readable · s a page in the middle is blown away · s the last page fades behind the re-lit sign */
export const READ = 15, CLEAR = 5, FADE_LAST = 70;

export function createSmoke() {
  let W = 1, H = 1, K = 1, dpr = 2, tier = 2;
  let cur = null;                                       // the writing in the sky: { kind, at, puffs, legs, end, … }
  let layer = null, layerAt = -1e9, layerE = 0, puffSpr = null, puffKey = '';
  const jets = createJets();

  // ---- the plan (pure geometry in screen pt; times in s since the typing began): the box = the open sky the message may use
  function planType(text, box, at) {
    if (!box) return null;
    const pages = messagePages(text, { aspect: box.w / Math.max(1, box.h) });
    if (!pages.length) return null;
    const v = 62 * K, lead = 46 * K, legs = [], puffs = [], info = [];
    let t = 0, pass = 0;
    pages.forEach((lines, pi) => {
      const T = dotLayout(lines);
      if (!T) return;
      const p = Math.min(box.w * 0.9 / T.cols, box.h * 0.9 / T.rows, 17 * K);
      const ox = box.x + (box.w - T.cols * p) / 2 + p / 2, oy = box.y + (box.h - T.rows * p) / 2 + p / 2;
      let done = t;
      // line 1 one way, line 2 back, line 3 across again — off the edge and back between them, a beat later
      T.lines.forEach((ln, i) => {
        const dir = pass++ % 2 ? -1 : 1, rowY = oy + i * 6 * p;
        const xs = dir > 0 ? box.x - lead : box.x + box.w + lead, xe = dir > 0 ? box.x + box.w + lead : box.x - lead, dur = Math.abs(xe - xs) / v;
        legs.push({ a: [xs, rowY], b: [xe, rowY], t0: t, t1: t + dur, dir, pitch: p, page: pi });
        for (const [cx, cy, li] of T.dots) if (li === i) { const x = ox + cx * p, tt = t + (x - xs) / (xe - xs) * dur; puffs.push({ x, y: oy + cy * p, t: tt, r0: p * 0.42, page: pi }); if (tt > done) done = tt; }
        t += dur + 2.4;
      });
      const last = pi === pages.length - 1;
      info.push({ done, fadeAt: done + READ, fadeLen: last ? FADE_LAST : CLEAR, lines: T.lines });
      if (!last) t = Math.max(t, done + READ + CLEAR + 0.5);
    });
    if (!puffs.length) return null;
    puffs.sort((a, b) => a.t - b.t);
    const L = info[info.length - 1];
    return { kind: 'skytype', text: info.map(i => i.lines.join(' / ')).join(' | '), pages: info, at, legs, puffs, last: L.done, release: L.fadeAt, end: L.fadeAt + L.fadeLen };
  }

  // ---- the smoke
  function puffSprite(light) {
    const key = `${Math.round(light.day * 6)}${Math.round(light.gold * 6)}`;
    if (puffSpr && key === puffKey) return puffSpr;
    puffKey = key;
    puffSpr = puffSpr || mk(64, 64);
    const x = safeCtx(puffSpr); x.clearRect(0, 0, 64, 64);
    // a soft round puff: lit from above (white / warm at sunset), its underside a cool grey — the smoke has volume
    const top = light.gold > 0.3 ? [255, 228, 214] : [255, 255, 255], under = light.gold > 0.3 ? [196, 160, 176] : [196, 206, 224];
    let g = x.createRadialGradient(32, 37, 2, 32, 37, 30); g.addColorStop(0, `rgba(${under},0.55)`); g.addColorStop(0.6, `rgba(${under},0.22)`); g.addColorStop(1, `rgba(${under},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    g = x.createRadialGradient(31, 29, 1, 32, 31, 27); g.addColorStop(0, `rgba(${top},0.95)`); g.addColorStop(0.45, `rgba(${top},0.55)`); g.addColorStop(1, `rgba(${top},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return puffSpr;
  }
  // POLISH 4 — THE DARK SOFT HALO (the owner: "in front of the SUN the letters lose contrast"): the NEON sign's + the tagline's own
  // trick — a soft dark shade under every puff (drawn first, the puffs over it), merging into one quiet shadow round the letters. On
  // the blue it is a faint shade; in front of the sun's glare it is what keeps the white dots readable.
  let haloSpr = null;
  function haloSprite() {
    if (haloSpr) return haloSpr;
    haloSpr = mk(64, 64);
    const x = safeCtx(haloSpr), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(8,14,34,0.62)'); g.addColorStop(0.45, 'rgba(8,14,34,0.36)'); g.addColorStop(1, 'rgba(8,14,34,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return haloSpr;
  }
  const HALO_R = 2.3;                                   // (the shade's radius, of the puff's)
  // (only where something bright is behind: a faint shade on the open blue, FIRM in front of the sun's glare — its place from the sun
  // pass, skyfx.sunHaze — so the letters never turn into grey smudges on a plain sky)
  let sunG = null;
  const haloA = (light, x = 0, y = 0) => {
    let g = 0;
    if (sunG && sunG.vis > 0.05) { const d = Math.hypot(x - sunG.x, y - sunG.y) / sunG.R; const u = d >= 1 ? 0 : 1 - d; g = Math.min(1, sunG.vis * u * u * (3 - 2 * u) * 1.4); }
    return (0.12 + 0.06 * light.gold) + 0.46 * g;
  };
  // one puff's look at e (s since the writing began): { r, a } (null = not yet / gone)
  function puffNow(q, e, motion) {
    const age = e - q.t;
    if (age < 0) return null;
    // (its page: readable READ s once complete, then blown away — CLEAR s in the middle of a message, FADE_LAST for the last page)
    const pg = cur.pages[q.page], since = e - pg.fadeAt, fade = 1 - smooth(0, pg.fadeLen, since);
    if (fade <= 0) return null;
    const form = smooth(0, 0.3, age);
    const blow = since > 0 && pg.fadeLen < 20 ? smooth(0, pg.fadeLen, since) : 0;
    const grow = motion ? Math.min(age, 120) * 0.035 * K + blow * q.r0 * 1.6 : 0;
    const soft = 1 - 0.45 * smooth(20, 90, age);   // (the blur: wider, thinner)
    return { r: q.r0 * (0.5 + 0.5 * smooth(0, 0.25, age)) + grow, a: form * fade * soft };
  }
  // a page being cleared: its puffs carried off on a gust (the wind's way, a little up) as they fade
  function blowOf(q, e) {
    const pg = cur.pages[q.page];
    if (pg.fadeLen >= 20 || e < pg.fadeAt) return [0, 0];
    const k = smooth(0, pg.fadeLen, e - pg.fadeAt);
    return [cur.gust * k * k * 40 * K, -k * 6 * K];
  }
  function drift(s) {
    const w = s.L.wind == null ? 2 : Math.min(10, s.L.wind), dir = s.L.windDir == null ? 250 : s.L.windDir;
    return [Math.sin(dir * Math.PI / 180) * w * 0.12 * K, -0.04 * K];        // pt/s (east is screen-left: facing south)
  }
  function renderLayer(s, e, light) {
    const d = Math.min(2, dpr), x = safeCtx(layer), spr = puffSprite(light);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, layer.width, layer.height);
    x.setTransform(d, 0, 0, d, 0, 0);
    const [vx, vy] = drift(s), hs = haloSprite(), live = [];
    for (const q of cur.puffs) {
      if (q.t > e) break;
      const n = puffNow(q, e, s.motion);
      if (!n || n.a < 0.01) continue;
      const age = e - q.t, gust = blowOf(q, e), px = q.x + (s.motion ? vx * age + gust[0] : 0), py = q.y + (s.motion ? vy * age + gust[1] : 0);
      live.push(px, py, n.r, n.a);
    }
    // (the dark halo first — every puff's — then the puffs over it)
    for (let i = 0; i < live.length; i += 4) { const r = live[i + 2] * HALO_R; x.globalAlpha = Math.min(1, live[i + 3] * haloA(light, live[i], live[i + 1])); x.drawImage(hs, live[i] - r, live[i + 1] - r, r * 2, r * 2); }
    for (let i = 0; i < live.length; i += 4) { const r = live[i + 2]; x.globalAlpha = Math.min(1, live[i + 3]); x.drawImage(spr, live[i] - r * 1.25, live[i + 1] - r * 1.25, r * 2.5, r * 2.5); }
    x.globalAlpha = 1;
    layerAt = performance.now(); layerE = e;
  }

  // where the jets are (e s since the start) → [{ x, y, dir, len }] — five in a shallow chevron, one per row of the font
  function planesAt(e) {
    const leg = cur.legs.find(l => e >= l.t0 && e < l.t1);
    if (!leg) return [];
    const k = (e - leg.t0) / (leg.t1 - leg.t0), x = leg.a[0] + (leg.b[0] - leg.a[0]) * k, y = leg.a[1];
    const p = leg.pitch, len = Math.max(13 * K, Math.min(26 * K, p * 1.55)), out = [];
    for (let r = 0; r < 5; r++) out.push({ x: x - leg.dir * Math.abs(r - 2) * p * 0.9 + leg.dir * len * 0.52, y: y + r * p, dir: leg.dir, len, i: r });
    return out;
  }

  return {
    resize(w, h) { W = w; H = h; K = Math.max(0.9, Math.min(1.35, w / 402)); if (layer) { layer.width = layer.height = 0; layer = null; } },
    setDpr(d) { dpr = d; jets.setDpr(d); },
    setTier(t) { tier = t; },
    /** type a message at clock ms `at` in the box (the open sky: skyfx.js#msgBox) → true if it could be laid out */
    start(kind, text, box, at, o = {}) {
      const p = planType(text, box, at);
      if (!p) return false;
      p.gust = o.gust || 1;
      cur = p; layerAt = -1e9;
      return true;
    },
    /** the sign may come back (the last page has been read): s since the start ≥ release */
    released: s => !cur || (s.now - cur.at) / 1000 >= cur.release,
    on: () => !!cur,
    kind: () => (cur ? cur.kind : null),
    stop() { cur = null; },
    /** the sky layer (after the planes, before the clouds) */
    draw(c, s, sun = null) {
      if (!cur) return false;
      sunG = sun && sun.x != null ? { x: sun.x, y: sun.y, vis: sun.vis || 0, R: Math.min(W, H) * 0.34 } : null;
      const e = (s.now - cur.at) / 1000;
      if (e > cur.end) { cur = null; return false; }
      if (e < 0) return true;
      const L = s.L, day = clamp01(L.w.day + L.w.golden * 0.8 + L.w.dawn * 0.7) * (1 - clamp01(L.w.night + L.w.late) * 0.85), gold = clamp01((L.w.golden + L.w.dawn) * 1.3);
      const light = { day: Math.max(0.12, day), gold };
      if (!layer) { const d = Math.min(2, dpr); layer = mk(W * d, H * 0.62 * d); }
      // the layer: all the puffs up to its time, re-rendered 8 times a second while the planes write, 3 after (2 at tier 0)
      const writing = e < cur.last + 0.5, every = writing ? 125 : tier === 0 ? 500 : 333;
      if (performance.now() - layerAt > every || layerE > e) renderLayer(s, e, light);
      const [vx, vy] = drift(s), dt = s.motion ? e - layerE : 0, d = Math.min(2, dpr);
      c.drawImage(layer, vx * dt, vy * dt, layer.width / d, layer.height / d);
      // the newest puffs (born since the layer): live
      const spr = puffSprite(light), hs = haloSprite();
      for (const pass of [0, 1]) for (const q of cur.puffs) {
        if (q.t <= layerE) continue;
        if (q.t > e) break;
        const n = puffNow(q, e, s.motion);
        if (!n) continue;
        if (pass === 0) { const r = n.r * HALO_R; c.globalAlpha = Math.min(1, n.a * haloA(light, q.x, q.y)); c.drawImage(hs, q.x - r, q.y - r, r * 2, r * 2); }
        else { c.globalAlpha = Math.min(1, n.a); c.drawImage(spr, q.x - n.r * 1.25, q.y - n.r * 1.25, n.r * 2.5, n.r * 2.5); }
      }
      c.globalAlpha = 1;
      // the jets (their afterburners lit: brighter toward dusk)
      const ps = planesAt(e);
      if (ps.length) {
        const look = jetLook(L), burn = 0.45 + 0.4 * clamp01(L.w.golden + L.w.dawn + (L.w.night || 0));
        for (const p of ps) jets.draw(c, { x: p.x, y: p.y, dir: p.dir, ang: 0, len: p.len, look, burn, t: performance.now() / 1000 + p.i * 0.31, i: p.i });
      }
      return true;
    },
    /** what's written (tests + previews): { kind, text, puffs, done (all puffs out), k (0..1 of its whole life) } */
    debug: () => (cur ? { kind: cur.kind, text: cur.text, pages: cur.pages.length, puffs: cur.puffs.length, last: +cur.last.toFixed(1), release: +cur.release.toFixed(1), end: +cur.end.toFixed(1) } : null),
    destroy() { if (layer) layer.width = layer.height = 0; if (puffSpr) puffSpr.width = 0; if (haloSpr) haloSpr.width = 0; haloSpr = null; jets.destroy(); layer = null; cur = null; },
  };
}
