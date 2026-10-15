// Renders the app icon set and the 1200x630 link-preview image with a local Chrome/Edge.
//   cd tests/integration && node render-assets.mjs "<browser path>"
// Writes to /assets. Re-run after changing the designs below.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const BROWSER = process.argv[2] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = fileURLToPath(new URL('../../assets/', import.meta.url));
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=JetBrains+Mono:wght@700&family=Orbitron:wght@900&display=block">';

// pad: fraction of the canvas kept clear around the mark (maskable icons need ~20%)
const icon = (size, pad, rounded) => `<!doctype html><html><head>${FONTS}<style>
  html,body{margin:0;width:${size}px;height:${size}px;background:transparent}
  .c{position:relative;width:${size}px;height:${size}px;overflow:hidden;border-radius:${rounded ? size * 0.22 : 0}px;
    background:radial-gradient(70% 60% at 30% 15%,#0f3a52 0%,transparent 60%),radial-gradient(70% 60% at 85% 90%,#4a0f45 0%,transparent 60%),#04050d}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,240,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.08) 1px,transparent 1px);background-size:${size / 12}px ${size / 12}px}
  svg{position:absolute;inset:${size * pad}px;width:${size * (1 - 2 * pad)}px;height:${size * (1 - 2 * pad)}px;overflow:visible}
</style></head><body><div class="c"><div class="grid"></div>
<svg viewBox="0 0 100 100"><defs>
  <filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="rgba(0,240,255,.07)" stroke="#00f0ff" stroke-width="5" stroke-linejoin="round" filter="url(#g)"/>
<text x="50" y="62" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="34" fill="#ff2bd6" filter="url(#g)" letter-spacing="1">NA</text>
</svg></div></body></html>`;

const og = `<!doctype html><html><head>${FONTS}<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#04050d;color:#e8f6ff;font-family:'Chakra Petch'}
  .bg{position:absolute;inset:0;background:radial-gradient(55% 60% at 12% 0%,rgba(0,240,255,.22),transparent 70%),radial-gradient(50% 60% at 100% 30%,rgba(255,43,214,.2),transparent 70%),linear-gradient(180deg,#080b1a,#04050d 70%)}
  .grid{position:absolute;left:-50%;right:-50%;bottom:-24%;height:62%;background-image:linear-gradient(rgba(120,220,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(120,220,255,.18) 1px,transparent 1px);background-size:60px 60px;transform:perspective(420px) rotateX(62deg);transform-origin:50% 0;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 30%,#000 70%,transparent)}
  .scan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px)}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 84px;gap:26px}
  .kick{font-family:'JetBrains Mono';font-weight:700;font-size:20px;letter-spacing:.32em;color:#8b9cc4}
  h1{margin:0;font-family:Orbitron;font-weight:900;font-size:118px;line-height:.9;letter-spacing:.05em}
  h1 span{display:block;text-shadow:0 0 34px rgba(0,240,255,.55)}
  h1 span+span{color:transparent;-webkit-text-stroke:3px #ff2bd6;text-shadow:0 0 30px rgba(255,43,214,.45)}
  .games{display:flex;gap:14px;flex-wrap:wrap}
  .g{padding:10px 16px;font-weight:700;font-size:22px;letter-spacing:.12em;border:2px solid var(--c);color:var(--c);background:rgba(4,5,13,.6)}
  .foot{font-family:'JetBrains Mono';font-weight:700;font-size:20px;letter-spacing:.2em;color:#e8f6ff}
  .foot b{color:#00f0ff}
  .hex{position:absolute;right:70px;top:80px;width:300px;height:300px;opacity:.9}
</style></head><body><div class="bg"></div><div class="grid"></div><div class="scan"></div>
<svg class="hex" viewBox="0 0 100 100" style="overflow:visible"><defs><filter id="og" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="rgba(0,240,255,.06)" stroke="#00f0ff" stroke-width="3" stroke-linejoin="round" filter="url(#og)"/><polygon points="50,16 79,33 79,67 50,84 21,67 21,33" fill="none" stroke="rgba(255,43,214,.5)" stroke-width="0.8" stroke-dasharray="3 3"/><text x="50" y="61" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="30" fill="#ff2bd6" filter="url(#og)">NA</text></svg>
<div class="wrap">
  <div class="kick">&gt; MULTIPLAYER PARTY GAMES</div>
  <h1><span>NEURAL</span><span>ARCADE</span></h1>
  <div class="games">
    <div class="g" style="--c:#3dff8b">CIPHER BREACH</div>
    <div class="g" style="--c:#ff3355">LAST SIGNAL</div>
    <div class="g" style="--c:#ffb627">OVERCLOCK</div>
    <div class="g" style="--c:#e9e4d4">NEURAL BLUFF</div>
  </div>
  <div class="foot"><b>2–8 PLAYERS</b> · ONE PHONE EACH · TAP THE LINK TO JOIN</div>
</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true });
const page = await browser.newPage();
async function render(html, w, hgt, file, transparent = false) {
  await page.setViewport({ width: w, height: hgt, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT + file, omitBackground: transparent, type: 'png' });
  console.log('wrote', file);
}
await render(icon(512, 0.14, false), 512, 512, 'icon-512.png');
await render(icon(192, 0.14, false), 192, 192, 'icon-192.png');
await render(icon(512, 0.24, false), 512, 512, 'icon-maskable-512.png');
await render(icon(180, 0.14, false), 180, 180, 'apple-touch-icon.png');
await render(icon(64, 0.06, true), 64, 64, 'favicon-64.png', true);
await render(og, 1200, 630, 'og.png');
await browser.close();
