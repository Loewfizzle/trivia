// PRISM DROP (SKINS 1) — THE SKINS PICKER: ☰ → Settings → PRISM DROP → SKINS (Ben: docs/games/plan.md "SKINS 1 — SETTINGS"). A DAY row + a NIGHT
// row, each ROTATE (the default — every skin this phone owns, in turn) or ONE owned skin, as small LIVE tiles: a 3-block sample drawn with the
// skin's OWN sprites (skins.js — the same blocks the board draws, at a real cell size: no thumbnail image, nothing of a skin downloads) on its
// panel colour; the chosen one outlined. A look with only ONE owned skin has no row (nothing to choose). A tap = settings.prismSkinDay /
// prismSkinNight (this phone only) → the board changes LIVE, even mid-match (view.js#pickSkin reads the pins each frame — no reload).
// Loaded LAZILY by ui/settings-panel.js (the boot graph never names a game). Its CSS is its own (injected once — the settings sheet can open
// where css/prism.css isn't loaded). Prefix pdp-.
import { h } from '../../ui/dom.js';
import { W, VISIBLE } from './engine.js';
import { SKINS, ROTATE, ownedOf, phoneOf } from './skins.js';

const CSS = `
.pdp { display: grid; grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: 8px; padding: 2px 0 6px; }
.pdp-opt { display: grid; justify-items: center; gap: 6px; padding: 7px 2px 8px; border-radius: 14px; cursor: pointer; min-height: 44px; min-width: 0;
  background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(255, 255, 255, 0.10); color: var(--text, #fff); font: inherit; }
.pdp-opt[aria-pressed='true'] { border-color: var(--accent, #d6f0ff); box-shadow: 0 0 0 1px var(--accent, #d6f0ff), 0 0 14px rgba(214, 240, 255, 0.35); background: rgba(214, 240, 255, 0.07); }
.pdp-opt b { font: 800 10px/1.15 var(--font-ui); letter-spacing: 0.03em; text-align: center; min-height: 23px; display: grid; align-items: center; max-width: 100%; }
.pdp-opt[aria-pressed='true'] b { color: var(--accent, #d6f0ff); }
.pdp-mini { display: block; width: 66px; height: 46px; border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08); }
`;
let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(h('style', { 'data-pdp': '' }, CSS));
}

export const TILE = Object.freeze({ w: 66, h: 46, cell: 19 });
// PFIX-3 — K4 (FABLE REVIEW 2): THE TILES ARE DRAWN ONE A FRAME. Every tile asked for its own frame, so all eight painted in ONE (the crayon
// tile alone cost 143 ms at 4× CPU — long tasks of 87–164 ms as Settings opened). One queue: a tile a frame, each skin's own tile first, the
// ROTATE tiles (a block of every skin of the look) last.
const paints = [];
let pumping = false;
const nextFrame = fn => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16));
function pump() { const p = paints.shift(); if (p) p(); if (paints.length) nextFrame(pump); else pumping = false; }
/** a tile's paint, in turn (`last`: after every tile already waiting) */
export function queuePaint(paint, last = false) {
  if (last) paints.push(paint); else { const i = paints.findIndex(p => p.last); if (i < 0) paints.push(paint); else paints.splice(i, 0, paint); }
  if (last) paint.last = true;
  if (!pumping) { pumping = true; nextFrame(pump); }
}
// the sample: three blocks — two side by side, one on top (an L's corner): three pieces' colours, so the skin's palette + its edges read
const SAMPLE = Object.freeze([[0, 1, 5], [1, 1, 1], [1, 0, 2]]);   // [col, row (0 = top), piece]

