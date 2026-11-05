// SHELL 2.0 B2 — THE GIFT CARDS' ART: each card's 1280 × 800 picture (the full card ≈ 1.586 : 1 shows nearly all of it; the slim strip
// crops its middle band — js/fx/gift-specs.js holds where) → assets/vault/gift/<id>.webp. The owner's approved looks
// (Downloads\NEON\gifts\*\mock-*.png): the subject on the RIGHT, the left ~40 % dark for the plate, the top-right clear for the gem.
// Sources: art/gifts/src/ (copies — never the originals in Downloads). Composed in a headless page (a real 2D canvas); the flat Grok
// backgrounds (#ff2bd6 / the magenta behind the shiba) keyed out by a flood fill from the edges. What MOVES is not baked here — the fx
// layer draws it (js/fx/gift.js): the palms, the polaroid, the giant 25's flicker, HIT HARD., PRESS START, the grid …
// The four ADD-ON cards (the owner's own edits, already laid out for the card) are only converted.
//   node scripts/build-gift-art.mjs "<browser>"      (needs scripts/serve.mjs on :5173)
import puppeteer from '../tests/integration/kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = new URL('../assets/vault/gift/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
const p = await b.newPage();
await p.goto(`${BASE}/404.html`);
const files = await p.evaluate(async () => {
  const W = 1280, H = 800, SRC = '/art/gifts/src/';
  const load = n => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(n)); i.src = SRC + n; });
  const canvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const r = (() => { let a = 7; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  // a flat background keyed out: a flood fill from every edge pixel close to the corner's colour (tolerance tol), a soft 1-px edge
  function keyed(img, tol = 70) {
    const c = canvas(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), px = d.data, w = c.width, h = c.height;
    const k = [px[0], px[1], px[2]], near = i => Math.abs(px[i] - k[0]) + Math.abs(px[i + 1] - k[1]) + Math.abs(px[i + 2] - k[2]) < tol;
    const seen = new Uint8Array(w * h), st = [];
    for (let i = 0; i < w; i++) { st.push(i, (h - 1) * w + i); } for (let j = 0; j < h; j++) { st.push(j * w, j * w + w - 1); }
    while (st.length) { const q = st.pop(); if (seen[q]) continue; const i = q * 4; if (!near(i)) continue; seen[q] = 1; px[i + 3] = 0; const xx = q % w, yy = (q / w) | 0;
      if (xx > 0) st.push(q - 1); if (xx < w - 1) st.push(q + 1); if (yy > 0) st.push(q - w); if (yy < h - 1) st.push(q + w); }
    // (the fringe, two rings in: the outer ring keyed too (an edge pixel is half magenta), the next half-alpha; both DESPILLED — the key's
    //  magenta lifts red + blue, so blue is held to green: gold hair + orange fur keep their colour, no pink halo)
    const ring = mark => { const out = []; for (let q = 0; q < w * h; q++) { if (mark[q]) continue; const xx = q % w, yy = (q / w) | 0; if ((xx > 0 && mark[q - 1]) || (xx < w - 1 && mark[q + 1]) || (yy > 0 && mark[q - w]) || (yy < h - 1 && mark[q + w])) out.push(q); } return out; };
    const r1 = ring(seen); for (const q of r1) { seen[q] = 1; px[q * 4 + 3] = 0; }
    const r2 = ring(seen); for (const q of r2) { const i = q * 4; px[i + 3] = 120; px[i + 2] = Math.min(px[i + 2], px[i + 1]); px[i] = Math.min(px[i], px[i + 1] * 1.6 + 20); }
    x.putImageData(d, 0, 0); return c;
  }
  // a photo crop laid in on the right, its LEFT edge fading into the background (fade px)
  function photo(c, img, s, dst, fade) {
    const t = canvas(), x = t.getContext('2d');
    x.drawImage(img, s[0], s[1], s[2], s[3], dst[0], dst[1], dst[2], dst[3]);
    x.globalCompositeOperation = 'destination-in';
    const g = x.createLinearGradient(dst[0], 0, dst[0] + fade, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    c.getContext('2d').drawImage(t, 0, 0);
  }
  const noise = (x, n, a, col = '255,255,255') => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${col},${(r() * a).toFixed(3)})`; x.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); } };
  const vignette = (x, a = 0.6) => { const g = x.createRadialGradient(W * 0.62, H * 0.45, H * 0.2, W * 0.55, H * 0.5, W * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const leftDark = (x, a = 0.55) => { const g = x.createLinearGradient(0, 0, W * 0.5, 0); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const out = {};
  const save = (id, c, q = 0.86) => { out[id] = c.toDataURL('image/webp', q); };
  const PHOTO_S = [200, 250, 1006, 1000], PHOTO_D = [565, 0, 805, 800];   // (the nephew's photo: his head + the shoulder's 25, right)

  // ---- THE ENFORCER — charcoal on dark paper, a giant smudged 25 behind him (its flicker = the fx)
  { const c = canvas(), x = c.getContext('2d');
    x.fillStyle = '#181818'; x.fillRect(0, 0, W, H); noise(x, 26000, 0.07); noise(x, 9000, 0.12, '0,0,0');
    x.save(); x.filter = 'blur(7px)'; x.globalAlpha = 0.16; x.fillStyle = '#d8d8d8'; x.font = '900 560px "Arial Black", Impact, sans-serif'; x.textBaseline = 'middle'; x.fillText('25', 40, 420); x.restore();
    photo(c, await load('nephew-enforcer.png'), PHOTO_S, PHOTO_D, 300); vignette(x, 0.55); leftDark(x, 0.35); save('enforcer', c); }
  // ---- THE LINEBACKER — navy comic: speed rays, halftone, the cel-shaded photo
  { const c = canvas(), x = c.getContext('2d');
    const g = x.createRadialGradient(950, 260, 40, 800, 400, 900); g.addColorStop(0, '#2a4aa8'); g.addColorStop(1, '#0b1636'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.translate(950, 260); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; x.fillStyle = i % 2 ? 'rgba(120,160,255,0.10)' : 'rgba(10,20,60,0.10)'; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 1600, a, a + Math.PI / 28); x.closePath(); x.fill(); } x.restore();
    for (let yy = 0; yy < H; yy += 9) for (let xx = (yy / 9) % 2 ? 4.5 : 0; xx < W; xx += 9) { const k = xx / W; x.fillStyle = `rgba(0,0,30,${(0.10 + 0.12 * (1 - k)).toFixed(3)})`; x.beginPath(); x.arc(xx, yy, 2.2, 0, 6.29); x.fill(); }
    photo(c, await load('nephew-linebacker.png'), PHOTO_S, PHOTO_D, 280); leftDark(x, 0.4); save('linebacker', c); }
  // ---- UNDER THE LIGHTS — neon duotone, two stadium flares (the grid + the flares' breathing = the fx)
  { const c = canvas(), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0e0322'); g.addColorStop(0.6, '#2a0846'); g.addColorStop(1, '#4a0c5a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (const [fx, fy, rr] of [[700, 40, 260], [1180, 20, 300]]) { const f = x.createRadialGradient(fx, fy, 0, fx, fy, rr); f.addColorStop(0, 'rgba(255,230,255,0.85)'); f.addColorStop(0.25, 'rgba(255,120,230,0.35)'); f.addColorStop(1, 'rgba(255,80,220,0)'); x.fillStyle = f; x.fillRect(0, 0, W, H); }
    x.fillStyle = 'rgba(255,79,216,0.5)'; x.fillRect(0, 598, W, 2);
    photo(c, await load('nephew-underthelights.png'), PHOTO_S, PHOTO_D, 280); leftDark(x, 0.45); save('underlights', c); }
  // ---- HALL OF FAME — the bronze bust on a plinth under a museum spotlight (the gleam + the breathing = the fx)
  { const c = canvas(), x = c.getContext('2d');
    const g = x.createRadialGradient(880, 260, 30, 760, 420, 900); g.addColorStop(0, '#4a3012'); g.addColorStop(0.45, '#1c1207'); g.addColorStop(1, '#070503'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.globalCompositeOperation = 'lighter'; const sp = x.createLinearGradient(0, 0, 0, H); sp.addColorStop(0, 'rgba(255,214,150,0.16)'); sp.addColorStop(1, 'rgba(255,214,150,0.02)'); x.fillStyle = sp;
    x.beginPath(); x.moveTo(960, -20); x.lineTo(1120, -20); x.lineTo(1280, H); x.lineTo(560, H); x.closePath(); x.fill(); x.restore();
    const bust = keyed(await load('nephew-halloffame.png'), 130);
    x.drawImage(bust, 700, 92, 600, 800);   // (its hair clear of the 1-of-1 gem in the top-right corner)
    const pl = x.createLinearGradient(0, 712, 0, H); pl.addColorStop(0, '#3a2a14'); pl.addColorStop(0.08, '#21170b'); pl.addColorStop(1, '#0a0704'); x.fillStyle = pl; x.fillRect(560, 712, 720, 88);
    x.fillStyle = 'rgba(255,214,150,0.45)'; x.fillRect(560, 712, 720, 2);
    vignette(x, 0.5); save('halloffame', c); }
  // ---- PLAYER ONE — the 16-bit hero on a pixel starfield + a pixel floor (scanlines, flicker, sparkles, PRESS START = the fx)
  { const c = canvas(), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#081232'); g.addColorStop(1, '#13286a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let yy = 16; yy < 690; yy += 32) for (let xx = 16; xx < W; xx += 32) { x.fillStyle = `rgba(150,200,255,${(0.06 + r() * 0.2).toFixed(2)})`; x.fillRect(xx, yy, 3, 3); }
    for (let i = 0; i < 14; i++) { x.fillStyle = '#ffffff'; const sx = 560 + r() * 700, sy = r() * 640; x.fillRect(sx, sy, 6, 6); }
    x.imageSmoothingEnabled = false;
    x.drawImage(keyed(await load('nephew-playerone.png'), 90), 660, 0, 660, 880);
    x.fillStyle = '#0a1a48'; x.fillRect(0, 700, W, 100); x.fillStyle = '#3fe0ff'; x.fillRect(0, 700, W, 4);
    for (let xx = 0; xx < W; xx += 40) { x.fillStyle = 'rgba(63,224,255,0.25)'; x.fillRect(xx, 704, 2, 96); }
    save('playerone', c); }
  // ---- SUNSET STRIP — the striped 80s sun, the shiba in aviators (the palms + their sway, the glint, the haze = the fx)
  { const c = canvas(), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#26093e'); g.addColorStop(0.45, '#6a2276'); g.addColorStop(0.68, '#d24c82'); g.addColorStop(0.79, '#ff9560'); g.addColorStop(0.8, '#2a0f3e'); g.addColorStop(1, '#1c0a2c'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.beginPath(); x.rect(0, 0, W, 640); x.clip();
    const sg = x.createLinearGradient(0, 330, 0, 640); sg.addColorStop(0, '#ffe680'); sg.addColorStop(0.55, '#ffad5a'); sg.addColorStop(1, '#ff5d8a'); x.fillStyle = sg; x.beginPath(); x.arc(690, 560, 250, 0, 6.29); x.fill();
    x.beginPath(); x.arc(690, 560, 250, 0, 6.29); x.clip();   // (the stripes cut the SUN only)
    for (let i = 0; i < 7; i++) { const yy = 470 + i * 26, hh = 3 + i * 2.2; const bg = x.createLinearGradient(0, yy, 0, yy + hh); bg.addColorStop(0, '#c4447f'); bg.addColorStop(1, '#d24c82'); x.fillStyle = bg; x.fillRect(400, yy, 600, hh); }
    x.restore();
    x.fillStyle = '#2a0f3e'; x.fillRect(0, 640, W, 160); x.fillStyle = 'rgba(255,111,181,0.7)'; x.fillRect(0, 640, W, 3);
    x.drawImage(keyed(await load('shiba-sunset-cut.png'), 90), 560, 27, 820, 820);
    leftDark(x, 0.35); save('sunsetstrip', c); }
  // ---- GOLDEN HOUR — the scrapbook page (the polaroid itself = an fx sprite: it bobs; the heart = the fx: it pulses)
  { const c = canvas(), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fff2e6'); g.addColorStop(1, '#ffd2e0'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let yy = 12; yy < H; yy += 26) for (let xx = (yy / 26) % 2 ? 13 : 0; xx < W; xx += 26) { x.fillStyle = 'rgba(255,140,180,0.22)'; x.beginPath(); x.arc(xx, yy, 2.4, 0, 6.29); x.fill(); }
    // stickers: a sun (top), a palm + a wave (round the polaroid)
    const sticker = (draw, sx, sy) => { x.save(); x.translate(sx, sy); x.shadowColor = 'rgba(120,40,60,0.25)'; x.shadowBlur = 8; x.shadowOffsetY = 3; draw(); x.restore(); };
    sticker(() => { x.fillStyle = '#ffc93a'; x.beginPath(); x.arc(0, 0, 30, 0, 6.29); x.fill(); x.strokeStyle = '#ffb21a'; x.lineWidth = 7; x.lineCap = 'round'; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; x.beginPath(); x.moveTo(Math.cos(a) * 42, Math.sin(a) * 42); x.lineTo(Math.cos(a) * 58, Math.sin(a) * 58); x.stroke(); } }, 600, 150);
    sticker(() => { x.strokeStyle = '#2cc28e'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, 90); x.quadraticCurveTo(6, 30, 0, -20); x.stroke(); for (const a of [-2.6, -2.1, -1.0, -0.5]) { x.beginPath(); x.moveTo(0, -20); x.quadraticCurveTo(Math.cos(a) * 30, -20 + Math.sin(a) * 30 - 12, Math.cos(a) * 62, -20 + Math.sin(a) * 50 + 10); x.stroke(); } }, 690, 640);
    sticker(() => { x.strokeStyle = '#3cb8ff'; x.lineWidth = 7; x.lineCap = 'round'; for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i <= 20; i++) { const xx = -40 + i * 4, yy = k * 16 + Math.sin(i / 20 * 6.283) * 6; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); } }, 1110, 640);
    save('goldenhour', c); }
  // the polaroid (an fx sprite — it bobs): the white frame, the shiba in gold shades, "cambria ♥"
  { const c = canvas(380, 440), x = c.getContext('2d');
    x.fillStyle = '#fffdf8'; x.fillRect(0, 0, 380, 440); x.fillStyle = 'rgba(0,0,0,0.06)'; x.fillRect(0, 436, 380, 4);
    const sh = await load('shiba-golden.png'); x.drawImage(sh, 300, 140, 1500, 1500, 24, 24, 332, 332);
    x.fillStyle = '#d23a7a'; x.font = 'italic 600 38px "Segoe Script", "Brush Script MT", cursive'; x.textAlign = 'center'; x.fillText('cambria ♥', 190, 412);
    save('goldenhour-polaroid', c, 0.9); }
  // ---- THE ADD-ON's four: already laid out for the card (1280 × 800) — converted only
  // (CARD FIXES, the owner's LAB notes: ICE COLD "move him over to the right" + YOUNG BUCK "don't cut off the bottom of his face" — the
  //  picture slid right by dx so the face sits right of the full card's plate (the hero-spot rule); the strip of art that opens on the
  //  left is the picture's own left edge MIRRORED — its dark ground, no seam)
  for (const [id, f, dx = 0] of [['anarchist', 'the-anarchist-v2.png'], ['goldenboot', 'liam-golden-boot.png'], ['youngbuck', 'liam-young-buck.png', 130], ['icecold', 'liam-ice-cold.png', 150]]) {
    const img = await load(f), c = canvas(), x = c.getContext('2d'), k = img.naturalWidth / W;
    x.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, 0, W, H);
    if (dx) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(img, 0, 0, dx * k, img.naturalHeight, 0, 0, dx, H); x.restore(); }
    save(id, c);
  }
  return out;
});
let total = 0;
for (const [id, url] of Object.entries(files)) {
  const buf = Buffer.from(url.split(',')[1], 'base64'); total += buf.length;
  writeFileSync(new URL(`${id}.webp`, OUT), buf);
  console.log(`${id}.webp ${Math.round(buf.length / 1024)} KB`);
}
console.log(`${Object.keys(files).length} files, ${Math.round(total / 1024)} KB`);
await b.close();
