#!/usr/bin/env python3
"""PULSE song pipeline: source audio -> trimmed mono MP3 + beat map JSON + manifest.

    python scripts/build-beatmaps.py              # new / changed songs from ~/Downloads
    python scripts/build-beatmaps.py --force      # rebuild every song
    python scripts/build-beatmaps.py --src DIR --only 3,6

Finds pulse1.mp3, pulse-2.mp3, Pulse_3.m4a ... (pulse + number, any of mp3/m4a/wav/ogg/flac) and writes
  audio/pulse/pulseN.mp3     mono 44.1 kHz ~96 kbps, trimmed / faded (what phones download)
  data/pulse/pulseN.json     beat grid, per-beat energy curve, notes for easy / normal / hard
  data/pulse/manifest.json   every song: title, artist, BPM, length, note counts
The map is computed from the *encoded* file decoded back (as a browser decodes it), so note times line up with
exactly what plays. Requires: pip install librosa imageio-ffmpeg mutagen soundfile (see CLAUDE.md -> PULSE).
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import librosa
import imageio_ffmpeg
import mutagen

ROOT = Path(__file__).resolve().parent.parent
AUDIO_OUT = ROOT / 'audio' / 'pulse'
DATA_OUT = ROOT / 'data' / 'pulse'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
NAME_RE = re.compile(r'^pulse[\s_-]*(\d+)\.(mp3|m4a|aac|wav|ogg|flac)$', re.I)

SR = 22050          # analysis rate
HOP = 256           # 11.6 ms frames
MAX_LEN = 195.0     # longer songs are trimmed ...
TARGET_LEN = 170.0  # ... to their best ~2:50
LONG_INTRO = 12.0   # intros longer than this before the beat starts are skipped
LEAD_IN = 2.0       # no notes in the first seconds (countdown lands here)
FADE_OUT = 5.0


# ---------------------------------------------------------------- audio io
def decode(path, sr, start=None, length=None):
    cmd = [FFMPEG, '-v', 'error']
    if start is not None:
        cmd += ['-ss', f'{start:.3f}']
    cmd += ['-i', str(path)]
    if length is not None:
        cmd += ['-t', f'{length:.3f}']
    cmd += ['-ac', '1', '-ar', str(sr), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode(src, dst, start, length, fade_in, fade_out):
    filters = []
    if fade_in > 0:
        filters.append(f'afade=t=in:st=0:d={fade_in:.2f}')
    if fade_out > 0:
        filters.append(f'afade=t=out:st={max(0.0, length - fade_out):.2f}:d={fade_out:.2f}')
    cmd = [FFMPEG, '-v', 'error', '-y', '-ss', f'{start:.3f}', '-i', str(src), '-t', f'{length:.3f}',
           '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k']
    if filters:
        cmd += ['-af', ','.join(filters)]
    subprocess.run(cmd + [str(dst)], check=True)


def tags(path, n):
    title = artist = None
    try:
        m = mutagen.File(path, easy=True)
        if m and m.tags:
            title = (m.tags.get('title') or [None])[0]
            artist = (m.tags.get('artist') or [None])[0]
    except Exception:
        pass
    return (title or f'Track {n:02d}').strip(), (artist or '').strip()


# ---------------------------------------------------------------- trimming
def smooth(x, n):
    if n <= 1:
        return x
    k = np.ones(n) / n
    return np.convolve(x, k, mode='same')


def plan_trim(y, sr):
    """Returns (start, length, fade_in, fade_out) in source seconds."""
    dur = len(y) / sr
    _, y_p = librosa.effects.hpss(y)
    frame = int(sr * 0.5)
    rms_p = np.array([np.sqrt(np.mean(y_p[i:i + frame] ** 2) + 1e-12) for i in range(0, len(y_p), frame)])
    rms_all = np.array([np.sqrt(np.mean(y[i:i + frame] ** 2) + 1e-12) for i in range(0, len(y), frame)])
    ref = np.percentile(rms_p, 90)
    sustained = smooth((rms_p > 0.35 * ref).astype(float), 4) > 0.74
    beat_start = (np.argmax(sustained) * 0.5) if sustained.any() else 0.0
    start = 0.0
    if beat_start > LONG_INTRO:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=512)
        bar = 4 * 60.0 / float(np.atleast_1d(tempo)[0] or 120)
        start = max(0.0, beat_start - bar)  # one bar of lead-in before the beat kicks in
    fade_in = 0.0 if start == 0 else 1.0
    if dur - start <= MAX_LEN:
        return start, dur - start, fade_in, 0.0
    # long song: the most energetic TARGET_LEN window, starting on a half-second grid
    win = int(TARGET_LEN / 0.5)
    first = int(start / 0.5)
    energy = np.convolve(rms_all, np.ones(win), mode='valid')
    cands = np.arange(first, len(energy))
    # mild preference for earlier windows (keep the song's own build-up when it's close)
    score = energy[cands] * (1 - 0.0015 * (cands - first) * 0.5)
    best = int(cands[np.argmax(score)])
    start2 = best * 0.5
    return start2, TARGET_LEN, (1.5 if start2 > start + 0.01 else fade_in), FADE_OUT


# ---------------------------------------------------------------- analysis
# Onset-strength peaks (hop 128) trail the audible attack by a steady ~11 ms (measured against a synthetic
# track with drums at known times — see the PULSE section of CLAUDE.md); the grid is shifted back by it.
ONSET_BIAS = 0.011


def _comb(oenv, times, dur, period, phases):
    n = np.arange(int(dur / period) + 1)
    g = phases[:, None] + period * n[None, :]
    return (np.interp(g, times, oenv) * (g < dur)).sum(axis=1)


def beat_grid(y_p, sr):
    """A steady tempo grid found by searching tempo (to 0.005 BPM) and phase so the grid lands on the
    most onset energy over the whole song. librosa's tracker only seeds the search: its tempo can be a
    little off (drifting hundreds of ms by the end) or land on half/double time.
    Returns (grid, bpm, drift_ms per quarter of the song, steady)."""
    hop = 128
    oenv = librosa.onset.onset_strength(y=y_p, sr=sr, hop_length=hop)
    times = librosa.times_like(oenv, sr=sr, hop_length=hop)
    dur = len(y_p) / sr
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, tightness=120)
    bpm0 = float(np.atleast_1d(tempo)[0]) or 120.0
    while bpm0 < 90:
        bpm0 *= 2
    while bpm0 >= 180:
        bpm0 /= 2
    best = (-1.0, bpm0, 0.0)
    for bpm in np.arange(bpm0 * 0.96, bpm0 * 1.04, 0.05):
        period = 60.0 / bpm
        ph = np.arange(0, period, 0.004)
        sc = _comb(oenv, times, dur, period, ph)
        k = int(np.argmax(sc))
        if sc[k] > best[0]:
            best = (float(sc[k]), float(bpm), float(ph[k]))
    _, bpm_c, ph_c = best
    for bpm in np.arange(bpm_c - 0.06, bpm_c + 0.0601, 0.005):
        period = 60.0 / bpm
        ph = np.arange(ph_c - 0.008, ph_c + 0.0081, 0.0005)
        sc = _comb(oenv, times, dur, period, ph)
        k = int(np.argmax(sc))
        if sc[k] > best[0]:
            best = (float(sc[k]), float(bpm), float(ph[k]))
    _, bpm, t0 = best
    period = 60.0 / bpm
    # does one steady grid fit the whole song? best local phase per quarter vs the global one
    drift = []
    for q in range(4):
        a, b = dur * q / 4, dur * (q + 1) / 4
        m = (times >= a) & (times < b)
        offs = np.arange(-0.06, 0.0601, 0.001)
        sc = _comb(oenv * m, times, dur, period, t0 + offs)
        drift.append(round(float(offs[int(np.argmax(sc))]) * 1000))
    steady = max(abs(d) for d in drift) <= 20
    if steady:
        grid = (t0 - ONSET_BIAS) + period * np.arange(-int(t0 / period) - 1, int((dur - t0) / period) + 2)
    else:
        # tempo genuinely changes: follow the tracker's beats (smoothed), same bias correction
        bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop) - ONSET_BIAS
        sm = np.convolve(np.diff(bt), np.ones(5) / 5, mode='same')
        grid = np.concatenate([[bt[0]], bt[0] + np.cumsum(sm)])
        pre = grid[0] - period * np.arange(int(grid[0] / period) + 1, 0, -1)
        post = grid[-1] + period * np.arange(1, int((dur - grid[-1]) / period) + 2)
        grid = np.concatenate([pre, grid, post])
    return grid[(grid >= 0) & (grid < dur)], bpm, drift, steady


def rise_curve(y44, sr44):
    """Positive slope of a 3 ms amplitude envelope, at 1 ms steps: peaks while a hit's attack
    rises, i.e. when it is heard. (Onset-strength curves at coarse hops peak a little late.)"""
    step = sr44 // 1000
    w = int(0.003 * sr44)
    env = np.sqrt(np.convolve(y44 ** 2, np.ones(w) / w, mode='same'))[::step]
    rise = np.maximum(0, np.diff(env, prepend=env[0]))
    return rise / (np.percentile(rise, 99.5) + 1e-9)


def band_envelopes(y_p, sr):
    S = np.abs(librosa.stft(y_p, n_fft=1024, hop_length=HOP))
    f = librosa.fft_frequencies(sr=sr, n_fft=1024)
    out = {}
    for name, lo, hi in (('low', 20, 160), ('mid', 160, 3000), ('high', 5000, sr / 2)):
        band = np.log1p(S[(f >= lo) & (f < hi)].sum(axis=0))
        flux = np.maximum(0, np.diff(band, prepend=band[0]))
        out[name] = flux / (np.percentile(flux, 98) + 1e-9)
    return out, librosa.times_like(out['low'], sr=sr, hop_length=HOP)


def window_max(env, times, t, w=0.035):
    i0, i1 = np.searchsorted(times, [t - w, t + w])
    return float(env[i0:max(i1, i0 + 1)].max()) if i1 > i0 else 0.0


def per_beat_energy(y, sr, grid):
    rms = []
    for i in range(len(grid)):
        a = int(grid[i] * sr)
        b = int((grid[i + 1] if i + 1 < len(grid) else grid[i] + (grid[1] - grid[0])) * sr)
        seg = y[a:max(b, a + 1)]
        rms.append(np.sqrt(np.mean(seg ** 2) + 1e-12))
    db = 20 * np.log10(np.array(rms))
    lo, hi = np.percentile(db, 5), np.percentile(db, 97)
    e = np.clip((db - lo) / (hi - lo + 1e-9), 0, 1)
    return smooth(e, 4), smooth(e, 16)  # short (visual pulse), section (note density)


DIFF = {
    #           density/beat = base + gain·E   min gap (beats)  same-lane gap  offbeats   chords
    'easy':   dict(base=0.30, gain=0.45, gap=1.0, lane_gap=1.0, off=False, chords=False, thr=0.10),
    'normal': dict(base=0.55, gain=0.80, gap=0.5, lane_gap=0.5, off=True, chords=False, thr=0.16),
    'hard':   dict(base=0.85, gain=1.10, gap=0.5, lane_gap=0.5, off=True, chords=True, thr=0.12),
}


def make_notes(slots, beats_per_bar_slots, cfg, period):
    """slots: list of dicts {t, beat(bool), down(bool), L, M, H, E, bar}"""
    notes = []
    bars = {}
    for s in slots:
        bars.setdefault(s['bar'], []).append(s)
    for bar_id in sorted(bars):
        bar = bars[bar_id]
        E = float(np.mean([s['E'] for s in bar]))
        if E < 0.08:
            continue  # silence / near-silence: no notes
        n_target = int(round(4 * (cfg['base'] + cfg['gain'] * E)))
        cands = [s for s in bar if s['beat'] or cfg['off']]
        for s in cands:
            s['score'] = max(s['L'], s['M'], 0.85 * s['H']) + (0.22 if s['beat'] else 0) + (0.12 if s['down'] else 0)
            if not s['beat']:
                s['score'] -= 0.15  # offbeats must earn their place
        picked = []
        for s in sorted(cands, key=lambda s: -s['score']):
            if len(picked) >= n_target:
                break
            if s['score'] - (0.22 if s['beat'] else 0) < cfg['thr'] and not s['beat']:
                continue
            if any(abs(s['t'] - p['t']) < cfg['gap'] * period - 1e-3 for p in picked):
                continue
            picked.append(s)
        # quiet-drum passages that still carry the groove: keep a light on-beat pulse
        if len(picked) < n_target * 0.5 and E > 0.25:
            for s in [s for s in bar if s['beat'] and s not in picked]:
                if len(picked) >= max(1, n_target // 2):
                    break
                if all(abs(s['t'] - p['t']) >= cfg['gap'] * period - 1e-3 for p in picked):
                    picked.append(s)
        notes.extend(sorted(picked, key=lambda s: s['t']))
    return notes


def assign_lanes(notes, cfg, period):
    out = []
    history = []  # lanes of recent notes
    last_t = {0: -9, 1: -9, 2: -9}
    chords_in_bar = {}
    for s in notes:
        prefs = sorted(((s['L'], 0), (s['M'] + 0.04, 1), (s['H'] * 0.95, 2)), reverse=True)
        # balance: a lane that dominated the last 12 notes loses a little preference, so a mix-heavy
        # song still spreads across the road (a clearly dominant sound keeps its lane)
        recent = history[-12:]
        share = [recent.count(l) / len(recent) if recent else 1 / 3 for l in range(3)]
        order = [lane for _, lane in sorted(((v - 0.8 * (share[l] - 1 / 3), l) for v, l in prefs), reverse=True)]
        lane = order[0]
        # gentle variety: avoid 4 in a row on one lane, and too-fast repeats on the same lane
        def ok(l):
            if s['t'] - last_t[l] < cfg['lane_gap'] * period - 1e-3:
                return False
            if len(history) >= 3 and all(h == l for h in history[-3:]):
                return False
            return True
        for cand in order:
            if ok(cand):
                lane = cand
                break
        lanes = [lane]
        if cfg['chords'] and s['beat'] and s['E'] > 0.62 and chords_in_bar.get(s['bar'], 0) < 1:
            strong = [l for v, l in prefs if v > 0.55]
            if len(strong) >= 2:
                other = 2 if lane == 0 else 0 if lane == 2 else (0 if s['L'] >= s['H'] else 2)
                if s['t'] - last_t[other] >= cfg['lane_gap'] * period - 1e-3:
                    lanes.append(other)
                    chords_in_bar[s['bar']] = chords_in_bar.get(s['bar'], 0) + 1
        for l in lanes:
            out.append([round(s['t'], 3), l])
            last_t[l] = s['t']
        history.append(lane)
    return out


def analyze(path):
    y = decode(path, SR)
    dur = len(y) / SR
    _, y_p = librosa.effects.hpss(y)
    grid, bpm, drift, steady = beat_grid(y_p, SR)
    rise = rise_curve(decode(path, 44100), 44100)
    period = float(np.median(np.diff(grid)))
    env, times = band_envelopes(y_p, SR)
    # downbeat: the beat phase (of 4) with the most kick energy
    lows = np.array([window_max(env['low'], times, t) for t in grid])
    phase = int(np.argmax([lows[p::4].sum() for p in range(4)]))
    e_short, e_section = per_beat_energy(y, SR, grid)
    slots = []
    for i, t in enumerate(grid):
        for half in (0, 1):
            st = t + half * period / 2
            if st < LEAD_IN or st > dur - 1.5:
                continue
            slots.append(dict(t=float(st), beat=half == 0, down=half == 0 and (i - phase) % 4 == 0,
                              L=window_max(env['low'], times, st), M=window_max(env['mid'], times, st),
                              H=window_max(env['high'], times, st), E=float(e_section[i]), bar=(i - phase) // 4))
    diffs = {}
    for name, cfg in DIFF.items():
        picked = make_notes([dict(s) for s in slots], 8, cfg, period)
        diffs[name] = assign_lanes(picked, cfg, period)
    return dict(duration=round(dur, 3), bpm=round(bpm, 1), grid=grid, phase=phase, energy=e_short, diffs=diffs, drift=drift, steady=steady,
                rise=rise)


def attack_offsets(rise, times, min_peak=0.25):
    """Signed (attack - t) for notes with a clear attack (strong rise) within ±60 ms."""
    out = []
    for t in times:
        c = int(round(t * 1000))
        a, b = c - 60, c + 61
        if a < 0 or b > len(rise):
            continue
        seg = rise[a:b]
        k = int(np.argmax(seg))
        if seg[k] >= min_peak:
            out.append((k - 60) / 1000.0)
    return np.array(out)


def check(result):
    """How well notes sit on the beat grid and on the audible attacks (printed for the build log)."""
    grid = result['grid']
    eighths = np.sort(np.concatenate([grid, grid + np.median(np.diff(grid)) / 2]))
    rep = {}
    for name, notes in result['diffs'].items():
        ts = np.array(sorted({n[0] for n in notes}))
        g = np.min(np.abs(ts[:, None] - eighths[None, :]), axis=1) * 1000
        o = attack_offsets(result['rise'], ts) * 1000
        rep[name] = dict(notes=len(notes), grid_ms=round(float(np.max(g)), 1),
                         attack_med_ms=round(float(np.median(o)), 1) if len(o) else None,
                         attack_pct=round(100 * len(o) / max(1, len(ts))),
                         within_pct=round(float(np.mean(np.abs(o) <= 45)) * 100) if len(o) else 0)
    return rep


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default=str(Path.home() / 'Downloads'))
    ap.add_argument('--only', default='', help='comma-separated song numbers')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()
    AUDIO_OUT.mkdir(parents=True, exist_ok=True)
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = DATA_OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text('utf-8')) if manifest_path.exists() else {'v': 1, 'songs': []}
    songs = {s['id']: s for s in manifest['songs']}
    only = {int(x) for x in args.only.split(',') if x.strip()}
    found = sorted(((int(m.group(1)), p) for p in Path(args.src).iterdir() if (m := NAME_RE.match(p.name))), key=lambda x: x[0])
    if not found:
        sys.exit(f'no pulseN audio files in {args.src}')
    for n, src in found:
        if only and n not in only:
            continue
        sid = f'pulse{n}'
        stat = src.stat()
        source = {'name': src.name, 'size': stat.st_size}
        if not args.force and sid in songs and songs[sid].get('source') == source and (DATA_OUT / f'{sid}.json').exists():
            print(f'{sid}: unchanged, skipped')
            continue
        print(f'{sid}: {src.name}')
        full = decode(src, SR)
        start, length, fade_in, fade_out = plan_trim(full, SR)
        out_audio = AUDIO_OUT / f'{sid}.mp3'
        encode(src, out_audio, start, length, fade_in, fade_out)
        res = analyze(out_audio)
        title, artist = tags(src, n)
        beatmap = {
            'v': 1, 'id': sid, 'title': title, 'artist': artist, 'bpm': res['bpm'], 'duration': res['duration'],
            'downbeat': res['phase'],
            'beats': [round(float(t), 3) for t in res['grid']],
            'energy': [round(float(e), 2) for e in res['energy']],
            'notes': res['diffs'],
        }
        (DATA_OUT / f'{sid}.json').write_text(json.dumps(beatmap, separators=(',', ':')), 'utf-8')
        rep = check(res)
        songs[sid] = {
            'id': sid, 'n': n, 'title': title, 'artist': artist, 'bpm': res['bpm'], 'duration': res['duration'],
            'audio': f'audio/pulse/{sid}.mp3', 'map': f'data/pulse/{sid}.json',
            'counts': {k: v['notes'] for k, v in rep.items()},
            'trim': {'start': round(start, 2), 'length': round(length, 2), 'sourceLength': round(len(full) / SR, 2)},
            'source': source,
        }
        kb = out_audio.stat().st_size // 1024
        print(f'  {"steady" if res["steady"] else "VARIABLE"} tempo grid; per-quarter phase drift {res["drift"]} ms')
        print(f'  {res["bpm"]} BPM, {res["duration"]:.1f}s (from {len(full) / SR:.1f}s, start {start:.1f}s), {kb} KB')
        for k, v in rep.items():
            print(f'  {k:6} {v["notes"]:4} notes, off-grid max {v["grid_ms"]} ms; {v["attack_pct"]}% sit on a clear hit, median offset {v["attack_med_ms"]} ms, {v["within_pct"]}% of those within PERFECT (45 ms)')
    manifest['songs'] = sorted(songs.values(), key=lambda s: s['n'])
    manifest_path.write_text(json.dumps(manifest, indent=1), 'utf-8')
    print(f'manifest: {len(manifest["songs"])} songs')


if __name__ == '__main__':
    main()
