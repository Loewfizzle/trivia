# FREEFALL — the sounds (all CC0 1.0)

The owner's picks (take A of each), copied byte for byte from the delivery (`Downloads\grok\freefall\sfx\` — its `notes.txt` has
each source's page, the processing and the measured loudness): `python -P -E scripts/build-freefall-assets.py`.
MPEG-1 Layer III, 192 kbps CBR, 44.1 kHz. Every source was verified CC0 1.0 on its own page; no CC BY material is used.

| file | source |
| --- | --- |
| `bounce.mp3` | "C4.wav" by joesh2, CC0 1.0. https://freesound.org/s/577691/ |
| `whoosh.mp3` | "Whoosh - Weighted string - Airy whistle" by Sadiquecat, CC0 1.0. https://freesound.org/s/855733/ |
| `blaze.mp3` | "Fire Burst Flash" by Za-Games, CC0 1.0. https://freesound.org/s/539972/ · "ignite_flame_01" by DaUik, CC0 1.0. https://freesound.org/s/798713/ |
| `shatter.mp3` | "Break something (ice/glass/...)" by Aurelon, CC0 1.0. https://freesound.org/s/422633/ · "Smash.ogg" by egomassive, CC0 1.0. https://freesound.org/s/536777/ |
| `crash.mp3` | "zap1" by Kenney (www.kenney.nl), CC0 1.0. https://kenney.nl/assets/digital-audio · "impactPunch_heavy_000" by Kenney (www.kenney.nl), CC0 1.0. https://kenney.nl/assets/impact-sounds |
| `lights-out.mp3` | "MnG - Power Down.wav" by SergeyIonov, CC0 1.0. https://freesound.org/s/467405/ |
| `bottom.mp3` | "Underwater Deep Impact" by Sheyvan, CC0 1.0. https://freesound.org/s/470084/ · "Sparkling Star 01.wav" by LilMati, CC0 1.0. https://freesound.org/s/462095/ |
| `skylight.mp3` | "neon tube smash explode shatter glass debris.flac" by kyles (Freesound 453499), trimmed — CC0 1.0. https://freesound.org/s/453499/ |
| `splashdown.mp3` | "Foley_Natural_Water_Jump_Mono.wav" by Nox_Sound (Freesound 585744), trimmed — CC0 1.0. https://freesound.org/s/585744/ |
| `fireworks.mp3` | "Firework during New Years Eve @ Groningen.wav" by JelleGeus (Freesound 179987), trimmed + softened — CC0 1.0. https://freesound.org/s/179987/ |

THE BREAKTHROUGHS' three (`skylight` · `splashdown` · `fireworks` — `Downloads\grok\freefall\breakthroughs\`, its `notes.txt` +
`notes-fireworks.txt`) are byte copies too; `skylight` + `splashdown` come in about 7 dB quieter than the rest (−23.4 / −23.7 LUFS
against ≈ −16): they are loudness-matched by their GAIN in `js/games/freefall/sounds.js` (the build machine has no MP3 encoder).

Area arrival + NEW BEST are JAYWALK's files (`audio/jaywalk/area-arrive.mp3` · `new-best.mp3` — `audio/jaywalk/CREDITS.md`).
