"""Ground truth for scripts/build-beatmaps.py: synthetic tracks with drums at exactly known times (over a
busy bass/pad bed) go through the same encode -> decode -> beat_grid path; prints grid error vs the truth.
Run after changing the grid code:  python scripts/check-beatgrid.py   (expect |median| < 2 ms at every tempo)"""
import os, sys, json, subprocess, tempfile, importlib.util
import numpy as np
import librosa
spec = importlib.util.spec_from_file_location('bm', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-beatmaps.py'))
bm = importlib.util.module_from_spec(spec); spec.loader.exec_module(bm)

sr = 44100
rng = np.random.default_rng(1)
def track(bpm, dur=60.0, first=1.0):
    n = int(dur * sr)
    y = np.zeros(n)
    T = 60 / bpm
    beats = np.arange(first, dur - 1, T)
    t = np.arange(int(0.25 * sr)) / sr
    kick = np.sin(2 * np.pi * (50 * t + (110 - 50) * (1 - np.exp(-t * 30)) / 30)) * np.exp(-t * 18)
    snare = rng.standard_normal(int(0.18 * sr)) * np.exp(-np.arange(int(0.18 * sr)) / sr * 25) * 0.5
    hat = rng.standard_normal(int(0.05 * sr)) * np.exp(-np.arange(int(0.05 * sr)) / sr * 90) * 0.18
    def add(sig, at):
        i = int(round(at * sr)); y[i:i + len(sig)] += sig[:max(0, n - i)]
    for k, b in enumerate(beats):
        add(kick, b)
        if k % 2 == 1: add(snare, b)
        add(hat, b + T / 2); add(hat, b)
    # busy bed: bass line on eighths + pad (what confuses detectors)
    tt = np.arange(n) / sr
    bass_f = 55 * 2 ** (np.floor(tt / (2 * T)) % 4 / 12 * 3)
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(bass_f) / sr) * (0.6 + 0.4 * np.sin(2 * np.pi * tt / (T / 2)) ** 2)
    y += 0.08 * np.sin(2 * np.pi * 220 * tt) + 0.06 * np.sin(2 * np.pi * 277 * tt)
    return (y / np.max(np.abs(y)) * 0.9).astype(np.float32), beats

for bpm in (98, 120, 128, 140, 165):
    y, truth = track(bpm)
    d = tempfile.mkdtemp()
    wav, mp3 = os.path.join(d, 'a.f32'), os.path.join(d, 'a.mp3')
    y.tofile(wav)
    subprocess.run([bm.FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', wav,
                    '-c:a', 'libmp3lame', '-b:a', '96k', mp3], check=True)
    ya = bm.decode(mp3, bm.SR)
    _, y_p = librosa.effects.hpss(ya)
    grid, est_bpm, drift, steady = bm.beat_grid(y_p, bm.SR)
    # match each true beat to the nearest grid line
    err = np.array([grid[np.argmin(np.abs(grid - t))] - t for t in truth[4:-4]]) * 1000
    dec_len = len(ya) / bm.SR
    print(f'{bpm} BPM -> est {est_bpm:.2f}; grid - truth: median {np.median(err):+.1f} ms, spread {np.percentile(err, 10):+.1f}..{np.percentile(err, 90):+.1f}; drift {drift} steady {steady}')
