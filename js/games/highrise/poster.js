// HIGH RISE — THE POSTER (S5 — JAYWALK's pattern: js/games/jaywalk/poster.js, the lab's `?poster=1`; docs/highrise.md "THE BILLBOARD").
// The test page's `?poster=1`: ONE frame staged in the REAL night scene, the same every time — the seed `poster2` (its slabs violet-blue — the mockup's tower), the run climbed to
// THE CLOUDS (floor POSTER.from), one CUT dropped (its falling piece + its sparks), the game FROZEN a beat after it, the frame copied off
// the canvas (night.js#snap) — cropped to the roof board's 848 : 448 round the glowing tower's top, DARKENED for the words, then the B1
// lettering over it (billboard.js). Drawn at 2× (1696 × 896) + 1×; the page shows it with SAVE links. Zero server calls (the page's door).
// A VIEW: it drives the stage's own test hooks (climb · freeze · snap) — nothing here is a rule or a result. Lazy, the test page only.
import { h } from '../../ui/dom.js';
import { paintBillboard, BOARD_W, BOARD_H } from './billboard.js';

/** the staged moment: the seed, the floor it climbs to (THE CLOUDS band: 60 – 110), the cut's offset (ticks off dead-on), the frozen beat */
export const POSTER = Object.freeze({ seed: 'poster2', from: 78, cut: 7, beatMs: 140, topAt: 0.5, dim: 0.46 });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 20000) { const end = performance.now() + ms; while (performance.now() < end) { try { if (fn()) return true; } catch { /* not yet */ } await wait(40); } return false; }

/** the scene's frame (a 2D canvas, the top at topX / topY) → the board's art at `w` px wide: cropped round the top + darkened */
export function posterArt(frame, w) {
  const hgt = Math.round(w * BOARD_H / BOARD_W), cv = document.createElement('canvas');
  cv.width = w; cv.height = hgt;
  const c = cv.getContext('2d');
  let sw = frame.width, sh = sw * BOARD_H / BOARD_W;
  if (sh > frame.height) { sh = frame.height; sw = sh * BOARD_W / BOARD_H; }
  const cy = (frame.topY == null ? 0.5 : frame.topY) * frame.height, sy = Math.max(0, Math.min(frame.height - sh, cy - sh * POSTER.topAt)), sx = (frame.width - sw) / 2;
  c.imageSmoothingQuality = 'high';
  c.drawImage(frame, sx, sy, sw, sh, 0, 0, w, hgt);
  // DARKENED for the words: the whole scene down, a little more at the top (behind HIGH) — the tower's glow still shows through
  c.fillStyle = `rgba(6,4,16,${POSTER.dim})`; c.fillRect(0, 0, w, hgt);
  const g = c.createLinearGradient(0, 0, 0, hgt); g.addColorStop(0, 'rgba(6,4,16,0.35)'); g.addColorStop(0.55, 'rgba(6,4,16,0)'); c.fillStyle = g; c.fillRect(0, 0, w, hgt);
  return cv;
}
/** the board at `w` px wide (the art + the B1 lettering) */
export function posterBoard(art, w) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = Math.round(w * BOARD_H / BOARD_W);
  paintBillboard(cv.getContext('2d'), cv.width, cv.height, art);
  return cv;
}
/** run the staged moment on the page's stage `S` (its hook) → { art2x, board2x, board1x } as data URLs (+ shown on the page) */
export async function runPoster(S, app) {
  const play = document.querySelector('.hi-play');
  await until(() => S.state().warm, 30000);
  play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }));
  await until(() => S.phase() === 1 && S.state().floor >= POSTER.from);
  await wait(600);
  S.climb(1, () => POSTER.cut);   // (ONE cut: its falling piece + its sparks)
  await wait(POSTER.beatMs);
  S.freeze(true);
  await wait(60);
  const frame = await new Promise(res => S.view.snap(res, S.view.el.width));
  if (!frame) throw new Error('the frame could not be copied');
  const art2 = posterArt(frame, BOARD_W * 2), board2 = posterBoard(art2, BOARD_W * 2), board1 = posterBoard(posterArt(frame, BOARD_W), BOARD_W);
  const out = { art2x: art2.toDataURL('image/png'), board2x: board2.toDataURL('image/png'), board1x: board1.toDataURL('image/png'), frame: { w: frame.width, h: frame.height, topY: frame.topY } };
  window.__hiPoster = out;
  const link = (url, name, label) => h('a', { href: url, download: name, style: { color: '#fff', font: '700 14px var(--font-ui)', margin: '0 10px' } }, label);
  app.append(h('div', { style: { position: 'fixed', inset: '0', zIndex: '20', background: '#05040c', display: 'grid', placeContent: 'center', gap: '14px', padding: '16px' } },
    h('img', { src: out.board2x, alt: 'HIGH RISE · OPEN NOW', style: { width: 'min(92vw, 848px)', height: 'auto', display: 'block' } }),
    h('div', { style: { textAlign: 'center' } }, link(out.board2x, 'highrise-billboard-2x.png', 'SAVE 2×'), link(out.board1x, 'highrise-billboard-1x.png', 'SAVE 1×'))));
  return out;
}

