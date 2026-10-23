#!/usr/bin/env python3
"""CITY 2.0 MUSIC: import the owner's mood folders (docs/audio.md#city-20-music) — the one command for adding songs.

    ~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city2-music.py              # import whatever is new
    ... --dry-run                                  # list what it would do, change nothing
    ... --reuse day/x.mp3=c2-morning4              # this file IS an existing City 2.0 song: list that, don't store a copy
    ... --regrid [--only a,b]                      # recompute beat grids (and trust) for City 2.0 songs already imported

Drop new songs into ~/Downloads/{morning,day,evening,late,party}/ (any name, mp3 / m4a / wav / ogg / flac) and run it:
  * identical files (same bytes) in several folders are stored ONCE and listed in each of those moods
  * a file already imported (by its bytes) is skipped, so running it again only does the new ones
  * each new song: leading / trailing silence trimmed (≤ -60 dBFS only — never re-cut musically), levelled to -16 LUFS integrated
    with a -1 dBTP ceiling (a limiter only on songs that had to come UP), stereo 44.1 kHz 112 kbps MP3 (the repo's music format)
    → audio/music/c2-<name>.mp3; the originals in Downloads are never touched
  * its BEAT GRID (build-mood-music.py#grid: tempo, first beat, downbeat) + a LOCK number (how much more onset energy lands on the
    grid's beats than between them) → grid.trusted. A song that isn't trusted keeps its grid out of the city's beat clock
    (js/audio/beat.js): the kick listener leads on it.
  * data/mood-music.json: songs[id] + city2.moods[mood] (the City 2.0 decks) + city2.sources[md5] (what was imported from where)
A song that should ALSO play in another mood: add its id to that mood's list in city2.moods by hand (the owner's morning10 is in
MORNING and LATE NIGHT) — the importer only ever adds, it never removes.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
MUSIC = ROOT / 'audio' / 'music'
OUT = ROOT / 'data' / 'mood-music.json'
DL = Path.home() / 'Downloads'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
MOODS = ['morning', 'day', 'evening', 'late', 'party']      # the folder names ARE the mood ids (late = LATE NIGHT)
AUDIO = ('.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac')
PREFIX = 'c2-'
TARGET_LUFS = -16.0
CEILING_DB = -2.2            # the limiter's ceiling (the MP3 encode adds ~1 dB of overshoot: the file's true peak lands ≈ -1.2 dBTP)
BITRATE = '112k'
AGREE_MIN = 0.5              # the share of the kick listener's kicks that land on the grid's beats (chance ~0.3; City 1.0's good songs 0.6-0.9)
LOCK_STRONG = 3.0            # ... or the song's onset energy sits on the grid's beats this much more than between them (a syncopated
                             # bass gives the kick listener off-beat kicks without the grid being wrong)


def natural(p):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', p.name)]


def md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def run_ff(args):
    return subprocess.run([FFMPEG, '-nostats', *args], capture_output=True, text=True, encoding='utf-8', errors='replace')


def measure(path):
    """integrated loudness (LUFS) + true peak (dBTP) + duration (s)"""
    t = run_ff(['-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    tail = t[t.rfind('Summary:'):]
    I = re.search(r'I:\s+(-?[\d.]+) LUFS', tail)
    TP = re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail)
    d = re.search(r'Duration: (\d+):(\d+):([\d.]+)', t)
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)) if d else 0.0
    return float(I.group(1)), float(TP.group(1)), dur


TRIM = ('silenceremove=start_periods=1:start_threshold=-60dB:detection=peak,areverse,'
        'silenceremove=start_periods=1:start_threshold=-60dB:detection=peak,areverse')


def encode(src, dst, gain_db, limit):
    chain = f'{TRIM},volume={gain_db:.3f}dB'
    if limit:
        chain += f',alimiter=limit={10 ** (CEILING_DB / 20):.4f}:attack=5:release=80:level=0'
    for attempt in range(3):
        r = run_ff(['-y', '-loglevel', 'error', '-i', str(src), '-vn', '-map_metadata', '-1', '-af', chain,
                    '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', BITRATE, str(dst)])
        if not r.returncode:
            return
        time.sleep(2 + attempt * 3)      # (Windows now and then refuses to open the output file: the indexer / antivirus)
    raise RuntimeError(f'ffmpeg failed on {src}: {r.stderr[-400:]}')


def level_and_encode(src, dst):
    """encode src to dst at TARGET_LUFS with a true peak <= -1 dBTP; up to two correction passes (a limiter eats a little loudness,
    the MP3 encode adds a little peak). The peak wins over the loudness when both can't be met."""
    I, TP, _ = measure(src)
    gain = TARGET_LUFS - I
    for attempt in range(3):
        encode(src, dst, gain, limit=(TP + gain > CEILING_DB - 0.3))
        oi, otp, odur = measure(dst)
        used = gain
        if (abs(oi - TARGET_LUFS) <= 0.3 and otp <= -1.0) or attempt == 2:
            break
        gain += (TARGET_LUFS - oi) if otp <= -1.0 else min(0.0, TARGET_LUFS - oi, -1.0 - otp - 0.1)
    return {'srcLoud': round(I, 1), 'loud': round(oi, 1), 'tp': round(otp, 1), 'dur': round(odur, 2), 'gain': round(used, 1)}


