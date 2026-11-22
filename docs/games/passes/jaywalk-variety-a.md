# JAYWALK VARIETY A — THE LEAF PILE · THE TIERS · THE DAY LOOK · TIMES OF DAY · THE FOG CHECK (Nov 22 2026)

The owner's prompt (Nov 22); his decisions: `docs/games/plan.md` "JAYWALK VARIETY A" (Step 0); as built: `docs/jaywalk.md` "VARIETY A".
**A VIEW only — no rules change** (nothing in `database.rules.json` moved; `game.lk` rides the host's own `game` write). Gameplay, course rules
(v1 + v2 frozen), traffic, the lane props' count + places, the replay + the proof: untouched (`tests/jaywalk-variety-a.test.mjs` THE GAMEPLAY LOCK).
The inbox: no open entry for JAYWALK at the start, after each group, before the final run. THE CARD LAB: `lab-export` read — no open FIX mark.

## GROUP 1 — THE LEAF PILE
Polyfork's **Raked Leaf Pile** (CC BY 4.0, 609 tris) through `build-jaywalk-assets.py --only=autumn` → `assets/jaywalk/autumn/leaf-pile.glb`
**33.2 KB** (its two meshes one; the linear vertex colours → sRGB bytes, **red ×1.55 · green ×1.42 + a warm floor** — as delivered it read dark
beside the autumn trees). In THE SEASONAL PACK (fetched only on an autumn day); JT1's code-built mound retired; the burst, the scattered pile + the
crunch kept. Credited: ☰ → Credits (JAYWALK — its own CC BY line), `assets/jaywalk/autumn/CREDITS.md`, `models/CREDITS.md`. Size on the lane
`PILE.s` 0.92 · `h` 0.72 (≈ a cell). Shots: `Downloads\NEON\jaywalk-variety-a\pile\` (night + day, 390, the pile beside the kid + a close-up + the burst).

## GROUP 2 — THE TIERS
`daylook.js#CALLS_MAX` = [64, 64, 96] — ONE table: `jaywalk-lab.mjs --perf` (now with tier 0 too), `--j2perf` / `--j4perf` / `--jt1perf`, the boom
check read it. The new pieces are tier-aware: the sun's depth pass is tier 2 only; everything else costs no draw call (the ground's one shader,
the instanced blobs).

## GROUPS 3 + 4 — THE DAY LOOK + THE TIMES OF DAY
As built: `docs/jaywalk.md` "THE DAY LOOK" + "THE TIMES OF DAY". Shots: `day\` (before / after at noon, tiers 2 · 1 · 0, + crops `ba-kid`
`ba-road` `ba-grass` `ba-far`) · `tod\sheet-390.png` (before · sunrise · noon · golden · sunset · night · overcast). **Calls (overrule any):**
1. **THE BANDS**: sunrise = a morning under +6° · golden = an evening +10° … +2° · sunset = under +2° to the city's night (≈ −9°).
2. **THE PLACE**: the phone's zone place (the city's own `placeOf` — what AUTO's day / night already uses), not a fixed 43° N — so JAYWALK's AUTO
   turns night exactly when the console does, on every phone.
3. **THE SHADOWS' DIRECTION**: one direction for every time of day (the shadows fall to the right, as the day look's always did); only their
   LENGTH follows the sun (golden + sunset long). The band's painted sky has no sun to match.
4. **THE SUN's SHADOWS** are a real depth pass on tier 2 (the kid + the rivals cast none there — the depth pass can't follow their skinning;
   their contact shadows stay); tiers 1 / 0 keep H5C's cheap offset blob as their sun shadow (no regression).
5. **SUNRISE's lights at half** = the lamps' lenses + small faint halos only; sunset's beams + pools are paint (normal blending) at the ramp's strength.
6. **THE NEON by time** = the gates' neon (the night's bars on the posts) by the city's neon ramp; the areas' lamps once the lamps ramp ≥ 0.5.
7. **OVERCAST** keeps the dew on a grey sunrise; no cloud shadows on a grey day; at sunset a grey-violet sky.
8. **THE MATCH STAMP** = `game.lk = { e, m, n }` (the host's sun at its start) — the host's own write, no new rule; an old phone ignores it.

## GROUP 5 — THE FOG CHECK
Every time of day + overcast × summer · autumn · winter (none / light / heavy snow) + night: **the white fog vanished only over the snow by day**
→ dark grey there (ground, billows, wisps, curtain, lip + the screen's foot). Everywhere else unchanged; night unchanged; never thinned.
The sheet: `fog\sheet-390.png` (CHANGED marked in gold).

## GROUP 6 — THE FINAL RUN
(filled below)

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. The calls above (the bands, the place, one shadow direction, the kids cast no depth shadow, the neon = the gates', overcast's dew, the stamp).
