// OVERCLOCK POOLS (OC7) — SPELLCHECK's letters: THE HARD LETTERS (the `hard` indexes THE ANSWER underlines — exactly the letters people get
// wrong, from the most common misspelling) + THE MISSPELLING RULES (the believable mistakes a wrong option is made from). PURE; Node only.

/** an edit script from `right` to `wrong` (Damerau-Levenshtein, the cheapest): [{ op: 'keep'|'sub'|'del'|'ins'|'swap', i (right's index) }] */
export function editOps(right, wrong) {
  const a = right, b = wrong, n = a.length, m = b.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2]) D[i][j] = Math.min(D[i][j], D[i - 2][j - 2] + 1);
  }
  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && D[i][j] === D[i - 1][j - 1]) { ops.push({ op: 'keep', i: i - 1 }); i--; j--; }
    else if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2] && D[i][j] === D[i - 2][j - 2] + 1) { ops.push({ op: 'swap', i: i - 2 }); i -= 2; j -= 2; }
    else if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + 1) { ops.push({ op: 'sub', i: i - 1, ch: b[j - 1] }); i--; j--; }
    else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push({ op: 'del', i: i - 1 }); i--; }
    else { ops.push({ op: 'ins', i, ch: b[j - 1] }); j--; }
  }
  return ops.reverse();
}

/**
 * THE HARD LETTERS of a right spelling vs its most common misspelling → sorted indexes into `right`:
 *   a letter the misspelling CHANGES or DROPS → that letter (a dropped letter of a double = the PAIR: acco[mm]odate, not the whole word);
 *   two letters the misspelling SWAPS → both (rec[ei]ve);
 *   a letter the misspelling ADDS → the right word's letter(s) beside it that it doubles (unti[l] ← untill), else both neighbours.
 */
export function hardLetters(right, wrong) {
  const out = new Set();
  const pairOf = i => { if (right[i - 1] === right[i]) out.add(i - 1); if (right[i + 1] === right[i]) out.add(i + 1); };
  for (const o of editOps(right, wrong)) {
    if (o.op === 'sub') out.add(o.i);
    else if (o.op === 'del') { out.add(o.i); pairOf(o.i); }
    else if (o.op === 'swap') { out.add(o.i); out.add(o.i + 1); }
    else if (o.op === 'ins') {
      const near = [o.i - 1, o.i].filter(k => k >= 0 && k < right.length);
      const same = near.filter(k => right[k] === o.ch);
      (same.length ? same : near).forEach(k => out.add(k));
    }
  }
  return [...out].filter(k => k >= 0 && k < right.length).sort((x, y) => x - y);
}
