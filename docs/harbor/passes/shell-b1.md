# SHELL 2.0 B1 — THE OWNER's SHELL A FIXES, THE GPU CHECK, THE CONTRACT + THE SOLO LANE (Nov 5 2026)

Step 0 = plan.md "OWNER'S NOTES — NOV 5 (morning, his SHELL 2.0 A test)" (part 69). SHELL 2.0 B was split by the chat: **B1 (this)** =
the owner's fixes + the GPU + THE CONTRACT the games plug into + THE SOLO LANE; **B2 (next)** = the gift tool + the 7 gift cards, MAKE HOST,
the crew live, the 5-hour music fade, YOUR PREVIOUS KEY, the link-preview image, the City-1.0 songs, FR6's desktop group (+ THE HERO-SPOT
AUDIT, moved here → B2). **No rules change.**

## Group 0 — THE GPU CHECK
- **The finding.** It wasn't the driver: the Radeon 780M's 32.0.12019.1028 (Oct 2024) is unchanged, and the Nov 5 updates were only
  Defender signatures. The mini PC **restarted at 6:38 am with NO DISPLAY attached** (every monitor `Present: False`). Windows then lists
  the **Microsoft Basic Render Driver** first and ACTIVE. Chromium's GPU process crashed on it until it gave up ("GPU access is disabled due
  to frequent crashes" in chrome://gpu), so there was no WebGL at all. The Radeon was still there as the second adapter.
