# THE VAULT 1A — THE STYLE TEST (Nov 2–3 2026)

The owner's PROGRESSION B review + BRING YOUR CARD, THE CARD LAB, THE EFFECT LIBRARY's core, THE 8 SAMPLE CARDS as SLIM STRIPS + two test
emblems. Step 0 = plan.md "OWNER'S NOTES — NOV 2 (late night)" (part 54). One session, no helper agents, the groups in order. The deep
doc: `docs/vault.md`; the owner's marks for 1B: `docs/vault-lab-marks.md`.

## What changed
**Group 0 — the owner's PROGRESSION B review**
- **A SIGHTING WITHOUT A TAP (the bug):** on the UFO link with `&lgnow=1`, the tap that SKIPPED the title's intro finished it on its
  pointerdown (title.js#onAnyTap → skip → finish), so its pointerup reached `onCityTap` with the intro done — and the UFO (drawn during the
  intro, its generous tap box already on screen) took it as a sighting tap: the shake + the photo "by itself". Now a touch that BEGAN while
  the gate / the intro was up never becomes a city tap (`introTap`). `&sgdemo=` stays the only auto-play (read from the URL, never stored).
- **THE PARKED PRINT:** ONE element the whole way (the full-size print, scaled): out of the flash it shrinks + glides into its corner with a
  slight tilt + a soft settle (one eased gesture, 1.15 s), parks there TAPPABLE (opens the moment at once), then GROWS BACK from that exact
  spot (FLIP, a spring, 0.52 s). It ALWAYS pops: a hidden tab only waits (its frames stop — stale tap boxes are never read as "gone"), back on
  screen the craft is asked again, a craft that has left the screen counts as gone, a forced one that loops is let go after 75 s (was
  160 s with no way to open it). The developing veil is a script animation now (a CSS one restarted when the print moved).
