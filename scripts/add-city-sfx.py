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
    # (7:01 mono, a 1945 Mercedes L3750 truck, several takes: the clean distant drive-by at 281–307 s, peak ~291 s) — a slow,
    # heavy pass: also the dawn delivery truck
    'car-1920s-pass-3': [{'cut': (283.0, 306.5), 'w': 0.35, 'also': ['truck-delivery']}],
    # (0:52, the lossless Freesound original; a city's low rumble under it. 0–13 s: single calls with clean harmonic arches at a
    # ~1.1–1.3 kHz fundamental — gull "kyow"s; 13 s on: a whole colony chattering at once, no single calls. Broadband clicks at
    # 5.4 / 6.75 / 12.25 s stay outside the takes. A high low-cut: the call is all that matters)
    'gulls': [
        {'cut': (0.15, 1.95), 'fin': 0.08, 'fout': 0.7, 'hp': 350},
        {'cut': (2.05, 3.65), 'fin': 0.08, 'fout': 0.6, 'hp': 350},
        {'cut': (3.7, 5.2), 'fin': 0.08, 'fout': 0.6, 'hp': 350, 'w': 0.6},
        {'cut': (6.85, 8.6), 'fin': 0.08, 'fout': 0.7, 'hp': 350},
    ],
}
CREDIT_NOTE = {
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


LICENCE_OK = re.compile(r'CC0|Sonniss|royalty-free|public domain', re.I)


def write_credits(sources):
    lines = ['# THE CITY SOUNDS — credits', '',
             'GENERATED by `scripts/add-city-sfx.py` from the source folder\'s `credits.txt` (docs/audio.md#the-city-sounds). Every',
             'recording here is CC0 (public domain) or from the Sonniss GDC Game Audio Bundles (royalty-free, commercial use, no',
             'attribution required; the raw files are not redistributed — only these edited, cut and re-encoded excerpts ship). Credits',
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
    m = re.match(r'^(.*)-(\d+)$', stem)
    if m and m.group(1) in slots: return m.group(1), int(m.group(2))
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


def process(path, stem, slot, kind, cut, k, ncuts, tmp):
    hp = cut.get('hp', 120 if kind == 'loop' else 100)
    sos = butter(2, hp, 'highpass', fs=SR, output='sos')
    pad = 1.0
    if 'loop' in cut:
        t0, L = cut['loop']; xf = cut.get('xf', 2.5)
        # the seam: the start nudged (± `search` s, default 5) to where the head and the tail match best
        span = cut.get('search', 5.0)
        a0 = max(0.0, t0 - span - pad)
        raw = decode(path, a0, t0 + span + L + xf + pad)
        f = sosfiltfilt(sos, raw)
        if cut.get('lift'):
            b, a = biquad('peak', 2500, 0.8, cut['lift'])
            f = lfilter(b, a, f)
        s0 = max(a0 + pad, t0 - span)
        i0 = int(round((s0 - a0) * SR))
        dt, _ = seam_search(f[i0:], L, xf, (t0 + span - s0) / 2)
        t0 = s0 + (t0 + span - s0) / 2 + dt
        cut = {**cut, 'loop': (round(t0, 2), L)}
        raw = decode(path, max(0.0, t0 - pad), t0 + L + xf + pad)
        off = int(round((t0 - max(0.0, t0 - pad)) * SR))
    else:
        t0, t1 = cut['cut']
        raw = decode(path, max(0.0, t0 - pad), t1 + pad)
        off = int(round((t0 - max(0.0, t0 - pad)) * SR))
    y = sosfiltfilt(sos, raw)
    if cut.get('lift'):
        b, a = biquad('peak', 2500, 0.8, cut['lift'])
        y = lfilter(b, a, y)
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
        fin, fout = cut.get('fin', 0.6), cut.get('fout', 1.8)
        nI, nO = int(fin * SR), int(min(fout, (t1 - t0) * 0.6) * SR)
        if nI: y[:nI] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, nI))
        if nO: y[-nO:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nO))
        y = level(y, ONCE_LUFS)
        info = {'peak': round(momentary_peak(y), 2), 'from': [round(t0, 2), round(t1, 2)]}
        note = f'peak at {info["peak"]:.1f} s'
    name = f'{stem}{f"_{k + 1}" if ncuts > 1 else ""}.mp3'
    wav = Path(tmp) / (name + '.wav')
    import scipy.io.wavfile as wf
    wf.write(str(wav), SR, np.clip(y, -1, 1).astype(np.float32))
    dst = OUT / name
    run_ff(['-y', '-i', str(wav), '-map_metadata', '-1', '-ac', '1', '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', BITRATE, str(dst)])
    back = decode(dst)
    take = {'f': name, 'v': md5(dst)[:8], 'd': round(len(back) / SR, 3), 'lufs': round(lufs(back[:int(info['loop'] * SR)] if 'loop' in info else back), 1), **info, 'src': stem}
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
        slot, n = slot_of(p.stem, slots)
        if not slot: print(f'? {p.name}: no slot called that (js/core/city-sounds.js) — skipped'); continue
        if only and slot not in only: continue
        todo.append((p, slot))
    if not todo: print(f'nothing to import in {folder}'); return
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for p, slot in todo:
            stem, kind = p.stem, slots[slot]
            h = md5(p)
            cuts = CUTS.get(stem) or default_cuts(p, kind)
            extra = sorted(set(s for c in cuts for s in c.get('also', [])))
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
                take = process(p, stem, slot, kind, c, k, len(cuts), tmp)
                for sid in [slot, *c.get('also', [])]:
                    files.setdefault(sid, []).append(take)
            sources[stem] = {'file': p.name, 'md5': h, 'slots': sorted(set([slot, *extra])), 'credit': cr, 'note': CREDIT_NOTE.get(stem)}
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
