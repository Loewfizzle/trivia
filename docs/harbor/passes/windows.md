# WINDOWS — Nov 1 2026 (night)

The pass the owner wrote at ~9:10 pm (plan.md "OWNER'S NOTES — NOV 1 (night)"): Group 0's quick changes (the quiet default flip, two games
playable, the five signs, the small fixes) + THE NEW WINDOW SCENES as rows in THE CITY TIMETABLE. One session, the groups in order, each
committed + pushed (no tag); the final push carries the harbor tag.

## What changed

### Group 0 — the default flip, two games, the five signs, the small fixes
- **THE QUIET DEFAULT FLIP** (`core/city.js`, `screens/title.js`, `identity.js`): the plain address shows CITY 2.0; `?city=2` still works (every
  older link + test); `?city=1` = City 1.0, kept in the code, UNTESTED from now on (the switch-over deletes it). The Harbor suite's City 1.0
  checks became City 2.0 ones (core: "no flag = the Harbor"; music: City 1.0's decks dropped; the "default city never subscribes" check gone —
  every visitor now follows the EVERYONE preview through the cached `GET /api/admin?live=1`, as City 2.0 visitors already did).
- **ONLY PRISM DROP + OVERCLOCK PLAYABLE** (`config.js` GAMES[].playable — the one switch; `isPlayable`): the lobby's picker, HOW TO PLAY (+ the
  match on screen's own tab), the title's games sheet list the two; `host.js#startGame` refuses a hidden game before anything is written (a
  rematch, an invite, a stale link all go through it). The ten: code, data, rules FROZEN. The smoke test starts the two + proves none of the ten
  can start; `e2e-presence` + `e2e-conn` (the cloud's tests job) now play OVERCLOCK (the presence's "the question waits for BOB" check writes
  the other two players' public "done" flags as the admin).
- **THE FIVE SIGNS** (GAMES[].sign): OVERCLOCK, PRISM DROP, NEON PAR, HIGH STAKES, GRIDLOCK on every sign (the roof signs, the blade, the
  billboard, the speakeasy's weekly ghost ad); a tap on a next-on-deck sign = a quiet `NEON PAR · COMING SOON`. With five names the slot rule
  hangs PRISM on the blade (the only one-word name ≤ 6), NEON PAR + HIGH STAKES on the roof signs, OVERCLOCK / GRIDLOCK on the billboard on
  alternate nights. The title's sub line drops its count under four games ("PARTY GAMES · ONE PHONE EACH").
- **THE FINALE's LAST ORDER** (`core/harbor-fireworks.js#partyScript`): the dragon-egg salvo FIRST (one burst, 4.5 s before the curtain), then the
  GOLD WILLOW CURTAIN LAST, then the end; `syncToBeat` may only move the curtain to a phrase that keeps it ≥ 2.5 s after the eggs (a test over
  16 grids).
- **THE MENACING SKULL** (`balloons.js` 'skull'): a BLACK envelope, a hard angular bone-white skull on its face — a round cranium, cheekbones +
  jaw cut straight (the black in the notches), deep ANGLED sockets whose tops slope down to the nose under a heavy brow shadow, a sharp
  triangular nose, a clenched row of teeth; at night the envelope stays black and only the bone glows warm (drawn like the ₿s all night).
- **BALLOONS IN FRONT OF THE HIGH CLOUDS** (`clouds.js` 'high' / 'low' parts, `scene.js`): while a balloon flight is up the clouds draw in two
  passes — the veil + cirrus + alto, then the balloons, then the low heaps + the moon's light.
- **THE TWO CLOUD FLAKES**: (1) the first close thunder after the tap — no take decoded yet → the decode starts at once and the STRIKE WAITS
  for it (`THUNDER_DECODE` 1.1 s more on its flash; the crack still lands on the flash + its distance); (2) partysync's −104 ms: the check read
  the render clock against the server clock, and the synced player only re-places a song past 120 ms (twice a second) — the check now uses
  that window (`core/sync-math.js#RESYNC_S`, the player's own constant).

### Group 1 — the window scenes' system
- **THE TIMETABLE ROWS** (`core/harbor-schedule.js`): `scene.juggler`, `scene.crate`, `scene.charleston` (fixed slots: window, hours, nights,
  p, glow), `scene.bookie` (`rotate: true`: p 0.6, Sun–Thu, three slots), `windows.shades` (the lights out 2 → 4 am, ≥ 15 min apart, the
  colour's crossfade), `windows.old` (the retired scenes' switch, off) + their conflicts. `core/harbor-scenes.js` reads them (PURE).
- **THE LAYOUT** (the owner's): top middle the boxer (as is), top right the boss (as is), BOTTOM RIGHT the juggler 6:30–9:30 → his amber
  shade 9:30–9:45 → the crate guy 9:45–midnight, BOTTOM MIDDLE the Charleston 7–10, the bookie rotating into a free slot.
- **RETIRED** (`core/harbor-moments.js#RETIRED`, switched off with `ctx.retire`): the bartender + the bar's room, the toast, the sax (+ the
  jazz room's player), the dancing couple, the tango, the peek, the cash count, the card game, every holiday window scene. KEPT: the wake, the
  shop, the boss's TV + his night, the cat, the fan, the eyes, the mirror door, the edge moods, the party in the windows. `&force=old-windows`
  (the panel's THE OLD WINDOW SCENES) brings them back with the old quiet building.
- **AFTER HOURS**: a scene room at night with no scene in it keeps its SHADE DOWN, glowing through in the room's colour (amber, a cold white
  whose glow SWAYS, green, rosy — `roomColour`, blending to the next scene's over its last minute), its LIGHT OUT one window at a time 2–4 am
  (`shadesNight` + `shadeLevel`: the click), a quiet night's earlier bedtimes as before; the shade eases down at dusk, up at dawn; a raid drops
  them over a frozen last frame; a forced moment / the forced window party preview takes the rooms.
- **THE WINDOW PARTY**: a scene room joins only after its last scene overlapping the peak (`sceneFreeFrom`): the bottom middle from 10, the
  bottom right from midnight; the bookie never comes on a party night.
- **THE OWNER's ADD-ON — THE EDGE WINDOWS' SHADES** (`edgeShadePlan` / `edgeShadeAt`, windows.js): the same cloth (`cycleBlind`: the linen, the
  hem bar, the ring pull, the light through it), at tonight's seeded height, raised / lowered now + then by an eased 3.2-s pull, all the way down
  after hours (a seeded minute 0:00–1:15), glowing in the mood's colour (the TV's flicker carried through), the mood's moving shadows ghosting
  on the cloth, in the one-at-a-time lights-out (five windows now).

### Groups 2–5 — the scenes (each its pure routine `core/harbor-<id>.js` + its painter; the shared kit `screens/harbor/scene-kit.js`)
- **THE JUGGLER**: a 3-hour seeded plan of segments (slow starts, cascades, the half-shower, fast runs, under the leg, THE HIGH THROW, THE SPIN,
  pauses, ~30 drops a night + the fetch + a slow restart, ~5 rests on the stool — sits, wipes his brow, drinks); the balls' exact parabolas between
  his hands' scoop (the worst move in a frame = a fast throw in flight); ONE amber lamp on a side table at the arcs' apex height; the balls
  glossy red + cream (lit by their distance to the lamp); party nights NEON on the beat, lighting the room; in from the doorway at the back
  (deep → near), the bag set down, the balls out; out: the flourish, the bag packed, to the glass, the pull. Sound: the drops only (Grok's set).
- **THE CRATE GUY**: the carries every ~8–10 min (the pile 1 → 11 crates in three columns, the back one to head height), between them the
  crowbar (two heaves, the lid off) + ONE bottle held up against the bulb, wipe, listen at the window, lean on the pile, count, a rare swig; ONE
  BARE BULB, cold white, swinging always a little + bumped by every crate set down (the clink heard), his + the crates' shadows on the wall
  swaying with it; backs in with the first crate; out: sits on his pile, the cigarette's ember flaring three times, the pull.
- **THE CHARLESTON**: a rehearsal on a ~200-bpm count (the basic with its twist + kicks, big kicks, crossing knees, swinging arms, a breather +
  fanning, her strap, the combination missed → a breath → nailed with a ta-da, the laughing chair); LIT: a teal fringe dress (three fringe tiers
  swinging with the twist + the kicks), skin in the rosy lamp's light (brighter on its side), a black bob + a gold band; the rosy fringed
  lamp, the plum chair, the phonograph's brass horn; in: the needle down, the heels kicked off; out: the chair, the fan, the pull.
- **THE BOOKIE**: writing, counting, the candlestick phone (the receiver at his ear), pacing with it, the cigar's ember + its smoke curling in the
  beam, leaning back; the RARE bad call (~1–3 a night: the slam, the hat thrown on the floor, the beat, picked up, hung back); the green-shaded
  lamp pooling on the desk, his face lit from below; in through the dark — the lamp clicked on is his entrance; out: the cash bag, hat on, the
  pull (the lamp left burning green behind the shade).
- **THE PANEL**: THE SCENES rows (THE JUGGLER, THE CRATE GUY, THE CHARLESTON, THE BOOKIE — MINUTES IN 0 = the entrance … THE END = the exit 8 s
  after) + THE BOOKIE · HAT THROW (the bad call on a loop) + THE OLD WINDOW SCENES (tools).

## The numbers
- **`title-perf.mjs --ab`** (the mini PC, 4× CPU, software compositing, 402×874; A = 48d0f94 before the pass, B = this pass): THE EVENING with
  the juggler + the Charleston + the boxer at once (`np-windows`, Wed 8:15 pm): tier 2 the same (−3.5 ms, noise ±14); tier 0 +2.5 ms of work
  (20.8 → 23.3, noise ±1.8 — the four rooms' painters + their crisp copies; the dancer's gradients cut to three a frame after it). THE PARTY NIGHT
  with the neon balls (`np-wparty`, Fri 9:05 pm): tier 0 the same (−4.6, noise ±6.6); tier 2 invalid at 4× (a party night steps itself down from
  tier 2 at 4× without a GPU — the documented case). The owner's `&bench=1` on the iPhone decides.
- **The local runs** (the mini PC, before the final push): unit 983 · rules 55 · /api 27 · smoke 6/6 (≈ 29 s) · presence 12/12 · CONN 20/20 ·
  THE FULL HARBOR SUITE 795/802 (19.2 min) → fixed: the forced window-party preview (the "join after the scenes" rule must not apply to it),
  the old bar's depth check (its `old-windows` flag had landed on the wrong test), the billboard check (it asked for a hidden game), the
  battery's still night (3:20 am now — the crate guy works till midnight), a QUIET night (the bookie now stays home: the TV the only light) →
  the touched groups green, except PERF's "A CALM LOAD STEPS NOTHING" (2× CPU, Thu 9:30 pm): it fails the same way on the commit BEFORE this
  pass on this machine tonight (A 48d0f94: steps at 24.9 s, work 24.2 ms · B: at 26.8–29 s, work 22.9–26.9 ms — the headless frames pinned at
  ~20 fps either way) — the known machine-timing check, left as it was for the cloud to judge. The still rooms are CACHED now
  (scene-kit.js#cached: one canvas per room + scale): the busy evening's work 29.9 → 26.9 ms at 2×.

## Decisions
- **The edge windows' shades go down after hours at a seeded minute between midnight and 1:15** (not at their mood's own lights-out minute):
  they join the patchwork first, then the one-at-a-time lights-out like the scene rooms.
- **The dancer's colours**: teal dress + gold band on the rosy room (the brightest contrast at 40 pt); the owner may want another dress colour.
- **Grok's alternates (SB011, the Mixkit thud) + two of his picks are NOT shipped** — the seven drop takes + three thuds were enough, so only the
  four shipped CC0 files are credited.
- **The bookie's slots** (when he comes, Sun–Thu ~3 in 5): the bottom middle 10:15 pm → 1:30, the top middle 11:15 → 2, the bottom right 12:15 →
  2:30 — the first free one from a seeded start; the owner can retune them in the row.

## Known issues
- See harbor.md KNOWN ISSUES (the scenes on the phone; the juggler's hand-off at the glass).
- `../trivia-ab` (a plain copy from an earlier pass, not a git worktree) was left as it was; this pass's A/B used `../trivia-ab-windows`.

## Hand-off → SCHED
The window scenes are the first new timed system born on the timetable (rows + a pure reader). SCHED moves the older ones (the sky events,
the legends, the workers, the boats, the traffic, the moments' own catalogue) onto it the same way.
