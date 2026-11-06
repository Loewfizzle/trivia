// OVERCLOCK — SPELLCHECK's letters (OC3B — THE ANSWER: the letters people usually get wrong underlined in the right spelling, the wrong
// letters marked in YOUR PICK). PURE (tests/overclock-oc3b.test.mjs): an LCS alignment of two spellings, then a few readable rules.

/** align spelling a against b: extra[i] = a's letter i isn't in their longest common run; gaps[i] = b has letter(s) a lacks just before a[i] */
export function spellAlign(a, b) {
  a = String(a); b = String(b);
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const extra = new Array(n).fill(false), gaps = new Array(n + 1).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) { extra[i] = true; i++; } else { gaps[i] = true; j++; }
  }
  while (i < n) extra[i++] = true;
  if (j < m) gaps[n] = true;
  return { extra, gaps };
}
// a gap right beside a changed letter is a SUBSTITUTION (separate / seperate) — the changed letter already says it
const lone = (gaps, extra, i) => gaps[i] && !extra[i] && !extra[i - 1];

/** THE RIGHT SPELLING's tricky letters (vs the usual misspelling): the letters it has that the misspelling doesn't, the letter before a spot
 *  where the misspelling adds one, and a doubled letter as its PAIR (acco[mm]odate). → bool per letter */
export function trickyLetters(word, common) {
  word = String(word);
  if (!common || common === word) return new Array(word.length).fill(false);
  const { extra, gaps } = spellAlign(word, common);
  const m = extra.slice();
  for (let i = 0; i <= word.length; i++) if (lone(gaps, extra, i)) m[Math.max(0, Math.min(word.length - 1, i - 1))] = true;
  for (let i = 0; i < word.length; i++) if (extra[i]) { if (word[i - 1] === word[i]) m[i - 1] = true; if (word[i + 1] === word[i]) m[i + 1] = true; }
  return m;
}

/** A WRONG PICK vs the right spelling: { bad: its wrong letters (bool per letter), miss: the spots where letters are missing (bool per gap,
 *  0 … length) } — a substitution marks only the wrong letter */
export function wrongLetters(pick, word) {
  pick = String(pick);
  const { extra, gaps } = spellAlign(pick, word);
  return { bad: extra, miss: gaps.map((g, i) => lone(gaps, extra, i)) };
}

/** runs of a spelling for drawing: [{ t, mark }] (+ { gap: true } where a letter is missing) */
export function spellRuns(word, marks, miss = null) {
  word = String(word);
  const out = [];
  for (let i = 0; i <= word.length; i++) {
    if (miss && miss[i]) out.push({ gap: true });
    if (i === word.length) break;
    const mk = !!marks[i];
    const last = out[out.length - 1];
    if (last && !last.gap && last.mark === mk) last.t += word[i]; else out.push({ t: word[i], mark: mk });
  }
  return out;
}
