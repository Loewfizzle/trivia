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


# ---------------------------------------------------------------- PD-5A — THE DAY SET (python scripts/build-prism.py --day)
# Five lo-fi songs for the day look, each its own id (prismd1…5), look 'day', a HAND-SET world (never the mood picker). The originals are
# read, never touched. Encoded like the night songs (stereo 44.1 kHz 112 kbps), loudness-matched to each other in the encode only
# (two-pass loudnorm → ~−14 LUFS integrated, −1 dB true peak). The tempo search is octave-aware (the night search folds into 90–180 BPM:
# an 80 BPM song would come out at 160) and the build STOPS a song whose tempo is off the expected one by more than 0.1 BPM — never a guess.
DOWN = Path.home() / 'Downloads'
DAY = [
    # id         source                                         world      title                       artist         expected BPM
    ('prismd1', DOWN / 'grok' / 'PrismDay' / 'day-sunset.mp3', 'sunset', 'Roof Tops', 'HoliznaCC0', 80.00),
    ('prismd2', DOWN / 'grok' / 'PrismDay' / 'day-city.mp3', 'city', 'Summer Felt Longer Then', 'HoliznaCC0', 80.00),
    ('prismd3', DOWN / 'grok' / 'PrismDay' / 'day-crystal.mp3', 'crystal', 'The Last Long Day', 'HoliznaCC0', 83.0),
    ('prismd4', DOWN / 'grok' / 'PrismDay' / 'day-aurora.mp3', 'aurora', 'Feeling Human Again', 'HoliznaCC0', 79.00),
    ('prismd5', DOWN / 'day' / 'day8.mp3', 'nebula', 'Neon Speakeasy — Day 8', 'Neon Speakeasy', 110.0),
]
DAY_CREDIT = {'HoliznaCC0': 'CC0 1.0 Universal — freemusicarchive.org/music/holiznacc0'}
DAY8_MD5 = 'eb43c3526a3093b9f301f4812ecfc568'   # the city's own import record of day/day8.mp3 (data/mood-music.json city2.sources)
LUFS, TP = -14.0, -1.0
BPM_TOL = 0.1


