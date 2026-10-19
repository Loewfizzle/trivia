#!/usr/bin/env python3
"""MOOD MUSIC: import new mood songs, analyse every menu-eligible track, and sort them into the five moods.

    ~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-mood-music.py            # import + analyse + assign
    ... --retire-temporary late       # also drop TEMPORARY songs from a mood that has enough keepers
    ... --keep-assignments            # analyse/import, but leave existing songs where they are (only place new ones)

Imports from ~/Downloads (re-encoded stereo 44.1 kHz 112 kbps into audio/music/, originals untouched):
  lofi1.mp3, lofi2.mp3            -> late1.mp3, late2.mp3 (one-time names)
  late3.mp3 … morn1.mp3 … day1.mp3 … eve1.mp3 … party1.mp3 …   (mood + number; mp3/m4a/wav/ogg/flac)
Every imported song is a KEEPER in the mood its name says (the owner picked it for that mood). The rest of the pool
(every other track in audio/music except the fanfares and anything shorter than 75 s) is TEMPORARY.

Analysis (on the encoded file, mono 22.05 kHz): tempo (librosa beat tracker, folded into 70–160), energy (mean RMS in
dB and how much it moves), onset density (rhythmic busyness), brightness (spectral centroid, Hz), key + mode
(Krumhansl–Schmuckler on a chroma). Scores per mood (features normalised across the pool, 0..1):
  late    = calm + dark + slow            (lo-fi, cozy)
  morning = bright + major + mid tempo + gentle energy
  day     = energy + brightness + tempo
  evening = minor + mid energy + steady pulse (night-drive synthwave)
  party   = energy + busyness + tempo + major
Each song goes to ONE mood: best score first, capped at 8 per mood, every mood topped up to 5 from its closest fits.
Writes data/mood-music.json (the one file to edit: move a song by changing its "mood"; keep "keeper" true for songs
the owner chose).
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import librosa
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
MUSIC = ROOT / 'audio' / 'music'
OUT = ROOT / 'data' / 'mood-music.json'
DL = Path.home() / 'Downloads'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
MOODS = ['late', 'morning', 'day', 'evening', 'party']
PREFIX = {'late': 'late', 'morn': 'morning', 'day': 'day', 'eve': 'evening', 'party': 'party'}
EXCLUDE = re.compile(r'^victory\d*$')
MIN_LEN = 75.0
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def encode(src, dst):
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(src), '-vn', '-map_metadata', '-1',
                    '-ar', '44100', '-ac', '2', '-b:a', '112k', str(dst)], check=True)


def import_new(db):
    added = []
    for name, target in [('lofi1', 'late1'), ('lofi2', 'late2')]:
        for ext in ('mp3', 'm4a', 'wav'):
            src = DL / f'{name}.{ext}'
            if src.exists() and not (MUSIC / f'{target}.mp3').exists():
                encode(src, MUSIC / f'{target}.mp3'); added.append((target, 'late'))
    for src in sorted(DL.iterdir()):
        m = re.match(r'^(late|morn|day|eve|party)[-_ ]?(\d+)\.(mp3|m4a|wav|ogg|flac)$', src.name, re.I)
        if not m:
            continue
        target = f'{m.group(1).lower()}{int(m.group(2))}'
        if (MUSIC / f'{target}.mp3').exists():
            continue
        encode(src, MUSIC / f'{target}.mp3'); added.append((target, PREFIX[m.group(1).lower()]))
    for t, mood in added:
        db.setdefault(t, {})
        db[t].update({'keeper': True, 'mood': mood, 'named': True})
        print(f'  imported {t}.mp3 -> {mood} (KEEPER)')
    return added


def analyse(path):
    y, sr = librosa.load(str(path), sr=22050, mono=True)
    dur = len(y) / sr
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    while bpm > 160: bpm /= 2
    while bpm < 70: bpm *= 2
    rms = librosa.feature.rms(y=y)[0]
    db = 20 * np.log10(np.maximum(rms, 1e-5))
    loud = float(np.percentile(db, 70))
    move = float(np.std(db[db > np.percentile(db, 10)]))
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    busy = float(len(librosa.onset.onset_detect(onset_envelope=onset, sr=sr)) / max(1.0, dur))
    cent = float(np.median(librosa.feature.spectral_centroid(y=y, sr=sr)[0]))
    chroma = librosa.feature.chroma_cqt(y=librosa.effects.harmonic(y), sr=sr).mean(axis=1)
    best = (-9, 0, 'major')
    for k in range(12):
        for prof, mode in ((MAJOR, 'major'), (MINOR, 'minor')):
            r = float(np.corrcoef(chroma, np.roll(prof, k))[0, 1])
            if r > best[0]: best = (r, k, mode)
    # how sure the mode is: the gap between the best major and best minor fit
    maj = max(float(np.corrcoef(chroma, np.roll(MAJOR, k))[0, 1]) for k in range(12))
    mnr = max(float(np.corrcoef(chroma, np.roll(MINOR, k))[0, 1]) for k in range(12))
    return {'dur': round(dur, 2), 'bpm': round(bpm, 1), 'loud': round(loud, 2), 'move': round(move, 2), 'busy': round(busy, 2),
            'bright': round(cent), 'key': f"{NOTES[best[1]]} {best[2]}", 'mode': best[2], 'majorness': round(maj - mnr, 3)}


def norm(vals):
    a = np.array(vals, dtype=float); lo, hi = np.percentile(a, 5), np.percentile(a, 95)
    return np.clip((a - lo) / max(1e-9, hi - lo), 0, 1)


def scores(feats):
    ids = list(feats)
    E = norm([feats[i]['loud'] for i in ids]); T = norm([feats[i]['bpm'] for i in ids]); B = norm([feats[i]['bright'] for i in ids])
    Bu = norm([feats[i]['busy'] for i in ids]); M = norm([feats[i]['majorness'] for i in ids])
    out = {}
    for k, i in enumerate(ids):
        e, t, b, bu, m = E[k], T[k], B[k], Bu[k], M[k]
        mid_t = 1 - abs(t - 0.5) * 2
        out[i] = {
            'late': 0.42 * (1 - e) + 0.28 * (1 - b) + 0.2 * (1 - t) + 0.1 * (1 - bu),
            'morning': 0.34 * b + 0.28 * m + 0.2 * mid_t + 0.18 * (1 - abs(e - 0.45) * 2),
            'day': 0.4 * e + 0.25 * b + 0.2 * t + 0.15 * bu,
            'evening': 0.32 * (1 - m) + 0.26 * (1 - abs(e - 0.6) * 2) + 0.22 * (1 - b * 0.7) + 0.2 * mid_t,
            'party': 0.36 * e + 0.26 * bu + 0.2 * t + 0.18 * m,
        }
    return out


def assign(sc, db, keep):
    """Optimal: maximise the total fit over every song, each mood holding 5..8 songs (scipy's assignment solver over
    'slots': the first 5 of each mood carry a bonus so every mood fills to 5). Keepers / kept songs stay put."""
    from scipy.optimize import linear_sum_assignment
    fixed = {i: d['mood'] for i, d in db.items() if i in sc and (d.get('keeper') or (keep and d.get('mood')))}
    free = [i for i in sc if i not in fixed]
    slots = []
    for m in MOODS:
        have = sum(1 for v in fixed.values() if v == m)
        for k in range(have, 8):
            slots.append((m, k < 5))
    cost = np.zeros((len(free), len(slots)))
    for r, i in enumerate(free):
        for c, (m, must) in enumerate(slots):
            cost[r, c] = -(sc[i][m] + (1.0 if must else 0.0))
    rows, cols = linear_sum_assignment(cost)
    mood = dict(fixed)
    for r, c in zip(rows, cols):
        mood[free[r]] = slots[c][0]
    return mood


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--retire-temporary', default='')
    ap.add_argument('--keep-assignments', action='store_true')
    a = ap.parse_args()
    old = json.loads(OUT.read_text()) if OUT.exists() else {'songs': {}}
    db = {i: dict(d) for i, d in old.get('songs', {}).items()}
    import_new(db)
    feats = {}
    seen = {}
    import hashlib
    for p in sorted(MUSIC.glob('*.mp3')):
        i = p.stem
        if EXCLUDE.match(i): continue
        h = hashlib.md5(p.read_bytes()).hexdigest()
        if h in seen:
            print(f'  skip {i}: the same file as {seen[h]}'); continue
        seen[h] = i
        f = analyse(p)
        if f['dur'] < MIN_LEN:
            print(f'  skip {i}: {f["dur"]:.0f} s'); continue
        feats[i] = f
        print(f'  {i:15s} {f["bpm"]:6.1f} bpm  {f["loud"]:6.1f} dB  busy {f["busy"]:4.1f}/s  {f["bright"]:5d} Hz  {f["key"]}')
    sc = scores(feats)
    if a.retire_temporary:
        for i in [i for i, d in db.items() if d.get('mood') == a.retire_temporary and not d.get('keeper')]:
            db.pop(i, None); feats.pop(i, None); sc.pop(i, None)
    mood = assign(sc, db, a.keep_assignments)
    songs = {}
    for i in sorted(feats, key=lambda j: (MOODS.index(mood[j]), -sc[j][mood[j]])):
        d = db.get(i, {})
        best = max(MOODS, key=lambda m: sc[i][m])
        songs[i] = {'mood': mood[i], 'keeper': bool(d.get('keeper')), **feats[i],
                    'score': {m: round(sc[i][m], 2) for m in MOODS}, 'bestFit': best}
    doc = {
        '_about': 'MOOD MUSIC (docs/audio.md). Move a song: change its "mood". keeper=true: the owner chose it (never retired). '
                  'Rebuilt by scripts/build-mood-music.py (keeps keepers; --keep-assignments keeps every song in place).',
        'moods': {m: [i for i in songs if songs[i]['mood'] == m] for m in MOODS},
        'songs': songs,
    }
    OUT.write_text(json.dumps(doc, indent=1))
    for m in MOODS:
        print(f'\n{m.upper()}')
        for i in doc['moods'][m]:
            s = songs[i]
            print(f'  {i:15s} {s["bpm"]:6.1f} bpm  {"KEEPER" if s["keeper"] else "temp  "}  {s["key"]:9s}  fit {s["score"][m]:.2f}  (best: {s["bestFit"]})')


if __name__ == '__main__':
    main()
