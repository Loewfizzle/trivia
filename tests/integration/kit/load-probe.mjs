// THE LOAD FIX (Nov 6) — THE LOAD PROBE: one frame record a frame from the first paint to ~6 s after the reveal, installed BEFORE the page
// mounts (puppeteer's evaluateOnNewDocument / Playwright's addInitScript: `PROBE` is a plain function, no imports), and `judge(dump)` — the
// four load problems the owner saw on his iPhone, each as frames:
//   doubled — the city shown while a live layer + the crisp lettering stand at one camera and the baked city (or the lit windows) at
//             another (`harbor().cams`: the shown bake's camera ≠ the camera now), or the city canvas CSS-scaled to a box it was not
//             built for while the crisp layer is not (no resize pin): every sign's lettering drawn twice, the copy a little lower
//   chunks  — a piece of the title (the sign, the dock, the corner buttons) more than a step ahead of the city's own fade while it comes
//             in (ONE fade: everything comes in together)
//   net     — the #net pill (SIGNAL LOST) visible with no lost signal (state.net never 'lost' here)
//   stray   — a frame that is neither the boot screen nor the city: THE DARK TITLE (the sign + the dock over black, no city yet — the
//             owner's "whole different screen"), another screen in #stage, the glitch flash, the bare shell's grid, the page unstyled —
//             with the boot screen no longer covering it
// "seen" = the element's opacity through its ancestors × what the boot screen (opaque, on top) leaves showing.

/* eslint-disable no-undef */
export function PROBE() {
  if (window.__lp) return;
  const F = [], t0 = performance.now();
  let revealT = null, stop = 1e9;
  const eff = el => {   // the opacity the eye gets through the ancestors (0 when hidden)
    if (!el || !el.isConnected) return 0;
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none') return 0;
      if (e === el && cs.visibility === 'hidden') return 0;
      o *= +cs.opacity;
      if (o < 0.005) return 0;
    }
    return o;
  };
  const r2 = v => Math.round(v * 100) / 100;
  const tick = () => {
    const now = performance.now();
    const boot = document.getElementById('boot');
    const bootOp = boot ? eff(boot) : 0;
    const show = 1 - bootOp;   // (the boot screen is opaque + on top of the shell: what it leaves showing)
    const cssReady = document.documentElement.classList.contains('css-ready');
    let hb = null; try { hb = window.__district && window.__district.loadProbe ? window.__district.loadProbe() : null; } catch { /* mounting */ }
    const wrap = document.querySelector('.nd-scene'), cv = wrap && wrap.querySelector('canvas:not(.hc-crisp)');
    const sceneOp = wrap ? eff(wrap) : 0;
    const screens = [...document.querySelectorAll('#stage > section.screen')].map(s => ({ c: s.className.split(/\s+/).filter(c => /^(title-screen|boot-screen)$/.test(c) || !/^(screen|screen-in|nd|nd-c2|seq-|is-|nd-)/.test(c)).join(' '), o: r2(eff(s)) }));
    const piece = sel => { const e = document.querySelector(sel); return e ? r2(eff(e)) : 0; };
    const net = document.getElementById('net');
    const netOp = net && getComputedStyle(net).visibility !== 'hidden' ? eff(net) : 0;
    const bg = document.querySelector('body > .bg');
    const bgOp = bg && cssReady ? eff(bg) : 0;
    let mis = 0, pinned = false, crispN = 0;
    if (hb && cv && hb.W) {
      pinned = !!cv.style.width;
      const cw = cv.clientWidth, ch = cv.clientHeight, W = hb.W, H = hb.H;
      if (!pinned && W && H && (Math.abs(cw - W) > 1 || Math.abs(ch - H) > 1)) {
        // object-fit: cover, anchored at the bottom middle — where a point near the top of the city lands vs where the crisp layer puts it
        const s = Math.max(cw / W, ch / H), y = H * 0.3; mis = Math.round(Math.abs((ch - (H - y) * s) - y));
      }
      crispN = wrap.querySelectorAll('canvas.hc-crisp:not([style*="display: none"])').length;
    }
    const cams = hb && hb.cams ? hb.cams : null;
    const shown = !!(hb && hb.shown);
    if (shown && revealT == null) { revealT = now; stop = now + 6500; }
    F.push({
      t: Math.round(now - t0), boot: r2(bootOp), css: cssReady, scene: r2(sceneOp), shown,
      sign: piece('.nd-sign'), dock: piece('.nd-actions'), corner: Math.max(piece('.menu-btn'), piece('.music-btn')), gate: piece('.nd-gate'),
      screens, net: r2(netOp), netOn: !!(net && net.classList.contains('is-on')), netState: window.__arcade && window.__arcade.state ? window.__arcade.state.net : null,
      glitch: !!document.querySelector('.glitch-flash'), bg: r2(bgOp), show: r2(show),
      hold: hb && hb.hold ? hb.hold : 0, holdOp: (() => { const hc = wrap && wrap.querySelector('canvas.hc-hold'); return hc ? r2(eff(hc)) : 0; })(),
      stale: !!(cams && shown && ((cams.baked && cams.baked !== cams.now) || (cams.prev && cams.prev !== cams.now) || cams.lit === false)), cams: cams ? `${cams.prev ? `${cams.prev} + ` : ''}${cams.baked}→${cams.now}${cams.lit === false ? ' lit-old' : ''}` : '',
      mis, pinned, crispN, vh: innerHeight,
    });
    if (now < stop) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__lp = { frames: F, dump: () => ({ frames: F, revealMs: revealT == null ? null : Math.round(revealT - t0) }) };
}

