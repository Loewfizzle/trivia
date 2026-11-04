# THE VAULT 2C — THE POLISH: CUSTOMIZE · THE PROFILE · TROPHIES · TIER GEMS · THE LAB 2.0 · THE WRONG DOOR — Nov 3 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 3 (evening)" (part 59) + the owner's ADD-ON (7:16 pm: the dev cards' tag reads "1 OF 1 · DEV").
The lab's marks export (refreshed first — `docs/vault-lab-marks.md`): every 2B emblem, glow + tube style APPROVED; 8 FIX marks — THE
SWITCHBOARD (strip + full), THE SOURCE (strip + full), FOUNDING MEMBER (strip + full), INFERNO, CENTURY (no note). One session, the groups in
order, no helper agents. The deep docs: `docs/vault.md` ("THE VAULT 2C"), `docs/profiles.md` ("THE PROFILE's ORDER"), `docs/progression.md`
("ACHIEVEMENTS AS TROPHIES"), `docs/title.md` ("THE WRONG DOOR").

## What changed
**Group 0 — the lab's FIX marks** (each one now CHANGED in the lab, with its line)
- **INFERNO — REAL FIRE** (`js/fx/fire.js`): "needs to look a lot more like real flame" → the teardrops are gone; a baked flipbook of a real
  fire field (domain-warped noise, periodic across, looped in time, a blackbody ramp — 12 frames, one atlas sprite, baked once) stamped as whole
  tiles in three crossing layers; the flames run the WHOLE strip (the look the owner loved in the mock). **CENTURY** (FIX, no note) shares the
  effect — the teardrop flames were the likeliest reason; its CHANGED line asks him to say if it was something else.
- **FOUNDING MEMBER's full card**: "change the card table scene to the shadow boxer scene" → the speakeasy bake never paints the retired card
  game; THE SHADOWBOXER (the city's own painter + timeline) works out live in the back room's pane (`speak-front.js#drawBoxer`). **THE HOUSE**
  gets the same room (no card game anywhere — the prompt's Group 2 item, done here).
- **FOUNDING MEMBER's strip**: NEON SPEAKEASY centred in the strip's art (the pills gone with the tier gem). **THE SOURCE's strip**: NEON
  brought down + centred. **THE SWITCHBOARD's strip**: the pink-red cable lands in a TOP-row jack.
- **The dev cards' full cards**: the tag in his short form, BOLD — "1 OF 1 · DEV" (the ADD-ON replaced "#1 OF #1"); the strip's tag → the dev
  gem (Group 2 — the decided rule over his strip-tag notes).

**Group 1 — THE LAB 2.0** (`js/vault/lab-views.js`): the ☰ menu's **THE LAB** (admins only — the server's whoami, the same yes as ADMIN); a sticky
bar ‹ THE CITY · THE LAB · "N NEED YOU"; 4 sections (CARDS · EMBLEMS · GLOWS + TUBES · LOBBY TEST) + 5 filters with counts (NEEDS YOU default ·
CHANGED · FIX · APPROVED · ALL — "All caught up." when empty); ONE ROW PER ITEM (gem, name, NEW / state, the strip with a FULL CARD › toggle
flipping it in place — each face its own marks), the dated **CHANGED** line beside his old mark; versions (`catalog.js#LAB_V`, the lines in
`lab-text.js#LAB_CHANGES` — server-side), a mark stores the version it was made at; NEW since his last visit (per device); the diagnostics +
WEAR mixes folded into LOBBY TEST's settings (+ a TIER GEMS switch); the export adds each item's version.

**Group 2 — TIER GEMS + THE DEV GEM + FOUNDER + the card fixes**: the strip's tier pill → THE TIER GEM (`js/vault/gems.js` — the approved mock:
grey stone · green cut · blue · purple + sparkle · gold + glint + star; no words); THE DEV GEM (prismatic facets cycling the spectrum, a rainbow
sweep, a pulse, sparkles, a turning rainbow halo — it plays on a legendary-led strip; reduced motion = bright + still); FOUNDING MEMBER's № → gold
letters; **FOUNDER** everywhere it's a badge, in each card's declared **BADGE SLOT** clear of its moving parts (`full.js#BADGE` — the dev cards:
"NEON SPEAKEASY · FOUNDER" in the top line, the VU meter clear); the GLOW tiles' names fit (Safari sized the grid item to its text).

