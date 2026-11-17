# JAYWALK H5B — THE DAY LOOK + THE FIXES — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 16 — DECIDED, H5B)" (Step 0, `488843b3`). The reference: docs/jaywalk.md ("THE DAY
LOOK" · "THE LANDMARKS SEEN" · "BLUE ON THE GROUND = WATER, NOTHING ELSE" · "THE RAIL SIGNALS FLASH ONLY BEFORE THE TRAIN" · "THE
GHOSTS STOP BLOCKING YOU" · "THE SOUNDS"). On the mini PC.
**NO database RULES change** (the rules file is untouched — nothing to re-publish). **No `/api` file. No boot file** (THE BOOT BUDGET
untouched). **THE GAME's RULES did not change** (every change is a view / a sound: REPLAY = LIVE; the server's judge is the same file).
One console file outside JAYWALK: `js/chat/chat.js` (lazy — the refused chat write). **JAYWALK IS NOT PLAYABLE** (THE ONE SWITCH stays off).

The links: **https://neonspeakeasy.com** (the owner: PLAY → JAYWALK · TEST, or HOST a room → GAMES → JAYWALK · TEST; ☰ → Settings →
GAME LOOK: DAY) · **https://neonspeakeasy.com/jaywalk-lab.html** (LOOK: DAY · NIGHT) · **https://neonspeakeasy.com/jaywalk-lab.html?look=day**.

## OPEN FOR BEN
- **A MATCH ON THE HOST's LOOK, LOCKED — not built.** The prompt asked for it as "the match kit's switch", but the site's GAME LOOK has
  been PER PHONE with NO LOCK since SHELL 2.0 B2 (docs/match-kit.md; CLAUDE.md: games read it live, no switch of their own), and a
  lock needs the console's boot files (`app.js#paintLook`, the Settings row) — THE BOOT BUDGET is full. Built on the site's rule: each
  phone plays in its own look, in a match too (the same course, clock + rules). If the host's look should rule a JAYWALK match, say
  so: the cheap way is a `look` on the match's frame that JAYWALK's view reads (the Settings row would then need its LOCKED line —
  the city chat's boot trim first).
- **Grok's new train bell + train horn** (`Downloads\grok\jaywalk\sfx2\`) were not there when this pass ran — left open in the inbox.

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. The cloud result of `5900798a`: `tests`
  green, `harbor` skipped (a game pass) — nothing to fix.

## Group 1 — THE FIXES
- **THE SOUNDS:** the horn's gain 1.0 → **0.5** (still ≤ 1 per 3 s) · **the car-pass is GONE** — its cue (`cues.js`: the near-miss block,
  `carSide`, `passMax` / `passTicks`), its row (`sounds.js`), its player (`sfx.js`), its two files + their credits rows, and the
  builder's copy · **the train sounds fade** (`FADE_S` 0.5 s): the bell's loop on `bell-off`, the train-pass over the last 0.5 s of
  its own take, and any stop — a new run, the unmount, a voice a louder sound takes, `stopAll` — through the gain's ramp, then the source.
- **THE HEADER:** `JAYWALK · SOLO` / `JAYWALK · MATCH` (the match's was a bare `JAYWALK`) — the display face, 900, ≈ 20 px at 390,
  one line between the corner buttons, no pill.
- **THE REFUSED CHAT WRITE** (the inbox, 8:12 pm). JAYWALK writes nothing to the chat. The write was **the console's winner line**
  (`js/chat/chat.js#hostTick` → `system('win', …, 's-win-{matchId}')`): a FIXED key a match, and the rules refuse a second write of a
  key (a system line needs `!data.exists()`). The host's "already said" list lives in the page — so **a host back on the final screen
  with a fresh page** (SHARE → the share sheet → iOS reloads the tab) **or a guest who became the host there** wrote it again →
  refused → reported. JAYWALK is the game with SHARE on its end screen: that is why it showed there. **Fix:** `systemOnce` — the host
  asks first (the line already in this phone's chat or in the database = nothing to write; an unread key is never written blind);
  the start's keyed line the same. Host-only as before, within the limits (s ≤ 12, x ≤ 80), **no rules change**.
  **Proven on the emulators** (`e2e-jaywalk-match.mjs` steps 7b + 8b): with the OLD `chat.js` the host's reload on the final screen gives
  `FIREBASE WARNING: set at /chats/…/m/s-win-… failed: permission_denied` + `[rules] refused: set chats/*/m/*` — exactly the report;
  with the fix: 0 refused for the host with a fresh page, and 0 for a guest who claimed the room on the final screen.
- **THE LANDMARKS SEEN:** (1) `skymarks.js` — each area's landmark in the skyline band while the kid is in it (one canvas, drawn on a
  gateway; neon-edged by night, sunlit by day; the lighthouse's beam a sweeping DOM cone). (2) `areas.js#sigOf` — the area's HERO
  pieces in the gate lane's own two edge columns. **Measured, honestly** (ZOOM 8, 390 × 844): with the kid in the middle column the
  gate lane's edge columns are on the screen ahead of him from 12 to about 8 lanes away (the top of the play, in the haze) — at 6
  lanes the column's middle sits exactly on the screen's edge, nearer than that it is off it; beside the gate a piece is on the
  screen when he is within two columns of its side. So the band's landmark is the one that is always seen; the gate's hero is seen
  coming and, for a kid near that side, standing beside him. (A further option, not built: the area's emblem on the arch's crown.)
  Shots: `Downloads/NEON/jaywalk-h5b/gates/` (every gate: coming · beside-left · beside-right · on it).

## Group 2 — THE DAY LOOK
- ONE scene, `setLook` (docs/jaywalk.md "THE DAY LOOK" has the whole table): the sun + sun shadows + its own gloss; `DN(night, day)`
  on every colour of the ground shader; light vs paint (the glow kinds alpha-blended by day); no bloom; the painted gate; THE FOG BANK
  = the blackout's own wall, whitened, with rolling puffs — and LOST IN THE FOG; the day skyline (122 KB, only the look on screen is
  fetched); every word over the bright scene with a dark edge. `LOOKS = ['day', 'night']`; the music follows the look; the lab's
  LOOK: DAY · NIGHT.
- **Three refine passes on the look** (the shots were looked at each time): (1) the yard's gravel read as TV static in sunlight (its
  grain softened by day); the rail tell was faint (a bigger lens, a red wash, the lane's own flash stronger); the fog's body was flat
  white (a greyer body, two-tone puffs). (2) the gates' hero pieces stood too far out (pulled in to their column's inner edge) and the
  check claimed more than the camera shows (re-measured + re-worded, above). (3) after the 9:10 pm add-on: every blue / cyan thing on
  the ground re-coloured (below), the water rebuilt.
