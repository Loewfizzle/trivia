// CITY 2.0 — ATM-B: THE STORM DECK (the owner, Oct 26: "THE STORM ISN'T A STORM YET"; decisions.md §10 THE STORM) — REBUILT in PART 10's
// Group 0 as REAL CUMULONIMBUS (the owner's ATM-D review, Oct 31 8:10 + 8:12 pm: "almost looks like TORNADOES — the bases of the clouds go
// way too far down"; the old deck's pouches + its tower columns, narrow at the foot and widening upward, hung beside the logo like funnels):
//   · THE NEAR DECK overhead — a dark band along the top with a broad, FLAT, ragged underside at `base` (no pouches, no lobes), faint rolls
//     inside, its underside catching the city's glow at night, a few soft rain curtains falling from it;
//   · THE FAR THUNDERHEADS (two; three on a wide screen), each WHOLE + in view: a flat dark base held well above the skyline (and above the
//     rain's haze, which ate a lower foot and left only an anvil on a stem — a funnel again), stepped billowing towers broadest at the base,
//     the main updraft's steep wall, the flat-topped ANVIL spreading downwind with its underside flaring into the tower, a soft rain shaft
//     below. One silhouette per cell (unioned lumps on a scratch, shaded by height — lit crowns read as rows of balls: ATM-B). By day the
//     sun on them (lighter than the storm's grey all the way up: a cell crossing the sky's value falls apart); at night the city's glow on
//     their bases, faint — the lightning shows them whole.
// ROLLING IN on the wind (slowly: the clouds' speed rule, minutes across), LIT FROM INSIDE by the lightning (the strike's patch flaring
// through the tile's own shapes: lightning.js#flashInfo — the gaps between the cells stay dark).
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

/** PURE: the FAR thunderheads' colours — { base, body, top }. They must stay clear of the sky's own value all the way up (a cell that
 *  crosses it — dark at its foot, bright at its anvil — falls apart into a mushroom): by day LIGHTER than the storm's grey (the sun on
 *  distant towers, the crowns + the anvil brightest), the flat base dark; at night a little lighter than the black sky above the city's
 *  glow, the base catching that glow — the lightning shows their whole shape. */
export function farColours(day, night) {
  const d = clamp01(day), n = clamp01(night);
  return {
    base: mixC(mixC([44, 40, 54], [104, 80, 116], n), [46, 49, 58], d),
    body: mixC(mixC([46, 44, 58], [84, 74, 112], n), [138, 143, 154], d),
    top: mixC(mixC([50, 48, 64], [60, 54, 86], n), [196, 200, 210], d),
  };
}

