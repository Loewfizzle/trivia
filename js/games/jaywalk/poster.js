// JAYWALK — THE POSTER (H4 — the owner, Nov 16: rendered from the game itself, never Grok; docs/jaywalk.md "THE POSTER"). The lab's
// `?poster=1`: ONE hero frame staged in the real night scene — the kid mid-hop, big in frame, onto a road with a car + its light trails,
// a log on the water behind, the skyline over it — at THE TRI-VISION board's size (assets/city/jaywalk/billboard.webp: 848 × 448), drawn at
// 2× and 1×, the LEFT PART DARK + CALM for the board's own words (as the art it replaces). The city chat swaps it in; this page only
// makes the picture. ZERO server calls, no writes (the lab's rule): the page's own files only. A VIEW: it sets a run's state by hand to
// pose it — nothing here is a rule or a result.
import { h } from '../../ui/dom.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { FP, HOP_TICKS } from './tuning.js';
import { createCourse, moverLeft } from './course.js';
import { createRun } from './engine.js';
import { createNight } from './night.js';

export const POSTER = Object.freeze({ w: 848, h: 448, zoom: 7, kid: '#ff2bd6', col: 5,
  // THE HERO CAMERA: low, in front of the kid + a little to his right, looking back up the course past him — his face, the road he
  // just left with its car + streaks, the log on the water behind, the far lanes going into the night (the skyline sits over them)
  hero: { at: [1.25, 1.0, 4.1], look: [-1.15, 1.42, -2.2], fov: 36 } });

/** the staged moment: a grass lane under a road under water; a tick when a car has JUST passed on the kid's right (driving away: both
 *  tail lights + its two neon streaks between them) and nothing else is near; a log near the middle of the lane behind →
 *  { seed, lane, tick } (PURE — the same picture every time). The kid hops BACK off the road toward the camera: his face shows. */
export function findStage(seeds = ['poster', 'poster2', 'poster3', 'poster4', 'poster5', 'poster6']) {
  const kx = POSTER.col * FP + FP / 2;
  for (const seed of seeds) {
    const course = createCourse(seed);
    for (let L = 14; L < 140; L++) {
      const A = course.lane(L), B = course.lane(L + 1), C = course.lane(L + 2);
      if (A.type !== 'grass' || A.mark || A.obs[POSTER.col] || B.type !== 'road' || B.dir < 0 || C.type !== 'water') continue;
      for (let t = 600; t < 600 + B.period / B.v + 400; t += 2) {
        const cars = B.items.map(it => ({ l: moverLeft(B, it, t), len: it.len }));
        if (cars.some(c => c.l < kx + 700 && c.l + c.len > kx - 2600)) continue;                       // (nothing on him, nothing in the words' side)
        if (!cars.some(c => c.l > kx + 750 && c.l < kx + 1150 && c.len <= 1000)) continue;            // (a car just past him on his right, whole in the frame)
        if (!C.items.some(it => { const l = moverLeft(C, it, t); return l > 2200 && l + it.len < 8400 && it.len >= 2000; })) continue;   // (a log behind him)
        return { seed, lane: L, tick: t };
      }
    }
  }
  return { seed: seeds[0], lane: 20, tick: 600 };
}

