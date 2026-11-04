# FR6 FIXES A — SAFETY: WHAT A PLAYER COULD LOSE, THE SILENT FAILURES, THE CONSOLE's FLOWS, THE CLOUD TRIGGER + THE OWNER's 2B NOTES — Nov 4 2026

Source: `docs/harbor/review-6.md` (FR6) — its plan's Groups 1 + 2, plus E4 + G5 pulled forward. Step 0 = plan.md "OWNER'S NOTES — NOV 4
(afternoon)" (part 63) + decisions.md. One session, the groups in order, no helper agents; each group committed + pushed (no tag). **The
database rules did NOT change** (`tests/fixtures/rules-live.json` = the rules the owner published Nov 4 ~11:22; `tests/rules-live.test.mjs`
green with no ack) — nothing to re-publish. No add-on arrived during the pass. Nothing was opened, created or written on the live site:
every run on the emulators + `serve.mjs --emu` (the mini PC; port 5181 — an older dev server held 5173).

## What changed, by finding

**Group 0 — the two tiny urgent ones** (4037d42)
- **E4** `/shots/` (+ `/shots*/`) in `.gitignore` — the 1.8 GB folder can't be added by accident; the empty stray `2/ 3/ 4/ 6/` folders removed
  (nothing tracked in any of them).
- **G5 THE CLOUD TRIGGER**: `harbor.yml`'s `paths:` and `tests.yml`'s push `paths-ignore` are gone — GitHub judged the WHOLE push's diff and
  created NO run when nothing matched, before `if:` could read the tag (2B's tagged final push = one docs commit → no run at all; the `room2`
  job had never run). The tag decides: the TOP commit's message (`head_commit.message`, as Vercel's ignoreCommand reads it) or any commit's in
  the push; an untagged push is a skipped run (0 minutes) whatever it touched. Proof without cloud minutes: `tests/workflows.test.mjs` —
  a small evaluator for GitHub's expression syntax runs both workflows' OWN `if:` + concurrency expressions against simulated pushes (2B's
  docs-only tagged push → runs; untagged code / docs → skipped; the game tag → tests only; by hand + PRs → run). It fails on the old files.

**Group 1 — the owner's own (his 2B checks)** (961ff11)
- **THE DOGS FLASHED COLOURS**: `scene.js#peopleEnv` built its object with TWO `wind` keys — the later one, `WF.v(0.5)` (the per-frame gust
  field, ATM-A), silently won — and `people.js#lookFor` keyed every look on `wind > 10`. Each gust across 10 re-rolled the look, and the dog's
  coat + size were drawn LAST from the person's random stream (the hand-on-the-hat draw shifted them). Now the looks read `windLook` (the
  weather's steady gust); the dog draws its coat + size from its OWN seeded stream (no weather can touch it). Unit: "ONE LOOK PER DOG" (10
  weathers × 6 seeds) + the look key reads the steady wind and `peopleEnv` has ONE `wind` key — both fail without the fix. (The dog coats are
  a different pick of the same five colours than before — the same palette.)
- **THE FAST LEGENDARIES' POLAROID** (the Blackbird's photo held only the vapour cone): the photo was taken ~0.45 s after the tap; the jet
  had gone, its box was stale, the crop fell back to the TAP's spot — where the cone stays. Now `sight-react.js#FAST` (the Blackbird, the
  F-22s, the fireball — `sighting.js#FAST` keeps the same list as data; a unit test checks they agree) is shot AT THE TAP, and EVERY snapshot
  centres on the legendary's box as that very frame drew it (`scene.snapshot(…, { key })` → `SR.shot(key)`); the Blackbird's photo centre is its
  body + plumes (`meta.shot`) — the cone only when it shares the frame. `last.snap` now says `src` ('live' / 'given'), `dt` (ms from the tap),
  `craft` (its half size). Harbor group **`sgfast`** (the `legend` job): a real tap on each fast one → the craft's live box, 17–23 ms after the
  tap, 100 % inside the crop — fails without the fix.
