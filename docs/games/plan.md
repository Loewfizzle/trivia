# THE GAMES — the owner's decisions, one pass at a time (the dated archive; the newest at the end)

## PW1 — THE PASSWORD: THE GAME (Nov 7 2026 — daily, ships OFF)
- THE PASSWORD (id `password`): a DAILY-ONLY solo Wordle-type. Two doors in a row — THE DOOR, then THE BACK ROOM — each a 5-letter word, 6
  guesses each (normal Wordle difficulty; trap words like _ATCH are allowed). ~4 min. No practice, archive or multiplayer mode.
- Score: doors opened first, then total guesses (lower = better). Missing door 1 ends the run. ONE comparable number: score = (2 − doorsOpened)
  × 100 + guessesUsed (a clean crack = 2…12; lower is better), tie-break = total time.
- THE SERVER JUDGES EVERY GUESS: the answers live ONLY on the server and are never sent to the phone until their door closes (solved or failed —
  then that door's word may be shown). A door never attempted is never revealed. A guess that isn't a real word is refused before it counts
  (the phone pre-checks against the public data/words/valid-5.json; the server checks again).
- Answers: a NEW SERVER-ONLY list (api/_data/pw/), never served, never imported by a page — NOT data/words/answers-5.json. Common, everyday
  5-letter words; no plurals, no past tenses, nothing obscure; kid-safe (no rude, adult, alcohol, drug, violent or gloomy words).
- The day's two words come from a SECRET SCHEDULE: the server's pepper (api/_lib/dailies.js dailySeed) orders the list; two words a day; no word
  repeats until the list is used up. Never computable from the date (the repo is public).
- Daily rules: one try a day (the 4 am Eastern streak day), resume after a refresh / app switch, never a restart. If the room starts a game
  mid-run, NOTHING is lost or counted (no clock, no open question): letters typed but not sent are cleared, and the run resumes on the same
  door / next guess. (THE DAILY MODULE owns the banner, the pause and the RESUME chip — later.)
- Board: a 6 × 5 grid of 58 pt tiles, the kit LETTER KEYBOARD below (keys ≥ 54 pt), the submit key reads ENTER, the delete key is a DRAWN icon
  (no "⌫" glyph — no emoji or text symbols as icons anywhere in the game).
- Marks (colour-blind house rule — never by colour alone): RIGHT = a solid --good tile + a thick bright bar along the bottom; CLOSE = an
  outlined --close tile (dark centre) + a small solid dot top-right; MISS = flat and dim. The keys show the same marks, smaller. Standard Wordle
  duplicate-letter rules.
- Looks: NIGHT = neon (this pass). DAY = "C1 clear morning sky" (PW2). The game draws no look switch: it reads the Settings look (kit look.js /
  LOOK_EVENT) and must re-theme live (PW2 builds the live swap; this pass keeps every colour in tokens so the day look drops in).
- Rewards (PW2): KEYHOLE emblem (any full crack), SAFECRACKER card (a low score — threshold set by simulation).
- The daily stays `on: false` until THE SWITCH-OVER (repo private first).
