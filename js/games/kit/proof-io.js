// THE PROOF WRITER's WRITES + GO (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF WRITER"): the database half JAYWALK's + HIGH
// RISE's screens share — proof-writer.js (PURE) decides WHAT goes up and when; this file sends it. Every write through firebase.js
// (THE RULES-LAG: a refusal is seen).
import { dbRef, set as dbSet, get as dbGet, update as dbUpdate, runTransaction, serverTimestamp, expectRefusal } from '../../firebase.js';

/** the writer's `io` for the proof node at `path()` (rooms/{CODE}/{jw|hr}/{matchId}/{uid} — read at each write: a view's match can move) */
export const proofIo = path => ({
  now: () => performance.now(),
  timer: (fn, ms) => setTimeout(fn, ms),
  chunk: (i, s) => dbSet(dbRef(`${path()}/c/${i}`), { s, at: serverTimestamp() }),
  end: e => dbUpdate(dbRef(path()), { e }),
  read: () => dbGet(dbRef(`${path()}/c`)).then(snap => snap.val()),
});

/**
 * THE STAMP (core/proof.js): whoever GOes first stamps the match's tree — `t0`, the SERVER's time, once, only while the tree is empty
 * (the rules). A GO is then taken only within GO_WINDOW_MS of it, and the tree is locked for 10 min — nothing the host writes moves
 * either. A TRANSACTION never applied locally (a phone whose mirror already shows the stamp writes nothing). Refused = EXPECTED and
 * silent: another phone was first / began the tree, or the rules are not re-published yet (then GO works as before — the fallback).
 */
export function stampT0(tree, label) {
  const path = `${tree}/t0`;
  expectRefusal(path, `${label} t0: the tree is already stamped or begun, or the rules are not re-published yet`, 8000, 'none');
  return runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false }).then(null, () => {});
}
/**
 * GO (a MATCH): the stamp (if this phone is first), then this phone's own `go` — its proof of being there; the FIRST one to land is the
 * match's (core/proof.js#firstGo). A TRANSACTION, never applied locally (THE NODES ARE THE TRUTH: the mirror holds confirmed GOs only).
 * → Promise<true = this phone's GO is there | false = refused (a touch early, past the window, the rules not published)>
 */
export function writeMatchGo(tree, uid, label) {
  const path = `${tree}/${uid}/go`;
  stampT0(tree, label);
  expectRefusal(path, `${label} GO: already written (a rejoin), a touch early, or the rules are not published yet`);
  return runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false })
    .then(() => true, () => dbGet(dbRef(path)).then(snap => typeof snap.val() === 'number'));
}
