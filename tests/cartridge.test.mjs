// LOBBY 2.0 B — THE CARTRIDGE PLUG (docs/cartridge.md): every registered game meets the contract (js/games/cartridge.js) — the playable
// ones checked, the hidden ones listed as EXEMPT until each comes back; the console never names a game; the checker itself.
// (A game's index.js needs a browser: here its EXPORTS are read from the source; the harbor's `cartridge` group runs checkCartridge on the
// real modules in a page.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, DAILIES, gameRow, FROZEN_IDS } from '../js/config.js';
import { minPlayersOf, chipsOf, rematchSettingsOf } from '../js/games/cartridge.js';
import { REQUIRED, OPTIONAL, checkCartridge } from '../js/games/contract.js';   // (FIXES R2 — B2 T5: the tables + the checker left the boot graph)
import { MARKS } from '../js/core/marks.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** the names a module exports, from its source (export const / function / let, export { a, b as c } [from …]) */
function exportsOf(src, dir = null) {
  const out = new Set();
  // (SHELL 2.0 B1 — THE THIN META: `export * from './meta.js'` — the meta's names count as the cartridge's)
  if (dir) for (const m of src.matchAll(/^export \* from '\.\/([\w-]+\.js)'/gm)) for (const n of exportsOf(read(`${dir}/${m[1]}`))) out.add(n);
  for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop().trim(); if (n) out.add(n); }
  // (CITY PART 1 — THE ONE META MODULE: a meta.js re-exports its row — `export const { A, B } = META.<id>;`)
  for (const m of src.matchAll(/^export\s+const\s*\{([^}]*)\}\s*=/gm)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s*:\s*/).pop().trim(); if (n) out.add(n); }
  return out;
}
const REG = read('js/games/registry.js');
const registered = [...REG.matchAll(/(\w+): \(\) => import\('\.\/(\w+)\/index\.js'\)/g)].map(m => m[2]);   // (SHELL 2.0 B1: the registry's LOADERS)
const PLAYABLE = GAMES.filter(g => g.playable).map(g => g.id);
/** THE TEN HIDDEN GAMES — EXEMPT until each comes back (WINDOWS, Nov 1: their code + data + rules FROZEN). A game that returns leaves this
 *  list in the same pass that makes it playable — and then must pass every check below. */
export const EXEMPT = FROZEN_IDS;   // (FIXES R2 — B1: config.js#FROZEN_IDS, the ONE list)
/** PW1 — THE DAILY-ONLY cartridges: never playable in a room (GAMES `daily: true`, playable false — no lobby row, no sign), NOT exempt: they
 *  meet the whole contract like a playable game (THE DAILY MODULE opens them once a day, later) */
export const DAILY_ONLY = Object.freeze(['password', 'coastclear', 'drop']);   // (THE DROP A: + THE DROP)
/** HE3 — BEING BUILT: a GAMES row with playable: false + `preview: true` (no sign, never offered; a local emulator page may start it), NOT
 *  exempt: it meets the whole contract like a playable game. It leaves this list in the pass that makes it playable (HOLD'EM: HE10). */
export const BUILDING = Object.freeze([]);   // (FREEFALL's GO-LIVE, Nov 28: it went playable — the fourth game through the whole road; the next game being built brings a row back)   // (HIGH RISE's GO-LIVE, Nov 20: it went playable — the third game through the whole road)   // (THE GO-LIVE PASS, Nov 17: JAYWALK went playable — the second game through the whole road)
const CHECKED = [...PLAYABLE, ...DAILY_ONLY, ...BUILDING];

test('every registered game is PLAYABLE (and checked), DAILY-ONLY (checked, never in a room) or EXEMPT (hidden, frozen) — never neither', () => {
  assert.deepEqual([...PLAYABLE].sort(), ['freefall', 'highrise', 'holdem', 'jaywalk', 'overclock', 'prism']);   // (HE10: + HOLD'EM · THE GO-LIVE PASS: + JAYWALK · HIGH RISE's GO-LIVE: + HIGH RISE · FREEFALL's GO-LIVE: + FREEFALL)
  for (const id of registered) assert.equal([PLAYABLE, DAILY_ONLY, EXEMPT, BUILDING].filter(l => l.includes(id)).length, 1, `${id}: exactly one of playable / daily-only / exempt / being built`);
  for (const id of BUILDING) { const g = GAMES.find(x => x.id === id); assert.ok(g && g.playable === false && g.preview === true && !g.sign, `${id}: a GAMES row, playable false, preview, NO sign (never offered)`); }
  for (const id of EXEMPT) assert.ok(!PLAYABLE.includes(id), `${id} is exempt — it isn't playable`);
  for (const id of DAILY_ONLY) { const g = DAILIES.find(x => x.id === id); assert.ok(g && g.daily === true && g.playable === false && !g.sign && !GAMES.some(x => x.id === id), `${id}: a DAILIES row (daily: true, never playable, no sign) — never a GAMES row`); assert.equal(gameRow(id), g); }
});

