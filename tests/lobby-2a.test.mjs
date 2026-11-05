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

import { roomSlots, roomRects, ROOM } from '../js/core/harbor-room.js';
import { roomOrder, pickLine } from '../js/core/room-lines.js';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { keyPopDecide } from '../js/core/keypop.js';
import { statSync } from 'node:fs';

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
  assert.ok(LAB_V['card-century'] >= 3); assert.equal(LAB_V['full-card-century'], 3);   // (SHELL 2.0 B2: the strip v4 — its sun moved middle-right)
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
  assert.match(sp, /label: 'Use this card on another device'/); assert.match(sp, /icon: 'key', ic: '#3ff0ff', label: 'Restore your account'/);   // (SHELL 2.0 A: THE ROW — RESTORE keeps its cyan + its key)   // (LOBBY 2.0 B: + its key icon)
  assert.match(sp, /tubeButton\('NEW KEY', \{ kind: 'danger', size: 'sm', cls: 'pf-newkey'/); assert.match(sp, /'TAP AGAIN — THE OLD KEY STOPS WORKING'/);
  // EDIT PROFILE: NAME › + COLOUR › real rows, each its own sheet (back = one step)
  // (LOBBY FIXES — the owner's ADD-ON 3: NAME + COLOUR = two rows at CUSTOMIZE's top, each its editor (profile/edit.js); the card's ✎ the
  //  same name editor; NOTHING in ACCOUNT)
  const dr = read('js/vault/dress.js'), ed = read('js/profile/edit.js');
  // (THE SPEED PASS — the owner's FINAL, Nov 4 6:25 pm: ONE "EDIT USERNAME" row at the VERY TOP → ONE editor (the name + the colour); no
  //  COLOUR row; no ✎ on the card)
  assert.match(dr, /cls: 'vl-yr-row vl-yr-name', attrs: \{ 'aria-label': 'Edit your username and colour' \},\n\s+onClick: \(\) => openYouEditor\(/);   // (SHELL 2.0 A: THE ROW)
  assert.match(dr, /label: 'Edit username'/); assert.doesNotMatch(dr, /vl-yr-colour|openColourEditor/, 'no separate COLOUR row');
  assert.match(dr, /h\('h2', 'CUSTOMIZE'\)\),\s*youRows,\s*pin,/, 'the row sits at the VERY TOP, above the slim preview');
  assert.match(ed, /export async function openYouEditor/); assert.match(ed, /title: 'EDIT USERNAME'/); assert.match(ed, /pf-swatches/);
  assert.doesNotMatch(sp, /pf-pen|openNameEditor/, 'no ✎ on the card'); assert.doesNotMatch(sp, /pf-er-name|pf-er-colour/, 'no rows in ACCOUNT');
  assert.match(ed, /'This name shows on the public board — don’t use your full real name\.'/);
  // (SHELL 2.0 A: the profile's sheets ARE THE SHEET — ui/sheet.js; the one Esc in ui/layers.js closes the TOP layer only)
  const sh = read('js/ui/sheet.js');
  assert.match(sh, /back\.addEventListener\('click', close\)/); assert.match(read('js/ui/layers.js'), /const top = open\[open\.length - 1\];/, 'Esc closes the TOP layer only');
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
  assert.match(read('js/profile/bring.js'), /h\('button\.btn\.btn-ghost\.btn-sm', \{ type: 'button', 'data-act': 'copy'/, 'COPY / SHARE as quiet tubes (no reflective gold — SHELL 2.0 A)');
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
  assert.match(s, /if \(showKey !== bxf\.shown\) \{ boardSnap\(\); bxf\.shown = showKey; \}/, 'a fade only when what the board shows changes (a re-layout of the same message is no swap)');
  assert.match(s, /id: 'roofboard-xf', z: 3/);
  assert.match(s, /Math\.abs\(cms - speakMemo\.cms\) < 60e3/, 'the facade memo keyed to the city clock (the holiday-night jump)');
  assert.match(read('js/screens/harbor/neon.js'), /let envD = dil\.get\(dr\); if \(!envD\) \{ envD = dilate\(env, dr\); dil\.set\(dr, envD\); \}/);
  assert.ok(existsSync(new URL('../scripts/busy-pc.mjs', import.meta.url)));
  assert.match(read('scripts/busy-pc.mjs'), /os\.cpus\(\)/);
  assert.ok(readdirSync(new URL('./integration/harbor-e2e/', import.meta.url)).includes('lobby.mjs'));
});

// ---------------------------------------------------------------- Groups 1–3 + the ADD-ON

test('THE ROOM IN THE CITY — TWO LINES OF 4 at the door (the real numbers at 390 / 402 / 430): the left in front of the barbershop, the right clear of the compass + the cart, on the walkable floor', () => {
  for (const [W, H] of [[390, 844], [402, 874], [430, 932]]) {
    const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top: 62, bottom: 34 }), L = harborLayout(cam), S = roomSlots(L), s = L.speakeasy;
    const poleX = s.x0 + s.shop.pole.u, doorL = s.x0 + s.door.u0, doorR = s.x0 + s.door.u1, m = L.medallion, c = L.cart;
    const left = Object.values(S).filter(x => x.side === 'left'), right = Object.values(S).filter(x => x.side === 'right');
    assert.equal(left.length, 4); assert.equal(right.length, 4);
    assert.ok(left.every(x => x.x < poleX && x.x < doorL), `${W}: the left line in front of the barbershop, from the pole back`);
    assert.ok(right.every(x => x.x > doorR + 0.9), `${W}: the right line right of the door (the doorman's spot clear)`);
    for (const x of right) assert.ok(Math.hypot(x.x - m.x, x.z - m.z) > (m.r || 1.8) + 0.6, `${W}: ${x.id} clear of the compass`);
    for (const x of Object.values(S)) assert.ok(Math.hypot(x.x - c.x, x.z - c.z) > 3, `${W}: ${x.id} clear of the cart`);
    for (const x of Object.values(S)) assert.ok(x.z > 38.75 && x.z < 44, `${W}: ${x.id} on the walkable floor`);
    const xEdge = z => (16 - cam.VPX) * z / cam.F;
    assert.ok(left.every(x => x.x - 0.3 > xEdge(x.z)), `${W}: the left line's back on screen`);
    assert.equal(roomRects(L).length, 2, 'two solids');
  }
  assert.ok(ROOM.gapL >= 1.2 && ROOM.gapR >= 1.1, 'room for an emblem over each head (~16–17 pt apart)');
});

