// FREEFALL — THE SHARE CARD's DRAWING (F4B — docs/freefall.md "THE SHARE CARD"; split out of share.js in F5B so the TEST PAGE draws the
// same card: SHARE = THE PICTURE ONLY on both — send.js). 1080 × 1350, drawn ON THE PHONE from the run's PUBLIC numbers only, on the site's
// share kit (js/games/kit/share-run.js#drawRunCard — the ground, the middle's box, the name, THE FOOT):
//   · the head (the kit's `head` option — FREEFALL's own): THE LOGO (the opening's lettering, ≈ 580 px wide — the word is FREEFALL, ONE
//     word) + the mode line in TEAL: SOLO · MATCH · 2ND OF 4
//   · THE HERO FRAME (984 × 792 at 48, 348 — JAYWALK's + HIGH RISE S5's box), ONE teal neon edge: the run's STAGED frame (shot.js)
//   · the cause ONCE, in a dark tab hung from the frame's top-left (HIT THE RED · THE LIGHTS WENT OUT · TIME'S UP · YOU HIT THE BOTTOM)
//   · inside the frame's foot, over a darker fade: the FLOORS number, big (Chakra Petch — the game's numerals), white-hot with a CYAN glow,
//     FLOORS under it · beside it the deepest AREA reached (lavender) + the BLAZES count (fire orange — F5B: none at 0)
//   · the player's name under the frame · the kit's foot: ONE thin neon line + NEONSPEAKEASY.COM, big, white-hot in a pink glow (plain
//     lettering — NO pill)
//   · THE FINISH (YOU HIT THE BOTTOM) = GOLD: the frame's edge, the tab's words, the number.
// Pure canvas: nothing here asks a server, stores or counts anything (the test page loads it — tests/freefall-play.test.mjs).
import { runCard, drawRunCard, RUN_W } from '../kit/share-run.js';
import { spacedText, spacedWidth, shareFonts } from '../../daily/share.js';
import { drawNum, numWidth } from '../jaywalk/numerals.js';
import { END_WORDS, areaOf } from './logic.js';
import { SHOT_BOX } from './shot.js';

/** the colours: FREEFALL's hot pink + electric teal (title-05's) · the number's cyan glow · the area's lavender · the blazes' fire orange ·
 *  THE FINISH's gold */
export const PINK = '#ff4fa8', TEAL = '#27e0e6', CYAN = '#35e3ff', LAVENDER = '#cdbcff', FIRE = '#ff9a3c', FIRE_GLOW = '#ff5a1f', GOLD = '#ffc83c';
/** the card's own layout (JAYWALK's + HIGH RISE S5's): the frame as the hero + the name under it (the kit's foot follows at its own place) */
export const FF_CARD = Object.freeze({ box: Object.freeze({ x: 48, y: 348, w: SHOT_BOX.w, h: SHOT_BOX.h }), nameY: 1200, namePx: 58 });
/** the head: the logo's width + its top · the mode line's baseline + its size */
export const HEAD = Object.freeze({ logoW: 580, logoY: 4, modeY: 331, modePx: 46 });
/** the frame's lettering, px of the card's 1080 (÷ 3 = its size at 360 px wide — nothing under 46): the cause's size + line height · the
 *  number's size (a size down when a long number would crowd the area beside it) + its baseline above the frame's foot · FLOORS · the
 *  area + the blazes (their size, their line height, the baseline of the LAST line above the frame's foot) */
export const TYPE = Object.freeze({ causePx: 62, causeLh: 70, bigPx: 232, bigUp: 104, unitPx: 48, unitUp: 36, sidePx: 48, sideLh: 64, sideUp: 36 });
/** the light added to a NIGHT frame (the picture screened over itself — a dark scene must read on a small preview) */
export const SHOT_LIFT = 0.3;
/** THE DARKNESS on a card whose run ended in it (THE LIGHTS WENT OUT): on the phone the darkness is a layer OVER the canvas
 *  (css/freefall-play.css `.ff-dark` — the frame itself holds none of it), so the card lays the same dark round the ball: a pool of the
 *  last light (clear to `clear` of the radius), closed in from every side — rx / ry of the box, its middle `down` of the box's height
 *  under the ball, the look's own dark (the stylesheet's --ff-dk: night · day) */
