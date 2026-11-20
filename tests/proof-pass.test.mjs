// THE PROOF PASS (Nov 20 — docs/games/passes/proof-pass.md): THE PROOF TREE's shared helpers (js/core/proof.js) + their numbers PINNED to
// database.rules.json (the rules can not import a constant: a test keeps the two the same) + THE LIVE LOCK by the stamp (core/room-logic.js).
// The rules themselves: tests/integration/rules.test.mjs "THE PROOF PASS" (the emulator) · the writer: tests/proof-writer.test.mjs ·
// the server's guards: tests/jaywalk-match.test.mjs + tests/highrise-match.test.mjs "THE PROOF PASS".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GO_WINDOW_MS, LEAF_MS, RS_MS, CALL_UID_MAX, T0_KEY, T0_SUNSET_MS, firstGo, goOf, stampOf, onTime, goUids, inMatch, fullDraw } from '../js/core/proof.js';
import { proofUnlocked, staleProofPaths, PROOF_LOCK_MS, PROOF_LOCK_SLACK_MS } from '../js/core/room-logic.js';
import * as JW from '../js/games/jaywalk/logic.js';
import * as HR from '../js/games/highrise/logic.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const RULES = JSON.parse(read('database.rules.json')).rules.rooms.$code;

test('THE PROOF TREE (core/proof.js): PURE; THE FIRST GO = the earliest go among the PLAYERS\' nodes (never the stamp, never junk); a GO is on time within the window; a node counts only with its GO', () => {
  assert.doesNotMatch(read('js/core/proof.js'), /^import /m, 'no imports: the phones, the host and the server read it');
  assert.equal(JW.firstGo, firstGo); assert.equal(HR.firstGo, firstGo);
  const tree = { [T0_KEY]: 990, a: { go: 1005 }, b: { go: 1001, c: { 0: { s: 'U0', at: 1100 } } }, c: { c: { 0: { s: 'U0', at: 1100 } } }, d: null, e: 7, f: { go: 'x' }, g: { go: -4 } };
  assert.equal(firstGo(tree), 1001, 'the stamp (990) is not a GO; a node without one, a null, a number, a bad go: skipped');
  assert.equal(firstGo({}), 0); assert.equal(firstGo(null), 0); assert.equal(firstGo({ t0: 5 }), 0);
  assert.equal(stampOf(tree), 990); assert.equal(stampOf({ a: { go: 5 } }), 0); assert.equal(stampOf({ t0: { go: 5 } }), 0, 'a stamp is a NUMBER');
  assert.deepEqual(goUids(tree).sort(), ['a', 'b'], 'the players with a GO — c (chunks alone) proves nobody');
  assert.equal(goOf(tree.a), 1005); assert.equal(goOf(990), 0); assert.equal(goOf(null), 0);
  assert.equal(GO_WINDOW_MS, 5000); assert.equal(LEAF_MS, 3 * 3600 * 1000);
  assert.ok(onTime({ go: 1001 + 5000 }, 1001) && !onTime({ go: 1001 + 5001 }, 1001) && !onTime({}, 1001) && !onTime({ go: 5 }, 0));
  assert.ok(inMatch(tree, 'a', 1001) && !inMatch(tree, 'c', 1001) && !inMatch(tree, 'zz', 1001) && !inMatch(tree, T0_KEY, 1001));
  assert.ok(fullDraw(['a', 'b'], ['a', 'b']) && !fullDraw(['a'], ['a', 'b']) && !fullDraw(['a'], ['a']), 'a full draw = everyone first, in a match of two or more');
  // (the report narrows a GO tree by goUids — api/report.js#provenUids: pinned in tests/jaywalk-match.test.mjs; run in server.test.mjs)
  assert.ok(read('api/report.js').includes("const GO_TREES = new Set(['jaywalk', 'highrise']);"));
});

