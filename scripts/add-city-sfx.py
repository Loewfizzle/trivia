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
    'car-1920s-pass': [{'cut': (13.0, 31.5)}, {'cut': (127.0, 146.5)}],
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
}
# source files named after what they are, not their slot (the folder's names) → the slot
ALIAS = {'heli-flyby': 'helicopter', 'airliner-high': 'airliner-far', 'jets-formation': 'jet-flyby', 'tr3b-powerdown': 'tr3b-power-down',
         'club-murmur': 'club-murmur-calm', 'mirror-door': 'door-heavy', 'bar-ambience-close': 'bar-open', 'window-sash': 'window-sash-up',
         'secret-knock': 'door-knock'}
# never imported (8P): the diesel bus stand-ins (the 1945 truck's takes instead), the "haunted" door alternatives, the TV murmur (MUSIC
# held in it — G4 / E5 / G5 notes for 1–1.9 s at 26–41 s — and one clear talker: modulation 0.5–1.1), the slot (inside the knock)
SKIP = {'bus-idle', 'bus-depart', 'mirror-door-open', 'mirror-door-close', 'tv-murmur', 'door-slot'}
PIXABAY = ('The file imported is the Pixabay MP3 copy named in this block (Pixabay Content License) of the CC0 Freesound original — '
           'the lossless original was not in the folder (drop it in under the same name and re-run to upgrade).')
CREDIT_NOTE = {
    'heli-flyby': PIXABAY, 'prop-plane': PIXABAY, 'balloon-burner': PIXABAY, 'geese': PIXABAY,
    'bar-ambience-close': PIXABAY, 'shop-bell': PIXABAY, 'broom-sweep': PIXABAY, 'window-sash': PIXABAY, 'roller-blind': PIXABAY,
    'cat-land': PIXABAY, 'rooftop-party': PIXABAY,
    'bus-door': 'A Pixabay original (Pixabay Content License: free for commercial use, no attribution required) — no Freesound original.',
    'secret-knock': 'THE SECRET KNOCK is assembled from four of its knocks + door-slot.wav (credited below) as the peephole slot.',
    'door-slot': 'Used inside door-knock (THE SECRET KNOCK: the peephole slot after the knocks).',
    'gulls': 'The file imported is the lossless Freesound original named in this block (TRP, sound 574388, CC0 1.0; FLAC 48 kHz '
             '24-bit stereo, 0:52), not the Pixabay MP3 copy.',
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


def decode(path, t0=None, t1=None):
    a = []
    if t0 is not None: a += ['-ss', f'{t0:.3f}']
    if t1 is not None: a += ['-t', f'{t1 - (t0 or 0):.3f}']
    r = run_ff([*a, '-i', str(path), '-map', '0:a:0', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'])
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
    return None


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
    if cut.get('lp'): y = lowpass(y, cut['lp'])
    return y


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
    its t0–t1 placed at `at` s, a 3 ms fade in + 30 ms out on each piece"""
    parts = []
    for f, t0, t1, at, d in seq:
        x = decode(folder / f if f else path, t0, t1) * 10 ** (d / 20)
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
        raw = decode(path, a0, t0 + span + L + xf + pad)
        f = shape(sosfiltfilt(sos, raw), {**cut, 'lp': None})
        s0 = max(a0 + pad, t0 - span)
        i0 = int(round((s0 - a0) * SR))
        dt, _ = seam_search(f[i0:], L, xf, (t0 + span - s0) / 2)
        t0 = s0 + (t0 + span - s0) / 2 + dt
        cut = {**cut, 'loop': (round(t0, 2), L)}
        raw = decode(path, max(0.0, t0 - pad), t0 + L + xf + pad)
        off = int(round((t0 - max(0.0, t0 - pad)) * SR))
        y = shape(sosfiltfilt(sos, raw), cut)
    else:
        t0, t1 = cut['cut']
        raw = decode(path, max(0.0, t0 - pad), t1 + pad)
        off = int(round((t0 - max(0.0, t0 - pad)) * SR))
        y = shape(sosfiltfilt(sos, raw), cut)
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
            # (a take assembled from other files of the folder: those are credited too)
            for f in sorted(set(x[0] for c in cuts for x in c.get('seq', []) if x[0])):
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