# ------------------------------------------------------------------ the beat grid (build-mood-music.py's, + a lock number)
def _bmm():
    spec = importlib.util.spec_from_file_location('bmm', ROOT / 'scripts' / 'build-mood-music.py')
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def kick_agree(y, sr, g):
    """The city's kick listener (js/audio/beat.js#beatKick: the music bus -> a 150 Hz low-pass -> an AnalyserNode, one RMS a frame at
    60 fps -> core/harbor-beat.js#onsetStep), run offline over the song. -> (the share of the kicks it hears that land within
    +-0.15 beat of the grid's beats, how many kicks). Chance is ~30 %; the earlier checks on real songs read 63-78 %."""
    from scipy.signal import butter, sosfilt
    low = sosfilt(butter(2, 150 / (sr / 2), output='sos'), y)
    win, hop = int(0.0232 * sr), int(sr / 60)
    st = {'prev': 0.0, 'h': [], 'peak': 1e-4, 'last': -9.0, 't': None}
    T = g['bpm'] / 60.0
    on = off = 0
    for i in range(win, len(low), hop):
        t = i / sr
        e = float(np.sqrt(np.mean(low[i - win: i] ** 2)))
        dt = 0.0 if st['t'] is None else max(0.0, min(0.25, t - st['t'])); st['t'] = t
        flux = max(0.0, e - st['prev']); st['prev'] = e
        st['peak'] = max(e, st['peak'] * np.exp(-dt / 45), 1e-4)
        st['h'].append(flux); st['h'] = st['h'][-45:]
        m = float(np.mean(st['h'])); sd = float(np.std(st['h']))
        if flux > m + 1.5 * sd + 0.04 * st['peak'] and e > 0.3 * st['peak'] and t - st['last'] > 0.18:
            st['last'] = t
            b = (t - g['t0']) * T
            if abs(b - round(b)) < 0.15: on += 1
            else: off += 1
    return (round(on / (on + off), 2) if on + off else 0.0), on + off


def is_trusted(g, n=100):
    """a grid steers the city's beat clock only if it holds for the whole song (steady) AND is confirmed: the kicks land on it, or the
    onsets do clearly. Anything else keeps the grid out of the clock — the kick listener leads (js/audio/beat.js)."""
    return bool(g['steady'] and 90 <= g['bpm'] < 181 and n >= 16 and (g.get('agree', 0) >= AGREE_MIN or g['lock'] >= LOCK_STRONG))


