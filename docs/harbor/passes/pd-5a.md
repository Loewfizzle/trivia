# PD-5A — PRISM DROP: THE SOUND (Nov 9 2026, night)

PD-5 split in two (the owner, docs/games/plan.md "PD-5 SPLIT + PD-5A"): **PD-5A = the sound** — the beat fix, quick-start songs, the five DAY songs + the
host's set; PD-5B = the three cards + the polish (HOLIDAY TOUCHES cut to the HOOK; COMEBACK = EPIC). The night songs + their behaviour unchanged.
**No rules change** (database.rules.json untouched — the set + the cue-ins ride the host-written `game`; the day playlist rides THE NIGHT's MEMORY's
existing `meta/used`). **Still 8 functions.** Never the live site: everything on the emulators + local previews.

## Step 0
cd2196c6 — docs/games/plan.md "PD-5 SPLIT + PD-5A — THE SOUND", appended unchanged.

## Group 1 — THE BEAT FIX (THE HEARD BEAT)
- **The problem, as built:** the visuals (the world's pulse, the countdown's numbers) ran on the SERVER clock (`serverNow() − the song's start`), the
  song on the AUDIO clock; the musical SFX were quantized on the server clock too (`ctxAtServer(start + t)`) — while the song's voice is placed at
  `ctxAtServer(start) − speakerLead()`. So (a) an iPhone's unreported output delay put the lights AHEAD of the sound, (b) a SPEAKER DELAY moved the
  song earlier but not the lights or the clears (every clear landed SPEAKER DELAY late against the song), (c) a voice re-placed after a suspension
  (up to RESYNC_S 120 ms off before it is) wasn't followed.
- **ONE clock** — `view.js#songClock()` → `audio.js#createHeardBeat().place(i, start, cue, clk)`, the maths PURE in `games/prism/sync.js`:
  `pos = heard() − voice.origin − SPEAKER DELAY − unreported − lead` (`heardSongPos`); before a voice sounds, the same place from the room's clock
  (`serverSongPos` — the e2e reads the two 0–1 ms apart, no jump when the song starts). `atCtx(songT) = voice.origin + songT + lead` for the SFX,
  the countdown ticks + the finale (the song + the sound leave through the same speaker: no speaker term). `beatPulse` = the world's flash.
  `unreported` = 0 when the browser reports a latency (outputLatency, or an output timestamp lagging > 3 ms), else WebKit's 20 ms (the city's
  IOS_OUT figure).
