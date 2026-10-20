// LIVING CITY — RAINBOWS (docs/title.md; the rules in core/rainbow.js). Drawn in the sky layer, after the clouds and the rain's
// veils, before the skyline — every row of towers hides it naturally.
//   the day bow   a soft translucent arc in the real order (red outside, violet inside), the sky a touch brighter inside it,
//                 a faint pastel supernumerary inside the violet, sometimes a secondary bow outside (colours reversed) with the
//                 darker band between them; strongest at the top, fading toward its ends; a soft hole wherever the sun's disc is
//   the moonbow   the same arc, pale and silvery with a whisper of colour, added to the night sky
//   the neon bow  six neon tubes (red → violet) built like the NEON sign: a haze, a glow, the tube, a white-hot core, dark clips
//                 along it; it powers on tube by tube with a silent sputter, breathes with the party's beat, powers off gently;
//                 its light lies in the wet street (a soft flipped copy)
// Every bow is baked once per layout into an offscreen canvas and only faded (the neon animates its brightness alone).

import { bowGeometry } from '../../core/rainbow.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const WHITE = [255, 255, 255];

// the day bow's spectrum, inner (violet) → outer (red), with how strongly each band shows (violet is the faintest)
const SPECTRUM = [[0.1, [150, 96, 255], 0.32], [0.25, [84, 136, 255], 0.55], [0.41, [92, 214, 128], 0.68], [0.56, [255, 236, 120], 0.8], [0.7, [255, 166, 72], 0.84], [0.85, [255, 82, 72], 0.78]];
// the neon tubes, outer → inner
const TUBES = [[255, 52, 72], [255, 132, 40], [255, 224, 64], [60, 255, 130], [52, 146, 255], [176, 84, 255]];

