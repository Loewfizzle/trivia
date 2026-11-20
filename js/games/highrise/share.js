// HIGH RISE — THE SHARE IMAGE (S5 — the owner's approved mockup: Downloads\NEON\highrise-share-image.png; docs/highrise.md "THE SHARE
// IMAGE"). JAYWALK's standard, its middle copied (js/games/jaywalk/share.js — the hero frame, the dark tab, the big numerals) on the
// site's share kit (js/games/kit/share-run.js — the sign, the game + the mode, the name, the foot): 1080 × 1350, drawn ON THE PHONE from
// the run's PUBLIC numbers only.
//   · THE HERO FRAME (984 × 792 at 48, 348 — JAYWALK's box), ONE neon edge in the accent: the REAL game frame frozen a beat after the
//     tower fell (shot.js — the last slab, the falling piece, the sparks), zoomed on the tower's top + lifted brighter (by night).
//   · the cause ONCE, in a dark tab top-left (big neon words — ≤ 2 lines) · THE TOWER (core/marks.js) top-right · "THE CLOUDS · 93 PERFECTS"
//     (lavender) over the floor in the big neon numerals (white-hot, a CYAN glow) + FLOORS · the player's name under the frame.
//   · MADE IT TO THE MOTHERSHIP = ALL GOLD: the frame's edge, the title line, the cause, the number + the band line.
// THE SHARE = THE LINK ALONE (JAYWALK H4B — navigator.share({ url }), its preview = this card): built when the end screen stands, uploaded
// at the first SHARE tap (prepShare's onTap), fitted under the server's cap (fitPng). BEHIND THE SWITCH: the server takes a run's card only
// with its own COUNTED result (api/_lib/share-card.js) — with HIGHRISE_COUNTS off there is none, so the phone asks nothing once the server
// has said WOULD COUNT (final.js sets globalThis.__hiWould) and the picture itself goes out (no link, no text). Lazy (index.js#shareRun).
import { runCard, drawRunCard, fitPng } from '../kit/share-run.js';
import { spacedText, prepShare, blobHash, base64Of } from '../../daily/share.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { state as live } from '../../store.js';
import { MARKS } from '../../core/marks.js';
import { drawNum, numWidth } from '../jaywalk/numerals.js';
import { END_WORDS } from './logic.js';
import { BANDS, bandAt } from './bands.js';
import { shotFor } from './shot.js';

/** the colours: HIGH RISE's sign pink · the floor's cyan glow · the band line's lavender · THE FINISH's gold */
export const PINK = '#ff4fd8', CYAN = '#36c9ff', LAVENDER = '#c9b6ff', GOLD = '#ffc83c';
/** the card's own layout (JAYWALK's): the frame as the hero + the name under it (the kit's foot follows at its own place) */
export const HI_CARD = Object.freeze({ box: Object.freeze({ x: 48, y: 348, w: 984, h: 792 }), nameY: 1200, namePx: 58 });
/** how far the frame is zoomed in on the tower's top (1 = the whole view's width) · the light added at night · where the top stands in the box */
export const SHOT_ZOOM = 1, SHOT_LIFT = 0.28, TOP_AT = 0.44;
/** THE FINISH's frame: the top a little LOWER in the box — THE MOTHERSHIP's gold beam pours into it from above (the ship itself hangs
 *  over the frame's view: a span that held it squeezed the gold-lit top under the number — tried, dropped) */
export const MADE_AT = 0.6;
/** the floor's size on the card (px of its 1080 — JAYWALK's) — in the GAME's numerals (Chakra Petch, the HUD's: Orbitron's zero is
 *  slashed; the mockup's is not) — a size down when a long number + FLOORS would pass the frame's edge */
export const BIG_PX = 250;
const NUMS = '"Chakra Petch", system-ui, sans-serif';
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
const BAND = 'rgba(7,6,11,0.72)';
/** the cause's size + its line height (the mockup: MISSED THE STACK on ONE line, MADE IT TO / THE MOTHERSHIP on two) */
export const CAUSE_PX = 58, CAUSE_LH = 66;

