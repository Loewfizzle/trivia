#!/usr/bin/env python3
"""CITY 2.0 — THE CITY SOUNDS: import the owner's recordings into their SLOTS (docs/audio.md#the-city-sounds). The one command:

    ~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city-sfx.py              # import what's in ~/Downloads/city-sfx/
    ... --dry-run                 # say what it would do, change nothing
    ... --only gulls,water-lapping   # just these slots
    ... --src <folder>            # another folder

Drop a file named after its slot into ~/Downloads/city-sfx/ — `<slot>.wav` (any common format: wav / flac / mp3 / m4a / ogg / aif),
more TAKES of a one-shot as `<slot>-2.wav`, `<slot>-3.wav` … — and run it. The slot ids are the rows of js/core/city-sounds.js.
For each file (the originals are never touched — read only, decoded through ffmpeg):
  * the CUT: a row in CUTS below (hand-picked cut points: the loop's window, the one-shots in a long recording, a take's weight,
    extra slots that share it); with no row, a sensible default (a loop: the whole file less 1 s at each end; a one-shot: the
    whole file, trimmed where it rises above / falls under −45 dB of its peak)
  * mono 32 kHz (the city's ambience sits under the music on a phone speaker: mono is fine and the decoded buffers stay small)
  * a gentle LOW CUT (2nd-order high-pass, 120 Hz by default) so it reads on phone speakers; an optional presence LIFT (+dB at
    2.5 kHz) for bass-heavy recordings
  * THE RECIPE (the sky, Oct 24 — a CUTS row's extras): `lp` a low-pass (Hz: distance), `notch` [Hz …] (a modern drone's lines
    cut out), `lowmid` +dB at 300 Hz (a rumble a phone's speaker still hears), `layers` [(offset s, rate, gain) …] (a loop built
    from copies of one recording, detuned + offset: the drone swarm), `blackout` s (the power-down: the mains hum cut dead with
    a low thump there → `hit` in the registry). A source named after what it is maps to its slot through ALIAS
  * 8P's extras: `presence` (dB, Hz) a broad peaking lift (Q 0.7) — the aircraft's "phone presence" around 1–3 kHz, where a phone's
    speaker still plays; `gainenv` [(t0, t1, dB) …] in the take's own seconds (a spooky creak softened, a slam taken down), 30 ms
    ramps; `gate` dB under the take's loudest 10 ms (a soft 1:2 expander: the hiss between a quiet recording's snips); `seq`
    [(file | None, t0, t1, at, dB) …] a take ASSEMBLED from pieces (None = this file; another file in the folder by name) placed at
    `at` s — the knock sequence; `mark` s into the take → `hit` in the registry (where its event lands: a door's latch, a sash
    meeting the sill — callers align it); `to` the slot this cut goes to (one source, several slots); `name` its file's stem;
    `kbps` its bitrate (a low-passed bed: 40). SKIP names the folder's files that are never imported (stand-ins, alternatives,
    files that failed the checks)
  * 11a-2's extras (the Thanksgiving + parade set): `af` an ffmpeg audio filter chain run at DECODE, before the mono fold (a 5.1
    file's own fold-down with `pan=mono|…` — ffmpeg's default downmix assumes FL FR FC LFE BL BR, wrong for a film-order L C R Ls Rs
    LFE file; a 78's `adeclick,anlmdn`); `deess` (dB, lo, hi) a soft dynamic cut of the lo–hi band where it pokes over its own
    median (≤ dB: the kids' squeal, the 2–6 kHz harshness); `mixin` {f, at, lu, hp, lp} ANOTHER recording of the folder laid under a
    LOOP — read continuously from `at` s for the loop + its tail (so the seam stays seamless), its own low cut / low-pass, `lu` LU
    against the main recording (the parade's adult murmur under the kids); `verb` (wet, pre-delay s, RT60 s, lp Hz) a simple hall
    — a synthetic impulse (seeded noise, an exponential decay, low-passed: never brighter), pre-delayed, mixed `wet` (0–1) at the
    dry's own RMS, after the mixin. The files keep the house levels (below): the brief's quieter beds are the SLOT's gain
  * a one-shot's PEAK = the loudest 0.3 s of its RMS envelope (s) and its SWELL `sw` = where it stays within 15 dB of that —
    measured on the encoded file (the motorcar lines its crossing up with them: FP3)
  * a LOOP keeps its window + a TAIL (the audio right after it, `xf` s): audio/city-sound.js crossfades the tail into the head at
    runtime (equal power) — seamless whatever padding the MP3 decoder adds; no fades baked in
  * a ONE-SHOT gets a raised-cosine fade in / out over its tail
  * levelled (ITU-R BS.1770 K-weighted, gated — build-neon-sfx.py's meter): loops −24 LUFS, one-shots −20 LUFS, a soft peak
    limiter at −2 dBFS (the MP3 encode overshoots a little)
  * encoded: MP3, mono, 32 kHz, 64 kbps → audio/city/<name>.mp3 (decodeAudioData plays MP3 everywhere, iOS 16 included)
  * REGISTERED in js/core/city-sounds-files.js (generated: the takes per slot) and CREDITED in audio/city/sources.json +
    audio/city/CREDITS.md (each source's block from the folder's credits.txt; a licence that doesn't say CC0 / Sonniss /
    royalty-free is flagged)
Then: node --test tests/city-sounds.test.mjs, and commit audio/city/ + js/core/city-sounds-files.js.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import imageio_ffmpeg
from scipy.signal import lfilter, butter, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
SLOTS_JS = ROOT / 'js' / 'core' / 'city-sounds.js'
FILES_JS = ROOT / 'js' / 'core' / 'city-sounds-files.js'
OUT = ROOT / 'audio' / 'city'
CREDITS = OUT / 'CREDITS.md'
SOURCES_JSON = OUT / 'sources.json'           # what was imported from where (+ each source's credit block): the importer's record
SRC = Path.home() / 'Downloads' / 'city-sfx'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
AUDIO = ('.wav', '.flac', '.mp3', '.m4a', '.ogg', '.aif', '.aiff', '.aac')
SR = 32000
LOOP_LUFS, ONCE_LUFS = -24.0, -20.0
CEIL_DB = -2.0
BITRATE = '64k'

# THE CUTS (Part 8a, the owner's first recordings — measured: per-second band energies, onsets, narrow-band peaks for horns /
# bells / voices; docs/audio.md#the-first-recordings has the why). Times in the SOURCE file's seconds.
#   loop: (start, length) + xf (the tail crossfaded at runtime) · cut: (start, end) for a one-shot · fin / fout: its fades (s)
#   hp: the low cut (Hz) · lift: + dB at 2.5 kHz · w: the take's weight (default 1) · also: more slots that share this take
#   rate: the sample rate the PLAYER decodes it at (r in the registry; default 32 kHz) — a hum with nothing above ~6 kHz
#   decodes at 16 kHz: half the memory of a minute-long buffer, nothing lost
PRESENCE = (5.0, 2000)
CUTS = {
    # ---- PART 9a — THE WEATHER (measured: tests by loudness envelope + tonality — no words, no melody found; Grok's chain: a low cut, a
    # touch of phone saturation on the low ones, distance by low-pass; the beds' level set at runtime ×slot gain)
    # (2:23 "Balkan street rain echo": steady −32…−38 dB the whole way — a long window, a little presence for the patter)
    # (11a-1 — HALLOWEEN: the ghost ship's creak + the haunted wind lean like the weather beds — heard rarely, low, under the music)
    'ghost-ship-creak': [{'loop': (1.9, 28.5), 'xf': 2.5, 'hp': 90, 'lp': 7000, 'rate': 22050, 'kbps': 40}],
    'haunted-wind': [{'loop': (1.4, 24.0), 'xf': 2.5, 'hp': 120, 'lp': 6000, 'rate': 16000, 'kbps': 40}],
    'rain-pavement': [{'loop': (6.0, 34.0), 'xf': 2.5, 'hp': 140, 'presence': (2.0, 1800), 'rate': 22050, 'kbps': 48}],
    # (0:39 a light rain loop, flat ±1 dB: nearly all of it)
    'rain-drizzle': [{'loop': (1.0, 32.0), 'xf': 2.0, 'hp': 160, 'lp': 9000, 'rate': 22050, 'kbps': 48}],
    # (1:06 rain + small waves — a wave every ~10 s (−20 vs −28 dB): far off across the harbor, low-passed)
    'rain-water': [{'loop': (2.0, 32.0), 'xf': 2.5, 'hp': 140, 'lp': 5200, 'rate': 16000, 'kbps': 40}],
    # (1:02 rain on a tarp, steady −25 dB: close under the awning)
    'rain-awning': [{'loop': (2.0, 32.0), 'xf': 2.5, 'hp': 150, 'rate': 22050, 'kbps': 48}],
    # (0:52 a storm's rumble: a crack at ~1 s rolling away to ~12 s, a second roll at ~32 s — two takes, far: low-passed, the lows
    # through the phone's saturation)
    'thunder-far': [{'cut': (0.0, 14.5), 'fin': 0.04, 'fout': 3.5, 'hp': 45, 'lp': 3200, 'sat': (4.0, 1.2, 140), 'rate': 16000, 'kbps': 48},
                    {'cut': (30.6, 47.0), 'fin': 0.4, 'fout': 3.5, 'hp': 45, 'lp': 2600, 'sat': (4.0, 1.2, 140), 'rate': 16000, 'kbps': 48}],
    # (0:43 wind in leaves on a street — its first 9 s carry a tonal hum: the steady 17–39 s)
    'wind-leaves': [{'loop': (17.0, 22.0), 'xf': 2.0, 'hp': 160, 'rate': 22050, 'kbps': 48}],
    # (1:49 a harbor's foghorn — blasts at ~8, 28, 38, 48 … s over water + wind: three separate blasts, far: low-passed + saturated)
    'foghorn': [{'cut': (4.5, 15.5), 'fin': 0.3, 'fout': 2.5, 'hp': 70, 'lp': 2400, 'sat': (5.0, 1.4, 180), 'rate': 16000, 'kbps': 48},
                {'cut': (24.5, 35.5), 'fin': 0.3, 'fout': 2.5, 'hp': 70, 'lp': 2400, 'sat': (5.0, 1.4, 180), 'rate': 16000, 'kbps': 48},
                {'cut': (35.0, 45.5), 'fin': 0.3, 'fout': 2.5, 'hp': 70, 'lp': 2400, 'sat': (5.0, 1.4, 180), 'rate': 16000, 'kbps': 48}],
    # (2:01 summer-night crickets, steady: a minute of it)
    'crickets-night': [{'loop': (20.0, 32.0), 'xf': 2.5, 'hp': 300, 'rate': 22050, 'kbps': 48}],
    # (0:32 morning birdsong, −35…−41 dB)
    'birdsong-morning': [{'loop': (2.0, 26.0), 'xf': 2.0, 'hp': 300, 'rate': 22050, 'kbps': 48}],
    # (0:33 a gutter dripping, steady)
    'gutter-drip': [{'loop': (1.0, 29.0), 'xf': 2.0, 'hp': 200, 'rate': 22050, 'kbps': 48}],
    # (2:03, a boat ramp: the steadiest of all; 0–3 s fades in in the source) — 60 s of it is plenty for lapping water
    'water-lapping': [{'loop': (8.0, 60.0), 'xf': 2.5, 'hp': 110}],
    # (1:57, NYC's waterfront across the water: a steady wash under 2 kHz + a faint 266 Hz drone; nothing horn-like found. 65–82 s
    # and 99–115 s carry a louder rumble, 87 s a bright click: the steady first stretch)
    'city-hum-day': [{'loop': (4.0, 70.0), 'xf': 2.5, 'hp': 120, 'rate': 16000}],
    # (4:17, a Berlin rooftop at night: CHURCH BELLS 4–42 s (partials 1.5 / 2.0 / 2.4 / 2.9 / 3.4 kHz) and one more strike at
    # ~63 s; low swells at 81–95 s and 207 s; faint whistle-like chirps at 193–203 s; very bass-heavy → 100–170 s, a low cut and
    # a presence lift)
    'city-hum-night': [{'loop': (100.0, 70.0), 'xf': 2.5, 'hp': 140, 'lift': 3.0, 'rate': 16000}],
    # (3:10, a 1929 Volvo PV4, two slow passes with digital silence between: the first peaks at ~21 s, the second at ~135.5 s)
    # 6b — THE POLICE CARS (the owner: cut from the Volvo, not Grok's Fox Audio "Old_Car_Short_Passby_06"): each WHOLE pass — the
    # slow roll in from far (7 / 116 s: 22 / 36 dB under its peak), by, and away (to 38 / 148.5 s) — 31–32 s, longer + slower than the road's
    # everyday 18 s takes: old engines rolling by
    'car-1920s-pass': [{'cut': (13.0, 31.5)}, {'cut': (127.0, 146.5)},
                       {'cut': (7.0, 38.0), 'to': 'police-car-1920s', 'name': 'police-car-1920s_1', 'fin': 2.5, 'fout': 3.0},
                       {'cut': (116.0, 148.5), 'to': 'police-car-1920s', 'name': 'police-car-1920s_2', 'fin': 2.5, 'fout': 3.0}],
    # (0:31, a 1954 MG TF: a quick sporty pass peaking at ~18.5 s — newer than the era: a rare variety take)
    'car-1920s-pass-2': [{'cut': (9.0, 27.0), 'w': 0.15}],
    # (7:01 mono, a 1945 Mercedes L3750 truck — "Start_Slow_Away_Up_Reverse_Stop_Away_By_Up_Stop_Off": four takes, 2–31 / 72–131
    # / 280–307 / 394–419 s, digital silence between) — the clean distant drive-by at 281–307 s, peak ~291 s: a slow, heavy pass,
    # also the dawn delivery truck. 8P — THE BUS (the owner: the truck, more period-correct than the diesel stand-ins), measured
    # (per-0.25 s level + the engine's firing line): take 1 = a start (3.5-5.5 s), an idle settling 6.0-7.5 s then steady 7.75-10.5 s
    # (66.9 Hz firing), then SLOWLY AWAY 10.4-30.4 s (revs to -40 dB at 12-19 s, then a steady 80 Hz note fading with distance) =
    # THE PULL-AWAY; take 4 = UP + STOP + OFF: far (-61 dB at 395 s) -> near (-43 at 410) -> settled into its stop idle at 414.0 s
    # (64 Hz, level flat to 417.6) -> the engine off at 418.5 (left out) = THE ARRIVAL (397-417.6 s, `mark` 17.0 = the stop) and THE
    # IDLE: that same stop idle looped (414.3 + 2.6 s, seam +0.4 dB) - the same pitch as the arrival's end, so the hand-over is
    # seamless (take 1's idle at 67 Hz was the first try: its level drifts 2 dB). Low-mids + presence lifted: an engine is mostly
    # < 150 Hz, which a phone can't play
    'car-1920s-pass-3': [
        {'cut': (283.0, 306.5), 'w': 0.35, 'also': ['truck-delivery'], 'name': 'car-1920s-pass-3'},
        {'cut': (397.0, 417.6), 'to': 'bus-arrive', 'name': 'bus-arrive', 'fin': 2.5, 'fout': 1.2, 'hp': 70, 'lowmid': 3.0, 'presence': (3.0, 1500), 'mark': 17.0, 'rate': 16000},
        {'loop': (414.2, 2.6), 'xf': 0.8, 'search': 0.2, 'to': 'bus-idle', 'name': 'bus-idle', 'hp': 70, 'lowmid': 3.0, 'presence': (3.0, 1500), 'rate': 16000},
        {'cut': (10.4, 30.4), 'to': 'bus-pull-away', 'name': 'bus-pull-away', 'fin': 0.6, 'fout': 4.0, 'hp': 70, 'lowmid': 3.0, 'presence': (3.0, 1500), 'rate': 16000},
    ],
    # (0:52, the lossless Freesound original; a city's low rumble under it. 0–13 s: single calls with clean harmonic arches at a
    # ~1.1–1.3 kHz fundamental — gull "kyow"s; 13 s on: a whole colony chattering at once, no single calls. Broadband clicks at
    # 5.4 / 6.75 / 12.25 s stay outside the takes. A high low-cut: the call is all that matters)
    'gulls': [
        {'cut': (0.15, 1.95), 'fin': 0.08, 'fout': 0.7, 'hp': 350},
        {'cut': (2.05, 3.65), 'fin': 0.08, 'fout': 0.6, 'hp': 350},
        {'cut': (3.7, 5.2), 'fin': 0.08, 'fout': 0.6, 'hp': 350, 'w': 0.6},
        {'cut': (6.85, 8.6), 'fin': 0.08, 'fout': 0.7, 'hp': 350},
    ],
    # ---- THE SKY (6b, Oct 24 — the owner's notes, every cut CONFIRMED by measurement: per-second band energies, the 0.3 s RMS
    # envelope, spectrograms 0–4 / 0–12 kHz for voices / PA / crowd in 300 Hz–3 kHz; docs/audio.md#the-sky-sounds has the why).
    # The aircraft are FLYBYS — one-shots with their own swell, chained while their thing is up (harbor/sounds.js#run).
    # 8P — PHONE PRESENCE (the owner: louder still, the jets REALLY loud): a phone's speaker plays nothing of the low roar, so every
    # aircraft gets a broad lift where it does play — `presence` (+5 dB at 2 kHz, Q 0.7: ~1–3.5 kHz) on the flybys, +3 dB just
    # under the low-pass on the burner (1.6 kHz) and the drone swarm (1.1 kHz); re-levelled to the same LUFS, so the lows give way
    # and the phone band comes up (measured: docs/audio.md#8p)
    # (0:44 Pixabay MP3, a distant helicopter: ~all of its energy under 80 Hz (wind rumble) — the chop 100 Hz–1.5 kHz is the sound)
    'heli-flyby': [{'cut': (1.0, 44.0), 'presence': PRESENCE, 'fin': 2.0, 'fout': 2.0, 'hp': 100, 'rate': 16000}],
    # (0:36 Sonniss, a closer clean flyby: the swell 8–18 s, a ground-reflection comb; nothing else in it)
    'heli-flyby-2': [{'cut': (0.0, 35.6), 'presence': PRESENCE, 'fin': 2.5, 'fout': 3.0, 'hp': 90, 'rate': 16000}],
    # (1:11, an airliner far up: its swell 5–35 s (peak ~27 s), then leaves + wind (3–8 kHz) to the end — 4.5–46 s, long fades)
    'airliner-high': [{'cut': (4.5, 46.0), 'presence': PRESENCE, 'fin': 3.5, 'fout': 4.0, 'hp': 90, 'rate': 16000}],
    # (0:41 Pixabay MP3, a vintage plane overhead: two swells (4–12 s, 19–35 s), engine harmonics only — no PA / crowd / voices
    # found (no formant movement, no syllabic 3–8 Hz bursts in 300 Hz–3 kHz)) — for the banner plane
    'prop-plane': [{'cut': (1.0, 40.0), 'presence': PRESENCE, 'fin': 2.0, 'fout': 3.0, 'hp': 90, 'rate': 16000}],
    # (0:40, F-16s right → left: a single jet at 4–9 s, THE FORMATION 12–23 s, its roar fading to 34 s; then silence)
    'jets-formation': [{'cut': (11.0, 34.0), 'presence': PRESENCE, 'fin': 1.5, 'fout': 4.0, 'hp': 90, 'rate': 16000}],
    # (0:49 Pixabay MP3, a burner up close — LOUD, clipped in places: its bursts (RMS > −24 dB) at 0.25–5.15, 6.1–10.45,
    # 11.55–14.2, 16.0–21.1 (three short gusts), 22.7–31.5 s — each a take, low-passed for distance; the slot's gain is low)
    'balloon-burner': [
        {'cut': (0.0, 5.6), 'fin': 0.1, 'fout': 0.8, 'hp': 100, 'presence': (3.0, 1600), 'lp': 2200, 'rate': 16000},
        {'cut': (5.85, 10.9), 'fin': 0.15, 'fout': 0.8, 'hp': 100, 'presence': (3.0, 1600), 'lp': 2200, 'rate': 16000},
        {'cut': (11.3, 14.6), 'fin': 0.15, 'fout': 0.7, 'hp': 100, 'presence': (3.0, 1600), 'lp': 2200, 'w': 0.8, 'rate': 16000},
        {'cut': (15.75, 21.5), 'fin': 0.15, 'fout': 0.8, 'hp': 100, 'presence': (3.0, 1600), 'lp': 2200, 'w': 0.6, 'rate': 16000},
        {'cut': (22.45, 32.0), 'fin': 0.15, 'fout': 1.0, 'hp': 100, 'presence': (3.0, 1600), 'lp': 2200, 'w': 0.5, 'rate': 16000},
    ],
    # (1:38 Pixabay MP3, Brent geese: far chatter (1.0–1.6 kHz lines) 0–14 s, the flock overhead 22–33 s; a MODERN engine drone
    # under all of it (285 / 297 / 387 Hz lines, +13–21 dB over the floor, loudest 9–20 s) — notched out)
    'geese': [{'cut': (12.0, 34.0), 'fin': 2.5, 'fout': 2.5, 'hp': 100, 'notch': [285.3, 297.5, 387.0], 'rate': 16000}],
    # (1:10 Sonniss, ONE quadcopter (a coil mic: a 50 Hz mains line, +37 dB — under the low cut); its whine 400–1000 Hz. THE
    # SWARM: five copies, detuned (−4.5 … +3.4 %) and offset in time, low-passed: a soft hum, never a mosquito)
    'drone-swarm': [{'loop': (3.0, 40.0), 'xf': 3.0, 'hp': 110, 'presence': (3.0, 1100), 'lp': 1400, 'rate': 16000,
                     'layers': [(0.0, 1.0, 1.0), (5.5, 0.968, 0.8), (11.0, 1.034, 0.7), (16.5, 0.955, 0.55), (22.0, 1.021, 0.5)]}],
    # (2:39 Sonniss, a tonal sci-fi drone: its partials 41.5 Hz (≈ E1), 70.8 Hz (between C♯2 and D2), 729 / 791 / 883 Hz — no one
    # key: it sits low (soft top) so it never fights the song; 6b lowers / filters it under the music. The loop: the best-matching
    # 30 s inside 20–80 s (scanned: head vs tail level + tilt) — it evolves, a longer window never closed on itself)
    'ufo-hum': [{'loop': (41.0, 30.0), 'xf': 3.0, 'search': 2.0, 'hp': 80, 'lp': 2500, 'rate': 16000}],
    # (0:18 Sonniss, a riser: up from ~2 s to its peak at 9 s, a reverb tail to 17 s)
    'ufo-beam': [{'cut': (3.0, 17.0), 'fin': 0.4, 'fout': 1.5, 'hp': 90}],
    # (3:00 Sonniss, 104 MB — never copied: a 40 s loop from 30–120 s, its seam searched ±10 s. Flat 20–400 Hz: NO low cut (a
    # 25 Hz subsonic cut only) + a low-mid lift (+3 dB at 300 Hz) so a phone's speaker still hears it)
    'tr3b-drone': [{'loop': (60.0, 40.0), 'xf': 3.0, 'hp': 25, 'lowmid': 3.0, 'search': 10.0, 'rate': 16000}],
    # (2:46 Sonniss, a Black Hawk's turbine at idle, the rotors off. MEASURED: the 12–32 s the notes named is only the rotor wash
    # thinning (no wind-down); the TURBINE CUTS at 134.75 s (a clunk, then its whine gliding ~10 kHz → 1 kHz for 30 s) — that's
    # the power-down: 131.5–162 s, low-passed at 6 kHz, + THE BLACKOUT built on it: the city's 60 Hz hum under the roar, cut dead
    # at the clunk with a low thump (`hit` in the registry: s into the take))
    'tr3b-powerdown': [{'cut': (131.5, 162.0), 'fin': 1.0, 'fout': 3.0, 'hp': 25, 'lp': 6000, 'blackout': 3.25, 'rate': 16000}],
    # ---- 8P — THE SPEAKEASY + PEOPLE SOUNDS (Grok's picks, Oct 24 — measured, not listened to; every trim CONFIRMED here by analysis:
    # the 0.05–0.5 s RMS envelope, onsets, band energies, SPEECH — the 2–8 Hz modulation of the 300–3400 Hz envelope (one clear
    # talker ≈ 0.5–1.1, a crowd's babble ≈ 0.1–0.3) — and MUSIC: stable tonal lines held ≥ 0.45 s within ±1.5 % (a note; a voice
    # glides). docs/audio.md#8p has the tables)
    # (2:57 Sonniss, a party of 50 people indoors: babble only (modulation 0.10–0.25 throughout), no music (no stable line but a
    # 120 Hz mains hum — notched); 0–72 s the louder, livelier half, 75–165 s calmer. THROUGH A WALL: a strong low-pass + a low-mid
    # lift; the calm bed darker (1 kHz) than the party one (1.4 kHz))
    'club-murmur': [
        {'loop': (90.0, 40.0), 'xf': 2.5, 'to': 'club-murmur-calm', 'name': 'club-murmur-calm', 'hp': 90, 'notch': [120.0], 'lowmid': 3.0, 'lp': 1000, 'rate': 16000, 'kbps': 40},
        {'loop': (22.0, 40.0), 'xf': 2.5, 'to': 'club-murmur-party', 'name': 'club-murmur-party', 'hp': 90, 'notch': [120.0], 'lowmid': 3.0, 'lp': 1400, 'rate': 16000, 'kbps': 40},
    ],
    # (8.4 s Sonniss, a wooden door opening + closing: the latch 0.2 s, its creak 0.75–1.4 s, a little after-creak 1.8–2.1 s; the
    # close's long creak 3.0–4.3 s (the "spooky" part: dense tonal peaks, 19–24 a frame at 3.8–4.2 s) then the door meeting its frame
    # at 4.65 s (a low thud) and its decay to 6.2 s. The creaks softened: a low-pass at 6–7 kHz (the squeal's edge) and the close's
    # creak −6 dB under its thud; `mark` = the thud (the mirror shut)) — the Mixkit + PMSFX "haunted" alternatives not used
    'mirror-door': [
        {'cut': (0.15, 2.25), 'name': 'door-heavy', 'fin': 0.01, 'fout': 0.35, 'hp': 90, 'lp': 7000, 'mark': 0.07},
        {'cut': (2.85, 6.3), 'to': 'door-heavy-close', 'name': 'door-heavy-close', 'fin': 0.05, 'fout': 1.0, 'hp': 90, 'lp': 6000, 'gainenv': [(0.1, 1.5, -6.0)], 'mark': 1.8},
    ],
    # (three Mixkit clinks: a couple of glasses 2.6 s (one clink at 0.1 s + its ring at 630 / 1550 / 2360 / 2960 Hz), "glasses
    # clinking" 1.2 s (three quick clinks at 0.0 / 0.24 / 0.35 s — a table toasting), a wine glass 1.2 s (one, its ring at 1.96 /
    # 2.77 / 3.74 kHz). The rings are the glass, not music)
    'glasses-clink': [{'cut': (0.05, 1.6), 'fin': 0.01, 'fout': 0.8, 'hp': 400, 'mark': 0.05}],
    'glasses-clink-2': [{'cut': (0.0, 0.85), 'fin': 0.003, 'fout': 0.35, 'hp': 400, 'mark': 0.01}],
    'glasses-clink-3': [{'cut': (0.0, 0.7), 'fin': 0.003, 'fout': 0.4, 'hp': 400, 'mark': 0.01, 'w': 0.8}],
    # (4:24 Pixabay MP3 of a CC0 original, a bar closing: chatter + glasses; a 120 Hz mains hum (notched). Speech: modulation 0.2–0.45,
    # one clear talker now and then (0.59 at 32 s, 0.72 at 136 s, 0.62 at 192 s) — avoided. THE BAR THROUGH THE OPEN MIRROR DOOR:
    # 62–70 s (modulation 0.19–0.24 — babble, no lines held) as a one-shot timed to the door, low-passed 3 kHz (across the shop);
    # THE LINE'S MURMUR (no street-crowd file): 163–191.5 s (0.18–0.31, the quietest babble; a clear talker at 192 s left out), low-passed 1.3 kHz + quiet — a few people
    # waiting outside, no word readable)
    'bar-ambience-close': [
        {'cut': (62.0, 70.0), 'to': 'bar-open', 'name': 'bar-open', 'fin': 1.0, 'fout': 1.8, 'hp': 120, 'notch': [120.0], 'lp': 3000, 'rate': 16000},
        {'loop': (164.0, 24.0), 'xf': 2.5, 'search': 1.0, 'to': 'line-murmur', 'name': 'line-murmur', 'hp': 120, 'notch': [120.0], 'lp': 1300, 'rate': 16000, 'kbps': 40},
    ],
    # (12.3 s Pixabay MP3 of a CC0 original, an old-style door bell: the door from 0.8 s, the bell's partials at 1.2 / 3.55 / 4.4 kHz
    # ringing from 1.5 s, a big strike at 4.0 s, again at 7.0 s, a last ring at 9.6 s; a 230 Hz line under it (the door's spring)
    # under the low cut. Three jingles)
    'shop-bell': [
        {'cut': (1.3, 3.85), 'fin': 0.05, 'fout': 0.8, 'hp': 400},
        {'cut': (3.9, 6.35), 'fin': 0.02, 'fout': 1.0, 'hp': 400},
        {'cut': (6.5, 9.35), 'fin': 0.05, 'fout': 1.0, 'hp': 400, 'w': 0.8},
    ],
    # (5.2 s Sonniss, hair scissors — VERY quiet (peaks −45 dBFS, −65 dB RMS): 11 snips at 0.13 / 0.42 / 1.30 / 1.81 / 2.45 / 2.74 /
    # 3.04 / 3.34 / 4.01 / 4.47 / 4.77 s; four takes of 2–4 snips, the hiss between gated)
    'scissors-snip': [
        {'cut': (0.05, 0.85), 'fin': 0.01, 'fout': 0.25, 'hp': 400, 'gate': -32},
        {'cut': (1.2, 2.3), 'fin': 0.01, 'fout': 0.3, 'hp': 400, 'gate': -32},
        {'cut': (2.38, 3.75), 'fin': 0.01, 'fout': 0.3, 'hp': 400, 'gate': -32},
        {'cut': (3.92, 5.15), 'fin': 0.01, 'fout': 0.3, 'hp': 400, 'gate': -32},
    ],
    # (49 s Pixabay MP3 of a CC0 original, sweeping: steady strokes (2–6 kHz, the strokes' modulation 0.5–1.1), low thumps at 7 / 9 /
    # 16 / 23 / 34 / 45 s under the low cut. THE 3 AM BROOM: a 24 s loop through the bar's glass (a 4 kHz low-pass))
    'broom-sweep': [{'loop': (17.5, 24.0), 'xf': 2.0, 'search': 1.0, 'hp': 180, 'lp': 4000, 'rate': 16000, 'kbps': 48}],
    # (25.9 s Pixabay MP3 of a CC0 original, "sash window open and close": latch clicks 0.4–2 s + 3.4–6 s; a quick scrape 10.6–11.3 s;
    # a short slide 12.9–13.6 s ending in a THUD at 13.65 s (−10 dB: the bottom rail on the sill) = DOWN; a long juddering push
    # 17.1–20.9 s (stick-slip onsets every ~0.1–0.3 s, a soft stop at 20.83 s, no thud) = UP — a weighted sash pushed up against
    # its cords judders; dropped, it lands. The thud taken down 8 dB (felt, not a slam); `mark` = the stop / the thud)
    'window-sash': [
        {'cut': (17.0, 21.3), 'to': 'window-sash-up', 'name': 'window-sash-up', 'fin': 0.1, 'fout': 0.4, 'hp': 150, 'mark': 3.83},
        {'cut': (12.75, 14.4), 'to': 'window-sash-down', 'name': 'window-sash-down', 'fin': 0.08, 'fout': 0.5, 'hp': 150, 'gainenv': [(0.86, 1.2, -8.0)], 'mark': 0.9},
    ],
    # (1.1 s Pixabay MP3 of a CC0 original, a roller shade going up: the tug 0.2 s, the roll + its snap at 0.7 s)
    'roller-blind': [{'cut': (0.12, 1.05), 'fin': 0.02, 'fout': 0.2, 'hp': 150}],
    # (2.5 s Sonniss, one meow 0–0.75 s (a mono 192 kHz recording), the room's low noise after it — cut)
    'cat-meow': [{'cut': (0.0, 0.85), 'fin': 0.01, 'fout': 0.2, 'hp': 250}],
    # (1.25 s Pixabay MP3 of a CC0 original, landing on grass — a soft thump, 0.05–0.6 s: the cat's landing, a stand-in)
    'cat-land': [{'cut': (0.0, 0.7), 'fin': 0.005, 'fout': 0.3, 'hp': 120, 'mark': 0.06}],
    # (2.3 s Sonniss, five knocks on a heavy door at 0.03 / 0.32 / 0.58 / 0.88 / 1.20 s (+33–40 dB over the floor, decays ~0.25 s)
    # → THE SECRET KNOCK: "knock … knock-knock … knock" (four of them re-placed: 0.62 s, 0.22 s, 0.62 s apart), then THE SLOT —
    # door-slot.wav (1.5 s Sonniss, a metal bolt latch: one click + its ring, −20 dBFS: +11 dB here, 5 dB under the knocks) — the
    # peephole sliding open behind the door 0.85 s after the last knock. A heavy door is mostly < 150 Hz: low-mids + presence lifted)
    'secret-knock': [{'seq': [(None, 0.0, 0.29, 0.0, 0.0), (None, 0.29, 0.56, 0.62, 0.0), (None, 0.555, 0.86, 0.84, -1.5), (None, 1.17, 1.6, 1.46, 0.0),
                              ('door-slot.wav', 0.0, 0.95, 2.36, -5.0)],
                      'fin': 0.003, 'fout': 0.45, 'hp': 80, 'lowmid': 4.0, 'lift': 3.0, 'mark': 0.03}],
    # (29 s Mixkit, footsteps on stones: a step every ~0.6 s with its scuff + gravel; six single steps, each from just before its
    # onset (0.18 / 0.76 / 3.41 / 4.62 / 6.50 / 9.62 s) to the next one's)
    'footsteps-cobble': [
        {'cut': (0.14, 0.6), 'fin': 0.005, 'fout': 0.15, 'hp': 120, 'gate': -36},
        {'cut': (0.72, 1.3), 'fin': 0.005, 'fout': 0.15, 'hp': 120, 'gate': -36},
        {'cut': (3.37, 3.85), 'fin': 0.005, 'fout': 0.15, 'hp': 120, 'gate': -36},
        {'cut': (4.58, 5.1), 'fin': 0.005, 'fout': 0.15, 'hp': 120, 'gate': -36},
        {'cut': (6.46, 7.0), 'fin': 0.005, 'fout': 0.15, 'hp': 120, 'gate': -36},
        {'cut': (9.58, 9.95), 'fin': 0.005, 'fout': 0.12, 'hp': 120, 'gate': -36},
    ],
    # (5.25 s Mixkit, heels on pavement: clean single steps every ~0.59 s at 0.19 / 0.81 / 1.40 / 1.98 / 2.52 / 3.08 / 3.66 / 4.20 /
    # 4.83 s; six of them)
    'footsteps-heels': [
        {'cut': (0.17, 0.62), 'fin': 0.003, 'fout': 0.15, 'hp': 150, 'gate': -36},
        {'cut': (1.375, 1.85), 'fin': 0.003, 'fout': 0.15, 'hp': 150, 'gate': -36},
        {'cut': (1.96, 2.45), 'fin': 0.003, 'fout': 0.15, 'hp': 150, 'gate': -36},
        {'cut': (3.64, 4.1), 'fin': 0.003, 'fout': 0.15, 'hp': 150, 'gate': -36},
        {'cut': (4.175, 4.65), 'fin': 0.003, 'fout': 0.15, 'hp': 150, 'gate': -36},
        {'cut': (4.805, 5.25), 'fin': 0.003, 'fout': 0.15, 'hp': 150, 'gate': -36},
    ],
    # (4.1 s Mixkit, a crowd laughing: modulation 0.28–0.34 over 2–4 s windows (a crowd, not a talker); the held lines are laughter's
    # voiced "ha"s (213–229 Hz, ≤ 0.78 s) — no words. Two takes, low-passed for distance)
    'laugh-distant': [
        {'cut': (0.0, 2.75), 'fin': 0.08, 'fout': 0.6, 'hp': 200, 'lp': 3500},
        {'cut': (2.8, 4.12), 'fin': 0.05, 'fout': 0.5, 'hp': 200, 'lp': 3500},
    ],
    # (2:22 Pixabay MP3 of a CC0 original, a backyard party in Toronto: MUSIC from 89 s to the end (a melody held on C4 / A♭3 / F3 /
    # E♭3 / C3 + F6 / A♭6 — notes ±0.3–1 %) and notes at 20.7–29 s (132 / 216 / 392 / 210 Hz), 69.6 s and 82.8 s (536 Hz) — all
    # outside; recurring 166 + 144.5 Hz lines (0.5 s at a time every ~5–6 s, ±0–1 %: a distant bass line or a machine) notched with their octaves; THE ROOFTOP: 39–63 s (babble,
    # modulation 0.15–0.28; a nearer voice at 36.5–39 s (0.46) left out), low-passed 2.4 kHz — up on the roof, heard from the street)
    'rooftop-party': [{'loop': (39.5, 21.0), 'xf': 2.0, 'search': 0.5, 'hp': 120, 'notch': [144.5, 165.8, 289.0, 331.6], 'lp': 2400, 'rate': 16000, 'kbps': 40}],
    # (0.47 s Pixabay MP3, an old truck door — HOT (−0.2 dBFS): a stand-in for the bus's folding door)
    'bus-door': [{'cut': (0.0, 0.47), 'fin': 0.003, 'fout': 0.12, 'hp': 120}],
    # (6.9 s Sonniss, a metal hand bell: one ring (1.24 kHz + 2.47 / 2.67 / 3.19 kHz), a 6 s decay; a 200 Hz line under it (cut))
    'cart-bell': [{'cut': (0.0, 3.6), 'fin': 0.003, 'fout': 1.6, 'hp': 400, 'rate': 32000}],
    # ---- 6b — THE LIFE + WORKERS + WILDLIFE SOUNDS (Grok's picks, Oct 24 — screened by speech-to-text + a music detector, NOT listened
    # to; his notes named no trims for this set, so every cut here is from the analysis: the 0.1–1 s RMS envelope per band (< 120 Hz,
    # 120–400, 400–1500, 1.5–4 k, 4–15 k), onsets, VOICING (the 300–3400 Hz signal's autocorrelation peak at 2.5–12 ms lags > 0.6 = a
    # voiced frame: a talker's vowels, a whoop, a coo), held tonal lines (music: ≥ 0.45 s within ±1.5 %), the 2–8 Hz speech
    # modulation; docs/audio.md#6b-life has the table)
    # (22.7 s Sonniss, a house's front door opened + closed FAR + SOFT, four times (peaks −21 dBFS): the opens' latch at 0.9 / 4.75 /
    # 10.0 s (a rattly fourth 15.0–16.2 s: left out), the closes' thud at 2.1 / 7.1 / 12.9 / 19.3 s — mostly < 120 Hz, so low-mids +
    # presence lifted where a phone plays; the room's hiss between gated; `mark` = the latch / the thud)
    'street-door': [
        {'cut': (0.5, 1.65), 'name': 'street-door_1', 'fin': 0.02, 'fout': 0.35, 'hp': 80, 'lowmid': 3.0, 'presence': (3.0, 1500), 'gate': -32, 'mark': 0.4},
        {'cut': (4.45, 5.55), 'name': 'street-door_2', 'fin': 0.02, 'fout': 0.35, 'hp': 80, 'lowmid': 3.0, 'presence': (3.0, 1500), 'gate': -32, 'mark': 0.3},
        {'cut': (9.6, 10.75), 'name': 'street-door_3', 'fin': 0.02, 'fout': 0.35, 'hp': 80, 'lowmid': 3.0, 'presence': (3.0, 1500), 'gate': -32, 'mark': 0.4},
        {'cut': (1.85, 3.0), 'to': 'street-door-close', 'name': 'street-door-close_1', 'fin': 0.02, 'fout': 0.45, 'hp': 70, 'lowmid': 4.0, 'presence': (3.0, 1500), 'gate': -34, 'mark': 0.25},
        {'cut': (6.85, 8.0), 'to': 'street-door-close', 'name': 'street-door-close_2', 'fin': 0.02, 'fout': 0.45, 'hp': 70, 'lowmid': 4.0, 'presence': (3.0, 1500), 'gate': -34, 'mark': 0.25},
        {'cut': (12.55, 13.8), 'to': 'street-door-close', 'name': 'street-door-close_3', 'fin': 0.02, 'fout': 0.45, 'hp': 70, 'lowmid': 4.0, 'presence': (3.0, 1500), 'gate': -34, 'mark': 0.35},
        {'cut': (19.0, 20.1), 'to': 'street-door-close', 'name': 'street-door-close_4', 'fin': 0.02, 'fout': 0.45, 'hp': 70, 'lowmid': 4.0, 'presence': (3.0, 1500), 'gate': -34, 'mark': 0.3, 'w': 0.6},
    ],
    # (1.1 s Sonniss, a body-fall on concrete — feet first: the hit at 0.1 s, its scuff to 0.6 s; no voice (voiced 0.00))
    'jogger-trip': [{'cut': (0.05, 1.0), 'fin': 0.005, 'fout': 0.35, 'hp': 90, 'lowmid': 3.0, 'mark': 0.06}],
    # (7.2 s Sonniss, four wooden-stick swishes at 0.1 / 2.0 / 3.9 / 6.1 s, ~0.25 s each, digital silence between; HOT (+1.6 dBFS))
    'glow-wand-swish': [
        {'cut': (0.05, 0.42), 'fin': 0.005, 'fout': 0.15, 'hp': 200},
        {'cut': (1.95, 2.32), 'fin': 0.005, 'fout': 0.15, 'hp': 200},
        {'cut': (3.85, 4.22), 'fin': 0.005, 'fout': 0.15, 'hp': 200},
        {'cut': (6.05, 6.45), 'fin': 0.005, 'fout': 0.15, 'hp': 200},
    ],
    # (1.3 s Sonniss, a small dog far off: two barks at 0.05 + 0.3 s (400–1500 Hz) and their echo; the double bark + the second alone)
    'dog-bark': [{'cut': (0.0, 1.25), 'fin': 0.003, 'fout': 0.5, 'hp': 300}, {'cut': (0.24, 1.25), 'fin': 0.005, 'fout': 0.5, 'hp': 300, 'w': 0.7}],
    # (1:38 Sonniss, a Chilean village market: voices + footsteps on sand throughout, no music (no held line); VOICED frames 0.1–0.3 a
    # second in places, lowest in 64–87 s (0.00–0.08) — the owner: never 88–98 s. THE LOOP: 63 + 22 s (+ a 2 s tail: ≤ 87.5 s),
    # low-passed 1.4 kHz (heard across the square: no word readable, the sand's crunch gone), 40 kbps, 16 kHz)
    'market-murmur': [{'loop': (63.0, 22.0), 'xf': 2.0, 'search': 0.5, 'hp': 150, 'lp': 1400, 'rate': 16000, 'kbps': 40}],
    # (3.1 s Pixabay MP3 of a CC0 original, milk bottles: clinks at 0–0.3, 1.0–1.6, 2.1–2.3, 2.5–2.8 s — two takes)
    'milk-bottles': [{'cut': (0.0, 0.98), 'fin': 0.003, 'fout': 0.35, 'hp': 300}, {'cut': (0.98, 3.05), 'fin': 0.005, 'fout': 0.45, 'hp': 300}],
    # (3.3 s Pixabay MP3 of a CC0 original, a metal lid dropped: its rattle 0.1–2.5 s, a ring (922 / 859 / 422 Hz: the lid) to 3.2 s;
    # HOT (+0.8 dBFS, clipped in places))
    'trash-can-lid': [{'cut': (0.05, 3.3), 'fin': 0.003, 'fout': 0.8, 'hp': 150, 'mark': 0.07}],
    # (0.8 s Sonniss, a newspaper opened: one rustle)
    'newspaper-rustle': [{'cut': (0.0, 0.78), 'fin': 0.01, 'fout': 0.2, 'hp': 200}],
    # (1.4 s Mixkit, a pea whistle: one blast 0.1–0.8 s, its fundamental ~3.5 kHz (all in 1.5–4 kHz). FAR (the owner): its upper
    # partials low-passed (4.5 kHz), a low slot gain)
    'police-whistle': [{'cut': (0.05, 1.3), 'fin': 0.01, 'fout': 0.4, 'hp': 400, 'lp': 4500}],
    # (9.1 s Pixabay MP3 of a CC0 original, a ladder handled: small clanks throughout, the big one at 4.4 s (120–400 Hz) — two takes)
    'ladder-clank': [{'cut': (4.3, 6.5), 'fin': 0.005, 'fout': 0.5, 'hp': 150, 'mark': 0.1}, {'cut': (0.35, 2.1), 'fin': 0.01, 'fout': 0.4, 'hp': 150, 'w': 0.8}],
    # (50 s Pixabay MP3, a squeegee + sponge on glass: 13 strokes between digital silences; the squeaks (1.5–4 kHz on top, centroid
    # ~3.5 kHz) at 0–2.0, 4.0–5.2, 21.5–23.6, 25.5–27.7 s; the sponge's wipes (400–1500 Hz) + a filtered 14–19 s stretch left out)
    'squeegee': [
        {'cut': (0.0, 2.2), 'fin': 0.03, 'fout': 0.3, 'hp': 250},
        {'cut': (3.9, 5.4), 'fin': 0.03, 'fout': 0.3, 'hp': 250},
        {'cut': (21.3, 23.8), 'fin': 0.03, 'fout': 0.3, 'hp': 250},
        {'cut': (25.4, 27.9), 'fin': 0.03, 'fout': 0.3, 'hp': 250},
    ],
    # (27 s Pixabay MP3 of a CC0 original, a crate of bottles handled: clinks + rattles throughout — three busy stretches)
    'crates-clink': [
        {'cut': (1.5, 4.0), 'fin': 0.01, 'fout': 0.4, 'hp': 250},
        {'cut': (5.7, 7.3), 'fin': 0.01, 'fout': 0.4, 'hp': 250},
        {'cut': (13.7, 15.6), 'fin': 0.01, 'fout': 0.4, 'hp': 250},
    ],
    # (48 s Mixkit, a vintage manual fire siren — HOT (+1.7 dBFS): up 0–4 s, held 4–9, down 9–15 (−28 dB at 14.5 s), up again 15–20,
    # held 19–29, a long fall to 46 s. Two takes (one wail, the long one rarer). FAR + SOFT (the owner): low-passed 1.8 kHz, 16 kHz)
    'siren-1920s': [
        {'cut': (0.5, 15.0), 'fin': 1.0, 'fout': 2.5, 'hp': 250, 'lp': 1800, 'rate': 16000, 'kbps': 40},
        {'cut': (14.5, 46.5), 'fin': 1.5, 'fout': 4.0, 'hp': 250, 'lp': 1800, 'rate': 16000, 'kbps': 40, 'w': 0.6},
    ],
    # (4.3 s Pixabay MP3 of a CC0 original, ONE ship's bell ring: partials 437 / 875 / 1172 / 1594 / 1828 / 2094 / 3000 Hz… held
    # 1–4 s — the bell itself, not music)
    'ships-bell': [{'cut': (0.0, 4.3), 'fin': 0.003, 'fout': 1.2, 'hp': 300}],
    # (12 s Sonniss, a Royal Hudson's whistle from the cab: the engine's noise 0–2 s (no tone), THE WHISTLE 2.0–4.3 s (437.5 Hz held:
    # voiced 0.5–0.67), then the engine chuffing (modulation 0.75–0.8) to the end — 1.7–4.9 s, low-passed 3.5 kHz (far off at noon))
    'steam-whistle': [{'cut': (1.7, 4.9), 'fin': 0.3, 'fout': 0.6, 'hp': 250, 'lp': 3500}],
    # (6.7 s Pixabay MP3 of a CC0 original, a distant ship's horn: one blast 0–3 s on a 109.4 Hz fundamental (+ its harmonics), the
    # harbor's echo to 5.8 s)
    'ship-horn': [{'cut': (0.0, 6.4), 'fin': 0.05, 'fout': 2.5, 'hp': 80, 'rate': 16000}],
    # (1:39 Pixabay MP3 of a CC0 original, a narrow boat's engine: steady throughout (±2 dB). A 30 s loop, low-passed 1.8 kHz (across
    # the water), 40 kbps, 16 kHz)
    'boat-putter': [{'loop': (12.0, 30.0), 'xf': 2.5, 'search': 3.0, 'hp': 100, 'lp': 1800, 'rate': 16000, 'kbps': 40}],
    # (4.9 s Mixkit, pigeons fluttering — quiet (−46 LUFS), no voice)
    'pigeon-flutter': [{'cut': (0.0, 4.8), 'fin': 0.05, 'fout': 0.8, 'hp': 300}],
    # (6.2 s Mixkit, pigeons cooing at 0.5–1.5, 2.5–3.0, 4.5–5.0 s — two takes)
    'pigeon-coo': [{'cut': (0.4, 3.6), 'fin': 0.1, 'fout': 0.5, 'hp': 150}, {'cut': (4.0, 6.1), 'fin': 0.1, 'fout': 0.5, 'hp': 150}],
    # (1:25 Sonniss, coyotes far off — very quiet (−57 LUFS, a −61 dB floor): the howls (400–1500 Hz, voiced 0.3–0.55) clearest at
    # 24.5–40.5 s, ~13 dB over the floor; band-passed 350 Hz–2.8 kHz so the hiss stays under them)
    'coyote-howl': [
        {'cut': (24.5, 34.6), 'fin': 0.8, 'fout': 2.0, 'hp': 350, 'lp': 2800, 'rate': 16000},
        {'cut': (35.4, 40.9), 'fin': 0.6, 'fout': 1.6, 'hp': 350, 'lp': 2800, 'rate': 16000},
    ],
    # (51 s Sonniss, a close coyote, noise-reduced: bursts of yips between near-silences — the three most voiced (0.31–0.37); made
    # distant: low-passed 3.5 kHz)
    'coyote-yip': [
        {'cut': (15.9, 17.7), 'fin': 0.02, 'fout': 0.5, 'hp': 350, 'lp': 3500},
        {'cut': (32.9, 36.0), 'fin': 0.02, 'fout': 0.5, 'hp': 350, 'lp': 3500},
        {'cut': (46.4, 48.7), 'fin': 0.02, 'fout': 0.5, 'hp': 350, 'lp': 3500},
    ],
    # (26 s Sonniss, a squirrel at dawn: its chatter 7.5–10.2 s (−31 dB; a −60 floor), a softer bout 11–13.5 s)
    'squirrel-chatter': [{'cut': (7.4, 10.4), 'fin': 0.05, 'fout': 0.5, 'hp': 400}],
    # (3.65 s Sonniss, an electric arc with its reverb: crackle from the start, energy mostly < 400 Hz — presence lifted for a phone)
    'tr3b-crackle': [{'cut': (0.0, 3.6), 'fin': 0.005, 'fout': 1.0, 'hp': 60, 'presence': (3.0, 2000)}],
    # (30 s Pixabay MP3, a crowd cheering + clapping: no voiced frames (≤ 0.07: no chant, no words), no held line; three 6 s stretches
    # of the steady middle, low-passed 3 kHz (across the promenade) — a burst of clapping round the dance circle)
    'crowd-clap': [
        {'cut': (9.0, 15.0), 'fin': 0.8, 'fout': 1.8, 'hp': 200, 'lp': 3000, 'rate': 16000},
        {'cut': (14.5, 20.5), 'fin': 0.8, 'fout': 1.8, 'hp': 200, 'lp': 3000, 'rate': 16000},
        {'cut': (20.0, 26.0), 'fin': 0.8, 'fout': 1.8, 'hp': 200, 'lp': 3000, 'rate': 16000},
    ],
    # (4.8 s Sonniss, an audience cheering: the whoops 0–1.5 s (voiced 0.67–0.92: "whoo"s, no words), applause after; low-passed 4 kHz)
    'crowd-whoop': [{'cut': (0.0, 4.6), 'fin': 0.05, 'fout': 1.2, 'hp': 200, 'lp': 4000}],
    # ---- 8b1 — GROK'S SECOND-TRY SOUNDS (credits.txt "Second-try sounds"; analysed: tools in the 8b1 notes, docs/audio.md#8b1)
    # (38.6 s Pixabay MP3, a house party's walla: ≤ 20 % voiced frames in any second, no held tone (no music) — indistinct; heard
    # through an upstairs window: 300 Hz–1.8 kHz (the consonants a word needs live above 2 kHz — none readable), at 16 kHz)
    'tv-murmur-2': [{'loop': (17.5, 15.0), 'xf': 2.0, 'search': 2.5, 'hp': 300, 'lp': 1800, 'rate': 16000}],   # (the steadier, livelier second half: 3–31 s had a 5.5 dB seam)
    # (103.6 s, distant traffic: a continuous wash — only a 15 dB swing in 100 s, never a gap — + engine tones: MODERN density; kept in
    # SKIP below (the owner: "if it still sounds modern, leave the slot empty"); the cut is ready: drop 'traffic-far-2' from SKIP to try it)
    'traffic-far-2': [{'loop': (2.0, 62.0), 'xf': 3.0, 'search': 1.0, 'hp': 120, 'lp': 3500, 'rate': 16000}],
    # (97 s, an old large truck: the start 0–2 s, the idle 2–65, revs 65–73, the pull-out 73–97 fading — no air brakes, no beeps. DEPART
    # = 58–97 (idle → revs → away; `hit` the pull-out ~15 s in). There's no arrival in it: ARRIVE = the pull-out PLAYED BACKWARDS (a
    # truck coming in from far, its engine winding down as it slows) crossfaded into the idle (`hit` = where it has stopped); LPF 5 kHz)
    'trash-truck-2': [
        {'to': 'trash-truck-arrive', 'name': 'trash-truck-arrive', 'seq': [(None, 80.0, 96.5, 0.0, 0.0, True, 1.2), (None, 3.0, 14.0, 15.3, -1.5, False, 1.2)], 'fin': 1.5, 'fout': 2.0, 'hp': 60, 'lp': 5000, 'mark': 16.0},
        {'to': 'trash-truck-depart', 'name': 'trash-truck-depart', 'cut': (58.0, 96.9), 'fin': 1.0, 'fout': 5.0, 'hp': 60, 'lp': 5000, 'mark': 15.0},
    ],
    # (33 s Sonniss, an electromagnetic hum: 53 % of its energy under 150 Hz — a phone loses ~5 LU of it. HPF 90 Hz + HARMONIC
    # SATURATION of the band under 160 Hz (its harmonics mixed back: the same hum through a phone), a loop 1–29.5 s + 2 s crossfade)
    'tr3b-presence': [{'loop': (1.0, 28.5), 'xf': 2.0, 'search': 0.5, 'hp': 90, 'sat': (6.0, 2.6, 160), 'dup': (180, 4.0), 'rate': 16000}],
    # (9.4 s Pixabay MP3, a big machine spinning down 480 → 240 Hz — 97 % mids already (a phone hears all of it); the whole file, levelled
    # from −13.4 LUFS like every one-shot; it plays as the city's lights die — sounds.js#legendSounds)
    'power-failure': [{'cut': (0.0, 9.35), 'fin': 0.005, 'fout': 1.2, 'hp': 90}],
    # (15.2 s Pixabay MP3, a tube hum swelling up: 62 % under 150 Hz — a phone loses ~11 LU. 0–9 s (the swell + the hum), HEAVY
    # saturation + a duplicate layer high-passed at 180 Hz so its harmonics carry it; it plays as the power stutters back)
    'power-restore': [{'cut': (0.0, 9.0), 'fin': 0.3, 'fout': 2.2, 'hp': 50, 'sat': (8.0, 1.4, 170), 'dup': (180, 6.0)}],
    # ---- 11a-2 — THANKSGIVING + THE PARADE (credits.txt "Thanksgiving + parade sounds"; Grok's processing brief, measured — not
    # listened to: per-band energies, the 0.25–1 s envelope, the voiced share + one-voice F0 continuity + the 3–6 Hz syllabic
    # modulation per 0.5 s for words, tonal lines + self-similarity for the 78; docs/audio.md#11a-2). Distance = a low-pass + a hall
    # (`verb`), never brighter; levels: the house's (loops −24, one-shots −20 LUFS) — the brief's −30 LUFS beds are the SLOT gains
    # (0.05 against the cheer's 0.1: the brief's 10 dB between a bed and a one-shot)
    # (5.2 s Mixkit, a flock of geese honking past — 88 % of it 400–1500 Hz, no clipping: the whole file, the brief's long fades; mono —
    # the slow L → R pan is the caller's: citySound's handle .set({ pan }, ramp) / sounds.js run() with the V's x)
    'geese-v': [{'cut': (0.0, 5.22), 'fin': 1.5, 'fout': 2.0, 'hp': 200, 'lp': 4000, 'verb': (0.25, 0.03, 1.6, 3000), 'rate': 16000, 'kbps': 48}],
    # (31.1 s Pixabay MP3, kids cheering + clapping: no word-like stretch (the voiced bursts at 1.5 + 16–17 s are one held "yaaay" —
    # syllabic modulation 0.12–0.26), a possible "Bye!" past 30 s left out: the loop + its tail end by 30.0 s. Squealy (27 % at
    # 1.5–4 kHz): de-essed 2.5–6 kHz, low-passed 6 kHz. THE PARADE CROWD = the kids + the adult murmur (parade-crowd-2.wav, a large
    # outdoor reception: babble, voiced ≤ 0.4) laid 4.5 LU under, from 0.0 s — its one word-like half-second (30.0 s: one voice
    # held + syllabic) stays outside — low-passed harder than the brief's 5 kHz (3 kHz: no word readable) — ONE loop)
    'parade-crowd': [{'loop': (0.6, 27.3), 'xf': 2.0, 'search': 0.1, 'hp': 150, 'deess': (6.0, 2500, 6000), 'lp': 6000,
                      'mixin': {'f': 'parade-crowd-2.wav', 'at': 0.0, 'lu': -4.5, 'hp': 150, 'lp': 3000},
                      'verb': (0.15, 0.025, 1.0, 3500), 'rate': 16000, 'kbps': 48}],
    # (10.9 s Sonniss, a stadium's big surge, 5.1 at 96 kHz in FILM order (L C R Ls Rs LFE — measured: channel 6 is the −54 dB LFE):
    # folded by hand (L + R + 0.707 C, the surrounds −3 dB, the LFE dropped), 1.0–9.5 s; one held "woo" at 6–7 s, no words; already
    # dark (93 % at 400–1500 Hz) — kept far back by its low gain)
    'parade-cheer': [{'cut': (1.0, 9.5), 'af': 'pan=mono|c0=0.5*c0+0.707*c1+0.5*c2+0.354*c3+0.354*c4', 'fin': 0.05, 'fout': 1.5,
                      'hp': 120, 'lp': 6000, 'verb': (0.2, 0.025, 1.4, 3500), 'rate': 16000, 'kbps': 48}],
    # (4:08, the US Marine Band's "Washington Post March", Edison Diamond Disc 1923, a FLAT transfer: 40 % of its energy is rumble
    # < 150 Hz, the hiss 4–8 kHz 6 dB over the band's mids, dense crackle; the band itself clear (held notes in 55–93 % of frames
    # past 20 s). A ONE-SHOT, not a loop: no exact musical repeat found through the noise and a crossfaded seam would blend two bars of
    # a march — "a band passes" (2–92 s, the brief's 2 s in / 4 s out), chained by the caller. Mono first, then adeclick + anlmdn (the
    # 400–3000 Hz floor −8.9 dB, the music's peaks −2.3, ~two-thirds of the crackle impulses left: the trace), HPF 150, an outdoor
    # hall: two blocks away. At the brief's LPF 3.5 kHz HALF its energy sat at 2–5 kHz (the crackle + hiss — harsh on a phone): the
    # 1.8–4.5 kHz peaks de-essed 6 dB + LPF 3 kHz (still the brief's 2.5–4 kHz "far" range) → 24 %, the band over the floor unchanged.
    # The disc's end thump (~241 s) far outside)
    'marching-band-far': [{'cut': (2.0, 92.0), 'af': 'pan=mono|c0=0.5*c0+0.5*c1,adeclick,anlmdn=s=7', 'fin': 2.0, 'fout': 4.0,
                           'hp': 150, 'deess': (6.0, 1800, 4500), 'lp': 3000, 'verb': (0.3, 0.035, 1.2, 2500), 'rate': 16000, 'kbps': 40}],
    # (79 s Pixabay MP3, a big flag flapping — gusty (−29 … −44 dB a second), 18 % under 120 Hz; the louder gust from 75 s left out: a
    # 48 s window of the first 72 s; stands in for a giant parade balloon's fabric)
    'balloon-flap': [{'loop': (2.0, 48.0), 'xf': 3.0, 'search': 2.0, 'hp': 120, 'lp': 7000, 'verb': (0.12, 0.02, 0.8, 4000), 'rate': 16000, 'kbps': 40}],
    # (21.8 s Freesound CC0, raking leaves: a stroke every ~1.5 s, 74 % of it over 4 kHz (bright, not harsh: little at 2–5 kHz). The
    # whole file as a loop from one gap between strokes (2.4 s) to another (20.7 s) — a 1.3 s beat across the seam, like the rest —
    # with a 1 s seam; the 2–5 kHz peaks de-harshed 4 dB (57 → 42 % there — the broom's 82 % and the squeegee's 47–82 % are this
    # city's scrapes); a short street hall)
    'leaves-rake': [{'loop': (2.4, 18.3), 'xf': 1.0, 'search': 0.05, 'hp': 150, 'deess': (4.0, 2000, 5000), 'lp': 7000, 'verb': (0.15, 0.015, 0.6, 5000), 'rate': 16000, 'kbps': 48}],
}
# source files named after what they are, not their slot (the folder's names) → the slot
ALIAS = {'heli-flyby': 'helicopter', 'airliner-high': 'airliner-far', 'jets-formation': 'jet-flyby', 'tr3b-powerdown': 'tr3b-power-down',
         'club-murmur': 'club-murmur-calm', 'mirror-door': 'door-heavy', 'bar-ambience-close': 'bar-open', 'window-sash': 'window-sash-up',
         'secret-knock': 'door-knock', 'marching-band-far': 'parade-band'}
# never imported (8P): the diesel bus stand-ins (the 1945 truck's takes instead), the "haunted" door alternatives, the TV murmur (MUSIC
# held in it — G4 / E5 / G5 notes for 1–1.9 s at 26–41 s — and one clear talker: modulation 0.5–1.1), the slot (inside the knock)
# 6b: traffic-far (MODERN traffic — the owner: leave the slot empty), trash-truck (a modern ZIL diesel standing still: start, revs, stop —
# no arrival or departure in it to cut), raccoon-chitter (a hiss + growl attack: not one voiced frame in 83 s, broadband — scary),
# police-car-1920s (Fox Audio's short pass — the owner: cut the police cars from the 1929 Volvo instead)
# Oct 25: duck-quack + raccoon-chitter — the owner removed THE DUCK CROSSING + THE RACCOON from the Harbor (no slots any more)
SKIP = {'bus-idle', 'bus-depart', 'mirror-door-open', 'mirror-door-close', 'tv-murmur', 'door-slot',
        'traffic-far', 'trash-truck', 'raccoon-chitter', 'police-car-1920s', 'duck-quack',
        # 8b1: the second try at far traffic still measures as MODERN (a continuous wash: CUTS['traffic-far-2'] has its cut, ready)
        'traffic-far-2',
        # 11a-2: the adult murmur is laid INSIDE parade-crowd (its `mixin`), never a take of its own
        'parade-crowd-2'}
PIXABAY = ('The file imported is the Pixabay MP3 copy named in this block (Pixabay Content License) of the CC0 Freesound original — '
           'the lossless original was not in the folder (drop it in under the same name and re-run to upgrade).')
CREDIT_NOTE = {
    'heli-flyby': PIXABAY, 'prop-plane': PIXABAY, 'balloon-burner': PIXABAY, 'geese': PIXABAY,
    'bar-ambience-close': PIXABAY, 'shop-bell': PIXABAY, 'broom-sweep': PIXABAY, 'window-sash': PIXABAY, 'roller-blind': PIXABAY,
    'cat-land': PIXABAY, 'rooftop-party': PIXABAY,
    'tv-murmur-2': PIXABAY, 'trash-truck-2': PIXABAY, 'power-failure': PIXABAY, 'power-restore': PIXABAY,   # (8b1: the second-try set)
    'milk-bottles': PIXABAY, 'trash-can-lid': PIXABAY, 'ladder-clank': PIXABAY, 'crates-clink': PIXABAY, 'ships-bell': PIXABAY,
    'ship-horn': PIXABAY, 'boat-putter': PIXABAY,
    'squeegee': 'A Pixabay original (Pixabay Content License: free for commercial use, no attribution required) — no Freesound original.',
    'crowd-clap': 'A Pixabay original (Pixabay Content License: free for commercial use, no attribution required) — no Freesound original.',
    'bus-door': 'A Pixabay original (Pixabay Content License: free for commercial use, no attribution required) — no Freesound original.',
    'secret-knock': 'THE SECRET KNOCK is assembled from four of its knocks + door-slot.wav (credited below) as the peephole slot.',
    'door-slot': 'Used inside door-knock (THE SECRET KNOCK: the peephole slot after the knocks).',
    'gulls': 'The file imported is the lossless Freesound original named in this block (TRP, sound 574388, CC0 1.0; FLAC 48 kHz '
             '24-bit stereo, 0:52), not the Pixabay MP3 copy.',
    'parade-crowd': 'A Pixabay original (Pixabay Content License: free for commercial use, no attribution required) — no Freesound original. '
                    'parade-crowd-2.wav (credited below) is laid under it as the adult murmur.',
    'parade-crowd-2': 'Used inside parade-crowd (the adult murmur laid under the kids).',
    'balloon-flap': 'A Pixabay original (Pixabay Content License: free for commercial use, no attribution required) — no Freesound original.',
    'marching-band-far': 'Public domain in the US only (a 1923 US sound recording + an 1889 composition); the import is a 90 s excerpt, '
                         'declicked, denoised and filtered.',
}
# credits.txt lists some downloads only as a line under "DOWNLOAD YOURSELF FROM FREESOUND" (not a block of their own): their blocks
# here (11a-2), used when the folder's credits.txt has none for that file
CREDIT_BLOCK = {
    'leaves-rake.wav': ['leaves-rake.wav', '  "Raking leaves" - markbolden (Freesound 421790)', '  Page: https://freesound.org/people/markbolden/sounds/421790/',
                        '  Licence: CC0 1.0 - https://creativecommons.org/publicdomain/zero/1.0/ - no attribution needed'],
    'parade-crowd-2.wav': ['parade-crowd-2.wav', '  "Large Crowd at an Outdoor Reception" - timothyd4y (Freesound 472606; WAV 48 kHz / 24-bit)',
                           '  Page: https://freesound.org/people/timothyd4y/sounds/472606/',
                           '  Licence: CC0 1.0 - https://creativecommons.org/publicdomain/zero/1.0/ - no attribution needed'],
}


def md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def run_ff(args):
    for attempt in range(3):
        r = subprocess.run([FFMPEG, '-nostats', '-loglevel', 'error', *args], capture_output=True)
        if not r.returncode:
            return r
        time.sleep(1 + attempt * 2)       # (Windows now and then holds the output file: the indexer / antivirus)
    raise RuntimeError(r.stderr.decode('utf-8', 'replace')[-400:])


def decode(path, t0=None, t1=None, af=None):
    """the source, read only → mono float at SR; `af` (11a-2) an ffmpeg filter chain run first, at the file's own rate + channels"""
    a = []
    if t0 is not None: a += ['-ss', f'{t0:.3f}']
    if t1 is not None: a += ['-t', f'{t1 - (t0 or 0):.3f}']
    r = run_ff([*a, '-i', str(path), '-map', '0:a:0', *(['-af', af] if af else []), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'])
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)


def duration(path):
    r = subprocess.run([FFMPEG, '-hide_banner', '-i', str(path)], capture_output=True, text=True, errors='replace')
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r.stderr)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 0.0