test('WHO STANDS WHERE: the host first by the door; each keeps their line (ln, picked once: the shorter line); a leave = step up in THEIR line; no ln = taking turns; at most 4 a line', () => {
  const P = { h: { joinedAt: 1, ln: 'L' }, a: { joinedAt: 2, ln: 'R' }, b: { joinedAt: 3, ln: 'L' }, c: { joinedAt: 4, ln: 'R' } };
  assert.deepEqual(roomOrder(P, 'h').map(o => o.slot), ['L0', 'R0', 'L1', 'R1']);
  const { a, ...noA } = P; void a;
  assert.deepEqual(Object.fromEntries(roomOrder(noA, 'h').map(o => [o.uid, o.slot])), { h: 'L0', b: 'L1', c: 'R0' }, 'c steps up in the right line — b never crosses');
  assert.deepEqual(roomOrder({ x: { joinedAt: 1 }, y: { joinedAt: 2 }, z: { joinedAt: 3 } }, 'x').map(o => o.slot), ['L0', 'R0', 'L1'], 'no ln: the shorter line at each turn');
  assert.equal(pickLine({}, 'me'), 'L', 'the first in an empty room (the host): the left');
  assert.equal(pickLine({ h: { joinedAt: 1, ln: 'L' } }, 'me'), 'R');
  assert.equal(pickLine({ h: { joinedAt: 1, ln: 'L' }, a: { joinedAt: 2, ln: 'R' } }, 'me'), 'L', 'a tie → the left (L0, R0, L1, R1 …)');
  const full = Object.fromEntries([...'abcdefgh'].map((u, i) => [u, { joinedAt: i, ln: 'L' }]));
  const o = roomOrder(full, 'a'); assert.equal(o.filter(x => x.side === 'left').length, 4, 'a full line sends the rest across'); assert.equal(o.length, 8);
  assert.match(read('js/room.js'), /set\(dbRef\(`\$\{R\(code\)\}\/players\/\$\{state\.uid\}\/ln`\), ln\)\.catch\(\(\) => \{\}\);/, 'a separate write — a join never depends on it');
  assert.match(read('database.rules.json'), /"ln": \{\s*"\.validate": "newData\.isString\(\) && \(newData\.val\(\) === 'L' \|\| newData\.val\(\) === 'R'\)"/);
});

test('THE ROOM IN THE CITY — the wiring: City 2.0 rooms stay on the title (the city never reloads; a refresh waits for the module); the room dock; the tags + the ring; the lying pose; the sounds', () => {
  const app = read('js/app.js');
  assert.match(app, /return harborPending\(\) \? 'boot' : 'title';/);   // (CITY 1.0 OUT: the only route for a room — the old lobby screen is gone)
  const t = ['title', 'title-taps', 'title-neon', 'title-dock'].map(f => read(`js/screens/${f}.js`)).join(String.fromCharCode(10));   // (CITY 1.0 OUT: the title in four files)
  assert.match(t, /import\('\.\/room-city\.js'\)/); assert.match(t, /if \((?:T\.)?roomUi\) \{ armIdle\(\); return; \}/, 'the dock stays up in a room');
  const d = read('js/screens/room-dock.js');
  for (const w of ["'INVITE'", "'YOU'", "'GUESTS'", "'GAMES'", "'CHAT'", "'PLAY'", "'WAITING'"]) assert.ok(d.includes(w), w);
  assert.match(d, /createDock\(/, 'THE FLANK restyled — the title dock\'s own markup');
  const rc = read('js/screens/room-city.js');
  assert.match(rc, /T\.el\.style\.transform = `translate3d\(/, 'the tags move by transform');
  assert.match(rc, /el\.addEventListener\('pointerup'/, 'a tap on a figure: pointerdown + pointerup');
  { const fr = rc.slice(rc.indexOf('  function frame() {'), rc.indexOf('\n  }\n', rc.indexOf('  function frame() {')));   // (LOBBY 2.0 B: the start's push reads the door's box ONCE — the loop itself never)
    assert.ok(fr.length > 200); assert.doesNotMatch(fr, /getBoundingClientRect|clientWidth|offsetWidth/, 'no layout reads in the frame loop'); }
  const pp = read('js/screens/harbor/people.js');
  assert.match(pp, /function drawRing\(c, cam, st, col, a = 1\)/); assert.match(pp, /pose: 'lie', lieK: lie/);
  assert.match(read('js/screens/harbor/folk.js'), /c\.rotate\(\(it\.s\.lieDir \|\| 1\) \* \(Math\.PI \/ 2\) \* lieK\)/);
  for (const n of ['card-in', 'invite', 'friend']) { const st = statSync(new URL(`../audio/sfx/lb-${n}.mp3`, import.meta.url)); assert.ok(st.size > 1000 && st.size < 40000, `lb-${n}.mp3 small (${st.size} B)`); }
  assert.match(read('js/audio/lobby-sfx.js'), /if \(!isUnlocked\(\) \|\| !LB_SOUNDS\.includes\(name\)\) return false;/, 'silent works');
  assert.match(read('js/ui/credits.js'), /855977/);
});

test('TYPING BUBBLES + THE CHAT FIX: the bubble from the chat\'s typing data (no words); ONE size, slid up by a transform; the quick replies + a game\'s own', () => {
  const rc = read('js/screens/room-city.js');
  assert.match(rc, /const on = uid !== st\.uid && ty\[uid\] && now - ty\[uid\] < 6000;/);
  assert.match(rc, /h\('span\.rc-bubble', \{ 'aria-hidden': 'true' \}, h\('i'\), h\('i'\), h\('i'\)\)/, 'three dots, no text');
  const css = read('css/chat.css');
  assert.match(css, /height: clamp\(380px, 56dvh, 520px\);/); assert.match(css, /\.sh\.chat-sheet\.is-in \.sh-panel \{ transform: translateY\(calc\(0px - var\(--lift\)\)\);/);   // (SHELL 2.0 A: on THE SHEET's panel)
  assert.doesNotMatch(css, /\.chat-sheet\.has-kb \{ height:/, 'no resize on the keyboard');
  const ui = read('js/chat/ui.js');
  assert.ok(ui.includes("export const QUICK = Object.freeze(['GG', 'NO WAY', 'REMATCH?', '\u{1F525}', '\u{1F602}', '\u{1F44F}']);"), 'the six quick replies');
  assert.match(ui, /export function setGameChips\(list\)/);
});

test('THE SAVE-YOUR-KEY POP-UP (the ADD-ON): once for a key not saved + a counted match; saved → never; LATER → the dot; a new player after match 1', () => {
  assert.equal(keyPopDecide({ key: 'K', saved: false, kp: null, matches: 2 }), 'show', 'a returning player, not saved');
  assert.equal(keyPopDecide({ key: 'K', saved: true, kp: null, matches: 9 }), 'none', 'saved → never');
  assert.equal(keyPopDecide({ key: 'K', saved: false, kp: 'later', matches: 3 }), 'dot', 'LATER → the dot, no pop');
  assert.equal(keyPopDecide({ key: 'K', saved: false, kp: 'shown', matches: 3 }), 'dot', 'shown once — closing it any way = the dot');
  assert.equal(keyPopDecide({ key: 'K', saved: false, kp: null, matches: 0 }), 'none', 'a new player before a counted match');
  assert.equal(keyPopDecide({ key: 'K', saved: false, kp: null, matches: 1 }), 'show', '…right after the first');
  assert.equal(keyPopDecide({ key: null, saved: false, matches: 5 }), 'none', 'no key on this device');
  const app = read('js/app.js');
  assert.match(app, /k\.maybeKeyPop\(\{ why: 'match' \}\)/); assert.doesNotMatch(app, /shouldPromptKey\(\)/, 'the old 3rd / 10th-match reminder retired');
  assert.match(read('js/profile/keypop.js'), /'\.pg-moment, \.modal:not\(\.out\), \.sh:not\(\.is-out\)/, 'never over the moment, a sheet');
});
