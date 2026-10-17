#!/usr/bin/env python3
"""PRISM DROP song pipeline: source audio -> stereo MP3 + song analysis JSON + manifest.

    python scripts/build-prism.py              # new / changed songs from ~/Downloads
    python scripts/build-prism.py --force      # re-analyse every song (keeps world choices unless --reworld)
    python scripts/build-prism.py --src DIR --only 6,7

Finds prism1.mp3, prism-2.mp3, Prism_3.m4a ... (prism + number; mp3/m4a/wav/ogg/flac). A file named just
"prism.mp3" gets the lowest unused number (printed). Writes
  audio/music/prismN.mp3     stereo 44.1 kHz 112 kbps, full length (the match plays the whole song)
  data/prism/prismN.json     beat grid, downbeat, key + scale, per-beat energy, the final beat, world
  data/prism/manifest.json   every song: title, artist, BPM, key, length, world
The analysis runs on the *encoded* file decoded back, so beat times match what browsers play.
Beat grid: the same search as PULSE (scripts/build-beatmaps.py). Key: Krumhansl-Schmuckler profiles on a
harmonic chroma. World: chosen from the song's mood (tempo, energy, brightness, major/minor) — each song gets
its own world while unused ones remain; set "world" in the song's JSON by hand to override (kept on rebuilds).
Requires the PULSE venv (see CLAUDE.md -> PULSE): librosa imageio-ffmpeg mutagen soundfile.
"""
import argparse
import importlib.util
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import librosa

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('bm', ROOT / 'scripts' / 'build-beatmaps.py')
bm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bm)

AUDIO_OUT = ROOT / 'audio' / 'music'
DATA_OUT = ROOT / 'data' / 'prism'
NAME_RE = re.compile(r'^prism[\s_-]*(\d*)\.(mp3|m4a|aac|wav|ogg|flac)$', re.I)
SR = 22050
KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
# the worlds the renderer knows (js/games/prism/worlds.js) and the mood each one suits
WORLDS = {
    #            tempo (bpm)  energy  brightness  major?
    'aurora':   dict(bpm=95, energy=0.35, bright=0.35, major=0.5),   # aurora over a dark ocean: calm, wide
    'city':     dict(bpm=125, energy=0.75, bright=0.55, major=0.2),  # neon city at night: driving, urban
    'nebula':   dict(bpm=110, energy=0.50, bright=0.30, major=0.1),  # deep-space nebula: spacious, dark
    'crystal':  dict(bpm=118, energy=0.55, bright=0.75, major=0.6),  # crystal cave: sparkling, bright
    'sunset':   dict(bpm=132, energy=0.70, bright=0.65, major=0.9),  # synthwave sunset: upbeat, warm
}


def encode(src, dst):
    cmd = [bm.FFMPEG, '-v', 'error', '-y', '-i', str(src), '-vn', '-map_metadata', '-1',
           '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '112k', str(dst)]
    subprocess.run(cmd, check=True)


def detect_key(y_h, sr):
    chroma = librosa.feature.chroma_cqt(y=y_h, sr=sr, hop_length=2048)
    prof = chroma.mean(axis=1)
    best = []
    for mode, ref in (('major', MAJOR), ('minor', MINOR)):
        for k in range(12):
            r = float(np.corrcoef(prof, np.roll(ref, k))[0, 1])
            best.append((r, k, mode))
    best.sort(reverse=True)
    r, k, mode = best[0]
    return k, mode, round(r, 3), round(r - best[1][0], 3)


def final_beat(grid, energy, dur):
    """The last beat that still carries the song (energy above a floor) — the finale lands on it."""
    floor = max(0.18, float(np.percentile(energy, 40)) * 0.5)
    idx = [i for i, e in enumerate(energy) if e >= floor and grid[i] < dur - 0.5]
    return float(grid[idx[-1]]) if idx else float(grid[-1])


def mood(y, sr, bpm, energy, mode):
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=2048)[0]
    bright = float(np.clip((np.median(cent) - 700) / 1800, 0, 1))
    return dict(bpm=bpm, energy=float(np.mean(energy)), bright=round(bright, 3), major=1.0 if mode == 'major' else 0.0)


def world_scores(m):
    out = {}
    for w, t in WORLDS.items():
        d = ((m['bpm'] - t['bpm']) / 30) ** 2 + ((m['energy'] - t['energy']) / 0.25) ** 2 \
            + ((m['bright'] - t['bright']) / 0.3) ** 2 + ((m['major'] - t['major']) / 0.8) ** 2
        out[w] = round(float(d), 3)
    return out