/** the four problems from a dump → { doubled, chunks, net, stray }: each { n (bad frames), what (the first few, readable), at (ms) } */
export function judge(D) {
  const out = { doubled: { n: 0, what: '', at: [] }, chunks: { n: 0, what: '', at: [] }, net: { n: 0, what: '', at: [] }, stray: { n: 0, what: '', at: [] } };
  if (!D || !D.frames) { for (const k of Object.keys(out)) out[k] = { n: 1, what: 'no probe', at: [] }; return out; }
  const add = (k, f, why) => { const o = out[k]; o.n++; if (o.at.length < 6) { o.at.push(f.t); o.what += `${o.what ? '; ' : ''}${f.t} ms ${why}`; } };
  for (const f of D.frames) {
    const cityShown = f.scene * f.show;   // (the city as the eye gets it)
    // 1. DOUBLED: the city on screen (past the first 2 % of its fade) with two cameras in it
    // (THE LOAD FIX: a picture HELD over the city — scene.js#holdStart — hides what is under it while it is fully opaque)
    const covered = f.holdOp >= 0.995;
    if (cityShown > 0.02 && f.stale && !covered) add('doubled', f, `the bake at another camera (${f.cams}${f.holdOp ? `, the held picture at ${Math.round(f.holdOp * 100)} %` : ''})`);
    else if (cityShown > 0.02 && f.mis > 1 && f.crispN && !covered) add('doubled', f, `the city canvas CSS-scaled, the crisp layer not (${f.mis} pt apart)`);
    // 2. CHUNKS: the city on its way in (2–98 %), a piece of the title more than a step ahead of it (ONE fade: everything together)
    const ahead = Math.max(f.sign, f.dock, f.corner) * f.show - cityShown;
    if (cityShown > 0.02 && ahead > 0.15) add('chunks', f, `${['sign', 'dock', 'corner'].filter(k => f[k] * f.show - cityShown > 0.15).join(' + ')} seen at ${Math.round(Math.max(f.sign, f.dock, f.corner) * f.show * 100)} % over a city at ${Math.round(cityShown * 100)} %`);
    // 3. THE #net PILL: visible with no lost signal
    if (f.net > 0.01 && f.netState !== 'lost') add('net', f, `the #net pill at ${Math.round(f.net * 100)} % (net ${f.netState || '—'}${f.netOn ? ', is-on' : ''}${f.css ? '' : ', before css-ready'})`);
    // 4. THE STRAY SCREEN: something that is neither the boot screen nor the city, with the boot screen not covering it
    if (f.show > 0.02) {
      const other = f.screens.filter(s => s.o > 0.02 && !/title-screen/.test(s.c));
      if (other.length) add('stray', f, `the "${other.map(s => s.c || 'screen').join(', ')}" screen at ${Math.round(Math.max(...other.map(s => s.o)) * f.show * 100)} %`);
      else if (cityShown <= 0.02 && Math.max(f.sign, f.dock, f.corner) * f.show > 0.15) add('stray', f, `THE DARK TITLE — the ${['sign', 'dock', 'corner'].filter(k => f[k] * f.show > 0.15).join(' + ')} over black, no city (${Math.round(Math.max(f.sign, f.dock, f.corner) * f.show * 100)} %)`);
      else if (f.glitch) add('stray', f, 'the glitch flash');
      else if (f.bg * f.show > 0.02) add('stray', f, `the bare shell's grid (.bg) at ${Math.round(f.bg * f.show * 100)} %`);
      else if (!f.css) add('stray', f, 'the page unstyled (no css-ready) under a fading boot screen');
    }
  }
  return out;
}

