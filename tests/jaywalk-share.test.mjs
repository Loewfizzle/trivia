// JAYWALK H4B's ADD-ON (the owner, Nov 16 4:33 pm) — THE SHARE = THE PICTURE ONLY (js/games/jaywalk/share.js — docs/jaywalk.md "THE SHARE
// IMAGE"): the share sends ONLY THE LINK (its preview is the run's card — the dailies' machinery, the picture uploaded before the tap); the
// card says the cause ONCE and its frame is the hero. The server's half (a run's card accepted only from a counted result) is proven on
// the emulators: tests/integration/share-card.test.mjs; the real tap: e2e-jaywalk.mjs + e2e-jaywalk-match.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { jwRunCard, JW_CARD, shotCrop, quant, SHOT_ZOOM, SHOT_UP, LINK_MAX, LINK_HARD, LINK_TRIES } from '../js/games/jaywalk/share.js';
import { RUN_W, RUN_H } from '../js/games/kit/share-run.js';
import { FOOT } from '../js/daily/share.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

test('THE CARD: the cause ONCE (no result line), the lanes + the name + the game stay — public fields only', () => {
  const game = { mode: 'solo', matchId: 'm1', results: { u1: { l: 143, t: 9000, w: 'car', pid: 'SECRET-PID', key: 'k' } } };
  const c = jwRunCard(game, { uid: 'u1', name: 'Loewfizzle', line: 'FLATTENED BY A TAXI' });
  assert.deepEqual({ game: c.game, title: c.title, mode: c.mode, name: c.name, big: c.big, unit: c.bigUnit, result: c.result }, { game: 'jaywalk', title: 'JAYWALK', mode: 'SOLO', name: 'LOEWFIZZLE', big: '143', unit: 'LANES', result: '' });
  assert.ok(!JSON.stringify(c).includes('SECRET') && !JSON.stringify(c).includes('TAXI'), 'no result line: the cause is said by the frame\'s own big words — once');
  assert.equal(jwRunCard({ mode: 'match', results: { u1: { l: 1 } } }, { uid: 'u1', name: 'Bob' }).bigUnit, 'LANE'); assert.equal(jwRunCard({ mode: 'match', results: {} }, { uid: 'u1', name: 'Bob' }).mode, '');
  assert.equal(jwRunCard({ results: { u1: { l: 1234 } } }, { uid: 'u1', name: 'x' }).big, '1,234');
});

test('THE FRAME IS THE HERO: larger than the kit\'s middle (800 × 690), inside the card, the name under it + over the foot\'s line; zoomed on the kid, never past the frame\'s edge', () => {
  const b = JW_CARD.box;
  assert.ok(b.w * b.h >= 800 * 690 * 1.4, `the frame: ${b.w} × ${b.h} — ${(b.w * b.h / (800 * 690)).toFixed(2)}× the kit's middle`);
  assert.ok(b.w / RUN_W > 0.9 && b.h / RUN_H > 0.58, 'most of the card\'s width, well over half its height');
  assert.ok(b.x >= 40 && b.x + b.w <= RUN_W - 40 && b.y >= 330, 'inside the card, under the sign + the game\'s name');
  assert.ok(JW_CARD.nameY - JW_CARD.namePx > b.y + b.h - 12 && JW_CARD.nameY < FOOT.lineY - 14, 'the name sits between the frame and THE FOOT\'s line');
  // the crop: the box's own shape, zoomed, round the kid — clamped at every edge
  const src = { width: 1080, height: 2337 };
  for (const [kx, ky] of [[0.5, 0.62], [0.02, 0.62], [0.98, 0.62], [0.5, 0.01], [0.5, 0.99], [null, null]]) {
    const q = shotCrop(src, b, kx, ky);
    assert.ok(q.sx >= 0 && q.sy >= 0 && q.sx + q.sw <= src.width + 1e-6 && q.sy + q.sh <= src.height + 1e-6, `inside the frame (${kx}, ${ky})`);
    assert.ok(Math.abs(q.sw / q.sh - b.w / b.h) < 1e-9, 'never stretched');
    assert.ok(Math.abs(q.sw - src.width / SHOT_ZOOM) < 1e-6, 'zoomed in on the kid');
  }
  // THE TOUCH-UP PASS: the kid's point in the picture's middle band — under the cause line (≤ 2 rows: the top quarter), over the big lanes
  // (the foot's last 0.28) — every cause framed alike (the frame is taken while he is SEEN: shot.js#shotMs); a 1080-row frame as view.js takes it
  for (const H of [2337, 1080]) {
    const q = shotCrop({ width: 1080, height: H }, b, 0.5, H === 1080 ? 0.65 : 0.62), at = ((H === 1080 ? 0.65 : 0.62) * H - q.sy) / q.sh;
    assert.ok(at > 0.44 && at < 0.56 && SHOT_UP === 0, `his point at ${at.toFixed(3)} of the picture (a ${H}-row frame)`);
  }
  const wide = shotCrop({ width: 1080, height: 600 }, b, 0.5, 0.5);
  assert.ok(wide.sh <= 600 && Math.abs(wide.sw / wide.sh - b.w / b.h) < 1e-9, 'a short frame (a sideways phone): its whole height, the box\'s shape');
  assert.ok(SHOT_ZOOM > 1 && SHOT_ZOOM <= 1.3);
});

