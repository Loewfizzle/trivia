// THE VAULT 2B — THE SPEAKEASY's REAL FRONT, FACE-ON, for a card (the owner's lab FIX on card-founder's + card-house's full cards: "much
// higher quality — the close building looks cheap"). The city paints every wall of its speakeasy FLAT in its own units before it projects
// it (screens/harbor/speakeasy-bake.js: the brick by kiln run, the granite plinth, the chevron belt, the dentil cornice, the Deco piers +
// spandrels + the stepped crest, the EST. 1924 date stone, the windows, the barbershop + its awning, the light + the soot of a century).
// So the card draws THE SAME BUILDING — the city's own painters through one wall map, at the phone's full ratio — never a second version.
// Lazy (the city's modules load on the card's first frame; the card's own scene stands alone until then — sg-kit.js#city), baked once
// per size + look into a sprite (kit.js).
//   front(k, dpr, o) → { cv (the bake, or null while loading), W, H (units), u2x, v2y }   o = { night: 0..1, lit: 0..1 (the rooms), live: ['back'] }
// THE VAULT 2C (the owner's FIX on FOUNDING MEMBER's full card: "change the card table scene to the shadow boxer scene"; the card game was
// RETIRED with the old scenes — WINDOWS, Nov 1): the back room is never baked with the card game — o.live leaves it for drawBoxer(), which
// paints the city's REAL shadowboxer (screens/harbor/boxer.js — the window standard's bar) live in that pane, each frame.
import { sprite } from './kit.js';
import { city } from './sg-kit.js';
import { lazyImport } from '../ui/lazy-import.js';

const load = () => Promise.all([lazyImport(import('../screens/harbor/speakeasy-geo.js'), '../screens/harbor/speakeasy-geo.js'), lazyImport(import('../screens/harbor/speakeasy-bake.js'), '../screens/harbor/speakeasy-bake.js'), lazyImport(import('../core/harbor-speakeasy.js'), '../core/harbor-speakeasy.js'), lazyImport(import('../screens/harbor/window-rooms.js'), '../screens/harbor/window-rooms.js')]);
/** the front's units: 11.2 across, the crest's top up */
export const FRONT_W = 11.2;

/** the city's look at night (screens/harbor/sky.js's tones, the parts the walls read) */
const NIGHT_T = { day: 0, gold: 0, night: 1, sunDir: 0, sunEl: -20, ovc: 0, lamps: 1, haze: [26, 20, 46], skyHi: [22, 16, 48], skyLo: [44, 22, 60] };

/** the speakeasy's box in front units (core/harbor-layout.js's — only what the front's painters read) */
const BOX = { door: { u0: 9.05, u1: 10.55, h: 2.6 }, awning: { u0: 2.0, u1: 8.1, y0: 3.8, y1: 3.42, z: 43.15 },
  shop: { win: [3.3, 7.9, 0.78, 3.12], door: [2.14, 3.06, 3.12], pole: { u: 8.42, v0: 1.15, v1: 3.2 }, basement: [4.3, 7.1, 0.1, 0.47], sconce: { u: 9.8, v: 3.05 } } };