# ---- the meter + the limiter (scripts/build-neon-sfx.py's, at 32 kHz; the limiter works in 1 ms blocks: fast on minutes of audio)
def biquad(kind, fc, q, gain_db=0.0, fs=SR):
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * fc / fs; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    if kind == 'high_shelf':
        b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
        a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
    elif kind == 'peak':
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    else:  # high pass
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def lufs(x):
    b1, a1 = biquad('high_shelf', 1681.974450955533, 0.7071752369554196, 3.999843853973347)
    b2, a2 = biquad('high_pass', 38.13547087602444, 0.5003270373238773)
    y = lfilter(b2, a2, lfilter(b1, a1, x))
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    if len(y) < blk: return -0.691 + 10 * np.log10(np.mean(y ** 2) + 1e-12)
    ms = np.array([np.mean(y[i:i + blk] ** 2) for i in range(0, len(y) - blk + 1, hop)])
    ld = -0.691 + 10 * np.log10(ms + 1e-12)
    ms = ms[ld > -70]
    if not len(ms): return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(ms)) - 10
    ms2 = ms[(-0.691 + 10 * np.log10(ms + 1e-12)) > rel]
    return -0.691 + 10 * np.log10(np.mean(ms2 if len(ms2) else ms))


def momentary_peak(x):
    """where the take is loudest (s): the 400 ms window with the most K-weighted energy"""
    b1, a1 = biquad('high_shelf', 1681.974450955533, 0.7071752369554196, 3.999843853973347)
    y = lfilter(b1, a1, x) ** 2
    w = int(0.4 * SR)
    if len(y) <= w: return len(x) / SR / 2
    cs = np.concatenate([[0.0], np.cumsum(y)])
    c = cs[w:] - cs[:-w]
    return (int(np.argmax(c)) + w / 2) / SR