- **NO SMALL ITALIC:** every small italic serif line (the band's line "You know the back rooms", "Tonight's counted · see you tomorrow",
  "only the ones you've earned", the descriptions, "71 / 202 XP", the birthday note, the key's line) → the UI font, UPRIGHT, ≥ 14 pt,
  ivory ~78 % (≈ 10 : 1); the XP figure in the number font, ivory. **PINK ONLY BIG:** FOUNDING MEMBER = a badge (ivory letters in a pink
  neon-outlined pill, up to 14 pt bold); "X% of players have this" 13 pt bold in a light pink (≈ 9.6 : 1); the small pink kickers → ivory.
- **BRING YOUR CARD** (`js/profile/bring.js`, `css/bring.css`): a device with NOTHING saved (no key + no profile) → the Home Screen app
  (standalone) LEADS with the sheet "ALREADY A MEMBER? BRING YOUR CARD" (paste the key → this device joins the card; "your card works on all
  your devices at once"; WHERE'S MY KEY?; I'M NEW HERE); a browser tab gets a quiet pill over the dock (✕ = I'm new); the setup screen a
  line; the empty membership card a button. **The membership card**: a BOLD "SAVE YOUR KEY SOMEWHERE SAFE — email it to yourself, put it in
  Notes or a password manager. Lose it and your card can't come back." + COPY · SHARE (the system share sheet) · I SAVED IT (quiets the
  3rd / 10th-match reminder; the box turns quiet, "YOUR KEY IS SAVED ✓") + **USE THIS CARD ON ANOTHER DEVICE** (the key big + COPY + SHARE +
  the three steps incl. Add to Home Screen; "this device stays signed in — you don't need NEW KEY"). The reminder sheet gets SHARE.
  `?bringcard=1` opens the sheet anywhere, `?bringcard=chip` shows the pill (nothing happens unless a key is pasted).

**Group 1 — THE CARD LAB** (`/lab`, `js/vault/lab*.js`, `api/_lib/lab.js`): admins only (whoami + every mark server-checked); every lab
item at real phone size, moving, the STRIP FIRST, its name + tier + what it does; APPROVE · FIX (+ a note) · CUT stored in `vault/lab`,
audited + a history; A FULL LOBBY (8 at once — the samples, 8 legendaries, 8 of one) with a live fps readout + STILL + TIER switches; the
public export (`GET /api/admin?lab=export`, no names) → `js/vault/approved.js` (only approved art ships) + `scripts/lab-export.mjs` →
`docs/vault-lab-marks.md`; links from /admin + the radio's LEDGER; `tests/integration/vault-preview.html` (the lab without Firebase).

**Group 2 — THE EFFECT LIBRARY** (`js/fx/`): ONE shared renderer (surfaces + slots, one rAF, on-screen only, hidden = stopped, reduced
motion = still frames, ResizeObservers, its own tier guard, a 2.6 MP budget) + the kit (seeded RNG, baked sprites) + smoke · frost ·
flames · prism · marquee · glitter · THE BORDER LASER · the UFO's life. THE TIER TABLE: `fxDpr`, `fxParticles`.

**Group 3 — THE 8 SAMPLE STRIPS + the two test emblems**: `docs/vault.md` "THE 8 SAMPLE STRIPS". Three refine passes each (bursts at 402 @3
+ WebKit @3): SMOKE (cotton balls → stretched banks + continuous ribbons + denser), FROST (covered the whole card → kept to the rim, a soft
rime, a jagged crack, no scalloped front), INFERNO (candle flames → a wall of real flame tongues, mirrored + leaning), THE MARQUEE (bulbs too
small to read → brass sockets, bigger warm bulbs, a clear chase), GLITTER BOMB (too small → a shockwave, more + bigger flakes, hearts +
sparkles), I WANT TO BELIEVE (the saucer moved left so its beam lands clear of the tag), BRUSHED GOLD (the texture high-passed: brushed
metal, not wood). The textures: 3 WebP at 1050 × 660 (47 + 101 + 335 KB — the repo + the deploy grow by ~0.5 MB).

## Decisions
- **FEASIBILITY (measured first, Group 2):** 8 LEGENDARY strips at 4× CPU on the real (GPU) compositor = 60 fps (median 16.7 ms, 0 of 240
  slow frames; the effects' draw ~7–9 ms in the slowed time); the 8 samples 58–60. On SOFTWARE compositing (the default test browser on
  Windows) ~40 fps — the canvas rasterised on the CPU, which a phone's GPU doesn't pay. Headless WebKit on Windows runs EVERY page ~10 fps
  (the lab with no canvas at all 92 ms a frame, the city's title 110 ms, 8 legendaries 77–88 ms) — so its timing judges nothing absolute;
  the strips are no costlier there than an empty page. → **No STOP + ASK** (the bar held on the GPU path); the iPhone's own number comes
  from the lab's readout.
- **The material is CSS, the motion is the one canvas**: a strip's texture + frame + plate are DOM (crisp at the full ratio, free for a still
  common); only the effect is canvas — so a strip can't be a stacking context (documented: LOBBY 2.0 animates a wrapper).
- **THE EXPORT IS PUBLIC** (ids + marks + notes, no names or profile ids) so the next pass can read the marks from the mini PC without the
  owner's login and the site can gate approved art without a socket; the owner's notes are readable by anyone who finds the URL — before
  GO PRIVATE (launch) it moves behind the admin check.
- **New ids:** SMOKE ROOM, FROSTBITE, INFERNO, PRISM (where they unlock: 1B), GLITTER BOMB (level 8) + HEARTBREAKER (level 4) — the pink
  pair early, as decided; BRUSHED GOLD's tier uncommon → common (the approved sample). Existing players get the two new level rewards on
  their next match (the carry-over grants everything up to their level).
- **The emblems are CSS + SVG** (no canvas): eight animated emblems alone hold 60 fps at 4×.

## Known issues
- **Only the strips:** the FULL cards, the rest of the ~40, the sighting cards' full art, the names served only to owners → **THE VAULT 1B**
  (from the owner's marks). Emblems + glows → VAULT 2. The strips appear only in the lab until LOBBY 2.0 puts them in the guest list.
- **The iPhone's frame rate is unmeasured** — the owner's lab readout (A FULL LOBBY → 8 LEGENDARIES) is the verdict.
- **THE INTRO SKIP was the most likely cause** of the photo "by itself" (the only path that turns a non-sighting tap into a sighting); a tap
  for sound that lands ON the craft after the intro is a real tap and still counts — if it happens again, say whether the screen was tapped.
- HEARTBREAKER has no strip yet (not one of the 8 samples) → 1B.
- **A test-order dependency (older than this pass):** the profile E2E's "every other row: a house nickname" needs ANOTHER player on THE
  BOARD; right after the /api tests wipe `lb/` on the emulators it sees only ALICE's row (68/69), and passes once the board has rows again
  (75/75 on the re-run). Worth seeding a second listed player in the test itself (BOARD 2.0).

## Hand-off to 1B
Read `docs/vault-lab-marks.md` first (`node scripts/lab-export.mjs`). APPROVED strips → their full cards (`card-i-want-to-believe.png` is
the legendary's full-card class); FIX → the note; CUT → gone. Then the rest of the ~40 + the sighting cards on the same library (start
from the city's own effects: the aurora, lightning, skywrite smoke, fireworks) + names / art served only to owners.

## THE FULL LOCAL RUN (the mini PC, Nov 3)
unit 1073/1073 · rules 58/58 (the rules file unchanged — no re-publish) · /api: server 29/29, progression 9/9, sightings 4/4, lab 2/2 ·
smoke 6/6 · the profile E2E 75/75 · THE FULL HARBOR SUITE 894/897 at 4 shards (~21.5 min): the three reds re-run ALONE — the desktop resize,
the music's A CALL + partysync all GREEN alone (side-load timing); **LOAD WEATHER "a stored JUST ME jump into a holiday night" fails alone
on the PRE-PASS build too** (c212047, served from a worktree — 14/15 there, the same check): an existing failure, not this pass's (likely
the date — Nov 3, the jump into a holiday night); the vault group 5/5, sightings 10/10.

## HOTFIX — /lab WOULDN'T SCROLL ON THE OWNER'S iPHONE (Nov 3, 6 am)
The cause: base.css's one-screen lock (html/body height 100% + body overflow hidden + overscroll none) carried into /lab; this pass's
checks moved the page with scrollIntoView (works on a locked page), never a finger. Not the cause: the fx canvas (absolute inside its
host, pointer-events none), the mark buttons (touch-action manipulation). The fix: vault.css unlocks `html.vl-lab-html` / `body.vl-lab-on`
(like /admin); the app's screens unchanged. The proof: the `vault` group's BY FINGER checks (13/13; with the fix removed the 4 scroll
checks fail at 0 px in Chromium + WebKit). Deployed with the deploy tag only.

## Tests (this pass)
unit `tests/vault.test.mjs` (6) · `lab.test.mjs` (2 — /api on the emulators) · rules + the marks (58/58; the rules FILE unchanged — no
re-publish) · the profile E2E + BRING YOUR CARD (75/75) · the harbor `sightings` group (+ no tap → nothing, the skip-tap, the parked
print's tap + the motion's shape) + the new `vault` group (5/5, in the `audio` cloud job).
