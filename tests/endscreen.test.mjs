// CITY F — END-SCREEN STANDARD A (the owner's pick, Nov 17): ONE foot for every game's end screen, built in the console's frame
// (js/ui/final.js) — the BAR in the game's accent (dark words where they read ≥ 4.5 : 1 — core/fin-ink.js) + the quiet links. No game keeps
// its own copy. The browser half: e2e-playnow / e2e-jaywalk / e2e-jaywalk-match / the harbor `gameflows` group.
import { test } from 'node:test';
import { META as META_ROWS } from '../js/games/metas.js';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { finInk, contrast, FIN_DARK } from '../js/core/fin-ink.js';
import { GAMES } from '../js/config.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the bar\'s words: every playable game\'s ACCENT (+ JAYWALK, + the console\'s pink) reads ≥ 4.5 : 1 under its ink — today all DARK', () => {
  const ids = [...GAMES.filter(g => g.playable || g.preview).map(g => g.id)];
  const out = [];
  for (const id of ids) {
    const row = META_ROWS[id], m = row && /^#[0-9a-f]{6}$/i.test(row.ACCENT) ? [null, row.ACCENT] : /export const ACCENT = '(#[0-9a-f]{6})'/i.exec(read(`js/games/${id}/meta.js`));   // (CITY PART 1: a playable game's ACCENT = its row in js/games/metas.js)
    assert.ok(m, `${id}: an ACCENT in its meta`);
    const ink = finInk(m[1]);
    assert.ok(contrast(m[1], ink) >= 4.5, `${id}: ${ink} on ${m[1]} = ${contrast(m[1], ink).toFixed(2)} : 1`);
    out.push(`${id} ${m[1]} → ${ink === FIN_DARK ? 'dark' : 'WHITE'} ${contrast(m[1], ink).toFixed(1)}:1`);
  }
  assert.equal(finInk('#ff2bd6'), FIN_DARK, 'the console\'s pink: dark');
  // (a dark accent gets white words — the rule works both ways)
  assert.equal(finInk('#3a1f8f'), '#ffffff');
  console.log(`[endscreen] ${out.join(' · ')}`);
});

test('ONE foot: no game builds a PLAY AGAIN / REMATCH / BACK TO THE CITY button of its own', () => {
  for (const id of readdirSync(new URL('../js/games/', import.meta.url))) {
    for (const f of ['view.js', 'victory.js', 'index.js']) {
      const p = `js/games/${id}/${f}`;
      if (!existsSync(new URL(`../${p}`, import.meta.url))) continue;
      const src = read(p);
      assert.doesNotMatch(src, /h\('button[^']*', [^)]*\)?, h\('span', '(PLAY AGAIN|REMATCH|BACK TO THE CITY|SHARE MY RUN)'\)/, `${p} keeps its own foot button`);
    }
  }
  assert.doesNotMatch(read('js/games/jaywalk/victory.js'), /jw-fin-share/, 'JAYWALK\'s SHARE MY RUN moved to the console\'s foot');
});

test('the foot\'s order + its rules: SOLO = PLAY AGAIN · SHARE · CITY; a MATCH = REMATCH · BACK TO THE ROOM · SHARE; every control presses', () => {
  const f = read('js/ui/final.js');
  assert.match(f, /const linkList = soloRoom \|\| oneRoom \? \[share, out\] : \[out, share\];/);
  assert.match(f, /h\('span\.final-bar-t', \(mod && typeof mod\.AGAIN_LABEL === 'string' && mod\.AGAIN_LABEL\) \|\| 'PLAY AGAIN'\)/);
  assert.match(f, /h\('span\.final-bar-t', 'REMATCH'\)/);
  assert.match(f, /'WAITING FOR THE HOST'/, 'a guest\'s vote: the bar says so — never dead');
  assert.match(f, /final-share', \{ type: 'button', 'data-gesture': true/, 'SHARE in Safari\'s own gesture');
  assert.match(f, /h\('button\.final-link\.final-city', \{ type: 'button', 'data-press': true/);
  // (CITY G: the room link = ROOM + a door — it fits its half at 375; the screen reader still hears "Back to the room")
  assert.match(f, /'aria-label': 'Back to the room', onclick: backTap \}, finIcon\('room'\), h\('span', 'ROOM'\)\)/);
  // (the walk back KEEPS the votes — a podium vote counts in the room's ring for the same match)
  assert.doesNotMatch(read('js/host.js'), /'meta\/back': g && g\.matchId \? \{[^}]*\} : null, rv: null \}/);
  // (the rules: a guest's podium vote only once the match is final, and only for it)
  const rules = read('database.rules.json');
  assert.match(rules, /meta\/status'\)\.val\(\) === 'playing' && root\.child\('rooms\/' \+ \$code \+ '\/game\/phase'\)\.val\(\) === 'final'\)\)"/);
});