export function createStormDeck() {
  let tile = null, scratch = null, key = '', off = 0, lastT = null, dbg = { on: false, towers: 0, mb: 0, flashes: 0 };
  dbg.tileURL = () => (tile ? tile.toDataURL() : null);   // (look work: the baked deck alone)
  function bake(W, top, base, horizon, cols, dpr, day, night) {
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
    const B = cols.body.join(','), towers = [];
    const bandH = base - top, gap = horizon - base;
    // a soft curtain (a rain shaft): one small sprite — soft at both sides, fading downward — stretched + slanted where it falls
    const shaft = mk(48, 64), sq = safeCtx(shaft);
    { const hg = sq.createLinearGradient(0, 0, 48, 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.3, 'rgba(0,0,0,1)'); hg.addColorStop(0.7, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      sq.fillStyle = hg; sq.fillRect(0, 0, 48, 64); sq.globalCompositeOperation = 'destination-in';
      const vg = sq.createLinearGradient(0, 0, 0, 64); vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(0.35, 'rgba(0,0,0,0.6)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
      sq.fillStyle = vg; sq.fillRect(0, 0, 48, 64); }
    const tinted = (col) => { const t = mk(48, 64), tq = safeCtx(t); tq.drawImage(shaft, 0, 0); tq.globalCompositeOperation = 'source-in'; tq.fillStyle = `rgb(${col})`; tq.fillRect(0, 0, 48, 64); return t; };
    const curtain = (img, X, y0, w, h, slant, a) => {
      for (const ox of [-TW, 0, TW]) {
        if (X + ox + w + Math.abs(slant) < 0 || X + ox - w - Math.abs(slant) > TW) continue;
        x.save(); x.globalAlpha = a; x.transform(1, 0, slant / h, 1, X + ox - w / 2, y0); x.drawImage(img, 0, 0, w, h); x.restore();
      }
    };
    // ---- 1. THE FAR CELLS (the owner, Oct 31 8:12 pm: REAL CUMULONIMBUS — "almost looks like TORNADOES" before): each a whole
    // thunderhead behind the skyline — a FLAT, ragged base just above the low crowns, a broad stepped mass of billowing towers (the main
    // updraft tallest, lower flanking towers either side — broadest at the base: a column that widens upward reads as a funnel), the
    // overshooting dome, the ANVIL spreading downwind under the near deck with a strip of sky between. ONE silhouette per cell (its lumps
    // unioned on a scratch, then shaded by height) — never rows of balls.
    const cells = [{ u: 0.27, sc: 1 }, { u: 0.79, sc: 0.72 }];
    if (W > 600) cells.push({ u: 0.53, sc: 0.55 });
    const dk = clamp01(day);
    const fc = farColours(day, night), farBody = fc.body, farBase = fc.base, farTop = fc.top;
    for (const cell of cells) {
      const sc = cell.sc, cx = TW * (cell.u + (r() - 0.5) * 0.05), dir = r() < 0.7 ? 1 : -1;
      // (the WHOLE cell in view above the haze that eats the sky toward the horizon — its flat dark base clear of the towers: a cell whose foot
      //  fades into that haze shows only its anvil + upper trunk, and that reads as a FUNNEL. The farther one smaller + its base a little lower)
      const yb = base + gap * (0.5 + 0.08 * (1 - sc)), ya = base + gap * (0.16 + 0.16 * (1 - sc)), H = yb - ya;
      if (!(H > 20)) continue;
      const bw = Math.min(W * 0.4, H * 1.3) * sc + 10;
      const anL = bw * 0.5, anR = bw * 1.3, pad = bw * 0.35;
      const cw = Math.ceil(anL + anR + pad * 2), ch = Math.ceil(H + pad), lx = pad + (dir > 0 ? anL : anR), oy = ya - pad * 0.5;
      const cv = mk(cw * s, ch * s), q = safeCtx(cv);
      q.setTransform(s, 0, 0, s, 0, 0);
      const L = (px, py, rad, sy = 1, a = 1, solid = 0.62) => {   // one soft lump (unioned: solid core, soft edge)
        q.save(); q.translate(lx + dir * px, py - oy); q.scale(1, sy);
        const g = q.createRadialGradient(0, 0, 0, 0, 0, rad);
        g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(solid, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        q.fillStyle = g; q.beginPath(); q.arc(0, 0, rad, 0, Math.PI * 2); q.fill(); q.restore();
      };
      // the towers (px measured DOWNWIND from the cell's centre): [centre, half-width at the foot, top y (as a share of H from the base)]
      // (the classic profile: the tall main updraft upwind — a steep wall into the anvil, no overhang on that side — then the towers
      //  stepping DOWN under the anvil downwind, + a low feeder tower upwind: broadest at the base, never a stem under a cap)
      const tws = [[-0.1, 0.42, 0.95], [-0.52, 0.2, 0.36 + 0.1 * r()], [0.28, 0.3, 0.64 + 0.08 * r()], [0.6, 0.2, 0.4 + 0.08 * r()]];
      for (const [tc, hw, th] of tws) {
        const tTop = yb - H * th, c0 = tc * bw, w0 = hw * bw, nar = th > 0.9 ? 0.06 : 0.3;   // (the main tower stays broad to the anvil)
        // the trunk: filled from the base up, narrowing a little toward its crown
        for (let y = yb - w0 * 0.35; y > tTop + w0 * 0.5; y -= w0 * (0.3 + 0.3 * r())) {
          const u = (yb - y) / (yb - tTop), w = w0 * (1 - nar * u);
          L(c0 + (r() - 0.5) * w * 0.3, y, w * (0.95 + 0.15 * r()));
          // cauliflower flanks: smaller billows on both sides
          const fl = u < 0.3 ? 0 : 0.75;   // (fewer billows low down: the base stays smooth + flat)
          if (r() < fl) L(c0 - w * (0.78 + 0.22 * r()), y + (r() - 0.5) * w0 * 0.5, w0 * (0.24 + 0.2 * r()));
          if (r() < fl) L(c0 + w * (0.78 + 0.22 * r()), y + (r() - 0.5) * w0 * 0.5, w0 * (0.24 + 0.2 * r()));
        }
        // the crown: a cluster of rounded billows
        for (let k = 0; k < 5; k++) L(c0 + (r() - 0.5) * w0 * 1.2, tTop + w0 * (0.35 + 0.3 * r()), w0 * (0.32 + 0.2 * r()));
      }
      // THE ANVIL: a flat-topped plate from the main tower's crown, out downwind (+ a short way upwind); thick at the tower, thin at the
      // tips, its top a little domed over the updraft, its far end feathering out
      const n = 40;
      for (let i = 0; i <= n; i++) {
        // (upwind it ends ROUND over the main tower's crown — full thickness to its end; downwind it thins to a feathered tip)
        const v = i / n, px = -bw * 0.38 + (bw * 0.38 + anR) * v, dist = px < 0 ? 0 : px / anR, dd = Math.min(1, dist);
        const thk = H * (0.17 - 0.13 * dd) * (0.8 + 0.4 * r()), yTop = ya + H * (0.035 * dd * dd) + (r() - 0.5) * H * 0.012;
        L(px, yTop + thk * 0.5, thk * 1.1 + bw * 0.03, 0.5, 1 - 0.55 * Math.max(0, dist - 0.6) / 0.4, 0.5);
        // (where it leaves the tower its underside FLARES down into it — a smooth curve, never a T)
        if (px > 0 && dd < 0.4) { const fk = (1 - dd / 0.4) ** 2; L(px, yTop + thk + H * 0.07 * fk, H * 0.13 * fk + 2, 0.75, 1, 0.55); }
      }
      // THE FLAT BASE: everything below a ragged line just under yb cut away
      q.globalCompositeOperation = 'destination-out'; q.fillStyle = '#000';
      q.beginPath(); q.moveTo(0, ch + 10);
      for (let xx = 0; xx <= cw; xx += 4) q.lineTo(xx, yb - oy + Math.sin(xx * 0.23 + cx) * 0.8 + (r() - 0.5) * 1.4);
      q.lineTo(cw, ch + 10); q.closePath(); q.fill();
      // shaded by height: the base darkest, the body, the crowns + the anvil's top lighter (the sun on them by day; barely at night)
      q.globalCompositeOperation = 'source-in';
      const g = q.createLinearGradient(0, yb - oy, 0, ya - oy);
      g.addColorStop(0, `rgb(${farBase})`); g.addColorStop(0.09, `rgb(${farBody})`); g.addColorStop(0.6, `rgb(${mixC(farBody, farTop, 0.45)})`); g.addColorStop(1, `rgb(${farTop})`);
      q.fillStyle = g; q.fillRect(0, 0, cw, ch);
      // (the light from the sunny side — one broad soft lift on the upwind flank; the anvil's underside in its own shadow)
      q.globalCompositeOperation = 'source-atop';
      const sx = lx - dir * bw * 0.3, sy0 = ya - oy + H * 0.35, sg = q.createRadialGradient(sx, sy0, 0, sx, sy0, bw * 0.6);
      sg.addColorStop(0, `rgba(${farTop},${0.12 + 0.18 * dk})`); sg.addColorStop(1, `rgba(${farTop},0)`);
      q.fillStyle = sg; q.fillRect(0, 0, cw, ch);
      const ug = q.createLinearGradient(0, ya - oy + H * 0.12, 0, ya - oy + H * 0.3);
      ug.addColorStop(0, 'rgba(0,0,0,0)'); ug.addColorStop(0.5, `rgba(${farBase},0.35)`); ug.addColorStop(1, 'rgba(0,0,0,0)');
      q.save(); q.beginPath(); q.rect(dir > 0 ? lx + bw * 0.45 : 0, 0, dir > 0 ? cw : lx - bw * 0.45, ch); q.clip(); q.fillStyle = ug; q.fillRect(0, 0, cw, ch); q.restore();
      // its RAIN SHAFT first (a soft curtain under the base, down behind the skyline), then the cell
      const ft = tinted(farBase.join(',')); curtain(ft, cx + dir * bw * 0.05, yb - 2, bw * 0.95, horizon - yb + 14, dir * gap * 0.05, 0.5 * sc); ft.width = ft.height = 0;
      x.globalAlpha = 0.72 + 0.26 * sc;
      for (const ox of [-TW, 0, TW]) { const X = cx + ox; if (X + cw < 0 || X - cw > TW) continue; x.drawImage(cv, X - lx, oy, cw, ch); }
      x.globalAlpha = 1;
      cv.width = cv.height = 0;
      towers.push(cx);
    }
    // ---- 2. THE NEAR DECK (overhead): a dark band along the top with a broad, FLAT, ragged underside at `base` — well above the skyline
    // (no pouches, no lobes hanging toward the towers); faint roll texture inside; its underside catching the city's glow at night.
    const und = mixC(cols.body, cols.under, 0.7);
    const g = x.createLinearGradient(0, 0, 0, base);
    g.addColorStop(0, `rgba(${B},0.98)`); g.addColorStop(0.6, `rgba(${B},0.96)`); g.addColorStop(1, `rgba(${und},0.95)`);
    x.fillStyle = g; x.fillRect(0, 0, TW, base - bandH * 0.05);
    // the ragged underside: flattened small lumps along one line (the edge wanders by a few pt, never a lobe)
    for (let xx = -10; xx < TW + 10; xx += bandH * 0.06 + r() * bandH * 0.05) {
      const rad = bandH * (0.05 + 0.06 * r()), cy = base - bandH * 0.05 + (r() - 0.6) * bandH * 0.035;
      x.save(); x.translate(xx, cy); x.scale(1, 0.5);
      const lg = x.createRadialGradient(0, 0, 0, 0, 0, rad);
      lg.addColorStop(0, `rgba(${und},0.95)`); lg.addColorStop(0.65, `rgba(${und},0.95)`); lg.addColorStop(1, `rgba(${und},0)`);
      x.fillStyle = lg; x.beginPath(); x.arc(0, 0, rad, 0, Math.PI * 2); x.fill(); x.restore();
    }
    // the rolls: long soft bands of a hair lighter / darker inside the deck
    x.save(); x.beginPath(); x.rect(0, 0, TW, base - bandH * 0.08); x.clip();
    for (let i = 0; i < 26; i++) {
      const cx = r() * TW, cy = top + r() * (bandH * 0.85), rx = W * (0.12 + 0.2 * r()), ry = bandH * (0.05 + 0.07 * r()), lite = r() < 0.5;
      x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
      const rg = x.createRadialGradient(0, 0, 0, 0, 0, rx);
      const col = lite ? mixC(cols.body, cols.top, 0.18).join(',') : mixC(cols.body, [6, 6, 10], 0.35).join(',');
      rg.addColorStop(0, `rgba(${col},${lite ? 0.22 : 0.3})`); rg.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = rg; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore();
    }
    x.restore();
    // a few broad, faint rain curtains falling from the base (soft-edged — never a narrow dark column)
    const uc = tinted(und.join(','));
    for (let i = 0; i < 3; i++) curtain(uc, r() * TW, base - 3, W * (0.3 + 0.2 * r()), gap * 0.75, gap * 0.08, 0.22);
    shaft.width = shaft.height = uc.width = uc.height = 0;
    dbg.towers = towers.length; dbg.mb = +((tile.width * tile.height * 4) / 1e6).toFixed(2); dbg.geo = { W: Math.round(W), top: Math.round(top), base: Math.round(base), horizon: Math.round(horizon) };
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
      if (k2 !== key) { key = k2; dims = bake(s.W, s.top, s.base, s.horizon, cols, s.dpr, s.day, s.night); }
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
