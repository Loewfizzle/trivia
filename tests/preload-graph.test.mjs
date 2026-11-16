// FRIENDS C — THE SLOW-3G START: js/games/preload-graph.js (GENERATED) is fresh — each playable cartridge's whole module graph past the boot
// graph, as scripts/build-preload-graph.mjs walks it now. A stale list would preload the wrong files (never wrong, only slower) — so it fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, CARTRIDGES, graphOf } from '../scripts/build-preload-graph.mjs';
import { PRELOAD } from '../js/games/preload-graph.js';
import { GAMES } from '../js/config.js';

test('THE PRELOAD GRAPH is fresh (node scripts/build-preload-graph.mjs) + covers every playable cartridge, none of the boot graph', () => {
  assert.equal(readFileSync(new URL('../js/games/preload-graph.js', import.meta.url), 'utf8'), render(), 'stale — run node scripts/build-preload-graph.mjs');
  assert.deepEqual(CARTRIDGES.slice().sort(), GAMES.filter(g => g.playable || g.preview).map(g => g.id).sort());   // (JAYWALK H1: + a game being built)
  for (const id of CARTRIDGES) { assert.ok(PRELOAD[id].includes(`js/games/${id}/index.js`) && PRELOAD[id].includes(`js/games/${id}/view.js`), id); assert.ok(graphOf(id).bytes < 1.5 * 1024 * 1024, `${id}: within the preload budget`); }
});

// CITY A — item 15, A GAME COSTS NOTHING UNTIL IT'S PICKED: the lobby wires ONLY the room's picked game (never every playable cartridge)
test('CITY A — the lobby wires the PICKED game only (the start stamp · the match in play / just played), re-wired when it changes', () => {
  const src = readFileSync(new URL('../js/screens/room-city.js', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('export function pickedGame'), src.indexOf('export function createRoomCity'));
  const pickedGame = (0, eval)('(' + fn.replace('export function pickedGame', 'function pickedGame') + ')');
  assert.equal(pickedGame({ meta: {}, game: null }), null, 'nothing picked: nothing wired (the host\'s options sheet wires its own pick)');
  assert.equal(pickedGame({ meta: { go: { g: 'holdem', m: 'x' } }, game: null }), 'holdem', 'the start stamp');
  assert.equal(pickedGame({ meta: {}, game: { id: 'prism' } }), 'prism', 'the match in play / just played');
  assert.equal(pickedGame({ meta: { back: { g: 'overclock' } }, game: null }), 'overclock', 'back in the room: the rematch plays it again');
  assert.doesNotMatch(src, /for \(const id of Object\.keys\(R\.META\)\) P\.wireGame\(id\)/, 'never every cartridge');
  assert.match(src, /const id = pickedGame\(st\);\s*if \(!id \|\| id === wiredPick\) return;/);
  assert.match(src, /wirePick\(\);   \/\/ \(CITY A — item 15/, 'every room update re-checks the pick');
  assert.match(readFileSync(new URL('../js/screens/game-options.js', import.meta.url), 'utf8'), /P\.wireGame\(g\.id\)/, 'the host\'s options sheet still wires its pick at the tap');
});
