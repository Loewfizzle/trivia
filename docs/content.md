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
- **Overclock TIMELINE / HIGHER OR LOWER / SORT IT / TRUE OR FALSE:** BUILT — never edit `data/oc/{truefalse,higherlower,timeline,sortit}.json`
  by hand; see **THE POOL BUILD (OC6)** below.
- **Overclock MISSING LINK:** append `["WORD", "WORD", "WORD", "ANSWER", ""]` to `data/oc/missinglink.json` (put other accepted
  spellings in the last field as `"GREY|GRAY"`; plurals are automatic). The answer must join all three clues (before or after) and
  NO other word may fit all three — try "fire / stone / paper": WALL works, but so does WORK, so it was changed. Answers are unique.
- **Overclock SPELLCHECK:** append `["correct", "common misspelling", "wrong", "wrong"]` (lowercase, American spelling) to
  `data/oc/spellcheck.json`. Skip words with two accepted spellings, and make sure no "wrong" option is a real word or variant
  (e.g. *calender*, *florescent* and *publically* are in dictionaries). Check new rows against ENABLE + Hunspell en_US/en_GB.
- **Overclock ODD ONE OUT (OC4 — four families, `js/games/overclock/odd.js`):** a LETTERS / NUMBERS pair = `['one', 'other', tier]` in
  `GLYPH_PAIRS` (tier 0 easy · 1 medium · 2 hard; FAIR in the monospace face at a ~54-pt cell — one or two characters, no duplicates; either
  may be the odd one); a ROTATION / MIRROR shape = a name in `ROT_SHAPES` / `MIRROR_SHAPES` + its neon path (100 × 100) in
  `ui/oddart.js#PATHS` (a rotation shape must have no turn that maps it onto itself; a mirror shape must look FLIPPED, not turned); a NEON
  SHAPE = an id in `NEON_ODD` + its two tokens in `odd.js#oddGrid` + its art + its why line in `oddWhy`. Never a colour difference (colour-blind
  players). `tests/overclock-oc4.test.mjs` checks the catalogs, the night keys and the phone rule (turns ≥ 25°, a gap moved ≥ 90°).
- **Overclock — THE ROOM's NIGHT MEMORY (OC1 → OC6):** the four OC6 pools are remembered by each item's STABLE ID (a Wikidata Q-id, or the id the
  build gave a written item) — `deal.js`: `tf-<id>`, `hl-<stat>-<item>`, `tl-<theme>-<item>`, `so-<set>`; the OC7 banks (closest, missing link,
  spellcheck) still by a hash of the row's TEXT. A rebuild that adds, drops or reorders rows keeps the night's memory.
- **Cipher Breach / Unscramble words:** edit the blocklist or sizes in `scripts/build-words.mjs` and rebuild (below).


## THE POOL BUILD (OC6 — `scripts/oc-pools/`)
`node scripts/oc-pools/build.mjs` builds OVERCLOCK's four big pools + THE DAILY RESERVE (`--offline` = the caches only; `--refresh` = ask Wikidata
again; `--skip=40-sortit,…` leaves parts out; `--failed` lists the written rows their source didn't confirm; `--verbose` every drop). Deterministic:
the same caches → byte-identical files. Its parts (`parts/*.mjs`, run in name order) add rows; the builder then applies THE RULES (below), drops +
counts what breaks one, splits off the reserve and writes:
- `data/oc/truefalse.json` `{ items: [{ id, t, f, src, cat }] }` · `higherlower.json` `{ stats: [{ id, stat, ask, unit, win, gap?, src?, items: [[label,
  value, shown|null, id, src?]] }] }` · `timeline.json` `{ themes: [{ id, theme, ask, dir, unit?, items: [[label, value, shown|null, id, src?]] }] }` ·
  `sortit.json` `{ sets: [{ id, left, right, L, R, src }] }` — THE PARTY POOLS (lazy-loaded by banks.js, only for a match that deals them).
- `api/_data/oc-reserve/<the same four>.json` — THE DAILY RESERVE: ~20% of every pool (`lib.mjs#isReserve`: a stable hash of the id), SERVER-ONLY
  (never served — Vercel serves api/ as functions only, `scripts/serve.mjs` the same; never imported by a page; never dealt in a party) for THE
  DAILY MODULE (docs/cartridge.md D2). `tests/overclock-reserve.test.mjs` proves it.

