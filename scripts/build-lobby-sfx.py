#!/usr/bin/env python3
"""LOBBY 2.0 A — THE LOBBY SOUNDS (docs/audio.md#the-lobby-sounds). One command:

    ~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/build-lobby-sfx.py [--src <folder>]

The source = Grok's folder (default ~/Downloads/Grok/lobby-sfx — READ ONLY: decoded through ffmpeg, never written); his PICK per sound
(claude-notes.txt) with his cut points + fades: card-in = 571577 el_boss playing-card-deal (0.230–0.600, fade 0.45–0.60), invite = 855977
hazelr1ver suction-tube (1.300–2.510, a 0.2-s fade-in, the pop at 2.27, fade-out 2.47–2.51), friend = 835833 bogumilamerc wine-glasses
clinking (0.470–0.880, −2 dB — its true peak is over 0 in the original). The same pipeline as build-progression-sfx.py: mono 44.1 kHz, a 3-ms
fade-in on a cut, LEVELLED QUIET (felt more than heard) by BS.1770 to the target below, the true peak under −1.5 dBFS → MP3 → audio/sfx/
lb-<name>.mp3. The palette: js/audio/lobby-sfx.js. All CC0 — credits.txt's lines in js/ui/credits.js.
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import lfilter
import imageio_ffmpeg

SR = 44100
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'audio' / 'sfx'

# name: (layers [(file, t0, t1, at s, gain dB)], fade-out (t0, t1) in the RESULT's seconds | None, target LUFS, fade-in s)
SOUNDS = {
    'card-in': ([('571577__el_boss__playing-card-deal-variation-1.wav', 0.230, 0.600, 0, 0)], (0.22, 0.37), -26, 0),
    'invite':  ([('855977__hazelr1ver__suction-tube-with-fade-in-and-pop.mp3', 1.300, 2.510, 0, 0)], (1.17, 1.21), -25, 0.2),
    'friend':  ([('835833__bogumilamerc__wine-glasses-clinking.wav', 0.470, 0.880, 0, -2)], None, -24, 0),
}


def decode(path, t0, t1):
    cmd = [FFMPEG, '-v', 'error', '-ss', f'{t0:.4f}', '-t', f'{t1 - t0:.4f}', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def biquad(kind, f0, q, gain_db=0.0):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; c, s = np.cos(w), np.sin(w); al = s / (2 * q)
    if kind == 'high_shelf':
        b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
        a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
    else:
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def lufs(x):
    """BS.1770 integrated loudness; a sound shorter than a 400 ms block is measured over its own length (a tick is 72 ms)."""
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


def true_peak(y):
    up = np.interp(np.arange(0, len(y) - 1, 0.25), np.arange(len(y)), y)   # a 4× look (linear — close enough for a −1 dB margin)
    return max(np.abs(y).max(), np.abs(up).max())


def build(src, name, spec):
    layers, fade, target, fin = spec
    parts = []
    for f, t0, t1, at, gain in layers:
        x = decode(src / f, t0, t1) * 10 ** (gain / 20)
        if t0 > 0:
            n = int(0.003 * SR); x[:n] *= np.linspace(0, 1, n)
        parts.append((int(at * SR), x))
    n = max(o + len(x) for o, x in parts)
    y = np.zeros(n)
    for o, x in parts: y[o:o + len(x)] += x
    if fin:
        k = int(fin * SR); y[:k] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k))
    if fade:
        a, b = int(fade[0] * SR), min(n, int(fade[1] * SR))
        if b > a: y[a:b] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b - a))
        y = y[:b]
    for _ in range(3):
        y = y * 10 ** ((target - lufs(y)) / 20)
        tp = true_peak(y)
        if tp > 10 ** (-1.5 / 20): y *= 10 ** (-1.5 / 20) / tp
    return y, lufs(y), 20 * np.log10(true_peak(y) + 1e-12)


def encode(y, dst):
    raw = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    cmd = [FFMPEG, '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '96k', str(dst)]
    subprocess.run(cmd, input=raw, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(Path.home() / 'Downloads' / 'Grok' / 'lobby-sfx'))
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    src = Path(args.src)
    if not src.is_dir(): sys.exit(f'no folder {src}')
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in SOUNDS.items():
        y, L, tp = build(src, name, spec)
        dst = OUT / f'lb-{name}.mp3'
        print(f'{name:12s} {len(y) / SR:5.2f} s  {L:6.1f} LUFS  TP {tp:5.1f} dBFS  -> {dst.relative_to(ROOT)}')
        if not args.dry_run: encode(y, dst)


if __name__ == '__main__':
    main()