- **THE MEASURED LEAD** (the city's approach — `core/harbor-beat.js#createLead / leadKick`, one per song): a listener on PRISM's song chain, BEFORE the
  danger filter. **First try** (an FFT's dB bins 1–3, hits ≥ 0.35): on c2-day8 it settled at **+82 ms** — but the city trusts that grid (98 % of its
  kicks agree) and ours matches it (below), so that was the LISTENER's own delay. **Now the city's own listener** (`beat.js#analyser`: a 150 Hz
  low-pass → a 1024 analyser's TIME-DOMAIN RMS, pulled through a silent gain; strong kicks ≥ 0.6): c2-day8's kicks land **within ±10 ms** of the
  grid, the lead locks at **−3 ms**. The lead is bounded to **±60 ms** (`LEAD_CAP`) and only applied once settled: kicks that pull it further sit OFF
  the beats → the song is DEAF, the grid alone (lead 0 — never a wrong shift). Measured in Chrome (the browser pane): Summer Felt Longer Then
  (syncopated kicks ~100–340 ms off) → deaf after 19 kicks; prism1 (its kicks scatter) → deaf; c2-day8 → −3 ms locked. A trusted grid always
  punches; the kicks only trim it.
- **What no page can hear**: a Bluetooth / TV delay iOS doesn't report → SETTINGS → SPEAKER DELAY (☰ → Settings, in a match too — OFF · 50 · 100 ·
  200 · 300 ms): now the song plays that much earlier AND the lights + the clears hold back the same.
- **THE BEAT CHECK** (for Ben's phone): `prism-preview.html?beat=1&song=<id>` — a full-screen flash on every beat AS HEARD (the downbeat brightest),
  TAP FOR SOUND, a readout (the song, the set, the beat in the bar, the lead + its state, SPEAKER DELAY, the unreported delay, PLAYING / first slice);
  `&at=s` starts it s into the song (default 1 s). The preview installs the audio engine's tap listeners (app.js#installAudio) for it.
- Unit (`tests/prism-sound.test.mjs`): a known lead → the visual beat at song time + lead (+ the speaker after the graph) — the SFX, the visual + the
  kick one moment; the server fallback = the voice's clock; the unreported rule; 18 ms late kicks → the lead learns 18 ms (±6), scattered kicks move
  nothing; the wrap ± half a beat.

## Group 2 — QUICK START
- `synced-songs.js` `createSyncedSongs({ quick: true })` (PRISM only — the stations / party deck / lobby song / SLIPSTREAM unchanged): `quickDecode`
  STREAMS the file (ONE request) and decodes the first **12 / 30 / 75 s** from BYTE 0 as the bytes arrive (`core/mp3-slice.js#prefixCut` — a frame
  boundary, the ID3 tag + the Xing/LAME header kept) → the same samples as the whole decode. A voice starts from a slice at once on the same
  schedule; `swap()` moves it to the longer slice / the whole song on ONE SAMPLE (`start(T, T − origin)` + the old `stop(T)`; the gain carries on —
  `sync-math.js#envelopeFrom`). A part never marks a song done; no slice while the rest is < 1.2 s away (good signal = one decode, as before).
- **First try 6 / 20 / 60 s** — the e2e caught it: GO lands up to ~6 s into an 80 BPM song (3.2 s + up to a bar), the 6-s slice no longer covered GO
  (silent at GO). 12 s first.
- **The 8-phone run caught the next one:** the throttled phone shares its 50 KB/s with the room's own traffic (8 live boards) — the song got
  ~17–24 KB/s, barely over its own 14; at GO nothing had decoded. Now a slice is cut to cover the song's place now + 6 s (`need()`), the song due
  + nothing sounding takes whatever has arrived (if it covers the moment + 1 s), and a slice running low (< 3 s left, in the first 45 s) is
  re-cut from what has arrived (≤ 8 slices). 79 / 79.
- **FAST caught the last one — a CUE-IN:** Feeling Human Again starts 35.7 s into its file; slices from byte 0 had to download the whole intro
  (~500 KB) before the cue could sound. **RANGE MODE**: measured first in Chrome — a slice that starts mid-file (two lead frames) decodes to the
  whole file's samples EXACTLY (difference 0) at a constant +1105 samples (LAME's 576 + the decoder's 529) on every file tested; so a cue-in ≥ 1.5 s
  streams from a frame ~1.5 s before the cue (a Range request + the first 4 KB beside it to place that frame), every buffer carrying its sample 0's
  file time (`bufferT0`). The intro is never fetched. e2e: the three cue-in songs' range streams = the whole song's samples (0); Slow 3G dealt
  Feeling Human Again — **audible at GO** from a range slice at 42.2 s, 4 on-sample swaps to the whole.
- **ONE request, not two:** the first range version fetched the file's first 4 KB beside the range to place its frames — on Slow 3G that cost a
  second 2-s latency (first byte 4.2 s) and one run missed GO. The build now records each day song's first audio frame's byte (`ff` — 409 on all
  five; Python + the JS frame walker agree), the host deals it in the game beside the cue-ins (`game.ff`), and the phone makes ONE Range request
  ~0.5 s before the cue (first byte 2.07 s); the two-request path stays as the fallback (the e2e checks both: the same samples).
- **Proof** (e2e-prism soundChecks, both paths): every one of the 10 song files — a 12-s + a 30-s slice decode to the SAME samples as the whole
  (**the largest difference 0**); a NIGHT-look phone on **Slow 3G** (Chrome's preset: 50 KB/s, 2 s latency) in a DAY host's SCORE RUSH: **the day
  song sounding at GO** (308 ms after GO, gain 1, from the 12-s slice), then **2 swaps (12 → 30 s → whole), 0 re-places, never 2 voices**. The
  preload stays the analysis JSON only (≤ 1.5 MB untouched; the song never preloaded).

## Group 3 — THE DAY SONGS (`python scripts/build-prism.py --day`)
The originals only read (Downloads\grok\PrismDay — not day-nebula.mp3; Ben's **original** `Downloads\day\day8.mp3` — its md5
`eb43c3526a3093b9f301f4812ecfc568` = the city's own import record of c2-day8, so it's THE file; encoded from it, no second lossy step from the 112k
copy). Two-pass loudnorm (−14 LUFS, TP target pulled down until the ENCODE holds −1 dBTP), 112 kbps stereo 44.1 kHz. THE DAY SEARCH is octave-aware
(the night search folds into 90–180 BPM: the 80 BPM songs came out of librosa at 159–164).

| id | song | BPM (measured · Claude chat) | key | length | cue-in | last strong beat | loudness | phase by quarter (ms) · trend · scatter | beat / half-beat | world | MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| prismd1 | Roof Tops | **79.992** · 80.00 | C# minor | 214.44 s | **2.961 s** | 204.762 s | −14.9 → **−14.4 LUFS**, −0.2 → −1.5 dBTP | 10, 5, 0, −6 · −15.9 · 0.4 | 2.77 | sunset | 3.00 |
| prismd2 | Summer Felt Longer Then | **79.997** · 80.00 | E major | 227.95 s | **2.229 s** | 216.767 s | −20.2 → **−14.4**, −0.1 → −1.3 | 38, −3, 34, 32 · 5.7 · 27.3 | 1.50 | city | 3.19 |
| prismd3 | The Last Long Day | **83.000** · 83.0 | A major | 144.53 s | 0 | 134.467 s | −14.3 → **−14.4**, −0.1 → −1.5 | 0, 1, −1, 1 · 0.3 · 1.3 | 1.49 | crystal | 2.02 |
| prismd4 | Feeling Human Again | **79.010** · 79.00 | A# major | 230.83 s | **35.706 s** | 220.269 s | −13.9 → **−14.4**, +0.2 → −1.2 | −19, −15, −3, 0 · 20.7 · 2.8 | 1.52 | aurora | 3.23 |
| prismd5 | c2-day8 (the owner's) | **109.999** · 110.0 | G major | 133.15 s | 0 | 123.927 s | −10.4 → **−14.4**, +0.5 → −3.2 | −1, 2, 0, 2 · 2.1 · 1.6 | 2.05 | nebula | 1.86 |

- Every tempo within **0.01 BPM** of Claude (chat)'s (the bar: 0.1). Matched to each other: all five **−14.4 LUFS** (0.0 apart; the linear loudnorm
  lands 0.4 under the −14 target with the true-peak held — kept, not pushed).
- **Summer Felt Longer Then — the laid-back snare:** the first build STOPPED it (the night rule "every quarter's phase within 20 ms": 38 / −3 / 34 / 32).
  Not a drift — the tempo is right (Δ −0.003) and the quarters show no TREND (5.7 ms across the song); one section sits ~37 ms off the other three
  (the groove). **Not on the half-beats:** the grid's onsets 1.50× the half-beat grid's. The check was rewritten to what the brief asks — the BPM ±0.1,
  NO DRIFT (trend ≤ 25 ms), the groove's scatter ≤ 45 ms, beats ≥ 1.15× half-beats. Tried + dropped: the grid at the quarters' MEDIAN phase (+33 ms)
  — its beat / half-beat ratio fell to 1.05: the whole song's comb peak IS the phase. At run time its kicks sit off the beat (syncopated) → the
  listener makes it DEAF (the grid alone).
- **c2-day8 vs the city's grid:** ours puts the first beat at 0.107 s, the city's `mood-music.json` at 0.048 — the city's `c2-day8.mp3` is 71 ms SHORTER
  than the original (its import trimmed the start); our search on the original + on prismd5 both give 0.107. The kicks confirm ours (±10 ms, above).
- **Cue-ins:** Feeling Human Again's first 36 s are a quiet intro (−17 dB RMS, the full beat at 36 s: −10 dB) → the schedule starts the file at its
  first strong downbeat, 35.706 s (the song keeps 184 s). Roof Tops + Summer Felt Longer Then skip their first ~2–3 s. A cue sits 30 ms before its
  downbeat; the voice ramps in over 12 ms (no click).
- Titles + artists in the manifest; ☰ → CREDITS: the four HoliznaCC0 tracks (CC0 — credited anyway, each with its FMA page). The night files +
  their JSONs byte-identical (md5 before/after); the manifest's night rows identical (a check), the day rows after them with `look` + `cue`.

## Group 4 — THE HOST's LOOK PICKS THE ROOM's SET
- `index.js#start`: the host's resolved look (THE GAME LOOK — AUTO = its sun: `kit/look.js`) → `logic.js#dealSongs` → `game.set` + `songs` + `sd`
  + `cu` (only when a song has a cue); `logic.js#matchTiming` = GO on a downbeat ≥ 3.2 s into the schedule + SCORE RUSH's end on the last strong beat,
  both on the song's own grid (cue included). NIGHT deals byte-for-byte as before (a test compares with the old deal). DAY: the seed `<room>:day`,
  its position in `meta/used/prism/dn<N>` (`dayPos` / `dayKey` — the director's final `$room`; the paper's `pp<k>-<i>` keys live beside it).
- Day slots (`slotOf`): `sd = lastBeat − cue + 4 s` → BATTLE / SURVIVAL's crossfade starts AT the day song's last strong beat; the night slots stay
  whole songs. RUSH_MAX_S (the board's SCORE RUSH bound) 240 → 241 (the longest song is now Feeling Human Again, 230.8 s — its test said so).
- Whole-match simulations (`tests/prism-sound.test.mjs`): a DAY host deals the day set to 8 phones (every phone derives the same song from the game
  alone), a host change mid-match = the same patch + the set kept, the day playlist moves on in the night's memory; a NIGHT host's deal unchanged +
  `meta/prism/n` as before; SCORE RUSH on Feeling Human Again (cue 35.7 s): GO on a downbeat, the end ON its last strong beat, the director ends it
  there (a replay = the same patch); the night timing = the pre-PD-5A timing for all five.
- E2E: Match A pinned NIGHT (the host's look) → the night set; soundChecks' DAY host + NIGHT phone → the day song on the night phone; Match B (full
  path, after the host was killed) pinned NIGHT on the NEW host → its look picks the set.

## Tests
- Unit: **1467 → 1479** (`tests/prism-sound.test.mjs` 12 new; profiles' C3 test → RUSH_MAX_S 241).
- e2e-prism **FAST 56 / 56** · **FULL 81 / 81** (PD-4's 45 / 69 + the sound checks). The Slow 3G check judges the line AS DELIVERED: Chrome's preset
  asks 50 KB/s, this harness gave the stream 12–37 KB/s run to run (measured — nothing else fetched); below 1.25× the song's own 14 KB/s no player
  can carry a song through its opening, so the check reports those numbers without judging; every judged run passed (19.6–36.9 KB/s, incl.
  Feeling Human Again's range start). THREE OLD BOT RACES in the full path, each red once in the 8 runs, hardened in the test (never in the game):
  SPECTATE read after the duel had already ended (now read at the duel's start), the duel a coin flip between two skill-1 bots (the test's winner
  plays its best, the other weaker), the host topped out by junk the instant before its phone "died" (its bot stopped + board cleared first).
- Smoke **6 / 6**; rules **69 / 69**; /api **44 / 44**.
- e2e-harbor `ONLY=music,partysync,stations,musiccache` **130 / 130** (synced-songs.js is shared: the stations, the party deck, the lobby song).
- The preload graph regenerated (prism: 42 modules, 390 KB).

## Not at the bar / for the owner
- **The by-ear check on a real iPhone** — the heard beat is proven in Chrome (the kicks on c2-day8 ±10 ms); iOS reports no latency, so its 20 ms is
  the city's figure. `prism-preview.html?beat=1` on the phone is the check (links in the summary). Bluetooth on an iPhone still needs SPEAKER DELAY.
- **Most songs end up DEAF** (the grid alone) — lo-fi + these synth songs don't put a kick on every beat; that's the safe outcome (the grid as built,
  checked offline), not a fault. The lead only refines songs with four-on-the-floor kicks.
- WebKit can't run on this machine (Playwright's WebKit install fails) — the slices' sample identity + RANGE MODE's 1105-sample offset are proven in
  Chrome only. If Safari's decoder trims a headerless stream differently, a cue-in song's range start would sit off by that much on an iPhone
  (the swap to the whole song would then shift once) — the by-ear check covers it: `?beat=1&song=prismd4` (the long cue-in).
- Below ~1.2× the song's bitrate (a room's traffic on a very bad line) the opening can still gap between slices; the whole song follows.
