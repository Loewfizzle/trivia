// JAYWALK — THE LANDMARKS IN THE SKYLINE (H5B — docs/jaywalk.md "THE LANDMARKS IN THE SKYLINE"; the owner, Nov 16: THE LANDMARKS MUST BE
// SEEN — at ZOOM 8 the edge-column hero pieces are usually off the screen). While the kid is in an area, ITS landmark stands in the
// skyline band, big enough to read on a phone: THE DOCKS' cranes · THE FISH MARKET's fish sign · THE RAIL YARD's signal gantry + its
// water tower · THE BRIDGE's towers + cables · DOWNTOWN's towers · THE CANAL's arches + its gabled houses · THE LIGHTHOUSE (its lamp
// glowing, ITS BEAM SWEEPING — a DOM cone: transform only) · THE AIRFIELD's control tower + a hangar.
// A VIEW: one small 2D canvas (through ui/canvas-safe.js), drawn ONCE when the area or the look changes — never per frame. BY NIGHT a
// dark silhouette edged in the area's own neon, its lamps lit; BY DAY the same shapes sunlit in their own colours. The tall pieces
// stand at the band's two sides (the lane count has the middle); the low ones (a deck, a train, a row of arches) run under it.
import { ctx2d } from '../../ui/canvas-safe.js';

/** the drawing's own space (the canvas is 2× this) — its foot (y = H) is the band's horizon */
export const MARK_W = 390, MARK_H = 106;
export const MARK_IDS = Object.freeze(['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield']);
const W = MARK_W, H = MARK_H, TAU = Math.PI * 2;
const css = hex => `#${hex.toString(16).padStart(6, '0')}`;

/** the pens: every shape = its own sunlit colour by day · the silhouette + a line of the area's neon by night */
function pens(c, day, A) {
  const body = '#1c2456', deep = '#12183e';
  const fill = (path, dayCol, o = {}) => {
    c.beginPath(); path();
    c.fillStyle = day ? dayCol : o.deep ? deep : body; c.fill();
    if (o.bare) return;
    c.lineWidth = day ? 1 : 1.4; c.strokeStyle = day ? 'rgba(16, 36, 70, 0.55)' : A; c.stroke();
  };
  const R = (x, y, w, h) => () => c.rect(x, y, w, h);
  const P = (...p) => () => { c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); };
  const stroke = (p, w, dayCol, nightCol = A) => { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.lineWidth = w; c.strokeStyle = day ? dayCol : nightCol; c.stroke(); };
  /** a light: it GLOWS by night, a small painted lens by day */
  const lamp = (x, y, r, col, dayCol = col) => {
    c.save(); c.beginPath(); c.arc(x, y, day ? r * 0.8 : r, 0, TAU);
    if (day) { c.fillStyle = dayCol; c.fill(); } else { c.shadowColor = col; c.shadowBlur = r * 4.5; c.fillStyle = col; c.fill(); c.fill(); }
    c.restore();
  };
  /** a window: lit by night, blue glass by day */
  const win = (x, y, w, h, col = '#ffe2a0') => { c.fillStyle = day ? 'rgba(38, 78, 130, 0.78)' : col; c.fillRect(x, y, w, h); };
  return { c, day, A, fill, R, P, stroke, lamp, win };
}