// LOAD FIX 2 — NOTHING IN THE SKY CHANGES BY A CUT after the reveal. SKY_REC (an init script) records loadProbe().sky every frame from
// the reveal for `ms`: [t, plans, cuts, cur, old, x, key, jumps, step]. skyJudge(frames) → the snaps: a CUT (a set on screen dropped by a
// re-plan — clouds.js#plan counts it), the shown clouds falling > 25 % in ONE frame, any one cloud jumping > 4 pt in one frame (wraps off
// screen ignored).
export const SKY_REC = (ms = 8000) => `(() => {
  const R = window.__sk = { frames: [], shownAt: -1 };
  const tick = () => {
    try { const p = window.__district && window.__district.loadProbe && window.__district.loadProbe();
      if (p && p.shown) { const t = performance.now(); if (R.shownAt < 0) R.shownAt = t; if (t - R.shownAt <= ${ms} && p.sky) R.frames.push([Math.round(t - R.shownAt), p.sky.plans, p.sky.cuts, p.sky.cur, p.sky.old, p.sky.x, p.sky.key, p.sky.jumps || 0, p.sky.step == null ? null : p.sky.step]); }
    } catch {}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();`;
export function skyJudge(F) {
  const snaps = [];
  for (let i = 1; i < F.length; i++) {
    const [t, , cuts, cur, old, x, key] = F[i], [, , cuts0, cur0, old0, x0, key0] = F[i - 1];
    const m = cur + old, m0 = cur0 + old0;
    if (cuts > cuts0) snaps.push(`${t} ms: a CUT (a set on screen dropped)`);
    else if (m0 > 0.5 && m < m0 * 0.75) snaps.push(`${t} ms: the shown clouds ${m0} → ${m} in one frame`);
    // (one cloud's own move in a frame — clouds.js#probe's step; an older build without it: the set's mean place, which a wrap can trip)
    const st = F[i][8];
    if (st != null) { if (key === key0 && st > 4) snaps.push(`${t} ms: a cloud jumped ${st} pt in one frame`); }
    else if (key === key0 && x != null && x0 != null && Math.abs(x - x0) > 4) snaps.push(`${t} ms: the set's place jumped ${x0} → ${x} pt`);
  }
  const plans = F.length ? F[F.length - 1][1] - F[0][1] : 0;
  const planAt = F.filter((f, i) => i && f[1] !== F[i - 1][1]).map(f => f[0]);
  return { snaps, plans, planAt, jumps: F.length ? F[F.length - 1][7] : 0 };
}

