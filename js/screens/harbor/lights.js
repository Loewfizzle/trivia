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
import { winTraits, buildingDice, isLit, winHash, layoutText, normText } from '../../core/harbor-windows.js';
import { cellRect, isDeco } from './blocks.js';
import { project } from '../../core/harbor-layout.js';
import { fog } from './tones.js';
import { skyItems } from './skyline.js';

const WARM = [[255, 214, 158], [255, 205, 136], [255, 226, 186], [255, 193, 120], [255, 234, 204]];
const COOL = [[166, 214, 255], [190, 226, 255], [206, 222, 255]];
const TV = [128, 160, 255];
const NEONW = [[255, 96, 190], [96, 224, 255], [178, 112, 255]];
const AMBER = [255, 194, 122];
const DARK = [8, 8, 20];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const strs = new Map();
const rgba = (c, a) => { const k = `${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.round(a * 50)}`; let s = strs.get(k); if (!s) { s = `rgba(${k.split(',').slice(0, 3).join(',')},${Math.round(a * 50) / 50})`; if (strs.size > 4000) strs.clear(); strs.set(k, s); } return s; };

/** a window's colour (the season's warmth leans tungsten further amber, as City 1.0) */
export function colourOf(tr, warm = 0) {
  let c = tr.cls === 'cool' ? COOL[Math.floor(tr.tone * 3)] : tr.cls === 'tv' ? TV : tr.cls === 'neon' ? NEONW[Math.floor(tr.tone * 3)] : WARM[Math.floor(tr.tone * 5)];
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
  meta.boxes.push({ ...silhouette(x, cam, b), idx });
  x.globalCompositeOperation = 'source-over';
  const g = b.win;
  if (!g || g.rows <= 0) return;
  const s = cam.F / b.z0, deco = isDeco(o.rank), dice = buildingDice(b.seed, o.rank), t = o.tierIndex || 0;
  const fz = fog(b.z0), depthK = 0.6 + 0.4 * (1 - fz);
  const paneW = s * g.pitch[0] * 0.5, room = paneW > 2.2;
  const share = look.share;
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const tr = winTraits(b.seed, t, c, r, dice);
    if (!tr) continue;
    const on = isLit(tr, share);
    const rect = cellRect(cam, b, c, r, deco);
    if (group === 'near' && winHash(b.seed, t, c, r, 12) < 0.05 && meta.cands.length < 220) meta.cands.push({ rect, col: colourOf(tr, look.warm), on, a: tr.a * depthK, idx, id: [b.tower || b.id, t, c, r] });
    if (!on || share <= 0) continue;
    const col = colourOf(tr, look.warm), a = tr.a * depthK;
    const [wx, wy, ww, wh] = rect;
    x.fillStyle = rgba(col, a); x.fillRect(wx, wy, Math.max(0.6, ww), Math.max(0.6, wh));
    if (room) {
      // a hint of the room: the ceiling's light at the top, the furniture's shadow low, a curtain drawn
      x.fillStyle = rgba(mixc(col, [255, 255, 255], 0.35), a * 0.55); x.fillRect(wx, wy, ww, wh * 0.22);
      const k = winHash(b.seed, t, c, r, 13);
      if (tr.cls === 'curtain') { x.fillStyle = rgba([110, 46, 52], 0.55); x.fillRect(wx, wy, ww, wh * 0.42); }
      else if (k < 0.4) { x.fillStyle = rgba(mixc(col, [40, 20, 20], 0.7), a * 0.6); x.fillRect(wx + ww * (k < 0.2 ? 0.1 : 0.45), wy + wh * 0.62, ww * 0.45, wh * 0.38); }
      else if (k < 0.5) { x.fillStyle = rgba([40, 24, 30], 0.55); x.fillRect(wx, wy, ww * 0.18, wh); x.fillRect(wx + ww * 0.82, wy, ww * 0.18, wh); }
    }
    if (tr.cls === 'tv' && meta.tv.length < 18) meta.tv.push({ rect, idx });
    else if (group === 'far' && winHash(b.seed, t, c, r, 14) < 0.03 && meta.twinkle.length < 90) meta.twinkle.push({ rect, col, idx, ph: winHash(b.seed, t, c, r, 15) });
  }
  // the newer city's glass towers: thin lines of light along their crowns at night
  if (o.rank === 'modern' && t === (o.tiers || 1) - 1 && look.night > 0.2) {
    const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c2] = project(cam, b.x1, 0, b.z0), lw = Math.max(0.5, s * 0.12);
    x.fillStyle = rgba([200, 236, 255], 0.75 * look.night * depthK);
    for (let i = 0; i < 3; i++) x.fillRect(a, ty + i * s * 1.6, c2 - a, lw);
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
export const newMeta = () => ({ twinkle: [], tv: [], cands: [], boxes: [], done: false });

