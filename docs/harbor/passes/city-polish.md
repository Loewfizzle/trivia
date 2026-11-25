# THE CITY POLISH PASS (Nov 24 2026)

The prompt: the owner's Nov 24 CITY POLISH prompt (replaces the Nov 22 polish prompt). THE ADD-ON INBOX: the Nov 22 11:15 am tab-row entry, the Nov
24 2:36 pm Chromebook + quiet-kinds entry and the Nov 24 7:20 pm CONTROLLER MARK entry (arrived during the pass, before the final tests) — all
built. THE LAB: `scripts/lab-export.mjs` against the live site at the start — 226 marks, no open FIX mark. Own emulators + `serve.mjs --emu`
(restarted after each `/api` change) + the pre-pass code in a worktree on :5174 (the A/B); Ben's :5190 left as found. NEVER THE LIVE SITE:
every repro + proof on the emulators; the live site was only LOADED, read-only, for the boot clock's baseline (`boot-time.mjs --live`: `&test=1`,
no taps, no profile, no room).

**RULES CHANGED — RE-PUBLISH `Downloads\NEON\database.rules.nov24-polish.json`** (`profiles/{pid}/.read`: its owner + a player seated in the same
room · `pfr/{pid}/.read`: the server only — and still the Nov 22 fix pass's `rooms/.read` + `rooms/{CODE}/.write`). The fallback on the old
rules: nothing the phone does needs the new ones.

## OPEN FOR BEN
1. **RE-PUBLISH** the file above (Firebase console → Realtime Database → Rules → paste → Publish).
2. **THE RETURN-VISIT POWER-ON — ready to try:** open `https://neonspeakeasy.com/?poweron=short` once on your phone → every return visit on that
   phone gets the short re-light instead of the 3.4 s power-on; `?poweron=full` puts it back. Default OFF for everyone until you say.
3. Phone checks (none of this ran on an iPhone or a Chromebook): PLAY → JAYWALK → PLAY NOW, back, wait 10 s, PLAY NOW again (never a silent
   bounce); THE BOARD's tab row sideways at 390; the PLAY sheet's controller mark.
4. **THE INBOX WAS CUT** at 7:39 pm (ADDONS.md went back to its Nov 18 copy — not by this pass): restore Nov 18 → Nov 24 from your chat; this
   pass appended what it had read verbatim + its done marks at the bottom.

## Each item

| item | what was done | how proven |
| --- | --- | --- |
| THE PLAY BOUNCE | the stall clock is the ROOM's (`host.js#syncStallClock` — a new code resets it, a wake for another room dropped); a start held only by a pending wake waits for its round trip (`writeOkSoon`, 3 s + one retry); PLAY NOW: COULDN'T START — TAP PLAY AGAIN, then the leave | `e2e-play-bounce` bounce: the old code woke at EVERY second start (2 of 3, 3 of 4 tries, Chromium 4×); the new 0 (Chromium 4 / 4, WebKit 3 / 3); `tests/play-bounce.test.mjs` |
| the nephew (a brand-new phone) | PLAY → JAYWALK → PLAY NOW → the name page at once (Chromium 1.8 s at 4× CPU, WebKit 0.6 s) → PLAY NOW → the game | `e2e-play-bounce` newphone, both engines |
| across a deploy | a cartridge that can't link (a new export of a boot module) → the message + THE SKEW WRAPPER's ONE reload at that safe moment (`lazy-import.js#reloadNowIfQueued`) → the next tap plays on build B | `e2e-play-bounce` deploy: the old code = a DEAD tap (no message, no reload); the new 5 / 5 both engines, one reload, never a loop |
| THE BOOT HANG (Nov 22, iPhone) | root: THE CARRY copied ~313 files one by one and every boot request waited for the whole carry (≤ 2.5 s) — on an iPhone's store it outlasts the wait → the whole boot to the network. A miss now reads the hash LISTS (unchanged → the old build's copy at once; changed → the network, no wait); six at a time; a module request that never starts is retried after 12 s | `wk-edge --slowcarry 60` (a slow store): the deploy visit 6.89 s / 24 static on the old path (`--slowold`) → 3.30 s / 5, 324 misses answered from the old copy |
| THE SCHOOL CHROMEBOOKS | a LATE reveal with the first bake still on its way ran its last big step after the reveal; now the first bakes finish under the boot screen (≤ REVEAL_MAX + 2 s); a low-core desktop Chrome starts one tier lower on its first visit (remembered) | `boot-time --chromeos --swgl` (4 cores, 4× CPU, dpr 1, 1366 × 599, no GPU): the old code an 836–918 ms frame after 3 of 5 reveals (all LATE); the new 5 / 5 ready, the longest frame after the reveal 149–171 ms, the first frames < 250 ms |
| the boot | the people's staged plan back to back (the folk gate 3.0 → 1.9 s) | the boot clock (below) |
| cache | `/boot-bundle.json?v=<its hash>` (build-boot-bundle.mjs writes it) → a year, immutable; `/js /css /assets` fetched by plain paths → stay `max-age=300` (every module import, every stylesheet link, every picture — none carries a version) | unit (city-polish) |
| three.js | the readable `three@0.160.0/build/three.module.js` everywhere — nothing had switched it | unit (city-polish) + HIGH RISE zero-garbage (unit suite) |
| THE RETURN-VISIT POWER-ON | `?poweron=short` (remembered) — DEFAULT OFF | unit |
| THE BOARD's tabs | HIGH RISE + PRISM DROP on one line, 10.5 → 13 px, the row scrolls (no scrollbar, a fade where more sit, the picked tab into view, overscroll contained, THE TAP WATCH's fling-stop); the desktop column holds all seven; STATS / /admin a size up | shots 390 / 402 / 430 / 1440 (XP + HIGH RISE picked), two refine passes |
| HOME | a solo end screen's way out reads HOME (the house icon; the controller's B presses it); JAYWALK's + HIGH RISE's own solo screens BACK HOME | shots, e2e-jaywalk / e2e-highrise foot checks |
| JT2's AVG | under each of the GAME CARD's top three (the rows' own `av`); THE BOARD (app + /board) already showed it | code (no rows on the emulator to shoot) |
| THE CONTROLLER MARK | ONE flag (`metas.js CONTROLLER: true` — JAYWALK), ONE svg (`ICONS.pad`), the shelf's name + the card's meta line; the footer "One phone per player. Play solo now, or open a room for friends." + its legend | shots 390 / 402 / 430 / 1440, two refine passes; unit (the flag only with a wirePad) |
| S8 | `profiles/{pid}` owner + room-mate; `pfr/` server-only; the friends API names a stranger by the board id (+ a viewer-salted `ph`) | rules 104 / 104 (the S8 case: every stranger REFUSED); /api 76 / 76; e2e-friends 15 / 15 |
| THE QUIET KINDS LEAK | root: `cleanReport` turned every kind it didn't list into `tap` BEFORE the quiet check; ONE list (`core/quiet-kinds.js`), a quiet kind only counts, no empty row | `tests/quiet-kinds.test.mjs` |
| HIGH RISE's two reds | see "The final run" | — |

## The calls named (overrule any)
- **A failed PLAY NOW after a deploy reloads at once** (the city, no sheet, no match — THE SKEW WRAPPER's queued reload, logged as ever): "only at
  a RETURN" would have left the tap dead until the app was put away.
- **S8 keeps the pid on FRIENDS + the players you shared a room with** (the room already showed it); requests, sent requests and blocks — the
  rows a stranger can be — carry the board id. A room-mate is not a stranger: their room node still names the pid.
- **No data move:** the keys stay pids; only who may read them changed (so there is no /admin button to press).
- **Safari keeps the modules path:** THE BOOT PRELOAD already asks for all ~305 boot modules in ONE round trip (the prompt's "only app.js" was the
  loader's own line; the preload follows the CSS); a WebKit bundle needs a blob import map or a build step.
- **The Chromebooks' own 1.6 s** was after a READY reveal on their hardware (a weak GPU); the box reproduced the LATE-reveal case only (software
  graphics). The tier-1 first visit is the lever for theirs — not measured on a Chromebook.
- **The bigger pre-reveal bake slices** were tried (22 → 44 ms): ~0.2 s, not kept.

## The boot clock (THE BOX, never an iPhone: headless Chromium, 390 × 844 @3, 4× CPU, 4G 70 ms / 9 Mbps, cold, medians of 3)
| | FCP | title | boot gone | worst long task | requests / KB (to gone + 2.5 s) |
| --- | --- | --- | --- | --- | --- |
| LIVE, Chrome UA (the bundle) — before | 612 | 4,213 | 12,751 | 1,009 | 387 / 2,726 |
| LIVE, iPhone UA (the modules) — before | 548 | 3,640 | 12,194 | 1,010 | 384 / 2,979 |
| local, Chrome UA — old code (:5174) | 220 | 3,777 | 9,592 | 931 | 369 (EDGE 51) |
| local, Chrome UA — new | 228 | 3,679 | 8,931 | 842 | 369 (EDGE 50) |
| local, iPhone UA — old code | 224 | 5,412 | 11,099 | 916 | 368 (EDGE 355) |
| local, iPhone UA — new | 220 | 5,394 | 10,688 | 874 | 366 (EDGE 354) |
(LIVE after = after the deploy — not measured in this pass. The local server has no compression: its KB are not the edge's.)

## HIGH RISE's two reds (the FIX PASS's inbox entry)
- (1) e2e-highrise's touch-path run — a TEST fix: the bot ran a FIXED 240 s and the Beelink's 4× CPU tower reached floor 58 in it; it now runs
  while the tower climbs (the target, a top-out, or 45 s with no new floor): floor 63, ABOVE THE CLOUDS — **81 / 81**.
- (2) e2e-highrise-match's SIGNAL DROP — GREEN on today's code with no change (**59 / 59**: CHARLIE climbed 6 floors offline, his row counted in
  full); not reproduced.

## THE ADD-ON INBOX WAS CUT (not by this pass)
At 7:39 pm Nov 24 `Downloads\NEON\ADDONS.md` was replaced by an older copy (114,814 bytes, ending at the Nov 18 8:05 pm CITY I entry; at ~5 pm it
was 248,198 bytes). No other copy exists on the machine. This pass appended (nothing above edited) a note + the entries it had read VERBATIM —
its three entries + the HIGH RISE one, each with its done mark — and the headings of the rest it saw. Ben restores the rest from his chat.

## The final run (the Beelink, nothing else busy; own emulators — restarted fresh before e2e-profiles; `serve.mjs --emu` restarted after each /api change)
- unit **2,665** (after the two checks this pass's own moves needed) · rules **104** · /api **76**
- smoke **24 / 24** · e2e-play-bounce Chromium **18 / 18** + WebKit **16 / 16** · e2e-stall-host **8 / 8** · e2e-bundle all green (Chromium + WebKit)
  · wk-edge **7 / 7** + `--slowcarry 60` **7 / 7** · e2e-jaywalk **122 / 122** · e2e-highrise **81 / 81** · e2e-highrise-match **59 / 59** ·
  e2e-friends **15 / 15** · e2e-profiles **148 / 148** (its 7d step now waits for the app before setting the view — red on the pre-pass code's
  probe too) · the HIGH RISE zero-garbage tests (in the unit suite)
- the harbor groups this pass touches: core · load · bootfloor · weakstart · cartridge · dock — **71 / 73**, the two reds THE HAND RELOAD
  (bootfloor): it holds `/js/screens/title.js` by request interception, which never sees the bundle's blob → `&nobundle` (the modules path,
  where a module can be held), as the FIX PASS did for `load`: bootfloor **4 / 4**.
- Every server this pass started stopped at the end (the emulators, `serve.mjs --emu`, the :5174 worktree's server + the worktree itself);
  Ben's :5190 left running.
