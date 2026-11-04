// THE VAULT 2C (no browser): THE LAB 2.0 (versions + CHANGED, the dated "what changed" lines server-side, the filters' rules), THE TIER GEMS
// + THE DEV GEM (transform / opacity only, reduced motion still), "1 OF 1 · DEV" (the owner's ADD-ON), FOUNDER + THE BADGE SLOTS, NO CARD-GAME
// ROOM on any card, the glow tiles fit, CUSTOMIZE + ONE EMBLEM SYSTEM (the 12 sign-up shapes owned by all, worn only in CUSTOMIZE, EDIT
// PROFILE without a shape picker), THE PROFILE's ORDER + LESS GOLD + TROPHIES, THE WRONG DOOR (a static 404.html, never ignored, the local
// server's fallback), real fire (INFERNO + CENTURY's flipbook).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LAB, LAB_V, verOf, labStatus, cleanMark, NEEDS } from '../js/vault/catalog.js';
import { LAB_CHANGES, LAB_TEXT } from '../api/_lib/lab-text.js';
import { ONE_OF_ONE } from '../js/core/dev-cards.js';
import { SIGN_EMBLEMS, SIGN_SHAPES, signOf, STARTER, ownedOf, ITEM, wearing } from '../js/core/items.js';
import { AVATAR_IDS } from '../js/config.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('THE LAB 2.0 — VERSIONS: every bumped item has its dated "what changed" line (server-side, with the names); a mark at an older version = CHANGED', () => {
  for (const [id, v] of Object.entries(LAB_V)) {
    assert.ok(LAB.some(x => x.id === id), `${id} is a lab item`);
    const ch = LAB_CHANGES[id] || [];
    assert.ok(ch.some(c => c.v === v && /^\d{4}-\d{2}-\d{2}$/.test(c.at) && c.what.length > 12), `${id} v${v} says what changed`);
  }
  for (const id of Object.keys(LAB_CHANGES)) assert.ok(LAB_V[id], `${id}: a change line without a version bump`);
  assert.equal(verOf('card-smoke'), 1); assert.equal(verOf('card-inferno'), 2);
  assert.equal(labStatus('card-inferno', null), 'new');
  assert.equal(labStatus('card-inferno', { m: 'fix', v: 1 }), 'changed', 'his FIX at v1 → CHANGED at v2');
  assert.equal(labStatus('card-inferno', { m: 'approve' }), 'changed', 'an old mark (no v) = v1');
  assert.equal(labStatus('card-inferno', { m: 'approve', v: 2 }), 'approve');
  assert.equal(labStatus('card-smoke', { m: 'approve' }), 'approve');
  assert.deepEqual(NEEDS, ['new', 'changed']);
  assert.equal(cleanMark('full-card-founder', 'approve').v, 2, 'the server stamps the version marked');
  // (the what-changed text is the SERVER's — the client catalog carries only the numbers; the lab gets the lines with the marks, admins only)
  assert.doesNotMatch(read('js/vault/catalog.js'), /Real fire now/);
  assert.match(read('api/admin.js'), /case 'labMarks': return \{ marks: await labMarks\(\), text: LAB_TEXT, changes: LAB_CHANGES \}/);
  assert.match(read('api/_lib/lab.js'), /v: c\.v \}/);
  // this pass's own edits show as CHANGED (the FIX'd items, the dev cards' tag, FOUNDER, the rebuilt windows)
  for (const id of ['card-inferno', 'card-century', 'card-dev-switchboard', 'card-dev-source', 'full-card-dev-switchboard', 'full-card-dev-source', 'card-founder', 'full-card-founder', 'full-card-house']) assert.ok(verOf(id) >= 2, id);
});