/** the word towers' faces on screen: { id: { cols, rows, cell(col, rowFromTop) → rect } } */
export function wordFaces(L) {
  const out = {};
  for (const t of L.towers) if (t.word && t.face) {
    const tr = t.tiers[0], g = tr.win, box = { ...tr, mat: t.mat };
    out[t.id] = { cols: g.cols, rows: t.face.rows, word: t.word, cell: (c, rr) => cellRect(L.cam, box, c, g.rows - 1 - rr, true) };
  }
  return out;
}

const BEACON = { mast: 1, spire: 1, sunburst: 1 };
export function createLights() {
  let L = null, faces = {}, beacons = [], spell = null, toggles = [], nextToggle = 0, sets = new Map();
  let metaFar = newMeta(), metaNear = newMeta();

  function layout(l) {
    L = l; faces = wordFaces(l); toggles = []; spell = spell && respell(spell);
    beacons = [];
    for (const t of l.towers) {
      const top = t.tiers[t.tiers.length - 1], c = top.crown;
      if (!c || !(BEACON[c.t] || t.rank === 'modern') || t.z0 > 600) continue;
      const [x, y] = project(l.cam, (top.x0 + top.x1) / 2, top.y0 + top.h + c.h, top.z0);
      beacons.push({ x, y: y + 0.5, ph: (t.seed % 1000) / 1000, r: Math.max(1.2, 2.2 * l.cam.F / 600) });
    }
  }
  function respell(sp) { const p = place(sp.text, sp.opts); return p ? { ...sp, ...p } : null; }
  function place(text, opts = {}) {
    const lay = layoutText(text, Object.fromEntries(Object.entries(faces).map(([id, f]) => [id, { cols: f.cols, rows: f.rows, word: f.word }])), opts);
    if (!lay) return null;
    const parts = lay.map(p => {
      const f = faces[p.tower], top = Math.max(0, Math.floor((f.rows - p.rows) / 2));
      return { tower: p.tower, cells: p.cells.map(([c, rr]) => ({ rect: f.cell(c, rr), rr: rr - top })), face: f, rows: p.rows };
    });
    return { parts };
  }

  /**
   * Light a message on the word towers. text: letters, digits, ♥ (or <3), ★ (or *), ⚑; opts: { tower: 'wordA'|'wordB'|'wordV',
   * style: 'steady'|'wipe'|'twinkle', colour: [r,g,b], ms (how long; default until cleared), at (start, performance ms) }.
   * Returns false if it does not fit. Night only (it is drawn × the night).
   */
  function spellIt(text, opts = {}) {
    const t = normText(text);
    if (!t || !L) return false;
    const p = place(t, opts);
    if (!p) return false;
    spell = { text: t, opts, ...p, style: opts.style || 'wipe', colour: opts.colour || [255, 238, 206], t0: opts.at ?? performance.now(), until: opts.ms ? (opts.at ?? performance.now()) + opts.ms : Infinity, out: -1 };
    return true;
  }
  function clearSpell(fade = true) { if (spell) { if (fade) spell.out = performance.now(); else spell = null; } }

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
    // the beacons: red, a slow blink, on the tallest crowns
    c.globalCompositeOperation = 'lighter';
    for (const b of beacons) {
      const ph = ((t * 0.62 + b.ph) % 1), on = motion ? (ph < 0.18 ? Math.sin(ph / 0.18 * Math.PI) : 0) : 0.6;
      if (on <= 0.01) continue;
      const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3.2);
      g.addColorStop(0, `rgba(255,70,60,${0.95 * on * k})`); g.addColorStop(0.3, `rgba(255,40,40,${0.4 * on * k})`); g.addColorStop(1, 'rgba(255,40,40,0)');
      c.fillStyle = g; c.fillRect(b.x - b.r * 3.2, b.y - b.r * 3.2, b.r * 6.4, b.r * 6.4);
    }
    c.restore();
  }

  function drawSpell(c, now, k, motion) {
    const sp = spell, el = now - sp.t0;
    if (now > sp.until && sp.out < 0) sp.out = sp.until;
    const fadeIn = Math.min(1, el / 1200), fadeOut = sp.out >= 0 ? Math.max(0, 1 - (now - sp.out) / 1600) : 1;
    if (fadeOut <= 0) { spell = null; return; }
    const env = fadeIn * fadeOut * k;
    for (const p of sp.parts) {
      const f = p.face;
      // the rest of the tower's face dims, so the message reads
      c.fillStyle = rgba(DARK, 0.88 * env);
      for (let rr = 0; rr < f.rows; rr++) for (let col = 0; col < f.cols; col++) { const [x, y, ww, wh] = f.cell(col, rr); c.fillRect(x - 0.2, y - 0.2, ww + 0.4, wh + 0.4); }
      // the letters: the wipe climbs floor by floor from the bottom; the twinkle breathes window by window
      const rows = p.rows;
      for (let i = 0; i < p.cells.length; i++) {
        const cl = p.cells[i];
        let a = 1;
        if (sp.style === 'wipe' && motion) a = Math.max(0, Math.min(1, (el - (rows - 1 - cl.rr) * 160) / 260));
        else if (sp.style === 'twinkle' && motion) a = 0.72 + 0.28 * Math.sin(now / 420 + i * 1.7);
        if (a <= 0) continue;
        const [x, y, ww, wh] = cl.rect;
        c.fillStyle = rgba(sp.colour, a * fadeOut * k); c.fillRect(x - 0.15, y - 0.15, ww + 0.3, wh + 0.3);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba(sp.colour, 0.22 * a * fadeOut * k); c.fillRect(x - ww * 0.35, y - wh * 0.25, ww * 1.7, wh * 1.5);
        c.globalCompositeOperation = 'source-over';
      }
    }
  }

  return {
    layout, set, draw,
    spell: spellIt,
    clear: clearSpell,
    /** a finished bake's metadata swaps in with its layer */
    swap(far, near) { if (far) metaFar = far; if (near) metaNear = near; },
    get spelling() { return spell ? { text: spell.text, style: spell.style, towers: spell.parts.map(p => p.tower), cells: spell.parts.reduce((n, p) => n + p.cells.length, 0) } : null; },
    faces: () => Object.fromEntries(Object.entries(faces).map(([id, f]) => [id, { cols: f.cols, rows: f.rows, word: f.word, rect: (() => { const a = f.cell(0, 0), b = f.cell(f.cols - 1, f.rows - 1); return { x: a[0], y: a[1], w: b[0] + b[2] - a[0], h: b[1] + b[3] - a[1] }; })() }])),
    debug: () => ({ beacons: beacons.length, twinkle: metaFar.twinkle.length, tv: metaNear.tv.length, cands: metaNear.cands.length, toggles: toggles.length, sets: sets.size }),
  };
}
