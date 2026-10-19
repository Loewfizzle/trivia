# Adding content

How to add questions, puzzles and words to every bank, and how the word lists are built.

## Adding content
- **Neural Bluff questions:** append rows to `data/bluff/questions.json`:
  `["category", "Something strange is called ____.", "Real Answer", ["real answer", "other accepted spellings"], ["lie 1", "lie 2", "lie 3"]]`.
  Rules: the fact must be true and surprising; the answer ≤ 4 words; variants cover common spellings; house lies must be
  believable and must not be "too close" (run `node --test tests/bluff.test.mjs` — it rejects any house lie the
  closeness check would treat as the truth). Never put "an" right before the blank (it hints that the answer starts
  with a vowel); put the article in the answer instead — it is stripped for display. Categories: brands, inventions, history, science, animals, food, geography,
  laws, words, pop, sports, misc (labels in `bluff/view.js#CAT`).
- **Fallback trivia (Last Signal / Overclock):** append `[category, "medium"|"hard", question, correct, wrong1, wrong2, wrong3]`
  to `data/trivia/fallback.json`; categories must match `js/trivia/categories.js`. `tests/trivia.test.mjs` validates it.
- **Overclock CLOSEST CALL:** append `[category, "Question that names the unit?", answer, "unit"]` to `data/oc/closest.json`.
  Only stable, well-documented numbers (no populations/records that drift); the unit must be in the question.
  `tests/overclock-new.test.mjs` checks the shape and count.
- **Overclock TIMELINE:** add items to a pool (or a new pool) in `scripts/build-timeline.mjs` — `[label, sortValue, "shown value"]`
  — then `node scripts/build-timeline.mjs`. Avoid disputed dates/measurements; the fairness gaps reject near-ties.
- **Overclock MISSING LINK:** append `["WORD", "WORD", "WORD", "ANSWER", ""]` to `data/oc/missinglink.json` (put other accepted
  spellings in the last field as `"GREY|GRAY"`; plurals are automatic). The answer must join all three clues (before or after) and
  NO other word may fit all three — try "fire / stone / paper": WALL works, but so does WORK, so it was changed. Answers are unique.
- **Overclock SPELLCHECK:** append `["correct", "common misspelling", "wrong", "wrong"]` (lowercase, American spelling) to
  `data/oc/spellcheck.json`. Skip words with two accepted spellings, and make sure no "wrong" option is a real word or variant
  (e.g. *calender*, *florescent* and *publically* are in dictionaries). Check new rows against ENABLE + Hunspell en_US/en_GB.
- **Overclock MAKE 24:** `node scripts/build-make24.mjs` (tweak the easy/hard rules at its top).
- **Overclock SORT IT:** add a pair `["LEFT", "RIGHT", [left items], [right items]]` (≥ 25 items, ≥ 7 per side) or items to a pair in
  `data/oc/sortit.json`. Only items nobody argues about (no tomato-is-a-fruit; watch ownership changes like Fox → Disney). The
  number/word pairs (PRIME, MULTIPLE OF 7, roman MORE THAN 50, MORE THAN ½, PALINDROME, LETTERS IN A–Z ORDER) are recomputed by the test.
- **Overclock HIGHER OR LOWER:** add `[item, value]` (or `[item, value, "shown"]` for things like "c. 2560 BC") to a stat in
  `data/oc/higherlower.json`, or a new stat `[STAT, "QUESTION?", unit ('year' for years), 'max'|'min', items]`. Rounded, stable
  values only (no fast-changing records); the 1.2× / 10-year pairing rule absorbs small source differences.
- **Overclock LEXICON:** `node scripts/build-lexicon.mjs <dir with enable1.txt + count_1w.txt>` (download URLs in its header).
- **Cipher Breach / Unscramble words:** edit the blocklist or sizes in `scripts/build-words.mjs` and rebuild (below).


## HUSH WORDS (room codes)
The room code is a common 4-letter word, the HUSH WORD. Source: `scripts/hushwords/words.txt` (one block per letter);
`node scripts/build-hushwords.mjs` checks it and writes `data/hushwords.json` (sorted), or lists every problem and writes
nothing (`--check` only checks). `tests/hush.test.mjs` runs the same checks on the JSON. 798 words (Oct 19, 2026).
- **Every word:** exactly 4 letters, common, spellable by a kid and a grandparent, family-friendly; concrete and upbeat
  preferred, a light speakeasy flavour welcome (JAZZ, GOLD, MINT, LIME, WINK, HUSH).
- **Never:** anything in `scripts/hushwords/blocked.txt` — rude, crude, sexual, violent, drugs / alcohol / gambling,
  religious, political, slurs or words used as one, slang that turns rude, words with a common rude reading, names, brands,
  abbreviations, tricky spellings (silent letters, two accepted spellings), and gloomy words. Add to it whenever you cut a word.
- **No homophones:** `scripts/hushwords/homophones.txt` lists groups that sound alike (PAIR PARE PEAR, KNOT NOT, ROSE ROWS,
  MARK MARC…); no 4-letter member of any group may be a hush word, because said across a room it could be spelled the other
  way. US pronunciation; the common US mergers count (WALK/WOK, wine/whine); proper nouns count (ROSY/ROSIE, STEW/STU).
- **Adding words:** add to words.txt, run the builder, then read the list again with fresh eyes — when in doubt, leave it out.
  Why not ~1,500: after the homophones, the rude/gloomy readings and the tricky spellings, about 800 common words are left —
  plenty with the 24-hour rest (`docs/data-model.md` → hush/).

## Word lists
Built by `scripts/build-words.mjs` from ENABLE (public domain), the SCOWL-derived Hunspell en_US
dictionary (filters to real, non-proper-noun base words) and Peter Norvig's word-frequency counts (MIT).
Answers: the ~1,300–1,400 most frequent qualifying words per length, minus plurals/past tenses and a
blocklist. Valid guesses: ENABLE ∩ Norvig's 333k list. Rebuild after editing the blocklist.
