# FRIENDS B — FACE ID / PASSKEY SIGN-IN + the podium, profile + shell fixes (Nov 8 2026, small hours)

Step 0 = plan.md "OWNER'S NOTES — NOV 8 (night)" (part 77, 40a71b1) + decisions.md (FRIENDS B building; FRIENDS C — the city — after).
**RULES: unchanged by this pass.** The passkey nodes (`pkc` / `pkx` / `pkch`) are server-only through the root's `.read/.write: false` — no rule
names them (rules.test PASSKEYS proves a phone can't read or write them). **FRIENDS A's rules are still unpublished** → the owner publishes the
newest `database.rules.json` once (it covers FRIENDS A; FRIENDS B adds nothing).
**Functions: still 8 of Hobby's 12** — the passkey actions live on `api/profile.js`.
**NOT this pass** (FRIENDS C — not started): the radio + the crew radio's header at 390, the intercom sync, the sky + weather, the helicopter /
THE FLYBY under the clouds, the cloud reds, the slow-3G load / match screen.
**Servers:** FRIENDS A's emulators (from 11:32 pm) were still running — "port taken"; stopped (test emulators only), then my own fresh
emulators + `serve.mjs --emu` on :5173; all stopped at the end. The rule is in CLAUDE.md's testing section now.
Commits: Step 0 40a71b1 · Group 1 dc0a1c8 · Group 2 18f492f · Group 3 + the end (below).

## Group 1 — FACE ID / PASSKEY SIGN-IN
**How it works for the player.** YOU → ACCOUNT → **ADD FACE ID SIGN-IN** → the phone asks "Save a passkey for neonspeakeasy.com?" → Face ID →
the card lists it ("iPhone · added Nov 8 · REMOVE"). On a new device, or after clearing history / site data: **BRING YOUR CARD** (the title's
"ALREADY A MEMBER?") or **RESTORE YOUR ACCOUNT** → **SIGN IN WITH FACE ID** (above "OR PASTE YOUR KEY") → the card is back, exactly like a key
restore. Apple devices share the passkey through iCloud Keychain (iPhone Face ID, Mac Touch ID — no QR). A Windows / Android device: the button
reads SIGN IN WITH A PASSKEY; the browser's dialog offers "use a phone" → a QR code → the iPhone scans it (Bluetooth nearby) → signed in; it may
then ADD its own. The device that signed in by passkey holds no key — ACCOUNT says "YOUR KEY · not on this device" and offers NEW KEY; the saved
key keeps working everywhere. **THE RESTORE KEY STAYS** — unchanged.
- The server: `api/_lib/passkeys.js` (docs/profiles.md "PASSKEYS" — every node + rule). `@simplewebauthn/server` **13.3.3** pinned (Aug 2026; 14.1.0
  was two days old — skipped), root package.json, /api only. RP ID from the request's Origin: neonspeakeasy.com (+ www) · localhost off production.
  Discoverable, user verification REQUIRED, the counter checked, one live challenge per device per kind (5 min, used once, bound to that device).
  Sign-ins share the restore key's limit + its `linkDevice`. REMOVE + the Signal API (Chrome drops it from the phone's list itself).
- The phone: `js/profile/passkey.js` (WebAuthn by hand — the JSON options ↔ ArrayBuffers, readable errors, a cancel says so), `passkey-ui.js` (the
  ACCOUNT block, the sign-in button), `me.js#adoptCard` (the key's + the passkey's one "this device joined" path), css/board.css `pk-`.
- Look: shots-profiles `pf-06p-*` at 390 / 412 / 1440 (round 1 found a stray "null" under ADD and WINDOWS HELLO wrapping two buttons → fixed: non-Apple
  devices say PASSKEY; the row is not alarm-red until its second tap) + WebKit 402×874 @3 (`wk-faceid-account.png`, `wk-keychain-restore.png`).
- Proof: `server.test.mjs` PASSKEYS — register, sign in on a new device → the same card, a replayed challenge, another device's challenge, a phishing
  origin, an expired challenge, a cloned counter, no Face ID, an unknown passkey, REMOVE, the limit (a software authenticator, `kit/soft-authenticator.mjs`)
  · rules.test PASSKEYS · `e2e-profiles` 120/120 incl. 6p (Chromium's CDP virtual authenticator: ADD → clear site data → BRING YOUR CARD → SIGN IN →
  the same card, a new uid, no key written → REMOVE → it no longer signs in) · `wk-keychain` 13/13. **The real Face ID prompt = the owner's iPhone.**

## Group 2 — THE PODIUM + THE END SCREEN
1. **THE NEW PODIUM SOUNDS** — Grok's 9 mains as-is (they were cut + levelled by him) + his xylophone backup as the podium's winner sting (replacing the
   synth arpeggio the owner heard as "a suction / a cat hissing" — the old flame-on was a gas hiss too). CREDITS → PODIUM SOUNDS; `?v=2` (PG_REV).
   docs/audio.md "THE PODIUM SOUNDS". The owner A/Bs on his iPhone (a solo run → the podium + the moment).