/** the front at k px a unit → its bake (null until the city's painters are in) + its size in units */
export function front(k, dpr, o = {}) {
  const mods = city('speakeasy-front', load);
  if (!mods) return { cv: null };
  const [G, B, S, WR] = mods, V = S.SPEAK_V, top = (V.crest && V.crest.top) || V.parapet + 1.6, H = Math.max(V.parapet + 0.4, top + 0.2), W = FRONT_W;
  const wpx = Math.ceil(W * k), hpx = Math.ceil(H * k);
  const cv = sprite(`sp-front2:${wpx}x${hpx}:${o.key || ''}@${dpr}`, wpx * dpr, hpx * dpr, (x) => {
    const T = { ...NIGHT_T, ...(o.T || {}) }, M = G.mats(T), K = k * dpr;
    const course = Math.max(2, Math.round(0.11 * K)), blen = Math.max(4, Math.round(0.26 * K));
    x.save(); G.wallMap(x, 0, hpx * dpr, K);
    const pat = x.createPattern(G.brickTile(M.brick, course, blen, 9, M.night > 0.5), 'repeat');
    const P = B.paintStructure(x, M, { u0: 0, u1: W, side: false, pat });
    B.paintFrontDeco(x, M, { ...P, pat });
    if (M.night > 0.3) B.paintWashers(x, M, 1, G.brickTile(B.WASH.brick, course, blen, 9, false), B.WASH.piers);
    B.paintWasherLamps(x, M, 1, B.WASH.piers);
    const s = { ...BOX, windows: S.SPEAK_WIN.map(w => [...w]), rows: V.rows.map(r => [...r]) };
    S.ROOMS.forEach(rm => { const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2]; B.paintWindow(x, M, a, b, r0, r1, { blind: 0.18, curtain: null, plant: rm.id === 'edge2' }); });
    B.paintGround(x, M, s, null);
    B.paintLight(x, M, 0, W, false, 51);
    // THE ROOMS, LIT — the city's own night rooms (window-rooms.js#paintRoom: the bar, the jazz room's honey shade — the back room left for THE SHADOWBOXER (drawBoxer) —, the TV apartment, the curtained edges), each a box in perspective toward the card's eye (the building's middle)
    if (o.rooms !== false) {
      const vp = { u: W / 2, v: V.rows[0][1] }, live = o.live || ['back'];
      S.ROOMS.forEach(rm => { if (live.includes(rm.id) || rm.lit === 'table') return; const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2]; try { WR.paintRoom(x, { ...rm, u: [a, b], v: [r0, r1] }, { late: 0, vp }); } catch (e) { void e; } });
    }
    x.restore();
  });
  // (the rooms' windows: their rects in the card's px — the card lights them itself)
  const wins = S.ROOMS.map(rm => { const [a, b] = S.SPEAK_WIN[rm.col], [r0, r1] = V.rows[rm.floor - 2]; return { id: rm.id, x0: a * k, x1: b * k, y0: (H - r1) * k, y1: (H - r0) * k }; });
  return { cv, W, H, wpx, hpx, k, wins, V, S, shop: BOX.shop, u2x: u => u * k, v2y: v => (H - v) * k };
}

// ---- THE SHADOWBOXER in the back room's pane, LIVE (THE VAULT 2C) — the city's own painter (boxer.js) + its forced timeline
// (core/harbor-boxer.js#boxerPreview: his round — combinations in the air, bursts on the bag, the bulb swinging), looped over his first
// round's middle (a 160-s loop: the one cut back is rare + mid-move). Drawn in the front's wall units through the card's painter (the GL
// look-alike or the 2D fallback), clipped to the glass. Reduced motion: one still pose in his guard.
const loadBoxer = () => Promise.all([lazyImport(import('../screens/harbor/boxer.js'), '../screens/harbor/boxer.js'), lazyImport(import('../core/harbor-boxer.js'), '../core/harbor-boxer.js'), lazyImport(import('../screens/harbor/window-rooms.js'), '../screens/harbor/window-rooms.js')]);
/** the back room's glass in card px (F from front(); bx, by = where the bake is drawn) — the card's MOVING-PART box for its badge slot */
export function boxerBox(F, bx, by) {
  const r = F && F.wins && F.wins.find(x => x.id === 'back');
  return r ? [bx + r.x0, by + r.y0, r.x1 - r.x0, r.y1 - r.y0] : null;
}
/** paint him into the pane: c the card's context, F = front(), the bake drawn at (bx, by) and scale s (bw / wpx — 1 when drawn 1 : 1) */
export function drawBoxer(c, F, bx, by, t, still, s = 1) {
  if (!F || !F.cv) return false;
  const mods = city('speakeasy-boxer', loadBoxer);
  if (!mods) return false;
  const [BX, CB, WR] = mods, S = F.S, rm = S && S.ROOMS.find(r => r.id === 'back');
  if (!rm) return false;
  const [a, b] = S.SPEAK_WIN[rm.col], [r0, r1] = F.V.rows[rm.floor - 2], G = WR.glassOf({ u: [a, b], v: [r0, r1] }), k = F.k * s;
  const sec = still ? 30 : 12 + (t % 160);
  let st;
  try { st = CB.boxerPreview(sec, 1, 0.5).st; } catch { return false; }
  c.save();
  c.transform(k, 0, 0, -k, bx, by + F.H * k);
  c.beginPath(); c.rect(G.g0, G.h0, G.cw, G.ch); c.clip();
  try { BX.boxerRoom({ c, G, t, mo: !still }, still ? { ...st, inView: true } : st, { key: 'card', seed: 1924 }); } catch (e) { void e; }
  c.restore();
  return true;
}