SWELL_DB = 15.0


def envelope(x, win=0.3, hop=0.05):
    """the short-time RMS envelope (dB): win s windows every hop s → (times at the windows' centres, dB)"""
    w, h = int(win * SR), int(hop * SR)
    if len(x) <= w: return np.array([len(x) / SR / 2]), np.array([10 * np.log10(np.mean(x ** 2) + 1e-15)])
    cs = np.concatenate([[0.0], np.cumsum(x ** 2)])
    idx = np.arange(0, len(x) - w + 1, h)
    return idx / SR + win / 2, 10 * np.log10((cs[idx + w] - cs[idx]) / w + 1e-15)


def swell(x, db=SWELL_DB):
    """the take's PEAK (s: the loudest 0.3 s of its RMS envelope — what the ear hears as 'nearest') + its SWELL [a, b] (s: where
    the envelope stays within `db` of the peak round it) — the motorcar crosses the visible street within it (FP3)"""
    t, e = envelope(x)
    i = int(np.argmax(e)); a = b = i
    while a > 0 and e[a - 1] > e[i] - db: a -= 1
    while b < len(e) - 1 and e[b + 1] > e[i] - db: b += 1
    return round(float(t[i]), 2), [round(float(t[a]), 2), round(float(t[b]), 2)]


def notch(y, freqs, q=12.0):
    from scipy.signal import iirnotch
    for f0 in freqs or []:
        b, a = iirnotch(f0, q, fs=SR)
        y = lfilter(b, a, y)
    return y


