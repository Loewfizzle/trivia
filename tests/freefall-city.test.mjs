// THE FREEFALL CITY PASS (Nov 28 — docs/harbor/passes/freefall-city.md): FREEFALL in the city (its sign, day face, billboard, the hold
// lifted), THE END SCREENS (the XP line as the footer, JAYWALK goes red, the block's header + medals, the friends window, fill the space,
// THIS BOARD COUNTS ROOM MATCHES), and the small ones (the shelf's colours, THE LATE PROOF CHUNK, the duplicate-tab banner).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES } from '../js/config.js';
import { SIGN_HOLD, SIGN_SPLIT, signRoster, signText } from '../js/core/harbor-neon.js';
import { ROW_FACES, rowLive, rowShow, triFaces, newestFace, faceDates } from '../js/core/harbor-trivision.js';
import { SIGN_ACC, SIGN_ACC2, DAY_PAINT, dayPaint, buildSign } from '../js/screens/harbor/signs.js';
import { bladeLetters } from '../js/screens/harbor/speakeasy-blade.js';
import { GAME_ACC, MARKS } from '../js/core/marks.js';
import { META } from '../js/games/metas.js';
import { OPTIONAL, META_KEYS, checkCartridge } from '../js/games/contract.js';
import { proofOfPath } from '../js/core/rules-lag.js';
import { createProofWriter, roomLeftOf } from '../js/games/kit/proof-writer.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

test('GROUP 0 — THE HOLD LIFTED: FREEFALL on the signs; FREE / FALL stacked on a roof (pink + teal), never the hotel blade; the speakeasy blade = FREE over FALL in ONE column', () => {
  assert.deepEqual([...SIGN_HOLD], []);
  assert.ok(signRoster(GAMES).some(g => g.id === 'freefall'));
  assert.deepEqual(SIGN_SPLIT.freefall, ['FREE', 'FALL']);
  assert.equal(SIGN_ACC.freefall, '#ff4fa8', 'FREE hot pink'); assert.equal(SIGN_ACC2.freefall, '#27e0e6', 'FALL electric teal');
  const g = { id: 'freefall', name: 'FREEFALL', short: 'FREEFALL' };
  assert.equal(signText(g, { kind: 'named', type: 'box', stack: true, cap: 6, words: 2 }), 'FREE FALL', 'a roof sign: two stacked words');
  assert.equal(signText(g, { kind: 'named', type: 'vbox', cap: 6, words: 1, rot: 'hotel' }), null, 'the hotel blade: never (8 letters)');
  const L = bladeLetters('FREEFALL');
  assert.deepEqual(L.cols.map(c => c.word), ['FREE FALL'], 'ONE column, a gap between the words (HIGH RISE\'s call — never two columns read across)');
});

test('GROUP 0 — THE DAY PAINT: FREEFALL\'s day face is enamel (rose FREE + sea-cream FALL on deep petrol-teal, gold leaf) — both words ≥ 4.5 : 1, nothing lit-looking', () => {
  const p = dayPaint({ id: 'freefall' });
  assert.ok(DAY_PAINT.freefall.ink2, 'two paints, one a word');
  assert.ok(ratio(p.ink, p.face) >= 4.5 && ratio(p.ink2, p.face) >= 4.5, `${ratio(p.ink, p.face).toFixed(1)} · ${ratio(p.ink2, p.face).toFixed(1)}`);
  // (no saturated bright ink on the dark board — tests/city-part1-signs.test.mjs THE DAY PAINT GUARD runs every scheme too)
  const hsv = c => { const mx = Math.max(...c), mn = Math.min(...c); return { s: mx ? (mx - mn) / mx : 0, v: mx / 255 }; };
  for (const c of [p.ink, p.ink2]) assert.ok(!(hsv(c).s > 0.45 && hsv(c).v > 0.8), `${c}: paint, never a lit tube`);
});

