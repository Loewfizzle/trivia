// CITY 2.0 — ATM-B: THE STORM DECK (the owner, Oct 26: "THE STORM ISN'T A STORM YET"; decisions.md §10 THE STORM). A thunderstorm's sky:
// a LOW, HEAVY BASE rolling across the top of the sky (dark lumpy rolls, sagging pouches along its underside) + dark CUMULONIMBUS TOWERS
// rising behind the skyline into an anvil that merges with the base — ROLLING IN on the wind (slowly: the clouds' speed rule, minutes
// across), LIT FROM INSIDE by the lightning (the strike's patch of the deck flaring through its own shapes: lightning.js#flashInfo). By day
// a slate grey, its tops a little lighter; at night near-black, its underside catching the city's glow.
// THE COST: one baked tile (made once per size + light bucket, ~1.6 screens wide), drawn twice a frame (+ once more, clipped, in a flash).
// It draws in the sky layer after the everyday clouds (clouds.js keeps its storm grey under it) and before the lightning's glow + bolts.
import { safeCtx } from '../../ui/canvas-safe.js';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mixC = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));

/** PURE: the deck's colours by the light — { body, top, under } */
export function deckColours(day, night, party = false) {
  const d = clamp01(day), n = clamp01(night);
  const body = mixC(mixC([46, 50, 62], [22, 20, 30], n), [78, 84, 96], d);
  const top = mixC(mixC(body, [44, 40, 58], 0.55), [206, 210, 220], d * 0.85);   // (by day the sun on the towers' cauliflower crowns)
  const under = mixC(body, party ? [112, 58, 112] : [92, 70, 86], n * 0.55);
  return { body, top, under };
}

