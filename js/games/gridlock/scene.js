// GRIDLOCK — the war table, flat: Canvas 2D (the PRISM DROP / SLIPSTREAM toolkit). One board at a time, straight on,
// its coordinates printed inside its own frame so a cell is exactly where the letters and numbers say; every other
// fleet is a mini-board the HUD mounts (miniCanvas). The static parts live in offscreen layers rebuilt only when they
// change; a frame is a handful of drawImage calls plus whatever light is in the air (beams, impacts, shards).
//
// Coordinates are CSS pixels of the canvas (the game root); the canvas is sized to the root and the board fits the
// `stage` rect the view hands over (the CSS-positioned box between the HUD's top and bottom bands).
const TAU = Math.PI * 2;
const TIERS = [
  { dpr: 1, shards: 18, sparks: 6, trail: 8, sweep: false },
  { dpr: 1.5, shards: 32, sparks: 12, trail: 12, sweep: true },
  { dpr: 2, shards: 48, sparks: 18, trail: 16, sweep: true },
];
const COLS = 'ABCDEFGHIJ';
const GOLD = '#ffd27a';
const RED = '#ff3355';
const EMBER = '#ff7a2a';
const FONT = '"JetBrains Mono", "Chakra Petch", ui-monospace, monospace';

// ---------------------------------------------------------------- colour helpers
const rgbCache = new Map();
function rgb(hex) {
  let v = rgbCache.get(hex);
  if (v) return v;
  let h = String(hex || '#ffffff').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  v = Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 255, 255];
  rgbCache.set(hex, v);
  return v;
}
const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const mulberry = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- sprites (device pixels, cached)
const sprites = new Map();
function cached(key, size, draw) {
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = Math.max(2, Math.round(size));
  draw(c.getContext('2d'), c.width);
  sprites.set(key, c);
  if (sprites.size > 400) sprites.delete(sprites.keys().next().value);
  return c;
}
/** A soft round light: white core fading through the colour to nothing. */
const glowSprite = (hex, px) => cached(`glow|${hex}|${px}`, px, (x, s) => {
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.18, rgba(hex, 0.8)); g.addColorStop(0.5, rgba(hex, 0.22)); g.addColorStop(1, rgba(hex, 0));
  x.fillStyle = g; x.fillRect(0, 0, s, s);
});
/** A hit: a scorched disc burnt into whatever is under it, a white-hot core, cracks radiating out, a broken ember ring. */
const scarSprite = (hex, px, seed) => cached(`scar|${hex}|${px}|${seed}`, px, (x, s) => {
  const c = s / 2, R = s / 2, rnd = mulberry(seed * 7919 + 13);
  // the burn: a black disc with a ragged edge, eating into whatever is under it
  // the burn: a black hole with a ragged edge, eating into whatever is under it
  const hole = [];
  for (let i = 0; i < 26; i++) hole.push([(i / 26) * TAU, R * (0.5 + rnd() * 0.22)]);
  const tracePath = scale => { x.beginPath(); hole.forEach(([a, rr], i) => (i ? x.lineTo(c + Math.cos(a) * rr * scale, c + Math.sin(a) * rr * scale) : x.moveTo(c + Math.cos(a) * rr * scale, c + Math.sin(a) * rr * scale))); x.closePath(); };
  tracePath(1.18); x.fillStyle = 'rgba(2,2,10,0.55)'; x.fill();
  tracePath(1); x.fillStyle = 'rgba(0,0,0,0.97)'; x.fill();
  // the molten rim, in the shooter's colour, and a soft glow beyond it
  x.globalCompositeOperation = 'lighter';
  const halo = x.createRadialGradient(c, c, R * 0.45, c, c, R);
  halo.addColorStop(0, rgba(hex, 0.45)); halo.addColorStop(0.45, rgba(hex, 0.12)); halo.addColorStop(1, rgba(hex, 0));
  x.fillStyle = halo; x.fillRect(0, 0, s, s);
  x.lineJoin = 'round'; x.lineCap = 'round';
  tracePath(1); x.strokeStyle = rgba(hex, 0.95); x.lineWidth = Math.max(1.5, s * 0.05); x.stroke();
  tracePath(1); x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = Math.max(0.8, s * 0.018); x.stroke();
  // a few cracks running out from the rim
  const n = 4 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU + (rnd() - 0.5) * 1.0;
    const r0 = R * 0.5, len = R * (0.3 + rnd() * 0.25);
    const pts = [[c + Math.cos(a0) * r0, c + Math.sin(a0) * r0]];
    const segs = 2 + Math.floor(rnd() * 2);
    for (let k = 1; k <= segs; k++) { const r = r0 + (k / segs) * len, a = a0 + (rnd() - 0.5) * 0.5; pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]); }
    x.strokeStyle = rgba(hex, 0.9); x.lineWidth = Math.max(1.2, s * 0.045);
    x.beginPath(); pts.forEach(([px2, py], j) => (j ? x.lineTo(px2, py) : x.moveTo(px2, py))); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = Math.max(0.6, s * 0.016); x.stroke();
  }
  // the hot core still glowing in the hole
  const core = x.createRadialGradient(c, c, 0, c, c, R * 0.4);
  core.addColorStop(0, 'rgba(255,255,255,0.95)'); core.addColorStop(0.3, rgba(hex, 0.85)); core.addColorStop(0.7, rgba(hex, 0.18)); core.addColorStop(1, rgba(hex, 0));
  x.fillStyle = core; x.fillRect(0, 0, s, s);
  x.globalCompositeOperation = 'source-over';
});
/** A miss: a cool ring and a dot of spray, dim. */
const missSprite = px => cached(`miss|${px}`, px, (x, s) => {
  const c = s / 2;
  x.strokeStyle = 'rgba(170,195,255,0.38)'; x.lineWidth = Math.max(1, s * 0.04);
  x.beginPath(); x.arc(c, c, s * 0.22, 0, TAU); x.stroke();
  const g = x.createRadialGradient(c, c, 0, c, c, s * 0.11);
  g.addColorStop(0, 'rgba(220,232,255,0.75)'); g.addColorStop(1, 'rgba(220,232,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
});
const shardSprite = (hex, px) => cached(`shard|${hex}|${px}`, px, (x, s) => {
  x.translate(s / 2, s / 2);
  const r = s * 0.42;
  x.beginPath(); x.moveTo(0, -r); x.lineTo(r * 0.82, r * 0.55); x.lineTo(-r * 0.7, r * 0.42); x.closePath();
  const g = x.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, hex); g.addColorStop(1, rgba(hex, 0.2));
  x.fillStyle = g; x.fill();
  x.lineWidth = Math.max(1, s * 0.04); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.stroke();
});

