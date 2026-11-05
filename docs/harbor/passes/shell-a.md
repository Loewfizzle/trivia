# SHELL 2.0 A — ONE LOOK EVERYWHERE (Nov 5 2026, morning) — the pass log

**The owner's approved look** for the whole app's shell (the menus, sheets, messages, buttons, cards + the podium — never the city itself):
docs/harbor/refs/shell/ (copied from Downloads\NEON\shell): `shell-look.png` (THE MESSAGE + THE ☰ MENU), `button-options.png` (OPTION 2, THE
NEON TUBE), `tier-gem-cards.png` + `oneofone-corner.png` (the tier gem + THE 1-OF-1 BADGE), `podium-back.png` (the placement of BACK TO THE
ROOM). Step 0 = plan.md "OWNER'S NOTES — NOV 5 (morning)" (part 68). SHELL 2.0 B (the contract + the features) is next.

**No rules change** (nothing in the database changed — the shell is the client's look).

## Group 0 — CITY 1.0 OUT's two cloud reds, at their cause
- **The boxer's 11:45 pm blind** (`windows.mjs` boxer): the wait checked `!!park`, but the window life's `debug()` returns `last.park || {}` —
  truthy before its first frame — so the wait never waited and a slow runner read `park.back` undefined. The test now waits for `park.back`
  itself. The scene was right (every frame sets it).
- **A6** (`speed.mjs` resizekeep): the runner's page had already re-laid out once more when the check began (kept 1 where the mini PC starts
  at 0 — the title's rects still settling), so the @2 re-layout met a camera still moving. The count starts once the page's own layouts settle
  (the plan counters + the load log's layouts unchanged for 1.5 s); a failure logs the layouts before / after + the re-plan's cause
  (`people.js#plans().why / .log` — computed only on a re-plan).

## Group 1 — THE ONE LOOK: the parts (components.css "THE SHELL"; one builder each)
| part | the builder | the look |
| --- | --- | --- |
| THE NEON TUBE | `.btn` (+ `ui/components.js#tubeButton`, `#confirmTap`) | a lit tube: a white-hot core between two lines of its colour + the glow, round ends, dark inside, Orbitron spaced. MAIN `.btn-primary` pink (ONE a screen) · SECONDARY `.btn-ghost` cool white · DANGER `.btn-danger` red · SMALL `.btn-sm` 44 pt · DISABLED unlit · the SECOND TAP turns the button itself red-filled "TAP AGAIN TO …" (`.is-confirm`). Static glow; a press = scale. |
| THE SHEET | `ui/sheet.js#openSheet` (`profile/sheets.js#openPfSheet` IS it) | SOLID dark (nothing reads through), floating above Safari's bar (THE VAULT 1B rule), a handle, the title small + spaced pink-white, a small line under it, ‹ (one step) when it sits on another sheet + × in a circle (the whole stack); the city dims; a swipe down on the head closes it. |
| THE ROW | `ui/components.js#row` (+ `ICONS`) | 56 pt glass, a neon LINE icon in its colour, the label (+ a small line), a value, a ›; `toggle` = the pink neon switch; `danger` = the red edge; `confirm` = the shared second tap. |
| THE MESSAGE | `ui/toast.js#toast(msg, kind, ms | { ms, sub })` | ONE at a time; ABOVE THE DOCK on the title / the room (read once per message from `.nd-actions`), under the corner buttons in a game; dark glass, a short neon tube on its left edge — CYAN info · GREEN done · AMBER heads-up · RED problem; a bold line + an optional second; an × (the only part that takes a tap — the bar lets taps through); sentence case (an ALL-CAPS caller is set in sentence case; names + codes typed as they are). |
- **ONE Esc** (review-6.md H11): `ui/layers.js` owns the only Escape listener; `takeLayer(el, { close, min })` — the top layer's own close.
  app.js, the old ☰ menu, dress, the full card, the album, the radio lost theirs (an input's own field keys stay: JOIN's box, the panel's search).
- **H2:** the streak card, the sighting moment, the album's photo, the `?preview=` shell + the radio desk on THE LAYER STACK (`min` keeps
  them over the end-of-round moment, 9000+; whatever opens from them lands on top). The sighting's flying photo is a corner chip, not a pop-up.
- **H1:** the save-your-key pop-up's covered list + the flying photo + the preview + THE SHEET's class.
- **H12:** /admin's + THE LAB's own toasts → THE MESSAGE.
- Every `.modal` builder moved onto THE SHEET: settings, HOW TO PLAY, CREDITS, a game's options, THE ROOM CHAT (its keyboard lift on the
  panel), BRING YOUR CARD, CALL IN A FAVOR, the game preview, THE GAMES, THE BOARD's report. The admin's CITY PREVIEW panel = a full-screen
  tool on the stack (not a bottom sheet).
- `tests/integration/shell-preview.html` — the four parts on a backdrop without Firebase (`?view=parts|menu|nested|msg|bright`).
- Refine passes on the parts: (1) the message bar see-through → solid; (2) the rows washed out over a bright day sky → solid glass;
  (3) the message caught taps meant for the buttons under it (the panel's chips) → only its × takes a tap.

## Group 2 — every screen on the one look (before → after)
| screen | before | after |
| --- | --- | --- |
| ☰ MENU | a drop-down glass panel of word buttons | THE SHEET of rows (shell-look.png): Your card (your name) · How to play · Settings · Sound effects (a switch — `settings.sfxOff`) · The Lab ("N need you" — the last count THE LAB saw) · Admin · CITY PREVIEW (+ CLEAR) · Leave room (red, second tap). In a game: CHAT (hidden while locked) + QUIT TO THE ROOM + END GAME. THE BOARD + CREDITS left the menu (the dock has BOARD; CREDITS in Settings). |
| SETTINGS | AUDIO // FEEDBACK + every game's controls + LEAVE / QUIT / HOW TO PLAY | SOUND · THIS PHONE · PRISM DROP · (the host's) CHAT · the hush word · ABOUT → Credits; toggles are rows; the hidden games' sections + the menu's rows gone. |
| CUSTOMIZE | a glass EDIT USERNAME bar, the colours as glossy balls, the gold CUSTOMIZE YOUR CARD plate | EDIT USERNAME is THE ROW (the user icon lit in your colour); the colours = NEON RINGS (every colour pick — `screens.css .swatch`); SAVE + CUSTOMIZE YOUR CARD = the tube main. |
| THE YOU PAGE + ACCOUNT | `.pf-gb` glass buttons, NEW KEY's own arming | USE THIS CARD ON ANOTHER DEVICE + RESTORE YOUR ACCOUNT are rows (RESTORE keeps the owner's cyan + key); COPY / SHARE quiet tubes; NEW KEY a small red tube with the shared confirm. |
| GUESTS + LOCK THE DOOR | glass LEAVE ("SURE? TAP AGAIN"), a glass lock row | LEAVE ROOM the danger tube (TAP AGAIN TO LEAVE); LOCK THE DOOR a switch row. |
| INVITE + the host card | a white SHARE INVITE plate | the tube main. |
| THE TITLE DOCK | icons only; a flame badge on YOU | BOARD · GAMES · YOU labels (the room dock's `.rdk-lbl`); the streak NUMBER in a small neon pill (`flame.js#streakPill` — amber lit, dim waiting, ice frozen). The member card's flame, the round-end line + the big streak card's flame stay. |
| HOW TO PLAY · CREDITS · a game's options · THE GAMES · a game's preview · the chat · BRING YOUR CARD · CALL IN A FAVOR · THE BOARD's report | `.modal > .sheet` builders, each its own head | THE SHEET (Group 1). |
| THE ROUND-END card | a gold foil CONTINUE | the tube main (the card keeps its gold). |
| the key pop-up | glass COPY / SHARE | tubes on THE SHEET. |
| /admin | gold + glass pills, its own "Sure? Tap again" + toast | small tubes, the shared confirm, THE MESSAGE. |
| THE LAB | its marks as flat chips, its own toast | APPROVE · FIX · CUT tubes (green / amber / red, unlit until marked); THE MESSAGE. |
| the radio desk | — | KEPT its own approved device look (CITY CONTROLS A — like the dock's rings); on the layer stack + the one Esc. |
| /board | — | its report on THE SHEET + tubes; its gold segmented tabs wait for BOARD 2.0. |
| messages (room closed, errors, the dead start, the host changes) | caps glass pills at the top | THE MESSAGE; the ones naming a player / a code written in sentence case at the source. |

## Group 3 — THE CARDS
- The full card's tier pill → the SAME tier gem the strips wear (`vault/gems.js`), 28 pt + its glow, in the TOP-RIGHT corner (`full.js#tierBadge`);
  the tier's name only where cards are picked (CUSTOMIZE, THE LAB) + in the card's screen-reader label. Every `.vl-tier` rule deleted.
- THE 1-OF-1 BADGE (the dev cards now; the gift cards in B): the animated rainbow gem in the corner, "1 OF 1" to its LEFT in the gem's own light
  (a spectrum on the letters + a dark edge under them — it reads on gold), bigger + brighter than the mock, the gem inset so its halo clears the
  rounded corner.
- **THE HERO-SPOT AUDIT → SHELL 2.0 B** (the brief's allowance; the gems never moved).

## Group 4 — THE PODIUM's FRAME + THE CHAT LOCK
- `ui/final.js#createFinal` = the CONSOLE's frame: the kicker + WINNER line, the BODY, the XP box (+ the end-of-round moment + the card
  reveal in their order), ONE button BACK TO THE ROOM (the tube main) right under the XP box (in view at 390: its top at 454 pt), the board
  after it. No REMATCH / lobby buttons (the vote + NEW GAME live in the room's dock). The host's tap brings the room back; a guest's walks them
  back alone (= ☰ QUIT TO THE ROOM).
- `finalScene(el, game, state)` (cartridge.js OPTIONAL): a game draws its own body inside the frame; without it the console's podium rise.
  PRISM DROP + OVERCLOCK (and the frozen ten) use the default today — OVERCLOCK's pass 2 brings its own.
- The winner line wraps whole (`.winner` clips only sideways).
- THE CHAT LOCK: while a game locks chat (`chatLocked`), the in-game chat button + the ☰ CHAT row are HIDDEN (not greyed); no unread dot.

## ADD-ON (the owner, from the live podium — the last work group)
1. **THE RESULTS ROWS = SLIM CARDS** (`ui/strip-board.js`): each player's equipped strip with the place number beside it and the score (+ its
   delta / arrow) in a pill over its top-right; the winner's strip on top; a game's note under it. Every results list (`leaderboard()` draws
   the plain row at once; the strips replace it). ONE shared effect surface for the list, every strip CALM; a strip row is no stacking context.
   Pulled from SHELL 2.0 B's "in-game slim cards".
2. **THE XP BOX:** the band · level stacked over "N XP TO n" on their own row under the bar, YOUR CARD at its end — nothing collides at
   390 / 402 / 430 (the fit test: LEVEL 14, LEGEND · LEVEL 99 → 662 XP TO 100, NEWCOMER · LEVEL 1).
3. **YOUR CARD:** a small tube on one line.

## Tests
- `tests/shell.test.mjs` (9): one sheet builder (no screen builds a `.modal`; the panel opaque), ONE Esc (no other Escape listener), one
  `.btn` block (no screen restyles the tube; the retired looks gone), THE MESSAGE (one at a time, above the dock, sentence case; no own toasts),
  the ☰ rows + their order (admin rows only via the server's yes), the dock's labels + pill, the gems, the podium's frame + finalScene, the
  strip board + the XP row.
- harbor `shell` (the `lobbyfix` job, 7 checks): the ☰ menu's rows + a solid sheet; HOW TO PLAY on SETTINGS → Esc closes the top only; ONE
  message above the dock, clear of the sign; the dock's labels; BACK TO THE ROOM under the XP box + in view at 390; the slim-card rows; the
  XP box fits at three widths.
- The older tests followed the new parts (the sheet's ‹ / × / panel, `.sh-msg`, case-insensitive message text, the menu's LEAVE ROOM last).

## Decisions
- **LEAVE ROOM is the ☰ menu's LAST row** (the approved shell-look.png) — LOBBY 2.0 B's "first row" add-on is superseded by the mock.
- **The tube's MAIN is pink in every theme** (a game's accent no longer colours the buttons).
- **Every bottom sheet still FLOATS** (THE VAULT 1B, the owner's iPhone) — the mock's attached sheet would hide its edge under Safari's bar.
- **In a game, messages sit under the corner buttons** (a game's controls own the bottom of the screen); above the dock everywhere else.
- **The radio desk keeps its approved device look**; THE BOARD's gold tabs wait for BOARD 2.0; the frozen games' own sheets (NEON PAR,
  SLIPSTREAM) keep `.modal` until each game comes back (the shell's `.modal` CSS stays for them).
- **The ☰ menu drops THE BOARD + CREDITS** (the dock's BOARD; CREDITS under Settings → ABOUT).
- **THE LAB's "N need you"** = the count THE LAB last showed on this device (no fetch on a menu open).

## Known issues
- **The mini PC's GPU path was absent today** (the TV off?): the vault group's six FULL LOBBY speed checks fail with "2D at tier 2, 0 draws" —
  the SAME on the pre-pass code (12a4c43, a worktree on :5174) and with GPU=1. The cloud skips that half. The strips' 60-fps cost on the
  podium (8 calm strips on one surface) is the guest list's known case, not re-measured here — the owner's iPhone bench.
- `e2e-prism.mjs` still drives the old lobby screen CITY 1.0 OUT retired (it fails at its first step on the code before this pass too) — the
  smoke test covers PRISM's start; its own E2E wants a rewrite onto the room in the city (PRISM DROP's pass).
- Moved to SHELL 2.0 B: THE HERO-SPOT AUDIT.
