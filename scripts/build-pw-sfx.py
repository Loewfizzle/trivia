"""THE PASSWORD's sound effects (PW2 — docs/password.md "The sounds", docs/audio.md).

The dailies chat's Grok set (Nov 5) sits in ~/Downloads/grok/dailies-sfx/ (01–11 = THE PASSWORD, 12–19 = COAST CLEAR; + credits.txt,
MD5SUMS.txt — every source CC0 or the Sonniss GDC bundle licence: no credit required; the entries are kept anyway). THE PICKS are the
chat's review (CLAUDE-SFX-REVIEW.md — final, the owner): the MAIN file for each except 08 door-unlock = the -b (its clunk keeps its level
on a phone speaker). Gain trims at import: 06 tile-miss −2 dB (never boost it — the steps must read hit > near > miss). The unpicked -b
files are not imported. Copies land in audio/sfx/password/ COMPRESSED: mono, 96 kbps, 44.1 kHz, no metadata (the house rule); the
originals are read only. Run from the repo root:

    python scripts/build-pw-sfx.py [<source dir>]

Needs ffmpeg: on PATH, or the imageio-ffmpeg package (the same one scripts/build-oc-sfx.py uses).
"""
import os, re, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'grok', 'dailies-sfx')
OUT = os.path.join('audio', 'sfx', 'password')
BITRATE = '96k'
# source file → shipped name (+ a gain trim in dB)
PICKS = [
    ('01-key-tap.mp3', '01-key-tap', 0),
    ('02-key-delete.mp3', '02-key-delete', 0),
    ('03-guess-submit.mp3', '03-guess-submit', 0),
    ('04-tile-hit.mp3', '04-tile-hit', 0),
    ('05-tile-near.mp3', '05-tile-near', 0),
    ('06-tile-miss.mp3', '06-tile-miss', -2),
    ('07-not-a-word.mp3', '07-not-a-word', 0),
    ('08-door-unlock-b.mp3', '08-door-unlock', 0),   # (the -b: the main's weight is bass a phone loses)
    ('09-door-open.mp3', '09-door-open', 0),
    ('10-win-sting.mp3', '10-win-sting', 0),
    ('11-fail.mp3', '11-fail', 0),
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
    for src_name, out_name, db in PICKS:
        src, dst = os.path.join(SRC, src_name), os.path.join(OUT, out_name + '.mp3')
        af = ['-af', f'volume={db}dB'] if db else []
        subprocess.run([exe, '-v', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100', *af,
                        '-codec:a', 'libmp3lame', '-b:a', BITRATE, dst], check=True)
        a, b = os.path.getsize(src), os.path.getsize(dst)
        total_in += a
        total_out += b
        print(f'{src_name:24s} -> {out_name + ".mp3":22s} {a / 1024:6.1f} KB -> {b / 1024:5.1f} KB{f"  ({db:+d} dB)" if db else ""}')
    with open(os.path.join(SRC, 'credits.txt'), encoding='utf-8') as f:
        text = f.read()
    with open(os.path.join(OUT, 'credits.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(credits_for(text, {p[0] for p in PICKS}))
    print(f'{len(PICKS)} files: {total_in / 1024:.0f} KB -> {total_out / 1024:.0f} KB  (+ credits.txt)')


if __name__ == '__main__':
    main()