/** The hull path: a sleek light-form, pointed bow at +x, squared stern at -x. Local coords, centred. */
function hullPath(x, L, w) {
  const nose = Math.min(w * 1.6, L * 0.3);
  x.beginPath();
  x.moveTo(-L / 2 + w * 0.4, -w); x.lineTo(L / 2 - nose, -w); x.quadraticCurveTo(L / 2, -w * 0.5, L / 2, 0);
  x.quadraticCurveTo(L / 2, w * 0.5, L / 2 - nose, w); x.lineTo(-L / 2 + w * 0.4, w);
  x.quadraticCurveTo(-L / 2, w, -L / 2, w * 0.55); x.lineTo(-L / 2, -w * 0.55); x.quadraticCurveTo(-L / 2, -w, -L / 2 + w * 0.4, -w);
  x.closePath();
}

export function createScene(canvas, { size, reduced = false } = {}) {
  const ctx = canvas.getContext('2d');
  const N = size;
  let tier = 2, dpr = 1, W = 1, H = 1;
  let stage = { x: 0, y: 0, w: 1, h: 1 };
  const boards = new Map();
  let order = [];
  let me = null;
  let focusUid = null, fade = 1, fadeFrom = null;
  const clock = { t: 0 };
  let sweepT = -1, sweepNext = 5, onSweep = null;
  let shake = 0, pulse = 0, pulseHex = '#ffffff';
  const fx = [];
  const origins = {};
  // the board's geometry (CSS px): the panel square, the label band, the grid
  const geo = { bx: 0, by: 0, S: 1, M: 1, P: 1, gx: 0, gy: 0, gw: 1, cell: 1, radius: 1, font: 12 };
  // offscreen layers for the focused board
  const base = { canvas: document.createElement('canvas'), uid: null, dirty: true };
  const marks = { canvas: document.createElement('canvas'), uid: null, dirty: true };
  let miniSize = 56;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { base.dirty = true; for (const b of boards.values()) b.miniDirty = true; }).catch(() => {});

  // ---------------------------------------------------------------- boards
  function board(uid) { return boards.get(uid); }
  function makeBoard(uid, hex) {
    const mini = document.createElement('canvas');
    mini.className = 'gl-mini-canvas';
    mini.setAttribute('aria-hidden', 'true');
    return { uid, hex, cells: {}, pending: null, colorOf: () => hex, ships: [], ghost: null, ghostValid: true, sunk: {}, pendingSunk: null, power: 1, bounty: false, hot: null, glitch: 0, mini, miniDirty: true };
  }
  /** The boards in order ([0] = this phone's); colours by uid. */
  function layout(uids, colors, { me: myUid = null } = {}) {
    for (const uid of [...boards.keys()]) if (!uids.includes(uid)) boards.delete(uid);
    order = uids.slice();
    me = myUid || uids[0] || null;
    for (const uid of uids) {
      let b = boards.get(uid);
      if (!b) { b = makeBoard(uid, colors[uid] || '#7fb2ff'); boards.set(uid, b); }
      else if (b.hex !== colors[uid]) { b.hex = colors[uid]; b.miniDirty = true; }
    }
    if (!focusUid || !boards.has(focusUid)) { focusUid = me || uids[0] || null; fade = 1; }
    base.dirty = true; marks.dirty = true;
  }
  const miniCanvas = uid => { const b = board(uid); return b ? b.mini : null; };
  function setMiniSize(px) { if (px !== miniSize) { miniSize = px; for (const b of boards.values()) b.miniDirty = true; } }
  /** Where each player's beams come from (the centre of their mini-board on screen, CSS px). */
  function setOrigins(map) { for (const k of Object.keys(origins)) delete origins[k]; Object.assign(origins, map || {}); }

  /** Public marks for a board; `pending` = Set of "r,c" keys not to show yet (this volley's cinematic). */
  function setMarks(uid, cells, pending = null, colorOf = () => '#ffffff') {
    const b = board(uid); if (!b) return;
    const sig = JSON.stringify(cells || {}) + '|' + (pending ? [...pending].sort().join(';') : '');
    if (b.marksSig === sig) return;
    b.marksSig = sig;
    b.cells = cells || {}; b.pending = pending; b.colorOf = colorOf;
    b.miniDirty = true; if (uid === focusUid) marks.dirty = true;
  }
  /** Sunk ships (public geometry) shown as wrecks; `pending` = slot indexes not to show yet. */
  function setSunk(uid, sunk, pending = null) {
    const b = board(uid); if (!b) return;
    const sig = JSON.stringify(sunk || {}) + '|' + (pending ? [...pending].sort().join(';') : '');
    if (b.sunkSig === sig) return;
    b.sunkSig = sig; b.sunk = sunk || {}; b.pendingSunk = pending; b.miniDirty = true;
  }
  /** The fleet shown on a board (your own). */
  function setShips(uid, ships) { const b = board(uid); if (!b) return; b.ships = (ships || []).map((s, i) => (s ? { ...s, idx: i } : null)).filter(Boolean); b.miniDirty = true; }
  function hideShip(uid, idx) { const b = board(uid); if (!b) return; b.ships = b.ships.filter(s => s.idx !== idx); b.miniDirty = true; }
  function setGhost(uid, ship, valid = true) { const b = board(uid); if (!b) return; b.ghost = ship || null; b.ghostValid = valid; }
  function reticle(uid, r, c) { ret = uid != null && r != null ? { uid, r, c } : null; }
  let ret = null;
  function setPower(uid, p) { const b = board(uid); if (!b || b.power === p) return; b.power = p; b.miniDirty = true; }
  function setBounty(uid) { for (const b of boards.values()) { const on = b.uid === uid; if (b.bounty !== on) { b.bounty = on; b.miniDirty = true; if (b.uid === focusUid) base.dirty = true; } } }
  function focus(uid, { instant = false } = {}) {
    if (!uid || uid === 'overview') uid = me || order[0];
    if (!boards.has(uid)) return;
    if (uid === focusUid) return;
    fadeFrom = focusUid; focusUid = uid; fade = instant || reduced ? 1 : 0;
    base.dirty = true; marks.dirty = true;
  }

  // ---------------------------------------------------------------- geometry
  function layoutBoard() {
    const S = Math.max(40, Math.floor(Math.min(stage.w, stage.h)));
    geo.S = S;
    geo.bx = Math.round(stage.x + (stage.w - S) / 2);
    geo.by = Math.round(stage.y + (stage.h - S) * 0.4);    // spare height: a little more below than above (nearer the thumb)
    geo.P = Math.max(5, Math.round(S * 0.022));
    geo.M = Math.max(16, Math.round(S * 0.062));
    geo.gw = S - geo.M - 2 * geo.P;
    geo.gx = geo.bx + geo.M + geo.P;
    geo.gy = geo.by + geo.M + geo.P;
    geo.cell = geo.gw / N;
    geo.radius = Math.round(S * 0.035);
    geo.font = Math.max(10, Math.min(22, Math.round(geo.cell * 0.4)));
    base.dirty = true; marks.dirty = true;
  }
  const cellX = c => geo.gx + (c + 0.5) * geo.cell;
  const cellY = r => geo.gy + (r + 0.5) * geo.cell;
  /** Screen position (CSS px) of a cell on the board that is up, or null. */
  function cellXY(uid, r, c) { if (uid !== focusUid) return null; return [cellX(c), cellY(r)]; }
  /** What is under a point: { uid, r, c } on the grid, { …, near: true } in the board's frame, else null. */
  function pick(x, y, onlyUid = null) {
    const uid = focusUid;
    if (!uid || (onlyUid && onlyUid !== uid)) return null;
    const c = Math.floor((x - geo.gx) / geo.cell), r = Math.floor((y - geo.gy) / geo.cell);
    if (c >= 0 && r >= 0 && c < N && r < N) return { uid, r, c };
    if (x >= geo.bx - 8 && y >= geo.by - 8 && x <= geo.bx + geo.S + 8 && y <= geo.by + geo.S + 8) return { uid, r: Math.max(0, Math.min(N - 1, r)), c: Math.max(0, Math.min(N - 1, c)), near: true };
    return null;
  }
  function resize(w, h) {
    W = Math.max(1, w); H = Math.max(1, h);
    dpr = Math.min(TIERS[tier].dpr, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutBoard();
    for (const b of boards.values()) b.miniDirty = true;
  }
  function setStage(rect) { stage = { x: rect.x, y: rect.y, w: Math.max(1, rect.w), h: Math.max(1, rect.h) }; layoutBoard(); }
  function setTier(t) { tier = Math.max(0, Math.min(2, t)); resize(W, H); }

  // ---------------------------------------------------------------- the base layer (panel, labels, grid)
  function buildBase(b) {
    const S = geo.S, c = base.canvas;
    c.width = c.height = Math.round(S * dpr);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hex = b.bounty ? GOLD : b.hex;
    const rr = geo.radius;
    // glass panel + rim light
    x.save();
    x.shadowColor = rgba(hex, 0.55); x.shadowBlur = S * 0.05;
    roundRect(x, 0.5, 0.5, S - 1, S - 1, rr);
    x.fillStyle = 'rgba(6,9,26,0.74)'; x.fill();
    x.restore();
    const sheen = x.createLinearGradient(0, 0, S, S);
    sheen.addColorStop(0, 'rgba(255,255,255,0.07)'); sheen.addColorStop(0.45, 'rgba(255,255,255,0.0)'); sheen.addColorStop(1, rgba(hex, 0.06));
    roundRect(x, 0.5, 0.5, S - 1, S - 1, rr); x.fillStyle = sheen; x.fill();
    // the rim light bleeds a little way in, like an edge-lit pane
    x.save(); roundRect(x, 0.5, 0.5, S - 1, S - 1, rr); x.clip();
    x.shadowColor = rgba(hex, 0.7); x.shadowBlur = S * 0.045; x.strokeStyle = rgba(hex, 0.9); x.lineWidth = 3;
    roundRect(x, -2, -2, S + 4, S + 4, rr + 2); x.stroke();
    x.restore();
    roundRect(x, 0.5, 0.5, S - 1, S - 1, rr); x.strokeStyle = rgba(hex, 0.8); x.lineWidth = 1.5; x.stroke();
    roundRect(x, 2, 2, S - 4, S - 4, rr - 1.5); x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1; x.stroke();
    // corner ticks
    x.strokeStyle = rgba(hex, 0.9); x.lineWidth = 2; x.lineCap = 'round';
    const tk = Math.max(8, S * 0.05), ins = 7;
    for (const [sx, sy] of [[ins, ins], [S - ins, ins], [ins, S - ins], [S - ins, S - ins]]) {
      const dx = sx < S / 2 ? 1 : -1, dy = sy < S / 2 ? 1 : -1;
      x.beginPath(); x.moveTo(sx, sy + dy * tk); x.lineTo(sx, sy); x.lineTo(sx + dx * tk, sy); x.stroke();
    }
    // the grid
    const gx = geo.gx - geo.bx, gy = geo.gy - geo.by, gw = geo.gw, cell = geo.cell;
    x.fillStyle = rgba(hex, 0.045); x.fillRect(gx, gy, gw, gw);
    const vig = x.createRadialGradient(gx + gw / 2, gy + gw / 2, gw * 0.1, gx + gw / 2, gy + gw / 2, gw * 0.75);
    vig.addColorStop(0, rgba(hex, 0.07)); vig.addColorStop(1, rgba(hex, 0));
    x.fillStyle = vig; x.fillRect(gx, gy, gw, gw);
    x.strokeStyle = rgba(hex, 0.22); x.lineWidth = 1;
    x.beginPath();
    for (let i = 1; i < N; i++) { const p = Math.round(gx + i * cell) + 0.5; x.moveTo(p, gy); x.lineTo(p, gy + gw); const q = Math.round(gy + i * cell) + 0.5; x.moveTo(gx, q); x.lineTo(gx + gw, q); }
    x.stroke();
    x.strokeStyle = rgba(hex, 0.6); x.lineWidth = 1.25; x.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gw - 1);
    // the labels, centred on their column / row inside the frame
    x.font = `700 ${geo.font}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = rgba(hex, 0.9);
    for (let i = 0; i < N; i++) {
      x.fillText(COLS[i], gx + (i + 0.5) * cell, geo.P + geo.M * 0.52);
      x.fillText(String(i + 1), geo.P + geo.M * 0.5, gy + (i + 0.5) * cell + 0.5);
    }
    base.uid = b.uid; base.dirty = false;
  }
  function roundRect(x, px, py, w, h, r) {
    x.beginPath(); x.moveTo(px + r, py); x.lineTo(px + w - r, py); x.quadraticCurveTo(px + w, py, px + w, py + r); x.lineTo(px + w, py + h - r);
    x.quadraticCurveTo(px + w, py + h, px + w - r, py + h); x.lineTo(px + r, py + h); x.quadraticCurveTo(px, py + h, px, py + h - r); x.lineTo(px, py + r); x.quadraticCurveTo(px, py, px + r, py); x.closePath();
  }
  // ---------------------------------------------------------------- the marks layer (hits burn in, misses ring)
  function buildMarks(b) {
    const c = marks.canvas, gw = geo.gw;
    c.width = c.height = Math.round(gw * dpr);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = geo.cell;
    const scarPx = Math.round(cell * 1.2 * dpr), missPx = Math.round(cell * dpr);
    for (const [key, v] of Object.entries(b.cells)) {
      if (!v || (b.pending && b.pending.has(key))) continue;
      const [r, cc] = key.split(',').map(Number);
      const cx = (cc + 0.5) * cell, cy = (r + 0.5) * cell;
      if (v.h === 1) { const sp = scarSprite(b.colorOf(v.by), scarPx, (r * 31 + cc * 17) % 7); x.drawImage(sp, cx - cell * 0.6, cy - cell * 0.6, cell * 1.2, cell * 1.2); }
      else { const sp = missSprite(missPx); x.drawImage(sp, cx - cell / 2, cy - cell / 2, cell, cell); }
    }
    marks.uid = b.uid; marks.dirty = false;
  }

  // ---------------------------------------------------------------- hulls
  /** Draw a ship (grid coords) on the current context; cell = cell size, (ox, oy) = grid origin. */
  function drawHull(x, s, cell, ox, oy, hex, { alpha = 1, hot = 0, wreck = false, ghost = false } = {}) {
    const L = s.len * cell * 0.9, w = cell * (wreck ? 0.34 : 0.3);
    const cx = ox + (s.d ? s.c + 0.5 : s.c + s.len / 2) * cell, cy = oy + (s.d ? s.r + s.len / 2 : s.r + 0.5) * cell;
    x.save();
    x.translate(cx, cy); if (s.d) x.rotate(Math.PI / 2);
    x.globalAlpha = alpha;
    if (!wreck && !ghost) {
      // the pool of light under the hull
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = alpha * (0.3 + hot * 0.3);
      x.drawImage(glowSprite(hex, 64), -L * 0.75, -w * 3.2, L * 1.5, w * 6.4);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = alpha;
    }
    hullPath(x, L, w);
    if (wreck) { x.fillStyle = 'rgba(14,14,22,0.94)'; x.fill(); x.strokeStyle = 'rgba(170,180,210,0.7)'; x.lineWidth = 1.5; x.stroke(); }
    else {
      const g = x.createLinearGradient(0, -w, 0, w);
      g.addColorStop(0, rgba(hex, ghost ? 0.3 : 0.55)); g.addColorStop(0.5, ghost ? rgba(hex, 0.12) : 'rgba(8,12,34,0.92)'); g.addColorStop(1, rgba(hex, ghost ? 0.3 : 0.4));
      x.fillStyle = g; x.fill();
      x.strokeStyle = ghost ? rgba(hex, 0.9) : rgba(hex, 0.95); x.lineWidth = ghost ? 1.5 : 1.5; if (ghost) x.setLineDash([4, 3]); x.stroke(); x.setLineDash([]);
      if (hot > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,255,255,${0.5 * hot})`; x.fill(); x.globalCompositeOperation = 'source-over'; }
      // the spine, cross traces at every cell, pads
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = `rgba(255,255,255,${ghost ? 0.35 : 0.75})`; x.lineWidth = Math.max(1, cell * 0.05); x.lineCap = 'round';
      x.beginPath(); x.moveTo(-L / 2 + w * 0.6, 0); x.lineTo(L / 2 - w * 1.4, 0); x.stroke();
      x.strokeStyle = rgba(hex, ghost ? 0.4 : 0.8); x.lineWidth = 1;
      for (let i = 1; i < s.len; i++) { const px = -L / 2 + (i / s.len) * L; x.beginPath(); x.moveTo(px, -w * 0.62); x.lineTo(px, w * 0.62); x.stroke(); }
      x.fillStyle = `rgba(255,255,255,${ghost ? 0.3 : 0.85})`;
      for (let i = 0; i < s.len; i++) { const px = -L / 2 + ((i + 0.5) / s.len) * L; x.beginPath(); x.arc(px, 0, Math.max(1, cell * 0.055), 0, TAU); x.fill(); }
      x.globalCompositeOperation = 'source-over';
    }
    if (wreck) {
      // ember cracks across the dead hull
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = rgba(EMBER, 0.75); x.lineWidth = Math.max(1, cell * 0.04); x.lineCap = 'round';
      const rnd = mulberry(s.r * 131 + s.c * 17 + s.len);
      for (let i = 0; i < s.len + 1; i++) { const px = -L / 2 + (0.15 + rnd() * 0.7) * L; x.beginPath(); x.moveTo(px, -w * (0.3 + rnd() * 0.6)); x.lineTo(px + (rnd() - 0.5) * w, w * (0.2 + rnd() * 0.6)); x.stroke(); }
      x.fillStyle = rgba(EMBER, 0.9);
      for (let i = 0; i < s.len; i++) { const px = -L / 2 + ((i + 0.5) / s.len) * L; x.beginPath(); x.arc(px, (rnd() - 0.5) * w, Math.max(1, cell * 0.04), 0, TAU); x.fill(); }
      x.globalCompositeOperation = 'source-over';
    }
    x.restore();
  }
  const geoOf = g => { const [r, c, len, d] = String(g).split(',').map(Number); return { r, c, len, d }; };

  // ---------------------------------------------------------------- the mini-boards
  function drawMini(b) {
    const c = b.mini, px = Math.round(miniSize * dpr);
    if (c.width !== px) { c.width = c.height = px; }
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, miniSize, miniSize);
    const hex = b.bounty ? GOLD : b.hex;
    const S = miniSize, pad = 3, gw = S - pad * 2, cell = gw / N, r0 = Math.max(4, S * 0.1);
    x.globalAlpha = 0.25 + b.power * 0.75;
    roundRect(x, 0.5, 0.5, S - 1, S - 1, r0); x.fillStyle = 'rgba(6,9,26,0.8)'; x.fill();
    x.strokeStyle = rgba(hex, 0.7); x.lineWidth = 1; x.stroke();
    x.fillStyle = rgba(hex, 0.16);
    for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) x.fillRect(pad + cc * cell + cell * 0.36, pad + r * cell + cell * 0.36, cell * 0.28, cell * 0.28);
    // ships (own) + wrecks
    for (const s of b.ships) {
      if (b.sunk[s.idx] != null && !(b.pendingSunk && b.pendingSunk.has(s.idx))) continue;
      x.fillStyle = rgba(hex, 0.75);
      const cells = s.d ? [cell * 0.72, s.len * cell - cell * 0.28] : [s.len * cell - cell * 0.28, cell * 0.72];
      roundRect(x, pad + s.c * cell + cell * 0.14, pad + s.r * cell + cell * 0.14, cells[0], cells[1], cell * 0.3); x.fill();
    }
    for (const [idx, g] of Object.entries(b.sunk)) {
      if (b.pendingSunk && b.pendingSunk.has(Number(idx))) continue;
      const s = geoOf(g);
      const cells = s.d ? [cell * 0.72, s.len * cell - cell * 0.28] : [s.len * cell - cell * 0.28, cell * 0.72];
      roundRect(x, pad + s.c * cell + cell * 0.14, pad + s.r * cell + cell * 0.14, cells[0], cells[1], cell * 0.3);
      x.fillStyle = 'rgba(12,12,18,0.95)'; x.fill(); x.strokeStyle = rgba(EMBER, 0.7); x.lineWidth = 1; x.stroke();
    }
    for (const [key, v] of Object.entries(b.cells)) {
      if (!v || (b.pending && b.pending.has(key))) continue;
      const [r, cc] = key.split(',').map(Number);
      const mx = pad + (cc + 0.5) * cell, my = pad + (r + 0.5) * cell;
      if (v.h === 1) { x.fillStyle = b.colorOf(v.by); x.beginPath(); x.arc(mx, my, cell * 0.34, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(mx, my, cell * 0.14, 0, TAU); x.fill(); }
      else { x.fillStyle = 'rgba(170,195,255,0.45)'; x.beginPath(); x.arc(mx, my, cell * 0.16, 0, TAU); x.fill(); }
    }
    x.globalAlpha = 1;
    b.miniDirty = false;
  }

  // ---------------------------------------------------------------- effects
  const originOf = uid => origins[uid] || (uid === me ? { x: W / 2, y: H + 60 } : { x: W / 2, y: -60 });
  function pulseBoard(hex, k = 0.16) { pulse = Math.max(pulse, k); pulseHex = hex; }
  function miss(uid, r, c) {
    if (uid !== focusUid) return;
    const cx = cellX(c), cy = cellY(r), cell = geo.cell;
    let age = 0;
    fx.push({ draw(dt, x) {
      age += dt; const k = age / 0.7; if (k >= 1) return false;
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) { const kk = Math.max(0, k - i * 0.18); x.strokeStyle = `rgba(170,200,255,${0.6 * (1 - kk)})`; x.lineWidth = 2 - kk; x.beginPath(); x.arc(cx, cy, cell * (0.15 + kk * 1.4), 0, TAU); x.stroke(); }
      x.globalCompositeOperation = 'source-over';
      return true;
    } });
  }
  function hit(uid, r, c, hex) {
    if (uid !== focusUid) return;
    const cx = cellX(c), cy = cellY(r), cell = geo.cell;
    const n = reduced ? 0 : TIERS[tier].sparks;
    const sparks = Array.from({ length: n }, () => { const a = Math.random() * TAU, v = cell * (2 + Math.random() * 5); return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - cell * 2, life: 0.45 + Math.random() * 0.35 }; });
    const flash = glowSprite(hex, 128), spark = glowSprite('#ffffff', 16);
    let age = 0;
    pulseBoard(hex, 0.18);
    if (!reduced) shake = Math.max(shake, 0.4);
    fx.push({ draw(dt, x) {
      age += dt; const k = age / 0.6;
      x.globalCompositeOperation = 'lighter';
      if (k < 1) {
        const fs = cell * (2.2 + k * 3); x.globalAlpha = Math.max(0, 1 - k * 1.5); x.drawImage(flash, cx - fs / 2, cy - fs / 2, fs, fs);
        x.globalAlpha = Math.max(0, 0.9 - k); x.strokeStyle = hex; x.lineWidth = Math.max(1, 3 * (1 - k)); x.beginPath(); x.arc(cx, cy, cell * (0.3 + k * 3.2), 0, TAU); x.stroke();
        x.strokeStyle = '#ffffff'; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, cell * (0.2 + k * 2.4), 0, TAU); x.stroke();
      }
      let alive = k < 1;
      for (const p of sparks) {
        if (age > p.life) continue;
        alive = true;
        p.vy += cell * 18 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        x.globalAlpha = Math.max(0, 1 - age / p.life); const ps = cell * 0.28; x.drawImage(spark, p.x - ps / 2, p.y - ps / 2, ps, ps);
      }
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      return alive;
    } });
  }
  /** A beam from a player's mini-board to a cell on the board that is up. Calls onImpact when it lands. */
  function fire({ from, to, r, c, hex, duration = 0.75 }, onImpact) {
    if (to !== focusUid) { onImpact && onImpact(); return; }
    const p0 = originOf(from), p2 = { x: cellX(c), y: cellY(r) };
    const dist = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    const nx = -(p2.y - p0.y) / (dist || 1), ny = (p2.x - p0.x) / (dist || 1);
    const side = p0.x < p2.x ? 1 : -1;
    const p1 = { x: (p0.x + p2.x) / 2 + nx * dist * 0.22 * side, y: (p0.y + p2.y) / 2 + ny * dist * 0.22 * side };
    const at = k => { const u = 1 - k; return [u * u * p0.x + 2 * u * k * p1.x + k * k * p2.x, u * u * p0.y + 2 * u * k * p1.y + k * k * p2.y]; };
    const head = glowSprite(hex, 64), nTrail = TIERS[tier].trail, cell = geo.cell;
    const hist = [];
    let age = 0, done = false;
    fx.push({ draw(dt, x) {
      age += dt;
      const k = Math.min(1, age / duration), e = ease(k);
      const p = at(e);
      hist.push(p); while (hist.length > nTrail) hist.shift();
      const a = done ? Math.max(0, 1 - (age - duration) / 0.25) : 1;
      x.globalCompositeOperation = 'lighter';
      for (let i = 1; i < hist.length; i++) {
        const f = i / hist.length;
        x.strokeStyle = rgba(hex, 0.85 * f * a); x.lineWidth = 1 + f * cell * 0.22; x.lineCap = 'round';
        x.beginPath(); x.moveTo(hist[i - 1][0], hist[i - 1][1]); x.lineTo(hist[i][0], hist[i][1]); x.stroke();
      }
      if (hist.length > 1) { x.strokeStyle = `rgba(255,255,255,${0.7 * a})`; x.lineWidth = 1; x.beginPath(); x.moveTo(hist[Math.max(0, hist.length - 4)][0], hist[Math.max(0, hist.length - 4)][1]); x.lineTo(p[0], p[1]); x.stroke(); }
      const hs = cell * 1.5; x.globalAlpha = a; x.drawImage(head, p[0] - hs / 2, p[1] - hs / 2, hs, hs); x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';
      if (k >= 1 && !done) { done = true; onImpact && onImpact(); }
      return age < duration + 0.25;
    } });
  }
  /** A ship burns white, then shatters into shards that fly out and fade; the wreck stays. */
  function sink(uid, ship, idx) {
    const b = board(uid); if (!b) return;
    if (uid !== focusUid) { hideShip(uid, idx); if (b.pendingSunk) b.pendingSunk.delete(idx); b.miniDirty = true; return; }
    b.hot = { ship, idx, t: 0 };
    const cell = geo.cell;
    const cx = cellX(ship.d ? ship.c : ship.c + (ship.len - 1) / 2), cy = cellY(ship.d ? ship.r + (ship.len - 1) / 2 : ship.r);
    const n = reduced ? 10 : Math.min(TIERS[tier].shards, ship.len * 9 + 6);
    const sp = shardSprite(b.hex, 32), flash = glowSprite(b.hex, 128);
    const parts = Array.from({ length: n }, () => {
      const along = (Math.random() - 0.5) * ship.len * cell * 0.9, across = (Math.random() - 0.5) * cell * 0.5;
      const px = ship.d ? cx + across : cx + along, py = ship.d ? cy + along : cy + across;
      const a = Math.atan2(py - cy, px - cx) + (Math.random() - 0.5) * 1.2, v = cell * (2.5 + Math.random() * 6);
      return { x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - cell * 3, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 12, s: cell * (0.22 + Math.random() * 0.3) };
    });
    let age = 0, burst = false;
    fx.push({ draw(dt, x) {
      age += dt;
      if (age < 0.5) { b.hot.t = age; return true; }
      if (!burst) { burst = true; b.hot = null; hideShip(uid, idx); if (b.pendingSunk) b.pendingSunk.delete(idx); b.miniDirty = true; pulseBoard(b.hex, 0.3); if (!reduced) shake = Math.max(shake, 0.8); }
      const t2 = age - 0.5, k = t2 / 1.6;
      x.globalCompositeOperation = 'lighter';
      if (t2 < 0.5) { const fs = cell * (3 + t2 * 8); x.globalAlpha = 1 - t2 * 2; x.drawImage(flash, cx - fs / 2, cy - fs / 2, fs, fs); x.globalAlpha = 1; }
      for (const p of parts) {
        p.vy += cell * 16 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.globalAlpha = Math.max(0, 1 - k); const s = p.s * (1 - k * 0.5); x.drawImage(sp, -s / 2, -s / 2, s, s); x.restore();
      }
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      return k < 1;
    } });
  }
  /** The board flickers, tears and powers down to dark. */
  function eliminate(uid) {
    const b = board(uid); if (!b) return;
    for (const s of b.ships.slice()) hideShip(uid, s.idx);
    let age = 0;
    fx.push({ draw(dt) {
      age += dt; const k = age / 1.4;
      if (k >= 1) { b.glitch = 0; setPower(uid, 0.08); return false; }
      b.glitch = reduced ? 0 : 1 - k;
      b.power = Math.max(0.08, (1 - k) * (Math.random() < 0.5 ? 1 : 0.3) + 0.08); b.miniDirty = true;
      return true;
    } });
  }

  // ---------------------------------------------------------------- the frame
  let last = 0;
  const frameTimes = [];
  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now; clock.t += dt;
    const t = clock.t;
    ctx.clearRect(0, 0, W, H);
    const b = focusUid && boards.get(focusUid);
    if (b) {
      if (fade < 1) fade = Math.min(1, fade + dt / 0.28);
      if (base.dirty || base.uid !== b.uid) buildBase(b);
      if (marks.dirty || marks.uid !== b.uid) buildMarks(b);
      shake = Math.max(0, shake - dt * 2.4);
      const sh = shake * shake * 9;
      const ox = sh ? (Math.random() - 0.5) * sh : 0, oy = sh ? (Math.random() - 0.5) * sh : 0;
      const f = ease(fade);
      ctx.save();
      ctx.globalAlpha = f;
      ctx.translate(ox, oy + (1 - f) * 14);
      const { bx, by, S, gx, gy, gw, cell } = geo;
      // the panel (torn into slices while a board dies)
      if (b.glitch > 0) {
        const slices = 7, hgt = S / slices;
        for (let i = 0; i < slices; i++) { const off = (Math.random() - 0.5) * 18 * b.glitch; if (Math.random() < 0.12 * b.glitch) continue; ctx.drawImage(base.canvas, 0, i * hgt * dpr, S * dpr, hgt * dpr, bx + off, by + i * hgt, S, hgt); }
      } else ctx.drawImage(base.canvas, bx, by, S, S);
      // hulls (your own), wrecks, the ghost while placing
      for (const s of b.ships) {
        if (b.sunk[s.idx] != null && !(b.pendingSunk && b.pendingSunk.has(s.idx))) continue;
        const hot = b.hot && b.hot.idx === s.idx ? 0.5 + 0.5 * Math.sin(b.hot.t * 40) : 0;
        drawHull(ctx, s, cell, gx, gy, b.hex, { hot });
      }
      for (const [idx, g] of Object.entries(b.sunk)) { if (b.pendingSunk && b.pendingSunk.has(Number(idx))) continue; drawHull(ctx, geoOf(g), cell, gx, gy, b.hex, { wreck: true }); }
      if (b.ghost) drawHull(ctx, b.ghost, cell, gx, gy, b.ghostValid ? b.hex : RED, { ghost: true, alpha: 0.9 });
      // marks
      ctx.drawImage(marks.canvas, gx, gy, gw, gw);
      // the sweep: a band of light crossing the grid now and then
      if (TIERS[tier].sweep && !reduced) {
        if (sweepT < 0 && t > sweepNext) { sweepT = 0; sweepNext = t + 9 + Math.random() * 4; if (onSweep) onSweep(); }
        if (sweepT >= 0) {
          sweepT += dt / 1.7;
          if (sweepT > 1) sweepT = -1;
          else {
            ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gw); ctx.clip();
            ctx.translate(gx + gw / 2, gy + gw / 2); ctx.rotate(-Math.PI / 4);
            const p = -gw + sweepT * gw * 2, bw = gw * 0.22;
            const g = ctx.createLinearGradient(0, p - bw, 0, p + bw);
            g.addColorStop(0, rgba(b.hex, 0)); g.addColorStop(0.5, rgba(b.hex, 0.16)); g.addColorStop(1, rgba(b.hex, 0));
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(-gw, p - bw, gw * 2, bw * 2);
            ctx.restore();
          }
        }
      }
      // a dead board goes dark
      if (b.power < 1) { ctx.fillStyle = `rgba(3,4,12,${(1 - b.power) * 0.82})`; roundRect(ctx, bx, by, S, S, geo.radius); ctx.fill(); }
      // an impact lights the whole panel for a moment
      if (pulse > 0) { pulse = Math.max(0, pulse - dt * 0.6); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(pulseHex, pulse * 0.6); roundRect(ctx, bx, by, S, S, geo.radius); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      // the reticle: brackets on the cell, its row and column lit, the labels called out
      if (ret && ret.uid === b.uid) drawReticle(ctx, t);
      ctx.restore();
    }
    // light in the air (screen space)
    for (let i = fx.length - 1; i >= 0; i--) { let keep = true; try { keep = fx[i].draw(dt, ctx); } catch { keep = false; } if (!keep) fx.splice(i, 1); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (const bb of boards.values()) if (bb.miniDirty && bb.mini.isConnected) drawMini(bb);
    frameTimes.push(dt * 1000); if (frameTimes.length > 120) frameTimes.shift();
  }
  function drawReticle(x, t) {
    const { gx, gy, gw, cell, bx, by, P, M } = geo;
    const cx = cellX(ret.c), cy = cellY(ret.r);
    const breathe = reduced ? 0 : Math.sin(t * 4) * 0.04;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(gx, cy - cell / 2, gw, cell); x.fillRect(cx - cell / 2, gy, cell, gw);
    x.globalCompositeOperation = 'source-over';
    // the labels of this cell, lit
    x.font = `700 ${geo.font}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const ly = by + P + M * 0.52, lx = bx + P + M * 0.5;
    x.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(x, cx - cell * 0.42, ly - M * 0.36, cell * 0.84, M * 0.72, 4); x.fill();
    roundRect(x, lx - M * 0.4, cy - cell * 0.42, M * 0.8, cell * 0.84, 4); x.fill();
    x.fillStyle = '#ffffff'; x.fillText(COLS[ret.c], cx, ly); x.fillText(String(ret.r + 1), lx, cy + 0.5);
    // brackets + crosshair
    const half = cell * (0.46 + breathe), arm = cell * 0.22;
    x.globalCompositeOperation = 'lighter';
    const gs = cell * 2.6; x.globalAlpha = 0.55; x.drawImage(glowSprite('#ffffff', 64), cx - gs / 2, cy - gs / 2, gs, gs); x.globalAlpha = 1;
    x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.lineCap = 'round';
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { x.beginPath(); x.moveTo(cx + sx * half, cy + sy * (half - arm)); x.lineTo(cx + sx * half, cy + sy * half); x.lineTo(cx + sx * (half - arm), cy + sy * half); x.stroke(); }
    x.lineWidth = 1; x.strokeStyle = 'rgba(255,255,255,0.7)';
    x.beginPath(); x.moveTo(cx - cell * 0.3, cy); x.lineTo(cx + cell * 0.3, cy); x.moveTo(cx, cy - cell * 0.3); x.lineTo(cx, cy + cell * 0.3); x.stroke();
    x.restore();
  }

  return {
    layout, miniCanvas, setMiniSize, setOrigins, setStage, resize, setTier,
    setMarks, setSunk, setShips, hideShip, setGhost, reticle, setPower, setBounty,
    miss, hit, fire, sink, eliminate, focus, pick, cellXY, frame,
    get tier() { return tier; },
    get focusUid() { return focusUid; },
    get fps() { return frameTimes.slice(); },
    get geometry() { return { ...geo }; },
    onSweep(fn) { onSweep = fn; },
    camera: () => ({ focus: focusUid, box: [geo.bx, geo.by, geo.S], settled: fade >= 1 }),
    stats: () => ({ boards: boards.size, fx: fx.length, dpr, sprites: sprites.size }),
    destroy() { fx.length = 0; for (const b of boards.values()) b.mini.remove(); boards.clear(); },
  };
}
