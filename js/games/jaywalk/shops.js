// JAYWALK — DOWNTOWN's EDGE SHOPS (H6B — docs/jaywalk.md "THE FINAL POLISH"; the reviews: "plain flat-colour boxes at the screen edges").
// Four of Kenney's small commercial buildings (City Kit (Commercial) 2.1 — CC0; re-packed by scripts/build-jaywalk-assets.py --only=shops:
// one mesh each, the colormap in its vertex colours, its WINDOW GLASS marked) stand where the code-built storefront boxes stood: in
// DOWNTOWN's edge columns, their fronts (the door, the awning) toward the camera. BY NIGHT their windows are LIT (the glass glows warm —
// it dies with its lane in the blackout) under a neon sign that throws its colour on the pavement; BY DAY the glass is glass and the
// sign a painted board. A VIEW: the rules have nothing there (an edge column of a ground lane — areas.js#dressLane).
// FETCHED ON DEMAND (night.js#shopGet — when a shop first comes into the scene's window): out of the cartridge's eager graph, never
// at the boot; until it lands the scene draws the code-built box.
import * as THREE from 'three';
import { parseGlb, MODEL_REV } from './models.js';
import { fogUp } from './night-fx.js';

const DIR = new URL('../../../assets/jaywalk/models/', import.meta.url);
export const SHOPS = Object.freeze(['shop-a', 'shop-b', 'shop-c', 'shop-d']);
/** a shop's size on the lane (cells): its front's width + height scale · its depth (it stays inside its own lane) */
export const SHOP = Object.freeze({ w: 1.8, d: 0.9, front: 0.46, sign: [0.62, 0.86, 0.6, 0.74] });   // (sign: where each model's sign hangs — a share of its front's width up from the pavement)

/** C = night.js's own: { kind (its instanced-kind maker), K (its kinds — every one is reset + laid each frame), rewarm() } */
export function createShops({ kind, K, rewarm }) {
  let dead = false;
  const U = { value: 0 }, KS = [];
  // ONE lit material for the four: the scene's own (its fog follows the ground under the thing) + THE WINDOWS: the glass adds a warm
  // light of its own by night (× the instance's own dim: the blackout takes it with its lane)
  const mat = fogUp(new THREE.MeshLambertMaterial({ vertexColors: true })), fog = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    fog(sh); sh.uniforms.uWin = U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float paint;\nvarying float vWin;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWin = paint;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uWin;\nvarying float vWin;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vWin * uWin * vec3(1.0, 0.8, 0.46) * 1.5 * min(1.0, dot(vColor.rgb, vec3(1.4)));');
  };
  mat.customProgramCacheKey = () => 'jw-shop';
  Promise.all(SHOPS.map(n => fetch(new URL(`${n}.glb?v=${MODEL_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).then(b => (b ? parseGlb(b) : null)).catch(() => null))).then(geos => {
    if (dead) { for (const g of geos) if (g) g.dispose(); return; }
    geos.forEach((g, i) => { if (g) KS[i] = K[`shop${i}`] = kind(g, mat, 12); });
    rewarm();
  });
  return {
    /** one storefront in an edge column: q = dressLane's entry (its hashes pick the model + the sign), x = its middle, z = its lane's,
     *  dim (the edge column's light × the blackout), lt, on (its lights are on), day, sg (its sign's colour) → false = not loaded yet */
    put(q, x, z, dim, lt, on, day, sg) {
      const i = Math.floor(q.s * 3.999), k = KS[i];
      if (!k) return false;
      U.value = day ? 0 : 1;
      k.put(x, 0, z + 0.02, SHOP.w, SHOP.w, SHOP.d, 0, 0xffffff, dim * (day ? 1.15 : 1.5));
      K.shadow.put(x, 0.03, z + 0.12, 2.1, 1, 1.15, 0, 0, 1, 0, 0.5 * lt);
      const sy = SHOP.sign[i] * SHOP.w, fz = z + SHOP.front;
      if (day) {   // (a PAINTED board over the shop front: white trim, the sign's colour)
        K.bill.put(x, sy, fz, 1.06, 0.26, 1, 0, 0xfbf6ea, 1, 4, 1); K.bill.put(x, sy, fz, 0.92, 0.15, 1, 0, sg, 1, 4, 1);
      } else if (on) {   // (its NEON sign — the tube, its glow — + its colour thrown on the pavement in front)
        K.bill.put(x, sy, fz, 1.0, 0.17, 1, 0, sg, 1, 4, lt); K.bill.put(x, sy, fz, 0.9, 0.06, 1, 0, 0xffffff, 1, 4, 0.75 * lt); K.bill.put(x, sy, fz, 1.7, 0.6, 1, 0, sg, 1, 0, 0.42 * lt);
        K.flat.put(x, 0.045, z + 0.55, 2.0, 1, 0.9, 0, sg, 1, 0, 0.3 * lt); K.flat.put(x, 0.046, z + 0.5, 1.5, 1, 0.6, 0, 0xffd9a0, 1, 0, 0.26 * lt);
      }
      return true;
    },
    info: () => ({ models: KS.filter(Boolean).length }),
    destroy() { dead = true; mat.dispose(); },
  };
}
