// OVERCLOCK POOLS — THE POOL FIXES (Nov 13 — the owner's fact-check reviews: Downloads\NEON\pool-fixes\; every flag verified, the verdicts in
// docs/games/passes/pool-fixes.md). What the builder can't get right from its sources BY ITSELF, fixed at the SOURCE end so every pool that
// reads the same fact gets the fix (parts/20 hands ONE list per stat — ctx.wd — to HIGHER OR LOWER, TIMELINE, CLOSEST CALL, TRUE OR FALSE,
// TRIVIA's comparisons + SORT IT), and THE RULES the checks in build.mjs + pool-rules.mjs enforce. Node only; never shipped.

// ---------------------------------------------------------------- FACT_FIX — a Wikidata value that is wrong / out of date (stat → Q → [value, why])
// Values in the POOL's units (after parts/20's SI step): m · km² · year · people. Each one checked against the source named.
export const FACT_FIX = {
  'lake-depth': {
    Q35342: [281, 'Titicaca: max depth ~281 m (ILEC / FAO) — Wikidata had 489'],
    Q49650: [229.8, 'Loch Ness: 229.8 m chart depth (the 2016 sonar 272 m was an anomaly)'],
    Q173862: [26, 'Lake Nicaragua: max depth ~26 m — Wikidata had 60'],
  },
  // THE NPS ACREAGE REPORT's GROSS area (Dec 31 2025) — the measure the rest of the pool uses
  'park-area': {
    Q223969: [310.31, 'Arches: 76,678.98 acres gross'], Q1334313: [137.48, 'Wind Cave: 33,970.84 acres gross (the old ~28,300 figure)'],
    Q45234: [0.7803, 'Gateway Arch: 192.83 acres gross (the old memorial ~91 acres)'], Q1427197: [3242.19, 'Big Bend: 801,162.34 acres gross'],
    Q843075: [33.41, 'American Samoa: 8,256.67 acres gross (the fact sheet\'s 13,500 counts leased marine area)'],
    Q337396: [198.61, 'Acadia: 49,076.65 acres gross'], Q191824: [562.88, 'Redwood: 139,090.97 acres gross (the federal 77,746 only)'],
    Q305949: [895.93, 'Petrified Forest: 221,390.21 acres gross (after the 2004 expansion)'],
  },
  // RULE 5 — "CAME OUT" / "OPENED" / "FINISHED" = the RELEASE (the first deliveries, the opening — never the unveil, the founding, the start of work)
  'car-year': { Q66311587: [2023, 'Tesla Cybertruck: first deliveries Nov 30 2023 (unveiled 2019)'], Q1634161: [2015, 'Tesla Model X: deliveries Sept 2015 (prototype 2012)'],
    Q210893: [2008, 'Tesla Roadster: production deliveries 2008 (prototype 2006)'] },
  'boardgame-year': { Q953491: [1967, 'Battleship: the Milton Bradley board game 1967 (Salvo, 1931, was pencil + paper)'] },
  'console-year': { Q1057377: [1989, 'TurboGrafx-16 (its North American name): on sale Aug 1989 (the PC Engine, Japan, was 1987)'] },
  'skyscraper-year': { Q217652: [1913, 'Woolworth Building: completed + opened Apr 24 1913'] },
  'bridge-year': { Q99236: [2004, 'Millau Viaduct: opened Dec 2004 (work began 2001)'], Q184213: [1998, 'Akashi Kaikyō: opened Apr 5 1998'],
    Q52505: [1591, 'Rialto Bridge: completed 1591 (begun 1588)'] },
  'stadium-year': { Q10285: [80, 'the Colosseum: dedicated AD 80 under Titus'] },
  'zoo-year': { Q1043283: [1891, 'the National Zoo: opened to the public 1891 (founded by Congress 1889)'] },
  'company-year': { Q35886: [1963, 'Lamborghini: the car maker (Automobili Lamborghini) 1963 — 1948 was the tractor firm'],
    Q30873: [1984, 'Dell: founded 1984 as PC\'s Limited'] },
  'band-year': { Q47871: [1987, 'Green Day: formed 1987 (as Sweet Children)'], Q13580495: [2010, 'BTS: formed 2010 (debuted 2013) — the theme asks "formed"'] },
  'uscity-pop': { Q43668: [633045, 'Louisville: 2020 census, the metro-government balance (the figure city rankings use) — not the 246,161 leftover "Louisville city" place'] },
  'country-pop': { Q1045: [19000000, 'Somalia: ~19.0 million (World Bank / UN 2024) — Wikidata\'s 11 million is decades old'] },
};

