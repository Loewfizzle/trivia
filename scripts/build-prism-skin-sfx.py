"""PRISM DROP's SKIN SOUNDS (SKINS 2A — docs/prism.md "THE SKINS" → the sounds; docs/audio.md).

Grok's sourced set sits in ~/Downloads/grok/PrismSkins/ (*.wav + CREDITS.md + SHA256SUMS.txt). THE PICKS = the main file of each of the two
DAY skins' sounds — watercolor-lock · watercolor-clear · paper-lock · paper-clear — every one CC0 1.0 (or CC0 + a generated layer): the only
licences this script lets through are CC0 and CC BY (LICENCES below — anything else is SKIPPED and said so). The -b backups are not imported;
pixel-* / galaxy-* wait for SKINS 2B.

For each pick (the ORIGINALS ARE NEVER TOUCHED — read only, decoded through ffmpeg; its SHA-256 checked against SHA256SUMS.txt first):
  * leading + trailing silence trimmed (below -55 dBFS),
  * its peak set to PEAK_DB (-8 dBFS — ONE stored level; how loud it PLAYS is the game's: js/games/prism/audio.js#SAMPLE_GAIN puts it at
    the level of the code-made voice it replaces — quiet under the song),
  * mono, 44.1 kHz, 96 kbps mp3, no metadata (the house rule) — each must come out <= 30 KB.
Copies land in audio/sfx/prism/ + a CREDITS.md there with each pick's credit line. Run from the repo root:

    python -I scripts/build-prism-skin-sfx.py [<source dir>]

Needs ffmpeg: on PATH, or the imageio-ffmpeg package (the same one scripts/build-pw-sfx.py uses).
"""
import hashlib, os, re, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'grok', 'PrismSkins')
OUT = os.path.join('audio', 'sfx', 'prism')
BITRATE = '96k'
PEAK_DB = -8.0
MAX_BYTES = 30 * 1024
# the pick → (its licence, its credit line) — read from Grok's CREDITS.md on Nov 14 2026 and written out here, so the import never trusts
# the folder's text for what it ships
PICKS = {
    'watercolor-lock': ('CC0 1.0', '"water-drop-01.wav" from "Fantasy Sound Effects (Tinysized SFX)" by Jan Schupke (Vehicle), CC0 1.0 — https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx'),
    'watercolor-clear': ('CC0 1.0', 'a generated brush swish (Neon Speakeasy / Grok) + a drip excerpt from "water-drop-01.wav" by Jan Schupke (Vehicle), CC0 1.0 — https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx'),
    'paper-lock': ('CC0 1.0', '"Paper Sound - 1.wav" from "Various Paper Sound Effects" by Luckius, CC0 1.0 — https://opengameart.org/content/various-paper-sound-effects — with a generated landing thup'),
    'paper-clear': ('CC0 1.0', '"Paper Ripped - 1.wav" from "Various Paper Sound Effects" by Luckius, CC0 1.0 — https://opengameart.org/content/various-paper-sound-effects — with a generated lift whoosh'),
}
LICENCES = ('CC0 1.0', 'CC BY 4.0', 'CC BY 3.0')


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg  # noqa: E402
    return imageio_ffmpeg.get_ffmpeg_exe()


def sums(path):
    out = {}
    if os.path.isfile(path):
        with open(path, encoding='utf-8') as f:
            for line in f:
                m = re.match(r'^([0-9a-f]{64})\s+(\S+)\s*$', line)
                if m:
                    out[m.group(2)] = m.group(1)
    return out


def peak_db(exe, src, af):
    r = subprocess.run([exe, '-hide_banner', '-nostats', '-i', src, '-af', af + ',volumedetect', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.search(r'max_volume:\s*(-?[0-9.]+) dB', r.stderr)
    return float(m.group(1)) if m else None


def main():
    if not os.path.isdir(SRC):
        sys.exit(f'no source folder: {SRC} — the code-made sounds stay')
    os.makedirs(OUT, exist_ok=True)
    exe = ffmpeg()
    known = sums(os.path.join(SRC, 'SHA256SUMS.txt'))
    trim = 'silenceremove=start_periods=1:start_duration=0:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-55dB,areverse'
    done, lines = [], []
    for name, (lic, credit) in PICKS.items():
        src = os.path.join(SRC, name + '.wav')
        if lic not in LICENCES:
            print(f'SKIPPED {name}: licence "{lic}" is not CC0 / CC BY')
            continue
        if not os.path.isfile(src):
            print(f'MISSING {name}.wav — its code-made sound stays')
            continue
        with open(src, 'rb') as f:
            sha = hashlib.sha256(f.read()).hexdigest()
        if name + '.wav' in known and known[name + '.wav'] != sha:
            print(f'SKIPPED {name}: its SHA-256 does not match SHA256SUMS.txt')
            continue
        pk = peak_db(exe, src, trim)
        if pk is None:
            print(f'SKIPPED {name}: could not be read')
            continue
        gain = PEAK_DB - pk
        dst = os.path.join(OUT, name + '.mp3')
        subprocess.run([exe, '-v', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100', '-af', f'{trim},volume={gain:.2f}dB',
                        '-c:a', 'libmp3lame', '-b:a', BITRATE, '-write_xing', '0', '-id3v2_version', '0', dst], check=True)
        size = os.path.getsize(dst)
        if size > MAX_BYTES:
            os.remove(dst)
            print(f'SKIPPED {name}: {size} B > {MAX_BYTES} B')
            continue
        out_pk = peak_db(exe, dst, 'anull')
        r = subprocess.run([exe, '-hide_banner', '-i', dst], capture_output=True, text=True)
        dur = re.search(r'Duration: (\d+):(\d+):([0-9.]+)', r.stderr)
        secs = (int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))) if dur else 0
        done.append(name)
        lines.append(f'- `{name}.mp3` — {credit}. Licence: {lic}.')
        print(f'{name}.mp3  {size} B  {secs:.3f} s  peak {out_pk} dBFS (source peak {pk} dB, gain {gain:+.2f} dB)  sha256 {sha[:12]}')
    with open(os.path.join(OUT, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# PRISM DROP — the skins\' sounds (audio/sfx/prism/)\n\n')
        f.write('Sourced by Grok (Nov 14 2026 — ~/Downloads/grok/PrismSkins/), imported by `scripts/build-prism-skin-sfx.py` (trimmed, peak −8 dBFS, mono\n')
        f.write('44.1 kHz, 96 kbps mp3, no metadata). Every source is CC0 1.0 — no credit is required; the courtesy credits are kept anyway.\n')
        f.write('CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/\n\n')
        f.write('\n'.join(lines) + '\n')
    print(f'{len(done)} of {len(PICKS)} imported -> {OUT}')


if __name__ == '__main__':
    main()
