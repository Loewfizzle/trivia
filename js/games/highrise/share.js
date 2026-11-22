// HIGH RISE — THE SHARE CARD = B · THE POSTER (REVIEW FIX B — the owner's pick from three prototypes, Nov 20: Downloads\NEON\highrise-share-B.png;
// docs/highrise.md "THE SHARE CARD"). S5's card (the run's own frame frozen in a box) is GONE — the owner: a live frame only looks good
// when the moment is good, and most runs end low (a short pale stack at floor 14, the missed slab frozen like a bridge).
// 1080 × 1350, FULL-BLEED, ALWAYS THE NIGHT LOOK whatever look the run was played in, drawn ON THE PHONE from the run's PUBLIC numbers only:
//   · the picture = THE BAND's HERO SHOT (assets/highrise/share/<band>.webp — pre-rendered from the real game, scripts/build-highrise-
//     heroes.mjs + poster.js#runHero: a tall neon tower rising from the foot, its lit top just under the middle, that band's sky behind;
//     no flyers) — the band the run REACHED; THE MOTHERSHIP's gold shot for a finished tower. Never the live frame. No inner frame box.
//   · top: HIGH (hot pink) + RISE (cyan) in neon + "SOLO · NEONSPEAKEASY" (or MATCH) small under it
//   · the floor HUGE in the sky (the game's numerals — white-hot, a CYAN glow) with "FLOORS" right beside it on its line (bold cyan,
//     tight — it reads "10 FLOORS"), then THE BAND ("THE SKYLINE") on its own line under it in PINK neon (THE GO-LIVE — the owner, from
//     the real card in Messages: "FLOORS · THE ROOFTOPS" read as small wide-spaced cyan blurs + confused; Downloads/NEON/highrise-share-
//     floors-fix.png, the RIGHT side). THE FINISH: the same layout, all gold
//   · the foot, over a dark fade: the cause in big pink neon (2 lines when long), "31 PERFECTS · BEN", the kit's neon line + NEONSPEAKEASY.COM
//   · MADE IT TO THE MOTHERSHIP = ALL GOLD type (the title, the number's glow, the cause, the line) on the gold shot.
// THE SHARE = THE LINK ALONE (JAYWALK H4B — navigator.share({ url }), its preview = this card): built when the end screen stands, uploaded
// at the first SHARE tap (prepShare's onTap), fitted under the server's cap (fitPng). BEHIND THE SWITCH: the server takes a run's card only
// with its own COUNTED result (api/_lib/share-card.js) — with HIGHRISE_COUNTS off there is none, so the phone asks nothing once the server
// has said WOULD COUNT (final.js sets globalThis.__hiWould) and the picture itself goes out (no link, no text). Lazy (index.js#shareRun).
import { runCard, fitPng, RUN_W, RUN_H, pbFoil, pbFrom, PB_GLOW, PB_WORDS } from '../kit/share-run.js';
import { spacedText, spacedWidth, shareAddress, prepShare, blobHash, base64Of } from '../../daily/share.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { state as live } from '../../store.js';
import { drawNum, numWidth } from '../jaywalk/numerals.js';
import { END_WORDS } from './logic.js';
import { BANDS, bandAt } from './bands.js';

/** the colours: HIGH's hot pink · RISE's cyan · the number's cyan glow · THE FINISH's gold (+ its pale core) */
export const PINK = '#ff4fd8', CYAN = '#35e3ff', GOLD = '#ffc83c', GOLD_CORE = '#fff1c4';
/** the six hero shots (poster.js HEROES — the same ids): a band's id, or THE MOTHERSHIP for a finished tower */
export const HERO_IDS = Object.freeze([...BANDS.map(b => b.id), 'mothership']);
export const HERO_DIR = new URL('../../../assets/highrise/share/', import.meta.url);
/** the card's layout, px of its 1080 × 1350 (the mockup's): the title · the mode line · the floor's baseline + its size · FLOORS beside it
 *  (its size, the gap after the number) · the band line · the cause's LAST baseline + its size / line height · the perfects line (the kit's
 *  foot follows at its own place: daily/share.js FOOT) */