/** the picture: the scene's frame + the skyline over its top + the dark left for the words → a canvas `w` px wide */
function compose(frame, sky, w) {
  const hgt = Math.round(w * POSTER.h / POSTER.w), cv = document.createElement('canvas');
  cv.width = w; cv.height = hgt;
  const c = ctx2d(cv);
  if (!c) return null;
  c.drawImage(frame, 0, 0, w, hgt);
  if (sky) {
    // the skyline band (the top 31 % — over the far lanes' night, above the kid's head): the picture's buildings, its foot fading out
    const bh = Math.round(hgt * 0.31), band = document.createElement('canvas');
    band.width = w; band.height = bh;
    const b = ctx2d(band);
    if (b) {
      const sw = sky.naturalWidth, sh = sky.naturalHeight, k = w / sw, srcH = bh / k;
      b.drawImage(sky, 0, Math.max(0, sh * 0.5 - srcH * 0.62), sw, srcH, 0, 0, w, bh);
      const g = b.createLinearGradient(0, 0, 0, bh); g.addColorStop(0, '#000'); g.addColorStop(0.6, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      b.globalCompositeOperation = 'destination-in'; b.fillStyle = g; b.fillRect(0, 0, w, bh);
      c.drawImage(band, 0, 0);
    }
  }
  // THE LEFT PART: dark + calm — the board's own words stand there
  let g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'rgba(5,4,12,1)'); g.addColorStop(0.27, 'rgba(5,4,12,0.97)'); g.addColorStop(0.5, 'rgba(5,4,12,0.3)'); g.addColorStop(0.6, 'rgba(5,4,12,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, hgt);
  g = c.createLinearGradient(0, hgt * 0.8, 0, hgt); g.addColorStop(0, 'rgba(5,4,12,0)'); g.addColorStop(1, 'rgba(5,4,12,0.55)');
  c.fillStyle = g; c.fillRect(0, hgt * 0.8, w, hgt * 0.2);
  return cv;
}

export async function mountPoster(app) {
  const host = h('div.jw-poster-stage', { style: { width: `${POSTER.w}px`, height: `${POSTER.h}px` } });
  const out = h('div.jw-poster-out'), note = h('p.jw-poster-note', 'Rendering the poster…');
  app.replaceChildren(h('section.jw-poster', h('div.jw-lab-k', 'NEON SPEAKEASY · THE JAYWALK LAB'), h('h1', 'THE POSTER'), out, note, h('div.jw-poster-work', host)));
  let night;
  try { night = createNight(host, { kidColor: POSTER.kid, zoom: POSTER.zoom, hero: POSTER.hero, angle: 'straight', tier: 2 }); }
  catch { note.textContent = 'This browser can’t draw the poster here (it has no WebGL).'; return; }
  const S = findStage(), course = createCourse(S.seed), run = createRun({ seed: S.seed, mode: 'solo' });
  // the pose: mid-hop BACK off the road onto the grass — toward the camera (a view-only state — never a run's result)
  Object.assign(run, { t: S.tick, y: S.lane + 1, best: S.lane + 1, x: POSTER.col * FP + FP / 2, wall: (S.lane - 7) * FP, st: 'hop', fx: POSTER.col * FP + FP / 2, fy: S.lane + 1, tx: POSTER.col * FP + FP / 2, ty: S.lane, k: Math.floor(HOP_TICKS / 2) });
  const sky = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = new URL('../../../assets/jaywalk/skyline-night.webp', import.meta.url).href; });
  await night.ready;
  // a few frames for the camera, the kid's turn + the tiers to settle — then the frame is taken
  for (let i = 0; i < 40; i++) { night.draw(run, course, 0.35, 16.7); await new Promise(r => requestAnimationFrame(r)); }
  const frame = await new Promise(res => { night.snap(res, POSTER.w * 2); night.draw(run, course, 0.35, 16.7); });
  const c2 = frame ? compose(frame, sky, POSTER.w * 2) : null, c1 = frame ? compose(frame, sky, POSTER.w) : null;
  night.destroy(); host.parentNode.remove();
  if (!c2 || !c1) { note.textContent = 'The poster could not be drawn on this phone.'; return; }
  c1.className = 'jw-poster-img';
  const link = (cv, name, label) => { const a = h('a.jw-a', { download: name }, label); cv.toBlob(b => { if (b) a.href = URL.createObjectURL(b); }, 'image/png'); return a; };
  out.replaceChildren(c1);
  note.replaceChildren(link(c2, 'jaywalk-poster-1696x896.png', 'SAVE THE 2× PNG'), ' · ', link(c1, 'jaywalk-poster-848x448.png', 'SAVE THE 1× PNG'));
  window.__jwPoster = { c1, c2, stage: S };
}