// ---------------------------------------------------------------- RULE 6 — A NATIONAL PARK's YEAR = its NATIONAL PARK designation (NPS)
// The only source of a park's year (parts/20): a park NOT in this table never ships a year. A monument / memorial / reserve date never counts
// (Badlands 1939 → 1978, Capitol Reef 1937 → 1971, Acadia 1916 → 1919 as Lafayette NP, Great Basin 1986, not Wikidata's 1987).
export const NP_YEAR = {
  Q351: 1872, Q152660: 1890, Q136559816: 1890, Q180402: 1890, Q944329: 1899, Q239304: 1902, Q1334313: 1903, Q237128: 1906, Q373567: 1910,
  Q777183: 1915, Q1163542: 1916, Q205952: 1916, Q337396: 1919, Q220289: 1919, Q205325: 1919, Q1143416: 1921, Q219562: 1928, Q222695: 1929,
  Q273195: 1930, Q1137401: 1935, Q129902: 1971, Q372093: 1938, Q306216: 1978, Q936623: 1940, Q163515: 1940, Q242681: 1941, Q274131: 1947,
  Q1137640: 1961, Q305949: 1962, Q541856: 1964, Q1163799: 1968, Q191824: 1968, Q223969: 1971, Q1368788: 1975, Q1137669: 1978, Q306193: 1980,
  Q866080: 1980, Q841503: 1980, Q836264: 1980, Q1137657: 1986, Q843075: 1988, Q1143655: 1992, Q242111: 1994, Q735202: 1994, Q676206: 1994,
  Q152820: 2000, Q175688: 2003, Q1783768: 2013, Q45234: 2018,
  // (Chiricahua: Wikidata dates the 1924 MONUMENT; its national-park year is past the pool's 2025 cut-off — not in the table, so out)
};

// ---------------------------------------------------------------- RULE 7 — SHARED TITLES: a film / book / game whose title another well-known
// work shares (a remake, a namesake). A prompt about one CARRIES ITS YEAR ("the 2009 film Sherlock Holmes"); where the year IS the answer (a
// decade question) the item is out. Matched on the normalised title (lib.mjs#norm). Each checked: the second work is real + well known.
export const SHARED_TITLES = [
  'Lilo & Stitch', 'The Avengers', 'The Jungle Book', 'Jungle Book', 'Robin Hood', 'Wonder Woman', 'Inferno', 'Hercules', 'Need for Speed: Most Wanted',
  'Sherlock Holmes', 'Aladdin', 'Alice in Wonderland', 'The Lion King', 'Beauty and the Beast', 'Cinderella', 'Mulan', 'Dumbo', 'The Little Mermaid',
  'Pinocchio', 'Lady and the Tramp', 'Peter Pan', 'Annie', 'King Kong', 'Godzilla', 'Dune', 'It', 'A Star Is Born', 'Little Women', 'West Side Story',
  'The Parent Trap', 'Freaky Friday', 'The Karate Kid', 'Footloose', 'Hairspray', 'Fantastic Four', 'Superman', 'Batman', 'Spider-Man', 'The Mummy',
  'Planet of the Apes', 'Doctor Dolittle', 'The Wizard of Oz', 'Ben-Hur', 'The Ten Commandments', 'Titanic', 'Dracula', 'Frankenstein', 'True Grit',
  'Total Recall', 'RoboCop', 'Ocean\'s Eleven', 'The Italian Job', 'Father of the Bride', 'The Pink Panther', 'Clash of the Titans', 'The Nutty Professor',
  'Jumanji', 'The Muppets', 'Tarzan', 'Black Beauty', 'Heidi', 'The Secret Garden', 'Matilda', 'Charlotte\'s Web', 'Pete\'s Dragon',
  'The Lion, the Witch and the Wardrobe', 'Willy Wonka', 'Mary Poppins', 'Ghostbusters', 'Halloween', 'Scarface', 'Psycho', 'The Thing',
  'Dawn of the Dead', 'Carrie', 'Frozen', 'Crash', 'Heat', 'Gladiator', 'Doom', 'Prey', 'Pong', 'Street Fighter', 'Sonic the Hedgehog',
  'Super Mario Bros.', 'Mortal Kombat', 'Need for Speed', 'SimCity', 'Gauntlet', 'The Haunted Mansion',
  'War of the Worlds', 'The Time Machine', 'The Great Gatsby', 'Murder on the Orient Express', 'Death on the Nile', 'The Fly', 'Cape Fear',
  'The Day the Earth Stood Still', 'The Manchurian Candidate', 'The Producers', 'Arthur', 'Fame', 'Point Break', 'Red Dawn', 'Poltergeist',
  'Evil Dead', 'Child\'s Play', 'Pet Sematary', 'Overboard',
];

