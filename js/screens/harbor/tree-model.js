// CITY 2.0 — WSP Group 4: THE CORNER TREE AS A BAKED MODEL (scripts/bake/tree.mjs → assets/city/tree/: danielpetrov's "stylized tree",
// CC BY 4.0, one tree all year — its crown recoloured per season; winter = its own bare limbs ('bare') or Quaternius DeadTree_1 ('dead'),
// each with a snow copy). The big framing maple (core/harbor-promenade.js maples[0], big) draws its season's sprite IN THE BAKE in place of
// the hand-drawn tree (trees.js#drawTree) while the switch is on (&tree=model | dead, or the panel's rows); until the sprites are in, the
// hand-drawn tree stands. The sprites: day / gold / night, blended by the bake's tones like the harvest model; each the WebP, else the PNG.
import { safeCtx } from '../../ui/canvas-safe.js';

const BASE = new URL('../../../assets/city/tree/', import.meta.url);
/** tree.json's numbers (a copy: the fetch may fail) — the sprite's px per pt is F / z × dpr at the bake's depth */
export const TREE_META = Object.freeze({ z: 42, F: 600, dpr: 3, x: 10.92, H: 8.14 });
let mode = '';                 // '' (the hand-drawn tree) | 'bare' (the model; winter = its own limbs) | 'dead' (winter = DeadTree_1)
const sets = new Map(), watch = new Set();
let meta = null, metaAsked = false;
/** the switch (scene.js, once a frame): '' | 'bare' | 'dead' */
export function setTreeModel(m) { mode = m || ''; }
export const treeModelMode = () => mode;
export const onTreeModel = fn => { watch.add(fn); return () => watch.delete(fn); };
const tell = () => { for (const fn of watch) { try { fn(); } catch { /* the watcher's own */ } } };
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => (i.naturalWidth > 0 ? res(i) : rej(new Error('empty'))); i.onerror = () => rej(new Error('error')); i.src = src; });
const sprite = name => loadImg(new URL(`${name}.webp`, BASE).href).catch(() => loadImg(new URL(`${name}.png`, BASE).href));
/** the variant a season + the snow asks for: spring · summer · autumn · bare[-snow] · dead[-snow] */
export function treeVariant(season, snow) {
  if (season === 'winter') return `${mode === 'dead' ? 'dead' : 'bare'}${snow > 0.25 ? '-snow' : ''}`;
  return season === 'spring' || season === 'summer' ? season : 'autumn';
}
/** a variant's three sprites → { day, gold, night } once loaded (null meanwhile — the load starts on the first ask) */
export function treeSprites(v) {
  if (!mode) return null;
  if (!metaAsked) { metaAsked = true; fetch(new URL('tree.json', BASE).href).then(r => (r.ok ? r.json() : null)).then(j => { meta = j; }).catch(() => {}); }
  let s = sets.get(v);
  if (!s) {
    s = { state: 'loading', img: null };
    sets.set(v, s);
    Promise.all(['day', 'gold', 'night'].map(l => sprite(`${v}-${l}`))).then(([day, gold, night]) => { s.img = { day, gold, night }; s.state = 'in'; tell(); })
      .catch(e => { s.state = `failed: ${e.message}`; tell(); });
  }
  return s.img;
}
/** the bake key's part: '' off · the variant + whether its sprites are in (a change re-bakes the layer) */
export const treeModelKey = v => (mode ? `${v}:${sets.get(v) && sets.get(v).state === 'in' ? 'in' : 'wait'}` : '');
export const treeModelState = () => ({ mode, sets: Object.fromEntries([...sets].map(([k, s]) => [k, s.state])) });

let comp = null;
/** draw the model at the tree's foot (fx, fy = its foot on screen, s = pt per world unit there) in the tones T (+ the lamps' level) →
 *  true when drawn */
export function drawTreeModel(x, fx, fy, s, T, v, lampK = 1) {
  const M = treeSprites(v); if (!M) return false;
  const m = meta || TREE_META, w0 = M.day.naturalWidth, h0 = M.day.naturalHeight;
  const footX = m.footX != null ? m.footX : w0 / 2, footY = m.footY != null ? m.footY : h0 * 0.94;
  if (!comp) comp = document.createElement('canvas');
  if (comp.width !== w0 || comp.height !== h0) { comp.width = w0; comp.height = h0; }
  const c = safeCtx(comp); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, w0, h0);
  const n = Math.min(1, Math.max(0, Math.max(T.night || 0, 1 - Math.min(1, (T.day || 0) + (T.gold || 0)))));
  if (n < 0.999) c.drawImage(M.day, 0, 0);
  const gk = Math.min(1, Math.max(0, T.gold || 0)) * (1 - n); if (gk > 0.001) { c.globalAlpha = gk; c.drawImage(M.gold, 0, 0); c.globalAlpha = 1; }
  if (n > 0.001) { c.globalAlpha = n; c.drawImage(M.night, 0, 0); c.globalAlpha = 1; }
  const dim = n * (1 - Math.min(1, Math.max(0, lampK))) * 0.6; if (dim > 0.01) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(10,8,22,${dim.toFixed(3)})`; c.fillRect(0, 0, w0, h0); c.globalCompositeOperation = 'source-over'; }
  const k = s / (m.F / m.z) / m.dpr;
  x.drawImage(comp, fx - footX * k, fy - footY * k, w0 * k, h0 * k);
  return true;
}
