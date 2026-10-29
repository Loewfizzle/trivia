# WIN3 — THE SPIDERS RIGHT FOR HALLOWEEN, THE PANEL'S SCENE BUTTONS, THE BOSS'S TV ROOM, THE CASH COUNT, THE PARTY IN THE WINDOWS (Oct 26 2026; plan.md "OWNER'S NOTES — OCT 26 (after WIN2)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## WIN3 — THE SPIDERS RIGHT FOR HALLOWEEN, THE PANEL'S SCENE BUTTONS, THE BOSS'S TV ROOM, THE CASH COUNT, THE PARTY IN THE WINDOWS (Oct 26 2026; plan.md "OWNER'S NOTES — OCT 26 (after WIN2)"; behind `?city=2`)
The owner's WIN2 phone review (the second spider only on Halloween, the spiders walking BEHIND the SPEAKEASY tubes, the drop's legs stretched
down to the letters; the panel's window rows doing nothing; the cash count "almost unviewable"; the TV room with its viewers — and what the
room is really about) + his decisions (a build-up with two spiders from Oct 29, the dangle, the boss's room with NO PERSON, the quiet
nights, the party in the windows one room at a time) + a mid-pass add-on (the lamp post's jack-o'-lantern hidden behind the maple). Built
unattended by Fable, group by group, each pushed as it passed; the spiders went out first (Halloween is Sat Oct 31).

### 1. THE SPIDERS (Group 1 — `dress-halloween.js#createSpider`, `signdress.js`, `core/harbor-holiday.js`, `css/title.css`; `tests/spider.test.mjs`)
- **THE SECOND SPIDER BY DATE** (`halloweenPieces().spider2`, `SPIDER2_DAY` 29): part of the build-up — it arrives on the corner web Oct 29 (the
  web is ~0.7 spun by then), so the 30th + the 31st have two; the force (`&force=sign-web`) has both. (Before: the corner web's growth alone,
  which the owner read as "only on Halloween".)
- **ON TOP OF THE WORD**: the dressing canvas carries `z-index: 2` and `.nd-logo-wrap` `z-index: 1` (title.css) — the SPEAKEASY tube letters are
  positioned siblings later in the DOM and painted over the canvas before; a dim's opacity makes the wrap a stacking context, so the wrap is
  lifted too. The e2e proves it by HIT ORDER (pointer events switched on for the probe): the canvas is the topmost element at the spider's point.
- **THE DROP = A DANGLE** (`POSES` tuck / reach / stand / reel — each foot a FRACTION of its rest reach ALONG ITS OWN SECTOR, so legCheck holds;
  `dangle()` the body on its thread; `TRIP` drop 2.3 s · land 0.55 · climb 3.4): the legs GATHER into a tuck first (~0.45 s, the feet chased in
  the body's frame), it hangs BELOW the thread head-down, a gentle pendulum sway (the body tilted along the line) + a slow turn (the apparent
  width breathing 0.74–1: an edge-on view read as a dark stick at the sign's size), the spin settles + the front legs unfold a little as it
  touches the tubes FEET FIRST (`LAND_H` 11 above the line), then it settles the last bit turning to face along the word, the legs
  unfolding to the stance as it comes down (never the full stance in the air). THE CLIMB HOME the same in reverse: it lifts off turning
  head-up to face the hub, the legs gathered to the line, reels itself up it (the front legs hand over hand) with the slow turn, settles.
  The life's own drop (the web excursion) is the same dangle in small.
- **1b — THE JACK-O'-LANTERN ON THE FRONT STRIP** (the owner's add-on; `core/harbor-spots.js#corner-right`, `core/harbor-holidayprops.js#BIG_PIECES`):
  the lamp post's piece stood hidden behind the framing maple's canopy → the `corner-right` dressing spot is the FRONT STRIP's right end
  (z 37.4, x = the cart's rest − 2.5): nearer than any walker (the people's zMin is 38.75), left of the cart + the maple (the tree framing
  the group), above the dock + the HOST ring at 390 / 402 / 430 and at rest; Halloween's third big piece moves there, bigger (d 1.6, ~25 pt).
  Later holidays name the same id.

