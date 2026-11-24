# JAYWALK SMOOTH 4 — WARM START + THE MATCH-START TIMEOUT (Nov 23 2026)

The owner's prompt (Nov 23) after his iPhone numbers on SMOOTH 3; his rule: `docs/games/plan.md` "JAYWALK SMOOTH 4"; as built: `docs/jaywalk.md` "SMOOTH 4".
**No look change, no rules change.** Course rules, replay, proof (THE STAMP at the tap, GO within 5 s) and `database.rules.json` are untouched. The inbox: no open entry for this pass at the start, after each group, or before the final run (SMOOTH 3's item 4 IS Group 2). THE CARD LAB: not touched (no card art). Logs + tables: `Downloads\NEON\jaywalk-smooth4\`.

**NOT MEASURED ON AN iPHONE.** Everything below ran on the Beelink. On this machine Chromium at 4× CPU drops almost no frames either way, and WebKit draws in software (~21 fps), so its frame times mean nothing. What the numbers show is the work that moved out of play; whether the owner's first-10-s drops go away is for his meter.

## GROUP 1 — WARM START

### What a fresh page was still doing in its first 30 s of play (before; `--smooth=warm`, a new browser a run, the tap 1.5 s after the page is up)
| | Chromium, 4× CPU | WebKit (JavaScriptCore) |
| --- | --- | --- |
| **the first tap waited** (SMOOTH 3's warm-up hold), tap → first tick | 0.20–0.38 s | **1.4–2.0 s** |
| **the area loaders** (traffic + props) busy in play | noon autumn: the first ~5.5 s · Dec 24 night: the first ~11 s | noon: the first ~3 s · Dec 24: the first ~5 s |
| the frame's JS while they ran | 9.0 ms against 6.3–7.2 later (+30–40 %) | ~2 ms, flat (no JIT warm-up curve here) |
| shader links in play | 0 | 1 (noon) · 2 (Dec 24), ~1 s in |
| the next area (lanes ~100 / ~150) | loads in play, one step a light frame, as designed | the same |

**Why it reads as 20–30 s on a phone:** the loaders take ONE step a frame and skip any frame that has already worked 7 ms (`PUMP.budget`), forcing a step only after 24 skipped frames (`PUMP.starve`). Where most frames work past 7 ms, the opening's ~20 models then trickle in at about 2.5 steps a second, each one landing on an already-busy frame. That is the owner's curve: many small drops at first, fewer in the second 10 s, normal by the third. **Ruled out here:** a JIT warm-up (JavaScriptCore's frame JS is flat from the first second on this CPU; the iPhone's can't be measured here), texture uploads (steady ~370 KB a frame of instance data, the same at second 1 and second 39, not a warm-up), the season pack (in before the tap in every run). **Not measurable here:** the iPhone GPU waking from idle. The start screen now draws warm frames of the real scene for it.

**Found on the way:** the props module landed while the start screen held its picture for the shader links, so its first ask only went out at the tap. The same held winter's plows + salt trucks until play.

### What changed (`night.js#stillPump`, `variety.js#STILL`, `view.js`, `lab.js`)
- **THE STILL SCREEN:** while `run.t === 0` (TAP TO START, the lab before its first touch, a match before GO) both loaders take up to **24 ms of steps a frame**, also while the picture holds for the links. Their ask goes out on the first frame: the traffic at once, the props the moment their module is in, and again when winter's trucks join. Once everything is in, one more warm draws every new kind behind the start screen.
- **The start's areas stay in** (the opening, THE DOCKS, the one after: `STILL.areas`) for the page's life, so PLAY AGAIN never loads them in play. Further areas load ahead and are freed as before.
- **The first tap is never held:** the run starts at the tap. Links still in flight finish in the background, and the full warm waits for the next quiet frame. THE STAMP and the GO timing are unchanged.
- **The daily's veiled start** draws every frame for its first 3 s and while it loads, then twice a second as before.

### After (three fresh browsers a scene, 40 s each)
| scene | engine | loaders busy in the first 20 s | DROPS · BIG, 0–10 s | DROPS · BIG, 20–30 s | tap → first tick, cold page | a warm page |
| --- | --- | --- | --- | --- | --- | --- |
| noon autumn | Chromium 4× | **0 %** | 0.7 · 0.7 | 0.0 · 0.0 | 36–39 ms | 36–51 ms |
| Dec 24 heavy night | Chromium 4× | **0 %** | 2.0 · 2.0 | 0.7 · 0.7 | 56–83 ms | 39–55 ms |
| noon autumn | WebKit | **0 %** | (software GL) | | 45–66 ms | 46–60 ms |
| Dec 24 heavy night | WebKit | **0 %** | (software GL) | | 61–75 ms | 28–80 ms |

- **The first 10 s = the third 10 s** within one frame (Chromium, the only engine whose frame times mean anything here). **The cold tap ≤ a warm page's + 50 ms** in every run (worst: 83 against 55).
- **What still happens in play:** the area after the next one (from lane ~98) loads one step a light frame, as designed, and is where the 30–40 s window's 2–3 BIG frames come from. In WebKit, a tier step (software GL starts at tier 2, drops to 1, comes back) links the sun-shadow depth program and the night bloom's blur at that moment. A phone whose own stutter rule steps the tier mid-run would pay the same then.

### A match start (`e2e-jaywalk-match.mjs --start`, Dec 24 heavy night: BOB at 390 × 844 @3, 4× CPU, a cold scene; old code on :5174 against new)
- **Every shader link is done before GO** (the last at GO−100 ms, logged per program on BOB's phone), and **the loaders are idle after GO** (0 s busy in the first 10). Old and new are alike here: a match's walk inside + its count already gave the one-step loader enough time on this machine.
- **The first 10 s after GO: 2–4 BIG frames against 0 in the third 10 s**, old code 3. Not a load, not a link: two frames at GO itself run ~90–100 ms of the frame's own JS (first-time code as the match goes live: the moving traffic, the order chips, the moments), and one ~250 ms pause ~0.7–0.9 s after GO sits outside the frame (the profile puts it in native time: GC or a GPU sync). Both are in the old code too. **Not fixed in this pass**: the next step for matches is to run those code paths once during the count.
