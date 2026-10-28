#!/usr/bin/env python3
"""POLISH 5 — two city sounds SYNTHESIZED (the owner: "built from the water sounds already in the folder or synthesized — no new Grok
batch"): written as WAVs into a folder the city-sounds importer reads, then imported like any recording (cut, levelled, encoded, registered):

    python -I scripts/build-synth-sfx.py                       # writes ~/Downloads/city-sfx-synth/{hydrant-spray,periscope-ping,cat-hiss,tower-horn-3}.wav + credits.txt
    ~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city-sfx.py --src ~/Downloads/city-sfx-synth --only hydrant-spray,periscope-ping   (9g: --only tower-horn — HORN C)

  * hydrant-spray (a loop): an open fire hydrant — the pressurized stream's HISS (noise, 2.2–7 kHz, a slow uneven flutter) over the
    SPLASH where it lands on the cobbles (a dense rain of short droplet grains, 400 Hz–2.6 kHz, + a soft low wash) — mid-range, for a
    phone's speaker
  * periscope-ping (a one-shot): a submarine's SONAR PING as the periscope breaks the surface — a clean 1.25 kHz ping (5 ms attack, a
    slight downward glide), its long UNDERWATER ECHO: a 3.6 s dark reverb tail (filtered decaying noise convolved) + two soft discrete
    returns — all of it in the 0.6–2.5 kHz band a phone plays
Deterministic (seeded), mono 44.1 kHz 16-bit. Licence: made here, CC0.
"""
import os
import numpy as np
import scipy.io.wavfile as wf
from scipy.signal import butter, sosfiltfilt, fftconvolve

SR = 44100
OUT = os.path.expanduser('~/Downloads/city-sfx-synth')
rng = np.random.default_rng(1924)


def band(x, lo, hi, order=4):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype='band', output='sos')
    return sosfiltfilt(sos, x)


def low(x, fc, order=4):
    return sosfiltfilt(butter(order, fc / (SR / 2), btype='low', output='sos'), x)


def smooth_noise(n, rate_hz):
    """a slow random wobble (0..1-ish): noise points every 1/rate s, cubic-ish interpolated"""
    k = max(2, int(n / SR * rate_hz) + 2)
    pts = rng.random(k)
    xs = np.linspace(0, k - 1, n)
    i = np.floor(xs).astype(int); f = xs - i; f = f * f * (3 - 2 * f)
    i1 = np.minimum(i + 1, k - 1)
    return pts[i] * (1 - f) + pts[i1] * f


def norm(x, peak=0.89):
    return x / max(1e-9, np.abs(x).max()) * peak


def hydrant(dur=42.0):
    n = int(dur * SR)
    # the hiss: the stream itself, bright + steady, a slow uneven breath in its pressure
    hiss = band(rng.standard_normal(n), 2200, 7000) * (0.75 + 0.25 * smooth_noise(n, 0.7)) * (0.92 + 0.08 * smooth_noise(n, 6))
    # the splash: droplet grains on the cobbles — thousands of 3–14 ms decaying noise bursts, a little louder in irregular gusts
    splash = np.zeros(n)
    grains = int(dur * 900)
    starts = rng.integers(0, n - 800, grains)
    for st in starts:
        L = int(SR * rng.uniform(0.003, 0.014))
        env = np.exp(-np.linspace(0, 6, L))
        splash[st:st + L] += rng.standard_normal(L) * env * rng.uniform(0.2, 1.0)
    splash = band(splash, 400, 2600) * (0.7 + 0.3 * smooth_noise(n, 1.3))
    wash = low(rng.standard_normal(n), 380) * 0.35
    y = 0.42 * norm(hiss) + 0.8 * norm(splash) + 0.25 * norm(wash)
    return norm(y)


def ping(dur=5.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 1250 * (1 - 0.018 * (1 - np.exp(-t / 0.5)))            # (a slight downward glide)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, t / 0.005) * np.exp(-t / 0.42)
    dry = (np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)) * env
    # the underwater echo: a dark decaying noise IR (3.6 s) + two soft discrete returns (the hull, the far bottom)
    Li = int(3.6 * SR); ti = np.arange(Li) / SR
    ir = band(rng.standard_normal(Li), 500, 2400, 2) * np.exp(-ti / 0.9) * np.minimum(1, ti / 0.03)
    ir = ir / np.abs(ir).max()
    wet = fftconvolve(dry, ir)[:n]
    wet = norm(wet, 1.0)
    echo = np.zeros(n)
    for d, g in ((0.46, 0.42), (0.95, 0.22), (1.6, 0.1)):
        k = int(d * SR); echo[k:] += dry[:n - k] * g
    echo = band(echo, 600, 2300, 2)
    y = 0.95 * norm(dry, 1.0) + 0.55 * wet + 0.6 * norm(echo, 1.0)
    y = band(y, 450, 4200, 2)                                   # (the phone's band; nothing below the speaker)
    fade = np.ones(n); fl = int(0.4 * SR); fade[-fl:] = np.cos(np.linspace(0, np.pi / 2, fl)) ** 2
    return norm(y * fade)


