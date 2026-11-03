// THE VAULT 1A — the `vault` group (THE CARD LAB's look page + THE EFFECT LIBRARY's rules; docs/vault.md):
//   · the lab: all 10 items (the 8 strips + the 2 test emblems), each strip a SLOT in ONE shared canvas (never a canvas per strip),
//     APPROVE / FIX + a note / CUT mark + read back
//   · A FULL LOBBY of 8 LEGENDARY strips at 4× CPU on the REAL compositor — 60 fps (the owner's bar), its effect tier held
//   · only ON-SCREEN slots draw; a hidden page draws nothing; REDUCED MOTION = each strip's still frame, drawn once
import { BASE, ok, okT, sleep, ev, waitFor, G, launch, launchReal, closeReal, OUT, SHOTS } from './kit.mjs';

async function page(qs, { real = false, cpu = 0, view = [402, 874], dpr = 3 } = {}) {
  const ctx = await (await (real ? launchReal() : launch())).createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: view[0], height: view[1], deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  if (cpu > 1) { const cd = await p.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  await p.goto(`${BASE}/tests/integration/vault-preview.html?${qs}`);
  await waitFor(p, '!!(document.body.dataset.ready && window.__lab)', 'the lab', 30000);
  return { ctx, p };
}
const frames = (p, n = 180) => ev(p, `new Promise(res => { const t = []; let last = 0; const f = x => { if (last) t.push(x - last); last = x; if (t.length < ${n}) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); })`);

G('vault', async () => {
  // THE LAB: the strips view
  { const { ctx, p } = await page('view=strips');
    await sleep(1200);
    const s = await ev(p, `(() => ({ items: document.querySelectorAll('.vl-item').length, strips: document.querySelectorAll('.vl-strip').length, canvases: document.querySelectorAll('canvas.fx-canvas').length, slots: window.__lab.stats.slots, names: [...document.querySelectorAll('.vl-item-h b')].map(b => b.textContent) }))()`);
    ok(s.items === 10 && s.strips === 12 && s.canvases === 1, `THE CARD LAB: 10 items (8 strips + 2 test emblems — ${s.strips} strips on the page) on ONE shared effect canvas (${s.canvases}) — ${s.names.join(' · ')}`);
    await ev(p, `document.querySelector('.vl-item[data-id="card-smoke"] .vl-mark[data-m="approve"]').click()`);
    await ev(p, `document.querySelector('.vl-item[data-id="card-prism"] .vl-mark[data-m="fix"]').click()`);
    await sleep(200);
    await p.type('.vl-item[data-id="card-prism"] .vl-note', 'More sheen');
    await ev(p, `[...document.querySelectorAll('.vl-item[data-id="card-prism"] .vl-mark')].find(b => b.textContent === 'SAVE NOTE').click()`);
    await ev(p, `document.querySelector('.vl-item[data-id="card-glitter"] .vl-mark[data-m="cut"]').click()`);
    await sleep(300);
    const m = await ev(p, `({ m: window.__lab.marks, on: [...document.querySelectorAll('.vl-mark.is-on')].map(b => b.closest('.vl-item').dataset.id + ':' + b.dataset.m) })`);
    ok(m.m['card-smoke'].m === 'approve' && m.m['card-prism'].m === 'fix' && m.m['card-prism'].note === 'More sheen' && m.m['card-glitter'].m === 'cut' && m.on.length === 3,
      `THE CARD LAB: APPROVE · FIX + a note · CUT marked + shown (${m.on.join(', ')})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}vault-lab-402x874.png` });
    await ctx.close(); }
  // A FULL LOBBY OF 8 LEGENDARIES — 4× CPU, the real compositor (a phone's GPU path): 60 fps
  { const { ctx, p } = await page('view=lobby&bare=1&mix=legend', { real: true, cpu: 4, dpr: 3 });
    await sleep(2500);
    const t = await frames(p, 240); t.sort((a, b) => a - b);
    const st = await ev(p, 'window.__lab.stats');
    const med = t[t.length >> 1], p95 = t[Math.floor(t.length * 0.95)], slow = t.filter(x => x > 20).length;
    okT(med < 17.5 && slow < t.length * 0.06 && st.slots === 8, `THE VAULT: A FULL LOBBY of 8 LEGENDARY strips at 4× CPU — median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)}, ${slow}/${t.length} slow frames; ${st.slots} drawn on one canvas, effect tier ${st.tier}, draw ${st.ms} ms`);
    await ctx.close(); await closeReal(); }
  // ONLY ON SCREEN: a slot scrolled away isn't drawn; a hidden page draws nothing
  { const { ctx, p } = await page('view=lobby&mix=legend', { view: [402, 600], dpr: 2 });
    await sleep(1200);
    const a = await ev(p, 'window.__lab.stats.slots');
    await ev(p, `document.querySelector('.vl-lobby').scrollIntoView({ block: 'start' })`); await sleep(800);
    const b = await ev(p, 'window.__lab.stats.slots');
    const f0 = await ev(p, 'window.__lab.stats.frames');
    await ev(p, `(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    await sleep(900);
    const f1 = await ev(p, 'window.__lab.stats.frames'); await sleep(900); const f2 = await ev(p, 'window.__lab.stats.frames');
    ok(a < 8 && b > a && f2 - f1 <= 1, `THE EFFECT LIBRARY draws only what's ON SCREEN: ${a} of 8 legendaries drawn at the top of a short page, ${b} once scrolled to them; hidden → ${f2 - f1} frames (it stops)`);
    void f0; await ctx.close(); }
  // REDUCED MOTION: each strip's still frame, drawn once — the canvas stops; the emblems still
  { const { ctx, p } = await page('view=lobby&bare=1&mix=samples&still=1', { dpr: 2 });
    await sleep(1500);
    const f1 = await ev(p, 'window.__lab.stats.frames'); await sleep(1200); const f2 = await ev(p, 'window.__lab.stats.frames');
    const px = await ev(p, `(() => { const c = document.querySelector('canvas.fx-canvas'); const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 64) if (d[i] > 10) n++; return n; })()`);
    const anim = await ev(p, `getComputedStyle(document.querySelector('.vl-e-neon')).animationName + ' / ' + getComputedStyle(document.querySelector('.vl-e-prism .p-sweep')).animationName`);
    ok(f2 - f1 <= 1 && px > 500 && /none \/ none/.test(anim), `REDUCED MOTION: the strips' still frames drawn once (${px} lit samples), the canvas stops (${f2 - f1} frames in 1.2 s), the emblems still (${anim})`);
    await ctx.close(); }
});
