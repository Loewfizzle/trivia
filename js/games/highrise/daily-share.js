// HIGH RISE's DAILY — SHARE TODAY's SECTION + its OWN card (HIGH RISE DAILY B — docs/highrise.md "THE DAILY"; THE ONE RULE: js/daily/share.js#RHYTHM).
// LAZY: registered in js/daily/share-today.js#SECTIONS (loaded only when a card is drawn — never in HIGH RISE's preload graph). The inputs are
// the SERVER's, SPOILER-FREE (api/_lib/highrise-daily.js#share → held.js#shareOf: the floors, the perfects, each landed floor's slab width +
// centre (in starting-slab units) + its perfect mark; NEW DAILY BEST; how it ended) — never the seed, never a tick.
//   the section = HIGH RISE (white — no win / lose) · the big "84 FLOORS" · "ONE SHOT · 32 PERFECTS" · THE ART = THE PLAYER'S TOWER: every
//     floor's slab stacked bottom-up where it landed, ~124 units wide at a full slab, filling the art box's height; the perfect floors lit in
//     HIGH RISE's ticket ink (a glow at night), the rest dim
//   the OWN card (HIGH RISE the day's only finished daily) = THE POSTER (share.js — approved Nov 20) + a small "DAILY · ONE SHOT" tag
//   THE BIG FIVE's line (share-today.js): { big: "84 FLOORS", stat: "ONE SHOT · 32 PERFECTS" }
import { RHYTHM, paintName, paintBig, paintStat, prepShare, base64Of } from '../../daily/share.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { inkOf } from '../../daily/ticket-art.js';
import { END_WORDS } from './logic.js';

export const NAME = 'HIGH RISE';
/** a full (starting) slab's width on the card, units of the 1080-wide card */
export const TOWER_W = 124;
/** the most a floor may stand on the card (a short tower is not stretched into fat bricks) */
export const SLAB_MAX = 12;
const DIM = { night: 'rgba(226,222,246,0.34)', day: 'rgba(22,48,92,0.3)' };

const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };
/** PURE: the card's only inputs — { f, p, w[], x[], pf[], nb, day, c } (anything else dropped; the arrays cut to the floors, ≤ 200) */
export function hrInputs(o = {}) {
  const f = Math.max(0, Math.min(200, Math.floor(Number(o && o.f) || 0))), p = Math.max(0, Math.min(f, Math.floor(Number(o && o.p) || 0)));
  const arr = (a, lo, hi) => (Array.isArray(a) ? a.slice(0, 200).map(v => num(v, lo, hi)) : []);
  const w = arr(o && o.w, 0, 1.5), x = arr(o && o.x, -3, 3), pf = Array.isArray(o && o.pf) ? o.pf.slice(0, 200).map(v => (v ? 1 : 0)) : [];
  const n = Math.min(w.length, x.length);
  return { f, p, w: w.slice(0, n), x: x.slice(0, n), pf: pf.slice(0, n), nb: !!(o && o.nb), day: /^d\d{8}$/.test(String((o && o.day) || '')) ? String(o.day) : null,
    c: o && Object.prototype.hasOwnProperty.call(END_WORDS, o.c) ? o.c : null };
}
export const floorsLine = f => `${f} ${f === 1 ? 'FLOOR' : 'FLOORS'}`;
export const statOf = I => `ONE SHOT · ${I.p} ${I.p === 1 ? 'PERFECT' : 'PERFECTS'}`;
/** THE BIG FIVE (share-today.js): the big result + ONE stat line */
export const fiveLine = ({ inputs } = {}) => { const I = hrInputs(inputs); return { big: floorsLine(I.f), stat: statOf(I) }; };
/** the plain line */
export const shareLine = (inputs, site = 'neonspeakeasy.com') => { const I = hrInputs(inputs); return `HIGH RISE · ONE SHOT · ${floorsLine(I.f)} · ${site}`; };

