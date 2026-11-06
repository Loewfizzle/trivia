"""OVERCLOCK's sound effects (OC1 — docs/overclock.md "Assets", docs/audio.md "OVERCLOCK's sounds").

The owner's Grok set (Nov 3) arrives as 33 MP3s in ~/Downloads/grok/overclock-sfx/ (+ credits.txt, MD5SUMS.txt — every source CC0 or the
Sonniss GDC bundle licence: no credit required; credits.txt kept anyway). This copies them into audio/sfx/overclock/ COMPRESSED: mono,
96 kbps, 44.1 kHz, no metadata — and NOT re-normalised (Grok balanced four loudness tiers: headline −11…−12, feedback −13…−15, secondary
−16…−19, UI ticks −21…−29 LUFS; the game mixes under them). 17-winner-fanfare-b.mp3 is NOT imported (the owner picked the main 17, Nov 3).
The originals are read only. Run from the repo root:

    python scripts/build-oc-sfx.py [<source dir>]

Needs ffmpeg: on PATH, or the imageio-ffmpeg package (pip install imageio-ffmpeg — the same one scripts/add-city-sfx.py uses).
"""
import os, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'grok', 'overclock-sfx')
OUT = os.path.join('audio', 'sfx', 'overclock')
SKIP = {'17-winner-fanfare-b.mp3'}   # the rejected backup — the owner picked 17-winner-fanfare.mp3
BITRATE = '96k'


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg  # noqa: E402 — the fallback the city's importer uses too
    return imageio_ffmpeg.get_ffmpeg_exe()


def main():
    if not os.path.isdir(SRC):
        sys.exit(f'no source folder: {SRC}')
    os.makedirs(OUT, exist_ok=True)
    exe = ffmpeg()
    total_in = total_out = 0
    names = sorted(f for f in os.listdir(SRC) if f.endswith('.mp3') and f not in SKIP)
    for name in names:
        src, dst = os.path.join(SRC, name), os.path.join(OUT, name)
        subprocess.run([exe, '-v', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100',
                        '-codec:a', 'libmp3lame', '-b:a', BITRATE, dst], check=True)
        a, b = os.path.getsize(src), os.path.getsize(dst)
        total_in += a
        total_out += b
        print(f'{name:28s} {a / 1024:7.1f} KB -> {b / 1024:6.1f} KB')
    shutil.copyfile(os.path.join(SRC, 'credits.txt'), os.path.join(OUT, 'credits.txt'))
    print(f'{len(names)} files: {total_in / 1024:.0f} KB -> {total_out / 1024:.0f} KB  (+ credits.txt)')


if __name__ == '__main__':
    main()
