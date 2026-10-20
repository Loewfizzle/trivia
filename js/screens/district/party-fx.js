// LIVING CITY — PARTY NIGHTS (docs/title.md): what the district draws on Friday and Saturday nights (core/party.js decides
// when and how hard). Everything breathes to one clock (scene.js: core/party.js#advanceBeat) and is drawn as pre-rendered
// sprites and baked overlays — a frame adds a handful of drawImage calls over the city.
//   bake(layers, seed, palette)       the party windows: a quarter of each row's lit windows (some whole floors) in the city's
//                                     neon, baked per row as panes (source-over) + a soft bloom (additive); seeded by the evening
//   windows(c, L, li, ox, oy, p)      a row's party windows, at this moment (the slow turn-ons / offs, the start wave's front)
//   searchlights(c, t, p, cam, geo)   the weekend searchlights in neon colours, sweeping with the music (crossing behind the sign at the peak)
//   reflect(c, p)                     the party light in the wet street (baked, breathing)
//   wave(c, p)                        the wave of colour sweeping across the city as the party begins
//   still(W, H, layers, geo)          the party light alone (the lobby's backdrop breathes it to the room's song)
const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const hexRgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
import { pickPartyWindows } from '../../core/party.js';

export function createPartyFx() {
  let W = 1, H = 1, HZ = 1, dpr = 1;
  let bakeKey = '', palette = null, refl = null, reflKey = '';
  const sprites = new Map();
  const sprite = (key, w, h, paint) => { let c = sprites.get(key); if (!c) { c = mk(w, h); paint(c.getContext('2d'), w, h); sprites.set(key, c); } return c; };
  // a volumetric beam: soft at the edges, fading with height (two of these per searchlight: a wide veil and a brighter core)
  const beam = (col, wide) => sprite(`beam|${col}|${wide}`, 128, 512, (x, w, h) => {
    const v = x.createLinearGradient(0, h, 0, 0);
    v.addColorStop(0, rgba(col, 1)); v.addColorStop(0.35, rgba(col, 0.55)); v.addColorStop(0.75, rgba(col, 0.16)); v.addColorStop(1, rgba(col, 0));
    x.fillStyle = v; x.beginPath(); x.moveTo(w * 0.5, h); x.lineTo(0, 0); x.lineTo(w, 0); x.closePath(); x.fill();
    // soft edges: fade the sides away
    x.globalCompositeOperation = 'destination-in';
    const s = x.createLinearGradient(0, 0, w, 0);
    const e = wide ? 0.5 : 0.32;
    s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(e, 'rgba(0,0,0,1)'); s.addColorStop(1 - e, 'rgba(0,0,0,1)'); s.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = s; x.fillRect(0, 0, w, h);
  });
  const radial = (col, stops) => sprite(`r|${col}|${stops}`, 64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); for (const [o, a] of stops) g.addColorStop(o, rgba(col, a)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const bandV = col => sprite(`bv|${col}`, 64, 8, (x, w) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, 1)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, w, 8); });

  // ---------------------------------------------------------------- the party windows (baked per row)
  function bake(layers, seed, pal) {
    const key = `${seed}|${W}|${H}|${dpr}|${layers.length}|${pal.join(';')}`;
    if (key === bakeKey) return;
    bakeKey = key; palette = pal; reflKey = '';
    layers.forEach((L, li) => {
      const lit = L.windows.filter(w => w.order <= 1 && w.h >= 1.6);
      // fewer far back (the far rows turn to confetti), a little fewer on a wide screen (there are many more windows)
      const picks = pickPartyWindows(lit, `${seed}|${li}`, pal, [0.13, 0.17, 0.22, 0.26][li] * (W >= 900 ? 0.85 : 1));
      L.party = picks.map(p => ({ ...p, w: lit[p.i] }));
      // the panes: the party colour replacing the warm one (source-over), its edge glowing a touch. Two bakes: without and with
      // the peak's extras — a frame draws ONE of them (both only while the extras fade in): every blit here is a full row
      const paint = (cv, withExtras) => {
        const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const p of L.party) {
          if (p.extra && !withExtras) continue;
          const w = p.w;
          // coloured glass, not paint: the colour at the window's own brightness, a whole floor a touch brighter
          x.fillStyle = rgba(p.col, Math.min(0.92, 0.55 + w.a * 0.4 + (p.floor ? 0.12 : 0))); x.fillRect(w.x, w.y, w.w, w.h);
          if (li >= 2) { x.fillStyle = rgba(p.col, 0.14); x.fillRect(w.x - 1.2, w.y - 1.2, w.w + 2.4, w.h + 2.4); }
        }
      };
      if (L.pc) L.pc.width = 0; if (L.pcx) L.pcx.width = 0;
      L.pc = mk(L.lw * dpr, L.lh * dpr); paint(L.pc, false);
      L.pcx = mk(L.lw * dpr, L.lh * dpr); paint(L.pcx, true);
      // this row's bloom, kept tiny (it's drawn into one bloom for the whole city below)
      if (L.pgLo) L.pgLo.width = 0;
      const s = 0.12; L.pgLo = mk(Math.max(1, L.pcx.width * s), Math.max(1, L.pcx.height * s));
      L.pgLo.getContext('2d').drawImage(L.pcx, 0, 0, L.pgLo.width, L.pgLo.height);
      L.pt = [];                  // windows turning on / off right now
      L.poff = new Set();         // party windows that are off at the moment
      L.pnext = 1 + Math.random() * 2;
      L.bodyRgb = hexRgb(L.body);
    });
    // ONE bloom for the whole city: every row's tiny bloom at its place on screen, blurred twice by scaling — a frame draws it
    // once (the rows' parallax is a few px: a soft haze doesn't mind)
    const bs = 0.25;
    bloomTop = Math.max(0, Math.min(...layers.map(L => L.top)) - 24);
    const all = mk(Math.max(1, W * bs), Math.max(1, H * bs)), ax = all.getContext('2d');
    ax.globalCompositeOperation = 'lighter';
    for (const L of layers) if (L.pgLo) ax.drawImage(L.pgLo, (-L.margin) * bs, L.top * bs, L.lw * bs, L.lh * bs);
    const lo = mk(Math.max(1, all.width * 0.3), Math.max(1, all.height * 0.3)); lo.getContext('2d').drawImage(all, 0, 0, lo.width, lo.height);
    if (bloomAll) bloomAll.width = 0;
    bloomAll = mk(all.width, all.height);
    const bx = bloomAll.getContext('2d');
    bx.globalAlpha = 0.75; bx.drawImage(all, 0, 0);
    bx.globalAlpha = 0.6; bx.drawImage(lo, 0, 0, bloomAll.width, bloomAll.height);
    all.width = 0; lo.width = 0;
  }
  let bloomAll = null;
  /** the whole city's party bloom, breathing with the beat (once a frame, after the rows) */
  let bloomTop = 0;
  function bloom(c, p) {
    if (!bloomAll || p.on <= 0 || p.tier === 0) return;
    const front = p.wave != null ? p.waveX : Infinity;
    const clip = front < W * 1.3;
    if (clip) { c.save(); c.beginPath(); c.rect(-10, -10, Math.max(0, front) + 10, H + 20); c.clip(); }
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = p.on * (0.3 + 0.4 * p.breath * p.energy + 0.5 * p.swell);
    const y0 = bloomTop, sy = y0 * (bloomAll.height / H);
    c.drawImage(bloomAll, 0, sy, bloomAll.width, bloomAll.height - sy, 0, y0, W, H - y0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (clip) c.restore();
  }

  // a row's party windows now: the panes (clipped to the start wave's front while it sweeps), the bloom breathing, the few
  // windows slowly turning on or off (never a twinkle)
  function windows(c, L, li, ox, oy, p, dt) {
    if (!L.pc || p.on <= 0) return;
    const front = p.wave != null ? p.waveX : Infinity;
    const clip = front < W + L.lw;
    if (clip) { c.save(); c.beginPath(); c.rect(-10, -10, Math.max(0, front) + 10, H + 20); c.clip(); }
    const extra = smooth(0.78, 0.98, p.energy);
    c.globalAlpha = p.on;
    if (extra > 0.99) c.drawImage(L.pcx, ox, oy, L.lw, L.lh);
    else { c.drawImage(L.pc, ox, oy, L.lw, L.lh); if (extra > 0.01) { c.globalAlpha = p.on * extra; c.drawImage(L.pcx, ox, oy, L.lw, L.lh); } }
    // the slow turn-ons and turn-offs: a new one every couple of seconds, each over ~3 s; at most a tenth are off
    if (p.motion) {
      L.pnext -= dt / 1000;
      if (L.pnext <= 0 && L.party.length > 8) {
        L.pnext = (2.2 + Math.random() * 2) / Math.max(0.6, p.energy);
        const cap = Math.floor(L.party.length * 0.1);
        const inFlight = new Set(L.pt.map(t => t.i));
        if (L.poff.size < cap && Math.random() < 0.55) {
          const i = Math.floor(Math.random() * L.party.length);
          if (!L.poff.has(i) && !inFlight.has(i) && !L.party[i].floor) { L.pt.push({ i, dir: -1, k: 0, dur: 2.4 + Math.random() * 1.6 }); L.poff.add(i); }
        } else if (L.poff.size) {
          const offs = [...L.poff].filter(i => !inFlight.has(i));
          if (offs.length) { const i = offs[Math.floor(Math.random() * offs.length)]; L.pt.push({ i, dir: 1, k: 0, dur: 2.4 + Math.random() * 1.6 }); L.poff.delete(i); }
        }
      }
    }
    // draw the off ones (and the ones in flight) back to their warm selves
    if (L.poff.size || L.pt.length) {
      const body = L.bodyRgb;
      const paint = (pw, a) => {                       // a = how far OFF it is (1 = fully its warm self)
        if (a <= 0.01) return;
        const w = pw.w;
        c.globalAlpha = a * p.on; c.fillStyle = rgba(body, 1); c.fillRect(ox + w.x, oy + w.y, w.w, w.h);
        c.fillStyle = `${w.col}`; c.globalAlpha = a * p.on * w.a; c.fillRect(ox + w.x, oy + w.y, w.w, w.h);
      };
      const flying = new Set();
      L.pt = L.pt.filter(tr => {
        tr.k += (p.motion ? dt / 1000 : 1) / tr.dur;
        const k = clamp01(tr.k), off = tr.dir < 0 ? smooth(0, 1, k) : 1 - smooth(0, 1, k);
        flying.add(tr.i); paint(L.party[tr.i], off);
        return tr.k < 1;
      });
      for (const i of L.poff) if (!flying.has(i)) paint(L.party[i], 1);
    }
    c.globalAlpha = 1;
    if (clip) c.restore();
  }

  // ---------------------------------------------------------------- the party light in the wet street (baked)
  function bakeRefl(layers) {
    const s = 0.35, rw = Math.ceil(W * s), rh = Math.ceil((H - HZ) * s);
    const src = mk(rw, Math.ceil(HZ * s)), sx = src.getContext('2d');
    sx.globalCompositeOperation = 'lighter';
    for (const L of layers) { if (!L.pcx) continue; sx.globalAlpha = 1; sx.drawImage(L.pcx, 0, 0, L.pcx.width, L.pcx.height, -L.margin * s, L.top * s, L.lw * s, L.lh * s); }
    if (bloomAll) { sx.globalAlpha = 0.9; sx.drawImage(bloomAll, 0, 0, bloomAll.width, bloomAll.height * (HZ / H), 0, 0, rw, src.height); }
    const c = mk(rw, rh), x = c.getContext('2d');
    x.save(); x.scale(1, -0.62); x.translate(0, -src.height);
    for (let i = 0; i < 7; i++) { x.globalAlpha = 0.5 / (1 + i * 0.7); x.drawImage(src, 0, -i * 3 * s); }
    x.restore();
    const fg = x.createLinearGradient(0, 0, 0, rh);
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.6, 'rgba(0,0,0,0.55)'); fg.addColorStop(1, 'rgba(0,0,0,0.95)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = fg; x.fillRect(0, 0, rw, rh);
    src.width = 0;
    return c;
  }
  function reflect(c, layers, p, t) {
    if (p.on <= 0 || !layers.some(L => L.pc)) return;
    if (reflKey !== bakeKey) { refl = bakeRefl(layers); reflKey = bakeKey; }
    if (p.tier === 0) return;
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = p.on * (0.42 + 0.22 * p.breath * p.energy + 0.4 * p.swell);
    const rh = H - HZ;
    if (p.motion && p.tier === 2) {
      // the same gentle ripple as the city's own reflection
      const strips = 6, sh = refl.height / strips;
      for (let i = 0; i < strips; i++) { const off = Math.sin(t * 1.3 + i * 0.9) * (0.6 + i * 0.25); c.drawImage(refl, 0, i * sh, refl.width, sh + 0.5, off - 4, HZ + (i / strips) * rh, W + 8, rh / strips + 0.6); }
    } else c.drawImage(refl, 0, HZ, W, rh);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- neon searchlights
  // beams rooted behind the towers; each keeps a colour (blending to the next on the big beats at the peak), an angle easing
  // toward a target that the beat picks (crossing behind the sign at the peak), a slow sway in the warm-up / after hours
  let beams = [];
  function searchlights(c, t, dt, p, cam, geo) {
    if (p.on <= 0) return;
    const wide = W >= 900;
    const roots = wide ? [0.05, 0.3, 0.7, 0.95] : [0.08, 0.92];
    if (beams.length !== roots.length) beams = roots.map((x0, i) => ({ x0, ang: null, target: 0, lit: 0, ci: i % palette.length, cj: i % palette.length, mix: 1, side: x0 < 0.5 ? 1 : -1, nextSwitch: 0, sway: Math.random() * TAU }));
    const sec = dt / 1000;
    const peak = smooth(0.8, 1, p.energy);                       // the peak's busyness
    const logoY = geo.logoY, by = HZ * 0.92;
    beams.forEach((b, i) => {
      const bx = W * b.x0 + cam * 0.15;
      // the angle that points this beam at the sign's heart (leaning inward): beams cross there at the peak
      const toSign = Math.atan2((W * 0.5 - bx), (by - logoY)) ;         // 0 = straight up, + leans right
      // it comes on already leaning (never a vertical pillar), its light rising over ~0.9 s
      if (b.ang == null) b.ang = b.target = toSign * 0.6 + (Math.random() - 0.5) * 0.3;
      b.lit = Math.min(1, b.lit + sec / 0.9);
      if (p.motion) {
        if (p.beat && p.bar % 2 === i % 2) {
          // a new target every second breath: at the peak around the sign (crossing), otherwise a graceful lean of its own
          const spread = 0.12 + 0.42 * peak;
          b.target = (toSign * (0.55 + 0.45 * peak)) + (Math.random() - 0.5) * 2 * spread * (1 - 0.5 * peak) + (Math.random() < 0.5 ? -1 : 1) * spread * peak * (0.4 + 0.6 * Math.random());
          b.target = Math.max(-0.95, Math.min(0.95, b.target));
        }
        const ease = 1 - Math.exp(-sec * (1.6 + 2.6 * peak));
        b.ang += (b.target - b.ang) * ease;
        // the slow sway under it
        b.sway += sec * (0.25 + 0.2 * p.energy);
        // colours: a new one on a big beat (every fourth breath) at the peak, every ~8 breaths otherwise; a smooth blend
        if (p.beat && p.bar % 4 === (i * 2) % 4 && Math.random() < 0.25 + 0.55 * peak) { b.ci = b.cj; b.cj = (b.cj + 1 + Math.floor(Math.random() * (palette.length - 1))) % palette.length; b.mix = 0; }
        b.mix = Math.min(1, b.mix + sec * (1.3 + 1.2 * peak));   // a quick blend (two colours added together go muddy halfway)
      } else { b.ang = toSign * 0.5; b.mix = 1; }
      const ang = b.ang + Math.sin(b.sway) * 0.1 * (1 - 0.6 * peak);
      const mixK = smooth(0, 1, b.mix);
      const len = HZ * (wide ? 1.0 : 0.95), wid = len * 0.16;
      const a = p.on * smooth(0, 1, b.lit) * (0.62 + 0.38 * p.breath * p.energy);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.translate(bx, by); c.rotate(ang);
      // the colour blends by drawing the old and the new palette colour over each other (sprites only per palette colour)
      for (const [ci, k] of [[b.ci, 1 - mixK], [b.cj, mixK]]) {
        if (k < 0.01) continue;
        const col = palette[ci];
        if (p.tier === 2) { c.globalAlpha = 0.3 * a * k; c.drawImage(beam(col, true), -wid * 0.9, -len, wid * 1.8, len); }   // the wide veil
        c.globalAlpha = (p.tier === 2 ? 0.48 : 0.56) * a * k; c.drawImage(beam(col, false), -wid / 2, -len, wid, len);                  // the core
        // where it catches the haze high up: a soft pool of its colour
        if (p.tier === 2) { c.globalAlpha = 0.16 * a * k; c.drawImage(radial(col, [[0, 0.8], [0.5, 0.25], [1, 0]]), -wid * 1.6, -len * 0.98 - wid, wid * 3.2, wid * 2.2); }
      }
      c.globalAlpha = (wide ? 0.22 : 0.3) * a; c.drawImage(beam([255, 255, 255], false), -wid * 0.16, -len * 0.92, wid * 0.32, len * 0.92);  // a white-hot heart (the beam's spine)
      c.restore();
    });
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- the start wave
  // a band of light sweeping left → right over ~2.6 s as the party switches on (the windows change as it passes: windows())
  function wave(c, p) {
    if (p.wave == null) return;
    const k = p.wave, front = p.waveX, bw = W * 0.26;
    const a = Math.sin(Math.PI * clamp01(k));
    if (a <= 0.01) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    // three ribbons of the palette, one behind the other, soft
    const cols = [palette[0], palette[1], palette[2]];
    cols.forEach((col, i) => {
      c.globalAlpha = a * (0.6 - i * 0.14);
      const x = front - i * bw * 0.35;
      c.drawImage(bandV(col), x - bw / 2, 0, bw, HZ);
    });
    c.globalAlpha = a * 0.85; c.drawImage(bandV([255, 255, 255]), front - bw * 0.15, 0, bw * 0.3, HZ);   // the bright front
    c.restore();
  }

  // ---------------------------------------------------------------- the party light alone (for the lobby's backdrop)
  function still(layers, cam) {
    const s = Math.min(1, 1100 / Math.max(W, H));
    const c = mk(W * s, H * s), x = c.getContext('2d');
    x.scale(s, s);
    x.globalCompositeOperation = 'lighter';
    for (const L of layers) {
      if (!L.pcx) continue;
      const ox = -L.margin + cam * L.d, oy = L.top;
      x.globalAlpha = 0.9; x.drawImage(L.pcx, ox, oy, L.lw, L.lh);
    }
    if (bloomAll) { x.globalAlpha = 0.8; x.drawImage(bloomAll, 0, 0, W, H); }
    if (reflKey !== bakeKey) { refl = bakeRefl(layers); reflKey = bakeKey; }
    x.globalAlpha = 0.6; x.drawImage(refl, 0, HZ, W, H - HZ);
    return c;
  }

  return {
    resize(w, h, hz, d) { W = w; H = h; HZ = hz; dpr = d; bakeKey = ''; reflKey = ''; beams = []; },
    bake, windows, bloom, reflect, searchlights, wave, still,
    palette: () => palette,
    debug: () => ({ beams: beams.map(b => ({ ang: +b.ang.toFixed(2), col: b.cj })), baked: !!bakeKey }),
  };
}
