// THE STREET — the street furniture on the sidewalk at the towers' feet (docs/title.md "THE STREET"; the rules: core/trees.js,
// core/street-life.js). Its own layer (the lobby will stand guests in front of it). scene.js calls:
//   back(c, fs)      after the towers: the trees (each beside its own lamp; seasons, sway, snow, string lights), the lamp posts and
//                    their heads + halos, the bus shelter and its stop sign, the stop light(s) and their glow
//   shadows(c, fs)   on the street, before its reflections: the long soft golden-hour shadows, pointing away from the real sun
//   ground(c, fs, streak)  after the street's reflections: the lamps' pools and broken streaks in the wet street, the signal's
//                    streak (capped above the dock), the shelter panel's light, the fallen leaves (piles + scattered, wet in rain)
//   front(c, fs)     over the street: leaves / petals falling from the trees (only from the trees), fireflies by the trees
// Light, colour and motion carry it at phone size; shapes are dark silhouettes, baked once into sprites.
import { treeState, treeKey } from '../../core/trees.js';
import { streetLayout, signalAt, lampLit, SIZE } from '../../core/street-life.js';
import { partyHour } from '../../core/party.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
function rng(seed) { let a = Math.floor(hash(String(seed)) * 4294967296) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const WARM = [255, 206, 142];                 // the lamps' warm white
const LEAF = { green: [62, 128, 58], gold: [226, 176, 46], orange: [222, 110, 34], red: [184, 40, 34] };
const YOUNG = [140, 196, 82], BUD = [176, 206, 120], BLOSSOM = [255, 196, 216];
const SIG = { red: [255, 46, 46], yellow: [255, 176, 40], green: [46, 255, 150], flash: [255, 176, 40] };
const INK = 'rgba(8,8,16,0.97)';

export function createFurniture() {
  let W = 1, H = 1, HZ = 1, dpr = 1, K = 1, tier = 2;
  let lay = null, layKey = '', shown = 0;
  let states = [], snowCover = 0;
  const lampLv = [], lampCol = [], lampBoost = [];
  const sprites = new Map();
  let treeBake = [];                           // per tree: { key, night, dayL, dayR, lit, mask: {r,g,b}, branches, branchLit, snow, tips }
  let falling = [], grounded = [], flies = [], leafCv = null, leafKey = '';
  let gust = { t0: -99, dur: 0, next: 6 }, chase = null, chases = 0, midnightAt = null, lastBar = -1;
  let info = { signals: [], shelter: null, lamps: [] };
  let dbg = {};

  // ---------------------------------------------------------------- sprites (cached; colours quantised so the cache stays small)
  const q16 = c => c.map(v => Math.round(v / 16) * 16);
  function sprite(key, w, h, paint) { let s = sprites.get(key); if (!s) { s = mk(w, h); paint(s.getContext('2d'), w, h); sprites.set(key, s); if (sprites.size > 160) sprites.delete(sprites.keys().next().value); } return s; }
  const glow = c => { const k = q16(c); return sprite(`g${k}`, 64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, rgba(k, 1)); g.addColorStop(0.3, rgba(k, 0.45)); g.addColorStop(1, rgba(k, 0)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }); };
  const cone = c => { const k = q16(c); return sprite(`c${k}`, 64, 128, (x) => { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, rgba(k, 0.55)); g.addColorStop(1, rgba(k, 0)); x.fillStyle = g; x.beginPath(); x.moveTo(26, 0); x.lineTo(38, 0); x.lineTo(64, 128); x.lineTo(0, 128); x.closePath(); x.fill(); }); };
  // a lamp's whole light baked once per colour: the halo, the hot core under the hood, the downward cone (one draw a frame)
  const lampLight = col => { const k = q16(col); const hy0 = 15 * K, coneH = (SIZE.lampH - 1.2) * K; return sprite(`ll${k}|${K}|${dpr}`, Math.ceil(30 * K * 2), Math.ceil((hy0 + coneH) * 2), (x, w, h) => {
    x.scale(2, 2); const cx = 15 * K;
    const g = x.createRadialGradient(cx, hy0, 0, cx, hy0, 15 * K); g.addColorStop(0, rgba(k, 0.9)); g.addColorStop(0.3, rgba(k, 0.4)); g.addColorStop(1, rgba(k, 0));
    x.fillStyle = g; x.fillRect(0, 0, 30 * K, hy0 * 2);
    const cg = x.createLinearGradient(0, hy0, 0, hy0 + coneH); cg.addColorStop(0, rgba(k, 0.12)); cg.addColorStop(1, rgba(k, 0));
    x.fillStyle = cg; x.beginPath(); x.moveTo(cx - 2 * K, hy0); x.lineTo(cx + 2 * K, hy0); x.lineTo(cx + 14 * K, hy0 + coneH); x.lineTo(cx - 14 * K, hy0 + coneH); x.closePath(); x.fill();
    const hc = mix(k, [255, 255, 255], 0.6), cg2 = x.createRadialGradient(cx, hy0, 0, cx, hy0, 2.6 * K); cg2.addColorStop(0, rgba(hc, 1)); cg2.addColorStop(1, rgba(hc, 0));
    x.fillStyle = cg2; x.fillRect(cx - 3 * K, hy0 - 3 * K, 6 * K, 6 * K);
    void w; void h;
  }); };
  const blob = () => sprite('blob', 32, 32, (x) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); });

  // ---------------------------------------------------------------- layout (once the blade signs have their places)
  function layout(fs) {
    const bl = fs.blades;
    if (!bl || !bl.key || bl.list.some(b => !Number.isFinite(b.x))) return false;
    const key = `${W}|${H}|${HZ}|${bl.key}|${fs.signalMode || 'right'}`;
    if (key !== layKey) {
      dbg.layouts = (dbg.layouts || 0) + 1; dbg.lastKey = key;
      layKey = key;
      const phone = W < 760 || H > W;
      const next = streetLayout({ W, HZ, K, phone, seed: 'street', blades: bl.list, signal: fs.signalMode || 'right' });
      // (the signs re-place when the title's clear zones shift — often to the same places: then nothing changes on the street;
      // a real move cross-fades from a little lower instead of popping to nothing)
      const sig = L => JSON.stringify([L.lamps.map(l => Math.round(l.x)), L.trees.map(t => Math.round(t.x)), L.shelter && Math.round(L.shelter.x), L.signals.map(g => Math.round(g.x))]);
      if (lay && sig(lay) === sig(next)) return true;
      const had = !!lay;
      lay = next;
      shown = had ? Math.min(shown, 0.5) : 0; treeBake = lay.trees.map(() => null); falling = []; grounded = []; flies = [];
      lay.lamps.forEach((l, i) => { lampLv[i] = 0; lampCol[i] = WARM.slice(); lampBoost[i] = 0; l.d = hash(`lamp|${i}|${Math.round(l.x)}`); });
      lay.branches = lay.trees.map((t, i) => bakeBranches(t, i));
      const obst = [...lay.lamps.map(l => [l.x - 4 * K, l.x + 4 * K]), ...lay.trees.map(t => [t.x - t.w / 2, t.x + t.w / 2]), ...(lay.shelter ? [[lay.shelter.x - lay.shelter.w / 2 - 4 * K, lay.shelter.x + lay.shelter.w / 2 + 4 * K]] : []), ...lay.signals.map(g => [g.x - (SIZE.signalArm + 3) * K, g.x + 3 * K])];
      lay.doorClear = [Math.max(0, ...obst.filter(o => o[1] < lay.door.x).map(o => o[1])), Math.min(W, ...obst.filter(o => o[0] > lay.door.x).map(o => o[0]))];
    }
    return true;
  }

  // the bare branching (fine branches that still read): baked once per tree; the tips carry the string lights
  function bakeBranches(t, i) {
    const R = rng(`br|${i}|${Math.round(t.x)}`);
    const w = t.w, h = SIZE.canopyH * K, trunk = SIZE.trunkH * K;
    const s = Math.min(dpr, 2), cw = w + 10 * K, ch = h + trunk + 6 * K;
    const segs = [], tips = [];
    const grow = (x, y, ang, len, wid, depth) => {
      const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
      segs.push({ x, y, x2, y2, wid });
      if (depth <= 0 || len < 2.2 * K) { tips.push({ x: x2, y: y2 }); return; }
      const n = depth > 2 ? 2 : 2 + (R() < 0.4 ? 1 : 0);
      for (let k = 0; k < n; k++) grow(x2, y2, ang + (k - (n - 1) / 2) * (0.55 + R() * 0.35) + (R() - 0.5) * 0.2, len * (0.66 + R() * 0.12), wid * 0.66, depth - 1);
    };
    const bx = cw / 2, by = ch - 1;
    segs.push({ x: bx, y: by, x2: bx, y2: by - trunk, wid: 1.9 * K });
    grow(bx, by - trunk, -0.45, h * 0.36, 1.25 * K, 4); grow(bx, by - trunk, 0.45, h * 0.36, 1.25 * K, 4); grow(bx, by - trunk, 0.05, h * 0.4, 1.3 * K, 4);
    const paint = (col, dx = 0, dy = 0, wk = 1) => { const c = mk(cw * s, ch * s), x = c.getContext('2d'); x.scale(s, s); x.strokeStyle = col; x.lineCap = 'round'; for (const g of segs) { x.lineWidth = Math.max(0.45, g.wid * wk); x.beginPath(); x.moveTo(g.x + dx, g.y + dy); x.lineTo(g.x2 + dx, g.y2 + dy); x.stroke(); } return c; };
    const dark = paint('rgba(14,11,16,0.96)');
    // the lamp-facing edges catch the light (winter); snow on the upper sides
    const lit = paint('rgba(255,190,120,0.85)', 0, 0, 0.45);
    const snow = (() => { const c = mk(cw * s, ch * s), x = c.getContext('2d'); x.scale(s, s); x.strokeStyle = 'rgba(240,246,255,0.95)'; x.lineCap = 'round'; for (const g of segs) { const flat = Math.abs(g.x2 - g.x) / (Math.hypot(g.x2 - g.x, g.y2 - g.y) || 1); if (flat < 0.35) continue; x.lineWidth = Math.max(0.6, g.wid * 0.9); x.beginPath(); x.moveTo(g.x, g.y - g.wid * 0.6); x.lineTo(g.x2, g.y2 - g.wid * 0.6); x.stroke(); } return c; })();
    return { dark, lit, snow, tips: tips.filter((p, k) => k % 2 === 0).slice(0, 14), cw, ch, bx, by };
  }

  // the canopy for a state: clusters of small leaf blobs, baked as: night (the season's colour, dark, never black), day lit from
  // the left / right (the real sun's side), the lamp-lit side (true colours, bright), and that side as a white mask in three
  // channels (so any lamp colour can tint it with three additive draws)
  function bakeCanopy(t, i, st, lampSide) {
    const key = `${treeKey(st)}|${lampSide}`;
    const old = treeBake[i];
    if (old && old.key === key) return old;
    const R = rng(`cn|${i}|${Math.round(t.x)}`);
    const w = t.w, h = SIZE.canopyH * K, s = Math.min(dpr, 2);
    const cw = w + 10 * K, ch = h + 8 * K;
    const dens = Math.max(st.leaf, st.blossom, st.bud * 0.35);
    const n = Math.round((st.blossom > 0.05 ? 170 : 150) * dens);
    const blobs = [];
    const pick = () => {
      if (st.blossom > 0.05 && R() < st.blossom) return mix(BLOSSOM, [255, 238, 244], R() * 0.5);
      if (st.leaf < 0.2 && st.bud > 0.05) return BUD;
      const m = st.mix; let r = R(), col = LEAF.green;
      for (const k of ['green', 'gold', 'orange', 'red']) { if (r < m[k]) { col = LEAF[k]; break; } r -= m[k]; }
      if (col === LEAF.green && st.young > 0) col = mix(LEAF.green, YOUNG, st.young);
      return mix(col, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], R() * 0.6);
    };
    // the canopy's mass first (a few overlapping lobes in a deeper shade: no gaps between the leaves), then the leaf clusters
    if (dens > 0.3) {
      const lobes = 6 + Math.floor(R() * 3);
      for (let k = 0; k < lobes; k++) {
        const a = (k / lobes) * TAU + R() * 0.5, rr = 0.18 + R() * 0.16;
        const col = pick();
        blobs.push({ x: cw / 2 + Math.cos(a) * w * rr, y: ch / 2 + 1.5 * K + Math.sin(a) * h * rr * 0.9, r: w * (0.2 + R() * 0.07) * Math.min(1, dens * 1.25), col: col.map(v => v * 0.62) });
      }
    }
    for (let k = 0; k < n; k++) {
      const a = R() * TAU, rr = Math.sqrt(R());
      const bx = cw / 2 + Math.cos(a) * rr * w * 0.47, by = ch / 2 + 1 * K + Math.sin(a) * rr * h * 0.45 - (1 - rr) * 2 * K;
      blobs.push({ x: bx, y: by, r: (st.blossom > 0.05 ? 1.35 : 1.5 + R() * 1.1) * K * (0.8 + 0.4 * dens), col: pick() });
    }
    const paint = (fn) => { const c = mk(cw * s, ch * s), x = c.getContext('2d'); x.scale(s, s); for (const b of blobs) { const r = fn(b); if (!r) continue; x.fillStyle = r; x.beginPath(); x.arc(b.x, b.y, b.r, 0, TAU); x.fill(); } return c; };
    const side = (b, dir) => clamp01(0.5 + dir * (b.x - cw / 2) / w + (ch / 2 - b.y) / h * 0.6);
    const night = paint(b => rgba(mix(b.col.map(v => v * 0.3), [18, 22, 40], 0.3), 0.97));
    const dayL = paint(b => rgba(b.col.map(v => v * (0.72 + 0.42 * side(b, -1))), 1));
    const dayR = paint(b => rgba(b.col.map(v => v * (0.72 + 0.42 * side(b, 1))), 1));
    // the lamp side: the light falls down through the top and across the half that faces the lamp
    const lampAt = { x: cw / 2 - lampSide * w * 0.42, y: -2 * K };
    const litK = b => { const d = Math.hypot(b.x - lampAt.x, (b.y - lampAt.y) * 1.25) / (w * 0.95); return clamp01(1.15 - d); };
    const lit = paint(b => { const k = litK(b); return k > 0.02 ? rgba(b.col.map(v => Math.min(255, v * 1.15 + 40)), k) : null; });
    const chan = c => paint(b => { const k = litK(b); return k > 0.02 ? rgba(c, k * 0.9) : null; });
    const nb = { key, night, dayL, dayR, lit, mask: { r: chan([255, 0, 0]), g: chan([0, 255, 0]), b: chan([0, 0, 255]) }, cw, ch, cols: blobs.length ? blobs.map(b => b.col) : [LEAF.gold] };
    if (old) for (const cv of [old.night, old.dayL, old.dayR, old.lit, old.mask.r, old.mask.g, old.mask.b]) cv.width = 0;
    treeBake[i] = nb;
    return nb;
  }

  // the canopy's lit side for a lamp colour, composed once (quantised colours: a party's lamps hold steady, a warm-up blends)
  function litFor(cb, lc) {
    const q = q16(lc), key = q.join(',');
    cb.tints = cb.tints || new Map();
    let cv = cb.tints.get(key);
    if (!cv) {
      const pc = clamp01((Math.abs(q[0] - WARM[0]) + Math.abs(q[1] - WARM[1]) + Math.abs(q[2] - WARM[2])) / 120);
      cv = mk(cb.lit.width, cb.lit.height); const x = cv.getContext('2d');
      x.globalAlpha = 0.95 * (1 - 0.55 * pc); x.drawImage(cb.lit, 0, 0);
      x.globalCompositeOperation = 'lighter';
      if (pc > 0.01) for (const [ch, v] of [['r', q[0]], ['g', q[1]], ['b', q[2]]]) { x.globalAlpha = Math.min(1, pc * 0.42 * (v / 255)); x.drawImage(cb.mask[ch], 0, 0); }
      cb.tints.set(key, cv);
      if (cb.tints.size > 6) { const old = cb.tints.keys().next().value; cb.tints.get(old).width = 0; cb.tints.delete(old); }
    }
    return cv;
  }
  // the lamp post (both arm directions), the shelter, the stop light — dark silhouettes
  const post = side => sprite(`post${side}|${K}|${dpr}`, (SIZE.arm + 8) * K * 2, (SIZE.lampH + 3) * K * 2, (x) => {
    x.scale(2, 2); const h = SIZE.lampH * K, ox = side > 0 ? 3 * K : (SIZE.arm + 5) * K;
    x.fillStyle = INK; x.fillRect(ox - 0.7 * K, 2 * K, 1.4 * K, h); x.fillRect(ox - 1.5 * K, h, 3 * K, 2.6 * K);   // the post, its foot
    x.strokeStyle = INK; x.lineWidth = 1.1 * K; x.beginPath(); x.moveTo(ox, 3 * K); x.quadraticCurveTo(ox, 1.2 * K, ox + side * SIZE.arm * K, 1.8 * K); x.stroke();   // the arm
    x.beginPath(); x.ellipse(ox + side * SIZE.arm * K, 2.6 * K, 2.4 * K, 1.1 * K, 0, Math.PI, TAU); x.fill();        // the head's hood
  });
  const shelterSpr = (day) => sprite(`sh${day}|${K}|${dpr}`, (SIZE.shelterW + 4) * K * 2, (SIZE.shelterH + 3) * K * 2, (x) => {
    x.scale(2, 2); const w = SIZE.shelterW * K, h = SIZE.shelterH * K, o = 2 * K;
    x.fillStyle = day ? 'rgba(170,196,214,0.32)' : 'rgba(60,80,110,0.28)'; x.fillRect(o, o + 1.6 * K, w, h - 1.6 * K);   // the glass
    x.fillStyle = INK; x.fillRect(o - 0.6 * K, o, w + 1.2 * K, 1.8 * K);                                              // the roof
    x.fillRect(o, o, 0.9 * K, h + 1 * K); x.fillRect(o + w - 0.9 * K, o, 0.9 * K, h + 1 * K);                          // the frame
    x.fillRect(o, o + h * 0.62, w, 0.6 * K);                                                                         // the bench rail
    if (day) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(o + 2 * K, o + 3 * K, 0.7 * K, h * 0.5); }
  });
  const signalSpr = () => sprite(`sig|${K}|${dpr}`, (SIZE.signalArm + 8) * K * 2, (SIZE.signalH + 3) * K * 2, (x) => {
    x.scale(2, 2); const h = SIZE.signalH * K, px = (SIZE.signalArm + 5) * K;
    x.fillStyle = INK; x.fillRect(px - 0.8 * K, 1 * K, 1.6 * K, h); x.fillRect(px - 1.6 * K, h - 0.4 * K, 3.2 * K, 2.6 * K);
    x.fillRect(px - SIZE.signalArm * K, 1.6 * K, SIZE.signalArm * K, 1.1 * K);                                     // the mast arm over the road
    x.fillRect(px - SIZE.signalArm * K - 1.8 * K, 2.4 * K, 3.6 * K, 10.4 * K);                                       // the head
    x.fillRect(px + 0.8 * K, h * 0.55, 2.4 * K, 2.8 * K);                                                            // the pedestrian signal
  });

  // ---------------------------------------------------------------- per frame state
  function lampColor(i, fs) {
    const p = fs.party;
    if (!p || p.on <= 0 || !p.palette) return WARM;
    const hr = partyHour(fs.L.local);
    const d = lay.lamps[i].d;
    // the warm-up: one by one into the party's colours; after hours: back to warm white by 2 am
    const inK = p.forced ? 1 : smooth(20.15 + d * 1.4, 20.4 + d * 1.4, hr ?? 23);
    const outK = p.forced ? 0 : smooth(24.2 + d * 1.3, 24.6 + d * 1.3, hr ?? 23);
    const k = clamp01(inK * (1 - outK)) * clamp01(p.on);
    // (only the palette's colours that read as party light — a gold next to warm white would look like no change)
    const pal = p.palette.filter(c => Math.abs(c[0] - WARM[0]) + Math.abs(c[1] - WARM[1]) + Math.abs(c[2] - WARM[2]) > 90);
    const use = pal.length ? pal : p.palette;
    const col = use[(i + 1) % use.length];
    return mix(WARM, col, k);
  }

  function update(fs) {
    const { L, t, dt, motion } = fs;
    const sec = Math.min(0.1, dt / 1000), speed = fs.speed || 1;
    shown = Math.min(1, shown + sec / 1.1);
    // the trees' states (cheap; once a second is plenty — the date barely moves)
    dbg.t = t;
    if (!states.length || (t * 1 | 0) !== dbg.stT) {
      dbg.stT = t | 0;
      const f = fs.force;
      states = lay.trees.map((tr, i) => {
        const s = treeState(L.local, { south: L.south, i, cherry: tr.cherry, seed: `${Math.round(L.lat * 2)}|${Math.round(L.lon * 2)}` });
        if (f.has('blossom') && tr.cherry) { s.blossom = 1; s.leaf = Math.min(s.leaf, 0.15); s.shed = Math.max(s.shed, 0.5); s.bare = false; }
        if (f.has('shed')) { s.shed = 1; if (s.leaf < 0.3) { s.leaf = 0.6; s.mix = { green: 0.1, gold: 0.4, orange: 0.35, red: 0.15 }; s.bare = false; } s.ground = Math.max(s.ground, 0.7); }
        if (f.has('lights')) s.lights = true;
        return s;
      });
    }
    // snow settles on the branches (and the shelter, the bus roof) while it snows, melts slowly after
    snowCover = L.snow > 0.15 ? Math.min(1, snowCover + sec * speed * L.snow / 60) : Math.max(0, snowCover - sec * speed / (L.temp != null && L.temp < 0 ? 1800 : 400));
    if (!dbg.snowInit) { dbg.snowInit = 1; if (L.snow > 0.15) snowCover = 0.7; }
    // the wind (live, or &wind=): sway, gusts that lean the whole row together and spring back
    const wind = L.wind || 0, pushX = Math.sin((L.windDir || 0) * Math.PI / 180) || -1;
    gust.next -= sec * speed;
    if ((fs.force.has('gust') && t - gust.t0 > 7) || (gust.next <= 0 && wind > 3.5)) { gust = { t0: t, dur: 2.2 + Math.random() * 1.6, next: (25 - Math.min(16, wind * 1.4)) * (0.6 + Math.random() * 0.8) }; }
    else if (gust.next <= 0) gust.next = 10;
    // the lamps: photocells, the party's colours, the beat, the chase, the midnight sequence
    const p = fs.party && fs.party.on > 0 ? fs.party : null;
    const peak = p ? smooth(0.85, 1, p.energy) * p.ramp : 0;
    const fancy = motion && tier > 0;
    if (p && fancy && peak > 0.5 && p.beat && p.bar !== lastBar && (p.bar % 8 === 0)) { chase = { t0: t, dir: chases % 2 ? -1 : 1 }; chases++; }
    if (fs.force.has('chase') && fancy && (!chase || t - chase.t0 > 3.5)) { chase = { t0: t, dir: chases % 2 ? -1 : 1 }; chases++; }
    if (p) lastBar = p.bar;
    const n = lay.lamps.length;
    lay.lamps.forEach((l, i) => {
      const on = lampLit(L, l.d) ? 1 : 0;
      lampLv[i] += (on - lampLv[i]) * Math.min(1, sec * (on ? 0.9 : 1.6));
      lampCol[i] = lampColor(i, fs);
      let b = 0;
      if (p && fancy) b += 0.38 * peak * p.breath;               // breathing on the beat (bold enough to see at arm's length)
      if (chase && fancy) {
        const u = (t - chase.t0) / 0.95, pos = chase.dir > 0 ? u : 1 - u;
        const xn = n > 1 ? i / (n - 1) : 0.5;
        b += 1.3 * Math.exp(-Math.pow((xn - pos) / 0.16, 2)) * (u < 1.25 ? 1 : 0);
      }
      if (midnightAt != null && fancy) {
        const order = Math.abs(i - (n - 1) / 2), maxO = (n - 1) / 2 || 1;
        const at = midnightAt + (maxO - order) * 0.16;           // the outer lamps first, toward the middle
        const u = t - at; if (u > 0 && u < 0.6) b += 1.6 * (1 - u / 0.6);
      }
      lampBoost[i] = b;
    });
    if (chase && t - chase.t0 > 1.4) chase = null;
    if (midnightAt != null && t - midnightAt > 3) midnightAt = null;
    // the signals
    const hr = L.local ? L.local.h + L.local.mi / 60 : 20;
    info = {
      shelter: lay.shelter ? { x: lay.shelter.x + fs.camX, w: lay.shelter.w } : null,
      signals: lay.signals.map((g, i) => {
        let s = signalAt(fs.now, hr, { offset: i * 9 });
        if (fs.force.has('red')) s = { state: 'red', t: 0 }; else if (fs.force.has('green')) s = { state: 'green', t: 0 };
        return { x: g.x + fs.camX, headX: g.x + fs.camX - SIZE.signalArm * K, ...s };
      }),
      lamps: lay.lamps.map((l, i) => ({ x: l.x + fs.camX, lit: lampLv[i], col: lampCol[i], boost: lampBoost[i] })),
      // the speakeasy's door (Part 2: district/people.js): its spot and the clear sidewalk either side, up to a lamp / tree / shelter
      door: { x: lay.door.x + fs.camX, w: lay.door.w, left: lay.doorClear[0] + fs.camX, right: lay.doorClear[1] + fs.camX },
      gust: gustK(t), wind, pushX, snowCover,
    };
  }
  const gustK = t => { const u = t - gust.t0; if (u < 0 || u > gust.dur + 2) return 0; return u < 1 ? smooth(0, 1, u) : u < gust.dur ? 1 : 1 - smooth(gust.dur, gust.dur + 2, u); };

  // ---------------------------------------------------------------- drawing
  function back(c, fs) {
    if (!layout(fs)) return;
    update(fs);
    const { L, t, motion } = fs;
    const ox = fs.camX;
    const dark = clamp01(L.w.night + L.w.late + (L.alwaysNight ? 1 : 0));
    const dayK = clamp01(1 - dark - 0.5 * (L.w.golden + L.w.dawn) * 0);
    const sunLeft = L.sun ? L.sun.az < 180 : true;
    const fog = L.fog || 0;
    c.save();
    c.globalAlpha = shown;
    // the trees
    if (!fs.force.has('no-st-trees')) lay.trees.forEach((tr, i) => {
      const st = states[i]; if (!st) return;
      const lamp = lay.lamps[tr.lamp] || null;
      const lampSide = lamp ? Math.sign(lamp.x - tr.x) || 1 : 1;
      const cb = bakeCanopy(tr, i, st, lampSide), br = lay.branches[i];
      const x = tr.x + ox, base = HZ + 0.5;
      // the sway: a transform on the baked sprites (calm: almost still; a gust leans the row together and springs back)
      let a = 0;
      if (motion && tier > 0) {
        const w = info.wind;
        a = (0.004 + 0.0032 * w) * Math.sin(t * (1.1 + 0.2 * (i % 3)) + i * 1.7) + 0.0055 * Math.min(12, w) * info.gust * info.pushX * smooth(0, 0.4, t - gust.t0 - tr.x / W * 0.35);
        a = Math.max(-0.08, Math.min(0.08, a));
      }
      c.save(); c.translate(x, base); c.rotate(a);
      const lampK = lamp ? lampLv[tr.lamp] * dark : 0;
      const lc = lamp ? lampCol[tr.lamp] : WARM, lb = lamp ? 1 + lampBoost[tr.lamp] : 1;
      // the branches (bare in winter, showing through a thin canopy)
      const sb = Math.min(dpr, 2);
      if (st.leaf < 0.85 || st.blossom > 0) {
        c.globalAlpha = shown; c.drawImage(br.dark, -br.bx, -br.by, br.cw, br.ch);
        if (lampK > 0.02 && st.leaf < 0.4) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = shown * lampK * 0.32 * (1 - st.leaf) * Math.min(1.6, lb); c.drawImage(br.lit, -br.bx + lampSide * 0.5, -br.by, br.cw, br.ch); c.globalCompositeOperation = 'source-over'; }
        if (snowCover > 0.05) { c.globalAlpha = shown * snowCover * (1 - st.leaf); c.drawImage(br.snow, -br.bx, -br.by, br.cw, br.ch); }
      } else { c.globalAlpha = shown; c.fillStyle = INK; c.fillRect(-0.9 * K, -SIZE.trunkH * K - 2 * K, 1.8 * K, SIZE.trunkH * K + 2 * K); }
      // the canopy
      if (st.leaf > 0.03 || st.blossom > 0.03 || st.bud > 0.1) {
        const cx = -cb.cw / 2, cy = -SIZE.trunkH * K - cb.ch + 3 * K;
        c.globalAlpha = shown; c.drawImage(cb.night, cx, cy, cb.cw, cb.ch);
        if (dayK > 0.01) { c.globalAlpha = shown * dayK; c.drawImage(sunLeft ? cb.dayL : cb.dayR, cx, cy, cb.cw, cb.ch); }
        if (lampK > 0.02) {
          c.globalCompositeOperation = 'lighter';
          // the lamp's colour on the lamp-facing half: warm white = the leaves' own colours lit; a party colour = tinted
          // (a party colour tints the lamp-facing edge; the leaves keep some of their own colour under it)
          c.globalAlpha = Math.min(1, shown * lampK * Math.min(1.9, lb)); c.drawImage(litFor(cb, lc), cx, cy, cb.cw, cb.ch);
          c.globalCompositeOperation = 'source-over';
        }
        if (snowCover > 0.3 && st.leaf > 0.2) { c.globalAlpha = shown * (snowCover - 0.3) * 0.8; c.fillStyle = 'rgba(236,242,255,0.9)'; c.beginPath(); c.ellipse(0, cy + cb.ch * 0.22, cb.cw * 0.34, 1.6 * K, 0, 0, TAU); c.fill(); }
      }
      // string lights (Thanksgiving → early January) / a few Halloween bulbs: tiny warm bulbs at the tips, a soft glow, never blinking
      if ((st.lights || st.halloween) && dark > 0.2) {
        c.globalCompositeOperation = 'lighter';
        br.tips.forEach((p, k) => {
          const col = st.halloween && !st.lights ? (k % 2 ? [255, 120, 20] : [170, 70, 255]) : [255, 196, 120];
          if (st.halloween && !st.lights && k > 6) return;
          const px = p.x - br.bx, py = p.y - br.by;
          c.globalAlpha = shown * dark * 0.8; c.drawImage(glow(col), px - 2.6 * K, py - 2.6 * K, 5.2 * K, 5.2 * K);
          c.globalAlpha = shown * dark; c.fillStyle = rgba(mix(col, [255, 255, 255], 0.5), 1); c.fillRect(px - 0.4, py - 0.4, 0.8, 0.8);
        });
        c.globalCompositeOperation = 'source-over';
      }
      c.restore();
      void sb;
    });
    // the bus shelter + its stop sign, its ad panel softly lit after dark
    if (lay.shelter) {
      const s = lay.shelter, x = s.x + ox - s.w / 2 - 2 * K, y = HZ - (SIZE.shelterH + 2) * K;
      c.globalAlpha = shown; c.drawImage(shelterSpr(dark < 0.5), x, y, (SIZE.shelterW + 4) * K, (SIZE.shelterH + 3) * K);
      const panelX = s.x + ox + s.side * s.w * 0.3 - 2.6 * K;
      c.fillStyle = dark > 0.4 ? rgba([255, 232, 214], 0.85 * shown) : rgba([200, 210, 220], 0.7 * shown);
      c.fillRect(panelX, HZ - SIZE.shelterH * K + 3 * K, 5.2 * K, 8 * K);
      if (dark > 0.4) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = shown * dark * 0.5; c.drawImage(glow([255, 160, 210]), panelX - 6 * K, HZ - SIZE.shelterH * K - 3 * K, 17 * K, 20 * K); c.globalCompositeOperation = 'source-over'; }
      if (snowCover > 0.05) { c.globalAlpha = shown * snowCover; c.fillStyle = 'rgba(238,244,255,0.95)'; c.fillRect(x + 1.4 * K, y + 0.6 * K, s.w + 1.2 * K, 1.1 * K); }
      const ss = lay.stopSign; if (ss) { c.globalAlpha = shown; c.fillStyle = INK; c.fillRect(ss.x + ox - 0.4 * K, HZ - 18 * K, 0.8 * K, 18 * K); c.fillStyle = dark > 0.5 ? 'rgba(60,110,200,0.9)' : 'rgba(40,110,210,0.95)'; c.fillRect(ss.x + ox - 2 * K, HZ - 19 * K, 4 * K, 3.4 * K); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(ss.x + ox - 1.2 * K, HZ - 18.2 * K, 2.4 * K, 0.7 * K); }
    }
    // the lamp posts (in front of their trees: a post is never hidden in the leaves), the heads, their light
    if (!fs.force.has('no-st-lamps')) lay.lamps.forEach((l, i) => {
      const x = l.x + ox, side = l.side;
      const pw = (SIZE.arm + 8) * K, ph = (SIZE.lampH + 3) * K, off = side > 0 ? 3 * K : (SIZE.arm + 5) * K;
      c.globalAlpha = shown; c.drawImage(post(side), x - off, HZ - SIZE.lampH * K - 2 * K, pw, ph);
      const lv = lampLv[i] * shown; if (lv < 0.01) return;
      const hx = x + side * SIZE.arm * K, hy = HZ - SIZE.lampH * K + 1.2 * K;
      const col = lampCol[i], b = 1 + lampBoost[i];
      c.globalCompositeOperation = 'lighter';
      const sc = (1 + 0.6 * fog) * (1 + 0.3 * lampBoost[i]);
      const ll = lampLight(col), lw = 30 * K * sc, lh = (HZ - hy + 15 * K);
      c.globalAlpha = Math.min(1, lv * 0.8 * Math.min(1.7, b)); c.drawImage(ll, hx - lw / 2, hy - 15 * K * sc, lw, lh + 15 * K * (sc - 1));
      c.globalCompositeOperation = 'source-over';
    });
    // the stop light(s): the lamp that's on glows (that's what reads at phone size)
    info.signals.forEach(g => {
      const x = g.x, pw = (SIZE.signalArm + 8) * K, px = (SIZE.signalArm + 5) * K;
      c.globalAlpha = shown; c.drawImage(signalSpr(), x - px, HZ - SIZE.signalH * K - 1 * K, pw, (SIZE.signalH + 3) * K);
      const st = g.state === 'dark' ? null : g.state;
      const hx = g.headX, slot = { red: 0, yellow: 1, flash: 1, green: 2 }[st];
      if (st) {
        const hy = HZ - SIZE.signalH * K + (3.4 + slot * 3.2) * K, col = SIG[st];
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = shown * (0.55 + 0.45 * dark); c.drawImage(glow(col), hx - 8 * K, hy - 8 * K, 16 * K, 16 * K);
        c.globalAlpha = shown; c.fillStyle = rgba(mix(col, [255, 255, 255], 0.35), 1); c.beginPath(); c.arc(hx, hy, 1.15 * K, 0, TAU); c.fill();
        // the pedestrian signal: an orange hand while the cars go, the white walker on red
        const walk = st === 'red';
        c.globalAlpha = shown * (0.5 + 0.5 * dark); c.drawImage(glow(walk ? [235, 240, 255] : [255, 120, 30]), x + 1.6 * K - 3 * K, HZ - SIZE.signalH * K * 0.45 + 1.4 * K - 3 * K, 6 * K, 6 * K);
        c.globalCompositeOperation = 'source-over';
      }
    });
    c.restore();
    c.globalAlpha = 1;
  }

  // the long soft golden-hour shadows, pointing away from the real sun (the view faces south: evening sun on the right → left)
  function shadows(c, fs) {
    if (!lay) return;
    const L = fs.L, el = L.sun ? L.sun.el : -10;
    if (el < 0.4 || el > 16 || L.alwaysNight) return;
    const k = smooth(0.4, 2.5, el) * (1 - smooth(9, 16, el)) * (1 - smooth(0.55, 0.85, L.cloud || 0)) * (L.rain ? 0.3 : 1) * shown;
    if (k < 0.02) return;
    const dir = L.sun.az >= 180 ? -1 : 1;
    const len = Math.min(9, 1 / Math.tan(Math.max(1.2, el) * Math.PI / 180)) * K;   // per point of height
    const ox = fs.camX;
    c.save();
    // the low sun raking across the sidewalk and the street (warm), so the shadows have light to fall across
    const sc = L.sun.el < 6 ? [255, 150, 70] : [255, 196, 120];
    const wash = c.createLinearGradient(0, HZ, 0, HZ + 16 * K);
    wash.addColorStop(0, rgba(sc, 0.3 * k)); wash.addColorStop(1, rgba(sc, 0));
    c.globalCompositeOperation = 'lighter'; c.fillStyle = wash; c.fillRect(0, HZ, W, 16 * K); c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(6,8,20,1)';
    const streakTo = (x, h, wid) => {
      const L2 = h * len * 0.32, y = HZ + 1.2 * K;
      c.globalAlpha = 0.5 * k;
      c.beginPath(); c.moveTo(x - wid / 2, y); c.lineTo(x + wid / 2, y); c.lineTo(x + dir * L2 + wid, y + L2 * 0.07 + 1.2 * K); c.lineTo(x + dir * L2 - wid, y + L2 * 0.07 + 1.2 * K); c.closePath(); c.fill();
      return { ex: x + dir * L2, ey: y + L2 * 0.07 };
    };
    lay.trees.forEach(tr => { const e = streakTo(tr.x + ox, SIZE.trunkH * K + SIZE.canopyH * K * 0.5, 1.6 * K); const cw = tr.w * 1.5; c.globalAlpha = 0.5 * k; c.drawImage(blob(), e.ex - cw / 2 + dir * cw * 0.25, e.ey - 2 * K, cw, 6 * K); });
    lay.lamps.forEach(l => streakTo(l.x + ox, SIZE.lampH * K, 1.2 * K));
    info.signals.forEach(g => streakTo(g.x, SIZE.signalH * K, 1.3 * K));
    if (lay.shelter) { const e = streakTo(lay.shelter.x + ox, SIZE.shelterH * K, lay.shelter.w * 0.9); void e; }
    if (fs.bus) { const b = fs.bus; c.globalAlpha = 0.4 * k; const L2 = b.h * len * 0.32; c.beginPath(); c.moveTo(b.x - b.w / 2, HZ + 3 * K); c.lineTo(b.x + b.w / 2, HZ + 3 * K); c.lineTo(b.x + b.w / 2 + dir * L2, HZ + 4 * K + L2 * 0.07); c.lineTo(b.x - b.w / 2 + dir * L2, HZ + 4 * K + L2 * 0.07); c.closePath(); c.fill(); }
    c.restore(); c.globalAlpha = 1;
    dbg.shadow = +k.toFixed(2); dbg.shadowDir = dir;
  }

  // the lamps' pools + wet streaks, the signal's (capped) streak, fallen leaves
  function ground(c, fs, streak) {
    if (!lay || fs.force.has('no-st-ground')) return;
    const { L, t } = fs, ox = fs.camX;
    const wet = L.rain ? 1.6 : 1, rainK = L.rain ? 1 : 0.6;
    c.save();
    c.globalCompositeOperation = 'lighter';
    lay.lamps.forEach((l, i) => {
      const lv = lampLv[i] * shown; if (lv < 0.01) return;
      const hx = l.x + ox + l.side * SIZE.arm * K, col = lampCol[i], b = 1 + lampBoost[i];
      c.globalAlpha = Math.min(1, lv * 0.5 * b); c.drawImage(glow(col), hx - 19 * K, HZ - 3.5 * K, 38 * K, 8 * K);       // the pool on the sidewalk
      if (streak) streak(hx, 5 * K, (H - HZ) * 0.42 * rainK, hex(col), Math.min(0.5, 0.14 * lv * wet * b), t, i * 1.3);
    });
    // the stop light's colour in the wet street — capped so it ends well above the dock's rings
    const cap = Math.max(10, (fs.dockTop || H) - HZ - 30 * K);
    info.signals.forEach((g, i) => { if (g.state === 'dark') return; const col = SIG[g.state]; if (streak) streak(g.headX, 4 * K, Math.min(cap, (H - HZ) * 0.3), hex(col), 0.2 * wet * shown, t, 2 + i); });
    if (lay.shelter && clamp01(L.w.night + L.w.late) > 0.4 && streak) streak(lay.shelter.x + ox + lay.shelter.side * lay.shelter.w * 0.3, 5 * K, (H - HZ) * 0.22, '#ffb4d6', 0.08 * wet * shown, t, 7);
    c.globalCompositeOperation = 'source-over';
    // fallen leaves: a small pile at each tree's feet through late autumn, scattered leaves (they stick and darken in rain; the
    // first snow covers them; winter clears them)
    // (baked into one strip, re-baked only when they change — a pile is dozens of tiny leaves)
    if (snowCover < 0.5) {
      const night = clamp01(L.w.night + L.w.late) > 0.5;
      const key = `${states.map(s => Math.round((s ? s.ground : 0) * 20)).join(',')}|${grounded.length}|${L.rain ? 1 : 0}|${night ? 1 : 0}|${treeBake.map(b => (b ? b.key : '')).join(';')}`;
      if (key !== leafKey || !leafCv) {
        leafKey = key;
        const s2 = Math.min(dpr, 2), hh = 10 * K;
        if (!leafCv || leafCv.width !== Math.ceil(W * s2)) leafCv = mk(W * s2, hh * s2);
        const x = leafCv.getContext('2d'); x.setTransform(s2, 0, 0, s2, 0, 0); x.clearRect(0, 0, W, hh);
        const dim = (night ? 0.45 : 1) * (L.rain ? 0.6 : 1);
        lay.trees.forEach((tr, i) => {
          const st = states[i]; if (!st || st.ground < 0.05) return;
          const cb = treeBake[i]; const cols = cb ? cb.cols : [LEAF.gold];
          const R = rng(`pile|${i}`), n = Math.round(22 * st.ground);
          for (let k = 0; k < n; k++) {
            const col = cols[Math.floor(R() * cols.length)];
            const px = tr.x + (R() - 0.5) * tr.w * 0.9 * (0.5 + R() * 0.5), py = 0.5 * K + R() * 2.2 * K - (1 - Math.abs(px - tr.x) / tr.w) * 1.2 * K + 2 * K;
            x.fillStyle = rgba(col.map(v => v * dim), 0.95); x.fillRect(px, py, 1.5 * K, 0.9 * K);
          }
        });
        for (const g of grounded) { x.fillStyle = rgba(g.col.map(v => v * (L.rain ? 0.55 : 0.85) * (night ? 0.55 : 1)), 0.9); x.fillRect(g.x, g.y - HZ + 2 * K, 1.6 * K, 0.9 * K); }
      }
      c.globalAlpha = shown; c.drawImage(leafCv, ox, HZ - 2 * K, W, 10 * K); c.globalAlpha = 1;
    }
    c.restore(); c.globalAlpha = 1;
  }

  // leaves / petals falling from the trees (only), fireflies near the trees
  function front(c, fs) {
    if (!lay || fs.force.has('no-st-front')) return;
    const { L, t, dt, motion } = fs, sec = Math.min(0.1, dt / 1000), speed = Math.min(8, fs.speed || 1), ox = fs.camX;
    const dark = clamp01(L.w.night + L.w.late);
    if (motion && tier > 0) {
      const cap = tier === 1 ? 14 : 28, w = info.wind, g = info.gust;
      lay.trees.forEach((tr, i) => {
        const st = states[i]; if (!st || st.shed < 0.02 || falling.length >= cap) return;
        const rate = st.shed * (0.16 + 0.07 * w + 1.4 * g * Math.min(1, w / 6)) * (tier === 1 ? 0.5 : 1) * speed;
        if (Math.random() < rate * sec) {
          const cb = treeBake[i]; const petal = st.blossom > 0.05;
          const col = petal ? mix(BLOSSOM, [255, 240, 246], Math.random() * 0.6) : (cb ? cb.cols[Math.floor(Math.random() * cb.cols.length)] : LEAF.gold);
          falling.push({ x: tr.x + (Math.random() - 0.5) * tr.w * 0.8, y: HZ - SIZE.trunkH * K - SIZE.canopyH * K * (0.3 + Math.random() * 0.6), vx: 0, vy: 8 * K, ph: Math.random() * TAU, col, petal, lamp: tr.lamp, top: HZ - (SIZE.trunkH + SIZE.canopyH + 12) * K });
        }
      });
      c.save();
      falling = falling.filter(f => {
        f.ph += sec * (4 + (f.petal ? 2 : 0));
        const push = info.pushX * w * (1 + 2.2 * g) * 2.1 * K;
        f.vx += (push - f.vx) * Math.min(1, sec * 1.4);
        f.vy = (f.petal ? 6 : 9) * K - g * Math.min(1, w / 8) * 9 * K * Math.max(0, Math.sin(f.ph * 0.5));
        f.x += (f.vx + Math.sin(f.ph) * 5 * K) * sec; f.y += f.vy * sec;
        if (f.y < f.top) f.y = f.top;
        if (f.y >= HZ + (1 + Math.random() * 5) * K) { if (grounded.length < (W > 900 ? 120 : 60)) grounded.push({ x: f.x, y: Math.min(f.y, HZ + 6 * K), col: f.col }); return false; }
        if (f.x < -20 || f.x > W + 20) return false;
        // flaring briefly as it falls through its lamp's light
        let flare = 0; const l = lay.lamps[f.lamp];
        if (l && lampLv[f.lamp] > 0.1) { const hx = l.x + l.side * SIZE.arm * K; flare = lampLv[f.lamp] * clamp01(1 - Math.abs(f.x - hx) / (12 * K)) * clamp01((f.y - (HZ - SIZE.lampH * K)) / (8 * K)); }
        const col = flare > 0.02 ? mix(f.col.map(v => v * (dark ? 0.5 : 1)), [255, 236, 190], flare * 0.7) : f.col.map(v => v * (dark ? 0.45 : 1));
        const sx = Math.cos(f.ph) * (f.petal ? 1.6 : 1.9) * K, sy = (f.petal ? 1.1 : 1.3) * K;
        c.globalAlpha = shown; c.fillStyle = rgba(col, 0.95); c.beginPath(); c.ellipse(f.x + ox, f.y, Math.max(0.3, Math.abs(sx)), sy, Math.sin(f.ph) * 0.6, 0, TAU); c.fill();
        return true;
      });
      // windy days skitter a few fallen leaves across the street (tier 2)
      if (tier === 2 && g > 0.3 && w > 5) for (const gl of grounded) if (Math.random() < 0.15) gl.x += info.pushX * g * 22 * K * sec;
      c.restore();
    } else falling = [];
    if (dbg.groundClearT !== (t | 0)) { dbg.groundClearT = t | 0; const any = states.some(s => s.ground > 0.05); if (!any || snowCover > 0.6) grounded = grounded.filter(() => Math.random() < 0.97); }
    // fireflies: warm summer evenings, only near the trees, low, a few, slow
    const summer = L.season.summer > 0.5 && dark > 0.5 && !L.rain && (L.temp == null || L.temp > 11);
    const want = summer && motion ? lay.trees.length * 3 : 0;
    while (flies.length < want) { const tr = lay.trees[flies.length % lay.trees.length]; flies.push({ tr, x: (Math.random() - 0.5) * tr.w * 1.4, y: -(4 + Math.random() * 22) * K, ph: Math.random() * TAU, sp: 0.4 + Math.random() * 0.5 }); }
    if (flies.length > want) flies.length = want;
    if (flies.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const f of flies) {
        f.ph += sec * f.sp;
        const x = f.tr.x + ox + f.x + Math.sin(f.ph * 1.3) * 6 * K, y = HZ + f.y + Math.cos(f.ph) * 3 * K;
        const a = Math.max(0, Math.sin(f.ph * 2.1)) * 0.8 * shown;
        if (a < 0.02) continue;
        c.globalAlpha = a; c.drawImage(glow([200, 255, 120]), x - 3 * K, y - 3 * K, 6 * K, 6 * K);
      }
      c.restore();
    }
    c.globalAlpha = 1;
  }

  return {
    resize(w, h, hz, d, k) { W = w; H = h; HZ = hz; dpr = d || 1; K = k; layKey = ''; for (const cv of sprites.values()) cv.width = 0; sprites.clear(); },
    setTier(t) { tier = t; },
    back, shadows, ground, front,
    /** what the traffic needs: the stop lights (x, state), the shelter, the lamps (for the bus's reflections) */
    info: () => info,
    /** PARTY NIGHTS: just before the finale's fireworks every lamp flashes in sequence toward the middle */
    midnight: t => { midnightAt = t; },
    debug: () => (lay ? {
      lamps: lay.lamps.map((l, i) => ({ x: Math.round(l.x), side: l.side, tree: l.tree, lit: +lampLv[i].toFixed(2), col: lampCol[i].map(Math.round), boost: +lampBoost[i].toFixed(2) })),
      trees: lay.trees.map((tr, i) => ({ x: Math.round(tr.x), w: Math.round(tr.w), lamp: tr.lamp, cherry: tr.cherry, state: states[i] ? { leaf: +states[i].leaf.toFixed(2), mix: states[i].mix, blossom: +states[i].blossom.toFixed(2), shed: +states[i].shed.toFixed(2), ground: +states[i].ground.toFixed(2), bare: states[i].bare, lights: states[i].lights } : null })),
      shelter: lay.shelter && { x: Math.round(lay.shelter.x), side: lay.shelter.side }, door: { x: Math.round(lay.door.x), w: Math.round(lay.door.w) },
      signals: info.signals.map(g => ({ x: Math.round(g.x), state: g.state })), K, HZ, shown: +shown.toFixed(2),
      layouts: dbg.layouts || 0, layKey: dbg.lastKey, falling: falling.length, grounded: grounded.length, flies: flies.length, gust: +gustK(dbg.t || 0).toFixed(2), wind: info.wind, pushX: info.pushX, chases, snowCover: +snowCover.toFixed(2), shadow: dbg.shadow || 0, shadowDir: dbg.shadowDir || 0,
    } : null),
    destroy() { for (const cv of sprites.values()) cv.width = 0; sprites.clear(); },
  };
}