/** a harbour crane: an A-frame portal, its machine house, the boom reaching OUT (f = 1 to the left · −1 to the right), a box on its cable */
function crane(t, x, s, f) {
  const { fill, P, stroke, lamp, win } = t, Y = v => H - v * s, X = v => x + v * s * f, Q = (...p) => P(...p.map((v, i) => (i % 2 ? Y(v) : X(v))));
  fill(Q(-17, 0, -12, 0, -5, 54, -9, 54), '#e79a14'); fill(Q(17, 0, 12, 0, 5, 54, 9, 54), '#f2b233');
  fill(Q(-13, 28, 13, 28, 13, 32, -13, 32), '#d98a10');
  fill(Q(-2.5, 54, 2.5, 54, 2.5, 97, -2.5, 97), '#d98a10');
  fill(Q(-12, 54, 12, 54, 12, 70, -12, 70), '#eef1f6');
  fill(Q(9, 60, 27, 60, 27, 68, 9, 70), '#c9820f');
  fill(Q(-9, 66, -5, 70, -55, 93, -57, 89), '#f2b233');
  stroke([X(0), Y(97), X(-55), Y(92)], 1.1, '#7a5a12'); stroke([X(0), Y(97), X(24), Y(69)], 1.1, '#7a5a12');
  stroke([X(-51), Y(90), X(-51), Y(54)], 1, '#3a3a44', 'rgba(255, 255, 255, 0.5)');
  fill(Q(-58, 46, -44, 46, -44, 54, -58, 54), '#3f8fd8');
  win(Math.min(X(-9), X(-2)), Y(66), 7 * s, 6 * s);
  lamp(X(0), Y(99), 2.2, '#ff4034', '#e03a30');
}
/** a fish — the market's sign: neon tubes by night, a painted board by day */
function fish(t, cx, cy, w, h) {
  const { c, day, A } = t;
  const path = () => { c.beginPath(); c.moveTo(cx - w * 0.5, cy); c.bezierCurveTo(cx - w * 0.28, cy - h * 0.62, cx + w * 0.1, cy - h * 0.6, cx + w * 0.26, cy); c.bezierCurveTo(cx + w * 0.1, cy + h * 0.6, cx - w * 0.28, cy + h * 0.62, cx - w * 0.5, cy); c.moveTo(cx + w * 0.26, cy); c.lineTo(cx + w * 0.5, cy - h * 0.42); c.lineTo(cx + w * 0.5, cy + h * 0.42); c.closePath(); };
  c.save(); c.lineJoin = 'round';
  if (day) { path(); c.fillStyle = '#ff7a3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff6e8'; c.stroke(); c.lineWidth = 1; c.strokeStyle = 'rgba(16, 36, 70, 0.6)'; c.stroke(); }
  else { for (const [lw, col, blur] of [[5, A, 12], [2.4, '#ffd0b8', 0]]) { path(); c.lineWidth = lw; c.strokeStyle = col; c.shadowColor = A; c.shadowBlur = blur; c.stroke(); } }
  c.shadowBlur = 0; c.beginPath(); c.arc(cx - w * 0.3, cy - h * 0.1, h * 0.09, 0, TAU); c.fillStyle = day ? '#ffffff' : '#bff4ff'; c.fill();
  c.restore();
}

