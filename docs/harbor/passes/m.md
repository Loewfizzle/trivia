# M — CITY 2.0 MUSIC (Oct 23 2026; the owner's mood songs + the MUSIC MOOD setting; City 2.0's music behind `?city=2`, the setting in both cities)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## M — CITY 2.0 MUSIC (Oct 23 2026; the owner's mood songs + the MUSIC MOOD setting; City 2.0's music behind `?city=2`, the setting in both cities)
The detail lives in docs/audio.md#city-20-music; this is the handoff.
- **Songs:** the owner's five ~/Downloads folders (morning 11 · day 11 · evening 14 · late 11 · party 9 = 56 files; victory + neon ignored) → 51 stored + 1 reused:
  morning4–7 = day4–7 byte for byte (one file each, in two decks), her morning10 in MORNING + LATE NIGHT (one file), evening3 = the repo's slip8 (M2: dropped — City 2.0 never plays City 1.0 songs). 112 kbps stereo MP3, trimmed,
  −16 LUFS / ≤ −1 dBTP; **+144.5 MB** (the owner chose to commit them as they are; `MUSIC_BASE` in js/config.js moves them to a CDN with one change — js/audio/music-url.js).
- **One command to add more:** drop files in the folders, `python -I scripts/add-city2-music.py` (docs/audio.md).
- **Rule + decks:** `core/city-mood.js` (dawn / 11 am / golden hour 10° / 11 pm / the party show once `partyReady`) on the Harbor's own clock (`core/city.js#setCityClock`, registered by
  `scene.js` — so `&when= &speed=` and the preview panel move the music). Decks in `data/mood-music.json` `city2`; City 1.0's lists untouched.
- **Setting:** `settings.musicMood` (AUTO + five moods), a row in the settings sheet, both cities; the lobby follows the HOST. A forced change (a picked mood, the party starting) crossfades 4 s
  (`music.js#switchNow`); a natural change waits for the song. The preview panel's MUSIC section (mood, SKIP, the song + its grid status) and `&mood=`; the readout's `music` line.
  M4: the MUSIC row says where the mood comes from (THIS PANEL / THE MUSIC MOOD SETTING ON THIS PHONE / AUTO · THE CITY'S CLOCK) — the owner's "music
  MORNING all day" was her phone's own setting; the panel's AUTO + CLEAR ALL put that setting back to AUTO (docs/audio.md#m4).
- **Beat grids:** all 51 have one; **15 are not trusted** (docs/audio.md lists them: steady for the whole song AND the kicks land on it ≥ 50 % or a strong onset lock) — the city follows the
  kicks it hears on them (`untrusted` in `beatSource`, ignored by `advanceHarborBeat`). Ear-checked: no (no audio output here) — the offline replay of the real kick listener stands in for it.
- **Tests:** `tests/city-music.test.mjs` (15), e2e-harbor group `music` (38 checks: the five preview links, the setting's crossfade + AUTO, natural vs forced, party start, `&mood=`, the panel row +
  SKIP, City 1.0 untouched), e2e-lobbysong 9/9. Screens: the settings row at 390 / 402 / 412, the panel's MUSIC section at 402.
### Known issues (M)
- `e2e-mood.mjs`'s lobby part ("host playing the room song") times out on this machine **on the untouched baseline too** (checked in a worktree at 254eda7) — a pre-existing harness / environment
  problem; `e2e-lobbysong.mjs` covers the same ground and passes.
- A lobby's room song does not switch mid-song when the HOST changes mood (the next song comes from the new mood): the synced player schedules its fade-out once per song, a mid-song queue rewrite
  would need it to re-plan. Outside a room the switch is a crossfade.
- The 1440×900 shot of the settings sheet shows the title (the sheet closed on the viewport change in the test); the row is the same markup as the phone's.
- The songs' loudness is −16 LUFS; City 1.0's older songs average −12 (M2: slip8 is out of City 2.0's EVENING, so its decks are all at one level).
### Handoff → Part 6b (the special-occasion sky)
Nothing in 6b needs the music, but its TR-3B "power-down" effect (plan.md) plugs into `music.js` (`filterMusic`, `duckMusic`) and
`beat.js#songInfo` says which song + whether its grid is trusted. The harbor's clock is now shared with the audio (`core/city.js`): a new clock override (a CITY CONTROL time jump, Part 13) only has to
mutate the scene's `clock` and the music follows.