// (a BOOK question — "Who wrote …?", "the book … first published" — is about the book: a film of it changes nothing. These titles name two
//  different well-known BOOKS: Dante's Inferno + Dan Brown's)
export const SHARED_BOOKS = ['Inferno', 'Origin', 'The Outsider', 'Emma'];
// (a PAINTING title many painters used — the false twin's painter may have one too: Mantegna's Adoration of the Magi)
export const SHARED_PAINTINGS = ['Adoration of the Magi', 'The Adoration of the Magi', 'Annunciation', 'The Annunciation', 'Self-Portrait', 'Sunflowers',
  'Water Lilies', 'The Kiss', 'Madonna and Child', 'Pietà', 'The Holy Family', 'Saint Jerome', 'Venus and Adonis',
  'The Return of the Prodigal Son', 'The Card Players', 'The Bathers', 'Haystacks', 'Still Life'];

// ---------------------------------------------------------------- THE REVIEW's DROPS — an item no rule can express (by id; the reason ships in
// the build log). A dropped written row also matches by its TEXT (lib.mjs#norm of its question / true statement) so a copy can't return.
export const REVIEW_DROP = {
  // TRIVIA (data-built)
  't-city-country-Q7525-Q212': 'Sevastopol: Ukraine by international law, Russian-administered since 2014 — disputed',
  't-mountain-country-Q43512-Q843': 'K2 stands on the China–Pakistan border — two right answers',
  't-author-Q26193-Q924927': 'THE KID-SAFE FILTER (an antisemitic forgery) + a disputed attribution',
  't-author-Q651532-Q321691': 'The Three Little Pigs is a folktale — no single author',
  't-author-Q557867-Q59896': 'THE KID-SAFE FILTER (an erotic novel)',
  't-team-Q32096': 'the Super Bowl is a game, not a team',
  't-team-Q206312': 'the Arizona Coyotes are inactive (2024) — "do … play" is out of date',
  't-decade-Q49740': 'Minecraft: public 2009, official 1.0 in 2011 — "first come out" has two answers',
  't-decade-Q639619': 'Super Mario Bros. 3: Japan 1988, the U.S. 1990 — RULE 5 (the release a player knows)',
  't-decade-Q127149': 'THE KID-SAFE FILTER (Lolita)',
  't-character-Q213480-Q15228': 'Legolas is in the Hobbit FILMS — "The Hobbit" is a second right answer',
  // TRUE OR FALSE (data-built)
  'd-capital-Q983-Q1140136-Q3818': 'Equatorial Guinea: Ciudad de la Paz named capital Jan 2026, the move runs to 2027 — arguable',
  'd-painter-Q1638622-Q5681': 'Mantegna painted an Adoration of the Magi too — the false twin is also true',
  'd-painter-Q326503-Q296': 'THE KID-SAFE FILTER (Courbet\'s The Sleepers)',
  'd-painter-Q512755-Q41264': 'THE KID-SAFE FILTER (a garbled Spanish title that reads as a slur)',
  // CLOSEST CALL
  'c-runtime-Q228186': 'Lawrence of Arabia: three cuts (216 / 222 / 227 min) — no one running time',
  'c-runtime-Q180098': 'Ben-Hur (1959): 212 min, or 222 with the overture + intermission — a careful player has two answers',
  // MISSING LINK (no clean American third clue, or too many answers)
  'm-castle': 'AIR CASTLE is rare; BOUNCY CASTLE is British (US: bounce house) — no clean third clue',
  'm-wool': 'COTTON WOOL is British; no common American third WOOL phrase',
  'm-stairs': 'WARD / WARDS / SIDE / STAGE / BEAT / SWING / FIELD / DRAFT all fit DOWN + UP + BACK — not one answer',
  'm-cab': 'MINICAB + CABSTAND are British / rare; no two clean American replacements',
  'm-rein': 'REINFORCE + REINVEST are RE- words, not REIN compounds (RULE 1)',
};
/** written rows dropped by their text (the review's out-of-date / wrong ones whose fix is a new answer — never kept on a guess) */
export const REVIEW_DROP_TEXT = {
  'Which dog breed is the most popular in the U.S. for many years?': 'out of date: the French Bulldog has led the AKC list since 2022',
  'What is the longest river in the United States?': 'Missouri vs Mississippi depends on how each is measured',
  'What is the largest desert in Asia?': 'wrong: the Arabian Desert (~2.3 million km²) is larger than the Gobi',
  'What is the boundary where two tectonic plates meet called?': 'wrong: a plate boundary — not every boundary is a fault',
  'What is the largest city in Australia by population?': 'Sydney or Melbourne depending on the measure (ABS 2025)',
  "Mount McKinley's official name is Denali.": 'out of date: the federal name went back to Mount McKinley in 2025',
};