- **The fix (the test kit only, no setting of the owner's):** `tests/integration/kit/puppeteer.mjs` asks chrome://gpu once per boot for the first
  non-Microsoft adapter's LUID (cached in the temp folder; `pickAdapter` unit-tested) and adds `--use-adapter-luid=<hi,lo>`. With a display
  attached it adds nothing.
  - On the GPU compositor (the calm load, `GPU=1`) it also adds `--disable-direct-composition`: with no display, DirectComposition
    presents at ~20 Hz (51-ms frames on 8 ms of work); without it, 15.6-ms frames.
  - The check: `node tests/integration/gpu-check.mjs "<browser>"`.
- **Proof:** `ONLY=perf` 12/12 with the TV off (the calm load holds tier 2; the guard 0.45–0.56×). No Grokbot prompt needed. A dummy HDMI
  plug is now optional.

## Group 1 — THE OWNER's FIXES
| item | before → after | proof |
| --- | --- | --- |
| **THE 1 OF 1** | gradient-filled letters ending in violet on THE SWITCHBOARD's gold, the gem's halo over the last "1" → SOLID near-white letters with a thin rainbow GLOW EDGE (offset text-shadows), on a small dark backing (every card: one look), 0.95 em clear of the gem | roomfix: 10.3 : 1 over white, 8.8–12.3 pt from the gem at 390 / 402 / 430 + the 72 % viewer; no gradient text |
| **THE DOCK's STREAK** | SHELL 2.0 A followed the 6:57 am correction ("the number in a small neon pill") — but the pill kept the flame's amber glow in the flame's spot, so it still read as THE FIRE STREAK → **none on the dock** (the pill, its preview, its painter `progress/flame.js` deleted) | progress: YOU = its icon + label only at 390 + 430 (the old `?preview=flame` shows nothing) |
| **‹ BACK on every nested sheet** | ☰ closed itself before opening SETTINGS / HOW TO PLAY / YOUR CARD, so they came up top-level with only an × (and the old test clicked a HIDDEN ‹) → they open ON the menu (‹ = back to it, its name small under the title); YOUR CARD (a full screen) steps the menu aside and its ‹ BACK brings it back; CUSTOMIZE → EDIT USERNAME (`from: 'CUSTOMIZE'`); the games picker → a game's options; SETTINGS → CREDITS; GUESTS → a card. A top-level sheet = × only | shell: every path's ‹ VISIBLE, one step back, Esc = the top only, × = all; sheetstack: EDIT USERNAME's ‹ visible |
| **THE RADIO MATCHES THE REST** | the brass desk + the cream paper → the shell: dark glass panels, the band's tabs + every button NEON TUBES (the on tab pink, the rest quiet white, STOP / CLEAR ALL red), the shell's type; the VU dial dark with neon ticks + a white-pink needle, the knobs dark with a cyan pointer, the jacks NEON RINGS (white ready · amber queued · pink running), the intercom grille a cyan-edged speaker + neon meter segments, the lever = the shell's switch, THE PROGRAM + THE LEDGER on glass with light ink (the tier palette in its light) | radio: "no brass left" (0 brass gradients, the on tab's 1.5 px pink ring, the jacks' rings, the dial dark) + the shots radio-desk / -program / -ledger |
| **THE RACING CLOUDS** | a cloud at x0 + speed(wind) × tSec — tSec hours into the 6-hour block, so an easing mean wind flung every cloud (and the deck) → `core/harbor-phase.js#phaseClock`: the position is the speed's INTEGRAL (continuous across a change; the first sight on the clock's own formula, so phones agree). The same for the water's two wavelet textures (speed from the wind's roughness) + the fog's wisps | the 10-hour test: an easing 3 → 9 m/s peaks at its normal speed (the old formula > 50× it) |
| **PRISM DROP's E2E** | it drove the old lobby (broken since CITY 1.0 OUT) → the room in the city (HOST / JOIN, GAMES → PRISM DROP → options) + a **`FAST=1`** path (2 phones, the gestures, one battle to its end, back to the room — ≈ 40 s); its flick check was stale since Oct 18 (the flick slams only with SWIPE-DOWN SLAM on) — now checks both | FAST=1 18/18 |
| THE HERO-SPOT AUDIT | → **B2** (the brief allowed it: 50 lab cards' art + a CHANGED line each). THE SWITCHBOARD's ON AIR over the plate's right end is its first case | — |

(The OVERCLOCK E2Es — e2e-oc-2 / e2e-oc-new — drove the old lobby too: both pointed at the room in the city; e2e-oc-2 29/29 at 8 phones.)

## Group 2 — THE CONTRACT (agreed with the Overclock chat — docs/cartridge.md "THE CONTRACT")
- **D1 THE THIN META + LAZY LOGIC.** `js/games/<id>/meta.js` for the playable two. It's PURE with no imports: DEFAULT_SETTINGS, OPTIONS,
  estimateMinutes, MUSIC, MIN_PLAYERS / SOLO, BANNER_NAME, chatLocked. logic.js + index.js take them from there (one source).
  - `games/registry.js` imports ONLY the metas; `loadGame(id)` loads a cartridge on demand. Where it loads: the host's tap; every phone's
    walk inside (room-city.js, with the warm + the preload); the options sheet (prefetched); a refresh mid-match (app.js waits on the walk
    inside or the boot screen; room.js watches its live paths when it lands).
  - The ten hidden games are untouched (their modules load by id).
- **THE BOOT BYTES** (`node scripts/boot-bytes.mjs` — the title's static graph from app.js): **2,067 KB / 160 modules → 1,770 KB / 109
  modules; js/games 297 KB → 25 KB** (the two metas + the console's own: cartridge, registry, lazy-view, kit/seal + pulse/clock.js — the shared
  audio clock audio/synced-songs.js uses). `tests/cartridge.test.mjs` fails on any game's logic in the boot graph.
  - (`core/match-report.js` was never in the phone's boot graph — only /api/report + the stats import it, server-side.)
- **THE PRELOAD BUDGET** (`cartridge.js#PRELOAD_BUDGET`, 1.5 MB; the start never waits past its 5 s).
- **THE KIT:**
  - `js/games/kit/` reserved for OVERCLOCK pass 1 (numpad, keyboard, tach, slam, answer — prefix `gk-`).
  - BUILT: **THE READY HELPER** (`kit/ready.js#readyState` — connected only, a min time, a dropped player never blocks, a max time) +
    **THE ROOM-NIGHT PATH** (`kit/night.js` — `rooms/{CODE}/meta/used/{gameId}/{key}`; the rules already allow it).
- **MUSIC BY MOOD**: `MUSIC: 'mood:<mood>'` = that mood's station on the server clock (`party-music.js#stationCue`), the menu song as the
  fallback while the decks load.
- **D12** written: the rules + "what plugs where" (docs/cartridge.md).
- Proof: unit, cartridge (a fresh room page holds 0 cartridges, only the two metas), gamestart, gameflows, sheetstack, the smoke (two
  regular phones, a fresh tab, non-Gilded cards), PRISM FAST, OVERCLOCK 8 phones.

## Group 3 — THE SOLO LANE + THE ROOM's LOOK SWITCH + COLOUR-BLIND
- **THE SOLO LANE** (docs/profiles.md):
  - OVERCLOCK's meta says `SOLO: true` (the Overclock chat: "min 1"). `match-report` accepts n = 1 for SOLO cartridges only.
  - A solo match gets: no win, the records on the solo board (`overclock-std-solo`), 15 XP for the first 4 solo matches of the day, then 0,
    and the streak always.
  - No PB / new-game / goal XP. The host writes 0 night points (no banner, no champion, no bonus), /api expects 0, and the podium says SOLO RUN.
  - Tests: shell-b1 (pure) + server.test.mjs (the emulators) + sololook (OVERCLOCK starts alone).
- **THE ROOM's LOOK SWITCH** (`kit/look.js`):
  - A round neon tube right ABOVE the PLAY ring (its slot — the 390 dock has no room beside it), only for the one player of a room of
    one, before the match.
  - Its icon (sun · moon · AUTO = half of each) + its word (AUTO / DAY / NIGHT, the dock's label style) always show the state. One tap cycles.
  - Remembered per device (localStorage). LOCKED once the match starts: resolved at the start, AUTO by the real sun (core/sky.js), and
    kept per match id. `body[data-look]` while a solo match is on screen.
  - sololook: AUTO → DAY → NIGHT → AUTO, remembered after a reload, the match keeps DAY after a change, gone with a second player.
- **COLOUR-BLIND**:
  - `--good` / `--close` in css/base.css. SETTINGS → THIS PHONE → "Colour-blind colours" sets `body[data-cb]` → blue #3ea6ff / orange
    #ff8f2e (`ui/colorblind.js`).
  - Saved per device + on the profile (`ppriv/{pid}/cb`, `/api/profile` 'prefs' — server-written, no rules change).
  - OVERCLOCK's 17 right / close lines now read the tokens. The rule "never by colour alone" is in docs/match-kit.md + CLAUDE.md.
  - shell: the row flips the tokens and back.

## Decisions (made in this pass — the owner may overrule)
- THE HERO-SPOT AUDIT → B2.
- OVERCLOCK is the first SOLO cartridge (PRISM DROP stays 2+).
- Solo XP: 15 (half a played match) × 4 a day.
- ☰ → YOUR CARD is a full screen (its ‹ BACK reopens the menu). THE LAB + ADMIN are pages with their own ‹ THE CITY.
- The options open ON the games picker (CANCEL steps back to it; INITIATE closes both).
- The radio: the nixies keep their amber (they were neon already); FIRE is the desk's one pink main; CLEAR ALL keeps its safety cover, in red neon.
- The 1 OF 1's dark backing is on every card, not only the light ones (one look).
- The look switch sits above PLAY, not beside it. The look lives on the device + the tab (no database, no rules change).
- The cirrus flicker (FR6) was not checked here → B2's desktop group.

## Tests + the full local run
- Unit 1166/1166 · /api (server.test.mjs) 37/37 · smoke 6/6 · PRISM FAST 18/18 · OVERCLOCK (e2e-oc-2, 8 phones) 29/29 · ONLY=perf 12/12 (the GPU).
- Rules 64/64 · conn 21/21 · presence 12/12 · WebKit room 6/6 · the profile E2E 63/63 then a FATAL at THE SECOND TAB's banner (`.dup-tab` never shows) — the SAME 63/63 SHELL 2.0 A + THE SPEED PASS B reported: that step was already stopping there (the checks after it never counted). Known issue → B2.
- **THE FULL HARBOR SUITE at 4 shards, WITH THE GPU: 1159 / 1163** (SHELL 2.0 A: 1142 / 1160 without it). The six reds, each alone:
  - `staleroom` (a protocol timeout) + `load`'s holiday-night jump: green alone (load inside the 4-shard run).
  - `crew` (the owner's CREW switch on a player's card — once no row, once the click didn't take): FLAKY ON THE PRE-PASS CODE TOO (an A/B at 4687995 on :5175: 1 pass, 1 fail). Its check now targets the live card + prints a diagnosis. Known issue → B2.
  - `vault`'s two FULL LOBBY speed checks at 4× CPU on the real compositor (24 + 27 / 240 slow, the rule ≤ 6 %; the median 15.6 ms): THE SAME on the pre-pass code (24 + 25 / 240). The cause is the display-less machine: the real compositor without DirectComposition. The GPU path's four mixes are all green. A display (the TV on, or a dummy HDMI plug) brings them back (THE SPEED PASS B: 3 / 240).
  - `roomperf`'s ROOM's OWN COST at 4×: the known red on the mini PC since THE SPEED PASS (A/B'd then).

## Known issues
- THE PROFILE E2E's SECOND TAB step (`.dup-tab` never shows in the test) — already failing before this pass (A + B reported 63/63 = the checks before it); B2 checks it at its cause.
- `crew`'s CREW switch step is flaky (the pre-pass code too); its new diagnosis line says which half.
- The real-compositor speed checks (the vault's full lobby) need a display on the mini PC — the dummy HDMI plug.
- THE HERO-SPOT AUDIT (+ THE SWITCHBOARD's ON AIR over the plate) — B2.
- No game reads `body[data-look]` yet (OVERCLOCK's rebuild + the dailies will). OVERCLOCK's own solo podium body = its rebuild; the
  console's SOLO RUN stands in.
- e2e-oc-2 / e2e-oc-new need 3+ phones (no FAST path); e2e-oc-new wasn't re-run this pass.
- The radio's new look was judged at 402 only (it's the owner's tool); WebKit not shot.
- `pulse/clock.js` (the console's shared audio clock) still lives in PULSE's folder.
