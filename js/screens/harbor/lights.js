// CITY 2.0 — THE HARBOR: THE LIT WINDOWS (Part 2) — their own layer, never the facade's bake (docs/harbor.md#windows).
//
//  - litSteps(): the lit windows of a skyline group, baked on the LIGHT KEY (City 1.0's timeline: the hour's share P.win in
//    1/60 steps + the warmth), over the same items in the same order as the facades — each building first erases what it hides
//    of the farther ones' lights, then draws its own. Far windows are glitter; near ones show a hint of the room (the ceiling
//    lit, a curtain, a TV's blue). Tungsten mostly, a few cool TV-blues and curtained ones, a rare neon.
//  - createLights(): what changes between bakes, drawn every frame and cheap: the glitter's shimmer, the TVs, now and then a
//    light switched off (or on) somewhere, the aircraft beacons on the tallest crowns, and THE WORDS IN THE WINDOWS:
//    spell(text, { tower, style }) lights a message on the word towers (core/harbor-windows.js#layoutText) — steady, a wipe-on
//    floor by floor, or a gentle twinkle — while the rest of that tower dims so it reads. Night only. Any later part addresses
//    a window by (building, tier, col, row) with set() (party waves, flags, holiday windows).
import { winTraits, buildingDice, winHash, layoutText, normText, scrollColumns, fitText, FONT_H } from '../../core/harbor-windows.js';
import { windowThreshold } from '../../core/harbor-dark.js';
import { cellRect, isDeco, behindWheel } from './blocks.js';
import { project } from '../../core/harbor-layout.js';
import { SPOTS, towerRoofSign } from '../../core/harbor-neon.js';
import { fog } from './tones.js';
import { skyItems } from './skyline.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const WARM = [[255, 214, 158], [255, 205, 136], [255, 226, 186], [255, 193, 120], [255, 234, 204]];
const COOL = [[166, 214, 255], [190, 226, 255], [206, 222, 255]];
const TV = [128, 160, 255];
// the coloured rooms (NEON PASS 3): pink, violet, teal, magenta, cyan — a party lamp, a neon bar sign inside, a coloured shade
const NEONW = [[255, 96, 190], [178, 112, 255], [64, 236, 200], [236, 70, 255], [96, 224, 255]];
const AMBER = [255, 194, 122];
const PARTYW = [[255, 70, 180], [70, 220, 255], [170, 100, 255], [255, 200, 90], [255, 70, 180], [70, 220, 255]];
const DARK = [8, 8, 20];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const strs = new Map();
const rgba = (c, a) => { const k = `${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.round(a * 50)}`; let s = strs.get(k); if (!s) { s = `rgba(${k.split(',').slice(0, 3).join(',')},${Math.round(a * 50) / 50})`; if (strs.size > 4000) strs.clear(); strs.set(k, s); } return s; };

/** a window's colour (the season's warmth leans tungsten further amber, as City 1.0) */
export function colourOf(tr, warm = 0) {
  let c = tr.cls === 'cool' ? COOL[Math.floor(tr.tone * 3)] : tr.cls === 'tv' ? TV : tr.cls === 'neon' ? NEONW[Math.floor(tr.tone * NEONW.length)] : WARM[Math.floor(tr.tone * 5)];
  if (warm > 0.05 && (tr.cls === 'warm' || tr.cls === 'curtain')) c = mixc(c, AMBER, warm * 0.6);
  return c;
}

function quadPath(x, cam, pts) { pts.forEach(([a, b, c], i) => { const [sx, sy] = project(cam, a, b, c); if (i) x.lineTo(sx, sy); else x.moveTo(sx, sy); }); x.closePath(); }
/** an item's silhouette on screen (the front, the side the camera sees, the crown's box) — erased from the lights behind it */
function silhouette(x, cam, b) {
  const y0 = b.y0 || 0, y1 = y0 + b.h, [a, ty] = project(cam, b.x0, y1, b.z0), [c, by] = project(cam, b.x1, y0, b.z0);
  x.fillRect(a, ty, c - a, by - ty);
  if (b.x1 < 0 || b.x0 > 0) { x.beginPath(); const xx = b.x1 < 0 ? b.x1 : b.x0; quadPath(x, cam, [[xx, y0, b.z0], [xx, y1, b.z0], [xx, y1, b.z1], [xx, y0, b.z1]]); x.fill(); }
  if (b.crown) { const hh = b.crown.h * cam.F / b.z0, cw = (c - a) * 0.8; x.fillRect((a + c) / 2 - cw / 2, ty - hh, cw, hh); }
  return { x0: Math.min(a, project(cam, b.x1 < 0 ? b.x1 : b.x0, 0, b.z1)[0]), x1: Math.max(c, project(cam, b.x1 < 0 ? b.x1 : b.x0, 0, b.z1)[0]), y0: ty - (b.crown ? b.crown.h * cam.F / b.z0 : 0), y1: by };
}

