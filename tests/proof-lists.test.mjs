// THE FIX PASS (Nov 22 — THE FABLE REVIEW's M1, before FREEFALL): "proof game" is declared in parallel hand lists — a new proof game that
// missed one shipped host-graded (paid from the host's own game.results — for a solo run, the player's own claim) and NO test went red.
// Now: every VERIFIED_SOLO id has its row in EVERY proof list, and every playable reported game is in exactly one of the THREE trust lists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VERIFIED_SOLO } from '../js/core/proof.js';
import { PROOF_NODES, PROOF_TREES, PROOF_PATHS, FLAT_PROOF, GO_TREES, DROP_GUARD } from '../api/_lib/trust-lists.js';
import { DEALER_GAMES, REPORT_GAMES, QUICK_SOLO, hasExtra } from '../js/core/match-report.js';
import { PROOF_NODE_LIST, LOCKED_PROOF_NODES, NEW_PLAYER_NODES } from '../js/games/registry.js';
import { GAMES } from '../js/config.js';

const src = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const listIn = (file, name) => { const m = new RegExp(String.raw`${name} = Object\.freeze\(\[([^\]]*)\]\)`).exec(src(file)); return m ? m[1].split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean) : null; };

/** FREEFALL F4A — THE HIDDEN CARTRIDGE (being built): the run card (SHARE) is F4B's — the ONE named wait; it must be EMPTY at its go-live */
export const RUN_CARD_WAITS = Object.freeze({ freefall: 'F4B — SHARE + the run card' });

test('M1: every VERIFIED_SOLO id has its row in every proof list (the server, the registry, the report extract, the run card)', () => {
  const runGames = listIn('api/_lib/share-card.js', 'RUN_GAMES');
  assert.ok(runGames, 'share-card.js#RUN_GAMES found');
  for (const id of VERIFIED_SOLO) {
    const node = PROOF_NODES[id];
    assert.ok(node, `${id}: PROOF_NODES (report.js#PROOF_GAMES builds on it)`);
    assert.ok(PROOF_TREES[id], `${id}: PROOF_TREES`); assert.ok(FLAT_PROOF.has(id), `${id}: FLAT_PROOF`); assert.ok(GO_TREES.has(id), `${id}: GO_TREES`);
    assert.ok(!PROOF_PATHS[id], `${id}: never a leaver's PROOF_PATHS (its tree IS the proof)`);
    for (const [name, list] of [['PROOF_NODE_LIST', PROOF_NODE_LIST], ['LOCKED_PROOF_NODES', LOCKED_PROOF_NODES], ['NEW_PLAYER_NODES', NEW_PLAYER_NODES]]) assert.ok(list.includes(node), `${id}: its node '${node}' in registry.js#${name}`);
    assert.ok(hasExtra(id), `${id}: match-report.js#EXTRA (a missed one threw on every report)`);
    assert.ok(QUICK_SOLO[id], `${id}: match-report.js#QUICK_SOLO`);
    if (RUN_CARD_WAITS[id]) assert.ok(!runGames.includes(id), `${id}: its run card is there now — take it off RUN_CARD_WAITS (${RUN_CARD_WAITS[id]})`);
    else assert.ok(runGames.includes(id), `${id}: share-card.js#RUN_GAMES`);
    assert.ok(!DROP_GUARD.includes(id) && !DEALER_GAMES.includes(id), `${id}: a proof game is never host-graded or dealt`);
  }
  assert.match(src('api/report.js'), /for \(const id of VERIFIED_SOLO\) if \(!PROOF_GAMES\[id\] \|\| !PROOF_TREES\[id\] \|\| !GO_TREES\.has\(id\)\) throw new Error/, 'report.js refuses to load with a proof game missing');
  for (const id of VERIFIED_SOLO) assert.match(src('api/report.js'), new RegExp(String.raw`${id}: Object\.freeze\(\{ node: PROOF_NODES\.${id},`), `${id}: report.js#PROOF_GAMES`);
});

test('M1: every PLAYABLE reported game is in ONE of the three trust lists — proof (PROOF_NODES), host-graded (DROP_GUARD), dealt (DEALER_GAMES)', () => {
  const playable = GAMES.filter(g => g.playable).map(g => g.id);
  assert.ok(playable.length >= 5);
  for (const id of playable) {
    const trust = [PROOF_NODES[id] ? 'proof' : null, DROP_GUARD.includes(id) ? 'host-graded' : null, DEALER_GAMES.includes(id) ? 'dealt' : null].filter(Boolean);
    assert.equal(trust.length, 1, `${id}: in exactly one trust list (${trust.join(', ') || 'none — it would be paid from the host’s own result'})`);
    if (!DEALER_GAMES.includes(id)) assert.ok(REPORT_GAMES.includes(id), `${id}: reported`);
  }
});