test('the PLAYABLE (+ DAILY-ONLY) games export every REQUIRED piece of the contract + a music choice; their mark for the sign; their GAMES row', () => {
  for (const id of CHECKED) {
    const ex = exportsOf(read(`js/games/${id}/index.js`), `js/games/${id}`);
    for (const k of Object.keys(REQUIRED)) assert.ok(ex.has(k), `${id}: exports ${k}`);
    assert.ok(ex.has('MUSIC') || ex.has('musicFor'), `${id}: MUSIC or musicFor`);
    assert.ok(MARKS[id], `${id}: its tube mark (core/marks.js) — the game start's sign`);
    const g = gameRow(id); assert.ok(g && g.name && g.theme, `${id}: its GAMES / DAILIES row`);
    assert.ok(ex.has('chatLocked') && ex.has('BANNER_NAME'), `${id}: carries its own chat lock + its banner name (LOBBY 2.0 B)`);
  }
});

test('THE CONSOLE NEVER NAMES A GAME: the room, the dock, the banner, the start, host.js, app.js, the chat\'s runtime, the podium — no game id', () => {
  const ids = registered.map(id => `'${id}'`);
  const files = ['js/app.js', 'js/host.js', 'js/room.js', 'js/store.js', 'js/screens/room-city.js', 'js/screens/room-dock.js', 'js/screens/room-guests.js',
    'js/screens/room-banner.js', 'js/screens/game-options.js', 'js/core/room-show.js', 'js/chat/chat.js', 'js/chat/ui.js', 'js/ui/final.js', 'js/games/cartridge.js', 'js/games/contract.js'];
  for (const f of files) { const s = read(f).replace(/\/\/[^\n]*/g, ''); for (const id of ids) assert.ok(!s.includes(id), `${f} names ${id}`); }
  // (THE BEFORE-LAUNCH PASS — REVIEW B2 T7: the settings sheet, HOW TO PLAY, the title's taps + the intercom too — each with TODAY's names
  //  allowed (the settings sheet's per-game rows, a frozen game's board), so a NEW game named there fails here)
  const ALLOWED = { 'js/ui/settings-panel.js': ['prism', 'holdem', 'slip', 'pulse'], 'js/ui/help.js': [], 'js/screens/title-taps.js': ['pulse'], 'js/audio/intercom.js': [] };
  for (const [f, ok] of Object.entries(ALLOWED)) { const s = read(f).replace(/\/\/[^\n]*/g, ''); for (const id of registered.filter(x => !ok.includes(x))) assert.ok(!s.includes(`'${id}'`), `${f} names '${id}'`); }
  // the chat's lock switch keeps ONLY the exempt games (the playable ones carry their own)
  const lg = read('js/chat/logic.js');
  for (const id of PLAYABLE) assert.ok(!lg.includes(`case '${id}'`), `chat/logic.js: ${id}'s lock lives in its cartridge`);
});