test('GROUP 0 — EVERY CITY MARK PAINTER READS A TUBE\'S OWN WIDTH (t.w): FREEFALL\'s thin core is thinner than its flames on an icon sign, never fat', () => {
  const m = MARKS.freefall, core = m.tubes.findIndex(t => t.w === 4);
  assert.ok(core > 0 && m.w === 6);
  const sg = buildSign({ id: 'x', kind: 'icon', type: 'icon', rect: { x: 0, y: 0, w: 40, h: 40 } }, { id: 'freefall', name: 'FREEFALL' }, { W: 390, s: 1 });
  const parts = sg.parts.filter(p => p.mark);
  assert.equal(parts.length, m.tubes.length);
  assert.ok(parts[core].w < parts[1].w, `the core ${parts[core].w.toFixed(2)} < the flame ${parts[1].w.toFixed(2)}`);
  const s = read('js/screens/harbor/signs.js');
  assert.match(s, /k: t\.w \? t\.w \/ \(m\.w \|\| 7\) : 1/, 'markTubes');
  assert.match(s, /x\.lineWidth = lw \* \(t\.w \? t\.w \/ \(m\.w \|\| 7\) : 1\);/, 'the poster painter');
  assert.match(s, /\(b\.y1 - b\.y0\) \* 0\.6 \* \(p\.k \|\| 1\)/, 'the day paint');
});

test('GROUP 0 — THE ROW FACES: FREEFALL\'s OPEN NOW billboard lit by its own go-live; FREEFALL → HIGH RISE → JAYWALK → HOLD\'EM; the board opens on the NEWEST (FREEFALL)', () => {
  assert.deepEqual([...ROW_FACES], ['freefall', 'highrise']);
  assert.equal(rowLive('freefall'), '2026-11-28');
  assert.equal(rowShow('freefall', '2026-11-27'), null); assert.equal(rowShow('freefall', '2026-11-28'), 'freefall');
  const F = triFaces('2026-11-30');
  assert.deepEqual(F.slice(0, 3), ['freefall', 'highrise', 'jaywalk']);
  assert.equal(F[newestFace(F, faceDates())], 'freefall');
  assert.match(read('js/screens/harbor/freefall-art.js'), /assets\/city\/freefall\/billboard\.webp/);
  assert.match(read('js/screens/harbor/signs.js'), /freefall: \['FREEFALL', \[255, 79, 168\]\]/, 'its billboard content row');
});

test('GROUP 0 — SIX NAMES ON FOUR SIGNS: the week\'s rotation steps past a wrap (0 · 3 · 0 · 3 sat a game out a whole week)', () => {
  assert.match(read('js/core/harbor-neon.js'), /const st = d \* Math\.max\(1, named\.length\), rot = pool\.length \? \(st \+ Math\.floor\(st \/ pool\.length\)\) % pool\.length : 0/);
});