const MARKS = [
  // THE DOCKS — two cranes, their booms reaching out over the harbour; freight boxes stacked on the quay between them
  t => {
    const { fill, R } = t, box = ['#d8472f', '#2f7fd8', '#3ea86a', '#e8a02a'];
    for (let k = 0; k < 9; k++) fill(R(126 + k * 16, H - 9, 15, 9), box[k % 4]);
    for (let k = 0; k < 5; k++) fill(R(142 + k * 32, H - 18, 15, 9), box[(k + 2) % 4]);
    crane(t, 68, 0.8, 1); crane(t, 318, 1, -1);
  },
  // THE FISH MARKET — the market hall under its striped awning, THE FISH high on its pole; a stall + its ice boxes on the other side
  t => {
    const { fill, R, P, lamp, day } = t;
    fill(R(268, H - 30, 116, 30), '#f1e6d2');
    for (let k = 0; k < 9; k++) fill(P(262 + k * 14, H - 30, 276 + k * 14, H - 30, 274 + k * 13, H - 46, 261 + k * 13, H - 46), k % 2 ? '#fbf6ea' : '#e8473a', { deep: k % 2 === 1 });
    for (const x of [284, 312, 340, 368]) t.win(x, H - 22, 9, 12);
    fill(R(330, H - 64, 3, 18), '#5a4632');
    fish(t, 332, H - 82, 84, 36);
    fill(R(22, H - 20, 62, 20), '#8a5a33');
    for (let k = 0; k < 6; k++) fill(P(16 + k * 12, H - 28, 28 + k * 12, H - 28, 27 + k * 11.4, H - 42, 17 + k * 11.4, H - 42), k % 2 ? '#fbf6ea' : '#2f9bd8', { deep: k % 2 === 1 });
    for (const x of [96, 112]) fill(R(x, H - 10, 13, 10), '#e9eef6');
    if (!day) for (const x of [276, 300, 324, 348, 372]) lamp(x, H - 27, 1.5, '#ffe2a0');
  },
  // THE RAIL YARD — a signal gantry over the tracks (one signal at red), the yard's water tower, a freight train along the foot
  t => {
    const { fill, R, P, stroke, lamp } = t, car = ['#b5522f', '#3d6ea8', '#5c8a4a', '#c79a2e'];
    for (let k = 0; k < 6; k++) { fill(R(108 + k * 27, H - 17, 25, 13), car[k % 4]); fill(R(111 + k * 27, H - 4, 5, 4), '#22262e', { bare: true }); fill(R(125 + k * 27, H - 4, 5, 4), '#22262e', { bare: true }); }
    fill(R(279, H - 80, 4, 80), '#4a4f5c'); fill(R(377, H - 80, 4, 80), '#4a4f5c'); fill(R(274, H - 86, 112, 7), '#5a6070');
    for (let x = 283; x < 377; x += 12) stroke([x, H - 79, x + 6, H - 70, x + 12, H - 79], 1, '#4a4f5c');
    stroke([283, H - 70, 377, H - 70], 1.2, '#4a4f5c');
    [[300, 0], [330, 1], [360, 1]].forEach(([x, go]) => { fill(R(x - 5, H - 69, 10, 22), '#22262e'); lamp(x, H - 63, 2.6, go ? '#3a2a2a' : '#ff3030', go ? '#5a2a2a' : '#ff3030'); lamp(x, H - 54, 2.6, go ? '#40ff80' : '#1f3a2a', go ? '#2fd070' : '#2a4a38'); });
    fill(P(42, H - 86, 88, H - 86, 84, H - 52, 46, H - 52), '#b5522f'); fill(P(37, H - 86, 65, H - 100, 93, H - 86), '#8a3a22');
    stroke([49, H - 52, 43, H], 2, '#5a4632'); stroke([81, H - 52, 87, H], 2, '#5a4632'); stroke([45, H - 26, 85, H - 26], 1.2, '#5a4632'); stroke([47, H - 44, 85, H - 12], 1, '#5a4632'); stroke([83, H - 44, 45, H - 12], 1, '#5a4632');
  },
  // THE BRIDGE — its two towers, the main cable sweeping between them (a string of lights by night), the hangers, the deck
  t => {
    const { c, day, fill, R, lamp } = t, yc = x => { const u = (x - 60) / 270; return (H - 100) + 4 * 68 * u * (1 - u); };
    fill(R(0, H - 28, 390, 6), '#b93a26');
    c.beginPath(); c.moveTo(60, H - 100); c.quadraticCurveTo(195, H + 36, 330, H - 100); c.moveTo(60, H - 100); c.quadraticCurveTo(26, H - 52, 0, H - 40); c.moveTo(330, H - 100); c.quadraticCurveTo(364, H - 52, 390, H - 40);
    c.lineWidth = 1.6; c.strokeStyle = day ? '#c9402c' : t.A; c.stroke();
    c.beginPath(); for (let x = 78; x < 318; x += 16) { c.moveTo(x, yc(x)); c.lineTo(x, H - 28); } c.lineWidth = 0.8; c.strokeStyle = day ? 'rgba(160, 50, 36, 0.8)' : 'rgba(255, 120, 130, 0.55)'; c.stroke();
    for (const x of [60, 330]) { fill(R(x - 10, H - 102, 6, 102), '#d8452f'); fill(R(x + 4, H - 102, 6, 102), '#e25a40'); for (const y of [98, 66, 40]) fill(R(x - 10, H - y, 20, 4), '#b93a26'); lamp(x, H - 104, 2.2, '#ff4034', '#e03a30'); }
    if (!day) for (let x = 78; x < 318; x += 16) lamp(x, yc(x), 1.3, '#ffe9b0');
  },
  // DOWNTOWN — its towers, taller than the skyline behind them: lit windows by night, glass by day; a red light on the tallest
  t => {
    const { c, day, fill, R, stroke, lamp, win } = t;
    for (const [x, w, h, col] of [[8, 24, 60, '#d5dceb'], [66, 24, 74, '#c2cde0'], [92, 22, 46, '#cfd8e6'], [34, 30, 94, '#dfe6f0'], [282, 26, 80, '#c9d3e2'], [342, 24, 68, '#b9c6da'], [366, 20, 52, '#d5dceb'], [310, 30, 100, '#e3e9f2']]) {
      fill(R(x, H - h, w, h), col);
      if (day) { c.fillStyle = 'rgba(30, 55, 100, 0.16)'; c.fillRect(x + w * 0.66, H - h, w * 0.34, h); }
      const cols = Math.floor((w - 5) / 6), rows = Math.floor((h - 8) / 7);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const k = (x * 7 + i * 13 + j * 29) % 7; if (day || k < 4) win(x + 4 + i * 6, H - h + 6 + j * 7, 3, 4, k === 3 ? '#7fe6ff' : '#ffe2a0'); }
    }
    stroke([325, H - 100, 325, H - 106], 1.4, '#7a8498'); lamp(325, H - 104, 1.8, '#ff4034', '#e03a30');
    stroke([49, H - 94, 49, H - 102], 1.4, '#7a8498'); lamp(49, H - 101, 1.6, '#ff4034', '#e03a30');
  },
  // THE CANAL — a stone bridge on three arches (the water under it), the gabled canal houses on the other bank
  t => {
    const { c, day, fill, R, P, lamp, win } = t;
    c.fillStyle = day ? '#3f8fe0' : '#0b1238'; c.fillRect(236, H - 26, 152, 26);
    fill(() => {
      c.moveTo(388, H); c.lineTo(388, H - 46); c.lineTo(236, H - 46); c.lineTo(236, H); c.lineTo(244, H); c.lineTo(244, H - 8); c.arc(262, H - 8, 18, Math.PI, 0, false);
      c.lineTo(280, H); c.lineTo(294, H); c.lineTo(294, H - 8); c.arc(312, H - 8, 18, Math.PI, 0, false); c.lineTo(330, H); c.lineTo(344, H); c.lineTo(344, H - 8); c.arc(362, H - 8, 18, Math.PI, 0, false); c.lineTo(380, H); c.closePath();
    }, '#b9b3a2');
    fill(R(232, H - 52, 158, 6), '#d0cab8');
    for (const x of [240, 287, 337, 384]) { fill(R(x - 1, H - 64, 2, 12), '#5a5648', { bare: true }); lamp(x, H - 66, 2, '#ffd9a0', '#f4e9c8'); }
    [[10, 22, 60, '#d87a9a'], [34, 24, 78, '#6fa8e0'], [60, 22, 64, '#e0b46a'], [84, 24, 72, '#8fd0a8'], [110, 20, 54, '#e08a6a']].forEach(([x, w, h, col]) => {
      fill(P(x, H, x, H - h, x + w * 0.22, H - h, x + w * 0.22, H - h - 6, x + w * 0.4, H - h - 6, x + w * 0.4, H - h - 12, x + w * 0.6, H - h - 12, x + w * 0.6, H - h - 6, x + w * 0.78, H - h - 6, x + w * 0.78, H - h, x + w, H - h, x + w, H), col);
      for (let j = 0; j < Math.floor((h - 18) / 13); j++) for (const dx of [0.2, 0.58]) win(x + w * dx, H - h + 6 + j * 13, w * 0.22, 7);
      fill(R(x + w * 0.36, H - 11, w * 0.28, 11), '#5a3a26', { bare: true });
    });
  },
  // THE LIGHTHOUSE — on its rocks, its lamp glowing (its BEAM is the band's own sweeping cone — skymarks' DOM); a sail out on the water
  t => {
    const { c, day, fill, R, P, lamp, stroke } = t, xl = v => 317 + 5 * (v - 16) / 62, xr = v => 347 - 5 * (v - 16) / 62;
    fill(P(280, H, 292, H - 13, 314, H - 20, 350, H - 17, 372, H - 9, 386, H), '#7c8494');
    fill(P(xl(16), H - 16, xr(16), H - 16, xr(78), H - 78, xl(78), H - 78), '#f6f3ec');
    for (const [a, b] of [[28, 42], [54, 68]]) fill(P(xl(a), H - a, xr(a), H - a, xr(b), H - b, xl(b), H - b), '#d8402f', { deep: true });
    fill(R(326, H - 30, 6, 14), '#3a4660', { bare: true });
    fill(R(318, H - 82, 28, 4), '#3a4660'); fill(R(324, H - 93, 16, 11), day ? '#fff6cf' : '#fff2b0'); fill(P(321, H - 93, 332, H - 103, 343, H - 93), '#d8402f');
    stroke([328, H - 93, 328, H - 82], 0.8, '#3a4660', 'rgba(20, 20, 50, 0.7)'); stroke([336, H - 93, 336, H - 82], 0.8, '#3a4660', 'rgba(20, 20, 50, 0.7)');
    lamp(332, H - 87.5, day ? 3 : 6, '#fff2b0', '#ffe27a');
    fill(P(44, H - 7, 92, H - 7, 85, H, 50, H), '#e8ecf2'); stroke([66, H - 50, 66, H - 7], 1.4, '#6a5a44'); fill(P(68, H - 48, 68, H - 11, 90, H - 11), '#ffffff'); fill(P(64, H - 40, 64, H - 11, 48, H - 11), '#f4e9c8');
    if (!day) { c.fillStyle = 'rgba(255, 242, 176, 0.10)'; c.beginPath(); c.arc(332, H - 87.5, 26, 0, TAU); c.fill(); }
  },
  // THE AIRFIELD — the control tower (its cab lit), a hangar's arch + the windsock; the runway's blue lights along the foot by night
  t => {
    const { c, day, fill, R, P, lamp, stroke } = t;
    fill(P(322, H, 341, H, 338, H - 68, 325, H - 68), '#d6dcea');
    fill(P(315, H - 68, 348, H - 68, 354, H - 87, 309, H - 87), '#2b4a70', { deep: true });
    fill(R(306, H - 91, 51, 4), '#e4e8f2'); fill(R(320, H - 71, 23, 3), '#bfc6d8');
    stroke([331, H - 91, 331, H - 104], 1.3, '#8a94a8'); lamp(331, H - 103, 1.9, '#ff4034', '#e03a30');
    if (!day) for (let x = 316; x <= 348; x += 6.4) lamp(x, H - 78, 1.5, '#9fffd0');
    else for (let x = 314; x <= 344; x += 7.5) { c.fillStyle = 'rgba(190, 225, 255, 0.85)'; c.fillRect(x, H - 83, 5, 10); }
    fill(() => { c.moveTo(12, H); c.ellipse(64, H, 52, 36, 0, Math.PI, 0, false); c.closePath(); }, '#9aa4bc');
    fill(R(38, H - 19, 52, 19), '#1a2233', { deep: true }); fill(R(32, H - 25, 64, 3), '#ffc83a', { bare: true });
    stroke([122, H, 122, H - 42], 1.4, '#8a94a8'); fill(P(122, H - 42, 146, H - 38, 146, H - 33, 122, H - 31), '#ff7a2a'); fill(P(130, H - 40.7, 138, H - 39.4, 138, H - 32.3, 130, H - 31.7), '#ffffff', { bare: true });
    if (!day) for (let x = 160; x <= 300; x += 14) lamp(x, H - 3, 1.3, '#4d9dff');
  },
];

