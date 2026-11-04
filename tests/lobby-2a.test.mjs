// LOBBY 2.0 A (Nov 3 — docs/harbor/passes/lobby-2a.md): the quick checks (node --test, no browser). Group 0 — the owner's 2C review + the
// small fixes: CENTURY without flames, THE STEPPED PLATE, FOUNDER's glint, EQUIP not wear, THE PROFILE POLISH (header, order, goal tile,
// the pink tube, ONE key block, the pop-ups one step at a time), every weekly goal possible, REAL USERNAMES, THE REPORT PUSH, THE
// BILLBOARD's cross-fade, THE BUSY-PC CHECK. (The browser checks: e2e-harbor `billboard`, the profile E2E; /api: server.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { FX } from '../js/fx/index.js';
import { LAB_V } from '../js/vault/catalog.js';
import { LAB_CHANGES, LAB_TEXT } from '../api/_lib/lab-text.js';
import { weeklyGoal } from '../js/core/ranks.js';
import { GOAL_GAMES, BOARD_GAMES } from '../js/core/boards.js';
import { GAMES } from '../js/config.js';
import { weekKey } from '../js/core/week.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('CENTURY: NO FLAMES — the bronze deco sunburst + embers (INFERNO keeps the fire); v3 + its CHANGED lines; no two cards share a main motif', () => {
  const ix = read('js/fx/index.js');
  assert.match(ix, /century: combo\('century', 'epic', \[deco, null\], \[embers, \{ noBed: true/);
  assert.doesNotMatch(ix, /century: combo\('century', 'epic', \[flames/);
  assert.ok(FX.deco && FX.century, 'the deco effect is registered');
  const d = read('js/fx/deco.js');
  assert.match(d, /sprite\('fx-deco-burst'/, 'the burst baked ONCE (one drawImage a frame)');
  const code = d.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  assert.doesNotMatch(code, /import[^\n]*(fire|flames|lick)|lick\(/, 'no flame painters in it');
  assert.equal(LAB_V['card-century'], 3); assert.equal(LAB_V['full-card-century'], 3);
  for (const id of ['card-century', 'full-card-century']) assert.ok(LAB_CHANGES[id].some(c => c.v === 3 && /SUNBURST/.test(c.what)), id);
  assert.match(LAB_TEXT['card-century'].motion, /sunburst/i); assert.doesNotMatch(LAB_TEXT['card-century'].motion, /flame/i);
  assert.match(read('js/vault/strip.js'), /'card-inferno': \{ mat: 'inferno', fx: 'flames' \}/, 'INFERNO keeps its fire');
  // (each card's strip effect: the flames belong to INFERNO alone among the epics + rares now)
  const looks = read('js/vault/strip.js'), flameCards = [...looks.matchAll(/'(card-[a-z0-9-]+)': \{ mat: '[a-z0-9-]+', fx: 'flames'/g)].map(m => m[1]);
  assert.deepEqual(flameCards, ['card-inferno']);
});

test('THE STEPPED PLATE: full width on the NAME row, the LEVEL row past "LV n" only — a clip measured by ONE ResizeObserver (never a frame loop); short names unchanged', () => {
  const s = read('js/vault/strip.js');
  assert.match(s, /stepPlate\(plate\);/);
  assert.match(s, /stepRO = new ResizeObserver/);
  assert.match(s, /if \(W - x2 < STEP_MIN/, 'a tiny step → the plate as it was');
  assert.match(s, /plate\.style\.clipPath = `path\(/);
  assert.match(s, /A \$\{f\(r\)\} \$\{f\(r\)\} 0 0 0 \$\{x2\}/, 'the rounded INNER corner');
  assert.doesNotMatch(s, /requestAnimationFrame\(.*layStep/);
  assert.match(read('css/vault.css'), /\.vl-lv \{ align-self: flex-start; \}/, 'the level row measured by its text');
});

test('FOUNDER: bigger + bolder + a GLINT (transform + opacity only; reduced motion = still)', () => {
  for (const [f, sel, kf] of [['css/vault.css', '.vl-fc-fd::after', 'vl-fd-glint'], ['css/progress.css', '.pg-card-fd::after', 'pg-fd-glint']]) {
    const c = read(f);
    assert.ok(c.includes(sel), `${f}: the glint`);
    const k = c.slice(c.indexOf(`@keyframes ${kf}`)); const body = k.slice(0, k.indexOf('}\n') + 2);
    assert.doesNotMatch(body, /box-shadow|filter|left:|width:/, `${kf} animates transform + opacity only`);
    assert.match(c, new RegExp(`prefers-reduced-motion: reduce\\) \\{ ${sel.replace(/[.:]/g, m => `\\${m}`)} \\{ animation: none`));
  }
  assert.match(read('css/vault.css'), /\.vl-fc-fd \{ font-weight: 900;/);
  assert.match(read('css/progress.css'), /\.pg-card-fd \{ right: 6%; top: 18\.5%;[^}]*font: 900/);
});

test('EQUIP, NOT WEAR: no "wear / wearing / worn" in anything a player reads (labels, ARIA, toasts, the lab, CSS content)', () => {
  const files = ['js/progress/trophies.js', 'js/vault/dress.js', 'js/vault/picker.js', 'js/vault/lab-views.js', 'js/screens/profile.js', 'js/progress/profile.js', 'css/progress.css', 'css/vault.css', 'api/_lib/lab-text.js'];
  for (const f of files) {
    const strings = [...read(f).matchAll(/'([^'\n]*)'|`([^`\n]*)`|content: '([^']*)'/g)].map(m => m[1] || m[2] || m[3] || '').filter(x => !/^[a-z0-9_.\-/]+$/i.test(x));
    for (const s of strings) assert.doesNotMatch(s, /\b(WEAR|WEARING|WORN|Wear|Wearing|wear it|to wear)\b/, `${f}: "${s}"`);
  }
  assert.match(read('js/progress/trophies.js'), /'EQUIPPED ✓' : 'TAP TO EQUIP'/);
  assert.match(read('js/progress/trophies.js'), /'tap a reward to equip it'/);
});

test('THE PROFILE POLISH: only ‹ BACK + the music mute; the page order; NOT YET PLAYED gone; the goal tile; the pink tube; ONE key block; pop-ups one step at a time', () => {
  const sp = read('js/screens/profile.js');
  assert.doesNotMatch(sp, /'MEMBERSHIP'/, 'no MEMBERSHIP title');
  assert.match(read('css/components.css'), /body\.pf-on \.menu-btn \{ display: none !important; \}/, 'the ☰ leaves the corner on the profile');
  assert.match(sp, /document\.body\.classList\.add\('pf-on'\)/); assert.match(sp, /document\.body\.classList\.remove\('pf-on'\)/);
  assert.doesNotMatch(sp, /NOT PLAYED YET/);
  // the account: ONE key block, the two big glass buttons, NEW KEY small + red + a second tap
  assert.match(sp, /h\('div\.pf-kb',/); assert.doesNotMatch(sp, /saveBox\(\)/, 'no second "YOUR KEY IS SAVED" panel');
  assert.match(sp, /h\('b', 'USE THIS CARD ON ANOTHER DEVICE'\)/); assert.match(sp, /h\('b', 'RESTORE YOUR ACCOUNT'\)/);
  assert.match(sp, /button\.pf-gb\.pf-gb-sm\.is-danger\.pf-newkey/); assert.match(sp, /'TAP AGAIN — THE OLD KEY STOPS WORKING'/);
  // EDIT PROFILE: NAME › + COLOUR › real rows, each its own sheet (back = one step)
  assert.match(sp, /pf-er-name', \{ type: 'button', onclick: \(\) => openNameEditor\(paint\) \}/);
  assert.match(sp, /pf-er-colour', \{ type: 'button', onclick: \(\) => openColourEditor\(paint\) \}/);
  assert.match(sp, /'This name shows on the public board — don’t use your full real name\.'/);
  const sh = read('js/profile/sheets.js');
  assert.match(sh, /back\.addEventListener\('click', close\)/); assert.match(sh, /stack\[stack\.length - 1\]\.close\(\)/, 'Esc closes the TOP sheet only');
  assert.match(sh, /if \(dy > 90 \|\| \(dy > 24 && v > 0\.6\)\) close\(\)/, 'a swipe down closes');
  // the order of the sections + the goal tile + the trophies' LATEST 3 + the trophy case
  const pr = read('js/progress/profile.js');
  assert.match(pr, /const els = \[level, goal, stats, ach, album, favor\]/);
  assert.match(pr, /h\('div\.pg-bar\.pg-bar-tube'/); assert.doesNotMatch(pr, /pg-bar-gold/, 'the level bar leaves gold');
  assert.match(pr, /'THIS WEEK’S GOAL'/); assert.match(pr, /'CLAIMED ✓'/);
  const tr = read('js/progress/trophies.js');
  assert.match(tr, /export const LATEST = 3, NEW_MS = 48 \* 3600e3;/); assert.match(tr, /`ALL ACHIEVEMENTS · \$\{held\.length\}`/); assert.match(tr, /title: 'THE TROPHY CASE'/);
  assert.match(read('js/progress/album-view.js'), /`ALL SIGHTINGS · \$\{newest\.length\}`/);
  const css = read('css/progress.css');
  assert.match(css, /\.pf-goal-t \{[^}]*rgba\(95, 232, 255, 0\.75\)/, 'the goal tile: a neon-cyan edge');
  assert.match(css, /\.pg-bar-tube \.pg-bar-had \{[^}]*#ff4fb8/, 'the level bar: the sign\'s hot pink');
  assert.match(read('css/bring.css'), /\.byc-btn\.byc-glass \{/, 'COPY / SHARE in glass (no reflective gold)');
});

test('EVERY WEEKLY GOAL IS POSSIBLE: the playable games only (the server + the phone the same), a variety week → Play 8 with fewer than 5', () => {
  const playable = GAMES.filter(g => g.playable !== false).map(g => g.id);
  assert.deepEqual(GOAL_GAMES, BOARD_GAMES.filter(id => playable.includes(id)));
  for (let i = 0; i < 104; i++) {
    const g = weeklyGoal(weekKey(Date.UTC(2026, 10, 2) + i * 7 * 864e5), GOAL_GAMES);
    if (g.kind === 'game') assert.ok(playable.includes(g.game), `${g.game} is playable`);
    assert.ok(!(g.kind === 'variety' && GOAL_GAMES.length < 5), 'no impossible variety week');
  }
  assert.equal(weeklyGoal('w20261102', GOAL_GAMES).text, 'Play 8 matches', 'this week unchanged');
  assert.match(read('js/core/progress.js'), /weeklyGoal\(wk, GOAL_GAMES\)/, 'the server counts the same goal');
});

test('REAL USERNAMES on THE BOARD (BNAME\'s nicknames retired — kept only to stand in for a rude name); the report push; the sign-up line', () => {
  const lb = read('api/_lib/lb.js');
  assert.match(lb, /export const publicName = \(id, n\) => \(n && !isOffensive\(n\) \? String\(n\) : houseNick\(id\)\.n\);/);
  assert.match(lb, /return \{ id, n: publicName\(id, p\.n\), a: p\.a, c: p\.c, r: p\.r \|\| 0, l: p\.l \|\| levelOf\(p\.x \|\| 0\) \};/, 'the username — no tag, no pid');
  assert.doesNotMatch(read('js/board/view.js'), /fmtTag/, 'no tag digits on a row');
  const b = read('api/board.js');
  assert.match(b, /notifyOwner\(\{ title: why === 'name' \? 'Name reported' : 'Score reported', body: `\$\{why === 'name' \? 'Name' : 'Score'\} reported: \$\{row\.n\} — /);
  assert.match(b, /url: '\/admin#reports'/); assert.match(b, /cur > now - 3600e3 \? undefined : now/, 'one push a row an hour');
  assert.match(read('js/screens/setup.js'), /'This name shows on the public board — don’t use your full real name\.'/);
});

test('THE BILLBOARD CROSS-FADES (opacity only; reduced motion a quick fade; nothing before the reveal) + THE BUSY-PC CHECK + the old harbor reds', () => {
  const s = read('js/screens/harbor/scene.js');
  assert.match(s, /const BXF_MS = 900, BXF_RM_MS = 250;/);
  assert.match(s, /function boardSnap\(\) \{\n    if \(shownAt < 0\) return;/);
  assert.match(s, /boardSnap\(\);\n        if \(hint\) neon\.billboard/);
  assert.match(s, /id: 'roofboard-xf', z: 3/);
  assert.match(s, /Math\.abs\(cms - speakMemo\.cms\) < 60e3/, 'the facade memo keyed to the city clock (the holiday-night jump)');
  assert.match(read('js/screens/harbor/neon.js'), /let envD = dil\.get\(dr\); if \(!envD\) \{ envD = dilate\(env, dr\); dil\.set\(dr, envD\); \}/);
  assert.ok(existsSync(new URL('../scripts/busy-pc.mjs', import.meta.url)));
  assert.match(read('scripts/busy-pc.mjs'), /os\.cpus\(\)/);
  assert.ok(readdirSync(new URL('./integration/harbor-e2e/', import.meta.url)).includes('lobby.mjs'));
});