test('GROUP 2 — THE SHELF\'S COLOURS: ONE game accent table (core/marks.js GAME_ACC) — every playable game in it; the PLAY shelf + PICK A GAME read it', () => {
  for (const g of GAMES.filter(x => x.playable)) assert.ok(/^#[0-9a-f]{6}$/i.test(GAME_ACC[g.id] || ''), `${g.id}: its own colour (no ice fallback)`);
  assert.equal(GAME_ACC.jaywalk, '#ff4fc4'); assert.equal(GAME_ACC.highrise, '#ff4fd8'); assert.equal(GAME_ACC.freefall, '#27e0e6');
  assert.match(read('js/screens/title.js'), /const ACC = GAME_ACC;/);
  assert.match(read('js/screens/room-city.js'), /'--ic': GAME_ACC\[g\.id\] \|\| '#d6f0ff'/);
});

test('GROUP 1 — JAYWALK GOES RED: END_ACCENT (the contract) — its end screens\' bar, block + headline in its sneaker red; its ACCENT (share card, HUD) + HIGH RISE\'s pink untouched; the red text ≥ 4.5 : 1', () => {
  assert.equal(OPTIONAL.END_ACCENT, 'string'); assert.ok(META_KEYS.includes('END_ACCENT'));
  assert.equal(META.jaywalk.END_ACCENT, '#ff3344'); assert.equal(META.jaywalk.ACCENT, '#ff4fc4'); assert.equal(META.highrise.ACCENT, '#ff4fd8'); assert.ok(!META.highrise.END_ACCENT);
  assert.ok(MARKS.jaywalk.tubes[0].col === '#ff3344', 'the red of its sneaker mark');
  assert.deepEqual(checkCartridge('x', { END_ACCENT: 'red' }).filter(s => /END_ACCENT/.test(s)).length, 1);
  assert.match(read('js/ui/final.js'), /const acc = mod && \[mod\.END_ACCENT, mod\.ACCENT\]\.find/);
  const N = META.jaywalk.NEON; for (const c of [N.name[0][1], N.line[0]]) assert.ok(ratio(rgb(c), rgb('#232036')) >= 4.5, `${c} on the veil`);
  assert.ok(ratio(rgb('#ff3344'), rgb('#0b0a14')) >= 4.5, 'the bar\'s dark ink on the red');
  assert.match(read('css/jaywalk.css'), /0 0 12px #ff3344, 0 0 28px #ff3344/, 'the headline\'s glow');
});

test('GROUP 1 — THE XP LINE AS THE FOOTER: one small line under SHARE · HOME (the solo line or "+n XP · BAND · LEVEL n ›"), its room always kept; no box in the podium', () => {
  const co = read('js/profile/callouts.js'), f = read('js/ui/final.js'), css = read('css/components.css');
  assert.match(co, /if \(sl\) \{ foot\.append\(sl\);/); assert.match(co, /foot\.append\(line\);/); assert.doesNotMatch(co, /rc-xp-bar|rc-xp-parts/, 'no bar, no parts in the line');
  assert.match(f, /if \(rc\.foot\) xpFoot\.append\(rc\.foot\);/);
  assert.match(css, /\.final-xp \{ display: flex; justify-content: center; min-height: 16px;/);
  assert.match(css, /padding: 8px 0 calc\(var\(--safe-b\) \+ 4px\); background: var\(--fin-bg\);/, 'the foot\'s old 18 pt margin = the line\'s room');
  assert.match(read('css/board.css'), /\.rc-xp::before \{ content: ''; position: absolute; inset: -12px -10px calc\(-4px - min\(12px, var\(--safe-b, 0px\)\)\); \}/, 'its tap area never past the frame\'s foot');
});

test('GROUP 1 — THE BLOCK: GLOBAL TOP 3 left + the tick right (FRIENDS TOP 3 ticked); 1 / 2 / 3 THE DECO MEDALS; FRIENDS = all your table in a three-row window; soloCounts → THIS BOARD COUNTS ROOM MATCHES; the block grows into the room', () => {
  const s = read('js/ui/end-board.js'), css = read('css/components.css');
  assert.match(s, /label = h\('span\.eb-k', 'GLOBAL TOP 3'\)/); assert.match(s, /label\.textContent = friends \? 'FRIENDS TOP 3' : 'GLOBAL TOP 3';/);
  assert.match(s, /el\.append\(h\('div\.eb-head', label, tick\), list, you, note\);/);
  assert.match(s, /const place = r => rankMedal\(r\.rank, \{ size: 30, cls: 'eb-medal' \}\) \|\| String\(r\.rank\);/);
  assert.match(s, /friends \? \{ top: R\.filter\(r => r && Number\.isFinite\(Number\(r\.v\)\)\), you: null \} : pickRows\(R\)/, 'FRIENDS: the whole table');
  assert.match(s, /you\.textContent = roomOnly \? 'THIS BOARD COUNTS ROOM MATCHES' :/);
  assert.match(s, /if \(held\) \{ waiting = again; return; \}/, 'THE TAP WATCH: S10\'s re-read waits for the finger');
  assert.match(css, /\.eb-list\.is-scroll \{ position: relative; max-height: calc\(3 \* var\(--eb-rh\) \+ 2 \* var\(--eb-lg\)\); overflow-y: auto; overscroll-behavior: contain;/);
  assert.match(css, /\.final > \.final-eb \{ flex: 1 1 auto; container-type: size;/);
  assert.match(css, /--eb-rh: clamp\(46px, calc\(\(100cqh - var\(--eb-hd\) - 16px - 2 \* var\(--eb-g\) - 2 \* var\(--eb-lg\)\) \/ 3\), 72px\);/);
  assert.match(css, /\.eb-head \{ display: flex; align-items: center; justify-content: space-between;/);
  for (const id of ['overclock', 'prism']) assert.match(read(`js/games/${id}/index.js`), /soloCounts: false/, `${id}: a room-matches board`);
  for (const id of ['freefall', 'jaywalk', 'highrise']) assert.doesNotMatch(read(`js/games/${id}/index.js`), /soloCounts/);
});

test('GROUP 2 — THE LATE PROOF CHUNK: a proof write refused after the room / the match = the quiet late-proof; nothing goes up once this phone LEFT its room (never a kick)', async () => {
  assert.deepEqual(proofOfPath('rooms/ABCD/jw/m1/u1/c/3'), { code: 'ABCD', mid: 'm1' });
  assert.deepEqual(proofOfPath('/rooms/ABCD/ff/m2/u1/e'), { code: 'ABCD', mid: 'm2' });
  assert.deepEqual(proofOfPath('rooms/ABCD/hr/m2/u1/h'), { code: 'ABCD', mid: 'm2' }, 'a hold\'s stamp too');
  for (const p of ['rooms/ABCD/meta/go', 'rooms/ABCD/jw/m1/u1/g', 'dailies/x/c/1', 'rooms/ABCD/pf/m1/u1/c/1']) assert.equal(proofOfPath(p), null, p);
  // the hub: left or leaving, never a kick
  assert.match(read('js/room.js'), /globalThis\.__nsRoomLeft = code => !!code && \(state\.code !== code \|\| leavingCode === code\);/);
  globalThis.__nsRoomLeft = c => c === 'GONE';
  assert.equal(roomLeftOf(() => 'GONE')(), true); assert.equal(roomLeftOf(() => 'HERE')(), false); assert.equal(roomLeftOf(() => '')(), false);
  // the writer: gone → nothing more is sent (flush + close), the moves given up ('dropped')
  let out = false, sent = 0; const said = [];
  const moves = ['a', 'b'];
  const W = createProofWriter({ count: () => moves.length, pack: (a, b) => moves.slice(a, b).join('.'), entriesOf: () => 0, chunkMax: 400, chunks: 100, flushMs: () => 0,
    gone: () => out, onLate: w => said.push(w), io: { now: () => 0, timer: () => {}, chunk: () => { sent++; return Promise.resolve(); }, end: () => Promise.resolve(), read: () => Promise.resolve(null) } });
  W.flush(true); await new Promise(r => setImmediate(r));
  assert.equal(sent, 1, 'in the room: it goes up');
  moves.push('c'); out = true; W.flush(true); W.close(); await new Promise(r => setImmediate(r));
  assert.equal(sent, 1, 'left: nothing more'); assert.deepEqual(said, ['dropped']);
  for (const v of ['jaywalk', 'highrise', 'freefall']) assert.match(read(`js/games/${v}/view.js`), /left: matchLeft, gone: roomLeftOf\(\(\) => /, v);
  delete globalThis.__nsRoomLeft;
});

test('GROUP 2 — THE DUPLICATE-TAB BANNER: the full width inside the gutters, a rounded rect + a 10-pt-cornered button (NO PILLS), the same words for every slot', () => {
  const css = read('css/components.css'), a = css.slice(css.indexOf('.dup-tab {'), css.indexOf('.dup-tab ~ .sh-msgs'));
  assert.match(a, /left: 16px; right: 16px;/); assert.doesNotMatch(a, /999px|translateX/);
  assert.match(a, /\.dup-tab \.btn, \.dup-tab \.btn::before, \.dup-tab \.btn::after \{ border-radius: 10px; \}/);
  assert.doesNotMatch(read('js/app.js'), /SLOT \$\{slot\} IS ALREADY OPEN/);
});
