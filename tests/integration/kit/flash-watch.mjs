// THE FLASH WATCH (HIGH RISE S4A FIX — the owner's iPhone: "a pink flash when the round ends … at the final screen"): every frame the
// browser PRESENTS through a stretch of a page's life (CDP's screencast — the compositor's own frames, not a screenshot now and then),
// and for each one how much of the screen is TINTED PINK (the game's accent washed over it). A flash = a frame far pinker than the
// screen was before AND than it is once it has settled — whatever the look (a night sky is purple, a pink slab is pink: both are in
// the "before" and the "after", a flash is in neither).
//   const w = await flashWatch(browser, cdp);  …the moment…  const r = await w.stop();   → { frames, max, before, after, worst, flash }
//   r.flash = the frames that are a flash (their time in ms from the watch's start + their pink share)
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** how much pinker than both ends a frame must be to be called a flash (a share of the whole screen) */
export const FLASH_OVER = 0.22;

// (CITY PART 1 — ANY GAME's ACCENT: `accent` '#rrggbb' = count the pixels TINTED BY THAT COLOUR (its hue ± 24°, saturated, lit) instead of pink —
//  OVERCLOCK's orange wash is a flash too; no accent = the pink rule as before)
// (CITY PART 1 — `diff: true`: COLOUR-FREE — a frame's share of pixels that differ (Σ|ΔRGB| > 60) from the SETTLED last frame: a full-screen wash of
//  ANY colour lights up nearly all of it, a confetti burst or a title a small part — the shared every-game guard, tests/integration/end-flash.mjs)
export async function flashWatch(browser, cdp, { width = 195, height = 422, accent = null, diff = false } = {}) {
  const frames = [];
  const on = e => { frames.push({ data: e.data, t: (e.metadata && e.metadata.timestamp) || Date.now() / 1000 }); cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {}); };
  cdp.on('Page.screencastFrame', on);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, everyNthFrame: 1, maxWidth: width, maxHeight: height });
  const t0 = Date.now();
  return {
    /** stop + read every frame → the pink share of each; `settle` = the last ms that count as "settled", `lead` = the first ms that count as "before" */
    async stop({ lead = 350, settle = 500 } = {}) {
      await cdp.send('Page.stopScreencast').catch(() => {});
      cdp.off('Page.screencastFrame', on);
      await sleep(60);
      if (frames.length < 6) return { frames: frames.length, max: 0, before: 0, after: 0, worst: null, flash: [], ms: Date.now() - t0 };
      // (the frames are read on a blank page of their own — the game's page is never asked to decode pictures)
      const pg = await browser.newPage();
      const shares = [];
      if (diff) {
        const last = frames[frames.length - 1].data;
        for (let i = 0; i < frames.length; i += 40) {
          const part = frames.slice(i, i + 40).map(f => f.data);
          shares.push(...await pg.evaluate(async (list, ref) => {
            const px = async b64 => { const bm = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${b64}`)).blob()); const cv = new OffscreenCanvas(bm.width, bm.height), cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(bm, 0, 0); return cx.getImageData(0, 0, bm.width, bm.height).data; };
            const R0 = await px(ref), out = [];
            for (const b64 of list) { const d = await px(b64); let n = 0; for (let k = 0; k < d.length && k < R0.length; k += 4) if (Math.abs(d[k] - R0[k]) + Math.abs(d[k + 1] - R0[k + 1]) + Math.abs(d[k + 2] - R0[k + 2]) > 60) n++; out.push(n / (d.length / 4)); }
            return out;
          }, part, last));
        }
      }
      else for (let i = 0; i < frames.length; i += 40) {
        const part = frames.slice(i, i + 40).map(f => f.data);
        shares.push(...await pg.evaluate(async (list, acc) => {
          const out = [], cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
          for (const b64 of list) {
            const bm = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${b64}`)).blob());
            cv.width = bm.width; cv.height = bm.height; cx.drawImage(bm, 0, 0);
            const d = cx.getImageData(0, 0, bm.width, bm.height).data;
            let pink = 0;
            // (tinted pink: red well over green, blue over green, not dark — the accent #ff4fd8 washed over anything)
            const hue = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn; if (!dd) return -1; let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return (h * 60 + 360) % 360; };
            const ah = acc ? hue(...acc) : -1;
            for (let k = 0; k < d.length; k += 4) {
              if (!acc) { if (d[k] > 105 && d[k] - d[k + 1] > 55 && d[k + 2] - d[k + 1] > 30) pink++; continue; }
              const r = d[k], g = d[k + 1], bb = d[k + 2], mx = Math.max(r, g, bb), mn = Math.min(r, g, bb), h = hue(r, g, bb);
              if (h >= 0 && mx > 95 && (mx - mn) / mx > 0.35 && Math.min(Math.abs(h - ah), 360 - Math.abs(h - ah)) <= 24) pink++;
            }
            out.push(pink / (d.length / 4));
          }
          return out;
        }, part, accent ? [1, 3, 5].map(i => parseInt(accent.slice(i, i + 2), 16)) : null));
      }
      await pg.close();
      const ts = frames.map(f => (f.t - frames[0].t) * 1000), end = ts[ts.length - 1];
      let before = 0, after = 0, max = 0, worst = null;
      ts.forEach((t, i) => { if (t <= lead && shares[i] > before) before = shares[i]; if (t >= end - settle && shares[i] > after) after = shares[i]; });
      const base = Math.max(before, after), flash = [];
      ts.forEach((t, i) => { if (shares[i] > max) { max = shares[i]; worst = { t: Math.round(t), pink: +shares[i].toFixed(3) }; } if (shares[i] > base + FLASH_OVER) flash.push({ t: Math.round(t), pink: +shares[i].toFixed(3) }); });
      return { frames: frames.length, max: +max.toFixed(3), before: +before.toFixed(3), after: +after.toFixed(3), worst, flash, ms: Math.round(end) };
    },
  };
}