### 2. THE PANEL'S WINDOW ROWS (Group 2 — `core/harbor-remote.js#momentWhen`, `remote.js#forceOn`; `tests/integration/e2e-harbor.mjs` `panelrows`)
- **What was wrong** (measured with the real sheet by day, the owner's case): the rows DID fire — a day moment played by day in a window the live
  layer doesn't draw by day (PEEK AT THE STREET at 3 pm), and a night row's "tonight" jump is skipped whenever JUST ME already holds a time
  (a picked TIME chip, a custom time, PLAY ALL's clock) — the cash count then ran by day, invisible.
- **The fix**: a window row ALWAYS jumps JUST ME's clock to the moment's OWN hour (`momentWhen(id, day)`: a routine's `at` + 0.25, else the
  middle of its hours — the same hour PLAY ALL uses; the small hours on the next day; `window-party` the peak, 22:30), over any chosen time;
  the pill names it with the time ("JUST ME · COUNTING THE CASH · TUE 10/27 00:30"). The city follows through its crossfade (~5–8 s).
- **The check** (`panelrows`, its own group in the `holiday` cloud job): every row of SPEAKEASY → windows tapped IN THE REAL SHEET by day —
  20 of 20 (+ the party row) fire in one of their windows at an allowed hour, the pill naming them.

### 3. THE BOSS'S TV ROOM + THE CASH COUNT (Group 3 — `windows.js#tvRoom / tvDark / PAINT.cash`, `core/harbor-moments.js`, `speakeasy.js`, `scene.js`)
**THE TV ROOM — WHAT IT'S REALLY ABOUT** (the owner, personal): the blue glow of someone watching TV on a top floor at 3 am — you never saw
the person. **NO PERSON AT ALL — the mystery is the point.**
- The room DARK; the only light the unseen set's below the sill (front right), thrown UP onto the back wall + the ceiling (the upper band
  brighter than the sill's: the e2e measures ~117 vs ~27), through a HALF-DRAWN CURTAIN over the left fifth whose inner edge catches the
  light; the sill's foot in shadow. The couch, the faces, the cigarette + its wisps are gone (`&force=smoke` is a HAZE now, the row says so).
- **REAL TV FLICKER** (`core#tvLight(t, seed, { late })`): the cuts + jumps + colour shifts as before, plus LONG STEADY DIM STRETCHES (~1 slot
  in 5 holds 7–12 s low: a quiet scene) and, LATE (~1 am on), a CHANNEL-FLIPPING BURST now and then (a few seconds of cuts every 0.12 s). The
  unit test proves it irregular: the cut intervals' spread > 0.5 of their mean, no interval holding > 45 %, a burst only late; the e2e reads the
  light's own trace at 1 am (20 jumps in 9 s, the gaps' spread 1.13).
- **A SHADOW ACROSS THE GLOW** now and then (`core#tvShadow`: ~8–24 crossings an hour, each a smooth 2.4–3.2 s) — only ever a shadow.
- **EVERY NIGHT ~10 pm → 3 am** (roomState 'tv' as before; the click-off at 3 kept), the only cool-blue window among the warm rooms. **THE LORE**:
  on a RAID night the set snaps off as the siren starts (`scene.js` passes `raidS` = seconds since the siren cue at t0 − 5; `tvDead` for the
  night) and a shadow at the curtain's edge watches the street for a while (`tvDark`); it NEVER joins the window party (it isn't in
  `PARTY_ROOMS`); on Halloween / Christmas the glow takes a faint tint of the holiday film (`core#tvHolidayTint`).
