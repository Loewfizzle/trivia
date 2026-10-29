# NEON PASS 6 — NIGHT TOUCH-UPS (Oct 22 2026; the owner's iPhone review of Neon Pass 5; night + party nights only)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## NEON PASS 6 — NIGHT TOUCH-UPS (Oct 22 2026; the owner's iPhone review of Neon Pass 5; night + party nights only)
The owner on Neon Pass 5: "it looks stunning, beautiful, I love the way it looks" — this pass is the careful clean-up of what she
found on her phone, plus her add-ons during the pass. Everything behind `?city=2` (the 10 s rest timer: both cities).

### 1. The touch-ups, as built
- **THE RACING FLOWS** (her phone: the lights "almost stop between pulses and jitter"): the party racers' SPEED came from the beat
  phase (`y + 0.12·sin 2πy` — down to a quarter speed between the strong beats) and followed every wobble of the beat clock. Now the
  speed comes from the TEMPO alone (one spacing a bar × the building's own pace, eased toward a new song's tempo over ~1 s),
  integrated with the frame's own dt (Low Power Mode's 30 Hz moves the same distance a second); THE BEAT drives only the light (the
  punch: brighter, a longer tail, a bigger head — the head stays put, the tail grows behind it). No reversals any more (a reversal is a
  stop): each building keeps its direction all night (`core/harbor-show.js`). E2E "THE RACING FLOWS": ~59 pt/s, steady through the
  beats. **The beat clock on iOS** (`audio/beat.js`): an `<audio>` element's `currentTime` can move in coarse steps there — the song's
  position is carried forward on the frame clock between its steps (`dequantize`), so the beat never jerks back and forth with them.
- **THE BEAT READOUT SAYS WHY** (her readout said "beat calm" at a party): `&debug=1` shows `beat calm — music off` / `— muted` /
  `— tap for sound` (audio still locked) / `— classic music` / `— songs loading` / `— no song`; with a song, `· kick unheard` when the
  AnalyserNode hears nothing (Safari's media routing) — the grid still locks then. "calm" with the music off is right.
- **THE SKY BEAMS — kept exactly as Neon Pass 5** (the owner loved them; a soft-volumetric rebuild was tried and reverted on her
  word). Two fixes only: the beam's BOTTOM no longer ends on a sharp horizontal line — its last 16 pt come from a FOOT sprite (the
  beam's bottom row fading out downward, smoothstep) that melts into the crown (`skybeams.js#footFor`); and the far-right beam (under
  the music + menu buttons) rises to the top like the others, BEHIND the buttons (the canvas is under the page: they stay on top and
  tappable) — checked at 390 / 402 / 430.
- **THE WHEEL'S GLOW HUGS THE RIM** (was "too much of a ring"): the stacked flat-alpha strokes (hard-edged bands out to ±0.13 r) and the
  haze sprite (linear stops out to 1.5 r) are one smooth curve now — `wheel.js#rimGlow`: a radial gradient peaking AT the bulbs,
  falling fast inside, a little slower outside, gone ~0.1 r out (the haze ~0.3 r, drawn at 1.3 r); the fine bright rim line stays.
- **THE BLOCKS BEHIND THE WHEEL** (a dark blob at phone size): lifted to a dusky violet-blue at night, each its own tone
  (`blocks.js#wheelBackdrop`, five tones), a fine RIM LIGHT of city glow along every roofline + setback (each tier draws its own top),
  ~1 window in 12 warm-lit on the light timeline (`lights.js`), and rooftop SILHOUETTES over the rim — a wooden water tank, an
  antenna, a shed (one or two a roof), their tops catching the rim light. Still no neon or signs behind the wheel.
- **THE TINY FLOATING ICONS ARE GONE** (the owner: "distracting"): all six icon spots (`i-par`, `i-par2`, `i-left`, `i-c1`, `i-r1`,
  `i-r2`). A phone hangs 4 NAMED signs (the three stacked roof signs + the blade) and THE BILLBOARD a fifth game (a game with no sign
  tonight: `core/harbor-neon.js#billboardPick`, pure now); the nightly shuffle rotates them — tested: over 120 nights every game shows
  (the 5 long names — RUMRUNNER, GRIDLOCK, SLIPSTREAM, OVERCLOCK, NEON PAR — only ever on the billboard; the 7 short ones on both).
  The waterfront strip's shop shapes at the water's edge stay. Nothing cycles its colour on a normal night any more (that was an icon).
- **THE LIGHTHOUSE'S CALM ZONE** (pink trims read as floating rectangles crowding it): the buildings right behind it (±30 pt round
  the tower, deeper than it) keep only a quiet white roofline, dimmer (`strength: farband`) — no outline boxes, bands or fins; that
  was mostly PAR's own pink frame. The heroes + word towers rise clear above it and keep their neon.
- **NEON THAT TRACES THE 3D BUILDING**: every building with a visible side face (left of the camera: its right face; right: its left)
  traces it — the side's top edge back from the front corner (the roofline across both faces) + its far vertical edge down (to the foot,
  or to where the tier below hides it); towers per tier group, the bands' outlines + their rooflines too (`harbor-neon.js#sideFace`,
  `#sideFloor`: a neighbour just in front of the side face hides its lower part; < 1.6 pt wide: not traced). Joins the racing paths.
