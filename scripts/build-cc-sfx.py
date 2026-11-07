"""COAST CLEAR's sound effects (CC2 — docs/coastclear.md "The sounds", docs/audio.md).

The dailies chat's Grok set (Nov 5) sits in ~/Downloads/grok/dailies-sfx/ (01–11 = THE PASSWORD — scripts/build-pw-sfx.py; 12–19 = COAST CLEAR;
+ credits.txt, MD5SUMS.txt — every source CC0 or the Sonniss GDC bundle licence: no credit required; the entries are kept anyway). THE PICKS
(the owner, CC2): the MAIN file for each of 12–19 — no -b files. Trims at import (the chat's review, CLAUDE-SFX-REVIEW.md): 16 mode-toggle
+4 dB (crisp but very quiet); 18 caught −5 dB + a low cut ~120 Hz (on headphones it was the loudest file — losing is never louder than
winning). Copies land in audio/sfx/coastclear/ COMPRESSED: mono, 96 kbps, 44.1 kHz, no metadata (the house rule); the originals are read
only. Run from the repo root:

    python scripts/build-cc-sfx.py [<source dir>]

Needs ffmpeg: on PATH, or the imageio-ffmpeg package (the same one scripts/build-pw-sfx.py uses).
"""
import os, re, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'grok', 'dailies-sfx')
OUT = os.path.join('audio', 'sfx', 'coastclear')
BITRATE = '96k'
# source file → shipped name, the ffmpeg audio filter (None = as it is)
PICKS = [
    ('12-dig.mp3', '12-dig', None),
    ('13-open-area.mp3', '13-open-area', None),
    ('14-buoy-place.mp3', '14-buoy-place', None),
    ('15-buoy-remove.mp3', '15-buoy-remove', None),
    ('16-mode-toggle.mp3', '16-mode-toggle', 'volume=4dB'),
    ('17-spotted.mp3', '17-spotted', None),
    ('18-caught.mp3', '18-caught', 'highpass=f=120:poles=2,volume=-5dB'),
    ('19-coast-clear-win.mp3', '19-coast-clear-win', None),
]


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg  # noqa: E402
    return imageio_ffmpeg.get_ffmpeg_exe()


def credits_for(text, names):
    """the entries of the imported files (each starts with its file name on a line of its own, ends before the next) + the header"""
    parts = re.split(r'(?m)^(?=\d\d-[a-z0-9-]+\.mp3\s*$)', text)
    head = parts[0].rstrip() + '\n\n'
    keep = [p for p in parts[1:] if p.split('\n', 1)[0].strip() in names]
    return head + '\n'.join(p.rstrip() + '\n' for p in keep)


def main():
    if not os.path.isdir(SRC):
        sys.exit(f'no source folder: {SRC}')
    os.makedirs(OUT, exist_ok=True)
    exe = ffmpeg()
    total_in = total_out = 0
    for src_name, out_name, af in PICKS:
        src, dst = os.path.join(SRC, src_name), os.path.join(OUT, out_name + '.mp3')
        filt = ['-af', af] if af else []
        subprocess.run([exe, '-v', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100', *filt,
                        '-codec:a', 'libmp3lame', '-b:a', BITRATE, dst], check=True)
        a, b = os.path.getsize(src), os.path.getsize(dst)
        total_in += a
        total_out += b
        print(f'{src_name:26s} -> {out_name + ".mp3":24s} {a / 1024:6.1f} KB -> {b / 1024:5.1f} KB{f"  ({af})" if af else ""}')
    with open(os.path.join(SRC, 'credits.txt'), encoding='utf-8') as f:
        text = f.read()
    with open(os.path.join(OUT, 'credits.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(credits_for(text, {p[0] for p in PICKS}))
    print(f'{len(PICKS)} files: {total_in / 1024:.0f} KB -> {total_out / 1024:.0f} KB  (+ credits.txt)')


if __name__ == '__main__':
    main()
