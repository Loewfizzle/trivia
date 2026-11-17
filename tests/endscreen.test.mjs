// CITY F — END-SCREEN STANDARD A (the owner's pick, Nov 17): ONE foot for every game's end screen, built in the console's frame
// (js/ui/final.js) — the BAR in the game's accent (dark words where they read ≥ 4.5 : 1 — core/fin-ink.js) + the quiet links. No game keeps
// its own copy. The browser half: e2e-playnow / e2e-jaywalk / e2e-jaywalk-match / the harbor `gameflows` group.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { finInk, contrast, FIN_DARK } from '../js/core/fin-ink.js';
import { GAMES } from '../js/config.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the bar\'s words: every playable game\'s ACCENT (+ JAYWALK, + the console\'s pink) reads ≥ 4.5 : 1 under its ink — today all DARK', () => {
  const ids = [...GAMES.filter(g => g.playable || g.preview).map(g => g.id)];
  const out = [];
  for (const id of ids) {
    const m = /export const ACCENT = '(#[0-9a-f]{6})'/i.exec(read(`js/games/${id}/meta.js`));
    assert.ok(m, `${id}: an ACCENT in its meta.js`);
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
  assert.match(f, /h\('span\.final-bar-t', 'PLAY AGAIN'\)/);
  assert.match(f, /h\('span\.final-bar-t', 'REMATCH'\)/);
  assert.match(f, /'WAITING FOR THE HOST'/, 'a guest\'s vote: the bar says so — never dead');
  assert.match(f, /final-share', \{ type: 'button', 'data-gesture': true/, 'SHARE in Safari\'s own gesture');
  assert.match(f, /h\('button\.final-link\.final-city', \{ type: 'button', 'data-press': true/);
  // (the walk back KEEPS the votes — a podium vote counts in the room's ring for the same match)
  assert.doesNotMatch(read('js/host.js'), /'meta\/back': g && g\.matchId \? \{[^}]*\} : null, rv: null \}/);
  // (the rules: a guest's podium vote only once the match is final, and only for it)
  const rules = read('database.rules.json');
  assert.match(rules, /meta\/status'\)\.val\(\) === 'playing' && root\.child\('rooms\/' \+ \$code \+ '\/game\/phase'\)\.val\(\) === 'final'\)\)"/);
});

test('CITY F — THE RESULTS PLAQUES: a thin neon frame in the game\'s accent + an icon with meaning; #1 WORLDWIDE the ONE gold; no brown box, no compass', () => {
  const c = read('js/profile/callouts.js'), css = read('css/board.css');
  for (const k of ['crown', 'rise', 'globe', 'laurel', 'calendar']) assert.match(c, new RegExp(`\b${k}: '<`), `the ${k} icon`);
  assert.match(c, /title: '#1 WORLDWIDE', sub: label\(def\), rank: 1, sound: 'first', icon: 'crown', gold: true \}/, '#1 WORLDWIDE = the crown, gold');
  assert.match(c, /title: '#1 THIS WEEK', [^}]*icon: 'calendar' \}/, '#1 THIS WEEK = the calendar, not gold');
  assert.equal((c.match(/gold: true/g) || []).length, 1, 'gold ONLY on #1 WORLDWIDE');
  assert.match(css, /\.rc-plaque \{\n  --pk: var\(--fin, var\(--magenta\)\);/, 'the frame in the game\'s accent');
  assert.doesNotMatch(css, /\.rc-mark|rgba\(44, 28, 18/, 'the compass + the brown box are gone');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.rc-sparks, \.rc-sweep \{ display: none; \} \}/, 'reduced motion = the still');
  assert.doesNotMatch(css.slice(css.indexOf('.rc-sparks i {'), css.indexOf('@media (prefers-reduced-motion: reduce) { .rc-sparks')), /box-shadow[^;]*;[^}]*animation|@keyframes rc-spark \{[^}]*box-shadow/, 'the sparks move on transform + opacity only');
});