/**
 * The lit windows' bake steps for a group. look: { share (P.win), warm (P.winWarm), night }. meta (filled as it bakes, for the
 * per-frame touches): { twinkle: [], tv: [], cands: [], boxes: [] } — finish(meta) after the last step settles what is visible.
 */
export function litSteps(L, look, group, meta) {
  const cam = L.cam, items = skyItems(L)[group], steps = [], n = 10;
  for (let i = 0; i < items.length; i += n) {
    const part = items.slice(i, i + n), base = i;
    steps.push(x => { part.forEach((it, j) => { if (it.b) drawLit(x, cam, it, look, meta, group, base + j); }); });
  }
  steps.push(() => finish(meta));
  return steps;
}

function drawLit(x, cam, it, look, meta, group, idx) {
  const { b, o } = it;
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  const sil = silhouette(x, cam, b);
  meta.boxes.push({ ...sil, idx });
  // the power-on wave's list: what this building hides of the windows already listed is out of it (8 pt bins along x)
  const wv = meta.wave;
  for (let bi = Math.floor(sil.x0 / 8); bi <= Math.floor(sil.x1 / 8); bi++) {
    const bin = wv.bins.get(bi); if (!bin) continue;
    for (const w of bin) if (w.vis && w.x < sil.x1 && w.x + w.w > sil.x0 && w.y < sil.y1 && w.y + w.h > sil.y0) w.vis = 0;
  }
  x.globalCompositeOperation = 'source-over';
  const g = b.win;
  if (!g || g.rows <= 0) return;
  // (THE DAY PASS §0: the blocks freed beside the lighthouse light most of their windows again, like their neighbours)
  const dice0 = buildingDice(b.seed, o.rank), dice = cam.lhLit && cam.lhLit.has(b.id) ? { ...dice0, lit: Math.max(dice0.lit, 0.86), floor: 0.3 } : dice0;
  const s = cam.F / b.z0, deco = isDeco(o.rank), t = o.tierIndex || 0;
  const fz = fog(b.z0), depthK = 0.6 + 0.4 * (1 - fz);
  const paneW = s * g.pitch[0] * 0.5, room = group === 'near' && paneW > 2.2;
  const share = look.share;
  // (NEON PASS 4: a quiet office block right behind the wheel — the spokes cross mostly dark glass)
  const quiet = behindWheel(cam, b);
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const tr = winTraits(b.seed, t, c, r, dice);
    if (!tr) continue;
    // (THE DAY PASS §0, the owner's pick d: behind the wheel the windows stay dark — the floodlit stone carries it, blocks.js#floodWash)
    // (DT1 — THE BLUE HOUR: while the city powers up the LOWER floors light first — look.bias, core/harbor-dark.js#windowThreshold;
    // at night the bias is 0: City 1.0's order exactly)
    const low = 0.75 * (1 - r / Math.max(1, g.rows - 1)) + 0.25 * winHash(b.seed, t, c, r, 24);
    const on = !quiet && tr.order <= windowThreshold(share, look.bias || 0, low);
    const rect = cellRect(cam, b, c, r, deco);
    if (group === 'near' && winHash(b.seed, t, c, r, 12) < 0.05 && meta.cands.length < 220) meta.cands.push({ rect, col: colourOf(tr, look.warm), on, a: tr.a * depthK, idx, id: [b.tower || b.id, t, c, r] });
    if (!on || share <= 0) continue;
    let col = quiet ? colourOf({ ...tr, cls: 'warm' }, look.warm) : colourOf(tr, look.warm), a = tr.a * depthK;
    // PARTY WINDOWS (NEON PASS 3, City 1.0's): on a party night ~1 lit window in 5 takes a party colour (pink, cyan, violet, gold),
    // and now and then a whole floor in one colour — baked with the light key (look.party), so they cost nothing a frame
    if (look.party && tr.cls !== 'tv' && !quiet) {
      const fl = winHash(b.seed, t, 0, r, 23) < 0.07;
      if (fl || winHash(b.seed, t, c, r, 21) < 0.2) { col = PARTYW[Math.floor(winHash(b.seed, t, fl ? 0 : c, r, 22) * PARTYW.length)]; a = Math.min(1, Math.max(a, 0.7) * 1.1); }
    }
    let [wx, wy, ww, wh] = rect;
    // FAR GLITTER (Part 3, the owner's review): far + mid windows are fine, irregular points of light — each its own size inside
    // its pane, its own place in it, its own brightness (a few bright, most dim), now and then a whole lit floor as a thin strip;
    // the address (the pane) is unchanged. The near buildings keep their rooms.
    if (group === 'far') {
      const j = winHash(b.seed, t, c, r, 17), j2 = winHash(b.seed, t, c, r, 18), j3 = winHash(b.seed, t, c, r, 19), j4 = winHash(b.seed, t, c, r, 20);
      const strip = j4 < 0.05;
      const fw = strip ? ww * 1.9 : ww * (0.32 + 0.5 * j), fh = strip ? wh * 0.28 : wh * (0.28 + 0.6 * j2);
      wx += strip ? -ww * 0.45 : (ww - fw) * j3; wy += (wh - fh) * (strip ? 0.4 : j4);
      ww = Math.max(0.42, fw); wh = Math.max(0.42, fh);
      a *= j3 > 0.94 ? 1.25 : 0.3 + 0.7 * j * j;
      if (j2 > 0.8) col = mixc(col, [255, 250, 240], 0.35);
      a = Math.min(1, a);
    }
    // (a coloured room glows a little into the night around its pane: its own soft halo — City 1.0's)
    if (tr.cls === 'neon' && !quiet) { x.fillStyle = rgba(col, a * (group === 'far' ? 0.18 : 0.14)); x.fillRect(wx - 1.2, wy - 1.2, Math.max(0.6, ww) + 2.4, Math.max(0.6, wh) + 2.4); a = Math.min(1, a * 1.15); }
    x.fillStyle = rgba(col, a); x.fillRect(wx, wy, Math.max(0.6, ww), Math.max(0.6, wh));
    // City 1.0's power-on (district/scene.js): bottom first, with scatter — delay = (1 − height) · 0.82 + rand · 0.16
    { const yn = Math.max(0, Math.min(1, (wy - cam.limitY) / Math.max(1, cam.VPY + cam.F * cam.CAMH / 230 - cam.limitY)));
      const w = { x: wx, y: wy, w: Math.max(0.6, ww), h: Math.max(0.6, wh), d: Math.min(1, Math.max(0, (1 - yn) * 0.82 + winHash(b.seed, t, c, r, 16) * 0.16)), s: x.fillStyle, vis: 1 };
      wv.list.push(w); const bi = Math.floor(wx / 8); let bin = wv.bins.get(bi); if (!bin) wv.bins.set(bi, bin = []); bin.push(w); }
    if (room) {
      // a hint of the room: the ceiling's light at the top, the furniture's shadow low, a curtain drawn
      x.fillStyle = rgba(mixc(col, [255, 255, 255], 0.35), a * 0.55); x.fillRect(wx, wy, ww, wh * 0.22);
      const k = winHash(b.seed, t, c, r, 13);
      if (tr.cls === 'curtain') { x.fillStyle = rgba([110, 46, 52], 0.55); x.fillRect(wx, wy, ww, wh * 0.42); }
      else if (k < 0.4) { x.fillStyle = rgba(mixc(col, [40, 20, 20], 0.7), a * 0.6); x.fillRect(wx + ww * (k < 0.2 ? 0.1 : 0.45), wy + wh * 0.62, ww * 0.45, wh * 0.38); }
      else if (k < 0.5) { x.fillStyle = rgba([40, 24, 30], 0.55); x.fillRect(wx, wy, ww * 0.18, wh); x.fillRect(wx + ww * 0.82, wy, ww * 0.18, wh); }
    }
    if (tr.cls === 'tv' && meta.tv.length < 18) meta.tv.push({ rect, idx });
    else if (group === 'far' && winHash(b.seed, t, c, r, 14) < 0.03 && meta.twinkle.length < 90) meta.twinkle.push({ rect: [wx, wy, ww, wh], col, idx, ph: winHash(b.seed, t, c, r, 15) });
  }
  // the newer city's glass towers: thin lines of light along their crowns at night
  if (o.rank === 'modern' && t === (o.tiers || 1) - 1 && look.night > 0.2) {
    const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c2] = project(cam, b.x1, 0, b.z0), lw = Math.max(0.5, s * 0.12);
    x.fillStyle = rgba([200, 236, 255], 0.75 * look.night * depthK);
    for (let i = 0; i < 3; i++) x.fillRect(a, ty + i * s * 1.6, c2 - a, lw);
    // (DT1: + a few LIT FLOORS down the glass — late offices, a cleaning crew: 3–4 seeded floors, cool white, soft)
    { const by = project(cam, b.x0, b.y0 || 0, b.z0)[1], hh = by - ty;
      for (let i = 0; i < 4; i++) { const f = 0.22 + 0.17 * i + 0.08 * (winHash(b.seed, 31, i, 0, 5) - 0.5); if (winHash(b.seed, 32, i, 0, 5) < 0.2) continue; x.fillStyle = rgba(i % 2 ? [214, 232, 255] : [255, 236, 210], 0.5 * look.night * depthK); x.fillRect(a + (c2 - a) * 0.06, ty + hh * f, (c2 - a) * 0.88, Math.max(0.6, s * 0.5)); } }
    x.fillRect(a, ty, lw, s * 10); x.fillRect(c2 - lw, ty, lw, s * 10);
  }
}
// what the per-frame touches may use: only windows nothing nearer in the same group covers
function finish(meta) {
  const covered = (r, idx) => meta.boxes.some(bx => bx.idx > idx && r[0] < bx.x1 && r[0] + r[2] > bx.x0 && r[1] < bx.y1 && r[1] + r[3] > bx.y0);
  meta.cands = meta.cands.filter(w => !covered(w.rect, w.idx));
  meta.twinkle = meta.twinkle.filter(w => !covered(w.rect, w.idx));
  meta.tv = meta.tv.filter(w => !covered(w.rect, w.idx));
  meta.done = true;
}
export const newMeta = () => ({ twinkle: [], tv: [], cands: [], boxes: [], wave: { list: [], bins: new Map() }, done: false });