def lowpass(y, fc, order=4):
    return sosfiltfilt(butter(order, fc, 'lowpass', fs=SR, output='sos'), y)


def layered(path, t0, L, layers, pad=0.0):
    """THE SWARM: copies of one recording summed — each (offset s, rate, gain): read from t0 + offset at `rate` (a resample:
    pitch + speed × rate) for L s. Each copy is a continuous stretch of the source, so the loop's tail flows on from its body"""
    from scipy.signal import resample_poly
    out = np.zeros(int(round(L * SR)))
    for off, rate, g in layers:
        need = L * rate + 0.5
        raw = decode(path, t0 + off, t0 + off + need)
        # resample by rate (≈ p / q in thousandths): rate > 1 = faster + higher
        q, p = 1000, int(round(1000 / rate))
        y = resample_poly(raw, p, q)
        n = min(len(out), len(y))
        out[:n] += g * y[:n]
    return out


def blackout(y, at, k_hum=0.22, k_thump=1.6):
    """THE BLACKOUT (the TR-3B's power-down): the city's mains hum (60 Hz + its harmonics, a little buzzy) under the roar until
    `at` s, cut dead there (8 ms) with a LOW THUMP (55 → 38 Hz, its harmonics up to ~170 Hz so a phone hears it, ~0.35 s) on the
    turbine's own clunk. Levels relative to the recording's RMS before the cut."""
    n, i = len(y), int(at * SR)
    ref = np.sqrt(np.mean(y[max(0, i - SR):i] ** 2) + 1e-12)
    t = np.arange(n) / SR
    hum = sum((1 / k) * np.sin(2 * np.pi * 60 * k * t + k) for k in range(1, 7))
    hum = hum / (np.sqrt(np.mean(hum ** 2)) + 1e-12) * ref * k_hum
    env = np.zeros(n); env[:i] = 1.0
    ramp = min(i, int(0.6 * SR)); env[:ramp] *= np.linspace(0, 1, ramp)       # (eased in with the take)
    cut = int(0.008 * SR); env[i:i + cut] = np.linspace(1, 0, len(env[i:i + cut]))
    tt = np.maximum(0, t - at)
    f = 38 + 17 * np.exp(-tt / 0.08)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.28 * np.sin(3 * ph)) * np.exp(-tt / 0.22) * (t >= at)
    att = np.minimum(1, tt / 0.004)
    thump = body * att / 1.78 * ref * k_thump * 1.414
    return y + hum * env + thump