2. **OWN_VICTORY_SOUND** (B2) — OVERCLOCK sets it; the console's sting skipped → one winner sound (its fanfare).
3. **THE VICTORY MUSIC** (B2) — waits for the podium FRAME: `ui/final.js` sets `state.podium` → `app.js#musicFor`; before → the game's own track, through
   OVERCLOCK's last answer / banner / standings beats.
4. **ACCENT** — the frame's main tube in the game's colour: OVERCLOCK's BACK TO THE ROOM is OVERDRIVE orange; PRISM DROP stays pink.
5. **THE XP BOX** — one `<button>` (iOS sends the tap) → your card; YOUR CARD's tube gone (a quiet ›); the reasons wrap ("MATCH PLAYED · VICTORY ·
   PERSONAL BEST" whole).
6. **THE SCORE** — off the slim cards into the line under each: the game's note left, the score right, 19 pt number font.
7. **B4** — the list from 4th when the body shows 1st–3rd (a 2- or 3-player room has no list then; NOBODY SCORED → the whole list).
- Shots (`shots-friends-b/`): `oc-victory-8-*` + `oc-victory-2-*` at 390 / 402 / 430 + WebKit 402 (`oc-victory-8-wk-*`), the console podium with
  PRISM DROP's notes (`podium-5-*`, results-preview `&n=5` — its own finish runs the same frame; `e2e-prism` FAST 18/18).

## Group 3 — THE CARDS + THE SHELL
1. **THE TIER GEM = ONE SHAPE** — before `friends-b/gems-before.jpg` (a grey stone · a green octagon · 15–22 px) → after `friends-b/gems-after.jpg` (one
   brilliant, one size; silver · green · blue lit · purple + sparkle · gold + glint; the DEV gem unchanged).
2. **THE STEP DROPPED** — every plate one clean box as wide as its longest row (harbor `platefit` / `cardfit` / `stripfit` / NO STEP); the slim dev
   line reads DEV.
3. **THE SCREEN CHANGE** — the blue / pink glitch gone; a 150 ms opacity cross-fade; reduced motion = an instant cut.
4. **THE DOCK LIT BY DAY** — JOIN + HOST lit all day (softer than night: `--hk` 0.85), the pill's icons no longer go dark with the sign
   (`shots-friends-b/day-402x874-dock.png` vs `night-…`).
5. **og** — `assets/og.png` (1.03 MB) → `assets/og.jpg` (268 KB, JPEG q92 4:4:4 — a 256-colour PNG was 240 KB but shifted HIGH STAKES' yellow + NEON
   PAR's green and banded the sky); index.html's two tags → `og.jpg?v=4` + `og:image:type`.
6. **B5** — a locked GAME LOOK (NIGHT · LOCKED) hides the city's "Always night" switch under it.
7. **B6** — in a game a message sits under the header + whatever the game marks `[data-msg-under]` (OVERCLOCK's tach, PRISM DROP's top line): "Host
   signal lost" at 112 pt, the tach ends at 94.
8. **docs/cartridge.md ~53** — already said "the day set, never the date" (OC5); it still claimed every daily builds its puzzle from it — the two
   server-judged dailies return an empty run shell. Fixed to match the code.

## The end
- THE BUSY-PC CHECK: nothing but my own emulators + serve.mjs running before the suites (no chromes, no bakes).
- Locally: unit 1357 ✓ · rules 68 ✓ · `/api` server 40 (+ PASSKEYS) · friends 8 · progression 10 · sightings 4 · password 9 · coastclear 12 · lab 2 ·
  vault-2b 3 · vault-2c 3 ✓ · e2e-profiles 120/120 (on the final code) · wk-keychain 13/13 · smoke 6/6 (both games) · e2e-prism FAST 18/18 · THE FULL
  HARBOR SUITE (4 shards) 1099 / 1101: RADIO's "the desk stays where the finger left it" (588 of 658 — the scroll's max differed under the load)
  GREEN alone 47/47; THE ROOM's OWN COST at 4× CPU stays red — 31.1 → 36.4 ms alone, the same range FRIENDS A measured before + after its own pass
  (35.3–38.4 ms): the known display-less red. Earlier touched groups (shell, platefit, cardfit, stripfit, dock, neon, load, corners) 108/109 — LOAD
  WEATHER green alone 19/19.
- One final push with the harbor tag (a City 2.0 file changed: the dock lit by day).
- **Known**: the real Face ID prompt, the iCloud Keychain sync + the QR sign-in from a Windows / Android browser are only checkable on real devices
  (the owner's iPhone). The podium sounds are Grok's measured picks — the owner A/Bs them on the iPhone (the backups are in his folder). The
  console's winner sting = Grok's level-up BACKUP (a judgement call — the notes name no victory file; swap or drop on a word). THE ROOM's OWN COST
  red as before. FRIENDS A's rules still unpublished.