def hiss(dur=0.95):
    """11a-1: a cat's HISS — a sharp breathy spit at the start, a held hiss (2.4–7.5 kHz noise with a fast flutter), a throaty growl
    under it (a phone barely plays it; the hiss carries), a quick release"""
    n = int(dur * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.018) * np.where(t < 0.62, 1.0 - 0.18 * t, np.exp(-(t - 0.62) / 0.11))
    noise = band(rng.standard_normal(n), 2400, 7500) * env * (0.82 + 0.18 * smooth_noise(n, 22))
    k = int(0.04 * SR); spit = np.zeros(n); spit[:k] = band(rng.standard_normal(k), 1200, 5200) * np.hanning(2 * k)[:k]
    growl = band(rng.standard_normal(n), 320, 950) * env * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t))
    y = 0.85 * norm(noise) + 0.7 * norm(spit) + 0.18 * norm(growl)
    return norm(band(y, 600, 9000, 2))


def horn(blasts=((0.0, 1.15), (1.6, 1.15), (3.2, 1.6)), tail=2.6):
    """9g — HORN C: a deep COMPRESSED-AIR WARNING HORN (a demolition site's), three blasts (short, short, long). Two horns in a FIFTH
    (~154 + ~231 Hz, the owner's 150–230 Hz), each a detuned pair of saw + square partials; air horns BEND UP as the pressure builds
    (≈ −5 % → pitch over 0.12 s), a slight SAG as the valve closes; a soft tanh drive (the compressed, brassy edge), a formant lift
    round 550 + 1300 Hz (the bell of the horn — what a phone's speaker plays), a breath of air noise; then FAR: a room + distance
    reverb (a seeded noise IR, 2.2 s, low-passed) under the dry, the highs rolled off — a horn across the harbor, not in your ear"""
    n = int((blasts[-1][0] + blasts[-1][1] + tail) * SR); t = np.arange(n) / SR
    dry = np.zeros(n)
    for t0, d in blasts:
        i0, L = int(t0 * SR), int((d + 0.35) * SR)
        tt = np.arange(L) / SR
        bend = 1 - 0.05 * np.exp(-tt / 0.045) - 0.025 * np.clip((tt - d + 0.12) / 0.3, 0, 1)
        env = np.minimum(1, tt / 0.035) * np.where(tt < d, 1.0, np.exp(-(tt - d) / 0.07))
        env *= 0.94 + 0.06 * np.sin(2 * np.pi * 5.5 * tt)               # (the air's own flutter)
        y = np.zeros(L)
        for f0, g in ((154.0, 1.0), (231.0, 0.72)):
            for det in (-0.004, 0.004):
                ph = 2 * np.pi * np.cumsum(f0 * (1 + det) * bend) / SR
                saw = 2 * ((ph / (2 * np.pi)) % 1.0) - 1
                sq = np.sign(np.sin(ph)) * 0.6
                y += g * (0.65 * saw + 0.35 * sq)
        y = np.tanh(1.6 * y / np.abs(y).max()) * env
        air = band(rng.standard_normal(L), 900, 3200, 2) * env * 0.035
        dry[i0:i0 + L] += y + air
    # the bell's formants (a phone plays these), the top rolled off
    f1 = band(dry, 420, 720, 2); f2 = band(dry, 1050, 1600, 2)
    dry = low(dry + 1.1 * f1 + 0.6 * f2, 3600)
    dry = band(dry, 110, 5000, 2)
    # the room + the distance
    Li = int(2.2 * SR); ti = np.arange(Li) / SR
    ir = low(rng.standard_normal(Li), 1800, 2) * np.exp(-ti / 0.55) * np.minimum(1, ti / 0.02)
    ir[:int(0.035 * SR)] = 0                                            # (pre-delay: the far wall)
    wet = fftconvolve(dry, ir / np.abs(ir).max())[:n]
    y = 0.8 * norm(dry, 1.0) + 0.5 * norm(wet, 1.0)
    fade = np.ones(n); fl = int(0.6 * SR); fade[-fl:] = np.cos(np.linspace(0, np.pi / 2, fl)) ** 2
    return norm(y * fade)


def write(name, y):
    os.makedirs(OUT, exist_ok=True)
    wf.write(os.path.join(OUT, name), SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
    print('wrote', os.path.join(OUT, name), f'{len(y) / SR:.1f} s')


if __name__ == '__main__':
    write('hydrant-spray.wav', hydrant())
    write('periscope-ping.wav', ping())
    write('cat-hiss.wav', hiss())
    write('tower-horn-3.wav', horn())
    with open(os.path.join(OUT, 'credits.txt'), 'w', encoding='utf-8') as fh:
        for f, what in (('hydrant-spray.wav', 'an open fire hydrant: the stream’s hiss + the splash on cobbles'), ('periscope-ping.wav', 'a submarine sonar ping with its underwater echo'), ('cat-hiss.wav', 'a cat’s hiss (11a-1)'), ('tower-horn-3.wav', 'a deep compressed-air warning horn, three blasts, far (9g: HORN C)')):
            fh.write(f'{f}\n    {what} — synthesized by scripts/build-synth-sfx.py (POLISH 5), seeded; made here — CC0 1.0 (public domain)\n\n')
    print('credits.txt written')