test('THE LAB 2.0 — the page: ← THE CITY, NEEDS YOU by default, 4 sections, 5 filters with counts, ONE ROW PER ITEM + the FULL toggle, NEW, "All caught up."; the ☰ row admins-only', () => {
  const v = read('js/vault/lab-views.js');
  assert.match(v, /\['cards', 'CARDS'\], \['emblems', 'EMBLEMS'\], \['glows', 'GLOWS \+ TUBES'\], \['lobby', 'LOBBY TEST'\]/);
  assert.match(v, /\['needs', 'NEEDS YOU'\], \['changed', 'CHANGED'\], \['fix', 'FIX'\], \['approved', 'APPROVED'\], \['all', 'ALL'\]/);
  assert.match(v, /'‹ THE CITY'/); assert.match(v, /href: '\/'/);
  assert.match(v, /'All caught up\.'/); assert.match(v, /h\('span\.vl-new', 'NEW'\)/); assert.match(v, /'FULL CARD ›'/);
  assert.match(v, /localStorage\.setItem\(SEEN_KEY/);
  assert.match(v, /details\.vl-set/, 'the diagnostics + the WEAR mixes folded into LOBBY TEST');
  const r = read('js/screens/harbor/remote.js');
  assert.match(r, /setMenuExtra\('lab', \(\{ close: closeMenu \}\) => \(destroyed \|\| !admin \? null/, 'the ☰ row only after the server said admin');
  assert.match(r, /location\.href = '\/lab'/);
  // (the export keeps working: ids + marks + the version + CHANGED — BOARD 2.0 reads it)
  assert.match(read('scripts/lab-export.mjs'), /CHANGED \(marked v/);
});

test('THE TIER GEMS + THE DEV GEM: one per tier, no words on a strip; motion by transform + opacity only; reduced motion = still', () => {
  const g = read('js/vault/gems.js'), css = read('css/vault.css'), s = read('js/vault/strip.js');
  for (const t of ['common', 'uncommon', 'rare', 'epic', 'legendary', 'dev']) assert.match(css, new RegExp(`\\.vl-gem-${t}`));
  assert.match(s, /gemEl\(plain && !tierIn \? 'common' : tier, \{ dev \}\)/);
  assert.doesNotMatch(s, /h\('span\.vl-tier'/, 'the strip carries no tier words');
  assert.match(g, /SPECTRUM/); assert.match(g, /vl-gem-halo/); assert.match(g, /vl-gem-sweep/); assert.match(g, /vl-gem-spk/);
  const keys = [...css.matchAll(/@keyframes (vl-gem-[\w-]+) \{([^@]*?)\}\s*(?=@|\n[^ ]|$)/g)];
  assert.ok(keys.length >= 6);
  for (const [, name, body] of keys) for (const prop of body.matchAll(/([a-z-]+):/g)) assert.ok(['transform', 'opacity'].includes(prop[1]), `${name} animates ${prop[1]}`);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.vl-gem, \.vl-gem \* \{ animation: none !important; \}/);
  assert.match(css, /body\.reduced-fx \.vl-gem \*/);
});

test('"1 OF 1 · DEV" (the owner\'s ADD-ON, 7:16 pm) on the full card + CUSTOMIZE only — bold; FOUNDER + THE BADGE SLOTS; no card-game room anywhere', () => {
  assert.equal(ONE_OF_ONE, '1 OF 1 · DEV');
  assert.doesNotMatch(read('js/vault/full.js') + read('js/vault/dress.js') + read('api/_lib/lab-text.js'), /#1 OF #1|ONE OF ONE · DEV/);
  assert.match(read('css/vault.css'), /\.vl-fc\.vl-dev1 \.vl-tier \{ font: 900/);
  const f = read('js/vault/full.js');
  assert.match(f, /h\('span\.vl-fc-fd', 'FOUNDER'\)/); assert.match(f, /h\('b\.vl-fc-fd\.is-top', 'FOUNDER'\)/);
  assert.doesNotMatch(f, /'FOUNDING MEMBER'\) : null/);
  assert.match(read('js/progress/card.js'), /h\('span\.pg-card-fd', 'FOUNDER'\)/);
  const sf = read('js/fx/speak-front.js');
  assert.match(sf, /live = o\.live \|\| \['back'\]/); assert.match(sf, /rm\.lit === 'table'\) return;/, 'the card-game room is never baked');
  assert.match(read('js/fx/opening.js'), /drawBoxer\(c, F, bx, by, t, still\)/); assert.match(read('js/fx/house.js'), /drawBoxer\(c, F, bx, by, t, still\)/);
  // the glow tiles: the name pinned to its tile (fitName measures honestly in Safari)
  assert.match(read('css/vault.css'), /\.vl-dt-name \{ display: block; justify-self: stretch; width: 100%; min-width: 0;/);
});

test('ONE EMBLEM SYSTEM: the 12 sign-up shapes are commons every member owns; worn in CUSTOMIZE (the profile\'s shape `a`); EDIT PROFILE picks no shape', () => {
  assert.deepEqual(SIGN_SHAPES, AVATAR_IDS, 'the 12 = the sign-up set');
  assert.equal(SIGN_EMBLEMS.length, 12);
  for (const id of SIGN_EMBLEMS) { assert.ok(STARTER.includes(id)); assert.equal(ITEM[id].kind, 'emblem'); assert.equal(ITEM[id].tier, 'common'); assert.match(ITEM[id].name, /^NEON /); }
  assert.equal(signOf('emb-sign-ghost'), 'ghost'); assert.equal(signOf('emb-crown'), null); assert.equal(signOf('emb-sign-nope'), null);
  assert.equal(ownedOf({}, 'emblem').length, 12, 'everyone owns them, even with nothing earned');
  assert.equal(wearing({}, { shape: 'emb-sign-moon' }).shape, 'emb-sign-moon');
  const p = read('api/profile.js');
  assert.match(p, /if \(k === 'shape' && signOf\(id\)\) \{ patch\[`profiles\/\$\{pid\}\/a`\] = signOf\(id\); patch\[`profiles\/\$\{pid\}\/es`\] = null; continue; \}/);
  assert.match(p, /SIGN_EMBLEMS\.some\(id => !\(stats\.it \|\| \{\}\)\[id\]\)/, 'the back-fill on me');
  // (a new member owns them from the first second through STARTER; the rows reach pstats on the first 'me' once stats exist — a sign-up never
  //  writes pstats: a first match must still see a NEW player and grant the level rewards up to its level)
  assert.doesNotMatch(read('api/_lib/profiles.js'), /SIGN_EMBLEMS/);
  assert.match(read('js/core/progress.js'), /const had = s\.it && Object\.keys\(s\.it\)\.some\(id => !SIGN_EMBLEMS\.includes\(id\)\);/);
  const d = read('js/vault/dress.js');
  assert.doesNotMatch(d, /'YOUR SHAPE'/); assert.match(d, /tab === 'card' \|\| tab === 'emblem' \? items/);
  const su = read('js/screens/setup.js');
  assert.match(su, /const pickShape = !saved\.name && mode !== 'edit';/); assert.match(su, /pickShape \? h\('div\.field', h\('span\.label', 'AVATAR'\), els\.avatars\) : null/);
  assert.doesNotMatch(read('js/vault/picker.js') + d, /'YOUR OWN EMBLEM'/, 'the "YOUR OWN EMBLEM" row is gone');
});

test('THE PROFILE REARRANGED + LESS GOLD + TROPHIES: the order, no BOARD button, the birthday one line once set; panels dark glass; medals in the tier colour, X% from the server, the reward a real preview (tap = wear)', () => {
  const sp = read('js/screens/profile.js');
  // (LOBBY 2.0 A — the owner's 2C review: YOUR GAMES folded into MASTERY (a game's record in a sheet); the order card · customize · why ·
  //  the sections · MASTERY · ACCOUNT)
  const order = ['els.card,', 'els.cz,', 'els.why,', "els.prog = h('div.pf-prog')", 'els.mast,', "'ACCOUNT'"].map(k => sp.indexOf(k));
  assert.ok(order.every((x, i) => x > 0 && (!i || x > order[i - 1])), `the order ${order}`);
  assert.doesNotMatch(sp, /setState\(\{ view: 'board' \}\)/, 'no BOARD button on the profile');
  assert.match(sp, /F\.openFullCard\(cd, who\)/, 'the hero opens the full card');
  const pr = read('js/progress/profile.js');
  assert.match(pr, /const els = \[level, goal, stats, ach, album, favor\]/);   // (LOBBY 2.0 A: the streak rides in LEVEL; THE GOAL TILE under it)
  assert.match(pr, /'CUSTOMIZE YOUR CARD'/);
  const ex = read('js/progress/extras.js');
  assert.match(ex, /export function birthdayRow/); assert.match(ex, /if \(!pv\.bd\) return birthdayPanel\(data, o\);/); assert.match(ex, /change again in/);
  const css = read('css/progress.css');
  assert.match(css, /\.pf-screen \.pg-panel, \.pg-prof \.pg-panel \{[^}]*border: 1px solid rgba\(255, 255, 255, 0\.08\)/);
  assert.match(css, /\.pg-bar \.pg-bar-glint > i \{[^}]*animation: pg-glint/);
  const tr = read('js/progress/trophies.js');
  assert.match(tr, /pg-medal-\$\{tier\}/); assert.match(tr, /h\('em\.pg-pct', \{ dataset: \{ a: a\.id \} \}\)/);
  assert.match(tr, /o\.onWear\(SLOT\[kind\], a\.item\)/); assert.match(tr, /'EQUIPPED ✓'/); assert.match(tr, /'TAP TO EQUIP'/); assert.match(tr, /'GLOW'\), id\)/);
  for (const t of ['uncommon', 'rare', 'epic', 'legendary']) assert.match(css, new RegExp(`\\.pg-medal-${t} \\{ --tc: var\\(--tier-${t}\\)`));
  assert.match(css, /\.pg-rw \{[^}]*min-height: 44px/, 'the reward chip is a 44-pt target');
});

test('THE WRONG DOOR: a static root 404.html (no modules, no Firebase), never ignored by Vercel, no rewrite swallowing it; the local server serves it the same way', () => {
  const w = read('404.html');
  assert.match(w, /Wrong door, friend\./); assert.match(w, /class="wd-go" href="\/"/); assert.match(w, /BACK TO THE CITY/);
  assert.doesNotMatch(w, /type="module"|import\(|firebasejs|\/js\//, 'no module graph, no Firebase SDK, none of the app scripts');
  assert.match(w, /prefers-reduced-motion: reduce\) \{ \.wd-cover \{ animation: none; transform: translateX\(-104%\)/);
  assert.match(w, /localStorage\.getItem\('nd:adm'\)/); assert.match(w, /if \(admin\) routes\.push\(\['lab'/);
  const ig = read('.vercelignore');
  assert.ok(!ig.split(/\r?\n/).some(l => l.trim() && !l.startsWith('#') && /404|^\*\.html$/.test(l.trim())), '404.html deploys');
  assert.ok(!JSON.parse(read('vercel.json')).rewrites, 'no rewrites (a catch-all would swallow the 404)');
  assert.match(read('scripts/serve.mjs'), /readFile\(join\(root, '404\.html'\)\)/);
  assert.match(read('js/screens/harbor/remote.js'), /localStorage\.setItem\('nd:adm', '1'\)/);
});

test('REAL FIRE (INFERNO + CENTURY): a baked flipbook, whole tiles (never sliced), drawn as sprites — no per-pixel work a frame', () => {
  const f = read('js/fx/fire.js'), fl = read('js/fx/flames.js');
  assert.match(f, /export const fireSheet = \(\) => sprite\('fire-book:/);
  assert.match(f, /c\.drawImage\(sh, \(f % COLS\) \* CW \+ GUT/);
  assert.doesNotMatch(f.slice(f.indexOf('export function drawFire')), /getImageData|createImageData|putImageData/);
  assert.match(fl, /drawFire\(c, 0, w,/); assert.doesNotMatch(fl, /lick\(\)/);
  assert.ok(LAB_TEXT['card-inferno'], 'its lab text stays');
});
