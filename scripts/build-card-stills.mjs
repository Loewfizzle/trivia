// LOAD FIX 3 — NO BLACK TILES: bakes every card DRAWN IN CODE (js/vault/stills.js#STILLS) — its effect's own STILL frame (the reduced-motion
// frame, the effect's 2D path, its tint) as the strip (360 × 64) and the full card (400 × 252) — into assets/vault/still/<card>-s.webp / -f.webp,
// then writes the GENERATED block at the end of css/vault.css that makes each one the card's material wherever its effect is NOT painting it
// (`:not(.fx-on)` — fx/renderer.js marks a painted slot). Generalises PD-5B's scripts/build-pd-cards.mjs (PRISM DROP's full cards keep theirs).
// Re-run after an edit to a listed card's effect (or a new row in STILLS):
//   node scripts/build-card-stills.mjs "<browser>"      (needs scripts/serve.mjs on :5173)   · --check = exit 1 when css/vault.css's block is stale
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { STILLS } from '../js/vault/stills.js';

const ROOT = new URL('../', import.meta.url);
const CSS = new URL('css/vault.css', ROOT), OUT = new URL('assets/vault/still/', ROOT);
const A = '/* CARD STILLS (GENERATED: node scripts/build-card-stills.mjs — LOAD FIX 3, NO BLACK TILES; js/vault/stills.js) */', Z = '/* /CARD STILLS */';
const SIZES = { s: [360, 64], f: [400, 252] };

/** the CSS block for a set of cards ({ card: { mat, kinds } }) — strips first, then the full cards (they win on the after-match tile, which wears both) */
export function stillsBlock(rows) {
  const line = (sel, file) => `${sel}:not(.fx-on) > .vl-mat { background: #05060a url('../assets/vault/still/${file}') 50% 50% / cover no-repeat; }`;
  const s = rows.filter(r => r.kinds.includes('s')).map(r => line(`.vl-s-${r.mat}`, `${r.card}-s.webp`));
  const f = rows.filter(r => r.kinds.includes('f')).map(r => line(`.vl-fcm-${r.mat}`, `${r.card}-f.webp`));
  return [A, ...s, ...f, Z].join('\n');
}
export function withBlock(css, block) {
  const i = css.indexOf(A), j = css.indexOf(Z);
  const bare = i >= 0 && j > i ? css.slice(0, i).replace(/\s*$/, '') + css.slice(j + Z.length) : css.replace(/\s*$/, '');
  return `${bare.replace(/\s*$/, '')}\n\n${block}\n`;
}
/** the cards' materials, read from js/vault/strip.js's LOOKS (no DOM needed) */
export function stillRows() {
  const src = readFileSync(new URL('js/vault/strip.js', ROOT), 'utf8');
  return Object.entries(STILLS).map(([card, kinds]) => {
    const m = src.match(new RegExp(`'${card}': \\{ mat: '([\\w-]+)'`));
    if (!m) throw new Error(`${card}: no LOOKS row in js/vault/strip.js`);
    return { card, mat: m[1], kinds };
  });
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/build-card-stills.mjs')) {
  const rows = stillRows(), css = readFileSync(CSS, 'utf8'), next = withBlock(css, stillsBlock(rows));
  if (process.argv.includes('--check')) {
    const missing = rows.flatMap(r => [...r.kinds].map(k => `${r.card}-${k}.webp`)).filter(f => !existsSync(new URL(f, OUT)));
    if (next !== css || missing.length) { console.log(`THE CARD STILLS are stale — node scripts/build-card-stills.mjs${missing.length ? ` (missing ${missing.join(', ')})` : ''}`); process.exit(1); }
    console.log('THE CARD STILLS are current'); process.exit(0);
  }
  const puppeteer = (await import('../tests/integration/kit/puppeteer.mjs')).default;
  const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173';
  mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: BROWSER, headless: 'new' });
  const p = await b.newPage();
  await p.goto(`${BASE}/404.html`);
  const files = await p.evaluate(async (rows, SIZES) => {
    const link = document.createElement('link'); link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap';
    document.head.append(link);
    await new Promise(r => { link.onload = r; link.onerror = r; setTimeout(r, 4000); });
    for (const f of ['900 40px Orbitron', '700 20px "Chakra Petch"', '700 20px "JetBrains Mono"']) await document.fonts.load(f).catch(() => {});
    const { LOOKS, fxOpts } = await import('/js/vault/strip.js');
    const { FX } = await import('/js/fx/index.js');
    const draw = (fx, card, W, H, full) => {
      const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
      const x = c.getContext('2d'); x.scale(2, 2);
      x.fillStyle = '#05060a'; x.fillRect(0, 0, W, H);
      fx.draw(x, { w: W, h: H, x: 0, y: 0, opts: fxOpts(card, { radius: 0, full, seed: 3 }) }, fx.stillT != null ? fx.stillT : 3, { still: true, dpr: 2, q: 1 });
      return c;
    };
    // (a first pass starts every effect's own loads — sprites, plates, fonts — then the real one)
    for (const r of rows) { const fx = FX[LOOKS[r.card].fx]; for (const k of r.kinds) try { draw(fx, r.card, ...SIZES[k], k === 'f'); } catch { /* the next pass */ } }
    await new Promise(r => setTimeout(r, 3500));
    const out = {};
    for (const r of rows) {
      const fx = FX[LOOKS[r.card].fx];
      for (const k of r.kinds) {
        const [W, H] = SIZES[k], c = draw(fx, r.card, W, H, k === 'f');
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let lit = 0;
        for (let i = 0; i < d.length; i += 4) if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 40) lit++;
        out[`${r.card}-${k}`] = { url: c.toDataURL('image/webp', 0.84), lit: +(lit / (d.length / 4)).toFixed(3) };
      }
    }
    return out;
  }, rows, SIZES);
  for (const [n, o] of Object.entries(files)) {
    const buf = Buffer.from(o.url.split(',')[1], 'base64');
    writeFileSync(new URL(`${n}.webp`, OUT), buf);
    console.log(`assets/vault/still/${n}.webp ${(buf.length / 1024).toFixed(1)} KB · lit ${(o.lit * 100).toFixed(1)} %${o.lit < 0.02 ? '  ⚠ nearly dark' : ''}`);
  }
  await b.close();
  writeFileSync(CSS, next);
  console.log(`css/vault.css: THE CARD STILLS — ${rows.length} cards`);
}
