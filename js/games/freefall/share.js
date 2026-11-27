// FREEFALL — THE SHARE CARD + SHARE (F4B — the owner's approved spec, Nov 26: docs/freefall.md "THE SHARE CARD"; HIGH RISE S5's share
// image is the pattern — the run's REAL end frame as the hero, on the site's share kit: js/games/kit/share-run.js#drawRunCard — the ground,
// the middle's box, the name, THE FOOT). 1080 × 1350, drawn ON THE PHONE from the run's PUBLIC numbers only:
//   · the head (the kit's `head` option — FREEFALL's own): THE LOGO (the opening's lettering, ≈ 580 px wide — the word is FREEFALL, ONE
//     word) + the mode line in TEAL: SOLO · MATCH · 2ND OF 4
//   · THE HERO FRAME (984 × 792 at 48, 348 — JAYWALK's + HIGH RISE S5's box), ONE teal neon edge: the REAL frame of the run's end (shot.js
//     — the red's burst · the darkness on the ball · the seabed's impact · the bell), lifted a little by night
//   · the cause ONCE, in a dark tab hung from the frame's top-left (HIT THE RED · THE LIGHTS WENT OUT · TIME'S UP · YOU HIT THE BOTTOM)
//   · inside the frame's foot, over a darker fade: the FLOORS number, big (Chakra Petch — the game's numerals), white-hot with a CYAN glow,
//     FLOORS under it · beside it the deepest AREA reached (lavender) + the BLAZES count (fire orange)
//   · the player's name under the frame · the kit's foot: ONE thin neon line + NEONSPEAKEASY.COM, big, white-hot in a pink glow (plain
//     lettering — NO pill)
//   · THE FINISH (YOU HIT THE BOTTOM) = GOLD: the frame's edge, the tab's words, the number.
// THE SHARE = THE LINK ALONE (JAYWALK H4B's machinery — navigator.share({ url }), its preview = this card): the card is DRAWN while the end
// screen is read (warmShare), uploaded only at the first SHARE tap (prepShare's onTap), fitted under the server's cap (fitPng). BEHIND THE
// SWITCH: the server takes a run's card only with its own COUNTED result (api/_lib/share-card.js#RUN_GAMES) — with FREEFALL_COUNTS off
// there is none, so the phone asks nothing once the server has said WOULD COUNT (the end screen's flag globalThis.__ffWould, or the
// report's own answer — profile/queue.js) and THE PICTURE ALONE goes out (no link, no text). Lazy (index.js#shareRun): the test page
// never loads this module.
import { runCard, drawRunCard, fitPng, RUN_W } from '../kit/share-run.js';
import { spacedText, spacedWidth, prepShare, blobHash, base64Of } from '../../daily/share.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { state as live } from '../../store.js';
import { drawNum, numWidth } from '../jaywalk/numerals.js';
import { END_WORDS, areaOf, gameStandings, seedOf } from './logic.js';
import { shotFor, SHOT_BOX } from './shot.js';

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
export const DARK = Object.freeze({ rx: 0.6, ry: 0.78, clear: 0.26, down: 0.08, a: 0.95, night: '3,0,10', day: '12,14,26' });
/** the area's line is wrapped only when it is over its room by more than this (a line a few px too long is drawn a little narrower) */
export const SIDE_FIT = 1.08;
const NUMS = '"Chakra Petch", system-ui, sans-serif';
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
const BAND = 'rgba(7,6,11,0.76)';
/** THE LOGO: the opening's lettering (title-05 — the SAME file the stage shows: already in the phone's cache) */
export const LOGO_REV = 1;   // (= night.js#FF_ART_REV — tests/freefall-share.test.mjs)
export const LOGO_URL = new URL(`../../../assets/freefall/title/lettering-1170.webp?v=${LOGO_REV}`, import.meta.url).href;
export const LOGO_WAIT_MS = 3000;