def seam_search(y, L, xf, span):
    """THE SEAM: the loop's start (within ±span s of the asked one) whose head (its first xf s) and tail (the xf s after the loop)
    match best — the same loudness (dB) and the same spectral tilt (low vs high energy) — so the runtime crossfade between them
    is never heard as a swell. y starts span s before the asked start. → the offset (s) from the asked start, the dB difference"""
    n, X = int(L * SR), int(xf * SR)
    b, a = butter(2, 1000, 'lowpass', fs=SR)
    lo = lfilter(b, a, y)
    hi = y - lo
    cs = lambda v: np.concatenate([[0.0], np.cumsum(v ** 2)])
    ca, cl, ch = cs(y), cs(lo), cs(hi)
    db = lambda c, i: 10 * np.log10((c[i + X] - c[i]) / X + 1e-15)
    best = (1e9, 0.0, 0.0)
    for k in range(0, int(2 * span * SR) + 1, int(0.1 * SR)):
        if k + n + X > len(y): break
        d = abs(db(ca, k) - db(ca, k + n))
        tilt = abs((db(cl, k) - db(ch, k)) - (db(cl, k + n) - db(ch, k + n)))
        score = d + 0.5 * tilt
        if score < best[0]: best = (score, k / SR - span, db(ca, k) - db(ca, k + n))
    return best[1], best[2]


