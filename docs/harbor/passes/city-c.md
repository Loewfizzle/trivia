# CITY C — CARDS + SOCIAL (Nov 15 2026, the mini PC)

The owner's order (`docs/harbor/decisions.md`): … CITY A ✅ → CITY B ✅ → **CITY C** (cards + social) → THE MAINTENANCE REVIEW → JAYWALK → THE GIRL
CARDS → THE TOWER MOVE → the reset. **No rules change** (the new nodes `flink/`, `progress/statsSnap`, `radio/spotted` are server-only — the rules'
default deny). 8 functions. THE ADD-ON INBOX: no entry for CITY C (read at the start, after every group, before the final tests).

**Step 0** — `decisions.md` + `plan.md` "OWNER'S NOTES — NOV 15 (CITY C's Step 0)": JAYWALK on every sign, OVER / CLOCK + JAY / WALK stacked, no named
sign dark (built in CITY B); og.jpg = candidate 2 + a readable title; STATS in an owner-only ☰ sheet, the radio LIVE only.

## Group 0
- **0a THE DROP's FACE READS "LIVE" AS THE DAILY SCREEN DOES** — `core/daily.js#goLiveDay` (pure) + `api/_lib/dailies.js#goLive` (ONE reader for the
  feed + /admin → THE BILLBOARD): THE GO-LIVE SWITCH on AND the row in the set (its own on-switch OR THE SCHEDULED GO-LIVE). The day: the schedule's
  (a future one too — the face waits for it) · else the day the switch flipped OFF → ON (`progress/dailies.onAt`, recorded from now on; a repeated
  SWITCH ON keeps it) · else its first counted finish in the window · else today. The 14 days + ON / OFF / KEEP ON unchanged. In the repo THE DROP's
  row ships `on: false`, so on the live site only a schedule (`progress/dlive/drop`) opens it — the old reader needed the same; if the face still
  waits, check /admin → THE DAILIES (its row's state) + THE BILLBOARD (its "goes live" line, now from the same reader). Proof:
  `tests/city-c-drop-live.test.mjs` (switch on + no schedule → the face; schedule only → from that day; both off → none) + `/api` "THE DROP on the
  billboard" (+ a switched-on row with no schedule → its flip day).
- **0b og.jpg** — `scripts/build-og.mjs` (a page in the test Chromium: candidate 2 + a dark backing glow + NEON / SPEAKEASY in Orbitron 900, the old
  neon sign hidden under it) → `Downloads\NEON\city-c\og-final.jpg` (+ `og-final-300.png`, the iMessage size — readable) → `assets/og.jpg` (168 KB,
  1200 × 630); `?v=5` on both meta tags.
- **0c THE LATE DOCK MOVE** (the Chromebook STALL report — reproduced locally: `load-log.mjs --size 1366x647 --dpr 1 --desktop --cpu 4 --maxframe 250
  --nodebug --qs force=party`; VSYNC=display for the real compositor):
  - a LATE reveal (past REVEAL_MAX) re-measures the title too, up to REVEAL_MAX + 2 s, and a re-layout already queued by the 500 ms look runs NOW
    (it landed 30 ms before the late reveal → the re-bake after it); a late reveal also waits (≤ + 2 s) for the title's fonts already on their way
    and the people's staged first plan; a font landing before the reveal re-measures at once.
  - **THE ONE-STALL RULE** (`core/harbor-tiers.js#stallStepMs` = 1000 at every tier): a frame that long in the city's first moments (to 15 s after the
    reveal) steps a tier down AT ONCE (after the reveal the effects first — no re-bake) and the phone remembers it (`na:tier`, 14 days — never under
    automation unless `&tiermem=1`). Seen in the repro: "2 → 1 at once (a 2150 ms frame before the reveal)".
  - the people's 70-s warm-ahead: ONE block per idle task (was the whole window in one ~1.1 s task at 4× CPU), then the whole moment in a task of its
    own; the first plan's staging now includes the whole first moment; a changed set of solids re-routes within a 20 ms frame budget
    (`aroundSolids` — a walker keeps its detour, or its plain walk the first time a set appears, for a frame or two).
  - **Before → after** (worst frame after the reveal, 4× CPU, party night): **933 – 1 550 ms → 567 – 900 ms** (the dock move + the double stall gone;
    the reveal frame itself and a neon crossfade at +10 s remain ~350 – 900 ms at 4× CPU). **The 250 ms target is NOT met** — left open (the reveal
    frame's own cost; the neon crossfade at +10 – 12 s).
- **0d THE 8-CARD LOBBY** — the city HOLDS at the GUESTS tap (`room-city.js` — before the list's modules load), the sheet opens with the names at once
  (a 64-px name row a guest), the strips fill ONE PER FRAME (stills), then the live art one per frame; the approved-art refresh goes through the
  same queue. `lobby8.mjs` at 4× CPU: **the sheet 5 327 → 851 ms, all 8 painted 5 328 → 1 905 ms**; frames over 50 ms in that window 22 → 11 (the
  worst 333 ms — the city's last frame + the sheet's first). The check's red (683 ms) is the room's first paint (CITY A's, not this window).

## Group 1 — THE CARD TOP LINES (the approved prototype, Nov 13; PROPRIETOR per the prompt, not the mock's "DEV")
`vault/full.js#foilOf` + `fullCardEl`: the top line reads only NEON SPEAKEASY; the gold-FOIL line under it — "✦ FOUNDING MEMBER ✦" / the dev cards
"✦ PROPRIETOR ✦" (no pill, no outline; the top line's own soft backing; a dark bronze foil on the light materials; not on a gift card nor FOUNDING
MEMBER itself — its gold stamp says it); the rank without "DEV ·"; MEMBER Nº under MEMBER SINCE (label | value rows, never wrapped) — every full card
(the vault, the player page, CUSTOMIZE, the full-card view, /board's player page) + THE GILDED fallback (`progress/card.js`). Preview:
`tests/integration/fullcard-preview.html` (the REAL full cards, no Firebase). Shots: `Downloads\NEON\city-c\topline-wk-390x844.png` / `-402x874`.
**Known:** THE SWITCHBOARD's VU meter sits in the band the foil line needs — the needle still swings between the line and the plate; moving the
meter is an art change (the owner's call).

## Group 2 — THE SIGHTING CARDS IN THE STANDARD LAYOUT
Every sighting full card laid out like the others (`sighting` = false everywhere; the sighting's name + spot line in the bottom-right corner — THE
BTC CARD's foot). The code-drawn heroes moved RIGHT of the plate on a full card (`fx/ufo.js`, `sg-kit.js#stage`, `sg-tr3b`, `sg-f22`, `sg-blackbird`,
`sg-ghost`, `sg-balloons`) + their full-card hero boxes (`vault/layout.js#SIGHT_HERO` — a 12-letter name stays on one line). LAB_V 2 + LAB_CHANGES for
the eight full cards; the stills re-baked. Shots: `Downloads\NEON\city-c\sight-a-wk-390x844.png`, `sight-b-…`, `sight-c-…`.

## Group 3 — ONE CLEAN STEP + THE STRIP MATCH
- **THE PLAYER PAGE** (`profile/player-page.js`): opens ONCE, whole — the answer in, the card built + laid out unseen, its material's picture decoded
  (≤ 900 ms) — no skeleton swap; an answer slower than 2.5 s opens on the skeleton as before.
- **THE STRIP MATCH** — `tests/integration/strip-match.mjs` (every strip with an effect: its material alone vs its live first frame, `--still` = the
  effect's still frame, any `--size`). Found: BUZZED's own strip picture (1280 × 256) — the effect scales it HEIGHT-led under ~320 pt
  (`max(w / 1280, h / 256) × 0.9`), the CSS was always width-led → `max(90%, 288px) auto` (0.4 – 0.7 at 300 / 402); GOLDEN HOUR's polaroid is an
  effect layer (the material was the bare pink page) → a TRANSPARENT baked still layered over the page (stills kind `o`) (98 → 1.8); every baked
  strip still sits at its hero's centre across (`build-card-stills.mjs` reads `vault/hero.js`) so a narrower list row frames it as the effect does
  (PENTHOUSE / the PRISM DROP three 1 – 3). Left: THE BTC CARD's difference is its effect's own light (the bloom, the lit burner — the balloon's size
  + place match); the other "overs" are effects that ADD light or motion to a plain material (aurora, marquee, neon glass) — no reframe.

## Group 4 — FRIEND REQUESTS
- **THE KNOCK CARD** under YOUR card (`friends-ui.js#knockCards`): the sender's slim card (a tap = their page) + NOT NOW · ACCEPT (both secondary
  tubes — CUSTOMIZE keeps the screen's one pink MAIN); painted in place after a lift; NOT NOW hides it on this phone (`ns:fr:knock-later`), the request
  stays in FRIENDS → REQUESTS.
- **The city's one-line note** for a NEW request ("<NAME> wants to be friends · Answer on YOUR card — tap YOU", THE MESSAGE, once per newest request
  — `inviteCheck`'s `frName` / `frAt`); the badge on YOU as before (in place, afterTap).
- **THE PUSH** (`friends.js#requestPush`): a request that LANDS (a block swallows it silently → no push) → the receiver's phones, if they turned
  notifications on; ≤ 1 a day per sender → receiver (`rl/frp_<a>_<b>`); `/?fr=in` opens YOUR card.
- **THE ADD-ME LINK**: FRIENDS → SHARE MY FRIEND LINK (data-gesture; the code fetched before the tap) → `/?add=<code>` (7 letters, `flink/{code}` →
  its owner, `pfr/{pid}/lk`; never a pid in a link; minted only past THE THROWAWAY GATE) → "ADD <NAME>?" (`friendLinkGet` — no pid / board id in the
  answer) → `friendAdd { code }` (the normal request). Kept until the phone has a profile.
- Server-checked as before: no requests to yourself, no duplicates, the rate limits; ACCEPT makes it mutual. Shots:
  `Downloads\NEON\city-c\friends\fr-04a-knock-*.png`.

## Group 5 — THE RADIO + /admin
- ROOMS OPEN + GAMES ON are doors (`ui/whos-on.js#openRooms`): the ledger's own rooms list (the hush word · the game · players · PLAYING / LOBBY);
  a room → its players' slim cards (read-only; ONE WHO'S ON read on that tap). No new poll.
- LEGENDARIES SPOTTED = the real count today: every counted sighting +1 on `radio/spotted/{day}` (`api/_lib/sightings.js`; 8 days kept).
- THE FOUNDER WINDOW folded at the very bottom of /admin: OPEN / CLOSED + since when (a reopen records its time now) + the founders; its twin stays
  on the ledger (the same server switch). `docs/launch.md`: the reset morning "checks the founder window's state".

## Group 6 — STATS (the ☰ menu, the owner only)
A STATS row (admins) → a sheet over the city (`js/admin/stats-view.js#openStatsSheet`, THE SHEET): loads once + REFRESH, no timer; the server's ONE
snapshot (`api/admin.js#statsSheet` → `progress/statsSnap`, rebuilt at most every 5 min; REFRESH once a minute old): the players line (players ·
new this week · founding members · today), matches a day (30), the heat map, the most active players (slim cards, still), the dailies (plays a day +
finish rates), the week (visits + games — moved off the ledger) + legendaries spotted a day, games played. ONE builder: /admin's stats blocks moved
into `stats-view.js` and shared. Preview: `tests/integration/stats-preview.html`; shot `Downloads\NEON\city-c\stats-wk-390x844.png`.

## Group 7 — THE MOVING GLOWS
CANDLELIGHT: the flicker lives in the HALO — the letters keep a faint halo, the copy a strong amber glow, opacity only (a long burn, two gutters, a
flare, 4.6 s). NEON's buzz + an early blink; FROST's crystals 0.56 em. Still on purpose: `.vl-still` lists (WHO'S ON, STATS, THE LAB's still mode),
reduced motion, REDUCED EFFECTS, a two-line name (`fit-2`), a legendary card's name (`vg-still`). Frames: `Downloads\NEON\city-c\glow\candle-*`.

## Tests (local, the mini PC — my own emulators + `DAILY_TEST=1 scripts/serve.mjs --emu`)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **1971 / 1971** (THE BOOT BUDGET green) |
| `/api` `server.test.mjs` | **61 / 61** (+ THE DROP's switched-on row, THE LEDGER, STATS) |
| `/api` `friends.test.mjs` | **10 / 10** (+ the push + the add-me link) |
| smoke | **8 / 8** |
| e2e-daily | **95 / 95** |
| e2e-taps | Chromium **30 / 30** (a first run 29 / 30 — one lost tap on ☰ → SETTINGS with the main thread busy at 70 ms; green on the rerun) · WebKit **28 / 28** |
| e2e-friends | **15 / 15** (+ the knock + the note; its stale BOARD 2.0 B selectors fixed) |
| lobby8 (4× CPU) | the sheet 851 ms (was 5 327) |
| harbor groups `core,load,people,radio,vault,fullcard,playercard,cardfit,stripfit,platefit,youpage,youcard,sheetstack,shell,progress,trivision,billboard,desktop,panel,corners,tapfit,guestring,room,cameras` | first run **368 / 378** — every red a check pinning this pass's own changes (THIS WEEK off the ledger, the reopen's date, the lab's count 17 → 23 / 35 NEED YOU, the old top line, the sighting title, the member Nº's label) + ONE real gap: a guest's name row (before its strip) wasn't tappable → sheetstack's FATAL (fixed: the name row opens the card). Re-run: radio · room · sheetstack green (133 / 136 → the 3 vault reds fixed), **vault 58 / 58**. The FULL harbor suite runs in the cloud on the push. |
| rules | not touched |