/** THE CARD's WORDS for an end — logic.js#END_WORDS, but THE FINISH reads as its gold band does (stage.js#BOTTOM_WORDS) */
export const CARD_WORDS = Object.freeze({ ...END_WORDS, made: 'YOU HIT THE BOTTOM' });
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
  return { ...card, gold, cause: gold ? 'made' : known ? cause : '', line: gold ? CARD_WORDS.made : known ? CARD_WORDS[cause] : 'THE RUN IS OVER', area: areaOf(f).name, blazes: `${b} ${b === 1 ? 'BLAZE' : 'BLAZES'}` };
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
    if (shot.look !== 'day') { c.globalCompositeOperation = 'screen'; c.globalAlpha = SHOT_LIFT; c.drawImage(src, dx, dy, dw, dh); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  } else { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#14102c'); g.addColorStop(1, '#090716'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  // THE LIGHTS WENT OUT: the darkness itself (DARK) — the ball in the last pool of light
  if (card.cause === 'dark') {
    const day = !!shot && shot.look === 'day', col = day ? DARK.day : DARK.night, rx = w * DARK.rx;
    c.save(); c.translate(x + w * (shot && shot.ballX != null ? shot.ballX : 0.5), y + h * ((shot && shot.ballY != null ? shot.ballY : 0.4) + DARK.down)); c.scale(1, h * DARK.ry / rx);
    const d = c.createRadialGradient(0, 0, rx * DARK.clear, 0, 0, rx); d.addColorStop(0, `rgba(${col},0)`); d.addColorStop(1, `rgba(${col},${DARK.a})`);
    c.fillStyle = d; c.fillRect(-2 * w, -4 * h, 4 * w, 8 * h); c.restore();
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
  const room = rx - (x0 + bw + 48), ls = 3, area = wrap2(c, card.area || '', room * SIDE_FIT, ls), sy = y + h - T.sideUp;
  c.shadowColor = 'rgba(5,4,10,0.95)'; c.shadowBlur = 12; c.fillStyle = LAVENDER;
  area.forEach((t, i) => spacedText(c, t, rx + ls, sy - (area.length - i) * T.sideLh, ls, { maxW: room }));
  c.shadowColor = FIRE_GLOW; c.shadowBlur = 20; c.fillStyle = FIRE; spacedText(c, card.blazes || '', rx + ls, sy, ls, { maxW: room });
  c.shadowBlur = 0; spacedText(c, card.blazes || '', rx + ls, sy, ls, { maxW: room });
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

// ---- THE LINK (the picture goes up only at the player's SHARE; the share is the link alone) — JAYWALK's + HIGH RISE's machinery
export const LINK_TRIES = 4, LINK_GAP_MS = 1200;
export const LINK_KEY = 'ns:shr:ff';   // ({ pid, h, url } — the last run card this phone uploaded: the same picture again shares that link)
const sleep = ms => new Promise(r => setTimeout(r, ms));
/** PURE: this player's run in the game's results — THE JUDGE's rows (director.js#scoreNode: f floors · bl blazes · w how it ended · go)
 *  + the MATCH line's numbers: their place in the game's standings, of how many players */
export function runOf(game, uid) {
  const r = ((game && game.results) || {})[uid] || {}, solo = !game || game.mode === 'solo';
  const st = solo ? [] : gameStandings(game), me = st.find(s => s.uid === uid);
  return { floor: whole(r.f), blazes: whole(r.bl), cause: String(r.w || ''), made: r.w === 'made', mode: solo ? 'solo' : 'match', place: me ? me.rank : 0, of: st.length, go: Number(r.go) || 0 };
}
let held = null;   // { m, prep } — ONE match's share at a time on this phone
function prepRun(game, state) {
  const m = game && game.matchId, uid = state && state.uid, code = state && state.code;
  if (held && held.m === m) return held;
  const here = () => !!(live.game && live.game.matchId === m);
  // BEHIND THE SWITCH: no upload once the server has said WOULD COUNT for this match (the end screen's flag — or the report's own answer,
  // read here: the share never depends on the end screen's wiring) — the picture itself goes out; the server refuses a run's card
  // without its own counted result anyway (api/_lib/share-card.js)
  let Q = null;
  const would = () => {
    if (globalThis.__ffWould === m) return true;
    try { const o = Q && Q.outcomeFor(Q.matchKey(code, m)); return !!(o && o.would); } catch { return false; }
  };
  const upload = game && !game.unproven && code ? async half => {
    if (!here() || globalThis.__ffWould === m) return '';
    if (!Q) Q = await lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').catch(() => null);
    if (would()) return '';
    const png = await fitPng(half);
    if (!png) return '';
    const pid = (live.me && live.me.pid) || '', h = await blobHash(png).catch(() => '');
    let kept = null;
    try { kept = JSON.parse(localStorage.getItem(LINK_KEY) || 'null'); } catch { /* none */ }
    if (h && kept && kept.pid === pid && kept.h === h && typeof kept.url === 'string') return kept.url;
    const [{ api }, b64] = await Promise.all([lazyImport(import('../../profile/api.js'), '../../profile/api.js'), base64Of(png)]);
    for (let i = 0; i < LINK_TRIES; i++) {
      try {
        const r = await api('daily', { action: 'shareCard', games: ['freefall'], run: { room: code, m }, png: b64 });
        const url = r && r.path ? new URL(r.path, location.origin).href : '';
        if (url && h) { try { localStorage.setItem(LINK_KEY, JSON.stringify({ pid, h, url })); } catch { /* it uploads again next time */ } }
        return url;
      } catch (e) {
        if (!e || e.code !== 'no_run' || i === LINK_TRIES - 1 || !here() || would()) return '';
        await sleep(LINK_GAP_MS);
      }
    }
    return '';
  } : null;
  const me = (state && state.players && state.players[uid]) || {};
  const prep = prepShare(async () => {
    if (!here()) return null;
    // (the numbers = THE JUDGE's — the host's result rows: the podium's + the counted result's; the picture = this phone's own frame of the
    //  run — kept under the match's id by the cartridge's stage, else under the run's seed: logic.js#seedOf of its GO)
    const run = runOf(game, uid), shot = shotFor(m) || (run.go ? shotFor(seedOf(code, m, run.go)) : null), logo = await loadLogo();
    return { cv: drawFfCard({ ...run, name: me.name }, shot, logo), name: 'neon-speakeasy-freefall.png', line: '', upload, onTap: true };
  });
  held = { m, prep };
  return held;
}
/** the end screen is up: the card is DRAWN (its PNG kept on the phone) — nothing goes up until SHARE */
export function warmShare(game, state) { try { prepRun(game, state).prep.warm(); } catch { /* the tap builds it */ } }
/** SHARE → 'shared' | 'ready' | 'none' | 'shown' | 'busy' | 'failed' — the LINK alone (uploaded at this tap, once); no link → the picture alone */
export function shareRun(game, state) { return prepRun(game, state).prep.send(); }