test('CITY F — THE RESULTS PLAQUES: a thin neon frame in the game\'s accent + an icon with meaning; #1 WORLDWIDE the ONE gold; no brown box, no compass', () => {
  const c = read('js/profile/callouts.js'), css = read('css/board.css');
  for (const k of ['crown', 'rise', 'globe', 'laurel', 'calendar']) assert.ok(c.includes(`  ${k}: '<`), `the ${k} icon`);
  assert.match(c, /title: '#1 WORLDWIDE', sub: label\(def\), rank: 1, sound: 'first', icon: 'crown', gold: true \}/, '#1 WORLDWIDE = the crown, gold');
  assert.match(c, /title: '#1 THIS WEEK', [^}]*icon: 'calendar' \}/, '#1 THIS WEEK = the calendar, not gold');
  assert.equal((c.match(/gold: true/g) || []).length, 1, 'gold ONLY on #1 WORLDWIDE');
  assert.match(css, /\.rc-plaque \{\n  --pk: var\(--fin, var\(--magenta\)\);/, 'the frame in the game\'s accent');
  assert.doesNotMatch(css, /\.rc-mark|rgba\(44, 28, 18/, 'the compass + the brown box are gone');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.rc-sparks, \.rc-sweep \{ display: none; \} \}/, 'reduced motion = the still');
  assert.doesNotMatch(css.slice(css.indexOf('.rc-sparks i {'), css.indexOf('@media (prefers-reduced-motion: reduce) { .rc-sparks')), /box-shadow[^;]*;[^}]*animation|@keyframes rc-spark \{[^}]*box-shadow/, 'the sparks move on transform + opacity only');
});

test('CITY F — THE PODIUM\'s MOMENT: rows from the first frame, an opaque takeover above CONTINUE, every achievement + an EPIC / LEGENDARY beat, no wash, no pills', () => {
  const m = read('js/progress/moment.js'), css = read('css/progress.css');
  assert.doesNotMatch(m, /\.filter\(Boolean\)\.slice\(0, 3\)/, '(c) never cut at three');
  assert.match(m, /const BIG = new Set\(\['epic', 'legendary'\]\);/, '(c) an EPIC / LEGENDARY item gets its own beat');
  assert.match(m, /if \(bigHeld\(\)\) \{ ackBig\(\); return; \}/, '(c) held until a tap, like the level-up');
  assert.match(css, /\.pg-veil \{[^}]*opacity: 1; \}/, '(d) the veil is up at once (no half-way wash)');
  assert.doesNotMatch(css.slice(css.indexOf('.pg-veil {'), css.indexOf('.pg-veil {') + 300), /rgba\(60, 26, 92|transition/, '(d) no purple, no fade-in');
  assert.match(css, /\.pg-up \{ position: fixed; inset: 0; z-index: 5;[^}]*background: radial-gradient\(70% 50% at 50% 42%, rgb\(30, 22, 10\), rgb\(8, 6, 10\)\)/, '(b) the takeover opaque, above CONTINUE (z 2)');
  assert.doesNotMatch(css, /\.pg-line \{[^}]*opacity: 0/, '(a) the lines are there from the first frame');
  assert.match(css, /\.pg-moment:not\(\.is-still\) \.pg-extras \.pg-box:not\(\.is-in\) \{ display: none; \}/, '(a) no empty space waiting for a row');
  assert.match(css, /\.pg-moment \.pg-btn, \.pg-moment \.pg-btn::before, \.pg-moment \.pg-btn::after \{ border-radius: 10px; \}/, '(e) CONTINUE: the non-pill tube');
  assert.match(css, /\.pg-bar \{ position: relative; height: 11px; margin: 9px 0 8px; border-radius: 2px;/, '(e) the level bar: squared');
});
