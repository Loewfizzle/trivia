// THE FIT CHECKS (DAILY B "4 TICKETS FIT" → HIGH RISE DAILY B "5 TICKETS FIT" — the owner, Nov 21): the preview page (the REAL screen, a scripted
// `today`) at the phones, both looks, every ticket state: at 390 × 844 + 430 × 932 the header + THE SWEEP (5 segments) + ALL FIVE tickets +
// SHARE TODAY (when shown) + the countdown on screen with NO scroll; at 375 × 667 the list may scroll (the compact ticket) — no name / line
// clipped anywhere. Shared by e2e-daily.mjs + e2e-jaywalk-daily-run.mjs.
import { guardUrl } from './live-guard.mjs';

export const FIT_STATES = Object.freeze([
  'state=waiting&drop=1&jw=before&hr=before&best=1',
  'state=one&drop=1&jw=between&hr=progress&best=1',
  'state=one&drop=1&jw=between&hr=play&best=1&jwlast=888&jwbest=888',
  'state=swept&drop=1&dropst=done&jw=done&hr=done',
  'state=swept&drop=1&dropst=done&jw=gold&hr=gold&gold=password',
]);
export async function fitChecks({ browser, BASE, ok, sleep, waitFor, name = 'fit' }) {
  const pv = await browser.newPage();
  for (const [w, h] of [[375, 667], [390, 844], [430, 932]]) for (const lk of ['night', 'day']) for (const q of FIT_STATES) {
    await pv.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await pv.goto(guardUrl(`${BASE}/tests/integration/daily-preview.html?${q}&look=${lk}`, name));
    await waitFor(pv, `document.body.dataset.ready === '1' && document.querySelectorAll('.dy-ticket').length === 5`, `the preview ${q}`, 20000);
    await sleep(120);
    const f = await pv.evaluate(() => {
      const ts = [...document.querySelectorAll('.dy-ticket')], last = ts[ts.length - 1].getBoundingClientRect(), head = document.querySelector('.dy-sign').getBoundingClientRect(), meter = document.querySelector('.dy-sweep').getBoundingClientRect();
      const share = document.querySelector('.dy-share'), next = document.querySelector('.dy-next');
      const clipped = [...document.querySelectorAll('.dy-ticket .dy-name, .dy-ticket .dy-nw, .dy-ticket .dy-result')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
      for (const e of document.querySelectorAll('.dy-ticket .dy-result.is-last')) { const rg = document.createRange(); rg.selectNodeContents(e); const r = rg.getBoundingClientRect(), b = e.getBoundingClientRect(); if (r.height > parseFloat(getComputedStyle(e).fontSize) * 1.6 || r.right > b.right + 0.5) clipped.push(`${e.textContent} (wraps / cut)`); }
      const sc = document.querySelector('.dy-scroll');
      return { bottom: Math.round(last.bottom), share: share ? Math.round(share.getBoundingClientRect().bottom) : 0, next: next ? Math.round(next.getBoundingClientRect().bottom) : 0, H: innerHeight,
        head: Math.round(head.top), meter: Math.round(meter.top), segs: document.querySelectorAll('.dy-seg').length, clipped, scrolls: sc ? sc.scrollHeight > sc.clientHeight + 1 : false };
    });
    const tag = `FIT ${w}x${h} ${lk} ${q.replace(/state=|&drop=1|&dropst=done|&jwbest=\d+|&best=1/g, '')}`;
    if (w === 375) ok(f.segs === 5 && !f.clipped.length && f.meter > f.head, `${tag}: 5 tickets, THE SWEEP (5), nothing clipped (the list may scroll${f.scrolls ? ' — it does' : ''})${f.clipped.length ? ` — CLIPPED ${f.clipped.join(' | ')}` : ''}`);
    else ok(!f.scrolls && f.bottom <= f.H && f.share <= f.H && f.next <= f.H && f.head >= 0 && f.meter > f.head && f.segs === 5 && !f.clipped.length,
      `${tag}: NO scroll — the 5th ticket ends at ${f.bottom}${f.share ? `, SHARE TODAY at ${f.share}` : ''}, the countdown at ${f.next} of ${f.H}${f.clipped.length ? ` — CLIPPED ${f.clipped.join(' | ')}` : ''}${f.scrolls ? ' — SCROLLS' : ''}`);
  }
  await pv.close();
}
