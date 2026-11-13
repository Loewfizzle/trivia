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
- **Fallback trivia (LAST SIGNAL / HIGH STAKES / BLUFF — the shared `js/trivia/`):** append `[category, "medium"|"hard", question, correct, wrong1,
  wrong2, wrong3]` to `data/trivia/fallback.json`; categories must match `js/trivia/categories.js`. `tests/trivia.test.mjs` validates it.
  OVERCLOCK no longer reads it (OC7: its own bank, below).
- **Overclock — EVERY BIG POOL IS BUILT (OC6 + OC7):** TRUE OR FALSE, HIGHER OR LOWER, TIMELINE, SORT IT, TRIVIA LIGHTNING, CLOSEST CALL, MISSING
  LINK, SPELLCHECK — never edit `data/oc/{truefalse,higherlower,timeline,sortit,trivia,closest,missinglink,spellcheck}.json` by hand; add to the
  build's inputs (a written file, a hand file, a Wikidata template) and rebuild — see **THE POOL BUILD** below.
- **Overclock ODD ONE OUT (OC4 — four families, `js/games/overclock/odd.js`):** a LETTERS / NUMBERS pair = `['one', 'other', tier]` in
  `GLYPH_PAIRS` (tier 0 easy · 1 medium · 2 hard; FAIR in the monospace face at a ~54-pt cell — one or two characters, no duplicates; either
  may be the odd one); a ROTATION / MIRROR shape = a name in `ROT_SHAPES` / `MIRROR_SHAPES` + its neon path (100 × 100) in
  `ui/oddart.js#PATHS` (a rotation shape must have no turn that maps it onto itself; a mirror shape must look FLIPPED, not turned); a NEON
  SHAPE = an id in `NEON_ODD` + its two tokens in `odd.js#oddGrid` + its art + its why line in `oddWhy`. Never a colour difference (colour-blind
  players). `tests/overclock-oc4.test.mjs` checks the catalogs, the night keys and the phone rule (turns ≥ 25°, a gap moved ≥ 90°).
- **Overclock — THE ROOM's NIGHT MEMORY (OC1 → OC7):** every built pool is remembered by each item's STABLE ID (a Wikidata Q-id, or the id the
  build gave a written item) — `deal.js`: `tf-<id>`, `hl-<stat>-<item>`, `tl-<theme>-<item>`, `so-<set>`, `tv-<id>`, `cc-<id>`, `ml-<id>`,
  `sp-<id>`. A rebuild that adds, drops or reorders rows keeps the night's memory.
- **Cipher Breach / Unscramble words:** edit the blocklist or sizes in `scripts/build-words.mjs` and rebuild (below).