def limit(y, ceil_db=CEIL_DB, release=0.08):
    c = 10 ** (ceil_db / 20)
    B = int(0.001 * SR)
    n = int(np.ceil(len(y) / B))
    pk = np.abs(np.pad(y, (0, n * B - len(y)))).reshape(n, B).max(axis=1)
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    need = np.minimum(need, np.concatenate([need[2:], [1.0, 1.0]]))       # a 2 ms look-ahead
    g = np.empty(n); cur = 1.0; r = 1 - np.exp(-1 / (release * 1000))
    for i in range(n):
        cur = need[i] if need[i] < cur else cur + (need[i] - cur) * r
        g[i] = cur
    gs = np.interp(np.arange(n * B), np.arange(n) * B + B / 2, g)[:len(y)]
    return y * gs


def level(y, target):
    for _ in range(3):                                   # (the limiter takes a little loudness: a few rounds)
        y = limit(y * 10 ** ((target - lufs(y)) / 20))
    return y


# ---- the slots (read from js/core/city-sounds.js: the one list) + the registry (generated)
def read_slots():
    src = SLOTS_JS.read_text(encoding='utf-8')
    return {m.group(1): m.group(3) for m in re.finditer(r"S\('([a-z0-9-]+)',\s*'([^']+)',\s*'(loop|once)'", src)}