def grid_job(path):
    """→ the grid dict (bpm, t0, down, steady, drift) + lock (onset energy ON the beats ÷ BETWEEN them) + trusted"""
    import librosa
    m = _bmm()
    g = m.grid(Path(path))
    bm = m._beatmaps()
    y = bm.decode(Path(path), bm.SR)
    hop = 128
    oenv = librosa.onset.onset_strength(y=y, sr=bm.SR, hop_length=hop)
    fps = bm.SR / hop
    period = 60.0 / g['bpm']
    n = int((len(y) / bm.SR - g['t0']) / period)
    w = max(1, int(round(0.03 * fps)))
    def peak_at(t):
        i = int(round(t * fps))
        return float(oenv[max(0, i - w): i + w + 1].max()) if 0 <= i < len(oenv) else None
    on = [v for v in (peak_at(g['t0'] + k * period) for k in range(n)) if v is not None]
    off = [v for v in (peak_at(g['t0'] + (k + 0.5) * period) for k in range(n)) if v is not None]
    lock = float(np.mean(on) / max(1e-6, np.mean(off))) if on and off else 0.0
    g['lock'] = round(lock, 2)
    g['agree'], g['kicks'] = kick_agree(y, bm.SR, g)
    g['trusted'] = is_trusted(g, n)
    return g


def collect(src_root):
    """{ md5: [(mood, Path), …] } over the five folders, in folder order then natural file order"""
    groups = {}
    for mood in MOODS:
        d = src_root / mood
        if not d.is_dir():
            continue
        for p in sorted((x for x in d.iterdir() if x.is_file() and x.suffix.lower() in AUDIO), key=natural):
            groups.setdefault(md5(p), []).append((mood, p))
    return groups


