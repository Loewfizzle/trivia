// THE PROOF WRITER's WRITES + GO (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF WRITER"): the database half JAYWALK's + HIGH
// The long notes: docs/games/jaywalk-notes.md
import { dbRef, set as dbSet, get as dbGet, update as dbUpdate, runTransaction, serverTimestamp, expectRefusal } from '../../firebase.js';

/** the writer's `io` for the proof node at `path()` (rooms/{CODE}/{jw|hr}/{matchId}/{uid} — read at each write: a view's match can move) */
export const proofIo = path => ({
  now: () => performance.now(),
  timer: (fn, ms) => setTimeout(fn, ms),
  chunk: (i, s) => dbSet(dbRef(`${path()}/c/${i}`), { s, at: serverTimestamp() }),
  end: e => dbUpdate(dbRef(path()), { e }),
  read: () => dbGet(dbRef(`${path()}/c`)).then(snap => snap.val()),
});

/** THE CONSOLE FIX — THE TREE CAP (database.rules.json `rooms/$code/pt`): a room holds at most this many stamped trees — every stamp
 *  advances the room's counter by one IN THE SAME WRITE (the rules take a stamp only with it, and the counter only with a new stamp).
 *  Pinned equal to the rules by tests/console-fix.test.mjs. A run past it plays as before until THE SWITCH-OVER's sunset (a GO without
 *  a stamp), then UNPROVEN — a fresh room (BACK TO THE CITY → PLAY NOW) has its own 1,000. */
export const TREE_CAP = 1000;
/**
 * THE STAMP (core/proof.js): whoever GOes first stamps the match's tree — `t0`, the SERVER's time, once, only while the tree is empty
 * (the rules). A GO is then taken only within GO_WINDOW_MS of it, and the tree is locked for 10 min — nothing the host writes moves
 * either. THE CONSOLE FIX: the stamp + the room's tree counter (`pt` — THE TREE CAP) in ONE update; refused (the counter moved under it,
 * the tree begun, or the rules before THE CONSOLE FIX) → the plain stamp as before: a TRANSACTION, never applied locally. Every refusal is
 * EXPECTED and silent: another phone was first / began the tree, or the rules are not re-published yet (then GO works as before — the
 * fallback). → a Promise that settles once the stamp is decided — the GO goes up AFTER it (a GO first would make the tree "begun").
 */
export function stampT0(tree, label) {
  const path = `${tree}/t0`, [, code, node, m] = tree.split('/');
  expectRefusal(path, `${label} t0: the tree is already stamped or begun, or the rules are not re-published yet`, 8000, 'none');
  expectRefusal(`rooms/${code}/pt`, `${label} t0: the room's tree counter moved, or the rules are not re-published yet`, 8000, 'none');
  const plain = () => runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false });
  return dbGet(dbRef(`rooms/${code}/pt/n`))
    .then(snap => dbUpdate(dbRef(`rooms/${code}`), { [`${node}/${m}/t0`]: serverTimestamp(), pt: { n: (Number(snap.val()) || 0) + 1, m, g: node } }))
    .catch(() => plain())
    .then(null, () => {});
}
/**
 * GO (a MATCH): the stamp (if this phone is first), then this phone's own `go` — its proof of being there; the FIRST one to land is the
 * match's (core/proof.js#firstGo). A TRANSACTION, never applied locally (THE NODES ARE THE TRUTH: the mirror holds confirmed GOs only).
 * → Promise<true = this phone's GO is there | false = refused (a touch early, past the window, the rules not published)>
 */
export function writeMatchGo(tree, uid, label, mirror = null) {
  const path = `${tree}/${uid}/go`;
  // (THE CONSOLE FIX — THE FRESH-EYES REVIEW: the stamp costs a read + an update before the GO; a phone whose mirror already shows the tree …
  const begun = !!mirror && typeof mirror === 'object' && Object.keys(mirror).length > 0;
  expectRefusal(path, `${label} GO: already written (a rejoin), a touch early, or the rules are not published yet`);
  // (THE CONSOLE FIX: the GO behind the stamp's answer — the stamp needs the tree empty) …
  const stamp = begun ? Promise.resolve() : stampT0(tree, label);
  return stamp.then(() => runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false }))
    .then(() => true, () => dbGet(dbRef(path)).then(snap => typeof snap.val() === 'number'));
}