/** draw area `index` (0 … 7) for `look` ('day' | 'night') into a 2D context scaled to MARK_W × MARK_H; `accent` = the area's neon (a number) */
export function drawSkyMark(c, index, look, accent) {
  c.clearRect(0, 0, W, H);
  if (!MARKS[index]) return;
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  MARKS[index](pens(c, look === 'day', css(accent)));
  c.restore();
}

/** the band's landmark layer: → { el, set(index, look, accent), destroy() } — set() redraws only on a change (a gateway, the look) */
export function createSkyMark(band) {
  const el = document.createElement('div'), cv = document.createElement('canvas'), beam = document.createElement('i');
  el.className = 'jw-sky-mark'; beam.className = 'jw-sky-beam'; el.setAttribute('aria-hidden', 'true');
  cv.width = W * 2; cv.height = H * 2;
  el.append(cv, beam); band.append(el);
  let key = '', flip = false;
  return {
    el,
    set(index, look, accent) {
      const k = `${index}:${look}`;
      if (k === key) return;
      key = k;
      if (index < 0 || !MARKS[index]) { el.classList.remove('is-a', 'is-b'); delete el.dataset.area; return; }
      const c = ctx2d(cv);
      if (!c) return;
      c.setTransform(2, 0, 0, 2, 0, 0);
      drawSkyMark(c, index, look, accent);
      el.dataset.area = MARK_IDS[index]; el.dataset.look = look;
      // (it rises in — the animation restarts by swapping between two same-shaped classes: no layout is read)
      flip = !flip; el.classList.toggle('is-a', flip); el.classList.toggle('is-b', !flip);
    },
    shown: () => key,
    destroy() { el.remove(); cv.width = 0; cv.height = 0; },
  };
}