// ---------------------------------------------------------------- MISSING LINK — a second answer the dictionaries can't confirm (the review)
export const ML_ACCEPT_ADD = {
  'm-hard': ['SOFT'],          // softcore · softcover · softwood (M-W)
  'm-writer': ['WRITING'],     // songwriting · screenwriting · copywriting
  'm-brow': ['BALL'],          // eyeball · highball · lowball
  'm-town': ['WARD'],          // downward · homeward · upward
  'm-low': ['HIGH'],           // highland · highlight · high tide
};

// ---------------------------------------------------------------- SORT IT — a card on the wrong side / on both / not a real item ('*' = every set)
export const SORT_CARD_DROP = {
  '*': ['Commonwealth realm of Guyana'],          // Wikidata junk — Guyana (already a card) has been a republic since 1970
  'd-river-2000mi': ['Mackenzie River'],          // main stem 1,080 mi, the river system 2,635 mi — the set measures systems
  'd-in-asia-oceania': ['Indonesia'],             // a country in both Southeast Asia and Oceania (western New Guinea)
};

// ---------------------------------------------------------------- RULE 8 — a CLOSEST CALL / comparison names its MEASURE (labels as asked)
export const CC_LABEL_FIX = {
  Q44057: "London's Millennium Bridge",           // (Gateshead's + others share the name)
  Q27: 'the Republic of Ireland',                  // (the island is its own question)
  Q142: 'France, with its overseas regions',       // (643,801 km² — metropolitan France is 543,941)
  Q20: 'Norway, with Svalbard + Jan Mayen',         // (385,207 km² — the mainland is 323,802)
};

// ---------------------------------------------------------------- a stat's item that doesn't belong in it (stat → Q → why)
export const STAT_DROP = {
  'zoo-year': { Q1155919: 'the Georgia Aquarium is an aquarium, not a zoo' },
};
// ---------------------------------------------------------------- CLOSEST CALL — a running time Wikidata has wrong (id → [minutes, why])
export const CC_VALUE_FIX = {
  'c-runtime-Q103372692': [102, 'Encanto (2021): 102 min theatrical (IMDb / D23) — Wikidata had 109'],
  'c-runtime-Q204662': [79, 'The Sword in the Stone (1963): 79 min — Wikidata had 75'],
};
// ---------------------------------------------------------------- SPELLCHECK — REAL words the three dictionaries miss (never a WRONG option)
export const REAL_WORDS = new Set(['pollan', 'assart', 'unbanded', 'untile', 'translater', 'resistent', 'sinal']);