- Shots at 390 × 844 @3: `Downloads/NEON/jaywalk-h5b/day/` (the start · a run · the road · water + a log · a train coming + passing ·
  the flight path quiet + its tell · the fog bank coming / close / LOST IN THE FOG) + `day/areas/` (every area: its gate coming, its
  gate, two views).

## THE ADD-ONS (THE ADD-ON INBOX — built as the last groups, before the final tests)
- **8:25 pm — THE SOUNDS** (the horn at half, the car-pass gone): the same as Group 1's — built once.
- **8:28 pm — THE TRAIN SOUNDS:** (1) the fades — built (Group 1). (2) Grok's new bell + horn: the folder was not there → OPEN.
- **9:10 pm — BLUE ON THE GROUND = WATER, NOTHING ELSE:** the friend line = NEON PINK (`0xff4fd8`) and a TAPE between two posts, a
  little above the ground, its shadow under it; THE WATER = video-game water by night too (`#1a6fe0 → #3fb0ff`, day `#2f9cff →
  #6cc8ff`; ripple caps + specks drifting with the lane's current — the lane's flow goes to the shader as its `fx`; a bold foam line;
  a soft shadow under each log; the neon's reflections small). **What else was blue on the ground and is not now:** THE DOCKS' gateway
  (cyan → warm white; a wood-brown band by day), THE AIRFIELD's (blue → lime; an olive band), the runway lights + the flight path's
  tell (→ warm white lights, an amber racing band), the road's second lane line (cyan → pale lilac), the blackout's edge (→ violet),
  the train's / the boats' / the tower's / the hangars' light on the ground (→ warm), the fish market's cobbles + the apron
  (blue-grey → neutral). Held by `tests/jaywalk-day.test.mjs` (no area's neon / paint / lamp is blue-led; ONE blue ground in the shader).
  Shots: `Downloads/NEON/jaywalk-h5b/water/` (night + day: two water stretches, the friend line on grass / a road / water).
- **9:15 pm — THE RAIL SIGNALS FLASH ONLY BEFORE THE TRAIN:** the signals, the lane's red flash + the side glow run through the tell
  alone; dark (an unlit lamp) from the train's nose on, through the pass + after it; the yard's gantry lamp red · dark · green; the
  graybox the same. The bell already followed the tell and now fades. Shots: `Downloads/NEON/jaywalk-h5b/rail/` (the tell · mid-pass
  · just after the tail, night + day — the day "tell" still caught the blink's off beat: the lane's red wash shows, the lenses are dark).
- **9:20 pm — THE GHOSTS STOP BLOCKING YOU:** (1) NEAR YOU = FAINT — a ghost within ≈ 1.5 cells of the kid on screen eases (≈ 150
  ms) to a faint outline (≈ 15 %: its own alpha packed with its light in the instance) and its tag hides; **your own kid always draws
  on top** (he marks his pixels in the stencil; a ghost never draws on them). (2) THE NAMES AT THE START — through the 3 · 2 · 1 the
  players' names are lined up once (you first), no tag on the start square; gone at GO. (3) STACKED TAGS MERGE —
  `ghosts.js#tagGroups` (PURE): ghosts on the same / touching squares share ONE tag, the leader's name + "+N". View only.
  In the real 3-phone match: the names lined up at the count; 60 samples on the three phones — every ghost near you faint + untagged,
  the tags on screen = the groups' leaders; a ghost away carries its own name; a real merged tag ("ALICE +1").
  Shots: `Downloads/NEON/jaywalk-h5b/match/ghosts-*.png` (the count · GO · two seconds in · a merged tag — a 3-phone match) +
  `Downloads/NEON/jaywalk-h5b/ghosts/` (the lab: a ghost beside you · three on your square · three on one square ahead · one away —
  night + day). *This entry was found when the final run had already begun (the inbox was not re-read right before it): the run was
  stopped, the entry built, the whole final run done again.*
- **9:45 pm — THE TAIL LIGHTS** (night; "make sure it's done" — it came in before the final run was started again): the two hard red
  dashes set BEHIND each car are gone — ONE soft merged red pool a vehicle, pinned under its rear (it starts at the bumper and runs on
  under the body: never a gap), fading backward, half the old strength, inside its lane; its visible source = two bright red lamps on
  the body (a white-hot core each; they catch the bloom). The train's tail the same. By day: no glow, the lamps just red. The
  headlights are untouched. Shots: `Downloads/NEON/jaywalk-h5b/taillights/` (night: a car, a van, a truck, a busy road; the busy road by day).

## Group 3 — THE CHECKS
- **PERF (the mini PC, 390 × 844 @3, 4× CPU, the bot playing — the lab check's `--perf`, now BY NIGHT AND BY DAY):**

  | where | NIGHT tier 2 (the bloom) · tier 1 | DAY tier 2 · tier 1 | draw calls (night · day, tier 2) | triangles |
  | --- | --- | --- | --- | --- |
  | DOWNTOWN | 59.9 · 59.9 fps | **59.9 · 59.9 fps** | ≤ 33 · ≤ 28 | 170–186 k |
  | THE LIGHTHOUSE (its beam) | 59.9 · 59.9 | **59.9 · 59.9** | ≤ 31 · ≤ 29 | 152–179 k |
  | THE RAIL YARD | 59.9 · 59.9 | **59.9 · 59.9** | ≤ 29 · ≤ 26 | 159–180 k |
  | the opening (every tier, 1× + 4×) | 59.9 at every tier | — | 26 · 21 · 21 | ≈ 94 k |
  | 8 KIDS (the kid + 7 ghosts), DOWNTOWN | 59.8 · 59.9 | — | 35 · 29 | ≈ 185 k |

  p95 16.8 ms everywhere (two runs of the whole measure: a single 33 ms frame shows up now and then — the opening, the 8-kid run, once the rail yard by day at tier 1). The day
  look costs no more than the night (no bloom pass; the fog's puffs + the painted arch are instances of kinds already drawn). The
  real views: the solo run 59.8 / 59.9 / 59.9 fps at tier 2 / 1 / 0; a 4-kid match (3 ghosts, the ghosts' fade + the stencil) 59.9 at
  every tier. A desktop GPU's numbers — the owner's phone is the judge.
- **THE FINAL LOCAL RUN (my own fresh emulators + `serve.mjs --emu`, one suite after the other):** unit **2160 / 2160** · rules **83 /
  83** · /api server **65 / 65** + share-card **2 / 2** · smoke **21 / 21** (THE PAGES LOAD — Chromium + WebKit, /jaywalk-lab among
  them) · harbor `cartridge` **3 / 3** · the lab check **139 / 139** with `--perf --webkit` + `--h5b` (the day look, every gate, the
  add-ons: all OK) · `e2e-jaywalk` **75 / 75** with `--perf` · `e2e-jaywalk-match` **74 / 74** with `--perf`. registration + cartridge
  are in the unit suite. `wk-press` / `e2e-daily` (the dailies' known evening red — the inbox's 8:05 pm entry, another area) were
  not run.
- **Test-side things on the way:** the lab check's audition count still expected the car-pass's row (11 → 10 rows); the lab's staged
  ghosts were re-seated beside the kid every frame (→ `still`); the match check looked for a merged tag after the two leaders had
  left the screen (→ both phones polled at once); the solo check pinned NIGHT from AUTO (→ the look is set explicitly: AUTO is the
  real sun, and the cloud runs at any hour).

## What is real, what is a placeholder
REAL (new in H5B): the day look of every screen + the fog bank, the landmarks in the skyline + the gates' hero pieces, the arcade
water, the friend line's tape, the signals' rule, the ghosts' fade + the names' line-up + the merged tags, the sound changes, the
header, the chat fix. PLACEHOLDER still: THE BLACKBIRD (a dark dart) + THE UFO (a disc — **by day it is a big pale blob over the
lanes: it looks wrong and is H6's**) + THE MOTHERSHIP + their cause lines; the day palette + the landmarks' drawings (first-pass — the
owner judges them on his phone); the sounds' levels + the `-b` takes (H6's mix); Grok's new bell + horn (not delivered).
