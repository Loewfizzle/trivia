# The title — replaced designs

Kept for reference (how a piece used to work, why it changed). The current title is in `docs/title.md`.

## THE NEON RING — the dock (Oct 19, 2026; replaced by THE FLANK, Oct 20) — `title.js#buildActions`, `css/title.css` (end)
- **One floating bar** of smoked glass near the bottom (14 px from a phone's sides; centred, max 420 px wide on desktop), above the
  home indicator / Safari's toolbar (`max(safe-b + 6px, 20px)`): a blur of the city behind it (`.nd-bar-glass`, the sky's colour from
  `tintGlass`), a hairline catching the city's light along the top, a darker bottom edge, 26 px corners, a soft drop shadow on its
  own layer (`.nd-bar-shadow`). Five slots: JOIN · BOARD · [HOST] · GAMES · YOU (grid). Weather on the glass carries over (rain
  beads and runs, lightning's flicker: `.nd-bar.is-rain / .is-flash`).
- **Icons:** custom neon line icons (`ICON` in title.js), each drawn twice — the tube in its colour, glowing, and a thin white-hot
  core: JOIN a door (soft white), BOARD a trophy (gold), GAMES a 2×2 of rounded tiles (cyan), YOU the player's own emblem in their
  colour (`avatar()`; before a profile a neutral outline emblem). Labels in the tagline's type (8.5 px mono, wide tracking). Every
  slot is ≥ 44 px; a press is a soft pool of the icon's light and a small scale (Reduced effects: none).
- **HOST** (`.nd-hostbtn`, also `.nd-host` for the tests): a raised dark-glass disc (70 px) sitting in a cradle cut out of the
  bar's top edge (a mask on the glass + a rim), with a neon tube ring built like the logo's letters (glass tube, two glows, body,
  white-hot core, highlight, two mounting clips) and HOST inside. **Its colours come from the sign's own tubes**
  (`ringColors`: the computed glow / body / core of the four letters → `--hg1..4 --hb1..4 --hc1..4` on the button, re-read whenever
  `dressSign` changes the sign), so every holiday — and any added later — matches by itself; a multi-colour sign (Christmas,
  Halloween, Easter, the Fourth) makes the ring four tubes, N·E·O·N clockwise from the top, joined by electrode caps. The colours
  are registered (`@property`), so a change blends over 1.4 s. **Always lit:** off (glass) until the power-on, then it flickers on a
  beat behind the first N (`ringOn`) and never switches off; by day softer (`.is-daylit`: `--hk`), like a small OPEN sign. A barely
  noticeable breathing of its glow (`.nd-hglow`, in front of the glass so the blur never re-renders; Reduced effects: still).
  Its reflection on the wet street under the bar (`.nd-hrefl`, static: it's behind the glass). Busy (opening a room): the glow
  pulses faster. Same behaviour as before: a saved profile opens a room in one tap, else the name screen.
- **JOIN** opens a glass panel just above the bar ("ENTER THE HUSH WORD"; `.nd-actions.is-join`, a cyan light under JOIN): the
  four boxes over one real input (native keyboard, auto-caps, paste of a word or an invite link, auto-join on the 4th letter, any
  letter A–Z — digits and symbols don't type, inline errors: "No room behind MINT…", "The door's locked. Ask the host to let you
  in.", "Easy there — too many wrong words. Try again in 30 s." after five misses in a minute on one device). Since HUSH WORDS
  (Oct 19, 2026) the empty line reads "the 4-letter word on the host's screen"; an invite says "You're invited — the hush word is
  MINT. Tap › to join." Closes by JOIN again, a tap outside, a swipe down, Escape. With the iOS keyboard up the panel is pinned just
  above it (`fitKeyboard`: the visual viewport). The panel's glass is its own layer (`::before`; a blur on the panel itself rendered
  unevenly behind the animated caret). An invite link (`?room=`) opens it filled in, › ready, no keyboard.
- **Above the bar:** REJOIN [CODE] as a glass pill with a cyan light; notes (a room that couldn't open, an expired invite) as a
  pill that fades after a few seconds (tap to dismiss). The bar itself never moves. Each piece is rebuilt only when its own data
  changes (a button replaced between a touch-down and its click loses the click).
- **Power-on:** the bar and its tabs come up with the sign (`is-dock`); at rest it fades with the menu.
- **The icons are tubes of the same sign** (Oct 19): each answers a letter (JOIN·N, BOARD·E, GAMES·O, YOU·N) through `dockLight(i, on)`
  / `dockAll` — they stutter on a beat behind their letters in the power-on, go dark with them when the sign shuts off at dawn, re-light
  at dusk, and catch the sign's rare flicker (not letter taps). Since THE NEON COMES ALIVE: dark through the ramp, lit from the catch
  until the last letter dies in the morning. By day / unlit: empty glass tubes (a pale tube and a thin highlight,
  no glow; the YOU emblem desaturated); the labels never change. HOST follows the sign's timing but not its off state: softly lit by
  day, its brighten / soften eases over 2.4 s (`--hk`, registered).
- **Lowest quality tier:** `.nd-noblur` (the scene's `tier()` = 0): slightly more opaque glass, no blur.
- **Tests:** e2e-title.mjs "THE NEON RING" section, now THE FLANK (the layout, mirroring and gaps, targets ≥ 48 px and icon sizes,
  HOST's colours vs the sign incl. a blend and four holidays, JOIN white incl. a holiday, by day, both rings' intro flicker, the
  icons and corner buttons by night / day, the corner buttons back to normal in the lobby, Reduced effects, the JOIN panel).
  Test-only hook: `__district.dock` (`join`, `note`, `preview(state)`, `recolor`, `ring` (+ `join`), `icons` = [BOARD, GAMES,
  YOU, corners], `sunAt`).