test('checkCartridge: a complete module passes; a missing piece, a wrong type, a daily switched on, too many chips, an option with no default — each named', () => {
  const ok = { start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, DEFAULT_SETTINGS: { mode: 'a' }, OPTIONS: [{ key: 'mode' }], estimateMinutes() {}, finalRanks() {}, MUSIC: 'x' };
  assert.deepEqual(checkCartridge('t', ok, { marks: { t: {} }, game: { name: 'T', theme: 't' } }), []);
  assert.match(checkCartridge('t', { ...ok, step: null }).join(), /step must be a function/);
  assert.match(checkCartridge('t', { ...ok, OPTIONS: {} }).join(), /OPTIONS must be a array/);
  assert.match(checkCartridge('t', { ...ok, daily: { on: true, create() {}, resumeKey() {} } }).join(), /ships OFF/);
  assert.match(checkCartridge('t', { ...ok, daily: { on: false } }).join(), /daily\.create/);
  assert.deepEqual(checkCartridge('t', { ...ok, daily: { on: false, create() {}, resumeKey() {} } }), []);
  assert.match(checkCartridge('t', { ...ok, CHAT_CHIPS: ['a', 'b', 'c', 'd', 'e'] }).join(), /CHAT_CHIPS/);
  assert.match(checkCartridge('t', { ...ok, OPTIONS: [{ key: 'speed' }] }).join(), /no DEFAULT_SETTINGS value/);
  const { MUSIC, ...noMusic } = ok; void MUSIC;
  assert.match(checkCartridge('t', noMusic).join(), /MUSIC/);
  assert.match(checkCartridge('t', ok, { marks: {} }).join(), /no tube mark/);
  // (PD-6 — TWO SOLO BUTTONS: SOLO_RUNS accepted on a SOLO game; its shape + a one-player mode checked)
  const solo = { ...ok, SOLO: true, DEFAULT_SETTINGS: { mode: 'a' }, OPTIONS: [], cleanSettings: (st, n) => ({ mode: n === 1 && st.mode === 'team' ? 'a' : st.mode }) };
  assert.deepEqual(checkCartridge('t', { ...solo, SOLO_RUNS: [{ mode: 'a', label: 'ALPHA', sub: 'ONE SONG' }, { mode: 'b', label: 'BETA' }] }), []);
  assert.match(checkCartridge('t', { ...solo, SOLO: undefined, SOLO_RUNS: [{ mode: 'a', label: 'ALPHA' }] }).join(), /SOLO_RUNS — SOLO only/);
  assert.match(checkCartridge('t', { ...solo, SOLO_RUNS: [{ mode: 'team', label: 'TEAM' }] }).join(), /SOLO_RUNS — SOLO only/);
  assert.match(checkCartridge('t', { ...solo, SOLO_RUNS: [{ label: 'NO MODE' }] }).join(), /SOLO_RUNS — SOLO only/);
  assert.match(checkCartridge('t', { ...solo, SOLO_RUNS: {} }).join(), /SOLO_RUNS \(optional\) must be a array/);
});