export const POSTER_L = Object.freeze({ titleY: 122, titlePx: 92, modeY: 172, modePx: 30, bigY: 440, bigPx: 270, unitPx: 72, unitGap: 30, bandY: 546, bandPx: 68, causeY: 1092, causePx: 76, causeLh: 80, statY: 1158, statPx: 40 });
const NUMS = '"Chakra Petch", system-ui, sans-serif';
/** THE PERSONAL-BEST CARD: the band's line moves this far down (PERSONAL BEST takes its place under the floor) */
export const PB_BAND_DY = 78;
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';

/** PURE: the card's words + numbers from a run's PUBLIC fields → the kit's card + the poster's own lines + its hero shot */
export function hiRunCard({ floor = 0, perfects = 0, cause = '', made = false, mode = 'solo', name = '', pb = false } = {}) {
  const f = Math.max(0, Math.floor(Number(floor) || 0)), p = Math.max(0, Math.floor(Number(perfects) || 0)), gold = !!made;
  const card = runCard({ game: 'highrise', title: 'HIGH RISE', mode: mode === 'match' ? 'MATCH' : 'SOLO', name, big: String(f), bigUnit: f === 1 ? 'FLOOR' : 'FLOORS', result: '', look: 'night', accent: gold ? GOLD : PINK });
  const b = BANDS[bandAt(f)];
  return {
    ...card, gold, pb: !!pb, hero: gold ? 'mothership' : b.id,
    line: gold ? END_WORDS.made : END_WORDS[cause] || 'THE TOWER STANDS',
    band: b.name,   // (THE GO-LIVE: its own pink line under "10 FLOORS" — card.bigUnit stands beside the number)
    stat: `${p} ${p === 1 ? 'PERFECT' : 'PERFECTS'}${card.name ? ` · ${card.name}` : ''}`,
  };
}
/** PURE: the hero shot's address (the band reached — THE MOTHERSHIP's for the finish) */
export const heroUrl = id => new URL(`${HERO_IDS.includes(id) ? id : 'rooftops'}.webp`, HERO_DIR).href;
/** the hero shot as a decoded picture (null: it could not load — the card draws on the night's dark instead) */
export const HERO_WAIT_MS = 3000;
export function loadHero(id, ms = HERO_WAIT_MS) {
  // (THE CLOSE's REVIEW: never waits for ever — a stalled fetch would leave SHARE 'busy' all match: after `ms` the card draws on the dark)
  return new Promise(res => {
    const t = setTimeout(() => res(null), ms);
    try {
      const im = new Image();
      im.onload = () => { clearTimeout(t); res(im); };
      im.onerror = () => { clearTimeout(t); res(null); };
      im.src = heroUrl(id);
    } catch { clearTimeout(t); res(null); }
  });
}
/** the cause on ≤ 2 lines of ≤ `max` px: split at the most even space */
export function wrap2(c, text, max, ls = 0) {
  const wd = t => spacedWidth(c, t, ls);
  if (wd(text) <= max) return [text];
  const w = text.split(' ');
  let best = [text], bw = Infinity;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(wd(a), wd(b)); if (m < bw) { bw = m; best = [a, b]; } }
  return best;
}
/** neon lettering on the night — ONE word's three passes: 'wide' (the soft halo) · 'tight' (the glow hugging the letters) · 'core' (the hot
 *  letter itself, crisp). The two glows are drawn SMALL (`k` of the card) and stretched by litLayer — never in the card itself. */
function neon(text, x, y, { px, glow, core, ls = 0, weight = 900, fam = DISPLAY, wide = 0.42, maxW = 0 }) {
  return (c, pass, k = 1) => {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `${weight} ${px}px ${fam}`;
    const cx = x + ls / 2;   // (the canvas's trailing letter gap: half a gap right — the kit's own centring)
    if (pass === 'core') { c.fillStyle = core; } else { c.fillStyle = glow; c.shadowColor = glow; c.shadowBlur = px * (pass === 'wide' ? wide : 0.14) * k; }
    spacedText(c, text, cx, y, ls, { maxW });
    if (pass === 'wide') spacedText(c, text, cx, y, ls, { maxW });   // (twice: the halo as strong as a lit tube's)
    c.restore();
  };
}
/** a layer of every lit word's `pass` drawn at `k` of the card's size, then stretched over it: a canvas shadow is DITHERED — noise in every
 *  pixel it touches, which doubled the link picture's PNG (the clouds' card did not fit the server's cap); drawn small + stretched, the
 *  glow is the same soft light and the noise is gone */
