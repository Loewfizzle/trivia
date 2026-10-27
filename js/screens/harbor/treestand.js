// CITY 2.0 — THE HARBOR, PART 11a-2: THE CHRISTMAS-TREE VENDOR's STAND (Black Friday morning → Christmas Eve — core/harbor-xmas.js#xmasPrelude's
// `tree`; a big set piece: LATCHED like the others — it is simply there when the city opens). At the bench's left end (the dressing spot
// bench-left): a rough timber rack with five firs leaning on its rail, two more standing out front in their wooden cross-stands, a
// hand-painted FRESH TREES board on a stake, and a hurricane lantern hung on the rack's post — its warm glow after dark (scene light:
// col(x, z) models every colour; the lantern's own light is added by the caller). One sprite per look (the light key) — cheap a frame.
import { project } from '../../core/harbor-layout.js';
import { rngFrom, hashString } from '../../core/rng.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
/** the stand's size (world units) — the rack's width + rail height, the trees' heights */
export const STAND = Object.freeze({ w: 2.3, rail: 1.45, tree: [1.85, 2.35], lean: 0.22, lantern: { u: -1.1, y: 1.55 } });
const mk = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });

/** a fir (seen side-on): tiers of drooping boughs, darker inside, the tips lit from the left; trunk stub at its foot. (x0, y0) = its foot */
function fir(x, x0, y0, h, w, tilt, col, r) {
  x.save(); x.translate(x0, y0); x.rotate(tilt);
  x.fillStyle = rgb(col([92, 66, 44])); x.fillRect(-w * 0.05, -h * 0.1, w * 0.1, h * 0.12);
  const tiers = 7;
  for (let i = 0; i < tiers; i++) {
    const u = i / tiers, yb = -h * (0.08 + 0.86 * u), yt = -h * (0.08 + 0.86 * (u + 1.35 / tiers)), half = w * 0.5 * (1 - u * 0.86) * (0.9 + r() * 0.2);
    const g = x.createLinearGradient(-half, 0, half, 0);
    g.addColorStop(0, rgb(col([54, 104, 62]))); g.addColorStop(0.45, rgb(col([30, 70, 42]))); g.addColorStop(1, rgb(col([18, 44, 28])));
    x.fillStyle = g; x.beginPath(); x.moveTo(0, Math.min(yt, -h * 0.98));
    // (the apex → the right tip → the jagged, drooping bough line across → the left tip → back up: one closed outline)
    const n = 5;
    for (let j = n; j >= -n; j--) { const a = j / n, e = Math.abs(j) % 2; x.lineTo(half * a * (e ? 1.06 : 0.94), yb - (yb - yt) * 0.12 * (1 - Math.abs(a)) + (e ? h * 0.014 : 0) + h * 0.02 * Math.abs(a)); }
    x.closePath(); x.fill();
    // the needles' texture: a few light strokes along the bough edges (the lit side)
    x.strokeStyle = rgb(col([110, 156, 104]), 0.55); x.lineWidth = Math.max(0.5, w * 0.012); x.beginPath();
    for (let j = 0; j < 4; j++) { const a = r(); x.moveTo(-half * a, yb - h * 0.005); x.lineTo(-half * a * 0.7, yb - h * 0.035); }
    x.stroke();
  }
  x.restore();
}

/** the stand's sprite → { cv, x, y, w, h } (screen pt, foot-anchored at the spot) */
export function paintTreeStand(L, sp, dpr, col) {
  const s = L.cam.F / sp.z, px = s * dpr, W = (STAND.w + 1.6) * px, H = (STAND.tree[1] + 0.5) * px, cv = mk(W, H), x = safeCtx(cv), r = rngFrom(hashString(`trees|${sp.x.toFixed(2)}`));
  const cx = W / 2, foot = H - 0.12 * px, U = v => v * px;
  // the shadow on the paving
  x.fillStyle = 'rgba(10,8,16,0.32)'; x.beginPath(); x.ellipse(cx, foot, U(STAND.w * 0.62), U(0.16), 0, 0, TAU); x.fill();
  // THE RACK: two posts + the top rail + a lower rail (rough timber)
  const wood = col([136, 104, 70]), woodLo = col([96, 72, 48]);
  for (const s0 of [-1, 1]) { x.fillStyle = rgb(wood); x.fillRect(cx + U(s0 * STAND.w / 2) - U(0.05), foot - U(STAND.rail + 0.1), U(0.1), U(STAND.rail + 0.1)); }
  x.fillStyle = rgb(woodLo); x.fillRect(cx - U(STAND.w / 2 + 0.08), foot - U(STAND.rail), U(STAND.w + 0.16), U(0.08));
  x.fillRect(cx - U(STAND.w / 2), foot - U(0.45), U(STAND.w), U(0.06));
  // FIVE FIRS leaning on the rail (back row: their butts forward on the paving, their tops back over the rail)
  for (let i = 0; i < 5; i++) {
    const u = -STAND.w / 2 + 0.25 + i * (STAND.w - 0.5) / 4, h = U(STAND.tree[0] + r() * (STAND.tree[1] - STAND.tree[0])), w = h * (0.5 + r() * 0.1);
    fir(x, cx + U(u), foot - U(0.06), h, w, (r() - 0.5) * STAND.lean, col, r);
  }
  // two standing out front in their wooden cross-stands, a little apart
  for (const [u, k] of [[-0.6, 0.86], [0.75, 0.95]]) {
    const h = U(STAND.tree[0] * k), w = h * 0.56;
    fir(x, cx + U(u), foot + U(0.04), h, w, (r() - 0.5) * 0.04, col, r);
    x.fillStyle = rgb(woodLo); x.fillRect(cx + U(u) - U(0.26), foot + U(0.02), U(0.52), U(0.06));
  }
  // THE BOARD on its stake: FRESH TREES, hand-painted white on green
  { const bx = cx + U(STAND.w / 2 + 0.45), by = foot - U(0.95), bw = U(0.72), bh = U(0.42);
    x.fillStyle = rgb(woodLo); x.fillRect(bx - U(0.03), by, U(0.06), foot - by);
    x.fillStyle = rgb(col([34, 92, 56])); x.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
    x.strokeStyle = rgb(col([210, 190, 150])); x.lineWidth = Math.max(0.6, U(0.025)); x.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
    x.fillStyle = rgb(col([246, 240, 226])); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `700 ${Math.max(4, U(0.13)).toFixed(1)}px "Chakra Petch", sans-serif`; x.fillText('FRESH', bx, by - bh * 0.17); x.fillText('TREES', bx, by + bh * 0.2); }
  // the hurricane lantern on the left post (its glass + its cap; its glow is the caller's)
  { const lx = cx + U(STAND.lantern.u), ly = foot - U(STAND.lantern.y);
    x.fillStyle = rgb(col([60, 56, 52])); x.fillRect(lx - U(0.07), ly - U(0.16), U(0.14), U(0.04));
    x.fillStyle = rgb(col([255, 214, 150]), 0.9); x.beginPath(); x.ellipse(lx, ly - U(0.05), U(0.06), U(0.09), 0, 0, TAU); x.fill(); }
  const [sx, sy] = project(L.cam, sp.x, 0, sp.z);
  return { cv, x: sx - cx / dpr, y: sy - foot / dpr, w: W / dpr, h: H / dpr, lantern: [sx + STAND.lantern.u * s, sy - (STAND.lantern.y + 0.05) * s], s };
}