test('THE NUMBERS ARE THE RULES\' (database.rules.json `jw` + `hr`): the GO window, the leaves\' 3 h, the sunset, the 10-min lock — each pinned equal; the same rule text for both nodes but the game\'s name', () => {
  assert.equal(T0_SUNSET_MS, Date.UTC(2026, 10, 27, 9, 0, 0), 'Nov 27 2026, 09:00 UTC (4 am New York)');
  assert.equal(T0_SUNSET_MS, 1795770000000);
  for (const [node, gid] of [['jw', 'jaywalk'], ['hr', 'highrise']]) {
    const M = RULES[node].$match, U = M.$uid, tree = `root.child('rooms/' + $code + '/${node}/' + $match`, go = `${tree} + '/' + $uid + '/go')`;
    assert.ok(U.go['.write'].endsWith(`(${tree} + '/t0').isNumber() ? now <= ${tree} + '/t0').val() + ${GO_WINDOW_MS} : now < ${T0_SUNSET_MS})`), `${node}: a GO within GO_WINDOW_MS of the stamp — or, until the sunset, in a tree without one`);
    assert.ok(U.go['.write'].includes("$match.matches(/^[a-z0-9]{3,16}$/)") && M.t0['.write'].includes("$match.matches(/^[a-z0-9]{3,16}$/)"), `${node}: only under a real match id (api/report.js takes the same shape)`);
    assert.equal(M.t0['.validate'], 'newData.isNumber() && newData.val() === now', `${node}: the stamp = the server's time`);
    assert.ok(M.t0['.write'].endsWith(`newData.exists() && !${tree}).exists()`), `${node}: the stamp only while the tree is EMPTY, never deleted by its writer`);
    assert.ok(M.t0['.write'].includes(`/game/id').val() === '${gid}'`) && M.t0['.write'].includes("/game/participants/' + auth.uid).exists()") && M.t0['.write'].includes("/kicked/' + auth.uid).exists()"), `${node}: by a seated, un-kicked player of this game's match`);
    const own = `${go}.isNumber() && now < ${go}.val() + ${LEAF_MS}`;
    for (const [leaf, rule] of [['c/$i', U.c.$i['.write']], ['e', U.e['.write']], ['k', U.k['.write']], ...(U.rs ? [['rs', U.rs['.write']]] : [])]) {
      assert.ok(rule.includes(leaf === 'rs' ? `${go}.isNumber() && now < ${go}.val() + ${RS_MS}` : own), `${node}/${leaf}: on its player's OWN go + ${leaf === 'rs' ? 'RS_MS (10 s — the review)' : 'LEAF_MS'}`);
      assert.doesNotMatch(rule, /game\/|\/players\/|\/kicked\/|meta\//, `${node}/${leaf}: reads NOTHING the host writes (hole a)`);
      assert.ok(rule.startsWith('auth != null && auth.uid === $uid && '), `${node}/${leaf}: its own player only`);
    }
    assert.doesNotMatch(U.k.w['.validate'], /game\//, `${node}/k/w: the named player by THEIR OWN go — not the host's list`);
    assert.ok(U.k.w['.validate'].startsWith(`newData.isString() && newData.val().length <= ${CALL_UID_MAX} && newData.val().matches(/^[A-Za-z0-9]+$/) && `), `${node}/k/w: a uid's shape, bounded (THE FRESH-EYES REVIEW: it had no bound)`);
    assert.ok(M['.write'].endsWith(`(!data.exists() || (data.child('t0').isNumber() ? data.child('t0').val() < now - ${PROOF_LOCK_MS} : (data.child(auth.uid).child('go').isNumber() && data.child(auth.uid).child('go').val() < now - ${PROOF_LOCK_MS})))`), `${node}: THE LOCK — by the stamp's age; a tree without one by the host's own GO, as before`);
  }
  const same = s => JSON.stringify(s).split('highrise').join('G').split('jaywalk').join('G').split("/hr/'").join("/N/'").split("/jw/'").join("/N/'");
  const jw = RULES.jw.$match, hr = RULES.hr.$match;
  assert.equal(same(jw.t0), same(hr.t0)); assert.equal(same(jw.$uid.go), same(hr.$uid.go)); assert.equal(same(jw['.write']), same(hr['.write'])); assert.equal(same(jw.$uid.k), same(hr.$uid.k)); assert.equal(same(jw.$uid.e['.write']), same(hr.$uid.e['.write']));
  assert.equal(same(hr.$uid.c.$i['.write']), `${same(jw.$uid.c.$i['.write']).slice(0, -1)} && !root.child('rooms/' + $code + '/N/' + $match + '/' + $uid + '/e').exists()"`, 'hr alone: nothing after its own end (as before)');
  // the file Ben publishes = the repo's (the pass saves it: Downloads\NEON\database.rules.nov20-proof.json)
  assert.ok(Object.keys(RULES.jw.$match).includes('t0') && Object.keys(RULES.hr.$match).includes('t0'));
});

test('THE LIVE LOCK reads the stamp (core/room-logic.js#proofUnlocked — the host\'s prune asks only for what the rules allow): a stamped tree unlocks by ITS STAMP, whoever the host is; a tree without one by the host\'s own GO', () => {
  const now = 1_800_000_000_000, OLD = now - PROOF_LOCK_MS - PROOF_LOCK_SLACK_MS - 1, YOUNG = now - PROOF_LOCK_MS + 1000;
  assert.equal(PROOF_LOCK_MS, 600_000);
  assert.equal(proofUnlocked({ t0: OLD, p2: { go: OLD + 100 } }, 'host', now), true, 'stamped 10.5 min ago: it goes — no GO of the host\'s needed');
  assert.equal(proofUnlocked({ t0: YOUNG, host: { go: OLD } }, 'host', now), false, 'a young stamp holds the tree whatever the host\'s own go says (THE PRE-DATED GO)');
  assert.equal(proofUnlocked({ host: { go: OLD }, p2: { go: now } }, 'host', now), true, 'no stamp (before the re-publish / an old phone): the host\'s own GO, as before');
  assert.equal(proofUnlocked({ host: { go: YOUNG } }, 'host', now), false); assert.equal(proofUnlocked({ p2: { go: OLD } }, 'host', now), false); assert.equal(proofUnlocked(null, 'host', now), false);
  assert.equal(proofUnlocked({ t0: 'x', host: { go: OLD } }, 'host', now), true, 'a stamp is a NUMBER — junk falls back to the GO (the rules: isNumber)');
  const trees = { jw: { keep1: { t0: now }, old1: { t0: OLD, p2: { go: OLD } }, live1: { t0: YOUNG, host: { go: YOUNG } } }, hr: { old2: { host: { go: OLD } }, mine: { p2: { go: 1 } } }, prism: { p1: { a: 1 } } };
  assert.deepEqual(Object.keys(staleProofPaths(trees, ['keep1'], { nodes: ['jw', 'hr'], uid: 'host', now })).sort(), ['hr/old2', 'jw/old1', 'prism/p1'], 'the prune: only what the rules will take');
});