HEADER = """// GENERATED by scripts/add-city-sfx.py — do not edit by hand (re-run the importer). CITY 2.0 — THE CITY SOUNDS' recordings
// (docs/audio.md#the-city-sounds): FILES[slot] = its takes in audio/city/ — { f: file, v: content hash (the ?v= cache key: /audio
// is cached for a week), d: s, lufs, loop + xf (a loop: its length + the tail crossfaded at runtime), peak (a one-shot: where it's
// loudest, s), from: [start, end] in the source (s), w: weight, src: the source file's stem }. A slot not listed here is EMPTY
// (silent). Where each source came from + its credit: audio/city/sources.json, audio/city/CREDITS.md.
"""


def read_registry():
    src = json.loads(SOURCES_JSON.read_text(encoding='utf-8')) if SOURCES_JSON.exists() else {}
    if not FILES_JS.exists(): return {}, src
    f = re.search(r'/\*FILES\*/(.*?)/\*END\*/', FILES_JS.read_text(encoding='utf-8'), re.S)
    return (json.loads(f.group(1)) if f else {}), src


def write_registry(files, sources):
    # (one take per line: valid JSON, so the importer reads it back; a diff shows what changed)
    j = lambda v: json.dumps(v, ensure_ascii=False)
    fl = ',\n'.join(f'  {j(k)}: [\n' + ',\n'.join(f'    {j(t)}' for t in sorted(files[k], key=lambda t: t['f'])) + '\n  ]' for k in sorted(files))
    FILES_JS.write_text(HEADER + 'export const FILES = /*FILES*/{\n' + fl + '\n}/*END*/;\n', encoding='utf-8', newline='\n')
    SOURCES_JSON.write_text(json.dumps({k: sources[k] for k in sorted(sources)}, indent=1, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')


# ---- the credits (credits.txt in the source folder: a block per file — its name at the line's start, the details indented)
def credit_blocks(folder):
    p = folder / 'credits.txt'
    if not p.exists(): return {}
    blocks, cur = {}, None
    for line in p.read_text(encoding='utf-8', errors='replace').splitlines():
        m = re.match(r'^([A-Za-z0-9_.-]+\.(?:wav|flac|mp3|m4a|ogg|aif|aiff|aac))\b', line)
        if m:
            cur = m.group(1); blocks[cur] = [line.rstrip()]
        elif cur and line.startswith((' ', '\t')) and line.strip():
            blocks[cur].append(line.rstrip())
        elif not line.strip():
            cur = None
    return blocks


def credit_for(blocks, name):
    if name in blocks: return blocks[name]
    stem = Path(name).stem
    for k, v in blocks.items():
        if Path(k).stem == stem: return v
    return CREDIT_BLOCK.get(name)


LICENCE_OK = re.compile(r'CC0|Sonniss|royalty-free|public domain|Mixkit Sound Effects Free License|Pixabay Content License', re.I)


def write_credits(sources):
    lines = ['# THE CITY SOUNDS — credits', '',
             'GENERATED by `scripts/add-city-sfx.py` from the source folder\'s `credits.txt` (docs/audio.md#the-city-sounds). Every',
             'recording here is CC0 (public domain) or from the Sonniss GDC Game Audio Bundles (royalty-free, commercial use, no',
             'attribution required; the raw files are not redistributed — only these edited, cut and re-encoded excerpts ship), or',
             '(8P) from Mixkit (the Mixkit Sound Effects Free License: commercial use, no attribution required) or Pixabay (the Pixabay',
             'Content License: commercial use, no attribution required — most of them copies of CC0 Freesound originals, noted). Credits',
             'are kept anyway, with each source file\'s MD5.', '']
    for stem in sorted(sources):
        s = sources[stem]
        lines += [f'## {s["file"]}  →  {", ".join(s.get("slots", []))}', '', f'- MD5 `{s["md5"]}`']
        for l in s.get('credit') or ['(no credit block found in credits.txt — CHECK THE LICENCE)']:
            lines.append(f'- {l.strip()}')
        if s.get('note'): lines.append(f'- NOTE: {s["note"]}')
        lines.append('')
    CREDITS.write_text('\n'.join(lines), encoding='utf-8', newline='\n')


# ---- one source file → its takes
def slot_of(stem, slots):
    if stem in slots: return stem, 1
    if ALIAS.get(stem) in slots: return ALIAS[stem], 1
    m = re.match(r'^(.*)-(\d+)$', stem)
    if m and m.group(1) in slots: return m.group(1), int(m.group(2))
    if m and ALIAS.get(m.group(1)) in slots: return ALIAS[m.group(1)], int(m.group(2))
    return None, 0


def default_cuts(path, kind):
    d = duration(path)
    if kind == 'loop':
        L = max(4.0, min(90.0, d - 2.0 - 2.5))
        return [{'loop': (1.0, L), 'xf': min(2.5, max(0.5, d - 2.0 - L))}]
    y = decode(path)
    pk = np.abs(y).max() + 1e-9
    on = np.where(np.abs(y) > pk * 10 ** (-45 / 20))[0]
    a, b = (on[0] / SR, on[-1] / SR) if len(on) else (0.0, d)
    return [{'cut': (max(0.0, a - 0.05), min(d, b + 0.3)), 'fin': 0.03, 'fout': min(1.5, (b - a) * 0.3)}]


def shape(y, cut):
    """the recipe's colour: the presence lift, the low-mid lift, notches, the low-pass (distance)"""
    if cut.get('lift'):
        b, a = biquad('peak', 2500, 0.8, cut['lift'])
        y = lfilter(b, a, y)
    if cut.get('presence'):
        db, hz = cut['presence']
        b, a = biquad('peak', hz, 0.7, db)
        y = lfilter(b, a, y)
    if cut.get('lowmid'):
        b, a = biquad('peak', 300, 0.7, cut['lowmid'])
        y = lfilter(b, a, y)
    if cut.get('notch'): y = notch(y, cut['notch'])
    if cut.get('sat'): y = saturate(y, *cut['sat'])
    if cut.get('dup'):
        # (8b1: a DUPLICATE layer high-passed at `hz`, `db` louder — a hum's harmonics carry it on a phone's speaker)
        hz, db = cut['dup']
        y = y + sosfiltfilt(butter(4, hz, 'highpass', fs=SR, output='sos'), y) * 10 ** (db / 20)
    if cut.get('deess'): y = deess(y, *cut['deess'])
    if cut.get('lp'): y = lowpass(y, cut['lp'])
    return y


def deess(y, db, lo, hi, ratio=3.0):
    """11a-2 — `deess` (dB, lo, hi): the lo–hi band split off (zero-phase, so band + rest = the input), its 10 ms level against its own
    median; where it pokes over, it comes down by (excess × (1 − 1/ratio)), at most `db` — a fast attack, a 60 ms release"""
    band = sosfiltfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), y)
    rest = y - band
    w = max(1, int(0.01 * SR))
    cs = np.concatenate([[0.0], np.cumsum(band ** 2)])
    idx = np.arange(len(y))
    a, b = np.maximum(0, idx - w // 2), np.minimum(len(y), idx + w // 2 + 1)
    env = 10 * np.log10((cs[b] - cs[a]) / (b - a) + 1e-15)
    red = np.clip((env - np.median(env)) * (1 - 1 / ratio), 0, db)
    out, cur, r = np.empty(len(y)), 0.0, 1 - np.exp(-32 / (0.06 * SR))
    for i in range(0, len(y), 32):
        t = red[i:i + 32].max()
        cur = t if t > cur else cur + (t - cur) * r
        out[i:i + 32] = cur
    return rest + band * 10 ** (-out / 20)


def reverb(y, wet, pre, rt60, lp, seed=11):
    """11a-2 — `verb` (wet, pre-delay s, RT60 s, lp Hz): a simple hall — a synthetic impulse (seeded noise × an exponential decay to
    −60 dB at rt60, low-passed at lp: the far end of a street is darker, never brighter), pre-delayed, convolved; the reverb brought
    to the dry's RMS and mixed (1 − wet) dry + wet reverb"""
    from scipy.signal import fftconvolve
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = np.random.default_rng(seed).standard_normal(n) * 10 ** (-3 * t / rt60)
    ir = sosfiltfilt(butter(2, lp, 'lowpass', fs=SR, output='sos'), ir)
    k = min(n, int(0.004 * SR)); ir[:k] *= np.linspace(0, 1, k)          # (a 4 ms onset: no click)
    ir = np.concatenate([np.zeros(int(pre * SR)), ir])
    w = fftconvolve(y, ir)[:len(y)]
    w *= np.sqrt(np.mean(y ** 2)) / (np.sqrt(np.mean(w ** 2)) + 1e-12)
    return (1 - wet) * y + wet * w


def mixin(y, off, L, m, folder):
    """11a-2 — `mixin` {f, at, lu, hp, lp}: another recording laid under a loop. y is the loop's decoded stretch with the loop's start
    at sample `off`; the mixin's `at` s lines up with it, read continuously for all of y (before its start: silence), its own low cut
    + colour, brought to `lu` LU against the main recording's body"""
    p = folder / m['f']
    s0 = m['at'] - off / SR
    z = decode(p, max(0.0, s0), s0 + len(y) / SR, m.get('af'))
    if s0 < 0: z = np.concatenate([np.zeros(int(round(-s0 * SR))), z])
    z = np.pad(z, (0, max(0, len(y) - len(z))))[:len(y)]
    z = shape(sosfiltfilt(butter(2, m.get('hp', 120), 'highpass', fs=SR, output='sos'), z), m)
    body = slice(off, off + int(round(L * SR)))
    z *= 10 ** ((lufs(y[body]) + m['lu'] - lufs(z[body])) / 20)
    return y + z


def saturate(y, drive, mix, lo):
    """8b1 — HARMONIC SATURATION (`sat`: drive, mix, lo Hz): a hum whose energy sits under ~150 Hz vanishes on a phone's speaker; the
    band under `lo` driven through a soft clipper (tanh, `drive` × its own peak) makes its harmonics, and only those (high-passed at
    `lo`) are mixed back in at `mix` × the band's level — the same note, heard through a phone (the low end itself kept)"""
    sos_lo = butter(4, lo, 'lowpass', fs=SR, output='sos')
    low = sosfiltfilt(sos_lo, y)
    pk = np.percentile(np.abs(low), 99.5) + 1e-9
    h = np.tanh(drive * low / pk) * pk / np.tanh(drive)
    h = sosfiltfilt(butter(4, lo, 'highpass', fs=SR, output='sos'), h)
    g = np.sqrt(np.mean(low ** 2)) / (np.sqrt(np.mean(h ** 2)) + 1e-12)
    return y + h * g * mix


def gain_env(y, segs, ramp=0.03):
    """`gainenv`: (t0, t1, dB) in the take's seconds — each segment's gain eased in / out over `ramp` s (raised cosine)"""
    g = np.zeros(len(y))
    for t0, t1, d in segs or []:
        i0, i1, r = int(t0 * SR), int(t1 * SR), max(1, int(ramp * SR))
        e = np.zeros(len(y)); e[max(0, i0):max(0, i1)] = 1.0
        k = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, r))
        a, b = max(0, i0 - r), max(0, i0)
        e[a:b] = k[r - (b - a):]
        a, b = min(len(y), i1), min(len(y), i1 + r)
        e[a:b] = k[::-1][:b - a]
        g += e * d
    return y * 10 ** (g / 20)