**The parts**
- `10-legacy` — SORT IT's sets kept from OC1–OC5 (`hand/sortit-legacy.json`), each with its source.
- `15-hand-checked` — hand items kept from OC1–OC5 (`hand/checked.json`: TEAM SIZE, OSCARS, BOARD SPACES; the HISTORY + SPORTS FIRSTS timelines),
  each CHECKED against its Wikipedia article.
- `20-wd-hl` — HIGHER OR LOWER from WIKIDATA (CC0): ~50 stats (heights, lengths, areas, depths, populations — the 2020 census for states + cities —
  temperatures, years); the YEAR stats feed TIMELINE too: each item goes to ONE of the two (a hash of its Q-id) — never both.
- `30-wd-tf` — TRUE OR FALSE's data half: natural templates (capitals, continents, element symbols, who painted / wrote / directed / sang it, moons,
  places, decades, centuries, comparisons), several phrasings each, `TEMPLATE_CAP` per template (none over ~8%).
- `40-sortit` — SORT IT: the COMPUTED sets (`sortcheck.mjs` — the rule is code; the tests re-compute every card), the DATA sets (Wikidata, with a
  margin around every cut-off), the WRITTEN sets (`hand/sortit-written.json`).
- `50-written` — TRUE OR FALSE's written half (`written/tf-<cat>.json`).

**Wikidata** (`wikidata.mjs` + `wdq.mjs`): the public SPARQL endpoint, a User-Agent naming the site, one query at a time (3 s apart; a 429 waits as
long as the server asks), every answer CACHED in `cache/wd/<name>.json` (committed — a rebuild works offline). THE FAME FILTER is in every query
(sitelinks: ~30+ for creative works, ~15+ for places, tuned per stat): every item is one a casual player or a kid can recognise. Each query has
two forms: Wikidata's own planner first, then the planner OFF (`hint:Query hint:optimizer "None"` — class → sitelinks → the filter → only then the
values), which the million-item classes (albums, songs, novels, paintings, companies) need to finish inside the 60-s limit. Values come NORMALIZED
to SI (metres, square metres, kelvin) and are stored as m / km / km² / °C. ARGUABLE = OUT: an item whose best-ranked values disagree by > 3% (years:
> 3 apart), a year less precise than a year, a label that two items share. `hand/wd-exclude.mjs` holds the by-hand exclusions (Q-ids + why).

**The written rows** (`written/tf-<cat>.json`: `{ cat, rows: [[true, false twin, Wikipedia article, proof]] }`): each row's PROOF must be in its
article's text (`sources.mjs` — `"eight legs"`; `"canberra&capital"` = both within a short stretch; `"8849|8,849"` = either); the article comes
from the Wikipedia API (raw text cached UNCOMMITTED in `cache/wp-raw/`), every verdict is kept in `cache/checks.json` (committed). A row its source
doesn't confirm is DROPPED, never kept on trust — fix the fact (or the proof, when the article says it in other words), never the check.

**THE RULES for every item** (the builder drops + counts; `tests/overclock-content.test.mjs` checks again — party + reserve):
- NOTHING ARGUABLE: no tomato-is-a-fruit, no country on two continents (Turkey, Russia, Egypt …), no disputed border / capital / record, no "first"
  historians argue about. If two careful people could disagree, it's out.
- STABLE NUMBERS: populations rounded + dated (the 2020 census), HIGHER OR LOWER never pairs two within 1.2× (a drifting count: 1.3× / 1.5×; years
  10+; °C 100°+), TIMELINE never deals two within 10 years (a size: 1.3×).
- FAIR FALSES: a believable mistake (the wrong neighbour, a swapped number, the next decade) — never a trick or a double negative.
- READABLE: a statement ≤ 90 characters (a full sentence), a label / a card ≤ 32; plain words.
- ALL AGES: `lib.mjs#BANNED` (+ films / games only with a family rating: G · PG · PG-13 / E · E10+ · T).
- US-FIRST: American wording; values METRIC in the data, US units on screen (`js/games/overclock/units.js`: ft, mi, sq mi, lb, mph, °F — whole
  numbers to 100,000, three significant figures above, "million" / "billion").
- LASTING: no "current", "latest", "this year", no living person's age or net worth, no record that keeps changing.
- STABLE IDS: a Q-id, `h-<slug>` (hand), `w<hash of the true text>` (written), `d-<template>-<Q-ids>` (data) — [A-Za-z0-9_-] (database keys).

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