/** PURE: THE TOWER's slabs in a box (cx = its centre line, bottom = its foot, h = its height) → [{ x, y, w, h, lit }] bottom-up */
export function towerOf(inputs, { cx = 540, bottom = 0, h = 100, full = TOWER_W } = {}) {
  const I = hrInputs(inputs), n = I.w.length;
  if (!n) return [];
  const sh = Math.min(SLAB_MAX, h / n), gap = sh > 3 ? Math.min(1.2, sh * 0.16) : 0;
  return I.w.map((wv, i) => { const ww = Math.max(1.5, wv * full); return { x: cx + I.x[i] * full - ww / 2, y: bottom - (i + 1) * sh, w: ww, h: Math.max(0.6, sh - gap), lit: !!I.pf[i] }; });
}
function paintTower(c, look, inputs, cx, top, h) {
  const L = look === 'day' ? 'day' : 'night', slabs = towerOf(inputs, { cx, bottom: top + h, h }), ink = inkOf('highrise', L);
  c.save();
  // the dim floors first, then the lit (perfect) ones over them — one glow pass at night
  c.fillStyle = DIM[L];
  for (const s of slabs) if (!s.lit) c.fillRect(s.x, s.y, s.w, s.h);
  if (L === 'night') { c.shadowColor = ink; c.shadowBlur = 10; }
  c.fillStyle = ink;
  for (const s of slabs) if (s.lit) c.fillRect(s.x, s.y, s.w, s.h);
  c.restore();
}

/** SHARE TODAY's SECTION on THE ONE RULE (share-today.js scales it — every section the same) */
export function paintSection(c, { inputs, look = 'night', W = 1080 } = {}) {
  const I = hrInputs(inputs), R = RHYTHM, cx = W / 2;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  paintName(c, look, NAME, cx, R.nameY, R.namePx, W - 2 * R.COL);   // (WHITE — the daily has no win / lose)
  paintBig(c, look, floorsLine(I.f), cx, R.bigY, R.bigPx, W - 2 * R.COL);
  paintStat(c, look, statOf(I), cx, R.statY, R.statPx, W - 2 * R.COL);
  paintTower(c, look, I, cx, R.artY + 14, R.artH - 18);
  c.restore();
}

/** HIGH RISE's OWN card (the day's only finished daily — share-today.js draws a single daily's own card) = THE POSTER + the "DAILY · ONE SHOT"
 *  tag in its mode line (always the night look — the poster's rule) */
export async function renderShare({ inputs } = {}) {
  const I = hrInputs(inputs);
  const S = await lazyImport(import('./share.js'), './share.js');
  const run = { floor: I.f, perfects: I.p, cause: I.c || '', made: I.f >= 200 || I.c === 'made', mode: 'solo', name: '' };
  const hero = await S.loadHero(S.hiRunCard(run).hero);
  const card = { ...S.hiRunCard(run), mode: DAILY_TAG };
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350;
  const c = cv.getContext('2d');
  if (!c) return null;
  S.paintPoster(c, card, hero);
  return cv;
}
export const DAILY_TAG = 'DAILY · ONE SHOT';
export const prepHr = ({ inputs } = {}) => prepShare(async () => ({ cv: await renderShare({ inputs }), name: 'high-rise-daily.png', line: shareLine(inputs) }));
/** THE END CARD's SHARE (daily-run.js): the SERVER's share inputs for today's HIGH RISE (`today { share }` — never the phone's own numbers), THE
 *  POSTER drawn when the card shows; the LINK made at the first tap (the half-size PNG fitted under the cap → /api daily shareCard — the server
 *  takes it only with its own judged finish) — no link → the picture itself */
export function prepDaily({ day } = {}) {
  return prepShare(async () => {
    const C = await lazyImport(import('../../daily/contract.js'), '../../daily/contract.js');
    const r = await C.dailyShare().catch(() => null);
    const inputs = r && (!day || r.day === day) && r.share && r.share.highrise;
    if (!inputs) return null;
    const upload = async half => {
      const K = await lazyImport(import('../kit/share-run.js'), '../kit/share-run.js');
      const png = await K.fitPng(half);
      if (!png) return '';
      const res = await C.dailyShareCard(r.day, ['highrise'], await base64Of(png)).catch(() => null);
      return res && res.path ? new URL(res.path, location.origin).href : '';
    };
    return { cv: await renderShare({ inputs }), name: 'high-rise-daily.png', line: shareLine(inputs), upload, onTap: true };
  });
}