// LOAD FIX 5 — NO TWO CAMERAS (the owner's DOUBLED CITY, Nov 11: the city's box grew before the reveal with no window resize — the canvas
// stayed CSS-fitted to a box it was not built for, the crisp lettering did not: every sign twice, for good). CAM_REC (an init script, a
// plain function) records EVERY frame for the whole run — not only the load: what the eye gets of the city, the held picture, the size the
// city was BUILT for vs its canvas's box now, the resize pin, the cameras (now · the bake on screen · the one fading out · the lit
// windows'), the crisp canvases, and how many scenes / main canvases / frame loops are alive. camJudge(frames) → the frames with TWO
// CAMERAS ON SCREEN. `window.__cam.mark(label)` stamps the run's steps into the record.
export function CAM_REC() {
  if (window.__cam) return;
  const F = [], marks = [], t0 = performance.now();
  const eff = el => { if (!el || !el.isConnected) return 0; let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none') return 0; if (e === el && cs.visibility === 'hidden') return 0; o *= +cs.opacity; if (o < 0.005) return 0; } return o; };
  const r2 = v => Math.round(v * 100) / 100;
  const tick = () => {
    const now = performance.now();
    let hb = null; try { hb = window.__district && window.__district.loadProbe ? window.__district.loadProbe() : null; } catch { /* mounting */ }
    const wraps = document.querySelectorAll('.nd-scene'), wrap = wraps[0] || null, cv = wrap && wrap.querySelector('canvas:not([class])');
    const boot = document.getElementById('boot'), show = 1 - (boot ? eff(boot) : 0);
    const f = { t: Math.round(now - t0), shown: !!(hb && hb.shown), city: r2((wrap ? eff(wrap) : 0) * show), scenes: wraps.length, mains: wrap ? wrap.querySelectorAll('canvas:not([class])').length : 0, vis: document.visibilityState };
    if (hb && cv && hb.W) {
      const hc = wrap.querySelector('canvas.hc-hold');
      f.built = [Math.round(hb.W * 10) / 10, Math.round(hb.H * 10) / 10];
      f.pinned = !!cv.style.width || !!wrap.style.transform;
      f.box = [cv.clientWidth, cv.clientHeight];
      f.host = [wrap.clientWidth, wrap.clientHeight];
      f.holdOp = hc ? r2(eff(hc)) : 0; f.hold = hb.hold || 0;
      f.cams = hb.cams || null;
      f.crisp = wrap.querySelectorAll('canvas.hc-crisp').length;
      f.live = hb.live || null;
      // (a box the city wasn't built for, read in a rAF: the scene pins it in a ResizeObserver — AFTER the frame callbacks, BEFORE the paint.
      //  What was PAINTED is read once the frame is over: a task later)
      if (!f.pinned && (Math.abs(f.box[0] - f.built[0]) > 1 || Math.abs(f.box[1] - f.built[1]) > 1)) setTimeout(() => { try { const h2 = window.__district.loadProbe(); f.pinned = !!cv.style.width || !!wrap.style.transform; f.box = [cv.clientWidth, cv.clientHeight]; f.built = [Math.round(h2.W * 10) / 10, Math.round(h2.H * 10) / 10]; f.holdOp = Math.max(f.holdOp, (() => { const c2 = wrap.querySelector('canvas.hc-hold'); return c2 ? r2(eff(c2)) : 0; })()); f.late = 1; } catch { /* gone */ } }, 0);
    }
    if (F.length < 20000) F.push(f);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__cam = { frames: F, marks, mark: label => { marks.push({ t: Math.round(performance.now() - t0), label }); }, dump: () => ({ frames: F, marks }) };
}

/** the frames with TWO CAMERAS ON SCREEN → { n, what, at, kinds }: the city seen (> 2 %) and not under a fully opaque held picture, while
 *  (a) the bake on screen / the one fading out / the lit windows stand at another camera's GEOMETRY than the city's now (the tier alone
 *  moves nothing), (b) the city's canvas is CSS-fitted to a box it was not built for with no resize pin (the crisp lettering + every
 *  framed layer stay at the built camera), or (c) more than one scene / main canvas / frame loop is alive */
export function camJudge(F) {
  const out = { n: 0, what: '', at: [], kinds: {}, frames: (F || []).length, seen: 0 };
  const geo = s => (s ? String(s).split('|').slice(0, 4).join('|') : null);
  const add = (f, kind, why) => { out.n++; out.kinds[kind] = (out.kinds[kind] || 0) + 1; if (out.at.length < 5) { out.at.push(f.t); out.what += `${out.what ? '; ' : ''}${f.t} ms ${why}`; } };
  for (const f of F || []) {
    if (f.scenes > 1 || f.mains > 1) { add(f, 'scenes', `${f.scenes} scenes / ${f.mains} main canvases in the page`); continue; }
    if (f.live && (f.live.scenes > 1 || f.live.loops > 1 || f.live.dup > 0)) { add(f, 'scenes', `${f.live.scenes} live scenes · ${f.live.loops} frame loops${f.live.dup ? ` · ${f.live.dup} doubled frame callbacks` : ''}`); continue; }
    if (!(f.city > 0.02) || !f.built) continue;
    out.seen++;
    if (f.holdOp >= 0.995) continue;   // (a held picture covers the city: one picture, the last one seen)
    const c = f.cams;
    if (c && c.now && ((c.baked && geo(c.baked) !== geo(c.now)) || (c.prev && geo(c.prev) !== geo(c.now)))) add(f, 'bake', `the bake at another camera (${c.prev ? `${c.prev} + ` : ''}${c.baked} → ${c.now})`);
    else if (c && (c.litGeo === false || (c.litGeo == null && c.lit === false))) add(f, 'lit', `the lit windows at another camera (${c.now})`);
    else if (!f.pinned && (Math.abs(f.box[0] - f.built[0]) > 1 || Math.abs(f.box[1] - f.built[1]) > 1)) add(f, 'fit', `the city built for ${f.built.join('×')} shown CSS-fitted in a ${f.box.join('×')} box, no pin (${f.crisp} crisp canvases at the built camera)`);
  }
  return out;
}
