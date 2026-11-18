// JAYWALK — THE SHARE IMAGE (H4 — the owner, Nov 16: the player's REAL run; docs/jaywalk.md "THE SHARE IMAGE"). On the site's share kit
// (js/games/kit/share-run.js — the sign, the game, the middle, the name, the site; drawn ON THE PHONE, built from the result's PUBLIC
// fields only). THE MIDDLE = the game frame frozen a beat after the player went out (the kid + what got him — shot.js: taken by the view,
// kept on this phone until the next run). No frame on this phone (a refresh on the podium) → the lanes + the words + the icon on the
// night's dark. A solo run + a match. Lazy (index.js#shareRun · victory.js).
// H4B's ADD-ON (the owner, Nov 16 4:33 pm) — THE SHARE = THE PICTURE ONLY:
//   · THE SHARE SENDS ONLY THE LINK (navigator.share({ url }) — the site's rule from FIXES R1): no "JAYWALK · 143 LANES" text, no site
//     line. The link's preview IS this card (its og:image) and a tap on it opens neonspeakeasy.com. The dailies' own machinery
//     (js/daily/share.js#prepShare → sendReady · api/_lib/share-card.js): THE CARD IS BUILT BEFORE THE TAP — the end screen warms it;
//     BEFORE THE FLIP (the owner, Nov 17 — the review's storage finding): it UPLOADS ONLY ON SHARE — the half-size PNG goes up at the
//     player's first SHARE tap, once (prepShare's onTap: a spent tap → PREPARING… → SHARE, one more tap); the server takes it only from a
//     player its own COUNTED result of this match names; one run card a player a day, replaced in place, kept 7 days; the same picture
//     again uploads nothing.
//     No link (an uncounted run, no signal, a desktop) → the picture itself goes out — still no text.
//   · THE CARD: THE FRAME IS THE HERO — larger (the kit's `box` option: 984 × 792 of the card's 1080 × 1350), zoomed on the kid + what
//     got him, brighter; the cause line ONCE (the big one in the frame — the result line under the name is gone); the lanes in the big
//     neon numerals, THE SIGNAL, the name, neonspeakeasy.com stay. Reads as a small iMessage preview.
import { runCard, drawRunCard } from '../kit/share-run.js';
import { spacedText, prepShare, blobHash, base64Of } from '../../daily/share.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { state as live } from '../../store.js';
import { MARKS } from '../../core/marks.js';
import { ACCENT } from './meta.js';
import { shotFor } from './shot.js';
import { endOf } from './victory.js';
import { drawNum, numWidth } from './numerals.js';

/** PURE: the card's inputs — this player's lanes + their display name. No result line: the cause is said ONCE, by the frame's own words */
export function jwRunCard(game, { uid, name }) {
  const lanes = Math.max(0, Math.floor(Number((((game && game.results) || {})[uid] || {}).l) || 0)), unit = lanes === 1 ? 'LANE' : 'LANES';
  return runCard({ game: 'jaywalk', title: 'JAYWALK', mode: game && game.mode === 'solo' ? 'SOLO' : '', name, big: lanes.toLocaleString('en-US'), bigUnit: unit, result: '', look: 'night', accent: ACCENT });
}
/** THE CARD's own layout: the frame as the hero + the name under it (the kit's foot follows at its own place) */
export const JW_CARD = Object.freeze({ box: Object.freeze({ x: 48, y: 348, w: 984, h: 792 }), nameY: 1200, namePx: 58 });
/** how far the frame is zoomed in on the kid (1 = the whole view's width) + how much light is added to it (a night scene on a small preview) */
export const SHOT_ZOOM = 1.12, SHOT_LIFT = 0.3;
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
/** THE SIGNAL, drawn as neon tubes (core/marks.js — the game's own mark): a 100-box scaled to `size` at (x, y) */
export function drawSignal(c, x, y, size) {
  c.save(); c.translate(x, y); c.scale(size / 100, size / 100); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const t of MARKS.jaywalk.tubes) {
    const p = new Path2D(t.d);
    c.shadowColor = t.col; c.shadowBlur = 22; c.strokeStyle = t.col; c.lineWidth = 7; c.stroke(p);
    c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,0.78)'; c.lineWidth = 2.2; c.stroke(p);
  }
  c.restore();
}
/** the cause line on ≤ 2 lines of ≤ `max` px: split at the middle space when one line is too long */
function wrap2(c, text, max) {
  if (c.measureText(text).width <= max) return [text];
  const w = text.split(' ');
  let best = [text], bw = Infinity;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(c.measureText(a).width, c.measureText(b).width); if (m < bw) { bw = m; best = [a, b]; } }
  return best;
}
/** how far above the kid the picture is centred (of its height): what got him is up the lane · THE BLACKOUT: far more — everything
 *  behind him is black, the lit lanes are the picture */