/** one skin's 3-block sample into a canvas (its panel colour behind), at the screen's pixel ratio */
export function drawSample(canvas, skin, { cell = TILE.cell, w = TILE.w, hgt = TILE.h, x0 = null } = {}) {
  const dpr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const px = Math.round(cell * dpr);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(hgt * dpr);
  const c = canvas.getContext('2d');
  c.fillStyle = skin.tokens.panel;
  c.fillRect(0, 0, canvas.width, canvas.height);
  const env = skin.env(null);
  const ox = x0 != null ? Math.round(x0 * dpr) : Math.round((canvas.width - 2 * px) / 2), oy = Math.round((canvas.height - 2 * px) / 2);
  if (skin.glow) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = skin.glow;
    for (const [x, y, t] of SAMPLE) { const g = skin.sprite(px, 'glow', t, 0, env), o = (g.width - px) / 2; c.drawImage(g, ox + x * px - o, oy + y * px - o); }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  for (const [x, y, t] of SAMPLE) c.drawImage(skin.sprite(px, 'block', t, skin.pieceV(x, y, t), env), ox + x * px, oy + y * px);
  // (SKINS 2B) what the skin paints where the stack's blocks TOUCH (its `seams` — the watercolor's bleed) shows in the tile too: the sample
  // laid on the board at the skin's own `sampleAt` (a place whose seams it paints), the board's hook called as the board calls it
  if (skin.seams) {
    const at = skin.sampleAt || { x: 0, y: 0 }, cells = new Uint8Array(W * VISIBLE);
    for (const [x, y, t] of SAMPLE) cells[(at.y + 1 - y) * W + at.x + x] = t;
    c.save();
    c.translate(ox - at.x * px, 0);
    skin.seams(c, { cells, px, sy: r => oy + (at.y + 1 - r) * px, grey: 0 });
    c.restore();
  }
}
/** ROTATE's tile: one block of each owned skin of the look, side by side (what the rotation will deal) */
function drawRotate(canvas, skins) {
  const dpr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  canvas.width = Math.round(TILE.w * dpr); canvas.height = Math.round(TILE.h * dpr);
  const c = canvas.getContext('2d');
  const n = skins.length, cell = Math.min(TILE.cell, Math.floor((TILE.w - 8) / n)), px = Math.round(cell * dpr);
  const band = canvas.width / n;
  skins.forEach((skin, i) => {
    c.fillStyle = skin.tokens.panel;
    c.fillRect(Math.round(i * band), 0, Math.ceil(band), canvas.height);
    c.drawImage(skin.sprite(px, 'block', [5, 1, 2, 4][i % 4], 0, skin.env(null)), Math.round(i * band + (band - px) / 2), Math.round((canvas.height - px) / 2));
  });
}

/**
 * THE SKINS rows' bodies. `settings` = the phone's (prismSkinDay / prismSkinNight), `choose(look, id)` = the setting's write.
 * → [{ look, label, el }] — one per look with 2+ owned skins (a look with ONE owned skin has no row).
 */
export function skinRows(settings, choose) {
  style();
  const phone = phoneOf(settings);
  const rows = [];
  for (const look of ['day', 'night']) {
    const ids = ownedOf(look, phone);
    if (ids.length < 2) continue;
    const cur = ids.includes(phone.pin[look]) ? phone.pin[look] : ROTATE;
    const opts = [ROTATE, ...ids].map(id => {
      const skin = SKINS[id] || null;
      const cv = h('canvas.pdp-mini', { 'aria-hidden': 'true' });
      const b = h('button.pdp-opt', { type: 'button', 'aria-pressed': String(id === cur), 'aria-label': skin ? `${skin.name} — ${skin.line}` : 'Rotate — a different skin every match', 'data-skin': id,
        onclick: () => { for (const o of opts) o.setAttribute('aria-pressed', String(o === b)); choose(look, id); } },
        cv, h('b', skin ? skin.name : 'ROTATE'));
      // (drawn after the sheet is up: a skin's first sprites are made here — never in the tap that opens the sheet — ONE TILE A FRAME: K4)
      const paint = () => { try { if (skin) drawSample(cv, skin); else drawRotate(cv, ids.map(k => SKINS[k])); } catch { /* a canvas the browser refused: the name alone */ } };
      queuePaint(paint, !skin);
      return b;
    });
    rows.push({ look, label: look === 'day' ? 'DAY SKIN' : 'NIGHT SKIN', el: h('div.pdp', { role: 'group', 'aria-label': look === 'day' ? 'Day skin' : 'Night skin', 'data-look': look }, ...opts) });
  }
  return rows;
}