- **THE QUIET NIGHTS** (`core#quietNight(key, { party, seed })`: ~1 in 6 over a year — 25 % of Sun–Wed, 12 % of Thursdays, never Fri / Sat
  nor a party night; `bedtimes(key)`: the back room, the jazz club, the bar + the two edge windows go to bed ONE BY ONE from ~00:20, every
  7–15 min in a seeded order, the last out by ~01:35; `bedLevel`: each lamp CLICKS off — off, a flash back, off for good — after a LAST SHADOW
  passes deep in the room; the lit layer × the bed level (speakeasy.js), no moments in a room gone to bed, the edge moods dark) until the
  boss's blue glow is the ONLY light on the building — the 3 a.m. feeling. The beds END at 3 am with the TV's click-off: the night goes on as
  every night after (the bar's last light, the edge lamps' floor — SP3's never-fully-dark rule kept). Quiet nights near Halloween: Oct 21, Oct 29.
- `harbor().speakeasy.life`: `tv` (the light drawn: k, tint, warm, burst, quiet, late, hol | off), `tvOff`, `quiet`, `bed`, `bedAt`, `raidS`.

**THE CASH COUNT — THE CLOSE-UP ONLY** (`PAINT.cash`): from the first frame the man — head, shoulders, hands — counting under the green banker's
lamp at the glass (the figure at 1.7, the waist low, the table's edge at the pane's foot); the table-wide opening, the loose heap and the bag
are gone. **NATURAL HANDS on a real rhythm** (a 24-s loop): the left hand holds the stack (thinning as he counts), the right thumb flicks the
top bill off onto the counted pile beside it every 0.46 s (the bill arcs over, the hand dips for the pick and rests on the pile), a LICK of
the thumb now and then (the head comes up to meet it), the pile SQUARED UP + tapped twice on the table, a BAND snapped on (stretched, then
tight), the banded brick slid aside (the night's take growing at the table's right); eased, never robotic; the lamp clicks off at the end.
`harbor().speakeasy.life.cash` = { el, phase (count / lick / square / band / aside), flicks, n, bricks } — the e2e sees every phase + ≥ 20
flicks in 20 s and the big figure at el < 1.5 s.

### 4. THE PARTY IN THE WINDOWS (Group 4 — `core/harbor-moments.js#windowParty / windowPartyAt`, `windows.js#partyRoom`, `scene.js`, `speakeasy.js`)
- **WHEN**: a party night's PEAK (`harborParty` 'peak': ~21:30 → 1 am — normal moments in the warm-up, the party after); forced from the page's
  start with `&force=window-party` (the panel row THE PARTY IN THE WINDOWS, a PLAY ALL item of 90 s at 22:30).
- **ONE ROOM AT A TIME** (`windowParty(key)`: a seeded order of the five rooms — the bar, the jazz club, the back room, the two edge windows —
  the first up at 1–4 s, then every 8–13 s, the whole building within ~60 s; each room its OWN colour from `PARTY_COLS` (magenta, cyan,
  violet, amber, green, coral), never two alike; `partyRoomK`: the blinds up over 1.6 s at its turn, DOWN in the same order over the last
  minute before the peak's end (`PARTY_DOWN` 60) — the first up is the first down). The boss's TV room never joins (not in `PARTY_ROOMS`).
- **THE ROOM** (`partyRoom(E, col, k, o)`): the colour flooding it (the box in its darks + a big glow pulsing on the beat), the crowd as
  DARK SILHOUETTES backlit by it (4 in the bar, 3 elsewhere — the kit's `col` figures with no lamp rim), JUMPING on the beat with their arms
  swinging (a third of them a half-beat late; the city's beat when the music plays — `scene.js` passes `PT.beatsF` + the punch — a 120 bpm
  of its own without), a few GLOW WANDS (the kit's `hold: 'wand'` with a bright stick + glow at the tip through `glints`), the BLIND sliding up
  as the room joins; the edge windows LIGHT ONLY (their own colour, no people). A party room is drawn whole (`full`): the baked room hidden,
  no other moment in it.
- **THE COLOUR ON THE COBBLES** (`speak.partySpill()` → `scene.js`): each full room's light pooled on the promenade in front of its window — a
  flat ellipse ('lighter', the room's colour, 2.8 units wide, 1.3 in front of the facade) giving the foreground the party's colour;
  `harbor().partyPools` = this frame's pools (CSS px) for the e2e (the wet street's reflection of them is left to 9b / 10 — see Decisions).
- **A RAID CUTS IT** (`windowPartyAt(…, raidS)`): as the siren starts the lights snap off, the dancers SCATTER to the sides and the blinds drop
  over 1.2 s (a 1.6-s tail from the last state), then the party is dead for the night (`partyDead`).

### Decisions made (the owner was on his phone — each the most reasonable reading; easy to reverse)
- The second spider's day is Oct 29 BY DATE (a constant, `SPIDER2_DAY`), not a growth threshold — the corner web is ~0.7 spun by then.
- The dangle's "slow spin" is the apparent width BREATHING (0.74 → 1 → 0.74 on a ~5-s turn), not a mirror flip through edge-on: at the sign's
  size an edge-on spider read as a dark stick (the first pass did that).
- The touch-down: the body hangs 11 units above the tubes when its gathered front feet reach them, then settles the rest turning to face
  along the word with the legs pose-locked (a reach → near-stance blend) — never the full stance in the air.
- The jack-o'-lantern's new spot sits LEFT OF THE CART (the cart's rest IS the space just left of the maple's grate at night) on the front
  strip, nearer than any walker; the tree frames the cart + the lantern together.
- A window row ALWAYS jumps to the moment's own hour, even over a time the owner picked (his rows "did nothing" because a picked time held
  the clock); ✕ beside the pill restores the real clock as before.
- The cash count's 24-s hand rhythm (a flick every 0.46 s, a lick at 7.4 s, the square-up + taps, the band, the brick aside) loops inside the
  26-s moment; the shadow at the door + the bag are gone with the opening.
- The quiet nights' beds END at 3 am with the TV's click-off (SP3's never-fully-dark rule + its 3:30 am check kept): the building is never
  fully dark — the "only light on" feeling runs ~01:35 → 3:00.
- The raid's TV-off is keyed to the siren cue (t0 − 5 s) and holds for the night; the watcher's shadow at the curtain shows for 150 s (the
  raid's blackout hides most of it — it reads at the siren and after the power returns).
- The window party runs the WHOLE peak (~21:30 → 1 am) every party night, replacing the normal moments in the rooms that are up (the owner's
  "exception to the one-star-window rule"); the edge windows join LIGHT ONLY in their own colour (their cycling party mood would have fought
  the room-by-room colours).
- The colour spill is a pool on the cobbles in front of each full window; the wet street's reflection of those pools is NOT done (the
  wetground module reflects the baked lights; a live coloured reflection is a 9b / Part 10 item).
- Groups 3 + 4 share `windows.js` and were proven by one run: one commit for both (the owner asked for a checkpoint per group; the window
  party's wiring landed before Group 3's e2e had passed).

### Tests
- Unit: `tests/spider.test.mjs` (the dangle: gathered first, the tightest reach, the turn, no leg stretched toward the letters while hanging, the
  landing, the climb head-up reeling), `tests/harbor-holiday.test.mjs` (the second spider by date + the corner web half spun), `tests/harbor-spots.test.mjs`
  (the corner piece on the front strip, clear of the walkers + the cart), `tests/harbor-remote.test.mjs` (`momentWhen` for every row, the party
  item), `tests/harbor-moments.test.mjs` (the flicker's statistics, the quiet stretches, the late burst, the shadow, the tint; the quiet nights
  + the bedtimes + the click; the window party's order / colours / shape / the raid's cut).
- E2E: `holiday` — the dangle + the landing, ON TOP by hit order, the climb home, Oct 28 one / Oct 29 two at 390 + 430 both tappable;
  `panelrows` (new, the holiday job) — every window row tapped in the real sheet by day; `windows` — the boss's room (nobody, the glow from
  below), the late flicker's statistics, the quiet night at 1:30 (every other pane < 30, the TV the only light), a normal night, the raid's
  TV cut, the cash close-up from the first frame + the hands' phases, the window party's staggered start + its colours + the crowd + the
  pools on the cobbles, a raid cutting it.

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against de1cbbb — the commit before the pass — 402×874, 2× CPU, the GPU, 2 + 2 windows of 5 s)
| scene | tier 2 A → B work mean ms | tier 0 A → B work mean ms | verdict |
| --- | --- | --- | --- |
| a party peak WITH the window party (np-party, Sat 23:00: five rooms up, the crowds on the beat, the pools) | 23.11 → 23.06 | 10.77 → 8.55 | **same** at tier 2 (−0.04 ms, noise ±1.39; the slow share +0.3 pts in ±2.9); **faster** at tier 0 (−2.21 ms, noise ±1.3) |
| a normal night (np-night, 21:30: the boss's room, the normal moments) | 11.56 → 12.68 | 5.96 → 4.99 | **same** both (+1.12 ms inside the noise ±6.89; −0.97 inside ±2.56) |
Not re-run (the one-round rule). The new per-frame work: the window party is five rooms drawn live at the peak (three with 3–4 silhouettes
each + their wands, two light-only) in place of the baked rooms + one star moment, plus three radial pools on the cobbles — within the
laptop's noise; the boss's room is three glows + a curtain where the viewers were two lit figures (cheaper); the cash close-up is one
figure + a few rects (as before); the quiet nights change nothing per frame (the lit layer re-bakes a step when a lamp clicks off); the
tier-0 gain is the removed viewers + the TV room's people pass. Both tier-2 windows at np-party threw their first window away (the
laptop's own tier step, A and B alike — the effects-first step of WIN2). The laptop is over its absolute budgets on both sides (a
warning; the owner's iPhone decides).

### Known issues (WIN3)
- **WebKit can't run here**: the spiders' dangle on real iOS, the boss's blue on an OLED, the party's colours on the cobbles — the owner's iPhone
  decides (the taps are proven on Chrome's touch emulation through the same pointerdown / pointerup path).
- **The dangling spider at 1×**: ~25 pt tall with the legs gathered — it reads as a dark spider on a line, not a stick, with the slow turn kept
  to a width breathing (an edge-on turn was a stick); a bigger spider would cover the letters it lands on.
- **The lantern on the front strip stands LEFT OF THE CART**, not between the cart and the tree (the cart's rest is that gap at night): the maple
  frames the cart + the lantern as a group.
- **The raid's watcher at the curtain** is mostly hidden by the raid's own blackout (the building's power is cut while the cars are there): it
  shows at the siren and again when the power returns.
- **The wet street does NOT reflect the party pools** (the wetground module reflects the baked lights): a 9b / Part 10 item.
- **The window party replaces the normal moments** in the rooms that are up for the whole peak (~21:30 → 1 am on party nights): the toast,
  the sax, the dance and the cash count show on party nights only in the warm-up or after — the owner's "exception to the one-star rule".
- **The quiet nights' dates** are seeded on the evening's date (`quiet|1924|key`): Oct 21 + Oct 29 2026 near Halloween (Thursday the 29th —
  the second spider's arrival night is a quiet one: the building goes to bed around the boss's glow with the spiders on the sign).
- **The e2e on a loaded laptop**: the windows group's trace probes run at ~6 fps when the suite shares the machine (the boss's-room probe takes
  ≥ 12 frames; the cash's phases need the full 20 s); the cloud's 2-core runner is the reference.
- **The cloud run** (40401060926, the `[harbor]` push — the pass's one run): `street`, `show`, `holiday`, `windows` (the new job), `audio`,
  `wild` green; `city` 107/108 — SP3's known clock-dependent "LOAD WEATHER — answered after 6 s" flake, not this pass's code (the same
  check in WIN2's two runs). Not re-run (the two-run rule); WIN2's two test fixes are proven by this run (`audio` + `street` green).
- **The windows cloud job** grew by ~2 min (the late flicker's 9-s read, the quiet night's two pages, the raid's cut, the party's 60-s stagger +
  the raid staged after it): `street` is the heaviest job now (`panelrows` went to `holiday`).

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&…`)
- **The spiders**: `&when=2026-10-29T21:00` (two, the second new on the last N) · `&when=2026-10-31T21:00` — tap either: it gathers its legs,
  dangles down swaying + turning, lands feet first ON the word, crawls, reels itself home.
- **The lantern on the front strip**: `&when=2026-10-27T21:00` (left of the chestnut cart; at rest too).
- **The boss's room**: `&when=2026-10-22T23:30` · late with the channel flipping `&when=2026-10-23T01:12` · **an "only light on" night**
  `&when=2026-10-22T01:30` (the night of Wed Oct 21; the next: Oct 29 → `&when=2026-10-30T01:30`) · the beds clicking off `&when=2026-10-22T00:25`.
- **The cash count**: `&when=2026-10-22T23:30&force=window&moment=cash` (or the panel row — the clock jumps to 00:30).
- **The party in the windows**: `&when=2026-10-24T23:00&force=window-party` (from its start: one room every ~10 s) · **a raid cutting it**
  `&when=2026-10-24T23:00&force=window-party,raid`.
- **PEEK AT THE STREET + CASH COUNT from the panel**: the TEST pill → SPEAKEASY → the rows (the pill names the moment + its time).

### Handoff → 11a-2 THANKSGIVING (+ the parade system)
- THE GROK SOUNDS are waiting in `~/Downloads/city-sfx` (geese-v, parade-crowd + parade-cheer, marching-band-far — public domain only —,
  leaves-rake, balloon-flap; credits.txt "Thanksgiving + parade sounds"): `scripts/add-city-sfx.py` imports them (docs/audio.md#the-city-sounds).
- A holiday's TV tint: one line in `core/harbor-moments.js#tvHolidayTint` (Christmas is in).
- The window party's palette on a holiday: `windowParty` takes `PARTY_COLS` — a holiday's set is a parameter away (`ctx.cols`).
- The dressing spots: Thanksgiving's bales + cornstalks name `corner-right` (the front strip now), `bench-right`, `hydrant`, `lamp-1`.
- The quiet nights / the window party / the raid's TV cut all key on the NIGHT's date (`nightKey`): the parade's evening reads the same key.
