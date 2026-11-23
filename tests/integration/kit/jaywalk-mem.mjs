// JAYWALK H6B — THE END SCREEN's MEMORY (docs/jaywalk.md "THE END SCREEN's MEMORY"; the owner's /admin: "PAGE KILLED (likely memory) ·
// game:jaywalk/final · iPhone" — iOS ends a tab that runs out of memory): what the page HOLDS on JAYWALK's screen, counted in the page —
// the same sum in any engine (no browser gives a phone's real number):
//   gl      the 3D canvas's drawing buffer (colour + depth: width × height × 4 × 2)
//   bloom   the half-res bloom's three targets (top tier, while the scene is not resting)
//   canvas  every 2D canvas alive on the page that holds pixels (the run's kept picture, the gate sign, the lines' labels, THE
//           MOTHERSHIP's sprite, the share card being built, the city's own …) — every <canvas> in the document + the game's
//           kept picture (detached)
//   pix     = gl + bloom + canvas — THE NUMBER THE BUDGET HOLDS (JW_FINAL_BUDGET_MB)
//   heap    the JS heap (Chromium alone)
// + the scene's own state (resting, its dpr). `browserMb(pid)` = the whole browser's working set (Windows) — printed, never asserted.
import { execSync } from 'node:child_process';

/** the budget for JAYWALK's FINAL screen at 390 × 844 (MB of pixels held — `pix`), any pixel ratio: measured after H6B's fix = 7.6
 *  on a solo final (five runs in a row, flat) · 7.3 – 9.6 on a match's (the city's own backdrop is 2.2 of it) · ≈ 14 with THE
 *  MOTHERSHIP's sprite up behind the gold finish — + room. Before the fix: 40 solo @3 (the 3D buffer 22.6 + bloom 7.1 + the run's
 *  whole-frame picture 10.1), 46 – 48 a match @3 (29.7 – 32 measured @2). RAISING IT IS A DECISION. */
export const JW_FINAL_BUDGET_MB = 20;

export const memAt = page => page.evaluate(async () => {
  const MB = 1048576, J = window.__jwGame, s = J ? J.state() : null, i = (s && s.info) || {};
  const gl = document.querySelector('canvas.jw-canvas'), glMb = gl ? gl.width * gl.height * 8 / MB : 0;
  const W = (i.w || 0) * (i.dpr || 0), H = (i.h || 0) * (i.dpr || 0);
  const bloomMb = i.tier === 2 && !i.rest ? (W / 2 * H / 2 * 8 + 2 * (W / 4) * (H / 4) * 4) / MB : 0;
  let cv = 0, n = 0; const big = [];
  const name = c => { let e = c, t = ''; for (let k = 0; e && k < 3 && !t; k++, e = e.parentElement) t = e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : ''; return t || 'canvas'; };
  for (const c of document.querySelectorAll('canvas')) if (c !== gl && c.width > 0) { const b = c.width * c.height * 4; cv += b; n++; if (b > MB / 2) big.push(`${name(c)} ${c.width}×${c.height}`); }
  try { const S = await import('/js/games/jaywalk/shot.js'), k = S.shotFor(s && s.matchId); if (k && k.canvas && k.canvas.width > 0 && !k.canvas.isConnected) { cv += k.canvas.width * k.canvas.height * 4; n++; big.push(`the run's picture ${k.canvas.width}×${k.canvas.height}`); } } catch { /* no picture kept */ }
  const r = v => Math.round(v * 10) / 10;
  // (JT2's add-on — THE SEASONAL PACK behind the final screen: nothing of it alive — the fall's particles, the footprints, the burst piles, the
  //  fireworks' canvas + sparks (season.sp — seasonal.js#info); no pack this run = nothing to hold)
  const sp = s && s.season && s.season.sp, fw = sp && sp.fw;
  const seasonRest = !sp || (sp.resting === true && !sp.fall && !sp.prints && !sp.bursts && !sp.skySnow && (!fw || (fw.px === 0 && fw.sparks === 0)));   // (VARIETY B1: + the skyline snow — whichever season's pack is in)
  const season = sp ? `${s.season.day} ${s.season.autumn > 0 ? 'autumn ' : ''}${s.season.winter > 0 ? 'winter ' : ''}${s.season.snowfall !== 'none' ? s.season.snowfall + ' snow ' : ''}${fw && fw.kind ? 'fireworks ' : ''}— fall ${sp.fall} · prints ${sp.prints} · piles burst ${sp.bursts} · fireworks ${fw ? `${fw.px} px ${fw.sparks} sparks` : 'none'}` : 'no pack';
  return { seasonRest, season, gl: r(glMb), bloom: r(bloomMb), canvas: r(cv / MB), canvases: n, pix: r(glMb + bloomMb + cv / MB), heap: performance.memory ? r(performance.memory.usedJSHeapSize / MB) : null,
    rest: i.rest == null ? null : i.rest, dpr: i.dpr, big, buf: gl ? `${gl.width}×${gl.height}` : '' };
});
/** the whole browser's memory (MB) — every chrome.exe under the launched one (Windows); null elsewhere */
export function browserMb(pid) {
  if (process.platform !== 'win32' || !pid) return null;
  try {
    const out = execSync(`powershell -NoProfile -Command "$all = Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Select-Object ProcessId,ParentProcessId,WorkingSetSize; $ids = @(${pid}); do { $n = $ids.Count; $ids = @($ids + ($all | Where-Object { $ids -contains $_.ParentProcessId } | ForEach-Object { $_.ProcessId })) | Select-Object -Unique } while ($ids.Count -ne $n); ($all | Where-Object { $ids -contains $_.ProcessId } | Measure-Object WorkingSetSize -Sum).Sum"`, { encoding: 'utf8', timeout: 20000 });
    return Math.round(Number(out.trim()) / 1048576);
  } catch { return null; }
}
export const memLine = (tag, m, mb) => `MEM ${tag}: ${m.pix} MB held (the 3D buffer ${m.gl} [${m.buf} @${m.dpr}] + bloom ${m.bloom} + ${m.canvases} canvases ${m.canvas}${m.big && m.big.length ? ': ' + m.big.join(', ') : ''})${m.heap == null ? '' : ` · JS heap ${m.heap}`}${mb == null ? '' : ` · the browser ${mb}`} · ${m.rest ? 'RESTING' : m.rest === 0 ? 'live' : 'no rest (old code)'}`;
/** the season's line (JT2): what of THE SEASONAL PACK is still alive behind the final screen */
export const seasonLine = (tag, m) => `SEASON ${tag}: ${m.seasonRest ? 'at rest' : 'STILL ALIVE'} — ${m.season}`;