def md5(path):
    import hashlib
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def loudness(path):
    """integrated LUFS + true peak (dBTP) of a file (ffmpeg's ebur128 with true peak)"""
    r = subprocess.run([bm.FFMPEG, '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    txt = r.stderr[r.stderr.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', txt)
    p = re.search(r'Peak:\s+(-?[\d.]+) dBFS', txt[txt.find('True peak'):])
    return (float(i.group(1)) if i else None), (float(p.group(1)) if p else None)


def encode_day(src, dst, tp_target):
    """two-pass loudnorm (linear) → 112 kbps stereo 44.1 kHz"""
    meas = subprocess.run([bm.FFMPEG, '-hide_banner', '-nostats', '-i', str(src), '-af',
                           f'loudnorm=I={LUFS}:TP={tp_target}:LRA=20:print_format=json', '-f', 'null', '-'],
                          capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rfind('{'):meas.rfind('}') + 1])
    af = (f"loudnorm=I={LUFS}:TP={tp_target}:LRA=20:linear=true:measured_I={j['input_i']}:measured_TP={j['input_tp']}"
          f":measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']},aresample=44100")
    subprocess.run([bm.FFMPEG, '-v', 'error', '-y', '-i', str(src), '-vn', '-map_metadata', '-1', '-af', af,
                    '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '112k', str(dst)], check=True)
    return j


def beat_grid_near(y_p, sr, expected):
    """THE DAY SEARCH: build-beatmaps.py's comb search, octave-aware. The librosa tracker seeds it, folded to the octave nearest the
    expected tempo (its tempo is reported raw too — a seed far from it is a warning). Returns (grid, bpm, drift, steady, t0, seed)."""
    hop = 128
    oenv = librosa.onset.onset_strength(y=y_p, sr=sr, hop_length=hop)
    times = librosa.times_like(oenv, sr=sr, hop_length=hop)
    dur = len(y_p) / sr
    tempo, _ = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, tightness=120)
    seed = float(np.atleast_1d(tempo)[0]) or expected
    b0 = seed
    while b0 < expected / 1.4:
        b0 *= 2
    while b0 > expected * 1.4:
        b0 /= 2
    best = (-1.0, b0, 0.0)
    for bpm in np.arange(b0 * 0.96, b0 * 1.04, 0.05):
        period = 60.0 / bpm
        ph = np.arange(0, period, 0.004)
        sc = bm._comb(oenv, times, dur, period, ph)
        k = int(np.argmax(sc))
        if sc[k] > best[0]:
            best = (float(sc[k]), float(bpm), float(ph[k]))
    _, bpm_c, ph_c = best
    for bpm in np.arange(bpm_c - 0.06, bpm_c + 0.0601, 0.005):
        period = 60.0 / bpm
        ph = np.arange(ph_c - 0.008, ph_c + 0.0081, 0.0005)
        sc = bm._comb(oenv, times, dur, period, ph)
        k = int(np.argmax(sc))
        if sc[k] > best[0]:
            best = (float(sc[k]), float(bpm), float(ph[k]))
    _, bpm, t0 = best
    period = 60.0 / bpm
    drift = []
    for q in range(4):
        a, b = dur * q / 4, dur * (q + 1) / 4
        m = (times >= a) & (times < b)
        offs = np.arange(-0.06, 0.0601, 0.001)
        sc = bm._comb(oenv * m, times, dur, period, t0 + offs)
        drift.append(round(float(offs[int(np.argmax(sc))]) * 1000))
    # THE PHASE: the whole song's comb peak (above); per quarter, the best local phase against it — a lo-fi groove swings (a laid-back
    # snare in one section). DRIFT = the TREND across the song (a tempo error grows steadily), SCATTER = how far a section sits off that
    # trend (the groove) — both reported, both bounded
    # (tried: the grid at the MEDIAN of the quarters — Summer Felt Longer Then's beat/half-beat ratio fell 1.50 → 1.05: the whole song's
    # comb peak is the real phase; the quarters only REPORT the groove)
    med = float(np.median(drift))
    slope = float(np.polyfit(np.arange(4), np.array(drift, dtype=float), 1)[0])
    trend = round(slope * 3, 1)
    scatter = round(max(abs(d - (slope * (q - 1.5) + float(np.mean(drift)))) for q, d in enumerate(drift)), 1)
    steady = abs(trend) <= 25 and scatter <= 45
    grid = (t0 - bm.ONSET_BIAS) + period * np.arange(-int(t0 / period) - 1, int((dur - t0) / period) + 2)
    on = float(bm._comb(oenv, times, dur, period, np.array([t0]))[0])
    half = float(bm._comb(oenv, times, dur, period, np.array([t0 + period / 2]))[0])
    return grid[(grid >= 0) & (grid < dur)], bpm, dict(q=drift, trend=trend, scatter=scatter, median=round(med)), steady, on, half, seed


def cue_in(grid, energy, phase, period):
    """THE CUE-IN: a soft intro → start at the first STRONG beat (a bar line where the song's energy has arrived and stays: the next
    8 beats mostly above 60 % of the song's median beat energy). 0 when the song is strong from its first bar (or the intro is < 2 s)."""
    e = np.array(energy)
    thr = 0.6 * float(np.median(e))
    for i in range(len(grid)):
        if ((i - phase) % 4) != 0:
            continue
        w = e[i:i + 8]
        if len(w) == 8 and (w >= thr).mean() >= 0.85:
            return (round(max(0.0, float(grid[i]) - 0.03), 3), i) if grid[i] >= 2.0 else (0.0, i)
    return 0.0, 0


BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
SR1 = [44100, 48000, 32000]


def first_frame(path):
    """the byte offset of the first AUDIO frame (after the ID3v2 tag + the Xing/Info frame) — the phone places a cue-in's RANGE stream from it
    (audio/synced-songs.js — game.ff, one request, no header fetch). MPEG-1 Layer III CBR (what encode_day writes)."""
    b = Path(path).read_bytes()
    i = 0
    if b[:3] == b'ID3':
        i = 10 + ((b[6] & 0x7f) << 21 | (b[7] & 0x7f) << 14 | (b[8] & 0x7f) << 7 | (b[9] & 0x7f)) + (10 if b[5] & 0x10 else 0)
    while not (b[i] == 0xff and (b[i + 1] & 0xe0) == 0xe0):
        i += 1
    def flen(j):
        br = BR1[b[j + 2] >> 4] * 1000
        sr = SR1[(b[j + 2] >> 2) & 3]
        return 144 * br // sr + ((b[j + 2] >> 1) & 1)
    mode = (b[i + 3] >> 6) & 3
    side = 17 if mode == 3 else 32
    tag = b[i + 4 + side:i + 8 + side]
    return i + flen(i) if tag in (b'Xing', b'Info') else i


def build_day(only):
    out = {}
    for sid, src, world, title, artist, expected in DAY:
        if only and sid not in only:
            continue
        if not src.exists():
            print(f'{sid}: STOP — source missing: {src}')
            continue
        if sid == 'prismd5' and md5(src) != DAY8_MD5:
            print(f'{sid}: STOP — {src} is not the file the city imported as c2-day8 (md5 differs)')
            continue
        dst = AUDIO_OUT / f'{sid}.mp3'
        tmp = AUDIO_OUT / f'{sid}.tmp.mp3'
        src_i, src_tp = loudness(src)
        # (the encode's own true peak can rise a little over the target: encode, measure, and pull the target down until it holds)
        tpt = TP - 0.5
        for _ in range(4):
            encode_day(src, tmp, tpt)
            li, ltp = loudness(tmp)
            if ltp is not None and ltp <= TP + 0.05:
                break
            tpt -= max(0.3, ltp - TP)
        r = analyze_day(tmp, expected)
        ok = abs(r['bpm'] - expected) <= BPM_TOL and r['steady'] and r['onHalf'] >= 1.15
        line = (f"{sid} {title}: {r['bpm']:.3f} BPM (expected {expected:.2f}, Δ {r['bpm'] - expected:+.3f}; tracker seed {r['seed']:.2f}) · "
                f"phase by quarter {r['drift']} · beat/half-beat onset ratio {r['onHalf']:.2f} · {KEYS[r['tonic']]} {r['mode']} · "
                f"{r['duration']:.2f} s · cue-in {r['cue']} s · last beat {r['lastBeat']} s · "
                f"loudness {src_i} → {li} LUFS, TP {src_tp} → {ltp} dBTP · {tmp.stat().st_size / 1e6:.2f} MB")
        if not ok:
            print('STOP  ' + line)
            tmp.unlink()
            continue
        tmp.replace(dst)
        print('OK    ' + line)
        period = 60.0 / r['bpm']
        doc = dict(id=sid, title=title, artist=artist, look='day', src=f'{src.stat().st_size}:{int(src.stat().st_mtime)}',
                   duration=r['duration'], bpm=round(r['bpm'], 3), steady=True, period=round(period, 6), phase=r['phase'],
                   beats=[round(float(t), 3) for t in r['grid']], energy=[round(float(e), 2) for e in r['energy']],
                   tonic=r['tonic'], key=KEYS[r['tonic']], mode=r['mode'], keyConf=r['keyConf'], lastBeat=r['lastBeat'],
                   cue=r['cue'], ff=first_frame(dst), lufs=li, tp=ltp, credit=DAY_CREDIT.get(artist), mood=r['mood'], world=world,
                   check=dict(expected=expected, seed=round(r['seed'], 2), drift=r['drift'], onHalf=round(r['onHalf'], 3)))
        (DATA_OUT / f'{sid}.json').write_text(json.dumps(doc, separators=(',', ':')))
        out[sid] = doc
    return out


def analyze_day(path, expected):
    y = bm.decode(path, SR)
    dur = len(y) / SR
    y_h, y_p = librosa.effects.hpss(y)
    grid, bpm, drift, steady, on, half, seed = beat_grid_near(y_p, SR, expected)
    env, times = bm.band_envelopes(y_p, SR)
    lows = np.array([bm.window_max(env['low'], times, t) for t in grid])
    phase = int(np.argmax([lows[p::4].sum() for p in range(4)]))
    e_short, _ = bm.per_beat_energy(y, SR, grid)
    tonic, mode, conf, margin = detect_key(y_h, SR)
    cue, _ = cue_in(grid, e_short, phase, 60.0 / bpm)
    return dict(duration=round(dur, 3), bpm=bpm, grid=grid, phase=phase, energy=e_short, steady=steady, drift=drift, seed=seed,
                onHalf=on / max(1e-9, half), tonic=tonic, mode=mode, keyConf=conf, mood=mood(y, SR, bpm, e_short, mode),
                lastBeat=round(final_beat(grid, e_short, dur), 3), cue=cue)


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
    ap.add_argument('--day', action='store_true', help='PD-5A: build THE DAY SET (prismd1..5) from its fixed sources')
    ap.add_argument('--night-gain', action='store_true', help='PFIX-A: measure the night songs + store their playback gain (no encode)')
    a = ap.parse_args()
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    if a.night_gain:
        night_gain()
        write_manifest()
        return
    if a.day:
        build_day({x.strip() for x in a.only.split(',') if x.strip()})
        write_manifest()
        return
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
    # (PD-5A: the night songs only - a day song's world is hand-set, never picked)
    docs = {p.stem: json.loads(p.read_text()) for p in sorted(DATA_OUT.glob('prism[0-9]*.json'))}
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
    for sid, d in docs.items():
        (DATA_OUT / f'{sid}.json').write_text(json.dumps(d, separators=(',', ':')))
    night_gain()   # (PFIX-A: a new or re-encoded night song is measured too - its playback gain)
    write_manifest()


def night_gain():
    """PFIX-A — THE NIGHT GAIN: the night songs were mastered hot (-7.6 … -15 LUFS) beside the day set's -14.4. Each night song's
    integrated loudness is measured from its file (never re-encoded, never touched) and a PLAYBACK gain (dB) that brings it to the day set's
    level is stored in its JSON + the manifest (`gain`): js/games/prism/audio.js applies it per voice. A cut only — never a boost."""
    day = [json.loads(p.read_text()).get('lufs') for p in DATA_OUT.glob('prismd[0-9]*.json')]
    day = [x for x in day if isinstance(x, (int, float))]
    target = round(sum(day) / len(day), 1) if day else -14.4
    for p in sorted(DATA_OUT.glob('prism[0-9]*.json'), key=lambda p: int(re.sub(r'[^0-9]', '', p.stem))):
        d = json.loads(p.read_text())
        li, tp = loudness(AUDIO_OUT / f"{d['id']}.mp3")
        if li is None:
            print(f"  {d['id']}: no loudness measured - left as is")
            continue
        d['lufs'], d['tp'], d['gain'] = li, tp, round(min(0.0, target - li), 1)
        p.write_text(json.dumps(d, separators=(',', ':')))
        print(f"  {d['id']}: {li} LUFS (peak {tp} dBTP) -> playback gain {d['gain']} dB (the day set: {target} LUFS)")


def write_manifest():
    """every song: the night set (prismN, no `look` - the original five) then THE DAY SET (prismdN, look 'day' + its cue-in)"""
    def num(sid):
        return int(re.sub(r'[^0-9]', '', sid))
    night = sorted((p for p in DATA_OUT.glob('prism[0-9]*.json')), key=lambda p: num(p.stem))
    day = sorted((p for p in DATA_OUT.glob('prismd[0-9]*.json')), key=lambda p: num(p.stem))
    songs = []
    for p in night + day:
        d = json.loads(p.read_text())
        row = dict(id=d['id'], title=d['title'], artist=d['artist'], bpm=d['bpm'], key=d['key'], mode=d['mode'],
                   duration=d['duration'], lastBeat=d['lastBeat'], world=d['world'])
        if d.get('look') == 'day':
            row.update(look='day', cue=d.get('cue', 0), ff=d.get('ff') or first_frame(AUDIO_OUT / f"{d['id']}.mp3"))
        elif d.get('gain'):
            row.update(gain=d['gain'])   # (PFIX-A: THE NIGHT GAIN - dB at playback)
        songs.append(row)
    (DATA_OUT / 'manifest.json').write_bytes(json.dumps(dict(songs=songs), indent=1).encode('utf-8'))   # (LF on Windows too)
    print(f'manifest: {len(songs)} songs ({len(night)} night, {len(day)} day)')


if __name__ == '__main__':
    main()
