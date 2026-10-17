import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--enable-gpu', '--use-angle=d3d11'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto('http://localhost:5173/?emu&slot=prof');
await new Promise(r => setTimeout(r, 2500));
const c = await p.target().createCDPSession();
await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.evaluate(t => window.__district.setTier(t), Number(process.argv[3] || 1));
await new Promise(r => setTimeout(r, 1000));
await c.send('Profiler.enable'); await c.send('Profiler.start');
await new Promise(r => setTimeout(r, 3000));
const { profile } = await c.send('Profiler.stop');
const self = {}; const total = profile.samples.length;
const byId = new Map(profile.nodes.map(n => [n.id, n]));
for (const s of profile.samples) { const n = byId.get(s); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`; self[k] = (self[k] || 0) + 1; }
console.log(Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 16).map(([k, v]) => `${(100 * v / total).toFixed(1)}%  ${k}`).join('\n'));
console.log(await p.evaluate(() => { const f = window.__district.frames(); const s = [...f].sort((a, b) => a - b); return `p50 ${s[s.length >> 1]} tier ${window.__district.scene().tier}`; }));
await b.close();
