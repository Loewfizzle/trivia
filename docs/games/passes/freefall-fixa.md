# FREEFALL — THE FIX PASS, PART A: THE LOOK + THE FEEL (Nov 27 2026 · the Beelink · Opus 5.5)

The review (`docs/games/passes/freefall-review.md`) split into two fix passes: PART A (this) = the look + the feel; PART B = the match,
stability, scoring + the test page; then the go-live. FREEFALL stays HIDDEN (`config.js` `playable` untouched) and THE SWITCH stays OFF.

## GROUP 0 — MAKE ROOM (the review's M3)
- FREEFALL's line: 29 cartridge modules' long comment blocks (each module's header + every block of 4+ comment lines) moved VERBATIM to
  `docs/freefall.md` "MODULE NOTES"; each block keeps its first line + `(→ §n, docs/freefall.md MODULE NOTES)`. Proof: every file with its
  full-line comments stripped is byte-identical to before. **The game alone: 609 → 574 KB of 610 (1.4 KB → 36 KB of room).**
- THE BOOT: the FREEFALL row's comment in `config.js` trimmed + the long headers of three city modules (`harbor/boats.js`, `moon.js`,
  `jets.js` — comments only) moved to `docs/harbor/boot-headers.md` (CITY PART 2's pattern). **The boot: 21 B → 6,299 B of room.**
