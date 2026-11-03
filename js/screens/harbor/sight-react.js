// CITY 2.0 — PROGRESSION B: THE TAP ON A LEGENDARY (CITY SIGHTINGS). Two small shared tables, one per page:
//   THE TAP BOXES   each legendary's own draw stamps where it IS this frame (box(id, x, y, rx, ry) — city px, the canvas's CSS px); a tap
//                   asks hit(x, y): GENEROUS (its size + a pad, never under ~30 pt a side) and it MOVES WITH the craft (a box older than
//                   a few frames is gone). No hint, ever: nothing here draws (the owner: a secret found by tapping + word of mouth).
//   THE REACTIONS   fire(id) starts one (every tap, even after it's spotted — only on the tapper's phone); each legendary's draw reads
//                   k(id) (0..1 — eased in, held, eased out over its length) / u(id) (0..1 through it). Motion in the screen's plane +
//                   the craft's own lights only (the SAME baked sprites — no new models, angles or art). Reduced motion: the draws use
//                   the LIGHT half only, held — the reaction's end state, still.
const boxes = new Map();     // id → { x, y, rx, ry, at (performance.now), meta }
const fired = new Map();     // id → { t0, len }
/** each reaction's length (s) — what the eye needs to read it on the phone (~1–1.5 s) */
export const REACT_LEN = Object.freeze({ ufo: 1.5, tr3b: 1.6, blackbird: 1.5, f22: 1.6, ghostship: 1.6, skull: 1.8, btc: 1.6, aurora: 2.2, fireball: 1.2 });
/** a box this old (ms) no longer answers: the craft has moved on / gone */
const FRESH_MS = 250;
/** the pad round a box (pt): the finger + the craft's speed */
const PAD = 22, MIN_R = 30;

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** a legendary's draw: it is HERE this frame (x, y its centre; rx, ry its half size). Two of one kind at once (the festival's two ₿s):
 *  meta.slot keeps them apart — the tap's `key` (id#slot) is what reacts, so only the one tapped answers */
export function box(id, x, y, rx, ry = rx, meta = null) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const key = meta && meta.slot != null ? `${id}#${meta.slot}` : id;
  boxes.set(key, { id, x, y, rx: Math.max(MIN_R, rx + PAD), ry: Math.max(MIN_R, ry + PAD), w: rx, h: ry, at: nowMs(), meta });
}
/** the legendary under a tap (the nearest by its own size when two overlap; `skip`: ids that can't answer here — the aurora BEHIND the
 *  lit sign: a tap on the letters stays the letters') → { id, key (fire(key) reacts), meta, x, y } | null */
export function hit(x, y, skip = null) {
  const t = nowMs(); let best = null, bd = Infinity;
  for (const [key, b] of boxes) {
    if (t - b.at > FRESH_MS || (skip && skip.includes(b.id))) continue;
    const dx = (x - b.x) / b.rx, dy = (y - b.y) / b.ry, d = dx * dx + dy * dy;
    if (d <= 1 && d < bd) { bd = d; best = { id: b.id, key, meta: b.meta, x: b.x, y: b.y }; }
  }
  return best;
}
/** the boxes up now (tests + &debug: where a tap would land) */
/** (THE VAULT 2B: + a = how visible it is this frame, 0..1 — a craft fading in passes meta.a; the owner's &sgdemo waits for a whole,
 *  fully lit craft before it snaps; w / h = its own half size, without the finger's pad) */
export function live() { const t = nowMs(), out = []; for (const [key, b] of boxes) if (t - b.at <= FRESH_MS) out.push({ id: b.id, key, x: Math.round(b.x), y: Math.round(b.y), rx: Math.round(b.rx), ry: Math.round(b.ry), w: Math.round(b.w), h: Math.round(b.h), a: b.meta && b.meta.a != null ? Math.round(b.meta.a * 100) / 100 : 1 }); return out; }
/** start a reaction now */
export function fire(key, at = null) { const id = String(key).split('#')[0]; fired.set(key, { t0: nowMs(), len: (REACT_LEN[id] || 1.4) * 1000, at }); }
/** where the tap landed for a running reaction ({ x, y } | null — the aurora's ripple starts there) */
export function at(key) { const f = fired.get(key); return f && f.at ? f.at : null; }
/** 0..1 through the reaction (null: none running) */
export function u(id) { const f = fired.get(id); if (!f) return null; const v = (nowMs() - f.t0) / f.len; if (v >= 1) { fired.delete(id); return null; } return v < 0 ? 0 : v; }
/** the reaction's envelope 0..1: a quick rise (~12 %), held, a soft fall over its last third */
export function k(id) {
  const v = u(id); if (v == null) return 0;
  const a = Math.min(1, v / 0.12), b = v > 0.66 ? 1 - (v - 0.66) / 0.34 : 1;
  const e = Math.min(a, b);
  return e * e * (3 - 2 * e);
}
/** any reaction running (the scene keeps 60 fps while one plays) */
export function busy() { for (const id of fired.keys()) if (u(id) != null) return true; return false; }
export function reset() { boxes.clear(); fired.clear(); }
/** THE F-22s BREAK APART (a tap on a formation): jet i's offset at the reaction's level rk — the lead + #3 pull UP, #2 + #4 roll DOWN and
 *  away, each further than the one before; their burners flare; still (reduced motion): no break, the burners held up.
 *  → { dy (px, + = down), ang (nose-up, rad), burn (+ the burner) } */
const BREAK = [-0.75, 0.95, -1.5, 1.6];
export function breakOf(i, rk, len, motion = true) {
  if (!(rk > 0)) return { dy: 0, ang: 0, burn: 0 };
  if (!motion) return { dy: 0, ang: 0, burn: 0.5 * rk };
  const s = BREAK[i % BREAK.length];
  return { dy: s * rk * len * 0.85, ang: -s * rk * 0.32, burn: 0.6 * rk };
}