def analyze(path):
    y = bm.decode(path, SR)
    dur = len(y) / SR
    y_h, y_p = librosa.effects.hpss(y)
    grid, bpm, drift, steady = bm.beat_grid(y_p, SR)
    env, times = bm.band_envelopes(y_p, SR)
    lows = np.array([bm.window_max(env['low'], times, t) for t in grid])
    phase = int(np.argmax([lows[p::4].sum() for p in range(4)]))
    e_short, _ = bm.per_beat_energy(y, SR, grid)
    tonic, mode, conf, margin = detect_key(y_h, SR)
    m = mood(y, SR, bpm, e_short, mode)
    return dict(duration=round(dur, 3), bpm=round(bpm, 2), grid=grid, phase=phase, energy=e_short, steady=steady,
                drift=drift, tonic=tonic, mode=mode, keyConf=conf, keyMargin=margin, mood=m,
                lastBeat=round(final_beat(grid, e_short, dur), 3))


def find_sources(src):
    found, loose = {}, []
    for p in sorted(Path(src).iterdir()):
        mt = NAME_RE.match(p.name)
        if not mt:
            continue
        if mt.group(1):
            found[int(mt.group(1))] = p
        else:
            loose.append(p)
    for p in loose:  # "prism.mp3": the lowest free number
        n = 1
        while n in found:
            n += 1
        found[n] = p
        print(f'  {p.name}: no number in the name -> treated as prism{n}')
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(Path.home() / 'Downloads'))
    ap.add_argument('--only', default='')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--reworld', action='store_true', help='re-pick every song world from its mood')
    a = ap.parse_args()
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    only = {int(x) for x in a.only.split(',') if x.strip()}
    sources = find_sources(a.src)
    for n, src in sorted(sources.items()):
        if only and n not in only:
            continue
        sid = f'prism{n}'
        out_mp3, out_json = AUDIO_OUT / f'{sid}.mp3', DATA_OUT / f'{sid}.json'
        old = json.loads(out_json.read_text()) if out_json.exists() else None
        sig = f'{src.stat().st_size}:{int(src.stat().st_mtime)}'
        if old and old.get('src') == sig and out_mp3.exists() and not a.force:
            continue
        print(f'{sid}: encoding {src.name}')
        encode(src, out_mp3)
        r = analyze(out_mp3)
        title, artist = bm.tags(src, n)
        if old and old.get('title') and not old['title'].startswith('Track '):
            title, artist = old['title'], old.get('artist', artist)
        period = 60.0 / r['bpm']
        doc = dict(id=sid, title=title, artist=artist, src=sig, duration=r['duration'], bpm=r['bpm'],
                   steady=bool(r['steady']), period=round(period, 6), phase=r['phase'],
                   beats=[round(float(t), 3) for t in r['grid']],
                   energy=[round(float(e), 2) for e in r['energy']],
                   tonic=r['tonic'], key=KEYS[r['tonic']], mode=r['mode'], keyConf=r['keyConf'],
                   lastBeat=r['lastBeat'], mood=r['mood'], worldFit=world_scores(r['mood']),
                   world=(old or {}).get('world'))
        out_json.write_text(json.dumps(doc, separators=(',', ':')))
        print(f'  {r["bpm"]} BPM · {KEYS[r["tonic"]]} {r["mode"]} (conf {r["keyConf"]}, margin {r["keyMargin"]}) · '
              f'{r["duration"]:.1f}s · last beat {r["lastBeat"]}s · drift {r["drift"]} ms · mood {r["mood"]}')
    assign_worlds(a.reworld)


def assign_worlds(reworld):
    docs = {p.stem: json.loads(p.read_text()) for p in sorted(DATA_OUT.glob('prism*.json')) if p.stem != 'manifest'}
    used = {d['world'] for d in docs.values() if d.get('world') and not reworld}
    # songs without a world: best fit among unused worlds (all worlds once every one is taken)
    pending = [d for d in docs.values() if reworld or not d.get('world')]
    free = [w for w in WORLDS if w not in used]
    if pending and len(pending) <= len(free) and len(free) <= 8:
        # few songs: the assignment with the best total fit (every song its own world)
        import itertools
        best = min(itertools.permutations(free, len(pending)),
                   key=lambda ws: sum(d['worldFit'][w] for d, w in zip(pending, ws)))
        for d, w in zip(pending, best):
            docs[d['id']]['world'] = w
            print(f"  {d['id']}: world {w}")
        pending = []
    while pending:
        free = [w for w in WORLDS if w not in used] or list(WORLDS)
        best = min(((d['worldFit'][w], d['id'], w) for d in pending for w in free))
        _, sid, w = best
        docs[sid]['world'] = w
        used.add(w)
        pending = [d for d in pending if d['id'] != sid]
        print(f'  {sid}: world {w}')
    songs = []
    for sid, d in sorted(docs.items(), key=lambda kv: int(kv[0][5:])):
        (DATA_OUT / f'{sid}.json').write_text(json.dumps(d, separators=(',', ':')))
        songs.append(dict(id=sid, title=d['title'], artist=d['artist'], bpm=d['bpm'], key=d['key'], mode=d['mode'],
                          duration=d['duration'], lastBeat=d['lastBeat'], world=d['world']))
    (DATA_OUT / 'manifest.json').write_text(json.dumps(dict(songs=songs), indent=1))
    print(f'manifest: {len(songs)} songs')


if __name__ == '__main__':
    main()