export const SHOT_UP = 0.1, SHOT_UP_WALL = 0.34;
/** PURE: the part of the frame the card shows — zoomed on the kid (`up` of its height above him), never past an edge
 *  → { sx, sy, sw, sh } in the frame's own pixels */
export function shotCrop(src, box, kidX = 0.5, kidY = 0.62, zoom = SHOT_ZOOM, up = SHOT_UP) {
  let sw = src.width / zoom, sh = sw * box.h / box.w;
  if (sh > src.height) { sh = src.height; sw = sh * box.w / box.h; }
  if (sw > src.width) { sw = src.width; sh = sw * box.h / box.w; }
  const cx = (kidX == null ? 0.5 : kidX) * src.width, cy = (kidY == null ? 0.62 : kidY) * src.height - sh * up;
  return { sx: Math.max(0, Math.min(src.width - sw, cx - sw / 2)), sy: Math.max(0, Math.min(src.height - sh, cy - sh / 2)), sw, sh };
}
/** THE CAUSE LINE's band (THE POLISH PASS): the night's ink, translucent — the scene still shows through, the words always read */
export const BAND = 'rgba(7,6,11,0.72)';
/** the big lanes' size on the card (px of its 1080) */
export const BIG_PX = 236;
/** the middle: THE RUN's FRAME (zoomed on the kid, lifted) under the words, the lanes + the icon over it — or, with no frame, the dark */
export function drawRunMiddle(c, box, card, shot) {
  const { x, y, w, h } = box, r = 30;
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
  if (shot && shot.canvas && shot.canvas.width > 0) {
    const src = shot.canvas, q = shotCrop(src, box, shot.kidX, shot.kidY, SHOT_ZOOM, shot.up == null ? SHOT_UP : shot.up);
    c.drawImage(src, q.sx, q.sy, q.sw, q.sh, x, y, w, h);
    // BRIGHTER: the same picture screened over itself (a night scene reads on a thumbnail; no canvas filter — an old Safari has none)
    c.globalCompositeOperation = 'screen'; c.globalAlpha = SHOT_LIFT; c.drawImage(src, q.sx, q.sy, q.sw, q.sh, x, y, w, h);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  } else { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#14102c'); g.addColorStop(1, '#090716'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  // the words read on any frame: a soft dark at the head + the foot — short, so the scene stays the hero
  let g = c.createLinearGradient(0, y, 0, y + 210); g.addColorStop(0, 'rgba(7,6,11,0.86)'); g.addColorStop(1, 'rgba(7,6,11,0)'); c.fillStyle = g; c.fillRect(x, y, w, 210);
  g = c.createLinearGradient(0, y + h - 270, 0, y + h); g.addColorStop(0, 'rgba(7,6,11,0)'); g.addColorStop(1, 'rgba(7,6,11,0.88)'); c.fillStyle = g; c.fillRect(x, y + h - 270, w, 270);
  // THE POLISH PASS (the owner, Nov 18): THE CAUSE LINE's DARK BAND — the words read over the brightest frame (the day river, the fog) at
  // link-preview size: a dark translucent tab hung from the frame's top-left behind the words (the frame's own corner at its top, a small
  // corner at its foot — the house style, never a pill), the same in both looks
  const line = String((shot && shot.line) || card.line || '').toUpperCase();
  c.font = `900 66px ${DISPLAY}`;
  const rows = line ? wrap2(c, line, w - 210) : [];
  if (rows.length) {
    const bw = Math.min(w - 186, Math.max(...rows.map(t => c.measureText(t).width)) + 36 + 34), bh = 92 + (rows.length - 1) * 74 + 34;
    c.fillStyle = BAND; c.beginPath(); c.roundRect(x, y, bw, bh, [0, 0, 18, 0]); c.fill();
  }
  c.restore();
  // the frame's edge: one neon line (the kit's own rounded window — never a pill)
  c.save(); c.strokeStyle = card.accent; c.lineWidth = 4; c.shadowColor = card.accent; c.shadowBlur = 22; c.beginPath(); c.roundRect(x, y, w, h, r); c.stroke(); c.restore();
  // HOW THEY WENT OUT — ONCE: the big neon words at the frame's head
  if (rows.length) {
    c.save(); c.textAlign = 'left'; c.font = `900 66px ${DISPLAY}`;
    rows.forEach((t, i) => { c.shadowColor = card.accent; c.shadowBlur = 32; c.fillStyle = '#fff3fb'; c.fillText(t, x + 36, y + 92 + i * 74); c.shadowBlur = 8; c.fillText(t, x + 36, y + 92 + i * 74); });
    c.restore();
  }
  // THE SIGNAL in the corner
  drawSignal(c, x + w - 168, y + 24, 144);
  // the lanes: the game's big neon numerals at the foot
  // (H5A's add-on — THE BIG NUMERALS: numerals.js — room between the digits + a 1 with a base foot: "172" never reads "N2")
  c.save(); c.textAlign = 'left'; c.font = `900 ${BIG_PX}px ${DISPLAY}`;
  const big = card.big || '0';
  c.shadowColor = card.accent; c.shadowBlur = 46; c.fillStyle = '#fff3fb'; drawNum(c, big, x + 32, y + h - 42, BIG_PX, DISPLAY, 900);
  c.shadowBlur = 12; drawNum(c, big, x + 32, y + h - 42, BIG_PX, DISPLAY, 900);
  const bw = numWidth(c, big, BIG_PX, DISPLAY, 900);
  c.shadowBlur = 0; c.font = `800 52px ${DISPLAY}`; c.fillStyle = '#ffd6f0'; spacedText(c, card.bigUnit || 'LANES', x + 32 + bw + 28, y + h - 52, 12);
  c.restore();
}
/** the whole card for this player's run on this phone → a canvas (null: this phone can't) */
export function drawJwCard(game, { uid, name, code }) {
  const held0 = shotFor(game && game.matchId), E = endOf(game, uid, code);
  const wall = ((((game && game.results) || {})[uid]) || {}).w === 'wall';   // (THE LIGHTS WENT OUT: the lit lanes are the picture, the dark only its foot)
  const shot = held0 && wall ? { ...held0, up: SHOT_UP_WALL } : held0;
  const card = { ...jwRunCard(game, { uid, name }), line: (shot && shot.line) || E.line };
  return drawRunCard(card, (c, box, k) => drawRunMiddle(c, box, k, shot), JW_CARD);
}

// ---- THE LINK (BEFORE THE FLIP: the picture goes up only at the player's SHARE; the share is the link alone)
/** the server's count of the run lands a moment after the podium: the upload is tried this often, this far apart */
export const LINK_TRIES = 4, LINK_GAP_MS = 1200;
export const LINK_KEY = 'ns:shr:jw';   // ({ pid, h, url } — the last run card this phone uploaded: the same picture again shares that link)
/** the link's picture is kept under this (the server's cap is 400 KB — a game frame is a heavy PNG; the dailies' cards are 79–246 KB) */
export const LINK_MAX = 300 * 1024, LINK_HARD = 390 * 1024;
/** PURE: a colour channel on `bits` bits (its high bits repeated below — white stays white) */
export const quant = (v, bits) => ((v >> (8 - bits)) << (8 - bits)) | (v >> bits);
/** a picture over LINK_MAX is re-encoded on 6, then 5 bits a channel (the eye can't tell on a link preview; the PNG is a third of the size)
 *  → the blob to upload, or null (still over the server's cap: no link — the picture itself goes out) */
export async function fitPng(png) {
  if (!png || png.size <= LINK_MAX) return png || null;
  try {
    const bmp = await createImageBitmap(png), cv = document.createElement('canvas');
    cv.width = bmp.width; cv.height = bmp.height;
    const c = ctx2d(cv);
    c.drawImage(bmp, 0, 0); if (bmp.close) bmp.close();
    const src = c.getImageData(0, 0, cv.width, cv.height);
    for (const bits of [6, 5]) {
      const im = new ImageData(new Uint8ClampedArray(src.data), cv.width, cv.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) { d[i] = quant(d[i], bits); d[i + 1] = quant(d[i + 1], bits); d[i + 2] = quant(d[i + 2], bits); d[i + 3] = 255; }
      c.putImageData(im, 0, 0);
      const b = await new Promise(r => { try { cv.toBlob(r, 'image/png'); } catch { r(null); } });
      if (b && b.size <= LINK_MAX) { cv.width = cv.height = 0; return b; }
    }
    cv.width = cv.height = 0;
  } catch { /* an old WebView: as it is, if it fits */ }
  return png.size <= LINK_HARD ? png : null;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let held = null;   // { m, prep } — ONE match's share at a time on this phone
function prepRun(game, state) {
  const m = game && game.matchId, uid = state && state.uid, code = state && state.code;
  if (held && held.m === m) return held;
  const here = () => !!(live.game && live.game.matchId === m);
  const upload = game && !game.unproven && code ? async half => {
    if (!here()) return '';
    const png = await fitPng(half);
    if (!png) return '';
    const pid = (live.me && live.me.pid) || '', h = await blobHash(png).catch(() => '');
    let kept = null;
    try { kept = JSON.parse(localStorage.getItem(LINK_KEY) || 'null'); } catch { /* none */ }
    if (h && kept && kept.pid === pid && kept.h === h && typeof kept.url === 'string') return kept.url;
    const [{ api }, b64] = await Promise.all([lazyImport(import('../../profile/api.js'), '../../profile/api.js'), base64Of(png)]);
    for (let i = 0; i < LINK_TRIES; i++) {
      try {
        const r = await api('daily', { action: 'shareCard', games: ['jaywalk'], run: { room: code, m }, png: b64 });
        const url = r && r.path ? new URL(r.path, location.origin).href : '';
        if (url && h) { try { localStorage.setItem(LINK_KEY, JSON.stringify({ pid, h, url })); } catch { /* it uploads again next time */ } }
        return url;
      } catch (e) {
        // (the run is not counted YET — its report lands a moment after the podium: once more; anything else = no link, the picture goes out)
        if (!e || e.code !== 'no_run' || i === LINK_TRIES - 1 || !here()) return '';
        await sleep(LINK_GAP_MS);
      }
    }
    return '';
  } : null;
  const me = (state && state.players && state.players[uid]) || {};
  // (a build that would land in the NEXT run — PLAY AGAIN tapped while the fonts were still coming — is dropped: never a hitch mid-hop)
  const prep = prepShare(async () => (here() ? { cv: drawJwCard(game, { uid, name: me.name, code }), name: 'neon-speakeasy-jaywalk.png', line: '', upload, onTap: true } : null));
  held = { m, prep };
  return held;
}
/** the end screen is up: the card is DRAWN (its PNG kept on the phone) — nothing goes up until SHARE */
export function warmShare(game, state) { try { prepRun(game, state).prep.warm(); } catch { /* the tap builds it */ } }
/** SHARE MY RUN → 'shared' | 'ready' (the link made, the tap spent: SHARE again) | 'none' | 'shown' | 'busy' | 'failed' — the LINK alone (its
 *  preview is the card; uploaded at this tap, once); no link → the picture alone */
export function shareRun(game, state) {
  return prepRun(game, state).prep.send();
}
