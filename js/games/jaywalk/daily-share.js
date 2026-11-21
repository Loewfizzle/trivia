// JAYWALK's DAILY — SHARE TODAY's SECTION + its OWN card (DAILY B — docs/jaywalk.md "THE DAILY"; THE ONE RULE: js/daily/share.js#RHYTHM).
// LAZY: registered in js/daily/share-today.js#SECTIONS (loaded only when a card is drawn — never in JAYWALK's preload graph). The inputs are the
// SERVER's, SPOILER-FREE (api/_lib/jaywalk-tries.js#shareOf: each try's lanes, the best's index, NEW DAILY BEST) — NEVER the course.
//   the section = JAYWALK (white — no win / lose) · the big BEST ("143 LANES") · "BEST OF 3" (+ " · NEW DAILY BEST") · (J3) ONE small best-time
//   line "TO 100 · 1:14" (the highest 50 reached today, its best time — the server's splits; under the stat line: THE ONE RULE keeps the name /
//   big / stat rows level with every other section) · THE ART = 3 TRY BARS
//   (~640 wide, centred; each = that try's lanes against the best; the best AMBER, the others dim; an unplayed try = an empty outline)
//   jwInputs(o) — PURE (the only keys) · barsOf(inputs, w) — PURE (each bar's length + kind) · paintSection(c, …) · renderShare({ inputs, look })
import { RHYTHM, OWN, shareFrame, shareFoot, prepShare, paintName, paintBig, paintStat } from '../../daily/share.js';
import { bestTimeLine } from '../../core/jw-time-text.js';

export const NAME = 'JAYWALK';
export const TRIES = 3;
/** the art's width on the card (units of the 1080-wide card) */
export const BARS_W = 640;
const AMBER = { night: '#ffa53a', day: '#e0661c' };
const DIM = { night: 'rgba(226,222,246,0.34)', day: 'rgba(22,48,92,0.28)' };
const RIM = { night: 'rgba(226,222,246,0.5)', day: 'rgba(22,48,92,0.42)' };

/** PURE: the card's only inputs — { t: [lanes | null ×3], b: best index (-1 none), nb: NEW DAILY BEST, day, hs: { at, t } | null (J3) } */
export function jwInputs(o = {}) {
  const t = Array.from({ length: TRIES }, (_, i) => { const v = o && Array.isArray(o.t) ? o.t[i] : null; return v == null || !Number.isFinite(Number(v)) ? null : Math.max(0, Math.min(9999, Math.floor(Number(v)))); });
  let b = Number.isInteger(o && o.b) && o.b >= 0 && o.b < TRIES && t[o.b] != null ? o.b : -1;
  if (b < 0) t.forEach((v, i) => { if (v != null && (b < 0 || v > t[b])) b = i; });
  const hs = o && o.hs && Number.isInteger(o.hs.at) && o.hs.at >= 50 && o.hs.at % 50 === 0 && Number.isInteger(o.hs.t) && o.hs.t > 0 ? { at: o.hs.at, t: o.hs.t } : null;
  return { t, b, nb: !!(o && o.nb), day: /^d\d{8}$/.test(String((o && o.day) || '')) ? String(o.day) : null, hs };
}
export const bestLanes = I => (I.b >= 0 ? I.t[I.b] : 0);
export const lanesLine = n => `${n} ${n === 1 ? 'LANE' : 'LANES'}`;
export const statOf = I => `BEST OF ${TRIES}${I.nb ? ' · NEW DAILY BEST' : ''}`;
/** J3 — the best-time line ("TO 100 · 1:14") | '' (no 50 reached today) */
export const timeOf = I => bestTimeLine(I && I.hs);
/** PURE: the three bars — { len (0…w), kind: 'best' | 'try' | 'empty' } — a played try's bar = its lanes against the best (a 0-lane try a sliver) */
export function barsOf(inputs, w = BARS_W) {
  const I = jwInputs(inputs), top = Math.max(1, bestLanes(I));
  return I.t.map((v, i) => (v == null ? { len: w, kind: 'empty' } : { len: Math.max(w * 0.025, Math.min(w, w * v / top)), kind: i === I.b ? 'best' : 'try' }));
}
/** the plain line (SHARE TODAY's text names JAYWALK the same way — today-logic.js#shareTodayLine) */
export const shareLine = (inputs, site = 'neonspeakeasy.com') => `JAYWALK · BEST OF ${TRIES} · ${lanesLine(bestLanes(jwInputs(inputs)))} · ${site}`;