- **LEDGE BANDS ON THE LEDGES**: every horizontal band snaps to a real FLOOR LINE of the building's window grid — the spandrel between
  two rows of windows (`floorY`), or its cornice — and every fin to a PIER between two columns (`pierX`); two that land on the same
  line become one. Never across glass.
- **THE NEON LOGO RACES** (party nights, every ~40–70 s on a bar line) **+ AT THE CATCH + ON A RE-IGNITE** (the owner's add-on: the
  catch at dusk and a tapped letter re-igniting at night — riding on top: the catch's timing, the power-on sound and the hum fade
  untouched): a bright surge runs N → E → O → N along the real tubes and through the blacked-out connectors between them (dim there:
  behind the painted tube), each letter BLAZING fully on as it passes, then a quick sweep across SPEAKEASY letter by letter. Built for
  the compositor (`ui/logo.js#logoRaceSvg`, `title.js#raceLogo`): one small svg per letter holding its blaze (blurred once, faded by
  the svg's opacity), a head + a 14-dot comet tail of gradient circles (no filter) moved by transform along `logoTrack()`, nine glow
  spans over SPEAKEASY (opacity). Nothing runs between races. Reduced effects / motion: none. Preview: `&force=race` (every 6 s).
  E2E "THE NEON LOGO RACES"; the catch checked on the boot link (`&speed=20`: the surge ~0.2 s after the catch), a tap at night too.
- **THE LIGHTHOUSE ON PARTY NIGHTS**: the beam brighter (+60 %) and a little wider (+32 %), the lantern +30 %; 4 bars in every 16 it
  picks up the party colour (the right word tower's palette colour, eased in + out, 85 % mixed).
- **THE CROWNS UNDER THE RIGHT-HAND ROOF SIGNS** (the owner's add-on: "a dark, empty chunk between the neon and the sign"): a real bug —
  while a re-layout's new set of signs + outlines was being built, the old set kept drawing, and `neon.js#solidRects` cut the OLD
  signs' cabinets out of the NEW outlines' sprites. A phone's safe areas re-lay the city once after the first paint (the signs move
  ~20 pt), so on her iPhone the crown's tube under SIGNAL / BLUFF / CIPHER / STAKES was cut away (party nights rebuild the sprites
  later — that's why the party showed it). An item of the set being built now takes ITS signs. + the roof sign SPILLS a soft glow of
  its colour down over its steel frame onto the roof steps (`neon.js#spillSprite`, one cached sprite a sign), so the frame reads as
  structure; the top floors keep their lit windows.
- **THE SCREEN AT REST: 10 s** (was 15) before the menu, the tagline and the corner buttons fade — both cities (`title.js#IDLE_MS`,
  docs/title.md); the fade and tap-to-return unchanged.

### Previews (THE PREVIEW PANEL lists the existing ones)
`&force=race` (the logo race every 6 s), PARTY ON (the lighthouse's party beam, the racing), `&debug=1` (the beat's reason).

### Performance (A-B-B-A against eff24bd, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame, means of two runs)
| scene | tier 2 | tier 1 | tier 0 |
| --- | --- | --- | --- |
| `np-night` | 9.17 → **7.85** | 7.06 → **6.57** | 4.32 → **4.15** |
| `np-party` (Sat 23:00) | 26.9 → **21.8 / 12.6** (stepping) | stepped to t0 in both | 5.23 → **5.21** |
The re-measure of the party alone: t2 A 21.8 / (stepped) → B 26.8 / 29.4 (~+25 % in that round; the baseline itself dropped to tier
0 once), t0 5.0 → 5.0. Reported, not chased (the brief): the new costs are small and mostly baked (the backdrop, the outlines' side
tubes, a foot + a spill sprite a beam / sign, the lighthouse's wider fans); **the owner's iPhone decides** (`&debug=1`, after 10–15 s).

### Known issues (NEON PASS 6)
- **WebKit still not run here**: `npx playwright install webkit` downloads webkit-2083 and then leaves nothing installed (a third
  time) — the owner's iPhone: the links below.
- **The E2E's PERF check fails on the bench** (as in Neon Passes 4 + 5), and the perf group then hits a puppeteer "Promise was
  collected" protocol error — the same on the baseline (eff24bd) on this loaded laptop: not this pass's.
- The beat on her iPhone was checked from the code (the readout now says why it's calm); "kick unheard" with a song playing would mean
  Safari's media element isn't reaching the analyser — the grid still locks.
- The rooftop silhouettes behind the wheel are small at phone size (~4–6 pt; their roofs sit near the wheel's top rim) — they read
  as texture on the skyline more than as objects.
- A side face narrower than 1.6 pt isn't traced (near the middle of the screen the side faces vanish in the perspective).
- The lighthouse's own neon wears the party palette on party nights (as in Neon Pass 5).

### Handoff → THE DAY PASS
The night is done for now. For the Day Pass: the stacked roof signs + the blade + the billboard are the only signs (no icon faces to
paint), the side-face tubes + the backdrop behind the wheel are night-only (`T.night`), the logo race needs the sign steady + lit (never
by day). Preview links (`?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`): a normal night `2026-10-22T22:00`, the party
`2026-10-24T21:00` / `T23:00`, the boot-up + the catch's race `2026-10-19T18:20&speed=20`, the logo race any night `&force=race`.
