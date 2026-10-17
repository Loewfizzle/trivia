#!/usr/bin/env python3
"""SLIPSTREAM song pipeline: source audio -> stereo MP3 + song analysis JSON + manifest.

    python scripts/build-slip.py              # new / changed songs from ~/Downloads
    python scripts/build-slip.py --force      # re-analyse every song
    python scripts/build-slip.py --src DIR --only 9,10

Finds slip1.mp3, slip-2.mp3, Slip_3.m4a ... (slip + number; mp3/m4a/wav/ogg/flac). Writes
  audio/music/slipN.mp3     stereo 44.1 kHz 112 kbps, full length (a ride plays songs whole, crossfading on)
  data/slip/slipN.json      BPM, beat grid, per-beat energy, duration
  data/slip/manifest.json   every song: id, title, artist, BPM, duration, mean energy
The analysis runs on the *encoded* file decoded back (same beat-grid search as PULSE / PRISM DROP).
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
DATA_OUT = ROOT / 'data' / 'slip'
NAME_RE = re.compile(r'^slip[\s_-]*(\d+)\.(mp3|m4a|aac|wav|ogg|flac)$', re.I)
SR = 22050


def encode(src, dst):
    cmd = [bm.FFMPEG, '-v', 'error', '-y', '-i', str(src), '-vn', '-map_metadata', '-1',
           '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '112k', str(dst)]
    subprocess.run(cmd, check=True)


def analyze(path):
    y = bm.decode(path, SR)
    dur = len(y) / SR
    _, y_p = librosa.effects.hpss(y)
    grid, bpm, drift, steady = bm.beat_grid(y_p, SR)
    e_short, e_section = bm.per_beat_energy(y, SR, grid)
    return dict(duration=round(dur, 3), bpm=round(bpm, 2), grid=grid, energy=e_short, section=e_section,
                steady=steady, drift=drift)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(Path.home() / 'Downloads'))
    ap.add_argument('--only', default='')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    only = {int(x) for x in a.only.split(',') if x.strip()}
    for p in sorted(Path(a.src).iterdir()):
        mt = NAME_RE.match(p.name)
        if not mt:
            continue
        n = int(mt.group(1))
        if only and n not in only:
            continue
        sid = f'slip{n}'
        out_mp3, out_json = AUDIO_OUT / f'{sid}.mp3', DATA_OUT / f'{sid}.json'
        old = json.loads(out_json.read_text()) if out_json.exists() else None
        sig = f'{p.stat().st_size}:{int(p.stat().st_mtime)}'
        if old and old.get('src') == sig and out_mp3.exists() and not a.force:
            continue
        print(f'{sid}: encoding {p.name}')
        encode(p, out_mp3)
        r = analyze(out_mp3)
        title, artist = bm.tags(p, n)
        if old and old.get('title') and not old['title'].startswith('Track '):
            title, artist = old['title'], old.get('artist', artist)
        doc = dict(id=sid, title=title, artist=artist, src=sig, duration=r['duration'], bpm=r['bpm'],
                   period=round(60.0 / r['bpm'], 6), steady=bool(r['steady']),
                   beats=[round(float(t), 3) for t in r['grid']],
                   energy=[round(float(e), 2) for e in r['energy']],
                   section=[round(float(e), 2) for e in r['section']],
                   meanEnergy=round(float(np.mean(r['energy'])), 3))
        out_json.write_text(json.dumps(doc, separators=(',', ':')))
        print(f'  {r["bpm"]} BPM · {r["duration"]:.1f}s · drift {r["drift"]} ms · mean energy {doc["meanEnergy"]}')
    docs = sorted((json.loads(f.read_text()) for f in DATA_OUT.glob('slip*.json') if f.stem != 'manifest'),
                  key=lambda d: int(d['id'][4:]))
    songs = [dict(id=d['id'], title=d['title'], artist=d['artist'], bpm=d['bpm'], duration=d['duration'],
                  meanEnergy=d['meanEnergy']) for d in docs]
    (DATA_OUT / 'manifest.json').write_text(json.dumps(dict(songs=songs), indent=1))
    print(f'manifest: {len(songs)} songs')


if __name__ == '__main__':
    main()