/** THE ART: three bars, left-aligned in a centred column `w` wide, filling `h` (box from y) */
function paintBars(c, look, inputs, cx, y, h, w = BARS_W) {
  const L = look === 'day' ? 'day' : 'night', bars = barsOf(inputs, w), gap = h * 0.16, bh = (h - gap * (TRIES - 1)) / TRIES, x0 = cx - w / 2;
  c.save();
  bars.forEach((b, i) => {
    const by = y + i * (bh + gap), r = Math.min(6, bh / 5);
    c.beginPath(); c.roundRect ? c.roundRect(x0, by, b.len, bh, r) : c.rect(x0, by, b.len, bh);
    if (b.kind === 'empty') { c.setLineDash([10, 8]); c.lineWidth = 3; c.strokeStyle = RIM[L]; c.stroke(); c.setLineDash([]); return; }
    if (b.kind === 'best') { if (L === 'night') { c.shadowColor = AMBER.night; c.shadowBlur = 18; } c.fillStyle = AMBER[L]; c.fill(); c.shadowBlur = 0; }
    else { c.fillStyle = DIM[L]; c.fill(); }
  });
  c.restore();
}

/** SHARE TODAY's SECTION on THE ONE RULE (share-today.js scales it — every section the same) */
export function paintSection(c, { inputs, look = 'night', W = 1080 } = {}) {
  const I = jwInputs(inputs), R = RHYTHM, cx = W / 2;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  paintName(c, look, NAME, cx, R.nameY, R.namePx, W - 2 * R.COL);   // (WHITE — the daily has no win / lose)
  paintBig(c, look, lanesLine(bestLanes(I)), cx, R.bigY, R.bigPx, W - 2 * R.COL);
  paintStat(c, look, statOf(I), cx, R.statY, R.statPx, W - 2 * R.COL);
  const tl = timeOf(I);
  if (tl) paintStat(c, look, tl, cx, R.artY + 14, Math.round(R.statPx * 0.82), W - 2 * R.COL);
  paintBars(c, look, I, cx, R.artY + (tl ? 42 : 18), R.artH - (tl ? 54 : 30), Math.min(BARS_W, W - 2 * R.COL));
  c.restore();
}

const CARD = { night: { bg0: '#0b0820', bg1: '#05040e', dim: 'rgba(226,222,246,0.72)' }, day: { bg0: '#9fcdff', bg1: '#f2f8ff', dim: '#3a5582' } };
function dateOf(day) {
  const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(String(day || ''));
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '').toUpperCase() : '';
}
/** JAYWALK's OWN card (the day's only finished daily — share-today.js draws a single daily's own card) on js/daily/share.js#OWN */
export function renderShare({ inputs, look = 'night' } = {}) {
  const I = jwInputs(inputs), day = look === 'day', L = CARD[day ? 'day' : 'night'];
  const { cv, c, W, H } = shareFrame(L, look);
  if (!day) { const hz = c.createRadialGradient(W / 2, -80, 0, W / 2, -80, 700); hz.addColorStop(0, 'rgba(255,165,58,0.16)'); hz.addColorStop(1, 'rgba(255,165,58,0)'); c.fillStyle = hz; c.fillRect(0, 0, W, H); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  paintName(c, look, NAME, W / 2, OWN.nameY, OWN.namePx, W - 120);
  paintBig(c, look, lanesLine(bestLanes(I)), W / 2, OWN.bigY, OWN.bigPx, W - 160);
  paintStat(c, look, statOf(I), W / 2, OWN.statY, OWN.statPx, W - 120);
  const tl = timeOf(I);
  if (tl) paintStat(c, look, tl, W / 2, OWN.statY + 66, Math.round(OWN.statPx * 0.82), W - 120);
  paintBars(c, look, I, W / 2, OWN.artY + 120, 300, 760);
  shareFoot(c, { note: dateOf(I.day), dim: L.dim, color: day ? '#2f86ff' : AMBER.night, W, look });
  return cv;
}
export const prepJw = ({ inputs, look = 'night' } = {}) => prepShare(async () => ({ cv: renderShare({ inputs, look }), name: 'jaywalk-daily.png', line: shareLine(inputs) }));