def gate(y, under_db, ratio=2.0, win=0.01, release=0.04):
    """`gate`: a soft downward expander — below (the loudest 10 ms − under_db) the level falls `ratio`× as fast (the hiss
    between a quiet recording's snips / steps); the gain eased (a fast attack, a `release` s fall)"""
    w = max(1, int(win * SR))
    cs = np.concatenate([[0.0], np.cumsum(y ** 2)])
    idx = np.arange(len(y))
    a, b = np.maximum(0, idx - w // 2), np.minimum(len(y), idx + w // 2 + 1)
    env = 10 * np.log10((cs[b] - cs[a]) / (b - a) + 1e-15)
    thr = env.max() + under_db
    gd = np.minimum(0.0, (env - thr) * (ratio - 1))
    out, cur, r = np.empty(len(y)), 0.0, 1 - np.exp(-1 / (release * SR))
    for i in range(0, len(y), 32):                       # (32-sample blocks: fast on short takes)
        t = gd[i:i + 32].max()
        cur = t if t > cur else cur + (t - cur) * min(1.0, r * 32)
        out[i:i + 32] = cur
    return y * 10 ** (out / 20)


def assemble(path, seq, folder):
    """`seq`: a take built from pieces — (file | None, t0, t1, at, dB): `file` another recording in the folder (None = this one),
    its t0–t1 placed at `at` s, a 3 ms fade in + 30 ms out on each piece. 8b1: two optional extras — `rev` (the piece played
    BACKWARDS: a truck pulling away, reversed, is one coming in and slowing) and `xf` (s: equal-power fades in + out, for a crossfade
    with the piece it overlaps)"""
    parts = []
    for p in seq:
        f, t0, t1, at, d = p[:5]
        rev, xf = (p[5] if len(p) > 5 else False), (p[6] if len(p) > 6 else 0.0)
        x = decode(folder / f if f else path, t0, t1) * 10 ** (d / 20)
        if rev: x = x[::-1].copy()
        if xf:
            n = min(len(x) // 3, int(xf * SR)); k = np.sin(np.linspace(0, np.pi / 2, n))
            x[:n] *= k; x[-n:] *= k[::-1]
        else:
            nI, nO = int(0.003 * SR), min(len(x) // 3, int(0.03 * SR))
            x[:nI] *= np.linspace(0, 1, nI); x[-nO:] *= np.linspace(1, 0, nO)
        parts.append((int(round(at * SR)), x))
    y = np.zeros(max(i + len(x) for i, x in parts))
    for i, x in parts: y[i:i + len(x)] += x
    return y


def process(path, stem, slot, kind, cut, k, ncuts, tmp):
    hp = cut.get('hp', 120 if kind == 'loop' else 100)
    sos = butter(2, hp, 'highpass', fs=SR, output='sos')
    pad = 1.0
    if cut.get('seq'):
        # THE SECRET KNOCK (8P): a take assembled from pieces, then the same chain (low cut, colour, fades, level)
        y = shape(sosfiltfilt(sos, assemble(path, cut['seq'], path.parent)), cut)
        t0, t1 = 0.0, len(y) / SR
        cut = {**cut, 'cut': (t0, t1)}
        off = 0
    elif 'loop' in cut and cut.get('layers'):
        # THE SWARM: layered copies (each a continuous stretch: the tail flows on from the body; no seam search)
        t0, L = cut['loop']; xf = cut.get('xf', 2.5)
        raw = layered(path, t0, L + xf + 2 * pad, cut['layers'])
        y = shape(sosfiltfilt(sos, raw), cut)
        off = int(round(pad * SR))
    elif 'loop' in cut:
        t0, L = cut['loop']; xf = cut.get('xf', 2.5)
        # the seam: the start nudged (± `search` s, default 5) to where the head and the tail match best
        span = cut.get('search', 5.0)
        a0 = max(0.0, t0 - span - pad)
        raw = decode(path, a0, t0 + span + L + xf + pad, cut.get('af'))
        f = shape(sosfiltfilt(sos, raw), {**cut, 'lp': None})
        s0 = max(a0 + pad, t0 - span)
        if s0 >= t0 + span: s0 = max(0.0, t0 - span)       # (11a-2: a loop within its pre-roll of the file's start — search without it)
        i0 = int(round((s0 - a0) * SR))
        dt, _ = seam_search(f[i0:], L, xf, (t0 + span - s0) / 2)
        t0 = s0 + (t0 + span - s0) / 2 + dt
        cut = {**cut, 'loop': (round(t0, 2), L)}
        raw = decode(path, max(0.0, t0 - pad), t0 + L + xf + pad, cut.get('af'))
        off = int(round((t0 - max(0.0, t0 - pad)) * SR))
        y = shape(sosfiltfilt(sos, raw), cut)
        if cut.get('mixin'): y = mixin(y, off, L, cut['mixin'], path.parent)
    else:
        t0, t1 = cut['cut']
        raw = decode(path, max(0.0, t0 - pad), t1 + pad, cut.get('af'))
        off = int(round((t0 - max(0.0, t0 - pad)) * SR))
        y = shape(sosfiltfilt(sos, raw), cut)
    if cut.get('verb'): y = reverb(y, *cut['verb'])
    hit = None
    if 'loop' in cut:
        y = y[off:off + int(round((L + xf) * SR))]
        body = int(round(L * SR))
        # (the level is the body's — the tail only overlaps the head at the seam)
        g = 10 ** ((LOOP_LUFS - lufs(y[:body])) / 20)
        y = limit(y * g)
        g2 = 10 ** ((LOOP_LUFS - lufs(y[:body])) / 20)
        y = limit(y * g2)
        seam = lufs(y[:int(xf * SR)]) - lufs(y[body:body + int(xf * SR)])
        info = {'loop': round(L, 3), 'xf': round(xf, 3), 'from': [round(t0, 2), round(t0 + L + xf, 2)]}
        note = f'from {t0:.2f} s · seam: head vs tail {seam:+.1f} dB'
    else:
        y = y[off:off + int(round((t1 - t0) * SR))]
        if cut.get('gainenv'): y = gain_env(y, cut['gainenv'])
        if cut.get('gate') is not None: y = gate(y, cut['gate'])
        if cut.get('mark') is not None: hit = float(cut['mark'])
        if cut.get('blackout') is not None:
            hit = float(cut['blackout'])
            y = blackout(y, hit)
        fin, fout = cut.get('fin', 0.6), cut.get('fout', 1.8)
        nI, nO = int(fin * SR), int(min(fout, (t1 - t0) * 0.6) * SR)
        if nI: y[:nI] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, nI))
        if nO: y[-nO:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nO))
        y = level(y, ONCE_LUFS)
        pk, sw = swell(y)
        info = {'peak': pk, 'sw': sw, 'from': [round(t0, 2), round(t1, 2)]}
        if hit is not None: info['hit'] = round(hit, 2)
        note = f'peak at {pk:.2f} s, swell {sw[0]:.2f}–{sw[1]:.2f} s'
    name = f'{cut["name"]}.mp3' if cut.get('name') else f'{stem}{f"_{k + 1}" if ncuts > 1 else ""}.mp3'
    wav = Path(tmp) / (name + '.wav')
    import scipy.io.wavfile as wf
    wf.write(str(wav), SR, np.clip(y, -1, 1).astype(np.float32))
    dst = OUT / name
    run_ff(['-y', '-i', str(wav), '-map_metadata', '-1', '-ac', '1', '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', f'{cut["kbps"]}k' if cut.get('kbps') else BITRATE, str(dst)])
    back = decode(dst)
    take = {'f': name, 'v': md5(dst)[:8], 'd': round(len(back) / SR, 3), 'lufs': round(lufs(back[:int(info['loop'] * SR)] if 'loop' in info else back), 1), **info, 'src': stem}
    if 'peak' in info:
        # (measured again on the file as it ships: the MP3's own delay + padding shift it a few ms)
        take['peak'], take['sw'] = swell(back)
    if cut.get('w') is not None: take['w'] = cut['w']
    if cut.get('rate'): take['r'] = cut['rate']
    pkdb = 20 * np.log10(np.abs(back).max() + 1e-9)
    print(f'  {name:28s} {take["d"]:6.2f} s  {take["lufs"]:6.1f} LUFS  peak {pkdb:5.1f} dBFS  {dst.stat().st_size / 1024:6.0f} KB  {note}')
    return take


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default=str(SRC))
    ap.add_argument('--only', default='')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')      # (a Windows console: cp1252 can't print →)
    except Exception: pass
    folder = Path(a.src)
    slots = read_slots()
    if not slots: sys.exit('no slots found in js/core/city-sounds.js')
    only = set(x for x in a.only.split(',') if x)
    files, sources = read_registry()
    blocks = credit_blocks(folder)
    todo = []
    for p in sorted(folder.iterdir()) if folder.exists() else []:
        if p.suffix.lower() not in AUDIO: continue
        if p.stem in SKIP: print(f'- {p.name}: not imported (SKIP — see the note at SKIP)'); continue
        slot, n = slot_of(p.stem, slots)
        if not slot: print(f'? {p.name}: no slot called that (js/core/city-sounds.js) — skipped'); continue
        cs = CUTS.get(p.stem) or []
        if only and slot not in only and not any(c.get('to') in only for c in cs): continue
        todo.append((p, slot))
    if not todo: print(f'nothing to import in {folder}'); return
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for p, slot in todo:
            stem, kind = p.stem, slots[slot]
            h = md5(p)
            cuts = CUTS.get(stem) or default_cuts(p, kind)
            extra = sorted(set(s for c in cuts for s in [*c.get('also', []), *([c['to']] if c.get('to') else [])]))
            print(f'{p.name} → {slot}{" + " + ", ".join(extra) if extra else ""} ({kind}, {len(cuts)} take{"s" if len(cuts) > 1 else ""}{", default cut" if stem not in CUTS else ""})')
            for s in extra:
                if s not in slots: sys.exit(f'CUTS[{stem}] shares with an unknown slot: {s}')
            cr = credit_for(blocks, p.name)
            if not cr: print('  ! no credit block for it in credits.txt — CHECK THE LICENCE before committing')
            elif not LICENCE_OK.search(' '.join(cr)): print('  ! its credit block names no CC0 / Sonniss / royalty-free licence — CHECK IT')
            if a.dry_run: continue
            # (this source's old takes go: re-importing replaces them)
            for sid in list(files):
                files[sid] = [t for t in files[sid] if t.get('src') != stem]
                if not files[sid]: del files[sid]
            for k, c in enumerate(cuts):
                to = c.get('to', slot)
                take = process(p, stem, to, slots[to], c, k, len(cuts), tmp)
                for sid in [to, *c.get('also', [])]:
                    files.setdefault(sid, []).append(take)
            used_slots = sorted(set([c.get('to', slot) for c in cuts] + [s for c in cuts for s in c.get('also', [])]))
            sources[stem] = {'file': p.name, 'md5': h, 'slots': used_slots, 'credit': cr, 'note': CREDIT_NOTE.get(stem)}
            # (a take assembled from other files of the folder — a `seq` piece, a `mixin` layer: those are credited too)
            for f in sorted(set([x[0] for c in cuts for x in c.get('seq', []) if x[0]] + [c['mixin']['f'] for c in cuts if c.get('mixin')])):
                q = p.parent / f
                sources[Path(f).stem] = {'file': f, 'md5': md5(q), 'slots': used_slots, 'credit': credit_for(blocks, f), 'note': CREDIT_NOTE.get(Path(f).stem)}
    if a.dry_run: return
    # (the files no take points at any more: gone)
    used = {t['f'] for ts in files.values() for t in ts}
    for f in OUT.glob('*.mp3'):
        if f.name not in used: f.unlink(); print(f'  removed {f.name} (no take uses it)')
    write_registry(files, sources)
    write_credits(sources)
    total = sum(f.stat().st_size for f in OUT.glob('*.mp3'))
    print(f'registered {sum(len(v) for v in files.values())} takes in {len(files)} slots → {FILES_JS.relative_to(ROOT)}; audio/city/ {total / 1e6:.2f} MB; credits → {CREDITS.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
