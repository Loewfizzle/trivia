// LIVING CITY — THE SUN (docs/title.md). The real sun (core/sky.js: sunPosition, sunArc, solarEclipse), framed like the moon.
//   draw(c, s)      in the sky layer (after the stars and the moon, before the planes and the clouds): the disc and its bloom;
//                   a solar eclipse (the moon's disc over it; the corona and a darkened sky at totality)
//   through(c, s)   after the clouds: the sun glowing through thin cloud, a brighter patch of sky under overcast
//   halo(c, s)      after the far rows: low sun light spilling over the rooftops it sits behind
//   rays(c, s)      after the far rows: barely-there beams through the haze at golden hour (clear or partly cloudy only)
//   dim(c, s)       over everything: the light of a total eclipse
// The path (sunPlace, PURE): facing south the sun rises on the LEFT at the real sunrise, arcs over, and sets on the RIGHT at
// the real sunset (mirrored south of the equator); its height is its real elevation (higher in summer), mapped into the open
// sky so it never crosses the sign or the tagline. A wide screen: the full arc, lifted over the sign where it would cross it.
// A phone (portrait / narrower than 760 px): up the left edge beside the sign, across the strip above it, down the right edge
// (passing behind the two round corner buttons there, glowing through their frosted glass), setting behind the skyline. Colour and size by elevation: deep red-orange, larger and a little squashed at the horizon → warm white at midday.
// Every disc and glow is a cached sprite; a frame is a handful of drawImage calls. Preview: &force=eclipse-sun, &force=totality.

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** PURE: the sun's colour at an elevation (degrees): red-orange at the horizon → orange → gold → a soft warm white. */
export function sunColor(el) {
  const stops = [[-2, [255, 62, 28]], [1, [255, 84, 36]], [4, [255, 128, 54]], [9, [255, 176, 86]], [16, [255, 214, 140]], [30, [255, 240, 214]], [50, [255, 248, 232]]];
  if (el <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (el <= stops[i][0]) { const [e0, c0] = stops[i - 1], [e1, c1] = stops[i]; const t = (el - e0) / (e1 - e0); return c0.map((v, j) => Math.round(lerp(v, c1[j], t))); }
  return stops[stops.length - 1][1];
}
/** PURE: the disc's radius multiplier and vertical squash at an elevation (larger and flattened at the horizon). */
export function sunShape(el) { return { size: lerp(1.38, 1, smooth(0, 14, el)), squash: lerp(0.86, 1, smooth(-1, 7, el)) }; }

/** PURE: where the sun is drawn. o: { W, H, HZ, u (0 sunrise … 1 sunset), el, south, r, block: {x,y,w,h} (the sign + tagline),
 *  buttons: {x,y,w,h} (the corner buttons), safeTop, e1: { el, ua, ub } (phones: the morning / afternoon u where the sun is
 *  E1° up — where it leaves / rejoins the screen edges) }. Returns { x, y }. */
export function sunPlace(o) {
  const { W, H, HZ, el, r } = o;
  const u = o.south ? 1 - o.u : o.u;                      // facing north south of the equator: it rises on the right
  const block = o.block || { x: W * 0.1, y: HZ * 0.2, w: W * 0.8, h: HZ * 0.3 };
  const top = Math.max(26, (o.safeTop || 0) + 14) + r;
  const phone = W < 760 || H > W;
  if (phone) {
    const stripBot = Math.max(top + 4, block.y - r - 8);
    const horizon = Math.min(HZ * 0.72, block.y + block.h + r * 2.2);
    const edgeL = r * 0.45, edgeR = W - r * 0.45;
    const e1 = o.e1 || { el: 12, ua: 0.15, ub: 0.85 };
    const morning = o.u < 0.5;
    if (el < e1.el) {
      // up (or down) the screen's edge beside the sign
      const k = smooth(-2.5, e1.el, el);
      const left = o.south ? !morning : morning;
      const y = lerp(horizon + r, stripBot, k);
      // beside the sign it hugs the edge; lower than the tagline nothing is in the way: the whole disc comes on screen
      const below = block.y + block.h;
      const inset = lerp(lerp(r * 0.45, r * 1.25, smooth(below - r * 0.2, below + r * 1.2, y)), W * 0.2, smooth(below + r * 1.2, horizon + r, y));
      return { x: left ? inset : W - inset, y };
    }
    const p = clamp01((o.u - e1.ua) / Math.max(1e-6, e1.ub - e1.ua));
    const pp = o.south ? 1 - p : p;
    return { x: lerp(edgeL, edgeR, pp), y: lerp(stripBot, top, smooth(e1.el, 72, el)) };
  }
  // a wide screen: the full arc, its height the real elevation, lifted over the sign where it would cross it
  // it clears the towers' tops (≈ HZ·0.42) within its first ~10°, then climbs the open sky by its real elevation
  const horizon = HZ * 0.82, skyline = HZ * 0.42;
  const x = lerp(W * 0.06, W * 0.94, u);
  const natural = el < 10 ? lerp(horizon, skyline, smooth(-2, 10, el) * 0.6 + clamp01((el + 2) / 12) * 0.4) : lerp(skyline, top, clamp01((el - 10) / 62));
  const pad = r + 26, ramp = Math.max(r * 3, W * 0.13);   // a gentle climb over the sign (a low winter sun has far to rise)
  const bx0 = block.x - pad, bx1 = block.x + block.w + pad;
  const over = Math.min(smooth(bx0 - ramp, bx0, x), 1 - smooth(bx1, bx1 + ramp, x));        // 1 over the sign, 0 well beside it
  const ceil = lerp(horizon + r * 3, block.y - pad, over);
  let y = Math.max(top, Math.min(natural, ceil));
  // the corner buttons (top right on a desktop): pass under them
  const b = o.buttons;
  if (b && x > b.x - r - 24 && x < b.x + b.w + r + 24 && y < b.y + b.h + r + 24) y = b.y + b.h + r + 24;
  return { x, y };
}

export function createSun() {
  let W = 1, H = 1, HZ = 1;
  let pos = null, discCv = null, coronaCv = null, rayCv = null;
  const discs = new Map(), glows = new Map();
  const qc = col => col.map(v => Math.round(v / 6) * 6);
  // the disc: a soft limb, a little brighter at the centre, an anti-aliased edge (per colour, cached)
  const disc = col => {
    const k = qc(col).join(',');
    let cv = discs.get(k);
    if (!cv) {
      cv = mk(128, 128); const x = cv.getContext('2d');
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 60);
      const hi = col.map(v => Math.min(255, v + (255 - v) * 0.55));
      g.addColorStop(0, `rgba(${hi.map(Math.round)},1)`); g.addColorStop(0.72, `rgba(${k},1)`); g.addColorStop(0.95, `rgba(${col.map(v => Math.round(v * 0.93))},1)`); g.addColorStop(1, `rgba(${k},0)`);
      x.fillStyle = g; x.beginPath(); x.arc(64, 64, 60, 0, TAU); x.fill();
      if (discs.size > 40) discs.clear();
      discs.set(k, cv);
    }
    return cv;
  };
  // the bloom: a smooth falloff (no ring, no rays)
  const glow = (col, falloff = 1.6) => {
    const k = `${qc(col).join(',')}|${falloff}`;
    let cv = glows.get(k);
    if (!cv) {
      cv = mk(128, 128); const x = cv.getContext('2d');
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      for (let i = 0; i <= 8; i++) { const t = i / 8; g.addColorStop(t, `rgba(${qc(col).join(',')},${Math.pow(1 - t, falloff) * (i === 8 ? 0 : 1)})`); }
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      if (glows.size > 60) glows.clear();
      glows.set(k, cv);
    }
    return cv;
  };
  // the corona at totality: soft pearly streamers around a dark disc (baked once)
  const corona = () => coronaCv || (coronaCv = (() => {
    const cv = mk(320, 320), x = cv.getContext('2d');
    x.translate(160, 160);
    let a = 0x3c6ef3; const R = () => { a = (a * 1103515245 + 12345) >>> 0; return a / 4294967296; };
    // fine streamers, longer along the sun's equator (left / right), soft and slightly curved
    x.save(); x.filter = 'blur(2.2px)'; x.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const eq = R() < 0.65, ang = eq ? (R() < 0.5 ? 0 : Math.PI) + (R() - 0.5) * 1.1 : R() * Math.PI * 2;
      const len = (eq ? 70 : 35) + R() * (eq ? 85 : 45), bend = (R() - 0.5) * 0.35;
      const x0 = Math.cos(ang) * 30, y0 = Math.sin(ang) * 30, x1 = Math.cos(ang + bend) * (30 + len), y1 = Math.sin(ang + bend) * (30 + len);
      const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(250,250,255,0.32)'); g.addColorStop(1, 'rgba(220,228,255,0)');
      x.strokeStyle = g; x.lineWidth = 1 + R() * 2.4;
      x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(Math.cos(ang) * (30 + len * 0.5), Math.sin(ang) * (30 + len * 0.5), x1, y1); x.stroke();
    }
    x.restore();
    // the pearly inner corona
    const g = x.createRadialGradient(0, 0, 26, 0, 0, 120);
    g.addColorStop(0, 'rgba(255,253,248,0.95)'); g.addColorStop(0.12, 'rgba(244,246,255,0.6)'); g.addColorStop(0.35, 'rgba(214,224,255,0.16)'); g.addColorStop(1, 'rgba(200,210,255,0)');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(-160, -160, 320, 320);
    return cv;
  })());
  // a light ray: a long, very soft wedge (baked once)
  const ray = () => rayCv || (rayCv = (() => {
    const cv = mk(64, 512), x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(255,214,160,0.9)'); g.addColorStop(0.5, 'rgba(255,190,130,0.35)'); g.addColorStop(1, 'rgba(255,170,110,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(30, 0); x.lineTo(34, 0); x.lineTo(64, 512); x.lineTo(0, 512); x.closePath(); x.fill();
    const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 512);
    return cv;
  })());

  // ---- a partial eclipse, baked per shape (the moon moves ~a sun radius in half an hour; the preview, a little faster):
  //   cres  the crescent: a hot white-gold disc (a warmer limb) with the moon taken out, crisp, anti-aliased
  //   halo  its glow: the crescent's own shape blurred (shadowBlur, baked) + the glare around the sun, with the moon's disc
  //         taken out of both — against the glare the moon shows as a faint dark silhouette, as it does in the sky
  // 1 sun radius = R px in the bakes; the halo is 4 radii across
  const R = 44, CS = 112, HS = 4 * R + 16;
  let art = null, artKey = '';
  function litOf(ec, south) {
    // the lit fraction and the lit part's centre (a 16 × 16 sample of the disc: tiny)
    const mx = (south ? -1 : 1) * (ec.dx || 0), my = -(ec.dy || 0), k = ec.k || 1.02;
    let n = 0, lit = 0, sx = 0, sy = 0;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      const px = (i + 0.5) / 8 - 1, py = (j + 0.5) / 8 - 1;
      if (px * px + py * py > 1) continue;
      n++;
      if ((px - mx) ** 2 + (py - my) ** 2 > k * k) { lit++; sx += px; sy += py; }
    }
    return { lit: lit / n, obsc: 1 - lit / n, cx: lit ? sx / lit : 0, cy: lit ? sy / lit : 0, mx, my, k };
  }
  function eclipseArt(e) {
    const key = e.mx.toFixed(3) + '|' + e.my.toFixed(3) + '|' + e.k.toFixed(3);
    if (art && key === artKey) return art;
    artKey = key;
    if (!art) art = { cres: mk(CS, CS), halo: mk(HS, HS), tmp: mk(HS, HS) };
    const cc = CS / 2, hc = HS / 2;
    // the crescent
    const x = art.cres.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, CS, CS);
    const g = x.createRadialGradient(cc, cc, 0, cc, cc, R);
    g.addColorStop(0, 'rgb(255,255,252)'); g.addColorStop(0.7, 'rgb(255,252,242)'); g.addColorStop(0.92, 'rgb(255,240,214)'); g.addColorStop(1, 'rgb(255,222,184)');
    x.fillStyle = g; x.beginPath(); x.arc(cc, cc, R, 0, TAU); x.fill();
    x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(cc + e.mx * R, cc + e.my * R, e.k * R, 0, TAU); x.fill();
    x.globalCompositeOperation = 'source-over';
    // its glow: the crescent's shape, blurred (drawn far off the canvas so only its shadow lands)
    const t = art.tmp.getContext('2d');
    t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, HS, HS);
    t.shadowOffsetX = 4000; t.shadowColor = 'rgba(255,238,222,1)';
    t.shadowBlur = 14; t.drawImage(art.cres, hc - cc - 4000, hc - cc);
    t.shadowBlur = 34; t.drawImage(art.cres, hc - cc - 4000, hc - cc);
    t.shadowBlur = 0; t.shadowOffsetX = 0;
    const h = art.halo.getContext('2d');
    h.setTransform(1, 0, 0, 1, 0, 0); h.globalCompositeOperation = 'source-over'; h.clearRect(0, 0, HS, HS);
    // the glare around the sun: weaker as less of it is left
    const e2 = Math.pow(e.lit, 0.6);
    const gl = h.createRadialGradient(hc, hc, R * 0.8, hc, hc, hc);
    gl.addColorStop(0, 'rgba(255,240,214,' + (0.55 * e2) + ')'); gl.addColorStop(0.35, 'rgba(255,232,200,' + (0.2 * e2) + ')'); gl.addColorStop(1, 'rgba(255,228,190,0)');
    h.fillStyle = gl; h.fillRect(0, 0, HS, HS);
    h.drawImage(art.tmp, 0, 0);
    // the moon blocks the glare behind it too: its silhouette, softly edged
    h.globalCompositeOperation = 'destination-out';
    const mxp = hc + e.mx * R, myp = hc + e.my * R;
    const mg = h.createRadialGradient(mxp, myp, e.k * R * 0.8, mxp, myp, e.k * R * 1.03);
    mg.addColorStop(0, 'rgba(0,0,0,0.78)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    h.fillStyle = mg; h.beginPath(); h.arc(mxp, myp, e.k * R * 1.05, 0, TAU); h.fill();
    h.globalCompositeOperation = 'source-over';
    return art;
  }

  // what the frame knows about the sun: { x, y, r, rx, ry, col, el, vis (0..1 the disc), glow (0..1), eclipse }
  let now = null;
  function state(s) {
    const L = s.L;
    if (L.alwaysNight || !L.sunArc || L.sun.el < -3.5) return null;
    const el = L.sun.el, sa = L.sunArc;
    const phone = W < 760 || H > W;
    const base = phone ? 16.5 : 26;
    const sh = sunShape(el), r = base * sh.size;
    const lr = s.signRect, cl = (s.clear || []).find(z => z.w > W * 0.5 && z.y < HZ);
    const block = lr ? { x: lr.x - 6, y: lr.y - 6, w: lr.w + 12, h: cl ? cl.y + cl.h - 34 + 6 - (lr.y - 6) : lr.h + 60 } : null;
    const buttons = (s.clear || []).filter(z => z.w < 70 && z.y < HZ * 0.4).reduce((a, z) => (a ? { x: Math.min(a.x, z.x), y: Math.min(a.y, z.y), w: Math.max(a.x + a.w, z.x + z.w) - Math.min(a.x, z.x), h: Math.max(a.y + a.h, z.y + z.h) - Math.min(a.y, z.y) } : { ...z }), null);
    const p = sunPlace({ W, H, HZ, u: sa.u, el, south: L.south, r: base, block, buttons, safeTop: s.safeTop, e1: sa.e1 });
    // never a jump: it eases toward its place (and settles at once on a new layout)
    if (!pos || Math.hypot(pos.x - p.x, pos.y - p.y) > W * 0.5) pos = { ...p }; else { pos.x += (p.x - pos.x) * 0.06; pos.y += (p.y - pos.y) * 0.06; }
    // the weather: thick cloud hides the disc (a brighter patch stays), rain and heavy fog hide it, light fog leaves a glow
    const over = smooth(0.62, 0.96, L.cloud || 0);
    const wet = (L.rain || 0) > 0.1 || (L.fog || 0) > 0.6;
    const vis = wet ? 0 : (1 - over * 0.97) * (1 - smooth(0.15, 0.55, L.fog || 0)) * smooth(-3.5, -0.5, el);
    const glowK = wet ? ((L.fog || 0) > 0.6 && !L.rain ? 0.15 : 0) : (L.fog || 0) > 0.15 ? 0.6 : 1;
    let ec = L.solar;
    if (s.force.has('totality')) ec = { obsc: 1, mag: 1, total: true, dx: 0, dy: 0, k: 1.04 };
    else if (s.force.has('eclipse-sun')) {
      // the moon glides in at a slant, takes ~85 % at the deepest (12 s in), and slides off; the loop is 100 s
      const along = -2.15 + 4.3 * (((s.t + 38) % 100) / 100), th = -0.38, off = 0.3;
      ec = { dx: along * Math.cos(th) - off * Math.sin(th), dy: along * Math.sin(th) + off * Math.cos(th), k: 1.03, total: false };
    }
    if (ec && !ec.total) ec = { ...ec, ...litOf(ec, s.L.south) };
    return { x: pos.x, y: pos.y, r, rx: r, ry: r * sh.squash, col: sunColor(el), el, vis, glow: glowK, over, eclipse: ec };
  }

  return {
    resize(w, h, hz) { W = w; H = h; HZ = hz; pos = null; },
    draw(c, s) {
      now = state(s);
      s.sunAt = now && now.vis > 0.05 ? { x: now.x, y: now.y, r: now.r } : null;
      if (!now) return;
      const { x, y, rx, ry, col, el, vis, glow: gk, eclipse: ec } = now;
      const day = s.L.w.day, low = 1 - smooth(4, 24, el);
      // a total eclipse: the sky darkens with the coverage (the corona is the brightest thing up there)
      const tot = ec ? (ec.total ? 1 : 0.4 * smooth(0.975, 1, ec.obsc != null ? ec.obsc : 0)) : 0;
      if (tot > 0.01) { c.fillStyle = `rgba(6,8,26,${0.78 * tot})`; c.fillRect(0, 0, W, HZ); }
      const part = !!(ec && !ec.total);
      const ecDim = part ? 0.25 + 0.75 * Math.sqrt(ec.lit) : 1;              // the glare goes as the sliver thins
      c.globalCompositeOperation = 'lighter';
      // the bloom: a wide warm wash low in the sky, gentle at midday (the haze, not a spotlight), then a tighter glow
      const wide = (0.2 + 0.25 * low) * (0.55 + 0.45 * (1 - day)) * gk * (1 - tot) * ecDim;
      const bx = part ? x + ec.cx * rx * 0.6 : x, by = part ? y + ec.cy * ry * 0.6 : y;      // a partial's light comes from the sliver
      if (wide > 0.01) { c.globalAlpha = wide * (0.4 + 0.6 * vis); c.drawImage(glow(col, 2.2), bx - rx * 11, by - rx * 8, rx * 22, rx * 16); }
      const mid = (0.28 + 0.2 * low) * gk * (1 - tot) * ecDim;
      if (mid > 0.01 && vis > 0.02 && !part) { c.globalAlpha = mid * vis; c.drawImage(glow(col.map(v => Math.min(255, v + 20)), 1.4), x - rx * 3.4, y - ry * 3.4, rx * 6.8, ry * 6.8); }
      c.globalCompositeOperation = 'source-over';
      if (vis < 0.02 && tot < 0.01) { c.globalAlpha = 1; return; }
      // the disc (or, in an eclipse, the disc with the moon across it)
      if (ec && ec.total) {
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * tot; c.drawImage(corona(), x - rx * 5.3, y - rx * 5.3, rx * 10.6, rx * 10.6); c.globalCompositeOperation = 'source-over';
        c.globalAlpha = 1; c.fillStyle = '#05060c'; c.beginPath(); c.ellipse(x, y, rx * 1.02, ry * 1.02, 0, 0, TAU); c.fill();
      } else if (part) {
        // a partial: the glare and the crescent's glow (the moon's silhouette against it), the crisp hot crescent, its white heat
        const A = eclipseArt(ec), sx = rx / R, sy = ry / R;
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.9 * vis * gk; c.drawImage(A.halo, x - (HS / 2) * sx, y - (HS / 2) * sy, HS * sx, HS * sy);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = vis; c.drawImage(A.cres, x - (CS / 2) * sx, y - (CS / 2) * sy, CS * sx, CS * sy);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.55 * vis; c.drawImage(A.cres, x - (CS / 2) * sx, y - (CS / 2) * sy, CS * sx, CS * sy);
        c.globalCompositeOperation = 'source-over';
      } else {
        c.globalAlpha = vis; c.drawImage(disc(col), x - rx * 1.07, y - ry * 1.07, rx * 2.14, ry * 2.14);
      }
      c.globalAlpha = 1;
    },
    /** after the clouds: the sun glowing through thin cloud; a brighter patch of sky under overcast */
    through(c, s, coverAt) {
      if (!now || now.glow <= 0) return;
      const cover = Math.max(coverAt ? coverAt(now.x, now.y) : 0, now.over * 0.8);
      if (cover < 0.05) return;
      const { x, y, rx, col } = now;
      c.globalCompositeOperation = 'lighter';
      // a diffused disc and the bright edges of the cloud around it
      c.globalAlpha = 0.5 * cover * now.glow * (1 - now.over * 0.4); c.drawImage(glow(col.map(v => Math.min(255, v + 30)), 1.3), x - rx * 2.6, y - rx * 2.6, rx * 5.2, rx * 5.2);
      c.globalAlpha = 0.22 * cover * now.glow; c.drawImage(glow(col, 2), x - rx * 7, y - rx * 5, rx * 14, rx * 10);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    /** after the far rows: low sun spilling over the rooftops it's behind */
    halo(c, s) {
      if (!now || now.el > 9 || now.vis < 0.05) return;
      const k = (1 - smooth(1, 9, now.el)) * now.vis;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.32 * k; c.drawImage(glow(now.col, 1.8), now.x - now.rx * 6, now.y - now.rx * 4, now.rx * 12, now.rx * 8);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    /** after the far rows: barely-there beams through the haze at golden hour, clear or partly cloudy only */
    rays(c, s) {
      if (!now || !s.motion || now.vis < 0.3 || now.el > 12 || now.el < -1) return;
      const L = s.L, g = L.w.golden + L.w.dawn;
      if (g < 0.3 || (L.cloud || 0) > 0.55 || L.rain || (L.fog || 0) > 0.2) return;
      const k = smooth(0.3, 0.8, g) * now.vis * (1 - smooth(6, 12, now.el));
      const len = HZ * 0.9, wd = now.rx * 3.4;
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const ang = Math.PI / 2 + (i - 2.5) * 0.32 + Math.sin(s.t * 0.05 + i * 1.7) * 0.03;
        c.save(); c.translate(now.x, now.y); c.rotate(ang - Math.PI / 2 + (now.x > W / 2 ? 0.5 : -0.5));
        c.globalAlpha = 0.045 * k * (0.6 + 0.4 * Math.sin(i * 2.3 + s.t * 0.11));
        c.drawImage(ray(), -wd / 2, 0, wd, len);
        c.restore();
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
    /** over everything: the light of a total eclipse */
    dim(c) {
      if (!now || !now.eclipse) return;
      const ec = now.eclipse;
      // totality: night falls; a deep partial: the light goes flat and a little dim, a touch steely (past ~70 %)
      if (ec.total) { c.fillStyle = 'rgba(4,5,18,0.4)'; c.fillRect(0, 0, W, H); return; }
      const k = smooth(0.68, 1, ec.obsc || 0) * now.vis;
      if (k < 0.01) return;
      c.fillStyle = 'rgba(14,20,44,' + (0.3 * k) + ')'; c.fillRect(0, 0, W, H);
    },
    debug: () => (now ? { x: Math.round(now.x), y: Math.round(now.y), r: +now.r.toFixed(1), el: +now.el.toFixed(1), vis: +now.vis.toFixed(2), col: now.col, eclipse: now.eclipse ? { total: !!now.eclipse.total, obsc: now.eclipse.obsc } : null } : null),
    destroy() { for (const cv of [discCv, coronaCv, rayCv, art && art.cres, art && art.halo, art && art.tmp, ...discs.values(), ...glows.values()]) if (cv) cv.width = 0; },
  };
}