// ---- REVIEW FIX B — THE HERO SHOTS (THE SHARE CARD = B · THE POSTER — the owner's pick, Downloads\NEON\highrise-share-B.png;
// docs/highrise.md "THE SHARE CARD"). The test page's `?poster=hero&shot=<id>`: ONE of six frames staged in the REAL NIGHT scene, the same
// every time — the tower climbed clean to its floor, one CUT dropped (its falling piece + its sparks), frozen a beat later — seen by THE
// HERO CAMERA (night.js `o.cam`: lower + farther back than play's — a TALL tower rising from the foot, its lit top in the sky). Cropped to
// the card's 4 : 5 with the top at HERO_TOP of its height. NO FLYERS: each floor sits clear of a flyer's floor (FLY_FLOORS — the flyby
// 35–45, the UFO 85, THE MOTHERSHIP 200) and the stage is told no flyer moment comes (stage.js `o.noFly`); THE MOTHERSHIP's shot is the match's FINISH (floor 200 — the gold light poured, the ship over it).
// The build: scripts/build-highrise-heroes.mjs → assets/highrise/share/<id>.webp (shipped small — the card draws one, share.js).
/** the card's shape (share.js CARD_W × CARD_H) — the shots are made at it */
export const HERO_W = 1080, HERO_H = 1350;
/** THE HERO CAMERA: `pitch`° down (play: 33) · `far` × play's distance */
export const HERO_CAM = Object.freeze({ pitch: 24, far: 2.1 });
/** where the tower's top slab stands on the card (0 … 1 from the top) · the beat after the cut the frame is frozen at (the next slab
 *  sliding in over the top, the cut piece falling past it, its sparks still bright) */
export const HERO_TOP = 0.52, HERO_BEAT_MS = 330;
/** the six shots: the band (bands.js id) · the seed (its slab colours) · the floor climbed to · the cut (ticks off dead-on) · its own
 *  beat (the next slab clear of the top, never lying across it like a bridge — the owner's note on S5's card) · the mode
 *  (THE MOTHERSHIP = the match's finish: the last drop lands floor 200, no cut) · DEEP SPACE at 175: under THE MOTHERSHIP's hull (it hangs
 *  in the sky from 178 until a run passes it) */
export const HEROES = Object.freeze([
  Object.freeze({ id: 'rooftops', seed: 'poster2', floor: 19, cut: 7, beat: 220, mode: 'solo' }),
  Object.freeze({ id: 'skyline', seed: 'poster2', floor: 36, cut: 7, mode: 'solo' }),
  Object.freeze({ id: 'clouds', seed: 'poster2', floor: 76, cut: 7, beat: 450, mode: 'solo' }),
  Object.freeze({ id: 'stars', seed: 'poster2', floor: 140, cut: 7, beat: 230, mode: 'solo' }),
  Object.freeze({ id: 'space', seed: 'poster2', floor: 175, cut: 7, mode: 'solo' }),
  Object.freeze({ id: 'mothership', seed: 'poster2', floor: 199, cut: 0, mode: 'match' }),
]);
export const heroOf = id => HEROES.find(x => x.id === id) || null;
/** PURE: the 4 : 5 crop of a frame `fw` × `fh` with the top (0 … 1 from the top) at HERO_TOP — never past an edge */
export function heroCrop(fw, fh, topY) {
  let sw = fw, sh = sw * HERO_H / HERO_W;
  if (sh > fh) { sh = fh; sw = sh * HERO_W / HERO_H; }
  const cy = (topY == null ? 0.5 : topY) * fh;
  return { sx: (fw - sw) / 2, sy: Math.max(0, Math.min(fh - sh, cy - sh * HERO_TOP)), sw, sh };
}
/** run hero shot `id` on the page's stage `S` (mounted with HERO_CAM, `?seed` + `?mode` from the shot) → { png, top } (+ shown on the page) */
export async function runHero(S, app, id) {
  const H = heroOf(id);
  if (!H) throw new Error(`no hero shot "${id}"`);
  const play = document.querySelector('.hi-play');
  await until(() => S.state().warm, 30000);
  play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }));
  await until(() => S.phase() === 1 && S.state().floor >= H.floor);
  await wait(900);
  S.climb(1, () => H.cut);   // (ONE drop: a cut — its falling piece + its sparks; THE MOTHERSHIP's: dead-on, floor 200 — THE FINISH)
  const beatQ = Number(new URLSearchParams(location.search).get('beat')) || 0;   // (`&beat=<ms>` — the build's tuning sweep only)
  await wait(H.mode === 'match' ? 1900 : beatQ || H.beat || HERO_BEAT_MS);   // (THE FINISH: the gold light poured — shot.js SHOT_AT.made's beat)
  S.freeze(true);
  await wait(80);
  const frame = await new Promise(res => S.view.snap(res, S.view.el.width));
  if (!frame) throw new Error('the frame could not be copied');
  const q = heroCrop(frame.width, frame.height, frame.topY), cv = document.createElement('canvas');
  cv.width = HERO_W; cv.height = HERO_H;
  const c = cv.getContext('2d');
  c.imageSmoothingQuality = 'high';
  c.drawImage(frame, q.sx, q.sy, q.sw, q.sh, 0, 0, HERO_W, HERO_H);
  const out = { id, png: cv.toDataURL('image/png'), webp: cv.toDataURL('image/webp', 0.82), frame: { w: frame.width, h: frame.height, topY: frame.topY }, top: (frame.topY * frame.height - q.sy) / q.sh };
  window.__hiHero = out;
  app.append(h('div', { style: { position: 'fixed', inset: '0', zIndex: '20', background: '#05040c', display: 'grid', placeContent: 'center', padding: '8px' } },
    h('img', { src: out.png, alt: `HIGH RISE · ${id}`, style: { height: 'min(96vh, 1350px)', width: 'auto', display: 'block' } })));
  return out;
}
