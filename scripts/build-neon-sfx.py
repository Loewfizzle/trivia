# Build CITY 2.0's recorded NEON SOUNDS (NEON PASS 2) from the owner's picks in ~/Downloads/neon (Freesound, all CC0):
#   125064 everydaysounds  "faulty fluorescent light starter hum"  → neon-dropout (its buzz cutting out) + neon-hum-loop (its steady hum)
#   351430 kinoton         "neon lamp switch on hum"               → neon-power-on (the strike settling into the hum)
#   500693 bolkmar         "neon tube light flickering"            → neon-flicker-1, -2
#   202612 ludwigmueller   "fxlm neon lights flicker bathroom"      → neon-flicker-3, -4
# Mono, 44.1 kHz, 16-bit WAV (the hum must be a .wav: .ogg isn't reliable on older iPhones, an mp3 gaps at the loop). Fades; the
# hum loop crossfaded into itself (seamless); every file's loudness set with the ITU-R BS.1770 K-weighting — the hum −24 LUFS, the
# rest −20 LUFS — and its peak held under −1 dBFS. Run: python -I scripts/build-neon-sfx.py  (writes audio/sfx/neon-*.wav)
import os, sys, warnings
import numpy as np
import scipy.io.wavfile as wf
from scipy.signal import resample_poly, lfilter
warnings.filterwarnings('ignore')

SRC = os.path.expanduser('~/Downloads/neon/')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio', 'sfx')
SR = 44100

def load(name):
    sr, d = wf.read(os.path.join(SRC, name))
    d = d.astype(np.float64)
    if d.ndim > 1: d = d.mean(axis=1)
    d /= max(1e-9, np.abs(d).max())
    g = np.gcd(sr, SR)
    return resample_poly(d, SR // g, sr // g)

def biquad(kind, fc, q, gain_db=0.0, fs=SR):
    # RBJ cookbook (pyloudnorm's K-weighting uses the same forms)
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * fc / fs; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    if kind == 'high_shelf':
        b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
        a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
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

def cut(x, t0, t1, fin=0.005, fout=0.12):
    y = x[int(t0 * SR):int(t1 * SR)].copy()
    nI, nO = int(fin * SR), int(fout * SR)
    y[:nI] *= np.linspace(0, 1, nI)
    y[-nO:] *= np.linspace(1, 0, nO) ** 2
    return y

def limit(y, ceil_db=-1.0, release=0.06):
    # a gentle peak limiter: the gain drops at once where a peak would pass the ceiling and recovers smoothly
    c = 10 ** (ceil_db / 20)
    need = np.minimum(1.0, c / np.maximum(np.abs(y), 1e-9))
    g = np.empty_like(need); cur = 1.0; r = 1 - np.exp(-1 / (release * SR))
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else cur + (min(1.0, need[i]) - cur) * r
        g[i] = cur
    # a 2 ms look-ahead: the gain leads the peak a little (no click)
    la = int(0.002 * SR); g = np.minimum(g, np.concatenate([g[la:], np.ones(la)]))
    return y * g

def level(y, target):
    for _ in range(3):                                   # (the limiter lowers the loudness a little: a few rounds)
        y = limit(y * 10 ** ((target - lufs(y)) / 20))
    pk = np.abs(y).max()
    lim = 10 ** (-1 / 20)
    if pk > lim: y *= lim / pk                         # (peak under −1 dBFS: the loudness then sits a little lower)
    return y

def loop(x, t0, length, xf=0.35):
    # the loop's length nudged (±20 ms) to where the hum's wave lines up with its start (the best correlation), then the tail
    # crossfaded linearly into the head (in phase, so the level holds through the seam): seamless when looped
    X, a = int(xf * SR), int(t0 * SR)
    head = x[a:a + X]
    best, L = -2, int(length * SR)
    for c in range(int((length - 0.02) * SR), int((length + 0.02) * SR)):
        tail = x[a + c:a + c + X]
        r = np.dot(head, tail) / (np.linalg.norm(head) * np.linalg.norm(tail) + 1e-12)
        if r > best: best, L = r, c
    s = x[a:a + L + X].copy()
    out = s[:L].copy()
    w = np.linspace(0, 1, X)
    out[:X] = s[:X] * w + s[L:L + X] * (1 - w)
    return out

def save(name, y):
    os.makedirs(OUT, exist_ok=True)
    wf.write(os.path.join(OUT, name), SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
    print(f'{name:22s} {len(y) / SR:5.2f} s  {lufs(y):6.1f} LUFS  peak {20 * np.log10(np.abs(y).max() + 1e-9):5.1f} dBFS  {os.path.getsize(os.path.join(OUT, name)) // 1024} KB')

starter = load('125064__everydaysounds__faulty-fluorescent-light-starter-hum.wav')
switch = load('351430__kinoton__neon-lamp-switch-on-hum.wav')
flick1 = load('500693__bolkmar__neon-tube-light-flickering.wav')
flick2 = load('202612__ludwigmueller__fxlm-neon-lights-flicker-bathroom.wav')

save('neon-flicker-1.wav', level(cut(flick1, 2.22, 3.05, fout=0.14), -20))
save('neon-flicker-2.wav', level(cut(flick1, 7.78, 8.42, fout=0.12), -20))
save('neon-flicker-3.wav', level(cut(flick2, 4.04, 4.86, fout=0.14), -20))
save('neon-flicker-4.wav', level(cut(flick2, 12.80, 13.55, fout=0.14), -20))
save('neon-power-on.wav', level(cut(switch, 0.16, 2.3, fin=0.004, fout=0.5), -20))
save('neon-dropout.wav', level(cut(starter, 1.2, 1.95, fin=0.02, fout=0.18), -20))
save('neon-hum-loop.wav', level(loop(starter, 4.0, 3.0), -24))