## THE POOL BUILD (OC6 + OC7 — `scripts/oc-pools/`)
`node scripts/oc-pools/build.mjs` builds OVERCLOCK's eight big pools + THE DAILY RESERVE (`--offline` = the caches only; `--refresh` = ask Wikidata
again; `--skip=40-sortit,…` leaves parts out; `--failed` lists the written rows their source didn't confirm; `--verbose` every drop). Deterministic:
the same caches → byte-identical files. Its parts (`parts/*.mjs`, run in name order) add rows; the builder then applies THE RULES (below), drops +
counts what breaks one, splits off the reserve and writes:
- `data/oc/truefalse.json` `{ items: [{ id, t, f, src, cat }] }` · `higherlower.json` `{ stats: [{ id, stat, ask, unit, win, gap?, src?, items: [[label,
  value, shown|null, id, src?]] }] }` · `timeline.json` `{ themes: [{ id, theme, ask, dir, unit?, items: [[label, value, shown|null, id, src?]] }] }` ·
  `sortit.json` `{ sets: [{ id, left, right, L, R, src }] }` · OC7's `trivia.json` `{ v: 1, items: [{ id, cat, d: easy|medium|hard, q, a, w: [3],
  src }] }` · `closest.json` `{ v: 3, questions: [{ id, cat, q, value (metric), unit, src }] }` · `missinglink.json` `{ v: 2, puzzles: [{ id,
  clues: [[WORD, 'after'|'before', ''|' '] × 3], answer, accept: [], src }] }` · `spellcheck.json` `{ v: 2, words: [{ id, right, wrong: [3], hard:
  [letter indexes], src }] }` — THE PARTY POOLS (lazy-loaded by banks.js, only for a match that deals them).
- `api/_data/oc-reserve/<the same eight>.json` — THE DAILY RESERVE: ~20% of every pool (`lib.mjs#isReserve`: a stable hash of the id), SERVER-ONLY
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
- `60-oc7-legacy` — the OC1–OC5 SPELLCHECK + MISSING LINK rows kept (`hand/legacy-*.json`), through the same checks as the new rows (a missing
  link's sides found by `phrases.mjs#joinKind`).
- `70-wd-closest` — CLOSEST CALL from WIKIDATA: 17 stats (peaks, towers, bridges' MAIN SPAN, country / state / island / lake / park areas, lake
  depths, atomic numbers, the 2020 census, how old a famous person was at death — both dates to the day, a natural death, `hand/oc7-exclude.mjs#
  LIVED_EXCLUDE` for the obscure + the wrong, a film's running time with its year, a finished show's episodes, straight-line miles between famous
  cities from the curated `DIST_US` / `DIST_WORLD` pairs). The question NAMES its unit; the screen converts (`challenges.js#closestAnswer`).
- `75-wd-trivia` — TRIVIA's data half: 26 templates (capitals both ways, continents, U.S. state capitals with the big-city trap, city / peak /
  island → country, park / city → state, who wrote / directed / painted / composed / released it, element symbols, a team's sport, World Cup hosts,
  WHICH OF THESE IS THE LARGEST — each set's winner once per stat, official languages, the decade, a band's country, characters, inventors, an
  athlete's sport, a musician's instrument, presidents). Wrong answers from the SAME CLASS at a similar fame (`near()`), never an alias of the right
  one (`lib.mjs#aliasOf`); the difficulty = the fame rank inside a template; `TV_TEMPLATE_CAP` 220. By-hand lists in `hand/oc7-exclude.mjs`.
- `80-written-trivia` — TRIVIA's written half (`written/tv-<cat>.json`: `{ cat, rows: [[question, answer, "wrong|wrong|wrong", e|m|h, Wikipedia
  article, proof]] }`) — the same source check as TRUE OR FALSE; id `w<hash of the question>`. (`written/cc-*.json` = written CLOSEST CALL rows,
  `[question, value, unit, article, proof]` — none yet.)
- `85-missinglink` — MISSING LINK, written by hand (`hand/missinglink-written-<n>.json`: `["ANSWER", "CLUE+ CLUE- CLUE+_"]` — `+` the clue comes
  FIRST (SUN+ → SUNFLOWER), `-` the answer first (GLASS- → HOURGLASS), `_` a space (a two-word phrase: RUSH+_ → RUSH HOUR)). Every JOIN must be
  real: a one-word join in Hunspell en_US or ENABLE (`dict.mjs`), a two-word join with its own WIKTIONARY entry (`phrases.mjs` — the titles dump,
  31 MB, is UNCOMMITTED in `cache/wikt-raw/` and re-downloaded on a rebuild; every verdict is kept in `cache/phrases.json`, committed, so an
  offline rebuild + the tests need no dump). THE ONE-ANSWER RULE: a second word that fits all three as one-word compounds goes in `accept`.
  `ml-gen.mjs` = a candidate helper for the author (never run by the build); `hand/ml-exclude.mjs` = what was read and rejected.
- `90-spellcheck` — SPELLCHECK (`hand/spellcheck-picked.json`: `[right, wrong, wrong, wrong]`, the FIRST wrong = the most common misspelling):
  the right word in Hunspell en_US (SCOWL — American), no wrong one a word in en_US / en_GB / ENABLE, no rude run of letters (`spell-gen.mjs#rudeIn`),
  no second accepted American spelling (`VARIANTS`); `hard` = the letters the common misspelling gets wrong (`spell-rules.mjs#hardLetters` — the
  answer screen underlines them). `spell-gen.mjs` proposes candidates from Peter Norvig's word counts + Wikipedia's list of common misspellings
  (`node scripts/oc-pools/spell-gen.mjs <count_1w.txt> <misspellings.txt>` — neither committed); a person reads them (`hand/spell-exclude.mjs`).

