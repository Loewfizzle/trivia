// CITY 2.0 — THE LEGENDARIES' WIRING (SCHED — FR5 C1's second cut: a pure MOVE out of scene.js, no behaviour changed): a link's legendary
// waiting for the reveal + the first tap, the legends' lazy load + their sounds' warm-up, THE DRAIN (the TR-3B's power cut across the city)
// + THE DARK CITY's bakes, the veil in front; one factory over ONE ctx of getters (+ setters) onto scene.js's own state (docs/harbor/review-5.md C1).
import { project } from '../../core/harbor-layout.js';
import { onUnlock } from '../../audio/engine.js';
import { facadeSteps, skyItems } from './skyline.js';
import { searchlightStep } from './searchlights.js';
import { quaySteps } from './quay.js';
import { LENS } from './road.js';
import { signalAt } from '../../core/harbor-promenade.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { IMPLODE } from '../../core/harbor-tower.js';
import { litK } from '../../core/harbor-dark.js';
import { legendNear } from '../../core/harbor-legend.js';
import { lazyImport } from '../../ui/lazy-import.js';

/** C: scene.js's state by getters (+ a setter where this code assigns it): baker, bakeTones, cam, clock, destroyed, DK, dpr, forceSince, L, laneKey, lastT9, legends=, legendsLoading=, legendWant=, linkGoAt=, linkTapAt=, LK, LOADLOG, lookTones, neon, pageClock, people, qp, remoteKey, shownAt, skyline, snd, speak, tier, TWS, W */
export function createSceneLegend(C) {
  // 9g — A LEGENDARY FROM A LINK WAITS (the owner: the TR-3B "worked perfectly" from ☰ → ADMIN, glitched from &force=tr3b): a link used
  // to start it AT THE LOAD — under the bake + the reveal, before the first tap unlocked the music (no song for the tape to slow). Now
  // &force=ufo / tr3b / implosion from the page's own URL wait for THE REVEAL + THE FIRST TAP, then start LINK_LEAD ms later — a link
  // behaves like the panel. ufo + tr3b leave the force set until then (their craft + the dark city pre-baked meanwhile:
  // legends.prewarm); the implosion keeps its flag with its clock held at the countdown's start (the tower's look never jumps).
  // &lgs= (a held still) and &builds= keep their own behaviour; &lgnow=1 = the old start at the load (the tests + shots that time it).
  // (MODELS — THE LINKS RULE: a legendary forced from a link starts within ~5 s of the tap — the lead 4 → 2.5 s, its sounds' decode wait
  // 4 → 2.5 s more at most; the TR-3B's tape sag starts 2 s into the run, so the song still has ~4.5 s after the tap to be playing)
  const LINK_LEAD = 2500, LINK_SND_WAIT = 2500;
  const linkHeld = new Set();
  if (C.qp.get('lgnow') !== '1') {
    const held = C.qp.get('lgs') != null && C.qp.get('lgs') !== '';
    for (const id of ['ufo', 'tr3b']) if (C.clock.force.has(id) && !held) { linkHeld.add(id); C.clock.force.delete(id); }
    if (C.clock.force.has('implosion') && !(C.qp.get('builds') != null && C.qp.get('builds') !== '')) linkHeld.add('implosion');
  }
  // (the first TAP itself — touchend / click / a key, where iOS unlocks the audio — not the engine's unlock, which never comes on a
  // browser that cannot make an AudioContext: the link would wait forever)
  const linkTap = () => { if (C.linkTapAt == null) C.linkTapAt = performance.now(); for (const e of LINK_TAPS) window.removeEventListener(e, linkTap, true); };
  const LINK_TAPS = ['touchend', 'click', 'keydown'];
  if (linkHeld.size && typeof window !== 'undefined') { onUnlock(linkTap); for (const e of LINK_TAPS) window.addEventListener(e, linkTap, true); }
  /** per frame: the gate opens LINK_LEAD after the later of the reveal + the first tap → the held ids join the force set */
  function linkGate(now) {
    if (!linkHeld.size) return;
    if (C.linkGoAt == null) { if (C.shownAt >= 0 && C.linkTapAt != null) C.linkGoAt = Math.max(C.shownAt, C.linkTapAt) + LINK_LEAD; else return; }
    if (now < C.linkGoAt) return;
    // (PROM: + up to 4 s more while the held legendary's sounds still decode — its approach never starts ahead of its hum)
    if (now < C.linkGoAt + LINK_SND_WAIT && C.snd && C.snd.legendReady && [...linkHeld].some(id => !C.snd.legendReady(id, sndPicks()))) return;
    const ids = [...linkHeld]; linkHeld.clear();
    for (const id of ids) {
      if (id === 'implosion') { C.forceSince.set('implosion', C.clock.now() / 1000); continue; }
      C.pageClock.force.add(id);
      if (!C.remoteKey || C.remoteKey === '~') C.clock.force.add(id);   // (a panel state on screen owns the force set; the link's flag waits under it)
    }
    C.LOADLOG.add('note', `9g: the link's ${ids.join(' + ')} started — ${Math.round((C.linkTapAt - C.shownAt) / 100) / 10} s from the reveal to the first tap, + ${LINK_LEAD / 1000} s`);
  }
  const legendLayout = () => ({ dpr: Math.min(BAKE_CAP, C.dpr), crown: C.skyline ? Array.from(C.skyline).sort((a, b) => a - b)[Math.floor(C.skyline.length * 0.08)] : null });
  function needLegends() {
    if (C.legends || C.legendsLoading) return;
    C.legendsLoading = true;
    lazyImport(import('./legends.js'), './legends.js').then(m => {
      if (C.destroyed) return;
      C.legends = m.createLegends({ clock: C.clock, qp: C.qp }); C.legends.setTier(C.tier);
      if (C.L) C.legends.layout(C.L, legendLayout());
      if (C.legendWant) { C.legends.start(C.legendWant.kind, C.legendWant.at, C.legendWant); C.legendWant = null; }
    }).catch(e => { C.legendsLoading = false; console.warn('[harbor] legends', e); });
  }
  /** 9g — what the sounds hear of a legendary: legends.listen() + the panel's picks (&hum= / &depart=) + how many on the promenade flee */
  // PROM — THE LEGENDARIES' SOUNDS LOADED AHEAD (the owner, 9g: the first run's spin-up silent — fetched on first use): a link's held
  // legendary (from its reveal), tonight's due within the minute / running (legends.warming), the implosion's countdown → the whole set
  // fetched + decoded + pinned (sounds.js#prefetchLegend), tried again until the audio is unlocked
  const sndPicks = () => ({ hum: C.qp.get('hum'), depart: C.qp.get('depart'), horn: C.qp.get('horn') });
  let sndWarmAt = -1e9;
  function legendSoundsWarm(now) {
    if (now - sndWarmAt < 500 || !C.snd || !C.snd.prefetchLegend) return;
    sndWarmAt = now;
    const kinds = new Set(linkHeld);
    if (C.legends) { const w = C.legends.warming(); if (w) kinds.add(w); }
    for (const id of ['ufo', 'tr3b']) if (C.clock.force.has(id)) kinds.add(id);
    if (C.clock.force.has('implosion') || (C.TWS && C.TWS.stage === 'implosion' && C.TWS.s < IMPLODE.drop0 + 5)) kinds.add('implosion');
    for (const k of kinds) C.snd.prefetchLegend(k, sndPicks());
  }
  // PROM — THE WET REFLECTIONS (no lampposts): the lights standing on the promenade, mirrored down the wet stones — the blade's neon, the
  // side door's sconce, the shop's lamp + the awning's light (awning: Group 2 lights it from under), the stop lights in their colour now.
  // → [{ x, y (its foot on the ground, pt), col, k, w, len }] for wetground.js
  function wetReflect() {
    if (!C.L || !C.speak) return [];
    const out = [], cam = C.L.cam, s = C.L.speakeasy, foot = project(cam, 0, 0, s.z0 - 0.15)[1], gl = C.speak.glows ? C.speak.glows() : {}, nk = litK(C.DK, 'neon'), lk = litK(C.DK, 'lamps');
    const br = C.speak.bladeRect ? C.speak.bladeRect() : null;
    if (br && nk > 0.02) out.push({ x: br.x + br.w / 2, y: project(cam, 0, 0, s.z0 + 0.4)[1], col: [255, 206, 222], k: nk * 0.9, w: Math.max(2.4, br.w * 0.7), len: 70 });
    if (gl.sconce) out.push({ x: gl.sconce[0], y: foot, col: [255, 206, 140], k: lk * 0.85, w: 3, len: 52 });
    if (gl.lamp) out.push({ x: gl.lamp[0], y: foot, col: [255, 214, 160], k: lk * 0.55, w: 3.4, len: 44 });
    if (gl.awning && gl.awning.k > 0.02) for (const ax of gl.awning.xs) out.push({ x: ax, y: foot, col: [255, 196, 128], k: gl.awning.k * 0.7, w: 2.6, len: 46 });
    const st = signalAt(C.clock.now()), li = st.road === 'red' ? 0 : st.road === 'amber' ? 1 : 2;
    for (const sg of C.L.signals || []) if (sg.head) out.push({ x: sg.head.x, y: project(cam, sg.x, 0, sg.z)[1], col: LENS[li], k: lk * 0.8, w: 2, len: 64 });
    return out;
  }
  const legendHeard = () => { const o = C.legends ? C.legends.listen() : null; if (o && o.kind === 'ufo') { o.hum = C.qp.get('hum'); o.depart = C.qp.get('depart'); o.crowd = C.people && C.people.witnessN ? C.people.witnessN() : 0; } return o; };
  /** tonight's legendary is due within a minute (or running) */
  function legendSoon() {
    const lc = C.LK.local; if (!lc || C.LK.alwaysNight) return false;
    return !!legendNear(lc, 60);   // (SCHED: any of tonight's big ones)
  }
  // THE TR-3B's DRAIN over the baked city: each column's unlit facade laid back over its lit windows, neon, signs + beacons (the
  // column's own sputter + lag: legends.js#drainCols) — the far rows, then the near ones
  // (C2 — each depth's strips go right after ITS OWN layer: the far ones were laid after the near rows were drawn, so in the dying
  // + the power coming back the far facades covered the near buildings in flickering strips — the owner's "buildings behind the
  // jets flicker")
  // ATM-C — THE BLACKOUT BUILDING BY BUILDING (the owner, Oct 31: the drain swept across as a WIPE whose straight vertical edge SLICED
  // THROUGH BUILDINGS + SIGNS — the HIGH STAKES + NEON PAR towers + the NEON PAR roof sign half lit / half dark down a hard line — "looks
  // cool but not real"): the strips are now each BUILDING's — every 12-pt column split top to bottom by the building seen there (the
  // nearest first; a taller one behind owns the strip above a lower one in front), each roof sign joined to the tower it stands on — and
  // every strip takes ITS BUILDING's power (legends.power at the building's middle, its own id: one stutter + one moment per building,
  // rolling across the city in the craft's direction; the power-up the same in reverse). A building goes out WHOLE.
  let drainGeo = null;
  function drainGeoFor(name) {
    const sl = (() => { try { return C.neon.signRects().length; } catch { return 0; } })(), key = `${C.cam.W}x${C.cam.H}|${C.laneKey}|${sl}`;
    if (!drainGeo || drainGeo.key !== key) drainGeo = { key, g: {} };
    if (drainGeo.g[name]) return drainGeo.g[name];
    const items = (skyItems(C.L)[name] || []).filter(it => it.b);
    const blds = new Map(), boxes = [];
    for (const it of items) {
      const b = it.b, [ax] = project(C.cam, b.x0, 0, b.z0), [bx] = project(C.cam, b.x1, 0, b.z0), top = project(C.cam, 0, (b.y0 || 0) + (b.h || 0), b.z0)[1];
      const id = it.o && it.o.tower ? `t:${it.o.tower.id}` : `b:${b.x0.toFixed(1)}|${b.z0.toFixed(1)}`;
      if (!blds.has(id)) blds.set(id, { id, n: blds.size + (name === 'far' ? 400 : 0), x0: ax, x1: bx });
      const B = blds.get(id); B.x0 = Math.min(B.x0, ax); B.x1 = Math.max(B.x1, bx);
      boxes.push({ x0: Math.min(ax, bx), x1: Math.max(ax, bx), top, z: b.z0, B });
    }
    // the roof signs: each joins the building it stands on (the one under its middle, the nearest roof below its foot)
    const signs = [];
    try { for (const r of C.neon.signRects()) { const cx = r.x + r.w / 2; let best = null; for (const bx of boxes) if (cx >= bx.x0 && cx <= bx.x1 && bx.top >= r.y + r.h - 6 && (!best || bx.top < best.top)) best = bx; if (best && best.top - (r.y + r.h) < 60) signs.push({ x0: r.x - 3, x1: r.x + r.w + 3, y0: r.y - 10, y1: best.top, B: best.B }); } } catch { /* no signs yet */ }
    const n = Math.max(16, Math.round(C.W / 12)), cw = C.W / n, cols = [];
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * cw, here = boxes.filter(bx => x >= bx.x0 && x < bx.x1).sort((a, b) => a.z - b.z), segs = [];
      let cur = 1e9;
      for (const bx of here) if (bx.top < cur) { segs.push({ y0: bx.top, y1: cur, B: bx.B }); cur = bx.top; }
      const sg = signs.find(q => x >= q.x0 && x < q.x1);
      if (sg) segs.push({ y0: sg.y0, y1: Math.min(sg.y1, cur), B: sg.B });
      else if (segs.length) segs.push({ y0: cur - 30, y1: cur, B: segs[segs.length - 1].B });   // (a crown's spire + beacon just above)
      cols.push(segs);
    }
    for (const B of blds.values()) B.xf = Math.max(0, Math.min(1, (B.x0 + B.x1) / 2 / C.W));
    return (drainGeo.g[name] = { n, cw, cols, blds: [...blds.values()] });
  }
  /** ATM-C — a neon item's building power under the drain (neon.js#drawItems: its tubes + sign go out WITH the building): the building its
   *  lit sprite overlaps most, in the group it draws in → 0..1 (memo per item, per frame) */
  let ldMemo = new Map(), ldT = -1;
  function neonLegendDim(it, group) {
    const r = Array.isArray(it.lit) ? it.lit[0] : it.lit; if (!r || r.w == null || !C.legends || (group !== 'far' && group !== 'near')) return 1;   // (it.lit: the item's sprites — the first one's rect)
    if (ldT !== C.lastT9) { ldMemo = new Map(); ldT = C.lastT9; }
    if (ldMemo.has(it)) return ldMemo.get(it);
    const G = drainGeoFor(group); let best = null, bo = 0;
    for (const B of G.blds) { const o = Math.min(r.x + r.w, Math.max(B.x0, B.x1)) - Math.max(r.x, Math.min(B.x0, B.x1)); if (o > bo) { bo = o; best = B; } }
    const v = best ? C.legends.power(best.xf, group === 'far' ? 'far' : 'city', best.n) : 1;
    ldMemo.set(it, v);
    return v;
  }
  function drainCity(c, fadeIn, only) {
    if (fadeIn <= 0) return;
    for (const name of only ? [only] : ['far', 'near']) {
      // (POLISH 4: the far rows + the near rows each their own depth — the far skyline comes back first; a DEAD depth draws no lights
      // at all, so it has nothing to cover)
      const band = name === 'far' ? 'far' : 'city';
      const cols0 = C.legends.drainCols(band); if (!cols0 || !cols0.length) continue;   // (null: no drain now, or the whole depth dead)
      const g = C.baker.group(name); if (!g || !g.ready) continue;
      const dk = darkOf(name), src = dk ? dk.cv : g.cur;
      const k = g.cur.width / C.W, ky = g.cur.height / g.show.h, gy0 = g.show.y0, gy1 = g.show.y0 + g.show.h;
      const G = drainGeoFor(name), pw = new Map();
      const kOf = B => { if (!pw.has(B)) { const p = C.legends.power(B.xf, band, B.n); pw.set(B, p >= 0.985 ? 0 : Math.round((1 - p) * 8) / 8); } return pw.get(B); };
      // (neighbouring columns with the same strip — the same building, the same level — merge into one draw)
      let run = null;
      const flush = () => { if (!run) return; const y0 = Math.max(gy0, run.y0), y1 = Math.min(gy1, run.y1), hh = y1 - y0; if (hh > 1) { c.globalAlpha = Math.min(1, run.k) * fadeIn; c.drawImage(src, run.x0 * k, (y0 - gy0) * ky, (run.x1 - run.x0) * k, hh * ky, run.x0, y0, run.x1 - run.x0, hh); } run = null; };
      for (let i = 0; i < G.n; i++) for (const sg of G.cols[i]) {
        const kk = kOf(sg.B);
        if (kk <= 0 || (C.tier === 0 && name === 'near' && kk < 0.9)) continue;     // (tier 0: the near rows only where they're dead)
        const x0 = i * G.cw;
        if (run && run.B === sg.B && run.k === kk && run.x1 === x0 && Math.abs(run.y0 - sg.y0) < 0.5 && Math.abs(run.y1 - sg.y1) < 0.5) { run.x1 = x0 + G.cw; continue; }
        flush(); run = { x0, x1: x0 + G.cw, y0: sg.y0, y1: sg.y1, B: sg.B, k: kk };
      }
      flush();
    }
    c.globalAlpha = 1;
  }
  // POLISH 4 — THE DARK CITY (the owner: "pre-bake the dark city states"): on a TR-3B's night the far + near skyline are baked once
  // more with every FLOODLIT crown + uplight off (the crowns' floods are part of the facades' bake) — in slices, behind the city's
  // own bake, a minute ahead (legends.darkWanted()); the blackout draws it in place of the lit facades and lays it back in the
  // drain's strips. Freed once the run is over. Without it (not baked yet) the lit facades stand in.
  const dark = { key: '', q: [], g: {}, want: false };
  const DRAIN_DARK = { far: 0.38, near: 0.5 };
  function darkStart() {
    dark.q = []; dark.key = C.baker.key;
    const T = { ...(C.bakeTones || C.lookTones()), flood: 0, floodFront: false };
    for (const name of ['far', 'near']) {
      const g0 = C.baker.group(name); if (!g0 || !g0.ready) { dark.key = ''; return; }
      const d = dark.g[name] || (dark.g[name] = { cv: document.createElement('canvas'), ready: false });
      d.ready = false;
      const cw = g0.cur.width, ch = g0.cur.height, sc = cw / C.W, y0 = g0.show.y0, h = g0.show.h, x = safeCtx(d.cv);
      dark.q.push(() => { if (d.cv.width !== cw || d.cv.height !== ch) { d.cv.width = cw; d.cv.height = ch; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch); x.setTransform(sc, 0, 0, ch / h, 0, -y0 * ch / h); });
      const steps = name === 'far' ? [...facadeSteps(C.L, T, 'far', 6, C.neon.glass), C.neon.housingStep('far', T)]
        : [...facadeSteps(C.L, T, 'near', 6, C.neon.glass), C.neon.housingStep('near', T), searchlightStep(C.L, T), ...quaySteps(C.L, T)];
      for (const st of steps) dark.q.push(() => { x.save(); st(x); x.restore(); });
      // (MODELS — THE OWNER's TR-3B REVIEW, Oct 30 6:43 pm: "a NEON-PINK GLOW in the lower middle of the city" during the drain — the dark
      // bake kept the facades' night base, the near band's rose + lavender walls lit like a glow in the dead city. The drained city stays
      // DARK: the bake pulled toward a cool near-black inside its own pixels (once a bake, nothing a frame); the TR-3B's white + red light
      // on the tower tops is drawn after it, untouched)
      dark.q.push(() => { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(7,6,18,${DRAIN_DARK[name]})`; x.fillRect(0, 0, cw, ch); x.restore(); });
      dark.q.push(() => { d.ready = true; d.y0 = y0; d.h = h; });
    }
  }
  function darkPump(ms) {
    const want = !!(C.legends && C.legends.darkWanted && C.legends.darkWanted());
    if (!want) { if (dark.want) { dark.want = false; dark.q = []; dark.key = ''; for (const d of Object.values(dark.g)) { d.cv.width = d.cv.height = 0; d.ready = false; } } return; }
    dark.want = true;
    if (C.baker.pending) return;
    if (dark.key !== C.baker.key && !dark.q.length) darkStart();
    const t0 = performance.now();
    while (dark.q.length && performance.now() - t0 < ms) dark.q.shift()();
  }
  /** the dark facade of a group when it's baked for the band the city shows now (else null) */
  function darkOf(name) {
    const d = dark.g[name], g = C.baker.group(name);
    return d && d.ready && dark.key === C.baker.key && g && d.y0 === g.show.y0 && d.h === g.show.h ? d : null;
  }
  // C4c — THE FRONT ROW IN THE BLACKOUT (the owner's iPhone mid-drain: the right maple's autumn crown blazing — the cab stand's lamp
  // light is BAKED into its leaves, and its crown reaches above the veil's top, the road's): the 'front' layer (the framing maple, the
  // near pieces) darkened through its OWN alpha — a mask of the layer filled with the night's dark, laid on with 'multiply' at the
  // veil's level (the city behind the leaves untouched). The mask is made once per bake of the layer, only during a legendary; freed after.
  const fv = { cv: null, ver: -1 };
  function veilFront(c, a) {
    const g = C.baker.group('front');
    if (!(a > 0.01) || !g || !g.ready || !g.show) return;
    if (!fv.cv) fv.cv = document.createElement('canvas');
    const cw = g.cur.width, ch = g.cur.height;
    if (fv.ver !== g.ver || fv.cv.width !== cw || fv.cv.height !== ch) {
      if (fv.cv.width !== cw || fv.cv.height !== ch) { fv.cv.width = cw; fv.cv.height = ch; }
      const x = safeCtx(fv.cv); x.globalCompositeOperation = 'copy'; x.drawImage(g.cur, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgb(58,52,84)'; x.fillRect(0, 0, cw, ch); x.globalCompositeOperation = 'source-over'; fv.ver = g.ver;
    }
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = Math.min(1, a); c.drawImage(fv.cv, 0, g.show.y0, C.W, g.show.h); c.restore();
  }
  const freeFront = () => { if (fv.cv) { fv.cv.width = fv.cv.height = 0; fv.cv = null; fv.ver = -1; } };
  /** what's left of the power at a screen x for a band (1 without a legendary) — the harbor, the promenade's lights */
  const legendPow = (x, band, i) => (C.legends && C.legends.active() ? C.legends.power(x / C.W, band, i) : 1);
  return { LINK_LEAD, dark, darkOf, darkPump, drainCity, freeFront, fv, legendHeard, legendLayout, legendPow, legendSoon, legendSoundsWarm, linkGate, linkHeld, needLegends, neonLegendDim, sndPicks, veilFront, wetReflect };
}