test('THE LINK\'s PICTURE fits the server: over 300 KB it is re-encoded on 6, then 5 bits a channel; white stays white, black black', () => {
  assert.ok(LINK_MAX <= 300 * 1024 && LINK_HARD < 400 * 1024, 'under the server\'s 400 KB cap');
  for (const bits of [6, 5]) { assert.equal(quant(255, bits), 255); assert.equal(quant(0, bits), 0); let last = -1; for (let v = 0; v < 256; v++) { const q = quant(v, bits); assert.ok(q >= last && Math.abs(q - v) < (1 << (8 - bits))); last = q; } }
  assert.equal(new Set(Array.from({ length: 256 }, (_, v) => quant(v, 6))).size, 64);
});

test('THE SHARE SENDS ONLY THE LINK: the dailies\' sender (the link alone when there is one — else the picture, with NO text); the card is built + uploaded BEFORE the tap; the server is asked for a RUN\'s card', () => {
  const s = code('js/games/jaywalk/share.js'), v = code('js/games/jaywalk/victory.js'), d = read('js/daily/share.js'), k = read('js/games/kit/share-run.js');
  assert.doesNotMatch(s, /runLine|shareRunCard|sendShare\(/, 'no "My JAYWALK run — … · https://…" line any more');
  assert.match(s, /prepShare\(async \(\) => \{\s*if \(!here\(\)\) return null;[\s\S]{0,700}return \{ cv: drawJwCard\(game, \{ uid, name: me\.name, code, pb \}\), name: 'neon-speakeasy-jaywalk\.png', line: '', upload, onTap: true \};/, 'the kit\'s prepare — the line is EMPTY; a build that would land in the next run is dropped; BEFORE THE FLIP: the card UPLOADS ONLY ON SHARE');
  assert.match(d, /if \(url && canShareLink\(url\)\) \{\s*try \{ shareHold\(\); await navigator\.share\(\{ url \}\); return 'shared'; \}/, 'the site\'s rule (FIXES R1): the LINK ONLY');
  assert.doesNotMatch(s, /navigator\.share/, 'JAYWALK never calls the share sheet itself — ONE sender');
  assert.match(s, /api\('daily', \{ action: 'shareCard', games: \['jaywalk'\], run: \{ room: code, m \}, png: b64 \}\)/, 'a RUN\'s card: the match named, never a claim of lanes');
  assert.match(s, /if \(!e \|\| e\.code !== 'no_run' \|\| i === LINK_TRIES - 1 \|\| !here\(\)\) return '';/, 'the run not counted yet → once more; anything else → no link');
  assert.match(s, /export function shareRun\(game, state\) \{\s*return prepRun\(game, state\)\.prep\.send\(\);/, 'the tap: nothing left to draw — the upload starts here');
  assert.match(s, /const upload = game && !game\.unproven && code \? async half => \{\s*if \(!here\(\)\) return '';/, 'an UNPROVEN run has no link');
  assert.doesNotMatch(s, /linger|LINGER/, 'BEFORE THE FLIP: no timed upload behind the end screen any more');
  assert.ok(LINK_TRIES >= 3);
  assert.match(d, /const linkP = o\.upload && !o\.onTap \?/, 'the kit: an onTap card is not uploaded at warm()');
  assert.match(d, /if \(L && !L\.tried\) \{   \/\/ \(the first SHARE: the card goes up now — once\)/, '… it goes up at the first SHARE, ONCE');
  assert.match(d, /if \(!tapStillLive\(t0\)\) return 'ready';/, '… a spent tap → ready (the next tap shares inside its own gesture)');
  assert.match(read('js/ui/final.js'), /else if \(how === 'ready'\) share\.classList\.add\('is-ready'\);/, 'the console\'s SHARE: PREPARING… → SHARE (lit)');
  assert.match(v, /lazyImport\(import\('\.\/share\.js'\), '\.\/share\.js'\)\.then\(m => m\.warmShare\(game, state\)\)/, 'THE CARD IS BUILT BEFORE THE TAP: the end screen warms it (solo + match)');
  assert.match(s, /kept\.pid === pid && kept\.h === h/, 'the same picture again shares the remembered link — nothing uploaded');
  // the kit: a cartridge's own middle box + no result line when the card has none (PRISM DROP + OVERCLOCK unchanged)
  assert.match(k, /export function drawRunCard\(card, drawMiddle = null, o = \{\}\)/); assert.match(k, /const box = o\.box \|\| \{ x: 140, y: 360, w: W - 280, h: 690 \};/); assert.match(k, /if \(card\.result\) \{/);
  assert.match(code('js/games/jaywalk/view.js'), /kidY: \(night\.kidScreenY\(\) \* cv\.full - cv\.top\) \/ cv\.height, kidX: night\.kidScreenX\(\)/, 'the frame knows where the kid is (H6B: in the rows it kept — only the 1,080 round him)');
});
