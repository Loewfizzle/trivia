// THE GPU CHECK (SHELL 2.0 B1 Group 0): what the test browser's GPU really is, before a full local run.
//   node tests/integration/gpu-check.mjs "<browser>" [--gpu]
// Prints WebGL / WebGL2 + the renderer string the page sees (the same calls the city's fireworks + THE GL PAINTER make) and
// chrome://gpu's feature-status table. Exit 1 when WebGL2 is missing or falls back to software (SwiftShader / "Basic Render").
import puppeteer from './kit/puppeteer.mjs';

const exe = process.argv[2] || 'C:\\Users\\benja\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
const gpu = process.argv.includes('--gpu');
const args = (process.env.GPU_ARGS || '').split(' ').filter(Boolean);
if (gpu) args.push('--enable-gpu');
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args });
try {
  const page = await browser.newPage();
  await page.goto('about:blank');
  const gl = await page.evaluate(() => {
    const read = (kind) => {
      const c = document.createElement('canvas'), g = c.getContext(kind);
      if (!g) return { ok: false };
      const ext = g.getExtension('WEBGL_debug_renderer_info');
      return { ok: true, vendor: ext ? g.getParameter(ext.UNMASKED_VENDOR_WEBGL) : '?', renderer: ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER) };
    };
    return { webgl: read('webgl'), webgl2: read('webgl2') };
  });
  await page.goto('chrome://gpu');
  await page.waitForFunction(() => document.querySelector('info-view')?.shadowRoot?.textContent?.includes('Graphics Feature Status'), { timeout: 15000 }).catch(() => {});
  const status = await page.evaluate(() => {
    const t = document.querySelector('info-view')?.shadowRoot?.textContent || document.body.innerText || '';
    const i = t.indexOf('Graphics Feature Status'), j = t.indexOf('Driver Bug Workarounds');
    return t.slice(i, j > i ? j : i + 1500).replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n').slice(0, 1500);
  });
  console.log(JSON.stringify(gl, null, 1));
  console.log(status);
  const soft = (r) => /swiftshader|basic render|llvmpipe|software/i.test(r || '');
  const good = gl.webgl2.ok && !soft(gl.webgl2.renderer);
  console.log(good ? 'GPU OK — WebGL2 on ' + gl.webgl2.renderer : 'GPU MISSING — WebGL2 ' + (gl.webgl2.ok ? 'in software: ' + gl.webgl2.renderer : 'unavailable'));
  process.exitCode = good ? 0 : 1;
} finally { await browser.close(); }