- **THE ROOM PUSH** (pushes for rooms that were empty when he went): `room.js#roomPushLater` asks 10 s after the room opened and only while
  this phone is still in it (`exitRoom` clears the timer); the server (`radio.js#roomOpened`) wants the host still a player + online
  (`not_open` otherwise — and an abandoned room is not even marked); the push opens `/?room=CODE` (JOIN prefilled), and a room closed by the
  tap lands on "That room has closed (CODE). Host a new game, or ask for a fresh hush word." (app.js's existing invite check, reworded).

**Group 2a — what a player could lose + the silent failures** (9c41e6f)
- **C1** `profiles.js#ownsAnything`: a profile that owns ANYTHING — a counted match, an item beyond the free starter set (a sighting card,
  THE KNOCK, a birthday, a level reward…), a sighting, XP, a daily, a MEMBER Nº — is never deleted on restore; the device only unlinks.
  (DECISION — the prompt counts a member number as owned, and every profile gets one at creation: in practice a restore now never deletes
  the device's old profile. A legacy profile with nothing — no number either — is still removed, its tag freed.) Server test: the Home
  Screen app's stranger profile with a UFO card survives BRING YOUR CARD, its card + key intact; a truly blank one still goes. Fails without.
- **C2** `me.js#restoreKey`: the device's previous key (+ a held new key never adopted) goes into `notes.oldKeys` (the last 3) — ACCOUNT shows
  **YOUR PREVIOUS KEY** under the key card (COPY · FORGET; `me.js#previousKey / forgetPreviousKey`; `.pf-key-prev`). With C1 this is the way
  back to a card the old profile holds. Proof: e2e-profiles (the new browser's key kept as the previous key after the restore).
- **G6 + C7 — ONE WRITE PATH**: `firebase.js#write` wraps `set / update / remove / push / runTransaction`: the caller gets the SDK's own
  promise UNCHANGED (its catch, its fallback, push's `.key`), and a PERMISSION_DENIED is reported once per path SHAPE a page (`core/rules-lag.js
  #pathShape` — room codes, uids, match ids → `*`) to /admin's errors, label `rules`: "RULES REFUSED update rooms/*/meta {go} — …". C7's three
  (PRISM's `st: 'out'`, the ring's clear, `go: null`) and the other 20 swallowed refusals report through it. `firebase.js#refusals()` (tests).
  **THE RULES AS PUBLISHED**: `tests/fixtures/rules-live.json` + `tests/rules-live.test.mjs` — the unit suite fails when `database.rules.json`
  differs, listing the paths, until `tests/fixtures/rules-live.ack.json` names the new hash + "RULES CHANGED: … — RE-PUBLISH" (the summary's
  first line). `oldrules` now starts from the fixture (minus 2B's nodes) and checks the refusal was REPORTED with no room code in it. The
  standard: docs/testing.md "THE RULES-LAG" + one CLAUDE.md line.
- **C3** PRISM DROP's SCORE RUSH bound: `match-report.js#RUSH_MAX_S` = 240 (the longest song 227.8 s + 10, rounded) caps the bound's seconds;
  a rush with more than one song or an impossible length is rejected — the host's `sd` can't lift it. Unit (profiles.test — the constant
  covers the manifest's longest song) + server test (a hacked `sd: [1e9]` posts no record; the match still counts).
- **C5** `api/admin.js#cityLiveNow`: the public `live=1` read says `by: 'owner'`, never the admin's profile id (the admins' own socket keeps it).

**Group 2b — the push tamed + never the live site** (42d0e82)
- **C4** THE ROOM PUSH's limits: one per sender an hour + 10 an hour in all (`radio.js#PUSH_LIMITS`, the shared `api/_lib/limit.js#take` —
  THE BOARD's REPORT uses it too); the room's mark is set first, so a refused one never pings later.
- **G7 THE LIVE-SITE GUARD** (`tests/integration/kit/live-guard.mjs`): `kit/puppeteer.mjs` patches `page.goto` on the page class — every page
  of every test browser (the harness, the harbor kit, shots, pixdiff, title-perf, the benches…); `wk-room.mjs` guards `PROD=1` itself. A
  non-local host throws unless `LIVE=1`; then every page carries `&test=1`. `scripts/lab-export.mjs` defaults to localhost (the owner's marks:
  name the live site). **THE TEST FLAG** (`js/identity.js#testMode`, kept by the tab + the room URL): no profile is made (no MEMBER Nº), the
  room push says `silent` (the server marks the room, pushes nothing). `tests/live-guard.test.mjs` (+ no script DEFAULTS to the live site).
  Checked in a real browser: a local page opened, `https://www.neonspeakeasy.com/` refused before any request.
- **C8** the logs pruned on write (`api/_lib/prune.js`): a log write prunes `phonelog` (the newest 40), `errlog` (quiet 30 days), `rl/` (older
  than 2 days — every window is ≤ a day) at most once an hour (a marker transaction). Server test.
- rules.test: one default-deny case for `flags/ rl/ results/ errlog/ phonelog/ gplay/ wx/` (read + write, signed in or out).
- docs/profiles.md: THE PEPPER — with no `KEY_PEPPER`, rotating the service account invalidates every key hash, board id + daily seed.

**Group 3 — the console's flows (B1–B7)** (0c6e4b9)
- **B1 + B7** `layers.js#closeAll()` at the game start's stamp (`room-city.js#startFx`, every phone) and on leaving the room (`room.js#exitRoom`
  — a kick, a closed room): each pop-up module registers its own close (`onCloseAll`): the room's profile overlay, the profile's sheets (the
  key pop-up among them), CUSTOMIZE, the full card, the ☰ menu, the streak card; every `.modal` still open closes the Esc way (its backdrop).
- **B4** ONE START AT A TIME: `host.js#startGame` returns the in-flight promise to every caller (the ring, INITIATE, the podium's REMATCH)
  and keeps it through the walk inside (START_MS) — a double-tap is the same start, never a second match.
- **B2 + B3** a start that dies or runs long: the veil holds while the stamp is up and the room still waits (`room-show.js#goWaiting`), at
  most `GO_DEAD_MS` 30 s (was a 9-s cut that relit the sign, then hard-cut into the game), with "GETTING THE GAME READY…" on it past the walk;
  a host that finds a stamp it isn't preparing (the stamping host died / this phone reloaded) takes it down after `GO_ORPHAN_MS` 3 s; every
  phone says THE START DIDN'T GO THROUGH (the host: "— TAP PLAY TO TRY AGAIN"; the guests: "— THE HOST CAN TRY AGAIN"), the room back.
- **B5** keypop's covered list = `KEYPOP_COVERED` — every real sheet (CUSTOMIZE, the full card, the room's profile, ☰, the sighting moment,
  the streak card, the album); the two phantom classes (`.sg-shot`, `.vl-full-open`) gone.
- **B6** OVERCLOCK's `write()` returns when the match is gone (BACK TO THE ROOM with a done-timer pending).
- Proof: the harbor **`gameflows`** group (the `audio` job — room2 sat at its 600-s cap): a guest's CUSTOMIZE + the room's profile + HOW TO PLAY
  + ☰ all closed at the start, the match on screen; two simultaneous starts = ONE match id + one stamp on the guest's phone; a dead stamp →
  THE START DIDN'T GO THROUGH on both phones in ~3.2 s, the stamp down, no veil, the room back; no page error through it all. Without
  `host.js`'s changes B4 (two match ids) + B2 (the veil stuck, no note) FAIL. `wk-room.mjs` in WebKit: 5/5. `goWaiting` unit test.

## Decisions
- C1: a MEMBER Nº counts as owned (the prompt) → a restore never deletes a numbered profile; the device unlinks + keeps its key as YOUR
  PREVIOUS KEY (C2). No MERGE of the old profile's items into the restored one (review-6's alternative) — a key brings either card back.
- G5: the tag alone decides (no file filter): a tagged docs-only push runs the full suite — the one the pass wanted.
- G6: the report is a side-observer — no caller's behaviour changed; a feature on a NEW rule still keeps an old-rules fallback (2B's pattern).
- G7: the guard lives in the ONE launcher every browser script already uses (a unit test enforces the import) + wk-room.
- B4: the guard is in `startGame` itself (every start path), not the ring.
- B2/B3: `GO_DEAD_MS` 30 s (the worst slow start measured 12 s + the walk); `GO_ORPHAN_MS` 3 s for a host with no start in flight.

## Known issues + held back
- **SIGHTINGS compose < 12 ms** (`holiday.mjs:461`): 14.1 ms once in this pass's Group 1 run — review-6 G3's TEST BUG (12 ms was one run's
  number, never a phone budget); FR6 FIXES B drops the clause. Not touched here (out of scope).
- The sighting moment (`.sg-modal`), the album (`.sg-big`) + the preview (`.pg-pv`) don't register with `closeAll` — H2's five roots on the stack
  are SHELL 2.0's Group 0 (a match starting mid-reveal is rare; keypop already waits for them).
- The room push's client timer can't be proven in a browser without a real push service; the server's rules (open, host online, the buckets,
  silent) are in server.test.
- The owner's to-do: the test-player cleanup (`scripts/remove-test-profiles.mjs --apply`, Nº 42–46) if not done yet.

## The full local run (the mini PC — THE BUSY-PC CHECK quiet: 2.7 % average, 8.7 % peak)
- unit **1157/1157** (33 s) · rules **63/63** (41 s) · /api server.test **32/32** · e2e-profiles **79/79** · e2e-conn green (90 s) ·
  e2e-presence green (58 s) · smoke green (32 s).
- A FIRST profile run failed its new C1 check — MY test setup, not the code: the pass's own dev server (port 5181) had been started before
  Group 2 and `serve.mjs` caches each `/api` module on first use, so it served the OLD profiles.js. The server restarted, everything from the
  profile E2E on re-ran on the final code. (Lesson for the docs: restart `serve.mjs --emu` after touching `api/` before an E2E.)
- **THE FULL HARBOR SUITE: 1027/1034** (1,604 s, 4 shards). The seven, each re-run ALONE afterwards on the same code:
  - `crew` — "PUSH (CC-B): a guest opens … → null": THE TEST waited 6 s for the push, which now comes 10 s after the room opens (Group 1's
    rule). The wait → 16 s + the push's url checked (`/?room=CODE`); `crew` alone **17/17**.
  - `oldrules` ×3 — "meta/go refused: written": the old rules didn't hold in that run. The serial tail re-run in the same order
    (`panel, perf, oldrules`) **54/54** — the refusal REPORTED (`update rooms/*/meta {go} · update rooms/* {meta/go, meta/back, rv}`, no
    room code). Not explained (nothing else writes the emulator's rules); watched in the cloud run.
  - `roomperf` (THE ROOM's OWN COST 51.6 ms standing at 4×), `sky` (THE CLOUDS baked in time: 1 left), `vault` (A FULL LOBBY 21/240
    slow), `speakeasy` (a protocol timeout) — load inside the 4-shard run (the perf group's own t2 warning read 79 ms that run); alone
    **91/91** (the room's cost 27.5 → 29.8 ms with the guest list; the clouds 0 left; the lobby 14/240).
- New groups alone: `sgfast` 1/1, `gameflows` 4/4 (B4 + B2 FAIL without `host.js`), the room groups 29/29, `wk-room.mjs` in WebKit 5/5.

## The cloud run (THE FIRST since G5's fix — and the FIRST EVER for LOBBY 2.0 B's code + the `room2` job)
Run 1 (04c5cd7 — the tagged top commit: docs + one test file — BOTH workflows ran; every untagged push of the pass showed "skipped": G5 works).
- **harbor 41897872572: 11 of 12 jobs green, 1034 / 1035 checks.** audio 33/33 (662 s with setup — `gameflows` there; refresh SECONDS in B) ·
  show 103 · city 37 · perf 193 · street 75 · windows 91 · wild 62 · legend 90 (`sgfast` green on the runner) · models 87 · holiday 122 ·
  lobby 99 (`oldrules` green — the local full-run miss did not repeat) · **room2 42/43 — its first cloud run ever**: the one miss is 2B's own
  "THE FILE-IN … the HOST first — walking to the door at 0.9 s" (the host still `wait` at 0.9 s on the 2-core runner; green on the mini PC
  every run) → FR6 FIXES B (green means green: a condition, not a 0.9-s sample).
- **tests 41897872674: unit ✓ (136 s); rules + /api + smoke ✗ at 63 s** — `tests/integration/sightings.test.mjs` "CALL IN A FAVOR": its
  `rec` read `radio/fired`'s FIRST record, which is the earlier RADIO test's owner moment → `role 'owner'`. A TEST BUG that predates
  this pass (it fails the same at 1f6f106 — unseen because 2B's cloud run never happened); the favor itself was right. Fixed (the test reads
  its own record); every integration test file green locally (sightings 4 · progression 10 · lab 2 · vault-2b 3 · vault-2c 3 · rules 63 ·
  server 32). The local run's gap: it ran rules + server.test only — the pass's run list now names all seven files (docs/testing.md).
- Run 2 (`gh workflow run tests` on the fix — the pass's second and last cloud run): see the summary.
- Vercel: 04c5cd7 live (`/api/log` → `{"v":"04c5cd7"}`; `js/core/rules-lag.js` + the write path in `js/firebase.js` served by www — read
  only, nothing opened or written).