/** the word towers' faces on screen: { id: { cols, rows, cell(col, rowFromTop) → rect } } */
export function wordFaces(L) {
  const out = {};
  for (const t of L.towers) if (t.word && t.face) {
    const tr = t.tiers[0], g = tr.win, box = { ...tr, mat: t.mat };
    const s = L.cam.F / tr.z0, bw = g.pitch[0] * s, bh = g.pitch[1] * s;
    // cell: the window's pane; bay: a letter's window — fuller (the pane opened up to most of its bay: bold, readable letters)
    const cell = (c, rr) => cellRect(L.cam, box, c, g.rows - 1 - rr, true);
    out[t.id] = { cols: g.cols, rows: t.face.rows, word: t.word, cell, bay: (c, rr) => { const [x, y, w, h] = cell(c, rr); return [x + w / 2 - bw * 0.47, y + h / 2 - bh * 0.45, bw * 0.94, bh * 0.9]; } };
  }
  return out;
}

// AIRCRAFT BEACONS (Part 3): every tall top — each tower's crown tip (spires, the mast, the sunburst's needle, the glass towers'
// roofs) and the tallest towers of the bands — blinking TOGETHER like real obstruction lights: a slow red pulse at night (30 a
// minute), off by day except a white strobe on the very tallest
const NO_BEACON = { tank: 1, deco: 1 };
const BEACON_S = 2.0;
/** the beacons' shared pulse at time t (s): 0..1 — every beacon in the city reads this one clock */
export function beaconPulse(t) { const ph = (t / BEACON_S) % 1; return ph < 0.38 ? Math.pow(Math.sin(ph / 0.38 * Math.PI), 1.4) : 0; }
let dotCache = null;
function dots() {
  if (dotCache) return dotCache;
  const mkDot = (col) => { const c = document.createElement('canvas'); c.width = c.height = 48; const x = safeCtx(c), g = x.createRadialGradient(24, 24, 0, 24, 24, 24); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.12, `rgba(${col},0.85)`); g.addColorStop(0.35, `rgba(${col},0.22)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, 48, 48); return c; };
  dotCache = { red: mkDot('255,46,40'), white: mkDot('255,255,255'), warm: mkDot('255,214,150') };
  return dotCache;
}
const ROOF_SPOTS = SPOTS.filter(sp => sp.mount === 'tower');
export function createLights() {
  let L = null, faces = {}, beacons = [], spell = null, toggles = [], nextToggle = 0, sets = new Map();
  let metaFar = newMeta(), metaNear = newMeta();

  function layout(l) {
    L = l; faces = wordFaces(l); toggles = []; spell = spell && respell(spell);
    beacons = [];
    const u = l.cam.F / 600;
    let best = null;
    for (const t of l.towers) {
      const top = t.tiers[t.tiers.length - 1], c = top.crown;
      // (a tower carrying a roof sign — Part 5, the owner's call: its beacon blinks on top of the sign's frame, the tallest
      // thing on it — whatever its crown)
      const rs = ROOF_SPOTS.find(sp => sp.host === t.id), rw = rs && towerRoofSign(l, rs);
      if (!rw && c && NO_BEACON[c.t]) continue;
      const tip = top.y0 + top.h + (c ? c.h : 0) + (t.needle || 0);
      const [x, y] = rw ? project(l.cam, rw.beacon[0], rw.beacon[1], rw.z) : project(l.cam, (top.x0 + top.x1) / 2, tip, top.z0);
      const b = { x, y: y + 0.4, r: Math.max(1.1, (t.z0 > 400 ? 1.5 : 2.1) * u), id: t.id };
      beacons.push(b);
      if (!best || y < best.y) best = b;
    }
    // the bands' tallest towers (their spires, pyramids, domes), a few
    const roofs = l.bands.flatMap(bd => bd.blocks.filter(b => b.kind === 'tower' && b.crown && (b.crown.t === 'spire' || b.crown.t === 'pyramid' || b.crown.t === 'dome')).map(b => ({ b, y: project(l.cam, 0, b.h + b.crown.h, b.z0)[1] })));
    roofs.sort((a, b) => a.y - b.y).slice(0, 8).forEach(({ b, y }) => { const [x] = project(l.cam, (b.x0 + b.x1) / 2, 0, b.z0); if (x > -4 && x < l.cam.W + 4) beacons.push({ x, y: y + 0.4, r: Math.max(0.9, 1.3 * u), id: b.id }); });
    if (best) best.tallest = true;
  }
  // (a relayout: the same message built again on the new faces — the sprite goes, its geometry is the old one's)
  function respell(sp) {
    if (sp.sprite) sp.sprite.cv.width = sp.sprite.cv.height = 0;
    const b = build(sp.raw, sp.opts); return b ? { ...sp, ...b, sprite: null } : null;
  }
  const dims = () => Object.fromEntries(Object.entries(faces).map(([id, f]) => [id, { cols: f.cols, rows: f.rows, word: f.word }]));
  const ticker = (text, id) => { const sc = scrollColumns(text), f = faces[id]; return sc.cols.length && f && f.rows >= FONT_H ? { cols: sc.cols, face: f, tower: id, top: Math.max(0, Math.floor((f.rows - FONT_H) / 2)) } : null; };
  /** PART 7a §0: a message → { text, style, parts (still words), scrolls (a ticker per tower whose word is too long) } from the
   *  shared plan (core/harbor-windows.js#fitText — the panel's readout says the same): the best layout; else ONE WORD PER TOWER */
  function build(text, opts = {}) {
    const fx = dims();
    if (opts.style === 'scroll') {                 // THE SCROLL asked for: the whole message on one face (wordA unless asked)
      const id = String(opts.tower || '').split(',')[0], S = ticker(text, faces[id] && faces[id].word === 'h' ? id : 'wordA');
      return S ? { text: normText(text, 120), style: 'scroll', parts: [], scrolls: [S] } : null;
    }
    const fit = fitText(text, fx, opts.tower || '');
    if (!fit) return null;
    if (fit.mode === 'layout') { const p = place(fit.text, { ...opts, tower: String(opts.tower || '').includes(',') ? undefined : opts.tower }); if (p) return { text: fit.text, style: opts.style || 'wipe', parts: p.parts, scrolls: [] }; }
    const parts = [], scrolls = [];
    for (const e of fit.plan) {
      if (e.fits) { const p = place(e.text, { tower: e.tower }); if (p) { parts.push(...p.parts); continue; } }
      const S = ticker(e.text, e.tower); if (S) scrolls.push(S);
    }
    if (!parts.length && !scrolls.length) return null;
    return { text: fit.text, style: parts.length ? opts.style || 'wipe' : 'scroll', parts, scrolls };
  }
  function place(text, opts = {}) {
    const lay = layoutText(text, Object.fromEntries(Object.entries(faces).map(([id, f]) => [id, { cols: f.cols, rows: f.rows, word: f.word }])), opts);
    if (!lay) return null;
    const parts = lay.map(p => {
      const f = faces[p.tower], top = Math.max(0, Math.floor((f.rows - p.rows) / 2));
      return { tower: p.tower, cells: p.cells.map(([c, rr]) => ({ rect: f.bay(c, rr), rr: rr - top })), face: f, rows: p.rows };
    });
    return { parts };
  }

  /**
   * Light a message on the word towers. text: letters, digits, ♥ (or <3), ★ (or *), ⚑; opts: { tower: 'wordA'|'wordB'|'wordV',
   * style: 'steady'|'wipe'|'twinkle', colour: [r,g,b], ms (how long; default until cleared), at (start, performance ms) }.
   * Returns false if it does not fit. Night only (it is drawn × the night).
   */
  function spellIt(text, opts = {}) {
    if (!L) return false;
    const base = { opts, colour: opts.colour || [255, 226, 168], t0: opts.at ?? performance.now(), until: opts.ms ? (opts.at ?? performance.now()) + opts.ms : Infinity, out: -1 };
    dropSpell();                                   // (a word replacing a word: its sprite goes)
    // THE SCROLL: asked for (one face), or a word too long for its tower — it tickers across THAT tower's face (7a §0: one word
    // per tower; the others stand still); opts.tower may list towers ('wordA,wordB' — core/harbor-windows.js#TOWER_CHOICES)
    const b = build(text, opts);
    if (!b) return false;
    spell = { ...base, raw: text, ...b };
    return true;
  }
  function clearSpell(fade = true) { if (spell) { if (fade) spell.out = performance.now(); else dropSpell(); } }

  /** a window by its address: set(id, tier, col, row, { col: [r,g,b], a }) or null to give it back to the timeline */
  function set(id, tier, col, row, v) { const k = `${id}|${tier}|${col}|${row}`; if (v) sets.set(k, { ...v, id, tier, col, row }); else sets.delete(k); }

  /** per frame, after a group's lit layer: the shimmer, the TVs, the switched lights, the beacons, the words. k = the night */
  function draw(c, group, now, k, motion) {
    if (k <= 0.02 || !L) return;
    const t = now / 1000, meta = group === 'far' ? metaFar : metaNear;
    c.save();
    if (group === 'far') {
      // the glitter: a far window now and then flares a little (the air between)
      if (motion) {
        c.globalCompositeOperation = 'lighter';
        for (const w of meta.twinkle) {
          const v = Math.sin(t * (0.6 + w.ph) + w.ph * 40); if (v < 0.75) continue;
          const [x, y, ww, wh] = w.rect; c.fillStyle = rgba(w.col, 0.9 * k * (v - 0.75) * 4);
          c.fillRect(x - 0.3, y - 0.3, ww + 0.6, wh + 0.6);
        }
      }
      c.restore();
      return;
    }
    // the TVs: a cool flicker
    if (motion && meta.tv.length) {
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < meta.tv.length; i++) {
        const w = meta.tv[i], v = 0.5 + 0.5 * Math.sin(t * 7.3 + i * 2.1) * Math.sin(t * 2.9 + i);
        const [x, y, ww, wh] = w.rect; c.fillStyle = rgba(TV, 0.32 * k * v); c.fillRect(x, y, ww, wh);
      }
      c.globalCompositeOperation = 'source-over';
    }
    // now and then a light goes off somewhere (or one comes on), stays a while, then the room's light is back
    if (motion && meta.done && meta.cands.length && now > nextToggle) {
      nextToggle = now + 6000 + Math.random() * 9000;
      if (toggles.length < 5) {
        const w = meta.cands[Math.floor(Math.random() * meta.cands.length)];
        if (!toggles.some(o => o.w === w)) toggles.push({ w, t0: now, dur: 40000 + Math.random() * 160000 });
      }
    }
    toggles = toggles.filter(o => now - o.t0 < o.dur + 1600);
    for (const o of toggles) {
      const e = Math.min(1, (now - o.t0) / 1400, Math.max(0, (o.t0 + o.dur + 1400 - now) / 1400));
      const [x, y, ww, wh] = o.w.rect;
      c.fillStyle = o.w.on ? rgba(DARK, 0.92 * e * k) : rgba(o.w.col, o.w.a * e * k);
      c.fillRect(x, y, Math.max(0.6, ww), Math.max(0.6, wh));
    }
    // addressed windows (later parts: flags, party waves, holiday windows)
    for (const v of sets.values()) {
      const tw = L.towers.find(tt => tt.id === v.id); const tr = tw && tw.tiers[v.tier];
      if (!tr) continue;
      const [x, y, ww, wh] = cellRect(L.cam, { ...tr, mat: tw.mat }, v.col, v.row, isDeco(tw.rank));
      c.fillStyle = rgba(v.col || WARM[0], (v.a ?? 1) * k); c.fillRect(x, y, ww, wh);
    }
    // the words
    if (spell) drawSpell(c, now, k, motion);
    c.restore();
  }

  /** the aircraft beacons (every frame, day and night): all in sync — a slow red pulse at night (a faint ember between the
   *  pulses so each lamp is still there), a white strobe on the very tallest by day. night / day: 0..1 */
  function drawBeacons(c, now, night, day, motion) {
    if (!beacons.length) return;
    const t = now / 1000, D = dots();
    c.save(); c.globalCompositeOperation = 'lighter';
    if (night > 0.02) {
      const p = motion ? beaconPulse(t) : 0.7, a = night * (0.14 + 0.86 * p);
      for (const b of beacons) {
        const r = b.r * (3.4 + 1.6 * p);
        c.globalAlpha = Math.min(1, a); c.drawImage(D.red, b.x - r, b.y - r, r * 2, r * 2);
        c.globalAlpha = Math.min(1, a * 1.2); c.fillStyle = '#ffd0c8'; c.fillRect(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.64, b.r * 0.64);
      }
    }
    if (day > 0.3 && motion) {
      const ph = (t / 1.5) % 1;
      if (ph < 0.07) for (const b of beacons) if (b.tallest) { const r = b.r * 4.5; c.globalAlpha = day * (1 - ph / 0.07); c.drawImage(D.white, b.x - r, b.y - r, r * 2, r * 2); }
    }
    c.restore();
  }

  // the face behind a message: dark (the facade and its other windows sink back, so the letters read from arm's length)
  function dimFace(c, f, a) {
    const p = f.bay(0, 0), q = f.bay(f.cols - 1, f.rows - 1), pad = 1.2;
    c.fillStyle = rgba([5, 5, 14], 0.82 * a); c.fillRect(p[0] - pad, p[1] - pad, q[0] + q[2] - p[0] + pad * 2, q[1] + q[3] - p[1] + pad * 2);
  }
  // a letter's window: full, warm and bright — the room's light, a hotter centre, a soft glow spilling onto the stone
  function letter(c, rect, col, a, D) {
    const [x, y, ww, wh] = rect;
    c.fillStyle = rgba(col, a); c.fillRect(x, y, ww, wh);
    c.fillStyle = rgba(mixc(col, [255, 255, 255], 0.55), a * 0.9); c.fillRect(x + ww * 0.18, y + wh * 0.14, ww * 0.64, wh * 0.5);
    c.globalCompositeOperation = 'lighter';
    const r = Math.max(ww, wh) * 1.25; c.globalAlpha = 0.3 * a; c.drawImage(D.warm, x + ww / 2 - r, y + wh / 2 - r, r * 2, r * 2); c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  function drawSpell(c, now, k, motion) {
    const sp = spell, el = now - sp.t0, D = dots();
    if (now > sp.until && sp.out < 0) sp.out = sp.until;
    const fadeIn = Math.min(1, el / 1200), fadeOut = sp.out >= 0 ? Math.max(0, 1 - (now - sp.out) / 1600) : 1;
    if (fadeOut <= 0) { dropSpell(); return; }
    const env = fadeIn * fadeOut * k;
    for (const S of sp.scrolls) {
      // THE SCROLL: one window-column a step, right to left, like a Times Square ticker (slower under Reduced motion) — one per
      // tower whose word is too long for it (7a §0), beside the still words on the others
      const f = S.face, n = S.cols.length, stepMs = motion ? 120 : 260;
      dimFace(c, f, env);
      const shift = Math.floor(el / stepMs) % (n + f.cols + 4);
      for (let col = 0; col < f.cols; col++) {
        const m = col + shift - f.cols;
        if (m < 0 || m >= n) continue;
        const mask = S.cols[m];
        for (let r = 0; r < FONT_H; r++) if (mask & (1 << r)) letter(c, f.bay(col, S.top + r), sp.colour, fadeOut * k, D);
      }
    }
    if (!sp.parts.length) return;
    // the rest of each tower's face dims, so the message reads
    for (const p of sp.parts) dimFace(c, p.face, env);
    // THE LETTERS AS ONE SPRITE (cleanup pass 1): drawn into an offscreen only when their state changes — the wipe 25 times a
    // second while it climbs, the twinkle 10 a second, a steady word once — and blitted with the fade (≈ 0.3 ms a frame at tier 0)
    const wipeMs = (Math.max(1, ...sp.parts.map(p => p.rows)) - 1) * 160 + 260;
    const stateKey = sp.style === 'wipe' && motion ? (el < wipeMs ? Math.floor(el / 40) : -1) : sp.style === 'twinkle' && motion ? Math.floor(now / 100) : -1;
    if (!sp.sprite) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, pad = 0;
      for (const p of sp.parts) for (const cl of p.cells) { const [x, y, ww, wh] = cl.rect; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + ww); y1 = Math.max(y1, y + wh); pad = Math.max(pad, Math.max(ww, wh) * 2.5); }
      if (x0 === Infinity) return;
      sp.sprite = { cv: document.createElement('canvas'), x0: x0 - pad, y0: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, key: null };
    }
    const S = sp.sprite, dpr = c.getTransform().a || 1;
    if (S.key !== stateKey) {
      S.key = stateKey;
      const cw = Math.ceil(S.w * dpr), ch = Math.ceil(S.h * dpr);
      if (S.cv.width !== cw || S.cv.height !== ch) { S.cv.width = cw; S.cv.height = ch; }
      const x = safeCtx(S.cv);
      x.setTransform(dpr, 0, 0, dpr, -S.x0 * dpr, -S.y0 * dpr); x.clearRect(S.x0, S.y0, S.w, S.h);
      for (const p of sp.parts) {
        // the letters: the wipe climbs floor by floor from the bottom; the twinkle breathes window by window
        const rows = p.rows;
        for (let i = 0; i < p.cells.length; i++) {
          const cl = p.cells[i];
          let a = 1;
          if (sp.style === 'wipe' && motion) a = Math.max(0, Math.min(1, (el - (rows - 1 - cl.rr) * 160) / 260));
          else if (sp.style === 'twinkle' && motion) a = 0.72 + 0.28 * Math.sin(now / 420 + i * 1.7);
          if (a <= 0) continue;
          letter(x, cl.rect, sp.colour, a, D);
        }
      }
    }
    c.globalAlpha = fadeOut * k; c.drawImage(S.cv, S.x0, S.y0, S.w, S.h); c.globalAlpha = 1;
  }
  const dropSpell = () => { if (spell && spell.sprite) spell.sprite.cv.width = spell.sprite.cv.height = 0; spell = null; };

  /**
   * THE POWER-ON (the title's tap; City 1.0's exactly): while S.wave < 1 the lit windows come on one by one instead of the
   * baked layer — bottom first with scatter, each over 0.07 of the wave, flickering as it catches (sin(k·31 + x) > −0.2).
   */
  function drawWave(c, group, wave, k) {
    const meta = group === 'far' ? metaFar : metaNear;
    if (!meta.done) return false;
    c.save();
    for (const w of meta.wave.list) {
      if (!w.vis) continue;
      const k2 = (wave - w.d) / 0.07;
      if (k2 <= 0) continue;
      c.globalAlpha = k * (k2 >= 1 ? 1 : Math.sin(k2 * 31 + w.x) > -0.2 ? k2 : 0.15);
      c.fillStyle = w.s; c.fillRect(w.x, w.y, w.w, w.h);
    }
    c.restore();
    return true;
  }

  return {
    layout, set, draw, drawWave, beacons: drawBeacons, beaconList: () => beacons.map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1), id: b.id, tallest: !!b.tallest })),
    spell: spellIt,
    clear: clearSpell,
    /** a finished bake's metadata swaps in with its layer */
    swap(far, near) { if (far) metaFar = far; if (near) metaNear = near; },
    get spelling() {
      if (!spell) return null;
      const bits = cols => cols.reduce((n, m) => { let b = 0; for (let v = m; v; v >>= 1) b += v & 1; return n + b; }, 0);
      return { text: spell.text, style: spell.style, towers: [...new Set([...spell.parts.map(p => p.tower), ...spell.scrolls.map(S => S.tower)])], scrolls: spell.scrolls.map(S => S.tower),
        cells: spell.parts.reduce((n, p) => n + p.cells.length, 0) + spell.scrolls.reduce((n, S) => n + bits(S.cols), 0) };
    },
    faces: () => Object.fromEntries(Object.entries(faces).map(([id, f]) => [id, { cols: f.cols, rows: f.rows, word: f.word, rect: (() => { const a = f.cell(0, 0), b = f.cell(f.cols - 1, f.rows - 1); return { x: a[0], y: a[1], w: b[0] + b[2] - a[0], h: b[1] + b[3] - a[1] }; })() }])),
    debug: () => ({ beacons: beacons.length, twinkle: metaFar.twinkle.length, tv: metaNear.tv.length, cands: metaNear.cands.length, toggles: toggles.length, sets: sets.size }),
  };
}
