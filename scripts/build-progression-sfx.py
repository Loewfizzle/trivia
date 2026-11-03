#!/usr/bin/env python3
"""PROGRESSION A — THE 9 PROGRESSION SOUNDS (docs/audio.md#the-progression-sounds). One command:

    ~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/build-progression-sfx.py [--src <folder>]

The source = Grok's folder (default ~/Downloads/Grok/progression-sfx — READ ONLY: decoded through ffmpeg, never written). His PICK per
sound (claude-notes.txt) with his cut points, fades, gains + the two LAYERED sounds (flash = the shutter + the powder burst; card-reveal =
the woosh + the crystal bell 0.18 s later). Each: mono 44.1 kHz (the bells live above 2 kHz — kept), a 3 ms fade-in on a cut that doesn't
start at 0, a raised-cosine fade-out, LEVELLED QUIET (CLAUDE.md: felt, not heard) — ITU-R BS.1770 K-weighted (build-neon-sfx.py's meter)
to its target below, the true peak under −1 dBFS — then MP3 128 kbps → audio/sfx/pg-<name>.mp3. The palette: js/audio/progress-sfx.js.
Sonniss licence v2.0: only these trimmed, encoded game assets ship — never the raw folder. Credits: js/ui/credits.js (credits.txt's lines).
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

# name: (layers [(file, t0, t1, at s, gain dB)], fade-out (t0, t1) in the RESULT's seconds | None, target LUFS)
CLICK = 'Antique Clicker 2, Clock, Ticking, Tick, Tock, Click, Rhythm, Time, Watch, Countdown.wav'
SOUNDS = {
    'xp-tick':      ([(CLICK, 0.098, 0.170, 0, 0)], (0.05, 0.072), -27),
    'xp-total':     ([('mixkit-gear-metallic-lock-sound-2858.wav', 0.020, 0.340, 0, 0)], (0.28, 0.32), -23),
    'level-up':     ([('Bell_Waiter_Fienup_001.wav', 0.000, 1.800, 0, 0)], (1.20, 1.80), -21),
    'medal-flip':   ([('Foley Coin Flip Single Fast.wav', 0.000, 0.550, 0, 0)], (0.40, 0.55), -25),
    'flame-on':     ([('256510__hunter4708__gas-start.wav', 0.100, 1.000, 0, 0)], (0.50, 0.90), -25),
    'flash':        ([('368177__caculo__kodak-brownie-shutter-sound.wav', 0.450, 0.620, 0, -6),
                      ('232130__werra__vintage-camera-flash-powder-and-shutter.wav', 0.500, 1.500, 0, -4)], (0.60, 1.00), -23),
    'polaroid':     ([('345906__satanicupsman__polaroid-taking-picture.wav', 1.800, 3.300, 0, 0)], (1.35, 1.50), -25),
    'card-reveal':  ([('Woosh Sweep Slide Infographics Basic.wav', 0.020, 0.300, 0, -3),
                      ('614832__arseniiv__2022-01-14-crystal-bell-08.flac', 0.000, 0.800, 0.18, -6)], (0.73, 0.98), -23),
    'achievement':  ([('mixkit-service-bell-931.wav', 0.005, 0.500, 0, 0)], (0.35, 0.495), -22),
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
    layers, fade, target = spec
    parts = []
    for f, t0, t1, at, gain in layers:
        x = decode(src / f, t0, t1) * 10 ** (gain / 20)
        if t0 > 0:
            n = int(0.003 * SR); x[:n] *= np.linspace(0, 1, n)
        parts.append((int(at * SR), x))
    n = max(o + len(x) for o, x in parts)
    y = np.zeros(n)
    for o, x in parts: y[o:o + len(x)] += x
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
    cmd = [FFMPEG, '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '128k', str(dst)]
    subprocess.run(cmd, input=raw, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(Path.home() / 'Downloads' / 'Grok' / 'progression-sfx'))
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    src = Path(args.src)
    if not src.is_dir(): sys.exit(f'no folder {src}')
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in SOUNDS.items():
        y, L, tp = build(src, name, spec)
        dst = OUT / f'pg-{name}.mp3'
        print(f'{name:12s} {len(y) / SR:5.2f} s  {L:6.1f} LUFS  TP {tp:5.1f} dBFS  -> {dst.relative_to(ROOT)}')
        if not args.dry_run: encode(y, dst)


if __name__ == '__main__':
    main()
