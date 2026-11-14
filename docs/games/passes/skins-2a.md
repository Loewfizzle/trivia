# SKINS 2A — PRISM DROP: THE SHARE CARDS (NO PILLS, ONE RHYTHM) + WATERCOLOR REWORK + CRAYON TEXTURE + GROK's SOUNDS — Nov 14 2026

The plan: docs/games/plan.md "PRISM DROP — SKINS → SKINS 2A" (Step 0, `caef1d99`). On the mini PC. **No database rules change**, no `/api`
change. The reference: docs/prism.md "THE SKINS" + docs/progression.md "SHARE TODAY".

## THE OTHER PILLS — found, NOT fixed here (the owner's list; a read-only search of css/, js/, the root html — Nov 14)
A pill = a shape wider than tall with fully rounded ends. The share kit's are gone (Group 0). Everything else that still draws one:

**LIVE (players see it today)**
- `css/components.css:1098` `.btn` (+ `.btn-sm` :1117, `.btn-xl` :1118) — **THE NEON TUBE: nearly every standard button in the app** (sheets,
  setup, results, profile) — `border-radius: 999px` on a 54 / 44 / 58-px-tall box. (Only the dailies' PLAY / SHARE buttons override it to 10 px:
  daily.css:135 / 171, password.css:233, coastclear.css:288.)
- `css/title.css:598` `.nd-pill` (+ `.rdk-pill` in a room) — the dock's centre glass bar (BOARD · GAMES · YOU / YOU · GUESTS · GAMES · CHAT);
  the rain / frost on it follow the same shape (`js/screens/harbor/glasswx.js:475, 651, 661`).
- `css/title.css:853` `.nd-rejoin-btn` — REJOIN above the dock · `:1047` `.rc-note` (+ `.rc-note-t / -x`) — the room's one-line note ·
  `:1082` `.rc-name` — the name label over a person in the room city · `:1153` `.rdk-votes` — "3 of 7 want a rematch".
- `css/components.css:874 / 883` `.net` — the SIGNAL LOST banner · `:867` `.dup-tab` — the second-tab banner · `:1003` `.mh-hint` — "SOUND IS
  OFF — SETTINGS" · `:940` `.lb-delta` — the "+N" beside points on the results' rows.
- `css/chat.css:63` `.chat-chip` — the quick-message chips · `:99 / 156` `.chat-pill` — NEW MESSAGES ↓.
- `css/bring.css:37` `.byc-chip` — "bring your card" over the dock · `:51` `.setup-byc-go` — the same on the setup screen.
- `css/board.css:70` `.bd-tab` — THE BOARD's five tabs · `:85` `.bd-seg` + `:87` `.bd-seg-b` — its segmented control · `:100` `.bd-chip` — its
  filter chips · `:181` `.bd-retry`.
- `css/progress.css:353` `.pg-card-fd` — the FOUNDER badge on the membership card · `:484` `.pf-gt-chip` — the "+N XP" goal chip · `:540`
  `.rg-off` — SIGNAL LOST in the guest list · `:462` `.pg-bar.pg-bar-tube` — the level bar (14 px, round ends) · `:478` `.pf-gt-bar` — the
  goal bar (16 px).
- `css/vault.css:164` `.vl-pick-on` — EQUIPPED ✓ in the vault picker · `:258` (+ 989) `.vl-fc-fd` — the FOUNDER badge on the full card (the
  default badge slot is literally named 'pill' — vault/full.js:57 / 157).
- Count badges (a circle at one digit, a capsule from two): `css/chat.css:4 / 42` `.cf-badge` · `css/friends.css:45` `.fr-badge` ·
  `css/title.css:674` `.nd-dy-n`.

**ADMIN / TOOLS (the owner's pages)**
- `css/admin.css:74 / 75` `.ad-tabs` / `.ad-tab` · `:83` `.ad-bar` · `:141` `.ad-jump-b` (+ `.btn` everywhere) · `css/daychart.css:12`
  `.dc-tab` / `.dc-day` · `:21` `.dc-chip` · `css/vault.css:183` `.vl-saved`, `:944` `.vl-need`, `:956` `.vl-filter` (the card lab).
- `css/harbor-remote.css` — 7 (`.hr-cd` :31, `.hr-cd-n` :40, `.hr-pa` :56, `.hr-pa-n` :66, `.hr-cat-n` :208, `.hr-foldn` :231, `.hr-chip` :276).
- `css/radio.css` — the tube rule for 16 button selectors (:449, :587), `.rd-fire` :176, `.rd-play` :274, `.rd-lever` :277 / 518, `.rd-cover i`
  :526, `.rd-qx` :544, `.rd-fsw-state` :574, `.rd-tune` :65 (a capsule's top half).
- `js/screens/harbor/bench.js:173` — the phone bench's buttons · `css/components.css:929` `.tag` — "TEST SLOT n" (title.js:469).

**FROZEN (the ten hidden games)** — gridlock.css 3 (:78, :249, :408) · slip.css 6 (:99, :190, :230, :236, :248, :317) · rum.css 5 (:27, :44,
:48, :172, :240) · stakes.css 3 (:115, :231, :253) · `css/kit.css:30` `.mk-ann-in` (nothing renders the default today) ·
`js/games/bluff/view.js:237` (`.tag`) · `js/ui/game-art.js:50` (PULSE's cover: six road dashes).

**DEAD CSS (pill-shaped, nothing renders it)** — board.css:268 `.pf-member`, :344 `.pf-chip`, :277 `.pf-xp-bar / -fill` · components.css:840
`.chip-btn` · progress.css:232 `.pg-vitem.is-on::after` · title.css:1148 `.rdk-pips`.

**MAYBE (the owner judges)** — the switch TRACKS (components.css:1204 `.switch` 54 × 32, board.css:307 `.pf-switch-ui`, components.css:1064
`.cr-sw` 92 × 44 with text inside) · HOLD'EM's table sideways (a wide stadium — view.js:395; a poker table) · thin fully-round bars
(progress.css:324 `.pg-sk-bar` 8 px, holdem.css:469 `.he-sl-rail` 10 px) · holdem.css:265 `.he-bet > span` (the bet plate, ~82 % round) ·
vault.css:1172 the soft washes behind the full card's text lines · THE ADMITTED stamp's border (`js/daily/ticket-art.js#stampSvg` — a rounded
RECT, rx 9 on 120 × 44: not a capsule) · city scenery (biplane wings, a rolled cloth, the lighthouse's windows — objects, not UI).