export function createStormDeck() {
  let tile = null, scratch = null, key = '', off = 0, lastT = null, dbg = { on: false, towers: 0, mb: 0, flashes: 0 };
  function bake(W, top, base, horizon, cols, dpr) {
    const TW = Math.ceil(W * 1.6), TH = Math.ceil(horizon), s = Math.min(2, dpr || 1);
    if (!tile) tile = mk(1, 1);
    tile.width = Math.ceil(TW * s); tile.height = Math.ceil(TH * s);
    const x = safeCtx(tile);
    x.setTransform(s, 0, 0, s, 0, 0); x.clearRect(0, 0, TW, TH);
    let sd = 4242; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const blob = (cx, cy, rad, col, a) => {
      for (const ox of [-TW, 0, TW]) {
        if (cx + ox + rad < 0 || cx + ox - rad > TW) continue;
        const g = x.createRadialGradient(cx + ox, cy - rad * 0.2, rad * 0.1, cx + ox, cy, rad);
        g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.72, `rgba(${col},${a * 0.88})`); g.addColorStop(1, `rgba(${col},0)`);
        x.fillStyle = g; x.beginPath(); x.arc(cx + ox, cy, rad, 0, Math.PI * 2); x.fill();
      }
    };
    const B = cols.body.join(','), U = cols.under.join(','), T = cols.top.join(',');
    // the TOWERS (behind the skyline): a column of rounded masses from the horizon up, widening into a flat anvil under the base
    const nT = W > 600 ? 3 : 2, towers = [];
    for (let i = 0; i < nT; i++) {
      const cx = TW * (0.12 + (i + r() * 0.6) / nT * 0.82), foot = horizon, crest = base + (horizon - base) * (0.05 + 0.18 * r()), w0 = W * (0.13 + 0.07 * r());
      towers.push(cx);
      // (each LUMP a plain dark mass — lit crowns read as rows of balls at phone size (tried: ATM-B); the lightning reveals their shape)
      const lump = (lx, ly, rad) => blob(lx, ly, rad, B, 0.97);
      for (let y = foot; y > crest; y -= w0 * 0.2) {
        const u = (foot - y) / (foot - crest), w = w0 * (0.7 + 0.6 * u * u);
        for (let k = 0; k < 3; k++) lump(cx + (r() - 0.5) * w * 1.1, y + (r() - 0.5) * w0 * 0.16, w * (0.34 + 0.24 * r()));
      }
      // the anvil: a wide, flattened spread into the base, sheared downwind
      for (let k = 0; k < 8; k++) lump(cx + (r() - 0.3) * w0 * 3, crest + (r() - 0.5) * w0 * 0.2, w0 * (0.4 + 0.3 * r()));
    }
    // THE LOW, HEAVY BASE: rolls of dark cloud along the top, thickest at the very top, sagging lumpy pouches along its underside
    const bandH = base - top;
    for (let i = 0; i < 110; i++) { const cx = r() * TW, cy = top - bandH * 0.3 + r() * bandH * 0.95, rad = bandH * (0.22 + 0.4 * r()); blob(cx, cy, rad, B, 0.92); }
    for (let i = 0; i < 70; i++) { const cx = r() * TW, cy = base - bandH * (0.05 + 0.18 * r()), rad = bandH * (0.08 + 0.12 * r()); blob(cx, cy, rad, U, 0.85); }
    // (a dark roof over it all: the base merges into the sky's own darkness at the top)
    const g = x.createLinearGradient(0, 0, 0, top + bandH * 0.4); g.addColorStop(0, `rgba(${B},0.96)`); g.addColorStop(1, `rgba(${B},0)`);
    x.fillStyle = g; x.fillRect(0, 0, TW, top + bandH * 0.4);
    dbg.towers = towers.length; dbg.mb = +((tile.width * tile.height * 4) / 1e6).toFixed(2);
    return { TW, TH };
  }
  let dims = { TW: 1, TH: 1 };
  return {
    /** s: { k (0..1 the storm in), W, top (the base's top: the safe top), base (its underside y), horizon (the towers' foot: the skyline's
     *  lowest crown line), day, night, party, t (s), motion, wind (signed m/s at the clouds' height — slowed), dpr, flash: { x, y, rad, k } | null } */
    draw(c, s) {
      dbg.on = s.k > 0.01;
      if (s.k <= 0.01 || !(s.horizon > s.base) || !(s.base > s.top)) return;
      const cols = deckColours(s.day, s.night, s.party);
      const k2 = `${Math.round(s.W)}|${Math.round(s.top)}|${Math.round(s.base)}|${Math.round(s.horizon)}|${cols.body}|${Math.round((s.dpr || 1) * 2)}`;
      if (k2 !== key) { key = k2; dims = bake(s.W, s.top, s.base, s.horizon, cols, s.dpr); }
      // ROLLING IN: the deck slides downwind — a cloud's minutes across (≤ ~3 pt/s), never racing
      const dt = lastT == null ? 0 : Math.max(0, Math.min(0.2, s.t - lastT)); lastT = s.t;
      if (s.motion) off = (off + Math.max(-3, Math.min(3, (s.wind || 0) * 0.22)) * dt) % dims.TW;
      const o = ((off % dims.TW) + dims.TW) % dims.TW;
      c.save(); c.globalAlpha = Math.min(1, s.k);
      for (const x0 of [o - dims.TW, o]) if (x0 < s.W && x0 + dims.TW > 0) c.drawImage(tile, x0, 0, dims.TW, dims.TH);
      // LIT FROM INSIDE: the strike's patch of the deck flares through its own shapes (the tile again, 'lighter', clipped round the strike)
      const f = s.flash;
      if (f && f.k > 0.01) {
        // (a small scratch: the deck's shapes in the strike's patch, filled with its light (a radial falloff) — added on top: the cloud
        // masses glow from inside, their edges + gaps stay dark)
        const rw = f.rad * 2.4, rh = Math.min(dims.TH, f.rad * 1.7), bx = f.x - rw / 2, by = Math.max(0, f.y - rh / 2);
        if (!scratch) scratch = mk(1, 1);
        const sw = Math.ceil(Math.min(420, rw)), sh = Math.ceil(Math.min(320, rh)), kx = sw / rw, ky = sh / rh;
        if (scratch.width !== sw || scratch.height !== sh) { scratch.width = sw; scratch.height = sh; }
        const x = safeCtx(scratch);
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, sw, sh);
        x.setTransform(kx, 0, 0, ky, -bx * kx, -by * ky);
        for (const x0 of [o - dims.TW, o]) if (x0 < s.W && x0 + dims.TW > 0) x.drawImage(tile, x0, 0, dims.TW, dims.TH);
        x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-in';
        const g = x.createRadialGradient(sw * ((f.x - bx) / rw), sh * ((f.y - by) / rh), 0, sw * ((f.x - bx) / rw), sh * ((f.y - by) / rh), sw * 0.5);
        g.addColorStop(0, 'rgb(236,234,255)'); g.addColorStop(0.45, 'rgb(170,166,230)'); g.addColorStop(1, 'rgb(40,36,70)');
        x.fillStyle = g; x.fillRect(0, 0, sw, sh);
        // (the patch fades to nothing at its edge — never a box: the deck is solid there, so the light itself must fall off)
        x.globalCompositeOperation = 'destination-in';
        const m = x.createRadialGradient(sw * ((f.x - bx) / rw), sh * ((f.y - by) / rh), 0, sw * ((f.x - bx) / rw), sh * ((f.y - by) / rh), Math.min(sw, sh * 1.4) * 0.5);
        m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.55, 'rgba(0,0,0,0.55)'); m.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = m; x.fillRect(0, 0, sw, sh);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(0.75, f.k * 1.5) * s.k;
        c.drawImage(scratch, bx, by, rw, rh);
        dbg.flashes++;
      }
      c.restore();
    },
    debug: () => ({ ...dbg }),
    destroy() { if (tile) tile.width = tile.height = 0; if (scratch) scratch.width = scratch.height = 0; tile = scratch = null; key = ''; },
  };
}