function litLayer(c, W, H, k, lit, pass) {
  const s = document.createElement('canvas'); s.width = Math.round(W * k); s.height = Math.round(H * k);
  const g = s.getContext('2d');
  if (!g) { s.width = s.height = 0; return; }
  g.scale(k, k);
  for (const f of lit) f(g, pass, k);
  c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(s, 0, 0, W, H); c.restore();
  s.width = s.height = 0;
}
/** a vertical wash (top → bottom stops) over x, y, w, h: a 1 × 64 strip stretched (no dither — see paintPoster) */
function wash(c, x, y, w, h, stops) {
  const s = document.createElement('canvas'); s.width = 1; s.height = 64;
  const k = s.getContext('2d');
  if (!k) return;
  const g = k.createLinearGradient(0, 0, 0, 64);
  for (const [at, col] of stops) g.addColorStop(at, col);
  k.fillStyle = g; k.fillRect(0, 0, 1, 64);
  c.save(); c.imageSmoothingEnabled = true; c.drawImage(s, 0, 0.5, 1, 63, x, y, w, h); c.restore();
}
/** a round shade (`col` at the centre → clear at radius r): a 64 × 64 disc stretched */
function glowDisc(c, cx, cy, r, col) {
  const s = document.createElement('canvas'); s.width = s.height = 64;
  const k = s.getContext('2d');
  if (!k) return;
  const g = k.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  k.fillStyle = g; k.fillRect(0, 0, 64, 64);
  c.save(); c.imageSmoothingEnabled = true; c.drawImage(s, cx - r, cy - r, 2 * r, 2 * r); c.restore();
}
/** the poster on a 2D context (W × H = RUN_W × RUN_H): `hero` = the band's picture (or null) */
export function paintPoster(c, card, hero) {
  const W = RUN_W, H = RUN_H, L = POSTER_L, gold = card.gold;
  // THE HERO SHOT, full-bleed (cover) — or the night's own dark when it could not load
  wash(c, 0, 0, W, H, [[0, '#0b0820'], [0.55, '#120b2c'], [1, '#05040e']]);
  if (hero && hero.width > 0) {
    const k = Math.max(W / hero.width, H / hero.height), dw = hero.width * k, dh = hero.height * k;
    c.imageSmoothingQuality = 'high'; c.drawImage(hero, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
  // the words always stand on the dark: the sky darkened behind the title + the floor (a soft wash, deepest at the very top), a soft round
  // shade behind the number (a bright beam / cloud never washes the white-hot digits out), and the foot's dark fade under the cause + the
  // line (the tower's base sinks into it). (Each drawn SMALL and stretched — a canvas gradient is DITHERED, noise in every pixel that
  // doubled the link picture's PNG: the clouds' card no longer fitted the server's cap)
  wash(c, 0, 0, W, 640, [[0, 'rgba(6,4,16,0.82)'], [0.3, 'rgba(6,4,16,0.55)'], [0.75, 'rgba(6,4,16,0.32)'], [1, 'rgba(6,4,16,0)']]);
  glowDisc(c, W / 2, L.bigY - L.bigPx * 0.36, 430, gold ? 'rgba(10,6,4,0.62)' : 'rgba(6,4,16,0.5)');
  wash(c, 0, 900, W, H - 900, [[0, 'rgba(5,3,12,0)'], [0.32, 'rgba(5,3,12,0.72)'], [0.6, 'rgba(5,3,12,0.9)'], [1, 'rgba(5,3,12,0.96)']]);
  // every lit word (the passes: neon) — TOP: HIGH (pink) + RISE (cyan), THE FINISH both gold, a clear gap between
  const lit = [];
  c.save(); c.font = `900 ${L.titlePx}px ${DISPLAY}`;
  const tls = 8, gap = 70, wh = spacedWidth(c, 'HIGH', tls), wr = spacedWidth(c, 'RISE', tls), x0 = (W - (wh + gap + wr)) / 2;
  c.restore();
  lit.push(neon('HIGH', x0 + wh / 2 - tls / 2, L.titleY, { px: L.titlePx, glow: gold ? GOLD : PINK, core: gold ? GOLD_CORE : '#ffe6f8', ls: tls }));
  lit.push(neon('RISE', x0 + wh + gap + wr / 2 - tls / 2, L.titleY, { px: L.titlePx, glow: gold ? GOLD : CYAN, core: gold ? GOLD_CORE : '#e8fbff', ls: tls }));
  // THE FLOOR, huge in the sky: the game's numerals — white-hot, a CYAN glow (gold for THE FINISH); a size down for a long number
  // (THE PERSONAL-BEST CARD — the kit's PB_FOIL: the floor in THE HOUSE GOLD with its glow; PERSONAL BEST on the band's line, the band a line under)
  const pb = !!card.pb, big = card.big || '0', glow = gold || pb ? (pb && !gold ? PB_GLOW : GOLD) : CYAN;
  let px = L.bigPx;
  // (numWidth measures in the context's OWN font — set to each size tried)
  c.save(); if ('letterSpacing' in c) c.letterSpacing = '0px';   // (THE CLOSE's REVIEW: only where the canvas HAS it — an older iPhone's would gain a plain property, and daily/share.js#tracks would stop spacing by hand)
  const nw = q => { c.font = `700 ${q}px ${NUMS}`; return numWidth(c, big, q, NUMS, 700); };
  // (THE GO-LIVE: the number + FLOORS are ONE row, centred together — "10 FLOORS"; the number a size down when the row is too wide)
  const unit = card.bigUnit || 'FLOORS', uls = 2;
  c.font = `900 ${L.unitPx}px ${DISPLAY}`;
  const uw = spacedWidth(c, unit, uls), row = q => nw(q) + L.unitGap + uw;
  while (px > 160 && row(px) > W - 120) px -= 10;
  const nwx = nw(px), bx = (W - row(px)) / 2, ux = bx + nwx + L.unitGap;
  c.restore();
  card.row = { px, bx, ux, uw };   // (where the row stands — the share check reads it)
  lit.push((g, pass, k = 1) => {
    g.save(); g.textAlign = 'left'; if ('letterSpacing' in g) g.letterSpacing = '0px'; g.font = `700 ${px}px ${NUMS}`;
    if (pass === 'core') g.fillStyle = pb ? pbFoil(g, bx, L.bigY - px * 0.8, bx + nwx, L.bigY) : gold ? '#fff6dc' : '#f2feff';
    else { g.fillStyle = pass === 'wide' ? glow : (gold || pb ? '#ffe7a6' : '#9eefff'); g.shadowColor = glow; g.shadowBlur = (pass === 'wide' ? 64 : 22) * k; }
    drawNum(g, big, bx, L.bigY, px, NUMS, 700);
    if (pass === 'wide') drawNum(g, big, bx, L.bigY, px, NUMS, 700);
    g.restore();
  });
  // FLOORS right beside the number, on its baseline (bold CYAN, tight — gold for THE FINISH) · THE BAND on its own line under it (PINK neon,
  // bigger + bolder, tight — gold for THE FINISH)
  lit.push(neon(unit, ux + uw / 2 - uls / 2, L.bigY, { px: L.unitPx, glow, core: gold || pb ? '#ffefc4' : '#b8f6ff', ls: uls, weight: 900, wide: 0.16 }));
  if (pb) lit.push(neon(PB_WORDS, W / 2, L.bandY, { px: L.bandPx, glow: PB_GLOW, core: GOLD_CORE, ls: 4, weight: 900, wide: 0.34, maxW: W - 110 }));
  lit.push(neon(card.band || '', W / 2, L.bandY + (pb ? PB_BAND_DY : 0), { px: pb ? Math.round(L.bandPx * 0.82) : L.bandPx, glow: gold ? GOLD : PINK, core: gold ? GOLD_CORE : '#ffd9f5', ls: 3, weight: 900, wide: 0.34, maxW: W - 110 }));
  // THE CAUSE (hot pink · gold), 1 or 2 lines — its LAST line on causeY
  c.save(); c.font = `900 ${L.causePx}px ${DISPLAY}`;
  const rows = card.line ? wrap2(c, card.line, W - 110, 3) : [];
  c.restore();
  // (two lines — MADE IT TO / THE MOTHERSHIP — a size down, closer: they stay on the dark fade, off the tower's lit top)
  const cpx = rows.length > 1 ? Math.round(L.causePx * 0.88) : L.causePx, clh = rows.length > 1 ? Math.round(L.causeLh * 0.9) : L.causeLh;
  rows.forEach((t, i) => lit.push(neon(t, W / 2, L.causeY - (rows.length - 1 - i) * clh, { px: cpx, glow: gold ? GOLD : PINK, core: gold ? GOLD_CORE : '#ffe3f7', ls: 3, maxW: W - 90 })));
  // the light: the wide halo (a sixth of the card's size), the tight glow (a half), then the crisp letters
  litLayer(c, W, H, 1 / 6, lit, 'wide');
  litLayer(c, W, H, 1 / 2, lit, 'tight');
  for (const f of lit) f(c, 'core');
  // the mode + the site under the title · the perfects + the name under the cause (plain lettering on the dark)
  c.save(); c.textAlign = 'center'; c.font = `700 ${L.modePx}px ${DISPLAY}`; c.fillStyle = gold ? '#ffe3a3' : '#dcd2ff';
  spacedText(c, `${card.mode || 'SOLO'} · NEONSPEAKEASY`, W / 2 + 6, L.modeY, 12, { maxW: W - 140 });   // (HIGH RISE DAILY B: the daily's longer tag kept off the edges — SOLO / MATCH never reach it)
  c.font = `800 ${L.statPx}px ${DISPLAY}`; c.fillStyle = gold ? '#ffeab8' : '#f1ecff';
  spacedText(c, card.stat || '', W / 2 + 5, L.statY, 10, { maxW: W - 120 }); c.restore();
  // THE FOOT (the kit's, every share card's): ONE straight thin neon line + NEONSPEAKEASY.COM — gold for THE FINISH
  shareAddress(c, 'night', { W, color: gold ? GOLD : '#ff6fc8' });
}
/** the whole card for a run → a canvas (null: this phone can't). `run` = { floor, perfects, cause, made, mode, name } · `hero` = the
 *  band's picture (loadHero) */
export function drawHiCard(run, hero) {
  const card = hiRunCard(run), cv = document.createElement('canvas');
  cv.width = RUN_W; cv.height = RUN_H;
  const c = ctx2d(cv);
  if (!c) return null;
  paintPoster(c, card, hero);
  cv.hiRow = card.row;   // (the number row's place: the share check measures FLOORS where it stands)
  return cv;
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
let held = null;   // { m, prep, pb } — ONE match's share at a time on this phone
// THE PERSONAL-BEST CARD: the server's answer for THIS match — NEW BEST as the end card says it (final.js: only a best BEATEN, `prev` > 0)
export const PB_BOARD = 'highrise-solo';
let Qm = null;
const pbNow = (game, code) => !!(Qm && code && game && pbFrom(Qm.outcomeFor(Qm.matchKey(code, game.matchId)), PB_BOARD, true));
function prepRun(game, state) {
  const m = game && game.matchId, uid = state && state.uid, code = state && state.code;
  if (held && held.m === m && (held.pb === null || held.pb === pbNow(game, code))) return held;
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
  const mine = { m, prep: null, pb: null };
  mine.prep = prepShare(async () => {
    if (!here()) return null;
    if (!Qm && code && !game.unproven) {
      Qm = await lazyImport(import('../../profile/queue.js'), '../../profile/queue.js').catch(() => null);
      if (Qm) Qm.onOutcome((k, o) => { if (held && held.pb === false && live.game && code && k === Qm.matchKey(code, live.game.matchId) && pbFrom(o, PB_BOARD, true)) { held = null; warmShare(live.game, live); } });
    }
    // (the numbers = THE JUDGE's — the host's result rows: the podium's + the counted result's; the picture = the band's hero shot)
    const run = runOf(game, uid), hero = await loadHero(hiRunCard(run).hero), pb = pbNow(game, code); mine.pb = pb;
    return { cv: drawHiCard({ ...run, name: me.name, pb }, hero), name: 'neon-speakeasy-high-rise.png', line: '', upload, onTap: true };
  });
  held = mine;
  return held;
}
/** the end screen is up: the card is DRAWN (its PNG kept on the phone) — nothing goes up until SHARE */
export function warmShare(game, state) { try { prepRun(game, state).prep.warm(); } catch { /* the tap builds it */ } }
/** SHARE → 'shared' | 'ready' | 'none' | 'shown' | 'busy' | 'failed' — the LINK alone (uploaded at this tap, once); no link → the picture alone */
export function shareRun(game, state) { return prepRun(game, state).prep.send(); }
