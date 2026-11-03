// THE SIGHTING CARDS' HERO BAKES (THE VAULT 1C) — the shared run() for the card recipes (sr71-card, f22-card): the city's own model
// rendered at a HERO angle + size for THE VAULT's sighting cards (the card's jet is ~2/3 of a 390-pt card at 3× — the city's 360–440 px
// strips would be upscaled soft). Same page, same light set-ups as the city's bake (the recipe's own page); only the camera + the size
// change. Each SHOT → <out>/<name>.webp (cropped to its alpha) + one <prefix>.json { [name]: { w, h, nose, tail, c } } (px in the sprite).
import fs from 'node:fs';
import path from 'node:path';

/** a recipe's run(): shots = [{ name, light, elev, yaw, roll, px, pts? (points in the jet's frame — length 2, nose +x — → meta.pts in the sprite: the nozzles) }] */
export const cardRun = (shots, prefix) => async function run({ page, out, look, dataUrlToBuf }) {
  const meta = {};
  let bytes = 0;
  for (const s of shots) {
    await page.evaluate(k => window.light(k), s.light);
    const f = await page.evaluate(o => window.shootData(o), { elev: s.elev, yaw: s.yaw, roll: s.roll || 0, px: s.px });
    const { w, h } = f;
    const pts = s.pts ? await page.evaluate(a => a.map(p => window.lastProj(p)), s.pts) : [];
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f.data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const m = 3; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
    const fw = x1 - x0 + 1, fh = y1 - y0 + 1;
    const url = await page.evaluate(({ data, w, h, x0, y0, fw, fh, q }) => {
      const t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
      const c = document.createElement('canvas'); c.width = fw; c.height = fh; c.getContext('2d').drawImage(t, x0, y0, fw, fh, 0, 0, fw, fh);
      return c.toDataURL(q ? 'image/png' : 'image/webp', 0.88);
    }, { data: f.data, w, h, x0, y0, fw, fh, q: look });
    const buf = dataUrlToBuf(url); fs.writeFileSync(path.join(out, `${s.name}.${look ? 'png' : 'webp'}`), buf); bytes += buf.length;
    const P = p => [+(p[0] - x0).toFixed(1), +(p[1] - y0).toFixed(1)];
    meta[s.name] = { w: fw, h: fh, nose: P(f.nose), tail: P(f.tail), c: P(f.c), pts: pts.map(P), light: s.light, elev: s.elev, yaw: s.yaw, roll: s.roll || 0 };
    console.log(`${s.name}: ${fw}×${fh}`, (buf.length / 1024).toFixed(1), 'KB');
  }
  const js = JSON.stringify(meta); fs.writeFileSync(path.join(out, `${prefix}.json`), js);
  console.log('total', ((bytes + js.length) / 1024).toFixed(1), 'KB →', out);
};