def main():
    sys.stdout.reconfigure(encoding='utf-8')        # (a Windows console is cp1252)
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(DL))
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--reuse', action='append', default=[], help='<folder>/<file>=<existing song id> (the file is a song the repo already has)')
    ap.add_argument('--resume', action='store_true', help='after an interrupted run: keep the c2-*.mp3 files already encoded at the right level')
    ap.add_argument('--retrust', action='store_true', help='recompute grid.trusted from the stored numbers (after changing the rule)')
    ap.add_argument('--regrid', action='store_true')
    ap.add_argument('--only', default='')
    ap.add_argument('--jobs', type=int, default=6)
    a = ap.parse_args()

    doc = json.loads(OUT.read_text(encoding='utf-8'))
    c2 = doc.setdefault('city2', {})
    c2.setdefault('moods', {m: [] for m in MOODS})
    c2.setdefault('sources', {})
    songs = doc['songs']

    if a.retrust:
        for i, sg in songs.items():
            if sg.get('c2'):
                sg['grid']['trusted'] = is_trusted(sg['grid'])
        OUT.write_text(json.dumps(doc, indent=1), encoding='utf-8', newline='\n')
        bad =[i for i, sg in songs.items() if sg.get('c2') and not sg['grid']['trusted']]
        print(f'{len(bad)} not trusted: {", ".join(bad)}')
        return
    if a.regrid:
        ids = [i for i, s in songs.items() if s.get('c2')]
        if a.only:
            ids = [i for i in ids if i in set(a.only.split(','))]
        with ProcessPoolExecutor(a.jobs) as ex:
            for i, g in zip(ids, ex.map(grid_job, [str(MUSIC / f'{i}.mp3') for i in ids])):
                songs[i]['grid'] = g; songs[i]['bpm'] = round(g['bpm'], 1)
                print(f'  {i:18s} {g["bpm"]:8.3f} bpm  t0 {g["t0"]:.3f}  lock {g["lock"]:6.2f}  {"TRUSTED" if g["trusted"] else "NOT TRUSTED"}', flush=True)
        OUT.write_text(json.dumps(doc, indent=1), encoding='utf-8', newline='\n')
        return

    reuse = {}
    for r in a.reuse:
        k, v = r.split('=', 1)
        reuse[k.replace('\\', '/')] = v
    groups = collect(Path(a.src))
    if not groups:
        sys.exit(f'no audio found in {a.src}/{{{",".join(MOODS)}}}')
    todo = []                       # (md5, [(mood, path)], id) — new files to encode
    listed = []                     # (id, mood) pairs to make sure are in the decks
    for h, files in groups.items():
        rel = [f'{m}/{p.name}' for m, p in files]
        if h in c2['sources']:
            sid = c2['sources'][h]['id']
            if not sid:             # skipped on purpose (e.g. a City 1.0 song): never listed
                print(f'  skip {", ".join(rel)}: {c2["sources"][h].get("skipped", "skipped")}')
                continue
        elif any(r in reuse for r in rel):
            sid = reuse[next(r for r in rel if r in reuse)]
            if sid not in songs:
                sys.exit(f'--reuse: no song {sid} in data/mood-music.json')
            if not songs[sid].get('c2'):
                sys.exit(f'--reuse: {sid} is a City 1.0 song; City 2.0 never plays City 1.0 songs')
            c2['sources'][h] = {'id': sid, 'files': rel, 'reused': True}
        else:
            sid = PREFIX + re.sub(r'[^a-z0-9]+', '-', files[0][1].stem.lower()).strip('-')
            if sid in songs or ((MUSIC / f'{sid}.mp3').exists() and not a.resume):
                sys.exit(f'{sid} already exists with other content — rename the file in Downloads (or --resume after an interrupted run)')
            todo.append((h, files, sid))
            c2['sources'][h] = {'id': sid, 'files': rel}
        for m, _ in files:
            listed.append((sid, m))

    print(f'{len(groups)} different files in {sum(len(f) for f in groups.values())} places; {len(todo)} new')
    for h, files, sid in todo:
        print(f'  new  {sid:18s} ← {", ".join(f"{m}/{p.name}" for m, p in files)}')
    shared = [(sid, [m for s, m in listed if s == sid]) for sid in dict.fromkeys(s for s, _ in listed)]
    for sid, ms in shared:
        if len(ms) > 1:
            print(f'  SHARED {sid}: {", ".join(ms)}')
    if a.dry_run:
        return

    results = {}
    for h, files, sid in todo:
        dst = MUSIC / f'{sid}.mp3'
        if a.resume and dst.exists():
            oi, otp, odur = measure(dst)
            if abs(oi - TARGET_LUFS) <= 0.4 and otp <= -1.0 and odur > 30:
                results[sid] = {'srcLoud': round(measure(files[0][1])[0], 1), 'loud': round(oi, 1), 'tp': round(otp, 1), 'dur': round(odur, 2), 'gain': 0}
                print(f'  kept    {sid:18s} {oi:6.1f} LUFS  tp {otp:5.1f}  {odur:6.1f} s (from the interrupted run)', flush=True)
                continue
        results[sid] = level_and_encode(files[0][1], dst)
        r = results[sid]
        print(f'  encoded {sid:18s} {r["srcLoud"]:6.1f} → {r["loud"]:6.1f} LUFS  tp {r["tp"]:5.1f}  {r["dur"]:6.1f} s  {dst.stat().st_size / 1e6:5.2f} MB', flush=True)
    if todo:
        with ProcessPoolExecutor(a.jobs) as ex:
            for (h, files, sid), g in zip(todo, ex.map(grid_job, [str(MUSIC / f'{s}.mp3') for _, _, s in todo])):
                r = results[sid]
                mood = files[0][0]
                songs[sid] = {'mood': mood, 'keeper': True, 'c2': True, 'dur': r['dur'], 'bpm': round(g['bpm'], 1), 'loud': r['loud'],
                              'srcLoud': r['srcLoud'], 'tp': r['tp'], 'grid': g}
                print(f'  grid    {sid:18s} {g["bpm"]:8.3f} bpm  t0 {g["t0"]:.3f}  down {g["down"]}  {"steady" if g["steady"] else "DRIFTS " + str(g["drift"])}  lock {g["lock"]:6.2f}  {"TRUSTED" if g["trusted"] else "NOT TRUSTED"}', flush=True)
    for sid, m in listed:
        if sid not in c2['moods'][m]:
            c2['moods'][m].append(sid)
    OUT.write_text(json.dumps(doc, indent=1), encoding='utf-8', newline='\n')
    print('\nCITY 2.0 DECKS')
    for m in MOODS:
        print(f'  {m:8s} {len(c2["moods"][m]):2d} songs, {sum(songs[i]["dur"] for i in c2["moods"][m]) / 60:5.1f} min')


if __name__ == '__main__':
    main()
