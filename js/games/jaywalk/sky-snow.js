// JAYWALK — THE SKYLINE SNOW (VARIETY B1 — docs/jaywalk.md "VARIETY B1"): on a snow day the falling snow goes on OVER the painted skyline
// band (the 3D snow stops at the sea wall). ONE small DOM layer inside `.jw-skyline` (under the sea wall): two tiled flake layers — the far
// one smaller + slower (depth) — each moved by a transform-only CSS animation (the compositor: no draw call, no frame work). Light = fewer +
// fainter flakes, heavy = more + whiter; by night a cool dim blue-white. Reduce motion: still flakes. Lives in THE SEASONAL PACK (winter).
const CSS = `
.jw-sky-snow { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.jw-sky-snow[hidden] { display: none; }
.jw-sky-snow i { position: absolute; left: -12%; right: -12%; top: -360px; bottom: 0; will-change: transform; animation: jw-sky-fall 15s linear infinite; }
.jw-sky-snow i + i { top: -240px; animation-duration: 22s; }
@keyframes jw-sky-fall { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-120px, 360px, 0); } }
.jw-sky-snow i + i { animation-name: jw-sky-fall-far; }
@keyframes jw-sky-fall-far { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-80px, 240px, 0); } }
.jw-sky-snow i { --f: rgba(255, 255, 255, 0.96); background-size: 120px 120px;
  background-image: radial-gradient(circle at 12% 18%, var(--f) 0 1.5px, transparent 2.3px), radial-gradient(circle at 63% 9%, var(--f) 0 1.3px, transparent 2.1px),
    radial-gradient(circle at 38% 52%, var(--f) 0 1.6px, transparent 2.4px), radial-gradient(circle at 86% 61%, var(--f) 0 1.2px, transparent 2px),
    radial-gradient(circle at 21% 83%, var(--f) 0 1.4px, transparent 2.2px), radial-gradient(circle at 72% 88%, var(--f) 0 1.5px, transparent 2.3px); }
.jw-sky-snow i + i { background-size: 80px 80px;
  background-image: radial-gradient(circle at 30% 25%, var(--f) 0 0.9px, transparent 1.5px), radial-gradient(circle at 78% 42%, var(--f) 0 1px, transparent 1.6px),
    radial-gradient(circle at 15% 70%, var(--f) 0 0.9px, transparent 1.5px), radial-gradient(circle at 58% 86%, var(--f) 0 1px, transparent 1.6px),
    radial-gradient(circle at 92% 8%, var(--f) 0 0.8px, transparent 1.4px); }
.jw-sky-snow[data-fall='light'] i { background-size: 120px 180px; opacity: 0.72; }
.jw-sky-snow[data-fall='light'] i + i { background-size: 80px 120px; opacity: 0.6; }
/* (every tile divides its loop: across 120 / 80 px, down 360 / 240 px — the flakes never jump at the loop) */
.jw-sky-snow[data-look='night'] i { --f: rgba(214, 226, 255, 0.78); }
@media (prefers-reduced-motion: reduce) { .jw-sky-snow i { animation: none; } }
`;
let styled = false;

/** → { set(fall 'none' | 'light' | 'heavy', day), rest(on), destroy() } — `sky` = the `.jw-skyline` element (built on the first snow) */
export function createSkySnow(sky) {
  let el = null, fall = '', look = '', off = false;
  function make() {
    if (!styled) { const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); styled = true; }
    el = document.createElement('div'); el.className = 'jw-sky-snow'; el.setAttribute('aria-hidden', 'true');
    el.append(document.createElement('i'), document.createElement('i'));
    const wall = sky.querySelector('.jw-seawall');
    if (wall) sky.insertBefore(el, wall); else sky.append(el);
  }
  return {
    set(f, day) {
      const m = f === 'light' || f === 'heavy' ? f : '';
      if (!m && !el) return;
      if (!el) make();
      if (m !== fall) { fall = m; if (m) el.dataset.fall = m; }
      const lk = day ? 'day' : 'night';
      if (lk !== look) { look = lk; el.dataset.look = lk; }
      const hide = !m || off;
      if (el.hidden !== hide) el.hidden = hide;
    },
    /** behind a final screen: nothing composited */
    rest(on) { off = !!on; if (el) el.hidden = off || !fall; },
    destroy() { if (el) el.remove(); el = null; },
    info: () => (el && !el.hidden ? fall : ''),
  };
}
