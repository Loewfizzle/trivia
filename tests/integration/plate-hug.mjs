// FIXES R2 — the owner's add-on (Nov 15 9:10 pm): THE NAME PLATE HUGS ITS CONTENT — the glass behind the emblem + NAME + LV ends an even padding
// after the name / LV block, on the FULL card and the SLIM card, for a short, a mid (LOEWFIZZLE) and a 12-letter name (NAME_MAX), on GILDED +
// VELVET ROOM (+ a glow on). FAILS when the glass runs past its text by more than the padding (the "empty glass tail").
//   node tests/integration/plate-hug.mjs "<chromium>"        (scripts/serve.mjs; no emulators needed — plate-preview.html)
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
try {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  for (const glow of ['', 'glow-candle']) for (const name of ['BEN', 'RYLEN', 'LOEWFIZZLE', 'WWWWWWWWWWWW']) {
    await p.goto(`${BASE}/tests/integration/plate-preview.html?name=${name}&lv=23&cards=card-gilded,card-velvet${glow ? `&glow=${glow}` : ''}`);
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await new Promise(r => setTimeout(r, 900));
    const rows = await p.evaluate(() => {
      const txtRight = el => { const rg = document.createRange(); rg.selectNodeContents(el); const rs = [...rg.getClientRects()]; return rs.length ? Math.max(...rs.map(x => x.right)) : el.getBoundingClientRect().right; };
      return [...document.querySelectorAll('.vl-fc-plate, .vl-plate')].map(pl => {
        const card = pl.closest('.vl-fc, .vl-strip') || pl.parentElement, nm = pl.querySelector('[class*="name"]'), lv = pl.querySelector('[class*="lv"]'), R = pl.getBoundingClientRect();
        const end = Math.max(nm ? txtRight(nm) : 0, lv ? txtRight(lv) : 0), cw = card.getBoundingClientRect().width;
        const sc = R.width / (pl.offsetWidth || 1), padR = parseFloat(getComputedStyle(pl).paddingRight) * sc, nmR = nm ? txtRight(nm) : 0, lvR = lv ? txtRight(lv) : 0;
        // (FIXES R3 — THE STEPPED PLATE: the bottom step's right edge = the plate's left + data-x2 (plate px, scaled))
        const step = pl.dataset.step || '', stepR = step === 'n' ? R.left + (+pl.dataset.x2) * sc : R.right;
        return { kind: pl.classList.contains('vl-fc-plate') ? 'full' : 'slim', tail: +(R.right - end).toFixed(1), cw: Math.round(cw), share: +((R.right - card.getBoundingClientRect().left) / cw).toFixed(2),
          step, lvTail: +(stepR - lvR).toFixed(1), padR: +padR.toFixed(1), gap: +(nmR - lvR).toFixed(1), clip: !!pl.style.clipPath, edge: !!pl.querySelector(':scope > .vl-step path') };
      });
    });
    for (const r of rows) ok(r.tail >= 0 && r.tail <= (r.kind === 'full' ? 0.045 * r.cw : 13), `${name}${glow ? ` + ${glow}` : ''} · ${r.kind}: the glass ends ${r.tail} px after its text (≤ ${r.kind === 'full' ? (0.045 * r.cw).toFixed(1) : 13}) — it reaches ${Math.round(r.share * 100)} % of the card`);
    // FIXES R3 — the BOTTOM STEP hugs the LV line (≤ the plate's padding + 1.5 px); a name much wider than its LV line MUST step (clip + edge line)
    for (const r of rows) {
      if (r.gap > r.padR + 16) ok(r.step === 'n' && r.clip && r.edge && r.lvTail >= -0.5 && r.lvTail <= r.padR + 1.5, `${name}${glow ? ` + ${glow}` : ''} · ${r.kind}: STEPPED — the bottom step ends ${r.lvTail} px after "LV" (≤ ${(r.padR + 1.5).toFixed(1)}), the step's edge line drawn`);
      else ok(r.step === '' || (r.lvTail >= -0.5 && r.lvTail <= r.padR + 1.5), `${name}${glow ? ` + ${glow}` : ''} · ${r.kind}: the LV line about as wide as the name (${r.gap} px) — a plain rectangle (${r.step || 'none'})`);
    }
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await b.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
