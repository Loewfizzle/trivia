// CITY 2.0 — PART 9a: THE LIGHTNING (only in a real thunderstorm — core/harbor-weather.js's STORM — or a preview).
// A strike lights the cloud deck FROM INSIDE (a soft glow somewhere far over the harbor, a flicker or two), now and then with a
// BRANCHING BOLT from the cloud base down behind the far skyline (the city stands in front of it: drawn in the sky layer). The thunder
// follows after the time sound takes from that distance (onStrike → the title plays it).
// SAFETY (photosensitive viewers): never a full-screen white flash — the light stays in the SKY (the city gets only a faint lift), its
// brightness capped (CAP); at most 2 flickers in a strike, inside 0.6 s (WCAG: never more than 3 flashes in any second); never two strikes
// within MIN_GAP s. REDUCED MOTION: no flash, no bolt — the storm sky only darkens (strikes still rumble).
export const LIGHTNING = Object.freeze({ CAP: 0.42, CITY: 0.1, MIN_GAP: 4.5, GAP: [6, 22], BOLT: 0.38, FLICKERS: 2, WINDOW: 0.6 });
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** PURE: one strike's flickers ([t0, len, k] from the strike's start, s) — 1 or 2, inside LIGHTNING.WINDOW, each ≤ CAP */
export function strikeFlickers(r) {
  const n = r() < 0.55 ? 2 : 1, out = [[0, 0.07 + r() * 0.05, LIGHTNING.CAP * (0.75 + 0.25 * r())]];
  if (n === 2) { const t1 = 0.18 + r() * 0.22; out.push([t1, 0.06 + r() * 0.06, LIGHTNING.CAP * (0.5 + 0.4 * r())]); }
  return out;
}
/** PURE: the brightness of a strike's flickers at e s after it began (a quick attack, an eased decay) */
export function flickerAt(fl, e) {
  let k = 0;
  for (const [t0, len, a] of fl) { const u = e - t0; if (u < 0 || u > len + 0.25) continue; const v = u < 0.015 ? u / 0.015 : u < len ? 1 : Math.exp(-(u - len) / 0.07); k = Math.max(k, a * v); }
  return Math.min(LIGHTNING.CAP, k);
}
/** PURE: the delay of the thunder from a strike d km away (sound ~0.343 km/s), the gap the city keeps (3–16 s) */
export const thunderDelay = km => Math.max(3, Math.min(16, km / 0.343));

function bolt(r, x0, y0, x1, y1) {
  // the main channel by midpoint displacement, then 1–3 branches off it heading down + out (thinner, fainter)
  let pts = [[x0, y0], [x1, y1]];
  for (let it = 0; it < 6; it++) {
    const nx = [];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], d = Math.hypot(bx - ax, by - ay); nx.push(pts[i], [(ax + bx) / 2 + (r() - 0.5) * d * 0.42, (ay + by) / 2 + (r() - 0.5) * d * 0.12]); }
    nx.push(pts[pts.length - 1]); pts = nx;
  }
  const out = [{ pts, w: 1, a: 1 }], nb = 1 + Math.floor(r() * 3);
  for (let b = 0; b < nb; b++) {
    const i = 6 + Math.floor(r() * (pts.length * 0.6)), [sx, sy] = pts[Math.min(pts.length - 2, i)], len = (y1 - y0) * (0.18 + r() * 0.3), dir = r() < 0.5 ? -1 : 1;
    let br = [[sx, sy], [sx + dir * len * (0.4 + r() * 0.5), sy + len]];
    for (let it = 0; it < 4; it++) { const nx = []; for (let k = 0; k < br.length - 1; k++) { const [ax, ay] = br[k], [bx, by] = br[k + 1], d = Math.hypot(bx - ax, by - ay); nx.push(br[k], [(ax + bx) / 2 + (r() - 0.5) * d * 0.4, (ay + by) / 2 + (r() - 0.5) * d * 0.15]); } nx.push(br[br.length - 1]); br = nx; }
    out.push({ pts: br, w: 0.55, a: 0.55 });
  }
  return out;
}

