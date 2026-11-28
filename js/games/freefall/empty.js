// FREEFALL's TEST PAGE — `?empty=1` (FIX C, Group 0 — THE CONTROL; docs/freefall.md "THE TEST PAGE"): the same page, the same canvas size
// + pixel ratio as the game at its top tier, ONE plain spinning mesh, the same kind of frame loop + the same hitch meter as `?fps=2` — NO game,
// NO HTML layer over the canvas while it counts. 30 s from the first frame, then the line (a tap = again). If this hitches at the game's
// rate, the hitches are iPhone Safari's own frame pacing — not our picture, not our page. Never in the cartridge (play.js loads it alone).
import * as THREE from 'three';

const RUN_MS = 30000, HITCH_MS = 33, TICK_MS = 1000 / 60, KIND = ['ours', 'busy', 'gpu'];

export function startEmpty(app, o = {}) {
  const css = 'position:relative;width:min(100vw,calc(100dvh*0.6));height:100%;margin:0 auto;overflow:hidden;background:#07040f;touch-action:none';
  const box = document.createElement('div'); box.className = 'ff-empty'; box.style.cssText = css;
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%';
  const line = document.createElement('div');
  line.style.cssText = 'position:absolute;left:8px;right:8px;top:30%;display:none;text-align:center;font:700 14px/1.45 var(--font-mono, monospace);color:#f4f2ff;white-space:pre-line;text-shadow:0 1px 0 #07040f';
  box.append(canvas, line); app.replaceChildren(box);
  const devDpr = Math.min(window.devicePixelRatio || 1, 3), dpr = Math.min(devDpr, o.dpr > 0 ? o.dpr : 3);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: devDpr < 2, powerPreference: 'high-performance' });
  renderer.setClearColor(0x07040f, 1);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  cam.position.set(0, 0, 6);
  const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.34, 160, 20), new THREE.MeshNormalMaterial());
  scene.add(mesh);
  let w = 0, hh = 0;
  const size = () => { const r = box.getBoundingClientRect(); if (r.width !== w || r.height !== hh) { w = r.width; hh = r.height; renderer.setPixelRatio(dpr); renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); } };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(size) : null; if (ro) ro.observe(box); size();
  // THE METER (stage.js's `?fps=2`, the same rules): a frame over 33 ms after the first second is a HITCH; OUR work = the frame's own JS +
  // the draw call; BUSY = the main thread's longest gap seen by a 4 ms ping; the rest = waiting on the GPU / the compositor ("gpu")
  let pingMax = 0, pingLast = performance.now();
  const ping = setInterval(() => { const t = performance.now(), g = t - pingLast; if (g > pingMax) pingMax = g; pingLast = t; }, 4);
  let t0 = 0, last = 0, frames = 0, hitches = 0, worst = 0, ours = 0, qOurs = 0, qGap = 0, sumWork = 0, done = false, raf = 0;
  const kN = [0, 0, 0], kSum = [0, 0, 0];
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.visibilityState === 'hidden') return;
    const w0 = performance.now(), gap = Math.max(pingMax, w0 - pingLast);
    if (!t0) t0 = now;
    const dt = last ? now - last : TICK_MS; last = now;
    mesh.rotation.y = (now - t0) * 0.0012; mesh.rotation.x = (now - t0) * 0.0005;
    mesh.updateMatrixWorld();
    renderer.render(scene, cam);
    const work = performance.now() - w0;
    if (!done && now - t0 > 1000) {
      frames++; sumWork += work;
      if (dt > HITCH_MS) {
        hitches++; if (dt > worst) worst = dt;
        const o1 = ours > qOurs ? ours : qOurs, busy = Math.max(0, (gap > qGap ? gap : qGap) - 4), wait = Math.max(0, dt - o1 - busy);
        const k = o1 >= busy && o1 >= wait - TICK_MS ? 0 : busy >= wait - TICK_MS ? 1 : 2;
        kN[k]++; kSum[k] += dt;
      } else if (dt > worst) worst = dt;
    }
    qOurs = ours; qGap = gap; ours = work; pingMax = 0; pingLast = performance.now();
    if (!done && now - t0 >= RUN_MS + 1000) { done = true; show(); }
  }
  function show() {
    const order = [0, 1, 2].filter(k => kN[k]).sort((a, b) => kN[b] - kN[a]);
    line.textContent = `EMPTY (the control) · ${(RUN_MS / 1000).toFixed(0)} s · ${frames} frames · ${(frames * 1000 / RUN_MS).toFixed(0)} fps\nHITCH ${hitches} · worst ${worst.toFixed(0)} ms · our work ${(sumWork / (frames || 1)).toFixed(2)} ms a frame\nWHY${order.map(k => ` · ${KIND[k]} ${kN[k]}× (avg ${(kSum[k] / kN[k]).toFixed(0)} ms)`).join('') || ' · no hitch'}\n${Math.round(w)}×${Math.round(hh)} @${dpr}\n\nTAP = AGAIN`;
    line.style.display = 'block';
  }
  const again = () => { if (!done) return; done = false; t0 = 0; last = 0; frames = hitches = worst = sumWork = 0; kN.fill(0); kSum.fill(0); line.style.display = 'none'; };
  box.addEventListener('pointerup', again);
  raf = requestAnimationFrame(frame);
  return {
    state: () => ({ done, frames, hitches, worst, kinds: kN.slice(), dpr, w, h: hh, line: line.textContent }),
    stop() { cancelAnimationFrame(raf); clearInterval(ping); if (ro) ro.disconnect(); renderer.dispose(); },
  };
}