export function createRainbow() {
  let W = 0, H = 0, HZ = 0, dpr = 1, tier = 2;
  let geoKey = '', geo = null, ngeo = null;
  let dayCv = null, dayKey = '', moonCv = null, moonKey = '';
  let neon = null, neonKey = '';                  // { comp, refl, y0, h, tubes|null }
  let holeCv = null, holeKey = '';
  const lv = { day: 0, moon: 0, neon: 0, started: false };
  const pw = { on: false, at: 0, offAt: -99, level: 0, tubes: [0, 0, 0, 0, 0, 0], seed: 1 };
  let last = null, edges = null, neonAlpha = 0;

  // ---------------------------------------------------------------- geometry (from the sign's text and the skyline)
  function layout(fs) {
    const tr = fs.textRects;
    if (!tr || !fs.skyline) return false;
    const sky = fs.skyline;
    const roof = x => sky[Math.max(0, Math.min(sky.length - 1, Math.round(x / 4)))];
    // the lowest line of text under the sign: the tagline, or a first visit's subline under it
    const low = tr.sub && tr.sub.y + tr.sub.h > tr.tag.y + tr.tag.h ? { x: Math.min(tr.tag.x, tr.sub.x), y: tr.tag.y, w: Math.max(tr.tag.x + tr.tag.w, tr.sub.x + tr.sub.w) - Math.min(tr.tag.x, tr.sub.x), h: tr.sub.y + tr.sub.h - tr.tag.y } : tr.tag;
    const k = [W, H, HZ, Math.round(low.y), Math.round(low.h), Math.round(tr.neon.y), Math.round(tr.neon.h), Math.round(tr.neon.x), Math.round(roof(W * 0.03)), Math.round(roof(W * 0.97)), Math.round(roof(W * 0.5))].join('|');
    if (k !== geoKey) {
      geoKey = k;
      const o = { W, H, HZ, roof, neon: tr.neon, word: tr.word, tag: low };
      geo = bowGeometry(o); ngeo = bowGeometry({ ...o, kind: 'neon' });
      // the text the secondary bow must pass behind on a phone (SPEAKEASY + the tagline)
      geo.textBlock = { x: Math.min(tr.word.x, low.x) - 14, y: tr.word.y - 10, w: Math.max(tr.word.x + tr.word.w, low.x + low.w) - Math.min(tr.word.x, low.x) + 28, h: low.y + low.h - tr.word.y + 22 };
      // (the test hook: where the arc meets the screen's edges, against the roofs there — it must be behind them)
      const arcY = (g, x) => { const dx = x - g.cx; return Math.abs(dx) >= g.R ? Infinity : g.cy - Math.sqrt(g.R * g.R - dx * dx); };
      edges = [geo, ngeo].map(g => [2, W - 2].map(x => ({ x, y: Math.round(arcY(g, x)), roof: Math.round(roof(x)) })));
      dayKey = moonKey = neonKey = holeKey = '';
    }
    return true;
  }
  const bakeScale = () => Math.min(dpr, 1.25);

  // ---------------------------------------------------------------- the soft bows (day + moon)
  function ring(x, g, rIn, rOut, stops) {
    const gr = x.createRadialGradient(g.cx, g.cy, Math.max(0, rIn), g.cx, g.cy, rOut);
    for (const [u, col, a] of stops) gr.addColorStop(clamp01(u), rgba(col, a));
    x.fillStyle = gr; x.fillRect(0, 0, W, HZ);
  }
  function softHole(x, b, kx = 1.08, ky = 1.35) {
    x.save(); x.globalCompositeOperation = 'destination-out';
    x.translate(b.x + b.w / 2, b.y + b.h / 2); x.scale((b.w / 2) * kx, (b.h / 2) * ky);
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.62, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  // where the arc reaches the screen's edge (phone) or its feet (a wide screen): the fade toward its ends
  function endsFade(x, g) {
    const a = g.phone ? W / 2 : W * 0.46;
    const yEdge = g.cy - Math.sqrt(Math.max(0, g.R * g.R - a * a));
    const gr = x.createLinearGradient(0, g.top - g.band * 2, 0, HZ);
    const at = y => clamp01((y - (g.top - g.band * 2)) / Math.max(1, HZ - (g.top - g.band * 2)));
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(at(g.top + (yEdge - g.top) * 0.3), 'rgba(0,0,0,1)');
    gr.addColorStop(at(yEdge), 'rgba(0,0,0,0.42)');
    gr.addColorStop(1, 'rgba(0,0,0,0.12)');
    x.save(); x.globalCompositeOperation = 'destination-in'; x.fillStyle = gr; x.fillRect(0, 0, W, HZ); x.restore();
  }
  function bakeSoft(kind, secondary) {
    const s = bakeScale(), cv = mk(W * s, HZ * s), x = cv.getContext('2d');
    x.scale(s, s);
    const g = geo, band = g.band, rIn = g.R - band;
    const moon = kind === 'moon';
    const tint = col => (moon ? mix(col, [214, 224, 242], 0.72) : col);
    const am = moon ? 0.62 : 1;
    // the sky a touch brighter inside the bow
    ring(x, g, g.R * 0.32, rIn + band * 0.1, [[0, WHITE, 0], [0.86, moon ? [220, 228, 245] : [255, 252, 240], moon ? 0.05 : 0.07], [1, WHITE, 0]]);
    // a faint pastel supernumerary just inside the violet (day only)
    if (!moon) ring(x, g, rIn - band * 0.62, rIn - band * 0.04, [[0, [255, 180, 225], 0], [0.32, [150, 245, 190], 0.11], [0.7, [255, 176, 222], 0.09], [1, [255, 180, 225], 0]]);
    // the bow: soft edges, red outside
    const stops = [[0, tint(SPECTRUM[0][1]), 0], ...SPECTRUM.map(([u, c, a]) => [u, tint(c), a * am]), [1, tint(SPECTRUM[5][1]), 0]];
    ring(x, g, rIn - band * 0.18, g.R + band * 0.16, stops);
    if (secondary && !moon) {
      // Alexander's dark band between the bows, then the secondary: wider, fainter, colours reversed (red inside)
      const R2 = g.R * 1.21, b2 = band * 1.75;
      ring(x, g, g.R + band * 0.12, R2 - b2, [[0, [8, 16, 36], 0], [0.25, [8, 16, 36], 0.055], [0.8, [8, 16, 36], 0.055], [1, [8, 16, 36], 0]]);
      const rev = [[0, SPECTRUM[5][1], 0], ...SPECTRUM.map(([u, c, a]) => [1 - u, c, a * (g.phone ? 0.36 : 0.3)]).reverse(), [1, SPECTRUM[0][1], 0]];
      const tmp = mk(W * s, HZ * s), tx = tmp.getContext('2d'); tx.scale(s, s);
      ring(tx, g, R2 - b2 * 1.1, R2 + b2 * 0.12, rev);
      if (g.phone) softHole(tx, g.textBlock, 1.12, 1.6);        // on a phone it passes behind SPEAKEASY and the tagline
      x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(tmp, 0, 0); x.setTransform(s, 0, 0, s, 0, 0);
      tmp.width = 0;
    }
    endsFade(x, g);
    if (g.mask) softHole(x, g.mask);
    return cv;
  }

  // ---------------------------------------------------------------- the neon bow
  function bakeNeon(withTubes) {
    const g = ngeo, s = Math.min(dpr, 2);
    const n = TUBES.length, sp = g.band / n, tw = Math.max(2.2, sp * 0.5);
    const pad = tw * 9, y0 = Math.max(0, g.top - pad), h = HZ - y0;
    const tubes = [];
    const comp = mk(W * s, h * s), cx0 = comp.getContext('2d');
    // the clips: dark holders along each tube, lined up across the six (a bracket every ~13° on a phone, closer on a wide screen)
    const step = g.phone ? 21 : 9;
    const clipAngles = [];
    for (let a = 90 - step * 0.5; a > 0; a -= step) clipAngles.push(a, 180 - a);
    for (let i = 0; i < n; i++) {
      const cv = mk(W * s, h * s), x = cv.getContext('2d');
      x.setTransform(s, 0, 0, s, 0, -y0 * s);
      const r = g.R - sp * (i + 0.5), col = TUBES[i];
      const arc = () => { x.beginPath(); x.arc(g.cx, g.cy, r, Math.PI, Math.PI * 2); };
      x.lineCap = 'round';
      x.globalCompositeOperation = 'lighter';
      // the haze, the glow (blurred once, here), the tube, its white-hot core
      x.strokeStyle = rgba(col, 0.05); x.lineWidth = tw * 9; arc(); x.stroke();
      x.strokeStyle = rgba(col, 0.1); x.lineWidth = tw * 4.2; arc(); x.stroke();
      x.shadowColor = rgba(col, 0.95); x.shadowBlur = tw * 4.5 * s; x.strokeStyle = rgba(col, 0.55); x.lineWidth = tw * 1.5; arc(); x.stroke();
      x.shadowBlur = 0;
      x.globalCompositeOperation = 'source-over';
      x.strokeStyle = rgba(mix(col, WHITE, 0.18), 1); x.lineWidth = tw; arc(); x.stroke();
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = rgba(mix(col, WHITE, 0.78), 0.92); x.lineWidth = Math.max(0.8, tw * 0.36); arc(); x.stroke();
      x.globalCompositeOperation = 'source-over';
      // the clips
      for (const a of clipAngles) {
        const th = a * Math.PI / 180, px = g.cx + r * Math.cos(th), py = g.cy - r * Math.sin(th);
        x.save(); x.translate(px, py); x.rotate(-th + Math.PI / 2);
        x.fillStyle = 'rgba(18,10,22,0.92)'; x.fillRect(-tw * 0.8, -tw * 0.58, tw * 1.6, tw * 1.16);
        x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(-tw * 0.8, -tw * 0.58, tw * 1.6, Math.max(0.5, tw * 0.16));
        x.restore();
      }
      if (g.mask) { x.setTransform(s, 0, 0, s, 0, -y0 * s); softHole(x, g.mask, 1.04, 1.25); }
      cx0.drawImage(cv, 0, 0);
      if (withTubes) tubes.push(cv); else cv.width = 0;
    }
    // its light in the wet street, baked: mirrored about the horizon and squashed (a wet street, not a mirror), blurred twice by
    // scaling, fading with the distance from the towers' feet
    const lo = mk(comp.width * 0.12, comp.height * 0.12); lo.getContext('2d').drawImage(comp, 0, 0, lo.width, lo.height);
    const rw = Math.max(1, Math.round(W * 0.25)), rh = Math.max(1, Math.round((H - HZ) * 0.25));
    const refl = mk(rw, rh), rx = refl.getContext('2d');
    rx.save(); rx.scale(rw / W, rh / (H - HZ)); rx.translate(0, 0); rx.scale(1, -0.5); rx.drawImage(lo, 0, y0 - HZ, W, h); rx.restore();
    rx.globalCompositeOperation = 'destination-in';
    const fg = rx.createLinearGradient(0, 0, 0, rh); fg.addColorStop(0, 'rgba(0,0,0,1)'); fg.addColorStop(0.35, 'rgba(0,0,0,0.55)'); fg.addColorStop(0.7, 'rgba(0,0,0,0)');
    rx.fillStyle = fg; rx.fillRect(0, 0, rw, rh);
    lo.width = 0;
    return { comp, refl, y0, h, tubes: withTubes ? tubes : null, s };
  }
  function freeTubes() { if (neon && neon.tubes) { for (const t of neon.tubes) t.width = 0; neon.tubes = null; } }

  // a tube's silent sputter as it catches (u: seconds since its turn): a couple of stutters, then it holds
  function sputter(u, seed) {
    if (u < 0) return 0;
    if (u > 0.62) return 1;
    const steps = [[0.05, 0.75], [0.11, 0.05], [0.17, 0.9], [0.24, 0.15], [0.3, 0.6], [0.36, 0.1], [0.62, 1]];
    for (const [end, v] of steps) if (u < end) return v * (0.85 + 0.15 * ((seed * 9301 + end * 49297) % 1));
    return 1;
  }

  // ---------------------------------------------------------------- per frame
  /** target: { day, moon, neon, secondary, strength } (0..1 each, the envelope included). o: { t (s), dt (ms), motion, breath } */
  function update(fs, target, o) {
    if (!layout(fs)) { last = null; return; }
    const sec = Math.min(0.1, o.dt / 1000);
    // the soft bows ease toward the sky's target (never a pop: at most a 30th per second; opening the title mid-bow, it comes up
    // over a few seconds — fading away is always the slow rate)
    const up = (lv.started ? 1 / 30 : 1 / 4) * sec, down = sec / 30;
    const ease = (v, to) => (to > v ? Math.min(to, v + up) : Math.max(to, v - down));
    lv.day = ease(lv.day, target.day); lv.moon = ease(lv.moon, target.moon);
    if (o.t > 12) lv.started = true;
    // the neon: a sign, not a fade — it powers on once the bow is due, holds, powers off gently when it isn't
    const nt = target.neon;
    const fancy = o.motion && tier > 0;
    if (!pw.on && nt > 0.35) { pw.on = true; pw.at = o.t; pw.seed = Math.random(); neonKey = ''; pw.fancy = fancy; }
    else if (pw.on && nt < 0.2) { pw.on = false; pw.offAt = o.t; pw.from = pw.level < 0 ? 1 : pw.level; freeTubes(); }
    if (pw.on) {
      const u = o.t - pw.at;
      if (pw.fancy) { let all = 1; for (let i = 0; i < 6; i++) { pw.tubes[i] = sputter(u - i * 0.26, pw.seed + i); all = Math.min(all, pw.tubes[i]); } pw.level = all >= 1 ? 1 : -1; if (all >= 1) freeTubes(); }
      else pw.level = smooth(0, 1.6, u);
    } else pw.level = (pw.from || 0) * (1 - smooth(0, 2.6, o.t - pw.offAt)) * (pw.from > 0 ? 1 : 0);
    if (pw.level === 0 && !pw.on) pw.from = 0;
    lv.neon = pw.on || pw.level > 0 ? 1 : 0;
    last = { secondary: target.secondary, strength: target.strength ?? 1, breath: o.breath || 0 };
  }

  function sunHole(cv, sunAt) {
    if (!sunAt) return cv;
    const g = geo, d = Math.hypot(sunAt.x - g.cx, sunAt.y - g.cy);
    const reach = sunAt.r * 5.5;
    const R2 = last && last.secondary ? g.R * 1.21 : g.R;
    if (d < g.R - g.band * 1.8 - reach || d > R2 + reach) return cv;      // nowhere near the arc
    const k = `${dayKey}|${Math.round(sunAt.x / 2)}|${Math.round(sunAt.y / 2)}|${Math.round(sunAt.r)}`;
    if (k !== holeKey) {
      holeKey = k;
      if (!holeCv || holeCv.width !== cv.width || holeCv.height !== cv.height) holeCv = mk(cv.width, cv.height);
      const x = holeCv.getContext('2d'), s = cv.width / W;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, holeCv.width, holeCv.height); x.drawImage(cv, 0, 0);
      x.globalCompositeOperation = 'destination-out';
      const gr = x.createRadialGradient(sunAt.x * s, sunAt.y * s, 0, sunAt.x * s, sunAt.y * s, reach * s);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(0, 0, holeCv.width, holeCv.height);
      x.globalCompositeOperation = 'source-over';
    }
    return holeCv;
  }

  function sky(c, fs) {
    if (!last || !geo) return;
    // the day bow (over the sky, as light and colour together)
    if (lv.day > 0.004) {
      const k = `${geoKey}|${last.secondary ? 2 : 1}`;
      if (k !== dayKey) { if (dayCv) dayCv.width = 0; dayCv = bakeSoft('day', last.secondary); dayKey = k; holeKey = ''; }
      c.globalAlpha = Math.min(1, lv.day * (0.44 + 0.24 * last.strength));
      c.drawImage(sunHole(dayCv, fs.sunAt), 0, 0, W, HZ);
    }
    // the moonbow: pale light added to the night sky
    if (lv.moon > 0.004) {
      if (moonKey !== geoKey) { if (moonCv) moonCv.width = 0; moonCv = bakeSoft('moon', false); moonKey = geoKey; }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, lv.moon * 0.58);
      c.drawImage(moonCv, 0, 0, W, HZ);
      c.globalCompositeOperation = 'source-over';
    }
    // the neon bow
    if (pw.on || pw.level > 0) {
      const want = pw.on && pw.fancy && pw.level < 0;
      if (neonKey !== geoKey || (want && !neon.tubes)) { if (neon) { neon.comp.width = 0; neon.refl.width = 0; freeTubes(); } neon = bakeNeon(want); neonKey = geoKey; }
      const br = 0.86 + 0.14 * last.breath;          // breathing with the party (steady under Reduced effects: breath 0)
      const base = 0.8;                              // a touch dimmer than the sign
      c.globalCompositeOperation = 'lighter';
      if (pw.level < 0 && neon.tubes) {
        for (let i = 0; i < 6; i++) if (pw.tubes[i] > 0) { c.globalAlpha = base * pw.tubes[i]; c.drawImage(neon.tubes[i], 0, neon.y0, W, neon.h); }
      } else if (pw.level > 0) { c.globalAlpha = neonAlpha = base * pw.level * br; c.drawImage(neon.comp, 0, neon.y0, W, neon.h); }
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
  }

  /** the neon bow's colours in the wet street */
  function reflect(c) {
    if (!neon || tier === 0 || !(pw.on || pw.level > 0)) return;
    const lvl = pw.level < 0 ? pw.tubes.reduce((a, b) => a + b, 0) / 6 : pw.level;
    if (lvl <= 0.01) return;
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.45 * lvl * (0.86 + 0.14 * (last ? last.breath : 0));
    c.drawImage(neon.refl, 0, HZ, W, H - HZ);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
  }

  return {
    resize(w, h, hz, d) { W = w; H = h; HZ = hz; dpr = d || 1; geoKey = ''; },
    setTier(t) { tier = t; },
    update, sky, reflect,
    debug: () => ({ day: +lv.day.toFixed(3), moon: +lv.moon.toFixed(3), neon: pw.on ? (pw.level < 0 ? 'sputter' : 'on') : pw.level > 0 ? 'off' : 'none', neonLevel: pw.level, tubes: pw.tubes.slice(), secondary: !!(last && last.secondary), geo: geo ? { cx: Math.round(geo.cx), cy: Math.round(geo.cy), R: Math.round(geo.R), top: Math.round(geo.top), band: Math.round(geo.band), phone: geo.phone } : null, ngeo: ngeo ? { top: Math.round(ngeo.top), R: Math.round(ngeo.R) } : null, hole: !!holeKey, edges, neonAlpha: +neonAlpha.toFixed(3), baked: { day: !!dayCv, moon: !!moonCv, neon: !!neon, tubes: !!(neon && neon.tubes) } }),
    destroy() { for (const cv of [dayCv, moonCv, holeCv, neon && neon.comp, neon && neon.refl]) if (cv) cv.width = 0; freeTubes(); },
  };
}