/** PURE: the card's words + numbers from a run's PUBLIC fields → the kit's card + HIGH RISE's own lines */
export function hiRunCard({ floor = 0, perfects = 0, cause = '', made = false, mode = 'solo', name = '' } = {}) {
  const f = Math.max(0, Math.floor(Number(floor) || 0)), p = Math.max(0, Math.floor(Number(perfects) || 0)), gold = !!made;
  const card = runCard({ game: 'highrise', title: 'HIGH RISE', mode: mode === 'match' ? 'MATCH' : 'SOLO', name, big: String(f), bigUnit: f === 1 ? 'FLOOR' : 'FLOORS', result: '', look: 'night', accent: gold ? GOLD : PINK });
  return { ...card, gold, line: gold ? END_WORDS.made : END_WORDS[cause] || 'THE TOWER STANDS', band: `${BANDS[bandAt(f)].name} · ${p} ${p === 1 ? 'PERFECT' : 'PERFECTS'}` };
}
/** PURE: the part of the frame the card shows — zoomed on the tower's top (its centre at TOP_AT of the box's height), never past an edge */
export function shotCrop(src, box, topX = 0.5, topY = 0.5, zoom = SHOT_ZOOM, at = TOP_AT) {
  let sw = src.width / zoom, sh = sw * box.h / box.w;
  if (sh > src.height) { sh = src.height; sw = sh * box.w / box.h; }
  if (sw > src.width) { sw = src.width; sh = sw * box.h / box.w; }
  const cx = (topX == null ? 0.5 : topX) * src.width, cy = (topY == null ? 0.5 : topY) * src.height;
  return { sx: Math.max(0, Math.min(src.width - sw, cx - sw / 2)), sy: Math.max(0, Math.min(src.height - sh, cy - sh * at)), sw, sh };
}
/** THE TOWER (core/marks.js — the game's own mark) as neon tubes: a 100-box scaled to `size` at (x, y) */
export function drawTower(c, x, y, size) {
  c.save(); c.translate(x, y); c.scale(size / 100, size / 100); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const t of MARKS.highrise.tubes) {
    const p = new Path2D(t.d);
    c.shadowColor = t.col; c.shadowBlur = 22; c.strokeStyle = t.col; c.lineWidth = 6; c.stroke(p);
    c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.stroke(p);
  }
  c.restore();
}
/** the cause on ≤ 2 lines of ≤ `max` px: split at the most even space */
export function wrap2(c, text, max) {
  if (c.measureText(text).width <= max) return [text];
  const w = text.split(' ');
  let best = [text], bw = Infinity;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(c.measureText(a).width, c.measureText(b).width); if (m < bw) { bw = m; best = [a, b]; } }
  return best;
}
/** the middle: THE RUN's FRAME (zoomed on the top, lifted by night) under the words, the floor + the tower over it — or, with no frame, the dark */
export function drawHiMiddle(c, box, card, shot) {
  const { x, y, w, h } = box, r = 30, acc = card.gold ? GOLD : PINK;
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
  if (shot && shot.canvas && shot.canvas.width > 0) {
    const src = shot.canvas, q = shotCrop(src, box, shot.topX, shot.topY, SHOT_ZOOM, shot.made && card.gold ? MADE_AT : TOP_AT), dx = x, dw = w;
    c.drawImage(src, q.sx, q.sy, q.sw, q.sh, dx, y, dw, h);
    // BRIGHTER by night (the picture screened over itself — no canvas filter: an old Safari has none); a day frame is bright already
    if (shot.look !== 'day') { c.globalCompositeOperation = 'screen'; c.globalAlpha = SHOT_LIFT; c.drawImage(src, q.sx, q.sy, q.sw, q.sh, dx, y, dw, h); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  } else { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#14102c'); g.addColorStop(1, '#090716'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  // the words read on any frame: a soft dark at the head + the foot — short, the scene stays the hero
  let g = c.createLinearGradient(0, y, 0, y + 210); g.addColorStop(0, 'rgba(7,6,11,0.8)'); g.addColorStop(1, 'rgba(7,6,11,0)'); c.fillStyle = g; c.fillRect(x, y, w, 210);
  g = c.createLinearGradient(0, y + h - 360, 0, y + h); g.addColorStop(0, 'rgba(7,6,11,0)'); g.addColorStop(0.42, 'rgba(7,6,11,0.6)'); g.addColorStop(1, 'rgba(7,6,11,0.92)'); c.fillStyle = g; c.fillRect(x, y + h - 360, w, 360);
  // THE CAUSE's DARK TAB hung from the frame's top-left (never a pill)
  c.font = `900 ${CAUSE_PX}px ${DISPLAY}`;
  const rows = card.line ? wrap2(c, card.line, w - 230) : [];
  if (rows.length) {
    const bw = Math.min(w - 196, Math.max(...rows.map(t => c.measureText(t).width)) + 36 + 34), bh = 84 + (rows.length - 1) * CAUSE_LH + 32;
    c.fillStyle = BAND; c.beginPath(); c.roundRect(x, y, bw, bh, [0, 0, 18, 0]); c.fill();
  }
  c.restore();
  // the frame's edge: ONE neon line in the accent (pink · gold)
  c.save(); c.strokeStyle = acc; c.lineWidth = 4; c.shadowColor = acc; c.shadowBlur = 22; c.beginPath(); c.roundRect(x, y, w, h, r); c.stroke(); c.restore();
  // HOW THE TOWER ENDED — ONCE: the big neon words (hot pink · gold)
  if (rows.length) {
    c.save(); c.textAlign = 'left'; c.font = `900 ${CAUSE_PX}px ${DISPLAY}`;
    const core = card.gold ? '#fff3c8' : '#ffe0f6';
    rows.forEach((t, i) => { c.shadowColor = acc; c.shadowBlur = 30; c.fillStyle = core; c.fillText(t, x + 36, y + 84 + i * CAUSE_LH); c.shadowBlur = 8; c.fillText(t, x + 36, y + 84 + i * CAUSE_LH); });
    c.restore();
  }
  // THE TOWER in the corner
  drawTower(c, x + w - 168, y + 22, 144);
  // the band + the perfects (lavender · gold), over the floor
  c.save(); c.textAlign = 'left'; c.font = `700 40px ${DISPLAY}`; c.fillStyle = card.gold ? '#ffd257' : LAVENDER; c.shadowColor = 'rgba(7,6,11,0.9)'; c.shadowBlur = 10;
  spacedText(c, card.band || '', x + 36, y + h - 250, 9, { maxW: w - 72 }); c.restore();
  // the floor: the game's big neon numerals — white-hot with a CYAN glow (gold when the tower made it) + FLOORS
  c.save(); c.textAlign = 'left';
  const big = card.big || '0', glow = card.gold ? GOLD : CYAN, unit = card.bigUnit || 'FLOORS';
  c.font = `800 52px ${DISPLAY}`;
  const uw = c.measureText(unit).width + unit.length * 12;
  let px = BIG_PX;
  while (px > 150 && 32 + numWidth(c, big, px, NUMS, 700) + 28 + uw > w - 28) px -= 10;
  c.font = `700 ${px}px ${NUMS}`;
  c.shadowColor = glow; c.shadowBlur = 46; c.fillStyle = card.gold ? '#fff4cf' : '#f2fdff'; drawNum(c, big, x + 32, y + h - 40, px, NUMS, 700);
  c.shadowBlur = 12; drawNum(c, big, x + 32, y + h - 40, px, NUMS, 700);
  const bw = numWidth(c, big, px, NUMS, 700);
  c.shadowBlur = 14; c.shadowColor = glow; c.font = `800 52px ${DISPLAY}`; c.fillStyle = card.gold ? '#ffe9a8' : '#c8f4ff'; spacedText(c, unit, x + 32 + bw + 28, y + h - 58, 12);
  c.restore();
}
/** the whole card for a run → a canvas (null: this phone can't). `run` = { floor, perfects, cause, made, mode, name } · `shot` = shot.js's */
export function drawHiCard(run, shot) {
  const card = hiRunCard(run);
  return drawRunCard(card, (c, box, k) => drawHiMiddle(c, box, k, shot), HI_CARD);
}

// ---- THE LINK (the picture goes up only at the player's SHARE; the share is the link alone) — JAYWALK's machinery
export const LINK_TRIES = 4, LINK_GAP_MS = 1200;
export const LINK_KEY = 'ns:shr:hi';   // ({ pid, h, url } — the last run card this phone uploaded: the same picture again shares that link)
const sleep = ms => new Promise(r => setTimeout(r, ms));
/** PURE: this player's run in the game's results (the host's rows: f floor · p perfects · w how it ended) */
export function runOf(game, uid) {
  const r = ((game && game.results) || {})[uid] || {};
  return { floor: Number(r.f) || 0, perfects: Number(r.p) || 0, cause: String(r.w || ''), made: r.w === 'made', mode: game && game.mode === 'solo' ? 'solo' : 'match' };
}
let held = null;   // { m, prep } — ONE match's share at a time on this phone
function prepRun(game, state) {
  const m = game && game.matchId, uid = state && state.uid, code = state && state.code;
  if (held && held.m === m) return held;
  const here = () => !!(live.game && live.game.matchId === m);
  // (BEHIND THE SWITCH: no upload once the server has said WOULD COUNT for this match — the picture itself goes out; the server refuses a
  //  run's card without its own counted result anyway: api/_lib/share-card.js)
  const upload = game && !game.unproven && code ? async half => {
    if (!here() || globalThis.__hiWould === m) return '';
    const png = await fitPng(half);
    if (!png) return '';
    const pid = (live.me && live.me.pid) || '', h = await blobHash(png).catch(() => '');
    let kept = null;
    try { kept = JSON.parse(localStorage.getItem(LINK_KEY) || 'null'); } catch { /* none */ }
    if (h && kept && kept.pid === pid && kept.h === h && typeof kept.url === 'string') return kept.url;
    const [{ api }, b64] = await Promise.all([lazyImport(import('../../profile/api.js'), '../../profile/api.js'), base64Of(png)]);
    for (let i = 0; i < LINK_TRIES; i++) {
      try {
        const r = await api('daily', { action: 'shareCard', games: ['highrise'], run: { room: code, m }, png: b64 });
        const url = r && r.path ? new URL(r.path, location.origin).href : '';
        if (url && h) { try { localStorage.setItem(LINK_KEY, JSON.stringify({ pid, h, url })); } catch { /* it uploads again next time */ } }
        return url;
      } catch (e) {
        if (!e || e.code !== 'no_run' || i === LINK_TRIES - 1 || !here() || globalThis.__hiWould === m) return '';
        await sleep(LINK_GAP_MS);
      }
    }
    return '';
  } : null;
  const me = (state && state.players && state.players[uid]) || {};
  const prep = prepShare(async () => {
    if (!here()) return null;
    const shot = shotFor(m), r = runOf(game, uid), judged = !!(((game && game.results) || {})[uid] || {}).w;
    // (THE CLOSE's REVIEW: the numbers are THE JUDGE's — the podium's + the counted result's — whenever it has spoken; the frame gives the
    //  picture, and its own numbers only for a run the judge has not answered)
    const run = shot && !judged ? { ...r, floor: shot.floor, perfects: shot.perfects, cause: shot.cause, made: shot.made } : r;
    return { cv: drawHiCard({ ...run, name: me.name }, shot), name: 'neon-speakeasy-high-rise.png', line: '', upload, onTap: true };
  });
  held = { m, prep };
  return held;
}
/** the end screen is up: the card is DRAWN (its PNG kept on the phone) — nothing goes up until SHARE */
export function warmShare(game, state) { try { prepRun(game, state).prep.warm(); } catch { /* the tap builds it */ } }
/** SHARE → 'shared' | 'ready' | 'none' | 'shown' | 'busy' | 'failed' — the LINK alone (uploaded at this tap, once); no link → the picture alone */
export function shareRun(game, state) { return prepRun(game, state).prep.send(); }
