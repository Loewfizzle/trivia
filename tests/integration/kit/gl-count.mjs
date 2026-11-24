// JAYWALK FINAL — THE GL-CALL COUNTER (Grok's review): what a frame asks of WebGL, counted in the page, so an upload regression shows without a
// GPU timer — bufferSubData calls + their KB, bufferData KB, draw calls, useProgram switches; per frame (requestAnimationFrame), from a reset.
//   import { glCount, glRead } from './kit/gl-count.mjs';  await glCount(page);  …  await glRead(page)  // → { frames, sub, subKB, dataKB, draws, progs } per frame
/** in the page: wraps the WebGL (1 + 2) prototypes once — three calls the context's methods, so a wrap after the context was made still counts */
const install = () => {
  if (window.__glc) { window.__glc.reset(); return true; }
  const C = { frames: 0, sub: 0, subB: 0, dataB: 0, draws: 0, progs: 0 };
  const bytes = (a, at) => { const v = a[at]; if (!v || typeof v !== 'object') return typeof v === 'number' ? v : 0; const n = a[at + 2]; return n > 0 ? n * (v.BYTES_PER_ELEMENT || 1) : v.byteLength || 0; };
  for (const P of [window.WebGL2RenderingContext, window.WebGLRenderingContext].filter(Boolean).map(c => c.prototype)) {
    const wrap = (name, f) => { const o = P[name]; if (typeof o !== 'function') return; P[name] = function (...a) { f(a); return o.apply(this, a); }; };
    wrap('bufferSubData', a => { C.sub++; C.subB += bytes(a, 2); });
    wrap('bufferData', a => { C.dataB += bytes(a, 1); });
    for (const d of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) wrap(d, () => { C.draws++; });
    wrap('useProgram', () => { C.progs++; });
  }
  const loop = () => { C.frames++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__glc = { C, reset() { for (const k of Object.keys(C)) C[k] = 0; } };
  return true;
};
export const glCount = p => p.evaluate(install);
export const glReset = p => p.evaluate(() => window.__glc && window.__glc.reset());
/** → per frame since the last reset: { frames, sub, subKB, dataKB, draws, progs } */
export const glRead = p => p.evaluate(() => {
  const C = window.__glc ? window.__glc.C : null, n = C && C.frames ? C.frames : 1;
  if (!C) return null;
  const r = x => Math.round(x * 10) / 10;
  return { frames: C.frames, sub: r(C.sub / n), subKB: r(C.subB / n / 1024), dataKB: r(C.dataB / n / 1024), draws: r(C.draws / n), progs: r(C.progs / n) };
});
export const glLine = g => (g ? `bufferSubData ${g.sub} (${g.subKB} KB) · bufferData ${g.dataKB} KB · draws ${g.draws} · useProgram ${g.progs} a frame` : 'no GL count');
