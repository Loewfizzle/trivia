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
  assert.deepEqual(CARTRIDGES.slice().sort(), GAMES.filter(g => g.playable).map(g => g.id).sort());
  for (const id of CARTRIDGES) { assert.ok(PRELOAD[id].includes(`js/games/${id}/index.js`) && PRELOAD[id].includes(`js/games/${id}/view.js`), id); assert.ok(graphOf(id).bytes < 1.5 * 1024 * 1024, `${id}: within the preload budget`); }
});
