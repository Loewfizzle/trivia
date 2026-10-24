// LIVING CITY — RAINBOWS, PURE (no DOM; docs/title.md). After REAL rain only: a daytime rainbow with the sun out, a moonbow
// under a bright moon, a neon rainbow on PARTY NIGHTS (instead of the moonbow). district/rainbow.js draws them.
//   wetAt          when it last really rained (core/weather.js#wetAtOf: Open-Meteo's past quarter hours via /api/sky, or this
//                  device's memory of it — live-weather.js#lastWetAt). Raining now = now.
//   bowSchedule    one appearance per rain: a few minutes after it stops, fading in over 1–2 min, holding 10–20 min, fading
//                  out over 2 min (seeded by the quarter hour the rain stopped: every phone in the area sees the same bow)
//   bowWeights     which bow the sky allows right now (sun / moon / party, cloud, fog, rain) — the envelope is separate
//   bowGeometry    where the arc sits: a phone's top just under the tagline, its ends down behind the towers; a wide screen
//                  frames the sign (emerging from behind it), its feet behind the far towers

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = n => { let h = (n | 0) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export const MIN = 60_000;

/** PURE: the one appearance after the rain that stopped at endMs (ms timestamps; null without a rain). */
export function bowSchedule(endMs) {
  if (endMs == null || !Number.isFinite(endMs)) return null;
  const q = Math.floor(endMs / (15 * MIN));
  const r1 = hash(q), r2 = hash(q + 7919), r3 = hash(q + 104729), r4 = hash(q + 1299709);
  const start = endMs + (2 + 5 * r1) * MIN;          // a few minutes after the last drops (the light has to come back)
  const fadeIn = (60 + 60 * r2) * 1000;              // a minute or two
  const hold = (10 + 10 * r3) * MIN;                 // 10–20 minutes
  const fadeOut = 2 * MIN;
  return { start, fadeIn, hold, fadeOut, end: start + fadeIn + hold + fadeOut, secondary: r4 < 0.4 };
}

/** PURE: how much of the bow is out at `now` (0..1), for the rain that stopped at endMs. */
export function bowEnvelope(now, endMs) {
  const s = bowSchedule(endMs);
  if (!s || now < s.start || now > s.end) return 0;
  const t = now - s.start;
  if (t < s.fadeIn) return smooth(0, s.fadeIn, t);
  if (t < s.fadeIn + s.hold) return 1;
  return 1 - smooth(0, s.fadeOut, t - s.fadeIn - s.hold);
}

/** PURE: when it last rained, from the live weather and the device's memory (the later of the two); null = dry. */
export function lastRain(wx, remembered = null) {
  const w = wx && Number.isFinite(wx.wetAt) ? wx.wetAt : null;
  const m = Number.isFinite(remembered) ? remembered : null;
  return w != null && m != null ? Math.max(w, m) : w ?? m;
}

/** PURE: which bow the sky allows (each 0..1, before the envelope). L: core/sky.js#look. party: 0..1 (PARTY NIGHTS is on).
 *  day: the sun out and low enough (a real rainbow needs the sun under 42°; lower is richer — mornings and late afternoons),
 *  moon: after dark with a bright moon up (≥ ~70 % lit), neon: a party night (no moon needed; the moonbow steps aside).
 *  All of them: not under thick cloud or fog, never while it still rains hard. strength: the day bow's richness (low sun). */
export function bowWeights(L, { party = 0 } = {}) {
  const sky = (1 - smooth(0.72, 0.9, L.cloud || 0)) * (1 - smooth(0.3, 0.6, L.fog || 0)) * (1 - smooth(0.12, 0.3, L.rain || 0)) * (1 - smooth(0.2, 0.5, L.snow || 0));
  const w = L.w || {};
  const light = L.alwaysNight ? 0 : clamp01((w.day || 0) + (w.golden || 0) + (w.dawn || 0));
  const dark = L.alwaysNight ? 1 : clamp01((w.night || 0) + (w.late || 0));
  const el = L.sun ? L.sun.el : -90;
  const sunOk = smooth(0.5, 4, el) * (1 - smooth(30, 42, el));
  const strength = 1 - 0.35 * smooth(12, 34, el);
  const m = L.moon || {};
  const moonOk = smooth(0.62, 0.74, m.illum || 0) * smooth(2, 8, m.el ?? -90) * (1 - smooth(32, 42, m.el ?? -90));
  const p = clamp01(party);
  return { day: sky * light * sunOk, moon: sky * dark * moonOk * (1 - p), neon: sky * dark * p, strength, sky };
}

/** PURE: the arc. o: { W, H, HZ, roof(x) (the skyline's top at x), neon / word / tag {x,y,w,h} (the sign's text), kind }.
 *  Returns { cx, cy, R (the outer edge), band (the primary's width), top, phone, mask: {x,y,w,h} | null (hidden behind the
 *  sign on a wide screen) }. A phone: the top just under the tagline, steep enough to reach the towers before the screen's
 *  edges (its ends drop behind them). A wide screen: wider, framing the sign, its feet behind the far towers. */
export function bowGeometry(o) {
  const { W, HZ, roof } = o;
  const phone = W < 760 || o.H > W;
  const neon = o.kind === 'neon';
  const tag = o.tag || { x: W * 0.1, y: HZ * 0.3, w: W * 0.8, h: 14 };
  const sign = o.neon || { x: W * 0.2, y: HZ * 0.12, w: W * 0.6, h: HZ * 0.14 };
  // the roofs right at the screen's edges: the arc must reach the edges below them (its ends hidden, never a sliver past them)
  const edges = roof ? Math.max(roof(2), roof(W - 2)) : HZ * 0.6;
  if (phone) {
    // (6b — CITY 2.0, the owner: "the rainbow arc is way too low": on the Harbor (o.harbor) a big, tall arc — its top just under the
    // NEON word (it passes BEHIND SPEAKEASY + the tagline: the page draws over it; never across NEON), its legs down behind the skyline
    // at the screen's edges (the city draws in front of them))
    const top = o.harbor ? sign.y + sign.h + (neon ? 34 : 10) : tag.y + tag.h + (neon ? 30 : 12);
    const a = W / 2;
    // the arc reaches the screen's edges a little below the roofs there (hidden): solve R from the drop d at x = ±a
    const d = Math.max(W * 0.18, edges + 14 - top);
    const R = Math.max(a * 1.02, Math.min(W * (neon ? 0.52 : o.harbor ? 0.62 : 0.56), (a * a + d * d) / (2 * d)));
    const band = R * (neon ? 0.19 : 0.085);
    return { cx: W / 2, cy: top + R, R, band, top, phone: true, mask: null };
  }
  // a wide screen. The day bow / moonbow: one wide arc OVER the sign (the sign stands under it; it never crosses a letter),
  // its feet behind the far towers. The neon bow sits lower: it rises from behind the sign at SPEAKEASY's height (masked
  // there) and runs down behind the towers on both sides — under the NEON letters, never over them.
  const block = { x: Math.min(sign.x, tag.x) - 24, y: sign.y - 18, w: Math.max(sign.x + sign.w, tag.x + tag.w) - Math.min(sign.x, tag.x) + 48, h: tag.y + tag.h - sign.y + 36 };
  const a = W / 2 - 2;
  const roofs = edges;
  if (neon) {
    const top = sign.y + sign.h * 1.02;
    const d = Math.max(HZ * 0.2, roofs + 18 - top);
    const R = (a * a + d * d) / (2 * d);
    return { cx: W / 2, cy: top + R, R, band: Math.min(R * 0.07, 54) * 1.15, top, phone: false, mask: block };
  }
  const band = 38;
  const top = Math.max(12, sign.y - band - 40);
  const d = Math.max(HZ * 0.25, roofs + 18 - top);
  const R = (a * a + d * d) / (2 * d);
  return { cx: W / 2, cy: top + R, R, band, top, phone: false, mask: null };
}