**Group 3 — CUSTOMIZE + ONE EMBLEM SYSTEM**: DRESS YOUR CARD → **CUSTOMIZE** (the button CUSTOMIZE YOUR CARD, the screen CUSTOMIZE); the 12 sign-up
shapes are COMMON emblems every member owns (`emb-sign-<shape>`, "NEON …" — STARTER: owned from the first second; their rows back-filled on 'me' once stats exist — never a stats node at sign-up, or a first match would stop granting the level rewards up to its level), in CUSTOMIZE's
EMBLEM tab with the earned ones; wearing one = the profile's shape (`a`) + the earned emblem off; EDIT PROFILE = the name + the colour (the shape
is picked once, at sign-up); the "YOUR OWN EMBLEM" row is gone.

**Group 4 — THE PROFILE REARRANGED + LESS GOLD + TROPHIES**: the full card on top (a tap = its animated view) + CUSTOMIZE YOUR CARD; level (gold
bar + a slow glint) · the streak · stats (+ the week's goal) · achievements as TROPHIES (tier medals, X% from the server, a real reward preview —
tap = wear it, the date) · city sightings · mastery + your games · ACCOUNT (Edit profile · your key · the birthday — one line once set · the
opt-out); no BOARD button; the panels faint dark glass, gold only where it means something.

**Group 5 — THE WRONG DOOR** (`404.html`): the speakeasy's door at night, the peephole slot sliding open, "Wrong door, friend.", ONE big BACK
TO THE CITY; DID YOU MEAN (our routes, a hush word → its room; /lab + /admin only on an admin's device); static — no Firebase, no modules; the
local server serves it like Vercel.

## Decisions
- **Locked achievements are NOT shown** on the profile, though the prompt's Group 4 line said "locked ones dim with their hint": the standing
  rules win — collections show only what a player owns, and achievement names reach a phone only for what it owns (the leak test). Flagged for
  the owner; one line to change if he wants the hints (they'd have to come from the server, per player).
- **CHANGED never pulls approved art**: an APPROVE at an older version still ships the newer art; CHANGED asks for a re-look. (Pulling would
  have hidden THE HOUSE's full card — approved — from players over a room swap.)
- **The tier gem change is not a per-item CHANGED**: it touches every strip; the lab's own look shows it, and the CHANGED lines stay for the
  items whose own art changed (11 faces).
- **The 12 sign-up shapes' names are public** (every member owns them — nothing to keep from anyone); named "NEON BOLT" … so they never read as
  an earned emblem (THE CROWN, DIAMOND exist).
- **The legendary gem's glint is a flashing star, not a sweep under a mask**: the masked moving layer repainted — 8 legendary strips paid
  ~0.75 ms a frame on the bench. The DEV gem keeps its masked rainbow sweep (one in a lobby at most — the owner's).
- **NEW is per device** (`localStorage vl:seen`): the lab has no per-admin server state to keep it in; a first visit marks nothing new.
- **The in-app dead ends keep their own lines** (the JOIN panel's "No room behind X right now…" — already in the house tone); they're not whole
  screens, so the door isn't reused there. The OPTIONAL offline door (from the service worker) was not built.

## Measured (the mini PC, 4× CPU, the real compositor, 3×)
8 LEGENDARY strips (with gems) 58.4–59.7 fps · gems on vs off within the noise after the one-layer glint (4.14 / 4.06 ms busy) · THE 8 SAMPLES
55.1 · THE 8 SIGHTINGS 54.0 · THE NEW 21 60.0 · 8 INFERNO strips (real fire) 60 (1.16 ms busy) · 8 THE SOURCE strips with the DEV gem 58.1 on
the GPU canvas (gems off 60 — an impossible lobby: one dev card exists).

## Known issues + held back
- Every CHANGED item waits for the owner's re-mark (11 faces: INFERNO ×2, CENTURY ×2, THE SWITCHBOARD ×2, THE SOURCE ×2, FOUNDING MEMBER ×2,
  THE HOUSE full).
- The offline variant of the wrong door (optional) — not built.
- ON THE BEAT on a real party night (Friday or Saturday, music on) — still the owner's eye.
- `components.js#avatar` (game screens, today's lobby) still the old icon — LOBBY 2.0 brings the strips + emblems into the room.

## Hand-off — BOARD 2.0
THE TIER GEM (`gemEl(tier, { dev })`) is the tier mark on any row; the strips carry it already (`stripEl`). The trophies (`progress/trophies.js`)
+ the X% counts (`/api/profile 'pct'`) are reusable for the board's records. The marks export now carries each item's version + CHANGED.