**The dictionaries** (`scripts/oc-pools/dict/`, committed gzipped): Hunspell en_US + en_GB from SCOWL (the `dictionary-en` 4.0.0 /
`dictionary-en-gb` 3.0.0 packages — SCOWL's MIT-like licence in `LICENSE-SCOWL.txt`), expanded with the .aff rules; ENABLE (public domain).

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
- READABLE: a statement ≤ 90 characters (a full sentence), a label / a card ≤ 32; plain words. OC7: a question ≤ 110, an answer ≤ 28, a clue ≤ 10,
  a join ≤ 20, a spelling ≤ 16 (`lib.mjs`).
- ONE FACT ONCE: no question twice across TRIVIA + CLOSEST CALL, never a TRUE OR FALSE statement as a question; a written trivia row that only
  repeats a data template (a capital, a city's country) is left to the data half.
- ALL AGES: `lib.mjs#BANNED` (+ films / games only with a family rating: G · PG · PG-13 / E · E10+ · T).
- US-FIRST: American wording; values METRIC in the data, US units on screen (`js/games/overclock/units.js`: ft, mi, sq mi, lb, mph, °F — whole
  numbers to 100,000, three significant figures above, "million" / "billion").
- LASTING: no "current", "latest", "this year", no living person's age or net worth, no record that keeps changing.
- STABLE IDS: a Q-id, `h-<slug>` (hand), `w<hash of the true text>` (written), `d-<template>-<Q-ids>` (data) — [A-Za-z0-9_-] (database keys).
  OC7: `t-<template>-<Q-ids>` (data trivia) · `w<hash of the question>` (written trivia) · `c-<stat>-<Q-ids>` (closest call) · `m-<answer>` ·
  `s-<right word>`.

**OC8 — THE FABLE REVIEW's content fixes (fix the TEMPLATE, never the row) + MISSING LINK's top-up** (docs/overclock.md OC8 has every count):
- `hand/oc8-exclude.mjs` = THE FAME FILTER, TIGHTENED — only ever REMOVES an item: `OC8_ONLY` (the stats sitelinks can't rank — rivers, bridges,
  islands, lakes, skyscrapers, mountains, towers, consoles, zoos, theme parks, board games, cars, probes — keep ONLY the items an American player
  knows, by the English label raw or cleaned), `OC8_OUT` (more out of a stat), `OC8_KEEP` (a smaller top-n), `OC8_CUT` (coasters ×2 + airplanes),
  `FAMOUS_COUNTRIES` (the country stats + their comparisons + the capital / continent / language questions ASK only about these). OC7's by-hand
  OBSCURE lists (read for CLOSEST CALL) now apply to HIGHER OR LOWER / TIMELINE / TRUE OR FALSE's same stats too (`parts/20-wd-hl.mjs#famous`). The
  atomic numbers keep the everyday elements (+ krypton, plutonium).
- THE PEOPLE TEMPLATES: "Which sport is X famous for?" = ATHLETES ONLY — the person's own occupation is that sport's player (`SPORT_PLAYER`, by
  the occupation's English label, Wikidata `P106` — cache `tv-athlete-occ`) and nobody also a film actor / politician / royal / novelist …
  (`ATHLETE_ALSO`; a plain actor / writer / model is fine — a cameo, a memoir). The instrument template is CUT (`INSTRUMENT_CUT`). Directors +
  inventors by their OWN Wikipedia count (`DIRECTOR_FAME` 60 · `INVENTOR_FAME` 55 — caches `tv-director-fame`, `tf-director-fame`,
  `tv-inventor-fame`): the right answer AND the wrong ones; an inventor's wrong answers come from the other inventors of the listed inventions, and
  the non-inventions (judo, aikido, a blood type, a unit …) are out (`INVENTION_OUT`). World Cups from 1966 (`CUP_SINCE`).
- TRUE OR FALSE: "born in the 20th century" (the century by its name — "the 1900s" read as the decade); a famous mountain only (`TF_MOUNTAIN_FAME`
  70); the makers as people say them (`MAKER_FIX` — "made by Sony"); the template cap 85 → 70 (the data half shrank — still ≤ 8.5 % a template).
- CLOSEST CALL: the episode counts CUT (arguable — reboots, half-episodes); the main spans without the London Bridge + the Rialto (`OC8_SPAN_OUT`).
- MISSING LINK: `hand/missinglink-written-6…10.json` (OC8's 344 hand-written → 323 kept). EVERY CLUE A WORD ON ITS OWN (the "MENT" lesson —
  `tests/overclock-content.test.mjs`); 13 older clues replaced. THE BUILD decides a duplicate answer AFTER the rules (a legacy row that died on a
  rule used to claim its id first and block every later puzzle with that answer).
- Written rows reworded: the Four Corners ("Where do Arizona, Utah, Colorado and New Mexico all meet?"), Roblox, the earthquake + watercolor wrongs.
- The content test's floors follow the deliberate cuts (each line says why).

### THE POOL RULES + THE REVIEW's FIXES (THE POOL FIXES, Nov 13 — docs/overclock.md "THE POOL RULES")
A fact-check finding is fixed at its SOURCE: a written row in `written/*.json` / a hand file, or — when the builder can't express it at its source —
`hand/pool-fixes.mjs` (a wrong Wikidata value `FACT_FIX` / `CC_VALUE_FIX`, a park's year `NP_YEAR`, a shared title, a reasoned drop `REVIEW_DROP` /
`REVIEW_DROP_TEXT`, a stray SORT IT card, a label, a second MISSING LINK answer, a real word the dictionaries miss). The 8 rules (`pool-rules.mjs` +
`kidsafe.mjs`) are checks the build runs; `tests/overclock-pool-rules.test.mjs` re-checks every item. To add a kid-safe term: `kidsafe.mjs#KIDSAFE`
(every bank + THE PASSWORD pick it up on the next build).

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

## THE PASSWORD's answer list (PW1 — `scripts/pw-words/`, docs/password.md "The list build")
SERVER-ONLY (`api/_data/pw/answers.json` — never served, never imported by a page; `tests/password-list.test.mjs`), NOT data/words/answers-5.json.
`node scripts/pw-words/build.mjs <count_1w.txt> --candidates` → `candidates.json` (ENABLE ∩ the Hunspell en_US base words, ranked by Norvig, five
letters, minus inflections + the house blocklist + THE KID-SAFE LIST in `blocklist.mjs`) → THE REVIEWER (a separate agent over the whole list; when in
doubt, out) writes `cuts.json` (+ `cuts-tail.json` for a widened pool) → `node scripts/pw-words/build.mjs <count_1w.txt>` writes the list (+ the
server's copy of valid-5.json). The build fails without the cuts files; every answer must be in valid-5 (typeable). Nov 7: 2,807 candidates → 1,449.
To change the list: edit the blocklist or a cuts file (never answers.json by hand), rebuild, run `tests/password-list.test.mjs`.
DFIX1 (Nov 7): 47 adult-vocabulary words cut (`blocklist.mjs#ADULT_VOCAB` — applied WITH the reviewer's cuts, after the pick, so the pick never reaches past
the reviewed candidates) → **1,402** (a 701-day cycle). `count_1w.txt` is not committed: with no copy on the machine the pass applied the build's own final
step to the built list — the same output a rebuild gives, since only cuts were added. After THE SWITCH-OVER a list edit needs the schedule freeze first
(docs/password.md "The schedule").

## Word lists
Built by `scripts/build-words.mjs` from ENABLE (public domain), the SCOWL-derived Hunspell en_US
dictionary (filters to real, non-proper-noun base words) and Peter Norvig's word-frequency counts (MIT).
Answers: the ~1,300–1,400 most frequent qualifying words per length, minus plurals/past tenses and a
blocklist. Valid guesses: ENABLE ∩ Norvig's 333k list. Rebuild after editing the blocklist.
