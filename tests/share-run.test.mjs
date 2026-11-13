// PLAY NOW's add-on (the owner, Nov 13 noon) — SHARE YOUR RUN: the image is drawn ON THE PHONE from the result's PUBLIC fields only (never a pid,
// a uid, a key, tag digits) — js/games/kit/share-run.js#runCard is the one gate every card goes through; the two cartridges' builders feed it.
// The look: tests/integration/shots-review (the e2e-playnow run with --shots: the card at Messages size, night + day).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCard, runLine, RUN_W, RUN_H } from '../js/games/kit/share-run.js';

const PID = 'p7k2m9x4q8wz', UID = 'Kftp9XNEMcqZgi8wZ4yi2vbeLey0', KEY = 'NS-ABCD-EFGH-JKLM';
const ALLOWED = ['game', 'title', 'mode', 'name', 'result', 'big', 'bigUnit', 'board', 'look', 'accent'];

test('runCard keeps ONLY the public fields (anything else dropped), clipped + cleaned', () => {
  const c = runCard({ game: 'prism', title: 'Prism Drop', mode: 'Score rush', name: 'ava', result: '1,234 points · 14 lines', board: '0012ab..', look: 'night', accent: '#8fd8ff',
    pid: PID, uid: UID, key: KEY, tag: '4821', mn: 42, email: 'x@y.z' });
  assert.deepEqual(Object.keys(c).sort(), [...ALLOWED].sort());
  assert.equal(c.name, 'AVA'); assert.equal(c.title, 'PRISM DROP'); assert.equal(c.mode, 'SCORE RUSH');
  const txt = JSON.stringify(c);
  for (const s of [PID, UID, KEY, '4821', 'x@y.z']) assert.ok(!txt.includes(s), s);
  assert.equal(runCard({ name: 'A'.repeat(40) }).name.length, 16, 'a name clipped (NAME_MAX)');
  assert.equal(runCard({ board: '<script>' }).board, null, 'a board is board characters only');
  assert.equal(runCard({ game: 'Bad Id!' }).game, 'game');
  assert.equal(runCard({ look: 'day' }).look, 'day'); assert.equal(runCard({ look: 'x' }).look, 'night');
  assert.equal(RUN_W, 1080); assert.equal(RUN_H, 1350, 'portrait 1080 × 1350 — a text + a story');
  assert.equal(runLine(c), 'My PRISM DROP run — 1,234 POINTS · 14 LINES · https://neonspeakeasy.com', 'the site\'s URL with the image');
});

test('the two cartridges build their cards from the match\'s public fields (mode, the player\'s line, display name, published board)', () => {
  const p = readFileSync('js/games/prism/share.js', 'utf8'), o = readFileSync('js/games/overclock/share.js', 'utf8');
  assert.match(p, /return runCard\(\{ game: 'prism'/); assert.match(o, /return runCard\(\{ game: 'overclock'/);
  // the shareRun reads only: this phone's uid (to FIND its row — never drawn), its display name, its published board, the look
  assert.match(p, /shareRunCard\(prismRunCard\(game, \{ uid, name: me\.name, board: node && node\.b, look \}\), drawBoardMiddle\)/);
  assert.match(o, /shareRunCard\(ocRunCard\(game, \{ uid, name: me\.name, look \}\), drawScoreMiddle\)/);
  for (const src of [p, o]) assert.ok(!/\.pid\b|profile|\/api|fetch\(/.test(src), 'no pid, no profile, no server call');
  const kit = readFileSync('js/games/kit/share-run.js', 'utf8');
  assert.match(kit, /const c = ctx2d\(cv\);/, 'drawn through ctx2d (ui/canvas-safe.js)');
  assert.ok(!/fetch\(|\/api\//.test(kit), 'no server, no new /api call');
  assert.match(kit, /return sendShare\(cv, \{ file: `neon-speakeasy-\$\{card\.game\}\.png`, line: runLine\(card\) \}\);/, 'the image + the line through THE SHARE CARD sender');
});

test('the solo foot: PLAY AGAIN in PLAY NOW\'s room AND a room of one; SHARE when the cartridge draws one', () => {
  const fin = readFileSync('js/ui/final.js', 'utf8');
  assert.match(fin, /const oneRoom = !soloRoom && !!PN && solo && isHost\(\) && Object\.keys\(players \|\| \{\}\)\.length === 1;/);
  assert.match(fin, /leave = soloRoom \? h\('button\.btn\.btn-ghost\.btn-block\.final-city'[\s\S]{0,400}: back;/, 'a room of one keeps BACK TO THE ROOM');
  assert.match(fin, /const canShare = !!\(mod && typeof mod\.shareRun === 'function'/);
  for (const g of ['prism', 'overclock']) assert.match(readFileSync(`js/games/${g}/index.js`, 'utf8'), /export const shareRun = \(game, state\) => lazyImport\(import\('\.\/share\.js'\)/);
  assert.ok(!/shareRun/.test(readFileSync('js/games/holdem/index.js', 'utf8')), 'HOLD\'EM has no solo run to share');
});
