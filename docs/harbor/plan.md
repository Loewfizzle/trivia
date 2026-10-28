# CITY 2.0 — THE MASTER PLAN (the owner's decisions, every part)

**READ-ONLY REFERENCE. Build ONLY what your part's prompt asks.** This file is the big picture so each part leaves room for
what comes later and never contradicts it. If your prompt and this file disagree, the prompt wins — then tell the owner.
The rules (size rules, hero pieces, the floor-not-ceiling reference, budgets) live in `docs/harbor.md`; this file is the WHAT.

## The build order (model · estimate)
| # | prompt | model | estimate |
| --- | --- | --- | --- |
| 1 | foundation + blockout ✅ | Opus 5.5 medium | done |
| — | Fable read-only review ✅ | Fable | done |
| 1.5 | foundation fixes ✅ | Opus 5.5 medium | done |
| 2 | skyline ✅ | Opus 5.5 high | done |
| 3 | neon + signs + billboards + the NEON logo ✅ | Opus 5.5 high | done |
| 4 | water ✅ | Opus 5.5 medium | done |
| C1 | cleanup pass 1 ✅ | Opus 5.5 medium | done |
| 5 | harbor hero pieces ✅ | Opus 5.5 high | done |
| 6a | the everyday sky ✅ | Opus 5.5 high | done |
| N2 | Neon Pass 2 (clean tubes, midsection + waterfront, drone colours, real neon sounds) ✅ | Opus 5.5 high | done |
| N3 | Neon Pass 3 — the wow pass (neon on every building, depth, lighthouse, party show v1) ✅ | Opus 5.5 high | done |
| — | RUMRUNNER: Mr. Vale → Mr. Balboni ✅ | Sonnet 5.5 medium | done |
| P | the PREVIEW PANEL (JUST ME / EVERYONE ON CITY 2) ✅ | Opus 5.5 high | done |
| N4 | Neon Pass 4 — the neon in motion (racing party lights, the hard beat, sky beams, string lights, the wheel, fixes) ✅ | Opus 5.5 high | done |
| N5 | Neon Pass 5 — Safari (WebKit) fix + testing, the real beat, party colours, the wheel showpiece, sign sizes, faster tests, panel fixes ✅ | Opus 5.5 high | done |
| N6 | Neon Pass 6 — night touch-ups (flowing racing, soft beams, the wheel's glow + its backdrop, 3D outlines, ledge bands, icons removed, the lighthouse, the NEON logo race, the iOS beat) ✅ | Opus 5.5 high | done |
| D | the Day Pass (the city by daylight, painted day signs, sunlit 3D skyline, sky, sun, water) ✅ | Opus 5.5 high | done |
| R2 | ✅ (done Oct 22 — docs/harbor/review-2.md) FABLE READ-ONLY REVIEW #2 (after the Day Pass): a fresh-eyes audit of everything since Part 1 — code health + leftovers from the many passes, Safari / iPhone risks, performance, tests, docs vs reality, the plan vs what's built; FOCUS (the owner): the laptop perf check has failed every pass since Neon Pass 4 — is the party night really too costly, is the budget / the benchmark wrong for this laptop, or is it noise? Find out and recommend; a report only, then a cleanup prompt for what it finds | Fable | ~45–60 min |
| C1.5 | ✅ (7c58e32) CLEANUP + SPEED (from review-2.md): the O's core fix, wheel d live, Safari floor (top-level await, getContext guards), the new perf gate (relative A/B; the phone decides) + a slow-frame count on the readout, the party's 3 fill costs trimmed, one shared "how dark is it" input, the sign-dim hook, panel rows hidden, playwright reverted — NO visual changes | Opus 5.5 high | 45–75 min |
| DT1 | ✅ (Oct 23) THE LIGHTS + SIGNS PASS (Day touch-up part 1): the blue-hour power-up on the shared darkness value, floodlights (wheel roof accent, behind the lighthouse, landmarks, the waterfront flag), the signs rethink (left roof slot removed, the slot rule, roof-sign steel frames, the blade bolder, the billboard built on a frame + its 4 lamps), the glass tower + its beam, the tagline's dark halo, load hitches never cost a tier | Opus 5.5 high | 90–120 min |
| DT2 | ✅ (1d2dd08, Oct 23) THE DAY LOOK (Day touch-up part 2): real clouds (a full rework), stronger sunlit / shaded faces, windows less grid-like — three refine passes | Opus 5.5 high | 75–100 min |
| SP | ✅ (254eda7, Oct 23) SKY POLISH (the owner: clouds 7/10): cirrus streaks rebuilt (not speed lines), cumulus bases, a real overcast deck + the pink 1 pm tint + the logo lit by day under cloud, the moon halo softer, the sun's colour by altitude, beams lighting clouds (not passing through), the cloudy party's cost, smooth contrails, one more push on the day buildings | Opus 5.5 high | 75–100 min |
| M | ✅ (563cdb2, Oct 23) City 2.0 music (her 35 mood songs, the MUSIC MOOD setting) | Sonnet 5.5 high | 30–45 min |
| FA | ✅ (b87e589 — the owner: fixed, "even better": music returns by itself after the home screen / another app; one tap after a podcast or another app's music, as iOS requires. OPEN: in her screenshots the Web Audio context stays FROZEN after returning and the music runs on the DIRECT element — check the beat lights + SFX still work in that state; fold into 7a section 0) FABLE: THE iPHONE MUSIC BUG on evidence (the AUDIO panel: a new context "running" with a frozen clock, session ambient, gain 0, 6 rebuilds) | Fable high | 45–75 min |
| F1 | ✅ (294e105) FIX PASS: the iPhone music bug (still broken — a diagnostic first), the billboard lit at night, the beat lead, brick texture at noon | Opus 5.5 high | 45–75 min |
| DB | ✅ (ed141a3, Oct 23) MUSIC FIXES (drop slip8, the iOS music-dies-after-leaving bug, party beat latency) + DAY BUILDINGS (the owner: "a little flat", 7–8 / 10): cast shadows between buildings, ambient occlusion, recessed windows, materials — the "BUILDINGS BY DAY" notes | Opus 5.5 high | 60–90 min |
| 7 | ✅ 7a (12a4f9c, Oct 23 — the owner: 7–8 / 10 at night, cozy; the ghost ad = the BLADE, not the corner turn; the smaller corner buttons feel better) ( add-ons sent: the sun's colour by altitude — golden hour too white; SUNRISE + SUNSET presets in the panel's TIME category; the AUDIO panel's header says "sounding" while the detail says NO) REORDERED (Oct 23 — the owner: the placeholder foreground is ~half the phone screen and skews every judgement of the city's look; 6b's sky doesn't depend on it): the speakeasy + rooftop, day and night (the ghost ad + the corner-turn preview) — ask the owner a few look questions first | Opus 5.5 high | 60–90 min |
| SPOL | ✅ (70bdbb5 + 3, Oct 24; also the room tints, sky sounds louder, placeholders hidden, the CI two-run rule; SLIPSTREAM on the blade only ~8.6 pt and the NEON PAR "back to lobby" flake → 8P) SPEAKEASY POLISH (Oct 24): the blade inverted (dark board, big bright self-lit letters), the windows redesigned (clean panes, less inside, the TV window upper right), the wall-washers as accents, crisp shopfront lights, the café-light canopy on the roof, the awning's warm glow | Opus 5.5 high | 60–90 min |
| 8P | ✅ (Oct 24 — people + roof + bus + cart, the hush sign in the lower-right window 2×2 ~11–12 pt, the doubled gilt fixed, ivy, the 1924 date stone, the brick street, the cloud suite in 4 jobs on [harbor] pushes; party +4 ms at tier 0 on the laptop → the owner's iPhone decides; the barber pole party-colour check now fails every run → FREV) (moved up, Oct 24 — Ben: hard to judge the windows / foreground with placeholder people): THE PEOPLE — the promenade people (guided free will, up to ~12, the entry / exit points, the crosswalk to the waterside sidewalk, the lobby line's corner), the rooftop people, the cart back (placed), the bus moving + stopping at the curb; premium silhouettes. (Wildlife, Rosie + boats in 3D, the raid + police cars, cabs, the schedule routines stay in 8b.) + SECTION 0 CARRY-OVER from Ben's SPOL review (the blurry barbershop front, 3 awning lamps, crisp lamp globes, the TV bluer, SLIPSTREAM stacked, the brick street, cobbles flatter, the crosswalk lit, the basement window, lamppost life, the hush-word sign preview, sky sounds louder + the jet duck, the speakeasy + people sounds imported, the CI split + flaky checks → warnings, the NEON PAR flake) | Opus 5.5 high | 120–150 min |
| FP3a | ✅ (Oct 24 — the surge on every music start, the overlays at the top + foldable, weather by layers (fog < 300 m, mist, the high veil keeps the sun), the load gate (dark → one fade-in), one lamp-light module, the people slower + coloured by day + rim-lit at night; the cloud city job's skyline wait widened → confirm on the next [harbor] push) FOREGROUND POLISH 3a — review-3.md §C items 1–6: the pole check, THE SURGE (one state machine; day peak held ~300 ms longer), THE OVERLAYS (DOM, foldable, at the top under the buttons), THE WEATHER BY LAYERS (keep the 0.5° area, no multi-model yet), THE LOAD GATE (fade from dark), the cleanup + the lighting seam (5b), the people's pace + day colours + night rim + the bus door | Opus 5.5 high | ~3–4 h |
| FP3b | ✅ (c08a0e6, Oct 24 — people face their way + straight legs + planted feet, real doors with the amber stairwell, the glow-wand dance circle from 10 pm on party nights, thin ivy to the parapet, the EST. 1924 plaque, warm stone trim, the cream / maroon bus, the roaster cart (right of the compass — covering the inlay when centred), the window box below the sill; Known issues: the pole's NO-SMOKE probe fails only in the cloud, a bar-window check flaked once → 6b section 0) FOREGROUND POLISH 3b — §C items 7–13: the people's facing + walk cycle, REAL DOORS, the glow-wand dance circle, the facade (ivy, the EST. 1924 date stone, the stone trim), the jets + the bus's livery + detail, tests + docs | Opus 5.5 high | ~3–4 h |
| FREV | ✅ (013be15, Oct 24 — docs/harbor/review-3.md: the fog at 10:19 was REAL (METAR ¼ mile); the jumpy load = the canvas following Safari's bars; the surge lost to a 6-s watch + a spent flag; the pole check a test bug; the people system carries all 8P notes) a FABLE FOREGROUND REVIEW (read-only, fresh eyes on the speakeasy + promenade + people + lighting + the systems' separation — clouds, lights, sounds, people hooks) → its findings + the 8P review notes go into ONE pass (FP3). + TWO OWNER ISSUES to diagnose (Oct 24): (1) THE JUMPY LOAD on iPhone Safari — the city shrinks, enlarges and snaps around several times before it settles; find every cause (the viewport height changing as Safari's bars settle — vh vs svh / dvh / visualViewport; the canvas sized before the viewport / fonts / DPR are final; the tier stepping up / down during load; bake stages popping in; resize handlers re-laying out) and recommend the fix so it's PERFECT THE FIRST TIME: size once from a stable viewport, ignore load-time resize noise, and reveal the city only when its first full frame is ready (a quick, graceful fade-in, e.g. from dark with the NEON sign — no visible jumps); (2) FOG SHOWN WHEN IT ISN'T FOGGY (his iPhone, 10:19 am; the real weather: mostly cloudy, 11 °C): trace the weather path — the source + its condition code, caching / refresh timing (stale early-morning mist?), leftover panel overrides, how "mist" / haze maps to the city's fog levels; fog only for real low visibility; the readout's weather line shows source, code, age and the city's mapped state; (3) THE FIRST TAP SOMETIMES DOES NOTHING TO THE NEON SIGN (his iPhone, by day, Oct 24 — the MUSIC starts fine; it's only the VISUAL surge / race that's missing; that day the city wrongly showed FOG, so check whether fog / overcast darkness makes the sign count as "already lit" and skip the surge): the surge must fire EVERY time on the first tap whenever the sign isn't lit (the catch during the warm-up) — find why it's skipped (the tap landing during the jumpy load before the sign is ready? the tap eaten by another handler — the panel chip, the dock, a window / cat tap? the surge tied to the music starting, so it's skipped when audio is already unlocked or fails? a once-per-session flag that never resets after returning from the background?) and make it reliable; also judge whether the surge is big enough for that moment. DECIDED WITH IT (the owner loved it, Oct 24): turning the MUSIC back ON (the music button, after it was off) also fires the surge whenever the sign isn't lit — the race along the tubes, then back to daylight glass as the music starts; the same punch every time music comes on, with a short cooldown (~10 s) so toggling can't spam it. At night (the sign already lit) music-on gives the lit sign a quick race / brightness punch instead. (2b) THE OVERCAST IS WRONG TOO (his iPhone, 11:19 am: the real sky = a thin, high white veil over blue sky — cirrostratus — but the city showed a grey, gloomy overcast deck): the weather mapping treats total cloud cover as a low grey deck. Use the cloud LAYERS where the source gives them (low / mid / high cover — e.g. Open-Meteo's cloud_cover_low / _mid / _high) so HIGH thin cover → a bright THIN VEIL (blue sky showing through a milky white sheen, the sun softened, maybe a faint 22° sun / moon halo on rare days) and only LOW / MID cover → the grey overcast deck. Recommend the mapping; the veil's look is built in 6b with the clouds. (4) THE DEBUG OVERLAYS COVER THE CITY (the owner can't see the people behind them): the AUDIO panel's fold uses a 'click' listener on a plain div (audio/diag.js:51) — iOS Safari may never fire it (CLAUDE.md's own pointerdown/pointerup rule); fix it, and make the green READOUT foldable to ONE line the same way (tap its title), both remembered; smaller text; never covering the promenade's middle. (5) THE BARBER POLE's party-colour check now fails on EVERY run (8P) — probably real (the blue stripe too pale): find it and fix | Fable | ~45–60 min |
| PF | ✅ (Oct 24, CI green) PROMENADE FINAL TOUCHES (Oct 24): the GitHub CI job (full e2e-harbor in the cloud, lean for the private repo), the final layout (cart + bus hidden until 8b, the bench + crabapple left of the crossing, the brick compass inlay, the lamps re-thought + tree uplights, the darker street under the dock, the string lights off for now, brighter sign lamps, an olive-green mailbox), the car's sound in sync, the neon-outline check, the SKY SOUNDS imported (Grok's 12 files, wired to the existing sky events) | Opus 5.5 high | 75–90 min |
| 7b | ✅ (3c5c17a, Oct 24 — CI 296/296; awaiting Ben's iPhone review; party tier 0 +0.5 ms) (moved up, Oct 24): THE SPEAKEASY'S LIFE — the window moments catalogue + the starter 10, the hidden mirror door, the TV glow, never fully dark at night; + the facade grazing lights between the windows, the blade's marquee bulbs, the rooftop string lights re-rendered (the raid stays for later with the vehicles) | Opus 5.5 high | 90–120 min |
| BEAT | ✅ (2a8338c, Oct 24 — one source per song, kicks only calibrate the lead, every beat punches, no tier drop on return; awaiting the owner's iPhone test) THE BEAT SYNC MADE ROCK-SOLID — a focused FABLE pass (the evidence: "re-measure gave up" before leaving; "heard +237 ms SKEW" after; the tier drop 2→1→2 on return; the owner: "all over the place — off, then back on at a slower rhythm, then lost again") — one source of truth (the trusted grid from the song's time + one lead, kicks only calibrate), no half-time, no tier drop on return; + SPEAKEASY in WHITE on party nights (the owner: too much pink) | Fable high | 45–75 min |
| FP2 | ✅ (Oct 24) FOREGROUND POLISH 2: the beat SKEW after returning (re-converge the output lead), the promenade tweaks (far-left tree + urn removed, the medallion to the middle with a height cap, cart left of it, bench + a crabapple shifted left, the bus removed until 8b, the framing maple fixed), grout in the cobbles at night, the finished street under the dock, crisp lights (no smoke), the barber pole (bright LED-like, smooth, neon on party nights), party timing 8:30 / 9:30 | Opus 5.5 high | 75–100 min |
| FP | ✅ (fb332a1, Oct 23 — the owner: "a big jump", ~8 / 10) FOREGROUND POLISH (Oct 23): the beat-after-returning fix (count beats from the song's position, not the context clock — the owner's evidence: ~1.3 s drift), the promenade re-layout (approved sketch), the billboard on a short frame, the blade in front of the tree, the barber pole (smooth + brighter), the stop lights + a WALK/WAIT lantern, one crafted planter, the bench at night, quieter water + varied gulls, pulse default 175, readout + AUDIO toggles in the panel | Opus 5.5 high | 75–100 min |
| 8a | ✅ (2aecda7, Oct 23) (+ the 7a follow-ups in section 0; a grey-box STOP for the owner's OK; then a FOREGROUND POLISH pass for the speakeasy + promenade together) (+ the owner's idea, Oct 23: a second road along the bottom edge, behind the dock — Claude's counter, AGREED by the owner ("let's try it, we can remove it later" — build it behind a preview flag): NO visible traffic behind the dock (moving cars behind JOIN / HOST would be the busiest thing right behind the most important buttons, and the biggest, most detailed objects on screen); instead an IMPLIED road just below the frame: a curb + the lamp posts' bases along the bottom edge of the promenade, and passing cars shown only as LIGHT — headlight sweeps gliding across the paving at night, a soft passing shadow now and then by day, the raid's red / blue washing across the promenade from the front) THE PROMENADE'S LOOK (static scenery, day + night): real trees, street lamps, benches, railing, paving, the waterfront edge — designed around the dock; no people / routines yet | Opus 5.5 high | 60–90 min |
| 6b | ✅ (Oct 24 evening — the abduction (the arched pose, a soft beam) + the TR-3B (strip blackout, the tape-stop, F-16s with Mach diamonds), the air show + missing man + the biplane through the letters, premium balloons, shared sky-message layout (skywriting removed), real-photo moon, City 1.0 aurora, rainbows re-fit, clouds layered + evolving + the veil + halo, the higher seasonal arch, the soft fog beam + red fog beacons, Grok's 30 sounds imported; Known issues: searchlights + party beams still brighten in fog, the air show's first roar lags) the special sky (+ section 0: the moon, geese, meteors, contrails, helicopter depth, drones in front of the moon + the sign fading for sky messages) | Opus 5.5 high | 90–120 min |
| POL4 | ✅ (Oct 25 ~4 am, cloud 347/347 first try — every review note + add-on in; FIX NEXT: the surprise flyby shipped at ~2 evenings a WEEK, the decision was ~twice a MONTH; known: both signal heads face left at 402, a 5-letter word on wordA uses the small font, a daytime billboard swap shows only after the next redraw, the van greyish at night) POLISH 4 — the owner's FP3b + 6b REVIEW NOTES (plan.md) in one pass, foreground + sky | Opus 5.5 high | ~3–4 h |
| 8b1 | ✅ (Oct 25 — docs/harbor.md#part-8b1: Polish 4's fixes + the beat's safety rule + the second-try sounds, the workers' schedule, the wildlife, the witnesses, the harbor's timetable; awaiting Ben's iPhone review) THE LIFE, part 1 — POL4's fixes + the beat (the panel's party drives the music, the safety rule) + THE WORKERS' SCHEDULE (the routines layer, the vendor spot, the cause-and-effect repairs, the billposter + sign painters, the window washers, the trash truck, the bootleggers) + THE WILDLIFE (the full new cast) + the witnesses fleeing the abduction + the harbor's schedule by boats + light | Opus 5.5 high | ~3–4 h |
| 8b2 | ✅ (Oct 25 — the TR-3B at a calm night's 30 fps + the drain audible + the blackout fixed + winning over the party; the bench's seats; the ducks + raccoon gone; THE WORKERS' QUALITY PASS; THE RAID (+ the front car's spotlight) after the bootleggers' nights; THE CABS; ROSIE + every boat in 3D) THE LIFE, part 2 — the RAID + police cars (after a bootlegger night), CABS, ROSIE + every boat as real 3D models | Opus 5.5 high | ~3 h |
| C2 | ✅ (Oct 25 — docs/harbor.md#c2: the TR-3B pass review (the jets' gap ~2 s, faster + smaller, the power back without the flashes, the far strips fixed), the 8b2 review (the spotlight's tour, the officer out front, ~10 s shorter, Rosie blended + her wake, open-water turns, the props carried, the cab's door), the panel rework, the trash can, the harness; the Firebase upgrades on `deps/firebase-upgrade` — safe to merge, Ben decides) cleanup pass 2 (+ DEPENDENCY UPGRADES on a branch with the full tests: firebase-admin 13 → 14, the browser Firebase SDK past 11.10 — not urgent, Oct 24) | Opus 5.5 medium | 15–30 min |
| PEO | ✅ (Oct 25 — docs/harbor.md#peo: the afternoon stutter measured — the battery saver's 30 fps + its flips, a partner's skate at turns, the planner's block in a frame — and fixed; speeds + steps against real walking; the dancers' arms continuous; the `motion` check) THE PEOPLE'S MOTION (a Fable review + fix: speed, gait, the afternoon stutter, the dancers' arms) | Fable 5.1 | 90–120 min |
| POL5 | ✅ (Oct 25 — docs/harbor.md#polish-5: the load log + the load jumps fixed (the screen's entrance, the fonts, the weather, the clouds, 100lvh); the hush sign ice-cyan + single panes + JOIN/HOST lit + no music toast; Rosie navy + the wheel + the crabapple; the fire hydrant + its hot-day spray; every forced event from the fire; the barnstormer gone, the ₿ + the festival launch, 3-line sky messages, the biplane's banner, the periscope's ping; the glass tower's neon; the lobby-line shots) POLISH 5 — THE LOAD, THE SPEAKEASY'S GLASS, THE COLOURS, THE HYDRANT, THE SKY'S MESSAGES | Opus 5.5 high | 180–240 min |
| 9a | ✅ (Oct 25 — docs/harbor.md#part-9a: the weather model, the rain lit by the tubes, the storm sky + capped lightning + thunder, fog on the water, puddles drying, the people in the weather, beads + ice on the NEON tubes, rain + frost on the dock's glass, ten sounds; the POLISH 5 review fixes + the balloons stay up + the festival's line-up + the surge on the beat) THE WEATHER (rain, drizzle, storms, fog, wind, wet streets, the sign + the dock glass in rain / ice, the sounds) + the POLISH 5 review fixes — "(after POLISH 5)" | Opus 5.5 high | ~3–4 h |
| SP3 | ✅ (Oct 26 — docs/harbor.md#sp3; the windows 2.25 tall, not 20 % (the facade's limit); the logo stays an SVG with the city's tube recipe — the owner's iPhone decides if it needs a canvas) THE SPEAKEASY + CRISP NEON (Oct 26 — "OWNER'S NOTES — OCT 26 (after 9a)"): 9a's review + bugs (the logo lit early in a storm, the crowns in the wind, the festival at 402, the sign's rain follows its power, the buttons' rain fades with them, real water on the dock + buttons, drizzle / rain / heavy rain apart, Rosie's hourly run), CRISP NEON (the logo + SPEAKEASY in white neon + the hush sign on the tube look at full resolution), THE WINDOWS + THEIR PEOPLE (bigger panes, the premium figure kit, one star window, softer room light, the TV off at 3 am, bigger promenade people), the roof signs' hourly modes, HIGH STAKES' five lamps | Opus 5.5 high | ~3–4 h |
| 11a-1 | ✅ (Oct 26 — docs/harbor.md#part-11a-1: the window figures redrawn + their rim; the holiday calendar (date-driven) + THE SIGN DECORATION SYSTEM + the light rules + the banner lines + a HOLIDAYS panel section; Halloween: the web + a realistic orb-weaver, the pumpkins, the window scenes, the witch, the bats from a crown, the black cat, trick-or-treaters + zombies, the green beam, the spooky light, THE GHOST SHIP; Day of the Dead: the sign's marigolds + papel picado + candles, the promenade's marigolds + petal path + papel picado, the ofrendas, monarchs, Nov 2's procession) |
| SP4 | ✅ (Oct 26 — docs/harbor.md#sp4: the spider + web redone FUTURISTIC (a geometric web of light filaments + nodes + a shimmer; a bio-mechanical chrome spider, legs that never tangle, a tap → the glowing thread); the window people LIT in lit rooms (real colours, the lamp's modelling, the rim; silhouettes only backlit / dark / ghost); the weather source: the panel's stored JUST ME jump was the cause (it landed after the reveal) — the panel's clock keeps the live weather + lands before the reveal, a calm seeded wind, clouds crossing in minutes, the readout names the source; the JAZZ sign inside its pane; the awning's drips by the rain; the strips under the panel; the AUDIO panel's music-off wording; the owner's mid-pass add-ons: the upper panes equal on screen (the day curtains gone) + THE WINDOW PEOPLE IN 3D (volume from the lamp, a cast shadow, the ¾ turn) + THE BLUE TV ROOM (the set, the couch from behind, the rimmed heads, the smoke)) |
| WIN | ✅ (Oct 26 — docs/harbor.md#win: the window bugs (the spider's tap on iOS, the stale hush sign, one window at a time, the toast at 60 fps, the ghost's eyes); the Halloween set pieces + the DRESSING SPOTS; the hush word on the wall; 2.5D rooms + people at depth; the TV room lit by the unseen set + the smoke; the cash count; PLAY ALL + the tidy panel) |
| WIN2 / WIN3 | ✅ (Oct 26 — docs/harbor.md#win2, #win3: the eyes in the haze, ACT BIG, the edge moods; the spiders for Halloween, the panel rows, the boss's TV room with no person + the quiet nights, the cash close-up, the window party) |
| SP5 | ✅ (Oct 26 — docs/harbor.md#sp5) THE SPEAKEASY FOLLOW-UPS (Fable, Oct 26 — "OWNER'S NOTES — OCT 26 (after WIN3)": the spiders independent + the drop's feet + the bigger scare (FIRST, for Halloween), the boss's room by day + the violet spade + the TV nudge + his shadow at the party, the roller shades, the barbershop's values, the cash count's one arm pair + walk-up, the edge dancers + depth + between songs, the vendor's side, the promenade dance on the hour, the blade's weekly repaint) | Fable | ~4 h |
| 11a-1 | HALLOWEEN + DAY OF THE DEAD + the shared holiday system (calendar, build-ups day by day, sign dressings; the web, the pumpkins, the window ghosts on SP3's window kit, the ghost ship, the witch, the trick-or-treaters) — LIVE BY ~OCT 29 | Opus 5.5 high | ~3 h |
| 11a-2 | ✅ (Oct 27 — docs/harbor.md#part-11a-2: Halloween's giant BITCOIN pumpkin + the dance ringing it, BIG PIECES CHANGE OFF-CAMERA, the boss's shadow walking up, the bolder spade, the bluer TV, the UFO redesigned (the abduction byte-identical), the witch smooth; the November build-up by date (bales, stalks, the spots, the harvest display, the wreath, the raker, cider); THE PARADE SYSTEM + Thanksgiving's balloon parade + its sounds; the homecoming party; the amber day, chimney smoke, pies, the family tables + the football game in the windows; BLACK FRIDAY: the rush, the tree stand, the sale banner, the first Christmas crew stringing the speakeasy's lights) THANKSGIVING + the reusable PARADE system (the Wednesday party, Black Friday's first Christmas crew) — by mid-Nov | Opus 5.5 high | ~2–3 h |
| SP6 | ✅ (Oct 27 — docs/harbor.md#sp6: the cloud chore; the blue TV window (the owner's palette + his chosen glow) + the boss's party window; the UFO beam's lines + the spot beside the giant; CREDITS; WORD FLASH / LAYERS / TWO-TONE; the vehicles' words readable + foreground traffic; the small fixes — the real UFO model was not on the machine: no bake yet) THE FIXES BEFORE WINTER — the cloud failures + the CI-minutes chore, the blue TV window, the boss's party window, the UFO from the real model (+ the beam, the spot, a CREDITS sheet), the three roof-sign modes, the small fixes | Opus 5.5 high | ~3 h |
| 9b | ✅ (Oct 27 — docs/harbor.md#part-9b: the climate fallback; the snowpack's stages on every top + the plaza + the road + the speakeasy; the lit snowfall; the plow + the salt truck; the shovellers, the snowball fight, the slip; the fluffy snow on the NEON that piles only while it's off + melts in clumps when lit; the January snowman; CREDITS fixed; the phone rule) WINTER (the snowpack stages, plows / salt / shovelers, the snowman, snow on the sign + the speakeasy, frost on the glass; + the climate-aware fallback, the CREDITS bug, the phone rule in CLAUDE.md) | Opus 5.5 high | ~3 h |
| UFO | ✅ THE UFO BAKE — sebslom's model as sprites (the owner: "looks good"; hover higher + the flight's stutter → 9c) | Opus 5.5 high | ~1 h |
| 9c | ✅ (Oct 27 — docs/harbor.md#9c: the sign's snow glows + goes dark in the blackout; the forced plow in view at once; trodden lanes, big banks, the shovel stroke, the snowman's sticks, City 1.0's frozen pane; THE CRISP LAYER; the centrepiece floods; the boss's cream blind; the blind cycle — no window scene pops in; the UFO above the wheel) THE FIXES — winter made to read, the crisp layer, the centrepiece floodlights, the sign's snow in the blackout, the boss's cream blind, the window-scene rule, the UFO higher + smooth | Opus 5.5 high | ~3 h |
| HOT1 | ✅ (Oct 27 — the night freeze: the back window's peek threw every frame and the loop stopped; fixed, failed frames reported to /admin, e2e-harbor `freeze`) | Opus 5.5 high | ~30 min |
| 9d | ✅ (Oct 27 — docs/harbor.md#9d: the held TR-3B preview's music fixed + stalls report to /admin (the freeze not reproduced on Chrome); &temp= reaches the snowman; THE DOORS never snap (the leaf is the baked door, a door closer) + REAL door light (a lamp's mask × the brick); the giant lit on its normals; the sign's snow white; the frost pane only; the beacons' photocell at sunset; ☰ → ADMIN + the NOW bar) THE FIXES II | Opus 5.5 high | ~3 h |
| 9e | ✅ (Oct 28 — docs/harbor.md#9e: SEND REPORT + the hang watch (the freeze not reproduced, even on WebKit); the frost reads; the snowman's depth; the blade crisp at tier 0; snow lands on the sign; the henchman, the water wagon, Sunday's bells, the morning paper, the joggers, the stage under the dock + the quick fade, the TR-3B on party nights; THE CONSTRUCTION TOWER's cycle (the sun never breaks); the sax lit — the two vehicle models CUT) THE FIXES III + THE CITY LIFE + THE CONSTRUCTION TOWER + THE SAX REWORK | Opus 5.5 high | ~4–5 h |
| CONN | ✅ (Oct 28 — aa51ae9; CLAUDE.md → Multiplayer mechanics, docs/data-model.md#the-connection-conn-oct-28) THE DATABASE CONNECTION ONLY WHEN NEEDED: the socket PARKED until want() (HOST / JOIN / a resume / an invite check / a room / the admin's panel), offline 30 s after + after 2 min hidden with no room, never in a room; no false SIGNAL LOST; City 2.0's EVERYONE through GET /api/admin?live=1 (edge 15 s, polled ~45 s). OPEN SOCKETS before → after (tests/integration/e2e-conn.mjs): title idle 1 → **0** · City 2.0 title 1 → **0** · invite link (checked) 1 → 1, **0** after 30 s · lobby / game 1 → 1 · hidden tab in a room 1 → 1 · title after QUIT 1 → **0** (after the grace) · hidden title tab 1 → **0** · /board 0 → 0 · /admin 1 → **0** · an admin on City 2.0 1 → 1. Fixed on the way (the cloud's first run, by day): a word cleared BY DAY never left `spelling` (the window lights skip drawing then, so the fade-out's drop never came — lights.js drops it now) + the JUST ME word-towers check pinned to 23:00 like its EVERYONE twin (by day the words never light; both failed only in daylight runs). Known: LOAD WEATHER's race (listed in 9e). The two vehicle models: not in this pass (the owner's call) | Opus 5.5 high | ~1–1.5 h |
| 9f | ← NEXT: THE FIXES IV — the 9e review: LOAD WEATHER fixed, the TR-3B stutter + the tape-stop lag, the morning paper out, the joggers, the REAL tower imploding, the site's night lights + its party beam | Opus 5.5 high | ~2–2.5 h |
| ATM | a FABLE ATMOSPHERE pass: THE CLOUDS (kinds, motion from the real wind at their height, cumulonimbus storm decks, the veil / overcast layers, the light through the day, lightning inside them) + WIND as one system (crowns, leaves, flags, smoke, rain slant, coats, chop, balloons) + FOG as depth (halos, the lighthouse cone, banks drifting) + THE STORM (thick branching bolts, the needle struck, the louder thunder) + FREEZING RAIN as ice (icicles on the speakeasy + the signs, the ice sheen) — "OWNER'S NOTES — OCT 26" | Fable high | ~3 h |
| 10 | party nights + fireworks (the "Part 11" section below) | Opus 5.5 high | 60–90 min |
| 11b | winter holidays: the Christmas build-up, the tree lighting, the Christmas sign, New Year's Eve (ball drop, window countdown, the finale on Part 10's fireworks) | Opus 5.5 high | 60–90 min |
| **THE ROADMAP REORDERED** | **(the owner, Oct 26 6:01 pm — DECIDED; "OWNER'S NOTES — OCT 26 (after SP5)")** after the city's five above (11a-2 → 9b → ATM → 10 → 11b): LOBBY 2.0 → BOARD 2.0 → (a SHORT game-lineup TALK) → PROGRESSION 2.0 → TV MODE → the GAME LINEUP CHAT → the games → the release; a Fable review + a cleanup after 11b and again after Progression 2.0. 11c / 12 / C3 / 13 stay on the list, slotted by the owner | — | — |
| R-A | FABLE REVIEW + CLEANUP (after 11b, before Lobby 2.0) | Fable + Opus 5.5 | ~2 h |
| 14 | Lobby 2.0 + the public crowd | Opus 5.5 high | 90–120 min |
| 16 | Board 2.0 | Opus 5.5 high | 60–90 min |
| L0 | a SHORT GAME-LINEUP TALK (no build) before Progression 2.0 — the streaks + achievements the daily puzzles / solo games will need | chat | ~30 min |
| 17 | Progression 2.0 | Opus 5.5 high | 90–120 min |
| R-B | FABLE REVIEW + CLEANUP (after Progression 2.0) | Fable + Opus 5.5 | ~2 h |
| 15 | TV mode, step 1 | Opus 5.5 high | 60–90 min |
| L | GAME LINEUP SESSION (a chat with Claude, no build — the owner, Oct 23): which games stay / go / are new, final names (e.g. PRISM vs PRISM DROP), how each roughly plays — BEFORE Lobby 2.0 + Progression 2.0, which are built around the games. The owner's order: finish the city → this session → lobby, progression, City Control, settings → the games; release once ~5 games are complete, no date | chat | ~1 h |
| 11c | spring, summer + patriotic: Valentine's, St. Patrick's, Easter, Memorial Day, July 4th (air show + fireworks), September 11, Veterans Day | Opus 5.5 high | 60–90 min |
| 12 | easter eggs, sounds, desktop, switch-over | Opus 5.5 medium | 60–90 min |
| C3 | final cleanup | Opus 5.5 medium | 30–45 min |
| 13 | CITY CONTROL (admin) | Opus 5.5 medium | 45–60 min |
| R-ALL | FABLE WHOLE-APP READ-ONLY REVIEW (the very end — the games, lobby + rooms + sync, profiles + progression, every /api, City 1.0 / the Harbor, security before app stores + payments); a report, then a cleanup prompt | Fable | ~60–90 min |

**FASTER RUNS (the owner, Oct 24 — "this takes so long"; the laptop is the bottleneck: low memory, 4× CPU throttling,
browser tests):** (1) add a GitHub CI job that runs the FULL e2e-harbor suite on every push (the cloud does the heavy run,
not the laptop); (2) locally each pass runs only the unit suite + the test groups it touched; (3) the A-B-B-A speed check
runs only when a pass changes what's drawn every frame (new animations, lights, layers), not for layout / art / sound
tweaks — the owner's iPhone readout stays the judge; (4) the speed check never waits on bakes under 4× throttling (bakes
are measured separately). The CI job goes in the next pass.

**TESTING SCOPE (the owner, Oct 22 — no traffic yet, the games will be reworked):** City 2.0 passes test the CITY only. No
game-by-game or every-phone game sweeps. Only when a pass touches files the whole app shares (title.js / title.css, the
router, shared helpers, /api): one quick smoke check — the default city loads at 402×874 and one game opens — then stop.
The full game suites wait for the games' own rework and the final whole-app review.

**How every part works:** a "work efficiently" block (a bug not fixed after 2 real attempts → logged in docs/harbor.md
"Known issues", move on; never polish what a later part rebuilds; while working only the part's own tests; at the end the unit
suite + e2e-harbor + a quick default-city smoke check — the full 5-minute title suite only at the cleanup passes and Part 12;
two screenshot refine passes; subagents for wide reading; ask the owner at once on a conflict). Every part updates
docs/harbor.md (what it built, the stubs table, the handoff note) and gives preview links on neonspeakeasy.com with
?city=2&tz=America/Detroit&at=42.96,-85.67.

## Rules that apply to everything
- **The night is the bar for everything (the owner, Oct 22):** the night + party city after Neon Passes 2–6 is "stunningly
  beautiful, crisp, colorful, high detail, premium". Every other look — day, golden hour, rain, snow, holidays, the desktop,
  the promenade, the speakeasy — must reach that same level, checked side by side with the night at phone size.
- **The whole sky is free — behind the sign (the owner, Oct 22; replaces "never across the NEON sign or the tagline"):**
  every sky object (planes, the banner plane, helicopters, jets, birds, bats, balloons, UFOs, drones, smoke, meteors) may use
  the WHOLE sky from the top safe area down to the skyline, passing BEHIND the NEON sign and the tagline (they always draw
  on top, so the sign stays readable) and in front of the sun, moon and stars. Never over the dock or the corner buttons.
  The lanes stay only for depth (high = small + far, low = bigger + behind the taller roofs) and to keep events from
  colliding. The one planned exception: the barnstormer threading THROUGH the letters (6b). Sky messages dim the sign.
  THE THREE DEPTH RULES (the owner, confirmed): (1) EVERYDAY SKY (planes, contrails, helicopters, birds, bats, balloons,
  UFOs, meteors, satellites) — the whole sky, BEHIND the corner buttons, the NEON logo + tagline and the taller buildings,
  IN FRONT of the moon, sun and stars; (2) MESSAGES (the drone show, skywriting, skytyping, the banner plane) — IN FRONT of
  the logo, which dims / the tagline fades while they fly (the banner under SPEAKEASY through the tagline's band); (3) THE
  BARNSTORMER — THROUGH the letters.
- **The beat must be felt (the owner):** anything that pulses to the music pulses HARD — a fast attack to a clearly brighter
  peak (a big swing in brightness + glow, not a few percent), then a quick decay, harder on downbeats / drops — obvious on an
  iPhone at a glance; still never full-screen flashing or hard on/off across large areas.
- **The "does it make physical sense" check (every moving piece):** review each one across its WHOLE path (a burst of frames
  from start to end, not one still), and check depth: what it passes in front of / behind, and that its light, beam, shadow,
  reflection and glow land where the thing really is (a helicopter behind the towers can't light the water in front of them;
  drones can't fly behind the moon). List each piece's depth in the review notes.
- **The glance test:** anything meant to be seen must read on an iPhone held upright in 3 seconds, from silhouette, pose,
  colour and motion, at the size rules (people ~20 pt). Small props are exaggerated, key moments get a visual cue, nothing that
  matters happens on the far pier or out on the water (boats and the wheel read by their lights). Every holiday / story list is
  triaged by size before building: make it bigger or cut it. Never write code for something that can't be seen.
- **Premium, crafted, never cheap** — above all the lighting (Christmas lights, neon, fireworks are LIGHT). EVERY moving part and
  every eye-catching item MUST be rendered premium and stunning; if it can't be made to look great at phone size, say so to the
  owner instead of shipping something mediocre, and never let it crowd something more important (word towers, needle, wheel).
- **Never quietly lower the look:** if staying inside the speed budget would mean a visible sacrifice (especially on older phones /
  tier 1), stop and tell the owner what you'd simplify and let her decide.
- **Real phones decide the budget:** the laptop's 4×-CPU, no-GPU test is an EARLY WARNING, not the verdict. On the owner's iPhone
  (Oct 21, &debug=1) a party night costs 1–3 ms of work at a steady 60 fps, while the laptop said ~6.4 — so when the laptop says
  "slightly over", check a real phone (&debug=1) before cutting anything. Measure once while building + ONE careful A-B-B-A round
  at the end (only the scenes that changed); if over, one fix attempt + one re-measure, then report and ask — no loops.
- **Performance + battery:** every part stays within the frame and memory budgets; the cleanup passes double as performance
  checks; cleanup pass 1 adds battery/heat care (a lower frame rate when little is moving, a full stop when the page is hidden).
  New ideas fit the existing systems (lanes, events, windows, holidays) rather than adding big new machinery.
- **Weather effects only when it is really happening** where the player is. Never tell players the city is live.
- **Fixed-time moments run on the clock, not the scheduler's dice** (the NYE countdown + finale, the tree lighting at dusk,
  the Day of the Dead procession, the 9/11 beams, half-staff times) — the scheduler is for random events.
- **City 1.0's light timeline is kept exactly** (dusk boot-up order, flicker + stagger, window lights-on, bedtime thinning,
  morning off). Only the art improves.

## Part 2 — skyline
- Hierarchy: 2–3 dominant hero towers, a middle tier in clusters, a dense low base; only 1–2 gold crowns; one Empire-State-style
  stepped tower (our own design); 2 modern glass towers in the back/haze layers only. Sun gaps only in the TOPS — no holes.
- The Ferris wheel ~45% across, a bit smaller, its legs + pier + water visible (never reads as on a roof), clear of the word
  towers and hero crowns. Same skyline on every phone; taller phones get extra sky (no stretching). Water strip: camera kept.
- The tagline "YOUR FRIENDS ARE ALREADY INSIDE." (the owner likes it): shown on arrival, fades out TOGETHER WITH THE DOCK when the
  title's screen goes to rest, comes back with the dock on a tap; on special days the TAGLINE SLOT shows the special message
  instead (holidays, the NYE countdown, CITY CONTROL's custom-typed messages). The skyline never grows into its space.
- Thousands of glitter windows; ADDRESSABLE windows on every building; 2–3 word towers (horizontal + vertical) with a pixel font
  (letters, digits, heart, star, flag) — used for "2027", the 10→1 countdown, a heart, "BOO", "JOY", birthdays, admin words.
- Searchlights: 2–3 crafted rooftop searchlights (party nights, holidays, rare "grand opening" nights; dramatic in real fog/cloud).
- Golden-hour god rays through the gaps; day and night = two different cities; sun + moon arch re-fit (rise/set behind the
  skyline, clear the logo, may pass behind the wheel/lighthouse), real timing unchanged.
  6b — THE ARCH, HIGHER (the owner, Oct 24): raise the sun + moon arch so its APEX sits JUST BELOW THE NEON TUBES — the
  SPEAKEASY word + the tagline may pass in front of the sun / moon near the top (their dark halo keeps them readable; the
  moon still dims behind the tagline band). Never behind the NEON tubes themselves. SEASONAL + TRUE TO THE REAL SKY: map
  the year's HIGHEST sun (the summer-solstice noon, ~71° in Grand Rapids) to the apex just below the tubes and scale the
  real altitude from there, but COMPRESSED so winter isn't buried (the owner): a gentle curve, not linear — the
  December noon (~24°) still sits CLEARLY ABOVE the tallest crowns in open sky (roughly half-way up the arc), an October
  noon a bit higher, summer noon up under the sign; the seasons still differ visibly, the sun just never spends a winter
  day hidden behind the towers (only rising / setting behind the skyline); the moon on the same mapping. Keep the sun's
  glare tight near the top so it never washes out the daytime tubes; re-check the tagline halo + the moon dim, and the
  rise / set still behind the skyline. Supersedes the older "keep the moon out of the tagline band" note.

## Part 3 — neon, signs, billboards
- Every game has its own tube-neon sign in the city (and a tube logo reused by Lobby 2.0's sign swap). Signs built like real
  sign-shop neon; beautiful unlit by day.
- The NEON logo premium pass, letter shapes identical: uneven light along the tube (hotter on bends, dimmer at the electrodes,
  a faint core flutter), real glass thickness + a moving highlight, its glow tinting the night haze; by day (it is OFF by day)
  clear sunlit glass, glints, caps/clips, soft shadow. Shown only with ?city=2 until the switch-over. Position + night look kept.
- The neon boot-up sequence + flicker timing = City 1.0's. THE CATCH must FLOW on like City 1.0's (the owner: City 2.0's catch
  goes dark for half a second then snaps on — fix in cleanup pass 1); every TIME stays exactly as it is, only the animation.
- NEON BUZZ: crisp, high-quality buzz / tick sounds on each flicker during the dusk warm-up and morning fade, a soft hum at the
  catch — always when sound effects are on (never relied on; the visual stays the moment).
- THE LOGO'S COLOUR: pink is home most nights (the brand: app icon, link previews); other colours (purple, electric blue…) only on
  special nights — holidays, party peaks, game starts, CITY CONTROL.
- **Signs (asked + decided Oct 21 2026):** 12 readable named signs don't fit a phone's skyline (the word faces, the wheel, the
  lighthouse take the wall space) — so MIXED SIZES: every game always has its own sign; ~4–5 big NAMED spots whose games rotate
  (a new pick each night or visit, never a sign changing while you watch); the other games as tube ICON signs (mark + colours).
  Built so games can be added or removed without redesigning the skyline.
- **Building neon (the owner, Oct 21 2026):** real tubes tracing the Deco shapes, LAYERED (heroes + landmarks fully outlined,
  the middle tier on rooflines / setbacks, the far bands a few faint threads); THE NEON NEEDLE (the needle's spire one tall
  glowing tube, its synced beacon at the tip); COLOUR like Shenzhen but designed — ~8 colours in roles: base ~60 % (electric
  blue, cyan, ice white), heat ~30 % (the NEON pink, violet; mostly heroes), accent ~10 % (amber, signal red, acid green);
  max 2 colours a building, colour by cluster, a brightness hierarchy, the word faces clear; the two glass towers' LED
  facades (slow, smooth gradients); a calm steady glow most nights with hooks for MOMENTS (party chasers + the beat, holiday
  schemes, a game's colours flashing across the skyline at a game's start, a CITY CONTROL scheme).
- Word towers (Part 3 fix): both faces fully visible at every phone size, bold bright letters on a dimmed face, a SCROLL
  (ticker) style for messages of any length. Aircraft beacons on every tall top incl. spire tips, blinking IN SYNC.
- Owner review notes for the next pass (Part 4 section 0): outlines must follow the Deco setbacks / fins / crown steps, not
  plain outer rectangles (esp. the cyan towers on the right); the right-hand billboard + small icon signs are too small to read
  on a phone → bigger or moved onto the stage; give the busy skyline centre (needle, CIPHER, wheel, HOTEL blade) breathing room.

- SIGN PLACEMENT RULE (Oct 21): no sign may cover a hero tower's face or neon outline. The vertical named game sign that sat on
  the central hero tower moves into the HOTEL blade's spot (the HOTEL sign is removed — its thin letters don't read on a phone);
  the game blade takes over the projecting build + chasing bulbs, glance-tested. Game signs never go on the speakeasy (it stays
  secret and unmarked).

- NEON PASS 2 (after 6a, the owner's zoomed iPhone review): outlines hidden by nearer buildings (no drawing over them), clean end
  caps, one tube bent around the MAIN setbacks with rounded corners (no 8-bit stair-steps), no tube through a sign, no icon on a
  tube, NO signs on any hero tower's face (EMPIRE + the white tower too — icon spots added elsewhere), no sign/icon/tube clipped by
  the screen edge, the billboard's small second line fixed or dropped; MORE NEON IN THE MIDSECTION (mid-building rooflines +
  setbacks, Deco ledge bands, fins + corner trims, and a WATERFRONT STRIP of ground-level bars/diners/theatres along the far shore
  reflected in the harbor; nearer buildings warmer — pink, amber, red — towers cooler); drone colours; real neon SFX from the
  owner's picks.

## Part 4 — water
- Reflections in perspective; a gold sun path at sunset and a silver moon path at night broken by ripples; every light smeared
  in the water; fireworks doubled in the harbor (Part 11).

## Part 5 — harbor hero pieces
- Ferris wheel (turning, bulbs; seasonal/holiday colours; its A-frame legs must stand ON the pier deck — today they stick out past
  both sides of the pier; widen the pier under the wheel or bring the feet in), lighthouse (beam; keeper's cottage), pier, boats: Rosie the
  riverboat with bulbs, a water taxi, a tug, sailboats by day; lit boats for holidays.
- AN ELEVATED TRAIN along the far waterfront (City 1.0 had one) — DESKTOP + TV ONLY (decided after Part 5: on a phone its cars
  would be ~7 pt and ~60% hidden by the wheel and Rosie); built with the desktop pass in Part 12; a warm ribbon of lit windows at night reflected in the harbor, a sleek crafted shape by day,
  rush-hour / late-night timing like City 1.0 (trainGap), a lit holiday train in December, maybe a rare vintage steam train.

- Part 5 built: the wheel on a pier platform (legs on the deck), the lighthouse + beam (a cone in real fog), Rosie (bulb strings,
  paddlewheel, a lit "ROSIE" name board), the water taxi, the tug, sailboats, wakes; tier 0 calmer; the heavy-event quiet thins
  extra boats during big shows. Note: on a normal night the wheel's warm bulbs blend into the windows behind it — give it more
  contrast (Part 6 section 0).

## Part 6 — sky hero pieces (existing behaviour, new art) — SPLIT into 6a (everyday sky, DONE Oct 21) + 6b (special-occasion sky)
- 6a built: tier 2 on modern iPhones (iOS reports capped cores), white wheel bulbs + a glow ring, the game blade in HOTEL's spot,
  airliners, the banner plane (lit at night), skywriting + skytyping, the helicopter, birds, balloons, the moon art, the aurora
  (~2 nights a month for everyone + real Kp ≥ 7), the drone show (barge launch) as the night form of sky messages — sky messages
  only on holidays or when sent (CITY CONTROL), never random.
- 6b: the jets + air show (our own team) + the F-16 missing man; TWO UFOs, realistic not cartoonish — a classic metallic saucer
  (rotating rim lights, an underglow lighting the haze/water, slow silent hover; it does the promenade abduction) and the TR-3B
  (matte black triangle, a glowing red orb at the belly's centre + three orbs at its points, slow silent glide, then impossibly fast
  and gone; a rare night flyover); skydivers (colourful canopies by day, ankle flares + canopy lights at night); the witch; Santa's
  sleigh. Every piece gets day + night versions (golden-hour touches where they help).
- POLISH LIST (small things, for the cleanup passes): the NEON logo at night — a white-hot glass core inside each pink tube
  (the colour in the glow around it), a faint pink cast of its light on the haze / clouds behind it, the tiniest uneven
  brightness along each tube; SPEAKEASY's letters as real thin tubes. Size stays.
- CITY 2.0 MUSIC (after the Day Pass, before 6b): import ALL the owner's mood songs — she has added more since (more than 35
  now) — from the ~/Downloads mood folders (morning, day, evening, late, party — check the exact folder names; use every
  audio file in them); IGNORE the victory and neon folders as City 2.0's mood lists (City 1.0 keeps its own; victory + game music stay as they are); neighbouring moods may
  share songs (bigger decks) — the owner's first: morning10.mp3 (in the morning folder) plays in BOTH the MORNING and the LATE
  NIGHT rotation, one file shared by both lists (never uploaded twice); seasonal songs later; a MUSIC MOOD setting (in BOTH cities — the owner's call): AUTO (default, follows the time of day) / MORNING /
  DAY / EVENING / LATE NIGHT / PARTY — in a lobby the room's synced song follows the HOST's setting. Later, once a mood has
  ~30+ songs: rotate halves week by week (the owner's idea — not before, it would make repeats worse).
- BUILD ORDER NOW (Oct 22): the Balboni rename → THE PREVIEW PANEL (the owner's test remote: JUST ME / EVERYONE ON CITY 2,
  admin-only via /api/admin, a server-written city2/live node — the seed of Part 13's CITY CONTROL, which later adds the PIN,
  the confirm tap and MY ROOM once City 2.0 is the real city) → Neon Pass 4 → the Day Pass → City 2.0 music → 6b.
- DAY TOUCH-UP PASS (after the Day Pass; notes so far): (1) the CLOUDS look like cartoon bubbles in rows with flat bottoms —
  real varied cumulus, soft edges, real shading; (2) the sunlit vs shaded sides too subtle at phone size — more contrast so
  buildings read as solid 3D; (3) windows still grid-like from a distance; (4) THE POWER-UP WAITS FOR THE BLUE HOUR (the
  owner): golden hour = pure sunlight (warm facades, gold glass, long shadows), NO building neon; only a FEW warm windows
  come on (~5–10 %, first on the shaded sides, the sunlit faces show gold reflections instead); at sunset the city powers
  up in a staggered ~30-min wave through the blue hour — more windows, the signs flicker on, the outlines cluster by
  cluster — fully lit against a deep-blue sky; the NEON logo keeps its own timing; party nights the same power-up first;
  + the owner's iPhone notes on the Day Pass.
  (5) DECIDED (Oct 22): THE WHEEL BACKDROP = d (floodlit stone) + a NEON ROOF ACCENT on that building (a thin Deco roofline,
  calm, never brighter than the wheel); remove a / b / c. FLOODLIGHTING ELSEWHERE — the owner hands the picks to us:
  reuse it around the city for depth — AND (the owner, Oct 22) try a soft FLOODLIT WATERFRONT ROW: the front buildings
  along the water get a low uplight wash (the bottom third of each facade, fading upward), warm, uneven (some brighter,
  a few gaps — never one even band), dimmer than the wheel's backdrop building so that one stays the brightest; it shows
  in the water's reflections. Build it behind a preview flag (on / off) so the owner compares and decides — maybe not on
  all of them (the owner agreed). FOR SURE: THE BUILDINGS BEHIND THE LIGHTHOUSE get the wheel-backdrop treatment (the
  owner, Oct 22): soft floodlight on the BRICK so it reads as a real building behind; KEEP THE WINDOWS as they are (at most
  ~10 % fewer, the owner likes them), so the lighthouse pops
  against a calm lit wall like the wheel does — a touch softer than the wheel's backdrop (the wheel stays the focal
  point); nothing boxy behind the tower (the earlier rule); the lighthouse beam brightens the wall as it sweeps past. Also: uplit facades on a few chosen landmark / mid-distance buildings (not every one), so
  the skyline reads in layers. Night + it switches on as part of the blue-hour power-up; NOT by day (the sun's lit / shaded
  faces do that job in the morning and golden hour). Party nights may tint the floodlights.
  (5b) The owner's iPhone check (Oct 22): buildings now read solid + 3D ("more polish passes needed"); clouds need a lot
  of work; party night 60 fps, work 1.6 / 2.0 ms but 4–7 % slow (was 0–3 % before the Day Pass — R2 looks at why). At
  night the DOUBLE AGENT billboard (left, under BLUFF) reads as a dull grey board — its night face must glow like the others.
  (5b-2) The owner's iPhone, party 23:00 (Oct 22, 10 pm): mostly 0 % slow, peaks of 4 % (the 7 % was right after load) —
  not a big problem. The readout showed "2→1→2": the city dropped to tier 1 and back, probably on the load spikes. Check
  the tier logic ignores the first seconds after load (bakes / fonts / images) so a load hitch never costs a downgrade,
  and the slow-frame count can skip the first ~10 s (or show both).
  (5b-3) THE TAGLINE OVER THE MOON (the owner): when the moon sits behind SPEAKEASY the pink letters get hard to read.
  The pro fix (titles / subtitles over changing backgrounds): a soft DARK HALO hugging each letter of the tagline (and the
  NEON word) — a blurred dark shadow, always on, invisible against the dark night sky, so it only shows where something
  bright is behind (the moon, the day sky, the sun, fireworks, beams). Plus the moon dims ~20–30 % softly while it's behind
  the tagline band. NOT a light haze (that lowers contrast). Never a box or visible panel. Check at night with the moon
  behind each part of the tagline, and by day. The halo + dim read the sign's LIVE position (6b raises the sign ~20–30 pt
  and then re-fits the sun / moon arch — that re-fit should also keep the moon's path out of the tagline band where it
  can, crossing it quickly when it must; re-check this fix after 6b).
  (5b-4) THE OWNER'S DT2 PHONE CHECK (Oct 23, in progress): the PLANE CONTRAILS look jagged / skippy / jumpy — investigate
  (likely the trail drawn as segments at fractional / frame-stepped positions, or sampled per frame so it steps at 60 Hz;
  fix: a smooth continuous path, sub-pixel, eased spread + fade) — folds into 6b's "fluffy contrails like City 1".
  The HIGH STREAKS (cirrus / long thin streaks): the owner loves the idea, "not there yet" — needs tweaking (in her
  screenshot they read like hard speed lines; softer, feathered, varied, following the wind). Claude's notes from her
  OVERCAST screenshot (13:00 &wx=overcast, to raise with her): it shows separate puffy clouds with blue-violet gaps, not an
  overcast deck; the whole sky is pink-violet like dusk at 1 pm; the clouds still read a bit cartoon-round; the NEON
  letters E-O-N look lit pink by day (N unlit) — check whether the darkness value turned the logo on under cloud;
  30 fps there (Low Power Mode?). From her MORNING (9:00) screenshot: the sun is a flat orange-peach ball with no bloom
  at 9 am (should be near-white with a soft bloom ~20° up; orange only right at the horizon); the high streaks again read
  as hard speed lines; small cumulus still a bit cartoon-round; windows on the mid towers still grid-like; buildings'
  3D reads OK; readout says 30 fps by day while frame shows 17 ms (a day frame cap? ask the builder).
  NIGHT (22:00, &wx=clouds): the owner — cumulus look OK, the high-altitude streaks do NOT. Claude's notes: a big faint
  RING around the moon cuts through the tagline (a moon halo? reads like a stray circle — check what it is); the
  billboard glows warm under its lamps (good); the clouds' violet underglow reads well.
  PARTY + CLOUDS (23:00, &wx=clouds): the owner — the MOON HALO is too concentrated (soften: wider, fainter, no hard ring
  edge, never a circle cutting the tagline). Claude's notes: 4.2 % slow (3.1 % after 10 s), work 5.1 / 8.0 ms — a cloudy
  party costs ~3× a clear one (1.2 %): trim the clouds + beams-on-clouds cost; HIGH STAKES stacked on the roof sign reads
  well; the billboard showed "PRISM DROP" — so PRISM's full name is PRISM DROP and the blade's "PRISM" alone breaks the
  never-shortened rule (ask her about SIGNAL / CIPHER / BLUFF too).
  REAL MORNING (Fri 8:52 am, live): the sun here IS a white bloom (good — so the 9:00 orange ball was the preview's
  low-sun colour, recheck); cumulus read much better (soft, shaded, varied); a few still have flat grey slab bases; the
  streaks again cross behind SPEAKEASY like speed lines; overall the day now reads like a poster.
  (5b-5) THE SPELL-ON (the owner loves it, Oct 23): a neon sign going dark, then lighting back up one letter at a time and
  staying on (Neon Pass 4's normal-night "spell" effect). Make sure EVERY neon sign (both roof signs + the blade) does it
  now and then on normal nights — staggered, never two at once, every ~few minutes somewhere — and keep it on party nights
  between show scenes.
  (5c) THE SIGNS RETHINK (Oct 22 — the owner: one-word signs like "STAKES" tell nobody anything; let the CITY be the neon and
  the billboards be old-school painted billboards, lit at night). Being decided one by one:
    - BLUFF (the neon box on the top-left roof): REMOVE (agreed) — it frees that tower's pink neon crown and un-stacks the
      left side.
    - DOUBLE AGENT (the billboard under it): AGREED — repainted properly as a 1920s painted billboard: the game's ICON + the
      FULL NAME, big, filling the board (no tagline — no room); the gooseneck lamps (6) on it; fixes its dull grey night look.
    - SIGNAL (the neon blade on the gold tower): KEEP as neon (the owner) — a little bolder / brighter, it's hard to read
      today; its marquee chase bulbs a touch bigger / brighter / more prominent.
    - THE BILLBOARD MUST BE BUILT, NOT FLOATING (the owner can't tell what holds it up): it sits on the ROOF of the mid
      building it's on (not the speakeasy) on a real steel structure — lattice legs / an A-frame, a catwalk along its
      bottom with a thin railing, the gooseneck lamps' arms rising from the catwalk — cast in the same sun / shade and dark
      at night except where the lamps light it. Check it makes physical sense (the depth check) at 390 / 402 / 430.
    - PART 8 EVENT — THE BILLPOSTER (the owner's idea): when the billboard changes game (once a day, with the nightly sign
      rotation), a worker climbs the ladder onto the catwalk and pastes up the new poster on a fixed daily schedule (e.g.
      mid-morning): a long-handled paste brush, the new poster going up in strips over the old one, the lamps' arms
      in the way, then he climbs down. Goes on the CITY SCHEDULE. Decide in Part 8 when the "day's games" flip so the
      board never shows a game before he pastes it.
    - THE THIN GLASS TOWER (back, left of the wheel) is the only building with no neon or lit windows on ANY night (the
      owner): EVERY NIGHT give it a FINE, dim outline like the other far buildings + a few lit floors / a soft glow in its
      glass; on party nights its outline joins the show and its glass picks up the party colours (beam / sweep
      reflections) — still the calmest tower, so it reads as far away. PARTY NIGHTS: it gets a SKY BEAM too (the owner: the
      gap in the row of beams looks odd) — thinner and fainter than the others since it's the farthest tower, a cool ice /
      white to suit the glass, joining the beams' colour sweeps; it may pass in front of the moon (physically right).
    - BLUFF's removal, the owner's rule: the building behind it must be FULLY finished where the box was — its whole
      outline traced in neon, its crown, windows and roof built out — never a black gap or a cut-off shape where the sign sat.
    - TWO-WORD NAMES (the owner: the blade showed just "STAKES", the left roof sign just "AGENT"): the blade is only ~20 pt
      wide on a phone, so a header word won't fit readably (dropped the T-header idea). THE SLOT RULE: the nightly rotation
      assigns games to slots by name — the vertical BLADE takes ONE-WORD names only (SIGNAL, CIPHER, BLUFF, PULSE, PRISM,
      OVERCLOCK…); TWO-WORD names (HIGH STAKES, DOUBLE AGENT, NEON PAR…) go to a ROOF SIGN (stacked on two lines) or the
      BILLBOARD (one line). Never a shortened name anywhere.
    - "REMOVE BLUFF" means REMOVE THE LEFT ROOF-SIGN SLOT (whatever game it shows that night — tonight it showed AGENT);
      every game keeps its turn in the other slots.
    - CIPHER + STAKES (neon roof signs, right): AGREED (the owner) —
      keep as the neon landmarks; always the FULL real name (HIGH STAKES stacked on two lines); visible steel lattice frames
      + a catwalk under the roof signs so their size reads as deliberate; any game whose name won't fit a roof sign gets the
      billboard that night. (4 sign slots a night instead of 5.)
    - The rule for every sign: never a shortened game name.
    - BUILT (DT1, Oct 23): 3 named signs a night + the billboard; long one-word names (OVERCLOCK, GRIDLOCK, SLIPSTREAM,
      RUMRUNNER) only fit the BILLBOARD (each once a week). PART 12 DESKTOP: the desktop layout drops the billboard today —
      it MUST keep a billboard (or give those games another readable slot), or those four games never show on desktop.
  (6) BILLBOARD LAMPS (the owner): every billboard / painted ad gets 1920s gooseneck lamps on arms over its top edge —
  the layout: TWO lamps on each side of the logo at top centre (four per board, the logo between them, the word below),
  warm old-school incandescent tone (~2700 K amber-gold),
  visible as hardware all day. They switch ON at late golden hour (the first thing in the power-up, a warm pool of light
  down the poster, before the windows and neon) and in the morning from dawn until a little after sunrise; off at midday
  (sunlight). At NIGHT they drop to a soft, dim wash once the neon is fully on (never competing with the neon; judge night
  side by side with / without — if they still distract, switch them off when the neon is up). Same lamps Part 7's ghost ad uses.
- CITY SOUNDS — THE HUNT LIST (the owner collects real recordings; CC0 / royalty-free, e.g. Freesound CC0, Sonniss GDC bundles;
  WAV 44.1 kHz; the builder trims + levels them like the neon set). The city NEVER goes quiet at night — it gets naturally
  quieter because it's less busy (fewer cars, people, boats; the hourly bell still rings, just sounding over a calmer city).
  Loops must be seamless, 1–2 min. Grouped by when they're needed:
  - PART 7 (the speakeasy + the raid): a muffled club through a wall (crowd murmur + laughter, a party version louder) — the
    jazz itself is our own music, low-passed; a door opening/closing (heavy wood, a moment of loud jazz); a cat's meow; a TV
    murmur through a window (late night); 1920s police cars (old engines rolling by, tyres on wet road); a soft distant
    1920s siren wail (rising and falling).
  - PART 8 (the promenade, people, vehicles, the city schedule): harbor water lapping at the quay (loop); a distant city hum,
    day and night versions (loops); light far-off traffic (loop) + single cars passing; a bus's air-brake hiss + idle + pulling
    away; the HOURLY SHIP'S BELL; the NOON STEAM WHISTLE (1920s steamboat / factory); a big ship's horn (the 7 pm dinner
    cruise); gulls (several distant calls); a friendly distant dog bark or two; a farmers' market murmur (Saturday); milk
    bottles clinking / a delivery truck (dawn); a trash truck (Monday).
  - PART 9 (seasons + weather): morning birdsong (spring/summer); summer-night crickets; autumn wind through leaves; winter
    wind; snow's muffled hush; a distant FOGHORN (real fog); rain on pavement + on the water (rain + thunder exist already).
  - PART 10 (party nights + fireworks): real fireworks (launch whoosh, bursts near + far, crackle / glitter); a crowd cheer
    (fireworks, the NYE countdown); the party yacht's music + a helicopter landing.
  - 6b + THE SKY: a helicopter (distant + flyby); airliners far up; a prop plane drone (the banner plane, skywriting); jets
    flyby (the air show); a hot air balloon's burner whoosh; geese honking; the UFO saucer's low hum + the abduction beam; the
    TR-3B's deep drone + electrical crackle / power-down (the blackout); witch cackle + sleigh bells (holidays).
  - PART 9's CONSTRUCTION TOWER: a warning siren + horn blasts, the implosion's charges + a long rumble, distant hammering /
    a crane.
  - LEGENDARY EVENTS: the ghost ship (creaking wood, a ghostly bell), the harbor monster (a big splash), the party yacht.
- THE SATURDAY 10 PM DRONE SHOW (the city schedule; ~4–5 min, a different running order each week, the player's local time):
  the show opens with "NEON SPEAKEASY"; then 3–4 picks from a rotating set — a heart, a star burst, two or three game logos
  (a different few each week), the week's season (a pumpkin in October, a snowflake + a tree in December, a shamrock in March,
  a flag on July weekends, flowers in spring), the ₿ now and then (rarely, a nod), a cocktail glass, the lighthouse, a
  Ferris wheel that turns, "SEE YOU INSIDE" to close; colours per Neon Pass 2. CITY CONTROL can override the running order.
- THE CITY SCHEDULE (the owner's idea — set-your-watch routines on the player's own clock; built in Part 8 with the people and
  vehicles, Part 10 adds party nights + the weekly drone show; sounds join the soundscape). iPHONE-FIRST — only what reads on
  a phone (near promenade, the big skyline, light changes, sound); far-shore detail is desktop / TV only.
  (Owner decisions after review #2, Oct 22: perf gate = relative A/B in one run only, absolute budgets are per-tier
  warnings, her iPhone decides; the Harbor's Safari floor = iOS 16 (the games + City 1.0 must still run on older iOS);
  revert the playwright change; hide the UFO + MOON CAT panel rows until 6b.)
  THE "ALWAYS SOMETHING HAPPENING" RULE (the owner, Oct 22): whenever anyone opens the city, they should be able to catch
  something cool already IN PROGRESS. So: (1) never stack the routines at the same time — spread them across the day and
  week so no hour is empty (e.g. the billposter, the ghost-ad sign painters on Monday 8–11 am, the tower construction,
  the speakeasy window scenes, the steamer's whistle, the planes, the wildlife each in their own slots); (2) make the
  routines LAST — painting, pasting, building take minutes to hours, in visible stages, so you arrive mid-way; (3) every
  event (incl. the rare + legendary ones) JOINS MID-WAY on load, never only from the start; (4) a planning table in
  docs/harbor.md: each hour of the week vs what's running, so gaps are visible; Part 13's CITY CONTROL shows it.
  Includes sunrise / sunset, seasons, weather, holidays — the whole city, not just Part 8.
  THE WORKERS' SCHEDULE — DECIDED (the owner + Claude, Oct 24; built in 8b on the 8P people system; the 8P figures +
  the director's budget; the panel can force each one). THE PRINCIPLE: most people open a party-game site in the EVENING
  (7–11 pm prime), then lunch, then after work — so the big shows sit where people look; the early morning stays light
  but leaves TRACES that are still visible later. Set-your-watch FIXED regulars (to the minute, weekdays): the milk truck
  6:00, the newsboy 7:00, the barber 8:30, the beat cop 9:00 am + 9:00 pm; everything else in a time WINDOW with
  randomness. Period look with some charm: trucks, not horses.
  - WEEKDAYS (Mon–Fri): ~5:30 the street sweeper (broom cart; a wet streak left drying on the cobbles); 6:00 the milk
    truck (bottles left on the speakeasy step — they stay there until the barber takes them in at 8:30); mid-morning the
    ice man (an ice block with tongs to the side door); 7:00 the newsboy sets up his stand (bundled papers waiting before
    he arrives), sells until ~10, and comes back 5–7 pm for the EVENING EDITION; 8:30 the barber rolls out the awning,
    flips to OPEN, takes in the milk, sweeps the step; 9:00 am the beat cop strolls through (baton twirl, tips his hat —
    friendly, not the raid); ~10:30 the mailman to the barbershop; late morning → noon the WINDOW WASHERS (Tue + Fri);
    THE VENDOR SPOT (front curb, middle, below the compass — decided Oct 24): the newsboy's small stand ~7–10 am + ~4:30–6:30 pm, the CHESTNUT CART ~6:30–9:30 pm in the COLD months only (Oct–Mar; steam + a warm glow under the lamps), empty in between; nothing there while the compass is in use; ~2 pm a "SODA WATER" delivery truck, crates to the side door (wink); ~4 pm the bartender arrives (the
    window moment); ~5–6 pm the BILLPOSTER changes the roof billboard (the daily game change); dusk: the DOORMAN takes his
    post at the speakeasy's side door (guests whisper the password, he lets them in — ties to the hush word sign + the
    lobby line), a FLOWER SELLER sells to couples heading in, the street lamps switch on one by one; ~8 pm a MUSICIAN
    arrives with an instrument case (the band); 9:00 pm the beat cop again; ~11 pm (rare, a few nights a month) the
    BOOTLEGGERS: a quiet truck, crates passed down the basement hatch, a lookout on the corner; ~2 am the bar staff lock
    up and leave.
  - SATURDAY: no commuters, a later start, the newsboy selling the weekend edition, a busy afternoon (more strollers), the
    bootleggers' big delivery before the party night.
  - SUNDAY: quiet and sleepy — hardly any workers, a few strollers.
  - WEEKLY: MONDAY 1–4 pm the SIGN PAINTERS repaint the blade (moved from 8–11 am — more people see it); Tue + Fri late
    morning the window washers; Wednesday the rooftop gardener.
  - CAUSE AND EFFECT (the city notices itself — all in the FOREGROUND): a blade bulb / letter goes out (~once a week) → the
    next morning a repairman leans a tall ladder on the speakeasy corner, swaps it, tests it with a flicker, climbs down;
    a lamppost flickers (a couple of times a week) → a short ladder at that lamp the next morning; a billboard lamp burns
    out → the billposter fixes it on his next visit; the FAR roof signs' dead letter fixes itself overnight with the
    letter-by-letter spell-on (no worker — too far to see); the morning after a party night: extra sweeping + a cleanup
    crew on the roof; rarely the RAID comes the night after a bootlegger delivery (the raid gets a story); Part 9: snow
    shovelers + a salt cart, leaf rakers in autumn, coal down the basement chute in winter.
  - THE HARBOR: no harbor workers (too small to read); its schedule shows through boats + light instead — a fishing boat
    heads out at dawn with a bow lantern and returns late afternoon, Rosie sounds her horn and leaves the pier on a
    timetable (~10 am, 2 pm, 6 pm), the lighthouse lamp switches on at dusk.
  - Never stack two worker shows at once; every one JOINS MID-WAY; the hour-by-week planning table (above) shows the gaps.
  - PHONE: the street lamps switch ON one by one at sunset and OFF one by one at sunrise; a ship's bell rings each hour; the
    paddle steamer's STEAM WHISTLE at noon (a white steam plume + the sound); dog walkers at sunrise + sunset (more on
    weekends); the morning rush (more buses, people with coffee on the promenade); the lunch crowd at the food cart; the
    office towers going dark in waves after 5–6 pm; the dinner cruise leaving the pier at 7 pm, lit up; the line at the
    speakeasy door; the last bus at midnight; a few stragglers wandering home after 2 am last call; a newspaper / milk truck
    on the road at dawn; the Saturday-morning FARMERS' MARKET on the plaza (stalls + awnings); Monday trash day.
  - PHONE BY LIGHT ONLY: the theatre marquee on the far shore chases brighter at 8 pm showtime and dims after 10:30; the
    waterfront shops light up in the morning; the fishing boats' lights heading out at dawn and back at dusk.
  - DESKTOP / TV ONLY: the theatre crowd, shop shutters rolling up, people on the far quay.
  - THE BIG MOMENTS DUCK THE MUSIC (the owner): for the prominent routine sounds — the noon steam whistle first, also the
    dinner cruise's horn at 7 pm and the Saturday drone show — the music dips gently (duckMusic) just before, the sound plays
    clearly, then the music slowly ramps back up over several seconds. The small ones (the hourly bell) play under the music
    without ducking. Only a few ducks a day, so it stays special.
- THE DAY PASS (after Neon Pass 2, before 6b; the owner: by day, high noon especially, "it looks pretty rough"): signs read by
  day through PAINTED faces (enamel boards, bold solid letters, tubes faint on top), the skyline lit by the real sun (lit vs
  shaded sides, soft setback shadows, bright ledge lines), real aerial depth, windows reflecting the sky, a real daytime sky +
  clouds, a white-hot sun with bloom, the water by day. Night / dusk / party unchanged.
- 6b section 0 — THE SIGN MAKES ROOM FOR SKY MESSAGES (the owner's idea): for a drone show or skytyping/skywriting, the NEON
  sign (and tagline) power down on purpose — a soft dim with a flicker or two, the dropout sound — AND its glass then fades to a
  faint ghost (~15%), so unlit tubes never cut through the message (by day the sign is already off: the glass just fades out
  and back in); the message fills the open sky, big and high, readable at a glance; drone shows are night only; it stays fully readable ~15 s after it's complete, then the sign re-ignites (the
  warm-up + the power-on, the hum fading in 10 s) and the message carries on fading behind it (smoke drifting, drones
  scattering / landing). The dock never changes. Not for the banner plane (it has its own lane), never during the NYE countdown
  or the catch; re-scale the drone formations / skytyping for the full sky — after Neon Pass 3 the formation sits in the
  small band between the skyline and the tagline (the owner: "it only uses a very small part of the sky"); with the sign
  gone it fills the sky from the crowns up to near the top safe area, big. DRAW ORDER BUG: drones (and smoke, planes,
  balloons) must draw IN FRONT of the moon, the sun and the stars — never behind them (the moon is far away).
- 6b — THE TR-3B's EFFECT ON THE MUSIC (the owner's idea): as it nears, the music "loses power" — a TAPE-STOP slowdown (the
  pitch and speed sagging), a closing low-pass, a little crackle / warble of interference — sinking to near silence under the
  craft's deep drone; it stays down while it passes; after the CHASE jets leave the screen the music powers back up — filter
  opening, volume fading back in over a few seconds. Lobby / synced songs re-sync to the room's clock when they return (no
  drift). Title + lobby only (never in a game); with music off, only the drone + the crackle play. Uses the existing
  duckMusic / filterMusic + a playback-rate ramp.
- 6b — THE ABDUCTION + THE TR-3B MUST BE CINEMATIC (the owner, Oct 24: "absolutely cinematic, beautiful, jaw-dropping,
  stunning"; his REFERENCE painting is saved at docs/harbor/refs/abduction.jpg (commit the refs/ folder in step 0 if it isn't yet) —
  STUDY it first, and any other image in refs/).
  What the reference shows, and what to match: THE POSE — the figure ARCHED BACKWARD, limp, lifted from the chest / small
  of the back as if a string pulls him up: chest highest, head dropped back and down, arms hanging loose below with fingers
  open, knees bent, feet trailing — the classic abduction pose, never upright or stiff; he turns slowly as he rises, the
  hat / coat tails lifting. THE BEAM — a WIDE, SOFT cone from the saucer's glowing underside ring, not a hard laser tube:
  pale light with faint colour shifts, slowly falling / rising PARTICLES and shimmering dust inside it, soft edges that
  bleed into the air, brightest near the craft, lighting the ground (and the promenade, the water, the trees) from above,
  long shadows thrown outward. THE CRAFT — seen slightly from below: a dark, glossy saucer (deep violet / near-black, the
  city's neon reflecting on its hull), a ring of evenly spaced rim lights, the glowing concentric ring on its belly. THE
  STAGING (a short film, ~20–30 s): an approach (hum, the lamps flickering under it), the beam opening, the lift (slow,
  then faster), the figure vanishing into the light, the beam closing, the saucer leaving fast; the city's lights dip
  near it; music handled like the TR-3B (a dip + filter). The TR-3B gets the same level of care: a huge, slow black
  triangle, corner lights + a pulsing centre glow, the power drain rolling across the city, then the jet chase. Both:
  the best-looking moments in the whole city, refine with frame bursts until they're truly jaw-dropping.
- FP3b REVIEW NOTES (the owner's iPhone, Oct 25 ~1:30 am): (1) THE SPEAKEASY DOOR: close but not perfect — the swing is
  jaggy; people EXITING look OK but people ENTERING walk in at a WEIRD, unnatural ANGLE (corrected by the owner: they do walk in, not fade) (seen at night on a party
  night; even more noticeable by day). (2) THE DOOR LIGHTS: brighter, so the light FLOODS each speakeasy door and the door
  is clearly noticeable; the LEFT door's lamp must be CENTRED above that door. (3) THE CHESTNUT CART looks good; its
  lettering is very hard to read on the phone — bolder, or just "CHESTNUTS" so the letters can be bigger; the stovepipe is
  hardly noticeable and he saw NO glow and NO smoke — reconsider the chimney (make the glow + smoke actually show, or drop
  it and keep a plain, handsome cart). (4) THE "EST. 1924" STONE: all right at best by day; AT NIGHT it looks like CHEAP
  PAPER with words on it (screenshot). (5) THE GLOW-WAND DANCE: looked cool-ish, but OFF-BEAT (it seemed to try to pulse
  with the music but missed), the arm moves RIGID instead of fluid, and every dancer doing the EXACT same moves looks
  weird — vary them. (6) REMOVE THE IVY altogether. (7) THE WINDOW BOX: keep for now, but it's close to being removed
  ("looks too cheap"). (8) THE BUS looks like a FIRE TRUCK — not red (the maroon reads red at phone size): a different
  colour. (9) THE BUS DOORS: open a bit longer — between the original (too long) and now (too short).
  Claude's calls (Oct 25): the BUS → CREAM over DEEP NAVY BLUE with gold lettering (not red / maroon, not green — the cart
  is green); the DATE STONE → set INTO the parapet as carved stone (not a pale panel standing on the roof edge), at night in
  the stone's own dim tone lit by a soft grazing light from below so the carved letters cast shadows — if it still looks
  cheap, remove it; the CART → "CHESTNUTS" big + bold on its side; the stove's glow + smoke made clearly visible, or drop
  the chimney for a plain handsome cart; the DANCE → each dancer their own move set + timing offsets, fluid eased arms
  (swings, waves, spins), on the SAME beat clock as the city's lights. SPREAD THEM OUT across and around the compass (not
  all bunched in the exact centre), loosely in a ring; they may sway together now and then, but each moves in their own way.
  (10) THE DATE STONE must not look so WHITE / clean: aged stone — a warm grey-buff tone, weathering STAINS + darker
  streaks running down from the top edge, soot in the carved letters, a few chips + spots, lichen-dark corners.
  (11) THE CARS on the street at the bottom (the sedan crossing under the dock, + every vehicle to come: the police cars,
  cabs, the bootleggers' truck, the trash truck) look too CARTOONISH: rebuild them as late-1920s / early-1930s "MOBSTER"
  cars (think Packard / Cadillac / a Ford Model A — not a boxy Model T): a LONG HOOD with LOUVERED side vents, a tall
  upright chrome grille, big round headlamps on a bar, sweeping FENDERS that flow into RUNNING BOARDS, a spare wheel on the
  side or back, a rounded roof, spoked or wire wheels; deep glossy paint (black, maroon, bottle green, navy) with chrome
  glints and real shading; lit headlamps + a rear lamp at night. Premium, crafted, readable at phone size.
  CLARIFIED (the owner, Oct 25 ~2 am): not ONE car type — a VARIETY across BOTH roads (the back road by the crossing + the bus,
  and the street under the dock): a Model T, a Model A, a big Packard / Cadillac sedan, a roadster with a rumble seat, a
  coupe, a delivery van, a checker taxi — period-styled (~1915–1935), varied colours, never the same car twice in a row.
  The city is a neon-1920s FUSION, so the cars are period but may carry a touch of it (e.g. a soft neon underglow / lit
  trim on a few cars on PARTY NIGHTS only). The sedan he saw on the near street was the one that looked off.
- 6b REVIEW NOTES (the owner's iPhone, Oct 25 ~12:45 am — "a legendary run"; collecting):
  (1) THE UFO SAUCER looks CARTOONISH — the concept (rotating lights round the rim) is right, the craft needs a lot of work:
  a MIRROR-SILVER polished metal hull (reflecting the city's neon + the night sky, crisp specular highlights), a
  TRANSLUCENT glass DOME on top (faintly lit inside), the rim lights rotating; the UNDERBELLY a PULSATING ORANGE glow,
  which is then OVERTAKEN by the tractor beam when it opens. THE BEAM looks good — make it MORE CONCENTRATED in the centre
  (a brighter core fading to the soft edges). THE ABDUCTED PERSON is PERFECT — don't change him.
  (2) THE TR-3B ("man, that looks good" for a first attempt — needs polish): (a) it's JAGGY / LAGGY when it comes on screen —
  his iPhone readout during it: 14 % slow (session 17.5 %, after-10-s 25.9 %), the tier stepping 2→1→2, "heavy 1/2" — a
  REAL performance problem on the phone, not just the laptop: make it smooth at tier 2 (pre-bake the blackout states, no
  per-frame re-renders of the city, cheaper strips) — UPDATE 2:19 am: on a second try from the panel it ran SMOOTH (the
  first lag may have been a first-run bake / load), keep the perf check anyway; (b) KEEP ITS SIZE (the owner changed his
  mind: "I liked the size" — NO shrink) and make it more polished + detailed (panel lines, edge lights, the centre glow)
  + "weird stuff": glowing CIRCUITRY traces etched across the hull with light PULSES RACING along them (alien tech); (c) THE BLACKOUT: keep the flicker-out as it arrives (he likes it), but then
  a COMPLETE BLACKOUT — the whole city dark (every building, window, neon, sign, lamp) while it crosses, staying dark
  through the JET FLYBY; only after the jets leave does the power FLICKER BACK ON from the BACK of the city to the FRONT
  (far skyline first, the foreground last), uneven and stuttering.
  (2f) THE TR-3B's SOUND: he heard nothing / it wasn't noticeable — the tr3b-drone + tr3b-powerdown slots are filled but
  sit too low (and too deep for phone speakers): raise them, add mid-range presence (a growl / buzz phones can play), the
  power-down audible as the city dies, a power-restore sound as it flickers back (new slots — Grok's second try).
  (2g) THE MUSIC DRAIN must be DRAMATIC (the owner: "really slow down… deepen… a crazy effect", never just cut out): as the
  craft nears, the song SLOWS + its PITCH DROPS deep (a record losing power: down to ~50–60 % speed, a heavy warble +
  wow, a low-pass closing, crackle), held low and strange while it's overhead, then after the jets leave it SPINS BACK UP
  to speed + pitch and catches back to where the song should be (lobby songs stay in sync).
  (d) THE CHASE JETS' SOUND lags the jets by ~5 s (like the air show's known issue): sync it — the roar peaks as they cross
  the screen centre (trim the recording to its peak, start it just before they enter), panned with them. (e) THE JETS need
  MUCH MORE DETAIL ("a good start"; the night exhaust + Mach diamonds look good): a real F-16 shape (bubble canopy, the
  intake under the nose, the single tail fin, strakes), grey two-tone CAMOUFLAGE paint with panel lines, USAF roundels
  (the star-and-bar) on the wings / fuselage + a small AMERICAN FLAG on the tail, wingtip MISSILES + underwing ordnance on
  pylons, formation + nav lights at night — readable at phone size (they're small: big shapes + light, then detail).
  (3) THE SUN'S NEW ARCH (Dec / Oct / Jun noon): "looked amazing" — KEEP.
  (4) THE BIPLANE looks CHEAP — make it premium (a real 1920s barnstormer: two wings with struts + wires, a radial engine
  + spinning prop, fabric texture, red paint with a white trim, a pilot's head + scarf); its smoke trail THICKER, lasting
  LONGER and more diffused (billowing, drifting with the wind); its route: LOOPS AROUND THE LETTER O, then threads
  between the strokes of the final N on its way out.
  (5) THE SUN HALO reads as "a very obvious circle of clouds" — wrong. A real 22° halo is a FAINT, THIN ring of light (not
  a cloud) in a high thin veil: barely-there brightness, a slightly reddish inner edge, the sky a touch darker inside
  the ring; very subtle. Add SUN DOGS as a rarer bonus with it: two small bright rainbow-tinted spots level with the sun,
  one on each side at the same distance (~22°), red on the side facing the sun. The veil itself = a milky thin layer
  over blue (the sun softened, never a grey deck).
  (6) THE MOON: much better — he loves it. KEEP. THE AURORA: better (no vertical shafts) but ALL ONE GREEN: add the real
  colours — green in the middle band, PINK / magenta along the lower fringe, deep RED / crimson high at the top,
  sometimes a touch of violet; shifting slowly.
  (7) FOG AT NIGHT: THE LIGHTHOUSE BEAM still reads as weird FLAT 2D beams — FABLE's next review must look at it (why it
  looks flat: a 2D wedge with no volume / perspective / falloff?) and recommend a real volumetric look; the searchlights +
  party beams in fog too (6b's known issue). THE DRONES look good but have NO SOUND — wire the drone-swarm slot (the
  layered soft hum) to the show. SKYTYPING by day looks really good, except in front of the SUN the letters lose
  contrast — give the sky letters the SAME dark soft halo the NEON sign / tagline have (only shows where something bright
  is behind).
  (8) THE AIR SHOW was "comically bad": basic flat jets, jerky contrails / smoke, an abrupt pull-up into a perfect circle.
  DECIDED (Claude's recommendation, the owner: "if it doesn't look good, we shouldn't even do it"): DROP the loop
  manoeuvres; keep only what can look great — (a) the FORMATION FLYBY: four jets in a tight diamond, straight across the
  sky, smooth and fast, trailing smoothly spreading smoke / contrails; (b) THE MISSING MAN on its days: four jets straight
  across, and one pulls up in a smooth, gentle climb (an eased curve, never a snap) and peels away into the sky while the
  others continue. Both use the upgraded F-16 (note 2e: camo, emblems, flag, missiles, detail). Trails: continuous,
  sub-pixel, eased, spreading + fading — never segmented or jerky. Their sound in sync. If they still don't look premium
  after the polish pass, CUT the air show (the TR-3B chase keeps the jets).
- THE PEOPLE: CALMER (the owner, Oct 25 ~2:50 am — "a little too chaotic": too many walking briskly, in and out of the
  speakeasy). DECIDED: COUNTS on screen — weekday daytime 4–5; lunch + after work 6–7; normal nights after dark 3–4;
  WEEKEND + PARTY NIGHTS 8–12 (the dance circle's dancers on top); late night 0–3. LINGER MORE, PASS THROUGH LESS: most
  people stay a while (1–2 on the bench for minutes, one at the railing looking at the water, a pair chatting, someone at
  the bus stop, someone at the cart); a few walk straight through (cross → the sidewalk → behind the speakeasy).
  THE SPEAKEASY STAYS SECRET: by day only the occasional barbershop customer; evenings a trickle at the side door (a
  couple every few minutes); PARTY NIGHTS a steady stream + A LINE AT THE DOOR (queued where the lobby line forms, left of
  the left lamp, the doorman letting them in a few at a time). Arrivals SPREAD OUT (never a burst). Pace unchanged.
- THE BEAT SYNC IS STILL OFF (the owner, Oct 25 2:38 am, frustrated): PARTY ON forced from the panel at 2:37 am (real time
  Sunday), the song c2-evening5 — an EVENING song (its grid IS trusted, lock 3.39) — and the lights out of sync with it.
  Found so far (Claude, reading the code): (1) forcing the PARTY from the panel doesn't switch the music to a PARTY song —
  core/city-mood.js picks the mood from the real clock (the "same clock" rule from the BEAT pass isn't applied to the
  panel's party toggle); (2) the sync itself is off even on a trusted grid → needs the readout's beat lines (asked).
  Next sound/beat pass: the panel's party (and every forced show) drives the music mood too; the lights' punch stays on
  the trusted grid; and a SAFETY RULE — if the measured "heard" offset can't be confirmed within a few bars, the lights
  fall back to a gentle breathing pulse (never a hard punch that's visibly off-beat).
- WITNESSES FLEE THE ABDUCTION (the owner, Oct 25 — for 8b): when the saucer arrives, everyone else on the promenade
  REACTS: they stop, look up, a couple point; when the beam opens they FLEE IN FEAR — a real run cycle, scattering in
  different directions to the nearest exits (the screen edges, the crossing, the side door), one ducking behind the bench
  or a tree before bolting, a dog tugging its owner away, the pigeons bursting up; nobody stands calmly watching. The
  promenade stays EMPTY for a while after the saucer leaves, then people slowly drift back. (The TR-3B: people stop and
  stare up as the city goes dark, a few hurry indoors.)
- THE DRONE SHOW = A MESSAGE, NOTHING ELSE (the owner, Oct 25): no intro formations, no heart / shapes — it's the NIGHT
  version of skytyping. The drones rise / converge from below the skyline and form the MESSAGE right away (its pages in
  turn), hold, then disperse. (Holiday shapes, if ever, only by an explicit holiday choice in Part 11.)
- THE SURPRISE FLYBY (the owner, Oct 25 — agreed): a RARE unexplained military flyby, ~TWICE A MONTH on random days (seeded,
  the same for everyone), from GOLDEN HOUR until 11 pm (the owner: they look best in low light + at night; weighted toward
  after dark): 3–4 of the shared F-16s in tight formation scream straight across the whole screen, a random direction, afterburners lit with Mach diamonds, the roar in sync, the music
  dipped briefly. No explanation, no story — a "did you see that?!" bonus. Never on a legendary night, never during the
  TR-3B; a &force=flyby preview.
- 6b — LEGENDARY SKY RARITY (the owner): the UFO abduction ~1–2 a month, the TR-3B + its jet chase ~1–2 a month (the same
  nights for everyone, seeded), never two legendaries the same night; the barnstormer a few times a week.
- 6b — THE TR-3B BENDS THE MUSIC (the owner's idea): as it nears, the music POWERS DOWN like a record player losing
  power — the pitch and speed sag (a "tape stop"), it goes muffled (filterMusic low-pass) with a faint warble and electrical
  crackle; while it's overhead the music is almost gone, only a low hum. After the jets of the chase leave the screen, the
  music comes back — a soft power-on, then a smooth fade back up to normal over a few seconds. With music off, the
  soundscape gets the same treatment. Title / lobby screens only; never in a game; follows the music setting.
- 6b — THE TR-3B's CHASE (the owner's idea): a few seconds after the TR-3B leaves the screen, 2–3 military jets in tight
  formation SCREAM across in a straight line after it — afterburners blazing, green formation lights at night, a roar that
  rises and Dopplers away (the sound list), the city's lights still flickering back on in their wake. Every TR-3B pass ends
  with the chase.
- 6b — THE TR-3B's POWER INTERFERENCE: it affects EVERY power source within its range — windows, neon outlines, signs, the
  NEON sign, street lamps / lamp posts, string lights, searchlights + sky beams, the wheel's bulbs, the lighthouse, the
  HEADLIGHTS + lights of cars, the bus and the boats — like the energy is being SUCKED OUT: a gradient by distance (the edge
  of its range dims and flickers, anything close shuts off COMPLETELY), moving with the craft, then restoring unevenly as it
  moves away (details below).
- 6b — THE TR-3B's POWER INTERFERENCE (the owner's idea): the black triangle crosses the WHOLE screen, big and slow, and the
  city's lights under it fail as it passes — a moving zone below and around it where windows flicker and go dark, neon
  stutters and dies, street lamps buzz down, the NEON sign glitches if it passes over; a soft electrical crackle / the hum
  dropping out, then everything flickers back on behind it, a few lights slow to recover. At night the dark craft is noticed
  BY the lights dying under it (its three orbs + the red centre the only lights of its own). IT MUST BE CLEARLY VISIBLE (the
  owner): fly it through the band just above the skyline where the city's coloured glow lights the haze, so it stands out as a
  sharp black silhouette against the glow; a thin rim of city light along its edges; it blots out stars and the moon as it
  passes; its orbs bright and pulsing; best at the blue hour or on a hazy / low-cloud night (lit cloud base behind it), never
  against plain black sky. Cheap: a moving dimming mask
  over the baked layers + a few individual flickers.
- 6b section 0 — SHOOTING STARS RARER (the owner: "they happen pretty frequently"): today core/sky.js#meteorsOf gives 0.1 a
  minute on ANY clear night (one every ~10 min) and 3.2 a minute on a shower's peak, 1.1 a day either side (the Orionids peaked
  Oct 21, so she saw a lot). City 2.0 only: a normal clear night ~1 every 30–45 min; a shower's peak night ~1 every 2–3 min,
  ±1 day ~1 every 8–10 min; plus a RARE bright FIREBALL (a big slow green-white streak that breaks up, a few times a year — a
  City Sightings badge later). Keep the moon's three-tap shooting star. REBUILD THE ART (City 2.0 still uses City 1.0's thin
  line + dot, district/fx.js): a tapered streak with a hot bright head, a faint colour tint (green, blue-white, a touch of
  orange), varied speed / length / angle / brightness, the odd one flaring and breaking into sparks, a faint glowing trail that
  lingers a moment; on a shower night they all fly out from the shower's real radiant point; the bright ones glint on the water.
- 6b section 0 — THE HELICOPTER's DEPTH (the owner): it flies in sky-low, the lane that passes BEHIND the taller towers, yet
  its searchlight lands on the harbor in FRONT of the skyline — impossible. Fix: the helicopter flies OVER THE HARBOR, in front
  of the skyline (a real depth between the far quay and the pier, drawn after the skyline, sized for that distance), so it never
  slips behind a tower; the beam drops straight down from it to the water below it in perspective, its pool + glint where it
  lands, reflected; when it leaves it climbs away over the city (smaller) with the light off, or exits past a side.
- 6b section 0 — FLUFFY CONTRAILS BACK (the owner loved City 1.0's): City 2.0's capped contrails (air.js: 6 batched strokes,
  ≤ 60 samples, a 22 s life) are cheaper but read thinner / smoother. Bring back City 1.0's soft FLUFFY look — puffy, billowy
  edges that slowly spread, drift on the real wind and dissolve, a little longer life (~30 s) — while keeping the cost capped
  (e.g. a soft puff sprite stamped along the path into a small layer, refreshed a few times a second). Same rules (high planes,
  dry, not overcast, by day / golden hour, pink-gold at sunset).
- 6b — THE BARNSTORMER THROUGH THE SIGN (the owner's idea): a rare stunt (a few times a week) — a 1920s barnstormer biplane
  THREADS THROUGH THE LETTERS: behind one stroke of the O and in front of the other, weaving round the N, maybe a loop; the
  one planned exception to "nothing flies across the sign" — the plane is drawn BETWEEN the sign's layers using the letters'
  mapped paths (LOGO_ANCHORS / the tube paths), so the right strokes sit in front of it. By day a bright red biplane with a
  thin smoke trail; at night wingtip lights glinting on the tubes and the sign's pink glow lighting the plane; the letters
  wobble / flicker a touch in its wake. &force=barnstormer; a City Sightings badge later.
- 6b section 0 — SKY MESSAGES: LONGER, BIGGER, IN FRONT (the owner): skytyping (day) and the drone show (night) share ONE
  message layout. While a message flies, the NEON sign + tagline DIM (not vanish) and the message draws IN FRONT of the dim
  sign, using the whole sky from just above the crowns up to the top safe area. Words wrap at word boundaries into up to
  3 LINES (~16 letters a line) per "page", letters as big as the space allows (much bigger than today); longer messages play
  as PAGES in sequence (the drones re-form / the jets type the next page), up to ~3 pages (≈ 140 characters, a couple of short
  sentences). Examples that must work: "HAPPY BIRTHDAY JESSICA", "HAPPY NEW YEAR FROM NEON SPEAKEASY", "GAME NIGHT TONIGHT ·
  9 PM · BRING FRIENDS". Banner-plane messages keep their own limits. Check every example at 390 / 402 / 430 by day and night.
- 6b section 0 — SKYWRITING IS CUT (the owner, Oct 23: "if we're already doing the dot-matrix thing, let's not double up"):
  remove the single-plane smoke-cursive skywriting (code, the &force= preview, the panel row, its schedule); every sky text
  message is SKYTYPING (+ the banner plane, the drones). Messages that used skywriting move to skytyping. THE SKYTYPING
  PLANES REBUILT (the owner: "very jagged", "they look very cheap"): SKYTYPING by a formation of sleek JETS (the owner's
  call) with glowing AFTERBURNERS (a hot cone + heat shimmer, brighter at dusk / night), crisp nav lights, the formation
  sweeping in tight, holding perfect spacing, puffing the dot letters, peeling off with style.
- 6b — THE MILITARY JETS (the air show + the F-16 missing man, already planned): they must look BADASS — sharp F-16 silhouettes,
  grey camo, wingtip MISSILES + pylons, glowing AFTERBURNERS on the pull-ups, green FORMATION (slime) LIGHTS + nav lights at
  dusk / night, vapour cones on high-g turns, tight formations (diamond, the missing-man pull-up), a low rumble that follows
  them (sound list). + MACH DIAMONDS (the owner, Oct 24 — for every afterburner, above all the TR-3B CHASE jets): the
  afterburner plume shows SHOCK DIAMONDS — a row of 4–6 bright, evenly spaced diamond-shaped nodes in the exhaust (white-hot
  at the nozzle, then blue / violet / orange nodes fading down the plume), flickering slightly, the plume long enough to
  read them at phone size; brightest and most striking at night (a soft glow around the plume, crisp nodes — never a
  smear). Dimmer by day, still visible.
- 6b section 0 — THE BATS' JITTER (a bug the owner saw): the night bats' flight looks jittery — find the cause (frame-time
  steps, random per-frame direction, rounding) and make it the real fluttering, swooping bat flight: smooth paths with quick
  erratic darts, not per-frame noise.
- 6b section 0 — CLOUD LEFTOVERS FROM THE SKY POLISH (the owner's iPhone, Oct 23: cirrus 8/10, cumulus 8–9/10, overcast
  "looks great", morning sun OK; beams now light the clouds; the moon ring gone; cloudy party 0.2 % slow after 10 s):
  (a) the SMALL cumulus still look like little cartoon clip-art clouds (flat bottom + three round bumps, similar sizes,
  evenly scattered) — make the small ones irregular broken fragments / wisps of varied shape, fewer of them, never the
  icon shape; (b) OVERCAST: the small dark floating puffs at the tagline height look off — make them ragged, soft, darker
  fractus that melt into the deck (or drop them); (c) OVERCAST cost: 3.7 % slow after 10 s at noon (work 1.9 ms) — find
  the stall (the deck's drift / a large layer upload?) and trim; (d) cirrus: a touch more feathered and fewer
  straight-ish strands (the owner: better, "not quite there"). (Contrails: smooth now ✅.)
  BUILDINGS BY DAY: the owner rates them 7–8 / 10 (night is the bar) — they look "a little FLAT". By night the neon draws
  every edge; by day nothing does. The fixes, biggest first: (1) CAST SHADOWS between buildings — a taller tower shading
  the face of its neighbour / the one behind it, along the sun's real direction (the strongest 3D cue, missing today);
  (2) AMBIENT OCCLUSION — darker where setbacks meet walls, under ledges / cornices, in inside corners, at the street;
  (3) RECESSED WINDOWS — a thin shadow line on the sill / reveal on the sun side, so the facade has depth instead of
  printed squares; (4) MATERIAL — rusticated stone bases, brick tone variation, terracotta bands, a slight gradient up
  each facade (darker at the base, brighter toward the top); (5) a bit more lit / shaded contrast still. → the DB pass.
  + THE BILLBOARD'S GOOSENECK LAMPS (the owner, Oct 23): bolder, more prominent — today they're tiny specks. Bigger
  dark-enamel shades (~6–8 pt at 402) on clear curved arms that read by day; when on, a bright warm bulb point in each
  shade + a visible soft cone of light down the poster; still four, framing the logo, never covering it.
- 6b section 0 — THE RAINBOWS' ARC TOO LOW (the owner: "the neon rainbow arc is way too low"): City 2.0 still draws City
  1.0's bows (district/rainbow.js, fitted to the district's horizon) — re-fit every bow (the rainbow, the double, the moonbow,
  the NEON BOW) to the Harbor: a big, tall arc rising from behind the skyline / the far shore into the open sky, its real
  geometry (opposite the sun / moon) kept, never over the NEON word, glance-tested at 390 / 402 / 430. &force=rainbow,
  rainbow2, moonbow, neonbow.
- 6b section 0 — THE BALLOONS RE-RENDERED, PREMIUM (the owner: "render them really good, make them cool"): crafted envelopes
  with real gores (the vertical panels), fabric shading + a soft highlight, the mouth, the basket, ropes and tiny passengers;
  THE BURNER FLARE kept and made beautiful — the flame jets up and the whole envelope glows from the inside (warm light
  through the fabric, brightest near the mouth), lighting the basket and the air around it; at night the flare is the show.
  SPECIAL BALLOONS (sometimes in a normal flight, always at the festival):
  - THE ₿ BALLOON: all black with a big orange ₿ by day; at night it reads all ORANGE with a black ₿ (lit from inside) —
    a subtle nod, never explained (the Bitcoin rule).
  - THE ALIEN HEAD: a special-shape balloon of a classic grey alien head — green, with big glossy black almond eyes — a
    real special-shape balloon (puffy, seamed fabric), not a flat cartoon.
- 6b section 0 — BALLOONS USE THE WHOLE SKY (the owner): the hot air balloons and the balloon festival may drift anywhere in
  the sky, from the top safe area down to the skyline — passing BEHIND the NEON letters and the tagline (the sign always
  draws on top) and IN FRONT of the sun, the moon and the stars; slow, real wind-driven drift at different heights and sizes
  (nearer = bigger, lower), a festival spread across the whole sky. Never over the dock or the corner buttons.
- 6b section 0 — THE AURORA: BACK TO CITY 1.0's (the owner: 6a's aurora is jittery, slowed-down, with hard vertical shafts;
  City 1.0's "looked really good"): drop 6a's aurora art (moon.js / s.auroraArt) and use City 1.0's aurora (district/fx.js
  #aurora) on the Harbor — re-fitted to the Harbor's sky (the whole sky, behind the NEON sign), smooth at 60 fps, with its
  soft reflection in the harbor water as the one addition. Keep 6a's timing (~2 nights a month + Kp ≥ 7).
- 6b section 0 — SPLIT CORNERS ON THE TITLE + LOBBY (the owner): the MENU button moves to the TOP-LEFT corner and the MUSIC
  button stays TOP-RIGHT, framing the NEON sign symmetrically — on the title screen and the lobby only (the TEST pill moves
  out of the way, e.g. below the menu); the games keep both on the right for now (Menus 2.0 decides per game).
- 6b section 0 — THE SIGN UP A LITTLE + SMALLER CORNER BUTTONS (the owner): raise the NEON sign (+ SPEAKEASY + the tagline)
  ~20–30 pt so the city gets more sky (never into the status bar / Dynamic Island; the N may sit level with the corner buttons
  — it already does). [MOVED TO 7a SECTION 0 (Oct 23): the sign raise, the smaller buttons, the split corners — 6b keeps
  only the banner plane's path + the arch re-fit below.] Shrink the MENU + MUSIC corner buttons a little EVERYWHERE (title, lobby, every game, THE BOARD): the
  visible circle ~15–20 % smaller, but the TAP AREA stays ≥ 44 pt (the ground rule — invisible padding). Re-fit everything
  that hangs off them (the games' header padding-right, the +10 / +58 offsets, the chat badge, the full-width games' pinned
  columns); THE BANNER PLANE keeps its full size (plane, banner, lettering — never shrunk): its path moves to just under
  SPEAKEASY, through the tagline's band — the tagline ("YOUR FRIENDS ARE ALREADY INSIDE.") fades out softly as the plane
  arrives and fades back after it has gone (like the sign dimming for sky messages); the banner stays tappable, clear of
  the moon's disc when it can. Then re-fit the sun / moon arch, the drone + sky-
  message layout and the lanes once. Check every phone size + a couple of games.
- 6b section 0 — ROSIE'S TURN, QUICK FIX (the owner: when the big paddle steamer turns around it looks super weird — a flat
  2D picture flipping / squashing): until she's rebuilt, she turns OUT OF SIGHT — behind the pier, the lighthouse's
  breakwater or past the screen edge — never on open water in view.
- PART 8 — ROSIE (and every boat) AS A REAL 3D MODEL in the Harbor's own 3D camera, like the buildings: hull, paddle
  wheels, decks, cabins, funnels — so she turns naturally on the water (bow, three-quarter, side views all true), her wake
  curving with the turn, her lights / bulbs on the model (and they CHASE on party nights — the Part 10 note); the water
  taxi and the other boats the same — and THE PARTY YACHT (Part 10) is built as a 3D model from the start (the owner).
- 6b section 0 — THE GEESE MORE REAL (the owner): a V is never perfect — one or two stragglers trail behind with a gap, flapping
  a little harder to catch up; arms of uneven length, birds shifting places, the odd one dropping back now and then.
- 6b section 0 — THE MOON REDONE (the owner: "the craters look off"): today it reads as a ball with round dark spots. A real
  moon seen from the ground shows no distinct round craters — it reads by the MARIA (large soft irregular dark-grey seas, the
  "man in the moon"), bright highlands, Tycho's bright rays near the bottom, a gently soft edge and a soft glow. Use a real
  photographic lunar map (NASA's public-domain CGI Moon Kit / LRO), not drawn craters, at the right orientation for the
  player's sky and in its real phase with a soft terminator; keep earthshine, the amber moonrise, the eclipse red.
- Planes, the BANNER PLANE (1–3 banners: daily challenges, holiday messages, game announcements, CITY CONTROL messages),
  helicopter, jets, birds/gulls, the UFO, satellites.
- The sun and moon art: big amber moonrise turning silver, earthshine on the crescent, a halo only in real haze; rare harvest
  moon / supermoon / lunar eclipse (red) on the real nights.
- Jets: a four-jet demonstration team (our own unbranded team, diamond formation, smoke trails, loops — July 4th air show);
  F-16 flyovers on Memorial Day and Veterans Day incl. the missing man formation; July 4th F-16s.
- Skydivers: a plane drops jumpers who float down and GROW with depth to land on the promenade (crafted canopies; flare,
  a stumble, gather chutes, walk into the speakeasy); smoke flares + canopy lights at night; a giant flag under a jumper on
  July 4th / Memorial / Veterans Day; rare on calm clear days; maybe neon canopies on a legendary party night.
- HOT AIR BALLOONS: on calm, clear mornings and summer evenings (only when the real wind is low) a crafted striped balloon
  drifts slowly across the sky; at dusk the burner flame flares and lights it from inside; rarely a small festival of several.
- THE AURORA must be REAL: today's sky shows it on ~1 night in 5 at random (core/sky.js#auroraNight) — tie it to the real
  space-weather forecast (NOAA's Kp index) or make it very rare (a few nights a year at Grand Rapids' latitude).
- Cap the planes' contrail cost (Known issues, Part 2).
- SKYTYPING (skywriting CUT, Oct 23 — no doubling up): on clear, low-wind days, for short words AND longer
  messages (HAPPY BIRTHDAY STEVE, HAPPY NEW YEAR, MERRY CHRISTMAS, HAPPY THANKSGIVING) a line of planes SKYTYPES dot-matrix
  letters (~16 a line, up to 2 lines on a phone); the real wind drifts and blurs them until they fade. Flies in the sky-high /
  sky-low lanes, never over the sign or tagline. Selectable from CITY CONTROL; used by holidays and birthdays.
- The Halloween witch (crafted, good-looking, cloak + hat + broom, a trail of drifting neon sparkles; crosses a real full moon).
- Santa's sleigh across the moon on Christmas Eve. Bats at summer dusk + from a tower crown on Halloween.

## Part 7 — the speakeasy
- SPLIT (Oct 23): 7a = THE LOOK (the building day + night: facade, materials, the barbershop front + pole, windows with glow
  + shades, the awning, the rooftop + string lights, the ghost ad + the corner-turn preview) — before 8a + 6b; 7b = THE LIFE
  (the moments catalogue + starter 10, the hidden mirror door, the TV glow, the raid, taps, rooftop seasons) — with 8b.
- 7a SECTION 0 — THE LAYOUT, MOVED UP FROM 6b (the owner, Oct 23 — the top's final place matters for judging the whole
  picture): raise the NEON sign ~20–30 pt; shrink the round corner buttons ~15–20 % EVERYWHERE (title, lobby, every game,
  THE BOARD) with the tap area ≥ 44 pt and everything hanging off them re-fitted; SPLIT THE CORNERS on the title + lobby
  (menu top-left, music top-right). The banner plane's path + the sun / moon arch re-fit stay in 6b.
  + THE MUSIC'S FIRST TAP (the owner, Oct 23 — no "tap for music" hint): when the music starts on a visit's first tap, the
  NEON sign answers it — BY DAY (tubes unlit) a bright SURGE races through the tubes letter by letter, N → E → O → N, then
  they fade back to unlit daytime glass; AT NIGHT (already lit) a quick brighter race / pulse through the lit tubes. Once per
  visit, only when the music actually starts; never fights the evening warm-up / tap-to-light "catch" (if the sign is in its
  warm-up, the first tap does what the catch does today). + the open FA item: check the beat lights + SFX still work while
  the music runs on the DIRECT element (the Web Audio context frozen after returning).
- THE OWNER'S LOOK DECISIONS (Oct 23): FANCIER — a once-grand 1920s Deco corner building (cream terracotta trim, Deco
  ornament at the roofline, a decorative cornice, carved panels between floors, gold-leaf lettering) over warm brick;
  the MOOD cozy and a bit worn (chipped terracotta, faded gilt, weathered brick, some ivy, a patched awning) — "it is a
  speakeasy after all"; KEEP ITS SIZE on screen as today; the BARBERSHOP front stays (striped turning pole, a big shop window
  with the chair, the "EST. 1924" awning).
  THE BILLBOARD MOVES ONTO THE SPEAKEASY'S ROOF (the owner, Oct 23 — it still looks like it's floating): stands on the
  speakeasy roof's BACK-LEFT corner on its steel frame (legs bolted to the roof deck, a catwalk + ladder, the four lamps),
  set back so the rooftop deck in front stays open — rooftop party guests (7b) walk IN FRONT of it, the sign painters /
  billposter (8b) work on the roof instead of a ladder. Conditions: never cut by the left screen edge at 390 / 402 / 430,
  never covering the wheel or the word towers, the daily game rotation + full name + lit at night unchanged; check the
  speakeasy doesn't feel crowded with the ghost ad on its side wall (if it does, tell the owner and propose an option).
  THE BARBER POLE AT NIGHT (the owner, Oct 23 — replaces "the pole stops at night"): from DUSK until MORNING the pole is LIT
  from inside — a soft, warm old-school incandescent yellow glow through the glass (not LED-bright), turning SLOWLY; by day
  it turns unlit in daylight. The story: the shop shows CLOSED, yet the pole keeps turning — the secret signal that the
  speakeasy is open. During a RAID it snaps dark and stops (7b), back on when the coast is clear.
- 7a ALSO — THE SKYLINE'S NEAR BRICK STILL READS FLAT (the owner's noon crop, Oct 23, after F1's brick pass): the red-brick
  waterfront blocks (by the lighthouse, under the billboard) are smooth salmon slabs + a window grid. Real-scale brick
  courses are sub-pixel at that distance, so they vanish. Fix like an illustrator, the same material system as the
  speakeasy's brick: (1) CHECK THE BAKE RESOLUTION — the near layer must bake at the device's full pixel ratio (F1/DB
  noted the bakes looked soft — sub-point detail is lost below it); (2) STYLISED readable brick: exaggerated courses every
  ~2 device px with a darker mortar tint, panel-to-panel colour variation, soldier-course bands above the windows,
  stone quoins at the corners, a cornice line, faint weathering streaks under sills; (3) the side faces / returns of the
  blocks in shade so they read as volumes. Judge zoomed at 3× AND at phone size.
  + THE LIGHTHOUSE (the owner): give the tower texture + roundness by day — strong CYLINDRICAL shading (lit side → soft
  core shadow → a thin bounce light on the far edge), faint painted-masonry courses, subtle weathering (rust streaks under
  the gallery and the windows, a slightly darker salt-worn base), a rough stone foundation on the breakwater; the red /
  white stripes stay crisp and bold (it's a hero piece); the night look unchanged.
- 6b section 0 — THE DIRECTOR (can a phone handle the whole plan? — the owner, Oct 23): yes, IF only what's on screen
  costs. Build ONE scheduler that every event / moment / weather / holiday goes through, with a per-tier SPECTACLE BUDGET:
  at most N heavy effects at once (fireworks, drones, the raid, storms, the party show…), the rest queued or skipped,
  priorities (holidays > party > legendary > rare > routine); assets for seasons / holidays / rare events LAZY-loaded and
  released after; a MEMORY budget per tier (today 35.7 of 64 MB); a PASSIVE LONG-SESSION CHECK — no build time: after the
  big parts only (6b, 10, the holiday parts), the owner just leaves her iPhone on the city (&debug=1, plugged in or not)
  while doing something else, then reads the session line (slow % over 30 min, any tier drop) and feels if the phone is
  hot. The readout can add a "since 10 min" slow % so the creep is visible.
- FUTURE IDEAS (PARKED — not in any part yet; the owner, Oct 23: "let's not spend time on that right now"):
  + A NEON MOON for party nights (the owner, Oct 25 — parked, "not sold on either yet"): Claude's two options — (a) the
  real moon stays + a neon tube RING lights around it on party nights, cycling the party colours, pulsing on the beat
  (none when the moon isn't up); (b) a RARE full "neon moon" night (New Year's Eve / a few times a year) where the moon
  turns into a neon tube outline, flickering on like the roof signs. Never replace the real NASA-map moon by default.
  + TAP A WINDOW TO PEEK INSIDE (the owner, Oct 26 — parked after WIN: a tap on a speakeasy window zooms into the room's scene for a
  moment; not now — the windows must read as-is at the real size first).
  + SYNCHRONIZED DANCES (the owner, Oct 26 5:45 pm — parked): a few choreographed group dances in step with the beat (a 1920s
  Charleston line, a swing circle, a modern line dance on party nights), picked per song.
  NOCTILUCENT CLOUDS (a RARE sky event, true to life): the highest clouds there are
  (~80 km), glowing electric blue-silver because they're still lit by the sun after it has set. Only when real-ish:
  SUMMER (late May → early August), only in deep TWILIGHT (the sun ~6–16° below the horizon — ~45–100 min after sunset or
  before sunrise), never in full night or by day; low over the horizon behind the skyline; delicate rippled, wavy bands
  and herringbone streaks, faintly luminous, slowly shifting. Rare at Grand Rapids' latitude, so: a few evenings a
  summer at most (seeded, the same for everyone) → a City Sightings badge candidate. A preview + panel row.
- 6b section 0 — CLOUD LAYERING BUG (the owner, Oct 23, at night with the city's pink underglow): a high CIRRUS behind a
  CUMULUS showed THROUGH the cumulus — the near cloud reads see-through. Likely the night underglow / tint drawn as a
  translucent layer, the cumulus' body too transparent at night, or the draw order (cirrus after cumulus). Rule: a
  cumulus' body is OPAQUE — nothing behind it shows through (only its thin edges let the sky through); high clouds always
  draw first. Check at night, party night and by day.
- 6b section 0 — THE AURORA BLENDS MORE (the owner, Oct 24): City 2.0's aurora has too much definition in its vertical
  shafts of light — soften them: the rays fade into each other (soft-edged, overlapping, blurred along their length), a
  smooth glowing curtain that shimmers and drifts, not separate stripes; keep its colours and its reflection on the water.
- 6b section 0 — CIRRUS SOFTER + LONGER (the owner, Oct 23): the high streaks are too sharp — more diffusion (soft,
  blurred, feathered edges, lower contrast) and longer, more stretched strands. (Re-checked Oct 24: he LOVES the wispy
  high cirrus look, but they still need to be more stretched out; and under overcast the small cartoon-round cumulus are
  STILL there — both are must-fixes in 6b.)
- 6b section 0 — CLOUDS EVOLVE (the owner said OK, Oct 23 — she'll judge the clouds only once 6b's full system is in): clouds slowly swell, change shape and dissipate over minutes,
  new ones form; each 6-hour re-roll picks a varied MIX (a towering one or two / many medium / nearly clear), never the
  same blend.
- Windows you see into (rooms read as warm glow + big silhouettes), the unmarked door + the knock, the awning "EST. 1924".
- The ROOFTOP: summer weekend rooftop parties (string lights, dancing figures, a bar cart, someone at the railing); a rooftop
  garden through the year (spring seedlings + a gardener with a watering can, summer lush green with tall sunflowers and red
  tomato clusters, autumn pumpkins, winter beds under snow, string lights left up).
- THE SPEAKEASY WINDOWS (its own section — the closest, biggest windows in the city, ~25 pt on a phone; figures inside are
  12–16 pt SILHOUETTES, so they read by light, shape and big motion — the glance test on every window):
  - THE MOST BEAUTIFUL, MOST ALIVE PART OF THE CITY (the owner): it's the most detailed and readable thing on screen, so it
    is VERY ACTIVE around the clock — something visibly happening in at least one window every ~10–20 s, never all at once.
    BY DAY the speakeasy hides behind an innocent front and the upstairs lives: the apartment's morning routine (blinds up, a
    figure stretching, watering a window box, the cat sunbathing on the sill), a laundry line, someone reading by the window,
    a delivery of "crates" being carried in, the front shop open — a BARBERSHOP (the owner's pick: the classic speakeasy
    cover, a striped barber pole turning by the door that reads on a phone, a chair + a barber in the window) with customers;
    AT NIGHT the barbershop "closes" — the pole stops, a CLOSED card, the chair empty under one dim lamp — but its back wall
    (a big mirror) is a HIDDEN DOOR: every so often it swings open and you glimpse the bar behind it — warm amber light,
    bottle shelves, silhouettes, a burst of muffled jazz — before it swings shut again (more often on party nights; never
    during a raid). The secret, in plain sight, on the most readable window; AFTERNOON: the
    bartender setting up behind half-drawn shades — polishing glasses, lights on one by one; EVENING → NIGHT: the full bar,
    jazz room and card game (below), a couple dancing past, a toast with raised glasses, someone at the piano, a curtain
    drawn and opened, a silhouette peeking out, lights switching room to room; LATE: the TV glow upstairs, the cat, the last
    patrons leaving; the raid nights as planned. A scheduler picks the next small moment by the hour (busier on party nights).
  - THE GHOST AD (the owner's idea): the speakeasy's angled RIGHT side wall carries a big faded, hand-painted 1920s GHOST
    AD for one of our games (worn paint on brick, the bricks showing through, sun-faded colours) — hiding in plain sight: it's
    an old ad, not the speakeasy's own sign (the speakeasy stays unmarked). It rotates WEEKLY to another game (the neon signs
    rotate nightly). Clear by day; AT NIGHT lit by a row of 2–3 vintage GOOSENECK LAMPS mounted above it (the classic
    painted-billboard lamps), each throwing a warm cone of light down the wall — pools of light on the brick, brightest at
    the top, fading down, the ad glowing in their wash. The lamps flicker off with the raid and with the TR-3B's power drain.
    ONE GHOST AD PER GAME (12), a new one each week (each game about every 12 weeks, the same for everyone). THE CHANGE:
    Part 7 swaps it quietly at ~4 am Monday (nobody watching). Part 8 (once people exist) adds THE SIGN PAINTERS as a
    weekly routine: Monday ~8–11 am, two painters on a hanging scaffold paint the new ad in stages — the old one whitewashed,
    then the outline, the colour fill, the lettering — readable on the phone (the wall is close); the ad then starts its
    week fresh and slowly "ages" back to a faded ghost by the weekend.
    SIZE CHECK FIRST (Oct 22): today the angled right wall is only a thin slice on a phone (~15–20 pt wide at 402) — too
    narrow, the same reason the Day Pass skipped the skyline ghost signs. The ad needs ≥ ~70 pt of wall width to read. In
    order of preference: (1) Part 7's rebuild turns the corner so the angled wall shows wide enough — the owner: overlapping
    a little of the wheel is OK (it adds depth); TRY IT and show her both (a preview flag, turned vs today) so she decides; (2) if not, the ghost ad goes on a wide brick band of the FRONT facade; (3) the owner's fallback: a BIG
    painted vertical BLADE SIGN on the building (a wooden board on iron brackets, same weekly game rotation, the same
    gooseneck lamps, the painters repaint it on a ladder) — only if it never covers the wheel, the pier or the dock.
  - THE EDGE WINDOWS (the owner's call, revised): keep the windows the left screen edge cuts — a solid brick edge would make
    the building feel suffocating. Lay the facade out per phone width so the edge cuts each edge window at a CONSISTENT,
    deliberate point (about half a window showing — never a thin sliver), and make those edge windows AMBIENT ONLY: curtains
    (drawn by night, tied back by day), warm light spilling through at night to make the foreground pop, a plant on the
    sill, and THE CAT now and then jumping up onto that ledge, sitting in the visible half (never cut). No story moments in a
    cut window — those live in the fully visible ones.
  - BUILT AS A "MOMENTS CATALOGUE" so new ones are easy to add any time (the owner will keep adding): every window moment is
    ONE self-contained entry — which window(s), its little animation (a small module drawing the silhouettes / light), when it
    may happen (hours, weekday / weekend, season, weather, party night, holidays), its RARITY (routine / common / uncommon /
    rare / legendary — e.g. legendary ≈ a few times a year), its length and a cooldown. ROUTINES are fixed in the day (the
    upstairs wakes ~7 am, the shop opens 9, the bartender arrives 4 pm, lights out ~midnight / the TV glow later); the rest
    are random draws weighted by rarity, never two in the same window at once, seeded so everyone in a room sees the same.
    A &force=window&moment=<id> preview + a button in the preview panel for every moment. Part 7 builds the system + a
    STARTER SET OF 10 (the owner's call — she reviews them on her phone before any more get made), chosen to cover the range:
    3–4 routines (waking up, the shop opening, the bartender arriving, lights out / the TV glow), then common, uncommon, rare
    and one legendary, across different windows and different kinds of animation (a light change, a big silhouette motion, a
    prop, the cat). What reads on the phone becomes the template for the rest; adding one later = one small prompt (~15–30 min). Legendary window
    moments can become City Sightings badges (Progression 2.0).
  - Rooms (share the ~6 visible windows; assign by what's visible at every iPhone size): THE BAR (the one CLEAR window straight
    in: glowing bottle shelves as colour, the bartender's big arm-pump shake, patrons leaning on the bar); THE JAZZ ROOM (a sax
    player swaying behind the shade, couples dancing on busy nights); THE BACK ROOM (a pool of lamplight over a table with 3–4
    heads around it — no cards; at most a soft haze, no smoke detail); THE UPSTAIRS APARTMENT (the cat as a LARGE sitting
    silhouette with a flicking tail on the sill; the TV). Everything else silhouettes behind warm amber shades.
  - THE TV GLOW (an owner favourite): a soft, IRREGULAR blue flicker like real TV light changing scenes, from ~10 pm until
    ~3 am — on above the still-busy bar from 10, then as City 1.0's bedtime turns the city's windows off it stands out more and
    more; late at night the speakeasy is dark except that window (now and then a head on a couch, the cat beside it). Plus a
    handful of lone blue-flickering windows across the dark skyline at the same hours (Part 2's window system).
  - Day vs night: by day the shades up, the glass reflecting the sky and street, rooms dim, someone stocking the bar, the cat
    sunning; at night the amber glow and silhouettes; a daily rhythm (quiet day → filling evening → packed party nights → one
    lamp and someone sweeping late).
  - Real weather (only when real): frost creeping in from the corners below freezing, steamed edges on cold busy nights, snow on
    the sills; raindrops running down the panes, catching the inside light and blurring the silhouettes; on hot days a sash
    raised halfway, a curtain blowing out, a fan turning.
  - Taps: a curtain twitches / a head peeks out; tap the cat → it leaps off the sill.
  - THE RAID: a convoy of 4 premium-crafted 1920s-style black-and-white patrol cars rolls down the waterside road, red/blue light
    washing over the facades, the wet road and the harbor; the instant they appear EVERY speakeasy light cuts out and the shades
    snap shut; they slow outside, one stops and an officer's flashlight beam sweeps the dark windows; they roll on; a beat later
    one window flickers back, then another, and the party returns (on a party night, even louder). SCHEDULE: 2 raid nights a
    week (the same for everyone, seeded by the date) — one guaranteed party night (Fri or Sat at random) + one random weeknight;
    on a raid night the first raid at a random moment 6–10 pm, then about every 3 hours until ~5 am; NEVER during big holiday
    moments (NYE countdown, Christmas Eve, the tree lighting, the Day of the Dead procession) or a party night's midnight finale.
    The car bodies come with the other vehicles (Part 8); the raid with the speakeasy (Part 7).
  - Plus what's planned elsewhere: holiday window scenes, the password sign, busier windows when more players are online.
- WINDOW WASHERS: some weekday mornings, two washers on a hanging platform squeegee the speakeasy's windows (tap → they wave).
- 8P REVIEW NOTES (the owner's iPhone, Oct 24 — collecting; "pretty impressed for a first pass, not perfect"):
  (1) THE PEOPLE'S MOVEMENT: they SLIDE, and near the crosswalk they walk "sideways and forward at the same time" — a
  side-profile walk cycle used while moving IN DEPTH. Fix: the facing must match the direction of travel — front view walking
  toward the camera, back view walking away, 3/4 views on diagonals, side view only when crossing the screen; scale changes
  smoothly with depth; screen speed matched to the stride at that depth (farther = smaller steps) so feet plant and never
  skate; turns happen through a 3/4 frame, never a snap. (2) THE KNEES look odd: a proper walk cycle (contact, down,
  passing, up — ~8 frames), clear knee bend on the passing leg, a little hip / shoulder counter-swing, arms swinging
  opposite. (3) FACELESS: at ~25–30 pt a face is ~3–4 pt, so NO drawn eyes / mouths (they'd look creepy or cartoonish);
  instead stop drawing them as flat black silhouettes BY DAY: real muted 1920s clothing colours, skin tones on face +
  hands, hair colour, a hat brim's shadow across the face, a light side + shade side; at night mostly silhouette with a
  warm RIM LIGHT on the face / shoulders from the nearest lamp. That reads as "a person" without features.
  (4) THEY WALK TOO FAST (agreed): slow the everyday pace ~25 % (a relaxed 1920s stroll), varied per person — strollers +
  couples slowest, commuters brisker, joggers clearly faster. (5) PARTY NIGHT (iPhone readout: tier 2, 60 fps, 2 % slow —
  fine; the beat settled, drift 0): THE GLOW-WAND DANCERS (the owner's idea, agreed with a tweak): at the party's peak a
  DANCE CIRCLE forms on the brick compass inlay (the event floor spots switch on — the rig built for exactly this):
  ~4–6 dancers swinging handheld neon LIGHT WANDS (like flight-deck marshalling wands — anachronistic, but party nights are
  the city's neon fantasy), the wands changing colour with the party palette, RACING / strobing on the beat, now and then
  twitching or glitching like a tired tube; crisp glowing tubes with SHORT motion trails (never a smeared blur); big
  readable dance moves on the beat (arms up, swings, spins). Not every person — the rest watch, bob, clap around the
  circle. Inside the party's cost budget; tier 0 drops the trails first.
  (6) THE IVY is too dense — a solid red mass that reads like FIRE: spread it out, irregular climbing stems and tendrils with
  brick showing between, individual leaf clusters, a mix of crimson / scarlet / a few still-green and amber leaves in
  autumn, and let it climb FARTHER up the corner pier (toward the second floor) — only if it looks natural.
  (7) THE DATE STONE reads as a flat white box with "1924" (not clear it's a year): make it an intricate carved tablet —
  "EST. 1924" in incised, shadowed letters, a raised moulded border, small scrolled ends / a Deco ornament, the same
  warm limestone / terracotta as the trim, lit softly at night. (8) THE WHITE TRIM on the whole speakeasy (cornice, sills,
  lintels, quoins, the parapet band) looks FLAT: give it real stone — a warm cream limestone / terracotta tone, a subtle
  texture, crisp shadows under the cornice + dentils + sills, a little weathering / soot streaking below the ledges. (9) THE
  BLADE: approved (stacked names are fine). (10) THE JETS: sound great — a bit louder still (~+3 dB) and a slightly deeper
  music dip during the pass. (11) The hush sign can't be judged in a real lobby yet; use the preview link.
  (12) THE BUS: looks good; more detail (a period coach: chrome grille + bumpers, round headlamps, a destination sign
  "HARBOR LINE", riveted panels, spoked wheels, a lit interior at night) and NOT GREEN (it clashes with the green cart) —
  Claude's pick: CREAM OVER DEEP MAROON with a thin gold pinstripe + gold lettering (warm, period, matches the speakeasy's
  palette). The door stays open far too long: close it ~3–5 s after the last rider. (13) DOORS ARE REAL: people must WALK
  through the speakeasy's side door and the barbershop door — the door swings open, they step in (or out), it closes —
  never fade in / out. At night the speakeasy door spills a warm amber glow when it opens (a lit rectangle on the step and
  cobbles, a burst of muffled jazz from the club slot), then closes.
  (14) After FP3a (Oct 24): people a bit too slow now (+10–15 %), they look like they're SQUATTING (straight legs when
  standing / on contact); people on the BENCH blend in at noon (contrast; maybe a dark green iron bench); the IVY still
  reads as stuck-on leaves (thin it, climb to the parapet, or remove it); the CART moves to the front-middle vendor spot
  (see THE WORKERS' SCHEDULE). All in FP3b.
- THE HUSH WORD SIGN — REVISED (the owner, Oct 24 ~11:45, after seeing the shop-window version block the barbershop scene):
  it moves to the speakeasy's LOWER-RIGHT upstairs WINDOW as bare NEON TUBES of the hush word hanging inside the glass — a
  SIGNAL from someone in the building to the friends outside. It exists ONLY while the player is in a lobby: invisible
  (not even unlit tubes) otherwise; when a lobby opens it lights letter by letter, glows by day too, and when they leave
  the lobby it goes dark and is gone. The room's moments keep playing BEHIND it (silhouettes through the gaps). No OPEN
  sign in the shop window at all — the barbershop scene stays clear. Same size rules (5 letters, never under ~14 pt).
  The older shop-window plan below is superseded.
- THE HUSH WORD SIGN (the owner, Oct 24: it must be ON the speakeasy, as NEON) — SUPERSEDED, see above: a small NEON WINDOW SIGN in the
  BARBERSHOP's front window, hanging just inside the glass in the LOWER half of the window, under the gold "HARBOR BARBERS"
  arch, between the window's left edge and the barber pole (it replaces the tiny OPEN card). The barber + customer scene
  stays behind it. Just the HUSH WORD in neon (bold Deco capitals, one warm colour, a thin tube border) + a small neon
  KEYHOLE beside it as the wink; no extra painted text (the window is small). The joke: the password hides in plain sight
  on the innocent front shop. Hush words are 4 letters; SIZE IT FOR 5 (room to expand). Letters as big as the window
  allows, never under ~14 pt, readable at a glance at 390 / 402 / 430; if 5 letters don't fit at that size, widen the
  shopfront a little rather than shrink the letters; the window's left edge must never be cut by the screen edge where the
  sign sits. Lit whenever a lobby is open (by day too), otherwise a plain neon OPEN in the same spot by day and dark at
  night. In a lobby it re-lights letter by letter when the word changes. Never covering the barber pole or the door. The real
  word still shows big in INVITE / the dock. BUILD IT IN 8P as a preview (&force=hushsign&hush=JAZZ, plus a 5-letter test
  word) so the owner can see it on his phone; Lobby 2.0 connects it to the real lobby word.

## Part 8 — the stage + wildlife
- 8b — THE WILDLIFE, ALL NEW FOR CITY 2.0 (the owner, Oct 24): EVERY animal is rebuilt for the Harbor — none of City 1.0's
  wildlife art is reused. PREMIUM, 3D-LOOKING renders in the Harbor's camera: correct perspective + scale by depth, shaded
  by the scene's light (a lit side, a shade side, a contact shadow; rim light at night), and FACING BY DIRECTION like the
  people (front / back / 3/4 / side — never a flat side-on sprite moving in depth); smooth animation (wing beats, gaits).
  Real 3D models only where it pays (e.g. the gulls' landing + flight, like the boats); the rest drawn per facing. The gulls'
  premium bar applies to all. PHONE TEST for each: it must read at a glance at 402, or it's cut / enlarged.
  The cast: pigeons (perches + scatter), gulls (billboard, railing), the squirrel (motion only), the snowy owl (winter),
  the coyote (night), the raccoon (night), fireflies (summer nights), bats (night sky), geese (sky), a heron on the pilings
  at dawn (a big readable shape), fish jumping (ripple rings), the speakeasy cat (windows + outside), dogs with walkers.
  CUT: small ducks floating far out on the water (specks on a phone).
  NEW (agreed): (a) A DUCK CROSSING (spring, rare): a short ROW of 2–4 ADULT mallards (no ducklings — too small at the
  crosswalk's distance) waddles across on WALK while the people stop and wait; (b) A DOG CHASES THE PIGEONS: now and then a
  dog lunges at the flock, they burst up, its owner tugs the leash; (c) THE SPEAKEASY CAT COMES OUTSIDE some evenings —
  sits on the step / the outside sill, now and then stalks the pigeons (they scatter). (d) THE RACCOON NEEDS A TRASH CAN:
  add a SMALL period GALVANIZED steel trash can with a lid just to the RIGHT of the front-left lamppost (the bottom-left
  one by the curb and the brick street — the owner's pick, Oct 24: the most free space; a city litter can by a lamppost at
  the curb is true to the period and right where the trash truck stops). Checks: fully above the dock (never covered by
  JOIN / HOST at 390 / 402 / 430), clear of the lobby line (which forms LEFT of that lamp) and of the walk to the door: late at night the raccoon tips the lid off (a clang), rummages, and
  bolts if someone comes; the weekday-morning trash truck empties it; the lid sits askew until the barber fixes it.
- 8b — WILDLIFE THAT REACTS TO PEOPLE (the owner, Oct 24 — agreed): (1) PIGEONS (a small flock of 4–8) land and peck on the
  promenade when it's naturally quiet (early mornings, Sundays, lulls in the people mix); when a person walks close they
  burst up and flap off (a wing-clatter sound), circling back to land later; a gull or two may land near the railing / water
  side instead (gulls stay by the water; pigeons on the cobbles). (2) A SQUIRREL in one of the trees: when nobody's near it
  comes down, hops across the cobbles, sits up; when a person approaches it dashes back, spirals up the trunk and vanishes
  into the leaves; in winter (bare branches) it slips into a hollow instead. PHONE REALITY (the owner): at true scale a
  squirrel is only ~4 pt next to a ~28 pt person — it reads ONLY by its MOTION (the dash, the spiral climb) and the big
  curled TAIL silhouette, never by details (no nut, no face). Cheat its size up a little (~1.5×, ~6–7 pt with the tail),
  give it a warm rim of light, make the motions big and quick. TRY IT and CUT IT if it doesn't read at a glance at 402.
  Pigeons the same: they read as a flock in motion (the burst + flap), not as single birds. NEVER A STALE LOOP (the
  owner): pigeons have several PERCHES, not one spot — the cobbles, the TOP of the blade sign, the roof billboard's frame /
  catwalk, the parapet, a lamppost's arm, the café-light wire; when scared they scatter (not always together — some to a
  perch nearby, some off screen), and the ones that leave stay away a while (minutes, varied) before a few return from a
  different direction to a different perch; sometimes the whole flock is gone for a long stretch; numbers vary (2–8).
  CONTROLLED RANDOMNESS: seeded by the clock (same for everyone), weighted by the time of day + how busy the promenade is,
  with cooldowns so no pattern repeats within a viewing.
  BY SEASON (the owner): WINTER — fewer pigeons on the ground (real pigeons stay all year, so they don't vanish: mostly
  huddled, puffed up on ledges / the blade's top, rarely on the snowy cobbles); the squirrel mostly stays in its hollow
  (a rare quick dash on a mild sunny day). Instead, a WINTER SPECIAL: a SNOWY OWL (true to the Great Lakes — they come down
  from the Arctic some winters and sit on rooftops and waterfronts). Uncommon (some winter days, Dec–Mar), it perches on
  the billboard frame, the lighthouse gallery or a tall roof edge — big, white, ~10 pt, readable — slow head turns, a blink
  of yellow eyes at dusk, now and then a silent low glide to another perch; it scares nobody and the pigeons keep away from
  it. SPRING / SUMMER: the most pigeons + the squirrel at its busiest; AUTUMN: the squirrel busy (dashing to and fro). Both use the people system's
  positions (a "scare radius"), never pop in or out, a premium render like the gulls. Inside the director's budget.
- 8a SECTION 0 — CARRIED OVER: only (6) the billboard move was NOT sent to 7a (the owner sent (1)–(5) + the barber pole —
  check 7a's summary that they landed; anything missing carries here too):
  (1) THE SUN'S COLOUR BY ALTITUDE — golden hour too white (her iPhone at 17:57, ≈ 5–6° up): above ~15° white; ~6–15° warm
  yellow-white; ~2–6° clearly golden amber (the city's light warmer too); the last ~2° deep orange-red, slightly squashed;
  the same at sunrise. (2) The panel's TIME presets in order: SUNRISE (~5 min after the real sunrise) · MORNING · NOON ·
  AFTERNOON · GOLDEN HOUR · SUNSET (~5 min before) · DUSK · NIGHT. (3) The AUDIO panel's header says "sounding" while its
  detail says "sounding NO · locked (no tap yet)" — match them. (4) THE SPELL-ON on EVERY neon sign (both roof signs + the
  blade), staggered, never two at once, every few minutes on normal nights, between scenes on party nights. (5) The window
  WORD TOWERS: a text box in the panel (type a message, pick tower(s), each tower's max letters shown live; long messages
  spread one word per tower or scroll); report the exact limits. (6) THE BILLBOARD ONTO THE SPEAKEASY'S ROOF — over the left
  half-plus of the roof, fully inside the left edge at 390 / 402 / 430, raised on a visible steel lattice frame (legs on the
  roof deck, ~¼ of the board's height of open frame so the city shows through), catwalk + ladder + the four lamps; guests /
  painters can walk under it; never covering the wheel or the word towers; flag it if the speakeasy feels crowded with the
  ghost ad. (6b) THE FIRST-TAP SURGE whenever the sign is NOT on (the owner): not only "by day" — morning, day, golden
  hour, dusk, any moment the NEON sign isn't lit, the first tap's surge races N→E→O→N then fades back; only during the
  evening warm-up window does the tap do the catch instead (it lights the sign for good). (6c) THE PULSE DOESN'T COME BACK
  AFTER RETURNING (the owner's iPhone, Oct 23, after 7a): this time Web Audio DID recover (ctx running, clock advancing,
  out WEB AUDIO, the beat line "grid 100.0 · bar 30 · kick 0.66", music sounding) — yet the city's lights didn't pulse. So
  the bug is on the LIGHTS side: find the stuck state after hidden → visible (the "calm" latch from the frozen-graph state
  never cleared? the beat clock / punch envelope paused on visibilitychange and not restarted? a huge rAF time jump
  clamping the envelope?) and fix it; add "pulse" (the punch level now, 0–1) to the readout's beat line so it's visible.
  (6d) THE PULSE STRONGER AGAIN (the owner: "crank it up higher") — and stop guessing: add a PULSE STRENGTH slider to the
  preview panel (LIGHTS) so the owner dials it live on her iPhone, then the chosen value becomes the default; start ~+30 %
  above 7a's; still no full-screen flashing. (7) THE NEON TAP SOUNDS ~25 % QUIETER (the owner): the on / off sounds when you TAP the NEON sign's tubes drop
  ~25 % in volume (gain × 0.75, ≈ −2.5 dB); the start-up surge / power-on sound stays as loud as it is.
  (8) SOUND SLOTS (the owner will collect the recordings later): ONE sound registry — every planned city sound (the CITY
  SOUNDS hunt list, by part) gets a named SLOT now (e.g. club-murmur-calm, door-heavy, cat-meow, water-lapping,
  city-hum-night, car-1920s-pass, flag-flap…); every event calls its slot; an EMPTY slot is simply silent (never an error,
  never a placeholder beep). Adding a sound later = drop the file into a folder (e.g. ~/Downloads/city-sfx/<slot name>.wav)
  + run one script (trim, level to the city's loudness, encode, register) — like add-city2-music.py. The preview panel's
  SOUNDS category lists every slot: filled / empty, with a play button. + anything the owner
  finds when she checks 7a.
- FINAL PROMENADE TOUCHES (the owner, Oct 24, after FP2 — collecting): (a) MOVE THE BENCH + ITS CRABAPPLE to where the cart's
  umbrella is now — just LEFT of the crosswalk — brought slightly FORWARD, the tree a bit BIGGER (it frees the OVERCLOCK blade
  and shows the tree); (b) the CART is HIDDEN for now, like the bus (the owner likes it — it comes back in 8b with
  moving things, placed once the layout is set); keep its art; (c) THE STREET UNDER THE DOCK must read as a different
  surface from the promenade — darker asphalt-toned setts / tarred granite with the rails, a clear curb step between;
  (d) THE CENTREPIECE becomes a PAVING INLAY, flush with the ground — an old-school brick compass rose / circle laid in red
  (and a second tone) brick within the cobbles, no raised ring or medallion object; it stays the holiday centrepiece spot;
  (e) RETHINK THE LAMP PLACEMENT now the layout is known (Claude's starting idea: a matched pair of tall double lamps
  FLANKING the crosswalk so the crossing is framed + lit; the two short globes at the front corners; nothing in front of the
  shopfront or the blade; every pool where people walk / sit — the bench lit, the inlay lit); (f) REMOVE THE STRING LIGHTS
  from the speakeasy roof for now — the owner still wants them, RE-RENDERED properly later (7b with the rooftop); (g) THE
  SPEAKEASY'S SIGN LAMPS AT NIGHT: the roof billboard's lamps a little BRIGHTER; the vertical blade's lamps clearly brighter
  and more CONCENTRATED — tighter cones aimed down the board so the whole blade face is evenly lit and the name pops at
  night (undo FP's "dimmed the blade a little"); still crisp light-on-surface, never a haze; (h) lamps strategic + future-
  proof (people readable everywhere they walk / wait / line up); (i) warm UPLIGHTS at each tree's base so the trees read at
  night; (j) REMOVE THE OLIVE-GREEN MAILBOX (the owner, Oct 24: "I don't like it") — no street-furniture accent there;
  a NEWSSTAND / NEWSBOY idea → 8b with the people; (k) EVENT LIGHTING for the centrepiece (the owner): the inlay always inside
  the permanent pools + a hook rig of 3–4 flush brass FLOOR SPOTS in its ring, off normally, on (warm, aimed up) when an event
  piece stands there; holiday parts drive it via an API + add their own lights.
- THE SPEAKEASY AT NIGHT FEELS EMPTY (the owner, Oct 24, 3:24 am): (1) the window LIFE (7b) moves UP — right after the Fable
  beat pass, before 6b (the owner wants to see it; the windows are the city's most alive spot); 7b must make sure the
  building is NEVER fully dark at any hour (the TV glow upstairs, a night lamp, the bar's last light); (2) FACADE LIGHTING
  for depth: warm, soft grazing light on the brick PIERS BETWEEN the windows from small lamps under the cornice aiming DOWN
  (wall-washers), not lighting the windows themselves — on from dusk, all night, subtle; (3) THE BLADE SIGN goes the
  MARQUEE route: a border of soft warm-white BULBS around the board (steady, no chase needed; maybe a slow chase on party
  nights), the board itself DIMMER (no bright gooseneck wash — the bulbs replace the blade's lamps so two lights don't fight);
  by day the bulbs read as unlit glass globes on the frame (a classic theatre look) — judge by day too.
- THE SPEAKEASY BLADE STILL UNREADABLE (Ben, Oct 24, after 7b's marquee): dark thin letters on a dim orange board, with the
  bulb border crowding a ~25 pt board. FIX — INVERT IT, the classic 1920s theatre blade: a DARK board (deep navy / black
  enamel), the game name in BIG, BOLD, BRIGHT letters that light themselves at night (warm-white neon tubes, or letters
  made of bulbs), the marquee bulbs only as a thin sparse border (or none on the long sides) so the letters get the width;
  the board a little WIDER if the wheel allows; by day the letters painted cream / gold on the dark board. Readable at a
  glance at 402 day + night, every game in the rotation (check the longest names).
- THE SPEAKEASY WINDOWS REDESIGNED (Ben, Oct 24, after 7b — the windows themselves, not the scenes): today a thick frame /
  mullion splits each window down the middle and the rooms are cluttered, so the scenes read as busy fragments. REDESIGN:
  BIG CLEAN panes — a slim frame, at most ONE thin rail placed HIGH (a 1920s one-over-one sash with the meeting rail in the
  upper third, or a transom), never a bar through the middle of the scene; deep reveals + a sill; LESS INSIDE: each room =
  a warm wall gradient + ONE light source (a lamp / the back-bar glow) + one or two strong silhouette shapes; furniture as
  dim simple shapes or none; curtains only framing the edges, never crossing the middle. An empty room is still beautiful
  (soft lamplight, a curtain, a plant). THE TV WINDOW = the UPPER-RIGHT window (Ben's memory of the plan — move it from the
  upper middle). Keep every moment working inside the new panes.
- THE WALL-WASHERS READ AS EXTRA ARCHED WINDOWS (Ben's close-up, Oct 24): the lit piers are tall evenly-bright panels with a
  hard ROUNDED TOP edge, so they look like more arched windows / doorways between the windows. FIX: a small visible fixture
  under the cornice on each pier; the light a bright hot-spot just below it fading DOWN fast in a soft V / cone (the top
  third of the pier, then gone), no hard outline, the brick texture showing through the light; dimmer overall — accents,
  not panels.
- THE SHOPFRONT LIGHTS STILL SMOKY (Ben's close-up): the door sconce and the shop's inside lamp are still hazy soft blobs.
  Apply the crisp-light rule for real: a small bright source, a tight halo (a few pt), and the light on the surfaces (the
  door, the frame, the awning's underside, the step) — no wide translucent glow. The barber pole is good now (bright, crisp).
- THE ROOFTOP STRING LIGHTS REDONE (Ben, Oct 24: "they look cheap") — DECIDED: a café-light canopy of FEWER, BIGGER warm
  Edison bulbs (~8–12), widely spaced, deep swags between 3–4 tall posts; party colours on party nights; NOT dashed neon on
  the railing (the speakeasy stays the warm incandescent building). If still cheap after refining → remove. THE AWNING AT NIGHT: a subtle warm
  glow, the 1920s way (a lamp under it lighting its underside + the shopfront, faint translucency, a warm rim), not backlit.
- THE LIGHTHOUSE BEAM ON PARTY NIGHTS — DECIDED: STAYS WHITE (the owner asked, then left it to Claude, Oct 24): on a party
  night nearly everything is already in colour (the skyline, the sky beams, the wheel, the string lights, the barber pole);
  the lighthouse's clean white beam sweeping across it is the calm anchor + contrast that makes the colour pop. Do NOT
  colour it.
- THE LIGHTHOUSE BEAM IN HEAVY FOG — CHECK IT (the owner, Oct 24: "almost lasers, too sharp"): in real fog a lighthouse beam
  looks BROADER and SOFTER, not sharper. It is a wide, glowing cone with soft edges that fades with distance, plus a bright
  bloom (a halo) around the lamp itself; the denser the fog, the shorter and more diffuse the beam. The thin hard-edged look
  belongs to clear air, if anywhere. Make the beam's width, edge softness and length follow the fog density (light fog: a
  faint crisp shaft; heavy fog: a wide, soft, shorter cone + a big glow at the lamp). Same for the sky beams /
  searchlights in fog. Fold into 6b (the sky) or Part 9 (weather), whichever comes first.
- THE BASEMENT WINDOW MUST STAND OUT (the owner, Oct 24: "you can't really tell"): the low window at the bottom of the
  speakeasy is where the real club is, so it's the speakeasy's heart and should read as different from every room above.
  A DEEPER, RICHER light than the rooms above: a low, smoky amber edging toward copper / red, the only window that colour,
  a bit brighter. Give it LIFE through movement, not a faulty flicker: shadows of dancers / people passing behind it now
  and then, the light slightly warming and dimming as they pass; on party nights a gentle pulse with the beat (the
  music's heart is down there). A very rare brief flicker is OK as a bonus (an old wire), never often. Goes in the people
  pass (8P) with the foreground.
- THE LAMPPOSTS GET A LITTLE LIFE (the owner, Oct 24): YES, but RARELY. (1) At dusk the lamps switch on ONE BY ONE with a
  short stutter as each warms up (not all at once). (2) Very rarely (one lamp, every several minutes at most) a lamp gives a
  brief 2–3 flicker stutter and settles, like an old wire. Never the lamps flanking the crosswalk during an event, never
  more than one at a time, never a strobe. (3) Optional rare moment: one lamp goes out for a few seconds, then comes back.
  Pairs with the neon flicker sound slot (softer, a light tick). Goes in 8P.
- THE CROSSWALK MUST BE LIT (the owner, Oct 24: the lamps flank it but no light lands ON it): the two lamps framing the
  crossing must throw their pools ONTO the crosswalk itself; the pools overlap across the stripes so the whole crossing reads
  as the brightest strip of ground on the promenade at night. The painted stripes catch the light (pale, slightly glossy),
  the wet-weather sheen later (Part 9). Still crisp: a clear pool with a soft edge, no haze. People cross here in 8P, so they
  must read clearly while crossing. Goes in 8P.
- THE STREET UNDER THE DOCK — FLATTER + ITS OWN COLOUR (the owner, Oct 24 iPhone, day: "too bumpy… needs grout"; wants a
  slightly different shade, maybe reddish brick): today each stone is a rounded pillow with a strong highlight, so the strip
  reads lumpy. Make it a real 1920s Midwest BRICK STREET (Grand Rapids still has some): rectangular paving bricks, SMALLER and
  more regular than the promenade's cobbles, laid tight in rows across the street with thin dark tar / sand joints; FLAT
  shading (a faint bevel, no pillow highlight); a muted, aged OXBLOOD / brown-red, darker and less saturated than the
  promenade and the brick compass, so it frames the bottom of the screen without pulling the eye or competing with the
  speakeasy's brick. Worn smoother and darker along the wheel paths and beside the streetcar rails; the rails set flush. A
  clear curb step between the promenade and the street. Night: darker still, with the lamps' light landing on it softly.
  Goes in 8P (the people pass touches the foreground anyway).
- SKY SOUNDS LOUDER AGAIN (the owner, Oct 24 after SPOL's +6 / +3.5 dB): everything but the animals a bit louder still;
  the F-16 JETS must be REALLY loud. How, without the music being overpowered: (1) the jets another ~+6 dB, plus a brief
  MUSIC DUCK (the music dips ~3–4 dB for the 2–3 s of the pass, then eases back), like a real flyover; the peak
  stays capped, never a startle; (2) a "phone presence" EQ on the aircraft (a gentle lift around 1–3 kHz), since phone
  speakers can't play the low roar, so they read louder without more level; (3) the balloon burner + the helicopter
  ~+4 dB, the airliners / banner plane / drone hum ~+3 dB; the geese + gulls + all animals unchanged. Goes in 8P's
  carry-over.
- THE SPEAKEASY + PEOPLE SOUNDS ARRIVED (Grok, Oct 24; ~/Downloads/city-sfx, credits.txt "Speakeasy + people sounds"; all
  CC0 / Pixabay / Sonniss / Mixkit). 8P imports them into their slots with Grok's trims as a starting point (he measured,
  didn't listen: confirm by analysis and cut any readable words, music or modern sound). The bus: cut idle + pull-away from
  car-1920s-pass-3.wav (the 1945 truck, more period-correct) instead of the diesel stand-ins. The street-crowd file is
  missing: build the lobby line's murmur from rooftop-party.mp3 / bar-ambience-close (low-passed, quieter) or leave the
  slot empty. Stand-ins (cat-land, door-slot, bus-door) are fine at this size. tv-murmur is the weakest: use it only if it's
  clearly indistinct talk with no music; otherwise leave the slot empty.
- THE LIFE + WORKERS + WILDLIFE SOUNDS ARRIVED (Grok, Oct 24; 30 files in ~/Downloads/city-sfx, credits.txt "Life + workers +
  wildlife sounds"; all Sonniss / Mixkit / Pixabay-CC0, no attribution). The NEXT PASS THAT TOUCHES SOUND imports them with
  the add-city-sfx script (8b at the latest; FP3b's street-door, jogger-trip, glow-wand-swish, crowd-clap + crowd-whoop can
  go in sooner): Grok's per-file trims + gain notes are a starting point (measured, screened by speech-to-text + a music
  detector, NOT listened to — confirm by analysis). Calls: traffic-far is MODERN traffic → leave that slot empty (or so low
  it's only a texture); police-car-1920s → prefer cutting it from car-1920s-pass (the 1929 Volvo); trash-truck is a stand-in
  engine — build the visit from its arrival / departure + the trash-can-lid + crates hits; market-murmur: never use 88–98 s
  (voices); raccoon-chitter is a hiss — use only if it isn't scary, else empty; siren-1920s + police-whistle: far and soft.
  tv-murmur STILL EMPTY (Freesound 475628 / 434508 if the owner downloads one).
- THE AIRCRAFT BEACONS IN FOG (the owner, Oct 24, wanted the hero buildings' tops blinking WHITE in unison in fog, like
  anti-collision lights; Claude pushed back on the colour): the synced beacons already exist; keep them RED. White strobes are
  a modern (1970s+) look, harsh and startling, and wrong for a cozy 1920s city. Old obstruction lights were slow, steady
  red glows. What fog SHOULD do to them: make every beacon bloom into a soft red halo that glows through the murk, the
  blink a slow, gentle fade on and off (not a hard snap), every hero / tall top in perfect unison, so the city's tops
  "breathe" red together in the fog. Check the beacons are actually visible on every hero top in heavy fog (the fog layer
  must not hide them; a halo is what you see when the building itself is gone). Fold into 6b / Part 9 with the fog beam.
- NEON OUTLINES MERGE INTO ONE SHAPE (the owner, Oct 24, party night, the right side: the BLUFF + DOUBLE AGENT towers and the
  buildings in front of them): overlapping buildings share the same pink outline, so front and back read as one strange
  blob. RULE: a building in FRONT never shares its outline colour with the building directly behind it — contrasting hues
  per depth layer (e.g. pink tower behind → gold / cyan / white front), on normal AND party nights (the party scheme assigns
  colours by layer, not one colour for all); the front building's outline cleanly OCCLUDES the one behind (a thin dark gap
  where they cross, the back outline stops behind the front silhouette); near outlines a touch thicker / brighter, far ones
  finer / dimmer (Neon Pass 3's depth rule). Check every overlap across the skyline at 402.
- 8b PEOPLE — DECIDED (the owner, Oct 24): GUIDED FREE WILL (a walkable map + small goals + routes, not fixed scripts, not
  physics). The CROSSWALK leads to a WATERSIDE SIDEWALK along the railing on the far side of the road; people cross, then walk
  LEFT or RIGHT along it and off screen (left = behind the speakeasy building, just keep going). Entry / exit points: the
  screen edges, the waterside sidewalk via the crossing, the barbershop door (day), the speakeasy side door (night), the bus
  at the curb, cabs on the back road; never off the bottom (under the dock). COUNT: up to ~12 at once at the busiest (not
  cluttered), down to a handful / none late at night, by the clock + weather + events (the director's budget). Silhouette
  art at ~25–30 pt: clear shapes, coats, hats, umbrellas, dogs; a few strong poses (walk, jog, sit, wave, point up, lean).
  (The boat landing / riding the wheel → FUTURE IDEAS.)
  + THE ROOFTOP PEOPLE (the owner, Oct 24 — don't forget them): the same people system on the speakeasy's ROOF as its own
  small zone — rooftop party guests (summer weekend nights / party nights: dancing, a bar cart, someone at the railing, a
  toast), the gardener by day through the seasons, the billposter / sign painters on the roof billboard's catwalk, a figure
  stepping out of the roof hatch / stair house to look at the view. They come and go through the roof hatch (never pop in);
  they stand TALLER than the parapet (7a: the parapet hides the roof deck from this camera) and walk in front of / under the
  billboard frame; their own small count (up to ~4–6 on a party night, 0–1 otherwise), inside the director's budget.
- THE LINE AT THE SPEAKEASY (the owner, Oct 23 — for Lobby 2.0 + 8b): friends in a lobby line up LEFT of the left globe lamp —
  along the barbershop front, to the left of the door, toward the bottom-left corner. Space check (Claude): that corner holds
  ~4–5 figures in a single file at phone size, so the line runs along the shopfront and bends down toward the corner (two-deep
  if needed); guests 6–8 wait in the open floor beside it; never cut by the left screen edge, never under the dock, the door
  always clear.
- THE BAND UNDER THE DOCK (the owner, Oct 23): with the dock showing, the promenade's curb lines up neatly against it; when
  the dock fades away (rest), an empty grey band shows below the curb. DECIDED (Claude's recommendation): NO camera slide (it
  would move the sign + sky on every tap / rest and cost a re-layout) — instead the scene is FULL-BLEED to the bottom of the
  screen and the band under the dock becomes a FINISHED STREET (the implied road made real): the near granite curb, a
  cobbled street with streetcar rails, a storm drain / manhole, puddle sheen when wet, the headlight sweeps on it; while the
  dock is hidden, an occasional 1920s car may visibly roll across (the same pass + sound); when the dock returns it simply
  covers the street again. Check at 390 / 402 / 430 (the band's height differs per phone).
- THE COBBLES AT NIGHT (the owner, Oct 23): the joints read as hard black gaps between bright stone tops (a "piano key"
  look) — fill them with a mid-tone GROUT / packed sand that catches some of the lamplight, lower the top-vs-joint contrast
  at night (soft, rounded falloff on each stone, no sharp black shadows), keep the lit tops' sheen; check by day too.
- THE SHOPFRONT LIGHT LOOKS SMOKY (the owner, Oct 23, night close-up): the light around the barbershop reads as a big soft
  warm FOG over the facade instead of light. The pro fix — light shows as three things, never a translucent wash: (1) the
  SOURCE (a bright core), (2) a TIGHT halo / bloom, small, (3) light LANDING on surfaces — the brick, the awning, the door
  frame, the cobbles near each lamp, with a clear falloff. Remove the big warm haze behind / around the barber pole; the
  POLE becomes a crisp, BRIGHT, cool-white "LED-like" glow — the glass tube lit from within, red / blue stripes vivid, a
  small tight halo, a little light on the wall beside it; the door sconce and the shop's inside lamp keep their warmth and
  level but get the same treatment (tight bloom + light on the surfaces, no smoky cloud). Apply the rule to every light on
  the promenade (globes, curb lamps, the cart).
  THE POLE'S TURNING IS STILL JITTERY on her iPhone (FP said smooth at 60 / 30 Hz): drive the stripe offset by real TIME
  (not frames), draw it at fractional positions with anti-aliasing (never snapped to whole pixels), keep it drawing every
  frame even under the day's 30 fps battery saver if that's what steps it; verify with a frame burst at phone dpr.
  PARTY NIGHTS (the owner's idea — agreed, kept classy): the pole's stripes turn NEON in the party colours (magenta /
  electric blue / gold instead of red / blue), a gentle punch on the beat, the same slow turn (never spinning fast); back to
  red / white / blue after the 2 am wind-down.
- AFTER FP — MORE (the owner's screenshot, Oct 23): the BENCH TREE becomes a FLOWERING CRABAPPLE (pink-white spring blossom;
  golden autumn with small red fruit) — the owner said yes; REMOVE THE PARKED BUS until 8b brings moving vehicles (a bus
  frozen behind the stop lights hides the crossing and looks stuck); the CART moves left of the medallion (it blocks the
  crosswalk today); the WAIT / WALK lantern FLOATS in the air over the road — mount it on a proper cast-iron post on the far
  curb (base visible); THE BIG FRAMING MAPLE (bottom right) looks off — a dark brown-black blob inside / behind its crown,
  a lopsided crown on a thin trunk: shade its inner leaves as a deeper orange-red (never a brown-black mass), a fuller rounder
  crown, the trunk visibly branching up into it, lit from the sun's side; the car sounds play with no car visible — fine
  while the dock covers the street; once the street under the dock exists, the car is visible when the dock is hidden.
- AFTER FP — CLAUDE'S + THE OWNER'S TWEAKS (Oct 23): REMOVE the red tree behind the DOUBLE AGENT blade (keep the orange
  maple); REMOVE the urn planter at the speakeasy's corner; MOVE THE MEDALLION to the middle of the promenade — the cart
  rolls across it on normal days, people walk over it; during an event the cart stops short / stays away; every seasonal
  centrepiece gets a HEIGHT CAP (below the vertical neon blade's bottom and the wheel's hub).
- PARTY-NIGHT TIMING MOVED EARLIER (the owner, Oct 23 — "so beautiful, I don't want it missed"): warm-up from 8:30 pm,
  PEAK from 9:30 pm, the midnight fireworks finale (Part 10), calming after 1 am, back to normal at 2 am. GUARDRAIL (Claude):
  the show needs darkness — in summer Grand Rapids' sunset is ~9:20 pm — so the warm-up starts at 8:30 OR when the blue-hour
  power-up has finished, whichever is LATER, and the peak at 9:30 OR ~45 min after that; the shared darkness value decides.
- THE PROMENADE RE-LAYOUT (APPROVED by the owner, Oct 23 — Claude's sketch promenade-layout.png): FURNITURE ON THE EDGES,
  AN OPEN FLOOR IN THE MIDDLE, THE FRONT EDGE CLEAR. Back row along the curb by the waterside road: tree · tall double lamp ·
  tree (the bench under it) · a planter · tall double lamp; the open walking floor in the middle with the MEDALLION at its
  centre (roughly under the wheel); the CART in the open right side with room around it; ONE big framing maple at the far
  right edge (framing, not covering the cart); the front edge above the dock clear — only two short warm globe lamps at the
  corners; ONE crafted planter tucked against the speakeasy's corner (open cobbles in front of the door + shop window).
  NIGHT LIGHT PLAN: cool pools under the tall curb lamps (the back row, the road edge, the bench); warm pools from the two
  corner globes across the front of the open floor; the speakeasy's warm spill across the cobbles in front of it; the
  cart's string-light glow; the medallion where pools overlap; headlight sweeps across the front edge; dim, never black,
  between the pools; no haze.
- THE BARBER POLE AT NIGHT, FIXES (the owner, Oct 23, after 8a): its glow is glitchy — the stripes / light look jagged and
  not continuous (fix the rotation: smooth, sub-pixel, continuous stripes, no stepping); it must POP more — a brighter, whiter
  glow than before (the owner now wants it brighter than the "soft yellow"), the clear hero light of the shopfront; the two
  lights beside it (the door sconce + the shop window's lamp) must not fight it — tone them down / fix their diffusion
  (soft, round, no hard-edged blobs).
- AFTER 8a — THE OWNER'S NOTES (Oct 23, collecting): (a) the billboard doesn't read as standing on the speakeasy's roof —
  it looks attached to the tall buildings behind (its frame / legs must visibly stand on the speakeasy's roof deck, in front
  of the skyline, the depth check) — her close-up shows why: the board's bottom sits ~a storey ABOVE the speakeasy's
  parapet and the gap between is filled by the brick buildings behind, with no legs crossing it, so it reads as bolted to
  them. Fix: steel lattice legs + diagonal bracing running DOWN in front of the far buildings to the speakeasy's roof deck
  (feet on the roof, just behind the parapet / string lights), drawn in the near layer, plus its shadow on the roof; or
  lower the board so its frame meets the roof. THE OWNER: "that space between the roof and the billboard looks chaotic —
  do what looks best". CLAUDE'S CALL: LOWER the board onto a SHORT, CLEAN steel frame — a simple lattice with a couple of
  diagonals and a catwalk, its feet on the roof deck just behind the string lights, the board's bottom only a little above
  them; the frame drawn DARK and solid enough to read as one structure (no busy city pattern showing through a tall gap);
  a soft shadow on the roof; the lamps on the catwalk. Never cut by the left edge, never covering the wheel; (c) THE STOP
  LIGHTS look wrong (the owner): today both face the camera, but the cars drive left ↔ right — the signal heads should face
  ALONG the road (seen from the side / at an angle, toward the drivers), and on the far side, facing the camera, a
  PEDESTRIAN signal for the crosswalk (a lit WALK / WAIT lantern, 1920s-style, the "WAIT" blinking before it changes) — or
  a period 1920s STOP / GO semaphore with arms; make the crossing read logically; (d) THE PLANTERS (the owner): the one
  in front of the barbershop needs MUCH higher quality (or something else instead), and both planters move out "toward the
  road" so there's open walking space between the planter and the shopfront (which road — the owner is explaining next);
  (b) the DOUBLE AGENT blade sign must be IN FRONT of the tree next to it (draw order).
- 8a DECISIONS (the owner, Oct 23): CUT the glass bus stop shelter (the bus stops at the curb). GROUND mostly COBBLESTONE —
  rounded granite setts that catch lamplight on their tops; rain = a wet sheen + reflections of the lamps / neon in the
  stones and puddles collecting in the joints; snow settles in the joints first, then covers; a smooth granite CURB edge
  and a ring of smooth stone around the centrepiece medallion. TREES (Claude's pick, the seasons must read at a glance):
  mostly SUGAR MAPLES (Michigan; full green summer, blazing red-orange-gold autumn, bare branches holding snow in winter)
  + 1–2 FLOWERING CRABAPPLES for a pink-white spring blossom; real trunks + branches (no round balls), ~5–6 in all.
  THE FLAG — REMOVED as a permanent piece (the owner, Oct 23): no everyday flagpole. On patriotic holidays / special events
  (Memorial Day, July 4th, Veterans Day, Flag Day…) the city DECORATES: flags on the street-lamp posts + red-white-blue
  bunting on the speakeasy; on half-staff days (Sept 11, official days) a flagpole appears for the day at the railing
  (base visible on the promenade, never over the lighthouse). Built with the holiday parts (11), not 8a. The bench, the cart and the planters in the clearly
  visible middle band, never low by the dock. THE GREY-BOX STEP STAYS (quick): 8a builds the rough layout first, sends the
  owner screenshots and WAITS for her OK before the real art — not an overnight run.
- Road, bus, cars, two BIG bright stop lights, the promenade, lamps (rich light at night), trees, bench, planters, the seasonal
  vendor cart, people (hats/coats readable), a FLAGPOLE with an American flag (waves in the real wind, lit at night,
  half-staff on official days — see Part 10).
- THE PROMENADE LAYOUT PLAN FIRST (the owner approves grey-box screenshots at her iPhone size before anything is built): three
  bands — THE CURB by the road (tall double-head Art Deco street lamps, trees in iron grates between them, the two stop lights, a
  glass BUS STOP SHELTER), THE PLAZA in the middle (open ground in front of the speakeasy door for Lobby 2.0's up-to-8 guests,
  the party-night line, crowds; a reserved CENTREPIECE SPOT just right of the door marked by an Art Deco medallion inlaid in the
  paving, where the BIG seasonal pieces go — the giant Christmas tree, a towering jack-o'-lantern pyramid, a harvest display, a
  July 4th stage, a Valentine's arch of roses — big but never covering the word towers or the needle; no fountain), THE FRONT
  WALK nearest the viewer (short warm globe lamps, ~5–6 trees in total big enough to read the seasons and never cut off at the
  corners, the bench under one, the cart, big stone FLOWER PLANTERS that change with the seasons); nothing under the dock;
  COBBLESTONE + PAVER ground that catches lamplight and shows rain, puddles and snow.
- NIGHT LIGHT: clear pools from the two kinds of lamps (tall cooler street lamps by the road, short warm globes on the paths),
  OVERLAPPING enough that every walking path is lit, DIM (never black) shadows between; warm spill from the speakeasy's windows
  and door, the cart's string lights and the neon; people always readable as silhouettes with a rim of lamplight.
- PEOPLE (crafted 2D figures placed in the 3D stage): they move in ALL directions — left/right, toward/away (scaling ~15–25 pt),
  crossing the road at the crosswalk waiting for the green, walking up to the door / bench (sitting) / cart / railing — with
  FOUR facing views (left, right, toward, away); correct overlap with lamps, trees, the bench and each other; walkable zones +
  paths (never through the cart, into the water or under the dock). The crowd FOLLOWS THE CLOCK (quiet early morning, a lunch
  rush, busy evening, near-empty ~3 am) plus more when more real players are online. Behaviours: groups walking together,
  stopping to chat, waving across; errands (the cart, a jogger, a delivery worker with a dolly); weather (umbrellas, hurrying in
  snow, coats + scarves in the cold, slower in heat); watching the view (leaning on the railing, photographing the skyline,
  pointing at boats) — all as big readable poses. Reactions: everyone stops and looks up at fireworks, the implosion, skywriting,
  the UFO; during the raid they casually freeze or scatter; they nod or step aside when your own figure walks to the door. No tap
  reaction on people. DOGS: 1–2 dog walkers at a time, medium/big breeds with clear silhouettes (big shaggy, a greyhound, a
  dachshund), drawn ~1.3× real size, trotting / sniffing a lamp post / pulling ahead, a contrasting leash line, on the nearer
  promenade.
- GULLS ON THE BILLBOARD (the owner, Oct 23): by day a couple of seagulls fly in and LAND on the top edge of the speakeasy
  roof's billboard (and its catwalk railing) — settle, preen, look around, the odd call (the gulls sound slot), then take
  off; more on windy / stormy days huddled, none at night. PREMIUM RENDER (the owner): the gulls must be crafted wildlife,
  not icons — a real gull silhouette and plumage (white body, grey wings, black wingtips, yellow bill), a proper landing
  (wings spread, legs down, a hop), folded wings at rest, readable on a phone — the bar for all the wildlife.
- Wildlife: pigeons that strut/peck and scatter (bus, walkers, a tap); gulls on the railing by day (huddled in real rain); a rare
  late-night coyote (the owner, Oct 24: "don't forget the coyotes" — REVISED so more people catch it: rare, any quiet night
  from ~10 pm, likeliest 1–4 am; it trots along the waterside sidewalk or across the empty promenade, stops under a lamp,
  turns its head to the camera — its eyes flash green-gold in the lamplight — then slips off screen; it only comes when
  the promenade is nearly empty and slinks away fast if someone appears; winter: its tracks left in fresh snow; ~12 pt,
  readable, a premium render; a distant yip / howl on full-moon nights); a raccoon raiding a trash can late at night; squirrels burying
  acorns in autumn; fireflies around the trees on summer nights; ducks near the railing, a heron on the pilings at dawn, fish
  jumping (ripple rings); a black cat on the speakeasy step (Halloween; maybe a tabby other times).
- THE TRASH TRUCK: early weekday mornings it stops on the road, a worker tips the curb bins into it, it rumbles off (the raccoon
  bolts if it's out).

## Part 9 — seasons + weather (only when real)
- Trees through the year; snow piling up on everything, snowball fights, snow plows leaving visible plowed lanes + snowbanks,
  visible road salting; rain + puddles; fog; frost; a snowman that grows through a real snowy day and melts when it warms.
- WEATHER AROUND THE NEON SIGN (only when real): falling SNOW lit by the sign's glow as it drifts past (flakes turning pink near
  the tubes); RAIN as lit streaks near the tubes; raindrops dripping off the bottom of the tubes with glints, day or night.
- WEATHER ON THE NEON LOGO ITSELF (the owner, Oct 22 — only when real): RAIN = drops beading on the tubes, catching the glow,
  running down and dripping off the bottoms; SNOW = collects on the top edges of the letters + the mounting while the sign is
  OFF (by day); once lit, the warm tubes melt it — wet, glistening tubes, drips, and small ICICLES forming under the
  letters on freezing nights (real neon runs warm, so snow never buries a lit tube); ICE / FREEZING RAIN = a clear glaze
  and icicles on the frame and brackets, the lit tubes shedding it. Readability first: the word always reads.
- WEATHER ON THE DOCK + THE MENU / MUSIC BUTTONS (the owner: RAIN and ICE only, no snow): the glass UI shows rain drops on its
  glass (a few beading, the odd one running down) and, below freezing, a light frost creeping in from the edges. Subtle,
  at the edges only — never over the text or icons, never lowering contrast, taps unaffected; off with reduced motion.
  City 2.0 only. (The same weather lives on the lobby later.)
- SNOW LIKE A REAL WINTER (the owner is in Michigan): snow STAYS on the ground until it really melts — never only on the days
  it snows. Use the real SNOW ON THE GROUND at the player's place (Open-Meteo's snow depth, through the existing /api/sky), with
  a fallback snowpack model from the real snowfall + temperatures (adds when it snows, melts slowly only above freezing). The
  stages read by COLOUR + COVERAGE over big areas (the glance test): FRESH = bright pure white on everything incl. branches and
  sign tops; OLDER = duller off-white, mostly off the branches, wide darker footpaths worn into the promenade; PLOWED BANKS =
  grey-brown mounds along the road that last longest; THAW = slush, a dark shiny wet road, puddles reflecting the lights,
  icicles on the speakeasy's roof edge; SPRING = white patches on dark ground, the last dirty piles in the shade. No snow
  anywhere it isn't really on the ground (Florida never, Colorado comes and goes). Don't build texture differences (crusty vs
  fluffy) or drips — too small to read.

## THE CONSTRUCTION TOWER (slot in the layout now; the cycle with the calendar in Part 9; the grand opening uses Part 10's
## searchlights + neon)
- ONE dedicated skyline spot: the owner's pick is the tall tower LEFT of the Ferris wheel, behind the JAZZ building (about a
  quarter across on the iPhone, fully in the clear, its base hidden behind JAZZ + the speakeasy). If that tower is the vertical
  word tower (wordV), move the vertical-word job to another tall narrow tower that is never demolished first.
- A ~one-year cycle on the real calendar, the same for everyone: SPRING the old building comes down by IMPLOSION — always — a
  fixed-time spectacle (the banner plane announces it a few days before, e.g. "DEMOLITION SUNDAY 10 AM"; a siren, flashes down
  the floors, it drops straight down, a huge dust cloud rolls over the harbor; anyone who missed it sees the rubble + settling
  dust later); late spring cleanup (excavator, fence, a hole); SUMMER → FALL the new tower rises a few floors a week (a crane
  swinging by day, work lights at night); TOPPING OUT (a small evergreen + flag on the top beam); LATE FALL the grand-opening
  night (its neon lights for the first time, searchlights); WINTER it stands finished. Each cycle a different design, so the
  skyline evolves over the years.
- The crane may overlap the sign / tagline area (the owner is fine with it) — the sign always draws on top and stays readable;
  keep the crane's red beacon from blinking right beside the NEON letters.
- THE SUN MUST NOT BREAK when the building is gone (the owner's catch): the sun's arch fit (`archFor`), the sign's catch time
  (catchAt: the sun going behind the rooftops) and the god-ray corridors use a FIXED skyline envelope that treats the
  construction slot as always full height; the actual drawing hides the sun naturally; the slot stays out of SUN_GAPS; beacons,
  outlines, windows and any searchlight on it follow the building's stage. Test at every stage (standing, rubble/empty lot,
  half-built frame, finished): the arch, the catch time and the rays stay stable and correct.
- Small renovations now and then elsewhere: facade scaffolding, a crown being re-tubed with new neon, a billboard repainted.

## Parts 11a / 11b / 11c — holidays (+ the banner plane's messages)
- THE SIGN DECORATION SYSTEM (built in 11a, used by every holiday + special event; hangs on Part 3's LOGO_ANCHORS):
  WRAPPED + GROWING (garlands, string lights, cobwebs, spring ivy / flowers wound round the tubes, growing day by day where a
  build-up calls for it); PERCHED ON TOP (snow caps, a pumpkin on the O, a hat on the N, a bird landing); ADD-ON TUBE PIECES (a
  heart, a shamrock, "2027", a firework burst, a crown — built like the logo's tubes); SPARKLE + PARTICLES (glitter, confetti);
  VISITORS (a cat walking along the top, a bird perching, the spider, the witch flying past). Anything that dangles has VARYING
  lengths. (Not a general system: tube makeovers — but the Christmas candy-cane tubes stay; no draped bunting; no glows behind.)
(Built AFTER party nights + fireworks, which is now Part 10. 11a = autumn + the shared systems, 11b = Christmas + NYE,
11c = Valentine's, St. Patrick's, Easter, Memorial Day, July 4th, 9/11, Veterans Day.)
- **Halloween (Oct 1→31 build-up):** the spider's web on the NEON sign grows every day over the tubes (hero-quality silk, dew
  drops catching the pink neon), fully woven by Halloween night, gone Nov 1; jack-o'-lanterns multiplying + carved on the
  speakeasy steps through October; ghosts behind curtains, mummy silhouettes in windows; zombies shambling + costumed
  trick-or-treaters on the promenade on Halloween night; the witch (Part 6); bats; the black cat (tap: hisses, darts off); the
  lighthouse beam eerie green; the wheel orange/purple; spooky LIGHT (deeper shadows, green-tinted windows, flickering lamps;
  fog only when really foggy); LEGENDARY: a translucent green ghost ship drifting across the harbor on Halloween night.
  Comes down overnight into Day of the Dead.
- **Day of the Dead (Nov 1–2; warm, colourful remembrance, not spooky):** marigolds in the planters + garlands on the lamp
  posts, a marigold petal path to the speakeasy door, papel picado strung across the promenade fluttering in the real wind,
  candlelit ofrendas in windows (read as warm flickering glow); the NEON sign: a crafted marigold garland on the tubes, papel
  picado between the letters, candles at the base, tubes warming to marigold/pink; Nov 2 at dusk a candlelight PROCESSION
  along the waterside road (candles, Catrinas with flower crowns, a mariachi trio); rare monarch butterflies by day. Nov 3 down.
- **Thanksgiving:** a cozy November (cornstalks on lamp posts, hay bales, pumpkins + gourds, mums, cider + chestnuts at the
  cart, geese in V's, peak autumn trees); the Wednesday before = a homecoming party night at the speakeasy; Thanksgiving
  morning a BIG balloon parade down the waterside road (original unbranded giant balloons — turkey, pumpkin, acorn, cider cup —
  with handlers on ropes, a marching band, reacting to the real wind) — build the parade system reusable; afternoon/evening
  quiet + warm (people carrying pies, candlelit family tables in windows, a TV with a football game, a kid tossing a football,
  chimney smoke, an amber skyline); the NEON sign in amber tubes with a crafted harvest wreath (wheat, oak leaves, gourds,
  warm bulbs; no cartoon turkey); Black Friday: the first Christmas crew arrives, shoppers with bags.
- **Christmas (the day after Thanksgiving → Christmas Eve, a little more each day):** visible crews on ladders/roofs stringing
  lights now and then; the speakeasy's windowsills, roof and water tower first, then building after building; lights mixed by
  building (the speakeasy + sign in multicolour C9s, some buildings warm white, others colour); wreaths + garland on every lamp
  post; a Christmas tree vendor cart; carolers; a giant tree on the pier/promenade that LIGHTS EVERY NIGHT AT DUSK in a
  bottom-up wave, the star last (the first night a full ceremony with a crowd and a ripple across the skyline); the Ferris wheel
  lit like a giant ornament; a lit boat parade; the water tower wrapped/outlined; a classic lit wire-frame sleigh + reindeer on
  the speakeasy roof with chase lights that make the reindeer gallop; Santa's sleigh across the moon on Christmas Eve.
  THE NEON SIGN: a real fir garland with glowing multicolour glass C9 bulbs (more each December night), snow on the letter tops
  + icicles only when really snowing/freezing, twisted red-and-white candy-cane tubes on Christmas Eve/Day, "MERRY CHRISTMAS
  EVE." in the tagline slot. Must be MUCH more realistic than docs mockup neon-christmas.png (photo-real tubes, faceted bulbs
  with filaments casting coloured light on tubes/garland/snow, layered needles, sparkling snow). Every bulb lights its
  surroundings and reflects in the wet street and the harbor. Down from New Year's Day over a few days.
- **New Year's Eve (each player's own midnight):** the biggest night of the year, a party night whatever the weekday; balloons +
  a HAPPY NEW YEAR banner at the speakeasy; the banner plane in the afternoon ("SEE YOU AT MIDNIGHT"); a dressed-up crowd, the
  door line, gold/silver windows, searchlights; the party yacht + helicopter landing GUARANTEED; the countdown in the tagline
  slot (last 10 min); a glittering BALL drops down a landmark tower's mast in the last 60 s; the towers count down 10→1 in
  windows; at zero "2027" across the towers, fireworks + every boat's horn at once; the NEON sign's midnight sequence. New
  Year's Day morning-after: confetti in the gutters, a street sweeper, people in sunglasses with coffee.
- **Valentine's (romantic + elegant, never cheesy):** Feb 1–13 hearts/roses in some windows, the cart sells roses, a florist
  delivery bike, heart displays in shop windows; the day: couples arm in arm, the nervous-date story told by big poses (waiting,
  pacing, an oversized red bouquet, the date arrives, a hug); at night candlelit tables for two in windows, the speakeasy a softer
  jazz date night, the wheel rose/red, a heart on a tower, Rosie as a dinner cruise (string lights, a violinist, tables); the
  NEON sign in rose tubes with a crafted heart tube. No Cupid, no proposal.
- **St. Patrick's, Easter:** in kind (to be detailed); **July 4th:** the air show + fireworks show + flags; **Memorial Day:**
  flags in windows + on buildings, F-16 flyover with the missing man formation, the promenade flag at half-staff until noon then
  raised; **Veterans Day:** flags + a flyover; **September 11:** the flag at half-staff and at night two searchlight beams straight
  up (a tribute in light), quiet and respectful.
- The banner plane carries holiday messages.

## Part 10 — party nights + fireworks (built BEFORE the holidays)
- Fri/Sat build all night: classy warm-up → spectacle at the peak → the midnight finale. Special party nights also on the
  Wednesday before Thanksgiving (homecoming), Valentine's (a softer jazz date night) and NYE (the biggest).
- The party yacht + helicopter: legendary-rare on party nights, guaranteed on NYE.
- Rosie's + the pier's bulbs CHASE on party nights (Neon Pass 4 could only pulse them — Rosie's bulbs are baked into her picture).
- (MOVED UP to Neon Pass 3 — the owner's call; Part 10 keeps the midnight finale + fireworks on its hook.)
  PARTY NEON WITH VARIETY (the owner: today it only turns the outlines into dashes running round the border): a choreographed
  light show across the skyline, different by building and changing through the night — tubes pulsing on the beat, colour
  sweeps across clusters, ledge bands lighting floor by floor up a tower, fins strobing in sequence, crowns flashing on the
  drops, call-and-response between towers, a few buildings holding steady so it never looks like one effect everywhere; the
  chasers stay as one effect among many. Builds with the night (classy → spectacle → finale).
- FIREWORKS (one premium engine, also used for July 4th): real shell types (peony, chrysanthemum with trails, gold willow,
  palm, ring, crossette, crackling glitter/strobe, comets), sparks that cool white→colour→ember and fall with gravity + drag,
  every burst lighting the buildings, smoke and water, reflections in the harbor, smoke drifting on the real wind lit from
  inside, depth (small far ones behind the skyline, bigger near). NYE timeline: from dusk one or two random fireworks now and then
  around the city; NONE in the hour before midnight; at zero a ~30 s grand finale (opening salvo from barges → building layers →
  a full sky of crackle → a huge gold willow curtain raining over the skyline, boat horns); then random fireworks for the rest
  of the night, thick the first hour, thinning to a last pop before dawn. The finale is a HEAVY event; weaker phones get fewer
  sparks, never ugly.

## Part 12 — easter eggs, sounds, memory, desktop, switch-over
- THE AUDIO'S SIZE (checked Oct 24: the repo ≈ 334 MB on GitHub incl. history; audio 249 MB of it — music 231 MB in 91 songs,
  the city sounds only 7 MB, the other SFX ~1.5 MB). Fine today (GitHub's soft guidance is under ~1 GB; Vercel deploys
  from Git; a phone only downloads the songs it plays). AT THE SWITCH-OVER (Part 12): remove the City 1.0-only songs + art the
  app no longer uses (the owner: City 1.0 is obsolete). BEFORE RELEASE / when the repo nears ~700 MB (the new games' songs):
  move the music out of the repo to a file host / CDN (e.g. Vercel Blob or Cloudflare R2), and consider re-encoding songs to
  a smaller phone-friendly bitrate; never commit a replaced song twice (old versions stay in git history forever).
- THE TRIPPING JOGGER (the owner's idea, Oct 24 — the ONE exception to "no taps on people"): tap a JOGGER mid-run and they
  stumble, pinwheel their arms, tumble to the cobbles (a small dust puff), sit up, brush themselves off, glance around
  embarrassed, then jog on as before. Slapstick, never painful-looking. A generous invisible tap target (~44 pt) that moves
  with them; each jogger can trip once per pass across the screen; local to the player who tapped (not synced); a soft
  scuff + thud sound, no voices. Other people still ignore taps.
- Tap eggs (never explained): the door knock; pigeons scatter; the black cat; a lit window → someone appears and waves; the
  lighthouse 3× → the beam spins; the bus / a boat → its horn; the Ferris wheel → a gondola rocks; the night sky 7× → a shooting
  star; the full moon → the coyote howls. Common → legendary. LEGENDARY once a year: a harbor monster (a dark shape + a fin
  gliding across), a submarine periscope that rises, turns to look at you and sinks, THE UFO ABDUCTION (late at night the
  promenade lamps flicker and dim, pigeons scatter, the UFO glides in low over the harbor and stops above the promenade, a
  tractor beam snaps on and 2–3 people float up spinning, arms flailing, one hat falls off and stays on the ground for a while
  as the only evidence, the UFO zips away, the lamps come back; ONLY background people, never a real player's figure or room
  guests); the ghost ship (Halloween). A few subtle, rare Grand Rapids nods (e.g. the October salmon run leaping).
- The music-off soundscape (foghorn, gulls, a far honk, light traffic, a soft city hum; a night version). Sound never relies on
  subtlety (the music is loud): moments use a music change, a duck or crisp on-beat hits, always with a strong visual.
- The desktop/wide panorama; also make room for a TV camera (see TV mode). The owner's laptop review (Oct 22, 1440-ish
  Chrome): today it looks "kind of weird" — a huge EMPTY beige promenade plane fills the bottom third with tiny people,
  the skyline is a thin squashed band, the same buildings repeat across the width, the speakeasy is small in the corner,
  and the sign floats small. The desktop camera must be composed as its own cinematic shot (not the phone camera
  stretched): a lower, closer camera so the skyline is big and tall, more water + reflections, the promenade a shallow
  foreground band (not a parking lot), the speakeasy a proud corner, varied buildings across the panorama (no visible
  repeats), the sign bigger; the same care at 1920×1080 and on a TV. BEFORE writing this prompt, ask the owner her
  questions about the desktop view first (her request).

## After the city
- **CITY CONTROL (/admin, phone-first):** global messages with a "just my devices" preview before GO LIVE; "send now" = everyone
  on the title within a minute + anyone opening later until it expires; the banner plane (type ≤ ~24 chars, colour, live preview,
  schedule incl. each player's local time, passes, expiry, edit, cancel); words in the windows for a time window; one-tap events
  (searchlights, a surprise weeknight party, a fireworks show, the party yacht); a short tagline message; a clear-all kill switch;
  the audit log. Written to a public read-only DB node only the server writes.
- **LOBBY 2.0:** no separate lobby screen — the live city IS the lobby; dock in a room: INVITE · GUESTS · GAMES · BOARD · CHAT ·
  PLAY. On host/join the strangers drift off your screen, your figure arrives (walks in / bus / cab) at the host spot by the
  door, friends arrive and walk up; the same spots on every phone (join order); a guest whose signal drops walks to the bench
  and sits, dimmed (or stands faded if the bench is full) and returns on reconnect; leaving = waves + walks off / hails a cab;
  game start = the NEON sign powers down and the game's tube logo powers up ("TONIGHT"), everyone walks inside, the view pushes
  through the door; after the match they walk back out. The password sign in the speakeasy window (the hush word); the real
  word always big in INVITE / the dock. THE PUBLIC TITLE CROWD: a background crowd generated on each phone (clock-seeded,
  dressed for the season/weather) + a once-a-minute server summary (online count + ~a dozen random online players' name, emblem
  colour, outfit) every phone reads; those players appear as figures in their outfits, tap → name + card; players in a game
  are "inside" (busier windows); picks rotate every few minutes; density follows how many are online, never dead; an "Appear in
  the city" setting (on by default); only public BOARD info. Readable: ~20–30 people on a phone, 40–60 as a packed crowd.
- **LOBBY CHAT BUBBLES (Lobby 2.0):** a sent chat message pops up as a speech bubble above that guest's figure and fades after
  ~5 s (longer for long messages, up to ~8 s); crisp app text ~13–15 pt, never covering the figure, clear of the dock; first line
  or two then "…", tap → the chat at that message; one bubble per person (a new one replaces the old), older ones fade faster when
  many are up and bubbles nudge apart; the profanity setting applies; the full history stays in the chat window; builds on the
  existing typing dots.
- **LATER — APP STORES + MONEY (a brainstorm for after City 2.0 + the big features are done; nothing decided):** keep the
  option open to ship NEON SPEAKEASY in the App Store / Google Play (Google: a Trusted Web Activity wrapper, ~a day, $25 once;
  Apple: a Capacitor wrapper + real app touches — push notifications, haptics, maybe Game Center — $99/yr; store purchases
  take 15–30 % and need the stores' own payments). The owner's ideas to brainstorm then: launch FREE with ~20 games, the
  complete city and progression; then a GAME PACK (~$3 for 10 more games), or a paid CITY 3.0, or a yearly "SEASON CITY"
  subscription where the city and the games change every year. Keep building nothing that blocks a store wrapper.
- **TV MODE (after Lobby 2.0):** neonspeakeasy.com/tv shows a short code + QR; the host pairs via SHARE TO TV on their phone (no
  typing on the TV); the TV is a viewer, phones are controllers; the TV plays the music + big moments, phones go quiet (tiny
  taps only); a TV camera with a bigger stage so people read from the couch, gentle slow drift, push-ins on moments; step 1 the
  lobby, walk-in, standings + podium; step 2 per-game TV views (trivia games, HIGH STAKES first); a lighter tier for weak
  smart-TV browsers (best on a laptop/HDMI, Mac/iPad AirPlay, a cast tab).
  THE TV IS NOT A PLAYER (decided): it joins the room as a SCREEN, not a player — its own node (e.g. rooms/{CODE}/screens/
  {id}), never in players/: it takes no player slot (8 players + the TV), never counts toward a game's minimum (DOUBLE
  AGENT's 4), never becomes host, never gets a figure in the lobby crowd, a card or a score; read-only by the rules; it
  shows a small "ON TV" chip in the lobby so everyone knows it's connected.
  MANY TVs AT ONCE (decided): friends playing from different houses can each put the game on their OWN TV at the same time —
  ANY player (not only the host) can SHARE TO TV from their phone; a room holds several screens (up to ~8, one per household),
  all showing the same synced moment on the server clock, each playing the music + big moments. A phone goes quiet only when
  ITS OWN TV is paired (its household's), so a friend without a TV still hears everything on their phone. The lobby chip
  shows how many TVs are on.
- **BOARD 2.0** (the bar inside the speakeasy, an Art Deco brass + enamel honor board, a live bartender, windows onto the live
  Harbor) and **PROGRESSION 2.0** (levels 1–100, a wardrobe whose pieces turn neon at night, entrances, a birthday on the
  profile so the towers can spell "HAPPY BDAY <NAME>").
  - MY CITY — UNLOCKABLE DECOR (the owner's idea): achievements, holiday challenges, streaks and sightings unlock decor a
    player places on THEIR OWN promenade and the speakeasy's ROOF to give the city their flair — e.g. finish the Halloween
    challenge → a special carved pumpkin they can keep out all year. Placed in FIXED DECOR SLOTS (not free-form — keeps the
    composition, the glance test and the speed safe): ~6–8 slots (the roof corners + edge, the plaza's planters, beside
    the bench, by the door, a lamp post). Shown only on the owner's own screen — and in a lobby, the HOST's decor is what the
    room sees (so friends see your flair when you host). Saved on the profile (server), across devices. Parts 7 + 8 must
    RESERVE these slots (hooks only); Progression 2.0 builds the unlocks + a simple "decorate" sheet.
  - THE TINFOIL HAT (the owner's idea): seeing EITHER UFO event (the TR-3B or the saucer abduction) unlocks a big crinkly
    TINFOIL HAT for the player's wardrobe — shiny, catching the light, glinting under the neon at night; a bonus for seeing
    BOTH (e.g. a glowing pair of alien antennae). Unlocked only by a real sighting (never a &force= preview).
  - STREAKS ARE BIG (the owner): they bring people back, so streak rewards are generous and visible — milestone rewards
    (wardrobe pieces, finishes, glows) at real streak lengths, built on the existing streaks + weekly goal (docs/profiles.md).
  - CITY SIGHTINGS (the owner): badges / achievements for SEEING legendary city moments — the periscope, the UFO abduction,
    and the other rare events and easter eggs (the aurora, the raid, a lunar eclipse…). The city reports a sighting when the
    event is really on the player's screen (the scheduler already knows); a collection on the profile shows found + "???".
    REVISED (the owner, Oct 23 — a passive award feels wrong: "they don't even see it and get an achievement… I already
    missed that"): a sighting counts only when the player TAPS THE EVENT while it's happening ("spotted!"): a generous tap
    area, a small camera-flash / polaroid moment, then the badge. Missed ones stay "???" in the collection, with a vague
    hint ("something strange over the harbor at night…"), so a miss becomes a reason to come back, never a confusing award.
  - "CALL IN A FAVOR" (REMIND THE OWNER when Progression 2.0's prompt is written — her OK, Oct 23): players earn a few
    favors by playing; one favor triggers a moment for THEIR ROOM while friends are in the lobby — fireworks, a sky
    message, the party yacht passing, a song request at the bar — limited (e.g. about once a week), so the world stays
    shared and the moment stays special. (Rejected: per-player control of the city schedule — it breaks the shared world.)
- **MENUS 2.0 (after Part 12's switch-over, judged over the real Harbor — the menus' glass sits over a still of today's city
  until then):** one pass for settings, chat, help, the game list, the profile card and toasts together: calm, classy warm glass +
  brass + a touch of neon that lets the city shine through; readable and fast, never as flashy as the city.
- **THE GAME LIST REVAMP:** quick filters SOLO · ON TV · SAME ROOM · FOR TWO (each game tagged with every way it plays; FOR TWO
  stars the planned nightly two-player bedtime game).
- **NEXT NEW GAME IDEA (follow up with the owner):** a multiplayer memory SHOOTING GALLERY — a 3×3 → 4×4 → 5×5 grid of targets
  flips to show pictures for ~5 s (shorter later), flips back, a picture is called (later 2–3 at once) and the fastest correct
  tap scores; wrong taps lock you out briefly; twists (swaps, decoys, a golden target); server-clock timing; a 1920s shooting
  gallery in the speakeasy's back room; fits SAME ROOM, FOR TWO, ON TV (grid on the TV, phones as triggers) and SOLO daily.
- **BITCOIN NODS (the owner is a big fan; subtle, rare, never explained, never prices or ads):** a ₿ glyph in the window font;
  JAN 3 (the genesis block, Bitcoin's birthday) an orange ₿ glows on a word tower at night; OCT 31 (the whitepaper's anniversary)
  one jack-o'-lantern on the speakeasy steps is carved with a ₿; MAY 22 (Bitcoin Pizza Day) a pizza delivery scooter pulls up to
  the speakeasy door and a small ₿ glows in one window.
- **BIRTHDAYS (once a player can add one, Progression 2.0):** celebrated ONLY for that player and their room — HAPPY BDAY <NAME>
  skytyped or lit on the word towers on their screen and their friends' screens in the room; never public.
- **DAY + NIGHT GAME SKINS (after City 2.0, game by game where it makes sense — GRIDLOCK, NEON PAR, SLIPSTREAM first):** night =
  super neon and bright, day = calmer and sunlit; a GLOBAL setting AUTO (default: follows the real day/night and respects ALWAYS
  NIGHT) / ALWAYS DAY / ALWAYS NIGHT with a per-game override; on AUTO the skin LOCKS at match start (never switches mid-game);
  light seasonal / holiday touches that never change gameplay; gameplay identical in both, both readable, each player sees their
  own; one shared day/night helper from the city's sky code; the walk-in from the city into a game matches the skin.
- **Later:** single-player / vs-AI modes and the 3 daily challenges (morning Wordle-style, afternoon Minesweeper, evening
  Overclock ×6) announced by the banner plane; profile pages for other players.

## OWNER'S NOTES — OCT 25 (after 8b1)
- **THE TR-3B ON THE IPHONE AFTER 8b1:** (1) STILL LAGGY — his readout during it: 53 fps, 16 % slow (session 11.8 %, "heavy
  1/2") at tier 2. Profile what runs per frame during the event (the blackout strips, the circuitry pulses, the people
  reacting, the jets' trails, the sounds' per-frame work) and cut it to a normal night's cost on a phone. (2) THE MUSIC
  EFFECT STILL ISN'T RIGHT: the AUDIO panel read "NOT SOUNDING" during it. audio/music.js#bendMusic bends the <audio>
  element's playbackRate as low as 0.25, AND screens/harbor/sounds.js#legendSounds ducks the music AND closes a low-pass
  ("muffled, almost gone") — and iOS Safari likely MUTES a media element below ~0.5× speed, so the song just dies. FIX:
  floor the rate at ~0.55–0.6 (verify on WebKit it still sounds), pitch drop on (preservesPitch off), add a WARBLE (a slow
  ±2–3 % wobble on the rate, like a warped record), only a LIGHT duck (a few dB) and a partial low-pass — the song stays
  clearly audible, slow, deep and wrong; it spins back up after the jets. The AUDIO panel reads "sounding" throughout.
- **8b1 REVIEW:** (1) the BOAT WHISTLE ~10 % louder (the noon steam whistle + Rosie's horn, ~+1 dB). (2) BENCH BUG: a person
  walks to the bench where someone already sits, sits ON TOP of them and disappears — seats must be RESERVED (a bench has
  2–3 seats; a taken seat is never chosen; if full they walk on or stand nearby). (3) REMOVE THE DUCKS (the crossing) and
  THE RACCOON ("you can hardly see them") — keep the trash can (the trash truck uses it). (4) THE WORKERS — EXTREMELY HIGH
  QUALITY: they must LOOK great and MOVE great — distinct period work clothes per trade (the milkman's white cap + coat,
  overalls, the cop's uniform + helmet, the painters' caps + spattered smocks, aprons), real props in their hands (crates,
  the ladder carried by two, the paste bucket + brush, the squeegee), believable WORK MOTIONS (a ladder climbed rung by
  rung, brush strokes, lifting with the knees, the billposter smoothing a sheet), weight + timing (heavy things slow), no
  sliding, no snapping between poses.
- **THE RAID — REVISED SCHEDULE (supersedes "2 raid nights a week"):** it follows the BOOTLEGGERS — the night after a
  bootlegger delivery has ~50 % chance of ONE raid, in prime time (~9–11 pm); plus a rare PARTY-NIGHT raid ~once a month;
  ~one a week in all; seeded (the same for everyone); never during holiday moments, the midnight finale, a legendary sky
  event or a worker show. THE LIGHTS: keep the red + blue wash (reads instantly as police on a phone — the neon-1920s
  fusion) on period black-and-white cars from the shared 1920s vehicle kit.

## OWNER'S NOTES — OCT 25 (after 8b2)
- **THE TR-3B's MUSIC — STILL BROKEN ON THE IPHONE** (8b2 Group 0's raised-floor bend was ALREADY LIVE when he tested, 11:29–11:36
  am): his AUDIO panel during the TR-3B (looping from the panel, party on): "NOT SOUNDING", "song clock still at 96.6 s …
  moving … still at 98.4 s", probe 0.000, heals 13 (reload (stalled)) all failing, "STILL". With the TR-3B OFF + a reload:
  "sounding", probe 0.224, heals 0. So the music system is healthy and THE BEND ALONE kills the song: changing the <audio>
  element's playbackRate on iOS Safari stalls / silences it. DECIDED APPROACH: never touch the element's playbackRate again.
  Do the tape stop in WEB AUDIO: as the craft nears, decode a ~20 s slice of the current song from its current position
  into an AudioBuffer, crossfade from the element (paused) to an AudioBufferSourceNode playing that slice, and ramp ITS
  playbackRate down (speed + pitch drop together, smoothly) to ~0.5, with a slow warble LFO on the rate (±2–3 %), a light
  duck (a few dB), a partial low-pass; hold while the craft is overhead; after the jets leave, ramp back to 1.0 and
  crossfade back to the element resumed at the right song time (a lobby's synced song stays on the room clock). On the
  DIRECT path (no usable Web Audio): skip the bend, only a volume dip. A RECOVERY WATCHDOG: if the song clock doesn't move
  within ~1 s once the event is over (or the element stalls at any point), restart the song at the right time. It must
  read "sounding" with the clock moving through the whole event, and after it, every time — even when the panel loops the
  event back to back.
- **THE JETS → AN F-22 RAPTOR-STYLE STEALTH FIGHTER** (the owner chose it; they "look too cartoonish — they need to look like
  modern, real, menacing flying death machines"): ONE shared jet for the TR-3B chase, the air show, the missing man and the
  surprise flyby. Realism at phone size comes from SILHOUETTE + SHADING: the angular faceted body, diamond-shaped wings,
  twin canted tails, internal weapons bays (stealth jets carry missiles inside — no wingtip missiles), dark GUNMETAL grey
  with real specular highlights + panel shading (no flat colours, no thick outlines), low-visibility grey USAF markings, a
  gold-tinted canopy, heat haze behind the engines, a hint of motion blur; slightly larger in the chase so the detail reads;
  keep the Mach diamonds + afterburners.
- **NO TRAFFIC DURING THE LEGENDARIES:** no vehicle drives by (the street under the dock, the back road, the bus, cabs, trucks,
  the raid) while the TR-3B makes its pass or during the UFO abduction — it's distracting. Vehicles already on screen
  finish quickly / stop (in the TR-3B blackout their lamps die with the city); none start until the event (and the jets)
  are gone; nothing pops out.
- **THE TRASH CAN** by the front-left lamppost looks like a fire hydrant (for C2): a bit larger, the classic shape (a ribbed
  galvanized cylinder with a domed lid + handle, or a wire-mesh litter basket on a short post), metal texture + a bright
  rim, scraps of paper poking out, close to / strapped to the lamppost; clear of the dock + the lobby line.
- **THE PREVIEW PANEL REWORK** (for C2): "very busy and unorganized" — FULL SCREEN; a 3-SECOND DELAY after it closes before the
  event fires (a 3-2-1 chip; adjustable now / 3 s / 5 s); a SEARCH box; a RECENT row; clean collapsible categories (SKY,
  LEGENDARY, PEOPLE + WORKERS, WILDLIFE, HARBOR, WEATHER, TIME, LIGHTS + MUSIC, TOOLS), bigger rows. It stays the owner's
  testing tool; CITY CONTROL (Part 13) is the separate admin tool for running the live city, on the same event registry,
  with its own STATS category like City 1.0's /admin (core/insights.js: who's online / in which rooms + games, matches per
  day / week / game, players + new profiles, peak hours) + the city's own (events run, legendaries seen, daily-puzzle plays
  + streaks once they exist). Both admin-only.
- **ONBOARDING + SOLO** (for the GAME LINEUP CHAT, then Lobby 2.0 / Progression 2.0): the typical first player is a FRIEND WITH
  A LINK → that path effortless (land in the lobby, type a name, done); no tutorial walls — a one-line "what is this" near
  JOIN / HOST for first-timers ("Party games for 2–8 friends · one phone each · no app"), the hush word explained where
  it's used, each game taught in its first round, the city's secrets left to discover. SOLO: THREE DAILY SOLO PUZZLES (new
  every day, the same for everyone, released ~8 am / noon / 5 pm on the player's clock; each playable until midnight;
  streaks + achievements; a spoiler-free shareable result; THE BOARD per puzzle) from PRISM DROP, OVERCLOCK and two NEW
  games he wants (a MINESWEEPER-type, a WORDLE-type); GRIDLOCK vs AI as practice; bots later, game by game. ANNOUNCED by a
  badge on the dock's middle (grid) button + the TAGLINE changing ("THE MORNING PUZZLE IS OUT.", tap to play) — the
  newsboy / noon whistle / evening edition stay background detail only; web push later for home-screen installs.
- **A NEON MOON for party nights** — PARKED in Future Ideas (a neon ring round the real moon, or a rare full neon-moon night);
  never replace the real moon by default.
- **8b2 REVIEW** (for C2, the next pass): (1) THE RAID "looks great" — (a) the FRONT CAR's SPOTLIGHT must land on the WINDOWS
  (and the door), never the building's corners / blank brick, and sweep FLUIDLY with randomness (lingering on a window,
  darting to another, a different eased path every raid — no fixed back-and-forth); (b) the whole raid ~10 s SHORTER; (c)
  the BACK-ROAD OFFICER shines on the speakeasy's FRONT while standing at its SIDE — he must WALK to where he can see the
  front (the waterside sidewalk / the crossing, facing the facade) first, the beam starting from his hand. (2) ROSIE's 3D
  TURN feels CHOPPY on his iPhone — investigate (dropped frames, coarse rotation steps, a per-frame re-render of the model
  or its reflection) and make it glide. (3) THE WORKERS + PAINTERS look better, but the painters' LADDER POPS UP at the
  sign — two men must CARRY it ON from the screen edge (level between them, in step), raise it, and carry it OFF after;
  the same for every worker prop (the billposter's ladder + bucket, the repairmen's ladders, the window washers' gear):
  props arrive and leave in hands, never pop. (4) THE CAB drop-off looks fine.

## OWNER'S NOTES — OCT 25 (after the TR-3B pass)
- **THE TR-3B PASS REVIEW** (the owner: "the TR-3B looks really good now, the audio sounds great"). Fixes (for C2): (1) the GAP
  between the TR-3B leaving the screen and the jets arriving is too long → ~2 s; (2) the F-22s ~25 % FASTER across and ~15 %
  SMALLER ("way too big"); (3) THE POWER COMING BACK looks glitchy — the WHOLE SCREEN seems to go black / flicker, not just the
  lights: review that sequence (a full-frame clear or a dark layer flashing over everything?) — the sky, moon + stars never
  flicker; only the city's lights stutter back, far skyline → foreground; (4) during the jets' pass some BUILDINGS BEHIND them
  seemed to FLICKER / interact oddly (the heat haze sampling the blackout layers? a skyline strip redraw under the jets?) —
  find it with frame bursts and fix it.
- **THE WEATHER + PARTY + HOLIDAY SOUNDS ARRIVED** (Grok, Oct 25): 35 of 36 files in ~/Downloads/city-sfx (~115 MB of
  originals), credits.txt section "Weather + party + holiday sounds", with Grok's per-file processing brief (the owner has it;
  its chain: HPF, light 200–1200 Hz saturation for phones, distance LPF + reverb, de-harsh, beds −30 LUFS, one-shots −20,
  −1 dBTP, seamless loops, mono-safe). EACH PART IMPORTS ITS OWN (Part 9 the weather, Part 10 fireworks + crowds + the yacht,
  Part 11 the holiday + spooky + legendary ones, the tower event its four); listen-check, reject words / melody / modern.
  Calls: SKIP periscope.wav (a modern tank turret — the slot stays empty); warning-horn → ship-horn.mp3 if the klaxon sounds
  synthetic; yacht-party only pushed far across the water; crane-work far + low or skipped; helicopter-landing far off;
  marching-drums loop 8–26 s only; carol-singers EMPTY; the big "-lossless" originals stay OUT of the repo (size).

## OWNER'S NOTES — OCT 25 (after C2)
(For LATER passes — POLISH 5 next, then Part 13 + Lobby 2.0. Recorded by the PEO pass as received; nothing here was built in PEO.)

- C2 PHONE REVIEW (the owner, Oct 25 ~5 pm): THE JETS, THE RAID + ROSIE "awesome". Rosie still red + white = expected
  (her navy / white is POLISH 5). BUG (for POLISH 5): a WORKER fired from the panel (the lamp repairman) POPPED IN already
  on his ladder mid-job, then finished, picked up the ladder and walked off. Cause (read in the code): &force=work-<kind>
  runs on a fixed clock grid (core/harbor-workers.js#forcedWork: a slot every FORCE.slot s, starting FORCE.lead s in), so
  firing it from the panel joins a slot already under way. FIX: a panel- / &force-fired worker's slot STARTS AT THE MOMENT
  IT FIRES (after the 3-2-1), so every preview shows the whole visit — walking (or driving) in from off screen with the
  props in hand, the job, and leaving; check every worker kind + the raid's ~50 s wait the same way (any forced event:
  start at the fire moment). Real days already walk in; joining a real visit mid-way (opening the city late) stays right.
- THE LOBBY LINE — WHO IS WHO (the owner, Oct 25 ~5:15 pm, the panel's lobby line on his iPhone: 5–6 people packed close
  = hard to tell what you're looking at). DECIDED: ALL the lobby's players (up to 8) wait OUTSIDE on the sidewalk — no cap,
  nobody sent inside. Layout (Claude's recommendation, agreed in principle): a STAGGERED TWO-DEEP LINE — pairs offset half a
  step so every head is clear (nobody fully behind anyone), the front pair at the door, the line running left along the
  barbershop front and stepping DOWN the sidewalk toward the camera (nearer = a little bigger = easier to read), relaxed
  poses (a lean, a turn to chat) so it reads as a line, not a crowd; a minimum gap between heads; clear of the dock, the
  door + the left edge at 390 / 402 / 430. WHO IS WHO at ~20 pt (only colour, light + shape read — no logos / outfit
  detail): each player's COAT in their player colour + a small glowing PIN above the head in that colour (YOURS a touch
  brighter / a slow pulse); TAP a person → their name for a few seconds; arriving = walk up, knock, the name floats up +
  fades. COSMETICS live in the big UI (the lobby list, the membership card, the podium, THE BOARD, the invite banner);
  in the city only as colour + light (a coat colour, the pin's glow, an arrival sparkle). For LOBBY 2.0 — but POLISH 5
  takes a FEASIBILITY SHOT first (no shipped change): 4 / 6 / 8 in the staggered line at 390 / 402 / 430, by day + at
  night, with coloured coats + pins, so the owner judges it on his phone before Lobby 2.0 builds it.
- CHAT IN THE CITY — SPEECH BUBBLES (the owner, Oct 25 ~5:20 pm — for LOBBY 2.0; to discuss, Claude's proposal): the old
  idea = a bubble forming over your figure while you type, your message in it on send. With up to 8 people ~20 pt tall in a
  staggered line, bubbles over every head would overlap and the text couldn't be big enough. PROPOSAL: (1) TYPING = three
  dots blinking on that person's PIN (light reads at that size); (2) ON SEND = a bubble pops from their head and rises into
  a BUBBLE LANE just above the line (DOM, not canvas: crisp 15–16 pt text, ≥ 4.5:1), edged in the speaker's colour with
  their name, a thin leader line down to their figure; at most 3 stacked, newest at the bottom, each fading after ~6 s;
  long messages clipped (the full text in the chat sheet); tap the lane → the full chat. With only one speaker, the bubble
  can sit right over the head. Never over the dock, the door or the sign. Settle in the Lobby 2.0 chat.
- C2 REVIEW FOLLOW-UPS (for POLISH 5): a forced raid (&force=raid / the panel) must start within a few seconds, not ~50 s;
  the ladder men's hands on the rails; the cab no longer half hidden behind the tree at 402. The trash can is REPLACED by
  the hydrant (below). The dependency branch deps/firebase-upgrade stays unmerged until the owner says so (check Vercel's
  Node version ≥ 22 first).
  (A fragment arrived with this note, from the 8b2 props rule: "ladder + bucket, the repairmen's ladders, the window
  washers' gear): props arrive and leave in hands, never pop.")
- THE HUSH WORD SIGN — LEGIBILITY (the owner, Oct 25, the JAZZ preview at night): pink-red neon on the warm amber room
  behind it — low contrast, soft, hard to read. FIX: ICE-CYAN neon (the complement of the room's amber — maximum contrast),
  a WHITE-HOT core in each tube with a TIGHT cyan halo (no wide blur), thicker strokes + bold block letters that fill the
  glass (2×2 for 4 letters), and the room behind DIMMED a little while the sign is lit (a person inside switched the lamp
  low to show the sign — the dancers' silhouettes still pass behind). Readable at a glance at 390 / 402 / 430, night AND
  day (by day: bright cyan tubes on the dim glass).
- SKY MESSAGES — CAPACITY + LEGIBILITY (the owner, Oct 25, "HAPPY BIRTHDAY JESSICA" skytyped by day): a page must hold
  THREE LINES as wide as "HAPPY BIRTHDAY" (≥ 14–16 letters each — "HAPPY BIRTHDAY" three times in a row fits on one page),
  so short messages are never a problem: size the dot-letters to fit 3 lines in the sky band (the NEON sign dimmed behind),
  never more than 2 lines' worth of space wasted. LEGIBILITY: in his shot the letters are soft, low-contrast puffs and a
  cumulus covers part of "JESSICA" — make the dots crisper + denser (each letter a clear shape at a glance), bright white
  with a faint darker edge / the sign's dark halo where the sky behind is bright (the sun), and CLOUDS NEVER COVER A
  MESSAGE (clouds in that band thin out / drift aside or draw behind the letters while a message shows). Same for the drone
  messages at night (3 lines, crisp lights). Check a 1-, 2- and 3-line message at 390 / 402 / 430, by day near the sun
  and at night.
- REMOVE (the owner, Oct 25 — DECIDED): (1) THE BARNSTORMER (the biplane looping the O / threading the N) — "I don't like
  it": remove the event, its preview + panel row, its schedule slot; (2) THE WINDOW BOX on the speakeasy's upper-right sill
  (its probation is over) — remove it + its seasonal flowers; the morning "wake" moment keeps the blind + the stretch but
  drops the watering.
- THE BANNER PLANE + ITS BANNER (the owner, Oct 25): look too cartoonish. THE PLANE: a real 1920s–30s tow plane (a
  high-wing monoplane or a biplane, a spinning prop, struts, real proportions + shading — judged at phone size: shape,
  colour + light, not tiny detail). THE BANNER: real fabric on a TOW LINE — a thin line from the tail to a weighted
  leading pole, the banner trailing BEHIND and slightly BELOW the plane, its letters readable; its motion NATURAL + FLUID:
  a travelling ripple running down its length (stronger toward the tail end), slight slack + sag, the end fluttering, the
  wind gusting it irregularly (varied, never a regular sine wave), the whole banner lagging the plane's path on turns.
  Lettering stays big + crisp. Check with a frame burst at 402.
- THE SPEAKEASY's WINDOWS → SINGLE BIG PANES (the owner, Oct 25 — DECIDED): remove the crossbar / meeting rail from ALL the
  speakeasy's upper windows ("the whole point is to be able to see the scenes") — one clear pane each inside the slim
  frame, deep reveal + sill kept so they still read as real 1920s windows (glass reflections / a faint sheen by day);
  every window moment + the hush sign get the full glass.
- JOIN + HOST TEXT ALWAYS LIT (the owner, Oct 25, by day the labels read dim grey on the dark buttons): the words JOIN and
  HOST are bright + readable 24/7 (by day: crisp white / the button's light, ≥ 4.5:1 contrast — CLAUDE.md's rule); the
  RINGS keep their own rules (unlit glass by day, the warm-up / neon power-up at dusk, the party behaviour) — only the text
  changes. Check by day, at dusk, at night, at rest (dock faded) and during the TR-3B blackout (the buttons are UI: they
  stay usable).
- TOO MUCH RED + WHITE in the middle (the owner, Oct 25 — DECIDED): (1) ROSIE → white hull with DEEP NAVY trim + black
  stacks (gold lettering only where it's big enough to read) — breaks the red where it's most crowded; (2) THE WHEEL's frame
  stays RED (the landmark; cream would melt into the cream towers), deepened slightly to a heritage red (less candy); (3)
  THE GONDOLAS: no more multicolour (it reads toy-like) — ALL ONE COLOUR, judged by what a phone shows (they're a few pt:
  no windows, no trim will read — only COLOUR + SHAPE + LIGHT): a deep NAVY that contrasts with the cream towers behind and
  matches Rosie's navy; at night each car a dark shape with ONE warm lit glow (light reads at that size, detail doesn't);
  party nights keep the wheel's bulb show for colour. (4) The lighthouse, the barber pole + the awning unchanged.
  SCOPE (the owner, clarified): the new COLOURS (the frame, the gondolas, Rosie) apply day AND night as they naturally
  would; what must NOT change is the wheel's LIGHTS — its night bulbs + the PARTY-NIGHT light sequence "look amazing".
- THE TREE BEHIND THE BLADE SIGN (the crabapple left of the crossing — the owner, Oct 25, zoomed shot): "not right yet" —
  its crown reads as a flat, lumpy blob with pixel noise, a dark blotchy hollow in the middle, the red fruit as scattered
  specks, the trunk + branches thin sticks. Rebuild it to the big maple's standard (that one reads well): a full, layered
  crown of leaf clusters with a lit side (the sun) and a shade side, depth from darker inner clusters (never a hole),
  a natural trunk + a few strong branches showing through gaps, the fruit as small bright clusters (not noise), the
  season's colours; night: its uplight + the hidden lamp. Zoomed + full screen at 402, day + night.
- THE TRASH CAN → A FIRE HYDRANT (the owner, Oct 25 — DECIDED, replacing the trash can whatever C2 did): a classic red
  1920s cast-iron FIRE HYDRANT by the front-left lamppost (bold red, a domed bonnet, two side nozzles + caps, a chain,
  a crisp highlight; instantly readable at 402; clear of the dock + the lobby line). The trash truck keeps its visit and
  empties cans off-screen at the curb. EXTRAS: now and then a DOG on a walk stops to sniff it; on HOT SUMMER days (the real
  temperature ~85 °F+ / 29 °C+, afternoon) a rare moment where a worker (or kids) OPENS it and it SPRAYS a sparkling arc of
  water onto the cobbles (a wet patch spreading, people stepping round it / a kid running through, the spray glinting in
  the sun, a soft hiss + splash), then it's shut and the wet patch dries over minutes.
- THE PERISCOPE's SOUND (the owner, Oct 25 — replaces the skipped periscope.wav): ONE realistic SUBMARINE SONAR PING as the
  periscope breaks the surface — a clear ~1–1.5 kHz "ping" with a long, deep underwater echo / reverb tail fading over
  ~3–4 s; just once per appearance; clearly audible OVER the music (a brief music dip so it cuts through, never a startle,
  the peak capped). Build it from a CC0 recording if one is in the folder, else SYNTHESIZE it (a sine ping + filtered
  noise + a long convolution / feedback echo) — no Grok batch needed. Phone check: the ping lives in the mid-range, so
  it reads on a phone speaker.
- THE BALLOONS (the owner, Oct 25 3:40 pm — next pass): (1) the ₿ MARK is off — it reads as a "B" with short stubs; draw
  the real Bitcoin symbol: a bold B with TWO vertical strokes that clearly extend ABOVE and BELOW the letter (the logo's
  slight tilt), centred on the envelope, crisp, in Bitcoin orange (#F7931A) by day; at night the envelope lit orange
  with a black ₿ (as decided). (The envelope's colour is RIGHT — the owner: it's black; the brown-grey was the burner
  lighting it from inside. Keep it.) (2) THE FESTIVAL LAUNCH: real
  balloons RISE from the ground — behind the buildings, one after another: the envelopes inflating / standing up out of
  sight, then lifting slowly above the skyline, the burners flaring as they climb, drifting off with the wind. The forced
  preview (&force=balloon-festival) must START at the launch (not fade in already aloft); a real festival day joining
  mid-way may show them already up (that's right), but never fading in from nothing.
- CITY CONTROL — SCHEDULED EVENTS (the owner, Oct 25 — Part 13): schedule ANY event in the registry (a drone-show / skytyping
  message like "HAPPY BIRTHDAY JESSICA", the UFO, the TR-3B, fireworks, the flyby, the raid, a weather, a party…) to fire at
  an EXACT date + time ("tell my nephew: look at the skyline at 8 o'clock"). Options per entry: ONE MOMENT for everyone (in
  the owner's time zone — everyone sees it at the same instant) or AT THAT LOCAL TIME on each viewer's clock; one-off or
  repeating (daily / weekly / yearly — a birthday every year); who sees it (everyone on City 2, or only people who open a
  private link); a preview button; a list of upcoming + past scheduled events with edit / cancel; joins mid-way like every
  event (someone opening a minute late still sees it running). Server-written (city2/… via /api/admin), admin-only.
  (A stray fragment arrived inside this note, from another one: "The readout can add a "since 10 min" slow % so the creep
  is visible.")
- FRIENDS + INVITES + THE INBOX (the owner, Oct 25 — for Lobby 2.0 / Progression 2.0; agreed): FRIENDS are EXPLICIT +
  MUTUAL only (nobody becomes friends automatically — playing with strangers in a big group must never make them
  "friends"); a PRIVATE "Recent players" list (only you see it, it fades after ~2 weeks) is where you can tap ADD FRIEND
  (or type a name tag); they accept. PRESENCE: friends see "in the city / in a lobby / playing <game> / offline"; anyone
  can HIDE their online status (appear offline). INVITES: in a lobby, tap INVITE next to a friend → server-checked (friends
  only, rate-limited) → if they're on the city a banner slides down "<name> invited you to his lobby · JOIN" (one tap
  joins; optionally with the secret-knock sound) + the dock badge; offline → it waits in their inbox until the lobby
  closes; home-screen installs → a phone notification later. Mute / block anyone. The text link stays for people without
  a profile. THE DOCK: ONE "SOCIAL" icon (friends + the inbox as two tabs, one glowing count) rather than two icons — the
  dock stays JOIN · BOARD · GAMES · SOCIAL · PROFILE · HOST (widen the dock a little / JOIN + HOST nudged outward only if
  it fits at 390 with JOIN + HOST as big as today); the INBOX holds invites, the daily-puzzle drops, City Control
  announcements, streaks + achievements.

## OWNER'S NOTES — OCT 25 (after PEO)
(For POLISH 5 — both DECIDED. Recorded as received, Oct 25 evening.)

- THE LOAD STILL JUMPS (the owner, Oct 25 ~6:40 pm, his iPhone): "upon loading, the buildings and stuff shift around and
  fade around and jump around until it's loaded" — FP3a's load gate (dark → ONE fade-in) isn't holding everywhere. For
  POLISH 5 GROUP 0 (first, before the look work): (1) a LOAD LOG in the &debug=1 readout (foldable): the reveal's why + ms,
  then EVERY change to the picture in the first ~15 s after it, timestamped with its cause — a re-layout (the viewport /
  visualViewport / screen sizes before → after), a re-bake or crossfade (which layer), a tier step (the gate's deferred
  wantStep applied after the reveal?), the weather / clouds arriving (a fetch landing after the reveal → fog / clouds /
  light fading in), the time-of-day or season state settling, fonts, the dock's rects moving; (2) reproduce on throttled
  loads (3g, 4× CPU) in Safari-sized viewports, cold + warm cache, a Safari tab vs a home-screen install, + WebKit if it
  installs; (3) fix the causes so NOTHING visible changes after the reveal: the reveal waits for the weather (the last
  weather cached per device so the first frame already has it, the live one blending in only if it truly differs, slowly),
  a deferred tier step decided BEFORE the reveal (or applied invisibly), no re-layout after the reveal unless the screen
  really changed (a rotation), every late bake swapped without a crossfade over the whole city; (4) the owner then reloads
  on his phone with &debug=1 and screenshots the LOAD LOG if anything still moves.
  THE OWNER's ANSWERS (Oct 25 6:43 pm): it happens EVERY load (warm cache too → not the network), in a SAFARI TAB → suspect
  first Safari's toolbar settling (the tab's dynamic bars; a home-screen install has none) + anything the gate lets through
  after its window; compare a home-screen install on the same phone.
- THE MUSIC ON / OFF TOAST — REMOVED (the owner, Oct 25 ~6:20 pm — DECIDED, for POLISH 5): the "MUSIC OFF — EFFECTS STAY
  ON" / "MUSIC ON" pill (js/ui/settings-panel.js, the music button's onclick, incl. the rescue tap's "MUSIC ON") covers the
  neon race the music-on tap fires — and you can HEAR the change. Remove it in both cities; the button's own state says it
  (a clear OFF look: the note dimmed + a slash, crisp at 36 pt, ≥ 3:1 against the sky by day + night) + its aria-label /
  an aria-live line for screen readers (no visual). ONE exception: if ALL sound is muted in settings, a tap that can't
  play anything shows a short hint ("SOUND IS OFF — SETTINGS") placed clear of the sign. The toasts' LOOK in general
  belongs to the menus / settings redesign (Lobby 2.0 era) — there no toast ever sits over the NEON sign during a race.

## OWNER'S NOTES — OCT 25 (after POLISH 5)
(For PART 9a + later parts. Recorded as received, Oct 25 evening. Also: the banner plane is APPROVED as it is for now —
the owner, Oct 25 10:05 pm.)

- POLISH 5 PHONE REVIEW (the owner, Oct 25 ~9:55 pm): (1) ROSIE reads TOO WHITE now — add a stripe so she's more
  noticeable: a broad DEEP NAVY band along the hull (the waterline / boot-top) + a thin GOLD pinstripe under the main
  deck rail; the paddle box navy with a gold edge; black stacks kept; NO red (the middle has enough) — judged at phone
  size by day + night (her lit windows + deck lamps at night). (2) REGRESSION: since POLISH 5's wheel recolour the
  FERRIS WHEEL's lights no longer die in the TR-3B blackout — they must go dark with the city (bulbs, gondola glows,
  the party sequence) and stutter back with the rest; add the wheel to the blackout's test so it can't slip again
  (check every light source the blackout should kill, not only the wheel).
- THE BALLOONS STAY UP (the owner, Oct 25 ~10 pm — DECIDED): they're rare, so when they come they should LINGER: today
  an event lasts 12 min (balloons.js `dur: 12 * 60`) and the burner fires every 8–20 s. NEW: a single balloon ~45–60 min
  on screen, the festival ~60–90 min (a real flight lasts 1–2 h), drifting SLOWLY across with the real wind (the crossing
  spread over the whole stay — barely moving at a glance, like a real balloon), a gentle rise + fall; the BURNER RARE +
  irregular: one short burn every ~45–120 s (seeded, never on a rhythm; more often only while climbing at launch); joins
  mid-way on load (opening the city 30 min in shows it mid-sky); the panel's preview keeps a "fast" option to see the
  whole crossing. Check it never parks behind the NEON sign or the dock for long.
- A SOLO SECTION (the owner, Oct 25 ~10 pm — for the GAME LINEUP CHAT, then the build): besides the 3 daily puzzles, a
  place to just PLAY ALONE any time — PRISM DROP for a high score, the WORDLE-type, the MINESWEEPER-type, practice runs,
  and games VS AN AI (GRIDLOCK vs the AI — the Battleship-style one —, more game by game); personal bests + THE BOARD per
  solo game; reachable from the dock's GAMES button without a room.
- A TILT-STEERING DRIVING GAME (the owner's idea, Oct 25 7:50 pm — for the GAME LINEUP CHAT): steer by turning the phone
  (DeviceOrientation; iOS asks permission on a tap — "TAP TO START YOUR ENGINE"); Claude: likely held sideways like a
  wheel (prototype that vs upright tilt and let the owner feel both), the road counter-rotating to stay level, centred at
  the countdown, a touch fallback (left / right halves) + keys on desktop; multiplayer like SLIPSTREAM (one seeded track,
  your car simulated locally, the others as interpolated ghosts ~10 Hz), ghost cars (no fair online collisions) with
  drafting / boosts instead; first past the line or last on the road.
- PART 9 SPLIT (Claude, Oct 25 — the section grew into two passes): 9a = THE WEATHER (rain, drizzle, storms, fog, wind,
  wet streets, the neon sign + the dock glass in rain / ice, the people + the water + the sky reacting, the weather sounds
  imported); 9b = WINTER + THE CONSTRUCTION TOWER (real snow on the ground through the season, the snow stages, the plows +
  salt + shovelers, the snowman, the snow on the sign + frost on the glass, the tower's yearly cycle).
- THE BALLOON FESTIVAL's LINE-UP + NEW STYLES (the owner, Oct 25 10:10 pm — DECIDED): the festival launches SIX balloons
  in THIS order, one after another from behind the buildings: (1) an ORANGE ₿ balloon (Bitcoin-orange envelope, the ₿ in
  black / white), (2) the ALIEN balloon, (3) the BLACK ₿ balloon (today's: black envelope, orange ₿; lit orange at night),
  (4) a BULLSEYE balloon (concentric rings round the envelope, e.g. red / white or navy / gold), (5) a classic YELLOW SMILEY
  FACE balloon, (6) a STRIPED balloon (classic vertical gore stripes). New styles beside today's pinstripes: BULLSEYE,
  SMILEY, VERTICAL STRIPES (keep two of the existing pinstripe schemes too). Everyday single balloons draw from the
  ordinary styles (stripes / pinstripes / bullseye / smiley); ₿ + alien keep their rare odds. Premium, not clip-art: every
  design painted ON the fabric — following the gores' curvature, shaded with the envelope's light (the sun side, the
  burner's glow from inside), seams visible at phone size only as shading; the smiley's face wraps round the curve.
- THE WEATHER ON THE SIGN + THE BUTTONS — THE QUALITY BAR (the owner, Oct 25 10:18 pm): the rain BEADING on the neon tubes
  and DRIPPING off them, and the ICE / FROST GLAZE, must look legit + impressive, never cheap: real refraction (each bead a
  tiny lens catching the tube's colour + a bright specular point), beads gathering + merging + running down the tube's
  underside before a drip lets go (with a glint as it falls), the glaze a clear, slightly uneven sheet with sparkle that
  catches the glow; several refine passes zoomed + full screen at night. THE MENU + MUSIC BUTTONS (and the dock's glass)
  get the weather too: rain beading on their glass; in the COLD a frosty, cold-glass / cold-metal look building in from
  the edges (a pale crystalline frost, a cooler tint) — NO icicles on the buttons; icons + text stay crisp.
  THE DOCK TOO (the owner, Oct 25 10:20 pm): the dock's glass (JOIN · the middle buttons · HOST) gets the SAME rain
  beading + the cold-glass frost as the menu + music buttons — like City 1.0 had it (js/screens/district/frost.js: the
  feathery frost growing in from the edges when it's really cold, the rain from district/rain.js — City 1.0 is only the
  FLOOR — the owner wants it clearly SUPERIOR, the best possible); taps, labels + contrast untouched.
- SNOW ON THE NEON + THE SNOWMAN (the owner, Oct 25 10:18 pm — for 9b): (1) snow BUILDS UP on the sign's tubes + frame
  while the sign is OFF (by day), and PILLOWS up softly on the tubes when snow falls on them; when the sign lights (or
  while it's lit) it MELTS SLOWLY, like real life (soft mounds shrinking, wet glistening tubes, drips) — never a pop.
  (2) THE JANUARY SNOWMAN — a BIG snowman built on the promenade's centre circle (the inlay / the centrepiece rig) over
  JANUARY: started ~Jan 2 (kids + a couple of adults rolling the base), growing + decorated through the month (the
  middle, the head, coal eyes + buttons, a carrot, a scarf, a hat, stick arms, finishing touches), DONE by ~Jan 31, then
  it stands until it really melts. Claude's notes: tie it to REAL SNOW (building days only when there's snow on the
  ground; no snow → no snowman, e.g. Florida); a brief January thaw makes it SLUMP + drip and the builders patch it up —
  it only melts away on a real sustained thaw (several days above ~4 °C / the snowpack gone), slumping in stages; the
  centrepiece rig shares the circle (no other centrepiece in January while it stands); the people's visits keep it alive
  (a kid adding a pebble smile, someone taking a photo). Replaces the plan's old "a snowman that grows through a real
  snowy day".
- THE LOBBY-LINE SHOTS (POLISH 5, docs/harbor/refs/lobby-line/, Claude's read for LOBBY 2.0): BY DAY the coloured coats
  tell 8 people apart well. AT NIGHT the coats go almost black and the pins float well ABOVE the heads (over the shop
  window's glow), so they read as loose coloured dots, not "that's Jessica". Fix in Lobby 2.0: (1) the coats stay their
  colour at night — lit by the shopfront + the globe lamp (a warm key light + a rim), never just silhouettes; (2) the
  pin sits RIGHT above the hat (a few pt) so it belongs to the figure, a touch bigger; (3) 8 reach the left edge → the
  last two step DOWN toward the camera (the two-deep stagger used properly) instead of running further left; (4) gaps
  so no two figures merge.
- THE MOTHMAN ON THE NEEDLE (the owner, Oct 25 7:30 pm — a NEW LEGENDARY, for Part 11c's legendaries / Part 12; Claude's
  notes in brackets): a giant winged creature PERCHED ON THE NEEDLE's spire, a pure black silhouette against the night, TWO
  GLOWING RED EYES looking straight at the camera. It doesn't move; it BLINKS rarely; now and then a slow shift of its
  weight; it stays on the needle, then FLIES OFF straight up / out of the screen. RARE: ~TWICE A MONTH, only 2–5 am (a
  night-owl reward; seeded, the same nights for everyone, joins mid-way, never on another legendary's night).
  [Claude: (1) SIZE for the phone — big enough to read as a creature at 402, ~35–45 pt tall folded, its shape (hunched
  shoulders, folded wings like a cloak, no detail) RIM-LIT by the needle's own neon + the moon, or black on dark sky
  won't read; (2) the eyes must not read as the towers' red aviation beacons: larger, closer-set, a deeper red with a
  soft glow, and they blink RARELY where the beacons blink on a rhythm — the contrast makes it creepier; (3) DECIDED (the
  owner, Oct 25 7:37 pm): perched the WHOLE NIGHT — from 2 am until ~5–5:30 am (~3.5 h; the leaving time seeded per night
  within 5:00–5:30, always before first light); he lands at 2 am (a silent glide onto the spire), anyone opening later
  finds him already there; the needle's neon dims / flickers faintly while it's there; (4) THE DEPARTURE is the payoff:
  the wings unfold to a huge span (the one moment of scale), a downdraft gust that makes the needle's neon stutter, then
  straight up and gone; the city's night sounds (crickets) hush while it's there and return after; one low wingbeat
  whoosh (synthesized or a Grok sound ahead of that part); (5) fog nights allowed — only the eyes through the fog;
  (6) &force=mothman + a LEGENDARY panel row; maybe one extra night around Halloween. Folklore (Point Pleasant, 1966) =
  free to use; an original silhouette, not a copy of the town's statue.]
  QUALITY BAR (the owner, Oct 25 7:47 pm — "it's all about quality"): VERY HIGH — premium, top tier, STUNNING. He's
  dark, but at ~65 pt he's big enough for real craft: a sculpted silhouette (no flat cut-out), subtle wing membrane
  folds + texture catching the rim light, a fine soft-edged rim (no outline stroke), the eyes' glow wet and alive, the
  weight shift + the rare blink eased like a living thing, the take-off a cinematic beat; the reference is the FLOOR —
  several refine passes zoomed + full screen at 402, night + fog + a party night, before calling it done.
  THE LOOK (the owner approved Claude's prototype, Oct 25 7:45 pm): ~65 pt tall perched at 402 (clearly a creature at a
  glance); pure black, a hooded head (no ears / tufts — never Batman), wings folded like a cloak with the wrists rising
  above the head, a soft ragged hem; RIM LIGHT from below in the NEEDLE's own neon colour that night (it follows the
  needle — party colours included) + a silver rim on the moon side; the face stays dark; RED EYES (a large close-set pair,
  a hot near-white core, a soft red glow; NOT yellow — the city's lit windows are amber), never blinking on a rhythm
  like the beacons. If the needle is red / pink that night, the eyes get a hotter core so they still pop. THE TAKE-OFF:
  wings open to ~half the screen's width (broader, more moth-like than bat-like), downdraft lines + the needle's neon
  stuttering, then straight up.

## OWNER'S NOTES — OCT 26 (after 9a)
- 9a REVIEW (Claude, from 9a's summary, Oct 26 12:20 am — for SP3 Group 0): (1) THE NEON LOGO doesn't light early in a
  storm while the rest of the city does → it follows the same darkness input (core/harbor-dark.js) — a dark storm
  afternoon powers it up like dusk, then back to daylight glass as the storm clears; (2) THE TREE CROWNS don't sway in
  the wind (leaves, flags, smoke + rain do) → a gentle crown sway with the real wind + gusts, per-tree phase, cheap (a
  baked crown moved as a whole + a slight shear), none in calm air; (3) at 402 the six festival balloons overlap at
  times → their lanes / heights spread so no two overlap for long; (4) the cloud `city` job's weather LOAD check got no
  answer once (passes locally) → time-box it: a real race in the cached-weather path or the mock, or a flake → Known issues.
- 9a BUG — THE RAIN ON THE SIGN IGNORES THE POWER (the owner's iPhone, Oct 26 12:22 am: the TR-3B blackout in rain): the
  NEON letters are dark but the BEADS on the tubes still glow as bright pink dots along every letter, and the rain
  streaks near the sign stay PINK — the 9a rain-on-sign layer (beads, drips, lit streaks, any glaze sparkle) takes the
  tube's colour without the sign's light level. FIX: every weather layer that borrows light from the sign / a lamp / a
  window scales with THAT source's live level (the blackout, a burnt-out letter, the boot flicker, by day = unlit glass:
  beads become clear water drops with a faint sky highlight); add it to the blackout test ("every light source goes dark"
  includes the sign's weather light).
- RAIN ON THE DOCK + THE ☰ / ♪ BUTTONS — REAL WATER (the owner, Oct 26 12:24 am — what he meant; 9a's beads at the edges
  aren't it): in DRIZZLE + RAIN the glass gets the real rain-on-a-window effect: drops land and BEAD UP, grow as more
  land + merge with neighbours, and once one is heavy enough it BREAKS the surface tension and STREAKS DOWN the glass —
  picking up the drops in its path, leaving a thin wet trail that beads back up — and FALLS OFF the bottom edge (a tiny
  drip). Super realistic: each drop a little lens (it refracts / flips the city behind + the button's own light, a bright
  specular point, a darker rim), trails that fade, more + faster in heavier rain, the drops drying off slowly after the
  rain stops. Drops may cross the whole glass, but the LABELS + ICONS draw ON TOP (crisp, contrast untouched, taps
  unaffected); a small budget (a handful of drops per button, a dozen or two on the dock) on one small overlay canvas;
  reduced motion = a few still beads. Frost in the cold stays as 9a built it.
- DRIZZLE vs RAIN vs HEAVY RAIN LOOK ALMOST THE SAME (the owner, Oct 26 12:26 + 12:37 am — DECIDED: RAIN stays as it is
  today = the anchor; DRIZZLE clearly LESS; HEAVY RAIN clearly MORE): make each step clearly different at a glance on the
  phone — DRIZZLE: sparse, fine, slow, faint; RAIN: steady streaks, puddles growing; HEAVY RAIN: ~3× the streaks, longer
  + brighter + faster, sheets / gusts of rain sweeping across in waves, the far skyline GREYED behind a rain haze (the
  biggest read), splashes bouncing off the promenade + the water churned with rings, rivulets in the gutter, people
  running / almost gone, the rain sound louder + closer (the heavy bed), the dock's drops streaking constantly.
- 9a BUG — THE BUTTONS' RAIN STAYS WHEN THEY FADE (the owner's iPhone, Oct 26 12:26 am, rain at rest): the ☰ + ♪ buttons
  fade out at rest but their drops stay — two rings of floating dots in the top corners over the sky (the dock likely
  the same). FIX: the glass's weather (drops, trails, frost) belongs TO the button: it fades / hides with it every time
  (rest, menus, games, the TR-3B), drawn in the same layer / opacity as the glass; a check that nothing of a hidden
  button's weather remains visible.
- THE STORM ISN'T A STORM YET (the owner, Oct 26 12:29 am, &force=storm): (1) THE LIGHTNING: more powerful — a THICK,
  strong, branching bolt (a bright white-violet core, a hot glow, forks), now and then a big strike that reaches the
  skyline / the water, the flash lighting the city + reflecting on the wet street + the harbor for a beat; (2) THE CLOUDS:
  real CUMULONIMBUS — a towering, dark, heavy storm deck over the city (an anvil top far off, a low ragged base, rain
  shafts hanging from it), and the lightning FLASHING INSIDE the clouds (sheet / intra-cloud flashes lighting their
  billows from within, flickering 2–3 times) as well as the bolts; (3) THE THUNDER LOUDER: a close strike = a sharp CRACK
  then a long rolling rumble (City 1.0's thunder is the reference — audio/weather/*.mp3 + its timing — and the Grok
  thunder-far takes for the distant ones), the delay after the flash by distance, ducking the music briefly so it lands;
  (4) HEAVIER RAIN in a storm (the heavy-rain look + gusting sheets). (5) THE NEEDLE GETS STRUCK (the owner, 12:30 am): now and then
  (a seeded share of the close strikes, ~1 in 6) the bolt hits the NEEDLE's spire — the lightning rod: the bolt locks
  onto its tip, the spire flashes white-hot, sparks + a glow crawl down a few floors of its neon, its tubes stutter /
  flicker for a second (a power surge) and come back, a sharp crack with no delay (it's close) + the rumble. SAFETY KEPT: no full-screen white flash, never more
  than 3 flashes a second, brightness capped, reduced motion = the sky dims + the thunder only.
  → THE ATMOSPHERE pass (ATM) builds this.
- WEATHER ON THE SPEAKEASY (the owner asked, Oct 26 12:31 am; Claude checked 9a's docs): RAIN already reaches it (a sheen,
  beads + rivulets on the glass, drips off the awning, the hush sign's glow on the wet brick); FREEZING RAIN doesn't (only
  the NEON sign + the glass UI glaze); SNOW is 9b. ADD (judged at phone size — big shapes + light): FREEZING RAIN =
  ICICLES along the awning's front edge, the cornice, the gutter + the window heads (varying lengths, catching the lamps
  + the hush sign's cyan), a glazed sparkle on the railings, the lamp posts, the bench + the cart, frosted corners on the
  windows, the promenade a glossy ICE sheen (the lamps' reflections sharper + longer), people walking carefully (short
  steps, arms out, a rare slip + catch); the icicles drip + drop off as it warms. (NO salt worker — the owner: too small to
  see.) + ICICLES on the BILLBOARDS + SIGNS too (the owner, 12:33 am): hanging from the HIGH STAKES board's bottom edge,
  the vertical OVERCLOCK blade's sides + bottom, the roof signs' frames, catching their own neon. FREEZING RAIN today
  "just looked like rain" (the owner) → it must read as ICE at a glance: the glaze + icicles everywhere above, the ice
  sheen on the ground, a colder, clearer light, the rain finer + glinting. → ATM builds the freezing rain.
  SNOW (for 9b): snow on the sills, the awning (sagging, sliding off now and then), the cornice + the roof canopy's
  posts, the steps shovelled + salted by the doorman, snow on the hat brims + shoulders of the people, the windows'
  warm light glowing on the snow outside.
- WINDY IS BUGGY + THE CLOUDS (the owner, Oct 26 12:33 am — "not right now, put it on the list"): &force=windy only sends
  the cumulus flying across the sky; the TREES don't react (9a's known limit: crowns don't sway). THE CLOUD SYSTEM needs
  a dedicated FABLE pass "to get it figured out once and for all": the clouds' look, kinds + motion (speed from the
  real wind at their height, not racing), storm decks (cumulonimbus), the veil / overcast / fog layers, the light on them
  through the day, the lightning inside them — and WIND as one system everything reads (trees swaying + gusts rolling
  through the crowns, leaves, flags, smoke, the rain slant, coats + hats, the water's chop, the balloons + banner), with
  a believable windy day / a gale. SLOT: a FABLE CLOUDS + WIND pass after 9b (before the holidays need the sky).
  + FOG (the owner, 12:34 am: "fog doesn't really do anything") → the same Fable pass becomes THE ATMOSPHERE pass
  (clouds + wind + fog): real fog = DEPTH — the far skyline gone, the middle rows ghostly silhouettes, only the near
  buildings clear; every light a soft HALO + its glow hanging in the air (the lamps' cones, the neon sign's glow
  blooming, the windows smeared warm); the lighthouse beam a visible broad cone (+ the foghorn); fog drifting in banks
  across the water + the promenade (thicker + thinner, moving with the wind); people fading in and out of it; the
  colours muted; dense fog vs mist clearly different.
- 9a CHECKS (the owner, Oct 26 12:40 am): THE BALLOON FESTIVAL good; ROSIE's STRIPE good.
- ROSIE ON THE MOVE, NOT PARKED (the owner, Oct 26 12:40 am — DECIDED, replaces her 8b1 timetable's long stays): she's
  OFF SCREEN most of the time. EVERY HOUR ON THE HOUR she comes in: appears from off screen ~5 min before, glides in +
  turns to the pier (her 3D turn), docks AT :00 (the bell / whistle), passengers off + on for ~3 min, casts off + steams
  away, gone off screen by ~:10 — in motion the whole visit. Her service hours like a real ferry (e.g. ~7 am–midnight,
  none in the small hours). PARTY NIGHTS: the same hourly run, with her deck + string lights flashing / chasing to the
  party colours (the beat when music plays) and a livelier crowd on deck. Her wake, smoke + horn as now. Check the
  harbor doesn't look empty between visits (the tug, the sailboats, the far ships keep it alive).
- THE HOLIDAYS BEFORE THE GAMES (the owner, Oct 25 10:26 pm — DECIDED: keep banging out the city, the holidays with their
  BUILD-UPS — things appearing in windows + on the steps day by day). ORDER BY THE CALENDAR (Claude): 9a (tonight) →
  11a-1 HALLOWEEN + DAY OF THE DEAD + the shared holiday system (must be live by ~Oct 29: Halloween is Sat Oct 31; the
  build-ups are date-driven, so arriving late in October simply shows the build-up as far along as the date says) →
  11a-2 THANKSGIVING + the reusable PARADE system (by mid-Nov; Thanksgiving Nov 26, the Wednesday party, Black Friday's
  first Christmas crew) → 9b WINTER (before Grand Rapids' first real snow, ~mid-Nov) → 10 PARTY NIGHTS + FIREWORKS →
  11b CHRISTMAS + NYE (live by Nov 26: the build-up starts Nov 27) → then the games; 11c's spring / summer holidays,
  12, C3 + 13 slot in before their dates. The holiday sounds are already in ~/Downloads/city-sfx (witch-cackle,
  haunted-wind, ghost-ship-creak, ghost-bell, marching-drums, crowd-cheer…) — no Grok batch needed for Halloween or
  Thanksgiving. NOTE: City 2.0 is still behind ?city=2 — this Halloween only the owner sees it; it's built for good.
- THE MUSIC-ON RACE LANDS ON THE BEAT (the owner, Oct 25 10:32 pm — BUILT in 9a as an add-on): when the music is switched back ON (unmute), the neon
  race along the tubes STARTS ON A BEAT of the song for extra punch — quantized to the song's next beat (or the next
  downbeat if it's within ~0.6 s), using THE BEAT's grid (core/harbor-beat.js) once the song's clock is moving; if the
  song's grid isn't trusted / the clock hasn't started within ~0.8 s, fire at once (never a long wait, never a missed
  race); the first-tap surge on load the same way when the music starts with it. Keep the ~10 s cooldown.
- THE FESTIVAL, REVISED (the owner, Oct 25 10:44 pm, watching 9a build it — BUILT in 9a): THE BULLSEYE not black + yellow (the smiley is)
  → deep VIOLET + TEAL rings on cream; the 6th balloon is an AMERICAN FLAG balloon (the flag wrapped round the envelope:
  the canton + stars on the upper part, the stripes down the gores; Old Glory red #B22234, navy #3C3B6E, white) instead
  of the vertical stripes (they stay an everyday single-balloon style). Order: orange ₿, alien, black ₿, bullseye, smiley,
  American flag.
- THE PEOPLE IN THE SPEAKEASY's WINDOWS — NEXT UPGRADE (the owner asked, Oct 25 10:52 pm): built in 7b (the figure kit +
  the starter moments), the windows redone in 7b / POLISH 5 (single big panes), never reworked since. PLAN (Claude): a
  WINDOW PEOPLE upgrade (now SP3 GROUP 2 — moved out of the Halloween pass) — Halloween's window scenes (ghosts behind curtains,
  mummy silhouettes, a costume party) use the same figure kit, so upgrade it first: premium silhouettes at the real
  window size (posture, hats + hair shapes, a warm rim from the room's lamp), motion as natural as PEO's walkers (eased,
  weight shifts, no snapping), each moment staged for the single panes, more moments in the catalogue; then every later
  holiday's window scenes ride on it.
  THE OWNER's COMPLAINTS (Oct 25 10:54 pm): (1) TOO SMALL — at phone size you can't make anything out, only light +
  movement. FIX (Claude): stage the people CLOSE TO THE GLASS — big, bold silhouettes, head + shoulders or a torso
  cropped by the frame, one or two per window, simple strong poses against the lit back wall (a person at the glass,
  a couple dancing filling the pane, the bartender's shoulders), judged ONLY by shape + light + motion at 402; no
  small furniture or props that can't read. (2) THE LIGHT IS WAY TOO ORANGE — move the rooms to softer, more varied
  warm whites: cream, honey, a faint rose lamp, a cooler TV blue — each room its own tone, still cozy, never one flat
  orange; the bar / basement keep their deeper amber as the one exception. (3) BUG: the upper-right TV room goes from
  the TV's blue to ORANGE after ~3 am — it should be: the TV switches off (a brief fade / a last flicker) and the room
  goes DARK until morning (only the faint night from outside on the glass); the other rooms keep the building's
  "never fully dark" rule.
  THE OWNER's DECISIONS (Oct 25 ~11 pm, after Claude measured: the upper row is 2.0 tall vs the lower 2.2 —
  core/harbor-speakeasy.js SPEAK_V.rows [[4.6, 6.8], [7.6, 9.6]] — so the top windows really ARE ~10 % shorter):
  (1) SIZE — REVISED (the owner, Oct 25 11:33 pm): all four upper-facade windows EQUAL, ~20 % TALLER and ~15 % WIDER
  (~40 % more glass — the most the facade allows while it still reads as a brick 1920s building: keep real piers for the
  wall-washers + a band above the shopfront + under the cornice; Claude's room check: rows today [4.6, 6.8] + [7.6, 9.6],
  columns 1.9 wide with 1.3 gaps) (use the brick between the rows; the sills, reveals,
  the EST. plaque, the cornice + the wall-washers re-placed to fit; every moment's staging + the hush sign re-fit);
  (2) SCENES: a MIX — some moments as CLOSE BOLD silhouettes at the glass (head + shoulders, a body cropped by the frame),
  some as FULL-BODY figures in a simplified room (one lamp, one or two strong shapes, no small props); every one judged
  by shape + light + motion at 402; (3) ONE STAR WINDOW AT A TIME: one window carries the clear moment, the others stay
  softly lit with slow simple life (a shadow passing, a lamp dimming, a curtain stirring) — the eye always knows where
  to look; the star rotates through the evening; (4) LIGHT: varied soft warm whites per room — cream, honey, a faint
  rose lamp, the TV's cool blue — never one flat orange (the bar + the basement keep their deeper amber). The half-cut
  column at the left screen edge (at 402) holds only things that read when half-seen (the cat, plants, a lamp).
  (5) BIGGER PEOPLE (the owner, Oct 25 11:35 pm — DECIDED): in the windows, the CLOSE silhouettes fill ~60–70 % of the
  pane's height (head + shoulders the dominant shape — posture, a hat, a turned head read), the full-body figures deeper
  in the room a little smaller (depth); ON THE PROMENADE every person ~8–10 % bigger, checked against the doors, the
  bench, the lamps + the cart at 402 (no dollhouse look — if a prop now reads small, it scales with them).
- THE ROOF SIGNS' HOURLY MODES (the owner, Oct 25 ~11:10 pm — DECIDED, now in SP3): every
  HOUR each named roof sign (NEON PAR, PRISM, PULSE… — not the NEON logo, not the billboard) runs ONE of
  three modes, seeded per sign per hour (the same for everyone, two neighbours never the same mode in one hour):
  (1) THE SPELL — the letters light one at a time in order, hold, the word flashes twice + settles, every ~45–90 s;
  (2) THE BORDER RACE — a bright pulse runs once round the sign's frame every 60 s (signs with no neon border get a thin
  border tube round the cabinet so the race has a track); (3) THE BREATH — a slow ~5 s brighten / dim, never to off, not
  on the music's beat. THEY TAKE TURNS on the big moves (only one sign spelling or racing at any moment; the rest breathe /
  hold) so the skyline never fights the NEON logo. THE TOP OF EACH HOUR: a quick restart flicker, then the new mode
  (that's the only "cold start" — no 4th mode). THE BURNT-OUT LETTER rule still applies in every mode (dark for its 2–3
  days; skipped / one sputter in the spell; dead while the rest breathes). Party nights: the party show takes over as now.
  THE BILLBOARD keeps its own life (the billposter's job pastes a new game poster now and then; it holds longer).
- THE HIGH STAKES BILLBOARD ON THE SPEAKEASY's ROOF ~15 % BRIGHTER (the owner, Oct 25 11:15 pm): its lighting (the
  gooseneck lamps' pools on the board + the lettering's glow) up ~15 % at night + dusk, the lettering still crisp (no
  bloom wash); by day unchanged. HOW (Claude's call, the owner left it open): FIVE gooseneck lamps EVENLY SPACED across
  the top (today two + two with a gap over the spade) — the centre one lighting the spade logo — which gives most of the
  brighter, more even board on its own; then only a small lift to reach ~15 % overall.
- CRISP NEON — THE LOGO + THE HUSH SIGN LOOK SOFTER THAN THE SKYLINE (the owner, Oct 25 11:38 pm: the buildings' neon is
  "sharp, high def, looks really good"; the JAZZ hush sign looks FUZZY; the main NEON logo isn't as "4K" as the skyline).
  Claude's read of the code (to be MEASURED on WebKit / the owner's screenshots, not assumed): (1) TWO DIFFERENT NEON
  SYSTEMS — the skyline uses the city's TUBE renderer (screens/harbor/tubes.js: uneven body, a white-hot core, a glass
  highlight, electrodes, sprites baked per tube) while the NEON LOGO is an SVG (ui/logo.js) of flat strokes (glass, two
  feGaussianBlur glows, body, a core at 0.34× the tube, a 0.8-wide highlight at 35 %) — iOS Safari rasterises SVG filter
  layers + composited, opacity-animated groups at a lower scale and scales them up → soft; (2) the city's canvases cap
  the pixel ratio at 2 on the owner's 3× iPhone (hushsign.js + neon.js: dpr = min(2, …)) — fine for thin skyline tubes,
  but small bold letters show it; (3) the hush sign's letters are small (~11–12 pt) with a halo wide for their stroke,
  drawn at fractional positions. FIX (its own group, before Halloween): the NEON LOGO rebuilt on the city's TUBE look
  (uneven body, white-hot core, the glass highlight, electrodes) at FULL device resolution (one element — a 3× canvas or
  an SVG whose blurs never scale), keeping everything it does (the boot, the catch + the race, letter taps, the burnt-out
  letter, the blaze, the weather layers, City 1.0 untouched or improved the same way); the HUSH SIGN at full DPR,
  pixel-snapped, the tube treatment, a halo sized to its stroke. Prove it: zoomed 3× screenshots side by side (skyline
  tube vs logo vs hush sign, before / after) + an A-B-B-A speed check.
- SPEAKEASY IN WHITE NEON (the owner asked, Oct 26 12:04 am — Claude recommends YES, for SP3's CRISP NEON group): today
  "SPEAKEASY" + the rules with the little diamonds either side are DOM TEXT (title.js .nd-word + glow layers), not tubes.
  Rebuild them as real WHITE NEON on the same tube look as the new NEON logo: single-stroke tube letterforms (rounded
  bends, electrodes, mounting clips) keeping today's wide letter-spacing; the side rules + diamonds as thin tubes with a
  diamond bent in each; a cool white (a hint of warmth so it sits with the pink) at a CALMER glow than NEON (NEON stays
  the star); size is fine (~13 pt caps — the skyline's roof-sign letters are about that and read great). BY DAY: real
  white neon is phosphor-coated MILKY WHITE glass even when off, so the word stays readable unlit. Keep what it does today:
  the beat punch, the race sweeping across it, the sign-dim hook, the dark halo over the moon; readable at 390 / 402 /
  430 day + night. "YOUR FRIENDS ARE ALREADY INSIDE." stays text.
- PASS ORDER UPDATE (Claude, Oct 25 ~11:40 pm): the Halloween pass got too big for a must-ship-by-Oct-29 pass, so split:
  SP3 "THE SPEAKEASY + CRISP NEON" next (the window upgrade + bigger people, CRISP NEON, the roof signs' hourly modes, the
  HIGH STAKES board's 5 lamps, the music-on race on the beat, 9a's review notes) → then 11a-1 HALLOWEEN + DAY OF THE DEAD
  (the shared holiday system, the web, the pumpkins, the window ghosts on SP3's new kit, the ghost ship, the witch, the
  trick-or-treaters) live by ~Oct 29.
- THE MOTHMAN — HIS SIZE (an addition to his entry in "(after POLISH 5)"; the owner, Oct 25 10:50 pm — DECIDED): HULKING — feet on the needle's tip, his TOP (the hood / the raised
  wing wrists) reaching UP TO JUST UNDER THE BOTTOM OF THE "SPEAKEASY" TAGLINE (a hair's gap, never over a letter).
  Sized from the live layout (the needle's tip + the tagline's rect from the title's measure()), not a fixed number — on
  the owner's iPhone that's ~50 pt above the spire tip, so with his folded wings hanging below his feet he stands ~60–70
  pt tall. The take-off's open wings may pass BEHIND the sign + tagline (the sign always draws on top and stays readable).

## OWNER'S NOTES — OCT 26 (after SP3)
- SP3 shipped (9179692). The owner hasn't phone-tested SP3 yet (he will after 11a-1). Two SP3 decisions STAND unless he
  says otherwise: the windows ~12 % taller (the lintel vs the cornice) + ~16 % wider; the NEON logo kept as an SVG with
  the tube treatment — IF his iPhone still shows it soft, the canvas rebuild is its own later pass (NOT 11a-1).
- The promenade's wildlife scaled with the people (+9 %) — done in SP3 (the owner's add-on, Oct 26 12:56 am).
- THE QUALITY BAR FOR EVERY HOLIDAY (the owner, Oct 26 2:52 am): TOP TIER, STUNNING — NO CLIP-ART LOOK anywhere (no flat
  cartoon pumpkins, no sticker bats, no emoji ghosts). THE SPIDER: the first one built (earlier) was BAD. Build it
  REALISTIC + premium (a real orb-weaver's silhouette: the abdomen's shape + sheen, eight jointed legs with natural
  angles, moving with a spider's stop-start gait, catching the neon on its body), judged zoomed + full screen at 402; IF
  after the refine passes it still doesn't look truly realistic + good, make it ALIEN / FUTURISTIC instead (a sleek
  bio-mechanical spider with faint neon seams and glowing eyes) — stunning either way, never cheap. The same rule for
  every Halloween piece: realistic + premium, or a deliberate stylised design that's just as premium.
- THE BUILD TABLE: 11a-1 HALLOWEEN + DAY OF THE DEAD (+ the shared holiday system + the window figures; live before Sat
  Oct 31) → NEXT 11a-2 THANKSGIVING (+ the parade system), then 9b WINTER, ATM (the FABLE ATMOSPHERE pass), 10 PARTY
  NIGHTS, 11b CHRISTMAS + NYE (live by Nov 26).

## OWNER'S NOTES — OCT 26 (after HALLOWEEN)
- THE BUILD TABLE: SP4 (this pass: the Halloween spider + web redone futuristic, the window people lit, the weather source
  fixed for good) → then 11a-2 THANKSGIVING, 9b WINTER, ATM (the FABLE ATMOSPHERE pass — it takes "MORNING CHECKS" (3), the
  menacing lightning), 10 PARTY NIGHTS, 11b CHRISTMAS + NYE (live by Nov 26). The NEON logo redraw is CANCELLED (the
  owner's verdict, Oct 26 8:19 am).
- THE WIND STUCK ON + THE CLOUDS RACING (the owner's iPhone, Oct 26 7:38 am, a real morning with a JUST ME Halloween
  preview): the clouds fly by extremely fast and the wind seems stuck on. CHECK FIRST: a leftover panel override
  (last night's &force=windy kept by JUST ME?) — CLEAR ALL must clear it, and the readout's weather line must say what's
  forced. If nothing is forced: the clouds' speed must follow the real wind AT THEIR HEIGHT, slowed for the camera (a
  cloud crossing the screen in minutes, not seconds) — a bug for the next pass + the ATMOSPHERE pass's whole job.
  ALSO in the same screenshot: the AUDIO panel says "sounding" + "el playing c2-evening12" while it says "want … (music
  off)" and the ♪ button shows the OFF slash — check the music-off setting really silences the song (or the readout's
  wording is wrong).
- THE WEATHER STILL FLIPS TO "SEEDED" — SP3's FIX DIDN'T HOLD (the owner's LOAD log, Oct 26 7:41 am, a plain Safari
  load): the reveal at 1238 ms with "wx clear (cached · 15 min old)" ✔, then +0.41 s "wx none (seeded) → the city reads
  seeded" → the sky repainted (6 s fade), a ⚠ lit crossfade, ⚠ the clouds re-planned to 7 (cirrus + cumulus), and +8.07 s
  a ⚠ bake crossfade (neon, facade). So: (1) THE LIVE WEATHER ANSWERS "none" on his phone — find why on the real site
  (the /api/sky function failing / timing out, Open-Meteo rate-limited, a parse error, the location missing): log the
  reason in the readout ("live: failed — <why>"); (2) a "none" must NEVER replace a real answer — the 15-min-old cached
  clear stays until a live one arrives (SP3 said it would hold; it doesn't); (3) the SEEDED fallback is probably the
  "wind stuck on + clouds racing" (7 seeded clouds + a seeded wind) — the fallback must be CALM + plausible and say
  "seeded" plainly; (4) the +8 s neon / facade crossfade after the reveal — find its cause; (5) the debug readouts draw
  ON TOP of the open PREVIEW PANEL (the strips cover its controls) — hide them, or draw them under the panel, while
  it's open. FIRST JOB of the next pass (Group 0).
- MORNING CHECKS (the owner, Oct 26 8:10 am): DRIZZLE / RAIN / HEAVY RAIN now clearly different ✔ (SP3). BUGS:
  (1) THE JAZZ HUSH SIGN IS MISPLACED — since SP3 put it on its own 3× overlay + enlarged the windows, the 2×2 letters
  sit off the lower-right pane (riding up over its top frame, past its right edge) — it must sit centred INSIDE the
  window's glass, following the window's live rect (the new SP3 sizes, every phone, resize / re-layout), clipped to
  the pane; a check that the letters' box is inside the glass. (2) THE AWNING's DRIPS fall at the SAME RATE whatever
  the rain — they must scale with it (drizzle: an occasional drip; rain: a steady line; heavy: a running fringe of
  drops + a sheet pouring off the corners), and taper off over minutes after the rain stops. (3) THE LIGHTNING must look
  MENACING (for the ATMOSPHERE pass, with "THE STORM ISN'T A STORM YET"): jagged, thick, violent forks with a
  blinding core, a split-second double / triple stroke flicker, the whole storm deck lit from inside, the city's
  shadows thrown for an instant, the thunder cracking right on top of a close one.
- THE OWNER's VERDICTS (Oct 26 8:19 am): (1) THE NEON LOGO: he can't see a difference → LEAVE IT AS IS (no redraw pass).
  (2) THE SPIDER + THE WEB LOOK CHEAP → per his rule ("if you can't make one look realistic + really good, make it alien
  / futuristic"): REDO BOTH as a deliberate FUTURISTIC NEON design — the web a fine geometric web of thin glowing filaments
  (laser-thin light threads in a cool violet / ice white, a perfect radial + spiral geometry, tiny bright nodes where
  threads cross like dew of light, a faint shimmer travelling along the threads), still GROWING day by day through
  October; the spider a sleek BIO-MECHANICAL spider — glossy black chrome body, faint neon seams + glowing eyes, eight
  precisely articulated legs with a mechanical stop-start gait (no tangling at the turn), catching the NEON's pink on its
  chrome; tap → it drops on a glowing thread. Premium + menacing-cool, never cartoon. (3) THE WINDOW FIGURES NEED MORE
  WORK: "if it's lit in the room you should be able to SEE them, not silhouettes" → in a LIT room people are LIT: skin
  tones, hair colour, clothes in real colours + patterns read as blocks of colour (a red dress, a white shirt + braces, a
  dark suit with a pocket square), the lamp's light modelling them (a lit side + a shade side, a warm rim), faces as
  simple lit shapes (no tiny features that can't read); a SILHOUETTE only when the person is between the lamp and the
  window (backlit) or in a dark room / the ghost scenes. Judged at the real window size at 402. (4) MUSIC-OFF WORKS (the
  song stays off with the slash) → the AUDIO readout's "sounding / el playing" while the music is off is WRONG wording —
  make it say the truth (e.g. "music off — the element paused / silent").

## OWNER'S NOTES — OCT 26 (after SP4)
- THE BUILD TABLE: WIN (this pass: the windows pass — 2.5D rooms, the TV room rebuilt, the cash count, the hush word on the wall,
  the window bugs, PLAY ALL + a tidy panel) → then 11a-2 THANKSGIVING (+ the parade), 9b WINTER, ATM (the FABLE ATMOSPHERE pass),
  10 PARTY NIGHTS, 11b CHRISTMAS + NYE (live by Nov 26). SP4's own review: the rain + the awning's drips look great; the sundial
  idea was dropped (unreadable on a phone).
- THE ROOMS IN DEPTH (the owner asked, Oct 26 9:35 am: model the rooms in 3D?) — Claude: NOT real 3D (the camera never moves, four
  3D scenes cost a rewrite + battery, CLAUDE.md's Canvas 2D rule) → "2.5D" ROOMS, the follow-up IF the rooms still feel flat after
  SP4: each room a BOX IN PERSPECTIVE seen from the street's real angle (back wall, floor, ceiling, a sliver of side wall), the
  lamp's light FALLING OFF (a pool on the floor, darker corners), people placed AT DEPTH (nearer = bigger, walking toward / away
  from the window scales them, overlapping furniture + each other), their shadows on the floor + the back wall, with SP4's
  3D-shaded figures. DECIDED (the owner, Oct 26 10:14 am — "rooms felt a little flat, let's try 2.5D"): BUILD IT in the windows pass.
- A NEW WINDOW MOMENT — COUNTING THE CASH (the owner, Oct 26 9:41 am): someone at a table counting a BIG PILE OF CASH (the
  bootlegger's take — fits the speakeasy + the raid's story): a man in shirtsleeves + braces (or the boss in a waistcoat) under a
  green banker's lamp, stacks of banded bills + a loose heap, licking a thumb, counting bills off into piles, a glance over his
  shoulder at the window now and then, sweeping it into a bag when a shadow passes the door; readable at the real window size at
  402 by COLOUR + LIGHT + MOTION (the green lamp's pool, the pale-green bills, the counting motion). Late evening on bootlegger
  nights; hidden on raid nights (the cash vanishes before the police come).
- SMOKE IN THE BLUE ROOM (the owner, Oct 26 9:41 am): the upper-right TV room (the blue one) now and then fills with a little
  SMOKE — someone lights a cigarette / cigar: a curl rising from the chair, then a soft layered haze drifting slowly across the
  room, LIT BY THE TV's flickering blue (the smoke catching the light, the beams of the screen through it), thinning out over a
  few minutes; not every night, not constantly. Readable at 402 by light (blue light on soft smoke), cheap (a few baked wisps
  moved + faded).
  + THE COUCH (the owner, 9:42 am — agreed): the blue room's scene = a COUCH seen from BEHIND (facing the TV on the back wall)
  with a HEAD above it (sometimes two), lit from the front by the TV's flicker (a blue rim on the hair + shoulders, the screen
  glowing beyond them); small life (a nod, leaning on a shoulder, an arm reaching for a drink); the smoke rises from that head;
  at 3 am the TV clicks off + the room goes dark.
- SP4 PHONE REVIEW (the owner, Oct 26 10:02 am): (1) THE TANGO plays in ALL the windows at once — a moment belongs to ONE window
  (the "one star window" rule; check every forced + scheduled moment: never mirrored across panes); (2) THE GHOST needs BIGGER
  EYES — two dark hollow eyes (+ a mouth) big enough to read as a ghost on the iPhone at window size; (3) THE TV ROOM IS A
  REGRESSION — the couch silhouette looks "unbelievably cheap" and the TV set must NOT be visible (it's implied — off-frame /
  facing them, below the sill line): rebuild as the room LIT BY THE UNSEEN TV — the blue glow filling the room from one side /
  below, the back of the couch + the heads as SHADED 3D forms (rim + soft shading from the screen light, never a flat cut-out),
  the walls + ceiling washed in the light; THE GLOW must FLICKER much more — real TV light: irregular brightness jumps at scene
  cuts, colour shifts (cool blue ↔ a warmer flash ↔ dim), short flickers between, never a steady pulse; the smoke caught in that
  changing light. Premium, judged zoomed + full at 402.
- THE HUSH WORD MOVES TO THE WALL (the owner, Oct 26 10:05 am — DECIDED, replaces the lower-right-window hush sign): a VERTICAL
  NEON SIGN mounted FLAT on the brick PIER between the right window column and the vertical blade (above the door + its lamp) —
  the hush word's letters STACKED top to bottom (4 letters, sized for 5), ~18–22 pt each at 402 (≈2× the window sign), ICE-CYAN
  with white-hot cores (POLISH 5's look), in a thin dark frame / door-plate mount so it reads as THE DOOR's PASSWORD SIGN and never
  as another game blade: flush (not projecting), letters a little smaller than the blade's, a clear gap from the blade's glow,
  centred in the pier. NO LOBBY = plain brick (no mount showing). A lobby opens → it FLICKERS ON letter by letter like real neon;
  its cyan glows on the wet brick in rain; dark in the TR-3B blackout; the burnt-out-letter rule never applies to it (the word must
  always read). ALL FOUR WINDOWS stay free for the moments during a lobby (the lower-right window back to its scenes). Lobby 2.0
  calls set(word) as today.
- SP4 PHONE REVIEW, PART 2 (the owner, Oct 26 10:09 am): THE RAIN + THE AWNING's DRIPS look great ✔. BUG: TAPPING THE SPIDER DOES
  NOTHING on his iPhone (it should drop on its glowing thread). Suspects: a `click` listener (iOS Safari sends no click to a plain
  area — CLAUDE.md's pointerdown + pointerup rule), the NEON logo's own letter-tap handler / the sign's DOM layer sitting over the
  spider and eating the tap, a hit box that doesn't follow the spider's live position, or the tap only wired in the forced preview.
  Fix + an E2E tap on a touch-emulated device (with the letter taps still working beside it).
- SP4 PHONE REVIEW, PART 3 (the owner, Oct 26 10:12 am): (1) THE JAZZ SOLO (moment=sax) IS GLITCHED — the window shows the word
  "JAZZ" and you can't see the scene behind it: the hush sign drawn over a moment (a stale JUST ME &force=hushsign? the 3× overlay
  never clearing? the sign shown without a lobby?) → find it; the move of the hush word to the wall pier ends the overlap for good,
  but the overlay must never show without a lobby / a force. (2) THE TOAST looks CHOPPY — investigate the window moments' frame
  pacing (do the figures update every frame or in steps? the live 3D gradients' cost? a moment clock on a coarse tick? pose snaps
  between keyframes?) — measured like PEO, smooth at 60 fps. (3) THE CASH COUNT (not added to SP4) → build it as a CLOSE-UP moment:
  a guy counting money, head + shoulders + hands + the pile filling the pane, the green banker's lamp, banded stacks, bills peeled
  off one by one, a glance at the window — on the new lit 3D kit.
- THE PREVIEW PANEL — A "PLAY ALL WINDOW SCENES" LOOP + TIDY IT UP AGAIN (the owner, Oct 26 10:13 am): (1) ONE button in the
  panel's SPEAKEASY / WINDOWS section — "PLAY ALL SCENES" — that cycles through EVERY window moment in turn (each its full length,
  in its own window, a small chip saying which one + "n / N", tap the chip to skip / pause, ✕ to stop), looping until stopped, the
  right time of day for each (a night scene at night) without a reload; the same idea reusable for other catalogues ("PLAY ALL"
  for the holiday moments, the wildlife, the workers). (2) THE PANEL IS CLUTTERED AGAIN (C2 reworked it; the passes since added
  many rows): re-organize — collapsed sections by default with a count, rows grouped inside (e.g. SPEAKEASY → windows / signs /
  door; SKY → messages / aircraft / legendaries; WEATHER → rain / storm / fog / cold), the rarely-used debug rows in a TOOLS section
  at the bottom, PLAY ALL rows at the top of their section, search still finds everything; readable at 390.

## OWNER'S NOTES — OCT 26 (after WIN)
- THE BUILD TABLE: WIN2 (this pass: the spiders + their nerves, the windows that read AS-IS, PLAY ALL on its own clock, the quality
  step after the reveal, the debug strips) → 11a-2 THANKSGIVING (+ the parade) → 9b WINTER → ATM (the FABLE ATMOSPHERE pass) →
  10 PARTY NIGHTS → 11b CHRISTMAS + NYE (live by Nov 26). FUTURE IDEAS: "TAP A WINDOW TO PEEK INSIDE" (parked by the owner). WIN's
  cloud fixes (pushed without [harbor]) are proven by WIN2's run.
- HOLIDAY SET PIECES BIG ENOUGH TO READ (the owner, Oct 26 10:23 am — DECIDED, a rule for EVERY holiday / event / season; BUILT in WIN
  as an add-on — core/harbor-spots.js): (1) THE PUMPKINS round the speakeasy door are too crowded on small iPhones → fewer, better laid
  out (a neat stepped group on the steps + one each side of the door, clear of the door's swing + the walk-in + the lobby line),
  checked at 390; (2) BIG JACK-O'-LANTERNS out on the promenade, readable at a glance: a BIG one next to the BENCH, another by a LAMP
  POST or the FIRE HYDRANT (carved faces glowing at night, a stack / a straw bale under some); (3) THE RULE: the promenade has room —
  the holiday system gets named DRESSING SPOTS (by the bench, the lamp posts, the hydrant, the planters, the quay railing, the corners
  clear of the dock + the walk paths + the lobby line + the people's routes) that every holiday fills with a few BIG, readable set
  pieces in its own style (Halloween pumpkins + bales; Thanksgiving cornstalks, gourds + hay; Christmas lit trees, wreaths, gift piles;
  New Year's balloons; Valentine's roses; St. Patrick's shamrock planters; July 4th bunting + flags) so anyone NOTICES the holiday /
  the season at a glance on a phone.
- A QUALITY STEP ~9.5 s AFTER THE REVEAL RE-BAKES THE CITY (the owner's LOAD log, Oct 26 12:47 pm — BUILT in WIN2 Group 4, docs/harbor.md#win2 — the header's "9 changes after the
  reveal" was RIGHT; its list was just scrolled): a perfect reveal at 0.35 s (live weather cached 1 min old), then at +9.50 s "canvas
  ⚠ 402×874@2 → @1.5 (a tier step)" → a ⚠ layout, a ⚠ 1200 ms bake crossfade, a ⚠ lit crossfade, ⚠ clouds re-planned (the +9.60 s
  power-on entries are the music's surge, by design). On a calm day the phone judged itself slow (load-time work?) and dropped a tier,
  and the whole city visibly crossfades + softens 10 s in (the readout flips t1 ↔ t2 between loads). FIX: (1) find why it steps (which
  frames counted as slow — the reveal's own work, the audio start, the PLAY / surge?); (2) never judge the tier on the first ~15 s or
  on frames during a known heavy moment (the surge, a bake); require SUSTAINED slowness; (3) step EFFECTS first (particles, glows,
  reflections) and the canvas RESOLUTION last; (4) a step after the reveal must be invisible — no full-city crossfade; (5) the
  readout's tier line says why it stepped. Also the open LOAD log hides its first lines under its own header (scroll it to show the top).
- THE DEBUG STRIPS BLOCK THE TEST PILL (the owner, Oct 26 12:49 pm, frustrated — BUILT in WIN2 Group 3): with &debug=1 the readout + AUDIO + LOAD strips (the
  LOAD log opened) cover the TEST pill so he can't reach the panel. FIX: every strip starts FOLDED to one line on every load (never
  remembered open), they sit BELOW the TEST pill + the corner buttons and never over them, the open LOAD log is height-capped + scrolls
  inside itself, and one tap on the readout's header hides ALL the strips.
- THE SPIDER's TAP + ITS NERVES (the owner, Oct 26 12:51 pm — DECIDED; BUILT in WIN2 Group 1): (1) THE TAP: it drops on its glowing thread DOWN TO THE
  "SPEAKEASY" WORD, lands on the tubes, CRAWLS BACK AND FORTH along the word for ~10–15 s (stop-start, pausing on a letter, a leg
  test-tapping a tube), then CLIMBS BACK up its thread (reeling it in) to its starting spot on the web; a second tap mid-way doesn't
  restart it (a short cooldown). (2) IT REACTS TO THE NEON: whenever a tube NEAR it flickers, blinks, buzzes or races (the burnt-out
  letter, the boot flicker, the race / surge, a tapped letter re-igniting, the TR-3B blackout + power-back, a lightning flash), it
  gets SCARED / AGITATED — freezes, crouches low on its legs, then skitters a short burst away from the flicker (or back toward the
  web's hub), its eyes / seams flaring; bigger events (the race, the blackout) = a bigger reaction; it calms + resumes after a few
  seconds. Readable at 402.
- WIN PHONE REVIEW (the owner, Oct 26 12:53–12:54 pm — BUILT in WIN2 Group 2): (1) THE TV ROOM "good but not perfect" — still hard to read as someone on a
  couch watching TV; Claude offered A (lower the couch back so head + shoulders show, bigger viewer, an armrest, the flicker throwing
  their shadow on the wall) vs B (recommended: the couch FACING the window — the TV just inside below the sill — so their FACE +
  shoulders are lit blue by the screen, flickering with every cut; reactions: a laugh, a lean in, a yawn, nodding off late) — DECIDED
  (the owner, 12:55 pm): OPTION B. (2) THE TOAST "good" but people SNAP from the bar scene to the front of the window → they must
  WALK to the window (from the bar / the room's depth, growing as they come forward in the 2.5D room), then clink glasses + toast,
  then drift back; the same rule for EVERY close moment: people arrive + leave by walking through the room's depth, never a cut.
- THE BARBERSHOP's CUSTOMER LOOKS LIKE A WHITE BOX (the owner, Oct 26 12:58 pm — the scene is good otherwise; BUILT in WIN2 Group 2): the man in the chair
  reads as a white rectangle (the barber's cape as a flat block) → a real seated customer: his head + face + hair above the cape (the
  barber working on it), the striped / white cape draped over his shoulders + knees with folds + shading (the 3D kit), the barber's
  chair's chrome + leather visible (the headrest, the armrests, the footrest), his shoes poking out, the barber's comb + scissors /
  razor moving at his head; by day + lit at night, readable at 402.
- PLAY ALL SCENES DOESN'T SET THE TIME (the owner, Oct 26 1:01 pm — BUILT in WIN2 Group 3): run by day, the night moments play in a daytime room (or don't
  show) — WIN's "the clock jumps once per day / night half" isn't enough. FIX: before EACH moment the sequencer jumps the city's
  clock to a time that moment belongs to (its own hour: the TV room ~23:00, the cash count late, the morning wake ~7:00, the
  barbershop by day…), the light + the rooms + the sky following (a quick fade, not a jarring cut), then plays it in full; the chip
  shows the moment's name + its time; ✕ restores the real clock. The same for the holiday / animals / workers PLAY ALLs (each item at
  its own date + time). A check: every moment in the catalogue plays at a time it's allowed to.
- THE HYDRANT's PUMPKIN LOOKS STRETCHED (the owner, Oct 26 1:01 pm — BUILT in WIN2 Group 1): the big jack-o'-lantern by the fire hydrant reads squashed /
  stretched wide (~25 pt across, too flat) — a real pumpkin's proportions (round, ribbed, a slight squat, a stem), drawn at its true
  aspect (no non-uniform scaling of the sprite), the carved face centred on its curve, sitting on the ground with a contact shadow;
  all three big jack-o'-lanterns checked the same way at 390 / 402 / 430.
- THE EDGE WINDOWS' MOOD LIGHTS (the owner, Oct 26 1:04 pm — DECIDED; the ghosts look good ✔; BUILT in WIN2 Group 2): the half-cut windows at the left
  screen edge get ACTION from LIGHT + SHADOW only (NO people, NO scenes): each night a seeded MOOD from a rotating set — TV BLUE
  flicker (scene cuts, as if someone watches out of sight), an EERIE RED darkroom bulb that buzzes / flickers now + then, a wavering
  CANDLE glow, a GREEN BANKER's LAMP with a shadow passing the wall, HEADLIGHT SWEEPS (a dark room, slatted blind shadows crossing the
  ceiling), a CEILING FAN's turning shadow under a warm lamp, LIGHTS OUT (a lamp that clicks off ~midnight), PARTY nights a slow colour
  cycle on the beat, HOLIDAYS their tints (Halloween orange / purple, Christmas red / green). The two edge windows never share a mood
  the same night; flickers occasional + soft (never a strobe); they follow the blackout + the weather (lightning flashes in them). The
  "never fully dark" low lamp folds in.
- WIN PHONE REVIEW, PART 2 (the owner, Oct 26 1:12 pm — BUILT in WIN2 Groups 1 + 2): (1) THE RIGHT PIER's WALL-WASHER: removed ONLY WHILE THE LOBBY SIGN IS IN USE
  (lit, so the hush word grows to ~17 pt / 4 letters); with no lobby the washer stays (the plain brick lit as today); a smooth swap
  when a lobby opens / closes. (2) THE WALL SIGN: may read a little busy beside the blade — KEEP IT for now (he may change it later).
  (3) THE CASH COUNT: "good for now" but hard to see what's going on → clearer: bigger hands + bills, the bills a brighter pale green
  against a darker table, the counting motion bigger + slower (a bill lifted + snapped down onto the pile), the stacks taller, the
  lamp's pool tighter on the money. (4) A SECOND SPIDER on the last N of NEON (its web is already there) — the same bio-mechanical
  design + the SAME behaviour (its own tap → down to SPEAKEASY, crawl 10–15 s, climb back; scared by flickers near it), the two never
  in sync. (5) A plain reload's LOAD log: reveal 477 ms, "clear (cached · 9 min old … the weather is live)", the header green ("still
  after the reveal") ✔ — the only later entry was his own CLEAR ALL at +6.9 s (expected).
- THE WINDOWS MUST READ AS-IS (the owner, Oct 26 1:14 pm: "we are on iPhone and NO ZOOM — it must be seen as is"; the 2.5D floor +
  wall lines only show zoomed; two connected floors considered + dropped — the windows stay the same size, he likes the layout).
  DECIDED for the next window work — every scene ACTS BIG: (1) PUPPET-THEATRE staging: exaggerated poses, ONE clear action per scene,
  slower + larger motions (a toast = two arms raised high; the cash = a bill lifted + slapped down); (2) STRONG VALUE CONTRAST: a lit
  figure on a darker wall or a dark figure on a bright one — never the same warm tone for both; (3) FEWER, BIGGER SHAPES: one or two
  figures, one lamp, nothing under a few pt; (4) DEPTH ONLY WHERE IT READS: a bright pool of light + dark corners (the floor / wall
  lines may stay faint). Judged ONLY at the real size on a 402 screenshot, never zoomed.
- THE EYES IN THE HAZE (the owner, Oct 26, mid-WIN2 — an add-on; BUILT in WIN2 Group 2): one of the four full windows = a dark room filled
  with slow drifting smoky haze, faintly lit from below by a dim ember-red glow, with just a pair of big red glowing eyes watching the
  street, blinking rarely (slow, deliberate; now and then drifting a little or narrowing). No body, no face. 11 pm–4 am on 2 random
  weekend nights a month (seeded; never on a legendary's night, never with the edge windows' "eerie red" mood or a Mothman night — no
  Mothman exists yet: the hook `ctx.mothman`). Readable unzoomed at 402. In PLAY ALL + `&force=window&moment=eyes`.

## OWNER'S NOTES — OCT 26 (after WIN2)
Build table from here: **WIN3** (DONE Oct 26 — docs/harbor.md#win3; the lamp post's jack-o'-lantern add-on moved to the front strip in it; this pass: the spiders right for Halloween, the panel's scene buttons, the boss's TV room, the cash
count, the party in the windows) → 11a-2 THANKSGIVING (+ the parade; Opus) → 9b WINTER → ATM (the FABLE ATMOSPHERE pass) → 10 PARTY
NIGHTS → 11b CHRISTMAS + NYE (live by Nov 26) … 13 CITY CONTROL (+ THE BIRTHDAY EVENT). WIN2's two test fixes pushed without `[harbor]`
are proven by THIS pass's cloud run.

- A NEW WINDOW MOMENT — THE EYES IN THE HAZE (the owner, Oct 26 1:32 pm — DECIDED): one of the four full windows becomes a dark room
  FILLED WITH SMOKY HAZE (slow drifting layers, faintly lit from below by a dim ember-red glow) with just a PAIR OF BIG RED GLOWING
  EYES in it, WATCHING YOU (facing the street), BLINKING RARELY / occasionally (a slow, deliberate blink; now and then they drift a
  little in the haze or narrow). No body, no face — only the eyes + the haze. 11 pm → 4 am, on 2 WEEKEND nights a month at random
  (seeded, the same nights for everyone; never on a legendary's night, never the same night as the edge windows' "eerie red" mood,
  never with the Mothman's nights). Readable UNZOOMED at 402 (the eyes big + bright enough, the haze a soft glowing volume). In PLAY
  ALL + `&force=window&moment=eyes`. (BUILT in WIN2.)
- A BIRTHDAY EVENT (the owner, Oct 26 1:35 pm — for PART 13 CITY CONTROL; "we don't have to do it now"): a reusable "HAPPY BIRTHDAY"
  CELEBRATION the owner schedules for an exact date + time (one moment for everyone, or at that local time, or only for people who
  open a private link — CITY CONTROL's options): the city throws a party for one name — the BANNER PLANE ("HAPPY BIRTHDAY <NAME>!"),
  SKYTYPING by day / the DRONE SHOW message at night, THE PARADE down the waterside road (Thanksgiving's reusable parade system,
  birthday balloons + a band), FIREWORKS (Part 10) at night, the city's LIGHTS in party colours (the wheel, the sky beams, the roof
  signs spelling it), the NEON sign dressed (balloons, a birthday tube piece), the tagline "HAPPY BIRTHDAY, <NAME>." + confetti; joins
  mid-way; a preview in the panel. Composed from existing events (no new art beyond the birthday dressings). LATER (Progression 2.0):
  a player may add their birthday (MONTH + DAY only, never the year) to their profile → a small personal celebration only THEY see
  on the day. Depends on: the parade (11a-2), fireworks (10), City Control (13).
- THE SPIDERS — WIN2 REVIEW (the owner, Oct 26 3:10 pm — BUILT in WIN3 Group 1, docs/harbor.md#win3): (1) THE SECOND SPIDER only appears ON Halloween → part of the BUILD-UP: it
  arrives ~2 days before (Oct 29), so the 30th + 31st have two; (2) on SPEAKEASY they must WALK ON TOP of the word (in front of the
  tubes, feet on them), never BEHIND it — draw the crawling spider over the white-neon letters; (3) THE DROP: the spider descends ON
  ITS THREAD and DANGLES down onto the word — body hanging below the thread, legs tucked / relaxed around it as real spiders do (a
  gentle sway + a slow spin), touching down feet-first, then walking; NOT its legs stretched down to reach the letters (unnatural).
  The climb home the same in reverse (reeling the thread, legs gathered). Check: both visible + tappable on Oct 29 / 30 / 31 at
  390 / 402 / 430, unzoomed.
- THE PANEL's WINDOW-SCENE BUTTONS DON'T WORK (the owner, Oct 26 3:14 pm — BUILT in WIN3 Group 2: a row jumps the clock to its moment's own hour): PEEK AT THE STREET + CASH COUNT (and likely the others) do
  nothing from the preview panel — the `&force=window&moment=` links work but the panel's rows don't fire them (a wrong id after WIN's
  rename / the new sections, a gate like "only on its own nights" blocking a forced moment, the JUST ME clock not jumping to the
  moment's hour). Fix every row in SPEAKEASY → windows + a check that EACH row starts its moment (in its window, at a time it's
  allowed, the chip naming it).
- PARTY NIGHT IN THE SPEAKEASY (the owner, Oct 26 3:14 pm — agreed, with Claude's notes; BUILT in WIN3 Group 4): on PARTY NIGHTS, during the party's PEAK (not
  the whole evening: normal moments in the warm-up, the party after), the BLINDS GO UP in every window — NOT ALL AT ONCE (the owner,
  3:26 pm): ONE ROOM AT A TIME, ~every 10 s, the whole building partying within ~60 s (a seeded order each night: blinds up, the
  colour floods in, the crowd starts jumping), winding down the same way at the end; the boss's TV room never joins — all glass — and
  EVERY ROOM IS ONE BIG DANCE PARTY, each room lit in its OWN NEON COLOUR (the party palette: magenta, cyan, violet, amber… never two
  rooms alike), crowds as DARK SILHOUETTES against the coloured light (backlit = allowed), JUMPING + dancing with arms swinging, ON
  THE BEAT (the same beat as the city when music plays), a few GLOW WANDS like the promenade's dance circle; the coloured light
  SPILLS out onto the promenade (pools of each room's colour on the cobbles + the wet street), giving the foreground colour. The
  exception to the "one star window" rule (a party is meant to be busy; it reads as colour + motion). The edge windows join with their
  party cycle. A RAID cuts it: the lights snap off, the dancers scatter, the blinds drop. Readable unzoomed at 402; the wall's hush
  sign stays readable beside it. A row in PLAY ALL + `&force=window-party`.
- THE CASH COUNT — REWORK (the owner, Oct 26 3:20 pm — BUILT in WIN3 Group 3): its opening reads like a poker table and is "almost unviewable" → ONLY the
  close-up: the man (head, shoulders, hands) counting under the green lamp from the first frame; NATURAL HANDS — a real counting
  rhythm (one hand holds the stack, the thumb flicks bills off one at a time into the other hand or onto the pile, a lick of the
  thumb now and then, a squared-up stack tapped on the table, a band snapped on), eased, never robotic; readable unzoomed at 402.
- THE TV ROOM — WHAT IT'S REALLY ABOUT (the owner, Oct 26 3:20 pm — personal, "I need to get that one right"; BUILT in WIN3 Group 3 incl. the revisions + the quiet nights): driving late at night
  he'd always see, on the TOP FLOOR of a house at 3 a.m., the BLUE GLOW of someone watching TV — you NEVER saw the person, so you
  wondered who he was, what he was watching, how he was doing. Seeing the person takes that away. DECIDED (Claude's suggestion): NO
  PERSON AT ALL — THE MYSTERY IS THE POINT. The room is DARK and the only light is the unseen TV's GLOW: a blue light thrown up onto
  the ceiling + the back wall from below the sill, through a half-drawn curtain / blind (its edge catching the light), FLICKERING like
  a real TV seen from the street — irregular cuts, brightness jumps, colour shifts (cool blue ↔ a warm flash ↔ dim), a fast burst when
  someone changes the channel (late, ~1 am), a long steady dim stretch (a quiet scene); once in a while a SHADOW moves across the
  ceiling glow (someone shifting, getting up for a snack) — only ever a shadow. REVISED (the owner, 3:22 pm): NOT the only room on —
  the other rooms keep their life; the TV room is a CONSTANT FEATURE of the speakeasy, EVERY NIGHT ~10 pm → 3 am, "almost a feature of
  it" — LORE: maybe it's THE BOSS's room; nobody knows. It's noticed by being THE ONLY COOL BLUE window among the warm rooms + its
  unmistakable flicker (no dimming of the others needed). The boss lore in small ways: on a RAID night the TV snaps off early as the
  sirens start (and a shadow at the curtain edge watches the street); on PARTY nights it's the ONE window that does NOT join the dance
  party — it stays blue (the boss doesn't dance); + SOME NIGHTS IT's THE ONLY ONE ON (the owner, 3:22 pm — variety, never stale): on a
  few quiet nights (seeded, ~1 in 6, mostly Sun–Wed, never a party night), the other rooms go to bed one by one after midnight (lamps
  clicking off, a last shadow at a window) until his blue glow is the ONLY light on the building — the 3 a.m. feeling; other nights the
  building stays lively around it; on Halloween / Christmas its glow takes a faint tint of the holiday film he's watching; at ~3 am the
  TV clicks off (a last flicker) and the window goes dark. Remove the couch, the faces + the smoke-from-a-person (the smoke may stay
  as a faint haze catching the blue). Readable unzoomed at 402: a lone blue flickering window high up.
- THANKSGIVING SOUNDS (Oct 26 3:28 pm): the owner is giving Grok a batch for 11a-2 — geese-v, parade-crowd (+ parade-cheer),
  marching-band-far (a PUBLIC-DOMAIN recording only, e.g. a pre-1926 Sousa march), leaves-rake, balloon-flap — into
  ~/Downloads/city-sfx, credits.txt "Thanksgiving + parade sounds". 11a-2 imports them.

## OWNER'S NOTES — OCT 26 (after WIN3)
Build table from here: **SP5** (this pass, Fable — the speakeasy follow-ups: the spiders, the boss's room, the windows, the party, the
promenade dance, the blade's weekly repaint; Group 1 — the spiders — ships FIRST for Halloween, Sat Oct 31) → 11a-2 THANKSGIVING + THE
PARADE (Opus; its sounds are in ~/Downloads/city-sfx with Grok's processing brief — the next prompt carries it) → 9b WINTER (+ the
climate-aware weather fallback) → ATM (the FABLE ATMOSPHERE pass) → 10 PARTY NIGHTS → 11b CHRISTMAS + NYE (live by Nov 26) … 13 CITY
CONTROL (+ the birthday event). FUTURE IDEAS: SYNCHRONIZED DANCES (parked — see the end of this section).

- THE RIGHT LAMP POST's JACK-O'-LANTERN IS HIDDEN (the owner, Oct 26 3:53 pm, by day — BUILT in WIN3, spot `corner-right`): the one on
  the straw bale by the right lamp post sits BEHIND the right tree, mostly covered → MOVE it FORWARD to the front of the promenade, just
  LEFT of the right tree's planter (nearer the camera = bigger + fully seen, the tree framing it from behind), clear of the HOST button's
  zone (the dock at rest and shown), the walkers' routes + the crosswalk path, never overlapping the couple's usual standing spot; update
  that DRESSING SPOT in core/harbor-spots.js so later holidays use the new spot too.
- THE WEATHER's FAILSAFE (the owner, Oct 26 3:57 pm — DECIDED): the live weather comes from Open-Meteo (+ NOAA's Kp) through our own
  /api/sky; if it's down the site never breaks (cached answer → the SEEDED fallback). Make the fallback CLIMATE-AWARE, not random: built
  from the DATE + the player's LOCATION (lat / lon, else the time zone's region) using simple climate normals by month + latitude
  (temperature range, cloudiness, chance of rain / snow, typical wind, fog season), seeded by the date so everyone at a place sees the
  same, changing gently through the day — "even if live weather isn't working, you're still going to be close" (a cloudy cool November
  in Michigan, a sunny one in Arizona). No fresh snow invented on a mild day; snow on the ground in the fallback only where + when the
  climate makes it likely (9b's snowpack model). The readout names it ("weather: climate fallback — live failed: <why>"). For 9b (the
  snow states depend on it).
- THE SPEAKEASY's BLADE — VARIETY (the owner, Oct 26 4:00 pm): not always warm-white letters; vary the COLOURS + the LETTER STYLES so the
  sign never gets boring. Claude's rules: each game's blade night takes its OWN LOOK — the letters lit in the GAME's accent colour (its
  theme in css/base.css: PULSE's, CIPHER's…) with a white-hot core so they still read, or a classic warm-white / amber; the marquee
  BULBS warm-white, amber or a coloured chase to match; 3–4 LETTER STYLES from one 1920s Art Deco family (a bold deco block, a condensed
  marquee sans, a slab, an inline / outline style) — never a script (unreadable stacked); CORRECTED (the owner, 4:09 pm — Claude checked
  core/harbor-workers.js: the blade changes ONLY when THE SIGN PAINTERS repaint it, MONDAY 1–4 pm, for the new week): the colour +
  letter style are part of EACH WEEK's REPAINT — the painters' stages (paint-out → chalk → letters → gilt) paint the new game IN its new
  style + colours, chosen per week (seeded, the same for everyone), never the same style two weeks running; the design then holds all
  week (only the bulbs' chase varies on party nights); DECIDED (the owner, 4:13 pm): each Monday's repaint changes THE GAME + THE LETTER
  COLOUR + THE LETTER STYLE + THE PANEL COLOUR; THE BULBS STAY WARM WHITE (the incandescent building — the letters carry the colour) and
  keep their behaviour (the calm chase, the beat on party nights, the weekly burnt-out bulb + the repairman); by day the painted letters
  + the panel colour vary the same way. Readability first: every combo checked unzoomed at 390 / 402 / 430 for the longest names.
  (BUILT in SP5 Group 4.)
- REMIND THE OWNER BEFORE THE NEXT PROMPT (Oct 26 4:14 pm): when he asks for the next prompt (Thanksgiving), FIRST remind him to send
  Claude the THANKSGIVING SOUNDS Grok found (the list / credits.txt section, what landed in ~/Downloads/city-sfx), so the prompt imports
  exactly those.
- NOTES FOR THE NEXT PROMPT (the owner, Oct 26 5:05 pm): (1) THE SPIDERS' SCARE must be BIGGER — they scatter FARTHER + FASTER away from
  a flickering / racing tube (a real panicked dash across the web or up their thread, legs blurring), then a slow, wary return (BUILT in
  SP5 Group 1); (2) THE EDGE WINDOWS' CURTAINS look like BOW TIES (two swags tied in the middle) + block what little window there is → NO
  CURTAINS in the half-cut windows; instead a 1920s ROLLER SHADE (a plain fabric blind with a ring pull) at a seeded HEIGHT each night —
  UP (the full mood light), HALF-WAY (the light + shadows below a straight edge), or DOWN (the shade itself glowing as a warm translucent
  panel, the moods' shadows playing ON it — a fan's turning shadow, a figure's shadow passing, a flicker behind it); one clean horizontal
  edge reads at phone size; the two edge windows never at the same height the same night. DECIDED (the owner, 5:07 pm). (BUILT in SP5
  Group 3.)
- THE BOSS's ROOM BY DAY + THE WAKE MOVES (the owner, Oct 26 5:09 pm — DECIDED: he saw "THE UPSTAIRS WAKES" via PLAY ALL — a person
  stretching in the upper-right window, which is THE BOSS's TV room → it breaks the mystery). (1) MOVE "THE UPSTAIRS WAKES" (+ any other
  moment that shows a person in that room) to ANOTHER upper window; the boss's room NEVER shows a person, day or night. (2) THE BOSS's
  ROOM BY DAY (Claude's set, all light + shape, readable at 402): the SHADE DRAWN all day — the one window that never opens to the
  daylight (dark against the sunlit facade); now + then the shade LIFTS an inch and drops (someone peeking out); a BINOCULARS GLINT — a
  sharp sun flash from the gap aimed at the harbor, when Rosie docks or a boat comes in (the boss watching the docks); a thin curl of
  CIGAR SMOKE drifting out of a sash cracked open at the top; on BOOTLEGGER days, late afternoon, A SIGNAL — a lamp behind the shade
  blinks twice and a boat's light out on the water answers; on overcast days a SHADOW crossing behind the lit shade. Rare + seeded, a
  few a day, never two at once.
  REVISED (the owner, 5:12 pm): DROP the binoculars glint + the harbor light-signal (nobody would catch it); KEEP the drawn shade, the
  peek, the cigar smoke, the shadow. THE BOOTLEGGER SIGNAL becomes something the STREET can see (to explore + decide): a coloured LAMP
  behind the drawn shade on bootlegger days (e.g. VIOLET — the one window that colour), and / or a SYMBOL backlit on the shade (e.g. the
  spade ♠), lit from late afternoon until the bootleggers arrive, then off — a "tell" players can learn (the violet lamp = a shipment
  tonight).
  DECIDED (the owner, 5:14 pm): BOTH — the VIOLET LAMP behind the drawn shade + a dark SPADE ♠ cut-out against it, lit from late
  afternoon until the bootleggers' truck arrives, then off; on BOTH bootlegger occasions (the quiet weeknight ~10:40–11:15 pm, Sun–Thu,
  ~9 % of those nights ≈ 2 a month + the big SATURDAY delivery ~6:30–7 pm before every party night): the Saturday one lights ~3 pm, a
  weeknight one ~5 pm. (A raid follows a weeknight delivery rarely — the tell.) (BUILT in SP5 Group 2.)
- THANKSGIVING SOUNDS ARRIVED (Oct 26 5:20 pm; Grok's full processing brief saved as grok-thanksgiving-processing.md — goes into the
  11a-2 prompt): in ~/Downloads/city-sfx: geese-v.wav (Mixkit, 5.2 s), parade-crowd.mp3 (Pixabay, kids + claps, 31 s), parade-cheer.flac
  (Sonniss 5.1 → fold to stereo), marching-band-far.mp3 (the US Marine Band's "Washington Post March", Edison 1923 78 rpm — public
  domain), balloon-flap.mp3 (Pixabay, a big flag flapping, 79 s); + two Freesound CC0 files the owner downloaded himself — IN THE FOLDER
  (he confirmed, 5:23 pm): leaves-rake.wav, parade-crowd-2.wav (the adult murmur under the kids). Grok's chain: trim, HPF, 200–1200 Hz
  phone saturation, distance LPF + reverb (the band "two blocks away"), de-harsh, beds −30 LUFS-I / one-shots −20, −1 dBTP, seamless
  loops, a mono check; nothing auditioned by ear — skip anything harsh, modern or wordy.
- THE BARBERSHOP: TWO WHITE SHAPES (the owner, Oct 26 5:25 pm): the barber + the customer both read as white shirts — hard to tell apart
  at the shop window's size. FIX (Claude): keep the barber's classic WHITE JACKET but give it a dark VEST + a black bow tie (a dark shape
  across the white), and put the customer under a COLOURED CAPE — a deep NAVY (or burgundy) with a thin pinstripe — so the two are
  opposite values; the customer's face + hair above it; readable unzoomed at 402. (BUILT in SP5 Group 3.)
- WIN3 PHONE REVIEW — THE SPIDERS (the owner, Oct 26 5:28 pm): (1) the two MIRROR EACH OTHER's motion → fully INDEPENDENT (their own
  seeds, timings, pauses, paths, never in step); (2) a BIGGER range on the web: each roams at least the LENGTH OF ONE LETTER along its
  tubes / web (wandering, pausing, turning back); (3) BUG — on the DROP the FEET stay pinned to the web / tube and the legs STRETCH as
  the body falls: the feet must LET GO at the drop (legs gather with the body, the IK released) and re-plant only on touchdown.
  Otherwise the spiders look good ✔. (BUILT in SP5 Group 1.)
- WIN3 PHONE REVIEW — HALLOWEEN NIGHT + THE CART (the owner, Oct 26 5:30 pm): Halloween night looks great ✔; the moved jack-o'-lantern's
  placement good ✔ — BUT the CHESTNUT VENDOR stands on the cart's LEFT, right behind that jack-o'-lantern, so he's hidden → move him to
  the cart's RIGHT side (his serving spot, facing customers), visible at 390 / 402 / 430 with the lantern in place; the newsboy sharing
  the spot follows the same rule. (BUILT in SP5 Group 4.)
- WIN3 PHONE REVIEW — THE BOSS's TV LIGHT + A FIGURE IN HIS WINDOW (the owner, Oct 26 5:31 pm): (1) THE BOSS's ROOM is good ✔, but the
  TV LIGHT flickers too much: MOSTLY CALM — long stretches of steady cool blue with a slight, occasional shimmer; the fast flicker only
  now + then; the warm / YELLOW scene-change flashes much LESS often (the shadows + the rare silhouette moments as decided stay). (2) A
  GREEN SILHOUETTE showed in the UPPER-RIGHT window (likely Halloween's WITCH AT HER CAULDRON) — that's the BOSS's ROOM: NO moment ever
  plays there (holiday scenes included — the witch, the ghost, the mummy, the costume party, ofrendas, Thanksgiving tables… all go to
  the other windows); the holiday tint on his TV glow is his only holiday touch. A check: no figure / moment in the boss's room, ever.
  THE OWNER, 5:35 pm: "you finally nailed it" — the curtain's lit edge reads even unzoomed, the "only light on" night is "beautiful".
  The flicker change is a SMALL NUDGE, NOT A REDESIGN: keep everything (the room, the curtain, the colours, the shadows, the quiet
  nights), only lower the flicker's aggressiveness — fewer + gentler jumps, longer calm blue stretches, rarer yellow flashes. Compare
  before / after side by side and keep the change modest. (BUILT in SP5 Group 2.)
- WIN3 PHONE REVIEW — THE CASH COUNT (the owner, Oct 26 5:37 pm, screenshot): (1) BUG — FOUR ARMS: the figure's own outstretched arms
  stay drawn while the counting hands play on top (two arm sets) → ONE pair of arms: the counting pose REPLACES the figure's default
  arms (one rig, the hands at the ends of his own arms), checked frame by frame; (2) HE SNAPS IN → he WALKS UP to the table through the
  room's depth (WIN2's walk-in rule), sits / leans in, THEN counts (this overrides WIN3's "the close-up from the first frame": the
  walk-up first, then the close-up counting). (BUILT in SP5 Group 3.)
- WIN3 PHONE REVIEW — THE WINDOW PARTY (the owner, Oct 26 5:40 pm): "looks really good" ✔. (1) THE HALF-CUT EDGE WINDOWS join with
  DANCERS during the party: one or two silhouettes each (the only time people appear there — party only), cut off by the screen edge
  like the room continues past it, on the beat in their room's colour; (2) DEPTH in the party rooms: one extra dancer BEHIND each group
  — smaller, dimmer, partly hidden (the 2.5D depth), never crowding the front row; (3) THE BOSS's ROOM DURING THE PARTY — DECIDED (the
  owner, 5:45 pm): HE WATCHES OVER HIS PARTY — the shade comes all the way down, glowing softly with the TV light behind it; now + then
  HIS SHADOW appears against the shade, standing still, looking down at the party in the street, sometimes the tiny orange EMBER of
  his cigar glowing through; then he steps away. Only ever a shadow. (BUILT in SP5 Groups 2 + 3.)
- THE PROMENADE DANCE ON THE HOUR (the owner, Oct 26 5:41 pm — DECIDED, replaces the always-on glow-wand circle from 10 pm): on PARTY
  NIGHTS (any party mode), EVERY HOUR ON THE HOUR the dancers WALK UP to the centre circle (from the crossing / the speakeasy / the
  edges, arriving over ~30 s), DANCE FOR TWO SONGS (the music's own song boundaries when it plays — the beat-locked moves, a little
  cheer between songs; without music ~2 × 3.5 min on the party's clock), then LEAVE (drifting off in twos + threes). Same for everyone
  (the room / city clock), joins mid-way, the glow wands kept. Clear of the dock, the lobby line + a holiday centrepiece; never during a
  raid or the TR-3B. (BUILT in SP5 Group 4.)
- THE WINDOW DANCERS BETWEEN SONGS (the owner, Oct 26 5:53 pm): when the song switches, the dancers JITTER (a snap as their beat clock
  re-aligns to the new song) and keep dancing at full speed through the gap — wrong. FIX: at a song's end they WIND DOWN (the moves
  slow + soften over the last bars), and in the gap they IDLE — swaying lightly, shifting weight, turning to each other, a clap or a
  cheer, a sip — then PICK UP smoothly on the new song's first downbeat; every change of tempo / phase BLENDED over ~1 s (never a
  snap); the same for the promenade's hourly dance between its two songs. (BUILT in SP5 Group 3.)
- FUTURE IDEAS + SYNCHRONIZED DANCES (the owner, Oct 26 5:45 pm — PARKED): a few choreographed group dances in step with the beat (a
  1920s Charleston line, a swing circle, a modern line dance on party nights), picked per song.

## OWNER'S NOTES — OCT 26 (after SP5)

Most of this is RECORD-ONLY for later passes (9b, ATM, Part 10, Lobby 2.0, Progression 2.0, Part 13). Part 11a-2 builds only
what its own groups name (the giant jack-o'-lantern, the letter-tap hum, the boss's tweaks; Thanksgiving; the parade system).

- **CLEAR ALL DOESN'T GO BACK TO THE REAL CITY** (the owner, Oct 26 5:57 pm — BUILT in SP5). Claude read
  js/screens/harbor/remote.js#clearAll: in JUST ME it emptied the panel's own state + called scene.remote(null) — but (1) a
  PREVIEW LINK's flags in the address bar (&when / &force / &wx / &hush…) were NOT cleared, so after CLEAR ALL the link kept
  forcing the same time / event = "it doesn't do anything"; (2) an EVERYONE state on city2/live (still inside its `until`)
  took over the moment JUST ME was empty; (3) events already running (a forced moment, a legendary, PLAY ALL's last item)
  kept playing to their end. FIX: CLEAR ALL = truly the real city NOW: strip every preview flag from the URL
  (history.replaceState → ?city=2 + only non-preview params like &debug), stop every forced / in-flight event + PLAY ALL, the
  clock back to real time, the live weather back; if an EVERYONE state is active, say so on the button + offer to clear it
  too; the toast names what was cleared. A check: from a link with &when + &force + JUST ME changes, one CLEAR ALL leaves the
  real city (real clock, no forced events, live weather).
- **THE ROADMAP REORDERED** (the owner, Oct 26 6:01 pm — DECIDED): after the city's five (11a-2 THANKSGIVING → 9b WINTER →
  ATM → 10 PARTY NIGHTS → 11b CHRISTMAS + NYE): LOBBY 2.0 → BOARD 2.0 → PROGRESSION 2.0 → TV MODE → THEN the GAME LINEUP
  CHAT (onboarding, solo, daily puzzles, the new games) → the games → the release. FABLE REVIEWS + CLEANUP PASSES slotted in
  when needed (Claude's proposal: a Fable review + a cleanup after 11b — before Lobby 2.0 — and again after Progression
  2.0). Claude's caution (raised with the owner): Progression 2.0 designs streaks + achievements that the daily puzzles /
  solo games will need → a SHORT game-lineup TALK (no build) before Progression 2.0, so it isn't redone later.
- **THE PARTY YACHT = A HUGE MODERN SUPERYACHT** (the owner, Oct 26 6:07 pm — agreed, for Part 10): not a 1920s boat — the
  city already mixes eras (neon skyscrapers), so the joke lands: a sleek, HUGE modern motor superyacht (a billionaire's toy —
  dark hull, tiers of glass decks, a HELIPAD on the top deck) that DWARFS Rosie and makes the harbor look small; GENERIC +
  original (never a real person's or a real yacht's look, name or livery). ONLY AT SUNSET OR AT NIGHT: it glides in at
  golden hour / dusk, anchors offshore, lights up — deck strings, UNDERWATER lights glowing turquoise in the harbor, a
  laser or two on the top deck, party colours on the beat, the music's thump muffled across the water (yacht-party.mp3
  far) — the HELICOPTER comes in + LANDS on its helipad (the arriving VIP), later lifts off; the yacht slips away before
  dawn. A 3D model like Rosie. FREQUENCY — DECIDED (the owner, 6:10 pm: "he's home for the holidays"): ONE RANDOM PARTY
  NIGHT A MONTH (seeded) + GUARANTEED on the HOLIDAY PARTY NIGHTS — the WEDNESDAY BEFORE THANKSGIVING (the homecoming), the
  LAST SATURDAY BEFORE CHRISTMAS, NEW YEAR'S EVE, JULY 4th, and the Saturday of LABOR DAY weekend. Never two nights in a row.
  + FIREWORKS — DECIDED (the owner, 6:12 pm): EVERY party night ends at MIDNIGHT with a big NEON + LIGHT FINALE (every tower
  flashing together, the sky beams sweeping, the window party's peak) — NO fireworks on ordinary party nights; REAL
  FIREWORKS only on the YACHT's nights (launched from the yacht + a barge), NEW YEAR'S EVE, JULY 4th + the BIRTHDAY EVENT.
- **THE CITY SCHEDULE — A REVIEW** (Claude, Oct 26 ~6:20 pm, read from the code; there is NO single schedule document — the
  timing lives in harbor-workers / harbor-people / harbor-boats / harbor-moments / harbor-events / harbor-legend /
  harbor-wildlife / harbor-traffic). DEAD TIMES FOUND: (1) 02:00–06:00 EVERY DAY — ~0.3 people, no bus, no Rosie, the TV off
  at 3, the bar closed; only the hourly bell, the odd car, the coyote, rare legendaries; (2) DAYTIME WINDOWS ~09:30–16:00 —
  almost every window moment is night-only; (3) WEEKDAY EVENINGS AFTER 22:00 — ~2.3 people, ~1.3 after midnight; (4) no
  SUNDAY / church bells (church-bells.mp3 is in the folder), no weekend-morning life. PROPOSED (pending the owner): a
  generated SCHEDULE DOC (docs/harbor/schedule.md, built from the code's tables by a script + checked in a test).
- **FILLING THE DEAD TIMES — DECIDED** (the owner, Oct 26 6:23 pm): BUILD SOON — (1) THE NIGHT SHIFT: SPEAKEASY SECURITY /
  the boss's HENCHMEN patrolling the promenade in the small hours (2–6 am, + late weekday nights) with a LANTERN or a
  FLASHLIGHT (its beam + pool reading at 402), checking the door, the corner, the alley; WHEN THE COPS COME (the beat cop, the
  9 pm patrol, the raid) the henchmen SLIP INTO THE SPEAKEASY (a quick walk to the side door, a glance back); (2) the WATER
  WAGON washing the street — A LONG SHIFT (the owner, 6:28 pm): ~2:45 → ~3:30 am (~40–45 min, seeded) on weeknights + the
  mornings after a party (never after rain / below freezing): a 1920s street flusher on the BACK ROAD making several slow
  passes (fans of spray caught in the lamps), stopping to REFILL AT THE FIRE HYDRANT (a crewman with a wrench + a hose), a
  second man HOSING the promenade's cobbles while the truck idles, a break with a smoke on the running board, then off; the
  wet sheen drying over ~20–30 min; (3) SUNDAY MORNING CHURCH BELLS (far off, ~9–11 am) + a slower Sunday (Sunday best);
  THE HENCHMAN's ROUTE (6:25 pm): he PATROLS THE BLOCK — two loops, mixed + seeded: (a) THE FULL LAP: from BEHIND the
  speakeasy, up its side, along the FRONT past the doors, off the LEFT edge, a pause (round the block off screen), back again
  from behind — a lap every few minutes; (b) THE BEAT: up to the left edge, STOP, turn, look around, back to the building's
  back corner, STOP, turn… Unhurried, the lantern / flashlight swinging, a glance at the door or up the street; (4) WEEKDAY
  LATE NIGHTS livelier: strollers, couples LEAVING THE BAR (the side door, arm in arm, 10 pm → 1 am), the cop's patrol;
  (5) ONE DAYTIME WINDOW MOMENT NOW: SOMEONE READING THE NEWSPAPER at the window (a big unfolded paper, a page turned, a sip of
  coffee), late morning. LATER: more daytime window moments (a candlestick-phone call, a piano lesson, a maid at the sash,
  lunch at noon, a nap). METEORS are ALREADY PLANNED (6b section 0: rarer shooting stars + a rare FIREBALL) — confirm it
  shipped, else add. THE JOGGERS: today only 05:30–08:00 (weight 1.6) + a trace in the evening (0.25), rain ×0.3 — ADD a
  lunchtime + an after-work jog (12–13, 17–19) and a weekend-morning peak (8–10); never in heavy rain or storms.
- **THE STREET UNDER THE DOCK IS A STAGE** (the owner, Oct 26 6:30 pm — DECIDED): once the dock fades away (+ the lobby's
  waiting view in Lobby 2.0) USE THE FRONT STREET FREELY: the water wagon's passes, the henchman's patrol along the curb,
  cars + cabs + the bus pulling over, a newsboy, a delivery, puddles + snow + the plows later; NOTHING STARTS on it while the
  dock is shown; a scene ALREADY UNDER WAY when the user taps is NEVER cut, snapped, sped up or faded — the dock draws ON TOP
  and the scene CONTINUES underneath to its natural end (6:32 pm). + THE QUICK FADE (6:34 pm): a tap WHILE a front-street
  scene plays → the dock appears but fades away again within ~2 s (normal rest: 10 s) so they keep watching; ANY further
  touch on the dock (a button, a press-and-hold, a scroll) returns to the normal 10 s timer.
- **PROFILE PAGES FOR OTHER PLAYERS** (a reminder fired Oct 26 6:30 pm): tap someone's name (the lobby, the chat, the podium,
  THE BOARD) → their stats, rank + membership card; "sooner rather than later" → slotted into LOBBY 2.0 (tapping people,
  friends, invites, SOCIAL) with PROGRESSION 2.0's stats; or a small pass of its own sooner if the owner wants.
- **THE GIANT JACK-O'-LANTERN ON THE CENTREPIECE** (the owner, Oct 26 6:52 pm — DECIDED; built in 11a-2 Group 0): a GIANT
  glowing jack-o'-lantern on the promenade's centre circle — arrives in the build-up (~Oct 20: a huge uncarved pumpkin on a
  straw-bale plinth), CARVED ~Oct 28, LIT every night from then (a flickering candle glow, light spilling onto the cobbles +
  the people), Halloween night its brightest; gone Nov 1. Sized to read at 402 without blocking the crossing, the walk
  paths, the lobby line or the dock. THE HOURLY DANCE (party nights, incl. Halloween night) DANCES AROUND IT — a ring.
  Premium + 3D-looking (ribs, a stem, real carving depth, the inner glow), never clip-art.
- **THE LETTER-TAP RACE's HUM IS TOO LONG** (the owner, Oct 26 6:57 pm; built in 11a-2 Group 0): the hum follows the race: a
  short buzz-up (~0.3 s), a light crackle riding the race, FADES OUT as the race ends (≤ ~1.5 s), never a drone; repeated
  taps don't stack (one at a time, a cooldown); the same check for the music-on surge's sound + the dusk catch.
- **THE TR-3B ONLY ON PARTY NIGHTS** (the owner, Oct 26 7:06 pm — DECIDED; for a later pass): ONLY on a PARTY NIGHT (Fri /
  Sat), ~1–2 a month, during the PEAK (~22:00–00:30) — the whole lit-up party BLACKING OUT is the drama; the dancers freeze +
  look up, then the city stutters back + the party resumes. Never on the same night as the YACHT / fireworks / a raid / the
  UFO; never inside the midnight finale's minutes or the first minutes of an hourly dance; never two nights running. The UFO
  keeps its any-night schedule.
- **CITY SIGHTINGS — TAP A LEGENDARY TO "SPOT" IT** (the owner, Oct 26 7:08 pm — DECIDED in principle; PROGRESSION 2.0, the
  reactions built with each legendary): ONLY the LEGENDARY + truly rare things are tappable. A tap = (1) a REACTION (the
  TR-3B's circuitry races faster, the UFO wobbles, the periscope dives, the Mothman's eyes flare + he turns his head, the ghost
  ship's bell tolls…); (2) an ACHIEVEMENT ("SIGHTED: THE TR-3B") into a SIGHTINGS collection on the profile (the unseen ones
  as dark silhouettes / "???"), RARITY TIERS, each dated. Claude's notes: (a) SERVER-VERIFIED — the server re-computes the
  seeded schedule (the pure core modules shared with /api); a &force= / panel preview NEVER awards; (b) DISCOVERY: the
  first-ever legendary gives a faint pulse / a one-time hint; (c) a spoiler-free shareable card; (d) THE BOARD's "most
  sightings"; (e) a guest keeps sightings on the device until they make a profile.
- **CITY SIGHTINGS — THE RARITY TIERS** (the owner, Oct 26 7:10 pm — his colour ladder; Claude's categories, pending OK):
  COMMON = NEON GREEN (a few times a month: the raid, the surprise flyby, a balloon festival, the aurora); RARE = NEON BLUE
  (about monthly: the UFO, the TR-3B, the superyacht + its helicopter, a FIREBALL); EPIC = NEON PINK / PURPLE (a few a year
  or odd hours: the Mothman at 3 am, the ghost ship on Halloween night, the eyes in the haze, the periscope); LEGENDARY =
  SHIMMERING GOLD (once or twice a year: BIGFOOT, a real solar ECLIPSE, the rarest holiday legendaries). Each card in its
  tier's neon (gold with a slow shimmer + a sparkle), the tier on the toast, the collection sorted by tier; colours from the
  tokens (--green, --cyan, --magenta / --violet, + a new gold).
- **THE BLACKBIRD — A QUICK-TAP SIGHTING** (the owner, Oct 26 7:13 pm — agreed): an SR-71-style spy plane (the silhouette is
  fine; no real insignia / logos / display-team livery) SCREAMS across the sky HIGH above the NEON sign at ~3× the other jets'
  speed — a dark arrowhead, a thin contrail + the twin engines' glow, gone in ~1–1.5 s, a delayed SONIC BOOM. JULY 4th: ~5
  passes through the day (seeded) + RARELY on random clear days. THE SKILL SIGHTING: TAP IT while it's crossing (a hit box a
  little larger than the plane, no slow-motion help). Its own badge (EPIC or "QUICK DRAW"), a camera-flash sparkle on the tap.
  Server-verified like every sighting.
- **SP5 PHONE REVIEW** (the owner, Oct 26 9:13 pm; built in 11a-2 Group 0): THE SPIDERS ✔; THE DANCING ✔. (1) THE BOSS's
  SHADOW at the party: he WALKS UP to the shade (the shadow growing / sharpening), STANDS ~15 min (a weight shift, the cigar's
  ember on a draw, a slow turn of the head), WALKS AWAY (the shadow shrinking off), gone ~10 min, BACK ~15 min… for about
  1 h 45 min at the party's peak (9:24 pm), then done for the night; (2) THE VIOLET SPADE reads as a black TRIANGLE → BOLDER:
  a fatter spade with a clearly visible STEM / foot, sized to the pane, crisp edges; (3) THE BOSS's TV a little BRIGHTER + a
  LIGHTER, glowing blue (still the calm flicker); (4) WITHDRAWN (9:25 pm: "I was mistaken — keep how it normally is"): NO
  change to the normal-night room, no new check.
- **THE CASH COUNT + THE POKER-TABLE WINDOW — PARKED** (the owner, Oct 26 9:21 pm): dislikes the GREEN lamp + its glow and
  the "cheap poker table" window — "skip that guy for now". DON'T touch them in the next passes; revisit when he raises it
  (a note for then: a warm amber desk lamp; the poker-table room needs the act-big rework or a different scene).

## OWNER'S NOTES — OCT 27 (after 11a-2)
- BIG HOLIDAY PIECES CHANGE OFF-CAMERA (the owner, Oct 26 10:04 pm — DECIDED, a rule for EVERY holiday / event centrepiece +
  big set piece): no delivery / build / removal scenes — a big piece (the giant jack-o'-lantern, the harvest display, the
  Christmas tree, the snowman's stages, a parade's leftovers…) is simply THERE when the user loads in, and when its time
  is over it's simply GONE the next time they open the city — "taken care of when he's not on". IMPLEMENTATION: such a
  change (appear / disappear / the next build-up stage, e.g. the pumpkin carved) only applies at a LOAD or when the page
  comes back from the BACKGROUND (hidden → visible); if its moment passes while someone is watching, it waits until the
  next load / return (never pops in or out on screen). Exceptions stay as decided: the people's own moments (the crew
  stringing Christmas lights, the snowman being built by kids) are scenes on purpose.
- FOCUS: FINISH THE CITY, THEN THE GAMES (the owner, Oct 26 10:11 pm): he wants to finish City 2.0 RIGHT, stick to the
  roadmap, then build the games + open it to players; deep polish of scenes (the window moments, the holiday pieces'
  transitions, the cash count, the poker room…) comes AFTER launch. Claude's working rule from here: new ideas during the
  city passes go to a POLISH BACKLOG (after launch) by default unless they're a bug, a deadline (a holiday), or the owner
  says "now"; each remaining city pass stays in its lane.
- THE GIANT JACK-O'-LANTERN = A ₿ PUMPKIN, TWICE THE SIZE (the owner, Oct 26 10:22 pm — DECIDED): the centrepiece pumpkin
  ~2× bigger, CARVED WITH THE BITCOIN ₿ (a bold B with its two strokes above + below, cut clean through the rind — the carved
  edges showing the pale flesh + depth) instead of a face, LIT FROM INSIDE BY FIRE (a real flame's flicker: orange-gold
  light pulsing irregularly through the ₿ + the stem gap, a faint glow through the thinner rind, the light dancing on the
  cobbles + the people around it; a wisp of smoke from the stem now + then). Fits Oct 31 = the Bitcoin whitepaper's
  anniversary. Still clear of the crossing, the walk paths, the lobby line + the dock at 390 / 402 / 430 (shrink the hay
  plinth before the pumpkin if space is tight); the dance ring circles it on Halloween night.
- THE ABDUCTION UFO REDESIGNED (the owner, Oct 26 10:32–10:34 pm — DECIDED from Claude's three prototype stills, option C +
  A's dome): today's saucer reads CARTOONISH (the underside especially; the glass dome may stay). NEW: a heavy GUNMETAL saucer
  (real brushed / anodised metal — panel seams, a soft specular band, reflections of the city's lights + the moon on its
  upper hull, no flat colours, no outlines), a SMOKED glass dome (dark, a faint inner glow, one crisp highlight), a RING OF
  GLOWING SLOTS round the rim (blue-white, softly pulsing, the night's key light), and THE BELLY NEVER SEEN — lost in a strong
  soft glow that pours into the concentrated beam (no orange underbelly, no cartoon details); its light lands on the haze,
  the water, the rooftops + the promenade below. "Just got to look real, not cheap" — the reference is the FLOOR: three
  refine passes, zoomed + full screen at 402, night (+ fog). The abducted person stays as he is (the owner loved him).
  For the next pass that touches the legendaries (ATM or Part 10) — or sooner if the owner says "now".
  + THE RING + THE BEAM (the owner, 10:36 pm — Claude's recommendation): the rim slots RACE in a ring — lit sequentially,
  FAST, round the whole diameter, calm while it hovers, ACCELERATING as it lifts the person, a quick flash of all of them
  when he's taken, slowing as it leaves; the slots cool WHITE / ice-cyan (NOT red: red = the towers' beacons, the TR-3B's
  orb, the Mothman's + the haze-room's eyes); THE BEAM a pale GREEN tint (the classic tractor beam, unlike any other light
  in the city — violet is the boss's spade), soft-edged, dust motes drifting up in it.
  !! HARD RULE (the owner, 10:39 pm — "very important"): THE ABDUCTION SCENE ITSELF STAYS EXACTLY THE SAME — the person's
  lift animation + pose untouched (limp, arched backwards, pulled up like a puppet, arms draped down, head tilted back —
  the classic abduction pose), its timing + path unchanged; ONLY the UFO's look + the beam's look change. Prove it: the
  person's rig / keyframes / timing files untouched in the diff + a before / after frame burst of the lift side by side.
- THE WITCH IS CHOPPY (the owner, Oct 26 10:59 pm, on his phone, seen live flying across): "very, very choppy" — sent as an ADD-ON to
  11a-2 (Oct 26 11:12 pm), to fix before Halloween; check it in 11a-2's summary. Likely cause from the code (check, don't assume): witch.js#drawFigure
  re-creates its TWO offscreen canvases whenever her size in pixels changes (`fig.width !== px`, px from W.size, which grows/shrinks
  as she nears/leaves) — i.e. nearly every frame, plus a full repaint of both — so garbage-collection hitches. Fix: allocate once at
  her largest size (or in a few size steps) and scale the blit; measure frame times while she flies (&debug=1) on the phone tier
  before + after; check the sparks too. Preview: &force=witch.
- THREE NEW ROOF-SIGN MODES (the owner, Oct 26 11:20 pm — DECIDED, "I like all your suggestions"; NOT an add-on to 11a-2 —
  goes in SP6, the pass before 9b): added to core/harbor-roofmodes.js's hourly draw next to SPELL / RACE / BREATH, same rules (seeded per
  sign per hour, neighbours never the same, one big move at a time, off on party nights / tier 0 / reduced motion): WORD FLASH (the 1920s drum
  flasher: word by word — NEON… PAR… NEON PAR — then held lit; a one-word sign alternates the word and its icon / border), LAYERS
  (built in stages: the border → the letters → the accent / icon → held), TWO-TONE (the flasher swaps two parts' colours — border
  and letters trade a couple of times, then settle; never on a sign that has tonight's everyday colour-cycle). Skipped on purpose: a
  continuous border chase (too close to RACE; continuous chasing stays the party show's), sparkle (reads as noise on a phone), more
  failing tubes. Previews &force=roof-wordflash / roof-layers / roof-twotone.
- PRISM DROP DAY + NIGHT (the owner, Oct 26 11:20 pm — to discuss, for the games phase; "when applicable" the same for other
  games): DAY = chill + peaceful: soft, warm colours, calm "Japanese zen" keyboard music without a beat · NIGHT = the party skin: the
  neon, upbeat music on the beat. Switches morning → golden hour = DAY, golden hour on = NIGHT. A room setting, the host chooses:
  AUTO (default) / DAY / NIGHT (to play one outside his time of day).
  THE LOOK (the owner, Oct 26 11:26 pm — to decide at the review): it doesn't have to be the tube engine or glow; what he wants is the
  city's night neon QUALITY — bright, HD / 4K-crisp outlines — on the pieces' edges ("if I could get that outlined in these bricks,
  that would be awesome"). Points to settle then: crisp lit edges + solid readable cores (not glow bleeding between cells); the
  sharpness at the phone's full resolution; staying readable at full speed. Also to settle: whose time decides day (suggested: the
  host's, by the city's real sun), the mode locked for a whole match, day SFX in key but free-timed (no beat to lock to), same rules
  in both skins (Score Rush suggested by day, not forced), the day palette tested for telling pieces apart at speed, the switch built
  once in the match kit for every game. The day songs: the owner gets them from Grok later (not now) — give him the Grok prompt
  before the pass that needs them.
- THE WATER TOO STILL (the owner, Oct 26 11:47 pm — to fix, slot: ATM, the Fable atmosphere pass, which owns the wind): "too still
  and flat … seems like a mirror". Why (water.js / docs/harbor.md#the-water): roughness is 0 under ~1.2 m/s of real wind — a glassy
  mirror on a calm night. A real harbor is never glass: give it a FLOOR of motion (a minimum roughness at any wind, so the
  reflections always break into bands), a slow long SWELL under the ripples (a gentle rise + fall rolling toward us, a few seconds a
  wave), the wavelets always sliding; the wind still adds the chop on top. Contained in water.js (the hooks — reflect / light /
  wake — ride the same distortion); measure the cost (title-perf --ab) + compare &wind=0 / 3 / 8 at 390 / 402 / 430.
- THE BLUE TV WINDOW READS DULL GREY (the owner, Oct 26 11:56 pm — slot: SP6 (the fixes before winter); "you almost nailed it the very first time. It's got
  to be more blue … I'm going to be picky at it, but we're going to get there"). Why (windows.js, read-only): the FIRST version (7b)
  filled the whole pane with the set's light — the glass itself glowed a deep, saturated blue; WIN rebuilt it as a dark room lit from
  below (the couch, the curtain), so most of the pane became dim grey furniture with the blue only as a spill; and 11a-2's "lighter"
  blue ([64,108,255]–[128,162,255] → [96,148,255]–[168,202,255]) added WHITE, which reads paler + greyer, not bluer. THE FIX: keep
  the room, but (1) the colour DEEP + SATURATED, brighter without whitening (≈ [40,90,255]–[80,140,255]; never a pale periwinkle),
  (2) the WHOLE pane washed with that blue (strongest low-centre where the set is, the glass + the ceiling + the curtain's inner edge
  catching it) and the room's shapes DARK silhouettes against it, not grey-lit, (3) the spill on the brick + the cobbles the same
  blue. Judge it on the phone at night, as-is, next to the warm windows: it must read "a TV is on in there" from across the street.
  Compare with the 7b look (git show of the first windows.js) at 390 / 402 / 430, three refine passes.
  THE COLOURS PICKED (the owner, Oct 27 12:01 am, from a 15-swatch mock-up — the mock-up chose the COLOURS only; the fix above
  stands): the set's light flicks between scenes like channels/shots — mostly B (deep royal [40,90,255]→[20,45,170]), A (the first
  look [64,108,255]→[40,70,200]), H (royal with the ceiling catching it [45,95,255]) and N (sapphire [20,60,255]→[10,30,160]); F
  (violet-blue [85,85,255]) now + then, briefly; a brief WARM scene (amber [255,190,110]) on the odd change ("that warm tone looks
  good"); it SETTLES on the blue (B). The rhythm stays irregular + mostly calm (SP5's nudge): a change every ~3–8 s, never a
  metronome, long steady stretches between.
  THE LAYOUT (the owner, Oct 27 12:29 am — DECIDED, "let's try it"): still NO PERSON, ever; but the room gets a few DARK shapes for the
  light to show off (today it is only the walls, the ceiling + the curtain — part of why it reads flat grey): an EMPTY COUCH's back low
  across the window (a thin blue rim along its top: whoever watches may be lying down below it — the mystery kept), a floor lamp (off,
  a silhouette) at one side, a picture frame on the back wall catching a little light, the half-drawn curtain kept (its inner edge
  blue), the rare shadow across the glow kept. The light stays from the unseen set BELOW THE SILL AT THE FRONT RIGHT (not the mock-up's
  low centre): every shape with a lit side + a dark side.
- THE UFO FROM A REAL MODEL (the owner, Oct 27 12:29 am — slot: SP6 (the fixes before winter); replaces the hand-drawn saucer, which stays as &ufo=classic):
  "UFO" by sebslom (Sketchfab, CC BY 4.0, ~8k tris, 2K PBR + an emissive map; ufo-01-sebslom.glb, ~15 MB, in
  ~/Downloads/city-models/ufo/ with credits.txt). The builder COPIES it into the repo as a SOURCE file outside the served site
  (art/models/ufo/ufo-sebslom.glb + credits.txt; .vercelignore'd — never shipped, never loaded by a phone) and BAKES SPRITES offline
  with a script (three.js in the Playwright that's already installed — scripts/bake-ufo.mjs; the browser never sees three.js): a
  turntable of yaw frames (24) at the city camera's real view angles (from below / three-quarter, read from harbor-layout.js), at 3×
  the largest on-screen width, transparent WebP/PNG, in separate layers — the BODY (lit for night: the city's moon + neon as rim
  light), the LIGHTS from the emissive map as their own white layer (the code tints + animates them: the racing white/cyan ring, the
  glowing belly), a DOME mask. THE LOOK (the owner, Oct 27 12:31 am — CHANGED: "the model looks gorgeous … just
  replicate the model"): the MODEL'S OWN look, faithfully — its worn dark steel + panel seams, its GREEN port lights round the rim,
  its glossy bluish dome — no recolour; lit as a NIGHT scene (the city's moon + neon as the light, not the viewer's studio light)
  but true to its materials. The lights still animate in code, in the model's green (the earlier white/cyan racing ring dropped); the
  pale green beam (now matching) + the abduction pose untouched. Bob, tilt, the beam = code, not frames. Judge at 60–120 pt on the phone
  next to the classic. THE CREDIT (CC BY needs it on the site): a CREDITS section (the menu's HOW TO PLAY / settings area, with the
  city sounds' credits) + art/models/ufo/credits.txt. Backups if it fails at phone size: "UFO Doodle" by re1monsen (CC BY 4.0) ·
  BlackHawk0512's saucer (Sketchfab Standard: commercial OK, no credit needed, renders only — never the raw model on the site).
- AFTER 11a-2 (Oct 27): GitHub refused the cloud runs (BILLING: a failed payment / the spending limit) — the owner fixes it, then
  `gh workflow run harbor` once (counts as 11a-2's run). Into SP6's list: THE MILK VAN's lettering reads MIRRORED ("YRIAD ROBAH", older
  than 11a-2) · the pies + shopping bags too small at phone size (ACT BIG) · the chimney smoke near-invisible against a bright pink sky ·
  the parade's +5.4 ms a frame (the crowd's figures; check &debug=1 on the phone at the peak). The hand-drawn UFO redraw is superseded
  by the real model (SP6); 11a-2's lighter TV blue is superseded by THE BLUE TV WINDOW notes (SP6).
- CLOUD MINUTES (the owner, Oct 27 7:20 am — upgraded GitHub to PRO: 3,000 Actions minutes a month; Free's 2,000 ran out Oct 26
  ~11:50 pm, which is what blocked 11a-2's runs — not a card). The pace Oct 24–26 was ~400–600 min a DAY (the quick `tests` on
  EVERY push + the harbor jobs) = Pro's month in about a week. A CHORE at the START of SP6: (1) `tests` runs only on a pass's final
  push (the [harbor] tag) + by hand (workflow_dispatch) — the laptop runs the unit suite before every push anyway; (2) a concurrency
  group with cancel-in-progress on both workflows (a newer push stops the older run); (3) the owner may set a $5–10 Actions budget as a
  cushion. Goal: ~30–40 cloud minutes a pass. CLAUDE.md's testing section updated to match.
- 11a-2 REVIEW, the owner's phone (Oct 27 7:23 am on): the violet SPADE "looks great"; the boss's SHADOW at the party "good" — keep
  both. THE BOSS's WINDOW BEFORE 10 PM ON A PARTY NIGHT reads as a flat blank YELLOW pane (the shade lit by the lamp until the TV comes
  on at 22:00 — as built, but cheap among the dancing windows). DECIDED for SP6 (Oct 27 7:27 am, "your suggestions for the boss sound great"): the TV on from the party's start
  (the one cool-blue window all party night) + the shade drawn as a real shade whenever it's lit (cloth, the hem, a soft hot spot
  where the light is, darker edges — never a flat fill; normal nights' lamp-lit evenings too).
- THE HOLIDAYS: BUILD NOW, POLISH LATER (the owner, Oct 27 7:45 am — DECIDED): Thanksgiving "looks all right"; for now each holiday is
  BUILT, checked that it crashes nothing, and we push forward. A HOLIDAY POLISH PASS comes AFTER CITY 2.0 IS COMPLETE (the owner, Oct 27
  8:13 am: "the Thanksgiving holiday stuff needs polishing but only after City 2.0 is complete"): every holiday (Halloween,
  Thanksgiving + the parade, Christmas, NYE, …) refined together then.
- THE UFO BEAM's HORIZONTAL LINES (the owner, Oct 27 8:05 am, a phone screenshot — a BUG for SP6): thin evenly spaced horizontal
  lines run across the beam AND the wash round it (past the beam's edges) — looks like strip/row seams (a light drawn in horizontal
  bands with fractional heights, or a low-res bake scaled up), not a design. Find the source (legends.js: beamSprite + the live wash /
  dust / the ground light), fix it so the beam is one smooth soft cone; check on the phone at DPR 3. The beam stays code when the
  saucer becomes the real model, so it must be right either way. ALSO seen: the abduction spot is the compass, where the holiday
  CENTREPIECE stands (Oct: the giant ₿ pumpkin) — the person rose from INSIDE the pumpkin. When a centrepiece is up, the abduction
  takes someone beside it (or the craft picks a spot clear of it).

## OWNER'S NOTES — OCT 27 (after SP6)

- THE SAX SCENE NEEDS A TOTAL REWORK (the owner, Oct 27 9:09 am: "comically cheap"). Today (harbor-moments.js 'sax' + windows.js
  saxPlayer): the JAZZ room behind an amber shade three-quarters down, the sax player as a soft SHADOW on the shade swaying all night,
  THE SOLO (20:00–02:00, uncommon, 15 s) = the shadow leaning back hard. Direction to discuss (Claude): drop the shadow puppet — the
  room's shade UP like the other lit rooms, a real LIT musician in the 2.5D room (the window people's kit, lit warm by the room's lamp,
  the BRASS BELL catching the light as the one bright accent), a playing posture that reads by SILHOUETTE alone (the horn's angle,
  the lean); the sway on THE CITY'S BEAT when music is on (the dance clock exists); the SOLO = he steps forward to the glass, leans
  back, the bell up. THE OWNER (9:16 am, "as ALWAYS, it has to be readable for the phone. I hate that I have to keep repeating
  that"): judged UNZOOMED on the iPhone — the window is ~40 pt wide, so NO fingers, no breathing, no background band: ONE big lit
  figure + the gold bell + the motion; anything that can't be seen at that size is not built. Slot: TO DECIDE (polish, not a bug) — options: hide
  the sax moment now until the rework, or rework it in 9b.
- A STANDING RULE FOR EVERY PASS (the owner, Oct 27 9:18 am — "add that requirement"): WINDOW SCENES + PEOPLE (and everything
  else) must READ ON THE PHONE AS-IS, UNZOOMED. Before building a detail, check it against its real size on the iPhone; a detail
  that can't be seen there (fingers, a figure in the dark behind, small props) is NOT built — make it bigger, bolder, a clear
  silhouette + one bright accent, or drop it. Put this in CLAUDE.md's ground rules (the visual review) in the next pass.
- THE REPO GOES PUBLIC WHILE WE BUILD (the owner, Oct 27 10:17 am — DECIDED): public now (GitHub Actions minutes free + unlimited on a
  public repo; private burned Free's 2,000 + would burn Pro's 3,000 in about a week). REMIND HIM: GO PRIVATE BEFORE any anti-cheat /
  leaderboard work (Board 2.0, Progression 2.0, anything touching /api's result checks or THE BOARD) — Claude says so BEFORE writing
  the first of those prompts, and that prompt's "Read first" starts with a check that the repo is private (`gh repo view --json
  visibility`). Know: going private later doesn't take back copies made while public; never commit a secret (the scan Oct 27 found
  none: the service-account key + the pepper live in Vercel's env).
- AFTER SP6 (Oct 27 ~10:20 am): THE UFO BAKE = a short task of its own once the owner has put ufo-01-sebslom.glb +
  credits.txt in ~/Downloads/city-models/ufo/ (the CREDITS sheet gets its line) — see SP6 PHONE REVIEW below. The cloud's known issues are piling up (`show`'s half-time beat check,
  `city`'s two panel/perf timeouts, the spider tap now + then): the next FABLE REVIEW + CLEANUP fixes or retires each one. WHEN HE'S BACK AT THE LAPTOP (no pass running),
  the owner runs THE EMAIL REWRITE (every commit → 288292705+Loewfizzle@users.noreply.github.com) and THEN makes the repo public.
- SP6 PHONE REVIEW (the owner, Oct 27 10:27 am, on the road): "Everything else looks good" — ONE BUG: the CREDITS sheet doesn't open
  when CREDITS is tapped in the ☰ menu (top left, the title) → 9b Group 0. THE REPO STUFF (the email rewrite, then public, + the UFO
  .glb download) waits until he's back at the laptop this afternoon (a reminder is set for 3 pm) — so THE UFO BAKE is a short task
  after that, NOT in 9b. 9b SPLIT (Claude: winter + the tower + the city life is ~6 h): 9b = WINTER (+ the climate-aware fallback,
  which the snow depends on); 9c = THE CONSTRUCTION TOWER + THE CITY LIFE (the night-shift henchman, the water wagon, Sunday bells,
  weekday late nights, the newspaper window, the joggers, the street under the dock as a stage + the quick fade, the TR-3B
  party-only rule) + THE SAX REWORK (the owner didn't ask to hide it meanwhile → it stays until 9c).

## OWNER'S NOTES — OCT 27 (after 9b + the UFO bake)
- 9b PHONE REVIEW (the owner, Oct 27 12:35 pm, a screenshot): "Snow looks really good, kind of in general"; THE SNOWFALL "looks
  great". TO REWORK (9c Group 0 — winter is close): (1) THE WORN FOOTPATHS (snow=older) — "you can't really tell what that is": make
  them read at phone size as trodden lanes: wide, clearly darker grey-brown slushy strips with soft edges along the real walking
  routes (the crossing → the door, along the railing, round the compass), the cobbles' dark showing through in the middle, the
  people walking ON them; strong contrast against the white. (2) THE PLOWED BANKS — "can't really understand what that is either":
  BIG mounds (knee-to-waist on the people) along the kerb, dirty grey-brown sides with darker grit streaks, a whiter crust on top, a
  clear BLACK wet cleared road beside them, gaps at the crossing + the bus stop; read as "the plow piled this". (3) THE SNOW ON THE
  SIGN MUST GLOW (the screenshot: the lit N's pillow of snow is pure flat white): snow on a LIT tube is lit FROM WITHIN by it — the
  tube's own colour (pink on the pink letters, each letter its own) strongest where the snow touches the tube, bleeding up + out
  through the mound, a soft halo round it at night; by day the glow fainter but there; an unlit tube's snow stays white (+ the day
  sky's light). The same on the roof signs + the billboards. Judged on the phone, unzoomed.
  (4) THE PLOW + THE SALT TRUCK DIDN'T SHOW (the owner's iPhone, 12:36 pm, &force=plow / &force=salt): a preview must start AT THE
  BEGINNING within a couple of seconds (the rule) — find why it didn't (waiting for the dock to rest? a traffic hold? the slot's
  schedule? iOS?), make &force=plow bring the plow on the waterside road in ≤ 3 s with the salt truck right behind, + a PLAY ALL
  item; and check they really run on real snow days (a unit test: after a real snowfall the plow + salt are scheduled that day).
  (5) THE SHOVELLERS (the owner, 12:37 pm): THE DOORMAN's shovelling "looks a little cheap — needs to look more premium"; THE
  PROMENADE SHOVELLER must MOVE "back and forth like he's actually shovelling". Read on the phone by BIG motion + silhouette: the
  stroke cycle (plant, PUSH the blade forward along the ground, lift, a body twist, TOSS to the side with a visible spray / clump of
  snow arcing onto a growing pile), stepping forward between strokes, the CLEARED dark strip growing behind him; the shovel big +
  readable (the blade catching the light); the doorman in his proper uniform (long coat, cap) clearing the steps ONE BY ONE, then a
  wide arc of salt tossed across them. Lit by the scene like the window people (WINDOW_LOOKS), never flat.
  APPROVED (12:39 pm): the SNOWBALL FIGHT "looks perfect"; the SNOWMAN being built "looks good"; the CREDITS sheet "works perfectly".
  (6) THE SNOWMAN's ARMS: in some shots they look like SNOW arms, in others STICKS — always STICKS (dark twig arms with a fork or two),
  at every stage once the arms are on; no white blob that reads as an arm (check every stage's shot). (7) THE FROST on the dock + the
  buttons "looks good" — but let it FEATHER further IN toward the centre of each button + the dock, getting FINER + fainter as it
  goes so it's hardly noticeable at the centre (heavier at the edges, a fine fern-like lace thinning to almost nothing); labels,
  icons, contrast + taps untouched.
  (7b) THE OWNER PREFERS CITY 1.0's FROST (1:58 pm: "I like that look better I think"). City 1.0 (js/screens/district/frost.js#pane):
  a FROZEN-WINDOW PANE over the WHOLE SCREEN on a real deep freeze (−4 °C → full by −12 °C): a frosted haze thickest in the corners +
  along the bottom, ~2,600 fine rime grains crowded to the edges, and FERN-LIKE DENDRITES (a stem, twigs at ±60°, feathered again)
  grown inward from the corners + edges, thick at the rim and GONE well before the sign + the buttons; it forms slowly as the cold
  arrives; baked once per screen size. City 1.0 had NO frost on the dock / buttons themselves. → 9c: bring that PANE to City 2.0 as
  the cold look (the same rule: never over the sign, the hush word or the dock's labels; the dock + the buttons sit inside the clear
  area or catch only its finest edge), and restyle the dock + button frost in the SAME fern-dendrite language (finer + fainter toward
  the centre, per (7)) — or drop the button frost if the pane reads better without it. Show both on the phone; the owner picks. DECIDED (1:59 pm, "yeah let's try it").
- A BLIZZARD MODE (the owner, Oct 27 1:00 pm — DECIDED, slot: ATM): none today (weather.js has snow 0..1 + the wind apart). The city goes
  BLIZZARD when the live weather says heavy snow + strong wind (sustained ~15 m/s / 35 mph, or gusts) or low visibility (Open-Meteo's
  visibility < ~400 m with snow): a WHITEOUT with depth (the far skyline gone first, then the mid towers; the near stage + the neon
  cutting through as soft glowing smears), snow DRIVING SIDEWAYS in gusting waves, GROUND SNOW BLOWING (streamers racing across the
  promenade, drifts against the speakeasy, the bench, the lamps), few people out, leaning into it, heads down, holding hats, the bus
  crawling with its lamps glowing, the wind's roar under the snow hush. Judged on the phone. &force=blizzard + a panel row.
- THE SPEAKEASY's BLADE LOOKS BLURRY (the owner, Oct 27 4:38 pm, a phone screenshot by day: DOUBLE AGENT soft next to the crisp
  city). Likely why (read-only): the city canvases are capped at DPR 2 (speakeasy.js: dpr = min(2, …); scene.js TIERS max 2) on an
  iPhone's DPR 3 → every canvas sign is upscaled 1.5×; the bake's memory budget can step big layers down to 1.5 / 1 (bake.js#plan);
  a tier step lowers it again. The NEON logo is SVG / DOM, so it's always sharp — the contrast shows. FIX (9c Group 0): measure first
  (&debug=1: the tier, the layer's dpr), then draw the BLADE (day + night) as its own small FULL-DPR (3×) overlay like the hush sign
  (WIN moved it to a 3× overlay for the same reason), its letters + frame + bulbs crisp; check the other near signs the eye reads up
  close (the barbershop's sign, the EST. 1924 plaque, the roof billboards on the speakeasy) and give them the same if they're soft.
  Judged unzoomed on the iPhone, day + night, against the logo.
  WIDENED (the owner, 4:39 pm: "do that with the other billboard too on top of the speakeasy … and all other important things"):
  ONE SHARED "CRISP TEXT" LAYER at the phone's full DPR for EVERYTHING WITH LETTERING the eye reads: the speakeasy's BLADE + its ROOF
  BILLBOARD (today's game, e.g. RUMRUNNER / OVERCLOCK), the barbershop sign, the EST. 1924 plaque, the WAIT / WALK signal, the skyline's
  word signs (HIGH STAKES, NEON PAR, PULSE + the vertical blades — BLUFF, OVERCLOCK…), the sale / holiday banners, the banner plane's
  text; the vehicles' lettering (TAXI, POLICE, DAIRY) if it's cheap enough while they move. NOT the bricks, people, trees or textures
  (softness there is fine + saves memory). Tier-aware (tier 0 may stay at 2×), inside the iOS memory budget, measured (title-perf --ab);
  the sharpness gain shown in before / after crops at 3×.
  DECIDED (4:41 pm): lettering — NOT the speakeasy's windows (live-drawn every frame, the cost isn't worth it), people, vehicles' bodies.
  + THE HOLIDAY SET PIECES (4:42 pm, the owner): the big pieces that stand still + are drawn ONCE (the giant ₿ pumpkin, the harvest
  display, the big jack-o'-lanterns, the tree stand, the Christmas tree + its lights, wreaths, the snowman, the sign's dressings) are
  built at the phone's full DPR too, through the same shared crisp layer (their live twinkle / flicker stays a light layer on top);
  inside the memory budget, measured. NOTE: sharpness helps their edges, but "hard to see" is mostly SIZE + contrast — any that are
  still hard to read get bigger / bolder too (the phone rule).
- HEAVY SNOW + WIND STILL BROKEN (the owner, Oct 27 4:46 pm, testing on the panel: heavy snow + WINDY): "it just makes the clouds go
  crazy fast and nothing really happens in the foreground" — the same bug as Oct 26 (the clouds race, the foreground ignores the
  wind). FOR ATM (confirmed in its scope: WIND AS ONE SYSTEM): the wind drives EVERYTHING together — the snow's slant + gusting waves,
  the trees' crowns + branches swaying (the snow shaken off them), flags, smoke, coats + hats, the water's chop, drifting ground snow —
  and the clouds move at a believable speed for their height, never racing. HEAVY SNOW reads in LAYERS OF DEPTH: big near flakes
  crossing the promenade, a mid layer, a far veil softening the skyline (the blizzard's whiteout is the extreme of this). Test the
  combinations on the panel (heavy snow + windy, rain + windy, a gale) on the phone.
- THE CENTREPIECE NEEDS SHOW LIGHTING (the owner, Oct 27 4:49 pm, a night screenshot: the uncarved giant pumpkin on the compass sits
  DARK, brown on brown — "it's being shown off, so it should be well lit … it can be dark when the jack-o'-lantern's lit"). DECIDED
  for 9c (the centrepiece rig, core/harbor-centre.js — reusable for every centrepiece): at night a piece on the compass is
  FLOODLIT — a pair of warm 1920s floodlights (on the two nearest lamp posts or low on the inlay's rim) washing it from the front
  sides, a bright pool on the cobbles round it, a soft shadow behind, a rim of light on its top + edges; the floods come on with the
  lamps at dusk. When the piece LIGHTS ITSELF (the ₿ carved + its candle lit, the Christmas tree's lights, a lit display) the floods
  DIM DOWN slowly so its own glow is the star (kept at a low fill so its shape still reads). By day no floods. Read on the phone, as-is:
  the piece must be the brightest, clearest thing on the promenade at night.
- THE SIGN's SNOW IGNORES THE BLACKOUT (the owner, Oct 27 4:51 pm, a screenshot of the TR-3B's blackout: the tubes dark, the snow
  on them still bright white, floating) — the same bug 9a had with the rain (fixed there: the rain follows the sign's power). 9c Group
  0: the sign's snow follows the POWER + the light: in the blackout it goes DARK with the city (it's still there — lit only by the moon
  / the night sky: a faint cool grey, no pink glow), and when the power comes back its light (+ the tubes' pink glow from within) comes
  back WITH the tubes' flicker-on. The same for the icicles, the drops, the frost glaze, and the roof signs' + billboards' snow. A
  check in the e2e (the blackout: the snow's brightness drops with the tubes).
- THE BOSS's DAY SHADE READS "A WEIRD DARK BROWN" (the owner, Oct 27 5:06 pm). On purpose (SP5: "a dull olive cloth, dark against the
  sunlit facade, the daylight only on its top edge" — so his window reads CLOSED among the open ones), but the colour reads as mud.
  Claude's proposal (pending the owner): a real 1920s HOLLAND roller blind — either (A) deep BOTTLE-GREEN linen (period, still dark +
  mysterious, clearly a blind, not a stain) or (B) cream / ecru linen lit by the daylight from outside (the commonest blind of the era,
  reads "drawn" by its flat even glow + the pull ring), with the cloth's soft vertical sheen, a faint sag + the hem bar; the violet
  signal + the spade unchanged. Slot: 9c.
  THE OTHER WINDOWS (read 5:07 pm): by day the rooms are OPEN (a dark room, the people lit by the daylight); the bar's afternoon a
  half-drawn shade; the EDGE windows' roller blinds are a warm CREAM / TAN linen ([236,214,176] → [176,146,84]). → Claude's revised pick:
  (B) the boss's blind in THE SAME cream / tan linen as the building's other blinds (one building, one kind of blind) — fully down all
  day, evenly lit by the sun from outside, so his window reads CLOSED by being the only one fully drawn; the violet lamp + the spade
  glow THROUGH pale cloth far better than through a dark one. DECIDED (5:10 pm, "that sounds good").
- WINDOW SCENES NEVER POP IN (the owner, Oct 27 5:10 pm — a RULE for every window moment, 9c): a scene starts in one of two ways
  only — (1) the people WALK UP through the room's depth to the glass, then the scene plays (WIN2's walkIn), or (2) the BLIND comes
  DOWN, a ~2 s pause, the blind goes UP and the scene is there; it ENDS the same way (walk away / blind down + up on the empty room).
  Never a cut / jerk into or out of a scene. Audit every moment in the catalogue (+ the holiday scenes, the tango, the cash count, the
  party's rooms) and add a unit / e2e check that no window's content changes between two frames without a walk or a blind.
- THE UFO FROM THE REAL MODEL — APPROVED with two fixes (the owner, 5:10 pm: "the new UFO looks good"), 9c: (1) IT HOVERS HIGHER ON THE SCREEN —
  the owner (5:12 pm): NOT further away / at the wheel's depth — it stays CLOSE (over the promenade, its size as now) but sits HIGHER
  on screen, so the whole craft is in clear sky ABOVE the wheel's top (it got confused with it / blocked it); the BEAM simply gets
  longer to reach the person (the abduction's pose + timing unchanged). Check its hover spot at 390 / 402 / 430 against the wheel, the
  towers + the sign. (2) THE ARRIVAL + THE DEPARTURE STUTTER (skipped frames while it flies to the spot + away): measure first
  (&debug=1 slow frames during the flight); suspects: the sprite sheet DECODED on its first draw (pre-decode with createImageBitmap
  before it appears), the 24-frame turntable STEPPING visibly (blend between neighbouring frames or use more frames), a per-frame
  allocation, the beam / glow re-baked as it moves. Smooth 60 fps on the phone tier is the bar.
  FROM THE BAKE's SUMMARY (5:11 pm): the sprites are drawn from TWO view angles (~6° hovering, ~19° in + out) "each stretched slightly
  to the true angle in between" + an approach where the craft "looked half-transparent while switching between the two angles" →
  the ANGLE SWITCH during the arrival + departure is the prime suspect for the skip: bake more angles (e.g. every ~2–3°) or crossfade
  over a longer stretch, so the flight is one continuous change. Also: a forced preview on a slow link shows nothing for up to 4 s —
  pre-load the sheet when the preview is asked for.

## OWNER'S NOTES — OCT 27 (after 9c + the hotfix)
- HIGH THIN CLOUDS READ AS A DREARY GREY DAY (the owner, Oct 27 5:50 pm, a screenshot of the live Grand Rapids sky — real sky: "high,
  spread-out thin clouds, but you can see blue through them"; the city: a flat grey-mauve overcast, the whole scene dull) — FOR ATM.
  The sky must follow the cloud LAYERS (Open-Meteo's cloud_cover_low / _mid / _high, which the weather already reads): HIGH thin cloud
  (cirrus / cirrostratus) = a bright VEIL with BLUE showing through in breaks + streaks, the sun softened but still casting light,
  the city's colours + shadows near a clear day; only thick LOW / MID cloud (stratus, nimbostratus, a real overcast) greys the scene.
  Mixed skies (blue gaps between cloud banks, broken altocumulus) look mixed. Compare the live sky to the real one on the owner's phone.
- THE RED BEACONS ON AT SUNSET (the owner, Oct 27 6:28 pm — DECIDED, slot 9d): real obstruction lights switch on by a light sensor as
  the daylight drops — around SUNSET. Today (lights.js#drawBeacons) the red pulse follows the night input, landing closer to the blue
  hour. → the red beacons fade on AT SUNSET (a photocell's soft ramp over a minute or two), so they blink through the last of golden
  hour into dusk; on a dark overcast evening they come on earlier (the real light level — harbor-dark's darkness input); the white
  strobe on the tallest by day hands over to the red at the same moment; off again at sunrise the same way.
- THE DOORS STILL SNAP SHUT (the owner, Oct 27 6:59 pm: when people go in + out of the speakeasy "it still just kind of snaps at the
  end … not smooth. Since that happens so much, we really need to get that right") — slot 9d, Group 0, measured first. Read-only
  facts: the swing is core/harbor-people.js#doorOpenK (open 0.8 s, close 0.9 s, a smoothstep) — smooth on paper, so the snap is likely
  ELSEWHERE: (1) THE HAND-OFF at the end — the live leaf (doors.js) drawn only while k > 0, then the BAKED closed door takes over: if the
  baked door's light, shade, pane or position differs at all from the live leaf at k ≈ 0, it pops (pixdiff the last live frame vs the
  first baked one); (2) the doorway's light SPILL / the amber passage cut off at once instead of fading with the swing; (3) several walkers
  or groups (doors[...] = max of their curves, lag per member) restarting / dropping the curve between people; (4) the planner or a 30 fps
  path stepping the leaf. FIX: one continuous swing every time — a real door closer's motion (it swings shut, SLOWS for the last few
  degrees, a soft latch with the faintest settle), the spill fading with the gap, the live leaf identical to the baked door at the end
  (or the live leaf kept until it's pixel-equal); a check that the door's pixels never jump between two frames. Judged on the phone
  with &force=doors, side door + shop door, day + night.
- THE DOOR's FLOODLIGHT LOOKS CHEAP (the owner, Oct 27 7:50 pm: "too weak at first, now it might be too bright … all the other lights
  look so realistic, but in the foreground, where it's the most important, it looks the most cheap") — slot 9d. WHY (read-only):
  speakeasy.js#flood (POL4) is ONE ADDITIVE ELLIPTICAL GRADIENT pasted over the door ('lighter', DOOR_FLOOD k 0.42) — it adds orange haze
  on top of everything (the mortar, the dark recess, the door alike) instead of LIGHTING the surfaces, so it can only be "a weak blob" or
  "a washed-out blob"; that's why tuning its strength never fixes it. FIX: light it like the rest of the city — (1) the light MODULATES the
  surfaces it hits (the brick lit as brick: the faces brighter + warmer, the mortar + recesses staying dark — a lit copy of the wall /
  door / steps blended in by the lamp's falloff, the same model as core/harbor-light.js's pools), (2) the lamp's real SHAPE: a shaded
  1920s gooseneck / sconce throwing a cone with a crisp top edge under its shade and a scalloped spread down the wall, (3) SHADOWS: the
  door frame + the lintel + the person in the doorway casting soft shadows, the steps' top faces brighter than their risers, a pool on
  the cobbles in front, (4) the fixture itself: a hot bulb / lens with a small glare + its own glow. Brightness set against the street
  lamps (the door's lamp a touch warmer + closer); judged at night on the phone, unzoomed, before / after, both doors.
- AFTER 9c (Oct 27 ~7:50 pm) — for 9d / the review: (1) THE CRISP LAYER CAME OUT NARROWER than decided — only the blade, the date stone
  + the roof billboard; the skyline's word signs + vertical blades and the promenade's still set pieces were left soft because "a layer
  drawn over the city can't go behind a person walking past". That's a limit of the OVERLAY approach, not of the idea: those pieces can
  be BAKED / composed at the phone's full DPR IN THEIR OWN PLACE in the layer order (their own canvas at 3×, drawn where they are now),
  so walkers + birds + planes still pass in front. → 9d: do it for the skyline's word signs + blades and the still set pieces if they
  look soft on the owner's phone (he judges; memory measured). (2) "At its brightest the floodlit giant reads a little flat" — the same
  lesson as THE DOOR's FLOODLIGHT: light must MODULATE the surface (lit faces, dark creases, a shadow side), never add a wash. (3) The
  UFO still sits in front of the tallest towers at hover (clearing them would put it behind the tagline) — the wheel is clear (accepted
  unless the owner objects). (4) THE FROST LOOK: the owner picks PANE / BUTTONS / BOTH.
- SOURCED 3D MODELS (the owner, Oct 27 7:58 pm — DECIDED, after the UFO "looks so good"): Grok finds royalty-free models for (1) THE
  CHRISTMAS TREE (11b — urgent), (2) the TR-3B BLACK TRIANGLE, (3) the foreground 1920s VEHICLES kit (taxi, sedans, police, delivery,
  bus, the plow / work truck), (4) the SUPERYACHT (Part 10), (5) the SR-71 BLACKBIRD (11c), (6) the GHOST SHIP (next Halloween); each
  baked into sprites like the UFO (scripts/bake-ufo.mjs generalised into one bake tool), credited. NOT sourced: photo textures for the
  brick / cobbles (would clash with the painted style), the Ferris wheel + lighthouse (woven into too many systems), people + window
  scenes (models don't help at 15–20 pt). Grok's brief: grok-city-models.md; files → ~/Downloads/city-models/<object>/.
- 9c PHONE REVIEW (the owner, Oct 27 8:14 pm): (1) THE SIGN SNOW's PINK GLOW "glows too much pink — give up on that idea and revert
  back to how it was" → REVISED (8:19 pm: "maybe a little glow, just whatever's natural, not nearly as much … the neon
  sign is a light source, and you know how snow gets affected by light"): 9d — the snow stays WHITE, LIT by the tube like any
  white surface next to a coloured light: a soft tint of the tube's colour only where the light reaches (strongest in a thin band
  right at the contact + the mound's underside, fading within a few pt), a faint warm-pink sheen on the faces turned toward the
  tube; NO glowing-from-within mass, NO halo; roughly a quarter of 9c's strength or less — the mound must read as white snow at a
  glance. Keep the blackout fix (dark with the power). (2) TWO PREVIEW LINKS CRASHED HIS iPHONE — 9d GROUP 0, TOP PRIORITY (a crash on a real phone is worse than any look):
  the BLACKOUT + SNOW link (&when=2027-01-15T21:30&snow=fresh&temp=-6&force=tr3b&lgs=15: "glitched my phone, I can't do anything") and
  the WINDOW SCENE STARTING WITH THE BLIND (&force=window&moment=peek: "crashed the site"). Reproduce on WebKit / the iOS memory
  limits, find the cause (memory blow-up? an exception loop? a canvas too big?), fix, and add both to the e2e. Check the other 9c
  links don't do it. (3) THE FOOTPATHS "look a lot better" ✔; THE BANKS + THE PLOW / SALT "look good" ✔. (4) THE SHOVELLERS: "alright,
  but their motions are not very smooth — that's okay, we can't be too picky" → leave (polish-after list). (5) THE FROST ON THE
  BUTTONS "looks bad": either really subtle, the whole button frosted, or nothing → Claude's pick (pending his yes): NOTHING on the
  buttons — keep City 1.0's PANE only (the frost lives at the screen's edges; the buttons stay clean glass). (6) THE UFO's hover +
  height "perfect" ✔. (7) REMIND HIM: ask Grok for an F-22 model / render for the TR-3B's jet chase (added to the models brief).
- 9c PHONE REVIEW, cont. (8:23–8:25 pm): a THIRD night load froze right after the power-on (his LOAD log: ready 1.49 s, t2, 60 fps
  0% slow, "+1.51 s power" then frozen) → an URGENT HOTFIX pass (HOT1) before 9d: find + fix the 9c night regression, push with the
  deploy tag. APPROVED ✔: the snowman's arms, the floodlit giant ("better"), the cream blind, the walk-up scene, the sharper blade +
  billboard. LATER (polish list, not now): THE BLADE's LETTERING ("a weird font … almost like 3D letters, painted for close-up detail,
  not for an iPhone — but it's fine, you can read it") → flatter, bolder letters with one clean edge + a crisp shadow; THE SKYLINE
  SIGNS "slightly soft, not too bad" → the proper full-DPR sign layer later. THE BUTTON FROST: none on the buttons, the pane only
  (DECIDED).
- THE PREVIEW PANEL NEEDS A CLEAN-UP (the owner, Oct 27 8:45 pm: "take a better look at organizing now that we added a lot more
  stuff. Put TIME closer to the top, if not the top — I use that one more than anything") — slot 9d. Today (core/harbor-remote.js
  SECTIONS, C2): SKY · LEGENDARY · SPEAKEASY · HOLIDAYS · PEOPLE + WORKERS · WILDLIFE · HARBOR · WEATHER · TIME (9th!) · LIGHTS +
  MUSIC · TOOLS, + the search box. DECIDED (9:54 pm, "admin panel sounds good"): (1) a PINNED "NOW" BAR at the very top, always open: TIME first
  (the date + the time, quick chips — dawn · morning · noon · golden hour · dusk · 10 pm · 2 am · TODAY; the date's holiday chips),
  then WEATHER's quick chips (clear · clouds · rain · storm · snow · fog · freeze · windy), JUST ME / EVERYONE + CLEAR ALL; (2) a RECENT
  row (the last ~6 things he used, one tap to repeat); (3) the sections re-ordered by use: HOLIDAYS · SPEAKEASY (windows inside) · SKY ·
  LEGENDARY · PEOPLE + WORKERS · WINTER (the snow, the snowman, the plow) · WILDLIFE · HARBOR · LIGHTS + MUSIC · TOOLS; PLAY ALL inside
  each; (4) every row's label plain + short (the hint under it), no duplicates across sections; the search kept at the top.
  + (8:46 pm, the owner): MOVE THE TEST PILL INTO THE ☰ MENU — "put it in the bottom in there, call it ADMIN or TEST … that way it's
  not taking up anything on my screen": the TEST pill leaves the screen; the title's ☰ menu gets an ADMIN row at the BOTTOM (admins
  only, as the pill was) that opens the panel. Claude's note: while a preview is ACTIVE (JUST ME / EVERYONE), keep a tiny cue so he
  never mistakes a forced city for the real one — a small coloured dot on the ☰ button (+ "ADMIN · JUST ME · 10/27 22:30" on the row,
  with CLEAR there); the big status pill with its × goes away.
- THE MODELS ARE IN (the owner, Oct 27 9:23 pm): Grok found good ones — the CHRISTMAS TREE (undecorated + a decorated one with
  presents under it), several 1920s–30s VEHICLES, the SR-71 BLACKBIRD, the F-22, the GHOST SHIP, the SUPERYACHT; NO good TR-3B triangle
  (keep the hand-drawn one; search again later). WHERE: in ~/Downloads/grok/ — under a models folder ("somewhere in there": the pass
  that uses them SEARCHES Downloads/grok for them + their credits). Grok is sending a summary of what he has → into this plan when it
  arrives. Each goes in with the pass that needs it: the tree → 11b, the yacht → Part 10, the vehicles → a vehicles bake (after 9e), the
  Blackbird + the F-22 → 11c / the jets, the ghost ship → before next Halloween; all through ONE generalised bake tool (bake-ufo.mjs's
  method), credited.
- THE BLACKBIRD's AUDIO TELL (the owner, Oct 27 9:23 pm — DECIDED, for 11c's Blackbird quick-tap sighting): ~3 s BEFORE the SR-71 screams
  across, a hint for those paying attention — a short burst of RADIO STATIC / interference crackling over the music (as if the song's
  signal is being jammed; a brief crackle + a dip / bit-crush on the music, ~0.5–1 s), and with the music OFF the same static as a
  quiet sound effect; then the jet. Claude's notes: keep it short + rare so it never annoys; the roar arrives a beat AFTER the jet (sound
  lags a high, fast plane) with a soft double sonic-boom; a Grok sound prompt (radio static / interference + an SR-71 roar + a distant
  double boom) BEFORE 11c.
  + (9:30 pm, the owner): "make sure you get that thing screaming across. It's got to go fast and hard to tap — you got to be lucky to
  see it." → it crosses the WHOLE screen FAST (~1–1.5 s), slightly climbing, a sharp silhouette; its AFTERBURNERS LIT (it really cruised
  in afterburner): two long bright plumes with MACH DIAMONDS, hot white-blue at the nozzles fading to orange, a faint heat shimmer;
  rare (the sighting's rarity), the tap window = only while it's on screen, the hit box just its body + plumes (fair but hard).
- THE MODELS INVENTORY (Grok's summary, Oct 27 9:34 pm) — in C:\Users\benja\Downloads\Grok\models\ (unmodified originals: work from
  COPIES into art/models/<x>/, never edit the originals; each subfolder has a credits.txt — all CC0 or CC BY 4.0 → the CREDITS sheet):
  (1) xmas-tree\ — christmas_tree.glb: UNDECORATED, no textures (colour materials only), ~1.23M faces / 70 MB (bake in pieces if the
  laptop's memory struggles; give the needles a real material) = THE BASE (our own lights, ornaments + star); xmas_tree.glb: DECORATED
  (lights, a star, gifts at the base — the gifts may need hiding; or use it for a window / the lobby). (2) blackbird\ —
  sr-71_blackbird_free_downloadable.glb: untextured (2 materials), no markings → a dark matte material + our own afterburner plumes.
  (3) f22\ — f22_raptor_free.glb: grey PBR textures, ANIMATED, gear DOWN by default → use the gear-up pose; check the textures for small
  stencil text. (4) vehicles\ — 1928_chevy_tudor.glb (the TAXI base, repaint yellow), 1936_american_sedan_free.glb (the POLICE car base),
  ford_model_a_v2_downloadable.glb (untextured; has a TEXT OBJECT to delete), free_1938_vairogs_v8_van_ford_based.glb (the DELIVERY
  VAN), free_1940s_city_buscoach_white_motor_co..glb (the CITY BUS; the double dot is normal), 1938_vairogs_v8_flatbed_truck_ford_based.glb
  (the WORK TRUCK: the plow / dump base); remove EVERY maker badge, hubcap logo + readable text. Claude's note: the city is 1920s — the
  1936–1940s bodies run a decade late (the kit is already "1920s–30s"); fine at phone size, but the 1940s bus is the most out of era —
  keep it only if it reads 1920s–30s once lit + painted. (5) superyacht\ — yacht.glb: dark hull, multi-deck, a helipad, no textures but
  69 materials (split the windows + deck lights by material), no name. (6) ghost-ship\ — dutch_ship_large_02_4k.gltf + .bin + textures\
  (9 maps at 4K: hull, rigging, sails × diffuse / normal (GL) / ARM) + a preview png (reference only); the translucent green ghost look is
  ours. NOT FOUND: the TR-3B (dropped — the hand-drawn one stays). All baked through ONE generalised bake tool (bake-ufo.mjs's method).
  THE SIZE RULE (the owner + Grok, 9:35 pm: "70 MB for a small Christmas tree?"): phones NEVER get a model — only the baked images (a
  few hundred KB, like the UFO's 398 KB). The big SOURCE files stay OUT OF GIT: GitHub warns at 50 MB and refuses 100 MB, and every clone
  + cloud job would download them forever → a source over ~20 MB lives in a git-ignored folder on the laptop (art/models-local/ or
  read straight from Downloads\Grok\models), only its credits.txt + the bake settings committed; the baked sprites are what ship.
  WHICH MODELS ARE WORTH THE USAGE (the owner, Oct 27 9:43 pm — DECIDED, "that sounds great"): (1) the CHRISTMAS TREE — yes (11b),
  (2) the SUPERYACHT — yes (Part 10), (3) the BLACKBIRD + the F-22 — "absolutely" (11c / the jets), (4) the VEHICLES — only TWO for now,
  to compare against the current hand-built kit (the TAXI from the 1928 Chevy + the POLICE car from the 1936 sedan), in a short bake
  folded into 9e; the rest only if the owner wants them after seeing those two, (5) the GHOST SHIP — next year, before Halloween. Every
  bake folded into the pass that needs it (no separate runs), one shared bake tool.
- HOT1 RETEST (the owner's iPhone, Oct 27 9:51 pm): the plain night city ✔, the PEEK link ✔ — fixed. THE TR-3B + SNOW link STILL
  GLITCHES ("froze up … very glitching … definitely issues"; his screenshot: t2, 60 fps 0% slow at that instant, ready 1.71 s; Jan 15
  2027 is a FRIDAY = a PARTY night (lit swap "party") + fresh snow + the frost + the blackout + the TR-3B all at once). → 9d GROUP 0,
  FIRST: read the phone's error reports in /admin (HOT1 now sends every failed frame there) + reproduce the COMBINATION (party + snow +
  frost + blackout + the craft) at DPR 3 with 4× CPU; look for frame spikes (not just exceptions): the blackout's re-bakes, the party
  show + the snow's caps re-baking, the frost overlays, the tape-stop audio. ALSO SEEN in the log: "snowman face · 59% · slumping ·
  12 °C" while the link forced temp=-6 → the snowman (+ maybe the snowpack) ignores the &temp= override — fix. ALSO: "that TEST
  button, you got to move it under the menu … get it out of the way" → the ADMIN row in ☰ (already planned) — do it in 9d.
- THE BLACKBIRD's SOUNDS ARE IN (Grok via the owner, Oct 27 10:08 pm — for 11c): in ~/Downloads/city-sfx/ (credits.txt's "Blackbird
  sounds" section; all SONNISS GDC — royalty-free for commercial games, NO credit line needed, never redistributed as loose files: only
  processed excerpts ship, like the other city sounds; unmodified originals → process from copies). (1) radio-static.wav — the warning:
  old-radio tuning warble + static, 15 s, 96 k / 24-bit mono, THREE takes split by silence (0–3 s, 6.2–9.4 s, 11.2–14.2 s) → trim ~0.5–1 s
  each, use all three as variations; strong mid-range (phones). (2) jet-scream.wav — the flyby: an F-16 overhead pass with a strong
  Doppler, peak ~4.5 s, 25 s stereo → use 1.5–8.5 s, the peak lined up with the jet crossing; ignore after ~14 s (a steady tone); the
  stand-in (no PD SR-71 recording exists). (3) sonic-boom.wav — a distant explosion standing in (no licensed double boom), single hit,
  17 s mono → use 0.6–5.0 s, played TWICE ~0.15–0.3 s apart for the "boom-boom", distant + low. (4) jet-afterburner-roar.wav — a
  distant F/A-18 roar fading, 27 s stereo → use 5–18 s (the engine cuts ~19 s); low-mid, keep enough mid for phones. ORDER: the static
  (~3 s before) → the scream as it crosses → the roar trailing → the boom a beat later, far off. Grok checked them only visually — the
  OWNER LISTENED to all four (10:09 pm): "they're good to go" ✔.
- THE F-22s USE THE NEW MODEL — EVERYWHERE (the owner, Oct 27 10:08 pm): every F-22 in the city — the TR-3B's jet chase, the air show,
  the surprise flyby, the missing man — is drawn from Grok's f22_raptor_free.glb (gear UP, stencil text removed), baked like the UFO,
  replacing jets.js's hand-drawn Raptor; the Mach diamonds, the afterburner + the heat haze stay code on top. Slot: with the Blackbird
  in 11c (one bake of both jets), or earlier if a pass touches the jets first.

## OWNER'S NOTES — OCT 27–28 (after 9d)
- WELCOME MOMENTS — PERSONAL SIGHTINGS TIMED TO WHEN PEOPLE ARE LOOKING (the owner, Oct 27 10:31 pm — the idea, to discuss): the Blackbird
  (and other one-offs) appear ~5 s after a player lands on the title, ~5 s after they're back in their lobby from a game, or ~5 s after
  joining a lobby — rarely, but when they ARE looking; "or even better: the THIRD time they log in, 10 s later, the Blackbird screams
  across — like a reward … small one-offs as rewards for logging in, progressively cooler the more times they log in every day"; AND
  keep GLOBAL ones too (the global Blackbird super rare). Claude's take (pending): a strong idea — show moments when attention is there.
  Cautions: (1) it pulls against "you got to be lucky to see it" (the quick-tap sighting) if the Blackbird is GUARANTEED on the 3rd
  visit → keep the Blackbird a RARE ROLL in the ladder, not a sure thing; (2) "log in" = opening the site (no accounts) — count visits
  per device per day; (3) "more visits a day = cooler rewards" can feel like slot-machine bait → a gentle ladder that caps (e.g. visit
  2 / 3 / 5 of the day) and resets daily; (4) City Sightings (Progression 2.0, server-verified) must not become farmable by reloading →
  personal moments may not count, or count once a day. In a LOBBY the moment is SHARED by the room (the host's seed) so friends see it
  together. SLOT: the trigger system + the Blackbird in 11c; the escalating daily ladder + what counts as a sighting in PROGRESSION 2.0.
- THE ARRIVAL LADDER — A DAILY-STREAK "WELCOME" (the owner, Oct 27 10:36 pm — FUTURE, park for PROGRESSION 2.0; it supersedes the
  per-visit ladder above): every arrival already gets the neon race + the music (the attention-getter). On top, by CONSECUTIVE DAYS:
  day 2 = a small distant sound a couple of seconds after the first tap (a boat whistle / a far train whistle — never the hourly
  chime, that stays the hourly chime), day 3 = the sun flashes / a glint, day 4 = a lightning strike (Claude: weather-consistent — on a
  clear day a different "basic" one, e.g. a shooting star, a searchlight sweep, the lighthouse flash), … "something different happens
  every time … the randomness is the hook", built from the many moments already in the city; the BIG ones (the sea monster, the
  periscope, the Blackbird) only for long streaks (Claude: e.g. 7 / 30 / 100 / 365 days), never everyday. Claude's notes: use the
  profile's existing STREAK (docs/profiles.md) where a profile exists, else a per-device count; never explained (discovered); one per
  arrival, ~2–5 s after the first tap when they're looking; a missed day steps back gently, not to zero; the legendaries' rarity +
  City Sightings stay intact (streak moments don't count as sightings, or once a day). Part of the WELCOME MOMENTS system above.
- DESKTOP = THE SAME CITY, ONE BETTER SHOT — NO DESKTOP-ONLY PIECES (the owner, Oct 27 11:18 pm — DECIDED: "I don't want to make
  desktop-only items … I'm getting burnt out already. I can't make two versions of this intricate thing"). DROPPED: the elevated train,
  the far-quay people, the theatre crowd, any new building forms for the panorama. KEPT (the desktop pass, its own ~1.5–2 h pass, not
  in Part 12): a re-composed CAMERA for wide screens using only what the phone city has — lower + closer so the skyline is big, more
  water, the promenade a shallow foreground band, the speakeasy a proud corner, the sign bigger; the extra width filled by the
  existing towers re-shuffled (no visible repeats) + the procedural sky + water; a billboard slot kept for the four billboard games;
  everything checked at 1440×900 + 1920×1080. TV mode reuses this camera. The owner's desktop questions still come first.
  CLARIFIED (11:20 pm): a one-time desktop pass can take the time it needs (~3–4 h is fine) to be really good; what he refuses is the
  ONGOING double work. THE RULE FROM THEN ON (into CLAUDE.md with the desktop pass): every feature, holiday + event is built + judged
  for the PHONE only; desktop gets it automatically through the shared city + the desktop camera — never a desktop-only piece or a
  second version; Claude Code checks desktop itself in every pass (shots at 1440×900 / 1920×1080 as part of the automated review)
  and fixes anything that breaks there — the owner tests on his phone only, never has to check desktop.
- EVERY VISITOR HOLDS A DATABASE CONNECTION (raised by the games chat, Oct 27 11:30 pm; Claude verified in the code, read-only): YES —
  js/app.js boots Firebase for EVERY visitor once the title has painted (initFirebase → getDatabase + a `.info/connected` listener →
  an open RTDB socket), on City 1.0 AND 2.0, with or without a room; City 2.0 also listens to city2/live for everyone (remote.js).
  Firebase SPARK allows 100 SIMULTANEOUS connections → ~100 people sitting on the title would fill it and the 101st couldn't host or
  join. Not a problem today (almost no traffic), a hard ceiling at launch. FIX (a small pass BEFORE LOBBY 2.0 / any public launch):
  open the database socket only when it's needed (HOST / JOIN / resuming a room / THE BOARD's live bits) — anonymous AUTH can still
  start early (it isn't a database connection); goOffline() after leaving a room + when the tab is hidden a while; city2/live read
  through a cached /api poll (e.g. once a minute, edge-cached) or only for admins; the profile's live watch on demand. Check the
  Firebase console's connection graph before + after. (The alternative: Firebase BLAZE — 200,000 connections, pay-as-you-go, ~$0 at
  this size — needs a card on file: the owner's call.) Lobby 2.0's public crowd already plans a once-a-minute server summary — the same
  pattern.
- THE MOTHMAN MODEL (Grok via the owner, Oct 27 11:46 pm — for 11c's MOTHMAN on the needle): "MOTHMAN REMAKE 2.0" (Sketchfab, CC BY 4.0
  — CREDIT REQUIRED: the line in credits.txt → the CREDITS sheet, js/ui/credits.js; NOT audio/city/CREDITS.md, that's for sounds). In
  C:\Users\benja\Downloads\Grok\models\mothman\: mothman_remake_2.0.glb (2.9 MB, 2K textures, two meshes: base_body + wings_decals,
  two PNGs, NO rig / animation, STANDING with the wings fully spread, wingspan ~5.5 units) + mothman-remake-20.zip (24 MB, the artist's
  originals — keep OUT of the repo) + credits.txt. The owner's vision (as decided Oct 25–26): giant, crouched / perched on the NEEDLE's
  top, its head about the height of the SPEAKEASY letters, ALL BLACK, two GLOWING RED EYES, its body REFLECTING the neon round it (the
  rim light following the needle's colour), 2:00–5:30 am about twice a month. WATCH: (1) deliberately low-poly (~13.7k faces,
  old-PlayStation style) — chosen for the SILHOUETTE in solid black at 60–250 px; edges may facet up close (fine at phone size);
  (2) NOT RIGGED + standing → a true crouch needs a rig (Blender) — Claude's recommendation: keep him STANDING on the needle's tip,
  wings spread (the iconic Mothman pose) or the WINGS mesh rotated as one rigid piece to half-fold them (it's a separate mesh); only
  rig for a crouch if the standing pose doesn't read; (3) the red eyes are only in the texture → add small EMISSIVE eye pieces (or a
  mask) for the glow; (4) a GLOSSY BLACK material so he catches the neon; (5) the baked sprites only ship.
### OWNER'S NOTES — Oct 28 (12:20 am): THE PROMENADE WITHOUT LAMPPOSTS (PENDING — talk it through with the owner BEFORE building; not in 9e unless he says so)
- The owner liked the mockup (plan/promenade-lights-mock.png: top = now, bottom = the idea): "looks better, frees up a lot of room".
- NO LAMPPOSTS ON THE PROMENADE: both curb lamps go (all or none — one left alone would look forgotten + light one side) AND the
  double-globe lamps along the back railing (their poles vanish into the dark water: they read as floating lights + clutter the view).
- THE IMPLIED LAMPS: a row of street lamps on OUR side of the road, just below the screen, behind the viewer — the warm pools on the
  promenade + the road under the dock come from there (brightest at the curb, fading toward the railing; the back falls off naturally,
  the skyline + its reflection carry it). The tell: SHADOWS CLIMB UP THE SCREEN, away from the viewer (people, the hydrant, the bench,
  the trunks); the trees lit from the front / below.
- THE DOOR LANTERNS — REJECTED by the owner ("I don't like those lanterns by the door"): the door's own light stays as 9d's real-light
  lamp over the door; any other door light is an open question for the talk-through.
- THE DOORMAN (agreed): his back flat to the brick on the RIGHT of the door (under the blade, more wall, visible), a foot up on the wall,
  arms crossed, his head + hat turning to follow passers-by; pushes off the wall + nods when a guest comes and the door opens; leans back.
- HOLIDAY SPOTS move: the RAILING itself becomes the main spot (garlands, papel picado, bunting along its run), plus the tree, the bench,
  the hydrant, the speakeasy wall; the papel picado strings re-anchor from the lamps to the railing / the wall / the tree; everything in
  core/harbor-spots.js + the lamps' life (core/harbor-lamps.js) + the wet-ground streaks that read the lamps is retargeted.
- THE CHECK: side by side against today's look on a plain night (https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&when=2026-09-15T23:00)
  + a holiday + rain before anything replaces the lamps — the risk is a darker / flatter front.
- THE CROSSWALK AT THE BACK (the owner, 12:25 am, with the railing lamps gone): it must READ at night — today it's a vague dark band.
  Implied lamps just past the screen's left + right edges along the back road (their light spills across the asphalt, brightest at
  the crossing in the middle); the crossing's painted stripes bold + pale enough to read unzoomed (a ladder of wide stripes); the
  signals tint the asphalt red / green under them, changing with the light; the WAIT / WALK sign glows on the steps; passing cars
  sweep their headlights across it.

### OWNER'S NOTES — Oct 28 (12:30 am): FOR 9e
- THE BLADE STAYS SHARP AT EVERY TIER (the owner's phone, Oct 28 12:06 am, Day of the Dead night at 20 % battery: the blade looked
  fuzzy). WHY (read-only): crisp.js#begin turns the 9c crisp layer OFF at tier 0, and the frame-rate judge steps down on a busy night →
  the blade falls back to the 2× canvas. The layer costs ~0.1 MB and redraws only when its key changes — keep it on at every tier
  (only the canvas-DPR check stays). If it is still soft at tier 2, the gold edge round the white core is the cause → the flatter
  lettering (already noted).
- 9d's known issue: the panel/RECENT cloud check (the test now scrolls RECENT into view) is confirmed in 9e's cloud run.
- SNOW LANDS ON THE SIGN (the owner, Oct 28 12:38 am: "the snowflakes have to land on it and stop falling … I don't think any of them
  land on it. Small detail, but it matters"): flakes at the sign's depth that meet a tube's TOP edge STOP there, sit a moment, then
  soften into the cap (the cap visibly builds from what lands during a snowfall); flakes in front of the sign (nearer) keep falling
  past it (never a flat wall); on a LIT tube a landed flake melts faster into a bead that runs down + joins glasswx.js's drips. Judged
  unzoomed: a flake stopping is a visible dot against the falling ones. Check: https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&when=2027-01-14T21:30&snow=fresh&wx=snow&temp=-6
- 9d PHONE REVIEW (the owner, Oct 28 12:36–12:44 am): ✔ THE DOOR LIGHT "better", ✔ THE DOOR CLOSING "better", ✔ ADMIN "in the right
  spot", ✔ THE BEACONS before sunset "perfect". STILL BROKEN — 9e GROUP 0, FIRST:
  (1) THE TR-3B FREEZE on the FULL run (https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&when=2027-01-15T21:30&snow=fresh&temp=-6&force=tr3b):
  "the craft is just stuck. The music still plays, but everything else is frozen" (his 12:40 screenshot: the craft big over the
  skyline at its dip, the city dark in the blackout, the people standing). The music playing proves nothing (iOS plays audio off the
  page's main thread). On the HELD link (&lgs=15) at 12:35 his readout showed t2 · 60 fps · 2.9 % slow — the loop ran there. 9d could
  not reproduce it on Chrome, and Safari's engine wouldn't install. → (a) A SEND REPORT button in the &debug=1 strip: ONE tap posts a
  snapshot to /api/log → /admin (the frame stats + the tier history, the legend run's state — kind, its second s, the phase, run.at vs
  the city clock, held / forced — the load log, the last ~20 errors, the user agent, memory where the phone exposes it), so the owner's
  iPhone can say what's wrong; (b) suspects to check in the code: a layer that throws every frame AFTER the readout counts it (the
  canvas left stale while rAF runs), the blackout's dark-city path reusing a cached frame forever, the legend's clock stalling under
  &when= (run.at vs the preview clock), the stall report itself; (c) try Playwright's WebKit once more (it is the closest to iOS
  Safari); time-box 2–3 real attempts, then ship the report button + the evidence.
  (2) THE FROST LINK SHOWS NO FROST AT ALL (https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&when=2027-01-20T22:00&snow=older&temp=-14):
  find why (the trigger's conditions vs the link, or the pane broken by 9d's "pane only" change) and fix whichever it is.
  (3) PEOPLE WALKING BEHIND THE SNOWMAN ARE DRAWN IN FRONT OF HIM ("they snapped in front of the snowman"): the centrepiece rig's
  pieces must sort with the walkers by depth (their feet) — a walker behind passes BEHIND; check every centrepiece piece (the giant
  pumpkin, the harvest display, the tree stand) + the snowman's builders the same.

## OWNER'S NOTES — OCT 28 (after 9e)
- CITY PREVIEW — A SHOWREEL BUTTON IN ADMIN (the owner, Oct 28 1:07 am — the idea, to talk through): one button in the ADMIN panel
  that SPEED-RUNS the city's most impressive stuff: sunrise → morning → noon → afternoon → golden hour → sunset → night, the weather
  (rain, storm, snow, fog), the party mode, the legendary events — "cycles through all the most impressive stuff". Workers / city life:
  NOT in it (the owner: "don't worry about that"). Claude's take: a good idea (a demo for friends + a launch video) — build it on the
  panel's existing PLAY ALL sequencers; the legendaries only their best ~10–15 s each (the TR-3B's full run is over a minute), the
  whole reel ~3–4 min, smooth fades between scenes (never a hard cut), any tap stops it + returns to the real city; JUST ME by default.
  SLOT: 13 CITY CONTROL (or a small pass sooner if he wants it).

## OWNER'S NOTES — OCT 28 (the 9e review)
- 9e PHONE REVIEW (the owner, Oct 28 8:02 am): THE MORNING PAPER in the window is "way too cheap looking"
  (https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&when=2026-11-04T10:00&force=window&moment=paper).
  Claude's take (pending the owner's pick): at ~40 pt the fake print (masthead, columns) is what cheapens it — either REWORK it to what
  reads (one clean pale sheet held open, lit by the daylight through the window + a soft fold shadow, the fedora + brow over it, the
  page turn as one big motion, NO fake text) or TAKE IT OUT (a weak moment hurts more than none; the windows have plenty).
- THE JOGGERS DIDN'T SHOW (the owner, Oct 28 8:03 am, the lunchtime link). WHY (read-only, core/harbor-people.js#mixNow): 9e added
  the jogger at weight 1.0 into midday's mix of ~22 (lunch 4, couples 2.5, …) with ~5 people out → about 1 person in 20 is a jogger,
  so a visitor can watch for minutes and see none; the weekend morning (+2.4) is better but still rare. And there is NO preview switch
  for them. FIX (next pass): weight them so a jogger passes every ~1–2 min in their hours (lunch, after work, weekend mornings, the
  early block), never in heavy rain; a `&force=joggers` panel row (PEOPLE) that sends one through every ~20 s.
- THE IMPLOSION's BUILDING (the owner, Oct 28 8:06 am: "Implosion looks great but why does the building look so cheap and flat and
  basic and not the original building? Original building should implode"). WHY: 9e's known issue — during the implosion the old
  building is drawn LIVE as a simplified flat slab. FIX (next pass): the REAL tower comes down — its own baked pixels (the same
  facade, crown, outline + shading as the skyline bake) lifted out as a sprite the moment the implosion starts, the gap behind it
  baked, then the sprite cut into floor bands that drop + crumble into the dust (a slight squash, the top tipping). Claude's note
  (pending): a building about to be imploded is EMPTY — its windows dark + its neon word taken down in the days before (the crew
  removing the sign could be the prelude); the shape + facade stay exactly the original's, so it's clearly the same building.
  DECIDED (the owner, 8:35 am): KEEP IT COMPLETE as it comes down — the original building exactly as it stands (its word sign + all),
  no emptying / sign removal prelude; it implodes by day (Sunday 10 am), so its lights are off anyway.
- THE TOWER UNDER CONSTRUCTION (the owner, Oct 28 8:37 am): (1) THE CRANE "needs to be higher def and better looking" → Claude: SOURCE
  it — a real 3D TOWER CRANE model (Grok; a lattice mast, the jib + counter-jib, the cab, the hook block), baked like the UFO at the
  camera's view in a few jib angles (the slew), day + night, credited; the hand-drawn one stays the stand-in until it's in. (2) THE
  FRAME AT NIGHT must stand out: REAL site lighting, not strobes (Claude: blinking flashers read cheap + modern) — strings of BARE WORK
  BULBS along each finished floor's edge (rows of warm dots that outline the rising frame — reads at phone size), a couple of FLOODS on
  the top deck lighting the steel from inside (warm, casting the columns' shadows), the red obstruction lights on the frame's top
  corners + the crane's tip blinking slowly like the skyline's beacons. (3) A SKY BEAM from the top deck ON PARTY NIGHTS, joining the
  party's own beams (skybeams.js) — the site takes part in the show; not every night (the grand opening keeps its own searchlights).
- THE TR-3B's TAPE STOP LAGS NOW (the owner, Oct 28 8:39 am, iPhone, the full TR-3B link with &debug=1; his readout: t2 · 60 fps ·
  0 % slow, AUDIO sounding · ctx running, ready 1.39 s, a party + snow night): "getting better but still has issues. The audio
  slowdown effect was lagging. It was perfect before, now it's off" — the tape stop (audio/tape-stop.js, TR3) no longer lands with the
  drain. SUSPECTS (to measure, not guess): 9d's change for HELD previews (the sounds skip the tape stop + the repeating one-shots
  when `held`) leaking into the full run; 9e's CRAWL tier step under a legendary; the decoded slice's start time on iOS (decoding the
  ~42 s slice late → the slow-down starts after the picture's drain); the dark city's re-bake at the drain's start delaying the audio
  kick. Compare against TR3's timing (the e2e `tape` group) — the slow-down must start ON the drain's first dip and bottom out with the
  lights. The owner's SEND REPORT (if he sent one) is in /admin → Reports from phones.
- DECIDED (the owner, Oct 28 8:41 am): (1) THE MORNING PAPER — TAKE IT OUT (the moment removed from the catalogue + the panel; the
  back / bar windows' other moments fill its hours). (2) THE TR-3B did NOT freeze this time: "kind of was slow, maybe stuttered a
  little bit" (+ the tape stop lagging, above) → measure the full run's frame pacing on the phone path (the SEND REPORT / hang-watch
  data, 4× CPU at DPR 3) — the stutter + the audio lag may be the same cause (a heavy moment at the drain's start).
  (3) THE VERTICAL WINDOW WORDS while the construction tower is down (Apr → Nov): pending the owner's pick — accept the seasonal gap
  (Claude's pick) or give another tower a square-window grid that can spell the vertical words.
- 9e PHONE REVIEW, cont. (the owner, Oct 28 8:42 am): ✔ the VERTICAL WINDOW WORDS' seasonal gap ACCEPTED (none while the tower is
  down / rising — DECIDED); ✔ THE FROST good; ✔ THE SNOWMAN (walkers behind him) good; ✔ THE HENCHMAN good; ✔ THE WATER WAGON good;
  ✔ THE WEEKNIGHT COUPLES good; ✔ THE QUICK FADE under the dock good; THE SAX "alright" (accepted — polish later if it nags).
  REMIND HIM in the next pass's review list: THE SUNDAY CHURCH BELLS (he couldn't listen yet) —
  https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&when=2026-11-08T08:59&wx=clear
- LOAD WEATHER IS RED ON EVERY HARBOR RUN NOW (9e's run + both of CONN's): no longer a "known flake" to list — FIX IT in the next
  pass (the lit crossfade after a late weather answer counted as a visible change on CI): a red that's always red trains everyone to
  ignore red.
- REMIND THE OWNER (Oct 28 9:27 am — he's on the road, no second phone / people around): CONN's real-phone check is still OWED —
  HOST on one phone + JOIN by the hush word on another, play a game, QUIT, HOST again; an EVERYONE preview reaching a second phone
  within ~1 min. Put it at the top of the next summary's review list until he says it's done.
