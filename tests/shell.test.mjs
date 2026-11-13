// SHELL 2.0 A — ONE LOOK EVERYWHERE: THE NEON TUBE, THE SHEET, THE ROW, THE MESSAGE are each ONE builder + ONE block of CSS; no screen keeps
// its own copy. The ☰ menu, the dock's labels + streak pill, the full card's tier gem + THE 1-OF-1 BADGE, THE PODIUM's FRAME + finalScene,
// THE CHAT LOCK. (The browser half: tests/integration/harbor-e2e/lobbyfix.mjs G('shell').)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
// the ten FROZEN games (WINDOWS, Nov 1 — their code untouched until each comes back) are not audited
const FROZEN = /js\/games\/(cipher|signal|bluff|pulse|golf|slip|gridlock|agent|stakes|rum)\//;
function walk(dir, ext, out = []) {
  for (const n of readdirSync(new URL(`../${dir}`, import.meta.url))) {
    const p = `${dir}/${n}`;
    if (statSync(new URL(`../${p}`, import.meta.url)).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}
const JS = walk('js', '.js').filter(f => !FROZEN.test(f));
const CSS = walk('css', '.css').filter(f => !/css\/(cipher|signal|bluff|pulse|golf|slip|gridlock|agent|stakes|rum)\.css$/.test(f));

test('ONE SHEET: no screen builds its own .modal / .sheet pop-up — every sheet is ui/sheet.js#openSheet', () => {
  const bad = JS.filter(f => f !== 'js/ui/sheet.js' && /h\(['`]div\.modal\b/.test(read(f)));
  assert.deepEqual(bad, [], `own .modal roots: ${bad.join(', ')}`);
  const sh = read('js/ui/sheet.js');
  assert.match(sh, /takeLayer\(el, \{ close \}\)/, 'on THE LAYER STACK with its close (the one Esc)');
  assert.match(sh, /h\('button\.sh-back'/); assert.match(sh, /h\('button\.sh-x'/); assert.match(sh, /h\('div\.sh-grip'/);
  assert.match(read('js/profile/sheets.js'), /return openSheet\(o\);/, 'openPfSheet IS the sheet');
  // SOLID (nothing behind reads through — the EDIT USERNAME ghost-text bug): an opaque panel, no blur
  const c = read('css/components.css');
  const panel = c.slice(c.indexOf('.sh-panel {'), c.indexOf('}', c.indexOf('.sh-panel {')));
  assert.match(panel, /background: linear-gradient\(180deg, #1c1932 0, #14112a 120px, #0f0d20 100%\)/);
  assert.doesNotMatch(panel.match(/\n\s*background: [^;]*;/)[0], /rgba|transparent/, 'the panel is opaque'); assert.doesNotMatch(panel, /backdrop-filter/);
});

test('ONE Esc: ui/layers.js owns the only Escape listener (a pop-up never listens for it; inputs keep their own field-level keys)', () => {
  const allow = new Set(['js/ui/layers.js', 'js/screens/title-dock.js', 'js/screens/harbor/remote.js']);
  const bad = JS.filter(f => !allow.has(f) && /['"]Escape['"]/.test(read(f)));
  assert.deepEqual(bad, [], `own Esc handlers: ${bad.join(', ')}`);
  const L = read('js/ui/layers.js');
  assert.match(L, /const top = open\[open\.length - 1\];/); assert.match(L, /if \(top\.close\) top\.close\(\)/);
  // review-6.md H2: the five body-level pop-ups on the stack (the flying photo is a corner chip, not a pop-up)
  assert.match(read('js/progress/streak-card.js'), /takeLayer\(el, \{ close: \(\) => close\(\), min: 9000 \}\)/);
  assert.match(read('js/progress/sighting.js'), /takeLayer\(modal, \{ close:/);
  assert.match(read('js/progress/album-view.js'), /takeLayer\(el, \{ close, min: 9200 \}\)/);
  assert.match(read('js/progress/preview.js'), /takeLayer\(shell, \{ min: 9000 \}\)/);
  assert.match(read('js/screens/harbor/radio.js'), /rdRelease = takeLayer\(modal, \{ close:/);
  assert.match(read('js/profile/keypop.js'), /\.sg-fly, \.pg-sc, \.pg-pv, \.sg-big'/, 'H1: the key pop-up never lands on a card');
});

test('THE NEON TUBE: one .btn block in components.css (MAIN pink · SECONDARY cool white · DANGER red · SMALL 44 · disabled unlit · the confirm red); no screen styles its own action buttons', () => {
  const c = read('css/components.css');
  for (const r of ['.btn-primary { --tc: var(--tube-pink);', '.btn-ghost { --tc: var(--tube-white);', '.btn-danger { --tc: var(--tube-red);', '.btn-sm { min-height: 44px;', '.btn.is-confirm, .sh-row.is-confirm {'])
    assert.ok(c.includes(r), r);
  assert.equal((c.match(/^\.btn \{/gm) || []).length, 1, 'ONE .btn base');
  assert.doesNotMatch(c, /clip-path: polygon\(var\(--cut\)/, 'the chamfered buttons are gone');
  assert.doesNotMatch(c, /body\.nd-glass \.btn-primary|\.sheet \.btn-primary/, 'NEON GLASS kept no button copy');
  for (const f of CSS.filter(x => x !== 'css/components.css')) assert.doesNotMatch(read(f), /^\.btn(-primary|-ghost|-danger)? \{/m, `${f} restyles the tube`);
  // the glows are STATIC: the tube never animates box-shadow
  const tube = c.slice(c.indexOf('/* ---- THE NEON TUBE'), c.indexOf('/* ---- THE SHEET'));
  assert.doesNotMatch(tube, /transition:[^;]*box-shadow|@keyframes/);
  // the retired button looks: the gold plates + the old glass buttons
  for (const [f, re] of [['css/vault.css', /\.vl-dp-go \{ display: block/], ['css/progress.css', /\.pf-gb\b/], ['css/progress.css', /background: var\(--pg-foil\); color: #1d1405/], ['css/admin.css', /\.ad-btn\.is-primary/], ['css/bring.css', /\.byc-btn\b/], ['css/title.css', /\.rc-hc-share \{ width: 100%/]])
    assert.doesNotMatch(read(f), re, `${f}: ${re}`);
  const ct = read('js/ui/components.js');
  assert.match(ct, /export function tubeButton\(/); assert.match(ct, /export function confirmTap\(/); assert.match(ct, /export function row\(/);
});

test('THE MESSAGE: one at a time above the dock, a neon tube by colour, sentence case; no screen has its own toast', async () => {
  const t = read('js/ui/toast.js');
  assert.match(t, /old\.classList\.add\('is-out', 'is-replaced'\)/, 'a newer one replaces the older');
  assert.match(t, /querySelector\('\.nd-actions'\)/, 'above the dock');
  const c = read('css/components.css');
  for (const k of ['.sh-msg-ok { --mc: #5dffa0; }', '.sh-msg-warn { --mc: #ffc23d; }', '.sh-msg-err { --mc: #ff4d6d; }', 'pointer-events: none;   /* (taps pass through the bar']) assert.ok(c.includes(k), k);
  for (const f of JS) assert.doesNotMatch(read(f), /h\('div\.(vl|ad|pg)-toast/, `${f}: its own toast`);
  assert.doesNotMatch(c, /^\.toast\b/m, 'the old pills are gone');
  // sentence case (an ALL-CAPS caller is set in sentence case; a mixed one is left alone)
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  const { sentenceCase } = await import('../js/ui/toast.js');
  assert.equal(sentenceCase('KEY COPIED — NOW PASTE IT SOMEWHERE SAFE'), 'Key copied — Now paste it somewhere safe');
  assert.equal(sentenceCase('Invite link copied'), 'Invite link copied');
  assert.equal(sentenceCase('COULDN’T START. TRY AGAIN'), 'Couldn’t start. Try again');
});

test('THE ☰ MENU = the approved rows: Your card · How to play · Settings · Sound effects · (admins) The Lab · Admin · Leave room; in a game CHAT (hidden when locked) + QUIT / END', () => {
  const sp0 = read('js/ui/settings-panel.js'), sp = sp0.slice(sp0.indexOf('function openMenu()'));
  const order = ["label: 'Your card'", "label: 'How to play'", "label: 'Settings'", "label: 'Sound effects'", 'for (const [, render] of [...menuExtras.entries()].sort(', "label: 'Leave room'"];
  let at = -1; for (const k of order) { const i = sp.indexOf(k); assert.ok(i > at, k); at = i; }
  assert.match(sp, /menuPanel = openSheet\(\{ title: 'MENU', cls: 'gm'/);
  assert.match(sp, /!chatMod\.locked\(\)\) \{\n\s+const n = chatMod\.chat\.unread;/, 'THE CHAT LOCK hides the row (never greyed)');
  assert.doesNotMatch(sp, /is-locked/);
  // the admin rows only after the server said admin (remote.js registers them)
  const rm = read('js/screens/harbor/remote.js');
  assert.match(rm, /setMenuExtra\('lab', \(\{ close: closeMenu \}\) => \(destroyed \|\| !admin \? null : row\(\{ icon: 'lab'/);
  assert.match(rm, /setMenuExtra\('adminpage', \(\{ close: closeMenu \}\) => \(destroyed \|\| !admin \? null : row\(\{ icon: 'admin'/);
  assert.doesNotMatch(sp0, /'\/lab'|'\/admin'/, 'the menu itself never adds them');
  // THE CHAT LOCK on the in-game button: hidden, not greyed
  assert.match(read('js/chat/ui.js'), /fab\.hidden = !show \|\| lock;/);
});

test('THE TITLE DOCK: labels under its icons (the room dock\'s) + NO STREAK on it at all (SHELL 2.0 B1 — the other flames stay)', () => {
  const d = read('js/screens/title-dock.js');
  for (const l of ["'BOARD', on.board", "'PLAY', on.games", "'YOU', on.you"]) assert.ok(d.includes(l), l);
  assert.match(d, /h\('span\.rdk-lbl', \{ 'aria-hidden': 'true' \}, label\)/);
  for (const f of ['js/screens/title-dock.js', 'js/screens/title.js', 'js/progress/preview.js', 'css/progress.css']) assert.doesNotMatch(read(f), /streakPill|paintDockFlame|pg-dock|pg-pill|flameBadge/, f);
  assert.ok(!existsSync(new URL('../js/progress/flame.js', import.meta.url)), 'the dock badge\'s painter is gone');
  assert.match(read('js/progress/streak-card.js'), /flameArt\(state, 160\)/, 'the big streak card keeps its flame');
});

test('THE CARDS: the full card wears the tier gem in its top-right corner; a 1-of-1 the rainbow gem + "1 OF 1" to its left', () => {
  const f = read('js/vault/full.js');
  assert.match(f, /function tierBadge\(t, dev\)/);
  assert.match(f, /dev \? h\('b\.vl-fc-1of1', h\('i\.vl-fc-1of1-t', ONE_OF_ONE\)\) : null, gemEl\(dev \? null : t, \{ dev \}\)/);   // (B2: the gradient on the inner span)
  assert.doesNotMatch(f, /h\('span\.vl-tier'/);
  assert.doesNotMatch(read('css/vault.css'), /\.vl-tier\b/);
});

test('THE PODIUM\'s FRAME: the body (a game\'s finalScene or the podium) → the XP box → the board → ONE button BACK TO THE ROOM (the tube main), STICKY at the foot (B3)', () => {
  const f = read('js/ui/final.js');
  // (HOLD'EM IN THE CITY — B3: the action row is the frame's LAST piece, STICKY at the screen's foot — always on screen; MORE BELOW while it scrolls on)
  assert.match(f, /body \|\| podium,\n\s+rcSlot,\n\s+extra,\n\s+listRows\.length \? leaderboard\(listRows, players, \{ me, presence, stagger: 60 \}\) : null,\n\s+actions\);/);
  assert.match(read('css/components.css'), /\.final > \.final-actions \{\n\s+position: sticky; bottom: 0;/);
  assert.match(f, /el\.classList\.toggle\('has-more', el\.scrollHeight - el\.clientHeight - el\.scrollTop > 6\)/);
  // (FRIENDS B — B4: the body shows 1st–3rd → the list from 4th; a body with NO podium says so; B2: OWN_VICTORY_SOUND skips the sting;
  //  the music waits for the frame (state.podium); the game's ACCENT on the frame)
  assert.match(f, /const listRows0 = body && body\.dataset\.podium === 'all' \? \[\] : top3 \? rows\.slice\(3\) : rows;/);   // (HE4: a body with every place → no list)
  assert.match(f, /if \(!\(mod && mod\.OWN_VICTORY_SOUND\)\) pgSfx\('victory'\);/);
  assert.match(f, /setState\(\{ podium: g\.matchId \}\)/);
  assert.match(read('js/app.js'), /const podium = st\.game\.phase === 'final' && st\.podium === st\.game\.matchId;/);
  assert.match(f, /el\.style\.setProperty\('--fin', mod\.ACCENT\)/);
  const oc = read('js/games/overclock/meta.js');
  assert.match(oc, /export const ACCENT = '#ff6a1a';/); assert.match(oc, /export const OWN_VICTORY_SOUND = true;/);
  assert.match(f, /h\('button\.btn\.btn-primary\.btn-block\.final-back'/);
  assert.doesNotMatch(f, /'REMATCH'|rematch\(\)/, 'no rematch on the podium (the room dock has the vote)');
  assert.match(f, /mod\.finalScene\(body, g, state\)/);
  assert.match(read('js/games/cartridge.js'), /finalScene: 'function'/);
  assert.match(read('css/components.css'), /\.winner \{ flex: none; overflow-x: clip; overflow-y: visible; \}/, 'the winner line never cut');
});

test('ADD-ON: THE RESULTS ROWS = the players\' SLIM CARDS (every results list) on ONE shared surface, calm; THE XP BOX\'s pieces on their own row', () => {
  assert.match(read('js/ui/components.js'), /lazyImport\(import\('\.\/strip-board\.js'\), '[^']*'\)\.then\(m => m\.upgradeBoard\(list, rows, players\)\)/);   // (LOAD FIX 4: through the skew wrapper)
  const sb = read('js/ui/strip-board.js');
  assert.match(sb, /const surface = K\.createSurface\(list, \{ label: 'results' \}\);/, 'ONE surface for the list');   // (DFIX2: the kit's — stripKit() loads the pieces once; SCORES shares them)
  assert.match(read('js/screens/daily.js'), /stripKit, stripFor, stripFx \} from '\.\.\/ui\/strip-board\.js'/, 'DFIX2 — SLIM CARDS ON SCORES through the same code, never a second strip system');
  assert.match(sb, /calm: 1, radius: 12/, 'every strip calm');
  assert.match(sb, /const rowEls = \[\.\.\.list\.children\];/, 'the rows read before the canvas joins the list');
  assert.match(read('css/components.css'), /\.lb-row\.lb-strip \{[^}]*animation: none; \}/, 'no stacking context on a strip row');
  const co = read('js/profile/callouts.js');
  assert.match(co, /h\('span\.rc-xp-lv', h\('span\.rc-xp-step'/);
  assert.match(read('css/board.css'), /\.rc-xp-next \{ grid-column: 1 \/ -1;/);
});