test('what the console reads through the plug: the minimum (MIN_PLAYERS above the app\'s, SOLO = 1), the chips, the rematch\'s settings', () => {
  assert.equal(minPlayersOf({}, 2), 2); assert.equal(minPlayersOf({ MIN_PLAYERS: 4 }, 2), 4); assert.equal(minPlayersOf({ SOLO: true, MIN_PLAYERS: 4 }, 2), 1);
  assert.deepEqual(chipsOf({ CHAT_CHIPS: ['NICE', 'GG', 'X', 'Y', 'Z'] }), ['NICE', 'GG', 'X', 'Y']); assert.deepEqual(chipsOf(null), []);
  assert.deepEqual(rematchSettingsOf({}, { a: 1 }), { a: 1 });
  assert.deepEqual(rematchSettingsOf({ rematchSettings: s => ({ ...s, seed: 2 }) }, { a: 1 }), { a: 1, seed: 2 });
  // wired: host.js + the options sheet use the minimum; the chat asks the game; app.js sets its chips; the start warms + preloads it
  assert.match(read('js/host.js'), /minPlayersOf\(mod, MIN_PLAYERS\)/);
  assert.match(read('js/screens/game-options.js'), /minPlayersOf\(mod, MIN_PLAYERS\)/);
  assert.match(read('js/chat/chat.js'), /chatLocked\(g, state\.uid, live, mod && mod\.chatLocked\)/);
  assert.match(read('js/app.js'), /setGameChips\(C\.chipsOf\(metaOf\(id\)\)\)/);
  assert.match(read('js/screens/room-city.js'), /mod\.createView\.warm\(\)/);
  assert.match(read('js/screens/room-city.js'), /mod\.preload\(\{ settings:/);
  assert.match(read('js/games/lazy-view.js'), /createView\.warm = \(\) =>/);
});

// ---- SHELL 2.0 B1 — THE THIN META + LAZY LOGIC (D1): the registry imports ONLY the playable games' meta.js at boot; a game's cartridge
//      loads on demand; the meta is pure (no DOM, no logic) and is what index.js + logic.js export (one source)
test("THE THIN META: the registry's static imports are the meta files only; every game loads by id; the meta = the cartridge's values", async () => {
  const statics = [...REG.matchAll(/^import .* from '(\.\/[^']+)'/gm)].map(m => m[1]);
  assert.deepEqual(statics.filter(s => /\/(index|logic|director|view)\.js$/.test(s)), [], 'no game code imported statically');
  // (CITY PART 1 — THE ONE META MODULE: the registry imports js/games/metas.js alone — a ROW for each playable game, a new game = a row)
  assert.deepEqual(statics.filter(s => /meta/.test(s)), ['./metas.js'], 'the boot’s game data = ONE module');
  const { META: ROWS } = await import('../js/games/metas.js');
  assert.deepEqual(Object.keys(ROWS).sort(), [...PLAYABLE, ...BUILDING].sort(), 'a row for every playable game + any being built (FREEFALL F4A: a hidden row — THE ONE META MODULE; playable since its GO-LIVE), no other');
  assert.equal(registered.length, 19);   // (FREEFALL F4A: + FREEFALL, being built)   // (HIGH RISE S4A: + HIGH RISE, being built)   // (HE3: + HOLD'EM, being built; THE DROP A: + THE DROP — daily-only; JAYWALK H1: + JAYWALK, being built)
  for (const id of CHECKED) {
    const meta = read(`js/games/${id}/meta.js`);
    if (PLAYABLE.includes(id) || BUILDING.includes(id)) assert.ok(meta.includes("import { META } from '../metas.js';\n") && meta.trimEnd().endsWith(`} = META.${id};`) && /^export const \{[^}]+\} = META\.\w+;$/m.test(meta), `${id}/meta.js = its ROW of metas.js (CITY PART 1)`);
    else assert.doesNotMatch(meta, /^import /m, `${id}/meta.js imports nothing (pure + tiny)`);
    assert.ok(meta.length < 4000, `${id}/meta.js stays thin (${meta.length} bytes)`);
    const M = await import(`../js/games/${id}/meta.js`), L = await import(`../js/games/${id}/logic.js`);
    // (FREEFALL F4A: its logic.js is the pure RULES' file the lab + the test page load — it never imports the console's meta; its ONE source
    //  is the cartridge's own `export * from './meta.js'`)
    if (id === 'freefall') assert.match(read(`js/games/${id}/index.js`), /^export \* from '\.\/meta\.js';$/m, `${id}: index.js re-exports the meta (one source)`);
    else for (const k of ['DEFAULT_SETTINGS', 'chatLocked']) assert.equal(L[k], M[k], `${id}: logic.js ${k} IS the meta one (one source)`);
    for (const k of ['OPTIONS', 'estimateMinutes', 'BANNER_NAME', 'chatLocked']) assert.ok(k in M, `${id}: meta carries ${k}`);
    assert.ok('MUSIC' in M, `${id}: meta carries MUSIC`);
  }
});
test("THE BOOT BYTES: no game's logic in the title's static graph (scripts/boot-bytes.mjs) — was ~297 KB of js/games", async () => {
  const { bootGraph } = await import('../scripts/boot-bytes.mjs');
  const g = bootGraph(), games = g.rows.filter(r => r.f.startsWith('js/games/') && !/\/(meta|metas|registry|cartridge|lazy-view)\.js$|\/kit\/|^js\/games\/pulse\/clock\.js$/.test(r.f));   /* (CITY PART 1: + metas.js — THE ONE META MODULE) */   // (pulse/clock.js = the console's shared audio clock — audio/synced-songs.js)
  assert.deepEqual(games.map(r => r.f), [], "only the metas + the console's own game files at boot");
  // (PD-6 — a NAMED raise, 34 → 36 KB: the contract's SOLO_RUNS check + PRISM DROP's solo list, +0.9 KB — 67 bytes of headroom was left; still no game logic)
  // (FIXES R2 — B2 T5, a named LOWERING 36 → 30 KB: cartridge.js split — its tables + the checker left boot (35.0 → 26.2 KB); JAYWALK's meta fits)
  // (CITY PART 1 — THE ONE META MODULE: the five metas → one module: 29.5 → 25.0 KB, 308 → 304 boot modules — the room for the next go-lives)
  assert.ok(g.games < 30 * 1024, `js/games at boot: ${(g.games / 1024).toFixed(1)} KB`);
});