export function createLightning({ onStrike = null } = {}) {
  let W = 1, HZ = 1, cur = null, next = 3, t0 = null, flash = 0, n = 0, lastAt = -1e9;
  const r = Math.random;
  function strike(t, s, force = false) {
    if (!force && t - lastAt < LIGHTNING.MIN_GAP) return;
    lastAt = t; n++;
    const x = W * (0.12 + 0.76 * r()), top = s.base != null ? s.base : HZ * 0.2, km = 1.2 + r() * 4.2;
    const withBolt = r() < LIGHTNING.BOLT;
    cur = { at: t, x, y: top + (HZ - top) * (0.05 + 0.12 * r()), rad: W * (0.32 + 0.22 * r()), fl: strikeFlickers(r), km,
      bolt: withBolt ? bolt(r, x, top + 6, x + (r() - 0.5) * W * 0.25, s.horizon != null ? s.horizon : HZ * 0.92) : null };
    if (onStrike) onStrike({ near: km < 2, km: +km.toFixed(1), delay: thunderDelay(km), level: 0.55 + 0.45 * (1 - (km - 1.2) / 4.2), bolt: withBolt });
  }
  return {
    resize(w, h, hz) { W = w; HZ = hz; },
    /** s: { on (a storm), t (s), motion, base (the cloud base y), horizon (the far skyline's foot y), force ('lightning' preview) } */
    tick(s) {
      if (t0 == null) t0 = s.t;
      if (!s.on) { flash = 0; if (cur && s.t - cur.at > 1) cur = null; return; }
      if (s.t >= next) { strike(s.t, s); next = s.t + (s.force ? LIGHTNING.MIN_GAP + r() * 2.5 : LIGHTNING.GAP[0] + r() * (LIGHTNING.GAP[1] - LIGHTNING.GAP[0])); }
      flash = cur && s.motion ? flickerAt(cur.fl, s.t - cur.at) : 0;
      if (cur && s.t - cur.at > 1.2) cur = null;
    },
    /** 0..CAP — the sky's light now (the drops + the clouds' undersides read it) */
    flash: () => flash,
    /** in the sky layer, after the clouds: the glow inside the deck + the bolt behind the skyline + a faint lift of the low sky */
    draw(c, s) {
      if (!cur || flash <= 0.005) return;
      const k = flash / LIGHTNING.CAP;
      c.save(); c.globalCompositeOperation = 'lighter';
      // the deck lit from inside, round the strike (cool white-violet), + the whole sky band a little
      const g = c.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, cur.rad);
      g.addColorStop(0, `rgba(214,220,255,${(0.55 * flash).toFixed(3)})`); g.addColorStop(0.45, `rgba(170,176,240,${(0.22 * flash).toFixed(3)})`); g.addColorStop(1, 'rgba(150,150,230,0)');
      c.fillStyle = g; c.fillRect(cur.x - cur.rad, cur.y - cur.rad, cur.rad * 2, cur.rad * 2);
      c.fillStyle = `rgba(160,170,230,${(0.16 * flash).toFixed(3)})`; c.fillRect(0, 0, W, HZ);
      // the bolt: a violet glow + a white-hot core (its branches fainter), behind the city
      if (cur.bolt) for (const br of cur.bolt) {
        const P = br.pts;
        for (const [lw, col, a] of [[5 * br.w, '180,170,255', 0.22], [2.2 * br.w, '220,220,255', 0.5], [0.9 * br.w + 0.3, '255,255,255', 0.95]]) {
          c.strokeStyle = `rgba(${col},${(a * br.a * k).toFixed(3)})`; c.lineWidth = lw; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); c.stroke();
        }
      }
      c.restore();
    },
    /** over the city: the faint lift a strike gives everything (capped: LIGHTNING.CITY — never a white screen) */
    city(c, s) {
      if (flash <= 0.005) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(150,160,220,${(LIGHTNING.CITY * flash / LIGHTNING.CAP).toFixed(3)})`; c.fillRect(0, s.y0 || 0, W, (s.y1 || 1e4) - (s.y0 || 0)); c.restore();
    },
    debug: () => ({ strikes: n, flash: +flash.toFixed(3), bolt: !!(cur && cur.bolt), next: +next.toFixed(1) }),
  };
}