// (F5A — THE LIGHTS WENT OUT = the ball with the dark edge CLOSING ABOVE IT: the dark comes down from the frame's top to `edge` of the
//  frame's height over the ball — a soft violet line of light along its foot, as the game's own edge — and the sides close in round it)
// (the review: at 360 px the lit room said nothing — the dark comes down to within about half a ball of the ball + in from both sides)
export const DARK = Object.freeze({ rx: 0.56, ry: 0.8, clear: 0.3, down: 0.1, a: 0.92, edge: 0.085, night: '3,0,10', day: '12,14,26' });
/** the area's line is wrapped only when it is over its room by more than this (a line a few px too long is drawn a little narrower) */
export const SIDE_FIT = 1.08;
const NUMS = '"Chakra Petch", system-ui, sans-serif';
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
const BAND = 'rgba(7,6,11,0.76)';
/** THE LOGO: the opening's lettering (title-05 — the SAME file the stage shows: already in the phone's cache) */
export const LOGO_REV = 1;   // (= night.js#FF_ART_REV — tests/freefall-share.test.mjs)
export const LOGO_URL = new URL(`../../../assets/freefall/title/lettering-1170.webp?v=${LOGO_REV}`, import.meta.url).href;
export const LOGO_WAIT_MS = 3000;

/** THE CARD's WORDS for an end — logic.js#END_WORDS (F5B: ONE wording for the finish everywhere — YOU HIT THE BOTTOM) */
export const CARD_WORDS = END_WORDS;
const whole = n => Math.max(0, Math.floor(Number(n) || 0));
/** PURE: 1 → 1ST · 2 → 2ND · 3 → 3RD · 4 → 4TH · 11 → 11TH · 22 → 22ND */
export function ordinal(n) {
  const v = whole(n), t = v % 100, u = v % 10;
  return `${v}${t >= 11 && t <= 13 ? 'TH' : u === 1 ? 'ST' : u === 2 ? 'ND' : u === 3 ? 'RD' : 'TH'}`;
}
/** PURE: the mode line — SOLO · MATCH · 2ND OF 4 (a match with no place yet: MATCH) · DAILY */
export function modeLine({ mode = 'solo', place = 0, of = 0 } = {}) {
  if (mode === 'match') return whole(place) > 0 && whole(of) > 1 ? `MATCH · ${ordinal(place)} OF ${whole(of)}` : 'MATCH';
  return mode === 'daily' ? 'DAILY' : 'SOLO';
}
/** PURE: the card's words + numbers from a run's PUBLIC fields → the kit's card + FREEFALL's own lines */
export function ffRunCard({ floor = 0, blazes = 0, cause = '', made = false, mode = 'solo', place = 0, of = 0, name = '' } = {}) {
  const f = whole(floor), b = whole(blazes), gold = !!made || cause === 'made';
  const card = runCard({ game: 'freefall', title: 'FREEFALL', mode: modeLine({ mode, place, of }), name, big: String(f), bigUnit: f === 1 ? 'FLOOR' : 'FLOORS', result: '', look: 'night', accent: gold ? GOLD : TEAL });
  const known = typeof cause === 'string' && Object.prototype.hasOwnProperty.call(CARD_WORDS, cause);
  return { ...card, gold, cause: gold ? 'made' : known ? cause : '', line: gold ? CARD_WORDS.made : known ? CARD_WORDS[cause] : 'THE RUN IS OVER', area: areaOf(f).name, blazes: b > 0 ? `${b} ${b === 1 ? 'BLAZE' : 'BLAZES'}` : '' };   // (F5B: "0 BLAZES" never shows — the area takes its line)
}
/** the logo as a decoded picture (null: it could not load in time — the head writes the word in its two neons instead) */
let logoP = null;
export function loadLogo(ms = LOGO_WAIT_MS) {
  return (logoP ||= new Promise(res => {
    const t = setTimeout(() => res(null), ms);
    try {
      const im = new Image();
      im.onload = () => { clearTimeout(t); res(im); };
      im.onerror = () => { clearTimeout(t); res(null); };
      im.src = LOGO_URL;
    } catch { clearTimeout(t); res(null); }
  }).then(im => { if (!im) logoP = null; return im; }));
}
/** words on ≤ 2 lines of ≤ `max` px (the context's font, `ls` px after every letter): split at the most even space */
export function wrap2(c, text, max, ls = 0) {
  const wd = t => spacedWidth(c, t, ls);
  if (wd(text) <= max) return [text];
  const w = text.split(' ');
  let best = [text], bw = Infinity;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(wd(a), wd(b)); if (m < bw) { bw = m; best = [a, b]; } }
  return best;
}
/** THE HEAD (the kit's `head`): the logo, centred, + the mode line in teal */
export function drawFfHead(c, card, logo) {
  const W = RUN_W;
  c.save();
  if (logo && logo.width > 0) {
    const w = HEAD.logoW, h = w * logo.height / logo.width;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(logo, (W - w) / 2, HEAD.logoY, w, h);
  } else {
    // (no picture: the word in its two neons — FREE hot pink, FALL electric teal, ONE word)
    c.font = `900 124px ${DISPLAY}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const a = c.measureText('FREE').width, b = c.measureText('FALL').width, x0 = (W - a - b) / 2;
    for (const [t, x, col] of [['FREE', x0, PINK], ['FALL', x0 + a, TEAL]]) { c.shadowColor = col; c.shadowBlur = 40; c.fillStyle = col; c.fillText(t, x, 200); c.shadowBlur = 10; c.fillStyle = '#fff6fb'; c.fillText(t, x, 200); }
  }
  c.restore();
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `900 ${HEAD.modePx}px ${DISPLAY}`;
  c.shadowColor = TEAL; c.shadowBlur = 20; c.fillStyle = TEAL; spacedText(c, card.mode || 'SOLO', W / 2 + 4, HEAD.modeY, 8, { maxW: W - 160 });
  c.shadowBlur = 0; c.fillStyle = '#8cf6f8'; spacedText(c, card.mode || 'SOLO', W / 2 + 4, HEAD.modeY, 8, { maxW: W - 160 });
  c.restore();
}
/** the middle: THE RUN's FRAME (lifted by night) under the words — the cause's tab, the floors, the area + the blazes — or, with no
 *  frame on this phone (a refresh on the podium), the night's dark */
export function drawFfMiddle(c, box, card, shot) {
  const { x, y, w, h } = box, r = 30, gold = !!card.gold, acc = gold ? GOLD : TEAL, T = TYPE;
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
  if (shot && shot.canvas && shot.canvas.width > 0) {
    // (the frame was taken at the box's own shape — shot.js#SHOT_BOX; another size is fitted to cover)
    const src = shot.canvas, k = Math.max(w / src.width, h / src.height), dw = src.width * k, dh = src.height * k, dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(src, dx, dy, dw, dh);
    // BRIGHTER by night (the picture screened over itself — no canvas filter: an old Safari has none); a day frame is bright already
    // (F5A: THE BOTTOM's gold frame is NOT lifted — the night gold card was a white blob)
    if (shot.look !== 'day' && !gold) { c.globalCompositeOperation = 'screen'; c.globalAlpha = SHOT_LIFT; c.drawImage(src, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  } else { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#14102c'); g.addColorStop(1, '#090716'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  // THE LIGHTS WENT OUT: the darkness itself (DARK) — the ball in the last pool of light
  if (card.cause === 'dark') {
    const day = !!shot && shot.look === 'day', col = day ? DARK.day : DARK.night, rx = w * DARK.rx;
    c.save(); c.translate(x + w * (shot && shot.ballX != null ? shot.ballX : 0.5), y + h * ((shot && shot.ballY != null ? shot.ballY : 0.4) + DARK.down)); c.scale(1, h * DARK.ry / rx);
    const d = c.createRadialGradient(0, 0, rx * DARK.clear, 0, 0, rx); d.addColorStop(0, `rgba(${col},0)`); d.addColorStop(1, `rgba(${col},${DARK.a})`);
    c.fillStyle = d; c.fillRect(-2 * w, -4 * h, 4 * w, 8 * h); c.restore();
    // … the edge itself: the dark down from the top to just above the ball, a soft line of light along its foot
    const by = (shot && shot.ballY != null ? shot.ballY : 0.4), ey = y + h * Math.max(0.12, by - DARK.edge), soft = h * 0.11;
    const e = c.createLinearGradient(0, ey - soft, 0, ey); e.addColorStop(0, `rgba(${col},0.93)`); e.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = `rgba(${col},0.93)`; c.fillRect(x, y, w, Math.max(0, ey - soft - y)); c.fillStyle = e; c.fillRect(x, ey - soft, w, soft);
    const l = c.createLinearGradient(0, ey - 26, 0, ey + 10); l.addColorStop(0, 'rgba(150,110,255,0)'); l.addColorStop(0.6, day ? 'rgba(170,190,255,0.3)' : 'rgba(150,110,255,0.42)'); l.addColorStop(1, 'rgba(150,110,255,0)');
    c.fillStyle = l; c.fillRect(x, ey - 26, w, 36);
  }
  // the words read on any frame: a soft dark at the head, a DARKER fade behind the foot's numbers
  let g = c.createLinearGradient(0, y, 0, y + 220); g.addColorStop(0, 'rgba(7,6,11,0.72)'); g.addColorStop(1, 'rgba(7,6,11,0)'); c.fillStyle = g; c.fillRect(x, y, w, 220);
  g = c.createLinearGradient(0, y + h - 430, 0, y + h); g.addColorStop(0, 'rgba(5,4,10,0)'); g.addColorStop(0.36, 'rgba(5,4,10,0.7)'); g.addColorStop(0.7, 'rgba(5,4,10,0.9)'); g.addColorStop(1, 'rgba(5,4,10,0.96)'); c.fillStyle = g; c.fillRect(x, y + h - 430, w, 430);
  // THE CAUSE's DARK TAB hung from the frame's top-left (square to the frame, ONE soft corner — never a pill)
  c.font = `900 ${T.causePx}px ${DISPLAY}`;
  const rows = card.line ? wrap2(c, card.line, w - 330, 2) : [];
  if (rows.length) {
    const bw = Math.min(w - 120, Math.max(...rows.map(t => spacedWidth(c, t, 2))) + 36 + 36), bh = 88 + (rows.length - 1) * T.causeLh + 32;
    c.fillStyle = BAND; c.beginPath(); c.roundRect(x, y, bw, bh, [0, 0, 18, 0]); c.fill();
  }
  c.restore();
  // the frame's edge: ONE neon line (teal · gold) — the kit's own rounded window
  c.save(); c.strokeStyle = acc; c.lineWidth = 4; c.shadowColor = acc; c.shadowBlur = 22; c.beginPath(); c.roundRect(x, y, w, h, r); c.stroke(); c.restore();
  // HOW THE RUN ENDED — ONCE: big neon words in FREEFALL's teal (gold for the finish; NEVER red — red is danger on the tower only)
  if (rows.length) {
    c.save(); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = `900 ${T.causePx}px ${DISPLAY}`;
    const core = gold ? '#fff3c8' : '#e2feff';
    rows.forEach((t, i) => { c.shadowColor = acc; c.shadowBlur = 30; c.fillStyle = core; spacedText(c, t, x + 36, y + 88 + i * T.causeLh, 2, { maxW: w - 192 }); c.shadowBlur = 8; spacedText(c, t, x + 36, y + 88 + i * T.causeLh, 2, { maxW: w - 192 }); });
    c.restore();
  }
  // THE FLOORS: the game's big numerals — white-hot, a CYAN glow (gold when the run hit the bottom) — with FLOORS under them
  c.save(); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; if ('letterSpacing' in c) c.letterSpacing = '0px';
  const big = card.big || '0', glow = gold ? GOLD : CYAN, unit = card.bigUnit || 'FLOORS', x0 = x + 36, rx = x + w - 36;
  let px = T.bigPx;
  const nw = q => { c.font = `700 ${q}px ${NUMS}`; return numWidth(c, big, q, NUMS, 700); };
  while (px > 150 && nw(px) > w * 0.5) px -= 10;
  const bw = nw(px), by = y + h - T.bigUp;
  c.shadowColor = glow; c.shadowBlur = 48; c.fillStyle = gold ? '#fff4cf' : '#f2feff'; drawNum(c, big, x0, by, px, NUMS, 700);
  c.shadowBlur = 14; drawNum(c, big, x0, by, px, NUMS, 700);
  c.font = `900 ${T.unitPx}px ${DISPLAY}`; c.shadowBlur = 16; c.fillStyle = gold ? '#ffe9a8' : '#bff5ff'; spacedText(c, unit, x0 + 4, y + h - T.unitUp, 10);
  c.restore();
  // beside them, from the frame's right edge: the deepest AREA reached (lavender, ≤ 2 lines) over the BLAZES (fire orange)
  c.save(); c.textAlign = 'right'; c.textBaseline = 'alphabetic'; c.font = `900 ${T.sidePx}px ${DISPLAY}`;
  const room = rx - (x0 + bw + 48), ls = 3, area = wrap2(c, card.area || '', room * SIDE_FIT, ls), sy = y + h - T.sideUp, bz = card.blazes ? 1 : 0;
  c.shadowColor = 'rgba(5,4,10,0.95)'; c.shadowBlur = 12; c.fillStyle = LAVENDER;
  area.forEach((t, i) => spacedText(c, t, rx + ls, sy - (area.length - i - 1 + bz) * T.sideLh, ls, { maxW: room }));   // (no blazes: the area comes down onto their line)
  if (bz) {
    c.shadowColor = FIRE_GLOW; c.shadowBlur = 20; c.fillStyle = FIRE; spacedText(c, card.blazes, rx + ls, sy, ls, { maxW: room });
    c.shadowBlur = 0; spacedText(c, card.blazes, rx + ls, sy, ls, { maxW: room });
  }
  c.restore();
  card.row = { px, x0, bw, room, lines: area.length, tab: rows.length };   // (where the foot's pieces stand — the share check reads it)
}
/** the whole card for a run → a canvas (null: this phone can't). `run` = { floor, blazes, cause, made, mode, place, of, name } · `shot` =
 *  shot.js's frame (or null) · `logo` = loadLogo()'s picture (or null) */
export function drawFfCard(run, shot = null, logo = null) {
  const card = ffRunCard(run);
  const cv = drawRunCard(card, (c, box, k) => drawFfMiddle(c, box, k, shot), { ...FF_CARD, head: (c, k) => drawFfHead(c, k, logo) });
  if (cv) cv.ffRow = card.row;
  return cv;
}


/** F5B — the card READY TO SEND: the fonts in (≤ 2.5 s), the logo (≤ 3 s), then drawn → the canvas (null: this phone can't) */
export async function cardFor(run, shot = null) {
  await shareFonts();
  const logo = await loadLogo();
  return drawFfCard(run, shot, logo);
}
