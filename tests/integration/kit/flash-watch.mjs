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

export async function flashWatch(browser, cdp, { width = 195, height = 422 } = {}) {
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
      for (let i = 0; i < frames.length; i += 40) {
        const part = frames.slice(i, i + 40).map(f => f.data);
        shares.push(...await pg.evaluate(async list => {
          const out = [], cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
          for (const b64 of list) {
            const bm = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${b64}`)).blob());
            cv.width = bm.width; cv.height = bm.height; cx.drawImage(bm, 0, 0);
            const d = cx.getImageData(0, 0, bm.width, bm.height).data;
            let pink = 0;
            // (tinted pink: red well over green, blue over green, not dark — the accent #ff4fd8 washed over anything)
            for (let k = 0; k < d.length; k += 4) if (d[k] > 105 && d[k] - d[k + 1] > 55 && d[k + 2] - d[k + 1] > 30) pink++;
            out.push(pink / (d.length / 4));
          }
          return out;
        }, part));
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
